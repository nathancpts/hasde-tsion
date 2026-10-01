import { createFileRoute } from "@tanstack/react-router";
import { HomeEntry } from "./index";

export const Route = createFileRoute("/tv")({
  head: () => ({
    meta: [
      { title: "Hasdé Tsion — Écran TV" },
      { name: "description", content: "Affichage TV de la synagogue Hasdé Tsion : horaires, parasha et live." },
      { property: "og:title", content: "Hasdé Tsion — Écran TV" },
      { property: "og:description", content: "Affichage TV de la synagogue Hasdé Tsion : horaires, parasha et live." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HomeEntry,
});
