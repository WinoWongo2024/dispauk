// DispaUK — Core frontend interactivity
// Public-facing JavaScript only.
// No authentication credentials or session cookies belong in this file.

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
      if (
        nav.classList.contains('open') &&
        !nav.contains(event.target) &&
        !toggle.contains(event.target)
      ) {
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

  const stationEl = document.getElementById('station-count');
  const unitEl = document.getElementById('unit-count');
  const stationsBody = document.querySelector('[data-stations-body]');
  const updatedEl = document.querySelector('[data-stats-updated]');

  async function loadStats() {
    try {
      const res = await fetch('/data/stats.json', { cache: 'no-cache' });
      if (!res.ok) return;
      const data = await res.json();

      if (stationEl && data.totals) {
        stationEl.textContent = String(data.totals.stations ?? '—');
      }
      if (unitEl && data.totals) {
        unitEl.textContent = String(data.totals.units ?? '—');
      }

      if (updatedEl && data.updatedAt) {
        const d = new Date(data.updatedAt);
        updatedEl.textContent = d.toLocaleString('en-GB', {
          dateStyle: 'medium',
          timeStyle: 'short',
          timeZone: 'Europe/London',
        });
      }

      if (stationsBody && Array.isArray(data.stations) && data.stations.length) {
        stationsBody.innerHTML = data.stations
          .slice(0, 50)
          .map((s) => {
            const name = escapeHtml(s.name || 'Unnamed');
            const type = escapeHtml(s.type || '—');
            const area = s.lat != null && s.lon != null
              ? `${Number(s.lat).toFixed(3)}, ${Number(s.lon).toFixed(3)}`
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
    } catch (err) {
      console.warn('Stats unavailable', err);
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  loadStats();

  const CONSENT_KEY = 'dispauk_cookie_consent';

  function getConsent() {
    try { return localStorage.getItem(CONSENT_KEY); }
    catch { return null; }
  }

  function setConsent(value) {
    try { localStorage.setItem(CONSENT_KEY, value); }
    catch { /* blocked */ }
  }

  function hideBanner(banner) {
    if (!banner) return;
    banner.classList.remove('visible');
    setTimeout(() => banner.remove(), 350);
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
          We use essential storage to remember your preferences.
          No analytics or advertising cookies.
          <a href="/cookies/">Cookie Policy</a> ·
          <a href="/privacy/">Privacy</a>
        </p>
        <div class="cookie-banner-actions">
          <button type="button" class="btn btn-ghost" data-cookie-action="reject">Reject</button>
          <button type="button" class="btn btn-primary" data-cookie-action="accept">Accept</button>
        </div>
      </div>
    `;
    document.body.appendChild(banner);
    requestAnimationFrame(() => banner.classList.add('visible'));

    banner.addEventListener('click', (e) => {
      const action = e.target.getAttribute('data-cookie-action');
      if (action === 'accept') setConsent('accepted');
      if (action === 'reject') setConsent('rejected');
      if (action) hideBanner(banner);
    });
  }

  setTimeout(showCookieBanner, 500);
});
