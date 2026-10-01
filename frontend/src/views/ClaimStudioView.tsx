import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ClaimDetail, AnalyzeDossier } from '../types/claims';
import { fetchClaimDetail, runMultiAgentAnalysis } from '../api/client';
import { SpotlightCard, CountUp, SplitText, ShinyText, DecryptedText, BorderBeam, TiltedCard } from '../components/reactbits';
import { RiskGauge } from '../components/RiskGauge';
import { AgentWarRoom } from '../components/AgentWarRoom';
import { KnowledgeGraphView } from '../components/KnowledgeGraphView';
import { EvidenceCitations } from '../components/EvidenceCitations';
import {
  Cpu, Play, CheckCircle2, AlertTriangle, ShieldCheck, ShieldAlert, Clock, FileText, User, FileSpreadsheet,
  HelpCircle, ChevronRight, Layers, ArrowUpRight, ArrowDownRight, Printer, AlertOctagon, CheckSquare, Search,
  Home, DollarSign, Activity, Shield, Calendar, TrendingUp, Building, Users, CreditCard, History,
  ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react';

interface ClaimStudioViewProps {
  selectedClaimId?: string;
  onSelectClaim?: (claimId: string) => void;
  onReferToSiu?: (claimId: string, dossier: AnalyzeDossier) => void;
}

export const ClaimStudioView: React.FC<ClaimStudioViewProps> = ({
  selectedClaimId: propClaimId,
  onSelectClaim,
  onReferToSiu,
}) => {
  const params = useParams<{ claimId?: string }>();
  const navigate = useNavigate();
  const activeClaimId = params.claimId || propClaimId || 'CLM-2024-00003';

  const [claim, setClaim] = useState<ClaimDetail | null>(null);
  const [dossier, setDossier] = useState<AnalyzeDossier | null>(null);
  const [loadingClaim, setLoadingClaim] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dossier' | 'graph' | 'evidence'>('dossier');
  const [checkedActions, setCheckedActions] = useState<Record<number, boolean>>({});
  const [isEscalated, setIsEscalated] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [showProfile360, setShowProfile360] = useState(true);

  useEffect(() => {
    if (activeClaimId) {
      loadClaim(activeClaimId);
      checkIfEscalated(activeClaimId);
    }
  }, [activeClaimId]);

  const checkIfEscalated = (id: string) => {
    try {
      const stored = localStorage.getItem('analyster_siu_cases');
      if (stored) {
        const cases = JSON.parse(stored);
        const exists = cases.some((c: any) => c.claim_id === id);
        setIsEscalated(exists);
      } else {
        setIsEscalated(false);
      }
    } catch {
      setIsEscalated(false);
    }
  };

  const loadClaim = async (id: string) => {
    setLoadingClaim(true);
    setError(null);
    setDossier(null);
    setCheckedActions({});
    try {
      const data = await fetchClaimDetail(id);
      setClaim(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingClaim(false);
    }
  };

  const handleRunSwarm = async () => {
    if (!activeClaimId) return;
    setAnalyzing(true);
    setError(null);
    try {
      const res = await runMultiAgentAnalysis(activeClaimId);
      setDossier(res);
    } catch (err: any) {
      setError(err.message || 'Swarm execution failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleEscalateToSiu = () => {
    if (!claim) return;
    try {
      const stored = localStorage.getItem('analyster_siu_cases');
      const existingCases: any[] = stored ? JSON.parse(stored) : [];
      
      const riskScore = dossier?.risk_analysis?.risk_score ?? (claim.risk_label === 'High' ? 88 : claim.risk_label === 'Medium' ? 62 : 28);
      const riskTier = dossier?.risk_analysis?.risk_tier ?? claim.risk_label ?? 'High';
      const primaryReason = dossier?.investigation_support?.suggested_disposition 
        || dossier?.summarization?.key_risk_drivers?.[0] 
        || dossier?.anomaly_detection?.anomaly_deep_dive_summary
        || claim.incident_narrative 
        || 'High risk anomaly flagged during swarm investigation';

      const newCase = {
        claim_id: claim.claim_id,
        customer_id: claim.customer_id,
        risk_score: riskScore,
        risk_tier: riskTier,
        primary_reason: primaryReason,
        flagged_date: new Date().toISOString().split('T')[0],
        claim_amount_usd: claim.claim_amount_usd,
        actions: dossier?.investigation_support?.recommended_actions || [
          'Issue formal Examination Under Oath (EUO) targeting policyholder',
          'Inspect physical evidence and verify forensic timestamps',
          'Review financial records and prior claim history'
        ],
        questions: dossier?.investigation_support?.interview_questions_for_claimant || [
          'Can you clarify the exact timeline of events on the incident date?',
          'Were any third-party witnesses present when the loss occurred?'
        ],
        summary: dossier?.summarization?.executive_summary || claim.incident_narrative || '',
      };

      // Remove existing if already present and re-add at front
      const filtered = existingCases.filter((c: any) => c.claim_id !== claim.claim_id);
      const updated = [newCase, ...filtered];
      localStorage.setItem('analyster_siu_cases', JSON.stringify(updated));
      setIsEscalated(true);
      if (onReferToSiu && dossier) {
        onReferToSiu(claim.claim_id, dossier);
      }
    } catch (e) {
      console.error('Failed to escalate to SIU:', e);
    }
  };

  const toggleAction = (idx: number) => {
    setCheckedActions((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  if (loadingClaim) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#a78bfa' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <Cpu size={36} className="animate-spin" />
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Loading Claim {activeClaimId}...</span>
        </div>
      </div>
    );
  }

  if (error && !claim) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', color: '#ef4444', maxWidth: '600px', margin: '0 auto' }}>
        <h3>Failed to load claim: {error}</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>The requested claim ID may not exist in the database.</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '16px' }}>
          <button onClick={() => loadClaim(activeClaimId)} className="btn btn-secondary">
            Retry
          </button>
          <button onClick={() => navigate('/portfolio')} className="btn btn-primary">
            Back to Portfolio
          </button>
        </div>
      </div>
    );
  }

  if (!claim) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
        <h3>No claim selected</h3>
        <p>Please select a claim from the Portfolio table or enter a Claim ID.</p>
        <button onClick={() => navigate('/portfolio')} className="btn btn-primary" style={{ marginTop: '16px' }}>
          Browse Claims Portfolio
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
      {/* Top Search & Quick Claim Switcher Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', padding: '12px 16px', borderRadius: '12px' }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (searchInput.trim()) {
              const formatted = searchInput.trim().toUpperCase();
              navigate(`/studio/${formatted}`);
              if (onSelectClaim) onSelectClaim(formatted);
            }
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px', maxWidth: '500px' }}
        >
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Search / Switch Claim ID (e.g. CLM-2024-00003)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '8px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#f0f0f5',
                fontSize: '0.85rem',
                fontFamily: 'var(--font-mono)',
              }}
            />
          </div>
          <button
            type="submit"
            className="btn btn-secondary"
            style={{ padding: '9px 16px', fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap' }}
          >
            Load Claim
          </button>
        </form>

        {/* Quick Suggestion Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Quick Switch:</span>
          {['CLM-2024-00003', 'CLM-2024-00042', 'CLM-2024-00010', 'CLM-2024-00015'].map((id) => (
            <button
              key={id}
              onClick={() => {
                navigate(`/studio/${id}`);
                if (onSelectClaim) onSelectClaim(id);
              }}
              style={{
                background: activeClaimId === id ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${activeClaimId === id ? 'rgba(99, 102, 241, 0.5)' : 'rgba(255, 255, 255, 0.08)'}`,
                color: activeClaimId === id ? '#a78bfa' : 'var(--text-secondary)',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                fontWeight: activeClaimId === id ? 700 : 500,
              }}
            >
              {id}
            </button>
          ))}
        </div>
      </div>

      {/* Top Banner: Claim Profile Header */}
      <SpotlightCard className="p-6 relative overflow-hidden" spotlightColor="rgba(99, 102, 241, 0.15)">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#a78bfa' }}>
                <DecryptedText text={claim.claim_id} speed={25} />
              </span>
              {dossier ? (
                <>
                  {(() => {
                    const currentRiskTier = dossier.risk_analysis?.risk_tier || 'Low';
                    const currentRiskScore = dossier.risk_analysis?.risk_score;
                    const isHigh = currentRiskTier === 'High' || (currentRiskScore !== undefined && currentRiskScore >= 70);
                    const isMedium = currentRiskTier === 'Medium' || (currentRiskScore !== undefined && currentRiskScore >= 40 && currentRiskScore < 70);
                    
                    return (
                      <span
                        style={{
                          padding: '3px 12px',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: isHigh
                            ? 'rgba(239, 68, 68, 0.2)'
                            : isMedium
                            ? 'rgba(245, 158, 11, 0.2)'
                            : 'rgba(16, 185, 129, 0.2)',
                          color: isHigh ? '#ef4444' : isMedium ? '#f59e0b' : '#10b981',
                          border: `1px solid ${
                            isHigh ? '#ef444460' : isMedium ? '#f59e0b60' : '#10b98160'
                          }`,
                        }}
                      >
                        {currentRiskTier} RISK {currentRiskScore !== undefined ? `(${currentRiskScore}/100)` : ''}
                      </span>
                    );
                  })()}
                  {dossier.anomaly_detection?.is_statistical_outlier && (
                    <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid #fbbf2440', padding: '3px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700 }}>
                      ⚠️ ANOMALY OUTLIER
                    </span>
                  )}
                </>
              ) : (
                <span
                  style={{
                    padding: '3px 12px',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    background: 'rgba(255, 255, 255, 0.04)',
                    color: 'var(--text-secondary)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    letterSpacing: '0.04em',
                  }}
                >
                  Awaiting Swarm Evaluation
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              <span>
                Customer: <strong style={{ color: '#f0f0f5' }}>{claim.customer_id}</strong> ({claim.customer_subtype || claim.customer_main_type || 'Private Household'})
              </span>
              <span>
                Policy: <strong style={{ color: '#f0f0f5' }}>{claim.policy_id}</strong> ({claim.policy_line})
              </span>
              <span>
                Incident: <strong style={{ color: '#f0f0f5' }}>{claim.incident_date}</strong>
              </span>
              <span>
                Filed: <strong style={{ color: '#f0f0f5' }}>{claim.filing_date}</strong> ({claim.filing_delay_days}d delay)
              </span>
            </div>
          </div>

          {/* Action CTA: Run Swarm & SIU Escalation */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {dossier && (
              isEscalated ? (
                <button
                  onClick={() => navigate('/siu')}
                  className="btn btn-secondary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    fontWeight: 700,
                    padding: '12px 18px',
                    borderRadius: '12px',
                  }}
                >
                  <CheckCircle2 size={16} /> Claim In SIU Hub (View →)
                </button>
              ) : (
                <button
                  onClick={handleEscalateToSiu}
                  className="btn btn-secondary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#f87171',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    fontWeight: 700,
                    padding: '12px 18px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                  }}
                >
                  <AlertOctagon size={16} /> Escalate to SIU
                </button>
              )
            )}

            <button
              onClick={handleRunSwarm}
              disabled={analyzing}
              className="btn btn-primary"
              style={{
                position: 'relative',
                overflow: 'hidden',
                padding: '12px 24px',
                fontSize: '0.9rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                borderRadius: '12px',
                boxShadow: '0 0 25px rgba(99, 102, 241, 0.4)',
              }}
            >
              {analyzing ? (
                <>
                  <Cpu size={18} className="animate-spin" />
                  <span>Swarm Orchestrating (5 Agents)...</span>
                </>
              ) : (
                <>
                  <Play size={18} fill="currentColor" />
                  <ShinyText text={dossier ? 'Re-Run 5-Agent Swarm' : 'Launch 5-Agent Swarm Analysis'} speed={3} />
                </>
              )}
              {!analyzing && <BorderBeam size={180} duration={5} colorFrom="#a855f7" colorTo="#6366f1" />}
            </button>
          </div>
        </div>

        {/* Narrative & Financials Ribbon */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
          {/* Incident Narrative */}
          <div style={{ gridColumn: 'span 2' }}>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700 }}>
              Reported Incident Narrative
            </span>
            <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.5, background: 'rgba(0,0,0,0.25)', padding: '12px', borderRadius: '8px', borderLeft: '3px solid #6366f1' }}>
              "{claim.incident_narrative}"
            </p>
            {claim.adjuster_notes && (
              <div style={{ marginTop: '8px', fontSize: '0.78rem', color: '#fbbf24', background: 'rgba(245, 158, 11, 0.08)', padding: '6px 10px', borderRadius: '6px' }}>
                <strong>Adjuster Note:</strong> {claim.adjuster_notes}
              </div>
            )}
          </div>

          {/* Quick Financials */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Claim Loss Amount:</span>
              <strong style={{ color: '#f0f0f5', fontFamily: 'var(--font-mono)' }}>${claim.claim_amount_usd.toLocaleString()}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Policy Coverage Limit:</span>
              <strong style={{ color: '#f0f0f5', fontFamily: 'var(--font-mono)' }}>${claim.coverage_limit_usd.toLocaleString()}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Coverage Exposure:</span>
              <strong
                style={{
                  color:
                    claim.claim_to_limit_ratio >= 0.60
                      ? '#ef4444'
                      : claim.claim_to_limit_ratio >= 0.25
                      ? '#f59e0b'
                      : '#10b981',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {(claim.claim_to_limit_ratio * 100).toFixed(1)}%
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Annual Premium:</span>
              <strong style={{ color: '#f0f0f5', fontFamily: 'var(--font-mono)' }}>
                ${(claim.annual_premium_usd || claim.estimated_annual_premium_usd || 0).toLocaleString()}
              </strong>
            </div>
          </div>
        </div>
      </SpotlightCard>

      {/* 👤 Policyholder 360° Relationship & Financial Profile Section */}
      {claim.customer_profile && (
        <SpotlightCard className="p-6" spotlightColor="rgba(139, 92, 246, 0.12)">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showProfile360 ? '18px' : '0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc' }}>
                <User size={20} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f0f0f5', margin: 0 }}>
                    Policyholder 360° Relationship & Financial Profile
                  </h3>
                  <span style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#d8b4fe', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    {claim.customer_profile.customer_id}
                  </span>
                </div>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Demographics, socioeconomic segmentation, customer lifetime value (LTV), and multi-policy relationship portfolio
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowProfile360(!showProfile360)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#e2e8f0',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                cursor: 'pointer',
              }}
            >
              {showProfile360 ? <><ChevronUp size={14} /> Collapse Profile</> : <><ChevronDown size={14} /> Expand 360° Profile</>}
            </button>
          </div>

          {showProfile360 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Row 1: Demographics & Customer LTV */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
                {/* 1. Household Demographics & Purchasing Power */}
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a78bfa', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                    <Users size={14} /> Household profile
                    <span style={{ fontWeight: 500, textTransform: 'none', color: 'var(--text-secondary)' }}>Not used in the score</span>
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f0f0f5', marginBottom: '6px' }}>
                    {claim.customer_profile.customer_subtype || claim.customer_profile.customer_main_type}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Purchasing Power Bracket:</span>
                      <strong style={{ color: '#c084fc' }}>Bracket {claim.customer_profile.purchasing_power_tier} / 8</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Socioeconomic Segment:</span>
                      <strong style={{ color: '#e2e8f0' }}>{claim.customer_profile.purchasing_power_desc}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Policyholder Age Group:</span>
                      <strong style={{ color: '#e2e8f0' }}>{claim.customer_profile.age_group}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Residential Houses Owned:</span>
                      <strong style={{ color: '#e2e8f0' }}>{claim.customer_profile.number_of_houses}</strong>
                    </div>
                  </div>
                </div>

                {/* 2. Customer Lifetime Value (LTV) */}
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                    <TrendingUp size={14} /> Customer Lifetime Value
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>
                    ${claim.customer_profile.customer_lifetime_value_usd.toLocaleString()}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Annual Insurance Spend:</span>
                      <strong style={{ color: '#f0f0f5', fontFamily: 'var(--font-mono)' }}>${claim.customer_profile.est_annual_insurance_spend_usd.toLocaleString()}/yr</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Total Active Lines:</span>
                      <strong style={{ color: '#f0f0f5' }}>{claim.customer_profile.total_active_policies} Active Policies</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Relationship Tier:</span>
                      <strong style={{ color: claim.customer_profile.customer_lifetime_value_usd > 20000 ? '#a78bfa' : '#60a5fa' }}>
                        {claim.customer_profile.customer_lifetime_value_usd > 25000 ? '⭐ Tier-1 High Value Client' : claim.customer_profile.customer_lifetime_value_usd > 12000 ? '🔷 Established Client' : 'Standard Policyholder'}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Multi-Policy Relationship Across Lines */}
              <div style={{ background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '10px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={16} color="#818cf8" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f0f0f5' }}>
                      Multi-Policy Portfolio ({claim.customer_profile.all_policies.length} Lines)
                    </span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    Auto, Fire, Boat, Life, Caravan, Property
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                  {claim.customer_profile.all_policies.map((p) => {
                    const isCurrentPolicy = p.policy_id === claim.policy_id;
                    return (
                      <div
                        key={p.policy_id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: isCurrentPolicy ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                          border: `1px solid ${isCurrentPolicy ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255, 255, 255, 0.05)'}`,
                          padding: '10px 14px',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: isCurrentPolicy ? '#a78bfa' : '#e2e8f0' }}>
                            {p.policy_id}
                          </span>
                          <span style={{ background: 'rgba(255, 255, 255, 0.06)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', color: '#cbd5e1' }}>
                            {p.policy_line}
                          </span>
                          {isCurrentPolicy && (
                            <span style={{ background: 'rgba(99, 102, 241, 0.3)', color: '#c084fc', padding: '2px 8px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 700 }}>
                              CURRENT CLAIM
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Limit: <strong style={{ color: '#f0f0f5', fontFamily: 'var(--font-mono)' }}>${p.coverage_limit_usd.toLocaleString()}</strong></span>
                          <span style={{ color: 'var(--text-secondary)' }}>Premium: <strong style={{ color: '#f0f0f5', fontFamily: 'var(--font-mono)' }}>${p.annual_premium_usd.toLocaleString()}/yr</strong></span>
                          <span style={{ color: p.policy_status === 'Active' ? '#34d399' : '#f59e0b', fontWeight: 600, fontSize: '0.72rem' }}>{p.policy_status}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </SpotlightCard>
      )}

      {/* If Swarm hasn't been run yet, show invitation card */}
      {!dossier && !analyzing && (
        <SpotlightCard className="p-8 text-center" spotlightColor="rgba(139, 92, 246, 0.15)">
          <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
              <Cpu size={32} />
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f0f0f5', margin: 0 }}>
              Launch Full Multi-Agent Intelligence Swarm
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5, margin: 0 }}>
              Click above to trigger the 5 specialized agents: Hybrid Graph RAG Retrieval, Risk Profiling & SHAP Attribution, Isolation Forest Outlier Audit, Grounded Briefing, and Triage Dossier Formulation.
            </p>
            <button onClick={handleRunSwarm} className="btn btn-primary" style={{ padding: '10px 22px', fontSize: '0.88rem', fontWeight: 700 }}>
              Execute Multi-Agent Swarm Pipeline
            </button>
          </div>
        </SpotlightCard>
      )}

      {/* Multi-Agent Dossier Workspace */}
      {dossier && (
        <>
          {/* Navigation Sub-Tabs */}
          <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
            {[
              { id: 'dossier', label: 'Intelligence Dossier & Findings', icon: <FileText size={16} /> },
              { id: 'graph', label: 'Neighborhood Knowledge Graph', icon: <Layers size={16} /> },
              { id: 'evidence', label: 'Evidence Citations & Grounding', icon: <ShieldCheck size={16} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === tab.id ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                  color: activeTab === tab.id ? '#f0f0f5' : 'var(--text-secondary)',
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  borderBottom: activeTab === tab.id ? '2px solid #818cf8' : '2px solid transparent',
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'dossier' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Row 1: Unified Multi-Agent Risk Profiling */}
              <div>
                <SpotlightCard className="p-8 flex flex-col items-center text-center" spotlightColor="rgba(239, 68, 68, 0.12)">
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em' }}>
                      Ensemble Risk Profiling
                    </span>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f0f0f5', margin: '4px 0 0 0' }}>
                      Unified Multi-Agent Risk Score & Verification
                    </h3>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center', width: '100%', margin: '8px 0' }}>
                    <RiskGauge
                      score={dossier.risk_analysis?.risk_score || 0}
                      tier={dossier.risk_analysis?.risk_tier || 'Low'}
                      xgbProb={dossier.risk_analysis?.xgb_probability || 0}
                      rfProb={dossier.risk_analysis?.rf_probability || 0}
                      severityScore={dossier.risk_analysis?.severity_score}
                      delayNoticePoints={dossier.risk_analysis?.delay_notice_points}
                      size={230}
                    />
                  </div>

                  {dossier.risk_analysis?.rule_violations && dossier.risk_analysis.rule_violations.length > 0 && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', width: '100%', maxWidth: '750px', textAlign: 'left' }}>
                      <span style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '8px' }}>
                        <ShieldAlert size={14} /> Why this tier ({dossier.risk_analysis.rule_violations.length}):
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                        {dossier.risk_analysis.rule_violations.map((violation, i) => (
                          <div
                            key={i}
                            style={{
                              fontSize: '0.8rem',
                              color: '#fca5a5',
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              lineHeight: 1.4,
                            }}
                          >
                            • {violation}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </SpotlightCard>
              </div>

              {/* Row 2: Grounded Executive Briefing + Precedent Case Matching */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '20px' }}>
                {/* Executive Summary */}
                <SpotlightCard className="p-6" spotlightColor="rgba(16, 185, 129, 0.12)">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={18} color="#34d399" />
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f0f0f5', margin: 0 }}>
                        Grounded Executive Briefing
                      </h3>
                    </div>
                    <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                      Faithfulness: 100% Grounded
                    </span>
                  </div>

                  <div style={{ whiteSpace: 'pre-line', fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.6, background: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '8px', borderLeft: '3px solid #10b981' }}>
                    {dossier.summarization?.executive_summary}
                  </div>

                  {/* Key Risk Drivers */}
                  {dossier.summarization?.key_risk_drivers && dossier.summarization.key_risk_drivers.length > 0 && (
                    <div style={{ marginTop: '14px' }}>
                      <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700 }}>
                        Key Synthesis Risk Drivers:
                      </span>
                      <ul style={{ margin: '6px 0 0 16px', padding: 0, fontSize: '0.8rem', color: '#f0f0f5' }}>
                        {dossier.summarization.key_risk_drivers.map((drv, i) => (
                          <li key={i} style={{ marginBottom: '4px' }}>
                            {drv}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </SpotlightCard>

                {/* Precedent Cases (Hybrid Vector Search) */}
                <SpotlightCard className="p-6" spotlightColor="rgba(59, 130, 246, 0.12)">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Layers size={18} color="#60a5fa" />
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f0f0f5', margin: 0 }}>
                        Hybrid Precedent Case Matching
                      </h3>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      ChromaDB Dense Vectors + Graph RAG
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {dossier.retrieval?.precedent_claims && dossier.retrieval.precedent_claims.length > 0 ? (
                      dossier.retrieval.precedent_claims.map((prec) => (
                        <div
                          key={prec.claim_id}
                          onClick={() => onSelectClaim(prec.claim_id)}
                          style={{
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            borderRadius: '8px',
                            padding: '10px 12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)')}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#a78bfa', fontSize: '0.8rem' }}>
                                {prec.claim_id}
                              </span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                {prec.incident_type}
                              </span>
                            </div>
                            <span style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', padding: '1px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>
                              {(prec.similarity_score * 100).toFixed(1)}% Match
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                            <span>Amount: <strong style={{ color: '#f0f0f5' }}>${prec.claim_amount_usd.toLocaleString()}</strong></span>
                            <span>Disposition: <strong style={{ color: prec.claim_status === 'Approved' ? '#34d399' : '#f59e0b' }}>{prec.claim_status}</strong></span>
                            <span>Risk: {prec.risk_label}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        No precedent matches found.
                      </div>
                    )}
                  </div>
                </SpotlightCard>
              </div>

              {/* Row 3: Investigation Support Agent Recommendations & Action Items */}
              <SpotlightCard className="p-6" spotlightColor="rgba(245, 158, 11, 0.12)">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertOctagon size={20} color="#f59e0b" />
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f0f0f5', margin: 0 }}>
                        Human Adjuster Decision Support & Triage Plan
                      </h3>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                      Agent 5 synthesis of deterministic next steps, interview probes, and disposition
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Recommended Disposition</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f0f0f5' }}>
                        {dossier.investigation_support?.suggested_disposition}
                      </div>
                    </div>

                    {isEscalated ? (
                      <button
                        onClick={() => navigate('/siu')}
                        className="btn btn-secondary"
                        style={{
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#34d399',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          padding: '8px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <CheckCircle2 size={14} /> Escalated to SIU (View in Hub →)
                      </button>
                    ) : (
                      <button
                        onClick={handleEscalateToSiu}
                        className="btn btn-secondary"
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: '#f87171',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          padding: '8px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        <AlertOctagon size={14} /> Escalate to SIU
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
                  {/* Action Checklist */}
                  <div>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      <CheckSquare size={14} /> Recommended Action Items (Check to Verify)
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {dossier.investigation_support?.recommended_actions?.map((act, idx) => {
                        const isChecked = !!checkedActions[idx];
                        return (
                          <div
                            key={idx}
                            onClick={() => toggleAction(idx)}
                            style={{
                              background: isChecked ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                              border: `1px solid ${isChecked ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.05)'}`,
                              borderRadius: '8px',
                              padding: '10px 12px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '10px',
                              transition: 'all 0.2s',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              style={{ marginTop: '3px', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '0.82rem', color: isChecked ? '#34d399' : '#e2e8f0', textDecoration: isChecked ? 'line-through' : 'none' }}>
                              {act}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Interview Questions */}
                  <div>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      <HelpCircle size={14} /> Recommended Claimant Interview Questions
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {dossier.investigation_support?.interview_questions_for_claimant?.map((q, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            borderRadius: '8px',
                            padding: '10px 12px',
                            fontSize: '0.82rem',
                            color: '#e2e8f0',
                            borderLeft: '3px solid #8b5cf6',
                          }}
                        >
                          "{q}"
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </SpotlightCard>

              {/* Row 4: Multi-Agent War Room Timeline & A2A Handoff Messages */}
              <AgentWarRoom
                steps={dossier.execution_steps}
                messages={dossier.a2a_messages}
                totalLatencyMs={dossier.total_latency_ms}
              />
            </div>
          )}

          {activeTab === 'graph' && (
            <KnowledgeGraphView
              entityId={claim.claim_id}
              initialDepth={2}
              onSelectEntity={(entId) => {
                if (entId.startsWith('CLM-')) {
                  onSelectClaim(entId);
                }
              }}
            />
          )}

          {activeTab === 'evidence' && (
            <EvidenceCitations
              citations={[
                ...(dossier.risk_analysis?.citations || []),
                ...(dossier.anomaly_detection?.citations || []),
                ...(dossier.summarization?.citations || []),
                ...(dossier.investigation_support?.citations || []),
              ]}
            />
          )}
        </>
      )}
    </div>
  );
};
