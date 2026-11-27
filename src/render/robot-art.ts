import { Raster } from "./ship/raster";

/** Street robots of the projected years, painted frame by frame: a humanoid
 * that walks and carries, a six-wheeled pavement courier, a sweeper and a
 * robot dog. South-facing and east-facing frames; west is east flipped. */
export type RobotKind = "humanoid" | "courier" | "sweeper" | "dog";
export type Facing = "s" | "n" | "e";

type Ramp = readonly string[];
// Six steps, dark to light; joints and visors are their own darks.
const WHITE: Ramp = ["#4a5260", "#6e7a88", "#98a4b0", "#c4ccd4", "#e2e7eb", "#f6f8f9"];
const GRAPHITE: Ramp = ["#121519", "#1c2026", "#2a3038", "#3b434d", "#525c68", "#717d8a"];
const JOINT = ["#14171c", "#20252c", "#2f363f"];
const VISOR = ["#121820", "#1d2733", "#34465a"];
const EYE = ["#2ab8d0", "#7ff0ff", "#e6fdff"];
const CARD = ["#6e4a26", "#946634", "#bf8e52", "#dcb27a"];
const TAPE = "#efe0b4";
const FLAG = ["#b4441a", "#e2702e", "#f6a25a"];
const TYRE = ["#121418", "#24282e", "#3a3f46"];
const AMBER = ["#a05a10", "#f0a02a", "#ffe08a"];
const RED = ["#7a1414", "#d23a2a", "#ff8a6a"];
const GREEN = ["#1c6a3a", "#3ad070", "#b4ffc8"];

/** The colours one robot is made in: its shell and the stripe that tells it from the next. */
export type Livery = { shell: Ramp; accent: Ramp };
export const LIVERIES: readonly Livery[] = [
  { shell: WHITE, accent: ["#8a3c14", "#d8682a", "#f6a064"] },
  { shell: WHITE, accent: ["#1a5a5e", "#2e9a9a", "#7ad6cc"] },
  { shell: GRAPHITE, accent: ["#8a3c14", "#e2782e", "#ffb07a"] },
  { shell: WHITE, accent: ["#1e3a7a", "#3a6ad0", "#8ab0f4"] },
  { shell: GRAPHITE, accent: ["#7a6410", "#e2c032", "#fff08a"] },
];

const line = (r: Raster, x0: number, y0: number, x1: number, y1: number, col: string, w = 1) => {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) {
    const x = Math.round(x0 + ((x1 - x0) * i) / n), y = Math.round(y0 + ((y1 - y0) * i) / n);
    r.fill(x, y, w, 1, col);
  }
};
/** A run of shell lit from the upper left: light at x0, dark at x1. */
const shellRow = (r: Raster, x0: number, x1: number, y: number, s: Ramp, top = false) => {
  for (let x = x0; x <= x1; x++) {
    const t = x1 === x0 ? 0.5 : (x - x0) / (x1 - x0);
    r.set(x, y, s[top ? (t < 0.3 ? 5 : t < 0.8 ? 4 : 3) : t < 0.2 ? 4 : t < 0.75 ? 3 : t < 0.9 ? 2 : 1]);
  }
};
const block = (r: Raster, x0: number, y0: number, x1: number, y1: number, s: Ramp) => {
  for (let y = y0; y <= y1; y++) shellRow(r, x0, x1, y, s, y === y0);
};

/** Frame names: `${facing}-${pose}`. Poses are `idle0..3`, `walk0..3`,
 * and with a parcel `carry-idle0..1`, `carry-walk0..3`. */
