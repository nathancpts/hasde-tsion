import { createFileRoute } from "@tanstack/react-router";
import { buildPushPayload, type PushSubscription } from "@block65/webcrypto-web-push";

import { getOverride } from "@/lib/zmanim-overrides";

const LOC = { lat: 48.8835, lon: 2.2738, tzid: "Europe/Paris" };

type PushRow = { id: string; endpoint: string; p256dh: string; auth: string };

function parisParts(now: Date) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: LOC.tzid,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]));
  const hour = Number(parts.hour === "24" ? "0" : parts.hour);
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    weekday: String(parts.weekday), // Mon, Tue, ... Fri
    minutes: hour * 60 + Number(parts.minute),
  };
}

function toMinutes(hhmm: string | undefined | null): number | null {
  if (!hhmm) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function nextDay(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: LOC.tzid,
  });
}

/** Horaires d'entrée/sortie du Chabbat : saisie manuelle en priorité, sinon Hebcal. */
async function shabbatTimes(friday: string): Promise<{ candles: string | null; havdalah: string | null }> {
  const ovFri = getOverride(friday);
  const ovSat = getOverride(nextDay(friday));
  let candles = ovFri?.candleLighting || null;
  let havdalah = ovSat?.havdalah || null;

  if (!candles || !havdalah) {
    try {
      const url =
        `https://www.hebcal.com/hebcal?v=1&cfg=json&maj=on&c=on&m=50&latitude=${LOC.lat}` +
        `&longitude=${LOC.lon}&tzid=${encodeURIComponent(LOC.tzid)}&start=${friday}&end=${nextDay(friday)}`;
      const json = (await fetch(url).then((r) => r.json())) as {
        items?: { category?: string; date?: string }[];
      };
      for (const item of json.items ?? []) {
        if (!item.date) continue;
        if (!candles && item.category === "candles") candles = fmtTime(item.date);
        if (!havdalah && item.category === "havdalah") havdalah = fmtTime(item.date);
      }
    } catch {
      /* ignore : on enverra ce qu'on a */
    }
  }

  return { candles, havdalah };
}

async function sendToAll(
  message: { title: string; body: string; url?: string; tag?: string },
  admin: any,
): Promise<number> {
  const { data } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth");
  const rows = (data ?? []) as PushRow[];
  if (rows.length === 0) return 0;

  const vapid = {
    subject: "mailto:contact@hasde-tsion.com",
    publicKey: process.env["VAPID_PUBLIC_KEY"]!,
    privateKey: process.env["VAPID_PRIVATE_KEY"]!,
  };

  let sent = 0;
  const stale: string[] = [];

  await Promise.all(
    rows.map(async (row) => {
      const subscription: PushSubscription = {
        endpoint: row.endpoint,
        expirationTime: null,
        keys: { p256dh: row.p256dh, auth: row.auth },
      };
      try {
        const payload = await buildPushPayload(
          { data: message, options: { ttl: 4 * 60 * 60, urgency: "high" } },
          subscription,
          vapid,
        );
        const res = await fetch(row.endpoint, {
          method: payload.method,
          headers: payload.headers,
          body: payload.body as unknown as BodyInit,
        });
        if (res.ok) sent += 1;
        else if (res.status === 404 || res.status === 410) stale.push(row.id);
      } catch {
        /* appareil injoignable */
      }
    }),
  );

  if (stale.length > 0) {
    await admin.from("push_subscriptions").delete().in("id", stale);
  }

  return sent;
}

/** Verrou d'unicité : renvoie false si ce message a déjà été envoyé. */
async function claim(key: string, admin: any): Promise<boolean> {
  const { error } = await admin.from("push_log").insert({ key });
  return !error;
}

