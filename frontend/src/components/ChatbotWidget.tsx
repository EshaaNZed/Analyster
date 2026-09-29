import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { sendChatMessage, ChatResponse } from '../api/client';
import {
  MessageSquare, X, Trash2, Send, Bot, User, Sparkles, Shield,
  ShieldCheck, AlertTriangle, ExternalLink, ChevronRight, HelpCircle
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  sources?: string[];
  suggestedFollowups?: string[];
  model?: string;
  timestamp: string;
}

export const ChatbotWidget: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeClaimContext, setActiveClaimContext] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Extract claim ID from URL if on /studio/:claimId
  useEffect(() => {
    const match = location.pathname.match(/\/studio\/(CLM-[A-Za-z0-9-]+)/);
    if (match && match[1]) {
      setActiveClaimContext(match[1]);
    }
  }, [location.pathname]);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome-1',
          sender: 'bot',
          text: "Hello! I'm your **Claims & SIU Support Copilot**. I can assist you with claim status, required documentation, deductible rules, and investigative triage.",
          sources: ['Claims Knowledge Base (RAG)'],
          suggestedFollowups: [
            'What documents are needed to file a claim?',
            'How do deductibles and coverage limits work?',
            'What is the typical claim payout timeline?',
            'How does the 5-Agent Swarm detect anomalies?'
          ],
          model: 'Claims Knowledge Base',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputValue;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputValue('');
    setLoading(true);

    try {
      const res: ChatResponse = await sendChatMessage(textToSend.trim(), activeClaimContext);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: res.response,
        sources: res.sources,
        suggestedFollowups: res.suggested_followups,
        model: res.model,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'bot',
        text: `⚠️ **Assistant Error:** ${err.message || 'Unable to process your request. Please try again.'}`,
        sources: ['System Error Handler'],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: `reset-${Date.now()}`,
        sender: 'bot',
        text: "Conversation cleared. How can I assist you with your claims, policies, or coverage questions today?",
        sources: ['Claims Support Assistant'],
        suggestedFollowups: [
          'What documents are needed to file a claim?',
          'How do I track claim status?',
          'How does the 5-Agent Swarm work?'
        ],
        model: 'Claims Knowledge Base',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, fontFamily: 'var(--font-sans)' }}>
      
      {/* ─── Chat Window ────────────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          style={{
            width: '390px',
            height: '560px',
            maxHeight: 'calc(100vh - 120px)',
            maxWidth: 'calc(100vw - 32px)',
            background: 'rgba(15, 16, 26, 0.96)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '20px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            marginBottom: '16px',
            animation: 'fadeInUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 18px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(168, 85, 247, 0.2) 100%)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 12px rgba(99, 102, 241, 0.5)',
                }}
              >
                <Bot size={18} color="#ffffff" />
              </div>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
                  Claims Copilot Assistant
                </div>
                <div style={{ fontSize: '0.7rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                  Grounded with Safety Guardrails
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={handleClear}
                title="Clear Chat History"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '6px',
                  padding: '6px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Trash2 size={13} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Minimize"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '6px',
                  padding: '6px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Context Banner (If active claim context detected) */}
          {activeClaimContext && (
            <div
              style={{
                padding: '6px 16px',
                background: 'rgba(99, 102, 241, 0.1)',
                borderBottom: '1px solid rgba(99, 102, 241, 0.2)',
                fontSize: '0.72rem',
                color: '#a5b4fc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>Context Bound: <strong style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>{activeClaimContext}</strong></span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>Live DB Query Ready</span>
            </div>
          )}

          {/* Messages Body */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  gap: '4px',
                }}
              >
                <div
                  style={{
                    maxWidth: '88%',
                    padding: '12px 14px',
                    borderRadius: msg.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                    background:
                      msg.sender === 'user'
                        ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                        : 'rgba(255, 255, 255, 0.05)',
                    border: msg.sender === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#f0f0f5',
                    fontSize: '0.82rem',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    boxShadow: msg.sender === 'user' ? '0 4px 16px rgba(99, 102, 241, 0.3)' : 'none',
                  }}
                >
                  {msg.text}

                  {/* Sources Pill */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.6)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ShieldCheck size={11} color="#34d399" />
                      <span>{msg.sources.join(' • ')}</span>
                    </div>
                  )}
                </div>

                {/* Suggested Followups */}
                {msg.suggestedFollowups && msg.suggestedFollowups.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px', maxWidth: '88%' }}>
                    {msg.suggestedFollowups.map((sug, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(sug)}
                        style={{
                          textAlign: 'left',
                          background: 'rgba(99, 102, 241, 0.1)',
                          border: '1px solid rgba(99, 102, 241, 0.25)',
                          borderRadius: '8px',
                          padding: '5px 10px',
                          color: '#a5b4fc',
                          fontSize: '0.74rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)';
                          e.currentTarget.style.color = '#ffffff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                          e.currentTarget.style.color = '#a5b4fc';
                        }}
                      >
                        <ChevronRight size={11} /> {sug}
                      </button>
                    ))}
                  </div>
                )}

                <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', padding: '0 4px' }}>
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '10px', width: 'fit-content' }}>
                <Sparkles size={14} color="#818cf8" className="animate-spin" />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Synthesizing verified response...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{
              padding: '12px 14px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(0, 0, 0, 0.3)',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
            }}
          >
            <input
              type="text"
              placeholder="Ask about filing, deductibles, status..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={loading}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#f0f0f5',
                fontSize: '0.82rem',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || loading}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: inputValue.trim() ? 'linear-gradient(135deg, #6366f1, #a855f7)' : 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: inputValue.trim() ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
              }}
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}

      {/* ─── Floating Launcher Button ───────────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 20px',
          borderRadius: '999px',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 30px rgba(99, 102, 241, 0.5)',
          color: '#ffffff',
          fontWeight: 800,
          fontSize: '0.85rem',
          cursor: 'pointer',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
          e.currentTarget.style.boxShadow = '0 12px 35px rgba(99, 102, 241, 0.65)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow = '0 8px 30px rgba(99, 102, 241, 0.5)';
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center' }}>
          {isOpen ? <X size={18} /> : <MessageSquare size={18} />}
        </span>
        <span>{isOpen ? 'Close Assistant' : 'Claims Copilot'}</span>
        {!isOpen && (
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#34d399',
              boxShadow: '0 0 8px #34d399',
            }}
          />
        )}
      </button>

    </div>
  );
};
