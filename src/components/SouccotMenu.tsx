import { useEffect, useRef, useState } from "react";

const HELLOASSO_SOUCOT =
  "https://www.helloasso.com/associations/hassidim-de-sion/evenements/repas-de-souccot-2026";

const MENU_TABS = [
  "Vendredi soir",
  "Samedi midi",
  "Samedi soir",
  "Dimanche midi",
  "Enfants",
] as const;

type MenuSection = { titre: string; items: string[] };

const MENUS: Record<
  (typeof MENU_TABS)[number],
  { sections: MenuSection[]; pain?: boolean; boissons?: string; pending?: boolean }
> = {
  "Vendredi soir": {
    sections: [
      { titre: "Kemia", items: ["Amandes", "Pistaches", "Olives", "Chips", "Boutargue", "Mini fricassés"] },
      {
        titre: "Salades",
        items: [
          "Pomme de terre harissa",
          "Aubergine mayonnaise",
          "Pomme de terre persillée",
          "Carottes marocaines",
          "Chakchouka",
          "Aubergines frites",
          "Œufs mayonnaise",
          "Radis",
          "Piments",
          "Mechouia grillée",
          "Fenouil",
          "Amandes fraîches",
        ],
      },
      { titre: "Entrées", items: ["Carpaccio de poisson blanc", "Feuilleté de champignons"] },
      { titre: "Plat principal", items: ["Tajine de bœuf", "Légumes du soleil", "Semoule", "Pommes de terre sautées"] },
      { titre: "Dessert", items: ["Tarte au chocolat", "Assortiment de petits fours"] },
    ],
    pain: true,
    boissons: "eau minérale, eau gazeuse, Coca-Cola, vin rouge",
  },
  "Samedi midi": {
    sections: [
      { titre: "Kemia", items: ["Amandes", "Pistaches", "Olives", "Chips", "Boutargue", "Mini briks"] },
      {
        titre: "Salades",
        items: [
          "Baba ganoush",
          "Pomme de terre persillée",
          "Chakchouka",
          "Taboulé libanais",
          "Œufs mayonnaise",
          "Fraîcheurs",
          "Radis",
          "Piments",
          "Caviar d'aubergine",
          "Salade d'artichaut",
        ],
      },
      { titre: "Entrées", items: ["Houmous bassar", "Poisson frit sauce rouge"] },
      { titre: "Plat principal", items: ["Dafina ou Harissa ou Pkaïla", "Salade de pâtes"] },
      { titre: "Dessert", items: ["Mousse au chocolat", "Tarte multifruits"] },
    ],
    pain: true,
    boissons: "eau minérale, eau gazeuse, Coca-Cola, vin rouge",
  },
  "Samedi soir": {
    sections: [
      { titre: "Kemia", items: ["Amandes", "Pistaches", "Olives", "Chips", "Boutargue", "Choux-fleurs panés"] },
      {
        titre: "Salades",
        items: [
          "Carotte râpée citron",
          "Aubergine mayonnaise",
          "Mechouia",
          "Fattouche",
          "Houmous aux pois chiches frais",
          "Endives vinaigrette",
          "Iceberg fraîche",
          "Tourte salée",
          "Courgette grillée zaatar",
          "Tomates cerises oignon frais",
        ],
      },
      { titre: "Entrées", items: ["Gravlax", "Filet de bar petits légumes"] },
      { titre: "Plat principal", items: ["Tagine de poulet aux olives", "Riz safrané", "Tagliatelles de légumes"] },
      { titre: "Dessert", items: ["Tarte au citron", "Tarte aux fraises"] },
    ],
    pain: true,
    boissons: "eau minérale, eau gazeuse, Coca-Cola, vin rouge",
  },
  "Dimanche midi": {
    pending: true,
    sections: [],
  },
  Enfants: {
    pending: true,
    sections: [],
  },
};

const SEANCES = [
  {
    jour: "1er jour",
    creneaux: [
      { label: "Vendredi 25 septembre", moment: "au soir" },
      { label: "Samedi 26 septembre", moment: "à midi" },
    ],
  },
  {
    jour: "2e jour",
    creneaux: [
      { label: "Samedi 26 septembre", moment: "au soir" },
      { label: "Dimanche 27 septembre", moment: "à midi" },
    ],
  },
];

function SouccotQr() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let script: HTMLScriptElement | null = null;

    const render = () => {
      const QRCodeStyling = (window as any).QRCodeStyling;
      if (!QRCodeStyling || !ref.current || cancelled) return false;
      try {
        const qr = new QRCodeStyling({
          width: 220,
          height: 220,
          type: "svg",
          data: HELLOASSO_SOUCOT,
          margin: 0,
          qrOptions: { errorCorrectionLevel: "M" },
          dotsOptions: { color: "#0F3D7A" },
          backgroundOptions: { color: "#ffffff" },
        });
        ref.current.innerHTML = "";
        qr.append(ref.current);
        const svg = ref.current.querySelector("svg");
        if (svg) {
          svg.removeAttribute("width");
          svg.removeAttribute("height");
          svg.style.width = "100%";
          svg.style.height = "100%";
        }
        return true;
      } catch {
        return false;
      }
    };

    if (!render()) {
      script = document.createElement("script");
      script.src = "/calj/qr-code-styling@1.5.0.js";
      script.onload = () => render();
      document.head.appendChild(script);
    }
    return () => {
      cancelled = true;
      script?.remove();
    };
  }, []);

  return (
    <div className="w-28 h-28 shrink-0 rounded-xl bg-white p-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] ring-1 ring-[#1f4ea8]/10">
      <div ref={ref} className="w-full h-full [&>img]:w-full [&>img]:h-full" />
    </div>
  );
}