function humanoid(livery: Livery): Record<string, Raster> {
  const out: Record<string, Raster> = {};
  const { shell: S, accent: A } = livery;
  const front = (facing: "s" | "n", step: number, idle: number, carry: boolean) => {
    const r = new Raster(16, 33);
    const walking = step >= 0;
    const lift = walking ? (step === 0 ? "l" : step === 2 ? "r" : "") : "";
    const b = walking && step % 2 === 1 ? 1 : 0;
    // Legs first, so the hips sit over the tops of the thighs.
    for (const [side, x0] of [["l", 5], ["r", 8]] as const) {
      const up = lift === side ? 1 : 0;
      const ramp = side === "l" ? S : S.map((_, i) => S[Math.max(0, i - 1)]);
      block(r, x0, 22, x0 + 2, 25 - up, ramp);
      r.fill(x0, 26 - up, 3, 1, JOINT[2]);
      block(r, x0, 27 - up, x0 + 2, 29 - up, ramp);
      r.fill(x0, 30 - up, 3, 1, JOINT[1]);
      r.fill(x0 + (side === "l" ? -1 : 0), 31 - up, 4, 1, JOINT[0]);
    }
    r.fill(5, 20 + b, 6, 1, JOINT[1]);
    r.fill(6, 21 + b, 4, 1, JOINT[0]);
    // Arms: the one that swings forward rides a pixel higher.
    const swing = (side: "l" | "r") => (!walking ? 0 : (step === 0) === (side === "r") ? -1 : step === 1 || step === 3 ? 0 : 1);
    if (!carry)
      for (const [side, x0] of [["l", 2], ["r", 12]] as const) {
        const y = 12 + b, s = swing(side);
        const ramp = side === "l" ? S : S.map((_, i) => S[Math.max(0, i - 2)]);
        block(r, x0, y, x0 + 1, y + 3, ramp);
        r.fill(x0, y + 4, 2, 1, JOINT[2]);
        block(r, x0, y + 5, x0 + 1, y + 7 + s, ramp);
        r.fill(x0, y + 8 + s, 2, 1, JOINT[1]);
      }
    // Torso: broad at the shoulder, narrow at the waist.
    const rows: [number, number][] = [[5, 10], [4, 11], [4, 11], [5, 10], [5, 10], [5, 10], [5, 10], [6, 9], [6, 9]];
    rows.forEach(([a, z], i) => shellRow(r, a, z, 11 + b + i, S, i === 0));
    if (facing === "s") {
      r.fill(6, 14 + b, 4, 1, A[1]);
      r.set(6, 14 + b, A[2]);
      r.set(9, 12 + b, idle % 2 ? GREEN[2] : GREEN[0]);
    } else {
      // The battery pack on its back, with its charge light.
      r.fill(6, 12 + b, 4, 5, S[1]);
      r.fill(6, 12 + b, 4, 1, S[2]);
      r.set(7, 14 + b, idle % 2 || walking ? GREEN[1] : GREEN[0]);
      r.fill(6, 15 + b, 4, 1, A[1]);
    }
    r.fill(7, 10 + b, 2, 1, JOINT[1]);
    // Head: a rounded shell with a visor.
    shellRow(r, 6, 9, 2 + b, S, true);
    for (let y = 3; y <= 8; y++) shellRow(r, 5, 10, y + b, S, y === 3);
    shellRow(r, 6, 9, 9 + b, S);
    r.set(4, 6 + b, JOINT[1]);
    r.set(11, 6 + b, JOINT[0]);
    if (facing === "s") {
      r.fill(5, 5 + b, 6, 3, VISOR[0]);
      r.fill(5, 5 + b, 6, 1, VISOR[1]);
      r.set(5, 5 + b, VISOR[2]);
      // Eyes that look about while it stands, and blink.
      const look = walking ? 0 : [0, -1, 0, 1][idle];
      const blink = !walking && idle === 2;
      for (const x of [6, 9]) {
        if (blink) r.set(x + look, 6 + b, EYE[0]);
        else {
          r.set(x + look, 6 + b, EYE[2]);
          r.set(x + look, 7 + b, EYE[0]);
        }
      }
    } else {
      r.fill(5, 6 + b, 6, 1, S[2]);
      r.set(8, 4 + b, A[1]);
    }
    if (carry) {
      // Arms bent forward round a parcel held against the chest.
      const y = 13 + b;
      if (facing === "s") {
        block(r, 3, 12 + b, 4, 14 + b, S);
        block(r, 11, 12 + b, 12, 14 + b, S.map((_, i) => S[Math.max(0, i - 2)]));
        r.fill(4, y + 1, 8, 6, CARD[2]);
        r.fill(4, y + 1, 8, 1, CARD[3]);
        r.fill(11, y + 2, 1, 5, CARD[1]);
        r.fill(4, y + 6, 8, 1, CARD[0]);
        r.fill(7, y + 1, 2, 5, TAPE);
        r.fill(3, y + 3, 1, 2, JOINT[1]);
        r.fill(12, y + 3, 1, 2, JOINT[0]);
      } else {
        block(r, 2, 12 + b, 3, 15 + b, S);
        block(r, 12, 12 + b, 13, 15 + b, S.map((_, i) => S[Math.max(0, i - 2)]));
        r.fill(1, y + 2, 1, 4, CARD[1]);
        r.fill(14, y + 2, 1, 4, CARD[0]);
      }
    }
    return r.finish();
  };
  const side = (step: number, idle: number, carry: boolean) => {
    const r = new Raster(16, 33);
    const walking = step >= 0;
    const b = walking && step % 2 === 1 ? 1 : 0;
    // Stride: where each foot is, ahead of the hip.
    const stride = walking ? [2, 0, -2, 0][step] : 0;
    const bend = walking && step % 2 === 1 ? 1 : 0;
    const leg = (foot: number, knee: number, ramp: Ramp, lifted: number) => {
      const hx = 8, hy = 21 + b, kx = 8 + Math.round(foot / 2) + knee, ky = 25 + b - lifted, fx = 8 + foot, fy = 29 - lifted;
      line(r, hx, hy, kx, ky, ramp[2], 2);
      r.fill(kx, ky, 2, 1, JOINT[2]);
      line(r, kx, ky + 1, fx, fy, ramp[3], 2);
      r.fill(fx - 1, fy + 1, 4, 1, JOINT[1]);
      r.fill(fx - 1, fy + 2, 4, 1, JOINT[0]);
    };
    const far = S.map((_, i) => S[Math.max(0, i - 2)]);
    leg(-stride, 0, far, walking && step === 3 ? bend : 0);
    const arm = (s: number, ramp: Ramp) => {
      const sx = 8, sy = 12 + b, ex = 8 + Math.round(s / 2), ey = 16 + b, hx = 8 + s, hy = 20 + b;
      line(r, sx, sy, ex, ey, ramp[3], 2);
      r.fill(ex, ey, 2, 1, JOINT[2]);
      line(r, ex, ey + 1, hx, hy - 1, ramp[3], 2);
      r.fill(hx, hy, 2, 1, JOINT[1]);
    };
    if (!carry) arm(stride, far);
    // Torso, with the battery pack on its back.
    for (let y = 11; y <= 19; y++) shellRow(r, y < 13 ? 6 : 6, y >= 18 ? 9 : 10, y + b, S, y === 11);
    r.fill(5, 12 + b, 1, 5, S[1]);
    r.set(5, 13 + b, walking || idle % 2 ? GREEN[1] : GREEN[0]);
    r.fill(7, 14 + b, 4, 1, A[1]);
    r.fill(6, 20 + b, 4, 1, JOINT[1]);
    r.fill(7, 10 + b, 2, 1, JOINT[1]);
    leg(stride, 0, S, walking && step === 1 ? bend : 0);
    // Head in profile: the visor wraps the front.
    shellRow(r, 6, 9, 2 + b, S, true);
    for (let y = 3; y <= 8; y++) shellRow(r, 5, 10, y + b, S, y === 3);
    shellRow(r, 6, 9, 9 + b, S);
    r.fill(8, 5 + b, 3, 3, VISOR[0]);
    r.fill(8, 5 + b, 3, 1, VISOR[1]);
    const blink = !walking && idle === 2;
    r.set(10, 6 + b, blink ? EYE[0] : EYE[2]);
    if (!blink) r.set(10, 7 + b, EYE[0]);
    r.set(6, 6 + b, JOINT[1]);
    if (carry) {
      line(r, 8, 13 + b, 10, 16 + b, S[3], 2);
      r.fill(9, 13 + b, 5, 6, CARD[2]);
      r.fill(9, 13 + b, 5, 1, CARD[3]);
      r.fill(13, 14 + b, 1, 5, CARD[1]);
      r.fill(9, 18 + b, 5, 1, CARD[0]);
      r.fill(9, 15 + b, 5, 1, TAPE);
      r.fill(12, 16 + b, 2, 1, JOINT[1]);
    } else arm(-stride, S);
    return r.finish();
  };
  for (const carry of [false, true]) {
    const p = carry ? "carry-" : "";
    for (let i = 0; i < 4; i++) {
      out[`s-${p}walk${i}`] = front("s", i, 0, carry);
      out[`n-${p}walk${i}`] = front("n", i, 0, carry);
      out[`e-${p}walk${i}`] = side(i, 0, carry);
    }
    for (let i = 0; i < (carry ? 2 : 4); i++) {
      out[`s-${p}idle${i}`] = front("s", -1, i, carry);
      out[`n-${p}idle${i}`] = front("n", -1, i, carry);
      out[`e-${p}idle${i}`] = side(-1, i, carry);
    }
  }
  return out;
}

