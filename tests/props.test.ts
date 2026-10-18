import { cultures } from "../src/content/history/types";
import { europeanDetails } from "../src/content/props/settlement-details/europe";
import { asianDetails } from "../src/content/props/settlement-details/asia";
import propAtlas from "../src/render/generated/props.json";
import natureAtlas from "../src/render/generated/nature-atlas.json";
import { reviewedPropFrame } from "../src/render/prop-variety";
import { historicalWell } from "../src/content/props/wells";
import { containerProps, regionalContainers, regionalContainer } from "../src/content/props/containers";
import { propSprite } from "../src/content/props/place";
import { propVariety } from "../src/render/prop-variety";
import type { WorldSetting } from "../src/content/geography/types";
import { eras } from "../src/content/history/dates";
import { describe, it, expect } from "vitest";
import { about } from "../src/content/props/about";
import {
  createSession,
  createSettingSession,
  restoreSession,
  Runtime,
} from "../src/runtime/session";
import {
  propKit,
  propDefs,
  propVisualCells,
} from "../src/content/props/catalog";
import { resolveSetting } from "../src/content/geography/resolve";
import { buildingRoofCells } from "../src/content/graphics/models";
import { packs } from "../src/content/packs";
import { withProps } from "../src/content/props/place";
import type { PlayerCommand, WorldModel, WorldObject } from "../src/core/types";
import type { Engine } from "../src/core/engine";
let serial = 0;
const act = (e: Engine, command: PlayerCommand) =>
  e.act({
    actionId: `prop-${serial++}`,
    expectedRevision: e.state.revision,
    command,
  });
const interaction = (e: Engine, o: WorldObject, action: any) =>
  act(e, { type: "interact", target: o.id, action });
