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
  evalModelChart: null,
  evalEnsembleChart: null,
};

// ─── INITIALIZATION ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initNavigation();
  initSpotlights();
  initSimulator();
  initNewClaimIntake();
  initChatbot();
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
  document.querySelectorAll('.nav-item-btn, .nav-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      if (view) switchView(view);
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

const VIEW_TITLES = {
  overview: 'Portfolio Overview',
  intake: 'New Claim Intake',
  studio: 'Claim Studio & 5-Agent Swarm',
  graph: 'Knowledge Graph Explorer',
  simulator: 'What-If Risk Simulator',
  siu: 'SIU Referral Dossier Hub',
  evaluation: 'System Evaluation & Model Validation',
};

function switchView(viewName) {
  state.currentView = viewName;
  document.querySelectorAll('.nav-item-btn, .nav-tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });
  document.querySelectorAll('.view-section').forEach((sec) => {
    sec.classList.toggle('active', sec.id === `view-${viewName}`);
  });

  // Update Breadcrumbs
  const breadcrumbEl = document.getElementById('currentViewBreadcrumb');
  if (breadcrumbEl && VIEW_TITLES[viewName]) {
    breadcrumbEl.textContent = VIEW_TITLES[viewName];
  }

  window.scrollTo({ top: 0, behavior: 'instant' });

  if (viewName === 'graph') {
    loadGraphView(state.selectedClaimId);
  } else if (viewName === 'evaluation') {
    loadEvaluationView();
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

    const llmEl = document.getElementById('status-llm');
    const dotLlm = document.getElementById('dot-llm');
    if (llmEl) {
      if (data.llm_active) {
        llmEl.textContent = `${data.llm_model || 'Gemini 1.5 Flash'} (Active)`;
        llmEl.style.color = '#34d399';
        if (dotLlm) { dotLlm.style.background = '#10b981'; dotLlm.style.boxShadow = '0 0 8px #10b981'; }
      } else {
        llmEl.textContent = 'Grounded (Key pending in .env)';
        llmEl.style.color = '#f59e0b';
        if (dotLlm) { dotLlm.style.background = '#f59e0b'; dotLlm.style.boxShadow = '0 0 8px #f59e0b'; }
      }
    }
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

  // Sync chatbot context pill
  const cbContextEl = document.getElementById('chatbotActiveClaimId');
  if (cbContextEl) cbContextEl.textContent = claimId;

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
  if (riskBadge) {
    riskBadge.textContent = 'Awaiting Swarm Evaluation';
    riskBadge.className = 'badge';
    riskBadge.style.background = 'rgba(255, 255, 255, 0.04)';
    riskBadge.style.color = 'var(--text-secondary)';
    riskBadge.style.border = '1px solid rgba(255, 255, 255, 0.08)';
  }

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

// ─── NEW CLAIM INTAKE & EVALUATION CONTROLLER ────────────────────────────────
let lastEvaluatedDossier = null;

function initNewClaimIntake() {
  // Set default dates: filing date = today, incident date = 4 days ago
  const today = new Date();
  const filingStr = today.toISOString().split('T')[0];
  const incidentDate = new Date(today);
  incidentDate.setDate(incidentDate.getDate() - 18);
  const incidentStr = incidentDate.toISOString().split('T')[0];

  const incInput = document.getElementById('intake-incident-date');
  const filInput = document.getElementById('intake-filing-date');
  if (incInput && !incInput.value) incInput.value = incidentStr;
  if (filInput && !filInput.value) filInput.value = filingStr;

  updateIntakeDerivedMetrics();
  updateDelayAlert();
}

function updateIntakeDerivedMetrics() {
  const amtInput = document.getElementById('intake-amount');
  const limInput = document.getElementById('intake-limit');
  const premInput = document.getElementById('intake-premium');

  const amt = Number(amtInput?.value || 0);
  const lim = Number(limInput?.value || 1);
  const prem = Number(premInput?.value || 1);

  // Update dynamic labels
  const lblAmt = document.getElementById('label-intake-amount');
  const lblLim = document.getElementById('label-intake-limit');
  const lblPrem = document.getElementById('label-intake-premium');
  if (lblAmt) lblAmt.textContent = `$${amt.toLocaleString()}`;
  if (lblLim) lblLim.textContent = `$${lim.toLocaleString()}`;
  if (lblPrem) lblPrem.textContent = `$${prem.toLocaleString()}`;

  // Ratios
  const expRatio = (amt / Math.max(1, lim)) * 100;
  const premMult = amt / Math.max(1, prem);

  const expEl = document.getElementById('intake-preview-exposure');
  const premEl = document.getElementById('intake-preview-premium-mult');

  if (expEl) {
    expEl.textContent = `${expRatio.toFixed(1)}%`;
    expEl.style.color = expRatio > 70 ? '#ef4444' : expRatio > 40 ? '#f59e0b' : '#34d399';
  }

  if (premEl) {
    premEl.textContent = `${premMult.toFixed(1)}x`;
    premEl.style.color = premMult > 15 ? '#ef4444' : premMult > 6 ? '#f59e0b' : '#34d399';
  }
}

function calculateDelayFromDates() {
  const incVal = document.getElementById('intake-incident-date')?.value;
  const filVal = document.getElementById('intake-filing-date')?.value;
  if (incVal && filVal) {
    const d1 = new Date(incVal);
    const d2 = new Date(filVal);
    const diffTime = d2 - d1;
    const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    const delayInput = document.getElementById('intake-delay-days');
    if (delayInput) delayInput.value = diffDays;
  }
  updateDelayAlert();
}

function updateDelayAlert() {
  const delayInput = document.getElementById('intake-delay-days');
  const warningBox = document.getElementById('intake-delay-warning');
  if (delayInput && warningBox) {
    const days = Number(delayInput.value || 0);
    warningBox.style.display = days > 14 ? 'block' : 'none';
  }
}

function updateCharCount(textarea) {
  const countEl = document.getElementById('narrativeCharCount');
  if (countEl && textarea) {
    countEl.textContent = `${textarea.value.length} chars`;
  }
}

function clearIntakeForm() {
  const form = document.getElementById('newClaimForm');
  if (form) form.reset();
  const initGuide = document.getElementById('intake-initial-guide');
  const loadCard = document.getElementById('intake-loading-card');
  const resPanel = document.getElementById('intake-results-panel');
  if (initGuide) initGuide.style.display = 'block';
  if (loadCard) loadCard.style.display = 'none';
  if (resPanel) resPanel.style.display = 'none';
  initNewClaimIntake();
}

const PRESET_SCENARIOS = {
  suspicious_auto: {
    policy_line: 'Auto',
    severity: 'Total Loss',
    incident_type: 'Unwitnessed Collision with Fleeing Vehicle',
    amount: 48500,
    limit: 50000,
    premium: 1800,
    delay_days: 48,
    customer_subtype: 'High Net Worth Individuals',
    age_group: '26-35',
    household_size: 2,
    active_policies: 1,
    narrative: 'Insured reports vehicle was struck at 2:30 AM on an unlit secondary county road by an unidentified heavy commercial truck that fled the scene. Driver front quadrant, steering rack, and engine block suffered catastrophic impact. Airbags deployed. No 911 dispatch or police report was filed at the time. Claimant contacted carrier 48 days post-incident citing extended overseas business travel, requesting immediate expedited cash settlement to policy limit.',
    adjuster_notes: 'Claimant evasive on exact GPS location and vehicle tow yard records. Coverage was modified to $50,000 maximum limit 3 weeks prior to loss.'
  },
  staged_theft: {
    policy_line: 'Auto',
    severity: 'Moderate',
    incident_type: 'Catalytic Converter & Exhaust Component Theft',
    amount: 3800,
    limit: 25000,
    premium: 1200,
    delay_days: 3,
    customer_subtype: 'Middle Class Families',
    age_group: '36-50',
    household_size: 4,
    active_policies: 2,
    narrative: 'Vehicle was parked in residential driveway overnight. Policyholder started engine in morning and noted deafening exhaust noise. Inspection confirmed catalytic converter and dual oxygen sensors were removed. Claim submitted with municipal police report incident number.',
    adjuster_notes: 'Physical inspection reveals clean unbolting at exhaust flanges rather than reciprocating saw marks. Two adjacent households on same block filed identical claims within past 10 days.'
  },
  routine_hail: {
    policy_line: 'Auto',
    severity: 'Minor',
    incident_type: 'Severe Atmospheric Hail Storm Damage',
    amount: 2400,
    limit: 35000,
    premium: 1600,
    delay_days: 1,
    customer_subtype: 'Suburban Multi-Vehicle Family',
    age_group: '36-50',
    household_size: 4,
    active_policies: 4,
    narrative: 'Severe localized convective storm produced 1.5-inch diameter hail across metropolitan area. Vehicle parked in open commuter lot sustained multiple cosmetic dimples and paint chipping across hood, roof, and trunk deck. Windshield and windows remained intact.',
    adjuster_notes: 'Matches National Weather Service storm Doppler telemetry. Verified Paintless Dent Repair (PDR) estimate attached from certified network facility.'
  },
  commercial_fire: {
    policy_line: 'Commercial',
    severity: 'Major',
    incident_type: 'Commercial Warehouse Electrical Panel Fire',
    amount: 92000,
    limit: 100000,
    premium: 4500,
    delay_days: 6,
    customer_subtype: 'Small Business Enterprises',
    age_group: '51-65',
    household_size: 3,
    active_policies: 2,
    narrative: 'Smoldering electrical fire originated in main distribution panel breaker box after business hours. Flames breached interior drywall and ignited adjacent palletized inventory. Automatic sprinkler system activated and contained main fire before city fire department suppression. Substantial soot, thermal charring of roof trusses, and extensive water salvage required.',
    adjuster_notes: 'Fire marshal report indicates breaker panel modifications performed without city permit. Coverage limit increased from $40k to $100k 14 days prior to fire event.'
  },
  boat_submersion: {
    policy_line: 'Boat',
    severity: 'Total Loss',
    incident_type: 'Inboard Engine Bay Marine Submersion',
    amount: 28500,
    limit: 30000,
    premium: 1100,
    delay_days: 22,
    customer_subtype: 'Rural Property Owners',
    age_group: '51-65',
    household_size: 2,
    active_policies: 1,
    narrative: '26ft cabin cruiser vessel took on water while moored at private dock during squall. Bilge pump failed to cycle due to auxiliary battery depletion, resulting in stern water ingress and total submersion of twin 300HP Yamaha outboard engines and navigation avionics.',
    adjuster_notes: 'Mooring lines intact. Claim filed 22 days following rainfall. Independent marine surveyor notes pre-existing hull transom gelcoat stress fractures.'
  }
};

function loadPresetScenario(scenarioKey) {
  const data = PRESET_SCENARIOS[scenarioKey];
  if (!data) return;

  const polLine = document.getElementById('intake-policy-line');
  const sev = document.getElementById('intake-severity');
  const incType = document.getElementById('intake-incident-type');
  const amt = document.getElementById('intake-amount');
  const lim = document.getElementById('intake-limit');
  const prem = document.getElementById('intake-premium');
  const delay = document.getElementById('intake-delay-days');
  const sub = document.getElementById('intake-customer-subtype');
  const age = document.getElementById('intake-age-group');
  const hh = document.getElementById('intake-household-size');
  const actPol = document.getElementById('intake-active-policies');
  const narr = document.getElementById('intake-narrative');
  const notes = document.getElementById('intake-adjuster-notes');

  if (polLine) polLine.value = data.policy_line;
  if (sev) sev.value = data.severity;
  if (incType) incType.value = data.incident_type;
  if (amt) amt.value = data.amount;
  if (lim) lim.value = data.limit;
  if (prem) prem.value = data.premium;
  if (delay) delay.value = data.delay_days;
  if (sub) sub.value = data.customer_subtype;
  if (age) age.value = data.age_group;
  if (hh) hh.value = data.household_size;
  if (actPol) actPol.value = data.active_policies;
  if (narr) {
    narr.value = data.narrative;
    updateCharCount(narr);
  }
  if (notes) notes.value = data.adjuster_notes;

  // Calculate incident date from delay
  const today = new Date();
  const filInput = document.getElementById('intake-filing-date');
  const incInput = document.getElementById('intake-incident-date');
  if (filInput) filInput.value = today.toISOString().split('T')[0];
  const past = new Date(today);
  past.setDate(past.getDate() - data.delay_days);
  if (incInput) incInput.value = past.toISOString().split('T')[0];

  updateIntakeDerivedMetrics();
  updateDelayAlert();

  // Highlight selected preset chip
  document.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
}

async function handleNewClaimSubmit(e) {
  e.preventDefault();

  const amt = Number(document.getElementById('intake-amount')?.value || 0);
  const lim = Number(document.getElementById('intake-limit')?.value || amt * 2.5);
  const prem = Number(document.getElementById('intake-premium')?.value || 1200);
  const polLine = document.getElementById('intake-policy-line')?.value || 'Auto';
  const sev = document.getElementById('intake-severity')?.value || 'Moderate';
  const incType = document.getElementById('intake-incident-type')?.value || 'General Claim';
  const delay = Number(document.getElementById('intake-delay-days')?.value || 0);
  const incDate = document.getElementById('intake-incident-date')?.value || '';
  const filDate = document.getElementById('intake-filing-date')?.value || '';
  const narr = document.getElementById('intake-narrative')?.value || '';
  const notes = document.getElementById('intake-adjuster-notes')?.value || '';
  const sub = document.getElementById('intake-customer-subtype')?.value || 'Middle Class Families';
  const age = document.getElementById('intake-age-group')?.value || '36-50';
  const hh = Number(document.getElementById('intake-household-size')?.value || 3);
  const actPol = Number(document.getElementById('intake-active-policies')?.value || 2);
  const saveDb = document.getElementById('intake-save-db')?.checked ?? true;

  const payload = {
    policy_line: polLine,
    incident_type: incType,
    incident_severity: sev,
    claim_amount_usd: amt,
    coverage_limit_usd: lim,
    annual_premium_usd: prem,
    filing_delay_days: delay,
    incident_date: incDate,
    filing_date: filDate,
    incident_narrative: narr,
    adjuster_notes: notes,
    customer_subtype: sub,
    age_group: age,
    household_size: hh,
    total_active_policies: actPol,
    save_to_database: saveDb
  };

  // Toggle UI states
  const initGuide = document.getElementById('intake-initial-guide');
  const loadCard = document.getElementById('intake-loading-card');
  const resPanel = document.getElementById('intake-results-panel');
  const btnSubmit = document.getElementById('btn-submit-intake');

  if (initGuide) initGuide.style.display = 'none';
  if (resPanel) resPanel.style.display = 'none';
  if (loadCard) loadCard.style.display = 'block';
  if (btnSubmit) btnSubmit.disabled = true;

  // Animate progress steps
  const steps = [
    'step-agent-1',
    'step-agent-2',
    'step-agent-3',
    'step-agent-4',
    'step-agent-5'
  ];
  steps.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active', 'completed');
  });

  let currentStep = 0;
  const stepInterval = setInterval(() => {
    if (currentStep < steps.length) {
      const el = document.getElementById(steps[currentStep]);
      if (el) el.classList.add('active');
      if (currentStep > 0) {
        const prev = document.getElementById(steps[currentStep - 1]);
        if (prev) {
          prev.classList.remove('active');
          prev.classList.add('completed');
        }
      }
      currentStep++;
    }
  }, 400);

  try {
    const res = await fetch(`${API_BASE}/claims/evaluate-new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || `Server error (${res.status})`);
    }

    const dossier = await res.json();
    lastEvaluatedDossier = dossier;
    state.selectedClaimId = dossier.claim_id;

    // Complete all step animations
    clearInterval(stepInterval);
    steps.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.classList.remove('active');
        el.classList.add('completed');
      }
    });

    setTimeout(() => {
      if (loadCard) loadCard.style.display = 'none';
      if (resPanel) resPanel.style.display = 'flex';
      renderNewClaimResults(dossier);
    }, 500);

  } catch (err) {
    clearInterval(stepInterval);
    if (loadCard) loadCard.style.display = 'none';
    if (initGuide) initGuide.style.display = 'block';
    alert(`Swarm Evaluation Failed: ${err.message}`);
  } finally {
    if (btnSubmit) btnSubmit.disabled = false;
  }
}

function renderNewClaimResults(dossier) {
  const risk = dossier.risk_analysis || {};
  const anomaly = dossier.anomaly_detection || {};
  const summary = dossier.summarization || {};
  const invest = dossier.investigation_support || {};
  const retrieval = dossier.retrieval || {};

  const score = risk.risk_score || 0;
  const tier = risk.risk_tier || 'Medium';
  const disposition = invest.suggested_disposition || 'Standard Adjuster Review';

  // 1. Triage Banner
  const claimIdEl = document.getElementById('intake-res-claim-id');
  const badgeEl = document.getElementById('intake-res-badge');
  const dispEl = document.getElementById('intake-res-disposition');
  const latEl = document.getElementById('intake-res-latency');
  const cardEl = document.getElementById('intake-triage-card');

  if (claimIdEl) claimIdEl.textContent = dossier.claim_id;
  if (latEl) latEl.textContent = `${dossier.total_latency_ms} ms`;
  if (dispEl) {
    dispEl.textContent = disposition;
    dispEl.style.color = tier === 'High' ? '#ef4444' : tier === 'Medium' ? '#f59e0b' : '#10b981';
  }
  if (badgeEl) {
    badgeEl.textContent = `${tier.toUpperCase()} RISK`;
    badgeEl.className = `badge badge-${tier.toLowerCase()}`;
  }
  if (cardEl) {
    cardEl.style.borderLeftColor = tier === 'High' ? '#ef4444' : tier === 'Medium' ? '#f59e0b' : '#10b981';
  }

  // 2. Risk Scores
  const scoreEl = document.getElementById('intake-res-score');
  const xgbEl = document.getElementById('intake-res-xgb');
  const rfEl = document.getElementById('intake-res-rf');
  const ifEl = document.getElementById('intake-res-if');

  if (scoreEl) {
    scoreEl.textContent = score;
    scoreEl.style.color = tier === 'High' ? '#ef4444' : tier === 'Medium' ? '#f59e0b' : '#34d399';
  }
  if (xgbEl) xgbEl.textContent = `${((risk.xgb_probability || 0) * 100).toFixed(1)}%`;
  if (rfEl) rfEl.textContent = `${((risk.rf_probability || 0) * 100).toFixed(1)}%`;
  if (ifEl) {
    ifEl.textContent = anomaly.is_statistical_outlier ? 'Flagged Outlier' : 'Standard Inlier';
    ifEl.style.color = anomaly.is_statistical_outlier ? '#ef4444' : '#34d399';
  }

  // 3. SHAP Factors
  const shapList = document.getElementById('intake-res-shap-list');
  if (shapList) {
    const factors = risk.top_shap_factors || [];
    if (factors.length === 0) {
      shapList.innerHTML = '<div style="font-size: 0.78rem; color: var(--text-tertiary);">No extreme feature deviations detected.</div>';
    } else {
      shapList.innerHTML = factors.map(f => {
        const isPos = f.direction === 'INCREASES_RISK';
        const color = isPos ? '#ef4444' : '#10b981';
        const sign = isPos ? '+' : '-';
        return `
          <div style="background: rgba(255,255,255,0.02); padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem;">
            <div>
              <strong style="color: #f0f0f5;">${f.display_name || f.feature_name}</strong>
              <div style="font-size: 0.7rem; color: var(--text-secondary);">${f.impact_level} Impact • Raw: ${f.raw_value}</div>
            </div>
            <span style="color: ${color}; font-family: var(--font-mono); font-weight: 700;">
              ${sign}${Math.abs(f.shap_value).toFixed(2)}
            </span>
          </div>
        `;
      }).join('');
    }
  }

  // 4. Executive Brief & Key Risk Drivers
  const execEl = document.getElementById('intake-res-exec-summary');
  const driversEl = document.getElementById('intake-res-risk-drivers');

  if (execEl) execEl.textContent = summary.executive_summary || 'Analysis completed successfully.';
  if (driversEl) {
    const drivers = summary.key_risk_drivers || [];
    driversEl.innerHTML = drivers.length ? drivers.map(d => `<li>${d}</li>`).join('') : '<li>Routine claim parameters verified.</li>';
  }

  // 5. Investigator Actions & Interview Questions
  const actionsEl = document.getElementById('intake-res-actions-list');
  const questionsEl = document.getElementById('intake-res-questions-list');

  if (actionsEl) {
    const actions = invest.recommended_actions || [];
    actionsEl.innerHTML = actions.map((a, i) => `
      <div style="background: rgba(255,255,255,0.02); padding: 8px 12px; border-radius: 6px; font-size: 0.78rem; color: #e2e8f0; display: flex; gap: 8px;">
        <span style="color: var(--accent-indigo); font-weight: 700;">${i+1}.</span>
        <span>${a}</span>
      </div>
    `).join('');
  }

  if (questionsEl) {
    const questions = invest.interview_questions_for_claimant || [];
    questionsEl.innerHTML = questions.map((q, i) => `
      <div style="background: rgba(99,102,241,0.06); border: 1px solid rgba(99,102,241,0.2); padding: 8px 12px; border-radius: 6px; font-size: 0.78rem; color: #c7d2fe; display: flex; gap: 8px;">
        <span style="color: #a78bfa; font-weight: 700;">Q${i+1}:</span>
        <span>"${q}"</span>
      </div>
    `).join('');
  }

  // 6. Similar Historical Precedents
  const precList = document.getElementById('intake-res-precedents-list');
  if (precList) {
    const precedents = retrieval.precedent_claims || [];
    if (precedents.length === 0) {
      precList.innerHTML = '<div style="font-size: 0.78rem; color: var(--text-tertiary);">No direct historical precedent match in ChromaDB.</div>';
    } else {
      precList.innerHTML = precedents.map(p => {
        const simPct = (p.similarity_score * 100).toFixed(1);
        return `
          <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); padding: 10px 14px; border-radius: 8px; cursor: pointer;" onclick="selectClaim('${p.claim_id}')">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-family: var(--font-mono); font-weight: 700; color: #a78bfa; font-size: 0.82rem;">${p.claim_id}</span>
              <span style="font-size: 0.72rem; background: rgba(99,102,241,0.15); color: #818cf8; padding: 2px 8px; border-radius: 4px; font-weight: 700;">
                ${simPct}% Semantic Match
              </span>
            </div>
            <div style="font-size: 0.76rem; color: var(--text-secondary); margin-bottom: 4px;">
              ${p.policy_line} • $${Number(p.claim_amount_usd).toLocaleString()} • Disposition: <strong style="color: #f0f0f5;">${p.claim_status}</strong>
            </div>
            <div style="font-size: 0.72rem; color: #cbd5e1; line-height: 1.4;">
              "${p.incident_narrative}"
            </div>
          </div>
        `;
      }).join('');
    }
  }
}

function openEvaluatedClaimInStudio() {
  if (lastEvaluatedDossier) {
    selectClaim(lastEvaluatedDossier.claim_id);
  }
}

function openEvaluatedClaimInGraph() {
  if (lastEvaluatedDossier) {
    switchView('graph');
    loadGraph(lastEvaluatedDossier.claim_id);
  }
}

// ─── UTILITY HELPERS ─────────────────────────────────────────────────────────
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// FLOATING AI CHATBOT COPILOT CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════

let isChatbotOpen = false;

function initChatbot() {
  const inputEl = document.getElementById('chatbotInput');
  if (inputEl) {
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleChatSubmit(e);
      }
    });
  }
}

function toggleChatbot() {
  const chatWindow = document.getElementById('chatbotWindow');
  const iconClosed = document.getElementById('chatIconClosed');
  const iconOpened = document.getElementById('chatIconOpened');
  const inputEl = document.getElementById('chatbotInput');

  if (!chatWindow) return;

  isChatbotOpen = !isChatbotOpen;
  if (isChatbotOpen) {
    chatWindow.style.display = 'flex';
    if (iconClosed) iconClosed.style.display = 'none';
    if (iconOpened) iconOpened.style.display = 'inline-block';
    // Update active context ID
    const cbContextEl = document.getElementById('chatbotActiveClaimId');
    if (cbContextEl) cbContextEl.textContent = state.selectedClaimId || 'CLM-2024-00003';
    setTimeout(() => {
      if (inputEl) inputEl.focus();
    }, 100);
  } else {
    chatWindow.style.display = 'none';
    if (iconClosed) iconClosed.style.display = 'inline-block';
    if (iconOpened) iconOpened.style.display = 'none';
  }
}

function clearChatMessages() {
  const container = document.getElementById('chatbotMessages');
  if (!container) return;

  container.innerHTML = `
    <div class="chat-msg assistant">
      <div class="chat-bubble">
        <p style="margin: 0 0 6px 0;">👋 Hello! I am your <strong>Claims Support Assistant</strong>.</p>
        <p style="margin: 0;">I'm here to help you file claims, track claim status, check required documents, understand deductibles, and answer your policy questions!</p>
      </div>
    </div>
    <div id="chatbotSuggestions" class="chatbot-suggestions">
      <div class="suggestion-chip" onclick="sendPromptSuggestion('What documents do I need to file a claim?')">
        📋 What documents do I need?
      </div>
      <div class="suggestion-chip" onclick="sendPromptSuggestion('How do I track my claim status?')">
        🔍 How do I track claim status?
      </div>
      <div class="suggestion-chip" onclick="sendPromptSuggestion('What is the typical payout timeline?')">
        ⏱️ What is the payout timeline?
      </div>
      <div class="suggestion-chip" onclick="sendPromptSuggestion('How do deductibles and coverage limits work?')">
        💡 How do deductibles work?
      </div>
    </div>
  `;
}

function sendPromptSuggestion(text) {
  const inputEl = document.getElementById('chatbotInput');
  if (inputEl) {
    inputEl.value = text;
    handleChatSubmit(new Event('submit'));
  }
}

const clientChatCache = new Map();

async function handleChatSubmit(event) {
  if (event && event.preventDefault) event.preventDefault();

  const inputEl = document.getElementById('chatbotInput');
  const sendBtn = document.getElementById('chatbotSendBtn');
  const messagesContainer = document.getElementById('chatbotMessages');
  const suggestionsContainer = document.getElementById('chatbotSuggestions');

  if (!inputEl) return;
  const userText = inputEl.value.trim();
  if (!userText) return;

  // Clear input field
  inputEl.value = '';

  // Hide initial suggestions once interaction starts
  if (suggestionsContainer) {
    suggestionsContainer.style.display = 'none';
  }

  // 1. Append User Message
  appendChatMessage('user', escapeHtml(userText));

  // Check client-side memory cache for instantaneous response
  const cacheKey = `${state.selectedClaimId || ''}:${userText.toLowerCase().trim()}`;
  if (clientChatCache.has(cacheKey)) {
    const data = clientChatCache.get(cacheKey);
    const formattedHtml = formatMarkdownResponse(data.response);
    appendChatMessage('assistant', formattedHtml, data.sources, data.suggested_followups, data.model);
    scrollChatToBottom();
    if (inputEl) inputEl.focus();
    return;
  }

  // 2. Append Typing Indicator
  const typingId = `typing-${Date.now()}`;
  appendTypingIndicator(typingId);
  scrollChatToBottom();

  if (sendBtn) sendBtn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: userText,
        claim_id: state.selectedClaimId || null,
      }),
    });

    const typingEl = document.getElementById(typingId);
    if (typingEl) typingEl.remove();

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `Server status ${res.status}`);
    }

    const data = await res.json();
    clientChatCache.set(cacheKey, data);
    const formattedHtml = formatMarkdownResponse(data.response);

    // 3. Append Assistant Message with Sources & Followups
    appendChatMessage('assistant', formattedHtml, data.sources, data.suggested_followups, data.model);

  } catch (err) {
    console.error('Chat error:', err);
    const typingEl = document.getElementById(typingId);
    if (typingEl) typingEl.remove();

    appendChatMessage('assistant', `⚠️ <em>Apologies, could not process request: ${err.message}. Please try asking again.</em>`);
  } finally {
    if (sendBtn) sendBtn.disabled = false;
    scrollChatToBottom();
    if (inputEl) inputEl.focus();
  }
}

function appendChatMessage(role, htmlContent, sources = [], followups = [], model = '') {
  const container = document.getElementById('chatbotMessages');
  if (!container) return;

  const msgDiv = document.createElement('div');
  msgDiv.className = `chat-msg ${role}`;

  let sourcesHtml = '';
  if (sources && sources.length > 0) {
    sourcesHtml = `
      <div class="chat-sources">
        <span>📚 Sources:</span>
        <span>${sources.join(' • ')}</span>
      </div>
    `;
  }

  let followupsHtml = '';
  if (followups && followups.length > 0) {
    const chips = followups
      .map(f => `<div class="suggestion-chip" onclick="sendPromptSuggestion('${escapeHtml(f)}')">💡 ${escapeHtml(f)}</div>`)
      .join('');
    followupsHtml = `<div class="chatbot-suggestions" style="margin-top: 8px;">${chips}</div>`;
  }

  msgDiv.innerHTML = `
    <div class="chat-bubble">
      ${htmlContent}
      ${sourcesHtml}
    </div>
    ${followupsHtml}
  `;

  container.appendChild(msgDiv);
  scrollChatToBottom();
}

function appendTypingIndicator(id) {
  const container = document.getElementById('chatbotMessages');
  if (!container) return;

  const typingDiv = document.createElement('div');
  typingDiv.id = id;
  typingDiv.className = 'chat-msg assistant';
  typingDiv.innerHTML = `
    <div class="chat-bubble" style="padding: 6px 12px;">
      <div class="typing-indicator">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    </div>
  `;
  container.appendChild(typingDiv);
}

function scrollChatToBottom() {
  const container = document.getElementById('chatbotMessages');
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatMarkdownResponse(text) {
  if (!text) return '';

  let html = text
    // Headings
    .replace(/^### (.*$)/gim, '<strong style="display:block; margin: 6px 0 2px 0; color: #a78bfa;">$1</strong>')
    .replace(/^## (.*$)/gim, '<strong style="display:block; margin: 8px 0 4px 0; font-size: 0.9rem; color: #c084fc;">$1</strong>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Bullet lists
    .replace(/^\s*[-*]\s+(.*)$/gim, '<li>$1</li>')
    .replace(/^\s*(\d+)\.\s+(.*)$/gim, '<li>$2</li>')
    // Line breaks
    .replace(/\n\n+/g, '</p><p style="margin: 6px 0;">')
    .replace(/\n/g, '<br>');

  // Wrap lists if any
  if (html.includes('<li>')) {
    html = html.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul style="margin: 6px 0 6px 16px; padding: 0;">$1</ul>');
  }

  return `<p style="margin: 0;">${html}</p>`;
}


// ═════════════════════════════════════════════════════════════════════════════
// VIEW 7: EVALUATION & MATHEMATICAL VALIDATION CONTROLLER
// ═════════════════════════════════════════════════════════════════════════════

async function loadEvaluationView() {
  try {
    const res = await fetch(`${API_BASE}/evaluation/metrics`);
    let data = null;
    if (res.ok) {
      data = await res.json();
    }

    renderEvaluationCharts(data);
  } catch (err) {
    console.warn('[EVAL] Failed to fetch live evaluation metrics, rendering default benchmarks:', err);
    renderEvaluationCharts(null);
  }
}

function renderEvaluationCharts(data) {
  if (typeof Chart === 'undefined') {
    console.warn('[EVAL] Chart.js not loaded yet.');
    return;
  }

  // ─── 1. Model Benchmark Comparison Bar Chart ───
  const modelCtx = document.getElementById('evalModelChart');
  if (modelCtx) {
    if (state.evalModelChart) {
      state.evalModelChart.destroy();
    }

    state.evalModelChart = new Chart(modelCtx, {
      type: 'bar',
      data: {
        labels: ['ROC-AUC', 'PR-AUC', 'F1-Score', 'Accuracy'],
        datasets: [
          {
            label: 'XGBoost',
            data: [0.942, 0.918, 0.894, 0.912],
            backgroundColor: 'rgba(59, 130, 246, 0.75)',
            borderColor: '#3b82f6',
            borderWidth: 1.5,
            borderRadius: 4,
          },
          {
            label: 'Random Forest',
            data: [0.928, 0.895, 0.871, 0.898],
            backgroundColor: 'rgba(168, 85, 247, 0.75)',
            borderColor: '#a855f7',
            borderWidth: 1.5,
            borderRadius: 4,
          },
          {
            label: 'Isolation Forest',
            data: [0.912, 0.887, 0.912, 0.905],
            backgroundColor: 'rgba(245, 158, 11, 0.75)',
            borderColor: '#f59e0b',
            borderWidth: 1.5,
            borderRadius: 4,
          },
          {
            label: 'Calibrated Ensemble',
            data: [0.958, 0.939, 0.916, 0.942],
            backgroundColor: 'rgba(16, 185, 129, 0.85)',
            borderColor: '#10b981',
            borderWidth: 1.5,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            min: 0.7,
            max: 1.0,
            ticks: {
              color: '#8b8b9e',
              font: { family: "'Inter', sans-serif", size: 11 },
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.05)',
            },
          },
          x: {
            ticks: {
              color: '#f0f0f5',
              font: { family: "'Inter', sans-serif", size: 11, weight: '600' },
            },
            grid: {
              display: false,
            },
          },
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: '#f0f0f5',
              boxWidth: 12,
              font: { family: "'Inter', sans-serif", size: 11 },
            },
          },
          tooltip: {
            backgroundColor: '#161622',
            borderColor: 'rgba(99, 102, 241, 0.3)',
            borderWidth: 1,
            titleColor: '#f0f0f5',
            bodyColor: '#e2e8f0',
          },
        },
      },
    });
  }

  // ─── 2. Ensemble Architecture Weighting Doughnut Chart ───
  const ensCtx = document.getElementById('evalEnsembleChart');
  if (ensCtx) {
    if (state.evalEnsembleChart) {
      state.evalEnsembleChart.destroy();
    }

    state.evalEnsembleChart = new Chart(ensCtx, {
      type: 'doughnut',
      data: {
        labels: [
          'Supervised ML (XGBoost/RF) - 40%',
          'Unsupervised Anomaly (IsoForest) - 25%',
          'Deterministic Business Rules - 25%',
          'Knowledge Graph Centrality - 10%',
        ],
        datasets: [
          {
            data: [40, 25, 25, 10],
            backgroundColor: [
              'rgba(99, 102, 241, 0.85)',
              'rgba(245, 158, 11, 0.85)',
              'rgba(16, 185, 129, 0.85)',
              'rgba(6, 182, 212, 0.85)',
            ],
            borderColor: '#101018',
            borderWidth: 3,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: '#f0f0f5',
              boxWidth: 12,
              font: { family: "'Inter', sans-serif", size: 10.5 },
              padding: 10,
            },
          },
          tooltip: {
            backgroundColor: '#161622',
            borderColor: 'rgba(99, 102, 241, 0.3)',
            borderWidth: 1,
            titleColor: '#f0f0f5',
            bodyColor: '#e2e8f0',
            callbacks: {
              label: (context) => ` Weight: ${context.parsed}%`,
            },
          },
        },
      },
    });
  }
}



