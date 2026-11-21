import { palacePropLights } from "./fair/palace";
import type Phaser from "phaser";
import type { LightingId } from "./lighting";
/** Animated fire props: frame `x` has siblings `x-f1..` in the atlas; the
 * count is read from the atlas, four for the braziers and ovens, eight for
 * the open fires. */
export const animatedBase = (frame: string) =>
  frame.replace(/-(f|m)\d+$/, "");
export const animatedFrames = (names: string[]) => {
  const counts = new Map<string, number>();
  for (const name of names) {
    const m = /-f(\d+)$/.exec(name);
    if (!m) continue;
    const base = animatedBase(name);
    counts.set(base, Math.max(counts.get(base) ?? 1, Number(m[1]) + 1));
  }
  return counts;
};
/** Props that move without being on fire: a hive with bees round it, a beam
 * scale settling. Frame `x` has siblings `x-m1..`; the count is read from the
 * atlas so a prop can take as many as its movement needs. */
export const motionFrames = (names: string[]) => {
  const counts = new Map<string, number>();
  for (const name of names) {
    const m = /-m(\d+)$/.exec(name);
    if (!m) continue;
    const base = animatedBase(name);
    counts.set(base, Math.max(counts.get(base) ?? 1, Number(m[1]) + 1));
  }
  return counts;
};
export const MOTION_FRAME_MS = 190;
/** More frames means a slower movement, not a faster one: a scale settling
 * takes a few seconds, a bee's round takes under one, and a traffic signal's
 * sixteen frames make a cycle of a quarter-minute. */
export const motionPeriod = (frames: number) =>
  frames > 8
    ? MOTION_FRAME_MS * 5
    : frames > 4
      ? MOTION_FRAME_MS * 2
      : MOTION_FRAME_MS;
export const FIRE_FRAME_MS = 105;
/** How strongly a fire lights the ground round it, over the night wash. */
export const lightAlpha: Record<LightingId, number> = {
  "early-morning": 0.35,
  morning: 0,
  midday: 0,
  afternoon: 0,
  dusk: 0.55,
  night: 1,
};
/** What burns in a lamp. Its colour, how it moves, and who lights it. */
export type LampTech = "fire" | "oil" | "gas" | "mantle" | "arc" | "bulb" | "mercury" | "sodium" | "led";
export type Lamp = {
  tech: LampTech;
  radius: number;
  /** 0 steady, 1 a gas jet's waver, 2 a naked flame. */
  flicker: 0 | 1 | 2;
  tone: [number, number, number];
  /** Share of full brightness: an oil lantern lit little more than itself. */
  power: number;
  /** Where the light comes from, in the frame's own pixels: the flame, the
   * panes, the bulb under a swan neck's shade. Two for a twin candelabra. */
  heads: [number, number][];
  /** A shade over the bulb throws the light down in a cone; an enclosed
   * lantern or a flame sends it every way. */
  cone: boolean;
  /** Lit by day as well, at this share of its light: candles and lamps indoors. */
  always?: number;
};
const LAMPS: Record<LampTech, Omit<Lamp, "tech" | "radius" | "heads" | "cone">> = {
  fire: { flicker: 2, tone: [255, 186, 112], power: 0.9 },
  oil: { flicker: 2, tone: [255, 196, 122], power: 0.65 },
  gas: { flicker: 1, tone: [255, 216, 148], power: 0.8 },
  // The Welsbach mantle, from the 1890s: steady and faintly green.
  mantle: { flicker: 0, tone: [232, 244, 212], power: 0.95 },
  // Carbon arcs on the grand streets, about 1880 to 1910: hard blue-white.
  arc: { flicker: 1, tone: [222, 232, 255], power: 1 },
  bulb: { flicker: 0, tone: [255, 220, 166], power: 0.9 },
  // Mercury vapour, the cobra-head light of the 1950s and 60s: cold blue-green.
  mercury: { flicker: 0, tone: [216, 238, 236], power: 1 },
  // High-pressure sodium, which replaced it from the 1970s: gold, not orange.
  sodium: { flicker: 0, tone: [255, 200, 128], power: 1 },
  led: { flicker: 0, tone: [236, 242, 255], power: 1 },
};
// Measured off the atlas frames, not the painters' canvases: outlining and
// trimming move everything by a pixel or two.
const HEADS: Record<string, [number, number][]> = {
  "torch-post": [[6, 3]],
  "brazier-post": [[7, 4]],
  "lantern-post": [[9, 10]],
  "gas-lamp": [[8, 8]],
  "electric-lamp": [[19, 11]],
  "sodium-lamp": [[23, 7]],
  "city-lamp-0": [[5, 9]],
  "city-lamp-1": [
    [5, 9],
    [25, 9],
  ],
  "city-lamp-2": [[12, 3]],
  "door-lantern-0": [
    [10, 16],
    [24, 16],
  ],
  "door-lantern-3": [[23, 21]],
};
/** Street lamps and door lanterns. The sprite says what kind of post it is;
 * the year says what burned in it, since one glazed lantern served oil and
 * then gas. `roll` (0 to 1, per lamp) puts arc lights on some electric posts
 * and sets when a cobra head went over to LED.
 * The toran (door marker 6) is a garland. */
