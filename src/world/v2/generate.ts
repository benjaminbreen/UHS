import type {
  Actor,
  Decoration,
  Pack,
  Place,
  Settlement,
  Terrain,
  WorldModel,
  WorldObject,
} from "../../core/types";
import { CHUNK_SIZE } from "../../core/types";
import { random } from "../../core/random";
import { buildingModel } from "../../content/graphics/models";
import { createLandscape } from "./landscape";
import { noise, segmentDistance } from "./noise";
export const DISTRICT_SIZE = 384;
type District = {
  id: string;
  hub: { x: number; y: number };
  settlement?: Settlement;
  places: Place[];
  objects: WorldObject[];
  actors: Actor[];
};
export function createAtlasWorld(pack: Pack, seed: string): WorldModel {
  const s = pack.setting!;
  const land = createLandscape(s, seed),
    districts = new Map<string, District>(),
    active = new Set<string>();
  const settlements: Settlement[] = [],
    places: Place[] = [],
    objects: WorldObject[] = [],
    actors: Actor[] = [];
  const rand = (...k: (string | number)[]) => random(seed, "atlas-v2", ...k);
  const homeDistrict = {
    x: Math.floor(land.origin.x / DISTRICT_SIZE),
    y: Math.floor(land.origin.y / DISTRICT_SIZE),
  };
  function ground(x: number, y: number): Terrain {
    const f = land.sample(x, y);
    if (f.water < 0) return "water";
    if (f.snow) return "snow";
    if (f.water < 4) return "sand";
    if (f.moisture > 0.82 && f.water < 22) return "marsh";
    if (f.elevation > 115) return "rock";
    return f.moisture < 0.3 ? "dry" : "grass";
  }
  function cell(x: number, y: number) {
    return {
      x: Math.floor((x + land.origin.x) / DISTRICT_SIZE),
      y: Math.floor((y + land.origin.y) / DISTRICT_SIZE),
    };
  }
  function hub(cx: number, cy: number) {
    const base = {
      x: cx * DISTRICT_SIZE + DISTRICT_SIZE / 2 - land.origin.x,
      y: cy * DISTRICT_SIZE + DISTRICT_SIZE / 2 - land.origin.y,
    };
    if (cx === homeDistrict.x && cy === homeDistrict.y) return { x: 0, y: 0 };
    return {
      x: Math.round(base.x + (rand(cx, cy, "x") - 0.5) * 60),
      y: Math.round(base.y + (rand(cx, cy, "y") - 0.5) * 60),
    };
  }
  function district(cx: number, cy: number): District {
    const id = `d${cx}_${cy}`;
    const old = districts.get(id);
    if (old) return old;
    const h = hub(cx, cy),
      home = cx === homeDistrict.x && cy === homeDistrict.y;
    const d: District = { id, hub: h, places: [], objects: [], actors: [] };
    districts.set(id, d);
    const f = land.sample(h.x, h.y);
    if (
      !home &&
      (f.water < 30 ||
        f.elevation > 110 ||
        rand(cx, cy, "settle") > (s.settlement === "camp" ? 0.22 : 0.62))
    )
      return d;
    d.settlement = {
      id,
      name: home
        ? s.location
        : `${["Upper", "Lower", "Riverside", "Hill", "Woodland"][Math.floor(rand(id, "name") * 5)]} ${s.settlement === "camp" ? "camp" : "settlement"}`,
      x: h.x,
      y: h.y,
      size: 40,
    };
    const count = home
      ? s.settlement === "city" || s.settlement === "port"
        ? 18
        : s.settlement === "camp"
          ? 4
          : 8
      : 4;
    for (let i = 0; i < count; i++) {
      const model = buildingModel(
        pack.buildings[
          Math.floor(rand(id, i, "model") * pack.buildings.length)
        ],
      );
      const [w, height] = model.footprint;
      let x = 0,
        y = 0,
        valid = false;
      for (let attempt = 0; attempt < 30; attempt++) {
        const compact = s.settlement === "camp" || s.settlement === "farm";
        const col = i % 5,
          row = Math.floor(i / 5);
        x = compact
          ? h.x +
            Math.round(Math.cos(i * 2.4) * (10 + i * 2)) +
            Math.floor(rand(id, i, attempt, "px") * 5)
          : h.x - 30 + col * 15 + Math.floor(rand(id, i, attempt, "px") * 3);
        y = compact
          ? h.y + Math.round(Math.sin(i * 2.4) * (10 + i * 2)) - 10
          : h.y - 26 + row * 18;
        if (attempt) y += Math.floor((rand(id, i, attempt, "py") - 0.5) * 90);
        if (y < h.y + 3 && y + height > h.y - 3) continue;
        const samples = [
          [x, y],
          [x + w, y],
          [x, y + height + 4],
          [x + w, y + height + 4],
        ];
        if (samples.some(([a, b]) => land.sample(a, b).water < 7)) continue;
        if (
          d.places.some(
            (p) =>
              x < p.x + p.w + 5 &&
              x + w + 5 > p.x &&
              y < p.y + p.h + 5 &&
              y + height + 5 > p.y,
          )
        )
          continue;
        valid = true;
        break;
      }
      if (!valid) continue;
      const pid = `${id}-h${i}`,
        owner = `${pid}-person`,
        pos = {
          x: x + model.entrance[0],
          y: y + model.entrance[1] + 1,
          space: "outside",
        };
      d.places.push({
        id: pid,
        name: pack.buildingNames[i % pack.buildingNames.length],
        description: model.description,
        x,
        y,
        w,
        h: height,
        sprite: model.frame,
        entrance: { x: pos.x, y: pos.y - 1 },
        owner,
        access: i % 3 === 0 ? "public" : "household",
        claim: "landscape",
        entranceLabel: "Enter",
      });
      d.actors.push({
        id: owner,
        name: pack.names[i % pack.names.length],
        kind: "human",
        role: pack.roles[i % pack.roles.length],
        pos: { ...pos },
        home: { ...pos },
        work: { x: h.x + (i % 3), y: h.y + 3, space: "outside" },
        sprite: `human-${i % 3}-${i % 6}`,
        inventory: { [pack.trade.take]: 8, [pack.trade.give]: 6, water: 2 },
        activity: "Household work",
        fatigue: 0,
        hunger: 5,
        trust: i % 3 === 0 ? 2 : 1,
        memories: [],
        direction: 2,
      });
      d.objects.push(
        {
          id: `${pid}-store`,
          name: "Household stores",
          kind: "container",
          pos: { x: x + w + 1, y: y + height, space: "outside" },
          sprite: "basket",
          inventory: { grain: 4, wood: 2 },
          owner,
        },
        {
          id: `${pid}-exit`,
          name: "Door to the street",
          kind: "exit",
          pos: { x: 6, y: 9, space: pid },
          sprite: "door-open",
          inventory: {},
          owner,
        },
        {
          id: `${pid}-bed`,
          name: "Sleeping place",
          kind: "bed",
          pos: { x: 4, y: 3, space: pid },
          sprite: "bed",
          inventory: {},
          owner,
        },
        {
          id: `${pid}-chest`,
          name: "Household chest",
          kind: "container",
          pos: { x: 8, y: 3, space: pid },
          sprite: "basket",
          inventory: { grain: 4, wood: 2 },
          owner,
        },
      );
    }
    d.objects.push({
      id: `${id}-well`,
      name: "Water source",
      kind: "well",
      pos: { x: h.x, y: h.y + 3, space: "outside" },
      sprite: "well",
      inventory: {},
    });
    if (s.year >= -9999)
      for (let i = 0; i < 8; i++) {
        const x = h.x + 55 + (i % 4) * 3,
          y = h.y - 8 + Math.floor(i / 4) * 4;
        if (land.sample(x, y).water > 8)
          d.objects.push({
            id: `${id}-crop${i}`,
            name: "Grain patch",
            kind: "crop",
            pos: { x, y, space: "outside" },
            sprite: "wheat",
            inventory: { grain: 3 },
            claim: "landscape",
          });
      }
    for (let i = 0; i < 3; i++) {
      const x = h.x - 55 + i * 4,
        y = h.y + 20;
      if (land.sample(x, y).water > 8)
        d.objects.push({
          id: `${id}-wood${i}`,
          name: "Fallen wood",
          kind: "tree",
          pos: { x, y, space: "outside" },
          sprite: pack.trees[i % pack.trees.length],
          inventory: { wood: 2 },
          claim: "landscape",
        });
    }
    if (s.year >= -9999)
      for (let i = 0; i < 2; i++) {
        const pos = { x: h.x + i * 3, y: h.y + 12, space: "outside" };
        if (land.sample(pos.x, pos.y).water < 4) continue;
        d.actors.push({
          id: `${id}-animal${i}`,
          name: "Sheep",
          role: "Animal",
          kind: "sheep",
          pos: { ...pos },
          home: { ...pos },
          work: { ...pos },
          sprite: "sheep",
          inventory: {},
          activity: "Grazing",
          fatigue: 0,
          hunger: 0,
          trust: 0,
          memories: [],
          direction: 2,
        });
      }
    return d;
  }
  function nearby(x: number, y: number) {
    const c = cell(x, y),
      out: District[] = [];
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) out.push(district(c.x + dx, c.y + dy));
    return out;
  }
  function road(x: number, y: number, ds: District[]) {
    for (const d of ds) {
      if (!d.settlement) continue;
      if (s.settlement === "camp") {
        if (
          d.places.some(
            (p) =>
              segmentDistance(
                x,
                y,
                [p.entrance.x, p.entrance.y],
                [d.hub.x, d.hub.y + 4],
              ) < 0.65,
          )
        )
          return true;
        continue;
      }
      const reach =
        s.settlement === "city" || s.settlement === "port" ? 110 : 40;
      if (
        (Math.abs(x - d.hub.x) < 1.8 && Math.abs(y - d.hub.y) < reach) ||
        (Math.abs(y - d.hub.y) < 1.8 && Math.abs(x - d.hub.x) < reach)
      )
        return true;
      const c = cell(d.hub.x, d.hub.y);
      for (const [dx, dy] of [
        [1, 0],
        [0, 1],
      ]) {
        const neighbor = district(c.x + dx, c.y + dy);
        if (!neighbor.settlement) continue;
        const a = d.hub,
          b = neighbor.hub;
        if (segmentDistance(x, y, [a.x, a.y], [b.x, b.y]) < 1.8) return true;
      }
      if (
        d.places.some(
          (p) =>
            Math.abs(x - p.entrance.x) < 1.5 &&
            y >= p.entrance.y &&
            y <= d.hub.y + 4,
        )
      )
        return true;
    }
    return false;
  }
  function terrain(x: number, y: number, space = "outside"): Terrain {
    if (space !== "outside") return "floor";
    const base = ground(x, y),
      ds = nearby(x, y),
      f = land.sample(x, y);
    const path = road(x, y, ds);
    if (base === "water")
      return path && f.kind === "river" ? "bridge" : "water";
    if (path) return "dirt";
    for (const d of ds) {
      if (
        d.objects.some(
          (o) =>
            o.kind === "crop" &&
            Math.abs(x - o.pos.x) < 3 &&
            Math.abs(y - o.pos.y) < 3,
        )
      )
        return "field";
      if (
        d.places.some(
          (p) =>
            x >= p.x - 1 &&
            x <= p.x + p.w + 1 &&
            y >= p.y - 1 &&
            y <= p.y + p.h + 2,
        )
      )
        return "dirt";
    }
    return base;
  }
  function decoration(x: number, y: number): Decoration | undefined {
    const t = cachedTerrain(x, y);
    if (!["grass", "dry", "rock", "snow", "marsh"].includes(t)) return;
    const ds = nearby(x, y);
    if (
      ds.some(
        (d) =>
          Math.hypot(x - d.hub.x, y - d.hub.y) < 15 ||
          d.places.some(
            (p) =>
              x >= p.x - 3 &&
              x <= p.x + p.w + 3 &&
              y >= p.y - 3 &&
              y <= p.y + p.h + 5,
          ) ||
          d.objects.some(
            (o) =>
              o.pos.space === "outside" &&
              Math.hypot(x - o.pos.x, y - o.pos.y) < 3,
          ),
      )
    )
      return;
    const n = rand("decor", x + land.origin.x, y + land.origin.y),
      f = land.sample(x, y),
      cover = noise(seed, x + land.origin.x, y + land.origin.y, 45, "woods");
    let sprite: string | undefined;
    if (t === "marsh" && n < 0.08) sprite = "reeds";
    else if (
      x % 3 === 0 &&
      y % 3 === 0 &&
      n < f.moisture * cover * (s.climate === "tundra" ? 0.08 : 0.5)
    )
      sprite = pack.trees[Math.floor(rand("tree", x, y) * pack.trees.length)];
    else if (n < (t === "rock" ? 0.045 : 0.008)) sprite = "rock";
    else if (n < 0.015) sprite = "bush";
    return sprite
      ? {
          id: `decor-${x}-${y}`,
          x,
          y,
          sprite,
          solid: pack.trees.includes(sprite) || sprite === "rock",
        }
      : undefined;
  }
  function blocked(x: number, y: number, space: string) {
    if (space !== "outside") return x < 1 || x > 11 || y < 1 || y > 9;
    if (
      Math.abs(x + land.origin.x) > 180 * 2048 ||
      Math.abs(y + land.origin.y) > 85 * 2048
    )
      return true;
    if (cachedTerrain(x, y) === "water") return true;
    return (
      nearby(x, y).some(
        (d) =>
          d.places.some(
            (p) => x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h,
          ) ||
          d.objects.some(
            (o) => o.kind === "tree" && o.pos.x === x && o.pos.y === y,
          ),
      ) || !!decoration(x, y)?.solid
    );
  }
  const terrainCache = new Map<string, Terrain>();
  const cachedTerrain = (x: number, y: number, space = "outside") => {
    if (space !== "outside") return terrain(x, y, space);
    const key = `${x},${y}`;
    const old = terrainCache.get(key);
    if (old) return old;
    const value = terrain(x, y);
    if (terrainCache.size >= 131072) terrainCache.clear();
    terrainCache.set(key, value);
    return value;
  };
  function activateDistrict(d: District) {
    if (active.has(d.id)) return;
    active.add(d.id);
    if (d.settlement) settlements.push(d.settlement);
    places.push(...d.places);
    objects.push(...d.objects);
    actors.push(...d.actors);
  }
  const world: WorldModel = {
    pack,
    settlements,
    places,
    enclosures: [],
    initialActors: actors,
    initialObjects: objects,
    spawn: { x: 0, y: 4, space: "outside" },
    terrain: cachedTerrain,
    decoration,
    blocked,
    overview: ground,
    regionExtent: 1600,
    elevation: (x, y) => land.sample(x, y).elevation,
    moisture: (x, y) => land.sample(x, y).moisture,
    riverX: () => Infinity,
    chunk: (cx, cy) =>
      Array.from({ length: CHUNK_SIZE * CHUNK_SIZE }, (_, i) =>
        cachedTerrain(
          cx * CHUNK_SIZE + (i % CHUNK_SIZE),
          cy * CHUNK_SIZE + Math.floor(i / CHUNK_SIZE),
        ),
      ),
    place: (id) => {
      const m = /^d(-?\d+)_(-?\d+)-h\d+$/.exec(id);
      return m
        ? district(+m[1], +m[2]).places.find((p) => p.id === id)
        : undefined;
    },
    activate: (x, y) => {
      for (const d of nearby(x, y)) activateDistrict(d);
    },
    restoreDistricts: (ids) => {
      for (const id of ids) {
        const m = /^d(-?\d+)_(-?\d+)-/.exec(id);
        if (m) activateDistrict(district(+m[1], +m[2]));
      }
    },
  };
  world.activate!(0, 0);
  for (let r = 0; r < 150; r++) {
    const x = (r % 15) - 7,
      y = 4 + Math.floor(r / 15);
    if (!blocked(x, y, "outside")) {
      world.spawn = { x, y, space: "outside" };
      break;
    }
  }
  if (blocked(world.spawn.x, world.spawn.y, "outside"))
    throw Error("No walkable starting position for this setting.");
  return world;
}
