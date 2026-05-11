import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import logo from "@/assets/hasde-tsion-logo.png";

function useKiosk() {
  const [isFs, setIsFs] = useState(false);
  const [hint, setHint] = useState(true);

  const enter = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
      const so = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
      if (so?.lock) { try { await so.lock("landscape"); } catch { /* ignore */ } }
    } catch { /* user gesture required */ }
  }, []);

  const exit = useCallback(async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
  }, []);

  const toggle = useCallback(() => {
    if (document.fullscreenElement) exit(); else enter();
  }, [enter, exit]);

  useEffect(() => {
    const onChange = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);

    // Keyboard: F = toggle fullscreen, Esc handled by browser
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") toggle();
    };
    window.addEventListener("keydown", onKey);

    // Auto-hide cursor in kiosk mode
    let timer: ReturnType<typeof setTimeout>;
    const onMove = () => {
      document.body.style.cursor = "";
      clearTimeout(timer);
      timer = setTimeout(() => { document.body.style.cursor = "none"; }, 3000);
    };
    window.addEventListener("mousemove", onMove);
    onMove();

    // Prevent screen from sleeping (Wake Lock API)
    let wakeLock: WakeLockSentinel | null = null;
    const requestWake = async () => {
      try {
        const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<WakeLockSentinel> } };
        if (nav.wakeLock) wakeLock = await nav.wakeLock.request("screen");
      } catch { /* ignore */ }
    };
    requestWake();
    const onVis = () => { if (document.visibilityState === "visible") requestWake(); };
    document.addEventListener("visibilitychange", onVis);

    // Hide hint after 8s
    const hintTimer = setTimeout(() => setHint(false), 8000);

    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("visibilitychange", onVis);
      clearTimeout(timer);
      clearTimeout(hintTimer);
      wakeLock?.release().catch(() => {});
      document.body.style.cursor = "";
    };
  }, [toggle]);

  return { isFs, toggle, hint, dismissHint: () => setHint(false) };
}

function KioskControls({ isFs, toggle, hint, dismissHint }: ReturnType<typeof useKiosk>) {
  return (
    <>
      <button
        onClick={toggle}
        aria-label={isFs ? "Quitter plein écran" : "Mode kiosque plein écran"}
        className="fixed bottom-4 right-4 z-50 p-2.5 rounded-full bg-card/80 border border-border text-muted-foreground hover:text-primary hover:border-primary/50 transition opacity-30 hover:opacity-100 backdrop-blur-sm"
      >
        {isFs ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </button>

      {hint && !isFs && (
        <button
          onClick={() => { toggle(); dismissHint(); }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs md:text-sm font-semibold uppercase tracking-wider shadow-[0_0_30px_rgba(201,169,110,0.4)] hover:scale-105 transition flex items-center gap-2"
        >
          <Maximize2 className="w-4 h-4" />
          Lancer mode TV plein écran
          <span className="opacity-60 hidden md:inline">· touche F</span>
        </button>
      )}
    </>
  );
}


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
    <header className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <img
          src={logo}
          alt="Hasdé Tsion"
          className="h-[16vh] w-auto drop-shadow-[0_0_30px_rgba(201,169,110,0.55)]"
        />
        <div>
          <h1 className="font-display text-[3.2vh] font-bold text-primary leading-none tracking-wide">
            HASDÉ TSION
          </h1>
          <p className="text-[1.1vh] uppercase tracking-[0.4em] text-muted-foreground mt-1">
            Torah & Hessed
          </p>
        </div>
      </div>

      <div className="text-right">
        <div className="font-display text-[7vh] font-bold tabular-nums leading-none text-foreground">
          {time}
        </div>
        <p className="text-[1.2vh] uppercase tracking-[0.25em] text-muted-foreground mt-1 capitalize">
          {date}
        </p>
      </div>
    </header>
  );
}

