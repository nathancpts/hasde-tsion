import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import { Maximize2, Minimize2, ChevronLeft, ChevronRight } from "lucide-react";
import logo from "@/assets/logo-hasde-tsion.png";
import { fetchLiveWeek, fetchZmanim, type LiveWeek, type Zmanim } from "@/lib/jewish-calendar";
import { fetchChabadShabbat, type ChabadWeek } from "@/lib/chabad.functions";
import { PARASHA_NOM, PARASHA_NOM_HE, PARASHA_INTRO, PARASHA_BLOCS, DONATIONS_REPAS } from "@/lib/weekly-content";


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

function DynamicBackground() {
  return (
    <div aria-hidden="true" className="dynamic-klein-bg">
      <div className="dynamic-klein-bg__layer dynamic-klein-bg__layer--base" />
      <div className="dynamic-klein-bg__layer dynamic-klein-bg__layer--mid" />
      <div className="dynamic-klein-bg__layer dynamic-klein-bg__layer--sheen" />
    </div>
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
      { label: "Minha · Suivi Seouda chlichit & cours", value: "21:10" },
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
    let timeoutId: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const delay = 1000 - (Date.now() % 1000);
      timeoutId = setTimeout(() => {
        setNow(new Date());
        schedule();
      }, delay);
    };
    schedule();
    return () => clearTimeout(timeoutId);
  }, []);
  return now;
}

/**
 * AutoScrollVertical — fait défiler lentement son contenu de haut en bas,
 * marque une pause, puis revient au début. Idéal pour affichage TV.
 */
function AutoScrollVertical({
  children,
  speed = 28,
  pause = 2500,
  className = "",
}: {
  children: React.ReactNode;
  speed?: number;
  pause?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let dir = 1;
    let pos = 0;
    let pauseUntil = 0;
    let last = performance.now();
    const tick = (t: number) => {
      const dt = t - last;
      last = t;
      const max = el.scrollHeight - el.clientHeight;
      if (max > 0 && t >= pauseUntil) {
        pos += dir * speed * (dt / 1000);
        if (pos >= max) {
          pos = max;
          pauseUntil = t + pause;
          dir = -1;
        } else if (pos <= 0) {
          pos = 0;
          pauseUntil = t + pause;
          dir = 1;
        }
        el.scrollTop = pos;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div ref={ref} className={`no-scrollbar overflow-y-auto ${className}`}>
      {children}
    </div>
  );
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

function useZmanim(loc: StoredLoc, dayOffset: number = 0) {
  const [z, setZ] = useState<Zmanim | null>(null);
  useEffect(() => {
    let cancelled = false;
    const load = () => {
      const d = new Date();
      d.setDate(d.getDate() + dayOffset);
      setZ(null);
      fetchZmanim(d, loc ? { lat: loc.lat, lon: loc.lon } : undefined)
        .then((data) => { if (!cancelled) setZ(data); })
        .catch((e) => console.warn("Zmanim fetch failed", e));
    };
    load();
    const id = setInterval(load, 60 * 60 * 1000); // refresh hourly
    return () => { cancelled = true; clearInterval(id); };
  }, [loc, dayOffset]);
  return z;
}

function nextFridaySaturday(now = new Date()): { friday: Date; saturday: Date } {
  const d = new Date(now);
  const diff = (5 - d.getDay() + 7) % 7;
  const friday = new Date(d);
  friday.setDate(d.getDate() + diff);
  const saturday = new Date(friday);
  saturday.setDate(friday.getDate() + 1);
  return { friday, saturday };
}

function useShabbatZmanim(loc: StoredLoc) {
  const [data, setData] = useState<{ vendredi: Zmanim | null; samedi: Zmanim | null }>({ vendredi: null, samedi: null });
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { friday, saturday } = nextFridaySaturday();
      const geo = loc ? { lat: loc.lat, lon: loc.lon } : undefined;
      try {
        const [v, s] = await Promise.all([fetchZmanim(friday, geo), fetchZmanim(saturday, geo)]);
        if (!cancelled) setData({ vendredi: v, samedi: s });
      } catch (e) { console.warn("Shabbat zmanim fetch failed", e); }
    };
    load();
    const id = setInterval(load, 60 * 60 * 1000);
    return () => { cancelled = true; clearInterval(id); };
  }, [loc]);
  return data;
}

