/**
 * ANALYSTER — CLAIMS INTELLIGENCE REVIEWER STUDIO
 * Core Modular JavaScript Application (Vanilla JS ES6+)
 */

const API_BASE = '/api';

// Application State
const state = {
  currentView: 'overview',
  selectedClaimId: 'CLM-2024-00003',
  stats: null,
  claims: [],
  page: 1,
  pageSize: 12,
  totalPages: 1,
  totalCount: 0,
  riskFilter: 'ALL',
  policyFilter: 'ALL',
  searchQuery: '',
  claimDetail: null,
  dossier: null,
  networkInstance: null,
  riskChart: null,
  policyChart: null,
};

// ─── INITIALIZATION ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initNavigation();
  initSpotlights();
  initSimulator();
  loadHealth();
  loadOverview();
});

// ─── PARTICLE CANVAS CONSTELLATION ───────────────────────────────────────────
function initParticles() {
  const canvas = document.getElementById('particlesCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  const colors = ['#6366f1', '#8b5cf6', '#3b82f6', '#ec4899'];
  for (let i = 0; i < 45; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 2 + 1,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: Math.random() * 0.35 + 0.1,
    });
  }

  function render() {
    ctx.clearRect(0, 0, width, height);

    // Connecting lines
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(99, 102, 241, ${(1 - dist / 120) * 0.12})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    // Draw particles
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    requestAnimationFrame(render);
  }
  render();
}

// ─── SPOTLIGHT CURSOR FOLLOWER ───────────────────────────────────────────────
function initSpotlights() {
  document.addEventListener('mousemove', (e) => {
    document.querySelectorAll('.spotlight-card').forEach((card) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });
}

// ─── NAVIGATION ──────────────────────────────────────────────────────────────
function initNavigation() {
  document.querySelectorAll('.nav-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      switchView(view);
    });
  });

  // Global Quick Search
  const searchForm = document.getElementById('quickSearchForm');
  const searchInput = document.getElementById('quickSearchInput');
  if (searchForm && searchInput) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = searchInput.value.trim();
      if (val) {
        selectClaim(val);
      }
    });
  }
}

function switchView(viewName) {
  state.currentView = viewName;
  document.querySelectorAll('.nav-tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });
  document.querySelectorAll('.view-section').forEach((sec) => {
    sec.classList.toggle('active', sec.id === `view-${viewName}`);
  });

  if (viewName === 'graph') {
    loadGraphView(state.selectedClaimId);
  }
}

// ─── HEALTH TELEMETRY ────────────────────────────────────────────────────────
async function loadHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) return;
    const data = await res.json();
    document.getElementById('status-db').textContent = data.database_connected ? 'Connected' : 'Offline';
    document.getElementById('status-vector').textContent = data.vector_store_connected ? 'Indexed (all-MiniLM)' : 'Offline';
    document.getElementById('status-graph').textContent = data.graph_store_loaded ? 'Active' : 'Offline';
    document.getElementById('status-agents').textContent = data.agents_ready ? 'Ready' : 'Standby';
  } catch (err) {
    console.warn('Health check error:', err);
  }
}

// ─── OVERVIEW & STATS ────────────────────────────────────────────────────────
async function loadOverview() {
  try {
    const [statsRes, filtersRes] = await Promise.all([
      fetch(`${API_BASE}/dashboard/stats`).then((r) => r.json()),
      fetch(`${API_BASE}/filters`).then((r) => r.json()),
    ]);

    state.stats = statsRes;
    renderStats(statsRes);
    renderCharts(statsRes);
    populateFilters(filtersRes);
    loadClaims();
  } catch (err) {
    console.error('Failed to load overview:', err);
  }
}

function renderStats(stats) {
  animateCounter('stat-total-claims', stats.total_claims);
  animateCounter('stat-total-exposure', stats.total_exposure_usd, '$');
  animateCounter('stat-high-risk', stats.high_risk_count);
  animateCounter('stat-anomalies', stats.anomaly_count);
  document.getElementById('stat-avg-claim').textContent = `$${Math.round(stats.avg_claim_amount_usd).toLocaleString()}`;
}

