// DispaUK – basic interactivity

document.addEventListener('DOMContentLoaded', () => {
  // Mobile nav toggle
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      nav.classList.toggle('open');
      toggle.classList.toggle('active');
    });
  }

  // Placeholder counts – replace with real numbers later
  // or fetch from a JSON file / API proxy when you have one
  const stationEl = document.getElementById('station-count');
  const unitEl = document.getElementById('unit-count');

  if (stationEl) stationEl.textContent = '—';
  if (unitEl) unitEl.textContent = '—';

  // Example of how you might later load data:
  // fetch('data/stats.json')
  //   .then(r => r.json())
  //   .then(data => {
  //     stationEl.textContent = data.stations;
  //     unitEl.textContent = data.units;
  //   });
});
