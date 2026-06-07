/* ═══════════════════════════════════════════════
   PHISHGUARD — Threat Intelligence Dashboard
   script.js
   ═══════════════════════════════════════════════ */

'use strict';

// ── State ──────────────────────────────────────────────────────────────────
const state = {
  scanHistory: [],
  sessionScans: 0,
  totalPhishing: 0,
  totalLegit: 0,
  totalConf: 0
};

// ── DOM refs ───────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const emailInput   = $('emailInput');
const analyzeBtn   = $('analyzeBtn');
const clearBtn     = $('clearBtn');
const pasteBtn     = $('pasteBtn');
const sampleBtn    = $('sampleBtn');
const newScanBtn   = $('newScanBtn');
const clearHistBtn = $('clearHistoryBtn');

// ── Clock ──────────────────────────────────────────────────────────────────
(function initClock() {
  const pad = n => String(n).padStart(2, '0');
  const tick = () => {
    const d = new Date();
    $('live-clock').textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };
  tick(); setInterval(tick, 1000);
  $('session-id-val').textContent = Math.random().toString(36).substr(2, 6).toUpperCase();
})();

// ── Particle Canvas ────────────────────────────────────────────────────────
(function initParticles() {
  const canvas = $('particleCanvas');
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  const resize = () => {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', resize);
  resize();

  const Particle = () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    vx: (Math.random() - 0.5) * 0.25,
    vy: (Math.random() - 0.5) * 0.25,
    r: Math.random() * 1.2 + 0.3,
    a: Math.random() * 0.4 + 0.05
  });

  for (let i = 0; i < 80; i++) particles.push(Particle());

  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,212,255,${p.a})`;
      ctx.fill();
    });

    // Connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 90) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(0,212,255,${0.06 * (1 - dist/90)})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  };
  draw();
})();

// ── Gauge Tick Marks ───────────────────────────────────────────────────────
(function buildTicks() {
  const g = $('tickMarks');
  const cx = 110, cy = 115, r = 90;
  for (let i = 0; i <= 10; i++) {
    const angle = Math.PI + (i / 10) * Math.PI;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    const x2 = cx + (r - 8) * Math.cos(angle);
    const y2 = cy + (r - 8) * Math.sin(angle);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1); line.setAttribute('y1', y1);
    line.setAttribute('x2', x2); line.setAttribute('y2', y2);
    line.setAttribute('stroke', i % 5 === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)');
    line.setAttribute('stroke-width', i % 5 === 0 ? '1.5' : '1');
    g.appendChild(line);
  }
})();

// ── Tab Navigation ─────────────────────────────────────────────────────────
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    item.classList.add('active');
    const tab = item.dataset.tab;
    $(`tab-${tab}`).classList.add('active');
    if (tab === 'stats') updateStatsTab();
  });
});

// ── Char Counter ───────────────────────────────────────────────────────────
emailInput.addEventListener('input', () => {
  $('charCount').textContent = emailInput.value.length.toLocaleString();
});

// ── Clear / Paste / Sample ─────────────────────────────────────────────────
clearBtn.addEventListener('click', () => {
  emailInput.value = '';
  $('charCount').textContent = '0';
  emailInput.focus();
});

pasteBtn.addEventListener('click', async () => {
  try {
    const text = await navigator.clipboard.readText();
    emailInput.value = text;
    $('charCount').textContent = text.length.toLocaleString();
    showToast('Clipboard content pasted', 'success');
  } catch {
    showToast('Clipboard access denied', 'error');
  }
});

const sampleEmails = [
  `Subject: URGENT - Your account will be suspended!

Dear Customer,

We have detected unusual activity on your bank account. Your account will be SUSPENDED within 24 hours unless you verify your information immediately.

Click here to verify: http://secure-bank-login.suspicious-domain.xyz/verify

Please provide your:
- Full name
- Account number
- PIN
- Date of birth

Failure to respond will result in permanent account closure.

Best Regards,
Security Team`,

  `Subject: Q3 Team Sync Notes - Action Items

Hi team,

Great discussion today. Here's a quick recap of our action items from the call:

1. Sarah will finalize the budget report by Friday
2. James will follow up with the vendor on pricing
3. Everyone should review the attached proposal before next Monday

The next sync is scheduled for October 14th at 2pm. 

Let me know if I missed anything!

