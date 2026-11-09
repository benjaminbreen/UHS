vi.mock("../src/render/living-water/game",()=>({openWaterMask:vi.fn()}));
import { Watercraft, mooredBoatFrame, boatFrame, boatPosture, boatCraft } from "../src/render/watercraft";
import { boatArt } from "../src/content/economy/fishing";
import atlas from "../public/packs/boats.json" with { type: "json" };
import { Reflections } from "../src/render/reflections";
import {
  motifKinds,
  motifPixels,
  motifState,
  waterMotif,
  waterCharm,
} from "../src/render/water-motifs";
import { expect, it, vi } from "vitest";
import { rasterWaterTile } from "../src/render/water-raster";
import { waterDistance, waterPalette } from "../src/render/water-style";
import type { TopographySample } from "../src/core/topography";
import { regionalLandforms } from "../src/world/v3/landforms";
import { createSettingSession } from "../src/runtime/session";
import { settingFor } from "../src/content/geography/resolve";
import { places } from "../src/content/geography/places";
import type { WorldSetting } from "../src/content/geography/types";
const setting = (
  ecology: "desert" | "tropical-woodland" | "tundra",
  water: WorldSetting["water"],
): WorldSetting => ({
  ...settingFor(places.find((p) => p.id === "konya")!, -6499),
  geographyMode: "configured",
  terrainRevision: 2,
  water,
  environment: {
    ecology,
    landform: "plain",
    population: "none",
    start: "wanderer",
    household: "mixed",
  },
});
const sample: TopographySample = (x, y) => ({
  height: 0,
  surface: x + Math.sin(y / 11) < 0 ? "water" : "sand",
  waterVisual: {
    distance: x + Math.sin(y / 11),
    ecology: "tropical-woodland",
    kind: "sea",
    shoreWidth: 5,
    flow: [0, 0],
    frozenMargin: false,
  },
});
it("water pixels and animation anchors match across positive and negative chunk origins", () => {
  for (const [ox, oy] of [
    [-32, -16],
    [16, 32],
    [-16, 0],
  ]) {
    const local: TopographySample = (x, y) => sample(x + ox, y + oy);
    for (const [x, y] of [
      [0, 0],
      [15, 15],
      [0, 15],
      [15, 0],
    ]) {
      const a = rasterWaterTile(local, x, y, ox, oy);
      const b = rasterWaterTile(sample, x + ox, y + oy, 0, 0);
      expect(a.pixels).toEqual(b.pixels);
      expect([a.effect.gx, a.effect.gy]).toEqual([b.effect.gx, b.effect.gy]);
      expect(a.effect.edges).toEqual(b.effect.edges);
    }
  }
});
it("reconstructs a continuous bed without a discontinuity at tile boundaries", () => {
  for (let y = -18; y <= 18; y++) {
    expect(
      Math.abs(
        waterDistance(sample, -16 - 1e-7, y) -
          waterDistance(sample, -16 + 1e-7, y),
      ),
    ).toBeLessThan(1e-5);
  }
});
it.runIf(!!process.env.FULL)("retains base ecology on wet banks and exports river tangents without changing downstream direction", () => {
  for (const ecology of ["desert", "tropical-woodland", "tundra"] as const) {
    const s = setting(ecology, "river-ew"),
      seed = "water-ecology";
    const world = createSettingSession(s, seed).world;
    const plan = regionalLandforms(s, seed);
    // The channel meanders around the planned course, so find the water
    // nearest the planned point rather than expecting it exactly there.
    const p = plan.point(0);
    let y = Math.round(p.across);
    for (let d = 0; d < 30; d++) {
      const up = world.topography!(p.along, Math.round(p.across) - d),
        down = world.topography!(p.along, Math.round(p.across) + d);
      if (up.surface === "water" && up.waterDepth === "deep") {
        y = Math.round(p.across) - d;
        break;
      }
      if (down.surface === "water" && down.waterDepth === "deep") {
        y = Math.round(p.across) + d;
        break;
      }
    }
    const c = world.topography!(p.along, y);
    expect(c.surface).toBe("water");
    expect(c.waterVisual?.ecology).toBe(ecology);
    // Downstream direction is preserved; the exact tangent follows the bend.
    expect(c.waterVisual!.flow[0]).toBeGreaterThan(0);
    expect(Math.abs(c.waterVisual!.flow[1])).toBeLessThan(1);
    expect(
      world.canCross?.({ x: p.along, y }, { x: p.along + 1, y }),
    ).toBe(false);
  }
}, 120000); // Three complete regional worlds; slow under a parallel suite.

