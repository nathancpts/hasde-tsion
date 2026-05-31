import { useEffect } from "react";

/**
 * Polls the root HTML document periodically. If the response signature
 * (ETag / Last-Modified / content hash) changes compared to the first
 * load, a full reload is triggered to bypass cached assets.
 */
export function useVersionCheck(intervalMs = 5 * 60 * 1000) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    let initialSignature: string | null = null;
    let cancelled = false;

    async function hashText(text: string): Promise<string> {
      try {
        const buf = new TextEncoder().encode(text);
        const digest = await crypto.subtle.digest("SHA-256", buf);
        return Array.from(new Uint8Array(digest))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
      } catch {
        // Fallback simple hash
        let h = 0;
        for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
        return String(h);
      }
    }

    async function getSignature(): Promise<string | null> {
      try {
        const url = `/?_v=${Date.now()}`;
        const res = await fetch(url, { cache: "no-store", credentials: "same-origin" });
        if (!res.ok) return null;
        const etag = res.headers.get("etag");
        const lastModified = res.headers.get("last-modified");
        if (etag) return `etag:${etag}`;
        if (lastModified) return `lm:${lastModified}`;
        const text = await res.text();
        return `hash:${await hashText(text)}`;
      } catch {
        return null;
      }
    }

    async function check() {
      if (cancelled || document.hidden) return;
      const sig = await getSignature();
      if (!sig) return;
      if (initialSignature === null) {
        initialSignature = sig;
        return;
      }
      if (sig !== initialSignature) {
        console.info("[version-check] new version detected, reloading…");
        try {
          if ("caches" in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
          }
        } catch {
          /* ignore */
        }
        window.location.reload();
      }
    }

    void check();
    const id = window.setInterval(() => void check(), intervalMs);
    const onVisible = () => {
      if (!document.hidden) void check();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [intervalMs]);
}