export function lampLight(
  frame: string,
  year = 1900,
  roll = 0.5,
  culture?: string,
): Lamp | undefined {
  if (frame.startsWith("made:palace:")) {
    // Candles and lamps among the furniture burn wherever they are put down.
    const heads = palacePropLights(frame);
    return heads.length ? { tech: "oil", radius: heads.length > 1 || frame.includes(":torchere:") ? 26 : 18, heads, cone: false, always: 0.5, ...LAMPS.oil } : undefined;
  }
  const m = /^study-propb-(torch-post|brazier-post|lantern-post|gas-lamp|electric-lamp|sodium-lamp|city-lamp|door-lantern)-(\d)$/.exec(frame);
  if (!m || (m[1] === "door-lantern" && m[2] === "6")) return undefined;
  const kind = m[1];
  const gas = year >= 1895 ? "mantle" : year >= 1810 ? "gas" : "oil";
  const ledStart =
    culture === "east-asian"
      ? 2006 + roll * 12
      : culture === "european"
        ? 2010 + roll * 14
        : culture === "southeast-asian" || culture === "south-asian"
          ? 2013 + roll * 12
          : 2008 + roll * 16;
  const [tech, radius]: [LampTech, number] =
    kind === "door-lantern"
      ? [Number(m[2]) < 3 ? "oil" : year >= 1890 ? "bulb" : "gas", 24]
      : kind === "torch-post" || kind === "brazier-post"
        ? ["fire", 36]
        : kind === "lantern-post"
          ? ["oil", 32]
          : kind === "gas-lamp" || (kind === "city-lamp" && m[2] === "0")
            ? [gas, gas === "oil" ? 30 : 36]
            : kind === "sodium-lamp"
              ? // Cities swapped heads for LEDs street by street from the late 2000s into the 2020s.
                [year < 1972 ? "mercury" : year < ledStart ? "sodium" : "led", 46]
              : kind === "city-lamp"
                ? ["led", 48]
                : year < 1910 && roll < 0.3
                  ? ["arc", 52]
                  : ["bulb", 44];
  const heads =
    kind === "city-lamp"
      ? HEADS[`city-lamp-${m[2]}`]
      : kind === "door-lantern"
        ? HEADS[Number(m[2]) < 3 ? "door-lantern-0" : "door-lantern-3"]
        : HEADS[kind];
  const cone = kind === "electric-lamp" || kind === "sodium-lamp" || (kind === "city-lamp" && m[2] === "2");
  const base = LAMPS[tech];
  // Regional highway/street colour temperature: Europe favours deeper amber
  // sodium and warmer 3000K LEDs; East Asia leans cooler white.
  const tone: [number, number, number] =
    tech === "sodium" && culture === "european"
      ? [255, 182, 96]
      : tech === "led" && culture === "european"
        ? [255, 236, 206]
        : tech === "led" && culture === "east-asian"
          ? [230, 244, 255]
          : base.tone;
  return { tech, radius, heads, cone, ...base, tone };
}
/** Whether a lamp is burning at this hour, 0 to 1. Gas and oil were lit by
 * hand, so each lamp comes on as its lighter reaches it on his round after
 * sunset (`order`, 0 to 1, is its place on the round) and goes out the same
 * way at dawn; oil lanterns and square fires were let die after midnight.
 * Electric light is switched at once; vapour lamps take minutes to warm. */
