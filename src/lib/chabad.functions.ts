import { createServerFn } from "@tanstack/react-start";

export type ChabadWeek = {
  friDate: string;      // ISO YYYY-MM-DD
  satDate: string;
  candle: string;       // "21:25"
  havdalah: string;     // "22:47"
};

const MONTHS: Record<string, number> = {
  January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
  July: 7, August: 8, September: 9, October: 10, November: 11, December: 12,
};

function parseEnDate(s: string): string | null {
  // "Friday, May 29, 2026"
  const m = s.match(/(\w+),\s+(\w+)\s+(\d+),\s+(\d{4})/);
  if (!m) return null;
  const mo = MONTHS[m[2]];
  if (!mo) return null;
  return `${m[4]}-${String(mo).padStart(2, "0")}-${String(parseInt(m[3], 10)).padStart(2, "0")}`;
}

export const fetchChabadShabbat = createServerFn({ method: "GET" }).handler(
  async (): Promise<ChabadWeek[]> => {
    const url =
      "https://fr.chabad.org/tools/shared/candlelighting/candlelighting.js.asp?city=1152&ln=2&weeks=8&mid=4194&lang=fr";
    const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
    if (!res.ok) throw new Error(`Chabad fetch ${res.status}`);
    const text = await res.text();

    // Extract date + time pairs in order
    const dateRe = /class="CLdate">\s*([^<]+?)\s*<span/g;
    const timeRe = /class="CLTime">[^<]*?(\d{1,2}:\d{2})\s*</g;
    const dates: string[] = [];
    const times: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = dateRe.exec(text))) dates.push(m[1].trim());
    while ((m = timeRe.exec(text))) times.push(m[1]);

    const weeks: ChabadWeek[] = [];
    for (let i = 0; i + 1 < dates.length && i + 1 < times.length; i += 2) {
      const friDate = parseEnDate(dates[i]);
      const satDate = parseEnDate(dates[i + 1]);
      if (!friDate || !satDate) continue;
      weeks.push({ friDate, satDate, candle: times[i], havdalah: times[i + 1] });
    }
    return weeks;
  },
);
