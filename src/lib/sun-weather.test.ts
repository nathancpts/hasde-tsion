import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { sunWeather } from "./sun-weather.ts";

describe("Visibility of the sun according to actual weather", () => {
  test("clear: cloud 0, disc 1", () => assert.deepEqual(sunWeather(0), { cloud: 0, disc: 1 }));
  test("few clouds: cloud 0.2, disc 0.85", () => assert.deepEqual(sunWeather(1), { cloud: 0.2, disc: 0.85 }));
  test("cloudy: cloud 0.5, disc 0.35", () => assert.deepEqual(sunWeather(2), { cloud: 0.5, disc: 0.35 }));
  test("overcast, rain, drizzle, snow and fog: cloud 0.8, disc 0", () => {
    for (const code of [3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86]) {
      assert.deepEqual(sunWeather(code), { cloud: 0.8, disc: 0 });
    }
  });
  test("storm: cloud 0.9, disc 0", () => {
    for (const code of [95, 96, 99]) assert.deepEqual(sunWeather(code), { cloud: 0.9, disc: 0 });
  });
});