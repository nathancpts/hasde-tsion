/* Hasdé Tsion — appli TV
   Portage fidèle de src/components/TVSky.tsx et de la vue TV de src/routes/index.tsx
   (soleil canvas, ciel, nuages, lune, pluie, neige, orage, cartes, colonne de droite).
   Données : https://hasde-tsion.com/api/public/tv toutes les 10 min. ES2017, sans framework. */
(function () {
  'use strict';

  var params = new URLSearchParams(location.search);
  var CONFIG = {
    site: 'https://hasde-tsion.com',
    api: 'https://hasde-tsion.com/api/public/tv',
    weather: 'https://api.open-meteo.com/v1/forecast?latitude=48.885&longitude=2.269&current=weather_code,cloud_cover,temperature_2m&timezone=Europe%2FParis',
    tz: 'Europe/Paris',
    refreshMs: 10 * 60 * 1000,     // comme le site : nouvelles infos toutes les 10 min
    weatherMs: 30 * 60 * 1000,     // comme TVSky : météo toutes les 30 min
    staleMs: 25 * 60 * 1000,
    sunFps: +(params.get('sunfps') || 30), // TVSky dessine le soleil à 30 i/s ; baisser à 15 si une télé peine
    video: params.get('video') !== '0',
    bigLiveMaxMs: 5 * 60 * 1000,
    wx: params.get('wx'),           // test : ?wx=95 (orage), 63 (pluie), 73 (neige), 45 (brouillard)
    updateCheckMs: 5 * 60 * 1000    // vérifie toutes les 5 min si une nouvelle version a été publiée
  };
  // Réglages à distance : version.json peut contenir { "sunFps": 15, "video": false, "refreshMinutes": 10 }
  (function (r) {
    if (!r) return;
    if (r.sunFps > 0 && !params.get('sunfps')) CONFIG.sunFps = +r.sunFps;
    if (r.video === false) CONFIG.video = false;
    if (r.refreshMinutes > 0) CONFIG.refreshMs = r.refreshMinutes * 60 * 1000;
    if (r.api) CONFIG.api = String(r.api);
  })(window.TV_REMOTE);

  var $ = function (id) { return document.getElementById(id); };
  var stage = $('stage');

  /* ===== Échelle 1920×1080 + léger décalage anti-marquage ===== */
  var shift = { x: 0, y: 0 };
  // Taille réellement visible : certaines WebView de TV annoncent une page de 1920 px
  // mais n'en affichent que 960 (zoom ×2). On prend la plus petite des mesures disponibles.
  function viewSize() {
    var w = window.innerWidth || 1920, h = window.innerHeight || 1080;
    var vv = window.visualViewport;
    if (vv && vv.width > 0 && vv.height > 0) { w = Math.min(w, vv.width); h = Math.min(h, vv.height); }
    var de = document.documentElement;
    if (de && de.clientWidth > 0 && de.clientHeight > 0) { w = Math.min(w, de.clientWidth); h = Math.min(h, de.clientHeight); }
    return { w: w, h: h };
  }
  function fit() {
    var v = viewSize(), w = v.w, h = v.h, s = Math.min(w / 1920, h / 1080);
    stage.style.transform = 'translate(' + ((w - 1920 * s) / 2 + shift.x) + 'px,' + ((h - 1080 * s) / 2 + shift.y) + 'px) scale(' + s + ')';
  }
  window.addEventListener('resize', fit);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', fit);
  window.addEventListener('load', fit);
  setTimeout(fit, 500); setTimeout(fit, 3000);
  fit();

  /* ===== Utilitaires (TVSky) ===== */
  var clamp = function (v, a, b) { if (a == null) a = 0; if (b == null) b = 1; return Math.max(a, Math.min(b, v)); };
  var toM = function (t) { var p = String(t || '').split(':').map(Number); return (p[0] || 0) * 60 + (p[1] || 0); };
  var pad2 = function (n) { return String(n).padStart(2, '0'); };
  var fmt = function (m) { return pad2(Math.floor(m / 60) % 24) + ':' + pad2(Math.floor(m) % 60); };
  var partsFmt = new Intl.DateTimeFormat('fr-FR', { timeZone: CONFIG.tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'short', hour12: false });
  var DOW = { 'dim.': 0, 'lun.': 1, 'mar.': 2, 'mer.': 3, 'jeu.': 4, 'ven.': 5, 'sam.': 6 };
  function paris() {
    var p = {}; partsFmt.formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    var h = parseInt(p.hour, 10) % 24, mi = parseInt(p.minute, 10), s = parseInt(p.second, 10);
    var wd = DOW[String(p.weekday).toLowerCase()];
    if (wd == null) wd = new Date().getDay();
    return { iso: p.year + '-' + p.month + '-' + p.day, h: h, m: mi, dow: wd, mf: h * 60 + mi + s / 60, min: h * 60 + mi };
  }
  var nowMF = function () { return paris().mf; };
  var D0 = 6 * 60, D1 = 21 * 60 + 30;
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  function arr(v) { return Array.isArray(v) ? v : []; }

  var HE = {
    minha: 'מנחה', arvit: 'ערבית', chaharit: 'שחרית', "chah'arit": 'שחרית', 'cha’harit': 'שחרית', shaharit: 'שחרית',
    "plag hamin'ha": 'פלג המנחה', 'plag haminha': 'פלג המנחה', neila: 'נעילה', 'néila': 'נעילה',
    'lever du soleil': 'הנץ', chekia: 'שקיעה', sheqyia: 'שקיעה', 'nuit de r. tam': 'רבנו תם',
    allumage: 'הדלקת נרות', 'allumer les bougies': 'הדלקת נרות', 'entrée': 'כניסה', sortie: 'יציאה'
  };
  function heOf(l) { var k = l.toLowerCase(); var keys = Object.keys(HE); for (var i = 0; i < keys.length; i++) if (k.indexOf(keys[i]) === 0) return HE[keys[i]]; return ''; }
  function kindOf(l) {
    return /allum|entrée|sortie|chabbat/i.test(l) ? 'Chabbat'
      : /chaharit|chah['’]arit|shaharit|minha|arvit|plag|néila|neila/i.test(l) ? 'Office'
      : /lever|hanetz|limite|chema|shema|tefila|hatsot|midi|chekia|sheq|coucher|nuit|étoiles|etoiles|aube|alot/i.test(l) ? 'Zman'
      : 'Horaire';
  }
  function wxLabel(c) {
    return c >= 95 ? 'Orage'
      : [71, 73, 75, 77, 85, 86].indexOf(c) >= 0 ? 'Neige'
      : [65, 67, 82].indexOf(c) >= 0 ? 'Forte pluie'
      : [51, 53, 55, 56, 57].indexOf(c) >= 0 ? 'Bruine'
      : [61, 63, 66, 80, 81].indexOf(c) >= 0 ? 'Pluie'
      : [45, 48].indexOf(c) >= 0 ? 'Brouillard'
      : c === 3 ? 'Couvert'
      : c >= 1 ? 'Partiellement nuageux'
      : 'Ensoleillé';
  }

  /* ===== Palettes du ciel (TVSky) ===== */
  var PAL = {
    night: { top: [5, 13, 32], mid: [9, 24, 58], pink: [12, 32, 70], hor: [18, 44, 92], ground: [4, 10, 24], haze: [24, 58, 110, 0.35], cloud: [110, 130, 170, 0.10] },
    dusk: { top: [22, 42, 104], mid: [92, 82, 140], pink: [214, 96, 122], hor: [240, 138, 86], ground: [34, 22, 44], haze: [255, 150, 88, 0.6], cloud: [255, 176, 132, 0.55] },
    day: { top: [22, 74, 168], mid: [70, 136, 220], pink: [126, 180, 238], hor: [172, 208, 244], ground: [24, 46, 90], haze: [205, 228, 250, 0.5], cloud: [255, 255, 255, 0.5] }
  };
  var PAL_KEYS = ['top', 'mid', 'pink', 'hor', 'ground', 'haze', 'cloud'];
  function mixPal(day, dusk) {
    var wDusk = clamp(dusk), wDay = clamp(day) * (1 - wDusk), wNight = clamp(1 - wDay - wDusk), out = {};
    PAL_KEYS.forEach(function (k) {
      out[k] = PAL.night[k].map(function (v, i) { return Math.round(v * wNight + PAL.dusk[k][i] * wDusk + PAL.day[k][i] * wDay); });
    });
    out.haze[3] = +(PAL.night.haze[3] * wNight + PAL.dusk.haze[3] * wDusk + PAL.day.haze[3] * wDay).toFixed(3);
    out.cloud[3] = +(PAL.night.cloud[3] * wNight + PAL.dusk.cloud[3] * wDusk + PAL.day.cloud[3] * wDay).toFixed(3);
    return out;
  }
  function skyFor(m, SR, SS) {
    var day = clamp(Math.min((m - (SR - 40)) / 80, ((SS + 30) - m) / 80));
    var dusk = Math.max(0, 1 - Math.abs(m - SS) / 45) + Math.max(0, 1 - Math.abs(m - SR) / 45) * 0.8;
    return { day: day, dusk: dusk };
  }
  function sunPhase(m, SR, SS) {
    if (m < SR - 30) return 'Avant l\'aube';
    if (m < SR + 20) return 'Lever du soleil';
    if (m < SS - 60) return 'Jour';
    if (m < SS + 5) return 'Coucher du soleil';
    if (m < SS + 40) return 'Crépuscule';
    return 'Nuit';
  }

  /* ===== Lune : phase astronomique réelle (TVSky) ===== */
  function moonData(date) {
    var synodic = 29.530588853, epoch = Date.UTC(2000, 0, 6, 18, 14);
    var phase = (((date.getTime() - epoch) / 86400000 / synodic) % 1 + 1) % 1;
    return { phase: phase, illumination: (1 - Math.cos(2 * Math.PI * phase)) / 2 };
  }
  function moonSVG(phase) {
    var r = 46, cx = 50, cy = 50, terminator = -Math.cos(2 * Math.PI * phase), left = [], right = [];
    for (var i = 0; i <= 80; i++) {
      var y = cy - r + (2 * r * i) / 80, hw = Math.sqrt(Math.max(0, r * r - (y - cy) * (y - cy)));
      var xl = cx - hw, xr = cx + hw, xt = cx + terminator * hw;
      if (phase < 0.5) { left.push([xt, y]); right.push([xr, y]); } else { left.push([xl, y]); right.push([xt, y]); }
    }
    var pts = left.concat(right.reverse());
    var d = 'M' + pts.map(function (p) { return p[0].toFixed(2) + ',' + p[1].toFixed(2); }).join(' L') + 'Z';
    return '<svg viewBox="0 0 100 100"><defs><radialGradient id="tvmg" cx="38%" cy="34%" r="76%"><stop offset="0" stop-color="#ffffff"/><stop offset=".72" stop-color="#e8eef9"/><stop offset="1" stop-color="#b8c8e5"/></radialGradient><clipPath id="tvmc"><path d="' + d + '"/></clipPath></defs>' +
      '<circle cx="50" cy="50" r="47.5" fill="#172b51" stroke="#d9e8ff" stroke-width="2.2"/><path d="' + d + '" fill="url(#tvmg)"/>' +
      '<g clip-path="url(#tvmc)" fill="#899bb9" opacity=".28"><ellipse cx="37" cy="39" rx="10" ry="7"/><ellipse cx="61" cy="58" rx="9" ry="7"/><circle cx="45" cy="67" r="4"/><circle cx="67" cy="34" r="3"/></g></svg>';
  }

  /* ===== État du ciel ===== */
  var SR = toM('07:43'), SS = toM('19:32');     // valeurs par défaut de TVSky, remplacées par les données
  var G = null, SUN = null, RAIN = 0, SNOW = 0, STORM = false, wx = null;
  var defaultClouds = [{ l: 4, t: 14, w: 520, h: 110, dur: 52, delay: 0 }, { l: 38, t: 30, w: 420, h: 90, dur: 64, delay: -11 }, { l: 62, t: 10, w: 600, h: 120, dur: 46, delay: -22 }, { l: 80, t: 36, w: 360, h: 80, dur: 58, delay: -33 }];

  function sunAt(mm, g, s0, s1) {
    var sp = (mm - s0) / (s1 - s0);
    return { x: g.W * clamp((mm - D0) / (D1 - D0), -0.02, 1.02), y: g.HY - g.AMP * Math.sin(Math.PI * sp), sp: sp, alt: Math.sin(Math.PI * clamp(sp, -1, 2)) };
  }

  // Étoiles
  (function () {
    var box = $('stars');
    for (var i = 0; i < 90; i++) {
      var s = el('i', 'tv-star');
      s.style.left = (Math.random() * 100) + '%'; s.style.top = (Math.random() * 62) + '%';
      s.style.opacity = String(0.3 + Math.random() * 0.7); s.style.transform = 'scale(' + (0.5 + Math.random()) + ')';
      box.appendChild(s);
    }
  })();
  $('moon').innerHTML = moonSVG(moonData(new Date()).phase);

  function renderClouds(list) {
    var box = $('clouds'); clear(box);
    list.forEach(function (c) {
      var i = el('i', 'tv-cloud');
      i.style.left = c.l + '%'; i.style.top = c.t + '%'; i.style.width = c.w + 'px'; i.style.height = c.h + 'px';
      i.style.animationDelay = c.delay + 's'; i.style.setProperty('--t', c.dur + 's');
      box.appendChild(i);
    });
  }
  renderClouds(defaultClouds);

  /* --- soleil photoréaliste (canvas) : copie de drawSun --- */
  var scv = $('sun'), sctx = scv.getContext('2d'), sunDpr = 1;
  function drawSun(t) {
    var c = sctx; if (!c) return;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, scv.width, scv.height);
    var g = G, S = SUN;
    if (!g || !S || S.below >= 1) return;
    c.setTransform(sunDpr, 0, 0, sunDpr, 0, 0);
    var ox = 0, oy = 0;
    var x = S.x + ox, y = S.y + oy, w = S.warm, a = 1 - S.below, T = t / 1000;
    var breath = 1 + Math.sin(T * 0.7) * 0.03, flick = 1 + Math.sin(T * 9.1) * 0.012 + Math.sin(T * 13.7) * 0.008;
    var R0 = 27 * (1 + w * 0.35);
    var kG = Math.round(236 - w * 96), kB = Math.round(188 - w * 150);
    var rgba = function (r, gg, b, al) { return 'rgba(' + r + ',' + gg + ',' + b + ',' + Math.max(0, Math.min(1, al)).toFixed(3) + ')'; };
    var rg = function (rx, ry, rr, stops) { var gr = c.createRadialGradient(rx, ry, 0, rx, ry, rr); stops.forEach(function (s) { gr.addColorStop(s[0], s[1]); }); return gr; };
    var fillR = function (rx, ry, rr) { c.fillRect(rx - rr, ry - rr, rr * 2, rr * 2); };
    var i;
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = rg(x, y, 620 * breath, [[0, rgba(255, 248, 226, 0.46 * a * (1 - w * 0.4))], [0.3, rgba(255, 238, 205, 0.16 * a)], [1, rgba(255, 220, 180, 0)]]); fillR(x, y, 620 * breath);
    c.fillStyle = rg(x, y, 250 * breath, [[0, rgba(255, kG, kB, 0.6 * a)], [0.35, rgba(255, Math.round(kG * 0.82), Math.round(kB * 0.55), 0.24 * a)], [1, rgba(255, 140, 70, 0)]]); fillR(x, y, 250 * breath);
    c.save(); c.translate(x, y); c.scale(1, 0.022 + w * 0.01);
    c.fillStyle = rg(0, 0, 560, [[0, rgba(255, 252, 240, (0.55 + w * 0.35) * a * flick)], [0.5, rgba(255, 236, 200, 0.18 * a)], [1, rgba(255, 220, 170, 0)]]); fillR(0, 0, 560); c.restore();
    var NR = 36, Lr = (300 + w * 220) * breath, hw0 = 0.028;
    c.save(); c.translate(x, y); c.scale(1, 1 - w * 0.35);
    c.fillStyle = rg(0, 0, Lr, [[0, rgba(255, 250, 232, 0.9)], [0.25, rgba(255, 244, 214, 0.45)], [1, rgba(255, 230, 190, 0)]]);
    for (i = 0; i < NR; i++) {
      var ph = i * 2.399, ang = T * 0.035 + (i * Math.PI * 2) / NR + Math.sin(T * 0.27 + ph) * 0.03;
      var len = Lr * (0.55 + 0.45 * (Math.sin(T * 0.9 + ph) * 0.5 + 0.5)) * (i % 3 === 0 ? 1.25 : 1);
      var hw = hw0 * (0.7 + 0.6 * (Math.sin(T * 0.6 + ph * 1.3) * 0.5 + 0.5));
      c.globalAlpha = (0.05 + 0.16 * (Math.sin(T * 1.3 + ph * 0.7) * 0.5 + 0.5)) * a * (1 - w * 0.35);
      c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(ang - hw) * len, Math.sin(ang - hw) * len); c.lineTo(Math.cos(ang + hw) * len, Math.sin(ang + hw) * len); c.closePath(); c.fill();
    }
    c.globalAlpha = 1; c.restore();
    var L = (175 - w * 80) * flick, rot = T * 0.05;
    for (i = 0; i < 3; i++) {
      c.save(); c.translate(x, y); c.rotate(rot + (i * Math.PI) / 3);
      var g1 = c.createLinearGradient(-L, 0, L, 0); g1.addColorStop(0, rgba(255, 250, 235, 0)); g1.addColorStop(0.5, rgba(255, 252, 240, 0.42 * a * (1 - w * 0.3))); g1.addColorStop(1, rgba(255, 250, 235, 0));
      c.fillStyle = g1; c.fillRect(-L, -0.9, L * 2, 1.8);
      var g2 = c.createLinearGradient(-L * 0.6, 0, L * 0.6, 0); g2.addColorStop(0, rgba(255, 240, 210, 0)); g2.addColorStop(0.5, rgba(255, 245, 220, 0.16 * a * (1 - w * 0.3))); g2.addColorStop(1, rgba(255, 240, 210, 0));
      c.fillStyle = g2; c.fillRect(-L * 0.6, -4, L * 1.2, 8); c.restore();
    }
    c.save(); c.translate(x, y); c.scale(1, 1 - w * 0.16);
    var fr = 1.6 + w * 1.2;
    [[-fr, 0, 255, 0, 0], [0, 0, 0, Math.round(255 * (1 - w * 0.3)), 0], [fr, 0, 0, 0, Math.round(255 * (1 - w * 0.62))]].forEach(function (q) {
      var dx = q[0], dy = q[1], r = q[2], gg = q[3], b = q[4];
      c.fillStyle = rg(dx, dy, R0 * 1.55, [[0, rgba(r, gg, b, 0.95 * a)], [0.62, rgba(r, gg, b, 0.95 * a)], [0.75, rgba(r, gg, b, 0.35 * a)], [1, rgba(r, gg, b, 0)]]); fillR(dx, dy, R0 * 1.55);
    });
    c.fillStyle = rg(0, 0, R0 * 2.6, [[0, rgba(255, 255, 250, 0.9 * a * (1 - w * 0.55))], [0.3, rgba(255, 250, 230, 0.5 * a * (1 - w * 0.4))], [1, rgba(255, kG, kB, 0)]]); fillR(0, 0, R0 * 2.6);
    c.restore();
    var cx0 = g.W / 2 + ox, cy0 = g.H / 2 + oy, vis = clamp(S.alt * 3) * a * (1 - w * 0.6);
    [[1.3, 44, [120, 190, 255], 0.18, true], [1.65, 16, [255, 180, 120], 0.16, false], [2.05, 74, [150, 255, 200], 0.1, true], [2.5, 26, [200, 160, 255], 0.14, false], [3.0, 120, [255, 200, 140], 0.06, true]].forEach(function (q) {
      var k = q[0], r = q[1], col = q[2], al = q[3], ring = q[4];
      var gx = x + (cx0 - x) * k, gy = y + (cy0 - y) * k;
      c.fillStyle = ring
        ? rg(gx, gy, r, [[0, rgba(col[0], col[1], col[2], 0)], [0.78, rgba(col[0], col[1], col[2], 0)], [0.9, rgba(col[0], col[1], col[2], al * vis)], [1, rgba(col[0], col[1], col[2], 0)]])
        : rg(gx, gy, r, [[0, rgba(col[0], col[1], col[2], al * vis)], [1, rgba(col[0], col[1], col[2], 0)]]);
      fillR(gx, gy, r);
    });
    c.globalCompositeOperation = 'source-over';
  }

  /* --- ciel : copie de updateSky --- */
  function updateSky(mNow) {
    var g = G; if (!g) return;
    var s0 = SR, s1 = SS, s = sunAt(mNow, g, s0, s1);
    var warm = clamp(1 - Math.max(s.alt, 0) / 0.4);
    var below = s.alt < 0 ? clamp(-s.alt * 4) : 0;
    SUN = { x: s.x, y: s.y, warm: warm, alt: s.alt, below: below };
    if (s.sp > 0) {
      var n = 90, k = Math.min(s.sp, 1), d = '';
      for (var i = 0; i <= n; i++) { var q = sunAt(s0 + ((s1 - s0) * k * i) / n, g, s0, s1); d += (i ? ' L' : 'M') + q.x.toFixed(1) + ',' + q.y.toFixed(1); }
      $('done').setAttribute('d', d);
    } else $('done').setAttribute('d', '');
    var sk = skyFor(mNow, s0, s1), day = sk.day, dusk = sk.dusk;
    var pal = mixPal(day, dusk);
    var sxp = ((s.x / g.W) * 100).toFixed(1), syp = ((s.y / g.H) * 100).toFixed(1), hp = 78;
    var glowA = (0.55 * clamp(s.alt + 0.35) * (1 - below * 0.5)).toFixed(3);
    $('skyBg').style.background = 'radial-gradient(60% 45% at ' + sxp + '% ' + syp + '%, rgba(255,' + Math.round(240 - warm * 60) + ',' + Math.round(200 - warm * 120) + ',' + glowA + '), transparent 65%), linear-gradient(180deg, rgb(' + pal.top + ') 0%, rgb(' + pal.mid + ') ' + (hp * 0.5).toFixed(1) + '%, rgb(' + pal.pink + ') ' + (hp * 0.86).toFixed(1) + '%, rgb(' + pal.hor + ') ' + hp + '%, rgb(' + pal.hor + ') 100%)';
    var hz = pal.haze;
    $('haze').style.background = 'linear-gradient(to top, rgba(' + hz[0] + ',' + hz[1] + ',' + hz[2] + ',0) 0%, rgba(' + hz[0] + ',' + hz[1] + ',' + hz[2] + ',' + hz[3] + ') 55%, rgba(' + hz[0] + ',' + hz[1] + ',' + hz[2] + ',0) 100%)';
    var cl = $('clouds');
    cl.style.setProperty('--cr', String(pal.cloud[0])); cl.style.setProperty('--cg', String(pal.cloud[1]));
    cl.style.setProperty('--cb', String(pal.cloud[2])); cl.style.setProperty('--ca', String(pal.cloud[3]));
    cl.style.transform = 'translateX(' + (-clamp((mNow - D0) / (D1 - D0)) * 120).toFixed(1) + 'px)';
    var near = clamp(1 - Math.abs(s.y - g.HY) / (g.H * 0.32)) * (1 - below);
    var refl = $('refl'); refl.style.left = s.x.toFixed(1) + 'px'; refl.style.opacity = (near * (0.5 + warm * 0.5)).toFixed(3);
    var nf = clamp(1 - day * 1.7 - dusk * 0.7);
    $('stars').style.opacity = nf.toFixed(3);
    var nightLen = 1440 - s1 + s0;
    var np = clamp(((mNow - s1 + 1440) % 1440) / nightLen);
    var mArc = Math.sin(Math.PI * np);
    var sunUp = mNow > s0 && mNow < s1;
    var moon = $('moon');
    moon.style.opacity = sunUp ? '0' : (Math.min(1, 0.55 + mArc * 0.5) * (1 - day * 0.25)).toFixed(3);
    moon.style.transform = 'translate(' + (g.W * (0.82 - np * 0.52)).toFixed(1) + 'px, ' + (g.HY + 40 - (g.HY * 0.92 + 40) * mArc).toFixed(1) + 'px) rotate(' + (-18 + np * 30).toFixed(1) + 'deg)';
  }

  /* --- mesure de la zone du soleil --- */
  function measure() {
    var z = $('arcZone'), w = z.clientWidth, h = Math.max(160, z.clientHeight);
    if (w < 10 || h < 10) return;
    G = { W: w, H: h, HY: h * 0.78, AMP: h * 0.78 * 0.62 };
    $('arcSvg').setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    sunDpr = Math.min(1, 1920 / w, 1080 / h);
    scv.width = Math.max(1, Math.round(w * sunDpr)); scv.height = Math.max(1, Math.round(h * sunDpr));
    // Sur le site, l'arc en pointillés est tracé au montage avec les horaires par défaut (07:43 → 19:32),
    // ce qui le décale de l'arc doré : on garde le même rendu.
    var gs = toM('07:43'), ge = toM('19:32'), pts = [];
    for (var i = 0; i <= 120; i++) { var p = sunAt(gs + ((ge - gs) * i) / 120, G, gs, ge); pts.push(p.x.toFixed(1) + ',' + p.y.toFixed(1)); }
    $('guide').setAttribute('d', 'M' + pts.join(' L'));
    $('haze').style.top = (G.HY - 110) + 'px';
    $('refl').style.top = (G.HY + 2) + 'px';
    updateSky(nowMF());
  }

  /* --- météo réelle de Neuilly-sur-Seine : copie de applyWx --- */
  function applyWx(code, cover, temp) {
    var has = function (l) { return l.indexOf(code) >= 0; };
    var rain = has([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]);
    var heavy = has([65, 67, 82, 95, 96, 99]), light = has([51, 53, 56, 61, 80]);
    var snow = has([71, 73, 75, 77, 85, 86]), fog = has([45, 48]), storm = code >= 95;
    var c = Math.max(cover / 100, rain || snow ? 0.8 : 0, fog ? 0.6 : 0);
    RAIN = rain ? (heavy ? 1 : light ? 0.3 : 0.6) : 0;
    SNOW = snow ? 1 : 0;
    STORM = storm;
    var dim = rain || snow ? 0.55 : c > 0.85 ? 0.8 : c > 0.6 ? 0.9 : 1;
    var n = Math.round(4 + c * 14 + (rain || snow ? 8 : 0)), clouds = [];
    for (var i = 0; i < n; i++) clouds.push({ l: (i * 97) / n + Math.random() * 6, t: Math.random() * 40, w: 340 + Math.random() * 360, h: 80 + Math.random() * 70, dur: 40 + Math.random() * 30, delay: -i * 7 });
    wx = { code: code, temp: temp, grey: rain || snow ? 0.75 : c > 0.5 ? (c - 0.5) * 0.9 : 0, fog: fog ? 1 : 0, dim: dim, storm: storm };
    renderClouds(clouds);
    $('wxGrey').style.opacity = String(wx.grey);
    $('wxFog').style.opacity = String(wx.fog);
    $('rain').style.display = RAIN ? '' : 'none';
    $('snow').style.display = SNOW ? '' : 'none';
    $('flash').style.display = storm ? '' : 'none';
    $('clouds').style.filter = wx.grey > 0.5 ? 'brightness(.8) saturate(.6)' : '';
    scv.style.opacity = String(dim);
    var wEl = $('weather');
    wEl.textContent = 'Actuellement · ' + wxLabel(code) + (temp != null ? ' · ' + Math.round(temp) + ' °C' : '');
    wEl.hidden = false;
  }
  function loadWeather() {
    if (CONFIG.wx != null) { var forced = +CONFIG.wx; applyWx(forced, 90, 12); return; }
    fetchJson(CONFIG.weather, 10000).then(function (d) {
      if (d && d.current) applyWx(d.current.weather_code, d.current.cloud_cover, d.current.temperature_2m != null ? d.current.temperature_2m : null);
    }).catch(function () {});
  }

  /* --- pluie (canvas) : copie --- */
  var rainCv = $('rain'), rainCx = rainCv.getContext('2d'), drops = [], rW = 0, rH = 0;
  var rnd = function (a, b) { return a + Math.random() * (b - a); };
  function mkDrop() {
    var z = Math.random();
    return { x: Math.random() * rW, y: Math.random() * rH, z: z, l: rnd(6, 34) * (0.55 + z * 0.75), v: rnd(7, 26) * (0.7 + z * 0.6), w: rnd(0.4, 1.6), a: rnd(0.05, 0.32), sl: rnd(0.05, 0.2), ph: Math.random() * 6.28 };
  }
  function rainFrame() {
    if (!RAIN) { if (drops.length) { rainCx.clearRect(0, 0, rW, rH); drops = []; } return; }
    if (rainCv.clientWidth !== rW || rainCv.clientHeight !== rH) { rW = rainCv.width = rainCv.clientWidth; rH = rainCv.height = rainCv.clientHeight; }
    var want = Math.round(((rW * rH) / 9000) * RAIN);
    while (drops.length < want) drops.push(mkDrop());
    if (drops.length > want) drops.length = want;
    rainCx.clearRect(0, 0, rW, rH);
    rainCx.lineCap = 'round';
    for (var i = 0; i < drops.length; i++) {
      var d = drops[i];
      d.y += d.v; d.x -= d.v * d.sl + Math.sin(d.ph + d.y * 0.01) * 0.3;
      if (d.y > rH) { d.y = -d.l - rnd(0, 40); d.x = Math.random() * rW; }
      rainCx.strokeStyle = 'rgba(205,222,246,' + d.a.toFixed(2) + ')';
      rainCx.lineWidth = d.w;
      rainCx.beginPath(); rainCx.moveTo(d.x, d.y); rainCx.lineTo(d.x + d.l * d.sl, d.y - d.l); rainCx.stroke();
    }
  }

  /* --- neige (canvas) : copie --- */
  var snowCv = $('snow'), snowCx = snowCv.getContext('2d'), sW = 0, sH = 0, F = [], sLast = 0, wind = 0, windT = 0, spr = {};
  var R = Math.random;
  function sprite(r) {
    var k = Math.round(r * 2); if (spr[k]) return spr[k];
    var cnv = document.createElement('canvas'), s = Math.ceil(r * 4) + 2; cnv.width = cnv.height = s;
    var g = cnv.getContext('2d');
    if (g) { var mc = s / 2, gr = g.createRadialGradient(mc, mc, 0, mc, mc, mc); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(0.35, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s); }
    return (spr[k] = cnv);
  }
  function mkFlake(top) { var z = R(), r = 1 + z * z * 5; return { x: R() * sW, y: top ? -10 - R() * 40 : R() * sH, r: r, z: z, vy: (18 + z * 55) * (0.8 + R() * 0.4), a: 0.25 + z * 0.7, ph: R() * 6.28, fq: 0.4 + R() * 1.2, amp: 6 + R() * 22, halo: z > 0.85 && R() < 0.5 }; }
  function snowSize() { sW = snowCv.width = snowCv.clientWidth; sH = snowCv.height = snowCv.clientHeight; F = []; var n = Math.round(Math.min(200, Math.max(120, (sW * sH) / 9000))); for (var i = 0; i < n; i++) F.push(mkFlake(false)); }
  function snowFrame(t) {
    if (!SNOW) { if (sW) snowCx.clearRect(0, 0, sW, sH); return; }
    if (!sW || snowCv.clientWidth !== sW) snowSize();
    var dt = Math.min(0.05, (t - (sLast || t)) / 1000); sLast = t;
    windT -= dt;
    if (windT <= 0) { windT = 4 + R() * 6; wind = (R() - 0.4) * 30; }
    var wv = wind * 0.5 + Math.sin(t / 7000) * 12;
    snowCx.clearRect(0, 0, sW, sH);
    for (var i = 0; i < F.length; i++) {
      var f = F[i];
      f.y += f.vy * dt; f.ph += f.fq * dt; f.x += wv * (0.4 + f.z) * dt;
      var x = f.x + Math.sin(f.ph) * f.amp;
      if (f.y > sH + 10) { var nf = mkFlake(true); for (var k in nf) f[k] = nf[k]; }
      if (f.x < -40) f.x += sW + 80; else if (f.x > sW + 40) f.x -= sW + 80;
      var s = sprite(f.r);
      snowCx.globalAlpha = f.a;
      snowCx.drawImage(s, x - s.width / 2, f.y - s.height / 2);
      if (f.halo) { snowCx.globalAlpha = 0.12; snowCx.drawImage(s, x - s.width * 1.3, f.y - s.width * 1.3, s.width * 2.6, s.width * 2.6); }
    }
    snowCx.globalAlpha = 1;
  }

  /* --- éclairs discrets (orage) : copie --- */
  (function () {
    var cv = $('flash'), cx = cv.getContext('2d');
    function strike() {
      if (cv.style.display === 'none') return;
      var W = (cv.width = cv.clientWidth), H = (cv.height = cv.clientHeight);
      var seq = [1, 0.35, 0.7, 0, 0.45, 0], k = 0;
      (function fr() {
        cx.clearRect(0, 0, W, H);
        var o = seq[k];
        if (o) {
          var g = cx.createLinearGradient(0, 0, 0, H);
          g.addColorStop(0, 'rgba(235,242,255,' + (o * 0.42).toFixed(2) + ')');
          g.addColorStop(0.6, 'rgba(215,228,255,' + (o * 0.22).toFixed(2) + ')');
          g.addColorStop(1, 'rgba(215,228,255,' + (o * 0.08).toFixed(2) + ')');
          cx.fillStyle = g; cx.fillRect(0, 0, W, H);
        }
        if (++k < seq.length) setTimeout(fr, 55); else cx.clearRect(0, 0, W, H);
      })();
    }
    (function next() {
      setTimeout(function () { strike(); if (Math.random() < 0.25) setTimeout(strike, 420); next(); }, 3000 + Math.random() * 6000);
    })();
  })();

  /* ===== Défilement doux en boucle (AutoScrollLoop) ===== */
  function AutoLoop(viewport, speed) {
    this.vp = viewport; this.track = viewport.querySelector('.loop-track'); this.inner = viewport.querySelector('.loop-inner');
    this.speed = speed; this.pos = 0; this.h = 0; this.loop = false; this.clone = null;
  }
  AutoLoop.prototype.refresh = function () {
    if (this.clone) { this.track.removeChild(this.clone); this.clone = null; }
    this.pos = 0; this.track.style.transform = 'translate3d(0,0,0)';
    this.h = this.inner.offsetHeight;
    this.loop = this.h > this.vp.clientHeight + 2;
    if (this.loop) { this.clone = this.inner.cloneNode(true); this.clone.removeAttribute('id'); this.clone.setAttribute('aria-hidden', 'true'); this.track.appendChild(this.clone); }
  };
  AutoLoop.prototype.step = function (dt) {
    if (!this.loop) return;
    this.pos += this.speed * (dt / 1000);
    if (this.h > 0 && this.pos >= this.h) this.pos -= this.h;
    this.track.style.transform = 'translate3d(0,' + (-this.pos) + 'px,0)';
  };
  var etudeLoop = new AutoLoop($('etudeLoop'), 9), hayomLoop = new AutoLoop($('hayomLoop'), 14);

  /* ===== Boucle d'animation unique (soleil 30 i/s, ciel toutes les 2 s, pluie, neige, défilements) ===== */
  var lastSun = 0, lastSky = 0, lastT = 0;
  function loop(t) {
    if (!document.hidden) {
      var dt = Math.min(t - (lastT || t), 100); lastT = t;
      if (t - lastSun >= 1000 / CONFIG.sunFps) { lastSun = t; drawSun(t); }
      if (t - lastSky > 2000) { lastSky = t; updateSky(nowMF()); }
      rainFrame(); snowFrame(t);
      etudeLoop.step(dt); hayomLoop.step(dt);
    }
    requestAnimationFrame(loop);
  }

  /* ===== Données ===== */
  var data = null, lastOk = 0;
  function fetchJson(url, ms) {
    var ctrl = window.AbortController ? new AbortController() : null;
    var tm = setTimeout(function () { if (ctrl) ctrl.abort(); }, ms || 15000);
    return fetch(url, { cache: 'no-store', signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { clearTimeout(tm); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  }
  function toMinTop(hm) { var mm = /^(\d{1,2}):(\d{2})/.exec(String(hm || '')); return mm ? +mm[1] * 60 + +mm[2] : null; }
  function rawToday() { return arr(data && data.zmanim).map(function (z) { return { label: z.label, value: z.time || z.value }; }); }
  function currentShabbat(iso) { var l = arr(data && data.shabbat); for (var i = 0; i < l.length; i++) if (l[i].satDate >= iso) return l[i]; return null; }

  // Même calcul que todayTimes dans la vue TV du site
  function todayTimes(now) {
    var raw = rawToday(), dow = now.dow, sh = currentShabbat(now.iso);
    var entryTime = sh && sh.candle || null, exitTime = sh && sh.havdalah || null;
    var tzeit = (raw.filter(function (t) { return t.label === 'Sortie des étoiles'; })[0] || {}).value;
    var weekdayTimes = raw.filter(function (t) { return !/entr[ée]|sortie|bougies|havdal|fin du chabbat/i.test(t.label); })
      .concat(!raw.some(function (t) { return /arvit/i.test(t.label); }) && tzeit ? [{ label: 'Arvit', value: tzeit }] : []);
    var minha = (raw.filter(function (t) { return t.label === 'Minha'; })[0] || {}).value;
    var community = arr(data && data.offices && data.offices.aujourdhui);
    var base = community.length ? community.map(function (t) { return { label: t.label, value: t.value || t.time }; })
      : dow === 5 ? [].concat(minha ? [{ label: 'Minha', value: minha }] : [], entryTime ? [{ label: 'Entrée de Chabbat', value: entryTime }] : [])
      : dow === 6 ? [{ label: 'Cha’harit samedi', value: '09:15' }].concat(minha ? [{ label: 'Minha samedi', value: minha }] : [], exitTime ? [{ label: 'Sortie de Chabbat', value: exitTime }] : [])
      : weekdayTimes;
    var extra = [].concat(dow === 5 && entryTime ? [{ label: 'Entrée de Chabbat', value: entryTime }] : [], dow === 6 && exitTime ? [{ label: 'Sortie de Chabbat', value: exitTime }] : [],
      raw.filter(function (t) { return /chekia|sheq|coucher|sortie des [ée]toiles|tset|lever|chaharit|cha.harit/i.test(t.label); }));
    var norm = function (s) { return s.toLowerCase().replace(/samedi/g, '').replace(/[’'\s]/g, ''); };
    var merged = base.slice();
    extra.forEach(function (t) {
      if (!merged.some(function (m) { return norm(m.label) === norm(t.label) || (/entr/i.test(m.label) && /entr/i.test(t.label)) || (/sortie de/i.test(m.label) && /sortie de/i.test(t.label)); })) merged.push(t);
    });
    return merged.sort(function (a, b) { var x = toMinTop(a.value), y = toMinTop(b.value); return (x == null ? 9999 : x) - (y == null ? 9999 : y); });
  }
  // Le vendredi, cartes du samedi (« Samedi · Chabbat »)
  function tomorrowTimes(now) {
    if (now.dow !== 5) return null;
    var sh = currentShabbat(now.iso), list = [];
    var pro = data && data.offices && data.offices.prochains, sat = sh && sh.satDate;
    if (pro && sat && pro[sat] && arr(pro[sat].times).length) list = arr(pro[sat].times).map(function (t) { return { label: t.label, value: t.value || t.time }; });
    else list = [{ label: 'Chaharit', value: '09:15' }].concat(sh && sh.havdalah ? [{ label: 'Sortie', value: sh.havdalah }] : []);
    return list.filter(function (t) { return /^\d{1,2}:\d{2}/.test(t.value); })
      .map(function (t) { return { label: 'Sam. ' + t.label.replace(/\s*samedi/i, ''), value: t.value }; });
  }

  /* ===== En-tête ===== */
  var lastClock = '';
  function renderClock(hhmm) {
    var box = $('clock');
    if (box.childNodes.length !== hhmm.length) { clear(box); lastClock = ''; }
    for (var i = 0; i < hhmm.length; i++) {
      var ch = hhmm.charAt(i);
      if (lastClock.charAt(i) === ch && box.childNodes[i]) continue;
      var node;
      if (ch === ':') node = el('span', 'sep', ':');
      else { node = el('span', 'd'); node.appendChild(el('span', null, ch)); }
      if (box.childNodes[i]) box.replaceChild(node, box.childNodes[i]); else box.appendChild(node);
    }
    lastClock = hhmm;
  }
  var GEM = [[400, 'ת'], [300, 'ש'], [200, 'ר'], [100, 'ק'], [90, 'צ'], [80, 'פ'], [70, 'ע'], [60, 'ס'], [50, 'נ'], [40, 'מ'], [30, 'ל'], [20, 'כ'], [19, 'טו'], [10, 'י'], [9, 'ט'], [8, 'ח'], [7, 'ז'], [6, 'ו'], [5, 'ה'], [4, 'ד'], [3, 'ג'], [2, 'ב'], [1, 'א']];
  function toGematria(n) {
    var rest = n % 1000, out = '';
    GEM.forEach(function (g) { while (rest >= g[0]) { out += g[1]; rest -= g[0]; } });
    if (out.length === 1) return out + '׳';
    return out.slice(0, -1) + '״' + out.slice(-1);
  }
  var HEB_MONTHS = { nisan: 1, iyar: 2, sivan: 3, tamuz: 4, tammuz: 4, av: 5, elul: 6, tishri: 7, tishrei: 7, heshvan: 8, cheshvan: 8, marcheshvan: 8, kislev: 9, tevet: 10, shevat: 11, adar: 12, 'adar i': 12, 'adar 1': 12, 'adar ii': 13, 'adar 2': 13 };
  var MONTHS_FR = { 1: 'Nissan', 2: 'Iyar', 3: 'Sivan', 4: 'Tamouz', 5: 'Av', 6: 'Eloul', 7: 'Tichri', 8: 'Hechvan', 9: 'Kislev', 10: 'Tévèt', 11: 'Chevat', 12: 'Adar I', 13: 'Adar II' };
  function renderDates() {
    var d = new Date();
    $('dateFr').textContent = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: CONFIG.tz });
    try {
      var parts = new Intl.DateTimeFormat('he-u-ca-hebrew', { day: 'numeric', month: 'long', year: 'numeric', timeZone: CONFIG.tz }).formatToParts(d);
      var get = function (t) { var x = parts.filter(function (p) { return p.type === t; })[0]; return x ? x.value : ''; };
      var heWeekday = d.toLocaleDateString('he-u-ca-hebrew', { weekday: 'long', timeZone: CONFIG.tz });
      $('dateHe').textContent = heWeekday + ', ' + get('day') + ' ' + get('month') + ' ' + toGematria(parseInt(get('year') || '0', 10));
    } catch (e) { $('dateHe').textContent = (data && data.date && (data.date.hebrewHe || data.date.hebrew)) || ''; }
    try {
      var en = new Intl.DateTimeFormat('en-u-ca-hebrew', { day: 'numeric', month: 'long', year: 'numeric', timeZone: CONFIG.tz }).formatToParts(d);
      var g2 = function (t) { var x = en.filter(function (p) { return p.type === t; })[0]; return x ? x.value : ''; };
      var mo = HEB_MONTHS[g2('month').toLowerCase()];
      $('hayomDate').textContent = mo ? Number(g2('day')) + ' ' + MONTHS_FR[mo] + ' ' + Number(g2('year')) : '';
    } catch (e) { $('hayomDate').textContent = ''; }
  }
  function renderHead(now) {
    var greet = now.dow === 5 || now.dow === 6;
    $('greeting').hidden = !greet;
    var p = data && data.parasha, d = data && data.date;
    var fr = (p && p.nom) || (d && d.parasha) || '', he = (d && d.parashaHe) || '';
    $('parashaFr').textContent = fr; $('parashaHe').textContent = he; $('parashaHe').hidden = !he;
    $('parasha').hidden = !fr;
  }

  /* ===== Cartes horaires (uniquement les horaires à venir) ===== */
  var cardsSig = '';
  function renderCards(now) {
    var m = now.mf, events = data ? todayTimes(now) : [], tomorrow = data ? tomorrowTimes(now) : null;
    var evMin = events.map(function (e) { return { label: e.label, value: e.value, min: toM(e.value) }; });
    var visible = evMin.filter(function (e) { return e.min > m - 1; }).slice(0, 5);
    var cards = visible.concat(tomorrow || []).slice(0, 9);
    var sig = JSON.stringify(cards) + '|' + visible.length;
    if (sig === cardsSig) return; cardsSig = sig;
    var box = $('cards'); clear(box);
    box.style.gridTemplateColumns = 'repeat(' + Math.max(1, cards.length) + ', minmax(0,1fr))';
    var nToday = Math.min(visible.length, cards.length), nTom = cards.length - nToday;
    var head = function (txt, span, start) {
      var h = el('div', 'cards-head'); h.style.gridColumn = start + ' / span ' + span;
      h.appendChild(el('span', null, txt)); h.appendChild(el('span')); box.appendChild(h);
    };
    if (nToday > 0 && nTom > 0) head('Aujourd\'hui', nToday, 1);
    if (nTom > 0) head('Samedi · Chabbat', nTom, nToday + 1);
    cards.forEach(function (e, i) {
      var cur = i === 0 && visible.length > 0;
      var raw = e.label.replace(/^Sam\.\s*/, '');
      var parts = raw.split(' · '), name0 = parts[0], note = parts.slice(1).join(' · ');
      var name = name0.replace(/^Entrée de Chabbat$/i, 'Entrée').replace(/^Sortie de Chabbat$/i, 'Sortie');
      var office = kindOf(name0) === 'Office' || kindOf(e.label) === 'Office';
      var he = heOf(name0) || heOf(e.label);
      var c = el('div', 'card' + (cur ? ' cur' : '') + (office ? ' office' : ''));
      c.style.gridColumn = String(i + 1);
      var kind = el('span', 'c-kind'); kind.appendChild(el('span', null, kindOf(name0)));
      if (cur) kind.appendChild(el('span', 'c-badge', 'Prochain'));
      c.appendChild(kind);
      var strong = el('strong', 'c-name', name);
      if (he) { var hs = el('span', 'font-hebrew', he); hs.setAttribute('dir', 'rtl'); strong.appendChild(hs); }
      c.appendChild(strong);
      c.appendChild(el('span', 'c-note', note));
      c.appendChild(el('div', 'c-time', e.value));
      box.appendChild(c);
    });
  }

  /* ===== Colonne de droite ===== */
  function renderSeouda() {
    var box = $('seoudaList'); clear(box);
    var dons = arr(data && data.seouda);
    if (!dons.length) { box.appendChild(el('p', 'don-empty', 'Aucune donation pour le moment.')); return; }
    dons.forEach(function (d) {
      var row = el('div', 'don'); row.appendChild(el('span', 'don-name', d.donateur || ''));
      if (d.dedicace) row.appendChild(el('span', 'don-ded', d.dedicace));
      box.appendChild(row);
    });
  }
  var etudeSig = '', hayomSig = '';
  function renderEtude() {
    var pc = (data && data.parasha) || {}, sig = JSON.stringify(pc);
    if (sig === etudeSig) return; etudeSig = sig;
    var body = $('etudeBody'); clear(body);
    if (pc.intro) body.appendChild(el('p', 'p-intro', pc.intro));
    arr(pc.blocs).forEach(function (b) {
      var bl = el('div', 'p-bloc');
      if (b.titre) bl.appendChild(el('p', 'p-title', b.titre));
      arr(b.paragraphes).forEach(function (t) { bl.appendChild(el('p', 'p-para', t)); });
      if (arr(b.puces).length) { var ul = el('ul', 'p-list'); arr(b.puces).forEach(function (t) { ul.appendChild(el('li', null, t)); }); bl.appendChild(ul); }
      body.appendChild(bl);
    });
    etudeLoop.refresh();
  }
  function renderHayom() {
    var h = data && data.hayomYom, sig = h ? h.fr || '' : '';
    $('hayom').hidden = !h;
    if (sig === hayomSig) return; hayomSig = sig;
    var body = $('hayomBody'); clear(body);
    if (h) body.appendChild(el('div', 'h-text', h.fr || ''));
    hayomLoop.refresh();
  }

  /* ===== Live du Kotel (KotelLive) ===== */
  var video = $('video'), player = $('player'), msg = $('playerMsg'), hls = null, liveOn = false, retryTimer = null, watchdog = null, lastTime = -1, stalled = 0, mediaRetries = 0, status = 'loading';
  function setStatus(s) { status = s; msg.hidden = s === 'playing'; msg.textContent = s === 'error' ? 'Live momentanément indisponible' : 'Connexion au live…'; }
  function playV() { var p = video.play(); if (p && p.catch) p.catch(function () {}); }
  function teardown() {
    if (watchdog) { clearInterval(watchdog); watchdog = null; }
    if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
    if (hls) { try { hls.destroy(); } catch (e) {} hls = null; }
    try { video.pause(); } catch (e) {}
    video.removeAttribute('src'); try { video.load(); } catch (e) {}
  }
  function retry() {
    if (!liveOn || retryTimer) return;
    if (status !== 'playing') setStatus('loading');
    retryTimer = setTimeout(function () { retryTimer = null; if (liveOn) startLive(); }, 3000);
  }
  function startLive() {
    teardown(); if (!liveOn) return;
    var src = (data && data.kotel && data.kotel.liveUrl) || '/api/public/kotel';
    var url = /^https?:/.test(src) ? src : CONFIG.site + src;
    lastTime = -1; stalled = 0; mediaRetries = 0;
    if (video.canPlayType('application/vnd.apple.mpegurl')) { video.src = url; playV(); }
    else if (window.Hls && window.Hls.isSupported()) {
      var Hls = window.Hls;
      var inst = new Hls({ liveDurationInfinity: true, lowLatencyMode: false, liveSyncDurationCount: 4, maxBufferLength: 30, manifestLoadingMaxRetry: 3, levelLoadingMaxRetry: 3, fragLoadingMaxRetry: 4 });
      hls = inst;
      inst.loadSource(url); inst.attachMedia(video);
      inst.on(Hls.Events.MANIFEST_PARSED, playV);
      inst.on(Hls.Events.ERROR, function (_, d) {
        if (!d.fatal) return;
        if (d.type === Hls.ErrorTypes.MEDIA_ERROR) { inst.recoverMediaError(); return; }
        if (d.type === Hls.ErrorTypes.NETWORK_ERROR && mediaRetries++ < 1) { inst.startLoad(); return; }
        try { inst.destroy(); } catch (e) {} hls = null; retry();
      });
    } else { setStatus('error'); return; }
    // Certaines TV ne signalent pas une coupure HLS : on vérifie que l'image avance réellement.
    watchdog = setInterval(function () {
      if (video.paused) { playV(); return; }
      if (video.readyState < 2 || video.currentTime === lastTime) stalled += 1; else stalled = 0;
      lastTime = video.currentTime;
      if (stalled >= 4) retry();
    }, 7000);
  }
  video.addEventListener('playing', function () { stalled = 0; mediaRetries = 0; setStatus('playing'); });
  video.addEventListener('error', function () { retry(); });

  // Live masqué du vendredi 12 h au dimanche 00 h 01, comme sur le site
  function noLiveAt(now) { return (now.dow === 5 && now.h >= 12) || now.dow === 6 || (now.dow === 0 && now.h === 0 && now.m < 1); }
  function isShabbatNow(now) {
    var sh = currentShabbat(now.iso), entry = sh ? toMinTop(sh.candle) : null, exit = sh ? toMinTop(sh.havdalah) : null;
    return (now.dow === 5 && entry != null && now.min >= entry) || (now.dow === 6 && (exit == null || now.min < exit));
  }
  function updateLive(now) {
    var show = CONFIG.video && !noLiveAt(now);
    $('liveBar').hidden = !show; $('thumb').hidden = !show;
    if (show && !liveOn) { liveOn = true; setStatus('loading'); startLive(); }
    else if (!show && liveOn) { liveOn = false; teardown(); setBig(false); }
  }

  /* --- Afficher en grand : touche OK ; le même lecteur passe dans le cadre --- */
  var bigTimer = null;
  function setBig(on) {
    clearTimeout(bigTimer);
    var big = $('bigLive');
    if (on && !liveOn) return;
    big.hidden = !on;
    if (on) {
      $('bigShabbat').hidden = !isShabbatNow(paris());
      $('bigFrame').insertBefore(player, $('bigFrame').firstChild);
      bigTimer = setTimeout(function () { setBig(false); }, CONFIG.bigLiveMaxMs);
    } else if (player.parentNode !== $('thumb')) $('thumb').insertBefore(player, $('thumb').firstChild);
    playV();
  }
  window.tvKey = function (k) { if (k === 'ok') setBig($('bigLive').hidden); };
  window.tvBack = function () { if (!$('bigLive').hidden) { setBig(false); return true; } return false; };
  document.addEventListener('keydown', function (e) { if (e.key === 'Enter') window.tvKey('ok'); if (e.key === 'Escape') window.tvBack(); });

  /* ===== Application des données ===== */
  function applyData(d) {
    data = d;
    var z = rawToday();
    var sr = (z.filter(function (t) { return /hanetz|lever/i.test(t.label); })[0] || {}).value;
    var ss = (z.filter(function (t) { return /chekia|sheq|coucher/i.test(t.label); })[0] || {}).value;
    SR = toM(sr || '07:43'); SS = toM(ss || '19:32');
    var now = paris();
    measure(); renderDates(); renderHead(now); renderCards(now);
    renderSeouda(); renderEtude(); renderHayom(); updateLive(now);
  }
  function load() {
    return fetchJson(CONFIG.api + '?t=' + Date.now()).then(function (d) {
      lastOk = Date.now();
      try { localStorage.setItem('tv-data', JSON.stringify(d)); localStorage.setItem('tv-data-at', String(lastOk)); } catch (e) {}
      applyData(d); updateStatus();
    }).catch(function () { updateStatus(); });
  }
  function updateStatus() {
    var st = $('status');
    if (lastOk && Date.now() - lastOk > CONFIG.staleMs) {
      st.textContent = 'Hors ligne · données de ' + new Intl.DateTimeFormat('fr-FR', { timeZone: CONFIG.tz, hour: '2-digit', minute: '2-digit' }).format(new Date(lastOk));
      st.hidden = false;
    } else st.hidden = true;
  }

  /* ===== Horloge (seconde) ===== */
  var lastMin = -1, lastIso = '', bootAt = Date.now(), lastCards = 0;
  function tick() {
    var now = paris();
    renderClock(fmt(now.mf));
    if (Date.now() - lastCards > 15000) { lastCards = Date.now(); if (data) renderCards(now); }
    if (now.min !== lastMin) {
      lastMin = now.min;
      $('phase').textContent = sunPhase(now.mf, SR, SS);
      if (now.iso !== lastIso) { lastIso = now.iso; renderDates(); $('moon').innerHTML = moonSVG(moonData(new Date()).phase); }
      if (data) { renderHead(now); renderCards(now); updateLive(now); }
      updateStatus();
      if (data && data.date && data.date.gregorian && data.date.gregorian !== now.iso && now.m % 2 === 0) load();
      if (now.m % 10 === 0) { shift.x = Math.round(Math.random() * 4 - 2); shift.y = Math.round(Math.random() * 4 - 2); fit(); }
      if (now.h === 4 && now.m === 0 && Date.now() - bootAt > 3600000) location.reload();
    }
    setTimeout(tick, 1000 - (Date.now() % 1000) + 20);
  }

  /* ===== Démarrage ===== */
  measure();
  renderDates();
  updateLive(paris());
  try {
    var cached = localStorage.getItem('tv-data');
    if (cached) { lastOk = +localStorage.getItem('tv-data-at') || 0; applyData(JSON.parse(cached)); }
  } catch (e) {}
  tick();
  requestAnimationFrame(loop);
  load(); loadWeather();
  setInterval(load, CONFIG.refreshMs);
  setInterval(loadWeather, CONFIG.weatherMs);

  /* ===== Mise à jour à distance ===== */
  // Si version.json a changé sur le site, la télé recharge l'écran (nouveau design, corrections).
  // En version de secours (embarquée dans l'appli), c'est l'appli Android qui revient au site dès qu'il répond.
  setInterval(function () {
    if (!/^https?:/.test(location.protocol) || location.hostname === 'appassets.androidplatform.net') return;
    fetchJson('version.json?t=' + Date.now(), 10000).then(function (j) {
      if (j && j.version && String(j.version) !== String(window.TV_VERSION)) location.reload();
    }).catch(function () {});
  }, CONFIG.updateCheckMs);
  window.addEventListener('resize', measure);
})();
