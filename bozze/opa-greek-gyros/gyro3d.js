/* =========================================================
   OPA Greek Gyros – scena 3D: la pita che si apre, si riempie e si chiude
   Usa Three.js r128 (three.min.js nella stessa cartella).
   Due scene: #gyro-hero (animazione automatica in loop)
              #gyro-build (animazione guidata dallo scorrimento)
   ========================================================= */
(function () {
  'use strict';
  var T = window.THREE;
  if (!T) return;

  var clamp = function (v, a, b) { a = a === undefined ? 0 : a; b = b === undefined ? 1 : b; return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var seg = function (p, a, b) { return clamp((p - a) / (b - a)); };
  var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
  var bounce = function (t) {
    var n = 7.5625, d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) { t -= 1.5 / d; return n * t * t + .75; }
    if (t < 2.5 / d) { t -= 2.25 / d; return n * t * t + .9375; }
    t -= 2.625 / d; return n * t * t + .984375;
  };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMob = window.matchMedia('(max-width: 820px)').matches;

  /* numeri casuali sempre uguali: le due scene sono identiche */
  function rng(seed) { var s = seed; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

  function canvasTex(w, h, draw) {
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 4; return t;
  }

  /* ---------- la piega della pita ----------
     Un punto della pita piatta (x, z) ad altezza h viene piegato a "U" attorno all'asse x.
     f = 0 piatta, f = 1 chiusa. Restituisce l'angolo, per ruotare gli ingredienti. */
  var W = 1.6, THM = 0.8 * Math.PI;
  function bend(x, z, h, f, out) {
    if (f < 1e-4) { out.set(x, h, z); return 0; }
    var R = W / (f * THM), th = z / R, s = Math.sin(th), c = Math.cos(th);
    out.set(x, R * (1 - c) + h * c, R * s - h * s);
    return th;
  }

  /* ---------- texture ---------- */
  function pitaTexture() {
    var r = rng(7);
    return canvasTex(512, 512, function (g, w, h) {
      var cx = w / 2, cy = h / 2, R = 246;
      g.save(); g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.clip();
      var gr = g.createRadialGradient(cx, cy, 20, cx, cy, R);
      gr.addColorStop(0, '#f0cd8a'); gr.addColorStop(.7, '#e2ad62'); gr.addColorStop(1, '#c2823c');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 170; i++) {            // macchie di tostatura
        var x = r() * w, y = r() * h, rad = 4 + r() * 20, a = .12 + r() * .28;
        var sp = g.createRadialGradient(x, y, 0, x, y, rad);
        sp.addColorStop(0, 'rgba(128,72,24,' + a + ')'); sp.addColorStop(1, 'rgba(128,72,24,0)');
        g.fillStyle = sp; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      }
      for (i = 0; i < 40; i++) {                  // bruciature piccole
        g.fillStyle = 'rgba(70,36,10,' + (.25 + r() * .3) + ')';
        g.beginPath(); g.arc(r() * w, r() * h, 1 + r() * 3, 0, 7); g.fill();
      }
      for (i = 0; i < 260; i++) {                 // farina
        g.fillStyle = 'rgba(255,248,230,' + (.25 + r() * .4) + ')';
        g.fillRect(r() * w, r() * h, 1.5, 1.5);
      }
      g.lineWidth = 10; g.strokeStyle = 'rgba(150,92,36,.55)';
      g.beginPath(); g.arc(cx, cy, R - 4, 0, Math.PI * 2); g.stroke();
      g.restore();
    });
  }
  function chickenTexture() {
    var r = rng(11);
    return canvasTex(128, 64, function (g, w, h) {
      g.fillStyle = '#b8743a'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 60; i++) { g.fillStyle = 'rgba(' + (r() > .5 ? '214,150,90' : '110,58,22') + ',' + (.25 + r() * .35) + ')'; g.fillRect(r() * w, r() * h, 3 + r() * 14, 2 + r() * 3); }
      g.strokeStyle = 'rgba(60,28,8,.75)'; g.lineWidth = 4;
      for (var x = -20; x < w; x += 26) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 18, h); g.stroke(); }
    });
  }
  function tomatoTexture() {
    return canvasTex(128, 128, function (g, w, h) {
      var c = w / 2;
      g.fillStyle = '#c92b1e'; g.beginPath(); g.arc(c, c, 62, 0, 7); g.fill();
      g.fillStyle = '#e8553f'; g.beginPath(); g.arc(c, c, 52, 0, 7); g.fill();
      for (var k = 0; k < 4; k++) {                // logge con i semi
        var a = k * Math.PI / 2 + .4, x = c + Math.cos(a) * 26, y = c + Math.sin(a) * 26;
        g.fillStyle = '#f08a5c'; g.beginPath(); g.ellipse(x, y, 17, 11, a, 0, 7); g.fill();
        g.fillStyle = '#f7d27a';
        for (var s = 0; s < 4; s++) { g.beginPath(); g.ellipse(x + Math.cos(a + s) * 7, y + Math.sin(a + s) * 5, 2.5, 1.5, a, 0, 7); g.fill(); }
      }
      g.fillStyle = '#f2a07a'; g.beginPath(); g.arc(c, c, 9, 0, 7); g.fill();
    });
  }
  function paperTexture() {
    return canvasTex(1024, 256, function (g, w, h) {
      g.fillStyle = '#fbf8f1'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#0f3a73'; g.fillRect(0, 26, w, 6); g.fillRect(0, h - 40, w, 6);
      g.strokeStyle = '#0f3a73'; g.lineWidth = 5;              // greca
      for (var x = 0; x < w; x += 36) {
        g.beginPath(); g.moveTo(x, 70); g.lineTo(x + 28, 70); g.lineTo(x + 28, 46); g.lineTo(x + 8, 46); g.lineTo(x + 8, 62); g.lineTo(x + 20, 62); g.lineTo(x + 20, 54); g.stroke();
        g.beginPath(); g.moveTo(x + 28, 70); g.lineTo(x + 36, 70); g.stroke();
      }
      g.fillStyle = '#0f3a73'; g.font = 'italic 700 74px Georgia, serif'; g.textBaseline = 'middle';
      for (x = 20; x < w; x += 340) { g.fillText('OPA!', x, 150); }
      g.fillStyle = '#f6c445';
      for (x = 210; x < w; x += 340) { g.beginPath(); g.arc(x, 150, 10, 0, 7); g.fill(); }
    });
  }
  function softDot(color) {
    return canvasTex(64, 64, function (g) {
      var gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, color); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    });
  }

  /* ---------- costruzione della scena ---------- */
  function makeScene(canvas) {
    var renderer;
    try {
      renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (e) { return null; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMob ? 1.75 : 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    var scene = new T.Scene();
    var cam = new T.PerspectiveCamera(34, 1, .1, 100);
    scene.add(new T.HemisphereLight(0xfff3dc, 0x24345a, .95));
    var key = new T.DirectionalLight(0xffe2b8, 1.9); key.position.set(3, 6, 4); scene.add(key);
    var rim = new T.DirectionalLight(0x8fb8ff, 1.1); rim.position.set(-4, 2.5, -4); scene.add(rim);
    var fill = new T.PointLight(0xffc46b, .8, 12); fill.position.set(0, 2.2, 2.6); scene.add(fill);

    var G = new T.Group(); G.rotation.order = 'YXZ'; scene.add(G);
    var R = rng(42), v = new T.Vector3();

    /* pita */
    var pitaGeo = new T.PlaneGeometry(2 * W, 2 * W, 48, 48); pitaGeo.rotateX(-Math.PI / 2);
    var pitaBase = pitaGeo.attributes.position.array.slice();
    var pitaMat = new T.MeshStandardMaterial({ map: pitaTexture(), roughness: .86, metalness: 0, side: T.DoubleSide, alphaTest: .5, emissive: 0xff7a1a, emissiveIntensity: 0 });
    var pita = new T.Mesh(pitaGeo, pitaMat); G.add(pita);

    /* ombra morbida */
    var shadow = new T.Mesh(new T.PlaneGeometry(4.4, 4.4), new T.MeshBasicMaterial({ map: softDot('rgba(0,0,0,.55)'), transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; scene.add(shadow);

    /* ingredienti */
    var items = [];
    function add(mesh, o) { mesh.visible = false; G.add(mesh); o.mesh = mesh; items.push(o); }
    function place(n, t0, t1, hMin, hMax, spread) {
      var a = [];
      for (var i = 0; i < n; i++) {
        a.push({ x: lerp(-.95, 1.38, (i + R() * .9) / n), z: (R() - .5) * 2 * spread, h: lerp(hMin, hMax, R()),
          t0: lerp(t0, t1 - .05, i / n), t1: lerp(t0, t1 - .05, i / n) + .06, ry: R() * Math.PI * 2, spin: (R() - .5) * 6 });
      }
      return a;
    }
    // pollo
    var chMat = new T.MeshStandardMaterial({ map: chickenTexture(), roughness: .62, metalness: .02 });
    place(26, .12, .32, .05, .17, .26).forEach(function (o) {
      var geo = new T.BoxGeometry(.36 + R() * .1, .07, .11, 6, 2, 2), p = geo.attributes.position;
      for (var k = 0; k < p.count; k++) { p.setY(k, p.getY(k) * (1 + (R() - .5) * .5)); p.setZ(k, p.getZ(k) + (R() - .5) * .02); }
      geo.computeVertexNormals();
      o.rx = (R() - .5) * .4; o.rz = (R() - .5) * .3; add(new T.Mesh(geo, chMat), o);
    });
    // pomodori
    var tomTop = new T.MeshStandardMaterial({ map: tomatoTexture(), roughness: .35 });
    var tomSide = new T.MeshStandardMaterial({ color: 0xc92b1e, roughness: .3 });
    var tomGeo = new T.CylinderGeometry(.16, .16, .045, 28);
    place(8, .3, .44, .17, .23, .22).forEach(function (o) { o.rx = (R() - .5) * .5; o.rz = (R() - .5) * .5; add(new T.Mesh(tomGeo, [tomSide, tomTop, tomTop]), o); });
    // cipolla
    var onMat = new T.MeshStandardMaterial({ color: 0xb15a9a, roughness: .45 });
    var onMat2 = new T.MeshStandardMaterial({ color: 0xf3e6f0, roughness: .4 });
    place(9, .36, .48, .21, .27, .25).forEach(function (o, i) {
      o.rx = Math.PI / 2 + (R() - .5) * .5; o.rz = (R() - .5) * .4;
      add(new T.Mesh(new T.TorusGeometry(.1 + R() * .05, .016, 8, 28), i % 2 ? onMat : onMat2), o);
    });
    // insalata
    var letMat = new T.MeshStandardMaterial({ color: 0x5fa83a, roughness: .55, side: T.DoubleSide });
    var letMat2 = new T.MeshStandardMaterial({ color: 0x9bcf5a, roughness: .55, side: T.DoubleSide });
    place(12, .34, .52, .13, .3, .27).forEach(function (o, i) {
      var geo = new T.PlaneGeometry(.34, .24, 8, 5), p = geo.attributes.position;
      for (var k = 0; k < p.count; k++) { var x = p.getX(k), y = p.getY(k); p.setZ(k, Math.sin(x * 26 + i) * .025 + Math.sin(y * 30) * .015); }
      geo.computeVertexNormals();
      o.rx = -Math.PI / 2 + (R() - .5) * .7; o.rz = (R() - .5) * .6;
      add(new T.Mesh(geo, i % 3 ? letMat : letMat2), o);
    });
    // patatine
    var frMat = new T.MeshStandardMaterial({ color: 0xf2bc4c, roughness: .5, emissive: 0x6b3a00, emissiveIntensity: .08 });
    var frGeo = new T.BoxGeometry(.055, .055, .4);
    place(16, .5, .64, .27, .38, .24).forEach(function (o) { o.rx = (R() - .5) * .5; o.rz = (R() - .5) * .5; add(new T.Mesh(frGeo, frMat), o); });

    /* tzatziki versato */
    var pts = [];
    for (var x = -.95; x <= 1.36; x += .09) pts.push(new T.Vector3(x, 0, Math.sin(x * 5.4) * .19));
    var TS = 180, RS = 10;
    var tzGeo = new T.TubeGeometry(new T.CatmullRomCurve3(pts), TS, .036, RS, false);
    var tzBase = tzGeo.attributes.position.array.slice();
    var tz = new T.Mesh(tzGeo, new T.MeshStandardMaterial({ color: 0xf6f3e8, roughness: .3, metalness: 0 }));
    G.add(tz);
    var dill = new T.Points(new T.BufferGeometry(), new T.PointsMaterial({ color: 0x4f7a2a, size: .035 }));
    var dillPos = [];
    for (var d = 0; d < 60; d++) { var dx = -.92 + R() * 2.25; dillPos.push({ x: dx, z: Math.sin(dx * 5.4) * .19 + (R() - .5) * .05, h: .45 }); }
    dill.geometry.setAttribute('position', new T.BufferAttribute(new Float32Array(dillPos.length * 3), 3));
    G.add(dill);

    /* carta */
    var paperGeo = new T.CylinderGeometry(.8, .56, 1, 48, 1, true); paperGeo.translate(0, .5, 0);
    var paper = new T.Mesh(paperGeo, new T.MeshStandardMaterial({ map: paperTexture(), roughness: .92, side: T.DoubleSide }));
    paper.rotation.z = -Math.PI / 2; paper.position.set(-1.78, .64, 0); G.add(paper);

    /* vapore */
    var STEAM = 34, steamGeo = new T.BufferGeometry(), steamPos = new Float32Array(STEAM * 3), steamSeed = [];
    for (var s = 0; s < STEAM; s++) steamSeed.push({ x: (R() - .5) * 2, z: (R() - .5) * .6, o: R() });
    steamGeo.setAttribute('position', new T.BufferAttribute(steamPos, 3));
    var steamMat = new T.PointsMaterial({ map: softDot('rgba(255,255,255,.9)'), size: .7, transparent: true, depthWrite: false, opacity: 0 });
    var steam = new T.Points(steamGeo, steamMat); G.add(steam);

    /* ---------- disegno di un fotogramma ---------- */
    var nx = 0, ny = 0;
    window.addEventListener('pointermove', function (e) { nx = e.clientX / innerWidth - .5; ny = e.clientY / innerHeight - .5; }, { passive: true });

    function size() {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      if (canvas.width !== Math.round(w * renderer.getPixelRatio()) || canvas.height !== Math.round(h * renderer.getPixelRatio())) {
        renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
      }
    }

    var lastF = -1;
    function frame(p, time) {
      size();
      var f = ease(seg(p, .74, .86));           // piega
      var st = ease(seg(p, .84, .97));          // in piedi + carta
      var pin = easeOut(seg(p, 0, .12));        // arrivo della pita

      /* pita */
      if (Math.abs(f - lastF) > 1e-4) {
        var a = pitaGeo.attributes.position.array;
        for (var i = 0; i < a.length; i += 3) {
          var bx = pitaBase[i], bz = pitaBase[i + 2], r2 = (bx * bx + bz * bz) / (W * W);
          bend(bx, bz, .03 * Math.max(0, 1 - r2), f, v); a[i] = v.x; a[i + 1] = v.y; a[i + 2] = v.z;
        }
        pitaGeo.attributes.position.needsUpdate = true; pitaGeo.computeVertexNormals();
        var t = tzGeo.attributes.position.array;
        for (i = 0; i < t.length; i += 3) { bend(tzBase[i], tzBase[i + 2], .44 + tzBase[i + 1], f, v); t[i] = v.x; t[i + 1] = v.y; t[i + 2] = v.z; }
        tzGeo.attributes.position.needsUpdate = true; tzGeo.computeVertexNormals();
        lastF = f;
      }
      pita.position.y = (1 - pin) * 1.6; pita.rotation.y = (1 - pin) * -2.4;
      pita.scale.setScalar(lerp(.55, 1, pin));
      pita.visible = p > 0;
      pitaMat.emissiveIntensity = .22 * Math.sin(seg(p, .04, .2) * Math.PI);   // si scalda

      /* ingredienti che cadono e rimbalzano */
      items.forEach(function (o) {
        var k = seg(p, o.t0, o.t1);
        o.mesh.visible = k > 0;
        if (!o.mesh.visible) return;
        var drop = (1 - bounce(k)) * 3.4;
        var th = bend(o.x, o.z, o.h + drop, f, v);
        o.mesh.position.copy(v);
        o.mesh.rotation.set(o.rx - th, o.ry + (1 - k) * o.spin, o.rz);
      });

      /* tzatziki: si versa da un'estremità all'altra */
      var tzK = ease(seg(p, .64, .74));
      tz.visible = tzK > 0;
      tzGeo.setDrawRange(0, Math.floor(tzK * TS) * RS * 6);
      var dp = dill.geometry.attributes.position.array, dk = seg(p, .72, .76);
      dillPos.forEach(function (q, j) { bend(q.x, q.z, q.h + (1 - dk) * 1.5, f, v); dp[j * 3] = v.x; dp[j * 3 + 1] = v.y; dp[j * 3 + 2] = v.z; });
      dill.geometry.attributes.position.needsUpdate = true; dill.visible = dk > 0;

      /* carta e posa finale */
      paper.visible = st > 0; paper.scale.set(1, Math.max(.001, st * 1.72), 1);
      G.rotation.z = st * 1.42; G.rotation.x = st * .3; G.rotation.y = st * .95 + Math.sin(time * .5) * .06 * st;
      G.position.y = lerp(0, -.15, st) + Math.sin(time * 1.3) * .035 * st;

      /* vapore */
      var sa = seg(p, .06, .16) * (1 - seg(p, .7, .8));
      steamMat.opacity = .28 * sa; steam.visible = sa > 0;
      steamSeed.forEach(function (q, j) {
        var y = ((time * .22 + q.o) % 1);
        steamPos[j * 3] = q.x + Math.sin(time + j) * .05; steamPos[j * 3 + 1] = .35 + y * 1.5; steamPos[j * 3 + 2] = q.z;
      });
      steamGeo.attributes.position.needsUpdate = true;

      /* ombra */
      shadow.position.y = lerp(-.04, -1.85, st); shadow.material.opacity = lerp(.9, .55, st) * pin;
      shadow.scale.setScalar(lerp(1, .55, st));

      /* camera */
      var port = cam.aspect < 1;
      var az = lerp(-.55, .18, ease(p)) + nx * .22, el = lerp(1.0, .24, ease(seg(p, .7, 1))) - ny * .08;
      var dist = lerp(6.4, 7.1, st) * (port ? 1.5 : 1), ty = lerp(0, .12, st);
      cam.position.set(dist * Math.cos(el) * Math.sin(az), ty + dist * Math.sin(el), dist * Math.cos(el) * Math.cos(az));
      cam.lookAt(0, ty, 0);

      renderer.render(scene, cam);
    }
    return { frame: frame, canvas: canvas };
  }

  /* ---------- avvio ---------- */
  var scenes = [];
  function visibility(sc) {
    sc.vis = true;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { sc.vis = e[0].isIntersecting; }).observe(sc.canvas);
  }

  var heroCanvas = document.getElementById('gyro-hero');
  if (heroCanvas) {
    var hero = makeScene(heroCanvas);
    if (hero) {
      document.documentElement.classList.add('has3d');
      hero.update = function (dt, time) {
        if (reduce) return hero.frame(1, 0);
        var L = 12.5, t = time % L, p = clamp(t / 9.5);       // 9,5 s di costruzione, 3 s in posa
        heroCanvas.style.opacity = t > L - .6 ? (L - t) / .6 : t < .3 ? t / .3 : 1;
        hero.frame(p, time);
      };
      visibility(hero); scenes.push(hero);
    }
  }

  var buildCanvas = document.getElementById('gyro-build');
  if (buildCanvas) {
    var build = makeScene(buildCanvas);
    var sec = document.getElementById('build');
    var steps = Array.prototype.slice.call(document.querySelectorAll('#steps li'));
    var bar = document.getElementById('buildBar'), pop = document.getElementById('opaPop');
    var B = [0, .12, .3, .5, .64, .76], cur = -1, ps = 0;
    if (build) {
      document.documentElement.classList.add('has3d');
      build.update = function (dt, time) {
        var r = sec.getBoundingClientRect();
        var p = clamp(-r.top / (r.height - innerHeight));
        ps += (p - ps) * Math.min(1, dt * 5);
        var idx = 0; B.forEach(function (b, i) { if (ps >= b - 1e-3) idx = i; });
        if (idx !== cur) { cur = idx; steps.forEach(function (li, i) { li.classList.toggle('on', i === idx); li.classList.toggle('done', i < idx); }); }
        if (bar) bar.style.transform = 'scaleX(' + ps.toFixed(3) + ')';
        if (pop) pop.classList.toggle('on', ps > .93);
        build.frame(ps, time);
      };
      visibility(build); scenes.push(build);
    }
  }

  if (!scenes.length) return;
  var last = performance.now();
  (function loop(now) {
    requestAnimationFrame(loop);
    var dt = Math.min(.05, (now - last) / 1000); last = now;
    scenes.forEach(function (sc) { if (sc.vis) sc.update(dt, now / 1000); });
  })(last);
})();
