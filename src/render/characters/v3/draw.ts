import type { CharacterAppearance } from "../../../core/character";
import type { CharacterPose } from "../poses";
import type { CarriedArt } from "../props";
import { drawHead } from "../v2/head";
import { lightKey, mix, Pixels, ramp, type Ramp } from "../v2/pixels";

// A figure modelled as signed distance fields and ray-cast onto the native
// grid. Every facing, including the diagonals, is the same body turned, so a
// three-quarter walk is a real three-quarter walk rather than a profile with
// its head turned. Adult proportions: the head is a fifth of the height.

type V = [number, number, number];
const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scale = (a: V, k: number): V => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a: V, b: V) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = (a: V) => Math.hypot(a[0], a[1], a[2]);
const norm = (a: V) => scale(a, 1 / (len(a) || 1));
const clamp = (x: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, x));
const rad = (deg: number) => (deg * Math.PI) / 180;

function smin(a: number, b: number, k: number) {
  const h = clamp(0.5 + (0.5 * (b - a)) / k, 0, 1);
  return b + (a - b) * h - k * h * (1 - h);
}
/** Capsule with a radius that runs from `ra` at `a` to `rb` at `b`. */
function cone(p: V, a: V, b: V, ra: number, rb: number) {
  const ba = sub(b, a),
    t = clamp(dot(sub(p, a), ba) / dot(ba, ba), 0, 1);
  return len(sub(p, add(a, scale(ba, t)))) - (ra + (rb - ra) * t);
}
function ellipsoid(p: V, c: V, r: V) {
  const q: V = [(p[0] - c[0]) / r[0], (p[1] - c[1]) / r[1], (p[2] - c[2]) / r[2]];
  const k0 = len(q),
    k1 = Math.hypot(q[0] / r[0], q[1] / r[1], q[2] / r[2]);
  return k1 ? (k0 * (k0 - 1)) / k1 : -Math.min(...r);
}
/** A vertical elliptic cylinder whose half-widths are interpolated between
 * keyed heights, capped flat. Torsos, skirts and coat tails. */
function column(p: V, cy: number, keys: [number, number, number][]) {
  const z = p[2];
  const lo = keys[0][0],
    hi = keys[keys.length - 1][0];
  const at = clamp(z, lo, hi);
  let i = 0;
  while (i < keys.length - 2 && at > keys[i + 1][0]) i++;
  const [z0, x0, y0] = keys[i],
    [z1, x1, y1] = keys[i + 1],
    t = (at - z0) / (z1 - z0 || 1),
    wx = x0 + (x1 - x0) * t,
    wy = y0 + (y1 - y0) * t;
  const e = (Math.hypot(p[0] / wx, (p[1] - cy) / wy) - 1) * Math.min(wx, wy);
  return Math.max(e, z - hi, lo - z);
}

type Part =
  | "skin"
  | "head"
  | "hair"
  | "top"
  | "sleeve"
  | "leg"
  | "shoe"
  | "skirt"
  | "hat"
  | "cloak"
  | "mantle";
type Hit = { d: number; part: Part };

type Tone = 0 | 1 | 2 | 3;

const CAMERA_TILT = 0.4;

/** C models the whole figure at adult proportions. D is the same body at
 * chibi-leaning ones (head about a third of the height) wearing B's
 * hand-drawn head, so faces keep their authored pixels. */
type Style = {
  leg: number;
  torso: number;
  upper: number;
  fore: number;
  limb: number;
  shoulder: number;
  spriteHead: boolean;
};
const styles: Record<"c" | "d", Style> = {
  c: { leg: 19, torso: 13, upper: 6.2, fore: 5.6, limb: 1, shoulder: 0, spriteHead: false },
  d: { leg: 14, torso: 10, upper: 4.4, fore: 4.1, limb: 1.22, shoulder: 0.5, spriteHead: true },
};
let S = styles.c; // ground foreshortening: one pixel of depth reads as half a pixel up

export const drawCharacter = (
  ctx: CanvasRenderingContext2D,
  a: CharacterAppearance,
  direction: number,
  pose: CharacterPose,
  frame: number,
  prop?: CarriedArt,
  facing?: number,
) => draw("c", ctx, a, direction, pose, frame, prop, facing);
export const drawCharacterD = (
  ctx: CanvasRenderingContext2D,
  a: CharacterAppearance,
  direction: number,
  pose: CharacterPose,
  frame: number,
  prop?: CarriedArt,
  facing?: number,
) => draw("d", ctx, a, direction, pose, frame, prop, facing);

function draw(
  style: "c" | "d",
  ctx: CanvasRenderingContext2D,
  a: CharacterAppearance,
  direction: number,
  pose: CharacterPose,
  frame: number,
  prop?: CarriedArt,
  facing?: number,
) {
  S = styles[style];
  ctx.clearRect(0, 0, 80, 80);
  ctx.imageSmoothingEnabled = false;
  const face8 = facing ?? [0, 2, 4, 6][direction & 3];
  const rig = pose3d(a, pose, frame, !!prop);
  const model = build(a, rig);
  const image = ctx.getImageData(0, 0, 80, 80);
  raster(image.data, a, model, rig, face8);
  ctx.putImageData(image, 0, 0);
  if (S.spriteHead) spriteHead(ctx, a, model, pose, frame, face8, rig.trail);
  if (prop) drawProp(ctx, prop, rig, face8);
}

// ---------------------------------------------------------------- the pose

type Rig = {
  hip: number;
  waist: number;
  chest: number;
  shoulder: number;
  headZ: number;
  lean: number;
  /** Shoulders turned against the hips about the vertical, radians. */
  twist: number;
  /** How far anything hanging off the head lags, in pixels. */
  trail: number;
  legs: { hip: V; knee: V; ankle: V; toe: number }[];
  arms: { shoulder: V; elbow: V; wrist: V }[];
  /** Hem swing: which way the skirt's foot is carried. */
  swing: number;
  shoulderW: number;
  hipW: number;
  child: boolean;
  seated: boolean;
};

