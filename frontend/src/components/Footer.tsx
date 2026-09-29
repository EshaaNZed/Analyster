import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Cpu, Network, Layers, GitBranch, Terminal, ExternalLink, Activity } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer
      style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        background: 'linear-gradient(180deg, rgba(11, 11, 18, 0.6) 0%, rgba(7, 7, 12, 0.95) 100%)',
        padding: '48px 32px 32px',
        color: 'var(--text-secondary)',
        fontSize: '0.85rem',
        marginTop: '60px',
        position: 'relative',
        zIndex: 10,
      }}
    >
      <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '36px', marginBottom: '40px' }}>
          
          {/* Col 1: Brand & Mission */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 16px rgba(99, 102, 241, 0.4)',
                }}
              >
                <Shield size={18} color="#ffffff" />
              </div>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f0f0f5', letterSpacing: '-0.02em' }}>
                ANALYSTER
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', lineHeight: 1.6, margin: 0 }}>
              Enterprise-grade multi-agent insurance claims intelligence platform powered by Hybrid Graph-RAG, XGBoost ensemble with SHAP, and autonomous agent-to-agent collaboration.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#10b981' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
              Production Microservice Active
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 style={{ color: '#f0f0f5', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
              Platform Modules
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>
                <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}>
                  Platform Overview & Home
                </Link>
              </li>
              <li>
                <Link to="/portfolio" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}>
                  Claims Portfolio & Analytics
                </Link>
              </li>
              <li>
                <Link to="/studio" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}>
                  5-Agent Swarm Claim Studio
                </Link>
              </li>
              <li>
                <Link to="/graph" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}>
                  Entity Knowledge Graph
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Advanced Tools & Reports */}
          <div>
            <h4 style={{ color: '#f0f0f5', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
              Investigation & Benchmarks
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>
                <Link to="/siu" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}>
                  SIU Referral & Case Dossier Hub
                </Link>
              </li>
              <li>
                <Link to="/evaluation" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}>
                  Quantitative Evaluation (6 Dimensions)
                </Link>
              </li>
              <li>
                <Link to="/architecture" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}>
                  System Architecture & A2A Protocols
                </Link>
              </li>
              <li>
                <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  FastAPI Interactive Swagger <ExternalLink size={12} />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Tech Stack Badges */}
          <div>
            <h4 style={{ color: '#f0f0f5', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
              Technology Foundation
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {['FastAPI', 'React 19', 'Vite 8', 'ChromaDB', 'NetworkX', 'XGBoost', 'SHAP', 'SQLite', 'Isolation Forest', 'React Bits'].map((tech) => (
                <span
                  key={tech}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {tech}
                </span>
              ))}
            </div>
            <div style={{ marginTop: '16px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              Built for Capstone Evaluation & Special Investigation Units
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.04)',
            paddingTop: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '0.75rem',
            color: 'var(--text-tertiary)',
          }}
        >
          <div>
            © {new Date().getFullYear()} Analyster — Multi-Agent Claims Intelligence Platform. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span>COIL 2000 Benchmark Dataset</span>
            <span>•</span>
            <span>Human-in-the-Loop Decision Support</span>
            <span>•</span>
            <span>Deterministic RAG Grounding</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