function fixture() {
  const e = createSession("roman", "prop-fixture");
  const pos = e.state.player.pos;
  const pot: WorldObject = {
    id: "test-pot",
    prop: "pot",
    name: "Test pot",
    kind: "container",
    sprite: "study-prop-earthen-pot-0",
    pos: { ...pos, x: pos.x + 1 },
    inventory: { grain: 3, water: 2 },
  };
  const stick: WorldObject = {
    id: "test-stick",
    prop: "stick",
    name: "Stout stick",
    kind: "container",
    sprite: "study-prop-stick-0",
    pos: { ...pos, y: pos.y + 1 },
    inventory: {},
  };
  e.state.objects.push(pot, stick);
  return { e, pot, stick };
}
describe("interactive props", () => {
  it("ships the twelve approved containers in indoor and outdoor regional kits", () => {
    const cases = [
      ["waterskin","north-african-west-asian",-6500,37.6,32.8],
      ["merchantBale","european",100,42,12],
      ["waterJar","south-asian",1600,26,75],
      ["milkBag","inner-eurasian",1200,47,100],
      ["onggiJar","east-asian",1700,37.5,127],
      ["taru","east-asian",1700,35,135],
      ["riceBale","east-asian",1700,35,135],
      ["tradeJar","southeast-asian",1600,14,121],
      ["milkVessel","east-southern-african",1500,8,46],
      ["urpu","andean",1500,-13.5,-72],
      ["barkBox","other-indigenous-american",1600,46,-80],
      ["coolamon","australian-pacific",1500,-25,133],
    ] as const;
    for (const [key,culture,year,lat,lon] of cases) {
      const setting = { culture,year,lat,lon,settlement:"village",climate:"temperate",placeId:"container-test" } as WorldSetting;
      const kit=propKit({...packs.roman,year,setting});
      for (const context of ["household","yard"] as const) expect(kit.contexts[context],key).toContain(key);
      const sprite=propSprite(key)!;
      expect(sprite).toBe(containerProps[key].sprite);
      expect(natureAtlas.frames).toHaveProperty(sprite);
      expect(propVariety("test",sprite,1,2)).toEqual({flip:false,tint:0xffffff});
    }
  });
  it("shares simple storage technologies while limiting specific traditions", () => {
    const s={culture:"european",year:-5000,lat:50,lon:10,settlement:"village"} as WorldSetting;
    expect(regionalContainers(s)).toContain("waterskin");
    expect(regionalContainers({...s,year:-20000})).not.toContain("waterskin");
    expect(regionalContainers({...s,culture:"mesoamerican",year:1400,lat:19,lon:-99})).not.toContain("waterskin");
    expect(regionalContainers({...s,culture:"east-asian",year:1700,lat:37,lon:127})).not.toContain("taru");
    expect(regionalContainers({...s,culture:"east-asian",year:1700,lat:35,lon:135})).not.toContain("onggiJar");
    expect(regionalContainers({...s,culture:"andean",year:1000,lat:-13,lon:-72})).not.toContain("urpu");
    expect(regionalContainers({...s,culture:"australian-pacific",year:1500,lat:-20,lon:175})).not.toContain("coolamon");
    expect(regionalContainers({...s,culture:"east-asian",year:2020,lat:37,lon:127})).toContain("onggiJar");
    expect(regionalContainers({...s,culture:"south-asian",year:2020,lat:26,lon:75})).toContain("waterJar");
    const port={...s,culture:"east-southern-african" as const,year:1600,lat:-6,lon:39,settlement:"port" as const};
    expect(regionalContainers(port)).toContain("tradeJar");
    expect(regionalContainers({...port,settlement:"village"})).not.toContain("tradeJar");
    for (const key of ["well","marketCounter","room-plant","room-claybin","room-chest"])
      expect(regionalContainer(port,key,0)).toBeUndefined();
  });
  it("dresses planned storage without replacing its goods or ownership", () => {
    const setting={culture:"east-asian",year:1700,lat:35,lon:135,settlement:"village",climate:"temperate",placeId:"test"} as WorldSetting;
    const outside: WorldObject={id:"outdoor-rice",name:"Grain sacks",kind:"container",prop:"grainSacks",sprite:"study-propb-grain-sacks-0",inventory:{grain:17},owner:"owner",pos:{x:15,y:15,space:"outside"}};
    const indoor={...outside,id:"indoor-rice",pos:{...outside.pos,space:"home"},inventory:{grain:9}};
    const world={generatorVersion:3,pack:{...packs.roman,year:1700,setting},settlements:[],places:[],initialActors:[],initialObjects:[outside,indoor],spawn:{x:0,y:0,space:"outside"},terrain:()=>"grass",decoration:()=>undefined,blocked:()=>false,place:()=>({entrance:{x:15,y:15}})} as unknown as WorldModel;
    // Find an ordinary placement seed that exercises both eligible replacements.
    for (let i=0;i<20 && [outside,indoor].some(o => !o.sprite.startsWith("nature-container-"));i++) withProps(world,`storage-${i}`);
    expect(outside.sprite).toMatch(/^nature-container-(ricebale|bale|taru)$/);
    expect(indoor.sprite).toMatch(/^nature-container-(ricebale|bale|taru)$/);
    expect(outside.inventory).toEqual({grain:17});
    expect(indoor.inventory).toEqual({grain:9});
    expect(outside.owner).toBe("owner");
    expect(outside.pos.space).toBe("outside");
    expect(indoor.pos.space).toBe("home");
  });
  it("creates regional containers in furnished interiors and keeps them on reload", () => {
    const resolved=resolveSetting("Kyoto 1700") as {setting: WorldSetting};
    const e=createSettingSession(resolved.setting,"storage-interiors");
    const homes=e.state.households!.map(h=>h.residence).filter((s): s is string => !!s);
    for (const home of homes.slice(0,12)) e.interiorOf(home);
    const native=e.state.objects.filter(o=>o.id.includes("-room-") && o.sprite.startsWith("nature-container-"));
    expect(native.length).toBeGreaterThan(0);
    for (const o of native) {
      expect(o.pos.space).not.toBe("outside");
      expect(o.sprite).toBe(propDefs[o.prop!].sprite);
      expect(natureAtlas.frames).toHaveProperty(o.sprite);
    }
    const restored=restoreSession(e.snapshot());
    expect(restored.state.objects.filter(o=>native.some(n=>n.id===o.id))).toEqual(native);
  });
  it("selects all twelve approved wells in their dated regional contexts", () => {
    const cases = [
      ["timber", "european", -5100, 51, 13, "well", "village"],
      ["indus", "south-asian", -2300, 27, 68, "well", "city"],
      ["roman", "european", 100, 42, 12, "well", "city"],
      ["han", "east-asian", 100, 34, 109, "well", "city"],
      ["windlass", "european", 1450, 54, -1, "well", "village"],
      ["japan", "east-asian", 1750, 35, 139, "well", "city"],
      ["venice", "european", 1600, 45.44, 12.33, "townWell", "port"],
      ["westasia", "north-african-west-asian", 1500, 32, 54, "well", "city"],
      ["rahat", "south-asian", 1600, 26, 75, "well", "farm"],
      ["arid", "north-african-west-asian", 1400, 31, -8, "well", "village"],
      ["maya", "mesoamerican", 800, 20.2, -89.6, "well", "village"],
      ["pump", "european", 1900, 54, -1, "pump", "city"],
    ] as const;
    for (const [kind,culture,year,lat,lon,key,settlement] of cases) {
      const setting = { culture,year,lat,lon,settlement,climate:"arid" } as WorldSetting;
      const art = historicalWell(setting,key,.1,kind==="rahat");
      expect(art?.sprite).toBe(`nature-well-${kind}`);
      expect(natureAtlas.frames).toHaveProperty(art!.sprite);
    }
  });
  it("limits specialized wells by date, region and use", () => {
    const setting = { culture:"east-asian",year:1750,lat:37.5,lon:127,settlement:"city",climate:"temperate" } as WorldSetting;
    expect(historicalWell(setting,"well",.1)).toBeUndefined();
    expect(historicalWell({...setting,year:100,lat:35,lon:139},"well",.1)).toBeUndefined();
    expect(historicalWell({...setting,culture:"mesoamerican",year:800,lat:19,lon:-99},"well",.1)).toBeUndefined();
    expect(historicalWell({...setting,culture:"mesoamerican",year:800,lat:20.97,lon:-89.62},"well",.1)).toBeUndefined();
    expect(historicalWell({...setting,culture:"mesoamerican",year:1500,lat:20,lon:-89.6},"well",.1)).toBeUndefined();
    const venice = {...setting,culture:"european" as const,year:1600,lat:45.44,lon:12.33,settlement:"port" as const};
    expect(historicalWell(venice,"well",.1)?.sprite).not.toContain("venice");
    expect(historicalWell(venice,"townWell",.8)?.sprite).not.toContain("venice");
    const india = {...setting,culture:"south-asian" as const,year:1600,lat:26,lon:75,settlement:"farm" as const};
    expect(historicalWell(india,"well",.1,false)).toBeUndefined();
    expect(historicalWell({...india,settlement:"city"},"well",.1,false)).toBeUndefined();
    expect(historicalWell({...setting,year:1800},"pump",.1)).toBeUndefined();
    for (const key of ["spring","trough","fountain"])
      expect(historicalWell({...setting,year:100,lat:34,lon:109},key,.1)).toBeUndefined();
  });
  it("mixes approved storage baskets and uses the approved default well", () => {
    for (const v of [0,1,2]) {
      const original = `study-propb-open-basket-${v}`;
      const frames = Array.from({length:1000},(_,i) => reviewedPropFrame(original,(i+.5)/1000));
      expect(frames.filter(f=>f===original)).toHaveLength(500);
      for (const f of new Set(frames)) expect(f.startsWith("nature-") ? natureAtlas.frames : propAtlas.frames).toHaveProperty(f);
      expect(natureAtlas.frames).toHaveProperty(reviewedPropFrame(`study-propb-well-${v}`,0));
    }
    expect(reviewedPropFrame("well",0)).toBe("nature-prop-well-b-0");
    for (const f of ["study-propb-open-basket-3","study-propb-open-basket-0-fallen","study-propb-framed-well-0","study-propb-town-well-0"])
      expect(reviewedPropFrame(f,.9)).toBe(f);
  });
  it("gives every toppling prop leaning and fallen art for every variant", () => {
    const frames = propAtlas.frames as Record<string, unknown>;
    for (const def of Object.values(propDefs).filter(d => d.topples))
      for (let v = 0; v < (def.variants ?? 3); v++)
        for (const state of ["lean-left", "lean-right", "fallen"])
          expect(frames[`study-propb-${def.family}-${v}-${state}`], `${def.family}-${v}-${state}`).toBeTruthy();
  });
  it("scopes new wayside details by region and date", () => {
    const sweden = { culture: "european", year: 1050, lon: 17, lat: 59, settlement: "village" } as const;
    expect(europeanDetails(sweden).some(d => d.prop === "runeMarker")).toBe(true);
    expect(europeanDetails({ ...sweden, year: 1600 }).some(d => d.prop === "runeMarker")).toBe(false);
    expect(europeanDetails({ ...sweden, lon: 2, lat: 48 }).some(d => d.prop === "runeMarker")).toBe(false);
    const rome = { ...sweden, year: 100, lon: 12.5, lat: 42 };
    expect(europeanDetails(rome).find(d => d.prop === "romanMilestone")?.roadside).toBe(true);
    expect(europeanDetails({ ...rome, year: 800 }).some(d => d.prop === "romanMilestone")).toBe(false);
    const japan = { ...sweden, culture: "east-asian", year: 1750, lon: 135, lat: 35 } as const;
    expect(asianDetails(japan).some(d => d.prop === "stoneLantern")).toBe(true);
    expect(asianDetails(japan).some(d => d.id === "town-notices")).toBe(false);
    expect(asianDetails({ ...japan, year: 1500 }).some(d => d.prop === "stoneLantern")).toBe(false);
    expect(asianDetails({ ...japan, lon: 116, lat: 40 }).some(d => d.prop === "stoneLantern")).toBe(false);
  });
  it("says plainly what every prop is", () => {
    for (const id of Object.keys(propDefs))
      expect(about[id], `${id} needs a plain description in about.ts`).toBeTruthy();
  });
  it("hides contents until opened, carries identity, drops and conserves goods across break and reload", () => {
    const { e, pot, stick } = fixture();
    expect(e.inspect(pot.id)?.inventory).toBeUndefined();
    expect(e.observe().objects.find((o) => o.id === pot.id)?.inventory).toEqual(
      {},
    );
    expect(interaction(e, pot, "take").status).toBe("rejected");
    expect(interaction(e, pot, "pickup").status).toBe("completed");
    expect(e.state.player.held).toBe(pot.id);
    // Full hands swap rather than refuse.
    expect(interaction(e, stick, "pickup").status).toBe("completed");
    expect(e.state.player.held).toBe(stick.id);
    expect(pot.carriedBy).toBeUndefined();
    expect(interaction(e, pot, "pickup").status).toBe("completed");
    expect(interaction(e, pot, "look").status).toBe("completed");
    expect(e.inspect(pot.id)?.inventory).toEqual({ grain: 3, water: 2 });
    expect(restoreSession(e.snapshot()).hash()).toBe(e.hash());
    expect(interaction(e, pot, "drop").status).toBe("completed");
    expect(pot.carriedBy).toBeUndefined();
    expect(interaction(e, stick, "pickup").status).toBe("completed");
    expect(interaction(e, pot, "strike").status).toBe("completed");
    expect(pot.broken).toBe(true);
    expect(pot.inventory).toEqual({ grain: 3, water: 2 });
    expect(interaction(e, pot, "strike").status).toBe("rejected");
    const prior = e.state.player.inventory.grain ?? 0;
    const request = {
      actionId: "one-transfer",
      expectedRevision: e.state.revision,
      command: {
        type: "interact" as const,
        target: pot.id,
        action: "take" as const,
      },
    };
    expect(e.act(request).status).toBe("completed");
    e.act(request);
    expect(e.state.player.inventory.grain).toBe(prior + 3);
    expect(Object.values(pot.inventory).every((n) => !n)).toBe(true);
    const restored = restoreSession(e.snapshot());
    expect(restored.hash()).toBe(e.hash());
    expect(restored.state.objects.filter((o) => o.id === pot.id)).toHaveLength(
      1,
    );
  });
  it("rejects remote pickup, broken pickup and forged held identities; retains ownership", () => {
    const { e, pot } = fixture();
    pot.owner = "household";
    interaction(e, pot, "pickup");
    expect(pot.owner).toBe("household");
    expect(e.state.player.memories).toContain(`property:${pot.id}`);
    const bad = e.snapshot();
    bad.player.held = "missing";
    expect(() => restoreSession(bad)).toThrow();
    interaction(e, pot, "drop");
    pot.pos.x += 30;
    expect(interaction(e, pot, "pickup").status).toBe("rejected");
  });
  it("plays back new prop actions deterministically and retains old content manifests", () => {
    const e = createSession("roman", "replay-props");
    const stick = e.state.objects.find((o) => o.id === "prop-arrival-stick")!;
    expect(stick).toBeTruthy();
    expect(interaction(e, stick, "pickup").status).toBe("completed");
    const rt = new Runtime(createSession("roman", "unused"), {
      cacheTerrain: false,
    });
    rt.loadReplay({
      manifest: e.state.manifest,
      commands: e.state.log,
      finalHash: e.hash(),
    });
    e.state.log.forEach(() => rt.stepReplay());
    expect(rt.engine.hash()).toBe(e.hash());
    rt.dispose();
    const old = createSession("roman", "legacy", { content: 1 });
    expect(old.state.objects.some((o) => o.prop)).toBe(false);
    expect(restoreSession(old.snapshot()).hash()).toBe(old.hash());
  });
  it("uses shared context kits with dated and regional differences, without modern containers in early settings", () => {
    expect(propKit(packs.neolithic).contexts.household).not.toContain(
      "plastic",
    );
    expect(propKit(packs.roman).contexts.yard).toContain("amphora");
    const modern = { ...packs.roman, year: 2000 };
    expect(propKit(modern).contexts.yard).toContain("plastic");
    for (const p of [packs.roman, packs.neolithic, modern])
      for (const ids of Object.values(propKit(p).contexts))
        for (const id of ids) expect(propDefs[id]).toBeTruthy();
  });
  it("provides reachable prop pockets without occupying entrances in both demos", () => {
    for (const pack of ["roman", "neolithic"]) {
      const e = createSession(pack, "placement");
      for (const o of e.state.objects.filter((o) => o.prop)) {
        expect(e.world.blocked(o.pos.x, o.pos.y, o.pos.space), o.id).toBe(
          false,
        );
        if (o.pos.space === "outside")
          for (const b of e.world.places)
            expect(
              Math.hypot(b.entrance.x - o.pos.x, b.entrance.y - o.pos.y),
              o.id,
            ).toBeGreaterThanOrEqual(2);
      }
    }
  });
});

