import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import logo from "@/assets/logo-hasde-tsion.png";
import kotelShabbat from "@/assets/kotel-shabbat.jpg";
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



function DynamicBackground() {
  return (
    <div
      aria-hidden="true"
      className="btn-blue-animated absolute inset-0 pointer-events-none"
      style={{ zIndex: 0, transform: "translate3d(0,0,0)", willChange: "background-position" }}
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
      { label: "Cours sur texte", value: "19:45" },
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
    const id = setInterval(load, 15 * 60 * 1000); // refresh every 15 min
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
    <header
      className="relative flex items-center justify-between gap-6 rounded-2xl px-[2vw] py-[1.6vh] overflow-hidden"
      style={{
        background: "linear-gradient(120deg, rgba(15,61,122,0.92) 0%, rgba(31,78,168,0.88) 55%, rgba(10,44,107,0.94) 100%)",
        border: "1px solid rgba(201,169,110,0.35)",
        boxShadow: "0 12px 40px -12px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.12)",
      }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(ellipse 60% 80% at 20% 30%, rgba(120,180,255,0.35) 0%, transparent 60%), radial-gradient(ellipse 50% 70% at 85% 70%, rgba(201,169,110,0.18) 0%, transparent 60%)",
        }}
      />
      <div className="relative flex items-center gap-4">
        <img src={logo} alt="Hasdé Tsion" className="h-[14vh] w-auto drop-shadow-[0_4px_10px_rgba(0,0,0,0.4)]" />
      </div>

      <div className="relative flex-1 flex justify-center">
        <div
          className="rounded-full px-[2vw] py-[1vh] flex items-center gap-[1.5vw] text-[1.5vh] backdrop-blur-md"
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.18)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15)",
          }}
        >
          <span className="uppercase tracking-[0.25em] text-white/70 text-[1.1vh] font-semibold">Officiant</span>
          <span className="inline-block w-1 h-[2vh] rounded-full" style={{ background: "#C9A96E" }} />
          <span className="font-display font-bold text-[1.8vh]" style={{ color: "#E8C98A" }}>Aharon Djian</span>
        </div>
      </div>

      <div className="relative text-right">
        <div className="font-display text-[6.8vh] font-bold tabular-nums leading-none text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
          {time}
        </div>
        <p className="text-[1.15vh] uppercase tracking-[0.28em] text-white/80 mt-1.5 capitalize font-semibold">
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
    <div
      className="relative rounded-2xl px-[2vw] py-[1.4vh] flex items-center justify-between gap-4 overflow-hidden"
      style={{
        background: "linear-gradient(90deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.14) 50%, rgba(255,255,255,0.06) 100%)",
        border: "1px solid rgba(201,169,110,0.4)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 6px 24px -8px rgba(0,0,0,0.4)",
      }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1" style={{ background: "linear-gradient(180deg, transparent, #C9A96E, transparent)" }} />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-1" style={{ background: "linear-gradient(180deg, transparent, #C9A96E, transparent)" }} />
      <div>
        <p className="text-[1.1vh] uppercase tracking-[0.35em] font-semibold mb-1" style={{ color: "#E8C98A" }}>
          ✦ Parashat Hashavoua
        </p>
        <h2 className="font-display text-[4.8vh] font-bold text-white leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
          {fr}
        </h2>
      </div>
      <div className="text-right flex flex-col items-end gap-1">
        <p className="font-hebrew text-[4.2vh] text-white leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]" dir="rtl">
          {he}
        </p>
        <p className="font-hebrew text-[2.2vh] leading-none mt-1" style={{ color: "#E8C98A" }} dir="rtl">
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
  const isGold = badgeTone === "gold";
  const headerBg = isGold
    ? "linear-gradient(120deg, #C9A96E 0%, #E8C98A 55%, #B8934D 100%)"
    : "linear-gradient(120deg, #1f4ea8 0%, #4a7bd1 55%, #0F3D7A 100%)";
  const headerText = isGold ? "#1a1a1a" : "#ffffff";
  return (
    <article
      className="relative rounded-2xl flex flex-col min-h-0 overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.96)",
        border: "1px solid rgba(201,169,110,0.28)",
        boxShadow: "0 18px 48px -18px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.9)",
      }}
    >
      {/* Header band with gradient */}
      <div
        className="relative px-[1vw] py-[1.1vh]"
        style={{ background: headerBg, color: headerText }}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[1vh] uppercase tracking-[0.28em] font-bold bg-black/15 backdrop-blur-sm">
            {badge}
          </span>
          <span className="text-[1.1vh] uppercase tracking-[0.25em] opacity-80">{subtitle}</span>
        </div>
        <h3 className="font-display text-[2.4vh] font-bold mt-1 leading-tight">{title}</h3>
        <p className="text-[1.05vh] opacity-75 mt-0.5">{hebrew}</p>
      </div>

      <div className="flex flex-col gap-[1vh] p-[1.2vh_1vw] flex-1 min-h-0">
        {highlight}

        {/* TEHILIM — biggest visual element */}
        {(() => {
          const parts = tehilim.split(/[·\-\/]/).map((s) => s.trim()).filter(Boolean);
          const display = parts.length >= 2 ? [parts[0], parts[parts.length - 1]] : parts;
          return (
            <div
              className="rounded-xl py-[1vh] px-3 text-center"
              style={{
                background: "linear-gradient(135deg, rgba(201,169,110,0.18) 0%, rgba(232,201,138,0.08) 100%)",
                border: "1.5px solid rgba(201,169,110,0.55)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
              }}
            >
              <p className="text-[1.05vh] uppercase tracking-[0.3em] text-primary font-semibold mb-0.5">
                📖 Tehilim du jour
              </p>
              <div className={`grid ${display.length === 2 ? "grid-cols-2 gap-2" : "grid-cols-1"}`}>
                {display.map((v, i) => (
                  <p key={i} className="font-display font-bold text-primary tabular-nums leading-none text-[5.2vh]">{v}</p>
                ))}
              </div>
            </div>
          );
        })()}

        {(() => {
          const shemaParts = shema.split("|").map((s) => s.trim()).filter(Boolean);
          if (shemaParts.length >= 2) {
            return (
              <div className="rounded-xl py-[0.8vh] px-3 text-center" style={{ background: "rgba(31,78,168,0.06)", border: "1px solid rgba(31,78,168,0.15)" }}>
                <div className="grid grid-cols-2 gap-2">
                  {shemaParts.map((v, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <p className="text-[0.9vh] uppercase tracking-[0.25em] text-muted-foreground font-semibold mb-0.5">{i === 0 ? (isGold ? "Début du Shema" : "Tefilin") : "Shema GR\"A"}</p>
                      <span className="font-display font-semibold text-foreground tabular-nums text-[1.9vh]">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          return (
            <div className="flex items-center justify-between text-[1.3vh]">
              <span className="uppercase tracking-[0.2em] text-muted-foreground">Limite Shema</span>
              <span className="font-display font-semibold text-foreground tabular-nums text-[1.9vh]">{shema}</span>
            </div>
          );
        })()}

        <div className="flex flex-col flex-1 min-h-0">
          {times.map((t) => (
            <TimeRow key={t.label} label={t.label} value={t.value} tone={t.tone} />
          ))}
        </div>

        {children}
      </div>
    </article>
  );
}

function DonationsCard({ live }: { live?: LiveWeek | null }) {
  const donations = DONATIONS_REPAS;
  const rh = live?.roshHodesh ?? null;

  return (
    <article
      className="relative rounded-2xl flex flex-col min-h-0 overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.96)",
        border: "1px solid rgba(201,169,110,0.28)",
        boxShadow: "0 18px 48px -18px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.9)",
      }}
    >
      <div
        className="px-[1vw] py-[1.1vh]"
        style={{ background: "linear-gradient(120deg, #C9A96E 0%, #E8C98A 55%, #B8934D 100%)", color: "#1a1a1a" }}
      >
        <span className="inline-block px-2.5 py-0.5 rounded-full text-[1vh] uppercase tracking-[0.28em] font-bold bg-black/15 backdrop-blur-sm">
          Communauté
        </span>
        <h3 className="font-display text-[2.4vh] font-bold mt-1 leading-tight">La Séouda est offerte par :</h3>
      </div>

      <div className="flex flex-col flex-1 min-h-0 p-[1.2vh_1vw]">
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
                <p className="font-display font-bold text-[2.05vh] text-foreground leading-snug">
                  {d.donateur}
                </p>
                {d.occasion && (
                  <p className="text-[1.45vh] uppercase tracking-[0.18em] text-primary font-semibold mt-1">
                    {d.occasion}
                  </p>
                )}
                {d.dedicace && (
                  <p className="font-display italic text-[1.8vh] text-foreground leading-snug mt-1">
                    {d.dedicace}
                  </p>
                )}
                {d.dedicaceHe && (
                  <p className="font-hebrew text-[2vh] text-primary leading-tight mt-1.5" dir="rtl">
                    {d.dedicaceHe}
                  </p>
                )}
                {d.details?.map((line, index) => (
                  <p key={index} className="text-[1.65vh] text-foreground leading-snug mt-2">
                    {line}
                  </p>
                ))}
              </div>
            ))
          )}
        </AutoScrollVertical>

        {rh && (
          <div
            className="mt-[1vh] rounded-xl p-[1.2vh_1vw] text-center"
            style={{
              background: "linear-gradient(135deg, rgba(201,169,110,0.2) 0%, rgba(232,201,138,0.1) 100%)",
              border: "1.5px solid rgba(201,169,110,0.55)",
            }}
          >
            <p className="text-[1.15vh] uppercase tracking-[0.3em] text-primary font-semibold">
              ✦ Prochain Rosh Ḥodesh
            </p>
            <p className="font-display font-bold text-[2.4vh] text-foreground mt-0.5 leading-none">{rh.nom}</p>
            <p className="text-[1.4vh] text-muted-foreground leading-snug mt-1">{rh.dateLabel}</p>
            {rh.moladHe && (
              <p className="text-[1.3vh] text-foreground/70 mt-1">{rh.moladHe}</p>
            )}
          </div>
        )}
      </div>
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
    <article
      className="relative rounded-2xl flex flex-col min-h-0 overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.96)",
        border: "1px solid rgba(201,169,110,0.28)",
        boxShadow: "0 18px 48px -18px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.9)",
      }}
    >
      <div
        className="px-[1vw] py-[1.1vh]"
        style={{ background: "linear-gradient(120deg, #1f4ea8 0%, #4a7bd1 55%, #0F3D7A 100%)", color: "#fff" }}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[1vh] uppercase tracking-[0.28em] font-bold bg-black/20 backdrop-blur-sm">
            Parasha
          </span>
          {PARASHA_NOM_HE && (
            <span className="font-hebrew text-[2.4vh]" style={{ color: "#E8C98A" }} dir="rtl">{PARASHA_NOM_HE}</span>
          )}
        </div>
        <h3 className="font-display text-[2.4vh] font-bold mt-1 leading-tight">
          {parashaFr}
        </h3>
      </div>

      <div className="flex-1 min-h-0 p-[1.2vh_1vw]">
        <AutoScrollVertical className="h-full pr-1">
          <div className="flex flex-col gap-[1.1vh]">
            {PARASHA_INTRO && (
              <p className="font-display italic text-[1.75vh] text-muted-foreground leading-snug">
                {PARASHA_INTRO}
              </p>
            )}
            {PARASHA_BLOCS.map((bloc, i) => (
              <section
                key={i}
                className="rounded-xl px-[0.9vw] py-[1vh]"
                style={{ background: "rgba(31,78,168,0.05)", border: "1px solid rgba(31,78,168,0.12)" }}
              >
                <p className="text-[1.35vh] uppercase tracking-[0.22em] text-primary font-semibold mb-[0.5vh]">
                  {bloc.icone ? `${bloc.icone} ` : ""}{bloc.titre}
                </p>
                {bloc.paragraphes?.map((p, j) => (
                  <p key={j} className="text-[1.8vh] text-foreground leading-snug mb-[0.4vh] last:mb-0">
                    {p}
                  </p>
                ))}
                {bloc.puces && (
                  <ul className="list-disc pl-[1.6vh] space-y-[0.4vh] mt-[0.4vh]">
                    {bloc.puces.map((p, j) => (
                      <li key={j} className="text-[1.75vh] text-foreground leading-snug">{p}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </AutoScrollVertical>
      </div>
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


function MobileLayout({ live, chabad, zmanim, dayOffset, setDayOffset }: { live: LiveWeek | null; chabad: ChabadWeek | null; zmanim: Zmanim | null; dayOffset: number; setDayOffset: (n: number) => void }) {
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

  // Selected day is driven by dayOffset (0 = today, up to +6 = next week)
  const today = new Date();
  const selectedDate = new Date(today);
  selectedDate.setDate(today.getDate() + dayOffset);
  const selectedDow = selectedDate.getDay(); // 0=Dim..6=Sam
  const isFri = selectedDow === 5;
  const isSat = selectedDow === 6;
  const isShabbatDay = isFri || isSat;
  const selectedDay: "vendredi" | "shabbat" = isSat ? "shabbat" : "vendredi";

  const DAY_FULL = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  const DAY_SHORT = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return { offset: i, dow: d.getDay(), num: d.getDate() };
  });


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
        className="btn-blue-animated relative w-full overflow-hidden select-none"
        style={{
          paddingTop: "calc(env(safe-area-inset-top) + 0.25rem)",
          touchAction: "pan-y",
        }}
        onTouchStart={(e) => {
          const t = e.touches[0];
          (e.currentTarget as any)._sx = t.clientX;
          (e.currentTarget as any)._sy = t.clientY;
        }}
        onTouchEnd={(e) => {
          const sx = (e.currentTarget as any)._sx as number | undefined;
          const sy = (e.currentTarget as any)._sy as number | undefined;
          if (sx == null || sy == null) return;
          const t = e.changedTouches[0];
          const dx = t.clientX - sx;
          const dy = t.clientY - sy;
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
            if (dx < 0 && dayOffset < 6) setDayOffset(dayOffset + 1);
            else if (dx > 0 && dayOffset > 0) setDayOffset(dayOffset - 1);
          }
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

        <div className="max-w-md mx-auto px-5 pb-24">
          {/* Header */}
          <header id="accueil" className="flex items-center justify-end gap-3 scroll-mt-24">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/80">בס״ד</p>
          </header>

          {/* 7-day strip — today + 6 next days */}
          <div className="mt-2 grid grid-cols-7 gap-1">
            {weekDays.map((d) => {
              const active = dayOffset === d.offset;
              return (
                <button
                  key={d.offset}
                  onClick={() => setDayOffset(d.offset)}
                  className={`flex flex-col items-center py-1.5 rounded-xl transition-all ${
                    active ? "bg-white/20 text-white" : "text-white/55"
                  }`}
                >
                  <span className="text-[9px] uppercase tracking-wider">{DAY_SHORT[d.dow]}</span>
                  <span className={`font-display tabular-nums mt-0.5 ${active ? "text-xl font-bold" : "text-base"}`}>
                    {d.num}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Hero number */}
          <div key={dayOffset} className="mt-8 text-center animate-fade-in">
            <div className="font-display text-[88px] font-bold text-white leading-none tabular-nums drop-shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
              {isShabbatDay ? heroTime : time}
            </div>
            {isShabbatDay && <HeroCountdown targetTime={heroTime} selectedDay={selectedDay} />}
            <p className="mt-1 text-[13px] text-white/90 font-medium">
              {isShabbatDay ? heroLabel : DAY_FULL[selectedDow]}
            </p>
            {isShabbatDay && (
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/70 mt-1">{heroHeb}</p>
            )}
            {!isShabbatDay && dayOffset === 0 && (() => {
              const times = zmanim?.times ?? [];
              if (times.length === 0) return null;
              const toMin = (hm: string) => {
                const m = hm.match(/^(\d{1,2}):(\d{2})/);
                if (!m) return null;
                return Number(m[1]) * 60 + Number(m[2]);
              };
              const nowMin = now ? now.getHours() * 60 + now.getMinutes() : 0;
              const upcoming = times
                .map((t) => ({ ...t, min: toMin(t.value) }))
                .filter((t) => t.min != null && t.min! > nowMin);
              const next = upcoming[0];
              if (!next || next.min == null) return null;
              const diff = next.min - nowMin;
              const h = Math.floor(diff / 60);
              const m = diff % 60;
              const remaining = h > 0
                ? `dans ${h}h${m.toString().padStart(2, "0")}`
                : `dans ${m} min`;
              return (
                <div className="mt-5 inline-flex items-center gap-4 px-5 py-2.5 rounded-full bg-white/15 backdrop-blur-md border-2 border-white/60">
                  <span className="text-[11px] uppercase tracking-[0.25em] text-white/80">Prochain</span>
                  <span className="text-[13px] font-semibold text-white">{next.label}</span>
                  <span className="text-[12px] text-white/90 tabular-nums">· {remaining}</span>
                </div>
              );
            })()}

          </div>



          {/* 3 stat widgets — Vendredi/Chabbat seulement */}
          {isShabbatDay && (
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
          )}

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
            <article className="rounded-2xl overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.08)] bg-black">
              <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-[#1f4ea8] to-[#0F3D7A]">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[11px] uppercase tracking-[0.2em] text-white font-semibold">Live · Hasdé Tsion</span>
                </div>
              </div>
              <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
                <iframe
                  src="https://www.youtube.com/embed/mjM4mYuSt6o?autoplay=1&mute=1&controls=1&rel=0&playsinline=1&enablejsapi=1"
                  title="Live Hasdé Tsion"
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full border-0"
                />
              </div>
            </article>
          )}

          {sectionTab === "horaires" && !isShabbatDay && (
            <div className="space-y-3">

              {/* Daily Zmanim (jours hors Vendredi/Chabbat) */}
              <article className="rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                <div className="text-center mb-3">
                  <p className="text-[10px] uppercase tracking-[0.25em] font-semibold text-[#1f4ea8]">
                    {dayOffset === 0 ? "Aujourd'hui" : dayOffset === 1 ? "Demain" : DAY_FULL[selectedDow]}
                  </p>
                  <p className="font-display text-base font-bold text-foreground capitalize mt-0.5">
                    {zmanim?.date ?? selectedDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                  </p>
                </div>
                <div className="space-y-1">
                  {(zmanim?.times ?? []).map((t) => (
                    <div key={t.label} className="flex items-center justify-between gap-3 py-2 px-3 rounded-xl bg-[#F8FAFC]">
                      <span className="text-[12px] uppercase tracking-[0.1em] text-foreground/70 font-medium">{t.label}</span>
                      <span className="font-display font-bold tabular-nums text-lg text-foreground">{t.value}</span>
                    </div>
                  ))}
                  {(!zmanim || zmanim.times.length === 0) && (
                    <p className="text-[12px] text-muted-foreground italic text-center py-6">
                      {zmanim ? "Horaires non disponibles." : "Chargement…"}
                    </p>
                  )}
                </div>
              </article>
            </div>
          )}

          {sectionTab === "horaires" && isShabbatDay && (
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

              {/* Rosh Hodesh | Yahrtzeit — auto layout */}
              {(() => {
                const dayData = selectedDay === "vendredi" ? live?.vendredi : live?.samedi;
                const names = dayData?.yahrtzeits ?? [];
                const hasRosh = !!live?.roshHodesh;
                const hasYahr = names.length > 0;
                if (!hasRosh && !hasYahr) return null;

                const roshEl = hasRosh ? (
                  <article className="rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                    <p className="text-[10px] uppercase tracking-[0.25em] font-semibold text-primary">🌙 Rosh Ḥodesh</p>
                    <p className="font-display text-lg font-bold text-foreground mt-1 leading-tight">{live!.roshHodesh!.nom}</p>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{live!.roshHodesh!.dateLabel}</p>
                  </article>
                ) : null;

                const yahrEl = hasYahr ? (
                  <article className="rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                    <p className="text-[10px] uppercase tracking-[0.25em] font-semibold text-[#1f4ea8]">🕯️ Yahrtzeit</p>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">
                      {dayData!.hd} {frenchHebMonth(dayData!.hm)}
                    </p>
                    <div className="text-[11px] text-foreground/80 mt-1 leading-snug space-y-0.5">
                      {names.map((n, i) => <div key={i}>{n}</div>)}
                    </div>
                  </article>
                ) : null;

                if (hasRosh && hasYahr) {
                  return <div className="grid grid-cols-2 gap-3">{roshEl}{yahrEl}</div>;
                }
                return roshEl ?? yahrEl;
              })()}



              {/* Invités d'honneur — Hatan & Kala (reset auto. tous les dimanches à 00:01) */}
              {(() => {
                // Date à laquelle les invités ont été ajoutés. Mettre à jour à chaque nouvel ajout.
                const INVITES_SET_AT = new Date("2026-06-19T00:00:00+02:00");
                // Calcule le dernier dimanche 00:01 (heure locale)
                const ref = now ?? new Date();
                const lastReset = new Date(ref);
                lastReset.setHours(0, 1, 0, 0);
                const day = lastReset.getDay(); // 0 = dimanche
                if (day !== 0 || ref.getTime() < lastReset.getTime()) {
                  lastReset.setDate(lastReset.getDate() - (day === 0 ? 7 : day));
                }
                const expired = INVITES_SET_AT.getTime() < lastReset.getTime();

                return (
                  <article
                    className="btn-blue-animated rounded-2xl p-5 text-center"
                    style={{
                      boxShadow: "0 8px 20px rgba(10,42,107,0.3)",
                    }}
                  >
                    <p className="text-[10px] uppercase tracking-[0.3em] font-semibold text-white/85 mb-2">
                      ✨ Invités d'honneur
                    </p>
                    {expired ? (
                      <p className="font-display text-[15px] italic text-white/80 py-3">
                        Aucun invité pour le moment
                      </p>
                    ) : (
                      <>
                        <p className="font-display text-[20px] font-bold text-[#fff3d6] leading-tight">
                          Levanah &amp; Ethan
                          <br />
                          <span className="text-[17px] tracking-wide">Sellam</span>
                        </p>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                          <div className="rounded-lg bg-white/15 px-2 py-1.5">
                            <p className="text-white/70 uppercase tracking-wider text-[9px]">Officiant</p>
                            <p className="font-semibold text-white">Aharon Djian</p>
                          </div>
                          <div className="rounded-lg bg-white/15 px-2 py-1.5">
                            <p className="text-white/70 uppercase tracking-wider text-[9px]">Cours</p>
                            <p className="font-semibold text-white leading-tight">Chaharit &amp; Séouda Chlichit</p>
                          </div>
                        </div>
                      </>
                    )}
                  </article>
                );
              })()}

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

          {sectionTab === "communaute" && null}




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
  const { toggle: toggleFs, isFs } = useKiosk();
  const shabbatZ = useShabbatZmanim(null);

  const isPdfMode = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("pdf") === "1";

  // Ticking clock (for countdown) — declared before early return to preserve hook order
  const [nowTs, setNowTs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 30 * 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const scheduleMidnight = () => {
      const n = new Date();
      const next = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1, 0, 0, 5, 0);
      const delay = Math.max(1000, next.getTime() - n.getTime());
      return window.setTimeout(() => {
        setNowTs(Date.now());
        timerId = scheduleMidnight();
      }, delay);
    };
    let timerId = scheduleMidnight();
    return () => window.clearTimeout(timerId);
  }, []);

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

  const now = new Date(nowTs);

  const clock = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const parashaFr = live?.parasha.fr ?? week.parasha.fr;
  const parashaHe = live?.parasha.he ?? week.parasha.he;

  // Luxury palette
  const BG_DEEP = "#0A1128";
  const BG_MID = "#0D1B2A";
  const GOLD = "#C5A059";
  const GOLD_BRIGHT = "#D4AF37";
  const GOLD_HAIR = "rgba(197,160,89,0.22)";
  const CARD_BG = "rgba(255,255,255,0.035)";
  const CARD_BORDER = "rgba(197,160,89,0.14)";
  const CARD_SHADOW = "0 1px 0 rgba(255,255,255,0.04) inset, 0 20px 60px -20px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(197,160,89,0.18)";

  const HEADING_FONT = "'Playfair Display', Georgia, serif";
  const BODY_FONT = "'Inter', system-ui, sans-serif";

  // Column 1 — key takeaways (max 4 bullets)
  const pointsBloc = PARASHA_BLOCS.find((b) => /point/i.test(b.titre));
  const bullets = (pointsBloc?.puces ?? []).slice(0, 4);

  // Column 2 — TODAY's zmanim + countdown, like mobile
  const todayTimes = zmanim?.times ?? [];
  const todayDateLabel = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const toMin = (hm: string) => {
    const m = hm.match(/^(\d{1,2}):(\d{2})/);
    if (!m) return null;
    return Number(m[1]) * 60 + Number(m[2]);
  };
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const todayWithMin = todayTimes.map((t) => ({ ...t, min: toMin(t.value) }));
  const nextZman = todayWithMin.find((t) => t.min != null && t.min > nowMin) as
    | { label: string; value: string; min: number }
    | undefined;
  let countdown: string | null = null;
  if (nextZman) {
    const diff = nextZman.min - nowMin;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    countdown = h > 0 ? `dans ${h}h${m.toString().padStart(2, "0")}` : `dans ${m} min`;
  }
  const entryTime = chabad?.candle ?? week.vendredi.times.find((t) => t.label === "Allumer les bougies")?.value ?? null;
  const exitTime = chabad?.havdalah ?? week.samedi.times.find((t) => t.label === "Fin du Chabbat")?.value ?? null;

  // ─── Shabbat detection (Fri after entry → Sat before exit) ───
  const dow = now.getDay();
  const parseHM = (hm: string | null | undefined): number | null => {
    if (!hm) return null;
    const m = hm.match(/^(\d{1,2}):(\d{2})/);
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
  };
  const entryMin = parseHM(entryTime);
  const exitMin = parseHM(exitTime);
  const isShabbatNow =
    (dow === 5 && entryMin != null && nowMin >= entryMin) ||
    (dow === 6 && (exitMin == null || nowMin < exitMin));

  // ─── Kotel fullscreen cycle: every 5 min, focused for 1 min (disabled on Shabbat) ───
  const [kotelFocused, setKotelFocused] = useState(false);
  useEffect(() => {
    if (isShabbatNow) {
      setKotelFocused(false);
      return;
    }
    const CYCLE = 5 * 60 * 1000;
    const FOCUS = 60 * 1000;
    const tick = () => {
      setKotelFocused(true);
      window.setTimeout(() => setKotelFocused(false), FOCUS);
    };
    const id = window.setInterval(tick, CYCLE);
    return () => window.clearInterval(id);
  }, [isShabbatNow]);

  const HEADING_FONT_LOCAL = "'Playfair Display', Georgia, serif";
  const BODY_FONT_LOCAL = "'Inter', system-ui, sans-serif";
  const GOLD_LOCAL = "#D4AF37";

  return (
    <main
      className="relative isolate h-screen w-screen overflow-hidden grid grid-rows-[25vh_1fr]"
      style={{ fontFamily: BODY_FONT_LOCAL, background: "#0F3D7A" }}
    >
      {/* ─── TOP 25% — animated royal blue (reused from mobile: .btn-blue-animated) ─── */}
      <header
        className="relative overflow-hidden"
        style={{
          filter: kotelFocused ? "blur(12px)" : "none",
          opacity: kotelFocused ? 0.4 : 1,
          transition: "filter 800ms ease, opacity 800ms ease",
        }}
      >
        <DynamicBackground />
        <div className="relative z-10 flex items-center justify-between px-[3.5vw] pt-[3vh] pb-[3vh] h-full">
          {/* Left: Logo + Prochain badge */}
          <div className="flex flex-col justify-between h-full">
            <img
              src={logo}
              alt="Hasdé Tsion"
              className="h-[9vh] w-auto"
              style={{ filter: "brightness(0) invert(1) drop-shadow(0 2px 14px rgba(255,255,255,0.25))" }}
            />
            {nextZman && countdown && (
              <div
                className="inline-flex items-center gap-[1vw] px-[1.6vw] py-[1.1vh] rounded-full self-start backdrop-blur-md"
                style={{
                  background: "rgba(255,255,255,0.14)",
                  border: "1px solid rgba(255,255,255,0.28)",
                  boxShadow: "0 8px 32px -8px rgba(0,0,0,0.35)",
                }}
              >
                <span
                  className="uppercase text-white/85"
                  style={{ fontSize: "1.2vh", letterSpacing: "0.42em", fontWeight: 700 }}
                >
                  Prochain
                </span>
                <span className="text-white/40" style={{ fontSize: "1.4vh" }}>|</span>
                <span className="text-white" style={{ fontSize: "2vh", fontWeight: 600 }}>
                  {nextZman.label}
                </span>
                <span className="text-white/50" style={{ fontSize: "1vh" }}>•</span>
                <span className="tabular-nums text-white" style={{ fontSize: "2vh", fontWeight: 500 }}>
                  {countdown}
                </span>
              </div>
            )}
          </div>

          {/* Right: Clock + date */}
          <div className="text-right flex flex-col items-end">
            <div
              className="tabular-nums leading-none text-white tracking-tight"
              style={{
                fontSize: "12vh",
                fontFamily: HEADING_FONT_LOCAL,
                fontWeight: 700,
                textShadow: "0 4px 32px rgba(0,0,0,0.25)",
              }}
            >
              {clock}
            </div>
            <p
              className="uppercase text-white/85 mt-[1vh] capitalize"
              style={{ fontSize: "1.5vh", fontWeight: 600, letterSpacing: "0.35em" }}
            >
              {dateStr}
            </p>
          </div>
        </div>

        {/* Discreet fullscreen toggle — fades out in kiosk */}
        <button
          type="button"
          onClick={toggleFs}
          aria-label={isFs ? "Quitter le plein écran" : "Passer en plein écran"}
          className="absolute top-[1.4vh] right-[1.4vw] z-20 flex items-center justify-center rounded-full backdrop-blur-md transition-opacity duration-500 hover:opacity-100"
          style={{
            width: "3.4vh",
            height: "3.4vh",
            background: "rgba(255,255,255,0.14)",
            border: "1px solid rgba(255,255,255,0.28)",
            color: "white",
            opacity: isFs ? 0.08 : 0.55,
          }}
        >
          <svg width="55%" height="55%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            {isFs ? (
              <>
                <path d="M9 3v4a2 2 0 0 1-2 2H3" />
                <path d="M21 9h-4a2 2 0 0 1-2-2V3" />
                <path d="M15 21v-4a2 2 0 0 1 2-2h4" />
                <path d="M3 15h4a2 2 0 0 1 2 2v4" />
              </>
            ) : (
              <>
                <path d="M3 9V5a2 2 0 0 1 2-2h4" />
                <path d="M21 9V5a2 2 0 0 0-2-2h-4" />
                <path d="M3 15v4a2 2 0 0 0 2 2h4" />
                <path d="M21 15v4a2 2 0 0 1-2 2h-4" />
              </>
            )}
          </svg>
        </button>
      </header>

      {/* ─── BOTTOM 75% — white overlay sheet with rounded top ─── */}
      <section
        className="relative -mt-[4vh] z-10 px-[2vw] pt-[3vh] pb-[2.5vh] flex flex-col min-h-0 overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #FFFFFF 0%, #F5F7FB 100%)",
          borderRadius: "32px 32px 0 0",
          boxShadow: "0 -20px 60px -30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.9)",
          color: "#1A2540",
          filter: kotelFocused ? "blur(12px)" : "none",
          opacity: kotelFocused ? 0.4 : 1,
          transition: "filter 800ms ease, opacity 800ms ease",
          transform: "translate3d(0,0,0)",
        }}
      >
        {/* Parasha banner ribbon */}
        <div className="flex items-baseline justify-between gap-[2vw] px-[1.4vw] pb-[1.6vh] mb-[1.6vh] shrink-0" style={{ borderBottom: "1px solid rgba(15,61,122,0.08)" }}>
          <div className="flex items-baseline gap-[1.2vw]">
            <span
              className="uppercase"
              style={{ fontSize: "1.2vh", letterSpacing: "0.5em", color: "#0F3D7A", fontWeight: 700 }}
            >
              Parasha
            </span>
            <h1
              className="leading-none"
              style={{
                fontSize: "4.6vh",
                fontFamily: HEADING_FONT_LOCAL,
                fontWeight: 700,
                color: "#0F3D7A",
                letterSpacing: "-0.01em",
              }}
            >
              {parashaFr}
            </h1>
          </div>
          <span
            className="font-hebrew leading-none"
            style={{ fontSize: "4.2vh", color: "#0F3D7A", fontWeight: 600 }}
            dir="rtl"
          >
            {parashaHe}
          </span>
        </div>

        {/* 3-column grid */}
        <div className="grid grid-cols-12 gap-[1.6vw] flex-1 min-h-0">

        {/* COLUMN 1 — PARASHA (marquee) */}
        <article
          className="col-span-4 flex flex-col min-h-0 p-[2.4vh_2vh]"
          style={{
            background: "#FFFFFF",
            borderRadius: "20px",
            boxShadow: "0 8px 28px -14px rgba(15,61,122,0.18), 0 0 0 1px rgba(15,61,122,0.04)",
          }}
        >
          <div className="mb-[1.6vh]">
            <p className="uppercase" style={{ fontSize: "1.1vh", letterSpacing: "0.45em", color: "#0F3D7A", fontWeight: 700 }}>
              Étude · Parasha
            </p>
          </div>
          <div
            className="flex-1 min-h-0 overflow-hidden relative"
            style={{
              maskImage: "linear-gradient(to bottom, transparent 0, #000 7%, #000 93%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, transparent 0, #000 7%, #000 93%, transparent 100%)",
            }}
          >
            <div className="tv-marquee-track">
              {[0, 1].map((k) => (
                <div key={k} className="tv-marquee-block" aria-hidden={k === 1}>
                  {PARASHA_INTRO && (
                    <p
                      className="italic mb-[2vh]"
                      style={{ fontFamily: HEADING_FONT_LOCAL, fontSize: "1.95vh", lineHeight: 1.6, color: "#4B5875" }}
                    >
                      {PARASHA_INTRO}
                    </p>
                  )}
                  {PARASHA_BLOCS.map((bloc, i) => (
                    <section key={i} className="mb-[2.4vh] last:mb-0">
                      <p
                        className="uppercase mb-[0.9vh]"
                        style={{ color: "#0F3D7A", fontSize: "1.2vh", letterSpacing: "0.32em", fontWeight: 700 }}
                      >
                        {bloc.icone ? `${bloc.icone} ` : ""}
                        {bloc.titre}
                      </p>
                      {bloc.paragraphes?.map((p, j) => (
                        <p
                          key={j}
                          className="mb-[1vh] last:mb-0"
                          style={{ fontSize: "1.95vh", lineHeight: 1.6, color: "#1A2540", fontWeight: 400 }}
                        >
                          {p}
                        </p>
                      ))}
                      {bloc.puces && (
                        <ul className="mt-[0.8vh] space-y-[0.8vh]">
                          {bloc.puces.map((p, j) => (
                            <li key={j} className="flex gap-[0.8vw] items-start">
                              <span
                                className="shrink-0 mt-[1.05vh] rounded-full"
                                style={{ width: "0.55vh", height: "0.55vh", background: GOLD_LOCAL, boxShadow: `0 0 6px ${GOLD_LOCAL}66` }}
                              />
                              <p style={{ fontSize: "1.9vh", lineHeight: 1.55, color: "#1A2540", fontWeight: 400 }}>
                                {p}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </article>

        {/* COLUMN 2 — ZMANIM */}
        <article
          className="col-span-5 flex flex-col min-h-0 p-[2.4vh_2.4vh]"
          style={{
            background: "#FFFFFF",
            borderRadius: "20px",
            boxShadow: "0 8px 28px -14px rgba(15,61,122,0.18), 0 0 0 1px rgba(15,61,122,0.04)",
          }}
        >
          <div className="flex items-baseline justify-between mb-[1.6vh]">
            <p className="uppercase" style={{ fontSize: "1.1vh", letterSpacing: "0.45em", color: "#0F3D7A", fontWeight: 700 }}>
              Horaires
            </p>
            <p className="capitalize" style={{ fontSize: "1.7vh", color: "#4B5875", fontFamily: HEADING_FONT_LOCAL, fontWeight: 500 }}>
              {todayDateLabel}
            </p>
          </div>

          <div className="flex-1 min-h-0 flex flex-col justify-center divide-y" style={{ borderColor: "rgba(15,61,122,0.06)" }}>
            {todayTimes.length === 0 ? (
              <p className="text-center italic" style={{ fontSize: "1.6vh", color: "#7A869A" }}>
                Horaires indisponibles.
              </p>
            ) : (
              todayTimes.map((t) => {
                const min = toMin(t.value);
                const isPast = min != null && min <= nowMin;
                const isNext = nextZman && t.label === nextZman.label && t.value === nextZman.value;
                const isKey = /entr[ée]|sortie|bougies|havdal|fin du chabbat/i.test(t.label);
                const labelColor = isPast ? "#B0B7C7" : "#1A2540";
                const valueColor = isKey ? GOLD_LOCAL : isPast ? "#B0B7C7" : "#0F3D7A";
                return (
                  <div
                    key={`${t.label}-${t.value}`}
                    className="flex items-baseline justify-between gap-[1vw] py-[1.9vh] transition-colors"
                    style={isNext ? { background: "rgba(212,175,55,0.07)", borderRadius: "12px", padding: "1.9vh 1.2vw" } : undefined}
                  >
                    <span
                      className="uppercase"
                      style={{
                        fontSize: "2.5vh",
                        letterSpacing: "0.16em",
                        fontWeight: isNext || isKey ? 700 : 500,
                        color: labelColor,
                      }}
                    >
                      {t.label}
                    </span>
                    <span
                      className="tabular-nums leading-none"
                      style={{
                        fontSize: isNext ? "5.8vh" : "4.6vh",
                        fontWeight: isKey || isNext ? 700 : 600,
                        color: valueColor,
                        fontFamily: HEADING_FONT_LOCAL,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {t.value}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {(entryTime || exitTime) && (
            <div className="mt-[1.6vh] pt-[1.6vh] grid grid-cols-2 gap-[1vw]" style={{ borderTop: "1px solid rgba(15,61,122,0.08)" }}>
              <div className="text-center rounded-2xl py-[1.2vh]" style={{ background: "rgba(212,175,55,0.08)" }}>
                <p className="uppercase" style={{ fontSize: "1.1vh", letterSpacing: "0.35em", color: "#7A6A2E", fontWeight: 700 }}>
                  Entrée
                </p>
                <p className="tabular-nums mt-[0.4vh]" style={{ fontSize: "3.4vh", color: GOLD_LOCAL, fontFamily: HEADING_FONT_LOCAL, fontWeight: 800 }}>
                  {entryTime ?? "—"}
                </p>
              </div>
              <div className="text-center rounded-2xl py-[1.2vh]" style={{ background: "rgba(212,175,55,0.08)" }}>
                <p className="uppercase" style={{ fontSize: "1.1vh", letterSpacing: "0.35em", color: "#7A6A2E", fontWeight: 700 }}>
                  Sortie
                </p>
                <p className="tabular-nums mt-[0.4vh]" style={{ fontSize: "3.4vh", color: GOLD_LOCAL, fontFamily: HEADING_FONT_LOCAL, fontWeight: 800 }}>
                  {exitTime ?? "—"}
                </p>
              </div>
            </div>
          )}
        </article>

        {/* COLUMN 3 — COMMUNAUTÉ + LIVE */}
        <div className="col-span-3 flex flex-col min-h-0 gap-[1.6vh] h-full">
          {/* Séouda card */}
          <article
            className="flex flex-col p-[2vh] shrink-0"
            style={{
              flexBasis: "38%",
              background: "#FFFFFF",
              borderRadius: "20px",
              boxShadow: "0 8px 28px -14px rgba(15,61,122,0.18), 0 0 0 1px rgba(15,61,122,0.04)",
            }}
          >
            <div className="text-center pb-[1.2vh] mb-[1vh]" style={{ borderBottom: "1px solid rgba(15,61,122,0.08)" }}>
              <p className="uppercase" style={{ fontSize: "1.05vh", letterSpacing: "0.45em", color: "#0F3D7A", fontWeight: 700 }}>
                Communauté
              </p>
              <h3 className="leading-tight mt-[0.6vh]" style={{ fontSize: "2vh", fontFamily: HEADING_FONT_LOCAL, fontWeight: 600, color: "#1A2540" }}>
                La Séouda est offerte par
              </h3>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <AutoScrollVertical className="h-full" speed={20} pause={2400}>
                {DONATIONS_REPAS.length === 0 ? (
                  <p className="italic text-center" style={{ fontSize: "1.5vh", color: "#7A869A" }}>
                    Aucune donation pour le moment.
                  </p>
                ) : (
                  DONATIONS_REPAS.map((d, i) => (
                    <div
                      key={i}
                      className="py-[0.9vh] text-center"
                      style={{ borderBottom: i === DONATIONS_REPAS.length - 1 ? "none" : "1px dashed rgba(15,61,122,0.08)" }}
                    >
                      <p style={{ fontSize: "1.75vh", fontWeight: 600, color: "#1A2540" }}>{d.donateur}</p>
                      {d.dedicace && (
                        <p className="italic mt-[0.2vh]" style={{ fontSize: "1.35vh", color: "#7A869A", fontWeight: 400 }}>
                          {d.dedicace}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </AutoScrollVertical>
            </div>
          </article>

          {/* Live Kotel — or Shabbat static */}
          <div
            className="relative w-full overflow-hidden flex-1 min-h-0"
            style={{
              borderRadius: "20px",
              boxShadow: "0 12px 32px -14px rgba(15,61,122,0.35), 0 0 0 1px rgba(15,61,122,0.06)",
            }}
          >
            {isShabbatNow ? (
              <>
                <img
                  src={kotelShabbat}
                  alt="Kotel — Shabbat Shalom"
                  className="absolute inset-0 w-full h-full object-cover"
                  width={1920}
                  height={1088}
                />
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center text-center"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(10,17,40,0.15) 0%, rgba(10,17,40,0.55) 100%)",
                  }}
                >
                  <p
                    className="font-hebrew leading-none"
                    dir="rtl"
                    style={{
                      fontSize: "6vh",
                      color: GOLD_LOCAL,
                      fontWeight: 700,
                      textShadow: "0 4px 24px rgba(0,0,0,0.55)",
                      letterSpacing: "0.02em",
                    }}
                  >
                    שבת שלום
                  </p>
                  <p
                    className="uppercase mt-[1.2vh]"
                    style={{
                      fontSize: "1.4vh",
                      letterSpacing: "0.5em",
                      color: "rgba(255,255,255,0.9)",
                      fontFamily: HEADING_FONT_LOCAL,
                      fontWeight: 600,
                    }}
                  >
                    Shabbat Shalom
                  </p>
                </div>
              </>
            ) : (
              <>
                <iframe
                  src="https://www.youtube.com/embed/mjM4mYuSt6o?autoplay=1&mute=1&controls=0&rel=0&playsinline=1&enablejsapi=1&modestbranding=1"
                  title="Live Hasdé Tsion"
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full border-0"
                  style={{ opacity: kotelFocused ? 0 : 1, transition: "opacity 400ms ease" }}
                />
                <div
                  className="absolute top-[1vh] left-[1vh] inline-flex items-center gap-[0.5vw] px-[0.9vw] py-[0.5vh] rounded-full backdrop-blur-md"
                  style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.2)" }}
                >
                  <span className="inline-block rounded-full" style={{ width: "0.9vh", height: "0.9vh", background: "#FF3B30", boxShadow: "0 0 8px #FF3B30" }} />
                  <span className="uppercase text-white" style={{ fontSize: "1.05vh", letterSpacing: "0.32em", fontWeight: 700 }}>
                    Live · Hasdé Tsion
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
        </div>
      </section>

      {/* ─── Kotel fullscreen overlay (weekday cycle) ─── */}
      {!isShabbatNow && (
        <div
          className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
          style={{
            opacity: kotelFocused ? 1 : 0,
            transition: "opacity 800ms ease",
          }}
          aria-hidden={!kotelFocused}
        >
          <div
            className="relative overflow-hidden"
            style={{
              width: "82vw",
              aspectRatio: "16 / 9",
              borderRadius: "28px",
              boxShadow:
                "0 40px 120px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)",
              transform: kotelFocused ? "scale(1)" : "scale(0.92)",
              transition: "transform 800ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            {kotelFocused && (
              <iframe
                src="https://www.youtube.com/embed/mjM4mYuSt6o?autoplay=1&mute=1&controls=0&rel=0&playsinline=1&enablejsapi=1&modestbranding=1"
                title="Live Hasdé Tsion — Plein écran"
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0"
              />
            )}
            <div
              className="absolute top-[2vh] left-[2vh] inline-flex items-center gap-[0.6vw] px-[1.2vw] py-[0.7vh] rounded-full backdrop-blur-md"
              style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.2)" }}
            >
              <span className="inline-block rounded-full" style={{ width: "1vh", height: "1vh", background: "#FF3B30", boxShadow: "0 0 10px #FF3B30" }} />
              <span className="uppercase text-white" style={{ fontSize: "1.3vh", letterSpacing: "0.4em", fontWeight: 700 }}>
                Live · Hasdé Tsion
              </span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function ZmanimRowTV({
  label,
  value,
  isPast,
  isNext,
  gold,
}: {
  label: string;
  value: string;
  isPast: boolean;
  isNext: boolean;
  gold: string;
}) {
  const HEADING_FONT = "'Playfair Display', Georgia, serif";
  const labelColor = isNext ? gold : isPast ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.85)";
  const valueColor = isNext ? gold : isPast ? "rgba(255,255,255,0.4)" : "#FFFFFF";
  return (
    <div
      className="flex items-baseline justify-between gap-[1vw] px-[1vw] py-[0.4vh] rounded-lg transition-colors"
      style={
        isNext
          ? {
              background: "rgba(197,160,89,0.06)",
              boxShadow: `inset 0 0 0 0.5px ${gold}55`,
            }
          : undefined
      }
    >
      <span
        className="uppercase"
        style={{
          fontSize: "1.75vh",
          color: labelColor,
          letterSpacing: "0.18em",
          fontWeight: isNext ? 600 : 500,
        }}
      >
        {label}
      </span>
      <span
        className="tabular-nums leading-none"
        style={{
          fontSize: isNext ? "4.4vh" : "3.4vh",
          fontWeight: isNext ? 700 : 400,
          color: valueColor,
          fontFamily: HEADING_FONT,
          letterSpacing: "-0.01em",
          textShadow: isNext ? `0 2px 20px ${gold}44` : "none",
        }}
      >
        {value}
      </span>
    </div>
  );
}

