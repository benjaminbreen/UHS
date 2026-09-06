import {
  CHUNK_SIZE,
  type Pack,
  type WorldModel,
  type Place,
  type Actor,
  type Position,
  type Terrain,
  type WorldObject,
  type Settlement,
  type Decoration,
} from "../core/types";
import { random } from "../core/random";
export function createWorld(pack: Pack, seed: string): WorldModel {
  const r = (...k: (string | number)[]) => random(seed, "world", ...k);
  const settlements: Settlement[] = [
    { id: "s0", name: pack.settlementNames[0], x: 0, y: 0, size: 40 },
    {
      id: "s1",
      name: pack.settlementNames[1],
      x: 95 + Math.floor(r("s1") * 30),
      y: -85,
      size: 30,
    },
    {
      id: "s2",
      name: pack.settlementNames[2],
      x: -85,
      y: 100 + Math.floor(r("s2") * 25),
      size: 30,
    },
    { id: "s3", name: pack.settlementNames[3], x: 150, y: 125, size: 24 },
  ];
  // Region-wide channel and road functions are independent of chunk request order.
  const riverX = (y: number) => {
    if (!pack.geography)
      return (
        -23 +
        Math.round(
          Math.sin(y / 44 + r("river") * 2) * 5 + Math.sin(y / 113) * 7,
        )
      );
    const hits = pack.geography.segments.flatMap(([a, b]) =>
      y >= Math.min(a[1], b[1]) && y <= Math.max(a[1], b[1]) && a[1] !== b[1]
        ? [a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1])]
        : [],
    );
    return hits.length
      ? Math.round(hits.sort((a, b) => Math.abs(a) - Math.abs(b))[0])
      : Infinity;
  };
  const places: Place[] = [];
  const actors: Actor[] = [];
  const objects: WorldObject[] = [];
  for (const s of settlements) {
    const count = s.id === "s0" ? 10 : 6;
    for (let i = 0; i < count; i++) {
      const col = i % 3,
        row = Math.floor(i / 3);
      const x =
        s.x -
        10 +
        col * (pack.layout === "streets" ? 10 : 8) +
        Math.floor(r(s.id, i, "x") * 2);
      const y = s.y + [-17, -7, 11, 21][row] + Math.floor(r(s.id, i, "y") * 2);
      const variant = Math.floor(r(s.id, i, "variant") * 4);
      const w = variant % 2 === 0 ? 5 : 6,
        h = pack.architecture === "roman" ? 4 : 3;
      const id = `${s.id}-house-${i}`,
        owner = `${s.id}-person-${i}`;
      const p: Place = {
        id,
        name: pack.buildingNames[i % pack.buildingNames.length],
        description:
          pack.architecture === "roman"
            ? "Warm plaster, a tiled roof, and the traces of a household at work."
            : "Sun-dried mudbrick, a flat roof, and a ladder into a household below.",
        x,
        y,
        w,
        h,
        sprite: `house-${pack.architecture}-${variant}`,
        entrance: { x: x + Math.floor(w / 2), y: y + h },
        access: i % 3 === 0 ? "public" : "household",
        owner,
        claim: pack.id === "roman" ? "roman-house" : "neolithic-house",
        entranceLabel: pack.entryLabel,
      };
      places.push(p);
      const pos = { x: p.entrance.x, y: p.entrance.y + 1, space: "outside" };
      const ai = i + Number(s.id.slice(1)) * 3;
      actors.push({
        id: owner,
        name: pack.names[ai % pack.names.length],
        role: pack.roles[i % pack.roles.length],
        kind: "human",
        pos: { ...pos },
        home: { ...pos },
        work: {
          x: s.x + 3 + (i % 4) * 2,
          y: s.y + 3 + Math.floor(i / 4) * 2,
          space: "outside",
        },
        sprite: `human-${i % 3}-${i % 6}`,
        inventory: { [pack.trade.take]: 8, [pack.trade.give]: 6, water: 2 },
        activity: i % 2 ? "Tending household work" : "Walking to the square",
        fatigue: 0,
        hunger: 5,
        trust: i % 3 === 0 ? 2 : 1,
        memories: [],
        direction: 2,
      });
      objects.push({
        id: `${id}-store`,
        name: i % 2 ? "Household basket" : "Storage vessel",
        kind: "container",
        pos: { x: x + w, y: y + h, space: "outside" },
        sprite: i % 2 ? "basket" : "amphora",
        inventory: { [pack.commodities[i % pack.commodities.length]]: 3 },
        owner,
        claim: p.claim,
      });
      objects.push(
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
          name: "Household stores",
          kind: "container",
          pos: { x: 8, y: 3, space: id },
          sprite: "basket",
          inventory: { grain: 4, wood: 2 },
          owner,
        },
        {
          id: `${id}-exit`,
          name:
            pack.architecture === "mud" ? "Roof ladder" : "Door to the street",
          kind: "exit",
          pos: { x: 6, y: 9, space: id },
          sprite: pack.architecture === "mud" ? "ladder" : "door-open",
          inventory: {},
        },
      );
    }
    objects.push(
      {
        id: `${s.id}-well`,
        name: "Communal well",
        kind: "well",
        pos: { x: s.x + 2, y: s.y, space: "outside" },
        sprite: "well",
        inventory: {},
        claim: "landscape",
      },
      {
        id: `${s.id}-fire`,
        name: "Shared hearth",
        kind: "fire",
        pos: { x: s.x + 9, y: s.y + 3, space: "outside" },
        sprite: "fire",
        inventory: {},
      },
      {
        id: `${s.id}-gate`,
        name: "Flock enclosure gate",
        kind: "gate",
        pos: { x: s.x + 24, y: s.y + 12, space: "outside" },
        sprite: "gate",
        inventory: {},
        open: false,
      },
    );
    for (let i = 0; i < 4; i++)
      objects.push({
        id: `${s.id}-crop-${i}`,
        name: "Ripe grain",
        kind: "crop",
        pos: { x: s.x + 22 + i * 2, y: s.y - 6, space: "outside" },
        sprite: "wheat",
        inventory: { grain: 3 },
        claim: "landscape",
      });
    for (let i = 0; i < 3; i++) {
      const pos = { x: s.x - 14 + i * 10, y: s.y + 1, space: "outside" };
      // Repair tree placement against the shared terrain before instantiation.
      for (
        let attempt = 0;
        attempt < 12 && terrain(pos.x, pos.y) !== pack.ground;
        attempt++
      )
        pos.x += 2;
      if (terrain(pos.x, pos.y) !== pack.ground) continue;
      objects.push({
        id: `${s.id}-grove-${i}`,
        name: `${pack.trees[i % pack.trees.length][0].toUpperCase() + pack.trees[i % pack.trees.length].slice(1)} tree`,
        kind: "tree",
        pos,
        sprite: pack.trees[i % pack.trees.length],
        inventory: { wood: 2 },
        claim: pack.evidence.some((e) => e.id === "plants")
          ? "plants"
          : "landscape",
      });
    }
    for (let i = 0; i < 7; i++) {
      const kind = pack.species[i % pack.species.length];
      const pos = {
        x: s.x + 17 + (i % 4) * 2,
        y: s.y + 8 + Math.floor(i / 4) * 3,
        space: "outside",
      };
      actors.push({
        id: `${s.id}-animal-${i}`,
        name:
          kind === "lizard"
            ? "Wall lizard"
            : kind === "sheep"
              ? "Sheep"
              : kind === "goat"
                ? "Goat"
                : "Chicken",
        role: "Animal",
        kind,
        pos: { ...pos },
        home: { x: s.x + 24, y: s.y + 17, space: "outside" },
        work: { ...pos },
        sprite: kind,
        inventory: {},
        activity: kind === "lizard" ? "Basking in the sun" : "Grazing",
        fatigue: 0,
        hunger: 0,
        trust: 0,
        owner: `${s.id}-person-2`,
        memories: [],
        direction: 2,
      });
    }
  }
  const spawn: Position = { x: -5, y: 5, space: "outside" };
  function nearRoad(x: number, y: number): boolean {
    for (const s of settlements) {
      if (Math.abs(y - s.y - 5) <= 1 && Math.abs(x - s.x) < 48) return true;
      if (
        pack.layout === "streets" &&
        Math.abs(x - s.x - 9) <= 1 &&
        Math.abs(y - s.y) < 40
      )
        return true;
    }
    for (const s of settlements.slice(1)) {
      const t = Math.max(
        0,
        Math.min(
          1,
          ((x - 2) * (s.x - 2) + (y - 5) * s.y) /
            (Math.pow(s.x - 2, 2) + s.y * s.y),
        ),
      );
      if (Math.hypot(x - (2 + t * (s.x - 2)), y - (5 + t * s.y)) < 1.5)
        return true;
    }
    return places.some(
      (p) =>
        Math.abs(x - p.entrance.x) <= 1 &&
        y >= p.entrance.y &&
        y <= p.entrance.y + 3,
    );
  }
  function terrain(x: number, y: number, space = "outside"): Terrain {
    if (space !== "outside") return "floor";
    const water = Math.abs(x - riverX(y)) < 5;
    if (water) return Math.abs(y - 5) <= 1 ? "bridge" : "water";
    if (nearRoad(x, y)) return pack.road;
    if (Math.abs(x - riverX(y)) < 7) return "sand";
    if (
      settlements.some(
        (s) => x >= s.x + 20 && x <= s.x + 30 && y >= s.y - 10 && y <= s.y - 3,
      )
    )
      return "field";
    if (
      places.some(
        (p) => x >= p.x - 1 && x <= p.x + p.w && y >= p.y && y <= p.y + p.h + 1,
      )
    )
      return "dirt";
    return pack.ground;
  }
  function decoration(x: number, y: number): Decoration | undefined {
    if (terrain(x, y) !== pack.ground) return;
    if (
      objects.some(
        (o) =>
          o.pos.space === "outside" && Math.hypot(x - o.pos.x, y - o.pos.y) < 2,
      )
    )
      return;
    if (
      places.some(
        (p) =>
          x >= p.x - 2 &&
          x <= p.x + p.w + 2 &&
          y >= p.y - 2 &&
          y <= p.y + p.h + 3,
      )
    )
      return;
    if (
      settlements.some(
        (s) => Math.abs(x - s.x - 24) < 8 && y > s.y + 9 && y < s.y + 22,
      )
    )
      return;
    const n = r("decor", x, y);
    let sprite: string | undefined;
    if (x % 3 === 0 && y % 3 === 0 && n < 0.22)
      sprite = pack.trees[Math.floor(r("tree", x, y) * pack.trees.length)];
    else if (n < 0.014) sprite = "rock";
    else if (n < 0.026) sprite = "bush";
    else if (n < 0.05) sprite = "flowers";
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
  function blocked(x: number, y: number, space: string): boolean {
    if (space !== "outside") return x < 1 || x > 11 || y < 1 || y > 9;
    if (Math.abs(x) > 4000 || Math.abs(y) > 4000) return true;
    if (terrain(x, y) === "water") return true;
    if (
      objects.some(
        (o) =>
          o.kind === "tree" &&
          o.pos.x === x &&
          o.pos.y === y &&
          o.pos.space === space,
      )
    )
      return true;
    if (
      places.some((p) => x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h)
    )
      return true;
    for (const s of settlements) {
      if (
        x >= s.x + 20 &&
        x <= s.x + 28 &&
        y >= s.y + 12 &&
        y <= s.y + 20 &&
        (x === s.x + 20 ||
          x === s.x + 28 ||
          y === s.y + 12 ||
          y === s.y + 20) &&
        !(x === s.x + 24 && y === s.y + 12)
      )
        return true;
    }
    return !!decoration(x, y)?.solid;
  }
  return {
    pack,
    settlements,
    places,
    initialActors: actors,
    initialObjects: objects,
    spawn,
    terrain,
    decoration,
    blocked,
    riverX,
    place: (id) => places.find((p) => p.id === id),
    chunk: (cx, cy) =>
      Array.from({ length: CHUNK_SIZE * CHUNK_SIZE }, (_, i) =>
        terrain(
          cx * CHUNK_SIZE + (i % CHUNK_SIZE),
          cy * CHUNK_SIZE + Math.floor(i / CHUNK_SIZE),
        ),
      ),
  };
}
