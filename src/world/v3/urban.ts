import { civicProfile, royalGround } from "../../content/settlements/civic";
import type { StreetMaterial } from "../../content/settlements/streets";
import { regionalLook } from "../../content/graphics/regional-looks";
import { mediterraneanShrineFrame, watchtowerFrame, retainedTowerStyle } from "../../content/graphics/mediterranean-buildings";
import { venueBuilding, venuesFor } from "../../content/venues";
import type { CivicProfile } from "../../content/settlements/civic/types";
import {
  religiousProfile,
  religiousScale, neighborhoodCongregations, sanctuarySchool,
} from "../../content/settlements/religious";
import type { ReligiousProfile } from "../../content/settlements/religious/types";
import { urbanForm } from "../../content/settlements/urban-form";
import { lampFor } from "../../content/settlements/ornaments";
import { SITES, siteKindOf } from "./sites";
import type { UrbanForm } from "../../content/settlements/urban-form/types";
import { urbanBuildingLimit } from "../../content/settlements/scale";
import type { Pack, Point } from "../../core/types";
import { buildingArtCells, buildingModel, buildingModels, buildingRoofCells } from "../../content/graphics/models";
import {
  buildingScale,
  buildingScaleWeight,
} from "../../content/graphics/building-scale";
import kit from "../../content/graphics/urban.json" with { type: "json" };
import { settlementLayout } from "../../content/settlements/layout";
import { random } from "../../core/random";
import { precinctPlans } from "../../content/settlements/precincts";
import {
  industrialized,
  modernity,
  motorized,
} from "../../content/settlements/modernity";
import { zoningFor, type LandUse } from "../../content/settlements/zoning";
import { modernBuildings, modernCivicBuilding, stationBuildings } from "../../content/settlements/modern-buildings";
import { streetFrames, streetLooks } from "../../content/settlements/street-looks";
import { towerStyleFor } from "../../content/towers";
import {
  BOULEVARD,
  MOTOR_SPANS,
} from "../../content/settlements/streets/markings";
import type { Terrain } from "../../core/types";
import {
  composeUrban,
  wardCircuit,
  nearestGate,
  urbanGates,
  type Block,
  type PrecinctGround,
  type PrecinctRequest,
  type Gate,
  type Wall,
  type Furniture,
  type Rail,
  type Verge,
} from "./blocks";
import { cellKey, type Pavement, type Rect, type Road, type Site } from "./types";

/** What a block is for. Decides which house forms stand on it, what its
 * residents do and how the planner names their doors. */
export type Quarter = "market" | "craft" | "elite" | "residential" | "edge";

/** Kit forms each land use builds with, until each has art of its own. */
const FORMS: Record<LandUse, readonly string[]> = {
  historic: ["row", "shop", "wide", "tall", "cottage"],
  downtown: ["office", "midrise", "tall"],
  commercial: ["shop", "tall", "row"],
  industrial: ["wide", "row"],
  rowhouse: ["row", "tall"],
  tenement: ["tall", "midrise"],
  villa: ["wide", "tall"],
  suburb: ["cottage"],
  estate: ["midrise", "office"],
  informal: ["hut", "cottage", "stall"],
};

export type UrbanLot = {
  point: Point;
  quarter?: Quarter;
  use?: LandUse;
  nx: number;
  ny: number;
  frame: string;
  rect: Rect;
  yard: Rect;
  workPoint: Point;
  /** Ground behind the house held as its garden. `last` closes the row's
   * open end; every other side is the next garden's fence. */
  garden?: Rect & { last: boolean };
  /** One of a terrace: its side wall is its neighbour's to hide. */
  tight?: boolean;
  /** The ground between a grand house and its street. */
  forecourt?: Rect;
  civic?: CivicProfile;
  religious?: ReligiousProfile & { scale: "small" | "medium" | "large"; secondary?: boolean; label?: string; school?: NonNullable<ReligiousProfile["schools"]>[number] };
  /** Somewhere people go after work. Stage one gives it no building of its
   * own: it is an ordinary house with a public door and a different name. */
  venue?: import("../../content/venues").Venue;
  /** A building standing on a precinct's edge: public, unhoused. */
  piece?: { name: string; about: string; claim?: string; venueRoom?: import("../../core/types").Place["venueRoom"] };
  /** The paved lot a roadside business stands on. */
  site?: { kind: import("./sites").SiteKind; rect: Rect };
};

export type UrbanSurface = {
  /** Straight street with no graph search. Returns undefined on unusable ground. */
  lay(a: Point, b: Point, label: string, span: number): Road | undefined;
  dry(rect: Rect, occupied?: boolean): boolean;
  paintCourt(rect: Rect, square?: string, civic?: Rect): void;
  /** Paved apron between a sanctuary and the square. */
  paintForecourt(rect: Rect, stone?: StreetMaterial): void;
  /** A further square at a crossing: paved like the main one, with a lesser
   * centrepiece and corners from the same spec. */
  paintSquare(rect: Rect, index: number): void;
  /** Planted strip beside an arterial. */
  paintVerge(rect: Rect): void;
  /** Sidewalk just beyond a planted arterial strip. */
  paintVergeWalk(rect: Verge): void;
  /** Paved footway beside a street. */
  paintFootway(rect: Rect): void;
  /** A small public green or deliberately undeveloped lot. */
  paintPark(rect: Rect, index: number): void;
  paintIndustrial?(rect: Rect, buildings: Rect[], index: number): void;
  /** A tree on open ground inside a block. */
  plant?(at: Point, key: number): boolean;
  /** A walled yard round a church, with its trees and stones. */
  churchyard?(yard: Rect, church: Rect): void;
  /** A lamp, street tree or planter on the cell. */
  furnish(piece: Furniture): void;
  /** Base ground of the built-up area: beaten earth or paving, with grass
   * left only where something plants it. */
  paintCity(holds: (x: number, y: number) => boolean): void;
  paintBlock(rect: Rect, ground?: Terrain, role?: Pavement): void;
  /** Hold ground against any street laid later in the same pass. */
  reserveGround(rect: Rect): void;
  /** Hold a visible roof or crown without making it movement collision. */
  reserveClearance(rect: Rect): void;
  /** Stand the defensive circuit, before any street is laid through its gates. */
  buildWall(
    wall: Wall,
    parts: { x: number; y: number; frame: string }[],
    /** Drawn over the ground without standing on it: gatehouses, towers, stairs. */
    overlays: { x: number; y: number; frame: string }[],
    /** Stair cells, walkable but kept clear of streets and buildings. */
    stairs: Point[],
    /** The stretches of wall walk the watch patrols. */
    beats: Point[][],
  ): void;
  /** Lay the railway, after the streets it crosses on the level. */
  railway?(rail: Rail): void;
  /** A station platform along the line, from the track edge to the building
   * whose door is given. */
  platform?(rect: Rect, alongX: boolean, door: Point, building: Rect): void;
  /** Direction of open water, for fabrics whose public space faces it. */
  shore?: Point;
  /** Land within two cells of water, where a quay and its street can stand. */
  bank?(x: number, y: number): boolean;
  /** River water a street may bridge. */
  river?(x: number, y: number): boolean;
  /** Paved strip between a riverside street and the water. */
  paintQuay?(rect: Rect): void;
  /** Where a bridge meets this bank; an offset square gathers at it. */
  bridge?: Point;
  /** A precinct's own ground: walkable, public, one surface. */
  elevation?(x: number, y: number): number;
  courtWell(at: Point, id: string): void;
  paintGround(ground: PrecinctGround, surface: Terrain, id: string, name: string, garden?: import("./types").SettlementPlan["parterre"], ward?: Rect): void;
  wardDitch(grounds: Rect, ward: Rect, gate: Point, outward: Point, wet: boolean): void;
  /** A market pitch, trading like the square's counters. */
  stall(at: Point, index: number, trade: number): void;
  /** A marker set in a court's floor. */
  marker(at: Point, index: number): void;
  /** Where a venue's people gather when it is ground rather than a door. */
  venueAt(venue: import("../../content/venues").Venue, at: Point): void;
};

/** Urban house models this pack can build, capped at `storeys`. The kit's forms
 * run from a single-storey shop to a three-storey range; a fabric that never
 * built above one storey must not be handed the taller ones. */
export function urbanFrames(
  pack: Pack,
  storeys = Infinity,
  infill = false,
): string[] {
  const forms = Object.entries(kit.forms)
    .filter(
      ([, f]) =>
        f.stories <= storeys && !!(f as { infill?: boolean }).infill === infill,
    )
    .map(([form]) => form);
  return pack.buildings.flatMap((base) =>
    isPeriod(base)
      ? infill
        ? []
        : [base]
      : forms
          .map((form) => `${base}-urban-${form}`)
          .filter((frame) => !!buildingModels[frame]),
  );
}

/** Laid out in plots rather than rows. The setting decides; the sprites only
 * say how much ground their overhang needs kept clear. */
export function plottedTown(pack: Pack): boolean {
  if (settlementLayout(pack.setting) === "plots") return true;
  // A city whose houses have no terrace frames (the courtyard compounds of the
  // Islamic world, as yet) is built in plots rather than shrunk to a village.
  const city = pack.setting?.settlement === "city" || pack.setting?.settlement === "port";
  return city && urbanFrames(pack).length === 0;
}

/** Plotted only for want of row frames: a courtyard city packs its compounds
 * wall to wall on bare earth rather than setting each in a garden. */
export function compoundCity(pack: Pack): boolean {
  return plottedTown(pack) && settlementLayout(pack.setting) === "rows";
}

/** Period street facades are complete frames rather than base-and-form kits;
 * they carry their own storeys and a role the quarters sort by. */
/** A house of the old core, kept for the blocks inside its ring. */
function isHistoric(frame: string): boolean {
  return frame.startsWith("modern-medina-");
}

function isModernKit(frame: string): boolean {
  return !!(buildingModels[frame] as { modern?: boolean } | undefined)?.modern;
}

function isPeriod(frame: string): boolean {
  return !!(buildingModels[frame] as { period?: boolean } | undefined)?.period;
}
/** Modern kits carry the style they are drawn in: a concrete `block`, a
 * shophouse `arcade`, a `veranda` house under corrugated sheet. */
function modernStyle(frame: string): string | undefined {
  return (buildingModels[frame] as { modernStyle?: string } | undefined)
    ?.modernStyle;
}

function periodRole(frame: string): string {
  return (buildingModels[frame] as { role?: string }).role ?? "house";
}

/** Composed as a town rather than a hamlet. The road layer and the planner both
 * ask this, so neither can drift from the other's idea of where a town is. */
