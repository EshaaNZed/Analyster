import {
  ClaimListResponse,
  ClaimDetail,
  DashboardStats,
  AnalyzeDossier,
  GraphResponse,
  FilterOptions,
} from '../types/claims';

const API_BASE = '/api';

export async function fetchHealth(): Promise<{
  status: string;
  version: string;
  agents_ready: boolean;
  database_connected: boolean;
  vector_store_connected: boolean;
  graph_store_loaded: boolean;
}> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE}/dashboard/stats`);
  if (!res.ok) throw new Error(`Failed to load stats: ${res.statusText}`);
  return res.json();
}

export interface ClaimQueryOptions {
  page?: number;
  pageSize?: number;
  riskLabel?: string;
  policyLine?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function fetchClaims(options: ClaimQueryOptions = {}): Promise<{
  claims: any[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
}> {
  const params = new URLSearchParams();
  if (options.page) params.set('page', String(options.page));
  if (options.pageSize) params.set('page_size', String(options.pageSize));
  if (options.riskLabel && options.riskLabel !== 'ALL') params.set('risk_label', options.riskLabel);
  if (options.policyLine && options.policyLine !== 'ALL') params.set('policy_line', options.policyLine);
  if (options.search) params.set('search', options.search);
  if (options.sortBy) params.set('sort_by', options.sortBy);
  if (options.sortOrder) params.set('sort_order', options.sortOrder);

  const res = await fetch(`${API_BASE}/claims?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch claims: ${res.statusText}`);
  return res.json();
}

export async function fetchClaimDetail(claimId: string): Promise<ClaimDetail> {
  const res = await fetch(`${API_BASE}/claims/${claimId}`);
  if (!res.ok) throw new Error(`Failed to fetch claim ${claimId}: ${res.statusText}`);
  return res.json();
}

export async function runMultiAgentAnalysis(claimId: string): Promise<AnalyzeDossier> {
  const res = await fetch(`${API_BASE}/claims/${claimId}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errData.detail || `Analysis failed: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchGraphSubgraph(entityId: string, depth: number = 2): Promise<GraphResponse> {
  const res = await fetch(`${API_BASE}/graph/${encodeURIComponent(entityId)}?depth=${depth}`);
  if (!res.ok) throw new Error(`Failed to load graph for ${entityId}: ${res.statusText}`);
  return res.json();
}

export async function fetchFilterOptions(): Promise<FilterOptions> {
  const res = await fetch(`${API_BASE}/filters`);
  if (!res.ok) throw new Error(`Failed to fetch filters: ${res.statusText}`);
  return res.json();
}

export async function evaluateNewClaim(input: import('../types/claims').NewClaimInput): Promise<AnalyzeDossier> {
  const res = await fetch(`${API_BASE}/claims/evaluate-new`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errData.detail || `New claim evaluation failed: ${res.statusText}`);
  }
  return res.json();
}

export interface ChatResponse {
  response: string;
  sources: string[];
  suggested_followups: string[];
  model: string;
}

export async function sendChatMessage(query: string, claimId?: string): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, claim_id: claimId }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errData.detail || `Chat request failed: ${res.statusText}`);
  }
  return res.json();
}

