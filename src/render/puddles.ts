import type Phaser from "phaser";
import type { PathStroke, TopographyCell, TopographySample } from "../core/topography";
import type { GroundState, Weather } from "../core/weather";
import { waterHash as hash } from "../core/water-field";
import { pathField } from "./material-edges";

const BUCKET = 256;
let serial = 0;

export type PuddleSpot = {
  x: number;
  y: number;
  /** Unit long axis on screen; ruts lie along the road. */
  ax: number;
  ay: number;
  rx: number;
  ry: number;
  /** 0 to 1: how much foot and wheel traffic churns this ground. */
  traffic: number;
  /** Wetness this hollow needs before it holds water; drier spots fill last. */
  rank: number;
  seed: number;
  /** Spring-fed: holds water whatever the season. */
  pond?: boolean;
  /** A runoff channel: runs only while it rains and leaves no mud. */
  rill?: boolean;
};

const earth = (c: TopographyCell | undefined, height: number) =>
  !!c &&
  c.surface === "soil" &&
  c.height === height &&
  !c.feature &&
  !c.field &&
  !c.bridge &&
  !c.ramp &&
  !c.waterVisual?.kind?.startsWith("canal");

/** Hollows in unpaved ground where mud and standing water collect: wheel ruts
 * along cart roads, broader pools where feet churn. Placed once per chunk; the
 * weather only decides how much of each shows. */
export function puddlesAt(
  sample: TopographySample,
  x: number,
  y: number,
  ox: number,
  oy: number,
  top: number,
): PuddleSpot[] {
  const c = sample(x, y);
  if (c?.surface === "sand" && c.waterVisual?.kind === "sea") return rivuletsFrom(sample, x, y, ox, oy, top);
  const bed = (b: TopographyCell | undefined) =>
    b?.landscape?.kind === "arroyo" && !b.landscape.cut && b.landscape.strength >= 0.5 &&
    b.surface !== "water" && !b.bridge && b.height === c?.height;
  if (c?.landscape?.kind === "oasis" && c.surface !== "water") {
    if (c.landscape.strength < 0.5) return [];
    const wx = x + ox,
      wy = y + oy;
    const r = 13 + hash(wx, wy, 741) * 5;
    return [
      {
        x: x * 16 + 8,
        y: top + 8,
        ax: 1,
        ay: 0,
        rx: r,
        ry: r * 0.7,
        traffic: 1,
        rank: 0,
        seed: hash(wx, wy, 743) * 10,
        pond: true,
      },
    ];
  }
  if (c && bed(c)) {
    // A dry bed is the lowest ground about: it pools first and widest, and
    // in a wet winter runs half water.
    const wx = x + ox,
      wy = y + oy;
    if (hash(wx, wy, 731) > 0.15) return [];
    const r = 5 + hash(wx, wy, 733) * 5;
    const tilt = (hash(wx, wy, 735) - 0.5) * 0.8;
    return [
      {
        x: x * 16 + 3 + hash(wx, wy, 737) * 10,
        y: top + 3 + hash(wx, wy, 739) * 10,
        ax: Math.cos(tilt),
        ay: Math.sin(tilt),
        rx: r,
        ry: r * 0.58,
        traffic: 1,
        rank: 0.3 + hash(wx, wy, 707) * 0.6,
        seed: hash(wx, wy, 709) * 10,
      },
    ];
  }
  if (!c || !earth(c, c.height)) return [];
  const around = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ].filter(([dx, dy]) => earth(sample(x + dx, y + dy), c.height)).length;
  if (around < 3) return [];
  const road = (c.pathArt ?? []).reduce<PathStroke | undefined>(
    (best, s) => (s.radius > (best?.radius ?? 0) ? s : best),
    undefined,
  );
  const scape = c.landscape?.kind === "trample" ? c.landscape.strength : 0;
  const traffic = Math.min(1, Math.max(0.3, (road?.radius ?? 0) / 1.6, scape));
  const wx = x + ox,
    wy = y + oy;
  const rank = hash(wx, wy, 707),
    seed = hash(wx, wy, 709) * 10;
  const at = (tx: number, ty: number) => ({
    x: tx * 16,
    y: top + (ty - y) * 16,
  });

  if (road && road.radius > 0.95 && road.ruts !== false && hash(wx, wy, 715) < 0.06 + traffic * 0.08) {
    let ax = road.b[0] - road.a[0],
      ay = road.b[1] - road.a[1];
    const len = Math.hypot(ax, ay) || 1;
    ax /= len;
    ay /= len;
    // Project the cell centre onto the road, then walk across it to where
    // the painted rut runs (cross 0.34, as habitat-raster draws it).
    const px0 = x + road.a[0],
      py0 = y + road.a[1];
    const t = (x + 0.5 - px0) * ax + (y + 0.5 - py0) * ay;
    const cx = px0 + ax * t,
      cy = py0 + ay * t;
    const side = hash(wx, wy, 717) > 0.5 ? 1 : -1;
    let best: [number, number] | undefined,
      miss = 0.07;
    for (let k = 0.15; k <= 0.55; k += 0.04) {
      const tx = cx - ay * side * k * road.radius,
        ty = cy + ax * side * k * road.radius;
      const cross = Math.abs(pathField(sample, tx, ty, ox, oy).cross - 0.34);
      if (cross < miss) {
        miss = cross;
        best = [tx, ty];
      }
    }
    if (best && Math.floor(best[0]) === x && Math.floor(best[1]) === y) {
      const p = at(best[0], best[1]);
      return [
        {
          ...p,
          ax,
          ay,
          rx: 9 + hash(wx, wy, 719) * 7,
          ry: 2 + hash(wx, wy, 721) * 1.2,
          traffic,
          rank,
          seed,
        },
      ];
    }
  }

  // Pools stand on roads and trodden ground, not across every bare yard.
  if (!road && !scape) return [];
  if (hash(wx, wy, 701) > 0.008 + traffic * 0.022) return [];
  const px = 3 + Math.floor(hash(wx, wy, 703) * 10),
    py = 4 + Math.floor(hash(wx, wy, 705) * 9);
  // Water stands in the worn treadway, never in the turf beside it.
  if (pathField(sample, x + px / 16, y + py / 16, ox, oy).coverage < 0.75)
    return [];
  const r = 5 + hash(wx, wy, 723) * 4 + traffic * 4;
  const tilt = (hash(wx, wy, 725) - 0.5) * 0.6;
  return [
    {
      x: x * 16 + px,
      y: top + py,
      ax: Math.cos(tilt),
      ay: Math.sin(tilt),
      rx: r,
      // Seen from above at the oblique angle: flatter than wide.
      ry: r * 0.58,
      traffic,
      rank,
      seed,
    },
  ];
}

