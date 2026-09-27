export interface ClaimSummary {
  claim_id: string;
  customer_id: string;
  policy_id: string;
  policy_line: string;
  incident_date: string;
  filing_date: string;
  filing_delay_days: number;
  incident_type: string;
  incident_severity: string;
  claim_amount_usd: number;
  coverage_limit_usd: number;
  claim_to_limit_ratio: number;
  claim_to_premium_ratio?: number;
  claim_status: string;
  risk_label: 'Low' | 'Medium' | 'High';
  is_anomaly_ground_truth: boolean;
  incident_narrative: string;
}

export interface ClaimListResponse {
  claims: ClaimSummary[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ClaimDetail extends ClaimSummary {
  estimated_annual_premium_usd: number;
  anomaly_reasons: string;
  adjuster_notes: string;
  customer_subtype: string;
  customer_main_type: string;
  age_group: string;
  household_size: number;
  annual_premium_usd: number;
  total_active_policies: number;
}

export interface DashboardStats {
  total_claims: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  anomaly_count: number;
  total_exposure_usd: number;
  avg_claim_amount_usd: number;
  policy_lines: Record<string, number>;
  incident_types: Record<string, number>;
  risk_distribution: Record<string, number>;
}

export interface PrecedentClaim {
  claim_id: string;
  policy_line: string;
  similarity_score: number;
  claim_amount_usd: number;
  incident_type: string;
  claim_status: string;
  risk_label: string;
  incident_narrative: string;
}

export interface ActivePolicy {
  policy_id: string;
  policy_line: string;
  coverage_limit_usd: number;
  annual_premium_usd: number;
  policy_status: string;
}

export interface Citation {
  source_type: string;
  reference_id: string;
  field_name: string;
  field_value: string;
  snippet: string;
}

export interface ShapFactor {
  feature_name: string;
  display_name: string;
  raw_value: number;
  shap_value: number;
  direction: 'INCREASES_RISK' | 'DECREASES_RISK';
  impact_level: 'High' | 'Medium' | 'Low';
}

export interface RiskAnalysis {
  risk_score: number;
  risk_tier: 'Low' | 'Medium' | 'High';
  xgb_probability: number;
  rf_probability: number;
  rule_violations: string[];
  top_shap_factors: ShapFactor[];
  coverage_exposure_ratio: number;
  claim_to_premium_ratio: number;
  risk_analysis_summary: string;
  citations: Citation[];
}

export interface AnomalyDetection {
  is_statistical_outlier: boolean;
  isolation_forest_score: number;
  flagged_anomaly_categories: string[];
  cluster_anomaly_flag: boolean;
  cluster_details: Record<string, any>;
  velocity_anomaly_flag: boolean;
  anomaly_deep_dive_summary: string;
  citations: Citation[];
}

export interface Summarization {
  executive_summary: string;
  incident_breakdown: string;
  key_risk_drivers: string[];
  precedent_comparison: string;
  faithfulness_score: number;
  citations: Citation[];
}

export interface InvestigationSupport {
  suggested_disposition: string;
  priority_level: 'LOW' | 'MEDIUM' | 'HIGH';
  recommended_actions: string[];
  interview_questions_for_claimant: string[];
  siu_referral_needed: boolean;
  siu_referral_reasons: string[];
  investigation_notes: string;
  citations: Citation[];
}

export interface A2AMessage {
  from_agent: string;
  to_agent: string;
  handoff_type: string;
  payload: Record<string, any>;
  timestamp: string;
}

export interface ExecutionStep {
  step: number;
  agent: string;
  action: string;
  latency_ms: number;
  summary: string;
}

export interface AnalyzeDossier {
  claim_id: string;
  customer_id: string;
  policy_id: string;
  policy_line: string;
  incident_date: string;
  filing_date: string;
  filing_delay_days: number;
  claim_amount_usd: number;
  coverage_limit_usd: number;
  estimated_annual_premium_usd: number;
  incident_narrative: string;
  adjuster_notes: string;
  retrieval: {
    precedent_claims?: PrecedentClaim[];
    customer_active_policies?: ActivePolicy[];
    graph_context?: any;
  };
  risk_analysis: RiskAnalysis;
  anomaly_detection: AnomalyDetection;
  summarization: Summarization;
  investigation_support: InvestigationSupport;
  a2a_messages: A2AMessage[];
  execution_steps: ExecutionStep[];
  total_latency_ms: number;
  status: string;
}

export interface GraphNode {
  id: string;
  label: string;
  group: string;
  title: string;
  size: number;
  metadata?: Record<string, string>;
}

export interface GraphEdge {
  from: string;
  to: string;
  label: string;
  arrows: string;
  metadata?: Record<string, string>;
}

export interface GraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
  center_node: string;
  stats: {
    total_nodes: number;
    total_edges: number;
    depth: number;
  };
}

export interface FilterOptions {
  policy_lines: string[];
  risk_labels: string[];
  incident_types: string[];
  severities: string[];
  claim_statuses: string[];
}
