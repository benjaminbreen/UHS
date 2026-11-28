import { cultures } from "../src/content/history/types";
import { europeanDetails } from "../src/content/props/settlement-details/europe";
import { asianDetails } from "../src/content/props/settlement-details/asia";
import { waysideFor } from "../src/content/settlements/wayside";
import propAtlas from "../src/render/generated/props.json";
import natureAtlas from "../src/render/generated/nature-atlas.json";
import { reviewedPropFrame } from "../src/render/prop-variety";
import { historicalWell } from "../src/content/props/wells";
import { equipmentVariant, equipmentProps, regionalEquipment, equipmentChoices } from "../src/content/props/equipment";
import { useOf } from "../src/content/props/uses";
import propShadows from "../src/render/generated/prop-shadows.json";
import lighting from "../src/content/graphics/lighting.json";
import { containerProps, regionalContainers, regionalContainer } from "../src/content/props/containers";
import { propSprite } from "../src/content/props/place";
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
import { buildingArtCells } from "../src/content/graphics/models";
import { wallSignDefs } from "../src/content/props/signage";
import { packs } from "../src/content/packs";
import { withProps } from "../src/content/props/place";
import { propAffordances } from "../src/core/props";
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
  it("ships twelve distinct equipment objects with shared uses and individual art", () => {
    expect(Object.keys(equipmentProps)).toHaveLength(12);
    expect(new Set(Object.values(equipmentProps).map(d=>d.name)).size).toBe(12);
    expect(new Set(Object.values(equipmentProps).map(d=>d.sprite)).size).toBe(12);
    const frames=propAtlas.frames as Record<string,any>;
    const cases: [string,string,number][]=[
      ["tannur","north-african-west-asian",1600],["bankedTannur","north-african-west-asian",1600],
      ["teaStove","east-asian",1700],["charcoalStove","east-asian",1700],
      ["brazier","european",1700],["ironPanBrazier","european",1700],
      ["chickenCoop","european",1700],["wovenHenShelter","south-asian",1700],
      ["stockPen","european",1700],["wattlePen","west-central-african",1600],
      ["joinerBench","european",1700],["lowPlaningBench","east-asian",1700],
    ];
    for (const [key,culture,year] of cases) {
      const setting={culture,year,lat:35,lon:40,settlement:"village",climate:"temperate",placeId:"test"} as WorldSetting;
      const kit=propKit({...packs.roman,year,setting});
      // Hens are housed by the yard kit, so a coop is not a door-side prop.
      if(propDefs[key].family!=="chicken-coop")expect(Object.values(kit.contexts).flat(),key).toContain(key);
      const d=propDefs[key];expect(d.name).toBe(equipmentProps[key].name);
      expect(propSprite(key)).toBe(d.sprite);
      expect(frames[d.sprite!],key).toBeDefined();
      expect(about[key],key).toBeTruthy();expect(useOf(d.family),key).toBeDefined();
      for (const phase of lighting)expect((propShadows.frames as Record<string,unknown>)[`${phase.id}:${d.sprite}`],key).toBeDefined();
      if(d.fire)for(let f=1;f<4;f++)expect(frames[`${d.sprite}-f${f}`],key).toBeDefined();
    }
    expect(propDefs.brazier.breakable).toBe("metal");
    expect(propDefs.ironPanBrazier.breakable).toBe("metal");
    expect(useOf(propDefs.brazier.family)?.use).toBe(useOf(propDefs.ironPanBrazier.family)?.use);
    expect(useOf(propDefs.joinerBench.family)?.use).toBe("craft");
  });
  it("bounds named equipment by date and preserves both eligible constructions", () => {
    const s={culture:"european",year:100,settlement:"village"} as WorldSetting;
    for(const key of ["joinerBench","teaStove","ironPanBrazier"])expect(regionalEquipment(s)).not.toContain(key);
    expect(equipmentChoices({...s,year:1700},"brazier")).toEqual(["brazier","ironPanBrazier"]);
    expect(equipmentChoices({...s,culture:"north-african-west-asian",year:1600},"tannur")).toEqual(["tannur","bankedTannur"]);
    expect(regionalEquipment({...s,settlement:"camp",year:1700})).toEqual([]);
    expect(regionalEquipment({...s,culture:"mesoamerican",year:1400})).not.toContain("chickenCoop");
    expect(equipmentChoices(undefined,"brazier")).toEqual(["brazier"]);
  });
  it.runIf(!!process.env.FULL)("binds a regional woodworking bench to an indoor workshop fixture", () => {
    const resolved=resolveSetting("A carpenter in Kyoto, 1700 CE") as {setting: WorldSetting};
    const e=createSettingSession(resolved.setting,"distinct-equipment-0");
    const bench=e.state.objects.find(o=>o.prop==="lowPlaningBench" && o.pos.space!=="outside");
    expect(bench).toBeDefined();
    const room=e.interiorOf(bench!.pos.space)!;
    expect(room.benchCell).toBeDefined();
    expect(room.props.some(q=>q.kind==="fixture")).toBe(true);
    expect(bench!.pos).toMatchObject(room.benchCell!);
    expect(bench!.sprite).toBe(propDefs.lowPlaningBench.sprite);
  });
  it("replaces the medieval shared oven through the normal placement path", () => {
    const setting={culture:"european",year:1350,lat:44.8,lon:20.5,settlement:"village",climate:"temperate",placeId:"test"} as WorldSetting;
    const fire: WorldObject={id:"shared-fire",name:"Fire",kind:"fire",sprite:"fire",inventory:{wood:3},owner:"village",pos:{x:0,y:0,space:"outside"}};
    const world={generatorVersion:3,pack:{...packs.roman,year:1350,setting},settlements:[],places:[],initialActors:[],initialObjects:[fire],spawn:{x:0,y:0,space:"outside"},terrain:()=>"grass",decoration:()=>undefined,blocked:()=>false,place:()=>undefined} as unknown as WorldModel;
    withProps(world,"belgrade-oven");
    expect(fire.prop).toBe("bakeOven");
    expect(fire.sprite).toMatch(/^study-prop-oven-[01]$/);
    expect(fire.inventory).toEqual({wood:3});
    expect(fire.owner).toBe("village");
    const frames=propAtlas.frames as Record<string,any>;
    const shadows=propShadows.frames as Record<string,unknown>;
    for (const base of ["study-prop-oven-0","study-prop-oven-1","study-prop-oven-2","study-prop-hearth-0","study-prop-three-stone-hearth-0","study-propb-kiln-0","study-propb-kiln-1","study-propb-bloomery-0","study-propb-bloomery-1","study-propb-lever-press-0","study-propb-lever-press-1","study-propb-trough-0","study-propb-trough-1"]) {
      expect(frames[base]?.frame.w,base).toBeGreaterThanOrEqual(50);
      expect(frames[base]?.pivot,base).toBeDefined();
      for (const phase of lighting) expect(shadows[`${phase.id}:${base}`],base).toBeDefined();
    }
    for (let i=1;i<4;i++)expect(frames[`study-prop-oven-0-f${i}`]).toBeDefined();
    for (let i=1;i<8;i++)expect(frames[`study-prop-hearth-0-f${i}`]).toBeDefined();
    expect(propSprite("spring")).toBe("study-propb-trough-1");
  });
  it("limits alternate equipment constructions without changing unrelated variations", () => {
    const s={culture:"european",year:-1000,settlement:"village"} as WorldSetting;
    for (const key of ["bakeOven","kiln","bloomery","leverPress"])expect(equipmentVariant(s,key,1),key).toBe(0);
    expect(equipmentVariant({...s,year:1350},"bakeOven",1)).toBe(1);
    expect(equipmentVariant({...s,year:1350},"leverPress",1)).toBe(0);
    expect(equipmentVariant({...s,year:1700},"leverPress",1)).toBe(1);
    expect(equipmentVariant({...s,culture:"east-asian",year:1000},"bloomery",1)).toBe(0);
    expect(equipmentVariant(undefined,"basket",2)).toBe(2);
  });
  it("ships both approved container batches in indoor and outdoor regional kits", () => {
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
      ["egyptJar","north-african-west-asian",-1800,26,32],
      ["canaanJar","north-african-west-asian",-1400,32,35],
      ["paintedChineseJar","east-asian",-2500,35.5,103.5],
      ["grainHamper","west-central-african",1600,8,-12],
      ["olla","mesoamerican",1400,19.4,-99],
      ["andeanSack","andean",1000,-13.5,-72],
      ["parfleche","other-indigenous-american",1850,45,-105],
      ["pacificBasket","australian-pacific",1800,-21,-175],
      ["grainBin","south-asian",1600,26,75],
      ["stonewareCrock","european",1800,51,7],
      ["keroseneTin","european",1900,51,0],
    ] as const;
    for (const [key,culture,year,lat,lon] of cases) {
      const setting = { culture,year,lat,lon,settlement:"village",climate:"temperate",placeId:"container-test" } as WorldSetting;
      const kit=propKit({...packs.roman,year,setting});
      for (const context of ["household","yard"] as const) expect(kit.contexts[context],key).toContain(key);
      expect(propAtlas.frames).toHaveProperty(propSprite(key)!);
      const furniture = ["room-jars","room-sacks","room-basket","room-pack","room-crate"];
      const indoorChoices = furniture.flatMap(f => Array.from({length:100},(_,i) => regionalContainer(setting,f,i/100)));
      expect(indoorChoices,key).toContain(key);
    }
  });
  it("keeps the second batch inside its regional, chronological and trade scopes", () => {
    const s={culture:"north-african-west-asian",year:-1400,lat:32,lon:35,settlement:"village"} as WorldSetting;
    expect(regionalContainers(s)).not.toContain("egyptJar");
    expect(regionalContainers({...s,year:100})).not.toContain("canaanJar");
    const crete={...s,culture:"european" as const,lat:35,lon:25,settlement:"port" as const};
    expect(regionalContainers(crete)).toContain("canaanJar");
    expect(regionalContainers({...crete,settlement:"village"})).not.toContain("canaanJar");
    expect(regionalContainers({...crete,lon:33,lat:35})).toContain("canaanJar");
    expect(regionalContainers({...s,lon:31,lat:27,settlement:"city"})).toContain("canaanJar");
    const gansu={...s,culture:"east-asian" as const,year:-2500,lat:35.5,lon:103.5};
    expect(regionalContainers({...gansu,lon:116})).not.toContain("paintedChineseJar");
    expect(regionalContainers({...gansu,year:100})).not.toContain("paintedChineseJar");
    expect(regionalContainers({...s,culture:"mesoamerican",year:1400,lat:20,lon:-89})).not.toContain("olla");
    expect(regionalContainers({...s,culture:"other-indigenous-american",year:1400,lat:45,lon:-105})).not.toContain("parfleche");
    expect(regionalContainers({...s,culture:"other-indigenous-american",year:1850,lat:45,lon:-75})).not.toContain("parfleche");
    expect(regionalContainers({...s,culture:"australian-pacific",year:1800,lat:-20,lon:133})).not.toContain("pacificBasket");
    expect(regionalContainers({...s,culture:"australian-pacific",year:1800,lat:-42,lon:173})).not.toContain("pacificBasket");
    expect(regionalContainers({...s,culture:"south-asian",year:1600,lat:26,lon:75,settlement:"camp"})).not.toContain("grainBin");
    const europe={...s,culture:"european" as const,lat:51,lon:7};
    for (const key of ["stonewareCrock","keroseneTin"])
      expect(regionalContainers({...europe,year:1400}),key).not.toContain(key);
    expect(regionalContainers({...europe,year:1850})).not.toContain("keroseneTin");
    expect(regionalContainers({...s,culture:"mesoamerican",year:2020,lat:19,lon:-99})).toContain("olla");
    expect(regionalContainers({...s,culture:"australian-pacific",year:2020,lat:-21,lon:-175})).toContain("pacificBasket");
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
    const regional=/^study-propb-(rice-bale|merchant-bale-large|taru-large)-\d$/;
    for (let i=0;i<20 && [outside,indoor].some(o => !regional.test(o.sprite));i++) withProps(world,`storage-${i}`);
    expect(outside.sprite).toMatch(regional);
    expect(indoor.sprite).toMatch(regional);
    expect(outside.inventory).toEqual({grain:17});
    expect(indoor.inventory).toEqual({grain:9});
    expect(outside.owner).toBe("owner");
    expect(outside.pos.space).toBe("outside");
    expect(indoor.pos.space).toBe("home");
  });
  it.runIf(!!process.env.FULL)("creates regional containers in furnished interiors and keeps them on reload", () => {
    const resolved=resolveSetting("Kyoto 1700") as {setting: WorldSetting};
    const e=createSettingSession(resolved.setting,"storage-interiors");
    const homes=e.state.households!.map(h=>h.residence).filter((s): s is string => !!s);
    for (const home of homes.slice(0,12)) e.interiorOf(home);
    const native=e.state.objects.filter(o=>o.id.includes("-room-") && o.prop! in containerProps);
    expect(native.length).toBeGreaterThan(0);
    for (const o of native) {
      expect(o.pos.space).not.toBe("outside");
      expect(o.sprite).toBe(propSprite(o.prop!));
      expect(propAtlas.frames).toHaveProperty(o.sprite);
    }
    const restored=restoreSession(e.snapshot());
    expect(restored.state.objects.filter(o=>native.some(n=>n.id===o.id))).toEqual(native);
  }, 240000);
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
  it("mixes approved storage baskets and uses the animated redrawn wells", () => {
    for (const v of [0,1,2]) {
      const original = `study-propb-open-basket-${v}`;
      const frames = Array.from({length:1000},(_,i) => reviewedPropFrame(original,(i+.5)/1000));
      expect(frames.filter(f=>f===original)).toHaveLength(500);
      for (const f of new Set(frames)) expect(f.startsWith("nature-") ? natureAtlas.frames : propAtlas.frames).toHaveProperty(f);
      const wellFrame = reviewedPropFrame(`study-propb-well-${v}`,0);
      expect(wellFrame).toBe(`study-propb-well-${v}`);
      expect(propAtlas.frames).toHaveProperty(wellFrame);
      expect(propAtlas.frames).toHaveProperty(`${wellFrame}-m1`);
    }
    expect(reviewedPropFrame("well",0)).toBe("study-propb-well-0");
    for (const f of ["study-propb-open-basket-3","study-propb-open-basket-0-fallen","study-propb-framed-well-0","study-propb-town-well-0"])
      expect(reviewedPropFrame(f,.9)).toBe(f);
  });
  it("gives every toppling prop leaning and fallen art for every variant", () => {
    const frames = propAtlas.frames as Record<string, unknown>;
    // Palace furniture is painted on demand (render/fair/palace.ts), not cut from the atlas, and has no fallen art yet.
    for (const def of Object.values(propDefs).filter(d => d.topples && !d.family.startsWith("palace-")))
      for (let v = 0; v < (def.variants ?? 3); v++)
        for (const state of ["lean-left", "lean-right", "fallen"])
          expect(frames[`study-propb-${def.family}-${v}-${state}`], `${def.family}-${v}-${state}`).toBeTruthy();
  });
  it("takes a bin's lid off and puts it back, and dents it under a blow", () => {
    const e = createSession("roman", "bin-fixture");
    const pos = e.state.player.pos;
    const bin: WorldObject = { id: "test-bin", prop: "dustbin", name: "Galvanised bin", kind: "container",
      sprite: "study-propb-dustbin-0", pos: { ...pos, x: pos.x + 1 }, inventory: { grain: 1 } };
    e.state.objects.push(bin);
    const labels = () => propAffordances(e.state, bin, true).map(a => a.label);
    expect(labels()).toContain("Lift the lid");
    expect(interaction(e, bin, "look").status).toBe("completed");
    expect(bin.open).toBe(true);
    expect(labels()).toContain("Put the lid back on");
    expect(interaction(e, bin, "close").status).toBe("completed");
    expect(bin.open).toBe(false);
    expect(interaction(e, bin, "strike").status).toBe("completed");
    expect(bin.damage).toBe(1);
    expect(bin.broken).toBeFalsy();
    const frames = propAtlas.frames as Record<string, unknown>;
    // A room's own furniture is drawn open by the room painter, not from the atlas.
    for (const [, def] of Object.entries(propDefs).filter(([k, d]) => d.lid && !k.startsWith("room-")))
      for (let v = 0; v < (def.variants ?? 3); v++)
        expect(frames[`study-propb-${def.family}-${v}-open`], `${def.family}-${v}-open`).toBeTruthy();
  });
  it("opens a privy's door onto its seat and shuts it again", () => {
    const e = createSession("roman", "privy-fixture");
    const pos = e.state.player.pos;
    const privy: WorldObject = { id: "test-privy", prop: "privyShed", name: "Privy", kind: "container",
      sprite: "study-propb-privy-shed-0", pos: { ...pos, x: pos.x + 1 }, inventory: {} };
    e.state.objects.push(privy);
    const labels = () => propAffordances(e.state, privy, true).map(a => a.label);
    expect(labels()).toContain("Open the door");
    expect(interaction(e, privy, "open").status).toBe("completed");
    expect(privy.open).toBe(true);
    expect(labels()).toContain("Shut the door");
    expect(interaction(e, privy, "close").status).toBe("completed");
    expect(privy.open).toBe(false);
    const frames = propAtlas.frames as Record<string, unknown>;
    for (const def of Object.values(propDefs).filter(d => d.door))
      for (let v = 0; v < (def.variants ?? 3); v++)
        expect(frames[`study-propb-${def.family}-${v}-open`], `${def.family}-${v}-open`).toBeTruthy();
  });
  it("walks you to the privy, sits you inside and gets you up again", () => {
    const e = createSession("roman", "privy-fixture");
    const pos = e.state.player.pos;
    const privy: WorldObject = { id: "test-privy", prop: "privyShed", name: "Privy", kind: "container",
      sprite: "study-propb-privy-shed-0", pos: { ...pos, x: pos.x + 4 }, inventory: {} };
    e.state.objects.push(privy);
    const runtime = new Runtime(e, { cacheTerrain: false });
    runtime.toPrivy();
    for (let n = 0; n < 200 && runtime.autopilot; n++) runtime.tick();
    expect(e.state.player.seated).toMatchObject({ on: privy.id, pose: "sit-seat" });
    expect(privy.open).toBe(true);
    act(e, { type: "wait", seconds: 60 });
    expect(e.state.player.seated).toBeDefined();
    act(e, { type: "move", dx: 0, dy: 1 });
    expect(e.state.player.seated).toBeUndefined();
    expect(privy.open).toBe(false);
  });
  it("keeps an oven's fire in after you cook at it, and draws it cold", () => {
    const e = createSession("roman", "oven-fixture");
    const pos = e.state.player.pos;
    const oven: WorldObject = { id: "test-oven", prop: "tannur", name: "Clay tannur", kind: "container",
      sprite: "study-prop-tannur-0", pos: { ...pos, x: pos.x + 1 }, inventory: {} };
    e.state.objects.push(oven);
    e.state.player.inventory.meat = 1;
    const before = e.state.clock;
    expect(interaction(e, oven, "cook").status).toBe("completed");
    expect(oven.fired).toBe(before);
    const frames = propAtlas.frames as Record<string, unknown>;
    for (const family of ["tannur", "stove"])
      for (let v = 0; v < 3; v++) expect(frames[`study-prop-${family}-${v}-out`], `${family}-${v}-out`).toBeTruthy();
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
    expect(waysideFor({ culture: "south-asian", year: 1650 })).toMatchObject({
      waymark: 4,
      shrine: 4,
      companion: { family: "water-station", variant: 0 },
      pocketFinish: "swept",
    });
    expect(waysideFor({ ...japan, year: 1350 })).toMatchObject({
      waymark: 5,
      shrine: 5,
      altShrine: { family: "jizo", variant: 1 },
      companion: { family: "bench", variant: 2 },
      pocketFinish: "gravel",
    });
    expect(waysideFor({ ...rome, climate: "mediterranean" })).toMatchObject({
      waymark: 2,
      shrine: 1,
      companion: { family: "street-fountain", variant: 0 },
      pocketFinish: "gravel",
    });
    expect(waysideFor({ culture: "other-indigenous-american", year: -1200, climate: "tundra" })).toMatchObject({
      stone: 4,
      companion: { family: "seat-stone", variant: 0 },
      pocketFinish: "beaten",
    });
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
  const cases = process.env.FULL ? [["Congo 1500", "yard-clearance"], ["Bronze Age Denmark", "a"]] : [["Bronze Age Denmark", "a"]];
  for (const [query, seed] of cases) {
    const resolved = resolveSetting(query) as any;
    expect(resolved.error).toBeUndefined();
    const e = createSettingSession(resolved.setting, seed);
    // A prop may cover a wall it stands in front of, but not share a row with
    // the drawn walls, nor reach the roof.
    const walls = new Set<string>(), roofs = new Set<string>();
    for (const b of e.world.places)
      for (const p of buildingArtCells(b.sprite, b)) (p.y < b.y ? roofs : walls).add(`${p.x},${p.y}`);
    const yard = e.world.initialObjects.filter(
      (o) => o.pos.space === "outside" && o.prop && propDefs[o.prop] && !wallSignDefs[o.prop],
    );
    expect(yard.length).toBeGreaterThan(50);
    const claimed = new Set<string>();
    for (const o of yard) {
      const cells = propVisualCells(o.prop!, o.pos);
      for (const p of cells) {
        const key = `${p.x},${p.y}`;
        if (cells.length > 1) {
          expect(claimed.has(key), `${o.id} overlaps another yard prop`).toBe(false);
          claimed.add(key);
        }
        expect(p.y >= o.pos.y && walls.has(key), `${o.id} overlaps a house`).toBe(false);
        expect(roofs.has(key), `${o.id} overlaps a roof silhouette`).toBe(false);
      }
    }
  }
});

