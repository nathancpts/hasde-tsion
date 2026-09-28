import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { getHayomYom } from "@/lib/hayom-yom";

type Language = "fr" | "he" | "both";

export const Route = createFileRoute("/hayom-yom")({
  head: () => ({
    meta: [
      { title: "Hayom Yom du jour — Hasdé Tsion" },
      { name: "description", content: "L’enseignement hassidique quotidien du Hayom Yom, en français et en hébreu." },
      { property: "og:title", content: "Hayom Yom du jour — Hasdé Tsion" },
      { property: "og:description", content: "Retrouvez chaque jour la pensée et la coutume du Hayom Yom." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HayomYomPage,
});

function HayomYomPage() {
  const [offset, setOffset] = useState(0);
  const [language, setLanguage] = useState<Language>("both");
  const [fontSize, setFontSize] = useState(18);
  const date = useMemo(() => {
    const next = new Date();
    next.setDate(next.getDate() + offset);
    return next;
  }, [offset]);
  const content = getHayomYom(date);

  return (
    <main className="relative min-h-[100dvh] overflow-x-clip bg-[#F2F4F8] pb-12 text-foreground">
      <header className="btn-blue-animated px-4 pb-16 pt-[calc(env(safe-area-inset-top)+1rem)] text-white">
        <div className="mx-auto max-w-3xl">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-white">
            <ArrowLeft className="h-4 w-4" /> Accueil
          </Link>
          <p className="mt-10 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/75">Aujourd’hui, c’est le jour…</p>
          <h1 className="mt-2 font-display text-4xl font-bold">Hayom Yom</h1>
          <p className="mt-2 text-sm text-white/80">{content?.hebrewDate ?? "Date indisponible"}</p>
        </div>
      </header>

      <section className="relative mx-auto -mt-8 max-w-3xl px-4">
        <div className="rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.1)]">
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={() => setOffset((value) => value - 1)} aria-label="Jour précédent" className="btn-blue-animated flex h-10 w-10 items-center justify-center rounded-full text-white">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => setOffset(0)} className="min-w-0 flex-1 text-center">
              <p className="font-display text-sm font-bold capitalize text-foreground">{content?.gregorianDate}</p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">{offset === 0 ? "Aujourd’hui" : "Revenir à aujourd’hui"}</p>
            </button>
            <button type="button" onClick={() => setOffset((value) => value + 1)} aria-label="Jour suivant" className="btn-blue-animated flex h-10 w-10 items-center justify-center rounded-full text-white">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-1 rounded-full bg-[#F1F5F9] p-1">
            {([['fr', 'Français'], ['he', 'עברית'], ['both', 'Les deux']] as const).map(([value, label]) => (
              <button key={value} type="button" onClick={() => setLanguage(value)} className={`rounded-full px-2 py-2 text-xs font-semibold ${language === value ? "btn-blue-animated text-white" : "text-foreground/60"}`}>
                {label}
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-center gap-4">
            <button type="button" onClick={() => setFontSize((value) => Math.max(15, value - 1))} aria-label="Réduire le texte" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F1F5F9] text-[#1f4ea8]"><Minus className="h-4 w-4" /></button>
            <span className="text-xs font-semibold text-muted-foreground">Taille du texte</span>
            <button type="button" onClick={() => setFontSize((value) => Math.min(26, value + 1))} aria-label="Agrandir le texte" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F1F5F9] text-[#1f4ea8]"><Plus className="h-4 w-4" /></button>
          </div>
        </div>

        <article className="mt-4 rounded-2xl bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,0.07)] sm:p-8">
          {!content ? (
            <p className="text-center text-muted-foreground">L’enseignement de ce jour n’est pas disponible.</p>
          ) : (
            <div className="space-y-8">
              {(language === "he" || language === "both") && (
                <section lang="he" dir="rtl" className="font-hebrew text-right text-foreground">
                  <p className="mb-3 text-xs font-semibold text-primary">היום יום</p>
                  <div className="space-y-4 whitespace-pre-line" style={{ fontSize, lineHeight: 1.9 }}>{content.he}</div>
                </section>
              )}
              {language === "both" && <div className="h-px bg-border" />}
              {(language === "fr" || language === "both") && (
                <section lang="fr">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">En français</p>
                  <div className="space-y-4 whitespace-pre-line text-foreground" style={{ fontSize, lineHeight: 1.75 }}>{content.fr}</div>
                </section>
              )}
            </div>
          )}
        </article>
        <p className="mt-5 text-center text-[11px] leading-relaxed text-muted-foreground">Texte issu de l’application Hayom Yom éditée par le Beth Loubavitch.</p>
      </section>
    </main>
  );
}
