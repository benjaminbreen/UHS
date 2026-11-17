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
import type { ComplexHost } from "../src/core/complex";
import { tunnelRun } from "../src/core/sewer";
import { folkDeal, folkOffer, folkTime, type FolkHost } from "../src/core/tunnel-folk";
import { caveFind } from "../src/content/caves";
import { campFinds, cavePeople } from "../src/content/caves/people";
import type { Actor } from "../src/core/types";
import type { Lane } from "../src/world/v3/types";
import { hulls, shipPeople } from "../src/content/ships";
import { DECK, shipLevel, shipSolid } from "../src/world/ship";
import { belowFromPrompt, resolveSetting } from "../src/content/geography/resolve";
import { createSettingSession } from "../src/runtime/session";
import { theban } from "../src/content/tombs/theban";
import { tombLevel, tombPlan, tombWalkable } from "../src/world/tomb";
import { fairLevel, fairSolid, fairWalkable, type FairLevel } from "../src/world/fair";
import { propDefs } from "../src/content/props/catalog";
import { fairPeople, fairs } from "../src/content/fairs";
import { tunnelPerson } from "../src/content/sewers";
import { commonLivelihoods } from "../src/content/characters/livelihoods.generated";
import { arrivalFrom } from "../src/world/complex";

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
        state: { clock: 10000, manifest: { seed: "peril" }, player: { pos: { ...at, space: level.space }, health: 100, inventory: {} }, complex: { kind: "mine", site: level.site, light: "safety-lamp", left: 5000, surge: 0 } },
        world: { pack: { setting: { year: 1880 } } },
        event: (t: string) => said.push(t),
        advance: (n: number) => void (h.state.clock += n),
        hurt: (n: number) => void (h.state.player.health -= n),
        unblock: () => {},
        busy: () => false,
        remember: (t: string) => kept.push(t),
      } as unknown as ComplexHost & { state: { clock: number; player: { health: number } } };
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
      const len = tunnelRun(stay.h.state)!.peril!.cells.length;
      stay.tick(stay.h.state.clock + len * TUB_CELL + 2);
      expect(stay.h.state.player.health).toBe(72);
      expect(tunnelRun(stay.h.state)!.peril).toBeUndefined();

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
      tunnelRun(h.state)!.trapped = { since: h.state.clock, rescue: h.state.clock + 7200 };
      knock(h);
      expect(tunnelRun(h.state)!.trapped!.rescue).toBe(h.state.clock - 600 + 7200 - 900);
      tick(tunnelRun(h.state)!.trapped!.rescue + 2);
      expect(tunnelRun(h.state)!.trapped).toBeUndefined();
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

