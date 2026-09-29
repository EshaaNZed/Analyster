import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ShinyText } from './reactbits/ShinyText';
import {
  Shield, Search, Database, Network, Cpu, AlertTriangle, Layers,
  FlaskConical, GitBranch, CheckCircle2, ChevronDown, Activity, Sparkles,
  BookOpen, HelpCircle, FilePlus
} from 'lucide-react';

interface HeaderProps {
  health?: {
    agents_ready?: boolean;
    database_connected?: boolean;
    vector_store_connected?: boolean;
    graph_store_loaded?: boolean;
  } | null;
}

export const Header: React.FC<HeaderProps> = ({ health }) => {
  const [searchInput, setSearchInput] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      const cleanId = searchInput.trim().toUpperCase();
      navigate(`/studio/${cleanId}`);
      setSearchInput('');
    }
  };

  const navLinks = [
    { to: '/', label: 'Home', icon: <Sparkles size={15} /> },
    { to: '/portfolio', label: 'Portfolio', icon: <Layers size={15} /> },
    { to: '/intake', label: '+ New Claim', icon: <FilePlus size={15} /> },
    { to: '/studio', label: 'Claim Studio', icon: <Cpu size={15} /> },
    { to: '/graph', label: 'Knowledge Graph', icon: <Network size={15} /> },
    { to: '/siu', label: 'SIU Hub', icon: <AlertTriangle size={15} /> },
    { to: '/evaluation', label: 'Evaluation', icon: <FlaskConical size={15} /> },
    { to: '/architecture', label: 'Architecture', icon: <GitBranch size={15} /> },
  ];

  const allSystemsHealthy = health
    ? health.database_connected && health.vector_store_connected && health.graph_store_loaded && health.agents_ready
    : true;

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(9, 10, 15, 0.88)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.4)',
      }}
    >
      <div
        style={{
          maxWidth: '1600px',
          margin: '0 auto',
          padding: '0 24px',
          height: '68px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
        }}
      >
        {/* Brand / Logo */}
        <NavLink
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)',
            }}
          >
            <Shield size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.12rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
                ANALYSTER
              </span>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'rgba(99, 102, 241, 0.2)',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  color: '#a5b4fc',
                }}
              >
                AI Mesh
              </span>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', letterSpacing: '0.02em' }}>
              Claims Intelligence & SIU Platform
            </div>
          </div>
        </NavLink>

        {/* Website Navigation Links */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '4px 6px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            overflowX: 'auto',
          }}
        >
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) => (isActive ? 'nav-item-active' : 'nav-item-inactive')}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '7px 13px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '0.82rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                background: isActive ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.35), rgba(168, 85, 247, 0.3))' : 'transparent',
                border: isActive ? '1px solid rgba(165, 180, 252, 0.3)' : '1px solid transparent',
                boxShadow: isActive ? '0 0 16px rgba(99, 102, 241, 0.2)' : 'none',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              })}
            >
              {({ isActive }) => (
                <>
                  <span style={{ color: isActive ? '#c084fc' : 'currentColor', display: 'flex', alignItems: 'center' }}>
                    {link.icon}
                  </span>
                  <span>{link.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Right Section: Quick Search + System Health Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          
          {/* Quick Search */}
          <form onSubmit={handleSearchSubmit} style={{ position: 'relative', width: '220px' }}>
            <Search
              size={15}
              color="var(--text-tertiary)"
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="Search Claim ID..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px 7px 32px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#f0f0f5',
                fontSize: '0.78rem',
                outline: 'none',
                fontFamily: 'var(--font-mono)',
                transition: 'all 0.2s ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(99, 102, 241, 0.6)';
                e.target.style.background = 'rgba(255, 255, 255, 0.07)';
                e.target.style.boxShadow = '0 0 12px rgba(99, 102, 241, 0.25)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.target.style.background = 'rgba(255, 255, 255, 0.04)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </form>

          {/* Clean Health Pill with Popover */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowStatusModal(!showStatusModal)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: allSystemsHealthy ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                border: `1px solid ${allSystemsHealthy ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                padding: '6px 10px',
                borderRadius: '8px',
                color: allSystemsHealthy ? '#34d399' : '#f87171',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: allSystemsHealthy ? '#10b981' : '#ef4444',
                  boxShadow: `0 0 8px ${allSystemsHealthy ? '#10b981' : '#ef4444'}`,
                }}
              />
              <span>Live Engine</span>
              <ChevronDown size={12} />
            </button>

            {/* Health Popover Details */}
            {showStatusModal && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '42px',
                  width: '280px',
                  background: 'rgba(16, 17, 26, 0.98)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
                  zIndex: 200,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f0f0f5' }}>System Infrastructure</span>
                  <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>Port 8000</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                    <Database size={13} /> SQLite Claims DB
                  </span>
                  <span style={{ color: health?.database_connected ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                    {health?.database_connected ? 'Connected' : 'Offline'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                    <Layers size={13} /> ChromaDB (all-MiniLM)
                  </span>
                  <span style={{ color: health?.vector_store_connected ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                    {health?.vector_store_connected ? 'Indexed' : 'Offline'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                    <Network size={13} /> NetworkX Graph
                  </span>
                  <span style={{ color: health?.graph_store_loaded ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                    {health?.graph_store_loaded ? '25,500+ Nodes' : 'Offline'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                    <Cpu size={13} /> 5-Agent Collaborative Mesh
                  </span>
                  <span style={{ color: health?.agents_ready ? '#a78bfa' : '#ef4444', fontWeight: 600 }}>
                    {health?.agents_ready ? 'Operational' : 'Standby'}
                  </span>
                </div>

                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '8px', marginTop: '2px', display: 'flex', justifyContent: 'space-between' }}>
                  <a
                    href="http://localhost:8000/docs"
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '0.72rem', color: '#818cf8', textDecoration: 'none' }}
                  >
                    Open API Docs (Swagger) →
                  </a>
                  <button
                    onClick={() => setShowStatusModal(false)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', fontSize: '0.72rem', cursor: 'pointer' }}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
