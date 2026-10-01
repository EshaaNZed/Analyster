"""
Triage features and within-line severity
=========================================
Shared by training and live scoring so the pattern model and the
severity score see the same inputs.

Pattern model features (anomaly probability):
  filing delay versus the policy line, a recent coverage increase,
  prior claims, linked claims, a loss type that does not match the line,
  and the policy line. Policy age is not a pattern feature.
  Claim amount is not a pattern feature.
  Late filing points are a separate fixed rule, not a model weight.

Severity score (0-100, not a trained model):
  how large the loss is for that policy line, and share of the limit.
"""
import os
import json
import sqlite3
import numpy as np
import pandas as pd
from typing import Any, Dict, List, Tuple

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")
MODELS_DIR = os.path.join(BASE_DIR, "data", "models")
DB_PATH = os.path.join(PROCESSED_DIR, "claims_intelligence.db")
BASELINES_PATH = os.path.join(MODELS_DIR, "triage_baselines.json")

PATTERN_FEATURES = [
    "delay_vs_line_median",
    "prior_claims_24m",
    "linked_claims_90d",
    "loss_type_mismatch",
    "recent_coverage_increase",
    "line_auto",
    "line_fire",
    "line_other",
]

CONTINUOUS_FEATURES = [
    "delay_vs_line_median",
    "prior_claims_24m",
    "linked_claims_90d",
]

BINARY_FEATURES = [
    "loss_type_mismatch",
    "recent_coverage_increase",
    "line_auto",
    "line_fire",
    "line_other",
]

FEATURE_DISPLAY_NAMES = {
    "delay_vs_line_median": "Filing delay vs this policy line",
    "prior_claims_24m": "Prior claims in 24 months",
    "linked_claims_90d": "Linked claims in 90 days",
    "loss_type_mismatch": "Incident does not match policy line",
    "recent_coverage_increase": "Coverage increased in the last 30 days",
    "line_auto": "Auto policy line",
    "line_fire": "Fire policy line",
    "line_other": "Other policy line",
}

SCHEME_FLOOR = 0.80

SEVERITY_WEIGHT = 0.65
PATTERN_WEIGHT = 0.35

# Prompt-notice window. Filed on day 14 or earlier adds nothing.
# Each day after that adds 1 point, capped so a very old filing cannot
# consume the whole score by itself.
NOTICE_WINDOW_DAYS = 14
MAX_DELAY_POINTS = 46

# Words that mean the incident belongs on that policy line.
LINE_KEYWORDS = {
    "Auto": ("vehicle", "collision", "roadside", "converter", "rear-end", "t-bone"),
    "Fire": ("fire", "chimney", "kitchen", "electrical", "grease", "thermal", "water restoration"),
    "Boat": ("marina", "hull", "marine", "boat", "dock"),
    "Caravan": ("hail", "tree", "caravan", "storm"),
    "Private Accident": ("slip", "fall", "laceration", "trauma", "fracture"),
}


def loss_type_mismatch(policy_line: str, incident_type: str) -> bool:
    """True when the incident wording does not belong on this policy line."""
    keywords = LINE_KEYWORDS.get(str(policy_line or ""), None)
    if not keywords:
        return False
    text = str(incident_type or "").lower()
    if not text:
        return False
    return not any(word in text for word in keywords)


def _percentile(value: float, reference: List[float]) -> float:
    if not reference:
        return 0.5
    arr = np.asarray(reference, dtype=float)
    return float(np.searchsorted(arr, value, side="right") / len(arr))


def _line_key(policy_line: str, baselines: Dict[str, Any]) -> str:
    lines = baselines.get("lines", {})
    if policy_line in lines:
        return policy_line
    return "__global__"


def load_claims_frame(db_path: str = DB_PATH) -> pd.DataFrame:
    conn = sqlite3.connect(db_path)
    df = pd.read_sql_query("SELECT * FROM v_claims_full_dossier", conn)
    conn.close()
    return df


