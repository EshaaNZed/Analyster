"""
Hybrid Graph-RAG Retrieval Engine
===================================
The core brain of Step 3.  Fuses two complementary retrieval signals:

  1. Dense Vector Search  (ChromaDB)  — semantic similarity on narratives
  2. Graph Traversal      (NetworkX)  — structural relationship context

Produces a single enriched HybridRetrievalResult per query that combines:
  - Top-k semantically similar claims
  - 2-hop graph context (Customer -> Policy -> Claim neighbours)
  - Household cluster risk co-membership signals
  - Final Reciprocal Rank Fusion (RRF) merged ranked list

Public API
----------
  hybrid_search(query, top_k, policy_line_filter)  -> HybridRetrievalResult
  retrieve_claim_context(claim_id, top_k)           -> HybridRetrievalResult
"""
import os
import json
import sqlite3
import warnings
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Any, Optional, Tuple

import pandas as pd
import networkx as nx

warnings.filterwarnings("ignore")

BASE_DIR      = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")
DB_PATH       = os.path.join(PROCESSED_DIR, "claims_intelligence.db")


# --------------------------------------------------------------------------- #
# Result Data Structures
# --------------------------------------------------------------------------- #

@dataclass
class SimilarClaim:
    rank:             int
    claim_id:         str
    similarity_score: float
    retrieval_source: str        # "vector" | "graph" | "hybrid"
    policy_line:      str
    incident_type:    str
    incident_severity: str
    claim_amount_usd: float
    claim_status:     str
    risk_label:       str
    is_anomaly:       bool
    customer_subtype: str
    incident_date:    str
    document_snippet: str = ""
    rrf_score:        float = 0.0


@dataclass
class HybridRetrievalResult:
    query:               str
    query_claim_id:      Optional[str]
    top_k:               int
    total_vector_hits:   int
    total_graph_hits:    int
    similar_claims:      List[SimilarClaim] = field(default_factory=list)
    graph_context:       Dict[str, Any]     = field(default_factory=dict)
    household_risk_flags: List[str]         = field(default_factory=list)
    retrieval_metadata:  Dict[str, Any]     = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["similar_claims"] = [asdict(c) for c in self.similar_claims]
        return d


# --------------------------------------------------------------------------- #
# RRF Merging
# --------------------------------------------------------------------------- #

def _reciprocal_rank_fusion(
    vector_ids: List[str],
    graph_ids:  List[str],
    k: int = 60,
) -> List[Tuple[str, float]]:
    """
    Merges two ranked lists using Reciprocal Rank Fusion.
    Higher RRF score = more relevant from both signals.
    """
    scores: Dict[str, float] = {}
    for rank, claim_id in enumerate(vector_ids, start=1):
        scores[claim_id] = scores.get(claim_id, 0.0) + 1.0 / (k + rank)
    for rank, claim_id in enumerate(graph_ids, start=1):
        scores[claim_id] = scores.get(claim_id, 0.0) + 1.0 / (k + rank)
    return sorted(scores.items(), key=lambda x: x[1], reverse=True)


# --------------------------------------------------------------------------- #
# SQLite Fetch Helpers
# --------------------------------------------------------------------------- #

def _fetch_claim_details(claim_ids: List[str], db_path: str = DB_PATH) -> Dict[str, Dict[str, Any]]:
    """Batch-fetch claim dossier rows for the given claim IDs."""
    if not claim_ids:
        return {}
    placeholders = ",".join(["?" for _ in claim_ids])
    conn = sqlite3.connect(db_path)
    df = pd.read_sql_query(
        f"SELECT * FROM v_claims_full_dossier WHERE claim_id IN ({placeholders})",
        conn, params=claim_ids
    )
    conn.close()
    return {row["claim_id"]: row.to_dict() for _, row in df.iterrows()}


# --------------------------------------------------------------------------- #
# Main Hybrid Retrieval Engine
# --------------------------------------------------------------------------- #

