import { waterHash as hash, waterNoise as noise } from "./water-style";

/** A ground-cover kit: how one kind of turf and its paths are painted. Only
 * the terrain kits lab sets one, through the ground style, so the shipped
 * raster is unchanged until kits are chosen in the world. Altitude, banks
 * and ramps stay with the contour renderer; a kit only colours their lips. */

export type Hex = string;

/** A drift of taller grass: a lighter patch whose top edge breaks into
 * blades and whose foot casts a thin shade, read from above at an angle. */
export type Drift = {
  tone: Hex;
  shade: Hex;
  coverage: number;
  scale: number;
  /** Tallest blade spike on the drift's top edge, in pixels. */
  blade: number;
  shadeDepth: number;
};

export type TuftForm = {
  weight: number;
  blades: number;
  height: number;
  /** Horizontal reach of the outermost blade tips, in pixels. */
  spread: number;
  /** 0 fans straight; 1 arches the outer blades over and down. */
  curl: number;
  /** Chance of a seed stalk standing out of the clump. */
  stalk: number;
};

/** How a season changes the kit as authored: multipliers on clump density,
 * clump height and flowers, and how far blades cure to straw. Most kits are
 * authored as high summer; summer-dry ones as their green season. */
export type SeasonShift = { density: number; height: number; flowers: number; cure: number };
export const kitSeasons = ["spring", "summer", "autumn", "winter"] as const;

export type GroundKit = {
  id: string;
  name: string;
  note: string;
  /** Where the kit grows: an ecology, `ecology:colourway`, or `vegetation:steppe`. */
  match: string[];
  /** Short open grass where people live: no clumps, few flowers. It begins
   * where the trodden field passes `clearAt`, behind a fringe of wild blades. */
  commons: { base: Hex; grainLight: Hex; clearAt: number; fringe: number; flowers: number };
  /** How hard foot traffic near doors, hearths and work spots thins plants. */
  wear: number;
  seasons: Record<(typeof kitSeasons)[number], SeasonShift>;
  turf: { base: Hex; grainDark: Hex; grainLight: Hex; grain: number; grainSize: number };
  drifts: Drift[];
  tufts: {
    heart: Hex;
    dark: Hex;
    mid: Hex;
    light: Hex;
    tip: Hex;
    seedHead: Hex;
    /** Cured blade colour for autumn, the dry season and winter. */
    straw: Hex;
    shadow: Hex;
    shadowAlpha: number;
    density: number;
    spacing: number;
    colony: number;
    colonyScale: number;
    forms: TuftForm[];
  };
  flowers: { petals: Hex[]; center: Hex; stem: Hex; density: number; cluster: number };
  /** Worn ground, darkest to lightest: contact edge, shoulder, tread, centre, grit. */
  soil: { edge: Hex; shoulder: Hex; tread: Hex; centre: Hex; grit: Hex };
};

type Rgb = number[];
/** How trodden the ground is at a world pixel, 0 wild to 1 bare, smooth across cells. */
type Trod = (wx: number, wy: number) => number;
type Pixel = { c: Rgb; a: number };
const rgb = (hex: Hex): Rgb => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mix = (a: Rgb, b: Rgb, t: number) => a.map((v, k) => Math.round(v + (b[k] - v) * t));