/** The six-wheeled pavement courier: a cooler box on wheels with a flag on a whip. */
function courier(livery: Livery): Record<string, Raster> {
  const out: Record<string, Raster> = {};
  const S = livery.shell === GRAPHITE ? WHITE : livery.shell, A = livery.accent;
  const wheel = (r: Raster, cx: number, cy: number, turn: number) => {
    r.fill(cx - 1, cy - 2, 3, 5, TYRE[1]);
    r.fill(cx - 2, cy - 1, 5, 3, TYRE[1]);
    r.set(cx - 1, cy - 1, TYRE[2]);
    r.set(cx + (turn ? 1 : -1), cy + (turn ? -1 : 1), TYRE[2]);
    r.set(cx, cy, TYRE[0]);
  };
  const flag = (r: Raster, x: number, top: number, wave: number) => {
    line(r, x, top, x, top + 8, JOINT[2]);
    const shape = [[1, 0, 3, 3], [1, 1, 3, 2], [1, 0, 2, 3]][wave];
    r.fill(x + shape[0], top + shape[1], shape[2], shape[3], FLAG[1]);
    r.fill(x + shape[0], top + shape[1], shape[2], 1, FLAG[2]);
    r.set(x + shape[0] + shape[2] - 1, top + shape[1] + shape[3] - 1, FLAG[0]);
  };
  for (let f = 0; f < 4; f++) {
    // Side: e.
    const e = new Raster(22, 18);
    flag(e, 4, 0, f % 3);
    block(e, 3, 7, 18, 12, S);
    e.fill(3, 7, 16, 1, S[5]);
    e.fill(4, 8, 14, 1, S[4]);
    e.fill(3, 11, 16, 1, A[1]);
    e.set(18, 9, f % 2 ? AMBER[2] : AMBER[1]);
    e.fill(9, 9, 4, 1, S[2]);
    for (const x of [6, 11, 16]) wheel(e, x, 14, f % 2);
    out[`e-roll${f}`] = e.finish();
    // Front and back.
    for (const facing of ["s", "n"] as const) {
      const r = new Raster(16, 18);
      if (facing === "n") flag(r, 11, 0, f % 3);
      block(r, 2, 7, 13, 12, S);
      r.fill(2, 7, 12, 1, S[5]);
      r.fill(2, 11, 12, 1, A[1]);
      if (facing === "s") {
        r.fill(4, 9, 2, 1, EYE[2]);
        r.fill(10, 9, 2, 1, EYE[2]);
        r.fill(6, 9, 4, 1, VISOR[0]);
      } else {
        r.fill(3, 9, 2, 1, RED[1]);
        r.fill(11, 9, 2, 1, RED[1]);
      }
      for (const x of [3, 12]) {
        r.fill(x - 1, 12, 3, 4, TYRE[1]);
        r.set(x, 13 + (f % 2), TYRE[2]);
      }
      if (facing === "s") flag(r, 11, 0, f % 3);
      out[`${facing}-roll${f}`] = r.finish();
    }
  }
  // At the door: the lid up and the bag inside showing.
  for (let f = 0; f < 2; f++) {
    const e = new Raster(22, 18);
    flag(e, 4, 0, f);
    e.fill(3, 2, 2, 6, S[4]);
    e.fill(4, 2, 1, 6, S[2]);
    block(e, 3, 8, 18, 12, S);
    e.fill(5, 8, 12, 1, JOINT[0]);
    e.fill(9, 6, 5, 3, CARD[2]);
    e.fill(9, 6, 5, 1, CARD[3]);
    e.fill(11, 5, 1, 1, CARD[1]);
    e.fill(3, 11, 16, 1, A[1]);
    e.set(18, 9, f ? GREEN[2] : GREEN[1]);
    for (const x of [6, 11, 16]) wheel(e, x, 14, 0);
    out[`e-open${f}`] = e.finish();
  }
  return out;
}

