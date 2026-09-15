import { expect, it } from "vitest";
import { landscapeRecipe } from "../src/content/ecology/landscapes";
import { drainageAt } from "../src/world/v3/drainage";
import { habitatAt } from "../src/world/v3/habitats";
import type { Ecology } from "../src/content/ecology/profiles";
it("distinguishes connected woodland cover, open savanna and mineral desert across seeds", () => {
  const results: Record<string, { cover: number; exposed: number }> = {};
  for (const ecology of [
    "tropical-woodland",
    "temperate-woodland",
    "savanna",
    "desert",
  ] as Ecology[]) {
    let cover = 0,
      exposed = 0,
      count = 0;
    const parts = [{ ecology, weight: 1 }];
    const recipe = landscapeRecipe(parts);
    for (const seed of ["one", "two", "three"])
      for (let y = 0; y < 96; y += 8)
        for (let x = 0; x < 96; x += 8) {
          const h = habitatAt(ecology, "summer", seed, x, y, {
            water: 100,
            kind: "river",
            elevation: 14,
            moisture: recipe.moisture,
            snow: false,
            ecologyParts: parts,
            drainage: drainageAt(() => 0.4, x, y, 100, recipe),
          });
          cover += h.cover;
          exposed += h.exposed;
          count++;
        }
    results[ecology] = { cover: cover / count, exposed: exposed / count };
  }
  expect(results["tropical-woodland"].cover).toBeGreaterThan(
    results.savanna.cover + 0.4,
  );
  expect(results["temperate-woodland"].cover).toBeGreaterThan(
    results.savanna.cover + 0.3,
  );
  expect(results.desert.exposed).toBeGreaterThan(
    results["temperate-woodland"].exposed + 0.5,
  );
});
it("forms wooded swamp beside flat humid drainage but not on steep or dry banks", () => {
  const parts = [{ ecology: "tropical-woodland" as const, weight: 1 }];
  const recipe = landscapeRecipe(parts);
  const flat = drainageAt(() => 0.4, 0, 0, 1, recipe);
  const steep = drainageAt((x) => 0.4 + x * 0.02, 0, 0, 1, recipe);
  expect(flat.saturation).toBeGreaterThan(steep.saturation + 0.4);
  const h = habitatAt("tropical-woodland", "summer", "swamp", 0, 0, {
    water: 1,
    kind: "river",
    elevation: 0,
    moisture: 0.86,
    snow: false,
    ecologyParts: parts,
    drainage: flat,
  });
  expect(h.colorway).toBe("swamp");
  expect(
    drainageAt(
      () => 0.4,
      0,
      0,
      1,
      landscapeRecipe([{ ecology: "desert", weight: 1 }]),
    ).saturation,
  ).toBeLessThan(0.1);
});