it("gives tropical rivers and coasts distinct water, and ecological banks distinct minerals", () => {
  const river = waterPalette("tropical-woodland", "river"),
    sea = waterPalette("tropical-woodland", "sea");
  expect(river.depths).not.toEqual(sea.depths);
  const palettes = [
    "desert",
    "tropical-woodland",
    "tundra",
    "temperate-woodland",
  ].map((e) => waterPalette(e as "desert", "sea"));
  expect(new Set(palettes.map((p) => p.depths.join())).size).toBe(4);
  expect(new Set(palettes.map((p) => p.stone.join())).size).toBe(4);
});

it("keeps animated artwork sparse and inside its water tile for every flow direction", () => {
  const e = rasterWaterTile(sample, -2, -2, 0, 0).effect;
  const failures: string[] = [];
  for (const kind of motifKinds)
    for (let frame = 0; frame < 8; frame++) {
      e.cell.waterVisual!.kind = kind === "crest" ? "sea" : "river";
      const pixels = motifPixels(kind, frame);
      const occupied = Array.from(pixels.keys()).filter((i) => pixels[i]);
      expect(occupied.length).toBeLessThan(34);
      const xs = occupied.map((i) => i % 16),
        ys = occupied.map((i) => Math.floor(i / 16));
      for (const flow of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, 1],
      ] as const) {
        e.cell.waterVisual!.flow = flow;
        for (let tick = 0; tick < 80; tick++) {
          const state = motifState(e, kind, tick);
          if (
            !Number.isFinite(state.alpha) ||
            state.alpha < 0 ||
            Math.min(...xs) + state.dx < 0 ||
            Math.max(...xs) + state.dx >= 16 ||
            Math.min(...ys) + state.dy < 0 ||
            Math.max(...ys) + state.dy >= 16
          )
            failures.push(`${kind}/${frame}/${flow}/${tick}`);
        }
      }
    }
  expect(failures).toEqual([]);
});
it("leaves most surface blocks quiet and limits vegetation to suitable freshwater", () => {
  let chosen = 0,
    active = 0;
  const e = rasterWaterTile(sample, -2, -2, 0, 0).effect;
  for (let by = -8; by < 8; by++)
    for (let bx = -8; bx < 8; bx++) {
      let count = 0;
      for (let y = 0; y < 2; y++)
        for (let x = 0; x < 2; x++) {
          e.gx = bx * 32 + x * 16;
          e.gy = by * 32 + y * 16;
          const kind = waterMotif(e);
          if (kind) {
            count++;
            chosen++;
            if (motifState(e, kind, 0).alpha > 0) active++;
          }
          expect(waterCharm(e)).toBeUndefined(); // salt water has no freshwater charms
        }
      expect(count).toBeLessThanOrEqual(1);
    }
  expect(chosen).toBeGreaterThan(100);
  expect(active).toBeLessThan(120); // fewer than 12% of 1024 cells at once
  e.cell.bridge = true;
  expect(waterMotif(e)).toBeUndefined();
  e.cell.bridge = false;
  e.cell.waterVisual!.kind = "river";
  for (const ecology of ["desert", "tundra", "boreal-woodland"] as const) {
    e.cell.waterVisual!.ecology = ecology;
    expect(waterCharm(e)).toBeUndefined();
  }
});

