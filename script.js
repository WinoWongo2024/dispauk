// DispaUK public frontend only. No credentials.

const PAGE_SIZE = 25;
let allStations = [];
let filtered = [];
let visibleCount = PAGE_SIZE;
let activeFilter = 'all';
let searchQuery = '';
let sortMode = 'name-asc';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmt(n) {
  if (n == null || n === '') return '—';
  const num = Number(n);
  if (Number.isNaN(num)) return String(n);
  return num.toLocaleString('en-GB');
}

function setText(sel, value) {
  document.querySelectorAll(sel).forEach((el) => {
    if (value != null && value !== '') el.textContent = String(value);
  });
}

function relativeTime(iso) {
  if (!iso) return { relative: '—', absolute: '', mins: null };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { relative: '—', absolute: '', mins: null };
  const mins = Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000));
  let relative;
  if (mins < 1) relative = 'just now';
  else if (mins < 60) relative = mins + ' min ago';
  else if (mins < 1440) relative = Math.floor(mins / 60) + ' h ago';
  else relative = Math.floor(mins / 1440) + ' d ago';
  const absolute = d.toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/London',
  }) + ' BST';
  return { relative, absolute, mins };
}

function freshnessFromAge(mins) {
  if (mins == null) return { key: 'unknown', label: 'Unknown', className: 'unknown' };
  if (mins < 15) return { key: 'live', label: 'LIVE', className: 'live' };
  if (mins < 30) return { key: 'delayed', label: 'SYNC DELAYED', className: 'delayed' };
  if (mins < 60) return { key: 'stale', label: 'STALE DATA', className: 'stale' };
  return { key: 'outdated', label: 'DATA OUTDATED', className: 'outdated' };
}

function serviceBucket(type) {
  const t = (type || '').toLowerCase();
  if (t.includes('fire')) return 'fire';
  if (t.includes('ambulance') || t.includes('hospital') || t.includes('hart')) return 'ambulance';
  if (t.includes('police') || t.includes('custody')) return 'police';
  return 'other';
}

function stationHref(s) {
  return '/stations/?id=' + encodeURIComponent(s.id);
}

function deltaBadge(delta) {
  if (delta == null || delta === 0) return '';
  const up = delta > 0;
  const cls = up ? 'delta-up' : 'delta-down';
  const arrow = up ? '▲' : '▼';
  return ' <span class="' + cls + '">' + arrow + ' ' + fmt(Math.abs(delta)) + '</span>';
}

function applyFilters() {
  const q = searchQuery.trim().toLowerCase();
  filtered = allStations.filter((s) => {
    const bucket = serviceBucket(s.type);
    if (activeFilter !== 'all' && bucket !== activeFilter) return false;
    if (!q) return true;
    const hay = (s.name || '') + ' ' + (s.type || '') + ' ' + (s.dcName || '');
    return hay.toLowerCase().includes(q);
  });

  filtered.sort((a, b) => {
    if (sortMode === 'name-desc') return String(b.name).localeCompare(String(a.name));
    if (sortMode === 'type') return String(a.type).localeCompare(String(b.type)) || String(a.name).localeCompare(String(b.name));
    if (sortMode === 'personnel-desc') return (b.personnel || 0) - (a.personnel || 0);
    return String(a.name).localeCompare(String(b.name));
  });

  visibleCount = PAGE_SIZE;
  renderStations();
}

