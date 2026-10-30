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

  /* --- nuages : dessinés une fois en image (volumes, ombre, bords fondus), puis simplement déplacés --- */
  var cloudList = [], cloudTint = [255, 255, 255], cloudAlpha = 0.5;
  function seeded(n) { var x = n * 9301 + 49297; return function () { x = (x * 9301 + 49297) % 233280; return x / 233280; }; }
  var CLOUD_RES = 0.5; // dessinés à mi-résolution : invisible une fois flouté, et 4 fois moins de mémoire
  function cloudPad(c) { return Math.round(c.h * 0.9); }
  function drawCloud(cv, c, tint) {
    var w = c.w, h = c.h, P = cloudPad(c), S = CLOUD_RES;
    cv.width = Math.max(2, Math.round((w + P * 2) * S)); cv.height = Math.max(2, Math.round((h * 1.6 + P * 2) * S));
    var g = cv.getContext('2d'); if (!g) return;
    g.setTransform(S, 0, 0, S, 0, 0);
    var R = seeded(c.seed), n = 7 + Math.floor(R() * 6), base = P + h * 1.45;
    g.clearRect(0, 0, w + P * 2, h * 1.6 + P * 2);
    try { g.filter = 'blur(' + Math.max(3, Math.round(h * 0.1 * S)) + 'px)'; } catch (e) {}
    var puff = function (x, y, r, a) {
      var gr = g.createRadialGradient(x, y - r * 0.25, 0, x, y, r);
      gr.addColorStop(0, 'rgba(255,255,255,' + a + ')'); gr.addColorStop(0.55, 'rgba(255,255,255,' + (a * 0.85).toFixed(3) + ')');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    };
    // base allongée, puis boules qui forment le sommet (plus hautes au centre)
    // base : ellipse continue + boules serrées (espacement < rayon : pas d'effet « perles »)
    g.save(); g.translate(P + w / 2, base - h * 0.15); g.scale(1, 0.32);
    var eb = g.createRadialGradient(0, 0, 0, 0, 0, w * 0.5);
    eb.addColorStop(0, 'rgba(255,255,255,0.85)'); eb.addColorStop(0.7, 'rgba(255,255,255,0.6)'); eb.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = eb; g.beginPath(); g.arc(0, 0, w * 0.5, 0, Math.PI * 2); g.fill(); g.restore();
    var rb = h * 0.36, nb = Math.max(3, Math.ceil((w * 0.7) / (rb * 0.8)));
    for (var k = 0; k < nb; k++) puff(P + w * (0.15 + 0.7 * k / (nb - 1)), base - h * 0.2 + (R() - 0.5) * h * 0.06, rb * (0.9 + R() * 0.25), 0.7);
    // sommet : quelques grosses boules qui se chevauchent largement, plus hautes au centre
    n = Math.max(3, Math.min(n, Math.round(w / (h * 0.55))));
    for (var i = 0; i < n; i++) {
      var f = n === 1 ? 0.5 : i / (n - 1), bump = Math.sin(Math.PI * (0.12 + 0.76 * f));
      var r = h * (0.3 + 0.32 * bump) * (0.85 + R() * 0.3);
      puff(P + w * (0.16 + 0.68 * f) + (R() - 0.5) * w * 0.05, base - h * 0.28 - r * 0.5 - (R() - 0.3) * h * 0.1, r, 0.9);
    }
    try { g.filter = 'none'; } catch (e) {}
    // volume : dessous légèrement ombré, puis teinte du moment (doré au coucher, bleuté la nuit)
    g.globalCompositeOperation = 'source-atop';
    var sh = g.createLinearGradient(0, P, 0, base + h * 0.2);
    sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(0.6, 'rgba(120,135,165,0.10)'); sh.addColorStop(1, 'rgba(90,105,140,0.38)');
    g.fillStyle = sh; g.fillRect(0, 0, w + P * 2, h * 1.6 + P * 2);
    var white = tint[0] > 240 && tint[1] > 240 && tint[2] > 240;
    if (!white) { g.fillStyle = 'rgba(' + tint[0] + ',' + tint[1] + ',' + tint[2] + ',0.55)'; g.fillRect(0, 0, w + P * 2, h * 1.6 + P * 2); }
    g.globalCompositeOperation = 'source-over';
  }
  function renderClouds(list) {
    cloudList = list.map(function (c, i) { var o = {}; for (var k in c) o[k] = c[k]; o.seed = o.seed || (i + 1) * 7919 + Math.round(c.w); return o; });
    var box = $('clouds'); clear(box);
    cloudList.forEach(function (c) {
      var cv = document.createElement('canvas'); cv.className = 'tv-cloud';
      cv.style.left = c.l + '%'; cv.style.top = c.t + '%';
      var P = cloudPad(c);
      cv.style.width = (c.w + P * 2) + 'px'; cv.style.height = (c.h * 1.6 + P * 2) + 'px';
      cv.style.marginLeft = (-P) + 'px'; cv.style.marginTop = (-P - c.h * 0.6) + 'px';
      cv.style.animationDelay = c.delay + 's'; cv.style.setProperty('--t', c.dur + 's');
      drawCloud(cv, c, cloudTint);
      c.el = cv; box.appendChild(cv);
    });
    box.style.opacity = String(Math.min(0.9, cloudAlpha * 1.1));
  }
  // Re-teinte seulement quand la couleur du ciel a vraiment changé (quelques fois par jour)
  function tintClouds(rgb, alpha) {
    cloudAlpha = alpha; $('clouds').style.opacity = String(Math.min(0.9, alpha * 1.1));
    var d = Math.max(Math.abs(rgb[0] - cloudTint[0]), Math.abs(rgb[1] - cloudTint[1]), Math.abs(rgb[2] - cloudTint[2]));
    if (d < 14) return;
    cloudTint = rgb.slice(0, 3);
    cloudList.forEach(function (c) { if (c.el) drawCloud(c.el, c, cloudTint); });
  }
  renderClouds(defaultClouds);

  /* --- soleil réaliste : copie de src/components/sunRenderer.ts + RealisticSun.tsx --- */
  var scv = $('sun'), sctx = scv.getContext('2d'), sunDpr = 1, sunW = 1920, sunH = 1080;
  var SUNP = { x: -999, y: -999, warm: 0, op: 0 };
  // météo du soleil (sun-weather.ts) avec transition douce de 2 s, comme RealisticSun
  function sunWeather(code) {
    if (code >= 95) return { cloud: 0.9, disc: 0 };
    if (code >= 3) return { cloud: 0.8, disc: 0 };
    if (code === 2) return { cloud: 0.5, disc: 0.35 };
    if (code === 1) return { cloud: 0.2, disc: 0.85 };
    return { cloud: 0, disc: 1 };
  }
  var sunWx = { cloud: 0, disc: 1 }, sunFrom = { cloud: 0, disc: 1 }, sunTarget = { cloud: 0, disc: 1 }, sunTrans = 0, sunWant = { cloud: 0, disc: 1 };
  var mixv = function (a, b, t) { return a + (b - a) * t; };
  var rgbaS = function (r, g, b, a) { return 'rgba(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ',' + clamp(a).toFixed(4) + ')'; };
  function radial(ctx, x, y, r, stops) { var g = ctx.createRadialGradient(x, y, 0, x, y, r); stops.forEach(function (s) { g.addColorStop(s[0], s[1]); }); return g; }
  function fillCircle(ctx, x, y, r, style) { ctx.fillStyle = style; ctx.fillRect(x - r, y - r, r * 2, r * 2); }
  function renderSun(ctx, w, h, o) {
    ctx.clearRect(0, 0, w, h);
    var A0 = clamp(o.opacity == null ? 1 : o.opacity);
    if (A0 <= 0.003) return;
    var A = A0, R = (o.radius || 26) * (1 + (o.warm || 0) * 0.35);
    var warm = clamp(o.warm || 0), cloud = clamp(o.cloud || 0), D = clamp(o.disc == null ? 1 : o.disc);
    var clear = (1 - cloud * 0.85) * D, diffuse = mixv(0.28, 1, D), T = o.time, x = o.x, y = o.y, i, g;
    var cG = mixv(244, 150, warm), cB = mixv(214, 70, warm), dG = mixv(255, 214, warm), dB = mixv(250, 150, warm);
    var breath = 1 + Math.sin(T * 0.7) * 0.025, flick = 1 + Math.sin(T * 9.1) * 0.01 + Math.sin(T * 13.7) * 0.006;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    // 1. bloom atmosphérique
    var bloomR = R * 26 * breath;
    fillCircle(ctx, x, y, bloomR, radial(ctx, x, y, bloomR, [
      [0.00, rgbaS(255, 250, 238, 0.60 * A * diffuse)], [0.04, rgbaS(255, 246, 224, 0.42 * A * diffuse)],
      [0.10, rgbaS(255, cG, cB, 0.20 * A * diffuse)], [0.22, rgbaS(255, cG - 8, cB - 20, 0.085 * A)],
      [0.45, rgbaS(255, cG - 20, cB - 40, 0.028 * A)], [1.00, rgbaS(255, cG - 20, cB - 40, 0)]]));
    // 2. couronne dorée
    var corR = R * 6.5 * breath;
    fillCircle(ctx, x, y, corR, radial(ctx, x, y, corR, [
      [0.0, rgbaS(255, 252, 240, 0.85 * A * diffuse)],
      [0.18, rgbaS(255, mixv(236, 170, warm), mixv(190, 90, warm), 0.45 * A * (0.6 + 0.4 * clear))],
      [0.55, rgbaS(255, mixv(210, 130, warm), mixv(150, 60, warm), 0.12 * A)], [1.0, rgbaS(255, 190, 110, 0)]]));
    // 3. grands faisceaux crépusculaires
    if (clear > 0.1) {
      var N = 7, L = R * 34;
      for (i = 0; i < N; i++) {
        var base = i * ((Math.PI * 2) / N) + T * 0.012 + Math.sin(i * 7.1) * 0.2;
        var an = base + Math.sin(T * 0.23 + i * 1.9) * 0.05, hwb = 0.11 + 0.05 * Math.sin(T * 0.31 + i);
        var al = (0.035 + 0.03 * (Math.sin(T * 0.5 + i * 2.2) * 0.5 + 0.5)) * A * clear * (1 - warm * 0.2);
        g = ctx.createLinearGradient(x, y, x + Math.cos(an) * L, y + Math.sin(an) * L);
        g.addColorStop(0, rgbaS(255, 246, 220, al)); g.addColorStop(1, rgbaS(255, 236, 200, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(an - hwb) * L, y + Math.sin(an - hwb) * L); ctx.lineTo(x + Math.cos(an + hwb) * L, y + Math.sin(an + hwb) * L);
        ctx.closePath(); ctx.fill();
      }
    }
    // 4. 48 rayons fins en mouvement
    if (clear > 0.05) {
      var NR = 48, Lr = R * (14 + warm * 6) * breath;
      ctx.save(); ctx.translate(x, y); ctx.scale(1, 1 - warm * 0.35);
      ctx.fillStyle = radial(ctx, 0, 0, Lr, [[0.0, rgbaS(255, 252, 238, 0.95)], [0.2, rgbaS(255, 244, 214, 0.5)], [1.0, rgbaS(255, 232, 190, 0)]]);
      for (i = 0; i < NR; i++) {
        var ph = i * 2.399963, ang = T * 0.03 + (i * Math.PI * 2) / NR + Math.sin(T * 0.27 + ph) * 0.03;
        var len = Lr * (0.5 + 0.5 * (Math.sin(T * 0.9 + ph) * 0.5 + 0.5)) * (i % 4 === 0 ? 1.3 : 1);
        var hw = 0.02 * (0.7 + 0.6 * (Math.sin(T * 0.6 + ph * 1.3) * 0.5 + 0.5));
        ctx.globalAlpha = (0.05 + 0.15 * (Math.sin(T * 1.3 + ph * 0.7) * 0.5 + 0.5)) * A * clear * (1 - warm * 0.3);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ang - hw) * len, Math.sin(ang - hw) * len); ctx.lineTo(Math.cos(ang + hw) * len, Math.sin(ang + hw) * len); ctx.closePath(); ctx.fill();
      }
      ctx.globalAlpha = 1; ctx.restore();
    }
    // 5. traînée anamorphique horizontale
    if (D > 0.4) {
      ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.018 + warm * 0.012);
      var sR = R * (20 + warm * 8);
      ctx.fillStyle = radial(ctx, 0, 0, sR, [[0.0, rgbaS(255, 252, 242, (0.5 + warm * 0.3) * A * flick * (0.5 + 0.5 * clear))], [0.45, rgbaS(255, 238, 205, 0.16 * A)], [1.0, rgbaS(255, 224, 175, 0)]]);
      ctx.fillRect(-sR, -sR, sR * 2, sR * 2); ctx.restore();
    }
    // 6. pointes de diffraction
    if (clear > 0.25) {
      var Ls = R * (7.5 - warm * 3) * flick, rot = T * 0.045;
      for (i = 0; i < 3; i++) {
        ctx.save(); ctx.translate(x, y); ctx.rotate(rot + (i * Math.PI) / 3);
        var g1 = ctx.createLinearGradient(-Ls, 0, Ls, 0);
        g1.addColorStop(0, rgbaS(255, 250, 235, 0)); g1.addColorStop(0.5, rgbaS(255, 253, 244, 0.5 * A * clear)); g1.addColorStop(1, rgbaS(255, 250, 235, 0));
        ctx.fillStyle = g1; ctx.fillRect(-Ls, -0.8, Ls * 2, 1.6);
        var g2 = ctx.createLinearGradient(-Ls * 0.55, 0, Ls * 0.55, 0);
        g2.addColorStop(0, rgbaS(255, 240, 210, 0)); g2.addColorStop(0.5, rgbaS(255, 246, 224, 0.17 * A * clear)); g2.addColorStop(1, rgbaS(255, 240, 210, 0));
        ctx.fillStyle = g2; ctx.fillRect(-Ls * 0.55, -3.5, Ls * 1.1, 7); ctx.restore();
      }
    }
    // 7. disque incandescent
    if (D > 0.02) {
      ctx.save(); ctx.translate(x, y); ctx.scale(1, 1 - warm * 0.14);
      var soft = mixv(0.12, 0.55, cloud), dR = R * (1.5 + cloud * 0.8);
      ctx.fillStyle = radial(ctx, 0, 0, dR, [
        [0.0, rgbaS(255, 255, 253, 1 * A * D)], [0.55 - soft * 0.4, rgbaS(255, 255, 250, 0.98 * A * D)],
        [0.68, rgbaS(255, dG, dB, 0.72 * A * D * (1 - cloud * 0.4))],
        [0.82, rgbaS(255, mixv(236, 190, warm), mixv(190, 110, warm), 0.28 * A * D)], [1.0, rgbaS(255, 220, 160, 0)]]);
      ctx.fillRect(-dR, -dR, dR * 2, dR * 2);
      var hR = R * 3.2;
      ctx.fillStyle = radial(ctx, 0, 0, hR, [[0.0, rgbaS(255, 255, 250, 0.9 * A * D * (1 - warm * 0.5))], [0.3, rgbaS(255, 250, 230, 0.45 * A * D)], [1.0, rgbaS(255, cG, cB, 0)]]);
      ctx.fillRect(-hR, -hR, hR * 2, hR * 2); ctx.restore();
    }
    // 8. reflets d'objectif chauds
    if (o.lensFlare !== false && clear > 0.3) {
      var cx0 = w / 2, cy0 = h / 2, vis = A * clear * (1 - warm * 0.6);
      [[1.25, R * 1.7, [255, 228, 175], 0.1, true], [1.65, R * 0.6, [255, 196, 140], 0.13, false], [2.1, R * 2.8, [255, 214, 165], 0.06, true], [2.6, R * 1.0, [255, 205, 150], 0.09, false], [3.1, R * 4.5, [255, 210, 160], 0.04, true]].forEach(function (q) {
        var k = q[0], r = q[1], c = q[2], al2 = q[3], ring = q[4];
        var gx = x + (cx0 - x) * k, gy = y + (cy0 - y) * k;
        var gr = ring
          ? radial(ctx, gx, gy, r, [[0, rgbaS(c[0], c[1], c[2], 0)], [0.78, rgbaS(c[0], c[1], c[2], 0)], [0.9, rgbaS(c[0], c[1], c[2], al2 * vis)], [1, rgbaS(c[0], c[1], c[2], 0)]])
          : radial(ctx, gx, gy, r, [[0, rgbaS(c[0], c[1], c[2], al2 * vis)], [1, rgbaS(c[0], c[1], c[2], 0)]]);
        fillCircle(ctx, gx, gy, r, gr);
      });
    }
    ctx.restore();
  }
  function resizeSun() {
    var box = $('sunBox'); sunW = box.clientWidth || 1920; sunH = box.clientHeight || 1080;
    sunDpr = Math.min(window.devicePixelRatio || 1, 1.5, 1920 / Math.max(1, sunW), 1080 / Math.max(1, sunH));
    scv.width = Math.max(1, Math.round(sunW * sunDpr)); scv.height = Math.max(1, Math.round(sunH * sunDpr));
  }
  function drawSun(now) {
    if (!sctx) return;
    if (sunTarget.cloud !== sunWant.cloud || sunTarget.disc !== sunWant.disc) {
      sunFrom = { cloud: sunWx.cloud, disc: sunWx.disc }; sunTarget = { cloud: sunWant.cloud, disc: sunWant.disc }; sunTrans = now;
    }
    var pr = Math.min(1, (now - sunTrans) / 2000), ease = pr * pr * (3 - 2 * pr);
    sunWx.cloud = sunFrom.cloud + (sunTarget.cloud - sunFrom.cloud) * ease;
    sunWx.disc = sunFrom.disc + (sunTarget.disc - sunFrom.disc) * ease;
    sctx.setTransform(sunDpr, 0, 0, sunDpr, 0, 0);
    renderSun(sctx, sunW, sunH, { x: SUNP.x, y: SUNP.y, warm: SUNP.warm, opacity: SUNP.op, radius: 26, cloud: sunWx.cloud, disc: sunWx.disc, lensFlare: true, time: now / 1000 });
  }

  /* --- ciel : copie de updateSky --- */
  function updateSky(mNow) {
    var g = G; if (!g) return;
    var s0 = SR, s1 = SS, s = sunAt(mNow, g, s0, s1);
    var warm = clamp(1 - Math.max(s.alt, 0) / 0.4);
    var below = s.alt < 0 ? clamp(-s.alt * 4) : 0;
    SUN = { x: s.x, y: s.y, warm: warm, alt: s.alt, below: below };
    SUNP = { x: s.x, y: s.y, warm: warm, op: 1 - below };
    var sk = skyFor(mNow, s0, s1), day = sk.day, dusk = sk.dusk;
    var pal = mixPal(day, dusk), hp = 78;
    $('skyBg').style.background = 'linear-gradient(180deg, rgb(' + pal.top + ') 0%, rgb(' + pal.mid + ') ' + (hp * 0.5).toFixed(1) + '%, rgb(' + pal.pink + ') ' + (hp * 0.86).toFixed(1) + '%, rgb(' + pal.hor + ') ' + hp + '%, rgb(' + pal.hor + ') 100%)';
    var hz = pal.haze;
    $('haze').style.background = 'linear-gradient(to top, rgba(' + hz[0] + ',' + hz[1] + ',' + hz[2] + ',0) 0%, rgba(' + hz[0] + ',' + hz[1] + ',' + hz[2] + ',' + hz[3] + ') 55%, rgba(' + hz[0] + ',' + hz[1] + ',' + hz[2] + ',0) 100%)';
    var cl = $('clouds');
    tintClouds(pal.cloud, pal.cloud[3]);
    cl.style.transform = 'translateX(' + (-clamp((mNow - D0) / (D1 - D0)) * 120).toFixed(1) + 'px)';
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
    resizeSun();
    $('haze').style.top = (G.HY - 110) + 'px';
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
    var dim = rain || snow ? 0.8 : c > 0.85 ? 0.95 : 1;
    var n = Math.round(4 + c * 14 + (rain || snow ? 8 : 0)), clouds = [];
    for (var i = 0; i < n; i++) clouds.push({ l: (i * 97) / n + Math.random() * 6, t: Math.random() * 40, w: 340 + Math.random() * 360, h: 80 + Math.random() * 70, dur: 40 + Math.random() * 30, delay: -i * 7 });
    wx = { code: code, temp: temp, grey: rain || snow ? 0.75 : c > 0.5 ? (c - 0.5) * 0.9 : 0, fog: fog ? 1 : 0, dim: dim, storm: storm };
    renderClouds(clouds);
    $('wxGrey').style.opacity = String(Math.min(0.1, wx.grey * 0.13));
    $('wxFog').style.opacity = String(wx.fog * 0.1);
    sunWant = sunWeather(code);
    $('rain').style.display = RAIN ? '' : 'none';
    $('snow').style.display = SNOW ? '' : 'none';
    $('flash').style.display = storm ? '' : 'none';
    $('clouds').style.filter = wx.grey > 0.5 ? 'brightness(.8) saturate(.6)' : '';
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
    if (this.anim) { this.anim.cancel(); this.anim = null; }
    if (this.clone) { this.track.removeChild(this.clone); this.clone = null; }
    this.pos = 0; this.track.style.transform = 'translate3d(0,0,0)';
    this.h = this.inner.offsetHeight;
    this.loop = this.h > this.vp.clientHeight + 2;
    if (!this.loop) return;
    this.clone = this.inner.cloneNode(true); this.clone.removeAttribute('id'); this.clone.setAttribute('aria-hidden', 'true'); this.track.appendChild(this.clone);
    // Défilement sur le compositeur (Web Animations) : aucune saccade quand le soleil ou la météo travaillent.
    if (this.track.animate) {
      this.anim = this.track.animate([{ transform: 'translate3d(0,0,0)' }, { transform: 'translate3d(0,' + (-this.h) + 'px,0)' }],
        { duration: (this.h / this.speed) * 1000, iterations: Infinity, easing: 'linear' });
    }
  };
  AutoLoop.prototype.step = function (dt) {
    if (!this.loop || this.anim) return;
    this.pos += this.speed * (dt / 1000);
    if (this.h > 0 && this.pos >= this.h) this.pos -= this.h;
    this.track.style.transform = 'translate3d(0,' + (-this.pos) + 'px,0)';
  };
  var etudeLoop = new AutoLoop($('etudeLoop'), 9), hayomLoop = new AutoLoop($('hayomLoop'), 14);

  /* ===== Boucle d'animation unique (soleil 30 i/s, ciel toutes les 2 s, pluie, neige, défilements) ===== */
  var lastSun = 0, lastSky = 0, lastT = 0;
  var NIGHT = false;
  function loop(t) {
    if (!document.hidden && !NIGHT) {
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
    if (NIGHT) return;
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

  /* ===== Veille de nuit et allumage programmé ===== */
  // Horaires réglables à distance dans version.json : "allumage": "09:00", "extinction": "01:00".
  var R0 = window.TV_REMOTE || {};
  var ON_AT = String(R0.allumage || '09:00'), OFF_AT = String(R0.extinction || '01:00');
  window.tvNight = function (on) {
    on = !!on;
    if (on === NIGHT) return;
    NIGHT = on;
    $('night').hidden = !on;
    if (on) { liveOn = false; teardown(); setBig(false); }
    else location.reload();   // au réveil : écran rechargé, données fraîches
  };
  if (window.TVNative && window.TVNative.setSchedule) {
    try { window.TVNative.setSchedule(ON_AT, OFF_AT); } catch (e) {}
  } else {
    // Sans l'appli (navigateur) : la page gère seule l'écran noir de nuit.
    setInterval(function () {
      var n = paris().min, on = toMinTop(ON_AT), off = toMinTop(OFF_AT);
      if (on == null || off == null || on === off) return;
      window.tvNight(off < on ? (n >= off && n < on) : (n >= off || n < on));
    }, 30000);
  }

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
