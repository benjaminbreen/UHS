import type { CharacterAppearance, CharacterFace } from "../../core/character";
import { mix } from "../characters/pixels";
import { portraitFace } from "./layered";
import type { Expression as Face } from "./constructed";
import { MAT, Raster, tones, type Mat, type Tones } from "./raster";

export const SCULPTED_WIDTH = 64;
export const SCULPTED_HEIGHT = 80;

const HAT = 6 as Mat;
const SHIRT = 7 as Mat;
const INNER = 8 as Mat;
const LIP = 9 as Mat;
const CLOAK = 10 as Mat;

/** Screen position of the model origin (between the eyes, a little behind). */
const OX = 31;
const OY = 31;
const YAW = 0.5;
/** Screen pixels per model unit. */
const SCALE = 1.12;
const COS = Math.cos(YAW);
const SIN = Math.sin(YAW);
const LIGHT = norm([-0.5, 0.62, 0.6]);

type V = [number, number, number];
type Hit = [number, number];

function norm([x, y, z]: V): V {
  const l = Math.hypot(x, y, z) || 1;
  return [x / l, y / l, z / l];
}
const len3 = (x: number, y: number, z: number) => Math.hypot(x, y, z);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function sphere(p: V, cx: number, cy: number, cz: number, r: number) {
  return len3(p[0] - cx, p[1] - cy, p[2] - cz) - r;
}
function ellipsoid(p: V, cx: number, cy: number, cz: number, rx: number, ry: number, rz: number) {
  const x = p[0] - cx, y = p[1] - cy, z = p[2] - cz;
  const k0 = len3(x / rx, y / ry, z / rz);
  const k1 = len3(x / (rx * rx), y / (ry * ry), z / (rz * rz));
  return (k0 * (k0 - 1)) / (k1 || 1e-6);
}
function capsule(p: V, a: V, b: V, r: number) {
  const pa = [p[0] - a[0], p[1] - a[1], p[2] - a[2]];
  const ba = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const h = clamp((pa[0] * ba[0] + pa[1] * ba[1] + pa[2] * ba[2]) / (ba[0] ** 2 + ba[1] ** 2 + ba[2] ** 2), 0, 1);
  return len3(pa[0] - ba[0] * h, pa[1] - ba[1] * h, pa[2] - ba[2] * h) - r;
}
/** Vertical capped cylinder centred at (cx, cy, cz). */
function cylinder(p: V, cx: number, cy: number, cz: number, r: number, h: number) {
  const dx = Math.hypot(p[0] - cx, p[2] - cz) - r, dy = Math.abs(p[1] - cy) - h;
  return Math.min(Math.max(dx, dy), 0) + Math.hypot(Math.max(dx, 0), Math.max(dy, 0));
}
/** Torus lying flat around the vertical axis through (cx, cz). */
function torus(p: V, cx: number, cy: number, cz: number, R: number, r: number, sx = 1, sz = 1) {
  const q = Math.hypot((p[0] - cx) / sx, (p[2] - cz) / sz) - R;
  return Math.hypot(q, p[1] - cy) - r;
}
function smin(a: number, b: number, k: number) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - (h * h * k) / 4;
}
const smax = (a: number, b: number, k: number) => -smin(-a, -b, k);

type Model = {
  a: CharacterAppearance;
  face: CharacterFace;
  age: number;
  female: boolean;
  child: boolean;
  seed: string;
  ramps: Record<number, Tones>;
  skin: Tones;
  hair: Tones;
  headW: number;
  headH: number;
  jawW: number;
  chinY: number;
  chinR: number;
  cheek: number;
  chinOut: number;
  cleft: boolean;
  ridge: number;
  nose: { len: number; out: number; wide: number; tip: number; hump: number; droop: number };
  mouthW: number;
  mouthY: number;
  neck: number;
  /** 0 until the mid-forties, 1 by eighty: drives lines, jowls, thinning lips and the stoop. */
  old: number;
  /** Heavy (+1) to lean (-1). */
  full: number;
  upper: number;
  lower: number;
  eyeX: number;
  hairline: number;
  shoulder: number;
  expression: Expression;
  iris: string;
};

type Expression = "calm" | "friendly" | "stern" | "tired" | "wry" | "wary";

function roll(m: { seed: string }, key: string) {
  let h = 2166136261;
  for (const ch of m.seed + key) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10007) / 10007;
}
/** A trait's roll: mostly the family's where there is a lineage, so kin share it, partly the person's own. */
const trait = (m: { seed: string; lineage?: string }, key: string) =>
  m.lineage ? roll({ seed: m.lineage }, key) * 0.7 + roll(m, key) * 0.3 : roll(m, key);
const spread = (m: { seed: string; lineage?: string }, key: string, span: number) => (trait(m, key) * 2 - 1) * span;

const NOSES: Record<string, [len: number, out: number, wide: number, tip: number, hump: number, droop: number]> = {
  straight: [7.5, 3.4, 1.15, 1.8, 0, 0],
  aquiline: [8, 4, 1.1, 1.7, 1.3, 0.4],
  hooked: [8.5, 4.2, 1.15, 1.8, 1.5, 1.4],
  broad: [6.5, 2.6, 2.2, 2.4, 0, 0],
  bulbous: [6.6, 3.2, 1.6, 2.9, 0, 0.3],
  snub: [5.4, 2.8, 1.2, 1.8, 0, -1.2],
  short: [5.6, 2.9, 1.25, 1.8, 0, 0],
  narrow: [8, 3.6, 0.9, 1.4, 0.4, 0],
  flat: [5, 1.7, 2.3, 2.2, 0, 0],
};
const MOUTHS: Record<string, [w: number, u: number, l: number]> = {
  narrow: [5.5, 0.8, 1.1],
  soft: [6.6, 1, 1.3],
  full: [7.2, 1.5, 1.9],
  wide: [8.6, 1, 1.3],
};
const EXPRESSIONS: Expression[] = ["calm", "calm", "friendly", "friendly", "stern", "tired", "wary"];

function model(a: CharacterAppearance, age: number): Model {
  const face = portraitFace(a, age);
  const female = a.physique?.sex === "female";
  const child = age < 14;
  const seed = JSON.stringify([a.skin, a.hairColor, face, a.head, a.jaw, a.hair, a.beard]);
  const s = { seed, lineage: a.lineage };
  const grey = age > 50 ? Math.min(0.75, (age - 50) / 30) : 0;
  const lightness = [1, 3, 5].reduce((sum, i) => sum + parseInt(a.skin.slice(i, i + 2), 16), 0) / 3;
  const rec = a.record ?? {};
  // Sun deepens and warms the skin; illness drains it toward grey.
  const skinHex = mix(mix(a.skin, "#6a3a22", (rec.sun ?? 0) * 0.07), "#b4ae9e", rec.pale ? 0.2 : 0);
  const skin = tones(skinHex, "skin");
  const hair = tones(mix(a.hairColor, "#c8c4c0", grey), "hair");
  const old = clamp((age - 45) / 35, 0, 1);
  const lipBase = mix(skinHex, lightness > 170 ? "#c4506a" : "#7a2e3c", (female ? 0.6 : 0.32) * (1 - old * 0.4));
  const ph = a.physique ?? { strength: 50, sex: "unspecified" as const };
  const strength = ph.strength ?? 50, mass = ph.mass ?? 50, full = clamp((mass - 50) / 45, -1, 1);
  let headW = 13.8, headH = 16.5, jawW = 10.9, chinY = -15.5, chinR = 4.2;
  switch (a.head) {
    case "round": headW += 1; headH -= 1; jawW += 0.8; chinY += 0.5; break;
    case "long": headW -= 0.6; headH += 1.4; chinY -= 1.1; break;
    case "broad": headW += 1.6; jawW += 1.4; break;
    case "oval": jawW -= 1; chinY -= 0.8; break;
  }
  switch (a.jaw) {
    case "square": jawW += 1.5; chinR += 0.7; break;
    case "pointed": jawW -= 2; chinR -= 1; chinY -= 0.8; break;
    case "soft": jawW += 0.6; chinR += 0.4; break;
    case "small": jawW -= 1.1; chinY += 0.8; break;
  }
  if (face.chin === "long") chinY -= 1;
  if (face.chin === "short") chinY += 0.9;
  if (female) { jawW -= 1.9; chinR -= 0.9; chinY += 0.7; headW -= 0.4; }
  if (child) { jawW -= 2; chinY += 3; chinR -= 1; }
  jawW += full * 1.3 + old * 0.4 - (rec.gaunt ?? 0) * 0.7;
  chinY -= old * 0.5;
  // Every adult face keeps a chin between these; the extremes read as caricature.
  chinY = clamp(chinY, child ? -13.5 : -17.6, child ? -11 : -14.2);
  headW += spread(s, "head-w", 1);
  headH += spread(s, "head-h", 1.2);
  jawW += spread(s, "jaw-w", 1.2);
  chinR = Math.max(child ? 3 : 3.7, chinR + spread(s, "chin-r", 0.6));
  chinY += spread(s, "chin-y", 1.2);
  const [len0, out, wide, tip, hump, droop] = NOSES[face.nose] ?? NOSES.straight;
  const len = len0 + old * 0.7;
  const bridge = face.noseBridge ?? "average";
  const [mw, u, l] = MOUTHS[face.mouth] ?? MOUTHS.soft;
  const irises =
    lightness > 205 ? ["#3f5f7a", "#4a6a50", "#6a5030", "#3a2418", "#5a6a78"]
    : lightness > 175 ? ["#3a2418", "#5a4020", "#3a2418", "#4a6a50"]
    : ["#2a1810", "#2e1c14", "#3a2418"];
  const cloth = tones(a.wearing.color, "cloth");
  const upper = Math.max(0.9, u + 0.3 + (female ? 0.5 : 0) + spread(s, "upper", 0.3) - old * 0.5);
  // The lower lip is usually a little fuller than the upper, never twice it.
  const lower = clamp(l + 0.3 + (female ? 0.2 : 0) + spread(s, "lower", 0.3) - old * 0.3, 1, upper * 1.3 + 0.2);
  return {
    a, face, age, female, child, seed, skin, hair,
    ramps: {
      [MAT.skin]: skin,
      [MAT.hair]: hair,
      [MAT.cloth]: cloth,
      [MAT.trim]: tones(a.wearing.trim, "cloth"),
      [MAT.metal]: tones({ gold: "#d9a441", silver: "#c8ccd4", copper: "#c07040", bone: "#e8dcc0", shell: "#f0e0d0", jet: "#34303c" }[a.adornment?.metal ?? "gold"] ?? "#d9a441", "cloth"),
      [HAT]: tones(a.wearing.headColor ?? a.wearing.trim, "cloth"),
      [SHIRT]: tones("#e8e4da", "cloth"),
      [INNER]: tones(a.wearing.innerColor ?? a.wearing.lowerColor, "cloth"),
      [LIP]: tones(lipBase, "skin"),
      [CLOAK]: tones(a.wearing.cloakColor ?? a.wearing.color, "cloth"),
    },
    headW, headH, jawW, chinY, chinR,
    // Most cheekbones are quiet; a few people have them high and sculpted.
    cheek: Math.max(1.4, 2.3 + trait(s, "cheekbone") ** 2 * 2.6 + full * 0.8 - old * 0.5 + (female ? 0.4 : 0) - (rec.gaunt ?? 0) * 0.8),
    chinOut: spread(s, "chin-out", 0.9) + (!female && !child ? 0.4 : 0),
    cleft: !female && !child && trait(s, "cleft") > 0.72,
    ridge: female || child ? 1.4 : 1.8 + trait(s, "brow-ridge") * 0.9,
    nose: {
      len: (len + spread(s, "nose-len", 0.9)) * (child ? 0.65 : female ? 0.88 : 1),
      out: (out + (bridge === "high" ? 0.9 : bridge === "low" ? -0.8 : 0) + spread(s, "nose-out", 0.5)) * (child ? 0.6 : female ? 0.85 : 1),
      // A low bridge goes with broad wings.
      wide: (wide + (bridge === "low" ? 0.45 : 0) + spread(s, "nose-wide", 0.25)) * (female ? 0.92 : 1),
      tip: tip + spread(s, "nose-tip", 0.3),
      hump, droop,
    },
    mouthW: (mw + spread(s, "mouth-w", 0.8)) * (child ? 0.75 : 1),
    // A third of the way from the nose base to the chin, as in most faces.
    mouthY: (1.5 - len * (child ? 0.65 : 1)) - ((1.5 - len * (child ? 0.65 : 1)) - (chinY - chinR * 0.4)) * 0.36,
    upper, lower,
    neck: (5.4 + (strength - 50) * 0.025 + full * 0.9 - (female ? 0.9 : 0)) * (child ? 0.8 : 1),
    old, full,
    eyeX: 5.9 + (face.eyeSpacing === "wide" ? 0.7 : face.eyeSpacing === "close" ? -0.4 : 0) + spread(s, "eye-x", 0.3),
    hairline: 12.5 + ({ low: -1.5, average: 0, high: 1.8, "widows-peak": 0 }[face.hairline] ?? 0) + (age > 55 && !female ? 2.5 : 0),
    shoulder: 20 + (strength - 50) * 0.07 + full * 2.2 + (a.height ?? 0) * 0.8 - (female ? 3 : 0) - old * 1.5 - (child ? 6 : 0),
    expression: EXPRESSIONS[Math.floor(roll(s, "expression") * EXPRESSIONS.length)],
    iris: irises[Math.floor(roll(s, "iris") * irises.length)],
  };
}