it("adds only occasional freshwater plants and leaves, and freezes them out in winter", () => {
  const e = rasterWaterTile(sample, -2, -2, 0, 0).effect;
  e.cell.waterVisual!.kind = "river";
  e.cell.waterVisual!.distance = -1;
  e.edges = [{ dx: 1, dy: 0, rocky: false }];
  const counts = { plant: 0, leaf: 0, ring: 0 };
  for (let x = -16; x < 16; x++)
    for (let y = -16; y < 16; y++) {
      e.gx = x * 16;
      e.gy = y * 16;
      const charm = waterCharm(e);
      if (charm && charm in counts) counts[charm as keyof typeof counts]++;
    }
  expect(counts.plant).toBeGreaterThan(0);
  expect(counts.leaf).toBeGreaterThan(0);
  expect(counts.ring).toBeGreaterThan(0);
  expect(counts.plant + counts.leaf + counts.ring).toBeLessThan(65);
  e.cell.waterVisual!.frozenMargin = true;
  expect(waterCharm(e)).toBeUndefined();
});

it("keeps low floating hulls out of the upright bank reflection projection",()=>{
  const image=vi.fn(),water=vi.fn(()=>true);
  const reflections=new Reflections({cameras:{main:{worldView:{x:0,y:0,right:500,bottom:500}}},add:{image}} as any,water);
  const sources=["boat-papyrus-dry-4","boat-papyrus-rebound-2-front","boat-papyrus-6-back","boat-wasen-pale-7","boat-wasen-weathered-3-front","boat-wasen-0-back","boat-clinker-1","boat-clinker-1-front","boat-clinker-1-back","worksite-fishing-boat-north","worksite-plank-skiff-east","worksite-reed-skiff-west"].map(name=>
    ({active:true,visible:true,alpha:1,frame:{name}}));
  sources.push({active:true,visible:true,alpha:1,frame:{name:"human-aboard"},getData:()=>true} as any);
  reflections.update(sources as any,0xffffff,0);
  expect(water).not.toHaveBeenCalled();
  expect(image).not.toHaveBeenCalled();
});

it.each([["clinker",0],["wasen",0],["wasen",.5],["wasen",.99],["papyrus",0],["papyrus",.5],["papyrus",.99]] as const)("turns %s at finish %s around a seated person and removes it on leaving the water",(model,variation)=>{
  const images:any[]=[];
  const scene={textures:{get:()=>({has:()=>true})},add:{image:()=>{
    const im:any={setTexture:(_key:string,frame:string)=>{im.frame=frame;return im;},
      setVisible:(v:boolean)=>{im.visible=v;return im;},
      setPosition:(x:number,y:number)=>{im.x=x;im.y=y;return im;},
      setDepth:(d:number)=>{im.depth=d;return im;},
      setOriginFromFrame:()=>im,setTint:()=>im,destroy:vi.fn()};
    images.push(im);return im;
  }}};
  const craft=new Watercraft(scene as any,()=>"boats"),person={x:100,y:200,depth:50,width:80,height:80,setData:vi.fn(),setOrigin:vi.fn()} as any;
  for(let facing=0;facing<8;facing++){
    craft.update(person,"boat",0xffffff,false,facing,model,variation);
    expect(images).toHaveLength(2);
    expect(images.map(im=>im.frame)).toEqual([`${boatFrame(model,facing,variation)}-back`,`${boatFrame(model,facing,variation)}-front`]);
    expect(images[0].depth).toBeLessThan(person.depth);
    expect(images[1].depth).toBeGreaterThan(person.depth);
    expect(images.map(im=>[im.x,im.y])).toEqual([[100,200],[100,200]]);
    craft.placeCrew(person);
    expect(person.setOrigin.mock.lastCall[0]).toBe(.5);
    expect(person.setOrigin.mock.lastCall[1]).toBeCloseTo(1+(model==="papyrus"?10.53:2.6)/80);
  }
  craft.update(person,undefined,0xffffff,false);
  craft.placeCrew(person);
  expect(person.setOrigin).toHaveBeenLastCalledWith(.5,1);
  expect(images.every(im=>!im.visible)).toBe(true);
  expect(person.setData).toHaveBeenLastCalledWith("aboard",false);
  craft.dispose();
  expect(images.every(im=>im.destroy.mock.calls.length===1)).toBe(true);
  expect(mooredBoatFrame("worksite-fishing-boat-east")).toBe("boat-clinker-2");
  expect(mooredBoatFrame("worksite-reed-skiff-east")).toBe("boat-papyrus-2");
});

