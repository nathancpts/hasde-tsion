import { createFileRoute } from "@tanstack/react-router";

/**
 * Envoi des notifications programmées par l'espace admin.
 * Appelé régulièrement par le planificateur avec le secret PUSH_CRON_SECRET.
 */
export const Route = createFileRoute("/api/public/hooks/send-scheduled")({
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
        const { sendPushToAll } = await import("@/lib/webpush.server");

        const nowIso = new Date().toISOString();
        const { data: due } = await supabaseAdmin
          .from("announcements")
          .select("id, title, body, url")
          .is("sent_at", null)
          .not("scheduled_at", "is", null)
          .lte("scheduled_at", nowIso)
          .limit(20);

        const results: { id: string; sent: number }[] = [];

        for (const row of due ?? []) {
          // Verrou : on marque l'envoi avant de partir pour éviter les doublons.
          const { data: claimed } = await supabaseAdmin
            .from("announcements")
            .update({ sent_at: nowIso })
            .eq("id", row.id)
            .is("sent_at", null)
            .select("id");
          if (!claimed || claimed.length === 0) continue;

          const sent = await sendPushToAll(
            {
              title: row.title,
              body: row.body,
              url: row.url ?? "/",
              tag: `annonce-${row.id}`,
            },
            supabaseAdmin,
          );
          await supabaseAdmin.from("announcements").update({ sent_count: sent }).eq("id", row.id);
          results.push({ id: row.id, sent });
        }

        return new Response(JSON.stringify({ ok: true, processed: results }), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
