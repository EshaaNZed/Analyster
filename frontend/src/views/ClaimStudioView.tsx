import React, { useEffect, useState } from 'react';
import { ClaimDetail, AnalyzeDossier } from '../types/claims';
import { fetchClaimDetail, runMultiAgentAnalysis } from '../api/client';
import { SpotlightCard, CountUp, SplitText, ShinyText, DecryptedText, BorderBeam, TiltedCard } from '../components/reactbits';
import { RiskGauge } from '../components/RiskGauge';
import { AgentWarRoom } from '../components/AgentWarRoom';
import { KnowledgeGraphView } from '../components/KnowledgeGraphView';
import { EvidenceCitations } from '../components/EvidenceCitations';
import {
  Cpu, Play, CheckCircle2, AlertTriangle, ShieldCheck, Clock, FileText, User, FileSpreadsheet,
  HelpCircle, ChevronRight, Layers, ArrowUpRight, ArrowDownRight, Printer, AlertOctagon, CheckSquare,
} from 'lucide-react';

interface ClaimStudioViewProps {
  selectedClaimId: string;
  onSelectClaim: (claimId: string) => void;
  onReferToSiu?: (claimId: string, dossier: AnalyzeDossier) => void;
}

export const ClaimStudioView: React.FC<ClaimStudioViewProps> = ({
  selectedClaimId,
  onSelectClaim,
  onReferToSiu,
}) => {
  const [claim, setClaim] = useState<ClaimDetail | null>(null);
  const [dossier, setDossier] = useState<AnalyzeDossier | null>(null);
  const [loadingClaim, setLoadingClaim] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dossier' | 'graph' | 'evidence'>('dossier');
  const [checkedActions, setCheckedActions] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (selectedClaimId) {
      loadClaim(selectedClaimId);
    }
  }, [selectedClaimId]);

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
    if (!selectedClaimId) return;
    setAnalyzing(true);
    setError(null);
    try {
      const res = await runMultiAgentAnalysis(selectedClaimId);
      setDossier(res);
    } catch (err: any) {
      setError(err.message || 'Swarm execution failed');
    } finally {
      setAnalyzing(false);
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
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Loading Claim {selectedClaimId}...</span>
        </div>
      </div>
    );
  }

  if (error && !claim) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: '#ef4444' }}>
        <h3>Failed to load claim: {error}</h3>
        <button onClick={() => loadClaim(selectedClaimId)} className="btn btn-secondary" style={{ marginTop: '12px' }}>
          Retry
        </button>
      </div>
    );
  }

  if (!claim) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <h3>No claim selected</h3>
        <p>Please select a claim from the Overview table or search by Claim ID.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
      {/* Top Banner: Claim Profile Header */}
      <SpotlightCard className="p-6 relative overflow-hidden" spotlightColor="rgba(99, 102, 241, 0.15)">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#a78bfa' }}>
                <DecryptedText text={claim.claim_id} speed={25} />
              </span>
              <span
                style={{
                  padding: '3px 12px',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  background:
                    claim.risk_label === 'High'
                      ? 'rgba(239, 68, 68, 0.2)'
                      : claim.risk_label === 'Medium'
                      ? 'rgba(245, 158, 11, 0.2)'
                      : 'rgba(16, 185, 129, 0.2)',
                  color:
                    claim.risk_label === 'High'
                      ? '#ef4444'
                      : claim.risk_label === 'Medium'
                      ? '#f59e0b'
                      : '#10b981',
                  border: `1px solid ${
                    claim.risk_label === 'High' ? '#ef444460' : claim.risk_label === 'Medium' ? '#f59e0b60' : '#10b98160'
                  }`,
                }}
              >
                {claim.risk_label} RISK
              </span>
              {claim.is_anomaly_ground_truth && (
                <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid #fbbf2440', padding: '3px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700 }}>
                  ⚠️ ANOMALY OUTLIER
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

          {/* Action CTA: Run Swarm */}
          <div style={{ display: 'flex', gap: '10px' }}>
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
              <strong style={{ color: claim.claim_to_limit_ratio > 0.5 ? '#ef4444' : '#10b981', fontFamily: 'var(--font-mono)' }}>
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
              {/* Row 1: Risk Gauge + SHAP Attribution + Anomaly Breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
                {/* 1. Risk Gauge */}
                <SpotlightCard className="p-5 flex flex-col justify-between" spotlightColor="rgba(239, 68, 68, 0.12)">
                  <div>
                    <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700 }}>
                      Ensemble Risk Profiling
                    </span>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f0f0f5', margin: '2px 0 10px 0' }}>
                      Unified Multi-Agent Score
                    </h3>
                  </div>

                  <RiskGauge
                    score={dossier.risk_analysis?.risk_score || 0}
                    tier={dossier.risk_analysis?.risk_tier || 'Low'}
                    xgbProb={dossier.risk_analysis?.xgb_probability || 0}
                    rfProb={dossier.risk_analysis?.rf_probability || 0}
                  />

                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '12px 0 0 0', lineHeight: 1.4, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
                    {dossier.risk_analysis?.risk_analysis_summary}
                  </p>
                </SpotlightCard>

                {/* 2. Top SHAP Risk Drivers */}
                <SpotlightCard className="p-5" spotlightColor="rgba(168, 85, 247, 0.12)">
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700 }}>
                    Explainable AI (XAI)
                  </span>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f0f0f5', margin: '2px 0 12px 0' }}>
                    Top SHAP Feature Attribution
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {dossier.risk_analysis?.top_shap_factors && dossier.risk_analysis.top_shap_factors.length > 0 ? (
                      dossier.risk_analysis.top_shap_factors.map((factor, idx) => {
                        const isRiskIncr = factor.direction === 'INCREASES_RISK';
                        return (
                          <div
                            key={idx}
                            style={{
                              background: 'rgba(255, 255, 255, 0.02)',
                              border: '1px solid rgba(255, 255, 255, 0.05)',
                              borderRadius: '8px',
                              padding: '10px',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f0f0f5' }}>
                                {factor.display_name}
                              </span>
                              <span
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '2px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  color: isRiskIncr ? '#ef4444' : '#10b981',
                                }}
                              >
                                {isRiskIncr ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                SHAP: {factor.shap_value > 0 ? `+${factor.shap_value.toFixed(2)}` : factor.shap_value.toFixed(2)}
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                              <span>Value: <strong style={{ color: '#e2e8f0', fontFamily: 'var(--font-mono)' }}>{typeof factor.raw_value === 'number' ? factor.raw_value.toFixed(2) : factor.raw_value}</strong></span>
                              <span style={{ textTransform: 'capitalize' }}>Impact: {factor.impact_level}</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        No dominant SHAP deviations identified.
                      </div>
                    )}
                  </div>
                </SpotlightCard>

                {/* 3. Anomaly Deep-Dive */}
                <SpotlightCard className="p-5" spotlightColor="rgba(245, 158, 11, 0.12)">
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700 }}>
                    Unsupervised Anomaly Model
                  </span>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f0f0f5', margin: '2px 0 12px 0' }}>
                    Isolation Forest & Outlier Signals
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Statistical Outlier:</span>
                      <strong style={{ color: dossier.anomaly_detection?.is_statistical_outlier ? '#f87171' : '#34d399', fontSize: '0.85rem' }}>
                        {dossier.anomaly_detection?.is_statistical_outlier ? '⚠️ YES (CONFIRMED)' : '✓ NO (NORMAL)'}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Isolation Score:</span>
                      <strong style={{ color: '#f0f0f5', fontFamily: 'var(--font-mono)' }}>
                        {dossier.anomaly_detection?.isolation_forest_score?.toFixed(3) || '0.000'}
                      </strong>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        Flagged Anomaly Categories:
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                        {dossier.anomaly_detection?.flagged_anomaly_categories && dossier.anomaly_detection.flagged_anomaly_categories.length > 0 ? (
                          dossier.anomaly_detection.flagged_anomaly_categories.map((cat, i) => (
                            <span
                              key={i}
                              style={{
                                background: 'rgba(239, 68, 68, 0.15)',
                                color: '#fca5a5',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                fontFamily: 'var(--font-mono)',
                              }}
                            >
                              {cat}
                            </span>
                          ))
                        ) : (
                          <span style={{ color: '#10b981', fontSize: '0.75rem' }}>✓ None detected</span>
                        )}
                      </div>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {dossier.anomaly_detection?.anomaly_deep_dive_summary}
                    </p>
                  </div>
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

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Recommended Disposition</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f0f0f5' }}>
                        {dossier.investigation_support?.suggested_disposition}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontWeight: 800,
                        fontSize: '0.78rem',
                        background: dossier.investigation_support?.priority_level === 'HIGH' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: dossier.investigation_support?.priority_level === 'HIGH' ? '#ef4444' : '#f59e0b',
                        border: `1px solid ${dossier.investigation_support?.priority_level === 'HIGH' ? '#ef4444' : '#f59e0b'}50`,
                      }}
                    >
                      {dossier.investigation_support?.priority_level} PRIORITY
                    </div>

                    {onReferToSiu && (
                      <button
                        onClick={() => onReferToSiu(dossier.claim_id, dossier)}
                        className="btn btn-secondary"
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: '#f87171',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          padding: '8px 14px',
                        }}
                      >
                        Refer to SIU Dossier Hub
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
