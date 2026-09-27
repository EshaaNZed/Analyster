import React, { useState } from 'react';
import { ShinyText } from './reactbits/ShinyText';
import { Shield, Activity, Search, Database, Network, Cpu, AlertTriangle, Layers, Sliders, FileText } from 'lucide-react';

interface HeaderProps {
  activeView: 'overview' | 'claim_studio' | 'graph' | 'simulator' | 'siu';
  setActiveView: (view: 'overview' | 'claim_studio' | 'graph' | 'simulator' | 'siu') => void;
  onSearchClaim: (claimId: string) => void;
  health: {
    agents_ready?: boolean;
    database_connected?: boolean;
    vector_store_connected?: boolean;
    graph_store_loaded?: boolean;
  } | null;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  setActiveView,
  onSearchClaim,
  health,
}) => {
  const [searchInput, setSearchInput] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearchClaim(searchInput.trim());
      setActiveView('claim_studio');
    }
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: <Layers size={16} /> },
    { id: 'claim_studio', label: 'Claim Studio & Swarm', icon: <Cpu size={16} /> },
    { id: 'graph', label: 'Knowledge Graph', icon: <Network size={16} /> },
    { id: 'simulator', label: 'Risk Simulator', icon: <Sliders size={16} /> },
    { id: 'siu', label: 'SIU Dossier Hub', icon: <AlertTriangle size={16} /> },
  ] as const;

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(11, 11, 18, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '0 24px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Status & System Strip */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 0',
          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
          fontSize: '0.72rem',
          color: 'var(--text-secondary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: health?.database_connected ? '#10b981' : '#ef4444' }} />
            <Database size={12} /> SQLite Relational DB: {health?.database_connected ? 'Connected' : 'Offline'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: health?.vector_store_connected ? '#10b981' : '#ef4444' }} />
            <Layers size={12} /> ChromaDB Vectors: {health?.vector_store_connected ? 'Indexed (all-MiniLM)' : 'Offline'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: health?.graph_store_loaded ? '#10b981' : '#ef4444' }} />
            <Network size={12} /> Knowledge Graph: {health?.graph_store_loaded ? 'Active' : 'Offline'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: health?.agents_ready ? '#8b5cf6' : '#ef4444' }} />
            <Cpu size={12} /> 5-Agent Swarm: {health?.agents_ready ? 'Ready' : 'Standby'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.4)' }}>
            ENV: PRODUCTION-GRADE DEMO
          </span>
        </div>
      </div>

      {/* Main Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '64px',
          gap: '20px',
        }}
      >
        {/* Brand */}
        <div
          onClick={() => setActiveView('overview')}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flexShrink: 0 }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
            }}
          >
            <Shield size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShinyText text="CLAIMS INTELLIGENCE" speed={5} />
              <span style={{ color: '#818cf8', fontWeight: 500, fontSize: '0.85rem' }}>STUDIO</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', letterSpacing: '0.04em' }}>
              AI MULTI-AGENT CLAIMS REVIEW & SIU DECISION SUPPORT
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav
          style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '4px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            gap: '4px',
          }}
        >
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isActive ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(168, 85, 247, 0.3))' : 'transparent',
                  color: isActive ? '#f0f0f5' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 0 16px rgba(99, 102, 241, 0.25)' : 'none',
                  borderBottom: isActive ? '2px solid #818cf8' : '2px solid transparent',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <span style={{ color: isActive ? '#a78bfa' : 'currentColor' }}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Quick Search */}
        <form onSubmit={handleSearchSubmit} style={{ position: 'relative', width: '260px' }}>
          <Search
            size={16}
            color="var(--text-secondary)"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Jump to Claim ID (e.g. CLM-...)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#f0f0f5',
              fontSize: '0.78rem',
              outline: 'none',
              fontFamily: 'var(--font-mono)',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'rgba(99, 102, 241, 0.5)')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)')}
          />
        </form>
      </div>
    </header>
  );
};
