import { expect, it } from "vitest";
import { settingFor } from "../src/content/geography/resolve";
import { places } from "../src/content/geography/places";
import { integratedSetting } from "../src/content/geography/defaults";
import { createRegionalContext } from "../src/world/regional/context";
it("blends a contrasting starting ecology without a jump at the former radius", () => {
  const s = integratedSetting(
    settingFor(places.find((p) => p.id === "london")!),
  );
  s.environment = { ...s.environment!, ecology: "desert", colorway: "sahara" };
  const region = createRegionalContext(s);
  expect(region.ecologyAt(0, 0).parts).toHaveLength(1);
  const samples = Array.from({ length: 260 }, (_, i) =>
    region.ecologyAt(60 + i, 0),
  );
  for (let i = 1; i < samples.length; i++) {
    expect(
      Math.abs(samples[i].moisture - samples[i - 1].moisture),
    ).toBeLessThan(0.02);
    expect(samples[i].parts.reduce((sum, p) => sum + p.weight, 0)).toBeCloseTo(
      1,
    );
  }
  expect(samples.some((s) => s.parts.length > 1)).toBe(true);
  expect(region.ecologyAt(192, 0)).toEqual(
    createRegionalContext(s).ecologyAt(192, 0),
  );
});
it("retains the old ecological selector for inputs without the revision", () => {
  const s = integratedSetting(
    settingFor(places.find((p) => p.id === "london")!),
  );
  s.ecologyRevision = undefined;
  s.geographyMode = "configured";
  s.environment = { ...s.environment!, ecology: "desert" };
  const r = createRegionalContext(s);
  expect(r.settingAt(191, 0).environment!.ecology).toBe("desert");
  expect(r.settingAt(192, 0).environment!.ecology).not.toBe("desert");
});
