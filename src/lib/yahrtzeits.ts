// Yahrtzeits (anniversaires de décès) des Rabbanim — base communautaire.
// Clés : "JJ-MoisHébreu" (mois tel que renvoyé par Hebcal : Nisan, Iyyar, Sivan,
// Tamuz, Av, Elul, Tishrei, Cheshvan, Kislev, Tevet, "Sh'vat", Adar, "Adar I", "Adar II").
// Ajouter les nouvelles entrées au fil des semaines.

export const YAHRTZEITS: Record<string, string[]> = {
  "27-Sivan": [
    "Rabbi 'Hanina ben Tradyon",
    "HaRav Morde'haï Sevitzky",
    "HaRav Meir Eisenstadt",
    "HaRav Ye'hi ben Yossef Kara",
  ],
  "28-Sivan": [
    "HaRav Israel Ze'ev Gustman",
    "HaRav Avraham Adadi",
    "HaRav Chimchon Aaron Polansky, le Teplik Rav",
  ],
  "4-Tamuz": [
    "Reb Mendel Fouterfass",
    "Rabbénou Tam · HaRav Ya'aqov ben Meïr",
    "HaRav Eliyahou Loupas",
    "HaRav 'Hayim Moché Mandel",
  ],
  "5-Tamuz": [
    "HaRav Klipha Cohen le Second",
    "HaRav Tzala'h Cohen Zangi",
  ],
};

export function getYahrtzeits(hebDay: number, hebMonth: string): string[] {
  return YAHRTZEITS[`${hebDay}-${hebMonth}`] ?? [];
}

// Hebcal renvoie les noms hébraïques en anglais translittéré ;
// on les francise pour l'affichage de Rosh Ḥodesh.
const FR_MONTHS: Record<string, string> = {
  Nisan: "Nissan",
  Iyyar: "Iyar",
  Sivan: "Sivan",
  Tamuz: "Tamouz",
  Av: "Av",
  Elul: "Eloul",
  Tishrei: "Tichri",
  Cheshvan: "Heshvan",
  Kislev: "Kislev",
  Tevet: "Tevet",
  "Sh'vat": "Shevat",
  Adar: "Adar",
  "Adar I": "Adar I",
  "Adar II": "Adar II",
};

export function frenchHebMonth(hm: string): string {
  return FR_MONTHS[hm] ?? hm;
}
