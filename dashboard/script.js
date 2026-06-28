'use strict';

// ─── Config ───────────────────────────────────────────────
const CONFIG = {
  apiUrl:       'http://10.192.53.130/data',
  interval:     5000,
  maxRetry:     999,
  retryDelay:   5000,
  useMockOnFail: true,
  mockData: {
    moisture:    45.2,
    temperature: 28.5,
    ec:          320,
    ph:          6.8,
    n:           45,
    p:           32,
    k:           89
  }
};

// ─── State ────────────────────────────────────────────────
let state = {
  data:       null,
  online:     false,
  isMock:     false,
  retryCount: 0,
  timer:      null,
};

// ─── DOM refs ─────────────────────────────────────────────
const $ = id => document.getElementById(id);

// ─── Fetch data ───────────────────────────────────────────
async function fetchData() {
  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(CONFIG.apiUrl, { signal: ctrl.signal });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    state.online = true;
    state.isMock  = false;
    state.retryCount = 0;
    updateUI(json);
    setStatus('online');
    hideBanners();
  } catch (err) {
    state.online = false;
    state.retryCount++;

    if (CONFIG.useMockOnFail) {
      state.isMock = true;
      // Add slight variation to mock data
      const mock = { ...CONFIG.mockData };
      mock.moisture    += (Math.random() - 0.5) * 4;
      mock.temperature += (Math.random() - 0.5) * 1;
      mock.ec          += Math.round((Math.random() - 0.5) * 20);
      mock.ph          += (Math.random() - 0.5) * 0.2;
      mock.n           += Math.round((Math.random() - 0.5) * 4);
      mock.p           += Math.round((Math.random() - 0.5) * 3);
      mock.k           += Math.round((Math.random() - 0.5) * 6);
      updateUI(mock);
    }

    setStatus('offline');
    showBanners();
  }
}

// ─── Update UI ────────────────────────────────────────────
function updateUI(d) {
  state.data = d;

  // Moisture
  const m = clamp(d.moisture, 0, 100);
  setValue('val-moisture', m.toFixed(1));
  animateBar('bar-moisture', m, 100);
  const barEl = $('bar-moisture');
  if (m < 30) {
    barEl.style.setProperty('--bar-color', '#f87171');
    barEl.style.background = 'linear-gradient(90deg,#ef4444,#f87171)';
    barEl.style.boxShadow  = '0 0 8px rgba(239,68,68,0.5)';
    setChip('status-moisture', 'alert', '⚠ ดินแห้ง — ควรรดน้ำ');
  } else if (m > 80) {
    barEl.style.background = 'linear-gradient(90deg,#3b82f6,#60a5fa)';
    barEl.style.boxShadow  = '0 0 8px rgba(59,130,246,0.5)';
    setChip('status-moisture', 'warn', '💧 ชื้นเกินไป');
  } else {
    barEl.style.background = 'linear-gradient(90deg,#22c55e,#4ade80)';
    barEl.style.boxShadow  = '0 0 8px rgba(34,197,94,0.5)';
    setChip('status-moisture', 'ok', '✓ ปกติ');
  }

  // Temperature
  setValue('val-temperature', (+d.temperature).toFixed(1));
  if (d.temperature > 35)      setChip('status-temperature', 'alert', '🌡 ร้อนมาก');
  else if (d.temperature < 15) setChip('status-temperature', 'warn', '❄ เย็นเกินไป');
  else                         setChip('status-temperature', 'ok', '✓ ปกติ');

  // EC
  setValue('val-ec', Math.round(d.ec));
  if (d.ec > 2000)       setChip('status-ec', 'alert', '⚠ เกลือสูง');
  else if (d.ec < 100)   setChip('status-ec', 'warn', '↓ EC ต่ำ');
  else                   setChip('status-ec', 'ok', '✓ ปกติ');

  // pH
  setValue('val-ph', (+d.ph).toFixed(1));
  if (d.ph < 5.5)       setChip('status-ph', 'alert', '⚠ กรดมาก');
  else if (d.ph > 7.5)  setChip('status-ph', 'warn', '⚠ ด่างมาก');
  else                  setChip('status-ph', 'ok', '✓ ปกติ');

  // NPK
  const nMax = 200, pMax = 200, kMax = 300;
  setValue('val-n', Math.round(d.n) + ' <small>mg/kg</small>');
  setValue('val-p', Math.round(d.p) + ' <small>mg/kg</small>');
  setValue('val-k', Math.round(d.k) + ' <small>mg/kg</small>');
  animateBar('bar-n', d.n, nMax);
  animateBar('bar-p', d.p, pMax);
  animateBar('bar-k', d.k, kMax);

  const npkIssues = [];
  if (d.n < 50)  npkIssues.push('N ต่ำ');
  if (d.p < 30)  npkIssues.push('P ต่ำ');
  if (d.k < 100) npkIssues.push('K ต่ำ');
  if (npkIssues.length > 0)
    setChip('status-npk', 'warn', '⚠ ' + npkIssues.join(' / '));
  else
    setChip('status-npk', 'ok', '✓ ปกติ');

  // Recommendations
  buildRecommendations(d);

  // Timestamp
  const now = new Date();
  $('last-update').textContent = now.toLocaleTimeString('th-TH');
}

