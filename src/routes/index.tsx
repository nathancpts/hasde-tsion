import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Star, Flame } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hasdé Tsion — Planning de la semaine" },
      { name: "description", content: "Horaires des offices et cours de la synagogue Hasdé Tsion, affichage TV." },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;700&family=Frank+Ruhl+Libre:wght@500;700&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  component: PlanningTV,
});

type Row = { label: string; value: string; accent?: "gold" | "amber" };

const vendredi = {
  date: "Vendredi 8 mai 2026",
  heb: "21 Iyar 5786",
  daf: "דף יומי : חולין ח",
  note: "Tahanounim le matin",
  highlight: "Ce soir nous comptons : 36 jours du Omer",
  tehilim: ["104", "105"],
  shema: ["04:54", "10:02"],
  rows: [
    { label: "Minha", value: "19:30" },
    { label: "Entrée", value: "20:59", accent: "gold" },
  ] as Row[],
};

const samedi = {
  date: "Samedi 9 mai 2026",
  heb: "22 Iyar 5786",
  daf: "דף יומי : חולין ט",
  parasha: "Behar Behouqotaï",
  parashaHe: "בהר בחוקותי",
  pirkei: "Pirkei Avot 5",
  tsidqatkha: "Tsidqatkha",
  officiant: "Aharon Djian",
  cours: "Jacob Elgrably",
  pirkeiCours: "19h40 — Pirkei Avot avec Aharon Djian",
  tehilim: ["106", "107"],
  shema: ["04:53", "10:01"],
  rows: [
    { label: "Chaharit", value: "09:15" },
    { label: "Minha", value: "20:40" },
    { label: "Chekia", value: "21:18" },
    { label: "Sortie", value: "22:14", accent: "amber" },
  ] as Row[],
};

const rabbis = [
  "Rav Eliyahou Elyovics",
  "HaRav Chlomo Eliézer Alfandri",
  "Rabbi Chlomo Zalman",
  "HaRav 'Haïm Daniel Chlomo Pinaso",
];

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(id);
  }, []);
  return now;
}

