import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import logo from "@/assets/hasde-tsion-logo.png";

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
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800;900&family=Noto+Serif+Hebrew:wght@400;700&display=swap",
      },
    ],
  }),
  component: PlanningTV,
});

// ============ DATA ============
const week = {
  parasha: { fr: "Bamidbar", he: "במדבר", chap: "Pirkei Avot · Ch. 6" },
  vendredi: {
    date: "Vendredi 15 mai 2026",
    heb: "27 Iyar 5786",
    daf: "Daf Yomi · חולין יד",
    omer: 42,
    tehilim: "79 · 80 · 81",
    shema: "08:54 / 10:03",
    times: [
      { label: "Minha", value: "19:30" },
      { label: "Entrée Shabbat", value: "21:07", tone: "gold" as const },
    ],
  },
  samedi: {
    date: "Samedi 16 mai 2026",
    heb: "28 Iyar 5786 · Yom Yeroushalayim",
    daf: "Daf Yomi · חולין טו",
    tehilim: "82 · 83 · 84 · 85",
    shema: "08:53 / 10:02",
    times: [
      { label: "Chaharit", value: "09:15" },
      { label: "Minha", value: "20:40" },
      { label: "Chekia", value: "21:25" },
      { label: "Sortie Shabbat", value: "22:26", tone: "red" as const },
    ],
    officiant: "Aharon Djian",
    cours: "Jacob Elgrably",
  },
  events: [
    { date: "Dim. 17 mai", title: "Cours du Rav", time: "20:30" },
    { date: "Lun. 18 mai", title: "Arvit + Daf Yomi", time: "21:00" },
    { date: "Mer. 20 mai", title: "Cours femmes", time: "14:30" },
    { date: "Ven. 22 mai", title: "Chavouot — Entrée", time: "21:12", tone: "gold" as const },
    { date: "Sam. 23 mai", title: "Chavouot — Sortie", time: "22:32", tone: "red" as const },
  ],
  yahrtzeit: ["Rabbi Yitshak Molko z.t.l", "Rabbi Éliyahou Danino z.t.l"],
};

// ============ HOOKS ============
function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// ============ COMPONENTS ============
function Header() {
  const now = useClock();
  const time = now ? now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "--:--";
  const date = now
    ? now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "";

  return (
    <header className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-border">
      <div className="flex items-center gap-5">
        <img
          src={logo}
          alt="Hasdé Tsion"
          className="h-40 md:h-56 lg:h-64 xl:h-72 w-auto drop-shadow-[0_0_40px_rgba(201,169,110,0.55)]"
        />
        <div className="hidden md:block">
          <h1 className="font-display text-3xl lg:text-4xl xl:text-5xl font-bold text-primary leading-none tracking-wide">
            HASDÉ TSION
          </h1>
          <p className="text-xs lg:text-sm uppercase tracking-[0.4em] text-muted-foreground mt-2">
            Torah & Hessed
          </p>
        </div>
      </div>

      <div className="text-center md:text-right">
        <div className="font-display text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tabular-nums leading-none text-foreground">
          {time}
        </div>
        <p className="text-sm md:text-base uppercase tracking-[0.25em] text-muted-foreground mt-2 capitalize">
          {date}
        </p>
      </div>
    </header>
  );
}

function ParashaBanner() {
  return (
    <div className="rounded-2xl border-2 border-[var(--gold-line)] bg-[var(--gold-soft)] p-5 md:p-6 lg:p-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
      <div>
        <p className="text-xs md:text-sm uppercase tracking-[0.3em] text-primary font-semibold mb-1">
          Parashat Hashavoua
        </p>
        <h2 className="font-display text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground leading-none">
          {week.parasha.fr}
        </h2>
      </div>
      <div className="text-center md:text-right">
        <p className="font-hebrew text-4xl md:text-5xl lg:text-6xl text-primary leading-none" dir="rtl">
          {week.parasha.he}
        </p>
        <p className="mt-2 text-sm md:text-base text-muted-foreground uppercase tracking-wider">
          {week.parasha.chap}
        </p>
      </div>
    </div>
  );
}

function TimeRow({
  label,
  value,
  tone,
  size = "md",
}: {
  label: string;
  value: string;
  tone?: "gold" | "red";
  size?: "md" | "lg";
}) {
  const valueColor =
    tone === "gold" ? "text-primary" : tone === "red" ? "text-[var(--highlight)]" : "text-foreground";
  const valSize =
    size === "lg"
      ? "text-4xl md:text-5xl lg:text-6xl xl:text-7xl"
      : "text-3xl md:text-4xl lg:text-5xl xl:text-6xl";
  return (
    <div
      className={`flex items-center justify-between gap-4 py-3 md:py-4 border-b border-border/60 last:border-0 ${
        tone ? "px-3 -mx-3 rounded-lg" : ""
      } ${tone === "gold" ? "bg-[var(--gold-soft)]" : tone === "red" ? "bg-[var(--red-soft)]" : ""}`}
    >
      <span className="text-base md:text-lg lg:text-xl uppercase tracking-[0.18em] text-muted-foreground font-medium">
        {label}
      </span>
      <span className={`font-display font-bold tabular-nums leading-none ${valSize} ${valueColor}`}>
        {value}
      </span>
    </div>
  );
}

