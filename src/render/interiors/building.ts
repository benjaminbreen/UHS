import { setOutRows } from "../../world/room-rows";
import { resolveRoom, type RoomChoice } from "../../content/interiors/resolve";
import type { InteriorProfile, RoomRole, RoomTemplate } from "../../content/interiors/types";
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
/** `stairs` counts the rows of a flight from its head; `side` is a neck between neighbours, not a way through a back wall. */
export type Doorway = { cells: [number, number][]; from: number; to: number; private: boolean; stairs?: number; side?: boolean };
export type Building = { plan: RoomPlan; props: Prop[]; rooms: PlacedRoom[]; doorways: Doorway[] };

/** A wall seen face-on is three tiles tall and capped: that many rows lie
 * between a room and the one behind it. Rooms round a court share a side
 * wall a column thick; other neighbours stand `GAP` columns apart, joined by
 * a short neck, and a floor stands `RISE` rows clear of the one below it. */
const BEHIND = 4;
const BESIDE = 1;
const GAP = 3;
const RISE = 7;
const BACK: RoomRole[] = ["sleep", "store", "sanctum"];

/** Which of a profile's rooms a household has: the humble make do with the
 * first living room and somewhere to sleep, the comfortable add the rest. */
function roomsFor(profile: InteriorProfile, status: RoomChoice["status"], storeys = 1) {
  const all = (profile.rooms ?? []).map((t, i) => ({ t, i, role: t.role ?? (i === 0 ? "entry" : "hall") })).filter((r) => r.role !== "lobby");
  if (all.length < 2 || profile.uses) return all;
  // Nobody sleeps in the court.
  const sleeps = (r: (typeof all)[number]) => (r.t.sleep ?? profile.sleep) !== "none" && r.t.shapes?.[0] !== "courtyard";
  const keep = [all[0]];
  const bed = all.find((r) => r !== all[0] && sleeps(r));
  if (!sleeps(all[0]) && bed) keep.push(bed);
  const rest = all.filter((r) => !keep.includes(r));
  keep.push(...rest.slice(0, [1, 2, rest.length][status]));
  // A house with an upper floor has its chamber up there, whatever its means.
  if (storeys > 1) keep.push(...all.filter((r) => r.role === "sleep" && !keep.includes(r)));
  return all.filter((r) => keep.includes(r));
}

/** The rooms of a household laid out on one grid, entered from below: round
 * a court where the house opens on one, else in rows. */