function TimesTable({ tehilim, shema, rows }: { tehilim: string[]; shema: string[]; rows: Row[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card/60 backdrop-blur-sm">
      <Stripe label="Tehilim du jour">
        <div className="flex gap-3">
          {tehilim.map((t) => (
            <span key={t} className="rounded-md bg-secondary/70 px-3 py-1 font-display text-2xl font-bold text-primary">
              {t}
            </span>
          ))}
        </div>
      </Stripe>
      <Stripe label="Limite Shema">
        <div className="flex gap-4 font-mono text-xl text-muted-foreground">
          <span>{shema[0]}</span>
          <span className="text-border">·</span>
          <span>{shema[1]}</span>
        </div>
      </Stripe>
      {rows.map((r) => (
        <Stripe key={r.label} label={r.label} emphasis>
          <span
            className={`font-display text-5xl font-bold tabular-nums ${
              r.accent === "gold"
                ? "text-primary drop-shadow-[0_0_20px_oklch(0.82_0.15_85_/_0.4)]"
                : r.accent === "amber"
                ? "text-highlight drop-shadow-[0_0_20px_oklch(0.72_0.20_35_/_0.4)]"
                : "text-foreground"
            }`}
          >
            {r.value}
          </span>
        </Stripe>
      ))}
    </div>
  );
}

function Stripe({
  label,
  children,
  emphasis,
}: {
  label: string;
  children: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-border/60 px-5 py-3 last:border-0">
      <span className={`uppercase tracking-wider ${emphasis ? "text-base text-foreground/80" : "text-sm text-muted-foreground"}`}>
        {label}
      </span>
      <div className="text-right">{children}</div>
    </div>
  );
}

function DayCard({
  side,
  day,
  middle,
}: {
  side: React.ReactNode;
  day: typeof vendredi | typeof samedi;
  middle: React.ReactNode;
}) {
  return (
    <article className="grid grid-cols-1 gap-6 rounded-2xl border border-border bg-card/40 p-6 backdrop-blur-sm lg:grid-cols-[1fr_1.1fr_1.4fr]">
      <div className="flex flex-col justify-center text-center lg:border-r lg:border-border/60 lg:pr-6">
        {side}
      </div>
      <div className="flex flex-col justify-center gap-2 text-center lg:border-r lg:border-border/60 lg:pr-6">
        <h3 className="font-display text-3xl font-bold text-primary">{day.date}</h3>
        <p className="font-display text-xl text-foreground/80">{day.heb}</p>
        <p className="font-hebrew text-lg text-muted-foreground">{day.daf}</p>
        <div className="mt-3 space-y-2 text-base">{middle}</div>
      </div>
      <div>
        <TimesTable tehilim={day.tehilim} shema={day.shema} rows={day.rows} />
      </div>
    </article>
  );
}

function PlanningTV() {
  const now = useClock();
  const time = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const date = now.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="min-h-screen px-6 py-6 lg:px-12 lg:py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Star className="h-12 w-12 text-primary" strokeWidth={1.5} />
            <Star className="absolute inset-0 h-12 w-12 rotate-180 text-primary" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="font-display text-4xl font-bold tracking-wide text-foreground">
              Hasdé Tsion
            </h1>
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
              Planning de la semaine
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-hebrew text-3xl font-bold text-primary">בס״ד</p>
          <p className="font-mono text-2xl text-foreground/90">{time}</p>
          <p className="text-sm capitalize text-muted-foreground">{date}</p>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-6">
        {/* Vendredi */}
        <DayCard
          day={vendredi}
          side={
            <>
              <p className="font-display text-2xl text-foreground/70">Veille de Shabbat</p>
              <p className="mt-2 font-hebrew text-3xl font-bold text-primary">ערב שבת</p>
            </>
          }
          middle={
            <>
              <p className="italic text-accent">{vendredi.note}</p>
              <p className="mt-3 rounded-lg bg-highlight/15 px-4 py-3 font-semibold text-highlight">
                {vendredi.highlight}
              </p>
            </>
          }
        />

        {/* Samedi */}
        <DayCard
          day={samedi}
          side={
            <>
              <p className="font-display text-2xl text-foreground/70">Parasha</p>
              <h2 className="mt-1 font-display text-4xl font-bold text-primary">
                {samedi.parasha}
              </h2>
              <p className="mt-1 font-hebrew text-3xl text-foreground/90">{samedi.parashaHe}</p>
              <p className="mt-4 inline-block rounded-full border border-highlight/40 px-4 py-1 font-semibold text-highlight">
                {samedi.pirkei}
              </p>
            </>
          }
          middle={
            <>
              <p className="italic text-accent">{samedi.tsidqatkha}</p>
              <div className="mt-2 space-y-1 text-foreground/85">
                <p>
                  <span className="text-muted-foreground">Officiant : </span>
                  <span className="font-semibold">{samedi.officiant}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Cours : </span>
                  <span className="font-semibold">{samedi.cours}</span>
                </p>
              </div>
              <p className="mt-3 rounded-lg bg-secondary/60 px-4 py-2 text-sm font-medium text-foreground/90">
                {samedi.pirkeiCours}
              </p>
            </>
          }
        />
      </section>

      <footer className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto_1fr]">
        <div className="rounded-xl border border-dashed border-border bg-card/30 p-4 text-center text-sm text-muted-foreground">
          <p className="uppercase tracking-wider">Prochaine date</p>
          <p className="mt-1 text-foreground/90">Yom Yeroushalayim — jeu. 14 mai · ven. 15 mai</p>
        </div>

        <div className="flex items-center justify-center rounded-xl border border-border bg-card/40 px-6 py-4 text-center">
          <span className="text-base text-muted-foreground">Séouda offerte par : </span>
          <span className="ml-3 font-display text-2xl font-bold text-primary">LIBRE</span>
        </div>

        <div className="flex items-start gap-4 rounded-xl border border-border bg-card/40 p-4">
          <Flame className="mt-1 h-10 w-10 shrink-0 text-highlight" />
          <div>
            <p className="font-display text-lg font-bold text-primary">22 Iyar — Hilloula</p>
            <ul className="mt-1 space-y-0.5 text-sm text-foreground/85">
              {rabbis.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        </div>
      </footer>
    </main>
  );
}
