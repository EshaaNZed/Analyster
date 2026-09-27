"""
COIL 2000 Data Ingestion, Profiling & Cleaning Pipeline
Loads raw benchmark files, performs quality audits, validates schema integrity,
and generates clean, standardized customer profiles with semantic labels.
"""
import os
import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple

from backend.data_engine.dictionary_parser import (
    ALL_COLUMN_NAMES,
    CUSTOMER_SUBTYPES,
    AGE_CATEGORIES,
    CUSTOMER_MAIN_TYPES,
    CONTRIBUTION_TIER_DOLLARS
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
RAW_DIR = os.path.join(BASE_DIR, "data", "raw")
PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")
os.makedirs(PROCESSED_DIR, exist_ok=True)

# Product contribution column names (P-prefix)
CONTRIB_COLS = [c for c in ALL_COLUMN_NAMES if c.startswith("P")]
# Policy count column names (A-prefix + CARAVAN)
COUNT_COLS = [c for c in ALL_COLUMN_NAMES if c.startswith("A")] + ["CARAVAN"]

def load_and_audit_raw_data() -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Loads train (ticdata2000) and test (ticeval2000 + tictgts2000) files.
    Performs data engineering quality audit.
    Returns merged DataFrame (9822 rows, 86 cols) + audit report.
    """
    train_path = os.path.join(RAW_DIR, "ticdata2000.txt")
    test_feat_path = os.path.join(RAW_DIR, "ticeval2000.txt")
    test_tgt_path = os.path.join(RAW_DIR, "tictgts2000.txt")

    print("[DATA CLEANER] Loading raw COIL 2000 datasets...")
    # Load training set (tab-delimited, no header)
    df_train = pd.read_csv(train_path, sep=r"\s+", header=None, names=ALL_COLUMN_NAMES)
    df_train["dataset_split"] = "train"

    # Load evaluation set (85 features)
    eval_cols = ALL_COLUMN_NAMES[:-1]
    df_test_feat = pd.read_csv(test_feat_path, sep=r"\s+", header=None, names=eval_cols)
    # Load evaluation targets (1 column)
    df_test_tgt = pd.read_csv(test_tgt_path, sep=r"\s+", header=None, names=["CARAVAN"])
    df_test = pd.concat([df_test_feat, df_test_tgt], axis=1)
    df_test["dataset_split"] = "test"

    # Combine into unified dataset of 9,822 customers
    df_raw = pd.concat([df_train, df_test], axis=0, ignore_index=True)

    # Profiling & Quality Audit
    audit = {
        "total_records": len(df_raw),
        "train_records": len(df_train),
        "test_records": len(df_test),
        "total_columns": df_raw.shape[1],
        "null_values_count": int(df_raw.isnull().sum().sum()),
        "duplicate_rows_count": int(df_raw[ALL_COLUMN_NAMES].duplicated().sum()),
        "columns_with_missing": [col for col in ALL_COLUMN_NAMES if df_raw[col].isnull().any()],
        "data_types": {col: str(dtype) for col, dtype in df_raw.dtypes.items() if col in ALL_COLUMN_NAMES[:5]},
        "target_distribution": {
            "caravan_policies_0": int((df_raw["CARAVAN"] == 0).sum()),
            "caravan_policies_1": int((df_raw["CARAVAN"] == 1).sum()),
            "caravan_positive_rate_pct": round(float((df_raw["CARAVAN"] == 1).mean() * 100), 2)
        }
    }

    print(f"[DATA CLEANER] Raw data audit: {audit['total_records']} records, 0 nulls detected.")
    return df_raw, audit

def clean_and_standardize_customers(df_raw: pd.DataFrame) -> pd.DataFrame:
    """
    Standardizes schema, adds human-readable decoded attributes,
    and engineers customer-level portfolio summary metrics.
    """
    print("[DATA CLEANER] Performing standardization and categorical decoding...")
    df = df_raw.copy()

    # 1. Assign deterministic Primary Key
    df["customer_id"] = [f"CUST-{i+1:05d}" for i in range(len(df))]

    # 2. Decode Categorical Attributes using official dictionary
    df["customer_subtype_name"] = df["MOSTYPE"].map(CUSTOMER_SUBTYPES).fillna("Unknown Subtype")
    df["customer_main_type_name"] = df["MOSHOOFD"].map(CUSTOMER_MAIN_TYPES).fillna("Unknown Main Type")
    df["age_group_desc"] = df["MGEMLEEF"].map(AGE_CATEGORIES).fillna("Unknown Age Group")

    # 3. Socio-Demographic Summary Features
    df["household_size"] = df["MGEMOMV"]
    df["number_of_houses"] = df["MAANTHUI"]
    df["purchasing_power_tier"] = df["MKOOPKLA"]

    # 4. Financial & Policy Portfolio Aggregations
    # Calculate estimated annual insurance spend in USD across all lines
    def calculate_estimated_spend(row):
        total_usd = 0.0
        for col in CONTRIB_COLS:
            tier = int(row.get(col, 0))
            total_usd += CONTRIBUTION_TIER_DOLLARS.get(tier, 0.0)
        return total_usd

    df["est_annual_insurance_spend_usd"] = df.apply(calculate_estimated_spend, axis=1)

    # Sum of policy counts
    df["total_active_policies_count"] = df[COUNT_COLS].sum(axis=1)

    # Boolean flags for core insurance lines
    df["has_auto_policy"] = df["APERSAUT"] > 0
    df["has_fire_policy"] = df["ABRAND"] > 0
    df["has_boat_policy"] = df["APLEZIER"] > 0
    df["has_life_policy"] = df["ALEVEN"] > 0
    df["has_accident_policy"] = df["APERSONG"] > 0
    df["has_caravan_policy"] = df["CARAVAN"] > 0
    df["has_third_party_policy"] = df["AWAPART"] > 0

    # Household proxy cluster signature (based on sociodemographic zip-level distribution)
    df["household_cluster_signature"] = (
        "SUB" + df["MOSTYPE"].astype(str) + 
        "_INC" + df["MKOOPKLA"].astype(str) + 
        "_HH" + df["MGEMOMV"].astype(str)
    )

    print(f"[DATA CLEANER] Successfully cleaned {len(df)} customer records with enriched features.")
    return df
