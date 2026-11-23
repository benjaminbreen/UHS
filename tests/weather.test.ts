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

it("brews thunderstorms in warm heavy rain and never in the cold", () => {
  const storms = (climate: string, season: string) =>
    Array.from({ length: 60 }, (_, day) => weatherAt("storms", climate, season, day * 86400 + 16 * 3600)).filter((w) => w.storm > 0.3);
  const monsoon = storms("monsoon", "summer");
  expect(monsoon.length).toBeGreaterThan(3);
  expect(monsoon.every((w) => w.label === "Thunderstorm" && w.condition === "rain")).toBe(true);
  expect(storms("tundra", "winter")).toHaveLength(0);
});

it("throws hail in a squall, drives snow in a blizzard and raises dust only where it is dry", () => {
  const days = (climate: string, season: string) =>
    Array.from({ length: 90 * 96 }, (_, q) => weatherAt("gales", climate, season, q * 900));
  const hail = days("temperate", "spring").filter((w) => w.hail > 0.1);
  expect(hail.length).toBeGreaterThan(0);
  expect(hail.every((w) => w.condition === "rain" && w.label === "Hail" && w.rain >= 0.6 && w.storm > 0)).toBe(true);
  const blizzards = days("tundra", "winter").filter((w) => w.blizzard > 0.3);
  expect(blizzards.length).toBeGreaterThan(8);
  expect(blizzards.every((w) => w.condition === "snow" && w.label === "Blizzard" && w.wind.strength >= 0.7)).toBe(true);
  const dust = days("arid", "spring").filter((w) => w.dust > 0);
  expect(dust.some((w) => w.label === "Sandstorm")).toBe(true);
  expect(dust.every((w) => w.condition === "dust" && !w.rain && w.wind.strength >= 0.55)).toBe(true);
  for (const wet of [days("temperate", "spring"), days("tropical", "summer"), days("tundra", "winter")])
    expect(wet.some((w) => w.condition === "dust")).toBe(false);
  expect(days("tropical", "summer").some((w) => w.blizzard > 0)).toBe(false);
});