describe("ships", () => {
  it("lays out every deck of every hull with each ladder and hatch in reach and nobody in the rigging", () => {
    for (const hull of hulls)
      for (let deck = 0; deck <= hull.below.length; deck++) {
        const place = { lon: (hull.where[0][0] + hull.where[0][2]) / 2, lat: (hull.where[0][1] + hull.where[0][3]) / 2, year: Math.min(hull.years[1] - 1, Math.max(hull.years[0], 1800)) };
        const level = shipLevel("s", hull, deck, place), solid = shipSolid(level), { w } = level;
        const open = (i: number) => level.cells[i] === DECK && !solid.has(i);
        const seen = new Set([level.entry.y * w + level.entry.x]);
        expect(open(level.entry.y * w + level.entry.x), `${hull.id} ${deck}`).toBe(true);
        for (const q of seen) for (const n of [q - 1, q + 1, q - w, q + w]) if (!seen.has(n) && open(n)) seen.add(n);
        for (const t of level.things.filter((t) => t.to !== undefined)) {
          const near = [...seen].some((i) => (i % w) >= t.x - 1 && (i % w) <= t.x + t.w && Math.floor(i / w) >= t.y - 1 && Math.floor(i / w) <= t.y + t.h);
          expect(near, `${hull.id} ${deck} ${t.art}`).toBe(true);
          expect(t.to, `${hull.id} ${deck} ${t.art}`).toBeLessThanOrEqual(hull.below.length);
        }
        for (const f of level.folk) expect(open(f.y * w + f.x), `${hull.id} ${deck} ${f.person}`).toBe(true);
      }
  });

  it("dresses everyone aboard and deals only in things that exist", () => {
    for (const p of shipPeople) {
      expect(livelihoodIds, p.id).toContain(p.dress);
      const d = p.deal;
      for (const id of [...Object.keys(d?.gives ?? {}), ...(d?.buys ?? []), ...(Array.isArray(d?.wants) ? d!.wants : [])]) expect(items[id], `${p.id} ${id}`).toBeDefined();
    }
    for (const h of hulls) for (const id of h.people) expect(shipPeople.some((p) => p.id === id), `${h.id} ${id}`).toBe(true);
  });

  it("starts aboard the ship a prompt names", () => {
    expect(belowFromPrompt("a shipwright in amsterdam")).toBeUndefined();
    for (const [q, ship] of [["A merchant on a junk, Guangzhou 1760", "junk"], ["A pilgrim on a dhow", "dhow"], ["A stoker on a steamer, 1912", "steamer"], ["A sailor aboard an East Indiaman, 1780", "indiaman"]] as const) {
      const r = resolveSetting(q);
      expect("setting" in r && [r.setting.below, r.setting.ship], q).toEqual(["ship", ship]);
    }
  });

  it.runIf(!!process.env.FULL)("sails, goes below, makes landfall and puts the player ashore", () => {
    const r = resolveSetting("A sailor aboard an East Indiaman, 1780");
    if (!("setting" in r)) throw new Error(r.error);
    const e = createSettingSession(r.setting, "voyage");
    const shore = { ...e.state.voyage!.shore };
    let n = 0;
    const act = (target: string) => expect(e.act({ actionId: `v${n++}`, expectedRevision: e.state.revision, command: { type: "interact", target, action: "ship" } }).status).toBe("completed");
    expect(e.shipLook()?.hull.id).toBe("indiaman");
    act(e.shipVerb()!.target);
    expect(e.state.player.pos.space).toBe("ship:voyage:1");
    act(e.shipVerb()!.target);
    expect(e.state.player.pos.space).toBe("ship:voyage:0");
    for (let i = 0; i < 60 && !e.state.voyage!.landed; i++) act("ship-rail");
    expect(e.state.voyage!.landed).toBe(true);
    expect(e.state.player.inventory["ships-biscuit"]).toBeGreaterThan(0);
    act("ship-ashore");
    expect(e.state.player.pos).toEqual({ ...shore, space: "outside" });
    expect(e.state.voyage).toBeUndefined();
    expect(e.state.actors.some((a) => a.underground)).toBe(false);
  });
});

describe("fairs", () => {
  it("joins every area of every fair both ways, lands each arrival on open ground, and leaves every way out walkable", () => {
    for (const fair of fairs) {
      const reached = new Set([fair.entry]);
      for (const id of reached) for (const e of fairLevel("seed", fair, id)!.exits) if (e.to !== "outside") reached.add(e.to.split(":")[2]);
      for (const a of fair.areas) {
        const L = fairLevel("seed", fair, a.id)!, solid = fairSolid(L), tag = `${fair.id} ${a.id}`;
        for (const e of L.exits.filter((e) => e.to !== "outside")) {
          const B = fairLevel("seed", fair, e.to.split(":")[2]);
          const at = B && arrivalFrom(B, L.space);
          expect(at, `${tag} -> ${e.to}`).toBeDefined();
          expect(fairWalkable(B!.cells[at!.y * B!.w + at!.x]), `${tag} -> ${e.to}`).toBe(true);
        }
        for (const l of L.lifts) expect(fairLevel("seed", fair, l.to.split(":")[2])!.lifts.some((m) => m.to === L.space), tag).toBe(true);
        if (!a.at) continue;
        expect(reached.has(a.id), `${tag} can be reached from the entry`).toBe(true);
        // On foot from where one arrives to every way out.
        const seen = new Uint8Array(L.w * L.h), queue = [L.entry.y * L.w + L.entry.x];
        seen[queue[0]] = 1;
        for (let q = 0; q < queue.length; q++) for (const n of [queue[q] - 1, queue[q] + 1, queue[q] - L.w, queue[q] + L.w])
          if (n >= 0 && n < L.w * L.h && !seen[n] && fairWalkable(L.cells[n]) && !solid.has(n)) (seen[n] = 1), queue.push(n);
        for (const e of L.exits) expect(seen[(e.y + (e.h >> 1)) * L.w + e.x + (e.w >> 1)], `${tag}: the way to ${e.to}`).toBe(1);
        for (const who of L.folk) expect(tunnelPerson(who.person), `${tag}: ${who.person}`).toBeDefined();
      }
    }
  });

  it("starts a prompt at the fair's gate", () => {
    const r = resolveSetting("A visitor at the Paris Exposition, 1889");
    if (!("setting" in r)) throw new Error(r.error);
    expect(r.setting.below).toBe("fair");
    const e = createSettingSession(r.setting, "fair");
    expect(e.state.player.pos.space).toBe("fair:paris-1889:trocadero");
    expect(e.areaOf("fair:paris-1889:trocadero")).toMatchObject({ kind: "grounds" });
    expect(e.complexMap()?.nodes.filter((n) => n.seen).map((n) => n.name)).toEqual(["the Trocadéro gardens"]);
    expect(e.complexMap()?.nodes.some((n) => !n.seen && n.name === "the Pont d'Iéna")).toBe(true);
  });
});

