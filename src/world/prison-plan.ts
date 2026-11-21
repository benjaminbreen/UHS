import { rngOf } from "../core/random";

export const WALL = 0, FLOOR = 1, BARS = 2, YARD = 3;

export type PrisonLayout = "keep" | "wards" | "yamen" | "cellblock";
export type RoomKind = "gate" | "guard" | "gallery" | "cell" | "yard" | "ward" | "hole" | "store" | "stairs" | "passage";
/** 0 north, 1 east, 2 south, 3 west. On a feature it names the wall the thing hangs on. */
export type Side = 0 | 1 | 2 | 3;
type Rect = { x: number; y: number; w: number; h: number };
export type PlanRoom = Rect & { kind: RoomKind };
export type PlanFeature = { type: string; x: number; y: number; side?: Side };
export type PrisonPlan = { layout: PrisonLayout; w: number; h: number; cells: Uint8Array; rooms: PlanRoom[]; features: PlanFeature[] };

// Walls are drawn two tiles deep on each face, so any two floors sit at least this far apart.
const GAP = 4;
const SIZE = 220, MID = 110, RESERVED = -1;

type Part = Rect & { fill: number; kind: RoomKind };
type Spec = {
  kind: RoomKind;
  w: number;
  h: number;
  fill?: number;
  /** Which sides a passage may leave by. */
  sides?: boolean[];
  /** Rooms a passage to this one may start from. */
  from?: RoomKind[];
  leaf?: boolean;
  parts?: Part[];
  feats?: PlanFeature[];
};

const room = (kind: RoomKind, w: number, h: number, more: Partial<Spec> = {}): Spec => ({ kind, w, h, ...more });

/** A gallery with barred cells off its north side, and its south side too when `both`. */
function cellBlock(n: number, cw: number, ch: number, both: boolean, bed: string): Spec {
  const parts: Part[] = [], feats: PlanFeature[] = [];
  for (let i = 0; i < n; i++) {
    const x = GAP + i * (cw + GAP);
    for (const south of both ? [false, true] : [false]) {
      const bars = south ? 3 : -1, top = south ? 4 : -1 - ch, back = south ? top + ch - 1 : top;
      parts.push({ x, y: top, w: cw, h: ch, fill: FLOOR, kind: "cell" }, { x, y: bars, w: cw, h: 1, fill: BARS, kind: "cell" });
      feats.push(
        { type: "cell-door", x: x + (cw >> 1), y: bars },
        { type: bed, x, y: back },
        { type: "bucket", x: x + cw - 1, y: cw > 2 ? back : back + (south ? -1 : 1) },
        { type: "shackle", x: x - 1, y: back + (south ? -1 : 1), side: 3 },
      );
      if (!south) feats.push({ type: "window", x: x + (cw >> 1), y: top - 1, side: 0 });
    }
  }
  return { kind: "gallery", w: 2 * GAP + n * cw + (n - 1) * GAP, h: 3, sides: [false, true, !both, true], parts, feats };
}

function specs(layout: PrisonLayout, rng: () => number): { list: Spec[]; dogleg: number } {
  const n = (a: number, b: number) => a + Math.floor(rng() * (b - a + 1));
  const gate = room("gate", n(9, 11), n(6, 7), { sides: [true, true, false, true] });
  const hole = room("hole", 3, 3, { leaf: true, from: ["gallery", "guard", "passage"] });
  const stairs = room("stairs", 5, 4, { leaf: true, sides: [false, true, true, true] });
  if (layout === "keep")
    return {
      dogleg: 0.6,
      list: [
        gate, room("guard", n(8, 10), n(6, 7)), cellBlock(n(2, 3), 3, 3, false, "pallet"), hole,
        room("store", n(5, 7), 5, { leaf: true }), cellBlock(2, 4, 3, false, "pallet"), stairs,
      ],
    };
  if (layout === "wards") {
    const yard = room("yard", n(12, 14), n(9, 10), { fill: YARD, from: ["gate"] });
    const ward = () => room("ward", n(8, 10), 6, { from: ["yard"], leaf: true });
    return {
      dogleg: 0.25,
      list: [gate, yard, cellBlock(2, 3, 3, false, "pallet"), ward(), ward(), room("store", 6, 5, { from: ["yard", "gate"], leaf: true }), ward(), hole],
    };
  }
  if (layout === "yamen") {
    const yard = room("yard", n(12, 14), n(9, 10), { fill: YARD, from: ["gate"] });
    return {
      dogleg: 0.1,
      list: [
        gate, yard, cellBlock(3, 3, 2, false, "mat"), cellBlock(n(2, 3), 3, 2, false, "mat"),
        room("guard", 9, 6, { from: ["yard"] }), hole, room("store", 6, 5, { leaf: true }),
      ],
    };
  }
  return {
    dogleg: 0.15,
    list: [
      gate, room("guard", 8, 6), cellBlock(n(4, 5), 2, 3, true, "cot"), room("yard", n(12, 14), 9, { fill: YARD }),
      cellBlock(n(3, 4), 2, 3, true, "cot"), hole, hole, room("store", 6, 5, { leaf: true }),
    ],
  };
}

