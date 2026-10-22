// API publique en lecture seule : toutes les données affichées sur la page /TV.
// Mêmes sources et fonctions que la page (zmanim Hebcal/Calj, overrides communauté,
// Hayom Yom, parasha_content, séouda, live du Kotel). Chaque section est isolée :
// en cas d'erreur sur une source, le champ vaut null plutôt que de faire échouer
// toute la réponse.
import { createFileRoute } from "@tanstack/react-router";
import { fetchZmanim, fetchLiveWeek } from "@/lib/jewish-calendar";
import { getCommunitySchedule } from "@/lib/zmanim-overrides";
import { getCurrentParasha, getHolidayParasha } from "@/lib/parashot";
import { fetchParashaOverride, DEFAULT_PARASHA_CONTENT } from "@/lib/parasha-content";
import { DONATIONS_REPAS } from "@/lib/weekly-content";
import { getHayomYom } from "@/lib/hayom-yom";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
  "Cache-Control": "public, max-age=60",
} as const;

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function hebrewHe(date: Date): string {
  return new Intl.DateTimeFormat("he-u-ca-hebrew", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  }).format(date);
}

/** Vendredi du Shabbat courant/à venir (même logique que fetchLiveWeek). */
function fridayOfWeek(now: Date): Date {
  const friday = now.getDay() === 6 ? new Date(now) : (() => {
    const d = new Date(now);
    const diff = (5 - d.getDay() + 7) % 7;
    d.setDate(d.getDate() + diff);
    return d;
  })();
  if (now.getDay() === 6) friday.setDate(friday.getDate() - 1);
  return friday;
}

async function safe<T>(fn: () => Promise<T> | T): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

async function buildPayload() {
  const now = new Date();

  // ---- Zmanim du jour (Hebcal + Calj + overrides communauté) ----
  const zmanim = await safe(() => fetchZmanim(now));

  // ---- Parasha de la semaine (override admin sinon cycle local) ----
  const parasha = await safe(async () => {
    const local = getHolidayParasha(now) ?? getCurrentParasha(now);
    const override = await fetchParashaOverride().catch(() => null);
    const nom = override?.nom || local.nom;
    return {
      nom,
      nomHe: override?.nomHe || DEFAULT_PARASHA_CONTENT.nomHe || "",
      intro: override?.intro || DEFAULT_PARASHA_CONTENT.intro || "",
      blocs: override?.blocs?.length ? override.blocs : local.blocs,
    };
  });

  // ---- Shabbat : les 4 prochaines semaines ----
  const shabbat = await safe(async () => {
    const firstFriday = fridayOfWeek(now);
    const weeks = [];
    for (let i = 0; i < 4; i++) {
      const fri = new Date(firstFriday);
      fri.setDate(fri.getDate() + i * 7);
      const sat = new Date(fri);
      sat.setDate(sat.getDate() + 1);
      const week = await fetchLiveWeek(fri);
      weeks.push({
        friDate: ymd(fri),
        satDate: ymd(sat),
        candle: week.vendredi.candleLighting,
        havdalah: week.samedi.havdalah,
      });
    }
    return weeks;
  });

  // ---- Offices : programme du jour + 7 prochains jours ----
  const offices = await safe(() => {
    const todaySchedule = getCommunitySchedule(ymd(now));
    const prochains: Record<string, { times: { label: string; value: string }[]; message?: string }> = {};
    for (let i = 1; i <= 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      const key = ymd(d);
      const schedule = getCommunitySchedule(key);
      if (schedule) {
        prochains[key] = { times: schedule.times, ...(schedule.message ? { message: schedule.message } : {}) };
      }
    }
    return {
      aujourdhui: todaySchedule?.times ?? [],
      prochains,
    };
  });

  // ---- Hayom Yom du jour ----
  const hayomYom = await safe(() => {
    const entry = getHayomYom(now);
    return entry ? { fr: entry.fr, he: entry.he } : null;
  });

  // ---- Séouda de la semaine ----
  const seouda = await safe(() =>
    DONATIONS_REPAS.map((d) => ({ donateur: d.donateur, occasion: d.occasion ?? null })),
  );

  return {
    generatedAt: new Date().toISOString(),
    date: {
      gregorian: ymd(now),
      hebrew: zmanim?.heb ?? null,
      hebrewHe: await safe(() => hebrewHe(now)),
      parasha: parasha?.nom ?? null,
      parashaHe: parasha?.nomHe ?? null,
    },
    zmanim: zmanim ? zmanim.times.map((z) => ({ label: z.label, time: z.value })) : null,
    shabbat,
    offices,
    parasha,
    hayomYom,
    seouda,
    kotel: { liveUrl: "/api/public/kotel" },
    tahanoun: zmanim ? { recited: zmanim.tahanun.recited, reason: zmanim.tahanun.reason } : null,
  };
}

export const Route = createFileRoute("/api/public/tv")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),

      GET: async () => {
        try {
          const payload = await buildPayload();
          return new Response(JSON.stringify(payload), {
            status: 200,
            headers: { "Content-Type": "application/json", ...CORS_HEADERS },
          });
        } catch (error) {
          return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : "Erreur interne" }),
            { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
          );
        }
      },
    },
  },
});