describe("a fair from a plan", () => {
  it("starts a prompt naming the Health Exhibition at its Exhibition Road entrance", () => {
    const r = resolveSetting("A visitor at the Health Exhibition");
    if (!("setting" in r)) throw new Error(r.error);
    expect(r.setting).toMatchObject({ below: "fair", year: 1884 });
    const e = createSettingSession(r.setting, "fair");
    expect(e.state.player.pos.space).toBe("fair:london-1884:entrance");
    expect(e.complexMap()?.nodes.filter((n) => !n.seen).map((n) => n.name).sort()).toEqual(["Foods: the South Gallery", "the Cheap Dining Room", "the East Arcade: Heating and Cooking Apparatus"]);
  });
  it("staffs the Health Exhibition with people of real livelihoods: a band, scientists, sellers of food", () => {
    const at = (id: string) => fairLevel("seed", fairs.find((f) => f.id === "london-1884")!, id)!.folk.map((f) => f.person);
    expect(at("upper-garden").filter((p) => p === "lhe-bandsman")).toHaveLength(6);
    expect(at("science")).toContain("lhe-measurer");
    expect(at("education")).toContain("lhe-bacteriologist");
    expect(at("bakeries")).toContain("lhe-baker");
    expect(at("baths")).toContain("lhe-bath-attendant");
    expect(at("belgium")).toContain("lhe-belgian");
    expect(at("foods").length).toBeGreaterThan(12);
    for (const p of fairPeople.filter((p) => p.id.startsWith("lhe-") || p.id.startsWith("vrs-"))) expect(commonLivelihoods.some((l) => l.id === p.dress), p.dress).toBe(true);
  });
});