export function planBuilding(profile: InteriorProfile, c: RoomChoice): Building {
  const chosen = roomsFor(profile, c.status, c.storeys);
  if (chosen.length < 2) return single(profile, c, chosen[0]?.i);
  // A public room is sized for its trade, not its keeper's means; a house's rooms grow a little with the house outside.
  const k = profile.uses ? 1 : [1.05, 1.15, 1.25][c.status] * (c.plot ? Math.min(1.15, Math.max(1, Math.sqrt(c.plot / 40))) : 1);
  // A shop, like a public room, is the size its trade needs.
  const boxes: Box[] = chosen.map(({ t, i, role }) => ({
    i,
    role,
    label: t.label,
    shape: t.shapes?.[0] ?? "rect",
    w: Math.max(6, Math.round(t.size[0] * (t.program ? 1 : k))),
    d: Math.max(5, Math.round(t.size[1] * (t.program ? 1 : k))),
    x: 0,
    y: 0,
  }));
  const court = boxes[0].shape === "courtyard" && boxes[0].w >= 9 && boxes[0].d >= 8 ? boxes[0] : undefined;
  const axial = profile.observance && boxes.length === 2 && boxes[1].role === "sanctum";
  // A building of two storeys or more sleeps upstairs: as many chambers as its size outside allows, three floors drawn at most.
  const floors = court || axial || profile.observance || profile.institutionPlan === "corridor" || profile.institutionPlan === "court" ? 1 : Math.min(3, c.storeys ?? 1);
  const up = floors > 1 ? boxes.filter((b) => b.role === "sleep") : [];
  // How many chambers each upper floor has. A household: two, three in a large house, and a garret on a third floor. An inn fills each floor.
  const each = Math.min(4, Math.max(2, Math.round((c.plot ?? 40) / 20)));
  const levels = !up.length ? [] : profile.uses ? Array<number>(floors - 1).fill(each) : [(c.plot ?? 0) >= 90 ? 3 : 2, ...(floors > 2 ? [1] : [])];
  if (up.length) {
    const want = levels.reduce((a, n) => a + n, 0);
    for (let n = up.length; n < want; n++) up.push({ ...up[n % up.length], label: up[0].label.replace(/ ?\d+$/, "") + " " + (n + 1) });
    up.length = want;
    for (const [n, b] of up.entries()) {
      b.w = Math.min(b.w, 9);
      b.d = Math.min(b.d, 7);
      // The household's own bed, then a room of single beds for the children, then the garret under the roof.
      if (!profile.uses) b.kind = n === 0 ? undefined : floors > 2 && n === want - 1 ? "garret" : "shared";
      if (b.kind) b.label = b.kind === "garret" ? "Garret" : "Second chamber";
    }
  }
  const ground = boxes.filter((b) => !up.includes(b));
  // A passage is for a house of some size and means: four rooms or more in its profile, and not the poorest.
  const hallway = !profile.institutionPlan && !court && !axial && ground.length >= 3 && (profile.rooms?.length ?? 0) >= 4 && c.status > 0 && profile.seating === "chair" && !ground.some((b) => profile.rooms?.[b.i].program) && c.seed % 3 !== 0;
  const laid: { doorways: Link[]; entry: Box; more?: Box[] } = axial ? (() => {
    const [front, rear] = boxes;
    front.x = Math.max(0, (rear.w-front.w) >> 1);
    rear.x = Math.max(0, (front.w-rear.w) >> 1);
    front.y = rear.d + BEHIND;
    return {entry:front,doorways:[through(front,rear)]};
  })() : ground.length === 1 ? { entry: ground[0], doorways: [] }
    : profile.institutionPlan === "corridor" ? corridorPlan(ground, c.seed) : profile.institutionPlan ? institutionRanges(ground, c.seed, profile.institutionPlan === "court")
    : court ? aroundCourt(ground, court, !!profile.observance) : hallway ? alongPassage(ground, c.seed) : inRows(ground, up.length > 0);
  const { doorways, entry } = laid;
  boxes.length = 0;
  boxes.push(...ground, ...(laid.more ?? []));
  if (up.length) {
    const above = upstairs(boxes, up, levels, c.seed);
    doorways.push(...above.doorways);
    boxes.push(...above.boxes);
  }
  const left = Math.min(...boxes.map((b) => b.x)), high = Math.min(...boxes.map((b) => b.y));
  for (const b of boxes) (b.x -= left), (b.y -= high);
  for (const dw of doorways) for (const cell of dw.cells) (cell[0] -= left), (cell[1] -= high);
  const w = Math.max(...boxes.map((b) => b.x + b.w)), d = Math.max(...boxes.map((b) => b.y + b.d));
  const entrance = entry.x + Math.floor(entry.w / 2);
  // The household's trade is worked in one room, not at a bench in each: its workroom, else the front room.
  const works = boxes.find((b) => b.role === "work") ?? boxes.find((b) => b.role === "entry" && !b.t) ?? boxes[0];
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
    // Each room planned from its own seed, so two chambers of one template are not furnished alike; the house keeps one colourway.
    const params = resolveRoom(b.t ? { ...profile, rooms: [b.t] } : profile, { ...c, trade: b === works ? c.trade : undefined, seed: c.seed + ri * 101, colorway: c.colorway >= 0 ? c.colorway : c.seed % 9973, room: b.t ? 0 : b.i, w: b.w, d: b.d, shape });
    if (b.storey) params.storey = b.storey;
    if (b.kind === "shared") (params.beds = 2), (params.styles = { ...params.styles, bed: "single" });
    if (b.kind === "garret") (params.styles = { ...params.styles, bed: "single" }), (params.furnish = ["crate", "sacks", "chest", "basket"]), (params.finish = 0), (params.windows = 1);
    // Where the house has a room to sleep in, the others keep no beds unless their own template says so.
    if ((boxes.some((o) => o.role === "sleep") && b.role !== "sleep" && (b.t ?? profile.rooms?.[b.i])?.sleep === undefined) || b === court) params.sleep = "none";
    params.openings = openings;
    params.ports = ports;
    params.role = b.role;
    // The household eats in its kitchen or hall where it has one.
    params.dines = b.role === "kitchen" || b.role === "hall" || (b.role === "entry" && !boxes.some((o) => o.role === "kitchen" || o.role === "hall"));
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
  const ways = doorways.map((dw) => ({ cells: dw.cells, from: boxes.indexOf(dw.a), to: boxes.indexOf(dw.b), private: dw.b.role === "sleep" || dw.a.role === "sleep", stairs: dw.stairs, side: dw.side }));
  return {
    plan: { w, d, mask, cells, rooms, entrance: [entrance, entry.y + entry.d - 1], doorways: ways },
    props,
    rooms: boxes.map((b) => ({ label: b.label, role: b.role, x: b.x, y: b.y, w: b.w, d: b.d, private: b.role === "sleep" })),
    doorways: ways,
  };
}

