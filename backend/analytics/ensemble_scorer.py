"""
2-Model Risk & Outlier Scoring Engine + Triage
==============================================
Pure Machine Learning Architecture:
1. Supervised Risk Classification (XGBoost):
   - Calculates fraud probability (0.0 to 1.0) directly from trained gradient boosting trees.
   - Primary Risk Score = int(round(XGBoost Fraud Probability * 100))
   - Direct, transparent 0–100 scale with zero arbitrary rule weights.

2. Unsupervised Anomaly Detection (Isolation Forest):
   - Evaluates multi-dimensional statistical feature eccentricity.
   - Operates independently as an Outlier Detector without distorting the XGBoost risk score.

3. Cross-Validation & Stability (Calibrated Random Forest):
   - Provides probability calibration and model agreement verification.

Final Triage Actions:
  0–39  : Low Risk    — Fast-Track Approval
  40–69 : Medium Risk — Standard Adjuster Review
  70–100: High Risk   — Priority Manual Investigation / SIU Referral
"""
import os
import json
import sqlite3
import numpy as np
import pandas as pd
import warnings
from typing import Dict, Any, List, Optional

warnings.filterwarnings("ignore")

BASE_DIR      = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")
MODELS_DIR    = os.path.join(BASE_DIR, "data", "models")
DB_PATH       = os.path.join(PROCESSED_DIR, "claims_intelligence.db")

# Triage thresholds
TRIAGE_THRESHOLDS = {
    "Low":    (0,  39),
    "Medium": (40, 69),
    "High":   (70, 100),
}

FEATURE_NAMES = [
    "log_claim_amount",
    "filing_delay_days",
    "claim_to_limit_ratio",
    "claim_to_premium_ratio",
    "customer_total_policies",
    "log_annual_spend",
    "household_size",
    "purchasing_power_tier",
    "subtype_claim_ratio_delta"
]


def _triage_label(score: int) -> str:
    if score >= 70:
        return "High"
    elif score >= 40:
        return "Medium"
    return "Low"


def _triage_action(label: str) -> str:
    return {
        "High":   "Priority Manual Investigation — Consider SIU Referral",
        "Medium": "Standard Adjuster Review — Verify Supporting Documentation",
        "Low":    "Fast-Track Approval — Routine Processing",
    }[label]


