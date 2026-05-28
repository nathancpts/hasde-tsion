import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Maximize2, Minimize2, BookOpen } from "lucide-react";
import logo from "@/assets/logo-hasde-tsion.png";
import { fetchLiveWeek, fetchZmanim, type LiveWeek, type Zmanim } from "@/lib/jewish-calendar";
import { fetchChabadShabbat, type ChabadWeek } from "@/lib/chabad.functions";


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
  parasha: { fr: "Nasso", he: "נשא", chap: "Pirkei Avot · Ch. 1" },
  vendredi: {
    date: "Vendredi 29 mai 2026",
    heb: "13 Sivan 5786",
    daf: "Daf Yomi · חולין כ״ט",
    omer: null as number | null,
    tehilim: "69 · 70 · 71",
    shema: "—",
    times: [
      { label: "Minha", value: "20:00" },
      { label: "Arvit", value: "20:45" },
      { label: "Allumer les bougies", value: "21:25", tone: "gold" as const },
    ],
  },
  samedi: {
    date: "Samedi 30 mai 2026",
    heb: "14 Sivan 5786",
    daf: "Daf Yomi · חולין ל׳",
    tehilim: "72 · 73 · 74 · 75 · 76",
    shema: "08:35 / 09:45",
    times: [
      { label: "Chaharit", value: "09:15" },
      { label: "Minha", value: "21:00" },
      { label: "Chekia", value: "21:42" },
      { label: "Fin du Chabbat", value: "22:47", tone: "red" as const },
    ],
    officiant: "Aharon Djian",
    cours: "Étude + Séouda chlichit",
  },
  events: [
    { date: "Ven. 29 mai", title: "Minha", time: "20:00" },
    { date: "Ven. 29 mai", title: "Arvit", time: "20:45" },
    { date: "Ven. 29 mai", title: "Allumer les bougies", time: "21:25", tone: "gold" as const },
    { date: "Sam. 30 mai", title: "Chaharit", time: "09:15" },
    { date: "Sam. 30 mai", title: "Minha + Étude + Séouda chlichit", time: "21:00" },
    { date: "Sam. 30 mai", title: "Arvit & Fin du Chabbat", time: "22:47", tone: "red" as const },
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

type StoredLoc = { lat: number; lon: number; label?: string } | null;
const LOC_KEY = "ht.geoloc.v1";
const LOC_DISMISS_KEY = "ht.geoloc.dismissed.v1";


function useLiveWeek(loc: StoredLoc) {
  const [live, setLive] = useState<LiveWeek | null>(null);
  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetchLiveWeek(new Date(), loc ? { lat: loc.lat, lon: loc.lon } : undefined)
        .then((d) => { if (!cancelled) setLive(d); })
        .catch((e) => console.warn("Hebcal fetch failed", e));
    };
    load();
    const id = setInterval(load, 15 * 60 * 1000); // refresh every 15 min
    return () => { cancelled = true; clearInterval(id); };
  }, [loc]);
  return live;
}

function useChabad() {
  const [weeks, setWeeks] = useState<ChabadWeek[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetchChabadShabbat()
        .then((d) => { if (!cancelled) setWeeks(d); })
        .catch((e) => console.warn("Chabad fetch failed", e));
    };
    load();
    const id = setInterval(load, 60 * 60 * 1000); // refresh hourly
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // Pick the upcoming (or current) Shabbat
  const today = new Date().toISOString().slice(0, 10);
  const current = weeks?.find((w) => w.satDate >= today) ?? weeks?.[0] ?? null;
  return current;
}

function useZmanim(loc: StoredLoc) {
  const [z, setZ] = useState<Zmanim | null>(null);
  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetchZmanim(new Date(), loc ? { lat: loc.lat, lon: loc.lon } : undefined)
        .then((d) => { if (!cancelled) setZ(d); })
        .catch((e) => console.warn("Zmanim fetch failed", e));
    };
    load();
    const id = setInterval(load, 60 * 60 * 1000); // refresh hourly
    return () => { cancelled = true; clearInterval(id); };
  }, [loc]);
  return z;
}



