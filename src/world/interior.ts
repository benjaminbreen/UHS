import { interiorProfileFor, type InteriorSite } from "../content/interiors/select";
import { planBuilding, type PlacedRoom, type RoomPlan } from "../render/interiors/building";
import type { Finish, Kind, Prop, RoomParams, Trade } from "../render/interiors/room";
import type { Place, Point } from "../core/types";

/** A standing place and the way to face while there (0 N, 1 E, 2 S, 3 W). */
export type Spot = Point & {
  facing: number;
  kind: Kind;
  propId: number;
  /** On the piece itself rather than beside it: sat on a seat, sat on the floor, or lain in. */
  on?: "seat" | "floor" | "bed";
};
export type SpotRole = "bed" | "seat" | "work" | "fire";
export type InteriorLayout = {
  /** The house as a whole; each room's own look is in `plan.rooms`. */
  params: RoomParams;
  plan: RoomPlan;
  rooms: PlacedRoom[];
  /** Doorways into private rooms, as "x,y" game cells: shut to a stranger. */
  locks: Set<string>;
  props: Prop[];
  /** Room cells people can stand on as it is first furnished, as "x,y" in game cells. */
  walk: Set<string>;
  /** Cells clear of walls and built-in pieces; furniture stands on these. */
  floor: Set<string>;
  /** Standing pieces that can be shoved, knocked over or broken. */
  furniture: { propId: number; def: string; pos: Point; size: [number, number] }[];
  exit: Point;
  entry: Point;
  beds: Spot[];
  work: Spot[];
  fire: Spot[];
  seats: Spot[];
  /** Where the household's chest, bed and work station sit: always a real
   * piece of the room where it has one, else a floor cell you can reach. */
  store: Point;
  bedCell: Point;
  workCell: Point;
};

/** Floor tile (0, 0) is game cell (1, 1), so a room never sits on the edge. */
export const ROOM_ORIGIN = 1;
const at = (x: number, y: number): Point => ({ x: x + ROOM_ORIGIN, y: y + ROOM_ORIGIN });
const key = (p: Point) => `${p.x},${p.y}`;

// Things people walk over or lie on; everything else on the floor is in the way.
const FLAT: Kind[] = ["rug", "cat", "clutter", "mat", "cushions", "ladder", "door", "window", "tapestry", "pegs", "plates", "map", "shrine", "horns", "clock", "elevator", "frame"];
// Everything else standing in a room is built in: beds, fires, wall pieces.
const FURNITURE: Partial<Record<Kind, string>> = {
  stool: "room-stool", table: "room-table", lowtable: "room-lowtable", desk: "room-desk", counter: "room-counter",
  chest: "room-chest", crate: "room-crate", armchair: "room-armchair", sofa: "room-sofa", divan: "room-divan",
  loom: "room-loom", spinwheel: "room-spinwheel", throw: "room-throw", radio: "room-radio", icebox: "room-icebox",
  potrack: "room-potrack", firewood: "room-firewood", quern: "room-quern", jars: "room-jars", claybin: "room-claybin",
  plant: "room-plant", lamp: "room-lamp", basket: "room-basket", sacks: "room-sacks", pack: "room-pack",
};
const SEATS: Kind[] = ["stool", "cushions", "armchair", "sofa", "divan"];
const FIRES: Kind[] = ["hearth", "firepit", "irori", "brazier", "stove", "range"];
const WORK: Record<Trade, Kind[]> = {
  weaver: ["loom", "spinwheel", "basket"],
  potter: ["throw", "claybin", "potrack"],
  scholar: ["desk", "scrolls"],
  merchant: ["counter", "sacks", "jars", "crate"],
  hunter: ["hides"],
  household: ["quern", "table", "lowtable", "basket"],
};

/** The interior trade a livelihood's activity reads as. */
export function tradeFor(activity = ""): Trade {
  const a = activity.toLowerCase();
  if (/weav|spin|textile|cloth|dye|tailor|sew|embroider/.test(a)) return "weaver";
  if (/pot|ceram|kiln/.test(a)) return "potter";
  if (/scribe|clerk|scholar|teach|copy|account|record|priest|monk|astrolog/.test(a)) return "scholar";
  if (/trad|merchant|sell|shop|market|peddl|money|lend/.test(a)) return "merchant";
  if (/hunt|trap|tann|skin|furr/.test(a)) return "hunter";
  return "household";
}

function seedOf(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return (h >>> 0) % 99991;
}

/** Builds the room a household lives in: its profile from place and date, its
 * finish from the household's fortune, its furniture from the trade. Rooms
 * are larger than the building outside; that is deliberate. */
