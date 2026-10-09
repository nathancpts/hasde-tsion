import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { getCommunityMinha, getCommunityTime, getCommunitySchedule } from "./zmanim-overrides";

describe("Bereshit 9 et 10 octobre 2026", () => {
  test("Minha vendredi à 18:50", () => {
    assert.equal(getCommunityMinha("2026-10-09"), "18:50");
    assert.equal(getCommunityTime("2026-10-09", "Minha"), "18:50");
  });
  test("entrée de Chabbat à 18:57", () => {
    assert.equal(getCommunityTime("2026-10-09", "Entrée de Chabbat"), "18:57");
  });
  test("Chaharit samedi à 09:00", () => {
    assert.equal(getCommunityTime("2026-10-10", "Chaharit"), "09:00");
  });
  test("Minha samedi à 18:30", () => {
    assert.equal(getCommunityMinha("2026-10-10"), "18:30");
    assert.equal(getCommunityTime("2026-10-10", "Minha"), "18:30");
  });
  test("sortie de Chabbat à 19:59", () => {
    assert.equal(getCommunityTime("2026-10-10", "Sortie de Chabbat"), "19:59");
  });
  test("exceptions limitées à ces deux dates", () => {
    assert.equal(getCommunitySchedule("2026-10-11"), null);
    assert.equal(getCommunitySchedule("2026-10-16"), null);
    assert.equal(getCommunitySchedule("2026-10-17"), null);
  });
});