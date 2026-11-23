import { describe, expect, it } from "vitest";
import { exhibitIcon } from "../src/render/fair/items";
import { paintFairCase, paintFairThing } from "../src/render/fair/things";
import type { ComplexHost } from "../src/core/complex";
import { fairInspect } from "../src/core/fair";
import { resolveSetting } from "../src/content/geography/resolve";
import { theban } from "../src/content/tombs/theban";
import { crypt } from "../src/content/tombs/crypt";
import { sewerLevel, WALL } from "../src/world/sewer";
import { tombLevel, tombPlan, tombWalkable } from "../src/world/tomb";
import { fairLevel, fairSolid, fairWalkable, type FairLevel } from "../src/world/fair";
import { propDefs } from "../src/content/props/catalog";
import { FAIR_SIZES, fairAt, fairFind, fairPeople, fairs } from "../src/content/fairs";
import { tunnelPerson } from "../src/content/sewers";
import { commonLivelihoods } from "../src/content/characters/livelihoods.generated";
import { arrivalFrom } from "../src/world/complex";
import { mapForCoordinate, tileCentre } from "../src/world/travel/network";
import { smallSession } from "./fixtures";

describe("fairs", () => {
  it("places full-sized fittings on the floor with collision footprints and source inspection", () => {
    let furnishings = 0;
    for (const fair of fairs) for (const area of fair.areas) {
      const level = fairLevel("scale-review", fair, area.id)!, solid = fairSolid(level);
      for (const display of level.cases) for (const f of display.finds) {
        expect(f.on).toBe("case");
        expect(f.catalog?.icon, f.name).toBeDefined();
      }
      for (const thing of level.things) {
        const f = fairFind(thing.find)!;
        if (!f.catalog || f.on !== "floor") continue;
        furnishings++;
        const [w, h] = FAIR_SIZES[f.art]!;
        expect([thing.w, thing.h], f.name).toEqual([w, h]);
        expect(f.catalog.icon, f.name).toBeUndefined();
        for (let y = thing.y; y < thing.y + h; y++) for (let x = thing.x; x < thing.x + w; x++)
          expect(solid.has(y * level.w + x), f.name).toBe(true);
        const sprite = paintFairThing(f.art, w, h, f.catalog.variant ?? 0)!;
        expect(sprite.r.w > 16 || sprite.r.h > 16, f.name).toBe(true);
        const host = {
          state: { manifest: { seed: "scale-review" }, player: { pos: { ...level.entry, space: level.space }, inventory: {} }, complex: { kind: "fair", fair: fair.id } },
          areas: new Map([[level.space, { level, solid }]]),
        } as unknown as ComplexHost;
        expect(fairInspect(host, "fair-thing:" + thing.id)).toMatchObject({ name: f.name, source: f.source, affordances: [] });
      }
    }
    expect(furnishings).toBeGreaterThan(0);
  });

  it("varies reusable exhibit families in silhouette and material", () => {
    for (const kind of ["bottle", "jar", "vase", "book", "bolt", "lock", "stockings"] as const) {
      const images = Array.from({ length: 6 }, (_, i) => exhibitIcon(kind, i / 6).data);
      expect(new Set(images.map((r) => r.join(","))).size, kind).toBe(6);
      expect(new Set(images.map((r) => r.filter((_, i) => i % 4 === 3).join(","))).size, kind).toBeGreaterThanOrEqual(2);
    }
    const london = fairs.find((f) => f.id === "london-1884")!;
    expect(london.finds.find((f) => f.name === "Ornamental Locks and Keys")?.catalog?.icon).toBe("lock");
    expect(london.finds.find((f) => f.name === "Boxes of Tools")).toMatchObject({ art: "toolset", on: "floor", w: 3, h: 2 });
    expect(fairs.flatMap((f) => f.finds).find((f) => f.name === "Campbell Lock-stitch Sewing Machines")).toMatchObject({ art: "sewingmachine", on: "floor" });
    const copper = london.finds.find((f) => f.name === "Copper Sitz Bath in Cabinet Work");
    expect(copper).toMatchObject({ art: "bath", on: "floor", w: 3, h: 2, catalog: { variant: 0.45 } });
  });

  it("gives catalog objects their own silhouettes and preserves the published case metals", () => {
    const paris = fairs.find((f) => f.id === "paris-1889")!;
    const london = fairs.find((f) => f.id === "london-1884")!;
    const chicago = fairs.find((f) => f.id === "chicago-1893")!;
    const icon = (fair: typeof paris, name: string) => fair.finds.find((f) => f.name === name)!.catalog!;
    expect(icon(paris, "Kodak camera").icon).toBe("kodak");
    expect(icon(paris, "Waterbury pocket watch").icon).toBe("longwind");
    expect(icon(paris, "Sheffield crème dentifrice in a tube").icon).toBe("dentifrice");
    expect(icon(london, "Tourist Filtre Rapide").icon).toBe("travelfilter");
    expect(icon(london, "Pears' Soap").icon).toBe("soap");
    expect(icon(london, "Writing materials and copy books").icon).toBe("book");
    expect(icon(london, "Bolding's Patent Bottle Trap").icon).toBe("pipe");
    expect(icon(chicago, "Heinz pickles").icon).toBe("picklejar");
    expect(icon(chicago, "Heinz pickle watch charm").icon).toBe("picklecharm");
    const gold = icon(paris, "Gold-cased Trenton watch"), nickel = icon(paris, "Nickel-cased Trenton watch");
    expect(exhibitIcon(gold.icon!, gold.variant!).data).not.toEqual(exhibitIcon(nickel.icon!, nickel.variant!).data);
    expect(exhibitIcon("longwind", 0).data).not.toEqual(exhibitIcon("watch", 0).data);
    expect(exhibitIcon("kodak", 0).data).not.toEqual(exhibitIcon("camera", 0).data);
    expect(exhibitIcon("picklejar", 0).data).not.toEqual(exhibitIcon("jar", 0).data);
  });

  it("sends a Chicago World's Fair prompt to the Columbian Exposition", () => {
    const resolved = resolveSetting("A visitor at the Chicago World's Fair, 1893");
    expect(resolved).toMatchObject({ setting: { location: "Chicago", year: 1893, below: "fair" } });
    if (!("setting" in resolved)) throw Error(resolved.error);
    const centre = tileCentre(mapForCoordinate(resolved.setting));
    const chicago = fairAt(centre.lon, centre.lat, resolved.setting.year)!;
    expect(chicago.id).toBe("chicago-1893");
    const electricity = fairLevel("seed", chicago, "electricity")!;
    expect(electricity.cases.flatMap((c) => c.finds).some((f) => f.name === "Westinghouse stopper lamp")).toBe(true);
  });

  it("draws hundreds of source-linked casefuls from the catalog and keeps their aisles open", () => {
    const ids = new Set<string>();
    let casefuls = 0, placed = 0;
    for (const fair of fairs) {
      const sections = new Map<string, number>();
      for (const f of fair.finds.filter((f) => f.on === "case")) {
        expect(ids.has(f.id), f.id).toBe(false);
        ids.add(f.id);
        expect(f.source?.url).toMatch(/^https:\/\/.+(?:#page=\d+|\/page\/\d+\/mode\/1up)$/);
        const art = f.catalog!;
        expect(exhibitIcon(art.icon!, art.variant ?? 0).data.some((value, i) => i % 4 === 3 && value > 0), f.name).toBe(true);
        expect(fair.areas.some((a) => a.id === f.tags[0]), f.name).toBe(true);
        const key = `${f.tags[0]}/${art.section}`;
        sections.set(key, (sections.get(key) ?? 0) + 1);
      }
      for (const size of sections.values()) casefuls += Math.ceil(size / 4);
      for (const a of fair.areas) {
        const level = fairLevel("seed", fair, a.id)!;
        const solid = fairSolid(level), finds = new Set<string>();
        for (const d of level.cases) {
          placed++;
          const { cabinet, items } = paintFairCase(d);
          for (const item of items) {
            expect(cabinet.ox - item.ox).toBeGreaterThanOrEqual(0);
            expect(cabinet.oy - item.oy).toBeGreaterThanOrEqual(0);
            expect(cabinet.ox - item.ox + item.r.w).toBeLessThanOrEqual(cabinet.r.w);
            expect(cabinet.oy - item.oy + item.r.h).toBeLessThanOrEqual(cabinet.r.h);
          }
          expect(level.decor.some((c) => c.type === "column" && c.x >= d.x && c.x < d.x + d.w && c.y > d.y && c.y - d.y <= 3)).toBe(false);
          expect(d.finds.length).toBeGreaterThanOrEqual(1);
          expect(d.finds.length).toBeLessThanOrEqual(4);
          for (const f of d.finds) {
            expect(f.catalog?.section).toBe(d.name);
            expect(f.tags).toContain(a.id);
            expect(finds.has(f.id), f.name).toBe(false);
            finds.add(f.id);
          }
          for (let x = d.x; x < d.x + d.w; x++)
            expect(solid.has(d.y * level.w + x)).toBe(true);
          expect(solid.has((d.y + 1) * level.w + d.x + Math.floor(d.w / 2))).toBe(false);
        }
      }
    }
    expect(casefuls).toBeGreaterThanOrEqual(200);
    expect(placed).toBeGreaterThanOrEqual(200);
  });

  it("inspects a display case and each of its catalog entries through the same focus card", () => {
    const fair = fairs.find((f) => f.id === "london-1884")!;
    const level = fairLevel("seed", fair, "foods")!;
    const display = level.cases.find((c) => c.finds.some((f) => f.name === "Kepler Cod Liver Oil"))!;
    const solid = fairSolid(level);
    const state = {
      manifest: { seed: "seed" },
      player: { pos: { ...level.entry, space: level.space }, inventory: {} },
      complex: { kind: "fair", fair: fair.id },
    };
    const host = { state, areas: new Map([[level.space, { level, solid }]]) } as unknown as ComplexHost;
    const cabinet = fairInspect(host, display.id)!;
    const item = cabinet.exhibits?.find((f) => f.name === "Kepler Cod Liver Oil")!;
    expect(cabinet.name).toBe("Tonics and remedies");
    expect(fairInspect(host, item.id)).toMatchObject({
      name: "Kepler Cod Liver Oil", source: { label: expect.stringContaining("entry 194"), photo: { url: expect.stringContaining("sciencemuseumgroup") } },
    });
    expect(fairInspect(host, display.id + "#99")).toBeUndefined();
  });

  it.each([
    ["paris-1889", "dome-hall", ["hollerith-tabulator", "remington-standard"]],
  ] as const)("places named exhibits on a single accessible table at %s", (fairId, area, ids) => {
    const fair = fairs.find((f) => f.id === fairId)!;
    const level = fairLevel("seed", fair, area)!;
    const table = level.decor.find((d) => d.type.startsWith("table:empty:"))!;
    const solid = fairSolid(level);
    const artifacts = level.things.filter((t) => fairFind(t.find)?.on === "table");
    expect(artifacts.map((t) => t.find)).toEqual(ids);
    let x = table.x + 1;
    for (const t of artifacts) {
      expect(t).toMatchObject({ x, y: table.y, solid: false });
      expect(fairFind(t.find)?.source?.photo?.url).toMatch(/^https:\/\//);
      for (let i = x; i < x + (t.w ?? 1); i++) {
        expect(solid.has(t.y * level.w + i)).toBe(true);
        expect(solid.has((t.y + 1) * level.w + i)).toBe(false);
      }
      x += t.w ?? 1;
    }
  });

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
    const e = smallSession(r.setting, "fair");
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
    const e = smallSession(r.setting, "fair");
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
  it("starts a visitor in the forecourt of Versailles, with the King's bed and its valet in the bedchamber", () => {
    const r = resolveSetting("A visitor at Versailles");
    if (!("setting" in r)) throw new Error(r.error);
    expect(r.setting).toMatchObject({ below: "fair", year: 1701 });
    const e = smallSession(r.setting, "palace");
    expect(e.state.player.pos.space).toBe("fair:versailles:forecourt");
    const bed = e.areaOf("fair:versailles:bedchamber")!;
    expect(bed.things.map((t) => t.art)).toContain("state-bed");
    expect(bed.folk.map((f) => f.person)).toContain("vrs-valet");
    expect(e.areaOf("fair:versailles:mirrors")).toMatchObject({ look: "palace" });
  });

  it("builds Buckingham Palace and the White House from the same kit, each room in its own style", () => {
    const palace = (prompt: string, year: number) => {
      const r = resolveSetting(prompt);
      if (!("setting" in r)) throw new Error(r.error);
      expect(r.setting).toMatchObject({ below: "fair", year });
      return smallSession(r.setting, "palace");
    };
    expect(palace("A visitor at Buckingham Palace", 1856).state.player.pos.space).toBe("fair:buckingham:forecourt");
    const e = palace("A clerk at the White House", 1818);
    expect(e.state.player.pos.space).toBe("fair:white-house:office");
    const room = (id: string) => e.areaOf(`fair:white-house:${id}`) as FairLevel;
    const blue = room("blue-room"), dining = room("state-dining"), library = room("library");
    expect(blue.palace).toMatchObject({ pier: "fluted", room: "drawing" });
    expect(blue.palace!.cloth).not.toEqual(dining.palace!.cloth);
    expect(blue.props!.map((q) => q.key)).toContain("palace-sofa");
    expect(dining.decor.some((d) => d.type.startsWith("palace:dining:"))).toBe(true);
    expect(library.props!.map((q) => q.key)).toContain("palace-desk");
  });

  it("puts palace furniture in the world as props: carried, sat on, knocked over, opened", () => {
    const r = resolveSetting("A visitor at Versailles");
    if (!("setting" in r)) throw new Error(r.error);
    const e = smallSession(r.setting, "palace"), p = e.state.player;
    let n = 0;
    const act = (target: string, action: "pickup" | "use-prop" | "topple" | "look" | "take") => e.act({ actionId: `p${n++}`, expectedRevision: e.state.revision, command: { type: "interact", target, action } }).status;
    const go = (to: string) => { const x = (e.areaOf(p.pos.space) as FairLevel).exits.find((q) => q.to.endsWith(`:${to}`))!; p.pos.x = x.x + (x.w >> 1); p.pos.y = x.y + (x.h >> 1); e.advance(1); };
    for (const to of ["royal-court", "guard-room", "antechamber", "mirrors"]) go(to);
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
    go("antechamber"); go("mirrors");
    expect(here().length).toBe(count);
  });

  it("makes exhibits props with acts: looked at closely for nothing, bought for coin", () => {
    const r = resolveSetting("A visitor at Versailles");
    if (!("setting" in r)) throw new Error(r.error);
    const e = smallSession(r.setting, "palace"), p = e.state.player;
    const go = (to: string) => { const x = (e.areaOf(p.pos.space) as FairLevel).exits.find((q) => q.to.endsWith(`:${to}`))!; p.pos.x = x.x + (x.w >> 1); p.pos.y = x.y + (x.h >> 1); e.advance(1); };
    const attend = (id: string) => e.act({ actionId: `a${e.state.revision}`, expectedRevision: e.state.revision, command: { type: "interact", target: id, action: "attend" } }).status;
    for (const to of ["royal-court", "guard-room", "antechamber", "bedchamber"]) go(to);
    const bed = e.state.objects.find((o) => o.prop === "exhibit-kings-bed" && o.pos.space === p.pos.space)!;
    expect(bed.sprite).toMatch(/^made:exhibit:versailles:bedchamber:kings-bed:/);
    p.pos = { ...bed.pos, y: bed.pos.y + 1 };
    expect(e.inspect(bed.id)).toMatchObject({ description: expect.stringContaining("crimson and gold") });
    expect(e.usable()).toMatchObject({ id: bed.id, label: "Look closely" });
    expect(attend(bed.id)).toBe("completed");
    expect(e.state.events.at(-1)!.text).toContain("Nobody passes the rail");
    // The area no longer offers it by its own system.
    expect(e.complexVerb()).toBeUndefined();
    for (const to of ["antechamber", "guard-room", "royal-court", "grand-commun"]) go(to);
    const stall = e.state.objects.find((o) => o.prop === "exhibit-serdeau" && o.pos.space === p.pos.space)!;
    p.pos = { ...stall.pos, y: stall.pos.y + 1 };
    p.inventory.coin = 0;
    expect(e.inspect(stall.id)!.affordances.find((a) => a.label === "Buy a plate")).toMatchObject({ enabled: false, reason: "Not enough money" });
    p.inventory.coin = 3;
    expect(attend(stall.id)).toBe("completed");
    expect(p.inventory.coin).toBe(2);
  });

  it("lets a sign on the map be read", () => {
    const r = resolveSetting("A weaver in London, 1650");
    if (!("setting" in r)) throw new Error(r.error);
    const e = smallSession(r.setting, "signs"), p = e.state.player;
    const prop = Object.keys(propDefs).find((k) => propDefs[k].act?.verb === "Read it")!;
    const sign = { id: "test-sign", name: "Guild sign", kind: "monument" as const, prop, sprite: propDefs[prop].sprite ?? prop, pos: { ...p.pos, y: p.pos.y - 1 }, inventory: {} };
    e.state.objects.push(sign);
    expect(e.inspect(sign.id)?.affordances.map((a) => a.label)).toContain("Read it");
    const before = e.state.events.length;
    expect(e.act({ actionId: "read", expectedRevision: e.state.revision, command: { type: "interact", target: sign.id, action: "attend" } }).status).toBe("completed");
    expect(e.state.events.length).toBeGreaterThan(before);
  });

  it("gives every palace door a way back and every room a way in", () => {
    for (const fair of fairs.filter((f) => f.look === "palace")) {
      const levels = new Map(fair.areas.map((a) => [a.id, fairLevel("doors", fair, a.id)!]));
      const ways = (id: string) => levels.get(id)!.exits.map((x) => x.to.split(":").pop()!).filter((to) => to !== "outside");
      for (const id of levels.keys()) for (const to of ways(id)) expect(ways(to), `${fair.id}: ${to} back to ${id}`).toContain(id);
      const seen = new Set([fair.entry]), queue = [fair.entry];
      while (queue.length) for (const to of ways(queue.pop()!)) if (!seen.has(to)) seen.add(to), queue.push(to);
      expect([...levels.keys()].filter((id) => !seen.has(id)), fair.id).toEqual([]);
    }
  });

  it("lays a palace out the way its builders did, with the private rooms last", () => {
    const start = (prompt: string) => {
      const r = resolveSetting(prompt);
      if (!("setting" in r)) throw new Error(r.error);
      const fair = fairs.find((f) => f.id === r.setting.venue)!;
      return { venue: r.setting.venue, room: (id: string) => fairLevel("palace", fair, id)! };
    };
    const ways = (L: FairLevel) => L.exits.map((x) => x.to.split(":").pop()).sort();
    const has = (L: FairLevel, kind: string) => L.props!.some((q) => q.key === `palace-${kind}`);
    // Versailles: the King's rooms in a row, each reached only through the one before.
    const king = start("A visitor at Versailles");
    expect(ways(king.room("bedchamber"))).toEqual(["antechamber", "cabinet"]);
    expect(ways(king.room("antechamber"))).toEqual(["bedchamber", "guard-room", "mirrors"]);
    expect(has(king.room("guard-room"), "armsrack")).toBe(true);
    expect(has(king.room("chapel"), "altar")).toBe(true);
    expect(has(king.room("bedchamber"), "bed")).toBe(false);
    // A manor: the lord's chamber past one end of the hall, the service past the other.
    const manor = start("A baron in his manor, 1300");
    expect(manor.venue).toMatch(/^manor-\d$/);
    expect(ways(manor.room("hall"))).toEqual(["buttery", "chamber", "pantry", "yard"]);
    expect(ways(manor.room("buttery"))).toEqual(["hall"]);
    expect(ways(manor.room("kitchen"))).toEqual(["pantry", "yard"]);
    expect(manor.room("chamber").w).toBeLessThan(20);
    expect(has(manor.room("chamber"), "bed")).toBe(true);
    expect(has(manor.room("kitchen"), "cauldron")).toBe(true);
    // A Baroque palace: guard room, antechamber, bedchamber, cabinet.
    const palace = start("A courtier in a palace in Vienna, 1750");
    expect(palace.venue).toMatch(/^palace-baroque-\d$/);
    expect(ways(palace.room("guard-room"))).toEqual(["antechamber", "vestibule"]);
    expect(ways(palace.room("bedchamber"))).toEqual(["antechamber", "cabinet"]);
    expect(ways(palace.room("cabinet"))).toEqual(["bedchamber"]);
    expect(has(palace.room("bedchamber"), "bed")).toBe(true);
    expect(has(palace.room("bath"), "tub")).toBe(true);
    // A nineteenth-century house: every room off the corridor.
    const house = start("A guest at a country house in Kent, 1880");
    expect(house.venue).toMatch(/^palace-house-\d$/);
    for (const id of ["dining-room", "library"]) expect(ways(house.room(id))).toEqual(["corridor"]);
    expect(ways(house.room("bathroom"))).toEqual(["bedroom"]);
    // A Roman house: the kitchen and the bath off the garden court.
    const domus = start("Caesar at home");
    expect(has(domus.room("kitchen"), "focus")).toBe(true);
    expect(domus.room("bath").court).toMatchObject({ kind: "pool" });
    expect(ways(domus.room("bedroom"))).toEqual(["atrium"]);
    // A pillared hall on its line from the gate: court, porch, hall and throne, and the ruler's own rooms behind the throne.
    for (const [prompt, kind, columns] of [["A scribe in Pharaoh's palace", "palace-egypt", "papyrus"], ["A satrap's palace", "palace-persia", "persian"], ["A wanax in his megaron", "palace-aegean", "aegean"]] as const) {
      const court = start(prompt), hall = court.room("hall");
      expect(court.venue).toMatch(new RegExp(`^${kind}-\\d$`));
      expect(hall.palace).toMatchObject({ order: "pillared", columns });
      expect(has(hall, "daisthrone")).toBe(true);
      expect(hall.decor.filter((d) => d.type === "palace:pillar").length).toBeGreaterThanOrEqual(4);
      expect(hall.decor.some((d) => d.type === "palace:roundhearth")).toBe(columns === "aegean");
      expect(ways(court.room("porch"))).toEqual(["court", "guard", "hall", "stores"]);
      expect(ways(court.room("chamber"))).toEqual(["bath", "hall"]);
    }
    // A hall of posts and screens: courts on a line in China, rooms stepping back corner to corner in Japan.
    const china = start("A eunuch in the Forbidden City"), japan = start("A retainer in the shogun's palace");
    expect(china.venue).toMatch(/^palace-china-\d$/);
    expect(china.room("hall").palace).toMatchObject({ order: "screened", columns: "lacquer" });
    expect(ways(china.room("hall"))).toEqual(["guard", "inner-court", "outer-court", "study"]);
    expect(ways(china.room("bedchamber"))).toEqual(["bath", "inner-court"]);
    expect(china.room("hall").decor.some((d) => d.type === "palace:pillar")).toBe(true);
    expect(japan.venue).toMatch(/^palace-japan-\d$/);
    expect(japan.room("great-room").palace).toMatchObject({ columns: "cypress", floor: "tatami" });
    expect(ways(japan.room("great-room"))).toEqual(["garden", "guard", "inner-room", "waiting-room"]);
    expect(ways(japan.room("private-room"))).toEqual(["bath", "garden", "inner-room"]);
    expect(has(japan.room("great-room"), "zabuton")).toBe(true);
    expect(japan.room("great-room").decor.some((d) => d.type === "palace:pillar")).toBe(false);
    for (const court of [china, japan]) expect(has(court.room(court === china ? "hall" : "great-room"), "daisthrone")).toBe(true);
    // Variants of those: a king's hall in stone, an Inca's in fitted blocks; an Islamic and a Mexica palace on columns.
    const castle = start("A late medieval king"), divan = start("A sultan in Istanbul, 1600"), tecpan = start("An Aztec noble"), kancha = start("An Inca noble in Cusco");
    expect(castle.venue).toMatch(/^palace-gothic-\d$/);
    expect(castle.room("hall").palace).toMatchObject({ order: "timber", walling: "stone" });
    expect(ways(castle.room("privy-chamber"))).toEqual(["great-chamber"]);
    expect(divan.venue).toMatch(/^palace-islamic-\d$/);
    expect(divan.room("pool-court").court).toMatchObject({ kind: "pool" });
    expect(divan.room("inner-court").court).toMatchObject({ kind: "garden" });
    expect(ways(divan.room("bedchamber"))).toEqual(["inner-court"]);
    expect(tecpan.venue).toMatch(/^palace-mexica-\d$/);
    expect(tecpan.room("hall").palace).toMatchObject({ order: "pillared", columns: "mexica" });
    expect(kancha.venue).toMatch(/^palace-inca-\d$/);
    expect(kancha.room("hall").palace).toMatchObject({ order: "timber", walling: "ashlar" });
    // Nobody built any of these in Haiti.
    const far = resolveSetting("A servant in a palace in Haiti, 1750");
    if (!("setting" in far)) throw new Error(far.error);
    expect(far.setting.venue).toBeUndefined();
  });

  it("carries the requested identity and room through the procedural start", () => {
    for (const [prompt, role, sex, room] of [
      ["a Roman noblewoman", "Noblewoman", "female", "atrium"],
      ["Richard Nixon", "President", "male", "oval-office"],
      ["Senator Richard Nixon", "Senator", "male", "chamber"],
      ["Margaret Chase Smith", "Senator", "female", "chamber"],
      ["an empress in Beijing, 1750", "Empress", "female", "hall"],
      ["a Roman nobleman in the kitchen, 100 CE", "Nobleman", "male", "kitchen"],
    ] as const) {
      const r = resolveSetting(prompt);
      if (!("setting" in r)) throw new Error(r.error);
      expect(r.needsInterpretation, prompt).toBe(false);
      expect(r.setting).toMatchObject({ role, venueRoom: room, brief: { sex } });
      if (prompt === "Richard Nixon") expect(r.setting).toMatchObject({
        characterName: prompt, placeId: "city-washington-d-c", year: 1970, character: { age: 57 }, brief: { figure: prompt },
      });
    }
    expect(resolveSetting("Richard Nixon, 1850")).toHaveProperty("error");
    expect(resolveSetting("Richard Nixon in Paris, 1970")).toHaveProperty("error");
  });

  it("starts the people of a ruler's household inside it, by the post the prompt names", () => {
    const at = (prompt: string, seed?: string) => {
      const r = resolveSetting(prompt, seed);
      if (!("setting" in r)) throw new Error(r.error);
      return r.setting;
    };
    for (const [prompt, kind, role, work] of [
      ["A late medieval king", "palace-gothic", "King", "ruler"], ["A sultan in Istanbul, 1600", "palace-islamic", "Sultan", "ruler"], ["A palace guard in Beijing, 1750", "palace-china", "Guardsman", "soldier"],
      ["A footman in Paris, 1700", "palace-baroque", "Footman", "servant"], ["A keeper of the knots, Cusco 1500", "palace-inca", "Keeper of the knots", "scribe"], ["A fan-bearer in Thebes, 1350 BC", "palace-egypt", "Fan-bearer", "servant"],
      ["A lady-in-waiting, Kyoto 1650", "palace-japan", "Lady-in-waiting", "courtier"], ["An Aztec noble", "palace-mexica", "Noble", "courtier"],
    ] as const) {
      const s = at(prompt);
      expect(s, prompt).toMatchObject({ below: "fair", role });
      expect(s.venue, prompt).toMatch(new RegExp(`^${kind}-\\d$`));
      expect(s.brief?.work, prompt).toBe(work);
    }
    // A ruler named in passing, or in a street name, is not who the prompt is about.
    for (const prompt of ["A baker serving the king of France, 1700", "King Street grocer in London 1880", "A cook in Paris, 1700", "A weaver in London, 1650"]) expect(at(prompt).below, prompt).toBeUndefined();
    // Some of those in a capital who name no work are found at court, each in one of the household's own posts.
    const fair = (id: string) => fairs.find((f) => f.id === id)!;
    const court = Array.from({ length: 80 }, (_, i) => at("Beijing 1750", `court${i}`)).filter((s) => s.below === "fair");
    expect(court.length).toBeGreaterThan(8);
    expect(court.length).toBeLessThan(36);
    for (const s of court) expect(fair(s.venue!).posts!.map((p) => p[0])).toContain(s.role);
    expect(Array.from({ length: 40 }, (_, i) => at("London 2000", `court${i}`)).filter((s) => s.below).length).toBe(0);
  });

  it("starts a warlord in a generated hall of his own period, and nowhere when no period fits", () => {
    for (const [prompt, kind, seat] of [["A Neolithic warlord", "hall-stone", true], ["A warlord in his mead hall", "hall-lord", true], ["A chieftain in Gaul, 200 BC", "hall-iron", true]] as const) {
      const r = resolveSetting(prompt);
      if (!("setting" in r)) throw new Error(r.error);
      expect(r.setting.venue).toMatch(new RegExp(`^${kind}-\\d$`));
      const e = smallSession(r.setting, "palace");
      expect(e.state.player.pos.space).toBe(`fair:${r.setting.venue}:hall`);
      const hall = e.areaOf(`fair:${r.setting.venue}:hall`) as FairLevel;
      expect(hall.palace).toMatchObject({ order: "timber", room: "hall" });
      expect(hall.props!.some((q) => q.key === "palace-highseat")).toBe(seat);
      expect(hall.decor.some((d) => d.type === "palace:hearth")).toBe(true);
    }
    const caesar = resolveSetting("Caesar at home");
    if (!("setting" in caesar)) throw new Error(caesar.error);
    expect(caesar.setting).toMatchObject({ below: "fair", year: -60, role: "Senator" });
    expect(caesar.setting.venue).toMatch(/^domus-\d$/);
    const house = smallSession(caesar.setting, "palace");
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

  it("builds every crypt area, and every level of the Roman catacombs and the Paris ossuary", () => {
    for (const a of tombPlan("a", crypt, "crypt.0")) expect(tombLevel("a", crypt, "crypt.0", a.id)?.things.length, a.name).toBeGreaterThanOrEqual(0);
    for (const [kind, lon, lat, year] of [["roman", 12.5, 41.9, 380], ["ossuary", 2.33, 48.83, 1810]] as const)
      for (const depth of [1, 2, 3]) {
        const L = sewerLevel("a", { id: "5,5", network: "catacomb", kind, place: { lon, lat, year }, people: [] }, depth);
        expect(L.cells.filter((c) => c !== WALL).length, `${kind} ${depth}`).toBeGreaterThan(160);
        expect(L.things.length, `${kind} ${depth}`).toBeGreaterThan(0);
      }
  });

  it("starts a tomb robber on the stair with a lamp, and a walled-up doorway comes down", () => {
    const r = resolveSetting("A tomb robber in Thebes, 1110 BCE");
    if (!("setting" in r)) throw new Error(r.error);
    expect(r.setting.below).toBe("tomb");
    const e = smallSession(r.setting, "tomb");
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

  it("enters world's fairs (with ticket), palaces (free), and cliff tombs from the open map", async () => {
    const { tombMouthAt } = await import("../src/core/tomb");

    // 1. World's fair gate charges admission; palace door opens freely.
    const paris = resolveSetting("A baker in Paris, 1889");
    if (!("setting" in paris)) throw new Error(paris.error);
    const pe = smallSession(paris.setting, "fair-gate-fast");
    const door = pe.world.places[0];
    door.venueRoom = { venue: "paris-1889", room: "trocadero" };
    pe.state.player.pos = { x: door.entrance.x, y: door.entrance.y, space: "outside" };
    pe.state.player.inventory.coin = 0;
    pe.act({ actionId: "short", expectedRevision: pe.state.revision, command: { type: "interact", target: door.id, action: "enter" } });
    expect(pe.state.player.pos.space).toBe("outside");
    pe.state.player.inventory.coin = 10;
    pe.act({ actionId: "in", expectedRevision: pe.state.revision, command: { type: "interact", target: door.id, action: "enter" } });
    expect(pe.state.player.pos.space).toBe("fair:paris-1889:trocadero");

    const palace = resolveSetting("A smith in York, 1300");
    if (!("setting" in palace)) throw new Error(palace.error);
    const ye = smallSession(palace.setting, "palace-door-fast");
    const hall = ye.world.places[0];
    hall.venueRoom = { venue: "versailles", room: "forecourt" };
    ye.state.player.pos = { x: hall.entrance.x, y: hall.entrance.y, space: "outside" };
    ye.state.player.inventory.coin = 0;
    ye.act({ actionId: "palace-in", expectedRevision: ye.state.revision, command: { type: "interact", target: hall.id, action: "enter" } });
    expect(ye.state.player.pos.space).toBe("fair:versailles:forecourt");
    // A smith off the street is stopped at the private bedchamber, can slip the guard coin to pass,
    // while a courtier walks straight in.
    const stepTo = (eng: typeof ye, to: string) => {
      const p = eng.state.player;
      const ex = (eng.areaOf(p.pos.space) as FairLevel).exits.find((q) => q.to.endsWith(`:${to}`))!;
      p.pos.x = ex.x + (ex.w >> 1);
      p.pos.y = ex.y + (ex.h >> 1);
      eng.advance(1);
    };
    for (const room of ["royal-court", "guard-room", "antechamber"]) stepTo(ye, room);
    expect(ye.state.player.pos.space).toBe("fair:versailles:antechamber");
    stepTo(ye, "bedchamber");
    expect(ye.state.player.pos.space).toBe("fair:versailles:antechamber");
    expect(ye.state.events.at(-1)!.text).toMatch(/household|rank/i);
    ye.state.player.inventory.coin = 5;
    expect(ye.complexVerb()).toMatchObject({ target: "fair-bribe" });
    ye.act({ actionId: "bribe", expectedRevision: ye.state.revision, command: { type: "interact", target: "fair-bribe", action: "complex" } });
    expect(ye.state.player.inventory.coin).toBe(0);
    stepTo(ye, "bedchamber");
    expect(ye.state.player.pos.space).toBe("fair:versailles:bedchamber");

    // A smith pushing repeatedly at a private chamber escalates through halt -> fury -> rough ejection.
    const rough = smallSession(palace.setting, "palace-rough-fast");
    const roughHall = rough.world.places[0];
    roughHall.venueRoom = { venue: "versailles", room: "antechamber" };
    rough.state.player.pos = { x: roughHall.entrance.x, y: roughHall.entrance.y, space: "outside" };
    rough.state.player.inventory.coin = 5;
    const hp0 = rough.state.player.health ?? 100;
    rough.act({ actionId: "r-in", expectedRevision: rough.state.revision, command: { type: "interact", target: roughHall.id, action: "enter" } });
    stepTo(rough, "bedchamber"); // 1st warning: halt
    expect(rough.state.player.pos.space).toBe("fair:versailles:antechamber");
    stepTo(rough, "bedchamber"); // 2nd warning: fury + doubled bribe (10)
    expect(rough.state.player.pos.space).toBe("fair:versailles:antechamber");
    expect(rough.inspect("fair-bribe")?.affordances[0]?.label).toContain("10");
    expect(rough.signals.some((s) => s.kind === "cue" && s.cue === "fury")).toBe(true);
    stepTo(rough, "bedchamber"); // 3rd try: shoved, bruised, fined, thrown into the local medieval keep!
    expect(rough.state.player.pos.space).toBe("prison:medieval-keep.0:main");
    expect(rough.state.complex?.kind).toBe("prison");
    expect(rough.state.player.health).toBeLessThan(hp0);
    expect(rough.state.player.inventory.coin).toBe(2);
    expect(rough.signals.some((s) => s.kind === "cue" && s.cue === "shove")).toBe(true);

    const noble = smallSession(palace.setting, "palace-noble-fast");
    noble.state.player.role = "Courtier";
    const nobleHall = noble.world.places[0];
    nobleHall.venueRoom = { venue: "versailles", room: "antechamber" };
    noble.state.player.pos = { x: nobleHall.entrance.x, y: nobleHall.entrance.y, space: "outside" };
    noble.act({ actionId: "noble-in", expectedRevision: noble.state.revision, command: { type: "interact", target: nobleHall.id, action: "enter" } });
    stepTo(noble, "bedchamber");
    expect(noble.state.player.pos.space).toBe("fair:versailles:bedchamber");

    // 2. Cliff opening in New Kingdom Thebes (Luxor) offers a rock-cut tomb entrance from outside.
    const thebes = resolveSetting("A mason in Luxor, 1110 BCE");
    if (!("setting" in thebes)) throw new Error(thebes.error);
    const te = smallSession(thebes.setting, "thebes-tomb-fast");
    // Find any cliff opening coordinate that caveAt accepts on limestone and verify tombMouthAt + entry.
    const { caveAt } = await import("../src/render/edge-faces");
    let spot: { x: number; y: number } | undefined;
    for (let y = -40; y <= 40 && !spot; y++)
      for (let x = -40; x <= 40 && !spot; x++)
        if ((((x * 73856093) ^ (y * 19349663)) & 1) === 0 && caveAt("limestone", x * 16 + 8, y * 16 - 1)?.cx !== undefined && Math.floor(caveAt("limestone", x * 16 + 8, y * 16 - 1)!.cx / 16) === x)
          spot = { x, y };
    expect(spot).toBeDefined();
    te.world.topography = (_x, y) => ({
      height: y <= spot!.y - 1 ? 2 : 0,
      surface: "grass",
      rock: "limestone",
    });
    expect(tombMouthAt(te.world, spot!.x, spot!.y)?.style.id).toBe("theban");
    te.state.player.pos = { x: spot!.x, y: spot!.y, space: "outside" };
    const target = `tomb-mouth:${spot!.x},${spot!.y}`;
    expect(te.inspect(target)?.affordances[0]?.label).toBe("Enter the tomb");
    te.act({ actionId: "tomb-in", expectedRevision: te.state.revision, command: { type: "interact", target, action: "complex" } });
    expect(te.state.player.pos.space).toBe(`tomb:theban.${spot!.x},${spot!.y}:0`);
  });

  it("leads down from a church into its crypt and back up into the church, with an errand to send people there", async () => {
    const { createSettingSession } = await import("../src/runtime/session");
    const r = resolveSetting("A sexton in London, 1300");
    if (!("setting" in r)) throw new Error(r.error);
    const e = createSettingSession(r.setting, "crypt-stair");
    const church = e.world.places.find((b) => e.churchBelow(b.id));
    expect(church).toBeDefined();
    const below = e.churchBelow(church!.id)!;
    expect(below.kind).toBe("crypt");
    e.state.player.pos = { ...below.at, space: church!.id };
    const target = `tomb-church:${church!.id}`;
    expect(e.complexVerb()?.target).toBe(target);
    expect(e.nearby().some((n) => n.id === target)).toBe(true);
    const res = e.act({ actionId: "crypt-in", expectedRevision: e.state.revision, command: { type: "interact", target, action: "complex" } });
    expect(res).toMatchObject({ status: "completed" });
    expect(e.state.player.pos.space).toBe(`tomb:crypt.${church!.entrance.x},${church!.entrance.y}:0`);
    const exit = e.areaOf(e.state.player.pos.space)!.exits!.find((x) => x.to === "outside")!;
    e.state.player.pos = { x: exit.x, y: exit.y, space: e.state.player.pos.space };
    e.act({ actionId: "crypt-out", expectedRevision: e.state.revision, command: { type: "wait", seconds: 2 } });
    expect(e.state.player.pos).toMatchObject({ ...below.at, space: church!.id });
    e.state.player.role = "Sexton";
    e.state.goalDay = undefined;
    expect(e.dailyGoals().some((g) => g.id === "below" && /crypt/.test(g.text))).toBe(true);
  });

  it.runIf(!!process.env.FULL)("places a fair gate in Paris 1889 and a palace complex door on York 1300's castle", async () => {
    const { createSettingSession } = await import("../src/runtime/session");
    const paris = resolveSetting("A baker in Paris, 1889");
    if (!("setting" in paris)) throw new Error(paris.error);
    const pe = createSettingSession(paris.setting, "fair-gate-check");
    expect(pe.world.places.some((p) => p.venueRoom?.venue === "paris-1889")).toBe(true);
    const york = resolveSetting("A smith in York, 1300");
    if (!("setting" in york)) throw new Error(york.error);
    const ye = createSettingSession(york.setting, "castle-door-check");
    expect(ye.world.places.some((p) => p.venueRoom)).toBe(true);
  });
});

describe("prisons, gaols, and confinement", () => {
  it("builds all four flagship prison styles on continuous plans with prompt spawns", async () => {
    const { prisonStyles } = await import("../src/content/prisons");
    const { prisonLevel, prisonWalkable } = await import("../src/world/prison");
    for (const style of prisonStyles) {
      const L = prisonLevel("seed", style, `${style.id}.0`);
      expect(prisonWalkable(L.cells[L.entry.y * L.w + L.entry.x]), style.id).toBe(true);
      expect(L.exits?.some((e) => e.to === "outside"), `${style.id} gate exit`).toBe(true);
      expect(L.things.some((t) => t.id === "grate"), `${style.id} drain grate`).toBe(true);
      expect(L.things.some((t) => t.id === "loose-stone"), `${style.id} wall crack`).toBe(true);
    }
    const r = resolveSetting("A debtor in London, 1750");
    if (!("setting" in r)) throw new Error(r.error);
    expect(r.setting.below).toBe("prison");
    const e = smallSession(r.setting, "fleet-1750");
    expect(e.state.player.pos.space).toBe("prison:debtors-gaol.0:main");
    const area = e.areaOf(e.state.player.pos.space)!;
    const spoon = area.things!.find((t) => t.id === "spoon")!;
    const stone = area.things!.find((t) => t.id === "loose-stone")!;
    // Hide spoon, pry loose stone 3 times, and break out to the street.
    e.state.player.pos = { x: spoon.x, y: spoon.y, space: e.state.player.pos.space };
    e.act({ actionId: "spoon", expectedRevision: e.state.revision, command: { type: "interact", target: "prison-thing:spoon", action: "complex" } });
    expect(e.state.player.inventory.tool).toBeGreaterThanOrEqual(1);
    e.state.player.pos = { x: stone.x, y: stone.y, space: e.state.player.pos.space };
    for (let i = 0; i < 3; i++) {
      e.act({ actionId: `pry-${i}`, expectedRevision: e.state.revision, command: { type: "interact", target: "prison-thing:loose-stone", action: "complex" } });
    }
    expect(e.state.player.pos.space).toBe("outside");
    expect(e.state.complex).toBeUndefined();
    expect(e.state.fugitive?.prison).toBeTruthy();
    expect(e.arrest("debt", 7)).toBe(true);
    expect(e.state.player.pos.space).toBe("prison:debtors-gaol.1:main");
    expect(e.areaOf(e.state.player.pos.space)!.things!.some((t) => t.id === "spoon")).toBe(true);
  });

  it("escalates escape-catch penalties from solitary to corporal punishment to execution", () => {
    const r = resolveSetting("A convict in London, 1870");
    if (!("setting" in r)) throw new Error(r.error);
    const e = smallSession(r.setting, "penitentiary-catch");
    expect(e.state.player.pos.space).toBe("prison:cellular-penitentiary.0:main");
    const area = e.areaOf(e.state.player.pos.space)!;
    const rack = area.things!.find((t) => t.id === "key-rack")!;
    const tryStealKeys = (id: string) => {
      const warder = e.state.actors.find((a) => a.pos.space === e.state.player.pos.space && /warder|turnkey/i.test(`${a.role} ${a.underground?.person ?? ""}`))!;
      warder.pos = { x: rack.x, y: rack.y + 1, space: e.state.player.pos.space };
      e.state.player.pos = { x: rack.x, y: rack.y + 1, space: e.state.player.pos.space };
      e.act({ actionId: id, expectedRevision: e.state.revision, command: { type: "interact", target: "prison-thing:key-rack", action: "complex" } });
    };
    const hp0 = e.state.player.health ?? 100;
    tryStealKeys("catch-1"); // 1st catch: solitary + +3 days
    expect(e.state.player.pos.space).toBe("prison:cellular-penitentiary.0:main");
    expect(e.state.player.health).toBe(hp0);
    tryStealKeys("catch-2"); // 2nd catch: corporal punishment (-28 HP)
    expect(e.state.player.pos.space).toBe("prison:cellular-penitentiary.0:main");
    expect(e.state.player.health).toBeLessThan(hp0);
    tryStealKeys("catch-3"); // 3rd catch: execution
    expect(e.state.player.health).toBe(0);
  });

  it("links the drain grate into the local sewer, emits FF6 cues, and arrests hostile speech to authority", async () => {
    const { evaluateHostileSpeech, isAuthorityRole } = await import("../src/core/prison");
    expect(evaluateHostileSpeech("Good morning, officer")).toBe("none");
    expect(evaluateHostileSpeech("You corrupt pig!")).toBe("insult");
    expect(evaluateHostileSpeech("I will kill you and burn the palace!")).toBe("threat");
    expect(isAuthorityRole({ role: "Palace Guard" })).toBe(true);
    expect(isAuthorityRole({ role: "Baker" })).toBe(false);

    // Arresting from outside puts the player into the local era/culture prison
    const york = resolveSetting("A smith in York, 1300");
    if (!("setting" in york)) throw new Error(york.error);
    const ye = smallSession(york.setting, "speech-arrest");
    expect(ye.arrest("insulting a magistrate", 7)).toBe(true);
    expect(ye.state.player.pos.space).toBe("prison:medieval-keep.0:main");

    // Stepping near a warder outside your cell triggers an FF6 halt cue
    const warder = ye.state.actors.find((a) => a.pos.space === ye.state.player.pos.space && /warder|turnkey/i.test(`${a.role} ${a.underground?.person ?? ""}`))!;
    ye.state.player.pos = { x: warder.pos.x + 2, y: warder.pos.y, space: ye.state.player.pos.space };
    ye.advance(2);
    expect(ye.signals.some((s) => s.kind === "cue" && s.cue === "halt")).toBe(true);

    // Prying the drain grate twice in London 1750 drops directly into the underground sewer!
    const lon = resolveSetting("A debtor in London, 1750");
    if (!("setting" in lon)) throw new Error(lon.error);
    const le = smallSession(lon.setting, "sewer-escape");
    le.state.player.inventory.tool = 1;
    // Move warders far away so we don't get caught while prying the grate
    for (const a of le.state.actors) if (a.pos.space === le.state.player.pos.space) a.pos = { x: 1, y: 1, space: a.pos.space };
    const grate = le.areaOf(le.state.player.pos.space)!.things!.find((t) => t.id === "grate")!;
    le.state.player.pos = { x: grate.x, y: grate.y, space: le.state.player.pos.space };
    le.act({ actionId: "grate-1", expectedRevision: le.state.revision, command: { type: "interact", target: "prison-thing:grate", action: "complex" } });
    expect(le.signals.some((s) => s.kind === "cue" && s.cue === "rattle")).toBe(true);
    le.act({ actionId: "grate-2", expectedRevision: le.state.revision, command: { type: "interact", target: "prison-thing:grate", action: "complex" } });
    expect(le.state.complex?.kind).toBe("sewer");
    expect(le.state.player.pos.space.startsWith("sewer:")).toBe(true);
    expect(le.signals.some((s) => s.kind === "cue" && s.cue === "celebrate")).toBe(true);
  });

  it("serves short sentences and fast-forwards multi-year & life sentences through years.ts", async () => {
    const { liveOn, liveYears } = await import("../src/core/time/years");

    // 1. Short sentence: prison dailyGoals replace outdoor chores, sleep ticks daysLeft, serveSentence releases cleanly
    const york = resolveSetting("A prisoner in a castle dungeon in York, 1300");
    if (!("setting" in york)) throw new Error(york.error);
    const shortE = smallSession(york.setting, "serve-short");
    expect(shortE.state.complex?.kind).toBe("prison");
    expect(shortE.state.events.some((ev) => /morning’s work begins/.test(ev.text))).toBe(false);
    const goals = shortE.dailyGoals();
    expect(goals.every((g) => g.id.startsWith("prison."))).toBe(true);
    const d0 = shortE.state.complex?.kind === "prison" ? shortE.state.complex.sentence.daysLeft : 0;
    shortE.sleep(8 * 3600);
    expect(shortE.state.complex?.kind === "prison" ? shortE.state.complex.sentence.daysLeft : -1).toBe(d0 - 1);
    expect(shortE.serveSentence()).toBe(true);
    expect(shortE.state.complex).toBeUndefined();
    expect(shortE.state.fugitive).toBeUndefined();
    expect(shortE.state.player.pos.space).toBe("outside");

    // 2. Multi-year convict (5-year sentence): stopping early stays confined; stopping at release frees you onto aged town
    const conv = resolveSetting("A convict in London, 1870");
    if (!("setting" in conv)) throw new Error(conv.error);
    const convE = smallSession(conv.setting, "serve-years");
    const age0 = convE.state.player.age ?? 30;
    const life = liveYears(convE);
    expect(life.prison?.releaseYear).toBe(1875);
    const mid = liveOn(convE, life, 1872);
    expect(mid.state.complex?.kind).toBe("prison");
    expect(mid.state.player.age).toBe(age0 + 2);
    if (mid.state.complex?.kind === "prison") expect(mid.state.complex.sentence.daysLeft).toBeLessThan(365 * 5);

    const free = liveOn(convE, life, 1875);
    expect(free.state.complex).toBeUndefined();
    expect(free.state.player.pos.space).toBe("outside");
    expect(free.state.player.age).toBe(age0 + 5);
    expect(life.years.find((y) => y.year === 1875)?.lines.some((l) => l.label === "Released")).toBe(true);

    // 3. Life sentence (political prisoner): stays confined across years
    const pol = resolveSetting("A political prisoner in York, 1300");
    if (!("setting" in pol)) throw new Error(pol.error);
    const polE = smallSession(pol.setting, "serve-life");
    const polLife = liveYears(polE);
    expect(polLife.prison?.kind).toBe("life");
    const polLater = liveOn(polE, polLife, 1303);
    expect(polLater.state.complex?.kind).toBe("prison");
    expect(polLater.state.player.age).toBe((polE.state.player.age ?? 30) + 3);
  });
});
