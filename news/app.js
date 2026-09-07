function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function mergeNews(fileItems, localItems) {
  const map = new Map();
  (fileItems || []).forEach(i => { if (i && i.id) map.set(i.id, i); });
  (localItems || []).forEach(i => {
    if (!i || !i.id) return;
    if (i._deleted) map.delete(i.id);
    else map.set(i.id, i);
  });
  return Array.from(map.values());
}

function inferAgencies(type) {
  const t = (type || '').toLowerCase();
  if (t.includes('fire') || t.includes('hazmat')) return ['Fire'];
  if (t.includes('medical')) return ['Ambulance'];
  if (t.includes('police')) return ['Police'];
  if (t.includes('water') || t.includes('rescue') || t.includes('structural')) return ['Fire'];
  if (t.includes('flood')) return ['Fire', 'Police'];
  if (t.includes('road') || t.includes('collision') || t.includes('rtc')) return ['Fire', 'Ambulance', 'Police'];
  return [];
}

function generateIncidentNumber(item) {
  const d = String(item.date || '').replace(/-/g, '') || '00000000';
  const hash = String(item.id || 'xxxx').replace(/\W/g, '').slice(-4).toUpperCase() || 'XXXX';
  return 'DU-' + d + '-' + hash;
}

function normalise(item) {
  if (!item) return null;
  const status = (item.status || '').toLowerCase() ||
    (item.severity === 'high' ? 'developing' : 'resolved');
  let county = item.county || '';
  if (!county && item.location) {
    const parts = String(item.location).split(',').map(s => s.trim());
    if (parts.length > 1) county = parts[parts.length - 1];
  }
  let agencies = [];
  if (item.agency) {
    agencies = Array.isArray(item.agency) ? item.agency : [item.agency];
  } else {
    agencies = inferAgencies(item.type);
  }
  agencies = agencies.filter(Boolean).map(String);
  return {
    ...item,
    status,
    county,
    agency: agencies,
    incidentNumber: item.incidentNumber || generateIncidentNumber(item),
    publishedAt: item.publishedAt || (item.date ? item.date + 'T12:00:00Z' : ''),
    updatedAt: item.updatedAt || item.publishedAt || item.date || '',
    timeline: Array.isArray(item.timeline) ? item.timeline : [],
    relatedIds: Array.isArray(item.relatedIds) ? item.relatedIds : [],
    units: Array.isArray(item.units) ? item.units : [],
    title: item.title || 'Untitled',
    type: item.type || 'Other',
  };
}

function formatWhen(isoOrDate) {
  if (!isoOrDate) return '';
  try {
    const d = new Date(isoOrDate);
    if (isNaN(d.getTime())) return String(isoOrDate);
    return d.toLocaleString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch (e) {
    return String(isoOrDate);
  }
}

function statusBadge(status) {
  const s = (status || 'developing').toLowerCase();
  const label = s.charAt(0).toUpperCase() + s.slice(1);
  return '<span class="status-badge status-' + esc(s) + '">' + esc(label) + '</span>';
}

function listThumb(item) {
  const img = item.image || '';
  const isHugeData = img.indexOf('data:') === 0 && img.length > 80000;
  if (img && !isHugeData) {
    return '<div class="thumb"><img src="' + esc(img) + '" alt="' + esc(item.imageAlt || item.title) + '" loading="lazy"></div>';
  }
  if (img && isHugeData) {
    return '<div class="thumb"><div class="thumb-placeholder">📷</div></div>';
  }
  return '<div class="thumb"><div class="thumb-placeholder">📰</div></div>';
}

let allItems = [];
let statusFilter = '';

function applyFilters() {
  try {
    const q = (document.getElementById('news-search').value || '').toLowerCase().trim();
    const county = document.getElementById('filter-county').value;
    const type = document.getElementById('filter-type').value;
    const agency = document.getElementById('filter-agency').value;

    let list = allItems.slice();
    if (statusFilter) list = list.filter(i => i.status === statusFilter);
    if (county) list = list.filter(i => (i.county || '').toLowerCase() === county.toLowerCase());
    if (type) list = list.filter(i => (i.type || '') === type);
    if (agency) list = list.filter(i => (i.agency || []).some(a => a === agency));
    if (q) {
      list = list.filter(i => {
        const blob = [
          i.title, i.summary, i.location, i.county, i.type,
          i.incidentNumber, (i.units || []).join(' '), (i.body || '').slice(0, 500)
        ].join(' ').toLowerCase();
        return blob.indexOf(q) !== -1;
      });
    }
    list.sort((a, b) => String(b.updatedAt || b.publishedAt || b.date)
      .localeCompare(String(a.updatedAt || a.publishedAt || a.date)));
    renderList(list);
  } catch (err) {
    console.error(err);
    const el = document.getElementById('news-list');
    if (el) el.innerHTML = '<p class="news-empty">Could not filter stories. Try a hard refresh.</p>';
  }
}

function renderList(items) {
  const el = document.getElementById('news-list');
  const countEl = document.getElementById('result-count');
  if (countEl) countEl.textContent = String(items.length);
  if (!items.length) {
    el.innerHTML = '<p class="news-empty">No stories match your filters.</p>';
    return;
  }
  el.innerHTML = items.map(item => {
    try {
      const when = formatWhen(item.publishedAt || item.date);
      return (
        '<a class="news-story-card" href="/news/story.html?id=' + encodeURIComponent(item.id) + '">' +
          listThumb(item) +
          '<div class="card-body">' +
            '<div class="news-meta-row">' +
              statusBadge(item.status) +
              (item.incidentNumber ? '<span class="mono news-inc">' + esc(item.incidentNumber) + '</span>' : '') +
            '</div>' +
            '<h2 class="news-card-title">' + esc(item.title) + '</h2>' +
            '<p class="news-card-meta">' +
              esc(item.type || '') +
              (item.location ? ' · ' + esc(item.location) : '') +
              (when ? ' · ' + esc(when) : '') +
            '</p>' +
          '</div>' +
        '</a>'
      );
    } catch (err) {
      console.error('card error', item && item.id, err);
      return '';
    }
  }).join('');
}

function populateFilterOptions(items) {
  const counties = new Set();
  const types = new Set();
  const agencies = new Set();
  items.forEach(i => {
    if (i.county) counties.add(i.county);
    if (i.type) types.add(i.type);
    (i.agency || []).forEach(a => agencies.add(a));
  });
  const fill = (id, values, allLabel) => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = '<option value="">' + allLabel + '</option>' +
      [...values].sort().map(v => '<option value="' + esc(v) + '">' + esc(v) + '</option>').join('');
    sel.value = current;
  };
  fill('filter-county', counties, 'All counties');
  fill('filter-type', types, 'All types');
  fill('filter-agency', agencies, 'All agencies');
}

