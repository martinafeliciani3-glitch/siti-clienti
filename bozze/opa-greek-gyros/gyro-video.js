/* =========================================================
   OPA Greek Gyros – "Come nasce il tuo gyros" con video reali
   Una clip a tutto schermo per ogni fase, dissolvenze guidate dallo
   scorrimento, leggero movimento di camera, finale con la foto del gyros.
   Video: Pexels (licenza gratuita, uso commerciale consentito).
   ========================================================= */
(function () {
  'use strict';
  var stage = document.getElementById('scene');
  var sec = document.getElementById('build');
  if (!stage || !sec) return;

  var clamp = function (v) { return Math.min(1, Math.max(0, v)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // nella versione in un unico file video e immagini arrivano già incorporati
  var VID = window.__VID || {}, POS = window.__POS || {}, IMG = window.__IMG || {};

  /* clip e punto di inizio (frazione dello scorrimento della sezione) */
  var L = [
    ['pita', 0], ['spiedo', .15], ['affettato', .27], ['pomodoro', .38],
    ['patatine', .55], ['salsa', .70], ['final', .84]
  ];

  var layers = L.map(function (d, i) {
    var wrap = document.createElement('div');
    wrap.className = 'vl' + (i === 0 ? ' on' : '');
    var m;
    if (d[0] === 'final') {
      m = new Image(); m.src = IMG.hero || 'img/hero.webp';
      m.alt = 'Pita gyros pronta con pollo, pomodoro, cipolla, insalata, patatine e salsa';
    } else {
      m = document.createElement('video');
      m.muted = true; m.loop = true; m.playsInline = true;
      m.setAttribute('muted', ''); m.setAttribute('playsinline', ''); m.setAttribute('aria-hidden', 'true');
      m.preload = i < 2 ? 'auto' : 'metadata';
      m.poster = POS[d[0]] || ('video/' + d[0] + '.jpg');
      m.src = VID[d[0]] || ('video/' + d[0] + '.mp4');
    }
    wrap.appendChild(m); stage.appendChild(wrap);
    return { el: wrap, m: m, start: d[1], video: d[0] !== 'final' };
  });

  var steps = Array.prototype.slice.call(document.querySelectorAll('#steps li'));
  var bar = document.getElementById('buildBar'), pop = document.getElementById('opaPop'), cap = document.querySelector('.build-cap');
  var B = [0, .15, .38, .55, .70, .84];
  var cur = -1, curStep = -1, ps = 0, last = performance.now(), visible = false;

  function play(l) { if (!l.video || reduce) return; var pr = l.m.play(); if (pr && pr.catch) pr.catch(function () {}); }
  function activate(idx) {
    layers.forEach(function (l, i) {
      var on = i === idx;
      l.el.classList.toggle('on', on);
      if (on) { play(l); }
      else if (l.video && !l.m.paused) { setTimeout(function () { if (!l.el.classList.contains('on')) l.m.pause(); }, 950); }
    });
    var nx = layers[idx + 1];
    if (nx && nx.video && nx.m.preload !== 'auto') { nx.m.preload = 'auto'; nx.m.load(); }
    cur = idx;
  }

  function update(now) {
    var dt = Math.min(.05, (now - last) / 1000); last = now;
    var r = sec.getBoundingClientRect();
    var p = clamp(-r.top / (r.height - innerHeight));
    ps = reduce ? p : ps + (p - ps) * Math.min(1, dt * 7);

    var idx = 0; layers.forEach(function (l, i) { if (ps >= l.start - 1e-3) idx = i; });
    if (idx !== cur) activate(idx);
    if (visible && layers[cur].video && layers[cur].m.paused && !reduce) play(layers[cur]);

    // movimento di camera: lento avvicinamento legato allo scorrimento
    layers.forEach(function (l, i) {
      var end = layers[i + 1] ? layers[i + 1].start : 1;
      var lp = clamp((ps - l.start) / (end - l.start));
      l.m.style.transform = 'scale(' + (1.14 - lp * .1).toFixed(4) + ') translateY(' + ((.5 - lp) * 12).toFixed(2) + 'px)';
    });

    var s = 0; B.forEach(function (b, i) { if (ps >= b - 1e-3) s = i; });
    if (s !== curStep) { curStep = s; steps.forEach(function (li, i) { li.classList.toggle('on', i === s); li.classList.toggle('done', i < s); }); }
    if (bar) bar.style.transform = 'scaleX(' + ps.toFixed(3) + ')';
    if (pop) pop.classList.toggle('on', ps > .9);
    if (cap) cap.style.opacity = ps > .86 ? 1 : 0;
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      visible = e[0].isIntersecting;
      if (!visible) layers.forEach(function (l) { if (l.video) l.m.pause(); });
    }).observe(sec);
  } else { visible = true; }
  (function loop(now) { requestAnimationFrame(loop); if (visible) update(now); })(last);
})();
