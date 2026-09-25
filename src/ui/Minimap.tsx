import { habitatAppearance } from "../render/habitat-appearance";
import { defaultGrassArt } from "../content/graphics/grass-art";
import { soils } from "../render/habitat-raster";
import { paletteKey } from "../content/ecology/profiles";
import { natureTreeSprites } from "../content/ecology/vegetation";
import { useEffect, useRef, useState } from "react";
import { timed } from "../render/perf-switches";
import { faunaProfile } from "../content/fauna";
import { currentSheets, loadSheets, sheetImage } from "./sprite-atlas";
import { smallMemoryDevice } from "../runtime/device";
import { surfaceAt } from "../render/materials";
import {
  atlasRivers,
  atlasSample,
  broadEnvironment,
  fromAtlas,
  toAtlas,
} from "../world/geography/atlas";
import { noise } from "../world/geography/noise";
import { boxBlur } from "./ArrivalMap";
import type { Runtime } from "../runtime/session";
import type { WorldModel, Point } from "../core/types";
const PAD = 32;
type BuildingSheet = "buildings" | "regionalBuildings" | "campBuildings";
const atlasImages: Partial<Record<BuildingSheet, HTMLImageElement>> = {};
const sheetLoaded = new Set<() => void>();
/** Fetched on first use: each sheet decodes to 60 MB, and a camp needs one. */
function sprites(name: BuildingSheet = "buildings") {
  if (!atlasImages[name]) {
    atlasImages[name] = new Image();
    atlasImages[name]!.onload = () => {
      for (const l of sheetLoaded) l();
    };
    atlasImages[name]!.src = sheetImage(name);
    void loadSheets().catch(() => {});
  }
  return atlasImages[name]!;
}
function hash(x: number, y: number) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
// Flat map colours in the world's own palette; edges are outlined separately.
const colors: Record<string, string> = {
  snow: "#dfe7e6",
  rock: "#8f8b80",
  marsh: "#4f7f62",
  grass: "#6ea447",
  dry: "#a7a862",
  dirt: "#b28a5c",
  sand: "#d1c288",
  water: "#2f7ea0",
  bridge: "#a88755",
  paving: "#c4bea6",
  field: "#9c874a",
  floor: "#b6a078",
};
const shade: Record<string, string> = {
  grass: "#5f9440",
  dry: "#98995a",
  dirt: "#a37e54",
  field: "#8c7840",
  sand: "#c4b47c",
};
const roofCache = new Map<string, { roof: string; wall: string }>();
/** Roof and wall tone read from the building's own sprite, so each region's houses keep their colours. */
function buildingTones(sprite: string) {
  const cached = roofCache.get(sprite);
  if (cached) return cached;
  const fallback = { roof: "#4a5560", wall: "#d8cfb0" };
  // Keep the minimap from retaining another full-size building image on phones.
  if (smallMemoryDevice()) return fallback;
  const sheets = currentSheets();
  const sheet: BuildingSheet = sheets?.regionalBuildings.frames[sprite]
    ? "regionalBuildings"
    : sheets?.campBuildings.frames[sprite]
      ? "campBuildings"
      : "buildings";
  const frames = sheets?.[sheet].frames;
  const image = sprites(sheet);
  if (!frames || !image.complete || !image.naturalWidth) return fallback;
  const f = frames[sprite]?.frame;
  if (!f) return fallback;
  const c = document.createElement("canvas");
  c.width = f.w;
  c.height = f.h;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(image, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h);
  const avg = (y0: number, y1: number) => {
    const d = ctx.getImageData(0, y0, f.w, Math.max(1, y1 - y0)).data;
    let r = 0,
      g = 0,
      b = 0,
      n = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 200) continue;
      r += d[i];
      g += d[i + 1];
      b += d[i + 2];
      n++;
    }
    if (!n) return undefined;
    return `rgb(${Math.round(r / n)},${Math.round(g / n)},${Math.round(b / n)})`;
  };
  const tones = {
    roof: avg(Math.round(f.h * 0.08), Math.round(f.h * 0.4)) ?? fallback.roof,
    wall: avg(Math.round(f.h * 0.55), Math.round(f.h * 0.85)) ?? fallback.wall,
  };
  roofCache.set(sprite, tones);
  return tones;
}
/** Ground far outside the region, read from the Earth atlas: one coastline
 *  lookup instead of generating terrain the region never sited. */
