import { waterfrontFor } from "../src/content/settlements/waterfronts";
import { describe, it, expect } from "vitest";
import { route } from "../src/core/routing";
import { planSettlement } from "../src/world/v3/plan";
import {
  patterns,
  settlementProfile,
} from "../src/content/settlements/profiles";
import { resolveSetting } from "../src/content/geography/resolve";
import { packForSetting } from "../src/content/geography/pack";
import { createSettingSession, Runtime } from "../src/runtime/session";
import { crossing } from "../src/world/v3/roads";
import { launchAt, shoreDirections } from "../src/world/v3/shoreline";
import type { SettlementWorld } from "../src/world/v3/generate";
import type { LandSample } from "../src/world/v2/landscape";
const setting = (q = "medieval Normandy") => {
  const r = resolveSetting(q);
  if ("error" in r) throw Error(r.error);
  return r.setting;
};
const flat = (): LandSample => ({
  elevation: 15,
  moisture: 0.5,
  water: 100,
  kind: "river",
  snow: false,
});
const launchSpec={width:5,dryLength:12,reach:36,waterLength:8};
it("finds launching ground on every shore bearing and water type without altering the shore",()=>{
  for(const direction of shoreDirections) for(const kind of ["sea","river","lake"] as const) {
    const sample=(x:number,y:number)=>({...flat(),kind,water:20-x*direction.x-y*direction.y});
    const launch=launchAt({x:0,y:0},direction,sample,()=>false,launchSpec)!;
    expect(launch,`${kind} ${direction.id}`).toBeDefined();
    expect(sample(launch.water.x,launch.water.y).water).toBeLessThan(0);
    expect(launch.dry.every(p=>sample(p.x,p.y).water>=4)).toBe(true);
  }
});
it("rejects inland sites, narrow water, obstructed launch lanes and cliff banks",()=>{
  const east=shoreDirections[1];
  expect(launchAt({x:0,y:0},east,()=>flat(),()=>false,launchSpec)).toBeUndefined();
  expect(launchAt({x:0,y:0},east,x=>({...flat(),water:x>=21 && x<=24 ? -5 : 100}),()=>false,launchSpec)).toBeUndefined();
  const shore=(x:number)=>({...flat(),water:20-x});
  expect(launchAt({x:0,y:0},east,shore,(x,y)=>x===15 && y===1,launchSpec)).toBeUndefined();
  expect(launchAt({x:0,y:0},east,x=>({...shore(x),elevation:x<21 ? 45 : 0}),()=>false,launchSpec)).toBeUndefined();
  expect(launchAt({x:0,y:0},east,x=>({...shore(x),fall:x===23}),()=>false,launchSpec)).toBeUndefined();
  expect(launchAt({x:0,y:0},east,(x,y)=>({...shore(x),water:Math.abs(y)>1 ? 100 : 20-x}),()=>false,launchSpec)).toBeUndefined();
});

