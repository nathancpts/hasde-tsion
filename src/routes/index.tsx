import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import { Maximize2, Minimize2, ChevronLeft, ChevronRight } from "lucide-react";
import logo from "@/assets/logo-hasde-tsion.png";
import { fetchLiveWeek, fetchZmanim, type LiveWeek, type Zmanim } from "@/lib/jewish-calendar";
import { frenchHebMonth } from "@/lib/yahrtzeits";

import { fetchChabadShabbat, type ChabadWeek } from "@/lib/chabad.functions";
import { PARASHA_NOM, PARASHA_NOM_HE, PARASHA_INTRO, PARASHA_BLOCS, DONATIONS_REPAS } from "@/lib/weekly-content";
import CommunitySection from "@/components/community/CommunitySection";



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
    <div
      aria-hidden="true"
      className="btn-blue-animated absolute inset-0 -z-10 pointer-events-none"
    />
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
        href: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Noto+Serif+Hebrew:wght@400;700&display=swap",
      },
    ],
  }),
  component: PlanningTV,
});

// ============ DATA ============
const week = {
  parasha: { fr: "Sh’lach", he: "שלח", chap: "Pirkei Avot · Ch. 3" },
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
    cours: "Chaharit & Séouda Chlichit",
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
  const cacheKey = `ht.liveWeek.v1.${loc ? `${loc.lat.toFixed(2)},${loc.lon.toFixed(2)}` : "default"}`;
  const [live, setLive] = useState<LiveWeek | null>(null);
  useEffect(() => {
    let cancelled = false;
    const cached = readCache<LiveWeek>(cacheKey, 6 * 3600 * 1000);
    if (cached) setLive(cached);
    const load = () => {
      fetchLiveWeek(new Date(), loc ? { lat: loc.lat, lon: loc.lon } : undefined)
        .then((d) => { if (!cancelled) { setLive(d); writeCache(cacheKey, d); } })
        .catch((e) => console.warn("Hebcal fetch failed", e));
    };
    load();
    const id = setInterval(load, 15 * 60 * 1000);
    return () => { cancelled = true; clearInterval(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc]);
  return live;
}

// --- Cache léger pour rendu instantané au boot ---
function readCache<T>(key: string, maxAgeMs: number): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw) as { ts: number; data: T };
    if (Date.now() - ts > maxAgeMs) return null;
    return data;
  } catch { return null; }
}
function writeCache<T>(key: string, data: T) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data })); } catch { /* quota */ }
}