it.each([["dugout","sit"],["bark","kneel"],["hide","sit"],["raft","sit"]] as const)("moors and crews a %s hull from its own atlas art",(hull,posture)=>{
  const setting={culture:"other-indigenous-american",lat:48} as WorldSetting;
  const frames=(atlas as {frames:Record<string,unknown>}).frames;
  for(const [dir,facing] of [["north",0],["east",2],["south",4],["west",6]] as const) {
    const moored=`${boatArt(hull,setting)}-${dir}`;
    expect(boatCraft(moored)).toBe(hull);
    for(const variation of [0,.5,.99]) {
      const frame=mooredBoatFrame(moored,variation);
      expect(frame).toBe(boatFrame(hull,facing,variation));
      for(const layer of ["","-back","-front"])expect(frames[`${frame}${layer}`],`${frame}${layer}`).toBeDefined();
    }
  }
  expect(boatPosture(hull)).toBe(posture);
});

it("keeps a Japanese boat's material finish when turning or changing between moored and occupied art",()=>{
  for(const [variation,finish] of [[0,""],[.5,"-pale"],[.99,"-weathered"]] as const){
    for(const [suffix,facing] of [["",4],["-north",0],["-east",2],["-west",6]] as const)
      expect(mooredBoatFrame(`worksite-plank-skiff${suffix}`,variation)).toBe(`boat-wasen${finish}-${facing}`);
    for(let f=0;f<8;f++)expect(boatFrame("wasen",f,variation)).toBe(`boat-wasen${finish}-${f}`);
  }
});

it("uses low kneeling crew places and natural reed finishes for the Nile skiff",()=>{
  expect(boatPosture("papyrus")).toBe("kneel");
  expect(boatPosture("wasen")).toBe("sit");
  expect(boatPosture()).toBe("sit");
  for(const [variation,finish] of [[0,""],[.5,"-dry"],[.99,"-rebound"]] as const)
    for(const [suffix,facing] of [["",4],["-north",0],["-east",2],["-west",6]] as const)
      expect(mooredBoatFrame(`worksite-reed-skiff${suffix}`,variation)).toBe(`boat-papyrus${finish}-${facing}`);
});

it("reads deltas, floods, ice, reefs, tides and water works from the place and season", async () => {
  const { waterscape } = await import("../src/content/geography/waterscapes");
  const at = (lon: number, lat: number, year: number, season: WorldSetting["season"], climate: WorldSetting["climate"] = "temperate") =>
    waterscape({ lon, lat, year, season, climate });
  expect(at(31.25, 29.85, -1300, "autumn", "arid").flood).toBe(1);
  expect(at(31.25, 29.85, -1300, "spring", "arid").flood).toBe(0);
  expect(at(31.25, 29.85, 1980, "autumn", "arid").flood).toBe(0);
  expect(at(30.8, 31, -600, "winter", "arid").delta).toBe(true);
  expect(at(116.5, 36.5, 1100, "summer").tint).toBe("loess");
  expect(at(110.3, 25.1, 1600, "summer", "monsoon").tint).toBe("clear");
  expect(at(31.5, 60.8, 1600, "winter", "boreal").ice).toBe("fast");
  expect(at(31.5, 60.8, 1600, "summer", "boreal").ice).toBeUndefined();
  expect(at(-51, 69.2, 1600, "summer", "tundra").icebergs).toBe(true);
  expect(at(-147.7, -15, 1700, "summer", "tropical").reef).toBe("atoll");
  const sundarbans = at(89.2, 21.9, 1700, "winter", "monsoon");
  expect([sundarbans.mangrove, sundarbans.tide, sundarbans.delta]).toEqual([true, 1, true]);
  expect(at(4.9, 52.37, 1650, "summer").works).toBe("polder");
  expect(at(-99.13, 19.43, 1500, "summer", "mediterranean").works).toBe("chinampa");
  expect(at(51.4, 33.98, 1600, "summer", "arid").works).toBe("qanat");
  const { tideAt } = await import("../src/content/geography/waterscapes");
  const fundy = { lon: -64.5, lat: 45.3, year: 1700, season: "summer", climate: "temperate" } as const;
  expect([0, 3.1, 6.2, 9.3, 12.4].map((h) => tideAt(fundy, (9 + h) * 3600))).toEqual([0, 0.3, 0.6, 0.3, 0]);
  expect(tideAt({ ...fundy, lon: 15, lat: 40 }, 6.2 * 3600)).toBe(0);
});

