import { useEffect, useRef, useState } from "react";
import { SiteChrome } from "@/components/SiteChrome";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/promesses")({
  head: () => ({
    meta: [
      { title: "Promesses de dons — Hasdé Tsion" },
      {
        name: "description",
        content: "Promesses de dons de la synagogue Hasdé Tsion. Promettez aujourd’hui et réglez au cours de l’année.",
      },
      { property: "og:title", content: "Promesses de dons — Hasdé Tsion" },
      {
        property: "og:description",
        content: "Soutenez Hasdé Tsion avec une promesse de don pour l’année.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PromessesPage,
});

function PromessesPage() {
  const [h, setH] = useState(1600);
  const [ready, setReady] = useState(false);
  const ref = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const on = (e: MessageEvent) => {
      const v = e.data?.promessesHeight;
      if (typeof v === "number" && v > 0) setH(v);
    };
    let raf = 0;
    const send = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const f = ref.current;
        if (!f?.contentWindow) return;
        f.contentWindow.postMessage({ pTop: f.getBoundingClientRect().top, vh: window.innerHeight }, "*");
      });
    };
    window.addEventListener("message", on);
    window.addEventListener("scroll", send, { passive: true });
    window.addEventListener("resize", send);
    const t = setInterval(send, 500);
    return () => {
      window.removeEventListener("message", on);
      window.removeEventListener("scroll", send);
      window.removeEventListener("resize", send);
      clearInterval(t);
    };
  }, []);
  return (
    <main className="chants-page min-h-[100dvh] bg-chant-night text-chant-ink">
      <SiteChrome active="promesses" />
      <iframe
        ref={ref}
        src="/promesses.html?embed=1"
        title="Promesses de dons Hasdé Tsion"
        scrolling="no"
        onLoad={() => setReady(true)}
        style={{
          height: h,
          colorScheme: "dark",
          opacity: ready ? 1 : 0,
          transition: "opacity .9s cubic-bezier(.16,1,.3,1), height .6s cubic-bezier(.16,1,.3,1)",
        }}
        className="relative z-[1] block w-full border-0 bg-transparent"
      />
    </main>
  );
}
