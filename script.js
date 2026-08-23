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


    // Close navigation after selecting a page on mobile.

    const navLinks = nav.querySelectorAll('a');

    navLinks.forEach((link) => {

      link.addEventListener('click', () => {

        nav.classList.remove('open');
        toggle.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');

      });

    });


    // Close navigation if the user clicks outside it.

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

  // Allows future pages to use:
  // <span data-current-year></span>

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

});