function showLoadError(msg) {
  const el = document.getElementById('news-list');
  if (el) el.innerHTML = '<p class="news-empty">' + esc(msg) + '</p>';
  const countEl = document.getElementById('result-count');
  if (countEl) countEl.textContent = '0';
}

function stripHeavyImages(item) {
  if (!item || typeof item !== 'object') return item;
  const img = item.image || '';
  if (typeof img === 'string' && img.indexOf('data:') === 0 && img.length > 40000) {
    return { ...item, image: '', imageNote: item.imageNote || 'Photo omitted (too large for mobile).' };
  }
  return item;
}

function cleanLocalStorageImages() {
  try {
    const raw = localStorage.getItem('dispauk_news_local');
    if (!raw || raw.length < 50000) return;
    const items = JSON.parse(raw);
    if (!Array.isArray(items)) return;
    let changed = false;
    const cleaned = items.map(it => {
      const img = (it && it.image) || '';
      if (typeof img === 'string' && img.indexOf('data:') === 0 && img.length > 40000) {
        changed = true;
        return { ...it, image: '' };
      }
      return it;
    });
    if (changed) localStorage.setItem('dispauk_news_local', JSON.stringify(cleaned));
  } catch (e) { /* ignore */ }
}

document.addEventListener('DOMContentLoaded', async () => {
  cleanLocalStorageImages();

  let fileItems = [];
  try {
    const res = await fetch('/data/news.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    fileItems = (data.items || []).map(stripHeavyImages);
  } catch (e) {
    console.error('news.json', e);
    showLoadError('Could not load news feed. Check your connection and try again.');
    return;
  }

  let localItems = [];
  try {
    localItems = JSON.parse(localStorage.getItem('dispauk_news_local') || '[]');
    if (Array.isArray(localItems)) localItems = localItems.map(stripHeavyImages);
    else localItems = [];
  } catch (e) { localItems = []; }

  try {
    allItems = mergeNews(fileItems, localItems).map(stripHeavyImages).map(normalise).filter(Boolean);
    populateFilterOptions(allItems);
    applyFilters();
  } catch (e) {
    console.error(e);
    showLoadError('News feed loaded but could not be displayed. Try a hard refresh.');
    return;
  }

  document.getElementById('news-search').addEventListener('input', applyFilters);
  document.getElementById('filter-county').addEventListener('change', applyFilters);
  document.getElementById('filter-type').addEventListener('change', applyFilters);
  document.getElementById('filter-agency').addEventListener('change', applyFilters);

  document.querySelectorAll('.news-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.news-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      statusFilter = btn.getAttribute('data-status') || '';
      applyFilters();
    });
  });
});
