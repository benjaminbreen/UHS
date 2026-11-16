import { shipCrew, type BelowDeck, type Hull, type ShipKind } from "../content/ships";
import type { SewerPerson } from "../content/sewers";
import { rngOf } from "../core/random";
import type { Point } from "../core/types";
import type { AreaFolk } from "./complex";

export const SEA = 0, DECK = 1, RAIL = 2;

/** Cells of sea around the hull: wake astern, bowsprit ahead, masts and sails above. */
export const MARGIN = { stern: 12, bow: 10, top: 17, bottom: 9 } as const;

export type ShipThing = {
  id: string;
  art: string;
  /** Top-left cell; the thing covers w × h cells. */
  x: number;
  y: number;
  w: number;
  h: number;
  solid: boolean;
  /** The way to another deck, or something to use. */
  verb?: string;
  to?: number;
  v: number;
};
export type ShipLight = { x: number; y: number; kind: "lantern" | "furnace" | "hatch" | "window" | "bulb" };
export type ShipLevel = {
  space: string;
  deck: number;
  /** What this deck is: the weather deck, or what lies below it. */
  use: "weather" | BelowDeck;
  hull: Hull;
  w: number;
  h: number;
  cells: Uint8Array;
  /** The first deck cell's column and the north rail's row. */
  x0: number;
  y0: number;
  things: ShipThing[];
  lights: ShipLight[];
  folk: AreaFolk[];
  entry: Point;
  name: string;
};

export const shipSpace = (deck: number) => `ship:voyage:${deck}`;
export const parseShipSpace = (space: string) => {
  const m = /^ship:voyage:(\d+)$/.exec(space);
  return m ? Number(m[1]) : undefined;
};

/** Half the beam at a point along the hull, as a share of the full half-beam:
 * 0 is the stern, 1 the stem. */
export function halfWidth(kind: ShipKind, u: number) {
  const ease = (t: number) => Math.sin(Math.max(0, Math.min(1, t)) * Math.PI / 2);
  switch (kind) {
    case "square-rigger":
      return u < 0.14 ? 0.8 + 0.2 * ease(u / 0.14) : u < 0.58 ? 1 : Math.sqrt(Math.max(0, 1 - ((u - 0.58) / 0.42) ** 2.3));
    case "junk":
      // A flat transom at both ends, the bow narrower.
      return u < 0.12 ? 0.7 + 0.3 * ease(u / 0.12) : u < 0.66 ? 1 : 1 - 0.48 * ((u - 0.66) / 0.34) ** 1.5;
    case "dhow":
      return u < 0.1 ? 0.74 + 0.26 * ease(u / 0.1) : u < 0.42 ? 1 : Math.max(0, 1 - ((u - 0.42) / 0.58) ** 1.6);
    case "steamer":
      return u < 0.07 ? 0.55 + 0.45 * ease(u / 0.07) : u < 0.8 ? 1 : Math.max(0, 1 - ((u - 0.8) / 0.2) ** 1.25);
    // A blunt cone: the heat shield astern, the nose forward.
    case "capsule":
      return u < 0.12 ? 0.86 + 0.14 * ease(u / 0.12) : 1 - 0.5 * ((u - 0.12) / 0.88) ** 1.4;
    case "submarine":
    case "aircraft":
      return Math.sin(Math.PI * Math.max(0.02, Math.min(0.98, u))) ** 0.3;
    case "basket":
      return 1;
    case "nowhere":
      return Math.sqrt(Math.max(0, 1 - (2 * u - 1) ** 2)) ** 0.7;
  }
}