export function urbanSite(site: Site, pack: Pack): boolean {
  return (
    !!pack.setting &&
    site.profile.radius >= 24 &&
    (["dense", "planned", "waterfront"].includes(site.profile.pattern) ||
      pack.setting?.settlement === "city" ||
      pack.setting?.settlement === "port") &&
    (urbanFrames(pack, siteForm(site, pack).storeys).length > 0 ||
      // A plotted town can be built of the pack's own detached houses alone.
      (plottedTown(pack) && pack.buildings.some((b) => buildingModels[b])))
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
  if (!urbanSite(site, pack)) return;
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
  const motor = motorized(pack.setting!);
  const base = urbanForm(pack.setting!);
  const oldCore =
    industrialized(pack.setting!) &&
    !!zoningFor(pack.setting!).keepsCore &&
    (base.plan === "organic" || base.plan === "radial") &&
    (base.districts?.length ?? 1) > 1;
  const regional: UrbanForm = {
    ...base,
    wall: decodeURIComponent(site.id).includes("@") || royalGround(pack.setting!, site.name ?? (site.home ? pack.setting!.location : ""))?.palace ? "none" : base.wall,
    motor,
    streetWall: industrialized(pack.setting!) && !plottedTown(pack),
    ...(oldCore ? { oldCore, ring: true } : {}),
    ...(motor
      ? {
          tiers: [
            site.profile.radius >= 90 ? BOULEVARD : MOTOR_SPANS[0],
            MOTOR_SPANS[1],
            // No car goes down an old core's lanes.
            oldCore ? 2 : MOTOR_SPANS[2],
          ] as const,
          diagonals: site.profile.radius >= 90 && !oldCore ? 1 : 0,
        }
      : {}),
  };
  // A plotted town is cut into blocks that hold two rows of house and garden,
  // with no paved courts inside them.
  const form =
    regional.plots && plottedTown(pack)
      ? { ...regional, block: regional.plots.block, courts: 0 }
      : regional;
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
  const fabric = siteForm(site, pack);
  // A site that is mostly water or someone else's ground is a strip or a
  // point of land. It is built tight: plain streets for avenues, one square,
  // no railway across it.
  const landShare = (() => {
    const r = site.profile.radius;
    let dry = 0, all = 0;
    for (let y = -r; y <= r; y += 6)
      for (let x = -r; x <= r; x += 6, all++)
        if (api.dry({ x: site.center.x + x, y: site.center.y + y, w: 1, h: 1 }, false)) dry++;
    return dry / all;
  })();
  const form: typeof fabric = landShare > 0.45 ? fabric : {
    ...fabric,
    tiers: [Math.min(3, fabric.tiers[0]), fabric.tiers[1], fabric.tiers[2]],
    verge: 0,
    squares: 0,
    diagonals: 0,
    plazaScale: fabric.plazaScale * 0.6,
    greenSpaces: (fabric.greenSpaces ?? 0) / 3,
    lattice: fabric.plan === "orthogonal" && !!fabric.streetWall,
  };
  const plotted = plottedTown(pack);
  const compound = compoundCity(pack);
  // A plotted town also builds the plain cottages its villages do.
  const cottages = plotted
    ? pack.buildings.filter((b) => buildingModels[b])
    : [];
  const everyFrame = [...urbanFrames(pack, form.storeys), ...cottages];
  if (!everyFrame.length) return [];
  const historicFrames = everyFrame.filter(
    (f) => isHistoric(f) && FORMS.historic.some((w) => f.endsWith(`-urban-${w}`)),
  );
  const frames = everyFrame.filter((f) => !isHistoric(f));
  const small = urbanFrames(pack, form.storeys, true).filter((f) => !isHistoric(f));
  // A fabric's storey cap describes the town it laid out; offices and estates
  // rebuilt on it later are not bound by it.
  const towers = urbanFrames(pack).filter((f) => !isHistoric(f));
  const modern = (pack.setting?.year ?? 0) >= 1900;
  const year = pack.setting?.year ?? 0;
  const zoning =
    pack.setting && industrialized(pack.setting)
      ? zoningFor(pack.setting)
      : undefined;
  /** Depth of garden a plotted row holds behind it: room for the roof to
   * overhang and a bed or a tree to show past it. */
  const GARDEN = form.plots?.garden ?? 4;
  type CandidateRecipe = {
    base: string;
    model: ReturnType<typeof buildingModel>;
    kind: string;
    group: string;
  };
  // Candidate buildings are deliberately kept out of the normal urban kit:
  // they are a second-pass infill vocabulary, not substitutes for the city's
  // larger apartment, office and shop forms.
  // The candidate infill kit is mid-century American — DINER, DONUTS, RX, a
  // gas station. It belongs on a street in the United States and reads as a
  // costume anywhere else, so every other modern city infills with its own
  // cottages, huts and lock-up shops instead.
  const americanStrip =
    modern &&
    pack.setting?.culture === "european" &&
    modernity(pack.setting!).id === "north-america";
  const candidateBases: CandidateRecipe[] = americanStrip
    ? Object.entries(buildingModels)
        .filter(([frame, model]) => {
          const meta = model as { candidate?: boolean; from?: number };
          // A motel needs a car and a highway, a laundromat needs a coin
          // machine. Without this the same kit builds 1905 and 1955.
          return (
            meta.candidate === true &&
            !/(?:-north|-east|-west)$/.test(frame) &&
            (pack.setting?.year ?? 0) >= (meta.from ?? 0)
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
  // In a town laid out for cars those businesses stand only on lots of their own.
  const infillBases = form.motor && !form.oldCore ? candidateBases.filter((c) => !siteKindOf(c.kind)) : candidateBases;
  const rand = (...keys: (string | number)[]) =>
    random(seed, site.id, "urban", ...keys);
  // A waterfront square faces the water; a bridgehead market gathers where
  // the bridge lands. Other squares keep their fabric's own placement.
  const toward = (p: Point | undefined) =>
    p && { x: p.x - site.center.x, y: p.y - site.center.y };
  // Precincts are planned with the streets: each needs ground a block cannot
  // hold, so the layout cuts it out as it cuts out a square.
  const carries = urbanBuildingLimit(
    site.profile.radius,
    form,
    site.profile.buildings,
    pack.setting?.year ?? 0,
  );
  const precincts = precinctPlans(
    pack.setting!,
    venuesFor(pack.setting, carries),
    site.profile.radius,
  );
  const sanctuary = religiousProfile(pack.setting!);
  const school = sanctuary && sanctuarySchool(sanctuary, pack.year, seed, `${site.id}-religious`);
  const congregations = (sanctuary ? neighborhoodCongregations(pack.setting!, sanctuary, school?.id, site.profile.radius, seed, site.id) : [])
    .flatMap(({profile, school, label}) => {
      const look = regionalLook(`religious-${profile.recipe}`, pack.setting) ?? Math.floor(rand("congregation-look", profile.id) * 3);
      const frame = [profile.recipe, `religious-${profile.recipe}-small-${look}`, `religious-${profile.recipe}-small-0`].find(f => buildingModels[f]);
      if (!frame) return [];
      const model = buildingModel(frame), [w, h] = model.footprint;
      const entries = (["south","north","east","west"] as const).filter(side => {
        const facing = buildingModels[side === "south" ? frame : `${frame}-${side}`];
        return facing?.footprint[0] === w && facing.footprint[1] === h;
      });
      return [{profile, school, label, frame, model, entries}];
    });
  const order = ["large", "medium", "small"] as const;
  const sanctuaryFrame = (s: (typeof order)[number]) =>
    (sanctuary?.recipe === "mediterranean-shrine" && mediterraneanShrineFrame(pack.setting, s)) || `religious-${sanctuary!.recipe}-${s}-0`;
  const sanctuaryScales = sanctuary && (congregations.length || /-mosque$|^(chinese|japanese)-temple$|^mediterranean-shrine$/.test(sanctuary.recipe))
    ? (sanctuary.drawnAt ? [sanctuary.drawnAt] : order.slice(order.indexOf(religiousScale(site.profile.radius)))).filter(s => buildingModels[sanctuaryFrame(s)])
    : [];
  // Where the culture walled its sanctuaries, the ground keeps room for the
  // precinct wall at the sides and back.
  const verge = ["east-asian", "south-asian", "southeast-asian", "north-african-west-asian"].includes(pack.setting?.culture ?? "") ? 3 : 0;
  const sanctuarySize = (s: (typeof order)[number]) => {
    const [w, h] = buildingModel(sanctuaryFrame(s)).footprint;
    return [w + 2 * verge, h + 3 + verge] as [number, number];
  };
  // Two rows back to back, and behind the front one room for its drawn roof or both yards.
  const median = (v: number[]) => v.sort((a, b) => a - b)[v.length >> 1];
  const rows = !frames.length ? 0 : Math.min(32, 2 * median(frames.map((f) => buildingModel(f).footprint[1])) +
    Math.max(median(frames.map((f) => marginsOf(f)[1])), 2 * (form.backs ?? 0)));
  /** Cells from a frame's drawn top to the foot of its wall. */
  // A tower stands on its footprint and rises over the rows behind it; counting
  // its drawn height left every tower block as open ground.
  // In a city with a business district rows stand close: a tall front rises
  // over the street behind it, as it does in any street of tall buildings.
  const drawn = (f: string) => {
    const [, deep] = buildingModel(f).footprint, tall = Math.ceil(buildingModel(f).anchor[1] / 16);
    return towerStyleFor(f) ? deep : Math.max(deep, closeRows ? Math.min(tall, deep + 8) : tall);
  };
  // A row's block is as deep as its houses stand drawn: what the centre, the
  // inner rings and the later ones are likely to build, before any block exists.
  /** Which ring of a street-wall city a block lies in, from its distance out
   * alone, so its depth can be chosen before its use is. */
  // A quarter of a great city standing apart from its middle: a suburb with
  // a few shops of its own, never a second downtown.
  // Site ids are URL-encoded, so a quarter's "@" arrives as "%40".
  const outlying = decodeURIComponent(site.id).includes("@") || !!pack.setting?.suburbOf;
  /** How far out the centre and the older housing reach, as shares of the
   * way to the edge. The whole city is on the map, suburbs and all, so the
   * centre is drawn larger than life to keep a dense core; the housing built
   * before cars takes what its years are of the city's industrial age. */
  const rings = zoning && (() => {
    const { industrial, motor } = zoning.modernity;
    const centre = outlying ? 0.2 : site.profile.radius < 50 ? 0.18 : landShare <= 0.45 ? 0.42 : 0.3;
    const before = year > motor ? Math.max(0.3, Math.min(0.6, (motor - industrial) / (year - industrial))) : 0.8;
    return { centre, inner: outlying ? centre : centre + (1 - centre) * before };
  })();
  // A city short of land has no ring of houses on lawns: it is built up to its shore.
  const ringOf = (reach: number) => (reach < rings!.centre ? "centre" : reach < rings!.inner || landShare <= 0.45 ? "inner" : "outer");
  /** Whether the middle of this city has been rebuilt as a business district. */
  const downtown = !!zoning && !outlying && site.profile.radius >= 50 &&
    year >= zoning.modernity.industrial + zoning.downtownAfter &&
    (pack.setting?.population ?? Infinity) >= (zoning.downtownFrom ?? 0);
  const closeRows = downtown || (outlying && !!zoning && year >= zoning.modernity.industrial + zoning.downtownAfter);
  const rowDepth = zoning && form.streetWall ? (() => {
    const likely = (use: LandUse) => {
      const street = streetLooks(pack.setting!, use).blocks.flatMap(({ look }) => streetFrames(look as Parameters<typeof streetFrames>[0]));
      const rebuilt = street.length ? street : modernBuildings(pack.setting!, use).filter((f) => buildingModels[f] && !/-(north|east|west)$/.test(f));
      const depths = (rebuilt.length ? rebuilt : frames).map(drawn).sort((a, b) => a - b);
      // Behind a row of houses, their yards; a row of shops is built to its back wall.
      const yard = use === "commercial" || use === "downtown" ? 0 : (form.backs ?? 3);
      return { main: (depths[Math.floor(depths.length * 0.75)] ?? 10) + yard, low: Math.max(7, depths[Math.floor(depths.length * 0.2)] ?? 8) };
    };
    const depth = { centre: likely(downtown ? "downtown" : "commercial"), inner: likely(zoning.inner), outer: likely(zoning.outer) };
    return (near: number, far: number, low = false) =>
      Math.max(...[near, (near + far) / 2, far].map((reach) => depth[ringOf(reach)][low ? "low" : "main"]));
  })() : undefined;
  const civic = civicProfile(pack.setting!);
  const civicBase = modernCivicBuilding(pack.setting!, site.profile.radius >= 100) ?? pack.buildings
    .map((base) => `${base}-urban-${civic.form}`)
    .find((frame) => buildingModels[frame]);
  const ranges = civicBase ? [civicBase] : civic.interior || civic.forecourt ? ["large","medium"].flatMap(size =>
    pack.buildings.filter(f => buildingScale(f) === size && buildingModels[f]).slice(0,1)) : [];
  const central = !decodeURIComponent(site.id).includes("@");
  const seat = central && royalGround(pack.setting!, site.name ?? (site.home ? pack.setting!.location : ""),
    site.profile.radius >= 58 ? rand("castle-seat") : 1);
  const hall = central && civic.forecourt && ranges[0] ? (() => {
    const { footprint, entrance } = buildingModel(ranges[0]);
    return { footprint, entrance };
  })() : undefined;
  const requests: PrecinctRequest[] = [];
  const seatIndex = requests.length;
  if (seat) requests.push({ position: seat.position, near: seat.castle ? api.shore : undefined, divertLane: true,
    entries: seat.position === "garden" ? ["east"] : ["south", "west", "east"],
    sizes: seat.palace === "royal" ? [[46, 30], [42, 28], [38, 26], [34, 24]] : seat.palace ? [[32, 22], [28, 20], [28, 18]] :
      [[36, 27], [29, 22], [23, 26], [25, 19], [23, 17], [18, 21], [21, 16], [18, 18], [16, 20], [18, 15], [17, 14], [15, 12]] });
  const hallIndex = requests.length;
  if (hall) requests.push({ position: "square", entries: ["south"],
    sizes: [7, 3].map(m => [hall.footprint[0] + m * 2, hall.footprint[1] + m + 2]) });
  const venueIndex = requests.length;
  for (const p of precincts) requests.push({ ...p.siting, sizes: p.options.map(o => o.size) });
  const sanctuaryIndex = requests.length;
  if (sanctuaryScales.length) requests.push({ position: "square", entries: ["south"], sizes: sanctuaryScales.map(sanctuarySize) });
  const congregationIndex = requests.length;
  for (const {entries, model} of congregations) {
    const [w, h] = model.footprint;
    requests.push({position:"outer", entries, sizes:[[w + 2, h + 2]]});
  }
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
    density(),
    site.aspect,
    pack.year,
    requests,
    site.rail ?? (!!zoning && site.profile.radius >= 40 && landShare > 0.45),
    lampFor(pack).street,
    api.river,
    rows,
    rowDepth,
    // The station's hall and the forecourt its cabs turn in.
    rowDepth ? stationBuildings(pack.setting!, site.profile.radius, rand("station"))
      .filter((f) => buildingModels[f]).slice(0, 1).map((f) => buildingModel(f).footprint)[0] as [number, number] | undefined : undefined,
    api.elevation,
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
  // The line runs straight through, so no footprint may stand on its bed or
  // the cell either side; it is reserved before anything is placed.
  const railBed = new Set<string>();
  if (layout.rail) {
    const r = layout.rail;
    const bed =
      r.axis === "x"
        ? { x: r.lo, y: r.level - 1, w: r.hi - r.lo + 1, h: r.span + 2 }
        : { x: r.level - 1, y: r.lo, w: r.span + 2, h: r.hi - r.lo + 1 };
    reserve(bed);
    for (let y = bed.y; y < bed.y + bed.h; y++)
      for (let x = bed.x; x < bed.x + bed.w; x++) railBed.add(cellKey(x, y));
  }
  // Where an oblique house's side wall and roof overhang its footprint, no
  // other house may stand, and it may not stand in another's.
  const bodies = new Set<string>(),
    shade = new Set<string>();
  const overhang = (lot: UrbanLot): Rect[] => {
    const [right, drawnBehind] = marginsOf(lot.frame);
    // Where rows stand close a tall front keeps a street's width behind it:
    // nothing is built against its back, but the row across the next street
    // stands under its roofline, as in any city.
    const behind = closeRows ? Math.min(drawnBehind, 6) : drawnBehind;
    const r = lot.rect;
    // A terrace keeps only the ground its roofs cover; a detached house also
    // keeps a little air on every side.
    // In rows the neighbour hides the side wall; only the roof needs room.
    if (lot.tight || !plotted || compound)
      return behind ? [{ x: r.x, y: r.y - behind, w: r.w, h: behind }] : [];
    return [
      {
        x: r.x - 1,
        y: r.y - behind - 1,
        w: r.w + right + 2,
        h: r.h + behind + 2,
      },
    ];
  };
  // Any town whose houses overhang their footprints keeps those roofs clear.
  const roofed =
    plotted || americanStrip ||
    frames.some((f) => marginsOf(f)[1] > 0);
  let noted = 0;
  const note = (lot: UrbanLot) => {
    for (const k of cells(lot.rect)) bodies.add(k);
    for (const r of overhang(lot)) {
      for (const k of cells(r)) shade.add(k);
      api.reserveClearance(r);
    }
  };
  const cells = (r: Rect) => {
    const out: string[] = [];
    for (let y = r.y; y < r.y + r.h; y++)
      for (let x = r.x; x < r.x + r.w; x++) out.push(cellKey(x, y));
    return out;
  };
  /** Stand a landmark: the hall, the sanctuary or a venue. One way in for all
   * three, so each claims its ground, its keep-out and its apron alike. */
  const claimLandmark = (
    lot: UrbanLot,
    ground: { forecourt?: Rect; apron?: Rect } = {},
    into = lots,
  ) => {
    into.push(lot);
    note(lot);
    noted = lots.length;
    reserve(lot.rect);
    reserve({ ...lot.point, w: 1, h: 1 });
    api.reserveGround(lot.rect);
    if (ground.forecourt) {
      reserve(ground.forecourt);
      api.reserveGround(ground.forecourt);
      api.paintForecourt(ground.forecourt);
    }
    if (ground.apron) api.paintForecourt(ground.apron);
    // A church in a plotted town stands in its own walled yard.
    if (lot.religious && !lot.religious.secondary && /Christian|Catholic/.test(lot.religious.faith) && plotted && api.churchyard) {
      const r = lot.rect;
      // As much of a generous yard as the ground allows.
      const yard = [6, 4, 3]
        .map((m) => ({
          x: r.x - m,
          y: r.y - 2,
          w: r.w + 2 * m + 1,
          h: r.h + 3,
        }))
        .find((y) => api.dry(y, false));
      if (yard) {
        reserve(yard);
        api.churchyard(yard, r);
      }
    }
  };
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
  function standCircuit(wall: Wall, cornerTower?: "a" | "b" | "c") {
    const { material, ring, openings, bends } = wall;
    const stretches = (accept: (p: Point) => boolean) => {
      const runs: Point[][] = [];
      const start = Math.max(0, ring.findIndex(p => !accept(p)));
      let run: Point[] = [];
      for (let i = 0; i < ring.length; i++) {
        const p = ring[(start + i) % ring.length];
        if (accept(p)) run.push(p);
        else if (run.length) { runs.push(run); run = []; }
      }
      if (run.length) runs.push(run);
      return runs;
    };
    const standing = stretches(p => !openings.has(cellKey(p.x, p.y)) && api.dry({ ...p, w: 1, h: 1 }, false))
      .filter(run => run.length >= 4).flat();
    const built = new Set(standing.map((p) => cellKey(p.x, p.y)));
    // The circuit is a rasterised polygon, so it jogs constantly and no single
    // "run" frame can describe a cell. Each cell names the neighbours it
    // actually has, and the sprite carries the parapet on every open side.
    const N4 = [[0, -1], [1, 0], [0, 1], [-1, 0]] as const;
    const maskOf = new Map<string, number>();
    for (const p of standing) {
      let mask = 0;
      for (const [i, [dx, dy]] of N4.entries())
        if (built.has(cellKey(p.x + dx, p.y + dy))) mask |= 1 << i;
      maskOf.set(cellKey(p.x, p.y), mask);
    }
    const corner = (k: string) => [3, 6, 9, 12].includes(maskOf.get(k) ?? 0);
    const cornerNeighbours = (p: Point) =>
      N4.map(([dx, dy]) => ({ x: p.x + dx, y: p.y + dy })).filter((q) => corner(cellKey(q.x, q.y)));
    const winding = Math.sign(ring.reduce((area, p, i) => {
      const q = ring[(i + 1) % ring.length];
      return area + p.x * q.y - q.x * p.y;
    }, 0));
    const outside = new Map(ring.map((p, i) => {
      const prev = ring[(i + ring.length - 1) % ring.length], next = ring[(i + 1) % ring.length];
      const nx = (next.y - prev.y) * winding, ny = (prev.x - next.x) * winding;
      return [cellKey(p.x, p.y), (nx < 0 ? 8 : nx > 0 ? 2 : 0) | (ny < 0 ? 1 : ny > 0 ? 4 : 0)];
    }));
    const parts = standing.map((p) => {
      const k = cellKey(p.x, p.y), mask = maskOf.get(k)!;
      // A corner beside another corner is a step: on a diagonal, at its end,
      // or in a one-cell jog. Its tile carries the wall across at 45 degrees
      // edge to edge, which meets a straight run's tile flush.
      const step = corner(k) && cornerNeighbours(p).length > 0;
      // Both halves of a diagonal share a column of the same painted curtain.
      let v = (step ? p.x : p.x + p.y) & 3;
      if (material === "masonry" && mask === 10 && Math.abs(p.x + p.y * 3) % 19 > 3 && v === 0) v = 1;
      const out = outside.get(k)!;
      if (material !== "palisade" && (step || mask === 10 ? !!(out & 4) :
          mask === 5 ? !!(out & 2) : corner(k) && !!(out & mask))) v += 4;
      return { x: p.x, y: p.y, frame: `wall-${material}-${mask}${step ? "d" : ""}-${v}` };
    });
    const hidden = new Set<string>();
    const towers: { x: number; y: number; frame: string }[] = [];
    // Palisades have open entries between bastions. Other circuits can span a straight gap.
    const nearGate = new Set<string>();
    // Gate cells the wall walk crosses on the gatehouse's span.
    const spans = new Set<string>();
    const clearance = wall.precinct ? 1 : 3;
    for (const gate of wall.gates) {
      const gap = gate.opening;
      for (const p of gap)
        for (let dy = -clearance; dy <= clearance; dy++)
          for (let dx = -clearance; dx <= clearance; dx++) nearGate.add(cellKey(p.x + dx, p.y + dy));
      const [first, last] = gate.jambs;
      const n = gap.length, side = gate.outward.x !== 0;
      const flanks = gate.jambs.map(p => cellKey(p.x, p.y));
      if (material !== "palisade" && n >= 3 && n <= 11 &&
          last.x - first.x + last.y - first.y === n + 1 && flanks.every(k => built.has(k))) {
        gate.covered = true;
        for (const k of flanks) hidden.add(k);
        for (const p of gap) spans.add(cellKey(p.x, p.y));
        if (side) {
          towers.push({ ...first, frame: `gate-${material}-pier-back` }, { ...last, frame: `gate-${material}-pier-front` });
          for (const [i, p] of gap.entries())
            towers.push({ ...p, frame: `gate-${material}-side-${n}-${i}` });
        } else towers.push({ x: (first.x + last.x) / 2, y: first.y, frame: `gate-${material}-${n}` });
        continue;
      }
      const ends = new Set(gap.map((p) => cellKey(p.x, p.y)));
      for (const p of standing)
        if (N4.some(([dx, dy]) => ends.has(cellKey(p.x + dx, p.y + dy)))) {
          hidden.add(cellKey(p.x, p.y));
          towers.push({ x: p.x, y: p.y, frame: `tower-${material}-a` });
        }
    }
    const placed = standing.filter(p => hidden.has(cellKey(p.x, p.y)));
    const spaced = (p: Point, gap: number) =>
      placed.every((o) => Math.max(Math.abs(o.x - p.x), Math.abs(o.y - p.y)) >= gap);
    const raise = (p: Point, variant: string) => {
      placed.push(p);
      hidden.add(cellKey(p.x, p.y));
      towers.push({ x: p.x, y: p.y, frame: `tower-${material}-${variant}` });
    };
    const free = (p: Point) => built.has(cellKey(p.x, p.y)) && !hidden.has(cellKey(p.x, p.y)) && !nearGate.has(cellKey(p.x, p.y));
    const alternate = (p: Point) => ((p.x * 7 + p.y * 13) & 4 ? "b" : "a");
    for (const p of standing)
      if ([1, 2, 4, 8].includes(maskOf.get(cellKey(p.x, p.y))!) && free(p) && spaced(p, 6))
        raise(p, alternate(p));
    for (const [i, p] of bends.entries()) {
      const a = bends[(i + bends.length - 1) % bends.length], b = bends[(i + 1) % bends.length];
      const ux = p.x - a.x, uy = p.y - a.y, vx = b.x - p.x, vy = b.y - p.y;
      if (ux * vx + uy * vy < .82 * Math.hypot(ux, uy) * Math.hypot(vx, vy) && free(p) && spaced(p, wall.precinct ? 4 : 8))
        raise(p, cornerTower ?? "c");
    }
    const pitch = material === "palisade" ? 15 : 21;
    for (const run of stretches(free)) {
      const bays = Math.round((run.length + 1) / pitch);
      for (let i = 1; i < bays; i++) {
        const p = run[Math.round(i * (run.length + 1) / bays) - 1];
        if (spaced(p, 8)) raise(p, alternate(p));
      }
    }
    // Flights of stairs up the inside face, three cells long, nearest the
    // gates first, where people go up. Against an east-west run the flight
    // lies along the face; against a north-south one it climbs north beside
    // it. Only where the face behind is a plain run, clear of towers.
    const stairs: { x: number; y: number; frame: string }[] = [];
    const stairCells: Point[] = [];
    const flights: Point[] = [];
    const clear = (q: Point) => {
      const k = cellKey(q.x, q.y);
      if (wall.precinct && (q.x <= wall.rect.x || q.x >= wall.rect.x + wall.rect.w - 1 ||
          q.y <= wall.rect.y || q.y >= wall.rect.y + wall.rect.h - 1)) return false;
      return !built.has(k) && !used.has(k) && !nearGate.has(k) && layout.holds(q.x, q.y, 1) &&
        api.dry({ ...q, w: 1, h: 1 }, false);
    };
    const run = (q: Point, mask: number) =>
      maskOf.get(cellKey(q.x, q.y)) === mask && !hidden.has(cellKey(q.x, q.y));
    const gateCells = wall.gates.flatMap(g => g.opening);
    const toGate = (p: Point) =>
      Math.min(Infinity, ...gateCells.map((g) => Math.abs(g.x - p.x) + Math.abs(g.y - p.y)));
    for (const p of [...standing].sort((a, b) => toGate(a) - toGate(b))) {
      if (flights.length >= Math.max(2, Math.round(standing.length / 80))) break;
      if (flights.some((o) => Math.max(Math.abs(o.x - p.x), Math.abs(o.y - p.y)) < 16)) continue;
      const mask = maskOf.get(cellKey(p.x, p.y));
      let flight: { cells: Point[]; art: string; onto: string } | undefined;
      if (mask === 10) {
        for (const dir of [1, -1]) {
          const cells = [2, 1, 0].map((i) => ({ x: p.x - dir * i, y: p.y + 1 }));
          if (cells.every((q) => clear(q) && run({ x: q.x, y: p.y }, 10))) {
            flight = { cells, art: dir > 0 ? "east" : "west", onto: "n" };
            break;
          }
        }
      } else if (mask === 5) {
        for (const side of [1, -1]) {
          const cells = [2, 1, 0].map((i) => ({ x: p.x + side, y: p.y + i }));
          if (cells.every((q) => clear(q) && run({ x: p.x, y: q.y }, 5))) {
            flight = { cells, art: "north", onto: side > 0 ? "w" : "e" };
            break;
          }
        }
      }
      if (!flight) continue;
      flights.push(p);
      for (const [i, q] of flight.cells.entries()) {
        stairCells.push(q);
        used.add(cellKey(q.x, q.y));
        stairs.push({ ...q, frame: `stair-${material}-${flight.art}-${i + 1}${i === 2 ? flight.onto : ""}` });
      }
    }
    // The watch walks beats along the wall walk: unbroken stretches of it,
    // over the gatehouses and through the towers, out and back.
    const walkable = (q: Point) => built.has(cellKey(q.x, q.y)) || spans.has(cellKey(q.x, q.y));
    const beats: Point[][] = [];
    const watch = Math.min(4, Math.max(1, Math.round(standing.length / 70)));
    for (const s of stretches(walkable).filter((s) => s.length >= 14).sort((a, b) => b.length - a.length))
      for (let i = 0; i + 14 <= s.length && beats.length < watch; i += 70)
        beats.push(s.slice(i, i + 32));
    if (parts.length) {
      const gates = wall.gates.filter(g => g.jambs.every(p => built.has(cellKey(p.x, p.y))));
      api.buildWall(
        { ...wall, gates },
        parts.map((p) => hidden.has(cellKey(p.x, p.y)) ? { ...p, frame: "wall-none" } : p),
        // Southern towers last, so one standing in front of another covers it.
        [...towers.sort((a, b) => a.y - b.y), ...stairs],
        stairCells,
        beats,
      );
      if (!wall.precinct) for (const g of gates) {
        const a = g.opening[0], b = g.opening[g.opening.length - 1];
        const dx = Math.abs(g.outward.x) * 2, dy = Math.abs(g.outward.y) * 2;
        const threshold = { x: a.x - dx, y: a.y - dy, w: b.x - a.x + 2 * dx + 1, h: b.y - a.y + 2 * dy + 1 };
        reserve(threshold);
        const middle = g.opening[(g.opening.length - 1) >> 1];
        api.lay({ x: middle.x - dx, y: middle.y - dy }, { x: middle.x + dx, y: middle.y + dy }, "gateway-" + middle.x + "-" + middle.y, layout.tiers[0]);
      }
      // The ring is rasterised, so it does not sit exactly on the continuous
      // boundary. Holding its actual cells is what keeps a threshold or a work
      // pocket off the wall, where a margin against the boundary would not.
      for (const part of parts) used.add(cellKey(part.x, part.y));
    }
  }

  if (layout.wall) standCircuit(layout.wall);

  // Streets first, widest first, so a junction takes the wider surface.
  const old = (s: { a: Point; b: Point; tier: number }) => {
    const r = layout.oldCore;
    return !!r && s.tier > 0 &&
      [s.a, s.b].every((p) => p.x >= r.x - 1 && p.x <= r.x + r.w && p.y >= r.y - 1 && p.y <= r.y + r.h);
  };
  // Past the business blocks a main street is two lanes between grass
  // strips; it is wide, with parking, only where the shops are. The change
  // comes at a cross street, as it does on the ground.
  const NARROW = 5;
  const narrowFrom = (s: (typeof layout.streets)[number]) => {
    if (!form.motor || form.oldCore || s.tier || layout.tiers[0] <= NARROW) return undefined;
    const x = s.a.y === s.b.y, c = site.center;
    const along = (p: Point) => (x ? p.x : p.y), home = along(c);
    const inner = Math.abs(along(s.a) - home) <= Math.abs(along(s.b) - home) ? s.a : s.b, outer = inner === s.a ? s.b : s.a;
    const dir = Math.sign(along(outer) - along(inner));
    if (!dir) return undefined;
    const lo = Math.min(along(s.a), along(s.b)), hi = Math.max(along(s.a), along(s.b)), level = x ? s.a.y : s.a.x;
    const cross = layout.streets
      .filter((o) => o.tier && (o.a.y === o.b.y) !== x)
      .filter((o) => {
        const v = x ? o.a.x : o.a.y, a = x ? o.a.y : o.a.x, b = x ? o.b.y : o.b.x;
        return v > lo + 4 && v < hi - 8 && Math.min(a, b) <= level && Math.max(a, b) >= level &&
          (v - home) * dir >= layout.half * 0.3;
      })
      .map((o) => (x ? o.a.x : o.a.y))
      .sort((a, b) => (a - b) * dir)[0];
    if (cross === undefined) return undefined;
    const at = cross - dir * 2;
    return { inner, outer, at: x ? { x: at, y: level } : { x: level, y: at }, x, dir, level };
  };
  for (const [i, s] of [...layout.streets]
    .sort((a, b) => a.tier - b.tier)
    .entries()) {
    const id = `${old(s) ? "old" : "street"}-${s.tier}-${i}`, n = narrowFrom(s);
    if (!n) {
      api.lay(s.a, s.b, id, layout.tiers[s.tier]);
      continue;
    }
    api.lay(n.inner, n.at, id, layout.tiers[0]);
    api.lay(n.at, n.outer, `${id}-out`, NARROW);
  }
  for (const s of layout.streets) {
    const n = narrowFrom(s);
    if (!n) continue;
    // Where the parking lanes were, grass between the kerb and the walk.
    const span = layout.tiers[0], lo = Math.floor((span - 1) / 2), hi = span - 1 - lo;
    const from = Math.min(n.x ? n.at.x : n.at.y, n.x ? n.outer.x : n.outer.y) + (n.dir > 0 ? 3 : 0),
      to = Math.max(n.x ? n.at.x : n.at.y, n.x ? n.outer.x : n.outer.y) - (n.dir < 0 ? 3 : 0);
    for (const [off, w] of [[-lo, lo - 2], [3, hi - 2]])
      if (w > 0)
        api.paintBlock(
          n.x ? { x: from, y: n.level + off, w: to - from + 1, h: w } : { x: n.level + off, y: from, w, h: to - from + 1 },
          "grass", "verge");
  }
  for (const [i, s] of layout.diagonals.entries())
    api.lay(s.a, s.b, `avenue-${i}`, layout.tiers[s.tier]);
  for (const r of layout.verges) {
    api.paintVerge(r);
    api.paintVergeWalk(r);
  }
  // An industrial-age street has a sidewalk its whole length, built frontage
  // or not.
  if (modern || zoning)
    for (const s of layout.streets) {
      if (s.tier === 0 && form.verge) continue;
      if (old(s)) continue;
      if (form.footways === "main" && s.tier > 0) continue;
      const span = layout.tiers[s.tier],
        // A side street in a town of cars has one narrow walk each side.
        walk = s.tier < 2 && !(form.motor && !form.oldCore && s.tier) ? 2 : 1,
        lo = Math.floor((span - 1) / 2),
        hi = span - 1 - lo;
      const horizontal = s.a.y === s.b.y;
      const from = Math.min(
          horizontal ? s.a.x : s.a.y,
          horizontal ? s.b.x : s.b.y,
        ),
        to = Math.max(horizontal ? s.a.x : s.a.y, horizontal ? s.b.x : s.b.y),
        level = horizontal ? s.a.y : s.a.x;
      for (const [off, w] of [
        [level - lo - walk, walk],
        [level + hi + 1, walk],
      ]) {
        const rect = horizontal
          ? { x: from, y: off, w: to - from + 1, h: w }
          : { x: off, y: from, w, h: to - from + 1 };
        // No sidewalk is laid along open country: the last street has one
        // on its town side only.
        if (form.motor && !form.oldCore) {
          let inside = 0, all = 0;
          for (let v = from; v <= to; v += 2) {
            all++;
            const far = off < level ? off - 4 : off + w + 3;
            if (layout.holds(horizontal ? v : far, horizontal ? far : v, 1)) inside++;
          }
          if (inside < all * 0.3) continue;
        }
        api.paintFootway(rect);
      }
    }

  const lots: UrbanLot[] = [];
  const estate = seat && layout.grounds[seatIndex];
  if (estate && seat) {
    if (seat.palace) {
      const royal = seat.palace === "royal", cy = estate.entry.y;
      const deep = rand("palace-court-depth"), wide = rand("palace-court-width");
      const garden = { x: estate.x + 1, y: estate.y + 1, h: estate.h - 2, royal, seed: Math.floor(rand("parterre") * 997),
        w: Math.floor(estate.w * (royal ? .38 : .32)) - (deep < .45 ? 0 : 1) };
      api.paintGround(estate, "paving", seat.id, seat.name, garden);
      const wingForm = royal ? "wing" : "pavilion";
      const wingFrame = `hall-palace-${wingForm}-${(royal ? estate.w >= 40 : wide > .5) ? "medium" : "small"}-0`;
      const wing = buildingModel(wingFrame);
      const mainFrame = `hall-palace-residence-${royal ? "medium" : "small"}-0`, main = buildingModel(mainFrame);
      const mx = garden.x + garden.w + 1, my = cy - (main.footprint[1] >> 1);
      const wx = royal ? mx + main.footprint[0] : estate.x + estate.w - wing.footprint[0] - 4;
      const wy = royal ? my - 2 : cy - 5 - Math.floor(wide * 2);
      const stand = (frame: string, x: number, y: number, part: "residence" | "north-wing" | "south-wing", name: string) => {
        const model = buildingModel(frame), [w, h] = model.footprint;
        const rect = { x, y, w, h }, point = { x: x + model.entrance[0], y: y + model.entrance[1] };
        claimLandmark({ rect, yard: rect, frame, point, nx: 0, ny: -1, workPoint: point,
          piece: { name, about: model.description, claim: `civic-palace-${part}`,
            venueRoom: seat.rooms && { venue: seat.id, room: seat.rooms[part] } } });
        api.paintForecourt({ x: point.x - 1, y: point.y, w: 3, h: 1 }, "slab");
      };
      stand(mainFrame, mx, my, "residence", main.label);
      stand(wingFrame, wx, wy, "north-wing", royal ? "North gallery" : "Steward’s pavilion");
      stand(wingFrame, wx, 2 * cy - wy - wing.footprint[1] + 1, "south-wing", royal ? "South gallery" : "Carriage pavilion");
      const courtX = mx + main.footprint[0], limit = estate.x + estate.w;
      api.paintForecourt({ x: courtX, y: wy + wing.footprint[1], w: limit - courtX - 2, h: 2 * (cy - wy - wing.footprint[1]) + 1 }, royal ? "cobble" : "slab");
      if (royal) {
        const depth = Math.min(6, wx + wing.footprint[0] - courtX);
        for (let y = cy - 3; y <= cy + 3; y++) for (let x = courtX; x < courtX + depth; x++)
          api.paintForecourt({ x, y, w: 1, h: 1 }, (x - courtX + y - cy) % 2 ? "slab" : "basalt");
      }
      api.paintForecourt(estate.approach, "cobble");
    } else if (seat.castle) {
      const skin = seat.castle, court = skin.approach === "forecourt";
      const wall = wardCircuit(estate, skin.material, seat.id, rand("ward-return") < .65, skin.approach === "moat");
      const ward = wall.rect, gate = wall.gates[0], entry = gate.opening[gate.opening.length >> 1];
      api.paintGround({ ...estate, entry }, court ? "paving" : "dirt", seat.id, seat.name, undefined, ward);
      if (!court) api.wardDitch(estate, ward, entry, gate.outward, skin.approach === "moat");
      const size = ward.w < 18 ? "small" : "medium";
      const look = size === "medium" && rand("hall-look") < .5 ? 1 : 0;
      const frame = `hall-${skin.hall}-${size}-${look}`, model = buildingModel(frame);
      const [w, h] = model.footprint;
      const x = ward.x + 2 + Math.floor(rand("hall-bay") * (ward.w - w - 3));
      const y = ward.y + (skin.hall === "hall-keep" && ward.h >= 17 ? 4 : ward.h <= 13 ? 1 : 2);
      const rect = { x, y, w, h }, point = { x: x + model.entrance[0], y: y + model.entrance[1] };
      claimLandmark({ rect, yard: rect, frame, point, nx: 0, ny: -1, workPoint: point,
        piece: { name: model.label, about: model.description, claim: "civic-castle-hall" } });
      reserve({ x: point.x - 1, y: point.y, w: 3, h: 2 });
      standCircuit(wall, skin.tower);
      const paving = skin.paving;
      const lane = (a: Point, b: Point, wide = 3) => {
        const across = wide >> 1;
        api.paintForecourt({ x: Math.min(a.x, b.x) - across, y: Math.min(a.y, b.y) - across,
          w: Math.abs(b.x - a.x) + wide, h: Math.abs(b.y - a.y) + wide }, paving);
      };
      const turn = { x: point.x, y: gate.outward.y ? Math.min(entry.y - 3, point.y + 2) : Math.max(point.y + 1, entry.y) };
      const inner = { x: entry.x - gate.outward.x, y: entry.y - gate.outward.y * 2 };
      api.paintForecourt(estate.approach, paving);
      lane(estate.entry, inner);
      lane(inner, { x: inner.x, y: turn.y });
      lane({ x: inner.x, y: turn.y }, turn);
      lane(turn, point);
      api.paintForecourt({ x: x + 1, y: point.y, w: w - 2, h: 2 }, court ? "basalt" : "slab");
      if (court) {
        const top = point.y + 2, bottom = ward.y + ward.h - 5;
        if (bottom >= top + 3) {
          for (const x of [ward.x + 2, ward.x + ward.w - 3])
            api.paintForecourt({ x, y: top, w: 1, h: bottom - top + 1 }, "basalt");
          for (const y of [top, bottom])
            api.paintForecourt({ x: ward.x + 2, y, w: ward.w - 4, h: 1 }, "basalt");
          api.paintForecourt({ x: point.x - 1, y: top, w: 3, h: 1 }, paving);
        }
        api.paintForecourt({ x: point.x - 1, y: point.y, w: 3, h: 2 }, paving);
        const apron = gate.outward.x ? { x: Math.min(entry.x, estate.entry.x), y: entry.y - 3,
          w: Math.abs(estate.entry.x - entry.x) + 1, h: 7 } : { x: entry.x - 3, y: entry.y, w: 7, h: estate.entry.y - entry.y + 1 };
        api.paintForecourt(apron, paving);
      }
      if (skin.service && ward.w >= 20) {
        const shed = buildingModel(skin.service), [sw, sh] = shed.footprint;
        const sx = [ward.x + 2, ward.x + ward.w - sw - 2].find(sx => sx + sw + 1 <= x || sx >= x + w + 1);
        if (sx !== undefined) {
          const sr = { x: sx, y: ward.y + 4, w: sw, h: sh };
          const sp = { x: sx + shed.entrance[0], y: sr.y + shed.entrance[1] };
          if (free({ ...sr, h: sh + 1 })) {
            claimLandmark({ rect: sr, yard: sr, frame: skin.service, point: sp, nx: 0, ny: -1, workPoint: sp,
              piece: { name: shed.label, about: shed.description, claim: "yard-byre" } });
            const junction = { x: sp.x, y: Math.max(sp.y + 1, turn.y) };
            lane(sp, junction, 1);
            lane(junction, { x: point.x, y: junction.y }, 1);
            if (junction.y > turn.y) lane({ x: point.x, y: junction.y }, turn, 1);
          }
        }
      }
      const wellY = ward.y + ward.h - 5;
      const wellX = [ward.x + 3, ward.x + ward.w - 4]
        .sort((a, b) => Math.abs(b - entry.x) - Math.abs(a - entry.x))
        .find(wx => Math.abs(wx - point.x) > 2 && Math.abs(wx - entry.x) + Math.abs(wellY - entry.y) > 4 &&
          free({ x: wx - 1, y: wellY - 1, w: 3, h: 3 }));
      if (wellX !== undefined) {
        api.paintForecourt({ x: wellX - 1, y: wellY - 1, w: 3, h: 3 }, court ? "basalt" : paving);
        lane({ x: wellX, y: wellY + 1 }, { x: point.x, y: wellY + 1 }, 1);
        lane({ x: point.x, y: wellY + 1 }, turn, 1);
        api.courtWell({ x: wellX, y: wellY }, seat.id);
      }
    }
  }
  for (const ground of layout.grounds) {
    if (!ground) continue;
    for (const r of [ground, ground.approach]) { reserve(r); api.reserveGround(r); }
    api.paintForecourt(ground.approach);
  }
  if (api.bank) riverside();

  const watchtowers: UrbanLot[] = [];
  const precinctVenues = new Set<string>();
  for (const [n, precinct] of precincts.entries()) {
    const ground = layout.grounds[venueIndex + n];
    if (!ground) continue;
    const option = precinct.options.find(
      (o) => o.size[0] === ground.w && o.size[1] === ground.h,
    )!;
    precinctVenues.add(precinct.venue.id);
    api.paintGround(ground, precinct.surface, precinct.venue.id, precinct.label);
    const at = ([x, y]: readonly [number, number]) => ({
      x: ground.x + x,
      y: ground.y + y,
    });
    for (const piece of option.pieces) {
      if (!buildingModels[piece.frame]) continue;
      const model = buildingModel(piece.frame);
      const rect = { ...at(piece.at), w: model.footprint[0], h: model.footprint[1] };
      const point = {
        x: rect.x + model.entrance[0],
        y: rect.y + model.entrance[1],
      };
      claimLandmark({
        point,
        nx: 0,
        ny: 1,
        frame: piece.frame,
        rect,
        yard: rect,
        workPoint: point,
        piece: { name: piece.name, about: precinct.venue.note ?? precinct.label },
      });
    }
    option.stalls.forEach(([x, y, row], i) =>
      api.stall(at([x, y]), i, row + n * 3),
    );
    option.markers.forEach((p, i) => api.marker(at(p), i));
    api.venueAt(precinct.venue, {
      x: ground.x + (ground.w >> 1),
      y: ground.y + (ground.h >> 1),
    });
  }
  const plaza = { ...layout.plaza };
  // Landmarks stand back from the square's frame of streets, where there is one.
  const front = layout.plazaFront ?? plaza;
  let civicRect: Rect | undefined;
  // The civic range takes the plaza's head before the square is painted, so the
  // square keeps its full depth in front of the building rather than behind it.
  if (ranges.length) {
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
    const candidates = ranges.flatMap(base => sides.flatMap(([nx, ny]) => {
      const facing =
        nx > 0 ? "west" : nx < 0 ? "east" : ny > 0 ? "north" : "south";
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
                ? front.x - w - 1
                : front.x + front.w + 1
              : Math.floor(front.x + (front.w - w) / 2) + shift,
            y: ny
              ? ny < 0
                ? front.y - h - 1
                : front.y + front.h + 1
              : Math.floor(front.y + (front.h - h) / 2) + shift,
            w,
            h,
          },
        };
      });
    }));
    const door = (c: { rect: Rect; model: { entrance: number[] } }) => ({
      x: c.rect.x + c.model.entrance[0],
      y: c.rect.y + c.model.entrance[1],
    });
    const court = hall && layout.grounds[hallIndex];
    const chosen = court && hall ? { nx: 0, ny: -1, frame: ranges[0], model: hall,
      rect: { x: court.x + ((court.w - hall.footprint[0]) >> 1), y: court.y + 1, w: hall.footprint[0], h: hall.footprint[1] } } :
      candidates.find(c => fits(c.rect) && free({ ...door(c), w: 1, h: 1 }));
    if (court) api.paintGround(court, "paving", civic.id, civic.label);
    if (chosen) {
      const point = door(chosen);
      claimLandmark({
        point,
        nx: chosen.nx,
        ny: chosen.ny,
        frame: chosen.frame,
        rect: chosen.rect,
        yard: chosen.rect,
        workPoint: point,
        civic,
      }, { apron: chosen.ny < 0
        ? { x: chosen.rect.x, y: chosen.rect.y + chosen.rect.h, w: chosen.rect.w, h: 1 }
        : undefined });
      civicRect = chosen.rect;
    }
  }
  // The sanctuary takes a second side of the square, set back behind a
  // paved forecourt, so the door opens onto the square rather than into it.
  const religious = sanctuary;
  if (religious) {
    const look =
      regionalLook(`religious-${religious.recipe}`, pack.setting) ??
      Math.floor(rand("religious-look") * 3);
    // A mosque that found no ground of its own tries its own size first, then
    // smaller, and set back from the square; a church keeps the one it had.
    const wide = sanctuaryScales.length > 0;
    const scales = wide ? sanctuaryScales : [religious.drawnAt ?? religiousScale(site.profile.radius)];
    const civicSide: [number, number] | undefined =
      civicRect &&
      (civicRect.y + civicRect.h <= front.y
        ? [0, -1]
        : civicRect.y >= front.y + front.h
          ? [0, 1]
          : civicRect.x >= front.x + front.w
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
    // Set back from the square if its edge is taken, the forecourt run out to meet it.
    const candidates = scales.flatMap((scale) => (wide ? [0, 3, 6] : [0]).flatMap((back) => sides.flatMap(([nx, ny]) => {
      const gap = religious.forecourt + 1 + back;
      // A size the region's look was not drawn at keeps the first look.
      const shrine = (scale === "small" || religious.recipe === "mediterranean-shrine") && mediterraneanShrineFrame(pack.setting, scale);
      const base = shrine && buildingModels[shrine] ? shrine : buildingModels[`religious-${religious.recipe}-${scale}-${look}`]
        ? `religious-${religious.recipe}-${scale}-${look}`
        : `religious-${religious.recipe}-${scale}-0`;
      const facing =
        nx > 0 ? "west" : nx < 0 ? "east" : ny > 0 ? "north" : "south";
      const frame = facing === "south" ? base : `${base}-${facing}`;
      if (!buildingModels[frame]) return [];
      const model = buildingModel(frame),
        [w, h] = model.footprint;
      return (wide ? [0, 1, -1, 2, -2, 3, -3] : [0, 1, -1, 2, -2]).map((step) => {
        const shift = step * (form.tiers[0] + 3);
        const rect = {
          x: nx
            ? nx < 0
              ? front.x - w - gap
              : front.x + front.w + gap
            : Math.floor(front.x + (front.w - w) / 2) + shift,
          y: ny
            ? ny < 0
              ? front.y - h - gap
              : front.y + front.h + gap
            : Math.floor(front.y + (front.h - h) / 2) + shift,
          w,
          h,
        };
        // The forecourt spans the building's width between it and the square.
        const forecourt = nx
          ? {
              x: nx < 0 ? rect.x + w : front.x + front.w,
              y: rect.y,
              w: gap,
              h,
            }
          : {
              x: rect.x,
              y: ny < 0 ? rect.y + h : front.y + front.h,
              w,
              h: gap,
            };
        return { nx, ny, frame, model, rect, forecourt, scale };
      });
    })));
    const ground = sanctuaryScales.length ? layout.grounds[sanctuaryIndex] : undefined;
    const groundScale = ground && sanctuaryScales.find((s) => sanctuarySize(s)[0] === ground.w && sanctuarySize(s)[1] === ground.h);
    const onGround = ground && groundScale && (() => {
      const variant = `religious-${religious.recipe}-${groundScale}-${look}`;
      const frame = religious.recipe !== "mediterranean-shrine" && buildingModels[variant] ? variant : sanctuaryFrame(groundScale);
      const model = buildingModel(frame),
        [w, h] = model.footprint;
      return { nx: 0, ny: -1, frame, model, rect: { x: ground.x + verge, y: ground.y + verge, w, h }, forecourt: { x: ground.x + verge, y: ground.y + verge + h, w, h: ground.h - h - verge }, scale: groundScale };
    })();
    const chosen = onGround || candidates.find(
      (c) =>
        fits(c.rect) && free({ ...c.forecourt }) && api.dry(c.forecourt, false),
    );
    if (chosen) {
      if (chosen === onGround) reserve(ground!);
      const point = {
        x: chosen.rect.x + chosen.model.entrance[0],
        y: chosen.rect.y + chosen.model.entrance[1],
      };
      claimLandmark(
        {
          point,
          nx: chosen.nx,
          ny: chosen.ny,
          frame: chosen.frame,
          rect: chosen.rect,
          yard: chosen.rect,
          workPoint: point,
          religious: { ...religious, school, scale: chosen.scale },
        },
        { forecourt: chosen.forecourt },
      );
    }
  }
  for (const [i, {profile, school, label, frame, model}] of congregations.entries()) {
    const ground = layout.grounds[congregationIndex + i];
    if (!ground) continue;
    const [w, h] = model.footprint, rect = {x:ground.x + 1, y:ground.y + 1, w, h};
    const nx = Math.sign(ground.entry.x - ground.street.x), ny = Math.sign(ground.entry.y - ground.street.y);
    const facing = nx > 0 ? "west" : nx < 0 ? "east" : ny > 0 ? "north" : "south";
    const sprite = facing === "south" ? frame : `${frame}-${facing}`;
    const [dx,dy] = buildingModel(sprite).entrance, door = {x:rect.x + dx, y:rect.y + dy};
    const x = door.x - site.center.x, y = door.y - site.center.y;
    const side = Math.abs(x) > Math.abs(y) ? (x < 0 ? "West" : "East") : (y < 0 ? "North" : "South");
    claimLandmark({point:door, workPoint:door, nx, ny, frame:sprite, rect, yard:rect,
      religious:{...profile, scale:"small", secondary:true, label:label && `${side} ${label.toLowerCase()}`, school}}, {apron:ground});
  }
  if (pack.setting && site.profile.radius >= 30) {
    const retained = !!retainedTowerStyle(pack.setting);
    for (const [i, gate] of layout.gates.slice(0, layout.wall && !retained ? 2 : 1).entries()) {
      const storeys = retained ? 3 : i === 1 ? 1 : site.profile.radius < 60 ? 2 : 3;
      const frame = watchtowerFrame(pack.setting, storeys);
      if (!frame || !buildingModels[frame]) continue;
      const model = buildingModel(frame), [w, h] = model.footprint;
      const byGate = [-1, 1].flatMap((side) => [4, 8, 12, 16, 20].map((gap) => {
        const tx = -gate.ny, ty = gate.nx;
        const distance = Math.ceil(Math.max(w, h) / 2) + layout.tiers[0] + 2;
        const x = Math.round(gate.point.x + tx * side * distance - gate.nx * (w / 2 + gap) - w / 2);
        const y = Math.round(gate.point.y + ty * side * distance - gate.ny * (h / 2 + gap) - h / 2);
        return { x, y, w, h };
      }));
      const core = layout.oldCore ?? layout.plaza;
      const at = retained ? { x: core.x + core.w / 2, y: core.y + core.h / 2 } : gate.point;
      const inBlocks = [...layout.blocks].sort((a, b) =>
        Math.hypot(a.x - at.x, a.y - at.y) - Math.hypot(b.x - at.x, b.y - at.y))
        .filter((b) => b.w >= w && b.h >= h)
        .flatMap((b) => [b.x, b.x + b.w - w].flatMap((x) =>
          [b.y, b.y + b.h - h].map((y) => ({ x, y, w, h }))));
      const candidates = layout.wall && !retained ? [...byGate, ...inBlocks] : inBlocks;
      const rect = candidates.find((r) => within(r) && fits(r) &&
        api.dry({ x: r.x - 1, y: r.y - 1, w: w + 2, h: h + 2 }, false) &&
        free({ x: r.x - 1, y: r.y + h, w: w + 2, h: 2 }));
      if (!rect) continue;
      const point = { x: rect.x + model.entrance[0], y: rect.y + model.entrance[1] };
      const apron = { x: rect.x - 1, y: rect.y + h, w: w + 2, h: 2 };
      if (!free(apron) || !api.dry(apron, false)) continue;
      claimLandmark({ point, nx: 0, ny: -1, frame, rect, yard: { ...rect }, workPoint: point,
        piece: { name: retained ? "Historic tower" : storeys === 1 ? "Gate storehouse" : "Watchtower", about: retained
          ? "An older tower retained as the city grew around it." : storeys === 1
          ? "The town's gate watch keeps its supplies here." : "The town's gate watch keeps its lookout here." } }, { apron }, watchtowers);
      const street = layout.streets.flatMap((s) => [s.a, s.b]).sort((a, b) =>
        Math.hypot(a.x - point.x, a.y - point.y) - Math.hypot(b.x - point.x, b.y - point.y))[0];
      api.lay(point, street ?? gate.point, `tower-${i}`, 1);
    }
  }
  // Venues with a building of their own are placed like the sanctuary, but a
  // block back: an opera house wants the streets round the square, not a side
  // of it. Anything that does not fit falls back to a house with a mark at
  // its door, which is what plan.ts gives the rest.
  // The flat profile count is what a village would hold; a composed city
  // carries what its own extent and fabric allow, which is the number a
  // theatre's size gate is written against.
  for (const venue of venuesFor(pack.setting, carries)) {
    if (!venueBuilding(venue, pack.setting!) || precinctVenues.has(venue.id)) continue;
    // Scale is the outer loop: a landmark on the far side of the square beats
    // a shrunken one on the near side.
    const placed = (["large", "medium", "small"] as const)
      .flatMap(
        (scale) =>
          (
            [
              [0, -1],
              [0, 1],
              [1, 0],
              [-1, 0],
            ] as [number, number][]
          ).flatMap(([nx, ny]) => {
            const facing =
              nx > 0 ? "west" : nx < 0 ? "east" : ny > 0 ? "north" : "south";
            const family = venueBuilding(venue, pack.setting!);
            const look = (family && regionalLook(family, pack.setting)) ?? 0;
            const base = buildingModels[`${family}-${scale}-${look}`]
              ? `${family}-${scale}-${look}`
              : `${family}-${scale}-0`;
            const frame = facing === "south" ? base : `${base}-${facing}`;
            if (!buildingModels[frame]) return [];
            const model = buildingModel(frame);
            const [w, h] = model.footprint;
            // A block back from the square, and shifted along it so several
            // venues do not stack on the same approach.
            // In a boulevard city the blocks facing the square are its street
            // fronts, so a venue stands behind them, a whole block back.
            const set = zoning && !form.motor ? form.block[1] + form.tiers[0] + 4 : layout.plazaFront ? 1 : form.tiers[0] + 4;
            return [0, 1, -1, 2, -2].map((step) => {
              const shift = step * (w + 3);
              const rect = {
                x: nx
                  ? nx < 0
                    ? front.x - w - set
                    : front.x + front.w + set
                  : Math.floor(front.x + (front.w - w) / 2) + shift,
                y: ny
                  ? ny < 0
                    ? front.y - h - set
                    : front.y + front.h + set
                  : Math.floor(front.y + (front.h - h) / 2) + shift,
                w,
                h,
              };
              // The ground the door opens onto has to be usable too, or the
              // building lands correctly and nobody can reach it.
              const apron =
                nx || ny
                  ? {
                      x: rect.x + (nx > 0 ? -2 : nx < 0 ? w : 0),
                      y: rect.y + (ny > 0 ? -2 : ny < 0 ? h : 0),
                      w: nx ? 2 : w,
                      h: ny ? 2 : h,
                    }
                  : { x: rect.x, y: rect.y + h, w, h: 2 };
              return { frame, model, nx, ny, rect, apron };
            });
          }),
        // Only that the apron is usable ground: requiring it unreserved as well
        // rejects every lot, because the strip toward the square is already the
        // square's.
        // Inside the settlement as well as on dry ground: a wall-less town has
        // nothing else stopping a landmark being placed off the edge of the map.
      )
      .find((c) => within(c.rect) && fits(c.rect) && api.dry(c.apron, false));
    if (!placed) continue;
    const point = {
      x: placed.rect.x + placed.model.entrance[0],
      y: placed.rect.y + placed.model.entrance[1],
    };
    // The strip in front of the door is paved, as the sanctuary's forecourt
    // is: without it the building is placed correctly and nothing ever routes
    // to its entrance. It is not reserved — the door stands in it, and a
    // reserved apron makes the lot itself unusable.
    claimLandmark(
      {
        point,
        nx: placed.nx,
        ny: placed.ny,
        frame: placed.frame,
        rect: placed.rect,
        yard: placed.rect,
        workPoint: point,
        venue,
      },
      { apron: placed.apron },
    );
  }
  api.paintCourt(layout.plazaCourt ?? plaza, civic.square, civicRect);
  for (const [i, r] of layout.squares.entries()) api.paintSquare(r, i);
  if (layout.rail) api.railway?.(layout.rail);
  const station = layout.rail && raiseStation(layout.rail);

  // Blocks are filled, not rationed. Each block gets the rows its edges can
  // carry and, in a modern city, infill up to the coverage its place implies;
  // the building count is what falls out. The only cap is a safety limit on
  // how long a plan may take to route, spent from the centre outward.
  const quarters = new Map<Block, Quarter>();
  const uses = new Map<Block, LandUse>();
  const yardRanges = new Map<Block, boolean>();
  const atelierFrames = Object.keys(buildingModels).filter((f) => /^modern-atelier-\d+$/.test(f));
  const blockKits = new Map<Block, string[]>();
  const lowKits = new Map<Block, string[]>();
  const rowLanes = new Map<Block, (() => void)[]>();
  const industry = zoning && industrySector();
  /** The blocks the works take, the region's share of the city: along the
   * railway and out from the centre, nearest the edge first; with no line,
   * the sector toward the water. */
  const worksBlocks = new Set<Block>();
  if (zoning && industry) {
    const rail = layout.rail;
    const gap = (b: Block) => !rail ? 0 : rail.axis === "x"
      ? Math.max(0, b.y - (rail.level + rail.span), rail.level - (b.y + b.h))
      : Math.max(0, b.x - (rail.level + rail.span), rail.level - (b.x + b.w));
    const off = (b: Block) => Math.abs(((Math.atan2(b.y + b.h / 2 - site.center.y, b.x + b.w / 2 - site.center.x) -
      industry.bearing + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
    const able = layout.blocks.filter((b) => b !== station && !b.open && !b.low && (!b.row || (b.w >= 20 && b.h >= 14)) &&
      b.reach > rings!.centre + 0.08 && !(form.oldCore && b.district === 0));
    const order = rail
      ? [...able.filter((b) => gap(b) <= 12).sort((a, b) => b.reach - a.reach), ...able.filter((b) => gap(b) > 12 && gap(b) <= 45).sort((a, b) => gap(a) - gap(b))]
      : able.filter((b) => off(b) < industry.spread).sort((a, b) => b.reach - a.reach);
    for (const b of order.slice(0, Math.max(1, Math.round(able.length * zoning.industry)))) worksBlocks.add(b);
  }
  for (const block of layout.blocks) {
    const use = zoning && landUseOf(block);
    if (use) uses.set(block, use);
    quarters.set(block, use ? quarterFor(use, block) : quarterOf(block));
  }
  // A block's place in the town's mix of street looks, ranked from a smooth
  // field: each look gets its exact share, and its blocks lie together.
  const lookRank = new Map<Block, number>();
  if (zoning) {
    const lattice = (i: number, j: number) => rand("look-field", i, j);
    const field = (b: Block) => {
      const x = (b.x + b.w / 2) / 40, y = (b.y + b.h / 2) / 40;
      const i = Math.floor(x), j = Math.floor(y);
      const u = (x - i) ** 2 * (3 - 2 * (x - i)), v = (y - j) ** 2 * (3 - 2 * (y - j));
      const top = lattice(i, j) * (1 - u) + lattice(i + 1, j) * u;
      return top * (1 - v) + (lattice(i, j + 1) * (1 - u) + lattice(i + 1, j + 1) * u) * v;
    };
    const order = layout.blocks.map((b) => ({ b, f: field(b) })).sort((p, q) => p.f - q.f);
    order.forEach(({ b }, i) => lookRank.set(b, (i + 0.5) / order.length));
  }
  const looksFor = new Map<LandUse, ReturnType<typeof streetLooks>>();
  /** The frames of the street look this block is built in, one colouring of
   * it and perhaps a one-off among them; undefined keeps the older kit. */
  function streetLookFrames(block: Block) {
    const use = uses.get(block);
    if (!use || !pack.setting) return undefined;
    let looks = looksFor.get(use);
    if (!looks) looksFor.set(use, (looks = streetLooks(pack.setting, use)));
    let u = lookRank.get(block) ?? 1;
    const fabric = looks.blocks.find(({ share }) => (u -= share) < 0)?.look;
    if (!fabric) return undefined;
    // Houses in gardens: a block is one kind of house in all its colours.
    if (use === "villa" || use === "suburb") return streetFrames(fabric as Parameters<typeof streetFrames>[0]);
    const colouring = (look: string, key: string) => {
      const frames = streetFrames(look as Parameters<typeof streetFrames>[0]);
      const n = new Set(frames.map((f) => f.split("-urban-")[0])).size;
      const v = Math.floor(rand(key, block.x, block.y) * n);
      return frames.filter((f) => f.startsWith(`mod-${look}-${v}-urban-`));
    };
    const pool = colouring(fabric, "look-colour");
    const odds = looks.accents.reduce((t, a) => t + a.share, 0);
    let pick = rand("accent", block.x, block.y);
    if (pick < Math.min(0.7, odds * 3)) {
      pick *= odds / Math.min(0.7, odds * 3);
      const accent = looks.accents.find(({ share }) => (pick -= share) < 0)?.look;
      if (accent) pool.push(...colouring(accent, "accent-colour"));
    }
    return pool;
  }
  const useAt = new Map<string, LandUse>();
  for (const [block, use] of uses)
    for (const k of cells(block)) useAt.set(k, use);
  const ranks = layout.blocks
    .filter((b) => b !== station)
    .sort((a, b) => a.reach - b.reach || a.x - b.x || a.y - b.y)
    .map((block) => ({
      block,
      built: 0,
      coverage: 0,
      target: coverageTarget(block),
    }));
  const capacity = urbanBuildingLimit(
    site.profile.radius,
    form,
    site.profile.buildings,
    pack.setting?.year ?? 0,
  );
  // What trade each placed building carries, so the next one can avoid it.
  const trades: { x: number; y: number; trade: string }[] = [];
  const tradeOf = (frame: string) =>
    (buildingModels[frame] as { business?: string } | undefined)?.business ??
    "";
  /** Two diners side by side is the tell that a street was generated. A trade
   * has to clear the frontage it is already on — a town can have two grocers,
   * but not next door to each other. */
  const repeats = (frame: string, rect: { x: number; y: number }) => {
    const trade = tradeOf(frame);
    if (!trade || trade.startsWith("residential")) return false;
    // A city has a few of each trade, not one on every block.
    if (trades.filter((t) => t.trade === trade).length >= 3 + Math.floor(lots.length / 80)) return true;
    return trades.some(
      (t) =>
        t.trade === trade &&
        Math.abs(t.x - rect.x) + Math.abs(t.y - rect.y) < 14,
    );
  };
  const place = (rank: (typeof ranks)[number], lot: UrbanLot) => {
    const door = { ...lot.point, w: 1, h: 1 },
      work = { ...lot.workPoint, w: 1, h: 1 };
    if (!fits(lot.rect)) return false;
    // Nor may a roof or side wall draw over the rails.
    if (overhang(lot).some((r) => cells(r).some((k) => railBed.has(k)))) return false;
    if (roofed || lot.frame.startsWith("mod-")) {
      // The hall, the church and the venues were placed by other hands.
      for (; noted < lots.length; noted++) note(lots[noted]);
      if (cells(lot.rect).some((k) => shade.has(k))) return false;
      const own = new Set(cells(lot.rect));
      if (
        overhang(lot).some((r) =>
          cells(r).some((k) => bodies.has(k) && !own.has(k)),
        )
      )
        return false;
    }
    if (repeats(lot.frame, lot.rect)) return false;
    // A neighbour on the same front line hides a side wall; one set further
    // back is drawn under it.
    const sideOver = (a: UrbanLot, b: UrbanLot) => {
      const [right, behind] = marginsOf(a.frame);
      const x = a.rect.x + a.rect.w;
      return right > 0 && a.rect.y + a.rect.h > b.rect.y + b.rect.h &&
        b.rect.x < x + right && x < b.rect.x + b.rect.w &&
        b.rect.y < a.rect.y + a.rect.h && a.rect.y - behind < b.rect.y + b.rect.h;
    };
    if (roofed && lots.some((o) => sideOver(lot, o) || sideOver(o, lot))) return false;
    // A tall range hides whatever stands in the eight rows behind it.
    if (tallKit(lot.frame) && lots.some((o) => tallKit(o.frame) &&
      o.rect.x < lot.rect.x + lot.rect.w && lot.rect.x < o.rect.x + o.rect.w &&
      o.rect.y !== lot.rect.y &&
      (Math.abs(o.rect.y + o.rect.h - lot.rect.y) < 9 || Math.abs(lot.rect.y + lot.rect.h - o.rect.y) < 9)))
      return false;
    if (!free(door) || !free(work) || !api.dry(door, false)) return false;
    // A threshold or work pocket outside the wall has no route back in.
    if (!within(lot.point) || !within(lot.rect) || !within(lot.workPoint))
      return false;
    lot.use ??= uses.get(rank.block);
    lots.push(lot);
    const trade = tradeOf(lot.frame);
    if (trade) trades.push({ x: lot.rect.x, y: lot.rect.y, trade });
    rank.built++;
    rank.coverage += lot.rect.w * lot.rect.h;
    reserve(lot.rect);
    reserve(door);
    reserve(work);
    if (lot.garden && fits(lot.garden)) reserve(lot.garden);
    else lot.garden = undefined;
    return true;
  };
  if (pack.setting?.employmentRevision && zoning) {
    const frames = modernBuildings(pack.setting, "industrial").filter(f => buildingModels[f]);
    const fitsWorks = (block: Block) => frames.some(f => {
      const [w, h] = buildingModel(f).footprint;
      return block.w >= w + 6 && block.h >= h + 6;
    });
    const industrial = ranks.filter(r => uses.get(r.block) === "industrial");
    if (industrial.length && !industrial.some(r => fitsWorks(r.block))) {
      const target = industrial[0].block;
      const alternative = ranks.filter(r => r.block.reach > 0.25 && fitsWorks(r.block) &&
        ["commercial", "rowhouse", "tenement"].includes(uses.get(r.block) ?? ""))
        .sort((a, b) => Math.hypot(a.block.x - target.x, a.block.y - target.y) -
          Math.hypot(b.block.x - target.x, b.block.y - target.y))[0]?.block;
      if (alternative) {
        uses.set(alternative, "industrial");
        quarters.set(alternative, "craft");
        for (const k of cells(alternative)) useAt.set(k, "industrial");
      }
    }
  }
  // Greens are chosen before anything is built, so a park is a decision and
  // not a leftover: the fabric's share of blocks, away from the square.
  // A zoned city of any size has a park or two whatever its fabric's share.
  const parkTarget = Math.max(Math.round(layout.blocks.length * (form.greenSpaces ?? 0)),
    zoning && !outlying ? (site.profile.radius >= 100 ? 3 : site.profile.radius >= 50 ? 1 : 0) : 0);
  const parkRanks = new Set(
    ranks
      // Not a block a landmark already stands on, nor one the works have.
      .filter((rank) => rank.block.reach > 0.3 && !rank.block.low && uses.get(rank.block) !== "industrial" && !lots.some(({ rect: r }) =>
        r.x < rank.block.x + rank.block.w && rank.block.x < r.x + r.w &&
        r.y < rank.block.y + rank.block.h && rank.block.y < r.y + r.h))
      .sort(
        (a, b) =>
          rand("park", a.block.x, a.block.y) -
          rand("park", b.block.x, b.block.y),
      )
      .slice(0, parkTarget),
  );
  for (const rank of parkRanks) reserve(rank.block);
  // The best houses overlook a park, away from the works' smoke.
  if (zoning)
    for (const { block: park } of parkRanks)
      for (const b of layout.blocks) {
        const use = uses.get(b);
        if (b === park || b.low || (use !== zoning.inner && use !== zoning.outer)) continue;
        const apart = Math.max(b.x - (park.x + park.w), park.x - (b.x + b.w), b.y - (park.y + park.h), park.y - (b.y + b.h));
        if (apart > 10 || [...worksBlocks].some((w) => Math.hypot(w.x + w.w / 2 - b.x - b.w / 2, w.y + w.h / 2 - b.y - b.h / 2) < 60)) continue;
        uses.set(b, "villa");
        quarters.set(b, "elite");
        blockKits.delete(b);
        for (const k of cells(b)) useAt.set(k, "villa");
      }
  let seededIndustry: (typeof ranks)[number] | undefined;
  if (pack.setting?.employmentRevision && zoning) {
    for (const rank of ranks) {
      if (parkRanks.has(rank) || uses.get(rank.block) !== "industrial") continue;
      blockLots(rank.block);
      if (rank.built) { seededIndustry = rank; reserve(rank.block); break; }
    }
  }
  // Once there are cars a house stands back from the sidewalk behind a lawn;
  // shops and offices still build to it.
  const lawned = form.motor && !form.oldCore
    ? layout.blocks.filter((b) => !["downtown", "commercial", "industrial", "historic"].includes(uses.get(b) ?? "") && b.w >= 12 && b.h >= 12)
    : [];
  const inset = (by: number) => {
    for (const b of lawned) { b.x += by; b.y += by; b.w -= by * 2; b.h -= by * 2; }
  };
  roadsideSites();
  inset(2);
  for (const rank of ranks) {
    if (rank === seededIndustry || parkRanks.has(rank) || lots.length >= capacity) continue;
    blockLots(rank.block);
    if (uses.get(rank.block) === "industrial" && rank.built) reserve(rank.block);
  }
  if ((candidateBases.length || zoning) && !plotted)
    for (const rank of ranks) {
      if (parkRanks.has(rank) || rank.block.row || lots.length >= capacity) continue;
      infill(rank);
    }
  // The lawn is kept clear: bins and wash lines belong behind the house.
  for (const b of lawned)
    for (const r of [
      { x: b.x, y: b.y, w: b.w + 4, h: 2 }, { x: b.x, y: b.y + b.h + 2, w: b.w + 4, h: 2 },
      { x: b.x, y: b.y, w: 2, h: b.h + 4 }, { x: b.x + b.w + 2, y: b.y, w: 2, h: b.h + 4 },
    ])
      // Not where a business has its apron down to the sidewalk.
      for (const k of cells({ x: r.x - 2, y: r.y - 2, w: r.w, h: r.h })) {
        if (used.has(k)) continue;
        const [x, y] = k.split(",").map(Number);
        api.reserveGround({ x, y, w: 1, h: 1 });
      }
  inset(-2);
  infillOpen();

  for (const rank of ranks)
    if (rank.built >= 2)
      for (const lay of rowLanes.get(rank.block) ?? []) lay();
  // Every block gets its ground, built or not: bare earth between streets is
  // what read as a hole in the city.
  for (const rank of ranks)
    if (!parkRanks.has(rank)) {
      const use = uses.get(rank.block);
      const role = !rank.built ? "vacant"
        : (plotted && !compound) || use === "suburb" || use === "estate" ? "garden"
        : rank.block.court ? "court" : "yard";
      api.paintBlock(
        {
          x: rank.block.x - 1,
          y: rank.block.y - 1,
          w: rank.block.w + 2,
          h: rank.block.h + 2,
        },
        use === "industrial" ? "dirt"
          // Behind a row is its own yard, never the street's stone.
          : rank.block.row || rank.block.open ? (pack.setting?.climate !== "arid" ? "grass" : "dirt")
          // Once there are cars, a house row stands in its own ground; only
          // the business blocks are paved from wall to wall.
          : use && (form.motor ? ["downtown", "commercial"] : ["downtown", "commercial", "tenement", "rowhouse"]).includes(use) ? "paving"
          : form.backs && rank.built && pack.setting?.climate !== "arid" ? "grass" : undefined,
        role,
      );
    }
  for (const [i, rank] of [...parkRanks].entries()) {
    const b = rank.block;
    api.paintPark({ x: b.x + 1, y: b.y + 1, w: b.w - 2, h: b.h - 2 }, i);
  }
  for (const [i, rank] of ranks.entries())
    if (uses.get(rank.block) === "industrial" && rank.built)
      // Whatever else stands on the block is in the yard too: a fence drawn
      // without it would run through its walls.
      api.paintIndustrial?.(rank.block, lots.filter((l) =>
        l.rect.x + l.rect.w > rank.block.x && l.rect.x < rank.block.x + rank.block.w &&
        l.rect.y + l.rect.h > rank.block.y && l.rect.y < rank.block.y + rank.block.h).map((l) => l.rect), i);
  // Open ground in a plotted town grows trees: singly and in twos and
  // threes, never in a house's overhang or its garden.
  if ((plotted || uses.size) && api.plant)
    for (const { block } of ranks) {
      const use = uses.get(block);
      if (!plotted && use !== "suburb" && use !== "estate") continue;
      const want = Math.round(
        (block.w * block.h) / (use === "estate" ? 40 : 22),
      );
      for (; noted < lots.length; noted++) note(lots[noted]);
      for (let n = 0, planted = 0; n < want * 5 && planted < want; n++) {
        const at = {
          x:
            block.x + Math.floor(rand("tree-x", block.x, block.y, n) * block.w),
          y:
            block.y + Math.floor(rand("tree-y", block.x, block.y, n) * block.h),
        };
        const k = cellKey(at.x, at.y);
        if (used.has(k) || shade.has(k) || bodies.has(k)) continue;
        // A crown stands four cells tall: not in front of a house front.
        if (
          cells({ x: at.x - 2, y: at.y - 5, w: 5, h: 5 }).some((c) =>
            bodies.has(c),
          )
        )
          continue;
        if (!api.plant(at, n)) continue;
        reserve({ ...at, w: 1, h: 1 });
        planted++;
      }
    }
  for (const piece of layout.furniture) {
    if (form.motor && piece.x >= plaza.x - 1 && piece.x <= plaza.x + plaza.w &&
      piece.y >= plaza.y - 1 && piece.y <= plaza.y + plaza.h + 6) continue;
    api.furnish(piece);
  }
  api.paintCity((x, y) => layout.holds(x, y, 1));
  return [...lots, ...watchtowers];

  /** Houses standing apart in their own ground rather than in rows. */
  function detached(block: Block) {
    const use = uses.get(block);
    return (plotted && !compound) || use === "suburb" || use === "villa" || use === "estate";
  }

  /** Share of a block's ground under buildings once infill is done. Falls
   * off from the centre; the edge of a modern city is half yard. */
  function coverageTarget(block: Block): number {
    const use = uses.get(block);
    if (use)
      return {
        historic: 0.92,
        downtown: 0.9,
        commercial: 0.8,
        industrial: 0.6,
        rowhouse: 0.72,
        tenement: 0.78,
        villa: 0.3,
        suburb: 0.3,
        estate: 0.22,
        informal: 0.85,
      }[use];
    if (!modern) return 1;
    return block.reach < 0.35
      ? 0.8
      : block.reach < 0.6
        ? 0.68
        : block.reach < 0.85
          ? 0.55
          : 0.4;
  }

  /** How central a cell is, from the site's own cores where it has them.
   * Cores add, so a city with two centres is dense between them; the value
   * is clamped so the square of a one-core town still reads as 1. */
  function density(): ((x: number, y: number) => number) | undefined {
    const cores = site.cores;
    if (!cores?.length) return;
    return (x, y) =>
      Math.min(
        1,
        cores.reduce((sum, core) => {
          const d =
            Math.hypot(x - core.x, y - core.y) / Math.max(1, core.radius);
          return sum + (core.weight ?? 1) * Math.max(0, 1 - d * d);
        }, 0),
      );
  }

  /** The station stands on the block beside the line nearest the square, its
   * back to the tracks and its front on a paved forecourt. */
  function raiseStation(rail: Rail): Block | undefined {
    const alongX = rail.axis === "x";
    const beside = (b: Block) => {
      const [lo, hi] = alongX ? [b.y, b.y + b.h] : [b.x, b.x + b.w];
      return hi >= rail.level - 4 && hi <= rail.level
        ? -1
        : lo >= rail.level + rail.span && lo <= rail.level + rail.span + 4
          ? 1
          : 0;
    };
    const focus = {
      x: layout.plaza.x + (layout.plaza.w >> 1),
      y: layout.plaza.y + (layout.plaza.h >> 1),
    };
    const candidates = layout.blocks
      .filter((b) => beside(b) && b.w >= 12 && b.h >= 10)
      .sort(
        (a, b) =>
          Number(!!b.open) - Number(!!a.open) ||
          Math.hypot(a.x + a.w / 2 - focus.x, a.y + a.h / 2 - focus.y) -
          Math.hypot(b.x + b.w / 2 - focus.x, b.y + b.h / 2 - focus.y),
      );
    // The nearest block may already hold a venue by the square.
    for (const block of candidates) if (stationOn(block)) return block;
    return undefined;
  }

  function stationOn(block: Block) {
    const alongX = layout.rail!.axis === "x";
    const side = alongX
      ? block.y + block.h <= layout.rail!.level ? -1 : 1
      : block.x + block.w <= layout.rail!.level ? -1 : 1;
    // Which way its door faces: away from the rails, or in a city of rows
    // south like every other door.
    const facing = form.streetWall ? "south" : alongX
      ? side < 0 ? "north" : "south"
      : side < 0 ? "west" : "east";
    const stations = stationBuildings(pack.setting!, site.profile.radius, rand("station"));
    const bases = stations.length ? stations : [
      ...(civicBase ? [civicBase] : []),
      ...[...frames].sort(
        (a, b) => buildingModel(b).footprint[0] - buildingModel(a).footprint[0],
      ),
    ];
    for (const base of bases) {
      const frame = facing === "south" ? base : `${base}-${facing}`;
      if (!buildingModels[frame]) continue;
      const model = buildingModel(frame);
      const [w, h] = model.footprint;
      if (w > block.w - 2 || h > block.h - 2) continue;
      const rect = form.streetWall && !(alongX && side > 0)
        ? { x: alongX ? block.x + ((block.w - w) >> 1) : side < 0 ? block.x + block.w - w : block.x, y: block.y + block.h - h, w, h }
        : alongX
        ? {
            x: block.x + ((block.w - w) >> 1),
            y: side < 0 ? block.y + block.h - h : block.y,
            w,
            h,
          }
        : {
            x: side < 0 ? block.x + block.w - w : block.x,
            y: block.y + ((block.h - h) >> 1),
            w,
            h,
          };
      if (!fits(rect)) continue;
      const point = { x: rect.x + model.entrance[0], y: rect.y + model.entrance[1] };
      // Planted before the forecourt is paved round them.
      if (form.streetWall && rect.y === block.y) for (const [i, bed] of carriageLoop(block, rect).entries()) api.paintPark(bed, 900 + i);
      claimLandmark(
        {
          point,
          nx: 0,
          ny: 1,
          frame,
          rect,
          yard: rect,
          workPoint: point,
          piece: {
            name: "Railway station",
            about: "Where the line stops: a booking hall, a clock, and the platforms behind.",
          },
        },
        // In a city of rows the forecourt is as wide as the drive needs; the
        // rest of the block is the street's to build on.
        { forecourt: form.streetWall
          ? { x: Math.max(block.x, rect.x - 9), y: block.y, w: Math.min(block.x + block.w, rect.x + rect.w + 9) - Math.max(block.x, rect.x - 9), h: block.h }
          : block },
      );
      const rail = layout.rail!;
      // At least two cells wide, into the forecourt if the gap is narrower.
      const [from, to] =
        side < 0
          ? [Math.min((alongX ? block.y + block.h : block.x + block.w) - 1, rail.level - 2), rail.level - 1]
          : [rail.level + rail.span, Math.max(alongX ? block.y : block.x, rail.level + rail.span + 1)];
      api.platform?.(
        alongX
          ? { x: block.x, y: from, w: block.w, h: to - from + 1 }
          : { x: from, y: block.y, w: to - from + 1, h: block.h },
        alongX,
        point,
        rect,
      );
      return block;
    }
    return undefined;
  }

  /** The station's forecourt as a turning place: two planted beds either
   * side of the walk to the door, the cabs' drive round them, a lamp at each
   * end of the front. Furnished while the ground is free; returns the beds. */
  function carriageLoop(block: Block, hall: Rect): Rect[] {
    const mid = hall.x + (hall.w >> 1), reach = Math.min(8, (block.w >> 1) - 3);
    const front = hall.y + hall.h + 3, foot = block.y + block.h - 2;
    if (reach < 4 || foot - front < 2) return [];
    for (const x of [mid - reach - 1, mid + reach + 1]) api.furnish({ kind: "lamp", x, y: hall.y + hall.h + 1 });
    const beds = [
      { x: mid - reach + 1, y: front, w: reach - 2, h: foot - front + 1 },
      { x: mid + 2, y: front, w: reach - 2, h: foot - front + 1 },
    ];
    for (const b of beds) api.furnish({ kind: "planter", x: b.x + (b.w >> 1), y: b.y + (b.h >> 1) });
    return beds;
  }

  function onArterial(block: Block) {
    return layout.streets.some((s) => {
      if (s.tier !== 0) return false;
      const horizontal = s.a.y === s.b.y;
      const start = horizontal ? block.x : block.y;
      const end = start + (horizontal ? block.w : block.h);
      const lo = Math.min(horizontal ? s.a.x : s.a.y, horizontal ? s.b.x : s.b.y);
      const hi = Math.max(horizontal ? s.a.x : s.a.y, horizontal ? s.b.x : s.b.y);
      const level = horizontal ? s.a.y : s.a.x;
      const side = horizontal ? block.y : block.x;
      const depth = horizontal ? block.h : block.w;
      return end > lo && start < hi && Math.min(Math.abs(level - side), Math.abs(level - side - depth)) <= layout.tiers[0] / 2 + (form.verge ?? 0) + 3;
    });
  }

  /** Blocks nearest the square trade; the rest are craft rows, a few grander
   * ranges on the arterials, ordinary households, and a thin edge. */
  function quarterOf(block: Block): Quarter {
    if (block.reach < 0.38) return "market";
    if (block.reach > 0.82) return "edge";
    const roll = rand("quarter", block.x, block.y);
    if (onArterial(block) && block.reach < 0.7 && roll < 0.4) return "elite";
    return roll < 0.72 ? "craft" : "residential";
  }

  function quarterFor(use: LandUse, block?: Block): Quarter {
    if (use === "historic") return block ? quarterOf(block) : "market";
    return use === "downtown" || use === "commercial"
      ? "market"
      : use === "industrial"
        ? "craft"
        : use === "informal"
          ? "edge"
          : use === "villa"
            ? "elite"
            : "residential";
  }

  /** The bearing factories took: toward where the goods came in, the railway
   * where there is one, else the water or the bridge. */
  function industrySector() {
    const rail = layout.rail;
    const to = rail
      ? rail.axis === "x"
        ? { x: site.center.x, y: rail.level + (rail.span >> 1) }
        : { x: rail.level + (rail.span >> 1), y: site.center.y }
      : (api.shore ?? api.bridge);
    const bearing = to
      ? Math.atan2(to.y - site.center.y, to.x - site.center.x)
      : rand("industry") * Math.PI * 2;
    return { bearing, spread: Math.PI * zoning!.industry };
  }

  /** What a block became as the city grew. The old centre is rebuilt as a
   * downtown; each ring outward was laid out at a later date in the housing
   * of that date; the factories take one sector. */
  function landUseOf(block: Block): LandUse {
    const z = zoning!;
    const { industrial } = z.modernity;
    if (form.oldCore && block.district === 0) return "historic";
    const ring = ringOf(block.reach), u = block.reach;
    if (ring === "centre") return downtown ? "downtown" : "commercial";
    if (worksBlocks.has(block)) return "industrial";
    // Shops follow the main streets, thinning toward the edge.
    if (!block.low && onArterial(block) && rand("main", block.x, block.y) < Math.max(0.08, 0.95 - u * 1.1))
      return "commercial";
    // When this far out was built, the city growing evenly since its industry came.
    const built = industrial + Math.min(1, (u - rings!.centre) / (1 - rings!.centre)) * (year - industrial);
    if (
      z.informal &&
      built >= z.informal.from &&
      u > 0.65 &&
      rand("informal", block.x, block.y) < z.informal.share
    )
      return "informal";
    if (
      z.estates &&
      built >= z.estates.from &&
      rand("estate", block.x, block.y) < z.estates.share
    )
      return "estate";
    // Estates are a date as well as a place: before them the edge is more of the same.
    return ring === "outer" && !(z.outer === "estate" && (!z.estates || year < z.estates.from)) ? z.outer : z.inner;
  }

  /** House forms a quarter prefers, in the kit's form names. */
  function framesFor(quarter: Quarter, use?: LandUse): string[] {
    const modern = (pack.setting?.year ?? 0) >= 1900;
    const want =
      quarter === "market"
        ? modern
          ? ["shop", "office", "tall"]
          : ["shop", "tall", "inn"]
        : quarter === "craft"
          ? modern
            ? ["row", "shop", "midrise"]
            : ["row", "shop"]
          : quarter === "elite"
            ? modern
              ? ["wide", "office", "midrise", "tall"]
              : ["wide", "tall", "inn"]
            : quarter === "edge"
              ? modern
                ? ["shop", "row", "midrise"]
                : ["shop", "row"]
              : modern
                ? ["row", "midrise", "tall"]
                : ["row", "tall"];
    // The industrial city rebuilt its streets in its own idiom: where the
    // modern kit covers this use, it wins over the older period houses.
    const rebuilt =
      use && pack.setting && industrialized(pack.setting)
        ? modernBuildings(pack.setting, use).filter((f) => buildingModels[f])
        : [];
    if (rebuilt.length) return rebuilt;
    // Where the pack carries the place's older house beside the modern kit,
    // its housing and shop streets are still built of it.
    if (use && use !== "downtown" && use !== "estate" && use !== "informal" && use !== "industrial" && frames.some(isModernKit)) {
      const own = frames.filter((f) => !isModernKit(f) && !isPeriod(f) && FORMS[use].some((w) => f.endsWith(`-urban-${w}`)));
      if (own.length) return own;
    }
    // An old core is built of its own old houses, and nowhere else is.
    if (use === "historic" && historicFrames.length) {
      const shops = historicFrames.filter((f) => /-urban-shop$/.test(f));
      return quarter === "market" && shops.length ? [...shops, ...historicFrames] : historicFrames;
    }
    const period = frames.filter(isPeriod);
    if (period.length) {
      const roles =
        quarter === "market"
          ? ["shop", "tenement"]
          : quarter === "craft"
            ? ["shop", "house", "tenement"]
            : quarter === "elite"
              ? ["grand", "house"]
              : quarter === "edge"
                ? ["house", "shop"]
                : ["house", "tenement"];
      const chosen = period.filter((f) => roles.includes(periodRole(f)));
      return chosen.length ? chosen : period;
    }
    if (use) {
      const homes =
        use === "suburb"
          ? candidateBases
              .filter((c) => c.kind.includes("home"))
              .map((c) => c.base)
          : [];
      const oblique = modernBuildings(pack.setting!, use).filter(
        (f) => buildingModels[f],
      );
      // A town must not mix flat-front and oblique buildings on one block.
      const pool = homes.length
        ? homes
        : oblique.length
          ? oblique
          : [
              ...(use === "downtown" || use === "estate" ? towers : frames),
              ...small,
            ].filter((f) => FORMS[use].some((w) => f.endsWith(`-urban-${w}`)));
      if (pool.length) return modern ? preferStyle(pool, quarter) : pool;
    }
    // A researched fabric names its own forms; `house` is the pack's own
    // detached houses.
    const named = plotted ? form.quarters?.[quarter] : undefined;
    if (named) {
      const pool = [
        ...frames.filter((f) => named.some((w) => f.endsWith(`-urban-${w}`))),
        ...(named.includes("house") ? cottages : []),
      ];
      if (pool.length) return pool;
    }
    const chosen = frames.filter((f) => want.some((w) => f.endsWith(`-${w}`)));
    const pool = chosen.length ? chosen : frames;
    return modern ? preferStyle(pool, quarter) : pool;
  }

  function tallKit(frame: string) {
    return (buildingModel(frame) as { obliqueModern?: string }).obliqueModern === "kit" &&
      !/^modern-(atelier|machiya|nagaya|ginza)-/.test(frame);
  }

  function framesForBlock(block: Block) {
    if (yardRanges.get(block)) return atelierFrames;
    // On an alley: the short houses of the block's own kind, else workshops.
    if (block.low) {
      let short = lowKits.get(block);
      if (!short) {
        const families = new Set(kitOf(block).map((f) => f.split("-urban-")[0]));
        short = Object.keys(buildingModels).filter((f) => f.includes("-urban-") && families.has(f.split("-urban-")[0]) &&
          !/-(north|east|west)$/.test(f) && drawn(f) <= block.h + 1);
        // Houses where the family has small ones, workshops among them.
        lowKits.set(block, short = short.length ? [...short, atelierFrames[0]].filter(Boolean) : atelierFrames);
      }
      return short;
    }
    return kitOf(block);
  }

  function kitOf(block: Block) {
    let pool = blockKits.get(block);
    if (pool) return pool;
    const street = streetLookFrames(block);
    if (street?.length) {
      blockKits.set(block, street);
      return street;
    }
    pool = framesFor(quarters.get(block) ?? "residential", uses.get(block));
    if (zoning && uses.get(block) !== "industrial") {
      // A family is one kit's base in all its widths (`modern-shop-urban-*`),
      // or one numbered design; a block of one width leaves gaps it cannot fill.
      const familyOf = (f: string) => f.includes("-urban-") ? f.slice(0, f.indexOf("-urban-")) : f.replace(/-\d+$/, "");
      const families = [...new Set(pool.map(familyOf))];
      const family = families[Math.floor(rand("block-family", block.x, block.y) * families.length)];
      const coherent = pool.filter((f) => familyOf(f) === family);
      if (coherent.length) pool = coherent;
    }
    blockKits.set(block, pool);
    return pool;
  }

  function wealthForQuarter(quarter: Quarter) {
    return {
      market: 62,
      craft: 52,
      elite: 86,
      residential: 46,
      edge: 30,
    }[quarter];
  }
  /** Exponential weighted draw expressed as a sortable key. It preserves the
   * row's style variation while making large houses a consequence of central,
   * wealthy lots instead of their raw count in the asset list. */
  function scaleKey(
    frame: string,
    quarter: Quarter,
    density: number,
    roll: number,
  ) {
    const weight = buildingScaleWeight(buildingScale(frame), {
      settlement: pack.setting?.settlement,
      density,
      wealth: wealthForQuarter(quarter),
      quarter,
    });
    return -Math.log(Math.max(1e-9, roll)) / Math.max(1e-9, weight);
  }

  /** Where a modern city puts which kind of building. Concrete stands in the
   * middle, the shophouse arcades run along the trading streets, and the
   * houses under sheet metal are at the edge — the gradient every city that
   * grew in the 20th century has, and the one thing that stops a street in
   * Java looking like a street in Ohio. */
  function preferStyle(pool: string[], quarter: Quarter): string[] {
    const want =
      quarter === "market"
        ? ["arcade", "block"]
        : quarter === "craft"
          ? ["arcade", "veranda"]
          : quarter === "elite"
            ? ["block"]
            : quarter === "edge"
              ? ["veranda", "arcade"]
              : ["veranda", "block"];
    const chosen = pool.filter(
      (f) =>
        (buildingModels[f] as { obliqueModern?: string }).obliqueModern ||
        want.includes(modernStyle(f) ?? "block"),
    );
    return chosen.length ? chosen : pool;
  }

  /** Candidate businesses are more likely near the square; homes soften the
   * residential and elite quarters without turning every gap into retail. */
  function candidatePool(quarter: Quarter): CandidateRecipe[] {
    const homes = infillBases.filter((candidate) =>
      candidate.kind.includes("home"),
    );
    const commercial = infillBases.filter(
      (candidate) => !candidate.kind.includes("home"),
    );
    if (quarter === "market" || quarter === "craft") return commercial;
    if (quarter === "elite") return [...homes, ...commercial.slice(0, 3)];
    if (quarter === "residential") return [...homes, ...commercial.slice(0, 2)];
    return [];
  }

  /** Small buildings on any open ground that fronts a street: the slivers
   * beside an avenue, the ground round the square, the corners the block
   * reader was too coarse to keep. Every footway cell is tried as a door,
   * nearest the square first, and the largest small building that fits
   * behind it goes in facing the street. A modern city takes them all; an
   * older town thins out toward its edge. */
  function infillOpen() {
    const pool: CandidateRecipe[] = americanStrip
      ? infillBases
      : urbanFrames(pack, form.storeys, true).filter((base) => !base.endsWith("-urban-stall")).map((base) => ({
          base,
          model: buildingModel(base),
          kind: "home",
          group: "infill",
        }));
    if (!pool.length) return;
    const roadway = new Set<string>();
    const frontage = new Map<
      string,
      { nx: number; ny: number; square?: boolean }
    >();
    const span = (tier: 0 | 1 | 2) => layout.tiers[tier];
    for (const s of layout.streets) {
      const horizontal = s.a.y === s.b.y;
      const width = span(s.tier),
        lo = Math.floor((width - 1) / 2),
        hi = width - 1 - lo,
        verge = s.tier === 0 ? (form.verge ?? 0) : 0;
      const from = Math.min(
          horizontal ? s.a.x : s.a.y,
          horizontal ? s.b.x : s.b.y,
        ),
        to = Math.max(horizontal ? s.a.x : s.a.y, horizontal ? s.b.x : s.b.y),
        level = horizontal ? s.a.y : s.a.x;
      for (let v = from; v <= to; v++) {
        for (let d = -lo - verge; d <= hi + verge; d++)
          roadway.add(
            horizontal ? cellKey(v, level + d) : cellKey(level + d, v),
          );
        // The footway is two cells deep; a door on either row faces the street.
        for (const [d, side] of [
          [-lo - verge - 1, 1],
          [-lo - verge - 2, 1],
          [hi + verge + 1, -1],
          [hi + verge + 2, -1],
        ] as const) {
          const k = horizontal ? cellKey(v, level + d) : cellKey(level + d, v);
          if (!frontage.has(k))
            frontage.set(
              k,
              horizontal ? { nx: 0, ny: -side } : { nx: -side, ny: 0 },
            );
        }
      }
    }
    // A framed square is fronted across its streets, like any block.
    for (const r of [...(layout.plazaFront ? [] : [layout.plaza]), ...layout.squares]) {
      for (let x = r.x - 1; x <= r.x + r.w; x++) {
        frontage.set(cellKey(x, r.y - 1), { nx: 0, ny: -1, square: true });
        frontage.set(cellKey(x, r.y + r.h), { nx: 0, ny: 1, square: true });
      }
      for (let y = r.y - 1; y <= r.y + r.h; y++) {
        frontage.set(cellKey(r.x - 1, y), { nx: -1, ny: 0, square: true });
        frontage.set(cellKey(r.x + r.w, y), { nx: 1, ny: 0, square: true });
      }
      for (let y = r.y; y < r.y + r.h; y++)
        for (let x = r.x; x < r.x + r.w; x++) roadway.add(cellKey(x, y));
    }
    const focus = {
      x: layout.plaza.x + layout.plaza.w / 2,
      y: layout.plaza.y + layout.plaza.h / 2,
    };
    const doors = [...frontage]
      .map(([k, facing]) => {
        const [x, y] = k.split(",").map(Number);
        return {
          x,
          y,
          facing,
          square: facing.square,
          d: Math.hypot(x - focus.x, y - focus.y),
        };
      })
      .filter(
        ({ x, y }) => layout.holds(x, y, 2) && !roadway.has(cellKey(x, y)),
      )
      .sort((a, b) => a.d - b.d || a.x - b.x || a.y - b.y);
    const open = { block: layout.blocks[0], built: 0, coverage: 0, target: 1 };
    const clear = (r: Rect) => {
      for (let y = r.y; y < r.y + r.h; y++)
        for (let x = r.x; x < r.x + r.w; x++) {
          const k = cellKey(x, y);
          if (roadway.has(k) || frontage.has(k)) return false;
        }
      return true;
    };
    const kitWall = !!zoning && framesFor(quarterFor("tenement"), "tenement").some(tallKit);
    for (const door of doors) {
      if (lots.length >= capacity) return;
      const reach = door.d / layout.half;
      // Thinning is about what is filling the gaps, not the century: the
      // candidate kit is a handful of shops per street, the kit's own infill
      // is 3x2 stalls that would otherwise stand shoulder to shoulder from the
      // square to the edge.
      // A street wall is not thinned: the kit's ranges stand shoulder to
      // shoulder along the north side of every street.
      const streetWall = zoning && door.facing.ny < 0 && !door.facing.nx && kitWall;
      if (!americanStrip && !streetWall && !downtown && !outlying && rand("open", door.x, door.y) > 0.9 - 0.5 * reach)
        continue;
      const k = cellKey(door.x, door.y);
      if (used.has(k) || !api.dry({ x: door.x, y: door.y, w: 1, h: 1 }, false))
        continue;
      // The door faces the street it stands beside; the building sits behind it.
      const { nx, ny } = door.facing;
      const facing =
        nx > 0 ? "west" : nx < 0 ? "east" : ny > 0 ? "north" : "south";
      // An industrial city's leftover ground takes its own shops and ranges;
      // the kit's kiosks along every footway read as sheds.
      // The strip kit is for the American small town and the motor-age edge;
      // a city with a downtown builds its leftover frontage like any other.
      const strip = americanStrip && !((downtown || outlying) && (year < 1945 || ringOf(reach) !== "outer"));
      const here: LandUse | undefined =
        zoning && !strip
          ? reach < 0.4
            ? "commercial"
            : zoning.inner
          : undefined;
      // The city kit's tall ranges only stand as a block's street wall; one
      // dropped behind any footway hides whatever is north of it.
      const wall = (f: string) => facing === "south" || !tallKit(f);
      // Leftover frontage is built in the street looks of the place where it has them.
      const looked = here ? streetLooks(pack.setting!, here).blocks.flatMap(({ look }) => streetFrames(look as Parameters<typeof streetFrames>[0])) : [];
      const available = looked.length ? looked : here ? framesFor(quarterFor(here), here).filter(wall) : [];
      const civicHomes = zoning && reach < 0.4 && !looked.length
        ? modernBuildings(pack.setting!, "tenement").filter(wall) : [];
      const choices = (
        here
          ? (civicHomes.length ? civicHomes : available).map((base) => ({
              base,
              model: buildingModel(base),
              kind: here,
              group: "infill",
            }))
          : [...pool]
      ).sort(
        (a, b) =>
          b.model.footprint[0] * b.model.footprint[1] -
            a.model.footprint[0] * a.model.footprint[1] ||
          rand("open-model", door.x, door.y, a.base) -
            rand("open-model", door.x, door.y, b.base),
      );
      for (const recipe of choices) {
        const frame =
          facing === "south" ? recipe.base : `${recipe.base}-${facing}`;
        const model = buildingModels[frame];
        if (!model) continue;
        const [w, h] = model.footprint;
        // A house in a town of cars stands back from the sidewalk behind a
        // lawn; a shop is built up to it.
        // Houses in a town of cars stand in their own blocks, on lots.
        if (form.motor && !form.oldCore && recipe.kind.includes("home")) continue;
        const back = 0;
        const rect = {
          x: door.x - model.entrance[0] + nx * back,
          y: door.y - model.entrance[1] + ny * back,
          w,
          h,
        };
        const lawn = !back ? undefined
          : ny ? { x: rect.x, y: ny < 0 ? rect.y + h : rect.y - back, w, h: back }
          : { x: nx < 0 ? rect.x + w : rect.x - back, y: rect.y, w: back, h };
        if (!clear(rect) || !fits(rect) || !within(rect) || (lawn && !free(lawn))) continue;
        // Not a shop in a suburb or a factory yard, not a bungalow downtown.
        const use =
          useAt.get(cellKey(rect.x + (w >> 1), rect.y + (h >> 1))) ?? here;
        if (use === "suburb" || use === "villa" || use === "estate" || use === "industrial")
          continue;
        if (
          (use === "downtown" || use === "commercial") &&
          recipe.kind.includes("home")
        )
          continue;
        const lot: UrbanLot = {
          point: { x: door.x + nx * back, y: door.y + ny * back },
          quarter: reach < 0.38 ? "market" : "residential",
          use: back ? "suburb" : use ?? (zoning ? "commercial" : undefined),
          nx,
          ny,
          frame,
          rect,
          yard: rect,
          workPoint: { x: door.x - nx, y: door.y - ny },
          ...(lawn && { forecourt: lawn }),
        };
        if (place(open, lot)) break;
      }
    }
  }

  /** Compact buildings in whatever a block has left after its rows: corners,
   * back land, the shallow strip a row could not use. Slots are enumerated
   * once, largest footprint first and nearest a street edge first, and taken
   * until the block reaches its coverage. */
  function infill(rank: (typeof ranks)[number]) {
    const block = rank.block;
    const use = uses.get(block);
    if (use === "estate" || use === "industrial" || use === "tenement" || use === "rowhouse") return;
    if (form.motor && !form.oldCore && use === "suburb" && rank.built) return;
    // Houses in gardens keep the ground between them.
    if ((use === "villa" || use === "suburb") && rank.built && streetLookFrames(block)?.length) return;
    if (framesForBlock(block).some(tallKit)) return;
    // Offices, shops and works build over their whole block; homes keep yards.
    const own =
      use === "downtown" || use === "commercial" || use === "historic";
    const pool = own
      ? framesForBlock(block).map((base) => ({
          base,
          model: buildingModel(base),
          kind: use,
          group: "infill",
        }))
      : candidatePool(quarters.get(block) ?? "residential").filter(
          (c) => (use !== "suburb" || c.kind.includes("home")) &&
            !(form.motor && !form.oldCore && use !== "suburb" && c.kind.includes("home")),
        );
    if (!pool.length) return;
    const area = block.w * block.h;
    if (rank.coverage >= area * rank.target) return;
    type Slot = { recipe: CandidateRecipe; x: number; y: number; key: number };
    const slots: Slot[] = [];
    for (const recipe of pool) {
      const [w, h] = recipe.model.footprint;
      for (let y = block.y; y <= block.y + block.h - h; y++)
        for (let x = block.x; x <= block.x + block.w - w; x++) {
          const edge = Math.min(
            x - block.x,
            block.x + block.w - (x + w),
            y - block.y,
            block.y + block.h - (y + h),
          );
          slots.push({
            recipe,
            x,
            y,
            key:
              edge * 8 -
              w * h * 0.05 +
              rand("infill", block.x, block.y, x, y, recipe.base) * 2,
          });
        }
    }
    slots.sort((a, b) => a.key - b.key);
    for (const { recipe, x, y } of slots) {
      if (rank.coverage >= area * rank.target || lots.length >= capacity)
        return;
      const [w, h] = recipe.model.footprint,
        rect = { x, y, w, h };
      if (!free(rect)) continue;
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
      ].sort((a, b) => a.distance - b.distance);
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
        const lot: UrbanLot = {
          point,
          quarter: quarters.get(block),
          nx: edge.nx,
          ny: edge.ny,
          frame: base,
          rect,
          yard: rect,
          workPoint: { x: point.x - edge.nx, y: point.y - edge.ny },
        };
        if (place(rank, lot)) break;
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

  /** Rows along the block's long edges facing the streets, then a lane
   * through the middle with a row facing it on either side, until the depth
   * is spent. Each row is as deep as the deepest house actually put in it, so
   * a row of shops does not hold a range's depth empty behind it. A block
   * much taller than it is wide is filled as two columns facing east and
   * west instead. Ends of rows are party walls, so the short sides carry no
   * separate range. */
  function industrialLots(block: Block): UrbanLot[] {
    const out: UrbanLot[] = [];
    const pool = framesForBlock(block).sort((a, b) => {
      const am = buildingModel(a), bm = buildingModel(b);
      return Number(b.startsWith("modern-works")) - Number(a.startsWith("modern-works")) ||
        bm.footprint[0] * bm.footprint[1] - am.footprint[0] * am.footprint[1];
    });
    for (let y = block.y + 1, row = 0; y + 11 <= block.y + block.h && row < 5; row++) {
      let x = block.x + 1, depth = 0;
      for (let n = 0; n < 5 && x < block.x + block.w - 5; n++) {
        const choices = n || row || rand("works-kind", block.x, block.y) < 0.35
          ? [...pool].sort((a, b) => Number(b.includes("sawtooth")) - Number(a.includes("sawtooth"))) : pool;
        const frame = choices.find((f) => {
          const [w, h] = buildingModel(f).footprint;
          return x + w <= block.x + block.w - 5 && y + h + 5 <= block.y + block.h;
        });
        if (!frame) break;
        const model = buildingModel(frame), [w, h] = model.footprint;
        const rect = { x, y, w, h };
        const point = { x: x + model.entrance[0], y: y + model.entrance[1] };
        out.push({ frame, rect, yard: rect, point, workPoint: { x: point.x + 1, y: point.y },
          nx: 0, ny: -1, quarter: "craft", use: "industrial" });
        x += w + 4;
        depth = Math.max(depth, h);
      }
      if (!depth) break;
      y += depth + 10;
    }
    return out;
  }

  /** Once customers drive, a filling station, a market, a drive-in, a motel
   * and a garage each take a lot of their own on a block's south side: the
   * building at the back, its apron between it and the street. */
  function roadsideSites() {
    if (!form.motor || form.oldCore) return;
    const wanted: import("./sites").SiteKind[] = site.profile.radius >= 60
      ? ["gas", "market", "drive-in", "motel", "garage", "gas", "market"] : ["gas", "market", "drive-in", "garage"];
    const blocks = ranks
      .filter((r) => !parkRanks.has(r) && !["industrial", "downtown", "historic"].includes(uses.get(r.block) ?? ""))
      .sort((a, b) => Number(onArterial(b.block)) - Number(onArterial(a.block)) ||
        rand("site-block", a.block.x, a.block.y) - rand("site-block", b.block.x, b.block.y));
    const held = new Set<Block>();
    for (const [n, kind] of wanted.entries()) {
      const bases = candidateBases.filter((c) => siteKindOf(c.kind) === kind)
        .sort((a, b) => rand("site-base", n, a.base) - rand("site-base", n, b.base));
      search: for (const rank of blocks) {
        if (held.has(rank.block)) continue;
        for (const { base, model } of bases) {
          const [w, h] = model.footprint, kit = SITES[kind], block = rank.block;
          const sw = w + kit.side * 2, sh = h + kit.depth;
          if (sw > block.w || sh > block.h) continue;
          for (const x of [block.x, block.x + block.w - sw]) {
            const ground = { x, y: block.y + block.h - sh, w: sw, h: sh };
            if (!fits(ground)) continue;
            const rect = { x: x + kit.side, y: ground.y, w, h };
            const point = { x: rect.x + model.entrance[0], y: rect.y + model.entrance[1] };
            const lot: UrbanLot = { point, quarter: "market", use: "commercial", nx: 0, ny: -1, frame: base, rect, yard: rect,
              workPoint: { x: point.x, y: point.y + 1 }, site: { kind, rect: ground } };
            if (!place(rank, lot)) continue;
            reserve(ground);
            held.add(block);
            break search;
          }
        }
      }
    }
  }

  /** A block of detached houses in a town of cars: lots of one width along
   * its south street, each door to the sidewalk, and where the block is deep
   * enough a second row along the north street, seen from behind. */
  function houseLots(rank: (typeof ranks)[number]): UrbanLot[] {
    const block = rank.block, out: UrbanLot[] = [];
    const homes = candidateBases.filter((c) => c.kind.includes("home")).map((c) => c.base);
    const street = streetLookFrames(block);
    const pool = street?.length ? street : homes.length ? homes : framesForBlock(block);
    const faces = block.h >= 14 && !block.row ? (["south", "north"] as const) : (["south"] as const);
    const room = Math.floor(block.h / faces.length);
    for (const face of faces) {
      let x = block.x + 1;
      while (x < block.x + block.w - 4 && lots.length < capacity) {
        let step = 5;
        // Never the same house twice running.
        const order = [...pool].sort((a, b) => rand("house", x, block.y, face, a) - rand("house", x, block.y, face, b))
          .sort((a, b) => Number(out.at(-1)?.frame.startsWith(a)) - Number(out.at(-1)?.frame.startsWith(b)));
        for (const base of order) {
            const frame = face === "north" && buildingModels[`${base}-north`] ? `${base}-north` : base;
            const model = buildingModel(frame), [w, h] = model.footprint;
            if (x + w > block.x + block.w - 1 || h + 2 > room) continue;
            // On a row block the house stands at the lawn's edge, its path the lawn's two rows.
            const rect = { x, y: face === "south" ? block.y + block.h - h - (block.row ? 0 : 1) : block.y + 1, w, h };
            if (!api.dry(rect, false)) continue;
            const point = { x: rect.x + model.entrance[0], y: rect.y + model.entrance[1] };
            const ny = frame.endsWith("-north") ? 1 : -1, depth = Math.min(4, room - h - 1);
            const lot: UrbanLot = {
              point, quarter: quarters.get(block) ?? "residential", use: uses.get(block) ?? "suburb", nx: 0, ny, frame, rect, yard: rect,
              workPoint: { x: point.x, y: point.y - ny },
              ...(depth >= 2 && { garden: { x: rect.x, y: face === "south" ? rect.y - depth : rect.y + h, w: w + 2, h: depth, last: false } }),
            };
            if (!place(rank, lot)) continue;
            out.push(lot);
            // Room for the drive, and for a roof wider than its walls.
            step = w + 3 + marginsOf(frame)[0];
            break;
          }
        x += step;
      }
    }
    return out;
  }

  function blockLots(block: Block): UrbanLot[] {
    const rank = ranks.find((r) => r.block === block)!;
    if (block.open) return [];
    if (form.motor && !form.oldCore && (uses.get(block) === "suburb" || uses.get(block) === "villa")) {
      const houses = houseLots(rank);
      if (houses.length) return houses;
    }
    if (uses.get(block) === "industrial") {
      const works = industrialLots(block);
      if (works.length) return works.filter((lot) => lots.length < capacity && place(rank, lot));
    }
    if (block.row) return terrace(block, block.y + block.h, "south", 0, block.h).lots;
    const out: UrbanLot[] = [];
    const use = uses.get(block);
    const kit = use ? framesForBlock(block) : frames;
    // Seen from the south, a range of five storeys rises over the ten cells
    // behind it: one street wall on the block's south side, its court and the
    // next street's view of its roofs behind. A north-facing row would stand
    // in front of the shops across the street.
    // Its back is walled with yard ranges of one storey, low
    // enough to leave the roofs behind in view.
    if (kit.length && kit.every(tallKit)) {
      const south = terrace(block, block.y + block.h, "south", 0,
        Math.min(Math.max(...kit.map((f) => buildingModel(f).footprint[1])), block.h));
      out.push(...south.lots);
      const back = block.y + block.h - (south.depth || 0);
      if (back - block.y >= 5) {
        yardRanges.set(block, true);
        out.push(...terrace(block, block.y, "north", 1, 4).lots);
        yardRanges.delete(block);
      }
      return out;
    }
    const depths = kit.map((f) => buildingModel(f).footprint[1]);
    const widths = kit.map((f) => buildingModel(f).footprint[0]);
    const deepest = Math.max(...depths),
      shallowest = Math.min(...depths);
    let band = 0;
    if (block.h > block.w * 1.4 && block.w >= Math.min(...widths)) {
      const widest = Math.max(...widths);
      let left = block.x,
        right = block.x + block.w;
      const west = terrace(
        block,
        left,
        "west",
        band++,
        Math.min(widest, right - left),
      );
      out.push(...west.lots);
      left += west.depth || Math.min(widest, right - left);
      if (right - left >= Math.min(...widths))
        out.push(...terrace(block, right, "east", band++, right - left).lots);
      return out;
    }
    const gap = block.court ? 3 : 1;
    const yard = detached(block) ? GARDEN : (form.backs ?? 0);
    let top = block.y,
      bottom = block.y + block.h;
    const north = terrace(
      block,
      top,
      "north",
      band++,
      Math.min(deepest + yard, bottom - top),
    );
    out.push(...north.lots);
    top += north.depth || Math.min(deepest, bottom - top);
    if (bottom - top >= shallowest) {
      const south = terrace(
        block,
        bottom,
        "south",
        band++,
        Math.min(deepest + yard, bottom - top),
      );
      out.push(...south.lots);
      bottom -= south.depth || Math.min(deepest, bottom - top);
    }
    // A perimeter block closes its ends, leaving the court in the middle.
    if (
      zoning &&
      !detached(block) &&
      use !== "industrial" &&
      bottom - top >= shallowest
    ) {
      const end = Math.min(deepest, block.w >> 2);
      for (const [edge, face] of [
        [block.x, "west"],
        [block.x + block.w, "east"],
      ] as const)
        out.push(...terrace(block, edge, face, band++, end, top, bottom).lots);
    }
    // A lane between pairs runs the full width, so it meets the streets at
    // both ends of the block and nothing behind it is landlocked. Laid only
    // once the block is built: a lane through an empty block is a cul-de-sac
    // to nowhere.
    // An industrial-age block fronts its streets and keeps its middle for
    // yards; a lane of back-to-back rows is an older town's habit.
    while (!zoning && bottom - top >= gap + 2 * shallowest) {
      const laneY = top + Math.min(deepest + yard, (bottom - top - gap) >> 1);
      out.push(...terrace(block, laneY, "south", band++, laneY - top).lots);
      const below = terrace(
        block,
        laneY + gap,
        "north",
        band++,
        bottom - laneY - gap,
      );
      out.push(...below.lots);
      const lane = { x: block.x - 1, y: laneY + (gap >> 1) };
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
            api.paintCourt({ x: block.x, y: laneY, w: block.w, h: gap });
        },
      ]);
      top =
        laneY + gap + (below.depth || Math.min(deepest, bottom - laneY - gap));
    }
    return out;
  }

  /** One row of houses along a frontage, all opening the same way. `edge` is
   * the frontage line: the row's top for a north-facing row, its bottom for
   * a south-facing one, and likewise left and right for the columns. Returns
   * the depth the row actually took. */
  function terrace(
    block: Block,
    edge: number,
    face: "north" | "south" | "east" | "west",
    key: number,
    maxDepth: number,
    from?: number,
    to?: number,
  ): { lots: UrbanLot[]; depth: number } {
    const out: UrbanLot[] = [];
    const rank = ranks.find((r) => r.block === block)!;
    const quarter = quarters.get(block) ?? "residential";
    const use = uses.get(block);
    const open = detached(block);
    const vertical = face === "east" || face === "west";
    const nx = face === "west" ? 1 : face === "east" ? -1 : 0,
      ny = face === "north" ? 1 : face === "south" ? -1 : 0;
    const fitting = framesForBlock(block).filter((base) => {
      const [w, h] = buildingModel(base).footprint;
      return (
        (vertical ? w : h) <= maxDepth &&
        !!buildingModels[face === "south" ? base : `${base}-${face}`]
      );
    });
    // A row's roofs stay on its own block, at most a cell onto the walk
    // behind; a block none of its houses fit stays open ground.
    const pool = block.row ? fitting.filter((f) => drawn(f) <= block.h + 1) : fitting;
    if (!pool.length) return { lots: out, depth: 0 };
    const dominant =
      pool[Math.floor(rand("range", block.x, block.y, key) * pool.length)];
    // Party walls in a modern centre; a cell between neighbours elsewhere, so
    // a row reads as houses rather than one wall.
    // A plotted market row is a true terrace: the next house hides this
    // one's side wall. Elsewhere each stands clear of its own overhang.
    const tight = plotted && quarter === "market" && !vertical;
    const grand = quarter === "elite" && !tight && !modern;
    const spacing =
      use === "industrial"
        ? 2
        : tight || (modern && block.reach < 0.5) || (use && !open)
          ? 0
          : 1;
    const start = from ?? (vertical ? block.y : block.x),
      end = to ?? (vertical ? block.y + block.h : block.x + block.w);
    const gaps = Array.from({ length: end - start + 1 }, (_, i) => i);
    const lengths = [...new Set(pool.map((f) => buildingModel(f).footprint[vertical ? 1 : 0] + spacing))];
    for (let n = 1; n < gaps.length; n++)
      for (const length of lengths)
        if (length <= n) gaps[n] = Math.min(gaps[n], gaps[n - length]);
    let cursor = start,
      depth = 0;
    while (cursor < end - 2 && lots.length < capacity) {
      const density = Math.max(0, 1 - block.reach);
      const choices = [...pool].sort((a, b) => {
        const remaining = end - cursor + spacing;
        const aSpan = buildingModel(a).footprint[vertical ? 1 : 0] + spacing;
        const bSpan = buildingModel(b).footprint[vertical ? 1 : 0] + spacing;
        const aGap = aSpan <= remaining ? gaps[remaining - aSpan] ?? remaining : remaining;
        const bGap = bSpan <= remaining ? gaps[remaining - bSpan] ?? remaining : remaining;
        if (!open && aGap !== bGap) return aGap - bGap;
        const aKey =
          scaleKey(a, quarter, density, rand(block.x, edge, cursor, a)) /
          (a === dominant ? 1.8 : 1);
        const bKey =
          scaleKey(b, quarter, density, rand(block.x, edge, cursor, b)) /
          (b === dominant ? 1.8 : 1);
        return aKey - bKey;
      });
      const nearby = new Map<string, number>();
      for (const lot of lots)
        if (Math.abs(lot.point.x - (vertical ? edge : cursor)) + Math.abs(lot.point.y - (vertical ? cursor : edge)) < 20) {
          const base = lot.frame.replace(/-(north|east|west)$/, "");
          nearby.set(base, (nearby.get(base) ?? 0) + 1);
        }
      const family = (frame: string) => {
        const m = buildingModel(frame) as typeof buildingModels[string] & { regionalHouse?: string; regionalProfile?: string };
        const shop = /^(casa-[a-z-]+)-\d+-urban-shop$/.exec(frame);
        if (shop) return `${shop[1]}-urban-shop:${m.footprint.join(",")}`;
        return m.regionalHouse ? `${m.regionalHouse}:${m.regionalProfile}:${m.footprint.join(",")}` : frame;
      };
      // Reorder only interchangeable house sizes, retaining the row's fit and wealth choices.
      const variants = new Map<string, string[]>();
      for (const frame of choices) variants.set(family(frame), [...(variants.get(family(frame)) ?? []), frame]);
      for (const group of variants.values()) group.sort((a, b) => (nearby.get(a) ?? 0) - (nearby.get(b) ?? 0));
      const varied = choices.map((frame) => variants.get(family(frame))!.shift()!);
      let span = 1,
        tried = 0;
      // Not every plot is built: an orchard or a bit of green between houses.
      if (
        open &&
        !tight &&
        rand("plot-empty", block.x, edge, cursor) < 0.1
      ) {
        cursor += 5;
        continue;
      }
      for (const base of varied) {
        // Bounded: only the few best frames are put to the ground. Testing
        // every frame at every position would scan the block many times over.
        if (tried >= 12) break;
        // A detached house in its plot always shows its real door: the south
        // one, with the path walking round from whichever street it fronts.
        const round = open && !tight;
        const frame = face === "south" || round ? base : `${base}-${face}`;
        const model = buildingModel(frame),
          [w, h] = model.footprint;
        const along = vertical ? h : w;
        if (cursor + along > end) continue;
        // A grand house stands back from the street behind a forecourt: on
        // whichever street a detached one fronts, otherwise only where its
        // drawn door looks onto it.
        const setback = grand && (face === "south" || round) && (vertical ? w : h) + 3 <= maxDepth ? 3 : 0;
        const rect = vertical
          ? { x: face === "west" ? edge + setback : edge - w - setback, y: cursor, w, h }
          : { x: cursor, y: face === "north" ? edge + setback : edge - h - setback, w, h };
        const point = {
          x: rect.x + model.entrance[0],
          y: rect.y + model.entrance[1],
        };
        tried++;
        // A wide range straddles a contour a narrower one clears, so the ground
        // is asked here, while there is still another frame to try.
        if (!api.dry(rect, false) || !api.dry({ ...point, w: 1, h: 1 }, false))
          continue;
        const margins = marginsOf(frame);
        // Along a column the next house stands under this one's roof, so it
        // keeps that clear whatever the layout. A plot also keeps a gap.
        const clear =
          (open && !tight
            ? margins[vertical ? 1 : 0] +
              (use === "estate" ? 4 : 1) +
              Math.floor(rand("plot-gap", block.x, edge, cursor) * 3)
            : vertical
              ? Math.max(spacing, margins[1])
              : spacing) +
          // A grand house stands in its own grounds, clear of the next; on a
          // city street its grounds are a garden's width.
          (grand ? (block.row ? 1 : 3) + Math.floor(rand("grand-gap", block.x, edge, cursor) * 3) : 0);
        const deep = vertical ? w : h;
        // A row's lots all reach the same back line, whatever the house depth.
        const room = open ? Math.min(GARDEN, maxDepth - deep - setback) : maxDepth - deep - setback;
        const garden =
          // Behind a row house, its yard to the back of the block.
          block.row && form.backs && use !== "commercial" && use !== "downtown" && use !== "industrial" && rect.y - block.y >= 2
            ? { x: rect.x, y: block.y, w, h: rect.y - block.y, last: false }
            :
          // A town house's yard can be two rows: room for the privy and the wash.
          (open || (form.backs && !vertical && !use)) && use !== "estate" && room >= (open ? 2 : 3)
            ? {
                x: vertical
                  ? face === "west"
                    ? rect.x + w
                    : rect.x - room
                  : rect.x,
                y: vertical
                  ? rect.y
                  : face === "north"
                    ? // The row outside a south door stays a walk.
                      rect.y + h + (round ? 1 : 0)
                    : rect.y - room,
                w: vertical ? room : w + clear,
                h: vertical
                  ? h + clear
                  : room - (round && face === "north" ? 1 : 0),
                last: false,
              }
            : undefined;
        const lot: UrbanLot = {
          point,
          quarter,
          nx: round ? 0 : nx,
          ny: round ? -1 : ny,
          frame,
          rect,
          yard: rect,
          workPoint: round
            ? { x: point.x + 1, y: point.y }
            : { x: point.x - nx, y: point.y - ny },
          garden,
          tight,
          ...(setback
            ? {
                forecourt: vertical
                  ? { x: face === "west" ? edge : rect.x + w, y: rect.y - 1, w: setback, h: h + 2 }
                  : { x: rect.x - 1, y: face === "north" ? edge : rect.y + h, w: w + 2, h: setback },
              }
            : {}),
        };
        if (!place(rank, lot)) continue;
        out.push(lot);
        span = along + clear - spacing;
        depth = Math.max(depth, deep + setback + (garden ? room : 0));
        break;
      }
      cursor += span + spacing;
    }
    const closing = out.at(-1)?.garden;
    if (closing) closing.last = true;
    // A row that reaches the block's end turns the corner with a cut bay.
    if (face === "south")
      for (const [lot, side, at] of [[out[0], "w", start], [out.at(-1), "e", end]] as const) {
        if (!lot || !tallKit(lot.frame) || (side === "w" ? lot.rect.x : lot.rect.x + lot.rect.w) !== at) continue;
        const family = lot.frame.replace(/-\d+$/, "");
        const corner = Object.keys(buildingModels).find((f) =>
          f.startsWith(`${family}-corner-${side}-`) && /-\d+$/.test(f) &&
          buildingModel(f).footprint[0] === lot.rect.w && buildingModel(f).footprint[1] === lot.rect.h);
        if (corner) lot.frame = corner;
      }
    return { lots: out, depth };
  }
}

/** Cells a frame's drawing overhangs its footprint to the right and behind.
 * Period facades are drawn front-on and carry no baked margins, but a
 * three-storey front still rises over the lot behind it. */
function marginsOf(frame: string): number[] {
  const model = buildingModel(frame) as { margins?: number[]; period?: boolean; candidate?: boolean; height?: number; footprint: number[]; anchor: number[] };
  // A twentieth-century street block keeps the ground its facade is drawn
  // over, and an alley behind that.
  // A tower rises over the blocks behind it, as towers do; it keeps only an alley's worth.
  if (towerStyleFor(frame)) return [0, 10];
  if (frame.startsWith("mod-")) return [0, Math.ceil(model.anchor[1] / 16) - model.footprint[1] + 2];
  // The small street kit is drawn `height` pixels tall on its footprint.
  if (model.candidate && model.height && !model.margins)
    return [0, Math.max(0, Math.ceil((model.height - model.footprint[1] * 16) / 16))];
  const [w, h] = model.footprint;
  if (model.period) return [0, -Math.min(0, ...buildingRoofCells(frame, { x: 0, y: 0, w, h }).map((c) => c.y))];
  // Declared margins are missing or 0 on most front-view houses; the sprite's bounds are not.
  const drawn = buildingArtCells(frame, { x: 0, y: 0, w, h });
  const [right, behind] = model.margins ?? [0, 0];
  return [
    Math.max(right, Math.max(...drawn.map((c) => c.x)) + 1 - w),
    Math.max(behind, -Math.min(0, ...drawn.map((c) => c.y))),
  ];
}