it("all twelve eras and culture families resolve a nonempty, known prop set", () => {
  expect(propDefs.tin).toBeUndefined();
  expect(Object.keys(propAtlas.frames).some((frame) => frame.includes("metal-tin"))).toBe(false);
  for (const era of eras)
    for (const [culture] of cultures) {
      const pack = {
        ...packs.roman,
        year: era.sample.year,
        setting: { culture, placeId: "test-place", settlement: "village" },
      } as any;
      const kit = propKit(pack);
      expect(kit.era).toBe(era.id);
      for (const ids of Object.values(kit.contexts)) {
        expect(ids).not.toContain("tin");
        expect(ids.length).toBeGreaterThan(0);
        for (const id of ids) expect(propDefs[id]).toBeTruthy();
        if (pack.year < 1850)
          expect(
            ids.some((id) => ["tin", "plastic", "carton"].includes(id)),
          ).toBe(false);
      }
    }
});

it("preserves planned market pitches and furniture while keeping optional stores off public pavement", () => {
  const pitch: WorldObject = { id: "market-pitch", prop: "marketCounter", name: "Market pitch", kind: "container",
    sprite: "study-propb-stall-awning-0", pos: { x: 4, y: 4, space: "outside" }, inventory: {} };
  const bench: WorldObject = { id: "square-bench", name: "Bench", kind: "container",
    sprite: "study-propb-street-bench-1", pos: { x: 8, y: 4, space: "outside" }, inventory: {} };
  const store: WorldObject = { id: "house-store", name: "Store", kind: "container", sprite: "basket",
    pos: { x: 12, y: 4, space: "outside" }, inventory: {} };
  const yardStore: WorldObject = { ...store, id: "yard-store", pos: { x: 24, y: 24, space: "outside" } };
  const workStore: WorldObject = { ...store, id: "work-store", pos: { x: 14, y: 4, space: "outside" }, inventory: { grain: 7 } };
  const world = { generatorVersion: 3, pack: { ...packs.roman, year: 1888,
    setting: { ...packs.roman.setting, settlement: "city" } },
    settlements: [], places: [], initialActors: [], initialObjects: [pitch, bench, store, yardStore, workStore],
    households: [{ storeId: workStore.id, residence: "home", members: ["smith"] }],
    spawn: { x: 0, y: 0, space: "outside" },
    terrain: () => "paving", decoration: () => undefined,
    topography: (x: number, y: number) => ({ height: 0, surface: "grass", feature: "paving",
      pavement: x >= 18 && y >= 18 ? "yard" : "footway" }),
    blocked: (x: number, y: number) => x === 4 && y === 4,
  } as unknown as WorldModel;
  withProps(world, "public-ground");
  expect(pitch.pos).toEqual({ x: 4, y: 4, space: "outside" });
  expect(bench.sprite).toBe("study-propb-street-bench-1");
  expect(world.initialObjects.map((o) => o.id)).toEqual([pitch.id, bench.id, yardStore.id, workStore.id]);
  expect(yardStore.pos).toEqual({ x: 24, y: 24, space: "outside" });
  expect(yardStore.prop).toBeDefined();
  expect(workStore.pos.space).toBe("home");
  expect(world.households![0].storeId).toBe(workStore.id);
  expect(workStore.inventory.grain).toBe(7);
});

