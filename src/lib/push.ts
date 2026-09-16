import { supabase } from "@/integrations/supabase/client";

// Clé publique VAPID (publique par nature — la clé privée reste côté serveur)
export const VAPID_PUBLIC_KEY =
  "BC64VDbUm8gu6vhEPQw8xM0IJw1UW1lFHXzxtz-lfHVnPF1Lac9YN_-14vbeZrF_roHrc0V5tPvwJW_kHkBWPy4";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

function b64(buffer: ArrayBuffer | null): string {
  if (!buffer) return "";
  const bytes = new Uint8Array(buffer);
  let str = "";
  for (const byte of bytes) str += String.fromCharCode(byte);
  return btoa(str);
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch {
    return null;
  }
}

/** Abonne l'appareil aux notifications push et enregistre l'abonnement côté serveur. */
export async function subscribeToPush(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
  if (!("Notification" in window) || Notification.permission !== "granted") return false;

  try {
    const reg = (await navigator.serviceWorker.getRegistration()) ?? (await registerServiceWorker());
    if (!reg) return false;
    await navigator.serviceWorker.ready;

    const existing = await reg.pushManager.getSubscription();
    const sub =
      existing ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      }));

    const p256dh = b64(sub.getKey("p256dh"));
    const auth = b64(sub.getKey("auth"));
    if (!p256dh || !auth) return false;

    const { data: auth_ } = await supabase.auth.getSession();
    const userId = auth_.session?.user?.id ?? null;

    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        endpoint: sub.endpoint,
        p256dh,
        auth,
        user_agent: navigator.userAgent.slice(0, 300),
        ...(userId ? { user_id: userId } : {}),
      },
      { onConflict: "endpoint", ignoreDuplicates: true },
    );

    return !error;
  } catch {
    return false;
  }
}
