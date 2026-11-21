import { setOutRows } from "../../world/room-rows";
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
const BACK: RoomRole[] = ["sleep", "store", "sanctum"];

/** Which of a profile's rooms a household has: the humble make do with the
 * first living room and somewhere to sleep, the comfortable add the rest. */
function roomsFor(profile: InteriorProfile, status: RoomChoice["status"]) {
  const all = (profile.rooms ?? []).map((t, i) => ({ t, i, role: t.role ?? (i === 0 ? "entry" : "hall") })).filter((r) => r.role !== "lobby");
  if (all.length < 2 || profile.uses) return all;
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
  // A public room is sized for its trade, not its keeper's means.
  const k = profile.uses ? 1 : [0.8, 0.9, 1][c.status];
  // A shop, like a public room, is the size its trade needs.
  const boxes: Box[] = chosen.map(({ t, i, role }) => ({
    i,
    role,
    label: t.label,
    shape: t.shapes?.[0] ?? "rect",
    w: Math.max(5, Math.round(t.size[0] * (t.program ? 1 : k))),
    d: Math.max(4, Math.round(t.size[1] * (t.program ? 1 : k))),
    x: 0,
    y: 0,
  }));
  const court = boxes[0].shape === "courtyard" && boxes[0].w >= 9 && boxes[0].d >= 8 ? boxes[0] : undefined;
  const axial = profile.observance && boxes.length === 2 && boxes[1].role === "sanctum";
  const { doorways, entry } = axial ? (() => {
    const [front, rear] = boxes;
    front.x = Math.max(0, (rear.w-front.w) >> 1);
    rear.x = Math.max(0, (front.w-rear.w) >> 1);
    front.y = rear.d + BEHIND;
    return {entry:front,doorways:[through(front,rear)]};
  })() : profile.institutionPlan === "corridor" ? corridorPlan(boxes, c.seed) : profile.institutionPlan ? institutionRanges(boxes, c.seed, profile.institutionPlan === "court") : court ? aroundCourt(boxes, court, !!profile.observance) : inRows(boxes);
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

function institutionRanges(boxes: Box[], seed: number, court: boolean) {
  const [entry, ...wings] = boxes;
  if (seed % 2) wings.reverse();
  for (const wing of wings) wing.d += (seed >>> (wing.i % 8)) % 3;
  const front = court ? [wings.shift()!, entry, wings.pop()!] : [entry];
  if (!court) entry.w = wings.reduce((n, b) => n + b.w + BESIDE, -BESIDE);
  for (const b of front) b.d = entry.d;
  const rows = [front, wings].map(row => ({
    deep: Math.max(...row.map(b => b.d)) + BEHIND,
    slots: row.map(b => ({ b, wide: b.w + BESIDE, deep: b.d + BEHIND, hold: "s" as const })),
  }));
  setOutRows(rows, 0, ({ b }, x, y) => { b.x = x; b.y = y; });
  const left = Math.min(...boxes.map(b => b.x));
  for (const b of boxes) b.x -= left;
  const doorways = wings.map(b => through(below(b, front), b));
  for (let i = 1; i < front.length; i++) doorways.push(beside(front[i-1], front[i]));
  return { entry, doorways };
}

/** Procedural grand inn / hotel floorplan: a lobby opening into a long hallway
 * (double-loaded, L-shaped, or twin-gallery by seed) with individual private rooms off it. */
function corridorPlan(boxes: Box[], seed: number) {
  const [entry, hall, ...rest] = boxes;
  // Seeded shuffle of private rooms so room types & sizes vary each building.
  const rooms = [...rest];
  let s = (seed * 2654435761) >>> 0;
  const next = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  for (let i = rooms.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [rooms[i], rooms[j]] = [rooms[j], rooms[i]];
  }
  const variant = Math.abs(seed) % 3;
  const doorways: Link[] = [];

  if (variant === 1 && rooms.length >= 5) {
    // L-shaped winged corridor: south lobby + lower hall running east, with a parlour/landing
    // connecting cleanly up to a quiet upper suite wing (no walking through another bedroom).
    const landingIdx = rooms.findIndex((b) => b.role === "hall");
    const landing = landingIdx >= 0 ? rooms.splice(landingIdx, 1)[0] : rooms.pop()!;
    const upper = rooms.slice(0, 2);
    const midNorth = [...rooms.slice(2, 4), landing];
    const southSide = rooms.slice(4);
    const topD = Math.max(...upper.map((b) => b.d));
    const midD = Math.max(...midNorth.map((b) => b.d));
    const hallY = topD + BEHIND + midD + BEHIND;
    const hallW = midNorth.reduce((n, b) => n + b.w + BESIDE, -BESIDE);
    hall.x = 0; hall.y = hallY; hall.w = Math.max(hallW, entry.w + 6); hall.d = 4;
    let mx = 0;
    for (const b of midNorth) {
      b.x = mx; b.y = hallY - BEHIND - b.d; mx += b.w + BESIDE;
      doorways.push(through(hall, b));
    }
    // Upper wing sits above the landing: right suite opens through the landing, left suite opens beside it or through the landing.
    landing.w = Math.max(landing.w, upper[0].w);
    upper[1].x = landing.x;
    upper[1].y = landing.y - BEHIND - upper[1].d;
    upper[0].x = Math.max(0, upper[1].x - upper[0].w - BESIDE);
    upper[0].y = landing.y - BEHIND - upper[0].d;
    doorways.push(through(landing, upper[1]));
    doorways.push(beside(upper[0], upper[1]));
    const southRow = [entry, ...southSide];
    const southY = hallY + hall.d + BEHIND;
    let sx = 0;
    for (const b of southRow) {
      b.x = sx; b.y = southY; b.d = entry.d; sx += b.w + BESIDE;
      doorways.push(through(b, hall));
    }
    hall.w = Math.max(hall.w, sx - BESIDE);
    return { entry, doorways };
  }

  if (variant === 2 && rooms.length >= 5) {
    // Vertical-spine T-plan corridor: Lobby south -> tall North-South central hallway with private rooms
    // stacked along both West and East sides (opening via `beside`), plus an end suite at the north cap.
    const cap = rooms[0];
    const sideRooms = rooms.slice(1);
    const west = sideRooms.filter((_, i) => i % 2 === 0);
    const east = sideRooms.filter((_, i) => i % 2 === 1);
    const stackH = (list: Box[]) => list.reduce((n, b) => n + b.d + BEHIND, -BEHIND);
    const spineH = Math.max(stackH(west), stackH(east), 10);
    const westW = west.length ? Math.max(...west.map((b) => b.w)) : 0;
    const spineW = 4;
    const hallX = westW ? westW + BESIDE : 0;
    const hallY = cap.d + BEHIND;
    hall.x = hallX; hall.y = hallY; hall.w = spineW; hall.d = spineH;
    cap.x = hallX + Math.floor((spineW - cap.w) / 2);
    if (cap.x < 0) cap.x = 0;
    cap.y = 0;
    doorways.push(through(hall, cap));
    let wy = hallY;
    for (const b of west) {
      b.x = hallX - BESIDE - b.w; b.y = wy; wy += b.d + BEHIND;
      doorways.push(beside(b, hall));
    }
    let ey = hallY;
    for (const b of east) {
      b.x = hallX + spineW + BESIDE; b.y = ey; ey += b.d + BEHIND;
      doorways.push(beside(hall, b));
    }
    const totalW = Math.max(
      hallX + spineW + (east.length ? BESIDE + Math.max(...east.map((b) => b.w)) : 0),
      cap.x + cap.w,
      entry.w,
    );
    entry.x = Math.max(0, Math.min(totalW - entry.w, hallX + Math.floor((spineW - entry.w) / 2)));
    entry.y = hallY + spineH + BEHIND;
    doorways.push(through(entry, hall));
    return { entry, doorways };
  }

  // Variant 0 (default): Classic double-loaded hotel corridor — Lobby centered south, flanked by guest rooms,
  // opening north into a long corridor with a full row of individual guest rooms along the north wall.
  const northCount = Math.max(3, Math.ceil(rooms.length * 0.6));
  const north = rooms.slice(0, northCount);
  const south = rooms.slice(northCount);
  const left = south.slice(0, Math.floor(south.length / 2));
  const right = south.slice(left.length);
  const front = [...left, entry, ...right];
  const northW = north.reduce((n, b) => n + b.w + BESIDE, -BESIDE);
  const frontW = front.reduce((n, b) => n + b.w + BESIDE, -BESIDE);
  const totalW = Math.max(northW, frontW);
  const northD = Math.max(...north.map((b) => b.d));
  const hallY = northD + BEHIND;
  hall.x = 0; hall.y = hallY; hall.w = totalW; hall.d = 4;
  let nx = Math.floor((totalW - northW) / 2);
  for (const b of north) {
    b.x = nx; b.y = hallY - BEHIND - b.d; nx += b.w + BESIDE;
    doorways.push(through(hall, b));
  }
  const southY = hallY + hall.d + BEHIND;
  let fx = Math.floor((totalW - frontW) / 2);
  for (const b of front) {
    b.x = fx; b.y = southY; b.d = entry.d; fx += b.w + BESIDE;
    doorways.push(through(b, hall));
  }
  return { entry, doorways };
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
function aroundCourt(boxes: Box[], court: Box, sacred: boolean) {
  const others = boxes.filter((b) => b !== court);
  const west = others.find((b) => b.role === "sleep");
  const east = others.find((b) => b !== west && (b.role === "sleep" || b.role === "kitchen" || b.role === "store" || sacred && b.role === "work"));
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
  if (params.door !== "none" && params.door !== "lift") params.entrance = Math.floor(params.w / 2);
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