function pose3d(
  a: CharacterAppearance,
  pose: CharacterPose,
  frame: number,
  carrying: boolean,
): Rig {
  const child = a.height <= -2;
  const extra = a.height * 3;
  const female = a.physique?.sex === "female";
  const k = S.leg / 19;
  const leg = S.leg + extra * 0.6 * k - (child ? 1 : 0);
  const torso = S.torso + extra * 0.4 * k - (child ? 1 : 0);
  const hip = leg + 1.5,
    waist = hip + torso * 0.3,
    chest = hip + torso * 0.62,
    shoulder = hip + torso;
  const headR = child ? 4.3 : 4.1;
  const headZ = shoulder + 1.6 + headR;
  const build = a.build + (a.physique?.mass ?? 0) / 60;
  const shoulderW =
    (child ? 3.9 : female ? 4.5 : 5.1) + S.shoulder + Math.max(-0.5, build) * 0.45;
  const hipW =
    (female ? 3.9 : 3.5) + S.shoulder * 0.6 + Math.max(0, build) * 0.4 - (child ? 0.5 : 0);

  const eight = pose === "walk" || pose === "run";
  const n = eight ? 8 : 4;
  const w = ((frame % n) + n) % n;
  const phase = (w / n) * Math.PI * 2;
  const s = Math.sin(phase),
    c = Math.cos(phase);

  // Joint angles in degrees: thigh swing (forward +), knee flex, arm swing,
  // elbow flex, trunk lean, hip drop.
  let thigh = [0, 0],
    knee = [4, 4],
    armA = [4, 4],
    elbow = [10, 10],
    lean = 0,
    drop = 0,
    armOut = [5, 5],
    swing = 0,
    twist = 0,
    trail = 0;
  const idle = pose === "idle" || pose === "breathe";
  let lift = 0;
  if (pose === "walk" || pose === "carry" || pose === "wade") {
    const A = 24;
    thigh = [A * s, -A * s];
    // The leg coming through bends; the planted one stays nearly straight.
    knee = [8 + 38 * Math.max(0, c), 8 + 38 * Math.max(0, -c)];
    // The arm going forward bends at the elbow and comes in toward the
    // body's line; the one going back hangs nearly straight.
    armA = [-24 * s, 24 * s];
    elbow = [8 + 26 * Math.max(0, -s), 8 + 26 * Math.max(0, s)];
    armOut = [5 - 5 * Math.max(0, -s), 5 - 5 * Math.max(0, s)];
    lean = 3;
    swing = -s;
    twist = rad(8) * s;
    trail = Math.round(-s);
  } else if (pose === "run") {
    const A = 42;
    thigh = [A * s + 14, -A * s + 14];
    // The recovering leg folds up under the body; the driving one extends.
    knee = [20 + 95 * Math.max(0, c), 20 + 95 * Math.max(0, -c)];
    // Arms pump from the shoulder with the elbow held near a right angle,
    // closing as the hand comes forward.
    armA = [-48 * s, 48 * s];
    elbow = [75 + 25 * Math.max(0, -s), 75 + 25 * Math.max(0, s)];
    armOut = [10, 10];
    lean = 13;
    swing = -1.6 * s;
    twist = rad(13) * s;
    trail = -2;
    // Off the ground just after each push.
    lift = [0.3, 1.6, 0.8, 0, 0.3, 1.6, 0.8, 0][w];
  } else if (idle) {
    lift = pose === "breathe" ? (w === 1 || w === 2 ? 0.5 : 0) : w === 2 ? 0.4 : 0;
    armA = [3, 3];
    const stance = a.posture ?? "upright";
    if (stance === "hands-together") {
      armA = [28, 28];
      elbow = [58, 58];
      armOut = [-10, -10];
    } else if (stance === "hand-on-hip") {
      armOut = [48, 7];
      elbow = [95, 10];
      armA = [-12, 4];
    } else if (stance === "stooped") {
      lean = 12;
      knee = [12, 12];
    } else if (stance === "relaxed") {
      thigh = [6, -3];
      knee = [10, 3];
    }
  } else if (
    pose === "pickup" ||
    pose === "drop" ||
    pose === "stoop" ||
    pose === "work" ||
    pose === "dig" ||
    pose === "reap" ||
    pose === "till" ||
    pose === "kneel" ||
    pose === "lift" ||
    pose === "tug"
  ) {
    const depth = [0.3, 0.7, 1, 0.6][w];
    lean = 40 * depth;
    thigh = [30 * depth, 20 * depth];
    knee = [55 * depth, 45 * depth];
    armA = [50 * depth + 10, 40 * depth + 10];
    elbow = [15, 15];
  } else if (pose === "sit") {
    // On the ground, knees up a little, hands on them.
    thigh = [112, 104];
    knee = [92, 88];
    armA = [38, 34];
    elbow = [24, 28];
  } else if (
    pose === "swing" ||
    pose === "chop" ||
    pose === "slash" ||
    pose === "thrust" ||
    pose === "cast" ||
    pose === "whirl" ||
    pose === "carve"
  ) {
    const arc = [150, 170, 60, 20][w];
    armA = [4, arc];
    elbow = [20, [40, 20, 5, 10][w]];
    lean = [-2, -4, 8, 5][w];
    thigh = [0, 12];
    knee = [6, 10];
  } else if (pose === "talk" || pose === "give" || pose === "point" || pose === "beckon") {
    const up = pose === "point" ? 85 : pose === "talk" ? [20, 45, 60, 35][w] : [30, 55, 70, 40][w];
    armA = [4, up];
    elbow = [10, pose === "point" ? 0 : pose === "beckon" ? [30, 70, 30, 70][w] : 40];
  } else if (pose === "shrug" || pose === "startle") {
    armA = [20, 20];
    elbow = [100, 100];
    armOut = [40, 40];
    lift = pose === "startle" ? 1 : 0;
  } else if (pose === "jump" || pose === "land" || pose === "stumble" || pose === "hang" || pose === "climb") {
    const k = [60, 10, 40, 70][w];
    thigh = [k, k * 0.8];
    knee = [k * 1.5, k * 1.4];
    armA = [pose === "hang" || pose === "climb" ? 170 : 40, pose === "hang" || pose === "climb" ? 170 : 40];
    elbow = [20, 20];
    lean = 10;
  } else if (pose === "hurt") {
    lean = [-8, -14, -10, -4][w];
    armOut = [30, 30];
    armA = [25, 25];
    elbow = [60, 60];
  }
  if (carrying && (idle || pose === "walk" || pose === "carry") && pose !== "walk") {
    armA[1] = 30;
    elbow[1] = 50;
  }

  const thighL = leg * 0.5,
    shinL = leg * 0.47;
  const legs = [0, 1].map((i) => {
    const side = i === 0 ? -1 : 1;
    const t = rad(thigh[i]),
      k = rad(thigh[i] - knee[i]);
    const h: V = [side * (hipW - 1.6), 0, hip];
    const kn = add(h, [0, Math.sin(t) * thighL, -Math.cos(t) * thighL]);
    const an = add(kn, [0, Math.sin(k) * shinL, -Math.cos(k) * shinL]);
    return { hip: h, knee: kn, ankle: an, toe: 0 };
  });
  // Whichever foot is lowest carries the body: the bob falls out of the legs.
  const ground = Math.min(...legs.map((l) => l.ankle[2])) - 1.3 - lift;
  const up = -ground - drop;
  for (const l of legs) {
    l.hip[2] += up;
    l.knee[2] += up;
    l.ankle[2] += up;
  }
  const arms = [0, 1].map((i) => {
    const side = i === 0 ? -1 : 1;
    const sh: V = [side * (shoulderW - 0.2), 0, shoulder - 1.3 + up];
    const out = rad(armOut[i]) * side;
    const u = rad(armA[i]),
      e = rad(armA[i] + elbow[i]);
    const upper = S.upper * (child ? 0.82 : 1),
      fore = S.fore * (child ? 0.82 : 1);
    const el = add(sh, [
      Math.sin(out) * upper,
      Math.sin(u) * upper * Math.cos(out),
      -Math.cos(u) * upper * Math.cos(out),
    ]);
    const wr = add(el, [
      Math.sin(out) * fore * 0.4,
      Math.sin(e) * fore,
      -Math.cos(e) * fore,
    ]);
    return { shoulder: sh, elbow: el, wrist: wr };
  });
  return {
    hip: hip + up,
    waist: waist + up,
    chest: chest + up,
    shoulder: shoulder + up,
    headZ: headZ + up,
    lean: rad(lean),
    twist,
    trail,
    legs,
    arms,
    swing,
    shoulderW,
    hipW,
    child,
    seated: pose === "sit",
  };
}

// ---------------------------------------------------------------- the model

type Model = {
  sdf: (p: V) => Hit;
  /** Head frame: eyes and mouth are placed on it after the cast. */
  head: V;
  headR: V;
  /** Top of the neck, where a sprite head's chin sits. */
  neck: V;
  /** Body space to the leaning, twisting upper body's own frame. */
  upper: (p: V) => V;
};