it("keeps European yard kit out of other regions", () => {
  const kit = (culture: string, year: number, lat = 0, lon = 0) => {
    const all = Object.values(
      propKit({
        ...packs.roman,
        year,
        setting: {
          culture,
          placeId: "test-place",
          settlement: "village",
          lat,
          lon,
        },
      } as any).contexts,
    ).flat();
    return new Set(all);
  };
  const angola = kit("west-central-african", 1455, -12.6, 13.4);
  for (const id of [
    "waterButt",
    "privyShed",
    "beehive",
    "plough",
    "farmCart",
    "hitchingPost",
    "rake",
    "scythe",
  ])
    expect(angola.has(id), id).toBe(false);
  for (const id of [
    "poundingMortar",
    "calabash",
    "logHive",
    "stockPen",
    "threeStoneHearth",
  ])
    expect(angola.has(id), id).toBe(true);
  // The Ethiopian highlands ploughed with oxen.
  expect(kit("east-southern-african", 1455, 9, 38.7).has("plough")).toBe(true);
  expect(kit("south-asian", 1600).has("charpoy")).toBe(true);
  expect(kit("south-asian", 1600).has("waterButt")).toBe(false);
  expect(kit("european", 1700).has("waterButt")).toBe(true);
  expect(kit("andean", 1450).has("logHive")).toBe(false);
  expect(kit("australian-pacific", 1200).has("pot")).toBe(false);
});

