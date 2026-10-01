import React, { useState } from 'react';
import { SpotlightCard, SplitText, BorderBeam } from '../components/reactbits';
import {
  GitBranch, Cpu, Database, Network, Shield, CheckCircle2, ArrowRight,
  Layers, Lock, Terminal, Activity, FileCode, Sliders, AlertTriangle
} from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'mesh' | 'ensemble' | 'rag' | 'governance'>('mesh');

  const agents = [
    {
      name: 'ClaimsRetrievalAgent',
      role: 'Dual-Channel Dense & Graph-RAG Retrieval',
      color: '#38bdf8',
      inputs: 'Raw Claim ID, Narrative Embeddings',
      outputs: 'Similar Precedents (ChromaDB), 2-Hop NetworkX Entities',
      desc: 'Searches vector database (all-MiniLM-L6-v2) for semantically matched historic claims and traverses graph neighbors to spot shared brokers, addresses, and policy syndicates.',
    },
    {
      name: 'ClaimsRiskAnalysisAgent',
      role: 'Supervised Calibrated Risk Classification',
      color: '#818cf8',
      inputs: 'Claim & Policy Metrics, Precedents',
      outputs: 'Calibrated Risk Score (0-100), SHAP Feature Attributions',
      desc: 'Builds the triage score: 65% within-line severity, 35% XGBoost pattern probability, plus 1 point per day filed after day 14. TreeSHAP explains the pattern half only.',
    },
    {
      name: 'AnomalyDetectionAgent',
      role: 'Unsupervised Outlier & Velocity Auditing',
      color: '#c084fc',
      inputs: 'Behavior features shared with the pattern model',
      outputs: 'Isolation Forest outlier flag, filing-delay flag, graph cluster flag',
      desc: 'Flags unusual behavior. The outlier flag does not set the 0–100 tier. A filing after 40 days and a household cluster are reported as separate flags.',
    },
    {
      name: 'ClaimsSummarizationAgent',
      role: '100% Faithful Executive Brief Generation',
      color: '#34d399',
      inputs: 'Aggregated Agent Findings, Verified Database Records',
      outputs: 'Executive Summary Brief with Strict Citation Tags',
      desc: 'Synthesizes an adjuster-ready executive brief strictly grounded in retrieved database records. Backed by Gemini with deterministic rule-based template fallback.',
    },
    {
      name: 'InvestigationSupportAgent',
      role: 'SIU Referral & Forensic Checklist Generation',
      color: '#f87171',
      inputs: 'Executive Brief, Anomaly Flags, Risk Tier',
      outputs: 'Triage Recommendation, SIU Action Items, Forensic Interview Probes',
      desc: 'Formulates concrete action plans (e.g. dispatching forensic investigators, requesting cell tower logs) and generates targeted interview probe questions tailored to anomaly vectors.',
    },
  ];

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '36px' }}>
      
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', color: '#a5b4fc', marginBottom: '8px', fontWeight: 600 }}>
            <GitBranch size={14} /> SYSTEM ARCHITECTURE & PROTOCOLS
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#f0f0f5', letterSpacing: '-0.03em', margin: 0 }}>
            System Blueprint & Multi-Agent Mesh
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', margin: '8px 0 0 0', maxWidth: '800px' }}>
            Technical specifications for the 5-agent swarm, the triage score, Hybrid Graph-RAG, and human-in-the-loop review.
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.04)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)', gap: '4px' }}>
          {[
            { id: 'mesh', label: '5-Agent Mesh & A2A', icon: <Cpu size={14} /> },
            { id: 'ensemble', label: '2-Model ML Architecture', icon: <Sliders size={14} /> },
            { id: 'rag', label: 'Hybrid Graph-RAG', icon: <Network size={14} /> },
            { id: 'governance', label: 'HITL Governance', icon: <Shield size={14} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '7px',
                border: 'none',
                background: activeTab === tab.id ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.4), rgba(168, 85, 247, 0.4))' : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── TAB 1: 5-AGENT MESH ──────────────────────────────────────────────── */}
      {activeTab === 'mesh' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* A2A State Machine Visualizer */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.7) 0%, rgba(15, 16, 28, 0.9) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f0f0f5', margin: 0 }}>
                  Agent-to-Agent (A2A) Sequential State Machine Protocol
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  Standardized JSON payloads with cryptographic trace IDs pass context incrementally down the mesh.
                </p>
              </div>
              <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', background: 'rgba(99, 102, 241, 0.2)', padding: '4px 8px', borderRadius: '6px', color: '#a5b4fc' }}>
                PROTOCOL: A2A-v1.4-STRICT
              </span>
            </div>

            {/* Mesh Step Pipeline */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', position: 'relative' }}>
              {agents.map((ag, idx) => (
                <div
                  key={ag.name}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${ag.color}40`,
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: ag.color, fontFamily: 'var(--font-mono)' }}>
                      STEP 0{idx + 1}
                    </span>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: ag.color }} />
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f0f0f5' }}>
                    {ag.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                    {ag.role}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Agent Specifications Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
            {agents.map((ag) => (
              <div
                key={ag.name}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '16px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: ag.color }} />
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f0f0f5', margin: 0, fontFamily: 'var(--font-mono)' }}>
                    {ag.name}
                  </h4>
                </div>

                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  {ag.desc}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.76rem', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div><strong style={{ color: '#a5b4fc' }}>Inputs:</strong> <span style={{ color: 'var(--text-secondary)' }}>{ag.inputs}</span></div>
                  <div><strong style={{ color: '#34d399' }}>Outputs:</strong> <span style={{ color: 'var(--text-secondary)' }}>{ag.outputs}</span></div>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ─── TAB 2: 2-MODEL ML ARCHITECTURE ────────────────────────────────────── */}
      {activeTab === 'ensemble' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f0f0f5', margin: 0 }}>
              Transparent 2-Model Risk & Outlier Architecture
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
              The number on the claim is 65% within-line severity plus 35% pattern probability, then 1 point for each day filed after day 14. Isolation Forest flags outliers and does not change that number. Random Forest checks that the pattern model is stable.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#818cf8', fontFamily: 'var(--font-mono)' }}>Direct Risk Score</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginTop: '4px' }}>XGBoost Classifier</div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
                  Pattern half of the triage score. TreeSHAP names the behavior features that moved this probability. Amount and the 14-day notice rule are outside this model.
                </p>
              </div>

              <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>Outlier Detector</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginTop: '4px' }}>Isolation Forest</div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
                  Unsupervised multi-dimensional partitioning that flags zero-day anomalies and statistical outliers independently without distorting the primary risk score.
                </p>
              </div>

              <div style={{ background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.25)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#c084fc', fontFamily: 'var(--font-mono)' }}>Model Validator</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginTop: '4px' }}>Calibrated Random Forest</div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
                  Platt-sigmoid calibrated probabilistic bagging ensemble used for variance cross-checking and model agreement verification against XGBoost.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: HYBRID GRAPH-RAG ────────────────────────────────────────── */}
      {activeTab === 'rag' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f0f0f5', margin: 0 }}>
              Dual-Channel Hybrid Graph-RAG Retrieval Pipeline
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
              Combines dense semantic vector retrieval in ChromaDB with 2-hop topological traversal in NetworkX to produce high-precision evidence contexts.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginTop: '12px' }}>
              <div style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '14px', padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#818cf8', fontWeight: 700, fontSize: '1rem', marginBottom: '10px' }}>
                  <Layers size={18} /> Channel A: Dense Vector Semantic Search
                </div>
                <ul style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.6, paddingLeft: '20px', margin: 0 }}>
                  <li>Model: <code>sentence-transformers/all-MiniLM-L6-v2</code> (384-dimensional embeddings)</li>
                  <li>Index: ChromaDB persistent cosine distance collection</li>
                  <li>Retrieves top-K semantically analogous historic claims & incident narratives</li>
                  <li>MRR (Mean Reciprocal Rank): <strong>0.850</strong></li>
                </ul>
              </div>

              <div style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '14px', padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#38bdf8', fontWeight: 700, fontSize: '1rem', marginBottom: '10px' }}>
                  <Network size={18} /> Channel B: NetworkX Topological Traversal
                </div>
                <ul style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.6, paddingLeft: '20px', margin: 0 }}>
                  <li>Graph Size: <strong>25,500+ Nodes</strong> & 45,000+ Edges</li>
                  <li>Node Types: Policyholder, Policy, Claim, Address, Broker, Vehicle</li>
                  <li>2-Hop Ego-Graph traversal for syndicates and shared address fraud rings</li>
                  <li>Sub-5ms multi-hop traversal latency</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: HITL GOVERNANCE ────────────────────────────────────────── */}
      {activeTab === 'governance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f0f0f5', margin: 0 }}>
              Human-in-the-Loop (HITL) Decision Support & Governance
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
              Analyster is architected strictly as an investigative decision-support engine, enforcing explainability, cryptographic chain of custody, and deterministic grounding.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginTop: '12px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ color: '#34d399', fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} /> 100% Fact Grounding
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.5, marginTop: '8px' }}>
                  All LLM-generated summaries and interview probes are anchored to verified database records with explicit citation tags. Fallback deterministic synthesizer prevents hallucinations.
                </p>
              </div>

              <div style={{ background: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ color: '#818cf8', fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={16} /> Cryptographic Chain of Custody
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.5, marginTop: '8px' }}>
                  Every generated SIU referral packet is stamped with a SHA-256 cryptographic hash seal, ensuring forensic auditability and legal admissibility in court.
                </p>
              </div>

              <div style={{ background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield size={16} /> Non-Autonomous Decisions
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.5, marginTop: '8px' }}>
                  The AI swarm provides recommendations, evidence citations, and interview checklists, but all claim approval/denial determinations remain in the hands of licensed adjusters.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
