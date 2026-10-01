"""
Master Analytics Training Pipeline Runner
==========================================
Trains all 4 ensemble layers, runs stability checks,
batch-scores all claims, and generates the analytics report.

Usage:
    python scripts/train_analytics_pipeline.py
"""
import os
import sys
import json
import time
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODELS_DIR    = os.path.join(BASE_DIR, "data", "models")
PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")
DOCS_DIR      = os.path.join(BASE_DIR, "docs")
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(DOCS_DIR, exist_ok=True)

from backend.analytics.xgboost_classifier   import (
    train_xgboost, compute_shap_explanations, save_xgboost_model
)
from backend.analytics.triage_features import (
    load_claims_frame, build_training_matrix, save_baselines
)
from backend.analytics.random_forest_validator import (
    train_random_forest, check_model_stability, save_rf_model
)
from backend.analytics.isolation_forest import (
    train_isolation_forest, save_if_model
)
from backend.analytics.ensemble_scorer import (
    EnsembleRiskScorer, score_all_claims_batch
)


def run_analytics_pipeline():
    print("=" * 70)
    print("[ANALYTICS] TASK 2 — 4-LAYER ENSEMBLE ANOMALY DETECTION PIPELINE")
    print("=" * 70)
    start = time.time()

    # ── Step 1: Build within-line pattern matrix ─────────────────────────
    print("\n[STEP 1] Building pattern features and within-line severity baselines...")
    claims = load_claims_frame()
    X, y, claim_ids, baselines = build_training_matrix(claims)
    save_baselines(baselines)
    np.savez_compressed(
        os.path.join(PROCESSED_DIR, "ml_feature_matrix.npz"),
        X_scaled=X,
        y_anomaly=y,
        claim_ids=claim_ids,
    )
    print(f"  Feature matrix: {X.shape} | Anomaly labels: {int(y.sum())} positive / {int((y==0).sum())} negative")

    # ── Step 2: Train XGBoost (primary) ──────────────────────────────────
    print("\n[STEP 2] Training XGBoost primary classifier...")
    groups = claims["customer_id"].astype(str).to_numpy()
    xgb_model, xgb_metrics = train_xgboost(X, y, groups=groups)
    save_xgboost_model(xgb_model, xgb_metrics)

    # ── Step 3: Train Random Forest (calibration validator) ──────────────
    print("\n[STEP 3] Training Random Forest calibration validator...")
    rf_model, rf_metrics = train_random_forest(X, y)
    save_rf_model(rf_model, rf_metrics)

    # ── Step 4: Stability check ───────────────────────────────────────────
    stability = check_model_stability(
        xgb_cv_auc=xgb_metrics["cv_roc_auc"],
        rf_cv_auc=rf_metrics["cv_mean_auc"]
    )
    print(f"\n[STEP 4] Model Stability Check: {stability['stability_check']}")
    print(f"  XGBoost CV AUC: {stability['xgb_cv_auc']} | RF CV AUC: {stability['rf_cv_auc']} | Gap: {stability['gap']}")
    print(f"  {stability['recommendation']}")

    # ── Step 5: Train Isolation Forest (novel anomaly catcher) ───────────
    print("\n[STEP 5] Training Isolation Forest novel anomaly detector...")
    if_model, if_metrics = train_isolation_forest(X, y)
    save_if_model(if_model, if_metrics)

    # ── Step 6: SHAP explanations for top-20 highest risk claims ─────────
    print("\n[STEP 6] Computing SHAP explanations for top-20 high-risk claims...")
    shap_explanations = compute_shap_explanations(xgb_model, X, claim_ids, top_n=20)
    shap_path = os.path.join(MODELS_DIR, "shap_top20_explanations.json")
    with open(shap_path, "w") as f:
        json.dump(shap_explanations, f, indent=2)
    print(f"  SHAP explanations saved -> {shap_path}")

    # ── Step 7: Load scaler metadata and build ensemble scorer ───────────
    print("\n[STEP 7] Building triage scorer (65% severity + 35% pattern)...")
    scorer = EnsembleRiskScorer(xgb_model, rf_model, if_model, baselines)

    # ── Step 8: Batch score all 1,500 claims ─────────────────────────────
    print("\n[STEP 8] Batch scoring all claims with 4-layer ensemble...")
    df_scores = score_all_claims_batch(scorer)

    triage_dist = df_scores["risk_level"].value_counts().to_dict()
    gt_high     = df_scores[df_scores["is_anomaly_gt"] == 1]["risk_level"].value_counts().to_dict()
    triage_quality = _triage_quality(df_scores)

    # ── Step 9: Generate analytics report ────────────────────────────────
    elapsed = time.time() - start
    report = {
        "pipeline": "Task 2 — 4-Layer Ensemble Anomaly Detection",
        "elapsed_sec": round(elapsed, 2),
        "models": {
            "xgboost": {
                "cv_mean_auc": xgb_metrics["cv_roc_auc"],
                "cv_std":      xgb_metrics["cv_std_auc"],
                "cv_pr_auc":   xgb_metrics["cv_pr_auc"],
                "f1":          xgb_metrics["f1_score"],
                "precision":   xgb_metrics["precision"],
                "recall":      xgb_metrics["recall"],
            },
            "random_forest": {
                "cv_mean_auc": rf_metrics["cv_mean_auc"],
                "train_auc":   rf_metrics["train_auc"],
                "f1":          rf_metrics["f1_score"],
                "top_features": list(rf_metrics["feature_importances"].items())[:3],
            },
            "isolation_forest": {
                "roc_auc":          if_metrics["roc_auc"],
                "avg_precision":    if_metrics["avg_precision"],
                "flagged_anomaly":  if_metrics["flagged_as_anomaly"],
            }
        },
        "stability_check":      stability,
        "triage_distribution":  triage_dist,
        "gt_anomaly_triage":    gt_high,
        "triage_quality":       triage_quality,
        "ensemble_weights": {
            "severity": "65%",
            "xgboost_pattern": "35%",
            "random_forest": "validator only",
            "isolation_forest": "outlier flag only"
        }
    }

    report_path = os.path.join(DOCS_DIR, "ANALYTICS_REPORT.json")
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)

    # Markdown summary
    _write_analytics_markdown(report, df_scores)

    print(f"\n{'='*70}")
    print(f"[ANALYTICS] PIPELINE COMPLETE IN {elapsed:.2f}s")
    print(f"  XGBoost CV AUC : {xgb_metrics['cv_roc_auc']} +/- {xgb_metrics['cv_std_auc']}")
    print(f"  RF CV AUC      : {rf_metrics['cv_mean_auc']}")
    print(f"  IF ROC-AUC     : {if_metrics['roc_auc']}")
    print(f"  Stability      : {stability['stability_check']}")
    print(f"  Triage dist    : {triage_dist}")
    print(f"  Triage quality : {triage_quality}")
    print(f"{'='*70}")
    return scorer, report