/** `t` is the template of a room the plan adds itself: a passage, a landing. */
type Box = { i: number; t?: RoomTemplate; role: RoomRole; label: string; shape: Shape; w: number; d: number; x: number; y: number; storey?: number; kind?: "shared" | "garret" };
type Link = { a: Box; b: Box; cells: [number, number][]; stairs?: number; side?: boolean };
const PASSAGE: RoomTemplate = { id: "passage", label: "Passage", role: "hall", size: [4, 6], sleep: "none", fire: "none", windows: 0, program: "corridor", furnish: ["pegs", "frame"], clutter: [] };
const LANDING: RoomTemplate = { id: "landing", label: "Landing", role: "hall", size: [6, 3], sleep: "none", fire: "none", windows: 1, program: "corridor", furnish: ["frame", "chest"], clutter: [] };

/** A passage from the street door to the back of the house, the rooms opening
 * off it to either side: those kept for company by the door, the kitchen and
 * stores at the far end. */
function alongPassage(rooms: Box[], seed: number) {
  const rank: Partial<Record<RoomRole, number>> = { entry: 0, hall: 1, work: 2, kitchen: 3, store: 4 };
  const order = [...rooms].sort((a, b) => (rank[a.role] ?? 2) - (rank[b.role] ?? 2));
  const sides = [order.filter((_, n) => n % 2 === (seed >> 2) % 2), order.filter((_, n) => n % 2 !== (seed >> 2) % 2)];
  const tall = (list: Box[]) => list.reduce((n, b) => n + b.d + BEHIND, -BEHIND);
  const hall: Box = { i: -1, t: PASSAGE, role: "hall", label: PASSAGE.label, shape: "rect", w: 4, d: Math.max(6, ...sides.map(tall)), x: Math.max(0, ...sides[0].map((b) => b.w)) + GAP, y: 0 };
  const doorways: Link[] = [];
  sides.forEach((list, east) => {
    let foot = hall.d;
    for (const b of list) {
      b.y = foot - b.d;
      b.x = east ? hall.x + hall.w + GAP : hall.x - GAP - b.w;
      foot = b.y - BEHIND;
      doorways.push(east ? beside(hall, b) : beside(b, hall));
    }
  });
  // The passage ends two paces past its last door, not at the back of the deepest room.
  const head = Math.max(0, Math.min(...doorways.flatMap((dw) => dw.cells.map((cell) => cell[1]))) - 2);
  hall.y = head;
  hall.d -= head;
  return { entry: hall, doorways, more: [hall] };
}

/** The floors above, each standing clear of the one below and joined to it
 * by a flight in its own neck. A floor of one or two chambers is a landing
 * with a chamber to either side; a floor of more is a gallery with its
 * chambers in a row behind it, parted in the middle where the next flight
 * goes up between them. */
