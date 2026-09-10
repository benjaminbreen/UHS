import { expect, it } from "vitest";
import { weatherAt, toFahrenheit } from "../src/core/weather";

it("is deterministic per seed and day, and stays in a plausible range", () => {
  const a = weatherAt("seed", "monsoon", "summer", 9 * 3600);
  const b = weatherAt("seed", "monsoon", "summer", 9 * 3600 + 600);
  expect(a.condition).toBe(b.condition);
  for (const climate of ["tundra", "temperate", "arid", "tropical"])
    for (let day = 0; day < 40; day++) {
      const w = weatherAt("x", climate, "spring", day * 86400 + 14 * 3600);
      expect(w.tempC).toBeGreaterThan(-45);
      expect(w.tempC).toBeLessThan(50);
    }
  expect(weatherAt("s", "tundra", "winter", 4 * 3600).tempC).toBeLessThan(
    weatherAt("s", "arid", "summer", 15 * 3600).tempC,
  );
  expect(toFahrenheit(0)).toBe(32);
});
