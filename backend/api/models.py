"""
Pydantic v2 Response Models for the Claims Intelligence REST API
================================================================
Lightweight API-facing schemas that map to the internal agent output contracts.
Keeps the API serialization layer decoupled from internal agent schemas.
"""
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


# ─── Claim List / Search Responses ────────────────────────────────────────────

class ClaimSummaryResponse(BaseModel):
    """Compact claim card for list views and search results."""
    claim_id: str
    customer_id: str
    policy_id: str
    policy_line: str
    incident_date: str
    filing_date: str
    filing_delay_days: int
    incident_type: str
    incident_severity: str
    claim_amount_usd: float
    coverage_limit_usd: float
    claim_to_limit_ratio: float
    claim_to_premium_ratio: float
    claim_status: str
    risk_label: str
    is_anomaly_ground_truth: bool
    incident_narrative: str


class ClaimListResponse(BaseModel):
    """Paginated list of claims with metadata."""
    claims: List[ClaimSummaryResponse]
    total_count: int
    page: int
    page_size: int
    total_pages: int


# ─── Full Claim Detail Response ──────────────────────────────────────────────

class ClaimDetailResponse(BaseModel):
    """Full claim record with all fields, prior to agent analysis."""
    claim_id: str
    customer_id: str
    policy_id: str
    policy_line: str
    incident_date: str
    filing_date: str
    filing_delay_days: int
    incident_type: str
    incident_severity: str
    claim_amount_usd: float
    coverage_limit_usd: float
    claim_to_limit_ratio: float
    estimated_annual_premium_usd: float
    claim_to_premium_ratio: float
    claim_status: str
    risk_label: str
    is_anomaly_ground_truth: bool
    anomaly_reasons: str
    incident_narrative: str
    adjuster_notes: str
    # Joined customer/policy context
    customer_subtype: Optional[str] = None
    customer_main_type: Optional[str] = None
    age_group: Optional[str] = None
    household_size: Optional[int] = None
    annual_premium_usd: Optional[float] = None
    total_active_policies: Optional[int] = None


# ─── Graph Visualization Responses ───────────────────────────────────────────

class GraphNode(BaseModel):
    """Single node for vis-network rendering."""
    id: str
    label: str
    group: str  # 'customer', 'policy', 'claim', 'incident_type', 'household'
    title: Optional[str] = None  # Hover tooltip
    size: Optional[int] = 25
    metadata: Dict[str, Any] = Field(default_factory=dict)


class GraphEdge(BaseModel):
    """Single edge for vis-network rendering."""
    from_node: str = Field(alias="from")
    to_node: str = Field(alias="to")
    label: Optional[str] = None
    arrows: str = "to"
    metadata: Dict[str, Any] = Field(default_factory=dict)

    model_config = {"populate_by_name": True}


class GraphResponse(BaseModel):
    """Complete subgraph for frontend visualization."""
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    center_node: str
    stats: Dict[str, Any] = Field(default_factory=dict)


# ─── Agent Analysis / Dossier Responses ──────────────────────────────────────

class AgentStepResponse(BaseModel):
    """Single agent execution step summary."""
    step: int
    agent: str
    action: str
    latency_ms: float
    summary: str


class AnalyzeDossierResponse(BaseModel):
    """Full multi-agent intelligence dossier returned from /analyze."""
    claim_id: str
    customer_id: str
    policy_id: str
    policy_line: str
    incident_date: str
    filing_date: str
    filing_delay_days: int
    claim_amount_usd: float
    coverage_limit_usd: float
    estimated_annual_premium_usd: float
    incident_narrative: str
    adjuster_notes: str

    # Agent outputs (nested dicts to keep API simple)
    retrieval: Dict[str, Any]
    risk_analysis: Dict[str, Any]
    anomaly_detection: Dict[str, Any]
    summarization: Dict[str, Any]
    investigation_support: Dict[str, Any]

    # Audit trail
    a2a_messages: List[Dict[str, Any]]
    execution_steps: List[AgentStepResponse]
    total_latency_ms: float
    status: str


# ─── Dashboard Stats ─────────────────────────────────────────────────────────

class DashboardStatsResponse(BaseModel):
    """Aggregate statistics for the dashboard overview panel."""
    total_claims: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    anomaly_count: int
    total_exposure_usd: float
    avg_claim_amount_usd: float
    policy_lines: Dict[str, int]
    incident_types: Dict[str, int]
    risk_distribution: Dict[str, int]


# ─── Health Check ────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    """API health status."""
    status: str = "healthy"
    version: str = "1.0.0"
    agents_ready: bool = False
    database_connected: bool = False
    vector_store_connected: bool = False
    graph_store_loaded: bool = False