// ---------------------------------------------------------------- the bust as distance fields

const TAILORED = ["shirt", "coat"];
const BARE = ["none", "loincloth", "skirt"];
const HIDES_HAIR = ["hood", "headscarf", "veil", "wrap", "turban", "helmet", "wig"];

/** Fibonacci points on a unit sphere, for placing curls. */
const DIRS: V[] = Array.from({ length: 90 }, (_, i) => {
  const y = 1 - (2 * (i + 0.5)) / 90, r = Math.sqrt(1 - y * y), t = i * 2.39996;
  return [Math.cos(t) * r, y, Math.sin(t) * r];
});

/** Body-space point, head-space point: the head turns and nods on the neck while the body holds still. */
type Scene = (pb: V, ph: V) => Hit;

function build(m: Model): Scene {
  const a = m.a, n = m.nose, hw = a.wearing.headwear, style = a.hair, tex = m.face.hairTexture;
  const garment = a.wearing.garment;
  const curly = tex === "curly" || tex === "coiled" || style === "curls";
  const hidden = HIDES_HAIR.includes(hw);
  const hatted = !["none", "band", "fillet", "plume", "visor"].includes(hw);
  const nY = 1.5 - n.len; // nose tip height
  const mouthY = m.mouthY;

  const cranium = (p: V) => ellipsoid(p, 0, 4.5, -1.5, m.headW, m.headH, m.headW + 1);
  const head = (p: V) => {
    let d = cranium(p);
    d = smin(d, ellipsoid(p, 0, -6, 2.5, m.jawW, 10.5, 10.5), 6);
    const cz = 6.3 + m.chinOut;
    d = smin(d, sphere(p, 0, m.chinY + m.chinR * 0.6, cz, m.chinR), 3.5);
    if (m.cleft) d = smax(d, -capsule(p, [0, m.chinY + m.chinR * 0.9, cz + m.chinR - 0.2], [0, m.chinY - 0.2, cz + m.chinR * 0.7], 0.5), 0.4);
    d = smin(d, sphere(p, -m.eyeX - 2.5, -2.5, 6.2, m.cheek), 4);
    d = smin(d, sphere(p, m.eyeX + 2.5, -2.5, 6.2, m.cheek), 4);
    d = smin(d, capsule(p, [-7.5, 5.2, 9.2], [7.5, 5.2, 9.2], m.ridge), 3);

    d = smax(d, -sphere(p, -m.eyeX, 1.8, 13.2, 3.1), 1.6);
    d = smax(d, -sphere(p, m.eyeX, 1.8, 13.2, 3.1), 1.6);
    // Nose: bridge, tip and wings.
    const top: V = [0, 3.5, 11.6], tip: V = [0, nY + n.droop * -0.4, 12.4 + n.out];
    const mid: V = [0, (top[1] + tip[1]) / 2 + 0.3, (top[2] + tip[2]) / 2 + n.hump * 0.9];
    let nose = Math.min(capsule(p, top, mid, 1.1 * n.wide), capsule(p, mid, tip, 1.25 * n.wide));
    nose = smin(nose, sphere(p, tip[0], tip[1] - 0.2, tip[2] - 0.6, n.tip), 1.2);
    const wing = 1.3 + n.wide * 0.35;
    nose = smin(nose, sphere(p, -1.8 * n.wide, nY - 0.4, 11.2 + n.out * 0.4, wing), 1);
    nose = smin(nose, sphere(p, 1.8 * n.wide, nY - 0.4, 11.2 + n.out * 0.4, wing), 1);
    d = smin(d, nose, 1.3);
    // Ears.
    const ear = 4.6 + m.old * 0.8;
    d = smin(d, ellipsoid(p, -m.headW + 0.4, -m.old * 0.6, -0.5, 1.6, ear, 3), 1.2);
    d = smin(d, ellipsoid(p, m.headW - 0.4, -m.old * 0.6, -0.5, 1.6, ear, 3), 1.2);

    return d;
  };
  const lips = (p: V) => {
    const w = m.mouthW / 2;
    // Both lips meet at the parting line: the upper sits just above it, the lower just below, neither hanging off it.
    const up = ellipsoid(p, 0, mouthY + 0.6 * m.upper, 11.3, w, m.upper * 0.9, 2);
    const lo = ellipsoid(p, 0, mouthY - 0.55 * m.lower, 11.1, w * 0.84, m.lower * 0.82, 2.1);
    return Math.min(up, lo);
  };
  const neck = (p: V) => capsule(p, [0, -10, -2], [0, -30, -2 - m.old * 1.5], m.neck);
  const torso = (q: V) => {
    const s = m.shoulder;
    // Age rounds the upper back: the shoulders ride up and forward toward the head.
    const p: V = [q[0], q[1] - m.old * 1.8, q[2] + m.old * 1.2];
    // Shoulders slope from the neck, then the chest falls away out of frame.
    let d = capsule(p, [-s, -35, -3], [-5, -28, -2.5], 6);
    d = smin(d, capsule(p, [s, -35, -3], [5, -28, -2.5], 6), 5);
    d = smin(d, ellipsoid(p, 0, -52, -2, s + 5, 20, 11), 7);
    d = smin(d, capsule(p, [-s - 1, -33, -3], [-s - 3, -62, -1], 6), 2.5);
    d = smin(d, capsule(p, [s + 1, -33, -3], [s + 3, -62, -1], 6), 2.5);
    return smin(d, neck(p), 3.5);
  };

  // Hair: a shell over the cranium masked by the hairline, then the style's own masses.
  const hairMask = (p: V) => p[1] - (m.hairline - clamp((3 - p[2]) * 0.9, 0, 26) - (Math.abs(p[0]) > m.headW - 3.5 ? 6 : 0) + Math.abs(Math.sin(p[0] * 0.9 + 1)) * 1.1);
  const hairShell = (p: V, t: number) => smax(cranium(p) - t - Math.max(0, p[1] - m.hairline + 2) * 0.12, -hairMask(p), 1);
  const hair = (p: V): number => {
    if (style === "bald" || hidden) return 99;
    const tall = hatted ? 0.7 : 1;
    let d = hairShell(p, m.female && style === "original" ? 1.7 : { cropped: 1.3, original: 2.8, curls: 3.4, bob: 3, long: 2.6, braid: 1.4, topknot: 1.4 }[style] ?? 2.4);
    // A parting on the near side of the crown.
    if (!curly && style !== "cropped" && p[2] > -4 && d < 2) d += 0.7 * Math.exp(-((p[0] + 3.5) ** 2));
    if (tex === "coiled" && (style === "original" || style === "curls")) d = Math.min(d, smax(ellipsoid(p, 0, 7 * tall, -2, m.headW + 4, m.headH + 2 * tall, m.headW + 5), -hairMask(p), 1));
    if (!hatted && (style === "original" || style === "bob"))
      d = smin(d, ellipsoid(p, -3, m.hairline + 1.5, 10.5, 9, 3, 3.5), 2);
    if (style === "bob") {
      // Falls past the ears to the jaw, framing the face, with a fringe.
      d = smin(d, smax(smax(ellipsoid(p, 0, 1, -1.5, m.headW + 3, 17.5, m.headW + 3.2), p[2] - 7 + Math.max(0, -p[1] - 4) * 0.2, 1.5), -(p[1] - m.chinY - 3), 1), 2);
      if (!hatted) d = smin(d, ellipsoid(p, -1.5, m.hairline + 0.5, 11, 10, 3.2, 3.5), 1.5);
    }
    if (m.female && (style === "long" || style === "braid"))
      d = smin(d, smax(ellipsoid(p, 0, 3, -2, m.headW + 2.4, m.headH + 2, m.headW + 2.6), p[2] - 5, 1.5), 2);
    if (style === "long") {
      d = Math.min(d, smax(ellipsoid(p, 0, -12, -7, m.headW + 2, 32, m.headW - 1), p[2] + 3 - Math.max(0, Math.abs(p[0]) - 6) * 0.9, 2));
      d = smin(d, capsule(p, [-m.headW + 0.5, -2, 1], [-m.headW - 2.5, -40, 3], 2.6), 2);
    }
    if (style === "braid") for (let k = 0; k < 8; k++) d = Math.min(d, sphere(p, -m.headW + 0.5 - k * 0.35, -5 - k * 3.6, 3.5, 2.1 - k * 0.08));
    // Buns sit at the back: a topknot high on the crown, a woman's gathered hair low at the nape.
    if (style === "topknot") d = smin(d, sphere(p, 0, m.headH + 3.5, -7, 4.6), 1.2);
    if (style === "original" && m.female) d = smin(d, sphere(p, 0, -1, -15.5, 4.8), 1.5);
    if (curly && d < 5) {
      const big = style === "curls" || tex === "curly" ? 2.4 : 1.7;
      for (const dir of DIRS) {
        const c: V = [dir[0] * (m.headW + 1.5), 4.5 + dir[1] * (m.headH + 1.5), -1.5 + dir[2] * (m.headW + 2.5)];
        if (hairMask(c) < -1 || (style === "curls" ? false : dir[1] < -0.3)) continue;
        d = smin(d, sphere(p, c[0], c[1], c[2], big), 0.6);
      }
    } else if (!curly) {
      // Strands: shallow grooves radiating from the crown.
      const ang = Math.atan2(p[0], p[2] + 3);
      if (d < 2) d += (style === "cropped" ? 0.3 : 0.6) * Math.abs(Math.sin(ang * 7 + (tex === "wavy" ? Math.sin(p[1] * 0.5) * 1.8 : p[1] * 0.06)));
    }
    return d;
  };

  const beard = (p: V): number => {
    const b = a.beard;
    if (b === "none" || b === "stubble" || m.child) return 99;
    const jaw = head(p);
    const below = p[1] - (mouthY + 1.4 + clamp(Math.abs(p[0]) - m.mouthW / 2, 0, 9) * 0.95 - Math.max(0, p[2] - 9) * 0.6);
    const mouthHole = ellipsoid(p, 0, mouthY - 0.3, 11.5, m.mouthW / 2 + 0.6, 1.4, 4);
    let d = 99;
    const shell = (t: number) => smax(smax(jaw - t, below, 1), -mouthHole, 0.6);
    switch (b) {
      case "short": d = smax(shell(1.8), -p[2] - 6, 1); break;
      case "long": d = smin(smax(shell(2.2), -p[2] - 6, 1), ellipsoid(p, 0, m.chinY - 5, 6.5, 7, 9, 5.5), 3); break;
      case "forked": d = smin(smax(shell(2.2), -p[2] - 6, 1), Math.min(ellipsoid(p, -2.8, m.chinY - 5, 7, 3.4, 8, 4), ellipsoid(p, 2.8, m.chinY - 5, 7, 3.4, 8, 4)), 2.5); break;
      case "goatee": d = smax(shell(2), Math.abs(p[0]) - 3.6, 1); break;
      case "sideburns": d = smax(smax(jaw - 1.3, Math.abs(p[0]) > 0 ? m.headW - 5 - Math.abs(p[0]) : 0, 1), -p[1] - 8, 1); break;
      case "chinstrap": d = smax(shell(1.2), smax(-(jaw + 0.2) + 0 * p[1], p[1] - m.chinY - 3.5 + clamp(-p[2] + 6, 0, 8) * -0.9, 1), 1); break;
    }
    if (b !== "sideburns" && b !== "chinstrap") {
      const w = m.mouthW / 2 + 0.8;
      d = Math.min(d, capsule(p, [-w, mouthY + 1.2, 11.2], [w, mouthY + 1.2, 11.2], 1.25));
      if (b === "handlebar") {
        d = Math.min(d, capsule(p, [-w, mouthY + 1.2, 11.2], [-w - 1.8, mouthY + 3, 10.4], 0.8));
        d = Math.min(d, capsule(p, [w, mouthY + 1.2, 11.2], [w + 1.8, mouthY + 3, 10.4], 0.8));
      }
    }
    if (d > 3) return d;
    // Locks falling from the jaw: grooves that run down and in toward the chin.
    return d + (tex === "curly" || tex === "coiled" ? 0.32 : 0.22) * Math.sin(p[0] * 1.5 + Math.sin(p[1] * 0.45) * (tex === "wavy" || tex === "curly" ? 1.6 : 0.4));
  };

  // Clothing: a shell over the torso, opened at the neck to the garment's cut, over an under-layer where one shows.
  const mat = a.wearing.material ?? "wool";
  const thick = ["fur", "hide", "felt"].includes(mat) ? 1.5 : mat === "silk" ? 0.8 : 1.05;
  const collar = (p: V) => p[1] + 25 - Math.abs(p[0]) * 0.5;
  const vee = (p: V, depth: number, slope: number, off = 0) => Math.max(-28 - depth + slope * Math.abs(p[0] - off) - p[1], -2 - p[2]);
  const round = (p: V) => ellipsoid(p, 0, -27.5, 6.5, 7, 4, 7);
  /** The neck opening: negative inside it. */
  const cut = (p: V): number => {
    switch (garment) {
      case "shirt": return vee(p, 4, 1.4);
      case "coat": return vee(p, 15, 0.95);
      case "robe": return vee(p, 13, 1.25, 2.5);
      case "open-robe": return Math.min(round(p), Math.max(Math.abs(p[0]) - 4.5, -2 - p[2]));
      case "dress": return ellipsoid(p, 0, -28, 7, 10, 5.5, 7);
      case "gown": return Math.max(Math.abs(p[0]) - 11, -(p[1] + 31.5), -2 - p[2]);
      case "poncho": return ellipsoid(p, 0, -27.5, 5, 6, 3, 7);
      case "suit": return ellipsoid(p, 0, -25, 2, 6.2, 2.4, 9);
      default:
        return a.wearing.motif === "placket" ? Math.min(round(p), Math.max(Math.abs(p[0]) - 0.9, -(p[1] + 36), -2 - p[2])) : round(p);
    }
  };
  const cloth = (p: V): number => {
    if (BARE.includes(garment) || d0(p) > 6) return 99;
    let d = smax(torso(p) - thick, collar(p), 1);
    if (garment === "wrap") {
      // Draped from the near shoulder across the chest; the far shoulder stays bare.
      d = smax(d, p[1] + 24 + (p[0] + 6) * 0.85, 1);
      if (d < 1.5) d += 0.35 * Math.sin((p[0] * 0.85 - p[1]) * 0.9);
      return d;
    }
    d = smax(d, -cut(p), 0.5);
    if (a.wearing.sleeves === "none") d = smax(d, Math.abs(p[0]) - (m.shoulder - 3), 1);
    if (garment === "gown") d = smin(d, Math.min(sphere(p, -m.shoulder + 2, -30, -2, 5), sphere(p, m.shoulder - 2, -30, -2, 5)), 2);
    if (garment === "poncho") d = smin(d, smax(ellipsoid(p, 0, -34, -2, m.shoulder + 9, 8, 12), collar(p) - 1, 1), 3);
    if (garment === "coat") {
      // Lapels: the cloth rolls back along the opening.
      const e = -cut(p);
      if (e > 0 && e < 3) d -= 0.7 * (1 - e / 3);
    }
    if (d < 1.5) {
      const r = Math.hypot(p[0], p[1] + 26);
      if (r > 8) d += (mat === "silk" ? 0.45 : 0.3) * Math.sin(Math.atan2(p[0], -(p[1] + 26)) * 9 + r * 0.15) * clamp((r - 8) / 8, 0, 1);
      if (mat === "fur" && -cut(p) < 2.5) d -= 0.5 * Math.abs(Math.sin(p[0] * 2.2) * Math.sin(p[1] * 2.2));
    }
    return d;
  };
  const d0 = (p: V) => torso(p);
  /** What shows inside the opening: a white shirt under a coat, an inner robe's collar, an open robe's inner garment. */
  const under = (p: V): number => {
    if (!["coat", "robe", "open-robe"].includes(garment)) return 99;
    let d = smax(torso(p) - thick * 0.6, collar(p) + 0.5, 1);
    if (garment === "robe") d = smax(d, -(cut(p) + 2.2), 0.4);
    d = smax(d, -round(p) + (garment === "robe" ? 0 : 1.5), 0.5);
    if (garment === "coat") {
      // Shirt collar points either side of the knot.
      d = Math.min(d, capsule(p, [-4.5, -25.5, 5.5], [-1.8, -29.5, 8.4], 1), capsule(p, [4.5, -25.5, 5.5], [1.8, -29.5, 8.4], 1));
    }
    return d;
  };
  const shirtCollar = (p: V): number =>
    garment === "shirt" ? Math.min(capsule(p, [-5, -25.5, 5], [-2.2, -30, 8.2], 1.15), capsule(p, [5, -25.5, 5], [2.2, -30, 8.2], 1.15)) : 99;
  const tie = (p: V): number =>
    garment === "coat" ? Math.min(capsule(p, [0, -28.3, 8.4], [0, -29.6, 8.7], 1.3), capsule(p, [0, -30, 8.7], [0.4, -46, 11], 1.3)) : 99;
  const cape = (p: V): number => {
    if (!a.wearing.mantle && !a.wearing.cloak) return 99;
    let d = smax(torso(p) - thick - 1.3, collar(p) - (a.wearing.cloak ? 3 : 0.5), 1);
    d = smax(d, -(p[1] + 42 - Math.sin(p[0] * 0.5) * 1.2), 1);
    d = smax(d, -Math.max(Math.abs(p[0]) - 3.5, -2 - p[2]), 0.5);
    return d < 1.5 ? d + 0.3 * Math.sin(p[0] * 0.7) : d;
  };
  const skinExtra = (p: V): number => {
    if (!BARE.includes(garment) && garment !== "wrap") return 99;
    // Collarbones, and a chest that follows strength.
    let d = Math.min(capsule(p, [-2, -28.5, 5.2], [-11, -27, 2.5], 0.6), capsule(p, [2, -28.5, 5.2], [11, -27, 2.5], 0.6));
    if (!m.female && !m.child) {
      const k = clamp(((a.physique?.strength ?? 50) - 40) / 50, 0, 1);
      if (k > 0) d = smin(d, ellipsoid(p, 0, -37, 5.2, 10, 4, 1 + k * 0.6), 3);
    }
    return d;
  };

  const hat = (p: V): number => {
    const T = m.headH + 1;
    const W = m.headW;
    switch (hw) {
      case "brimmed": {
        const brim = m.hairline - 0.5, top = brim + 10;
        // Crown narrowing to a creased top, pinched at the front; brim turned up at the sides.
        const crown = ellipsoid(p, 0, brim + 4.5, -1.5, W - 0.2 - (p[1] - brim) * 0.08, 6.5, W + 0.6);
        let d = smax(crown, p[1] - top + Math.exp(-(p[0] ** 2) / 6) * 1.6 + Math.exp(-((p[2] - W) ** 2) / 6) * 1.2, 1);
        d = smax(d, brim - p[1], 0.5);
        return Math.min(d, cylinder(p, 0, brim + Math.abs(p[0]) * 0.07 - Math.max(0, p[2]) * 0.06, -1.5, W + 7.5, 0.55) - 0.25);
      }
      case "bowler": return Math.min(smax(sphere(p, 0, T - 3, -1.5, W + 0.5), -(p[1] - (T - 4)), 1), torus(p, 0, T - 4, -1.5, W + 2.4, 1.1));
      case "top-hat": {
        const brim = m.hairline - 0.5;
        return Math.min(cylinder(p, 0, brim + 9, -1.5, W - 0.5 + (p[1] - brim) * 0.03, 9) - 0.5, cylinder(p, 0, brim + Math.abs(p[0]) * 0.1, -1.5, W + 4.5, 0.5) - 0.25);
      }
      case "flat-cap": return Math.min(ellipsoid(p, 0, T - 2, 1, W + 1.8, 5.2, W + 3.4), smax(ellipsoid(p, 0, T - 5, 11, 8, 1.2, 7), -p[2] + 6, 1));
      case "ball-cap": return Math.min(smax(sphere(p, 0, T - 5, -1.5, W + 1), -(p[1] - (T - 5)), 1), smax(ellipsoid(p, 0, T - 5.2, 12, 8.5, 0.9, 9), -p[2] + 6, 1));
      case "conical": {
        const apex = T + 11, base = T - 4, h = apex - p[1];
        const side = (Math.hypot(p[0], p[2] + 1.5) - h * ((W + 11) / (apex - base))) * 0.55;
        return Math.max(side, -h, base - 1 - p[1]);
      }
      case "fez": return cylinder(p, 0, T - 1, -1.5, W - 3 - (p[1] - T + 1) * 0.15, 5) - 0.5;
      // A coif over the crown, set back from the hairline so the hair shows beneath it.
      case "cap": return smax(cranium(p) - 3.6, -(p[1] - m.hairline - 2.5 + clamp((3 - p[2]) * 0.5, 0, 9)), 1);
      case "helmet": return Math.min(smax(cranium(p) - 1.8, -(p[1] - m.hairline + 1.5), 1), capsule(p, [0, m.hairline, 13.5], [0, -4, 15.5], 0.9));
      case "hood": case "headscarf": case "veil": {
        const shell = smax(Math.min(ellipsoid(p, 0, 2, -2, W + 3.2, m.headH + 5, W + 3.6), capsule(p, [0, -20, -4], [0, hw === "veil" ? -50 : -38, -6], hw === "hood" ? 15 : 12)), -ellipsoid(p, 0, -4, 12, W - 3.5, m.headH - 2, 10), 1.5);
        return smax(shell, p[2] - 8.5, 1);
      }
      case "wrap": case "turban": {
        const big = hw === "turban" ? 2.6 : 1.2;
        let d = smax(ellipsoid(p, 0, m.hairline + 3 + big, -2, W + 1.5 + big, 9 + big * 1.5, W + 2.5 + big), -(p[1] - m.hairline + 1 + clamp((3 - p[2]) * 0.7, 0, 10)), 1.2);
        // Wound bands crossing the front on a slant.
        const slant = p[1] - m.hairline - (p[0] + 2) * 0.55;
        d += 0.55 * Math.abs(Math.sin(slant * 0.75));
        return d;
      }
      case "band": case "plume": return torus(p, 0, m.hairline + 1, -1.2, W + 0.2, 0.9, 1, 1.12);
      case "fillet": return torus(p, 0, m.hairline + 0.5, -1.2, W + 0.1, 0.5, 1, 1.12);
      case "wig": {
        let d = smax(cranium(p) - 3, -(p[1] - m.hairline + 1), 1);
        for (const y of [-2, 2, 6]) d = smin(d, capsule(p, [-W - 1, y, 6], [-W - 1, y, -6], 2.2), 1);
        return smin(d, capsule(p, [0, -6, -W - 2], [0, -20, -W - 3], 2), 2);
      }
      default: return 99;
    }
  };
  const hatBand = (p: V): number => {
    const T = m.headH + 1, W = m.headW;
    switch (hw) {
      case "brimmed": return smax(cylinder(p, 0, m.hairline + 1.4, -1.5, W + 0.1, 1.2) - 0.2, -(p[1] - m.hairline + 0.4), 0.3);
      case "top-hat": return cylinder(p, 0, m.hairline + 1.6, -1.5, W, 1.3) - 0.2;
      case "bowler": return cylinder(p, 0, T - 2.8, -1.5, W + 0.9, 1) - 0.2;
      case "fez": return capsule(p, [0, T + 4, -1.5], [3, T + 1, 6], 0.5);
      case "plume": return Math.min(ellipsoid(p, -4, m.hairline + 9, -4, 1.4, 8, 0.8), ellipsoid(p, -1, m.hairline + 10, -5, 1.4, 9, 0.8), ellipsoid(p, 2, m.hairline + 8.5, -5, 1.3, 7.5, 0.8));
      case "fillet": return sphere(p, 0, m.hairline + 0.5, 13.6, 1.1);
      default: return 99;
    }
  };
  const hatMat = (): Mat => (hw === "fillet" ? MAT.metal : ["band", "plume"].includes(hw) ? MAT.trim : HAT);
  const wigTones = hw === "wig";

  const earring = (p: V): number => {
    const ear = a.adornment?.ears ?? (a.wearing.earrings ? "drop" : "none");
    if (ear === "none" || ["hood", "headscarf", "veil", "wig"].includes(hw)) return 99;
    const x = -m.headW - 0.2, y = -4.8 - m.old * 1.2, z = 0.8;
    switch (ear) {
      case "hoop": return Math.hypot(Math.hypot(p[1] - y + 2, p[2] - z) - 2, p[0] - x) - 0.45;
      case "drop": return Math.min(sphere(p, x, y, z, 0.6), capsule(p, [x, y, z], [x, y - 2, z], 0.3), ellipsoid(p, x, y - 3.2, z, 0.8, 1.4, 0.8));
      // A disc set into a stretched lobe.
      case "spool": return cylinder([p[1], p[0], p[2]] as V, y - 0.5, x, z, 1.7, 0.5);
      // Rings climbing the rim of the ear.
      case "cuff": return Math.min(sphere(p, x + 0.2, 2.5, -1.5, 0.7), sphere(p, x + 0.2, 1, -2.2, 0.7));
      default: return sphere(p, x, y, z, 0.8);
    }
  };
  /** Bead index along the necklace, or -1. */
  const bead = (p: V): [number, number] => {
    if (!a.wearing.necklace || TAILORED.includes(garment)) return [99, -1];
    const chain = a.wearing.neckStyle === "chain";
    const n = chain ? 12 : 8;
    let best: [number, number] = [99, -1];
    for (let k = -n; k <= n; k++) {
      const t = k / n;
      const d = sphere(p, t * 7.5, -29.5 - (1 - t * t) * 3.6, 8.9 - t * t * 2.8, chain ? 0.5 : 0.85);
      if (d < best[0]) best = [d, k];
    }
    if (chain) {
      const d = ellipsoid(p, 0, -34.6, 9.4, 0.9, 1.3, 0.5);
      if (d < best[0]) best = [d, 0];
    }
    return best;
  };

  return (p: V, q: V): Hit => {
    // Lips are blended into the face, not stuck on it, so no seam runs down beside them.
    const hd = head(q), lp = lips(q);
    let best: Hit = [smin(hd, lp, 0.8), lp < hd + 0.05 ? LIP : MAT.skin];
    const take = (d: number, mat: number) => {
      if (d < best[0]) best = [d, mat];
    };
    take(smin(torso(p), skinExtra(p), 1.5), MAT.skin);
    take(hair(q), MAT.hair);
    take(beard(q), MAT.hair);
    const c = cloth(p);
    if (c < best[0]) best = [c, garmentMat(p)];
    take(under(p), garment === "coat" ? SHIRT : INNER);
    take(shirtCollar(p), MAT.cloth);
    take(tie(p), MAT.trim);
    take(cape(p), CLOAK);
    take(hat(q), wigTones ? MAT.hair : hatMat());
    take(hatBand(q), hw === "plume" ? HAT : MAT.trim);
    take(earring(q), MAT.metal);
    const [bd, k] = bead(p);
    take(bd, a.wearing.neckStyle === "chain" || k % 2 ? MAT.metal : MAT.trim);
    return best;
  };

  function garmentMat(p: V): number {
    const motif = a.wearing.motif ?? "auto";
    const edge = -cut(p);
    if (garment === "wrap") return Math.abs(p[1] + 24 + (p[0] + 6) * 0.85) < 1.4 ? MAT.trim : MAT.cloth;
    const trimmed = !["shirt", "coat", "suit"].includes(garment);
    const band = garment === "robe" || garment === "open-robe" ? 2.4 : 1.3;
    if (trimmed && edge < band) return motif === "stitch" && Math.sin(p[0] * 3 + p[1] * 3) > 0.3 ? MAT.cloth : MAT.trim;
    if (garment === "open-robe" && Math.abs(p[0]) < 7.5 && p[1] < -28) return MAT.trim;
    if (motif === "jersey" && (edge < 1.3 || (Math.abs(Math.abs(p[0]) - m.shoulder) < 1.2 && p[1] < -33))) return MAT.trim;
    switch (garment === "poncho" && motif === "auto" ? "stripes" : motif) {
      case "band": if (Math.abs(p[1] + 40) < 1 || Math.abs(p[1] + 44.5) < 1) return MAT.trim; break;
      case "yoke": if (p[1] > -34 + Math.sin(p[0] * 0.9) * 0.8) return MAT.trim; break;
      case "stripes": {
        const k = (p[1] + 30 + Math.abs(Math.sin(p[0] * 0.6)) * 1.2) / 3.2;
        const row = ((Math.floor(k) % 3) + 3) % 3;
        if (p[1] < -31 && k - Math.floor(k) < 0.55) return row === 0 ? MAT.trim : row === 1 ? INNER : MAT.cloth;
        break;
      }
      case "plaid": {
        const gx = ((p[0] % 5) + 5) % 5 < 0.9, gy = ((p[1] % 5) + 5) % 5 < 0.9;
        if (gx && gy) return INNER;
        if (gx || gy) return MAT.trim;
        break;
      }
    }
    return MAT.cloth;
  }
}

