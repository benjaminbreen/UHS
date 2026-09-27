import type { Ground } from "./skill-sky";
import type { Vignette } from "./task-view";

type Pt = { x: number; y: number };
const RAD = Math.PI / 180;
const clamp = (x: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

/** A figure, as joint angles in degrees. Limbs are [upper, lower]: 0 hangs
 * straight down, positive swings towards the way they face. */
type Pose = {
  lean: number;
  head: number;
  armF: [number, number];
  armB: [number, number];
  legF: [number, number];
  legB: [number, number];
  /** On the ground: the knees or the seat bear the weight, not the feet. */
  sit?: boolean;
};
const STAND: Pose = { lean: 0, head: 0, armF: [8, 8], armB: [-6, 8], legF: [4, 0], legB: [-4, 0] };
const blend = (a: Pose, b: Pose, t: number): Pose => ({
  lean: lerp(a.lean, b.lean, t),
  head: lerp(a.head, b.head, t),
  armF: [lerp(a.armF[0], b.armF[0], t), lerp(a.armF[1], b.armF[1], t)],
  armB: [lerp(a.armB[0], b.armB[0], t), lerp(a.armB[1], b.armB[1], t)],
  legF: [lerp(a.legF[0], b.legF[0], t), lerp(a.legF[1], b.legF[1], t)],
  legB: [lerp(a.legB[0], b.legB[0], t), lerp(a.legB[1], b.legB[1], t)],
  sit: t < 0.5 ? a.sit : b.sit,
});
/** A loop of held poses, eased between. */
function cycle(frames: [Pose, number][], t: number) {
  const total = frames.reduce((n, [, d]) => n + d, 0);
  let m = t % total;
  for (let i = 0; i < frames.length; i++) {
    const [pose, d] = frames[i];
    if (m < d) return { pose: blend(pose, frames[(i + 1) % frames.length][0], easeInOut(m / d)), frame: i, into: m / d };
    m -= d;
  }
  return { pose: frames[0][0], frame: 0, into: 0 };
}
function walking(p: number, lean = 6, stride = 28): Pose {
  const s = Math.sin(p), c = Math.cos(p);
  return { lean, head: 0, legF: [stride * s, -24 * clamp((1 - c) / 2)], legB: [-stride * s, -24 * clamp((1 + c) / 2)], armF: [-20 * s, 18], armB: [20 * s, 18] };
}

/** A grid of art pixels round the fire: column 0 is the fire's first, and
 * the row above G is the ground. */
const HALF = 44, G = 40;
class Grid {
  cells = new Uint8Array(HALF * 2 * (G + 1));
  clear() {
    this.cells.fill(0);
  }
  set(x: number, y: number, v = 1) {
    const i = Math.round(x) + HALF, j = Math.round(y);
    if (i < 0 || j < 0 || i >= HALF * 2 || j > G) return;
    this.cells[j * HALF * 2 + i] = v;
  }
  on(x: number, y: number) {
    const i = x + HALF;
    return i >= 0 && y >= 0 && i < HALF * 2 && y <= G && this.cells[y * HALF * 2 + i] > 0;
  }
  rect(x: number, y: number, w: number, h: number, v = 1) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, v);
  }
  line(a: Pt, b: Pt, v = 1) {
    const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) * 2));
    for (let i = 0; i <= n; i++) this.set(a.x + ((b.x - a.x) * i) / n, a.y + ((b.y - a.y) * i) / n, v);
  }
  disc(c: Pt, r: number) {
    for (let dy = -Math.ceil(r); dy <= r; dy++)
      for (let dx = -Math.ceil(r); dx <= r; dx++) if (dx * dx + dy * dy <= r * r + 0.3) this.set(c.x + dx, c.y + dy);
  }
  ellipse(c: Pt, rx: number, ry: number) {
    for (let dy = -Math.ceil(ry); dy <= ry; dy++)
      for (let dx = -Math.ceil(rx); dx <= rx; dx++) if ((dx / rx) ** 2 + (dy / ry) ** 2 <= 1.05) this.set(c.x + dx, c.y + dy);
  }
}

