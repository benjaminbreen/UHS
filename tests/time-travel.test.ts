import { ageObject } from "../src/core/time/objects";
import { propDefs } from "../src/content/props/catalog";
import { describe, expect, it } from "vitest";
import { timeBounds, settingAt } from "../src/core/time/setting";
import { createLineage, personAt, lineBetween, relationship } from "../src/core/time/lineage";
import { ageStructure, damageStructure, structureBlocks } from "../src/core/time/structure";
import { buildingAt, temporalWorld } from "../src/core/time/world";
import { resolveSetting } from "../src/content/geography/resolve";
import type { Actor, Place, WorldModel } from "../src/core/types";
import { timeArrival } from "../server/time-arrival";
const resolved = resolveSetting("Rome 100 CE");
if (!("setting" in resolved)) throw Error("Fixture setting");
const setting = { ...resolved.setting, lon: 14.268, lat: 40.852, placeId: "naples", location: "Neapolis" };
const actor = { name: "Marcus", role: "Farmer", age: 34, inventory: {} } as Actor;
const place: Place = { id: "house-1", name: "Household", description: "", x: 0, y: 0, w: 5, h: 4, sprite: "house-roman-0", entrance: {x: 2, y: 4}, access: "household", owner: "", claim: "", entranceLabel: "Enter" };
describe("historical time", () => {
  it("clips the timeline and handles the BCE boundary", () => {
    expect(timeBounds(-1000000)).toEqual({min: -1000000, max: -999000});
    expect(timeBounds(9900).max).toBe(10000);
    expect(settingAt(setting, 0).year).toBe(0);
    expect(() => settingAt(setting, 10001)).toThrow();
  });
  it("resolves Neapolis into medieval Christian Napoli without moving the site", () => {
    const later = settingAt(setting, 900);
    expect(later.location).toBe("Napoli");
    expect(later.community).toContain("Christian");
    expect([later.lon, later.lat]).toEqual([setting.lon, setting.lat]);
    expect(later.architecture).not.toBe("classical");
  });
  it("keeps a direct, chronological family line independent of visit order", () => {
    const a = createLineage("family", setting, actor), b = createLineage("family", setting, actor);
    const descendant = personAt(a, 900), ancestor = personAt(a, -700);
    personAt(b, -700);
    expect(personAt(b, 900)).toEqual(descendant);
    const members = lineBetween(a, ancestor.generation, descendant.generation);
    for (let i = 1; i < members.length; i++) {
      expect(members[i].parentId).toBe(members[i - 1].id);
      expect(members[i].born - members[i - 1].born).toBeGreaterThanOrEqual(23);
      expect(members[i - 1].died).toBeGreaterThan(members[i].born);
    }
    expect(personAt(a, 100).name).toBe("Marcus");
    expect(relationship(members[0], members[1])).toContain("child");
  });
  it("evaluates building history independently of jump size and keeps birth material", () => {
    const direct = buildingAt(place, "seed", setting, 900);
    for (let year = 100; year < 900; year += 10) buildingAt(place, "seed", setting, year);
    expect(buildingAt(place, "seed", setting, 900)).toEqual(direct);
    expect(buildingAt(place, "seed", setting, 100).sprite).toBe(place.sprite);
    expect(buildingAt(place, "seed", setting, 100).place.structure?.roof).toBe(1);
  });
  it("impact opens a specific wall and fire respects material", () => {
    const state = ageStructure("seed", "a", "masonry", 0, 100, 100, 0.6);
    const hit = damageStructure(state, {kind: "impact", section: 0, amount: 1});
    expect(structureBlocks({...place, structure: state}, 0, 0)).toBe(true);
    expect(structureBlocks({...place, structure: hit}, 0, 0)).toBe(false);
    expect(state.walls[0]).toBe(1);
    expect(damageStructure(state, {kind: "fire", section: 0, amount: 1}).walls[0]).toBe(0.85);
    expect(damageStructure({...state, fabric: "timber"}, {kind: "fire", section: 0, amount: 1}).walls[0]).toBe(0);
  });
  it("ruin collision and topography agree without changing the base world", () => {
    const base = { places: [place], initialActors: [], initialObjects: [], pack: { setting }, blocked: () => true, terrain: () => "floor", topography: () => ({height: 0, surface: "soil", solid: true}), decoration: () => undefined } as unknown as WorldModel;
    const phase = buildingAt(place, "seed", setting, 100);
    const {world} = temporalWorld(base, "seed", setting, phase.abandoned + 8);
    expect(world.blocked(2, 2, "outside")).toBe(false);
    expect(world.topography!(2, 2).solid).toBe(false);
    expect(base.blocked(2, 2, "outside")).toBe(true);
    expect(world.place(place.id)?.structure?.roof).toBeLessThan(0.95);
  });
  it("reuses an occupied temple site as a dated Christian venue", () => {
    const sites = Array.from({length: 12}, (_, i) => ({...place, id: `site-${i}`, x: i * 10, claim: "venue-venue.temple-precinct"}));
    const base = {places: sites, initialActors: [], initialObjects: [], pack: {setting}, blocked: () => false, terrain: () => "grass"} as unknown as WorldModel;
    const result = temporalWorld(base, "reuse", setting, 900);
    const occupied = result.world.places.filter(p => p.structure!.roof >= .95);
    expect(occupied.length).toBeGreaterThan(0);
    expect(occupied.every(p => p.claim === "venue-venue.churchyard")).toBe(true);
    expect(sites[0].claim).toBe("venue-venue.temple-precinct");
  });
  it("leaves pottery fragments longer than abandoned wooden objects", () => {
    const prop = (material: string) => Object.entries(propDefs).find(([, d]) => d.breakable === material)![0];
    const object = { id: "pot", kind: "container", prop: prop("clay"), pos: {x: 0, y: 0, space: "outside"}, inventory: {grain: 3} } as any;
    expect(ageObject(object, 100)?.broken).toBe(true);
    expect(ageObject({...object, prop: prop("wood")}, 100)).toBeUndefined();
    expect(ageObject(object, 600)).toBeUndefined();
    expect(object.inventory.grain).toBe(3);
  });
  it("uses fixed Luna narration and falls back on provider failure", async () => {
    const request = () => new Request("http://test", {method: "POST", body: JSON.stringify({place: "Napoli", from: 100, to: 900, context: "A Christian city", person: "Anna", relationship: "direct descendant"})});
    let body: any;
    const provider = (async (_url: unknown, options: RequestInit) => {
      body = JSON.parse(options.body as string);
      return new Response(JSON.stringify({choices: [{message: {content: "The streets remain; their households have changed."}}]}));
    }) as typeof fetch;
    const response = await timeArrival(request(), {OPENAI_API_KEY: "test"}, provider);
    expect(response.status).toBe(200);
    expect(body.model).toBe("gpt-6-luna");
    expect((await response.json()).text).toContain("households");
    expect((await timeArrival(request(), {OPENAI_API_KEY: "test"}, (async () => {throw Error("offline")}) as typeof fetch)).status).toBe(502);
  });
  it("arrival narration has a no-key fallback and rejects malformed inputs", async () => {
    expect((await timeArrival(new Request("http://test", {method: "GET"}), {})).status).toBe(200);
    expect((await timeArrival(new Request("http://test", {method: "POST"}), {})).status).toBe(503);
    expect((await timeArrival(new Request("http://test", {method: "POST", body: "{}"}), {OPENAI_API_KEY: "test"})).status).toBe(400);
  });
});
