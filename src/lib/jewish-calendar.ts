import { getOverride } from "./zmanim-overrides";
import { getYahrtzeits, frenchHebMonth } from "./yahrtzeits";
import { getCurrentParasha, getHolidayParasha } from "./parashot";


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
    hd: number; hm: string; yahrtzeits: string[];
  };
  samedi: {
    date: string; heb: string; daf: string; tehilim: string;
    havdalah: string | null;
    hd: number; hm: string; yahrtzeits: string[];
  };
  roshHodesh: {
    nom: string;            // ex: "Tamouz"
    dateLabel: string;      // ex: "dim. 14 soir · lun. 15 – mar. 16 juin"
    moladHe?: string;       // ex: "מולד : lun., ש 90 ד 46 ח 16"
  } | null;
  events: { date: string; title: string; time?: string; tone?: "gold" | "red" }[];
  fetchedAt: string;
};


// Localisation : 50 Rue du Bois de Boulogne, 92200 Neuilly-sur-Seine
const DEFAULT_LOC = { lat: 48.8835, lon: 2.2738, tzid: "Europe/Paris" };
export type GeoLoc = { lat: number; lon: number; tzid?: string };

export type Zman = { label: string; value: string };
export type Zmanim = {
  date: string;
  heb: string;
  times: Zman[];
  seasonalHours: { graMin: number; maMin: number } | null;
  mishnaYomi: { fr: string; he: string } | null;
  yerushalmiYomi: { fr: string; he: string } | null;
  tahanun: { recited: boolean; reason: string };
  birkatLevana: { start: string; end: string } | null;
  fetchedAt: string;
};

function timeFR(iso: string | undefined | null, tz: string = DEFAULT_LOC.tzid): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: tz });
}

function diffMin(aIso?: string | null, bIso?: string | null): number | null {
  if (!aIso || !bIso) return null;
  return Math.round((new Date(bIso).getTime() - new Date(aIso).getTime()) / 60000);
}

