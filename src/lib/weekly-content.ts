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


export const DONATIONS_REPAS: Donation[] = [
  {
    donateur: "Hazak aux Familles",
    occasion: "Qui prennent sur elles la Parachat Chela'h Lekha ✨",
    details: [
      "Meimoun Mike, Sfedj Michael, Ghrenassia Philipe, Mimouni Bryan, Niddam Raphael, Zarhi Rudy, Danan Marvin, Elgrably Jacob, Niddam Avram",
    ],
  },
];






