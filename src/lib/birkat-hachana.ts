// Donateurs annuels Birkat Hachana 5787 — noms seuls (jamais de téléphone ni d'e-mail).
import { getCommunityTime, getOverride } from "./zmanim-overrides.ts";

export const BIRKAT_HACHANA_DONORS = [
  "Jonathan Sebbag",
  "Sidney Broutinovski",
  "Bruno Cohen",
  "Raphaël Niddam",
  "Rudy Setti",
  "Julien Seknagi",
  "Gaon Niddam",
  "Avram Niddam",
];

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** Coucher du soleil approximatif à Neuilly-sur-Seine, en minutes heure locale de l'appareil. */
function sunsetMinutes(date: Date): number {
  const lat = 48.885, lng = 2.268;
  const rad = Math.PI / 180;
  const start = new Date(date.getFullYear(), 0, 0);
  const n = Math.floor((+new Date(date.getFullYear(), date.getMonth(), date.getDate()) - +start) / 86400000);
  const g = (2 * Math.PI / 365) * (n - 1 + 0.5);
  const eqt = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const ha = Math.acos(Math.cos(90.833 * rad) / (Math.cos(lat * rad) * Math.cos(decl)) - Math.tan(lat * rad) * Math.tan(decl)) / rad;
  const utc = 720 - 4 * (lng - ha) - eqt;
  return utc - date.getTimezoneOffset();
}

/** Heure d'entrée de Chabbat (minutes) : horaire communiqué, sinon coucher du soleil − 18 min. */
export function candleLightingMinutes(friday: Date): number {
  const key = ymd(friday);
  const t = getCommunityTime(key, "Entrée de Chabbat") || getOverride(key)?.candleLighting;
  return t ? toMin(t) : Math.round(sunsetMinutes(friday) - 18);
}

/**
 * La liste n'est affichée que les jours de lecture de la Torah : lundi, jeudi et Chabbat
 * (du vendredi à l'allumage des bougies jusqu'à la fin du samedi).
 */
export function isBirkatHachanaDay(date: Date): boolean {
  const d = date.getDay();
  if (d === 1 || d === 4 || d === 6) return true;
  if (d === 5) return date.getHours() * 60 + date.getMinutes() >= candleLightingMinutes(date);
  return false;
}
