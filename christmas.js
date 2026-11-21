/* DispaUK progressive Christmas theme — mid-November through Boxing Day */
(function () {
  function getXmasProgress() {
    var now = new Date();
    var y = now.getFullYear();
    var start = new Date(y, 10, 15, 0, 0, 0);
    var peak = new Date(y, 11, 25, 12, 0, 0);
    var end = new Date(y, 11, 27, 0, 0, 0);
    if (now < start || now >= end) return 0;
    var t = (now.getTime() - start.getTime()) / (peak.getTime() - start.getTime());
    return Math.max(0, Math.min(1, t));
  }

  function initChristmas() {
    try {
      if (!document.getElementById('xmas-css')) {
        var link = document.createElement('link');
        link.id = 'xmas-css';
        link.rel = 'stylesheet';
        link.href = '/christmas.css';
        document.head.appendChild(link);
      }
      var p = getXmasProgress();
      var root = document.documentElement;
      if (p <= 0) {
        root.removeAttribute('data-xmas');
        root.style.removeProperty('--xmas');
        var old = document.getElementById('xmas-snow');
        if (old) old.remove();
        return;
      }
      var tier = Math.min(5, Math.max(1, Math.ceil(p * 5)));
      root.setAttribute('data-xmas', String(tier));
      root.style.setProperty('--xmas', String(p.toFixed(3)));

      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var layer = document.getElementById('xmas-snow');
      if (!layer) {
        layer = document.createElement('div');
        layer.id = 'xmas-snow';
        layer.setAttribute('aria-hidden', 'true');
        document.body.appendChild(layer);
      }
      layer.innerHTML = '';
      if (reduce) {
        for (var i = 0; i < 6; i++) {
          var s = document.createElement('span');
          s.textContent = '\u2744';
          s.style.left = (8 + i * 15) + '%';
          s.style.top = (10 + (i % 3) * 20) + '%';
          s.style.animation = 'none';
          s.style.opacity = '0.2';
          layer.appendChild(s);
        }
        return;
      }
      var count = Math.round(6 + p * 28);
      for (var j = 0; j < count; j++) {
        var flake = document.createElement('span');
        flake.textContent = j % 5 === 0 ? '\u2745' : '\u2744';
        flake.style.left = (Math.random() * 100) + '%';
        flake.style.fontSize = (0.45 + Math.random() * 0.7) + 'rem';
        flake.style.animationDuration = (9 + Math.random() * 16) + 's';
        flake.style.animationDelay = (-Math.random() * 18) + 's';
        flake.style.opacity = String(0.25 + Math.random() * 0.45);
        layer.appendChild(flake);
      }
    } catch (e) { /* never break the dashboard */ }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChristmas);
  } else {
    initChristmas();
  }
})();
