import { civicProfile } from "../../content/settlements/civic";
import type { CivicProfile } from "../../content/settlements/civic/types";
import type { Pack, Point } from "../../core/types";
import { buildingModel, buildingModels } from "../../content/graphics/models";
import kit from "../../content/graphics/urban.json";
import { random } from "../../core/random";
import { cellKey, type Rect, type Road, type Site } from "./types";

export type UrbanLot = {
  point: Point;
  nx: number;
  ny: number;
  frame: string;
  rect: Rect;
  yard: Rect;
  workPoint: Point;
  civic?: CivicProfile;
};
type Connect = (
  a: Point,
  b: Point,
  label: string,
  width?: number,
  area?: Rect,
) => Road | undefined;

export function urbanFrames(pack: Pack): string[] {
  return pack.buildings.flatMap((base) =>
    Object.keys(kit.forms)
      .map((form) => `${base}-urban-${form}`)
      .filter((frame) => !!buildingModels[frame]),
  );
}

/** Bounded neighborhood composition. Roads are routed before parcels are fitted;
 * a failed terrain fit leaves open ground, never a building across a real road.
 * Individual ranges enclose a walkable court instead of using a solid courtyard sprite.
 */
export function urbanNeighborhood(
  site: Site,
  pack: Pack,
  seed: string,
  connect: Connect,
  dry: (rect: Rect, occupied?: boolean) => boolean,
  paintCourt: (rect: Rect, square?: string) => void,
  paintBlock: (rect: Rect) => void,
): UrbanLot[] {
  const frames = urbanFrames(pack);
  if (!frames.length) return [];
  const rand = (...keys: (string | number)[]) =>
    random(seed, site.id, "urban", ...keys);
  const { x: cx, y: cy } = site.center;
  const planned = site.profile.pattern === "planned";
  const compact = site.profile.radius < 52;
  const xs = (compact ? [-17, 17] : [-38, 0, 36]).map(
    (n, i) =>
      cx +
      n +
      (planned || compact || i === 1 ? 0 : Math.floor(rand("x", i) * 7) - 3),
  );
  const ys = (compact ? [-17, 17] : [-35, 0, 37]).map(
    (n, i) =>
      cy +
      n +
      (planned || compact || i === 1 ? 0 : Math.floor(rand("y", i) * 9) - 4),
  );
  // Short bounded edges force actual loops: unrestricted road reuse would send
  // a cross street back around the first route, leaving no enclosed block.
  for (let y = 0; y < ys.length; y++)
    for (let x = 0; x < xs.length; x++) {
      const a = { x: xs[x], y: ys[y] };
      for (const [dx, dy] of [
        [1, 0],
        [0, 1],
      ]) {
        if (x + dx >= xs.length || y + dy >= ys.length) continue;
        const b = { x: xs[x + dx], y: ys[y + dy] };
        const area = {
          x: a.x - 4,
          y: a.y - 4,
          w: b.x - a.x + 9,
          h: b.y - a.y + 9,
        };
        connect(
          a,
          b,
          `urban-street-${x}-${y}-${dx}`,
          x === 1 && dy === 1 ? 2 : 1,
          area,
        );
      }
    }
  const lots: UrbanLot[] = [];
  const used = new Set<string>();
  const fits = (r: Rect) =>
    dry(r) &&
    !Array.from({ length: r.w * r.h }, (_, i) =>
      cellKey(r.x + (i % r.w), r.y + Math.floor(i / r.w)),
    ).some((k) => used.has(k));
  for (let by = 0; by < ys.length - 1; by++)
    for (let bx = 0; bx < xs.length - 1; bx++) {
      const left = xs[bx] + (bx === 1 ? 4 : 3),
        right = xs[bx + 1] - (bx === 0 ? 4 : 3);
      const top = ys[by] + 3,
        bottom = ys[by + 1] - 3;
      const court = {
        x: left + 9,
        y: top + 9,
        w: right - left - 18,
        h: bottom - top - 18,
      };
      if (court.w < 3 || court.h < 3 || !dry(court, false)) continue;
      // A two-cell passage is reserved before facades. It links the shared court
      // to the street and gives rear work areas an enduring public approach.
      const mid = {
        x: Math.floor(court.x + court.w / 2),
        y: Math.floor(court.y + court.h / 2),
      };
      if (
        !connect(
          mid,
          { x: mid.x, y: ys[by + 1] },
          `urban-alley-${bx}-${by}`,
          0,
          { x: mid.x - 1, y: mid.y, w: 3, h: ys[by + 1] - mid.y + 2 },
        )
      )
        continue;
      paintBlock({
        x: left - 1,
        y: top - 1,
        w: right - left + 2,
        h: bottom - top + 2,
      });
      const civic =
        bx === 0 && by === 0 ? civicProfile(pack.setting!) : undefined;
      if (civic) {
        // A civic range faces INTO the square, while ordinary ranges face streets.
        const base = pack.buildings.find(
          (base) => buildingModels[`${base}-urban-${civic.form}`],
        );
        if (base) {
          const frame = `${base}-urban-${civic.form}`;
          const m = buildingModel(frame),
            [w, h] = m.footprint;
          const rect = { x: Math.floor((left + right - w) / 2), y: top, w, h };
          if (fits(rect)) {
            const point = {
              x: rect.x + m.entrance[0],
              y: rect.y + m.entrance[1],
            };
            lots.push({
              point,
              nx: 0,
              ny: -1,
              frame,
              rect,
              yard: rect,
              workPoint: point,
              civic,
            });
            for (let y = rect.y; y < rect.y + h; y++)
              for (let x = rect.x; x < rect.x + w; x++) used.add(cellKey(x, y));
            court.x = left + 2;
            court.w = right - left - 4;
            court.y = top + h + 1;
            court.h = bottom - court.y - 2;
          }
        }
      }
      paintCourt(court, civic?.square);
      const edges = [
        { nx: 0, ny: 1, start: left, end: right, fixed: top },
        { nx: 0, ny: -1, start: left, end: right, fixed: bottom },
        { nx: 1, ny: 0, start: top + 8, end: bottom - 8, fixed: left },
        { nx: -1, ny: 0, start: top + 8, end: bottom - 8, fixed: right },
      ];
      for (const [edge, e] of edges.entries()) {
        let cursor = e.start;
        while (cursor < e.end - 4) {
          const choices = [...frames].sort(
            (a, b) =>
              rand(bx, by, edge, cursor, a) - rand(bx, by, edge, cursor, b),
          );
          let placed = false;
          for (const base of choices) {
            const facing =
              e.nx > 0
                ? "west"
                : e.nx < 0
                  ? "east"
                  : e.ny > 0
                    ? "north"
                    : "south";
            const frame = facing === "south" ? base : `${base}-${facing}`;
            const m = buildingModel(frame),
              [w, h] = m.footprint;
            const rect = {
              x: e.ny ? cursor : e.nx > 0 ? e.fixed : e.fixed - w,
              y: e.nx ? cursor : e.ny > 0 ? e.fixed : e.fixed - h,
              w,
              h,
            };
            const span = e.ny ? w : h;
            if (cursor + span > e.end || !fits(rect)) continue;
            const door = {
              x: rect.x + m.entrance[0],
              y: rect.y + m.entrance[1],
            };
            // Keep thresholds and service pockets on the street-facing strip.
            const workPoint = {
              x: door.x + (e.ny ? 2 : -e.nx),
              y: door.y + (e.nx ? 2 : -e.ny),
            };
            if (!dry({ x: door.x, y: door.y, w: 1, h: 1 }, false)) continue;
            lots.push({
              point: door,
              nx: e.nx,
              ny: e.ny,
              frame,
              rect,
              yard: rect,
              workPoint,
            });
            for (let y = rect.y; y < rect.y + h; y++)
              for (let x = rect.x; x < rect.x + w; x++) used.add(cellKey(x, y));
            cursor += span;
            placed = true;
            break;
          }
          if (!placed) cursor++;
        }
      }
    }
  return lots;
}
