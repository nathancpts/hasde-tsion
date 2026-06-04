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
    titre: "Le résumé, selon nos Sages",
    icone: "📜",
    paragraphes: [
      "La paracha Beha'alotcha nous enseigne l'allumage des chandeliers du Menora par Aharon, l'organisation du service des Lévites dans le Michkan, la pureté requise dans le camp, le chemin de réparation après la faute, l'histoire de la femme soupçonnée (sotah), les lois du nazir, et la magnifique bénédiction des Cohanim que les chefs de tribus ont prononcée à l'inauguration du Michkan.",
    ],
  },
  {
    titre: "Les enseignements essentiels",
    icone: "✨",
    puces: [
      "Chaque tribu a sa mission particulière, dans l'unité d'Israël et le respect de sa singularité.",
      "La pureté du camp est fondamentale, afin que la Présence Divine puisse demeurer parmi nous.",
      "La réparation (teshouva) est toujours possible, même après la faute.",
      "Le nazir nous enseigne la maîtrise de soi : voir la chute d'autrui doit nous élever, non nous abaisser.",
      "La bénédiction des Cohanim est le cœur de la paracha : que Dieu nous bénisse et nous garde, fasse briller Sa lumière sur nous, nous soit gracieux, nous tourne Sa face, et nous donne la paix.",
    ],
  },
  {
    titre: "L'idée fondamentale à retenir",
    icone: "🕯️",
    paragraphes: [
      "La communauté ne tient pas seulement par ses structures extérieures, mais par la responsabilité de chacun, la purification du cœur, et la capacité de transformer notre fragilité en bénédiction.",
      "Beha'alotcha nous dit clairement : on peut toujours être relevé, réparé, béni.",
    ],
  },
  {
    titre: "Rachi, le Rabbi de Lubavitch et Emmanuel Levinas",
    icone: "💬",
    puces: [
      "Rachi met en lien le nazir et la sotah : voir la chute morale d'autrui doit éveiller notre conscience et nous pousser à nous élever, pas à nous juger.",
      "Le Rabbi insiste : la vraie bénédiction est de faire descendre la lumière divine dans la vie quotidienne — dans la maison, le travail, les relations, chaque instant.",
      "Levinas rappelle que la Torah est avant tout éthique : elle nous appelle à répondre à l'autre avec responsabilité, humanité et justice.",
    ],
  },
  {
    titre: "Message d'espoir",
    icone: "🕊️",
    paragraphes: [
      "Même après la faute, la distance ou la fragilité, il y a toujours un chemin vers le relèvement. La Torah nous promet : tu peux être relevé, restauré, béni. C'est le message de Shabbat, le jour de la paix parfaite et de la foi.",
      "Que ce Shabbat nous remplisse de paix véritable, de joie du commandement, de lumière divine et de bénédiction abondante. Shabbat Shalom à toute la communauté du 50. 🕊️🕯️✨",
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
