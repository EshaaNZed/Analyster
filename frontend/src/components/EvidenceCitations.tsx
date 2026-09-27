import React, { useState } from 'react';
import { Citation } from '../types/claims';
import { SpotlightCard } from './reactbits/SpotlightCard';
import { ShieldCheck, Database, BrainCircuit, Network, Search, ExternalLink } from 'lucide-react';

interface EvidenceCitationsProps {
  citations: Citation[];
}

export const EvidenceCitations: React.FC<EvidenceCitationsProps> = ({ citations }) => {
  const [filterType, setFilterType] = useState<string>('ALL');

  if (!citations || citations.length === 0) {
    return null;
  }

  const getSourceBadge = (type: string) => {
    switch (type) {
      case 'RELATIONAL_DB':
        return { label: 'SQL DB', icon: <Database size={12} />, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' };
      case 'ML_MODEL':
        return { label: 'ML Model', icon: <BrainCircuit size={12} />, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' };
      case 'KNOWLEDGE_GRAPH':
        return { label: 'Graph DB', icon: <Network size={12} />, color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)' };
      case 'VECTOR_SEARCH':
        return { label: 'ChromaDB', icon: <Search size={12} />, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)' };
      default:
        return { label: type, icon: <ShieldCheck size={12} />, color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };
    }
  };

  const types = ['ALL', ...Array.from(new Set(citations.map((c) => c.source_type)))];
  const filtered = filterType === 'ALL' ? citations : citations.filter((c) => c.source_type === filterType);

  return (
    <SpotlightCard className="p-5" spotlightColor="rgba(16, 185, 129, 0.08)">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '6px', borderRadius: '8px', color: '#34d399' }}>
            <ShieldCheck size={18} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f0f0f5', margin: 0 }}>
              Evidence Grounding & Citations ({citations.length})
            </h4>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              Deterministic cross-verification against verified database & ML records
            </span>
          </div>
        </div>

        {/* Source Filter Pills */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              style={{
                background: filterType === t ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: filterType === t ? '#fff' : 'var(--text-tertiary)',
                borderRadius: '6px',
                padding: '3px 8px',
                fontSize: '0.72rem',
                cursor: 'pointer',
              }}
            >
              {t === 'ALL' ? 'All Sources' : t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '10px' }}>
        {filtered.map((cit, idx) => {
          const badge = getSourceBadge(cit.source_type);
          return (
            <div
              key={idx}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '10px',
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: badge.color,
                    background: badge.bg,
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  {badge.icon} {badge.label}
                </span>
                <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                  Ref: <strong style={{ color: '#e2e8f0' }}>{cit.reference_id}</strong>
                </span>
              </div>

              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Field: <span style={{ color: '#f0f0f5', fontWeight: 600 }}>{cit.field_name}</span> = <span style={{ color: '#38bdf8', fontWeight: 600 }}>{cit.field_value}</span>
              </div>

              <div
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-secondary)',
                  background: 'rgba(0, 0, 0, 0.25)',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  fontFamily: 'var(--font-mono)',
                  lineHeight: 1.4,
                  borderLeft: `2px solid ${badge.color}`,
                }}
              >
                "{cit.snippet}"
              </div>
            </div>
          );
        })}
      </div>
    </SpotlightCard>
  );
};
