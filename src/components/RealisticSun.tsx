import { useEffect, useRef } from "react";
import { drawSun } from "./sunRenderer";

interface RealisticSunProps {
  /** centre du soleil, en pixels CSS, relatif au conteneur parent */
  x: number;
  y: number;
  /** rayon du disque (défaut 26) */
  radius?: number;
  /** 0 = soleil haut, 1 = coucher */
  warm?: number;
  /** 0 = ciel dégagé, 1 = couvert (pluie, orage…) */
  cloud?: number;
  /** 0..1 : à baisser quand le soleil passe sous l'horizon */
  opacity?: number;
  lensFlare?: boolean;
  className?: string;
}

/**
 * Soleil réaliste en canvas. À placer dans le conteneur du ciel (position: relative),
 * au-dessus des nuages et sous les cartes. Le canvas couvre tout le parent.
 */
export default function RealisticSun({
  x, y, radius = 26, warm = 0, cloud = 0, opacity = 1, lensFlare = true, className,
}: RealisticSunProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  // les props changent souvent : on les garde dans une ref pour ne pas relancer la boucle
  const props = useRef({ x, y, radius, warm, cloud, opacity, lensFlare });
  props.current = { x, y, radius, warm, cloud, opacity, lensFlare };

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const parent = canvas.parentElement!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, dpr = 1, raf = 0, last = 0, visible = true;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = parent.clientWidth; h = parent.clientHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      canvas.style.width = w + "px"; canvas.style.height = h + "px";
    };
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible || document.hidden) return;
      if (now - last < 33) return; // ~30 images/s : largement suffisant et léger pour une TV
      last = now;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawSun(ctx, w, h, { ...props.current, time: now / 1000 });
    };

    resize();
    const ro = new ResizeObserver(resize); ro.observe(parent);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(canvas);

    if (reduced) { // mouvement réduit : une seule image fixe
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawSun(ctx, w, h, { ...props.current, time: 0 });
      const redraw = () => { resize(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); drawSun(ctx, w, h, { ...props.current, time: 0 }); };
      window.addEventListener("resize", redraw);
      return () => { ro.disconnect(); io.disconnect(); window.removeEventListener("resize", redraw); };
    }
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={className}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    />
  );
}