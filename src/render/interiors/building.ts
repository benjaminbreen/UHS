import { resolveRoom, type RoomChoice } from "../../content/interiors/resolve";
import type { InteriorProfile, RoomRole } from "../../content/interiors/types";
import { planRoom, roomMask, type Prop, type RoomParams, type Shape } from "./room";

/** Rooms laid out on one grid: which room each cell belongs to, and each
 * room's own look. Cells of a doorway between rooms are floor too. */
export type RoomPlan = {
  w: number;
  d: number;
  /** 0 outside, 1 floor, 2 open court: the mask the renderers draw. */
  mask: ReturnType<typeof roomMask>;
  /** The room each cell belongs to, -1 outside. */
  cells: Int16Array;
  rooms: RoomParams[];
  /** The cell the building is entered by, on its bottom edge. */
  entrance: [number, number];
  doorways: Doorway[];
};
export type PlacedRoom = { label: string; role: RoomRole; x: number; y: number; w: number; d: number; private: boolean };
export type Doorway = { cells: [number, number][]; from: number; to: number; private: boolean };
export type Building = { plan: RoomPlan; props: Prop[]; rooms: PlacedRoom[]; doorways: Doorway[] };

/** A wall seen face-on is three tiles tall and capped: that many rows lie
 * between a room and the one behind it. A side wall is a single column. */
const BEHIND = 4;
const BESIDE = 1;
const BACK: RoomRole[] = ["sleep", "store"];

/** Which of a profile's rooms a household has: the humble make do with the
 * first living room and somewhere to sleep, the comfortable add the rest. */
function roomsFor(profile: InteriorProfile, status: RoomChoice["status"]) {
  const all = (profile.rooms ?? []).map((t, i) => ({ t, i, role: t.role ?? (i === 0 ? "entry" : "hall") })).filter((r) => r.role !== "lobby");
  if (all.length < 2) return all;
  // Nobody sleeps in the court.
  const sleeps = (r: (typeof all)[number]) => (r.t.sleep ?? profile.sleep) !== "none" && r.t.shapes?.[0] !== "courtyard";
  const keep = [all[0]];
  const bed = all.find((r) => r !== all[0] && sleeps(r));
  if (!sleeps(all[0]) && bed) keep.push(bed);
  const rest = all.filter((r) => !keep.includes(r));
  keep.push(...rest.slice(0, [1, 2, rest.length][status]));
  return all.filter((r) => keep.includes(r));
}

/** The rooms of a household laid out on one grid, entered from below: round
 * a court where the house opens on one, else in rows. */
