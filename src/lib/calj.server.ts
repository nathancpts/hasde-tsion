// Récupération des horaires officiels du Calendrier Juif (calj.net)
// Localisation : Neuilly-sur-Seine (48°53'N / 2°16'E, Europe/Paris)

const CALJ = "https://www.calj.net";
const CITY_BODY =
  "city=Neuilly-sur-Seine&latdeg=48&latmin=53&latdir=n&londeg=2&lonmin=16&londir=e&timezone=Europe%2FParis&store=0&forwardSuccess=%2Ftile%2Fzmanim";

type Jar = Record<string, string>;

function storeCookies(jar: Jar, res: Response) {
  const raw: string[] =
    typeof (res.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie === "function"
      ? (res.headers as unknown as { getSetCookie: () => string[] }).getSetCookie()
      : ([res.headers.get("set-cookie")].filter(Boolean) as string[]);
  for (const c of raw) {
    const [pair] = c.split(";");
    const idx = pair.indexOf("=");
    if (idx > 0) jar[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim();
  }
}

function cookieHeader(jar: Jar): string {
  return Object.entries(jar)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

async function walk(jar: Jar, url: string, body?: string): Promise<string> {
  let target = url;
  let payload = body;
  for (let i = 0; i < 4; i++) {
    const res: Response = await fetch(target, {
      method: payload ? "POST" : "GET",
      redirect: "manual",
      headers: {
        cookie: cookieHeader(jar),
        "user-agent": "Mozilla/5.0 (compatible; HasdeTsion/1.0)",
        ...(payload ? { "content-type": "application/x-www-form-urlencoded" } : {}),
      },
      body: payload,
    });
    storeCookies(jar, res);
    const loc = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && loc) {
      target = loc.startsWith("http") ? loc : `${CALJ}${loc.startsWith("/") ? "" : "/"}${loc}`;
      payload = undefined;
      continue;
    }
    if (!res.ok) throw new Error(`calj ${res.status}`);
    return await res.text();
  }
  throw new Error("calj: trop de redirections");
}

function toTokens(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "|")
    .replace(/&nbsp;/gi, " ")
    .replace(/&agrave;/gi, "à")
    .replace(/&eacute;/gi, "é")
    .replace(/&egrave;/gi, "è")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, "&")
    .replace(/&#39;/g, "'")
    .replace(/(\|\s*)+/g, "|")
    .trim();
}

function esc(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function pick(tokens: string, label: string, variant?: string): string | null {
  const re = new RegExp(
    esc(label) + "\\|" + (variant ? esc(`(${variant})`) + "\\|" : "(?:\\([^|]*\\)\\|)?") + "(\\d{1,2})h(\\d{2})",
  );
  const m = re.exec(tokens);
  if (!m) return null;
  return `${m[1].padStart(2, "0")}:${m[2]}`;
}

export type CaljZmanim = {
  date: string;
  times: Record<string, string>;
  seasonalHours: { graMin: number; maMin: number } | null;
};

function hourMinToMinutes(v: string | null): number | null {
  if (!v) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(v);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

type CaljResult = Awaited<ReturnType<typeof fetchCaljUncached>>;
const CACHE = new Map<string, { at: number; value: CaljResult }>();
const CACHE_TTL = 60 * 60 * 1000;

/** Horaires du jour + allumage / fin de Chabbat, avec cache mémoire de 6 h */
export async function fetchCalj(date: string): Promise<CaljResult> {
  const hit = CACHE.get(date);
  if (hit && Date.now() - hit.at < CACHE_TTL) return hit.value;
  const value = await fetchCaljUncached(date);
  CACHE.set(date, { at: Date.now(), value });
  return value;
}

async function fetchCaljUncached(date: string): Promise<{
  zmanim: CaljZmanim;
  shabbat: { date: string | null; candles: string | null; havdalah: string | null };
}> {
  const jar: Jar = {};
  // 1) fixe la localisation (Neuilly) et récupère la tuile Zmanim
  let html = await walk(jar, `${CALJ}/useCity.do`, CITY_BODY);

  // 2) positionne la date demandée
  const [y, m, d] = date.split("-").map(Number);
  html = await walk(
    jar,
    `${CALJ}/changeDate.do`,
    `day=${d}&month=${m}&year=${y}&forwardSuccess=%2Ftile%2Fzmanim`,
  );
  const z = toTokens(html);

  const times: Record<string, string> = {};
  const set = (key: string, v: string | null) => {
    if (v) times[key] = v;
  };
  set("Alot haShahar", pick(z, "alot haShaḥar", "Rav Ovadia") ?? pick(z, "alot haShaḥar"));
  set("Misheyakir / Tefilin", pick(z, "début tefilin", "Rav Ovadia") ?? pick(z, "début tefilin"));
  set("Hanetz haHama", pick(z, "hanetz"));
  set('Limite Shema M"A', pick(z, 'limite shéma (M"A)'));
  set('Limite Shema GR"A', pick(z, 'limite shéma (GR"A)'));
  set('Limite Tefila GR"A', pick(z, "limite tefila"));
  set("Hatzot", pick(z, "hhatzot"));
  set("Minha Guedola", pick(z, "minḥa guedola"));
  set("Minha Ketana", pick(z, "minḥa ketana"));
  set("Plag haMinha", pick(z, 'plag haminḥa (GR"A)'));
  const shqi = /shqi[^|]*\|(\d{1,2})h(\d{2})/.exec(z);
  set("Sheqyia", shqi ? `${shqi[1].padStart(2, "0")}:${shqi[2]}` : null);
  set("Sortie des étoiles", pick(z, "tzeit hacokhavim"));
  set("Nuit de R. Tam", pick(z, "nuit Rabenou Tam", "Rav Ovadia") ?? pick(z, "nuit Rabenou Tam"));

  const gra = hourMinToMinutes(pick(z, 'heure saisonnière (GR"A)'));
  const ma = hourMinToMinutes(pick(z, 'heure saisonnière (M"A)'));

  // 3) bloc Shabbat (page d'accueil) : allumage et fin de Chabbat
  let shabbat: { date: string | null; candles: string | null; havdalah: string | null } = {
    date: null,
    candles: null,
    havdalah: null,
  };
  try {
    const home = toTokens(await walk(jar, `${CALJ}/`));
    const sIdx = home.indexOf("Shabbat");
    const chunk = sIdx >= 0 ? home.slice(sIdx, sIdx + 1200) : "";
    const dm = /(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(chunk);
    const hours = [...chunk.matchAll(/(\d{1,2})h(\d{2})/g)].map(
      (mm) => `${mm[1].padStart(2, "0")}:${mm[2]}`,
    );
    shabbat = {
      date: dm ? `${dm[3]}-${dm[2].padStart(2, "0")}-${dm[1].padStart(2, "0")}` : null,
      candles: hours[0] ?? null,
      havdalah: hours[1] ?? null,
    };
  } catch {
    /* le bloc Shabbat est optionnel */
  }

  return {
    zmanim: { date, times, seasonalHours: gra && ma ? { graMin: gra, maMin: ma } : null },
    shabbat,
  };
}