export default function SouccotMenu() {
  const [menuTab, setMenuTab] = useState<(typeof MENU_TABS)[number]>("Samedi midi");
  const menu = MENUS[menuTab];

  return (
    <div className="space-y-3">
      {/* En-tête */}
      <article className="btn-blue-animated rounded-3xl p-5 text-center" style={{ boxShadow: "0 8px 24px rgba(31,78,168,0.25)" }}>
        <p className="text-[10px] uppercase tracking-[0.3em] font-semibold text-white/80 mb-1">Souccot 5787</p>
        <h3 className="font-display text-2xl font-bold text-white leading-tight">Les repas de Souccot</h3>
        <p className="text-[12px] text-white/85 mt-1">Sous la Soucca · 5787</p>
      </article>

      {/* Introduction */}
      <article className="rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <p className="font-display italic text-sm text-foreground/80 leading-relaxed">
          « Chers amis, comme chaque année, la communauté a le plaisir d'organiser les repas de Souccot. Les repas
          auront lieu le soir et le midi, sous la Soucca. Les places sont nominatives et assises, et leur nombre est
          limité : nous avons donc besoin de connaître précisément le nombre d'adultes et d'enfants pour chaque
          réservation, afin d'organiser au mieux les repas et l'attribution des places. Une table dédiée aux enfants
          sera mise en place, encadrée par une jeune fille qui s'occupera d'eux. Les réservations se font
          exclusivement sur HelloAsso, et nous vous remercions de réserver au plus tôt afin de faciliter
          l'organisation. »
        </p>
      </article>

      {/* Horaires des repas */}
      <article className="rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <h3 className="text-[10px] uppercase tracking-[0.25em] font-semibold text-[#1f4ea8] mb-3">Les repas</h3>
        <div className="space-y-2.5">
          {SEANCES.map((s) => (
            <div key={s.jour} className="rounded-xl bg-[#F8FAFC] p-3">
              <p className="font-display text-sm font-bold text-foreground">{s.jour}</p>
              <div className="mt-1.5 space-y-1">
                {s.creneaux.map((c) => (
                  <div key={c.label + c.moment} className="flex items-baseline justify-between gap-3">
                    <span className="text-[13px] text-foreground/80">{c.label}</span>
                    <span className="text-[13px] font-semibold text-primary">{c.moment}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </article>

      {/* Réservation */}
      <article className="rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <h3 className="text-[10px] uppercase tracking-[0.25em] font-semibold text-[#1f4ea8] mb-3">Réservations</h3>
        <div className="flex items-center gap-4">
          <SouccotQr />
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-bold text-foreground leading-snug">HelloAsso</p>
            <p className="text-[11px] text-muted-foreground leading-snug mt-1">
              Scannez le QR code pour réserver
            </p>
          </div>
        </div>
        <a
          href={HELLOASSO_SOUCOT}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-blue-animated mt-4 flex min-h-[52px] items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-[15px] font-display font-semibold text-white shadow-[0_8px_20px_-6px_rgba(15,61,122,0.6)] active:scale-[0.97] transition-all"
        >
          Réserver sur HelloAsso
        </a>
        <div className="mt-3 space-y-2">
          <p className="rounded-xl bg-[var(--gold-soft)] px-3 py-2 text-[12px] text-foreground/85 leading-snug">
            <span className="font-semibold">Places nominatives</span> — assises et en nombre limité. Merci d'indiquer
            précisément le nombre d'adultes et d'enfants.
          </p>
          <p className="rounded-xl bg-[var(--blue-soft)] px-3 py-2 text-[12px] text-foreground/85 leading-snug">
            <span className="font-semibold">Table des enfants</span> — encadrée par une jeune fille qui s'occupera
            d'eux.
          </p>
        </div>
      </article>

      {/* Menus */}
      <article className="rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <h3 className="text-[10px] uppercase tracking-[0.25em] font-semibold text-[#1f4ea8] mb-3">Les menus</h3>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
          {MENU_TABS.map((t) => (
            <button
              key={t}
              onClick={() => setMenuTab(t)}
              className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-[12px] font-semibold transition-all ${
                menuTab === t
                  ? "btn-blue-animated text-white shadow-[0_4px_12px_rgba(31,78,168,0.3)]"
                  : "bg-[#F8FAFC] text-foreground/60"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {menu.pending ? (
          <p className="mt-3 rounded-xl bg-[#F8FAFC] px-3 py-4 text-center text-[13px] text-foreground/60 italic">
            Menu communiqué prochainement
          </p>
        ) : (
          <>
            <div className="mt-3 space-y-2.5">
              {menu.sections.map((section) => (
                <section key={section.titre} className="rounded-xl border border-border/60 bg-[#F8FAFC] px-3 py-2.5">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-primary font-semibold mb-1.5">{section.titre}</p>
                  <ul className="space-y-1">
                    {section.items.map((item) => (
                      <li key={item} className="text-sm text-foreground leading-snug">
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>

            <div className="mt-3 space-y-1 text-[12px] text-foreground/75">
              {menu.pain && <p>🥖 Pain de table</p>}
              {menu.boissons && (
                <p>
                  🥤 Boissons incluses : {menu.boissons}
                </p>
              )}
            </div>
          </>
        )}

        <p className="font-hebrew text-center text-2xl text-primary mt-5" dir="rtl">
          חג סוכות שמח
        </p>
      </article>
    </div>
  );
}
