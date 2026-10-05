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
  return (
    <iframe
      src="/promesses.html"
      title="Promesses de dons Hasdé Tsion"
      className="block h-dvh w-full border-0 bg-background"
    />
  );
}