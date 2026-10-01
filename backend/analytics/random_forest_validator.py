"""
Random Forest Calibration Validator
=====================================
Layer 2 of the 4-layer ensemble.

- Runs alongside XGBoost as an independent stability check
- Uses CalibratedClassifierCV (Platt scaling) for well-calibrated probabilities
- Compares CV-AUC against XGBoost — if gap > 0.08 flags potential XGB overfit
- Provides secondary feature importances for cross-validation of explanations
"""
import os
import json
import pickle
import warnings
import numpy as np
from typing import Dict, Any, Tuple

from sklearn.ensemble import RandomForestClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.metrics import (
    roc_auc_score, precision_score, recall_score, f1_score
)

warnings.filterwarnings("ignore")

BASE_DIR      = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODELS_DIR    = os.path.join(BASE_DIR, "data", "models")
os.makedirs(MODELS_DIR, exist_ok=True)

RF_MODEL_PATH   = os.path.join(MODELS_DIR, "random_forest_calibrated.pkl")
RF_METRICS_PATH = os.path.join(MODELS_DIR, "random_forest_metrics.json")

from backend.analytics.triage_features import PATTERN_FEATURES

FEATURE_NAMES = PATTERN_FEATURES


def train_random_forest(
    X: np.ndarray,
    y: np.ndarray,
    n_cv_folds: int = 5,
    random_state: int = 42,
) -> Tuple[Any, Dict[str, Any]]:
    """
    Trains a calibrated Random Forest classifier with:
      - class_weight='balanced' for imbalance handling
      - CalibratedClassifierCV (isotonic) for reliable probability outputs
      - Stratified 5-fold cross-validation
    """
    print(f"[RF] Training Random Forest calibration validator...")

    base_rf = RandomForestClassifier(
        n_estimators=150,
        max_depth=4,
        min_samples_leaf=8,
        min_samples_split=15,
        max_features="sqrt",
        class_weight="balanced",
        random_state=random_state,
    )

    # Calibrated model — isotonic regression for better probability estimates
    calibrated_rf = CalibratedClassifierCV(base_rf, method="isotonic", cv=3)

    cv = StratifiedKFold(n_splits=n_cv_folds, shuffle=True, random_state=random_state)
    cv_aucs = cross_val_score(base_rf, X, y, cv=cv, scoring="roc_auc")

    print(f"[RF] CV AUC scores: {[round(s, 4) for s in cv_aucs]}")
    print(f"[RF] Mean AUC: {cv_aucs.mean():.4f} (+/- {cv_aucs.std():.4f})")

    # Fit calibrated version on full data
    calibrated_rf.fit(X, y)

    y_pred_proba = calibrated_rf.predict_proba(X)[:, 1]
    y_pred       = (y_pred_proba >= 0.45).astype(int)

    # Extract base model feature importances
    base_rf.fit(X, y)
    feature_importances = {
        fname: round(float(imp), 4)
        for fname, imp in zip(FEATURE_NAMES, base_rf.feature_importances_)
    }
    # Sorted descending
    feature_importances_sorted = dict(
        sorted(feature_importances.items(), key=lambda x: x[1], reverse=True)
    )

    metrics = {
        "model":                 "Random Forest (Calibrated)",
        "cv_auc_scores":         [round(float(s), 4) for s in cv_aucs],
        "cv_mean_auc":           round(float(cv_aucs.mean()), 4),
        "cv_std_auc":            round(float(cv_aucs.std()), 4),
        "train_auc":             round(float(roc_auc_score(y, y_pred_proba)), 4),
        "precision":             round(float(precision_score(y, y_pred, zero_division=0)), 4),
        "recall":                round(float(recall_score(y, y_pred, zero_division=0)), 4),
        "f1_score":              round(float(f1_score(y, y_pred, zero_division=0)), 4),
        "feature_importances":   feature_importances_sorted,
        "calibration_method":    "isotonic",
        "n_train_samples":       len(y),
        "feature_names":         FEATURE_NAMES,
    }

    print(f"[RF] Train AUC: {metrics['train_auc']} | F1: {metrics['f1_score']} | Precision: {metrics['precision']} | Recall: {metrics['recall']}")
    print(f"[RF] Top feature: {list(feature_importances_sorted.keys())[0]} = {list(feature_importances_sorted.values())[0]}")
    return calibrated_rf, metrics


def check_model_stability(xgb_cv_auc: float, rf_cv_auc: float) -> Dict[str, Any]:
    """
    Compares XGBoost and RF cross-validation AUCs.
    If gap > 0.08, raises an overfitting warning for XGBoost.
    """
    gap = abs(xgb_cv_auc - rf_cv_auc)
    stable = gap <= 0.08
    return {
        "xgb_cv_auc":      xgb_cv_auc,
        "rf_cv_auc":       rf_cv_auc,
        "gap":             round(gap, 4),
        "stability_check": "STABLE" if stable else "XGB_OVERFIT_WARNING",
        "recommendation":  (
            "Models are in agreement. XGBoost selected as primary."
            if stable else
            f"AUC gap {gap:.3f} exceeds 0.08 threshold. Consider regularising XGBoost further."
        )
    }


def save_rf_model(model: Any, metrics: Dict[str, Any]):
    with open(RF_MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    with open(RF_METRICS_PATH, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"[RF] Model saved -> {RF_MODEL_PATH}")


def load_rf_model() -> Any:
    with open(RF_MODEL_PATH, "rb") as f:
        return pickle.load(f)
