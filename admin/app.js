const PASS_HASH = 'e254e8dd836b604a479a33496734f55e9507dc30939784566772e4c82f0bab7e';
const SESSION_KEY = 'dispauk_admin_session';
const LOCAL_KEY = 'dispauk_news_local';
const GH_SETTINGS_KEY = 'dispauk_gh_settings';
const GH_TOKEN_KEY = 'dispauk_gh_token';

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function loadLocal() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]'); }
  catch (e) { return []; }
}
function saveLocal(items) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
}

function loadGhSettings() {
  try { return JSON.parse(localStorage.getItem(GH_SETTINGS_KEY) || '{}'); }
  catch (e) { return {}; }
}
function saveGhSettings() {
  const s = {
    owner: document.getElementById('gh-owner').value.trim() || 'WinoWongo2024',
    repo: document.getElementById('gh-repo').value.trim() || 'dispauk',
    branch: document.getElementById('gh-branch').value.trim() || 'main',
    path: document.getElementById('gh-path').value.trim() || 'data/news.json',
    remember: document.getElementById('gh-remember').checked,
  };
  localStorage.setItem(GH_SETTINGS_KEY, JSON.stringify(s));
  const token = document.getElementById('gh-token').value.trim();
  if (s.remember && token) localStorage.setItem(GH_TOKEN_KEY, token);
  else {
    localStorage.removeItem(GH_TOKEN_KEY);
    if (token) sessionStorage.setItem(GH_TOKEN_KEY, token);
    else sessionStorage.removeItem(GH_TOKEN_KEY);
  }
}
function applyGhSettings() {
  const s = loadGhSettings();
  if (s.owner) document.getElementById('gh-owner').value = s.owner;
  if (s.repo) document.getElementById('gh-repo').value = s.repo;
  if (s.branch) document.getElementById('gh-branch').value = s.branch;
  if (s.path) document.getElementById('gh-path').value = s.path;
  document.getElementById('gh-remember').checked = !!s.remember;
  document.getElementById('gh-token').value =
    (s.remember ? localStorage.getItem(GH_TOKEN_KEY) : null)
    || sessionStorage.getItem(GH_TOKEN_KEY)
    || localStorage.getItem(GH_TOKEN_KEY)
    || '';
}

function setPublishStatus(kind, msg) {
  const el = document.getElementById('publish-status');
  el.className = 'publish-status show ' + kind;
  el.textContent = msg;
}

function showAdmin(ok) {
  document.getElementById('login-view').hidden = ok;
  document.getElementById('admin-view').hidden = !ok;
  if (ok) { applyGhSettings(); renderList(); }
}

function renderList() {
  const items = loadLocal().filter(i => !i._deleted);
  const el = document.getElementById('story-list');
  if (!items.length) {
    el.innerHTML = '<p class="text-muted">No local drafts yet.</p>';
    return;
  }
  el.innerHTML = items.map(i =>
    '<div class="story-row"><div><strong>' + (i.title || 'Untitled') + '</strong><br>' +
    '<span class="text-muted">' + (i.date || '') + ' · ' + (i.status || '') + ' · ' + (i.type || '') +
    (i.incidentNumber ? ' · ' + i.incidentNumber : '') + '</span></div>' +
    '<div style="display:flex;gap:6px">' +
      '<button type="button" class="btn btn-outline" data-edit="' + i.id + '">Edit</button>' +
      '<button type="button" class="btn btn-ghost" data-del="' + i.id + '">Delete</button>' +
    '</div></div>'
  ).join('');
}