/** A street sweeper: a low drum with two brushes spinning at its front corners. */
function sweeper(livery: Livery): Record<string, Raster> {
  const out: Record<string, Raster> = {};
  const S = livery.shell, A = livery.accent;
  for (let f = 0; f < 4; f++) {
    const r = new Raster(20, 14);
    // The body: a rounded box, lit across its top.
    const rows: [number, number][] = [[6, 13], [4, 15], [3, 16], [3, 16], [3, 16], [3, 16], [4, 15]];
    rows.forEach(([a, z], i) => shellRow(r, a, z, 3 + i, S, i < 2));
    r.fill(3, 8, 14, 1, A[1]);
    r.fill(4, 10, 12, 1, JOINT[1]);
    // The beacon on top turns.
    r.fill(9, 1, 2, 2, AMBER[0]);
    r.set(9 + (f % 2), 1, AMBER[2]);
    r.set(10 - (f % 2), 2, AMBER[1]);
    // Brushes: bristles round each corner hub, a quarter turn a frame.
    for (const cx of [2, 17]) {
      const spin = cx === 2 ? f : 3 - f;
      const spokes = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
      for (let k = 0; k < 4; k++) {
        const [dx, dy] = spokes[(k + spin) % 4];
        r.set(cx + dx * (k % 2 ? 2 : 1), 11 + dy, k % 2 ? "#b49a5a" : "#7a6438");
      }
      r.set(cx, 11, JOINT[0]);
    }
    r.fill(5, 12, 10, 1, TYRE[0]);
    out[`s-roll${f}`] = r.finish();
  }
  return out;
}