// ---------------------------------------------------------------- rendering

/** 1 is the resting three-quarter view, 0 faces the viewer. Pitch 1 is a nod's lowest point. */
export type HeadPose = { turn: number; pitch: number };
const PIVOT: V = [0, -12, -2];
const NOD = 0.22;

function frame({ turn, pitch }: HeadPose) {
  const c = Math.cos(YAW * turn), s = Math.sin(YAW * turn), a = pitch * NOD;
  const ca = Math.cos(a), sa = Math.sin(a);
  const tilt = ([x, y, z]: V, k: number): V => {
    const dy = y - PIVOT[1], dz = z - PIVOT[2];
    return [x, PIVOT[1] + dy * ca - dz * sa * k, PIVOT[2] + dy * sa * k + dz * ca];
  };
  return {
    body: (wx: number, wy: number, wz: number): V => [(wx * COS - wz * SIN) / SCALE, wy / SCALE, (wx * SIN + wz * COS) / SCALE],
    head: (wx: number, wy: number, wz: number): V => tilt([(wx * c - wz * s) / SCALE, wy / SCALE, (wx * s + wz * c) / SCALE], -1),
    /** Screen pixel of a head-space point, and its depth toward the viewer. */
    projectHead(p: V): [number, number, number] {
      const [x, y, z] = tilt(p, 1);
      return [Math.round(OX + (x * c + z * s) * SCALE - 0.5), Math.round(OY - y * SCALE - 0.5), (-x * s + z * c) * SCALE];
    },
    projectBody([x, y, z]: V): [number, number, number] {
      return [Math.round(OX + (x * COS + z * SIN) * SCALE - 0.5), Math.round(OY - y * SCALE - 0.5), (-x * SIN + z * COS) * SCALE];
    },
  };
}
type Frame = ReturnType<typeof frame>;