// Proportions for a figure about eleven art pixels tall, the watcher's size.
const S = 0.42, TORSO = 9 * S, UPPER = 5 * S, FORE = 5 * S, THIGH = 6 * S, SHIN = 6 * S, HEAD = 1.15;
type Joints = { hip: Pt; shoulder: Pt; head: Pt; elbowF: Pt; handF: Pt; elbowB: Pt; handB: Pt; kneeF: Pt; footF: Pt; kneeB: Pt; footB: Pt };
function joints(p: Pose, x: number, face: 1 | -1, s = 1): Joints {
  const dir = (deg: number) => ({ x: face * Math.sin(deg * RAD), y: Math.cos(deg * RAD) });
  const add = (a: Pt, d: Pt, len: number) => ({ x: a.x + d.x * len * s, y: a.y + d.y * len * s });
  const hip0 = { x, y: 0 };
  const kneeF = add(hip0, dir(p.legF[0]), THIGH), footF = add(kneeF, dir(p.legF[0] + p.legF[1]), SHIN);
  const kneeB = add(hip0, dir(p.legB[0]), THIGH), footB = add(kneeB, dir(p.legB[0] + p.legB[1]), SHIN);
  const low = Math.max(footF.y, footB.y, kneeF.y, kneeB.y, p.sit ? 0.5 : -99);
  const mv = (q: Pt) => ({ x: q.x, y: q.y + G - low });
  const hip = mv(hip0);
  const up = { x: face * Math.sin(p.lean * RAD), y: -Math.cos(p.lean * RAD) };
  const shoulder = add(hip, up, TORSO);
  const head = add(shoulder, { x: face * Math.sin((p.lean + p.head) * RAD), y: -Math.cos((p.lean + p.head) * RAD) }, HEAD + 0.6);
  const arm = (a: [number, number]) => {
    const elbow = add(shoulder, dir(a[0]), UPPER);
    return { elbow, hand: add(elbow, dir(a[0] + a[1]), FORE) };
  };
  const f = arm(p.armF), b = arm(p.armB);
  return { hip, shoulder, head, elbowF: f.elbow, handF: f.hand, elbowB: b.elbow, handB: b.hand, kneeF: mv(kneeF), footF: mv(footF), kneeB: mv(kneeB), footB: mv(footB) };
}
function body(g: Grid, p: Pose, j: Joints, s: number) {
  g.line(j.shoulder, j.elbowB);
  g.line(j.elbowB, j.handB);
  g.line(j.hip, j.kneeB);
  g.line(j.kneeB, j.footB);
  g.line(j.hip, j.kneeF);
  g.line(j.kneeF, j.footF);
  // A body two pixels wide, and a tunic that flares to the knee.
  g.line(j.shoulder, j.hip);
  g.line({ x: j.shoulder.x + 0.8, y: j.shoulder.y + 0.4 }, { x: j.hip.x + 0.8, y: j.hip.y });
  if (!p.sit) {
    const hem = { x: (j.kneeF.x + j.kneeB.x) / 2, y: (j.kneeF.y + j.kneeB.y) / 2 };
    for (let k = 0; k <= 1; k += 0.25) {
      const c = { x: lerp(j.hip.x, hem.x, k), y: lerp(j.hip.y, hem.y, k) };
      const half = (0.6 + 1.1 * k) * s;
      g.line({ x: c.x - half, y: c.y }, { x: c.x + half + 0.8, y: c.y });
    }
  }
  g.disc(j.head, HEAD * s);
  g.line(j.shoulder, j.elbowF);
  g.line(j.elbowF, j.handF);
}
const along = (a: Pt, b: Pt, len: number): Pt => {
  const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return { x: b.x + ((b.x - a.x) / d) * len, y: b.y + ((b.y - a.y) / d) * len };
};

type Figure = { pose: Pose; x: number; face: 1 | -1; scale?: number; tool?: (j: Joints) => void };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; g: number };

/**
 * Someone doing the task beside the skills screen's campfire, at the size of
 * the one who sits there: a silhouette lit on the side that faces the flames.
 */
