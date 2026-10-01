import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardStats, ClaimSummary, FilterOptions } from '../types/claims';
import { fetchDashboardStats, fetchClaims, fetchFilterOptions } from '../api/client';
import { SpotlightCard, CountUp, SplitText, ShinyText, DecryptedText } from '../components/reactbits';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import {
  DollarSign, AlertOctagon, ShieldAlert, CheckCircle2, TrendingUp, Search, Filter, ArrowUpDown, ChevronRight, Activity, Cpu, Layers,
} from 'lucide-react';

interface OverviewViewProps {
  onSelectClaim?: (claimId: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ onSelectClaim }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [claims, setClaims] = useState<ClaimSummary[]>([]);
  const [filterOpts, setFilterOpts] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [policyFilter, setPolicyFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('claim_amount_usd');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadOverviewData();
  }, []);

  useEffect(() => {
    loadClaims();
  }, [page, riskFilter, policyFilter, sortBy, sortOrder]);

  const loadOverviewData = async () => {
    try {
      const [sData, fData] = await Promise.all([
        fetchDashboardStats(),
        fetchFilterOptions(),
      ]);
      setStats(sData);
      setFilterOpts(fData);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const loadClaims = async () => {
    setLoading(true);
    try {
      const data = await fetchClaims({
        page,
        pageSize: 12,
        riskLabel: riskFilter,
        policyLine: policyFilter,
        search: searchQuery,
        sortBy,
        sortOrder,
      });
      setClaims(data.claims);
      setTotalPages(data.total_pages);
      setTotalCount(data.total_count);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadClaims();
  };

  // Chart data formatters
  const riskPieData = stats?.risk_distribution
    ? Object.entries(stats.risk_distribution).map(([name, value]) => ({
        name: `${name} Risk`,
        value,
        color: name === 'High' ? '#ef4444' : name === 'Medium' ? '#f59e0b' : '#10b981',
      }))
    : [];

  const policyBarData = stats?.policy_lines
    ? Object.entries(stats.policy_lines).map(([name, count]) => ({
        name,
        count,
      }))
    : [];

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
      {/* Hero Banner with SplitText & ShinyText */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', color: '#a78bfa', marginBottom: '8px', fontWeight: 600 }}>
            <Activity size={14} /> AUTONOMOUS MULTI-AGENT CLAIMS INTELLIGENCE PLATFORM
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#f0f0f5', letterSpacing: '-0.03em', margin: 0 }}>
            <SplitText text="Portfolio Claims & Risk Overview" delay={30} />
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '6px 0 0 0' }}>
            Adjuster triage from within-line severity, a pattern model, and a 14-day notice rule. Isolation Forest is reported beside the tier.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => onSelectClaim('CLM-2024-00003')}
            className="btn btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.85rem',
            }}
          >
            <Cpu size={18} />
            <ShinyText text="Demo 5-Agent Swarm (CLM-2024-00003)" speed={3} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {/* Total Claims */}
          <SpotlightCard className="p-5" spotlightColor="rgba(99, 102, 241, 0.18)">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Total Ingested Claims
                </span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f0f0f5', marginTop: '4px' }}>
                  <CountUp to={stats.total_claims} duration={1.2} />
                </div>
              </div>
              <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '10px', borderRadius: '10px', color: '#818cf8' }}>
                <TrendingUp size={22} />
              </div>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
              COIL 2000 Benchmark Normalized Portfolio
            </div>
          </SpotlightCard>

          {/* Total Financial Exposure */}
          <SpotlightCard className="p-5" spotlightColor="rgba(16, 185, 129, 0.18)">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Total Loss Exposure
                </span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>
                  <CountUp to={stats.total_exposure_usd} prefix="$" decimals={0} duration={1.2} />
                </div>
              </div>
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '10px', borderRadius: '10px', color: '#34d399' }}>
                <DollarSign size={22} />
              </div>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Avg. Claim: <strong style={{ color: '#e2e8f0' }}>${stats.avg_claim_amount_usd.toLocaleString()}</strong>
            </div>
          </SpotlightCard>

          {/* High Risk Claims */}
          <SpotlightCard className="p-5" spotlightColor="rgba(239, 68, 68, 0.18)">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                  High-Risk / SIU Queue
                </span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f87171', marginTop: '4px' }}>
                  <CountUp to={stats.high_risk_count} duration={1.2} />
                </div>
              </div>
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '10px', borderRadius: '10px', color: '#f87171' }}>
                <AlertOctagon size={22} />
              </div>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#f87171', marginTop: '8px' }}>
              Requires Priority Investigator Review
            </div>
          </SpotlightCard>

          {/* Anomaly Outliers */}
          <SpotlightCard className="p-5" spotlightColor="rgba(245, 158, 11, 0.18)">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Statistical Outliers
                </span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fbbf24', marginTop: '4px' }}>
                  <CountUp to={stats.anomaly_count} duration={1.2} />
                </div>
              </div>
              <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '10px', borderRadius: '10px', color: '#fbbf24' }}>
                <ShieldAlert size={22} />
              </div>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Planted schemes in the claim book
            </div>
          </SpotlightCard>
        </div>
      )}

      {/* Analytics Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
        {/* Risk Distribution Donut */}
        <SpotlightCard className="p-5" spotlightColor="rgba(99, 102, 241, 0.12)">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f0f0f5', margin: 0 }}>
                Stored scenario labels
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                Label written when the claim was generated. The swarm score can differ.
              </p>
            </div>
          </div>

          <div style={{ height: '220px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {riskPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(255,255,255,0.05)" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(17, 17, 24, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#f0f0f5',
                    fontSize: '0.75rem',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '10px' }}>
            {riskPieData.map((r) => (
              <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: r.color }} />
                <span style={{ color: 'var(--text-secondary)' }}>{r.name}:</span>
                <strong style={{ color: '#f0f0f5', fontFamily: 'var(--font-mono)' }}>{r.value}</strong>
              </div>
            ))}
          </div>
        </SpotlightCard>

        {/* Policy Lines Volume Chart */}
        <SpotlightCard className="p-5" spotlightColor="rgba(168, 85, 247, 0.12)">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f0f0f5', margin: 0 }}>
                Claims by Policy Line
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                Portfolio volume breakdown across coverage products
              </p>
            </div>
          </div>

          <div style={{ height: '220px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={policyBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(17, 17, 24, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#f0f0f5',
                    fontSize: '0.75rem',
                  }}
                />
                <Bar dataKey="count" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SpotlightCard>
      </div>

      {/* Claims Explorer Table */}
      <SpotlightCard className="p-6" spotlightColor="rgba(99, 102, 241, 0.12)">
        {/* Table Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f0f0f5', margin: 0 }}>
              Claims Explorer & Triage Queue
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
              Displaying {claims.length} of {totalCount} claims (Page {page} of {totalPages})
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/intake')}
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '0.78rem',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                fontWeight: 700,
                border: 'none',
              }}
            >
              <Cpu size={14} /> + New Claim Intake
            </button>

            {/* Filter by Policy Line */}
            {filterOpts && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Line:</span>
                <select
                  value={policyFilter}
                  onChange={(e) => {
                    setPolicyFilter(e.target.value);
                    setPage(1);
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#f0f0f5',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    outline: 'none',
                  }}
                >
                  <option value="ALL">All Policy Lines</option>
                  {filterOpts.policy_lines.map((pl) => (
                    <option key={pl} value={pl}>
                      {pl}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* In-table Search */}
            <form onSubmit={handleSearchSubmit} style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search claims..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#f0f0f5',
                  padding: '6px 10px 6px 30px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  outline: 'none',
                  width: '160px',
                }}
              />
              <Search
                size={14}
                color="var(--text-secondary)"
                style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)' }}
              />
            </form>
          </div>
        </div>

        {/* Table Content */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '10px 14px' }}>Claim ID</th>
                <th style={{ padding: '10px 14px' }}>Customer / Policy</th>
                <th style={{ padding: '10px 14px' }}>Incident Type</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Claim Amount</th>
                <th style={{ padding: '10px 14px', textAlign: 'center' }}>Filing Delay</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((c) => {
                return (
                  <tr
                    key={c.claim_id}
                    onClick={() => onSelectClaim(c.claim_id)}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#a78bfa' }}>
                      <DecryptedText text={c.claim_id} speed={30} animateOn="hover" />
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ color: '#f0f0f5', fontWeight: 600 }}>{c.customer_id}</div>
                      <div style={{ color: 'var(--text-tertiary)', fontSize: '0.72rem' }}>
                        {c.policy_id} • {c.policy_line}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ color: '#f0f0f5' }}>{c.incident_type}</div>
                      <div style={{ color: 'var(--text-tertiary)', fontSize: '0.72rem' }}>
                        {c.incident_severity} • {c.incident_date}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#f0f0f5' }}>
                      ${c.claim_amount_usd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
                        {(c.claim_to_limit_ratio * 100).toFixed(1)}% of limit
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                      <span style={{ color: c.filing_delay_days > 14 ? '#fbbf24' : 'var(--text-secondary)' }}>
                        {c.filing_delay_days}d
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectClaim) onSelectClaim(c.claim_id);
                          navigate(`/studio/${c.claim_id}`);
                        }}
                        style={{ padding: '5px 12px', fontSize: '0.75rem', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        Inspect <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Showing page {page} of {totalPages}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="btn btn-ghost"
              style={{ padding: '4px 12px', fontSize: '0.75rem', borderRadius: '6px' }}
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="btn btn-ghost"
              style={{ padding: '4px 12px', fontSize: '0.75rem', borderRadius: '6px' }}
            >
              Next
            </button>
          </div>
        </div>
      </SpotlightCard>
    </div>
  );
};