export type SculptedOptions = {
  /** 0 open, 1 half shut, 2 shut. */
  blink?: 0 | 1 | 2;
  /** Idle breathing: 1 lifts the chest and shoulders a pixel. */
  breath?: 0 | 1;
  /** 1 three-quarter (rest) to 0 facing the viewer; traced at quarter steps. */
  turn?: number;
  /** 0 level to 1 nodded down. */
  pitch?: number;
  /** Where the eyes look: x toward the viewer's right, y down. -1..1. */
  gazeX?: number;
  gazeY?: number;
  /** 0 shut, 1 parted, 2 open: the talking mouth. */
  mouth?: 0 | 1 | 2;
  expression?: Face;
  intensity?: number;
};

/** What the brows, lids and mouth are doing. */
type Mood = { inner: number; raise: number; open: number; heavy: boolean; corners: [number, number]; part: number; teeth: boolean; gazeY: number; flush: number };
const calm: Mood = { inner: 0, raise: 0, open: 0, heavy: false, corners: [0, 0], part: 0, teeth: false, gazeY: 0, flush: 0 };
const RESTING: Record<Expression, Partial<Mood>> = {
  calm: {},
  friendly: { corners: [1, 1] },
  stern: { inner: 1, corners: [-1, -1] },
  tired: { heavy: true },
  wary: { inner: -1, raise: 1, open: 1 },
  wry: { corners: [0, 1] },
};
const SHOWN: Record<Face, Partial<Mood>> = {
  neutral: {},
  smile: { corners: [1, 1] },
  happy: { corners: [1, 1], open: -1 },
  laugh: { corners: [1, 1], open: -1, part: 2, teeth: true },
  sad: { inner: -1, corners: [-1, -1], gazeY: 0.5 },
  // Brows down hard, lids narrowed, mouth pulled down and a flush in the face.
  angry: { inner: 2, open: -1, heavy: true, corners: [-1, -1], flush: 0.2 },
  stern: { inner: 1, corners: [-1, -1] },
  surprised: { raise: 2, open: 1, part: 1 },
  worried: { inner: -1, raise: 1, corners: [-1, 0] },
  thoughtful: { corners: [0, 1], gazeY: -0.6 },
  wry: { corners: [0, 1], inner: 0 },
  tired: { heavy: true, gazeY: 0.4 },
};
function moodFor(m: Model, face: Face, intensity: number): Mood {
  const rest = { ...calm, ...RESTING[m.expression] };
  if (face === "neutral" || intensity <= 0) return rest;
  const shown = { ...calm, ...SHOWN[face] };
  if (intensity >= 1) return shown;
  // Halfway: round the numbers toward the resting face.
  const half = (a: number, b: number) => Math.trunc((a + b) / 2);
  return {
    inner: half(rest.inner, shown.inner), raise: half(rest.raise, shown.raise), open: half(rest.open, shown.open),
    heavy: shown.heavy, corners: [half(rest.corners[0], shown.corners[0]), half(rest.corners[1], shown.corners[1])],
    part: half(rest.part, shown.part), teeth: false, gazeY: shown.gazeY / 2, flush: shown.flush / 2,
  };
}

