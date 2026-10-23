// sunRenderer.ts — soleil réaliste en canvas 2D (aucune dépendance)
// Dessine : bloom atmosphérique, couronne, rayons de lumière animés, traînée anamorphique,
// pointes de diffraction, disque blanc incandescent et reflets d'objectif chauds.
// Tout est en lumière additive ("lighter") : posé sur un ciel bleu, il blanchit puis dore, sans jamais grisailler.

export interface SunOptions {
  /** position du centre du soleil dans le canvas, en pixels CSS */
  x: number;
  y: number;
  /** rayon du disque en pixels CSS (défaut 26) */
  radius?: number;
  /** 0 = soleil haut (blanc pur) → 1 = coucher (orangé, plus gros, rayons couchés) */
  warm?: number;
  /** 0 = ciel dégagé → 1 = couvert (halo diffus, plus de pointes ni de rayons nets) */
  cloud?: number;
  /** 0..1, à baisser quand le soleil passe sous l'horizon */
  opacity?: number;
  /** reflets d'objectif le long de l'axe soleil → centre du canvas */
  lensFlare?: boolean;
  /** temps en secondes (fait vivre les rayons) */
  time: number;
}

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const rgba = (r: number, g: number, b: number, a: number) =>
  `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${clamp(a).toFixed(4)})`;

