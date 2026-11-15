import { describe, expect, it } from "vitest";
import { items } from "../src/content/packs";
import { mineFinds, mineKindOf, minePeople, oreItems } from "../src/content/mines";
import { livelihoodIds } from "../src/content/characters/livelihoods";
import { mineProfiles } from "../src/content/settlements/worksites/mines";
import { personFits, sewerFinds, sewerKindFor, sewerPeople } from "../src/content/sewers";
import { MOTOR_SPANS } from "../src/content/settlements/streets/markings";
import { laneLids } from "../src/render/carriageway";
import { LEDGE, sewerLevel, sewerSolid, walkable, type SewerLevel, type SewerSite } from "../src/world/sewer";
import { FALL_WARN, TUB_CELL, knock, perilField, perilStart, perilTime } from "../src/core/mine-peril";
import type { SewerHost } from "../src/core/sewer";
import { folkDeal, folkOffer, folkTime, type FolkHost } from "../src/core/tunnel-folk";
import { caveFind } from "../src/content/caves";
import { campFinds, cavePeople } from "../src/content/caves/people";
import type { Actor } from "../src/core/types";
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

  describe("accidents", () => {
    const host = (level: SewerLevel, at: { x: number; y: number }) => {
      const solid = sewerSolid(level), said: string[] = [], kept: string[] = [];
      const h = {
        state: { clock: 10000, manifest: { seed: "peril" }, player: { pos: { ...at, space: level.space }, health: 100, inventory: {} }, sewer: { site: level.site, network: "mine", light: "safety-lamp", left: 5000, surge: 0 } },
        world: { pack: { setting: { year: 1880 } } },
        event: (t: string) => said.push(t),
        advance: (n: number) => void (h.state.clock += n),
        hurt: (n: number) => void (h.state.player.health -= n),
        unblock: () => {},
        busy: () => false,
        remember: (t: string) => kept.push(t),
      } as unknown as SewerHost & { state: { clock: number; player: { health: number } } };
      const tick = (until: number) => {
        while (h.state.clock < until) (h.state.clock += 2), perilTime(h, level, solid);
      };
      return { h, solid, said, kept, tick };
    };
    const workings = sewerLevel("a", durham, 2), road = sewerLevel("a", durham, 1);
    const open = (level: SewerLevel) => {
      const i = level.cells.findIndex((c, i) => walkable(c) && i > level.w * 8 && perilField(level, i, new Set()).filter((d) => d >= 0 && d <= 6).length > 20);
      return { x: i % level.w, y: Math.floor(i / level.w) };
    };

    it("brings the roof down on whoever stands still, and not on whoever runs", () => {
      const at = open(workings);
      const still = host(workings, at);
      expect(perilStart(still.h, "fall", workings, still.solid)).toBe(true);
      still.tick(still.h.state.clock + FALL_WARN + 2);
      expect(still.h.state.player.health).toBeLessThan(100);
      expect(still.h.state.mineFalls![workings.space].length).toBeGreaterThan(0);
      const p = still.h.state.player.pos;
      expect(still.solid.has(p.y * workings.w + p.x)).toBe(false);

      const ran = host(workings, at);
      perilStart(ran.h, "fall", workings, ran.solid);
      const far = perilField(workings, at.y * workings.w + at.x, ran.solid).findIndex((d) => d === 6);
      Object.assign(ran.h.state.player.pos, { x: far % workings.w, y: Math.floor(far / workings.w) });
      ran.tick(ran.h.state.clock + FALL_WARN + 2);
      expect(ran.h.state.player.health).toBe(100);
      expect(ran.kept).toContain("You outran a fall of roof.");
    });

    it("runs a loose tub down the rails into whoever stays on them", () => {
      const at = road.cells.findIndex((c, i) => c === LEDGE && road.cells[i - 12] === LEDGE && road.cells[i + 12] === LEDGE);
      const cell = { x: at % road.w, y: Math.floor(at / road.w) };
      const stay = host(road, cell);
      expect(perilStart(stay.h, "tub", road, stay.solid)).toBe(true);
      const len = stay.h.state.sewer!.peril!.cells.length;
      stay.tick(stay.h.state.clock + len * TUB_CELL + 2);
      expect(stay.h.state.player.health).toBe(72);
      expect(stay.h.state.sewer!.peril).toBeUndefined();

      const step = host(road, cell);
      perilStart(step.h, "tub", road, step.solid);
      step.h.state.player.pos.y -= 1;
      step.tick(step.h.state.clock + len * TUB_CELL + 2);
      expect(step.h.state.player.health).toBe(100);
    });

    it("chokes whoever the afterdamp reaches, unless they have a self-rescuer", () => {
      const at = open(workings);
      const bare = host(workings, at);
      expect(perilStart(bare.h, "afterdamp", workings, bare.solid)).toBe(true);
      bare.tick(bare.h.state.clock + 600);
      expect(bare.h.state.player.health).toBeLessThan(100);
      const kit = host(workings, at);
      kit.h.state.player.inventory["self-rescuer"] = 1;
      perilStart(kit.h, "afterdamp", workings, kit.solid);
      kit.tick(kit.h.state.clock + 600);
      expect(kit.h.state.player.health).toBe(100);
    });

    it("digs out a miner shut in behind a fall, sooner for knocking", () => {
      const { h, solid, kept, tick } = host(workings, open(workings));
      h.state.mineFalls = { [workings.space]: [5 * workings.w + 5] };
      solid.add(5 * workings.w + 5);
      h.state.sewer!.trapped = { since: h.state.clock, rescue: h.state.clock + 7200 };
      knock(h);
      expect(h.state.sewer!.trapped!.rescue).toBe(h.state.clock - 600 + 7200 - 900);
      tick(h.state.sewer!.trapped!.rescue + 2);
      expect(h.state.sewer!.trapped).toBeUndefined();
      expect(h.state.mineFalls[workings.space]).toBeUndefined();
      expect(solid.has(5 * workings.w + 5)).toBe(false);
      expect(kept.at(-1)).toMatch(/^You were dug out/);
    });
  });
});