it("keeps broad yard props clear of houses and one another", () => {
  const resolved = resolveSetting("Congo 1500") as any;
  expect(resolved.error).toBeUndefined();
  const e = createSettingSession(resolved.setting, "yard-clearance");
  const yard = e.state.objects.filter(
    (o) =>
      o.pos.space === "outside" && o.prop && propDefs[o.prop].visualClearance,
  );
  expect(yard.length).toBeGreaterThan(0);
  const claimed = new Set<string>();
  for (const o of yard) {
    for (const p of propVisualCells(o.prop!, o.pos)) {
      const key = `${p.x},${p.y}`;
      expect(claimed.has(key), `${o.id} overlaps another yard prop`).toBe(
        false,
      );
      claimed.add(key);
      expect(
        e.world.places.some(
          (b) => p.x >= b.x && p.x < b.x + b.w && p.y >= b.y && p.y < b.y + b.h,
        ),
        `${o.id} overlaps a house`,
      ).toBe(false);
      expect(
        e.world.places.some((b) =>
          buildingRoofCells(b.sprite, b).some(
            (cell) => cell.x === p.x && cell.y === p.y,
          ),
        ),
        `${o.id} overlaps a roof silhouette`,
      ).toBe(false);
    }
  }
});

it("gives the shared fire its regional form", () => {
  const fire = (culture: string, year: number, extra: object = {}) =>
    propKit({
      ...packs.roman,
      year,
      setting: {
        culture,
        placeId: "test-place",
        settlement: "village",
        lat: 0,
        lon: 0,
        ...extra,
      },
    } as any).contexts.fire;
  expect(fire("european", -3000)).toEqual(["communalHearth"]);
  expect(fire("european", 900, { climate: "boreal" })).toEqual(["longFire"]);
  expect(fire("european", -30000)).toEqual(["campHearth"]);
  expect(fire("other-indigenous-american", 1400)).toEqual(["councilFire"]);
  expect(fire("australian-pacific", 1400, { lat: -18, lon: 178 })).toEqual([
    "earthOven",
  ]);
  expect(fire("australian-pacific", 1400, { lat: -33, lon: 151 })).toEqual([
    "campHearth",
  ]);
  expect(fire("west-central-african", 1455)).toEqual(["threeStoneHearth"]);
  expect(fire("andean", 1450)).toEqual(["firepit"]);
  // The brazier stays in town.
  expect(fire("european", 100, { settlement: "city" })).toEqual(["brazier"]);
  for (const key of [
    "campHearth",
    "communalHearth",
    "councilFire",
    "earthOven",
    "longFire",
  ])
    expect(propDefs[key].seats).toBeTruthy();
});