function clearTimeline() {
  document.getElementById('timeline-editor').innerHTML = '';
  addTimelineRow();
}
function addTimelineRow(time, event) {
  const ed = document.getElementById('timeline-editor');
  const row = document.createElement('div');
  row.className = 'tl-row';
  row.innerHTML =
    '<input class="tl-time" placeholder="14:02" value="' + (time || '').replace(/"/g, '&quot;') + '">' +
    '<input class="tl-event" placeholder="Call received" value="' + (event || '').replace(/"/g, '&quot;') + '">' +
    '<button type="button" class="btn btn-ghost tl-remove" title="Remove">✕</button>';
  ed.appendChild(row);
  row.querySelector('.tl-remove').addEventListener('click', () => {
    if (ed.children.length > 1) row.remove();
    else { row.querySelector('.tl-time').value = ''; row.querySelector('.tl-event').value = ''; }
  });
}
function readTimeline() {
  return [...document.querySelectorAll('#timeline-editor .tl-row')].map(row => ({
    time: row.querySelector('.tl-time').value.trim(),
    event: row.querySelector('.tl-event').value.trim(),
  })).filter(t => t.time || t.event);
}

function clearForm() {
  document.getElementById('f-id').value = '';
  document.getElementById('f-published-at').value = '';
  document.getElementById('f-versions').value = '[]';
  document.getElementById('f-title').value = '';
  document.getElementById('f-type').selectedIndex = 0;
  document.getElementById('f-status').value = 'developing';
  document.getElementById('f-severity').value = 'medium';
  document.getElementById('f-date').value = new Date().toISOString().slice(0, 10);
  document.getElementById('f-county').value = '';
  document.getElementById('f-location').value = '';
  document.getElementById('f-lat').value = '';
  document.getElementById('f-lng').value = '';
  document.getElementById('f-agency').value = '';
  document.getElementById('f-incident').value = '';
  document.getElementById('f-summary').value = '';
  document.getElementById('f-body').value = '';
  document.getElementById('f-units').value = '';
  document.getElementById('f-related').value = '';
  document.getElementById('f-author').value = 'DispaUK Control';
  document.getElementById('f-image-data').value = '';
  document.getElementById('f-image').value = '';
  document.getElementById('f-version-note').value = '';
  const prev = document.getElementById('f-preview');
  prev.src = ''; prev.style.display = 'none';
  clearTimeline();
  document.getElementById('edit-version-note').hidden = true;
  document.getElementById('label-version-note').hidden = true;
  document.getElementById('f-version-note').hidden = true;
}

function fillForm(item) {
  document.getElementById('f-id').value = item.id || '';
  document.getElementById('f-published-at').value = item.publishedAt || '';
  document.getElementById('f-versions').value = JSON.stringify(item.versions || []);
  document.getElementById('f-title').value = item.title || '';
  document.getElementById('f-type').value = item.type || 'Other';
  document.getElementById('f-status').value = item.status || 'developing';
  document.getElementById('f-severity').value = item.severity || 'medium';
  document.getElementById('f-date').value = item.date || '';
  document.getElementById('f-county').value = item.county || '';
  document.getElementById('f-location').value = item.location || '';
  document.getElementById('f-lat').value = item.lat != null ? item.lat : '';
  document.getElementById('f-lng').value = item.lng != null ? item.lng : '';
  document.getElementById('f-agency').value = Array.isArray(item.agency) ? item.agency.join(', ') : (item.agency || '');
  document.getElementById('f-incident').value = item.incidentNumber || '';
  document.getElementById('f-summary').value = item.summary || '';
  document.getElementById('f-body').value = item.body || '';
  document.getElementById('f-units').value = (item.units || []).join(', ');
  document.getElementById('f-related').value = (item.relatedIds || []).join(', ');
  document.getElementById('f-author').value = item.author || 'DispaUK Control';
  document.getElementById('f-image-data').value = item.image || '';
  const prev = document.getElementById('f-preview');
  if (item.image) { prev.src = item.image; prev.style.display = 'block'; }
  else { prev.src = ''; prev.style.display = 'none'; }
  const ed = document.getElementById('timeline-editor');
  ed.innerHTML = '';
  const tl = item.timeline || [];
  if (tl.length) tl.forEach(t => addTimelineRow(t.time, t.event));
  else addTimelineRow();
  const isEdit = !!item.id;
  document.getElementById('edit-version-note').hidden = !isEdit;
  document.getElementById('label-version-note').hidden = !isEdit;
  document.getElementById('f-version-note').hidden = !isEdit;
  document.getElementById('f-version-note').value = '';
}

function generateIncidentNumber(dateStr, id) {
  const d = (dateStr || '').replace(/-/g, '') || new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const hash = String(id || Date.now()).replace(/\W/g, '').slice(-4).toUpperCase();
  return 'DU-' + d + '-' + hash;
}

function buildStoryFromForm() {
  const title = document.getElementById('f-title').value.trim();
  if (!title) return null;
  let id = document.getElementById('f-id').value.trim();
  const isEdit = !!id;
  if (!id) id = 'local-' + Date.now();
  const nowIso = new Date().toISOString();
  const date = document.getElementById('f-date').value || nowIso.slice(0, 10);
  const units = document.getElementById('f-units').value.split(',').map(s => s.trim()).filter(Boolean);
  const agency = document.getElementById('f-agency').value.split(',').map(s => s.trim()).filter(Boolean);
  const relatedIds = document.getElementById('f-related').value.split(',').map(s => s.trim()).filter(Boolean);
  const latRaw = document.getElementById('f-lat').value.trim();
  const lngRaw = document.getElementById('f-lng').value.trim();
  let versions = [];
  try { versions = JSON.parse(document.getElementById('f-versions').value || '[]'); } catch (e) { versions = []; }
  if (isEdit) {
    const prevLocal = loadLocal().find(i => i.id === id);
    if (prevLocal) {
      versions.push({
        at: prevLocal.updatedAt || prevLocal.publishedAt || nowIso,
        note: document.getElementById('f-version-note').value.trim() || 'Updated report',
        summary: prevLocal.summary || '', body: prevLocal.body || '',
        status: prevLocal.status || '', author: prevLocal.author || '',
      });
    }
  }
  let publishedAt = document.getElementById('f-published-at').value;
  if (!publishedAt) publishedAt = nowIso;
  let incidentNumber = document.getElementById('f-incident').value.trim();
  if (!incidentNumber) incidentNumber = generateIncidentNumber(date, id);
  return {
    id, incidentNumber, date, publishedAt, updatedAt: nowIso,
    status: document.getElementById('f-status').value, title,
    type: document.getElementById('f-type').value,
    severity: document.getElementById('f-severity').value,
    county: document.getElementById('f-county').value.trim(),
    location: document.getElementById('f-location').value.trim(),
    lat: latRaw === '' ? undefined : Number(latRaw),
    lng: lngRaw === '' ? undefined : Number(lngRaw),
    agency, summary: document.getElementById('f-summary').value.trim(),
    body: document.getElementById('f-body').value.trim(), units,
    timeline: readTimeline(), relatedIds, versions,
    author: document.getElementById('f-author').value.trim() || 'DispaUK Control',
    image: document.getElementById('f-image-data').value || '', imageAlt: title,
  };
}

function saveDraft(item) {
  const items = loadLocal().filter(i => i.id !== item.id);
  items.push(item);
  saveLocal(items);
  renderList();
}

async function mergeNewsPayload() {
  let fileItems = [];
  try {
    const res = await fetch('/data/news.json', { cache: 'no-cache' });
    if (res.ok) { const data = await res.json(); fileItems = data.items || []; }
  } catch (e) {}
  const local = loadLocal();
  const map = new Map();
  fileItems.forEach(i => map.set(i.id, i));
  local.forEach(i => { if (i._deleted) map.delete(i.id); else map.set(i.id, i); });
  const items = Array.from(map.values()).sort((a, b) =>
    String(b.updatedAt || b.date).localeCompare(String(a.updatedAt || a.date)));
  return { updatedAt: new Date().toISOString(), items };
}

function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  bytes.forEach(b => { binary += String.fromCharCode(b); });
  return btoa(binary);
}

async function publishToGitHub() {
  saveGhSettings();
  const owner = document.getElementById('gh-owner').value.trim();
  const repo = document.getElementById('gh-repo').value.trim();
  const branch = document.getElementById('gh-branch').value.trim() || 'main';
  const path = document.getElementById('gh-path').value.trim() || 'data/news.json';
  const token = document.getElementById('gh-token').value.trim();
  if (!token) { setPublishStatus('err', 'Add a GitHub token first (Contents: Read and write).'); return false; }
  if (!owner || !repo) { setPublishStatus('err', 'Owner and repo are required.'); return false; }

  setPublishStatus('busy', 'Publishing to GitHub…');
  const payload = await mergeNewsPayload();
  const contentB64 = utf8ToBase64(JSON.stringify(payload, null, 2));
  const apiBase = 'https://api.github.com/repos/' + encodeURIComponent(owner) + '/' + encodeURIComponent(repo) +
    '/contents/' + path.split('/').map(encodeURIComponent).join('/');
  const headers = {
    'Accept': 'application/vnd.github+json',
    'Authorization': 'Bearer ' + token,
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };

  let sha;
  try {
    const getRes = await fetch(apiBase + '?ref=' + encodeURIComponent(branch), { headers });
    if (getRes.status === 200) { const meta = await getRes.json(); sha = meta.sha; }
    else if (getRes.status !== 404) {
      const err = await getRes.json().catch(() => ({}));
      setPublishStatus('err', 'Could not read file: ' + (err.message || getRes.status));
      return false;
    }
  } catch (e) {
    setPublishStatus('err', 'Network error reading file: ' + e.message);
    return false;
  }

  const putBody = {
    message: 'News desk: publish ' + payload.items.length + ' stories (' + new Date().toISOString() + ')',
    content: contentB64, branch,
  };
  if (sha) putBody.sha = sha;

  try {
    const putRes = await fetch(apiBase, { method: 'PUT', headers, body: JSON.stringify(putBody) });
    const result = await putRes.json().catch(() => ({}));
    if (!putRes.ok) {
      setPublishStatus('err', 'Publish failed: ' + (result.message || putRes.status));
      return false;
    }
    setPublishStatus('ok', 'Published ' + payload.items.length + ' stories. Live on Pages in ~30–60s.');
    return true;
  } catch (e) {
    setPublishStatus('err', 'Network error publishing: ' + e.message);
    return false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem(SESSION_KEY) === '1') showAdmin(true);
  else showAdmin(false);
  clearForm();

  document.getElementById('btn-login').addEventListener('click', async () => {
    const hash = await sha256(document.getElementById('password').value);
    if (hash === PASS_HASH) {
      sessionStorage.setItem(SESSION_KEY, '1');
      document.getElementById('login-error').hidden = true;
      showAdmin(true);
    } else document.getElementById('login-error').hidden = false;
  });
  document.getElementById('password').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('btn-login').click();
  });
  document.getElementById('btn-logout').addEventListener('click', () => {
    sessionStorage.removeItem(SESSION_KEY); showAdmin(false);
  });
  document.getElementById('btn-clear').addEventListener('click', clearForm);
  document.getElementById('btn-add-tl').addEventListener('click', () => addTimelineRow());
  document.getElementById('btn-toggle-token').addEventListener('click', () => {
    const inp = document.getElementById('gh-token');
    const btn = document.getElementById('btn-toggle-token');
    if (inp.type === 'password') { inp.type = 'text'; btn.textContent = 'Hide'; }
    else { inp.type = 'password'; btn.textContent = 'Show'; }
  });
  document.getElementById('btn-save-settings').addEventListener('click', () => {
    saveGhSettings(); setPublishStatus('ok', 'Settings saved in this browser.');
  });
  document.getElementById('btn-clear-token').addEventListener('click', () => {
    document.getElementById('gh-token').value = '';
    localStorage.removeItem(GH_TOKEN_KEY); sessionStorage.removeItem(GH_TOKEN_KEY);
    setPublishStatus('ok', 'Token cleared.');
  });
  document.getElementById('btn-publish').addEventListener('click', () => publishToGitHub());
  document.getElementById('f-image').addEventListener('change', e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 900000) { alert('Image too large (max ~900 KB).'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      document.getElementById('f-image-data').value = reader.result;
      const prev = document.getElementById('f-preview');
      prev.src = reader.result; prev.style.display = 'block';
    };
    reader.readAsDataURL(file);
  });
  document.getElementById('btn-save').addEventListener('click', () => {
    const item = buildStoryFromForm();
    if (!item) { alert('Title is required.'); return; }
    saveDraft(item);
    alert('Draft saved on this device only.');
    clearForm();
  });
  document.getElementById('btn-save-publish').addEventListener('click', async () => {
    const item = buildStoryFromForm();
    if (!item) { alert('Title is required.'); return; }
    saveDraft(item);
    const ok = await publishToGitHub();
    if (ok) clearForm();
    else alert('Draft saved locally, but publish failed — check token/status.');
  });
  document.getElementById('story-list').addEventListener('click', e => {
    const edit = e.target.getAttribute('data-edit');
    const del = e.target.getAttribute('data-del');
    if (edit) { const item = loadLocal().find(i => i.id === edit); if (item) fillForm(item); }
    if (del) {
      if (!confirm('Delete this draft?')) return;
      saveLocal(loadLocal().filter(i => i.id !== del));
      renderList();
    }
  });
  document.getElementById('btn-export').addEventListener('click', async () => {
    const payload = await mergeNewsPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'news.json'; a.click();
    URL.revokeObjectURL(a.href);
  });
});