export function planBuilding(profile: InteriorProfile, c: RoomChoice): Building {
  const chosen = roomsFor(profile, c.status);
  if (chosen.length < 2) return single(profile, c, chosen[0]?.i);
  const k = [0.8, 0.9, 1][c.status];
  const boxes: Box[] = chosen.map(({ t, i, role }) => ({
    i,
    role,
    label: t.label,
    shape: t.shapes?.[0] ?? "rect",
    w: Math.max(5, Math.round(t.size[0] * k)),
    d: Math.max(4, Math.round(t.size[1] * k)),
    x: 0,
    y: 0,
  }));
  const court = boxes[0].shape === "courtyard" && boxes[0].w >= 9 && boxes[0].d >= 8 ? boxes[0] : undefined;
  const { doorways, entry } = court ? aroundCourt(boxes, court) : inRows(boxes);
  const w = Math.max(...boxes.map((b) => b.x + b.w)), d = Math.max(...boxes.map((b) => b.y + b.d));
  const entrance = entry.x + Math.floor(entry.w / 2);
  // Each room planned in its own coordinates, kept clear where a doorway meets it.
  const props: Prop[] = [];
  const mask = new Uint8Array(w * d), cells = new Int16Array(w * d).fill(-1);
  const rooms: RoomParams[] = [];
  for (const [ri, b] of boxes.entries()) {
    const openings: [number, number][] = [], ports: [number, number][] = [];
    for (const dw of doorways) {
      if (dw.a !== b && dw.b !== b) continue;
      for (const [cx, cy] of dw.cells)
        for (const [ox, oy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const lx = cx + ox - b.x, ly = cy + oy - b.y;
          if (lx < 0 || ly < 0 || lx >= b.w || ly >= b.d) continue;
          openings.push([lx, ly]);
          if (ox || oy) ports.push([lx, ly]);
        }
    }
    // A courtyard needs room to open: small ones are roofed over.
    const shape = b.shape === "courtyard" && (b.w < 9 || b.d < 8) ? "rect" : b.shape;
    const params = resolveRoom(profile, { ...c, room: b.i, w: b.w, d: b.d, shape });
    // Where the house has a room to sleep in, the others keep no beds unless their own template says so.
    if ((boxes.some((o) => o.role === "sleep") && b.role !== "sleep" && profile.rooms?.[b.i].sleep === undefined) || b === court) params.sleep = "none";
    params.openings = openings;
    params.ports = ports;
    if (b === entry) params.entrance = entrance - b.x;
    rooms.push(params);
    const planned = planRoom(params).filter((q) => q.kind !== "door");
    for (const q of planned) props.push({ ...q, x: q.x + b.x, y: q.y + b.y, room: ri });
    const m = roomMask(params);
    for (let y = 0; y < b.d; y++)
      for (let x = 0; x < b.w; x++)
        if (m[y * b.w + x]) {
          mask[(y + b.y) * w + x + b.x] = m[y * b.w + x];
          cells[(y + b.y) * w + x + b.x] = ri;
        }
  }
  for (const dw of doorways)
    for (const [cx, cy] of dw.cells) {
      mask[cy * w + cx] = 1;
      cells[cy * w + cx] = boxes.indexOf(dw.b);
    }
  props.forEach((q, i) => (q.id = i));
  const ways = doorways.map((dw) => ({ cells: dw.cells, from: boxes.indexOf(dw.a), to: boxes.indexOf(dw.b), private: dw.b.role === "sleep" || dw.a.role === "sleep" }));
  return {
    plan: { w, d, mask, cells, rooms, entrance: [entrance, entry.y + entry.d - 1], doorways: ways },
    props,
    rooms: boxes.map((b) => ({ label: b.label, role: b.role, x: b.x, y: b.y, w: b.w, d: b.d, private: b.role === "sleep" })),
    doorways: ways,
  };
}

type Box = { i: number; role: RoomRole; label: string; shape: Shape; w: number; d: number; x: number; y: number };
type Link = { a: Box; b: Box; cells: [number, number][] };
/** A doorway up through the wall between a room and the one behind it. */
function through(under: Box, b: Box): Link {
  const lo = Math.max(b.x, under.x) + 1, hi = Math.min(b.x + b.w, under.x + under.w) - 3;
  const px = hi >= lo ? Math.floor((lo + hi) / 2) : under.x + 1;
  return { a: under, b, cells: Array.from({ length: BEHIND }, (_, j) => [[px, b.y + b.d + j], [px + 1, b.y + b.d + j]] as [number, number][]).flat() };
}
/** A doorway through the side wall between neighbours, near the foot of the shorter. */
function beside(a: Box, b: Box): Link {
  const y = Math.max(a.y, b.y) + Math.min(a.y + a.d, b.y + b.d) - Math.max(a.y, b.y) - 2;
  return { a, b, cells: [[a.x + a.w, y - 1], [a.x + a.w, y]] };
}
/** Whichever of these a room behind them most overlaps. */
function below(b: Box, under: Box[]) {
  const span = (f: Box) => Math.min(b.x + b.w, f.x + f.w) - Math.max(b.x, f.x);
  return under.reduce((best, f) => (span(f) > span(best) ? f : best), under[0]);
}

/** Public rooms in a row along the front, top-aligned so the back wall runs
 * level; sleeping rooms and stores behind, stores behind the kitchen. */
function inRows(boxes: Box[]) {
  const front = boxes.filter((b) => !BACK.includes(b.role));
  const back = boxes.filter((b) => BACK.includes(b.role));
  if (!front.length) front.push(back.shift()!);
  let x = 0;
  for (const b of front) (b.x = x), (x += b.w + BESIDE);
  const rowTop = back.length ? Math.max(...back.map((b) => b.d)) + BEHIND : 0;
  for (const b of front) b.y = rowTop;
  const parent = (b: Box) => (b.role === "store" && front.find((f) => f.role === "kitchen")) || front[0];
  back.sort((a, b) => parent(a).x - parent(b).x);
  const doorways: Link[] = [];
  let bx = 0;
  for (const b of back) {
    b.x = Math.max(bx, parent(b).x);
    b.y = rowTop - BEHIND - b.d;
    bx = b.x + b.w + BESIDE;
    doorways.push(through(below(b, front), b));
  }
  for (const row of [front, back])
    for (let n = 1; n < row.length; n++) if (row[n].x === row[n - 1].x + row[n - 1].w + BESIDE) doorways.push(beside(row[n - 1], row[n]));
  return { doorways, entry: front[0] };
}

/** A house turned inward on its court, as a domus on its atrium, a haveli on
 * its chowk, a dar on its wast: the court entered straight from the street,
 * a sleeping room to either side, and the rest across the back behind the
 * court's far wall, each opening onto the court or the room below it. */
function aroundCourt(boxes: Box[], court: Box) {
  const others = boxes.filter((b) => b !== court);
  const west = others.find((b) => b.role === "sleep");
  const east = others.find((b) => b !== west && (b.role === "sleep" || b.role === "kitchen" || b.role === "store"));
  const north = others.filter((b) => b !== west && b !== east);
  for (const side of [west, east]) if (side) side.d = Math.min(side.d, court.d);
  const top = north.length ? Math.max(...north.map((b) => b.d)) + BEHIND : 0;
  court.x = west ? west.w + BESIDE : 0;
  court.y = top;
  if (west) (west.x = 0), (west.y = top);
  if (east) (east.x = court.x + court.w + BESIDE), (east.y = top);
  // The back range, centred on the whole front.
  const front = [west, court, east].filter((b): b is Box => !!b);
  const wide = front[front.length - 1].x + front[front.length - 1].w;
  const span = north.reduce((n, b) => n + b.w, 0) + BESIDE * Math.max(0, north.length - 1);
  let x = Math.max(0, Math.floor((wide - span) / 2));
  for (const b of north) (b.x = x), (b.y = top - BEHIND - b.d), (x += b.w + BESIDE);
  const doorways: Link[] = [];
  if (west) doorways.push(beside(west, court));
  if (east) doorways.push(beside(court, east));
  for (const b of north) doorways.push(through(below(b, front), b));
  for (let n = 1; n < north.length; n++) doorways.push(beside(north[n - 1], north[n]));
  return { doorways, entry: court };
}

/** A one-room dwelling, entered from below. Tents, huts and a Çatalhöyük
 * house with its roof ladder keep their own way in. */
function single(profile: InteriorProfile, c: RoomChoice, room?: number): Building {
  const params = resolveRoom(profile, { ...c, room });
  if (params.door !== "none") params.entrance = Math.floor(params.w / 2);
  const props = planRoom(params).filter((q) => params.entrance === undefined || q.kind !== "door");
  props.forEach((q, i) => ((q.id = i), (q.room = 0)));
  const mask = roomMask(params);
  const cells = new Int16Array(params.w * params.d).map((_, i) => (mask[i] ? 0 : -1));
  let ey = params.d - 1;
  if (params.entrance !== undefined) while (ey > 0 && !mask[ey * params.w + params.entrance]) ey--;
  return {
    plan: { w: params.w, d: params.d, mask, cells, rooms: [params], entrance: [params.entrance ?? -1, ey], doorways: [] },
    props,
    rooms: [{ label: profile.label, role: "entry", x: 0, y: 0, w: params.w, d: params.d, private: false }],
    doorways: [],
  };
}