// A quarter turn that carries north to east; `k` turns carry north to side `k`.
const turn = (r: Rect, k: number): Rect => {
  for (let i = 0; i < (k & 3); i++) r = { x: -r.y - r.h, y: r.x, w: r.h, h: r.w };
  return r;
};
const gap = (a: Rect, b: Rect) =>
  Math.max(Math.max(0, b.x - a.x - a.w, a.x - b.x - b.w), Math.max(0, b.y - a.y - a.h, a.y - b.y - b.h));

/** One whole prison on one map: rooms and cell blocks joined by straight and dog-leg passages. */
export function prisonPlan(seed: string, layout: PrisonLayout): PrisonPlan {
  const rng = rngOf(seed, "prison-plan", layout);
  const int = (a: number, b: number) => a + Math.floor(rng() * (b - a + 1));
  const cells = new Uint8Array(SIZE * SIZE), owner = new Int16Array(SIZE * SIZE);
  const rooms: PlanRoom[] = [], features: PlanFeature[] = [];
  type Hub = Rect & { id: number; kind: RoomKind; sides: boolean[]; leaf: boolean };
  const hubs: Hub[] = [];
  let nextId = 1;

  const free = (r: Rect, ok: number) => {
    for (let y = r.y - GAP; y < r.y + r.h + GAP; y++)
      for (let x = r.x - GAP; x < r.x + r.w + GAP; x++) {
        const o = owner[(y + MID) * SIZE + x + MID];
        if (o && o !== ok) return false;
      }
    return true;
  };
  const stamp = (r: Rect, fill: number, id: number, kind: RoomKind) => {
    for (let y = r.y; y < r.y + r.h; y++)
      for (let x = r.x; x < r.x + r.w; x++) {
        cells[(y + MID) * SIZE + x + MID] = fill;
        owner[(y + MID) * SIZE + x + MID] = id;
      }
    rooms.push({ ...r, kind });
  };
  const settle = (spec: Spec, at: Rect, id: number) => {
    stamp(at, spec.fill ?? FLOOR, id, spec.kind);
    for (const p of spec.parts ?? []) stamp({ ...p, x: at.x + p.x, y: at.y + p.y }, p.fill, id, p.kind);
    for (const f of spec.feats ?? []) features.push({ ...f, x: at.x + f.x, y: at.y + f.y });
    hubs.push({ ...at, id, kind: spec.kind, sides: [...(spec.sides ?? [true, true, true, true])], leaf: !!spec.leaf });
  };

  const { list, dogleg } = specs(layout, rng);
  settle(list[0], { x: 0, y: 0, w: list[0].w, h: list[0].h }, nextId++);
  // Nothing is built below the gatehouse, so its south door is the foot of the map.
  for (let y = list[0].h + GAP; y < SIZE - MID; y++)
    owner.fill(RESERVED, (y + MID) * SIZE + MID - GAP, (y + MID) * SIZE + MID + list[0].w + GAP);
  features.push({ type: "door", x: (list[0].w >> 1) - 1, y: list[0].h, side: 2 });

  const box = { x0: 0, y0: 0, x1: list[0].w, y1: list[0].h };
  for (const spec of list.slice(1)) {
    // Of the first few places it fits, take the one that keeps the whole plan most nearly square.
    let pick: { score: number; a: Hub; k: Side; enters: number; hub: Rect; run: Rect[] } | undefined;
    for (let tries = 0, found = 0; tries < 3000 && found < 40; tries++) {
      const from = hubs.filter((h) => !h.leaf && (!spec.from || tries > 200 || spec.from.includes(h.kind)));
      const a = from[Math.floor(rng() * from.length)];
      const k = int(0, 3) as Side;
      if (!a?.sides[k]) continue;
      const bend = rng() < dogleg ? (rng() < 0.5 ? 1 : -1) : 0;
      // Lay it out as if the passage left by the north wall, then turn the answer round.
      const A = turn(a, 4 - k), b = turn({ x: 0, y: 0, w: spec.w, h: spec.h }, 4 - k);
      const cx = A.x + int(0, A.w - 2);
      const enters = ((bend ? (bend > 0 ? 3 : 1) : 2) + k) & 3;
      if (spec.sides && !spec.sides[enters]) continue;
      let segs: Rect[], B: Rect;
      if (!bend) {
        const len = int(GAP, GAP + 4);
        segs = [{ x: cx, y: A.y - len, w: 2, h: len }];
        B = { x: cx - int(0, b.w - 2), y: A.y - len - b.h, w: b.w, h: b.h };
      } else {
        const up = int(GAP + 2, GAP + 6), across = int(GAP, GAP + 4), y = A.y - up;
        segs = [{ x: cx, y, w: 2, h: up }, bend > 0 ? { x: cx + 2, y, w: across, h: 2 } : { x: cx - across, y, w: across, h: 2 }];
        B = { x: bend > 0 ? cx + 2 + across : cx - across - b.w, y: y - int(0, b.h - 2), w: b.w, h: b.h };
      }
      const hub = turn(B, k), run = segs.map((s) => turn(s, k));
      const parts = [hub, ...(spec.parts ?? []).map((p) => ({ x: hub.x + p.x, y: hub.y + p.y, w: p.w, h: p.h }))];
      if (!parts.every((p) => free(p, 0)) || !free(run[0], a.id) || (run[1] && !free(run[1], 0))) continue;
      const last = run[run.length - 1];
      if (parts.some((p, i) => run.some((s) => gap(p, s) < GAP && !(i === 0 && s === last)))) continue;
      const all = [...parts, ...run];
      const wide = Math.max(box.x1, ...all.map((p) => p.x + p.w)) - Math.min(box.x0, ...all.map((p) => p.x));
      const tall = Math.max(box.y1, ...all.map((p) => p.y + p.h)) - Math.min(box.y0, ...all.map((p) => p.y));
      const score = Math.max(wide, tall * 1.35) + rng() * 6;
      found++;
      if (!pick || score < pick.score) pick = { score, a, k, enters, hub, run };
    }
    if (!pick) continue;
    const { a, k, enters, hub, run } = pick, id = nextId++;
    for (const s of run) stamp(s, FLOOR, 1000 + id, "passage");
    settle(spec, hub, id);
    a.sides[k] = a.kind === "gallery" || a.kind === "yard";
    hubs[hubs.length - 1].sides[enters] = false;
    if (spec.kind === "stairs") features.push({ type: "stairs", x: hub.x + (hub.w >> 1) - 1, y: hub.y - 1, side: 0 });
    for (const r of rooms) {
      box.x0 = Math.min(box.x0, r.x); box.y0 = Math.min(box.y0, r.y);
      box.x1 = Math.max(box.x1, r.x + r.w); box.y1 = Math.max(box.y1, r.y + r.h);
    }
  }

  let x0 = SIZE, y0 = SIZE, x1 = 0, y1 = 0;
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++)
      if (cells[y * SIZE + x]) {
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      }
  x0 -= 4; y0 -= 4; x1 += 4; y1 += 3;
  const w = x1 - x0 + 1, h = y1 - y0 + 1, out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) out.set(cells.subarray((y + y0) * SIZE + x0, (y + y0) * SIZE + x0 + w), y * w);
  const dx = MID - x0, dy = MID - y0;
  for (const r of rooms) { r.x += dx; r.y += dy; }
  for (const f of features) { f.x += dx; f.y += dy; }
  const plan: PrisonPlan = { layout, w, h, cells: out, rooms, features };
  furnish(plan, rng);
  return plan;
}

