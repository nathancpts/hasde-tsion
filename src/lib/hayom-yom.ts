import { HAYOM_YOM_DATA, type HayomYomEntry } from "@/data/hayom-yom";

export type HayomYomDay = HayomYomEntry & {
  key: string;
  hebrewDate: string;
  gregorianDate: string;
};

const HEBREW_MONTHS: Record<string, number> = {
  nisan: 1,
  iyar: 2,
  sivan: 3,
  tamuz: 4,
  tammuz: 4,
  av: 5,
  elul: 6,
  tishri: 7,
  tishrei: 7,
  heshvan: 8,
  cheshvan: 8,
  marcheshvan: 8,
  kislev: 9,
  tevet: 10,
  shevat: 11,
  adar: 12,
  "adar i": 12,
  "adar 1": 12,
  "adar ii": 13,
  "adar 2": 13,
};

const MONTHS_FR: Record<number, string> = {
  1: "Nissan", 2: "Iyar", 3: "Sivan", 4: "Tamouz", 5: "Av", 6: "Eloul",
  7: "Tichri", 8: "Hechvan", 9: "Kislev", 10: "Tévèt", 11: "Chevat",
  12: "Adar I", 13: "Adar II",
};

function isHebrewLeapYear(year: number): boolean {
  return [0, 3, 6, 8, 11, 14, 17].includes(year % 19);
}

function hebrewParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-u-ca-hebrew", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  }).formatToParts(date);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const rawMonth = parts.find((part) => part.type === "month")?.value.toLowerCase() ?? "";
  const month = HEBREW_MONTHS[rawMonth];
  if (!day || !year || !month) return null;
  return { day, month, year };
}

function combineEntries(primary: HayomYomEntry, secondary?: HayomYomEntry): HayomYomEntry {
  if (!secondary) return primary;
  return {
    fr: [primary.fr, secondary.fr].filter(Boolean).join("\n\n"),
    he: [primary.he, secondary.he].filter(Boolean).join("\n\n"),
  };
}

export function getHayomYom(date = new Date()): HayomYomDay | null {
  const hebrew = hebrewParts(date);
  if (!hebrew) return null;
  const key = `${hebrew.day}-${hebrew.month}`;
  const entry = HAYOM_YOM_DATA[key];
  if (!entry) return null;

  const merged = hebrew.month === 12 && !isHebrewLeapYear(hebrew.year)
    ? combineEntries(entry, HAYOM_YOM_DATA[`${hebrew.day}-13`])
    : entry;

  return {
    ...merged,
    key,
    hebrewDate: `${hebrew.day} ${MONTHS_FR[hebrew.month]} ${hebrew.year}`,
    gregorianDate: date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Europe/Paris",
    }),
  };
}
