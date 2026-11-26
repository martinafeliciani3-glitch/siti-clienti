/* =========================================================
   OPA Greek Gyros – "Come nasce il tuo gyros" in 3D (Three.js)

   - Ogni ingrediente è un oggetto 3D costruito dalla sua foto: superficie
     in rilievo (mappa di altezza), pieghe (mappa normale), lato inferiore.
   - Gli ingredienti si appoggiano davvero gli uni sugli altri: una mappa
     delle altezze della pita viene aggiornata dopo ogni ingrediente.
     Insalata e tzatziki si adagiano seguendo la forma di ciò che sta sotto,
     pollo, pomodori e cipolla si posano inclinati come oggetti rigidi.
   - Patatine: bastoncini 3D singoli.
   - Finale: la pita si arrotola, entra nella carta e si alza in piedi.
   Se il 3D non è disponibile resta l'animazione fotografica (gyro-foto.js).
   ========================================================= */
(function () {
  'use strict';
  var T = window.THREE;
  var stage = document.getElementById('scene'), sec = document.getElementById('build');
  if (!T || !stage || !sec) return;

  var IMG = window.__IMG || {};
  var src = function (n) { return IMG[n] || ('img/' + n + '.webp'); };
  var hsrc = function (n) { return IMG[n + '-h'] || ('img/3d/' + n + '-h.webp'); };
  var nsrc = function (n) { return IMG[n + '-n'] || ('img/3d/' + n + '-n.webp'); };
  var clamp = function (v, a, b) { return Math.min(b === undefined ? 1 : b, Math.max(a === undefined ? 0 : a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var seg = function (p, a, b) { return clamp((p - a) / (b - a)); };
  var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var land = function (t) { if (t < .72) { var k = t / .72; return k * k; } var b = (t - .72) / .28; return 1 - Math.sin(b * Math.PI) * .05; };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mob = window.matchMedia('(max-width: 820px)').matches;
  var rnd = (function () { var s = 20250; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })();

  /* --- ingredienti: nome, x%, y% sulla pita, larghezza %, rotazione°, inizio e fine caduta --- */
  var I = [
    ['pollo-1', 31, 45, 27, -32, .13, .19], ['pollo-2', 50, 40, 28, 18, .15, .21], ['pollo-3', 68, 46, 27, -14, .17, .23],
    ['pollo-4', 37, 59, 26, 38, .19, .25], ['pollo-1', 57, 57, 27, -42, .21, .27], ['pollo-3', 73, 60, 24, 8, .23, .29],
    ['insalata-1', 27, 42, 25, 28, .30, .36], ['insalata-2', 52, 61, 27, -22, .32, .38], ['insalata-3', 72, 43, 24, 62, .34, .40],
    ['pomodoro-1', 35, 50, 19, 0, .36, .42], ['pomodoro-2', 53, 45, 19, 40, .38, .44], ['pomodoro-1', 68, 53, 18, 12, .40, .46], ['pomodoro-2', 45, 60, 17, 80, .42, .48],
    ['cipolla-1', 40, 43, 17, 0, .44, .50], ['cipolla-2', 61, 59, 14, 30, .46, .52], ['cipolla-3', 70, 45, 16, 0, .48, .54],
    ['tzatziki', 50, 51, 30, 0, .64, .72, 'sauce'], ['tzatziki', 33, 48, 17, 140, .67, .74, 'sauce']
  ];
  /* tipo: rilievo (× larghezza), spessore minimo, modo di appoggio, ruvidità, colore del lato sotto, arricciatura */
  var K = {
    pita:     { disp: .05, tmin: 0, mode: 'base', rough: .78, under: .62 },
    pollo:    { disp: .13, tmin: .02, mode: 'rigid', rough: .5, under: .55 },
    insalata: { disp: .03, tmin: .014, mode: 'drape', rough: .5, under: .82, curl: .05 },
    pomodoro: { disp: .035, tmin: .03, mode: 'rigid', rough: .25, under: .8 },
    cipolla:  { disp: .03, tmin: .022, mode: 'rigid', rough: .3, under: .9 },
    tzatziki: { disp: .08, tmin: .01, mode: 'sauce', rough: .3, under: .9 }
  };
  var P = 4, W = P / 2, THM = .8 * Math.PI;      // diametro pita, mezza larghezza, angolo massimo della piega
  var ITEM_SEG = mob ? 30 : 40, PITA_SEG = mob ? 84 : 110;

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
  (function () {                                   // ambiente da studio per i riflessi
    var c = document.createElement('canvas'); c.width = 8; c.height = 256; var g = c.getContext('2d');
    var gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#fff4e2'); gr.addColorStop(.45, '#c9d6ea'); gr.addColorStop(.55, '#2c4a7c'); gr.addColorStop(1, '#0b1f40');
    g.fillStyle = gr; g.fillRect(0, 0, 8, 256);
    var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding;
    var es = new T.Scene(); es.add(new T.Mesh(new T.SphereGeometry(10, 32, 16), new T.MeshBasicMaterial({ map: t, side: T.BackSide })));
    var soft = new T.Mesh(new T.PlaneGeometry(6, 3), new T.MeshBasicMaterial({ color: 0xffffff })); soft.position.set(0, 6, 4); soft.lookAt(0, 0, 0); es.add(soft);
    try { scene.environment = new T.PMREMGenerator(renderer).fromScene(es).texture; } catch (e) {}
  })();
  scene.add(new T.HemisphereLight(0xfff1dc, 0x1b2a4a, .35));
  var key = new T.DirectionalLight(0xffe6c4, 2.0); key.position.set(3.2, 7, 4.2); key.castShadow = true;
  key.shadow.mapSize.set(mob ? 1024 : 2048, mob ? 1024 : 2048);
  var sc = key.shadow.camera; sc.left = -3.6; sc.right = 3.6; sc.top = 3.6; sc.bottom = -3.6; sc.near = 1; sc.far = 22;
  key.shadow.bias = -.0006; key.shadow.normalBias = .02; key.shadow.radius = 4;
  scene.add(key, key.target);
  var rim = new T.DirectionalLight(0x9cc0ff, .8); rim.position.set(-5, 3, -4); scene.add(rim);
  var warm = new T.PointLight(0xffb15c, 0, 6); warm.position.set(0, 1.4, 0); scene.add(warm);
  var ground = new T.Mesh(new T.PlaneGeometry(40, 40), new T.ShadowMaterial({ opacity: .42 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

  var root = new T.Group(); root.rotation.order = 'YXZ'; scene.add(root);

  /* --- caricamento immagini (servono anche i pixel, per il rilievo) --- */
  function loadImg(u) { return new Promise(function (res, rej) { var i = new Image(); i.onload = function () { res(i); }; i.onerror = rej; i.src = u; }); }
  function pixels(img) {
    var c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
    var g = c.getContext('2d'); g.drawImage(img, 0, 0);
    return { w: c.width, h: c.height, d: g.getImageData(0, 0, c.width, c.height).data };
  }
  function sample(px, u, v, ch) {                  // bilineare, u,v in 0..1 (v=0 in alto)
    var x = clamp(u) * (px.w - 1), y = clamp(v) * (px.h - 1), x0 = Math.floor(x), y0 = Math.floor(y);
    var x1 = Math.min(px.w - 1, x0 + 1), y1 = Math.min(px.h - 1, y0 + 1), fx = x - x0, fy = y - y0, d = px.d;
    var a = d[(y0 * px.w + x0) * 4 + ch], b = d[(y0 * px.w + x1) * 4 + ch], c = d[(y1 * px.w + x0) * 4 + ch], e = d[(y1 * px.w + x1) * 4 + ch];
    return ((a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + e * fx) * fy) / 255;
  }

  /* --- mappa delle altezze sopra la pita (per far appoggiare gli ingredienti) --- */
  var G = 230, SPAN = 4.6, CELL = SPAN / G, HF = new Float32Array(G * G);
  function hAt(x, z) {
    var gx = (x + SPAN / 2) / CELL - .5, gz = (z + SPAN / 2) / CELL - .5;
    var x0 = clamp(Math.floor(gx), 0, G - 2), z0 = clamp(Math.floor(gz), 0, G - 2), fx = clamp(gx - x0), fz = clamp(gz - z0);
    var a = HF[z0 * G + x0], b = HF[z0 * G + x0 + 1], c = HF[(z0 + 1) * G + x0], d = HF[(z0 + 1) * G + x0 + 1];
    return (a * (1 - fx) + b * fx) * (1 - fz) + (c * (1 - fx) + d * fx) * fz;
  }
  function hSoft(x, z, r) { return (hAt(x, z) * 2 + hAt(x + r, z) + hAt(x - r, z) + hAt(x, z + r) + hAt(x, z - r)) / 6; }
  function stamp(x, z, y, rad) {
    var cx = Math.round((x + SPAN / 2) / CELL - .5), cz = Math.round((z + SPAN / 2) / CELL - .5), R = rad || 1;
    for (var j = -R; j <= R; j++) for (var i = -R; i <= R; i++) {
      var gx = cx + i, gz = cz + j; if (gx < 0 || gz < 0 || gx >= G || gz >= G) continue;
      var k = gz * G + gx; if (y > HF[k]) HF[k] = y;
    }
  }

  /* --- la piega (finale): un punto (x,z) ad altezza h viene arrotolato attorno all'asse x --- */
  function bend(x, z, h, f, out) {
    if (f < 1e-4) { out[0] = x; out[1] = h; out[2] = z; return; }
    var R = W / (f * THM), th = z / R, s = Math.sin(th), c = Math.cos(th);
    out[0] = x; out[1] = R * (1 - c) + h * c; out[2] = R * s - h * s;
  }

  /* --- superfici: griglia con sopra e sotto --- */
  function surfaceIndex(sx, sy, flip) {
    var idx = [];
    for (var j = 0; j < sy; j++) for (var i = 0; i < sx; i++) {
      var a = j * (sx + 1) + i, b = (j + 1) * (sx + 1) + i, c = b + 1, d = a + 1;
      if (!flip) idx.push(a, b, d, b, c, d); else idx.push(a, d, b, b, d, c);
    }
    return idx;
  }
  function makeMesh(pos, uv, index, mat) {
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(pos, 3));
    if (uv) g.setAttribute('uv', new T.BufferAttribute(uv, 2));
    g.setIndex(index); g.computeVertexNormals();
    var m = new T.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; return m;
  }
  var texCache = {};
  function colorTex(name, img) {
    if (texCache[name]) return texCache[name];
    var t = new T.Texture(img); t.encoding = T.sRGBEncoding; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); t.needsUpdate = true;
    return (texCache[name] = t);
  }
  function plainTex(img) { var t = new T.Texture(img); t.needsUpdate = true; return t; }

  var objects = [];        // tutto ciò che si arrotola: { mesh, rest(Float32Array mondo), pivot }
  var pita, pitaMat, pitaPivot, items = [], fries = [], paper;

  function buildPiece(name, A, kind, w, x, z, ry, pitaMode) {
    var k = K[kind], col = A.col, hp = A.h;
    var h = w * col.h / col.w, sx = pitaMode ? PITA_SEG : ITEM_SEG, sy = Math.max(6, Math.round(sx * h / w));
    var n = (sx + 1) * (sy + 1), disp = k.disp * w;
    var top = new Float32Array(n * 3), bot = new Float32Array(n * 3), uv = new Float32Array(n * 2);
    var WX = new Float32Array(n), WZ = new Float32Array(n), HH = new Float32Array(n), AA = new Float32Array(n);
    var cr = Math.cos(ry), sr = Math.sin(ry);
    for (var j = 0, q = 0; j <= sy; j++) for (var i = 0; i <= sx; i++, q++) {
      var u = i / sx, v = j / sy, lx = (u - .5) * w, lz = (v - .5) * h;
      WX[q] = x + lx * cr + lz * sr; WZ[q] = z - lx * sr + lz * cr;
      HH[q] = sample(hp, u, v, 0); AA[q] = sample(col, u, v, 3);
      uv[q * 2] = u; uv[q * 2 + 1] = 1 - v;
    }
    // appoggio
    var base = new Float32Array(n), q2;
    if (pitaMode) { for (q2 = 0; q2 < n; q2++) base[q2] = 0; }
    else if (k.mode === 'rigid' || k.mode === 'sauce') {
      // piano che approssima ciò che sta sotto, poi sollevato quanto basta per non compenetrare
      var S = 0, Sx = 0, Sz = 0, Sxx = 0, Szz = 0, Sxz = 0, Sy = 0, Sxy = 0, Szy = 0, U = new Float32Array(n);
      for (q2 = 0; q2 < n; q2++) {
        U[q2] = hAt(WX[q2], WZ[q2]); if (AA[q2] < .4) continue;
        var X = WX[q2] - x, Z = WZ[q2] - z, Y = U[q2];
        S++; Sx += X; Sz += Z; Sxx += X * X; Szz += Z * Z; Sxz += X * Z; Sy += Y; Sxy += X * Y; Szy += Z * Y;
      }
      var M = [[S, Sx, Sz], [Sx, Sxx, Sxz], [Sz, Sxz, Szz]], rhs = [Sy, Sxy, Szy], sol = solve3(M, rhs) || [Sy / Math.max(1, S), 0, 0];
      var gx = clamp(sol[1], -.5, .5), gz = clamp(sol[2], -.5, .5), off = -1e9;
      for (q2 = 0; q2 < n; q2++) { if (AA[q2] < .25) continue; var pl = sol[0] + gx * (WX[q2] - x) + gz * (WZ[q2] - z); off = Math.max(off, U[q2] - pl); }
      if (k.mode === 'sauce') {      // crema: piano medio, che si adagia appena sulle forme sotto
        for (q2 = 0; q2 < n; q2++) { var pl2 = sol[0] + gx * (WX[q2] - x) + gz * (WZ[q2] - z); base[q2] = pl2 + clamp(hSoft(WX[q2], WZ[q2], .16) - pl2, -.02, .06) + .03; }
      } else for (q2 = 0; q2 < n; q2++) base[q2] = sol[0] + gx * (WX[q2] - x) + gz * (WZ[q2] - z) + off + .004;
    } else {
      // si adagia seguendo la forma di ciò che sta sotto
      for (q2 = 0; q2 < n; q2++) base[q2] = hSoft(WX[q2], WZ[q2], .035) + .004;
    }
    // superfici
    var cx = 0, cy = 0, cz = 0, cn = 0, minB = 1e9;
    for (j = 0, q = 0; j <= sy; j++) for (i = 0; i <= sx; i++, q++) {
      var ea = clamp((AA[q] - .5) * 2.5), edge = Math.min(1, HH[q] * 8) * ea, curl = 0;   // ea: sopra e sotto si chiudono sul bordo
      if (k.curl) { var du = i / sx - .5, dv = j / sy - .5, rr = (du * du + dv * dv) * 4; curl = k.curl * w * rr * rr; }
      var yt = base[q] + HH[q] * disp * ea + k.tmin * edge + curl * edge;
      var yb = pitaMode ? -.07 * edge : base[q] + curl * edge * .9 + .002 * ea;
      top[q * 3] = WX[q]; top[q * 3 + 1] = yt; top[q * 3 + 2] = WZ[q];
      bot[q * 3] = WX[q]; bot[q * 3 + 1] = yb; bot[q * 3 + 2] = WZ[q];
      if (AA[q] > .5) { cx += WX[q]; cy += yt; cz += WZ[q]; cn++; minB = Math.min(minB, yb); }
    }
    // aggiorna la mappa delle altezze con la superficie appena posata
    for (q = 0; q < n; q++) if (AA[q] > .5) stamp(WX[q], WZ[q], top[q * 3 + 1], pitaMode ? 1 : 1);
    cn = Math.max(1, cn);
    var pivot = new T.Vector3(cx / cn, kind === 'tzatziki' ? minB : cy / cn, cz / cn);
    // geometria locale rispetto al perno
    var restT = top.slice(), restB = bot.slice();
    for (q = 0; q < n; q++) { top[q * 3] -= pivot.x; top[q * 3 + 1] -= pivot.y; top[q * 3 + 2] -= pivot.z; bot[q * 3] -= pivot.x; bot[q * 3 + 1] -= pivot.y; bot[q * 3 + 2] -= pivot.z; }
    var ct = colorTex(name, A.img), nt = A.nt;
    var mt = new T.MeshStandardMaterial({ map: ct, alphaTest: .5, normalMap: nt, roughness: k.rough, metalness: 0, envMapIntensity: .32 });
    var mb = new T.MeshStandardMaterial({ map: ct, alphaTest: .5, roughness: .85, metalness: 0, color: new T.Color(k.under, k.under * .95, k.under * .9), envMapIntensity: .2 });
    var depth = new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking, map: ct, alphaTest: .5 });
    var g = new T.Group(); g.position.copy(pivot);
    var mT = makeMesh(top, uv, surfaceIndex(sx, sy, false), mt), mB = makeMesh(bot, uv, surfaceIndex(sx, sy, true), mb);
    mT.customDepthMaterial = mB.customDepthMaterial = depth;
    g.add(mT, mB); root.add(g);
    objects.push({ mesh: mT, rest: restT, pv: pivot.clone(), fill: !pitaMode }, { mesh: mB, rest: restB, pv: pivot.clone(), fill: !pitaMode });
    return { g: g, mat: mt, pivot: pivot };
  }

  function solve3(m, r) {
    var a = m[0][0], b = m[0][1], c = m[0][2], d = m[1][0], e = m[1][1], f = m[1][2], g = m[2][0], h = m[2][1], i = m[2][2];
    var det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g); if (Math.abs(det) < 1e-9) return null;
    return [(r[0] * (e * i - f * h) - b * (r[1] * i - f * r[2]) + c * (r[1] * h - e * r[2])) / det,
            (a * (r[1] * i - f * r[2]) - r[0] * (d * i - f * g) + c * (d * r[2] - r[1] * g)) / det,
            (a * (e * r[2] - r[1] * h) - b * (d * r[2] - r[1] * g) + r[0] * (d * h - e * g)) / det];
  }

  /* --- patatine: bastoncini 3D singoli --- */
  var friesTex = (function () {
    var c = document.createElement('canvas'); c.width = 64; c.height = 256; var g = c.getContext('2d');
    var gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#b9792b'); gr.addColorStop(.08, '#e3a53d'); gr.addColorStop(.5, '#f2c35a'); gr.addColorStop(.92, '#e2a23a'); gr.addColorStop(1, '#ad6f25');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
    for (var s = 0; s < 260; s++) { g.fillStyle = 'rgba(' + (Math.random() > .5 ? '255,230,150' : '150,90,30') + ',' + (.15 + Math.random() * .25) + ')'; g.fillRect(Math.random() * 64, Math.random() * 256, 1 + Math.random() * 3, 1 + Math.random() * 5); }
    var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t;
  })();
  var friesMat = new T.MeshStandardMaterial({ map: friesTex, roughness: .5, metalness: 0, envMapIntensity: .35, emissive: 0x5a2c00, emissiveIntensity: .35 });
  function buildFry(n, t0) {
    var L = .55 + rnd() * .3, r = .05 + rnd() * .012, a = rnd() * Math.PI;
    var cx = -1.05 + rnd() * 2.1, cz = -.5 + rnd() * 1.0;
    var ca = Math.cos(a), sa = Math.sin(a);
    // appoggio lungo l'asse
    var NS = 9, ys = [], best = -1e9;
    for (var s = 0; s < NS; s++) {
      var t = (s / (NS - 1) - .5) * L, px = cx + ca * t, pz = cz + sa * t;
      ys.push(Math.max(hAt(px, pz), hAt(px - sa * r, pz + ca * r), hAt(px + sa * r, pz - ca * r)));
    }
    var h0 = Math.max.apply(null, ys.slice(0, (NS / 2) | 0)), h1 = Math.max.apply(null, ys.slice((NS / 2) | 0));
    var slope = clamp((h1 - h0) / (L * .5), -.3, .3), mid = (h0 + h1) / 2;
    for (s = 0; s < NS; s++) { var tt = (s / (NS - 1) - .5) * L; best = Math.max(best, ys[s] - (mid + slope * tt)); }
    var yc = mid + best + r + .004;
    var geo = new T.BoxGeometry(r * 2, r * 2, L, 2, 2, 8), pa = geo.attributes.position;
    for (var q = 0; q < pa.count; q++) {
      var lx = pa.getX(q), ly = pa.getY(q), lz = pa.getZ(q);
      var round = 1 - .18 * (Math.abs(lx) / r) * (Math.abs(ly) / r);           // spigoli smussati
      lx *= round; ly *= round; lx += (rnd() - .5) * .004; ly += (rnd() - .5) * .004;
      var wx = cx + ca * lz - sa * lx, wz = cz + sa * lz + ca * lx, wy = yc + slope * lz + ly;
      pa.setXYZ(q, wx, wy, wz);
    }
    for (s = 0; s < NS; s++) { var t2 = (s / (NS - 1) - .5) * L; stamp(cx + ca * t2, cz + sa * t2, yc + slope * t2 + r * .2, 1); }
    var piv = new T.Vector3(cx, yc, cz), rest = pa.array.slice();
    for (q = 0; q < pa.count; q++) pa.setXYZ(q, pa.getX(q) - piv.x, pa.getY(q) - piv.y, pa.getZ(q) - piv.z);
    geo.computeVertexNormals();
    var m = new T.Mesh(geo, friesMat); m.castShadow = m.receiveShadow = true;
    var g = new T.Group(); g.position.copy(piv); g.add(m); root.add(g);
    objects.push({ mesh: m, rest: rest, pv: piv.clone(), fill: true });
    return { g: g, pivot: piv, t0: t0, t1: t0 + .05, ax: (rnd() - .5) * 8, ay: (rnd() - .5) * 6, az: (rnd() - .5) * 8 };
  }

  /* --- carta con la greca e "OPA!" --- */
  function paperTexture() {
    var c = document.createElement('canvas'); c.width = 1024; c.height = 256; var g = c.getContext('2d');
    g.fillStyle = '#fbf8f1'; g.fillRect(0, 0, 1024, 256);
    g.fillStyle = '#0f3a73'; g.fillRect(0, 26, 1024, 6); g.fillRect(0, 216, 1024, 6);
    g.strokeStyle = '#0f3a73'; g.lineWidth = 5;
    for (var x = 0; x < 1024; x += 36) { g.beginPath(); g.moveTo(x, 70); g.lineTo(x + 28, 70); g.lineTo(x + 28, 46); g.lineTo(x + 8, 46); g.lineTo(x + 8, 62); g.lineTo(x + 20, 62); g.lineTo(x + 20, 54); g.stroke(); g.beginPath(); g.moveTo(x + 28, 70); g.lineTo(x + 36, 70); g.stroke(); }
    g.fillStyle = '#0f3a73'; g.font = 'italic 700 74px Georgia, serif'; g.textBaseline = 'middle';
    for (x = 20; x < 1024; x += 340) g.fillText('OPA!', x, 150);
    g.fillStyle = '#f6c445'; for (x = 210; x < 1024; x += 340) { g.beginPath(); g.arc(x, 150, 10, 0, 7); g.fill(); }
    var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 8; return t;
  }

  /* --- vapore --- */
  var steamTex = (function () {
    var c = document.createElement('canvas'); c.width = c.height = 64; var g = c.getContext('2d');
    var gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new T.CanvasTexture(c);
  })();
  var SN = 26, sGeo = new T.BufferGeometry(), sPos = new Float32Array(SN * 3), sSeed = [];
  for (var s0 = 0; s0 < SN; s0++) sSeed.push([(rnd() - .5) * 2.4, (rnd() - .5) * 1.6, rnd()]);
  sGeo.setAttribute('position', new T.BufferAttribute(sPos, 3));
  var sMat = new T.PointsMaterial({ map: steamTex, size: 1.3, transparent: true, depthWrite: false, opacity: 0 });
  var steam = new T.Points(sGeo, sMat); root.add(steam);

  /* --- costruzione (dopo il caricamento delle immagini) --- */
  var names = ['pita', 'pollo-1', 'pollo-2', 'pollo-3', 'pollo-4', 'insalata-1', 'insalata-2', 'insalata-3', 'pomodoro-1', 'pomodoro-2', 'cipolla-1', 'cipolla-2', 'cipolla-3', 'tzatziki'];
  var ready = false;
  Promise.all(names.map(function (n) {
    return Promise.all([loadImg(src(n)), loadImg(hsrc(n)), loadImg(nsrc(n))]).then(function (r) {
      return { name: n, img: r[0], col: pixels(r[0]), h: pixels(r[1]), nt: plainTex(r[2]) };
    });
  })).then(function (list) {
    var A = {}; list.forEach(function (a) { A[a.name] = a; });
    // pita e mappa delle altezze iniziale
    var pp = buildPiece('pita', A.pita, 'pita', P, 0, 0, 0, true);
    pita = pp.g; pitaMat = pp.mat; pitaPivot = pp.pivot;
    I.forEach(function (d, n) {
      var kind = d[0].split('-')[0];
      var it = buildPiece(d[0], A[d[0]], kind, d[3] / 100 * P, (d[1] - 50) / 100 * P, (d[2] - 50) / 100 * P, -d[4] * Math.PI / 180, false);
      it.t0 = d[5]; it.t1 = d[6]; it.sauce = d[7] === 'sauce';
      it.ax = (rnd() - .5) * 9; it.az = (rnd() - .5) * 9; it.ay = (n % 2 ? 1 : -1) * (2 + rnd() * 3);
      items.push(it);
      // le patatine cadono dopo la cipolla e prima dello tzatziki
      if (n === 15) for (var f = 0; f < 14; f++) fries.push(buildFry(f, .53 + f * .0065));
    });
    paper = new T.Mesh((function () { var g = new T.CylinderGeometry(1.0, .72, 1, 56, 1, true); g.translate(0, .5, 0); return g; })(),
      new T.MeshStandardMaterial({ map: paperTexture(), roughness: .9, side: T.DoubleSide, envMapIntensity: .3 }));
    paper.rotation.z = -Math.PI / 2; paper.position.set(-2.25, W / THM, 0); paper.castShadow = true; paper.visible = false;
    root.add(paper);
    ready = true;
  }).catch(function (e) { console.warn('gyro 3d', e); });

  /* --- interfaccia --- */
  var steps = Array.prototype.slice.call(document.querySelectorAll('#steps li'));
  var bar = document.getElementById('buildBar'), pop = document.getElementById('opaPop'), cap = document.querySelector('.build-cap');
  var B = [0, .12, .3, .5, .62, .74], curStep = -1, ps = 0, last = performance.now(), visible = false, nx = 0, ny = 0;
  addEventListener('pointermove', function (e) { nx = e.clientX / innerWidth - .5; ny = e.clientY / innerHeight - .5; }, { passive: true });
  function resize() { var w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
  addEventListener('resize', resize); resize();

  var lastF = 0, tmp = [0, 0, 0];
  function applyFold(f) {
    objects.forEach(function (o) {
      var pa = o.mesh.geometry.attributes.position, arr = pa.array, rest = o.rest, pv = o.pv;
      for (var q = 0; q < arr.length; q += 3) {
        bend(rest[q], rest[q + 2], o.fill ? rest[q + 1] * (1 + f * 1.6) : rest[q + 1], f, tmp);   // il ripieno riempie la pita che si chiude
        arr[q] = tmp[0] - pv.x; arr[q + 1] = tmp[1] - pv.y; arr[q + 2] = tmp[2] - pv.z;
      }
      pa.needsUpdate = true; o.mesh.geometry.computeVertexNormals(); o.mesh.geometry.computeBoundingSphere();
    });
  }

  function frame(p, time) {
    if (!ready) { renderer.render(scene, cam); return; }
    // pita: scende ruotando e si scalda
    var pk = 1 - Math.pow(1 - seg(p, 0, .12), 3);
    pita.position.set(pitaPivot.x, pitaPivot.y + (1 - pk) * 5, pitaPivot.z); pita.rotation.set((1 - pk) * .5, (1 - pk) * -1.6, 0);
    pita.visible = p > .001;
    var heat = Math.sin(seg(p, .03, .22) * Math.PI);
    pitaMat.emissive.setRGB(.55 * heat, .2 * heat, .04 * heat); warm.intensity = heat * 1.4;

    // ingredienti che cadono e si appoggiano
    function fall(it, sauce) {
      var k = seg(p, it.t0, it.t1); it.g.visible = k > 0; if (!it.g.visible) return;
      var air = 1 - land(k);
      if (sauce) {
        var sq = k < .7 ? 1 - Math.pow(1 - k / .7, 3) : 1 + Math.sin((k - .7) / .3 * Math.PI) * .06;
        it.g.position.set(it.pivot.x, it.pivot.y + air * .5, it.pivot.z);
        it.g.scale.set(Math.max(.01, sq), Math.max(.01, sq * (k < .7 ? 1.25 - .25 * k / .7 : 1)), Math.max(.01, sq));
        it.g.rotation.set(0, 0, 0);
      } else {
        it.g.position.set(it.pivot.x, it.pivot.y + air * 5.5, it.pivot.z);
        it.g.rotation.set(air * it.ax, air * it.ay, air * it.az);
      }
    }
    items.forEach(function (it) { fall(it, it.sauce); });
    fries.forEach(function (fr) { fall(fr, false); });

    // vapore
    var sa = seg(p, .05, .14) * (1 - seg(p, .7, .8));
    sMat.opacity = .22 * sa; steam.visible = sa > 0;
    sSeed.forEach(function (q, j) { var y = (time * .2 + q[2]) % 1; sPos[j * 3] = q[0] + Math.sin(time + j) * .05; sPos[j * 3 + 1] = .3 + y * 1.6; sPos[j * 3 + 2] = q[1]; });
    sGeo.attributes.position.needsUpdate = true;

    // finale: si arrotola, entra nella carta e si alza
    var f = ease(seg(p, .76, .87)), st = ease(seg(p, .86, .97));
    if (Math.abs(f - lastF) > 1e-4) { applyFold(f); lastF = f; }
    paper.visible = st > 0; paper.scale.set(1, Math.max(.001, st * 2.2), 1);
    root.rotation.set(st * .3, st * .95 + Math.sin(time * .5) * .05 * st, st * 1.42);
    root.position.y = Math.sin(time * 1.3) * .03 * st;
    ground.position.y = lerp(0, -2.4, st);

    // telecamera
    var port = cam.aspect < 1;
    var el = lerp(1.12, .66, ease(seg(p, 0, .74))) - lerp(0, .38, ease(seg(p, .74, 1))) - ny * .05;
    var az = lerp(-.45, .25, ease(seg(p, 0, .74))) - lerp(0, .4, ease(seg(p, .74, 1))) + nx * .12;
    var r = lerp(8.4, 7.9, ease(seg(p, 0, .74))) + lerp(0, 1.8, st);
    r *= port ? 1.5 : 1;
    var ty = lerp(.1, .3, ease(seg(p, .6, .86))) - lerp(0, .25, st);
    cam.position.set(r * Math.cos(el) * Math.sin(az), ty + r * Math.sin(el), r * Math.cos(el) * Math.cos(az));
    cam.lookAt(0, ty, 0);
    renderer.render(scene, cam);
  }

  function update(now) {
    var dt = Math.min(.05, (now - last) / 1000); last = now;
    var rr = sec.getBoundingClientRect(), p = clamp(-rr.top / (rr.height - innerHeight));
    ps = reduce ? p : ps + (p - ps) * Math.min(1, dt * 6);
    var s = 0; B.forEach(function (b, i) { if (ps >= b - 1e-3) s = i; });
    if (s !== curStep) { curStep = s; steps.forEach(function (li, i) { li.classList.toggle('on', i === s); li.classList.toggle('done', i < s); }); }
    if (bar) bar.style.transform = 'scaleX(' + ps.toFixed(3) + ')';
    if (pop) pop.classList.toggle('on', ps > .93);
    if (cap) cap.style.opacity = ps > .9 ? 1 : 0;
    frame(ps, now / 1000);
  }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(sec);
  else visible = true;
  (function loop(now) { requestAnimationFrame(loop); if (visible) update(now); })(last);
  window.__gyro3d = { frame: frame, isReady: function () { return ready; } };
})();
