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


# ─── Policyholder 360 Models ──────────────────────────────────────────────────

class CustomerPolicySummary(BaseModel):
    policy_id: str
    policy_line: str
    annual_premium_usd: float
    coverage_limit_usd: float
    policy_status: str


class CustomerPriorClaim(BaseModel):
    claim_id: str
    policy_line: str
    incident_type: str
    claim_amount_usd: float
    incident_date: str
    filing_date: str
    claim_status: str
    risk_label: str


class PolicyholderProfile360(BaseModel):
    customer_id: str
    customer_subtype: str
    customer_main_type: str
    age_group: str
    household_size: int
    purchasing_power_tier: int
    purchasing_power_desc: str
    number_of_houses: int
    est_annual_insurance_spend_usd: float
    total_active_policies: int
    customer_lifetime_value_usd: float
    all_policies: List[CustomerPolicySummary] = Field(default_factory=list)
    prior_claims: List[CustomerPriorClaim] = Field(default_factory=list)
    claims_last_12m: int = 0
    claims_last_24m: int = 0
    claims_last_36m: int = 0
    total_prior_claims: int = 0
    cumulative_payout_usd: float = 0.0
    lifetime_premium_paid_usd: float = 0.0
    net_loss_ratio: float = 0.0


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
    customer_profile: Optional[PolicyholderProfile360] = None


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
    llm_provider: str = "Google Gemini"
    llm_active: bool = False
    llm_model: str = "gemini-1.5-flash"


# ─── Custom Claim Intake Request ─────────────────────────────────────────────

class CustomClaimRequest(BaseModel):
    """Payload for analyzing and optionally saving a brand-new, unindexed claim."""
    claim_id: Optional[str] = Field(None, description="Custom Claim ID or auto-generated if omitted")
    customer_id: Optional[str] = Field(None, description="Customer ID or auto-generated if omitted")
    policy_line: str = Field("Auto", description="Policy line: Auto, Fire, Caravan, Boat, Liability, Health, Commercial, etc.")
    incident_type: str = Field("Vehicle Collision", description="Type of incident: Vehicle Collision, Theft, Fire, Water Damage, Hail, etc.")
    incident_severity: str = Field("Moderate", description="Severity: Minor, Moderate, Major, Total Loss, Critical")
    claim_amount_usd: float = Field(12500.0, gt=0.0, description="Total claimed loss in USD")
    coverage_limit_usd: Optional[float] = Field(None, description="Policy coverage limit (defaults to 2.5x claim amount if omitted)")
    annual_premium_usd: Optional[float] = Field(None, description="Annual premium spend (defaults to realistic bracket)")
    filing_delay_days: int = Field(4, ge=0, description="Days elapsed between incident date and claim filing date")
    incident_date: Optional[str] = Field(None, description="Incident date in YYYY-MM-DD format")
    filing_date: Optional[str] = Field(None, description="Filing date in YYYY-MM-DD format")
    incident_narrative: str = Field(..., min_length=10, description="Full detailed description of the loss incident")
    adjuster_notes: Optional[str] = Field("First Notice of Loss (FNOL) intake review.", description="Notes from the intake adjuster")
    customer_subtype: Optional[str] = Field("Suburban Multi-Vehicle Family", description="Demographic/behavioral customer group")
    customer_main_type: Optional[str] = Field("Family with Children", description="Customer main classification")
    age_group: Optional[str] = Field("36-50", description="Age bracket of policyholder: 18-25, 26-35, 36-50, 51-65, 65+")
    household_size: Optional[int] = Field(3, ge=1, le=10, description="Household member count")
    total_active_policies: Optional[int] = Field(2, ge=0, le=15, description="Number of active policies in customer portfolio")
    purchasing_power_tier: Optional[int] = Field(4, ge=1, le=8, description="Income / purchasing power bracket 1-8")
    save_to_database: bool = Field(False, description="Whether to persist the new claim into SQLite and ChromaDB vector store")


# ─── Chatbot Assistant Request / Response ────────────────────────────────────

class ChatQueryRequest(BaseModel):
    """User message sent to the interactive Claims Copilot chatbot."""
    query: str = Field(..., min_length=1, description="User question or inquiry")
    claim_id: Optional[str] = Field(None, description="Optional active claim ID context")


class ChatQueryResponse(BaseModel):
    """Grounded AI response from the Claims Copilot assistant."""
    response: str = Field(..., description="Markdown-formatted assistant response")
    sources: List[str] = Field(default_factory=list, description="Referenced data sources or claims")
    suggested_followups: List[str] = Field(default_factory=list, description="Helpful follow-up prompt chips")
    model: str = Field("Google Gemini / Grounded KB", description="Model or source used for response")


