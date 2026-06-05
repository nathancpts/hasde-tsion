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
      "La paracha Beha'alotcha nous enseigne l'allumage de la Ménora par Aharon, la consécration des Léviim, l'organisation du service dans le Michkan, la pureté du camp, les lois du nazir, l'épisode de la sotah, ainsi que la bénédiction des Cohanim.",
    ],
  },
  {
    titre: "Enseignements essentiels",
    icone: "✨",
    puces: [
      "Chaque tribu possède sa mission propre, dans l'unité du peuple d'Israël.",
      "La pureté du camp est la condition de la présence de la Chekhina au milieu de nous.",
      "La téchouva demeure toujours ouverte, même après la faute.",
      "Le nazir nous rappelle l'exigence de maîtrise de soi et d'élévation intérieure.",
      "La bénédiction des Cohanim exprime le désir divin de bénédiction, de protection, de lumière, de grâce et de paix.",
    ],
  },
  {
    titre: "Message central",
    icone: "🕯️",
    paragraphes: [
      "La communauté ne repose pas seulement sur ses structures visibles, mais sur la responsabilité de chacun, la pureté du cœur et la capacité de transformer la fragilité en source de bénédiction.",
      "Beha'alotcha nous enseigne qu'il est toujours possible d'être relevé, réparé et béni.",
    ],
  },
  {
    titre: "Dans l'esprit de nos sages",
    icone: "💬",
    puces: [
      "Rachi relie la sotah et le nazir pour nous inviter à ne pas nous laisser abaisser par la faute d'autrui, mais à nous élever.",
      "Le Rabbi de Loubavitch rappelle que la lumière divine doit se révéler dans le quotidien, dans la maison, le travail et les relations humaines.",
      "Emmanuel Levinas nous rappelle que la Torah est avant tout un appel à la responsabilité, à l'humanité et à la justice.",
    ],
  },
  {
    titre: "Message d'espoir",
    icone: "🕊️",
    paragraphes: [
      "Même après la faute, la distance ou la fragilité, le chemin du relèvement demeure ouvert.",
      "Que ce Shabbat soit pour tous une source de paix, de lumière, de joie et de bénédiction. Shabbat Shalom à toute la communauté du 50. ✨",
    ],
  },
];


export const DONATIONS_REPAS: Donation[] = [
  {
    donateur: "Hazak à la Famille Setti Rudy, qui prend sur elle la paracha Beha'alotcha",
    occasion: "LEILOU NICHMAT",
    dedicace: "DANIÈLE THAMAR ATOU · BAT FORTUNE",
    dedicaceHe: "דניאל תמר אטו · בת פורטונה",
    details: [
      "Que le Saint Béni Soit-Il accorde à la Famille Setti Rudy, ainsi qu'à tous leurs proches, santé, réussite, joie et d'abondantes bénédictions.",
    ],
  },
];