function atlasGround(ax: number, ay: number) {
  const { coast } = atlasSample(ax, ay);
  if (coast < 0) return "water";
  // The environment grid is quarter-degree cells; a warped lookup frays their
  // square edges into ragged ones. Coasts stay where they are.
  const { lon, lat } = fromAtlas(
    ax + (noise("warp-x", ax, ay, 400, "map") - 0.5) * 640,
    ay + (noise("warp-y", ax, ay, 400, "map") - 0.5) * 640,
  );
  const { relief, moisture, cold } = broadEnvironment(lon, lat);
  // Tundra is bare ground most of the year's travelling; only ice caps and
  // cold heights stay white.
  if (cold) return relief > 0.4 || Math.abs(lat) > 72 ? "snow" : "dry";
  if (relief > 0.55) return "rock";
  if (coast < 6) return "sand";
  return moisture < 0.25 ? "sand" : moisture < 0.45 ? "dry" : "grass";
}
const reliefKinds = new Set(["grass", "dry", "dirt", "sand", "marsh", "rock", "snow", "field"]);
/** North-west light on noise hills, in world tiles; octaves finer than a few
 * map pixels fade out rather than alias. Stepped like the arrival map's. */
function hillShade(wx: number, wy: number, cell: number, k: string) {
  let slope = 0;
  for (const s of [48, 192, 768, 3072, 12288, 49152]) {
    const fade = Math.max(0, Math.min(1, s / (4 * cell) - 0.5));
    if (!fade) continue;
    slope += fade * (noise("relief", wx - cell, wy - cell, s, "map") - noise("relief", wx + cell, wy + cell, s, "map")) * s / (2 * cell) * 0.25;
  }
  if (k === "rock" || k === "snow") slope *= 2.5;
  return 1 + Math.round(Math.max(-0.5, Math.min(0.5, slope)) * 8) / 12
    + (noise("grain", wx, wy, cell * 2, "map") - 0.5) * 0.06;
}
/** Hills, mountains and tree clumps stamped over flat ground, placed on a
 * jittered grid from the atlas's relief and moisture. */
