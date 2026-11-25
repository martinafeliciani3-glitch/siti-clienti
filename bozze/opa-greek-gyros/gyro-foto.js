/* =========================================================
   OPA Greek Gyros – animazione fotografica "Come nasce il tuo gyros"
   Ingredienti fotografici scontornati che cadono sulla pita in una
   scena con prospettiva 3D (CSS), ombre dinamiche e sfocatura da movimento.
   L'avanzamento segue lo scorrimento della sezione #build.
   ========================================================= */
(function () {
  'use strict';
  var stage = document.getElementById('scene');
  var sec = document.getElementById('build');
  if (!stage || !sec) return;

  // percorso delle immagini (nella versione in un unico file arrivano già incorporate)
  var src = function (n) { return (window.__IMG && window.__IMG[n]) || ('img/' + n + '.webp'); };
  var clamp = function (v, a, b) { return Math.min(b === undefined ? 1 : b, Math.max(a === undefined ? 0 : a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var seg = function (p, a, b) { return clamp((p - a) / (b - a)); };
  var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
  // atterraggio con un piccolo rimbalzo, come un oggetto che cade su una superficie morbida
  var land = function (t) {
    if (t < .72) { var k = t / .72; return k * k; }
    var b = (t - .72) / .28; return 1 - Math.sin(b * Math.PI) * .06;
  };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- ingredienti: posizione sulla pita (% del diametro), larghezza, rotazione, finestra temporale --- */
  var I = [
    // pollo
    ['pollo-1', 31, 45, 27, -32, .13, .19], ['pollo-2', 50, 40, 28, 18, .15, .21], ['pollo-3', 68, 46, 27, -14, .17, .23],
    ['pollo-4', 37, 59, 26, 38, .19, .25], ['pollo-1', 57, 57, 27, -42, .21, .27], ['pollo-3', 73, 60, 24, 8, .23, .29],
    // insalata
    ['insalata-1', 25, 40, 25, 28, .30, .36], ['insalata-2', 53, 63, 27, -22, .32, .38], ['insalata-3', 75, 41, 24, 62, .34, .40],
    // pomodori
    ['pomodoro-1', 35, 50, 19, 0, .36, .42], ['pomodoro-2', 53, 45, 19, 40, .38, .44], ['pomodoro-1', 69, 53, 18, 12, .40, .46], ['pomodoro-2', 45, 61, 17, 80, .42, .48],
    // cipolla
    ['cipolla-1', 40, 41, 17, 0, .44, .50], ['cipolla-2', 62, 61, 14, 30, .46, .52], ['cipolla-3', 71, 43, 16, 0, .48, .54],
    // patatine
    ['patatine', 41, 53, 25, 62, .53, .59], ['patatine', 63, 48, 25, -28, .56, .62],
    // tzatziki (si "posa" invece di cadere)
    ['tzatziki', 50, 51, 30, 0, .64, .72, 'sauce'], ['tzatziki', 32, 47, 17, 140, .67, .74, 'sauce']
  ];

  /* --- costruzione della scena --- */
  var scene = document.createElement('div'); scene.className = 'ph-scene';
  var table = document.createElement('div'); table.className = 'ph-table';
  var pita = document.createElement('div'); pita.className = 'ph-pita';
  var pImg = new Image(); pImg.src = src('pita'); pImg.alt = ''; pImg.decoding = 'async'; pita.appendChild(pImg);
  var glow = document.createElement('div'); glow.className = 'ph-glow'; pita.appendChild(glow);
  var steam = document.createElement('div'); steam.className = 'ph-steam';
  for (var s = 0; s < 5; s++) { var puff = document.createElement('i'); puff.style.setProperty('--i', s); steam.appendChild(puff); }
  table.appendChild(pita); scene.appendChild(table); scene.appendChild(steam);

  var items = I.map(function (d, n) {
    var el = document.createElement('img');
    el.src = src(d[0]); el.alt = ''; el.decoding = 'async'; el.className = 'ph-item';
    el.style.left = d[1] + '%'; el.style.top = d[2] + '%'; el.style.width = d[3] + '%'; el.style.zIndex = 10 + n;
    pita.appendChild(el);
    return { el: el, rot: d[4], t0: d[5], t1: d[6], sauce: d[7] === 'sauce', spin: (n % 2 ? 1 : -1) * (90 + (n * 37) % 120) };
  });

  var finalPh = document.createElement('div'); finalPh.className = 'ph-final';
  var fImg = new Image(); fImg.src = src('hero'); fImg.alt = 'Pita gyros pronta: pollo, pomodoro, cipolla, insalata, patatine e tzatziki'; fImg.decoding = 'async';
  finalPh.appendChild(fImg);
  stage.appendChild(scene); stage.appendChild(finalPh);

  /* --- un fotogramma --- */
  var steps = Array.prototype.slice.call(document.querySelectorAll('#steps li'));
  var bar = document.getElementById('buildBar'), pop = document.getElementById('opaPop'), cap = document.querySelector('.build-cap');
  var B = [0, .12, .3, .5, .62, .74], cur = -1, ps = 0, last = performance.now(), visible = true;

  function frame(p, time) {
    var H = stage.clientHeight;

    // camera: dall'alto, poi si inclina e si avvicina
    var tilt = lerp(18, 34, ease(seg(p, 0, .7))) + lerp(0, 22, ease(seg(p, .72, .86)));
    var zoom = lerp(1, 1.06, ease(seg(p, 0, .7))) * lerp(1, 1.5, ease(seg(p, .72, .9)));
    var turn = lerp(-8, 6, ease(p));
    table.style.transform = 'rotateX(' + tilt.toFixed(2) + 'deg) rotateZ(' + turn.toFixed(2) + 'deg) scale(' + zoom.toFixed(3) + ')';

    // pita: arriva dall'alto ruotando, poi si scalda
    var pk = easeOut(seg(p, 0, .12));
    pita.style.transform = 'translate3d(0,' + ((1 - pk) * -H * .9).toFixed(1) + 'px,' + ((1 - pk) * 260).toFixed(1) + 'px) rotate(' + ((1 - pk) * -70).toFixed(1) + 'deg)';
    pita.style.opacity = seg(p, 0, .04);
    glow.style.opacity = (Math.sin(seg(p, .04, .22) * Math.PI) * .55).toFixed(3);

    // ingredienti
    for (var i = 0; i < items.length; i++) {
      var it = items[i], k = seg(p, it.t0, it.t1), e = it.el;
      if (k <= 0) { e.style.opacity = 0; continue; }
      e.style.opacity = Math.min(1, k * 6);
      var air = 1 - land(k);                        // 1 in aria, 0 posato
      var tr;
      if (it.sauce) {
        var sq = k < .7 ? easeOut(k / .7) : 1 + Math.sin((k - .7) / .3 * Math.PI) * .06;
        tr = 'translate(-50%,-50%) translate3d(0,' + (air * -40).toFixed(1) + 'px,' + (air * 90).toFixed(1) + 'px) rotate(' + it.rot + 'deg) scale(' + (sq * 1.02).toFixed(3) + ',' + (sq * .98).toFixed(3) + ')';
      } else {
        tr = 'translate(-50%,-50%) translate3d(0,' + (air * -H * .85).toFixed(1) + 'px,' + (air * 420).toFixed(1) + 'px) rotate(' + (it.rot + air * it.spin).toFixed(1) + 'deg) scale(' + (1 + air * .25).toFixed(3) + ')';
      }
      e.style.transform = tr;
      // ombra che si allontana e si ammorbidisce con l'altezza, sfocatura in caduta veloce
      var off = 3 + air * 34, blur = 3 + air * 26, blurM = air > .05 && air < .9 ? air * 2.4 : 0;
      e.style.filter = 'drop-shadow(' + (off * .7).toFixed(1) + 'px ' + off.toFixed(1) + 'px ' + blur.toFixed(1) + 'px rgba(10,20,40,' + (.42 - air * .22).toFixed(2) + '))' + (blurM ? ' blur(' + blurM.toFixed(2) + 'px)' : '');
    }

    // vapore
    steam.style.opacity = (seg(p, .05, .14) * (1 - seg(p, .72, .82)) * .9).toFixed(3);

    // finale: dissolvenza nella foto del gyros pronto
    var f = ease(seg(p, .8, .93));
    finalPh.style.opacity = f.toFixed(3);
    fImg.style.transform = 'scale(' + lerp(1.22, 1.02, f).toFixed(3) + ') translateY(' + ((Math.sin(time * .9) * 3) * f).toFixed(1) + 'px)';
    fImg.style.filter = 'blur(' + lerp(14, 0, f).toFixed(2) + 'px)';
    scene.style.opacity = (1 - seg(p, .86, .95)).toFixed(3);
    if (cap) cap.style.opacity = f > .5 ? 1 : 0;
  }

  function update(now) {
    var dt = Math.min(.05, (now - last) / 1000); last = now;
    var r = sec.getBoundingClientRect();
    var p = clamp(-r.top / (r.height - innerHeight));
    ps = reduce ? p : ps + (p - ps) * Math.min(1, dt * 6);
    var idx = 0; B.forEach(function (b, i) { if (ps >= b - 1e-3) idx = i; });
    if (idx !== cur) { cur = idx; steps.forEach(function (li, i) { li.classList.toggle('on', i === idx); li.classList.toggle('done', i < idx); }); }
    if (bar) bar.style.transform = 'scaleX(' + ps.toFixed(3) + ')';
    if (pop) pop.classList.toggle('on', ps > .93);
    frame(ps, now / 1000);
  }

  if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(sec);
  (function loop(now) { requestAnimationFrame(loop); if (visible) update(now); })(last);
  document.documentElement.classList.add('has-ph');
})();
