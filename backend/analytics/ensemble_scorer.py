"""
Triage score = within-line severity + anomaly pattern
=====================================================
The number on the screen is not the anomaly probability by itself.

  triage = 0.65 * severity + 0.35 * XGBoost anomaly probability
          + late-notice points

Severity (0-100) compares the loss with other claims on the same policy
line and the share of the limit. Late notice is a fixed rule: 0 points
through day 14, then 1 point per day, capped at 46.
Random Forest is a stability check. Isolation Forest flags outliers.
Neither of those two replaces the triage score.

Bands:
  0–39  Low     fast-track
  40–69 Medium  standard review
  70–100 High   priority investigation
"""
import os
import json
import sqlite3
import numpy as np
import pandas as pd
import warnings
from typing import Dict, Any, List, Optional, Tuple

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

from backend.analytics.triage_features import (
    PATTERN_FEATURES,
    FEATURE_DISPLAY_NAMES,
    combine_scores,
    delay_notice_points,
    delay_notice_reason,
    load_baselines,
    pattern_vector,
    severity_score,
    triage_label,
)

FEATURE_NAMES = PATTERN_FEATURES


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

    def __init__(self, xgb_model, rf_model, if_model, baselines: Dict):
        self.xgb = xgb_model
        self.rf  = rf_model
        self.ifo = if_model
        self.baselines = baselines
        self._explainer = None

    def _build_feature_vector(self, claim_data: Dict[str, Any]) -> Tuple[np.ndarray, Dict[str, float]]:
        return pattern_vector(claim_data, self.baselines)

    def score_claim(self, claim_data: Dict[str, Any]) -> Dict[str, Any]:
        """Blend within-line severity with the XGBoost anomaly probability."""
        from backend.analytics.isolation_forest import get_if_score

        X, raw = self._build_feature_vector(claim_data)
        severity = severity_score(claim_data, self.baselines)

        xgb_prob = float(self.xgb.predict_proba(X.reshape(1, -1))[0, 1])
        rf_prob = float(self.rf.predict_proba(X.reshape(1, -1))[0, 1])
        if_prob = get_if_score(self.ifo, X)
        if_outlier = int(self.ifo.predict(X.reshape(1, -1))[0]) == -1

        delay_days = float(claim_data.get("filing_delay_days") or 0)
        notice_points = delay_notice_points(delay_days)
        final_score = combine_scores(severity["severity_score"], xgb_prob, delay_days)
        label = triage_label(final_score)
        reasons = list(severity["reasons"])
        if notice_points:
            reasons.append(delay_notice_reason(delay_days))
        if xgb_prob >= 0.80:
            reasons.append(
                "Anomaly probability is high enough to queue this claim for priority review even when the loss itself is not large."
            )

        return {
            "claim_id":         claim_data.get("claim_id", "UNKNOWN"),
            "risk_score":       final_score,
            "risk_level":       label,
            "triage_action":    _triage_action(label),
            "severity_score":   severity["severity_score"],
            "delay_notice_points": notice_points,
            "rubric_tier":      severity["rubric_tier"],
            "severity_reasons": reasons,
            "ensemble_breakdown": {
                "xgb_score":     int(round(xgb_prob * 100)),
                "xgb_prob":      round(xgb_prob, 4),
                "rf_score":      int(round(rf_prob * 100)),
                "rf_prob":       round(rf_prob, 4),
                "if_score":      int(round(if_prob * 100)),
                "if_prob":       round(if_prob, 4),
                "if_outlier":    if_outlier,
                "severity_score": severity["severity_score"],
                "severity_weight": 0.65,
                "pattern_weight": 0.35,
                "delay_notice_points": notice_points,
                "primary_model": "Severity 65% + XGBoost pattern 35%",
            },
            "rule_flags":       reasons,
            "rule_flags_count": len(reasons),
            "shap_top_factors": self._get_shap_factors(X, raw),
            "model_agreement": {
                "xgb_rf_gap_pts":  abs(int(round(xgb_prob * 100)) - int(round(rf_prob * 100))),
                "agreement":       "STRONG" if abs(xgb_prob - rf_prob) < 0.15 else "DIVERGENT",
            }
        }

    def _get_shap_factors(self, X: np.ndarray, raw: Dict[str, float]) -> List[Dict[str, Any]]:
        """SHAP on the anomaly model. Values explain the pattern probability, not the full tier."""
        try:
            if self._explainer is None:
                import shap
                self._explainer = shap.TreeExplainer(self.xgb)
            shap_vals = self._explainer.shap_values(X.reshape(1, -1))[0]
            factors = [
                {
                    "feature":      FEATURE_NAMES[i],
                    "display_name": FEATURE_DISPLAY_NAMES[FEATURE_NAMES[i]],
                    "raw_value":    round(float(raw[FEATURE_NAMES[i]]), 4),
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
            "severity_score":     scored["severity_score"],
            "rubric_tier":        scored["rubric_tier"],
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
        baselines = load_baselines()
        _default_ensemble_scorer = EnsembleRiskScorer(xgb_model, rf_model, if_model, baselines)
    return _default_ensemble_scorer
