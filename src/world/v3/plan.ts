import {
  generateCharacter,
  characterLivelihood,
  characterSex,
  eligibleInventory,
} from "../../content/characters/generate";
import { atWork } from "../../core/brief";
import {
  subsistenceFor,
  resolveCharacterContext,
  workAt,
} from "../../content/characters/resolve";
import { workplaceFor } from "../../content/characters/workplace";
import { venuesFor } from "../../content/venues";
import {
  streetPalette,
  chooseStreetSurface,
} from "../../content/settlements/streets/palettes";
import { urbanForm } from "../../content/settlements/urban-form";
import { waysideFor } from "../../content/settlements/wayside";
import { yardKit, type YardProp } from "../../content/settlements/yards";
import { propDefs, propVisualCells } from "../../content/props/catalog";
import {
  penBoundary as localPen,
  pickBoundary,
  yardBoundaries,
} from "../../content/settlements/boundaries";
import type { Boundary, CropId } from "../../content/agriculture/types";
import {
  plottedTown,
  urbanNeighborhood,
  urbanSite,
  siteForm,
  type UrbanLot,
} from "./urban";
import type { Furniture } from "./blocks";
import { urbanNeighborhoodV1 } from "./urban-v1";
import { urbanBuildingLimit } from "../../content/settlements/scale";
import {
  cropSprite,
  eraEnclosure,
  planFarmland,
  territoryReach,
  type FieldCell,
} from "./farmland";
import { faunaAt, faunaProfile } from "../../content/fauna";
import type { FaunaGroup, FaunaMember } from "../../core/fauna";
import { crops } from "../../content/agriculture/crops";
import { farms } from "../../content/geography/onsets";
import { route } from "../../core/routing";
import {
  focusFor,
  lampFor,
  ornaments,
  stallFor,
} from "../../content/settlements/ornaments";
import type { Actor, Pack, Point, Position, Terrain } from "../../core/types";
import { proceduralName } from "../../content/geography/character";
import { random } from "../../core/random";
import {
  buildingModel,
  buildingModels,
  buildingRoofCells,
} from "../../content/graphics/models";
import { chooseBuildingFrame } from "../../content/graphics/building-scale";
import {
  crossing,
  line,
  planRoad,
  planAccess,
  joinNetwork,
  roadCells,
  type Sample,
} from "./roads";
import { planRoutines } from "./routines";
import {
  cellKey,
  eachCell,
  type Rect,
  type Road,
  type SettlementPlan,
  type Site,
} from "./types";
import { makeDoor } from "../../core/doors";
import {
  claimEnvelope,
  createPlacementClaims,
  envelopeConflicts,
  treePlacementEnvelope,
} from "./placement";
/** The livelihood activity that keeps animals, as the character tables name it. */
const HERDING = "Tending animals";

const now = () =>
  typeof performance !== "undefined" ? performance.now() : Date.now();
