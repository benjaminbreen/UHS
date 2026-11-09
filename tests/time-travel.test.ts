import { ageObject } from "../src/core/time/objects";
import { propDefs } from "../src/content/props/catalog";
import { describe, expect, it } from "vitest";
import { timeBounds, settingAt } from "../src/core/time/setting";
import { createLineage, relative, personAt, lineBetween, relationship } from "../src/core/time/lineage";
import { generateCharacter } from "../src/content/characters/generate";
import { ageStructure, damageStructure, structureBlocks } from "../src/core/time/structure";
import { buildingAt, temporalWorld } from "../src/core/time/world";
import { resolveSetting } from "../src/content/geography/resolve";
import type { Actor, Place, WorldModel } from "../src/core/types";
import { timeArrival } from "../server/time-arrival";
import { TimeTravel } from "../src/core/time/travel";
import { createSettingSession } from "../src/runtime/session";
import { remainingAt20, typicalDeathAge, yearlyRisk } from "../src/core/time/mortality";
import { causeOfDeath } from "../src/content/history/deaths";
import { householdWays } from "../src/content/history/households";
import { endOfLife, liveOn, liveYears } from "../src/core/time/years";
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
  it("retains surnames across local-kit date boundaries and derives a lineage's patronymics", () => {
    const london = { ...setting, year: 1580, lon: -0.12, lat: 51.5, placeId: "london", location: "London", namingRevision: 1 as const };
    const parent = generateCharacter(london, "line-names", "player", 34, undefined, undefined, ["Smith"], "male");
    const line = createLineage("line-names", london, { ...parent, age: 34 } as Actor);
    for (let i = 1; i < 5; i++) expect(relative(line, i).character.origin.nameFamilies).toEqual(["Smith"]);
    const iceland = { ...london, year: 1850, lon: -19, lat: 64.8, placeId: "iceland" };
    const jon = generateCharacter(iceland, "line-names", "player", 34, undefined, undefined, undefined, "male", undefined, { personal: "Jón" });
    const family = createLineage("line-names", iceland, { ...jon, age: 34 } as Actor);
    expect(relative(family, 1).name).toMatch(/ Jóns(?:son|dóttir)$/);
    expect(relative(family, 2).character.origin.nameParentPersonal).toBe(relative(family, 1).character.origin.namePersonal);
    expect(relative(family, -1).character.origin.namePersonal).toBe(jon.origin.nameParentPersonal);
    expect(relative(family, -1).character.origin.sex).toBe("male");
    expect(settingAt({ ...london, namingRevision: undefined }, 1600).namingRevision).toBeUndefined();
  });
  it("evaluates building history independently of jump size and keeps birth material", () => {
    const direct = buildingAt(place, "seed", setting, 900);
    for (let year = 100; year < 900; year += 10) buildingAt(place, "seed", setting, year);
    expect(buildingAt(place, "seed", setting, 900)).toEqual(direct);
    expect(buildingAt(place, "seed", setting, 100).sprite).toBe(place.sprite);
    expect(buildingAt(place, "seed", setting, 100).place.structure?.roof).toBe(1);
  });
  it("keeps regenerated household names tied to their parents after a time jump", () => {
    const iceland = { ...setting, year: 1850, lon: -19, lat: 64.8, placeId: "iceland", namingRevision: 1 as const };
    const adult = { ...generateCharacter(iceland, "temporal-family", "father", 40), id: "father", age: 40,
      kind: "human", householdId: "family", home: { space: "outside" }, relations: [] } as unknown as Actor;
    const kid = { ...adult, id: "child", age: 10, relations: [{ kind: "parent" as const, other: adult.id }] };
    const base = { places: [], initialActors: [kid, adult], initialObjects: [], pack: { setting: iceland },
      blocked: () => false, terrain: () => "grass" } as unknown as WorldModel;
    const later = temporalWorld(base, "temporal-family", iceland, 1880).world.initialActors;
    expect(later[0].origin!.nameParentPersonal).toBe(later[1].origin!.namePersonal);
    expect(later[0].origin!.nameTradition).toBe(later[1].origin!.nameTradition);
    expect(later).toEqual(temporalWorld(base, "temporal-family", iceland, 1880).world.initialActors);
    expect(base.initialActors[0].origin!.nameParentPersonal).toBe(kid.origin!.nameParentPersonal);
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
  it("travels between years without a browser", () => {
    const start = resolveSetting("Kyoto 1200 CE");
    if (!("setting" in start)) throw Error("Fixture setting");
    const engine = createSettingSession(start.setting, "travel");
    const travel = new TimeTravel(engine);
    const prepared = travel.prepare(1350, engine);
    travel.commit(prepared);
    expect(travel.currentYear).toBe(1350);
    expect(prepared.engine.world.pack.setting?.year).toBe(1350);
    expect(prepared.engine.state.player.age).toBe(1350 - prepared.arrival.person.born);
  });
  it("calibrates adult lifespans and child losses to each period", () => {
    for (const year of [1200, 1850, 1925, 1980]) expect(Math.abs(typicalDeathAge(year) - 20 - remainingAt20(year))).toBeLessThanOrEqual(1);
    let alive = 1;
    for (let age = 0; age < 15; age++) alive *= 1 - yearlyRisk(age, 1700);
    expect(1 - alive).toBeGreaterThan(0.25);
    expect(1 - alive).toBeLessThan(0.4);
    expect(yearlyRisk(70, 1700)).toBeGreaterThan(yearlyRisk(40, 1700));
    expect(yearlyRisk(40, 1700, "destitute")).toBeGreaterThan(yearlyRisk(40, 1700, "elite"));
  });
  it("keeps old death rates where they fell late, and households to local custom", () => {
    const delhi = { lon: 77.2, lat: 28.6 }, ohio = { lon: -82, lat: 40 };
    expect(typicalDeathAge(1925, delhi)).toBeLessThan(typicalDeathAge(1925, ohio) - 10);
    expect(yearlyRisk(0, 1925, "middling", 1, delhi)).toBeGreaterThan(yearlyRisk(0, 1925, "middling", 1, ohio));
    const at = (lon: number, lat: number, year: number) => ({ ...setting, lon, lat, year });
    expect(householdWays(at(-76, 43, 1600), "Farmer").stays).toBe("daughter");
    expect(householdWays(at(-0.1, 51.5, 1700), "Weaver")).toMatchObject({ stays: "none", marries: { female: [22, 32] } });
    expect(householdWays(at(-0.1, 51.5, 1700), "Weaver").leaves?.("female")).toBe("to go into service");
    expect(householdWays(at(106, 47, 1250), "Herder")).toMatchObject({ heir: "youngest", living: "herd", leaves: undefined });
    expect(householdWays(at(-4, 13, 1350), "Coil Potter").wives).toBeGreaterThan(1);
    expect(householdWays({ ...at(-124, 48, 1500), culture: "other-indigenous-american" }, "Gatherer").living).toBe("forage");
  });
  it("names deaths a sentence can follow, and none a baby could not die of", () => {
    for (let i = 0; i < 200; i++) {
      const baby = causeOfDeath({ age: 0, role: "child", setting }, 100, i / 200);
      expect(baby).not.toMatch(/drown|fall|accident|battle|war/);
      expect(causeOfDeath({ age: 40, sex: "male", role: "fisherman", setting }, 100, i / 200)).toMatch(/^(of|in|by|under) /);
    }
  });
  it.runIf(process.env.FULL)("runs a life to its end and carries the household into a later year", () => {
    const start = resolveSetting("Kyoto 1200 CE");
    if (!("setting" in start)) throw Error("Fixture setting");
    const engine = createSettingSession(start.setting, "years");
    const age = engine.state.player.age!;
    const life = liveYears(engine);
    expect(liveYears(engine).years).toEqual(life.years);
    expect(life.died).toBeDefined();
    const year = life.years[Math.floor(life.years.length / 2)].year;
    const later = liveOn(engine, life, year);
    const s = later.state, span = year - life.from;
    expect(later.world.pack.setting?.year).toBe(year);
    expect(later.world.pack.year).toBe(year);
    const at = s.player.pos;
    expect(later.world.geography?.packAt(at.x, at.y).year ?? year).toBe(year);
    expect(s.player.age).toBe(age + span);
    expect(s.player.dead).toBeUndefined();
    const home = s.households!.find((h) => h.members.includes("player"))!;
    const expected = life.years.find((y) => y.year === year)!.home.filter((id) => id !== "player" && year - life.people[id].born >= 5);
    expect(home.members.filter((id) => id !== "player").sort()).toEqual(expected.sort());
    for (const id of home.members.filter((id) => id !== "player"))
      expect(s.actors.find((a) => a.id === id)!.age).toBe(year - life.people[id].born);
    expect(engine.state.player.age).toBe(age);
    const end = endOfLife(engine, life);
    expect(end.state.player.dead).toBe(life.died!.cause);
    expect(end.heirs().every((a) => (a.age ?? 0) >= 12)).toBe(true);
  }, 600000);
});

