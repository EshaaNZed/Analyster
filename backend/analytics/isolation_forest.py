"""
Isolation Forest — Novel Anomaly Pattern Catcher
==================================================
Layer 3 of the 4-layer ensemble.

Catches anomalous claims with patterns NOT seen in the 183 labelled examples.
Runs on the same scaled feature matrix, entirely unsupervised.
Contributes 15% weight to the final ensemble risk score.
"""
import os
import json
import pickle
import warnings
import numpy as np
from typing import Dict, Any, Tuple

from sklearn.ensemble import IsolationForest
from sklearn.metrics import roc_auc_score, average_precision_score

warnings.filterwarnings("ignore")

BASE_DIR      = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODELS_DIR    = os.path.join(BASE_DIR, "data", "models")
IF_MODEL_PATH   = os.path.join(MODELS_DIR, "isolation_forest.pkl")
IF_METRICS_PATH = os.path.join(MODELS_DIR, "isolation_forest_metrics.json")


def train_isolation_forest(
    X: np.ndarray,
    y: np.ndarray,
    contamination: float = 0.12,
    random_state: int = 42,
) -> Tuple[Any, Dict[str, Any]]:
    """
    Trains Isolation Forest unsupervised anomaly detector.
    contamination=0.12 matches our known anomaly ratio.
    """
    print(f"[IF] Training Isolation Forest (contamination={contamination})...")

    model = IsolationForest(
        n_estimators=200,
        max_samples="auto",
        contamination=contamination,
        max_features=1.0,
        bootstrap=False,
        random_state=random_state,
        n_jobs=-1,
    )
    model.fit(X)

    # Raw scores: more negative = more anomalous
    raw_scores  = model.decision_function(X)
    predictions = model.predict(X)   # -1 = anomaly, 1 = normal

    # Normalize to [0,1] probability: invert and scale
    # decision_function returns higher = more normal, so we invert
    if_proba = 1 - (raw_scores - raw_scores.min()) / (raw_scores.max() - raw_scores.min() + 1e-9)

    auc  = round(float(roc_auc_score(y, if_proba)), 4)
    ap   = round(float(average_precision_score(y, if_proba)), 4)
    pred_binary = (predictions == -1).astype(int)

    metrics = {
        "model":             "Isolation Forest",
        "roc_auc":           auc,
        "avg_precision":     ap,
        "contamination":     contamination,
        "n_estimators":      200,
        "flagged_as_anomaly": int(pred_binary.sum()),
        "true_anomaly_count": int(y.sum()),
        "note": "Unsupervised — no labels used during training. AUC uses ground truth for evaluation only."
    }

    print(f"[IF] ROC-AUC: {auc} | Avg Precision: {ap}")
    print(f"[IF] Flagged {pred_binary.sum()} claims as anomalous (true: {y.sum()})")
    return model, metrics


def save_if_model(model: Any, metrics: Dict[str, Any]):
    with open(IF_MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    with open(IF_METRICS_PATH, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"[IF] Model saved -> {IF_MODEL_PATH}")


def load_if_model() -> Any:
    with open(IF_MODEL_PATH, "rb") as f:
        return pickle.load(f)


def get_if_score(model: Any, X_single: np.ndarray) -> float:
    """
    Returns a normalized [0,1] anomaly probability for a single claim feature vector.
    Higher = more anomalous.
    """
    raw = float(model.decision_function(X_single.reshape(1, -1))[0])
    # Clip to reasonable range and invert
    clipped = max(-0.5, min(0.5, raw))
    return round(1.0 - (clipped + 0.5), 4)