it("walks on ice and wades across tidal mud", async () => {
  const { waterDepthAt, MAX_WADING_DEPTH } = await import("../src/core/water-field");
  const cell = (extra: object): TopographySample => () => ({
    height: 0,
    surface: "water",
    waterVisual: { distance: -6, kind: "lake", ecology: "boreal-woodland", shoreWidth: 2, flow: [0, 0], frozenMargin: true, ...extra },
  });
  expect(waterDepthAt(cell({}), 0.5, 0.5)).toBeGreaterThan(MAX_WADING_DEPTH);
  expect(waterDepthAt(cell({ ice: "solid" }), 0.5, 0.5)).toBe(0);
  expect(waterDepthAt(cell({ ice: "floes" }), 0.5, 0.5)).toBeGreaterThan(MAX_WADING_DEPTH);
  expect(waterDepthAt(cell({ shelf: 12 }), 0.5, 0.5)).toBeLessThan(MAX_WADING_DEPTH);
});

it("paints ice pale, flood water brown and a reef with a breaker line", () => {
  const tile = (extra: object, distance: (x: number, y: number) => number) =>
    rasterWaterTile(
      (x, y) => ({
        height: 0,
        surface: distance(x, y) < 0 ? "water" : "sand",
        waterVisual: { distance: distance(x, y), kind: "sea", ecology: "tropical-woodland", shoreWidth: 3, flow: [0, 1], frozenMargin: false, ...extra },
      }),
      0, 0, 0, 0,
    ).pixels;
  const mean = (p: Uint8ClampedArray) => {
    const s = [0, 0, 0];
    for (let i = 0; i < p.length; i += 4) for (let k = 0; k < 3; k++) s[k] += p[i + k] / (p.length / 4);
    return s;
  };
  const [ir, ig, ib] = mean(tile({ ice: "solid", kind: "lake" }, () => -4));
  expect(Math.min(ir, ig, ib)).toBeGreaterThan(150);
  const [sr, , sb] = mean(tile({ tint: "silt", kind: "river" }, () => -3));
  expect(sr).toBeGreaterThan(sb);
  const reef = tile({ reef: "outer" }, (x) => -5 - 3 * x);
  let foam = 0;
  for (let i = 0; i < reef.length; i += 4) if (reef[i] > 235 && reef[i + 2] > 225) foam++;
  expect(foam).toBeGreaterThan(10);
});

