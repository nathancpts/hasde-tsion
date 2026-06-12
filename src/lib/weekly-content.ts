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

export const PARASHA_INTRO = "";

export const PARASHA_BLOCS: ParashaBloc[] = [
  {
    titre: "Parachat Chela'h Lekha",
    icone: "📜",
    paragraphes: [
      "Moché envoie douze explorateurs reconnaître la terre de Canaan.",
      "Dix d'entre eux reviennent effrayés et découragent tout le peuple ; seuls Yehochoua et Calev gardent confiance en Hachem.",
      "À cause de ce manque de foi, la génération du désert ne pourra pas entrer en Terre promise et devra errer quarante ans.",
      "La paracha se conclut par la mitsva des tsitsit, ces franges qui nous rappellent en permanence les commandements.",
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
    titre: "Commentaire de Rachi",
    icone: "💬",
    paragraphes: [
      "Rachi souligne que Hachem n'a pas ordonné d'envoyer les explorateurs, mais l'a permis « selon ton propre jugement » : la faute n'était pas dans la mission, mais dans la manière dont les hommes ont laissé la peur parler à la place de la confiance.",
    ],
  },
  {
    titre: "Enseignement du Rabbi",
    icone: "💬",
    paragraphes: [
      "Pour le Rabbi de Loubavitch, l'erreur des explorateurs fut de vouloir fuir le monde matériel par crainte de s'y perdre ; or notre mission n'est pas de fuir le monde mais de l'éclairer et de le sanctifier, car c'est dans la descente vers la matière que se révèle la plus grande lumière.",
    ],
  },
  {
    titre: "Lecture inspirée de Levinas",
    icone: "💬",
    paragraphes: [
      "La parole des explorateurs nous rappelle, dans l'esprit de Levinas, que dire engage : un mot peut relever ou abattre tout un peuple, et la responsabilité commence par la manière dont je parle de l'autre et du monde.",
    ],
  },
  {
    titre: "Message d'espoir",
    icone: "🕯️",
    paragraphes: [
      "Regarder la réalité avec les yeux de la confiance plutôt qu'avec ceux de la peur.",
      "Même après la chute, la Torah place les tsitsit comme un fil de lumière : chaque jour, il est possible de renouer le lien et de recommencer.",
    ],
  },
  {
    titre: "Chabbat Chalom à tous !",
    icone: "🕊️",
    paragraphes: [
      "Que ce Chabbat soit une source de paix, de réconfort et de lumière pour vous et vos familles.",
    ],
  },
];

export const DONATIONS_REPAS: Donation[] = [
  {
    donateur: "Hazak aux Familles",
    occasion: "Qui prennent sur elles la Parachat Chela'h Lekha ✨",
    details: [
      "Meimoun Mike",
      "Sfedj Michael",
      "Ghrenassia Philipe",
      "Mimouni Bryan",
      "Niddam Raphael",
      "Niddam Avram",
    ],
    dedicace: "Que D.. vous bénisse, vous comble et vous garde en bonne santé !",
  },
];