def fit_baselines(df: pd.DataFrame) -> Dict[str, Any]:
    """Reference distributions for each policy line, fit on historical claims."""
    lines: Dict[str, Any] = {}
    for line, group in df.groupby(df["policy_line"].fillna("Unknown")):
        lines[str(line)] = {
            "n": int(len(group)),
            "amounts": sorted(float(v) for v in group["claim_amount_usd"].tolist()),
            "delays": sorted(float(v) for v in group["filing_delay_days"].tolist()),
            "median_delay": float(group["filing_delay_days"].median()),
        }
    lines["__global__"] = {
        "n": int(len(df)),
        "amounts": sorted(float(v) for v in df["claim_amount_usd"].tolist()),
        "delays": sorted(float(v) for v in df["filing_delay_days"].tolist()),
        "median_delay": float(df["filing_delay_days"].median()),
    }
    return {
        "lines": lines,
        "feature_names": PATTERN_FEATURES,
        "blend": {"severity": SEVERITY_WEIGHT, "pattern": PATTERN_WEIGHT},
    }


def _limit_ratio(claim: Dict[str, Any]) -> float:
    if claim.get("claim_to_limit_ratio") not in (None, ""):
        return float(claim.get("claim_to_limit_ratio") or 0.0)
    amount = float(claim.get("claim_amount_usd") or 0.0)
    limit = float(claim.get("coverage_limit_usd") or 0.0)
    if limit <= 0:
        return 0.0
    return amount / limit


def claim_context(claim: Dict[str, Any], baselines: Dict[str, Any]) -> Dict[str, Any]:
    """Percentiles and mismatch flag for one claim against saved line baselines."""
    line = str(claim.get("policy_line") or "Unknown")
    ref = baselines["lines"].get(line) or baselines["lines"]["__global__"]
    amount = float(claim.get("claim_amount_usd") or 0.0)
    delay = float(claim.get("filing_delay_days") or 0.0)
    limit_ratio = _limit_ratio(claim)
    amount_pct = _percentile(amount, ref["amounts"])
    delay_pct = _percentile(delay, ref["delays"])
    mismatch = loss_type_mismatch(line, str(claim.get("incident_type") or ""))
    return {
        "policy_line": line,
        "amount": amount,
        "delay": delay,
        "limit_ratio": limit_ratio,
        "amount_percentile": amount_pct,
        "delay_percentile": delay_pct,
        "mismatch": mismatch,
        "line_n": int(ref.get("n") or 0),
    }


def severity_score(claim: Dict[str, Any], baselines: Dict[str, Any]) -> Dict[str, Any]:
    """
    0-100 severity from within-line amount and limit share.
    Filing behavior and line mismatch are left to the pattern model.
    """
    ctx = claim_context(claim, baselines)
    amount_pts = ctx["amount_percentile"] * 70.0
    limit_pts = min(1.0, ctx["limit_ratio"] / 0.85) * 30.0
    score = int(round(min(100.0, amount_pts + limit_pts)))

    reasons: List[str] = []
    line = ctx["policy_line"]
    pct = int(round(ctx["amount_percentile"] * 100))
    reasons.append(
        f"{line} loss of ${ctx['amount']:,.0f} is at the {pct}th percentile of {line} claims (n={ctx['line_n']})."
    )
    reasons.append(
        f"Claim uses {ctx['limit_ratio']:.0%} of the policy limit."
    )
    if ctx["amount_percentile"] >= 0.95 or ctx["limit_ratio"] >= 0.60:
        rubric = "High"
    elif ctx["amount_percentile"] >= 0.75 or ctx["limit_ratio"] >= 0.25:
        rubric = "Medium"
    else:
        rubric = "Low"

    return {
        "severity_score": score,
        "rubric_tier": rubric,
        "reasons": reasons,
        "context": ctx,
    }


