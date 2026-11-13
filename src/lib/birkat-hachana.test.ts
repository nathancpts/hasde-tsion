import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { isBirkatHachanaDay } from "./birkat-hachana.ts";

// Semaine du dimanche 15 au samedi 21 novembre 2026
const day = (d: number) => new Date(2026, 10, d, 10, 0);

describe("Birkat Hachana : jours d'affichage", () => {
  test("affiche le lundi", () => assert.equal(isBirkatHachanaDay(day(16)), true));
  test("affiche le jeudi", () => assert.equal(isBirkatHachanaDay(day(19)), true));
  test("affiche le samedi (Chabbat)", () => assert.equal(isBirkatHachanaDay(day(21)), true));
  test("masque dimanche, mardi, mercredi et vendredi", () => {
    for (const d of [15, 17, 18, 20]) assert.equal(isBirkatHachanaDay(day(d)), false);
  });
});
