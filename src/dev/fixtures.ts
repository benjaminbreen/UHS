import {
  parseLighting,
  lightingPreset,
  type LightingId,
} from "../render/lighting";
import { packs, items } from "../content/packs";
import { landscapes } from "../content/graphics/landscapes";
import { buildingModel } from "../render/buildings";
import { Engine } from "../core/engine";
import { Runtime } from "../runtime/session";
import { createWorld } from "../world/generate";
import { random } from "../core/random";
import {
  CHUNK_SIZE,
  type Pack,
  type Terrain,
  type WorldModel,
} from "../core/types";

export const studies = {
  classical: {
    label: "Classical / Hellenistic",
    source: "roman",
    buildings: packs.roman.buildings,
    note: "Primary art target · plaster, terracotta, columns and awnings.",
  },
  mudbrick: {
    label: "Mudbrick households",
    source: "neolithic",
    buildings: packs.neolithic.buildings,
    note: "Primary art target · earth plaster, flat roofs and roof entry.",
  },
  timber: {
    label: "Medieval France · construction study",
    source: "roman",
    buildings: ["study-timber"],
    note: "Shared-part stress test, not a finished or authenticated medieval content pack.",
  },
  courtyard: {
    label: "18th-century China · construction study",
    source: "roman",
    buildings: ["study-courtyard"],
    note: "Shared-part stress test, not a finished or authenticated Chinese content pack.",
  },
  board: {
    label: "20th-century California · construction study",
    source: "roman",
    buildings: ["study-board"],
    note: "Shared-part stress test, not a finished or authenticated Californian content pack.",
  },
  mixed: {
    label: "Compare construction families",
    source: "roman",
    buildings: [
      "house-roman-2",
      "house-mud-2",
      "study-timber",
      "study-courtyard",
    ],
    note: "Different forms share the same terrain, lighting, anchors, depth sorting and renderer.",
  },
} as const;
export type Study = keyof typeof studies;
export type LabConfig = {
  study: Study;
  scene: "board" | "settlement";
  bank: "earth" | "masonry";
  lighting: LightingId;
  colorGrade: boolean;
  panX: number;
  panY: number;
  zoom: number;
  debug: boolean;
  shadows: boolean;
  freeze: boolean;
  seed: string;
  format: "wide" | "square" | "portrait";
};
export function parseLabConfig(search: string): LabConfig {
  const p = new URLSearchParams(search);
  const study = p.get("study") as Study;
  return {
    study: Object.hasOwn(studies, study) ? study : "classical",
    scene: p.get("scene") === "settlement" ? "settlement" : "board",
    bank: p.get("bank") === "earth" ? "earth" : "masonry",
    lighting: parseLighting(p.get("lighting")),
    colorGrade: p.get("colorGrade") !== "0",
    panX: Math.max(-100, Math.min(100, Math.round(Number(p.get("panX")) || 0))),
    panY: Math.max(-100, Math.min(100, Math.round(Number(p.get("panY")) || 0))),
    zoom: Math.max(1, Math.min(4, Math.round(Number(p.get("zoom")) || 2))),
    debug: p.get("debug") === "1",
    shadows: p.get("shadows") !== "0",
    freeze: p.get("freeze") !== "0",
    seed: p.get("seed")?.slice(0, 100) || "graphics-01",
    format:
      p.get("format") === "portrait"
        ? "portrait"
        : p.get("format") === "square"
          ? "square"
          : "wide",
  };
}
export function labURL(config: LabConfig) {
  const params = new URLSearchParams(
    Object.entries(config).map(([k, v]) => [
      k,
      typeof v === "boolean" ? (v ? "1" : "0") : String(v),
    ]),
  );
  return `/graphics-lab?${params}`;
}

/** No storage, worker cache, or public action API. WorldScene is the production renderer. */
export function createLabRuntime(config: LabConfig) {
  const study = studies[config.study];
  const pack: Pack = {
    ...packs[study.source],
    buildings: [...study.buildings],
    landscape: {
      ...(config.bank === "earth" ? landscapes.meadow : landscapes.riverTown),
    },
  };
  const world =
    config.scene === "settlement"
      ? createWorld(pack, config.seed)
      : specimenWorld(pack, config.seed);
  const engine = new Engine(world, items);
  engine.initialize(config.seed);
  engine.state.clock = lightingPreset(config.lighting).hour * 3600;
  if (config.scene === "settlement") {
    const focus = world.places[3];
    engine.state.player.pos = {
      ...focus.entrance,
      y: focus.entrance.y + 1,
      space: "outside",
    };
  }
  const runtime = new Runtime(engine, { cacheTerrain: false });
  engine.state.player.pos.x += config.panX;
  engine.state.player.pos.y += config.panY;
  runtime.zoom = config.zoom;
  return runtime;
}

