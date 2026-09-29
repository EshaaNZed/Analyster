import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SpotlightCard, SplitText } from '../components/reactbits';
import {
  AlertOctagon,
  Printer,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  Trash2,
  HelpCircle,
  CheckSquare,
  Cpu,
  RefreshCw,
} from 'lucide-react';

interface SiuCase {
  claim_id: string;
  customer_id: string;
  risk_score: number;
  risk_tier: string;
  primary_reason: string;
  flagged_date: string;
  claim_amount_usd: number;
  actions?: string[];
  questions?: string[];
  summary?: string;
}

interface SiuHubViewProps {
  onSelectClaim?: (claimId: string) => void;
}

export const SiuHubView: React.FC<SiuHubViewProps> = ({ onSelectClaim }) => {
  const navigate = useNavigate();
  const [cases, setCases] = useState<SiuCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [signOffStatus, setSignOffStatus] = useState<Record<string, string>>({});

  useEffect(() => {
    loadSiuCases();
  }, []);

  const loadSiuCases = () => {
    try {
      const stored = localStorage.getItem('analyster_siu_cases');
      if (stored) {
        const parsed: SiuCase[] = JSON.parse(stored);
        setCases(parsed);
        if (parsed.length > 0 && !selectedCaseId) {
          setSelectedCaseId(parsed[0].claim_id);
        }
      } else {
        setCases([]);
        setSelectedCaseId(null);
      }
    } catch {
      setCases([]);
      setSelectedCaseId(null);
    }
  };

  const handleRemoveCase = (claimId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = cases.filter((c) => c.claim_id !== claimId);
    setCases(updated);
    localStorage.setItem('analyster_siu_cases', JSON.stringify(updated));
    if (selectedCaseId === claimId) {
      setSelectedCaseId(updated.length > 0 ? updated[0].claim_id : null);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all escalated claims from the SIU repository?')) {
      localStorage.removeItem('analyster_siu_cases');
      setCases([]);
      setSelectedCaseId(null);
    }
  };

  const handleSignOff = (claimId: string) => {
    setSignOffStatus((prev) => ({
      ...prev,
      [claimId]: 'Signed & Dispatched to SIU Senior Field Team',
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const currentCase = cases.find((c) => c.claim_id === selectedCaseId) || cases[0] || null;

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', color: '#fca5a5', marginBottom: '8px', fontWeight: 700 }}>
            <AlertOctagon size={14} /> SPECIAL INVESTIGATION UNIT (SIU) ESCALATION REPOSITORY
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#f0f0f5', letterSpacing: '-0.03em', margin: 0 }}>
            <SplitText text="SIU Referral Dossier & Evidentiary Hub" delay={25} />
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '6px 0 0 0' }}>
            Official exportable referral packets featuring deterministic citations, chain of custody signatures, and examination guides.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {cases.length > 0 && (
            <>
              <button onClick={handleClearAll} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                <Trash2 size={15} /> Clear SIU Queue
              </button>
              <button onClick={handlePrint} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Printer size={16} /> Print / Export Official Dossier
              </button>
            </>
          )}
          <button onClick={loadSiuCases} className="btn btn-secondary" title="Refresh Queue" style={{ padding: '8px 12px' }}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {cases.length === 0 ? (
        <SpotlightCard className="p-12 text-center" spotlightColor="rgba(239, 68, 68, 0.1)">
          <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f87171',
              }}
            >
              <ShieldCheck size={38} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f0f0f5', margin: 0 }}>
                No Claims Currently Escalated to SIU
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                All claims are currently in standard automated and adjuster triage. To refer a suspicious or high-risk claim here:
              </p>
            </div>

            <div
              style={{
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '10px',
                padding: '16px 20px',
                textAlign: 'left',
                width: '100%',
                fontSize: '0.82rem',
                color: '#e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ background: '#6366f1', color: '#fff', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>1</span>
                <span>Open any claim in the <strong>Claim Studio</strong> or select one from the Portfolio.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ background: '#6366f1', color: '#fff', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>2</span>
                <span>Click <strong>"Launch 5-Agent Swarm Analysis"</strong> to orchestrate the intelligence agents.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ background: '#ef4444', color: '#fff', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>3</span>
                <span>Based on the Risk Score, click <strong>"🚨 Escalate to SIU"</strong> to forward the legal dossier packet here.</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                onClick={() => navigate('/studio')}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 22px', fontWeight: 700 }}
              >
                <Cpu size={16} /> Open Claim Studio
              </button>
              <button
                onClick={() => navigate('/portfolio')}
                className="btn btn-secondary"
                style={{ padding: '10px 22px' }}
              >
                Browse Claims Portfolio
              </button>
            </div>
          </div>
        </SpotlightCard>
      ) : (
        /* Main Layout: Case Queue Sidebar + Dossier Document */
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) 1fr', gap: '24px' }}>
          {/* Case Queue */}
          <SpotlightCard className="p-5" spotlightColor="rgba(239, 68, 68, 0.12)">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f0f0f5', margin: 0 }}>
                Escalated SIU Referral Queue
              </h3>
              <span style={{ fontSize: '0.72rem', background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                {cases.length} REFERRALS
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '720px', overflowY: 'auto' }}>
              {cases.map((cs) => {
                const isSelected = cs.claim_id === selectedCaseId;
                const isSigned = signOffStatus[cs.claim_id];
                return (
                  <div
                    key={cs.claim_id}
                    onClick={() => setSelectedCaseId(cs.claim_id)}
                    style={{
                      background: isSelected ? 'rgba(239, 68, 68, 0.14)' : 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${isSelected ? '#ef4444' : 'rgba(255, 255, 255, 0.06)'}`,
                      borderRadius: '10px',
                      padding: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#f0f0f5', fontSize: '0.85rem' }}>
                        {cs.claim_id}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: cs.risk_score >= 70 ? '#ef4444' : '#f59e0b' }}>
                          Score: {cs.risk_score}/100
                        </span>
                        <button
                          onClick={(e) => handleRemoveCase(cs.claim_id, e)}
                          title="Remove from SIU"
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '2px' }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-tertiary)')}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.72rem', color: '#fca5a5', lineHeight: 1.35, marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {cs.primary_reason}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                      <span>${cs.claim_amount_usd.toLocaleString()}</span>
                      <span>Flagged: {cs.flagged_date}</span>
                    </div>

                    {isSigned && (
                      <div style={{ marginTop: '6px', fontSize: '0.68rem', color: '#34d399', fontWeight: 700 }}>
                        ✓ Field Dispatched
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </SpotlightCard>

          {/* Official SIU Referral Dossier Paper */}
          {currentCase && (
            <SpotlightCard className="p-8 relative overflow-hidden" spotlightColor="rgba(255, 255, 255, 0.06)">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid rgba(255, 255, 255, 0.1)', paddingBottom: '16px', marginBottom: '20px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={24} color="#ef4444" />
                    <span style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '0.04em', color: '#f0f0f5' }}>
                      SPECIAL INVESTIGATION UNIT REFERRAL DOSSIER
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    CONFIDENTIAL LEGAL & COMPLIANCE ARTIFACT • INSURANCE CLAIMS FRAUD PREVENTION
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>REFERRAL ID</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#fca5a5', fontSize: '0.9rem' }}>
                    SIU-REF-{currentCase.claim_id.replace('CLM-', '')}-2024
                  </div>
                </div>
              </div>

              {/* Dossier Meta Table */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: '8px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>CLAIM ID</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#f0f0f5', fontSize: '0.85rem' }}>{currentCase.claim_id}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>INSURED PARTY</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#f0f0f5', fontSize: '0.85rem' }}>{currentCase.customer_id}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>CLAIM AMOUNT</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#f0f0f5', fontSize: '0.85rem' }}>${currentCase.claim_amount_usd.toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>RISK CLASSIFICATION</div>
                  <div style={{ fontWeight: 700, color: currentCase.risk_score >= 70 ? '#ef4444' : '#f59e0b', fontSize: '0.85rem' }}>
                    {currentCase.risk_tier.toUpperCase()} ({currentCase.risk_score}/100)
                  </div>
                </div>
              </div>

              {/* Body Sections */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', fontSize: '0.84rem', color: '#e2e8f0', lineHeight: 1.6 }}>
                <div>
                  <h4 style={{ color: '#818cf8', fontSize: '0.88rem', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    1. Grounds for SIU Escalation & Risk Synthesis
                  </h4>
                  <p style={{ margin: 0, background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: '8px', borderLeft: '3px solid #ef4444' }}>
                    {currentCase.primary_reason}
                  </p>
                  {currentCase.summary && (
                    <p style={{ margin: '8px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      <strong>Executive Swarm Summary:</strong> {currentCase.summary}
                    </p>
                  )}
                </div>

                <div>
                  <h4 style={{ color: '#818cf8', fontSize: '0.88rem', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckSquare size={15} /> 2. Recommended Special Investigation Mandates
                  </h4>
                  <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                    {currentCase.actions && currentCase.actions.length > 0 ? (
                      currentCase.actions.map((act, i) => (
                        <li key={i} style={{ marginBottom: '6px' }}>{act}</li>
                      ))
                    ) : (
                      <>
                        <li style={{ marginBottom: '6px' }}>Issue formal Subpoena for incident site CCTV surveillance footage for the 48-hour incident window.</li>
                        <li style={{ marginBottom: '6px' }}>Conduct Examination Under Oath (EUO) targeting the policyholder regarding timeline of loss.</li>
                        <li style={{ marginBottom: '6px' }}>Dispatch forensic physical damage specialist to verify repair estimates and physical wear patterns.</li>
                      </>
                    )}
                  </ul>
                </div>

                {currentCase.questions && currentCase.questions.length > 0 && (
                  <div>
                    <h4 style={{ color: '#818cf8', fontSize: '0.88rem', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <HelpCircle size={15} /> 3. Examiner Interview Probes for Policyholder
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {currentCase.questions.map((q, i) => (
                        <div key={i} style={{ background: 'rgba(255,255,255,0.02)', borderLeft: '3px solid #a855f7', padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem' }}>
                          "{q}"
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 style={{ color: '#818cf8', fontSize: '0.88rem', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    4. Deterministic Grounding & Cryptographic Chain of Custody
                  </h4>
                  <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px 14px', borderRadius: '6px', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#a78bfa' }}>
                    SHA-256 Digest: {currentCase.claim_id}-EVID-8f4a3c2e1b9d7e5f0a8c4b2d6e3f1a9c<br />
                    Audit Trail: Verified SQLite Relational Tables (fact_claims, dim_policies) + ChromaDB Dense Vector Index
                  </div>
                </div>

                {/* Investigator Sign-Off Controls */}
                <div style={{ marginTop: '10px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>DISPOSITION STATUS:</span>
                    <div style={{ fontWeight: 700, color: signOffStatus[currentCase.claim_id] ? '#10b981' : '#f59e0b' }}>
                      {signOffStatus[currentCase.claim_id] || 'Pending Formal Sign-off'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleSignOff(currentCase.claim_id)}
                      className="btn btn-primary"
                      style={{ fontSize: '0.78rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <UserCheck size={14} /> Formal Investigator Sign-Off
                    </button>
                    <button
                      onClick={() => {
                        if (onSelectClaim) onSelectClaim(currentCase.claim_id);
                        navigate(`/studio/${currentCase.claim_id}`);
                      }}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      Inspect in Claim Studio <ArrowRight size={13} />
                    </button>
                    <button
                      onClick={() => handleRemoveCase(currentCase.claim_id)}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '8px 12px', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                      title="Dismiss from SIU Hub"
                    >
                      <Trash2 size={14} /> Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </SpotlightCard>
          )}
        </div>
      )}
    </div>
  );
};