function hemFor(a: CharacterAppearance, r: Rig): number | undefined {
  const g = a.wearing.garment;
  const knee = (r.legs[0].knee[2] + r.legs[1].knee[2]) / 2;
  const leggings = a.wearing.leggings ?? "none";
  if (leggings === "sarong" || leggings === "wide") return 2.2;
  switch (g) {
    case "coat":
      return knee - 1;
    case "dress":
      return knee - 3.5;
    case "skirt":
      return knee - 1.5;
    case "long-tunic":
      return knee + 0.5;
    case "tunic":
    case "poncho":
      return r.hip - 3;
    case "robe":
    case "open-robe":
    case "gown":
      return 1.8;
    case "wrap":
      return knee - 2;
    case "loincloth":
      return r.hip - 3;
    default:
      return undefined;
  }
}

function build(a: CharacterAppearance, r: Rig): Model {
  const g = a.wearing.garment;
  const loose = a.wearing.sleeves === "loose";
  const bare = g === "none" || g === "loincloth";
  const female = a.physique?.sex === "female";
  const hem = hemFor(a, r);
  const gown = g === "gown";
  const trousers = !["dress", "skirt", "gown", "robe", "wrap"].includes(g);
  const headR: V = r.child ? [3.6, 3.7, 4.2] : [3.25, 3.4, 3.95];
  const lean = r.lean;
  const cl = Math.cos(lean),
    sl = Math.sin(lean);
  // Lean pivots the upper body about the hip.
  const ct = Math.cos(r.twist),
    st = Math.sin(r.twist);
  const bend = (p: V): V => {
    const z = p[2] - r.hip;
    const y = p[1] * cl - z * sl;
    return [p[0] * ct + y * st, -p[0] * st + y * ct, r.hip + p[1] * sl + z * cl];
  };
  const unbend = (q: V): V => {
    const x = q[0] * ct - q[1] * st,
      y0 = q[0] * st + q[1] * ct,
      z = q[2] - r.hip;
    return [x, y0 * cl + z * sl, r.hip - y0 * sl + z * cl];
  };
  const head: V = unbend([0, 0.4, r.headZ]);
  const headwear = a.wearing.headwear;
  const hair = a.hair;
  const w = r.shoulderW;
  const chestD = female ? 3.2 : 3.0;
  const torsoKeys: [number, number, number][] = [
    [r.hip - 2.2, r.hipW + (g === "coat" ? 0.4 : 0), 2.8],
    [r.waist, w - (female ? 1.6 : 1.1), 2.6],
    [r.chest, w - 0.3, chestD],
    [r.shoulder - 1.3, w, 2.7],
  ];
  const hemKeys: [number, number, number][] | undefined =
    hem === undefined
      ? undefined
      : [
          [hem, r.hipW + (gown ? 4 : g === "coat" ? 1.2 : 1.0) + (r.hip - hem) * 0.07, 3.6 + (gown ? 2 : 0)],
          [r.hip - 1, r.hipW + 0.5, 3.0],
          [r.waist, w - (female ? 1.6 : 1.1) + 0.2, 2.7],
        ];
  const knees = (r.legs[0].knee[1] + r.legs[1].knee[1]) / 2;
  return {
    head,
    headR,
    neck: unbend([0, 0.4, r.shoulder + 0.8]),
    upper: bend,
    sdf(p0: V): Hit {
      // Lower body: legs in hip space; upper body bent by the lean.
      let best: Hit = { d: 1e9, part: "leg" };
      const put = (d: number, part: Part) => {
        if (d < best.d) best = { d, part };
      };
      for (const l of r.legs) {
        const thigh = cone(p0, l.hip, l.knee, 2.0 * S.limb, 1.65 * S.limb);
        const shin = cone(p0, l.knee, l.ankle, 1.6 * S.limb, 1.25 * S.limb);
        // Under a skirt the legs begin at the hem, so a stride never pokes a
        // knee through the cloth.
        put(
          Math.max(
            Math.min(thigh, shin),
            hem === undefined || r.seated ? -1e9 : p0[2] - hem + 0.4,
          ),
          "leg",
        );
        const foot = smin(
          ellipsoid(p0, add(l.ankle, [0, 1.3, -0.6]), [1.4, 2.5, 1.2]),
          cone(p0, add(l.ankle, [0, 0, 1.2]), add(l.ankle, [0, 0.2, -0.6]), 1.4, 1.45),
          0.6,
        );
        put(Math.max(foot, -p0[2] + (l.ankle[2] - 1.9)), "shoe");
      }
      const p = bend(p0);
      let skirt = 1e9;
      if (hemKeys) {
        // The hem is carried a little behind the stride: cloth follows.
        // Cloth hangs from the hips whatever the trunk does.
        const t = clamp((r.waist - p0[2]) / (r.waist - hemKeys[0][0] || 1), 0, 1);
        const q: V = [p0[0], p0[1] - (knees * 0.5 + r.swing * 0.9) * t * t, p0[2]];
        skirt = column(q, 0, hemKeys);
      }
      const torso = smin(
        column(p, 0.1, torsoKeys),
        cone(p, [-w + 1.2, 0, r.shoulder - 1.5], [w - 1.2, 0, r.shoulder - 1.5], 1.9, 1.9),
        1.2,
      );
      // One garment from shoulder to hem: no seam where the skirt meets the body.
      put(smin(torso, skirt, 1), skirt < torso ? "skirt" : "top");
      const neck = cone(
        p,
        [0, 0.2, r.shoulder - 1.5],
        [0, 0.4, S.spriteHead ? r.shoulder + 0.8 : r.headZ - 2.5],
        1.55,
        1.4,
      );
      put(neck, "skin");
      for (const arm of r.arms) {
        const upper = cone(p, arm.shoulder, arm.elbow, 1.5 * S.limb, 1.25 * S.limb);
        const fore = cone(p, arm.elbow, arm.wrist, loose ? 1.5 : 1.2, loose ? 1.6 : 1.0);
        put(smin(upper, fore, 0.4), "sleeve");
        const hand = ellipsoid(p, add(arm.wrist, [0, 0.2, -0.9]), [0.95, 1.05, 1.35]);
        put(hand, "skin");
      }
      if (a.wearing.cloak) {
        const cloak = Math.max(
          column(
            [p[0], p[1] + 0.9, p[2]],
            0,
            [
              [(hem ?? r.legs[0].knee[2]) - 0.5, w + 1.6, 3.4],
              [r.chest, w + 0.9, 3.1],
              [r.shoulder - 0.4, w + 0.3, 2.9],
            ],
          ),
          p[1] - 0.2,
        );
        put(cloak, "cloak");
      }
      if (a.wearing.mantle && !a.wearing.cloak)
        put(
          column(p, 0, [
            [r.chest - 2.4, w + 1.9, 3.6],
            [r.shoulder - 0.6, w + 1.2, 3.1],
            [r.shoulder + 0.5, w - 0.4, 2.3],
          ]),
          "mantle",
        );
      if (S.spriteHead) return best;
      // Head: cranium, jaw and a nose that stands proud in profile.
      const h = sub(p, [0, 0.4, r.headZ]);
      const cranium = ellipsoid(h, [0, -0.2, 0.5], [headR[0], headR[1], headR[2] - 0.4]);
      const jaw = ellipsoid(h, [0, 0.7, -1.4], [headR[0] - 0.8, headR[1] - 0.7, 2.6]);
      const nose = ellipsoid(h, [0, headR[1] + 0.1, -0.5], [0.6, 0.9, 0.9]);
      const ears = Math.min(
        ellipsoid(h, [-headR[0] + 0.2, 0, -0.2], [0.5, 0.7, 0.9]),
        ellipsoid(h, [headR[0] - 0.2, 0, -0.2], [0.5, 0.7, 0.9]),
      );
      put(Math.min(smin(cranium, jaw, 1.2), nose, ears), "head");
      // Hair is a shell a little outside the skull, cut away over the face.
      const covered = ["headscarf", "hood", "veil", "turban", "helmet", "wrap"].includes(headwear);
      if (!covered && (hair !== "bald" || headwear === "none")) {
        const volume =
          hair === "curls" ? 0.95 : hair === "long" || hair === "bob" ? 0.6 : 0.45;
        let shell = ellipsoid(h, [0, -0.35, 0.75], [
          headR[0] + volume,
          headR[1] + volume,
          headR[2] - 0.2 + volume * 0.6,
        ]);
        // How low the hair comes, by how far round the head: brow at the
        // front, below the ear at the side, the nape behind.
        const round = h[1] / headR[1];
        const reach =
          hair === "bob" || hair === "long" || hair === "braid"
            ? -3.2
            : hair === "curls"
              ? -2.0
              : hair === "bald"
                ? -1.2
                : -1.6;
        const line =
          round > 0.15
            ? reach + (round - 0.15) * (hair === "bob" ? 5.5 : 8) + (round > 0.55 ? 3 : 0)
            : reach - (0.15 - round) * 1.6;
        let cut = line - h[2];
        if (hair === "bald") cut = Math.max(cut, h[2] - 0.2);
        shell = Math.max(shell, cut * 0.6);
        if (hair === "long")
          shell = Math.min(
            shell,
            Math.max(
              ellipsoid(h, [0, -1.6, -3.5], [headR[0] + 0.3, 2.3, 4.2]),
              h[1] - 0.2,
            ),
          );
        if (hair === "braid")
          shell = Math.min(shell, cone(h, [0, -3.4, -2], [0, -3.2, -8.5], 1.0, 0.7));
        if (hair === "topknot")
          shell = Math.min(shell, ellipsoid(h, [0, -1.2, headR[2] + 0.9], [1.5, 1.5, 1.4]));
        if (hair === "bob")
          shell = Math.max(shell, h[2] - 4.8 - 10 * Math.max(0, round - 0.2));
        put(shell, "hair");
      }
      const hat = headgear(h, headwear, headR);
      if (hat < 1e8) put(hat, "hat");
      void bare;
      void trousers;
      return best;
    },
  };
}

