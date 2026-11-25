/* =========================================================
   OPA Greek Gyros – "Come nasce il tuo gyros" in 3D vero (Three.js)
   Ogni ingrediente è un oggetto 3D: la foto sopra, il rilievo dalla mappa
   di altezza, le pieghe dalla mappa normale, il lato inferiore e le ombre.
   Scorrendo gli ingredienti cadono girando su sé stessi e si posano sulla
   pita; alla fine la telecamera gira intorno al gyros composto.
   Se il 3D non è disponibile resta l'animazione fotografica (gyro-foto.js).
   ========================================================= */
(function () {
  'use strict';
  var T = window.THREE;
  var stage = document.getElementById('scene'), sec = document.getElementById('build');
  if (!T || !stage || !sec) return;

  var IMG = window.__IMG || {};
  var src = function (n) { return IMG[n] || ('img/' + n + '.webp'); };
  var map3 = function (n, s) { return IMG[n + '-' + s] || ('img/3d/' + n + '-' + s + '.webp'); };
  var clamp = function (v, a, b) { return Math.min(b === undefined ? 1 : b, Math.max(a === undefined ? 0 : a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var seg = function (p, a, b) { return clamp((p - a) / (b - a)); };
  var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var land = function (t) { if (t < .72) { var k = t / .72; return k * k; } var b = (t - .72) / .28; return 1 - Math.sin(b * Math.PI) * .05; };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mob = window.matchMedia('(max-width: 820px)').matches;

  /* --- dimensioni originali delle immagini (per le proporzioni) --- */
  var SIZE = { 'cipolla-1': [270, 300], 'cipolla-2': [247, 258], 'cipolla-3': [274, 320], 'insalata-1': [268, 360], 'insalata-2': [360, 353], 'insalata-3': [360, 352],
    'patatine': [255, 340], 'pita': [899, 900], 'pollo-1': [331, 380], 'pollo-2': [332, 380], 'pollo-3': [334, 380], 'pollo-4': [332, 380],
    'pomodoro-1': [310, 320], 'pomodoro-2': [320, 318], 'tzatziki': [380, 332] };
  /* rilievo (frazione della larghezza), ruvidità, colore del lato inferiore, quota di appoggio */
  var K = { pita: [.05, .78, .62, 0], pollo: [.13, .5, .5, .02], insalata: [.035, .55, .8, .07], pomodoro: [.04, .28, .75, .11],
    cipolla: [.035, .35, .85, .14], patatine: [.07, .45, .82, .16], tzatziki: [.17, .32, .9, .2] };

  /* --- stessi ingredienti dell'animazione fotografica --- */
  var I = [
    ['pollo-1', 31, 45, 27, -32, .13, .19], ['pollo-2', 50, 40, 28, 18, .15, .21], ['pollo-3', 68, 46, 27, -14, .17, .23],
    ['pollo-4', 37, 59, 26, 38, .19, .25], ['pollo-1', 57, 57, 27, -42, .21, .27], ['pollo-3', 73, 60, 24, 8, .23, .29],
    ['insalata-1', 25, 40, 25, 28, .30, .36], ['insalata-2', 53, 63, 27, -22, .32, .38], ['insalata-3', 75, 41, 24, 62, .34, .40],
    ['pomodoro-1', 35, 50, 19, 0, .36, .42], ['pomodoro-2', 53, 45, 19, 40, .38, .44], ['pomodoro-1', 69, 53, 18, 12, .40, .46], ['pomodoro-2', 45, 61, 17, 80, .42, .48],
    ['cipolla-1', 40, 41, 17, 0, .44, .50], ['cipolla-2', 62, 61, 14, 30, .46, .52], ['cipolla-3', 71, 43, 16, 0, .48, .54],
    ['patatine', 41, 53, 25, 62, .53, .59], ['patatine', 63, 48, 25, -28, .56, .62],
    ['tzatziki', 50, 51, 30, 0, .64, .72, 'sauce'], ['tzatziki', 32, 47, 17, 140, .67, .74, 'sauce']
  ];

  /* --- renderer --- */
  var canvas = document.createElement('canvas'), renderer;
  try { renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
  catch (e) { return; }
  window.__3DOK = true;
  stage.appendChild(canvas);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mob ? 1.75 : 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .9;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;

  var scene = new T.Scene();
  var cam = new T.PerspectiveCamera(30, 1, .1, 100);

  /* ambiente per riflessi morbidi (studio fotografico) */
  (function () {
    var c = document.createElement('canvas'); c.width = 8; c.height = 256; var g = c.getContext('2d');
    var gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#fff4e2'); gr.addColorStop(.45, '#c9d6ea'); gr.addColorStop(.55, '#2c4a7c'); gr.addColorStop(1, '#0b1f40');
    g.fillStyle = gr; g.fillRect(0, 0, 8, 256);
    var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding;
    var envScene = new T.Scene();
    envScene.add(new T.Mesh(new T.SphereGeometry(10, 32, 16), new T.MeshBasicMaterial({ map: t, side: T.BackSide })));
    var soft = new T.Mesh(new T.PlaneGeometry(6, 3), new T.MeshBasicMaterial({ color: 0xffffff }));
    soft.position.set(0, 6, 4); soft.lookAt(0, 0, 0); envScene.add(soft);
    try { scene.environment = new T.PMREMGenerator(renderer).fromScene(envScene).texture; } catch (e) {}
  })();

  scene.add(new T.HemisphereLight(0xfff1dc, 0x1b2a4a, .35));
  var key = new T.DirectionalLight(0xffe6c4, 2.0); key.position.set(3.2, 7, 4.2); key.castShadow = true;
  key.shadow.mapSize.set(mob ? 1024 : 2048, mob ? 1024 : 2048);
  var sc = key.shadow.camera; sc.left = -3.4; sc.right = 3.4; sc.top = 3.4; sc.bottom = -3.4; sc.near = 1; sc.far = 20;
  key.shadow.bias = -.0006; key.shadow.normalBias = .02; key.shadow.radius = 4;
  scene.add(key);
  var rim = new T.DirectionalLight(0x9cc0ff, .8); rim.position.set(-5, 3, -4); scene.add(rim);
  var warm = new T.PointLight(0xffb15c, 0, 6); warm.position.set(0, 1.4, 0); scene.add(warm);

  /* piano invisibile che raccoglie le ombre */
  var ground = new T.Mesh(new T.PlaneGeometry(40, 40), new T.ShadowMaterial({ opacity: .42 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

  var loader = new T.TextureLoader();
  var cache = {};
  function tex(url, color) {
    if (cache[url]) return cache[url];
    var t = loader.load(url); t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    if (color) t.encoding = T.sRGBEncoding;
    return (cache[url] = t);
  }

  /* --- un ingrediente 3D: superficie superiore + inferiore rilevate dalla mappa --- */
  function make(name, width) {
    var kind = name.split('-')[0], k = K[kind], sz = SIZE[name];
    var w = width, h = width * sz[1] / sz[0], disp = k[0] * width;
    var segs = kind === 'pita' ? (mob ? 120 : 170) : (mob ? 56 : 80);
    var geo = new T.PlaneGeometry(w, h, segs, Math.max(8, Math.round(segs * h / w)));
    geo.rotateX(-Math.PI / 2);
    var col = tex(src(name), true), hm = tex(map3(name, 'h')), nm = tex(map3(name, 'n'));
    var top = new T.MeshStandardMaterial({ map: col, alphaTest: .5, displacementMap: hm, displacementScale: disp,
      normalMap: nm, normalScale: new T.Vector2(1, 1), roughness: k[1], metalness: 0, envMapIntensity: .32 });
    var bot = top.clone(); bot.color = new T.Color(k[2], k[2] * .95, k[2] * .9); bot.roughness = .85;
    var depth = new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking, map: col, alphaTest: .5, displacementMap: hm, displacementScale: disp });
    var g = new T.Group();
    var a = new T.Mesh(geo, top), b = new T.Mesh(geo, bot);
    b.scale.y = -1;                                   // specchio sotto: chiude il volume
    [a, b].forEach(function (m) { m.castShadow = true; m.receiveShadow = true; m.customDepthMaterial = depth; g.add(m); });
    g.userData.mat = top;
    return g;
  }

  /* --- la scena --- */
  var P = 4;                                           // diametro della pita in unità 3D
  var root = new T.Group(); scene.add(root);
  var pita = make('pita', P); root.add(pita);
  var items = I.map(function (d, n) {
    var kind = d[0].split('-')[0], o = make(d[0], d[3] / 100 * P);
    o.visible = false; root.add(o);
    var r = Math.sin(n * 12.9898) * 43758.5453; r = r - Math.floor(r);
    return { o: o, x: (d[1] - 50) / 100 * P, z: (d[2] - 50) / 100 * P, y: .16 + K[kind][3] + n * .006,
      ry: -d[4] * Math.PI / 180, t0: d[5], t1: d[6], sauce: d[7] === 'sauce',
      ax: (r - .5) * 9, az: (r * 7 % 1 - .5) * 9, ay: (n % 2 ? 1 : -1) * (2 + r * 3) };
  });

  /* vapore */
  var steamTex = (function () {
    var c = document.createElement('canvas'); c.width = c.height = 64; var g = c.getContext('2d');
    var gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new T.CanvasTexture(c);
  })();
  var SN = 26, sGeo = new T.BufferGeometry(), sPos = new Float32Array(SN * 3), sSeed = [];
  for (var s = 0; s < SN; s++) sSeed.push([(Math.random() - .5) * 2.4, (Math.random() - .5) * 1.6, Math.random()]);
  sGeo.setAttribute('position', new T.BufferAttribute(sPos, 3));
  var sMat = new T.PointsMaterial({ map: steamTex, size: 1.3, transparent: true, depthWrite: false, opacity: 0 });
  var steam = new T.Points(sGeo, sMat); root.add(steam);

  /* --- interfaccia (passaggi, barra, "Opa!") --- */
  var steps = Array.prototype.slice.call(document.querySelectorAll('#steps li'));
  var bar = document.getElementById('buildBar'), pop = document.getElementById('opaPop'), cap = document.querySelector('.build-cap');
  var B = [0, .12, .3, .5, .62, .74], curStep = -1, ps = 0, last = performance.now(), visible = false;
  var nx = 0, ny = 0;
  addEventListener('pointermove', function (e) { nx = e.clientX / innerWidth - .5; ny = e.clientY / innerHeight - .5; }, { passive: true });

  function resize() {
    var w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
  }
  addEventListener('resize', resize); resize();

  function frame(p, time) {
    // pita: scende ruotando e si scalda
    var pk = 1 - Math.pow(1 - seg(p, 0, .12), 3);
    pita.position.y = (1 - pk) * 5; pita.rotation.y = (1 - pk) * -1.6; pita.rotation.x = (1 - pk) * .5;
    pita.visible = p > .001;
    var heat = Math.sin(seg(p, .03, .22) * Math.PI);
    pita.userData.mat.emissive = pita.userData.mat.emissive || new T.Color(0);
    pita.userData.mat.emissive.setRGB(.55 * heat, .2 * heat, .04 * heat);
    warm.intensity = heat * 1.4;

    // ingredienti: cadono girando su tutti gli assi e si posano
    items.forEach(function (it) {
      var k = seg(p, it.t0, it.t1);
      it.o.visible = k > 0; if (!it.o.visible) return;
      var air = 1 - land(k);
      if (it.sauce) {
        var sq = k < .7 ? 1 - Math.pow(1 - k / .7, 3) : 1 + Math.sin((k - .7) / .3 * Math.PI) * .07;
        it.o.position.set(it.x, it.y + air * .6, it.z);
        it.o.scale.set(sq * 1.03, Math.max(.01, sq * (k < .7 ? 1.3 - .3 * k / .7 : 1)), sq * 1.03);
        it.o.rotation.set(0, it.ry, 0);
      } else {
        it.o.position.set(it.x, it.y + air * 5.5, it.z);
        it.o.rotation.set(air * it.ax, it.ry + air * it.ay, air * it.az);
      }
    });

    // vapore
    var sa = seg(p, .05, .14) * (1 - seg(p, .7, .8));
    sMat.opacity = .22 * sa; steam.visible = sa > 0;
    sSeed.forEach(function (q, j) { var y = (time * .2 + q[2]) % 1; sPos[j * 3] = q[0] + Math.sin(time + j) * .05; sPos[j * 3 + 1] = .3 + y * 1.6; sPos[j * 3 + 2] = q[1]; });
    sGeo.attributes.position.needsUpdate = true;

    // telecamera: dall'alto, si abbassa mentre si compone, poi gira intorno al gyros finito
    var port = cam.aspect < 1;
    var el = lerp(1.12, .66, ease(seg(p, 0, .74))) - lerp(0, .22, ease(seg(p, .74, 1))) - ny * .05;
    var az = lerp(-.45, .25, ease(seg(p, 0, .74))) + lerp(0, 1.5, ease(seg(p, .74, 1))) + nx * .12;
    var r = lerp(8.4, 7.9, ease(p)) * (port ? 1.5 : 1);
    var ty = lerp(.1, .3, ease(seg(p, .6, 1)));
    cam.position.set(r * Math.cos(el) * Math.sin(az), ty + r * Math.sin(el), r * Math.cos(el) * Math.cos(az));
    cam.lookAt(0, ty, 0);
    root.rotation.y = Math.sin(time * .35) * .02 * seg(p, .9, 1);

    renderer.render(scene, cam);
  }

  function update(now) {
    var dt = Math.min(.05, (now - last) / 1000); last = now;
    var rr = sec.getBoundingClientRect();
    var p = clamp(-rr.top / (rr.height - innerHeight));
    ps = reduce ? p : ps + (p - ps) * Math.min(1, dt * 6);
    var s = 0; B.forEach(function (b, i) { if (ps >= b - 1e-3) s = i; });
    if (s !== curStep) { curStep = s; steps.forEach(function (li, i) { li.classList.toggle('on', i === s); li.classList.toggle('done', i < s); }); }
    if (bar) bar.style.transform = 'scaleX(' + ps.toFixed(3) + ')';
    if (pop) pop.classList.toggle('on', ps > .9);
    if (cap) cap.style.opacity = ps > .82 ? 1 : 0;
    frame(ps, now / 1000);
  }

  if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(sec);
  else visible = true;
  (function loop(now) { requestAnimationFrame(loop); if (visible) update(now); })(last);
  window.__gyro3d = { frame: frame };
})();
