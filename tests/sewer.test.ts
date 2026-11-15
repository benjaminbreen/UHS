import { describe, expect, it } from "vitest";
import { items } from "../src/content/packs";
import { mineFinds, mineKindOf, minePeople, oreItems } from "../src/content/mines";
import { livelihoodIds } from "../src/content/characters/livelihoods";
import { mineProfiles } from "../src/content/settlements/worksites/mines";
import { personFits, sewerFinds, sewerKindFor, sewerPeople } from "../src/content/sewers";
import { MOTOR_SPANS } from "../src/content/settlements/streets/markings";
import { laneLids } from "../src/render/carriageway";
import { sewerLevel, walkable, type SewerLevel, type SewerSite } from "../src/world/sewer";
import type { Lane } from "../src/world/v3/types";

const site = (id: string, place: SewerSite["place"]): SewerSite => {
  const kind = sewerKindFor(place);
  return { id, network: "sewer", kind, place, people: sewerPeople.filter((p) => personFits(p, place, kind)) };
};

/** Every walkable cell, every ladder and the way down reached from the entry. */
function joined(level: SewerLevel) {
  const { w, h, cells } = level;
  const seen = new Uint8Array(w * h);
  const queue = [level.entry.y * w + level.entry.x];
  seen[queue[0]] = 1;
  for (let q = 0; q < queue.length; q++)
    for (const n of [queue[q] - 1, queue[q] + 1, queue[q] - w, queue[q] + w])
      if (!seen[n] && walkable(cells[n])) (seen[n] = 1), queue.push(n);
  const near = (x: number, y: number) => [[0, 0], [0, 1], [1, 0], [-1, 0], [0, -1]].some(([dx, dy]) => seen[(y + dy) * w + x + dx]);
  return level.shafts.every((s) => near(s.x, s.y)) && (!level.down || near(level.down.x, level.down.y));
}

describe("sewers", () => {
  const london = site("0,0", { lon: -0.12, lat: 51.5, year: 1955 });

  it("builds every level joined up, whatever the streets", () => {
    for (const seed of ["a", "b", "c"])
      for (const depth of [1, 2, 3]) {
        const level = sewerLevel(seed, london, depth);
        expect(joined(level), `${seed} ${depth}`).toBe(true);
        expect(level.things.length).toBeGreaterThan(3);
      }
  });

  it("lays the street level under a grid of streets, with a ladder under each lid", () => {
    const span = MOTOR_SPANS[1];
    const marks = { id: "t", drive: "left", centre: "white-dashed", lanes: false, crossing: "zebra", stopLine: true, gutter: "concrete", parking: false, tactile: "none" } as const;
    // Streets every 20 cells each way.
    const lane = (x: number, y: number): Lane | undefined => {
      const mx = ((x % 20) + 20) % 20, my = ((y % 20) + 20) % 20;
      const onX = my < span, onY = mx < span;
      if (onX && onY) return { axis: "x", at: my, span, marks, junction: true };
      if (onX) return { axis: "x", at: my, span, marks };
      if (onY) return { axis: "y", at: mx, span, marks };
    };
    const probe = { lane, lids: (x: number, y: number) => (lane(x, y) ? laneLids(lane(x, y)!, x, y) : []) };
    let entry: [number, number] | undefined;
    for (let x = 0; x < 2000 && !entry; x++) for (let y = 0; y < span; y++) if (x % 20 >= 8 && probe.lids(x, y).length) entry = [x, y];
    expect(entry).toBeDefined();
    const level = sewerLevel("grid", site(entry!.join(","), london.place), 1, probe);
    expect(level.ox).toBe(entry![0] - 36);
    expect(level.shafts.filter((s) => s.to === "street").length).toBeGreaterThan(1);
    expect(joined(level)).toBe(true);
  });

  it("names only items that exist, and has someone and something for every modern town", () => {
    for (const f of sewerFinds) for (const id of Object.keys(f.loot ?? {})) expect(items[id], `${f.id} ${id}`).toBeDefined();
    for (const p of sewerPeople) for (const id of p.goods ?? []) expect(items[id], `${p.id} ${id}`).toBeDefined();
    expect(sewerKindFor({ lon: -149.57, lat: -17.54, year: 1985 })).toBe("tropical");
    expect(sewerKindFor({ lon: 2.35, lat: 48.86, year: 1970 })).toBe("gallery");
    expect(sewerKindFor({ lon: 37.6, lat: 55.75, year: 1980 })).toBe("collector");
  });
});

describe("mines", () => {
  const mine = (ore: string, place: SewerSite["place"], shaft: boolean): SewerSite => {
    const kind = mineKindOf(ore);
    return { id: "10,10", network: "mine", kind, ore, shaft, place, people: minePeople.filter((p) => personFits(p, place, kind, undefined, ore)) };
  };
  const durham = mine("coal", { lon: -1.6, lat: 54.8, year: 1880 }, true);

  it("builds every level of every kind of mine joined up, with people at work", () => {
    for (const site of [durham, mine("tin", { lon: -5.2, lat: 50.2, year: 1820 }, false), mine("salt", { lon: 20.05, lat: 49.98, year: 1900 }, false)])
      for (const seed of ["a", "b"])
        for (const depth of [1, 2, 3]) {
          const level = sewerLevel(seed, site, depth);
          expect(level.space).toBe(`mine:10,10:${depth}`);
          expect(joined(level), `${site.ore} ${seed} ${depth}`).toBe(true);
          expect(level.things.length).toBeGreaterThan(3);
          if (depth === 1) expect(level.mouth).toBe(site.shaft ? "cage" : "adit");
        }
    expect(sewerLevel("a", durham, 2).folk.length).toBeGreaterThan(1);
  });

  it("names only items and livelihoods that exist, whatever the mine works", () => {
    for (const ore of new Set(mineProfiles.map((p) => p.ore!))) for (const id of Object.values(oreItems(ore))) expect(items[id], ore).toBeDefined();
    for (const f of mineFinds) for (const id of Object.keys(f.loot ?? {})) if (id !== "ore" && id !== "ore-rich") expect(items[id], `${f.id} ${id}`).toBeDefined();
    for (const p of minePeople) {
      expect(livelihoodIds, p.id).toContain(p.dress);
      for (const id of p.goods ?? []) expect(items[id], `${p.id} ${id}`).toBeDefined();
    }
    expect(mineProfiles.every((p) => p.ore)).toBe(true);
  });
});