/** Rain running off the land and across a beach to the sea: thin channels
 * from the foot of a cliff or the top of the sand, wandering, splitting and
 * rejoining as they go. Drawn as chains of narrow hollows, so they fill and
 * dry with the weather like any puddle. */
function rivuletsFrom(
  sample: TopographySample,
  x: number,
  y: number,
  ox: number,
  oy: number,
  top: number,
): PuddleSpot[] {
  const c = sample(x, y)!;
  const wx = x + ox,
    wy = y + oy;
  const above = [sample(x, y - 1), sample(x - 1, y), sample(x + 1, y)];
  // A track often runs between the sand and the rock, so look a little past it.
  const foot = [sample(x, y - 2), sample(x - 2, y), sample(x + 2, y), ...above].some((n) => n && n.height > c.height);
  const head = above.some((n) => n && n.surface !== "sand" && n.surface !== "water" && n.height === c.height);
  if (!(head || foot) || hash(wx, wy, 751) > (foot ? 0.3 : 0.12)) return [];
  const lift = top - y * 16;
  const distance = (px: number, py: number) => {
    const n = sample(Math.floor(px / 16), Math.floor(py / 16));
    return !n || n.height !== c.height ? undefined : n.surface === "water" ? -1 : n.waterVisual?.distance;
  };
  const spots: PuddleSpot[] = [];
  const walk = (px: number, py: number, angle: number, depth: number, salt: number) => {
    for (let step = 0; step < 160 && spots.length < 400; step++) {
      const here = distance(px, py);
      if (here === undefined || here < 0.1) return;
      // Downhill is toward the water; the channel meanders about it.
      const gx = (distance(px + 16, py) ?? here) - (distance(px - 16, py) ?? here),
        gy = (distance(px, py + 16) ?? here) - (distance(px, py - 16) ?? here);
      const down = Math.atan2(-gy, -gx);
      const turn = Math.atan2(Math.sin(down - angle), Math.cos(down - angle));
      angle += turn * 0.25 + (hash(wx * 97 + step, wy * 89 + salt, 753) - 0.5) * 0.7;
      const ax = Math.cos(angle),
        ay = Math.sin(angle);
      spots.push({
        x: px, y: py + lift, ax, ay, rx: 2.4, ry: 1.1, traffic: 1,
        // Branches are shallower than the stem and show only in heavier rain.
        rank: 0.15 + depth * 0.25,
        seed: hash(step, salt, 755) * 10,
        rill: true,
      });
      px += ax * 2;
      py += ay * 2;
      // Splits come oftener as the sand flattens toward the sea.
      const fan = here < 1.5 ? 0.07 : 0.025;
      if (depth < 2 && hash(step, wx * 31 + wy + salt, 757) < fan)
        walk(px, py, angle + (hash(step, salt, 759) < 0.5 ? -0.6 : 0.6), depth + 1, salt * 7 + step);
    }
  };
  walk(x * 16 + 4 + hash(wx, wy, 761) * 8, y * 16 + 6, Math.PI / 2, 0, 1);
  return spots;
}