Best,
Michael`
];

let sampleIdx = 0;
sampleBtn.addEventListener('click', () => {
  const sample = sampleEmails[sampleIdx % sampleEmails.length];
  sampleIdx++;
  emailInput.value = sample;
  $('charCount').textContent = sample.length.toLocaleString();
  showToast('Sample email loaded', 'success');
});

// ── Gauge Update ───────────────────────────────────────────────────────────
function updateGauge(score, isPhishing) {
  const arc       = $('gaugeArc');
  const needle    = $('gaugeNeedle');
  const scoreEl   = $('gaugeScore');
  const labelEl   = $('gaugeLabel');
  const badgeEl   = $('threatBadge');

  // Arc: total path length ≈ 283 (half circle)
  const fill = (score / 100) * 283;
  arc.setAttribute('stroke-dasharray', `${fill} ${283 - fill}`);

  // Color
  let color, label;
  if (score < 30)       { color = 'var(--green)'; label = 'LOW THREAT'; }
  else if (score < 60)  { color = 'var(--amber)'; label = 'MODERATE'; }
  else if (score < 80)  { color = '#ff7300';       label = 'HIGH THREAT'; }
  else                  { color = 'var(--red)';    label = 'CRITICAL'; }

  arc.setAttribute('stroke', color);
  scoreEl.textContent     = score;
  scoreEl.style.color     = color;
  scoreEl.style.textShadow = `0 0 20px ${color}`;
  labelEl.textContent     = label;

  // Needle: -90deg = left, 90deg = right
  const deg = -90 + (score / 100) * 180;
  needle.style.transform  = `rotate(${deg}deg)`;

  badgeEl.textContent = isPhishing ? '⚠ THREAT DETECTED' : '✓ CLEAR';
  badgeEl.style.background = isPhishing ? 'rgba(255,56,85,0.15)' : 'rgba(0,255,157,0.1)';
  badgeEl.style.color      = isPhishing ? 'var(--red)' : 'var(--green)';
  badgeEl.style.borderColor = isPhishing ? 'rgba(255,56,85,0.3)' : 'rgba(0,255,157,0.2)';
}

// ── Confidence Meter Update ────────────────────────────────────────────────
function updateConfidence(pct, isPhishing) {
  const fill  = $('confFill');
  const badge = $('confBadge');
  const score = $('confScore');

  fill.style.width = `${pct}%`;

  const color = isPhishing ? 'var(--red)' : 'var(--green)';
  fill.style.background = isPhishing
    ? 'linear-gradient(90deg, var(--red), rgba(255,56,85,0.6))'
    : 'linear-gradient(90deg, var(--green), rgba(0,255,157,0.6))';
  fill.style.boxShadow = `0 0 10px ${isPhishing ? 'rgba(255,56,85,0.4)' : 'rgba(0,255,157,0.35)'}`;

  badge.textContent = `${pct.toFixed(1)}%`;
  badge.style.color = color;
  score.textContent = `${pct.toFixed(2)}%`;
}

// ── Scanning Animation ─────────────────────────────────────────────────────
async function animateScanSteps() {
  const steps = ['step1','step2','step3','step4'];
  for (let i = 0; i < steps.length; i++) {
    await delay(300 + i * 250);
    if (i > 0) {
      const prev = $(steps[i-1]);
      prev.classList.remove('active');
      prev.classList.add('done');
    }
    $(steps[i]).classList.add('active');
  }
  await delay(300);
  $(steps[steps.length - 1]).classList.remove('active');
  $(steps[steps.length - 1]).classList.add('done');
}

const delay = ms => new Promise(r => setTimeout(r, ms));

function resetSteps() {
  ['step1','step2','step3','step4'].forEach(id => {
    $(id).classList.remove('active', 'done');
  });
}

// ── Show Result ────────────────────────────────────────────────────────────
function showResult(data) {
  const isPhishing = data.is_phishing;
  const confidence = data.confidence;
  const label      = data.label;

  // Threat score: use confidence if phishing, inverse if legit
  const threatScore = isPhishing
    ? Math.round(confidence)
    : Math.round(100 - confidence);

  // Switch panels
  $('resultScanning').classList.add('hidden');
  $('resultOutput').classList.remove('hidden');

  // Verdict class
  const output = $('resultOutput');
  output.classList.toggle('verdict-phishing', isPhishing);
  output.classList.toggle('verdict-legit', !isPhishing);

  // Icon
  const iconWrap = $('verdictIconWrap');
  iconWrap.innerHTML = isPhishing
    ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 3L22 19H2L12 3z" stroke="var(--red)" stroke-width="1.5" fill="rgba(255,56,85,0.15)"/>
        <line x1="12" y1="10" x2="12" y2="14" stroke="var(--red)" stroke-width="2" stroke-linecap="round"/>
        <circle cx="12" cy="17" r="1" fill="var(--red)"/>
      </svg>`
    : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="var(--green)" stroke-width="1.5" fill="rgba(0,255,157,0.1)"/>
        <path d="M8 12l3 3 5-5" stroke="var(--green)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;

  // Label + sub
  $('verdictLabel').textContent = isPhishing ? '⚠ PHISHING DETECTED' : '✓ LEGITIMATE EMAIL';
  $('verdictSub').textContent   = isPhishing
    ? `High-confidence threat — exercise extreme caution`
    : `No phishing indicators detected by the classifier`;

  // Confidence bar
  const bar = $('confidenceBar');
  bar.style.width      = `${confidence}%`;
  bar.style.background = isPhishing
    ? 'linear-gradient(90deg, var(--red), #ff7300)'
    : 'linear-gradient(90deg, var(--green), rgba(0,255,157,0.7))';

  $('confidenceVal').textContent    = `${confidence.toFixed(1)}%`;
  $('confidenceVal').style.color    = isPhishing ? 'var(--red)' : 'var(--green)';

  // Risk pills
  const pills = document.querySelectorAll('.pill');
  pills.forEach(p => p.className = 'pill');
  if (threatScore < 25) {
    pills[0].classList.add('active-low');
  } else if (threatScore < 55) {
    pills[1].classList.add('active-medium');
  } else if (threatScore < 80) {
    pills[2].classList.add('active-high');
  } else {
    pills[3].classList.add('active-critical');
  }

  // Details
  const now   = new Date();
  const ts    = now.toLocaleTimeString();
  $('detailGrid').innerHTML = `
    <div class="detail-item">
      <span class="detail-key">SCAN TIME</span>
      <span class="detail-val">${ts}</span>
    </div>
    <div class="detail-item">
      <span class="detail-key">THREAT SCORE</span>
      <span class="detail-val" style="color:${isPhishing?'var(--red)':'var(--green)'};">${threatScore}/100</span>
    </div>
    <div class="detail-item">
      <span class="detail-key">CLASSIFIER</span>
      <span class="detail-val">LogReg v1.0</span>
    </div>
    <div class="detail-item">
      <span class="detail-key">PAYLOAD LEN</span>
      <span class="detail-val">${emailInput.value.length} chars</span>
    </div>
  `;

  // Gauge + confidence
  updateGauge(threatScore, isPhishing);
  updateConfidence(confidence, isPhishing);

  // Update state
  state.scanHistory.unshift({
    ts: now,
    label,
    isPhishing,
    confidence,
    threatScore,
    preview: emailInput.value.slice(0, 80).trim()
  });
  state.sessionScans++;
  if (isPhishing) state.totalPhishing++;
  else             state.totalLegit++;
  state.totalConf += confidence;

  $('footer-scans').textContent = `${state.sessionScans} SCAN${state.sessionScans !== 1 ? 'S' : ''} THIS SESSION`;
  updateHistoryTable();
}

