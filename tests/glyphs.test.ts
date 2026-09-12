import { expect, it } from "vitest";
import { glyphs, glyphIds, GLYPH_SIZE } from "../src/render/glyphs";
import { beliefSystems } from "../src/content/beliefs";
import { glyphForPower, iconRules } from "../src/content/beliefs/icons";

it("keeps every glyph a square of the four legal characters", () => {
  for (const id of glyphIds) {
    const rows = glyphs[id];
    expect(rows.length, id).toBe(GLYPH_SIZE);
    for (const row of rows) {
      expect(row.length, `${id}: "${row}"`).toBe(GLYPH_SIZE);
      expect(/^[.oO ]+$/.test(row), `${id}: "${row}"`).toBe(true);
    }
    // A shape with no contour reads as a smudge.
    expect(rows.join("").includes("."), id).toBe(true);
    expect(rows.join("").replace(/[^.oO]/g, "").length, id).toBeGreaterThan(12);
  }
});

it("has no two glyphs drawn the same", () => {
  const seen = new Map<string, string>();
  for (const id of glyphIds) {
    const key = glyphs[id].join("\n");
    expect(seen.get(key), `${id} duplicates ${seen.get(key)}`).toBeUndefined();
    seen.set(key, id);
  }
});

it("gives most powers a glyph of their own rather than the default", () => {
  let total = 0,
    fallback = 0;
  for (const system of beliefSystems)
    for (const power of system.powers) {
      total++;
      const glyph = glyphForPower(power);
      expect(glyphs[glyph], `${power.name}: ${glyph}`).toBeDefined();
      if (
        (power.rank === "paramount" && glyph === "sun") ||
        (power.rank === "major" && glyph === "shrine") ||
        (power.rank === "local" && glyph === "house")
      )
        fallback++;
    }
  expect(fallback / total).toBeLessThan(0.2);
});

it("points every rule at a glyph that exists", () => {
  for (const [, glyph] of iconRules) expect(glyphs[glyph], glyph).toBeDefined();
});
