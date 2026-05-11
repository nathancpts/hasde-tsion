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
        href: "https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;500;600&family=Cormorant:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Noto+Serif+Hebrew:wght@300;400&display=swap",
      },
    ],
  }),
  component: PlanningTV,
});

const tickerItems = [
  "במדבר",
  "Parashat Bamidbar",
  "כ״ח אייר תשפ״ו",
  "28 Iyar 5786",
  "Yom Yeroushalayim",
  "Pirkei Avot · Chapitre 6",
  "Daf Yomi · חולין יד",
];

const yahrtzeit = [
  "Rabbi Yitshak Molko z.t.l",
  "Rabbi Éliyahou Danino z.t.l",
  "Rabbi Chmouël Chlomo Laïner z.t.l",
  "Rabbi Makhlouf Chétrit Baba Yalo z.t.l",
];

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function Ticker() {
  const items = [...tickerItems, ...tickerItems];
  return (
    <div className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
      <div className="flex gap-[60px] whitespace-nowrap animate-ticker text-[clamp(10px,0.75vw,11px)] uppercase tracking-[0.12em] text-[var(--dim)]">
        {items.map((t, i) => (
          <span key={i} className="flex items-center gap-[60px]">
            {t}
            <span className="text-primary opacity-40">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Clock() {
  const now = useClock();
  const time = now ? now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "--:--:--";
  const date = now ? now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) : "";
  return (
    <div className="text-right">
      <div className="font-display text-[clamp(32px,4vw,58px)] font-light leading-none tabular-nums tracking-tight">
        {time}
      </div>
      <div className="text-[clamp(8px,0.6vw,9px)] uppercase tracking-[0.25em] text-[var(--dim)] mt-1">{date}</div>
    </div>
  );
}

function Panel({ children, badge, className = "" }: { children: React.ReactNode; badge?: string; className?: string }) {
  return (
    <article
      className={`relative overflow-hidden rounded-2xl border border-border bg-card p-[clamp(18px,2.2vw,30px)] flex flex-col gap-[clamp(12px,1.4vh,18px)] min-h-0 animate-fade-up ${className}`}
    >
      {badge && (
        <div className="absolute top-3.5 right-4 flex items-center gap-1.5 text-[clamp(7px,0.55vw,8px)] uppercase tracking-[0.22em] font-medium text-[var(--green-live)]">
          <span className="w-[5px] h-[5px] rounded-full bg-[var(--green-live)] animate-pulse-dot" />
          {badge}
        </div>
      )}
      {children}
    </article>
  );
}

function DayHeader({ title, sub, day, heb }: { title?: string; sub?: string; day: string; heb: string }) {
  return (
    <div>
      {title && (
        <div className="text-[clamp(7px,0.55vw,8px)] uppercase tracking-[0.28em] font-medium text-primary mb-1.5">{title}</div>
      )}
      <h2 className="font-display text-[clamp(20px,2.2vw,30px)] font-light leading-none">{day}</h2>
      {sub && (
        <div className="flex flex-wrap items-center gap-2.5 text-[clamp(9px,0.7vw,10px)] uppercase tracking-[0.18em] text-muted-foreground mt-1.5 font-normal">
          {sub.split("·").map((s, i, arr) => (
            <span key={i} className="flex items-center gap-2.5">
              {s.trim()}
              {i < arr.length - 1 && <span className="text-primary/35">·</span>}
            </span>
          ))}
        </div>
      )}
      <div className="font-hebrew text-[clamp(10px,0.8vw,12px)] text-[var(--dim)] mt-1" dir="rtl">{heb}</div>
    </div>
  );
}

function TimeItem({
  label, value, sub, variant = "default", wide = false, valueSize = "lg",
}: {
  label: string; value: string; sub?: string;
  variant?: "default" | "gold" | "red";
  wide?: boolean; valueSize?: "lg" | "sm";
}) {
  const borderBg =
    variant === "gold" ? "border-[var(--gold-line)] bg-[var(--gold-soft)]" :
    variant === "red"  ? "border-[rgba(192,99,90,0.25)] bg-[var(--red-soft)]" :
    "border-[rgba(255,255,255,0.04)] bg-secondary";
  const valueColor =
    variant === "gold" ? "text-primary" :
    variant === "red"  ? "text-[var(--highlight)]" :
    "text-foreground";
  const valueClass = valueSize === "sm"
    ? "font-sans text-[clamp(12px,1.1vw,16px)] font-light"
    : "font-display text-[clamp(22px,2.4vw,34px)] font-light leading-none tracking-tight";
  return (
    <div className={`rounded-[10px] border p-[clamp(10px,1.1vw,15px)_clamp(12px,1.3vw,17px)] flex gap-1 ${borderBg} ${wide ? "col-span-2 flex-row items-center justify-between" : "flex-col justify-between"}`}>
      <div className="text-[clamp(7px,0.55vw,8px)] uppercase tracking-[0.22em] text-[var(--dim)]">{label}</div>
      <div className={`${valueClass} ${valueColor}`}>{value}</div>
      {sub && <div className="text-[clamp(7px,0.5vw,8px)] tracking-[0.1em] text-[var(--dim)]">{sub}</div>}
    </div>
  );
}

function PlanningTV() {
  return (
    <main className="relative z-10 w-screen h-screen grid grid-rows-[auto_auto_1fr_auto] gap-[clamp(16px,2vh,28px)] p-[clamp(20px,2.8vh,40px)_clamp(24px,3vw,52px)]">
      {/* Ambient glows */}
      <div className="fixed pointer-events-none rounded-full blur-[120px] w-[40vw] h-[40vw] -top-[10vh] -left-[5vw] bg-[rgba(201,169,110,0.04)] z-0" />
      <div className="fixed pointer-events-none rounded-full blur-[120px] w-[30vw] h-[30vw] -bottom-[5vh] right-[5vw] bg-[rgba(91,143,201,0.04)] z-0" />

      {/* HEADER */}
      <header className="grid grid-cols-[auto_1fr_auto] items-center gap-8 relative z-10">
        <div className="flex items-center gap-3.5">
          <img src={logo} alt="Hasdé Tsion" className="h-[clamp(40px,4.5vw,64px)] w-auto drop-shadow-[0_0_16px_rgba(201,169,110,0.25)]" />
        </div>
        <Ticker />
        <Clock />
      </header>

      <div className="h-px w-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.04)_20%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.04)_80%,transparent)]" />

      {/* BODY */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-[clamp(12px,1.5vw,20px)] min-h-0">
        {/* VENDREDI */}
        <Panel>
          <DayHeader
            title="Vendredi prochain"
            day="Vendredi 15 mai 2026"
            sub="27 Iyar 5786 · Tahanounim le matin"
            heb="דף יומי: חולין יד"
          />

          <div className="flex items-center justify-between p-[clamp(10px,1.1vw,14px)_clamp(14px,1.5vw,20px)] rounded-[10px] border border-[var(--blue-soft)] bg-[var(--blue-soft)]">
            <div className="text-[clamp(9px,0.7vw,10px)] uppercase tracking-[0.18em] text-accent">Ce soir — Omer</div>
            <div className="flex items-baseline gap-2">
              <div className="font-display text-[clamp(26px,3vw,42px)] font-light leading-none text-accent">42</div>
              <div className="text-[clamp(7px,0.5vw,8px)] uppercase tracking-[0.2em] text-accent/45">jours</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-[clamp(7px,0.8vw,10px)] flex-1 min-h-0">
            <TimeItem wide label="Tehilim du jour" value="79 · 80 · 81" valueSize="sm" />
            <TimeItem wide label="Limite Shema" value="08:54  /  10:03" valueSize="sm" />
            <TimeItem label="Minha" value="19:30" sub="Heure locale" />
            <TimeItem label="Entrée Shabbat" value="21:07" sub="Allumage bougies · Paris" variant="gold" />
          </div>
        </Panel>

        {/* SAMEDI */}
        <Panel badge="Today" className="[animation-delay:80ms]">
          <DayHeader
            day="Samedi 16 mai 2026"
            sub="28 Iyar 5786 · Yom Yeroushalayim · Tsidqatkha"
            heb="דף יומי: חולין טו  ·  יום ירושלים"
          />

          <div className="text-center p-[clamp(12px,1.3vw,18px)] rounded-[10px] border border-[var(--gold-line)] bg-[var(--gold-soft)]">
            <div className="text-[clamp(7px,0.55vw,8px)] uppercase tracking-[0.28em] font-medium text-primary mb-1.5">Paracha de la semaine</div>
            <div className="font-display text-[clamp(18px,2.1vw,28px)] font-normal leading-tight">Bamidbar</div>
            <div className="font-hebrew text-[clamp(12px,1.1vw,15px)] text-primary/60 mt-1" dir="rtl">במדבר</div>
            <div className="inline-flex items-center gap-1.5 mt-2 text-[clamp(8px,0.6vw,9px)] uppercase tracking-[0.15em] text-muted-foreground border border-border rounded-full px-2.5 py-1">
              📖 Pirkei Avot · Chapitre 6
            </div>
          </div>

          <div className="grid grid-cols-2 gap-[clamp(7px,0.8vw,10px)] flex-1 min-h-0">
            <TimeItem wide label="Tehilim du jour" value="82 · 83 · 84 · 85" valueSize="sm" />
            <TimeItem wide label="Limite Shema" value="08:53  /  10:02" valueSize="sm" />
            <TimeItem label="Chaharit" value="09:15" />
            <TimeItem label="Minha" value="20:40" />
            <TimeItem label="Chekia" value="21:25" />
            <TimeItem label="Sortie Shabbat" value="22:26" variant="red" />
          </div>

          <div className="border-t border-[rgba(255,255,255,0.04)] pt-[clamp(10px,1.1vh,14px)] flex flex-col gap-1.5">
            {[
              ["Officiant", "Aharon Djian"],
              ["Cours", "Jacob Elgrably"],
              ["Pirkei Avot · 19h40", "Aharon Djian"],
            ].map(([role, name]) => (
              <div key={role} className="flex justify-between items-center text-[clamp(9px,0.72vw,11px)]">
                <span className="text-[var(--dim)] font-light tracking-[0.08em]">{role}</span>
                <span className="text-accent font-normal tracking-[0.04em]">{name}</span>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      {/* FOOTER */}
      <footer className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-6">
        <div>
          <div className="flex items-center gap-1.5 text-[clamp(7px,0.55vw,8px)] uppercase tracking-[0.25em] font-medium text-primary mb-1.5">
            <span className="animate-flicker">🕯</span> Yahrtzeit · 28 Iyar
          </div>
          <div className="flex flex-wrap gap-y-0.5 gap-x-4">
            {yahrtzeit.map((n) => (
              <span key={n} className="font-display italic font-light text-[clamp(9px,0.72vw,10px)] text-muted-foreground">{n}</span>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <div className="font-hebrew text-[clamp(11px,0.9vw,14px)] text-[var(--dim)]" dir="rtl">ב״יה</div>
          <div className="border border-[var(--gold-line)] rounded-full px-[clamp(14px,1.8vw,22px)] py-[clamp(4px,0.4vw,6px)] text-[clamp(9px,0.7vw,10px)] tracking-[0.1em] text-muted-foreground whitespace-nowrap">
            Séouda offerte par <strong className="text-primary font-medium">LIBRE</strong>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[clamp(7px,0.55vw,8px)] uppercase tracking-[0.25em] text-[var(--dim)] mb-1">Prochaine fête</div>
          <div className="font-display text-[clamp(14px,1.3vw,20px)] font-light text-primary">Chavouot</div>
          <div className="text-[clamp(8px,0.6vw,9px)] tracking-[0.1em] text-[var(--dim)] mt-0.5">Ven. 22 — Sam. 23 mai</div>
        </div>
      </footer>
    </main>
  );
}
