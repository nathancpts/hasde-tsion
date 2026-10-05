import { useEffect, useState } from "react";
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
  useEffect(() => {
    const on = (e: MessageEvent) => {
      const v = e.data?.promessesHeight;
      if (typeof v === "number" && v > 0) setH(v);
    };
    window.addEventListener("message", on);
    return () => window.removeEventListener("message", on);
  }, []);
  return (
    <main className="chants-page min-h-[100dvh] bg-chant-night text-chant-ink">
      <SiteChrome active="promesses" />
      <iframe
        src="/promesses.html?embed=1"
        title="Promesses de dons Hasdé Tsion"
        scrolling="no"
        style={{ height: h, colorScheme: "dark" }}
        className="relative z-[1] block w-full border-0 bg-transparent"
      />
    </main>
  );
}