it.each(shoreDirections)("gives a boatyard a dry compound, reserved $id launch and connection to the settlement",direction=>{
  const s={...setting("Boatwright in London 1650"),role:"Boatwright"};
  const site={id:"boat-bank",cx:0,cy:0,home:true,center:{x:0,y:0},profile:{...settlementProfile(s),radius:60}};
  const sample=(x:number,y:number)=>({...flat(),water:80-x*direction.x-y*direction.y});
  const plan=planSettlement(site,packForSetting(s),"boatyard",sample,[]);
  const yard=plan.places.find(p=>p.institution==="boatyard")!;
  expect(yard).toBeDefined();
  expect(plan.places.some(p=>p.id===`${yard.id}-store`)).toBe(true);
  const slip=plan.plots.find(p=>p.id===`${yard.id}-launch`)!;
  expect(slip).toBeDefined();
  expect(plan.objects.some(o=>o.id===`${yard.id}-boat` && o.sprite===`worksite-clinker-hull-${direction.id}`)).toBe(true);
  for(const place of plan.places.filter(p=>p.id.startsWith(yard.id)))
    for(let y=place.y;y<place.y+place.h;y++) for(let x=place.x;x<place.x+place.w;x++) expect(sample(x,y).water).toBeGreaterThanOrEqual(4);
  for(let y=slip.y;y<slip.y+slip.h;y++) for(let x=slip.x;x<slip.x+slip.w;x++) {
    expect(plan.reserved.has(`${x},${y}`)).toBe(true);
    if(sample(x,y).water<4) expect(plan.groundLevels?.has(`${x},${y}`)).toBeFalsy();
  }
  expect(plan.roads.some(r=>r.id.includes("north-sea-boatyard"))).toBe(true);
});
it.each(["Fisher in Bergen 1700","Fisher in Tokyo 1800","Fisher in Nile valley 2000 BCE"].flatMap(query=>shoreDirections.map(d=>({...d,query}))))("builds an owned fishing waterfront in $query on a $id shore",direction=>{
  const s={...setting(direction.query),role:"Fisher"};
  const site={id:"fishing-bank",cx:0,cy:0,home:true,center:{x:0,y:0},profile:{...settlementProfile(s),radius:60}};
  const sample=(x:number,y:number)=>({...flat(),water:80-x*direction.x-y*direction.y});
  const plan=planSettlement(site,packForSetting(s),"fishing-waterfront-review",sample,[]);
  expect(plan.waterfront?.members.length).toBeGreaterThanOrEqual(2);
  const profile=waterfrontFor(s)!;
  expect(plan.waterfront?.profile).toBe(profile.id);
  expect(plan.roads.filter(r=>r.id.includes("worksite-fishing-bank-waterfront-")).length).toBe(plan.waterfront!.members.length*5);
  for(const member of plan.waterfront!.members) {
    for(const id of [member.homeId,member.gearId]) {
      const p=plan.places.find(p=>p.id===id)!;
      expect(p.owner).toBe(member.owner);
      for(let y=p.y;y<p.y+p.h;y++)for(let x=p.x;x<p.x+p.w;x++)expect(sample(x,y).water).toBeGreaterThanOrEqual(4);
    }
    expect(member.handling).toBeDefined();
    expect(Math.hypot(member.sorting.x-member.landing.x,member.sorting.y-member.landing.y)).toBeLessThan(22);
    const basket=plan.objects.find(o=>o.id===member.handling!.basketId)!;
    expect(basket).toBeDefined();
    const boat=plan.objects.find(o=>o.id===member.boatId)!;
    expect(boat.owner).toBe(member.owner);
    expect(boat.sprite).toBe(`${profile.boat}-${direction.id}`);
    expect(plan.places.find(p=>p.id===member.homeId)?.sprite).toBe(profile.home);
    expect(plan.objects.find(p=>p.id===member.netsId)?.sprite).toBe(profile.nets);
    expect(sample(boat.pos.x,boat.pos.y).water).toBeLessThan(0);
    for(const p of [member.landing,member.nets,member.sorting])expect(plan.solid.has(`${p.x},${p.y}`)).toBe(false);
  }
});
it("keeps regional waterfronts within their dates, communities and generator revision",()=>{
  const edo=setting("Fisher in Tokyo 1800"),nile=setting("Fisher in Nile valley 2000 BCE");
  expect(waterfrontFor(edo)?.id).toBe("edo-inshore-fishing");
  expect(waterfrontFor(edo)?.craft).toBe("wasen");
  expect(waterfrontFor(nile)?.craft).toBeUndefined();
  expect(waterfrontFor(nile)?.id).toBe("middle-kingdom-nile-fishing");
  for(const s of [edo,nile]) {
    expect(waterfrontFor({...s,worksiteRevision:5})).toBeUndefined();
    expect(waterfrontFor({...s,culture:"european"})).toBeUndefined();
    expect(waterfrontFor({...s,settlement:"camp"})).toBeUndefined();
  }
  expect(waterfrontFor({...edo,year:1650})).toBeUndefined();
  expect(waterfrontFor({...nile,year:1000})).toBeUndefined();
  const site={id:"sea-bank",cx:0,cy:0,home:true,center:{x:0,y:0},profile:{...settlementProfile(nile),radius:60}};
  const sample=(_x:number,y:number)=>({...flat(),water:80-y,kind:"sea" as const});
  expect(planSettlement(site,packForSetting(nile),"fishing-waterfront-review",sample,[]).waterfront).toBeUndefined();
});
describe("settlement layout and movement", () => {
  it("routes by travel cost, reports budget exhaustion, and avoids blocked tiles", () => {
    const cost = (p: { x: number; y: number }) =>
      p.y === 0 && p.x > 0 && p.x < 8 ? 8 : 1;
    const r = route({ x: 0, y: 0 }, { x: 8, y: 0 }, cost);
    expect(r.status).toBe("found");
    expect(r.cost).toBe(10);
    expect(r.path.some((p) => p.y !== 0)).toBe(true);
    expect(
      route({ x: 0, y: 0 }, { x: 100, y: 100 }, () => 1, { maxNodes: 2 })
        .status,
    ).toBe("budget");
    expect(route({ x: 0, y: 0 }, { x: 2, y: 0 }, () => Infinity).status).toBe(
      "unreachable",
    );
  });
  it("fits every settlement pattern with reachable doors and field access", () => {
    const signatures = new Set<string>();
    for (const pattern of patterns) {
      const s = { ...setting(), settlementPattern: pattern };
      const p = planSettlement(
        {
          id: "s0_0",
          cx: 0,
          cy: 0,
          center: { x: 0, y: 0 },
          home: true,
          profile: settlementProfile(s),
        },
        packForSetting(s),
        "layout",
        flat,
        [],
      );
      expect(p.places.length, pattern).toBeGreaterThan(0);
      const footprint = new Set<string>();
      for (const b of p.places) {
        for (let y = b.y; y < b.y + b.h; y++)
          for (let x = b.x; x < b.x + b.w; x++) {
            const k = `${x},${y}`;
            expect(footprint.has(k)).toBe(false);
            footprint.add(k);
          }
      }
      for (const goal of [
        ...p.places.map((b) => b.entrance),
        ...p.plots.map((p) => p.access),
      ]) {
        expect(
          route(p.spawn, goal, (to) =>
            p.solid.has(`${to.x},${to.y}`) ? Infinity : 1,
          ).status,
          `${pattern}: ${JSON.stringify(goal)}`,
        ).toBe("found");
      }
      // The player has a home here; which index it lands on is not a contract,
      // and a town puts its civic range in the list first.
      expect(
        p.places.some((b) => b.owner === "player"),
        pattern,
      ).toBe(true);
      expect(p.actors.some((a) => a.id === "player")).toBe(false);
      signatures.add(JSON.stringify(p.places.map((b) => [b.x, b.y, b.sprite])));
    }
    expect(signatures.size).toBe(patterns.length);
  }, 30000);
  it("places crossings across rivers, never open sea", () => {
    const river = (_x: number, y: number): LandSample => ({
      ...flat(),
      water: Math.abs(y) - 6,
      kind: "river",
    });
    expect(
      crossing("river", { x: 0, y: 0 }, river, 30)?.points.length,
    ).toBeGreaterThan(10);
    expect(
      crossing(
        "sea",
        { x: 0, y: 0 },
        (x, y) => ({ ...river(x, y), kind: "sea" }),
        30,
      ),
    ).toBeUndefined();
  });
  it("keeps prop-filled generated households accessible", () => {
    const e = createSettingSession(setting(), "settlement-test"),
      p = (e.world as SettlementWorld).planAt(0, 0)!;
    expect(e.state.manifest).toMatchObject({
      generator: 3,
      simulation: 2,
      content: 2,
    });
    expect(e.blocked(e.state.player.pos.x, e.state.player.pos.y)).toBe(false);
    for (const b of p.places)
      expect(e.findRoute(e.state.player.pos, b.entrance).status, b.id).toBe(
        "found",
      );
    for (const [id, w] of p.work)
      expect(e.findRoute(e.state.player.pos, w.work).status, id).toBe("found");
    expect(e.state.objects.some((o) => o.id.endsWith("-prop0"))).toBe(true);
  }, 30000);
  it("keeps closed pens contained and opens gates as explicit player commands", () => {
    const e = createSettingSession(
      {
        ...setting("medieval Normandy"),
        settlementPattern: "farmstead",
      },
      "pen-test",
    );
    const gate = e.state.objects.find((o) => o.kind === "gate")!;
    expect(gate).toBeDefined();
    // Isolate livestock while exercising actual collision and routine code.
    e.world.initialActors = e.world.initialActors.filter((a) => a.kind !== "human");
    e.state.actors = e.state.actors.filter((a) => a.kind !== "human");
    e.syncFauna();
    const herd = e.state.fauna!.find((g) => g.gateId === gate.id)!;
    expect(herd).toBeDefined();
    e.state.player.pos = { ...gate.pos, y: gate.pos.y + 1 };
    e.act({
      actionId: "closed",
      expectedRevision: 0,
      command: { type: "wait", seconds: 120 },
    });
    expect(herd.members.length).toBeGreaterThan(0);
    expect(herd.members.every((m) => m.y < gate.pos.y)).toBe(true);
    const rt = new Runtime(e);
    rt.walkTo({ x: gate.pos.x, y: gate.pos.y - 1 });
    for (let i = 0; i < 10 && rt.running; i++) rt.tick();
    expect(gate.open).toBe(true);
    expect(e.state.player.pos.y).toBe(gate.pos.y - 1);
    expect(
      e.state.log.some(
        (c) => c.command.type === "interact" && c.command.action === "open",
      ),
    ).toBe(true);
    rt.dispose();
  }, 20000);
});
it("renders the same chunks regardless of query order, including settlement boundaries", () => {
  const s = setting("Hellenistic Alexandria"),
    a = createSettingSession(s, "chunk-order"),
    b = createSettingSession(s, "chunk-order");
  const coords = [
    [-4, -1],
    [-1, -1],
    [0, 0],
    [3, 1],
    [7, 0],
  ];
  const expected = coords.map(([x, y]) => a.world.chunk(x, y));
  for (const [x, y] of [...coords].reverse()) b.world.chunk(x, y);
  coords.forEach(([x, y], i) =>
    expect(b.world.chunk(x, y)).toEqual(expected[i]),
  );
  for (const building of a.world.places)
    for (const [dx, dy] of [
      [0, 0],
      [building.w - 1, building.h - 1],
    ])
      expect(
        a.world.decoration(building.x + dx, building.y + dy),
      ).toBeUndefined();
}, 30000);
it("herders open their own pens while working and close them when resting", () => {
  const e = createSettingSession(
    { ...setting("medieval Normandy"), settlementPattern: "farmstead" },
    "pen-test",
  );
  const gate = e.state.objects.find((o) => o.kind === "gate")!;
  const h = e.state.actors.find((a) => a.id === gate.owner)!;
  const routine = e.world.itinerary!(h.id)!;
  const working = routine.segments.find((s) => s.activity !== "rest")!;
  const resting = routine.segments.find((s) => s.activity === "rest")!;
  expect(working).toBeDefined();
  expect(resting).toBeDefined();
  e.world.dormant = () => false;
  delete e.state.plot;
  h.hunger = 0;
  e.state.player.pos = { ...h.work, x: h.work.x + 2 };
  e.state.clock = (routine.start + (working.from + working.to) / 2) * 60;
  h.lastUpdated = e.state.clock;
  e.act({
    actionId: "day",
    expectedRevision: e.state.revision,
    command: { type: "wait", seconds: 12 },
  });
  expect(gate.open).toBe(true);
  e.state.clock = (routine.start + (resting.from + resting.to) / 2) * 60;
  h.lastUpdated = e.state.clock;
  h.hunger = 0;
  e.act({
    actionId: "night",
    expectedRevision: e.state.revision,
    command: { type: "wait", seconds: 12 },
  });
  expect(gate.open).toBe(false);
}, 120000);