function upstairs(ground: Box[], up: Box[], levels: number[], seed: number) {
  const top = Math.min(...ground.map((b) => b.y));
  const tops = ground.filter((b) => b.y === top && b.shape === "rect");
  let below = ground.find((b) => b.t === PASSAGE) ?? tops.find((b) => b.role === "hall" || b.role === "entry") ?? tops[seed % tops.length] ?? ground[0];
  // The flight leaves by the back wall: from the head of a passage, else clear of the room's corners.
  let px = below.t === PASSAGE ? below.x + 1 : below.x + 2 + ((seed >> 3) % Math.max(1, below.w - 5));
  let roof = top, taken = 0;
  const boxes: Box[] = [], doorways: Link[] = [];
  for (const [n, count] of levels.entries()) {
    const f = n + 1, rooms = up.slice(taken, taken + count), more = n + 1 < levels.length, foot = roof - RISE;
    taken += count;
    const landing: Box = { i: -1, t: LANDING, role: "hall", label: LANDING.label, shape: "rect", w: 6, d: 5, x: px - 2, y: foot - 5, storey: f };
    let next = landing.x + 2;
    if (rooms.length <= 2) {
      rooms.forEach((b, east) => {
        b.x = east ? landing.x + landing.w + GAP : landing.x - GAP - b.w;
        b.y = foot - b.d;
        doorways.push(east ? beside(landing, b) : beside(b, landing));
      });
    } else {
      // A slot four columns wide between the middle chambers leaves the next flight its way up.
      const half = Math.ceil(rooms.length / 2), slot = more ? 4 : GAP;
      const wide = rooms.reduce((a, b) => a + b.w + GAP, -GAP) - GAP + slot;
      const before = rooms.slice(0, half).reduce((a, b) => a + b.w + GAP, -GAP);
      landing.d = 4;
      landing.y = foot - 4;
      landing.w = Math.max(wide, 8);
      landing.x = more ? px - before - 1 : px + 1 - (landing.w >> 1);
      let x = landing.x;
      rooms.forEach((b, k) => {
        b.x = x;
        b.y = landing.y - BEHIND - b.d;
        x += b.w + (k === half - 1 ? slot : GAP);
        doorways.push(through(landing, b));
      });
      next = landing.x + before + 1;
    }
    for (const b of rooms) b.storey = f;
    const head = Math.min(landing.y, ...rooms.map((b) => b.y));
    // Up from the room below: along a passage between the chambers where it has them behind it, then the flight.
    const cells: [number, number][] = [];
    for (let y = foot; y < below.y; y++) cells.push([px, y], [px + 1, y]);
    doorways.push({ a: below, b: landing, cells, stairs: RISE });
    boxes.push(landing, ...rooms);
    below = landing;
    px = next;
    roof = head;
  }
  return { boxes, doorways };
}
/** A doorway up through the wall between a room and the one behind it. */
function through(under: Box, b: Box): Link {
  const lo = Math.max(b.x, under.x) + 1, hi = Math.min(b.x + b.w, under.x + under.w) - 3;
  const px = hi >= lo ? Math.floor((lo + hi) / 2) : under.x + 1;
  return { a: under, b, cells: Array.from({ length: BEHIND }, (_, j) => [[px, b.y + b.d + j], [px + 1, b.y + b.d + j]] as [number, number][]).flat() };
}
/** A doorway through the side wall between neighbours, near the foot of the shorter. */
function beside(a: Box, b: Box): Link {
  const y = Math.max(a.y, b.y) + Math.min(a.y + a.d, b.y + b.d) - Math.max(a.y, b.y) - 2;
  return { a, b, side: true, cells: Array.from({ length: b.x - a.x - a.w }, (_, g) => [[a.x + a.w + g, y - 1], [a.x + a.w + g, y]] as [number, number][]).flat() };
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
  if (!court) entry.w = wings.reduce((n, b) => n + b.w + GAP, -GAP);
  for (const b of front) b.d = entry.d;
  const rows = [front, wings].map(row => ({
    deep: Math.max(...row.map(b => b.d)) + BEHIND,
    slots: row.map(b => ({ b, wide: b.w + GAP, deep: b.d + BEHIND, hold: "s" as const })),
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
    const hallW = midNorth.reduce((n, b) => n + b.w + GAP, -GAP);
    hall.x = 0; hall.y = hallY; hall.w = Math.max(hallW, entry.w + 6); hall.d = 4;
    let mx = 0;
    for (const b of midNorth) {
      b.x = mx; b.y = hallY - BEHIND - b.d; mx += b.w + GAP;
      doorways.push(through(hall, b));
    }
    // Upper wing sits above the landing: right suite opens through the landing, left suite opens beside it or through the landing.
    landing.w = Math.max(landing.w, upper[0].w);
    upper[1].x = landing.x;
    upper[1].y = landing.y - BEHIND - upper[1].d;
    upper[0].x = Math.max(0, upper[1].x - upper[0].w - GAP);
    upper[0].y = landing.y - BEHIND - upper[0].d;
    doorways.push(through(landing, upper[1]));
    doorways.push(beside(upper[0], upper[1]));
    const southRow = [entry, ...southSide];
    const southY = hallY + hall.d + BEHIND;
    let sx = 0;
    for (const b of southRow) {
      b.x = sx; b.y = southY; b.d = entry.d; sx += b.w + GAP;
      doorways.push(through(b, hall));
    }
    hall.w = Math.max(hall.w, sx - GAP);
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
    const hallX = westW ? westW + GAP : 0;
    const hallY = cap.d + BEHIND;
    hall.x = hallX; hall.y = hallY; hall.w = spineW; hall.d = spineH;
    cap.x = hallX + Math.floor((spineW - cap.w) / 2);
    if (cap.x < 0) cap.x = 0;
    cap.y = 0;
    doorways.push(through(hall, cap));
    let wy = hallY;
    for (const b of west) {
      b.x = hallX - GAP - b.w; b.y = wy; wy += b.d + BEHIND;
      doorways.push(beside(b, hall));
    }
    let ey = hallY;
    for (const b of east) {
      b.x = hallX + spineW + GAP; b.y = ey; ey += b.d + BEHIND;
      doorways.push(beside(hall, b));
    }
    const totalW = Math.max(
      hallX + spineW + (east.length ? GAP + Math.max(...east.map((b) => b.w)) : 0),
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
  const northW = north.reduce((n, b) => n + b.w + GAP, -GAP);
  const frontW = front.reduce((n, b) => n + b.w + GAP, -GAP);
  const totalW = Math.max(northW, frontW);
  const northD = Math.max(...north.map((b) => b.d));
  const hallY = northD + BEHIND;
  hall.x = 0; hall.y = hallY; hall.w = totalW; hall.d = 4;
  let nx = Math.floor((totalW - northW) / 2);
  for (const b of north) {
    b.x = nx; b.y = hallY - BEHIND - b.d; nx += b.w + GAP;
    doorways.push(through(hall, b));
  }
  const southY = hallY + hall.d + BEHIND;
  let fx = Math.floor((totalW - frontW) / 2);
  for (const b of front) {
    b.x = fx; b.y = southY; b.d = entry.d; fx += b.w + GAP;
    doorways.push(through(b, hall));
  }
  return { entry, doorways };
}

/** Public rooms in a row along the front, top-aligned so the back wall runs
 * level; sleeping rooms and stores behind, stores behind the kitchen. */
function inRows(boxes: Box[], flat = false) {
  const front = boxes.filter((b) => flat || !BACK.includes(b.role));
  const back = boxes.filter((b) => !flat && BACK.includes(b.role));
  if (!front.length) front.push(back.shift()!);
  let x = 0;
  for (const b of front) (b.x = x), (x += b.w + GAP);
  const rowTop = back.length ? Math.max(...back.map((b) => b.d)) + BEHIND : 0;
  for (const b of front) b.y = rowTop;
  const parent = (b: Box) => (b.role === "store" && front.find((f) => f.role === "kitchen")) || front[0];
  back.sort((a, b) => parent(a).x - parent(b).x);
  const doorways: Link[] = [];
  let bx = 0;
  for (const b of back) {
    b.x = Math.max(bx, parent(b).x);
    b.y = rowTop - BEHIND - b.d;
    bx = b.x + b.w + GAP;
    doorways.push(through(below(b, front), b));
  }
  for (const row of [front, back])
    for (let n = 1; n < row.length; n++) if (row[n].x === row[n - 1].x + row[n - 1].w + GAP) doorways.push(beside(row[n - 1], row[n]));
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
