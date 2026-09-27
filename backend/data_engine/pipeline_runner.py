"""
Master Data Engineering Pipeline Runner
Executes the end-to-end data cleaning, normalization, synthesis,
feature store construction, and data quality audit.
"""
import os
import sys
import time

from backend.data_engine.data_cleaner import (
    load_and_audit_raw_data,
    clean_and_standardize_customers
)
from backend.data_engine.claims_synthesizer import synthesize_claims_knowledge_base
from backend.data_engine.normalizer import persist_relational_database
from backend.data_engine.feature_store import build_ml_feature_matrix
from backend.data_engine.data_quality_auditor import run_data_quality_audit

def run_data_engineering_pipeline():
    print("=" * 70)
    print("[PIPELINE] STARTING INDUSTRY-GRADE DATA ENGINEERING PIPELINE")
    print("=" * 70)
    start_time = time.time()

    # Step 1: Ingestion & Raw Audit
    df_raw, audit_raw = load_and_audit_raw_data()

    # Step 2: Cleaning & Standardization
    df_customers = clean_and_standardize_customers(df_raw)

    # Step 3: Linked Claims Knowledge Base Synthesis
    df_policies, df_claims = synthesize_claims_knowledge_base(
        df_customers,
        target_claims_count=1500,
        anomaly_ratio=0.12,
        seed=42
    )

    # Step 4: Relational Normalization & SQLite Persistence
    db_path = persist_relational_database(df_customers, df_policies, df_claims)

    # Step 5: Feature Store & Scaler Matrix Generation
    X_scaled, y_anomaly, feature_meta = build_ml_feature_matrix(
        df_claims, df_customers, df_policies
    )

    # Step 6: Enterprise Data Quality Audit & Documentation
    quality_report = run_data_quality_audit(df_customers, df_policies, df_claims)

    elapsed = time.time() - start_time
    print("=" * 70)
    print(f"[PIPELINE] COMPLETED IN {elapsed:.2f}s")
    print(f"  - Database: {db_path}")
    print(f"  - Quality Audit: {quality_report['overall_status']} ({quality_report['passed_count']}/{quality_report['total_assertions']} passed)")
    print("=" * 70)

    return {
        "status": "SUCCESS",
        "elapsed_seconds": elapsed,
        "database_path": db_path,
        "records": {
            "customers": len(df_customers),
            "policies": len(df_policies),
            "claims": len(df_claims)
        },
        "quality_audit": quality_report
    }

if __name__ == "__main__":
    run_data_engineering_pipeline()
