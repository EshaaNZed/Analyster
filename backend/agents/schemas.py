"""
Pydantic v2 Contracts & Schemas for Multi-Agent Claims Intelligence Core
========================================================================
Defines strict schemas for Agent-to-Agent (A2A) messaging, evidence citations,
individual agent outputs, and the final unified claims intelligence dossier.
"""
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
import datetime


class EvidenceCitation(BaseModel):
    """Deterministic evidence citation mapped directly back to verified data sources."""
    source_type: str = Field(..., description="Type of source: 'RELATIONAL_DB', 'VECTOR_STORE', 'KNOWLEDGE_GRAPH', 'ML_MODEL'")
    reference_id: str = Field(..., description="ID of reference: Claim ID, Policy ID, Customer ID, or Rule Code")
    field_name: str = Field(..., description="Name of the underlying attribute or parameter")
    field_value: str = Field(..., description="Value of the verified attribute")
    snippet: str = Field(..., description="Contextual narrative snippet or explanation")


class SimilarPrecedent(BaseModel):
    """Historical precedent claim retrieved via Hybrid Search."""
    claim_id: str
    policy_line: str
    similarity_score: float
    claim_amount_usd: float
    incident_type: str
    claim_status: str
    risk_label: str
    incident_narrative: str


class RetrievalAgentOutput(BaseModel):
    """Output contract for Agent 1: Claims Retrieval Agent."""
    precedent_claims: List[SimilarPrecedent] = Field(default_factory=list)
    customer_active_policies: List[Dict[str, Any]] = Field(default_factory=list)
    graph_context: Dict[str, Any] = Field(default_factory=dict)
    household_risk_flags: List[str] = Field(default_factory=list)
    retrieval_summary: str = ""
    citations: List[EvidenceCitation] = Field(default_factory=list)


class ShapFactor(BaseModel):
    """SHAP feature attribution driver."""
    feature_name: str
    display_name: str
    raw_value: float
    shap_value: float
    direction: str  # INCREASES_RISK or DECREASES_RISK
    impact_level: str  # High, Medium, Low


class RiskAgentOutput(BaseModel):
    """Output contract for Agent 2: Claims Risk Analysis Agent."""
    risk_score: int = Field(..., description="Unified risk score (0-100)")
    risk_tier: str = Field(..., description="Low, Medium, or High")
    severity_score: int = Field(0, description="Within-line severity, 0-100, before blending")
    delay_notice_points: int = Field(0, description="Fixed points for filing after the 14-day notice window")
    xgb_probability: float
    rf_probability: float
    rule_violations: List[str] = Field(default_factory=list)
    top_shap_factors: List[ShapFactor] = Field(default_factory=list)
    coverage_exposure_ratio: float
    claim_to_premium_ratio: float
    risk_analysis_summary: str
    citations: List[EvidenceCitation] = Field(default_factory=list)


class AnomalyAgentOutput(BaseModel):
    """Output contract for Agent 3: Anomaly Detection Agent."""
    is_statistical_outlier: bool
    isolation_forest_score: float
    flagged_anomaly_categories: List[str] = Field(default_factory=list)
    cluster_anomaly_flag: bool
    cluster_details: Dict[str, Any] = Field(default_factory=dict)
    velocity_anomaly_flag: bool
    anomaly_deep_dive_summary: str
    citations: List[EvidenceCitation] = Field(default_factory=list)


class SummarizerAgentOutput(BaseModel):
    """Output contract for Agent 4: Claims Summarization Agent."""
    executive_summary: str
    incident_breakdown: str
    key_risk_drivers: List[str] = Field(default_factory=list)
    precedent_comparison: str
    faithfulness_score: float = Field(default=1.0, description="Hallucination check grounding score (0.0 - 1.0)")
    citations: List[EvidenceCitation] = Field(default_factory=list)


class InvestigationAgentOutput(BaseModel):
    """Output contract for Agent 5: Investigation Support Agent."""
    suggested_disposition: str = Field(..., description="'Fast-Track Approval', 'Standard Adjuster Review', 'Priority SIU Referral'")
    priority_level: str = Field(..., description="'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'")
    recommended_actions: List[str] = Field(default_factory=list)
    interview_questions_for_claimant: List[str] = Field(default_factory=list)
    siu_referral_needed: bool
    siu_referral_reasons: List[str] = Field(default_factory=list)
    investigation_notes: str
    citations: List[EvidenceCitation] = Field(default_factory=list)


class A2AMessage(BaseModel):
    """Explicit Agent-to-Agent communication packet."""
    from_agent: str
    to_agent: str
    handoff_type: str  # e.g., 'PRECEDENT_HANDOFF', 'RISK_ESCALATION', 'SUMMARY_SYNTHESIS'
    payload: Dict[str, Any]
    timestamp: str = Field(default_factory=lambda: datetime.datetime.utcnow().isoformat())


class ClaimsIntelligenceDossier(BaseModel):
    """Complete Unified Claims Intelligence Dossier produced by the Multi-Agent System."""
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
    
    # Agent Outputs
    retrieval: Optional[RetrievalAgentOutput] = None
    risk_analysis: Optional[RiskAgentOutput] = None
    anomaly_detection: Optional[AnomalyAgentOutput] = None
    summarization: Optional[SummarizerAgentOutput] = None
    investigation_support: Optional[InvestigationAgentOutput] = None
    
    # Audit & Execution Trail
    a2a_messages: List[A2AMessage] = Field(default_factory=list)
    execution_steps: List[Dict[str, Any]] = Field(default_factory=list)
    total_latency_ms: float = 0.0
    status: str = "COMPLETED"
