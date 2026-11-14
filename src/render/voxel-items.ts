import {
  dyes,
  parseCloth,
  type Material,
} from "../content/characters/wardrobe/cloth";
import { garmentIconFor, periodArt } from "./garment-icons";
import type { Made } from "../core/making";

/** Voxel item art baked by scripts/art/voxel_items.py --bake. Sprites carry a
 * material in red and a ramp step in green; colour is applied here, so a
 * garment takes the dye in its id without a sprite per dye, and a hand-made
 * thing takes the colours of what went into it. */
type Slot = "body" | "body-dark" | "trim" | "trim-dark";
type Mat = string[] | "dye" | "dye-dark" | Slot | null;
type Manifest = {
  icon: number;
  perRow: number;
  turn: { size: number; yaws: number; pitches: number[] };
  items: Record<string, { i: number; label: string; mats: Mat[]; dye?: string }>;
};

let manifest: Manifest | undefined;
let icons: ImageData | undefined;
let loading: Promise<void> | undefined;
const iconCache = new Map<string, HTMLCanvasElement>();
const turnCache = new Map<string, Promise<HTMLCanvasElement>>();

function pixels(src: string) {
  return new Promise<ImageData>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      resolve(ctx.getImageData(0, 0, c.width, c.height));
    };
    img.onerror = reject;
    img.src = src;
  });
}

export function loadVoxelItems() {
  loading ??= Promise.all([
    fetch("/items/items.json").then((r) => r.json() as Promise<Manifest>),
    pixels("/items/icons.png"),
  ]).then(([m, i]) => {
    manifest = m;
    icons = i;
  });
  return loading;
}
export const voxelItemsReady = () => !!manifest;
export const voxelTurn = () => manifest?.turn;

let catalog: Record<string, { made?: Made }> = {};
/** The game's invented items, so a hand-made one can find its shape. */
export function setMadeItems(items: Record<string, { made?: Made }> | undefined) {
  catalog = items ?? {};
}

export function voxelKey(id: string) {
  if (!manifest) return undefined;
  const made = catalog[id]?.made;
  if (made) return `form-${made.form}` in manifest.items ? `form-${made.form}` : undefined;
  const base = parseCloth(id)?.base ?? id;
  const key = garmentIconFor(base) ?? periodArt(base);
  return key in manifest.items ? key : base in manifest.items ? base : undefined;
}

// Python's colorsys HLS, so ramps match scripts/art/voxel_items.py item_ramp.
function toHls(r: number, g: number, b: number) {
  const hi = Math.max(r, g, b),
    lo = Math.min(r, g, b),
    l = (hi + lo) / 2;
  if (hi === lo) return [0, l, 0];
  const s = l <= 0.5 ? (hi - lo) / (hi + lo) : (hi - lo) / (2 - hi - lo);
  const rc = (hi - r) / (hi - lo),
    gc = (hi - g) / (hi - lo),
    bc = (hi - b) / (hi - lo);
  const h = r === hi ? bc - gc : g === hi ? 2 + rc - bc : 4 + gc - rc;
  return [(((h / 6) % 1) + 1) % 1, l, s];
}
function fromHls(h: number, l: number, s: number) {
  if (s === 0) return [l, l, l];
  const m2 = l <= 0.5 ? l * (1 + s) : l + s - l * s,
    m1 = 2 * l - m2;
  const v = (hue: number) => {
    hue = ((hue % 1) + 1) % 1;
    if (hue < 1 / 6) return m1 + (m2 - m1) * hue * 6;
    if (hue < 0.5) return m2;
    if (hue < 2 / 3) return m1 + (m2 - m1) * (2 / 3 - hue) * 6;
    return m1;
  };
  return [v(h + 1 / 3), v(h), v(h - 1 / 3)];
}
const wrap = (x: number) => ((((x + 0.5) % 1) + 1) % 1) - 0.5;
function rampRgb(base: string, n = 10) {
  const n0 = parseInt(base.slice(1), 16);
  const [h, l, s] = toHls(
    ((n0 >> 16) & 255) / 255,
    ((n0 >> 8) & 255) / 255,
    (n0 & 255) / 255,
  );
  const out: number[][] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / (n - 1)) * 2 - 1;
    const c =
      t < 0
        ? fromHls(
            h + wrap(0.72 - h) * -t * 0.22,
            l * (1 + t * 0.72),
            Math.min(1, s * (1 - t * 0.25)),
          )
        : fromHls(
            h + wrap(0.11 - h) * t * 0.12,
            l + (0.86 - l) * t * 0.55,
            s * (1 - t * 0.12),
          );
    out.push(c.map((v) => Math.round(Math.max(0, Math.min(1, v)) * 255)));
  }
  return out;
}
const hex = (rgb: number[]) =>
  "#" + rgb.map((v) => v.toString(16).padStart(2, "0")).join("");