it("keeps trade works with their trade and yard props off house platforms", () => {
  const resolved = resolveSetting("Rice farmer in Chengdu 363 BCE") as any;
  const e = createSettingSession(resolved.setting, "kilns");
  const { world } = e;
  for (const o of world.initialObjects.filter((o) => ["kiln", "bloomery"].includes(o.prop ?? "") && o.id.includes("-prop"))) {
    const b = world.places.find((b) => o.id.startsWith(`${b.id}-prop`))!;
    const role = world.initialActors.find((a) => a.id === b.owner)?.role;
    expect(`${b.name} ${role}`, o.id).toMatch(/potter|smith|smelt/i);
  }
  const yard = world.initialObjects.filter((o) => /-(prop\d|privy)$/.test(o.id) && o.pos.space === "outside");
  expect(yard.length).toBeGreaterThan(0);
  for (const o of yard)
    for (const q of propVisualCells(o.prop!, o.pos))
      expect(!!world.topography?.(q.x, q.y)?.plinth, `${o.id} on a platform`).toBe(false);
});

it("houses a household's hens in a henhouse: in at dusk, eggs by morning", () => {
  const resolved = resolveSetting("A farmer in Normandy, 1300") as any;
  expect(resolved.error).toBeUndefined();
  // A seed whose yards have room for one: a cramped back yard keeps a coop instead.
  const e = createSettingSession(resolved.setting, "eggs");
  const houses = e.world.places.filter((b) => b.claim === "yard-henhouse");
  expect(houses.length).toBeGreaterThan(0);
  e.syncFauna();
  const mine = houses.find((b) => e.state.fauna!.some((g) => g.house === b.id))!;
  expect(mine, "a henhouse has its flock").toBeTruthy();
  // Behind its house, never across the front of it.
  for (const b of houses) {
    const home = e.world.places.find((h) => h.owner === b.owner && h !== b)!;
    expect(b.y + b.h, `${b.id} stands behind its house`).toBeLessThanOrEqual(home.y);
  }
  // Bring the player home so the flock is simulated, and run to midnight.
  e.state.player.pos = { x: mine!.entrance.x, y: mine!.entrance.y + 3, space: "outside" };
  e.syncFauna();
  const flock = e.state.fauna!.find((g) => g.house === mine!.id)!;
  expect(flock.members.length).toBeGreaterThan(1);
  const hour = () => (e.state.clock / 3600) % 24;
  for (let i = 0; i < 40 && !(hour() >= 23); i++) e.advance(1800);
  expect(flock.burrowed, "the hens have gone in").toBeGreaterThan(e.state.clock);
  for (let i = 0; i < 40 && !(hour() >= 8 && hour() < 9); i++) e.advance(1800);
  expect(flock.burrowed).toBeUndefined();
  expect(flock.eggs).toBeGreaterThan(0);
  // Inside: nest boxes and a perch, and the eggs come away in the hand.
  const room = e.interiorOf(mine!.id)!;
  expect(room).toBeTruthy();
  const box = e.state.objects.find((o) => o.pos.space === mine!.id && o.prop === "room-nestbox")!;
  expect(box).toBeTruthy();
  expect(e.state.objects.some((o) => o.pos.space === mine!.id && o.prop === "room-roost")).toBe(true);
  const stand = [[0, 1], [1, 1], [-1, 0], [2, 0], [0, -1]].map(([dx, dy]) => ({ x: box.pos.x + dx, y: box.pos.y + dy })).find((q) => !e.blocked(q.x, q.y, mine!.id))!;
  e.state.player.pos = { ...stand, space: mine!.id };
  expect(e.usable()?.label).toBe("Collect eggs from the nest boxes");
  const laid = flock.eggs!;
  e.act({ actionId: "eggs", expectedRevision: e.state.revision, command: { type: "interact", target: box.id, action: "use-prop" } });
  expect(e.state.player.inventory.eggs).toBe(laid);
  expect(flock.eggs).toBe(0);
  // The player's own: left open at night, sooner or later the fox gets one; shut, never.
  const own = e.state.fauna!.find((g) => g.house && g.owner === "player")!;
  const coop = e.world.place(own.house!)!;
  e.state.player.pos = { x: coop.entrance.x, y: coop.entrance.y + 3, space: "outside" };
  const nights = (shut: boolean, most: number) => {
    const start = own.members.length;
    for (let n = 0; n < most && own.members.length === start; n++) {
      e.advance(((45 - hour()) % 24) * 3600);
      own.shut = shut;
      e.advance(11.5 * 3600);
      own.shut = false;
    }
    return start - own.members.length;
  };
  expect(nights(true, 1)).toBe(0);
  expect(nights(false, 10)).toBe(1);
  expect(e.state.events.some((v) => /fox got into the henhouse/.test(v.text))).toBe(true);
  expect(e.state.objects.some((o) => o.id.startsWith(`remains-${own.id}-raid-`))).toBe(true);
});