function fmtHourMin(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}min` : `${m}min`;
}

export async function fetchZmanim(now = new Date(), loc?: GeoLoc): Promise<Zmanim> {
  const LOC = { ...DEFAULT_LOC, ...(loc ?? {}) };
  const date = ymd(now);

  const [zRes, convRes, calRes] = await Promise.all([
    fetch(`https://www.hebcal.com/zmanim?cfg=json&latitude=${LOC.lat}&longitude=${LOC.lon}&tzid=${encodeURIComponent(LOC.tzid)}&date=${date}`).then(r => r.json()),
    fetch(`https://www.hebcal.com/converter?cfg=json&date=${date}&g2h=1&strict=1`).then(r => r.json()),
    fetch(`https://www.hebcal.com/hebcal?v=1&cfg=json&maj=on&min=on&mod=on&mf=on&ss=on&myomi=on&yyomi=on&latitude=${LOC.lat}&longitude=${LOC.lon}&tzid=${encodeURIComponent(LOC.tzid)}&start=${date}&end=${date}`).then(r => r.json()),
  ]) as [{ times: Record<string, string | null> }, { hebrew: string; hy: number; hm: string }, HebcalResp];

  const t = zRes.times ?? {};

  // Heures saisonnières : 1/12 de la journée
  const graSpan = diffMin(t.sunrise, t.sunset);
  const maSpan = diffMin(t.alotHaShachar, t.tzeit72min);
  const seasonalHours = graSpan && maSpan
    ? { graMin: Math.round(graSpan / 12), maMin: Math.round(maSpan / 12) }
    : null;

  const ov = getOverride(date);
  const times: Zman[] = ov ? [
    { label: "Hatzot Laïla",        value: ov.hatzotLaila },
    { label: "Alot haShahar",       value: ov.alotHaShahar },
    { label: "Misheyakir / Tefilin", value: ov.misheyakir },
    { label: "Hanetz haHama",       value: ov.hanetz },
    { label: "Limite Shema M\"A",   value: ov.shemaMA },
    { label: "Limite Shema GR\"A",  value: ov.shemaGRA },
    { label: "Limite Tefila M\"A",  value: ov.tefilaMA },
    { label: "Limite Tefila GR\"A", value: ov.tefilaGRA },
    { label: "Hatzot",              value: ov.hatzot },
    { label: "Minha Guedola",       value: ov.minhaGedola },
    { label: "Minha Ketana",        value: ov.minhaKetana },
    { label: "Plag haMinha",        value: ov.plagHaMinha },
    { label: "Sheqyia",             value: ov.sheqyia },
    { label: "Sortie des étoiles",  value: ov.tzeit },
    { label: "Nuit de R. Tam",      value: ov.rTam },
  ] : [
    // Repli automatique sur les horaires calculés (Hebcal) si aucune saisie manuelle
    { label: "Hatzot Laïla",        value: timeFR(t.chatzotNight, LOC.tzid) },
    { label: "Alot haShahar",       value: timeFR(t.alotHaShachar, LOC.tzid) },
    { label: "Misheyakir / Tefilin", value: timeFR(t.misheyakir, LOC.tzid) },
    { label: "Hanetz haHama",       value: timeFR(t.sunrise, LOC.tzid) },
    { label: "Limite Shema M\"A",   value: timeFR(t.sofZmanShmaMGA, LOC.tzid) },
    { label: "Limite Shema GR\"A",  value: timeFR(t.sofZmanShma, LOC.tzid) },
    { label: "Limite Tefila M\"A",  value: timeFR(t.sofZmanTfillaMGA, LOC.tzid) },
    { label: "Limite Tefila GR\"A", value: timeFR(t.sofZmanTfilla, LOC.tzid) },
    { label: "Hatzot",              value: timeFR(t.chatzot, LOC.tzid) },
    { label: "Minha Guedola",       value: timeFR(t.minchaGedola, LOC.tzid) },
    { label: "Minha Ketana",        value: timeFR(t.minchaKetana, LOC.tzid) },
    { label: "Plag haMinha",        value: timeFR(t.plagHaMincha, LOC.tzid) },
    { label: "Sheqyia",             value: timeFR(t.sunset, LOC.tzid) },
    { label: "Sortie des étoiles",  value: timeFR(t.tzeit85deg ?? t.tzeit7083deg, LOC.tzid) },
    { label: "Nuit de R. Tam",      value: timeFR(t.tzeit72min, LOC.tzid) },
  ].filter(z => z.value !== "—");

  // Minha de la communauté : TOUJOURS 40 minutes avant la Chekia
  const sheqyiaZ = times.find(z => z.label === "Sheqyia");
  if (sheqyiaZ) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(sheqyiaZ.value);
    if (m) {
      const total = Number(m[1]) * 60 + Number(m[2]) - 40;
      const minhaValue = `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
      const idx = times.findIndex(z => z.label === "Minha Ketana");
      const minha: Zman = { label: "Minha", value: minhaValue };
      if (idx >= 0) times[idx] = minha;
      else times.splice(times.indexOf(sheqyiaZ), 0, minha);
    }
  }

  // Toujours afficher les horaires par ordre chronologique
  const toMin = (v: string) => {
    const m = /^(\d{1,2}):(\d{2})/.exec(v);
    return m ? Number(m[1]) * 60 + Number(m[2]) : 9999;
  };
  times.sort((a, b) => toMin(a.value) - toMin(b.value));



  // Mishna Yomi & Yerushalmi Yomi du jour
  const calItems = calRes.items ?? [];
  const mItem = calItems.find(it => it.category === "mishnayomi" || it.category === "mishna_yomi");
  const yItem = calItems.find(it => it.category === "yerushalmi" || it.category === "yerushalmi_yomi");
  const mishnaYomi = mItem ? { fr: mItem.title, he: mItem.hebrew ?? "" } : null;
  const yerushalmiYomi = yItem ? { fr: yItem.title, he: yItem.hebrew ?? "" } : null;

  // Tahanun — pas récité si Shabbat, Rosh Hodesh ou fête (major/minor/modern)
  const noTahanunItem = calItems.find(it =>
    it.category === "roshchodesh" ||
    (it.category === "holiday" && ["major", "minor", "modern"].includes(it.subcat ?? ""))
  );
  const isShabbat = now.getDay() === 6;
  const tahanun = isShabbat
    ? { recited: false, reason: "Shabbat — Tsidqatkha" }
    : noTahanunItem
      ? { recited: false, reason: noTahanunItem.title }
      : { recited: true, reason: "Tahanounim récités" };

  // Bircat HaLevana — fenêtre approchée : du 7 au 15 du mois hébraïque
  let birkatLevana: { start: string; end: string } | null = null;
  try {
    const h2g = (hd: number) =>
      fetch(`https://www.hebcal.com/converter?cfg=json&hy=${convRes.hy}&hm=${encodeURIComponent(convRes.hm)}&hd=${hd}&h2g=1&strict=1`).then(r => r.json()) as Promise<{ gy: number; gm: number; gd: number }>;
    const [s, e] = await Promise.all([h2g(7), h2g(15)]);
    const fmt = (g: { gy: number; gm: number; gd: number }) =>
      new Date(Date.UTC(g.gy, g.gm - 1, g.gd)).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    birkatLevana = { start: fmt(s), end: fmt(e) };
  } catch { /* ignore */ }

  return {
    date: frLong(now),
    heb: convRes.hebrew,
    times,
    seasonalHours,
    mishnaYomi,
    yerushalmiYomi,
    tahanun,
    birkatLevana,
    fetchedAt: new Date().toISOString(),
  };
}

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

function timeOnly(iso: string, tz: string = DEFAULT_LOC.tzid): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: tz });
}