type Sky = { rgb: readonly [number, number, number]; rain: number };
function skyOf(weather: Weather | undefined): Sky {
  if (!weather) return { rgb: [120, 150, 170], rain: 0 };
  if (weather.night) return { rgb: [34, 42, 58], rain: weather.condition === "rain" ? 1 : 0 };
  switch (weather.condition) {
    case "rain":
      return { rgb: [104, 116, 124], rain: 1 };
    case "overcast":
    case "mist":
      return { rgb: [132, 140, 146], rain: 0 };
    case "snow":
      return { rgb: [156, 164, 170], rain: 0 };
    case "light-clouds":
      return { rgb: [142, 172, 192], rain: 0 };
    default:
      return { rgb: [118, 160, 196], rain: 0 };
  }
}

type Bucket = {
  image: Phaser.GameObjects.Image;
  texture: Phaser.Textures.CanvasTexture;
  x: number;
  y: number;
  w: number;
  h: number;
  /** How deep each pixel's hollow is, 0 flat to 1 the bottom of the rut. */
  depth: Float32Array;
  /** Water showing now, 0 none, 1 water, 2 ice. */
  surface: Uint8Array;
  /** Some water pixels, for rain to land on. */
  wet: number[];
  /** Water pixels only, to clip reflections to. */
  mask: Phaser.Textures.CanvasTexture;
  mirror: Phaser.GameObjects.Container;
};
type Ring = { x: number; y: number; at: number; r: number; bucket?: Bucket };
type Drop = { x: number; y: number; vx: number; vy: number; z: number; vz: number; at: number };
type Manager = {
  buckets: Set<Bucket>;
  state?: GroundState;
  sky: Sky;
  key?: string;
  rings: Ring[];
  drops: Drop[];
  ground?: Phaser.GameObjects.Graphics;
  air?: Phaser.GameObjects.Graphics;
  last: number;
  /** Upside-down figures standing in the water, and whether each was placed
   * this frame. */
  reflections: Map<string, { image: Phaser.GameObjects.Image; seen: boolean }>;
};
const managers = new WeakMap<Phaser.Scene, Manager>();
const manager = (scene: Phaser.Scene) => {
  let m = managers.get(scene);
  if (!m) {
    m = { buckets: new Set(), sky: skyOf(undefined), rings: [], drops: [], last: 0, reflections: new Map() };
    managers.set(scene, m);
    scene.events.once("shutdown", () => managers.delete(scene));
  }
  return m;
};

