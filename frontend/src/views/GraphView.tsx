import React, { useState } from 'react';
import { KnowledgeGraphView } from '../components/KnowledgeGraphView';
import { SpotlightCard, SplitText, ShinyText } from '../components/reactbits';
import { Network, Search, Filter, Layers, Share2, Info } from 'lucide-react';

interface GraphViewProps {
  initialEntityId?: string;
  onSelectClaim?: (claimId: string) => void;
}

export const GraphView: React.FC<GraphViewProps> = ({
  initialEntityId = 'CLM-2024-00003',
  onSelectClaim,
}) => {
  const [currentEntity, setCurrentEntity] = useState(initialEntityId);
  const [searchInput, setSearchInput] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setCurrentEntity(searchInput.trim());
    }
  };

  const sampleEntities = [
    { id: 'CLM-2024-00003', label: 'Claim: CLM-2024-00003 (High Anomaly)' },
    { id: 'CLM-2024-00725', label: 'Claim: CLM-2024-00725 (Inception Fire)' },
    { id: 'CUST-04819', label: 'Customer: CUST-04819' },
    { id: 'POL-007629', label: 'Policy: POL-007629' },
  ];

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', color: '#60a5fa', marginBottom: '8px', fontWeight: 600 }}>
            <Network size={14} /> NETWORKX KNOWLEDGE GRAPH & HYBRID GRAPH-RAG
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#f0f0f5', letterSpacing: '-0.03em', margin: 0 }}>
            <SplitText text="Entity Relationship & Fraud Ring Topology" delay={25} />
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '6px 0 0 0' }}>
            Traverse multi-hop relationships across customers, policies, claims, shared households, and synthetic fraud rings.
          </p>
        </div>

        {/* Quick jump entity search */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Entity ID (CLM-..., CUST-..., POL-...)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#f0f0f5',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.82rem',
              width: '280px',
              outline: 'none',
            }}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.82rem', fontWeight: 700 }}>
            Inspect Entity
          </button>
        </form>
      </div>

      {/* Suggested Entities Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Suggested Targets:</span>
        {sampleEntities.map((ent) => (
          <button
            key={ent.id}
            onClick={() => setCurrentEntity(ent.id)}
            style={{
              background: currentEntity === ent.id ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.03)',
              border: `1px solid ${currentEntity === ent.id ? '#818cf8' : 'rgba(255, 255, 255, 0.06)'}`,
              color: currentEntity === ent.id ? '#fff' : 'var(--text-secondary)',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
            }}
          >
            {ent.label}
          </button>
        ))}
      </div>

      {/* Graph Visualizer Component */}
      <KnowledgeGraphView
        entityId={currentEntity}
        height="640px"
        onSelectEntity={(eId) => {
          if (eId.startsWith('CLM-') && onSelectClaim) {
            onSelectClaim(eId);
          } else {
            setCurrentEntity(eId);
          }
        }}
      />
    </div>
  );
};
