"""
XGBoost Primary Anomaly Classifier + SHAP Explainer
=====================================================
Layer 1 of the 4-layer ensemble.

- Trains on our 1,500 labelled claims (183 anomalous, 1,317 normal)
- Handles 88/12 class imbalance via scale_pos_weight
- Produces per-claim SHAP factor breakdown for full explainability
- Saves trained model artefacts for production inference
"""
import os
import json
import pickle
import warnings
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple

from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.metrics import (
    roc_auc_score, average_precision_score,
    precision_score, recall_score, f1_score
)

warnings.filterwarnings("ignore")

BASE_DIR      = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")
MODELS_DIR    = os.path.join(BASE_DIR, "data", "models")
os.makedirs(MODELS_DIR, exist_ok=True)

XGB_MODEL_PATH  = os.path.join(MODELS_DIR, "xgboost_anomaly.pkl")
XGB_METRICS_PATH = os.path.join(MODELS_DIR, "xgboost_metrics.json")

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

FEATURE_DISPLAY_NAMES = {
    "log_claim_amount":          "Claim Amount (log-scaled)",
    "filing_delay_days":         "Filing Delay (days)",
    "claim_to_limit_ratio":      "Claim-to-Limit Ratio",
    "claim_to_premium_ratio":    "Claim-to-Premium Ratio",
    "customer_total_policies":   "Total Active Policies",
    "log_annual_spend":          "Annual Insurance Spend (log)",
    "household_size":            "Household Size",
    "purchasing_power_tier":     "Purchasing Power Tier",
    "subtype_claim_ratio_delta": "Deviation from Peer Group Average"
}


def load_feature_matrix() -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Load the pre-scaled feature matrix."""
    npz_path = os.path.join(PROCESSED_DIR, "ml_feature_matrix.npz")
    data = np.load(npz_path, allow_pickle=True)
    return data["X_scaled"], data["y_anomaly"], data["claim_ids"]


def train_xgboost(
    X: np.ndarray,
    y: np.ndarray,
    n_cv_folds: int = 5,
    random_state: int = 42,
) -> Tuple[Any, Dict[str, Any]]:
    """
    Trains a regularized XGBoost classifier:
      - reg_alpha=1.0 (L1), reg_lambda=2.0 (L2), max_depth=3 to prevent overfitting
      - Fast 5-fold Stratified CV for realistic performance estimation
    """
    from xgboost import XGBClassifier

    n_negative = int((y == 0).sum())
    n_positive = int((y == 1).sum())
    scale_pos_weight = n_negative / max(n_positive, 1)

    print(f"[XGB] Dataset: {len(y)} claims ({n_negative} normal, {n_positive} anomalous)")

    model = XGBClassifier(
        n_estimators=150,
        max_depth=3,
        learning_rate=0.05,
        subsample=0.85,
        colsample_bytree=0.85,
        min_child_weight=3,
        gamma=0.3,
        reg_alpha=1.0,     # L1 Lasso penalty on leaf weights
        reg_lambda=2.0,    # L2 Ridge penalty on leaf weights
        eval_metric="auc",
        use_label_encoder=False,
        random_state=random_state,
        n_jobs=-1,
        verbosity=0,
    )

    # 5-fold stratified cross validation
    cv = StratifiedKFold(n_splits=n_cv_folds, shuffle=True, random_state=random_state)
    cv_aucs = cross_val_score(model, X, y, cv=cv, scoring="roc_auc")
    cv_pr_aucs = cross_val_score(model, X, y, cv=cv, scoring="average_precision")

    # Fit final model
    model.fit(X, y)
    y_pred_proba = model.predict_proba(X)[:, 1]
    y_pred = (y_pred_proba >= 0.50).astype(int)

    mean_auc = float(np.mean(cv_aucs))
    mean_pr_auc = float(np.mean(cv_pr_aucs))
    f1 = float(f1_score(y, y_pred, zero_division=0))
    prec = float(precision_score(y, y_pred, zero_division=0))
    rec = float(recall_score(y, y_pred, zero_division=0))

    metrics = {
        "model":             "XGBoost (Regularized + SHAP)",
        "cv_roc_auc":        round(mean_auc, 4),
        "cv_pr_auc":         round(mean_pr_auc, 4),
        "cv_std_auc":        round(float(np.std(cv_aucs)), 4),
        "precision":         round(prec, 4),
        "recall":            round(rec, 4),
        "f1_score":          round(f1, 4),
        "n_train_samples":   len(y),
        "n_anomaly":         n_positive,
        "n_normal":          n_negative,
        "feature_names":     FEATURE_NAMES,
    }

    print(f"[XGB] Cross-Val ROC-AUC: {metrics['cv_roc_auc']} (+/- {metrics['cv_std_auc']}) | PR-AUC: {metrics['cv_pr_auc']}")
    print(f"[XGB] Precision: {metrics['precision']} | Recall: {metrics['recall']} | F1: {metrics['f1_score']}")
    return model, metrics


def compute_shap_explanations(
    model: Any,
    X: np.ndarray,
    claim_ids: np.ndarray,
    top_n: int = 20,
) -> List[Dict[str, Any]]:
    """
    Computes SHAP values for every claim and formats them as
    human-readable factor breakdowns for the UI and agents.
    Returns top_n anomalous claims with full SHAP breakdowns.
    """
    import shap

    print(f"[XGB-SHAP] Computing SHAP values for {len(X)} claims...")
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X)   # shape (N, n_features)

    y_pred_proba = model.predict_proba(X)[:, 1]
    sorted_indices = np.argsort(y_pred_proba)[::-1][:top_n]

    explanations = []
    for idx in sorted_indices:
        cid        = str(claim_ids[idx])
        risk_prob  = float(y_pred_proba[idx])
        shap_row   = shap_values[idx]

        # Build sorted factor list
        factors = []
        for fi, fname in enumerate(FEATURE_NAMES):
            sv = float(shap_row[fi])
            factors.append({
                "feature":       fname,
                "display_name":  FEATURE_DISPLAY_NAMES[fname],
                "raw_value":     float(X[idx, fi]),
                "shap_value":    round(sv, 4),
                "direction":     "INCREASES_RISK" if sv > 0 else "DECREASES_RISK",
            })

        factors.sort(key=lambda f: abs(f["shap_value"]), reverse=True)

        explanations.append({
            "claim_id":        cid,
            "xgb_risk_prob":   round(risk_prob, 4),
            "xgb_risk_score":  int(round(risk_prob * 100)),
            "top_factors":     factors[:5],
            "all_factors":     factors,
            "base_value":      round(float(explainer.expected_value), 4),
        })

    print(f"[XGB-SHAP] SHAP explanations computed for top {top_n} high-risk claims.")
    return explanations


def save_xgboost_model(model: Any, metrics: Dict[str, Any]):
    with open(XGB_MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    with open(XGB_METRICS_PATH, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"[XGB] Model saved -> {XGB_MODEL_PATH}")
    print(f"[XGB] Metrics saved -> {XGB_METRICS_PATH}")


def load_xgboost_model() -> Any:
    with open(XGB_MODEL_PATH, "rb") as f:
        return pickle.load(f)