export function drawSculptedPortrait(ctx: CanvasRenderingContext2D, appearance: CharacterAppearance, age = 30, options: SculptedOptions = {}) {
  ctx.clearRect(0, 0, SCULPTED_WIDTH, SCULPTED_HEIGHT);
  ctx.imageSmoothingEnabled = false;
  paintSculpted(appearance, age, options).blit(ctx);
}

type Base = { m: Model; f: Frame; color: string[]; mat: Uint8Array; layer: Uint16Array; depth: Float32Array };
const bases = new Map<string, Base>();

/** The lit bust is traced once per person and pose; blinks, mouths and breaths only repaint over a copy. */
export function paintSculpted(appearance: CharacterAppearance, age = 30, options: SculptedOptions = {}): Raster {
  const pose = { turn: Math.round(clamp(options.turn ?? 1, 0, 1) * 4) / 4, pitch: Math.round(clamp(options.pitch ?? 0, 0, 1) * 2) / 2 };
  const key = JSON.stringify([appearance, age, pose.turn, pose.pitch]);
  let base = bases.get(key);
  if (!base) {
    base = trace(appearance, age, pose);
    bases.set(key, base);
    if (bases.size > 96) bases.delete(bases.keys().next().value!);
  }
  const r = new Raster(SCULPTED_WIDTH, SCULPTED_HEIGHT);
  r.color.splice(0, r.color.length, ...base.color);
  r.mat.set(base.mat);
  r.layer.set(base.layer);
  features(r, base.depth, base.m, base.f, pose, options);
  if (options.breath) {
    // Everything below the chin rises a pixel; the head stays put.
    const { w } = r, from = OY + 20;
    for (let y = from - 1; y < r.h - 1; y++)
      for (let x = 0; x < w; x++) {
        const i = y * w + x, j = i + w;
        if (y === from - 1 && r.mat[i] && r.mat[i] !== MAT.cloth && r.mat[i] !== SHIRT && r.mat[i] !== INNER) continue;
        r.color[i] = r.color[j];
        r.mat[i] = r.mat[j];
      }
  }
  return r;
}

let tracer: Worker | undefined;
const tracing = new Map<string, [CharacterAppearance, number, HeadPose]>();
/** Trace the turn's in-between angles off the main thread: each is a few hundred
 * ms of sphere marching, which stalled the game even from an idle callback. */
export function warmSculpted(appearance: CharacterAppearance, age = 30) {
  if (!tracer) {
    tracer = new Worker(new URL("./sculpted-worker.ts", import.meta.url), { type: "module" });
    tracer.onmessage = ({ data: { key, color, mat, layer, depth } }) => {
      const job = tracing.get(key);
      tracing.delete(key);
      if (!job || bases.has(key)) return;
      bases.set(key, { m: model(job[0], job[1]), f: frame(job[2]), color, mat, layer, depth });
      if (bases.size > 96) bases.delete(bases.keys().next().value!);
    };
  }
  for (const turn of [0.75, 0.5, 0.25, 0]) {
    const key = JSON.stringify([appearance, age, turn, 0]);
    if (bases.has(key) || tracing.has(key)) continue;
    tracing.set(key, [appearance, age, { turn, pitch: 0 }]);
    tracer.postMessage({ key, appearance, age, pose: { turn, pitch: 0 } });
  }
}

export function trace(appearance: CharacterAppearance, age: number, pose: HeadPose): Base {
  const m = model(appearance, age);
  const scene = build(m);
  const f = frame(pose);
  const W = SCULPTED_WIDTH, H = SCULPTED_HEIGHT;
  const r = new Raster(W, H);
  const depth = new Float32Array(W * H).fill(-999);
  // Distances in screen units, so marching, normals and shadows all happen in one space.
  const at = (x: number, y: number, z: number) => scene(f.body(x, y, z), f.head(x, y, z));
  const d = (x: number, y: number, z: number) => at(x, y, z)[0] * SCALE;
  for (let py = 0; py < H; py++)
    for (let px = 0; px < W; px++) {
      const wx = px + 0.5 - OX, wy = OY - (py + 0.5);
      let wz = 45, hit: Hit | undefined;
      for (let k = 0; k < 100 && wz > -45; k++) {
        const h = at(wx, wy, wz);
        if (h[0] < 0.04) { hit = h; break; }
        wz -= Math.max(0.05, h[0] * SCALE * 0.85);
      }
      if (!hit) continue;
      const e = 0.28;
      const nm = norm([
        d(wx + e, wy, wz) - d(wx - e, wy, wz),
        d(wx, wy + e, wz) - d(wx, wy - e, wz),
        d(wx, wy, wz + e) - d(wx, wy, wz - e),
      ]);
      const diff = Math.max(0, nm[0] * LIGHT[0] + nm[1] * LIGHT[1] + nm[2] * LIGHT[2]);
      let ao = 1;
      for (let s = 1; s <= 3; s++) ao -= (s - d(wx + nm[0] * s, wy + nm[1] * s, wz + nm[2] * s)) * 0.08;
      let shadow = 1;
      for (let t = 0.9; t < 34; ) {
        const q = d(wx + nm[0] * 0.45 + LIGHT[0] * t, wy + nm[1] * 0.45 + LIGHT[1] * t, wz + nm[2] * 0.45 + LIGHT[2] * t);
        if (q < 0.05) { shadow = 0.35; break; }
        shadow = Math.min(shadow, 0.35 + 0.65 * clamp((6 * q) / t, 0, 1));
        t += Math.max(0.34, q);
      }
      const gloss = hit[1] === MAT.cloth && m.a.wearing.material === "silk" ? 1.15 : 1;
      const v = clamp((0.28 + 0.8 * diff * shadow) * clamp(ao, 0.45, 1) * gloss, 0, 1.2);
      const ramp = m.ramps[hit[1]];
      const tone = v < 0.3 ? ramp.deep : v < 0.47 ? ramp.shade : v < 0.7 ? ramp.base : v < 0.92 || hit[1] === MAT.skin ? ramp.light : ramp.high;
      const i = py * W + px;
      r.color[i] = tone;
      r.mat[i] = hit[1];
      // Nearer pixels take a higher layer, so the contour lands on the front form.
      r.layer[i] = Math.round((wz + 50) * 20);
      depth[i] = wz;
    }

  folds(r, depth, m);
  // Lips and skin are one surface to the outline; without this the cheek, being nearer, is outlined against the lip corner.
  const lips = [];
  for (let i = 0; i < W * H; i++) if (r.mat[i] === LIP) { lips.push(i); r.mat[i] = MAT.skin; }
  r.contour({ ...m.ramps, [MAT.skin]: { edge: m.skin.edge, deep: m.skin.edge }, [LIP]: { edge: m.ramps[LIP].base, deep: m.ramps[LIP].shade } } as unknown as Record<Mat, { edge: string; deep: string }>);
  for (const i of lips) r.mat[i] = LIP;
  rim(r);
  return { m, f, color: r.color, mat: r.mat, layer: r.layer, depth };
}