function drawTerrainGlyphs(
  c: CanvasRenderingContext2D,
  kind: string[],
  cols: number,
  at: (i: number, j: number) => { x: number; y: number; wx: number; wy: number },
  anchor: Point,
) {
  const rows = kind.length / cols;
  const step = 9;
  const marks: { x: number; y: number; draw: () => void }[] = [];
  for (let j = 0; j < rows; j += step)
    for (let i = 0; i < cols; i += step) {
      const { wx: gx, wy: gy } = at(i, j);
      const ji = Math.min(cols - 1, i + Math.floor(hash(gx, gy) * step));
      const jj = Math.min(rows - 1, j + Math.floor(hash(gy + 11, gx) * step));
      const k = kind[jj * cols + ji];
      if (k === "water" || k === "snow") continue;
      const { x, y, wx, wy } = at(ji, jj);
      const { lon, lat } = fromAtlas(anchor.x + wx, anchor.y + wy);
      const env = broadEnvironment(lon, lat);
      const roll = hash(wx + 3, wy + 5);
      const ridge = env.relief + (noise("relief", wx, wy, 3000, "map") - 0.5) * 0.5;
      if (ridge > 0.62 || k === "rock")
        marks.push({ x, y, draw: () => mountain(c, x, y, 7 + roll * 5) });
      else if (ridge > 0.38 && roll < 0.7)
        marks.push({ x, y, draw: () => hill(c, x, y, 5 + roll * 3) });
      // Woods come in patches, thicker where it is wetter.
      else if (k !== "sand" && noise("woods", wx, wy, 2500, "map") > 0.95 - env.moisture * 0.6 && roll < 0.8) {
        const tree = env.cold ? conifer : Math.abs(lat) < 24 && env.moisture > 0.55 ? palm : broadleaf;
        marks.push({ x, y, draw: () => {
          tree(c, x - 3, y);
          if (roll < 0.35) tree(c, x + 3, y + 1);
          if (roll < 0.2) tree(c, x, y - 3);
        } });
      } else if (roll < 0.3) marks.push({ x, y, draw: () => tuft(c, x, y) });
    }
  c.save();
  c.lineJoin = c.lineCap = "round";
  for (const m of marks.sort((a, b) => a.y - b.y)) m.draw();
  c.restore();
}
const INK = "rgba(38,44,24,0.7)";
function mountain(c: CanvasRenderingContext2D, x: number, y: number, s: number) {
  c.fillStyle = "rgba(255,248,220,0.35)";
  c.beginPath(); c.moveTo(x - s, y); c.lineTo(x, y - s * 1.2); c.lineTo(x, y); c.fill();
  c.fillStyle = "rgba(40,40,20,0.3)";
  c.beginPath(); c.moveTo(x, y - s * 1.2); c.lineTo(x + s, y); c.lineTo(x, y); c.fill();
  c.strokeStyle = INK; c.lineWidth = 1;
  c.beginPath(); c.moveTo(x - s, y); c.lineTo(x, y - s * 1.2); c.lineTo(x + s, y); c.stroke();
  c.lineWidth = 0.7;
  c.beginPath();
  for (let h = 0.25; h < 0.9; h += 0.22) {
    c.moveTo(x + s * h * 0.9, y - s * 1.2 * (1 - h)); c.lineTo(x + s * h * 0.5, y);
  }
  c.stroke();
}
function hill(c: CanvasRenderingContext2D, x: number, y: number, s: number) {
  c.strokeStyle = INK; c.lineWidth = 1;
  c.beginPath(); c.moveTo(x - s, y); c.quadraticCurveTo(x, y - s * 1.3, x + s, y); c.stroke();
  c.lineWidth = 0.6;
  c.beginPath(); c.moveTo(x + s * 0.2, y - s * 0.5); c.lineTo(x + s * 0.1, y);
  c.moveTo(x + s * 0.55, y - s * 0.3); c.lineTo(x + s * 0.4, y); c.stroke();
}
function tuft(c: CanvasRenderingContext2D, x: number, y: number) {
  c.strokeStyle = "rgba(38,44,24,0.45)"; c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(x - 2.5, y - 2); c.lineTo(x - 1, y); c.moveTo(x, y - 3); c.lineTo(x, y); c.moveTo(x + 2.5, y - 2); c.lineTo(x + 1, y);
  c.stroke();
}
function broadleaf(c: CanvasRenderingContext2D, x: number, y: number) {
  c.fillStyle = "#3f6a2c"; c.strokeStyle = INK; c.lineWidth = 0.8;
  c.beginPath(); c.arc(x, y - 4, 3, 0, Math.PI * 2); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(x, y - 1); c.lineTo(x, y + 1); c.stroke();
}
function conifer(c: CanvasRenderingContext2D, x: number, y: number) {
  c.fillStyle = "#35573a"; c.strokeStyle = INK; c.lineWidth = 0.8;
  c.beginPath(); c.moveTo(x, y - 8); c.lineTo(x + 3, y - 1); c.lineTo(x - 3, y - 1); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(x, y - 1); c.lineTo(x, y + 1); c.stroke();
}
function palm(c: CanvasRenderingContext2D, x: number, y: number) {
  c.strokeStyle = INK; c.lineWidth = 0.9;
  c.beginPath(); c.moveTo(x, y + 1); c.quadraticCurveTo(x + 1, y - 3, x, y - 7); c.stroke();
  c.strokeStyle = "#3d6b2a"; c.lineWidth = 1.4;
  c.beginPath();
  for (const d of [-1, 1]) {
    c.moveTo(x, y - 7); c.quadraticCurveTo(x + d * 3, y - 9, x + d * 4.5, y - 5.5);
    c.moveTo(x, y - 7); c.quadraticCurveTo(x + d * 2, y - 10, x + d * 3.5, y - 9.5);
  }
  c.stroke();
}
/** Repaints the map in resumable slices. A full rebuild resamples the world
 * once per screen pixel, which is far past a frame's budget, so the caller
 * spends it a few milliseconds at a time while the previous map stays up. */