export const Route = createFileRoute("/api/public/hooks/shabbat-push")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["PUSH_CRON_SECRET"];
        const provided =
          request.headers.get("x-cron-secret") ??
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
          "";
        if (!secret || provided !== secret) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "content-type": "application/json" },
          });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const now = new Date();
        const live = parisParts(now);

        // Mode diagnostic (protégé par le secret) : simule un vendredi / une heure
        let body: { simulateDate?: string; simulateMinutes?: number } = {};
        try {
          body = (await request.json()) as typeof body;
        } catch {
          body = {};
        }
        const date = body.simulateDate ?? live.date;
        const weekday = body.simulateDate ? "Fri" : live.weekday;
        const minutes = typeof body.simulateMinutes === "number" ? body.simulateMinutes : live.minutes;
        const dryRun = Boolean(body.simulateDate || typeof body.simulateMinutes === "number");

        if (weekday !== "Fri") {
          return new Response(JSON.stringify({ skipped: "not-friday", weekday }), {
            headers: { "content-type": "application/json" },
          });
        }

        const { candles, havdalah } = await shabbatTimes(date);
        if (dryRun) {
          const candleMin = toMinutes(candles);
          return new Response(
            JSON.stringify({
              dryRun: true,
              date,
              minutes,
              candles,
              havdalah,
              wouldSendMorning: minutes >= 600 && minutes < 720,
              wouldSendCandles:
                candleMin !== null && minutes >= candleMin - 20 && minutes < candleMin + 10,
            }),
            { headers: { "content-type": "application/json" } },
          );
        }

        const results: Record<string, number | string> = {};

        // 1) Vendredi 10h00 — rappel des horaires de Chabbat
        if (minutes >= 600 && minutes < 720) {
          if (await claim(`morning-${date}`, supabaseAdmin)) {
            const body = candles
              ? `Allumage des bougies à ${candles}${havdalah ? ` · Sortie du Chabbat à ${havdalah}` : ""}. Touchez pour voir tous les horaires.`
              : "Touchez pour voir tous les horaires du Chabbat.";
            results.morning = await sendToAll(
              { title: "Horaires du Chabbat 🕯️", body, url: "/", tag: `morning-${date}` },
              supabaseAdmin,
            );
            await supabaseAdmin
              .from("push_log")
              .update({ sent_count: Number(results.morning) })
              .eq("key", `morning-${date}`);
          } else {
            results.morning = "already-sent";
          }
        }

        // 2) 1 heure avant l'allumage des bougies — rappel
        const candleMin = toMinutes(candles);
        if (candleMin !== null) {
          const targetHour = candleMin - 60;
          if (minutes >= targetHour && minutes < targetHour + 25) {
            if (await claim(`hour-${date}`, supabaseAdmin)) {
              results.hour = await sendToAll(
                {
                  title: "Chabbat dans 1 heure ⏳",
                  body: `Allumage des bougies dans une heure, à ${candles}. Préparez-vous pour Chabbat !`,
                  url: "/",
                  tag: `hour-${date}`,
                },
                supabaseAdmin,
              );
              await supabaseAdmin
                .from("push_log")
                .update({ sent_count: Number(results.hour) })
                .eq("key", `hour-${date}`);
            } else {
              results.hour = "already-sent";
            }
          }
        }

        // 3) 20 minutes avant l'allumage des bougies — Chabbat Chalom
        if (candleMin !== null) {
          const target = candleMin - 20;
          if (minutes >= target && minutes < target + 30) {
            if (await claim(`candles-${date}`, supabaseAdmin)) {
              results.candles = await sendToAll(
                {
                  title: "Chabbat Chalom ! 🕯️",
                  body: `Allumage des bougies dans 20 minutes, à ${candles}. Chabbat Chalom à toute la communauté !`,
                  url: "/",
                  tag: `candles-${date}`,
                },
                supabaseAdmin,
              );
              await supabaseAdmin
                .from("push_log")
                .update({ sent_count: Number(results.candles) })
                .eq("key", `candles-${date}`);
            } else {
              results.candles = "already-sent";
            }
          }
        }

        return new Response(JSON.stringify({ ok: true, date, minutes, candles, havdalah, results }), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
