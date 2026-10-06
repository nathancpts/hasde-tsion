import { useEffect, useRef, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SiteChrome } from "@/components/SiteChrome";
import { DONATIONS_REPAS } from "@/lib/weekly-content";

export const Route = createFileRoute("/communaute")({
  head: () => ({
    meta: [
      { title: "Communauté — Hasdé Tsion, Neuilly-sur-Seine" },
      { name: "description", content: "Offices, repas de Chabbat, fêtes, activités pour les enfants : la vie de la communauté Hassidim de Sion à Neuilly." },
      { property: "og:title", content: "Communauté — Hasdé Tsion" },
      { property: "og:description", content: "Une communauté qui vit toute l'année : offices, repas, fêtes et activités." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CommunautePage,
});

const HA = "https://www.helloasso.com/associations/hassidim-de-sion";
const ADDRESS = "50 rue du Bois de Boulogne, 92200 Neuilly-sur-Seine";

const ICONS: Record<string, ReactNode> = {
  clock: <><path d="M12 6c-2-1.5-5-2-8-1.5v14c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5v-14c-3-.5-6 0-8 1.5z" /><path d="M12 6v14" /><path d="M6.5 8.5h3M6.5 11h3M14.5 8.5h3M14.5 11h3" /></>,
  wine: <><path d="M7 3h10v4a5 5 0 0 1-10 0z" /><path d="M7.5 6h9" /><path d="M12 12v6M8 21h8M9.5 18h5" /></>,
  sukkah: <><path d="M3 8c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0" /><path d="M5 8.5V21M19 8.5V21M3 21h18" /><path d="M9.5 21v-6h5v6" /><path d="M6 5.5l1.5-2M11 5l1-2M16 5.5l1.5-2" /></>,
  scroll: <><path d="M6 2v20M18 2v20" /><rect x="4.5" y="5" width="3" height="14" rx="1.5" /><rect x="16.5" y="5" width="3" height="14" rx="1.5" /><path d="M7.5 7h9v10h-9" /><path d="M10 10h4M10 12.5h4M10 15h3" /></>,
  kids: <><circle cx="8" cy="6" r="2.2" /><circle cx="16" cy="8" r="1.8" /><path d="M8 8.5v6M5 11l3-1.5 3 1.5M6 20l2-5.5 2 5.5" /><path d="M16 10v4.5M13.5 12.5 16 11l2.5 1.5M14.5 20l1.5-5.5 1.5 5.5" /></>,
  hands: <><path d="M12 20.5s-7-4.3-7-9.2A3.8 3.8 0 0 1 12 9a3.8 3.8 0 0 1 7 2.3c0 4.9-7 9.2-7 9.2z" /><path d="M12 6V2M9 4.5 7.5 2.5M15 4.5l1.5-2" /></>,
};

const ACTS: [string, string, string][] = [
  ["clock", "Offices quotidiens", "Cha'harit, Minha et Arvit, chaque jour, au rythme du soleil."],
  ["wine", "Repas de Chabbat", "Vendredi soir et Chabbat midi, sur inscription."],
  ["sukkah", "Repas de Souccot", "Dans la souccah de la synagogue, pendant la fête."],
  ["scroll", "Sim'hat Torah", "Hakafot, danses et joie autour de la Torah."],
  ["kids", "Hasdé Kids", "Activités pour les enfants toute l'année."],
  ["hands", "Prières pour les malades", "Pour la guérison des proches, sans inscription."],
];
const AMOUNTS = [26, 52, 126, 260];

function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setShown(true);
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } }, { rootMargin: "0px 0px -8% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={className} style={{ opacity: shown ? 1 : 0, transform: shown ? "none" : "translateY(40px)", transition: `opacity 1.1s cubic-bezier(.16,1,.3,1) ${delay}s, transform 1.1s cubic-bezier(.16,1,.3,1) ${delay}s` }}>
      {children}
    </div>
  );
}

const panel = "h-full rounded-[24px] border border-chant-line bg-chant-panel p-6 backdrop-blur-xl sm:p-8";
const eyebrow = "text-[11px] font-bold uppercase tracking-[0.32em] text-chant-gold";
const pill = "inline-flex items-center gap-2 rounded-full border border-chant-line px-5 py-3 text-sm font-semibold transition hover:border-chant-gold";

function CommunautePage() {
  const [amt, setAmt] = useState(52);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(ADDRESS); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
  };

  return (
    <main className="chants-page min-h-[100dvh] bg-chant-night text-chant-ink">
      <SiteChrome active="communaute" />
      <section className="mx-auto w-full max-w-[1540px] px-4 pb-20 pt-32 sm:px-8 lg:px-12">
        <Reveal className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className={eyebrow}>Communauté · Hassidim de Sion</p>
            <h1 className="mt-4 max-w-4xl">Une communauté qui vit toute l'année</h1>
          </div>
          <p className="max-w-md text-lg text-chant-muted">Événements sociaux, culturels et sportifs, enseignement, conférences, rencontres et séminaires.</p>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {ACTS.map(([k, t, d], i) => (
            <Reveal key={t} delay={(i % 3) * 0.08}>
              <article className={panel}>
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-chant-line text-chant-gold">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{ICONS[k]}</svg>
                </span>
                <h3 className="mt-6 text-2xl font-bold">{t}</h3>
                <p className="mt-2 leading-relaxed text-chant-ice">{d}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
          <Reveal>
            <section className={panel}>
              <p className={eyebrow}>Repas communautaire</p>
              <h3 className="mt-3 text-3xl font-bold">La Séouda est offerte par</h3>
              <div className="mt-5">
                {DONATIONS_REPAS.length === 0 ? (
                  <p className="italic text-chant-muted">Aucune dédicace pour le moment.</p>
                ) : (
                  DONATIONS_REPAS.map((d, i) => (
                    <div key={i} className="flex items-baseline justify-between gap-4 border-t border-dashed border-chant-line py-3 first:border-t-0">
                      <span className="text-lg font-semibold">{d.donateur}</span>
                      {d.dedicace && <span className="text-sm italic text-chant-muted">{d.dedicace}</span>}
                    </div>
                  ))
                )}
              </div>
            </section>
          </Reveal>

          <Reveal delay={0.1}>
            <section className={panel}>
              <p className={eyebrow}>Soutenir</p>
              <h3 className="mt-3 text-3xl font-bold">Chaque don fait vivre la maison.</h3>
              <p className="mt-3 text-chant-ice">Offices, étude, repas communautaires et activités des enfants. Paiement et reçu fiscal via HelloAsso.</p>
              <div className="mt-6 flex flex-wrap gap-3" role="group" aria-label="Choisir un montant de don">
                {AMOUNTS.map((a) => (
                  <button key={a} type="button" aria-pressed={amt === a} onClick={() => setAmt(a)} className={`rounded-full border px-6 py-3 font-bold transition ${amt === a ? "border-chant-gold bg-chant-gold text-chant-night" : "border-chant-line hover:border-chant-gold"}`}>
                    {a} €
                  </button>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <a href={HA} target="_blank" rel="noopener" className="rounded-full bg-chant-gold px-8 py-4 font-bold text-chant-night transition hover:brightness-110">Donner {amt} € via HelloAsso ↗</a>
                <a href="/promesses" className={pill}>Birkat Hachana · Promesses</a>
              </div>
              <p className="mt-3 text-sm text-chant-muted">Le montant se confirme sur HelloAsso.</p>
            </section>
          </Reveal>
        </div>

        <Reveal className="mt-8">
          <section className={`${panel} flex flex-col justify-between gap-6 md:flex-row md:items-center`}>
            <div>
              <p className={eyebrow}>Venir à la synagogue</p>
              <p className="font-display mt-3 text-2xl font-bold sm:text-3xl">{ADDRESS}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a className={pill} href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ADDRESS)}`} target="_blank" rel="noopener">Itinéraire →</a>
              <button type="button" className={pill} onClick={copy}>{copied ? "Adresse copiée" : "Copier l'adresse"}</button>
              <a className={pill} href={HA} target="_blank" rel="noopener">HelloAsso ↗</a>
            </div>
          </section>
        </Reveal>

        <footer className="mt-16 text-xs text-chant-muted">Association Hassidim de Sion · {ADDRESS}</footer>
      </section>
    </main>
  );
}
