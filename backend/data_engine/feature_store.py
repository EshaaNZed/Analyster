"""
Feature Store & Machine Learning Preprocessing Engine
Constructs normalized, scaled feature matrices for training anomaly models
and stores scaler parameters for production inference reproducibility.
"""
import os
import json
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")

from backend.analytics.triage_features import PATTERN_FEATURES, build_training_matrix, save_baselines

FEATURE_NAMES = PATTERN_FEATURES

def build_ml_feature_matrix(
    df_claims: pd.DataFrame,
    df_customers: pd.DataFrame,
    df_policies: pd.DataFrame
) -> Tuple[np.ndarray, np.ndarray, Dict[str, Any]]:
    """
    Transforms claims and customer relational attributes into a clean,
    scaled numerical matrix ready for ML / Isolation Forest training.
    Returns:
    - X_scaled: Scaled feature matrix (N, d)
    - y_anomaly: Ground truth anomaly labels (N,)
    - feature_metadata: JSON-serializable scaler parameters and statistics
    """
    print("[FEATURE STORE] Constructing behavior pattern feature store...")
    del df_customers, df_policies

    X_scaled, y_anomaly, claim_ids, baselines = build_training_matrix(df_claims)
    save_baselines(baselines)
    scaler = baselines["scaler"]

    feature_metadata = {
        "feature_names": FEATURE_NAMES,
        "n_samples": int(X_scaled.shape[0]),
        "n_features": int(X_scaled.shape[1]),
        "center_medians": scaler["center"],
        "scale_iqrs": scaler["scale"],
        "note": "Pattern features exclude claim amount. Severity is scored separately.",
    }

    # Save to disk
    npz_path = os.path.join(PROCESSED_DIR, "ml_feature_matrix.npz")
    np.savez_compressed(
        npz_path,
        X_scaled=X_scaled,
        y_anomaly=y_anomaly,
        claim_ids=claim_ids,
    )

    meta_path = os.path.join(PROCESSED_DIR, "feature_store_metadata.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(feature_metadata, f, indent=2)

    print(f"[FEATURE STORE] Feature matrix saved: shape {X_scaled.shape} -> {npz_path}")
    print(f"[FEATURE STORE] Feature metadata saved -> {meta_path}")

    return X_scaled, y_anomaly, feature_metadata
