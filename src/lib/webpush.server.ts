import { buildPushPayload, type PushSubscription } from "@block65/webcrypto-web-push";

type PushRow = { id: string; endpoint: string; p256dh: string; auth: string };

export type PushMessage = { title: string; body: string; url?: string; tag?: string };

/** Envoie une notification à tous les appareils enregistrés. Retourne le nombre d'envois réussis. */
export async function sendPushToAll(message: PushMessage, admin: any): Promise<number> {
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
