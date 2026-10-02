import { createFileRoute } from "@tanstack/react-router";
import { ChantsPage } from "@/components/ChantsPage";

export const Route = createFileRoute("/chants")({
  head: () => ({
    meta: [
      { title: "Chants de Sim’hat Torah — Hasdé Tsion" },
      { name: "description", content: "43 chants et piyoutim séfarades avec paroles hébraïques, phonétique, karaoké et mélodies." },
      { property: "og:title", content: "Chants de Sim’hat Torah — Hasdé Tsion" },
      { property: "og:description", content: "Le livret musical Hasdé Tsion : 43 chants, paroles, phonétique et mélodies." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChantsPage,
});