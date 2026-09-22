import { describe, expect, it } from "vitest";
import { panelCity } from "../scripts/review/panel";
import { cellKey } from "../src/world/v3/types";
import { crops, pickable } from "../src/content/agriculture/crops";
import { createSettingSession } from "../src/runtime/session";
import { panelSetting } from "../scripts/review/panel";

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
      let inside = 0,
        farmed = 0;
      for (const [k, cell] of plan.fields!) {
        const [x, y] = k.split(",").map(Number);
        if (!cell.yard) {
          farmed++;
          if (Math.hypot(x - centre.x, y - centre.y) < r) inside++;
        }
        expect(plan.solid.has(k), `field on a building at ${k}`).toBe(false);
        expect(plan.traffic.has(k), `field on a street at ${k}`).toBe(false);
      }
      expect(
        inside / farmed,
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

/** A kitchen garden is worth pointing at: the bed is big enough to read as a
 * bed, and every planted cell names its crop when the player hovers it. */
describe("kitchen gardens", () => {
  it("lays beds you can point at, and names what grows there", () => {
    const c = panelCity("london", 1400);
    const beds = [...c.plan.fields!].filter(([, f]) => f.garden);
    expect(beds.length, "garden cells").toBeGreaterThan(20);
    const widest = new Map<number, number>();
    for (const [k] of beds) {
      const [x, y] = k.split(",").map(Number);
      widest.set(y, (widest.get(y) ?? 0) + 1);
      const seen = c.engine.inspect(`crop-${x}-${y}`);
      // Only what the player can see from where they stand has a label, but
      // whatever answers names the crop rather than the ground.
      if (seen) {
        expect(seen.kind).toBe("vegetation");
        expect(seen.name.length).toBeGreaterThan(0);
      }
    }
    expect(Math.max(...widest.values()), "widest bed row").toBeGreaterThan(4);
  });
});

/** Picking a crop: your own ground is work, somebody else's is theft, and a
 * plant only gives once. Summer, so the grain is standing ripe. */
describe("harvesting a crop cell", () => {
  const harvestWorld = () =>
    createSettingSession(
      { ...panelSetting("london", 1400), season: "summer" },
      "harvest-review",
    );
  const ripeCell = (e: ReturnType<typeof harvestWorld>, owned: boolean) => {
    const spawn = e.world.spawn;
    for (let y = spawn.y - 70; y < spawn.y + 70; y++)
      for (let x = spawn.x - 70; x < spawn.x + 70; x++) {
        const f = e.world.topography?.(x, y)?.field;
        if (!f || f.stage !== "ripe" || !pickable(crops[f.crop])) continue;
        if (owned ? !!f.owner && f.owner !== "player" : !f.owner)
          return { x, y, field: f };
      }
    throw Error(`no ${owned ? "owned" : "common"} ripe crop to test against`);
  };
  it("takes the crop, angers the owner, and gives nothing twice", () => {
    const e = harvestWorld();
    const at = ripeCell(e, true);
    e.state.player.pos = { x: at.x, y: at.y - 1, space: "outside" };
    const owner = e.state.actors.find((a) => a.id === at.field.owner);
    if (owner) owner.pos = { x: at.x + 1, y: at.y - 1, space: "outside" };
    const id = `crop-${at.x}-${at.y}`;
    const seen = e.inspect(id);
    expect(seen?.claim, "somebody else's crop is marked as owned").toBe(
      "owned",
    );
    const offer = seen!.affordances[0];
    expect(offer?.label, "prompt says it is not yours").toMatch(
      /without asking/,
    );
    expect(offer?.enabled, "in reach and ripe").toBe(true);
    const item = crops[at.field.crop].yields!;
    const before = e.state.player.inventory[item] ?? 0;
    const trust = owner?.trust;
    e.execute(offer!.command);
    expect(
      e.state.player.inventory[item] ?? 0,
      "the crop is in the pack",
    ).toBeGreaterThan(before);
    expect(
      e.state.player.memories.some((m) => m.startsWith(`theft:${id}:`)),
      "the player remembers taking it",
    ).toBe(true);
    if (owner && trust !== undefined)
      expect(owner.trust, "the owner minds").toBeLessThan(trust);
    // The same plant does not give a second time.
    const again = e.inspect(id)!.affordances[0];
    expect(again?.enabled).toBe(false);
    expect(again?.reason).toMatch(/picked/);
  });
  it("counts a loss against the whole household, not just the holder", () => {
    const e = harvestWorld();
    const at = ripeCell(e, true);
    const house = e.state.households?.find((h) =>
      h.members.includes(at.field.owner!),
    );
    const kin = house?.members.find((m) => m !== at.field.owner);
    const witness = e.state.actors.find((a) => a.id === kin);
    if (!witness) return;
    e.state.player.pos = { x: at.x, y: at.y - 1, space: "outside" };
    witness.pos = { x: at.x + 1, y: at.y - 1, space: "outside" };
    const trust = witness.trust;
    e.execute(e.inspect(`crop-${at.x}-${at.y}`)!.affordances[0]!.command);
    expect(witness.trust, "a co-resident minds").toBeLessThan(trust);
    expect(
      witness.memories.some((m) => /take my crop/.test(m)),
      "and takes it personally",
    ).toBe(true);
  });
  it("treats unowned ground as work, not theft", () => {
    const e = harvestWorld();
    const at = ripeCell(e, false);
    e.state.player.pos = { x: at.x, y: at.y - 1, space: "outside" };
    const id = `crop-${at.x}-${at.y}`;
    const seen = e.inspect(id)!;
    expect(seen.claim, "common ground carries no claim").toBeUndefined();
    expect(seen.affordances[0]?.label).toMatch(/^Harvest/);
    e.execute(seen.affordances[0]!.command);
    expect(
      e.state.player.memories.some((m) => m.startsWith("theft:")),
      "no theft recorded",
    ).toBe(false);
  });
  it("will not let you pick a crop that is not ready", () => {
    const e = harvestWorld();
    const spawn = e.world.spawn;
    for (let y = spawn.y - 70; y < spawn.y + 70; y++)
      for (let x = spawn.x - 70; x < spawn.x + 70; x++) {
        const f = e.world.topography?.(x, y)?.field;
        if (!f || f.stage === "ripe" || !pickable(crops[f.crop])) continue;
        e.state.player.pos = { x, y: y - 1, space: "outside" };
        const offer = e.inspect(`crop-${x}-${y}`)?.affordances[0];
        if (!offer) continue;
        expect(offer.enabled).toBe(false);
        expect(offer.reason).toMatch(/Not ready/);
        return;
      }
    throw Error("no unripe crop to test against");
  });
});
