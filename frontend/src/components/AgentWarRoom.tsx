import React, { useState } from 'react';
import { ExecutionStep, A2AMessage } from '../types/claims';
import { SpotlightCard } from './reactbits/SpotlightCard';
import { BorderBeam } from './reactbits/BorderBeam';
import { Bot, ArrowRight, CheckCircle2, Clock, Cpu, MessageSquare, Terminal } from 'lucide-react';

interface AgentWarRoomProps {
  steps: ExecutionStep[];
  messages: A2AMessage[];
  totalLatencyMs?: number;
  isRunning?: boolean;
}

export const AgentWarRoom: React.FC<AgentWarRoomProps> = ({
  steps,
  messages,
  totalLatencyMs = 0,
  isRunning = false,
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'messages'>('timeline');
  const [selectedMessage, setSelectedMessage] = useState<A2AMessage | null>(null);

  const agentIcons: Record<string, string> = {
    ClaimsRetrievalAgent: '🔍',
    ClaimsRiskAnalysisAgent: '⚖️',
    AnomalyDetectionAgent: '🚨',
    ClaimsSummarizationAgent: '📝',
    InvestigationSupportAgent: '🛡️',
  };

  const agentColors: Record<string, string> = {
    ClaimsRetrievalAgent: '#3b82f6',
    ClaimsRiskAnalysisAgent: '#8b5cf6',
    AnomalyDetectionAgent: '#ef4444',
    ClaimsSummarizationAgent: '#10b981',
    InvestigationSupportAgent: '#f59e0b',
  };

  return (
    <SpotlightCard className="p-6 relative overflow-hidden" spotlightColor="rgba(139, 92, 246, 0.12)">
      {isRunning && <BorderBeam size={280} duration={6} colorFrom="#8b5cf6" colorTo="#3b82f6" />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.2)', padding: '8px', borderRadius: '10px', color: '#a78bfa' }}>
            <Cpu size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f0f0f5', margin: 0 }}>
              Multi-Agent Orchestration War Room
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
              5 Autonomous agents collaborating via typed A2A handoff protocols
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {totalLatencyMs > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#a78bfa', background: 'rgba(139, 92, 246, 0.1)', padding: '4px 12px', borderRadius: '999px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
              <Clock size={14} />
              <span>Swarm Latency: {totalLatencyMs.toFixed(1)}ms</span>
            </div>
          )}

          {/* Sub-Tabs */}
          <div style={{ display: 'flex', background: 'rgba(0, 0, 0, 0.3)', padding: '3px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <button
              onClick={() => setActiveTab('timeline')}
              style={{
                background: activeTab === 'timeline' ? 'rgba(139, 92, 246, 0.3)' : 'transparent',
                color: activeTab === 'timeline' ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
              }}
            >
              <Terminal size={14} /> Execution Steps ({steps.length})
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              style={{
                background: activeTab === 'messages' ? 'rgba(139, 92, 246, 0.3)' : 'transparent',
                color: activeTab === 'messages' ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
              }}
            >
              <MessageSquare size={14} /> A2A Handoffs ({messages.length})
            </button>
          </div>
        </div>
      </div>

      {/* Agents Mesh Status Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '22px' }}>
        {[
          { name: 'ClaimsRetrievalAgent', label: 'Retrieval', desc: 'Hybrid Graph+Vector', color: '#3b82f6' },
          { name: 'ClaimsRiskAnalysisAgent', label: 'Risk Analysis', desc: 'SHAP & XGBoost', color: '#8b5cf6' },
          { name: 'AnomalyDetectionAgent', label: 'Anomaly Detector', desc: 'Isolation Forest', color: '#ef4444' },
          { name: 'ClaimsSummarizationAgent', label: 'Summarization', desc: 'Grounded Brief', color: '#10b981' },
          { name: 'InvestigationSupportAgent', label: 'Investigation', desc: 'Triage & SIU Dossier', color: '#f59e0b' },
        ].map((agent, i) => {
          const isFinished = steps.some((s) => s.agent === agent.name);
          return (
            <div
              key={agent.name}
              style={{
                background: isFinished ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.01)',
                border: `1px solid ${isFinished ? agent.color + '50' : 'rgba(255, 255, 255, 0.05)'}`,
                borderRadius: '10px',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: `${agent.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  border: `1px solid ${agent.color}40`,
                }}
              >
                {agentIcons[agent.name] || '🤖'}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f0f0f5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {agent.label}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                  {agent.desc}
                </div>
              </div>
              {isFinished && (
                <CheckCircle2 size={14} color="#10b981" style={{ position: 'absolute', top: '8px', right: '8px' }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Content Panels */}
      {activeTab === 'timeline' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {steps.map((step, idx) => {
            const color = agentColors[step.agent] || '#8b5cf6';
            return (
              <div
                key={idx}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  transition: 'background 0.2s',
                }}
              >
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: `${color}25`,
                    color: color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    flexShrink: 0,
                    marginTop: '2px',
                    border: `1px solid ${color}60`,
                  }}
                >
                  {step.step}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f0f0f5' }}>
                        {step.agent}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: color, background: `${color}15`, padding: '1px 8px', borderRadius: '4px', fontWeight: 600 }}>
                        {step.action}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      {step.latency_ms > 0 ? `${step.latency_ms.toFixed(1)} ms` : '< 1 ms'}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {step.summary}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {messages.map((msg, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedMessage(selectedMessage === msg ? null : msg)}
              style={{
                background: selectedMessage === msg ? 'rgba(139, 92, 246, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${selectedMessage === msg ? 'rgba(139, 92, 246, 0.4)' : 'rgba(255, 255, 255, 0.06)'}`,
                borderRadius: '10px',
                padding: '12px 16px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: agentColors[msg.from_agent] || '#a78bfa' }}>
                    {msg.from_agent}
                  </span>
                  <ArrowRight size={14} color="var(--text-secondary)" />
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: agentColors[msg.to_agent] || '#a78bfa' }}>
                    {msg.to_agent}
                  </span>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  {msg.timestamp.split('T')[1]?.substring(0, 8) || msg.timestamp}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.72rem', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                  PROTOCOL: {msg.handoff_type}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  Payload keys: {Object.keys(msg.payload || {}).join(', ')}
                </span>
              </div>

              {selectedMessage === msg && (
                <div style={{ marginTop: '10px', background: 'rgba(0, 0, 0, 0.4)', borderRadius: '6px', padding: '10px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#a78bfa', overflowX: 'auto', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <pre style={{ margin: 0 }}>{JSON.stringify(msg.payload, null, 2)}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </SpotlightCard>
  );
};
