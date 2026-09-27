"""
Deterministic Rule Engine — Regulatory Explainability Layer
============================================================
Layer 4 of the 4-layer ensemble.

Pure deterministic heuristics that require ZERO ML.
Every factor is completely transparent, auditable, and human-understandable.
Contributes 10% weight to final ensemble score.

These rules mirror real-world SIU (Special Investigation Unit) triage criteria
used by insurance carriers for initial fraud screening.
"""
from typing import Dict, Any, List


# Rule definitions: threshold, points awarded, explanation template
RULES = [
    {
        "rule_id":        "EARLY_INCEPTION",
        "name":           "Claim Filed Within 14 Days of Policy Inception",
        "description":    "High-risk indicator: policy purchased very recently before incident.",
        "weight":         30,
        "check": lambda r: r.get("filing_delay_days", 999) < 14 and r.get("claim_to_limit_ratio", 0) > 0.2,
        "explanation":    "Claim filed {filing_delay_days} days after policy inception (threshold: <14 days)."
    },
    {
        "rule_id":        "HIGH_LIMIT_RATIO",
        "name":           "Claim Exceeds 85% of Policy Coverage Limit",
        "description":    "Claiming near or at the maximum coverage limit is a key fraud signal.",
        "weight":         25,
        "check": lambda r: r.get("claim_to_limit_ratio", 0) >= 0.85,
        "explanation":    "Claim-to-limit ratio: {claim_to_limit_ratio:.2%} (threshold: ≥85%)."
    },
    {
        "rule_id":        "EXTREME_PREMIUM_RATIO",
        "name":           "Claim Amount Exceeds 20x Annual Premium",
        "description":    "Extreme loss-to-premium ratio is a strong outlier signal.",
        "weight":         25,
        "check": lambda r: r.get("claim_to_premium_ratio", 0) >= 20.0,
        "explanation":    "Claim-to-premium ratio: {claim_to_premium_ratio:.1f}x (threshold: ≥20x)."
    },
    {
        "rule_id":        "SUSPICIOUS_DELAY",
        "name":           "Excessive Filing Delay (>45 Days)",
        "description":    "Delayed reporting can indicate time needed to fabricate evidence.",
        "weight":         15,
        "check": lambda r: r.get("filing_delay_days", 0) > 45,
        "explanation":    "Filing delay: {filing_delay_days} days after incident (threshold: >45 days)."
    },
    {
        "rule_id":        "HIGH_VALUE_LOW_PREMIUM",
        "name":           "Large Claim on Low-Contribution Policy",
        "description":    "High claim amount relative to a minimal premium tier is disproportionate.",
        "weight":         20,
        "check": lambda r: (
            r.get("claim_amount_usd", 0) > 25000
            and r.get("annual_premium_usd", 9999) < 100
        ),
        "explanation":    "Claim amount ${claim_amount_usd:,.0f} on a policy with only ${annual_premium_usd:.0f} annual premium."
    },
    {
        "rule_id":        "UNDER_INVESTIGATION_STATUS",
        "name":           "Claim Currently Under Active Investigation",
        "description":    "Existing SIU flag on this claim or related policy.",
        "weight":         35,
        "check": lambda r: str(r.get("claim_status", "")).strip() == "Under Investigation",
        "explanation":    "Claim status is 'Under Investigation'."
    },
    {
        "rule_id":        "LOW_PURCHASING_POWER_HIGH_CLAIM",
        "name":           "High Claim Amount vs Low Purchasing Power Tier",
        "description":    "Customer's purchasing power tier is inconsistent with the asset class claimed.",
        "weight":         15,
        "check": lambda r: (
            r.get("purchasing_power_tier", 5) <= 2
            and r.get("claim_amount_usd", 0) > 30000
        ),
        "explanation":    "Purchasing power tier {purchasing_power_tier}/8 vs ${claim_amount_usd:,.0f} claim."
    },
    {
        "rule_id":        "MULTI_POLICY_BURST",
        "name":           "Customer Holds More Than 6 Active Policies",
        "description":    "Excessive multi-policy portfolio can be used to maximize payout exposure.",
        "weight":         10,
        "check": lambda r: r.get("customer_total_policies", 0) > 6,
        "explanation":    "Customer holds {customer_total_policies} active policies (threshold: >6)."
    },
]


def evaluate_rules(claim_row: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluates all deterministic rules against a single claim record dict.

    Parameters
    ----------
    claim_row : dict with keys:
        filing_delay_days, claim_to_limit_ratio, claim_to_premium_ratio,
        claim_amount_usd, annual_premium_usd, claim_status,
        purchasing_power_tier, customer_total_policies

    Returns
    -------
    {
        "rule_score":       int (0-100 range, sum of triggered rule weights),
        "triggered_rules":  List[Dict],
        "rule_score_pct":   float (normalized 0-1),
        "rule_flags_count": int,
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
                explanation = rule["explanation"].format(**{
                    k: v for k, v in claim_row.items()
                    if isinstance(v, (int, float, str))
                })
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

    return {
        "rule_score":       total_score,
        "rule_score_pct":   round(total_score / max_possible, 4),
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