function* paintBackgroundSteps(
  canvas: HTMLCanvasElement,
  world: WorldModel,
  origin: Point,
  size: number,
  height: number,
  extent: number,
  large: boolean,
  regional: boolean,
  /** Draw only the places from this index on, over an already painted map.
   * Activating a place used to resample the whole terrain for a few roofs. */
  placesFrom = 0,
): Generator<void> {
  const c = canvas.getContext("2d")!;
  // Desert colourways recolour the flat map's sand and bare ground too.
  const env = world.pack.setting?.environment;
  const soil = env?.colorway
    ? soils[paletteKey(env.ecology, env.colorway)]
    : undefined;
  const hex = (rgb: number[]) =>
    "#" + rgb.map((v) => v.toString(16).padStart(2, "0")).join("");
  const colorway: Record<string, string> =
    soil && env?.colorway !== "highland" && env?.ecology === "desert"
      ? { sand: hex(soil[3]), dry: hex(soil[2]), dirt: hex(soil[1]) }
      : {};
  c.save();
  c.translate(PAD, PAD);
  c.imageSmoothingEnabled = false;
  const px = 2;
  const cols = Math.ceil((size + PAD * 2) / px),
    rows = Math.ceil((height + PAD * 2) / px);
  const kind: string[] = new Array(cols * rows);
  const coarse = extent > (world.generatorVersion === 3 ? 320 : 3200);
  // One putImageData per row: a fillRect per pixel was a third of the main
  // thread in a Safari profile.
  const row = new ImageData(cols * px, px);
  const rgba = new Uint32Array(row.data.buffer);
  const at = (i: number, j: number) => {
    const x = i * px - PAD,
      y = j * px - PAD;
    const wx = Math.floor(origin.x + ((x - size / 2) * extent) / size),
      wy = Math.floor(origin.y + ((y - height / 2) * extent) / size);
    return { x, y, wx, wy };
  };
  const mapHalf = world.pack.setting?.playableMap?.size;
  const anchor = toAtlas(world.pack.anchor.lon, world.pack.anchor.lat);
  const relief = large || regional;
  const cell = (extent * px) / size;
  // Terrain pass.
  if (!placesFrom)
    for (let j = 0; j < rows; j++) {
      // Each row costs a terrain sample per pixel; eight at a time overran the
      // frame budget, which is only checked between steps.
      if (j) yield;
      for (let i = 0; i < cols; i++) {
        const { wx, wy } = at(i, j);
        const inMap =
          mapHalf === undefined ||
          (wx >= -mapHalf / 2 &&
            wx < mapHalf / 2 &&
            wy >= -mapHalf / 2 &&
            wy < mapHalf / 2);
        // Once a pixel spans several cells, generated ground is sub-pixel detail:
        // in-map habitat tint and the neighbouring-region preview both cost a
        // full terrain sample for it, so the atlas carries the frame instead.
        const preview = coarse ? undefined : world.mapTerrain?.(wx, wy);
        // The large map at region scale reads the town's own square from the
        // atlas too; its plan ground drew as a pale block.
        let k: string = !inMap || (large && coarse)
          ? (preview?.terrain ?? atlasGround(anchor.x + wx, anchor.y + wy))
          : coarse && world.overview
            ? world.overview(wx, wy)
            : surfaceAt(world, wx, wy);
        let fill = colorway[k] ?? colors[k] ?? colors.grass;
        if (world.topography && extent <= 320 && inMap) {
          const cell = world.topography(wx, wy);
          if (cell.surface === "water") {
            k = "water";
            fill = cell.waterDepth === "shallow" ? "#3d93b0" : "#2a6f93";
          } else if (cell.height > world.topography(wx, wy + 1).height) {
            k = "cliff";
            fill = "#8d6640";
          }
        }
        const h = preview?.habitat;
        if (k === "water" && h?.colorway === "swamp") fill = "#536f59";
        if (h && ["grass", "dry", "sand", "marsh", "rock"].includes(k)) {
          const parts = h.blend ?? [
            { ecology: h.ecology, colorway: h.colorway, weight: 1 },
          ];
          const rgb = [0, 1, 2].map((channel) =>
            Math.round(
              parts.reduce((sum, part) => {
                const key = paletteKey(part.ecology, part.colorway);
                const mineral =
                  part.ecology === "desert" || k === "sand" || k === "rock";
                const ramp = mineral
                  ? soils[key]
                  : defaultGrassArt.palettes[key];
                const index = mineral
                  ? 2
                  : h.wet > 0.6
                    ? 7
                    : h.cover > 0.55
                      ? 2
                      : 0;
                return sum + ramp[index][channel] * part.weight;
              }, 0),
            ),
          );
          fill = hex(h.site ? habitatAppearance(h).ground : rgb);
        }
        kind[j * cols + i] = k;
        if (relief && reliefKinds.has(k)) {
          const v = parseInt(fill.slice(1, 7), 16), shade = hillShade(wx, wy, cell, k);
          // The large map softens the relief under its glyphs and adds a broad wash.
          const f = large ? 1 + (shade - 1) * 0.5 + (noise("wash", wx, wy, 16000, "map") - 0.5) * 0.12 : shade;
          fill = hex([v >> 16, (v >> 8) & 0xff, v & 0xff].map((ch) => Math.max(0, Math.min(255, Math.round(ch * f)))));
        }
        // Sparse darker speckle gives grass and soil their pixel grain.
        if (!relief && !h && shade[k] && hash(wx, wy) < 0.16) fill = shade[k];
        const v = parseInt(fill.slice(1, 7), 16);
        const packed =
          (0xff000000 | ((v & 0xff) << 16) | (v & 0xff00) | (v >> 16)) >>> 0;
        for (let dy = 0; dy < px; dy++)
          rgba.fill(
            packed,
            dy * cols * px + i * px,
            dy * cols * px + i * px + px,
          );
      }
      c.putImageData(row, 0, j * px);
    }
  // Sea darkens with distance from shore, as on the arrival map.
  if (relief && !placesFrom) {
    let shelf = Float32Array.from(kind, (k) => (k === "water" ? 0 : 1));
    for (let pass = 0; pass < 3; pass++) shelf = boxBlur(shelf, cols, rows, 6);
    const image = c.getImageData(0, 0, cols * px, rows * px);
    const out = new Uint32Array(image.data.buffer);
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++) {
        if (kind[j * cols + i] !== "water") continue;
        const { wx, wy } = at(i, j);
        const s = shelf[j * cols + i];
        let t = Math.min(1, s * 2.2) + noise("grain", wx, wy, cell * 3, "sea") * 0.06;
        // Two thin lines following the shore, as engraved charts draw it.
        if (large && (Math.abs(s - 0.3) < 0.012 || Math.abs(s - 0.16) < 0.01)) t += 0.25;
        const packed = (0xff000000 | (Math.round(68 + 58 * t) << 16) | (Math.round(44 + 70 * t) << 8) | Math.round(18 + 38 * t)) >>> 0;
        for (let dy = 0; dy < px; dy++)
          out.fill(packed, (j * px + dy) * cols * px + i * px, (j * px + dy) * cols * px + i * px + px);
      }
    c.putImageData(image, 0, 0);
  }
  yield;
  // Outline pass: a darker seam wherever the ground type changes, plus a pale
  // shoreline on the water side.
  for (let j = 0; j < rows; j++) {
    if (j && j % 8 === 0) yield;
    for (let i = 0; i < cols; i++) {
      const k = kind[j * cols + i];
      const right = i + 1 < cols ? kind[j * cols + i + 1] : k,
        down = j + 1 < rows ? kind[(j + 1) * cols + i] : k;
      if (k === right && k === down) continue;
      const { x, y } = at(i, j);
      const water = k === "water";
      const nearWater = right === "water" || down === "water";
      if (water && !(right === "water" && down === "water")) {
        c.fillStyle = "#8ed0dc";
        if (right !== "water") c.fillRect(x + px - 1, y, 1, px);
        if (down !== "water") c.fillRect(x, y + px - 1, px, 1);
        continue;
      }
      c.fillStyle = nearWater ? "#245d5a" : "#00000033";
      if (k !== right) c.fillRect(x + px - 1, y, 1, px);
      if (k !== down) c.fillRect(x, y + px - 1, px, 1);
    }
  }
  // Even a great river is a few dozen tiles wide; once a pixel is wider, the
  // generated channel vanishes, so draw the atlas course it follows.
  if (relief && cell >= 16 && !placesFrom) {
    const k = size / extent;
    const left = origin.x - extent / 2 - (PAD * extent) / size,
      right = origin.x + extent / 2 + (PAD * extent) / size,
      top = origin.y - (height / 2 + PAD) / k,
      bottom = origin.y + (height / 2 + PAD) / k;
    c.strokeStyle = "#6fa6b8";
    c.lineJoin = c.lineCap = "round";
    c.lineWidth = 2;
    for (const river of atlasRivers) {
      c.beginPath();
      let last: [number, number, boolean] | undefined;
      for (const [lon, lat] of river.points) {
        const t = toAtlas(lon, lat);
        const wx = t.x - anchor.x,
          wy = t.y - anchor.y;
        const inside = wx >= left && wx <= right && wy >= top && wy <= bottom;
        const x = (wx - origin.x) * k + size / 2,
          y = (wy - origin.y) * k + height / 2;
        // A segment is drawn when either end is in view, so edges stay joined.
        if (last && (inside || last[2])) {
          c.moveTo(last[0], last[1]);
          c.lineTo(x, y);
        }
        last = [x, y, inside];
      }
      c.stroke();
    }
  }
  yield;
  if (large && !placesFrom) drawTerrainGlyphs(c, kind, cols, at, anchor);
  yield;
  const toPx = (wx: number, wy: number) => ({
    x: Math.round(((wx - origin.x) * size) / extent + size / 2),
    y: Math.round(((wy - origin.y) * size) / extent + height / 2),
  });
  const tree = (x: number, y: number) => {
    // 7px canopy: rim, body, highlight, trunk.
    c.fillStyle = "#2f5a28";
    c.fillRect(x - 3, y - 5, 7, 5);
    c.fillRect(x - 2, y - 6, 5, 1);
    c.fillRect(x - 2, y, 5, 1);
    c.fillStyle = "#4f9a3a";
    c.fillRect(x - 2, y - 5, 5, 5);
    c.fillRect(x - 1, y - 6, 3, 1);
    c.fillStyle = "#86c95c";
    c.fillRect(x - 2, y - 5, 2, 2);
    c.fillRect(x - 1, y - 6, 2, 1);
    c.fillStyle = "#5a3d24";
    c.fillRect(x, y + 1, 1, 2);
  };
  const stride = extent > 3200 ? extent : regional || large ? 4 : 1;
  const span = ((height + PAD * 2) * extent) / size / 2;
  if (!placesFrom && !large)
    for (
      let wy = Math.floor((origin.y - span) / stride) * stride;
      wy < origin.y + span;
      wy += stride
    )
      for (
        let wx =
          Math.floor((origin.x - extent / 2 - (PAD * extent) / size) / stride) *
          stride;
        wx < origin.x + extent / 2 + (PAD * extent) / size;
        wx += stride
      ) {
        const prop =
          world.geography && extent > 320
            ? undefined
            : world.decoration(wx, wy);
        if (
          prop &&
          (world.pack.trees.includes(prop.sprite) ||
            natureTreeSprites.includes(prop.sprite))
        ) {
          // Thin dense cover so canopies stay readable as separate icons.
          if (hash(wx + 7, wy + 3) < (regional || large ? 0.4 : 0.3)) continue;
          const { x, y } = toPx(wx, wy);
          tree(x, y);
        }
      }
  yield;
  // Buildings: a roof block over a wall block, both in the sprite's own tones.
  const sorted = world.places
    .slice(placesFrom)
    .sort((a, b) => a.y + a.h - (b.y + b.h));
  for (const b of sorted) {
    const { x, y } = toPx(b.x + b.w / 2, b.y + b.h);
    const w = Math.max(6, Math.round((b.w * size) / extent) + 2);
    const h = Math.max(6, Math.round(w * 0.8));
    const { roof, wall } = buildingTones(b.sprite);
    const left = x - Math.floor(w / 2),
      top = y - h;
    const roofH = Math.max(3, Math.round(h * 0.45));
    c.fillStyle = "#1f2427";
    c.fillRect(left - 1, top - 1, w + 2, h + 2);
    c.fillStyle = wall;
    c.fillRect(left, top + roofH, w, h - roofH);
    c.fillStyle = roof;
    c.fillRect(left, top, w, roofH);
    c.fillStyle = "#ffffff55";
    c.fillRect(left, top, w, 1);
    c.fillStyle = "#3a2c20";
    c.fillRect(x - 1, y - 2, 2, 2);
    if (w >= 10) {
      c.fillStyle = "#4b5d6c";
      c.fillRect(left + 2, top + roofH + 1, 2, 2);
      c.fillRect(left + w - 4, top + roofH + 1, 2, 2);
    }
  }
  yield;
  if ((large || regional) && !placesFrom) {
    c.font = `${large ? 13 : 10}px Georgia`;
    c.fillStyle = "#fff2d2";
    const settlements =
      world.geography?.placesIn({
        x: origin.x - extent / 2 - (PAD * extent) / size,
        y: origin.y - span,
        w: extent + (PAD * 2 * extent) / size,
        h: span * 2,
      }) ?? world.settlements;
    for (const s of settlements) {
      if ("parentId" in s && s.parentId) continue;
      const { x, y } = toPx(s.x, s.y);
      if (
        x < 3 - PAD ||
        x > size + PAD - 3 ||
        y < 10 - PAD ||
        y > height + PAD - 3
      )
        continue;
      c.beginPath();
      c.arc(x, y, 2, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.textAlign = x > size * 0.6 ? "right" : "left";
      c.strokeStyle = "#354534";
      c.lineWidth = 2;
      c.strokeText(s.name, x + (x > size * 0.6 ? -6 : 6), y - 6);
      c.fillText(s.name, x + (x > size * 0.6 ? -6 : 6), y - 6);
    }
    c.textAlign = "left";
  }
  c.restore();
}

