import React, { useState } from 'react';
import { SpotlightCard, CountUp, SplitText, ShinyText, BorderBeam } from '../components/reactbits';
import { RiskGauge } from '../components/RiskGauge';
import { Sliders, RotateCcw, AlertTriangle, ShieldCheck, Zap, Info, ArrowRight } from 'lucide-react';

export const SimulatorView: React.FC = () => {
  // Simulator input parameters
  const [claimAmount, setClaimAmount] = useState<number>(21217);
  const [coverageLimit, setCoverageLimit] = useState<number>(120000);
  const [annualPremium, setAnnualPremium] = useState<number>(3000);
  const [filingDelay, setFilingDelay] = useState<number>(22);
  const [activePolicies, setActivePolicies] = useState<number>(1);
  const [hasUnusualNarrative, setHasUnusualNarrative] = useState<boolean>(true);
  const [isEarlyInception, setIsEarlyInception] = useState<boolean>(false);

  // Reset to default
  const handleReset = () => {
    setClaimAmount(21217);
    setCoverageLimit(120000);
    setAnnualPremium(3000);
    setFilingDelay(22);
    setActivePolicies(1);
    setHasUnusualNarrative(true);
    setIsEarlyInception(false);
  };

  // Real-time counterfactual model calculation
  const claimToLimitRatio = claimAmount / Math.max(1, coverageLimit);
  const claimToPremiumRatio = claimAmount / Math.max(1, annualPremium);

  // Risk Score Formula aligned with backend ensemble weights:
  // Base score from claim-to-limit ratio (0 - 35 points)
  let baseScore = Math.min(35, claimToLimitRatio * 40);
  // Premium ratio multiplier (0 - 25 points)
  let premScore = Math.min(25, (claimToPremiumRatio / 10) * 15);
  // Delay penalty: >14 days adds progressive points
  let delayScore = filingDelay > 14 ? Math.min(20, (filingDelay - 14) * 1.5) : 0;
  // Multi-policy discount (more policies = more established policyholder)
  let loyaltyDiscount = Math.min(10, (activePolicies - 1) * 3);
  // Narrative & Inception heuristic flags
  let flagScore = (hasUnusualNarrative ? 18 : 0) + (isEarlyInception ? 25 : 0);

  let simulatedScore = Math.max(5, Math.min(99, Math.round(baseScore + premScore + delayScore + flagScore - loyaltyDiscount)));

  const simulatedTier: 'Low' | 'Medium' | 'High' =
    simulatedScore >= 70 ? 'High' : simulatedScore >= 40 ? 'Medium' : 'Low';

  const simulatedDisposition =
    simulatedScore >= 70
      ? 'Priority SIU Referral (Special Investigation)'
      : simulatedScore >= 40
      ? 'Standard Adjuster Review'
      : 'Fast-Track Straight Through Processing (STP)';

  const xgbSimulatedProb = Math.min(0.99, Math.max(0.05, simulatedScore / 100 + 0.12));
  const rfSimulatedProb = Math.min(0.95, Math.max(0.08, simulatedScore / 100 - 0.08));

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', color: '#c084fc', marginBottom: '8px', fontWeight: 600 }}>
            <Sliders size={14} /> COUNTERFACTUAL WHAT-IF RISK SIMULATOR
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#f0f0f5', letterSpacing: '-0.03em', margin: 0 }}>
            <SplitText text="Interactive Policy & Claim Sensitivity Modeling" delay={25} />
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '6px 0 0 0' }}>
            Perturb claim variables in real-time to observe decision boundary shifts, SHAP sensitivities, and automated triage transitions.
          </p>
        </div>

        <button onClick={handleReset} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RotateCcw size={16} /> Reset to Baseline
        </button>
      </div>

      {/* Main Simulator Workspace */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '24px' }}>
        {/* Sliders Input Panel */}
        <SpotlightCard className="p-6" spotlightColor="rgba(99, 102, 241, 0.15)">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f0f0f5', margin: 0 }}>
              Adjustable Claim & Policy Attributes
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Live Dynamic Re-computation</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Slider 1: Claim Amount */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Claim Loss Amount ($)</span>
                <strong style={{ color: '#818cf8', fontFamily: 'var(--font-mono)' }}>${claimAmount.toLocaleString()}</strong>
              </div>
              <input
                type="range"
                min={500}
                max={150000}
                step={500}
                value={claimAmount}
                onChange={(e) => setClaimAmount(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#6366f1', cursor: 'pointer' }}
              />
            </div>

            {/* Slider 2: Policy Coverage Limit */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Coverage Limit ($)</span>
                <strong style={{ color: '#818cf8', fontFamily: 'var(--font-mono)' }}>${coverageLimit.toLocaleString()}</strong>
              </div>
              <input
                type="range"
                min={5000}
                max={300000}
                step={5000}
                value={coverageLimit}
                onChange={(e) => setCoverageLimit(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#6366f1', cursor: 'pointer' }}
              />
            </div>

            {/* Slider 3: Filing Delay Days */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Filing Delay (Incident to FNOL)</span>
                <strong style={{ color: filingDelay > 14 ? '#fbbf24' : '#818cf8', fontFamily: 'var(--font-mono)' }}>
                  {filingDelay} days
                </strong>
              </div>
              <input
                type="range"
                min={0}
                max={90}
                step={1}
                value={filingDelay}
                onChange={(e) => setFilingDelay(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#6366f1', cursor: 'pointer' }}
              />
            </div>

            {/* Slider 4: Annual Premium */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Customer Annual Premium ($)</span>
                <strong style={{ color: '#818cf8', fontFamily: 'var(--font-mono)' }}>${annualPremium.toLocaleString()}</strong>
              </div>
              <input
                type="range"
                min={200}
                max={15000}
                step={100}
                value={annualPremium}
                onChange={(e) => setAnnualPremium(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#6366f1', cursor: 'pointer' }}
              />
            </div>

            {/* Slider 5: Active Policies Count */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Active Policies in Portfolio</span>
                <strong style={{ color: '#818cf8', fontFamily: 'var(--font-mono)' }}>{activePolicies} policy(s)</strong>
              </div>
              <input
                type="range"
                min={1}
                max={8}
                step={1}
                value={activePolicies}
                onChange={(e) => setActivePolicies(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#6366f1', cursor: 'pointer' }}
              />
            </div>

            {/* Toggle Flags */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.82rem', color: '#e2e8f0' }}>
                <input
                  type="checkbox"
                  checked={hasUnusualNarrative}
                  onChange={(e) => setHasUnusualNarrative(e.target.checked)}
                />
                Unusual Incident Narrative (Theft without forced entry / peer rate discrepancy)
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.82rem', color: '#e2e8f0' }}>
                <input
                  type="checkbox"
                  checked={isEarlyInception}
                  onChange={(e) => setIsEarlyInception(e.target.checked)}
                />
                Early Inception Claim (Filed within 30 days of policy inception)
              </label>
            </div>
          </div>
        </SpotlightCard>

        {/* Counterfactual Prediction Results Card */}
        <SpotlightCard className="p-6 relative overflow-hidden" spotlightColor="rgba(239, 68, 68, 0.15)">
          {simulatedScore >= 70 && <BorderBeam size={260} duration={6} colorFrom="#ef4444" colorTo="#f59e0b" />}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f0f0f5', margin: 0 }}>
              Simulated Risk & Triage Output
            </h3>
            <span style={{ fontSize: '0.72rem', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
              REAL-TIME ENSEMBLE
            </span>
          </div>

          <RiskGauge
            score={simulatedScore}
            tier={simulatedTier}
            xgbProb={xgbSimulatedProb}
            rfProb={rfSimulatedProb}
            size={220}
          />

          {/* Disposition Outcome Box */}
          <div
            style={{
              marginTop: '20px',
              padding: '14px',
              borderRadius: '10px',
              background: simulatedTier === 'High' ? 'rgba(239, 68, 68, 0.12)' : simulatedTier === 'Medium' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
              border: `1px solid ${simulatedTier === 'High' ? '#ef4444' : simulatedTier === 'Medium' ? '#f59e0b' : '#10b981'}40`,
            }}
          >
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700 }}>
              Automated Routing Recommendation
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f0f0f5', marginTop: '4px' }}>
              {simulatedDisposition}
            </div>
          </div>

          {/* Computed Ratios */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '16px' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Claim-to-Limit Exposure</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: claimToLimitRatio > 0.5 ? '#ef4444' : '#f0f0f5', fontFamily: 'var(--font-mono)' }}>
                {(claimToLimitRatio * 100).toFixed(1)}%
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Claim-to-Premium Multiplier</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: claimToPremiumRatio > 10 ? '#ef4444' : '#f0f0f5', fontFamily: 'var(--font-mono)' }}>
                {claimToPremiumRatio.toFixed(1)}x
              </div>
            </div>
          </div>
        </SpotlightCard>
      </div>
    </div>
  );
};