function renderStations() {
  const slice = filtered.slice(0, visibleCount);
  setText('[data-result-count]', fmt(filtered.length));
  setText('[data-showing-count]', fmt(slice.length));

  const body = document.querySelector('[data-stations-body]');
  const cards = document.querySelector('[data-stations-cards]');
  const more = document.getElementById('load-more');

  if (body) {
    if (!slice.length) {
      body.innerHTML = '<tr><td colspan="5" class="empty">No stations match your filters.</td></tr>';
    } else {
      body.innerHTML = slice.map((s) =>
        '<tr>' +
          '<td><a href="' + stationHref(s) + '">' + escapeHtml(s.name || 'Unnamed') + '</a></td>' +
          '<td>' + escapeHtml(s.type || '—') + '</td>' +
          '<td>' + (s.dcId ? '<a href="/dispatch/?id=' + encodeURIComponent(s.dcId) + '">' + escapeHtml(s.dcName || 'DC') + '</a>' : '—') + '</td>' +
          '<td class="mono">' + fmt(s.personnel) + '</td>' +
          '<td><span class="status-pill">Active</span></td>' +
        '</tr>'
      ).join('');
    }
  }

  if (cards) {
    if (!slice.length) {
      cards.innerHTML = '<p class="empty-card">No stations match your filters.</p>';
    } else {
      cards.innerHTML = slice.map((s) =>
        '<a class="station-card" href="' + stationHref(s) + '">' +
          '<h3>' + escapeHtml(s.name || 'Unnamed') + '</h3>' +
          '<p>' + escapeHtml(s.type || '—') + (s.dcName ? ' · ' + escapeHtml(s.dcName) : '') + '</p>' +
          '<div class="station-card-meta">' +
            '<span class="status-pill">Active</span>' +
            '<span class="mono">' + fmt(s.personnel) + ' personnel</span>' +
          '</div></a>'
      ).join('');
    }
  }

  if (more) more.hidden = slice.length >= filtered.length;
}

function applyFreshness(updatedAt) {
  const rt = relativeTime(updatedAt);
  const f = freshnessFromAge(rt.mins);

  setText('[data-sync-relative]', rt.relative);
  setText('[data-sync-absolute]', rt.absolute);
  setText('[data-freshness-text]', f.label);

  const badge = document.querySelector('[data-freshness-badge]');
  if (badge) {
    badge.classList.remove('live', 'delayed', 'stale', 'outdated', 'unknown');
    badge.classList.add(f.className);
  }

  const syncLabel = f.key === 'live' ? 'Operational' : f.label;
  const apiLabel = rt.mins != null && rt.mins < 60 ? 'Operational' : (rt.mins != null ? 'Degraded' : 'Unknown');

  setText('[data-sync-label]', syncLabel);
  setText('[data-api-label]', apiLabel);

  document.querySelectorAll('[data-dot="sync"]').forEach((el) => {
    el.className = 'status-dot ' + (f.key === 'live' ? 'online' : f.key === 'delayed' ? 'warn' : 'bad');
  });
  document.querySelectorAll('[data-dot="api"]').forEach((el) => {
    el.className = 'status-dot ' + (apiLabel === 'Operational' ? 'online' : 'warn');
  });
}

async function loadCreditDeltas(currentCredits) {
  try {
    const res = await fetch('/data/history.json', { cache: 'no-cache' });
    if (!res.ok) return;
    const history = await res.json();
    if (!Array.isArray(history) || history.length < 2) return;
    const prev = history[history.length - 2];
    const cur = currentCredits || {};
    const dCur = (cur.credits_user_current != null && prev.creditsCurrent != null)
      ? cur.credits_user_current - prev.creditsCurrent : null;
    const dTot = (cur.credits_user_total != null && prev.creditsTotal != null)
      ? cur.credits_user_total - prev.creditsTotal : null;

    document.querySelectorAll('[data-credits-current]').forEach((el) => {
      if (dCur != null && dCur !== 0) {
        el.insertAdjacentHTML('beforeend', deltaBadge(dCur));
      }
    });
    document.querySelectorAll('[data-credits-total]').forEach((el) => {
      if (dTot != null && dTot !== 0) {
        el.insertAdjacentHTML('beforeend', deltaBadge(dTot));
      }
    });
  } catch (e) { /* ignore */ }
}

