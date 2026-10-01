# Insurance Claims Intelligence — Data Engineering & Normalization Report

**Audit Status**: `PASSED` | **Passed Checks**: `11/11`
**Timestamp**: `2026-09-29T21:34:11.866909`

---

## 1. Relational Schema Architecture (Star Schema)

| Table Name | Entity Type | Row Count | Primary Key | Key Foreign Keys |
| :--- | :--- | :--- | :--- | :--- |
| `dim_customers` | Dimension | 9,822 | `customer_id` | N/A |
| `dim_policies` | Dimension | 15,546 | `policy_id` | `customer_id` |
| `fact_claims` | Fact | 1,500 | `claim_id` | `customer_id`, `policy_id` |

---

## 2. Data Engineering & Transformation Highlights

1. **Raw Ingestion & Profiling**: Unified 5,822 training records and 4,000 test records from COIL 2000 into a master customer pool (9,822 total).
2. **Dictionary Decoding**: Mapped all 41 customer subtypes (L0), 6 age categories (L1), 10 main types (L2), and 9 contribution tiers (L4) into human-readable semantic descriptors.
3. **Financial Value Normalization**: Converted contribution codes (0–9) into estimated USD premium ranges to calculate realistic loss ratios and exposure.
4. **Realistic Domain Fact Synthesis**: Created 1,500 domain-grounded insurance claims with realistic narratives, amounts, and statuses tied 1-to-1 to active customer policies.
5. **Controlled Anomaly Benchmarking**: Injected controlled high-risk patterns (staged collision rings, inflated water damage, early inception fires, phantom marine theft) for objective ML evaluation.
6. **Feature Store Scaling**: Prepared scaled numerical matrices using `RobustScaler` (resistant to financial outliers) stored in `ml_feature_matrix.npz`.

---

## 3. Automated Data Quality Assertions

| Test Identifier | Status | Assertion Description & Result |
| :--- | :--- | :--- |
| `dim_customers_pk_uniqueness` | **PASS** | Unique: 9822/9822 |
| `dim_policies_pk_uniqueness` | **PASS** | Unique: 15546/15546 |
| `fact_claims_pk_uniqueness` | **PASS** | Unique: 1500/1500 |
| `fact_claims_completeness` | **PASS** | Total null values: 0 |
| `dim_customers_completeness` | **PASS** | Total null values: 0 |
| `claims_to_customer_fk_integrity` | **PASS** | 100% of claims map to existing customer |
| `claims_to_policy_fk_integrity` | **PASS** | 100% of claims map to existing policy |
| `policies_to_customer_fk_integrity` | **PASS** | 100% of policies map to existing customer |
| `claims_positive_amounts` | **PASS** | All claim amounts are strictly positive |
| `claims_non_negative_delay` | **PASS** | All filing delays are non-negative integers |
| `claims_status_domain_check` | **PASS** | Statuses found: {'Under Investigation', 'Settled', 'Approved', 'Open'} |

---

## 4. Analytical Metrics & Distribution Summary

- **Total Claim Volume**: $60,786,896.46
- **Average Claim Amount**: $40,524.60
- **Claim Range**: $746.19 – $400,000.00
- **Ground Truth Anomalous Claims**: 180 (12.0%)

This data foundation is fully indexed in SQLite (`claims_intelligence.db`) and ready for vectorization and multi-agent ingestion.