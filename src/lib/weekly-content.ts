// Contenu hebdomadaire — à mettre à jour chaque semaine.
// Modifier les valeurs ci-dessous pour la nouvelle parasha.

export type ParashaSection = {
  resume: string;
  citation: { texte: string; reference: string };
  question: string;
};

export type Donation = {
  donateur: string;
  occasion?: string;
  dedicace?: string;
};

export const PARASHA_CONTENU: ParashaSection = {
  resume:
    "À compléter — résumé de la parasha de la semaine (Beha'alotcha).",
  citation: {
    texte: "À compléter — verset marquant de la parasha.",
    reference: "Bamidbar —, —",
  },
  question:
    "À compléter — question d'étude / réflexion pour la semaine.",
};

export const DONATIONS_REPAS: Donation[] = [
  // Exemple — remplace par les donateurs réels de la semaine.
  // { donateur: "Famille Cohen", occasion: "Yahrzeit", dedicace: "à la mémoire de Rav Yossef z.t.l" },
];