/** Whole repaint in one go: the first map, and the cheap places-only pass. */
function paintBackground(...args: Parameters<typeof paintBackgroundSteps>) {
  const steps = paintBackgroundSteps(...args);
  while (!steps.next().done);
}

type Backing = {
  world: WorldModel;
  origin: Point;
  key: string;
  canvas: HTMLCanvasElement;
  places: number;
};
/** A repaint being spent a few milliseconds a frame. */
type Rebuild = Backing & { steps: Generator<void> };
/** Milliseconds a frame may spend repainting the map. */
const MAP_BUDGET_MS = 4;
export function Minimap({
  runtime,
  large = false,
  regional = false,
  span,
  center,
  dims,
  route,
}: {
  runtime: Runtime;
  large?: boolean;
  regional?: boolean;
  span?: number;
  /** World point to centre on instead of the player, for a panned map. */
  center?: Point;
  dims?: [number, number];
  /** A chosen destination, drawn with a dashed route from the player. */
  route?: Point;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const backing = useRef<Backing | undefined>(undefined);
  const job = useRef<Rebuild | undefined>(undefined);
  const redraw = useRef<() => void>(() => {});
  /** Animal groups on the map this draw, for the hover label. */
  const pins = useRef<{ x: number; y: number; text: string }[]>([]);
  const [pin, setPin] = useState<{ x: number; y: number; text: string }>();
  const world = runtime.engine.world;
  const revision = runtime.engine.state.revision;
  const local = runtime.engine.state.player.pos;
  const p =
    local.space === "outside" ? local : world.place(local.space)!.entrance;
  const [size, height] = dims ?? (large ? [520, 350] : [256, 148]);
  const extent =
    span ?? (large || regional ? (world.regionExtent ?? 320) : 110);
  const origin =
    center ?? ((large || regional) && !world.pack.setting ? { x: 20, y: 25 } : p);
  const places = world.places.length;
  // Spends the frame's map budget on a deferred rebuild. The old map stays on
  // screen until the new one is finished, which is a beat later at most.
  useEffect(() => {
    let raf = requestAnimationFrame(function pump() {
      raf = requestAnimationFrame(pump);
      const building = job.current;
      if (!building) return;
      timed("minimap rebuild", () => {
        const start = performance.now();
        let step = building.steps.next();
        while (!step.done && performance.now() - start < MAP_BUDGET_MS)
          step = building.steps.next();
        if (!step.done) return;
        backing.current = building;
        job.current = undefined;
        const canvas = ref.current;
        if (canvas)
          canvas.dataset.mapBuilds = String(
            Number(canvas.dataset.mapBuilds ?? 0) + 1,
          );
        redraw.current();
      });
    });
    return () => cancelAnimationFrame(raf);
  }, []);
  useEffect(() => {
    const canvas = ref.current!;
    const draw = () => {
      const key = `${size}:${height}:${extent}:${large}:${regional}`;
      let map = backing.current;
      // A rebuild already under way is the freshest origin there is, so it is
      // what a further move is measured against; otherwise walking restarts
      // the same rebuild every emit and it never lands.
      const target = job.current ?? map;
      const shifted =
        !!target &&
        ((Math.abs(origin.x - target.origin.x) * size) / extent > PAD - 4 ||
          (Math.abs(origin.y - target.origin.y) * size) / extent > PAD - 4);
      // A different world, zoom or map size cannot be shown by the map we
      // have, so it is rebuilt at once. Only walking is deferred.
      const stale =
        !map || map.world !== world || map.key !== key || map.places > places;
      // Places activate constantly while walking. Painting the new roofs over
      // the map we have costs a few rectangles; the full rebuild resamples the
      // world per pixel and was stalling a frame every few seconds.
      if (!stale && !shifted && map && map.places < places) {
        paintBackground(
          map.canvas,
          world,
          map.origin,
          size,
          height,
          extent,
          large,
          regional,
          map.places,
        );
        map.places = places;
      }
      const surface = () => {
        const background = document.createElement("canvas");
        background.width = size + PAD * 2;
        background.height = height + PAD * 2;
        return background;
      };
      if (stale) {
        job.current = undefined;
        const background = surface();
        timed("minimap rebuild", () =>
          paintBackground(
            background,
            world,
            origin,
            size,
            height,
            extent,
            large,
            regional,
          ),
        );
        map = backing.current = {
          world,
          origin: { ...origin },
          key,
          canvas: background,
          places,
        };
        canvas.dataset.mapBuilds = String(
          Number(canvas.dataset.mapBuilds ?? 0) + 1,
        );
      } else if (shifted) {
        const background = surface();
        job.current = {
          world,
          origin: { ...origin },
          key,
          canvas: background,
          places,
          steps: paintBackgroundSteps(
            background,
            world,
            origin,
            size,
            height,
            extent,
            large,
            regional,
          ),
        };
      }
      map = backing.current!;
      const ctx = canvas.getContext("2d")!;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, size, height);
      ctx.drawImage(
        map.canvas,
        PAD + ((origin.x - map.origin.x) * size) / extent,
        PAD + ((origin.y - map.origin.y) * size) / extent,
        size,
        height,
        0,
        0,
        size,
        height,
      );
      const mx = ((p.x - origin.x) * size) / extent + size / 2,
        my = ((p.y - origin.y) * size) / extent + height / 2;
      if (route) {
        const tx = ((route.x - origin.x) * size) / extent + size / 2,
          ty = ((route.y - origin.y) * size) / extent + height / 2;
        ctx.setLineDash([6, 5]);
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#f3d38f";
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(tx, ty, 9, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#1c2430aa";
      ctx.beginPath();
      ctx.arc(mx, my, large ? 7 : 5.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "#f7ebcb";
      ctx.beginPath();
      ctx.arc(mx, my, large ? 6 : 4.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#f7ebcb";
      ctx.beginPath();
      ctx.arc(mx, my, large ? 2.5 : 2, 0, Math.PI * 2);
      ctx.fill();
      // One dot per animal group: cream for kept animals, amber for wild.
      pins.current = [];
      for (const g of runtime.engine.state.fauna ?? []) {
        const x = ((g.pos.x - origin.x) * size) / extent + size / 2,
          y = ((g.pos.y - origin.y) * size) / extent + height / 2;
        if (x < 3 || y < 3 || x > size - 3 || y > height - 3) continue;
        const profile = faunaProfile(g.speciesId);
        ctx.fillStyle = "#1c2430aa";
        ctx.beginPath();
        ctx.arc(x, y, large ? 3.5 : 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = profile?.category === "wild" ? "#e6a53c" : "#f1e2b5";
        ctx.beginPath();
        ctx.arc(x, y, large ? 2.5 : 2, 0, Math.PI * 2);
        ctx.fill();
        pins.current.push({
          x,
          y,
          text: `${(profile?.label ?? g.speciesId).replace(" study", "")} · ${g.members.length}`,
        });
      }
    };
    // A sheet arriving late repaints the roofs that fell back to plain tones.
    const repaint = () => {
      if (backing.current) backing.current.places = 0;
      draw();
    };
    redraw.current = draw;
    draw();
    sheetLoaded.add(repaint);
    return () => {
      sheetLoaded.delete(repaint);
    };
  }, [
    world,
    p.x,
    p.y,
    origin.x,
    origin.y,
    size,
    height,
    extent,
    large,
    regional,
    places,
    revision,
    route?.x,
    route?.y,
  ]);
  return (
    <span className="minimap-frame">
      <canvas
        ref={ref}
        width={size}
        height={height}
        className={large ? "large-map" : "minimap"}
        aria-label="Map derived from the generated regional plan"
        onMouseMove={(event) => {
          const r = event.currentTarget.getBoundingClientRect();
          const sx = size / r.width,
            sy = height / r.height;
          const x = (event.clientX - r.left) * sx,
            y = (event.clientY - r.top) * sy;
          let best: (typeof pins.current)[number] | undefined,
            near = 9 * sx;
          for (const d of pins.current) {
            const dd = Math.hypot(d.x - x, d.y - y);
            if (dd < near) {
              near = dd;
              best = d;
            }
          }
          setPin(
            best
              ? { x: best.x / sx, y: best.y / sy, text: best.text }
              : undefined,
          );
        }}
        onMouseLeave={() => setPin(undefined)}
      />
      {pin && (
        <span className="map-pin" style={{ left: pin.x, top: pin.y }}>
          {pin.text}
        </span>
      )}
    </span>
  );
}
