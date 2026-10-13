import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, X } from "lucide-react";
import logoAsset from "@/assets/logo-50-emblem.png.asset.json";

const logo = logoAsset.url;

export const Route = createFileRoute("/textes")({
  head: () => ({
    meta: [
      { title: "Textes & Prières — Hasdé Tsion" },
      { name: "description", content: "Siddour complet, Tehilim, parasha, omer, qaddish — version Ashkénaze et Mizra'hi." },
      { property: "og:title", content: "Textes & Prières — Hasdé Tsion" },
      { property: "og:description", content: "Siddour, Tehilim et prières en versions Ashkénaze et Mizra’hi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TextesPage,
});

type Item = { label: string; file: string; rite?: "ashk" | "mizr" | "all" };
type Section = { title: string; items: Item[] };

const SECTIONS: Section[] = [
  {
    title: "Tehilim",
    items: [
      { label: "Tehilim — chapitre du jour", file: "psalms.html", rite: "all" },
      { label: "Tehilim 119 (אשרי תמימי דרך)", file: "psalm119.html", rite: "all" },
    ],
  },
  {
    title: "Cha'harit",
    items: [
      { label: "Birkot HaSha'har — Ashkénaze", file: "hashachar_ashkenaz.html", rite: "ashk" },
      { label: "Birkot HaSha'har — Mizra'hi", file: "hashachar_mizrah.html", rite: "mizr" },
      { label: "Birkot HaSha'har — Pata'h", file: "hashachar_patah.html", rite: "all" },
      { label: "Chaharit (général)", file: "shaharit-gen.html", rite: "all" },
    ],
  },
  {
    title: "Min'ha",
    items: [
      { label: "Min'ha — Ashkénaze", file: "mincha_ashkenaz.html", rite: "ashk" },
      { label: "Min'ha — Mizra'hi", file: "mincha_mizrah.html", rite: "mizr" },
    ],
  },
  {
    title: "Arvit",
    items: [
      { label: "Arvit — Ashkénaze", file: "arvit_ashkenaz.html", rite: "ashk" },
      { label: "Arvit — Mizra'hi", file: "arvit_mizrah.html", rite: "mizr" },
      { label: "Hamapil — Ashkénaze", file: "hamapil_ashkenaz.html", rite: "ashk" },
      { label: "Hamapil — Mizra'hi", file: "hamapil_mizrah.html", rite: "mizr" },
    ],
  },
  {
    title: "Birkat HaMazon",
    items: [
      { label: "Birkat HaMazon — Ashkénaze", file: "bircathamazon_ashke.html", rite: "ashk" },
      { label: "Birkat HaMazon — Mizra'hi", file: "bircathamazon_mizrah.html", rite: "mizr" },
      { label: "Mé'ein Chaloch — Ashkénaze", file: "meeinshalosh_ashkenaz.html", rite: "ashk" },
      { label: "Mé'ein Chaloch — Mizra'hi", file: "meeinshalosh_mizrah.html", rite: "mizr" },
      { label: "Sheva Bera'hot", file: "sheva_brachot.html", rite: "all" },
    ],
  },
  {
    title: "Tefilot supplémentaires",
    items: [
      { label: "Aleinou Lechabéa'h — Ashkénaze", file: "aleinu-leshabeach_ashkenaz.html", rite: "ashk" },
      { label: "Aleinou Lechabéa'h — Mizra'hi", file: "aleinu-leshabeach_mizrah.html", rite: "mizr" },
      { label: "Qaddish", file: "qaddish.html", rite: "all" },
      { label: "Tefilat HaDére'h", file: "tefilat_haderech.html", rite: "all" },
      { label: "Birkat HaLevana — Ashkénaze", file: "levana_ashkenaz.html", rite: "ashk" },
      { label: "Birkat HaLevana — Mizra'hi", file: "levana_mizrah.html", rite: "mizr" },
      { label: "Tikkoun 'Hatsot", file: "tikun_chatzot.html", rite: "all" },
      { label: "Tikkoun HaKlali", file: "tikun_haclali.html", rite: "all" },
      { label: "Néfachot", file: "nefashot.html", rite: "all" },
      { label: "Yatsar", file: "yatsar.html", rite: "all" },
      { label: "Parashat HaMan", file: "parashat_hamann.html", rite: "all" },
    ],
  },
  {
    title: "Compte du Omer",
    items: [
      { label: "Omer — Ashkénaze", file: "omer-ashke.html", rite: "ashk" },
      { label: "Omer — Séfarade", file: "omer-sef.html", rite: "mizr" },
    ],
  },
];

function TextesPage() {
  const [open, setOpen] = useState<Item | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur border-b border-[var(--gold-line)]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 text-sm font-medium text-muted-foreground  transition">
            <ArrowLeft className="h-4 w-4" /> Accueil
          </Link>
          <img src={logo} alt="Hasdé Tsion" className="h-10 w-auto" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-primary font-semibold mb-2">Siddour & Tehilim</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold">Textes & Prières</h1>
          <p className="text-sm text-muted-foreground mt-2">Sélectionne un texte pour l'ouvrir en lecture.</p>
        </div>

        <div className="space-y-8">
          {SECTIONS.map((sec) => (
            <section key={sec.title}>
              <h2 className="font-display text-2xl font-bold mb-3 text-primary">{sec.title}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sec.items.map((it) => (
                  <button
                    key={it.file}
                    onClick={() => setOpen(it)}
                    className="text-left rounded-lg border-2 border-[var(--gold-line)] bg-[var(--gold-soft)] px-4 py-3  ,var(--gold-soft))] transition group"
                  >
                    <span className="font-medium text-foreground  transition">
                      {it.label}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-12">
          Textes issus de l'application CalJ (Calendrier Juif).
        </p>
      </main>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 flex flex-col">
          <div className="bg-background border-b border-[var(--gold-line)] flex items-center justify-between px-4 py-3">
            <h3 className="font-display font-bold text-lg">{open.label}</h3>
            <button
              onClick={() => setOpen(null)}
              className="rounded-full p-2  transition"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <iframe
            src={`/calj/${open.file}`}
            title={open.label}
            className="flex-1 w-full bg-white"
          />
        </div>
      )}
    </div>
  );
}