it("pitches a herding camp on the steppe: no fields, no garden beds, doors to the south", () => {
  const s = setting("Mongolia 1250");
  expect(settlementProfile(s).pattern).toBe("encampment");
  expect(settlementProfile(setting("Beijing 1450")).pattern).not.toBe(
    "encampment",
  );
  const e = createSettingSession(s, "camp");
  const p = (e.world as SettlementWorld).planAt(0, 0)!;
  expect(p.plots.filter((x) => x.kind === "field")).toHaveLength(0);
  const homes = p.places.filter((x) => x.sprite.startsWith("steppe-"));
  expect(homes.length).toBeGreaterThan(4);
  expect(homes.every((x) => !/-(north|east|west)$/.test(x.sprite))).toBe(true);
});

it("camps a foraging band in Australia: shelters round a hearth, no farm kit", () => {
  const s = setting("Sydney 1500");
  expect(settlementProfile(s).pattern).toBe("band");
  const p = (createSettingSession(s, "band").world as SettlementWorld).planAt(0, 0)!;
  expect(p.places.every((x) => x.sprite.startsWith("forager-shelter-"))).toBe(true);
  expect(p.places.length).toBeGreaterThan(3);
  expect(
    p.objects.some((o) => /granary|sickle|spade|well/.test(o.sprite)),
  ).toBe(false);
});

