/* Protezioni di base, eseguite prima di tutto il resto.
   1) Il sito funziona solo in HTTPS: una visita in http viene spostata subito su https.
   2) Il sito non puo' essere mostrato dentro pagine di altri (difesa dal "clickjacking"). */
(function () {
  var l = window.location, h = l.hostname;
  if (l.protocol === 'http:' && h !== 'localhost' && h !== '127.0.0.1') {
    l.replace('https://' + l.host + l.pathname + l.search + l.hash);
    return;
  }
  if (window.top !== window.self) {
    document.documentElement.style.display = 'none';
    try { window.top.location.replace(l.href); } catch (e) {}
  }
})();
