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
      "Béha'alotkha (Nombres 8,1 à 12,16) : Aaron allume — ou plutôt « fait monter » — les lumières de la Ménorah. Les Léviim débutent leur service, et les lois du second Pessa'h offrent un rattrapage à ceux qui étaient empêchés.",
      "Le peuple se déplace au rythme de la nuée et des trompettes d'argent. Après les récriminations pour la viande, D.ieu partage l'esprit prophétique de Moïse avec 70 anciens. La paracha se conclut par l'épisode de Myriam, et la confiance réaffirmée en Moïse, « l'homme le plus humble de toute la terre ».",
    ],
  },
  {
    titre: "La force du cri",
    icone: "🕯️",
    paragraphes: [
      "Pour guérir Myriam, Moïse pousse un cri bref et bouleversant : « Ô Seigneur, guéris-la je T'en prie ! » Le Zohar enseigne que le cri — silencieux ou sonore — est la forme la plus authentique de la prière, celle qui n'a pas besoin de mots.",
      "Le Or HaHaïm rappelle qu'en Égypte, les enfants d'Israël ont simplement hurlé de douleur, sans même s'adresser à D.ieu. Et pourtant ce cri a suffi à éveiller Sa miséricorde et à enclencher la délivrance.",
      "Comme un père accourt vers son enfant tombé, D.ieu répond au cri vrai. David le dit (Ps. 118,5) : « Du sein de la détresse j'ai invoqué D.ieu ; Il m'a répondu avec générosité. »",
    ],
  },
  {
    titre: "Dans l'esprit de nos sages",
    icone: "💬",
    puces: [
      "Rachi : « faire monter » la flamme, c'est la tenir jusqu'à ce qu'elle brûle d'elle-même — aider l'autre à devenir autonome.",
      "Le Rabbi de Loubavitch : chaque âme porte une lumière qui ne demande qu'à être révélée ; ajouter de la lumière est la meilleure réponse à l'obscurité.",
      "Emmanuel Levinas : la Ménorah symbolise la responsabilité envers autrui ; le vrai leader, comme Moïse, se distingue par son humilité.",
    ],
  },
  {
    titre: "Chabbat Chalom",
    icone: "🕊️",
    paragraphes: [
      "Chabbat Chalom à toute la communauté du 50. ✨",
    ],
  },
];


export const DONATIONS_REPAS: Donation[] = [
  {
    donateur: "Hazak à la Famille Setti Rudy, qui prend sur Elle la Parachat Beha'alotcha !",
    occasion: "LEILOU NICHMAT",
    dedicace: "DANIELLE THAMAR ATOU · BAT FORTUNE",
    dedicaceHe: "דניאל תמר אטו · בת פורטונה",
    details: [
      "Que le Saint Béni Soit-Il accorde à la Famille Setti Rudy ainsi qu'à tous leurs proches santé, réussite, joie et abondantes bénédictions.",
    ],
  },
];