function headgear(h: V, kind: CharacterAppearance["wearing"]["headwear"], r: V) {
  const top = r[2] + 0.4;
  const brim = (radius: number, z: number, y = 0.1) =>
    Math.max(
      Math.hypot(h[0], h[1] - y) - radius,
      Math.abs(h[2] - z) - 0.35,
    );
  const crown = (radius: number, z0: number, z1: number) =>
    Math.max(Math.hypot(h[0] / 1, (h[1] + 0.1) / 1.1) - radius, h[2] - z1, z0 - h[2]);
  switch (kind) {
    case "bowler":
      return Math.min(
        Math.max(ellipsoid(h, [0, -0.1, 1.9], [r[0] + 0.25, r[1] + 0.25, 3.2]), 1.4 - h[2]),
        brim(r[1] + 1.0, 1.7),
      );
    case "brimmed":
      return Math.min(crown(r[0] - 0.2, 2.2, top + 0.7), brim(r[1] + 1.7, 2.4));
    case "flat-cap":
      return Math.min(
        Math.max(ellipsoid(h, [0, 0.9, 2.3], [r[0] + 0.6, r[1] + 1.1, 2.0]), 1.5 - h[2]),
        Math.max(ellipsoid(h, [0, r[1] + 0.5, 1.6], [2.4, 1.6, 0.4]), -h[1]),
      );
    case "cap":
    case "ball-cap":
      return Math.min(
        Math.max(ellipsoid(h, [0, 0, 1.2], [r[0] + 0.45, r[1] + 0.45, 3.4]), 1.0 - h[2]),
        Math.max(ellipsoid(h, [0, r[1] + 1.1, 1.1], [2.4, 2.4, 0.4]), -h[1]),
      );
    case "fez":
      return crown(r[0] - 0.6, 1.0, top + 1.9);
    case "helmet":
      return Math.max(ellipsoid(h, [0, 0, 1.0], [r[0] + 0.8, r[1] + 0.8, 3.9]), 0.2 - h[2]);
    case "turban":
      return Math.max(ellipsoid(h, [0, -0.2, 2.0], [r[0] + 1.1, r[1] + 1.0, 3.2]), 0.4 - h[2]);
    case "conical":
      return Math.max(
        Math.hypot(h[0], h[1]) - (r[1] + 3.2) * clamp((top + 2 - h[2]) / 3.6, 0, 1),
        1.1 - h[2],
      );
    case "headscarf":
    case "hood":
    case "veil": {
      const s = ellipsoid(h, [0, -0.3, 0.1], [r[0] + 0.5, r[1] + 0.5, r[2] + 0.2]);
      const round = h[1] / r[1];
      // Open over the face from the brow to the chin; it falls to the neck
      // everywhere else.
      const open = round > 0.2 && Math.abs(h[0]) < r[0] * 0.8 && h[2] < 1.7;
      return Math.max(s, open ? 0.6 : -h[2] - 5);
    }
    case "band":
    case "fillet":
    case "wrap":
      return Math.max(
        ellipsoid(h, [0, -0.2, 0.9], [r[0] + 0.55, r[1] + 0.55, r[2]]),
        Math.abs(h[2] - 1.4) - 0.6,
      );
    default:
      return 1e9;
  }
}

// ---------------------------------------------------------------- the cast

const W = 80,
  H = 80,
  ORIGIN_X = 40,
  ORIGIN_Y = 78;

type Cell = {
  part: Part;
  depth: number;
  n: V;
  /** Hit point in body space, before the facing turn. */
  p: V;
  tone: Tone;
  ramp: Ramp;
};