export function lampOn(tech: LampTech, hour: number, order: number) {
  const manual = tech === "fire" || tech === "oil" || tech === "gas" || tech === "mantle";
  const on = manual ? 17.5 + order * 0.6 : 17.9;
  const off = manual ? 5.4 + order * 0.6 : 5.9;
  const out = tech === "oil" ? 1 + order * 0.5 : tech === "fire" ? 23 + order * 0.5 : undefined;
  // Hours since lighting, through midnight.
  const since = (hour - on + 24) % 24;
  const lit = hour >= on || hour < off;
  if (!lit || (out !== undefined && since >= (out - on + 24) % 24)) return 0;
  // A wick or a mantle catches in a few game minutes; a vapour lamp takes a quarter hour.
  return Math.min(1, since / (tech === "sodium" || tech === "mercury" ? 0.25 : 0.05));
}
/** Three sizes of the pool, swapped in step with the flame. */
export const LIGHT_FLICKER = [0, 1, 0, 2, 1, 0, 2, 1];
/** Three flicker frames of a soft ellipse flattened to the ground, painted
 * per pixel by `shade(d)` for d from the centre (0) to the rim (1). */
function ensureGlow(
  scene: Phaser.Scene,
  key: string,
  radius: number,
  shade: (d: number) => [number, number, number, number],
  flat = 0.65,
) {
  if (scene.textures.exists(key)) return key;
  const w = radius * 2,
    h = Math.round(radius * 2 * flat);
  const canvas = scene.textures.createCanvas(key, w * 3, h)!;
  const img = canvas.context.createImageData(w * 3, h);
  for (let f = 0; f < 3; f++) {
    const scale = 1 - f * 0.06;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const dx = (x + 0.5 - w / 2) / (radius * scale),
          dy = (y + 0.5 - h / 2) / (radius * flat * scale);
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d >= 1) continue;
        const i = (y * w * 3 + f * w + x) * 4;
        const [r, g, b, a] = shade(d);
        img.data.set([r, g, b, Math.round(a * 255)], i);
      }
    canvas.add(String(f), 0, f * w, 0, w, h);
  }
  canvas.context.putImageData(img, 0, 0);
  canvas.refresh();
  return key;
}
/** The warm haze round a flame, added over everything: yellow-white at the
 * heart, red at the rim, and gone well before the edge of the texture. */
export function ensureFireLight(scene: Phaser.Scene, radius: number, tone?: [number, number, number]) {
  if (tone)
    return ensureGlow(scene, `lamp-light-${radius}-${tone.join("-")}`, radius, (d) => {
      const k = (1 - d) * (1 - d);
      return [0, 1, 2].map((c) => Math.round(tone[c] + (255 - tone[c]) * k * 0.6)).concat(k * 0.5) as [
        number,
        number,
        number,
        number,
      ];
    });
  return ensureGlow(scene, `fire-light-${radius}`, radius, (d) => {
    const k = (1 - d) * (1 - d);
    return [255, Math.round(110 + 110 * k), Math.round(40 + 100 * k * k), k * 0.5];
  });
}
/** Firelight laid over the night wash before it multiplies the scene, so the
 * ground in the pool keeps its own colour, warmed, rather than being painted
 * orange. */
export function ensureLightMask(scene: Phaser.Scene, radius: number, tone: [number, number, number] = [255, 206, 150]) {
  return ensureGlow(scene, `light-mask-${radius}-${tone.join("-")}`, radius, (d) => [...tone, (1 - d * d) ** 2]);
}
/** The round glow in the air about an enclosed lantern, added over the night. */
export function ensureHalo(scene: Phaser.Scene, radius: number, tone: [number, number, number]) {
  return ensureGlow(
    scene,
    `lamp-halo-${radius}-${tone.join("-")}`,
    radius,
    (d) => {
      const k = (1 - d) ** 2;
      return [0, 1, 2].map((c) => Math.round(tone[c] + (255 - tone[c]) * k * k * 0.5)).concat(k * 0.42) as [
        number,
        number,
        number,
        number,
      ];
    },
    1,
  );
}
/** Flat elliptical warm light spilled onto the ground outside a doorway or
 * ground-floor window, added gently so wet earth and grass catch the amber. */
