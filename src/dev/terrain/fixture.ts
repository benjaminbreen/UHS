import {
  directions,
  terrainStep,
  type TerrainPoint,
  type TopographyCell,
  type TopographySample,
} from "../../core/topography";
import { places } from "../../content/geography/places";
import { settingFor } from "../../content/geography/resolve";
import { packForSetting } from "../../content/geography/pack";
import { createSettlementWorld } from "../../world/v3/generate";
import type { landforms } from "../../content/ecology/profiles";
export type TerrainStudy = "meadow" | "contours";
export type ReliefOptions = {
  /** Atlas place id, so the study inherits a real climate and ecology. */
  place: string;
  landform: (typeof landforms)[number];
  seed: string;
};
export const defaultReliefOptions: ReliefOptions = {
  place: "umbria",
  landform: "ridge",
  seed: "relief-study",
};
/** Relief-bearing anchors, so the dropdown is not the whole atlas. */
export const reliefPlaces = [
  "umbria",
  "ethiopia",
  "athens",
  "cusco-city",
  "java",
  "catalhoyuk",
];
export type StudyProp = TerrainPoint & {
  frame: string;
  texture?: "topography" | "buildings";
  blocking?: boolean;
};
export type TerrainFixture = {
  width: number;
  height: number;
  cells: TopographyCell[];
  sample: TopographySample;
  props: StudyProp[];
  spawn: TerrainPoint;
  stops: Record<string, TerrainPoint>;
};
/** Cut a bounded window out of a real generated world. Candidate origins are
 * scored on how many tiers they hold and how many of their drops face away
 * from the camera, which is the case the art has to solve. */
function reliefWindow(width: number, height: number, o: ReliefOptions) {
  const place = places.find((p) => p.id === o.place) ?? places[0];
  const setting = settingFor(place);
  setting.environment = {
    ...setting.environment!,
    landform: o.landform,
    population: "none",
  };
  const world = createSettlementWorld(packForSetting(setting), o.seed);
  const topo = world.topography!;
  let best = { x: 0, y: 0, score: -1 };
  for (let gy = -2; gy <= 2; gy++)
    for (let gx = -2; gx <= 2; gx++) {
      const ox = gx * width,
        oy = gy * height;
      const seen = new Set<number>();
      let away = 0,
        water = 0;
      for (let y = 0; y < height; y += 2)
        for (let x = 0; x < width; x += 2) {
          const c = topo(ox + x, oy + y);
          if (!c) continue;
          if (c.surface === "water") water++;
          seen.add(c.height);
          const n = topo(ox + x, oy + y - 1);
          if (n && n.height < c.height) away++;
        }
      // Tier variety first, then away-facing drops; open water crowds out the
      // relief this study is for.
      const score = seen.size * 100 + away - water * 2;
      if (score > best.score) best = { x: ox, y: oy, score };
    }
  const cells: TopographyCell[] = [];
  let min = Infinity;
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const c = topo(best.x + x, best.y + y);
      const copy: TopographyCell = c
        ? { ...c }
        : { height: 0, surface: "grass" };
      cells.push(copy);
      if (copy.height < min) min = copy.height;
    }
  // Rebase to tier 0 so the strips the renderer allocates stay short and the
  // whole landform sits inside the study camera.
  if (min > 0 && min < Infinity)
    for (const c of cells) c.height = Math.max(0, c.height - min);
  const at = (x: number, y: number) => cells[y * width + x];
  const walkable = (x: number, y: number) => {
    const c = at(x, y);
    return c && c.surface !== "water" && !c.solid;
  };
  let spawn = { x: Math.floor(width / 2), y: Math.floor(height / 2) };
  if (!walkable(spawn.x, spawn.y))
    outer: for (let y = 1; y < height - 1; y++)
      for (let x = 1; x < width - 1; x++)
        if (walkable(x, y)) {
          spawn = { x, y };
          break outer;
        }
  // One stop per tier present, so every step is one click away.
  const stops: Record<string, TerrainPoint> = {};
  const taken = new Set<number>();
  for (let y = 1; y < height - 1; y++)
    for (let x = 1; x < width - 1; x++) {
      const c = at(x, y);
      if (!walkable(x, y) || taken.has(c.height)) continue;
      taken.add(c.height);
      stops[`Tier ${c.height}`] = { x, y };
    }
  return { cells, spawn, stops };
}

