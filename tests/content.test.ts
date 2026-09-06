import { it, expect } from "vitest";
import { formatHistoricalYear } from "../src/core/calendar";
import { packs, items, resolvePrompt } from "../src/content/packs";
import { createWorld } from "../src/world/generate";
import atlas from "../src/render/generated/atlas.json" with { type: "json" };
it("resolves every asset and item used by both generated packs", () => {
  const frames = new Set(Object.keys(atlas.frames));
  for (const pack of Object.values(packs)) {
    const w = createWorld(pack, "content");
    for (const e of [...w.places, ...w.initialObjects])
      expect(frames.has(e.sprite), e.sprite).toBe(true);
    for (const o of w.initialObjects.filter((o) => o.kind === "tree"))
      expect(w.terrain(o.pos.x, o.pos.y)).not.toBe("water");
    for (const a of w.initialActors) {
      const frame = a.kind === "human" ? `${a.sprite}-2-0` : `${a.sprite}0`;
      expect(frames.has(frame), frame).toBe(true);
    }
    for (const item of Object.keys(pack.startInventory))
      expect(item in items).toBe(true);
    for (const place of w.places)
      expect(pack.evidence.some((e) => e.id === place.claim)).toBe(true);
  }
});
it("does not substitute unsupported historical dates or conflicting settings", () => {
  expect(resolvePrompt("Roman town 1800 CE")).toHaveProperty("error");
  expect(resolvePrompt("Roman Neolithic town")).toHaveProperty("error");
  expect(resolvePrompt("Roman traveler 100 CE")).toHaveProperty(
    "pack.id",
    "roman",
  );
  expect(resolvePrompt("Early farmer 6500 BCE")).toHaveProperty(
    "pack.id",
    "neolithic",
  );
});
it("displays BCE and CE without a year zero", () => {
  expect(formatHistoricalYear(1)).toBe("1 CE");
  expect(formatHistoricalYear(0)).toBe("1 BCE");
  expect(formatHistoricalYear(-6499)).toBe("6500 BCE");
});