function raster(
  out: Uint8ClampedArray,
  a: CharacterAppearance,
  model: Model,
  rig: Rig,
  facing: number,
) {
  // Facing 0 is north (away), 4 south (toward the viewer), clockwise.
  const ang = (facing * Math.PI) / 4;
  const F: V = [Math.sin(ang), -Math.cos(ang), 0],
    R: V = [Math.cos(ang), Math.sin(ang), 0];
  const toBody = (v: V): V => [dot(v, R), dot(v, F), v[2]];
  const toWorld = (v: V): V => add(add(scale(R, v[0]), scale(F, v[1])), [0, 0, v[2]]);
  const dir = norm([0, -1, -CAMERA_TILT]);
  const dirB = toBody(dir);
  const key = lightKey();
  const L = norm([0.8 * key, 0.45, 0.7]);
  const cells: (Cell | undefined)[] = new Array(W * H);
  const palette = materials(a);
  const eps = 0.02;
  // Rows the figure can occupy: a little above the head, down to the feet.
  const top = Math.max(0, Math.floor(ORIGIN_Y - rig.headZ - 12));
  for (let y = top; y < H; y++)
    for (let x = 14; x < 66; x++) {
      const sx = x + 0.5 - ORIGIN_X,
        sy = ORIGIN_Y - (y + 0.5);
      // A point on this pixel's ray, well in front of the figure.
      const Y0 = 30;
      const o: V = [sx, Y0, sy + CAMERA_TILT * Y0];
      let t = 0,
        hit: Hit | undefined;
      const oB = toBody(o);
      for (let i = 0; i < 90 && t < 90; i++) {
        const q = add(oB, scale(dirB, t));
        const h = model.sdf(q);
        if (h.d < eps) {
          hit = h;
          break;
        }
        t += Math.max(h.d * 0.8, 0.02);
      }
      if (!hit) continue;
      const q = add(oB, scale(dirB, t));
      const g = (e: V) => model.sdf(add(q, e)).d;
      const k = 0.08;
      const nB = norm([
        g([k, 0, 0]) - g([-k, 0, 0]),
        g([0, k, 0]) - g([0, -k, 0]),
        g([0, 0, k]) - g([0, 0, -k]),
      ]);
      const n = toWorld(nB);
      const { ramp: rp, soft, flat } = palette(hit.part, q, rig, model);
      const i = dot(n, L);
      // Skin and hair take fewer, softer steps: at this size a dark core on a
      // face is a bruise.
      let tone: Tone = soft
        ? i > 0.78
          ? 0
          : i > -0.05
            ? 1
            : 2
        : i > 0.62
          ? 0
          : i > 0.1
            ? 1
            : i > -0.45
              ? 2
              : 3;
      // Occlusion: anything close above the surface darkens it a step. The
      // armpit, the collar under the chin, the face under a brim.
      const occ = model.sdf(add(q, scale(nB, 1.3))).d / 1.3;
      if (occ < 0.5 && tone < (soft ? 2 : 3)) tone = (tone + 1) as Tone;
      if (flat !== undefined) tone = flat;
      cells[y * W + x] = { part: hit.part, depth: t, n, p: q, tone, ramp: rp };
    }
  tidy(cells);
  // A step back in depth is a fold or an overlap: the far side of it takes a
  // dark pixel, which is what separates an arm from the coat behind it.
  const edge = new Uint8Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const c = cells[y * W + x];
      if (!c) continue;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, -1],
        [0, 1],
      ]) {
        const o = cells[(y + dy) * W + x + dx];
        if (!o || x + dx < 0 || x + dx >= W) continue;
        const gap = c.depth - o.depth;
        const limb = o.part === "sleeve" || o.part === "skin" || o.part === "leg";
        if (gap > (limb ? 1.6 : 2.4) && !(c.part === "head" && o.part === "hair"))
          edge[y * W + x] = 1;
      }
    }
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const c = cells[y * W + x];
      if (!c) continue;
      const r = c.ramp;
      const color = edge[y * W + x]
        ? r.edge
        : [r.light, r.base, r.shade, r.shadowEdge ?? r.edge][c.tone];
      const v = parseInt(color.slice(1), 16),
        i = (y * W + x) * 4;
      out[i] = v >> 16;
      out[i + 1] = (v >> 8) & 255;
      out[i + 2] = v & 255;
      out[i + 3] = 255;
    }
  if (!S.spriteHead) face(out, cells, a, model, rig, toWorld, facing);
  contour(out, cells, key);
}

/** A dark line outside the silhouette, from the material it borders. Kept
 * under the luminance `outlineCharacter` leaves alone, so the two never stack. */
function contour(out: Uint8ClampedArray, cells: (Cell | undefined)[], key: number) {
  const ring: [number, string][] = [];
  for (let y = 1; y < H - 1; y++)
    for (let x = 1; x < W - 1; x++) {
      if (cells[y * W + x]) continue;
      const by = [
        [0, 1, false],
        [0, -1, true],
        [-key, 0, false],
        [key, 0, true],
      ] as const;
      let color: string | undefined,
        lit = true;
      for (const [dx, dy, shadowSide] of by) {
        const c = cells[(y + dy) * W + x + dx];
        if (!c) continue;
        // Only lit when every neighbour it borders is on the lit side.
        if (shadowSide) lit = false;
        color ??= c.ramp.shadowEdge ?? c.ramp.edge;
      }
      if (!color) continue;
      let hex = mix(color, "#150f1a", lit ? 0.3 : 0.5);
      const v = parseInt(hex.slice(1), 16),
        l = 0.3 * (v >> 16) + 0.59 * ((v >> 8) & 255) + 0.11 * (v & 255);
      if (l > 56) hex = mix(hex, "#150f1a", 1 - 56 / l);
      ring.push([y * W + x, hex]);
    }
  for (const [i, hex] of ring) {
    const v = parseInt(hex.slice(1), 16);
    out[i * 4] = v >> 16;
    out[i * 4 + 1] = (v >> 8) & 255;
    out[i * 4 + 2] = v & 255;
    out[i * 4 + 3] = 255;
  }
}

/** A single pixel of one tone surrounded by another is noise at this size,
 * not form. Fold it into its neighbours. */
function tidy(cells: (Cell | undefined)[]) {
  const next = cells.map((c) => c?.tone);
  for (let y = 1; y < H - 1; y++)
    for (let x = 1; x < W - 1; x++) {
      const c = cells[y * W + x];
      if (!c) continue;
      const around = [
        cells[y * W + x - 1],
        cells[y * W + x + 1],
        cells[(y - 1) * W + x],
        cells[(y + 1) * W + x],
      ].filter((o) => o && o.ramp === c.ramp) as Cell[];
      if (around.length < 3) continue;
      if (around.some((o) => o.tone === c.tone)) continue;
      const counts = new Map<Tone, number>();
      for (const o of around) counts.set(o.tone, (counts.get(o.tone) ?? 0) + 1);
      next[y * W + x] = [...counts].sort((p, q) => q[1] - p[1])[0][0];
    }
  cells.forEach((c, i) => {
    if (c) c.tone = next[i]!;
  });
}

// ---------------------------------------------------------------- materials

