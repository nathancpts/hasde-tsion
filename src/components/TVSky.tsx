import { useEffect, useMemo, useRef, useState } from "react";
import RealisticSun from "./RealisticSun";

export interface TVSkyEvent {
  label: string;
  value: string;
}

/* ===== Utilitaires ===== */
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const toM = (t: string) => { const [h, m] = t.split(":").map(Number); return (h || 0) * 60 + (m || 0); };
const fmt = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(Math.floor(m) % 60).padStart(2, "0")}`;
const nowMF = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60; };
const D0 = 6 * 60;
const D1 = 21 * 60 + 30;

const HE: Record<string, string> = {
  minha: "מנחה", arvit: "ערבית", chaharit: "שחרית", "chah'arit": "שחרית", "cha’harit": "שחרית", shaharit: "שחרית",
  "plag hamin'ha": "פלג המנחה", "plag haminha": "פלג המנחה", neila: "נעילה", "néila": "נעילה",
  "lever du soleil": "הנץ", chekia: "שקיעה", sheqyia: "שקיעה", "nuit de r. tam": "רבנו תם",
  allumage: "הדלקת נרות", "allumer les bougies": "הדלקת נרות", entrée: "כניסה", sortie: "יציאה",
};
const heOf = (l: string) => { const k = l.toLowerCase(); const hit = Object.keys(HE).find((key) => k.startsWith(key)); return hit ? HE[hit] : ""; };
const kindOf = (l: string) =>
  /allum|entrée|sortie|chabbat/i.test(l) ? "Chabbat"
  : /chaharit|chah['’]arit|shaharit|minha|arvit|plag|néila|neila/i.test(l) ? "Office"
  : /lever|hanetz|limite|chema|shema|tefila|hatsot|midi|chekia|sheq|coucher|nuit|étoiles|etoiles|aube|alot/i.test(l) ? "Zman"
  : "Horaire";

function wxLabel(c: number) {
  return c >= 95 ? "Orage"
    : [71, 73, 75, 77, 85, 86].includes(c) ? "Neige"
    : [65, 67, 82].includes(c) ? "Forte pluie"
    : [51, 53, 55, 56, 57].includes(c) ? "Bruine"
    : [61, 63, 66, 80, 81].includes(c) ? "Pluie"
    : [45, 48].includes(c) ? "Brouillard"
    : c === 3 ? "Couvert"
    : c >= 1 ? "Partiellement nuageux"
    : "Ensoleillé";
}

/* ===== Palettes du ciel ===== */
const PAL = {
  night: { top: [5, 13, 32], mid: [9, 24, 58], pink: [12, 32, 70], hor: [18, 44, 92], ground: [4, 10, 24], haze: [24, 58, 110, 0.35], cloud: [110, 130, 170, 0.10] },
  dusk: { top: [22, 42, 104], mid: [92, 82, 140], pink: [214, 96, 122], hor: [240, 138, 86], ground: [34, 22, 44], haze: [255, 150, 88, 0.6], cloud: [255, 176, 132, 0.55] },
  day: { top: [22, 74, 168], mid: [70, 136, 220], pink: [126, 180, 238], hor: [172, 208, 244], ground: [24, 46, 90], haze: [205, 228, 250, 0.5], cloud: [255, 255, 255, 0.5] },
};
type PalKey = "top" | "mid" | "pink" | "hor" | "ground" | "haze" | "cloud";
function mixPal(day: number, dusk: number): Record<PalKey, number[]> {
  const wDusk = clamp(dusk), wDay = clamp(day) * (1 - wDusk), wNight = clamp(1 - wDay - wDusk);
  const mix = (k: PalKey) => PAL.night[k].map((v, i) => Math.round(v * wNight + PAL.dusk[k][i] * wDusk + PAL.day[k][i] * wDay));
  const out = {} as Record<PalKey, number[]>;
  (["top", "mid", "pink", "hor", "ground", "haze", "cloud"] as PalKey[]).forEach((k) => (out[k] = mix(k)));
  out.haze[3] = +(PAL.night.haze[3] * wNight + PAL.dusk.haze[3] * wDusk + PAL.day.haze[3] * wDay).toFixed(3);
  out.cloud[3] = +(PAL.night.cloud[3] * wNight + PAL.dusk.cloud[3] * wDusk + PAL.day.cloud[3] * wDay).toFixed(3);
  return out;
}
function skyFor(m: number, SR: number, SS: number) {
  const day = clamp(Math.min((m - (SR - 40)) / 80, ((SS + 30) - m) / 80));
  const dusk = Math.max(0, 1 - Math.abs(m - SS) / 45) + Math.max(0, 1 - Math.abs(m - SR) / 45) * 0.8;
  return { day, dusk };
}
function sunPhase(m: number, SR: number, SS: number) {
  if (m < SR - 30) return "Avant l'aube";
  if (m < SR + 20) return "Lever du soleil";
  if (m < SS - 60) return "Jour";
  if (m < SS + 5) return "Coucher du soleil";
  if (m < SS + 40) return "Crépuscule";
  return "Nuit";
}

/* ===== Lune : phase astronomique réelle ===== */
function moonData(date = new Date()) {
  const synodic = 29.530588853, epoch = Date.UTC(2000, 0, 6, 18, 14);
  const phase = (((date.getTime() - epoch) / 86400000 / synodic) % 1 + 1) % 1;
  return { phase, illumination: (1 - Math.cos(2 * Math.PI * phase)) / 2 };
}
function moonSVG(phase: number, illumination: number) {
  const r = 46, cx = 50, cy = 50, terminator = -Math.cos(2 * Math.PI * phase), left: [number, number][] = [], right: [number, number][] = [];
  for (let i = 0; i <= 80; i++) {
    const y = cy - r + (2 * r * i) / 80, hw = Math.sqrt(Math.max(0, r * r - (y - cy) * (y - cy)));
    const xl = cx - hw, xr = cx + hw, xt = cx + terminator * hw;
    if (phase < 0.5) { left.push([xt, y]); right.push([xr, y]); } else { left.push([xl, y]); right.push([xt, y]); }
  }
  const pts = left.concat(right.reverse() as [number, number][]);
  const d = "M" + pts.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(" L") + "Z";
  const pct = Math.round(illumination * 100);
  return `<svg viewBox="0 0 100 100"><defs><radialGradient id="tvmg" cx="38%" cy="34%" r="76%"><stop offset="0" stop-color="#ffffff"/><stop offset=".72" stop-color="#e8eef9"/><stop offset="1" stop-color="#b8c8e5"/></radialGradient><clipPath id="tvmc"><path d="${d}"/></clipPath></defs>
    <circle cx="50" cy="50" r="47.5" fill="#172b51" stroke="#d9e8ff" stroke-width="2.2"/><path d="${d}" fill="url(#tvmg)"/>
    <g clip-path="url(#tvmc)" fill="#899bb9" opacity=".28"><ellipse cx="37" cy="39" rx="10" ry="7"/><ellipse cx="61" cy="58" rx="9" ry="7"/><circle cx="45" cy="67" r="4"/><circle cx="67" cy="34" r="3"/></g></svg>`;
}

const MONT = "'Montserrat', system-ui, sans-serif";

interface Cloud { l: number; t: number; w: number; h: number; dur: number; delay: number; blur: number }

export function TVSky({
  logoUrl,
  sunrise,
  sunset,
  events,
  greeting,
  dateFr,
  dateHe,
  contentRight = "0px",
  tomorrow,
  parashaFr,
  parashaHe,
}: {
  tomorrow?: TVSkyEvent[];
  logoUrl?: string;
  sunrise: string;
  sunset: string;
  events: TVSkyEvent[];
  greeting?: [string, string] | null;
  dateFr?: string;
  dateHe?: string;
  contentRight?: string;
  parashaFr?: string;
  parashaHe?: string;
}) {
  const SR = useMemo(() => toM(sunrise || "07:43"), [sunrise]);
  const SS = useMemo(() => toM(sunset || "19:32"), [sunset]);
  const srss = useRef({ SR, SS });
  srss.current = { SR, SS };

  const [m, setM] = useState(() => nowMF());
  const [arc, setArc] = useState<{ w: number; h: number } | null>(null);
  const [wx, setWx] = useState<{ code: number; temp: number | null; grey: number; fog: number; dim: number; storm: boolean; clouds: Cloud[] } | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const arcRef = useRef<HTMLDivElement>(null);
  const skyRef = useRef<HTMLDivElement>(null);
  const starsRef = useRef<HTMLDivElement>(null);
  const suncvRef = useRef<HTMLCanvasElement>(null);
  const [sunP, setSunP] = useState({ x: -999, y: -999, warm: 0, op: 0 });
  const moonRef = useRef<HTMLDivElement>(null);
  const cloudsRef = useRef<HTMLDivElement>(null);
  const hazeRef = useRef<HTMLDivElement>(null);
  const reflRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const nowLineRef = useRef<HTMLSpanElement>(null);
  const doneRef = useRef<SVGPathElement>(null);
  const guideRef = useRef<SVGPathElement>(null);
  const rainRef = useRef<HTMLCanvasElement>(null);
  const snowRef = useRef<HTMLCanvasElement>(null);
  const flashRef = useRef<HTMLCanvasElement>(null);

  const G = useRef<{ W: number; H: number; HY: number; AMP: number } | null>(null);
  const SUN = useRef<{ x: number; y: number; warm: number; alt: number; below: number } | null>(null);
  const RAIN = useRef(0);
  const SNOW = useRef(0);
  const updateSkyRef = useRef<(m: number) => void>(() => {});

  const moon = useMemo(() => { const md = moonData(); return moonSVG(md.phase, md.illumination); }, []);
  const stars = useMemo(
    () => Array.from({ length: 90 }, () => ({ l: Math.random() * 100, t: Math.random() * 62, o: 0.3 + Math.random() * 0.7, sc: 0.5 + Math.random(), d: Math.random() * 3 })),
    [],
  );
  const defaultClouds = useMemo<Cloud[]>(
    () => [{ l: 4, t: 14, w: 520, h: 110, dur: 52, delay: 0, blur: 22 }, { l: 38, t: 30, w: 420, h: 90, dur: 64, delay: -11, blur: 22 }, { l: 62, t: 10, w: 600, h: 120, dur: 46, delay: -22, blur: 22 }, { l: 80, t: 36, w: 360, h: 80, dur: 58, delay: -33, blur: 22 }],
    [],
  );

  /* --- position du soleil sur l'arc --- */
  const sunAt = (mm: number, g: { W: number; H: number; HY: number; AMP: number }, s0: number, s1: number) => {
    const sp = (mm - s0) / (s1 - s0);
    return {
      x: g.W * clamp((mm - D0) / (D1 - D0), -0.02, 1.02),
      y: g.HY - g.AMP * Math.sin(Math.PI * sp),
      sp,
      alt: Math.sin(Math.PI * clamp(sp, -1, 2)),
    };
  };

  /* --- horloge + cartes : tick 15 s --- */
  useEffect(() => {
    const id = window.setInterval(() => setM(nowMF()), 15000);
    return () => window.clearInterval(id);
  }, []);

  /* --- boucle d'animation : soleil (canvas, 60 fps) + ciel (toutes les 2 s) --- */
  useEffect(() => {
    let raf = 0;
    let lastSky = 0;
    let lastSun = 0;

    const drawSun = (t: number) => {
      const scv = suncvRef.current;
      const c = scv?.getContext("2d");
      if (!scv || !c) return;
      const dpr = (scv as HTMLCanvasElement & { _dpr?: number })._dpr || 1;
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, scv.width, scv.height);
      const g = G.current;
      const S = SUN.current;
      if (!g || !S || S.below >= 1) return;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      const ox = 0, oy = 0;
      const x = S.x + ox, y = S.y + oy, w = S.warm, a = 1 - S.below, T = t / 1000;
      const breath = 1 + Math.sin(T * 0.7) * 0.03, flick = 1 + Math.sin(T * 9.1) * 0.012 + Math.sin(T * 13.7) * 0.008;
      const R0 = 27 * (1 + w * 0.35);
      const kG = Math.round(236 - w * 96), kB = Math.round(188 - w * 150);
      const rgba = (r: number, gg: number, b: number, al: number) => `rgba(${r},${gg},${b},${Math.max(0, Math.min(1, al)).toFixed(3)})`;
      const rg = (rx: number, ry: number, rr: number, stops: [number, string][]) => { const gr = c.createRadialGradient(rx, ry, 0, rx, ry, rr); stops.forEach(([o, col]) => gr.addColorStop(o, col)); return gr; };
      const fillR = (rx: number, ry: number, rr: number) => { c.fillRect(rx - rr, ry - rr, rr * 2, rr * 2); };
      c.globalCompositeOperation = "lighter";
      c.fillStyle = rg(x, y, 620 * breath, [[0, rgba(255, 250, 230, 0.75 * a)], [0.3, rgba(255, 240, 210, 0.3 * a)], [1, rgba(255, 220, 180, 0)]]); fillR(x, y, 620 * breath);
      c.fillStyle = rg(x, y, 250 * breath, [[0, rgba(255, kG, kB, 0.85 * a)], [0.35, rgba(255, Math.round(kG * 0.82), Math.round(kB * 0.55), 0.24 * a)], [1, rgba(255, 140, 70, 0)]]); fillR(x, y, 250 * breath);
      c.save(); c.translate(x, y); c.scale(1, 0.022 + w * 0.01);
      c.fillStyle = rg(0, 0, 560, [[0, rgba(255, 252, 240, (0.55 + w * 0.35) * a * flick)], [0.5, rgba(255, 236, 200, 0.18 * a)], [1, rgba(255, 220, 170, 0)]]); fillR(0, 0, 560); c.restore();
      const NR = 36, Lr = (300 + w * 220) * breath, hw0 = 0.028;
      c.save(); c.translate(x, y);
      c.fillStyle = rg(0, 0, Lr, [[0, rgba(255, 250, 232, 0.9)], [0.25, rgba(255, 244, 214, 0.45)], [1, rgba(255, 230, 190, 0)]]);
      for (let i = 0; i < NR; i++) {
        const ph = i * 2.399, ang = T * 0.035 + (i * Math.PI * 2) / NR + Math.sin(T * 0.27 + ph) * 0.03;
        const len = Lr * (0.55 + 0.45 * (Math.sin(T * 0.9 + ph) * 0.5 + 0.5)) * (i % 3 === 0 ? 1.25 : 1);
        const hw = hw0 * (0.7 + 0.6 * (Math.sin(T * 0.6 + ph * 1.3) * 0.5 + 0.5));
        c.globalAlpha = (0.05 + 0.16 * (Math.sin(T * 1.3 + ph * 0.7) * 0.5 + 0.5)) * a * (1 - w * 0.35);
        c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(ang - hw) * len, Math.sin(ang - hw) * len); c.lineTo(Math.cos(ang + hw) * len, Math.sin(ang + hw) * len); c.closePath(); c.fill();
      }
      c.globalAlpha = 1; c.restore();
      const L = (175 - w * 80) * flick, rot = T * 0.05;
      for (let i = 0; i < 3; i++) {
        c.save(); c.translate(x, y); c.rotate(rot + (i * Math.PI) / 3);
        const g1 = c.createLinearGradient(-L, 0, L, 0); g1.addColorStop(0, rgba(255, 250, 235, 0)); g1.addColorStop(0.5, rgba(255, 252, 240, 0.42 * a * (1 - w * 0.3))); g1.addColorStop(1, rgba(255, 250, 235, 0));
        c.fillStyle = g1; c.fillRect(-L, -0.9, L * 2, 1.8);
        const g2 = c.createLinearGradient(-L * 0.6, 0, L * 0.6, 0); g2.addColorStop(0, rgba(255, 240, 210, 0)); g2.addColorStop(0.5, rgba(255, 245, 220, 0.16 * a * (1 - w * 0.3))); g2.addColorStop(1, rgba(255, 240, 210, 0));
        c.fillStyle = g2; c.fillRect(-L * 0.6, -4, L * 1.2, 8); c.restore();
      }
      c.save(); c.translate(x, y);
      const fr = 0.6;
      ([[ -fr, 0, 255, 0, 0 ], [0, 0, 0, Math.round(255 * (1 - w * 0.3)), 0], [fr, 0, 0, 0, Math.round(255 * (1 - w * 0.62))]] as [number, number, number, number, number][]).forEach(([dx, dy, r, gg, b]) => {
        c.fillStyle = rg(dx, dy, R0 * 1.55, [[0, rgba(r, gg, b, 0.95 * a)], [0.62, rgba(r, gg, b, 0.95 * a)], [0.75, rgba(r, gg, b, 0.35 * a)], [1, rgba(r, gg, b, 0)]]); fillR(dx, dy, R0 * 1.55);
      });
      c.fillStyle = rg(0, 0, R0 * 2.6, [[0, rgba(255, 255, 252, a)], [0.3, rgba(255, 252, 238, 0.85 * a)], [1, rgba(255, kG, kB, 0)]]); fillR(0, 0, R0 * 2.6);
      c.restore();
      const cx0 = g.W / 2 + ox, cy0 = g.H / 2 + oy, vis = clamp(S.alt * 3) * a * (1 - w * 0.6);
      ([[1.3, 44, [120, 190, 255], 0.18, true], [1.65, 16, [255, 180, 120], 0.16, false], [2.05, 74, [150, 255, 200], 0.1, true], [2.5, 26, [200, 160, 255], 0.14, false], [3.0, 120, [255, 200, 140], 0.06, true]] as [number, number, number[], number, boolean][]).forEach(([k, r, col, al, ring]) => {
        const gx = x + (cx0 - x) * k, gy = y + (cy0 - y) * k;
        c.fillStyle = ring
          ? rg(gx, gy, r, [[0, rgba(col[0], col[1], col[2], 0)], [0.78, rgba(col[0], col[1], col[2], 0)], [0.9, rgba(col[0], col[1], col[2], al * vis)], [1, rgba(col[0], col[1], col[2], 0)]])
          : rg(gx, gy, r, [[0, rgba(col[0], col[1], col[2], al * vis)], [1, rgba(col[0], col[1], col[2], 0)]]);
        fillR(gx, gy, r);
      });
      c.globalCompositeOperation = "source-over";
    };

    const updateSky = (mNow: number) => {
      const g = G.current;
      if (!g) return;
      const { SR: s0, SS: s1 } = srss.current;
      const s = sunAt(mNow, g, s0, s1);
      const warm = clamp(1 - Math.max(s.alt, 0) / 0.4);
      const below = s.alt < 0 ? clamp(-s.alt * 4) : 0;
      SUN.current = { x: s.x, y: s.y, warm, alt: s.alt, below };
      setSunP({ x: s.x, y: s.y, warm, op: 1 - below });
      if (s.sp > 0) {
        const n = 90, k = Math.min(s.sp, 1);
        let d = "";
        for (let i = 0; i <= n; i++) { const q = sunAt(s0 + ((s1 - s0) * k * i) / n, g, s0, s1); d += (i ? " L" : "M") + q.x.toFixed(1) + "," + q.y.toFixed(1); }
        doneRef.current?.setAttribute("d", d);
      } else doneRef.current?.setAttribute("d", "");
      const { day, dusk } = skyFor(mNow, s0, s1);
      const pal = mixPal(day, dusk);
      const sxp = ((s.x / g.W) * 100).toFixed(1), syp = ((s.y / g.H) * 100).toFixed(1), hp = 78;
      const glowA = (0.55 * clamp(s.alt + 0.35) * (1 - below * 0.5)).toFixed(3);
      if (skyRef.current) {
        skyRef.current.style.background = `linear-gradient(180deg, rgb(${pal.top}) 0%, rgb(${pal.mid}) ${(hp * 0.5).toFixed(1)}%, rgb(${pal.pink}) ${(hp * 0.86).toFixed(1)}%, rgb(${pal.hor}) ${hp}%, rgb(${pal.hor}) 100%)`;
      }
      if (hazeRef.current) {
        hazeRef.current.style.background = `linear-gradient(to top, rgba(${pal.haze[0]},${pal.haze[1]},${pal.haze[2]},0) 0%, rgba(${pal.haze[0]},${pal.haze[1]},${pal.haze[2]},${pal.haze[3]}) 55%, rgba(${pal.haze[0]},${pal.haze[1]},${pal.haze[2]},0) 100%)`;
      }
      const cl = cloudsRef.current;
      if (cl) {
        cl.style.setProperty("--cr", String(pal.cloud[0]));
        cl.style.setProperty("--cg", String(pal.cloud[1]));
        cl.style.setProperty("--cb", String(pal.cloud[2]));
        cl.style.setProperty("--ca", String(pal.cloud[3]));
        const p = clamp((mNow - D0) / (D1 - D0));
        cl.style.transform = `translateX(${(-p * 120).toFixed(1)}px)`;
      }
      const near = clamp(1 - Math.abs(s.y - g.HY) / (g.H * 0.32)) * (1 - below);
      if (reflRef.current) {
        reflRef.current.style.left = `${s.x.toFixed(1)}px`;
        reflRef.current.style.opacity = (near * (0.5 + warm * 0.5)).toFixed(3);
      }
      const nf = clamp(1 - day * 1.7 - dusk * 0.7);
      if (starsRef.current) starsRef.current.style.opacity = nf.toFixed(3);
      const nightLen = 1440 - s1 + s0;
      const np = clamp(((mNow - s1 + 1440) % 1440) / nightLen);
      const mArc = Math.sin(Math.PI * np);
      const sunUp = mNow > s0 && mNow < s1;
      if (moonRef.current) {
        moonRef.current.style.opacity = sunUp ? "0" : (Math.min(1, 0.55 + mArc * 0.5) * (1 - day * 0.25)).toFixed(3);
        moonRef.current.style.transform = `translate(${(g.W * (0.82 - np * 0.52)).toFixed(1)}px, ${(g.HY + 40 - (g.HY * 0.92 + 40) * mArc).toFixed(1)}px) rotate(${(-18 + np * 30).toFixed(1)}deg)`;
      }
      if (nowLineRef.current) {
        const on = mNow > D0 && mNow < D1;
        nowLineRef.current.style.opacity = on ? "1" : "0";
        nowLineRef.current.style.left = `${(((mNow - D0) / (D1 - D0)) * 100).toFixed(2)}%`;
      }
    };

    updateSkyRef.current = updateSky;
    const loop = (t: number) => {
      if (!document.hidden) {
        void lastSun; void drawSun;
        if (t - lastSky > 2000) { lastSky = t; updateSky(nowMF()); }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* --- mesure de la zone du soleil --- */
  useEffect(() => {
    const el = arcRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth, h = Math.max(160, el.clientHeight);
      if (w < 10 || h < 10) return;
      G.current = { W: w, H: h, HY: h * 0.78, AMP: h * 0.78 * 0.62 };
      setArc({ w, h });
      const scv = suncvRef.current;
      if (scv) {
        // Keep the backing texture within Full HD even on 4K Android TVs.
        const dpr = Math.min(1, 1920 / w, 1080 / h);
        (scv as HTMLCanvasElement & { _dpr?: number })._dpr = dpr;
        scv.width = Math.max(1, Math.round(w * dpr));
        scv.height = Math.max(1, Math.round(h * dpr));
      }
      const g = G.current;
      if (guideRef.current && g) {
        const { SR: s0, SS: s1 } = srss.current;
        const pts: string[] = [];
        for (let i = 0; i <= 120; i++) { const p = sunAt(s0 + ((s1 - s0) * i) / 120, g, s0, s1); pts.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`); }
        guideRef.current.setAttribute("d", "M" + pts.join(" L"));
      }
      if (hazeRef.current && g) hazeRef.current.style.top = `${g.HY - 110}px`;
      if (reflRef.current && g) reflRef.current.style.top = `${g.HY + 2}px`;
      if (railRef.current) railRef.current.style.top = `${h * 0.84}px`;
      updateSkyRef.current(nowMF());
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* --- météo réelle de Neuilly-sur-Seine (Open-Meteo) --- */
  useEffect(() => {
    let alive = true;
    const applyWx = (code: number, cover: number, temp: number | null) => {
      const rain = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code);
      const heavy = [65, 67, 82, 95, 96, 99].includes(code);
      const light = [51, 53, 56, 61, 80].includes(code);
      const snow = [71, 73, 75, 77, 85, 86].includes(code);
      const fog = [45, 48].includes(code);
      const storm = code >= 95;
      const c = Math.max(cover / 100, rain || snow ? 0.8 : 0, fog ? 0.6 : 0);
      RAIN.current = rain ? (heavy ? 1 : light ? 0.3 : 0.6) : 0;
      SNOW.current = snow ? 1 : 0;
      const dim = rain || snow ? 0.8 : c > 0.85 ? 0.95 : 1;
      const n = Math.round(4 + c * 14 + (rain || snow ? 8 : 0));
      const clouds: Cloud[] = Array.from({ length: n }, (_, i) => ({
        l: (i * 97) / n + Math.random() * 6, t: Math.random() * 40, w: 340 + Math.random() * 360, h: 80 + Math.random() * 70,
        dur: 40 + Math.random() * 30, delay: -i * 7, blur: c > 0.6 ? 30 : 22,
      }));
      setWx({ code, temp, grey: rain || snow ? 0.75 : c > 0.5 ? (c - 0.5) * 0.9 : 0, fog: fog ? 1 : 0, dim, storm, clouds });
    };
    const load = () => {
      fetch("https://api.open-meteo.com/v1/forecast?latitude=48.885&longitude=2.269&current=weather_code,cloud_cover,temperature_2m&timezone=Europe%2FParis")
        .then((r) => r.json())
        .then((d) => { if (alive && d.current) applyWx(d.current.weather_code, d.current.cloud_cover, d.current.temperature_2m ?? null); })
        .catch(() => {});
    };
    load();
    const id = window.setInterval(load, 30 * 60 * 1000);
    return () => { alive = false; window.clearInterval(id); };
  }, []);

  /* --- pluie (canvas) --- */
  useEffect(() => {
    const cv = rainRef.current;
    const cx = cv?.getContext("2d");
    if (!cv || !cx) return;
    let drops: { x: number; y: number; z: number; l: number; v: number; w: number; a: number; sl: number; ph: number }[] = [];
    let W = 0, H = 0, raf = 0;
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    const mk = () => {
      const z = Math.random();
      return { x: Math.random() * W, y: Math.random() * H, z, l: rnd(6, 34) * (0.55 + z * 0.75), v: rnd(7, 26) * (0.7 + z * 0.6), w: rnd(0.4, 1.6), a: rnd(0.05, 0.32), sl: rnd(0.05, 0.2), ph: Math.random() * 6.28 };
    };
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!RAIN.current) { if (drops.length) { cx.clearRect(0, 0, W, H); drops = []; } return; }
      if (cv.clientWidth !== W || cv.clientHeight !== H) { W = cv.width = cv.clientWidth; H = cv.height = cv.clientHeight; }
      const want = Math.round(((W * H) / 9000) * RAIN.current);
      while (drops.length < want) drops.push(mk());
      if (drops.length > want) drops.length = want;
      cx.clearRect(0, 0, W, H);
      cx.lineCap = "round";
      for (const d of drops) {
        d.y += d.v; d.x -= d.v * d.sl + Math.sin(d.ph + d.y * 0.01) * 0.3;
        if (d.y > H) { d.y = -d.l - rnd(0, 40); d.x = Math.random() * W; }
        cx.strokeStyle = `rgba(205,222,246,${d.a.toFixed(2)})`;
        cx.lineWidth = d.w;
        cx.beginPath(); cx.moveTo(d.x, d.y); cx.lineTo(d.x + d.l * d.sl, d.y - d.l); cx.stroke();
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* --- neige (canvas) --- */
  useEffect(() => {
    const cv = snowRef.current;
    const cx = cv?.getContext("2d");
    if (!cv || !cx) return;
    let W = 0, H = 0, F: { x: number; y: number; r: number; z: number; vy: number; a: number; ph: number; fq: number; amp: number; halo: boolean }[] = [], last = 0, wind = 0, windT = 0, raf = 0;
    const R = Math.random;
    const spr: Record<number, HTMLCanvasElement> = {};
    const sprite = (r: number) => {
      const k = Math.round(r * 2);
      if (spr[k]) return spr[k];
      const cnv = document.createElement("canvas"), s = Math.ceil(r * 4) + 2;
      cnv.width = cnv.height = s;
      const g = cnv.getContext("2d");
      if (g) {
        const mc = s / 2, gr = g.createRadialGradient(mc, mc, 0, mc, mc, mc);
        gr.addColorStop(0, "rgba(255,255,255,.95)"); gr.addColorStop(0.35, "rgba(255,255,255,.6)"); gr.addColorStop(1, "rgba(255,255,255,0)");
        g.fillStyle = gr; g.fillRect(0, 0, s, s);
      }
      return (spr[k] = cnv);
    };
    const mk = (top: boolean) => {
      const z = R(), r = 1 + z * z * 5;
      return { x: R() * W, y: top ? -10 - R() * 40 : R() * H, r, z, vy: (18 + z * 55) * (0.8 + R() * 0.4), a: 0.25 + z * 0.7, ph: R() * 6.28, fq: 0.4 + R() * 1.2, amp: 6 + R() * 22, halo: z > 0.85 && R() < 0.5 };
    };
    const size = () => { W = cv.width = cv.clientWidth; H = cv.height = cv.clientHeight; F = Array.from({ length: Math.round(Math.min(200, Math.max(120, (W * H) / 9000))) }, () => mk(false)); };
    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      if (!SNOW.current) { if (W) cx.clearRect(0, 0, W, H); return; }
      if (!W || cv.clientWidth !== W) size();
      const dt = Math.min(0.05, (t - (last || t)) / 1000); last = t;
      windT -= dt;
      if (windT <= 0) { windT = 4 + R() * 6; wind = (R() - 0.4) * 30; }
      const wv = wind * 0.5 + Math.sin(t / 7000) * 12;
      cx.clearRect(0, 0, W, H);
      for (const f of F) {
        f.y += f.vy * dt; f.ph += f.fq * dt; f.x += wv * (0.4 + f.z) * dt;
        const x = f.x + Math.sin(f.ph) * f.amp;
        if (f.y > H + 10) Object.assign(f, mk(true));
        if (f.x < -40) f.x += W + 80; else if (f.x > W + 40) f.x -= W + 80;
        const s = sprite(f.r);
        cx.globalAlpha = f.a;
        cx.drawImage(s, x - s.width / 2, f.y - s.height / 2);
        if (f.halo) { cx.globalAlpha = 0.12; cx.drawImage(s, x - s.width * 1.3, f.y - s.width * 1.3, s.width * 2.6, s.width * 2.6); }
      }
      cx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(frame);
    const onResize = () => { W = 0; };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, []);

  /* --- éclairs discrets (orage) --- */
  useEffect(() => {
    const cv = flashRef.current;
    const cx = cv?.getContext("2d");
    if (!cv || !cx) return;
    let stopped = false;
    const timers: number[] = [];
    const strike = () => {
      if (stopped || cv.style.display === "none") return;
      const W = (cv.width = cv.clientWidth), H = (cv.height = cv.clientHeight);
      const x = W * (0.15 + Math.random() * 0.7), y = H * (0.08 + Math.random() * 0.3);
      void x; void y;
      const seq = [1, 0.35, 0.7, 0, 0.45, 0];
      let k = 0;
      const fr = () => {
        if (stopped) return;
        cx.clearRect(0, 0, W, H);
        const o = seq[k];
        if (o) {
          const g = cx.createLinearGradient(0, 0, 0, H);
          g.addColorStop(0, `rgba(235,242,255,${(o * 0.42).toFixed(2)})`);
          g.addColorStop(0.6, `rgba(215,228,255,${(o * 0.22).toFixed(2)})`);
          g.addColorStop(1, `rgba(215,228,255,${(o * 0.08).toFixed(2)})`);
          cx.fillStyle = g;
          cx.fillRect(0, 0, W, H);
        }
        if (++k < seq.length) timers.push(window.setTimeout(fr, 55));
        else cx.clearRect(0, 0, W, H);
      };
      fr();
    };
    const next = () => {
      timers.push(window.setTimeout(() => { strike(); if (Math.random() < 0.25) timers.push(window.setTimeout(strike, 420)); next(); }, 3000 + Math.random() * 6000));
    };
    next();
    return () => { stopped = true; timers.forEach((t) => window.clearTimeout(t)); };
  }, []);

  /* --- rendu --- */
  const evMin = useMemo(() => events.map((e) => ({ ...e, min: toM(e.value) })), [events]);
  const visible = evMin.filter((e) => e.min > m - 1).slice(0, 5);
  const curIdx = evMin.findIndex((e) => e.min >= m);
  const rf = (min: number) => clamp((min - D0) / (D1 - D0)) * 100;
  const hhmm = fmt(m);
  const ticks: { left: string; label: string }[] = [];
  for (let t = D0; t <= D1; t += 180) ticks.push({ left: `${rf(t)}%`, label: `${String(t / 60).padStart(2, "0")} h` });

  const cards = [...visible, ...(tomorrow ?? [])].slice(0, 9);

  return (
    <div ref={rootRef} className="relative h-full w-full overflow-hidden" style={{ background: "#050d20" }}>
      {/* ciel */}
      <div ref={skyRef} className="absolute inset-0" style={{ background: "#0a1a3d" }} />
      {/* étoiles */}
      <div ref={starsRef} className="absolute inset-0" style={{ opacity: 0 }}>
        {stars.map((s, i) => (
          <i key={i} className="tv-star" style={{ left: `${s.l}%`, top: `${s.t}%`, opacity: s.o, transform: `scale(${s.sc})`, animationDelay: `${s.d}s` }} />
        ))}
      </div>
      {/* météo : voiles gris, brouillard, pluie, neige, éclairs */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0" style={{ background: "linear-gradient(rgba(85,95,110,.7), rgba(110,120,135,.35) 60%, transparent)", opacity: (wx?.grey ?? 0) * 0.13, transition: "opacity 2s" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(205,214,226,.85), rgba(205,214,226,.45) 45%, rgba(205,214,226,.15) 80%, transparent)", filter: "blur(8px)", opacity: wx?.fog ?? 0, transition: "opacity 2s", animation: "tv-fog 40s ease-in-out infinite alternate" }} />
        <canvas ref={rainRef} className="absolute inset-0 h-full w-full" style={{ display: RAIN.current ? undefined : "none" }} />
        <canvas ref={snowRef} className="absolute inset-0 h-full w-full" style={{ display: SNOW.current ? undefined : "none" }} />
        <canvas ref={flashRef} className="absolute inset-0 h-full w-full" style={{ display: wx?.storm ? "" : "none" }} />
      </div>

      {/* nuages + brume : pleine largeur (sinon une arête visible sous les cartes) */}
      <div className="absolute inset-0 overflow-hidden" style={{ pointerEvents: "none" }}>
        {/* nuages */}
          <div
            ref={cloudsRef}
            className="absolute"
            style={{ left: "-10%", right: "-10%", top: 0, bottom: "10%", pointerEvents: "none", filter: wx && wx.grey > 0.5 ? "brightness(.8) saturate(.6)" : "" }}
          >
            {(wx?.clouds ?? defaultClouds).map((c, i) => (
              <i
                key={i}
                className="tv-cloud"
                style={{ left: `${c.l}%`, top: `${c.t}%`, width: c.w, height: c.h, filter: `blur(${c.blur}px)`, animationDelay: `${c.delay}s`, ["--t" as string]: `${c.dur}s` } as React.CSSProperties}
              />
            ))}
          </div>
          <div ref={hazeRef} className="absolute" style={{ left: "-20vw", right: "-20vw", height: "160px", pointerEvents: "none" }} />
      </div>
      {/* zone du soleil — sur TV, limitée à la zone gauche pour ne pas passer sous les cartes de droite */}
      {/* soleil : pleine largeur pour que son halo ne soit jamais coupé */}
      <div className="absolute inset-0" style={{ pointerEvents: "none" }}>
        <RealisticSun x={sunP.x} y={sunP.y} warm={sunP.warm} opacity={sunP.op} cloud={!wx ? 0 : wx.storm ? 0.8 : wx.dim < 0.9 ? 0.6 : wx.grey > 0 ? 0.3 : 0} />
      </div>
      <div ref={arcRef} className="absolute inset-0" style={{ right: contentRight }}>
        <svg className="absolute inset-0 h-full w-full" viewBox={arc ? `0 0 ${arc.w} ${arc.h}` : "0 0 100 100"} preserveAspectRatio="none" aria-hidden="true">
          <path ref={guideRef} fill="none" stroke="rgba(240,214,137,.30)" strokeWidth="1.2" strokeDasharray="4 8" />
          <path ref={doneRef} fill="none" stroke="rgba(240,214,137,.55)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        {/* soleil photoréaliste */}
        {/* lune (phase réelle) */}
        <div
          ref={moonRef}
          className="absolute left-0 top-0"
          style={{ width: "10vh", height: "10vh", marginLeft: "-5vh", marginTop: "-5vh", opacity: 0, filter: "drop-shadow(0 0 12px rgba(255,255,255,.95)) drop-shadow(0 0 34px rgba(126,181,246,.9)) brightness(1.25)" }}
          dangerouslySetInnerHTML={{ __html: moon }}
        />
        {/* brume d'horizon + reflet */}
        <div ref={reflRef} className="absolute" style={{ width: "110px", height: "150px", marginLeft: "-55px", borderRadius: "50%", background: "radial-gradient(ellipse at 50% 0%, rgba(255,205,130,.6), transparent 70%)", filter: "blur(9px)", opacity: 0, pointerEvents: "none" }} />
        {/* rail horaire */}
        <div ref={railRef} className="absolute left-0 right-0" style={{ pointerEvents: "none", zIndex: 2, display: "none" }}>
          {ticks.map((t) => (
            <span key={t.label} className="tv-tick" style={{ left: t.left }}>{t.label}</span>
          ))}
          {evMin.map((e, i) =>
            e.min >= m - 1 ? (
              <span key={`${e.label}-${e.value}`} className={`tv-mk${i === curIdx ? " cur" : ""}`} style={{ left: `${rf(e.min)}%` }} />
            ) : null,
          )}
          <span ref={nowLineRef} className="tv-now"><b>Maintenant</b></span>
        </div>
      </div>

      {/* en-tête : logo, horloge, phase, météo */}
      <div className="absolute left-0 top-0 z-10 flex items-start justify-between" style={{ right: contentRight, padding: "2.6vh 2vw 0", textShadow: "0 2px 18px rgba(5,13,32,.55)" }}>
        <div>
          {logoUrl && (
            <div className="flex items-center" style={{ gap: "1vw" }}>
              <img src={logoUrl} alt="Hasdé Tsion" className="tv-brand-logo" />
            </div>
          )}
          <p className="uppercase" style={{ marginTop: "1.4vh", fontFamily: MONT, fontSize: "1.1vh", fontWeight: 700, letterSpacing: "0.32em", color: "#F0D689" }}>
            La journée · horaires du jour
          </p>
          <div className="tv-clock" aria-label="Heure actuelle">
            {[...hhmm].map((c, i) =>
              c === ":" ? (
                <span key={`s${i}`} className="sep">:</span>
              ) : (
                <span key={`d${i}-${c}`} className="d"><span>{c}</span></span>
              ),
            )}
          </div>
          <div style={{ marginTop: "0.8vh", fontFamily: MONT, fontSize: "1.3vh", letterSpacing: "0.3em", textTransform: "uppercase", color: "#F0D689", minHeight: "1.4em" }}>
            {sunPhase(m, SR, SS)}
          </div>
          {greeting && (
            <div className="flex items-baseline" style={{ marginTop: "0.6vh", gap: "0.6em", fontFamily: MONT, fontWeight: 800, fontSize: "2.2vh", color: "#F0D689", textShadow: "0 2px 18px rgba(240,214,137,.35)" }}>
              <span>{greeting[0]}</span>
              <span className="font-hebrew" dir="rtl" style={{ fontWeight: 600, opacity: 0.9 }}>{greeting[1]}</span>
            </div>
          )}
          {parashaFr && (
            <div className="flex items-baseline" style={{ marginTop: "0.6vh", gap: "0.7em", fontFamily: MONT, fontSize: "1.15vh", fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: "#F0D689", textShadow: "0 2px 12px rgba(5,13,32,.5)" }}>
              <span>{parashaFr}</span>
              {parashaHe && <span className="font-hebrew" dir="rtl" style={{ fontSize: "1.5vh", letterSpacing: 0, fontWeight: 600 }}>{parashaHe}</span>}
            </div>
          )}
          {wx && (
            <div style={{ marginTop: "0.6vh", fontFamily: MONT, fontSize: "1.5vh", letterSpacing: "0.08em", color: "#DBE7FB", opacity: 0.9 }} aria-live="polite">
              Actuellement · {wxLabel(wx.code)}{wx.temp != null ? ` · ${Math.round(wx.temp)} °C` : ""}
            </div>
          )}
        </div>
        <div className="text-right" style={{ paddingTop: "0.4vh" }}>
          <p className="capitalize" style={{ fontFamily: MONT, fontSize: "1.4vh", fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(243,246,252,.85)" }}>
            {dateFr}
          </p>
          <p dir="rtl" className="font-hebrew" style={{ marginTop: "0.5vh", fontSize: "1.8vh", color: "#F0D689" }}>
            {dateHe}
          </p>
          <p style={{ marginTop: "1.2vh", fontSize: "1.15vh", color: "#9FB0CF", maxWidth: "24ch", marginLeft: "auto" }}>
            Horaires basés sur la position de Neuilly-sur-Seine.
          </p>
        </div>
      </div>

      {/* cartes horaires — uniquement les horaires à venir */}
      <div className="absolute left-0 bottom-0 z-10" style={{ right: contentRight, padding: "0 2vw 2.6vh" }}>
        <div
          className="grid"
          style={{ gridTemplateColumns: `repeat(${Math.max(1, cards.length)}, minmax(0,1fr))`, columnGap: "10px", rowGap: 0 }}
        >
          {(() => {
            const nToday = Math.min(visible.length, cards.length);
            const nTom = cards.length - nToday;
            const head = (txt: string, span: number, start: number) => (
              <div key={txt} className="flex items-center" style={{ gridColumn: `${start} / span ${span}`, gridRow: 1, gap: "0.8vw", marginBottom: "1vh", fontFamily: MONT, fontSize: "1.15vh", fontWeight: 800, letterSpacing: "0.28em", textTransform: "uppercase", color: "#F3F6FC", textShadow: "0 2px 12px rgba(5,13,32,.5)" }}>
                <span style={{ whiteSpace: "nowrap" }}>{txt}</span>
                <span style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(243,246,252,.55), transparent)" }} />
              </div>
            );
            return [
              nToday > 0 && nTom > 0 ? head("Aujourd'hui", nToday, 1) : null,
              nTom > 0 ? head("Samedi · Chabbat", nTom, nToday + 1) : null,
            ];
          })()}
          {cards.map((e, i) => {
            const cur = i === 0 && visible.length > 0;
            const raw = e.label.replace(/^Sam\.\s*/, "");
            const [name0, ...rest] = raw.split(" · ");
            const name = name0.replace(/^Entrée de Chabbat$/i, "Entrée").replace(/^Sortie de Chabbat$/i, "Sortie");
            const note = rest.join(" · ");
            const office = kindOf(name0) === "Office" || kindOf(e.label) === "Office";
            const he = heOf(name0) || heOf(e.label);
            return (
              <div
                key={`${e.label}-${e.value}`}
                style={{
                  position: "relative",
                  display: "grid",
                  gridRow: "2 / span 4",
                  gridColumn: i + 1,
                  gridTemplateRows: "subgrid",
                  borderRadius: 18,
                  padding: "1.4vh 0.7vw 1.4vh",
                  minWidth: 0,
                  background: cur ? "rgba(5,13,32,.48)" : "rgba(5,13,32,.34)",
                  border: `1px solid ${cur ? "rgba(240,214,137,.75)" : "rgba(219,231,251,.16)"}`,
                  boxShadow: cur ? "0 0 0 1px rgba(240,214,137,.25), 0 10px 30px rgba(5,13,32,.35)" : "0 8px 24px rgba(5,13,32,.2)",
                  transition: "background .5s, border-color .5s",
                }}
              >
                <span
                  className="flex items-center justify-between"
                  style={{ gap: "6px", minWidth: 0, fontFamily: MONT, fontSize: "1vh", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: cur || office ? "#F0D689" : "#9FB0CF" }}
                >
                  <span>{kindOf(name0)}</span>
                  {cur && (
                    <span style={{ position: "absolute", top: "-1vh", right: "0.6vw", fontSize: "0.82vh", letterSpacing: "0.08em", padding: "3px 8px", borderRadius: 999, background: "#F0D689", color: "#0a1a3d", fontWeight: 800, whiteSpace: "nowrap" }}>
                      Prochain
                    </span>
                  )}
                </span>
                <strong style={{ display: "block", marginTop: "0.9vh", minWidth: 0, fontFamily: MONT, fontSize: "1.75vh", fontWeight: 800, color: office ? "#F0D689" : "#fff", lineHeight: 1.15 }}>
                  {name}
                  {he && <span className="font-hebrew" dir="rtl" style={{ display: "block", textAlign: "left", marginTop: "0.3vh", color: "#9FB0CF", fontSize: "1.3vh", fontWeight: 500 }}>{he}</span>}
                </strong>
                <span style={{ marginTop: "0.5vh", fontFamily: MONT, fontSize: "1.05vh", fontWeight: 500, color: "#C9D6EE", lineHeight: 1.25, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" } as React.CSSProperties}>
                  {note}
                </span>
                <div style={{ marginTop: "1vh", alignSelf: "end", fontFamily: MONT, fontWeight: 800, fontSize: "2.5vh", letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", lineHeight: 1, color: "#F3F6FC" }}>
                  {e.value}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
