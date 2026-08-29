// DispaUK — public frontend only. No credentials in this file.

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      toggle.classList.toggle('active', isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        toggle.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('click', (event) => {
      if (nav.classList.contains('open') && !nav.contains(event.target) && !toggle.contains(event.target)) {
        nav.classList.remove('open');
        toggle.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  document.querySelectorAll('[data-current-year]').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav && toggle) {
      nav.classList.remove('open');
      toggle.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    }
  });

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function setText(sel, value) {
    const el = typeof sel === 'string' ? document.querySelector(sel) : sel;
    if (el && value != null && value !== '') el.textContent = String(value);
  }

  async function loadStats() {
    try {
      const res = await fetch('/data/stats.json', { cache: 'no-cache' });
      if (!res.ok) return;
      const data = await res.json();
      const t = data.totals || {};

      setText('#station-count', t.stations ?? '—');
      setText('#unit-count', t.units ?? '—');
      setText('#personnel-count', t.personnel ?? '—');

      if (data.updatedAt) {
        const d = new Date(data.updatedAt);
        setText('[data-stats-updated]', d.toLocaleString('en-GB', {
          dateStyle: 'medium',
          timeStyle: 'short',
          timeZone: 'Europe/London',
        }));
      }

      // Vehicle status chips
      const statusBox = document.querySelector('[data-vehicle-status]');
      if (statusBox && data.vehicleStatus && typeof data.vehicleStatus === 'object') {
        const entries = Object.entries(data.vehicleStatus);
        if (entries.length) {
          statusBox.innerHTML = entries
            .map(([k, v]) => `<span class="chip"><span class="chip-k">S${escapeHtml(k)}</span><span class="chip-v">${escapeHtml(v)}</span></span>`)
            .join('');
        }
      }

      // Station type breakdown
      const typeBox = document.querySelector('[data-station-types]');
      if (typeBox && data.stationsByType) {
        const entries = Object.entries(data.stationsByType).sort((a, b) => b[1] - a[1]);
        if (entries.length) {
          typeBox.innerHTML = entries
            .map(([k, v]) => `<div class="metric-row"><span>${escapeHtml(k)}</span><strong>${escapeHtml(v)}</strong></div>`)
            .join('');
        }
      }

      // Alliance
      if (data.alliance) {
        setText('[data-alliance-users]', data.alliance.users ?? '—');
        setText('[data-alliance-online]', data.alliance.online ?? '—');
        setText('[data-alliance-rank]', data.alliance.rank ?? '—');
      }

      // Stations table
      const stationsBody = document.querySelector('[data-stations-body]');
      if (stationsBody && Array.isArray(data.stations) && data.stations.length) {
        stationsBody.innerHTML = data.stations
          .slice(0, 40)
          .map((s) => {
            const name = escapeHtml(s.name || 'Unnamed');
            const type = escapeHtml(s.type || '—');
            const area = s.lat != null && s.lon != null
              ? `${Number(s.lat).toFixed(2)}, ${Number(s.lon).toFixed(2)}`
              : '—';
            return `<tr>
              <td>${name}</td>
              <td>${type}</td>
              <td class="mono">${area}</td>
              <td><span class="status-pill">Active</span></td>
            </tr>`;
          })
          .join('');
      }

      // Endpoint badges
      const ep = document.querySelector('[data-endpoints]');
      if (ep && data.endpoints) {
        ep.innerHTML = Object.entries(data.endpoints)
          .map(([k, ok]) => `<span class="chip ${ok ? 'ok' : 'off'}">${escapeHtml(k)}</span>`)
          .join('');
      }
    } catch (err) {
      console.warn('Stats unavailable', err);
    }
  }

  loadStats();

  // Cookie consent
  const CONSENT_KEY = 'dispauk_cookie_consent';
  function getConsent() {
    try { return localStorage.getItem(CONSENT_KEY); } catch { return null; }
  }
  function setConsent(value) {
    try { localStorage.setItem(CONSENT_KEY, value); } catch { /* */ }
  }
  function showCookieBanner() {
    if (getConsent() === 'accepted' || getConsent() === 'rejected') return;
    const banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie consent');
    banner.innerHTML = `
      <div class="container cookie-banner-inner">
        <p class="cookie-banner-text">
          Essential storage only — no analytics.
          <a href="/cookies/">Cookies</a> · <a href="/privacy/">Privacy</a>
        </p>
        <div class="cookie-banner-actions">
          <button type="button" class="btn btn-ghost" data-cookie-action="reject">Reject</button>
          <button type="button" class="btn btn-primary" data-cookie-action="accept">Accept</button>
        </div>
      </div>`;
    document.body.appendChild(banner);
    requestAnimationFrame(() => banner.classList.add('visible'));
    banner.addEventListener('click', (e) => {
      const action = e.target.getAttribute('data-cookie-action');
      if (action === 'accept') setConsent('accepted');
      if (action === 'reject') setConsent('rejected');
      if (action) {
        banner.classList.remove('visible');
        setTimeout(() => banner.remove(), 350);
      }
    });
  }
  setTimeout(showCookieBanner, 400);
});
