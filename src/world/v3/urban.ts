import { civicProfile } from "../../content/settlements/civic";
import type { CivicProfile } from "../../content/settlements/civic/types";
import {
  religiousProfile,
  religiousScale,
} from "../../content/settlements/religious";
import type { ReligiousProfile } from "../../content/settlements/religious/types";
import { urbanForm } from "../../content/settlements/urban-form";
import type { UrbanForm } from "../../content/settlements/urban-form/types";
import { urbanBuildingLimit } from "../../content/settlements/scale";
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
  type Furniture,
} from "./blocks";
import { cellKey, type Rect, type Road, type Site } from "./types";

/** What a block is for. Decides which house forms stand on it, what its
 * residents do and how the planner names their doors. */
export type Quarter = "market" | "craft" | "elite" | "residential" | "edge";

export type UrbanLot = {
  point: Point;
  quarter?: Quarter;
  nx: number;
  ny: number;
  frame: string;
  rect: Rect;
  yard: Rect;
  workPoint: Point;
  civic?: CivicProfile;
  religious?: ReligiousProfile & { scale: "small" | "medium" | "large" };
};

export type UrbanSurface = {
  /** Straight street with no graph search. Returns undefined on unusable ground. */
  lay(a: Point, b: Point, label: string, span: number): Road | undefined;
  dry(rect: Rect, occupied?: boolean): boolean;
  paintCourt(rect: Rect, square?: string, civic?: Rect): void;
  /** Paved apron between a sanctuary and the square. */
  paintForecourt(rect: Rect): void;
  /** A further square at a crossing: paved like the main one, with a lesser
   * centrepiece and corners from the same spec. */
  paintSquare(rect: Rect, index: number): void;
  /** Planted strip beside an arterial. */
  paintVerge(rect: Rect): void;
  /** Sidewalk just beyond a planted arterial strip. */
  paintVergeWalk(rect: Rect): void;
  /** A small public green or deliberately undeveloped lot. */
  paintPark(rect: Rect, index: number): void;
  /** A lamp, street tree or planter on the cell. */
  furnish(piece: Furniture): void;
  /** Base ground of the built-up area: beaten earth or paving, with grass
   * left only where something plants it. */
  paintCity(holds: (x: number, y: number) => boolean): void;
  paintBlock(rect: Rect): void;
  /** Hold ground against any street laid later in the same pass. */
  reserveGround(rect: Rect): void;
  /** Stand the defensive circuit, before any street is laid through its gates. */
  buildWall(wall: Wall, parts: { x: number; y: number; frame: string }[]): void;
  /** Direction of open water, for fabrics whose public space faces it. */
  shore?: Point;
  /** Land within two cells of water, where a quay and its street can stand. */
  bank?(x: number, y: number): boolean;
  /** Paved strip between a riverside street and the water. */
  paintQuay?(rect: Rect): void;
  /** Where a bridge meets this bank; an offset square gathers at it. */
  bridge?: Point;
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
    (["dense", "planned", "waterfront"].includes(site.profile.pattern) ||
      pack.setting?.settlement === "city" ||
      pack.setting?.settlement === "port") &&
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
  const modern = (pack.setting?.year ?? 0) >= 1900;
  type CandidateRecipe = {
    base: string;
    model: ReturnType<typeof buildingModel>;
    kind: string;
    group: string;
  };
  // Candidate buildings are deliberately kept out of the normal urban kit:
  // they are a second-pass infill vocabulary, not substitutes for the city's
  // larger apartment, office and shop forms.
  const candidateBases: CandidateRecipe[] = modern
    ? Object.entries(buildingModels)
        .filter(([frame, model]) => {
          const meta = model as { candidate?: boolean };
          return (
            meta.candidate === true &&
            !/(?:-north|-east|-west)$/.test(frame)
          );
        })
        .map(([base, model]) => {
          const meta = model as {
            candidateType?: string;
            candidateGroup?: string;
          };
          return {
            base,
            model: buildingModel(base),
            kind: meta.candidateType ?? "mixed-use",
            group: meta.candidateGroup ?? "infill",
          };
        })
    : [];
  const rand = (...keys: (string | number)[]) =>
    random(seed, site.id, "urban", ...keys);
  // A waterfront square faces the water; a bridgehead market gathers where
  // the bridge lands. Other squares keep their fabric's own placement.
  const toward = (p: Point | undefined) =>
    p && { x: p.x - site.center.x, y: p.y - site.center.y };
  const layout = composeUrban(
    site.id,
    site.center,
    site.profile.radius,
    form,
    seed,
    form.plaza === "waterfront"
      ? toward(api.shore)
      : form.plaza === "offset"
        ? toward(api.bridge)
        : undefined,
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
    api.lay(s.a, s.b, `street-${s.tier}-${i}`, layout.tiers[s.tier]);
  for (const [i, s] of layout.diagonals.entries())
    api.lay(s.a, s.b, `avenue-${i}`, layout.tiers[0]);
  for (const r of layout.verges) {
    api.paintVerge(r);
    api.paintVergeWalk(r);
  }

  if (api.bank) riverside();

  const lots: UrbanLot[] = [];
  const civic = civicProfile(pack.setting!);
  const plaza = { ...layout.plaza };
  let civicRect: Rect | undefined;
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
      civicRect = chosen.rect;
    }
  }
  // The sanctuary takes a second side of the square, set back behind a
  // paved forecourt, so the door opens onto the square rather than into it.
  const religious = religiousProfile(pack.setting!);
  if (religious) {
    const scale = religiousScale(site.profile.radius);
    const look = Math.floor(rand("religious-look") * 3);
    const base = `religious-${religious.recipe}-${scale}-${look}`;
    const civicSide: [number, number] | undefined =
      civicRect &&
      (civicRect.y + civicRect.h <= plaza.y
        ? [0, -1]
        : civicRect.y >= plaza.y + plaza.h
          ? [0, 1]
          : civicRect.x >= plaza.x + plaza.w
            ? [1, 0]
            : [-1, 0]);
    const named: Record<string, [number, number]> = {
      north: [0, -1],
      east: [1, 0],
      west: [-1, 0],
    };
    const preferred: [number, number] =
      religious.side === "opposite" && civicSide
        ? [-civicSide[0], -civicSide[1]]
        : (named[religious.side] ?? [0, -1]);
    const sides = [
      preferred,
      ...(
        [
          [0, -1],
          [1, 0],
          [-1, 0],
        ] as [number, number][]
      ).filter((s) => s[0] !== preferred[0] || s[1] !== preferred[1]),
    ].filter(
      (s) => !civicSide || s[0] !== civicSide[0] || s[1] !== civicSide[1],
    );
    const gap = religious.forecourt + 1;
    const candidates = sides.flatMap(([nx, ny]) => {
      const facing =
        nx > 0 ? "west" : nx < 0 ? "east" : ny > 0 ? "north" : "south";
      const frame = facing === "south" ? base : `${base}-${facing}`;
      if (!buildingModels[frame]) return [];
      const model = buildingModel(frame),
        [w, h] = model.footprint;
      return [0, 1, -1, 2, -2].map((step) => {
        const shift = step * (form.tiers[0] + 3);
        const rect = {
          x: nx
            ? nx < 0
              ? plaza.x - w - gap
              : plaza.x + plaza.w + gap
            : Math.floor(plaza.x + (plaza.w - w) / 2) + shift,
          y: ny
            ? ny < 0
              ? plaza.y - h - gap
              : plaza.y + plaza.h + gap
            : Math.floor(plaza.y + (plaza.h - h) / 2) + shift,
          w,
          h,
        };
        // The forecourt spans the building's width between it and the square.
        const forecourt = nx
          ? {
              x: nx < 0 ? rect.x + w : plaza.x + plaza.w,
              y: rect.y,
              w: gap,
              h,
            }
          : {
              x: rect.x,
              y: ny < 0 ? rect.y + h : plaza.y + plaza.h,
              w,
              h: gap,
            };
        return { nx, ny, frame, model, rect, forecourt };
      });
    });
    const chosen = candidates.find(
      (c) =>
        fits(c.rect) && free({ ...c.forecourt }) && api.dry(c.forecourt, false),
    );
    if (chosen) {
      const point = {
        x: chosen.rect.x + chosen.model.entrance[0],
        y: chosen.rect.y + chosen.model.entrance[1],
      };
      lots.push({
        point,
        nx: chosen.nx,
        ny: chosen.ny,
        frame: chosen.frame,
        rect: chosen.rect,
        yard: chosen.rect,
        workPoint: point,
        religious: { ...religious, scale },
      });
      reserve(chosen.rect);
      reserve(chosen.forecourt);
      api.reserveGround(chosen.rect);
      api.reserveGround(chosen.forecourt);
      api.paintForecourt(chosen.forecourt);
    }
  }
  api.paintCourt(plaza, civic.square, civicRect);
  for (const [i, r] of layout.squares.entries()) api.paintSquare(r, i);

  // Parcels are gathered per block. The core gets a larger first-pass quota,
  // while the outer edge is allowed to remain green or undeveloped. This makes
  // a city read as a connected fabric instead of one isolated house per block.
  // Blocks are not required to be uniformly buildable. Asking a whole block to
  // be level would discard nearly all of them on real ground; each parcel is
  // put to the terrain individually below.
  const quarters = new Map<Block, Quarter>();
  const rowLanes = new Map<Block, (() => void)[]>();
  for (const block of layout.blocks) quarters.set(block, quarterOf(block));
  const ranks = [...layout.blocks]
    .sort((a, b) => a.reach - b.reach || a.x - b.x || a.y - b.y)
    .map((block) => ({
      block,
      lots: blockLots(block),
      built: 0,
      coverage: 0,
    }));
  const capacity = urbanBuildingLimit(
    site.profile.radius,
    form,
    site.profile.buildings,
    pack.setting?.year ?? 0,
  );
  // Hold back a slice of the normal building budget for compact parcels. That
  // lets infill appear in the gaps instead of losing the opportunity to the
  // ordinary queue reaching the global cap first.
  const infillBudget = modern
    ? Math.min(120, Math.max(12, Math.round(capacity * 0.5)))
    : 0;
  const largeLimit = modern
    ? Math.max(lots.length, capacity - infillBudget)
    : capacity;
  const queues = ranks.map((rank) => ({ rank, next: 0 }));
  const firstPass = (reach: number) =>
    modern ? (reach < 0.42 ? 4 : reach < 0.76 ? 2 : 0) : 2;
  const place = (rank: (typeof ranks)[number], lot: UrbanLot) => {
    const door = { ...lot.point, w: 1, h: 1 },
      work = { ...lot.workPoint, w: 1, h: 1 };
    if (!fits(lot.rect)) return false;
    if (!free(door) || !free(work) || !api.dry(door, false)) return false;
    // A threshold or work pocket outside the wall has no route back in.
    if (!within(lot.point) || !within(lot.rect) || !within(lot.workPoint))
      return false;
    lots.push(lot);
    rank.built++;
    rank.coverage += lot.rect.w * lot.rect.h;
    reserve(lot.rect);
    reserve(door);
    reserve(work);
    return true;
  };
  for (const q of queues) {
    const quota = firstPass(q.rank.block.reach);
    while (
      q.rank.built < quota &&
      q.next < q.rank.lots.length &&
      lots.length < largeLimit
    )
      place(q.rank, q.rank.lots[q.next++]);
  }
  let placed = true;
  while (placed && lots.length < largeLimit) {
    placed = false;
    for (const q of queues) {
      if (
        modern &&
        q.rank.block.reach > 0.84 &&
        rand("leave-edge-open", q.rank.block.x, q.rank.block.y) < 0.45
      )
        continue;
      if (q.next >= q.rank.lots.length) continue;
      const lot = q.rank.lots[q.next++];
      if (place(q.rank, lot)) placed = true;
    }
  }

  // Decide which untouched blocks are the intentional green exceptions before
  // infill runs. Other empty inner blocks are not parks; they are simply places
  // where the large vocabulary did not find a suitable footprint.
  const parkTarget = Math.min(
    ranks.filter((rank) => !rank.built).length,
    Math.max(0, Math.round(layout.blocks.length * (form.greenSpaces ?? 0))),
  );
  const parkRanks = new Set(
    ranks
      .filter((rank) => !rank.built)
      .sort(
        (a, b) =>
          b.block.reach - a.block.reach ||
          a.block.x - b.block.x ||
          a.block.y - b.block.y,
      )
      .slice(0, parkTarget),
  );

  // A built block can still have awkward two- and three-cell remnants after
  // the large pass. Place compact candidates against the nearest block edge,
  // with a street-facing orientation, but never turn an untouched outer block
  // into a building lot: those blocks remain the source of parks and greens.
  if (modern && candidateBases.length && lots.length < capacity) {
    // One round per block keeps the centre from consuming the whole budget;
    // later rounds return to blocks whose usable area is still under target.
    let added = true;
    while (added && lots.length < capacity) {
      added = false;
      for (const rank of ranks) {
        if (lots.length >= capacity) break;
        if (parkRanks.has(rank) || rank.block.reach > 0.76) continue;
        const target =
          rank.block.reach < 0.42
            ? 0.84
            : rank.block.reach < 0.64
              ? 0.78
              : 0.68;
        if (rank.coverage >= rank.block.w * rank.block.h * target) continue;
        const lot = nextInfillLot(rank.block);
        if (lot && place(rank, lot)) added = true;
      }
    }
  }

  for (const rank of ranks)
    if (rank.built >= 2)
      for (const lay of rowLanes.get(rank.block) ?? []) lay();
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
  const greenBlocks = [...parkRanks];
  for (let i = 0; i < greenBlocks.length; i++) {
    const b = greenBlocks[i].block;
    api.paintPark({ x: b.x + 1, y: b.y + 1, w: b.w - 2, h: b.h - 2 }, i);
  }
  for (const piece of layout.furniture) api.furnish(piece);
  api.paintCity((x, y) => layout.holds(x, y, 1));
  return lots;

  /** Blocks nearest the square trade; the rest are craft rows, a few grander
   * ranges on the arterials, ordinary households, and a thin edge. */
  function quarterOf(block: Block): Quarter {
    if (block.reach < 0.38) return "market";
    if (block.reach > 0.82) return "edge";
    const onArterial = layout.streets.some(
      (s) =>
        s.tier === 0 &&
        Math.min(
          Math.abs(s.a.x - block.x),
          Math.abs(s.a.x - block.x - block.w),
          Math.abs(s.a.y - block.y),
          Math.abs(s.a.y - block.y - block.h),
        ) <=
          layout.tiers[0] + 2,
    );
    const roll = rand("quarter", block.x, block.y);
    if (onArterial && block.reach < 0.7 && roll < 0.4) return "elite";
    return roll < 0.72 ? "craft" : "residential";
  }

  /** House forms a quarter prefers, in the kit's form names. */
  function framesFor(quarter: Quarter): string[] {
    const modern = (pack.setting?.year ?? 0) >= 1900;
    const want =
      quarter === "market"
        ? modern
          ? ["shop", "office", "tall"]
          : ["shop", "tall"]
        : quarter === "craft"
          ? modern
            ? ["row", "shop", "midrise"]
            : ["row", "shop"]
          : quarter === "elite"
            ? modern
              ? ["wide", "office", "midrise", "tall"]
              : ["wide", "tall"]
            : quarter === "edge"
              ? modern
                ? ["shop", "row", "midrise"]
                : ["shop", "row"]
              : modern
                ? ["row", "midrise", "tall"]
                : ["row", "tall"];
    const chosen = frames.filter((f) => want.some((w) => f.endsWith(`-${w}`)));
    return chosen.length ? chosen : frames;
  }

  /** Candidate businesses are more likely near the square; homes soften the
   * residential and elite quarters without turning every gap into retail. */
  function candidatePool(quarter: Quarter): CandidateRecipe[] {
    const homes = candidateBases.filter((candidate) =>
      candidate.kind.includes("home"),
    );
    const commercial = candidateBases.filter(
      (candidate) => !candidate.kind.includes("home"),
    );
    if (quarter === "market" || quarter === "craft") return commercial;
    if (quarter === "elite") return [...homes, ...commercial.slice(0, 3)];
    if (quarter === "residential") return [...homes, ...commercial.slice(0, 2)];
    return [];
  }

  /** Find one compact lot in a block's current residual space. Re-scanning is
   * intentional: `place` reserves the chosen lot, so the next call naturally
   * finds the next non-overlapping pocket without a second occupancy model. */
  function nextInfillLot(block: Block): UrbanLot | undefined {
    const pool = candidatePool(quarters.get(block) ?? "residential");
    if (!pool.length) return;
    const choices = [...pool].sort(
      (a, b) =>
        a.model.footprint[0] * a.model.footprint[1] -
          b.model.footprint[0] * b.model.footprint[1] ||
        rand("infill-model", block.x, block.y, a.base) -
          rand("infill-model", block.x, block.y, b.base),
    );
    const slots: { recipe: CandidateRecipe; x: number; y: number }[] = [];
    for (const recipe of choices) {
      const [w, h] = recipe.model.footprint;
      for (let y = block.y; y <= block.y + block.h - h; y++)
        for (let x = block.x; x <= block.x + block.w - w; x++)
          slots.push({ recipe, x, y });
    }
    slots.sort(
      (a, b) =>
        Math.min(
          a.x - block.x,
          block.x + block.w - (a.x + a.recipe.model.footprint[0]),
          a.y - block.y,
          block.y + block.h - (a.y + a.recipe.model.footprint[1]),
        ) -
          Math.min(
            b.x - block.x,
            block.x + block.w - (b.x + b.recipe.model.footprint[0]),
            b.y - block.y,
            block.y + block.h - (b.y + b.recipe.model.footprint[1]),
          ) ||
        rand("infill-slot", block.x, block.y, a.x, a.y, a.recipe.base) -
          rand("infill-slot", block.x, block.y, b.x, b.y, b.recipe.base),
    );
    for (const slot of slots) {
      const { recipe, x, y } = slot,
        [w, h] = recipe.model.footprint,
        rect = { x, y, w, h };
      const edges = [
        { facing: "north", distance: y - block.y, nx: 0, ny: 1 },
        {
          facing: "south",
          distance: block.y + block.h - (y + h),
          nx: 0,
          ny: -1,
        },
        { facing: "west", distance: x - block.x, nx: 1, ny: 0 },
        {
          facing: "east",
          distance: block.x + block.w - (x + w),
          nx: -1,
          ny: 0,
        },
      ].sort(
        (a, b) =>
          a.distance - b.distance ||
          rand("infill-facing", x, y, a.facing) -
            rand("infill-facing", x, y, b.facing),
      );
      for (const edge of edges) {
        const base =
          edge.facing === "south"
            ? recipe.base
            : `${recipe.base}-${edge.facing}`;
        const model = buildingModels[base];
        if (!model) continue;
        const point = {
          x: rect.x + model.entrance[0],
          y: rect.y + model.entrance[1],
        };
        if (
          !fits(rect) ||
          !free({ ...point, w: 1, h: 1 }) ||
          !api.dry({ ...point, w: 1, h: 1 }, false) ||
          !within(point) ||
          !within(rect)
        )
          continue;
        return {
          point,
          quarter: quarters.get(block),
          nx: edge.nx,
          ny: edge.ny,
          frame: base,
          rect,
          yard: rect,
          workPoint: {
            x: point.x - edge.nx,
            y: point.y - edge.ny,
          },
        };
      }
    }
  }

  /** A street along the bank, with a quay between it and the water. Fitted
   * in short runs so it follows a bend rather than being refused by it. */
  function riverside() {
    const bank: Point[] = [];
    const half = layout.half + 4;
    for (let y = site.center.y - half; y <= site.center.y + half; y++)
      for (let x = site.center.x - half; x <= site.center.x + half; x++)
        if (layout.holds(x, y, -2) && api.bank!(x, y)) bank.push({ x, y });
    if (bank.length < 12) return;
    const xs = bank.map((p) => p.x),
      ys = bank.map((p) => p.y);
    const alongX =
      Math.max(...xs) - Math.min(...xs) >= Math.max(...ys) - Math.min(...ys);
    const along = (p: Point) => (alongX ? p.x : p.y),
      across = (p: Point) => (alongX ? p.y : p.x);
    const lo = Math.min(...bank.map(along)),
      hi = Math.max(...bank.map(along));
    const runs = Math.max(1, Math.min(4, Math.round((hi - lo) / 18)));
    const dryAt = (a: number, c: number) =>
      api.dry(
        alongX ? { x: a, y: c, w: 1, h: 1 } : { x: c, y: a, w: 1, h: 1 },
        false,
      );
    let laid = 0;
    for (let i = 0; i < runs; i++) {
      const from = lo + Math.round(((hi - lo) * i) / runs),
        to = lo + Math.round(((hi - lo) * (i + 1)) / runs);
      const here = bank.filter((p) => along(p) >= from && along(p) <= to);
      if (here.length < 4) continue;
      const sorted = here.map(across).sort((a, b) => a - b);
      const median = sorted[sorted.length >> 1];
      // Inland is whichever side of the bank line is dry.
      const side =
        [1, -1]
          .map((d) => ({
            d,
            dry: here.filter((p) => dryAt(along(p), median + d * 3)).length,
          }))
          .sort((a, b) => b.dry - a.dry)[0]?.d ?? 1;
      for (let inland = 2; inland <= 5; inland++) {
        const c = median + side * inland;
        const road = api.lay(
          alongX ? { x: from, y: c } : { x: c, y: from },
          alongX ? { x: to, y: c } : { x: c, y: to },
          `quay-${i}`,
          layout.tiers[1],
        );
        if (!road) continue;
        laid++;
        // The quay: every dry cell between the street and the water.
        for (let a = from; a <= to; a++)
          for (let k = 1; k < inland + 2; k++) {
            const q = c - side * (layout.tiers[1] + k);
            if (!dryAt(a, q)) break;
            api.paintQuay?.(
              alongX ? { x: a, y: q, w: 1, h: 1 } : { x: q, y: a, w: 1, h: 1 },
            );
          }
        break;
      }
    }
    return laid;
  }

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
        // both ends of the block and nothing behind it is landlocked. Laid
        // only once the block is built: a lane through an empty block is a
        // cul-de-sac to nowhere.
        const lane = { x: block.x - 1, y: top - Math.ceil(gap / 2) };
        rowLanes.set(block, [
          ...(rowLanes.get(block) ?? []),
          () => {
            api.lay(
              lane,
              { x: block.x + block.w, y: lane.y },
              `row-${block.x}-${lane.y}`,
              1,
            );
            if (block.court)
              api.paintCourt({ x: block.x, y: top - gap, w: block.w, h: gap });
          },
        ]);
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
    const quarter = quarters.get(block) ?? "residential";
    const pool = framesFor(quarter);
    const dominant =
      pool[Math.floor(rand("range", block.x, block.y, key) * pool.length)];
    let cursor = block.x;
    while (cursor < block.x + block.w - 4) {
      const choices = [...pool].sort(
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
          quarter,
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
      // A cell between neighbours, so a row reads as houses rather than a wall.
      cursor += span + 1;
    }
    return out;
  }
}
