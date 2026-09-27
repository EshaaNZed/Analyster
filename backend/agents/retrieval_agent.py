"""
Agent 1: Claims Retrieval Agent
================================
Specialized in dense semantic narrative retrieval (ChromaDB) and
structural entity traversal (NetworkX Knowledge Graph).
Retrieves precedent claims, policy portfolio history, and household cluster signals.
"""
import sqlite3
import os
from typing import Dict, Any, Tuple

from backend.agents.schemas import (
    RetrievalAgentOutput,
    SimilarPrecedent,
    EvidenceCitation,
    A2AMessage
)
from backend.knowledge_base.hybrid_retriever import HybridGraphRAGRetriever, get_default_retriever

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_PATH  = os.path.join(BASE_DIR, "data", "processed", "claims_intelligence.db")


class ClaimsRetrievalAgent:
    """Agent 1: Specialized in hybrid vector + graph claims retrieval."""

    def __init__(self, retriever: HybridGraphRAGRetriever = None):
        self.retriever = retriever or get_default_retriever()

    def process_claim(self, claim_data: Dict[str, Any], top_k: int = 4) -> Tuple[RetrievalAgentOutput, A2AMessage]:
        """
        Executes hybrid retrieval for a given claim record.
        Returns:
          - RetrievalAgentOutput with structured precedents & graph context
          - A2AMessage ready for handoff to Agent 2 (Risk Analysis Agent)
        """
        claim_id = claim_data["claim_id"]
        customer_id = claim_data["customer_id"]
        policy_line = claim_data.get("policy_line", "Auto")

        # 1. Execute Hybrid Search
        retrieval_res = self.retriever.retrieve_claim_context(claim_id=claim_id, top_k=top_k)

        # 2. Extract similar precedent models
        precedents = []
        citations = []

        for sc in retrieval_res.similar_claims:
            precedents.append(SimilarPrecedent(
                claim_id=sc.claim_id,
                policy_line=sc.policy_line,
                similarity_score=round(float(sc.similarity_score), 4),
                claim_amount_usd=float(sc.claim_amount_usd),
                incident_type=sc.incident_type,
                claim_status=sc.claim_status,
                risk_label=sc.risk_label,
                incident_narrative=sc.document_snippet[:250] + "..." if len(sc.document_snippet) > 250 else sc.document_snippet
            ))

            citations.append(EvidenceCitation(
                source_type="VECTOR_STORE",
                reference_id=sc.claim_id,
                field_name="incident_narrative",
                field_value=f"${sc.claim_amount_usd:,.2f} ({sc.claim_status})",
                snippet=f"Similar precedent with similarity {sc.similarity_score:.2f}: {sc.incident_type}"
            ))

        # 3. Retrieve Customer's Active Policy Portfolio from SQLite
        policies = []
        try:
            with sqlite3.connect(DB_PATH) as conn:
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                rows = cur.execute(
                    "SELECT policy_id, policy_line, coverage_limit_usd, annual_premium_usd, policy_status FROM dim_policies WHERE customer_id = ?",
                    (customer_id,)
                ).fetchall()
                for r in rows:
                    policies.append(dict(r))
                    citations.append(EvidenceCitation(
                        source_type="RELATIONAL_DB",
                        reference_id=r["policy_id"],
                        field_name="coverage_limit_usd",
                        field_value=f"${r['coverage_limit_usd']:,.2f}",
                        snippet=f"Active {r['policy_line']} policy with annual premium ${r['annual_premium_usd']:,.2f}"
                    ))
        except Exception as e:
            print(f"[RETRIEVAL AGENT] DB query error: {e}")

        # 4. Generate Retrieval Summary
        precedent_lines = [p.policy_line for p in precedents]
        summary_text = (
            f"Retrieved {len(precedents)} historical precedent claims across {', '.join(set(precedent_lines)) or policy_line}. "
            f"Customer holds {len(policies)} active policy contracts. "
            f"Graph analysis identified {retrieval_res.graph_context.get('node_count', 0)} related entities in 2-hop neighborhood. "
        )
        if retrieval_res.household_risk_flags:
            summary_text += f"Household cluster alert: {'; '.join(retrieval_res.household_risk_flags)}."

        output = RetrievalAgentOutput(
            precedent_claims=precedents,
            customer_active_policies=policies,
            graph_context=retrieval_res.graph_context,
            household_risk_flags=retrieval_res.household_risk_flags,
            retrieval_summary=summary_text,
            citations=citations
        )

        # 5. Build A2A Handoff Message to Agent 2 (Risk Analysis Agent)
        a2a_msg = A2AMessage(
            from_agent="ClaimsRetrievalAgent",
            to_agent="ClaimsRiskAnalysisAgent",
            handoff_type="PRECEDENT_AND_PORTFOLIO_CONTEXT",
            payload={
                "claim_id": claim_id,
                "precedent_count": len(precedents),
                "top_precedent_similarity": precedents[0].similarity_score if precedents else 0.0,
                "household_flags": retrieval_res.household_risk_flags,
                "total_active_policies": len(policies)
            }
        )

        return output, a2a_msg
