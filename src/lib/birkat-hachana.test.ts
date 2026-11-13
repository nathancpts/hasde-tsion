import { describe, expect, it } from "vitest";
import { isBirkatHachanaDay } from "./birkat-hachana";

// Semaine du dimanche 15 au samedi 21 novembre 2026
const day = (d: number) => new Date(2026, 10, d, 10, 0);

describe("Birkat Hachana : jours d'affichage", () => {
  it("affiche le lundi", () => expect(isBirkatHachanaDay(day(16))).toBe(true));
  it("affiche le jeudi", () => expect(isBirkatHachanaDay(day(19))).toBe(true));
  it("affiche le samedi (Chabbat)", () => expect(isBirkatHachanaDay(day(21))).toBe(true));
  it("masque dimanche, mardi, mercredi et vendredi", () => {
    for (const d of [15, 17, 18, 20]) expect(isBirkatHachanaDay(day(d))).toBe(false);
  });
});
