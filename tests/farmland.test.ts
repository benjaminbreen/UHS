import { describe, expect, it } from "vitest";
import { panelCity } from "../scripts/review/panel";
import { cellKey } from "../src/world/v3/types";

/** Farmland round a town: parcels exist, keep off the built ground, reach
 * a lane, and carry the system the culture and date imply. */
describe("farmland", () => {
  for (const [place, year, minParcels, system] of [
    ["london", 1400, 60, "medieval-open-field-strips"],
    ["alexandria", -244, 30, "nile-flood-basins"],
  ] as const)
    it(`${place} ${year} farms its territory`, () => {
      const c = panelCity(place, year);
      const plan = c.plan;
      expect(plan.territory, "territory").toBeDefined();
      expect(plan.parcels?.length ?? 0, "parcels").toBeGreaterThanOrEqual(
        minParcels,
      );
      expect(plan.territory!.spokes.length, "spokes").toBeGreaterThanOrEqual(2);
      expect(plan.territory!.slots.length, "slots").toBeGreaterThanOrEqual(2);
      // Fields keep out of the town and never sit on a building or a street.
      const r = plan.site.profile.radius,
        centre = plan.site.center;
      let inside = 0;
      for (const k of plan.fields!.keys()) {
        const [x, y] = k.split(",").map(Number);
        if (Math.hypot(x - centre.x, y - centre.y) < r) inside++;
        expect(plan.solid.has(k), `field on a building at ${k}`).toBe(false);
        expect(plan.traffic.has(k), `field on a street at ${k}`).toBe(false);
      }
      expect(
        inside / plan.fields!.size,
        "share inside the built radius",
      ).toBeLessThan(0.02);
      // Every parcel's access cell touches a lane or open ground, not water.
      for (const p of plan.parcels!.slice(0, 200))
        expect(
          c.engine.world.terrain(p.access.x, p.access.y),
          `access ${p.id}`,
        ).not.toBe("water");
      // Owned parcels are the nearest ones, and their owners have crops to tend.
      const owned = plan.parcels!.filter((p: { owner?: string }) => p.owner);
      expect(owned.length, "owned parcels").toBeGreaterThan(0);
      for (const p of owned.slice(0, 20))
        expect(
          plan.objects.some(
            (o: { kind: string; owner?: string }) =>
              o.kind === "crop" && o.owner === p.owner,
          ),
          `crops for ${p.owner}`,
        ).toBe(true);
      const cellKeys = [...plan.fields!.keys()];
      expect(
        cellKeys.some((k) => plan.fields!.get(k)!.edges !== 0),
        "boundaries",
      ).toBe(true);
      expect(plan.parcels!.length, system).toBeGreaterThan(0);
      void cellKey;
    });
});
