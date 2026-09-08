import { pathArt } from "./path-art";
import { streetMaterial } from "../../content/settlements/streets";
import { habitatAt, habitatTree } from "./habitats";
import { createRegionalContext } from "../regional/context";
import { regionalSettlements } from "../regional/settlements";
import { regionalTransport } from "../regional/transport";
import type { GeographicArea } from "../../core/geography";
import { createEnvironment, localEcology } from "./environment";
import { ecologyProfiles } from "../../content/ecology/profiles";
import { populateHouseholds, addWildResources } from "./population";
import { createReliefLandscape, reliefCell } from "./topography";
import {
  terrainStep,
  type HeightTier,
  type TopographyCell,
} from "../../core/topography";
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
  const regional = pack.setting?.geographyRevision
    ? createRegionalContext(pack.setting)
    : undefined;
  const relief = !!pack.setting?.terrainRevision;
  const environment =
    pack.setting?.terrainRevision === 2 ? pack.setting.environment : undefined;
  const land = environment
      ? createEnvironment(pack.setting!, seed, regional)
      : relief
        ? createReliefLandscape(pack.setting!, seed)
        : createLandscape(pack.setting!, seed),
    sites = new Map<string, Site | null>(),
    plans = new Map<string, SettlementPlan>(),
    links = new Map<string, Road[]>(),
    active = new Set<string>();
  const regionalPlanner = regional
    ? regionalSettlements(regional, land.sample, seed)
    : undefined;
  const transport =
    regional && regionalPlanner
      ? regionalTransport(regional, regionalPlanner.sitesIn, land.sample)
      : undefined;
  const home = {
    x: Math.floor(land.origin.x / DISTRICT_SIZE),
    y: Math.floor(land.origin.y / DISTRICT_SIZE),
  };
  const startingSite = regionalPlanner
    ? [-1, 0, 1]
        .flatMap((dy) =>
          [-1, 0, 1].flatMap((dx) =>
            regionalPlanner.sitesIn(home.x + dx, home.y + dy),
          ),
        )
        .filter((s) => Math.hypot(s.center.x, s.center.y) < 384)
        .sort(
          (a, b) =>
            Math.hypot(a.center.x, a.center.y) -
              Math.hypot(b.center.x, b.center.y) || a.id.localeCompare(b.id),
        )[0]
    : undefined;
  if (startingSite) regionalPlanner!.setHome(startingSite.id);
  const coord = (x: number, y: number) => ({
    x: Math.floor((x + land.origin.x) / DISTRICT_SIZE),
    y: Math.floor((y + land.origin.y) / DISTRICT_SIZE),
  });
  function sitesIn(cx: number, cy: number): Site[] {
    if (regionalPlanner) return regionalPlanner.sitesIn(cx, cy);
    const s = site(cx, cy);
    return s ? [s] : [];
  }
  function site(cx: number, cy: number): Site | undefined {
    if (regionalPlanner) return regionalPlanner.sitesIn(cx, cy)[0];
    if (environment?.population === "none") return;
    const id = `s${cx}_${cy}`;
    if (sites.has(id)) return sites.get(id) ?? undefined;
    const isHome = cx === home.x && cy === home.y;
    if (
      !isHome &&
      random(seed, "settlement-sites", cx, cy) >
        (environment?.population === "sparse" ? 0.24 : 0.62)
    ) {
      sites.set(id, null);
      return;
    }
    const center = isHome
      ? { x: 0, y: 0 }
      : {
          x: cx * 384 + 192 - land.origin.x,
          y: cy * 384 + 192 - land.origin.y,
        };
    const locations = Array.from({ length: 25 }, (_, i) => {
      const angle = i * 2.4,
        radius = i ? 8 + Math.floor(i / 5) * 6 : 0;
      return {
        x: Math.round((center.x + Math.cos(angle) * radius) / 2) * 2,
        y: Math.round((center.y + Math.sin(angle) * radius) / 2) * 2,
      };
    });
    if (environment) {
      const suitability = (p: { x: number; y: number }) => {
        const f = land.sample(p.x, p.y),
          near = [
            [-6, -6],
            [6, -6],
            [-6, 6],
            [6, 6],
          ].map(([dx, dy]) => land.sample(p.x + dx, p.y + dy));
        return (
          near.reduce(
            (n, q) =>
              n +
              (q.water < 5 ? 1000 : 0) +
              Math.abs(q.elevation - f.elevation) * 4,
            0,
          ) +
          Math.abs(f.water - 28) * 0.15 +
          Math.hypot(p.x - center.x, p.y - center.y) * 0.12
        );
      };
      locations.sort((a, b) => suitability(a) - suitability(b));
    }
    for (const p of locations) {
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
          (environment ? 0 : 28)
      )
        continue;
      const s = {
        id,
        cx,
        cy,
        center: p,
        home: isHome,
        profile:
          relief && !environment
            ? {
                ...settlementProfile(pack.setting!, isHome),
                radius: 48,
                buildings: 8,
                frontage: 9,
              }
            : {
                ...settlementProfile(pack.setting!, isHome),
                ...(environment?.population === "sparse"
                  ? { buildings: 5, radius: 62 }
                  : {}),
              },
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
  function getPlan(
    cx: number,
    cy: number,
    id?: string,
  ): SettlementPlan | undefined {
    const s = id ? sitesIn(cx, cy).find((p) => p.id === id) : site(cx, cy);
    if (!s) return;
    const old = plans.get(s.id);
    if (old) return old;
    const connections: Road[] = [];
    if (!relief && pack.setting!.settlement !== "camp")
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        for (const neighbor of sitesIn(cx + dx, cy + dy))
          connections.push(...link(s, neighbor));
      }
    if (transport)
      connections.push(
        ...transport.roadsIn({
          x: s.center.x - s.profile.radius - 40,
          y: s.center.y - s.profile.radius - 40,
          w: s.profile.radius * 2 + 80,
          h: s.profile.radius * 2 + 80,
        }),
      );
    const plan = planSettlement(
      s,
      s.pack ?? pack,
      seed,
      land.sample,
      connections,
    );
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
        for (const s of sitesIn(c.x + dx, c.y + dy)) {
          if (
            Math.abs(s.center.x - (bx * 64 + 32)) > s.profile.radius + 90 ||
            Math.abs(s.center.y - (by * 64 + 32)) > s.profile.radius + 90
          )
            continue;
          const p = getPlan(s.cx, s.cy, s.id);
          if (p) result.push(p);
        }
      }
    if (neighborCache.size > 96) neighborCache.clear();
    neighborCache.set(key, result);
    return result;
  }
  const roadCache = new Map<string, Map<string, Terrain>>();
  function regionalRoads(x: number, y: number) {
    if (relief && !regional) return new Map<string, Terrain>();
    const c = coord(x, y),
      key = cellKey(c.x, c.y),
      old = roadCache.get(key);
    if (old) return old;
    const tiles = new Map<string, Terrain>();
    if (transport) {
      const area = {
        x: c.x * DISTRICT_SIZE - land.origin.x,
        y: c.y * DISTRICT_SIZE - land.origin.y,
        w: DISTRICT_SIZE,
        h: DISTRICT_SIZE,
      };
      for (const r of transport.roadsIn(area))
        roadCells(r, (px, py) => {
          if (
            px >= area.x &&
            px < area.x + area.w &&
            py >= area.y &&
            py < area.y + area.h
          )
            tiles.set(cellKey(px, py), r.kind === "bridge" ? "bridge" : "dirt");
        });
      if (roadCache.size >= 32) roadCache.clear();
      roadCache.set(key, tiles);
      return tiles;
    }
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        for (const a of sitesIn(c.x + dx, c.y + dy)) {
          for (const [ex, ey] of [
            [0, 0],
            [1, 0],
            [0, 1],
          ]) {
            for (const b of sitesIn(a.cx + ex, a.cy + ey)) {
              if (a.id === b.id || (ex === 0 && ey === 0 && a.id > b.id))
                continue;
              if (
                (a.pack ?? pack).setting!.settlement === "camp" ||
                (b.pack ?? pack).setting!.settlement === "camp"
              )
                continue;
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
        }
      }
    if (roadCache.size >= 32) roadCache.clear();
    roadCache.set(key, tiles);
    return tiles;
  }
  const habitatCache = new Map<string, ReturnType<typeof habitatAt>>();
  function habitat(x: number, y: number) {
    const key = cellKey(x, y);
    let value = habitatCache.get(key);
    if (!value) {
      const setting = regional?.settingAt(x, y) ?? pack.setting!;
      value = habitatAt(
        setting.environment!.ecology,
        setting.season,
        seed,
        x + land.origin.x,
        y + land.origin.y,
        land.sample(x, y),
      );
      if (habitatCache.size >= 65536) habitatCache.clear();
      habitatCache.set(key, value);
    }
    return value;
  }
  function ground(x: number, y: number): Terrain {
    const f = land.sample(x, y);
    if (
      regional &&
      f.water >= (f.shoreWidth ?? 3) &&
      (regional.landUse(x, y) === "rock" ||
        (f.elevation >= 28 &&
          f.moisture < 0.6 &&
          noise(
            seed,
            x + land.origin.x,
            y + land.origin.y,
            45,
            "exposed-rock",
          ) > 0.56))
    )
      return "rock";
    if (regional?.landUse(x, y) === "fields" && f.water >= 0) return "field";
    if (environment) {
      const profile =
        ecologyProfiles[
          localEcology(
            regional?.settingAt(x, y) ?? pack.setting!,
            seed,
            x + (regional ? land.origin.x : 0),
            y + (regional ? land.origin.y : 0),
            f,
          )
        ];
      return f.water < 0
        ? "water"
        : f.water < (f.shoreWidth ?? 3)
          ? "sand"
          : f.snow
            ? "snow"
            : profile.surface === "sand"
              ? "sand"
              : profile.surface === "damp"
                ? "marsh"
                : profile.surface === "dry"
                  ? "dry"
                  : "grass";
    }
    if (relief)
      return f.water < 0
        ? "water"
        : f.moisture > 0.73
          ? "marsh"
          : f.moisture < 0.48
            ? "dry"
            : "grass";
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
      f.water < (relief ? 0 : 4) ||
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
    const tree =
      (!regional || ground(x, y) !== "rock") &&
      (environment
        ? f.water > (f.shoreWidth ?? 3) &&
          habitatTree(
            habitat(x, y),
            seed,
            x + land.origin.x,
            y + land.origin.y,
            ecologyProfiles[habitat(x, y).ecology].trees,
          )
        : x % 3 === 0 && y % 3 === 0 && n < f.moisture * cover * 0.38);
    const sprite =
      relief && f.water < 3 && n < 0.09
        ? "rock"
        : relief && f.water < 8 && f.moisture > 0.68 && n < 0.12
          ? "reeds"
          : tree && environment
            ? ecologyProfiles[
                localEcology(
                  regional?.settingAt(x, y) ?? pack.setting!,
                  seed,
                  x + (regional ? land.origin.x : 0),
                  y + (regional ? land.origin.y : 0),
                  f,
                )
              ].tree
            : tree
              ? pack.trees[
                  Math.floor(random(seed, "v3-tree", x, y) * pack.trees.length)
                ]
              : n <
                  (environment ? 0.002 + habitat(x, y).exposed * 0.017 : 0.006)
                ? "rock"
                : n <
                    (environment
                      ? 0.003 +
                        Math.max(0, habitat(x, y).cover - 0.35) *
                          0.16 *
                          (habitat(x, y).ecology === "desert" ? 0.2 : 1)
                      : 0.015)
                  ? "bush"
                  : relief && n < 0.016 && f.moisture > 0.5 && f.moisture < 0.73
                    ? "flowers"
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
  const reliefCache = new Map<string, TopographyCell>();
  const pathArtCache = new WeakMap<
    SettlementPlan,
    ReturnType<typeof pathArt>
  >();
  const roadCenters = new WeakMap<SettlementPlan, Set<string>>();
  const bridgeDecks = new WeakMap<SettlementPlan, Set<string>>();
  function rawCell(x: number, y: number): TopographyCell {
    const f = land.sample(x, y),
      t = terrain(x, y);
    let height = Math.round(f.elevation / 14) as HeightTier;
    for (const p of nearby(x, y)) {
      let deck = bridgeDecks.get(p);
      if (!deck) {
        deck = new Set();
        for (const road of p.roads)
          if (road.kind === "bridge")
            roadCells(road, (a, b) => deck!.add(cellKey(a, b)));
        bridgeDecks.set(p, deck);
      }
      if (deck.has(cellKey(x, y))) height = 1;
    }
    if (t === "bridge") height = 1;
    const cell = reliefCell(height, f.water, f.moisture);
    if (environment) {
      cell.habitat = habitat(x, y);
      cell.waterVisual = {
        distance: f.water,
        kind: f.kind,
        ecology: (regional?.settingAt(x, y) ?? pack.setting!).environment!
          .ecology,
        shoreWidth: f.shoreWidth ?? 3,
        flow: f.waterFlow ?? [0, 1],
        frozenMargin: f.snow,
      };
      cell.biome = localEcology(
        regional?.settingAt(x, y) ?? pack.setting!,
        seed,
        x + (regional ? land.origin.x : 0),
        y + (regional ? land.origin.y : 0),
        f,
      );
      const eco = ecologyProfiles[cell.biome];
      if (f.water >= 0) cell.surface = f.snow ? "snow" : eco.surface;
      if (f.water >= 0 && f.water < (f.shoreWidth ?? 3)) {
        const shoreEcology = (regional?.settingAt(x, y) ?? pack.setting!)
          .environment!.ecology;
        const stonyShore =
          shoreEcology === "tundra" ||
          shoreEcology === "boreal-woodland" ||
          (f.kind === "sea" &&
            shoreEcology !== "desert" &&
            shoreEcology !== "tropical-woodland" &&
            (f.shoreWidth ?? 3) < 5);
        cell.surface = f.kind === "river" || stonyShore ? "gravel" : "sand";
        if (cell.surface === "gravel") cell.feature = "bank";
      }
    } else if (height === 0 && f.water >= 0) cell.surface = "gravel";
    if (t === "bridge") return { ...cell, surface: "soil", bridge: true };
    if (t === "field") {
      cell.surface = "soil";
      cell.feature = "field";
    }
    if (t === "rock") cell.surface = "gravel";
    if (t === "paving") {
      cell.surface = environment ? "gravel" : "soil";
      if (environment) {
        cell.feature = "paving";
        cell.streetMaterial = streetMaterial(
          regional?.settingAt(x, y) ?? pack.setting!,
        );
      }
    }
    if (regional && regionalRoads(x, y).has(cellKey(x, y)) && t !== "paving") {
      const local = regional.settingAt(x, y);
      if (regional.placeAt(x, y) && settlementProfile(local).paved) {
        cell.surface = "gravel";
        cell.feature = "paving";
        cell.streetMaterial = streetMaterial(local);
      } else cell.surface = "soil";
    }
    if (t === "dirt")
      for (const p of nearby(x, y)) {
        let center = roadCenters.get(p);
        if (!center) {
          center = new Set<string>();
          for (const road of p.roads)
            roadCells(road, (a, b) => center!.add(cellKey(a, b)));
          roadCenters.set(p, center);
        }
        const doorstep = p.places.some(
          (b) =>
            x >= b.x - 1 &&
            x < b.x + b.w + 1 &&
            y >= b.y - 1 &&
            y < b.y + b.h + 1,
        );
        if (
          center.has(cellKey(x, y)) ||
          doorstep ||
          Math.hypot(x - p.site.center.x, y - p.site.center.y) < 2
        )
          cell.surface = "soil";
      }
    if (
      environment &&
      cell.surface !== "water" &&
      !cell.bridge &&
      !cell.feature
    ) {
      const strokes = nearby(x, y).flatMap((p) => {
        let index = pathArtCache.get(p);
        if (!index) {
          index = pathArt(p.site.profile.paved ? [] : p.roads);
          pathArtCache.set(p, index);
        }
        return index.get(cellKey(x, y)) ?? [];
      });
      if (strokes.length)
        cell.pathArt = strokes.map((s) => ({
          a: [s.a[0] - x, s.a[1] - y],
          b: [s.b[0] - x, s.b[1] - y],
          radius: s.radius,
        }));
    }
    return cell;
  }
  const slopePlans = new Map<string, Map<string, "n" | "s" | "e" | "w">>();
  function slopesFor(plan: SettlementPlan) {
    const old = slopePlans.get(plan.site.id);
    if (old) return old;
    const result = new Map<string, "n" | "s" | "e" | "w">();
    slopePlans.set(plan.site.id, result);
    const chosen: { x: number; y: number }[] = [];
    // One opening per nearby group of crossing roads, never one per road pixel.
    const points = plan.roads
      .flatMap((r) => r.points)
      .sort((a, b) => a.y - b.y || a.x - b.x);
    for (const p of points) {
      if (chosen.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < 10)) continue;
      const c = rawCell(p.x, p.y);
      if (c.surface === "water" || c.bridge) continue;
      for (const [dx, dy, dir] of [
        [0, -1, "n"],
        [1, 0, "e"],
        [0, 1, "s"],
        [-1, 0, "w"],
      ] as const) {
        const hi = rawCell(p.x + dx, p.y + dy),
          lo = rawCell(p.x - dx, p.y - dy);
        if (
          hi.height !== c.height + 1 ||
          lo.height !== c.height ||
          hi.surface === "water" ||
          lo.surface === "water"
        )
          continue;
        const companion = [-1, 1]
          .map((sign) => ({
            x: p.x + sign * Math.abs(dy),
            y: p.y + sign * Math.abs(dx),
          }))
          .find(
            (q) =>
              rawCell(q.x, q.y).height === c.height &&
              rawCell(q.x + dx, q.y + dy).height === hi.height &&
              rawCell(q.x - dx, q.y - dy).height === c.height,
          );
        if (!companion) continue;
        result.set(cellKey(p.x, p.y), dir);
        result.set(cellKey(companion.x, companion.y), dir);
        chosen.push(p);
        break;
      }
    }
    return result;
  }
  const naturalSlopes = new Map<
    string,
    Map<string, NonNullable<TopographyCell["ramp"]>>
  >();
  function naturalSlopesFor(x: number, y: number) {
    const bx = Math.floor(x / 32) * 32,
      by = Math.floor(y / 32) * 32,
      key = cellKey(bx, by);
    const old = naturalSlopes.get(key);
    if (old) return old;
    const result = new Map<string, NonNullable<TopographyCell["ramp"]>>();
    const best = new Map<
      number,
      {
        x: number;
        y: number;
        dx: number;
        dy: number;
        dir: NonNullable<TopographyCell["ramp"]>;
        score: number;
      }
    >();
    // Select stable, two-cell openings on actual contours, never at fixed grid lines.
    for (let py = by; py < by + 32; py++)
      for (let px = bx; px < bx + 32; px++) {
        const c = land.sample(px, py);
        if (c.water < 0) continue;
        for (const [dx, dy, dir] of [
          [0, -1, "n"],
          [1, 0, "e"],
          [0, 1, "s"],
          [-1, 0, "w"],
        ] as const) {
          const tx = Math.abs(dy),
            ty = Math.abs(dx);
          if (px + tx >= bx + 32 || py + ty >= by + 32) continue;
          const hi = land.sample(px + dx, py + dy);
          if (hi.elevation !== c.elevation + 14 || hi.water < 0) continue;
          if (
            ![0, 1].every((k) =>
              [-2, -1, 0, 1, 2].every((d) => {
                const f = land.sample(
                  px + k * tx + d * dx,
                  py + k * ty + d * dy,
                );
                return (
                  f.water >= 0 &&
                  f.elevation === (d > 0 ? hi.elevation : c.elevation)
                );
              }),
            )
          )
            continue;
          const score = random(seed, "natural-pass", px, py, dir);
          if (score < (best.get(c.elevation)?.score ?? Infinity))
            best.set(c.elevation, { x: px, y: py, dx, dy, dir, score });
        }
      }
    for (const p of best.values()) {
      result.set(cellKey(p.x, p.y), p.dir);
      result.set(cellKey(p.x + Math.abs(p.dy), p.y + Math.abs(p.dx)), p.dir);
    }
    if (naturalSlopes.size >= 96)
      naturalSlopes.delete(naturalSlopes.keys().next().value!);
    naturalSlopes.set(key, result);
    return result;
  }
  function topography(x: number, y: number): TopographyCell {
    const key = cellKey(x, y),
      old = reliefCache.get(key);
    if (old) return old;
    const c = rawCell(x, y);
    if (c.surface === "water" || c.bridge) {
      reliefCache.set(key, c);
      return c;
    }
    if (regional && regionalRoads(x, y).has(key)) {
      for (const [dx, dy, dir] of [
        [0, -1, "n"],
        [1, 0, "e"],
        [0, 1, "s"],
        [-1, 0, "w"],
      ] as const) {
        if (!regionalRoads(x + dx, y + dy).has(cellKey(x + dx, y + dy)))
          continue;
        const hi = rawCell(x + dx, y + dy),
          lo = rawCell(x - dx, y - dy);
        if (
          hi.height === c.height + 1 &&
          lo.height === c.height &&
          hi.surface !== "water" &&
          lo.surface !== "water"
        ) {
          const result = { ...c, ramp: dir };
          reliefCache.set(key, result);
          return result;
        }
      }
    }
    for (const plan of nearby(x, y)) {
      const slope = slopesFor(plan).get(key);
      if (slope) {
        const result = { ...c, ramp: slope };
        reliefCache.set(key, result);
        return result;
      }
    }
    if (
      environment &&
      [
        [0, -1],
        [1, 0],
        [0, 1],
        [-1, 0],
      ].some(
        ([dx, dy]) =>
          land.sample(x + dx, y + dy).elevation === c.height * 14 + 14,
      )
    ) {
      const slope = naturalSlopesFor(x, y).get(key);
      if (slope) c.ramp = slope;
    }
    if (reliefCache.size > 65536) reliefCache.clear();
    reliefCache.set(key, c);
    return c;
  }
  function planForEntity(id: string) {
    const m = /^s(-?\d+)_(-?\d+)/.exec(id);
    if (!m) return;
    const s = sitesIn(+m[1], +m[2]).find((s) => id.startsWith(`${s.id}-`));
    return s ? getPlan(s.cx, s.cy, s.id) : undefined;
  }
  function areaSites(area: GeographicArea) {
    const a = coord(area.x, area.y),
      b = coord(area.x + area.w, area.y + area.h);
    const out: Site[] = [];
    // A local query should not accidentally instantiate a continent's population.
    if ((b.x - a.x + 1) * (b.y - a.y + 1) > 256) return out;
    for (let cy = a.y; cy <= b.y; cy++)
      for (let cx = a.x; cx <= b.x; cx++) out.push(...sitesIn(cx, cy));
    return out;
  }
  const world: SettlementWorld = {
    ...(regional
      ? {
          geography: {
            packAt: regional.packAt,
            placesIn: (area: GeographicArea) => {
              const named = regional.activePlaces
                .map((p) => ({
                  id: p.id,
                  name: p.name,
                  ...regional.local(p),
                  radius: p.radius,
                  origin: "named" as const,
                }))
                .filter(
                  (p) =>
                    p.x + p.radius >= area.x &&
                    p.x - p.radius <= area.x + area.w &&
                    p.y + p.radius >= area.y &&
                    p.y - p.radius <= area.y + area.h,
                );
              const generated =
                area.w <= 3200 && area.h <= 3200
                  ? areaSites(area).map((s) => ({
                      id: s.id,
                      parentId: s.namedId,
                      name: s.name ?? "Unnamed settlement",
                      ...s.center,
                      radius: s.profile.radius,
                      origin: s.namedId
                        ? ("named" as const)
                        : ("procedural" as const),
                    }))
                  : [];
              return [...named, ...generated];
            },
            connectionsIn: (area: GeographicArea) =>
              transport!.connectionsIn(area),
            resourcesAt: (x: number, y: number) => {
              const f = land.sample(x, y),
                setting = regional.settingAt(x, y);
              const habitat = localEcology(
                setting,
                seed,
                x + land.origin.x,
                y + land.origin.y,
                f,
              );
              return {
                habitat,
                water: f.water < 10 ? f.kind : ("none" as const),
                potentials: [
                  ...ecologyProfiles[habitat].resources,
                  ...(ground(x, y) === "rock" ? ["stone"] : []),
                ],
              };
            },
          },
        }
      : {}),
    ...(environment ? { households: [] } : {}),
    generatorVersion: 3,
    ...(relief
      ? {
          topography,
          canCross: (
            from: { x: number; y: number },
            to: { x: number; y: number },
          ) => {
            return terrainStep(topography, from, to).allowed;
          },
        }
      : {}),
    pack,
    settlements: [],
    places: [],
    initialActors: [],
    initialObjects: [],
    enclosures: [],
    spawn: { x: 0, y: 0, space: "outside" },
    planAt: (x, y) => {
      const c = coord(x, y);
      const nearest = [...sitesIn(c.x, c.y)].sort(
        (a, b) =>
          Math.hypot(a.center.x - x, a.center.y - y) -
          Math.hypot(b.center.x - x, b.center.y - y),
      )[0];
      return nearest ? getPlan(c.x, c.y, nearest.id) : undefined;
    },
    terrain,
    decoration,
    overview: (x, y) => {
      if (regional)
        return regional.placeAt(x, y) &&
          !regional.landUse(x, y) &&
          land.sample(x, y).water >= 0
          ? "paving"
          : ground(x, y);
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
    place: (id) => planForEntity(id)?.places.find((p) => p.id === id),
    activitySites: (id) => {
      if (id === "player")
        return getPlan(
          startingSite?.cx ?? home.x,
          startingSite?.cy ?? home.y,
          startingSite?.id,
        )?.work.get(id);
      return planForEntity(id)?.work.get(id);
    },
    propSlots: (id) => {
      return planForEntity(id)?.slots.get(id);
    },
    protectedCell: (x, y) =>
      (!!regional && regionalRoads(x, y).has(cellKey(x, y))) ||
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
      if (environment) addWildResources(world, seed, x, y);
    },
    restoreDistricts: (ids) => {
      for (const id of ids) {
        const p = planForEntity(id);
        if (p) activate(p);
      }
    },
  };
  function activate(p: SettlementPlan) {
    if (active.has(p.site.id)) return;
    active.add(p.site.id);
    world.settlements.push({
      id: p.site.id,
      name:
        p.site.name ??
        (p.site.home ? pack.name : `${p.site.profile.pattern} settlement`),
      ...p.site.center,
      size: p.site.profile.radius,
    });
    world.places.push(...p.places);
    world.initialObjects.push(...p.objects);
    world.initialActors.push(...p.actors);
    if (environment) populateHouseholds(world, p, seed);
    world.enclosures.push(...p.enclosures);
  }
  const initial = getPlan(
    startingSite?.cx ?? home.x,
    startingSite?.cy ?? home.y,
    startingSite?.id,
  );
  if (!initial && !environment)
    throw Error("No usable settlement site near this location.");
  world.spawn = { ...(initial?.spawn ?? { x: 0, y: 0 }), space: "outside" };
  if (
    environment &&
    (environment.start !== "resident" ||
      !initial ||
      (regional && !initial.places.length))
  ) {
    let found = false;
    for (let r = 0; r <= (regional ? 768 : 120) && !found; r += 2)
      for (let i = 0; i < 24; i++) {
        const x = Math.round(Math.cos((i * Math.PI) / 12) * r),
          y = Math.round(Math.sin((i * Math.PI) / 12) * r);
        if (
          !world.blocked(x, y, "outside") &&
          land.sample(x, y).water > 3 &&
          (!initial ||
            Math.hypot(x - initial.site.center.x, y - initial.site.center.y) >
              initial.site.profile.radius * 0.75)
        ) {
          world.spawn = { x, y, space: "outside" };
          found = true;
          break;
        }
      }
    if (!found)
      throw Error(
        "No dry starting location found; try another seed or water setting.",
      );
  }
  world.activate!(world.spawn.x, world.spawn.y);
  if (environment?.start === "shepherd") {
    for (let i = 0; i < 3; i++) {
      const p = { ...world.spawn, x: world.spawn.x + i + 2 };
      if (world.blocked(p.x, p.y, "outside")) continue;
      world.initialActors.push({
        id: `travel-flock-${i}`,
        name: `Flock sheep ${i + 1}`,
        kind: "sheep",
        role: "Animal",
        sprite: "sheep",
        pos: p,
        home: { ...world.spawn },
        work: p,
        owner: "player",
        inventory: {},
        activity: "Grazing",
        fatigue: 0,
        hunger: 8,
        trust: 0,
        memories: [],
        direction: 0,
      });
    }
  }
  return world;
}
