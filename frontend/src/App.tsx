import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ChatbotWidget } from './components/ChatbotWidget';
import { ParticlesBackground } from './components/reactbits';

// Dedicated Page Views
import { HomeView } from './views/HomeView';
import { OverviewView } from './views/OverviewView';
import { ClaimStudioView } from './views/ClaimStudioView';
import { ClaimIntakeView } from './views/ClaimIntakeView';
import { GraphView } from './views/GraphView';
import { SiuHubView } from './views/SiuHubView';
import { EvaluationView } from './views/EvaluationView';
import { ArchitectureView } from './views/ArchitectureView';

import { fetchHealth } from './api/client';

export const App: React.FC = () => {
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    // Initial health check
    fetchHealth()
      .then(setHealth)
      .catch((err) => console.warn('Backend health check warning:', err));

    // Periodic heartbeat every 20s
    const timer = setInterval(() => {
      fetchHealth()
        .then(setHealth)
        .catch(() => {});
    }, 20000);

    return () => clearInterval(timer);
  }, []);

  return (
    <BrowserRouter>
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          position: 'relative',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Subtle Ambient Particles */}
        <ParticlesBackground particleCount={35} speed={0.3} />

        {/* Global Navigation Header */}
        <Header health={health} />

        {/* Dynamic Multi-Page Router */}
        <main style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <ErrorBoundary>
            <Routes>
              {/* Landing / Executive Overview */}
              <Route path="/" element={<HomeView />} />

              {/* Claims Portfolio & Analytics */}
              <Route path="/portfolio" element={<OverviewView />} />

              {/* New Claim Intake (FNOL) */}
              <Route path="/intake" element={<ClaimIntakeView />} />

              {/* 5-Agent Swarm Claim Studio */}
              <Route path="/studio" element={<ClaimStudioView />} />
              <Route path="/studio/:claimId" element={<ClaimStudioView />} />

              {/* Entity Knowledge Graph */}
              <Route path="/graph" element={<GraphView />} />

              {/* SIU Case Dossier Hub */}
              <Route path="/siu" element={<SiuHubView />} />

              {/* Quantitative System Evaluation & Benchmarks */}
              <Route path="/evaluation" element={<EvaluationView />} />

              {/* System Blueprint & Architecture */}
              <Route path="/architecture" element={<ArchitectureView />} />

              {/* Fallback Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
        </main>

        {/* Global Website Footer */}
        <Footer />

        {/* Global Floating AI Claims Copilot Widget */}
        <ChatbotWidget />
      </div>
    </BrowserRouter>
  );
};

export default App;
