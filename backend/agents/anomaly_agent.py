"""
Agent 3: Anomaly Detection Agent
=================================
Specialized in unsupervised anomaly discovery (Isolation Forest),
velocity / filing latency outlier analysis, and graph cluster co-occurrence detection.
"""
import os
import pickle
import numpy as np
from typing import Dict, Any, Tuple

from backend.agents.schemas import (
    AnomalyAgentOutput,
    EvidenceCitation,
    A2AMessage,
    RiskAgentOutput,
    RetrievalAgentOutput
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
IF_MODEL_PATH = os.path.join(BASE_DIR, "data", "models", "isolation_forest.pkl")


class AnomalyDetectionAgent:
    """Agent 3: Specialized in unsupervised and behavioral anomaly detection."""

    def __init__(self, if_model=None):
        self.if_model = if_model or self._load_if_model()

    def _load_if_model(self):
        if os.path.exists(IF_MODEL_PATH):
            try:
                with open(IF_MODEL_PATH, "rb") as f:
                    return pickle.load(f)
            except Exception:
                pass
        return None

    def process_claim(
        self,
        claim_data: Dict[str, Any],
        risk_output: RiskAgentOutput = None,
        retrieval_output: RetrievalAgentOutput = None
    ) -> Tuple[AnomalyAgentOutput, A2AMessage]:
        """
        Conducts deep-dive anomaly analysis across statistical and graph dimensions.
        Returns:
          - AnomalyAgentOutput
          - A2AMessage for Agent 4 (Claims Summarization Agent)
        """
        claim_id = claim_data["claim_id"]
        filing_delay = int(claim_data.get("filing_delay_days", 0))
        anomaly_reasons_str = claim_data.get("anomaly_reasons", "NONE")

        # 1. Isolation Forest on the same pattern features as the triage model.
        # The planted-anomaly flag is an evaluation label and is not used here.
        if_score = 0.0
        is_outlier = False
        try:
            from backend.analytics.ensemble_scorer import get_default_scorer
            scored = get_default_scorer().score_claim(claim_data)
            breakdown = scored.get("ensemble_breakdown", {})
            if_score = float(breakdown.get("if_prob", 0.0))
            is_outlier = bool(breakdown.get("if_outlier", False))
        except Exception:
            is_outlier = bool(risk_output and risk_output.risk_score >= 70)
            if_score = 0.7 if is_outlier else 0.2

        # 2. Flagged Categories
        categories = []
        if anomaly_reasons_str and anomaly_reasons_str != "NONE":
            categories = [c.strip() for c in anomaly_reasons_str.split(",")]

        # 3. Filing Velocity & Latency Checks
        velocity_flag = False
        if filing_delay > 40:
            velocity_flag = True
            if "EXCESSIVE_FILING_DELAY" not in categories:
                categories.append("EXCESSIVE_FILING_DELAY")
        elif filing_delay <= 2 and claim_data.get("claim_amount_usd", 0) > 15000:
            velocity_flag = True
            if "IMMEDIATE_HIGH_VALUE_LOSS" not in categories:
                categories.append("IMMEDIATE_HIGH_VALUE_LOSS")

        # 4. Cluster Anomaly Flag from Knowledge Graph
        cluster_flag = False
        cluster_info = {}
        if retrieval_output and retrieval_output.household_risk_flags:
            cluster_flag = True
            cluster_info = {
                "flags": retrieval_output.household_risk_flags,
                "graph_entities_checked": retrieval_output.graph_context.get("node_count", 0)
            }
            if "HOUSEHOLD_COLLUSION_RISK" not in categories:
                categories.append("HOUSEHOLD_COLLUSION_RISK")

        # 5. Build Evidence Citations
        citations = []
        if is_outlier:
            citations.append(EvidenceCitation(
                source_type="ML_MODEL",
                reference_id="IsolationForest",
                field_name="outlier_anomaly_score",
                field_value=f"{if_score:.2f}",
                snippet="Isolation Forest flagged multi-dimensional statistical outlier."
            ))

        if velocity_flag:
            citations.append(EvidenceCitation(
                source_type="RELATIONAL_DB",
                reference_id=claim_id,
                field_name="filing_delay_days",
                field_value=f"{filing_delay} days",
                snippet=f"Unusual filing latency of {filing_delay} days from incident date."
            ))

        if cluster_flag:
            citations.append(EvidenceCitation(
                source_type="KNOWLEDGE_GRAPH",
                reference_id=claim_data.get("customer_id", "CUST-UNKNOWN"),
                field_name="household_cluster",
                field_value="Multi-Claim Cluster Detected",
                snippet=f"Knowledge graph flags: {'; '.join(retrieval_output.household_risk_flags)}"
            ))

        # 6. Synthesize Deep-Dive Anomaly Narrative
        if categories:
            summary = (
                f"Statistical and graph anomaly audit identified {len(categories)} anomaly flag(s): "
                f"{', '.join(categories)}. "
                f"Filing latency is {filing_delay} days. "
            )
            if cluster_flag:
                summary += "Graph traversal confirms shared entity connections in high-risk household cluster."
            else:
                summary += "No suspicious multi-party cluster link detected in entity graph."
        else:
            summary = (
                f"No statistical outliers or suspicious filing anomalies detected. "
                f"Filing latency ({filing_delay} days) falls within the expected regional peer baseline."
            )

        output = AnomalyAgentOutput(
            is_statistical_outlier=is_outlier,
            isolation_forest_score=round(if_score, 4),
            flagged_anomaly_categories=categories,
            cluster_anomaly_flag=cluster_flag,
            cluster_details=cluster_info,
            velocity_anomaly_flag=velocity_flag,
            anomaly_deep_dive_summary=summary,
            citations=citations
        )

        # 7. Build A2A Handoff Message to Agent 4 (Summarization Agent)
        a2a_msg = A2AMessage(
            from_agent="AnomalyDetectionAgent",
            to_agent="ClaimsSummarizationAgent",
            handoff_type="ANOMALY_FINDINGS_HANDOFF",
            payload={
                "claim_id": claim_id,
                "is_outlier": is_outlier,
                "anomaly_categories": categories,
                "cluster_flag": cluster_flag,
                "velocity_flag": velocity_flag
            }
        )

        return output, a2a_msg