function animateCounter(elementId, target, prefix = '', suffix = '') {
  const el = document.getElementById(elementId);
  if (!el) return;
  let start = 0;
  const duration = 1200;
  const startTime = performance.now();

  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + (target - start) * easeOut);
    el.textContent = `${prefix}${current.toLocaleString()}${suffix}`;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

function renderCharts(stats) {
  // Risk Tier Donut
  const riskCtx = document.getElementById('riskDonutChart');
  if (riskCtx && window.Chart) {
    if (state.riskChart) state.riskChart.destroy();
    state.riskChart = new Chart(riskCtx, {
      type: 'doughnut',
      data: {
        labels: ['High Risk', 'Medium Risk', 'Low Risk'],
        datasets: [{
          data: [stats.high_risk_count, stats.medium_risk_count, stats.low_risk_count],
          backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#8b8b9e', font: { family: 'Inter', size: 11 } } },
        },
        cutout: '72%',
      },
    });
  }

  // Policy Lines Bar Chart
  const policyCtx = document.getElementById('policyBarChart');
  if (policyCtx && window.Chart) {
    if (state.policyChart) state.policyChart.destroy();
    const lines = Object.keys(stats.policy_lines);
    const counts = Object.values(stats.policy_lines);
    state.policyChart = new Chart(policyCtx, {
      type: 'bar',
      data: {
        labels: lines,
        datasets: [{
          label: 'Claims Count',
          data: counts,
          backgroundColor: '#8b5cf6',
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#8b8b9e', font: { size: 11 } }, grid: { display: false } },
          y: { ticks: { color: '#8b8b9e', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
        },
      },
    });
  }
}

function populateFilters(filterOpts) {
  const lineSel = document.getElementById('filter-policy-line');
  if (lineSel && filterOpts.policy_lines) {
    lineSel.innerHTML = '<option value="ALL">All Policy Lines</option>';
    filterOpts.policy_lines.forEach((pl) => {
      lineSel.innerHTML += `<option value="${pl}">${pl}</option>`;
    });
    lineSel.addEventListener('change', () => {
      state.policyFilter = lineSel.value;
      state.page = 1;
      loadClaims();
    });
  }

  const riskSel = document.getElementById('filter-risk-label');
  if (riskSel) {
    riskSel.addEventListener('change', () => {
      state.riskFilter = riskSel.value;
      state.page = 1;
      loadClaims();
    });
  }

  const tableSearch = document.getElementById('tableSearchInput');
  if (tableSearch) {
    tableSearch.addEventListener('input', debounce(() => {
      state.searchQuery = tableSearch.value.trim();
      state.page = 1;
      loadClaims();
    }, 300));
  }
}

async function loadClaims() {
  const params = new URLSearchParams({
    page: state.page,
    page_size: state.pageSize,
  });
  if (state.riskFilter !== 'ALL') params.set('risk_label', state.riskFilter);
  if (state.policyFilter !== 'ALL') params.set('policy_line', state.policyFilter);
  if (state.searchQuery) params.set('search', state.searchQuery);

  try {
    const res = await fetch(`${API_BASE}/claims?${params.toString()}`);
    const data = await res.json();
    state.claims = data.claims;
    state.totalPages = data.total_pages;
    state.totalCount = data.total_count;
    renderClaimsTable(data.claims);
    document.getElementById('table-page-info').textContent = `Showing page ${state.page} of ${data.total_pages} (${data.total_count} total)`;
  } catch (err) {
    console.error('Failed to load claims:', err);
  }
}

function renderClaimsTable(claims) {
  const tbody = document.getElementById('claimsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  claims.forEach((c) => {
    const tr = document.createElement('tr');
    tr.onclick = () => selectClaim(c.claim_id);
    const badgeClass = c.risk_label === 'High' ? 'badge-high' : c.risk_label === 'Medium' ? 'badge-medium' : 'badge-low';
    tr.innerHTML = `
      <td style="font-family: var(--font-mono); font-weight: 700; color: #a78bfa;">${c.claim_id}</td>
      <td>
        <div style="font-weight: 600; color: #f0f0f5;">${c.customer_id}</div>
        <div style="font-size: 0.72rem; color: var(--text-tertiary);">${c.policy_id} • ${c.policy_line}</div>
      </td>
      <td>
        <div style="color: #f0f0f5;">${c.incident_type}</div>
        <div style="font-size: 0.72rem; color: var(--text-tertiary);">${c.incident_date}</div>
      </td>
      <td style="text-align: right; font-family: var(--font-mono); font-weight: 700;">
        $${c.claim_amount_usd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </td>
      <td style="text-align: center; font-family: var(--font-mono); color: ${c.filing_delay_days > 14 ? '#fbbf24' : 'var(--text-secondary)'};">
        ${c.filing_delay_days}d
      </td>
      <td style="text-align: center;">
        <span class="badge ${badgeClass}">${c.risk_label}</span>
      </td>
      <td style="text-align: center;">
        ${c.is_anomaly_ground_truth ? '<span style="color: #fbbf24; font-size: 0.75rem; font-weight: 600;">⚠️ Outlier</span>' : '<span style="color: var(--text-tertiary); font-size: 0.72rem;">Normal</span>'}
      </td>
      <td style="text-align: right;">
        <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.75rem;" onclick="event.stopPropagation(); selectClaim('${c.claim_id}')">
          Inspect →
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function prevPage() {
  if (state.page > 1) {
    state.page--;
    loadClaims();
  }
}

function nextPage() {
  if (state.page < state.totalPages) {
    state.page++;
    loadClaims();
  }
}

// ─── CLAIM STUDIO & MULTI-AGENT SWARM ────────────────────────────────────────
async function selectClaim(claimId) {
  state.selectedClaimId = claimId;
  state.dossier = null;
  switchView('studio');

  // Load claim details
  try {
    const res = await fetch(`${API_BASE}/claims/${claimId}`);
    if (!res.ok) throw new Error('Claim not found');
    const claim = await res.json();
    state.claimDetail = claim;
    renderClaimProfile(claim);
  } catch (err) {
    alert(`Could not load claim ${claimId}`);
  }
}

function renderClaimProfile(claim) {
  document.getElementById('studio-claim-id').textContent = claim.claim_id;
  document.getElementById('studio-customer').textContent = `${claim.customer_id} (${claim.customer_subtype || claim.customer_main_type || 'Policyholder'})`;
  document.getElementById('studio-policy').textContent = `${claim.policy_id} (${claim.policy_line})`;
  document.getElementById('studio-incident-date').textContent = claim.incident_date;
  document.getElementById('studio-filing-date').textContent = `${claim.filing_date} (${claim.filing_delay_days}d delay)`;

  const riskBadge = document.getElementById('studio-risk-badge');
  riskBadge.textContent = `${claim.risk_label} RISK`;
  riskBadge.className = `badge ${claim.risk_label === 'High' ? 'badge-high' : claim.risk_label === 'Medium' ? 'badge-medium' : 'badge-low'}`;

  document.getElementById('studio-narrative').textContent = `"${claim.incident_narrative}"`;
  document.getElementById('studio-amount').textContent = `$${claim.claim_amount_usd.toLocaleString()}`;
  document.getElementById('studio-limit').textContent = `$${claim.coverage_limit_usd.toLocaleString()}`;
  document.getElementById('studio-exposure').textContent = `${(claim.claim_to_limit_ratio * 100).toFixed(1)}%`;
  document.getElementById('studio-premium').textContent = `$${(claim.annual_premium_usd || 0).toLocaleString()}`;

  // Reset dossier container
  document.getElementById('swarm-invite-card').style.display = 'block';
  document.getElementById('swarm-results-workspace').style.display = 'none';
}

async function runSwarmAnalysis() {
  const claimId = state.selectedClaimId;
  const launchBtn = document.getElementById('btn-launch-swarm');
  launchBtn.disabled = true;
  launchBtn.innerHTML = '<span class="pulse-dot"></span> Orchestrating 5-Agent Swarm...';

  try {
    const res = await fetch(`${API_BASE}/claims/${claimId}/analyze`, { method: 'POST' });
    if (!res.ok) throw new Error('Analysis failed');
    const dossier = await res.json();
    state.dossier = dossier;

    document.getElementById('swarm-invite-card').style.display = 'none';
    document.getElementById('swarm-results-workspace').style.display = 'flex';
    renderDossierResults(dossier);
  } catch (err) {
    alert(`Swarm error: ${err.message}`);
  } finally {
    launchBtn.disabled = false;
    launchBtn.innerHTML = '⚡ Re-Run 5-Agent Swarm Analysis';
  }
}

function renderDossierResults(dossier) {
  // 1. Risk Gauge
  const score = dossier.risk_analysis?.risk_score || 0;
  const tier = dossier.risk_analysis?.risk_tier || 'Low';
  document.getElementById('gauge-score-text').textContent = score;
  document.getElementById('gauge-tier-pill').textContent = `${tier} Risk`;
  document.getElementById('gauge-xgb-prob').textContent = `${((dossier.risk_analysis?.xgb_probability || 0) * 100).toFixed(1)}%`;
  document.getElementById('gauge-rf-prob').textContent = `${((dossier.risk_analysis?.rf_probability || 0) * 100).toFixed(1)}%`;
  document.getElementById('gauge-summary-text').textContent = dossier.risk_analysis?.risk_analysis_summary || '';

  // Animate Gauge SVG Arc
  const arc = document.getElementById('gauge-arc');
  if (arc) {
    const totalLength = 282; // pi * 90
    const offset = totalLength - (score / 100) * totalLength;
    arc.style.strokeDashoffset = offset;
    arc.style.stroke = score >= 70 ? '#ef4444' : score >= 40 ? '#f59e0b' : '#10b981';
  }

  // 2. SHAP Attribution Waterfall
  const shapList = document.getElementById('shap-factors-list');
  if (shapList) {
    shapList.innerHTML = '';
    (dossier.risk_analysis?.top_shap_factors || []).forEach((f) => {
      const isRiskIncr = f.direction === 'INCREASES_RISK';
      shapList.innerHTML += `
        <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 10px; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <strong style="color: #f0f0f5; font-size: 0.8rem;">${f.display_name}</strong>
            <span style="color: ${isRiskIncr ? '#ef4444' : '#10b981'}; font-weight: 700; font-size: 0.75rem;">
              ${isRiskIncr ? '▲ +' : '▼ '}${f.shap_value.toFixed(2)}
            </span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-secondary);">
            <span>Value: <strong style="color: #e2e8f0;">${typeof f.raw_value === 'number' ? f.raw_value.toFixed(2) : f.raw_value}</strong></span>
            <span>Impact: ${f.impact_level}</span>
          </div>
        </div>
      `;
    });
  }

  // 3. Anomaly Deep-Dive
  document.getElementById('anomaly-outlier-text').textContent = dossier.anomaly_detection?.is_statistical_outlier ? '⚠️ YES (CONFIRMED)' : '✓ NO (NORMAL)';
  document.getElementById('anomaly-score-text').textContent = (dossier.anomaly_detection?.isolation_forest_score || 0).toFixed(3);
  const catContainer = document.getElementById('anomaly-categories');
  catContainer.innerHTML = '';
  (dossier.anomaly_detection?.flagged_anomaly_categories || []).forEach((cat) => {
    catContainer.innerHTML += `<span class="badge badge-high" style="font-family: var(--font-mono); font-size: 0.68rem;">${cat}</span> `;
  });
  document.getElementById('anomaly-summary-text').textContent = dossier.anomaly_detection?.anomaly_deep_dive_summary || '';

  // 4. Grounded Executive Summary
  document.getElementById('executive-summary-text').textContent = dossier.summarization?.executive_summary || '';
  const keyDrivers = document.getElementById('key-risk-drivers');
  keyDrivers.innerHTML = '';
  (dossier.summarization?.key_risk_drivers || []).forEach((drv) => {
    keyDrivers.innerHTML += `<li style="margin-bottom: 4px;">${drv}</li>`;
  });

  // 5. Precedent Claims
  const precContainer = document.getElementById('precedent-claims-list');
  precContainer.innerHTML = '';
  (dossier.retrieval?.precedent_claims || []).forEach((p) => {
    precContainer.innerHTML += `
      <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); padding: 10px; border-radius: 8px; cursor: pointer;" onclick="selectClaim('${p.claim_id}')">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <span style="font-family: var(--font-mono); color: #a78bfa; font-weight: 700; font-size: 0.8rem;">${p.claim_id}</span>
          <span style="background: rgba(59, 130, 246, 0.15); color: #60a5fa; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 700;">
            ${(p.similarity_score * 100).toFixed(1)}% Match
          </span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-secondary);">
          <span>$${p.claim_amount_usd.toLocaleString()}</span>
          <span>Status: <strong style="color: #34d399;">${p.claim_status}</strong></span>
        </div>
      </div>
    `;
  });

  // 6. Investigation Action Items
  document.getElementById('triage-disposition').textContent = dossier.investigation_support?.suggested_disposition || '';
  const priorityPill = document.getElementById('triage-priority-pill');
  priorityPill.textContent = `${dossier.investigation_support?.priority_level || 'STANDARD'} PRIORITY`;
  priorityPill.className = `badge ${dossier.investigation_support?.priority_level === 'HIGH' ? 'badge-high' : 'badge-medium'}`;

  const actionsList = document.getElementById('action-items-list');
  actionsList.innerHTML = '';
  (dossier.investigation_support?.recommended_actions || []).forEach((act) => {
    actionsList.innerHTML += `
      <label style="display: flex; align-items: flex-start; gap: 8px; font-size: 0.82rem; color: #e2e8f0; background: rgba(255,255,255,0.02); padding: 8px; border-radius: 6px; cursor: pointer;">
        <input type="checkbox" style="margin-top: 3px;" />
        <span>${act}</span>
      </label>
    `;
  });

  const interviewList = document.getElementById('interview-questions-list');
  interviewList.innerHTML = '';
  (dossier.investigation_support?.interview_questions_for_claimant || []).forEach((q) => {
    interviewList.innerHTML += `
      <div style="font-size: 0.8rem; color: #e2e8f0; background: rgba(255,255,255,0.02); padding: 8px 12px; border-radius: 6px; border-left: 3px solid #8b5cf6;">
        "${q}"
      </div>
    `;
  });

  // 7. Multi-Agent War Room Timeline & Handoffs
  renderWarRoom(dossier);
}

function renderWarRoom(dossier) {
  document.getElementById('swarm-total-latency').textContent = `Total Latency: ${dossier.total_latency_ms?.toFixed(1) || 0}ms`;

  const timeline = document.getElementById('warroom-timeline');
  timeline.innerHTML = '';
  (dossier.execution_steps || []).forEach((s) => {
    timeline.innerHTML += `
      <div style="display: flex; gap: 12px; padding: 10px; background: rgba(255,255,255,0.02); border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
        <div style="width: 24px; height: 24px; border-radius: 50%; background: rgba(99,102,241,0.2); color: #818cf8; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.75rem;">
          ${s.step}
        </div>
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 700; color: #f0f0f5;">
            <span>${s.agent} — ${s.action}</span>
            <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-secondary);">${s.latency_ms > 0 ? s.latency_ms.toFixed(1) + 'ms' : '< 1ms'}</span>
          </div>
          <p style="margin: 4px 0 0 0; font-size: 0.78rem; color: var(--text-secondary);">${s.summary}</p>
        </div>
      </div>
    `;
  });

  const handoffs = document.getElementById('warroom-handoffs');
  handoffs.innerHTML = '';
  (dossier.a2a_messages || []).forEach((m) => {
    handoffs.innerHTML += `
      <div style="padding: 10px; background: rgba(255,255,255,0.02); border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); font-size: 0.78rem;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="color: #a78bfa; font-weight: 700;">${m.from_agent} → ${m.to_agent}</span>
          <span style="color: var(--text-secondary); font-family: var(--font-mono); font-size: 0.7rem;">${m.timestamp?.split('T')[1]?.substring(0,8) || ''}</span>
        </div>
        <div style="background: rgba(99,102,241,0.15); color: #818cf8; padding: 2px 6px; border-radius: 4px; display: inline-block; font-size: 0.7rem; font-family: var(--font-mono); margin-bottom: 6px;">
          PROTOCOL: ${m.handoff_type}
        </div>
        <pre style="margin: 0; background: rgba(0,0,0,0.3); padding: 8px; border-radius: 4px; font-family: var(--font-mono); font-size: 0.7rem; color: #cbd5e1; overflow-x: auto;">${JSON.stringify(m.payload, null, 2)}</pre>
      </div>
    `;
  });
}

// ─── KNOWLEDGE GRAPH EXPLORER (VIS-NETWORK) ──────────────────────────────────
async function loadGraphView(entityId) {
  const container = document.getElementById('visNetworkContainer');
  if (!container || !window.vis) return;

  const targetId = entityId || document.getElementById('graphEntityInput')?.value || 'CLM-2024-00003';
  document.getElementById('graph-target-entity').textContent = targetId;

  try {
    const res = await fetch(`${API_BASE}/graph/${encodeURIComponent(targetId)}?depth=2`);
    if (!res.ok) throw new Error('Graph entity not found');
    const data = await res.json();

    const nodeColors = {
      customer: { background: '#6366f1', border: '#818cf8' },
      policy: { background: '#8b5cf6', border: '#a78bfa' },
      claim: { background: '#ef4444', border: '#f87171' },
      incident_type: { background: '#f59e0b', border: '#fbbf24' },
      household: { background: '#06b6d4', border: '#22d3ee' },
      other: { background: '#64748b', border: '#94a3b8' },
    };

    const nodes = new vis.DataSet(
      data.nodes.map((n) => {
        const isCenter = n.id === data.center_node;
        const color = nodeColors[n.group] || nodeColors.other;
        return {
          id: n.id,
          label: n.label,
          title: n.title,
          size: isCenter ? 32 : 20,
          shape: n.group === 'household' ? 'diamond' : 'dot',
          color: {
            background: isCenter ? '#ec4899' : color.background,
            border: isCenter ? '#f472b6' : color.border,
            highlight: { background: '#fff', border: '#6366f1' },
          },
          font: { color: '#f0f0f5', size: isCenter ? 14 : 11, face: 'Inter' },
        };
      })
    );

    const edges = new vis.DataSet(
      data.edges.map((e) => ({
        from: e.from,
        to: e.to,
        label: e.label,
        arrows: 'to',
        color: { color: 'rgba(255,255,255,0.18)', highlight: '#818cf8' },
        font: { color: 'rgba(255,255,255,0.5)', size: 9, background: '#0a0a0f' },
      }))
    );

    if (state.networkInstance) state.networkInstance.destroy();
    state.networkInstance = new vis.Network(
      container,
      { nodes, edges },
      {
        physics: { stabilization: { iterations: 100 } },
        interaction: { hover: true, zoomView: true },
      }
    );

    state.networkInstance.on('click', (params) => {
      if (params.nodes && params.nodes.length > 0) {
        const clickedId = params.nodes[0];
        const nodeObj = data.nodes.find((n) => n.id === clickedId);
        showGraphNodeDetails(nodeObj);
      }
    });

    document.getElementById('graph-stats-text').textContent = `Subgraph: ${data.nodes.length} entities, ${data.edges.length} relationships`;
  } catch (err) {
    container.innerHTML = `<div style="padding: 20px; color: #ef4444; text-align: center;">${err.message}</div>`;
  }
}

function showGraphNodeDetails(node) {
  const drawer = document.getElementById('graph-node-drawer');
  if (!drawer || !node) return;
  drawer.style.display = 'block';
  document.getElementById('drawer-node-label').textContent = node.label;
  document.getElementById('drawer-node-group').textContent = node.group.toUpperCase();

  const metaList = document.getElementById('drawer-meta-list');
  metaList.innerHTML = '';
  if (node.metadata) {
    Object.entries(node.metadata).forEach(([k, v]) => {
      metaList.innerHTML += `
        <div style="display: flex; justify-content: space-between; padding: 2px 0; border-bottom: 1px solid rgba(255,255,255,0.04);">
          <span style="color: var(--text-tertiary);">${k}:</span>
          <strong style="color: #f0f0f5; font-family: var(--font-mono);">${v}</strong>
        </div>
      `;
    });
  }
}

// ─── COUNTERFACTUAL WHAT-IF SIMULATOR ────────────────────────────────────────
function initSimulator() {
  const claimAmt = document.getElementById('sim-amount');
  const covLimit = document.getElementById('sim-limit');
  const filingDelay = document.getElementById('sim-delay');
  const annPrem = document.getElementById('sim-premium');
  const numPol = document.getElementById('sim-policies');
  const unusualNarrative = document.getElementById('sim-narrative-flag');
  const earlyInception = document.getElementById('sim-inception-flag');

  function calculateSimulation() {
    const amt = Number(claimAmt?.value || 21000);
    const limit = Number(covLimit?.value || 120000);
    const delay = Number(filingDelay?.value || 22);
    const prem = Number(annPrem?.value || 3000);
    const pols = Number(numPol?.value || 1);
    const flagNarrative = unusualNarrative?.checked || false;
    const flagInception = earlyInception?.checked || false;

    // Display values
    document.getElementById('val-sim-amount').textContent = `$${amt.toLocaleString()}`;
    document.getElementById('val-sim-limit').textContent = `$${limit.toLocaleString()}`;
    document.getElementById('val-sim-delay').textContent = `${delay} days`;
    document.getElementById('val-sim-premium').textContent = `$${prem.toLocaleString()}`;
    document.getElementById('val-sim-policies').textContent = `${pols} policies`;

    // Mathematical calculation aligned with ensemble heuristics
    const claimToLimitRatio = amt / Math.max(1, limit);
    const claimToPremRatio = amt / Math.max(1, prem);

    let base = Math.min(35, claimToLimitRatio * 40);
    let premScore = Math.min(25, (claimToPremRatio / 10) * 15);
    let delayScore = delay > 14 ? Math.min(20, (delay - 14) * 1.5) : 0;
    let loyaltyDiscount = Math.min(10, (pols - 1) * 3);
    let flagScore = (flagNarrative ? 18 : 0) + (flagInception ? 25 : 0);

    const simScore = Math.max(5, Math.min(99, Math.round(base + premScore + delayScore + flagScore - loyaltyDiscount)));
    const tier = simScore >= 70 ? 'High' : simScore >= 40 ? 'Medium' : 'Low';
    const routing = simScore >= 70
      ? 'Priority SIU Referral (Special Investigation)'
      : simScore >= 40
      ? 'Standard Adjuster Review'
      : 'Fast-Track Straight Through Processing (STP)';

    document.getElementById('sim-score-text').textContent = simScore;
    document.getElementById('sim-tier-pill').textContent = `${tier} Risk`;
    document.getElementById('sim-routing-text').textContent = routing;
    document.getElementById('sim-ratio-limit').textContent = `${(claimToLimitRatio * 100).toFixed(1)}%`;
    document.getElementById('sim-ratio-prem').textContent = `${claimToPremRatio.toFixed(1)}x`;

    const arc = document.getElementById('sim-gauge-arc');
    if (arc) {
      const total = 282;
      arc.style.strokeDashoffset = total - (simScore / 100) * total;
      arc.style.stroke = simScore >= 70 ? '#ef4444' : simScore >= 40 ? '#f59e0b' : '#10b981';
    }
  }

  [claimAmt, covLimit, filingDelay, annPrem, numPol, unusualNarrative, earlyInception].forEach((el) => {
    if (el) el.addEventListener('input', calculateSimulation);
  });
  calculateSimulation();
}

// ─── UTILITY HELPERS ─────────────────────────────────────────────────────────
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