// ── Analyze Flow ───────────────────────────────────────────────────────────
analyzeBtn.addEventListener('click', async () => {
  const text = emailInput.value.trim();
  if (!text) {
    showToast('Please enter email content first', 'error');
    emailInput.focus();
    return;
  }

  // Show scanning
  $('resultIdle').classList.add('hidden');
  $('resultOutput').classList.add('hidden');
  $('resultScanning').classList.remove('hidden');
  resetSteps();
  analyzeBtn.disabled = true;
  analyzeBtn.querySelector('.btn-text').textContent = 'SCANNING…';

  // Run step animation in parallel with fetch
  const stepAnim = animateScanSteps();

  try {
    const [res] = await Promise.all([
      fetch('/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: text })
      }),
      stepAnim
    ]);

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const data = await res.json();
    showResult(data);
  } catch (err) {
    $('resultScanning').classList.add('hidden');
    $('resultIdle').classList.remove('hidden');
    showToast(`Error: ${err.message}`, 'error');
    console.error(err);
  } finally {
    analyzeBtn.disabled = false;
    analyzeBtn.querySelector('.btn-text').textContent = 'INITIATE SCAN';
  }
});

// ── New Scan ───────────────────────────────────────────────────────────────
newScanBtn.addEventListener('click', () => {
  $('resultOutput').classList.add('hidden');
  $('resultIdle').classList.remove('hidden');
  emailInput.value = '';
  $('charCount').textContent = '0';
  emailInput.focus();
});

