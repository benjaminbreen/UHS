import { drawScenery } from "./scenery";
import { defaults } from "./model";
import { rasterLivingWater, type LivingMask } from "./mask";
import Phaser from "phaser";
import type { TopographySample } from "../../core/topography";
import type { RenderResources } from "../resources";
import { own } from "../resources";
import type { TerrainRegion } from "../terrain-region";
import { waterRamps } from "./surface";
import { bankStyle } from "./banks";
import { ecologyOrder, livingProfile } from "./profile";
import { livingFragment } from "./shader";
import type { LightingId } from "../lighting";
import { lightingPreset } from "../lighting";
import { canvasStat } from "../canvas-stat";
const LUT = "living-water-colors-3";
const shaders = new WeakMap<Phaser.Scene, Set<Phaser.GameObjects.Shader>>();
let sequence = 0;
export function usesLivingWater(scene: Phaser.Scene) {
  return (
    scene.game.renderer.type === Phaser.WEBGL &&
    (scene as unknown as { options?: { waterRenderer?: string } }).options
      ?.waterRenderer === "living"
  );
}
function colors(scene: Phaser.Scene) {
  if (scene.textures.exists(LUT)) return;
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 160;
  const ctx = canvas.getContext("2d")!;
  const boundary =
    "#" +
    [1, 3, 5]
      .map((i) =>
        Math.round(
          parseInt(defaults.boundaryColor.slice(i, i + 2), 16) *
            (1 - defaults.boundaryDarkness * 0.8),
        )
          .toString(16)
          .padStart(2, "0"),
      )
      .join("");
  // Rows: eight ecologies × five kinds (river, coast, lake, pond, creek),
  // then the frozen and red-clay sets. Columns 0-15 are the clear ramp and
  // bank tones, 16-31 the swamp counterpart; the shader mixes the two pairs
  // by a per-pixel murk value.
  for (let row = 0; row < 160; row++) {
    const kind = Math.floor((row % 40) / 8),
      ecology = ecologyOrder[row % 8];
    const cell = {
      height: 0,
      surface: "water" as const,
      waterVisual: {
        kind: (kind === 1 ? "sea" : kind === 2 || kind === 3 ? "lake" : "river") as "sea" | "lake" | "river",
        shoreWidth: kind === 3 ? 0.5 : kind === 4 ? 0.9 : 2,
        distance: -2,
        ecology,
        flow: [0, 1] as [number, number],
        frozenMargin: row % 80 >= 40,
      },
    };
    const swampHabitat = {
      ecology: "wetland" as const,
      colorway: "swamp" as const,
      kind: "hollow" as const,
      season: "summer",
      wet: 1,
      murk: 1,
      cover: 0.5,
      exposed: 0,
    };
    [false, true].forEach((swamp) => {
      const profile = livingProfile(swamp ? { ...cell, habitat: swampHabitat } : cell);
      if (row >= 80) {
        profile.customBankColors = false;
        profile.bankMaterial = "clay";
        profile.bankClimate = "desert";
      }
      const bank = bankStyle(profile);
      [
        ...waterRamps[profile.palette],
        bank.dry,
        bank.wet,
        bank.contact,
        boundary,
        [
          "#638451",
          "#42744a",
          "#526e53",
          "#277d58",
          "#527650",
          "#8c8754",
          "#b89464",
          "#afb9ab",
        ][row % 8],
      ].forEach((color, x) => {
        ctx.fillStyle = color;
        ctx.fillRect(x + (swamp ? 16 : 0), row, 1, 1);
      });
    });
  }
  scene.textures.addCanvas(LUT, canvas);
}
export function addLivingWater(
  scene: Phaser.Scene,
  sample: TopographySample,
  width: number,
  height: number,
  region: TerrainRegion | undefined,
  resources: RenderResources,
  prepared?: LivingMask,
) {
  const begin = performance.now();
  const polish = (
    scene as Phaser.Scene & { options: import("../appearance").RenderOptions }
  ).options.shorePolish;
  const mask =
    prepared ?? rasterLivingWater(sample, width, height, region, polish);
  if (!mask.count) return;
  const W = mask.width,
    H = mask.height,
    shift = 96;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!,
    pixels = ctx.createImageData(W, H);
  pixels.data.set(mask.pixels);
  ctx.putImageData(pixels, 0, 0);
  colors(scene);
  const key = `living-water-mask-${sequence++}`;
  scene.textures.addCanvas(key, canvas);
  resources.textures.push(key);
  const art = document.createElement("canvas");
  art.width = W;
  art.height = H;
  const artCtx = art.getContext("2d")!;
  drawScenery(
    artCtx,
    mask.items,
    { ...defaults, kind: "lake" },
    0,
    new Float32Array(384 * 256),
  );
  const artKey = `${key}-art`;
  scene.textures.addCanvas(artKey, art);
  resources.textures.push(artKey);
  const bends = document.createElement("canvas");
  bends.width = W;
  bends.height = H;
  const bc = bends.getContext("2d")!,
    bd = bc.createImageData(W, H);
  bd.data.set(mask.bends);
  bc.putImageData(bd, 0, 0);
  const bendKey = `${key}-bends`;
  scene.textures.addCanvas(bendKey, bends);
  resources.textures.push(bendKey);
  const compiling = performance.now();
  const base = new Phaser.Display.BaseShader(
    "living-water-1",
    livingFragment,
    undefined,
    {
      worldOrigin: {
        type: "2f",
        value: { x: (region?.x ?? 0) * 16, y: (region?.y ?? 0) * 16 - shift },
      },
      waterTime: { type: "1f", value: 0 },
      oceanParams: {
        type: "4fv",
        value: [polish?.offshoreCalm ?? 0.95, 0, 0, 0],
      },
      polishParams: {
        type: "4fv",
        value: [
          polish?.enabled ? polish.blend : 0,
          polish?.enabled ? polish.ripples : 0,
          polish?.enabled ? 1 : 0,
          0,
        ],
      },
      bankParams: {
        type: "4fv",
        value: [
          defaults.wetEdgeWidth,
          defaults.wetEdgeOpacity,
          defaults.bankGradientSteps,
          defaults.boundaryOpacity,
        ],
      },
      waveParams: {
        type: "4fv",
        value: [
          defaults.foamOpacity,
          defaults.foamWidth,
          defaults.foamBreakup,
          defaults.clarity,
        ],
      },
      sun: { type: "3f", value: { x: 1, y: 1, z: 1 } },
    },
  );
  const shader = own(
    resources,
    scene.add
      .shader(base, W / 2, H / 2 - shift, W, H, [key, LUT, artKey, bendKey], {
        repeat: false,
        wrapS: "clamp_to_edge",
        wrapT: "clamp_to_edge",
        minFilter: "nearest",
        magFilter: "nearest",
      })
      .setDepth(-9999),
  );
  Object.assign(scene.game.canvas.dataset, {
    livingPrepMs: (compiling - begin).toFixed(1),
    livingCompileMs: (performance.now() - compiling).toFixed(1),
  });
  let set = shaders.get(scene);
  if (!set) {
    set = new Set();
    shaders.set(scene, set);
    scene.events.once("shutdown", () => shaders.delete(scene));
  }
  shader.setData("shoreObjects", mask.items);
  shader.setData("waterTiles", Math.ceil(mask.count / 256));
  set.add(shader);
  shader.once("destroy", () => set!.delete(shader));
}
export function updateLivingWater(
  scene: Phaser.Scene,
  time: number,
  phase: LightingId,
  freeze: boolean,
) {
  const start = performance.now(),
    color = lightingPreset(phase).tint,
    set = shaders.get(scene);
  if (!set) return;
  const sun = {
    x: parseInt(color.slice(0, 2), 16) / 255,
    y: parseInt(color.slice(2, 4), 16) / 255,
    z: parseInt(color.slice(4, 6), 16) / 255,
  };
  const view = scene.cameras.main.worldView;
  let visible = 0,
    tiles = 0;
  for (const shader of set) {
    const inView =
      shader.x + shader.width / 2 > view.x &&
      shader.x - shader.width / 2 < view.right &&
      shader.y + shader.height / 2 > view.y &&
      shader.y - shader.height / 2 < view.bottom;
    shader.setVisible(inView);
    if (!inView) continue;
    visible++;
    tiles += shader.getData("waterTiles");
    shader.setUniform("waterTime.value", freeze ? 0 : time / 1000);
    shader.setUniform("sun.value", sun);
  }
  const canvas = scene.game.canvas;
  canvasStat(canvas, "waterRenderer", "living-c");
  canvasStat(canvas, "waterTiles", tiles);
  canvasStat(canvas, "waterMotifs", 0);
  canvasStat(canvas, "waterPatches", visible);
  canvasStat(canvas, "waterFrame", freeze ? 0 : Math.floor(time / 100));
  // One decimal: finer than that and the value changes every frame.
  canvasStat(canvas, "waterUpdateMs", (performance.now() - start).toFixed(1));
}