async function loadStats() {
  try {
    const res = await fetch('/data/stats.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error('stats unavailable');
    const data = await res.json();
    const t = data.totals || {};

    setText('#station-count', fmt(t.stations));
    setText('#unit-count', fmt(t.units));
    setText('#personnel-count', fmt(t.personnel));
    setText('[data-m-stations]', fmt(t.stations));
    setText('[data-m-units]', fmt(t.units));
    setText('[data-m-personnel]', fmt(t.personnel));
    setText('[data-dc-total]', fmt(t.dispatchCentres));

    applyFreshness(data.updatedAt);

    if (data.alliance) {
      setText('[data-alliance-users]', fmt(data.alliance.users));
      setText('[data-alliance-online]', fmt(data.alliance.online));
      setText('[data-alliance-online-2]', fmt(data.alliance.online));
      setText('[data-alliance-rank]', fmt(data.alliance.rank));
      setText('[data-alliance-rank-card]', fmt(data.alliance.rank));
    }

    if (data.credits) {
      const cur = data.credits.credits_user_current;
      const tot = data.credits.credits_user_total;
      setText('[data-credits-current]', fmt(cur));
      setText('[data-credits-current-2]', fmt(cur));
      setText('[data-credits-total]', fmt(tot));
      setText('[data-credits-total-2]', fmt(tot));
      loadCreditDeltas(data.credits);
    }

    const statusBox = document.querySelector('[data-vehicle-status]');
    if (statusBox && data.vehicleStatus) {
      statusBox.innerHTML = Object.entries(data.vehicleStatus)
        .map(([k, v]) => '<span class="chip"><span class="chip-k">S' + escapeHtml(k) + '</span><span class="chip-v">' + fmt(v) + '</span></span>')
        .join('') || '<span class="text-muted">None</span>';
    }

    const typeBox = document.querySelector('[data-station-types]');
    if (typeBox && data.stationsByType) {
      typeBox.innerHTML = Object.entries(data.stationsByType)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([k, v]) => '<div class="metric-row"><span>' + escapeHtml(k) + '</span><strong>' + fmt(v) + '</strong></div>')
        .join('');
    }

    const ep = document.querySelector('[data-endpoints]');
    if (ep && data.endpoints) {
      ep.innerHTML = Object.entries(data.endpoints)
        .map(([k, ok]) => '<span class="chip ' + (ok ? 'ok' : 'off') + '">' + escapeHtml(k) + '</span>')
        .join('');
    }

    allStations = Array.isArray(data.stations) ? data.stations : [];
    applyFilters();
  } catch (err) {
    console.warn(err);
    setText('[data-freshness-text]', 'DATA UNAVAILABLE');
    setText('[data-sync-label]', 'Unavailable');
    setText('[data-api-label]', 'Unavailable');
  }
}

function initNav() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');
  if (!toggle || !nav) return;
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }));
}

function initToolbar() {
  const search = document.getElementById('station-search');
  const sort = document.getElementById('station-sort');
  const more = document.getElementById('load-more');

  if (search) {
    search.addEventListener('input', () => {
      searchQuery = search.value;
      applyFilters();
    });
  }

  document.querySelectorAll('[data-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filter]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.getAttribute('data-filter') || 'all';
      applyFilters();
    });
  });

  if (sort) {
    sort.addEventListener('change', () => {
      sortMode = sort.value;
      applyFilters();
    });
  }

  if (more) {
    more.addEventListener('click', () => {
      visibleCount += PAGE_SIZE;
      renderStations();
    });
  }
}

function initCookies() {
  const KEY = 'dispauk_cookie_consent';
  let existing = null;
  try { existing = localStorage.getItem(KEY); } catch (e) { /* */ }
  if (existing === 'accepted' || existing === 'rejected') return;

  const banner = document.createElement('div');
  banner.className = 'cookie-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', 'Cookie consent');
  banner.innerHTML =
    '<div class="container cookie-banner-inner">' +
      '<p class="cookie-banner-text">Essential storage only. <a href="/cookies/">Cookies</a> · <a href="/privacy/">Privacy</a></p>' +
      '<div class="cookie-banner-actions">' +
        '<button type="button" class="btn btn-ghost" data-c="reject">Reject</button>' +
        '<button type="button" class="btn btn-primary" data-c="accept">Accept</button>' +
      '</div></div>';
  document.body.appendChild(banner);
  requestAnimationFrame(function () { banner.classList.add('visible'); });
  banner.addEventListener('click', function (e) {
    const c = e.target.getAttribute('data-c');
    if (!c) return;
    try { localStorage.setItem(KEY, c === 'accept' ? 'accepted' : 'rejected'); } catch (err) { /* */ }
    banner.classList.remove('visible');
    setTimeout(function () { banner.remove(); }, 300);
  });
}

document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('[data-current-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
  initNav();
  initToolbar();
  initCookies();
  loadStats();
});
