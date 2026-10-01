"""
Relational Data Normalizer & SQLite Storage Engine
Constructs 3NF / Star Schema database in data/processed/claims_intelligence.db
Creates optimized relational tables, indexes, views, and flat CSV exports.
"""
import os
import sqlite3
import pandas as pd
from typing import Tuple

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")
SQLITE_DB_PATH = os.path.join(PROCESSED_DIR, "claims_intelligence.db")

def persist_relational_database(
    df_customers: pd.DataFrame,
    df_policies: pd.DataFrame,
    df_claims: pd.DataFrame,
    db_path: str = SQLITE_DB_PATH
) -> str:
    """
    Persists normalized tables into SQLite with primary keys, indexes, and full views.
    Also exports standardized CSV copies for portability.
    """
    print(f"[NORMALIZER] Building relational database at: {db_path}...")
    
    # 1. Export Clean Flat CSVs
    cust_csv = os.path.join(PROCESSED_DIR, "customers_clean.csv")
    pol_csv = os.path.join(PROCESSED_DIR, "policies_clean.csv")
    clm_csv = os.path.join(PROCESSED_DIR, "claims_clean.csv")

    df_customers.to_csv(cust_csv, index=False)
    df_policies.to_csv(pol_csv, index=False)
    df_claims.to_csv(clm_csv, index=False)
    print(f"[NORMALIZER] Exported CSVs: customers ({len(df_customers)}), policies ({len(df_policies)}), claims ({len(df_claims)})")

    # 2. Write to SQLite
    if os.path.exists(db_path):
        os.remove(db_path)

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Enable Foreign Keys & Performance Pragmas
    cursor.execute("PRAGMA foreign_keys = ON;")
    cursor.execute("PRAGMA journal_mode = WAL;")
    cursor.execute("PRAGMA synchronous = NORMAL;")

    # Ingest DataFrames into SQLite tables
    df_customers.to_sql("dim_customers", conn, if_exists="replace", index=False)
    df_policies.to_sql("dim_policies", conn, if_exists="replace", index=False)
    df_claims.to_sql("fact_claims", conn, if_exists="replace", index=False)

    # 3. Create Indexes for High-Speed Querying & Joins
    print("[NORMALIZER] Creating database indexes...")
    index_statements = [
        "CREATE INDEX idx_cust_pk ON dim_customers (customer_id);",
        "CREATE INDEX idx_cust_subtype ON dim_customers (MOSTYPE);",
        "CREATE INDEX idx_cust_cluster ON dim_customers (household_cluster_signature);",
        "CREATE INDEX idx_pol_pk ON dim_policies (policy_id);",
        "CREATE INDEX idx_pol_cust_fk ON dim_policies (customer_id);",
        "CREATE INDEX idx_pol_line ON dim_policies (policy_line);",
        "CREATE INDEX idx_claim_pk ON fact_claims (claim_id);",
        "CREATE INDEX idx_claim_cust_fk ON fact_claims (customer_id);",
        "CREATE INDEX idx_claim_pol_fk ON fact_claims (policy_id);",
        "CREATE INDEX idx_claim_line ON fact_claims (policy_line);",
        "CREATE INDEX idx_claim_status ON fact_claims (claim_status);",
        "CREATE INDEX idx_claim_anomaly ON fact_claims (is_anomaly_ground_truth);"
    ]

    for stmt in index_statements:
        try:
            cursor.execute(stmt)
        except Exception as e:
            print(f"Index creation note: {e}")

    # 4. Create 360-Degree Analytical View for Insurance Reviewers
    create_view_sql = """
    CREATE VIEW v_claims_full_dossier AS
    SELECT 
        c.claim_id,
        c.claim_status,
        c.risk_label,
        c.is_anomaly_ground_truth,
        c.anomaly_reasons,
        c.incident_date,
        c.filing_date,
        c.filing_delay_days,
        c.policy_line,
        c.incident_type,
        c.incident_severity,
        c.claim_amount_usd,
        c.coverage_limit_usd,
        c.claim_to_limit_ratio,
        c.claim_to_premium_ratio,
        c.days_since_inception,
        c.recent_coverage_increase,
        c.prior_claims_24m,
        c.linked_claims_90d,
        c.event_group_id,
        c.incident_narrative,
        c.adjuster_notes,
        p.policy_id,
        p.annual_premium_usd,
        p.contribution_tier,
        p.policy_inception_date,
        p.coverage_change_date,
        cust.customer_id,
        cust.customer_subtype_name,
        cust.customer_main_type_name,
        cust.age_group_desc,
        cust.household_size,
        cust.number_of_houses,
        cust.purchasing_power_tier,
        cust.est_annual_insurance_spend_usd,
        cust.total_active_policies_count,
        cust.household_cluster_signature
    FROM fact_claims c
    JOIN dim_policies p ON c.policy_id = p.policy_id
    JOIN dim_customers cust ON c.customer_id = cust.customer_id;
    """
    cursor.execute(create_view_sql)
    conn.commit()
    conn.close()

    print(f"[NORMALIZER] SQLite relational store successfully finalized with view 'v_claims_full_dossier'.")
    return db_path