it("wood takes several strikes and damage persists without spilling early", () => {
  const { e, pot, stick } = fixture();
  pot.prop = "chest";
  interaction(e, stick, "pickup");
  interaction(e, pot, "strike");
  expect(pot.damage).toBe(1);
  expect(pot.broken).not.toBe(true);
  const restored = restoreSession(e.snapshot()),
    o = restored.state.objects.find((o) => o.id === pot.id)!;
  expect(o.damage).toBe(1);
  interaction(restored, o, "strike");
  expect(o.broken).not.toBe(true);
  interaction(restored, o, "strike");
  expect(o.broken).toBe(true);
  expect(o.inventory.grain).toBe(3);
});

it("solid props block their base tile; pickup and break clear it, while drops block again", () => {
  const { e, pot, stick } = fixture();
  const p = e.state.player.pos;
  const delta = [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
  ].find(([x, y]) => !e.world.blocked(p.x + x, p.y + y, p.space))!;
  pot.pos = { ...p, x: p.x + delta[0], y: p.y + delta[1] };
  expect(e.blocked(pot.pos.x, pot.pos.y)).toBe(true);
  expect(interaction(e, pot, "pickup").status).toBe("completed");
  expect(e.blocked(p.x + delta[0], p.y + delta[1])).toBe(false);
  expect(interaction(e, pot, "drop").status).toBe("completed");
  expect(e.blocked(pot.pos.x, pot.pos.y)).toBe(true);
  interaction(e, stick, "pickup");
  interaction(e, pot, "strike");
  expect(pot.broken).toBe(true);
  expect(e.blocked(pot.pos.x, pot.pos.y)).toBe(false);
  expect(propDefs.woodpile.solid).toBe(true);
  expect(propDefs.stick.solid).toBe(false);
});