function specimenWorld(pack: Pack, seed: string): WorldModel {
  const world = createWorld(pack, seed);
  world.enclosures = [];
  world.settlements = [
    { id: "specimen", name: "Construction court", x: 0, y: 0, size: 30 },
  ];
  world.places = Array.from({ length: 4 }, (_, i) => {
    const model = buildingModel(pack.buildings[i % pack.buildings.length]);
    const x = -6 + (i % 2) * 12,
      y = -6 + Math.floor(i / 2) * 12;
    return {
      id: `specimen-${i}`,
      name: model.label,
      description: model.description,
      x,
      y,
      w: model.footprint[0],
      h: model.footprint[1],
      sprite: model.frame,
      entrance: { x: x + model.entrance[0], y: y + model.entrance[1] },
      access: "public" as const,
      owner: "lab",
      claim: pack.buildingClaim,
      entranceLabel: "Enter",
    };
  });
  world.spawn = { x: -3, y: 3, space: "outside" };
  world.initialActors = [];
  world.initialObjects = [
    {
      id: "lab-well",
      name: "Well",
      kind: "well",
      sprite: "well",
      pos: { x: 1, y: 0, space: "outside" },
      inventory: {},
    },
    ...world.places.map((p, i) => ({
      id: `lab-store-${i}`,
      name: "Household stores",
      kind: "container" as const,
      sprite: i % 2 ? "basket" : "amphora",
      pos: { x: p.x + p.w, y: p.y + p.h, space: "outside" },
      inventory: {},
    })),
    ...[
      [-9, -2],
      [-10, 9],
      [14, -3],
      [14, 9],
    ].map(([x, y], i) => ({
      id: `lab-tree-${i}`,
      name: "Tree",
      kind: "tree" as const,
      sprite: pack.trees[i % pack.trees.length],
      pos: { x, y, space: "outside" },
      inventory: {},
    })),
    {
      id: "lab-fire",
      name: "Hearth",
      kind: "fire",
      sprite: "fire",
      pos: { x: 3, y: 0, space: "outside" },
      inventory: {},
    },
  ];
  // A continuously varying contour exercises convex/concave corners and variable widths.
  // This is a separate fixture: saved worlds retain their version-one collision geometry.
  world.riverX = (y) => -17 + Math.sin(y / 7) * 1.7 + Math.sin(y / 15) * 2;
  world.terrain = (x, y, space = "outside"): Terrain => {
    if (space !== "outside") return "floor";
    const dist = Math.abs(x - world.riverX(y));
    const width = 2.8 + Math.sin(y / 9) * 0.7;
    if (dist < width) return Math.abs(y - 3) <= 1 ? "bridge" : "water";
    if (Math.abs(y - 3) <= 1) return pack.road;
    if (dist < width + 1) return "sand";
    if (x >= 9 && x < 15 && y >= -12 && y < -8) return "field";
    if (
      world.places.some(
        (p) => x >= p.x - 1 && x <= p.x + p.w && y >= p.y && y <= p.y + p.h + 1,
      )
    )
      return "dirt";
    return pack.ground;
  };
  world.decoration = (x, y) => {
    if (
      world.terrain(x, y) !== pack.ground ||
      world.places.some(
        (p) =>
          x >= p.x - 2 &&
          x <= p.x + p.w + 2 &&
          y >= p.y - 2 &&
          y <= p.y + p.h + 2,
      )
    )
      return;
    const n = random(seed, "specimen-decor", x, y);
    if (n > 0.018) return;
    return {
      id: `specimen-decor-${x}-${y}`,
      x,
      y,
      sprite: n < 0.006 ? "rock" : n < 0.01 ? "bush" : "flowers",
      solid: false,
    };
  };
  world.blocked = (x, y, space) =>
    space !== "outside"
      ? x < 1 || x > 11 || y < 1 || y > 9
      : world.terrain(x, y) === "water" ||
        world.places.some(
          (p) => x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h,
        ) ||
        world.initialObjects.some(
          (o) => o.kind === "tree" && o.pos.x === x && o.pos.y === y,
        );
  world.place = (id) => world.places.find((p) => p.id === id);
  world.chunk = (cx, cy) =>
    Array.from({ length: CHUNK_SIZE ** 2 }, (_, i) =>
      world.terrain(
        cx * CHUNK_SIZE + (i % CHUNK_SIZE),
        cy * CHUNK_SIZE + Math.floor(i / CHUNK_SIZE),
      ),
    );
  return world;
}