export function taskFigure(vignette: Vignette, companion?: number) {
  const grid = new Grid();
  const sparks: Spark[] = [];
  let struck = -1;
  const burst = (x: number, y: number, n: number, color: string) => {
    for (let i = 0; i < n; i++) sparks.push({ x, y, vx: (Math.random() - 0.5) * 10, vy: -6 - Math.random() * 10, life: 0.5 + Math.random() * 0.4, max: 0.9, color, g: 30 });
  };
  const puff = (x: number, y: number, color: string) => sparks.push({ x, y, vx: (Math.random() - 0.5) * 1.5, vy: -2 - Math.random() * 2, life: 2.2, max: 2.2, color, g: 0 });
  return (d: Ground) => {
    const { t, dt } = d;
    grid.clear();
    const figs: Figure[] = [];
    const lamps: Pt[] = [];
    const walkT = t * 6;
    // Where someone pacing the clearing has got to, and which way they face.
    const pace = (span: number, speed: number) => {
      const p = ((t * speed) / span) % 2;
      return { x: p < 1 ? lerp(-span, span, p) : lerp(span, -span, p - 1), face: (p < 1 ? 1 : -1) as 1 | -1 };
    };
    switch (vignette) {
      case "craft": {
        const { pose, frame, into } = cycle([
          [{ ...STAND, lean: 8, armF: [150, 35], armB: [45, 70], legF: [10, 0], legB: [-8, 0] }, 0.5],
          [{ ...STAND, lean: 24, armF: [62, 8], armB: [48, 70], legF: [12, 0], legB: [-8, 0] }, 0.14],
          [{ ...STAND, lean: 22, armF: [66, 10], armB: [48, 70], legF: [12, 0], legB: [-8, 0] }, 0.3],
        ], t);
        if (frame === 1 && into > 0.8 && struck !== Math.floor(t / 0.94)) {
          struck = Math.floor(t / 0.94);
          burst(-4, G - 3, 5, "#ffd06a");
        }
        figs.push({ pose, x: -9, face: 1, tool: (j) => {
          const tip = along(j.elbowF, j.handF, 1.4);
          grid.line(j.handF, tip);
          grid.set(tip.x, tip.y - 1);
          grid.set(tip.x, tip.y + 1);
        } });
        grid.rect(-6, G - 2, 4, 1);
        grid.rect(-5, G - 1, 2, 2);
        break;
      }
      case "tend": {
        const { pose, frame, into } = cycle([
          [{ ...STAND, lean: 20, armF: [120, 20], armB: [100, 30], legF: [14, -6], legB: [-10, 0] }, 0.5],
          [{ ...STAND, lean: 40, armF: [55, 5], armB: [40, 15], legF: [16, -10], legB: [-10, 0] }, 0.2],
          [{ ...STAND, lean: 38, armF: [58, 5], armB: [42, 15], legF: [16, -10], legB: [-10, 0] }, 0.35],
        ], t);
        if (frame === 1 && into > 0.85 && struck !== Math.floor(t / 1.05)) {
          struck = Math.floor(t / 1.05);
          burst(-15, G, 4, "#6a5a4a");
        }
        figs.push({ pose, x: -10, face: -1, tool: (j) => grid.line(j.handB, along(j.elbowF, j.handF, 3.5)) });
        for (const x of [-16, -19, -22, -25, -28]) plant(grid, x);
        break;
      }
      case "haul":
      case "walk": {
        const { x, face } = pace(18, vignette === "haul" ? 2.2 : 3);
        figs.push({
          pose: vignette === "haul" ? walking(walkT * 0.8, 16, 22) : { ...walking(walkT), armF: [30, 30] },
          x,
          face,
          tool: (j) =>
            vignette === "haul"
              ? grid.ellipse({ x: j.shoulder.x - face * 1.5, y: j.shoulder.y + 1 }, 1.4, 1.8)
              : grid.line({ x: j.handF.x, y: j.handF.y - 3 }, { x: j.handF.x + face, y: G }),
        });
        break;
      }
      case "water": {
        const { pose } = cycle([
          [{ ...STAND, lean: -6, armF: [160, 10], armB: [95, 40], legF: [12, 0], legB: [-10, 0] }, 0.45],
          [{ ...STAND, lean: -10, armF: [95, 40], armB: [160, 10], legF: [12, 0], legB: [-10, 0] }, 0.45],
        ], t);
        figs.push({ pose, x: -9, face: -1, tool: (j) => grid.line(j.handF, { x: -14, y: G - 7 }) });
        grid.rect(-18, G - 2, 7, 3);
        grid.rect(-19, G - 3, 9, 1);
        grid.rect(-18, G - 7, 1, 4);
        grid.rect(-12, G - 7, 1, 4);
        grid.rect(-19, G - 8, 9, 1);
        const pull = ((t / 0.9) % 6) / 6;
        if (pull > 0.2) grid.rect(-16, G - 3 - Math.round(pull * 3), 2, 2);
        break;
      }
      case "gather": {
        const { pose, frame, into } = cycle([
          [{ ...STAND, lean: 62, armF: [95, 5], armB: [70, 10], legF: [28, -40], legB: [-6, -20] }, 0.7],
          [{ ...STAND, lean: 30, armF: [25, 70], armB: [15, 40], legF: [18, -20], legB: [-6, -10] }, 0.5],
        ], t);
        if (frame === 1 && into < 0.04) burst(-6, G - 2, 2, "#c83a4a");
        figs.push({ pose, x: -10, face: -1 });
        grid.ellipse({ x: -17, y: G - 2 }, 3.2, 2.4);
        grid.ellipse({ x: -22, y: G - 1 }, 2.2, 1.6);
        grid.rect(-6, G - 1, 3, 2);
        break;
      }
      case "talk":
        figs.push(
          { pose: { ...STAND, armF: [60 + 25 * Math.sin(t * 2.4), 50], head: 4 * Math.sin(t * 2.4) }, x: -13, face: 1 },
          { pose: { ...STAND, lean: 4 * Math.sin(t * 1.3), head: -8 + 6 * Math.max(0, Math.sin(t * 1.9)), armF: [20, 60], armB: [10, 70] }, x: -8, face: -1 },
        );
        break;
      case "offer": {
        const bow = 0.5 + 0.5 * Math.sin(t * 0.9);
        figs.push({ pose: { lean: 10 + 45 * bow, head: 10 * bow, armF: [80 - 20 * bow, 10], armB: [70 - 20 * bow, 10], legF: [70, -150], legB: [70, -150], sit: true }, x: -10, face: -1 });
        grid.rect(-19, G - 1, 5, 2);
        grid.rect(-18, G - 3, 3, 2);
        grid.rect(-17, G - 5, 1, 2);
        lamps.push({ x: -17, y: G - 6 });
        if (Math.random() < dt * 2.5) puff(-17, G - 7, "#d8d0e8");
        break;
      }
      case "market": {
        figs.push(
          { pose: { ...STAND, armF: [50 + 30 * Math.max(0, Math.sin(t * 2 + 1.5)), 40], armB: [30, 60] }, x: -17, face: 1 },
          { pose: { ...STAND, armF: [75 + 15 * Math.sin(t * 2), 20], head: 3 * Math.sin(t * 1.3) }, x: -8, face: -1 },
        );
        grid.rect(-20, G - 4, 9, 1);
        grid.rect(-20, G - 3, 1, 3);
        grid.rect(-12, G - 3, 1, 3);
        grid.rect(-21, G - 11, 1, 7);
        grid.rect(-11, G - 11, 1, 7);
        for (let i = 0; i < 12; i++) grid.set(-22 + i, G - 12 + Math.floor(i / 4));
        for (const x of [-18, -16, -14]) grid.set(x, G - 5);
        break;
      }
      case "gathering":
        figs.push(
          { pose: { ...STAND, head: 5 * Math.sin(t * 1.7), armF: [40 + 20 * Math.max(0, Math.sin(t * 2.2)), 45] }, x: -9, face: 1 },
          { pose: { ...STAND, head: 5 * Math.sin(t * 1.7 + 2), lean: -6 + 6 * Math.max(0, Math.sin(t * 3)), armF: [10, 45] }, x: 7, face: -1 },
          { pose: { ...STAND, head: 5 * Math.sin(t * 1.7 + 4), armF: [25 + 20 * Math.max(0, Math.sin(t * 2.2 + 4)), 45] }, x: 11, face: -1 },
        );
        break;
      case "herd": {
        const { x, face } = pace(12, 1.6);
        figs.push({ pose: { ...walking(walkT * 0.6, 4, 18), armF: [40, 20] }, x, face, tool: (j) => grid.line({ x: j.handF.x, y: j.handF.y - 4 }, { x: j.handF.x + face, y: G }) });
        for (let i = 0; i < 3; i++) sheep(grid, x + face * (5 + i * 5), walkT * 0.6 + i * 1.7, face, i === 1 && Math.sin(t * 0.7) > 0.6);
        break;
      }
      case "play": {
        const a = pace(16, 7), b = pace(16, 7);
        figs.push(
          { pose: walking(walkT * 1.6, 16, 40), x: a.x, face: a.face, scale: 0.7 },
          { pose: walking(walkT * 1.6 + 1.3, 18, 40), x: b.x - a.face * 5, face: b.face, scale: 0.66 },
        );
        break;
      }
      case "cook": {
        figs.push({ pose: { lean: 30, head: 10, armF: [70 + 14 * Math.sin(t * 3), 25 + 14 * Math.cos(t * 3)], armB: [40, 60], legF: [80, -155], legB: [60, -150], sit: true }, x: -5, face: 1 });
        grid.line({ x: -1, y: G }, { x: 1, y: G - 7 });
        grid.line({ x: 3, y: G }, { x: 1, y: G - 7 });
        grid.line({ x: 1, y: G - 7 }, { x: 1, y: G - 5 });
        grid.ellipse({ x: 1, y: G - 4 }, 1.6, 1);
        if (Math.random() < dt * 3) puff(1, G - 6, "#e8e4f4");
        break;
      }
      case "warm": {
        const sit = (ph: number): Pose => ({ lean: 12 + 3 * Math.sin(t * 0.8 + ph), head: 4, armF: [80, 10 + 8 * Math.sin(t * 0.6 + ph)], armB: [60, 30], legF: [75, -115], legB: [70, -110], sit: true });
        figs.push({ pose: sit(0), x: -8, face: 1 }, { pose: sit(2), x: 10, face: -1 });
        break;
      }
      case "hang": {
        const { pose } = cycle([
          [{ ...STAND, lean: -4, armF: [165, 5], armB: [150, 15], legF: [6, 0], legB: [-6, 0] }, 0.9],
          [{ ...STAND, lean: 40, armF: [40, 20], armB: [30, 20], legF: [18, -18], legB: [-6, 0] }, 0.7],
        ], t);
        figs.push({ pose, x: -10, face: -1 });
        grid.rect(-24, G - 9, 1, 9);
        grid.rect(-13, G - 9, 1, 9);
        grid.rect(-25, G - 10, 13, 1);
        for (let i = 0; i < 4; i++) {
          const x = -22 + i * 3 + Math.round(Math.sin(t * 1.5 + i) * 0.4);
          grid.rect(x, G - 9, 1, 1);
          grid.rect(x, G - 8, 1, 3);
          grid.set(x - 1, G - 5);
          grid.set(x + 1, G - 5);
        }
        grid.rect(-7, G - 1, 3, 2);
        break;
      }
      case "rest": {
        const nod = Math.max(0, Math.sin(t * 0.5)) ** 3;
        figs.push({ pose: { lean: -4 + 10 * nod, head: 25 * nod, armF: [25, 50], armB: [15, 60], legF: [85, -85], legB: [80, -80], sit: true }, x: -9, face: 1 });
        break;
      }
    }
    if (companion && !["talk", "market", "gathering", "warm", "play"].includes(vignette)) {
      const moving = ["haul", "walk", "herd"].includes(vignette);
      const lead = figs[0];
      figs.push({
        pose: moving ? walking(walkT + 1.4, 6, companion < 1 ? 34 : 26) : { ...STAND, head: 6 + 4 * Math.sin(t * 0.9), lean: 3 * Math.sin(t * 0.7) },
        x: moving ? lead.x - lead.face * 5 : -20,
        face: moving ? lead.face : 1,
        scale: companion,
      });
    }
    for (const f of figs) {
      const j = joints(f.pose, f.x, f.face, f.scale ?? 1);
      body(grid, f.pose, j, f.scale ?? 1);
      f.tool?.(j);
    }
    render(grid, d, t);
    for (const l of lamps) {
      d.block(d.fx + l.x * d.k, d.fy - (G - l.y + 1) * d.k, "#ffc94d", 0.85 + 0.15 * Math.sin(t * 11));
      d.block(d.fx + l.x * d.k, d.fy - (G - l.y + 2) * d.k, "#fff0b0", 0.5 + 0.4 * Math.sin(t * 13));
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.life -= dt;
      s.vy += s.g * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.life <= 0 || s.y > G) {
        sparks.splice(i, 1);
        continue;
      }
      d.block(d.fx + Math.round(s.x) * d.k, d.fy - (G - Math.round(s.y) + 1) * d.k, s.color, clamp(s.life / s.max));
    }
  };
}

