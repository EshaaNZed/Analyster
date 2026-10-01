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
    CustomerPolicySummary,
    CustomerPriorClaim,
    PolicyholderProfile360,
    GraphNode,
    GraphEdge,
    GraphResponse,
    AnalyzeDossierResponse,
    AgentStepResponse,
    DashboardStatsResponse,
    HealthResponse,
    CustomClaimRequest,
    ChatQueryRequest,
    ChatQueryResponse,
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
    """Full claim record with joined customer, policy, and 360 profile context."""
    import datetime
    conn = _get_db()
    try:
        row = conn.execute(
            "SELECT * FROM v_claims_full_dossier WHERE claim_id = ?", (claim_id,)
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail=f"Claim '{claim_id}' not found.")

        cust_id = row["customer_id"]

        # 1. Query all active/known policies for this customer
        pol_rows = conn.execute(
            "SELECT policy_id, policy_line, annual_premium_usd, coverage_limit_usd, policy_status FROM dim_policies WHERE customer_id = ?",
            (cust_id,)
        ).fetchall()
        policies_list = [
            CustomerPolicySummary(
                policy_id=p["policy_id"],
                policy_line=p["policy_line"],
                annual_premium_usd=float(p["annual_premium_usd"] or 0.0),
                coverage_limit_usd=float(p["coverage_limit_usd"] or 0.0),
                policy_status=p["policy_status"] or "Active"
            ) for p in pol_rows
        ]

        # 2. Query all historical claims for this customer
        claim_rows = conn.execute(
            "SELECT claim_id, policy_line, incident_type, claim_amount_usd, incident_date, filing_date, claim_status, risk_label FROM fact_claims WHERE customer_id = ? ORDER BY incident_date DESC",
            (cust_id,)
        ).fetchall()
        prior_claims_list = [
            CustomerPriorClaim(
                claim_id=c["claim_id"],
                policy_line=c["policy_line"],
                incident_type=c["incident_type"],
                claim_amount_usd=float(c["claim_amount_usd"] or 0.0),
                incident_date=c["incident_date"],
                filing_date=c["filing_date"],
                claim_status=c["claim_status"],
                risk_label=c["risk_label"]
            ) for c in claim_rows
        ]

        # 3. Compute rolling time-window frequencies and financial metrics
        try:
            current_inc_date = datetime.date.fromisoformat(row["incident_date"])
        except Exception:
            current_inc_date = datetime.date(2024, 1, 1)

        c_12m, c_24m, c_36m = 0, 0, 0
        total_payout = 0.0
        for c in prior_claims_list:
            total_payout += c.claim_amount_usd
            try:
                c_date = datetime.date.fromisoformat(c.incident_date)
                days_diff = (current_inc_date - c_date).days
                if 0 <= days_diff <= 365:
                    c_12m += 1
                if 0 <= days_diff <= 730:
                    c_24m += 1
                if 0 <= days_diff <= 1095:
                    c_36m += 1
            except Exception:
                pass

        total_annual_spend = float(row["est_annual_insurance_spend_usd"] or row["annual_premium_usd"] or 150.0)
        est_ltv = round(total_annual_spend * 4.5, 2)
        lifetime_premium = round(total_annual_spend * 3.0, 2)
        net_loss_ratio = round((total_payout / max(lifetime_premium, 1.0)) * 100, 1)

        tier = int(row["purchasing_power_tier"] or 4)
        tier_names = {
            1: "Very Low Income / Subsidized Tier",
            2: "Low Income / Hourly Wage Tier",
            3: "Lower Middle Class Tier",
            4: "Middle Class / Average Income",
            5: "Upper Middle Class Tier",
            6: "Affluent / High Earner Tier",
            7: "Very High Income Tier",
            8: "Ultra High Net Worth Tier"
        }

        profile_360 = PolicyholderProfile360(
            customer_id=cust_id,
            customer_subtype=row["customer_subtype_name"] or "Standard Policyholder",
            customer_main_type=row["customer_main_type_name"] or "Private Household",
            age_group=row["age_group_desc"] or "30-50 years",
            household_size=int(row["household_size"] or 3),
            purchasing_power_tier=tier,
            purchasing_power_desc=tier_names.get(tier, f"Tier {tier}"),
            number_of_houses=int(row["number_of_houses"] or 1),
            est_annual_insurance_spend_usd=total_annual_spend,
            total_active_policies=int(row["total_active_policies_count"] or len(policies_list) or 1),
            customer_lifetime_value_usd=est_ltv,
            all_policies=policies_list,
            prior_claims=prior_claims_list,
            claims_last_12m=c_12m,
            claims_last_24m=c_24m,
            claims_last_36m=c_36m,
            total_prior_claims=len(prior_claims_list),
            cumulative_payout_usd=round(total_payout, 2),
            lifetime_premium_paid_usd=lifetime_premium,
            net_loss_ratio=net_loss_ratio
        )

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
            customer_profile=profile_360,
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