class HybridGraphRAGRetriever:
    """
    Stateful retriever that holds pre-loaded vector collection and graph in memory.
    Designed to be instantiated once and reused across all agent calls.
    """

    def __init__(
        self,
        collection=None,    # ChromaDB collection object
        graph: Optional[nx.DiGraph] = None,
        db_path: str = DB_PATH,
    ):
        self.collection = collection
        self.graph      = graph
        self.db_path    = db_path

    # ------------------------------------------------------------------ #
    # Query-based retrieval (free-text adjuster query)
    # ------------------------------------------------------------------ #

    def hybrid_search(
        self,
        query: str,
        top_k: int = 5,
        policy_line_filter: Optional[str] = None,
    ) -> HybridRetrievalResult:
        """
        Runs a hybrid retrieval from a free-text natural language query.
        Fuses dense vector results with graph neighborhood signals.
        """
        from backend.knowledge_base.vector_store import semantic_search

        # --- 1. Dense vector search ---
        where_filter = {"policy_line": policy_line_filter} if policy_line_filter else None
        vector_results = semantic_search(
            query=query, top_k=top_k * 2,
            where_filter=where_filter,
            collection=self.collection
        )
        vector_ids  = [r["claim_id"] for r in vector_results]
        vector_meta = {r["claim_id"]: r for r in vector_results}

        # --- 2. Graph-based context retrieval ---
        graph_ids = self._graph_keyword_neighbors(query, top_k=top_k * 2)

        # --- 3. RRF fusion ---
        fused = _reciprocal_rank_fusion(vector_ids, graph_ids)[:top_k]
        final_ids = [cid for cid, _ in fused]
        rrf_scores = {cid: score for cid, score in fused}

        # --- 4. Fetch full detail rows ---
        detail_map = _fetch_claim_details(final_ids, self.db_path)

        # --- 5. Build structured result ---
        similar_claims = []
        for rank, claim_id in enumerate(final_ids, start=1):
            detail = detail_map.get(claim_id, {})
            vmeta  = vector_meta.get(claim_id, {})
            in_vector = claim_id in vector_ids
            in_graph  = claim_id in graph_ids
            source    = "hybrid" if (in_vector and in_graph) else ("vector" if in_vector else "graph")

            similar_claims.append(SimilarClaim(
                rank=rank,
                claim_id=claim_id,
                similarity_score=float(vmeta.get("metadata", {}).get("claim_amount_usd", 0.0)),
                retrieval_source=source,
                policy_line=detail.get("policy_line", ""),
                incident_type=detail.get("incident_type", ""),
                incident_severity=detail.get("incident_severity", ""),
                claim_amount_usd=float(detail.get("claim_amount_usd", 0.0)),
                claim_status=detail.get("claim_status", ""),
                risk_label=detail.get("risk_label", ""),
                is_anomaly=bool(detail.get("is_anomaly_ground_truth", False)),
                customer_subtype=detail.get("customer_subtype_name", ""),
                incident_date=detail.get("incident_date", ""),
                document_snippet=vmeta.get("document_snippet", ""),
                rrf_score=rrf_scores.get(claim_id, 0.0),
            ))

        return HybridRetrievalResult(
            query=query,
            query_claim_id=None,
            top_k=top_k,
            total_vector_hits=len(vector_ids),
            total_graph_hits=len(graph_ids),
            similar_claims=similar_claims,
            retrieval_metadata={
                "vector_results_fetched": len(vector_ids),
                "graph_neighbors_fetched": len(graph_ids),
                "rrf_fusion_applied": True,
                "policy_line_filter": policy_line_filter,
            }
        )

    # ------------------------------------------------------------------ #
    # Claim-ID-based retrieval (given a specific claim under review)
    # ------------------------------------------------------------------ #

    def retrieve_claim_context(
        self,
        claim_id: str,
        top_k: int = 5,
    ) -> HybridRetrievalResult:
        """
        Given a claim_id under review, retrieves:
        1. k semantically similar historical claims (vector)
        2. 2-hop graph context (customer + policy + risk cluster neighbours)
        3. Household co-cluster risk flags
        """
        from backend.knowledge_base.vector_store import get_similar_claims
        from backend.knowledge_base.graph_store import get_claim_context_subgraph

        # --- 1. Vector: similar historical claims ---
        vector_results = get_similar_claims(
            claim_id=claim_id, top_k=top_k * 2,
            exclude_self=True, collection=self.collection
        )
        vector_ids  = [r["claim_id"] for r in vector_results]
        vector_meta = {r["claim_id"]: r for r in vector_results}

        # --- 2. Graph: structural context ---
        graph_ctx = {}
        graph_neighbors = []
        if self.graph and self.graph.has_node(claim_id):
            graph_ctx       = get_claim_context_subgraph(self.graph, claim_id)
            graph_neighbors = self._graph_claim_neighbors(claim_id)
        
        # --- 3. RRF fusion ---
        fused     = _reciprocal_rank_fusion(vector_ids, graph_neighbors)[:top_k]
        final_ids = [cid for cid, _ in fused]
        rrf_scores = {cid: score for cid, score in fused}

        # --- 4. Full detail rows ---
        detail_map = _fetch_claim_details(final_ids, self.db_path)

        # --- 5. Household risk flags ---
        household_flags = self._detect_household_risk_flags(claim_id)

        # --- 6. Build result ---
        similar_claims = []
        for rank, cid in enumerate(final_ids, start=1):
            detail = detail_map.get(cid, {})
            vmeta  = vector_meta.get(cid, {})
            in_v   = cid in vector_ids
            in_g   = cid in graph_neighbors
            source = "hybrid" if (in_v and in_g) else ("vector" if in_v else "graph")

            similar_claims.append(SimilarClaim(
                rank=rank,
                claim_id=cid,
                similarity_score=float(vmeta.get("similarity_score", 0.0)),
                retrieval_source=source,
                policy_line=detail.get("policy_line", ""),
                incident_type=detail.get("incident_type", ""),
                incident_severity=detail.get("incident_severity", ""),
                claim_amount_usd=float(detail.get("claim_amount_usd", 0.0)),
                claim_status=detail.get("claim_status", ""),
                risk_label=detail.get("risk_label", ""),
                is_anomaly=bool(detail.get("is_anomaly_ground_truth", False)),
                customer_subtype=detail.get("customer_subtype_name", ""),
                incident_date=detail.get("incident_date", ""),
                document_snippet=vmeta.get("document_snippet", ""),
                rrf_score=rrf_scores.get(cid, 0.0),
            ))

        return HybridRetrievalResult(
            query=f"Similar claims to {claim_id}",
            query_claim_id=claim_id,
            top_k=top_k,
            total_vector_hits=len(vector_ids),
            total_graph_hits=len(graph_neighbors),
            similar_claims=similar_claims,
            graph_context=graph_ctx,
            household_risk_flags=household_flags,
            retrieval_metadata={
                "source_claim_id": claim_id,
                "rrf_fusion_applied": True,
                "graph_nodes_in_context": graph_ctx.get("node_count", 0),
            }
        )

    # ------------------------------------------------------------------ #
    # Graph helpers
    # ------------------------------------------------------------------ #

    def _graph_keyword_neighbors(self, query: str, top_k: int = 10) -> List[str]:
        """
        Naïve keyword-based graph search: finds Claim nodes whose incident_type
        or policy_line attributes contain query keywords.
        Used as the 'graph' leg of hybrid search for free-text queries.
        """
        if self.graph is None:
            return []

        keywords = set(query.lower().split())
        scored: List[Tuple[str, int]] = []

        for node_id, data in self.graph.nodes(data=True):
            if data.get("node_type") != "Claim":
                continue
            text = " ".join([
                str(data.get("incident_type", "")),
                str(data.get("policy_line", "")),
                str(data.get("claim_status", "")),
            ]).lower()
            hits = sum(1 for kw in keywords if kw in text)
            if hits > 0:
                scored.append((node_id, hits))

        scored.sort(key=lambda x: x[1], reverse=True)
        return [cid for cid, _ in scored[:top_k]]

    def _graph_claim_neighbors(self, claim_id: str, depth: int = 2) -> List[str]:
        """
        Returns Claim node IDs in the 2-hop undirected neighbourhood of claim_id.
        Finds structurally similar claims sharing the same customer, policy type,
        household cluster, or incident type.
        """
        if self.graph is None or not self.graph.has_node(claim_id):
            return []

        undirected = self.graph.to_undirected()
        ego = nx.ego_graph(undirected, claim_id, radius=depth)
        claim_neighbors = [
            n for n in ego.nodes
            if n != claim_id and self.graph.nodes[n].get("node_type") == "Claim"
        ]
        return claim_neighbors

    def _detect_household_risk_flags(self, claim_id: str) -> List[str]:
        """
        Checks if other members of the same household cluster have
        anomalous or under-investigation claims — a key fraud ring signal.
        """
        if self.graph is None or not self.graph.has_node(claim_id):
            return []

        flags = []
        undirected = self.graph.to_undirected()

        # Walk from claim_id -> customer -> household cluster -> other customers
        for customer_id in self.graph.predecessors(claim_id):
            if self.graph.nodes[customer_id].get("node_type") != "Customer":
                continue

            for hh_cluster in undirected.neighbors(customer_id):
                if "HH_CLUSTER" not in str(hh_cluster):
                    continue

                # Check co-members in the same household cluster
                for co_member in undirected.neighbors(hh_cluster):
                    if co_member == customer_id:
                        continue
                    if self.graph.nodes.get(co_member, {}).get("node_type") != "Customer":
                        continue

                    # Check if co-member has anomalous claims
                    for claim_nb in self.graph.successors(co_member):
                        if self.graph.nodes.get(claim_nb, {}).get("node_type") != "Claim":
                            continue
                        if self.graph.nodes[claim_nb].get("is_anomaly"):
                            flags.append(
                                f"Household co-member {co_member} has anomalous claim {claim_nb}"
                            )
        return flags[:5]   # cap at 5 flags


# Singleton helper
_default_hybrid_retriever = None

def get_default_retriever() -> HybridGraphRAGRetriever:
    global _default_hybrid_retriever
    if _default_hybrid_retriever is None:
        from backend.knowledge_base.vector_store import get_claims_collection
        from backend.knowledge_base.graph_store import load_graph
        collection = get_claims_collection()
        graph = load_graph()
        _default_hybrid_retriever = HybridGraphRAGRetriever(collection=collection, graph=graph)
    return _default_hybrid_retriever
