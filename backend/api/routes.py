"""
Claims Intelligence API Routes
===============================
All REST endpoints for the Claims Intelligence Microservice.
Serves the React Reviewer Dashboard with claim data, agent analysis,
knowledge graph subgraphs, and dashboard statistics.
"""
import os
import math
import sqlite3
import traceback
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from backend.api.models import (
    ClaimSummaryResponse,
    ClaimListResponse,
    ClaimDetailResponse,
    GraphNode,
    GraphEdge,
    GraphResponse,
    AnalyzeDossierResponse,
    AgentStepResponse,
    DashboardStatsResponse,
    HealthResponse,
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_PATH = os.path.join(BASE_DIR, "data", "processed", "claims_intelligence.db")

router = APIRouter()

# ─── Lazy-loaded singletons (avoid heavy init at import time) ────────────────
_orchestrator = None
_graph = None


def _get_db():
    """Get a fresh SQLite connection with row factory."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _get_orchestrator():
    """Lazy-load the multi-agent orchestrator (heavy initialization)."""
    global _orchestrator
    if _orchestrator is None:
        from backend.agents.orchestrator import ClaimsIntelligenceOrchestrator
        _orchestrator = ClaimsIntelligenceOrchestrator()
    return _orchestrator


def _get_graph():
    """Lazy-load the NetworkX knowledge graph."""
    global _graph
    if _graph is None:
        from backend.knowledge_base.graph_store import load_graph
        _graph = load_graph()
    return _graph


# ═════════════════════════════════════════════════════════════════════════════
# HEALTH CHECK
# ═════════════════════════════════════════════════════════════════════════════

@router.get("/health", response_model=HealthResponse, tags=["System"])
def health_check():
    """System health check — verifies database, vector store, and graph connectivity."""
    status = HealthResponse(status="healthy", version="1.0.0")

    # Check database
    try:
        conn = _get_db()
        conn.execute("SELECT 1").fetchone()
        conn.close()
        status.database_connected = True
    except Exception:
        status.database_connected = False

    # Check graph store
    try:
        g = _get_graph()
        status.graph_store_loaded = g is not None and len(g.nodes) > 0
    except Exception:
        status.graph_store_loaded = False

    # Check vector store
    try:
        from backend.knowledge_base.vector_store import get_claims_collection
        coll = get_claims_collection()
        status.vector_store_connected = coll is not None and coll.count() > 0
    except Exception:
        status.vector_store_connected = False

    # Check agents (just verify orchestrator instance, don't re-init if not loaded)
    status.agents_ready = _orchestrator is not None

    # Check Gemini LLM Service
    try:
        from backend.agents.llm_service import get_llm_service
        llm = get_llm_service()
        status.llm_active = llm.is_available()
        status.llm_provider = "Google Gemini"
        status.llm_model = llm.model_name
    except Exception:
        status.llm_active = False

    return status


# ═════════════════════════════════════════════════════════════════════════════
# DASHBOARD STATISTICS
# ═════════════════════════════════════════════════════════════════════════════

@router.get("/dashboard/stats", response_model=DashboardStatsResponse, tags=["Dashboard"])
def get_dashboard_stats():
    """Aggregate statistics for the reviewer dashboard overview panel."""
    conn = _get_db()
    try:
        cur = conn.cursor()

        # Total and risk breakdown
        total = cur.execute("SELECT COUNT(*) FROM fact_claims").fetchone()[0]
        risk_rows = cur.execute(
            "SELECT risk_label, COUNT(*) as cnt FROM fact_claims GROUP BY risk_label"
        ).fetchall()
        risk_dist = {row["risk_label"]: row["cnt"] for row in risk_rows}

        # Anomaly count
        anomaly_count = cur.execute(
            "SELECT COUNT(*) FROM fact_claims WHERE is_anomaly_ground_truth = 1"
        ).fetchone()[0]

        # Financial aggregates
        fin = cur.execute(
            "SELECT SUM(claim_amount_usd) as total_exposure, AVG(claim_amount_usd) as avg_amount FROM fact_claims"
        ).fetchone()

        # Policy line breakdown
        line_rows = cur.execute(
            "SELECT policy_line, COUNT(*) as cnt FROM fact_claims GROUP BY policy_line ORDER BY cnt DESC"
        ).fetchall()
        policy_lines = {row["policy_line"]: row["cnt"] for row in line_rows}

        # Incident type breakdown (top 10)
        type_rows = cur.execute(
            "SELECT incident_type, COUNT(*) as cnt FROM fact_claims GROUP BY incident_type ORDER BY cnt DESC LIMIT 10"
        ).fetchall()
        incident_types = {row["incident_type"]: row["cnt"] for row in type_rows}

        return DashboardStatsResponse(
            total_claims=total,
            high_risk_count=risk_dist.get("High", 0),
            medium_risk_count=risk_dist.get("Medium", 0),
            low_risk_count=risk_dist.get("Low", 0),
            anomaly_count=anomaly_count,
            total_exposure_usd=round(fin["total_exposure"] or 0, 2),
            avg_claim_amount_usd=round(fin["avg_amount"] or 0, 2),
            policy_lines=policy_lines,
            incident_types=incident_types,
            risk_distribution=risk_dist,
        )
    finally:
        conn.close()


# ═════════════════════════════════════════════════════════════════════════════
# CLAIMS LIST & SEARCH
# ═════════════════════════════════════════════════════════════════════════════

@router.get("/claims", response_model=ClaimListResponse, tags=["Claims"])
def list_claims(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(20, ge=1, le=100, description="Results per page"),
    risk_label: Optional[str] = Query(None, description="Filter: Low, Medium, High"),
    policy_line: Optional[str] = Query(None, description="Filter: Auto, Fire, Boat, etc."),
    search: Optional[str] = Query(None, description="Search claim_id, customer_id, or narrative"),
    sort_by: Optional[str] = Query("claim_amount_usd", description="Sort field"),
    sort_order: Optional[str] = Query("desc", description="asc or desc"),
):
    """List and search claims with pagination, filtering, and sorting."""
    conn = _get_db()
    try:
        cur = conn.cursor()

        where_clauses = []
        params = []

        if risk_label:
            where_clauses.append("risk_label = ?")
            params.append(risk_label)
        if policy_line:
            where_clauses.append("policy_line = ?")
            params.append(policy_line)
        if search:
            where_clauses.append(
                "(claim_id LIKE ? OR customer_id LIKE ? OR incident_narrative LIKE ?)"
            )
            term = f"%{search}%"
            params.extend([term, term, term])

        where_sql = " WHERE " + " AND ".join(where_clauses) if where_clauses else ""

        # Whitelist sort columns to prevent injection
        allowed_sorts = {
            "claim_amount_usd", "claim_id", "filing_date", "incident_date",
            "claim_to_premium_ratio", "filing_delay_days", "risk_label",
            "claim_to_limit_ratio",
        }
        sort_col = sort_by if sort_by in allowed_sorts else "claim_amount_usd"
        sort_dir = "ASC" if sort_order and sort_order.lower() == "asc" else "DESC"

        # Total count
        total = cur.execute(
            f"SELECT COUNT(*) FROM fact_claims{where_sql}", params
        ).fetchone()[0]

        total_pages = max(1, math.ceil(total / page_size))
        offset = (page - 1) * page_size

        # Fetch page
        rows = cur.execute(
            f"SELECT * FROM fact_claims{where_sql} ORDER BY {sort_col} {sort_dir} LIMIT ? OFFSET ?",
            params + [page_size, offset],
        ).fetchall()

        claims = [
            ClaimSummaryResponse(
                claim_id=r["claim_id"],
                customer_id=r["customer_id"],
                policy_id=r["policy_id"],
                policy_line=r["policy_line"],
                incident_date=r["incident_date"],
                filing_date=r["filing_date"],
                filing_delay_days=r["filing_delay_days"],
                incident_type=r["incident_type"],
                incident_severity=r["incident_severity"],
                claim_amount_usd=r["claim_amount_usd"],
                coverage_limit_usd=r["coverage_limit_usd"],
                claim_to_limit_ratio=r["claim_to_limit_ratio"],
                claim_to_premium_ratio=r["claim_to_premium_ratio"],
                claim_status=r["claim_status"],
                risk_label=r["risk_label"],
                is_anomaly_ground_truth=bool(r["is_anomaly_ground_truth"]),
                incident_narrative=r["incident_narrative"],
            )
            for r in rows
        ]

        return ClaimListResponse(
            claims=claims,
            total_count=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
    finally:
        conn.close()


# ═════════════════════════════════════════════════════════════════════════════
# SINGLE CLAIM DETAIL
# ═════════════════════════════════════════════════════════════════════════════

@router.get("/claims/{claim_id}", response_model=ClaimDetailResponse, tags=["Claims"])
def get_claim_detail(claim_id: str):
    """Full claim record with joined customer and policy context."""
    conn = _get_db()
    try:
        row = conn.execute(
            "SELECT * FROM v_claims_full_dossier WHERE claim_id = ?", (claim_id,)
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail=f"Claim '{claim_id}' not found.")

        return ClaimDetailResponse(
            claim_id=row["claim_id"],
            customer_id=row["customer_id"],
            policy_id=row["policy_id"],
            policy_line=row["policy_line"],
            incident_date=row["incident_date"],
            filing_date=row["filing_date"],
            filing_delay_days=row["filing_delay_days"],
            incident_type=row["incident_type"],
            incident_severity=row["incident_severity"],
            claim_amount_usd=row["claim_amount_usd"],
            coverage_limit_usd=row["coverage_limit_usd"],
            claim_to_limit_ratio=row["claim_to_limit_ratio"],
            estimated_annual_premium_usd=row["annual_premium_usd"] or 0.0,
            claim_to_premium_ratio=row["claim_to_premium_ratio"],
            claim_status=row["claim_status"],
            risk_label=row["risk_label"],
            is_anomaly_ground_truth=bool(row["is_anomaly_ground_truth"]),
            anomaly_reasons=row["anomaly_reasons"] or "NONE",
            incident_narrative=row["incident_narrative"],
            adjuster_notes=row["adjuster_notes"],
            customer_subtype=row["customer_subtype_name"],
            customer_main_type=row["customer_main_type_name"],
            age_group=row["age_group_desc"],
            household_size=row["household_size"],
            annual_premium_usd=row["annual_premium_usd"],
            total_active_policies=row["total_active_policies_count"],
        )
    finally:
        conn.close()


# ═════════════════════════════════════════════════════════════════════════════
# MULTI-AGENT ANALYSIS
# ═════════════════════════════════════════════════════════════════════════════

@router.post("/claims/{claim_id}/analyze", response_model=AnalyzeDossierResponse, tags=["Analysis"])
def analyze_claim(claim_id: str):
    """
    Run the full 5-agent intelligence pipeline on a specific claim.
    Returns a complete Claims Intelligence Dossier with audit trail.
    This is the core endpoint that powers the Reviewer Dashboard.
    """
    # Verify claim exists first
    conn = _get_db()
    try:
        row = conn.execute(
            "SELECT * FROM v_claims_full_dossier WHERE claim_id = ?", (claim_id,)
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail=f"Claim '{claim_id}' not found.")
        claim_data = dict(row)
    finally:
        conn.close()

    # Ensure premium field naming consistency with orchestrator expectations
    if "annual_premium_usd" in claim_data and "estimated_annual_premium_usd" not in claim_data:
        claim_data["estimated_annual_premium_usd"] = claim_data["annual_premium_usd"]

    try:
        orchestrator = _get_orchestrator()
        dossier = orchestrator.process_claim(claim_data)

        # Serialize agent outputs to dicts for JSON response
        return AnalyzeDossierResponse(
            claim_id=dossier.claim_id,
            customer_id=dossier.customer_id,
            policy_id=dossier.policy_id,
            policy_line=dossier.policy_line,
            incident_date=dossier.incident_date,
            filing_date=dossier.filing_date,
            filing_delay_days=dossier.filing_delay_days,
            claim_amount_usd=dossier.claim_amount_usd,
            coverage_limit_usd=dossier.coverage_limit_usd,
            estimated_annual_premium_usd=dossier.estimated_annual_premium_usd,
            incident_narrative=dossier.incident_narrative,
            adjuster_notes=dossier.adjuster_notes,
            retrieval=dossier.retrieval.model_dump() if dossier.retrieval else {},
            risk_analysis=dossier.risk_analysis.model_dump() if dossier.risk_analysis else {},
            anomaly_detection=dossier.anomaly_detection.model_dump() if dossier.anomaly_detection else {},
            summarization=dossier.summarization.model_dump() if dossier.summarization else {},
            investigation_support=dossier.investigation_support.model_dump() if dossier.investigation_support else {},
            a2a_messages=[m.model_dump() for m in dossier.a2a_messages],
            execution_steps=[
                AgentStepResponse(**step) for step in dossier.execution_steps
            ],
            total_latency_ms=dossier.total_latency_ms,
            status=dossier.status,
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Agent pipeline error: {str(e)}"
        )


# ═════════════════════════════════════════════════════════════════════════════
# KNOWLEDGE GRAPH SUBGRAPH EXTRACTION
# ═════════════════════════════════════════════════════════════════════════════

@router.get("/graph/{entity_id}", response_model=GraphResponse, tags=["Graph"])
def get_graph_subgraph(
    entity_id: str,
    depth: int = Query(2, ge=1, le=3, description="Traversal depth (1-3 hops)"),
):
    """
    Extract a subgraph around any entity (customer, policy, claim) for
    interactive vis-network rendering on the frontend.
    """
    graph = _get_graph()
    if graph is None or len(graph.nodes) == 0:
        raise HTTPException(status_code=503, detail="Knowledge graph not loaded.")

    if entity_id not in graph.nodes:
        raise HTTPException(
            status_code=404,
            detail=f"Entity '{entity_id}' not found in knowledge graph."
        )

    # BFS traversal to extract subgraph at specified depth (undirected view for complete relational context)
    undirected = graph.to_undirected(as_view=True)
    visited = set()
    frontier = {entity_id}

    for _ in range(depth):
        next_frontier = set()
        for node in frontier:
            if node not in visited:
                visited.add(node)
                neighbors = list(undirected.neighbors(node))
                if len(visited) + len(neighbors) > 120:
                    neighbors = neighbors[:max(10, 120 - len(visited))]
                next_frontier.update(neighbors)
        frontier = next_frontier - visited
        if len(visited) >= 120:
            break
    visited.update(list(frontier)[:max(0, 120 - len(visited))])

    # Build nodes
    nodes = []
    for nid in visited:
        ndata = graph.nodes[nid]
        node_type = ndata.get("node_type", "unknown")

        # Fallback: infer type from ID prefix when node has no attributes
        if node_type == "unknown":
            nid_str = str(nid)
            if nid_str.startswith("CUST-"):
                node_type = "Customer"
            elif nid_str.startswith("POL-"):
                node_type = "Policy"
            elif nid_str.startswith("CLM-"):
                node_type = "Claim"

        # Determine visual group and label (graph_store uses capitalized constants)
        if node_type == "Customer":
            group = "customer"
            label = nid
            size = 35
        elif node_type == "Policy":
            group = "policy"
            label = nid
            size = 25
        elif node_type == "Claim":
            group = "claim"
            label = nid
            size = 30
        elif node_type == "IncidentType":
            group = "incident_type"
            label = ndata.get("name", nid)
            size = 20
        elif node_type in ("HouseholdCluster", "Household"):
            group = "household"
            label = f"HH-{nid[:8]}"
            size = 20
        elif node_type == "RiskCluster":
            group = "risk_cluster"
            label = ndata.get("name", nid)
            size = 20
        else:
            group = "other"
            label = str(nid)
            size = 15

        nodes.append(GraphNode(
            id=nid,
            label=label,
            group=group,
            title=f"{group.upper()}: {label}",
            size=size,
            metadata={k: str(v) for k, v in ndata.items()},
        ))

    # Build edges
    edges = []
    for u, v, edata in graph.edges(data=True):
        if u in visited and v in visited:
            edges.append(GraphEdge(
                **{
                    "from": u,
                    "to": v,
                    "label": edata.get("relation", ""),
                    "arrows": "to",
                    "metadata": {k: str(val) for k, val in edata.items()},
                }
            ))

    return GraphResponse(
        nodes=nodes,
        edges=edges,
        center_node=entity_id,
        stats={
            "total_nodes": len(nodes),
            "total_edges": len(edges),
            "depth": depth,
        },
    )


# ═════════════════════════════════════════════════════════════════════════════
# CUSTOMER CLAIMS HISTORY
# ═════════════════════════════════════════════════════════════════════════════

@router.get("/customers/{customer_id}/claims", tags=["Customers"])
def get_customer_claims(customer_id: str):
    """All claims for a specific customer — used for history panel."""
    conn = _get_db()
    try:
        rows = conn.execute(
            "SELECT * FROM fact_claims WHERE customer_id = ? ORDER BY filing_date DESC",
            (customer_id,),
        ).fetchall()

        if not rows:
            raise HTTPException(
                status_code=404,
                detail=f"No claims found for customer '{customer_id}'."
            )

        return {
            "customer_id": customer_id,
            "total_claims": len(rows),
            "claims": [dict(r) for r in rows],
        }
    finally:
        conn.close()


# ═════════════════════════════════════════════════════════════════════════════
# CUSTOMER POLICIES
# ═════════════════════════════════════════════════════════════════════════════

@router.get("/customers/{customer_id}/policies", tags=["Customers"])
def get_customer_policies(customer_id: str):
    """All active policies for a specific customer."""
    conn = _get_db()
    try:
        rows = conn.execute(
            "SELECT * FROM dim_policies WHERE customer_id = ? ORDER BY policy_line",
            (customer_id,),
        ).fetchall()

        if not rows:
            raise HTTPException(
                status_code=404,
                detail=f"No policies found for customer '{customer_id}'."
            )

        return {
            "customer_id": customer_id,
            "total_policies": len(rows),
            "policies": [dict(r) for r in rows],
        }
    finally:
        conn.close()


# ═════════════════════════════════════════════════════════════════════════════
# FILTER OPTIONS (for frontend dropdowns)
# ═════════════════════════════════════════════════════════════════════════════

@router.get("/filters", tags=["Dashboard"])
def get_filter_options():
    """Available filter values for the frontend claim explorer dropdowns."""
    conn = _get_db()
    try:
        cur = conn.cursor()

        policy_lines = [
            r[0] for r in cur.execute(
                "SELECT DISTINCT policy_line FROM fact_claims ORDER BY policy_line"
            ).fetchall()
        ]
        risk_labels = [
            r[0] for r in cur.execute(
                "SELECT DISTINCT risk_label FROM fact_claims ORDER BY risk_label"
            ).fetchall()
        ]
        incident_types = [
            r[0] for r in cur.execute(
                "SELECT DISTINCT incident_type FROM fact_claims ORDER BY incident_type"
            ).fetchall()
        ]
        severities = [
            r[0] for r in cur.execute(
                "SELECT DISTINCT incident_severity FROM fact_claims ORDER BY incident_severity"
            ).fetchall()
        ]
        statuses = [
            r[0] for r in cur.execute(
                "SELECT DISTINCT claim_status FROM fact_claims ORDER BY claim_status"
            ).fetchall()
        ]

        return {
            "policy_lines": policy_lines,
            "risk_labels": risk_labels,
            "incident_types": incident_types,
            "severities": severities,
            "claim_statuses": statuses,
        }
    finally:
        conn.close()
