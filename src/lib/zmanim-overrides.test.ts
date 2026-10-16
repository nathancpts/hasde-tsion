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
});

describe("Noah 16 et 17 octobre 2026", () => {
  test("Minha vendredi à 18:40", () => {
    assert.equal(getCommunityMinha("2026-10-16"), "18:40");
    assert.equal(getCommunityTime("2026-10-16", "Minha"), "18:40");
  });
  test("Arvit vendredi à 19:20", () => {
    assert.equal(getCommunityTime("2026-10-16", "Arvit"), "19:20");
  });
  test("Chaharit samedi à 09:00", () => {
    assert.equal(getCommunityTime("2026-10-17", "Chaharit"), "09:00");
  });
  test("Minha samedi à 18:20", () => {
    assert.equal(getCommunityMinha("2026-10-17"), "18:20");
    assert.equal(getCommunityTime("2026-10-17", "Minha"), "18:20");
  });
  test("Sheqyia samedi à 18:59 et Arvit à 19:40", () => {
    assert.equal(getCommunityTime("2026-10-17", "Sheqyia"), "18:59");
    assert.equal(getCommunityTime("2026-10-17", "Arvit"), "19:40");
  });
});

describe("exceptions limitées aux dates indiquées", () => {
  test("aucune exception hors des deux weekends", () => {
    assert.equal(getCommunitySchedule("2026-10-11"), null);
    assert.equal(getCommunitySchedule("2026-10-15"), null);
    assert.equal(getCommunitySchedule("2026-10-23"), null);
    assert.equal(getCommunitySchedule("2026-10-24"), null);
  });
});