function useIsTV() {
  const [isTV, setIsTV] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsTV(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isTV;
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
          className="h-[16vh] w-auto"
        />
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

function ParashaBanner({ live }: { live: LiveWeek | null }) {
  const fr = live?.parasha.fr ?? week.parasha.fr;
  const he = live?.parasha.he ?? week.parasha.he;
  return (
    <div className="rounded-xl border-2 border-[var(--gold-line)] bg-[var(--gold-soft)] px-[2vw] py-[1.4vh] flex items-center justify-between gap-4">
      <div>
        <p className="text-[1.1vh] uppercase tracking-[0.3em] text-primary font-semibold mb-0.5">
          Parashat Hashavoua
        </p>
        <h2 className="font-display text-[4.5vh] font-bold text-foreground leading-none">
          {fr}
        </h2>
      </div>
      <div className="text-right">
        <p className="font-hebrew text-[4vh] text-primary leading-none" dir="rtl">
          {he}
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

function EventsCard({ live }: { live: LiveWeek | null }) {
  const liveEvents = live?.events ?? [];
  const events = liveEvents.length > 0 ? liveEvents : week.events;
  return (
    <article className="rounded-xl border border-border bg-card p-[1.4vh_1vw] flex flex-col min-h-0 overflow-hidden">
      <div className="flex items-center gap-2 mb-[1vh]">
        <span className="inline-block w-1.5 h-[3vh] bg-primary rounded-full" />
        <h3 className="font-display text-[2.6vh] font-bold text-foreground">
          Événements à venir
        </h3>
      </div>

      <div className="flex flex-col flex-1 min-h-0">
        {events.map((e) => {

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

function ZmanimCard({ zmanim }: { zmanim: Zmanim | null }) {
  const times = zmanim?.times ?? [];
  return (
    <article className="rounded-xl border border-border bg-card p-[1.4vh_1vw] flex flex-col min-h-0 overflow-hidden">
      <div className="flex items-center gap-2 mb-[0.8vh]">
        <span className="inline-block w-1.5 h-[3vh] bg-accent rounded-full" />
        <h3 className="font-display text-[2.4vh] font-bold text-foreground">Zmanim du jour</h3>
      </div>

      {zmanim?.tahanun && (
        <div className={`rounded-md border px-2 py-[0.5vh] mb-[0.6vh] text-center ${zmanim.tahanun.recited ? "border-border bg-muted/40" : "border-[var(--gold-line)] bg-[var(--gold-soft)]"}`}>
          <p className="text-[0.9vh] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Liturgie du jour</p>
          <p className={`font-display text-[1.4vh] font-bold leading-tight mt-0.5 ${zmanim.tahanun.recited ? "text-foreground" : "text-primary"}`}>
            {zmanim.tahanun.reason}
          </p>
        </div>
      )}

      {zmanim?.birkatLevana && (
        <div className="rounded-md border border-[var(--gold-line)] bg-[var(--gold-soft)] px-2 py-[0.6vh] mb-[0.8vh] text-center">
          <p className="text-[0.95vh] uppercase tracking-[0.25em] text-primary font-semibold">Bircat HaLevana</p>
          <p className="font-display text-[1.6vh] font-bold text-primary leading-none mt-0.5">
            {zmanim.birkatLevana.start} – {zmanim.birkatLevana.end}
          </p>
        </div>
      )}

      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {times.map((t) => (
          <div
            key={t.label}
            className="flex items-center justify-between gap-2 py-[0.3vh] border-b border-border/40 last:border-0"
          >
            <span className="text-[1.1vh] text-muted-foreground tracking-wide">{t.label}</span>
            <span className="font-display font-semibold tabular-nums text-[1.55vh] text-foreground">{t.value}</span>
          </div>
        ))}
        {(zmanim?.mishnaYomi || zmanim?.yerushalmiYomi) && (
          <div className="mt-[0.6vh] pt-[0.6vh] border-t border-border/60 space-y-[0.4vh]">
            {zmanim?.mishnaYomi && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-[1.05vh] text-muted-foreground">Mishna Yomi</span>
                <span className="font-display font-semibold text-[1.35vh] text-foreground">{zmanim.mishnaYomi.fr}</span>
              </div>
            )}
            {zmanim?.yerushalmiYomi && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-[1.05vh] text-muted-foreground">Yerushalmi Yomi</span>
                <span className="font-display font-semibold text-[1.35vh] text-foreground">{zmanim.yerushalmiYomi.fr}</span>
              </div>
            )}
          </div>
        )}
        {times.length === 0 && (
          <p className="text-[1.2vh] text-muted-foreground italic">Chargement…</p>
        )}
      </div>
    </article>
  );
}


// ============ MOBILE LAYOUT ============

function MobileLayout({ live, chabad, zmanim }: { live: LiveWeek | null; chabad: ChabadWeek | null; zmanim: Zmanim | null }) {
  const now = useClock();
  const time = now ? now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "--:--";
  const date = now
    ? now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "";

  const parashaFr = live?.parasha.fr ?? week.parasha.fr;
  const parashaHe = live?.parasha.he ?? week.parasha.he;

  const vDate = live?.vendredi.date ?? week.vendredi.date;
  const vHeb = live?.vendredi.heb ?? week.vendredi.heb;
  const vDaf = live?.vendredi.daf ?? week.vendredi.daf;
  const vTeh = live?.vendredi.tehilim ?? week.vendredi.tehilim;
  const vOmer = live?.vendredi.omer ?? week.vendredi.omer;
  const vTimes = chabad
    ? week.vendredi.times.map((t) => t.label === "Allumer les bougies" ? { ...t, value: chabad.candle } : t)
    : week.vendredi.times;

  const sDate = live?.samedi.date ?? week.samedi.date;
  const sHeb = live?.samedi.heb ?? week.samedi.heb;
  const sDaf = live?.samedi.daf ?? week.samedi.daf;
  const sTeh = live?.samedi.tehilim ?? week.samedi.tehilim;
  const sTimes = chabad
    ? week.samedi.times.map((t) => t.label === "Fin du Chabbat" ? { ...t, value: chabad.havdalah } : t)
    : week.samedi.times;

  const liveEvents = live?.events ?? [];
  const events = liveEvents.length > 0 ? liveEvents : week.events;

  const MobileDay = ({
    badge, badgeTone, title, subtitle, daf, tehilim, shema, times, extra,
  }: {
    badge: string; badgeTone: "blue" | "gold"; title: string; subtitle: string;
    daf: string; tehilim: string; shema: string;
    times: { label: string; value: string; tone?: "gold" | "red" }[];
    extra?: React.ReactNode;
  }) => {
    const badgeBg = badgeTone === "gold" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground";
    // Mobile: only essential times
    const essentialLabels = new Set(["Allumer les bougies", "Fin du Chabbat", "Chaharit", "Minha", "Arvit"]);
    const shownTimes = times.filter(t => essentialLabels.has(t.label));
    return (
      <article className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div>
          <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.25em] ${badgeBg}`}>
            {badge}
          </span>
          <h3 className="font-display text-2xl font-bold text-foreground mt-2 leading-tight">{title}</h3>
          <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{subtitle}</p>
        </div>

        {extra}

        <div className="rounded-xl border-2 border-[var(--gold-line)] bg-[var(--gold-soft)] py-4 px-4 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary font-semibold mb-1">📖 Tehilim</p>
          <p className="font-display font-bold text-primary tabular-nums leading-none text-4xl">{tehilim}</p>
        </div>

        <div className="space-y-2">
          {shownTimes.map((t) => {
            const valueColor = t.tone === "gold" ? "text-primary" : t.tone === "red" ? "text-[var(--highlight)]" : "text-foreground";
            const rowBg = t.tone === "gold" ? "bg-[var(--gold-soft)]" : t.tone === "red" ? "bg-[var(--red-soft)]" : "";
            return (
              <div key={t.label} className={`flex items-center justify-between gap-3 py-2 px-3 rounded-lg ${rowBg}`}>
                <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium">{t.label}</span>
                <span className={`font-display font-bold tabular-nums text-2xl ${valueColor}`}>{t.value}</span>
              </div>
            );
          })}
        </div>
      </article>
    );
  };

  const upcoming = events.slice(0, 3);

  return (
    <main className="min-h-screen w-full bg-background text-foreground overflow-x-hidden">
      <div className="max-w-md mx-auto px-4 py-6 space-y-5">
        <header className="flex items-center justify-between gap-3">
          <img src={logo} alt="Hasdé Tsion" className="h-14 w-auto" />
          <div className="text-right">
            <div className="font-display text-3xl font-bold tabular-nums leading-none text-foreground">{time}</div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1 capitalize">{date}</p>
          </div>
        </header>

        



        <div className="rounded-2xl border-2 border-[var(--gold-line)] bg-[var(--gold-soft)] p-5 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary font-semibold mb-2">Parashat Hashavoua</p>
          <h2 className="font-display text-3xl font-bold text-foreground leading-tight">{parashaFr}</h2>
          {parashaHe && (
            <p className="font-hebrew text-2xl text-primary leading-none mt-2" dir="rtl">{parashaHe}</p>
          )}
        </div>

        <Link
          to="/textes"
          className="flex items-center justify-center gap-2 rounded-2xl border-2 border-primary bg-primary text-primary-foreground px-5 py-4 font-display text-lg font-bold shadow hover:opacity-90 transition"
        >
          <BookOpen className="h-5 w-5" />
          Textes & Prières
        </Link>

        <MobileDay
          badge="Vendredi" badgeTone="blue"
          title={vDate} subtitle={vHeb} daf={vDaf} tehilim={vTeh}
          shema={week.vendredi.shema} times={vTimes}
          extra={vOmer != null && (
            <div className="rounded-xl border border-accent/40 bg-[var(--blue-soft)] px-4 py-3 flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.2em] text-accent font-semibold">Omer · ce soir</span>
              <span className="font-display text-3xl font-bold text-accent leading-none">{vOmer}</span>
            </div>
          )}
        />

        <MobileDay
          badge="Shabbat" badgeTone="gold"
          title={sDate} subtitle={sHeb} daf={sDaf} tehilim={sTeh}
          shema={week.samedi.shema} times={sTimes}
        />

        {upcoming.length > 0 && (
          <article className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-display text-lg font-bold text-foreground mb-3">À venir</h3>
            <ul className="divide-y divide-border/60">
              {upcoming.map((e) => {
                const valueColor = e.tone === "gold" ? "text-primary" : e.tone === "red" ? "text-[var(--highlight)]" : "text-foreground";
                return (
                  <li key={e.date + e.title} className="flex items-center gap-3 py-2.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-16 shrink-0">{e.date}</span>
                    <span className="text-sm font-medium text-foreground flex-1 truncate">{e.title}</span>
                    {e.time && (
                      <span className={`font-display font-bold tabular-nums text-base ${valueColor}`}>{e.time}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </article>
        )}

        <article className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-display text-lg font-bold text-foreground mb-3">Zmanim du jour</h3>
          {zmanim?.tahanun && (
            <div className={`rounded-xl border px-3 py-2 mb-3 text-center ${zmanim.tahanun.recited ? "border-border bg-muted/40" : "border-[var(--gold-line)] bg-[var(--gold-soft)]"}`}>
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-semibold">Liturgie du jour</p>
              <p className={`font-display text-sm font-bold mt-0.5 ${zmanim.tahanun.recited ? "text-foreground" : "text-primary"}`}>
                {zmanim.tahanun.reason}
              </p>
            </div>
          )}
          {zmanim?.birkatLevana && (
            <div className="rounded-xl border border-[var(--gold-line)] bg-[var(--gold-soft)] px-3 py-2 mb-3 text-center">
              <p className="text-[10px] uppercase tracking-[0.25em] text-primary font-semibold">Bircat HaLevana</p>
              <p className="font-display text-base font-bold text-primary mt-0.5">
                {zmanim.birkatLevana.start} – {zmanim.birkatLevana.end}
              </p>
            </div>
          )}
          {zmanim ? (
            <>
              <ul className="divide-y divide-border/50">
                {zmanim.times.map((t) => (
                  <li key={t.label} className="flex items-center justify-between gap-2 py-1.5">
                    <span className="text-xs text-muted-foreground">{t.label}</span>
                    <span className="font-display font-semibold tabular-nums text-sm text-foreground">{t.value}</span>
                  </li>
                ))}
              </ul>
              {(zmanim.mishnaYomi || zmanim.yerushalmiYomi) && (
                <div className="mt-3 pt-3 border-t border-border space-y-1.5">
                  {zmanim.mishnaYomi && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">Mishna Yomi</span>
                      <span className="font-display font-semibold text-sm text-foreground">{zmanim.mishnaYomi.fr}</span>
                    </div>
                  )}
                  {zmanim.yerushalmiYomi && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">Yerushalmi Yomi</span>
                      <span className="font-display font-semibold text-sm text-foreground">{zmanim.yerushalmiYomi.fr}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground italic">Chargement…</p>
          )}
        </article>



        <footer className="text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground pt-2 pb-4">
          בס״ד · Hasdé Tsion
        </footer>
      </div>
    </main>
  );
}


function PlanningTV() {
  const isTV = useIsTV();
  const live = useLiveWeek(null);
  const chabad = useChabad();
  const zmanim = useZmanim(null);
  const kiosk = useKiosk();

  if (!isTV) return <MobileLayout live={live} chabad={chabad} zmanim={zmanim} />;


  // Merge live data into static fallbacks
  const vDate = live?.vendredi.date ?? week.vendredi.date;
  const vHeb = live?.vendredi.heb ?? week.vendredi.heb;
  const vDaf = live?.vendredi.daf ?? week.vendredi.daf;
  const vTeh = live?.vendredi.tehilim ?? week.vendredi.tehilim;
  const vOmer = live?.vendredi.omer ?? week.vendredi.omer;

  const sDate = live?.samedi.date ?? week.samedi.date;
  const sHeb = live?.samedi.heb ?? week.samedi.heb;
  const sDaf = live?.samedi.daf ?? week.samedi.daf;
  const sTeh = live?.samedi.tehilim ?? week.samedi.tehilim;

  // Horaires Shabbat — surcharge depuis Chabad.org Neuilly si dispo
  const vTimes = chabad
    ? week.vendredi.times.map((t) => t.label === "Allumer les bougies" ? { ...t, value: chabad.candle } : t)
    : week.vendredi.times;
  const sTimes = chabad
    ? week.samedi.times.map((t) => t.label === "Fin du Chabbat" ? { ...t, value: chabad.havdalah } : t)
    : week.samedi.times;

  return (
    <main className="h-screen w-screen overflow-hidden bg-background text-foreground grid grid-rows-[auto_auto_1fr_auto] gap-[1.2vh] p-[1.5vh_1.5vw]">
      <KioskControls {...kiosk} />
      <Header />
      <ParashaBanner live={live} />

      <section className="grid grid-cols-4 gap-[1vw] min-h-0">
        <ZmanimCard zmanim={zmanim} />

        <DayCard
          badge="Vendredi"
          badgeTone="blue"
          title={vDate}
          subtitle={vHeb}
          hebrew={vDaf}
          tehilim={vTeh}
          shema={week.vendredi.shema}
          times={vTimes}
          highlight={
            <div className="rounded-xl border border-accent/40 bg-[var(--blue-soft)] px-4 py-2 flex items-center justify-between">
              <span className="text-[1.1vh] uppercase tracking-[0.2em] text-accent font-semibold">
                Omer · ce soir
              </span>
              <span className="font-display text-[3.5vh] font-bold text-accent leading-none">
                {vOmer ?? "—"}
              </span>
            </div>
          }
        />

        <DayCard
          badge="Shabbat"
          badgeTone="gold"
          title={sDate}
          subtitle={sHeb}
          hebrew={sDaf}
          tehilim={sTeh}
          shema={week.samedi.shema}
          times={sTimes}
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

        <EventsCard live={live} />
      </section>


      <footer className="text-center text-[1.1vh] uppercase tracking-[0.3em] text-muted-foreground">
        בס״ד · Hasdé Tsion · Planning de la semaine
      </footer>
    </main>
  );
}