export function ensureGroundSpill(scene: Phaser.Scene, radius: number, tone: [number, number, number]) {
  return ensureGlow(
    scene,
    `ground-spill-${radius}-${tone.join("-")}`,
    radius,
    (d) => {
      const k = (1 - d) ** 1.9;
      return [
        Math.round(tone[0] + (255 - tone[0]) * k * 0.25),
        Math.round(tone[1] + (235 - tone[1]) * k * 0.2),
        Math.round(tone[2] + (180 - tone[2]) * k * 0.15),
        k * 0.44,
      ];
    },
    0.52,
  );
}
/** Soft warm firelight/oil-lamp interior glow framed inside a doorway opening:
 * deeper amber under the lintel, brighter toward the hearth-lit threshold. */
export function ensureDoorGlow(scene: Phaser.Scene, w: number, h: number, tone: [number, number, number]) {
  const key = `door-glow-${w}x${h}-${tone.join("-")}`;
  if (scene.textures.exists(key)) return key;
  const canvas = scene.textures.createCanvas(key, w, h)!;
  const img = canvas.context.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    const v = h > 1 ? y / (h - 1) : 1;
    // Dim under the lintel, warmest across the lower two-thirds of the opening.
    const lift = 0.3 + 0.7 * Math.sin(Math.min(1, v * 1.15) * (Math.PI / 2));
    for (let x = 0; x < w; x++) {
      const edge = w > 2 && (x === 0 || x === w - 1) ? 0.55 : 1;
      const topFade = y === 0 ? 0.35 : 1;
      const a = lift * edge * topFade * 0.88;
      img.data.set(
        [
          Math.round(tone[0] * (0.88 + 0.12 * v)),
          Math.round(tone[1] * (0.68 + 0.32 * v)),
          Math.round(tone[2] * (0.46 + 0.54 * v)),
          Math.round(a * 255),
        ],
        (y * w + x) * 4,
      );
    }
  }
  canvas.context.putImageData(img, 0, 0);
  canvas.refresh();
  return key;
}
/** The light under a shade, from the bulb down to the ground: narrow and
 * bright at the top, spreading and thinning as it falls, soft at its edges.
 * Its origin is the middle of its top edge. */
export function ensureLightCone(scene: Phaser.Scene, height: number, tone: [number, number, number]) {
  const key = `lamp-cone-${height}-${tone.join("-")}`;
  if (scene.textures.exists(key)) return key;
  // Opens out to about the width of the pool it lands in.
  const spread = Math.max(48, Math.round(height * 1.7)),
    w = spread + 4;
  const canvas = scene.textures.createCanvas(key, w, height)!;
  const img = canvas.context.createImageData(w, height);
  for (let y = 0; y < height; y++) {
    const t = y / height;
    const half = 3 + (spread / 2 - 3) * Math.sqrt(t);
    for (let x = 0; x < w; x++) {
      const d = Math.abs(x + 0.5 - w / 2) / half;
      if (d >= 1) continue;
      const a = (1 - d) ** 1.8 * (0.55 - 0.3 * t);
      img.data.set([...tone, Math.round(a * 255)], (y * w + x) * 4);
    }
  }
  canvas.context.putImageData(img, 0, 0);
  canvas.refresh();
  return key;
}
/** A wall lamp by a door, three pixels wide: frame "0" its iron and dark
 * glass by day, "1" the glass alone, lit. */
export function ensurePorchLamp(scene: Phaser.Scene) {
  const key = "porch-lamp";
  if (scene.textures.exists(key)) return key;
  const rows = [".k.", "kgk", "kgk", ".k."];
  const canvas = scene.textures.createCanvas(key, 6, 4)!;
  const ctx = canvas.context;
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === ".") return;
      ctx.fillStyle = ch === "k" ? "#2a2a30" : "#8a8f96";
      ctx.fillRect(x, y, 1, 1);
      if (ch === "g") {
        ctx.fillStyle = y === 1 ? "#fff6d8" : "#ffd98a";
        ctx.fillRect(3 + x, y, 1, 1);
      }
    }),
  );
  canvas.add("0", 0, 0, 0, 3, 4);
  canvas.add("1", 0, 3, 0, 3, 4);
  canvas.refresh();
  return key;
}
/** One pixel of spark, tinted per particle. */
export function ensureEmber(scene: Phaser.Scene) {
  const key = "fire-ember";
  if (scene.textures.exists(key)) return key;
  const canvas = scene.textures.createCanvas(key, 1, 1)!;
  canvas.context.fillStyle = "#fff";
  canvas.context.fillRect(0, 0, 1, 1);
  canvas.refresh();
  return key;
}
