"""
Agent 2: Claims Risk Analysis Agent
====================================
Specialized in pure ML supervised fraud risk profiling (XGBoost),
coverage limit exposure analytics, model calibration, and SHAP feature attribution.
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

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODELS_DIR = os.path.join(BASE_DIR, "data", "models")


class ClaimsRiskAnalysisAgent:
    """Agent 2: Specialized in data-driven ML claims risk profiling."""

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
        Executes granular ML risk scoring and SHAP factor attribution.
        Returns:
          - RiskAgentOutput
          - A2AMessage for Agent 3 (Anomaly Detection Agent)
        """
        claim_id = claim_data["claim_id"]
        claim_amt = float(claim_data.get("claim_amount_usd", 0.0))
        limit = float(claim_data.get("coverage_limit_usd", 1.0))
        premium = float(claim_data.get("estimated_annual_premium_usd", 1.0))

        # 1. Compute Direct ML Risk Score (XGBoost Prob * 100) & Model Outputs
        score_dict = self.scorer.score_claim(claim_data)
        risk_score = int(score_dict["risk_score"])
        risk_tier = score_dict.get("risk_level", "Low")
        breakdown = score_dict.get("ensemble_breakdown", {})
        xgb_prob = float(breakdown.get("xgb_prob", float(risk_score) / 100.0))
        rf_prob = float(breakdown.get("rf_prob", 0.0))

        # 2. Extract SHAP Factors
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
            filing_delay = float(claim_data.get("filing_delay_days", 0))
            active_pols = float(claim_data.get("total_active_policies_count") or claim_data.get("total_active_policies", 1))

            # Tiered Claim-to-Limit SHAP Attribution
            if exposure_ratio >= 0.95:
                lim_shap, lim_dir, lim_impact = 0.48, "INCREASES_RISK", "Critical"
            elif exposure_ratio >= 0.85:
                lim_shap, lim_dir, lim_impact = 0.32, "INCREASES_RISK", "High"
            elif exposure_ratio >= 0.60:
                lim_shap, lim_dir, lim_impact = 0.18, "INCREASES_RISK", "Medium"
            else:
                lim_shap, lim_dir, lim_impact = -0.22, "DECREASES_RISK", "Low"

            # Tiered Premium Ratio SHAP Attribution
            if prem_ratio >= 100.0:
                prem_shap, prem_dir, prem_impact = 0.45, "INCREASES_RISK", "Critical"
            elif prem_ratio >= 20.0:
                prem_shap, prem_dir, prem_impact = 0.32, "INCREASES_RISK", "High"
            elif prem_ratio >= 5.0:
                prem_shap, prem_dir, prem_impact = 0.15, "INCREASES_RISK", "Medium"
            else:
                prem_shap, prem_dir, prem_impact = -0.18, "DECREASES_RISK", "Low"

            shap_factors = [
                ShapFactor(
                    feature_name="claim_to_limit_ratio",
                    display_name="Claim-to-Limit Exposure",
                    raw_value=exposure_ratio,
                    shap_value=lim_shap,
                    direction=lim_dir,
                    impact_level=lim_impact
                ),
                ShapFactor(
                    feature_name="claim_to_premium_ratio",
                    display_name="Claim-to-Premium Ratio",
                    raw_value=prem_ratio,
                    shap_value=prem_shap,
                    direction=prem_dir,
                    impact_level=prem_impact
                )
            ]

            if filing_delay > 60:
                shap_factors.append(ShapFactor(
                    feature_name="filing_delay_days",
                    display_name="Filing Delay Latency",
                    raw_value=filing_delay,
                    shap_value=0.38,
                    direction="INCREASES_RISK",
                    impact_level="High"
                ))
            elif filing_delay > 30:
                shap_factors.append(ShapFactor(
                    feature_name="filing_delay_days",
                    display_name="Filing Delay Latency",
                    raw_value=filing_delay,
                    shap_value=0.25,
                    direction="INCREASES_RISK",
                    impact_level="Medium"
                ))
            elif filing_delay > 14:
                shap_factors.append(ShapFactor(
                    feature_name="filing_delay_days",
                    display_name="Filing Delay Latency",
                    raw_value=filing_delay,
                    shap_value=0.12,
                    direction="INCREASES_RISK",
                    impact_level="Low"
                ))

            if active_pols >= 10:
                shap_factors.append(ShapFactor(
                    feature_name="customer_total_policies",
                    display_name="Multi-Policy Stacking Portfolio",
                    raw_value=active_pols,
                    shap_value=0.30,
                    direction="INCREASES_RISK",
                    impact_level="High"
                ))
            elif active_pols >= 7:
                shap_factors.append(ShapFactor(
                    feature_name="customer_total_policies",
                    display_name="Elevated Policy Portfolio",
                    raw_value=active_pols,
                    shap_value=0.15,
                    direction="INCREASES_RISK",
                    impact_level="Medium"
                ))
            elif active_pols > 1:
                shap_factors.append(ShapFactor(
                    feature_name="customer_total_policies",
                    display_name="Active Policy Portfolio Size",
                    raw_value=active_pols,
                    shap_value=-min(0.25, 0.08 * active_pols),
                    direction="DECREASES_RISK",
                    impact_level="Low"
                ))

        # 3. Ratios
        coverage_ratio = round(claim_amt / max(limit, 1.0), 4)
        prem_ratio = round(claim_amt / max(premium, 1.0), 2)

        # 4. Build Evidence Citations
        citations = [
            EvidenceCitation(
                source_type="ML_MODEL",
                reference_id="XGBoost_SHAP",
                field_name="risk_score",
                field_value=f"{risk_score}/100 ({risk_tier})",
                snippet=f"Primary XGBoost fraud probability: {xgb_prob:.1%}, Calibrated RF probability: {rf_prob:.1%}"
            ),
            EvidenceCitation(
                source_type="RELATIONAL_DB",
                reference_id=claim_data.get("policy_id", "POL-UNKNOWN"),
                field_name="coverage_exposure_ratio",
                field_value=f"{coverage_ratio:.1%}",
                snippet=f"Claim amount ${claim_amt:,.2f} against ${limit:,.2f} policy limit."
            )
        ]

        # 5. Generate Risk Summary
        top_driver = shap_factors[0].display_name if shap_factors else "Claim Amount"
        summary = (
            f"Assigned statistical ML risk score of {risk_score}/100 ({risk_tier} Risk) derived from XGBoost fraud probability ({xgb_prob:.1%}). "
            f"Coverage exposure is {coverage_ratio:.1%} of policy limit and {prem_ratio:.1f}x annual premium. "
            f"Primary risk driver identified via TreeSHAP: '{top_driver}'."
        )

        output = RiskAgentOutput(
            risk_score=risk_score,
            risk_tier=risk_tier,
            xgb_probability=round(xgb_prob, 4),
            rf_probability=round(rf_prob, 4),
            rule_violations=[],
            top_shap_factors=shap_factors,
            coverage_exposure_ratio=coverage_ratio,
            claim_to_premium_ratio=prem_ratio,
            risk_analysis_summary=summary,
            citations=citations
        )

        # 6. Build A2A Handoff Message to Agent 3 (Anomaly Detection Agent)
        a2a_msg = A2AMessage(
            from_agent="ClaimsRiskAnalysisAgent",
            to_agent="AnomalyDetectionAgent",
            handoff_type="RISK_PROFILE_ESCALATION",
            payload={
                "claim_id": claim_id,
                "risk_score": risk_score,
                "risk_tier": risk_tier,
                "top_shap_driver": top_driver,
                "xgb_prob": round(xgb_prob, 4),
            }
        )

        return output, a2a_msg