def _triage_quality(df_scores) -> dict:
    """High-tier recall on planted anomalies, and ordinal agreement with the severity rubric."""
    order = {"Low": 0, "Medium": 1, "High": 2}
    anomalies = df_scores[df_scores["is_anomaly_gt"] == 1]
    high_recall = float((anomalies["risk_level"] == "High").mean()) if len(anomalies) else 0.0
    not_low = float((anomalies["risk_level"] != "Low").mean()) if len(anomalies) else 0.0
    fast_track = df_scores[df_scores["risk_level"] == "Low"]
    low_precision = float((fast_track["rubric_tier"] == "Low").mean()) if len(fast_track) else 0.0

    y_true = df_scores["rubric_tier"].map(order).to_numpy()
    y_pred = df_scores["risk_level"].map(order).to_numpy()
    classes = [0, 1, 2]
    weights = np.array([[(i - j) ** 2 for j in classes] for i in classes], dtype=float)
    hist_true = np.array([(y_true == c).sum() for c in classes], dtype=float)
    hist_pred = np.array([(y_pred == c).sum() for c in classes], dtype=float)
    expected = np.outer(hist_true, hist_pred) / max(len(y_true), 1)
    observed = np.zeros((3, 3), dtype=float)
    for a, b in zip(y_true, y_pred):
        observed[int(a), int(b)] += 1
    denom = (expected * weights).sum()
    kappa = 1.0 - ((observed * weights).sum() / denom) if denom else 1.0
    return {
        "anomaly_high_recall": round(high_recall, 4),
        "anomaly_not_low_recall": round(not_low, 4),
        "low_tier_precision_vs_rubric": round(low_precision, 4),
        "quadratic_weighted_kappa": round(float(kappa), 4),
    }


