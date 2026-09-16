import { createServerFn } from "@tanstack/react-start";

const PAGE_URL = "https://www.earthcam.com/world/israel/jerusalem/?cam=jerusalem";

let cache: { url: string; at: number } | null = null;
const TTL = 5 * 60 * 1000;

/** Récupère l'URL HLS (signée, temporaire) du live EarthCam de Jérusalem. */
export const getKotelStreamUrl = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ url: string | null }> => {
    if (cache && Date.now() - cache.at < TTL) return { url: cache.url };
    try {
      const res = await fetch(PAGE_URL, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
          Accept: "text/html",
        },
      });
      if (!res.ok) return { url: cache?.url ?? null };
      const html = await res.text();
      const m = html.match(
        /"html5_streamingdomain":"(.*?)","html5_streampath":"(.*?)"/,
      );
      if (!m) return { url: cache?.url ?? null };
      const url = (m[1] + m[2]).replace(/\\\//g, "/");
      if (!url.includes(".m3u8")) return { url: cache?.url ?? null };
      cache = { url, at: Date.now() };
      return { url };
    } catch {
      return { url: cache?.url ?? null };
    }
  },
);
