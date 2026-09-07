(function () {
  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function boot() {
    const wrap = document.getElementById('news-ticker');
    const track = document.getElementById('ticker-content');
    if (!wrap || !track) return;
    fetch('/data/news.json', { cache: 'no-cache' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        const items = (data.items || [])
          .filter(i => {
            const st = (i.status || '').toLowerCase();
            return st === 'breaking' || st === 'developing' || i.severity === 'high';
          })
          .sort((a, b) => String(b.updatedAt || b.date || '').localeCompare(String(a.updatedAt || a.date || '')))
          .slice(0, 8);
        if (!items.length) return;
        const html = items.map(i => {
          const st = (i.status || (i.severity === 'high' ? 'developing' : 'resolved')).toLowerCase();
          return '<a class="news-ticker-item" href="/news/story.html?id=' + encodeURIComponent(i.id) + '">' +
            '<span class="t-status ' + esc(st) + '">' + esc(st) + '</span>' +
            '<strong>' + esc(i.title || '') + '</strong>' +
            (i.location ? ' — ' + esc(i.location) : '') +
          '</a>';
        }).join('');
        track.innerHTML = html + html;
        wrap.hidden = false;
      })
      .catch(() => {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
