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
    (x, y) => api.dry({ x, y, w: 1, h: 1 }, false),
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
  /** Inside the defensive circuit, where there is one. */
  const within = (r: Point | Rect) => {
    if (!layout.wall) return true;
    const w = "w" in r ? r.w - 1 : 0,
      h = "h" in r ? r.h - 1 : 0;
    return [
      [r.x, r.y],
      [r.x + w, r.y],
      [r.x, r.y + h],
      [r.x + w, r.y + h],
    ].every(([x, y]) => layout.holds(x, y, 1));
  };

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
    if (parts.length) {
      api.buildWall(layout.wall, parts);
      // The ring is rasterised, so it does not sit exactly on the continuous
      // boundary. Holding its actual cells is what keeps a threshold or a work
      // pocket off the wall, where a margin against the boundary would not.
      for (const part of parts) used.add(cellKey(part.x, part.y));
    }
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
  for (const rank of ranks) {
    if (lots.length >= capacity) break;
    for (const lot of rank.lots) {
      if (lots.length >= capacity) break;
      const door = { ...lot.point, w: 1, h: 1 },
        work = { ...lot.workPoint, w: 1, h: 1 };
      if (
        !fits(lot.rect) ||
        !free(door) ||
        !free(work) ||
        !api.dry(door, false)
      )
        continue;
      // A block may overhang the circuit; a household may not. A threshold or
      // work pocket outside the wall has no way back in but the long way round
      // to a gate, and the work pocket sits two cells clear of the door.
      if (!within(lot.point) || !within(lot.rect) || !within(lot.workPoint))
        continue;
      lots.push(lot);
      rank.built++;
      reserve(lot.rect);
      // Hold the threshold and the work pocket in front of it. A later range on
      // the row behind can otherwise stand on ground this household needs, and
      // a work point inside a wall is a resident who cannot reach their work.
      reserve(door);
      reserve(work);
    }
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

  /** Terraced rows, not a ring of ranges around a void.
   *
   * A block's depth is spent by the rows on its long sides: put an 8x6 house on
   * the top edge of a 26x18 block and another on the bottom, and the 6 cells
   * left in the middle are too shallow for the side edges to hold anything at
   * all. Filling the block as back-to-back pairs of rows instead uses the whole
   * depth, which is also how a terraced street was actually built, and roughly
   * doubles what a block holds. The gap between pairs is a lane, widened into a
   * court where the fabric wants one. Ends of rows are party walls, so the
   * short sides carry no separate range. */
  function blockLots(block: Block): UrbanLot[] {
    const out: UrbanLot[] = [];
    const deepest = Math.max(
      ...frames.map((f) => buildingModel(f).footprint[1]),
    );
    const gap = block.court ? 3 : 1;
    let top = block.y;
    for (let band = 0; top + deepest <= block.y + block.h; band++) {
      const room = block.y + block.h - top;
      const paired = room >= deepest * 2;
      // The first row of a pair opens onto whatever lies above it; the second
      // backs onto the first and opens onto the lane below.
      out.push(...terrace(block, top, 1, band));
      if (paired) out.push(...terrace(block, top + deepest, -1, band + 100));
      top += (paired ? deepest * 2 : deepest) + gap;
      if (top + deepest <= block.y + block.h) {
        // A lane between pairs runs the full width, so it meets the streets at
        // both ends of the block and nothing behind it is landlocked.
        const lane = { x: block.x - 1, y: top - Math.ceil(gap / 2) };
        api.lay(
          lane,
          { x: block.x + block.w, y: lane.y },
          `row-${block.x}-${lane.y}`,
          0,
        );
        if (block.court)
          api.paintCourt({ x: block.x, y: top - gap, w: block.w, h: gap });
      }
    }
    return out;
  }

  /** One row of houses along a block, all opening the same way. */
  function terrace(
    block: Block,
    top: number,
    ny: number,
    key: number,
  ): UrbanLot[] {
    const out: UrbanLot[] = [];
    const dominant =
      frames[Math.floor(rand("range", block.x, block.y, key) * frames.length)];
    let cursor = block.x;
    while (cursor < block.x + block.w - 4) {
      const choices = [...frames].sort(
        (a, b) =>
          rand(block.x, top, cursor, a) -
          (a === dominant ? 0.55 : 0) -
          (rand(block.x, top, cursor, b) - (b === dominant ? 0.55 : 0)),
      );
      let span = 1,
        tried = 0;
      for (const base of choices) {
        // Bounded: only the few best frames are put to the ground. Testing
        // every frame at every position would scan the block many times over.
        if (tried >= 5) break;
        const frame = ny > 0 ? `${base}-north` : base;
        if (!buildingModels[frame]) continue;
        const model = buildingModel(frame),
          [w, h] = model.footprint;
        if (top + h > block.y + block.h || cursor + w > block.x + block.w)
          continue;
        const rect = { x: cursor, y: top, w, h };
        const point = {
          x: rect.x + model.entrance[0],
          y: rect.y + model.entrance[1],
        };
        tried++;
        // A wide range straddles a contour a narrower one clears, so the ground
        // is asked here, while there is still another frame to try.
        if (!api.dry(rect, false) || !api.dry({ ...point, w: 1, h: 1 }, false))
          continue;
        out.push({
          point,
          nx: 0,
          ny,
          frame,
          rect,
          yard: rect,
          workPoint: { x: point.x, y: point.y - ny },
        });
        span = w;
        break;
      }
      cursor += span;
    }
    return out;
  }
}