// ── History Table ──────────────────────────────────────────────────────────
function updateHistoryTable() {
  const body = $('historyBody');
  $('historyCount').textContent = `${state.scanHistory.length} RECORD${state.scanHistory.length !== 1 ? 'S' : ''}`;

  if (state.scanHistory.length === 0) {
    body.innerHTML = `<tr class="history-empty">
      <td colspan="6">
        <div class="empty-state">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="14" stroke="rgba(255,255,255,0.1)" stroke-width="1.5"/><path d="M10 16h12M16 10v12" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/></svg>
          <span>No scans yet. Analyze an email to begin.</span>
        </div>
      </td>
    </tr>`;
    return;
  }

  body.innerHTML = state.scanHistory.map((s, i) => `
    <tr>
      <td style="color:var(--text-muted)">${String(state.scanHistory.length - i).padStart(2,'0')}</td>
      <td style="font-family:var(--font-mono);font-size:10px;">${s.ts.toLocaleTimeString()}</td>
      <td>
        <span class="verdict-chip ${s.isPhishing ? 'phishing' : 'legit'}">
          ${s.isPhishing ? '⚠ PHISHING' : '✓ LEGIT'}
        </span>
      </td>
      <td><span class="threat-mini ${s.isPhishing ? 'high' : 'low'}">${s.confidence.toFixed(1)}%</span></td>
      <td><span class="threat-mini ${s.isPhishing ? 'high' : 'low'}">${s.threatScore}/100</span></td>
      <td class="history-preview" style="font-family:var(--font-mono);font-size:10px;">${escapeHtml(s.preview)}…</td>
    </tr>
  `).join('');
}

clearHistBtn.addEventListener('click', () => {
  state.scanHistory = [];
  updateHistoryTable();
  showToast('Scan history cleared', 'success');
});

// ── Stats Tab ──────────────────────────────────────────────────────────────
function updateStatsTab() {
  const total = state.totalPhishing + state.totalLegit;
  const avgConf = total > 0 ? (state.totalConf / total) : 0;

  $('statTotal').textContent   = total;
  $('statPhishing').textContent = state.totalPhishing;
  $('statLegit').textContent   = state.totalLegit;
  $('statAvgConf').textContent = total > 0 ? `${avgConf.toFixed(0)}%` : '--%';

  const pPct = total > 0 ? (state.totalPhishing / total) * 100 : 0;
  const lPct = total > 0 ? (state.totalLegit    / total) * 100 : 0;

  $('statPhishFill').style.width = `${pPct}%`;
  $('statLegitFill').style.width = `${lPct}%`;
  $('statConfFill').style.width  = `${avgConf}%`;

  // Donut
  const circ = 283;
  const pArc = (pPct / 100) * circ;
  const lArc = (lPct / 100) * circ;
  $('donutPhish').setAttribute('stroke-dasharray', `${pArc} ${circ - pArc}`);
  $('donutPhish').setAttribute('stroke-dashoffset', '0');
  $('donutLegit').setAttribute('stroke-dasharray', `${lArc} ${circ - lArc}`);
  $('donutLegit').setAttribute('stroke-dashoffset', `${-pArc}`);
  $('donutPct').textContent = total > 0 ? `${pPct.toFixed(0)}%` : '--%';
  $('lgPhish').textContent  = state.totalPhishing;
  $('lgLegit').textContent  = state.totalLegit;

  // Timeline bars
  const tbEl = $('timelineBars');
  if (state.scanHistory.length === 0) {
    tbEl.innerHTML = '<div class="timeline-empty">No scan data yet</div>';
    return;
  }
  const bars = state.scanHistory.slice().reverse().slice(-20);
  const maxScore = 100;
  tbEl.innerHTML = bars.map(s => {
    const h = Math.max(4, (s.threatScore / maxScore) * 72);
    return `<div class="tbar ${s.isPhishing ? 'phish' : 'legit'}" style="height:${h}px" title="${s.label} — ${s.threatScore}/100"></div>`;
  }).join('');
}

// ── Toast ──────────────────────────────────────────────────────────────────
function showToast(msg, type = '') {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}

// ── Utils ──────────────────────────────────────────────────────────────────
function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