/** Colours resolved once per kit object; the lab replaces the object on every edit. */
type Resolved = {
  kit: GroundKit;
  base: Rgb;
  commons: Rgb;
  commonsLight: Rgb;
  commonsPatch: Rgb;
  grainDark: Rgb;
  grainLight: Rgb;
  drifts: (Drift & { k: number; toneRgb: Rgb; shadeRgb: Rgb; threshold: number })[];
  stamps: Map<string, Map<number, Pixel>>;
  florets: Map<string, Map<number, Pixel>>;
  petals: Rgb[];
};
const resolved = new WeakMap<GroundKit, Map<string, Resolved>>();
/** The kit as it stands in one season: summer is the kit as authored. */
function resolve(authored: GroundKit, season: string): Resolved {
  let bySeason = resolved.get(authored);
  if (!bySeason) resolved.set(authored, (bySeason = new Map()));
  let r = bySeason.get(season);
  if (r) return r;
  const shift: SeasonShift = authored.seasons[season as keyof GroundKit["seasons"]] ?? { density: 1, height: 1, flowers: 1, cure: 0 };
  const straw = rgb(authored.tufts.straw);
  const cure = (hex: Hex, t: number) => {
    const c = rgb(hex);
    return t > 0 ? mix(c, straw, t) : c;
  };
  const toHex = (c: Rgb) => `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  // Blades cure from the tip down; the turf beneath only dulls.
  const t = authored.tufts;
  const kit: GroundKit = {
    ...authored,
    tufts: {
      ...t,
      dark: toHex(cure(t.dark, shift.cure * 0.45)),
      mid: toHex(cure(t.mid, shift.cure * 0.8)),
      light: toHex(cure(t.light, shift.cure)),
      tip: toHex(cure(t.tip, shift.cure)),
      density: t.density * shift.density,
      forms: t.forms.map((f) => ({ ...f, height: Math.max(1, f.height * shift.height) })),
    },
    flowers: { ...authored.flowers, density: authored.flowers.density * shift.flowers },
  };
  const turf = (hex: Hex) => cure(hex, shift.cure * 0.55);
  r = {
    kit,
    base: turf(kit.turf.base),
    commons: turf(kit.commons.base),
    commonsLight: turf(kit.commons.grainLight),
    commonsPatch: mix(turf(kit.commons.base), turf(kit.turf.base), 0.5),
    grainDark: turf(kit.turf.grainDark),
    grainLight: turf(kit.turf.grainLight),
    drifts: kit.drifts.map((d, k) => ({
      ...d,
      k,
      toneRgb: cure(d.tone, shift.cure * 0.7),
      shadeRgb: turf(d.shade),
      threshold: 0.5 + (0.5 - d.coverage) * 0.62,
    })),
    stamps: new Map(),
    florets: new Map(),
    petals: kit.flowers.petals.map(rgb),
  };
  bySeason.set(season, r);
  return r;
}

/** The nine-row ramp the contour and ramp painters read for lips and turf. */
export function kitPalette(kit: GroundKit): Rgb[] {
  const t = kit.tufts;
  return [
    rgb(kit.turf.base),
    rgb(kit.drifts[0]?.tone ?? kit.turf.grainLight),
    rgb(t.dark),
    rgb(kit.soil.grit),
    rgb(kit.soil.edge),
    rgb(t.heart),
    rgb(t.light),
    rgb(kit.drifts[0]?.shade ?? kit.turf.grainDark),
    rgb(kit.soil.shoulder),
  ];
}
export const kitSoil = (kit: GroundKit): Rgb[] =>
  [kit.soil.edge, kit.soil.shoulder, kit.soil.tread, kit.soil.centre, kit.soil.grit].map(rgb);

const spike = (x: number, salt: number, max: number) =>
  max > 0 ? Math.floor(hash(x, 0, salt) ** 0.8 * (max + 1)) : 0;
const field = (x: number, y: number, scale: number, salt: number) =>
  noise(x, y, scale, salt) * 0.7 + noise(x, y, scale / 2.3, salt + 1) * 0.3;

/** Stretches of richer and quieter ground a few cells across, so a kit is
 * not equally busy everywhere. */
const lush = (x: number, y: number) => Math.min(1.6, Math.max(0.2, (field(x, y, 150, 1250) - 0.5) * 3 + 1));

/** Ground trodden past the kit's threshold: a lobed edge, not a ring. */
const commonsAt = (kit: GroundKit, trod: Trod, x: number, y: number) =>
  trod(x, y) + (noise(x, y, 11, 1401) - 0.5) * 0.2 > kit.commons.clearAt;

/** Turf without its plants: base, drifts with bladed tops and shaded feet,
 * grain; on the commons, short plain grass that wild blades fringe. */
function turfPixel(kit: GroundKit, r: Resolved, wx: number, wy: number, trod: Trod): Rgb {
  const g = Math.max(1, Math.round(kit.turf.grainSize));
  const n = hash(Math.floor(wx / g), Math.floor(wy / g), 1109);
  if (commonsAt(kit, trod, wx, wy) && commonsAt(kit, trod, wx, wy + spike(wx, 1403, kit.commons.fringe))) {
    if (n > 1 - kit.turf.grain / 3) return r.commonsLight;
    // Broad soft patches of the wild turf's tone keep a cleared green from reading as a flat fill.
    return field(wx, wy, 30, 1407) > 0.6 ? r.commonsPatch : r.commons;
  }
  const raw = (d: Resolved["drifts"][number], x: number, y: number) =>
    field(x, y, d.scale, 1100 + d.k * 13) > d.threshold;
  const inside = (d: Resolved["drifts"][number], x: number, y: number) =>
    raw(d, x, y) || raw(d, x, y + spike(x + d.k * 997, 1155 + d.k, d.blade));
  let c = r.base;
  for (const d of r.drifts) {
    if (inside(d, wx, wy)) c = d.toneRgb;
    else
      for (let i = 1; i <= d.shadeDepth; i++)
        if (inside(d, wx, wy - i)) {
          c = d.shadeRgb;
          break;
        }
  }
  if (n < kit.turf.grain / 2) return mix(c, r.grainDark, 0.7);
  if (n > 1 - kit.turf.grain / 2) return mix(c, r.grainLight, 0.7);
  return c;
}

/** One clump: blades fanned from a dense dark heart, dark at the root to lit
 * tips, the sun side a step lighter, sitting in a small pool of shadow. */
function tuftStamp(kit: GroundKit, form: TuftForm, variant: number) {
  const t = kit.tufts;
  const tones = [rgb(t.dark), rgb(t.mid), rgb(t.light), rgb(t.tip)];
  const out = new Map<number, Pixel>();
  const set = (dx: number, dy: number, c: Rgb, a = 1) => out.set(dx * 64 + dy, { c, a });
  const n = Math.max(1, Math.round(form.blades));
  const rootHalf = Math.floor((n - 1) / 4);
  const reach = rootHalf + Math.ceil(form.spread) + 1;
  for (let dx = -reach; dx <= reach; dx++)
    for (let dy = -1; dy <= 1; dy++)
      if ((dx / reach) ** 2 + (dy / 1.6) ** 2 <= 1) set(dx, dy + 1, rgb(t.shadow), t.shadowAlpha);
  const order = Array.from({ length: n }, (_, i) => i).sort(
    (a, b) => Math.abs(b - (n - 1) / 2) - Math.abs(a - (n - 1) / 2),
  );
  for (const i of order) {
    const u = n === 1 ? 0 : (i / (n - 1)) * 2 - 1;
    const root = Math.round(u * rootHalf);
    const length = Math.max(2, Math.round(form.height * (1 - 0.4 * Math.abs(u)) * (0.8 + 0.4 * hash(variant, i, 31))));
    // Sun from the upper left: west blades a tone up, east blades a tone down.
    const lift = u < -0.3 ? 1 : u > 0.3 ? -1 : 0;
    for (let s = 0; s < length; s++) {
      const f = length === 1 ? 1 : s / (length - 1);
      const droop = form.curl * Math.abs(u) * length * 0.5 * f * f;
      let k = f < 0.3 ? 0 : f < 0.65 ? 1 : f < 0.9 ? 2 : 3;
      if (k > 0 && k < 3) k = Math.max(0, Math.min(2, k + lift));
      set(root + Math.round(u * form.spread * f + form.curl * u * f * f * 1.5), -Math.round(s - droop), tones[k]);
    }
  }
  if (hash(variant, n, 41) < form.stalk) {
    const sx = hash(variant, 9, 43) < 0.5 ? -1 : 1;
    const tall = Math.round(form.height * 1.3);
    const lean = (s: number) => sx * Math.round((s / tall) ** 2 * 2);
    for (let s = 0; s < tall; s++) set(sx + lean(s), -s, tones[s < tall * 0.4 ? 0 : 1]);
    const hx = sx + lean(tall);
    set(hx, -tall, tones[3]);
    set(hx, -tall - 1, rgb(t.seedHead));
    set(hx + sx, -tall - 1, tones[2]);
    set(hx, -tall - 2, rgb(t.seedHead));
  }
  for (let dx = -rootHalf - 1; dx <= rootHalf + 1; dx++) set(dx, 0, rgb(t.heart));
  for (let dx = -rootHalf; dx <= rootHalf; dx++) set(dx, -1, rgb(t.heart));
  return out;
}

function floretStamp(kit: GroundKit, petal: Rgb, small: boolean) {
  const out = new Map<number, Pixel>();
  const set = (dx: number, dy: number, c: Rgb, a = 1) => out.set(dx * 64 + dy, { c, a });
  const stem = rgb(kit.flowers.stem),
    leaf = mix(stem, rgb(kit.tufts.light), 0.45),
    under = mix(petal, stem, 0.4);
  const top = small ? -2 : -4;
  for (const dx of [-1, 0, 1]) set(dx, 1, rgb(kit.tufts.shadow), kit.tufts.shadowAlpha * 0.7);
  for (let dy = 0; dy > top; dy--) set(0, dy, stem);
  set(-1, 0, stem);
  set(1, 0, leaf);
  if (!small) set(1, -1, leaf);
  // A cross of petals, the lower one in shade, round a lit centre.
  set(-1, top, petal);
  set(1, top, petal);
  set(0, top - 1, petal);
  set(0, top + 1, under);
  set(0, top, rgb(kit.flowers.center));
  return out;
}

const FLOWER_STEP = 22;

/** Tufts and flowers over turf, topmost first: of the plants whose stamp
 * covers this pixel, the one rooted furthest south stands in front.
 * `wild` is 0 where nothing may grow, 1 on untrodden ground. */
function plantPixel(r: Resolved, wx: number, wy: number, wild: (x: number, y: number) => number, trod: Trod) {
  const kit = r.kit;
  let best: Pixel | undefined,
    bestY = -Infinity;
  const rooted = new Map<number, boolean>();
  const consider = (stamp: Map<number, Pixel>, rx: number, ry: number) => {
    if (ry < bestY) return;
    const p = stamp.get((wx - rx) * 64 + (wy - ry));
    // A shadow pool never darkens blades already standing behind it.
    if (!p || (best && best.a >= 1 && p.a < 1)) return;
    if (!rooted.get(rx * 4096 + ry)) return;
    best = p;
    bestY = ry;
  };
  const tf = kit.tufts;
  const forms = tf.forms.filter((f) => f.weight > 0);
  const total = forms.reduce((s, f) => s + f.weight, 0);
  const step = Math.max(6, Math.round(tf.spacing));
  if (forms.length)
    for (let gy = Math.floor((wy - 2) / step); gy <= Math.floor((wy + 18) / step); gy++)
      for (let gx = Math.floor((wx - 9) / step); gx <= Math.floor((wx + 9) / step); gx++) {
        const cx = gx * step + step / 2,
          cy = gy * step + step / 2;
        // Clumps gather in and just around the taller-grass drifts and a few
        // colonies of their own; `colony` is how much of the kit's density is
        // held back for those places rather than scattered evenly.
        const d = r.drifts[0];
        const drift = d ? (field(cx, cy, d.scale, 1100) - d.threshold + 0.06) * 9 : 0;
        const own = (field(cx, cy, tf.colonyScale, 1200) - 0.6) * 8;
        const gather = Math.min(1, Math.max(0, drift, own));
        const chance = tf.density * (1 - tf.colony + tf.colony * gather) * lush(cx, cy);
        const roll = hash(gx, gy, 1201);
        if (roll > chance) continue;
        const rx = Math.floor(gx * step + hash(gx, gy, 1202) * step),
          ry = Math.floor(gy * step + hash(gx, gy, 1203) * step);
        const dx = wx - rx;
        if (Math.abs(dx) > 9 || wy > ry + 2 || wy < ry - 18) continue;
        // Trodden ground keeps fewer clumps, and those it keeps are cropped short.
        const w = commonsAt(kit, trod, rx, ry) ? 0 : wild(rx, ry);
        if (roll > chance * w) continue;
        rooted.set(rx * 4096 + ry, true);
        let pick = hash(gx, gy, 1204) * total,
          fi = 0;
        while (fi < forms.length - 1 && pick > forms[fi].weight) pick -= forms[fi++].weight;
        if (hash(gx, gy, 1207) > w) fi = forms.length - 1;
        const variant = Math.floor(hash(gx, gy, 1205) * 5);
        const flip = hash(gx, gy, 1206) < 0.5;
        const key = `${fi}:${variant}:${flip}`;
        let stamp = r.stamps.get(key);
        if (!stamp) {
          const s = tuftStamp(kit, forms[fi], variant * 7 + fi);
          stamp = flip ? new Map([...s].map(([k, p]) => {
            const ddx = Math.round(k / 64),
              ddy = k - ddx * 64;
            return [-ddx * 64 + ddy, p];
          })) : s;
          r.stamps.set(key, stamp);
        }
        consider(stamp, rx, ry);
      }
  const fl = kit.flowers;
  if (r.petals.length)
    for (let gy = Math.floor((wy - 8) / FLOWER_STEP); gy <= Math.floor((wy + 12) / FLOWER_STEP); gy++)
      for (let gx = Math.floor((wx - 9) / FLOWER_STEP); gx <= Math.floor((wx + 9) / FLOWER_STEP); gx++) {
        const cx = gx * FLOWER_STEP, cy = gy * FLOWER_STEP;
        const patch = Math.min(2, Math.max(0, (field(cx, cy, 48, 1310) - 0.42) * 5));
        if (hash(gx, gy, 1301) > fl.density * 2 * patch * lush(cx, cy)) continue;
        const pi = Math.floor(hash(gx, gy, 1302) * r.petals.length);
        const small = hash(gx, gy, 1303) < 0.4;
        const key = `${pi}:${small}`;
        let stamp = r.florets.get(key);
        if (!stamp) r.florets.set(key, (stamp = floretStamp(kit, r.petals[pi], small)));
        for (let i = 0; i < fl.cluster; i++) {
          const rx = Math.floor(gx * FLOWER_STEP + FLOWER_STEP / 2 + (hash(gx * 9 + i, gy, 1304) - 0.5) * 12),
            ry = Math.floor(gy * FLOWER_STEP + FLOWER_STEP / 2 + (hash(gx, gy * 9 + i, 1305) - 0.5) * 9);
          if (Math.abs(wx - rx) > 1 || wy > ry + 1 || wy < ry - 5) continue;
          const w = commonsAt(kit, trod, rx, ry) ? kit.commons.flowers : wild(rx, ry) ** 2;
          if (hash(rx, ry, 1306) > w) continue;
          rooted.set(rx * 4096 + ry, true);
          consider(stamp, rx, ry);
        }
      }
  return best;
}

/** The finished turf pixel at a world position. */
export function kitGroundPixel(
  kit: GroundKit,
  season: string,
  wx: number,
  wy: number,
  wild: (x: number, y: number) => number,
  trod: Trod,
): Rgb {
  const r = resolve(kit, season);
  const ground = turfPixel(r.kit, r, wx, wy, trod);
  const plant = plantPixel(r, wx, wy, wild, trod);
  return plant ? (plant.a >= 1 ? plant.c : mix(ground, plant.c, plant.a)) : ground;
}

/** The kit for a place: a growth pattern first, then the exact colourway,
 * then the ecology. A lone kit is forced everywhere, which is how the lab
 * compares one against the shipped ground. */
export function pickKit(
  kits: GroundKit[] | undefined,
  ecology: string | undefined,
  colorway?: string,
  vegetation?: string,
): GroundKit | undefined {
  if (!kits?.length) return undefined;
  if (kits.length === 1) return kits[0];
  const keys = [vegetation && `vegetation:${vegetation}`, colorway && `${ecology}:${colorway}`, ecology];
  for (const key of keys) {
    if (!key) continue;
    const kit = kits.find((k) => k.match.includes(key));
    if (kit) return kit;
  }
  return undefined;
}
