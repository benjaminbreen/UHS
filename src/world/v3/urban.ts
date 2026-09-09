import { civicProfile } from "../../content/settlements/civic";
import type { CivicProfile } from "../../content/settlements/civic/types";
import { urbanForm } from "../../content/settlements/urban-form";
import type { UrbanForm } from "../../content/settlements/urban-form/types";
import { urbanCapacity } from "../../content/settlements/scale";
import type { Pack, Point } from "../../core/types";
import { buildingModel, buildingModels } from "../../content/graphics/models";
import kit from "../../content/graphics/urban.json";
import { random } from "../../core/random";
import {
  composeUrban,
  nearestGate,
  urbanGates,
  type Block,
  type Gate,
  type Tier,
  type Wall,
} from "./blocks";
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

export type UrbanSurface = {
  /** Straight street with no graph search. Returns undefined on unusable ground. */
  lay(a: Point, b: Point, label: string, width: number): Road | undefined;
  dry(rect: Rect, occupied?: boolean): boolean;
  paintCourt(rect: Rect, square?: string): void;
  paintBlock(rect: Rect): void;
  /** Hold ground against any street laid later in the same pass. */
  reserveGround(rect: Rect): void;
  /** Stand the defensive circuit, before any street is laid through its gates. */
  buildWall(wall: Wall, parts: { x: number; y: number; frame: string }[]): void;
  /** Direction of open water, for fabrics whose public space faces it. */
  shore?: Point;
};

/** Urban house models this pack can build, capped at `storeys`. The kit's forms
 * run from a single-storey shop to a three-storey range; a fabric that never
 * built above one storey must not be handed the taller ones. */
export function urbanFrames(pack: Pack, storeys = Infinity): string[] {
  const forms = Object.entries(kit.forms)
    .filter(([, f]) => f.stories <= storeys)
    .map(([form]) => form);
  return pack.buildings.flatMap((base) =>
    forms
      .map((form) => `${base}-urban-${form}`)
      .filter((frame) => !!buildingModels[frame]),
  );
}

/** Composed as a town rather than a hamlet. The road layer and the planner both
 * ask this, so neither can drift from the other's idea of where a town is. */
export function urbanSite(site: Site, pack: Pack): boolean {
  return (
    !!pack.setting?.urbanRevision &&
    site.profile.radius >= 24 &&
    ["dense", "planned", "waterfront"].includes(site.profile.pattern) &&
    urbanFrames(pack, siteForm(site, pack).storeys).length > 0
  );
}

/** Where a through route from `from` should meet this settlement: a gate on the
 * built edge, or the centre for anything that has no built edge. A route that
 * aims at the centre of a town arrives as a boulevard through its main square. */
export function siteGate(
  site: Site,
  pack: Pack,
  from: Point,
): Gate | undefined {
  if (!urbanSite(site, pack) || (pack.setting?.urbanRevision ?? 0) < 2) return;
  return nearestGate(
    urbanGates(site.id, site.center, site.profile.radius, siteForm(site, pack)),
    site.center,
    from,
  );
}

/** The fabric this place and date imply, with the two overrides the player's own
 * choice of settlement form is allowed to make: an explicitly planned town is
 * regular whatever the region, and a waterfront turns its public space seaward. */
export function siteForm(site: Site, pack: Pack): UrbanForm {
  const form = urbanForm(pack.setting!);
  if (site.profile.pattern === "planned")
    return {
      ...form,
      plan: "orthogonal",
      regularity: Math.max(form.regularity, 0.9),
      deadEnds: form.deadEnds * 0.3,
      plaza: "crossing",
    };
  if (site.profile.pattern === "waterfront")
    return { ...form, plaza: "waterfront" };
  return form;
}

/** Composes one settlement's blocks, streets and street-facing parcels.
 *
 * Streets are laid before parcels and are straight by construction, so this
 * pass runs no graph search: cost is linear in blocks, not in ground area. A
 * failed terrain fit leaves open ground, never a building across a real road.
 */