function paint(b: Bucket, state: GroundState | undefined, sky: Sky) {
  const ctx = b.texture.getContext();
  const image = ctx.createImageData(b.w, b.h);
  const data = image.data;
  b.surface.fill(0);
  b.wet = [];
  if (state) {
    // Even a downpour fills a hollow only to its rim; shallow ones stay small.
    const water = 1.02 - state.puddles * 0.62,
      mud = 1 - state.mud * 0.7;
    const kind = state.frozen ? 2 : 1;
    // A pond's depth is stored as 2 + its shape; rain only widens it.
    const pond = 0.3 - state.puddles * 0.2;
    for (let i = 0; i < b.depth.length; i++) {
      const d = b.depth[i];
      if (d >= 3 ? state.puddles > 0.05 && d - 3 > water : d >= 2 ? d - 2 > pond : state.puddles > 0.05 && d > water)
        b.surface[i] = kind;
    }
    const put = (i: number, r: number, g: number, bl: number, a: number) => {
      data[i * 4] = r;
      data[i * 4 + 1] = g;
      data[i * 4 + 2] = bl;
      data[i * 4 + 3] = a;
    };
    const [sr, sg, sb] = sky.rgb;
    for (let py = 0; py < b.h; py++)
      for (let px = 0; px < b.w; px++) {
        const i = py * b.w + px,
          d = b.depth[i];
        if (d <= 0 || px === 0 || py === 0 || px === b.w - 1 || py === b.h - 1) continue;
        const speck = hash(b.x + px, b.y + py, 713);
        const s = b.surface[i];
        if (d >= 3) {
          // Running water reflects the sky paler than a still pool, with a lit
          // edge, and a thin damp margin; out of the rain they are gone.
          const above = py > 0 && b.surface[i - b.w];
          if (s === 1) put(i, Math.min(255, sr * 0.7 + 60), Math.min(255, sg * 0.75 + 72), Math.min(255, sb * 0.8 + 84), above ? 220 : 255);
          else if (s === 2) put(i, 214, 224, 230, 230);
          else if (state.puddles > 0.05 && d - 3 > water - 0.25) put(i, 40, 30, 18, 45);
          continue;
        }
        if (s) {
          const above = py > 0 && b.surface[i - b.w],
            below = py < b.h - 1 && b.surface[i + b.w];
          if (s === 2) {
            if (!above || !below || speck > 0.93) put(i, 226, 234, 238, 255);
            else put(i, 164, 178, 186, 255);
            continue;
          }
          if (speck > 0.9 && b.wet.length < 400) b.wet.push(i);
          // Darker and bluer than the sky it mirrors, so it reads as water on
          // any soil rather than as a grey stone.
          const wr = sr * 0.78 + 26, wg = sg * 0.8 + 30, wb = sb * 0.8 + 36;
          // The near bank shades the water; the far lip catches the sky.
          if (!above) put(i, wr * 0.6, wg * 0.62, wb * 0.68, 235);
          else if (!below) put(i, Math.min(255, sr * 1.15 + 20), Math.min(255, sg * 1.15 + 22), Math.min(255, sb * 1.12 + 24), 255);
          else {
            // Sky caught in short level streaks, not single pixels.
            const streak = [0, 1, 2].some((k) => px >= k && hash(b.x + px - k, b.y + py, 713) > 0.986) &&
              !!b.surface[i - 3] && !!b.surface[i + 3];
            const deep = d > water + 0.3 ? 0.86 : 1;
            if (streak) put(i, Math.min(255, sr * 1.2 + 26), Math.min(255, sg * 1.2 + 28), Math.min(255, sb * 1.15 + 30), 255);
            else put(i, wr * deep, wg * deep, wb * deep, 225);
          }
        } else if (state.puddles > 0.05 && !state.frozen && d < 2 && d > water - 0.1) {
          // A rim of soaked soil round the water.
          put(i, 30, 21, 12, 90);
        } else if (d >= 2 || (state.mud > 0.05 && d > mud - (speck - 0.5) * 0.08)) {
          // Darkens whatever soil it lies on, so laterite and loess keep their
          // own colour when wet.
          if (state.frozen) put(i, 214, 222, 228, speck > 0.7 ? 170 : 90);
          else if (speck > 0.965) put(i, sr * 0.9, sg * 0.9, sb * 0.9, 110);
          else put(i, 30, 21, 12, d >= 2 ? 120 : d > mud + 0.15 ? 150 : 105);
        }
      }
  }
  ctx.putImageData(image, 0, 0);
  b.texture.refresh();
  const mctx = b.mask.getContext();
  const mask = mctx.createImageData(b.w, b.h);
  for (let i = 0; i < b.surface.length; i++) if (b.surface[i] === 1) mask.data[i * 4 + 3] = 255;
  mctx.putImageData(mask, 0, 0);
  b.mask.refresh();
}

/** A figure's upside-down double in the puddle it stands at, darkened to the
 * sky it lies under. Call each frame for everyone outdoors. */