function DayCard({
  badge,
  badgeTone = "blue",
  title,
  subtitle,
  hebrew,
  tehilim,
  shema,
  times,
  children,
  highlight,
}: {
  badge: string;
  badgeTone?: "blue" | "gold";
  title: string;
  subtitle: string;
  hebrew: string;
  tehilim: string;
  shema: string;
  times: { label: string; value: string; tone?: "gold" | "red" }[];
  children?: React.ReactNode;
  highlight?: React.ReactNode;
}) {
  const badgeBg = badgeTone === "gold" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground";
  return (
    <article className="rounded-2xl border border-border bg-card p-5 md:p-6 lg:p-8 flex flex-col gap-5 md:gap-6">
      <div>
        <span className={`inline-block px-3 py-1 rounded-full text-xs md:text-sm uppercase tracking-[0.25em] font-bold ${badgeBg}`}>
          {badge}
        </span>
        <h3 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mt-3 leading-tight">
          {title}
        </h3>
        <p className="text-sm md:text-base text-muted-foreground mt-1 uppercase tracking-wider">{subtitle}</p>
        <p className="text-sm md:text-base text-muted-foreground/70 mt-1">{hebrew}</p>
      </div>

      {highlight}

      {/* TEHILIM — biggest visual element */}
      <div className="rounded-xl border-2 border-[var(--gold-line)] bg-[var(--gold-soft)] p-4 md:p-6 text-center">
        <p className="text-xs md:text-sm uppercase tracking-[0.3em] text-primary font-semibold mb-2">
          📖 Tehilim du jour
        </p>
        <p className="font-display font-bold text-primary tabular-nums leading-none text-5xl md:text-6xl lg:text-7xl xl:text-8xl">
          {tehilim}
        </p>
      </div>

      <div className="flex items-center justify-between text-sm md:text-base lg:text-lg">
        <span className="uppercase tracking-[0.2em] text-muted-foreground">Limite Shema</span>
        <span className="font-display font-semibold text-foreground tabular-nums">{shema}</span>
      </div>

      <div className="flex flex-col">
        {times.map((t) => (
          <TimeRow key={t.label} label={t.label} value={t.value} tone={t.tone} size="lg" />
        ))}
      </div>

      {children}
    </article>
  );
}

function EventsCard() {
  return (
    <article className="rounded-2xl border border-border bg-card p-5 md:p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-5">
        <span className="inline-block w-2 h-8 bg-primary rounded-full" />
        <h3 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
          Événements à venir
        </h3>
      </div>

      <div className="flex flex-col">
        {week.events.map((e) => {
          const valueColor =
            e.tone === "gold" ? "text-primary" : e.tone === "red" ? "text-[var(--highlight)]" : "text-foreground";
          return (
            <div
              key={e.date + e.title}
              className="grid grid-cols-[auto_1fr_auto] items-center gap-4 py-3 md:py-4 border-b border-border/60 last:border-0"
            >
              <span className="text-sm md:text-base lg:text-lg font-semibold uppercase tracking-wider text-muted-foreground min-w-[110px]">
                {e.date}
              </span>
              <span className="text-base md:text-lg lg:text-xl font-medium text-foreground">{e.title}</span>
              <span className={`font-display font-bold tabular-nums text-2xl md:text-3xl lg:text-4xl ${valueColor}`}>
                {e.time}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-5 border-t border-border">
        <p className="text-xs md:text-sm uppercase tracking-[0.3em] text-primary font-semibold mb-2">
          🕯 Yahrtzeit · 28 Iyar
        </p>
        <ul className="space-y-1">
          {week.yahrtzeit.map((n) => (
            <li key={n} className="font-display italic text-base md:text-lg text-muted-foreground">
              {n}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function PlanningTV() {
  return (
    <main className="h-screen w-screen overflow-hidden bg-background text-foreground grid grid-rows-[auto_auto_1fr_auto] gap-[1.2vh] p-[1.5vh_1.5vw]">
      <Header />
      <ParashaBanner />

      <section className="grid grid-cols-3 gap-[1vw] min-h-0">
        <DayCard
          badge="Vendredi"
          badgeTone="blue"
          title={week.vendredi.date}
          subtitle={week.vendredi.heb}
          hebrew={week.vendredi.daf}
          tehilim={week.vendredi.tehilim}
          shema={week.vendredi.shema}
          times={week.vendredi.times}
          highlight={
            <div className="rounded-xl border border-accent/40 bg-[var(--blue-soft)] px-4 py-2 flex items-center justify-between">
              <span className="text-[1.1vh] uppercase tracking-[0.2em] text-accent font-semibold">
                Omer · ce soir
              </span>
              <span className="font-display text-[3.5vh] font-bold text-accent leading-none">
                {week.vendredi.omer}
              </span>
            </div>
          }
        />

        <DayCard
          badge="Shabbat"
          badgeTone="gold"
          title={week.samedi.date}
          subtitle={week.samedi.heb}
          hebrew={week.samedi.daf}
          tehilim={week.samedi.tehilim}
          shema={week.samedi.shema}
          times={week.samedi.times}
        >
          <div className="rounded-xl border border-border bg-secondary/50 p-2 space-y-1">
            <div className="flex justify-between items-center text-[1.4vh]">
              <span className="uppercase tracking-wider text-muted-foreground">Officiant</span>
              <span className="font-semibold text-accent">{week.samedi.officiant}</span>
            </div>
            <div className="flex justify-between items-center text-[1.4vh]">
              <span className="uppercase tracking-wider text-muted-foreground">Cours</span>
              <span className="font-semibold text-accent">{week.samedi.cours}</span>
            </div>
          </div>
        </DayCard>

        <EventsCard />
      </section>

      <footer className="text-center text-[1.1vh] uppercase tracking-[0.3em] text-muted-foreground">
        בס״ד · Hasdé Tsion · Planning de la semaine
      </footer>
    </main>
  );
}