export function planSettlement(
  site: Site,
  pack: Pack,
  seed: string,
  sample: Sample,
  connections: Road[],
  /** Ground inside another settlement's claim, which fields keep off. */
  foreign: (x: number, y: number) => boolean = () => false,
): SettlementPlan {
  const c = site.center,
    profile = site.profile,
    r = profile.radius;
  const characterContext = pack.setting?.characterRevision
    ? resolveCharacterContext(pack.setting)
    : undefined;
  /* Ask what work is actually available rather than guessing at ids: the
   * planner used to request "farmer" and match `role === "Farmer"`, so where
   * the pool held no cultivator it laid fields nobody could work. */
  const canFarm =
    !characterContext || workAt(characterContext, "field").length > 0;
  const canHerd =
    !characterContext || workAt(characterContext, "pasture").length > 0;
  // A town before the railway still eats what walks in on its own legs: no
  // household pens among the houses, but a stockyard at the edge and a few
  // people whose work is the animals in it.
  const stockyard =
    !profile.livestock &&
    canHerd &&
    !!pack.setting &&
    pack.setting.settlement !== "camp" &&
    pack.setting.year < 1850 &&
    (subsistenceFor(pack.setting)?.shares.herding ?? 0) >= 0.05;
  const sharedRoads = !!pack.setting?.roadRevision;
  const urban = urbanSite(site, pack);
  /** Resolved once: the lookup scans every dated rule, and both the square's
   * furniture and the building budget ask for it. */
  const fabric = siteForm(site, pack);
  /** Worlds pinned to the first urban revision keep their fixed lattice. */
  const composed = (pack.setting?.urbanRevision ?? 0) >= 2;
  const organic = !!pack.setting?.environment && profile.pattern !== "planned";
  // Farmland reaches past the claim, and so must the ground a path may use.
  // A town farms once its region does, whatever its own profile says of
  // household fields; a camp or a hunting band does not.
  const farmed =
    !!pack.setting?.environment &&
    farms(pack.setting) &&
    (profile.fields !== "none" || urban);
  const margin = 40 + (farmed ? territoryReach(r, pack) : 0);
  const coreBounds = {
    x: c.x - r - 40,
    y: c.y - r - 40,
    w: (r + 40) * 2,
    h: (r + 40) * 2,
  };
  const bounds = {
    x: c.x - r - margin,
    y: c.y - r - margin,
    w: (r + margin) * 2,
    h: (r + margin) * 2,
  };
  const tPlan = now();
  const placement = createPlacementClaims();
  const plan: SettlementPlan = {
    site,
    roads: [],
    plots: [],
    places: [],
    objects: [],
    actors: [],
    enclosures: [],
    surface: new Map(),
    pavement: new Map(),
    streetSurfaces: new Map(),
    traffic: placement.access,
    reserved: new Set(),
    solid: placement.occupied,
    placement,
    built: new Set(),
    work: new Map(),
    stations: new Map(),
    slots: new Map(),
    spawn: { ...c },
    diagnostics: { routeFailures: 0, rejectedBuildings: 0, timing: {} },
  };
  const centers = new Set<string>();
  const roads = plan.traffic,
    bridges = new Set<string>(),
    noRoad = new Set<string>();
  // A view, not a copy: with the fields in, noRoad holds tens of thousands
  // of cells and a copy per doorstep search cost seconds.
  const blockedForRoads = {
    has: (k: string) => plan.solid.has(k) || noRoad.has(k),
  } as Set<string>;
  const rand = (...k: (string | number)[]) =>
    random(seed, "settlement-3", site.id, ...k);
  const pos = (p: Point): Position => ({ ...p, space: "outside" });
  /** Cut grain stands at the field edge once the harvest is in; the renderer
   * only draws it in the seasons listed, so a summer field stays clear. */
  const sheaves = (
    id: string,
    rect: { x: number; y: number; w: number; h: number },
    access: Point,
    free: (x: number, y: number) => boolean,
  ) => {
    let placed = 0;
    for (let i = 0; i < 9 && placed < 3; i++) {
      const along = Math.floor(rand(id, "sheaf-x", i) * rect.w);
      const x = rect.x + along;
      const near = access.y > rect.y + rect.h / 2;
      const row = i % 3;
      const y = near ? rect.y + rect.h - 1 - row : rect.y + row;
      if (!free(x, y)) continue;
      placed++;
      plan.objects.push({
        id: `${id}-sheaf${i}`,
        name: "Sheaf of grain",
        kind: "container",
        prop: "sheaf",
        pos: pos({ x, y }),
        sprite: `study-propb-sheaf-${Math.floor(rand(id, "sheaf-art", i) * 3)}`,
        inventory: { grain: 2 },
        seasons: ["autumn", "winter"],
        claim: "landscape",
      });
    }
  };
  /** Surfaces are painted by rank, not by paint order: a footway, a yard or
   * an access path never overwrites the street it meets. Bridge 10, square 9,
   * main street 8, street 7, paved lane 6, footway 5, earth path 4, yard 3,
   * block ground 2. A planted bed forces itself at 11. */
  const ranks = new Map<string, number>();
  const setSurface = (k: string, t: Terrain, rank: number) => {
    const old = ranks.get(k) ?? -1;
    if (old > rank) return false;
    if (old < rank) {
      plan.pavement?.delete(k);
      plan.streetSurfaces?.delete(k);
    }
    ranks.set(k, rank);
    plan.surface.set(k, t);
    return true;
  };
  const paint = (rect: Rect, t: Terrain, reserve = true, rank = 3) =>
    eachCell(rect, (x, y) => {
      setSurface(cellKey(x, y), t, rank);
      if (reserve) plan.reserved.add(cellKey(x, y));
    });
  const palette = pack.setting ? streetPalette(pack.setting) : undefined;
  // One stone for the whole town, drawn once: a street-by-street lottery of
  // materials read as patches. Lanes are all earth or all stone, and the
  // square may take a dressed slab of its own.
  const stone = palette && chooseStreetSurface(palette, "main", rand("paving"));
  const laneSurface =
    palette && chooseStreetSurface(palette, "lane", rand("lanes"));
  const squareStone =
    palette && chooseStreetSurface(palette, "square", rand("square-paving"));
  const footwaySurface =
    palette && chooseStreetSurface(palette, "footway", rand("footways"));
  // A city claim is not a single paved surface. Roads, footways, yards and
  // planted spaces add their own higher-ranked surfaces over this base.
  // Worn earth between an old town's streets; lawn in a modern one.
  const plotted = plottedTown(pack);
  const churchyards: { yard: Rect; church: Rect }[] = [];
  // How far down the street tiers the cobbles go: the form's own answer.
  const pavedFrom = { arterial: 3, streets: 2, all: 0 }[
    (pack.setting && urbanForm(pack.setting).plots?.paved) || "arterial"
  ];
  // A plotted town is gardens between its streets, so it is green too.
  const cityGround =
    profile.radius < 45
      ? undefined
      : (pack.setting?.year ?? 0) >= 1900 || plotted
        ? "grass"
        : "dirt";
  const addRoad = (road: Road) => {
    road = {
      ...road,
      baselineYear: road.baselineYear ?? pack.setting?.year ?? 0,
      state: road.state ?? "used",
      condition: road.condition ?? 1,
    };
    const material = road.kind === "lane" ? laneSurface : stone;
    plan.roads.push(road);
    for (const p of road.points) centers.add(cellKey(p.x, p.y));
    roadCells(road, (x, y) => {
      const k = cellKey(x, y),
        f = sample(x, y);
      if (f.water < 0 && !bridges.has(k)) return;
      roads.add(k);
      plan.reserved.add(k);
      // Composed lanes are paved in a paved town; access paths and doorsteps
      // are not.
      // A plotted town cobbles its main street and square; the rest is earth.
      const stone =
        profile.paved &&
        (plotted
          ? (road.span ?? 0) >= pavedFrom
          : road.width >= 1 || road.kind === "lane");
      const rank =
        f.water < 0
          ? 10
          : road.width >= 2
            ? 8
            : road.width >= 1
              ? 7
              : stone
                ? 6
                : 4;
      if (
        !setSurface(k, f.water < 0 ? "bridge" : stone ? "paving" : "dirt", rank)
      )
        return;
      if (material && stone && !plan.streetSurfaces!.has(k))
        plan.streetSurfaces!.set(k, material);
      if (urban && stone && road.width < 1 && !plan.pavement!.has(k))
        plan.pavement!.set(k, "lane");
    });
  };
  const selected =
    sharedRoads && connections.some((p) => p.kind === "bridge")
      ? undefined
      : crossing(`${site.id}-bridge`, c, sample, r);
  for (const bridge of [
    ...connections.filter((p) => p.kind === "bridge"),
    ...(selected ? [selected] : []),
  ]) {
    roadCells(bridge, (x, y) => bridges.add(cellKey(x, y)));
    addRoad(bridge);
  }
  for (const road of connections.filter((p) => p.kind !== "bridge"))
    addRoad(road);
  const connect = (
    a: Point,
    b: Point,
    label: string,
    width = 1,
    area?: Rect,
  ) => {
    const access = /^(door|yard-access|field-access|pen-access)/.test(label);
    // A doorstep path searches the town, not the fields round it.
    area ??= access ? coreBounds : bounds;
    const road = access
      ? (sharedRoads ? joinNetwork : planAccess)(
          `${site.id}-${label}`,
          label.startsWith("field-access") || label.startsWith("pen-access")
            ? b
            : a,
          sample,
          sharedRoads ? centers : roads,
          bridges,
          blockedForRoads,
          area,
        )
      : sharedRoads &&
          /^(neighborhood|bridge-approach)/.test(label) &&
          roads.size
        ? joinNetwork(
            `${site.id}-${label}`,
            b,
            sample,
            label.startsWith("bridge-approach")
              ? new Set([...centers].filter((k) => !bridges.has(k)))
              : centers,
            bridges,
            blockedForRoads,
            area,
            width,
          )
        : planRoad(
            `${site.id}-${label}`,
            a,
            b,
            sample,
            roads,
            bridges,
            blockedForRoads,
            area,
            width,
            width ? 2 : 1,
            organic ? seed : undefined,
          );
    // A composed town's footway already serves the door; an access path
    // painted over it only cut dirt notches into the street.
    if (
      road &&
      !((sharedRoads || (urban && composed)) && label.startsWith("yard-access"))
    )
      addRoad(road);
    else if (!road) plan.diagnostics.routeFailures++;
    return road;
  };
  /** A composed street is already known to be straight and on chosen ground,
   * so it needs validating, not searching. A wet or reserved cell clips the
   * street rather than refusing it: the runs either side still serve their
   * blocks, where refusing the whole segment left them with no street at all.
   * `span` is the total width in cells. */
  const lay = (
    a: Point,
    b: Point,
    label: string,
    span: number,
    /** A field track runs past the claim the streets are held to. */
    outside = false,
    /** An earth track keeps its kind whatever the town paves. */
    kind?: Road["kind"],
  ) => {
    const width = span >= 4 ? 2 : span >= 2 ? 1 : 0;
    const usable = (p: Point) => {
      let valid = true;
      roadCells(
        { id: "", points: [p], width, span, kind: "street", cost: 0 },
        (x, y) => {
          const k = cellKey(x, y);
          if (
            sample(x, y).water < 4 ||
            (!outside && site.accepts && !site.accepts(x, y)) ||
            plan.solid.has(k) ||
            noRoad.has(k)
          )
            valid = false;
        },
      );
      return valid;
    };
    const runs: Point[][] = [];
    let run: Point[] = [];
    for (const p of line(a, b)) {
      if (usable(p)) run.push(p);
      else if (run.length) {
        runs.push(run);
        run = [];
      }
    }
    if (run.length) runs.push(run);
    let first: Road | undefined;
    for (const [i, points] of runs.entries()) {
      if (points.length < 2 || (points.length < 3 && runs.length > 1)) continue;
      const road: Road = {
        id: `${site.id}-${label}${i ? `-${i}` : ""}`,
        points,
        width,
        span,
        kind: kind ?? (span >= 2 ? "street" : "lane"),
        cost: points.length,
      };
      addRoad(road);
      first ??= road;
      // A street that meets a creek crosses it: the wet gap to the next run
      // is decked over, so the network is not cut in two by a stream.
      const next = runs[i + 1];
      if (!next || span < 2) continue;
      const gap = line(points.at(-1)!, next[0]);
      const wet = gap.every((p) => {
        const f = sample(p.x, p.y);
        const k = cellKey(p.x, p.y);
        return (
          f.water < 4 &&
          f.kind === "river" &&
          !plan.solid.has(k) &&
          !noRoad.has(k)
        );
      });
      if (gap.length > 12 || !wet) continue;
      const deck: Road = {
        id: `${site.id}-${label}-bridge-${i}`,
        points: gap,
        width: Math.min(1, width),
        span: Math.min(3, span),
        kind: "bridge",
        cost: gap.length,
      };
      roadCells(deck, (x, y) => bridges.add(cellKey(x, y)));
      addRoad(deck);
    }
    if (!first && !label.startsWith("field-")) plan.diagnostics.routeFailures++;
    return first;
  };
  /** Dry, unreserved ground. Level is required only inside `core` (the whole
   * rect by default): a yard or pen margin may step down onto the next
   * terrace, but the footprint itself may not. */
  const dry = (rect: Rect, occupied = true, core: Rect = rect) => {
    let lo = Infinity,
      hi = -Infinity,
      valid = true;
    eachCell(rect, (x, y) => {
      const f = sample(x, y);
      if (
        x >= core.x &&
        x < core.x + core.w &&
        y >= core.y &&
        y < core.y + core.h
      ) {
        lo = Math.min(lo, f.elevation);
        hi = Math.max(hi, f.elevation);
      }
      if (
        f.water < 4 ||
        (site.accepts && !site.accepts(x, y)) ||
        (occupied && plan.reserved.has(cellKey(x, y)))
      )
        valid = false;
    });
    return valid && (pack.setting?.terrainRevision ? hi === lo : hi - lo < 28);
  };
  /** Nearest usable landing water. Sampled once; both the quay and the public
   * space that faces it ask the same question. */
  let shoreFound: Point | null | undefined;
  const urbanShore = () => {
    if (shoreFound !== undefined) return shoreFound ?? undefined;
    let best = Infinity;
    shoreFound = null;
    for (let y = c.y - r; y < c.y + r; y += 2)
      for (let x = c.x - r; x < c.x + r; x += 2) {
        const f = sample(x, y),
          d = Math.hypot(x - c.x, y - c.y);
        if (f.water >= 4 && f.water < 8 && d < best) {
          best = d;
          shoreFound = { x, y };
        }
      }
    return shoreFound ?? undefined;
  };
  // Reserve the common first. Its water/hearth objects sit at the edge, never in the through route.
  const half = pack.setting?.terrainRevision
    ? 2
    : profile.plaza === "court"
      ? 4
      : profile.plaza === "market"
        ? 7
        : 5;
  const publicArea = {
    x: c.x - half,
    y: c.y - half,
    w: half * 2 + 1,
    h: half * 2 + 1,
  };
  // A composed town has its square; a second common at the centre only cost
  // the block it landed in.
  eachCell(
    urban && composed ? { ...publicArea, w: 0, h: 0 } : publicArea,
    (x, y) => {
      if (sample(x, y).water >= 0 && (!site.accepts || site.accepts(x, y))) {
        setSurface(cellKey(x, y), profile.paved ? "paving" : "dirt", 9);
        plan.reserved.add(cellKey(x, y));
        roads.add(cellKey(x, y));
      }
    },
  );
  if (sample(c.x, c.y).water >= 0) centers.add(cellKey(c.x, c.y));
  plan.plots.push({
    ...publicArea,
    id: `${site.id}-public`,
    kind: "public",
    access: { ...c },
  });
  const socialCenter = { ...c };
  const water = { x: c.x + 4, y: c.y - 3 },
    waterStand = { x: c.x + 3, y: c.y - 2 };
  plan.objects.push({
    id: `${site.id}-water`,
    name: "Shared water source",
    kind: "well",
    pos: pos(water),
    sprite: "well",
    inventory: {},
  });
  plan.objects.push({
    id: `${site.id}-hearth`,
    name: "Shared hearth",
    kind: "fire",
    pos: pos({ x: c.x - 4, y: c.y + 3 }),
    sprite: "fire",
    inventory: {},
  });
  let urbanLots: UrbanLot[] = [];
  if (urban) {
    /** A square is composed from the fabric's spec: one centrepiece on a dais
     * scaled to the square, four corners, stalls along the lower edge. The
     * shared water and hearth objects already exist for routines; the first
     * water piece and the brazier become them rather than duplicating them. */
    const composeSquare = (court: Rect, civicRect?: Rect) => {
      const spec = fabric.square;
      const min = Math.min(court.w, court.h);
      const cx = court.x + Math.floor(court.w / 2),
        cy = court.y + Math.floor(court.h / 2);
      const source = plan.objects.find((o) => o.id === `${site.id}-water`)!;
      const hearth = plan.objects.find((o) => o.id === `${site.id}-hearth`)!;
      let water = false,
        fire = false;
      const bed = (rect: Rect, tag: string) => {
        if (!dry(rect, false)) return false;
        eachCell(rect, (x, y) => {
          const k = cellKey(x, y);
          setSurface(k, "grass", 11);
          plan.pavement!.delete(k);
          plan.streetSurfaces!.delete(k);
        });
        const at = { x: rect.x + (rect.w >> 1), y: rect.y + (rect.h >> 1) };
        plan.solid.add(cellKey(at.x, at.y));
        plan.objects.push({
          id: `${site.id}-square-tree-${tag}`,
          name: "Square tree",
          kind: "tree",
          pos: pos(at),
          sprite: pack.trees[0],
          inventory: {},
        });
        return true;
      };
      const place = (key: string, spot: Point, tag: string, focus = false) => {
        const piece = ornaments[key];
        if (!piece) return;
        if (!dry({ ...spot, w: piece.size, h: piece.size }, false)) return;
        if (piece.kind === "well") {
          if (water) return;
          water = true;
          source.name = piece.label;
          source.sprite = (focus && piece.focusSprite) || piece.sprite;
          source.pos = pos(spot);
          waterStand.x = spot.x + 1;
          waterStand.y = spot.y;
          return;
        }
        if (piece.kind === "fire") {
          if (fire || spec.hearth !== "brazier") return;
          fire = true;
          hearth.name = piece.label;
          hearth.pos = pos(spot);
          return;
        }
        if (focus) plan.solid.add(cellKey(spot.x, spot.y));
        // A square's centrepiece is the one ornament that has to be local.
        const local = focus ? focusFor(pack) : undefined;
        plan.objects.push({
          id: `${site.id}-${piece.id}-${tag}`,
          name: local?.label ?? piece.label,
          kind: piece.kind,
          sprite:
            local?.sprite ?? ((focus && piece.focusSprite) || piece.sprite),
          pos: pos(spot),
          inventory: {},
        });
      };
      // Centrepiece. The dais is a paving grade the raster raises, so it fits
      // any footprint; the piece itself is the only solid cell.
      let daisHalf = 0;
      if (spec.focus === "tree") {
        bed({ x: cx - 1, y: cy - 1, w: 3, h: 3 }, "focus");
        daisHalf = 1;
      } else if (spec.focus) {
        const piece = ornaments[spec.focus];
        if (piece && !piece.grounded) {
          const size = Math.min(7, 2 * Math.floor((min + 1) / 7) + 1);
          daisHalf = size >> 1;
          eachCell(
            { x: cx - daisHalf, y: cy - daisHalf, w: size, h: size },
            (x, y) => {
              // The platform is stone even where the square around it is earth.
              const k = cellKey(x, y);
              setSurface(k, "paving", 9);
              plan.pavement!.set(k, "dais");
              if (!plan.streetSurfaces!.has(k))
                plan.streetSurfaces!.set(k, "slab");
            },
          );
        }
        place(spec.focus, { x: cx, y: cy }, "focus", true);
        const corner = spec.daisCorners ?? "post";
        if (daisHalf >= 2 && min >= 15 && corner !== "none")
          for (const [i, [dx, dy]] of [
            [-1, -1],
            [1, -1],
            [-1, 1],
            [1, 1],
          ].entries())
            place(
              corner,
              { x: cx + dx * daisHalf, y: cy + dy * daisHalf },
              `dais-${i}`,
            );
      }
      // Talk, and the player's first step, happen at the foot of the
      // monument, not inside it.
      socialCenter.y = cy + Math.max(1, daisHalf) + 1;
      plan.spawn = { x: cx, y: socialCenter.y };
      // Corners. Every square gets water; a brazier fabric gets its fire.
      const list = [...spec.corners];
      const waterKeys = ["well", "fountain"];
      if (!water && !list.some((k) => waterKeys.includes(k)))
        list.splice(Math.min(3, list.length), 0, "well");
      if (spec.hearth === "brazier" && !list.includes("brazier"))
        list.splice(Math.min(3, list.length), 0, "brazier");
      const anchors: [number, number, number, number][] = [
        [court.x, court.y, 1, 1],
        [court.x + court.w - 1, court.y, -1, 1],
        [court.x, court.y + court.h - 1, 1, -1],
        [court.x + court.w - 1, court.y + court.h - 1, -1, -1],
      ];
      for (const [i, [x0, y0, dx, dy]] of anchors.entries()) {
        if (!list.length) break;
        let key = list[i % list.length];
        if (key === "tree") {
          const rect = {
            x: dx > 0 ? x0 + 1 : x0 - 3,
            y: dy > 0 ? y0 + 1 : y0 - 3,
            w: 3,
            h: 3,
          };
          if (min >= 15 && bed(rect, `corner-${i}`)) continue;
          key = "planter";
        }
        place(key, { x: x0 + dx * 2, y: y0 + dy * 2 }, `corner-${i}`);
      }
      // A hidden hearth goes behind the civic range: still reachable for the
      // routines that cook and gather there, but off the square.
      if (spec.hearth === "hidden" && civicRect) {
        const r = civicRect;
        const rcx = r.x + (r.w >> 1),
          rcy = r.y + (r.h >> 1);
        const away =
          Math.abs(rcx - cx) > Math.abs(rcy - cy)
            ? { x: Math.sign(rcx - cx), y: 0 }
            : { x: 0, y: Math.sign(rcy - cy) };
        const behind = (t: number) =>
          away.x
            ? { x: away.x > 0 ? r.x + r.w : r.x - 1, y: r.y + t }
            : { x: r.x + t, y: away.y > 0 ? r.y + r.h : r.y - 1 };
        const span = away.x ? r.h : r.w;
        const spot = [span >> 1, 1, span - 2]
          .map(behind)
          .find(
            (q) =>
              dry({ ...q, w: 1, h: 1 }, false) &&
              !plan.solid.has(cellKey(q.x, q.y)) &&
              !roads.has(cellKey(q.x, q.y)),
          );
        if (spot) {
          hearth.pos = pos(spot);
          plan.reserved.add(cellKey(spot.x, spot.y));
        }
      }
      // Market counters line the square's lower edge, clear of the corners.
      const inset = min >= 13 ? 5 : 2;
      for (const [i, x] of [
        court.x + inset,
        court.x + court.w - inset - 1,
      ].entries()) {
        const stall = stallFor(pack, i + Math.floor(rand("stall") * 3));
        plan.objects.push({
          id: `${site.id}-market-${i}`,
          name: stall.label,
          prop: "marketCounter",
          kind: "container",
          sprite: stall.sprite,
          pos: pos({ x, y: court.y + court.h - 2 }),
          inventory: characterContext
            ? eligibleInventory({ grain: 6 }, characterContext)
            : { grain: 6 },
          owner: `${site.id}-community`,
        });
      }
    };
    const paintForecourt = (rect: Rect) => {
      const material = squareStone;
      eachCell(rect, (x, y) => {
        const key = cellKey(x, y);
        if (!dry({ x, y, w: 1, h: 1 }, false)) return;
        plan.reserved.add(key);
        roads.add(key);
        if (!setSurface(key, profile.paved ? "paving" : "dirt", 8)) return;
        if (!profile.paved) return;
        plan.pavement!.set(key, "square");
        if (material) plan.streetSurfaces!.set(key, material);
      });
    };
    const paintCourt = (court: Rect, square?: string, civicRect?: Rect) => {
      const material = squareStone;
      eachCell(court, (x, y) => {
        const key = cellKey(x, y);
        plan.reserved.add(key);
        if (!square) setSurface(key, "dirt", 3);
        else {
          roads.add(key);
          if (
            setSurface(key, profile.paved ? "paving" : "dirt", 9) &&
            profile.paved
          ) {
            plan.pavement!.set(key, "square");
            if (material) plan.streetSurfaces!.set(key, material);
          }
        }
      });
      plan.plots.push({
        ...court,
        id: `${site.id}-${square ? "square" : "urban-court"}-${plan.plots.length}`,
        kind: "public",
        access: {
          x: court.x + Math.floor(court.w / 2),
          y: court.y + Math.floor(court.h / 2),
        },
      });
      if (square) {
        socialCenter.x = court.x + Math.floor(court.w / 2);
        socialCenter.y = court.y + Math.floor(court.h / 2);
        composeSquare(court, civicRect);
        // The centre is now the monument; anything that entered there
        // enters at its foot instead.
        for (const plot of plan.plots)
          if (plan.solid.has(cellKey(plot.access.x, plot.access.y)))
            plot.access = { ...socialCenter };
      }
      // Trees belong to planted court corners; the central passage stays clear.
      const garden = { x: court.x, y: court.y, w: 3, h: 3 };
      if (
        !square &&
        dry(garden, false) &&
        !roads.has(cellKey(garden.x + 1, garden.y + 1))
      ) {
        paint(garden, "grass", true, 11);
        plan.objects.push({
          id: `${site.id}-court-tree-${plan.plots.length}`,
          name: "Courtyard tree",
          kind: "tree",
          pos: pos({ x: garden.x + 1, y: garden.y + 1 }),
          sprite: pack.trees[0],
          inventory: {},
        });
      }
    };
    // A small town's block ground is grass; a city's is its own beaten earth
    // or paving, with grass only as edging round the houses.
    // A modern block is yard between its buildings; an older one is earth.
    const blockGround =
      (pack.setting?.year ?? 0) >= 1900 ? "grass" : (cityGround ?? "grass");
    const paintBlock = (block: Rect) =>
      eachCell(block, (x, y) => {
        if (dry({ x, y, w: 1, h: 1 }, false))
          setSurface(cellKey(x, y), blockGround, 2);
      });
    const paintFootway = (rect: Rect) => {
      if (!profile.paved || plotted) return;
      eachCell(rect, (x, y) => {
        const k = cellKey(x, y);
        if (
          plan.solid.has(k) ||
          roads.has(k) ||
          !dry({ x, y, w: 1, h: 1 }, false)
        )
          return;
        if (setSurface(k, "paving", 5)) {
          plan.pavement!.set(k, "footway");
          plan.reserved.add(k);
          if (footwaySurface) plan.streetSurfaces!.set(k, footwaySurface);
        }
      });
    };
    const paintVerge = (rect: Rect) =>
      eachCell(rect, (x, y) => {
        const k = cellKey(x, y);
        if (plan.solid.has(k) || !dry({ x, y, w: 1, h: 1 }, false)) return;
        if (setSurface(k, "grass", 4)) {
          plan.pavement!.set(k, "verge");
          plan.reserved.add(k);
        }
      });
    const paintVergeWalk = (rect: Rect) => {
      if (!profile.paved) return;
      const horizontal = rect.w >= rect.h,
        before = horizontal ? rect.y < c.y : rect.x < c.x,
        walk = horizontal
          ? {
              x: rect.x,
              y: before ? rect.y - 1 : rect.y + rect.h,
              w: rect.w,
              h: 1,
            }
          : {
              x: before ? rect.x - 1 : rect.x + rect.w,
              y: rect.y,
              w: 1,
              h: rect.h,
            };
      eachCell(walk, (x, y) => {
        const k = cellKey(x, y);
        if (
          plan.solid.has(k) ||
          roads.has(k) ||
          !dry({ x, y, w: 1, h: 1 }, false)
        )
          return;
        if (setSurface(k, "paving", 5)) {
          plan.pavement!.set(k, "footway");
          if (footwaySurface) plan.streetSurfaces!.set(k, footwaySurface);
          plan.reserved.add(k);
        }
      });
    };
    const paintPark = (rect: Rect, index: number) => {
      let usable = 0;
      eachCell(rect, (x, y) => {
        const k = cellKey(x, y);
        if (
          plan.solid.has(k) ||
          roads.has(k) ||
          !dry({ x, y, w: 1, h: 1 }, false)
        )
          return;
        if (setSurface(k, "grass", 11)) {
          plan.pavement!.delete(k);
          plan.streetSurfaces!.delete(k);
          plan.reserved.add(k);
          usable++;
        }
      });
      if (usable < 6) return;
      const at = { x: rect.x + (rect.w >> 1), y: rect.y + (rect.h >> 1) },
        treeKey = cellKey(at.x, at.y);
      plan.plots.push({
        ...rect,
        id: `${site.id}-park-${index}`,
        kind: "public",
        access: at,
      });
      if (!plan.solid.has(treeKey) && pack.trees[0]) {
        plan.solid.add(treeKey);
        plan.objects.push({
          id: `${site.id}-park-tree-${index}`,
          name: "Pocket park tree",
          kind: "tree",
          pos: pos(at),
          sprite: pack.trees[0],
          inventory: {},
        });
      }
      const bench = ornaments.bench,
        benchAt = { x: at.x + 2, y: at.y };
      if (
        bench &&
        !plan.solid.has(cellKey(benchAt.x, benchAt.y)) &&
        dry({ ...benchAt, w: 1, h: 1 }, false)
      )
        plan.objects.push({
          id: `${site.id}-park-bench-${index}`,
          name: bench.label,
          kind: bench.kind,
          sprite: bench.sprite,
          pos: pos(benchAt),
          inventory: {},
        });
    };
    const paintSquare = (court: Rect, index: number) => {
      const material = squareStone;
      eachCell(court, (x, y) => {
        const k = cellKey(x, y);
        plan.reserved.add(k);
        roads.add(k);
        if (
          setSurface(k, profile.paved ? "paving" : "dirt", 9) &&
          profile.paved
        ) {
          plan.pavement!.set(k, "square");
          if (material) plan.streetSurfaces!.set(k, material);
        }
      });
      const cx = court.x + (court.w >> 1),
        cy = court.y + (court.h >> 1);
      plan.plots.push({
        ...court,
        id: `${site.id}-square-${index + 2}`,
        kind: "public",
        access: { x: cx, y: cy + 2 },
      });
      const spec = fabric.square;
      const put = (key: string, at: Point, tag: string) => {
        const piece = ornaments[key];
        if (!piece || piece.kind === "well" || piece.kind === "fire") return;
        if (plan.solid.has(cellKey(at.x, at.y))) return;
        plan.objects.push({
          id: `${site.id}-square-${index + 2}-${piece.id}-${tag}`,
          name: piece.label,
          kind: piece.kind,
          sprite: piece.sprite,
          pos: pos(at),
          inventory: {},
        });
      };
      // A lesser centrepiece on a three-cell dais; a planted square keeps a tree.
      if (spec.focus === "tree") {
        const k = cellKey(cx, cy);
        setSurface(k, "grass", 11);
        plan.pavement!.delete(k);
        plan.solid.add(k);
        plan.objects.push({
          id: `${site.id}-square-${index + 2}-tree`,
          name: "Square tree",
          kind: "tree",
          pos: pos({ x: cx, y: cy }),
          sprite: pack.trees[0],
          inventory: {},
        });
      } else if (spec.focus && ornaments[spec.focus]) {
        if (!ornaments[spec.focus].grounded)
          eachCell({ x: cx - 1, y: cy - 1, w: 3, h: 3 }, (x, y) => {
            const k = cellKey(x, y);
            setSurface(k, "paving", 9);
            plan.pavement!.set(k, "dais");
            if (!plan.streetSurfaces!.has(k))
              plan.streetSurfaces!.set(k, "slab");
          });
        plan.solid.add(cellKey(cx, cy));
        put(spec.focus, { x: cx, y: cy }, "focus");
      }
      for (const [i, [dx, dy]] of [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].entries()) {
        const key = spec.corners[i % spec.corners.length];
        if (key === "tree") continue;
        put(
          key,
          {
            x: cx + dx * ((court.w >> 1) - 1),
            y: cy + dy * ((court.h >> 1) - 1),
          },
          `corner-${i}`,
        );
      }
    };
    const paintCity = (holds: (x: number, y: number) => boolean) => {
      if (!cityGround) return;
      const reach = r + 12;
      for (let y = c.y - reach; y <= c.y + reach; y++)
        for (let x = c.x - reach; x <= c.x + reach; x++) {
          if (!holds(x, y) || !dry({ x, y, w: 1, h: 1 }, false)) continue;
          const k = cellKey(x, y);
          setSurface(k, cityGround, 1);
          const besideRoad =
            !roads.has(k) &&
            [
              [1, 0],
              [-1, 0],
              [0, 1],
              [0, -1],
            ].some(([dx, dy]) => {
              const n = cellKey(x + dx, y + dy);
              // An earth street has no kerb.
              return (
                roads.has(n) && (!plotted || plan.surface.get(n) === "paving")
              );
            });
          if (
            profile.paved &&
            besideRoad &&
            plan.pavement!.get(k) !== "verge"
          ) {
            setSurface(k, "paving", 5);
            plan.pavement!.set(k, "footway");
            if (footwaySurface) plan.streetSurfaces!.set(k, footwaySurface);
          }
        }
    };
    const furnish = (piece: Furniture) => {
      const k = cellKey(piece.x, piece.y);
      if (
        plan.solid.has(k) ||
        !dry({ x: piece.x, y: piece.y, w: 1, h: 1 }, false)
      )
        return;
      const pavement = plan.pavement!.get(k);
      // Not in the roadway: a lamp stands on the footway, a tree in the verge.
      if (roads.has(k) && pavement !== "footway" && pavement !== "verge")
        return;
      if (piece.kind === "tree") {
        if (pavement !== "verge") return;
        plan.solid.add(k);
        plan.reserved.add(k);
        plan.objects.push({
          id: `${site.id}-street-tree-${piece.x}-${piece.y}`,
          name: "Street tree",
          kind: "tree",
          pos: pos(piece),
          sprite: pack.trees[0],
          inventory: {},
        });
        return;
      }
      const item = ornaments[piece.kind === "lamp" ? "lamp" : "planter"];
      if (!item) return;
      // A lamp is whatever this place and date lit its streets with.
      const lamp = piece.kind === "lamp" ? lampFor(pack) : undefined;
      plan.objects.push({
        id: `${site.id}-${item.id}-${piece.x}-${piece.y}`,
        name: lamp?.label ?? item.label,
        kind: item.kind,
        sprite: lamp?.sprite ?? item.sprite,
        pos: pos(piece),
        inventory: {},
      });
    };
    urbanLots = composed
      ? urbanNeighborhood(site, pack, seed, {
          lay,
          dry,
          shore: urbanShore(),
          bank: (x, y) => {
            const f = sample(x, y);
            return f.water >= 4 && f.water < 6.5 && f.kind !== "lake";
          },
          paintQuay: (rect) =>
            eachCell(rect, (x, y) => {
              const k = cellKey(x, y);
              if (plan.solid.has(k) || roads.has(k)) return;
              plan.reserved.add(k);
              roads.add(k);
              if (
                setSurface(k, profile.paved ? "paving" : "dirt", 5) &&
                profile.paved
              )
                plan.pavement!.set(k, "footway");
            }),
          bridge: (() => {
            const ends = [
              ...connections.filter((p) => p.kind === "bridge"),
              ...(selected ? [selected] : []),
            ].flatMap((b) => [b.points[0], b.points.at(-1)!]);
            return ends.sort(
              (a, b) =>
                Math.hypot(a.x - c.x, a.y - c.y) -
                Math.hypot(b.x - c.x, b.y - c.y),
            )[0];
          })(),
          paintCourt,
          paintForecourt,
          paintSquare,
          paintVerge,
          paintVergeWalk,
          paintFootway,
          paintPark,
          churchyard: (yard, church) => churchyards.push({ yard, church }),
          plant: (at, key) => {
            const k = cellKey(at.x, at.y);
            const sprite = pack.trees[key % pack.trees.length],
              envelope = treePlacementEnvelope(sprite, at);
            if (
              plan.solid.has(k) ||
              roads.has(k) ||
              plan.reserved.has(k) ||
              envelopeConflicts(plan.placement, envelope) ||
              !dry({ ...at, w: 1, h: 1 }, false)
            )
              return false;
            claimEnvelope(plan.placement, envelope);
            plan.reserved.add(k);
            plan.objects.push({
              id: `${site.id}-plot-tree-${at.x}-${at.y}`,
              name: "Tree",
              kind: "tree",
              pos: pos(at),
              sprite,
              inventory: {},
            });
            return true;
          },
          furnish,
          paintCity,
          paintBlock,
          reserveGround: (rect) =>
            eachCell(rect, (x, y) => noRoad.add(cellKey(x, y))),
          reserveClearance: (rect) =>
            eachCell(rect, (x, y) =>
              plan.placement.clearance.add(cellKey(x, y)),
            ),
          buildWall: (wall, parts) => {
            for (const part of parts) {
              const k = cellKey(part.x, part.y);
              plan.solid.add(k);
              plan.reserved.add(k);
              noRoad.add(k);
            }
            plan.enclosures.push({
              ...wall.rect,
              // A circuit has many ways in. The single gate this field records
              // is the one a reader of the older fence contract would look for.
              gate: [...wall.openings]
                .map((k) => {
                  const [x, y] = k.split(",").map(Number);
                  return { x, y };
                })
                .sort((a, b) => a.y - b.y || a.x - b.x)[0] ?? { ...c },
              parts,
            });
          },
        })
      : urbanNeighborhoodV1(
          site,
          pack,
          seed,
          connect,
          dry,
          paintCourt,
          paintBlock,
        );
    for (const lot of urbanLots)
      eachCell(lot.rect, (x, y) => noRoad.add(cellKey(x, y)));
    if (selected) {
      connect(c, selected.points[0], "bridge-approach-a");
      connect(c, selected.points.at(-1)!, "bridge-approach-b");
    }
  } else if (organic) {
    // Local anchors precede buildings: dry courts/terraces, access to a crossing,
    // and a small number of neighborhood centers. Density does not imply a grid.
    const anchors: Point[] = [{ ...c }];
    if (selected) {
      for (const [i, end] of [
        selected.points[0],
        selected.points.at(-1)!,
      ].entries()) {
        if (connect(c, end, `bridge-approach${i}`, 0)) anchors.push(end);
      }
    }
    const candidates = Array.from({ length: 72 }, (_, i) => {
      const angle = rand("anchor-angle", i) * Math.PI * 2;
      const radius = (0.28 + rand("anchor-radius", i) * 0.66) * r;
      const p = {
        x: c.x + Math.round(Math.cos(angle) * radius),
        y: c.y + Math.round(Math.sin(angle) * radius),
      };
      const f = sample(p.x, p.y);
      const fit = dry({ x: p.x - 5, y: p.y - 5, w: 11, h: 11 }, false);
      return {
        p,
        fit,
        score:
          rand("anchor-score", i) * 18 +
          Math.abs(f.water - 24) * 0.05 +
          Math.abs(f.moisture - 0.5) * 8,
      };
    })
      .filter((a) => a.fit)
      .sort((a, b) => a.score - b.score);
    const count =
      profile.pattern === "dense"
        ? 8
        : profile.pattern === "waterfront"
          ? 6
          : profile.pattern === "farmstead"
            ? 3
            : sharedRoads
              ? 3
              : 5;
    let accepted = 0;
    for (const { p } of candidates) {
      if (accepted >= count) break;
      if (
        anchors.some(
          (a) =>
            Math.hypot(a.x - p.x, a.y - p.y) <
            (profile.pattern === "dense" ? 23 : 26),
        )
      )
        continue;
      const nearest = [...anchors].sort(
        (a, b) =>
          Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y),
      )[0];
      if (
        !connect(
          nearest,
          p,
          `neighborhood${accepted}`,
          accepted === 0 && pack.setting?.settlement !== "camp" ? 1 : 0,
        )
      )
        continue;
      anchors.push(p);
      accepted++;
      if (accepted % 2 === 1 && profile.pattern !== "roadside") {
        const size = 2 + Math.floor(rand("court-size", accepted) * 2);
        if (
          dry(
            { x: p.x - size, y: p.y - size, w: size * 2 + 1, h: size * 2 + 1 },
            false,
          )
        ) {
          for (let y = p.y - size; y <= p.y + size; y++)
            for (let x = p.x - size; x <= p.x + size; x++) {
              if (Math.hypot(x - p.x, (y - p.y) * 1.15) > size + 0.5) continue;
              plan.surface.set(
                cellKey(x, y),
                profile.paved ? "paving" : "dirt",
              );
              plan.reserved.add(cellKey(x, y));
              roads.add(cellKey(x, y));
            }
        }
      }
    }
    // A few cross-links form blocks; ordinary hamlets retain branching paths.
    if (profile.pattern === "dense" || profile.pattern === "waterfront")
      for (let i = 2; i < anchors.length; i += 2) {
        const a = anchors[i],
          b = anchors
            .filter((_, j) => j !== i && j !== 0)
            .sort(
              (u, v) =>
                Math.hypot(u.x - a.x, u.y - a.y) -
                Math.hypot(v.x - a.x, v.y - a.y),
            )[1];
        if (b && Math.hypot(a.x - b.x, a.y - b.y) < r)
          connect(a, b, `cross-lane${i}`, 0);
      }
  } else {
    for (const [i, dx, dy] of [
      [0, -1, 0],
      [1, 1, 0],
      [2, 0, -1],
      [3, 0, 1],
    ]) {
      if (profile.pattern === "farmstead" && i === 2) continue;
      let goal: Point | undefined;
      for (
        let distance =
          profile.pattern === "farmstead"
            ? i === 3
              ? r - 10
              : 32
            : profile.pattern === "roadside" && i > 1
              ? 32
              : r - 10;
        distance >= 18;
        distance -= 6
      ) {
        const q = { x: c.x + dx * distance, y: c.y + dy * distance };
        if (dry({ x: q.x - 2, y: q.y - 2, w: 5, h: 5 }, false)) {
          goal = q;
          break;
        }
      }
      if (goal)
        connect(
          c,
          goal,
          `approach${i}`,
          pack.setting?.settlement === "camp" ? 0 : 1,
        );
    }
    if (selected) {
      connect(c, selected.points[0], "bridge-approach-a");
      connect(c, selected.points.at(-1)!, "bridge-approach-b");
    }
    if (
      profile.pattern === "planned" ||
      profile.pattern === "dense" ||
      profile.pattern === "waterfront"
    ) {
      for (const offset of profile.pattern === "dense"
        ? [-47, -22, 19, 49]
        : [-52, -26, 26, 52])
        for (const vertical of [false, true]) {
          const bend =
            profile.pattern === "dense"
              ? Math.round(
                  (rand("lane-bend", offset, Number(vertical)) - 0.5) * 12,
                )
              : 0;
          const a = {
              x: c.x + (vertical ? offset : -r + 20),
              y: c.y + (vertical ? -r + 20 : offset),
            },
            b = {
              x: c.x + (vertical ? offset + bend : r - 20),
              y: c.y + (vertical ? r - 20 : offset + bend),
            };
          if (
            !dry({ x: a.x - 1, y: a.y - 1, w: 3, h: 3 }, false) ||
            !dry({ x: b.x - 1, y: b.y - 1, w: 3, h: 3 }, false)
          )
            continue;
          const band = vertical
            ? { x: a.x - 8, y: a.y, w: 24, h: b.y - a.y }
            : { x: a.x, y: a.y - 8, w: b.x - a.x, h: 24 };
          connect(a, b, `lane-${offset}-${vertical}`, 0, band);
        }
    } else if (profile.pattern === "clustered") {
      // Small household courts create several centers instead of a single street cross.
      for (let i = 0; i < 3; i++) {
        const a = i * 2.1 + rand("court-angle"),
          q = {
            x: c.x + Math.round(Math.cos(a) * 30),
            y: c.y + Math.round(Math.sin(a) * 30),
          };
        const court = { x: q.x - 3, y: q.y - 3, w: 7, h: 7 };
        if (dry(court) && connect(c, q, `court${i}`, 0)) {
          paint(court, "dirt");
          eachCell(court, (x, y) => roads.add(cellKey(x, y)));
          plan.plots.push({
            ...court,
            id: `${site.id}-court${i}`,
            kind: "public",
            access: q,
          });
        }
      }
    }
  }
  if (profile.pattern === "waterfront") {
    const shore = urbanShore();
    if (shore && connect(c, shore, "landing")) {
      const landing = { x: shore.x - 4, y: shore.y - 3, w: 9, h: 7 };
      eachCell(landing, (x, y) => {
        if (sample(x, y).water >= 0) {
          plan.surface.set(cellKey(x, y), "paving");
          plan.reserved.add(cellKey(x, y));
        }
      });
      plan.plots.push({
        ...landing,
        id: `${site.id}-landing`,
        kind: "public",
        access: shore,
      });
    }
  }
  // Sample street frontage; fit the entire building and yard before accepting an entrance.
  const frontage: ({
    point: Point;
    nx: number;
    ny: number;
  } & Partial<UrbanLot>)[] = [...urbanLots];
  for (const road of urban ? [] : plan.roads.filter((p) => p.kind !== "bridge"))
    for (
      let j = profile.frontage;
      j < road.points.length;
      j += organic
        ? Math.max(
            5,
            profile.frontage - 3 + Math.floor(rand(road.id, "spacing", j) * 7),
          )
        : profile.frontage
    ) {
      const p = road.points[j],
        a = road.points[organic ? Math.max(0, j - 4) : j - 1];
      if (
        Math.hypot(p.x - c.x, p.y - c.y) > r - 10 ||
        Math.hypot(p.x - c.x, p.y - c.y) < 10
      )
        continue;
      const vx = p.x - a.x,
        vy = p.y - a.y;
      const dx = organic
          ? Math.abs(vx) >= Math.abs(vy)
            ? Math.sign(vx)
            : 0
          : Math.sign(vx),
        dy = organic
          ? Math.abs(vy) > Math.abs(vx)
            ? Math.sign(vy)
            : 0
          : Math.sign(vy);
      if (!dx && !dy) continue;
      for (const sign of [-1, 1])
        frontage.push({ point: p, nx: -dy * sign, ny: dx * sign });
    }
  // Composed parcels already arrive in the order their own fabric implies, one
  // round per block. Re-sorting them by distance would spend the whole capacity
  // on the quarter beside the plaza.
  if (!(urban && composed))
    frontage.sort(
      (a, b) =>
        Math.hypot(a.point.x - c.x, a.point.y - c.y) -
          Math.hypot(b.point.x - c.x, b.point.y - c.y) ||
        a.point.x - b.point.x ||
        a.point.y - b.point.y,
    );
  const owners: string[] = [];
  const tStreets = tPlan;
  /** Households whose work is keeping animals, so a pen has someone to tend it. */
  const herders = new Set<string>();
  /** Households whose work is the fields, so a parcel has someone to till it. */
  const tillers = new Set<string>();
  // A composed settlement's capacity comes from its own extent and fabric; the
  // flat profile count still governs villages and the older layouts.
  const limit =
    urban && composed
      ? urbanBuildingLimit(
          profile.radius,
          fabric,
          profile.buildings,
          pack.setting?.year ?? 0,
        )
      : profile.buildings;
  plan.diagnostics.timing!.streets = Math.round(now() - tStreets);
  // Venues before the houses, so the ones that need a door take the lots
  // nearest the centre. A venue with no building of its own is recorded
  // straight away against a gathering point.
  const wanted = venuesFor(pack.setting, limit);
  plan.venues = [];
  const already = new Set(
    frontage.flatMap((lot) => (lot.venue ? [lot.venue.id] : [])),
  );
  const central = frontage
    .filter((lot) => !lot.religious && !lot.civic && !lot.venue)
    .sort(
      (a, b) =>
        Math.hypot(a.point.x - site.cx, a.point.y - site.cy) -
        Math.hypot(b.point.x - site.cx, b.point.y - site.cy),
    );
  const taken = new Set<(typeof central)[number]>();
  // A venue with a building of its own needs ground that will hold it. Those
  // go first and take the nearest lot big enough; the rest, which are houses
  // with a mark at the door, fit anywhere and take what is left.
  const housed = wanted
    .filter((v) => !v.open && !already.has(v.id))
    .sort((a, b) => (b.building ? 1 : 0) - (a.building ? 1 : 0));
  for (const venue of housed) {
    // Its own building where the ground allows; otherwise the nearest lot and
    // the mark at the door, which is better than the venue not existing.
    const lot = central.find((candidate) => !taken.has(candidate));
    if (!lot) continue;
    taken.add(lot);
    lot.venue = venue;
  }
  const tBuildings = now();
  const yards = yardKit(pack.setting);
  const yardChoices = yardBoundaries(pack.setting);
  /** Each household fences its own way, from what its place and day offer. */
  const yardBoundary = (i: number): Boundary =>
    yards.boundary === "era"
      ? pickBoundary(yardChoices, rand("yard-boundary", i))
      : yards.boundary;
  /** Fence and plant one yard. Every yard in the game comes through here: the
   * caller says which cells are fenced and which are bed, and this lays the
   * fence bits, the soil, the garden rows and the solid ring the same way. */
  const encloseYard = (
    area: Rect,
    skip: (x: number, y: number) => boolean,
    fenced: (x: number, y: number) => boolean,
    bedCrop: (x: number, y: number) => CropId | undefined,
    parcel: number,
    axis: "x" | "y",
    boundary: Boundary,
  ) => {
    const drawn = boundary !== "none";
    eachCell(area, (x, y) => {
      if (skip(x, y)) return;
      const k = cellKey(x, y);
      if (drawn && fenced(x, y)) {
        plan.solid.add(k);
        return;
      }
      let bits = 0;
      if (drawn) {
        if (fenced(x, y - 1)) bits |= 1;
        if (fenced(x + 1, y)) bits |= 2;
        if (fenced(x, y + 1)) bits |= 4;
        if (fenced(x - 1, y)) bits |= 8;
      }
      const crop = bedCrop(x, y);
      toftFields.push([
        k,
        {
          parcel: parcel + (crop ? 1 : 0),
          crop: crop ?? "pasture",
          axis,
          edges: bits,
          fence: bits,
          boundary,
          wet: false,
          garden: !!crop,
          yard: true,
        },
      ]);
      setSurface(k, crop ? "field" : "grass", 3);
    });
  };
  /** Stand one of the kit's props on a free cell. */
  const yardProp = (
    item: YardProp,
    at: Point,
    id: string,
    i: number,
    n: number,
  ) => {
    const cells = propVisualCells(item.prop, at).map((p) => cellKey(p.x, p.y));
    if (
      cells.some((k) => plan.solid.has(k) || roads.has(k) || propCells.has(k))
    )
      return false;
    cells.forEach((k) => propCells.add(k));
    plan.objects.push({
      id: `${id}-yard-${item.family}-${n}`,
      name: item.name,
      kind: "container",
      prop: item.prop,
      sprite: `study-propb-${item.family}-${Math.floor(rand("yard-art", i, n) * 3)}`,
      inventory: item.contents ?? {},
      pos: pos(at),
    });
    return true;
  };
  const propCells = new Set<string>();
  /** A household's yard: the ground in front, a bed to one side, and what the
   * kit and the resident's trade put in it. Three shapes, by the kit's
   * shares: fenced right round, fenced round the bed only, or open. */
  const layToft = (
    rect: Rect,
    door: Point,
    street: Point,
    work: Point,
    id: string,
    i: number,
    role: string,
    lot: Rect,
  ) => {
    const atWork = (x: number, y: number) =>
      Math.abs(x - work.x) <= 1 && Math.abs(y - work.y) <= 1;
    const southDoor = door.y === rect.y + rect.h;
    const items = yards.props.filter(
      (p, n) =>
        (!p.role || p.role.test(role)) && rand("yard-prop", i, n) < p.chance,
    );
    // Stores stand hard against the wall, clear of the door.
    const wallSpots: Point[] = [
      { x: rect.x - 1, y: rect.y + rect.h - 1 },
      { x: door.x - 2, y: rect.y + rect.h },
      { x: door.x + 2, y: rect.y + rect.h },
      { x: door.x + 3, y: rect.y + rect.h },
    ].filter(
      (p) =>
        !atWork(p.x, p.y) &&
        Math.abs(p.x - door.x) + Math.abs(p.y - door.y) > 1 &&
        (p.x < rect.x || (southDoor && p.x < rect.x + rect.w)),
    );
    items
      .filter((p) => p.where === "wall")
      .forEach((item, n) => {
        const at = wallSpots[n];
        if (at) yardProp(item, at, id, i, n);
      });
    if (southDoor)
      items
        .filter((p) => p.where === "door")
        .slice(0, 1)
        .forEach((item, n) =>
          yardProp(
            item,
            { x: door.x + (rand("tub-side", i) < 0.5 ? -1 : 1), y: door.y },
            id,
            i,
            20 + n,
          ),
        );
    // An unresearched setting still gets the container of its day by the door.
    if (
      !items.some((p) => p.where === "wall" && p.prop !== "woodpile") &&
      wallSpots[1]
    ) {
      const at = wallSpots[1];
      const k = cellKey(at.x, at.y);
      if (
        !plan.solid.has(k) &&
        !roads.has(k) &&
        !propCells.has(k) &&
        rand("clutter", i) < 0.6
      ) {
        propCells.add(k);
        plan.objects.push({
          id: `${id}-store-0`,
          name: "Household store",
          kind: "container",
          pos: pos(at),
          sprite: "basket",
          inventory: {},
        });
      }
    }

    const roll = rand("yard-style", i);
    const style =
      roll < yards.styles.wrap
        ? "wrap"
        : roll < yards.styles.wrap + yards.styles.side
          ? "side"
          : "open";
    const [fmin, fmax] = yards.front;
    const deepest =
      fmin + Math.floor(rand("toft-front", i) * (fmax - fmin + 1));
    const first = rand("toft-side", i) < 0.5 ? -1 : 1;
    const tries: [number, number, number][] = [];
    for (let front = Math.max(1, deepest); front >= 1; front--)
      for (const side of [first, -first])
        for (const bed of [5, 4, 3].slice(Math.floor(rand("toft-bed", i) * 2)))
          tries.push([front, side, bed]);
    yardPlans.push(() => {
      for (const [front, side, bed] of tries) {
        // A clear column on the right, where the side wall overhangs.
        const xl = rect.x - (side < 0 ? bed + 2 : 2),
          xr = rect.x + rect.w + (side > 0 ? bed + 2 : 2),
          yt = rect.y + rect.h - 2,
          yb = rect.y + rect.h + front;
        const toft = { x: xl, y: yt, w: xr - xl + 1, h: yb - yt + 1 };
        const inHouse = (x: number, y: number) =>
          x >= rect.x &&
          x < rect.x + rect.w &&
          y >= rect.y &&
          y < rect.y + rect.h;
        // The doorstep path is laid after the houses, straight to the street.
        const onWalk = (x: number, y: number) =>
          x >= Math.min(door.x, street.x) &&
          x <= Math.max(door.x, street.x) &&
          y >= Math.min(door.y, street.y) &&
          y <= Math.max(door.y, street.y);
        const open = (x: number, y: number) =>
          roads.has(cellKey(x, y)) ||
          onWalk(x, y) ||
          atWork(x, y) ||
          Math.abs(x - door.x) + Math.abs(y - door.y) <= 1;
        let fits = true;
        eachCell(toft, (x, y) => {
          if (inHouse(x, y) || open(x, y)) return;
          const k = cellKey(x, y);
          // The lot's own yard was reserved when the house went up.
          const own =
            x >= lot.x && x < lot.x + lot.w && y >= lot.y && y < lot.y + lot.h;
          if (
            sample(x, y).water < 4 ||
            plan.solid.has(k) ||
            (plan.reserved.has(k) && !own)
          )
            fits = false;
        });
        if (!fits) continue;
        eachCell(toft, (x, y) => {
          if (!inHouse(x, y)) plan.reserved.add(cellKey(x, y));
        });
        // The bed's own plot, at the garden end.
        const plot = {
          x: side < 0 ? xl : rect.x + rect.w + 1,
          y: yt,
          w: bed + 2,
          h: yb - yt + 1,
        };
        const crop =
          yards.beds[Math.floor(rand("yard-crop", i) * yards.beds.length)];
        // Fenced once every lane is laid, so the fence breaks for each of them.
        toftQueue.push(() => {
          const area = style === "wrap" ? toft : plot;
          const ring = (x: number, y: number) =>
            x === area.x ||
            x === area.x + area.w - 1 ||
            y === area.y ||
            y === area.y + area.h - 1;
          const inside = (x: number, y: number) =>
            x >= area.x &&
            x < area.x + area.w &&
            y >= area.y &&
            y < area.y + area.h;
          let crossed = false;
          eachCell(area, (x, y) => {
            if (ring(x, y) && !inHouse(x, y) && open(x, y)) crossed = true;
          });
          // No path crosses it: a gate in the front run, standing open.
          const gate =
            style === "open" || crossed
              ? undefined
              : {
                  x:
                    style === "wrap"
                      ? side < 0
                        ? rect.x + 1
                        : rect.x + rect.w - 2
                      : plot.x + 1 + (bed >> 1),
                  y: area.y + area.h - 1,
                };
          const fenced = (x: number, y: number) =>
            style !== "open" &&
            inside(x, y) &&
            ring(x, y) &&
            !inHouse(x, y) &&
            !open(x, y) &&
            !propCells.has(cellKey(x, y)) &&
            !(gate && gate.x === x && gate.y === y);
          const rows = { x: plot.x + 1, y: plot.y + 1, w: bed, h: plot.h - 3 };
          const planted = (x: number, y: number) =>
            x >= rows.x &&
            x < rows.x + rows.w &&
            y >= rows.y &&
            y < rows.y + rows.h &&
            // A trodden baulk splits a long bed in two.
            !(rows.h >= 4 && y === rows.y + (rows.h >> 1)) &&
            !open(x, y) &&
            !propCells.has(cellKey(x, y));
          encloseYard(
            style === "open" ? rows : area,
            inHouse,
            fenced,
            (x, y) => (planted(x, y) ? crop : undefined),
            100200 + i * 2,
            "x",
            yardBoundary(i),
          );
          if (gate) {
            const k = cellKey(gate.x, gate.y);
            if (!plan.solid.has(k) && !roads.has(k))
              plan.objects.push({
                id: `${id}-yard-gate`,
                name: "Garden gate",
                kind: "gate",
                pos: pos(gate),
                sprite: "gate-open",
                inventory: {},
                open: true,
              });
          }
          // The walk from the street is worn to earth inside the yard too.
          if (style === "wrap")
            eachCell(toft, (x, y) => {
              if (onWalk(x, y) && !inHouse(x, y))
                setSurface(cellKey(x, y), "dirt", 4);
            });
          // What stands in the bed and the open yard.
          const bedItem = items.find((p) => p.where === "bed");
          if (bedItem)
            yardProp(
              bedItem,
              { x: rows.x + (rows.w >> 1), y: rows.y + (rows.h >> 1) },
              id,
              i,
              30,
            );
          const free: Point[] = [];
          eachCell(toft, (x, y) => {
            if (
              !inHouse(x, y) &&
              !ring(x, y) &&
              !open(x, y) &&
              !(x >= plot.x && x < plot.x + plot.w) &&
              y > rect.y + rect.h
            )
              free.push({ x, y });
          });
          items
            .filter((p) => p.where === "yard")
            .forEach((item, n) => {
              const at =
                free[Math.floor(rand("yard-spot", i, n) * free.length)];
              if (at) yardProp(item, at, id, i, 40 + n);
            });
          if (yards.tree && rand("yard-tree", i) < yards.tree.chance) {
            const at = {
              x: side < 0 ? plot.x + 1 : plot.x + plot.w - 2,
              y: plot.y + plot.h - 2,
            };
            const k = cellKey(at.x, at.y);
            if (!plan.solid.has(k) && !roads.has(k) && !propCells.has(k)) {
              plan.solid.add(k);
              propCells.add(k);
              plan.objects.push({
                id: `${id}-yard-tree`,
                name: "Garden tree",
                kind: "tree",
                pos: pos(at),
                sprite:
                  yards.tree.sprites.find((t) => pack.trees.includes(t)) ??
                  yards.tree.sprites[0],
                inventory: {},
              });
            }
          }
        });
        return;
      }
    });
  };
  /** A town plot's back garden. Fenced on its low side and, where it shows,
   * its rear; the next plot's fence closes the other side. The bed and the
   * tree stand at the far end, clear of the roof that overhangs the near one. */
  const layGarden = (
    g: Rect & { last: boolean },
    house: Rect,
    id: string,
    i: number,
  ) => {
    eachCell(g, (x, y) => plan.reserved.add(cellKey(x, y)));
    const crop =
      yards.beds[Math.floor(rand("yard-crop", i) * yards.beds.length)];
    toftQueue.push(() => {
      const south = house.y + house.h === g.y,
        north = g.y + g.h === house.y,
        east = house.x + house.w === g.x;
      const rows = south || north;
      // Distance from the house, in cells: 0 is hard against its wall.
      const away = (x: number, y: number) =>
        south
          ? y - g.y
          : north
            ? g.y + g.h - 1 - y
            : east
              ? x - g.x
              : g.x + g.w - 1 - x;
      const depth = rows ? g.h : g.w;
      // Only a garden in front of the drawn house shows its rear fence; one
      // behind leaves it to the plot it backs onto.
      const rear = south || east;
      const gap = rows
        ? g.x + 1 + Math.floor(rand("garden-gap", i) * Math.max(1, g.w - 2))
        : g.y + 1 + Math.floor(rand("garden-gap", i) * Math.max(1, g.h - 2));
      const taken = (x: number, y: number) => {
        const k = cellKey(x, y);
        return roads.has(k) || !!plan.built?.has(k);
      };
      const fenced = (x: number, y: number) => {
        if (x < g.x || y < g.y || x >= g.x + g.w || y >= g.y + g.h)
          return false;
        if (taken(x, y)) return false;
        const low = rows ? x === g.x : y === g.y,
          high = g.last && (rows ? x === g.x + g.w - 1 : y === g.y + g.h - 1),
          back = rear && away(x, y) === depth - 1 && (rows ? x : y) !== gap;
        return low || high || back;
      };
      const bed = rand("garden-bed", i) < 0.7;
      const from = Math.max(1, depth - 3);
      encloseYard(
        g,
        (x, y) => taken(x, y) || plan.solid.has(cellKey(x, y)),
        fenced,
        (x, y) => {
          const along = rows ? x - g.x : y - g.y,
            span = rows ? g.w : g.h;
          return bed &&
            away(x, y) >= from &&
            away(x, y) < depth - (rear ? 1 : 0) &&
            along >= 1 &&
            along < Math.min(span - 1, 5)
            ? crop
            : undefined;
        },
        100400 + i * 2,
        rows ? "x" : "y",
        yardBoundary(i),
      );
      if (yards.tree && rand("garden-tree", i) < yards.tree.chance) {
        const at = rows
          ? { x: g.x + g.w - 2, y: south ? g.y + depth - 2 : g.y + 1 }
          : { x: east ? g.x + depth - 2 : g.x + 1, y: g.y + g.h - 2 };
        const k = cellKey(at.x, at.y);
        if (
          !plan.solid.has(k) &&
          !roads.has(k) &&
          dry({ ...at, w: 1, h: 1 }, false)
        ) {
          plan.solid.add(k);
          plan.objects.push({
            id: `${id}-garden-tree`,
            name: "Garden tree",
            kind: "tree",
            pos: pos(at),
            sprite:
              yards.tree.sprites.find((t) => pack.trees.includes(t)) ??
              yards.tree.sprites[0],
            inventory: {},
          });
        }
      }
    });
  };
  /** Household garden cells, merged with the pens after the farmland. */
  const toftFields: [string, FieldCell][] = [];
  const toftQueue: (() => void)[] = [];
  const yardPlans: (() => void)[] = [];
  for (let j = 0; j < frontage.length && plan.places.length < limit; j++) {
    const lot = frontage[j];
    const { point, nx, ny } = lot,
      i = plan.places.length;
    const base = chooseBuildingFrame(
      pack.buildings,
      {
        settlement: pack.setting?.settlement,
        density: urban
          ? Math.max(0.25, 1 - j / Math.max(1, frontage.length))
          : 0.3,
        wealth:
          lot.quarter === "elite"
            ? 78 + rand("building-means", j) * 22
            : lot.quarter === "market"
              ? 45 + rand("building-means", j) * 35
              : lot.quarter === "craft"
                ? 35 + rand("building-means", j) * 35
                : lot.quarter === "edge"
                  ? 10 + rand("building-means", j) * 35
                  : 20 + rand("building-means", j) * 55,
        quarter: lot.quarter,
      },
      rand("building-scale", j),
      rand("building", j),
    );
    const facing =
      nx > 0 ? "west" : nx < 0 ? "east" : ny > 0 ? "north" : "south";
    // A venue's own building comes from the plaza placement in urban.ts,
    // which fits the ground to the model. Swapping a landmark onto a lot
    // sized for a house here put its body across the path to its own door,
    // so a lot-assigned venue is the house with a mark at the door.
    const frame =
        lot.frame ??
        (buildingModels[`${base}-${facing}`] ? `${base}-${facing}` : base),
      model = buildingModel(frame),
      [w, h] = model.footprint;
    // Old assets are only used south-facing until their oriented recipes are available.
    if (frame === base && facing !== "south") continue;
    const setback = organic
      ? 2 + Math.floor(rand("setback", j) * 5)
      : profile.paved
        ? 3
        : 4;
    const door = lot.rect
      ? point
      : { x: point.x + nx * setback, y: point.y + ny * setback };
    // A venue on a composed lot keeps that lot's ground: recomputing the
    // rect from the door shifts the building off the lot it was fitted to,
    // and the street then runs behind it rather than to its door.
    const rect = lot.rect ?? {
      x: door.x - model.entrance[0],
      y: door.y - model.entrance[1],
      w,
      h,
    };
    const yard = lot.yard ?? {
      x: rect.x - 1 + (nx < 0 ? -4 : 0),
      y: rect.y - 1 + (ny < 0 ? -4 : 0),
      w: w + 2 + (nx ? 4 : 0),
      h: h + 2 + (ny ? 4 : 0),
    };
    // A composed lot was fitted against streets, walls and other lots when
    // it was laid out; the block painter has since reserved its ground, so
    // only wetness and slope are checked again here.
    if (!dry(yard, !lot.rect, rect)) {
      plan.diagnostics.rejectedBuildings++;
      continue;
    }
    if (lot.religious) {
      const id = `${site.id}-religious`;
      eachCell(rect, (x, y) => {
        plan.solid.add(cellKey(x, y));
        plan.built!.add(cellKey(x, y));
      });
      paint(rect, "dirt");
      // An apron rings the sanctuary, so its precinct reads on the ground and
      // a way round it always exists.
      const apronMaterial = stone;
      eachCell(
        { x: rect.x - 1, y: rect.y - 1, w: rect.w + 2, h: rect.h + 2 },
        (x, y) => {
          const k = cellKey(x, y);
          if (plan.solid.has(k) || !dry({ x, y, w: 1, h: 1 }, false)) return;
          plan.reserved.add(k);
          roads.add(k);
          if (
            !setSurface(k, profile.paved ? "paving" : "dirt", 5) ||
            !profile.paved
          )
            return;
          plan.pavement!.set(k, "footway");
          if (apronMaterial) plan.streetSurfaces!.set(k, apronMaterial);
        },
      );
      plan.places.push({
        id,
        name: lot.religious.labels[lot.religious.scale],
        owner: `${site.id}-community`,
        description: lot.religious.evidence.note,
        ...rect,
        sprite: frame,
        entrance: door,
        access: "public",
        claim: `religious-${lot.religious.id}`,
        entranceLabel: "Enter",
      });
      plan.objects.push({
        id: `${id}-exit`,
        name: "Return to the square",
        kind: "exit",
        pos: { x: 6, y: 9, space: id },
        sprite: "door-open",
        inventory: {},
      });
      plan.plots.push({
        ...rect,
        id: `${id}-plot`,
        kind: "public",
        access: door,
      });
      continue;
    }
    if (lot.civic) {
      const id = `${site.id}-civic`;
      eachCell(rect, (x, y) => {
        plan.solid.add(cellKey(x, y));
        plan.built!.add(cellKey(x, y));
      });
      paint(rect, "dirt");
      plan.places.push({
        id,
        name: lot.civic.label,
        owner: `${site.id}-community`,
        description: lot.civic.evidence.note,
        ...rect,
        sprite: frame,
        entrance: door,
        access: "public",
        claim: `civic-${lot.civic.id}`,
        entranceLabel: "Enter",
      });
      plan.objects.push({
        id: `${id}-exit`,
        name: "Return to the square",
        kind: "exit",
        pos: { x: 6, y: 9, space: id },
        sprite: "door-open",
        inventory: {},
      });
      plan.plots.push({
        ...rect,
        id: `${id}-plot`,
        kind: "public",
        access: door,
      });
      continue;
    }
    const id = `${site.id}-h${i}`,
      owner =
        site.home &&
        (urban ? owners.length === 0 : i === 0) &&
        (!pack.setting?.environment ||
          pack.setting.environment.start === "resident")
          ? "player"
          : profile.pattern === "farmstead" && i % 3 !== 0
            ? owners.at(-1)!
            : `${id}-person`;
    const workPoint = lot.workPoint ?? {
      x: rect.x + (nx > 0 ? w + 2 : nx < 0 ? -2 : Math.floor(w / 2)),
      y: rect.y + (ny > 0 ? h + 2 : ny < 0 ? -2 : Math.floor(h / 2)),
    };
    if (!connect(door, point, `door${i}`, 0)) continue;
    const entranceLabel =
      model.opening === "roof-hatch" ? "Climb inside" : "Enter";
    // A settlement that keeps animals asks for someone to keep them. Drawing
    // every household freely from the dozens of trades on offer left a farm
    // with livestock and nobody whose work was livestock, so no pen was built.
    const wanted =
      owner === "player"
        ? pack.role
        : lot.quarter === "market"
          ? "trader"
          : lot.quarter === "craft"
            ? "craftsperson"
            : (profile.livestock && canHerd && i % 3 === 1) ||
                (stockyard && i % 9 === 4)
              ? (workAt(
                  characterContext!,
                  "pasture",
                  characterSex(seed, owner),
                )[0]?.id ?? "herder")
              : profile.fields !== "none" && canFarm && i % 3 === 0
                ? (workAt(
                    characterContext!,
                    "field",
                    characterSex(seed, owner),
                  )[0]?.id ?? "farmer")
                : undefined;
    const livelihood = pack.setting?.characterRevision
      ? characterLivelihood(
          pack.setting,
          seed,
          owner,
          wanted,
          undefined,
          characterSex(seed, owner),
        )
      : undefined;
    const role = livelihood
      ? livelihood.label
      : owner === "player"
        ? pack.role
        : profile.fields !== "none"
          ? i % 3 === 0
            ? "Farmer"
            : i % 3 === 1
              ? "Herder"
              : pack.roles[i % pack.roles.length]
          : pack.roles[i % pack.roles.length];
    // Who keeps animals is a question about the work, not about one label. The
    // livelihood tables name dozens of trades, so matching "Herder" by name
    // left a farmstead with no pen, no gate and no animals at all.
    if (livelihood ? livelihood.activity === HERDING : role === "Herder")
      herders.add(owner);
    if (
      livelihood
        ? (livelihood.workplace ?? workplaceFor(livelihood.activity)) ===
          "field"
        : role === "Farmer"
    )
      tillers.add(owner);
    eachCell(rect, (x, y) => {
      plan.solid.add(cellKey(x, y));
      plan.built!.add(cellKey(x, y));
    });
    if (!connect(workPoint, door, `yard-access${i}`, 0)) {
      eachCell(rect, (x, y) => plan.solid.delete(cellKey(x, y)));
      continue;
    }
    const shopfront =
      lot.quarter === "market" || lot.quarter === "craft" || i % 4 === 1;
    if (lot.venue)
      plan.venues!.push({ venue: lot.venue, pos: door, placeId: id });
    plan.places.push({
      id,
      name: lot.venue
        ? lot.venue.label
        : lot.quarter === "market"
          ? `${role}'s shop`
          : lot.quarter === "elite"
            ? "Townhouse"
            : shopfront
              ? `${role}'s workshop`
              : i % 4 === 2
                ? "Household stores"
                : "Household",
      description: model.description,
      x: rect.x,
      y: rect.y,
      w,
      h,
      sprite: frame,
      entrance: door,
      access: lot.venue || shopfront ? "public" : "household",
      owner,
      claim: lot.venue ? `venue-${lot.venue.id}` : "landscape",
      entranceLabel,
    });
    if (urban) {
      paint(yard, "dirt");
      // Grass is edging: a ring round the house, not a field between them.
      if (cityGround)
        eachCell(
          { x: rect.x - 1, y: rect.y - 1, w: rect.w + 2, h: rect.h + 2 },
          (x, y) => {
            const k = cellKey(x, y);
            if (plan.solid.has(k) || roads.has(k)) return;
            if (dry({ x, y, w: 1, h: 1 }, false)) setSurface(k, "grass", 3);
          },
        );
      // The strip behind a house is worn to earth; the block stays grass.
      const back = ny
        ? {
            x: rect.x,
            y: ny > 0 ? rect.y + rect.h : rect.y - 1,
            w: rect.w,
            h: 1,
          }
        : {
            x: nx > 0 ? rect.x + rect.w : rect.x - 1,
            y: rect.y,
            w: 1,
            h: rect.h,
          };
      if (cityGround !== "grass")
        eachCell(back, (x, y) => {
          const k = cellKey(x, y);
          if (!plan.solid.has(k) && dry({ x, y, w: 1, h: 1 }, false))
            setSurface(k, "dirt", 3);
        });
      const footway = ny
        ? {
            x: rect.x,
            y: ny > 0 ? rect.y - 2 : rect.y + rect.h,
            w: rect.w,
            h: 2,
          }
        : {
            x: nx > 0 ? rect.x - 2 : rect.x + rect.w,
            y: rect.y,
            w: 2,
            h: rect.h,
          };
      const material = stone;
      // A footway runs beside a street; a house on open ground gets none, so
      // no stone patches stand alone.
      const streetNear = (x: number, y: number) => {
        for (let dy = -2; dy <= 2; dy++)
          for (let dx = -2; dx <= 2; dx++) {
            const k = cellKey(x + dx, y + dy);
            const p = plan.pavement!.get(k);
            if (roads.has(k) && p !== "footway" && p !== "verge") return true;
          }
        return false;
      };
      eachCell(footway, (x, y) => {
        const k = cellKey(x, y);
        if (plotted || !streetNear(x, y)) return;
        if (!plan.solid.has(k) && dry({ x, y, w: 1, h: 1 }, false)) {
          roads.add(k);
          if (
            !setSurface(k, profile.paved ? "paving" : "dirt", 5) ||
            !profile.paved
          )
            return;
          plan.pavement!.set(k, "footway");
          if (material) plan.streetSurfaces!.set(k, material);
        }
      });
      if (fabric.furniture?.includes("planter") && ny)
        for (const dx of [-2, 2]) {
          const at = { x: point.x + dx, y: point.y };
          const k = cellKey(at.x, at.y);
          if (plan.solid.has(k) || plan.pavement!.get(k) !== "footway")
            continue;
          if (at.x < rect.x || at.x >= rect.x + rect.w) continue;
          plan.objects.push({
            id: `${id}-planter-${dx < 0 ? "l" : "r"}`,
            name: ornaments.planter.label,
            kind: ornaments.planter.kind,
            sprite: ornaments.planter.sprite,
            pos: pos(at),
            inventory: {},
          });
        }
    } else if (organic)
      eachCell(yard, (x, y) => {
        plan.reserved.add(cellKey(x, y));
        if (
          Math.hypot(x - door.x, y - door.y) <
          (sharedRoads ? 1.4 : 2 + rand("yard-wear", i) * 2)
        )
          plan.surface.set(cellKey(x, y), "dirt");
      });
    else paint(yard, "dirt");

    plan.plots.push({
      ...yard,
      id: `${id}-plot`,
      kind: "household",
      owner,
      access: door,
    });
    buildingRoofCells(frame, rect).forEach((p) =>
      propCells.add(cellKey(p.x, p.y)),
    );
    if (organic && !urban && !lot.rect && (pack.setting?.year ?? 0) < 1800)
      layToft(rect, door, point, workPoint, id, i, role, yard);
    if (lot.garden) layGarden(lot.garden, rect, id, i);
    const side = {
      x: workPoint.x + (ny ? (urban ? -1 : 2) : 0),
      y: workPoint.y + (nx ? (urban ? -1 : 2) : 0),
    };
    const slot = {
      yard: [side],
      work: [{ x: workPoint.x - (ny ? 2 : 0), y: workPoint.y - (nx ? 2 : 0) }],
    };
    plan.slots.set(id, slot);
    // Also under the resident, so callers that have a person rather than a
    // building can find their yard.
    plan.slots.set(owner, slot);
    if (!owners.includes(owner)) {
      owners.push(owner);
      const home = pos(door);
      const a: Actor = {
        id: owner,
        name: proceduralName(pack.setting!, seed, owner),
        role,
        kind: "human",
        pos: { ...home },
        home,
        work: pos(workPoint),
        sprite: `human-${i % 3}-${i % 6}`,
        inventory:
          role === "Farmer"
            ? { grain: 8, water: 2, tool: 1 }
            : role === "Herder"
              ? { wool: 4, water: 2 }
              : role === "Weaver"
                ? { flax: 5, wool: 3, water: 2 }
                : { [pack.trade.take]: 4, [pack.trade.give]: 3, water: 2 },
        activity: "Household work",
        fatigue: 0,
        hunger: 5,
        trust: i % 3 === 0 ? 2 : 1,
        memories: [],
        direction: 2,
      };
      if (pack.setting?.characterRevision)
        Object.assign(
          a,
          generateCharacter(pack.setting, seed, owner, 34, role),
        );
      if (owner !== "player") plan.actors.push(a);
      // The threshold and the work pocket are held against scattered decoration.
      // A rock dropped on a work point is a resident who cannot reach their own
      // work, and the decoration layer only skips reserved ground.
      plan.reserved.add(cellKey(door.x, door.y));
      plan.reserved.add(cellKey(workPoint.x, workPoint.y));
      plan.work.set(owner, {
        home: door,
        work: workPoint,
        water: waterStand,
        social: {
          x: socialCenter.x - 2 + (i % 4),
          y: socialCenter.y + 1 + (Math.floor(i / 4) % 3),
        },
        label:
          role === "Weaver"
            ? "Weaving"
            : role === "Merchant"
              ? "Trading"
              : atWork(role),
        offset: Math.floor(rand(owner, "schedule") * 150),
      });
    }
    plan.objects.push(
      {
        id: `${id}-store`,
        name: "Household stores",
        kind: "container",
        pos: pos(side),
        sprite: "basket",
        inventory: pack.setting?.characterRevision
          ? eligibleInventory(
              { grain: 4, wood: 2 },
              resolveCharacterContext(pack.setting),
            )
          : { grain: 4, wood: 2 },
        owner,
      },
      {
        id: `${id}-exit`,
        name:
          model.opening === "roof-hatch" ? "Roof ladder" : "Door to the street",
        kind: "exit",
        pos: { x: 6, y: 9, space: id },
        sprite: model.opening === "roof-hatch" ? "ladder" : "door-open",
        inventory: {},
        owner,
      },
      {
        id: `${id}-bed`,
        name: "Sleeping place",
        kind: "bed",
        pos: { x: 4, y: 3, space: id },
        sprite: "bed",
        inventory: {},
        owner,
      },
      {
        id: `${id}-chest`,
        name: "Household chest",
        kind: "container",
        pos: { x: 8, y: 3, space: id },
        sprite: "basket",
        inventory: pack.setting?.characterRevision
          ? eligibleInventory(
              { grain: 3, wood: 2 },
              resolveCharacterContext(pack.setting),
            )
          : { grain: 3, wood: 2 },
        owner,
      },
    );
  }
  // Yards take what ground the houses left, so they never cost a house.
  for (const lay of yardPlans) lay();
  function landPlot(w: number, h: number, label: string): Rect | undefined {
    let best: Rect | undefined,
      score = Infinity,
      fits = 0;
    for (let ring = 45; ring <= r + 22; ring += 12)
      for (let i = 0; i < 20; i++) {
        const angle = organic
            ? rand(label, ring, i, "angle") * Math.PI * 2
            : (i * Math.PI) / 10 + rand(label, "angle"),
          rect = {
            x: c.x + Math.round(Math.cos(angle) * ring) - Math.floor(w / 2),
            y: c.y + Math.round(Math.sin(angle) * ring) - Math.floor(h / 2),
            w,
            h,
          };
        // The footprint and the row its gate opens onto must be level.
        if (
          dry({ x: rect.x - 2, y: rect.y - 2, w: w + 4, h: h + 4 }, true, {
            ...rect,
            h: h + 1,
          })
        ) {
          if (!organic) return rect;
          const f = sample(rect.x + w / 2, rect.y + h / 2);
          const value =
            Math.abs(f.moisture - 0.62) * 60 +
            Math.hypot(rect.x - c.x, rect.y - c.y) * 0.1;
          if (value < score) {
            score = value;
            best = rect;
          }
          if (++fits >= 6) return best;
        }
      }
    return best;
  }
  // By the work, not the label: the livelihood tables name dozens of trades,
  // so matching "Farmer" by name left every parcel unowned.
  const fieldOwners = characterContext
    ? owners.filter((id) => tillers.has(id))
    : owners;
  const farmable =
    profile.fields !== "none" &&
    fieldOwners.length > 0 &&
    (!characterContext ||
      characterContext.profile.allowedItems.includes("grain"));
  /** Fields, lanes and canals round the town. Laid after the pens and
   * yards, which want the near ground, and before routines. */
  const layFarmland = () => {
    const tFields = now();
    // The regional roads through the territory are laid after the fields,
    // so the fields have to know where they will run.
    const throughRoads = new Set<string>();
    for (const road of connections)
      roadCells(road, (x, y) => throughRoads.add(cellKey(x, y)));
    let centerlines: Set<string> | undefined;
    const farmland = planFarmland({
      site,
      pack,
      seed,
      sample,
      urban,
      connections,
      taken: (x, y) => {
        const k = cellKey(x, y);
        return (
          plan.reserved.has(k) ||
          plan.solid.has(k) ||
          roads.has(k) ||
          throughRoads.has(k)
        );
      },
      solid: (x, y) => plan.solid.has(cellKey(x, y)),
      foreign,
      // A town gets about a hundred parcels, a village one or two a house.
      cap: urban
        ? Math.max(40, Math.min(110, Math.round(plan.places.length * 0.4)))
        : Math.max(6, plan.places.length * 2),
      // Lanes are straight and laid from the far end in, so each ends on
      // the lane or spoke it serves; a spoke's inner end is routed the last
      // few cells onto the town's own streets.
      // A fence or plot tree can split the straight line; route round it so
      // the lane still reaches the spoke it serves.
      // A fence or plot tree across the line would split it into pieces that
      // join nothing, so route round it.
      lane: (a, b, label) =>
        line(a, b).some((p) => plan.solid.has(cellKey(p.x, p.y)))
          ? connect(a, b, `field-${label}`, 0, bounds)?.points
          : lay(a, b, `field-${label}`, 1, true, "path")?.points,
      join: (a, label) => connect(a, c, `field-${label}`, 0, bounds)?.points,
      street: (x, y) => {
        centerlines ??= new Set(
          plan.roads.flatMap((r) => r.points.map((q) => cellKey(q.x, q.y))),
        );
        return centerlines.has(cellKey(x, y));
      },
      owners: fieldOwners,
      homeOf: (owner) => plan.work.get(owner)?.home,
    });
    if (farmland) {
      plan.fields = farmland.fields;
      plan.canals = farmland.canals;
      plan.canalsDry = farmland.canalsDry;
      plan.culverts = farmland.culverts;
      plan.parcels = farmland.parcels;
      plan.territory = farmland.territory;
      for (const [k, cell] of farmland.fields) {
        // Pasture is grass with a fence round it; everything else is worked soil.
        setSurface(k, cell.crop === "pasture" ? "grass" : "field", 3);
        noRoad.add(k);
      }
      // A canal is water a cell wide; a track crosses it on a culvert deck.
      // A dry one is walkable ground, so it keeps the field surface.
      for (const k of farmland.canals) {
        if (!farmland.canalsDry) setSurface(k, "water", 6);
        plan.reserved.add(k);
        noRoad.add(k);
      }
      for (const k of farmland.culverts) {
        setSurface(k, "bridge", 10);
        plan.reserved.add(k);
      }
      for (const [i, w] of farmland.wells.entries()) {
        const k = cellKey(w.x, w.y);
        plan.solid.add(k);
        plan.reserved.add(k);
        plan.objects.push({
          id: `${site.id}-field-well-${i}`,
          name: "Irrigation well",
          kind: "well",
          sprite: "farm-well-shadoof",
          pos: pos(w),
          inventory: { water: 20 },
        });
      }
      // Only a worked parcel is a plot: the sim routes to plots, and the
      // far fields are scenery until someone is given them.
      for (const parcel of farmland.parcels) {
        if (!parcel.owner) continue;
        // A field the household cannot walk to in a fair search is not its
        // field: the gate estimate misses a wall's detour.
        const home = plan.work.get(parcel.owner)?.home;
        if (
          home &&
          route(
            home,
            parcel.access,
            (to) => (plan.solid.has(cellKey(to.x, to.y)) ? Infinity : 1),
            { maxNodes: 9000 },
          ).status !== "found"
        ) {
          delete parcel.owner;
          continue;
        }
        const id = `${site.id}-parcel${parcel.id}`;
        plan.plots.push({
          ...parcel.rect,
          id,
          kind: "field",
          owner: parcel.owner,
          access: parcel.access,
        });
        const crop = crops[parcel.crop];
        // A worked parcel is stooked after harvest; a pasture or fallow is not.
        if (crop.kind !== "pasture" && crop.kind !== "fallow")
          sheaves(id, parcel.rect, parcel.access, (x, y) =>
            farmland.fields.has(cellKey(x, y)),
          );
        if (crop.kind === "pasture" || crop.kind === "fallow") continue;
        // A few tended plants per parcel: what the farmer's round visits and
        // the harvest comes from. The ground raster draws the crop itself.
        let n = 0;
        for (
          let y = parcel.rect.y + 2;
          y < parcel.rect.y + parcel.rect.h - 1;
          y += 5
        )
          for (
            let x = parcel.rect.x + 2;
            x < parcel.rect.x + parcel.rect.w - 1;
            x += 5
          ) {
            if (n >= 4 || !farmland.fields.has(cellKey(x, y))) continue;
            n++;
            plan.objects.push({
              id: `${id}-crop-${x - parcel.rect.x}-${y - parcel.rect.y}`,
              name: crop.label,
              kind: "crop",
              pos: pos({ x, y }),
              sprite: cropSprite(parcel.crop),
              inventory: crop.yields ? { [crop.yields]: 3 } : {},
              ...(crop.yields
                ? {
                    resource: {
                      item: crop.yields,
                      capacity: 3,
                      regrowSeconds: 28 * 86400,
                      seasons: (
                        ["spring", "summer", "autumn", "winter"] as const
                      ).filter((season) => crop.calendar[season] === "ripe"),
                      readyAt: 0,
                    },
                  }
                : {}),
              owner: parcel.owner,
              claim: "landscape",
            });
          }
      }
    }
    plan.diagnostics.timing!.fields = Math.round(now() - tFields);
  };
  if (!farmed && farmable)
    for (let i = 0; i < (profile.pattern === "farmstead" ? 5 : 4); i++) {
      const w =
          profile.fields === "strips"
            ? 6
            : profile.fields === "household"
              ? 9
              : 20,
        h =
          profile.fields === "strips"
            ? 24
            : profile.fields === "household"
              ? 10
              : 13;
      const field = landPlot(w, h, `field${i}`);
      if (!field) continue;
      const access = { x: field.x + Math.floor(w / 2), y: field.y + h + 1 };
      eachCell(field, (x, y) => noRoad.add(cellKey(x, y)));
      if (!connect(c, access, `field-access${i}`, 0)) {
        eachCell(field, (x, y) => noRoad.delete(cellKey(x, y)));
        continue;
      }
      const owner = fieldOwners[i % fieldOwners.length],
        id = `${site.id}-field${i}`;
      paint(field, "field");
      eachCell(field, (x, y) => noRoad.add(cellKey(x, y)));
      plan.plots.push({ ...field, id, kind: "field", owner, access });
      for (let y = field.y + 2; y < field.y + h - 2; y += 6)
        for (let x = field.x + 2; x < field.x + w - 2; x += 6)
          plan.objects.push({
            id: `${id}-crop-${x - field.x}-${y - field.y}`,
            name: "Cultivated grain",
            kind: "crop",
            pos: pos({ x, y }),
            sprite: "wheat",
            inventory: { grain: 3 },
            ...(pack.setting?.environment
              ? {
                  resource: {
                    item: "grain" as const,
                    capacity: 3,
                    regrowSeconds: 28 * 86400,
                    seasons: ["summer", "autumn"],
                    readyAt: 0,
                  },
                }
              : {}),
            owner,
            claim: "landscape",
          });
      sheaves(id, field, access, (x, y) => !plan.solid.has(cellKey(x, y)));
      const a = plan.actors.find((a) => a.id === owner)!;
      if (a) {
        a.role = "Farmer";
        a.work = pos(access);
      }
      const work = plan.work.get(owner)!;
      work.work = access;
      work.label = "Tending the field";
    }
  const herdOwners = owners
    .filter((id) => id !== "player" && herders.has(id))
    .slice(-2);
  const kept = pack.setting ? faunaAt(pack.setting) : [];
  /** The species a settlement of this date keeps in a given place. Order is
   * the seed's, not the catalogue's, so two towns of the same period do not
   * both get the first animal in the file. */
  const keptFor = (place: "pen" | "yard" | "paddock") =>
    kept
      .filter(
        (k) =>
          k.keeping?.place === place &&
          (pack.setting?.year ?? 0) >= (k.keeping.from ?? -Infinity),
      )
      .map(
        (k) =>
          [
            k,
            random(seed, site.id, "keep", place, k.id) /
              (k.keeping?.share ?? 1),
          ] as const,
      )
      .sort((a, b) => a[1] - b[1])
      .map(([k]) => k);
  const penStock = keptFor("pen");
  // A dog is not an alternative to hens: it has a pass of its own below.
  const yardStock = keptFor("yard").filter((k) => k.id !== "dog");
  const dog = kept.find((k) => k.id === "dog");
  const paddockStock = keptFor("paddock");
  /** Pen and paddock cells drawn by the field raster, so a pen wears the same
   * wall, rails or wire as the fields of its day. Merged after the farmland so
   * they never count as cropland. */
  const penFields: [string, FieldCell][] = [];
  const year = pack.setting?.year ?? 0;
  const penBoundary =
    localPen(pack.setting) ?? (year < -800 ? "wall" : eraEnclosure(year));
  const fenceCell = (parcel: number, fence: number): FieldCell => ({
    parcel,
    crop: "pasture",
    axis: "x",
    edges: fence,
    fence,
    boundary: penBoundary,
    wet: false,
  });
  if ((profile.livestock || stockyard) && herdOwners.length)
    for (let i = 0; i < Math.min(2, herdOwners.length); i++) {
      // Terraced ground rarely offers a full-size level plot; a smaller pen
      // beats no herder at all.
      const pen =
        landPlot(12, 11, `pen${i}`) ??
        landPlot(9, 8, `pen${i}`) ??
        landPlot(7, 6, `pen${i}`);
      if (!pen) continue;
      const gate = { x: pen.x + Math.floor(pen.w / 2), y: pen.y + pen.h - 1 },
        outside = { x: gate.x, y: gate.y + 1 };
      eachCell(pen, (x, y) => noRoad.add(cellKey(x, y)));
      if (!connect(c, outside, `pen-access${i}`, 0)) {
        eachCell(pen, (x, y) => noRoad.delete(cellKey(x, y)));
        continue;
      }
      const owner = herdOwners[i],
        id = `${site.id}-pen${i}`,
        gateId = `${id}-gate`;
      // The raster draws the fence; the enclosure only keeps trees off the gate.
      plan.enclosures.push({ ...pen, gate, parts: [] });
      eachCell(pen, (x, y) => {
        const k = cellKey(x, y);
        plan.reserved.add(k);
        const edge =
          x === pen.x ||
          x === pen.x + pen.w - 1 ||
          y === pen.y ||
          y === pen.y + pen.h - 1;
        if (edge && (x !== gate.x || y !== gate.y)) plan.solid.add(k);
        if (edge) return;
        // The fence stands on the solid ring, so the bits sit on the cells
        // just inside it; the run breaks above the gate.
        let bits = 0;
        if (y === pen.y + 1) bits |= 1;
        if (x === pen.x + pen.w - 2) bits |= 2;
        if (y === pen.y + pen.h - 2 && x !== gate.x) bits |= 4;
        if (x === pen.x + 1) bits |= 8;
        penFields.push([k, fenceCell(100000 + i * 2, bits)]);
        setSurface(k, "grass", 3);
      });
      plan.objects.push({
        id: gateId,
        name: "Livestock gate",
        kind: "gate",
        pos: pos(gate),
        sprite: "gate",
        inventory: {},
        open: false,
        owner,
      });
      plan.objects.push({
        id: `${id}-trough`,
        name: "Animal trough",
        kind: "container",
        prop: "trough",
        sprite: `study-propb-trough-${Math.floor(rand(id, "trough-art") * 3)}`,
        inventory: { water: 4 },
        owner,
        pos: pos({ x: pen.x + 2, y: pen.y + 2 }),
      });
      const pasture = { x: gate.x - 3, y: gate.y + 3, w: 7, h: 6 };
      const hasPasture = dry(pasture);
      if (hasPasture) {
        // A paddock fenced on three sides, its open mouth toward the gate,
        // with a trough by the far fence.
        eachCell(pasture, (x, y) => {
          const k = cellKey(x, y);
          plan.reserved.add(k);
          let bits = 0;
          if (x === pasture.x + pasture.w - 1) bits |= 2;
          if (y === pasture.y + pasture.h - 1) bits |= 4;
          if (x === pasture.x) bits |= 8;
          penFields.push([k, fenceCell(100001 + i * 2, bits)]);
          setSurface(k, "grass", 3);
        });
        for (let x = pasture.x - 1; x <= pasture.x + pasture.w; x++)
          for (let y = pasture.y - 1; y <= pasture.y + pasture.h; y++)
            noRoad.add(cellKey(x, y));
        plan.plots.push({
          ...pasture,
          id: `${id}-pasture`,
          kind: "pasture",
          owner,
          access: outside,
        });
        plan.objects.push({
          id: `${id}-paddock-trough`,
          name: "Feeding trough",
          kind: "container",
          prop: "trough",
          sprite: `study-propb-trough-${Math.floor(rand(id, "paddock-trough-art") * 3)}`,
          inventory: { fodder: 3, water: 2 },
          owner,
          pos: pos({
            x: pasture.x + Math.floor(pasture.w / 2),
            y: pasture.y + pasture.h - 2,
          }),
        });
      }
      plan.plots.push({ ...pen, id, kind: "pasture", owner, access: outside });
      const herder = plan.actors.find((a) => a.id === owner)!;
      herder.role = "Herder";
      herder.work = pos(outside);
      const hw = plan.work.get(owner)!;
      hw.work = outside;
      hw.gateId = gateId;
      hw.label = "Tending livestock";
      const penSpecies = penStock[i % Math.max(1, penStock.length)];
      if (penSpecies) {
        // One group for the pen: the engine moves it as a herd.
        const interior: Point[] = [];
        eachCell(pen, (x, y) => {
          if (
            x > pen.x &&
            x < pen.x + pen.w - 1 &&
            y > pen.y &&
            y < pen.y + pen.h - 1 &&
            !(x === pen.x + 2 && y === pen.y + 2)
          )
            interior.push({ x, y });
        });
        const count = Math.min(
          interior.length,
          3 + Math.floor(random(seed, id, "herd") * 2),
        );
        const stride = Math.max(1, Math.floor(interior.length / count));
        const members: FaunaMember[] = Array.from(
          { length: count },
          (_, j) => ({
            ...interior[(j * stride + 1) % interior.length],
            direction: j % 2 ? 3 : 1,
          }),
        );
        const middle = {
          x: pen.x + Math.floor(pen.w / 2),
          y: pen.y + Math.floor(pen.h / 2),
        };
        (plan.fauna ??= []).push({
          id: `${id}-herd`,
          speciesId: penSpecies.id,
          members,
          pos: pos(members[0]),
          home: pos(middle),
          homeRadius: Math.max(pen.w, pen.h),
          state: "rest",
          nextDecisionAt: 0,
          stride: 0,
          since: 0,
          owner,
          gateId,
          pasture: hasPasture
            ? pos({ x: pasture.x + 3, y: pasture.y + 2 })
            : undefined,
        });
      }
    }
  // A paddock: bigger than a livestock pen, no herder routine and no gate to
  // open, because animals at grass are left at grass. Horses where horses are
  // kept, a coney-garth of rabbits where and when warrens were built.
  const paddockSpecies = paddockStock[0];
  const paddockYoung =
    paddockSpecies?.young && faunaProfile(paddockSpecies.young.id);
  if (paddockSpecies && owners.length && rand("paddock") < 0.7) {
    const paddock =
      landPlot(20, 16, "paddock") ??
      landPlot(16, 13, "paddock") ??
      landPlot(13, 11, "paddock");
    if (paddock) {
      const gate = {
        x: paddock.x + Math.floor(paddock.w / 2),
        y: paddock.y + paddock.h - 1,
      };
      const outside = { x: gate.x, y: gate.y + 1 };
      eachCell(paddock, (x, y) => noRoad.add(cellKey(x, y)));
      if (!connect(c, outside, "pen-access-paddock", 0))
        eachCell(paddock, (x, y) => noRoad.delete(cellKey(x, y)));
      else {
        const owner = herdOwners[0] ?? owners[0];
        const id = `${site.id}-paddock`;
        plan.enclosures.push({ ...paddock, gate, parts: [] });
        const interior: Point[] = [];
        eachCell(paddock, (x, y) => {
          const k = cellKey(x, y);
          plan.reserved.add(k);
          const edge =
            x === paddock.x ||
            x === paddock.x + paddock.w - 1 ||
            y === paddock.y ||
            y === paddock.y + paddock.h - 1;
          if (edge && (x !== gate.x || y !== gate.y)) plan.solid.add(k);
          if (edge) return;
          let bits = 0;
          if (y === paddock.y + 1) bits |= 1;
          if (x === paddock.x + paddock.w - 2) bits |= 2;
          if (y === paddock.y + paddock.h - 2 && x !== gate.x) bits |= 4;
          if (x === paddock.x + 1) bits |= 8;
          penFields.push([k, fenceCell(100020, bits)]);
          setSurface(k, "grass", 3);
          interior.push({ x, y });
        });
        plan.objects.push({
          id: `${id}-gate`,
          name: "Paddock gate",
          kind: "gate",
          pos: pos(gate),
          sprite: "gate",
          inventory: {},
          open: false,
          owner,
        });
        plan.objects.push({
          id: `${id}-trough`,
          name: "Water trough",
          kind: "container",
          prop: "trough",
          sprite: `study-propb-trough-${Math.floor(rand(id, "trough-art") * 3)}`,
          inventory: { water: 5 },
          owner,
          pos: pos({ x: paddock.x + 2, y: paddock.y + 2 }),
        });
        plan.plots.push({
          ...paddock,
          id,
          kind: "pasture",
          owner,
          access: outside,
        });
        const middle = {
          x: paddock.x + Math.floor(paddock.w / 2),
          y: paddock.y + Math.floor(paddock.h / 2),
        };
        const spread = (count: number, from: number) => {
          const stride = Math.max(1, Math.floor(interior.length / (count + 1)));
          return Array.from({ length: count }, (_, j) => ({
            ...interior[(from + j * stride) % interior.length],
            direction: (j % 4) as 0 | 1 | 2 | 3,
          }));
        };
        const [low, high] = paddockSpecies.groupSize;
        const count = Math.min(
          interior.length,
          low + Math.floor(rand(id, "stock") * (high - low + 1)),
        );
        (plan.fauna ??= []).push({
          id: `${id}-stock`,
          speciesId: paddockSpecies.id,
          members: spread(count, 1),
          pos: pos(middle),
          home: pos(middle),
          homeRadius: Math.max(paddock.w, paddock.h),
          state: paddockSpecies.art.graze ? "graze" : "forage",
          nextDecisionAt: 0,
          stride: 0,
          since: 0,
          owner,
        });
        // The young keep to the adults, never a paddock of their own.
        if (paddockYoung && rand(id, "young") < paddockSpecies.young!.chance)
          plan.fauna.push({
            id: `${id}-young`,
            speciesId: paddockYoung.id,
            members: spread(1 + Math.floor(rand(id, "young-count") * 2), 5),
            pos: pos(middle),
            home: pos(middle),
            homeRadius: Math.max(paddock.w, paddock.h),
            state: "idle",
            nextDecisionAt: 0,
            stride: 0,
            since: 0,
            owner,
          });
      }
    }
  }
  if (farmed) layFarmland();
  // Wayside furniture, once every road is down: a waymark where three ways
  // meet, farthest out first, and a shrine beside the road into the place.
  {
    const wayside = waysideFor(pack.setting);
    const arms = (x: number, y: number) =>
      [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ].filter(([dx, dy]) => centers.has(cellKey(x + dx, y + dy))).length;
    const beside = (x: number, y: number): Point | undefined =>
      [
        [1, -1],
        [-1, -1],
        [1, 1],
        [-1, 1],
      ]
        .map(([dx, dy]) => ({ x: x + dx, y: y + dy }))
        .find((at) => {
          const k = cellKey(at.x, at.y);
          return (
            !roads.has(k) &&
            !plan.solid.has(k) &&
            !plan.reserved.has(k) &&
            dry({ ...at, w: 1, h: 1 }, false)
          );
        });
    const stand = (
      at: Point,
      family: string,
      prop: string,
      name: string,
      variant: number,
      n: number,
    ) => {
      plan.solid.add(cellKey(at.x, at.y));
      plan.reserved.add(cellKey(at.x, at.y));
      plan.objects.push({
        id: `${site.id}-${family}-${n}`,
        name,
        kind: "container",
        prop,
        sprite: `study-propb-${family}-${variant}`,
        inventory: {},
        pos: pos(at),
      });
    };
    const junctions = [...centers]
      .map((k) => {
        const [x, y] = k.split(",").map(Number);
        return { x, y, d: Math.hypot(x - c.x, y - c.y) };
      })
      .filter((j) => j.d > 10 && arms(j.x, j.y) >= 3)
      .sort((a, b) => b.d - a.d || a.x - b.x || a.y - b.y);
    let marked = 0;
    const placed: Point[] = [];
    for (const j of junctions) {
      if (
        (wayside.waymark ?? wayside.stone) === undefined ||
        marked >= (urban ? 1 : 2)
      )
        break;
      if (placed.some((p) => Math.hypot(p.x - j.x, p.y - j.y) < 14)) continue;
      const at = beside(j.x, j.y);
      if (!at) continue;
      if (wayside.waymark !== undefined)
        stand(at, "waymark", "waymark", "Waymark", wayside.waymark, marked++);
      else
        stand(
          at,
          "standing-stone",
          "standingStone",
          "Standing stone",
          wayside.stone!,
          marked++,
        );
      placed.push(j);
    }
    if (
      wayside.shrine !== undefined &&
      !urban &&
      rand("wayside-shrine") < 0.65
    ) {
      const road = [...centers]
        .map((k) => {
          const [x, y] = k.split(",").map(Number);
          return { x, y, d: Math.hypot(x - c.x, y - c.y) };
        })
        .filter((j) => j.d > r * 0.45 && j.d < r * 0.8 && arms(j.x, j.y) === 2)
        .sort(
          (a, b) => rand("shrine-at", a.x, a.y) - rand("shrine-at", b.x, b.y),
        );
      for (const j of road) {
        if (placed.some((p) => Math.hypot(p.x - j.x, p.y - j.y) < 10)) continue;
        const at = beside(j.x, j.y);
        if (!at) continue;
        stand(
          at,
          "wayside-shrine",
          "waysideShrine",
          "Wayside shrine",
          wayside.shrine,
          0,
        );
        break;
      }
    }
  }
  // A churchyard: a stone wall broken where the paths come in, grass, a few
  // trees along the wall and the stones of the dead.
  for (const [n, { yard, church }] of churchyards.entries()) {
    const inChurch = (x: number, y: number) =>
      x >= church.x &&
      x < church.x + church.w &&
      y >= church.y &&
      y < church.y + church.h;
    const open = (x: number, y: number) => {
      const k = cellKey(x, y);
      return (
        roads.has(k) ||
        plan.pavement?.has(k) ||
        plan.surface.get(k) === "paving"
      );
    };
    const ring = (x: number, y: number) =>
      x === yard.x ||
      x === yard.x + yard.w - 1 ||
      y === yard.y ||
      y === yard.y + yard.h - 1;
    encloseYard(
      yard,
      (x, y) => inChurch(x, y) || open(x, y) || plan.solid.has(cellKey(x, y)),
      (x, y) =>
        x >= yard.x &&
        y >= yard.y &&
        x < yard.x + yard.w &&
        y < yard.y + yard.h &&
        ring(x, y) &&
        !open(x, y) &&
        !inChurch(x, y),
      () => undefined,
      100800 + n,
      "x",
      "wall",
    );
    const spots: Point[] = [];
    eachCell(yard, (x, y) => {
      const k = cellKey(x, y);
      if (!ring(x, y) && !inChurch(x, y) && !open(x, y) && !plan.solid.has(k))
        spots.push({ x, y });
    });
    // Nothing in front of the door or under the roof behind.
    const clear = spots.filter(
      (at) =>
        at.y > church.y && (at.x < church.x - 1 || at.x > church.x + church.w),
    );
    clear.forEach((at, m) => {
      const roll = rand("churchyard", n, m);
      if (roll > 0.45) return;
      const k = cellKey(at.x, at.y);
      plan.solid.add(k);
      plan.objects.push(
        roll < 0.1
          ? {
              id: `${site.id}-churchyard-tree-${m}`,
              name: "Churchyard tree",
              kind: "tree",
              pos: pos(at),
              sprite: pack.trees[m % pack.trees.length],
              inventory: {},
            }
          : {
              id: `${site.id}-gravestone-${m}`,
              name: "Gravestone",
              kind: ornaments.stele.kind,
              pos: pos(at),
              sprite: roll < 0.22 ? "market-cross" : "stele",
              inventory: {},
            },
      );
    });
  }
  for (const fence of toftQueue) fence();
  if (penFields.length || toftFields.length) {
    plan.fields ??= new Map();
    for (const [k, cell] of [...penFields, ...toftFields])
      plan.fields.set(k, cell);
  }
  // A town does not share one wellhead: each quarter draws from its own.
  // Placed off a doorstep rather than in a yard slot, because a dense city
  // has no spare yard, and the prop kit gives an urban site the big well.
  if (urban) {
    const wells: Point[] = [];
    for (const b of plan.places) {
      if (wells.length >= 3) break;
      const out = [
        { x: b.entrance.x, y: b.entrance.y + 2 },
        { x: b.entrance.x + 2, y: b.entrance.y },
        { x: b.entrance.x - 2, y: b.entrance.y },
        { x: b.entrance.x, y: b.entrance.y - 2 },
      ].find(
        (p) =>
          !plan.solid.has(cellKey(p.x, p.y)) &&
          !plan.traffic.has(cellKey(p.x, p.y)) &&
          !plan.reserved.has(cellKey(p.x, p.y)) &&
          dry({ ...p, w: 1, h: 1 }, false),
      );
      if (!out) continue;
      const far = (p: Point, d: number) =>
        Math.abs(p.x - out.x) + Math.abs(p.y - out.y) >= d;
      if (!far(socialCenter, 16) || !wells.every((w) => far(w, 20))) continue;
      wells.push({ ...out });
      plan.solid.add(cellKey(out.x, out.y));
      plan.objects.push({
        id: `${site.id}-quarter-well${wells.length}`,
        name: "Shared water source",
        kind: "well",
        pos: pos(out),
        sprite: "well",
        inventory: {},
      });
    }
  }
  // Hens scratching about the yard, or a pig or two rooting by the door, for
  // the households that keep them. Neighbours need not keep the same animal.
  if (yardStock.length) {
    let flocks = 0;
    for (const owner of owners) {
      if (flocks >= 3) break;
      if (owner === "player") continue;
      const yard = plan.slots.get(owner)?.yard[0];
      if (!yard || plan.solid.has(cellKey(yard.x, yard.y))) continue;
      if (random(seed, owner, "hens") > 0.6) continue;
      const species =
        yardStock[
          Math.floor(random(seed, owner, "yard-species") * yardStock.length)
        ];
      const most = species.groupSize[1];
      const members: FaunaMember[] = [];
      for (let dy = -1; dy <= 1 && members.length < most; dy++)
        for (let dx = -1; dx <= 1 && members.length < most; dx++) {
          const x = yard.x + dx,
            y = yard.y + dy;
          if (
            plan.solid.has(cellKey(x, y)) ||
            plan.traffic.has(cellKey(x, y)) ||
            random(seed, owner, "hen", dx, dy) > 0.55
          )
            continue;
          members.push({ x, y, direction: dx < 0 ? 3 : 1 });
        }
      if (members.length < 2) continue;
      (plan.fauna ??= []).push({
        id: `${site.id}-flock-${owner}`,
        speciesId: species.id,
        members,
        pos: pos(members[0]),
        home: pos(yard),
        homeRadius: 4,
        state: species.art.forage ? "forage" : "graze",
        nextDecisionAt: 0,
        stride: 0,
        since: 0,
        owner,
      } satisfies FaunaGroup);
      flocks++;
    }
  }
  // Most places have a dog or two about, whatever else they keep: lying by a
  // door, or a pair of them together.
  if (dog) {
    let dogs = 0;
    for (const owner of owners) {
      if (dogs >= 2) break;
      if (owner === "player" || random(seed, owner, "dog") > 0.35) continue;
      const yard = plan.slots.get(owner)?.yard.at(-1);
      if (!yard) continue;
      const members: FaunaMember[] = [];
      const most = random(seed, owner, "dog-pair") < 0.3 ? 2 : 1;
      for (const [dx, dy] of [
        [0, 0],
        [1, 0],
        [0, 1],
        [-1, 0],
      ]) {
        const x = yard.x + dx,
          y = yard.y + dy;
        if (
          members.length >= most ||
          plan.solid.has(cellKey(x, y)) ||
          plan.traffic.has(cellKey(x, y)) ||
          plan.fauna?.some((g) => g.members.some((m) => m.x === x && m.y === y))
        )
          continue;
        members.push({ x, y, direction: dx < 0 ? 3 : 1 });
      }
      if (!members.length) continue;
      (plan.fauna ??= []).push({
        id: `${site.id}-dog-${owner}`,
        speciesId: dog.id,
        members,
        pos: pos(members[0]),
        home: pos(yard),
        homeRadius: 6,
        state: "idle",
        nextDecisionAt: 0,
        stride: 0,
        since: 0,
        owner,
      } satisfies FaunaGroup);
      dogs++;
    }
  }
  if (pack.setting?.characterRevision) {
    for (const actor of plan.actors) {
      if (actor.kind !== "human") continue;
      const lacksWork =
        (actor.role === "Herder" && !plan.work.get(actor.id)?.gateId) ||
        (actor.role === "Farmer" &&
          !plan.plots.some((p) => p.kind === "field" && p.owner === actor.id));
      if (lacksWork)
        Object.assign(
          actor,
          generateCharacter(
            pack.setting,
            seed,
            actor.id,
            actor.age ?? 34,
            "Gatherer",
          ),
        );
    }
  }
  // A composed town builds over the old common at the centre; its public
  // plot gathers at the square instead.
  for (const plot of plan.plots)
    if (
      plot.kind === "public" &&
      plan.solid.has(cellKey(plot.access.x, plot.access.y))
    )
      plot.access = { ...socialCenter };
  // A lot can still be rejected after a venue was assigned to it — wet
  // ground, no route to the door. Rather than chase each cause, anything the
  // settlement was meant to have and has not falls back to open ground, so a
  // venue never silently disappears from a place that wanted one.
  for (const venue of wanted) {
    // Open venues are attached later, against the gathering points, which do
    // not exist yet.
    if (venue.open) continue;
    if (plan.venues!.some((v) => v.venue.id === venue.id)) continue;
    const spot = plan.gatherings?.[0] ?? plan.places[0]?.entrance;
    if (spot) plan.venues!.push({ venue, pos: spot });
  }
  plan.diagnostics.timing!.buildings = Math.round(now() - tBuildings);
  // Routes through the territory are searched after the fields are cut, so
  // a field cell a road ended up on gives way to it.
  if (plan.fields) {
    for (const k of plan.traffic) {
      plan.fields.delete(k);
      if (plan.canals?.delete(k)) plan.culverts?.add(k);
    }
    // Yard grass is a field cell; a gravestone, tree or well stood on it
    // since takes the cell.
    for (const k of plan.fields.keys())
      if (plan.solid.has(k)) plan.fields.delete(k);
  }
  // Every place gets a door, last, so nothing placed earlier lands on the cell
  // and the hole it punches in the wall survives the rest of the build.
  for (const place of plan.places) {
    place.baselineYear ??= pack.setting?.year ?? 0;
    place.condition ??= 1;
    for (const p of buildingRoofCells(place.sprite, place))
      plan.placement.clearance.add(cellKey(p.x, p.y));
    const door = makeDoor(place);
    plan.solid.delete(cellKey(door.pos.x, door.pos.y));
    plan.objects.push(door);
  }
  for (const plot of plan.plots) {
    plot.baselineYear ??= pack.setting?.year ?? 0;
    plot.state ??= "used";
  }
  for (const object of plan.objects) {
    if (object.kind === "tree") {
      claimEnvelope(
        plan.placement,
        treePlacementEnvelope(object.sprite, object.pos),
      );
      continue;
    }
    if (object.prop)
      claimEnvelope(plan.placement, {
        occupied:
          propDefs[object.prop]?.solid && !object.broken ? [object.pos] : [],
        access: [],
        clearance: propVisualCells(object.prop, object.pos),
      });
  }
  const tRoutines = now();
  planRoutines(plan, seed, pack, sample);
  plan.diagnostics.timing!.routines = Math.round(now() - tRoutines);
  plan.diagnostics.timing!.total = Math.round(now() - tPlan);
  return plan;
}
