import { expect, it } from "vitest";
import { settingFor } from "../src/content/geography/resolve";
import { places } from "../src/content/geography/places";
import { integratedSetting } from "../src/content/geography/defaults";
import { createRegionalContext } from "../src/world/regional/context";
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
