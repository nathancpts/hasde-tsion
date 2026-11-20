import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { getDonationsRepas } from "./weekly-content.ts";

// Semaine du lundi 16 au dimanche 22 novembre 2026 (Chabbat Vayetse, 21 nov)
const day = (d: number, h = 10, m = 0) => new Date(2026, 10, d, h, m);

describe("Séouda Vayetse : dédicace de la semaine", () => {
  test("les trois familles sont affichées pendant toute la semaine", () => {
    for (const d of [16, 19, 20, 21, 22]) {
      const dons = getDonationsRepas(day(d));
      assert.deepEqual(
        dons.map((x) => x.donateur),
        ["Famille Cohen Bruno", "Famille Zarhi Rudy", "Famille Mimouni Bryan"],
        `liste attendue le ${d} novembre`,
      );
    }
  });

  test("la dédicace reprend le texte demandé, une seule fois", () => {
    const dons = getDonationsRepas(day(20));
    assert.equal(dons[0].dedicace, "Hazak aux Familles Cohen Bruno, Zarhi Rudy et Mimouni Bryan, qui prennent sur eux la Parachat Vayetse ✨");
    assert.equal(dons.filter((x) => x.dedicace).length, 1);
  });

  test("la liste se vide le lundi suivant", () => {
    assert.deepEqual(getDonationsRepas(day(23)), []);
    assert.deepEqual(getDonationsRepas(day(30)), []);
  });
});
