import React, { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import { GraphResponse, GraphNode } from '../types/claims';
import { fetchGraphSubgraph } from '../api/client';
import { SpotlightCard } from './reactbits/SpotlightCard';
import { Network as NetworkIcon, ZoomIn, ZoomOut, RotateCcw, Filter, Info, Eye } from 'lucide-react';

interface KnowledgeGraphViewProps {
  entityId: string;
  initialDepth?: number;
  height?: string;
  onSelectEntity?: (entityId: string) => void;
}

export const KnowledgeGraphView: React.FC<KnowledgeGraphViewProps> = ({
  entityId,
  initialDepth = 2,
  height = '560px',
  onSelectEntity,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<GraphResponse | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [depth, setDepth] = useState(initialDepth);
  const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>({
    customer: true,
    policy: true,
    claim: true,
    incident_type: true,
    household: true,
  });

  const nodeColorMap: Record<string, { background: string; border: string; highlight: string }> = {
    customer: { background: '#6366f1', border: '#818cf8', highlight: '#a5b4fc' },
    policy: { background: '#8b5cf6', border: '#a78bfa', highlight: '#c4b5fd' },
    claim: { background: '#ef4444', border: '#f87171', highlight: '#fca5a5' },
    incident_type: { background: '#f59e0b', border: '#fbbf24', highlight: '#fde68a' },
    household: { background: '#06b6d4', border: '#22d3ee', highlight: '#67e8f9' },
    risk_cluster: { background: '#ec4899', border: '#f472b6', highlight: '#fbcfe8' },
    other: { background: '#64748b', border: '#94a3b8', highlight: '#cbd5e1' },
  };

  const loadGraph = async () => {
    if (!entityId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGraphSubgraph(entityId, depth);
      setGraphData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load graph subgraph');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraph();
  }, [entityId, depth]);

  useEffect(() => {
    if (!containerRef.current || !graphData) return;

    // Filter nodes based on user toggle
    const filteredNodes = graphData.nodes.filter(
      (n) => activeFilters[n.group] !== false
    );
    const validNodeIds = new Set(filteredNodes.map((n) => n.id));

    const nodesDataSet = new DataSet(
      filteredNodes.map((node) => {
        const isCenter = node.id === graphData.center_node;
        const color = nodeColorMap[node.group] || nodeColorMap.other;

        return {
          id: node.id,
          label: node.label,
          title: node.title,
          size: isCenter ? 36 : node.size || 22,
          shape: node.group === 'household' ? 'diamond' : 'dot',
          color: {
            background: isCenter ? '#ec4899' : color.background,
            border: isCenter ? '#f472b6' : color.border,
            highlight: {
              background: color.highlight,
              border: '#ffffff',
            },
          },
          borderWidth: isCenter ? 3 : 1.5,
          font: {
            color: '#f0f0f5',
            size: isCenter ? 14 : 11,
            face: 'Inter, sans-serif',
            strokeWidth: 2,
            strokeColor: '#0a0a0f',
          },
          shadow: {
            enabled: true,
            color: color.background + '60',
            size: isCenter ? 15 : 6,
          },
        };
      })
    );

    const edgesDataSet = new DataSet(
      graphData.edges
        .filter((e) => validNodeIds.has(e.from) && validNodeIds.has(e.to))
        .map((edge) => ({
          id: `${edge.from}-${edge.to}-${edge.label || ''}`,
          from: edge.from,
          to: edge.to,
          label: edge.label,
          arrows: edge.arrows || 'to',
          color: {
            color: 'rgba(255, 255, 255, 0.18)',
            highlight: '#6366f1',
            hover: '#a78bfa',
          },
          width: 1.2,
          font: {
            color: 'rgba(255, 255, 255, 0.5)',
            size: 9,
            align: 'middle',
            background: 'rgba(10, 10, 15, 0.8)',
          },
          smooth: {
            enabled: true,
            type: 'continuous',
            roundness: 0.2,
          },
        }))
    );

    const options = {
      physics: {
        stabilization: { iterations: 120 },
        barnesHut: {
          gravitationalConstant: -3000,
          springLength: 95,
          springConstant: 0.04,
          damping: 0.09,
        },
      },
      interaction: {
        hover: true,
        tooltipDelay: 150,
        navigationButtons: false,
        zoomView: true,
      },
    };

    const network = new Network(
      containerRef.current,
      { nodes: nodesDataSet as any, edges: edgesDataSet as any },
      options as any
    );

    network.on('click', (params) => {
      if (params.nodes && params.nodes.length > 0) {
        const clickedId = params.nodes[0];
        const nodeObj = graphData.nodes.find((n) => n.id === clickedId) || null;
        setSelectedNode(nodeObj);
      } else {
        setSelectedNode(null);
      }
    });

    networkRef.current = network;

    return () => {
      network.destroy();
    };
  }, [graphData, activeFilters]);

  const handleZoomIn = () => {
    if (networkRef.current) {
      const scale = networkRef.current.getScale();
      networkRef.current.moveTo({ scale: scale * 1.3 });
    }
  };

  const handleZoomOut = () => {
    if (networkRef.current) {
      const scale = networkRef.current.getScale();
      networkRef.current.moveTo({ scale: scale / 1.3 });
    }
  };

  const handleReset = () => {
    if (networkRef.current) {
      networkRef.current.fit({ animation: { duration: 600, easingFunction: 'easeInOutQuad' } });
    }
  };

  const toggleFilter = (group: string) => {
    setActiveFilters((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  return (
    <SpotlightCard className="p-5 flex flex-col relative overflow-hidden" spotlightColor="rgba(59, 130, 246, 0.12)">
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '8px', borderRadius: '10px', color: '#60a5fa' }}>
            <NetworkIcon size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f0f0f5', margin: 0 }}>
              Knowledge Graph Neighborhood Explorer
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
              Traversing relationships for entity: <span style={{ fontFamily: 'var(--font-mono)', color: '#a78bfa' }}>{entityId}</span>
            </p>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Depth selector */}
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '2px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            {[1, 2, 3].map((d) => (
              <button
                key={d}
                onClick={() => setDepth(d)}
                style={{
                  background: depth === d ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
                  color: depth === d ? '#fff' : 'var(--text-secondary)',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {d} Hop{d > 1 ? 's' : ''}
              </button>
            ))}
          </div>

          {/* Zoom controls */}
          <button
            onClick={handleZoomIn}
            className="btn btn-ghost"
            style={{ padding: '6px 8px', borderRadius: '6px' }}
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={handleZoomOut}
            className="btn btn-ghost"
            style={{ padding: '6px 8px', borderRadius: '6px' }}
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={handleReset}
            className="btn btn-ghost"
            style={{ padding: '6px 8px', borderRadius: '6px' }}
            title="Fit Center"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Node Legend / Filters */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
        {[
          { key: 'customer', label: 'Customers', color: '#6366f1' },
          { key: 'policy', label: 'Policies', color: '#8b5cf6' },
          { key: 'claim', label: 'Claims', color: '#ef4444' },
          { key: 'incident_type', label: 'Incident Types', color: '#f59e0b' },
          { key: 'household', label: 'Household Clusters', color: '#06b6d4' },
        ].map((f) => {
          const isActive = activeFilters[f.key] !== false;
          return (
            <button
              key={f.key}
              onClick={() => toggleFilter(f.key)}
              style={{
                background: isActive ? `${f.color}20` : 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${isActive ? f.color : 'rgba(255, 255, 255, 0.08)'}`,
                color: isActive ? '#f0f0f5' : 'var(--text-tertiary)',
                borderRadius: '999px',
                padding: '3px 10px',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: f.color,
                  opacity: isActive ? 1 : 0.4,
                }}
              />
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Main Canvas Container */}
      <div style={{ position: 'relative', width: '100%', height, borderRadius: '12px', background: 'rgba(10, 10, 16, 0.8)', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,10,16,0.7)', zIndex: 10 }}>
            <div style={{ color: '#818cf8', fontWeight: 600, fontSize: '0.9rem' }}>
              Traversing Graph Subgraph...
            </div>
          </div>
        )}
        {error && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', padding: '20px', textAlign: 'center' }}>
            {error}
          </div>
        )}
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

        {/* Selected Node Details Drawer */}
        {selectedNode && (
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              right: '16px',
              maxWidth: '320px',
              background: 'rgba(20, 20, 32, 0.95)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              padding: '14px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              zIndex: 5,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700 }}>
                  {selectedNode.group}
                </span>
                <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#f0f0f5', fontFamily: 'var(--font-mono)' }}>
                  {selectedNode.label}
                </h4>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1rem' }}
              >
                ✕
              </button>
            </div>

            {selectedNode.metadata && Object.keys(selectedNode.metadata).length > 0 && (
              <div style={{ maxHeight: '180px', overflowY: 'auto', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                {Object.entries(selectedNode.metadata).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>{k}:</span>
                    <span style={{ color: '#e2e8f0', fontWeight: 500, fontFamily: 'var(--font-mono)' }}>{String(v)}</span>
                  </div>
                ))}
              </div>
            )}

            {onSelectEntity && selectedNode.id !== entityId && (
              <button
                onClick={() => onSelectEntity(selectedNode.id)}
                className="btn btn-primary"
                style={{ marginTop: '10px', width: '100%', fontSize: '0.75rem', padding: '6px' }}
              >
                <Eye size={12} style={{ marginRight: '4px' }} /> Inspect this Entity
              </button>
            )}
          </div>
        )}
      </div>

      {graphData && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
          <span>
            Active Subgraph: <strong style={{ color: '#f0f0f5' }}>{graphData.stats.total_nodes}</strong> entities, <strong style={{ color: '#f0f0f5' }}>{graphData.stats.total_edges}</strong> relationships
          </span>
          <span>Click any node to inspect attributes • Drag to reposition</span>
        </div>
      )}
    </SpotlightCard>
  );
};
