import { useEffect, useRef, useState } from "react";

/** En-tête + fond vivant identiques au site de présentation (public/presentation.html). */
export function SiteChrome({ active = "chants" }: { active?: "chants" | "promesses" | "communaute" }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onS = () => setSolid(window.scrollY > 40);
    onS();
    window.addEventListener("scroll", onS, { passive: true });
    return () => window.removeEventListener("scroll", onS);
  }, []);

  useEffect(() => {
    const c = cv.current;
    if (!c) return;
    const cx = c.getContext("2d");
    if (!cx) return;
    const RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, raf = 0;
    const mouse = { x: 0.5, y: 0.3, tx: 0.5, ty: 0.3 };
    const size = () => {
      const r = 0.3;
      W = c.width = Math.max(1, innerWidth * r);
      H = c.height = Math.max(1, innerHeight * r);
    };
    const pm = (e: PointerEvent) => { mouse.tx = e.clientX / innerWidth; mouse.ty = e.clientY / innerHeight; };
    size();
    addEventListener("resize", size);
    addEventListener("pointermove", pm);
    const blobs = [
      { c: [90, 154, 230], r: 0.55, sx: 0.00011, sy: 0.00013, ox: 0.2, oy: 0.3, a: 0.42 },
      { c: [31, 78, 168], r: 0.7, sx: 0.00008, sy: 0.00006, ox: 0.8, oy: 0.2, a: 0.42 },
      { c: [63, 127, 220], r: 0.45, sx: 0.00014, sy: 0.0001, ox: 0.5, oy: 0.8, a: 0.42 },
      { c: [240, 214, 137], r: 0.3, sx: 0.00009, sy: 0.00012, ox: 0.7, oy: 0.7, a: 0.18 },
    ];
    let last = 0;
    const draw = (t: number) => {
      if (!RM) raf = requestAnimationFrame(draw);
      if (document.hidden || t - last < 33) return;
      last = t;
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;
      cx.globalCompositeOperation = "source-over";
      cx.fillStyle = "#050d20";
      cx.fillRect(0, 0, W, H);
      cx.globalCompositeOperation = "lighter";
      blobs.forEach((b, i) => {
        const x = (b.ox + Math.sin(t * b.sx + i) * 0.22) * W;
        const y = (b.oy + Math.cos(t * b.sy + i * 2) * 0.2) * H;
        const r = b.r * Math.max(W, H);
        const g = cx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(${b.c},${b.a})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        cx.fillStyle = g;
        cx.fillRect(0, 0, W, H);
      });
      const mx = mouse.x * W, my = mouse.y * H, mr = 0.35 * Math.max(W, H);
      const g = cx.createRadialGradient(mx, my, 0, mx, my, mr);
      g.addColorStop(0, "rgba(140,190,255,.28)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      cx.fillStyle = g;
      cx.fillRect(0, 0, W, H);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", size);
      removeEventListener("pointermove", pm);
    };
  }, []);

  return (
    <>
      <canvas ref={cv} aria-hidden="true" className="site-bg" />
      <div aria-hidden="true" className="site-grain" />
      <nav className={"site-nav" + (solid ? " solid" : "")} aria-label="Navigation">
        <a className="site-brand" href="/">
          <img src="/__l5e/assets-v1/9c13281d-a737-4807-a0f1-f20b35311edf/logo-hasde-gold.png" alt="Hasdé Tsion" width={160} height={65} />
        </a>
        <div className="site-links">
          <a href="/#etude">Étude</a>
          <a href="/chants" className={active === "chants" ? "on" : undefined} aria-current={active === "chants" ? "page" : undefined}>Chants</a>
          <a href="/communaute" className={active === "communaute" ? "on" : undefined} aria-current={active === "communaute" ? "page" : undefined}>Communauté</a>
          <a href="/promesses" className={active === "promesses" ? "on" : undefined} aria-current={active === "promesses" ? "page" : undefined}>Promesses</a>
        </div>
        <a className="site-tv" href="/TV"><i />Mode TV</a>
      </nav>
    </>
  );
}
