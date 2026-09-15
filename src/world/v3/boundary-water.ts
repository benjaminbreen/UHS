import type { WorldSetting } from "../../content/geography/types";
import {
  edgePoint,
  outward,
  type EdgeRange,
  type WaterCrossing,
} from "../travel/water-edges";
import { noise } from "../geography/noise";

type Water = {
  water: number;
  kind: "sea" | "river" | "lake";
  waterFlow: readonly [number, number];
  shoreWidth: number;
  floodplain: number;
};
type Port = {
  edge: EdgeRange;
  crossing: WaterCrossing;
  width: number;
  point: number[];
};
type Channel = {
  port: Port;
  points: number[][];
  lake: boolean;
  spring: boolean;
};
export function boundaryWater(
  s: WorldSetting,
  seed: string,
  native: (x: number, y: number) => Water,
  height: (x: number, y: number) => number,
) {
  const map = s.playableMap;
  const ports: Port[] =
    map?.exits.flatMap((e) =>
      e.seam
        ? (e.waterways ?? []).map((crossing) => ({
            edge: e.seam!,
            crossing,
            width:
              crossing.width * (map.size - 1) * (e.seam!.end - e.seam!.start),
            point: edgePoint(map.size, e.seam!, crossing.at),
          }))
        : [],
    ) ?? [];
  let channels: Channel[] | undefined;
  type Stroke = { a: number[]; b: number[]; width: number; sign: number };
  const buckets = new Map<string, Stroke[]>();
  const lakes: { end: number[]; radius: number }[] = [];
  function prepare() {
    if (channels) return channels;
    channels = [];
    if (!map || !ports.length) return channels;
    const targets: number[][] = [];
    let hollow = [0, 0],
      lowest = Infinity;
    for (let y = -map.size / 2 + 32; y < map.size / 2 - 32; y += 8)
      for (let x = -map.size / 2 + 32; x < map.size / 2 - 32; x += 8) {
        if (native(x, y).water < -2) targets.push([x, y]);
        const h = height(x, y) + Math.hypot(x, y) * 0.0005;
        if (h < lowest) {
          lowest = h;
          hollow = [x, y];
        }
      }
    const outlet = ports.find((p) => p.crossing.flow > 0);
    for (const port of ports) {
      const start = port.point;
      const target = targets.reduce<number[] | undefined>(
        (best, p) =>
          !best ||
          Math.hypot(p[0] - start[0], p[1] - start[1]) <
            Math.hypot(best[0] - start[0], best[1] - start[1])
            ? p
            : best,
        undefined,
      );
      const end = target ?? (outlet && outlet !== port ? outlet.point : hollow);
      const normal = outward(port.edge.side);
      const c1 = [start[0] - normal[0] * 24, start[1] - normal[1] * 24];
      const c2 = [(c1[0] + end[0]) / 2, (c1[1] + end[1]) / 2];
      const points: number[][] = [];
      const length = Math.hypot(end[0] - start[0], end[1] - start[1]);
      const count = Math.max(12, Math.ceil(length / 3));
      for (let i = 0; i <= count; i++) {
        const t = i / count,
          u = 1 - t;
        const bend =
          (noise(
            seed,
            (i / count) * length,
            port.crossing.at * 100,
            40,
            "edge-channel",
          ) -
            0.5) *
          10 *
          Math.sin(Math.PI * t) ** 2;
        points.push([
          u ** 3 * start[0] +
            3 * u * u * t * c1[0] +
            3 * u * t * t * c2[0] +
            t ** 3 * end[0] -
            normal[1] * bend,
          u ** 3 * start[1] +
            3 * u * u * t * c1[1] +
            3 * u * t * t * c2[1] +
            t ** 3 * end[1] +
            normal[0] * bend,
        ]);
      }
      channels.push({
        port,
        points,
        lake: !target && !outlet,
        spring: !target && outlet === port,
      });
    }
    for (const channel of channels) {
      const { points, port } = channel;
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1],
          b = points[i];
        const width = channel.spring
          ? Math.max(0.55, port.width * (1 - i / (points.length - 1)))
          : port.width;
        const stroke = { a, b, width, sign: -port.crossing.flow };
        const margin = width + 24;
        for (
          let gy = Math.floor((Math.min(a[1], b[1]) - margin) / 16);
          gy <= Math.floor((Math.max(a[1], b[1]) + margin) / 16);
          gy++
        )
          for (
            let gx = Math.floor((Math.min(a[0], b[0]) - margin) / 16);
            gx <= Math.floor((Math.max(a[0], b[0]) + margin) / 16);
            gx++
          ) {
            const key = `${gx},${gy}`,
              list = buckets.get(key) ?? [];
            list.push(stroke);
            buckets.set(key, list);
          }
      }
      if (channel.lake)
        lakes.push({
          end: points.at(-1)!,
          radius: Math.max(8, port.width * 2),
        });
    }
    return channels;
  }
  return (x: number, y: number, base: Water): Water => {
    if (!map || !ports.length || (base.kind === "sea" && base.water < 0))
      return base;
    let water = base.water,
      flow = base.waterFlow,
      kind = base.kind;
    prepare();
    for (const { a, b, width, sign } of buckets.get(
      `${Math.floor(x / 16)},${Math.floor(y / 16)}`,
    ) ?? []) {
      const dx = b[0] - a[0],
        dy = b[1] - a[1],
        length2 = dx * dx + dy * dy || 1;
      const t = Math.max(
        0,
        Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / length2),
      );
      const distance = Math.hypot(x - a[0] - dx * t, y - a[1] - dy * t) - width;
      if (distance < water) {
        water = distance;
        kind = "river";
        const length = Math.sqrt(length2);
        flow = [(dx / length) * sign, (dy / length) * sign];
      }
    }
    for (const { end, radius } of lakes) {
      const distance = Math.hypot((x - end[0]) / 1.5, y - end[1]) - radius;
      if (distance < water) {
        water = distance;
        kind = "lake";
        flow = [0, 0];
      }
    }
    for (const e of map.exits) {
      if (!e.seam || !e.waterways?.length) continue;
      const edge = e.seam;
      const horizontal = edge.side === "N" || edge.side === "S";
      const along = horizontal ? x : y;
      const u = (along + map.size / 2) / (map.size - 1);
      if (u < edge.start || u > edge.end) continue;
      const depth =
        edge.side === "N"
          ? y + map.size / 2
          : edge.side === "S"
            ? map.size / 2 - 1 - y
            : edge.side === "W"
              ? x + map.size / 2
              : map.size / 2 - 1 - x;
      if (depth < 0 || depth >= 20) continue;
      const length = (map.size - 1) * (edge.end - edge.start);
      const t = (u - edge.start) / (edge.end - edge.start);
      const p = e.waterways.reduce((a, b) =>
        Math.abs(t - a.at) - a.width < Math.abs(t - b.at) - b.width ? a : b,
      );
      const desired = (Math.abs(t - p.at) - p.width) * length;
      const f = Math.min(1, depth / 20),
        weight = 1 - f * f * (3 - 2 * f);
      water = water * (1 - weight) + Math.min(32, desired) * weight;
      if (weight > 0.5) {
        const n = outward(edge.side);
        flow = [n[0] * p.flow, n[1] * p.flow];
        kind = "river";
      }
    }
    return {
      ...base,
      water,
      waterFlow: flow,
      kind,
      floodplain: Math.max(base.floodplain, 5),
    };
  };
}
