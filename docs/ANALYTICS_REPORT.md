# Task 2 — Triage Score Report

The displayed 0–100 tier is `0.65 * within-line severity + 0.35 * XGBoost anomaly probability`.
Severity compares the loss with other claims on the same policy line. XGBoost still predicts planted anomalies.

| Layer | Role | Weight | CV AUC | F1 Score |
| :--- | :--- | :--- | :--- | :--- |
| Within-line severity | Tier driver | 65% | n/a (rule) | n/a |
| XGBoost pattern | Anomaly probability | 35% | 0.8577 ± 0.0207 | 0.51 |
| Random Forest | Validator only | 0% | 0.8652 | 0.4754 |
| Isolation Forest | Outlier flag only | 0% | 0.7084 (ROC) | N/A |

## Model Stability

- **XGBoost CV AUC**: `0.8577` | **RF CV AUC**: `0.8652`
- **AUC Gap**: `0.0075` | **Status**: `STABLE`
- Models are in agreement. XGBoost selected as primary.

## Claim Triage Distribution

| Triage Level | Count | Action |
| :--- | :--- | :--- |
| High Risk | 184 | Priority Manual Investigation / SIU Referral |
| Medium Risk | 483 | Standard Adjuster Review |
| Low Risk | 837 | Fast-Track Approval |

## Ground Truth Anomaly Recovery

Planted anomalies by displayed tier: {'High': 111, 'Medium': 70}

## Triage quality

- Anomaly claims placed in High: `0.6133`
- Anomaly claims kept out of Low: `1.0`
- Low-tier claims that the severity rubric also calls Low: `0.9725`
- Quadratic weighted kappa vs severity rubric: `0.7795`

## SHAP Explainability

Every claim scoring request returns a SHAP factor breakdown for the pattern model.
Those factors explain the anomaly probability. The severity half is the within-line amount and limit share.