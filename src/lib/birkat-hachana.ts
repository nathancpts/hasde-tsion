// Donateurs annuels Birkat Hachana 5787 — noms seuls (jamais de téléphone ni d'e-mail).
export const BIRKAT_HACHANA_DONORS = [
  "Jonathan Sebbag",
  "Sidney Broutinovski",
  "Bruno Cohen",
  "Raphaël Niddam",
  "Rudy Setti",
  "Julien Seknagi",
  "Gaon Niddam",
  "Avram Niddam",
];

/** La liste n'est affichée que les jours de lecture de la Torah : lundi, jeudi et Chabbat (samedi). */
export function isBirkatHachanaDay(date: Date): boolean {
  const d = date.getDay();
  return d === 1 || d === 4 || d === 6;
}
