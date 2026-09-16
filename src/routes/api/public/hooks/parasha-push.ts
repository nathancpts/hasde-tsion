import { createFileRoute } from "@tanstack/react-router";
import { buildPushPayload, type PushSubscription } from "@block65/webcrypto-web-push";

import { getCurrentParasha } from "@/lib/parashot";

const TZ = "Europe/Paris";

type PushRow = { id: string; endpoint: string; p256dh: string; auth: string };

function parisParts(now: Date) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
  const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    weekday: String(parts.weekday), // Sun, Mon, …
  };
}

async function sendToAll(
  message: { title: string; body: string; url?: string; tag?: string },
  admin: any,
): Promise<number> {
  const { data } = await admin.from("push_subscriptions").select("id, endpoint, p256dh, auth");
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
          { data: message, options: { ttl: 12 * 60 * 60, urgency: "normal" } },
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

  if (stale.length > 0) await admin.from("push_subscriptions").delete().in("id", stale);
  return sent;
}

/** Nom de la parasha : texte saisi par l'admin en priorité, sinon calcul automatique. */
async function parashaName(admin: any, now: Date): Promise<string> {
  const { data } = await admin
    .from("parasha_content")
    .select("nom")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const custom = (data?.nom ?? "").trim();
  return custom || getCurrentParasha(now).nom;
}

export const Route = createFileRoute("/api/public/hooks/parasha-push")({
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

        let body: { force?: boolean } = {};
        try {
          body = (await request.json()) as typeof body;
        } catch {
          body = {};
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const now = new Date();
        const { date, weekday } = parisParts(now);

        if (weekday !== "Sun" && !body.force) {
          return new Response(JSON.stringify({ skipped: "not-sunday", weekday }), {
            headers: { "content-type": "application/json" },
          });
        }

        const key = `parasha-${date}`;
        const { error: claimError } = await supabaseAdmin.from("push_log").insert({ key });
        if (claimError) {
          return new Response(JSON.stringify({ skipped: "already-sent", key }), {
            headers: { "content-type": "application/json" },
          });
        }

        const nom = await parashaName(supabaseAdmin, now);
        const sent = await sendToAll(
          {
            title: `📜 Parasha ${nom}`,
            body: `Le texte de la parasha de la semaine est disponible. Bonne étude !`,
            url: "/",
            tag: key,
          },
          supabaseAdmin,
        );
        await supabaseAdmin.from("push_log").update({ sent_count: sent }).eq("key", key);

        return new Response(JSON.stringify({ ok: true, date, nom, sent }), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