/** A robot dog: a box body on four jointed legs, a sensor head, trotting. */
function dog(livery: Livery): Record<string, Raster> {
  const out: Record<string, Raster> = {};
  const S = livery.shell, A = livery.accent;
  // Diagonal pairs move together: near fore with far hind.
  const steps = [[2, -2], [0, 0], [-2, 2], [0, 0]];
  // Each leg is two short columns, thigh then shin, the shin stepped by the swing
  // so the knee shows; a lifted foot clears the ground by a pixel.
  const far = S.map((_, i) => S[Math.max(0, i - 2)]);
  const pose = (r: Raster, hx: number, hy: number, swing: number, lift: number, near: boolean) => {
    const ramp = near ? S : far, w = near ? 2 : 1;
    r.fill(hx, hy + 1, w, 2, ramp[3]);
    r.fill(hx + swing, hy + 3, w, 1 - lift, ramp[2]);
    r.fill(hx + swing, hy + 4 - lift, w, 1, JOINT[0]);
  };
  for (let f = 0; f < 4; f++) {
    const e = new Raster(22, 16);
    const [a, z] = [[1, -1], [0, 0], [-1, 1], [0, 0]][f];
    const lifted = (k: number) => (f === 1 && k === 0) || (f === 3 && k === 1) ? 1 : 0;
    const bob = f % 2;
    pose(e, 7, 8 + bob, z, lifted(1), false);
    pose(e, 14, 8 + bob, a, lifted(0), false);
    block(e, 4, 4 + bob, 15, 8 + bob, S);
    e.fill(5, 6 + bob, 9, 1, A[1]);
    e.fill(6, 4 + bob, 6, 1, S[5]);
    e.fill(4, 8 + bob, 12, 1, S[1]);
    // The head: a short wedge with its sensor window forward.
    block(e, 15, 3 + bob, 18, 6 + bob, S);
    e.fill(17, 4 + bob, 2, 2, VISOR[0]);
    e.set(18, 4 + bob, EYE[2]);
    pose(e, 4, 8 + bob, a, lifted(0), true);
    pose(e, 12, 8 + bob, z, lifted(1), true);
    out[`e-walk${f}`] = e.finish();
    for (const facing of ["s", "n"] as const) {
      const r = new Raster(14, 16);
      const lift = (k: number) => (steps[f][k] > 0 ? 1 : 0);
      for (const [x, k] of [[3, 0], [9, 1]] as const) {
        r.fill(x, 9 + bob, 2, 4 - lift(k), S[2]);
        r.fill(x, 13 - lift(k), 2, 1, JOINT[0]);
      }
      block(r, 2, 4 + bob, 11, 9 + bob, S);
      r.fill(2, 7 + bob, 10, 1, A[1]);
      if (facing === "s") {
        block(r, 4, 1 + bob, 9, 4 + bob, S);
        r.fill(5, 2 + bob, 4, 2, VISOR[0]);
        r.set(5, 2 + bob, EYE[2]);
        r.set(8, 2 + bob, EYE[2]);
      } else r.fill(4, 5 + bob, 6, 1, S[1]);
      out[`${facing}-walk${f}`] = r.finish();
    }
  }
  return out;
}

const PAINTERS: Record<RobotKind, (l: Livery) => Record<string, Raster>> = { humanoid, courier, sweeper, dog };
const cache = new Map<string, Record<string, Raster>>();
/** Every frame of one kind in one livery. */
export function robotFrames(kind: RobotKind, livery: number) {
  const key = `${kind}-${livery}`;
  let frames = cache.get(key);
  if (!frames) cache.set(key, (frames = PAINTERS[kind](LIVERIES[livery % LIVERIES.length])));
  return frames;
}
