import { expect, it } from "vitest";
import { windProfile, windSway } from "../src/render/wind";

it("gives reeds, willows, palms, and ordinary trees distinct wind profiles", () => {
  expect(windProfile("reeds")).toMatchObject({ period: 2400 });
  expect(windProfile("nature-riverside-willow", true)).toMatchObject({
    period: 6000,
    lateral: 0.7,
  });
  expect(windProfile("nature-feather-palm", true)).toMatchObject({
    period: 5200,
  });
  expect(windProfile("oak", true)).toMatchObject({ period: 5600 });
  expect(windProfile("rock")).toBeUndefined();
});

it("keeps sway deterministic and within its pixel-safe bounds", () => {
  const profile = windProfile("nature-riverside-willow", true)!;
  const a = windSway(800, 0.25, profile);
  expect(windSway(800, 0.25, profile)).toEqual(a);
  expect(Math.abs(a.x)).toBeLessThanOrEqual(Math.ceil(profile.lateral));
  expect(Math.abs(a.angle)).toBeLessThanOrEqual(profile.angle * 1.2);
});
