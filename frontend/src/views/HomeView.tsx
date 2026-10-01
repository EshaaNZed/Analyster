import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SpotlightCard, CountUp, SplitText, ShinyText, BorderBeam } from '../components/reactbits';
import {
  Shield, Cpu, Network, AlertTriangle, FlaskConical, Layers,
  ArrowRight, CheckCircle2, Sparkles, Database, FileText, Activity,
  TrendingUp, BarChart3, Search, PlayCircle, ExternalLink, GitBranch, FilePlus
} from 'lucide-react';

export const HomeView: React.FC = () => {
  const navigate = useNavigate();

  const platformModules = [
    {
      title: 'First Notice of Loss (FNOL) Intake',
      description: 'Intake and analyze brand-new, unindexed claims with custom loss parameters and real-time 5-Agent Swarm triage.',
      icon: <FilePlus size={26} color="#34d399" />,
      link: '/intake',
      badge: 'Live Intake',
      gradient: 'linear-gradient(135deg, rgba(52, 211, 153, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
    },
    {
      title: 'Claims Portfolio & Analytics',
      description: 'Explore the 1,500 claims benchmark dataset with multi-tier risk distributions, loss analytics, and multi-criteria filtering.',
      icon: <Layers size={26} color="#818cf8" />,
      link: '/portfolio',
      badge: 'Portfolio Hub',
      gradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.05) 100%)',
    },
    {
      title: '5-Agent Swarm Claim Studio',
      description: 'Trigger autonomous collaborative analysis across Retrieval, Risk Scoring, Anomaly Detection, Summarization, and SIU Support agents.',
      icon: <Cpu size={26} color="#c084fc" />,
      link: '/studio/CLM-2024-00003',
      badge: 'Multi-Agent Mesh',
      gradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(236, 72, 153, 0.05) 100%)',
    },
    {
      title: 'Entity Knowledge Graph',
      description: 'Traverse 25,500+ nodes to uncover hidden syndicates, shared addresses, broker links, and multi-hop fraud rings.',
      icon: <Network size={26} color="#38bdf8" />,
      link: '/graph',
      badge: 'Graph-RAG',
      gradient: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)',
    },
    {
      title: 'SIU Case Dossier Hub',
      description: 'Review formal fraud referral packages with cryptographic SHA-256 custody seals, interview probes, and exportable PDF summaries.',
      icon: <AlertTriangle size={26} color="#f87171" />,
      link: '/siu',
      badge: 'Special Investigation',
      gradient: 'linear-gradient(135deg, rgba(248, 113, 113, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)',
    },
    {
      title: 'Quantitative System Evaluation',
      description: 'Pattern-model ROC-AUC 0.9218, Isolation Forest outlier flag, and the triage split of severity, pattern, and late notice.',
      icon: <FlaskConical size={26} color="#fbbf24" />,
      link: '/evaluation',
      badge: 'Task 4 Benchmarks',
      gradient: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)',
    },
  ];

  const showcaseCases = [
    {
      id: 'CLM-2024-01323',
      riskScore: 93,
      riskLabel: 'HIGH',
      anomalyScore: 0.58,
      tag: 'Fire filed within days of a coverage increase',
      loss: '$283,872',
    },
    {
      id: 'CLM-2024-01322',
      riskScore: 50,
      riskLabel: 'MEDIUM',
      anomalyScore: 0.34,
      tag: 'Padded water invoice that overlaps a normal fire',
      loss: '$78,063',
    },
    {
      id: 'CLM-2024-00001',
      riskScore: 27,
      riskLabel: 'LOW',
      anomalyScore: 0.59,
      tag: 'Ordinary caravan hail, filed within 14 days',
      loss: '$4,668',
    },
  ];

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '56px' }}>
      
      {/* ─── Hero Section ────────────────────────────────────────────────────────── */}
      <section
        style={{
          position: 'relative',
          padding: '64px 40px',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.7) 0%, rgba(15, 16, 28, 0.9) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '24px',
        }}
      >
        <BorderBeam size={300} duration={12} colorFrom="#6366f1" colorTo="#a855f7" />

        {/* Pill Tag */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            padding: '6px 16px',
            borderRadius: '999px',
            fontSize: '0.8rem',
            color: '#a5b4fc',
            fontWeight: 600,
          }}
        >
          <Sparkles size={15} />
          <span>CAPSTONE DELIVERABLE: ENTERPRISE CLAIMS INTELLIGENCE</span>
        </div>

        {/* Main Title */}
        <h1
          style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
            fontWeight: 900,
            color: '#ffffff',
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
            margin: 0,
            maxWidth: '1000px',
          }}
        >
          AI-Powered Multi-Agent Insurance <br />
          <span style={{ background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #f472b6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Claims Intelligence & Decision Platform
          </span>
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: '1.05rem',
            color: 'var(--text-secondary)',
            maxWidth: '780px',
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          Empowering claims adjusters and SIU investigators with <strong>Hybrid Graph-RAG retrieval</strong>,
          calibrated <strong>XGBoost + SHAP feature attribution</strong>, and a <strong>5-agent collaborative mesh</strong> designed strictly for human-in-the-loop forensic decision support.
        </p>

        {/* Hero Action Buttons */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '8px' }}>
          <button
            onClick={() => navigate('/portfolio')}
            className="btn btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 28px',
              fontSize: '0.95rem',
              fontWeight: 700,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              boxShadow: '0 0 30px rgba(99, 102, 241, 0.4)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Layers size={18} />
            <span>Explore Claims Portfolio</span>
            <ArrowRight size={18} />
          </button>

          <button
            onClick={() => navigate('/intake')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 24px',
              fontSize: '0.95rem',
              fontWeight: 700,
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#34d399',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <FilePlus size={18} />
            <span>+ File New Claim (FNOL)</span>
          </button>

          <button
            onClick={() => navigate('/studio/CLM-2024-01323')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 24px',
              fontSize: '0.95rem',
              fontWeight: 700,
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <Cpu size={18} color="#c084fc" />
            <span>Launch 5-Agent Swarm</span>
          </button>

          <button
            onClick={() => navigate('/architecture')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 20px',
              fontSize: '0.92rem',
              fontWeight: 600,
              borderRadius: '12px',
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <GitBranch size={16} />
            <span>Architecture & Blueprint</span>
          </button>
        </div>

        {/* Live Key Metrics Banner */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '20px',
            width: '100%',
            maxWidth: '1000px',
            marginTop: '32px',
            paddingTop: '28px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f0f0f5', fontFamily: 'var(--font-mono)' }}>
              1,500
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              COIL 2000 Benchmark Claims
            </div>
          </div>

          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
              25,500+
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Knowledge Graph Nodes
            </div>
          </div>

          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
              0.9218
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Pattern model ROC-AUC
            </div>
          </div>

          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#a78bfa', fontFamily: 'var(--font-mono)' }}>
              88.0%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Retrieval Precision@3
            </div>
          </div>

          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
              100.0%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Fact Grounding (0% Hallucination)
            </div>
          </div>
        </div>

      </section>

      {/* ─── Platform Web Pages Showcase ────────────────────────────────────────── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
              Platform Modules
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f0f0f5', margin: 0 }}>
              Specialized Views for Every Stage of Claims Intelligence
            </h2>
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Click any module below to launch its dedicated workspace
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          {platformModules.map((mod) => (
            <div
              key={mod.title}
              onClick={() => navigate(mod.link)}
              style={{
                cursor: 'pointer',
                transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <SpotlightCard spotlightColor="rgba(99, 102, 241, 0.15)">
                <div
                  style={{
                    padding: '28px',
                    borderRadius: '16px',
                    background: mod.gradient,
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '220px',
                    gap: '16px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {mod.icon}
                    </div>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {mod.badge}
                    </span>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f0f0f5', margin: '0 0 8px 0' }}>
                      {mod.title}
                    </h3>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                      {mod.description}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#818cf8', fontSize: '0.82rem', fontWeight: 600 }}>
                    <span>Launch Workspace</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
              </SpotlightCard>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 1-Click Showcase Claims ────────────────────────────────────────────── */}
      <section
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '20px',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Ready-to-Analyze Case Studies
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f0f0f5', margin: '4px 0 0 0' }}>
              Open a claim and run the swarm
            </h3>
          </div>
          <Link to="/portfolio" style={{ color: '#818cf8', fontSize: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
            View all 1,500 claims →
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {showcaseCases.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(`/studio/${item.id}`)}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '20px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.95rem', color: '#f0f0f5' }}>
                  {item.id}
                </span>
                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background: item.riskLabel === 'HIGH' ? 'rgba(239, 68, 68, 0.2)' : item.riskLabel === 'LOW' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: item.riskLabel === 'HIGH' ? '#f87171' : item.riskLabel === 'LOW' ? '#34d399' : '#fbbf24',
                    border: `1px solid ${item.riskLabel === 'HIGH' ? 'rgba(239, 68, 68, 0.4)' : item.riskLabel === 'LOW' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                  }}
                >
                  Risk: {item.riskScore}/100 ({item.riskLabel})
                </span>
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {item.tag}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.04)', fontSize: '0.78rem' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Loss: <strong style={{ color: '#fff' }}>{item.loss}</strong></span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#c084fc', fontWeight: 600 }}>
                  <PlayCircle size={14} /> Run Swarm
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 4-Layer Architecture Summary ────────────────────────────────────────── */}
      <section
        style={{
          borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.4) 0%, rgba(17, 24, 39, 0.6) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          padding: '36px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              How Analyster Works
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f0f0f5', margin: '4px 0 0 0' }}>
              End-to-End Forensic Architecture
            </h3>
          </div>
          <button
            onClick={() => navigate('/architecture')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'rgba(99, 102, 241, 0.2)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              color: '#a5b4fc',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <GitBranch size={14} />
            <span>View Full Architecture Blueprint</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ color: '#818cf8', fontWeight: 800, fontSize: '0.8rem', marginBottom: '8px' }}>1. DATA FOUNDATION</div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem', marginBottom: '6px' }}>Hybrid Knowledge Store</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: 1.5 }}>
              86 raw attributes from COIL 2000 engineered into SQLite relational tables, ChromaDB dense vector store, and NetworkX topological graph.
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ color: '#38bdf8', fontWeight: 800, fontSize: '0.8rem', marginBottom: '8px' }}>2. ANALYTICAL ENGINES</div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem', marginBottom: '6px' }}>Triage score</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: 1.5 }}>
              65% within-line severity, 35% XGBoost pattern probability, plus 1 point per day filed after day 14. Isolation Forest is the outlier flag only.
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ color: '#c084fc', fontWeight: 800, fontSize: '0.8rem', marginBottom: '8px' }}>3. MULTI-AGENT SWARM</div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem', marginBottom: '6px' }}>5 Collaborative Agents</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: 1.5 }}>
              Retrieval → Risk Analysis → Anomaly Detection → Fact Summarization → SIU Support via explicit A2A handoff protocols.
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ color: '#34d399', fontWeight: 800, fontSize: '0.8rem', marginBottom: '8px' }}>4. DECISION SUPPORT</div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem', marginBottom: '6px' }}>Human-in-the-Loop Studio</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: 1.5 }}>
              Interactive adjusters workbench, counterfactual risk simulator, evidence citation grounding, and verifiable SIU case referral hub.
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