/** The grid to blocks, in the watcher's colours: dark, with the fire's light
 * on whichever edge faces it. */
function render(g: Grid, d: Ground, t: number) {
  for (let y = 0; y <= G; y++)
    for (let x = -HALF; x < HALF; x++) {
      if (!g.on(x, y)) continue;
      const px = d.fx + x * d.k, py = d.fy - (G - y + 1) * d.k;
      d.block(px, py, d.figure, 1);
      const toward = x < 1 ? 1 : -1;
      if (!g.on(x + toward, y)) d.block(px, py, "#e08a45", (0.35 + 0.25 * Math.sin(t * 11 + y)) * clamp(1.4 - Math.abs(x - 1) / 26));
    }
}
function plant(g: Grid, x: number) {
  g.rect(x, G - 1, 1, 2);
  g.set(x - 1, G - 2);
  g.set(x + 1, G - 2);
}
function sheep(g: Grid, x: number, p: number, face: 1 | -1, grazing: boolean) {
  g.ellipse({ x, y: G - 2 }, 2, 1);
  g.rect(x + face * 2, grazing ? G - 1 : G - 3, 1, 1);
  for (const [dx, ph] of [[-1, 0], [1, Math.PI]] as const) g.set(x + dx + Math.round(Math.sin(p + ph) * 0.6), G);
}