it("rings Amazonian houses round a men's house, and rows plank houses above the beach", () => {
  const amazon = (createSettingSession(setting("Amazon 1400"), "ring").world as SettlementWorld).planAt(0, 0)!;
  expect(amazon.places.every((x) => x.sprite.startsWith("amazon-maloca-"))).toBe(true);
  expect(amazon.places.some((x) => x.sprite.includes("-large-"))).toBe(true);
  const coast = (createSettingSession(setting("Pacific Northwest 1700"), "row").world as SettlementWorld).planAt(0, 0)!;
  expect(coast.places.length).toBeGreaterThan(3);
  expect(coast.places.every((x) => x.sprite.startsWith("northwest-house-"))).toBe(true);
  expect(coast.plots.filter((x) => x.kind === "field")).toHaveLength(0);
});

it("walls Iroquoian longhouses in a palisade, and gives each Irish farm its own rath", () => {
  const iroquoia = (createSettingSession(setting("Iroquois 1500"), "palisade").world as SettlementWorld).planAt(0, 0)!;
  expect(iroquoia.places.every((x) => x.sprite.startsWith("iroquoian-longhouse-"))).toBe(true);
  expect([...(iroquoia.fields?.values() ?? [])].some((f) => f.boundary === "palisade")).toBe(true);
  const ireland = (createSettingSession(setting("Ireland 800"), "rath").world as SettlementWorld).planAt(0, 0)!;
  expect(settlementProfile(setting("Ireland 800")).pattern).toBe("encampment");
  expect([...(ireland.fields?.values() ?? [])].some((f) => f.boundary === "bund")).toBe(true);
});

