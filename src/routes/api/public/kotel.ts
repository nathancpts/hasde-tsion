import { createFileRoute } from "@tanstack/react-router";

const PAGE_URL = "https://www.earthcam.com/world/israel/jerusalem/?cam=jerusalem";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";
const UPSTREAM_HEADERS = {
  "User-Agent": UA,
  Referer: "https://www.earthcam.com/",
  Origin: "https://www.earthcam.com",
};
const ALLOWED_HOST = /(^|\.)earthcam\.com$/i;

let master: { url: string; at: number } | null = null;

async function getMasterUrl(): Promise<string | null> {
  if (master && Date.now() - master.at < 4 * 60 * 1000) return master.url;
  const res = await fetch(PAGE_URL, { headers: { "User-Agent": UA, Accept: "text/html" } });
  if (!res.ok) return master?.url ?? null;
  const html = await res.text();
  const m = html.match(/"html5_streamingdomain":"(.*?)","html5_streampath":"(.*?)"/);
  if (!m) return master?.url ?? null;
  const url = (m[1] + m[2]).replace(/\\\//g, "/");
  if (!url.includes(".m3u8")) return master?.url ?? null;
  master = { url, at: Date.now() };
  return url;
}

function proxied(absolute: string) {
  return `/api/public/kotel?u=${encodeURIComponent(absolute)}`;
}

function rewritePlaylist(text: string, base: string) {
  return text
    .split("\n")
    .map((line) => {
      const t = line.trim();
      if (!t) return line;
      if (t.startsWith("#")) {
        return line.replace(/URI="([^"]+)"/g, (_m, uri: string) => {
          try {
            return `URI="${proxied(new URL(uri, base).toString())}"`;
          } catch {
            return _m;
          }
        });
      }
      try {
        return proxied(new URL(t, base).toString());
      } catch {
        return line;
      }
    })
    .join("\n");
}

export const Route = createFileRoute("/api/public/kotel")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const requested = new URL(request.url).searchParams.get("u");
        let target: string | null = requested;

        if (target) {
          let host = "";
          try {
            host = new URL(target).hostname;
          } catch {
            return new Response("Bad request", { status: 400 });
          }
          if (!ALLOWED_HOST.test(host)) return new Response("Forbidden", { status: 403 });
        } else {
          target = await getMasterUrl();
          if (!target) return new Response("Stream unavailable", { status: 503 });
        }

        const get = () =>
          fetch(target!, { headers: UPSTREAM_HEADERS, signal: AbortSignal.timeout(8000) }).catch(() => null);
        let upstream = await get();
        if (!upstream || !upstream.ok) upstream = await get();
        if (!upstream && !requested) {
          master = null;
          target = await getMasterUrl();
          if (target) upstream = await get();
        }
        if (!upstream || !upstream.ok) {
          // Le jeton signé a peut-être expiré : on force un rafraîchissement.
          master = null;
          return new Response("Stream unavailable", { status: 502 });
        }

        const type = upstream.headers.get("content-type") ?? "";
        const isPlaylist = type.includes("mpegurl") || target.includes(".m3u8");

        if (isPlaylist) {
          const body = rewritePlaylist(await upstream.text(), target);
          return new Response(body, {
            headers: {
              "Content-Type": "application/vnd.apple.mpegurl",
              "Cache-Control": "no-store",
              "Access-Control-Allow-Origin": "*",
            },
          });
        }

        return new Response(upstream.body, {
          headers: {
            "Content-Type": type || "video/MP2T",
            "Cache-Control": "public, max-age=30",
            "Access-Control-Allow-Origin": "*",
          },
        });
      },
    },
  },
});
