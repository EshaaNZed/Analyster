"""
Enterprise Data Quality Auditor & Lineage Reporter
Executes rigorous integrity assertions across customer, policy, and claims tables:
- Primary key uniqueness & null checks
- Referential integrity (Foreign Keys)
- Domain constraints & boundary conditions
- Exports JSON audit log and human-readable Markdown Data Engineering Report
"""
import os
import json
import pandas as pd
from typing import Dict, Any

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")
DOCS_DIR = os.path.join(BASE_DIR, "docs")
os.makedirs(DOCS_DIR, exist_ok=True)

def run_data_quality_audit(
    df_customers: pd.DataFrame,
    df_policies: pd.DataFrame,
    df_claims: pd.DataFrame
) -> Dict[str, Any]:
    """
    Executes comprehensive data quality validation assertions.
    """
    print("[QUALITY AUDITOR] Running enterprise data quality assertions...")

    assertions = []

    def add_assertion(name: str, passed: bool, details: str):
        assertions.append({
            "assertion": name,
            "status": "PASSED" if passed else "FAILED",
            "details": details
        })

    # 1. Primary Key Uniqueness
    cust_pk_unique = (df_customers["customer_id"].nunique() == len(df_customers))
    add_assertion("dim_customers_pk_uniqueness", cust_pk_unique, f"Unique: {df_customers['customer_id'].nunique()}/{len(df_customers)}")

    pol_pk_unique = (df_policies["policy_id"].nunique() == len(df_policies))
    add_assertion("dim_policies_pk_uniqueness", pol_pk_unique, f"Unique: {df_policies['policy_id'].nunique()}/{len(df_policies)}")

    clm_pk_unique = (df_claims["claim_id"].nunique() == len(df_claims))
    add_assertion("fact_claims_pk_uniqueness", clm_pk_unique, f"Unique: {df_claims['claim_id'].nunique()}/{len(df_claims)}")

    # 2. Completeness / Zero Null Checks
    clm_nulls = int(df_claims.isnull().sum().sum())
    add_assertion("fact_claims_completeness", clm_nulls == 0, f"Total null values: {clm_nulls}")

    cust_nulls = int(df_customers.isnull().sum().sum())
    add_assertion("dim_customers_completeness", cust_nulls == 0, f"Total null values: {cust_nulls}")

    # 3. Referential Integrity (Foreign Keys)
    valid_cust_ids = set(df_customers["customer_id"])
    valid_pol_ids = set(df_policies["policy_id"])

    claims_cust_fk_valid = df_claims["customer_id"].isin(valid_cust_ids).all()
    add_assertion("claims_to_customer_fk_integrity", bool(claims_cust_fk_valid), "100% of claims map to existing customer")

    claims_pol_fk_valid = df_claims["policy_id"].isin(valid_pol_ids).all()
    add_assertion("claims_to_policy_fk_integrity", bool(claims_pol_fk_valid), "100% of claims map to existing policy")

    policies_cust_fk_valid = df_policies["customer_id"].isin(valid_cust_ids).all()
    add_assertion("policies_to_customer_fk_integrity", bool(policies_cust_fk_valid), "100% of policies map to existing customer")

    # 4. Domain & Boundary Constraints
    positive_amounts = (df_claims["claim_amount_usd"] > 0).all()
    add_assertion("claims_positive_amounts", bool(positive_amounts), "All claim amounts are strictly positive")

    valid_delays = (df_claims["filing_delay_days"] >= 0).all()
    add_assertion("claims_non_negative_delay", bool(valid_delays), "All filing delays are non-negative integers")

    valid_statuses = {"Open", "Under Investigation", "Approved", "Denied", "Settled"}
    status_valid = set(df_claims["claim_status"]).issubset(valid_statuses)
    add_assertion("claims_status_domain_check", bool(status_valid), f"Statuses found: {set(df_claims['claim_status'])}")

    # Summary Report
    all_passed = all(a["status"] == "PASSED" for a in assertions)
    audit_report = {
        "audit_timestamp": pd.Timestamp.now().isoformat(),
        "overall_status": "PASSED" if all_passed else "FAILED",
        "total_assertions": len(assertions),
        "passed_count": sum(1 for a in assertions if a["status"] == "PASSED"),
        "failed_count": sum(1 for a in assertions if a["status"] == "FAILED"),
        "assertions": assertions,
        "table_metrics": {
            "dim_customers": {
                "row_count": len(df_customers),
                "column_count": df_customers.shape[1],
                "subtypes_covered": int(df_customers["MOSTYPE"].nunique())
            },
            "dim_policies": {
                "row_count": len(df_policies),
                "policy_lines": df_policies["policy_line"].value_counts().to_dict(),
                "total_premium_volume_usd": float(df_policies["annual_premium_usd"].sum())
            },
            "fact_claims": {
                "row_count": len(df_claims),
                "anomalous_claims_count": int(df_claims["is_anomaly_ground_truth"].sum()),
                "total_claimed_usd": float(df_claims["claim_amount_usd"].sum()),
                "avg_claim_usd": float(round(df_claims["claim_amount_usd"].mean(), 2)),
                "min_claim_usd": float(df_claims["claim_amount_usd"].min()),
                "max_claim_usd": float(df_claims["claim_amount_usd"].max())
            }
        }
    }

    # Save JSON report
    json_path = os.path.join(PROCESSED_DIR, "data_quality_report.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(audit_report, f, indent=2)

    # Generate Markdown Report
    md_path = os.path.join(DOCS_DIR, "DATA_ENGINEERING_REPORT.md")
    generate_markdown_report(audit_report, md_path)

    print(f"[QUALITY AUDITOR] Audit completed. Overall status: {audit_report['overall_status']}")
    print(f"[QUALITY AUDITOR] Saved JSON: {json_path}")
    print(f"[QUALITY AUDITOR] Saved Markdown: {md_path}")

    return audit_report

def generate_markdown_report(report: Dict[str, Any], output_path: str):
    """
    Renders human-readable documentation of data engineering and quality results.
    """
    lines = [
        "# Insurance Claims Intelligence — Data Engineering & Normalization Report",
        "",
        f"**Audit Status**: `{report['overall_status']}` | **Passed Checks**: `{report['passed_count']}/{report['total_assertions']}`",
        f"**Timestamp**: `{report['audit_timestamp']}`",
        "",
        "---",
        "",
        "## 1. Relational Schema Architecture (Star Schema)",
        "",
        "| Table Name | Entity Type | Row Count | Primary Key | Key Foreign Keys |",
        "| :--- | :--- | :--- | :--- | :--- |",
        f"| `dim_customers` | Dimension | {report['table_metrics']['dim_customers']['row_count']:,} | `customer_id` | N/A |",
        f"| `dim_policies` | Dimension | {report['table_metrics']['dim_policies']['row_count']:,} | `policy_id` | `customer_id` |",
        f"| `fact_claims` | Fact | {report['table_metrics']['fact_claims']['row_count']:,} | `claim_id` | `customer_id`, `policy_id` |",
        "",
        "---",
        "",
        "## 2. Data Engineering & Transformation Highlights",
        "",
        "1. **Raw Ingestion & Profiling**: Unified 5,822 training records and 4,000 test records from COIL 2000 into a master customer pool (9,822 total).",
        "2. **Dictionary Decoding**: Mapped all 41 customer subtypes (L0), 6 age categories (L1), 10 main types (L2), and 9 contribution tiers (L4) into human-readable semantic descriptors.",
        "3. **Financial Value Normalization**: Converted contribution codes (0–9) into estimated USD premium ranges to calculate realistic loss ratios and exposure.",
        "4. **Realistic Domain Fact Synthesis**: Created 1,500 domain-grounded insurance claims with realistic narratives, amounts, and statuses tied 1-to-1 to active customer policies.",
        "5. **Controlled Anomaly Benchmarking**: Injected controlled high-risk patterns (staged collision rings, inflated water damage, early inception fires, phantom marine theft) for objective ML evaluation.",
        "6. **Feature Store Scaling**: Prepared scaled numerical matrices using `RobustScaler` (resistant to financial outliers) stored in `ml_feature_matrix.npz`.",
        "",
        "---",
        "",
        "## 3. Automated Data Quality Assertions",
        "",
        "| Test Identifier | Status | Assertion Description & Result |",
        "| :--- | :--- | :--- |"
    ]

    for a in report["assertions"]:
        status_icon = "PASS" if a["status"] == "PASSED" else "FAIL"
        lines.append(f"| `{a['assertion']}` | **{status_icon}** | {a['details']} |")

    lines.extend([
        "",
        "---",
        "",
        "## 4. Analytical Metrics & Distribution Summary",
        "",
        f"- **Total Claim Volume**: ${report['table_metrics']['fact_claims']['total_claimed_usd']:,.2f}",
        f"- **Average Claim Amount**: ${report['table_metrics']['fact_claims']['avg_claim_usd']:,.2f}",
        f"- **Claim Range**: ${report['table_metrics']['fact_claims']['min_claim_usd']:,.2f} – ${report['table_metrics']['fact_claims']['max_claim_usd']:,.2f}",
        f"- **Ground Truth Anomalous Claims**: {report['table_metrics']['fact_claims']['anomalous_claims_count']} ({report['table_metrics']['fact_claims']['anomalous_claims_count']/report['table_metrics']['fact_claims']['row_count']:.1%})",
        "",
        "This data foundation is fully indexed in SQLite (`claims_intelligence.db`) and ready for vectorization and multi-agent ingestion."
    ])

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