describe("a palace planned as rooms and courts", () => {
  it("starts a courtier in the forecourt of Versailles, with the King's bed and its valet in the bedchamber", () => {
    const r = resolveSetting("A courtier at Versailles");
    if (!("setting" in r)) throw new Error(r.error);
    expect(r.setting).toMatchObject({ below: "fair", year: 1701 });
    const e = createSettingSession(r.setting, "palace");
    expect(e.state.player.pos.space).toBe("fair:versailles:forecourt");
    const bed = e.areaOf("fair:versailles:bedchamber")!;
    expect(bed.things.map((t) => t.art)).toContain("state-bed");
    expect(bed.folk.map((f) => f.person)).toContain("vrs-valet");
    expect(e.areaOf("fair:versailles:mirrors")).toMatchObject({ look: "palace" });
  });

  it("builds Buckingham Palace and the White House from the same kit, each room in its own style", () => {
    for (const [prompt, space, year] of [["A courtier at Buckingham Palace", "fair:buckingham:forecourt", 1856], ["A clerk at the White House", "fair:white-house:north-grounds", 1818]] as const) {
      const r = resolveSetting(prompt);
      if (!("setting" in r)) throw new Error(r.error);
      expect(r.setting).toMatchObject({ below: "fair", year });
      expect(createSettingSession(r.setting, "palace").state.player.pos.space).toBe(space);
    }
    const r = resolveSetting("A clerk at the White House");
    if (!("setting" in r)) throw new Error(r.error);
    const e = createSettingSession(r.setting, "palace");
    const room = (id: string) => e.areaOf(`fair:white-house:${id}`) as FairLevel;
    const blue = room("blue-room"), dining = room("state-dining"), library = room("library");
    expect(blue.palace).toMatchObject({ pier: "fluted", room: "drawing" });
    expect(blue.palace!.cloth).not.toEqual(dining.palace!.cloth);
    expect(blue.props!.map((q) => q.key)).toContain("palace-sofa");
    expect(dining.decor.some((d) => d.type.startsWith("palace:dining:"))).toBe(true);
    expect(library.props!.map((q) => q.key)).toContain("palace-desk");
  });

  it("puts palace furniture in the world as props: carried, sat on, knocked over, opened", () => {
    const r = resolveSetting("A courtier at Versailles");
    if (!("setting" in r)) throw new Error(r.error);
    const e = createSettingSession(r.setting, "palace"), p = e.state.player;
    let n = 0;
    const act = (target: string, action: "pickup" | "use-prop" | "topple" | "look" | "take") => e.act({ actionId: `p${n++}`, expectedRevision: e.state.revision, command: { type: "interact", target, action } }).status;
    const go = (to: string) => { const x = (e.areaOf(p.pos.space) as FairLevel).exits.find((q) => q.to.endsWith(`:${to}`))!; p.pos.x = x.x + (x.w >> 1); p.pos.y = x.y + (x.h >> 1); e.advance(1); };
    for (const to of ["royal-court", "marble-court", "bedchamber", "mirrors"]) go(to);
    const here = () => e.state.objects.filter((o) => o.pos.space === p.pos.space && o.prop?.startsWith("palace-"));
    const stand = (o: { pos: { x: number; y: number } }) => { p.pos.x = o.pos.x; p.pos.y = o.pos.y + 1; };
    expect(here().length).toBeGreaterThan(10);
    // A candlestick comes off its table and is then drawn in the hand, not raised.
    const candle = here().find((o) => o.prop === "palace-candlestick")!;
    expect(candle.sprite).toMatch(/@25$/);
    stand(candle);
    expect(act(candle.id, "pickup")).toBe("completed");
    expect(p.held).toBe(candle.id);
    expect(candle.sprite).not.toMatch(/@/);
    e.act({ actionId: "down", expectedRevision: e.state.revision, command: { type: "interact", target: candle.id, action: "drop" } });
    // A seat is sat on.
    const bench = here().find((o) => propDefs[o.prop!].seat)!;
    stand(bench);
    expect(e.usable()).toMatchObject({ id: bench.id, use: "sit" });
    expect(act(bench.id, "use-prop")).toBe("completed");
    // A bust goes over.
    const bust = here().find((o) => propDefs[o.prop!].topples)!;
    stand(bust);
    expect(act(bust.id, "topple")).toBe("completed");
    expect(bust.tipped).toBe(true);
    // Going out and coming back does not stock the room twice.
    const count = here().length;
    go("bedchamber"); go("mirrors");
    expect(here().length).toBe(count);
  });

  it("lets a sign on the map be read", () => {
    const r = resolveSetting("A weaver in London, 1650");
    if (!("setting" in r)) throw new Error(r.error);
    const e = createSettingSession(r.setting, "signs"), p = e.state.player;
    const sign = e.state.objects.find((o) => propDefs[o.prop ?? ""]?.act && o.pos.space === "outside");
    if (!sign) return;
    p.pos = { ...sign.pos, y: sign.pos.y + 1 };
    expect(e.inspect(sign.id)?.affordances.map((a) => a.label)).toContain("Read it");
    const before = e.state.events.length;
    expect(e.act({ actionId: "read", expectedRevision: e.state.revision, command: { type: "interact", target: sign.id, action: "attend" } }).status).toBe("completed");
    expect(e.state.events.length).toBeGreaterThan(before);
  });

  it("starts a warlord in a generated hall of his own period, and nowhere when no period fits", () => {
    for (const [prompt, kind, seat] of [["A Neolithic warlord", "hall-stone", true], ["A warlord in his mead hall", "hall-lord", true], ["A chieftain in Gaul, 200 BC", "hall-iron", true]] as const) {
      const r = resolveSetting(prompt);
      if (!("setting" in r)) throw new Error(r.error);
      expect(r.setting.venue).toMatch(new RegExp(`^${kind}-\\d$`));
      const e = createSettingSession(r.setting, "palace");
      expect(e.state.player.pos.space).toBe(`fair:${r.setting.venue}:yard`);
      const hall = e.areaOf(`fair:${r.setting.venue}:hall`) as FairLevel;
      expect(hall.palace).toMatchObject({ order: "timber", room: "hall" });
      expect(hall.props!.some((q) => q.key === "palace-highseat")).toBe(seat);
      expect(hall.decor.some((d) => d.type === "palace:hearth")).toBe(true);
    }
    const caesar = resolveSetting("Caesar at home");
    if (!("setting" in caesar)) throw new Error(caesar.error);
    expect(caesar.setting).toMatchObject({ below: "fair", year: -60, role: "Senator" });
    expect(caesar.setting.venue).toMatch(/^domus-\d$/);
    const house = createSettingSession(caesar.setting, "palace");
    expect(house.state.player.pos.space).toBe(`fair:${caesar.setting.venue}:atrium`);
    expect((house.areaOf(`fair:${caesar.setting.venue}:atrium`) as FairLevel).court).toMatchObject({ kind: "pool" });
    expect((house.areaOf(`fair:${caesar.setting.venue}:peristyle`) as FairLevel).court).toMatchObject({ kind: "garden" });
    expect(house.areaOf(`fair:${caesar.setting.venue}:triclinium`)!.props!.filter((q) => q.key.startsWith("palace-lectus"))).toHaveLength(3);
    const modern = resolveSetting("A warlord in Shanghai, 1925");
    if (!("setting" in modern)) throw new Error(modern.error);
    expect(modern.setting.below).toBeUndefined();
  });
});

