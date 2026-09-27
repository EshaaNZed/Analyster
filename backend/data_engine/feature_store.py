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
from sklearn.preprocessing import StandardScaler, RobustScaler

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")

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
    print("[FEATURE STORE] Constructing ML analytical feature store...")

    # Merge claims with customer and policy attributes
    merged = df_claims.merge(df_customers, on="customer_id", how="left")
    merged = merged.merge(df_policies[["policy_id", "annual_premium_usd"]], on="policy_id", how="left")

    # Compute subtype average claim benchmarks
    subtype_avg_claim = merged.groupby("MOSTYPE")["claim_amount_usd"].transform("mean")
    subtype_claim_ratio_delta = (merged["claim_amount_usd"] - subtype_avg_claim) / (subtype_avg_claim + 1.0)

    # Build raw feature matrix
    df_feat = pd.DataFrame()
    df_feat["log_claim_amount"] = np.log1p(merged["claim_amount_usd"].clip(lower=0))
    df_feat["filing_delay_days"] = merged["filing_delay_days"].astype(float)
    df_feat["claim_to_limit_ratio"] = merged["claim_to_limit_ratio"].astype(float)
    df_feat["claim_to_premium_ratio"] = merged["claim_to_premium_ratio"].clip(upper=500.0).astype(float)
    df_feat["customer_total_policies"] = merged["total_active_policies_count"].astype(float)
    df_feat["log_annual_spend"] = np.log1p(merged["est_annual_insurance_spend_usd"].clip(lower=0))
    df_feat["household_size"] = merged["household_size"].astype(float)
    df_feat["purchasing_power_tier"] = merged["purchasing_power_tier"].astype(float)
    df_feat["subtype_claim_ratio_delta"] = subtype_claim_ratio_delta.astype(float)

    X_raw = df_feat[FEATURE_NAMES].values
    y_anomaly = merged["is_anomaly_ground_truth"].values.astype(int)

    # Apply RobustScaler (uses median and IQR, ideal for financial anomaly detection)
    scaler = RobustScaler()
    X_scaled = scaler.fit_transform(X_raw)

    # Serialize metadata for inference
    feature_metadata = {
        "feature_names": FEATURE_NAMES,
        "n_samples": int(X_scaled.shape[0]),
        "n_features": int(X_scaled.shape[1]),
        "center_medians": [float(m) for m in scaler.center_],
        "scale_iqrs": [float(s) for s in scaler.scale_],
        "raw_summary_stats": {
            col: {
                "mean": float(df_feat[col].mean()),
                "std": float(df_feat[col].std()),
                "min": float(df_feat[col].min()),
                "max": float(df_feat[col].max()),
                "median": float(df_feat[col].median())
            }
            for col in FEATURE_NAMES
        }
    }

    # Save to disk
    npz_path = os.path.join(PROCESSED_DIR, "ml_feature_matrix.npz")
    np.savez_compressed(
        npz_path,
        X_scaled=X_scaled,
        X_raw=X_raw,
        y_anomaly=y_anomaly,
        claim_ids=merged["claim_id"].values
    )

    meta_path = os.path.join(PROCESSED_DIR, "feature_store_metadata.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(feature_metadata, f, indent=2)

    print(f"[FEATURE STORE] Feature matrix saved: shape {X_scaled.shape} -> {npz_path}")
    print(f"[FEATURE STORE] Feature metadata saved -> {meta_path}")

    return X_scaled, y_anomaly, feature_metadata