/** Lamps along the walls and the movables of each room, kept clear of passage mouths. */
function furnish(plan: PrisonPlan, rng: () => number) {
  const { w, cells, rooms, features } = plan;
  const at = (x: number, y: number) => cells[y * w + x];
  const passages = rooms.filter((r) => r.kind === "passage");
  const clear = (x: number, y: number, wide = 1) =>
    !passages.some((p) => gap(p, { x, y, w: wide, h: 1 }) < 2) && !features.some((f) => f.y === y && f.x >= x - 1 && f.x <= x + wide);
  const put = (type: string, x: number, y: number, wide = 1) => {
    if (at(x, y) !== WALL && at(x + wide - 1, y) !== WALL && clear(x, y, wide)) features.push({ type, x, y });
  };
  const hang = (type: string, x: number, y: number, side: Side) => {
    const solid = side === 0 ? [-1, 0, 1, 2].every((i) => at(x + i, y) === WALL && at(x + i, y + 1) !== WALL) : at(x, y) === WALL && at(x, y - 1) === WALL;
    if (solid && !features.some((f) => f.side === side && Math.abs(f.x - x) < 3 && Math.abs(f.y - y) < 3)) features.push({ type, x, y, side });
  };
  for (const r of rooms) {
    const { x, y, kind } = r, right = x + r.w - 1, foot = y + r.h - 1;
    if (kind === "cell") continue;
    if (kind !== "yard" && kind !== "hole") {
      if (r.w >= r.h) {
        const n = Math.max(1, Math.round(r.w / 7));
        for (let i = 0; i < n; i++) {
          const lx = x + Math.floor(((i + 0.5) * r.w) / n);
          if (at(lx, y - 1) === WALL && at(lx - 1, y - 1) === WALL && at(lx + 1, y - 1) === WALL) hang("lamp", lx, y - 1, 0);
        }
      } else {
        for (let ly = y + 2; ly < foot; ly += 6) if (at(x - 1, ly) === WALL && at(x - 1, ly - 1) === WALL) hang("lamp", x - 1, ly, 3);
      }
    }
    if (kind === "gate") {
      put("desk", x + 1, y + 1, 2);
      put("stool", x + 1, y + 2);
      hang("keys", right - 1, y - 1, 0);
      put("barrel", right, foot);
    } else if (kind === "guard") {
      put("table", x + (r.w >> 1) - 1, y + (r.h >> 1), 2);
      put("stool", x + (r.w >> 1) - 2, y + (r.h >> 1));
      put("stool", x + (r.w >> 1) + 1, y + (r.h >> 1));
      hang("rack", x + 1, y - 1, 0);
      put("barrel", right, y);
      put("jar", x, foot);
    } else if (kind === "store") {
      put("barrel", x, y);
      put("barrel", x + 1, y);
      put("crate", right, y);
      put("jar", right, foot);
      put("jar", right - 1, foot);
      put("crate", x, foot);
    } else if (kind === "hole") {
      put("straw", x + 1, y + 1);
      hang("shackle", x - 1, y + 1, 3);
    } else if (kind === "ward") {
      for (let bx = x; bx + 1 <= right; bx += 3) put("pallet", bx, y, 2);
      for (let bx = x + 1; bx + 1 <= right; bx += 4) put("pallet", bx, foot, 2);
      put("brazier", x + (r.w >> 1), y + (r.h >> 1));
    } else if (kind === "yard") {
      put(plan.layout === "yamen" ? "cangue" : "well", x + (r.w >> 1) - 1 + Math.floor(rng() * 2), y + (r.h >> 1) - 1, 2);
      put(plan.layout === "cellblock" ? "bench" : "stocks", x + 2, foot - 1, 2);
      put("barrel", right, y);
    } else if (kind === "gallery" && r.w > 12) {
      put("drain", x + 1, y + 1);
    }
  }
}
