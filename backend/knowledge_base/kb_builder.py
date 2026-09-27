"""
Knowledge Base Builder — Master Runner for Step 3
==================================================
Orchestrates the complete knowledge base construction:
  1. ChromaDB vector store (incident narrative embeddings)
  2. NetworkX knowledge graph (entity-relationship ontology)
  3. Validates the hybrid retrieval engine with smoke tests
  4. Exports knowledge base statistics to docs/
"""
import os
import sys
import json
import time

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DOCS_DIR  = os.path.join(BASE_DIR, "docs")
os.makedirs(DOCS_DIR, exist_ok=True)

from backend.knowledge_base.vector_store  import build_vector_store, semantic_search, get_similar_claims
from backend.knowledge_base.graph_store   import build_knowledge_graph, get_graph_stats, detect_suspicious_clusters
from backend.knowledge_base.hybrid_retriever import HybridGraphRAGRetriever


def run_smoke_tests(retriever: HybridGraphRAGRetriever) -> dict:
    """
    Runs 3 representative retrieval smoke tests to validate the knowledge base.
    Returns a test results dict written to docs/KB_SMOKE_TEST_RESULTS.json.
    """
    results = {"tests": []}

    # ---- Test 1: Free-text semantic query ----
    t1_start = time.time()
    r1 = retriever.hybrid_search(
        query="suspicious fire claim shortly after policy start inflated damage",
        top_k=5
    )
    t1_elapsed = round(time.time() - t1_start, 3)
    results["tests"].append({
        "test": "Free-text semantic query (fraud fire pattern)",
        "query": r1.query,
        "latency_sec": t1_elapsed,
        "total_results": len(r1.similar_claims),
        "top_result_claim_id": r1.similar_claims[0].claim_id if r1.similar_claims else None,
        "top_result_policy_line": r1.similar_claims[0].policy_line if r1.similar_claims else None,
        "vector_hits": r1.total_vector_hits,
        "graph_hits": r1.total_graph_hits,
        "status": "PASSED" if len(r1.similar_claims) > 0 else "FAILED",
    })

    # ---- Test 2: Policy-line filtered search ----
    t2_start = time.time()
    r2 = retriever.hybrid_search(
        query="rear end collision intersection damage repair cost",
        top_k=5,
        policy_line_filter="Auto"
    )
    t2_elapsed = round(time.time() - t2_start, 3)
    results["tests"].append({
        "test": "Policy-line filtered semantic search (Auto claims only)",
        "query": r2.query,
        "latency_sec": t2_elapsed,
        "total_results": len(r2.similar_claims),
        "top_result_claim_id": r2.similar_claims[0].claim_id if r2.similar_claims else None,
        "policy_filter_applied": "Auto",
        "all_results_correct_line": all(
            c.policy_line == "Auto" for c in r2.similar_claims
        ),
        "vector_hits": r2.total_vector_hits,
        "status": "PASSED" if len(r2.similar_claims) > 0 else "FAILED",
    })

    # ---- Test 3: Claim-ID context retrieval ----
    t3_start = time.time()
    test_claim_id = "CLM-2024-00001"
    r3 = retriever.retrieve_claim_context(claim_id=test_claim_id, top_k=5)
    t3_elapsed = round(time.time() - t3_start, 3)
    results["tests"].append({
        "test": "Claim-ID context retrieval with graph context",
        "source_claim_id": test_claim_id,
        "latency_sec": t3_elapsed,
        "similar_claims_found": len(r3.similar_claims),
        "graph_nodes_in_context": r3.graph_context.get("node_count", 0),
        "graph_edges_in_context": r3.graph_context.get("edge_count", 0),
        "household_risk_flags": r3.household_risk_flags,
        "vector_hits": r3.total_vector_hits,
        "graph_hits": r3.total_graph_hits,
        "status": "PASSED" if len(r3.similar_claims) > 0 else "FAILED",
    })

    all_passed = all(t["status"] == "PASSED" for t in results["tests"])
    results["overall_status"] = "PASSED" if all_passed else "PARTIAL"
    results["passed_count"] = sum(1 for t in results["tests"] if t["status"] == "PASSED")
    results["total_tests"] = len(results["tests"])
    return results


