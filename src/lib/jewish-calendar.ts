// Tehillim — cycle mensuel standard (jour du mois hébraïque → chapitres)
const TEHILIM_BY_DAY: Record<number, string> = {
  1: "1–9", 2: "10–17", 3: "18–22", 4: "23–28", 5: "29–34",
  6: "35–38", 7: "39–43", 8: "44–48", 9: "49–54", 10: "55–59",
  11: "60–65", 12: "66–68", 13: "69–71", 14: "72–76", 15: "77–78",
  16: "79–82", 17: "83–87", 18: "88–89", 19: "90–96", 20: "97–103",
  21: "104–105", 22: "106–107", 23: "108–112", 24: "113–118",
  25: "119 (א–ל)", 26: "119 (מ–ת)", 27: "120–134", 28: "135–139",
  29: "140–144", 30: "145–150",
};

export function tehilimForHebDay(day: number): string {
  return TEHILIM_BY_DAY[day] ?? TEHILIM_BY_DAY[Math.min(30, Math.max(1, day))];
}

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function frShort(d: Date): string {
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
}

function frLong(d: Date): string {
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export type LiveWeek = {
  parasha: { fr: string; he: string };
  vendredi: {
    date: string; heb: string; daf: string; omer: number | null;
    tehilim: string; candleLighting: string | null;
  };
  samedi: {
    date: string; heb: string; daf: string; tehilim: string;
    havdalah: string | null;
  };
  events: { date: string; title: string; time?: string; tone?: "gold" | "red" }[];
  fetchedAt: string;
};

// Localisation : 50 Rue du Bois de Boulogne, 92200 Neuilly-sur-Seine
const LOC = { lat: 48.8835, lon: 2.2738, tzid: "Europe/Paris" };

type HebcalItem = {
  title: string;
  date: string;
  category: string;
  hebrew?: string;
  subcat?: string;
  leyning?: { parsha?: string };
  memo?: string;
};

type HebcalResp = { items?: HebcalItem[] };

function nextDow(from: Date, dow: number): Date {
  const d = new Date(from);
  const diff = (dow - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + (diff === 0 ? 0 : diff));
  return d;
}

function timeOnly(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export async function fetchLiveWeek(now = new Date()): Promise<LiveWeek> {
  const friday = nextDow(now, 5);
  const saturday = new Date(friday);
  saturday.setDate(saturday.getDate() + 1);

  const start = ymd(now);
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + 14);
  const end = ymd(endDate);

  // Hebcal calendar — Neuilly-sur-Seine (50 Rue du Bois de Boulogne)
  const calUrl = `https://www.hebcal.com/hebcal?v=1&cfg=json&maj=on&min=on&mod=on&nx=on&mf=on&ss=on&s=on&c=on&latitude=${LOC.lat}&longitude=${LOC.lon}&tzid=${encodeURIComponent(LOC.tzid)}&m=50&F=on&o=on&i=off&start=${start}&end=${end}`;
  const calRes = await fetch(calUrl);
  if (!calRes.ok) throw new Error("Hebcal calendar fetch failed");
  const cal = (await calRes.json()) as HebcalResp;
  const items = cal.items ?? [];

  // Date hébraïque vendredi & samedi
  const [convFri, convSat] = await Promise.all([
    fetch(`https://www.hebcal.com/converter?cfg=json&date=${ymd(friday)}&g2h=1&strict=1`).then(r => r.json()),
    fetch(`https://www.hebcal.com/converter?cfg=json&date=${ymd(saturday)}&g2h=1&strict=1`).then(r => r.json()),
  ]) as [{ hebrew: string; hd: number; hm: string }, { hebrew: string; hd: number; hm: string }];

  // Daf Yomi — extracted from items (separate /dafyomi endpoint is deprecated)
  const dafItem = (d: string) => items.find(it => it.category === "dafyomi" && it.date === d);
  const dafFri = dafItem(ymd(friday));
  const dafSat = dafItem(ymd(saturday));

  // Parasha — fallback to next upcoming parasha if Shabbat is a Yom Tov
  const parashaItem =
    items.find(it => it.category === "parashat" && it.date === ymd(saturday)) ??
    items.find(it => it.category === "parashat");
  const parashaFr = parashaItem?.title?.replace(/^Parashat\s+/i, "") ?? "—";
  const parashaHe = parashaItem?.hebrew?.replace(/^פרשת\s+/, "") ?? "";

  const candle = items.find(it => it.category === "candles" && it.date.startsWith(ymd(friday)));
  const havdal = items.find(it => it.category === "havdalah" && it.date.startsWith(ymd(saturday)));

  const omerFri = items.find(it => it.category === "omer" && it.date === ymd(friday));
  const omerNum = omerFri ? parseInt(omerFri.title.match(/\d+/)?.[0] ?? "0", 10) || null : null;

  const skip = new Set(["candles", "havdalah", "omer", "parashat", "dafyomi", "mishna_yomi", "nach_yomi", "yerushalmi_yomi"]);
  const events = items
    .filter(it => !skip.has(it.category) && it.date >= start)
    .slice(0, 6)
    .map(it => {
      const hasTime = it.date.includes("T");
      const d = new Date(it.date);
      return {
        date: frShort(d),
        title: it.title,
        time: hasTime ? timeOnly(it.date) : undefined,
        tone: /entr|candle/i.test(it.title) ? "gold" as const : /sortie|havdal/i.test(it.title) ? "red" as const : undefined,
      };
    });

  return {
    parasha: { fr: parashaFr, he: parashaHe },
    vendredi: {
      date: frLong(friday),
      heb: convFri.hebrew,
      daf: dafFri ? `Daf Yomi · ${dafFri.hebrew ?? dafFri.title}` : "—",
      omer: omerNum,
      tehilim: tehilimForHebDay(convFri.hd),
      candleLighting: candle ? timeOnly(candle.date) : null,
    },
    samedi: {
      date: frLong(saturday),
      heb: convSat.hebrew,
      daf: dafSat ? `Daf Yomi · ${dafSat.hebrew ?? dafSat.title}` : "—",
      tehilim: tehilimForHebDay(convSat.hd),
      havdalah: havdal ? timeOnly(havdal.date) : null,
    },
    events,
    fetchedAt: new Date().toISOString(),
  };
}