export function reflectIn(scene: Phaser.Scene, id: string, body: Phaser.GameObjects.Image) {
  const m = managers.get(scene);
  if (!m?.state?.puddles || m.state.frozen || !body.visible) return;
  const feet = body.y + (1 - body.originY) * body.height;
  let bucket: Bucket | undefined;
  search: for (const b of m.buckets) {
    const c = b.image.parentContainer;
    const lx = Math.round(body.x - b.x - (c?.x ?? 0)),
      ly = Math.round(feet - b.y - (c?.y ?? 0));
    if (lx < -8 || ly < -4 || lx >= b.w + 8 || ly >= b.h + 4) continue;
    for (let dy = -2; dy <= 14; dy += 4)
      for (let dx = -6; dx <= 6; dx += 3) {
        const px = lx + dx,
          py = ly + dy;
        if (px >= 0 && py >= 0 && px < b.w && py < b.h && b.surface[py * b.w + px] === 1) {
          bucket = b;
          break search;
        }
      }
  }
  let r = m.reflections.get(id);
  if (!bucket) {
    if (r) r.image.setVisible(false);
    return;
  }
  if (!r) {
    r = { image: scene.add.image(0, 0, body.texture.key).setFlipY(true), seen: true };
    m.reflections.set(id, r);
  }
  r.seen = true;
  if (r.image.parentContainer !== bucket.mirror) bucket.mirror.add(r.image);
  const c = bucket.image.parentContainer;
  const [sr, sg, sb] = m.sky.rgb;
  r.image
    .setTexture(body.texture.key, body.frame.name)
    .setOrigin(body.originX, 0)
    .setFlipX(body.flipX)
    .setPosition(body.x - (c?.x ?? 0), feet - (c?.y ?? 0))
    .setTint(((sr * 0.8) << 16) | ((sg * 0.8) << 8) | (sb * 0.85))
    .setAlpha(0.55)
    .setVisible(true);
  bucket.mirror.setVisible(true);
}

/** The puddle under a world point, if one is showing there. */
export function puddleUnder(scene: Phaser.Scene, x: number, y: number, reach = 0) {
  const m = managers.get(scene);
  if (!m?.state?.puddles) return undefined;
  for (const b of m.buckets) {
    const c = b.image.parentContainer;
    const lx = Math.floor(x - b.x - (c?.x ?? 0)),
      ly = Math.floor(y - b.y - (c?.y ?? 0));
    if (lx < -reach || ly < -reach || lx >= b.w + reach || ly >= b.h + reach) continue;
    for (const [dx, dy] of [[0, 0], [reach, 0], [-reach, 0], [0, reach], [0, -reach]]) {
      const px = lx + dx,
        py = ly + dy;
      if (px < 0 || py < 0 || px >= b.w || py >= b.h) continue;
      const s = b.surface[py * b.w + px];
      if (s) return s === 2 ? "ice" : "water";
    }
  }
  return undefined;
}

/** Cheap to call every frame: the pixels change only when the ground does. */
export function setGroundState(
  scene: Phaser.Scene,
  state: GroundState | undefined,
  weather?: Weather,
) {
  const m = manager(scene);
  const sky = skyOf(weather);
  const key = state
    ? `${Math.round(state.mud * 20)}:${Math.round(state.puddles * 20)}:${state.frozen}:${sky.rgb}`
    : "";
  m.sky = sky;
  if (key === m.key) return;
  m.key = key;
  m.state = state;
  for (const b of m.buckets) paint(b, state, sky);
}

/** A foot coming down in standing water. */
export function splashPuddle(
  scene: Phaser.Scene,
  x: number,
  y: number,
  direction: number,
  run: boolean,
  depth: number,
  time: number,
) {
  const m = managers.get(scene);
  if (!m) return;
  // North, east, south, west.
  const [fx, fy] = [[0, -1], [1, 0], [0, 1], [-1, 0]][direction] ?? [0, 0];
  const n = run ? 8 : 4;
  for (let k = 0; k < n; k++) {
    const a = Math.random() * Math.PI * 2,
      v = (run ? 30 : 18) * (0.5 + Math.random());
    m.drops.push({
      x,
      y,
      vx: Math.cos(a) * v + fx * v * 0.8,
      vy: Math.sin(a) * v * 0.5 + fy * v * 0.4,
      z: 1,
      vz: (run ? 55 : 38) * (0.6 + Math.random() * 0.6),
      at: time,
    });
  }
  m.rings.push({ x, y, at: time, r: run ? 7 : 5 });
  m.air?.setDepth(depth + 0.05);
}

