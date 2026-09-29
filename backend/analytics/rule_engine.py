"""
Deterministic Rule Engine — Regulatory Explainability Layer (Updated Brief v2.0)
===================================================================================
Layer 4 of the 4-layer ensemble.

Pure deterministic heuristics that require ZERO ML.
Every factor is completely transparent, auditable, and human-understandable.
Contributes 10% weight to final ensemble score.

These rules mirror real-world SIU (Special Investigation Unit) triage criteria
used by insurance carriers for initial fraud screening.
"""
from typing import Dict, Any, List


RULES = [
    # ─── 1. Active Investigation / High Authority Flags ─────────────────────────
    {
        "rule_id":        "UNDER_INVESTIGATION_STATUS",
        "name":           "Claim Currently Under Active Investigation",
        "description":    "Existing SIU flag on this claim or related policy.",
        "weight":         35,
        "check": lambda r: str(r.get("claim_status", "")).strip().lower() in ["under investigation", "investigation", "siu flagged"],
        "explanation":    "Claim status is '{claim_status}'."
    },

    # ─── 2. Inception & Policy Timing ───────────────────────────────────────────
    {
        "rule_id":        "EARLY_INCEPTION",
        "name":           "Rapid Staging / Early Filing Pattern (<30d Delay with >20% Ratio, or <7d)",
        "description":    "Loss reported with rapid turnaround (<7d) or within 30-day window with high coverage exposure.",
        "weight":         35,
        "check": lambda r: float(r.get("filing_delay_days", 999)) < 7.0 or (
            float(r.get("filing_delay_days", 999)) < 30.0 and float(r.get("claim_to_limit_ratio", 0.0)) > 0.20
        ),
        "explanation":    "Claim filed {filing_delay_days} days after incident (threshold: <30d with >20% ratio, or <7d ultra-early trigger)."
    },

    # ─── 3. Coverage Ceilings & Staging (Tiered) ────────────────────────────────
    {
        "rule_id":        "HIGH_LIMIT_RATIO_EXACT",
        "name":           "Exact Policy Coverage Limit Staging (=100% Ceil)",
        "description":    "Claim amount matches exactly or exceeds 100% of policy coverage limit.",
        "weight":         35,
        "check": lambda r: float(r.get("claim_to_limit_ratio", 0.0)) >= 1.0,
        "explanation":    "Claim-to-limit ratio: {claim_to_limit_ratio:.2%} (exact limit ceiling reached)."
    },
    {
        "rule_id":        "HIGH_LIMIT_RATIO_CRITICAL",
        "name":           "Critical Coverage Limit Consumption (95% - 99%)",
        "description":    "Claim amount consumes 95% to 99.9% of coverage limit.",
        "weight":         25,
        "check": lambda r: 0.95 <= float(r.get("claim_to_limit_ratio", 0.0)) < 1.0,
        "explanation":    "Claim-to-limit ratio: {claim_to_limit_ratio:.2%} (threshold: 95% - 99%)."
    },
    {
        "rule_id":        "HIGH_LIMIT_RATIO_ELEVATED",
        "name":           "Elevated Coverage Limit Consumption (85% - 94%)",
        "description":    "Claim amount consumes 85% to 94.9% of coverage limit.",
        "weight":         20,
        "check": lambda r: 0.85 <= float(r.get("claim_to_limit_ratio", 0.0)) < 0.95,
        "explanation":    "Claim-to-limit ratio: {claim_to_limit_ratio:.2%} (threshold: 85% - 94%)."
    },

    # ─── 4. Premium Leverage & Economic Disparity (Fixed v2.0) ─────────────────
    {
        "rule_id":        "EXTREME_PREMIUM_RATIO",
        "name":           "Extreme Claim-to-Premium Leverage (>=20x)",
        "description":    "Extreme loss-to-premium ratio is a strong economic outlier signal.",
        "weight":         30,
        "check": lambda r: float(r.get("claim_to_premium_ratio", 0.0)) >= 20.0,
        "explanation":    "Claim-to-premium ratio: {claim_to_premium_ratio:.1f}x (threshold: >=20x)."
    },
    {
        "rule_id":        "HIGH_VALUE_LOW_PREMIUM",
        "name":           "High Value Claim with Extreme Leverage on Low Socioeconomic Tier",
        "description":    "Scale-invariant gate: Claim >$40k, Claim/Premium >=100x, and Purchasing Power Tier <=3.",
        "weight":         20,
        "check": lambda r: (
            float(r.get("claim_amount_usd", 0.0)) > 40000.0
            and float(r.get("claim_to_premium_ratio", 0.0)) >= 100.0
            and float(r.get("purchasing_power_tier", 5.0)) <= 3.0
        ),
        "explanation":    "Claim amount ${claim_amount_usd:,.0f} with {claim_to_premium_ratio:.0f}x premium leverage on tier {purchasing_power_tier}/8."
    },
    {
        "rule_id":        "LOW_PURCHASING_POWER_HIGH_CLAIM",
        "name":           "High Claim Amount vs Low Purchasing Power Tier (>$35k)",
        "description":    "Customer's purchasing power tier is inconsistent with the asset class claimed.",
        "weight":         15,
        "check": lambda r: (
            float(r.get("purchasing_power_tier", 5.0)) <= 2.0
            and float(r.get("claim_amount_usd", 0.0)) > 35000.0
        ),
        "explanation":    "Purchasing power tier {purchasing_power_tier}/8 vs ${claim_amount_usd:,.0f} claim."
    },

    # ─── 5. Subtype-Aware Filing Delay ──────────────────────────────────────────
    {
        "rule_id":        "SUSPICIOUS_DELAY_SUBTYPE",
        "name":           "Subtype-Aware Excessive Filing Delay",
        "description":    "Delayed reporting tailored by insurance line (Health/Liability >14d, Auto >30d, Marine/Property >60d, Life >90d).",
        "weight":         15,
        "check": lambda r: (
            (str(r.get("policy_line", "")).lower() in ["health", "liability"] and float(r.get("filing_delay_days", 0.0)) > 14.0) or
            (str(r.get("policy_line", "")).lower() in ["auto", "casualty", "vehicle"] and float(r.get("filing_delay_days", 0.0)) > 30.0) or
            (str(r.get("policy_line", "")).lower() in ["marine", "property", "fire", "home"] and float(r.get("filing_delay_days", 0.0)) > 60.0) or
            (str(r.get("policy_line", "")).lower() in ["life"] and float(r.get("filing_delay_days", 0.0)) > 90.0) or
            (float(r.get("filing_delay_days", 0.0)) > 45.0)
        ),
        "explanation":    "Filing delay {filing_delay_days}d on {policy_line} policy exceeds subtype threshold."
    },

    # ─── 6. Multi-Policy Stacking (Two-Tier) ─────────────────────────────────────
    {
        "rule_id":        "MULTI_POLICY_STACKING",
        "name":           "Severe Multi-Policy Stacking (>=10 Policies)",
        "description":    "Excessive portfolio stacking across 10 or more active policies.",
        "weight":         20,
        "check": lambda r: float(r.get("customer_total_policies") or r.get("total_active_policies_count") or 0.0) >= 10.0,
        "explanation":    "Customer holds {customer_total_policies} active policies (stacking flag >=10)."
    },
    {
        "rule_id":        "MULTI_POLICY_BURST",
        "name":           "Elevated Multi-Policy Count (7 - 9 Policies)",
        "description":    "Customer holds 7 to 9 active policies.",
        "weight":         10,
        "check": lambda r: 7.0 <= float(r.get("customer_total_policies") or r.get("total_active_policies_count") or 0.0) <= 9.0,
        "explanation":    "Customer holds {customer_total_policies} active policies (elevated 7-9 band)."
    },

    # ─── 7. Exact Round Claim Amount Staging (NEW) ──────────────────────────────
    {
        "rule_id":        "EXACT_ROUND_AMOUNT_MAJOR",
        "name":           "Major Exact Round Claim Amount ($5,000 Multiple >= $25k)",
        "description":    "Staged claim amount invented as exact round $5,000 increment for $25,000+ loss.",
        "weight":         20,
        "check": lambda r: (
            float(r.get("claim_amount_usd", 0.0)) >= 25000.0
            and (float(r.get("claim_amount_usd", 0.0)) % 5000.0 == 0.0)
        ),
        "explanation":    "Claim amount ${claim_amount_usd:,.0f} is an exact $5,000 round staging increment."
    },
    {
        "rule_id":        "EXACT_ROUND_AMOUNT_MINOR",
        "name":           "Exact Round Claim Amount ($1,000 Multiple >= $10k)",
        "description":    "Claim amount is an exact round $1,000 multiple for $10,000+ loss.",
        "weight":         15,
        "check": lambda r: (
            10000.0 <= float(r.get("claim_amount_usd", 0.0)) < 25000.0
            and (float(r.get("claim_amount_usd", 0.0)) % 1000.0 == 0.0)
        ),
        "explanation":    "Claim amount ${claim_amount_usd:,.0f} is an exact $1,000 round staging increment."
    },

    # ─── 8. Repeat Claimant & Velocity Dimensions (NEW) ─────────────────────────
    {
        "rule_id":        "REPEAT_CLAIMANT_HISTORY",
        "name":           "Repeat Claimant Prior Frequency (>=2 Carrier / >=3 Industry)",
        "description":    "Historical repeat claimant pattern across rolling 36-month window.",
        "weight":         30,
        "check": lambda r: (
            float(r.get("prior_claims_same_carrier", 0.0)) >= 2.0
            or float(r.get("prior_claims_any_carrier", 0.0)) >= 3.0
            or float(r.get("prior_claims_count", 0.0)) >= 2.0
        ),
        "explanation":    "Prior claims history: {prior_claims_count} prior claims recorded."
    },
    {
        "rule_id":        "VELOCITY_BURST",
        "name":           "Claim Frequency Velocity Burst (2+ in 90d / 3+ in 180d)",
        "description":    "Sequential multiple loss events filed in rapid succession.",
        "weight":         25,
        "check": lambda r: (
            float(r.get("claims_filed_last_90d", 0.0)) >= 2.0
            or float(r.get("claims_filed_last_180d", 0.0)) >= 3.0
        ),
        "explanation":    "Velocity burst: multiple claims filed within rolling 90/180-day window."
    },
]