def build_knowledge_base():
    print("=" * 70)
    print("[KB BUILDER] STEP 3: BUILDING HYBRID GRAPH-RAG KNOWLEDGE BASE")
    print("=" * 70)
    start_total = time.time()

    # --- 1. Build ChromaDB Vector Store ---
    print("\n[STEP 3.1] Building ChromaDB Semantic Vector Store...")
    t_vec = time.time()
    collection = build_vector_store(force_rebuild=False)
    print(f"[STEP 3.1] Vector store ready. ({round(time.time()-t_vec, 1)}s)")

    # --- 2. Build NetworkX Knowledge Graph ---
    print("\n[STEP 3.2] Building NetworkX Insurance Knowledge Graph...")
    t_graph = time.time()
    G = build_knowledge_graph(force_rebuild=False)
    stats = get_graph_stats(G)
    print(f"[STEP 3.2] Graph ready: {stats['total_nodes']} nodes, {stats['total_edges']} edges. ({round(time.time()-t_graph, 1)}s)")

    # Print node type breakdown
    for ntype, count in stats["node_types"].items():
        print(f"    {ntype}: {count}")

    # --- 3. Fraud Cluster Detection ---
    print("\n[STEP 3.3] Running Suspicious Cluster Detection...")
    suspicious = detect_suspicious_clusters(G, min_anomaly_claims=2)
    print(f"[STEP 3.3] Detected {len(suspicious)} suspicious customer clusters with multiple anomalous claims.")

    # --- 4. Initialize Hybrid Retriever ---
    print("\n[STEP 3.4] Initializing Hybrid Graph-RAG Retriever...")
    retriever = HybridGraphRAGRetriever(collection=collection, graph=G)

    # --- 5. Smoke Tests ---
    print("\n[STEP 3.5] Running Knowledge Base Smoke Tests...")
    smoke_results = run_smoke_tests(retriever)
    print(f"[STEP 3.5] Smoke Tests: {smoke_results['overall_status']} ({smoke_results['passed_count']}/{smoke_results['total_tests']})")

    for t in smoke_results["tests"]:
        status_str = "[PASS]" if t["status"] == "PASSED" else "[FAIL]"
        print(f"    {status_str} {t['test']} ({t.get('latency_sec', '?')}s)")

    # --- 6. Save Knowledge Base Summary Report ---
    kb_report = {
        "step": "Step 3 — Hybrid Graph-RAG Knowledge Base",
        "status": smoke_results["overall_status"],
        "elapsed_total_sec": round(time.time() - start_total, 2),
        "vector_store": {
            "collection_name": "insurance_claims",
            "embedding_model": "all-MiniLM-L6-v2",
            "total_documents": collection.count(),
        },
        "knowledge_graph": stats,
        "suspicious_clusters_detected": len(suspicious),
        "smoke_tests": smoke_results,
    }

    report_path = os.path.join(DOCS_DIR, "KB_REPORT.json")
    with open(report_path, "w") as f:
        json.dump(kb_report, f, indent=2)

    smoke_path = os.path.join(DOCS_DIR, "KB_SMOKE_TEST_RESULTS.json")
    with open(smoke_path, "w") as f:
        json.dump(smoke_results, f, indent=2)

    print(f"\n[KB BUILDER] Reports saved -> {report_path}")
    print("=" * 70)
    print(f"[KB BUILDER] STEP 3 COMPLETED IN {round(time.time()-start_total, 2)}s")
    print("=" * 70)
    return retriever, kb_report


if __name__ == "__main__":
    build_knowledge_base()