function pickZman(z: Zmanim | null, label: string): string | null {
  return z?.times.find(t => t.label === label)?.value ?? null;
}

// Soustrait N minutes à un horaire "HH:MM" (ou "HHhMM") et renvoie "HH:MM"
function subtractMinutes(time: string | null, minutes: number): string | null {
  if (!time) return null;
  const m = time.match(/(\d{1,2})[h:](\d{2})/);
  if (!m) return null;
  const total = parseInt(m[1], 10) * 60 + parseInt(m[2], 10) - minutes;
  const norm = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(norm / 60)).padStart(2, "0")}:${String(norm % 60).padStart(2, "0")}`;
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

      <div className="flex-1 flex justify-center px-4">
        <div
          className="max-w-[60vw] rounded-2xl px-[2vw] py-[1.4vh] text-center"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(201,169,110,0.5)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 18px rgba(0,0,0,0.25)",
          }}
        >
          <p className="text-[1.1vh] uppercase tracking-[0.3em] font-semibold mb-[0.6vh]" style={{ color: "#C9A96E" }}>
            ✨ Invité d'honneur · Chabbat
          </p>
          <p className="font-display text-[2.3vh] font-semibold text-white leading-snug drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]">
            C'est avec beaucoup de bonheur que nous vous annonçons la venue du{" "}
            <span className="font-bold" style={{ color: "#E8C98A" }}>Rav Yachpi Niselevitch</span>{" "}
            parmi nous pour ce Chabbat.
          </p>
        </div>
      </div>

      <div className="text-right">
        <div className="font-display text-[7vh] font-bold tabular-nums leading-none text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
          {time}
        </div>
        <p className="text-[1.2vh] uppercase tracking-[0.25em] text-white/90 mt-1 capitalize font-semibold drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]">
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
    <div className="px-[2vw] py-[1.4vh] flex items-center justify-between gap-4">
      <div>
        <p className="text-[1.1vh] uppercase tracking-[0.3em] text-white font-semibold mb-0.5 drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
          Parashat Hashavoua
        </p>
        <h2 className="font-display text-[4.5vh] font-bold text-white leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
          {fr}
        </h2>
      </div>
      <div className="text-right">
        <p className="font-hebrew text-[4vh] text-white leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]" dir="rtl">
          {he}
        </p>
        <p className="mt-1 text-[1.1vh] text-white/80 uppercase tracking-wider font-semibold drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]">
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
      {(() => {
        const parts = tehilim.split(/[·\-\/]/).map((s) => s.trim()).filter(Boolean);
        const display = parts.length >= 2 ? [parts[0], parts[parts.length - 1]] : parts;
        return (
          <div className="rounded-lg border-2 border-[var(--gold-line)] bg-[var(--gold-soft)] py-[1vh] px-3 text-center">
            <p className="text-[1.1vh] uppercase tracking-[0.3em] text-primary font-semibold mb-0.5">
              📖 Tehilim du jour
            </p>
            <div className={`grid ${display.length === 2 ? "grid-cols-2 gap-2" : "grid-cols-1"}`}>
              {display.map((v, i) => (
                <p key={i} className="font-display font-bold text-primary tabular-nums leading-none text-[5.5vh]">{v}</p>
              ))}
            </div>
          </div>
        );
      })()}

      {(() => {
        const shemaParts = shema.split("|").map((s) => s.trim()).filter(Boolean);
        if (shemaParts.length >= 2) {
          return (
            <div className="rounded-lg border border-border bg-muted/30 py-[0.8vh] px-3 text-center">
              <div className="grid grid-cols-2 gap-2">
                {shemaParts.map((v, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <p className="text-[0.95vh] uppercase tracking-[0.25em] text-muted-foreground font-semibold mb-0.5">{i === 0 ? "Tefilin" : "Shema GR\"A"}</p>
                    <span className="font-display font-semibold text-foreground tabular-nums text-[1.8vh]">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        return (
          <div className="flex items-center justify-between text-[1.3vh]">
            <span className="uppercase tracking-[0.2em] text-muted-foreground">Limite Shema</span>
            <span className="font-display font-semibold text-foreground tabular-nums text-[1.8vh]">{shema}</span>
          </div>
        );
      })()}


      <div className="flex flex-col flex-1 min-h-0">
        {times.map((t) => (
          <TimeRow key={t.label} label={t.label} value={t.value} tone={t.tone} />
        ))}
      </div>

      {children}
    </article>
  );
}

function DonationsCard() {
  const donations = DONATIONS_REPAS;
  return (

    <article className="rounded-xl border border-border bg-card p-[1.4vh_1vw] flex flex-col min-h-0 overflow-hidden">
      <div className="flex items-center gap-2 mb-[1vh]">
        <span className="inline-block w-1.5 h-[3vh] bg-primary rounded-full" />
        <h3 className="font-display text-[2.6vh] font-bold text-foreground">
          La Séouda est offerte par :
        </h3>
      </div>

      <AutoScrollVertical className="flex-1 min-h-0 pr-1" speed={24} pause={2800}>
        {donations.length === 0 ? (
          <p className="text-[1.6vh] text-muted-foreground italic text-center py-[2vh]">
            Aucune donation pour le moment.
          </p>
        ) : (
          donations.map((d, i) => (
            <div
              key={i}
              className="py-[1vh] border-b border-border/60 last:border-0"
            >
              <p className="font-display font-bold text-[2.1vh] text-foreground leading-snug">
                {d.donateur}
              </p>
              {d.occasion && (
                <p className="text-[1.5vh] uppercase tracking-[0.18em] text-primary font-semibold mt-1">
                  {d.occasion}
                </p>
              )}
              {d.dedicace && (
                <p className="font-display italic text-[1.85vh] text-foreground leading-snug mt-1">
                  {d.dedicace}
                </p>
              )}
              {d.dedicaceHe && (
                <p className="font-hebrew text-[2vh] text-primary leading-tight mt-1.5" dir="rtl">
                  {d.dedicaceHe}
                </p>
              )}
              {d.details?.map((line, index) => (
                <p key={index} className="text-[1.7vh] text-foreground leading-snug mt-2">
                  {line}
                </p>
              ))}
            </div>
          ))
        )}
      </AutoScrollVertical>
    </article>
  );
}


function ParashaCard({ live }: { live: LiveWeek | null }) {
  const parashaFr = live?.parasha.fr ?? PARASHA_NOM;
  return (
    <article className="rounded-xl border border-border bg-card p-[1.4vh_1vw] flex flex-col min-h-0 overflow-hidden">
      <div className="flex items-center justify-between gap-2 mb-[0.6vh]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-block w-1.5 h-[3vh] bg-accent rounded-full shrink-0" />
          <h3 className="font-display text-[2.6vh] font-bold text-foreground truncate">
            Parasha {parashaFr}
          </h3>
        </div>
        {PARASHA_NOM_HE && (
          <span className="font-hebrew text-[2.4vh] text-primary shrink-0" dir="rtl">{PARASHA_NOM_HE}</span>
        )}
      </div>

      <AutoScrollVertical className="flex-1 min-h-0 pr-1">
        <div className="flex flex-col gap-[1.1vh]">
          {PARASHA_INTRO && (
            <p className="font-display italic text-[1.8vh] text-muted-foreground leading-snug">
              {PARASHA_INTRO}
            </p>
          )}
          {PARASHA_BLOCS.map((bloc, i) => (
            <section
              key={i}
              className="rounded-md border border-border/60 bg-muted/30 px-[0.9vw] py-[1vh]"
            >
              <p className="text-[1.4vh] uppercase tracking-[0.2em] text-primary font-semibold mb-[0.5vh]">
                {bloc.icone ? `${bloc.icone} ` : ""}{bloc.titre}
              </p>
              {bloc.paragraphes?.map((p, j) => (
                <p key={j} className="text-[1.85vh] text-foreground leading-snug mb-[0.4vh] last:mb-0">
                  {p}
                </p>
              ))}
              {bloc.puces && (
                <ul className="list-disc pl-[1.6vh] space-y-[0.4vh] mt-[0.4vh]">
                  {bloc.puces.map((p, j) => (
                    <li key={j} className="text-[1.8vh] text-foreground leading-snug">{p}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </AutoScrollVertical>
    </article>
  );
}



function ZmanimCard({ zmanim, dayOffset, setDayOffset }: { zmanim: Zmanim | null; dayOffset: number; setDayOffset: (n: number) => void }) {
  const times = zmanim?.times ?? [];
  const titleLabel = dayOffset === 0 ? "Zmanim du jour" : dayOffset === 1 ? "Zmanim demain" : dayOffset === -1 ? "Zmanim hier" : `Zmanim (J${dayOffset > 0 ? "+" : ""}${dayOffset})`;
  return (
    <article className="rounded-xl border border-border bg-card p-[1.4vh_1vw] flex flex-col min-h-0 overflow-hidden">
      <div className="flex items-center justify-between gap-2 mb-[0.4vh]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-block w-1.5 h-[3vh] bg-accent rounded-full shrink-0" />
          <h3 className="font-display text-[2.4vh] font-bold text-foreground truncate">{titleLabel}</h3>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setDayOffset(dayOffset - 1)} aria-label="Jour précédent" className="p-1 rounded-md border border-border hover:bg-muted/60 transition">
            <ChevronLeft className="w-[1.8vh] h-[1.8vh]" />
          </button>
          {dayOffset !== 0 && (
            <button onClick={() => setDayOffset(0)} className="text-[1vh] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-md border border-border hover:bg-muted/60 transition">
              Aujourd'hui
            </button>
          )}
          <button onClick={() => setDayOffset(dayOffset + 1)} aria-label="Jour suivant" className="p-1 rounded-md border border-border hover:bg-muted/60 transition">
            <ChevronRight className="w-[1.8vh] h-[1.8vh]" />
          </button>
        </div>
      </div>
      {zmanim?.date && (
        <p className="text-[1.05vh] uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-[0.8vh] capitalize">{zmanim.date}</p>
      )}


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

      <div className="flex flex-col flex-1 min-h-0 overflow-y-auto pr-1">
        {times.map((t) => (
          <div
            key={t.label}
            className="flex items-center justify-between gap-2 py-[0.2vh] border-b border-border/40 last:border-0"
          >
            <span className="text-[1.05vh] text-muted-foreground tracking-wide">{t.label}</span>
            <span className="font-display font-semibold tabular-nums text-[1.4vh] text-foreground">{t.value}</span>
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
          <p className="text-[1.3vh] text-muted-foreground italic text-center py-[2vh]">
            {zmanim ? "Horaires non disponibles pour ce jour." : "Chargement…"}
          </p>
        )}
      </div>
    </article>
  );
}


// ============ MOBILE LAYOUT ============

function MobileLayout({ live, chabad, zmanim, dayOffset, setDayOffset }: { live: LiveWeek | null; chabad: ChabadWeek | null; zmanim: Zmanim | null; dayOffset: number; setDayOffset: (n: number) => void }) {
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
  const shabbatZ = useShabbatZmanim(null);
  const vTefilin = pickZman(shabbatZ.vendredi, "Misheyakir / Tefilin");
  const vShemaGRA = pickZman(shabbatZ.vendredi, "Limite Shema GR\"A");
  const vShema = vTefilin && vShemaGRA ? `${vTefilin} | ${vShemaGRA}` : week.vendredi.shema;
  const vTimes = (chabad
    ? week.vendredi.times.map((t) => t.label === "Allumer les bougies" ? { ...t, value: chabad.candle } : t)
    : week.vendredi.times
  )
    .filter((t) => t.label !== "Arvit")
    .map((t) => t.label === "Allumer les bougies" ? { ...t, label: "Entrée" } : t);

  const sDate = live?.samedi.date ?? week.samedi.date;
  const sHeb = live?.samedi.heb ?? week.samedi.heb;
  const sDaf = live?.samedi.daf ?? week.samedi.daf;
  const sTeh = live?.samedi.tehilim ?? week.samedi.tehilim;
  const sTefilin = pickZman(shabbatZ.samedi, "Misheyakir / Tefilin");
  const sShemaGRA = pickZman(shabbatZ.samedi, "Limite Shema GR\"A");
  const sShema = sTefilin && sShemaGRA ? `${sTefilin} | ${sShemaGRA}` : week.samedi.shema;
  const sSheqyia = pickZman(shabbatZ.samedi, "Sheqyia");
  const sMinha = subtractMinutes(sSheqyia, 40);
  const sTimes = (chabad
    ? week.samedi.times.map((t) => t.label === "Fin du Chabbat" ? { ...t, value: chabad.havdalah } : t)
    : week.samedi.times
  ).map((t) => {
    if (t.label === "Minha" && sMinha) return { ...t, value: sMinha };
    if (t.label === "Chekia" && sSheqyia) return { ...t, value: sSheqyia };
    if (t.label === "Fin du Chabbat") return { ...t, label: "Sortie" };
    return t;
  });



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
    const shownTimes = times;
    const tehilimParts = tehilim.split(/[·\-\/]/).map((s) => s.trim()).filter(Boolean);
    const tehilimDisplay = tehilimParts.length >= 2 ? [tehilimParts[0], tehilimParts[tehilimParts.length - 1]] : tehilimParts;
    const shemaParts = shema.split("|").map((s) => s.trim()).filter(Boolean);
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
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary font-semibold mb-1">📖 Tehilim du jour</p>
          <div className={`grid ${tehilimDisplay.length === 2 ? "grid-cols-2 gap-3" : "grid-cols-1"}`}>
            {tehilimDisplay.map((v, i) => (
              <p key={i} className="font-display font-bold text-primary tabular-nums leading-none text-4xl">{v}</p>
            ))}
          </div>
        </div>

        {shemaParts.length >= 2 && (
          <div className="rounded-lg border border-border bg-muted/30 py-2 px-3 text-center">
            <div className="grid grid-cols-2 gap-3">
              {shemaParts.map((v, i) => (
                <div key={i} className="flex flex-col items-center">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-semibold mb-1">{i === 0 ? "Tefilin" : "Shema GR\"A"}</p>
                  <span className="font-display font-semibold text-foreground tabular-nums text-lg">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

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


  return (
    <main className="mobile-scroll-root relative isolate min-h-[100dvh] w-full bg-transparent text-foreground overflow-x-hidden">
      <DynamicBackground />
      <div className="max-w-md mx-auto px-4 space-y-5" style={{ paddingTop: "calc(env(safe-area-inset-top) + 1.5rem)", paddingBottom: "calc(env(safe-area-inset-bottom) + 6rem)" }}>
        <header className="flex items-center justify-between gap-3">
          <img src={logo} alt="Hasdé Tsion" className="h-14 w-auto" />
          <div className="text-right">
            <div className="font-display text-3xl font-bold tabular-nums leading-none text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">{time}</div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/70 mt-1 capitalize">{date}</p>
          </div>
        </header>

        <div
          className="relative rounded-2xl p-5 text-center"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(201,169,110,0.45)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 16px rgba(0,0,0,0.25)",
          }}
        >
          <p className="text-[10px] uppercase tracking-[0.3em] font-semibold mb-2" style={{ color: "#C9A96E" }}>Parashat Hashavoua</p>
          <h2 className="font-display text-3xl font-bold text-white leading-tight">{parashaFr}</h2>
          {parashaHe && (
            <p className="font-hebrew text-2xl leading-none mt-2" style={{ color: "#C9A96E" }} dir="rtl">{parashaHe}</p>
          )}
        </div>


        <MobileDay
          badge="Vendredi" badgeTone="blue"
          title={vDate} subtitle={vHeb} daf={vDaf} tehilim={vTeh}
          shema={vShema} times={vTimes}



        />

        <MobileDay
          badge="Shabbat" badgeTone="gold"
          title={sDate} subtitle={sHeb} daf={sDaf} tehilim={sTeh}
          shema={sShema} times={sTimes}

        />

        <article className="rounded-2xl border border-border bg-card p-5 android-scroll-fix">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="font-display text-xl font-bold text-foreground">Parasha {parashaFr}</h3>
            {PARASHA_NOM_HE && (
              <span className="font-hebrew text-xl text-primary" dir="rtl">{PARASHA_NOM_HE}</span>
            )}
          </div>
          {PARASHA_INTRO && (
            <p className="font-display italic text-sm text-muted-foreground leading-snug mb-3">
              {PARASHA_INTRO}
            </p>
          )}
          <div className="space-y-3">
            {PARASHA_BLOCS.map((bloc, i) => (
              <section key={i} className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5">
                <p className="text-[11px] uppercase tracking-[0.2em] text-primary font-semibold mb-1.5">
                  {bloc.icone ? `${bloc.icone} ` : ""}{bloc.titre}
                </p>
                {bloc.paragraphes?.map((p, j) => (
                  <p key={j} className="text-sm text-foreground leading-snug mb-1.5 last:mb-0">{p}</p>
                ))}
                {bloc.puces && (
                  <ul className="list-disc pl-4 space-y-1 mt-1">
                    {bloc.puces.map((p, j) => (
                      <li key={j} className="text-sm text-foreground leading-snug">{p}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-border bg-card p-5 android-scroll-fix">
          <h3 className="font-display text-xl font-bold text-foreground mb-3">La Séouda est offerte par :</h3>
          {DONATIONS_REPAS.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Aucune donation pour le moment.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {DONATIONS_REPAS.map((d, i) => (
                <li key={i} className="py-2.5">
                  <p className="font-display font-bold text-base text-foreground leading-tight">{d.donateur}</p>
                  {d.occasion && (
                    <p className="text-[11px] uppercase tracking-[0.18em] text-primary font-semibold mt-0.5">{d.occasion}</p>
                  )}
                  {d.dedicace && (
                    <p className="font-display italic text-sm text-muted-foreground leading-tight mt-0.5">{d.dedicace}</p>
                  )}
                  {d.dedicaceHe && (
                    <p className="font-hebrew text-base text-primary leading-tight mt-2" dir="rtl">{d.dedicaceHe}</p>
                  )}
                  {d.details?.map((line, index) => (
                    <p key={index} className="text-sm text-foreground/80 leading-relaxed mt-2">{line}</p>
                  ))}
                </li>
              ))}
            </ul>
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
  const [dayOffset, setDayOffset] = useState(0);
  const zmanim = useZmanim(null, dayOffset);
  const kiosk = useKiosk();
  const shabbatZ = useShabbatZmanim(null);

  // Auto-reload toutes les 15 min pour récupérer les mises à jour publiées
  useEffect(() => {
    const id = setInterval(() => window.location.reload(), 15 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  if (!isTV) return <MobileLayout live={live} chabad={chabad} zmanim={zmanim} dayOffset={dayOffset} setDayOffset={setDayOffset} />;


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
  const vTefilin = pickZman(shabbatZ.vendredi, "Misheyakir / Tefilin");
  const vShemaGRA = pickZman(shabbatZ.vendredi, "Limite Shema GR\"A");
  const vShema = vTefilin && vShemaGRA ? `${vTefilin} | ${vShemaGRA}` : week.vendredi.shema;
  const vTimes = (chabad
    ? week.vendredi.times.map((t) => t.label === "Allumer les bougies" ? { ...t, value: chabad.candle } : t)
    : week.vendredi.times
  )
    .filter((t) => t.label !== "Arvit")
    .map((t) => t.label === "Allumer les bougies" ? { ...t, label: "Entrée" } : t);
  const sTefilin = pickZman(shabbatZ.samedi, "Misheyakir / Tefilin");
  const sShemaGRA = pickZman(shabbatZ.samedi, "Limite Shema GR\"A");
  const sShema = sTefilin && sShemaGRA ? `${sTefilin} | ${sShemaGRA}` : week.samedi.shema;
  const sSheqyia = pickZman(shabbatZ.samedi, "Sheqyia");
  const sMinha = subtractMinutes(sSheqyia, 40);
  const sTimes = (chabad
    ? week.samedi.times.map((t) => t.label === "Fin du Chabbat" ? { ...t, value: chabad.havdalah } : t)
    : week.samedi.times
  ).map((t) => {
    if (t.label === "Minha" && sMinha) return { ...t, value: sMinha };
    if (t.label === "Chekia" && sSheqyia) return { ...t, value: sSheqyia };
    if (t.label === "Fin du Chabbat") return { ...t, label: "Sortie" };
    return t;
  });


  return (
    <main className="relative isolate h-screen w-screen overflow-hidden bg-transparent text-foreground grid grid-rows-[auto_auto_1fr_auto] gap-[1.2vh] p-[1.5vh_1.5vw]">
      <DynamicBackground />
      <KioskControls {...kiosk} />
      <Header />
      <ParashaBanner live={live} />

      <section className="grid grid-cols-4 gap-[1vw] min-h-0">
        <ParashaCard live={live} />

        <DayCard
          badge="Vendredi"
          badgeTone="blue"
          title={vDate}
          subtitle={vHeb}
          hebrew={vDaf}
          tehilim={vTeh}
          shema={vShema}

          times={vTimes}
        />

        <DayCard
          badge="Shabbat"
          badgeTone="gold"
          title={sDate}
          subtitle={sHeb}
          hebrew={sDaf}
          tehilim={sTeh}
          shema={sShema}

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

        <DonationsCard />
      </section>


      <footer className="text-center text-[1.1vh] uppercase tracking-[0.3em] text-muted-foreground">
        בס״ד · Hasdé Tsion · Planning de la semaine
      </footer>
    </main>
  );
}
