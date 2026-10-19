vi.mock("../src/render/living-water/game",()=>({openWaterMask:vi.fn()}));
import { Watercraft, mooredBoatFrame, boatFrame, boatPosture } from "../src/render/watercraft";
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
