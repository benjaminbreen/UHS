import type { Pack, Terrain, WorldModel } from "../../core/types";
import { CHUNK_SIZE } from "../../core/types";
import { random } from "../../core/random";
import { settlementProfile } from "../../content/settlements/profiles";
import { createLandscape } from "../v2/landscape";
import { noise } from "../v2/noise";
import { cellKey, type Road, type SettlementPlan, type Site } from "./types";
import { crossing, planRoad, roadCells } from "./roads";
import { planSettlement } from "./plan";
export const DISTRICT_SIZE = 384;
export type SettlementWorld = WorldModel & {
  planAt(x: number, y: number): SettlementPlan | undefined;
};
export function createSettlementWorld(
  pack: Pack,
  seed: string,
): SettlementWorld {
  const land = createLandscape(pack.setting!, seed),
    sites = new Map<string, Site | null>(),
    plans = new Map<string, SettlementPlan>(),
    links = new Map<string, Road[]>(),
    active = new Set<string>();
  const home = {
    x: Math.floor(land.origin.x / DISTRICT_SIZE),
    y: Math.floor(land.origin.y / DISTRICT_SIZE),
  };
  const coord = (x: number, y: number) => ({
    x: Math.floor((x + land.origin.x) / DISTRICT_SIZE),
    y: Math.floor((y + land.origin.y) / DISTRICT_SIZE),
  });
  function site(cx: number, cy: number): Site | undefined {
    const id = `s${cx}_${cy}`;
    if (sites.has(id)) return sites.get(id) ?? undefined;
    const isHome = cx === home.x && cy === home.y;
    if (!isHome && random(seed, "settlement-sites", cx, cy) > 0.62) {
      sites.set(id, null);
      return;
    }
    const center = isHome
      ? { x: 0, y: 0 }
      : {
          x: cx * 384 + 192 - land.origin.x,
          y: cy * 384 + 192 - land.origin.y,
        };
    for (let i = 0; i < 25; i++) {
      const angle = i * 2.4,
        radius = i ? 8 + Math.floor(i / 5) * 6 : 0;
      const p = {
        x: Math.round((center.x + Math.cos(angle) * radius) / 2) * 2,
        y: Math.round((center.y + Math.sin(angle) * radius) / 2) * 2,
      };
      const samples = [
        [-6, -6],
        [6, -6],
        [-6, 6],
        [6, 6],
        [0, 0],
      ].map(([x, y]) => land.sample(p.x + x, p.y + y));
      if (
        samples.some((f) => f.water < 5) ||
        Math.max(...samples.map((f) => f.elevation)) -
          Math.min(...samples.map((f) => f.elevation)) >
          28
      )
        continue;
      const s = {
        id,
        cx,
        cy,
        center: p,
        home: isHome,
        profile: settlementProfile(pack.setting!, isHome),
      };
      sites.set(id, s);
      return s;
    }
    sites.set(id, null);
    return;
  }
  function link(a: Site, b: Site): Road[] {
    if (a.id > b.id) [a, b] = [b, a];
    const id = `${a.id}:${b.id}`,
      old = links.get(id);
    if (old) return old;
    const center = {
      x: Math.round((a.center.x + b.center.x) / 2),
      y: Math.round((a.center.y + b.center.y) / 2),
    };
    const crossesWater = Array.from({ length: 33 }, (_, i) =>
      land.sample(
        Math.round(a.center.x + ((b.center.x - a.center.x) * i) / 32),
        Math.round(a.center.y + ((b.center.y - a.center.y) * i) / 32),
      ),
    ).some((f) => f.water < 4);
    const bridge = crossesWater
        ? crossing(`${id}-bridge`, center, land.sample, 90)
        : undefined,
      allowed = new Set<string>();
    if (bridge) roadCells(bridge, (x, y) => allowed.add(cellKey(x, y)));
    const bounds = {
      x: Math.min(a.center.x, b.center.x) - 60,
      y: Math.min(a.center.y, b.center.y) - 60,
      w: Math.abs(a.center.x - b.center.x) + 120,
      h: Math.abs(a.center.y - b.center.y) + 120,
    };
    const r = planRoad(
      `${id}-road`,
      a.center,
      b.center,
      land.sample,
      new Set(),
      allowed,
      new Set(),
      bounds,
      1,
      4,
    );
    const result = r ? [...(bridge ? [bridge] : []), r] : [];
    if (links.size > 128) links.clear();
    links.set(id, result);
    return result;
  }
  function getPlan(cx: number, cy: number): SettlementPlan | undefined {
    const s = site(cx, cy);
    if (!s) return;
    const old = plans.get(s.id);
    if (old) return old;
    const connections: Road[] = [];
    if (pack.setting!.settlement !== "camp")
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const neighbor = site(cx + dx, cy + dy);
        if (neighbor) connections.push(...link(s, neighbor));
      }
    const plan = planSettlement(s, pack, seed, land.sample, connections);
    plans.set(s.id, plan);
    if (plans.size > 48)
      for (const id of plans.keys())
        if (!active.has(id) && id !== s.id) {
          plans.delete(id);
          break;
        }
    return plan;
  }
  const neighborCache = new Map<string, SettlementPlan[]>();
  function nearby(x: number, y: number) {
    const bx = Math.floor(x / 64),
      by = Math.floor(y / 64),
      key = cellKey(bx, by),
      old = neighborCache.get(key);
    if (old) return old;
    const c = coord(x, y),
      result: SettlementPlan[] = [];
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const s = site(c.x + dx, c.y + dy);
        if (!s) continue;
        if (
          Math.abs(s.center.x - (bx * 64 + 32)) > s.profile.radius + 90 ||
          Math.abs(s.center.y - (by * 64 + 32)) > s.profile.radius + 90
        )
          continue;
        const p = getPlan(s.cx, s.cy);
        if (p) result.push(p);
      }
    if (neighborCache.size > 96) neighborCache.clear();
    neighborCache.set(key, result);
    return result;
  }
  const roadCache = new Map<string, Map<string, Terrain>>();
  function regionalRoads(x: number, y: number) {
    const c = coord(x, y),
      key = cellKey(c.x, c.y),
      old = roadCache.get(key);
    if (old) return old;
    const tiles = new Map<string, Terrain>();
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const a = site(c.x + dx, c.y + dy);
        if (!a) continue;
        for (const [ex, ey] of [
          [1, 0],
          [0, 1],
        ]) {
          const b = site(a.cx + ex, a.cy + ey);
          if (!b) continue;
          for (const r of link(a, b))
            roadCells(r, (px, py) => {
              if (coord(px, py).x === c.x && coord(px, py).y === c.y)
                tiles.set(
                  cellKey(px, py),
                  land.sample(px, py).water < 0 ? "bridge" : "dirt",
                );
            });
        }
      }
    if (roadCache.size >= 32) roadCache.clear();
    roadCache.set(key, tiles);
    return tiles;
  }
  function ground(x: number, y: number): Terrain {
    const f = land.sample(x, y);
    return f.water < 0
      ? "water"
      : f.snow
        ? "snow"
        : f.water < 4
          ? "sand"
          : f.moisture > 0.82 && f.water < 22
            ? "marsh"
            : f.elevation > 115
              ? "rock"
              : f.moisture < 0.3
                ? "dry"
                : "grass";
  }
  function terrain(x: number, y: number, space = "outside"): Terrain {
    if (space !== "outside") return "floor";
    const k = cellKey(x, y);
    let selected: Terrain | undefined;
    for (const p of nearby(x, y)) {
      const t = p.surface.get(k);
      if (t === "bridge") return t;
      if (t) selected = t;
      else if (
        p.site.profile.paved &&
        Math.hypot(x - p.site.center.x, y - p.site.center.y) <
          p.site.profile.radius * 0.52 &&
        land.sample(x, y).water >= 4
      )
        selected = "dirt";
    }
    return selected ?? regionalRoads(x, y).get(k) ?? ground(x, y);
  }
  function decoration(x: number, y: number) {
    const k = cellKey(x, y),
      f = land.sample(x, y);
    if (
      f.water < 4 ||
      nearby(x, y).some(
        (p) =>
          p.reserved.has(k) ||
          p.solid.has(k) ||
          p.enclosures.some(
            (pen) => Math.hypot(x - pen.gate.x, y - pen.gate.y) < 4,
          ) ||
          (p.site.profile.paved &&
            Math.hypot(x - p.site.center.x, y - p.site.center.y) <
              p.site.profile.radius * 0.65),
      ) ||
      regionalRoads(x, y).has(k)
    )
      return;
    const n = random(
        seed,
        "v3-decoration",
        x + land.origin.x,
        y + land.origin.y,
      ),
      cover = noise(seed, x + land.origin.x, y + land.origin.y, 45, "woods");
    const tree = x % 3 === 0 && y % 3 === 0 && n < f.moisture * cover * 0.38;
    const sprite = tree
      ? pack.trees[
          Math.floor(random(seed, "v3-tree", x, y) * pack.trees.length)
        ]
      : n < 0.006
        ? "rock"
        : n < 0.015
          ? "bush"
          : undefined;
    return sprite
      ? {
          id: `decor-${x}-${y}`,
          x,
          y,
          sprite,
          solid: tree || sprite === "rock",
        }
      : undefined;
  }
  const world: SettlementWorld = {
    generatorVersion: 3,
    pack,
    settlements: [],
    places: [],
    initialActors: [],
    initialObjects: [],
    enclosures: [],
    spawn: { x: 0, y: 0, space: "outside" },
    planAt: (x, y) => {
      const c = coord(x, y);
      return getPlan(c.x, c.y);
    },
    terrain,
    decoration,
    overview: (x, y) => {
      const p = coord(x, y),
        s = site(p.x, p.y);
      if (s && Math.hypot(x - s.center.x, y - s.center.y) < 5) return "paving";
      return ground(x, y);
    },
    regionExtent: 1600,
    elevation: (x, y) => land.sample(x, y).elevation,
    moisture: (x, y) => land.sample(x, y).moisture,
    riverX: () => Infinity,
    blocked: (x, y, space) =>
      space !== "outside"
        ? x < 1 || x > 11 || y < 1 || y > 9
        : Math.abs(x + land.origin.x) > 180 * 2048 ||
          Math.abs(y + land.origin.y) > 85 * 2048 ||
          terrain(x, y) === "water" ||
          nearby(x, y).some((p) => p.solid.has(cellKey(x, y))) ||
          !!decoration(x, y)?.solid,
    chunk: (cx, cy) =>
      Array.from({ length: CHUNK_SIZE * CHUNK_SIZE }, (_, i) =>
        terrain(
          cx * CHUNK_SIZE + (i % CHUNK_SIZE),
          cy * CHUNK_SIZE + Math.floor(i / CHUNK_SIZE),
        ),
      ),
    place: (id) => {
      const m = /^s(-?\d+)_(-?\d+)-h\d+$/.exec(id);
      return m
        ? getPlan(+m[1], +m[2])?.places.find((p) => p.id === id)
        : undefined;
    },
    activitySites: (id) => {
      if (id === "player") return getPlan(home.x, home.y)?.work.get(id);
      const m = /^s(-?\d+)_(-?\d+)-/.exec(id);
      return m ? getPlan(+m[1], +m[2])?.work.get(id) : undefined;
    },
    propSlots: (id) => {
      const m = /^s(-?\d+)_(-?\d+)-/.exec(id);
      return m ? getPlan(+m[1], +m[2])?.slots.get(id) : undefined;
    },
    protectedCell: (x, y) =>
      nearby(x, y).some(
        (p) =>
          p.traffic.has(cellKey(x, y)) &&
          !p.objects.some(
            (o) => o.pos.space === "outside" && o.pos.x === x && o.pos.y === y,
          ),
      ),
    navigationCost: (x, y, actorId) => {
      const t = terrain(x, y);
      if (nearby(x, y).some((p) => p.traffic.has(cellKey(x, y)))) return 1;
      if (t === "field") return 4;
      const privateYard = nearby(x, y).some((p) =>
        p.plots.some(
          (plot) =>
            plot.kind === "household" &&
            plot.owner !== actorId &&
            x >= plot.x &&
            x < plot.x + plot.w &&
            y >= plot.y &&
            y < plot.y + plot.h,
        ),
      );
      if (!privateYard && (t === "paving" || t === "dirt" || t === "bridge"))
        return 1;
      return (privateYard ? 2.8 : 1.8) + (t === "marsh" ? 2 : 0);
    },
    activate: (x, y) => {
      for (const p of nearby(x, y)) activate(p);
    },
    restoreDistricts: (ids) => {
      for (const id of ids) {
        const m = /^s(-?\d+)_(-?\d+)-/.exec(id);
        if (m) {
          const p = getPlan(+m[1], +m[2]);
          if (p) activate(p);
        }
      }
    },
  };
  function activate(p: SettlementPlan) {
    if (active.has(p.site.id)) return;
    active.add(p.site.id);
    world.settlements.push({
      id: p.site.id,
      name: p.site.home ? pack.name : `${p.site.profile.pattern} settlement`,
      ...p.site.center,
      size: p.site.profile.radius,
    });
    world.places.push(...p.places);
    world.initialObjects.push(...p.objects);
    world.initialActors.push(...p.actors);
    world.enclosures.push(...p.enclosures);
  }
  const initial = getPlan(home.x, home.y);
  if (!initial) throw Error("No usable settlement site near this location.");
  world.spawn = { ...initial.spawn, space: "outside" };
  world.activate!(world.spawn.x, world.spawn.y);
  return world;
}