export function buildInterior(place: Place, site: InteriorSite, o: { fortune?: number; activity?: string; hour?: number }): InteriorLayout {
  const seed = seedOf(place.id);
  const profile = interiorProfileFor(site);
  const status: Finish = o.fortune === undefined ? 1 : o.fortune < 0.34 ? 0 : o.fortune < 0.72 ? 1 : 2;
  const [tw, td] = profile.rooms?.[0].size ?? profile.size;
  const k = [0.85, 1, 1.2][status];
  const shapes = profile.shapes;
  const building = planBuilding(profile, {
    seed,
    status,
    colorway: -1,
    w: Math.max(6, Math.round(tw * k)),
    d: Math.max(5, Math.round(td * k)),
    shape: seed % 10 < 6 ? shapes[0] : shapes[seed % shapes.length],
    trade: tradeFor(o.activity),
    hour: o.hour ?? 12,
  });
  const { plan, props } = building;
  // The house as a whole: its size, its way in, and the first room's look for what is not a room's own.
  const params: RoomParams = { ...plan.rooms[0], w: plan.w, d: plan.d, entrance: plan.entrance[0] >= 0 ? plan.entrance[0] : undefined };
  const mask = plan.mask;
  const walk = new Set<string>();
  for (let y = 0; y < params.d; y++) for (let x = 0; x < params.w; x++) if (mask[y * params.w + x]) walk.add(key(at(x, y)));
  const floor = new Set(walk);
  const loose = (q: Prop) => !q.wall && !!FURNITURE[q.kind];
  for (const q of props) {
    if (q.wall && q.d === 0) continue;
    if (FLAT.includes(q.kind)) continue;
    for (let y = q.y; y < q.y + Math.max(1, q.d); y++)
      for (let x = q.x; x < q.x + q.w; x++) {
        walk.delete(key(at(x, y)));
        if (!loose(q)) floor.delete(key(at(x, y)));
      }
  }
  const open = (p: Point) => walk.has(key(p));
  /** Where to stand to use a piece, front first, facing it. */
  const stands = (q: Prop): Spot[] => {
    const out: Spot[] = [];
    const push = (x: number, y: number, facing: number) => {
      const p = at(x, y);
      if (open(p) && !out.some((s) => s.x === p.x && s.y === p.y)) out.push({ ...p, facing, kind: q.kind, propId: q.id });
    };
    const d = Math.max(1, q.d);
    for (let x = q.x; x < q.x + q.w; x++) push(x, q.y + d, 0);
    for (let y = q.y; y < q.y + d; y++) {
      push(q.x - 1, y, 1);
      push(q.x + q.w, y, 3);
    }
    for (let x = q.x; x < q.x + q.w; x++) push(x, q.y - 1, 2);
    return out;
  };
  const of = (kinds: Kind[]) => props.filter((q) => kinds.includes(q.kind));
  const door = props.find((q) => q.kind === "door");
  const ladder = props.find((q) => q.kind === "ladder");
  const exitProp = door ?? ladder;
  let exit = plan.entrance[0] >= 0 ? at(plan.entrance[0], plan.entrance[1]) : exitProp ? at(exitProp.x, exitProp.y) : at(Math.floor(params.w / 2), params.d - 1);
  if (!open(exit)) exit = [...walk].map((s) => ({ x: +s.split(",")[0], y: +s.split(",")[1] }))[0] ?? exit;
  walk.add(key(exit));
  const inward = plan.entrance[0] >= 0 ? -1 : 1;
  const entry = [{ x: exit.x, y: exit.y + inward }, { x: exit.x - 1, y: exit.y }, { x: exit.x + 1, y: exit.y }, { x: exit.x, y: exit.y - inward }].find(open) ?? exit;
  // Whatever the door cannot lead to is not part of the room: no one stands in it.
  const reached = new Set([key(entry)]);
  for (const k of reached) {
    const [x, y] = k.split(",").map(Number);
    for (const n of [`${x + 1},${y}`, `${x - 1},${y}`, `${x},${y + 1}`, `${x},${y - 1}`]) if (walk.has(n)) reached.add(n);
  }
  for (const k of walk) if (!reached.has(k)) walk.delete(k);
  const sleepers = of(["bed", "boxbed", "mat"]);
  const beside = (p: Point) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => open({ x: p.x + dx, y: p.y + dy }));
  const cells = (q: Prop) => Array.from({ length: q.w }, (_, i) => at(q.x + i, q.y)).filter(beside);
  // A bed sleeps two, as beds did; a mat or a box bed one.
  const beds = sleepers.flatMap((q) => cells(q).slice(0, q.kind === "bed" ? 2 : 1).map((p): Spot => ({ ...p, facing: 2, kind: q.kind, propId: q.id, on: "bed" })));
  const trade = params.trade;
  const work = of(WORK[trade]).flatMap(stands);
  const fire = of(FIRES).flatMap(stands);
  // A stool is turned to the table or the fire it stands at; anything with a back faces the room.
  const boards = of(["table", "lowtable", "desk", "counter", ...FIRES]);
  const toward = (p: Point) => {
    const hit = (dx: number, dy: number) => boards.some((b) => p.x + dx - ROOM_ORIGIN >= b.x && p.x + dx - ROOM_ORIGIN < b.x + b.w && p.y + dy - ROOM_ORIGIN >= b.y && p.y + dy - ROOM_ORIGIN < b.y + Math.max(1, b.d));
    return hit(1, 0) ? 1 : hit(-1, 0) ? 3 : hit(0, -1) ? 0 : 2;
  };
  const seats = [
    ...of(SEATS).flatMap((q) =>
      cells(q).map((p): Spot => ({ ...p, facing: q.kind === "stool" || q.kind === "cushions" ? toward(p) : 2, kind: q.kind, propId: q.id, on: q.kind === "cushions" ? "floor" : "seat" })),
    ),
    ...of(["table", "lowtable"]).flatMap(stands),
  ];
  // One spot per piece before a second at any, so a household spreads
  // round the room instead of queueing at one table.
  const spread = (list: Spot[]) => {
    const byProp = new Map<number, Spot[]>();
    for (const p of list) byProp.set(p.propId, [...(byProp.get(p.propId) ?? []), p]);
    const groups = [...byProp.values()];
    const out: Spot[] = [];
    for (let i = 0; out.length < list.length; i++) for (const g of groups) if (g[i]) out.push(g[i]);
    return out;
  };
  const storeSpots = of(["chest", "jars", "crate", "sacks", "shelf", "dresser"]).flatMap(stands);
  // The piece's cell nearest where someone can stand to use it.
  const cellOf = (spots: Spot[]) => {
    const q = props.find((p) => p.id === spots[0]?.propId);
    if (!q) return;
    const clamp = (v: number, lo: number, n: number) => Math.min(Math.max(v, lo), lo + n - 1);
    return at(clamp(spots[0].x - ROOM_ORIGIN, q.x, q.w), clamp(spots[0].y - ROOM_ORIGIN, q.y, Math.max(1, q.d)));
  };
  const cell = (s?: Spot) => s && { x: s.x, y: s.y };
  // The pieces the household's bed, chest and work objects sit on stay put.
  const bound = new Set([beds[0]?.propId, work[0]?.propId, storeSpots[0]?.propId]);
  for (const q of props) if (loose(q) && bound.has(q.id)) for (let y = q.y; y < q.y + Math.max(1, q.d); y++) for (let x = q.x; x < q.x + q.w; x++) floor.delete(key(at(x, y)));
  const furniture = props
    .filter((q) => loose(q) && !bound.has(q.id))
    .map((q) => ({
      propId: q.id,
      def: q.kind === "stool" && params.styles.stool === "chair" ? "room-chair" : FURNITURE[q.kind]!,
      pos: at(q.x, q.y),
      size: [q.w, Math.max(1, q.d)] as [number, number],
    }));
  const locks = new Set(building.doorways.filter((dw) => dw.private).flatMap((dw) => dw.cells.map(([x, y]) => key(at(x, y)))));
  return {
    params,
    plan,
    rooms: building.rooms,
    locks,
    props,
    walk,
    floor,
    furniture,
    exit,
    entry,
    beds: spread(beds),
    work,
    fire: spread(fire),
    seats: spread(seats),
    store: cellOf(storeSpots) ?? cell(seats[0]) ?? cell(fire[0]) ?? entry,
    bedCell: cellOf(beds) ?? cell(seats[0]) ?? cell(fire[0]) ?? entry,
    workCell: cellOf(work) ?? cell(fire[0]) ?? cell(seats[0]) ?? entry,
  };
}

/** What the room offers at a cell, most particular first. */
export function spotsAt(room: InteriorLayout, x: number, y: number) {
  const roles: [SpotRole, Spot[]][] = [["bed", room.beds], ["work", room.work], ["fire", room.fire], ["seat", room.seats]];
  return roles.flatMap(([role, list]) => list.filter((s) => s.x === x && s.y === y).map((s) => ({ ...s, role })));
}