/** The ship's plan at one deck: her outline, what stands on it, and who is there. */
export function shipLevel(seed: string, hull: Hull, deck: number, place: { lon: number; lat: number; year: number }): ShipLevel {
  const L = hull.length, B = hull.beam;
  const x0 = MARGIN.stern, y0 = MARGIN.top;
  const w = L + MARGIN.stern + MARGIN.bow, h = B + MARGIN.top + MARGIN.bottom;
  const cells = new Uint8Array(w * h);
  const yc = y0 + B / 2;
  const inside = (x: number, y: number) => {
    const u = (x + 0.5 - x0) / L;
    return u > 0 && u < 1 && Math.abs(y + 0.5 - yc) < halfWidth(hull.kind, u) * (B / 2);
  };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (inside(x, y)) cells[y * w + x] = DECK;
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++)
    if (cells[y * w + x] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !cells[(y + dy) * w + x + dx])) cells[y * w + x] = RAIL;

  const use = deck === 0 ? "weather" : hull.below[deck - 1];
  const rng = rngOf(seed, "ship", hull.id, deck);
  const things: ShipThing[] = [];
  const lights: ShipLight[] = [];
  const col = (u: number) => x0 + Math.round(u * (L - 1));
  const taken = new Set<number>();
  const free = (x: number, y: number) => cells[y * w + x] === DECK && !taken.has(y * w + x);
  const put = (art: string, u: number, row: number, cw = 1, ch = 1, solid = true, more: Partial<ShipThing> = {}) => {
    const x = col(u), y = y0 + row;
    for (let dy = 0; dy < ch; dy++) for (let dx = 0; dx < cw; dx++) if (!free(x + dx, y + dy)) return undefined;
    const t: ShipThing = { id: `${art}-${things.length}`, art, x, y, w: cw, h: ch, solid, v: rng(), ...more };
    for (let dy = 0; dy < ch; dy++) for (let dx = 0; dx < cw; dx++) taken.add((y + dy) * w + x + dx);
    things.push(t);
    return t;
  };
  const mid = Math.floor(B / 2) - 1;
  const top = 1, bottom = B - 2;
  const down = (u: number, row: number, to: number, art = "hatch", cw = 2, ch = 2) =>
    put(art, u, row, cw, ch, false, { verb: to > deck ? "Go below" : "Go up on deck", to });

  if (use === "weather") {
    hull.masts.forEach((u, i) => put(`mast-${i}`, u, mid + (hull.kind === "junk" && i === 0 ? -2 : 0)));
    switch (hull.kind) {
      case "square-rigger": {
        const galleon = hull.id === "galleon";
        put(galleon ? "whipstaff" : "wheel", 0.1, mid, 1, 2);
        put("binnacle", 0.15, mid);
        put("skylight", 0.04, mid, 2, 2);
        lights.push({ x: col(0.15), y: y0 + mid, kind: "lantern" });
        for (let r = 1; r < B - 1; r++) if (r !== mid - 1 && r !== mid + 2) put("breast-rail", hull.poop, r, 1, 1, true);
        for (let r = 1; r < B - 1; r++) if (r !== mid && r !== mid + 1) put("breast-rail", 1 - hull.forecastle - 0.02, r, 1, 1, true);
        put("capstan", 0.41, mid);
        down(0.56, mid, 1);
        put("grating", 0.66, mid, 2, 2, false);
        put("pump", 0.52, mid + 2);
        put("scuttlebutt", 0.46, bottom - 1);
        if (hull.id === "emigrant-ship") {
          put("galley-house", 0.62, top + 1, 4, 2);
          put("washing", 0.34, top + 1, 4, 1, false);
          put("trunks", 0.3, bottom, 2, 1);
        } else {
          put("boat", 0.6, top, 5, 2);
          put("coop", 0.32, bottom, 2, 1);
          put("coop", 0.32, top, 2, 1);
          put("stove", 0.74, bottom - 1, 2, 1);
          for (const u of [0.24, 0.36, 0.68]) for (const r of [top, bottom]) put("gun", u, r, 1, 1);
        }
        put("belfry", 1 - hull.forecastle + 0.02, mid);
        put("windlass", 0.88, mid, 2, 1);
        lights.push({ x: x0, y: y0 + mid, kind: "lantern" });
        if (galleon) lights.push({ x: x0, y: y0 + mid - 2, kind: "lantern" }, { x: x0, y: y0 + mid + 2, kind: "lantern" });
        break;
      }
      case "junk": {
        put("junk-house", 0.06, top + 1, Math.round(L * 0.15), B - 4);
        put("tiller", 0.02, mid, 1, 2);
        put("shrine", 0.26, bottom - 1);
        lights.push({ x: col(0.26), y: y0 + bottom - 1, kind: "lantern" });
        down(0.38, mid, 1);
        for (const u of [0.58, 0.66]) {
          put("crates", u, top, 2, 2);
          put("crates", u, bottom - 1, 2, 2);
        }
        put("jars", 0.33, bottom, 2, 1);
        put("jars", 0.33, top, 2, 1);
        put("hearth", 0.74, bottom - 1, 2, 1);
        put("windlass", 0.9, mid, 2, 1);
        put("mats", 0.46, top + 1, 2, 1, false);
        lights.push({ x: col(0.02), y: y0 + mid, kind: "lantern" });
        break;
      }
      case "dhow": {
        put("tiller", 0.03, mid, 1, 2);
        put("carpet", 0.09, mid - 1, 3, 3, false);
        put("water-tank", 0.18, bottom, 2, 1);
        down(0.38, mid, 1);
        put("sacks", 0.42, top, 3, 2);
        put("sacks", 0.6, bottom - 1, 2, 2);
        put("sand-hearth", 0.72, mid + 1, 2, 1);
        put("prayer-mats", 0.28, top, 3, 1, false);
        put("ropes", 0.46, bottom, 1, 1, false);
        lights.push({ x: col(0.03), y: y0 + mid, kind: "lantern" });
        break;
      }
      case "capsule":
        put("console", 0.6, top, 2, 1);
        put("couch", 0.25, mid, 2, 1, false);
        put("couch", 0.25, mid + 1, 2, 1, false);
        put("locker", 0.08, top);
        put("locker", 0.08, bottom);
        lights.push({ x: col(0.4), y: y0 + mid, kind: "bulb" });
        break;
      case "submarine":
        put("diesel", 0.08, top, 3, 1);
        put("diesel", 0.08, bottom, 3, 1);
        for (const u of [0.24, 0.31]) put("bunk", u, top, 2, 1);
        put("mess", 0.25, bottom, 3, 1);
        put("sub-wheel", 0.44, top);
        put("periscope", 0.5, mid);
        put("chart", 0.55, bottom, 2, 1);
        put("valves", 0.6, top, 2, 1);
        for (const u of [0.7, 0.77]) put("bunk", u, bottom, 2, 1);
        put("torpedo", 0.86, top, 3, 1);
        put("torpedo", 0.86, bottom, 3, 1);
        for (const u of [0.15, 0.4, 0.65, 0.9]) lights.push({ x: col(u), y: y0 + mid, kind: "bulb" });
        break;
      case "aircraft":
        put("console", 0.88, top, 2, 1);
        put("console", 0.88, bottom, 2, 1);
        for (let u = 0.3; u < 0.8; u += 2 / L) for (const r of [top, bottom]) put("seat", u, r, 1, 1, false);
        put("crates", 0.1, top, 2, 1);
        put("locker", 0.1, bottom);
        for (const u of [0.3, 0.6, 0.85]) lights.push({ x: col(u), y: y0 + mid, kind: "bulb" });
        break;
      case "basket":
        put("sandbags", 0, top);
        put("instruments", 0.75, top);
        break;
      case "nowhere":
        put("stone", 0.22, top + 1);
        put("stone", 0.7, bottom - 1);
        break;
      case "steamer": {
        put("hand-wheel", 0.04, mid);
        down(0.24, mid, 1, "hatch", 3, 2);
        put("house", 0.33, top + 1, Math.round(L * 0.3), B - 4);
        put("vent", 0.18, top);
        put("vent", 0.18, bottom);
        down(0.27, bottom, 2, "engine-door", 1, 1);
        down(0.7, mid, 1, "hatch", 3, 2);
        put("vent", 0.66, top);
        put("vent", 0.66, bottom);
        put("windlass", 0.92, mid, 2, 1);
        put("bollard", 0.12, top);
        put("bollard", 0.12, bottom);
        put("trunks", 0.82, bottom, 2, 1);
        lights.push({ x: x0, y: y0 + mid, kind: "lantern" }, { x: col(0.62), y: y0 + top + 1, kind: "window" });
        break;
      }
    }
  } else {
    const up = hull.kind === "steamer" && use === "stokehold" ? put("ladder", 0.27, bottom, 1, 1, false, { verb: "Climb up on deck", to: 0 })
      : put("ladder", hull.kind === "steamer" ? 0.7 : hull.kind === "junk" || hull.kind === "dhow" ? 0.38 : 0.56, mid, 1, 1, false, { verb: deck === 1 ? "Climb up on deck" : "Climb up", to: deck - 1 });
    if (deck < hull.below.length && !(hull.kind === "steamer")) put("ladder-down", 0.66, mid, 1, 1, false, { verb: "Climb down", to: deck + 1 });
    for (const u of hull.masts) put("mast-foot", u, mid);
    const spread = (art: string, rows: number[], from: number, to: number, step: number, cw = 1, ch = 1) => {
      for (let u = from; u <= to; u += step / L) for (const r of rows) put(art, u, r, cw, ch);
    };
    switch (use) {
      case "gundeck":
        spread("gun-below", [top, bottom], 0.22, 0.86, 3);
        spread("hammock", [top + 1, bottom - 1], 0.24, 0.8, 3, 2, 1);
        spread("mess-table", [mid - 1, mid + 2], 0.3, 0.78, 6, 2, 1);
        for (let r = 1; r < B - 1; r++) if (r !== mid && r !== mid + 1) put("bulkhead", 0.17, r);
        put("chest", 0.06, top + 1);
        put("chest", 0.06, bottom - 1);
        break;
      case "steerage":
        spread("berth", [top], 0.12, 0.88, 3, 2, 1);
        spread("berth", [bottom], 0.12, 0.88, 3, 2, 1);
        spread("table", [mid], 0.25, 0.75, 7, 4, 2);
        spread("trunks", [top + 1, bottom - 1], 0.2, 0.8, 9, 2, 1);
        break;
      case "hold":
        spread("cask", [top, bottom], 0.1, 0.9, 2);
        spread(hull.kind === "dhow" ? "sacks" : "bales", [top + 1, bottom - 1], 0.18, 0.84, 5, 2, 1);
        spread("cask", [mid - 1, mid + 2], 0.2, 0.3, 3);
        put("bilge", 0.45, mid + 2, 3, 1, false);
        break;
      case "compartments":
        for (const u of [0.22, 0.38, 0.54, 0.7, 0.84]) for (let r = 1; r < B - 1; r++) if (r !== mid && r !== mid + 1) put("bulkhead", u, r);
        spread("porcelain", [top, bottom], 0.24, 0.36, 3, 2, 1);
        spread("crates", [top, bottom], 0.4, 0.52, 3, 2, 1);
        spread("sleeping-mats", [top + 1, bottom - 2], 0.56, 0.68, 4, 2, 1);
        spread("jars", [top, bottom], 0.72, 0.82, 3, 2, 1);
        break;
      case "stokehold":
        for (const u of [0.36, 0.5, 0.64]) put("boiler", u, top, 4, 3);
        put("engine", 0.14, top + 1, 6, 4);
        spread("coal", [bottom], 0.36, 0.72, 2, 2, 1);
        break;
    }
    for (let u = 0.1; u < 0.95; u += 7 / L) lights.push({ x: col(u), y: y0 + mid, kind: use === "stokehold" && place.year >= 1890 ? "bulb" : "lantern" });
    if (use === "stokehold") for (const u of [0.36, 0.5, 0.64]) lights.push({ x: col(u) + 1, y: y0 + top + 3, kind: "furnace" }, { x: col(u) + 2, y: y0 + top + 3, kind: "furnace" });
    if (up) lights.push({ x: up.x, y: up.y, kind: "hatch" });
  }

  // Crew and passengers, each where their work keeps them.
  // Stokers keep to the stokehold, and nobody else goes there; the hold is for cargo and whoever minds it.
  const crew = shipCrew(hull, place).filter((p) => p.depths?.includes(deck === 0 ? "deck" : "below") &&
    (use === "stokehold" ? p.post === "furnace" : p.post !== "furnace" && (use !== "hold" || p.post === "cargo" || p.post === "waist")));
  const folk: AreaFolk[] = [];
  const near = (t: ShipThing | undefined) => t && [...Array(t.w + 2).keys()].flatMap((i) => [{ x: t.x - 1 + i, y: t.y + t.h }, { x: t.x - 1 + i, y: t.y - 1 }]).concat([{ x: t.x - 1, y: t.y }, { x: t.x + t.w, y: t.y }]);
  const thing = (re: RegExp) => things.filter((t) => re.test(t.art));
  const open: Point[] = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (free(x, y)) open.push({ x, y });
  const spot = (who: SewerPerson): Point | undefined => {
    const posts: Record<string, () => Point[]> = {
      helm: () => thing(/wheel|whipstaff|tiller|binnacle/).flatMap((t) => near(t) ?? []),
      galley: () => thing(/stove|hearth|galley/).flatMap((t) => near(t) ?? []),
      shrine: () => thing(/shrine/).flatMap((t) => near(t) ?? []),
      furnace: () => thing(/boiler/).map((t) => ({ x: t.x + 1 + Math.floor(rng() * 2), y: t.y + t.h })),
      cargo: () => thing(/crates|sacks|bales|porcelain|cask/).flatMap((t) => near(t) ?? []),
      berth: () => thing(/berth|sleeping|hammock|table|trunks/).flatMap((t) => near(t) ?? []),
      rail: () => open.filter((p) => p.y === y0 + top || p.y === y0 + bottom),
      bow: () => open.filter((p) => p.x > col(0.78)),
      waist: () => open.filter((p) => p.x > col(0.3) && p.x < col(0.75)),
    };
    const choices = (posts[who.post ?? "waist"]?.() ?? []).filter((p) => free(p.x, p.y) && !folk.some((f) => f.x === p.x && f.y === p.y));
    const pool = choices.length ? choices : open.filter((p) => free(p.x, p.y) && !folk.some((f) => f.x === p.x && f.y === p.y));
    return pool[Math.floor(rng() * pool.length)];
  };
  const want = deck === 0 ? Math.round(L / 4) : use === "stokehold" ? 6 : use === "steerage" || use === "compartments" ? Math.round(L / 3.5) : Math.round(L / 7);
  const total = crew.reduce((n, p) => n + p.weight, 0);
  const placed = new Map<string, number>();
  for (let g = 0; folk.length < want && g < want * 3 && total > 0; g++) {
    let roll = rng() * total;
    const who = crew.find((p) => (roll -= p.weight) < 0) ?? crew[0];
    // One helmsman, one cook, one captain.
    if (who.party[0] === 1 && placed.get(who.id)) continue;
    const r = rng(), n = r < who.party[0] ? 1 : r < who.party[0] + who.party[1] ? 2 : 3;
    for (let k = 0; k < n; k++) {
      const p = spot(who);
      if (!p) break;
      const [lo, hi] = who.ages ?? [16, 60];
      folk.push({ id: `folk-ship-${deck}-${g}-${k}`, person: who.id, x: p.x, y: p.y, sex: rng() < who.women ? "female" : "male", age: lo + Math.floor(rng() * (hi - lo + 1)) });
      placed.set(who.id, (placed.get(who.id) ?? 0) + 1);
    }
  }

  const entry = (() => {
    const by = thing(/^(hatch|ladder)$/)[0];
    const around = by ? near(by)!.filter((p) => free(p.x, p.y) && !folk.some((f) => f.x === p.x && f.y === p.y)) : [];
    return around[0] ?? open.find((p) => free(p.x, p.y))!;
  })();
  const sealed = { capsule: "the capsule", submarine: "the boat", aircraft: "the cabin", basket: "the basket", nowhere: "nowhere" }[hull.kind as string];
  const name = sealed ?? (use === "weather" ? "the weather deck" : { gundeck: "the gun deck", steerage: "steerage", hold: "the hold", compartments: "the hold", stokehold: "the stokehold" }[use]);
  return { space: shipSpace(deck), deck, use, hull, w, h, cells, x0, y0, things, lights, folk, entry, name };
}

/** Cells nobody can stand in: the sea, the rail and whatever is built there. */
export function shipSolid(level: ShipLevel) {
  const solid = new Set<number>();
  for (const t of level.things) if (t.solid) for (let dy = 0; dy < t.h; dy++) for (let dx = 0; dx < t.w; dx++) solid.add((t.y + dy) * level.w + t.x + dx);
  return solid;
}