function materials(a: CharacterAppearance) {
  const g = a.wearing.garment;
  const skin = ramp(a.skin, "skin"),
    hair = ramp(a.hairColor, "hair"),
    cloth = ramp(a.wearing.color),
    lower = ramp(a.wearing.lowerColor),
    trim = ramp(a.wearing.trim),
    cloak = ramp(a.wearing.cloakColor),
    felt = ramp(a.wearing.lowerColor),
    leather = ramp("#4a3428"),
    boot = ramp("#3b2c26"),
    sole = ramp("#dcd8cf");
  const bare = g === "none" || g === "loincloth";
  const leggings = a.wearing.leggings ?? "none";
  const footwear = a.wearing.footwear ?? "shoes";
  const sleeves = bare || g === "poncho" ? "none" : (a.wearing.sleeves ?? (g === "shirt" || g === "coat" || g === "robe" || g === "suit" ? "long" : "short"));
  // Tucked shirt, blouse and skirt, or a dress: which colour is below the belt.
  const skirtRamp = g === "skirt" || leggings === "sarong" || leggings === "wide" ? lower : cloth;
  const legRamp =
    g === "suit"
      ? cloth
      : leggings === "none" && ["tunic", "wrap", "skirt", "dress", "loincloth", "none"].includes(g) && g !== "none"
        ? skin
        : lower;
  const beard = a.beard;
  // The same deterministic motif B picks, so an outfit keeps its look.
  const outfit = [...(a.wearing.color + a.wearing.trim + g + a.wearing.belt)].reduce(
    (n, c) => (Math.imul(n, 31) + c.charCodeAt(0)) >>> 0,
    7,
  );
  const named = a.wearing.motif ?? "auto";
  const motif =
    g === "wrap" || bare
      ? "plain"
      : named === "auto"
        ? (["plain", "placket", "band", "yoke", "stitch"] as const)[outfit % 5]
        : named;
  const belt = bare || g === "gown" ? "none" : (a.wearing.belt ?? "leather");
  const gold = ramp("#d8b35a");
  type Paint = { ramp: Ramp; soft?: boolean; flat?: Tone };
  /** Patterns wrap the body: `u` is the upper body's own frame, so a stripe
   * follows the torso round a turn instead of sliding across it. */
  const pattern = (base: Ramp, u: V, r: Rig): Paint => {
    const z = u[2],
      around = Math.atan2(u[1], u[0]) * r.shoulderW;
    switch (motif) {
      case "stripes": {
        const k = Math.floor(z / 1.5);
        return k % 2 ? { ramp: (k >> 1) % 2 ? lower : trim } : { ramp: base };
      }
      case "plaid": {
        const row = ((z % 2) + 2) % 2 < 0.6,
          col = ((around % 2) + 2) % 2 < 0.6;
        return row && col ? { ramp: trim, flat: 3 } : row || col ? { ramp: trim, flat: 2 } : { ramp: base };
      }
      case "band":
        return Math.abs(z - r.chest) < 0.45 || Math.abs(z - r.waist - 1.3) < 0.45
          ? { ramp: trim, flat: 2 }
          : { ramp: base };
      case "yoke":
        return z > r.chest + 1.2 ? { ramp: lower } : { ramp: base };
      case "jersey":
        return z > r.shoulder - 1.4 ? { ramp: lower } : { ramp: base };
    }
    return { ramp: base };
  };
  /** Things on the chest: plackets, buttons, the jersey's number. Front only. */
  const front = (u: V, r: Rig): Paint | undefined => {
    const x = Math.abs(u[0]),
      z = u[2];
    if (u[1] < 0.6) return;
    if (motif === "placket" && x < 0.6 && z < r.shoulder - 1)
      return (((z % 1.7) + 1.7) % 1.7) < 0.55 ? { ramp: trim, flat: 0 } : { ramp: trim, flat: 2 };
    if (motif === "stitch" && Math.abs(u[0] + r.shoulderW * 0.5) < 0.5 && ((z % 1.4) + 1.4) % 1.4 < 0.6)
      return { ramp: trim, flat: 1 };
    if (motif === "jersey" && Math.abs(x - 0.9) < 0.4 && Math.abs(z - r.chest) < 1.2)
      return { ramp: lower, flat: 0 };
  };
  const necklace = (u: V, r: Rig): Paint | undefined => {
    if (!a.wearing.necklace || u[1] < 0.4) return;
    const x = Math.abs(u[0]),
      d = r.shoulder + 0.5 - u[2] - x * 0.55;
    if (x > 2.3 || Math.abs(d - 1) > 0.32) return;
    const chain = a.wearing.neckStyle === "chain";
    return { ramp: chain ? gold : trim, flat: x < 0.5 ? 0 : chain ? 1 : 0 };
  };
  const waistband = (z: number, r: Rig, u: V): Paint | undefined => {
    if (belt === "none" || Math.abs(z - r.waist + 0.3) >= (belt === "wide" || belt === "sash" ? 1 : 0.55))
      return;
    if (belt !== "sash" && u[1] > 0.6 && Math.abs(u[0]) < 0.6) return { ramp: trim, flat: 0 };
    return { ramp: belt === "sash" ? lower : belt === "cord" ? trim : leather };
  };
  let hem: number | undefined;
  return (
    part: Part,
    p: V,
    r: Rig,
    m: Model,
  ): { ramp: Ramp; soft?: boolean; flat?: Tone } => {
    hem ??= hemFor(a, r);
    switch (part) {
      case "head": {
        const h = sub(p, m.head);
        const jaw = h[2] < -1.3 - 0.5 * Math.max(0, -h[1]) && h[1] > -1.2;
        if (jaw && (beard === "short" || beard === "long" || beard === "forked" || beard === "chinstrap"))
          return { ramp: hair, soft: true };
        if (beard === "moustache" || beard === "handlebar") {
          if (h[1] > 2.4 && Math.abs(h[2] + 1.6) < 0.5) return { ramp: hair, soft: true };
        }
        if (beard === "goatee" && h[1] > 2 && h[2] < -2.6 && Math.abs(h[0]) < 1.2)
          return { ramp: hair, soft: true };
        if (beard === "stubble" && jaw) return { ramp: stubbleOf(a), soft: true };
        return { ramp: skin, soft: true };
      }
      case "skin":
        return necklace(m.upper(p), r) ?? { ramp: skin, soft: true };
      case "hair":
        return { ramp: hair, soft: true };
      case "hat":
        return {
          ramp: a.wearing.headwear === "headscarf" || a.wearing.headwear === "veil" || a.wearing.headwear === "hood" || a.wearing.headwear === "turban" || a.wearing.headwear === "wrap" || a.wearing.headwear === "band"
            ? trim
            : felt,
        };
      case "cloak":
        return { ramp: cloak };
      case "shoe":
        if (footwear === "none") return { ramp: skin, soft: true };
        if (footwear === "sneakers") return { ramp: p[2] - r.legs[0].ankle[2] < -1.2 && p[2] < 1.2 ? sole : cloth };
        if (footwear === "sandals") return { ramp: p[2] < 0.7 ? leather : skin, soft: p[2] >= 0.7 };
        return { ramp: footwear === "boots" ? boot : leather };
      case "leg": {
        // Seated, the lap is the garment's.
        if (r.seated && hem !== undefined && p[2] > hem) return { ramp: skirtRamp };
        if (footwear === "boots" && p[2] < r.legs[0].knee[2] - 2) return { ramp: boot };
        if (legRamp === skin) return { ramp: skin, soft: true };
        // Wound bands up the shin: puttees, leg wraps.
        if (leggings === "wrapped" && p[2] < r.legs[0].knee[2] + 1 && ((p[2] % 1.2) + 1.2) % 1.2 < 0.45)
          return { ramp: legRamp, flat: 3 };
        return { ramp: legRamp };
      }
      case "mantle":
        return p[2] < r.chest - 1.95 ? { ramp: trim, flat: 1 } : { ramp: cloak };
      case "skirt": {
        const band = waistband(p[2], r, m.upper(p));
        if (band) return band;
        // A border at the hem of anything short enough to show one.
        if (hem !== undefined && p[2] - hem < 0.7 && g !== "coat" && g !== "dress" && g !== "gown")
          return { ramp: trim, flat: 2 };
        return pattern(skirtRamp, m.upper(p), r);
      }
      case "sleeve": {
        p = m.upper(p);
        const arm = r.arms[p[0] < 0 ? 0 : 1];
        const fromShoulder = len(sub(p, arm.shoulder));
        const upper = len(sub(arm.elbow, arm.shoulder));
        if (sleeves === "none" || (sleeves === "short" && fromShoulder > upper * 0.55))
          return { ramp: skin, soft: true };
        if (a.wearing.cloak && fromShoulder < upper * 0.6) return { ramp: cloak };
        // Cuff: the last pixel of a long sleeve in the trim.
        if (sleeves !== "short" && len(sub(p, arm.wrist)) < 0.9)
          return { ramp: g === "coat" ? cloth : trim, flat: g === "coat" ? 3 : 2 };
        if (sleeves === "short" && Math.abs(fromShoulder - upper * 0.5) < 0.45) return { ramp: trim, flat: 2 };
        return pattern(cloth, p, r);
      }
      case "top": {
        const u = m.upper(p);
        if (bare) return necklace(u, r) ?? { ramp: skin, soft: true };
        const face = u[1] > 0.6;
        const x = Math.abs(u[0]),
          z = u[2];
        const band = waistband(z, r, u);
        if (band) return band;
        const bead = necklace(u, r);
        if (bead) return bead;
        if (g === "coat" && face) {
          // Lapels open over a shirt and tie: the V that makes a coat a coat.
          const v = (r.shoulder - 0.4 - z) * 0.38;
          if (z > r.chest - 2 && x < v)
            return x < 0.6 && z < r.shoulder - 1.6
              ? { ramp: lower, flat: 2 }
              : { ramp: trim, flat: 1 };
          if (z > r.chest - 2.6 && x < v + 0.9) return { ramp: cloth, flat: 0 };
          // Two buttons below the lapels.
          if (Math.abs(x - 0.9) < 0.4 && [r.chest - 3.3, r.chest - 5.3].some((b) => Math.abs(z - b) < 0.4))
            return { ramp: cloth, flat: 3 };
        }
        if ((g === "dress" || g === "gown" || g === "skirt") && face && z > r.shoulder - 1.2 && x < 1.3)
          return { ramp: skin, soft: true };
        // Necklines: a V on shirts and robes, a band round the collar otherwise.
        if (face && z > r.shoulder - 1.8 && ["shirt", "robe", "open-robe"].includes(g)) {
          if (Math.abs(x - (r.shoulder - 0.2 - z) * 0.6) < 0.45) return { ramp: trim, flat: 1 };
          if (x < (r.shoulder - 0.2 - z) * 0.6) return { ramp: g === "shirt" ? skin : trim, soft: g === "shirt" };
        } else if (g !== "coat" && z > r.shoulder - 0.7 && x < r.shoulderW - 1)
          return { ramp: trim, flat: 1 };
        if (g === "shirt" && z < r.waist - 0.4 && (a.wearing.leggings ?? "trousers") !== "none")
          return { ramp: lower };
        if (g === "skirt" && z < r.waist) return { ramp: lower };
        if (g === "open-robe" && face && x < 1.4) return { ramp: trim };
        return front(u, r) ?? pattern(cloth, u, r);
      }
    }
    return { ramp: cloth };
  };
}

