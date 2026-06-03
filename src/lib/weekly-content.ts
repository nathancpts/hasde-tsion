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

export const PARASHA_NOM = "Beha'alotcha";
export const PARASHA_NOM_HE = "בהעלותך";

export const PARASHA_INTRO =
  "Chers frères et sœurs, en ce saint jour de Shabbat, que la paix divine repose sur vous, voici quelques mots de la paracha de la semaine.";

export const PARASHA_BLOCS: ParashaBloc[] = [
  {
    titre: "Le résumé",
    icone: "📜",
    paragraphes: [
      "Allumage du Menora, service des Lévites, pureté du camp, lois du nazir et de la sotah, et bénédiction des Cohanim à l'inauguration du Michkan.",
    ],
  },
  {
    titre: "L'essentiel",
    icone: "✨",
    puces: [
      "Chaque tribu a sa mission dans l'unité d'Israël.",
      "La pureté permet à la Présence divine de demeurer parmi nous.",
      "La teshouva est toujours possible, même après la faute.",
      "La bénédiction des Cohanim : paix, lumière et grâce divines.",
    ],
  },
  {
    titre: "L'idée à retenir",
    icone: "🕯️",
    paragraphes: [
      "La communauté tient par la responsabilité de chacun. Notre fragilité peut devenir bénédiction : on peut toujours être relevé.",
    ],
  },
  {
    titre: "Message d'espoir",
    icone: "🕊️",
    paragraphes: [
      "Après la faute ou la distance, un chemin de relèvement existe toujours. Shabbat Shalom à toute la communauté du 50.",
    ],
  },
];

export const DONATIONS_REPAS: Donation[] = [
  {
    donateur: "Le Farbrengen sera généreusement offert par la Famille Setti Rudy",
    occasion: "À l’élévation de l’âme de sa très chère Maman",
    dedicace: "LEILOU NICHMAT · DANIELLE THAMAR ATOU · BAT FORTUNE",
    dedicaceHe: "דניאל תמר אטו · בת פורטונה",
    details: [
      "Que cette belle initiative soit une source de mérite pour l’élévation de son âme, et que sa mémoire continue d’être une bénédiction pour sa famille.",
      "Que le Saint Béni Soit-Il accorde à la Famille Setti Rudy ainsi qu’à tous leurs proches santé, réussite, joie et abondantes bénédictions.",
      "Nous vous attendons nombreux pour partager ensemble ce moment de Torah, de chaleur et d’élévation spirituelle.",
      "Chabbat Chalom et bienvenue au Rav ! ✨",
    ],
  },
];
