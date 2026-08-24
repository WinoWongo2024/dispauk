// DispaUK — Core frontend interactivity
// Public-facing JavaScript only.
// No authentication credentials, API keys or private endpoints
// should ever be placed in this file.

document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================================
     MOBILE NAVIGATION
     ========================================================== */

  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');

  if (toggle && nav) {

    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      toggle.classList.toggle('active', isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    const navLinks = nav.querySelectorAll('a');
    navLinks.forEach((link) => {
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


  /* ==========================================================
     PUBLIC STATUS VALUES
     ========================================================== */

  const stationEl = document.getElementById('station-count');
  const unitEl = document.getElementById('unit-count');

  /*
   * These remain deliberately blank until a legitimate
   * DispaUK data service is introduced.
   *
   * IMPORTANT:
   * Never place MissionChief credentials, session cookies,
   * API keys or private endpoints in frontend JavaScript.
   */

  if (stationEl) {
    stationEl.textContent = '—';
  }

  if (unitEl) {
    unitEl.textContent = '—';
  }


  /* ==========================================================
     YEAR HANDLING
     ========================================================== */

  const yearElements = document.querySelectorAll('[data-current-year]');
  const currentYear = new Date().getFullYear();

  yearElements.forEach((element) => {
    element.textContent = currentYear;
  });


  /* ==========================================================
     KEYBOARD ACCESSIBILITY
     ========================================================== */

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav && toggle) {
      nav.classList.remove('open');
      toggle.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    }
  });


  /* ==========================================================
     COOKIE CONSENT (GDPR-aligned, minimal)
     ========================================================== */

  const CONSENT_KEY = 'dispauk_cookie_consent';

  function getConsent() {
    try {
      return localStorage.getItem(CONSENT_KEY);
    } catch (e) {
      return null;
    }
  }

  function setConsent(value) {
    try {
      localStorage.setItem(CONSENT_KEY, value);
    } catch (e) {
      // localStorage may be blocked
    }
  }

  function hideBanner(banner) {
    if (!banner) return;
    banner.classList.remove('visible');
    setTimeout(() => {
      if (banner && banner.parentNode) {
        banner.parentNode.removeChild(banner);
      }
    }, 350);
  }

  function showCookieBanner() {
    if (getConsent() === 'accepted' || getConsent() === 'rejected') {
      return;
    }

    const banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie consent');
    banner.innerHTML = `
      <div class="container cookie-banner-inner">
        <p class="cookie-banner-text">
          We use essential cookies and local storage to remember your preferences.
          We do not currently use analytics or advertising cookies.
          See our <a href="/cookies/">Cookie Policy</a> and
          <a href="/privacy/">Privacy Policy</a>.
        </p>
        <div class="cookie-banner-actions">
          <button type="button" class="btn btn-outline" data-cookie-action="reject">
            Reject non-essential
          </button>
          <button type="button" class="btn btn-primary" data-cookie-action="accept">
            Accept
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    requestAnimationFrame(() => {
      banner.classList.add('visible');
    });

    banner.addEventListener('click', (event) => {
      const action = event.target.getAttribute('data-cookie-action');
      if (!action) return;

      if (action === 'accept') {
        setConsent('accepted');
      } else if (action === 'reject') {
        setConsent('rejected');
      }
      hideBanner(banner);
    });
  }

  setTimeout(showCookieBanner, 600);

});
