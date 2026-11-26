/* =========================================================
   OPA Greek Gyros – "Come nasce il tuo gyros" in 3D (Three.js)

   - Pita, carne, lattuga, pomodoro, cipolla e patatine sono modelli 3D veri
     (Sketchfab, licenze CC: vedi CREDITI.md), caricati da 3d/*.glb.
   - Gli ingredienti si appoggiano davvero gli uni sugli altri: una mappa
     delle altezze sopra la pita viene aggiornata dopo ogni pezzo e ogni
     pezzo si posa (anche inclinato) sopra ciò che è già caduto.
   - Lo tzatziki è una crema che si spande sopra il ripieno.
   - Finale: la pita si arrotola, entra nella carta e si alza in piedi.
   Se il 3D non è disponibile resta l'animazione fotografica (gyro-foto.js).
   ========================================================= */
(function () {
  'use strict';
  var T = window.THREE;
  var stage = document.getElementById('scene'), sec = document.getElementById('build');
  if (!T || !T.GLTFLoader || !stage || !sec) return;

  var GLB = window.__GLB || {};
  var glb = function (n) { return GLB[n] || ('3d/' + n + '.glb'); };
  var clamp = function (v, a, b) { return Math.min(b === undefined ? 1 : b, Math.max(a === undefined ? 0 : a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var seg = function (p, a, b) { return clamp((p - a) / (b - a)); };
  var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var land = function (t) { if (t < .72) { var k = t / .72; return k * k; } var b = (t - .72) / .28; return 1 - Math.sin(b * Math.PI) * .05; };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mob = window.matchMedia('(max-width: 820px)').matches;
  var rnd = (function () { var s = 20250; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })();
  var D2R = Math.PI / 180;

  var P = 4, W = P / 2, THM = .8 * Math.PI;      // diametro pita, mezza larghezza, angolo massimo della piega

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
  renderer.toneMappingExposure = .95;
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
  scene.add(new T.HemisphereLight(0xfff1dc, 0x1b2a4a, .45));
  var key = new T.DirectionalLight(0xffe6c4, 2.1); key.position.set(3.2, 7, 4.2); key.castShadow = true;
  key.shadow.mapSize.set(mob ? 1024 : 2048, mob ? 1024 : 2048);
  var sc = key.shadow.camera; sc.left = -3.6; sc.right = 3.6; sc.top = 3.6; sc.bottom = -3.6; sc.near = 1; sc.far = 22;
  key.shadow.bias = -.0005; key.shadow.normalBias = .02; key.shadow.radius = mob ? 5 : 7;
  scene.add(key, key.target);
  var rim = new T.DirectionalLight(0x9cc0ff, .8); rim.position.set(-5, 3, -4); scene.add(rim);
  var warm = new T.PointLight(0xffb15c, 0, 6); warm.position.set(0, 1.4, 0); scene.add(warm);
  var ground = new T.Mesh(new T.PlaneGeometry(40, 40), new T.ShadowMaterial({ opacity: .42 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

  var root = new T.Group(); root.rotation.order = 'YXZ'; scene.add(root);
  var steam;

  /* --- mappa delle altezze sopra la pita (per far appoggiare gli ingredienti) --- */
  var G = 200, SPAN = 4.6, CELL = SPAN / G, HF = new Float32Array(G * G);
  function hAt(x, z) {
    var gx = (x + SPAN / 2) / CELL - .5, gz = (z + SPAN / 2) / CELL - .5;
    var x0 = clamp(Math.floor(gx), 0, G - 2), z0 = clamp(Math.floor(gz), 0, G - 2), fx = clamp(gx - x0), fz = clamp(gz - z0);
    var a = HF[z0 * G + x0], b = HF[z0 * G + x0 + 1], c = HF[(z0 + 1) * G + x0], d = HF[(z0 + 1) * G + x0 + 1];
    return (a * (1 - fx) + b * fx) * (1 - fz) + (c * (1 - fx) + d * fx) * fz;
  }
  function hSoft(x, z, r) { return (hAt(x, z) * 2 + hAt(x + r, z) + hAt(x - r, z) + hAt(x, z + r) + hAt(x, z - r)) / 6; }
  function stamp(x, z, y, R) {
    var cx = Math.round((x + SPAN / 2) / CELL - .5), cz = Math.round((z + SPAN / 2) / CELL - .5);
    for (var j = -R; j <= R; j++) for (var i = -R; i <= R; i++) {
      var gx = cx + i, gz = cz + j; if (gx < 0 || gz < 0 || gx >= G || gz >= G) continue;
      var k = gz * G + gx; if (y > HF[k]) HF[k] = y;
    }
  }
  function stampGeo(pos, R) { for (var q = 0; q < pos.length; q += 3) stamp(pos[q], pos[q + 2], pos[q + 1], R); }

  /* --- geometria: estrazione dai modelli, pezzi separati --- */
  function bake(gltf) {                            // tutte le mesh del modello, con le trasformazioni applicate
    gltf.scene.updateMatrixWorld(true); var out = [];
    gltf.scene.traverse(function (m) {
      if (!m.isMesh) return;
      var g0 = m.geometry, g = new T.BufferGeometry();
      ['position', 'normal', 'uv'].forEach(function (a) {          // copia semplice (i modelli hanno dati intrecciati)
        var at = g0.attributes[a]; if (!at) return; var n = at.count, s = at.itemSize, arr = new Float32Array(n * s);
        for (var i = 0; i < n; i++) { arr[i * s] = at.getX(i); if (s > 1) arr[i * s + 1] = at.getY(i); if (s > 2) arr[i * s + 2] = at.getZ(i); }
        g.setAttribute(a, new T.BufferAttribute(arr, s));
      });
      if (g0.index) g.setIndex(Array.prototype.slice.call(g0.index.array));
      if (g.attributes.uv) g.setAttribute('uv2', g.attributes.uv);      // serve alla mappa di occlusione
      g.applyMatrix4(m.matrixWorld);
      if (!g.index) { var ix = []; for (var i = 0; i < g.attributes.position.count; i++) ix.push(i); g.setIndex(ix); }
      out.push({ geo: g, mat: m.material, name: (m.material && m.material.name) || '' });
    });
    return out;
  }
  function components(geo) {                       // divide una mesh in pezzi non collegati (patatine, anelli di cipolla)
    var pos = geo.attributes.position, n = pos.count, idx = geo.index.array, par = new Int32Array(n), key = {}, i;
    for (i = 0; i < n; i++) par[i] = i;
    function f(a) { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; }
    function u(a, b) { a = f(a); b = f(b); if (a !== b) par[a] = b; }
    for (i = 0; i < n; i++) { var k = Math.round(pos.getX(i) * 1e4) + ',' + Math.round(pos.getY(i) * 1e4) + ',' + Math.round(pos.getZ(i) * 1e4); if (key[k] !== undefined) u(i, key[k]); else key[k] = i; }
    for (i = 0; i < idx.length; i += 3) { u(idx[i], idx[i + 1]); u(idx[i], idx[i + 2]); }
    var groups = {};
    for (i = 0; i < idx.length; i += 3) { var r = f(idx[i]); (groups[r] = groups[r] || []).push(idx[i], idx[i + 1], idx[i + 2]); }
    return Object.keys(groups).map(function (r) {
      var tri = groups[r], map = {}, nv = 0, newIdx = [], src = [];
      tri.forEach(function (v) { if (map[v] === undefined) { map[v] = nv++; src.push(v); } newIdx.push(map[v]); });
      var g = new T.BufferGeometry();
      ['position', 'normal', 'uv'].forEach(function (a) {
        var at = geo.attributes[a]; if (!at) return; var s = at.itemSize, arr = new Float32Array(nv * s);
        src.forEach(function (v, j) { for (var c = 0; c < s; c++) arr[j * s + c] = at.array[v * s + c]; });
        g.setAttribute(a, new T.BufferAttribute(arr, s));
      });
      if (g.attributes.uv) g.setAttribute('uv2', g.attributes.uv);
      g.setIndex(newIdx); return g;
    }).filter(function (g) { return g.attributes.position.count > 12; });
  }
  function centerGeo(g) {                         // centra in x,z e appoggia il fondo a y=0
    g.computeBoundingBox(); var b = g.boundingBox;
    g.translate(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2); return g;
  }
  function flatten(g) {                           // ruota il pezzo in modo che il lato più sottile sia in verticale
    g.computeBoundingBox(); var s = g.boundingBox.getSize(new T.Vector3());
    if (s.x < s.y && s.x <= s.z) g.rotateZ(Math.PI / 2); else if (s.z < s.y && s.z <= s.x) g.rotateX(Math.PI / 2);
    return g;
  }
  function layDown(g) {                           // sdraia un pezzo allungato (patatina) lungo l'asse x
    var a = g.attributes.position.array, n = a.length / 3, c = [0, 0, 0], i, j, k;
    for (i = 0; i < n; i++) for (k = 0; k < 3; k++) c[k] += a[i * 3 + k] / n;
    var C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (i = 0; i < n; i++) for (j = 0; j < 3; j++) for (k = 0; k < 3; k++) C[j][k] += (a[i * 3 + j] - c[j]) * (a[i * 3 + k] - c[k]);
    var v = [1, .3, .2];
    for (var it = 0; it < 30; it++) { var w = [0, 0, 0]; for (j = 0; j < 3; j++) for (k = 0; k < 3; k++) w[j] += C[j][k] * v[k]; var L = Math.hypot(w[0], w[1], w[2]) || 1; v = [w[0] / L, w[1] / L, w[2] / L]; }
    g.translate(-c[0], -c[1], -c[2]);
    g.applyMatrix4(new T.Matrix4().makeRotationFromQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(v[0], v[1], v[2]), new T.Vector3(1, 0, 0))));
    return g;
  }
  function maxDim(g) { g.computeBoundingBox(); var s = g.boundingBox.getSize(new T.Vector3()); return Math.max(s.x, s.z); }

  /* --- appoggio: prova alcune inclinazioni e sceglie quella che combacia meglio con ciò che sta sotto --- */
  var objects = [];            // tutto ciò che si arrotola: { mesh, rest(pos), restN(normali), pv, fill }
  var pita, pitaMats = [], pitaPivot, items = [], paper;
  function place(geo0, mat, x, z, ry, opt) {
    opt = opt || {};
    var base = geo0.clone(); base.rotateY(ry);
    var pos0 = base.attributes.position.array, n = pos0.length / 3, step = Math.max(1, Math.floor(n / 500));
    var best = null, tilts = opt.tilts || [-.22, -.11, 0, .11, .22];
    var e = new T.Euler(), m = new T.Matrix4(), v = new T.Vector3();
    tilts.forEach(function (ax) {
      tilts.forEach(function (az) {
        m.makeRotationFromEuler(e.set(ax, 0, az));
        var off = -1e9, sum = 0, cnt = 0, tmp = [];
        for (var q = 0; q < n; q += step) {
          v.set(pos0[q * 3], pos0[q * 3 + 1], pos0[q * 3 + 2]).applyMatrix4(m);
          var h = hAt(x + v.x, z + v.z), d = h - v.y; if (d > off) off = d; tmp.push(v.y, h);
        }
        for (var k = 0; k < tmp.length; k += 2) { var gap = tmp[k] + off - tmp[k + 1]; if (gap < .12) { sum += gap; cnt++; } }
        var score = -cnt + sum * 20 + (Math.abs(ax) + Math.abs(az)) * 4;      // molti punti a contatto, poca inclinazione
        if (!best || score < best.score) best = { score: score, ax: ax, az: az, off: off };
      });
    });
    var g = base; g.applyMatrix4(m.makeRotationFromEuler(e.set(best.ax, 0, best.az)));
    g.translate(x, best.off + (opt.lift || .004), z);
    stampGeo(g.attributes.position.array, opt.stampR || 1);
    return addObject(g, mat, opt.fill !== false);
  }
  function addObject(g, mat, fill) {
    g.computeBoundingBox(); var piv = g.boundingBox.getCenter(new T.Vector3());
    if (!g.attributes.normal) g.computeVertexNormals();
    var rest = g.attributes.position.array.slice(), restN = g.attributes.normal.array.slice();
    g.translate(-piv.x, -piv.y, -piv.z);
    var mesh = new T.Mesh(g, mat); mesh.castShadow = mesh.receiveShadow = true;
    var grp = new T.Group(); grp.position.copy(piv); grp.add(mesh); root.add(grp);
    objects.push({ mesh: mesh, rest: rest, restN: restN, pv: piv.clone(), fill: fill });
    return { g: grp, pivot: piv };
  }
  function phys(m, cc, ccr) {                     // stesso materiale, con uno strato lucido (cibo fresco/umido)
    var p = new T.MeshPhysicalMaterial();
    ['map', 'normalMap', 'normalScale', 'roughnessMap', 'roughness', 'aoMap', 'aoMapIntensity', 'color', 'side', 'envMapIntensity', 'emissive', 'alphaTest', 'transparent', 'opacity'].forEach(function (k) {
      if (m[k] !== undefined && m[k] !== null) p[k] = m[k] && m[k].clone && !m[k].isTexture ? m[k].clone() : m[k];
    });
    p.metalness = 0; p.clearcoat = cc; p.clearcoatRoughness = ccr; return p;
  }
  function merge(list) {                          // unisce più geometrie in una sola
    var n = 0, idx = [], pos = [], nor = [], uv = [];
    list.forEach(function (g) {
      var a = g.attributes, c = a.position.count;
      Array.prototype.push.apply(pos, a.position.array); Array.prototype.push.apply(nor, a.normal ? a.normal.array : new Float32Array(c * 3));
      Array.prototype.push.apply(uv, a.uv ? a.uv.array : new Float32Array(c * 2));
      g.index.array.forEach(function (i) { idx.push(i + n); }); n += c;
    });
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setAttribute('uv2', g.attributes.uv); g.setIndex(idx); return g;
  }
  function tuneMat(m, o) {
    m = m.clone(); m.envMapIntensity = o.env || .35;
    if (o.color) m.color.multiply(new T.Color(o.color[0], o.color[1], o.color[2]));
    if (o.rough !== undefined) m.roughness = o.rough;
    m.metalness = 0; m.vertexTangents = false; if (m.map) m.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return m;
  }

  /* --- tzatziki: crema che si spande sopra il ripieno --- */
  var tzTex = (function () {
    var c = document.createElement('canvas'); c.width = c.height = 512; var g = c.getContext('2d');
    g.fillStyle = '#f1eee2'; g.fillRect(0, 0, 512, 512);
    for (var i = 0; i < 900; i++) {                // cetriolo e aneto
      var x = Math.random() * 512, y = Math.random() * 512, r = Math.random();
      g.fillStyle = r < .5 ? 'rgba(120,150,70,.55)' : r < .8 ? 'rgba(70,110,40,.6)' : 'rgba(200,210,170,.5)';
      g.save(); g.translate(x, y); g.rotate(Math.random() * 3); g.fillRect(0, 0, 1 + Math.random() * 5, 1 + Math.random() * 2); g.restore();
    }
    var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.wrapS = t.wrapT = T.RepeatWrapping; return t;
  })();
  var tzMat = new T.MeshStandardMaterial({ map: tzTex, roughness: .32, metalness: 0, envMapIntensity: .5, color: 0xffffff });
  function sauce(x, z, rx, rz, hgt, ry) {
    var S = mob ? 34 : 44, n = (S + 1) * (S + 1), top = new Float32Array(n * 3), uv = new Float32Array(n * 2), idx = [];
    var cr = Math.cos(ry), sr = Math.sin(ry), ph = rnd() * 6, mean = 0, mc = 0;
    for (var a1 = 0; a1 < 6.28; a1 += .5) for (var r1 = 0; r1 <= 1; r1 += .25) { mean += hSoft(x + Math.cos(a1) * rx * r1, z + Math.sin(a1) * rz * r1, .2); mc++; }
    mean /= mc;                                     // la crema si posa su un livello medio, morbido
    for (var j = 0, q = 0; j <= S; j++) for (var i = 0; i <= S; i++, q++) {
      var u = i / S * 2 - 1, v = j / S * 2 - 1, ang = Math.atan2(v, u), rr = Math.sqrt(u * u + v * v);
      var edge = 1 + .16 * Math.sin(ang * 3 + ph) + .09 * Math.sin(ang * 7 - ph);    // bordo irregolare
      var k = clamp(rr / edge), lx = u * rx, lz = v * rz;
      if (rr > edge) { lx *= edge / rr; lz *= edge / rr; }
      var wx = x + lx * cr + lz * sr, wz = z - lx * sr + lz * cr;
      var dome = Math.pow(1 - k * k, .6) * hgt * (1 + .12 * Math.sin(u * 9 + ph) * Math.cos(v * 7));
      top[q * 3] = wx; top[q * 3 + 1] = mean * .75 + hSoft(wx, wz, .3) * .25 + dome + .02; top[q * 3 + 2] = wz;
      uv[q * 2] = u * .7; uv[q * 2 + 1] = v * .7;
    }
    for (j = 0; j < S; j++) for (i = 0; i < S; i++) { var a = j * (S + 1) + i, b = a + S + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(top, 3)); g.setAttribute('uv', new T.BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    stampGeo(top, 1);
    return addObject(g, tzMat, true);
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
  steam = new T.Points(sGeo, sMat); root.add(steam);

  /* --- resa fotografica: profondità di campo, toni caldi, vignettatura, grana ---
     scena → immagine con antialiasing; profondità → immagine a metà risoluzione;
     un passaggio finale sfoca ciò che è fuori fuoco come un obiettivo.
     Se il dispositivo non regge, si torna alla resa diretta. */
  var post = null, postOn = true, focusDist = 8, slow = 0, frames = 0;
  (function () {
    var gl2 = renderer.capabilities.isWebGL2;
    var mk = function (w, h, ms) {
      var o = { minFilter: T.LinearFilter, magFilter: T.LinearFilter, format: T.RGBAFormat, type: gl2 ? T.HalfFloatType : T.UnsignedByteType };
      var rt = ms && gl2 && T.WebGLMultisampleRenderTarget ? new T.WebGLMultisampleRenderTarget(w, h, o) : new T.WebGLRenderTarget(w, h, o);
      if (rt.samples !== undefined) rt.samples = mob ? 2 : 4;
      return rt;
    };
    var depthMat = new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking, side: T.DoubleSide });
    var quad = new T.Mesh(new T.PlaneGeometry(2, 2), new T.ShaderMaterial({
      uniforms: {
        tCol: { value: null }, tDep: { value: null }, res: { value: new T.Vector2(1, 1) }, focus: { value: 8 },
        aper: { value: .45 }, maxB: { value: 9 }, near: { value: .1 }, far: { value: 100 }, time: { value: 0 }
      },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
      fragmentShader: [
        '#include <packing>',
        'uniform sampler2D tCol; uniform sampler2D tDep; uniform vec2 res; uniform float focus, aper, maxB, near, far, time;',
        'varying vec2 vUv;',
        'float dist(vec2 uv){ float d = unpackRGBAToDepth(texture2D(tDep, uv)); return -perspectiveDepthToViewZ(d, near, far); }',
        'float coc(float z){ return clamp(abs(z - focus) / z * aper * 6.0, 0.0, 1.0); }',
        'float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + time) * 43758.5453); }',
        'void main(){',
        '  float c0 = coc(dist(vUv));',
        '  vec4 acc = texture2D(tCol, vUv); float wsum = 1.0;',
        '  float R = c0 * maxB;',
        '  if (R > .5) {',
        '    for (int i = 0; i < ' + (mob ? 14 : 22) + '; i++) {',
        '      float fi = float(i) + .5, r = sqrt(fi / ' + (mob ? '14.0' : '22.0') + ') * R, a = fi * 2.39996;',
        '      vec2 uv = vUv + vec2(cos(a), sin(a)) * r / res;',
        '      float cs = coc(dist(uv)) * maxB;',
        '      float w = smoothstep(r - 1.0, r + 1.0, max(cs, c0 * .5) + 1.0);',      // limita gli aloni sui bordi a fuoco
        '      acc += texture2D(tCol, uv) * w; wsum += w;',
        '    }',
        '  }',
        '  acc /= wsum;',
        '  float a = acc.a; vec3 col = a > 0.001 ? acc.rgb / a : vec3(0.);',
        '  col *= vec3(1.045, 1.0, .93);',                                   // luce calda da foto di cibo
        '  col = LinearTosRGB(vec4(col, 1.)).rgb;',
        '  col = mix(col, col * col * (3. - 2. * col), .22);',                 // un po\' di contrasto
        '  float l = dot(col, vec3(.299, .587, .114)); col = mix(vec3(l), col, 1.07);',
        '  vec2 q = vUv - .5; col *= mix(.82, 1., smoothstep(.85, .25, length(q * vec2(1.1, 1.))));',
        '  col += (hash(vUv * res) - .5) * .028;',                            // grana
        '  gl_FragColor = vec4(clamp(col, 0., 1.) * a, a);',
        '}'
      ].join('\n'),
      depthTest: false, depthWrite: false, transparent: true, blending: T.CustomBlending,
      blendSrc: T.OneFactor, blendDst: T.ZeroFactor
    }));
    quad.frustumCulled = false;
    var qScene = new T.Scene(); qScene.add(quad);
    var qCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    post = {
      col: mk(2, 2, true), dep: new T.WebGLRenderTarget(2, 2, { minFilter: T.NearestFilter, magFilter: T.NearestFilter }),
      size: function () {
        var v = renderer.getDrawingBufferSize(new T.Vector2());
        this.col.setSize(v.x, v.y); var dq = mob ? 1 : 0; this.dep.setSize(Math.max(2, v.x >> dq), Math.max(2, v.y >> dq));
        quad.material.uniforms.res.value.copy(v);
        quad.material.uniforms.maxB.value = Math.round(v.y / (mob ? 110 : 95));
      },
      draw: function (time) {
        var u = quad.material.uniforms;
        u.tCol.value = this.col.texture; u.tDep.value = this.dep.texture; u.focus.value = focusDist;
        u.near.value = cam.near; u.far.value = cam.far; u.time.value = time % 10;
        renderer.setClearColor(0x000000, 0);
        renderer.shadowMap.autoUpdate = true;
        renderer.setRenderTarget(this.col); renderer.clear(); renderer.render(scene, cam);
        // profondità (senza ombre, terreno e vapore)
        renderer.shadowMap.autoUpdate = false;
        var gv = ground.visible, sv = steam.visible; ground.visible = false; steam.visible = false;
        scene.overrideMaterial = depthMat; renderer.setClearColor(0xffffff, 1);
        renderer.setRenderTarget(this.dep); renderer.clear(); renderer.render(scene, cam);
        scene.overrideMaterial = null; ground.visible = gv; steam.visible = sv; renderer.setClearColor(0x000000, 0);
        renderer.shadowMap.autoUpdate = true;
        renderer.setRenderTarget(null); renderer.clear(); renderer.render(qScene, qCam);
      }
    };
  })();
  function draw(time) {
    var t0 = performance.now();
    if (post && postOn) post.draw(time || 0); else renderer.render(scene, cam);
    // se il dispositivo fatica (molti fotogrammi lenti), si torna alla resa diretta
    if (postOn && ready && ++frames > 20) { if (performance.now() - t0 > 34) slow++; else slow = Math.max(0, slow - .5); if (slow > 25) postOn = false; }
  }


  /* --- costruzione (dopo il caricamento dei modelli) --- */
  var ready = false, loader = new T.GLTFLoader();
  function load(n) { return new Promise(function (res, rej) { loader.load(glb(n), res, undefined, rej); }); }
  Promise.all([load('pita'), load('kebab'), load('patatine'), load('pollo')]).then(function (r) {
    /* pita */
    var pm = bake(r[0]);
    var pg = flatten(pm[0].geo); centerGeo(pg); var ps = P / maxDim(pg); pg.scale(ps, ps * .42, ps);
    pg.computeBoundingBox(); pg.translate(0, -pg.boundingBox.max.y * .55, 0);
    stampGeo(pg.attributes.position.array, 2);
    var pmat = tuneMat(pm[0].mat, { rough: .82, env: .3, color: [1.0, .85, .64] }); pitaMats.push(pmat);
    pitaTop = hAt(0, 0);
    var pp = addObject(pg, pmat, false); pita = pp.g; pitaPivot = pp.pivot;

    /* parti del kebab: carne, lattuga, pomodoro, cipolla */
    var parts = { Patty: [], Lettuce: [], Tomato: [], Onion: [] };
    bake(r[1]).forEach(function (o) { if (parts[o.name]) parts[o.name].push(o); });
    var pl = bake(r[3]);                            // pollo grigliato vero (scansione), unito in un solo pezzo
    parts.Patty = [{ geo: merge(pl.map(function (o) { return o.geo; })), mat: pl[0].mat }];
    function prep(o, size, sy) { var g = flatten(o.geo.clone()); centerGeo(g); var s = size / maxDim(g); g.scale(s, s * (sy || 1), s); return g; }
    var meatMat = phys(tuneMat(parts.Patty[0].mat, { color: [1.1, .9, .66], rough: .48, env: .35 }), .25, .45);
    var letMat = phys(tuneMat(parts.Lettuce[0].mat, { rough: .42, env: .45 }), .55, .3);         // foglia fresca, lucida
    var tomMat = phys(tuneMat(parts.Tomato[0].mat, { rough: .28, env: .55 }), .85, .18);         // polpa bagnata
    var oniMat = tuneMat(parts.Onion[0].mat, { color: [.92, .62, .86], rough: .35, env: .5 });
    if (oniMat.side !== undefined) oniMat.side = T.DoubleSide;

    // [tipo, indice pezzo, x, z, rotazione°, dimensione, inizio, fine]
    var L = [
      ['Patty', 0, -.75, -.2, -32, 1.25, .13, .19], ['Patty', 1, .05, -.42, 18, 1.3, .15, .21], ['Patty', 2, .8, -.15, -14, 1.15, .17, .23],
      ['Patty', 3, -.5, .38, 38, 1.15, .19, .25], ['Patty', 0, .3, .3, -42, 1.2, .21, .27], ['Patty', 2, .95, .42, 8, 1.0, .23, .29],
      ['Lettuce', 0, -.85, -.25, 28, 1.25, .30, .36], ['Lettuce', 1, .1, .4, -22, 1.3, .32, .38], ['Lettuce', 0, .85, -.2, 62, 1.15, .34, .40],
      ['Tomato', 0, -.55, 0, 0, .82, .36, .42], ['Tomato', 1, .15, -.25, 40, .82, .38, .44], ['Tomato', 0, .75, .15, 12, .78, .40, .46], ['Tomato', 1, -.15, .45, 80, .74, .42, .48]
    ];
    L.forEach(function (d) {
      var src = parts[d[0]][d[1] % parts[d[0]].length];
      var g = prep(src, d[5], d[0] === 'Lettuce' ? .5 : d[0] === 'Patty' ? .7 : 1);
      if (d[0] !== 'Patty' && rnd() > .5) { g.rotateZ(Math.PI); centerGeo(g); }                      // a volte capovolto
      var mat = d[0] === 'Patty' ? meatMat : d[0] === 'Lettuce' ? letMat : tomMat;
      var it = place(g, mat, d[2], d[3] + .25, d[4] * D2R, { stampR: d[0] === 'Lettuce' ? 1 : 1 });
      it.t0 = d[6]; it.t1 = d[7]; it.ax = (rnd() - .5) * 9; it.az = (rnd() - .5) * 9; it.ay = (rnd() > .5 ? 1 : -1) * (2 + rnd() * 3);
      items.push(it);
    });

    // cipolla: anelli separati
    var rings = [];
    parts.Onion.forEach(function (o) { rings = rings.concat(components(o.geo)); });
    for (var i = 0; i < 7 && rings.length; i++) {
      var rg = rings[i % rings.length].clone(); flatten(rg); centerGeo(rg);
      var rs = (.32 + rnd() * .14) / maxDim(rg); rg.scale(rs, rs, rs);
      var it = place(rg, oniMat, -.9 + i * .3 + (rnd() - .5) * .2, .2 + (rnd() - .5) * .7, rnd() * 6.28);
      it.t0 = .44 + i * .014; it.t1 = it.t0 + .05; it.ax = (rnd() - .5) * 9; it.az = (rnd() - .5) * 9; it.ay = (rnd() - .5) * 6;
      items.push(it);
    }

    // patatine: una per una
    var fm = bake(r[2]), fries = components(fm[0].geo);
    var friesMat = tuneMat(fm[0].mat, { color: [1.0, .68, .36], rough: .55, env: .35 });
    friesMat.emissive = new T.Color(0x3a1a00); friesMat.emissiveIntensity = .25;
    var flen = fries.map(function (g) { g.computeBoundingBox(); var z = g.boundingBox.getSize(new T.Vector3()); return Math.max(z.x, z.y, z.z); });
    var fmed = flen.slice().sort(function (a, b) { return a - b; })[flen.length >> 1];
    fries = fries.filter(function (g, i) { return flen[i] > fmed * .6; });           // solo patatine intere, niente frammenti
    fries.sort(function () { return rnd() - .5; });
    for (i = 0; i < Math.min(16, fries.length); i++) {
      var fg = fries[i]; layDown(fg); centerGeo(fg); var fl = (.62 + rnd() * .28) / maxDim(fg); fg.scale(fl, fl, fl);
      var ft = place(fg, friesMat, -1.0 + rnd() * 2.0, -.2 + rnd() * .85, rnd() * Math.PI, { tilts: [-.08, 0, .08] });
      ft.t0 = .53 + i * .0058; ft.t1 = ft.t0 + .05; ft.ax = (rnd() - .5) * 8; ft.az = (rnd() - .5) * 8; ft.ay = (rnd() - .5) * 6;
      items.push(ft);
    }

    // tzatziki
    var tz1 = sauce(0, .25, .6, .42, .2, .2); tz1.t0 = .64; tz1.t1 = .72; tz1.sauce = true; items.push(tz1);
    var tz2 = sauce(-.65, .15, .34, .26, .14, 2.4); tz2.t0 = .67; tz2.t1 = .74; tz2.sauce = true; items.push(tz2);

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
  function resize() { var w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); if (post) post.size(); }
  addEventListener('resize', resize); resize();

  /* --- la piega: ogni punto (x,z) ad altezza h si avvolge attorno all'asse x;
         il ripieno si gonfia quanto basta per riempire la pita che si chiude --- */
  var lastF = 0, fitK = 1, pitaTop = .2;
  function applyFold(f) {
    if (fitK === 1) {                               // quanto comprimere il ripieno per farlo stare nella pita chiusa
      var mx = 0; objects.forEach(function (o) { if (!o.fill) return; for (var q = 1; q < o.rest.length; q += 3) if (o.rest[q] > mx) mx = o.rest[q]; });
      fitK = Math.min(.999, (W / THM * 1.55 - pitaTop) / Math.max(.01, mx - pitaTop));
    }
    objects.forEach(function (o) {
      var pa = o.mesh.geometry.attributes.position, na = o.mesh.geometry.attributes.normal, arr = pa.array, nar = na.array, rest = o.rest, rn = o.restN, pv = o.pv;
      var R = f > 1e-4 ? W / (f * THM) : 0, kf = lerp(1, fitK, f);
      for (var q = 0; q < arr.length; q += 3) {
        var x = rest[q], h = rest[q + 1], z = rest[q + 2];
        if (o.fill) h = pitaTop + (h - pitaTop) * kf;
        if (!R) { arr[q] = x - pv.x; arr[q + 1] = h - pv.y; arr[q + 2] = z - pv.z; nar[q] = rn[q]; nar[q + 1] = rn[q + 1]; nar[q + 2] = rn[q + 2]; continue; }
        var th = z / R, s = Math.sin(th), c = Math.cos(th);
        arr[q] = x - pv.x; arr[q + 1] = R * (1 - c) + h * c - pv.y; arr[q + 2] = R * s - h * s - pv.z;
        var ny = rn[q + 1], nz = rn[q + 2];
        nar[q] = rn[q]; nar[q + 1] = ny * c + nz * s; nar[q + 2] = -ny * s + nz * c;
      }
      pa.needsUpdate = true; na.needsUpdate = true; o.mesh.geometry.computeBoundingSphere();
    });
  }

  function frame(p, time) {
    if (!ready) { draw(time); return; }
    // pita: scende ruotando e si scalda
    var pk = 1 - Math.pow(1 - seg(p, 0, .12), 3);
    pita.position.set(pitaPivot.x, pitaPivot.y + (1 - pk) * 5, pitaPivot.z); pita.rotation.set((1 - pk) * .5, (1 - pk) * -1.6, 0);
    pita.visible = p > .001;
    var heat = Math.sin(seg(p, .03, .22) * Math.PI);
    pitaMats.forEach(function (m) { m.emissive.setRGB(.5 * heat, .18 * heat, .03 * heat); }); warm.intensity = heat * 1.4;

    // ingredienti che cadono e si appoggiano
    items.forEach(function (it) {
      var k = seg(p, it.t0, it.t1); it.g.visible = k > 0; if (!it.g.visible) return;
      var air = 1 - land(k);
      if (it.sauce) {
        var sq = k < .7 ? 1 - Math.pow(1 - k / .7, 3) : 1 + Math.sin((k - .7) / .3 * Math.PI) * .05;
        it.g.position.set(it.pivot.x, it.pivot.y + air * .5, it.pivot.z);
        it.g.scale.set(Math.max(.01, sq), Math.max(.01, sq * (k < .7 ? 1.12 - .12 * k / .7 : 1)), Math.max(.01, sq));
      } else {
        it.g.position.set(it.pivot.x, it.pivot.y + air * 5.5, it.pivot.z);
        it.g.rotation.set(air * it.ax, air * it.ay, air * it.az);
      }
    });

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
    focusDist = cam.position.distanceTo(new T.Vector3(0, ty + .25 * (1 - st), 0));
    draw(time);
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
