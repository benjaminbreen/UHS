import { TILE, blobMask, hash, type Field } from "./field";
import { palettes, recolour } from "./palette";
import { layoutFor } from "./procedural";
import type { Settings } from "./settings";

type Meta = {
  tile: number;
  blob: {
    cols: number;
    rows: number;
    grass: Record<string, number>;
    dirt: Record<string, number>;
  };
  cliff: { cols: number; rows: number };
  turf: { cols: number; count: number };
  scatter: {
    cols: number;
    count: number;
    flowers: [number, number];
    pebbles: [number, number];
    rocks: [number, number];
  };
};

export type Atlas = {
  meta: Meta;
  sheets: Record<string, HTMLCanvasElement>;
};

const NAMES = ["blob-grass", "blob-dirt", "cliff", "turf", "scatter"] as const;

async function toCanvas(url: string) {
  const image = new Image();
  image.src = url;
  await image.decode();
  const c = document.createElement("canvas");
  c.width = image.width;
  c.height = image.height;
  c.getContext("2d")!.drawImage(image, 0, 0);
  return c;
}

export async function loadAtlas(): Promise<Atlas> {
  const meta: Meta = await fetch("/terrain-lab/tiles.json").then((r) =>
    r.json(),
  );
  const sheets: Record<string, HTMLCanvasElement> = {};
  await Promise.all(
    NAMES.map(async (n) => {
      sheets[n] = await toCanvas(`/terrain-lab/${n}.png`);
    }),
  );
  return { meta, sheets };
}

/** Palette-mapped copies, cached per sheet and palette so the recolour toggle
 * does not re-scan every pixel on each slider drag. */
const tinted = new Map<string, HTMLCanvasElement>();

function sheetFor(atlas: Atlas, name: string, s: Settings) {
  if (!s.atlasRecolour) return atlas.sheets[name];
  const key = `${name}:${s.palette}`;
  const cached = tinted.get(key);
  if (cached) return cached;
  const src = atlas.sheets[name];
  const c = document.createElement("canvas");
  c.width = src.width;
  c.height = src.height;
  const ctx = c.getContext("2d")!;
  const data = src.getContext("2d")!.getImageData(0, 0, src.width, src.height);
  ctx.putImageData(
    recolour(data, palettes[s.palette], name !== "scatter"),
    0,
    0,
  );
  tinted.set(key, c);
  return c;
}

export function renderAtlas(
  ctx: CanvasRenderingContext2D,
  atlas: Atlas,
  field: Field,
  s: Settings,
) {
  const { meta } = atlas;
  const { width, height } = field.config;
  const size = layoutFor(field, s.rise);
  ctx.canvas.width = size.width;
  ctx.canvas.height = size.height;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, size.width, size.height);

  const grassSheet = sheetFor(atlas, "blob-grass", s),
    dirtSheet = sheetFor(atlas, "blob-dirt", s),
    cliffSheet = sheetFor(atlas, "cliff", s),
    turfSheet = sheetFor(atlas, "turf", s),
    scatterSheet = sheetFor(atlas, "scatter", s);

  const blit = (
    sheet: HTMLCanvasElement,
    cols: number,
    index: number,
    dx: number,
    dy: number,
    sliceY = 0,
    sliceH = TILE,
  ) =>
    ctx.drawImage(
      sheet,
      (index % cols) * TILE,
      Math.floor(index / cols) * TILE + sliceY,
      TILE,
      sliceH,
      dx,
      dy + sliceY,
      TILE,
      sliceH,
    );

  const topOf = (x: number, y: number) =>
    size.headroom + y * TILE - field.level(x, y) * s.rise;
  const fill = meta.blob.grass["255"] ?? 0;

  const surface = (cx: number, cy: number) => {
    const top = topOf(cx, cy);
    if (s.atlasTurf) {
      const variant =
        s.atlasTurfVariant >= 0
          ? s.atlasTurfVariant
          : Math.floor(hash(s.field.seed, cx, cy, 61) * meta.turf.count);
      blit(
        turfSheet,
        meta.turf.cols,
        variant % meta.turf.count,
        cx * TILE,
        top,
      );
    } else {
      blit(grassSheet, meta.blob.cols, fill, cx * TILE, top);
    }
    if (field.dirt(cx, cy)) {
      const mask = blobMask((x, y) => field.dirt(x, y), cx, cy);
      const tile = meta.blob.dirt[String(mask)];
      if (tile !== undefined)
        blit(dirtSheet, meta.blob.cols, tile, cx * TILE, top);
    }
    if (
      cy > 0 &&
      field.level(cx, cy - 1) > field.level(cx, cy) &&
      s.bankShadow
    ) {
      ctx.fillStyle = "rgba(20,28,18,0.34)";
      ctx.fillRect(cx * TILE, top, TILE, s.bankShadow);
    }
  };

  // Cliff sheet columns: 1 left cap, 2 middle, 3 right cap. Rows: 0 grass top,
  // 2 earth face with its lip, 3 the foot that overhangs the ground below.
  const faceColumn = (cx: number, cy: number, level: number) => {
    const open = (x: number) =>
      x < 0 || x >= width || field.level(x, cy) < level;
    if (open(cx - 1) && open(cx + 1)) return 0;
    if (open(cx - 1)) return 1;
    if (open(cx + 1)) return 3;
    return 2;
  };

  const face = (cx: number, cy: number) => {
    const level = field.level(cx, cy);
    const below = cy + 1 < height ? field.level(cx, cy + 1) : 0;
    const drop = (level - below) * s.rise;
    if (drop <= 0) return;
    const col = faceColumn(cx, cy, level);
    const cols = meta.cliff.cols;
    const top = topOf(cx, cy) + TILE;
    blit(cliffSheet, cols, 2 * cols + col, cx * TILE, top);
    for (let y = TILE; y < drop; y += TILE - 6)
      blit(
        cliffSheet,
        cols,
        2 * cols + col,
        cx * TILE,
        top + y - 6,
        6,
        TILE - 6,
      );
    blit(cliffSheet, cols, 3 * cols + col, cx * TILE, top + drop - TILE, 10, 6);
    if (s.bankOutline && cy > 0 && field.level(cx, cy - 1) < level)
      blit(cliffSheet, cols, col, cx * TILE, topOf(cx, cy), 0, 5);
  };

  const scatter = (cx: number, cy: number) => {
    if (field.dirt(cx, cy)) return;
    const r = hash(s.field.seed, cx, cy, 71);
    const cols = meta.scatter.cols;
    const pick = (range: [number, number], strength: number) =>
      range[0] +
      Math.min(
        range[1] - range[0] - 1,
        Math.floor(strength * (range[1] - range[0])),
      );
    const top = topOf(cx, cy);
    if (r < s.flowerDensity * 8)
      blit(
        scatterSheet,
        cols,
        pick(meta.scatter.flowers, r / (s.flowerDensity * 8)),
        cx * TILE,
        top,
      );
    else if (r < s.flowerDensity * 8 + s.rockDensity * 8)
      blit(
        scatterSheet,
        cols,
        pick(meta.scatter.rocks, hash(s.field.seed, cx, cy, 72)),
        cx * TILE,
        top,
      );
  };

  for (let cy = 0; cy < height; cy++) {
    for (let cx = 0; cx < width; cx++) surface(cx, cy);
    for (let cx = 0; cx < width; cx++) face(cx, cy);
    for (let cx = 0; cx < width; cx++) scatter(cx, cy);
  }
}
