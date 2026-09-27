"""
Agent 2: Claims Risk Analysis Agent
====================================
Specialized in policy risk assessment, coverage limit exposure,
deterministic rule validation, and SHAP feature attribution decomposition.
"""
import os
import json
from typing import Dict, Any, Tuple

from backend.agents.schemas import (
    RiskAgentOutput,
    ShapFactor,
    EvidenceCitation,
    A2AMessage,
    RetrievalAgentOutput
)
from backend.analytics.ensemble_scorer import get_default_scorer
from backend.analytics.rule_engine import evaluate_rules

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODELS_DIR = os.path.join(BASE_DIR, "data", "models")


class ClaimsRiskAnalysisAgent:
    """Agent 2: Specialized in multi-factor claims risk profiling."""

    def __init__(self, scorer=None):
        self.scorer = scorer or get_default_scorer()
        self.shap_cache = self._load_shap_cache()

    def _load_shap_cache(self) -> Dict[str, Any]:
        shap_file = os.path.join(MODELS_DIR, "shap_top20_explanations.json")
        if os.path.exists(shap_file):
            try:
                with open(shap_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    return {item["claim_id"]: item for item in data}
            except Exception:
                pass
        return {}

    def process_claim(
        self,
        claim_data: Dict[str, Any],
        retrieval_output: RetrievalAgentOutput = None
    ) -> Tuple[RiskAgentOutput, A2AMessage]:
        """
        Executes granular risk scoring and SHAP factor attribution.
        Returns:
          - RiskAgentOutput
          - A2AMessage for Agent 3 (Anomaly Detection Agent)
        """
        claim_id = claim_data["claim_id"]
        claim_amt = float(claim_data.get("claim_amount_usd", 0.0))
        limit = float(claim_data.get("coverage_limit_usd", 1.0))
        premium = float(claim_data.get("estimated_annual_premium_usd", 1.0))

        # 1. Evaluate Deterministic Rule Engine
        rule_result = evaluate_rules(claim_data)
        rule_flags = [f"{v.get('name', 'Rule')}: {v.get('explanation', '')}" for v in rule_result.get("triggered_rules", [])]

        # 2. Compute Ensemble Risk Score & ML Layer Outputs
        score_dict = self.scorer.score_claim(claim_data)
        risk_score = int(score_dict["risk_score"])
        risk_tier = score_dict.get("risk_level", "Low")
        breakdown = score_dict.get("ensemble_breakdown", {})
        xgb_prob = float(breakdown.get("xgb_score", 0)) / 100.0
        rf_prob = float(breakdown.get("rf_score", 0)) / 100.0

        # 3. Extract SHAP Factors
        shap_factors = []
        if claim_id in self.shap_cache:
            top_factors = self.shap_cache[claim_id].get("top_factors", [])
            for tf in top_factors:
                abs_val = abs(tf["shap_value"])
                impact = "High" if abs_val > 0.4 else ("Medium" if abs_val > 0.15 else "Low")
                shap_factors.append(ShapFactor(
                    feature_name=tf["feature"],
                    display_name=tf["display_name"],
                    raw_value=float(tf["raw_value"]),
                    shap_value=float(tf["shap_value"]),
                    direction=tf["direction"],
                    impact_level=impact
                ))

        # Fallback default SHAP factor calculation if claim wasn't in top-20 cache
        if not shap_factors:
            exposure_ratio = claim_amt / max(limit, 1.0)
            prem_ratio = claim_amt / max(premium, 1.0)
            shap_factors = [
                ShapFactor(
                    feature_name="claim_to_limit_ratio",
                    display_name="Claim-to-Limit Ratio",
                    raw_value=exposure_ratio,
                    shap_value=0.45 if exposure_ratio > 0.5 else -0.2,
                    direction="INCREASES_RISK" if exposure_ratio > 0.5 else "DECREASES_RISK",
                    impact_level="High" if exposure_ratio > 0.5 else "Low"
                ),
                ShapFactor(
                    feature_name="claim_to_premium_ratio",
                    display_name="Claim-to-Premium Ratio",
                    raw_value=prem_ratio,
                    shap_value=0.35 if prem_ratio > 20.0 else -0.15,
                    direction="INCREASES_RISK" if prem_ratio > 20.0 else "DECREASES_RISK",
                    impact_level="Medium"
                )
            ]

        # 4. Ratios
        coverage_ratio = round(claim_amt / max(limit, 1.0), 4)
        prem_ratio = round(claim_amt / max(premium, 1.0), 2)

        # 5. Build Evidence Citations
        citations = [
            EvidenceCitation(
                source_type="ML_MODEL",
                reference_id="XGBoost_SHAP",
                field_name="risk_score",
                field_value=f"{risk_score}/100 ({risk_tier})",
                snippet=f"Primary XGBoost risk probability: {xgb_prob:.1%}, Calibrated RF probability: {rf_prob:.1%}"
            ),
            EvidenceCitation(
                source_type="RELATIONAL_DB",
                reference_id=claim_data.get("policy_id", "POL-UNKNOWN"),
                field_name="coverage_exposure_ratio",
                field_value=f"{coverage_ratio:.1%}",
                snippet=f"Claim amount ${claim_amt:,.2f} against ${limit:,.2f} policy limit."
            )
        ]

        for flag in rule_flags:
            citations.append(EvidenceCitation(
                source_type="RELATIONAL_DB",
                reference_id="RULE_ENGINE",
                field_name="rule_violation",
                field_value=flag.split(":")[0],
                snippet=flag
            ))

        # 6. Generate Risk Summary
        summary = (
            f"Assigned unified risk score of {risk_score}/100 ({risk_tier} Risk). "
            f"Coverage exposure is {coverage_ratio:.1%} of policy limit and {prem_ratio:.1f}x annual premium. "
        )
        if rule_flags:
            summary += f"Triggered {len(rule_flags)} deterministic policy rule warnings: {'; '.join(rule_flags)}. "
        else:
            summary += "No deterministic policy rule breaches detected. "
        
        top_driver = shap_factors[0].display_name if shap_factors else "Claim Amount"
        summary += f"Primary risk driver identified via SHAP: '{top_driver}'."

        output = RiskAgentOutput(
            risk_score=risk_score,
            risk_tier=risk_tier,
            xgb_probability=round(xgb_prob, 4),
            rf_probability=round(rf_prob, 4),
            rule_violations=rule_flags,
            top_shap_factors=shap_factors,
            coverage_exposure_ratio=coverage_ratio,
            claim_to_premium_ratio=prem_ratio,
            risk_analysis_summary=summary,
            citations=citations
        )

        # 7. Build A2A Handoff Message to Agent 3 (Anomaly Detection Agent)
        a2a_msg = A2AMessage(
            from_agent="ClaimsRiskAnalysisAgent",
            to_agent="AnomalyDetectionAgent",
            handoff_type="RISK_PROFILE_ESCALATION",
            payload={
                "claim_id": claim_id,
                "risk_score": risk_score,
                "risk_tier": risk_tier,
                "rule_violations_count": len(rule_flags),
                "top_shap_driver": top_driver
            }
        )

        return output, a2a_msg