/** Fixed composition proves the art grammar. Stage two owns procedural landforms. */
export function terrainFixture(
  study: TerrainStudy,
  options?: ReliefOptions,
): TerrainFixture {
  const width = 36,
    height = 27;
  const cells: TopographyCell[] = Array.from(
    { length: width * height },
    () => ({ height: 1, surface: "grass" }),
  );
  const sample: TopographySample = (x, y) =>
    Number.isInteger(x) &&
    Number.isInteger(y) &&
    x >= 0 &&
    y >= 0 &&
    x < width &&
    y < height
      ? cells[y * width + x]
      : undefined;
  const set = (x: number, y: number, patch: Partial<TopographyCell>) =>
    Object.assign(sample(x, y)!, patch);
  const rect = (
    x: number,
    y: number,
    w: number,
    h: number,
    patch: Partial<TopographyCell>,
  ) => {
    for (let yy = y; yy < y + h; yy++)
      for (let xx = x; xx < x + w; xx++) set(xx, yy, patch);
  };
  const props: StudyProp[] = [];
  let spawn = { x: 17, y: 15 };
  let stops: Record<string, TerrainPoint>;
  if (study === "meadow") {
    const river = (y: number) => {
      const center =
        8 +
        Math.round(Math.sin((y - 3) * 0.36) * 1.4 + Math.sin(y * 0.13) * 0.8);
      const half = y >= 18 && y <= 23 ? 3 : 2;
      return { west: center - half, east: center + half };
    };
    // One broad rise, then a carved river corridor. Small boundary variation
    // perturbs the enclosing mass; it cannot turn a contour into a thin ribbon.
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const { west, east } = river(y);
        const rise =
          1 -
          Math.hypot((x - 35) / 12, (y - 2) / 15) +
          Math.sin(x * 0.4 + y * 0.2) * 0.015;
        const near = Math.min(Math.abs(x - west), Math.abs(x - east));
        set(x, y, { height: rise > 0 ? 2 : 1, surface: "grass" });
        if (x >= west && x <= east) {
          const shelf =
            x - west < (y >= 3 && y <= 9 ? 2 : 1) ||
            east - x < (y >= 18 ? 2 : 1);
          set(x, y, {
            height: 0,
            surface: "water",
            waterDepth: shelf ? "shallow" : "deep",
          });
        } else if (near < 4) {
          // Moisture forms pockets around bends and the drainage outlet.
          const pocket =
            Math.cos((y - 5) * 0.45) + Math.sin(x * 0.6 + y * 0.15);
          if (pocket > 0.1 && near < 3) set(x, y, { surface: "damp" });
          if (x > east && y >= 17 && y <= 22 && x <= east + 3)
            set(x, y, { height: 0, surface: "damp" });
        }
        if (Math.hypot((x - 32.5) / 2.5, (y - 5) / 3) < 1)
          set(x, y, { surface: "dry" });
      }
    // Dry bridge abutments support the deck at the settlement's height.
    const crossing = river(14);
    for (let x = crossing.west - 1; x <= crossing.east + 1; x++)
      set(x, 14, {
        height: 1,
        surface: x >= crossing.west && x <= crossing.east ? "water" : "soil",
        bridge: x >= crossing.west && x <= crossing.east,
      });
    // A visible two-tile-wide slope is the sole entrance to the broad rise.
    for (const x of [30, 31]) {
      set(x, 15, { height: 2, surface: "soil" });
      set(x, 16, { height: 1, surface: "soil", ramp: "n" });
      set(x, 17, { height: 1, surface: "soil" });
    }
    // A narrow accessible bank slope connects the lower floodplain.
    set(13, 18, { height: 0, surface: "gravel", ramp: "e" });
    set(14, 18, { height: 1, surface: "grass" });
    // Marsh pool: a wet surface pocket, not another cliff-enclosed platform.
    rect(18, 19, 4, 3, { height: 1, surface: "damp" });
    rect(19, 20, 2, 1, { height: 1, surface: "water", waterDepth: "shallow" });
    // Connected, shallow drainage follows the low side of the broad rise.
    const channel = [
      { x: 24, y: 9 },
      { x: 24, y: 11 },
      { x: 25, y: 11 },
      { x: 25, y: 13 },
      { x: 24, y: 13 },
      { x: 24, y: 15 },
      { x: 23, y: 15 },
      { x: 23, y: 16 },
      { x: 21, y: 16 },
      { x: 21, y: 17 },
      { x: 18, y: 17 },
      { x: 18, y: 18 },
      { x: 15, y: 18 },
    ];
    for (let i = 1; i < channel.length; i++) {
      let { x, y } = channel[i - 1];
      const to = channel[i];
      while (x !== to.x || y !== to.y) {
        if (sample(x, y)?.height === 1) set(x, y, { surface: "gravel" });
        if (x !== to.x) x += Math.sign(to.x - x);
        else y += Math.sign(to.y - y);
      }
      if (sample(x, y)?.height === 1) set(x, y, { surface: "gravel" });
    }
    props.push({ x: 7, y: 8, frame: "gravel-bar", texture: "topography" });
    // Pads and vegetation follow the finished landform.
    rect(16, 4, 5, 4, { height: 1, surface: "soil", solid: true });
    props.push({ x: 18, y: 7, frame: "house-mud-0", texture: "buildings" });
    rect(28, 19, 5, 4, { height: 1, surface: "soil", solid: true });
    props.push({ x: 30, y: 22, frame: "house-mud-1", texture: "buildings" });
    for (const [x, y] of [
      [2, 6],
      [2, 20],
      [17, 11],
      [24, 24],
      [33, 12],
      [16, 25],
    ]) {
      set(x, y, { solid: true });
      props.push({ x, y, frame: "oak", blocking: true });
    }
    for (const [y, side] of [
      [2, "e"],
      [3, "e"],
      [7, "w"],
      [8, "w"],
      [10, "e"],
      [18, "e"],
      [19, "e"],
      [22, "w"],
      [23, "w"],
    ] as const) {
      const edge = river(y);
      const x = side === "e" ? edge.east + 1 : edge.west - 1;
      if (!sample(x, y)?.solid) {
        set(x, y, { surface: "damp" });
        props.push({ x, y, frame: "reeds" });
      }
    }
    props.push({ x: 20, y: 20, frame: "reeds" });
    for (const [x, y] of [
      [17, 19],
      [22, 20],
      [2, 12],
      [15, 4],
      [24, 10],
      [27, 23],
      [15, 15],
      [22, 7],
    ])
      props.push({ x, y, frame: "bush" });
    for (const [x, y] of [
      [28, 4],
      [34, 6],
      [26, 11],
      [32, 24],
      [1, 24],
      [24, 15],
    ])
      props.push({ x, y, frame: "rock" });
    for (const [x, y] of [
      [14, 11],
      [16, 17],
      [23, 18],
      [24, 15],
      [23, 6],
      [19, 24],
      [28, 18],
      [3, 17],
      [26, 9],
      [29, 5],
      [32, 9],
    ])
      props.push({ x, y, frame: "tuft", texture: "topography" });
    rect(18, 9, 2, 3, { surface: "soil" });
    for (let y = 9; y < 12; y++)
      for (let x = 18; x < 20; x++) props.push({ x, y, frame: "wheat" });
    for (let y = 2; y < height - 1; y += 3)
      for (let x = 2; x < width - 1; x += 3) {
        const xx = x + ((x * 7 + y * 11) % 3) - 1,
          yy = y + ((x * 13 + y * 3) % 3) - 1;
        const c = sample(xx, yy);
        if (c?.surface === "grass" && !c.solid)
          props.push({ x: xx, y: yy, frame: "tuft", texture: "topography" });
      }
    for (const [x, y] of [
      [14, 5],
      [22, 10],
      [16, 16],
      [26, 18],
      [22, 24],
      [4, 11],
    ])
      props.push({ x, y, frame: "flowers" });
    stops = {
      "River crossing": { x: 2, y: 14 },
      "Raised terrace": { x: 29, y: 14 },
      "Upper ridge": { x: 32, y: 5 },
      "Damp meadow": { x: 13, y: 18 },
    };
    // Lay the paths through legal terrain edges after all footprints are known.
    // This keeps the road on the slope instead of painting over a cliff.
    const f = { width, height, cells, sample, props, spawn, stops };
    const junction = { x: 21, y: 14 };
    for (const target of [
      { x: 0, y: 14 },
      { x: 18, y: 8 },
      { x: 29, y: 18 },
      stops["Raised terrace"],
    ]) {
      for (const p of studyRoute(f, junction, target)) {
        const c = sample(p.x, p.y)!;
        if (c.surface !== "water") c.surface = "soil";
      }
    }
  } else {
    // Cut from the shipped generator rather than hand-drawn blocks, so the
    // study shows the relief, ecotones and slopes the game actually makes.
    const window = reliefWindow(width, height, options ?? defaultReliefOptions);
    for (let i = 0; i < cells.length; i++) cells[i] = window.cells[i];
    spawn = window.spawn;
    stops = window.stops;
  }
  return { width, height, cells, sample, props, spawn, stops };
}
/** Bounded fixture routing. Every expansion uses the same edge rule as keyboard input. */
export function studyRoute(
  f: TerrainFixture,
  from: TerrainPoint,
  to: TerrainPoint,
): TerrainPoint[] {
  const key = (p: TerrainPoint) => p.y * f.width + p.x;
  if (!f.sample(to.x, to.y)) return [];
  const queue = [from],
    parents = new Map<number, TerrainPoint>();
  parents.set(key(from), from);
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i];
    if (p.x === to.x && p.y === to.y) {
      const path: TerrainPoint[] = [];
      let q = p;
      while (key(q) !== key(from)) {
        path.push(q);
        q = parents.get(key(q))!;
      }
      return path.reverse();
    }
    for (const d of Object.values(directions)) {
      const q = { x: p.x + d.x, y: p.y + d.y };
      if (
        !f.sample(q.x, q.y) ||
        parents.has(key(q)) ||
        !terrainStep(f.sample, p, q).allowed
      )
        continue;
      parents.set(key(q), p);
      queue.push(q);
    }
  }
  return [];
}
