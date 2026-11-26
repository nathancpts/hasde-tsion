import { useEffect, useState } from "react";
import siha from "@/assets/siha-rabbi-seouda-chlichit.jpg.asset.json";
import lachone from "@/assets/lois-lachone-hara.jpg.asset.json";

const VISUALS = [
  { src: siha.url, alt: "Nouveau au 50 : Sih'a du Rabbi pendant la séouda chlichit" },
  { src: lachone.url, alt: "Nouveau au 50 : Les lois du Lachone Hara, après Arvit du vendredi soir" },
];
const INTERVAL = 3 * 60 * 1000;
const DURATION = 60 * 1000;

/** Toutes les 3 min sur la TV, affiche un visuel (en alternance) pendant 1 min. */
export function TVVisualsPopup() {
  const [index, setIndex] = useState<number | null>(null);

  useEffect(() => {
    let n = 0;
    let hide: ReturnType<typeof setTimeout>;
    const id = setInterval(() => {
      setIndex(n % VISUALS.length);
      n++;
      hide = setTimeout(() => setIndex(null), DURATION);
    }, INTERVAL);
    return () => { clearInterval(id); clearTimeout(hide); };
  }, []);

  if (index === null) return null;
  const v = VISUALS[index]!;
  return (
    <div
      className="fixed inset-0 z-[9600] flex items-center justify-center overflow-hidden bg-background"
      onClick={() => setIndex(null)}
    >
      <img src={v.src} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-40" style={{ filter: "blur(40px)", transform: "scale(1.1)" }} />
      <img src={v.src} alt={v.alt} className="relative max-h-full max-w-full object-contain" />
    </div>
  );
}