/** dégradé radial multi-stops */
function radial(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, stops: Array<[number, string]>) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}
function fillCircle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, style: CanvasGradient | string) {
  ctx.fillStyle = style;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

export function drawSun(ctx: CanvasRenderingContext2D, w: number, h: number, o: SunOptions): void {
  ctx.clearRect(0, 0, w, h);
  const A = clamp(o.opacity ?? 1);
  if (A <= 0.003) return;

  const R = (o.radius ?? 26) * (1 + (o.warm ?? 0) * 0.35);
  const warm = clamp(o.warm ?? 0);
  const cloud = clamp(o.cloud ?? 0);
  const clear = 1 - cloud * 0.85;              // netteté des détails (rayons, pointes, disque)
  const T = o.time;
  const { x, y } = o;

  // teinte selon la hauteur : blanc chaud → ambre → orangé
  const cG = mix(244, 150, warm), cB = mix(214, 70, warm);            // couleur du halo
  const dG = mix(255, 214, warm), dB = mix(250, 150, warm);           // couleur du bord du disque

  const breath = 1 + Math.sin(T * 0.7) * 0.025;
  const flick = 1 + Math.sin(T * 9.1) * 0.01 + Math.sin(T * 13.7) * 0.006;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  // 1. bloom atmosphérique (chute en ~1/r²) : le ciel blanchit autour du soleil, jamais de bague bleue
  const bloomR = R * 26 * breath;
  fillCircle(ctx, x, y, bloomR, radial(ctx, x, y, bloomR, [
    [0.00, rgba(255, 250, 238, 0.60 * A)],
    [0.04, rgba(255, 246, 224, 0.42 * A)],
    [0.10, rgba(255, cG, cB, 0.20 * A)],
    [0.22, rgba(255, cG - 8, cB - 20, 0.085 * A)],
    [0.45, rgba(255, cG - 20, cB - 40, 0.028 * A)],
    [1.00, rgba(255, cG - 20, cB - 40, 0)],
  ]));

  // 2. couronne dorée
  const corR = R * 6.5 * breath;
  fillCircle(ctx, x, y, corR, radial(ctx, x, y, corR, [
    [0.0, rgba(255, 252, 240, 0.85 * A)],
    [0.18, rgba(255, mix(236, 170, warm), mix(190, 90, warm), 0.45 * A * (0.6 + 0.4 * clear))],
    [0.55, rgba(255, mix(210, 130, warm), mix(150, 60, warm), 0.12 * A)],
    [1.0, rgba(255, 190, 110, 0)],
  ]));

  // 3. grands faisceaux crépusculaires (larges, très doux) — surtout par temps clair
  if (clear > 0.1) {
    const N = 7, L = R * 34;
    for (let i = 0; i < N; i++) {
      const base = i * ((Math.PI * 2) / N) + T * 0.012 + Math.sin(i * 7.1) * 0.2;
      const an = base + Math.sin(T * 0.23 + i * 1.9) * 0.05;
      const hw = 0.11 + 0.05 * Math.sin(T * 0.31 + i);
      const al = (0.035 + 0.03 * (Math.sin(T * 0.5 + i * 2.2) * 0.5 + 0.5)) * A * clear * (1 - warm * 0.2);
      const g = ctx.createLinearGradient(x, y, x + Math.cos(an) * L, y + Math.sin(an) * L);
      g.addColorStop(0, rgba(255, 246, 220, al));
      g.addColorStop(1, rgba(255, 236, 200, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(an - hw) * L, y + Math.sin(an - hw) * L);
      ctx.lineTo(x + Math.cos(an + hw) * L, y + Math.sin(an + hw) * L);
      ctx.closePath();
      ctx.fill();
    }
  }

  // 4. rayons fins en mouvement : 48 faisceaux qui respirent et scintillent chacun à leur rythme
  if (clear > 0.05) {
    const NR = 48, Lr = R * (14 + warm * 6) * breath;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, 1 - warm * 0.35); // couchés vers l'horizon quand le soleil est bas
    const g = radial(ctx, 0, 0, Lr, [
      [0.0, rgba(255, 252, 238, 0.95)],
      [0.2, rgba(255, 244, 214, 0.5)],
      [1.0, rgba(255, 232, 190, 0)],
    ]);
    ctx.fillStyle = g;
    for (let i = 0; i < NR; i++) {
      const ph = i * 2.399963;
      const ang = T * 0.03 + (i * Math.PI * 2) / NR + Math.sin(T * 0.27 + ph) * 0.03;
      const len = Lr * (0.5 + 0.5 * (Math.sin(T * 0.9 + ph) * 0.5 + 0.5)) * (i % 4 === 0 ? 1.3 : 1);
      const hw = 0.02 * (0.7 + 0.6 * (Math.sin(T * 0.6 + ph * 1.3) * 0.5 + 0.5));
      ctx.globalAlpha = (0.05 + 0.15 * (Math.sin(T * 1.3 + ph * 0.7) * 0.5 + 0.5)) * A * clear * (1 - warm * 0.3);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(ang - hw) * len, Math.sin(ang - hw) * len);
      ctx.lineTo(Math.cos(ang + hw) * len, Math.sin(ang + hw) * len);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // 5. traînée anamorphique horizontale (lentille) — s'étale sur l'horizon quand le soleil est bas
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, 0.018 + warm * 0.012);
  const sR = R * (20 + warm * 8);
  ctx.fillStyle = radial(ctx, 0, 0, sR, [
    [0.0, rgba(255, 252, 242, (0.5 + warm * 0.3) * A * flick * (0.5 + 0.5 * clear))],
    [0.45, rgba(255, 238, 205, 0.16 * A)],
    [1.0, rgba(255, 224, 175, 0)],
  ]);
  ctx.fillRect(-sR, -sR, sR * 2, sR * 2);
  ctx.restore();

  // 6. pointes de diffraction (6 branches), qui tournent très lentement
  if (clear > 0.25) {
    const Ls = R * (7.5 - warm * 3) * flick;
    const rot = T * 0.045;
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot + (i * Math.PI) / 3);
      const g1 = ctx.createLinearGradient(-Ls, 0, Ls, 0);
      g1.addColorStop(0, rgba(255, 250, 235, 0));
      g1.addColorStop(0.5, rgba(255, 253, 244, 0.5 * A * clear));
      g1.addColorStop(1, rgba(255, 250, 235, 0));
      ctx.fillStyle = g1;
      ctx.fillRect(-Ls, -0.8, Ls * 2, 1.6);
      const g2 = ctx.createLinearGradient(-Ls * 0.55, 0, Ls * 0.55, 0);
      g2.addColorStop(0, rgba(255, 240, 210, 0));
      g2.addColorStop(0.5, rgba(255, 246, 224, 0.17 * A * clear));
      g2.addColorStop(1, rgba(255, 240, 210, 0));
      ctx.fillStyle = g2;
      ctx.fillRect(-Ls * 0.55, -3.5, Ls * 1.1, 7);
      ctx.restore();
    }
  }

  // 7. disque : cœur blanc incandescent, bord doré très doux (ni bague, ni bleu)
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, 1 - warm * 0.14); // aplati par la réfraction près de l'horizon
  const soft = mix(0.12, 0.55, cloud); // le bord devient flou par temps couvert
  const dR = R * (1.5 + cloud * 0.8);
  ctx.fillStyle = radial(ctx, 0, 0, dR, [
    [0.0, rgba(255, 255, 253, 1 * A)],
    [0.55 - soft * 0.4, rgba(255, 255, 250, 0.98 * A)],
    [0.68, rgba(255, dG, dB, 0.72 * A * (1 - cloud * 0.4))],
    [0.82, rgba(255, mix(236, 190, warm), mix(190, 110, warm), 0.28 * A)],
    [1.0, rgba(255, 220, 160, 0)],
  ]);
  ctx.fillRect(-dR, -dR, dR * 2, dR * 2);
  // surexposition : second noyau plus large, très doux
  const hR = R * 3.2;
  ctx.fillStyle = radial(ctx, 0, 0, hR, [
    [0.0, rgba(255, 255, 250, 0.9 * A * (1 - warm * 0.5))],
    [0.3, rgba(255, 250, 230, 0.45 * A)],
    [1.0, rgba(255, cG, cB, 0)],
  ]);
  ctx.fillRect(-hR, -hR, hR * 2, hR * 2);
  ctx.restore();

  // 8. reflets d'objectif chauds le long de l'axe (jamais bleus)
  if (o.lensFlare !== false && clear > 0.3) {
    const cx0 = w / 2, cy0 = h / 2;
    const vis = A * clear * (1 - warm * 0.6);
    const ghosts: Array<[number, number, number[], number, boolean]> = [
      [1.25, R * 1.7, [255, 228, 175], 0.1, true],
      [1.65, R * 0.6, [255, 196, 140], 0.13, false],
      [2.1, R * 2.8, [255, 214, 165], 0.06, true],
      [2.6, R * 1.0, [255, 205, 150], 0.09, false],
      [3.1, R * 4.5, [255, 210, 160], 0.04, true],
    ];
    for (const [k, r, c, al, ring] of ghosts) {
      const gx = x + (cx0 - x) * k, gy = y + (cy0 - y) * k;
      const g = ring
        ? radial(ctx, gx, gy, r, [[0, rgba(c[0], c[1], c[2], 0)], [0.78, rgba(c[0], c[1], c[2], 0)], [0.9, rgba(c[0], c[1], c[2], al * vis)], [1, rgba(c[0], c[1], c[2], 0)]])
        : radial(ctx, gx, gy, r, [[0, rgba(c[0], c[1], c[2], al * vis)], [1, rgba(c[0], c[1], c[2], 0)]]);
      fillCircle(ctx, gx, gy, r, g);
    }
  }

  ctx.restore();
}