// ─── Build recommendations ────────────────────────────────
function buildRecommendations(d) {
  const recs = [];

  if (d.moisture < 30) {
    recs.push({ type:'alert', icon:'💧', title:'ดินแห้ง — ควรรดน้ำ', desc:`ความชื้นปัจจุบัน ${d.moisture.toFixed(1)}% ต่ำกว่าเกณฑ์ ควรเปิดระบบรดน้ำทันที` });
  } else if (d.moisture > 80) {
    recs.push({ type:'warn', icon:'🌊', title:'ดินชื้นเกินไป', desc:`ความชื้น ${d.moisture.toFixed(1)}% สูงเกินไป อาจทำให้รากเน่าได้ ควรหยุดรดน้ำ` });
  } else {
    recs.push({ type:'ok', icon:'✅', title:'ความชื้นอยู่ในเกณฑ์ปกติ', desc:`ความชื้น ${d.moisture.toFixed(1)}% อยู่ในช่วงเหมาะสม (30–80%)` });
  }

  if (d.ph < 5.5) {
    recs.push({ type:'alert', icon:'🪨', title:'ดินเป็นกรดมาก', desc:`pH ${(+d.ph).toFixed(1)} ต่ำกว่าเกณฑ์ ควรใส่ปูนขาว (Lime) เพื่อปรับสภาพดิน` });
  } else if (d.ph > 7.5) {
    recs.push({ type:'warn', icon:'⚗️', title:'ดินเป็นด่าง', desc:`pH ${(+d.ph).toFixed(1)} สูงเกินไป ควรใส่กำมะถัน (Sulfur) เพื่อลด pH` });
  } else {
    recs.push({ type:'ok', icon:'✅', title:'pH อยู่ในเกณฑ์เหมาะสม', desc:`pH ${(+d.ph).toFixed(1)} อยู่ในช่วงเหมาะสม (5.5–7.5) สำหรับพืชส่วนใหญ่` });
  }

  if (d.n < 50) {
    recs.push({ type:'warn', icon:'🌿', title:'ไนโตรเจน (N) ต่ำ', desc:`N = ${Math.round(d.n)} mg/kg ควรใส่ปุ๋ยสูตรเน้น N เช่น 46-0-0 หรือ 21-0-0` });
  }

  if (d.p < 30) {
    recs.push({ type:'warn', icon:'🌱', title:'ฟอสฟอรัส (P) ต่ำ', desc:`P = ${Math.round(d.p)} mg/kg ควรใส่ปุ๋ยสูตรเน้น P เช่น 0-46-0 หรือหินฟอสเฟต` });
  }

  if (d.k < 100) {
    recs.push({ type:'warn', icon:'🍂', title:'โพแทสเซียม (K) ต่ำ', desc:`K = ${Math.round(d.k)} mg/kg ควรใส่ปุ๋ยสูตรเน้น K เช่น 0-0-60 หรือโพแทสเซียมคลอไรด์` });
  }

  if (d.ec > 2000) {
    recs.push({ type:'alert', icon:'⚡', title:'ดินมีเกลือสูง — ระวังการใส่ปุ๋ย', desc:`EC = ${Math.round(d.ec)} µS/cm สูงมาก ควรระวังการใส่ปุ๋ยเพิ่ม อาจทำให้พืชชะงักการเจริญเติบโต` });
  }

  if (d.temperature > 35) {
    recs.push({ type:'alert', icon:'🌡', title:'อุณหภูมิดินสูงเกินไป', desc:`${(+d.temperature).toFixed(1)}°C อาจส่งผลต่อการดูดซึมของราก ควรคลุมดินเพื่อลดความร้อน` });
  }

  const grid = $('rec-grid');
  grid.innerHTML = recs.map(r => `
    <div class="rec-item ${r.type}">
      <span class="rec-icon">${r.icon}</span>
      <div class="rec-content">
        <div class="rec-title">${r.title}</div>
        <div class="rec-desc">${r.desc}</div>
      </div>
    </div>
  `).join('');
}