@router.post("/claims/evaluate-new", response_model=AnalyzeDossierResponse, tags=["Analysis"])
@router.post("/claims/custom-analyze", response_model=AnalyzeDossierResponse, tags=["Analysis"])
def evaluate_new_claim(payload: CustomClaimRequest):
    """
    Intake and analyze a brand-new, unindexed claim through the 5-agent intelligence swarm.
    
    Accepts arbitrary user/client claim parameters, auto-computes risk exposures,
    finds semantically similar historical precedents via dense embeddings,
    executes the 4-layer ML ensemble + rules, generates grounded Gemini explanations,
    and returns a complete Claims Intelligence Dossier.
    
    Optionally persists the new claim into the SQLite database, vector store, and knowledge graph.
    """
    import uuid
    import datetime

    # 1. Resolve / Default Claim Identifiers and Dates
    unique_suffix = uuid.uuid4().hex[:6].upper()
    claim_id = payload.claim_id.strip() if payload.claim_id else f"CLM-NEW-{unique_suffix}"
    customer_id = payload.customer_id.strip() if payload.customer_id else f"CUST-NEW-{unique_suffix}"
    policy_id = f"POL-NEW-{unique_suffix}"

    today = datetime.date.today()
    filing_date_str = payload.filing_date or today.strftime("%Y-%m-%d")
    delay_days = max(0, int(payload.filing_delay_days))
    if payload.incident_date:
        incident_date_str = payload.incident_date
    else:
        incident_date = today - datetime.timedelta(days=delay_days)
        incident_date_str = incident_date.strftime("%Y-%m-%d")

    # 2. Financial & Exposure Ratios
    claim_amt = float(payload.claim_amount_usd)
    cov_limit = float(payload.coverage_limit_usd) if payload.coverage_limit_usd else max(25000.0, round(claim_amt * 2.5, 2))
    ann_prem = float(payload.annual_premium_usd) if payload.annual_premium_usd else max(1200.0, round(claim_amt * 0.15, 2))

    claim_to_limit = round(claim_amt / max(cov_limit, 1.0), 4)
    claim_to_prem = round(claim_amt / max(ann_prem, 1.0), 2)
    active_pols = 1 if payload.total_active_policies is None else int(payload.total_active_policies)
    household_sz = int(payload.household_size or 3)
    p_tier = int(payload.purchasing_power_tier or 4)

    # 3. Assemble Rich Claim Dossier Payload
    claim_data = {
        "claim_id": claim_id,
        "customer_id": customer_id,
        "policy_id": policy_id,
        "policy_line": payload.policy_line,
        "incident_type": payload.incident_type,
        "incident_severity": payload.incident_severity,
        "claim_amount_usd": claim_amt,
        "coverage_limit_usd": cov_limit,
        "annual_premium_usd": ann_prem,
        "estimated_annual_premium_usd": ann_prem,
        "claim_to_limit_ratio": claim_to_limit,
        "claim_to_premium_ratio": claim_to_prem,
        "filing_delay_days": delay_days,
        "incident_date": incident_date_str,
        "filing_date": filing_date_str,
        "incident_narrative": payload.incident_narrative.strip(),
        "adjuster_notes": payload.adjuster_notes or "First Notice of Loss (FNOL) intake evaluation.",
        "customer_subtype_name": payload.customer_subtype or "Standard Policyholder",
        "customer_main_type_name": payload.customer_main_type or "Standard Client",
        "age_group_desc": payload.age_group or "36-50",
        "household_size": household_sz,
        "total_active_policies_count": active_pols,
        "purchasing_power_tier": p_tier,
        "est_annual_insurance_spend_usd": round(ann_prem * active_pols, 2),
        "claim_status": "Under Review",
        "risk_label": "Unknown",
        "is_anomaly_ground_truth": False,
        "anomaly_reasons": "NONE",
    }

    # 4. Execute Multi-Agent Swarm Orchestrator
    try:
        orchestrator = _get_orchestrator()
        dossier = orchestrator.process_claim(claim_data)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Multi-Agent Evaluation Error: {str(e)}"
        )

    # 5. Optionally Persist New Claim into SQLite DB and Knowledge Stores
    if payload.save_to_database:
        try:
            conn = _get_db()
            cur = conn.cursor()

            # Ensure customer row exists
            cur.execute("""
                INSERT OR IGNORE INTO dim_customers (
                    customer_id, MOSTYPE, customer_subtype_name, customer_main_type_name,
                    age_group_desc, household_size, purchasing_power_tier,
                    est_annual_insurance_spend_usd, total_active_policies_count,
                    household_cluster_signature
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                customer_id, 10, claim_data["customer_subtype_name"],
                claim_data["customer_main_type_name"], claim_data["age_group_desc"],
                household_sz, p_tier, claim_data["est_annual_insurance_spend_usd"],
                active_pols, f"HH-{customer_id}"
            ))

            # Ensure policy row exists
            cur.execute("""
                INSERT OR IGNORE INTO dim_policies (
                    policy_id, customer_id, policy_line, coverage_limit_usd,
                    annual_premium_usd, policy_status, contribution_tier
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                policy_id, customer_id, payload.policy_line, cov_limit,
                ann_prem, "Active", 3
            ))

            # Insert fact_claims row
            risk_tier = dossier.risk_analysis.risk_tier if dossier.risk_analysis else "Medium"
            anomalies = dossier.anomaly_detection.flagged_anomaly_categories if dossier.anomaly_detection else []
            cur.execute("""
                INSERT OR REPLACE INTO fact_claims (
                    claim_id, customer_id, policy_id, policy_line,
                    incident_date, filing_date, filing_delay_days,
                    incident_type, incident_severity, claim_amount_usd,
                    coverage_limit_usd, claim_to_limit_ratio, claim_to_premium_ratio,
                    claim_status, risk_label, is_anomaly_ground_truth,
                    anomaly_reasons, incident_narrative, adjuster_notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                claim_id, customer_id, policy_id, payload.policy_line,
                incident_date_str, filing_date_str, delay_days,
                payload.incident_type, payload.incident_severity, claim_amt,
                cov_limit, claim_to_limit, claim_to_prem,
                "Under Review", risk_tier, (1 if risk_tier == "High" else 0),
                ",".join(anomalies) or "NONE", claim_data["incident_narrative"],
                claim_data["adjuster_notes"]
            ))
            conn.commit()
            conn.close()

            # Index into Vector Store
            try:
                from backend.knowledge_base.vector_store import get_claims_collection
                coll = get_claims_collection()
                if coll:
                    rich_doc = (
                        f"Claim ID: {claim_id}  |  Policy Line: {payload.policy_line}  |  "
                        f"Incident Type: {payload.incident_type}  |  Severity: {payload.incident_severity}  |  "
                        f"Claim Amount USD: {claim_amt:.2f}  |  Risk Label: {risk_tier}  |  "
                        f"Narrative: {claim_data['incident_narrative']}"
                    )
                    coll.upsert(
                        ids=[claim_id],
                        documents=[rich_doc],
                        metadatas=[{
                            "claim_id": claim_id,
                            "customer_id": customer_id,
                            "policy_id": policy_id,
                            "policy_line": payload.policy_line,
                            "incident_type": payload.incident_type,
                            "incident_severity": payload.incident_severity,
                            "claim_status": "Under Review",
                            "risk_label": risk_tier,
                            "is_anomaly": risk_tier == "High",
                            "claim_amount_usd": claim_amt,
                            "claim_to_limit_ratio": claim_to_limit,
                            "filing_delay_days": delay_days,
                            "incident_date": incident_date_str,
                            "customer_subtype": claim_data["customer_subtype_name"],
                            "customer_main_type": claim_data["customer_main_type_name"],
                            "household_cluster": f"HH-{customer_id}",
                        }]
                    )
            except Exception as ve:
                print(f"[API] Vector indexing warning: {ve}")

            # Update in-memory graph
            try:
                g = _get_graph()
                if g is not None:
                    g.add_node(claim_id, node_type="Claim", policy_line=payload.policy_line,
                               incident_type=payload.incident_type, claim_amount_usd=claim_amt,
                               risk_label=risk_tier)
                    g.add_node(policy_id, node_type="Policy", policy_line=payload.policy_line,
                               coverage_limit_usd=cov_limit)
                    g.add_node(customer_id, node_type="Customer", subtype=claim_data["customer_subtype_name"])
                    g.add_edge(customer_id, policy_id, relation="HOLDS_POLICY")
                    g.add_edge(policy_id, claim_id, relation="GENERATED_CLAIM")
            except Exception as ge:
                print(f"[API] Graph update warning: {ge}")

        except Exception as db_err:
            print(f"[API] Warning: Database persistence skipped: {db_err}")

    # 6. Format and Return Response
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


# ═════════════════════════════════════════════════════════════════════════════
# CHATBOT ASSISTANT ENDPOINT
# ═════════════════════════════════════════════════════════════════════════════

@router.post("/chat", response_model=ChatQueryResponse, tags=["Assistant"])
def chat_assistant(payload: ChatQueryRequest):
    """
    Interactive Claims Customer Support Assistant.
    Answers policyholder inquiries regarding claim filing, required documentation,
    status tracking, deductibles, coverage limits, review steps, and timelines with strict safety guardrails.
    """
    try:
        from backend.agents.llm_service import get_llm_service
        llm = get_llm_service()
        res = llm.answer_assistant_query(query=payload.query, context_claim_id=payload.claim_id)
        return ChatQueryResponse(
            response=res.get("response", ""),
            sources=res.get("sources", []),
            suggested_followups=res.get("suggested_followups", []),
            model=res.get("model", "Google Gemini / Grounded KB"),
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Assistant error: {str(e)}")


# ═════════════════════════════════════════════════════════════════════════════
# EVALUATION & VALIDATION METRICS
# ═════════════════════════════════════════════════════════════════════════════

@router.get("/evaluation/metrics", tags=["Evaluation"])
def get_evaluation_metrics():
    """
    Comprehensive evaluation metrics for the Evaluation & Validation Suite.
    Reads pre-computed model metrics, risk scores, and knowledge base stats
    to produce a complete benchmarking payload.
    """
    import json

    models_dir = os.path.join(BASE_DIR, "data", "models")
    processed_dir = os.path.join(BASE_DIR, "data", "processed")
    docs_dir = os.path.join(BASE_DIR, "docs")

    # ── Load model metrics ────────────────────────────────────────────────
    try:
        with open(os.path.join(models_dir, "xgboost_metrics.json"), "r") as f:
            xgb_metrics = json.load(f)
    except Exception:
        xgb_metrics = {}

    try:
        with open(os.path.join(models_dir, "random_forest_metrics.json"), "r") as f:
            rf_metrics = json.load(f)
    except Exception:
        rf_metrics = {}

    try:
        with open(os.path.join(models_dir, "isolation_forest_metrics.json"), "r") as f:
            if_metrics = json.load(f)
    except Exception:
        if_metrics = {}

    # ── Load analytics report for triage and stability ────────────────────
    try:
        with open(os.path.join(docs_dir, "ANALYTICS_REPORT.json"), "r") as f:
            report = json.load(f)
    except Exception:
        report = {}

    # ── Load risk scores for triage stats ─────────────────────────────────
    triage_dist = report.get("triage_distribution", {})
    gt_anomaly_triage = report.get("gt_anomaly_triage", {})
    stability = report.get("stability_check", {})
    total_claims = sum(triage_dist.values()) if triage_dist else 0

    # Compute ground truth recovery rates
    total_gt_anomaly = sum(gt_anomaly_triage.values()) if gt_anomaly_triage else 1
    high_capture = gt_anomaly_triage.get("High", 0)
    medium_capture = gt_anomaly_triage.get("Medium", 0)
    low_leak = gt_anomaly_triage.get("Low", 0)

    ground_truth_recovery = {
        "high_capture_rate": round(high_capture / max(total_gt_anomaly, 1) * 100, 1),
        "medium_capture_rate": round(medium_capture / max(total_gt_anomaly, 1) * 100, 1),
        "low_leak_rate": round(low_leak / max(total_gt_anomaly, 1) * 100, 1),
    }

    anomaly_count = xgb_metrics.get("n_anomaly", 0)
    normal_count = xgb_metrics.get("n_normal", 0)
    total_train = anomaly_count + normal_count
    anomaly_rate = round(anomaly_count / max(total_train, 1) * 100, 2)

    # ── Rule engine metadata ──────────────────────────────────────────────
    try:
        from backend.analytics.rule_engine import get_all_rules_metadata
        rule_metadata = get_all_rules_metadata()
    except Exception:
        rule_metadata = []

    # ── Knowledge base stats ──────────────────────────────────────────────
    retrieval_metrics = {
        "total_vectors": 0,
        "embedding_model": "all-MiniLM-L6-v2",
        "graph_nodes": 0,
        "graph_edges": 0,
    }

    try:
        from backend.knowledge_base.vector_store import get_claims_collection
        coll = get_claims_collection()
        if coll:
            retrieval_metrics["total_vectors"] = coll.count()
    except Exception:
        pass

    try:
        g = _get_graph()
        if g:
            retrieval_metrics["graph_nodes"] = len(g.nodes)
            retrieval_metrics["graph_edges"] = len(g.edges)
    except Exception:
        pass

    return {
        "models": {
            "xgboost": xgb_metrics,
            "random_forest": rf_metrics,
            "isolation_forest": if_metrics,
        },
        "stability_check": stability,
        "triage_distribution": triage_dist,
        "gt_anomaly_triage": gt_anomaly_triage,
        "triage_quality": report.get("triage_quality", {}),
        "ensemble_weights": report.get("ensemble_weights", {
            "xgboost": "50%",
            "random_forest": "25%",
            "isolation_forest": "15%",
            "rule_engine": "10%"
        }),
        "rule_engine_rules": rule_metadata,
        "retrieval_metrics": retrieval_metrics,
        "pipeline_elapsed_sec": report.get("elapsed_sec", 0),
        "total_claims": total_claims,
        "anomaly_rate_pct": anomaly_rate,
        "ground_truth_recovery": ground_truth_recovery,
    }
