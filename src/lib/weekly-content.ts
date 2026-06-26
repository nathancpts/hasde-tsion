// Contenu hebdomadaire — à mettre à jour chaque semaine.

export type ParashaBloc = {
  titre: string;
  icone?: string;
  paragraphes?: string[];
  puces?: string[];
};

export type Donation = {
  donateur: string;
  occasion?: string;
  dedicace?: string;
  dedicaceHe?: string;
  details?: string[];
};

import { getCurrentParasha } from "./parashot";

const _current = getCurrentParasha();

// Nom translittéré de la parasha en cours (utilisé en fallback de Hebcal)
export const PARASHA_NOM = _current.nom;
// Nom hébreu — laissé vide ; Hebcal fournit la version live
export const PARASHA_NOM_HE = "";

export const PARASHA_INTRO = "";

export const PARASHA_BLOCS: ParashaBloc[] = _current.blocs;


// Date (lundi) de la semaine pour laquelle ces donateurs sont valables.
// Format YYYY-MM-DD. Dès le lundi suivant, la liste se vide automatiquement.
const DONATIONS_WEEK_MONDAY = "2026-06-22";

const _DONATIONS_RAW: Donation[] = [
  {
    donateur: "Avram Niddam",
  },
];

function currentMondayISO(now = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = d.getDay(); // 0 dim … 6 sam
  const diff = (day + 6) % 7; // jours depuis lundi
  d.setDate(d.getDate() - diff);
  return d.toISOString().slice(0, 10);
}

// Vide la liste chaque lundi : si la semaine en cours est postérieure
// à DONATIONS_WEEK_MONDAY, on renvoie un tableau vide.
export const DONATIONS_REPAS: Donation[] =
  currentMondayISO() > DONATIONS_WEEK_MONDAY ? [] : _DONATIONS_RAW;







