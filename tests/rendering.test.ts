import { it, expect } from "vitest";
import { createWorld } from "../src/world/generate";
import { packs } from "../src/content/packs";
import { settlementPaths, surfaceAt } from "../src/render/materials";

it("derived settlement paths connect entrances through walkable ground across seeds", () => {
  for (const seed of ["konya-6500", "riverbend", "stones", "12"]) {
    const world = createWorld(packs.neolithic, seed);
    const original = JSON.stringify([
      world.initialActors,
      world.initialObjects,
      world.places,
    ]);
    const paths = settlementPaths(world);
    for (const key of paths) {
      const [x, y] = key.split(",").map(Number);
      expect(world.blocked(x, y, "outside"), key).toBe(false);
      expect(surfaceAt(world, x, y), key).toBe("dirt");
    }
    for (const p of world.places)
      expect(paths.has(`${p.entrance.x},${p.entrance.y}`), p.id).toBe(true);
    expect(
      JSON.stringify([world.initialActors, world.initialObjects, world.places]),
    ).toBe(original);
  }
});
it("surface treatment preserves water and is stable across cache request orders", () => {
  for (const pack of Object.values(packs)) {
    const a = createWorld(pack, "bank-test"),
      b = createWorld(pack, "bank-test");
    const points = Array.from({ length: 96 }, (_, i) => ({
      x: Math.floor(i / 3) - 32,
      y: (i % 3) * 17 - 17,
    }));
    const forward = points.map((p) => surfaceAt(a, p.x, p.y));
    const backward = [...points]
      .reverse()
      .map((p) => surfaceAt(b, p.x, p.y))
      .reverse();
    expect(forward).toEqual(backward);
    points.forEach((p, i) => {
      if (a.terrain(p.x, p.y) === "water") expect(forward[i]).toBe("water");
    });
  }
});
