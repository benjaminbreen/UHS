import { describe, expect, it } from "vitest";
import { interiorProfiles, resolveRoom } from "../src/content/interiors";
import { interiorProfileFor } from "../src/content/interiors/select";
import { buildInterior } from "../src/world/interior";
import { planRoom, roomMask, type Shape } from "../src/render/interiors/room";
import type { Place } from "../src/core/types";
import { createSettingSession } from "../src/runtime/session";
import { panelSetting } from "../scripts/review/panel";

const shapes: Shape[] = ["rect", "L", "round", "oval", "apse", "courtyard"];

describe("interior profiles", () => {
  it("plan every profile at every status, shape and size without overlaps or props outside the walls", () => {
    for (const pr of interiorProfiles)
      for (const room of (pr.rooms ?? [pr]).map((_, i) => i))
      for (const status of [0, 1, 2] as const)
        for (const shape of shapes)
          for (const [w, d] of [pr.size, [8, 6], [24, 16]]) {
            const p = resolveRoom(pr, { seed: 11, room, status, colorway: -1, w, d, shape, hour: 10 });
            const props = planRoom(p), mask = roomMask(p);
            const seen = new Set<number>();
            for (const q of props) {
              if (q.wall || q.kind === "rug" || q.kind === "cat" || q.kind === "fountain" || q.kind === "clutter") continue;
              for (let y = q.y; y < q.y + q.d; y++)
                for (let x = q.x; x < q.x + q.w; x++) {
                  expect(mask[y * w + x], `${pr.id} ${q.kind} at ${x},${y}`).toBeGreaterThan(0);
                  expect(seen.has(y * w + x), `${pr.id} ${q.kind} overlaps at ${x},${y}`).toBe(false);
                  seen.add(y * w + x);
                }
            }
            expect(props.filter((q) => q.kind === "door").length).toBe(pr.door === "none" ? 0 : 1);
          }
  });

  it("gives every profile colourways and a note on its evidence", () => {
    for (const pr of interiorProfiles) {
      expect(pr.colorways.length, pr.id).toBeGreaterThanOrEqual(2);
      expect(pr.note.length, pr.id).toBeGreaterThan(40);
    }
  });

  it("picks a dwelling that belongs to the place and date", () => {
    expect(interiorProfileFor({ lon: 135.8, lat: 35, year: 1700, settlement: "city" }).id).toBe("japanese-minka");
    expect(interiorProfileFor({ lon: 0.5, lat: 49, year: 1350, settlement: "village" }).id).toBe("medieval-cottage");
    expect(interiorProfileFor({ lon: 32.8, lat: 37.7, year: -7000 }).id).toBe("catalhoyuk-house");
    expect(interiorProfileFor({ lon: 106, lat: 47, year: 1600, camp: true }).id).toBe("mongol-ger");
    expect(interiorProfileFor({ lon: -90, lat: 41, year: 1935, settlement: "village" }).id).toBe("farmhouse-1930s");
  });

  it("gives every house a way in and out, and every place to stand can be walked to from the door", () => {
    const place = (id: string): Place => ({ id, name: "House", description: "", x: 0, y: 0, w: 3, h: 3, entrance: { x: 0, y: 0 }, access: "household", owner: "o", claim: "" }) as Place;
    const sites = [
      { lon: 135.8, lat: 35, year: 1700, settlement: "city" },
      { lon: 127, lat: 37, year: 1700 },
      { lon: 112, lat: 34, year: 1500, settlement: "city" },
      { lon: 0.5, lat: 49, year: 1350 },
      { lon: 4, lat: 51, year: 1650, settlement: "city" },
      { lon: 10, lat: 60, year: 900 },
      { lon: 12, lat: 42, year: 50, settlement: "city" },
      { lon: 12, lat: 42, year: 50, camp: true },
      { lon: 32.8, lat: 37.7, year: -7000, roofHatch: true },
      { lon: -3, lat: 58, year: -3000 },
      { lon: 15, lat: 49, year: -5000 },
      { lon: -100, lat: 44, year: 1850, camp: true },
      { lon: -90, lat: 41, year: 1935, settlement: "village" },
      { lon: -74, lat: 40, year: 1935, settlement: "city" },
      { lon: 75, lat: 26.9, year: 1800, settlement: "city" },
      { lon: 80, lat: 25, year: 1800, settlement: "village" },
      { lon: 8, lat: 30, year: 1000, settlement: "city" },
      { lon: 5, lat: 30, year: 1000, settlement: "village" },
      { lon: 45, lat: 25, year: 600, camp: true },
      { lon: 100, lat: 47, year: 1600, camp: true },
      { lon: 133, lat: -12, year: 1500 },
      { lon: 142, lat: -38, year: 1500 },
      { lon: 10, lat: 50, year: 2000, camp: true },
    ];
    const hit = new Set<string>();
    for (const [i, site] of sites.entries())
      for (const activity of ["Weaving", "Turning pots", "Keeping the record", "Trading", "Hunting", "Household work"])
        for (const fortune of [0.1, 0.5, 0.9])
          for (let n = 0; n < 4; n++) {
            const id = interiorProfileFor(site).id;
            hit.add(id);
            const where = `${id} ${activity} ${fortune} #${n}`;
            const room = buildInterior(place(`t-h${i}-${n}`), site, { fortune, activity });
            const seen = new Set([`${room.entry.x},${room.entry.y}`]);
            for (const k of seen) {
              const [x, y] = k.split(",").map(Number);
              for (const m of [`${x + 1},${y}`, `${x - 1},${y}`, `${x},${y + 1}`, `${x},${y - 1}`]) if (room.walk.has(m)) seen.add(m);
            }
            const reach = (p: { x: number; y: number }) => seen.has(`${p.x},${p.y}`);
            expect(reach(room.exit), where).toBe(true);
            expect(room.entry, where).not.toEqual(room.exit);
            expect([...room.walk].every((k) => seen.has(k)), `${where} has a pocket the door cannot reach`).toBe(true);
            for (const spot of [...room.beds, ...room.work, ...room.fire, ...room.seats])
              // Sat on or lain in, a piece is reached from the floor beside it.
              expect(spot.on ? [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => reach({ x: spot.x + dx, y: spot.y + dy })) : reach(spot), `${where} ${spot.kind}`).toBe(true);
            for (const c of [room.bedCell, room.workCell, room.store])
              expect([c, { x: c.x + 1, y: c.y }, { x: c.x - 1, y: c.y }, { x: c.x, y: c.y + 1 }, { x: c.x, y: c.y - 1 }].some(reach), `${where} station out of reach`).toBe(true);
          }
    expect(hit.size).toBeGreaterThanOrEqual(21);
  });

  it("stands furniture in the house as things that block, shift and break", () => {
    const e = createSettingSession({ ...panelSetting("kyoto", 1700), season: "summer" }, "furniture");
    const home = e.state.households!.find((h) => h.members.includes("player"))!.residence!;
    const room = e.interiorOf(home)!;
    const pieces = room.furniture.map((f) => e.state.objects.find((o) => o.id === `${home}-room-${f.propId}`)!);
    expect(pieces.length).toBeGreaterThan(0);
    for (const [i, o] of pieces.entries())
      for (let dx = 0; dx < room.furniture[i].size[0]; dx++) expect(e.blocked(o.pos.x + dx, o.pos.y, home), o.name).toBe(true);
    const broke = pieces[0];
    broke.broken = true;
    expect(e.blocked(broke.pos.x, broke.pos.y, home)).toBe(false);
    // Nobody is sent to sit at, or work at, what is no longer there.
    const spots = [...room.seats, ...room.work, ...room.fire, ...room.beds].filter((s) => s.propId === room.furniture[0].propId);
    const a = e.state.actors.find((x) => x.kind === "human")!;
    for (let n = 0; n < 6; n++) {
      const at = e.indoorSpot(a, home, "Resting", n);
      expect(spots.some((s) => s.x === at.x && s.y === at.y)).toBe(false);
      expect(e.blocked(at.x, at.y, home)).toBe(false);
    }
  });
});