it.runIf(!!process.env.FULL)("gives a dairymaid a byre: cows in at night, milked there, and her day's work inside it", () => {
  const resolved = resolveSetting("A dairymaid in Normandy, 1300") as any;
  expect(resolved.error).toBeUndefined();
  const e = createSettingSession(resolved.setting, "byre");
  expect(e.state.player.origin?.livelihood).toMatch(/dairy|milk/);
  const byre = e.world.places.find((b) => b.claim === "yard-byre" && b.owner === "player")!;
  expect(byre, "the dairymaid's household has a byre").toBeTruthy();
  // The day's first work is inside it, and some mornings begin there.
  expect(e.workPlan()?.places[0]?.pos.space).toBe(byre.id);
  expect([byre.id, "outside"]).toContain(e.state.player.pos.space);
  e.state.player.pos = { x: byre.entrance.x, y: byre.entrance.y + 3, space: "outside" };
  e.syncFauna();
  const cows = e.state.fauna!.find((g) => g.house === byre.id)!;
  expect(cows.members.length).toBeGreaterThan(0);
  const hour = () => (e.state.clock / 3600) % 24;
  for (let i = 0; i < 40 && !(hour() >= 22); i++) e.advance(1800);
  expect(cows.burrowed, "the cows are in").toBeGreaterThan(e.state.clock);
  for (let i = 0; i < 40 && !(hour() >= 6 && hour() < 7); i++) e.advance(1800);
  expect(cows.milk).toBeGreaterThan(0);
  e.interiorOf(byre.id);
  const stall = e.state.objects.find((o) => o.pos.space === byre.id && o.prop === "room-stall")!;
  expect(stall).toBeTruthy();
  expect(e.state.objects.some((o) => o.pos.space === byre.id && o.prop === "room-manger")).toBe(true);
  const stand = [[0, 1], [1, 1], [-1, 0], [2, 0], [0, -1]].map(([dx, dy]) => ({ x: stall.pos.x + dx, y: stall.pos.y + dy })).find((q) => !e.blocked(q.x, q.y, byre.id))!;
  e.state.player.pos = { ...stand, space: byre.id };
  const milk = cows.milk!;
  e.act({ actionId: "milk", expectedRevision: e.state.revision, command: { type: "interact", target: stall.id, action: "use-prop" } });
  expect(e.state.player.inventory.milk).toBe(milk);
  for (let i = 0; i < 40 && !(hour() >= 9 && hour() < 10); i++) e.advance(1800);
  expect(cows.burrowed, "turned out after milking").toBeUndefined();
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

it("lets indoor props be picked up and carried outside, while stools and chairs default to sitting as primary", () => {
  const e = createSession("roman", "indoor-pickup");
  e.world.pack.setting = (resolveSetting("A clerk in Chicago, 1955") as any).setting;
  const house = e.world.places.find((b) => b.access === "household")!;
  const room = e.interiorOf(house.id)!;
  expect(room).toBeTruthy();
  const indoor = e.state.objects.filter((o) => o.pos.space === house.id && o.prop);
  const seat = indoor.find((o) => o.prop === "room-chair" || o.prop === "room-stool")!;
  expect(seat, "room has a chair or stool").toBeTruthy();
  expect(seat.sprite).toMatch(/^made:room:stool:/);
  expect(propDefs[seat.prop!].portable).toBe(true);
  // Heavy room furniture stays non-portable.
  expect(propDefs["room-table"].portable).toBeFalsy();
  expect(propDefs["room-sofa"].portable).toBeFalsy();

  const beside = [[0, 1], [1, 0], [-1, 0], [0, -1]]
    .map(([dx, dy]) => ({ x: seat.pos.x + dx, y: seat.pos.y + dy }))
    .find((q) => !e.blocked(q.x, q.y, house.id))!;
  e.state.actors = [];
  e.state.player.pos = { ...beside, space: house.id };
  const dx = seat.pos.x - beside.x, dy = seat.pos.y - beside.y;
  e.state.player.direction = dy < 0 ? 0 : dx > 0 ? 1 : dy > 0 ? 2 : 3;

  const rt = new Runtime(e, { cacheTerrain: false });
  const verbs = rt.verbs();
  expect(verbs.primary?.label).toBe(`Sit on the ${seat.name.toLowerCase()}`);
  expect(verbs.alternate?.label).toBe(`Pick up ${seat.name.toLowerCase()}`);

  // Primary (F) sits on the stool/chair.
  expect(rt.runVerb("primary")?.kind).toBe("use");
  expect(e.state.player.seated?.on).toBe(seat.id);

  // Alternate (E) picks it up, clearing its tile and carrying it out the door.
  expect(rt.runVerb("alternate")?.kind).toBe("pickup");
  expect(e.state.player.held).toBe(seat.id);
  expect(seat.carriedBy).toBe("player");
  expect(e.blocked(seat.pos.x, seat.pos.y, house.id)).toBe(false);

  // Carry outside and set it down on clear ground.
  e.state.player.pos = { x: house.entrance.x, y: house.entrance.y + 3, space: "outside" };
  expect(interaction(e, seat, "drop").status).toBe("completed");
  expect(seat.pos.space).toBe("outside");
  expect(seat.carriedBy).toBeUndefined();
  expect(e.state.player.held).toBeUndefined();
  rt.dispose();
});

it("runs working radios, toggleable indoor lights, shrine/map/clock/books/drinks/cat, and NPC room-prop use", () => {
  const r = resolveSetting("A clerk in Chicago, 1955");
  if (!("setting" in r)) throw Error(r.error);
  const e = createSession("roman", "indoor-acts");
  e.world.pack.setting = r.setting;
  e.world.pack.year = 1955;
  const house = e.world.places.find((p) => p.owner && e.interiorOf(p.id))!;
  const room = e.interiorOf(house.id)!;
  e.state.player.pos = { ...room.entry, space: house.id };
  e.state.actors = [];

  const at = { x: room.entry.x, y: room.entry.y - 1, space: house.id };
  const addProp = (id: string, prop: string, open = false) => {
    const def = propDefs[prop];
    const o = { id, name: def.name, kind: (def.container ? "container" : "monument") as "container" | "monument", prop, sprite: prop, pos: { ...at }, inventory: {}, open };
    e.state.objects.push(o);
    return o;
  };

  // 1. Radio: Primary (F) turns it on (playing broadcast), click offers Tune + Turn off, pickup unplugs it.
  const radio = addProp("test-radio", "room-radio", false);
  e.state.player.direction = 0;
  const rt = new Runtime(e, { cacheTerrain: false });
  expect(rt.verbs().primary?.label).toBe("Turn on the radio");
  expect(rt.verbs().alternate?.label).toBe("Pick up cabinet radio");
  expect(rt.runVerb("primary")?.kind).toBe("use");
  expect(radio.open).toBe(true);
  expect(e.state.events.at(-1)!.text).toMatch(/radio|dial/i);
  const radioMenu = e.inspect(radio.id)!.affordances.map((a) => a.label);
  expect(radioMenu).toContain("Tune the radio");
  expect(radioMenu).toContain("Turn off the radio");
  expect(interaction(e, radio, "look").status).toBe("completed");
  expect(radio.open).toBe(true);
  expect(interaction(e, radio, "pickup").status).toBe("completed");
  expect(radio.open).toBe(false);
  expect(interaction(e, radio, "drop").status).toBe("completed");
  e.state.objects = e.state.objects.filter((o) => o !== radio);

  // 2. Electric lamp in 1955 switches on/off; candle/oil lamp in 1500 lights/puts out.
  const lamp = addProp("test-lamp", "room-lamp", false);
  expect(e.usable()).toMatchObject({ id: lamp.id, label: "Switch on the lamp" });
  expect(interaction(e, lamp, "attend").status).toBe("completed");
  expect(lamp.open).toBe(true);
  expect(e.usable()).toMatchObject({ id: lamp.id, label: "Switch off the lamp" });
  expect(interaction(e, lamp, "attend").status).toBe("completed");
  expect(lamp.open).toBe(false);
  e.state.objects = e.state.objects.filter((o) => o !== lamp);

  // 3. Shrine, wall map, clock, books, drinking fountain, and cat.
  const shrine = addProp("test-shrine", "room-shrine", false);
  expect(interaction(e, shrine, "attend").status).toBe("completed");
  expect(shrine.open).toBe(true);
  e.state.objects = e.state.objects.filter((o) => o !== shrine);

  const map = addProp("test-map", "room-map");
  expect(interaction(e, map, "attend").status).toBe("completed");
  expect(e.state.events.at(-1)!.text).toMatch(/Chicago|map/i);
  e.state.objects = e.state.objects.filter((o) => o !== map);

  const clock = addProp("test-clock", "room-clock");
  e.state.clock = 15 * 3600 + 15 * 60;
  expect(interaction(e, clock, "attend").status).toBe("completed");
  expect(e.state.events.at(-1)!.text).toMatch(/quarter past three/i);
  e.state.objects = e.state.objects.filter((o) => o !== clock);

  const books = addProp("test-books", "room-scrolls");
  expect(e.usable()).toMatchObject({ id: books.id, label: "Read a book" });
  expect(interaction(e, books, "attend").status).toBe("completed");
  e.state.objects = e.state.objects.filter((o) => o !== books);

  const fountain = addProp("test-fountain", "room-fountain");
  e.state.player.inventory.water = 0;
  expect(interaction(e, fountain, "attend").status).toBe("completed");
  expect(e.state.player.inventory.water).toBeGreaterThan(0);
  e.state.objects = e.state.objects.filter((o) => o !== fountain);

  const cat = addProp("test-cat", "room-cat", false);
  expect(interaction(e, cat, "attend").status).toBe("completed");
  expect(cat.open).toBe(true);
  e.state.objects = e.state.objects.filter((o) => o !== cat);

  // 4. NPC switches on an unlit lamp at dusk (and respects a lamp the player just switched off).
  for (const o of e.state.objects) if (o.pos.space === house.id && (o.prop === "room-lamp" || o.prop === "room-lantern" || o.prop === "room-tapers" || o.prop === "room-brazier")) o.open = true;
  const duskLamp = addProp("dusk-lamp", "room-lamp", false);
  const hh = e.state.households?.find((h) => h.residence === house.id);
  const resident = {
    id: "room-resident",
    name: "Mina",
    kind: "human" as const,
    role: "Clerk",
    sprite: "human-female",
    householdId: hh?.id,
    pos: { x: room.entry.x, y: room.entry.y, space: house.id },
    home: { x: room.entry.x, y: room.entry.y, space: house.id },
    work: { x: room.entry.x, y: room.entry.y, space: house.id },
    direction: 2 as const,
    activity: "At home",
    hunger: 10,
    fatigue: 10,
    trust: 0,
    inventory: {},
    memories: [],
    offRoutine: true,
  };
  if (hh && !hh.members.includes(resident.id)) hh.members.push(resident.id);
  e.state.actors = [resident];
  e.state.clock = 20 * 3600;
  e.advance(120);
  expect(duskLamp.open).toBe(true);
  expect(e.state.events.some((ev) => /Mina.*lamp/i.test(ev.text))).toBe(true);

  // If the player manually switches it off, NPC leaves it off for the cooldown window.
  expect(interaction(e, duskLamp, "attend").status).toBe("completed");
  expect(duskLamp.open).toBe(false);
  e.advance(120);
  expect(duskLamp.open).toBe(false);
  rt.dispose();
});

it("supports indoor fires with cooking, shuttered windows, spinning craft wheels, player tuck-in beds, resident reactions, and room SFX", async () => {
  const { events } = await import("../src/audio/sfx");
  for (const id of ["switchClick", "radioTune", "shutter", "purr"] as const) {
    expect(events[id]().length).toBeGreaterThan(0);
  }
  const r = resolveSetting("A baker in London, 1650");
  if (!("setting" in r)) throw Error(r.error);
  const e = createSession("roman", "indoor-fixtures");
  e.world.pack.setting = r.setting;
  e.world.pack.year = 1650;
  const house = e.world.places.find((p) => p.owner && e.interiorOf(p.id))!;
  const room = e.interiorOf(house.id)!;
  e.state.player.pos = { ...room.entry, space: house.id };
  e.state.player.householdId = "other-household";
  const at = { x: room.entry.x, y: room.entry.y - 1, space: house.id };
  const addProp = (id: string, prop: string, open = false, owner = house.owner) => {
    const def = propDefs[prop];
    const o = { id, name: def.name, kind: (def.container ? "container" : "monument") as "container" | "monument", prop, sprite: prop, pos: { ...at }, inventory: {}, open, owner };
    e.state.objects.push(o);
    return o;
  };
  e.state.actors = [];

  // 1. Indoor hearth: cooking requires fire lit; kindling enables cooking and warming up.
  const hearth = addProp("test-hearth", "room-hearth", false);
  e.state.player.inventory.meat = 2;
  expect(e.inspect(hearth.id)!.affordances.find((a) => a.label === "Cook meat")).toMatchObject({ enabled: false, reason: "Kindle the fire first" });
  expect(interaction(e, hearth, "attend").status).toBe("completed");
  expect(hearth.open).toBe(true);
  expect(e.lastRoomSound).toBe("fire");
  expect(e.inspect(hearth.id)!.affordances.map((a) => a.label)).toContain("Warm up by the fire");
  expect(interaction(e, hearth, "cook").status).toBe("completed");
  expect(e.state.player.inventory["cooked-meat"]).toBe(2);
  e.state.objects = e.state.objects.filter((o) => o !== hearth);

  // 2. Shuttered window: toggles shutters open/shut + Look out the window describes live weather/place.
  room.params.windowStyle = "shutter";
  const win = addProp("test-window", "room-window", true);
  const winLabels = e.inspect(win.id)!.affordances.map((a) => a.label);
  expect(winLabels).toContain("Shut the shutters");
  expect(winLabels).toContain("Look out the window");
  expect(interaction(e, win, "look").status).toBe("completed");
  expect(e.state.events.at(-1)!.text).toMatch(/London|window/i);
  expect(interaction(e, win, "attend").status).toBe("completed");
  expect(win.open).toBe(false);
  expect(e.lastRoomSound).toBe("shutter");
  e.state.objects = e.state.objects.filter((o) => o !== win);

  // 3. Craft wheel spins when used.
  const wheel = addProp("test-wheel", "room-spinwheel", false);
  expect(interaction(e, wheel, "attend").status).toBe("completed");
  expect(wheel.open).toBe(true);
  e.state.objects = e.state.objects.filter((o) => o !== wheel);

  // 4. Bed lets player lie down under the covers (indoorUse role === "bed").
  const bed = addProp("test-bed", "room-bed", false);
  expect(e.inspect(bed.id)!.affordances.map((a) => a.label)).toEqual(expect.arrayContaining(["Lie down", "Sleep until morning"]));
  expect(interaction(e, bed, "attend").status).toBe("completed");
  expect(e.indoorUse("player", e.state.player.pos)?.role).toBe("bed");
  expect(e.state.player.seated?.on).toBe(bed.id);
  expect(e.lastRoomSound).toBe("rest");
  // Stepping stands back up.
  e.state.player.pos = { ...room.entry, space: house.id };
  delete e.state.player.seated;
  e.state.objects = e.state.objects.filter((o) => o !== bed);

  // 5. Resident reacts verbally when player shuts off their radio or rummages in their icebox.
  const hh = e.state.households?.find((h) => h.residence === house.id);
  const witness = {
    id: "room-witness",
    name: "Arthur",
    kind: "human" as const,
    role: "Baker",
    sprite: "human-male",
    householdId: hh?.id ?? "house-hh",
    pos: { x: room.entry.x + 1, y: room.entry.y, space: house.id },
    home: { x: room.entry.x + 1, y: room.entry.y, space: house.id },
    work: { x: room.entry.x + 1, y: room.entry.y, space: house.id },
    direction: 2 as const,
    activity: "At home",
    hunger: 10,
    fatigue: 10,
    trust: 2,
    inventory: {},
    memories: [],
    offRoutine: true,
  };
  e.state.actors = [witness];
  const radio = addProp("owned-radio", "room-radio", true, witness.id);
  e.signals.length = 0;
  expect(interaction(e, radio, "attend").status).toBe("completed");
  expect(e.signals.some((s) => s.kind === "say" && s.who === witness.id && /listening/i.test(s.text))).toBe(true);
  e.state.objects = e.state.objects.filter((o) => o !== radio);

  const icebox = addProp("owned-icebox", "room-icebox", false, witness.id);
  const trustBefore = witness.trust;
  e.signals.length = 0;
  expect(interaction(e, icebox, "look").status).toBe("completed");
  expect(e.signals.some((s) => s.kind === "say" && s.who === witness.id && /icebox/i.test(s.text))).toBe(true);
  expect(witness.trust).toBe(trustBefore - 1);
});
