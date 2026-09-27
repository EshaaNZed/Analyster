"""
Agent 5: Investigation Support Agent
=====================================
Formulates human-in-the-loop action items, claimant interview questions,
and Special Investigation Unit (SIU) referral triage recommendations.
"""
from typing import Dict, Any, List, Tuple

from backend.agents.schemas import (
    InvestigationAgentOutput,
    EvidenceCitation,
    A2AMessage,
    RetrievalAgentOutput,
    RiskAgentOutput,
    AnomalyAgentOutput,
    SummarizerAgentOutput
)


class InvestigationSupportAgent:
    """Agent 5: Specialized in adjuster decision support and SIU referral packaging."""

    def process_claim(
        self,
        claim_data: Dict[str, Any],
        retrieval_output: RetrievalAgentOutput,
        risk_output: RiskAgentOutput,
        anomaly_output: AnomalyAgentOutput,
        summarizer_output: SummarizerAgentOutput
    ) -> Tuple[InvestigationAgentOutput, A2AMessage]:
        """
        Synthesizes human reviewer action items, interview questions, and SIU recommendations.
        Returns:
          - InvestigationAgentOutput
          - Final A2AMessage
        """
        claim_id = claim_data["claim_id"]
        policy_line = claim_data.get("policy_line", "Auto")
        claim_amt = float(claim_data.get("claim_amount_usd", 0.0))
        filing_delay = int(claim_data.get("filing_delay_days", 0))
        risk_score = risk_output.risk_score if risk_output else 0
        risk_tier = risk_output.risk_tier if risk_output else "Low"
        anomalies = anomaly_output.flagged_anomaly_categories if anomaly_output else []

        # 1. Determine Disposition & Priority
        siu_needed = False
        siu_reasons = []

        if risk_score >= 70 or len(anomalies) >= 2 or (anomaly_output and anomaly_output.cluster_anomaly_flag):
            disposition = "Priority SIU Referral"
            priority = "CRITICAL" if risk_score >= 85 else "HIGH"
            siu_needed = True
            siu_reasons.append(f"Elevated ensemble risk score: {risk_score}/100")
            if anomalies:
                siu_reasons.extend(anomalies)
            if anomaly_output and anomaly_output.cluster_anomaly_flag:
                siu_reasons.append("Connected to multi-claim household collusion cluster")
        elif risk_score >= 40 or filing_delay > 25:
            disposition = "Standard Adjuster Review"
            priority = "MEDIUM"
        else:
            disposition = "Fast-Track Approval"
            priority = "LOW"

        # 2 & 3. Formulate Recommended Actions & Interview Questions (Generative LLM via Gemini with Fallback)
        from backend.agents.llm_service import get_llm_service
        llm_service = get_llm_service()

        llm_probes = llm_service.generate_investigation_probes(
            claim_data=claim_data,
            risk_score=risk_score,
            risk_tier=risk_tier,
            flagged_anomalies=anomalies,
            exec_summary=summarizer_output.executive_summary if summarizer_output else ""
        )

        if llm_probes:
            actions, questions = llm_probes
        else:
            # Deterministic Fallback Actions
            actions = []
            if disposition == "Priority SIU Referral":
                actions.append("Freeze automated disbursement and route file to Special Investigation Unit (SIU).")
                actions.append("Request unredacted police accident report and recorded statements from all vehicle occupants.")
                actions.append("Perform independent forensic vehicle/property damage inspection for prior or mismatched damage.")
                actions.append("Cross-reference medical billing codes against state provider fraud index.")
            elif disposition == "Standard Adjuster Review":
                actions.append("Verify original repair estimates against regional labor rate benchmarks.")
                actions.append("Confirm policyholder identity and policy active status at exact time of incident.")
                actions.append("Check for overlapping claims filed with other insurance carriers via shared industry database.")
            else:
                actions.append("Verify policy coverage limits are active and deductible is met.")
                actions.append("Approve claim for fast-track automated payout.")

            # Deterministic Fallback Questions
            questions = []
            if policy_line == "Auto":
                questions.append("Can you provide the exact sequence of events leading up to the collision?")
                questions.append("Were there any independent witnesses or dashcam/surveillance footage available?")
                if filing_delay > 14:
                    questions.append(f"What caused the {filing_delay}-day delay between the incident date and filing date?")
                if siu_needed:
                    questions.append("How did you select the repair facility and legal representation retained for this claim?")
            elif policy_line == "Fire":
                questions.append("Was the premises occupied at the exact time the fire ignited?")
                questions.append("Can you provide itemized purchase receipts or tax documentation for claimed high-value items?")
                if siu_needed:
                    questions.append("Has the local fire marshal concluded their official origin-and-cause investigation?")
            else:
                questions.append("Can you describe the circumstances and environmental conditions when the loss occurred?")
                questions.append("Are there timestamped photos of the damaged property prior to mitigation efforts?")

        # 4. Investigation Notes
        notes = (
            f"Triage recommendation: {disposition} (Priority: {priority}). "
            f"Assigned risk score is {risk_score}/100. "
            f"{'SIU escalation warranted due to: ' + '; '.join(siu_reasons) if siu_needed else 'Claim exhibits routine characteristics eligible for standard processing.'}"
        )

        # 5. Citations
        citations = [
            EvidenceCitation(
                source_type="ML_MODEL",
                reference_id="Ensemble_Triage",
                field_name="suggested_disposition",
                field_value=disposition,
                snippet=f"Recommended triage disposition based on risk score {risk_score} and {len(anomalies)} anomaly flags."
            )
        ]

        output = InvestigationAgentOutput(
            suggested_disposition=disposition,
            priority_level=priority,
            recommended_actions=actions,
            interview_questions_for_claimant=questions,
            siu_referral_needed=siu_needed,
            siu_referral_reasons=siu_reasons,
            investigation_notes=notes,
            citations=citations
        )

        a2a_msg = A2AMessage(
            from_agent="InvestigationSupportAgent",
            to_agent="Orchestrator",
            handoff_type="FINAL_DOSSIER_READY",
            payload={
                "claim_id": claim_id,
                "disposition": disposition,
                "priority": priority,
                "siu_referral": siu_needed
            }
        )

        return output, a2a_msg