describe("people underground", () => {
  it("names only items, finds and livelihoods that exist", () => {
    for (const p of [...cavePeople, ...sewerPeople.filter((q) => q.deal)]) {
      if (cavePeople.includes(p)) expect(livelihoodIds, p.id).toContain(p.dress);
      if (p.keeps) expect(caveFind(p.keeps), p.id).toBeDefined();
      const d = p.deal;
      for (const id of [...Object.keys(d?.gives ?? {}), ...(d?.buys ?? []), ...(Array.isArray(d?.wants) ? d!.wants : [])]) expect(items[id], `${p.id} ${id}`).toBeDefined();
    }
    for (const f of campFinds) for (const id of Object.keys(f.loot ?? {})) expect(items[id], `${f.id} ${id}`).toBeDefined();
  });

  it("puts somebody in the caves of every inhabited region and age", () => {
    const places: [number, number, number][] = [
      [1, 45, -30000], [1, 45, 1700], [34.8, 38.6, 900], [39, 13, 1500], [37, -1, 1800], [19, -33, 1000], [75, 25, 200], [91, 29.6, 1400],
      [110, 25, 1200], [135.7, 35, 1100], [114, 4, 1700], [133, -12.5, 1500], [-86, 37, 1812], [-89, 20.5, 800], [-72, -13.5, 1400],
      [-77.5, 18.2, 1000], [105, 47, 1600], [10, 62, 1950],
    ];
    for (const [lon, lat, year] of places)
      expect(cavePeople.some((p) => personFits(p, { lon, lat, year }, "karst")), `${lon},${lat} ${year}`).toBe(true);
  });

  it("works, trades and turns on an enemy", () => {
    const said: string[] = [];
    const tosher = sewerPeople.find((p) => p.id === "tosher")!;
    const smuggler = cavePeople.find((p) => p.id === "smugglers-north")!;
    const actor = (id: string, person: string, x: number) =>
      ({ id, name: id, role: "", trust: 0, pos: { x, y: 5, space: "s" }, underground: { person, home: { x, y: 5 }, next: 0 } }) as unknown as Actor;
    const fought: string[] = [];
    const h = {
      state: { clock: 0, manifest: { seed: "folk" }, player: { role: "Riding officer", pos: { x: 5, y: 7, space: "s" }, health: 100, inventory: { bread: 1 } }, actors: [actor("folk-a-0", tosher.id, 5), actor("folk-b-1", smuggler.id, 9), actor("folk-b-2", smuggler.id, 10)] },
      event: (t: string) => said.push(t),
      advance: (n: number) => void (h.state.clock += n),
      hurt: () => {},
      join: () => {},
      itemName: (id: string) => id,
      value: () => 1,
      edible: (id: string) => id === "bread",
      coined: () => true,
      provoke: (a: Actor, fight: boolean) => void fought.push(`${a.id}:${fight}`),
      remember: () => {},
    } as unknown as FolkHost;
    expect(folkOffer(h, h.state.actors[0])?.enabled).toBe(true);
    expect(folkDeal(h, "folk-a-0")).toBe(true);
    expect(h.state.clock).toBe(tosher.deal!.time);
    expect(folkOffer(h, h.state.actors[0])?.enabled).toBe(false);
    folkTime(h, "s", () => true);
    expect(said.some((t) => t.includes(smuggler.threat!))).toBe(true);
    expect(fought).toEqual(["folk-b-1:true", "folk-b-2:true"]);
  });
});
