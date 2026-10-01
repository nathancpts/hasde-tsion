import { createFileRoute } from "@tanstack/react-router";
import { HomeEntry } from "./index";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Hasdé Tsion — Application" },
      { name: "description", content: "Application Hasdé Tsion : horaires, parasha et vie de la communauté." },
      { property: "og:title", content: "Hasdé Tsion — Application" },
      { property: "og:description", content: "Application Hasdé Tsion : horaires, parasha et vie de la communauté." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HomeEntry,
});