def raw_pattern_row(claim: Dict[str, Any], baselines: Dict[str, Any]) -> Dict[str, float]:
    ctx = claim_context(claim, baselines)
    line = ctx["policy_line"]
    ref = baselines["lines"].get(line) or baselines["lines"]["__global__"]
    median_delay = float(ref.get("median_delay") or 0.0)
    return {
        "delay_vs_line_median": ctx["delay"] - median_delay,
        "prior_claims_24m": float(claim.get("prior_claims_24m") or 0.0),
        "linked_claims_90d": float(claim.get("linked_claims_90d") or 0.0),
        "loss_type_mismatch": 1.0 if ctx["mismatch"] else 0.0,
        "recent_coverage_increase": float(claim.get("recent_coverage_increase") or 0.0),
        "line_auto": 1.0 if line == "Auto" else 0.0,
        "line_fire": 1.0 if line == "Fire" else 0.0,
        "line_other": 0.0 if line in ("Auto", "Fire") else 1.0,
    }


def fit_scaler(raw_rows: List[Dict[str, float]]) -> Dict[str, Any]:
    mat = np.array([[row[name] for name in CONTINUOUS_FEATURES] for row in raw_rows], dtype=float)
    center = np.median(mat, axis=0)
    q75 = np.percentile(mat, 75, axis=0)
    q25 = np.percentile(mat, 25, axis=0)
    scale = q75 - q25
    scale[scale < 1e-6] = 1.0
    return {
        "continuous_features": CONTINUOUS_FEATURES,
        "center": [float(v) for v in center],
        "scale": [float(v) for v in scale],
    }


def scale_row(raw: Dict[str, float], scaler: Dict[str, Any]) -> np.ndarray:
    center = np.array(scaler["center"], dtype=float)
    scale = np.array(scaler["scale"], dtype=float)
    continuous = np.array([raw[name] for name in CONTINUOUS_FEATURES], dtype=float)
    scaled = (continuous - center) / scale
    binary = np.array([raw[name] for name in BINARY_FEATURES], dtype=float)
    return np.concatenate([scaled, binary])


def pattern_vector(claim: Dict[str, Any], baselines: Dict[str, Any]) -> Tuple[np.ndarray, Dict[str, float]]:
    raw = raw_pattern_row(claim, baselines)
    return scale_row(raw, baselines["scaler"]), raw


def build_training_matrix(df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray, np.ndarray, Dict[str, Any]]:
    baselines = fit_baselines(df)
    raw_rows = []
    for record in df.to_dict(orient="records"):
        raw_rows.append(raw_pattern_row(record, baselines))
    baselines["scaler"] = fit_scaler(raw_rows)
    X = np.vstack([scale_row(row, baselines["scaler"]) for row in raw_rows])
    y = df["is_anomaly_ground_truth"].astype(int).to_numpy()
    claim_ids = df["claim_id"].astype(str).to_numpy()
    return X, y, claim_ids, baselines


def save_baselines(baselines: Dict[str, Any], path: str = BASELINES_PATH) -> str:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(baselines, f)
    return path


def load_baselines(path: str = BASELINES_PATH) -> Dict[str, Any]:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def triage_label(score: int) -> str:
    if score >= 70:
        return "High"
    if score >= 40:
        return "Medium"
    return "Low"


def delay_notice_points(filing_delay_days: float) -> int:
    """Fixed points for filing after the 14-day notice window. Not a model output."""
    try:
        delay = int(round(float(filing_delay_days or 0)))
    except (TypeError, ValueError):
        delay = 0
    if delay <= NOTICE_WINDOW_DAYS:
        return 0
    return min(MAX_DELAY_POINTS, delay - NOTICE_WINDOW_DAYS)


def delay_notice_reason(filing_delay_days: float) -> str:
    points = delay_notice_points(filing_delay_days)
    delay = int(round(float(filing_delay_days or 0)))
    late = delay - NOTICE_WINDOW_DAYS
    return (
        f"Filed {delay} days after the loss, {late} days past the {NOTICE_WINDOW_DAYS}-day notice window. "
        f"That adds {points} points (1 point per late day, capped at {MAX_DELAY_POINTS})."
    )


def combine_scores(severity: int, pattern_probability: float, filing_delay_days: float = 0) -> int:
    blended = (SEVERITY_WEIGHT * float(severity)) + (PATTERN_WEIGHT * float(pattern_probability) * 100.0)
    blended += delay_notice_points(filing_delay_days)
    if float(pattern_probability) >= SCHEME_FLOOR:
        blended = max(blended, 70.0)
    return int(max(0, min(100, round(blended))))