export async function fetchLiveWeek(now = new Date(), loc?: GeoLoc): Promise<LiveWeek> {
  const LOC = { ...DEFAULT_LOC, ...(loc ?? {}) };
  const friday = nextDow(now, 5);
  const saturday = new Date(friday);
  saturday.setDate(saturday.getDate() + 1);

  const start = ymd(now);
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + 14);
  const end = ymd(endDate);

  // Hebcal calendar — localisation dynamique (par défaut : 50 Rue du Bois de Boulogne, Neuilly)
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

  // Parasha — utilise l'override local quand le Shabbat est une fête (Yom Tov)
  const parashaItem = items.find(it => it.category === "parashat" && it.date === ymd(saturday));
  const localParasha = getCurrentParasha(now);
  const holidayParasha = getHolidayParasha(now);
  const parashaFr = holidayParasha
    ? holidayParasha.nom
    : (parashaItem?.title?.replace(/^Parashat\s+/i, "") ?? localParasha.nom);
  const parashaHe = holidayParasha ? "" : (parashaItem?.hebrew?.replace(/^פרשת\s+/, "") ?? "");

  const candle = items.find(it => it.category === "candles" && it.date.startsWith(ymd(friday)));
  const havdal = items.find(it => it.category === "havdalah" && it.date.startsWith(ymd(saturday)));

  const omerFri = items.find(it => it.category === "omer" && it.date === ymd(friday));
  const omerNum = omerFri ? parseInt(omerFri.title.match(/\d+/)?.[0] ?? "0", 10) || null : null;

  const skip = new Set(["candles", "havdalah", "omer", "parashat", "dafyomi", "mishna_yomi", "nach_yomi", "yerushalmi_yomi"]);
  const todayStr = ymd(now);
  const events = items
    .filter(it => {
      if (skip.has(it.category)) return false;
      // All-day events: date is "YYYY-MM-DD" — must be today or later
      // Timed events: must be strictly in the future
      if (it.date.includes("T")) return new Date(it.date).getTime() >= now.getTime();
      return it.date >= todayStr;
    })
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

  // ===== Rosh Ḥodesh à venir =====
  const todayDateStr = ymd(now);
  const rhItems = items
    .filter(it => it.category === "roshchodesh" && it.date >= todayDateStr)
    .slice(0, 2);
  let roshHodesh: LiveWeek["roshHodesh"] = null;
  if (rhItems.length > 0) {
    // ex. "Rosh Chodesh Tamuz"
    const nameRaw = rhItems[0].title.replace(/^Rosh Chodesh\s+/i, "").trim();
    const nom = frenchHebMonth(nameRaw);
    const firstDate = new Date(rhItems[0].date + "T00:00:00");
    const lastDate = new Date(rhItems[rhItems.length - 1].date + "T00:00:00");
    const evening = new Date(firstDate);
    evening.setDate(evening.getDate() - 1);
    const fmtDayMonth = (d: Date) =>
      d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" }).replace(/\.$/, "");
    const fmtDay = (d: Date) =>
      d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });
    const dateLabel = rhItems.length === 2
      ? `${fmtDay(evening)} soir · ${fmtDay(firstDate)} – ${fmtDayMonth(lastDate)}`
      : `${fmtDay(evening)} soir · ${fmtDayMonth(firstDate)}`;
    const moladItem = items.find(it => it.category === "molad");
    const moladHe = moladItem?.title ? `Molad : ${moladItem.title.replace(/^Molad\s+\S+:\s*/i, "")}` : undefined;
    roshHodesh = { nom, dateLabel, moladHe };
  }

  return {
    parasha: { fr: parashaFr, he: parashaHe },
    vendredi: {
      date: frLong(friday),
      heb: convFri.hebrew,
      daf: dafFri ? `Daf Yomi · ${dafFri.hebrew ?? dafFri.title}` : "—",
      omer: omerNum,
      tehilim: tehilimForHebDay(convFri.hd),
      candleLighting: getOverride(ymd(friday))?.candleLighting || (candle ? timeOnly(candle.date) : null),
      hd: convFri.hd,
      hm: convFri.hm,
      yahrtzeits: getYahrtzeits(convFri.hd, convFri.hm),
    },
    samedi: {
      date: frLong(saturday),
      heb: convSat.hebrew,
      daf: dafSat ? `Daf Yomi · ${dafSat.hebrew ?? dafSat.title}` : "—",
      tehilim: tehilimForHebDay(convSat.hd),
      havdalah: getOverride(ymd(saturday))?.havdalah || (havdal ? timeOnly(havdal.date) : null),
      hd: convSat.hd,
      hm: convSat.hm,
      yahrtzeits: getYahrtzeits(convSat.hd, convSat.hm),
    },
    roshHodesh,
    events,
    fetchedAt: new Date().toISOString(),
  };
}


