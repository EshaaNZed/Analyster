"""
Multi-Agent State Machine Orchestrator
======================================
Coordinates the 5 specialized claims intelligence agents through a deterministic,
auditable state machine. Manages Agent-to-Agent (A2A) handoffs, audit logging,
and produces the final unified ClaimsIntelligenceDossier.
"""
import os
import time
import sqlite3
from typing import Dict, Any, Optional

from backend.agents.schemas import (
    ClaimsIntelligenceDossier,
    A2AMessage
)
from backend.agents.retrieval_agent import ClaimsRetrievalAgent
from backend.agents.risk_agent import ClaimsRiskAnalysisAgent
from backend.agents.anomaly_agent import AnomalyDetectionAgent
from backend.agents.summarizer_agent import ClaimsSummarizationAgent
from backend.agents.investigation_agent import InvestigationSupportAgent

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_PATH  = os.path.join(BASE_DIR, "data", "processed", "claims_intelligence.db")


class ClaimsIntelligenceOrchestrator:
    """State-Machine Multi-Agent Orchestrator for claims processing."""

    def __init__(self):
        print("[ORCHESTRATOR] Initializing Multi-Agent Claims Intelligence Mesh...")
        t0 = time.time()
        self.retrieval_agent = ClaimsRetrievalAgent()
        self.risk_agent = ClaimsRiskAnalysisAgent()
        self.anomaly_agent = AnomalyDetectionAgent()
        self.summarizer_agent = ClaimsSummarizationAgent()
        self.investigation_agent = InvestigationSupportAgent()
        print(f"[ORCHESTRATOR] All 5 agents initialized in {time.time()-t0:.2f}s.")

    def _fetch_claim_data(self, claim_id: str) -> Dict[str, Any]:
        """Loads complete claim and policy dossier from SQLite view."""
        with sqlite3.connect(DB_PATH) as conn:
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()
            row = cur.execute(
                "SELECT * FROM v_claims_full_dossier WHERE claim_id = ?",
                (claim_id,)
            ).fetchone()
            if not row:
                # Fallback to fact_claims
                row = cur.execute(
                    "SELECT * FROM fact_claims WHERE claim_id = ?",
                    (claim_id,)
                ).fetchone()
            if not row:
                raise ValueError(f"Claim ID '{claim_id}' not found in database.")
            return dict(row)

    def process_claim(self, claim_id_or_data: Any) -> ClaimsIntelligenceDossier:
        """
        Executes the multi-agent pipeline sequentially with explicit A2A handoffs.
        Accepts a string claim_id or a claim dictionary.
        Returns a complete ClaimsIntelligenceDossier.
        """
        t_start = time.time()

        # 1. Resolve Claim Data
        if isinstance(claim_id_or_data, str):
            claim_data = self._fetch_claim_data(claim_id_or_data)
        elif isinstance(claim_id_or_data, dict):
            claim_data = claim_id_or_data
        else:
            raise TypeError("Expected claim_id (str) or claim_data (dict).")

        claim_id = claim_data.get("claim_id", "CLM-UNKNOWN")
        a2a_messages = []
        execution_steps = []

        # ─────────────────────────────────────────────────────────────────
        # STEP 1: Agent 1 — Claims Retrieval Agent
        # ─────────────────────────────────────────────────────────────────
        t_step = time.time()
        retrieval_out, msg_1 = self.retrieval_agent.process_claim(claim_data)
        a2a_messages.append(msg_1)
        execution_steps.append({
            "step": 1,
            "agent": "ClaimsRetrievalAgent",
            "action": "Hybrid Vector + Graph Traversal",
            "latency_ms": round((time.time() - t_step) * 1000, 2),
            "summary": f"Retrieved {len(retrieval_out.precedent_claims)} precedents and {len(retrieval_out.customer_active_policies)} customer policies."
        })

        # ─────────────────────────────────────────────────────────────────
        # STEP 2: Agent 2 — Claims Risk Analysis Agent
        # ─────────────────────────────────────────────────────────────────
        t_step = time.time()
        risk_out, msg_2 = self.risk_agent.process_claim(claim_data, retrieval_out)
        a2a_messages.append(msg_2)
        execution_steps.append({
            "step": 2,
            "agent": "ClaimsRiskAnalysisAgent",
            "action": "Ensemble Scoring & SHAP Attribution",
            "latency_ms": round((time.time() - t_step) * 1000, 2),
            "summary": f"Risk Score: {risk_out.risk_score}/100 ({risk_out.risk_tier}), XGBoost Prob: {risk_out.xgb_probability:.1%}"
        })

        # ─────────────────────────────────────────────────────────────────
        # STEP 3: Agent 3 — Anomaly Detection Agent
        # ─────────────────────────────────────────────────────────────────
        t_step = time.time()
        anomaly_out, msg_3 = self.anomaly_agent.process_claim(claim_data, risk_out, retrieval_out)
        a2a_messages.append(msg_3)
        execution_steps.append({
            "step": 3,
            "agent": "AnomalyDetectionAgent",
            "action": "Statistical & Graph Anomaly Deep Dive",
            "latency_ms": round((time.time() - t_step) * 1000, 2),
            "summary": f"Outlier: {anomaly_out.is_statistical_outlier}, Anomaly Flags: {len(anomaly_out.flagged_anomaly_categories)}"
        })

        # ─────────────────────────────────────────────────────────────────
        # STEP 4: Agent 4 — Claims Summarization Agent
        # ─────────────────────────────────────────────────────────────────
        t_step = time.time()
        summary_out, msg_4 = self.summarizer_agent.process_claim(
            claim_data, retrieval_out, risk_out, anomaly_out
        )
        a2a_messages.append(msg_4)
        execution_steps.append({
            "step": 4,
            "agent": "ClaimsSummarizationAgent",
            "action": "Grounded Executive Synthesis",
            "latency_ms": round((time.time() - t_step) * 1000, 2),
            "summary": f"Executive brief synthesized (Faithfulness: {summary_out.faithfulness_score*100:.0f}%)"
        })

        # ─────────────────────────────────────────────────────────────────
        # STEP 5: Agent 5 — Investigation Support Agent
        # ─────────────────────────────────────────────────────────────────
        t_step = time.time()
        investigation_out, msg_5 = self.investigation_agent.process_claim(
            claim_data, retrieval_out, risk_out, anomaly_out, summary_out
        )
        a2a_messages.append(msg_5)
        execution_steps.append({
            "step": 5,
            "agent": "InvestigationSupportAgent",
            "action": "Triage Disposition & SIU Packaging",
            "latency_ms": round((time.time() - t_step) * 1000, 2),
            "summary": f"Disposition: {investigation_out.suggested_disposition} (SIU Referral: {investigation_out.siu_referral_needed})"
        })

        total_latency = round((time.time() - t_start) * 1000, 2)

        # ─────────────────────────────────────────────────────────────────
        # Assemble Final Dossier
        # ─────────────────────────────────────────────────────────────────
        dossier = ClaimsIntelligenceDossier(
            claim_id=claim_id,
            customer_id=claim_data.get("customer_id", "CUST-UNKNOWN"),
            policy_id=claim_data.get("policy_id", "POL-UNKNOWN"),
            policy_line=claim_data.get("policy_line", "Auto"),
            incident_date=str(claim_data.get("incident_date", "")),
            filing_date=str(claim_data.get("filing_date", "")),
            filing_delay_days=int(claim_data.get("filing_delay_days", 0)),
            claim_amount_usd=float(claim_data.get("claim_amount_usd", 0.0)),
            coverage_limit_usd=float(claim_data.get("coverage_limit_usd", 0.0)),
            estimated_annual_premium_usd=float(claim_data.get("estimated_annual_premium_usd", 0.0)),
            incident_narrative=claim_data.get("incident_narrative", ""),
            adjuster_notes=claim_data.get("adjuster_notes", ""),
            retrieval=retrieval_out,
            risk_analysis=risk_out,
            anomaly_detection=anomaly_out,
            summarization=summary_out,
            investigation_support=investigation_out,
            a2a_messages=a2a_messages,
            execution_steps=execution_steps,
            total_latency_ms=total_latency,
            status="COMPLETED"
        )

        return dossier


# Singleton instance helper
_default_orchestrator = None

def get_default_orchestrator() -> ClaimsIntelligenceOrchestrator:
    global _default_orchestrator
    if _default_orchestrator is None:
        _default_orchestrator = ClaimsIntelligenceOrchestrator()
    return _default_orchestrator