class EnsembleRiskScorer:
    """
    Production inference engine. Loaded once, used for all claim scoring.
    Evaluates XGBoost supervised fraud risk and Isolation Forest outlier detection.
    """

    def __init__(self, xgb_model, rf_model, if_model, scaler_meta: Dict):
        self.xgb = xgb_model
        self.rf  = rf_model
        self.ifo = if_model
        self.scaler_meta = scaler_meta
        self._explainer = None

    def _build_feature_vector(self, claim_data: Dict[str, Any]) -> np.ndarray:
        """
        Constructs a scaled feature vector from a raw claim dossier dict
        using the RobustScaler parameters saved during Step 2.
        """
        centers = self.scaler_meta["center_medians"]
        scales  = self.scaler_meta["scale_iqrs"]

        raw_feats = [
            np.log1p(max(0.0, float(claim_data.get("claim_amount_usd", 0)))),
            float(claim_data.get("filing_delay_days", 0)),
            float(claim_data.get("claim_to_limit_ratio", 0)),
            min(500.0, float(claim_data.get("claim_to_premium_ratio", 0))),
            float(claim_data.get("total_active_policies_count", 0)),
            np.log1p(max(0.0, float(claim_data.get("est_annual_insurance_spend_usd", 0)))),
            float(claim_data.get("household_size", 3)),
            float(claim_data.get("purchasing_power_tier", 4)),
            0.0,   # subtype_claim_ratio_delta — requires population stats, default 0
        ]

        X_raw    = np.array(raw_feats, dtype=float)
        X_scaled = (X_raw - np.array(centers)) / (np.array(scales) + 1e-9)
        return X_scaled

    def score_claim(self, claim_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculates pure Machine Learning risk score directly from trained XGBoost model (prob * 100),
        alongside Isolation Forest anomaly outlier detection and Random Forest validation.
        """
        from backend.analytics.isolation_forest import get_if_score

        X = self._build_feature_vector(claim_data)

        # 1. XGBoost Supervised Fraud Probability (Direct Primary Risk Score)
        xgb_prob = float(self.xgb.predict_proba(X.reshape(1, -1))[0, 1])

        # 2. Random Forest Validation Probability
        rf_prob = float(self.rf.predict_proba(X.reshape(1, -1))[0, 1])

        # 3. Isolation Forest Unsupervised Anomaly Score
        if_prob = get_if_score(self.ifo, X)

        # Direct, transparent 0-100 score derived from XGBoost probability
        final_score = int(round(xgb_prob * 100))
        final_score = max(0, min(100, final_score))
        triage_label = _triage_label(final_score)
        triage_action = _triage_action(triage_label)

        # SHAP explanations
        shap_factors = self._get_shap_factors(X)

        return {
            "claim_id":         claim_data.get("claim_id", "UNKNOWN"),
            "risk_score":       final_score,
            "risk_level":       triage_label,
            "triage_action":    triage_action,
            "ensemble_breakdown": {
                "xgb_score":     int(round(xgb_prob * 100)),
                "xgb_prob":      round(xgb_prob, 4),
                "rf_score":      int(round(rf_prob * 100)),
                "rf_prob":       round(rf_prob, 4),
                "if_score":      int(round(if_prob * 100)),
                "if_prob":       round(if_prob, 4),
                "primary_model": "XGBoost Classifier",
            },
            "rule_flags":       [],
            "rule_flags_count": 0,
            "shap_top_factors": shap_factors,
            "model_agreement": {
                "xgb_rf_gap_pts":  abs(int(round(xgb_prob * 100)) - int(round(rf_prob * 100))),
                "agreement":       "STRONG" if abs(xgb_prob - rf_prob) < 0.15 else "DIVERGENT",
            }
        }

    def _get_shap_factors(self, X: np.ndarray) -> List[Dict[str, Any]]:
        """Computes SHAP values for this single claim vector."""
        try:
            if self._explainer is None:
                import shap
                self._explainer = shap.TreeExplainer(self.xgb)
            shap_vals = self._explainer.shap_values(X.reshape(1, -1))[0]
            factors = [
                {
                    "feature":      FEATURE_NAMES[i],
                    "shap_value":   round(float(shap_vals[i]), 4),
                    "direction":    "INCREASES_RISK" if shap_vals[i] > 0 else "DECREASES_RISK",
                }
                for i in range(len(FEATURE_NAMES))
            ]
            factors.sort(key=lambda f: abs(f["shap_value"]), reverse=True)
            return factors[:5]
        except Exception:
            return []


def score_all_claims_batch(
    scorer: EnsembleRiskScorer,
    db_path: str = DB_PATH,
) -> pd.DataFrame:
    """
    Scores all claims in a single batch pass.
    Saves results to data/processed/risk_scores.csv
    """
    print("[SCORER] Batch scoring all claims in database with 2-model architecture...")
    conn = sqlite3.connect(db_path)
    df   = pd.read_sql_query("SELECT * FROM v_claims_full_dossier", conn)
    conn.close()

    results = []
    for _, row in df.iterrows():
        claim_dict = row.to_dict()
        scored = scorer.score_claim(claim_dict)
        results.append({
            "claim_id":           row["claim_id"],
            "customer_id":        row["customer_id"],
            "policy_line":        row["policy_line"],
            "claim_amount_usd":   row["claim_amount_usd"],
            "claim_status":       row["claim_status"],
            "risk_score":         scored["risk_score"],
            "risk_level":         scored["risk_level"],
            "triage_action":      scored["triage_action"],
            "xgb_score":          scored["ensemble_breakdown"]["xgb_score"],
            "rf_score":           scored["ensemble_breakdown"]["rf_score"],
            "if_score":           scored["ensemble_breakdown"]["if_score"],
            "xgb_rf_agreement":   scored["model_agreement"]["agreement"],
            "is_anomaly_gt":      row["is_anomaly_ground_truth"],
        })

    df_scores = pd.DataFrame(results)

    output_path = os.path.join(PROCESSED_DIR, "risk_scores.csv")
    df_scores.to_csv(output_path, index=False)

    # Summary
    triage_dist = df_scores["risk_level"].value_counts().to_dict()
    print(f"[SCORER] Scoring complete. Distribution: {triage_dist}")
    print(f"[SCORER] Risk scores saved -> {output_path}")
    return df_scores


# Singleton helper
_default_ensemble_scorer = None

def get_default_scorer() -> EnsembleRiskScorer:
    global _default_ensemble_scorer
    if _default_ensemble_scorer is None:
        from backend.analytics.xgboost_classifier import load_xgboost_model
        from backend.analytics.random_forest_validator import load_rf_model
        from backend.analytics.isolation_forest import load_if_model
        
        xgb_model = load_xgboost_model()
        rf_model = load_rf_model()
        if_model = load_if_model()
        
        meta_path = os.path.join(PROCESSED_DIR, "feature_store_metadata.json")
        with open(meta_path, "r", encoding="utf-8") as f:
            scaler_meta = json.load(f)
            
        _default_ensemble_scorer = EnsembleRiskScorer(xgb_model, rf_model, if_model, scaler_meta)
    return _default_ensemble_scorer