it("freezes Lake Ladoga in winter and rings a Tuamotu atoll round its lagoon", () => {
  const world = (lon: number, lat: number, season: WorldSetting["season"], ecology: "boreal-woodland" | "tropical-woodland", water: WorldSetting["water"]) =>
    createSettingSession({ ...setting(ecology as never, water), lon, lat, season, climate: ecology === "boreal-woodland" ? "boreal" : "tropical" }, "waterscape").world;
  const count = (w: ReturnType<typeof world>, test: (v: NonNullable<ReturnType<NonNullable<typeof w.topography>>>["waterVisual"]) => boolean) => {
    let n = 0;
    for (let y = -80; y <= 80; y += 2) for (let x = -80; x <= 80; x += 2) if (test(w.topography!(x, y)?.waterVisual)) n++;
    return n;
  };
  const ladoga = world(31.5, 60.8, "winter", "boreal-woodland", "lake");
  expect(count(ladoga, (v) => !!v && v.distance < 0 && v.ice === "solid")).toBeGreaterThan(20);
  expect(count(ladoga, (v) => !!v && v.distance < 0 && !v.ice)).toBe(0);
  const atoll = world(-147.7, -15, "summer", "tropical-woodland", "island");
  expect(count(atoll, (v) => v?.reef === "lagoon" && v.distance < 0)).toBeGreaterThan(50);
  expect(count(atoll, (v) => v?.reef === "outer" && v.distance < 0)).toBeGreaterThan(50);
  expect(count(atoll, (v) => !!v && v.distance > 0)).toBeGreaterThan(20);
});

it.runIf(!!process.env.FULL)("freezes in winter and thaws in spring, floods the Nile in autumn and ebbs the tide by the clock", async () => {
  const { bareShelf, waterDepthAt, MAX_WADING_DEPTH } = await import("../src/core/water-field");
  const world = (lon: number, lat: number, season: WorldSetting["season"], ecology: string, climate: WorldSetting["climate"], water: WorldSetting["water"]) =>
    createSettingSession({ ...setting(ecology as never, water), lon, lat, season, climate }, "waterscape").world;
  const cells = () => {
    const out: { x: number; y: number }[] = [];
    for (let y = -80; y <= 80; y += 2) for (let x = -80; x <= 80; x += 2) out.push({ x, y });
    return out;
  };
  const novgorod = world(31.3, 58.5, "winter", "boreal-woodland", "boreal", "lake");
  const lake = cells().filter(({ x, y }) => novgorod.topography!(x, y).waterVisual?.ice === "solid");
  expect(lake.length).toBeGreaterThan(20);
  expect(lake.every(({ x, y }) => waterDepthAt(novgorod.topography!, x + 0.5, y + 0.5) === 0)).toBe(true);
  novgorod.setSeason!("spring");
  expect(lake.some(({ x, y }) => novgorod.topography!(x, y).waterVisual?.ice)).toBe(false);
  expect(lake.some(({ x, y }) => waterDepthAt(novgorod.topography!, x + 0.5, y + 0.5) > MAX_WADING_DEPTH)).toBe(true);
  novgorod.setSeason!("winter");
  expect(lake.every(({ x, y }) => novgorod.topography!(x, y).waterVisual?.ice === "solid")).toBe(true);

  const memphis = world(31.25, 29.85, "spring", "desert", "arid", "river-ns");
  const wet = (season: WorldSetting["season"]) => {
    memphis.setSeason!(season);
    return cells().filter(({ x, y }) => memphis.topography!(x, y).surface === "water").length;
  };
  const low = wet("spring");
  expect(wet("autumn")).toBeGreaterThan(low * 1.5);
  expect(wet("winter")).toBe(low);

  const fundy = world(-64.5, 45.3, "summer", "temperate-woodland", "temperate", "coast-s");
  const shelf = cells().filter(({ x, y }) => bareShelf(fundy.topography!(x, y).waterVisual));
  expect(shelf.length).toBeGreaterThan(10);
  const walkable = () => shelf.filter(({ x, y }) => waterDepthAt(fundy.topography!, x + 0.5, y + 0.5) <= MAX_WADING_DEPTH).length;
  expect(walkable()).toBe(shelf.length);
  fundy.setSeason!("summer", 0.6);
  expect(walkable()).toBeLessThan(shelf.length * 0.8);
  fundy.setSeason!("summer", 0);
  expect(walkable()).toBe(shelf.length);
});
