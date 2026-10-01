import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { evaluateNewClaim } from '../api/client';
import { AnalyzeDossier, NewClaimInput } from '../types/claims';
import { SpotlightCard, ShinyText, BorderBeam, SplitText, CountUp } from '../components/reactbits';
import { RiskGauge } from '../components/RiskGauge';
import { AgentWarRoom } from '../components/AgentWarRoom';
import {
  FilePlus, Cpu, Play, CheckCircle2, AlertTriangle, ShieldCheck, Clock,
  DollarSign, FileText, User, Sparkles, ArrowRight, Layers, ShieldAlert,
  HelpCircle, RefreshCw, Shield
} from 'lucide-react';

export const ClaimIntakeView: React.FC = () => {
  const navigate = useNavigate();

  // Form state
  const [claimId, setClaimId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [policyLine, setPolicyLine] = useState('Auto');
  const [incidentSeverity, setIncidentSeverity] = useState('Minor');
  const [incidentType, setIncidentType] = useState('Rear-End Collision');
  const [claimAmount, setClaimAmount] = useState<number>(4500);
  const [coverageLimit, setCoverageLimit] = useState<number>(25000);
  const [annualPremium, setAnnualPremium] = useState<number>(1200);
  const [incidentDate, setIncidentDate] = useState('2024-08-20');
  const [filingDate, setFilingDate] = useState('2024-08-23');
  const [filingDelayDays, setFilingDelayDays] = useState<number>(3);
  const [customerSubtype, setCustomerSubtype] = useState('Middle Class Families');
  const [customerMainType, setCustomerMainType] = useState('Family with grown-ups');
  const [ageGroup, setAgeGroup] = useState('36-50');
  const [householdSize, setHouseholdSize] = useState<number>(3);
  const [activePolicies, setActivePolicies] = useState<number>(2);
  const [purchasingPowerTier, setPurchasingPowerTier] = useState<number>(5);
  const [incidentNarrative, setIncidentNarrative] = useState(
    'Claimant reports minor vehicle collision damage on rear bumper during regular commute. Police report filed promptly at local precinct with photos on record.'
  );
  const [adjusterNotes, setAdjusterNotes] = useState('Routine First Notice of Loss (FNOL) intake evaluation.');
  const [saveToDb, setSaveToDb] = useState(true);

  // Execution state
  const [submitting, setSubmitting] = useState(false);
  const [dossier, setDossier] = useState<AnalyzeDossier | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Derived financial exposures
  const claimToLimitRatio = (claimAmount / Math.max(1, coverageLimit)).toFixed(2);
  const claimToPremiumRatio = (claimAmount / Math.max(1, annualPremium)).toFixed(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setDossier(null);

    const payload: NewClaimInput = {
      claim_id: claimId.trim() || undefined,
      customer_id: customerId.trim() || undefined,
      policy_line: policyLine,
      incident_severity: incidentSeverity,
      incident_type: incidentType,
      claim_amount_usd: claimAmount,
      coverage_limit_usd: coverageLimit,
      annual_premium_usd: annualPremium,
      incident_date: incidentDate,
      filing_date: filingDate,
      filing_delay_days: filingDelayDays,
      customer_subtype: customerSubtype,
      customer_main_type: customerMainType,
      age_group: ageGroup,
      household_size: householdSize,
      total_active_policies: activePolicies,
      purchasing_power_tier: purchasingPowerTier,
      incident_narrative: incidentNarrative,
      adjuster_notes: adjusterNotes,
      save_to_database: saveToDb,
    };

    try {
      const res = await evaluateNewClaim(payload);
      setDossier(res);
    } catch (err: any) {
      setError(err.message || 'Failed to evaluate new claim intake');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setClaimId('');
    setCustomerId('');
    setClaimAmount(24500);
    setCoverageLimit(65000);
    setAnnualPremium(2400);
    setFilingDelayDays(18);
    setIncidentNarrative(
      'Claimant reports vehicle was parked outside residence overnight when severe collision damage occurred. No eyewitnesses were available, and police report was requested 18 days after incident date.'
    );
    setDossier(null);
    setError(null);
  };

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', color: '#a5b4fc', marginBottom: '8px', fontWeight: 600 }}>
            <FilePlus size={14} /> FIRST NOTICE OF LOSS (FNOL) INTAKE
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#f0f0f5', letterSpacing: '-0.03em', margin: 0 }}>
            New Claim Intake & Live Swarm Evaluator
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', margin: '8px 0 0 0', maxWidth: '800px' }}>
            Submit a new claim. The score is 65% within-line severity, 35% pattern probability, plus 1 point for each day filed after day 14.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
        >
          <RefreshCw size={14} /> Reset Form
        </button>
      </div>

      {/* Main Form Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: dossier ? '1fr' : 'repeat(auto-fit, minmax(440px, 1fr))', gap: '28px' }}>
        
        {/* Left Column: Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Card 1: Core Identifiers & Policy Line */}
          <SpotlightCard spotlightColor="rgba(99, 102, 241, 0.15)">
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f0f0f5', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={18} color="#818cf8" /> Policy & Incident Classification
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Policy Line *
                  </label>
                  <select
                    value={policyLine}
                    onChange={(e) => setPolicyLine(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#f0f0f5',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  >
                    <option value="Auto" style={{ background: '#1a1a24' }}>Auto</option>
                    <option value="Fire" style={{ background: '#1a1a24' }}>Fire</option>
                    <option value="Boat" style={{ background: '#1a1a24' }}>Boat</option>
                    <option value="Caravan" style={{ background: '#1a1a24' }}>Caravan</option>
                    <option value="Private Accident" style={{ background: '#1a1a24' }}>Private Accident</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Incident Severity *
                  </label>
                  <select
                    value={incidentSeverity}
                    onChange={(e) => setIncidentSeverity(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#f0f0f5',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  >
                    <option value="Minor" style={{ background: '#1a1a24' }}>Minor (&lt; $5,000)</option>
                    <option value="Moderate" style={{ background: '#1a1a24' }}>Moderate ($5,000 - $20,000)</option>
                    <option value="Major" style={{ background: '#1a1a24' }}>Major ($20,000 - $75,000)</option>
                    <option value="Critical / Total Loss" style={{ background: '#1a1a24' }}>Critical / Total Loss (&gt; $75,000)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Incident Type / Category *
                </label>
                <input
                  type="text"
                  value={incidentType}
                  onChange={(e) => setIncidentType(e.target.value)}
                  placeholder="e.g. Collision, Theft, Water Intrusion, Fire"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#f0f0f5',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Custom Claim ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={claimId}
                    onChange={(e) => setClaimId(e.target.value)}
                    placeholder="Auto-generated if empty"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#f0f0f5',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.82rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Customer ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    placeholder="Auto-generated if empty"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#f0f0f5',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.82rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            </div>
          </SpotlightCard>

          {/* Card 2: Financial Exposures & Ratios */}
          <SpotlightCard spotlightColor="rgba(56, 189, 248, 0.15)">
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f0f0f5', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={18} color="#38bdf8" /> Financial Exposure & Policy Bounds
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Claim Loss Amount ($) *
                  </label>
                  <input
                    type="number"
                    value={claimAmount}
                    min="0"
                    max="10000000"
                    step="any"
                    onChange={(e) => setClaimAmount(Number(e.target.value))}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#38bdf8',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Coverage Limit ($) *
                  </label>
                  <input
                    type="number"
                    value={coverageLimit}
                    min="0"
                    max="10000000"
                    step="any"
                    onChange={(e) => setCoverageLimit(Number(e.target.value))}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#f0f0f5',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Annual Premium ($) *
                  </label>
                  <input
                    type="number"
                    value={annualPremium}
                    min="0"
                    max="10000000"
                    step="any"
                    onChange={(e) => setAnnualPremium(Number(e.target.value))}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#f0f0f5',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Exposure Indicators */}
              <div style={{ display: 'flex', gap: '16px', background: 'rgba(0, 0, 0, 0.3)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>CLAIM-TO-LIMIT RATIO</span>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: Number(claimToLimitRatio) > 0.8 ? '#f87171' : '#34d399', fontFamily: 'var(--font-mono)' }}>
                    {claimToLimitRatio}x ({Math.round(Number(claimToLimitRatio) * 100)}%)
                  </div>
                </div>
                <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.08)', paddingLeft: '16px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>PREMIUM MULTIPLIER</span>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: Number(claimToPremiumRatio) > 10 ? '#f87171' : '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                    {claimToPremiumRatio}x annual
                  </div>
                </div>
              </div>
            </div>
          </SpotlightCard>

          {/* Card 3: Dates & Delay */}
          <SpotlightCard spotlightColor="rgba(245, 158, 11, 0.15)">
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f0f0f5', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="#fbbf24" /> Incident Timing & Filing Delay
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Incident Date
                  </label>
                  <input
                    type="date"
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#f0f0f5',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Filing Date
                  </label>
                  <input
                    type="date"
                    value={filingDate}
                    onChange={(e) => setFilingDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#f0f0f5',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Filing Delay (Days) *
                  </label>
                  <input
                    type="number"
                    value={filingDelayDays}
                    min="0"
                    max="365"
                    onChange={(e) => setFilingDelayDays(Number(e.target.value))}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: filingDelayDays > 14 ? '#fbbf24' : '#f0f0f5',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {filingDelayDays > 14 && (
                <div style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.75rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={14} /> Filed {filingDelayDays} days after the loss. That adds {Math.min(46, filingDelayDays - 14)} points: 1 point per day after day 14, capped at 46.
                </div>
              )}
            </div>
          </SpotlightCard>

          {/* Card 4: Policyholder Demographics & Household Profile */}
          <SpotlightCard spotlightColor="rgba(168, 85, 247, 0.15)">
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f0f0f5', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={18} color="#c084fc" /> Policyholder profile
                <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Not used in the score</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Purchasing power bracket (profile only)
                  </label>
                  <select
                    value={purchasingPowerTier}
                    onChange={(e) => setPurchasingPowerTier(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#c084fc',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  >
                    <option value={1} style={{ background: '#1a1a24' }}>Bracket 1: Very Low Income / Subsidized</option>
                    <option value={2} style={{ background: '#1a1a24' }}>Bracket 2: Low Income / Hourly Wage</option>
                    <option value={3} style={{ background: '#1a1a24' }}>Bracket 3: Lower Middle Class</option>
                    <option value={4} style={{ background: '#1a1a24' }}>Bracket 4: Middle Class / Average</option>
                    <option value={5} style={{ background: '#1a1a24' }}>Bracket 5: Upper Middle Class</option>
                    <option value={6} style={{ background: '#1a1a24' }}>Bracket 6: Affluent / High Earner</option>
                    <option value={7} style={{ background: '#1a1a24' }}>Bracket 7: Very High Income</option>
                    <option value={8} style={{ background: '#1a1a24' }}>Bracket 8: Ultra High Net Worth</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Customer Demographic Subtype *
                  </label>
                  <select
                    value={customerSubtype}
                    onChange={(e) => setCustomerSubtype(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#f0f0f5',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  >
                    <option value="Middle Class Families" style={{ background: '#1a1a24' }}>Middle Class Families</option>
                    <option value="Successful Entrepreneurs" style={{ background: '#1a1a24' }}>Successful Entrepreneurs</option>
                    <option value="Career and childcare" style={{ background: '#1a1a24' }}>Career and childcare</option>
                    <option value="Young singles with career" style={{ background: '#1a1a24' }}>Young singles with career</option>
                    <option value="Active Retirees" style={{ background: '#1a1a24' }}>Active Retirees</option>
                    <option value="Lower class large families" style={{ background: '#1a1a24' }}>Lower class large families</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Household size (profile only)
                  </label>
                  <input
                    type="number"
                    value={householdSize}
                    min="1"
                    max="10"
                    onChange={(e) => setHouseholdSize(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#f0f0f5',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Active policies (profile only)
                  </label>
                  <input
                    type="number"
                    value={activePolicies}
                    min="0"
                    max="15"
                    onChange={(e) => setActivePolicies(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#f0f0f5',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Age Group
                  </label>
                  <select
                    value={ageGroup}
                    onChange={(e) => setAgeGroup(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#f0f0f5',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  >
                    <option value="20-30 years" style={{ background: '#1a1a24' }}>20-30 years</option>
                    <option value="30-40 years" style={{ background: '#1a1a24' }}>30-40 years</option>
                    <option value="36-50" style={{ background: '#1a1a24' }}>36-50 years</option>
                    <option value="50-60 years" style={{ background: '#1a1a24' }}>50-60 years</option>
                    <option value="60-70 years" style={{ background: '#1a1a24' }}>60-70 years</option>
                  </select>
                </div>
              </div>
            </div>
          </SpotlightCard>

          {/* Card 5: Incident Narrative */}
          <SpotlightCard spotlightColor="rgba(192, 132, 252, 0.15)">
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f0f0f5', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#c084fc" /> Incident Narrative & Adjuster Notes
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Incident Narrative (Processed by ChromaDB Dense MiniLM Embeddings) *
                </label>
                <textarea
                  rows={4}
                  value={incidentNarrative}
                  onChange={(e) => setIncidentNarrative(e.target.value)}
                  required
                  placeholder="Provide complete incident narrative for semantic precedent matching..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#f0f0f5',
                    fontSize: '0.85rem',
                    lineHeight: 1.5,
                    resize: 'vertical',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Initial Adjuster Notes
                </label>
                <input
                  type="text"
                  value={adjusterNotes}
                  onChange={(e) => setAdjusterNotes(e.target.value)}
                  placeholder="e.g. FNOL intake inspection requested"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#f0f0f5',
                    fontSize: '0.82rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '8px' }}>
                <input
                  type="checkbox"
                  id="saveToDb"
                  checked={saveToDb}
                  onChange={(e) => setSaveToDb(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#6366f1', cursor: 'pointer' }}
                />
                <label htmlFor="saveToDb" style={{ fontSize: '0.8rem', color: '#e2e8f0', cursor: 'pointer' }}>
                  Persist into SQLite Claims Database and ChromaDB Vector Store
                </label>
              </div>
            </div>
          </SpotlightCard>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
            style={{
              padding: '16px',
              fontSize: '1rem',
              fontWeight: 800,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              boxShadow: '0 0 30px rgba(99, 102, 241, 0.4)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
            }}
          >
            {submitting ? (
              <>
                <Cpu size={20} className="animate-spin" />
                <span>Orchestrating 5-Agent Swarm on New FNOL Intake...</span>
              </>
            ) : (
              <>
                <Play size={20} fill="currentColor" />
                <span>Evaluate Claim with 5-Agent Swarm</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>

          {error && (
            <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '10px', color: '#f87171', fontSize: '0.85rem' }}>
              <strong>Submission Error:</strong> {error}
            </div>
          )}
        </form>

        {/* Right Column / Results: Swarm Execution & Intelligence Dossier */}
        {dossier && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Triage Summary Card */}
            <SpotlightCard spotlightColor="rgba(99, 102, 241, 0.2)">
              <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#a5b4fc', fontWeight: 700, textTransform: 'uppercase' }}>
                      NEW CLAIM INTAKE EVALUATION COMPLETE
                    </span>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f0f0f5', margin: '4px 0 0 0', fontFamily: 'var(--font-mono)' }}>
                      {dossier.claim_id}
                    </h2>
                  </div>

                  <span
                    style={{
                      padding: '6px 14px',
                      borderRadius: '999px',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      background:
                        dossier.risk_analysis?.risk_tier === 'High'
                          ? 'rgba(239, 68, 68, 0.2)'
                          : dossier.risk_analysis?.risk_tier === 'Medium'
                          ? 'rgba(245, 158, 11, 0.2)'
                          : 'rgba(16, 185, 129, 0.2)',
                      color:
                        dossier.risk_analysis?.risk_tier === 'High'
                          ? '#ef4444'
                          : dossier.risk_analysis?.risk_tier === 'Medium'
                          ? '#f59e0b'
                          : '#10b981',
                      border: `1px solid ${
                        dossier.risk_analysis?.risk_tier === 'High' ? '#ef4444' : dossier.risk_analysis?.risk_tier === 'Medium' ? '#f59e0b' : '#10b981'
                      }`,
                    }}
                  >
                    {dossier.risk_analysis?.risk_tier?.toUpperCase()} RISK TIER
                  </span>
                </div>

                <RiskGauge
                  score={dossier.risk_analysis?.risk_score || 0}
                  tier={dossier.risk_analysis?.risk_tier || 'Low'}
                  xgbProb={dossier.risk_analysis?.xgb_probability || 0}
                  rfProb={dossier.risk_analysis?.rf_probability || 0}
                  severityScore={dossier.risk_analysis?.severity_score}
                  delayNoticePoints={dossier.risk_analysis?.delay_notice_points}
                  size={220}
                />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', background: 'rgba(0, 0, 0, 0.3)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>TRIAGE SCORE</span>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#a78bfa', fontFamily: 'var(--font-mono)' }}>
                      {dossier.risk_analysis?.risk_score ?? 0}<span style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>/100</span>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>ISOLATION FOREST OUTLIER</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: dossier.anomaly_detection?.is_statistical_outlier ? '#fbbf24' : '#10b981', marginTop: '6px' }}>
                      {dossier.anomaly_detection?.is_statistical_outlier ? '⚠️ OUTLIER DETECTED' : 'NORMAL DISTRIBUTION'}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>SWARM INFERENCE LATENCY</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)', marginTop: '6px' }}>
                      {dossier.total_latency_ms} ms
                    </div>
                  </div>
                </div>

                {/* Executive Brief */}
                {dossier.summarization?.executive_summary && (
                  <div style={{ background: 'rgba(99, 102, 241, 0.06)', borderLeft: '3px solid #818cf8', padding: '16px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#a5b4fc', marginBottom: '6px' }}>
                      GROUNDED EXECUTIVE BRIEF
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.6, margin: 0 }}>
                      {dossier.summarization.executive_summary}
                    </p>
                  </div>
                )}

                {/* Direct Action Links */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => navigate(`/studio/${dossier.claim_id}`)}
                    className="btn btn-primary"
                    style={{ fontSize: '0.85rem', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    Open in Full Claim Studio <ArrowRight size={14} />
                  </button>

                  <button
                    onClick={() => navigate(`/graph?entity=${dossier.claim_id}`)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.85rem', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    View in Knowledge Graph
                  </button>
                </div>
              </div>
            </SpotlightCard>

            {/* Agent Execution Stepper */}
            {dossier.execution_steps && (
              <AgentWarRoom
                steps={dossier.execution_steps}
                messages={dossier.a2a_messages || []}
                totalLatencyMs={dossier.total_latency_ms}
              />
            )}
          </div>
        )}

      </div>
    </div>
  );
};