/** Where one form passes in front of another of the same material (jaw over neck, nose over cheek), a line. */
function folds(r: Raster, depth: Float32Array, m: Model) {
  const { w, h } = r;
  const out: [number, string][] = [];
  for (let i = w; i < w * h - w; i++) {
    const mat = r.mat[i];
    if (!mat) continue;
    for (const j of [i + 1, i - 1, i + w, i - w])
      if (r.mat[j] === mat && depth[i] - depth[j] > 3.5) {
        out.push([i, m.ramps[mat] ? mix(m.ramps[mat].shade, m.ramps[mat].edge, 0.5) : r.color[i]]);
        break;
      }
  }
  for (const [i, c] of out) r.color[i] = c;
}

function rim(r: Raster) {
  const { w, h } = r;
  const out = r.color.slice();
  for (let y = 0; y < h; y++)
    for (let x = 1; x < w - 2; x++) {
      const i = y * w + x, m = r.mat[i];
      if (!m || m === MAT.metal || r.mat[i + 2] || !r.mat[i + 1] || r.mat[i - 1] !== m) continue;
      out[i] = mix(r.color[i], "#8fa4e0", 0.3);
    }
  for (let i = 0; i < w * h; i++) r.color[i] = out[i];
}

// ---------------------------------------------------------------- painted features