type Grain = ((a: number, u: number) => number) | undefined;
/** The surface a thing lends to what is made of it. */
function grainOf(id: string): Grain {
  if (/sponge|pumice|coral|dung/.test(id)) return (a, u) => 2 * Math.min(0, fibre("hide", a, u));
  if (/stone|flint|rock|ore|granite/.test(id)) return (a, u) => fibre("wool", a, u);
  return undefined;
}
function grains(key: string, id: string): Grain[] | undefined {
  const mats = manifest!.items[key].mats;
  const made = catalog[id]?.made;
  if (made) return mats.map((m) => (m === "body" ? grainOf(made.body) : m === "trim" ? grainOf(made.trim) : undefined));
  const material = parseCloth(id)?.cloth.material;
  if (!material) return undefined;
  return mats.map((m) => (m === "dye" || m === "dye-dark" ? (a, u) => fibre(material, a, u) : undefined));
}

/** A thing's colour as an ingredient: the ramp of its own main material. */
function stuff(id: string, depth = 0): number[][] {
  const made = catalog[id]?.made;
  if (made && depth < 4) return stuff(made.body, depth + 1);
  const key = voxelKey(id);
  return (key && palette(key, id)[1]) || rampRgb("#9a8a70");
}

function palette(key: string, id: string): number[][][] {
  const item = manifest!.items[key];
  const dye = parseCloth(id)?.cloth.dye;
  const cloth = dye ? dyes[dye].hex : item.dye;
  const made = catalog[id]?.made;
  const slot = (m: Slot) => {
    const ramp = made ? stuff(m.startsWith("body") ? made.body : made.trim, 1) : rampRgb("#9a8a70");
    return m.endsWith("dark") ? rampRgb(hex(ramp[3])) : ramp;
  };
  return item.mats.map((m) =>
    m === null
      ? []
      : typeof m === "string" && m !== "dye" && m !== "dye-dark"
        ? slot(m)
        : m === "dye"
        ? rampRgb(cloth!)
        : m === "dye-dark"
          ? rampRgb(hex(rampRgb(cloth!)[3]))
          : m.map((h) => [
              parseInt(h.slice(1, 3), 16),
              parseInt(h.slice(3, 5), 16),
              parseInt(h.slice(5, 7), 16),
            ]),
  );
}

/** Fibre, as a step up or down the ramp at a place on the cloth: a speckle
 * for spun wool, weave lines for bast, a sheen for silk, nothing for cotton. */
function fibre(material: Material | undefined, a: number, u: number) {
  const n = (a * 7 + u * 13 + ((a * u) % 5)) % 11;
  switch (material) {
    case "wool":
    case "felt":
      return n === 0 ? -1 : n === 6 ? 1 : 0;
    case "linen":
    case "hemp":
    case "jute":
    case "ramie":
      return u % 3 === 0 ? -1 : 0;
    case "silk":
      return (a + u) % 8 < 2 ? 1 : (a + u) % 8 === 4 ? -1 : 0;
    case "synthetic":
      return (a + u) % 9 === 0 ? 1 : 0;
    case "hide":
    case "fur":
      return n < 2 ? -1 : n === 7 ? 1 : 0;
    case "barkcloth":
      return a % 4 === 0 ? -1 : u % 5 === 0 ? 1 : 0;
    default:
      return 0;
  }
}

function paint(
  src: ImageData,
  x0: number,
  y0: number,
  w: number,
  h: number,
  ramps: number[][][],
  grain?: Grain[],
) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  const out = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const s = ((y0 + y) * src.width + x0 + x) * 4;
      if (!src.data[s + 3]) continue;
      const m = src.data[s];
      let step = src.data[s + 1];
      const g = grain?.[m];
      if (g && step > 0) {
        const b = src.data[s + 2];
        step = Math.max(1, Math.min(9, step + g(b & 15, b >> 4)));
      }
      const rgb = ramps[m]?.[step];
      if (!rgb) continue;
      const o = (y * w + x) * 4;
      out.data[o] = rgb[0];
      out.data[o + 1] = rgb[1];
      out.data[o + 2] = rgb[2];
      out.data[o + 3] = 255;
    }
  ctx.putImageData(out, 0, 0);
  return c;
}

/** The 48px icon for an item id, coloured by the cloth in the id. */
export function voxelIcon(id: string) {
  const key = voxelKey(id);
  if (!key || !icons) return undefined;
  const q = parseCloth(id)?.cloth;
  const cacheKey = catalog[id]?.made ? id : `${key}|${q?.dye ?? ""}|${q?.material ?? ""}`;
  let c = iconCache.get(cacheKey);
  if (!c) {
    const { icon, perRow } = manifest!;
    const i = manifest!.items[key].i;
    c = paint(
      icons,
      (i % perRow) * icon,
      Math.floor(i / perRow) * icon,
      icon,
      icon,
      palette(key, id),
      grains(key, id),
    );
    iconCache.set(cacheKey, c);
  }
  return c;
}

/** Every frame of the item's turntable, yaws across and pitches down. */
export function voxelTurntable(id: string) {
  const key = voxelKey(id);
  if (!key) return undefined;
  const q = parseCloth(id)?.cloth;
  const cacheKey = catalog[id]?.made ? id : `${key}|${q?.dye ?? ""}|${q?.material ?? ""}`;
  let p = turnCache.get(cacheKey);
  if (!p) {
    p = pixels(`/items/turn/${key}.png`).then((d) =>
      paint(d, 0, 0, d.width, d.height, palette(key, id), grains(key, id)),
    );
    turnCache.set(cacheKey, p);
  }
  return p;
}
