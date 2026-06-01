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
  // À remplir chaque semaine — exemple :
  // { donateur: "Famille Cohen", occasion: "Yahrzeit", dedicace: "à la mémoire de Rav Yossef z.t.l" },
];