function features(r: Raster, depth: Float32Array, m: Model, fr: Frame, pose: HeadPose, o: SculptedOptions) {
  const s = m.skin, f = m.face;
  const blink = o.blink ?? 0;
  const mood = moodFor(m, o.expression ?? "neutral", o.intensity ?? 1);
  const gazeY = clamp((o.gazeY ?? 0) + mood.gazeY, -1, 1);
  const visible = (p: V) => {
    const [x, y, z] = fr.projectHead(p);
    return r.inside(x, y) && depth[y * r.w + x] - z < 1.8 ? [x, y] as const : undefined;
  };
  const onFace = (p: V) => {
    const [x, y] = fr.projectHead(p);
    return [MAT.skin, LIP].includes(r.matAt(x, y)) ? [x, y] as const : undefined;
  };
  const put = (x: number, y: number, c: string, only: number[] = [MAT.skin, LIP]) => {
    if (only.includes(r.matAt(x, y))) r.put(x, y, c);
  };
  const line = (x0: number, y0: number, x1: number, y1: number, c: string) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let k = 0; k <= n; k++) put(Math.round(x0 + ((x1 - x0) * k) / n), Math.round(y0 + ((y1 - y0) * k) / n), c, [MAT.skin]);
  };
  const lash = mix(s.edge, "#140c10", 0.6);
  const crease = mix(s.base, s.shade, 0.75);
  const fold = mix(s.base, s.shade, 0.6);
  const white = "#f1e8dc";
  const size = m.child || f.eyeSize === "large" ? 1 : f.eyeSize === "small" ? -1 : 0;
  // Rows of visible eye: never a slit, more for large, wary or young eyes.
  const open = clamp(2 + (size > 0 || (m.female && size === 0 && roll(m, "doe") > 0.4) ? 1 : 0) + (m.child ? 1 : 0) - (f.eyeShape === "narrow" && size < 0 ? 1 : 0) + mood.open, 2, 4);
  const tilt = f.eyeShape === "almond" ? 1 : f.eyeShape === "round" ? 0 : roll(m, "eye-tilt") < 0.3 ? -1 : 0;
  const rec = m.a.record ?? {};
  const heavy = f.eyelid === "monolid" || mood.heavy || !!rec.tired || m.old > 0.6 || gazeY > 0.3;
  const creased = !heavy && f.eyelid !== "low-crease";
  // Eye traits run in families: iris size, how the iris is marked, the lashes and the weight of the lid line.
  const irisW = trait(m, "iris-size") > (m.child ? 0.35 : 0.62) ? 3 : 2;
  const rimmed = trait(m, "iris-rim") > 0.5;
  const lashRoll = trait(m, "lash-style") * 0.8 + (m.female ? 0.35 : 0);
  // 0 none, 1 a flick at the corner, 2 a defined upper line, 3 full, with a lower line.
  const lashStyle = lashRoll > 0.95 ? 3 : lashRoll > 0.7 ? 2 : lashRoll > 0.45 ? 1 : 0;
  const lidWeight = trait(m, "lid-line") > 0.7;

  const brows = (near: boolean, x0: number, w: number, y0: number) => {
    const brow = mix(m.hair.edge, m.hair.shade, 0.25);
    const thick = m.female ? (f.brows === "heavy" ? 2 : 1) : f.brows === "heavy" ? 3 : roll(m, "brow-thick") > 0.2 ? 2 : 1;
    const arch = f.brows === "arched" || m.female ? 1 : 0;
    // A clear band of lid and brow bone between eye and brow; women's sit higher still.
    const by = y0 - 4 - mood.raise - (creased ? 1 : 0) - (m.female ? 1 : 0) - thick + 1;
    const bw = w + 1;
    for (let k = 0; k < bw; k++) {
      // t runs from the outer end (0) to the inner end (1).
      const t = near ? k / (bw - 1) : 1 - k / (bw - 1);
      const x = (near ? x0 - 1 : x0) + k;
      const y = by + Math.round(t * mood.inner) - (arch && t > 0.2 && t < 0.7 ? 1 : 0);
      for (let j = 0; j < thick; j++) if (!(j && (t < 0.1 || t > 0.9))) put(x, y + j, brow, [MAT.skin, MAT.hair]);
    }
  };

  for (const side of [-1, 1]) {
    const c = visible([side * m.eyeX, 1.8, 11.2]);
    if (!c) continue;
    const near = side < 0;
    // Width from the projected corners, so it narrows as the eye turns away and evens out face-on.
    const inner = fr.projectHead([side * (m.eyeX - 2.4), 1.8, 11.8]), outerP = fr.projectHead([side * (m.eyeX + 2.6), 1.8, 10.2]);
    const w = clamp(Math.abs(outerP[0] - inner[0]) + 1 + (size > 0 ? 1 : 0), 3, 7);
    const x0 = c[0] - Math.floor(w / 2), y0 = c[1] - 1;
    const outer = near ? x0 : x0 + w - 1;
    const lift = (x: number) => (x === outer ? tilt : 0);
    if (blink === 2) {
      for (let k = 0; k < w; k++) {
        const x = x0 + k;
        for (let j = -1; j < open; j++) r.put(x, y0 + j - lift(x), mix(s.base, s.shade, 0.35));
        r.put(x, y0 + open - 1 - lift(x) + (k === 0 || k === w - 1 ? 0 : 1), lash);
      }
      brows(near, x0, w, y0 + 1);
      continue;
    }
    const shut = blink === 1 ? open - 1 : 0;
    for (let k = 0; k < w; k++) {
      const x = x0 + k;
      for (let j = 0; j < open; j++) r.put(x, y0 + j - lift(x), j < shut ? mix(s.base, s.shade, 0.35) : white);
      if (k === 0 || k === w - 1) r.put(x, y0 + open - 1 - lift(x), mix(white, s.shade, 0.5));
      r.put(x, y0 - 1 - lift(x) + shut, lash);
      if (heavy) r.put(x, y0 - lift(x) + shut, mix(s.shade, s.edge, 0.3));
      if (creased && k > 0 && k < w - 1) put(x, y0 - 2 - lift(x), crease);
      r.put(x, y0 + open - (x === outer ? Math.max(0, lift(x)) : 0), mix(s.base, s.shade, 0.55));
    }
    // Irises: toward the nose in three-quarter, centred face-on (looking at the viewer), then the glance.
    // A narrow far eye cannot hold a wide iris.
    const iw = Math.min(irisW, w - 1);
    const turned = near ? x0 + w - iw - 1 : x0 + 1, centred = x0 + Math.round((w - iw) / 2);
    const ix = clamp(Math.round(centred + (turned - centred) * pose.turn + (o.gazeX ?? 0) * 1.5), x0, x0 + w - iw);
    const top = heavy ? 1 : 0;
    const from = gazeY < -0.3 ? 0 : top;
    const rim = mix(m.iris, "#080406", 0.45);
    for (let j = Math.max(shut, from); j < open; j++) {
      const low = gazeY > 0.3 && j === Math.max(shut, from);
      for (let k = 0; k < iw; k++) {
        const edge = k === 0 || k === iw - 1;
        // The pupil is the second column; a wide iris gets a darker rim and a lighter lower ring.
        const pupil = k === 1 && j < open - 1;
        const c = low ? mix(s.shade, s.edge, 0.3)
          : pupil ? mix(m.iris, "#080406", 0.75)
          : rimmed && edge && iw === 3 ? rim
          : j === open - 1 ? mix(m.iris, "#ffffff", iw === 3 ? 0.28 : 0.15)
          : m.iris;
        r.put(ix + k, y0 + j, c);
      }
    }
    if (!shut && gazeY <= 0.3) {
      r.put(ix, y0 + from, "#ffffff");
      if (iw === 3 && open > 2) r.put(ix + 2, y0 + open - 1, mix(m.iris, "#ffffff", 0.55));
    }
    if (lidWeight || lashStyle >= 2)
      for (let k = near ? 0 : 1; k < w - (near ? 1 : 0); k++) r.put(x0 + k, y0 - 1 - lift(x0 + k) + shut, mix(lash, "#000000", 0.3));
    if (lashStyle >= 1) r.put(near ? x0 - 1 : x0 + w, y0 - 1 - tilt, lash);
    if (lashStyle >= 2) {
      r.put(near ? x0 - 2 : x0 + w + 1, y0 - 2 - tilt, lash);
      for (let k = 0; k < w; k += 2) r.put(x0 + k + (near ? 0 : 1), y0 - 2 - lift(x0 + k) + shut, mix(lash, s.shade, 0.35));
    }
    if (lashStyle === 3) {
      for (let k = 1; k < w - 1; k++) put(x0 + k, y0 + open, mix(lash, s.shade, 0.5), [MAT.skin]);
      r.put(near ? x0 - 1 : x0 + w, y0 - 2 - tilt, lash);
    }
    brows(near, x0, w, y0);
    if (m.age > 42 || rec.sun === 2) put(near ? x0 - 2 : x0 + w + 1, y0 + 1, fold, [MAT.skin]);
    if (m.age > 50) put(near ? x0 - 2 : x0 + w + 1, y0 + 3, fold, [MAT.skin]);
    if (m.age > 55 || mood.heavy || rec.tired || rec.gaunt === 2)
      for (let k = 1; k < w - 1; k++) put(x0 + k, y0 + open + 2, rec.tired || rec.gaunt === 2 ? mix(s.shade, "#4a3450", 0.25) : fold, [MAT.skin]);
  }

  // The shadow the nose throws under itself, which is what makes it read as a nose.
  const base = onFace([0.4, 0.6 - m.nose.len, 11.6 + m.nose.out * 0.3]);
  if (base) for (let dx = -2; dx <= 1; dx++) put(base[0] + dx, base[1] + 1, mix(s.shade, s.edge, dx === -1 || dx === 0 ? 0.35 : 0.1), [MAT.skin]);
  const nostril = visible([-1.2 * m.nose.wide, 1.1 - m.nose.len, 12.2 + m.nose.out * 0.5]);
  if (nostril) {
    put(nostril[0], nostril[1], mix(s.edge, "#140c10", 0.3));
    for (let k = 1; k < Math.round(m.nose.wide * 1.3); k++) put(nostril[0] - k, nostril[1] - (k > 1 ? 1 : 0), mix(s.shade, s.edge, 0.4));
  }
  const far = visible([1.2 * m.nose.wide, 1.1 - m.nose.len, 12.2 + m.nose.out * 0.5]);
  if (far && (m.nose.wide > 1.4 || pose.turn < 0.5)) put(far[0], far[1], mix(s.shade, s.edge, 0.3));

  // Mouth: a soft parting line the width of the lips, opening for speech; corners lift only a pixel.
  const mouthY = m.mouthY;
  const left = onFace([-m.mouthW / 2, mouthY, 11]), right = onFace([m.mouthW / 2, mouthY, 11]), mid = onFace([0, mouthY, 12]);
  if (left && right && mid) {
    const parting = mix(m.ramps[LIP].deep, s.edge, 0.35);
    const [lc, rc] = mood.corners;
    const part = Math.max(mood.part, o.mouth ?? 0);
    for (let x = left[0]; x <= right[0]; x++) put(x, mid[1], parting);
    put(left[0] - 1, mid[1] - lc, mix(s.base, s.shade, 0.7));
    put(right[0] + 1, mid[1] - rc, mix(s.base, s.shade, 0.7));
    if (part) {
      const inside = mix(m.ramps[LIP].deep, "#1a0a10", 0.55);
      for (let x = left[0] + 1; x <= right[0] - 1; x++) {
        const edge = x === left[0] + 1 || x === right[0] - 1;
        for (let j = 1; j <= part; j++) put(x, mid[1] + j, j === 1 && (part > 1 || mood.teeth) && !edge ? "#f0e8dc" : inside, [LIP, MAT.skin]);
      }
      for (let x = left[0] + 1; x <= right[0] - 1; x++) put(x, mid[1] + part + 1, m.ramps[LIP].base, [LIP, MAT.skin]);
    } else {
      put(mid[0] - 1, mid[1] + 2, m.ramps[LIP].light, [LIP]);
      if (mood.teeth || (mood.corners[0] > 0 && roll(m, "teeth") < 0.3 && !m.old))
        for (let x = left[0] + 2; x <= right[0] - 2; x++) put(x, mid[1] + 1, "#f4ece0");
    }
    put(mid[0], mid[1] - Math.round(m.upper * 1.6) - 1, mix(s.base, s.shade, 0.5), [MAT.skin]);
    if (m.age > 40 && nostril) line(nostril[0] - 2, nostril[1] + 1, left[0] - 2, mid[1] + 1, m.age > 58 ? mix(s.shade, s.edge, 0.2) : fold);
    if (m.age > 62) {
      put(left[0] - 1, mid[1] + 2, fold, [MAT.skin]);
      put(right[0] + 1, mid[1] + 2, fold, [MAT.skin]);
      if (!part) for (const dx of [-2, 1]) put(mid[0] + dx, mid[1] - 1, mix(m.ramps[LIP].base, s.shade, 0.5), [LIP]);
    }
  }

  const brow = onFace([0, 8, 12.5]);
  if (brow)
    for (let k = 0; k < (m.age > 70 ? 3 : m.age > 55 ? 2 : m.age > 38 ? 1 : 0) + (mood.raise > 1 ? 1 : 0); k++)
      line(brow[0] - 7, brow[1] - k * 2, brow[0] + 4, brow[1] - k * 2 - 1, k ? fold : mix(s.base, s.shade, 0.5));
  if (mood.inner > 1 && brow) line(brow[0] - 1, brow[1] + 3, brow[0] - 1, brow[1] + 5, fold);
  if (m.age > 65)
    for (const [x, y] of [[-9, 6], [-2, 10], [8, 4]]) {
      const c = onFace([x, y, 11]);
      if (c) put(c[0], c[1], mix(s.base, s.edge, 0.25), [MAT.skin]);
    }

  accessories(r, m, put, visible, onFace);
  garmentDetail(r, m, fr.projectBody);
  bodyRecord(r, m, fr, put, onFace);

  const ruddy = rec.pale ? 0.02 : (m.child ? 0.32 : m.female ? 0.26 : roll(m, "ruddy") > 0.5 || m.old > 0.4 ? 0.2 : 0.08) + mood.flush + (rec.sun ?? 0) * 0.05;
  const blush = mix(s.base, "#e0485e", ruddy);
  const cheek = visible([-m.eyeX - 1.5, -4.5, 9.8]);
  if (cheek) for (const [dx, dy] of [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2], [2, 2]]) put(cheek[0] + dx, cheek[1] + dy, (dx + dy) % 3 === 0 ? mix(blush, s.base, 0.4) : blush, [MAT.skin]);
  const farCheek = visible([m.eyeX + 2, -4.5, 9.5]);
  if (farCheek) for (const [dx, dy] of [[0, 0], [1, 0], [0, 1]]) put(farCheek[0] + dx, farCheek[1] + dy, mix(s.shade, "#c83850", ruddy * 0.8), [MAT.skin]);
  if (f.detail === "freckles" && cheek)
    for (const [dx, dy] of [[-1, -1], [2, -1], [4, 0], [1, 2], [6, -1], [8, 0]]) put(cheek[0] + dx, cheek[1] + dy, mix(s.base, s.edge, 0.3), [MAT.skin]);
  if (m.a.beard === "stubble")
    for (let i = 0; i < r.w * r.h; i++) {
      const x = i % r.w, y = (i - x) / r.w;
      if (r.mat[i] === MAT.skin && mid && y > mid[1] - 3 && y < mid[1] + 9 && Math.abs(x - mid[0]) < 13 && depth[i] > 6)
        r.color[i] = mix(r.color[i], m.hair.shade, 0.22);
    }
  if (m.age > 60) {
    const n = onFace([0, m.chinY - 7, 5]);
    if (n) line(n[0] - 3, n[1], n[0] + 3, n[1] + 1, fold);
  }
}

type Put = (x: number, y: number, c: string, only?: number[]) => void;
type Find = (p: V) => readonly [number, number] | undefined;

function accessories(r: Raster, m: Model, put: Put, visible: Find, onFace: Find) {
  const s = m.skin, a = m.a, metal = m.ramps[MAT.metal];
  const e = a.wearing.eyewear;
  if (e && e !== "none") {
    const frame = e === "sunglasses" ? "#141018" : "#3a2a20";
    const eyes = [-1, 1].map((side) => visible([side * m.eyeX, 1.8, 11.2]));
    eyes.forEach((c, n) => {
      if (!c) return;
      const w = n ? 5 : 8, x0 = c[0] - (n ? 2 : 4), y0 = c[1] - 3;
      for (let x = x0; x < x0 + w; x++) for (let y = y0; y <= y0 + 5; y++) {
        const edge = x === x0 || x === x0 + w - 1 || y === y0 || y === y0 + 5;
        if (edge) r.put(x, y, frame);
        else if (e === "sunglasses") r.put(x, y, y === y0 + 1 && x < x0 + 3 ? "#7a8aa0" : "#1c1824");
      }
    });
    if (eyes[0] && eyes[1]) r.stroke([[eyes[0][0] + 4, eyes[0][1] - 2], [eyes[1][0] - 2, eyes[1][1] - 2]], frame);
    const ear = visible([-m.headW + 1, 1.5, 2]);
    if (eyes[0] && ear) r.stroke([[eyes[0][0] - 4, eyes[0][1] - 2], [ear[0], ear[1]]], frame);
  }
  const nose = a.adornment?.nose;
  const nostril = onFace([-1.2 * m.nose.wide, 1.1 - m.nose.len, 12.2 + m.nose.out * 0.5]);
  if (nostril && nose === "stud") r.put(nostril[0] - 1, nostril[1] - 1, metal.high);
  if (nostril && nose === "ring") for (const [dx, dy] of [[-1, 0], [-1, 1], [0, 2]]) r.put(nostril[0] + dx, nostril[1] + dy, metal.base);
  if (nostril && nose === "septum") for (const dx of [1, 2, 3]) r.put(nostril[0] + dx, nostril[1] + 1, metal.base);
  const marks = a.adornment?.marks;
  if (marks && marks !== "none") {
    const ink = a.adornment?.markStyle === "scar" ? s.light : a.adornment?.markColor ?? "#2a3a5a";
    const cheek = onFace([-m.eyeX - 2, -3.5, 9.8]);
    const brow = onFace([0, 6.5, 13]);
    const chin = onFace([0, m.chinY - 0.5, 10]);
    const dots = (c: readonly [number, number] | undefined, pts: number[][]) => c && pts.forEach(([dx, dy]) => put(c[0] + dx, c[1] + dy, ink, [MAT.skin]));
    switch (marks) {
      case "cheek-lines": dots(cheek, [[-2, 0], [-1, 0], [0, 0], [1, 0], [-2, 2], [-1, 2], [0, 2], [1, 2]]); break;
      case "cheek-dots": dots(cheek, [[-2, 0], [0, 0], [2, 0], [-1, 2], [1, 2]]); break;
      case "cheek-block": dots(cheek, [[-2, 0], [-1, 0], [0, 0], [1, 0], [-2, 1], [-1, 1], [0, 1], [1, 1], [-1, 2], [0, 2]]); break;
      case "chin-lines": dots(chin, [[-2, -2], [-2, -1], [-2, 0], [0, -2], [0, -1], [0, 0], [2, -2], [2, -1], [2, 0]]); break;
      case "forehead-mark": dots(brow, [[0, 0], [1, 0], [0, 1], [1, 1]]); break;
      case "brow-band": dots(brow, [-10, -8, -6, -4, -2, 0, 2, 4, 6, 8].flatMap((dx) => [[dx, 0], [dx + 1, 0]])); break;
      case "temple-rays": dots(onFace([-m.headW + 3, 3, 8]), [[0, 0], [1, 1], [0, 3], [1, 3], [0, 6], [1, 5]]); break;
      case "nose-bar": dots(onFace([0, -1, 12]), [[-8, 0], [-7, 0], [-6, 0], [-5, 0], [-4, 0], [4, 0], [5, 0], [6, 0]]); break;
    }
  }
}