export function updatePuddles(scene: Phaser.Scene, time: number) {
  const m = managers.get(scene);
  if (!m) return;
  const dt = Math.min(0.1, Math.max(0, (time - m.last) / 1000));
  m.last = time;
  for (const [id, r] of m.reflections) {
    if (!r.seen || !r.image.active) {
      if (r.image.active) r.image.destroy();
      m.reflections.delete(id);
    }
    r.seen = false;
  }
  if (!m.rings.length && !m.drops.length && !m.sky.rain) {
    m.ground?.clear();
    m.air?.clear();
    return;
  }
  m.ground ??= scene.add.graphics().setDepth(-9998.4);
  m.air ??= scene.add.graphics().setDepth(0);
  const view = scene.cameras.main.worldView;
  if (m.sky.rain && m.state && !m.state.frozen && m.rings.length < 160)
    for (const b of m.buckets) {
      const c = b.image.parentContainer,
        bx = b.x + (c?.x ?? 0),
        by = b.y + (c?.y ?? 0);
      if (!b.wet.length || bx > view.right || by > view.bottom || bx + b.w < view.x || by + b.h < view.y)
        continue;
      let spawn = b.wet.length * dt * 0.6;
      while (spawn > 0 && (spawn >= 1 || Math.random() < spawn)) {
        const i = b.wet[Math.floor(Math.random() * b.wet.length)];
        m.rings.push({ x: bx + (i % b.w), y: by + Math.floor(i / b.w), at: time, r: 3, bucket: b });
        spawn--;
      }
    }
  const g = m.ground.clear();
  const [sr, sg, sb] = m.sky.rgb;
  const pale = (Math.min(255, sr + 90) << 16) | (Math.min(255, sg + 90) << 8) | Math.min(255, sb + 90);
  m.rings = m.rings.filter((r) => {
    const age = (time - r.at) / (r.bucket ? 600 : 800);
    if (age >= 1 || age < 0) return false;
    const rx = 1 + age * r.r,
      ry = rx * 0.5;
    g.fillStyle(pale, (1 - age) * 0.8);
    const steps = Math.max(6, Math.round(rx * 4));
    for (let k = 0; k < steps; k++) {
      const a = (k / steps) * Math.PI * 2;
      const px = Math.round(r.x + Math.cos(a) * rx),
        py = Math.round(r.y + Math.sin(a) * ry);
      const b = r.bucket;
      if (b) {
        const c = b.image.parentContainer,
          lx = px - b.x - (c?.x ?? 0),
          ly = py - b.y - (c?.y ?? 0);
        if (lx < 0 || ly < 0 || lx >= b.w || ly >= b.h || b.surface[ly * b.w + lx] !== 1) continue;
      }
      g.fillRect(px, py, 1, 1);
    }
    return true;
  });
  const air = m.air.clear();
  air.fillStyle(pale, 0.9);
  m.drops = m.drops.filter((d) => {
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    d.vz -= 240 * dt;
    d.z += d.vz * dt;
    if (d.z <= 0 || time - d.at > 900) return false;
    air.fillRect(Math.round(d.x), Math.round(d.y - d.z), 1, d.vz > 0 ? 2 : 1);
    return true;
  });
}

function shape(s: PuddleSpot, px: number, py: number) {
  const dx = px + 0.5 - s.x,
    dy = py + 0.5 - s.y;
  const u = (dx * s.ax + dy * s.ay) / s.rx,
    v = (-dx * s.ay + dy * s.ax) / s.ry;
  const a = Math.atan2(v, u);
  const wobble =
    1 +
    0.16 * Math.sin(a * 2 + s.seed) +
    0.1 * Math.sin(a * 3 + s.seed * 2.3) +
    // A rut fills in lengths, not as one clean trough.
    (s.rx > s.ry * 2.5 ? 0.22 * Math.sin(u * 4 + s.seed) : 0) +
    (hash(px, py, 711) - 0.5) * 0.14;
  const d = Math.hypot(u, v) / wobble;
  // A margin past the rim still takes mud.
  if (d > 1.5) return 0;
  if (s.pond) return 2 + 1.15 - d * 0.75;
  const strength = (1 - s.rank * 0.5) * (0.7 + 0.3 * s.traffic);
  // Rills are stored as 3 + their depth so the painter can tell them apart.
  return (s.rill ? 3 : 0) + strength * (1.15 - d * 0.75);
}