describe("tombs", () => {
  it("plans a tomb from the seed whose every way lands on open floor and leads back", () => {
    for (const seed of ["a", "b", "c", "d", "e", "f"]) {
      const plan = tombPlan(seed, theban, "theban.0");
      expect(plan[0].role).toBe("entrance");
      expect(plan.filter((a) => a.role === "burial")).toHaveLength(1);
      expect(plan.find((a) => a.role === "burial")!.finds).toContain("sarcophagus");
      for (const a of plan) {
        const L = tombLevel(seed, theban, "theban.0", a.id)!;
        for (const e of L.exits.filter((e) => e.to !== "outside")) {
          const B = tombLevel(seed, theban, "theban.0", Number(e.to.split(":")[2]))!;
          const at = arrivalFrom(B, L.space);
          expect(at, `${seed} ${a.id} -> ${e.to}`).toBeDefined();
          expect(tombWalkable(B.cells[at!.y * B.w + at!.x]), `${seed} ${a.id} -> ${e.to}`).toBe(true);
        }
        for (const l of L.lifts) expect(tombLevel(seed, theban, "theban.0", Number(l.to.split(":")[2]))!.lifts.some((m) => m.to === L.space && m.up !== l.up), `${seed} ${a.id}`).toBe(true);
        expect(L.things.map((t) => t.find)).toEqual(expect.arrayContaining(a.finds.filter((f) => f === "sarcophagus")));
      }
    }
    expect(tombPlan("a", theban, "theban.0")).not.toEqual(tombPlan("b", theban, "theban.0"));
  });

  it("starts a tomb robber on the stair with a lamp, and a walled-up doorway comes down", () => {
    const r = resolveSetting("A tomb robber in Thebes, 1110 BCE");
    if (!("setting" in r)) throw new Error(r.error);
    expect(r.setting.below).toBe("tomb");
    const e = createSettingSession(r.setting, "tomb");
    const run = e.state.complex;
    expect(run?.kind === "tomb" && run.left).toBeGreaterThan(0);
    expect(e.state.player.pos.space).toBe("tomb:theban.0:0");
    expect(e.complexMap()?.nodes.filter((n) => n.seen)).toHaveLength(1);
    // Walk the plan to a sealed area and break in.
    const plan = tombPlan(e.state.manifest.seed, theban, "theban.0"), sealed = plan.find((a) => a.sealed)!;
    const L = e.areaOf(`tomb:theban.0:${sealed.id}`)!, wall = L.things.find((t) => t.find === "blocked-doorway")!;
    expect(e.blocked(wall.x, wall.y, L.space)).toBe(true);
    const beside = [[0, 1], [0, -1], [1, 0], [-1, 0]].map(([dx, dy]) => ({ x: wall.x + dx * (wall.w ?? 1), y: wall.y + dy * (wall.h ?? 1) })).find((q) => !e.blocked(q.x, q.y, L.space))!;
    e.state.player.pos = { ...beside, space: L.space };
    expect(e.act({ actionId: "break", expectedRevision: e.state.revision, command: { type: "interact", target: `tomb-thing:${wall.id}`, action: "complex" } }).status).toBe("completed");
    expect(e.blocked(wall.x, wall.y, L.space)).toBe(false);
  });
});