it("uses flowing water for watermills and reserves the entire working compound", () => {
  const s=setting("Miller in medieval Normandy 1350");
  const sample=(x:number)=>({...flat(),water:x>=40 && x<=44 ? -5 : 100});
  const p=planSettlement({id:"mill-bank",cx:0,cy:0,home:true,center:{x:0,y:0},
    profile:{...settlementProfile(s),radius:80}},packForSetting(s),"worksites",sample,[]);
  const mill=p.places.find(p=>p.institution==="mill")!;
  expect(mill?.sprite).toBe("worksite-european-mill");
  expect(p.places.some(p=>p.id===`${mill.id}-store`)).toBe(true);
  const yard=p.plots.find(p=>p.id===`${mill.id}-yard`)!;
  expect(yard).toBeDefined();
  for(let y=yard.y;y<yard.y+yard.h;y++) for(let x=yard.x;x<yard.x+yard.w;x++)
    expect(sample(x).water,`${x},${y}`).toBeGreaterThanOrEqual(4);
  for(const b of p.places.filter(b=>!b.id.startsWith(mill.id)))
    expect(b.x < yard.x+yard.w && b.x+b.w > yard.x && b.y < yard.y+yard.h && b.y+b.h > yard.y,b.name).toBe(false);
});


it("places wet processing only beside fresh water, keeping the whole work yard clear", () => {
  const s={...setting("London 1650"),role:"Tanner"};
  const site={id:"tanning-bank",cx:0,cy:0,home:true,center:{x:0,y:0},profile:{...settlementProfile(s),radius:60}};
  const without=planSettlement(site,packForSetting(s),"processing-yard",()=>flat(),[]);
  expect(without.places.some(p=>p.institution==="tannery")).toBe(false);
  const sample=(x:number)=>({...flat(),water:x>=75 && x<=79 ? -5 : 100});
  const plan=planSettlement(site,packForSetting(s),"processing-yard",sample,[]);
  const tannery=plan.places.find(p=>p.institution==="tannery")!;
  expect(tannery).toBeDefined();
  const yard=plan.plots.find(p=>p.id===`${tannery.id}-yard`)!;
  expect(yard).toBeDefined();
  for(let y=yard.y;y<yard.y+yard.h;y++) for(let x=yard.x;x<yard.x+yard.w;x++)
    expect(sample(x).water,`${x},${y}`).toBeGreaterThanOrEqual(4);
  expect(plan.solid.has(`${tannery.entrance.x},${tannery.entrance.y}`)).toBe(false);
  for(const b of plan.places.filter(b=>!b.id.startsWith(tannery.id)))
    expect(b.x < yard.x+yard.w && b.x+b.w > yard.x && b.y < yard.y+yard.h && b.y+b.h > yard.y,b.name).toBe(false);
});