function stubbleOf(a: CharacterAppearance) {
  return ramp(mix(a.skin, a.hairColor, 0.35), "skin");
}

// ---------------------------------------------------------------- the face

function face(
  out: Uint8ClampedArray,
  cells: (Cell | undefined)[],
  a: CharacterAppearance,
  m: Model,
  r: Rig,
  toWorld: (v: V) => V,
  facing: number,
) {
  const dir = norm([0, -1, -CAMERA_TILT]);
  const project = (b: V) => {
    const w = toWorld(b);
    // Along the ray back to the Y0 plane, then onto the screen.
    const s = w[2] - CAMERA_TILT * w[1];
    return { x: Math.floor(ORIGIN_X + w[0]), y: Math.floor(ORIGIN_Y - s), w };
  };
  const set = (x: number, y: number, hex: string) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const v = parseInt(hex.slice(1), 16),
      i = (y * W + x) * 4;
    out[i] = v >> 16;
    out[i + 1] = (v >> 8) & 255;
    out[i + 2] = v & 255;
    out[i + 3] = 255;
  };
  const skin = ramp(a.skin, "skin");
  const eyeTone = mix("#1c1418", a.skin, 0.12);
  const glasses = a.wearing.eyewear ?? "none";
  const visible = (b: V, part: Part[]) => {
    const { x, y } = project(b);
    const c = cells[y * W + x];
    if (!c || !part.includes(c.part)) return undefined;
    // Only a point on the surface we actually see, not one round the back.
    if (dot(toWorld(sub(b, m.head)), dir) > 0.2) return undefined;
    return { x, y };
  };
  const hx = m.head;
  const eyes: V[] = [-1, 1].map((s) => add(hx, [s * 1.2, m.headR[1] - 0.45, 0.15]));
  const seen = eyes.map((e) => visible(e, ["head"])).filter(Boolean) as { x: number; y: number }[];
  // Two eyes that land on the same pixel, or touching, read as one smudge:
  // keep the nearer.
  const shown = seen.length === 2 && Math.abs(seen[0].x - seen[1].x) < 2 ? [seen[facing > 4 ? 0 : 1]] : seen;
  for (const e of shown) {
    if (glasses === "sunglasses") {
      set(e.x, e.y, "#1d1b22");
      set(e.x + (e.x < ORIGIN_X ? -1 : 1) * 0, e.y, "#1d1b22");
    } else set(e.x, e.y, eyeTone);
    // Brow shadow: the pixel over each eye takes the skin's shade.
    const c = cells[(e.y - 1) * W + e.x];
    if (c && c.part === "head" && c.ramp === skin) set(e.x, e.y - 1, skin.shade);
  }
  if (glasses === "glasses" && shown.length === 2) {
    const [l, rr] = shown[0].x < shown[1].x ? shown : [shown[1], shown[0]];
    for (let x = l.x + 1; x < rr.x; x++) set(x, l.y, "#3a3238");
  }
  // The mouth is a pixel of shade under the nose, head-on and three-quarter.
  const mouth = visible(add(hx, [0, m.headR[1] - 0.5, -2.2]), ["head"]);
  if (mouth && (facing === 4 || facing === 3 || facing === 5) && a.beard !== "long" && a.beard !== "short")
    set(mouth.x, mouth.y, mix(skin.shade, "#6a2c34", 0.25));
  void r;
}

// ---------------------------------------------------------------- D's head

/** B's authored head, one size smaller than B wears it, set on the modelled
 * neck. The eight facings map onto its five drawings: front, back, profile
 * and the two turned ones, mirrored for the west. */
function spriteHead(
  ctx: CanvasRenderingContext2D,
  a: CharacterAppearance,
  m: Model,
  pose: CharacterPose,
  frame: number,
  facing: number,
  trail: number,
) {
  const ang = (facing * Math.PI) / 4;
  const F: V = [Math.sin(ang), -Math.cos(ang), 0],
    R: V = [Math.cos(ang), Math.sin(ang), 0];
  const n = m.neck;
  const w = add(add(scale(R, n[0]), scale(F, n[1])), [0, 0, n[2]]);
  const nx = Math.round(ORIGIN_X + w[0] - 0.5),
    ny = Math.round(ORIGIN_Y - (w[2] - CAMERA_TILT * w[1]));
  const west = facing >= 5,
    side = facing === 2 || facing === 6,
    back = facing <= 1 || facing === 7,
    turn = facing % 2 === 1;
  // The column of the head drawing that sits over the neck.
  const anchor = side ? 11 : turn ? 9 : 10;
  const size = a.headSize ?? "medium";
  // Drawn apart first, so it can be lit and shadowed before it joins the body.
  headCanvas ??= document.createElement("canvas");
  headCanvas.width = W;
  headCanvas.height = H;
  const hc = headCanvas.getContext("2d", { willReadFrequently: true })!;
  hc.clearRect(0, 0, W, H);
  hc.save();
  if (west) {
    hc.translate(nx + anchor + 1, ny - 14);
    hc.scale(-1, 1);
  } else hc.translate(nx - anchor, ny - 14);
  const p = new Pixels(hc);
  p.flip = west;
  p.modeling = false;
  p.squeeze =
    size === "large"
      ? { rows: [5], cols: side ? [6] : [5] }
      : { rows: [5, 14], cols: side ? [6] : [5, 15] };
  drawHead(p, a, side, back, pose, ((frame % 4) + 4) % 4, trail, turn);
  hc.restore();
  const head = hc.getImageData(0, 0, W, H).data,
    body = ctx.getImageData(0, 0, W, H);
  finishHead(head, body.data, a, back);
  ctx.putImageData(body, 0, 0);
}

let headCanvas: HTMLCanvasElement | undefined;

/** B's head is flat colour with hand-placed accents; the body is lit. This
 * lights the head from the same key by walking each pixel one step along its
 * own ramp, over an ellipsoid fitted to the skull, then adds the shadows
 * that seat it: under the chin, under a brim or fringe. Pixels that are not
 * a ramp's base, light or shade (eyes, outlines, ornament) are left alone. */