function useChabad() {
  const [weeks, setWeeks] = useState<ChabadWeek[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    const cached = readCache<ChabadWeek[]>("ht.chabad.v1", 7 * 24 * 3600 * 1000);
    if (cached) setWeeks(cached);
    const load = () => {
      fetchChabadShabbat()
        .then((d) => { if (!cancelled) { setWeeks(d); writeCache("ht.chabad.v1", d); } })
        .catch((e) => console.warn("Chabad fetch failed", e));
    };
    load();
    const id = setInterval(load, 60 * 60 * 1000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

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
  const cacheKey = "ht.shabbatZ.v1";
  const [data, setData] = useState<{ vendredi: Zmanim | null; samedi: Zmanim | null }>({ vendredi: null, samedi: null });
  useEffect(() => {
    let cancelled = false;
    const cached = readCache<{ vendredi: Zmanim | null; samedi: Zmanim | null }>(cacheKey, 24 * 3600 * 1000);
    if (cached) setData(cached);
    const load = async () => {
      const { friday, saturday } = nextFridaySaturday();
      const geo = loc ? { lat: loc.lat, lon: loc.lon } : undefined;
      try {
        const [v, s] = await Promise.all([fetchZmanim(friday, geo), fetchZmanim(saturday, geo)]);
        if (!cancelled) {
          const next = { vendredi: v, samedi: s };
          setData(next);
          writeCache(cacheKey, next);
        }
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

function HeroCountdown({ targetTime, selectedDay }: { targetTime: string; selectedDay: "vendredi" | "shabbat" }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (now === null) return null;

  const today = new Date(now);
  const dow = today.getDay(); // 0 Sun .. 5 Fri, 6 Sat
  const show = (selectedDay === "vendredi" && dow === 5) || (selectedDay === "shabbat" && dow === 6);
  if (!show) return null;

  const m = targetTime.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const target = new Date(today);
  target.setHours(Number(m[1]), Number(m[2]), 0, 0);
  const diff = target.getTime() - now;
  if (diff <= 0) return null;

  const h = Math.floor(diff / 3600000);
  const min = Math.floor((diff % 3600000) / 60000);
  const sec = Math.floor((diff % 60000) / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  const label = selectedDay === "vendredi" ? "Avant allumage" : "Avant sortie";

  return (
    <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md border border-white/25 px-4 py-1.5">
      <span className="text-[10px] uppercase tracking-[0.2em] text-white/80">{label}</span>
      <span className="font-display text-sm font-bold text-white tabular-nums">
        {pad(h)}:{pad(min)}:{pad(sec)}
      </span>
    </div>
  );
}



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
            <span className="font-bold" style={{ color: "#E8C98A" }}>Rav Arié Niselevitch</span>{" "}
            parmi nous pour ce Chabbat.
          </p>
          <div className="mt-[1vh] flex justify-center gap-[2vw] text-[1.4vh]">
            <div className="flex items-center gap-2">
              <span className="uppercase tracking-wider text-white/70">Officiant</span>
              <span className="font-semibold" style={{ color: "#E8C98A" }}>Aharon Djian</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="uppercase tracking-wider text-white/70">Cours</span>
              <span className="font-semibold" style={{ color: "#E8C98A" }}>Chaharit & Séouda Chlichit</span>
            </div>
          </div>
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
      <div className="text-right flex flex-col items-end gap-1">
        <p className="font-hebrew text-[4vh] text-white leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]" dir="rtl">
          {he}
        </p>
        <p className="font-hebrew text-[2.4vh] text-white leading-none mt-1 drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]" dir="rtl">
          שבת מברכים
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
                    <p className="text-[0.95vh] uppercase tracking-[0.25em] text-muted-foreground font-semibold mb-0.5">{i === 0 ? (badgeTone === "gold" ? "Début du Shema" : "Tefilin") : "Shema GR\"A"}</p>
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

function DonationsCard({ live }: { live?: LiveWeek | null }) {
  const donations = DONATIONS_REPAS;
  const rh = live?.roshHodesh ?? null;

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



      {rh && (
        <div className="mt-[1vh] rounded-lg border border-[var(--gold-line)] bg-[var(--gold-soft)] p-[1.2vh_1vw] text-center">
          <p className="text-[1.2vh] uppercase tracking-[0.3em] text-primary font-semibold">
            Prochain Rosh Ḥodesh
          </p>
          <p className="font-display font-bold text-[2.4vh] text-foreground mt-0.5 leading-none">{rh.nom}</p>
          <p className="text-[1.45vh] text-muted-foreground leading-snug mt-1">
            {rh.dateLabel}
          </p>
          {rh.moladHe && (
            <p className="text-[1.35vh] text-foreground/70 mt-1">{rh.moladHe}</p>
          )}
        </div>
      )}
    </article>
  );
}



function SidourLink({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState({ label: "Lecture du jour", url: "https://sidour.torah-box.com/" });

  useEffect(() => {
    const h = new Date().getHours();
    if (h >= 4 && h < 12) setInfo({ label: "Cha'harit (matin)", url: "https://sidour.torah-box.com/?priere=priere_matin" });
    else if (h >= 12 && h < 18) setInfo({ label: "Min'ha (après-midi)", url: "https://sidour.torah-box.com/?priere=priere_apres_midi" });
    else setInfo({ label: "Arvit (soir)", url: "https://sidour.torah-box.com/?priere=priere_soir" });
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Ouvrir eSiddur — ${info.label}`}
        className={`btn-blue-animated inline-flex items-center justify-center gap-3 rounded-xl border-2 border-[#0F3D7A] px-5 py-4 text-white font-display font-bold uppercase tracking-[0.25em] text-lg shadow-lg active:scale-[0.97] transition-transform w-full ${className}`}
      >
        <span aria-hidden>📖</span>
        <span>ESIDDUR</span>
        <span aria-hidden>›</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex flex-col" role="dialog" aria-modal="true">
          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-card border-b border-border">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-semibold">Sidour Torah-Box</p>
              <p className="font-display font-bold text-foreground truncate">{info.label}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="shrink-0 rounded-full bg-secondary text-secondary-foreground px-4 py-2 text-sm font-semibold active:scale-95 transition-transform"
            >
              Fermer
            </button>
          </div>
          <iframe
            src={info.url}
            title={`Sidour Torah-Box — ${info.label}`}
            className="flex-1 w-full bg-white"
          />
        </div>
      )}
    </>
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

function MobileGlassNav() {
  const items = [
    { id: "accueil", label: "Accueil", icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-3a1 1 0 011-1h2a1 1 0 011 1v3a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>
    )},
    { id: "shabbat", label: "Chabbat", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/><circle cx="12" cy="12" r="4"/></svg>
    )},
    { id: "etude", label: "Étude", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.25v13M12 6.25C10.83 5.48 9.25 5 7.5 5S4.17 5.48 3 6.25v13C4.17 18.48 5.75 18 7.5 18s3.33.48 4.5 1.25M12 6.25C13.17 5.48 14.75 5 16.5 5s3.33.48 4.5 1.25v13C19.83 18.48 18.25 18 16.5 18s-3.33.48-4.5 1.25"/></svg>
    )},
    { id: "siddur", label: "eSiddur", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 19.5A2.5 2.5 0 016.5 17H20V3H6.5A2.5 2.5 0 004 5.5v14zM4 19.5A2.5 2.5 0 006.5 22H20v-5"/></svg>
    )},
  ];
  const [active, setActive] = useState<string>("accueil");
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.25, 0.5, 1] }
    );
    items.forEach((it) => {
      const el = document.getElementById(it.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const go = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <nav
      aria-label="Navigation rapide"
      className="fixed left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-md"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
    >
      <div className="relative">
        <div aria-hidden className="absolute -inset-3 rounded-full bg-cyan-400/20 blur-2xl opacity-70 pointer-events-none" />
        <div
          className="relative flex items-center justify-between gap-1 p-1.5 rounded-full border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.45)]"
          style={{
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(24px) saturate(1.4)",
            WebkitBackdropFilter: "blur(24px) saturate(1.4)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18), 0 20px 50px rgba(0,0,0,0.45)",
          }}
        >
          {items.map((it) => {
            const isActive = active === it.id;
            return (
              <button
                key={it.id}
                type="button"
                onClick={() => go(it.id)}
                aria-label={it.label}
                aria-current={isActive ? "true" : undefined}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 px-2 rounded-full transition-all active:scale-95 ${
                  isActive
                    ? "bg-white/15 text-white ring-1 ring-white/30 shadow-inner"
                    : "text-white/55 hover:text-white"
                }`}
              >
                {it.icon}
                <span className="text-[9px] font-bold tracking-[0.12em] uppercase">{it.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}


function MobileLayout({ live, chabad, zmanim: _zmanim, dayOffset: _dayOffset, setDayOffset: _setDayOffset }: { live: LiveWeek | null; chabad: ChabadWeek | null; zmanim: Zmanim | null; dayOffset: number; setDayOffset: (n: number) => void }) {
  const now = useClock();
  const time = now ? now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "--:--";

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

  // Day selector (Vendredi / Shabbat) drives the hero widget
  const [selectedDay, setSelectedDayState] = useState<"vendredi" | "shabbat">("vendredi");
  const userTouchedDayRef = useRef(false);
  const setSelectedDay = useCallback((d: "vendredi" | "shabbat") => {
    userTouchedDayRef.current = true;
    setSelectedDayState(d);
  }, []);
  useEffect(() => {
    if (userTouchedDayRef.current) return;
    const now = new Date();
    const dow = now.getDay();
    const candle = chabad?.candle ?? vTimes.find((t) => t.label === "Entrée")?.value ?? null;
    const havdal = chabad?.havdalah ?? sTimes.find((t) => t.label === "Sortie")?.value ?? null;
    const toMin = (hm: string) => {
      const [h, m] = hm.split(":").map(Number);
      return h * 60 + m;
    };
    const nowMin = now.getHours() * 60 + now.getMinutes();
    if (dow === 6) {
      if (havdal && nowMin >= toMin(havdal)) setSelectedDayState("vendredi");
      else setSelectedDayState("shabbat");
    } else if (dow === 5) {
      if (candle && nowMin >= toMin(candle)) setSelectedDayState("shabbat");
      else setSelectedDayState("vendredi");
    } else {
      setSelectedDayState("vendredi");
    }
  }, [chabad?.candle, chabad?.havdalah, vTimes, sTimes]);
  // Section tab in white surface
  const [sectionTab, setSectionTab] = useState<"horaires" | "etude" | "communaute">("horaires");

  const heroTime = selectedDay === "vendredi"
    ? (chabad?.candle ?? vTimes.find((t) => t.label === "Entrée")?.value ?? "--:--")
    : (chabad?.havdalah ?? sTimes.find((t) => t.label === "Sortie")?.value ?? "--:--");
  const heroLabel = selectedDay === "vendredi" ? "Allumage des bougies" : "Sortie du Chabbat";
  const heroDate = selectedDay === "vendredi" ? vDate : sDate;
  const heroHeb = selectedDay === "vendredi" ? vHeb : sHeb;
  const heroDaf = selectedDay === "vendredi" ? vDaf : sDaf;
  const heroTeh = selectedDay === "vendredi" ? vTeh : sTeh;
  const heroTimes = selectedDay === "vendredi" ? vTimes : sTimes;
  const heroShema = selectedDay === "vendredi" ? vShema : sShema;

  // Tehilim split for stat display
  const tehParts = heroTeh.split(/[·\-\/–]/).map((s) => s.trim()).filter(Boolean);
  const tehShort = tehParts.length >= 2 ? `${tehParts[0]}–${tehParts[tehParts.length - 1]}` : heroTeh;

  return (
    <main className="mobile-scroll-root relative isolate min-h-[100dvh] w-full text-foreground overflow-x-hidden" style={{ background: "#F2F4F8" }}>
      {/* Blue gradient hero zone — animated en vague */}
      <div
        className="btn-blue-animated relative w-full overflow-hidden"
        style={{
          paddingTop: "calc(env(safe-area-inset-top) + 0.25rem)",
        }}
      >
        {/* Fondu doux depuis la couleur solide de la status bar vers le dégradé animé */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0"
          style={{
            height: "calc(env(safe-area-inset-top) + 80px)",
            background: "linear-gradient(180deg, #1f4ea8 0%, rgba(31,78,168,0.6) 55%, rgba(31,78,168,0) 100%)",
          }}
        />
        {/* Fondu bas supprimé */}

        <div className="max-w-md mx-auto px-5 pb-8">
          {/* Header */}
          <header id="accueil" className="flex items-center justify-end gap-3 scroll-mt-24">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/80">בס״ד</p>
          </header>

          {/* Day strip */}
          <div className="mt-2 flex items-end justify-center gap-6 text-white/70">
            <button
              onClick={() => setSelectedDay("vendredi")}
              className={`flex flex-col items-center transition-all ${selectedDay === "vendredi" ? "text-white scale-110" : "text-white/50"}`}
            >
              <span className="text-[11px] uppercase tracking-[0.2em]">Ven</span>
              <span className={`font-display ${selectedDay === "vendredi" ? "text-2xl font-bold" : "text-lg"}`}>
                {vDate.match(/\d+/)?.[0] ?? ""}
              </span>
            </button>
            <button
              onClick={() => setSelectedDay("shabbat")}
              className={`flex flex-col items-center transition-all ${selectedDay === "shabbat" ? "text-white scale-110" : "text-white/50"}`}
            >
              <span className="text-[11px] uppercase tracking-[0.2em]">Sam</span>
              <span className={`font-display ${selectedDay === "shabbat" ? "text-2xl font-bold" : "text-lg"}`}>
                {sDate.match(/\d+/)?.[0] ?? ""}
              </span>
            </button>
          </div>

          {/* Pill tabs */}
          <div className="mt-5 flex items-center justify-center gap-2">
            <button
              onClick={() => setSelectedDay("vendredi")}
              className={`px-4 py-1.5 rounded-full text-[12px] font-semibold transition-all ${
                selectedDay === "vendredi"
                  ? "bg-white/95 text-[#1f4ea8] shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
                  : "text-white/80"
              }`}
            >
              Vendredi
            </button>
            <button
              onClick={() => setSelectedDay("shabbat")}
              className={`px-4 py-1.5 rounded-full text-[12px] font-semibold transition-all ${
                selectedDay === "shabbat"
                  ? "bg-white/95 text-[#1f4ea8] shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
                  : "text-white/80"
              }`}
            >
              Chabbat
            </button>
          </div>

          {/* Hero number */}
          <div className="mt-8 text-center">
            <div className="font-display text-[88px] font-bold text-white leading-none tabular-nums drop-shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
              {heroTime}
            </div>
            <HeroCountdown targetTime={heroTime} selectedDay={selectedDay} />
            <p className="mt-1 text-[13px] text-white/90 font-medium">{heroLabel}</p>
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/70 mt-1">{heroHeb}</p>
          </div>


          {/* 3 stat widgets */}
          <div className="mt-7 mb-8 grid grid-cols-3 gap-2.5">
            <div className="rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 px-2 py-3 text-center">
              <p className="text-[10px] text-white/80 font-medium leading-tight">Entrée</p>
              <p className="font-display text-lg font-bold text-white tabular-nums mt-1">
                {chabad?.candle ?? vTimes.find((t) => t.label === "Entrée")?.value ?? "—"}
              </p>
            </div>
            <div className="rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 px-2 py-3 text-center">
              <p className="text-[10px] text-white/80 font-medium leading-tight">Sortie</p>
              <p className="font-display text-lg font-bold text-white tabular-nums mt-1">
                {chabad?.havdalah ?? sTimes.find((t) => t.label === "Sortie")?.value ?? "—"}
              </p>
            </div>
            <div className="rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 px-2 py-3 text-center">
              <p className="text-[10px] text-white/80 font-medium leading-tight">Tehilim</p>
              <p className="font-display text-base font-bold text-white tabular-nums mt-1 leading-tight">{tehShort}</p>
            </div>
          </div>
        </div>
      </div>

      {/* White surface */}
      <div
        className="relative -mt-6 rounded-t-[28px] bg-[#F2F4F8] pt-6 pb-32 shadow-[0_-8px_24px_rgba(0,0,0,0.08)]"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 7rem)" }}
      >
        <div className="max-w-md mx-auto px-4 space-y-4">
          {/* Section heading + tabs */}
          <div className="flex items-center justify-between px-1">
            <h2 className="font-display text-2xl font-bold text-foreground">Cette semaine</h2>
          </div>

          <div className="inline-flex w-full rounded-full bg-white p-1 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            {([
              { id: "horaires", label: "Accueil" },
              { id: "etude", label: "Étude" },
              { id: "communaute", label: "Communauté" },
            ] as const).map((t) => (
              <button
                key={t.id}
                onClick={() => setSectionTab(t.id)}
                className={`flex-1 py-2 rounded-full text-[12px] font-semibold transition-all ${
                  sectionTab === t.id
                    ? "btn-blue-animated text-white shadow-[0_4px_12px_rgba(31,78,168,0.3)]"
                    : "text-foreground/60"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {sectionTab === "horaires" && (
            <div className="space-y-3">
              {/* Parasha widget — full width */}
              <article
                className="btn-blue-animated rounded-3xl p-5 text-center"
                style={{
                  boxShadow: "0 8px 24px rgba(31,78,168,0.25)",
                }}
              >
                <p className="text-[10px] uppercase tracking-[0.3em] font-semibold text-white/80 mb-1">Parashat Hashavoua</p>
                <h3 className="font-display text-2xl font-bold text-white leading-tight">{parashaFr}</h3>
                {parashaHe && (
                  <p className="font-hebrew text-xl leading-none mt-2 text-white/90" dir="rtl">{parashaHe}</p>
                )}
                <p className="font-hebrew text-base text-white/80 mt-2" dir="rtl">שבת מברכים</p>
              </article>

              {/* 2-col: Daf | Tehilim */}
              <div className="grid grid-cols-2 gap-3">
                <article className="rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                  <p className="text-[10px] uppercase tracking-[0.25em] font-semibold text-[#1f4ea8]">📚 Daf</p>
                  <p className="font-display text-base font-bold text-foreground mt-1.5 leading-tight">{heroDaf}</p>
                </article>
                <article className="rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                  <p className="text-[10px] uppercase tracking-[0.25em] font-semibold text-primary">📖 Tehilim</p>
                  <p className="font-display text-2xl font-bold text-primary tabular-nums mt-1.5">{tehShort}</p>
                  {vOmer != null && selectedDay === "vendredi" && (
                    <p className="text-[10px] text-muted-foreground mt-1">Omer · {vOmer}</p>
                  )}
                </article>
              </div>

              {/* Shema / Tefilin widget */}
              {heroShema.includes("|") && (
                <article className="rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                  <div className="grid grid-cols-2 gap-3">
                    {heroShema.split("|").map((v, i) => (
                      <div key={i} className="text-center">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                          {i === 0
                            ? (selectedDay === "vendredi" ? "Début de Tefilin" : "Début du Shema")
                            : "Limite du Shema GR\"A"}
                        </p>
                        <p className="font-display text-xl font-bold text-foreground tabular-nums mt-1">{v.trim()}</p>
                      </div>
                    ))}
                  </div>
                </article>
              )}

              {/* Full prayer times list */}
              <article className="rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display text-base font-bold text-foreground">
                    Horaires · {selectedDay === "vendredi" ? "Vendredi" : "Chabbat"}
                  </h3>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{heroDate.split(" ").slice(1, 3).join(" ")}</span>
                </div>
                <div className="space-y-1.5">
                  {heroTimes.map((t) => {
                    const isGold = t.tone === "gold";
                    const isRed = t.tone === "red";
                    return (
                      <div
                        key={t.label}
                        className={`flex items-center justify-between gap-3 py-2 px-3 rounded-xl ${
                          isGold ? "bg-[var(--gold-soft)]" : isRed ? "bg-[var(--red-soft)]" : "bg-[#F8FAFC]"
                        }`}
                      >
                        <span className="text-[12px] uppercase tracking-[0.12em] text-foreground/70 font-medium">{t.label}</span>
                        <span className={`font-display font-bold tabular-nums text-xl ${
                          isGold ? "text-primary" : isRed ? "text-[var(--highlight)]" : "text-foreground"
                        }`}>
                          {t.value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </article>

              {/* 2-col: Rosh Hodesh | Yahrtzeit */}
              <div className="grid grid-cols-2 gap-3">
                {live?.roshHodesh ? (
                  <article className="rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                    <p className="text-[10px] uppercase tracking-[0.25em] font-semibold text-primary">🌙 Rosh Ḥodesh</p>
                    <p className="font-display text-lg font-bold text-foreground mt-1 leading-tight">{live.roshHodesh.nom}</p>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{live.roshHodesh.dateLabel}</p>
                  </article>
                ) : <div />}
                {(() => {
                  const dayData = selectedDay === "vendredi" ? live?.vendredi : live?.samedi;

                  const names = dayData?.yahrtzeits ?? [];
                  if (names.length === 0) return <div />;
                  return (
                    <article className="rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                      <p className="text-[10px] uppercase tracking-[0.25em] font-semibold text-[#1f4ea8]">🕯️ Yahrtzeit</p>
                      <p className="text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">
                        {dayData!.hd} {frenchHebMonth(dayData!.hm)}
                      </p>
                      <div className="text-[11px] text-foreground/80 mt-1 leading-snug space-y-0.5">
                        {names.map((n, i) => <div key={i}>{n}</div>)}
                      </div>
                    </article>
                  );
                })()}
              </div>

              {/* Invité d'honneur */}
              <article
                className="btn-blue-animated rounded-2xl p-5 text-center"
                style={{
                  boxShadow: "0 8px 20px rgba(10,42,107,0.3)",
                }}
              >
                <p className="text-[10px] uppercase tracking-[0.3em] font-semibold text-white/85 mb-2">
                  ✨ Invité d'honneur
                </p>
                <p className="font-display text-base font-semibold text-white leading-snug">
                  Bienvenue au{" "}
                  <span className="font-bold text-[#fff3d6]">Rav Arié Niselevitch</span>{" "}
                  pour ce Chabbat.
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-lg bg-white/15 px-2 py-1.5">
                    <p className="text-white/70 uppercase tracking-wider text-[9px]">Officiant</p>
                    <p className="font-semibold text-white">Aharon Djian</p>
                  </div>
                  <div className="rounded-lg bg-white/15 px-2 py-1.5">
                    <p className="text-white/70 uppercase tracking-wider text-[9px]">Cours</p>
                    <p className="font-semibold text-white leading-tight">Chaharit & Séouda Chlichit</p>
                  </div>
                </div>
              </article>

              {/* Séouda donateurs */}
              <article className="rounded-2xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.05)] android-scroll-fix">
                <h3 className="font-display text-lg font-bold text-foreground mb-3">La Séouda est offerte par</h3>
                {DONATIONS_REPAS.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Aucune donation pour le moment.</p>
                ) : (
                  <ul className="space-y-3">
                    {DONATIONS_REPAS.map((d, i) => (
                      <li key={i} className="rounded-xl bg-[#F8FAFC] p-3">
                        <p className="font-display font-bold text-base text-foreground leading-tight">{d.donateur}</p>
                        {d.occasion && (
                          <p className="text-[11px] uppercase tracking-[0.18em] text-primary font-semibold mt-1">{d.occasion}</p>
                        )}
                        {d.dedicace && (
                          <p className="font-display italic text-sm text-muted-foreground leading-tight mt-1">{d.dedicace}</p>
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

              {/* Donation CTAs */}
              <div className="grid grid-cols-2 gap-3">
                <a
                  href="https://www.helloasso.com/associations/hassidim-de-sion/formulaires/1?utm_source=app_ha&utm_campaign=share_campaign_button&utm_medium=android"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[64px] items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3.5 text-[13px] font-display font-semibold text-[#1f4ea8] ring-1 ring-[#1f4ea8]/20 shadow-[0_4px_12px_rgba(31,78,168,0.1)] active:scale-[0.97] transition-all"
                >
                  <span className="text-base">♡</span>
                  <span>Faire un don</span>
                </a>
                <a
                  href="https://www.helloasso.com/associations/hassidim-de-sion/evenements/seouda-1026?utm_source=app_ha&utm_campaign=share_campaign_button&utm_medium=android"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-blue-animated flex min-h-[64px] items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-[13px] font-display font-semibold text-white shadow-[0_8px_20px_-6px_rgba(15,61,122,0.6)] active:scale-[0.97] transition-all text-center leading-tight"
                >
                  Participer à la séouda
                </a>
              </div>

            </div>
          )}

          {sectionTab === "etude" && (
            <article id="etude" className="rounded-2xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.05)] scroll-mt-24">
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
                  <section key={i} className="rounded-xl border border-border/60 bg-[#F8FAFC] px-3 py-2.5">
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

              <div id="siddur" className="mt-4 scroll-mt-24">
                <SidourLink className="text-sm py-3" />
              </div>
            </article>
          )}

          {sectionTab === "communaute" && (
            <CommunitySection />
          )}




          <footer className="text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground pt-4">
            בס״ד · Hasdé Tsion
          </footer>
        </div>
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

  const isPdfMode = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("pdf") === "1";

  if (!isTV && !isPdfMode) return <MobileLayout live={live} chabad={chabad} zmanim={zmanim} dayOffset={dayOffset} setDayOffset={setDayOffset} />;


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
      {!isPdfMode && <KioskControls {...kiosk} />}
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
        >
          {(live?.vendredi.yahrtzeits.length ?? 0) > 0 && (
            <div className="rounded-lg border border-border bg-muted/40 p-[1vh_0.8vw]">
              <div className="text-[1.1vh] uppercase tracking-[0.3em] text-muted-foreground text-center font-semibold mb-[0.6vh]">
                {live!.vendredi.hd} {frenchHebMonth(live!.vendredi.hm)} 5786 · Yahrtzeit
              </div>
              <div className="text-[1.35vh] text-accent font-semibold leading-snug text-center space-y-0.5">
                {live!.vendredi.yahrtzeits.map((n, i) => <div key={i}>{n}</div>)}
              </div>
            </div>
          )}
        </DayCard>

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
          {(live?.samedi.yahrtzeits.length ?? 0) > 0 && (
            <div className="rounded-lg border border-border bg-muted/40 p-[1vh_0.8vw]">
              <div className="text-[1.1vh] uppercase tracking-[0.3em] text-muted-foreground text-center font-semibold mb-[0.6vh]">
                {live!.samedi.hd} {frenchHebMonth(live!.samedi.hm)} 5786 · Yahrtzeit
              </div>
              <div className="text-[1.35vh] text-accent font-semibold leading-snug text-center space-y-0.5">
                {live!.samedi.yahrtzeits.map((n, i) => <div key={i}>{n}</div>)}
              </div>
            </div>
          )}
        </DayCard>


        <DonationsCard live={live} />
      </section>


      <footer className="text-center text-[1.1vh] uppercase tracking-[0.3em] text-muted-foreground">
        בס״ד · Hasdé Tsion · Planning de la semaine
      </footer>
    </main>
  );
}