// Smooth maximum, so two puddles meet as one sheet rather than pinching at the join.
function merge(a: number, b: number) {
  // The blend lifts zero above zero, which would muddy the whole tile.
  if (a <= 0 || b <= 0 || a >= 2 || b >= 2) return Math.max(a, b);
  const k = 0.25,
    h = Math.max(0, Math.min(1, 0.5 + (b - a) / (2 * k)));
  return a + (b - a) * h + k * h * (1 - h);
}

export function addPuddles(scene: Phaser.Scene, spots: PuddleSpot[]) {
  if (!spots.length) return;
  const m = manager(scene);
  // Under the flowers, over the ground.
  const container = scene.add.container(0, 0).setDepth(-9998.5);
  const pad = (s: PuddleSpot) => Math.ceil(Math.max(s.rx, s.ry) * 1.6) + 2;
  // Tiles on a fixed grid, each taking every spot that reaches it, so neighbours share one outline.
  const groups = new Map<string, PuddleSpot[]>();
  for (const s of spots) {
    const p = pad(s);
    for (let cy = Math.floor((s.y - p) / BUCKET); cy <= Math.floor((s.y + p) / BUCKET); cy++)
      for (let cx = Math.floor((s.x - p) / BUCKET); cx <= Math.floor((s.x + p) / BUCKET); cx++) {
        const k = `${cx},${cy}`;
        groups.set(k, [...(groups.get(k) ?? []), s]);
      }
  }
  const buckets: Bucket[] = [];
  for (const [k, group] of groups) {
    const [cx, cy] = k.split(",").map(Number);
    // One pixel of apron past the tile so the rim test sees across the seam; paint leaves it clear.
    const x = Math.max(cx * BUCKET, Math.floor(Math.min(...group.map((s) => s.x - pad(s))))) - 1,
      y = Math.max(cy * BUCKET, Math.floor(Math.min(...group.map((s) => s.y - pad(s))))) - 1,
      w = Math.min((cx + 1) * BUCKET, Math.ceil(Math.max(...group.map((s) => s.x + pad(s))))) + 1 - x,
      h = Math.min((cy + 1) * BUCKET, Math.ceil(Math.max(...group.map((s) => s.y + pad(s))))) + 1 - y;
    const depth = new Float32Array(w * h);
    for (const s of group) {
      const p = pad(s);
      for (let py = Math.max(0, Math.floor(s.y - p - y)); py < Math.min(h, s.y + p - y); py++)
        for (let px = Math.max(0, Math.floor(s.x - p - x)); px < Math.min(w, s.x + p - x); px++) {
          const i = py * w + px;
          depth[i] = merge(depth[i], shape(s, px + x, py + y));
        }
    }
    const key = `puddles-${serial++}`;
    const texture = scene.textures.createCanvas(key, w, h)!;
    const image = scene.add.image(x, y, key).setOrigin(0);
    container.add(image);
    const mask = scene.textures.createCanvas(`${key}-mask`, w, h)!;
    const mirror = scene.add.container(0, 0).setVisible(false);
    // The mask stands where the bucket does, off the display list.
    mirror.setMask(scene.make.image({ x, y, key: `${key}-mask`, origin: 0 }, false).createBitmapMask());
    container.add(mirror);
    const b: Bucket = { image, texture, x, y, w, h, depth, surface: new Uint8Array(w * h), wet: [], mask, mirror };
    paint(b, m.state, m.sky);
    buckets.push(b);
    m.buckets.add(b);
  }
  container.once("destroy", () => {
    for (const b of buckets) {
      m.buckets.delete(b);
      for (const r of m.reflections.values())
        if (r.image.parentContainer === b.mirror) r.image.destroy();
      if (scene.textures.exists(b.texture.key)) scene.textures.remove(b.texture.key);
      if (scene.textures.exists(b.mask.key)) scene.textures.remove(b.mask.key);
    }
    m.rings = m.rings.filter((r) => !r.bucket || m.buckets.has(r.bucket));
  });
  return container;
}
