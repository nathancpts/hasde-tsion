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

export const PARASHA_NOM = "Chela'h Lekha";
export const PARASHA_NOM_HE = "שלח לך";

export const PARASHA_INTRO =
  "Chers frères et sœurs, en ce saint jour de Shabbat, que la paix divine repose sur vous, voici quelques mots de la paracha de la semaine.";

export const PARASHA_BLOCS: ParashaBloc[] = [
  {
    titre: "Le résumé",
    icone: "📜",
    paragraphes: [
      "Moché envoie douze explorateurs reconnaître la terre de Canaan. Dix d'entre eux reviennent effrayés et découragent tout le peuple ; seuls Yehochoua et Calev gardent confiance en Hachem.",
      "À cause de ce manque de foi, la génération du désert ne pourra pas entrer en Terre promise et devra errer quarante ans. La paracha se conclut par la mitsva des tsitsit, ces franges qui nous rappellent en permanence les commandements.",
    ],
  },
  {
    titre: "Points à retenir",
    icone: "✨",
    puces: [
      "La peur déforme le regard : les explorateurs ont vu la même terre, mais leur cœur a transformé une bénédiction en menace.",
      "Calev et Yehochoua nous enseignent qu'une voix juste, même minoritaire, vaut plus que la clameur de la foule.",
      "Les tsitsit nous rappellent que le souvenir quotidien des mitsvot protège des égarements du cœur et des yeux.",
    ],
  },
  {
    titre: "Dans l'esprit de nos sages",
    icone: "💬",
    puces: [
      "Rachi : Hachem n'a pas ordonné d'envoyer les explorateurs, mais l'a permis « selon ton propre jugement » — la faute n'était pas dans la mission, mais dans la peur qui a parlé à la place de la confiance.",
      "Le Rabbi de Loubavitch : l'erreur des explorateurs fut de vouloir fuir le monde matériel ; notre mission est de l'éclairer et de le sanctifier, car c'est dans la descente vers la matière que se révèle la plus grande lumière.",
      "Emmanuel Levinas : dire engage. Un mot peut relever ou abattre tout un peuple ; la responsabilité commence par la manière dont je parle de l'autre et du monde.",
    ],
  },
  {
    titre: "Message d'espoir",
    icone: "🕯️",
    paragraphes: [
      "Regarder la réalité avec les yeux de la confiance plutôt qu'avec ceux de la peur. Même après la chute, la Torah place les tsitsit comme un fil de lumière : chaque jour, il est possible de renouer le lien et de recommencer.",
    ],
  },
  {
    titre: "Chabbat Chalom",
    icone: "🕊️",
    paragraphes: [
      "Que ce Chabbat soit une source de paix, de réconfort et de lumière pour vous et vos familles. Chabbat Chalom à tous ! ✨",
    ],
  },
];

export const DONATIONS_REPAS: Donation[] = [
  {
    donateur: "Libre",
    details: [
      "C'est avec beaucoup de bonheur que nous vous annonçons la venue du Rav Arié Niselevitch parmi nous pour ce Chabbat.",
      "Officiant : Aharon Djian",
      "Cours : Chaharit & Séouda Chlichit",
    ],
  },
];






