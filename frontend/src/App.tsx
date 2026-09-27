import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { ParticlesBackground } from './components/reactbits';
import { OverviewView } from './views/OverviewView';
import { ClaimStudioView } from './views/ClaimStudioView';
import { GraphView } from './views/GraphView';
import { SimulatorView } from './views/SimulatorView';
import { SiuHubView } from './views/SiuHubView';
import { fetchHealth } from './api/client';

export const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'overview' | 'claim_studio' | 'graph' | 'simulator' | 'siu'>('overview');
  const [selectedClaimId, setSelectedClaimId] = useState<string>('CLM-2024-00003');
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    // Initial health check
    fetchHealth()
      .then(setHealth)
      .catch((err) => console.warn('Backend health check warning:', err));

    // Periodic health heartbeat every 15s
    const timer = setInterval(() => {
      fetchHealth()
        .then(setHealth)
        .catch(() => {});
    }, 15000);

    return () => clearInterval(timer);
  }, []);

  const handleSelectClaim = (claimId: string) => {
    setSelectedClaimId(claimId);
    setActiveView('claim_studio');
  };

  const handleReferToSiu = (claimId: string) => {
    setSelectedClaimId(claimId);
    setActiveView('siu');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', position: 'relative', overflowX: 'hidden' }}>
      {/* React Bits Ambient Particles Mesh */}
      <ParticlesBackground particleCount={40} speed={0.4} />

      {/* Persistent Global Header */}
      <Header
        activeView={activeView}
        setActiveView={setActiveView}
        onSearchClaim={handleSelectClaim}
        health={health}
      />

      {/* Main View Router */}
      <main style={{ position: 'relative', zIndex: 1, paddingBottom: '60px' }}>
        {activeView === 'overview' && (
          <OverviewView onSelectClaim={handleSelectClaim} />
        )}

        {activeView === 'claim_studio' && (
          <ClaimStudioView
            selectedClaimId={selectedClaimId}
            onSelectClaim={handleSelectClaim}
            onReferToSiu={handleReferToSiu}
          />
        )}

        {activeView === 'graph' && (
          <GraphView
            initialEntityId={selectedClaimId}
            onSelectClaim={handleSelectClaim}
          />
        )}

        {activeView === 'simulator' && (
          <SimulatorView />
        )}

        {activeView === 'siu' && (
          <SiuHubView onSelectClaim={handleSelectClaim} />
        )}
      </main>
    </div>
  );
};

export default App;
