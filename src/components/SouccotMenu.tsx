import { useState } from "react";

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
  { sections: MenuSection[]; pain?: boolean; boissons?: string; pending?: boolean; note?: string }
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
    sections: [
      {
        titre: "Salades",
        items: [
          "Houmous merguez",
          "Salade israélienne",
          "Salade verte",
          "Coleslaw",
          "Endives vinaigrette",
          "Pommes de terre aux œufs",
          "Tourte salée",
          "Macbouba",
          "Champignons frais",
        ],
      },
      { titre: "Entrées", items: ["Saumon teriyaki", "Bœuf chinois aux oignons"] },
      { titre: "Plat principal", items: ["Wok de poulet", "Nouilles chinoises", "Riz cantonais"] },
      { titre: "Dessert", items: ["Tarte aux pommes", "Mousse au chocolat"] },
    ],
    pain: true,
    boissons: "eau minérale, eau gazeuse, Coca-Cola, vin rouge",
  },
  Enfants: {
    sections: [
      {
        titre: "Sélection du chef",
        items: [
          "Riz",
          "Spaghetti à la sauce tomate",
          "Purée maison",
          "Schnitzel de poulet",
          "Nuggets de poulet",
          "Poisson pané",
          "Mini boulettes de viande",
          "Frites maison",
          "Pizza",
        ],
      },
    ],
    note: "Les plats proposés ne constituent pas un choix individuel. Le menu enfant est composé par le Chef parmi cette sélection, en fonction du menu du jour et des préparations réalisées.",
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

// Menu affiché par défaut selon le moment (repas de Souccot 5787)
function defaultMenuTab(): (typeof MENU_TABS)[number] {
  const now = new Date();
  const at = (month: number, day: number, h: number, m = 0) => new Date(2026, month, day, h, m);
  if (now < at(8, 25, 19, 0)) return "Vendredi soir";   // avant le repas de vendredi soir
  if (now < at(8, 26, 14, 0)) return "Samedi midi";    // dès vendredi soir
  if (now < at(8, 26, 21, 0)) return "Samedi soir";    // après le déjeuner de Chabbat
  return "Dimanche midi";                               // à partir de samedi soir
}

export default function SouccotMenu({ past = false }: { past?: boolean }) {
  const [menuTab, setMenuTab] = useState<(typeof MENU_TABS)[number]>(defaultMenuTab);
  const menu = MENUS[menuTab];

  return (
    <div className="space-y-3">
      {/* En-tête */}
      <article className="btn-blue-animated rounded-3xl p-5 text-center" style={{ boxShadow: "0 8px 24px rgba(31,78,168,0.25)" }}>
        <p className="text-[10px] uppercase tracking-[0.3em] font-semibold text-white/80 mb-1">
          {past ? "Événement passé" : "Souccot 5787"}
        </p>
        <h3 className="font-display text-2xl font-bold text-white leading-tight">Les repas de Souccot</h3>
        <p className="text-[12px] text-white/85 mt-1">
          {past ? "Souccot 5787 · du 25 au 27 septembre 2026" : "Sous la Soucca · 5787"}
        </p>
      </article>

      {past && (
        <article className="rounded-2xl bg-[#F8FAFC] p-4 text-center shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
          <p className="text-[13px] text-foreground/75 leading-snug">
            Les repas de Souccot 5787 sont terminés et les réservations sont closes. Merci à tous
            ceux qui nous ont rejoints sous la Soucca — à l'année prochaine !
          </p>
        </article>
      )}

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
        <p className="text-[13px] text-foreground/80 leading-snug">
          {past
            ? "Les réservations sont closes : l'événement a eu lieu du 25 au 27 septembre 2026."
            : "Les réservations se font exclusivement sur HelloAsso."}
        </p>

        {!past && (
          <a
            href={HELLOASSO_SOUCOT}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-blue-animated mt-4 flex min-h-[52px] items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-[15px] font-display font-semibold text-white shadow-[0_8px_20px_-6px_rgba(15,61,122,0.6)] active:scale-[0.97] transition-all"
          >
            Réserver sur HelloAsso
          </a>
        )}
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
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar scroll-smooth pb-1 -mx-1 px-1 [touch-action:pan-x]">
          {MENU_TABS.map((t) => {
            const active = menuTab === t;
            return (
              <button
                key={t}
                onClick={(e) => {
                  setMenuTab(t);
                  e.currentTarget.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
                }}
                className={`relative shrink-0 whitespace-nowrap overflow-hidden rounded-full border-0 outline-none focus:outline-none focus-visible:outline-none appearance-none px-3.5 py-2 text-[12px] font-semibold bg-[#F8FAFC] transition-[color,box-shadow] duration-300 ease-out ${
                  active
                    ? "text-white shadow-[0_4px_12px_rgba(31,78,168,0.3)]"
                    : "text-foreground/60 shadow-none"
                }`}
              >
                <span
                  aria-hidden
                  className={`btn-blue-animated absolute inset-0 transition-opacity duration-300 ease-out ${
                    active ? "opacity-100" : "opacity-0"
                  }`}
                />
                <span className="relative z-10">{t}</span>
              </button>
            );
          })}
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

            {menu.note && (
              <p className="mt-3 rounded-xl bg-[var(--gold-soft)] px-3 py-2.5 text-[12px] text-foreground/85 leading-snug italic">
                {menu.note}
              </p>
            )}

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