function finishHead(
  head: Uint8ClampedArray,
  body: Uint8ClampedArray,
  a: CharacterAppearance,
  back: boolean,
) {
  const hex = (i: number, d: Uint8ClampedArray) =>
    "#" + [d[i], d[i + 1], d[i + 2]].map((v) => v.toString(16).padStart(2, "0")).join("");
  type Step = { ramp: Ramp; tone: 0 | 1 | 2; kind: "skin" | "hair" | "other" };
  const index = new Map<string, Step>();
  const learn = (r: Ramp, kind: Step["kind"]) =>
    ([r.light, r.base, r.shade] as const).forEach((c, tone) => {
      if (!index.has(c)) index.set(c, { ramp: r, tone: tone as 0 | 1 | 2, kind });
    });
  learn(ramp(a.skin, "skin"), "skin");
  learn(ramp(a.hairColor, "hair"), "hair");
  for (const c of [a.wearing.color, a.wearing.cloakColor, a.wearing.trim, a.wearing.lowerColor])
    learn(ramp(c), "other");
  const at = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < W && y < H && head[(y * W + x) * 4 + 3] > 0;
  const step = new Array<Step | undefined>(W * H);
  // The skull: skin and hair only, so a wide brim does not stretch it.
  let x0 = W,
    x1 = 0,
    y0 = H,
    y1 = 0,
    any = false;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!at(x, y)) continue;
      const k = index.get(hex((y * W + x) * 4, head));
      step[y * W + x] = k;
      if (k && k.kind !== "other") {
        any = true;
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      }
    }
  if (!any) return;
  const cx = (x0 + x1 + 1) / 2,
    cy = (y0 + y1 + 1) / 2,
    rx = (x1 - x0 + 1) / 2 + 0.5,
    ry = (y1 - y0 + 1) / 2 + 0.5;
  const key = lightKey();
  const L = norm([0.8 * key, 0.7, 0.45]);
  const colour = (x: number, y: number) => {
    const i = (y * W + x) * 4,
      k = step[y * W + x];
    if (!k) return hex(i, head);
    const u = (x + 0.5 - cx) / rx,
      v = (cy - y - 0.5) / ry,
      n = norm([u, v, Math.sqrt(Math.max(0.05, 1 - u * u - v * v))]);
    const lit = dot(n, L);
    let tone: number = k.tone;
    // Only a base pixel lightens: B's shade pixels are features (a nostril,
    // the mouth, a lid), and lifting them would erase the face.
    // Skin lightens only as a rim along the lit edge; lit across the open face
    // it broke into patches between the features.
    const rim = !at(x + key, y) || !at(x + 2 * key, y);
    if (lit > 0.62 && tone === 1 && (k.kind !== "skin" || rim)) tone = 0;
    else if (
      lit < (k.kind === "skin" ? -0.12 : 0.02) &&
      tone < 2 &&
      (k.kind !== "skin" || !at(x - key, y) || !at(x - 2 * key, y))
    )
      tone++;
    if (k.kind !== "other") {
      // Seated under a fringe or brim: two covered pixels above a bare one.
      const i1 = ((y - 1) * W + x) * 4,
        i2 = ((y - 2) * W + x) * 4;
      if (
        k.kind === "skin" &&
        tone < 2 &&
        at(x, y - 1) &&
        at(x, y - 2) &&
        index.get(hex(i1, head))?.kind !== "skin" &&
        index.get(hex(i2, head))?.kind !== "skin"
      )
        tone++;
      if (k.kind === "hair") tone = hairTone(a.hair, x - x0, y - y0, u, v, lit, tone, back);
    }
    return [k.ramp.light, k.ramp.base, k.ramp.shade][tone];
  };
  const out = new Uint8ClampedArray(head.length);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!at(x, y)) continue;
      const v = parseInt(colour(x, y).slice(1), 16),
        i = (y * W + x) * 4;
      out[i] = v >> 16;
      out[i + 1] = (v >> 8) & 255;
      out[i + 2] = v & 255;
      out[i + 3] = head[i + 3];
    }
  for (let x = 0; x < W; x++)
    for (let y = H - 1; y > 0; y--) {
      if (!at(x, y)) continue;
      // The chin's shadow on the collar, a pixel below the head.
      const i = ((y + 1) * W + x) * 4;
      if (y + 1 < H && body[i + 3])
        for (const c of [0, 1, 2]) body[i + c] = Math.round(body[i + c] * 0.72);
      break;
    }
  for (let i = 0; i < out.length; i += 4)
    if (out[i + 3]) for (const c of [0, 1, 2, 3]) body[i + c] = out[i + c];
}

/** Hair at twelve pixels wide is a shape, a sheen and a few lines of
 * direction. The sheen is a crescent where the light rakes the crown; the
 * lines follow the style. `x`, `y` are from the top-left of the skull. */
function hairTone(
  style: CharacterAppearance["hair"],
  x: number,
  y: number,
  u: number,
  v: number,
  lit: number,
  tone: number,
  back: boolean,
) {
  if (tone === 2 && lit < 0) return tone;
  if (v > 0.15 && lit > 0.35 && lit < 0.62) return 0;
  switch (style) {
    case "curls":
      // Clusters: a lit knot, a dark one, offset row to row.
      if ((x * 3 + y * 5) % 7 === 0) return Math.max(0, tone - 1);
      if ((x * 3 + y * 5) % 7 === 4) return Math.min(2, tone + 1);
      return tone;
    case "braid":
      return v < -0.2 && (x + y) % 3 === 0 ? 2 : tone;
    case "long":
    case "bob":
    case "original":
      // Strands running down from the crown, one every third column, lower
      // half only so the top keeps its sheen.
      if (v < 0.1 && x % 3 === 1 && tone === 1) return 2;
      // From behind, a parting down the middle of the crown.
      if (back && Math.abs(u) < 0.12 && v > 0.1) return 2;
      return tone;
  }
  return tone;
}

// ---------------------------------------------------------------- props

function drawProp(ctx: CanvasRenderingContext2D, prop: CarriedArt, r: Rig, facing: number) {
  const ang = (facing * Math.PI) / 4;
  const F: V = [Math.sin(ang), -Math.cos(ang), 0],
    R: V = [Math.cos(ang), Math.sin(ang), 0];
  const hand = r.arms[1].wrist;
  const w = add(add(scale(R, hand[0]), scale(F, hand[1])), [0, 0, hand[2] - 1]);
  const x = Math.round(ORIGIN_X + w[0]),
    y = Math.round(ORIGIN_Y - (w[2] - CAMERA_TILT * w[1]));
  // The hand is in front of the figure when its depth is toward the viewer.
  const behind = w[1] < -0.5;
  ctx.save();
  if (behind) ctx.globalCompositeOperation = "destination-over";
  if (prop.kind === "stick" || prop.kind === "tool" || prop.kind === "haft")
    ctx.drawImage(prop.image, x - Math.round(prop.width / 2), y - prop.height + 4);
  else if (prop.kind === "head") ctx.drawImage(prop.image, 40 - Math.round(prop.width / 2), Math.round(ORIGIN_Y - r.headZ - 5 - prop.height));
  else if (prop.kind === "back") {
    ctx.globalCompositeOperation = facing >= 3 && facing <= 5 ? "destination-over" : "source-over";
    ctx.drawImage(prop.image, 40 - Math.round(prop.width / 2), Math.round(ORIGIN_Y - r.shoulder - 1));
  } else ctx.drawImage(prop.image, x - Math.round(prop.width / 2), y - Math.round(prop.height / 2));
  ctx.restore();
}
