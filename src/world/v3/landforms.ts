import { trimCache } from "../../core/cache";
import { bankOffset } from "./wet-features";
import { noise } from "../geography/noise";
import { random } from "../../core/random";
import type { WorldSetting } from "../../content/geography/types";

const STEP = 12,
  REACH = 384,
  COUNT = REACH / STEP;
/** One deterministic coarse plan per river reach. Endpoints are shared world-coordinate
 * anchors, so requesting neighboring reaches in any order produces the same channel. */
export function regionalLandforms(
  s: WorldSetting,
  seed: string,
  formAt?: (
    x: number,
    y: number,
  ) => NonNullable<WorldSetting["environment"]>["landform"],
) {
  const angle = random(seed, "land-angle") * Math.PI * 2;
  const reaches = new Map<number, number[]>();
  const heights = new Map<number, number>();
  const field = (x: number, y: number) => {
    const key = x * 2097152 + y;
    const old = heights.get(key);
    if (old !== undefined) return old;
    const wx = x + (noise(seed, x, y, 95, "warp-x") - 0.5) * 62,
      wy = y + (noise(seed, x, y, 110, "warp-y") - 0.5) * 62;
    const u = wx * Math.cos(angle) + wy * Math.sin(angle),
      v = -wx * Math.sin(angle) + wy * Math.cos(angle);
    const broad =
      noise(seed, u, v, 105, "landmass") * 0.72 +
      noise(seed, u, v, 43, "shoulders") * 0.28;
    const form = formAt?.(x, y) ?? s.environment!.landform;
    const h =
      form === "plain"
        ? 0.45 + (broad - 0.5) * 0.23
        : form === "ridge"
          ? 0.23 +
            noise(seed, u, v * 0.28, 62, "ridge-spine") * 0.48 +
            (broad - 0.5) * 0.24
          : form === "basin"
            ? 0.28 +
              (formAt
                ? noise(seed, u, v, 170, "basins") * 0.4
                : Math.min(0.4, Math.hypot(u / 105, v / 82) * 0.22)) +
              (broad - 0.5) * 0.38
            : 0.15 + broad * 0.7;
    trimCache(heights, 65536);
    heights.set(key, h);
    return h;
  };
  const desired = (t: number) =>
    -37 +
    (noise(seed, t + 173, 0, 165, "river-corridor") - 0.5) * 60 +
    (noise(seed, t + 29, 0, 43, "river-bends") - 0.5) * 62 +
    (noise(seed, t + 37, 0, 19, "river-inflections") - 0.5) * 8;
  const anchor = (t: number) => Math.round(desired(t) / 4) * 4;
  const reach = (index: number) => {
    const old = reaches.get(index);
    if (old) return old;
    const start = index * REACH,
      xs = Array.from({ length: 41 }, (_, i) => -116 + i * 4);
    let cost = xs.map((x) => (x === anchor(start) ? 0 : Infinity));
    const parents: number[][] = [];
    for (let row = 1; row <= COUNT; row++) {
      const t = start + row * STEP,
        next = xs.map(() => Infinity),
        parent = xs.map(() => -1);
      for (let j = 0; j < xs.length; j++) {
        if (row === COUNT && xs[j] !== anchor(t)) continue;
        const x = s.water === "river-ew" ? t : xs[j],
          y = s.water === "river-ew" ? xs[j] : t;
        const terrain =
          field(x, y) * 5 + Math.pow((xs[j] - desired(t)) / 15, 2);
        for (
          let k = Math.max(0, j - 3);
          k <= Math.min(xs.length - 1, j + 3);
          k++
        ) {
          const score = cost[k] + terrain + Math.pow(j - k, 2) * 0.22;
          if (score < next[j]) {
            next[j] = score;
            parent[j] = k;
          }
        }
      }
      parents.push(parent);
      cost = next;
    }
    let j = xs.indexOf(anchor(start + REACH));
    const points = [xs[j]];
    for (let row = COUNT - 1; row >= 0; row--) {
      j = parents[row][j];
      points.push(xs[j]);
    }
    points.reverse();
    // Round angular coarse turns while preserving shared reach endpoints.
    const smooth = points.map((v, i) =>
      i === 0 || i === COUNT ? v : (points[i - 1] + v * 2 + points[i + 1]) / 4,
    );
    if (reaches.size >= 24) reaches.delete(reaches.keys().next().value!);
    reaches.set(index, smooth);
    return smooth;
  };
  const point = (node: number) => {
    const t = node * STEP,
      i = Math.floor(t / REACH);
    return { along: t, across: reach(i)[node - i * COUNT] };
  };
  const river = (x: number, y: number) => {
    const along = s.water === "river-ew" ? x : y,
      across = s.water === "river-ew" ? y : x;
    const node = Math.floor(along / STEP);
    let distance = Infinity,
      nearest = along,
      side = 1,
      tangent = 0;
    for (let n = node - 2; n <= node + 2; n++) {
      const a = point(n),
        b = point(n + 1),
        dx = b.across - a.across;
      const t = Math.max(
        0,
        Math.min(
          1,
          ((along - a.along) * STEP + (across - a.across) * dx) /
            (STEP * STEP + dx * dx),
        ),
      );
      const d = Math.hypot(
        along - a.along - t * STEP,
        across - a.across - t * dx,
      );
      if (d < distance) {
        distance = d;
        tangent = dx / STEP;
        nearest = a.along + t * STEP;
        side = Math.sign(across - a.across - t * dx) || 1;
      }
    }
    const bank = noise(seed, nearest + 37, side * 87, 31, "river-bank");
    const width =
      4 +
      noise(seed, nearest + 11, 0, 76, "river-width") * 4 +
      bank * 2 +
      bankOffset(seed, nearest, side);
    return {
      water:
        distance - width + (noise(seed, x, y, 15, "bank-chips") - 0.5) * 0.6,
      waterFlow: (s.water === "river-ew"
        ? [1, tangent]
        : [tangent, 1]) as readonly [number, number],
      floodplain: 0.7 + noise(seed, nearest, side * 131, 47, "floodplain") * 12,
      shoreWidth:
        0.8 + bank * 2.8 + Math.max(0, -bankOffset(seed, nearest, side)) * 0.55,
      // A carved longitudinal bed drops monotonically along the selected outflow.
      bed: -nearest * 0.002 - 2,
    };
  };
  return { field, river, point, reachCount: () => reaches.size };
}