def _write_analytics_markdown(report: dict, df_scores):
    """Writes human-readable analytics summary to docs/."""
    xgb = report["models"]["xgboost"]
    rf  = report["models"]["random_forest"]
    ifo = report["models"]["isolation_forest"]
    st  = report["stability_check"]
    td  = report["triage_distribution"]

    lines = [
        "# Task 2 — Triage Score Report",
        "",
        "The displayed 0–100 tier is `0.65 * within-line severity + 0.35 * XGBoost anomaly probability`.",
        "Severity compares the loss with other claims on the same policy line. XGBoost still predicts planted anomalies.",
        "",
        "| Layer | Role | Weight | CV AUC | F1 Score |",
        "| :--- | :--- | :--- | :--- | :--- |",
        f"| Within-line severity | Tier driver | 65% | n/a (rule) | n/a |",
        f"| XGBoost pattern | Anomaly probability | 35% | {xgb['cv_mean_auc']} ± {xgb['cv_std']} | {xgb['f1']} |",
        f"| Random Forest | Validator only | 0% | {rf['cv_mean_auc']} | {rf['f1']} |",
        f"| Isolation Forest | Outlier flag only | 0% | {ifo['roc_auc']} (ROC) | N/A |",
        "",
        "## Model Stability",
        "",
        f"- **XGBoost CV AUC**: `{xgb['cv_mean_auc']}` | **RF CV AUC**: `{rf['cv_mean_auc']}`",
        f"- **AUC Gap**: `{st['gap']}` | **Status**: `{st['stability_check']}`",
        f"- {st['recommendation']}",
        "",
        "## Claim Triage Distribution",
        "",
        "| Triage Level | Count | Action |",
        "| :--- | :--- | :--- |",
        f"| High Risk | {td.get('High', 0)} | Priority Manual Investigation / SIU Referral |",
        f"| Medium Risk | {td.get('Medium', 0)} | Standard Adjuster Review |",
        f"| Low Risk | {td.get('Low', 0)} | Fast-Track Approval |",
        "",
        "## Ground Truth Anomaly Recovery",
        "",
        f"Planted anomalies by displayed tier: {report['gt_anomaly_triage']}",
        "",
        "## Triage quality",
        "",
        f"- Anomaly claims placed in High: `{report['triage_quality']['anomaly_high_recall']}`",
        f"- Anomaly claims kept out of Low: `{report['triage_quality']['anomaly_not_low_recall']}`",
        f"- Low-tier claims that the severity rubric also calls Low: `{report['triage_quality']['low_tier_precision_vs_rubric']}`",
        f"- Quadratic weighted kappa vs severity rubric: `{report['triage_quality']['quadratic_weighted_kappa']}`",
        "",
        "## SHAP Explainability",
        "",
        "Every claim scoring request returns a SHAP factor breakdown for the pattern model.",
        "Those factors explain the anomaly probability. The severity half is the within-line amount and limit share.",
    ]

    md_path = os.path.join(DOCS_DIR, "ANALYTICS_REPORT.md")
    with open(md_path, "w") as f:
        f.write("\n".join(lines))
    print(f"[ANALYTICS] Markdown report saved -> {md_path}")


if __name__ == "__main__":
    run_analytics_pipeline()
