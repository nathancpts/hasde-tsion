import { describe, test, expect } from "bun:test";
import { getCommunityMinha, getCommunityTime, getCommunitySchedule } from "./zmanim-overrides";

describe("Bereshit 9 et 10 octobre 2026", () => {
  test("Minha vendredi à 18:50", () => {
    expect(getCommunityMinha("2026-10-09")).toBe("18:50");
    expect(getCommunityTime("2026-10-09", "Minha")).toBe("18:50");
  });
  test("entrée de Chabbat à 18:57", () => {
    expect(getCommunityTime("2026-10-09", "Entrée de Chabbat")).toBe("18:57");
  });
  test("Chaharit samedi à 09:00", () => {
    expect(getCommunityTime("2026-10-10", "Chaharit")).toBe("09:00");
  });
  test("Minha samedi à 18:30", () => {
    expect(getCommunityMinha("2026-10-10")).toBe("18:30");
    expect(getCommunityTime("2026-10-10", "Minha")).toBe("18:30");
  });
  test("sortie de Chabbat à 19:59", () => {
    expect(getCommunityTime("2026-10-10", "Sortie de Chabbat")).toBe("19:59");
  });
  test("exceptions limitées à ces deux dates", () => {
    expect(getCommunitySchedule("2026-10-11")).toBeNull();
    expect(getCommunitySchedule("2026-10-16")).toBeNull();
    expect(getCommunitySchedule("2026-10-17")).toBeNull();
  });
});