export function urbanNeighborhood(
  site: Site,
  pack: Pack,
  seed: string,
  api: UrbanSurface,
): UrbanLot[] {
  const form = siteForm(site, pack);
  const frames = urbanFrames(pack, form.storeys);
  if (!frames.length) return [];
  const rand = (...keys: (string | number)[]) =>
    random(seed, site.id, "urban", ...keys);
  const layout = composeUrban(
    site.id,
    site.center,
    site.profile.radius,
    form,
    seed,
    api.shore && {
      x: api.shore.x - site.center.x,
      y: api.shore.y - site.center.y,
    },
  );
  const used = new Set<string>();
  const reserve = (r: Rect) => {
    for (let y = r.y; y < r.y + r.h; y++)
      for (let x = r.x; x < r.x + r.w; x++) used.add(cellKey(x, y));
  };
  const free = (r: Rect) => {
    for (let y = r.y; y < r.y + r.h; y++)
      for (let x = r.x; x < r.x + r.w; x++)
        if (used.has(cellKey(x, y))) return false;
    return true;
  };
  const fits = (r: Rect) => api.dry(r) && free(r);

  // The circuit stands before the streets, so a run that would cross it is
  // refused and only the gates let a road through.
  if (layout.wall) {
    const { rect, material, openings } = layout.wall;
    const corner = (p: Point) =>
      (p.x === rect.x || p.x === rect.x + rect.w - 1) &&
      (p.y === rect.y || p.y === rect.y + rect.h - 1);
    const beside = (p: Point, dx: number, dy: number) =>
      openings.has(cellKey(p.x + dx, p.y + dy));
    const parts = layout.wall.cells
      .filter((p) => api.dry({ ...p, w: 1, h: 1 }, false))
      .map((p) => {
        const vertical = p.x === rect.x || p.x === rect.x + rect.w - 1;
        const kind = corner(p)
          ? "corner"
          : // A jamb only reads as a jamb across a run; beside a vertical gate a
            // turret does the same work without a rotated sprite.
            vertical
            ? beside(p, 0, 1) || beside(p, 0, -1)
              ? "corner"
              : "run"
            : beside(p, 1, 0)
              ? "jamb"
              : beside(p, -1, 0)
                ? "jamb-left"
                : "run";
        return { ...p, frame: `wall-${material}-${kind}` };
      });
    if (parts.length) api.buildWall(layout.wall, parts);
  }

  // Streets first, widest first, so a junction takes the wider surface.
  for (const [i, s] of [...layout.streets]
    .sort((a, b) => a.tier - b.tier)
    .entries())
    api.lay(s.a, s.b, `street-${s.tier}-${i}`, form.tiers[s.tier]);

  const lots: UrbanLot[] = [];
  const civic = civicProfile(pack.setting!);
  const plaza = { ...layout.plaza };
  // The civic range takes the plaza's head before the square is painted, so the
  // square keeps its full depth in front of the building rather than behind it.
  const civicBase = pack.buildings.find(
    (base) => buildingModels[`${base}-urban-${civic.form}`],
  );
  if (civicBase) {
    // Sides in the order this fabric prefers, each tried at the middle of the
    // plaza edge and then to either side of it: an arterial meets the plaza at
    // its middle, so a range that insists on the centre never fits. The frame
    // has to match the side, or the entrance opens away from the square.
    const sides: readonly (readonly [number, number])[] =
      form.civic === "head"
        ? [
            [0, -1],
            [0, 1],
            [-1, 0],
            [1, 0],
          ]
        : [
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1],
          ];
    const candidates = sides.flatMap(([nx, ny]) => {
      const facing =
        nx > 0 ? "west" : nx < 0 ? "east" : ny > 0 ? "north" : "south";
      const base = `${civicBase}-urban-${civic.form}`;
      const frame = facing === "south" ? base : `${base}-${facing}`;
      if (!buildingModels[frame]) return [];
      const model = buildingModel(frame),
        [w, h] = model.footprint;
      return [0, 1, -1, 2, -2].map((step) => {
        const shift = step * (form.tiers[0] + 3);
        return {
          nx,
          ny,
          frame,
          model,
          rect: {
            x: nx
              ? nx < 0
                ? plaza.x - w - 1
                : plaza.x + plaza.w + 1
              : Math.floor(plaza.x + (plaza.w - w) / 2) + shift,
            y: ny
              ? ny < 0
                ? plaza.y - h - 1
                : plaza.y + plaza.h + 1
              : Math.floor(plaza.y + (plaza.h - h) / 2) + shift,
            w,
            h,
          },
        };
      });
    });
    const door = (c: (typeof candidates)[number]) => ({
      x: c.rect.x + c.model.entrance[0],
      y: c.rect.y + c.model.entrance[1],
    });
    const chosen = candidates.find(
      (c) => fits(c.rect) && free({ ...door(c), w: 1, h: 1 }),
    );
    if (chosen) {
      const point = door(chosen);
      lots.push({
        point,
        nx: chosen.nx,
        ny: chosen.ny,
        frame: chosen.frame,
        rect: chosen.rect,
        yard: chosen.rect,
        workPoint: point,
        civic,
      });
      reserve(chosen.rect);
      reserve({ ...point, w: 1, h: 1 });
      api.reserveGround(chosen.rect);
    }
  }
  api.paintCourt(plaza, civic.square);

  // Parcels are gathered per block, then taken a few at a time from each block
  // in turn. Filling one block at a time would spend the whole capacity on the
  // quarter nearest the plaza and leave the rest of the extent as open ground.
  // Blocks are not required to be uniformly buildable. Asking a whole block to
  // be level would discard nearly all of them on real ground; each parcel is
  // put to the terrain individually below.
  const ranks = [...layout.blocks]
    .sort((a, b) => a.reach - b.reach || a.x - b.x || a.y - b.y)
    .map((block) => ({ block, lots: blockLots(block), built: 0 }));
  const capacity = urbanCapacity(site.profile.radius, form);
  for (let round = 0; lots.length < capacity; round++) {
    let placed = false;
    for (const rank of ranks) {
      const lot = rank.lots[round];
      if (!lot) continue;
      placed = true;
      if (lots.length >= capacity) break;
      const door = { ...lot.point, w: 1, h: 1 };
      if (!fits(lot.rect) || !free(door) || !api.dry(door, false)) continue;
      lots.push(lot);
      rank.built++;
      reserve(lot.rect);
      // Holding the threshold stops the next range on a perpendicular edge from
      // taking a doorstep and cutting the household off from its own street.
      reserve(door);
    }
    if (!placed) break;
  }
  // Block ground is laid last, for the blocks that actually came to something.
  // Paving a block whose every parcel was refused leaves bare ground standing
  // where no street or building ever arrived.
  for (const rank of ranks)
    if (rank.built)
      api.paintBlock({
        x: rank.block.x - 1,
        y: rank.block.y - 1,
        w: rank.block.w + 2,
        h: rank.block.h + 2,
      });
  return lots;

  function blockLots(block: Block): UrbanLot[] {
    const court = {
      x: block.x + 4,
      y: block.y + 4,
      w: block.w - 8,
      h: block.h - 8,
    };
    // A court paints and reserves ground, so it has to respect what is already
    // standing there: the civic range is placed before any block is composed.
    if (block.court && court.w >= 3 && court.h >= 3 && free(court)) {
      // Every court needs a way in. A blind alley belongs to the compound; an
      // ordinary court opens onto the street it sits behind.
      const passage = block.lane ?? {
        a: { x: block.x + (block.w >> 1), y: block.y + block.h + 2 },
        b: { x: block.x + (block.w >> 1), y: court.y + court.h - 1 },
        tier: 2 as Tier,
      };
      if (api.lay(passage.a, passage.b, `court-${block.x}-${block.y}`, 0)) {
        const lo = Math.min(passage.a.y, passage.b.y),
          hi = Math.max(passage.a.y, passage.b.y);
        reserve({ x: passage.a.x - 1, y: lo, w: 3, h: hi - lo + 1 });
        api.paintCourt(court);
      }
    }
    // One material dominates a block, so a range reads as a range and not as a
    // row of unrelated houses.
    const dominant =
      frames[Math.floor(rand("range", block.x, block.y) * frames.length)];
    // `nx`/`ny` is the direction the entrance faces, matching the frontage
    // convention the planner already uses for road-side plots.
    const right = block.x + block.w,
      bottom = block.y + block.h;
    const edges = [
      { nx: 0, ny: 1, from: block.x, to: right, fixed: block.y },
      { nx: 0, ny: -1, from: block.x, to: right, fixed: bottom },
      { nx: 1, ny: 0, from: block.y, to: bottom, fixed: block.x },
      { nx: -1, ny: 0, from: block.y, to: bottom, fixed: right },
    ];
    const out: UrbanLot[] = [];
    for (const [e, edge] of edges.entries()) {
      let cursor = edge.from;
      while (cursor < edge.to - 4) {
        const choices = [...frames].sort(
          (a, b) =>
            rand(block.x, block.y, e, cursor, a) -
            (a === dominant ? 0.55 : 0) -
            (rand(block.x, block.y, e, cursor, b) -
              (b === dominant ? 0.55 : 0)),
        );
        let span = 1;
        // Bounded: the cheap geometry tests come first, and only the few best
        // frames are put to the terrain. Testing every frame at every position
        // would scan the ground thousands of times per block.
        let tried = 0;
        for (const base of choices) {
          if (tried >= 5) break;
          const facing =
            edge.nx > 0
              ? "west"
              : edge.nx < 0
                ? "east"
                : edge.ny > 0
                  ? "north"
                  : "south";
          const frame = facing === "south" ? base : `${base}-${facing}`;
          if (!buildingModels[frame]) continue;
          const model = buildingModel(frame),
            [w, h] = model.footprint;
          const rect = {
            x: edge.ny ? cursor : edge.nx > 0 ? edge.fixed : edge.fixed - w,
            y: edge.nx ? cursor : edge.ny > 0 ? edge.fixed : edge.fixed - h,
            w,
            h,
          };
          // A range lines the block's own edge; anything deeper than the block
          // would bury the court the passage was reserved for.
          if (edge.ny ? h > block.h - 2 : w > block.w - 2) continue;
          const along = edge.ny ? w : h;
          if (cursor + along > edge.to) continue;
          const point = {
            x: rect.x + model.entrance[0],
            y: rect.y + model.entrance[1],
          };
          tried++;
          // A wide range straddles a contour that a narrower one clears, so the
          // ground is asked here, while there is still another frame to try.
          if (
            !api.dry(rect, false) ||
            !api.dry({ ...point, w: 1, h: 1 }, false)
          )
            continue;
          out.push({
            point,
            nx: edge.nx,
            ny: edge.ny,
            frame,
            rect,
            yard: rect,
            workPoint: {
              x: point.x + (edge.ny ? 2 : -edge.nx),
              y: point.y + (edge.nx ? 2 : -edge.ny),
            },
          });
          span = along;
          break;
        }
        cursor += span;
      }
    }
    return out;
  }
}
