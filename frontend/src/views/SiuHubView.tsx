import React, { useState } from 'react';
import { SpotlightCard, CountUp, SplitText, ShinyText, DecryptedText, BorderBeam } from '../components/reactbits';
import { AlertOctagon, Printer, Download, ShieldCheck, CheckCircle2, FileText, UserCheck, AlertTriangle } from 'lucide-react';

interface SiuHubViewProps {
  onSelectClaim: (claimId: string) => void;
}

export const SiuHubView: React.FC<SiuHubViewProps> = ({ onSelectClaim }) => {
  const [selectedCase, setSelectedCase] = useState<string>('CLM-2024-00003');
  const [signOffStatus, setSignOffStatus] = useState<string>('Pending Formal Sign-off');

  const cases = [
    {
      claim_id: 'CLM-2024-00003',
      customer_id: 'CUST-04819',
      risk_score: 69,
      risk_tier: 'Medium',
      primary_reason: 'PHANTOM_LUXURY_BOAT_THEFT: Twin engines unbolted overnight without perimeter fence damage',
      flagged_date: '2024-08-14',
      claim_amount_usd: 21217.82,
    },
    {
      claim_id: 'CLM-2024-00725',
      customer_id: 'CUST-02194',
      risk_score: 88,
      risk_tier: 'High',
      primary_reason: 'SUSPICIOUS_EARLY_INCEPTION_FIRE: Total loss fire reported 12 days post policy activation',
      flagged_date: '2024-07-20',
      claim_amount_usd: 54089.60,
    },
    {
      claim_id: 'CLM-2024-00956',
      customer_id: 'CUST-03310',
      risk_score: 82,
      risk_tier: 'High',
      primary_reason: 'REPAIR_ESTIMATE_DISCREPANCY: Labor & parts exceed regional peer benchmarks by +42%',
      flagged_date: '2024-06-11',
      claim_amount_usd: 38400.00,
    },
  ];

  const currentCase = cases.find((c) => c.claim_id === selectedCase) || cases[0];

  const handlePrint = () => {
    window.print();
  };

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

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handlePrint} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Printer size={16} /> Print / Export Official Dossier
          </button>
        </div>
      </div>

      {/* Main Layout: Case Queue Sidebar + Dossier Document */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 360px) 1fr', gap: '24px' }}>
        {/* Case Queue */}
        <SpotlightCard className="p-5" spotlightColor="rgba(239, 68, 68, 0.12)">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f0f0f5', margin: 0 }}>
              Priority SIU Referral Queue
            </h3>
            <span style={{ fontSize: '0.72rem', background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
              {cases.length} FLAGGED
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {cases.map((cs) => {
              const isSelected = cs.claim_id === selectedCase;
              return (
                <div
                  key={cs.claim_id}
                  onClick={() => setSelectedCase(cs.claim_id)}
                  style={{
                    background: isSelected ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${isSelected ? '#ef4444' : 'rgba(255, 255, 255, 0.06)'}`,
                    borderRadius: '10px',
                    padding: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#f0f0f5', fontSize: '0.85rem' }}>
                      {cs.claim_id}
                    </span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: cs.risk_tier === 'High' ? '#ef4444' : '#f59e0b' }}>
                      Score: {cs.risk_score}/100
                    </span>
                  </div>

                  <div style={{ fontSize: '0.72rem', color: '#fca5a5', lineHeight: 1.3, marginBottom: '6px' }}>
                    {cs.primary_reason}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                    <span>Amount: ${cs.claim_amount_usd.toLocaleString()}</span>
                    <span>Date: {cs.flagged_date}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </SpotlightCard>

        {/* Official SIU Referral Dossier Paper */}
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: '8px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
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
              <div style={{ fontWeight: 700, color: '#ef4444', fontSize: '0.85rem' }}>{currentCase.risk_tier.toUpperCase()} ({currentCase.risk_score}/100)</div>
            </div>
          </div>

          {/* Body Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.84rem', color: '#e2e8f0', lineHeight: 1.6 }}>
            <div>
              <h4 style={{ color: '#818cf8', fontSize: '0.9rem', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                1. Grounds for SIU Escalation
              </h4>
              <p style={{ margin: 0, background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '6px' }}>
                {currentCase.primary_reason}. Multi-agent anomaly audit identified elevated claim-to-premium leverage and statistical divergence from regional policyholder cohorts.
              </p>
            </div>

            <div>
              <h4 style={{ color: '#818cf8', fontSize: '0.9rem', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                2. Recommended Special Investigation Mandates
              </h4>
              <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                <li>Issue formal Subpoena for marina / parking garage CCTV surveillance footage for the 48-hour incident window.</li>
                <li>Conduct Examination Under Oath (EUO) targeting the policyholder regarding timeline of recent title transfer and engine serial numbers.</li>
                <li>Dispatch forensic physical damage specialist to verify unbolted mount wear patterns versus reported tool markings.</li>
              </ul>
            </div>

            <div>
              <h4 style={{ color: '#818cf8', fontSize: '0.9rem', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                3. Deterministic Grounding & Cryptographic Chain of Custody
              </h4>
              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px 14px', borderRadius: '6px', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#a78bfa' }}>
                SHA-256 Digest: 8f4a3c2e1b9d7e5f0a8c4b2d6e3f1a9c8b7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f<br />
                Audit Trail: Verified SQLite Relational Tables (fact_claims, dim_policies) + ChromaDB Dense Vector Index
              </div>
            </div>

            {/* Investigator Sign-Off Controls */}
            <div style={{ marginTop: '10px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>DISPOSITION STATUS:</span>
                <div style={{ fontWeight: 700, color: signOffStatus.includes('Signed') ? '#10b981' : '#f59e0b' }}>
                  {signOffStatus}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setSignOffStatus('Signed & Dispatched to SIU Senior Field Team')}
                  className="btn btn-primary"
                  style={{ fontSize: '0.78rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <UserCheck size={14} /> Formal Investigator Sign-Off
                </button>
                <button
                  onClick={() => onSelectClaim(currentCase.claim_id)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.78rem', padding: '8px 16px' }}
                >
                  Inspect in Claim Studio
                </button>
              </div>
            </div>
          </div>
        </SpotlightCard>
      </div>
    </div>
  );
};