/**
 * Fastenings and finishing that make a garment recognisable at this size:
 * buttons, lacing, stitching, embroidery, ribbing. Placed by projecting points
 * on the chest and kept to cloth pixels.
 */
function garmentDetail(r: Raster, m: Model, project: Frame["projectBody"]) {
  const a = m.a, g = a.wearing.garment, cloth = m.ramps[MAT.cloth], trim = m.ramps[MAT.trim], metal = m.ramps[MAT.metal];
  const onCloth = [MAT.cloth, MAT.trim, INNER, SHIRT, CLOAK];
  const mark = (x: number, y: number, z: number, c: string) => {
    const [px, py] = project([x, y, z]);
    if (onCloth.includes(r.matAt(px, py))) r.put(px, py, c);
    return [px, py] as const;
  };
  const button = (x: number, y: number, z: number, c = metal) => {
    const [px, py] = mark(x, y, z, c.light);
    if (onCloth.includes(r.matAt(px, py + 1))) r.put(px, py + 1, c.shade);
  };
  const fine = (a.wearing.quality ?? 0) > 0;
  switch (g) {
    case "shirt":
      for (const y of [-33, -38, -43]) button(0.2, y, 9.4, tones("#e8e4da", "cloth"));
      break;
    case "coat":
      for (const y of [-41, -46]) button(-3.2, y, 9.8, fine ? metal : tones(cloth.deep, "cloth"));
      mark(0.2, -29, 9.4, trim.light);
      break;
    case "robe":
      // Running stitch along the overlapping edge, and a tie at the side.
      for (let y = -30; y > -48; y -= 2.4) mark(2.5 + (-(y + 28) - 13) / 1.25 * -1 + 1.2, y, 8.8, trim.high);
      mark(6, -43, 8.8, trim.deep);
      mark(6.8, -44, 8.6, trim.deep);
      break;
    case "open-robe":
      for (let y = -31; y > -50; y -= 2.2) {
        mark(-6, y, 9, fine ? metal.base : trim.high);
        mark(6, y, 8, fine ? metal.base : trim.high);
      }
      break;
    case "dress": {
      // Lacing crossing down the front of the bodice.
      for (let k = 0; k < 4; k++) {
        const y = -35 - k * 2.4;
        mark(-1, y, 9.2, trim.base);
        mark(1, y - 1.2, 9.2, trim.base);
      }
      break;
    }
    case "gown":
      for (let x = -10; x <= 10; x += 2) mark(x, -32.2, 8.6 - Math.abs(x) * 0.2, "#f4f0e8");
      break;
    case "suit":
      for (let y = -27; y > -48; y -= 1) mark(0.3, y, 9.4, cloth.deep);
      break;
    case "poncho":
      for (let x = -5; x <= 5; x += 2) mark(x, -31.5, 8.8, trim.high);
      break;
    default: {
      if (["none", "loincloth", "skirt", "wrap"].includes(g)) break;
      const motif = a.wearing.motif ?? "auto";
      if (motif === "placket" || motif === "auto") {
        // Ties at the neck slit.
        mark(-0.8, -32.5, 9.3, trim.deep);
        mark(-1.4, -33.5, 9.3, trim.deep);
      }
      if (motif === "stitch" || fine)
        for (let t = -1; t <= 1.001; t += 0.2) mark(Math.sin(t * 1.2) * 9.2, -27.5 - Math.cos(t * 1.2) * 5.6, 7.4, fine ? metal.base : trim.high);
      if (motif === "jersey") for (let x = -6; x <= 6; x += 1.5) mark(x, -29, 8.2, trim.shade);
    }
  }
}

/** What the life has left on the body: hunger, soot, a healing hurt, and the scars that stay. */
function bodyRecord(r: Raster, m: Model, fr: Frame, put: Put, onFace: Find) {
  const rec = m.a.record;
  if (!rec) return;
  const s = m.skin;
  const on = (c: readonly [number, number] | undefined, pts: number[][], color: string | ((x: number, y: number) => string), mats: number[] = [MAT.skin]) =>
    c && pts.forEach(([dx, dy]) => put(c[0] + dx, c[1] + dy, typeof color === "string" ? color : color(dx, dy), mats));
  const tint = (hex: string, t: number) => (x: number, y: number) => mix(r.at(x, y) || s.base, hex, t);
  const at = (x: number, y: number, z: number) => onFace([x, y, z]);
  const cheek = at(-m.eyeX - 2, -4, 9.6), jaw = at(-m.jawW + 3, -11, 5.5), brow = at(-m.eyeX, 5.2, 11.4);
  if (rec.gaunt) {
    // Hollows under the cheekbones.
    for (const side of [-1, 1]) {
      const c = at(side * (m.eyeX + 1.5), -7.5, 8);
      on(c, rec.gaunt === 2 ? [[0, -1], [0, 0], [1, 0], [0, 1], [1, 1], [0, 2], [1, 2], [0, 3]] : [[0, 0], [0, 1], [1, 1], [0, 2]], mix(s.shade, s.edge, rec.gaunt === 2 ? 0.25 : 0.1));
    }
  }
  if (rec.soot) {
    const c = cheek ?? jaw;
    if (c) for (const [dx, dy] of [[-1, 0], [0, 0], [1, 0], [0, 1], [1, 1], [2, 1], [1, 2], [3, 2]]) put(c[0] + dx, c[1] + dy, mix(r.at(c[0] + dx, c[1] + dy) || s.base, "#241c1a", dx + dy > 2 ? 0.3 : 0.55), [MAT.skin]);
    const f = at(-2, 9, 12.4);
    if (f) for (const [dx, dy] of [[0, 0], [1, 0], [2, 1], [3, 1], [5, 1], [1, 1]]) put(f[0] + dx, f[1] + dy, mix(r.at(f[0] + dx, f[1] + dy) || s.base, "#241c1a", 0.45), [MAT.skin]);
    const nose = at(0.5, 1 - m.nose.len, 12.4 + m.nose.out * 0.6);
    if (nose) put(nose[0], nose[1], mix(s.base, "#241c1a", 0.4), [MAT.skin]);
  }
  const pale = mix(s.base, "#fbe8dc", 0.6), seam = mix(s.shade, s.edge, 0.3);
  for (const scar of rec.scars ?? []) {
    if (scar === "burned skin") on(jaw, [[0, 0], [1, 0], [0, 1], [1, 1], [2, 1], [1, 2]], (dx, dy) => ((dx + dy) % 2 ? pale : mix(s.base, "#e8b0a8", 0.3)));
    if (scar === "injured leg" || scar === "gored leg") {
      // A split through the brow from the fall: a gap in the hair and a pale seam across it.
      on(brow, [[0, -4], [0, -3], [0, -2], [0, -1], [0, 0], [1, 1], [1, 2]], (_, dy) => (dy >= -3 && dy <= 0 ? pale : seam), [MAT.skin, MAT.hair]);
    }
    if (scar === "torn arm") {
      const c = fr.projectBody([-m.shoulder + 4, -33, 3]);
      for (let k = 0; k < 3; k++) for (let j = 0; j < 4; j++) put(c[0] + k * 2 + j, c[1] + j, pale, [MAT.skin]);
    }
  }
  switch (rec.injury) {
    case "burned skin":
      on(jaw ?? cheek, [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [1, 2]], (dx, dy) => (dx === 1 && dy === 1 ? "#f0c8a8" : mix(s.base, "#c83424", 0.45)));
      break;
    case "torn arm": {
      // A bandage bound over the near shoulder, spotted through.
      for (let j = 0; j < 6; j++)
        for (let k = -5; k <= 5; k++) {
          const c = fr.projectBody([-m.shoulder + 2 + k * 0.8, -30.5 - j * 1 - k * 0.35, 5.5]);
          put(c[0], c[1], j === 0 || j === 5 || k === -5 || k === 5 ? "#b8ae98" : j === 3 ? "#d8d0bc" : (k === 1 || k === 2) && j === 2 ? "#a8323a" : "#f0eadc", [MAT.skin, MAT.cloth, MAT.trim, INNER, SHIRT, CLOAK]);
        }
      break;
    }
    case "injured leg":
    case "gored leg":
    case "sprained ankle": {
      // Came down hard: a graze on the cheekbone and, for the bad falls, a bruise below the eye.
      on(cheek, [[0, -1], [1, -1], [2, -2], [1, 0]], tint("#b8403a", 0.4));
      if (rec.injury !== "sprained ankle") on(at(-m.eyeX, -1.2, 11.2), [[-1, 0], [0, 0], [1, 0], [0, 1]], tint("#5a3a78", 0.35));
      break;
    }
  }
}
