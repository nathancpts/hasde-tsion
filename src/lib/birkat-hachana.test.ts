import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { isBirkatHachanaDay } from "./birkat-hachana.ts";

// Semaine du dimanche 15 au samedi 21 novembre 2026
const day = (d: number, h = 10, m = 0) => new Date(2026, 10, d, h, m);

describe("Birkat Hachana : jours d'affichage", () => {
  test("affiche le lundi", () => assert.equal(isBirkatHachanaDay(day(16)), true));
  test("affiche le jeudi", () => assert.equal(isBirkatHachanaDay(day(19)), true));
  test("affiche le samedi (Chabbat)", () => assert.equal(isBirkatHachanaDay(day(21)), true));
  test("masque dimanche, mardi, mercredi et vendredi matin", () => {
    for (const d of [15, 17, 18, 20]) assert.equal(isBirkatHachanaDay(day(d)), false);
  });
  test("vendredi 13 novembre : masqué avant l'allumage de 16:55, affiché à partir de 16:55", () => {
    assert.equal(isBirkatHachanaDay(day(13, 16, 54)), false);
    assert.equal(isBirkatHachanaDay(day(13, 16, 55)), true);
    assert.equal(isBirkatHachanaDay(day(13, 17, 6)), true);
  });
  test("vendredi sans horaire communiqué : affiché le soir après le coucher du soleil", () => {
    assert.equal(isBirkatHachanaDay(day(20, 14, 0)), false);
    assert.equal(isBirkatHachanaDay(day(20, 18, 0)), true);
  });
});