function ParashaBanner() {
  return (
    <div className="rounded-xl border-2 border-[var(--gold-line)] bg-[var(--gold-soft)] px-[2vw] py-[1.4vh] flex items-center justify-between gap-4">
      <div>
        <p className="text-[1.1vh] uppercase tracking-[0.3em] text-primary font-semibold mb-0.5">
          Parashat Hashavoua
        </p>
        <h2 className="font-display text-[4.5vh] font-bold text-foreground leading-none">
          {week.parasha.fr}
        </h2>
      </div>
      <div className="text-right">
        <p className="font-hebrew text-[4vh] text-primary leading-none" dir="rtl">
          {week.parasha.he}
        </p>
        <p className="mt-1 text-[1.1vh] text-muted-foreground uppercase tracking-wider">
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
}: {
  label: string;
  value: string;
  tone?: "gold" | "red";
}) {
  const valueColor =
    tone === "gold" ? "text-primary" : tone === "red" ? "text-[var(--highlight)]" : "text-foreground";
  return (
    <div
      className={`flex items-center justify-between gap-3 py-[0.7vh] border-b border-border/60 last:border-0 ${
        tone ? "px-2 -mx-2 rounded-md" : ""
      } ${tone === "gold" ? "bg-[var(--gold-soft)]" : tone === "red" ? "bg-[var(--red-soft)]" : ""}`}
    >
      <span className="text-[1.4vh] uppercase tracking-[0.18em] text-muted-foreground font-medium">
        {label}
      </span>
      <span className={`font-display font-bold tabular-nums leading-none text-[3.6vh] ${valueColor}`}>
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
    <article className="rounded-xl border border-border bg-card p-[1.4vh_1vw] flex flex-col gap-[1vh] min-h-0 overflow-hidden">
      <div>
        <span className={`inline-block px-2 py-0.5 rounded-full text-[1.1vh] uppercase tracking-[0.25em] font-bold ${badgeBg}`}>
          {badge}
        </span>
        <h3 className="font-display text-[2.6vh] font-bold text-foreground mt-1 leading-tight">
          {title}
        </h3>
        <p className="text-[1.2vh] text-muted-foreground mt-0.5 uppercase tracking-wider">{subtitle}</p>
        <p className="text-[1.1vh] text-muted-foreground/70">{hebrew}</p>
      </div>

      {highlight}

      {/* TEHILIM — biggest visual element */}
      <div className="rounded-lg border-2 border-[var(--gold-line)] bg-[var(--gold-soft)] py-[1vh] px-3 text-center">
        <p className="text-[1.1vh] uppercase tracking-[0.3em] text-primary font-semibold mb-0.5">
          📖 Tehilim du jour
        </p>
        <p className="font-display font-bold text-primary tabular-nums leading-none text-[5.5vh]">
          {tehilim}
        </p>
      </div>

      <div className="flex items-center justify-between text-[1.3vh]">
        <span className="uppercase tracking-[0.2em] text-muted-foreground">Limite Shema</span>
        <span className="font-display font-semibold text-foreground tabular-nums text-[1.8vh]">{shema}</span>
      </div>

      <div className="flex flex-col flex-1 min-h-0">
        {times.map((t) => (
          <TimeRow key={t.label} label={t.label} value={t.value} tone={t.tone} />
        ))}
      </div>

      {children}
    </article>
  );
}

function EventsCard() {
  return (
    <article className="rounded-xl border border-border bg-card p-[1.4vh_1vw] flex flex-col min-h-0 overflow-hidden">
      <div className="flex items-center gap-2 mb-[1vh]">
        <span className="inline-block w-1.5 h-[3vh] bg-primary rounded-full" />
        <h3 className="font-display text-[2.6vh] font-bold text-foreground">
          Événements à venir
        </h3>
      </div>

      <div className="flex flex-col flex-1 min-h-0">
        {week.events.map((e) => {
          const valueColor =
            e.tone === "gold" ? "text-primary" : e.tone === "red" ? "text-[var(--highlight)]" : "text-foreground";
          return (
            <div
              key={e.date + e.title}
              className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-[0.7vh] border-b border-border/60 last:border-0"
            >
              <span className="text-[1.2vh] font-semibold uppercase tracking-wider text-muted-foreground min-w-[7vw]">
                {e.date}
              </span>
              <span className="text-[1.5vh] font-medium text-foreground">{e.title}</span>
              <span className={`font-display font-bold tabular-nums text-[2.8vh] ${valueColor}`}>
                {e.time}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-[1vh] pt-[1vh] border-t border-border">
        <p className="text-[1.1vh] uppercase tracking-[0.3em] text-primary font-semibold mb-1">
          🕯 Yahrtzeit · 28 Iyar
        </p>
        <ul className="space-y-0.5">
          {week.yahrtzeit.map((n) => (
            <li key={n} className="font-display italic text-[1.4vh] text-muted-foreground leading-tight">
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