def evaluate_rules(claim_row: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluates all deterministic rules against a single claim record dict.
    Normalizes score against 150.0 denominator to prevent early saturation.

    Returns
    -------
    {
        "rule_score":       int (sum of triggered rule weights),
        "rule_score_pct":   float (normalized 0.0 - 1.0 against 150.0 denominator),
        "rule_flags_count": int,
        "triggered_rules":  List[Dict],
        "max_possible":     int,
    }
    """
    triggered = []
    total_score = 0
    max_possible = sum(r["weight"] for r in RULES)

    for rule in RULES:
        try:
            if rule["check"](claim_row):
                # Format the explanation with actual values
                format_dict = {
                    k: v for k, v in claim_row.items()
                    if isinstance(v, (int, float, str))
                }
                format_dict.setdefault("customer_total_policies", claim_row.get("total_active_policies_count", 1))
                format_dict.setdefault("prior_claims_count", claim_row.get("prior_claims_same_carrier", 2))
                
                try:
                    explanation = rule["explanation"].format(**format_dict)
                except Exception:
                    explanation = rule["description"]

                triggered.append({
                    "rule_id":     rule["rule_id"],
                    "name":        rule["name"],
                    "description": rule["description"],
                    "weight":      rule["weight"],
                    "explanation": explanation,
                })
                total_score += rule["weight"]
        except Exception:
            pass   # silently skip if a field is missing

    # Denominator updated to 150 to preserve gradient resolution as per Update Brief
    rule_score_pct = min(1.0, round(total_score / 150.0, 4))

    return {
        "rule_score":       total_score,
        "rule_score_pct":   rule_score_pct,
        "rule_flags_count": len(triggered),
        "triggered_rules":  triggered,
        "max_possible":     max_possible,
    }


def get_all_rules_metadata() -> List[Dict[str, Any]]:
    """Returns rule definitions (without lambda) for documentation."""
    return [
        {
            "rule_id":     r["rule_id"],
            "name":        r["name"],
            "description": r["description"],
            "weight":      r["weight"],
        }
        for r in RULES
    ]