// ─── Helpers ──────────────────────────────────────────────
function setValue(id, val) {
  const el = $(id);
  if (!el) return;
  const old = el.innerHTML;
  el.innerHTML = String(val);
  if (old !== String(val) && old !== '--') {
    el.classList.remove('flash');
    void el.offsetWidth; // reflow
    el.classList.add('flash');
  }
}

function animateBar(id, val, max) {
  const el = $(id);
  if (!el) return;
  const pct = clamp((val / max) * 100, 0, 100);
  el.style.width = pct + '%';
}

function setChip(id, type, text) {
  const el = $(id);
  if (!el) return;
  el.className = `card-status ${type}`;
  el.textContent = text;
}

function setStatus(mode) {
  const badge = $('status-badge');
  const text  = $('status-text');
  badge.className = `status-badge ${mode}`;
  if (mode === 'online') {
    text.textContent = 'ออนไลน์';
  } else if (mode === 'offline') {
    text.textContent = state.isMock ? 'ออฟไลน์ (Mock)' : 'ออฟไลน์';
  } else {
    text.textContent = 'กำลังเชื่อมต่อ...';
  }
}

function showBanners() {
  $('connecting-banner').classList.add('visible');
  $('retry-count').textContent = `Retry ครั้งที่ ${state.retryCount} · ทุก ${CONFIG.retryDelay/1000} วินาที`;
  if (state.isMock) $('mock-banner').classList.add('visible');
}

function hideBanners() {
  $('connecting-banner').classList.remove('visible');
  $('mock-banner').classList.remove('visible');
}

function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

// ─── Manual refresh ───────────────────────────────────────
async function manualRefresh() {
  const btn = $('btn-refresh');
  btn.classList.add('spinning');
  btn.disabled = true;
  await fetchData();
  setTimeout(() => {
    btn.classList.remove('spinning');
    btn.disabled = false;
  }, 600);
}

// ─── Auto-polling ─────────────────────────────────────────
function startPolling() {
  fetchData();
  state.timer = setInterval(fetchData, CONFIG.interval);
}

// ─── Init ─────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  try {
    const urlObj = new URL(CONFIG.apiUrl, window.location.href);
    $('ip-badge').textContent = urlObj.hostname || 'Local';
  } catch (e) {
    $('ip-badge').textContent = 'ESP32';
  }
  startPolling();
});

// Reconnect when tab becomes visible
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && !state.online) fetchData();
});
