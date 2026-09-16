// Texte de la parasha : statique par défaut, remplaçable depuis l'espace admin.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ParashaBloc } from "./weekly-content";
import { PARASHA_NOM, PARASHA_NOM_HE, PARASHA_INTRO, PARASHA_BLOCS } from "./weekly-content";

export type ParashaContent = {
  nom: string;
  nomHe: string;
  intro: string;
  blocs: ParashaBloc[];
};

export const DEFAULT_PARASHA_CONTENT: ParashaContent = {
  nom: "",
  nomHe: PARASHA_NOM_HE,
  intro: PARASHA_INTRO,
  blocs: PARASHA_BLOCS,
};

const CACHE_KEY = "ht-parasha-content";

type Row = {
  id: string;
  nom: string | null;
  nom_he: string | null;
  intro: string | null;
  blocs: unknown;
};

function toContent(row: Row): ParashaContent {
  const blocs = Array.isArray(row.blocs) ? (row.blocs as ParashaBloc[]) : [];
  return {
    nom: row.nom?.trim() || "",
    nomHe: row.nom_he?.trim() || "",
    intro: row.intro?.trim() || "",
    blocs: blocs.length > 0 ? blocs : DEFAULT_PARASHA_CONTENT.blocs,
  };
}

export async function fetchParashaOverride(): Promise<ParashaContent | null> {
  const { data, error } = await supabase
    .from("parasha_content")
    .select("id, nom, nom_he, intro, blocs")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return toContent(data as Row);
}

export function useParashaContent(): ParashaContent {
  const [content, setContent] = useState<ParashaContent>(() => {
    if (typeof window === "undefined") return DEFAULT_PARASHA_CONTENT;
    try {
      const raw = window.localStorage.getItem(CACHE_KEY);
      if (raw) return { ...DEFAULT_PARASHA_CONTENT, ...(JSON.parse(raw) as ParashaContent) };
    } catch {
      /* ignore */
    }
    return DEFAULT_PARASHA_CONTENT;
  });

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const next = await fetchParashaOverride();
      if (!alive || !next) return;
      setContent(next);
      try {
        window.localStorage.setItem(CACHE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    };
    load();
    const id = window.setInterval(load, 15 * 60 * 1000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  return content;
}
