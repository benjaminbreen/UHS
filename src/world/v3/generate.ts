import { herdersFor } from "./herders";
import { adjacentTerrain } from "../travel/terrain-preview";
import { waterDepthAt, MAX_WADING_DEPTH } from "../../core/water-field";
import { mapEntrances, type MapEntrance } from "../travel/entrances";
import { understorySize } from "../../content/ecology/vegetation";
import {
  broadleafAge,
  crownRadius,
  retainsTree,
  type TreeCandidate,
} from "./vegetation-spacing";
import {
  vegetationPattern,
  vegetationTree,
  vegetationUnderstory,
} from "../../content/ecology/vegetation";
import { trimCache } from "../../core/cache";
import type { Decoration } from "../../core/types";
import { preparedSite, type PreparedSettlement } from "./prepared";
import { pathArt } from "./path-art";
import { streetMaterial } from "../../content/settlements/streets";
import { crossingStyle, edgeStyle } from "../../content/settlements/terraces";
import { gravelBar, outcrop, saltPan, shrubColony } from "./features";
import { habitatAt, habitatTree } from "./habitats";
import { createRegionalContext } from "../regional/context";
import { regionalSettlements, shorePreference } from "../regional/settlements";
import { regionalTransport } from "../regional/transport";
import type { GeographicArea } from "../../core/geography";
import { createEnvironment, localEcology } from "./environment";
import { ecologyProfiles } from "../../content/ecology/profiles";
import { populateHouseholds, addWildResources } from "./population";
import { addBoulders } from "./boulders";
import { forgetFaunaBlock, spawnFauna } from "./fauna";
import { faunaAt, faunaProfile } from "../../content/fauna";
import type { FaunaGroup } from "../../core/fauna";
import { createReliefLandscape, reliefCell } from "./topography";
import {
  terrainStep,
  type HeightTier,
  type TopographyCell,
} from "../../core/topography";
import type { Pack, Place, Point, Terrain, WorldModel } from "../../core/types";
import {
  buildItinerary,
  DAY_MINUTES,
  itineraryAt,
  type Itinerary,
} from "../../core/itinerary";
import { route } from "../../core/routing";
import { CHUNK_SIZE } from "../../core/types";
import { random } from "../../core/random";
import { settlementProfile } from "../../content/settlements/profiles";
import { createLandscape } from "../geography/landscape";
import { noise } from "../geography/noise";
import { cellKey, type Road, type SettlementPlan, type Site } from "./types";
import { crossing, planRoad, roadCells } from "./roads";
import { planSettlement } from "./plan";
import { siteGate } from "./urban";
import { territoryReach, type FieldCell } from "./farmland";
import { cropStage } from "../../content/agriculture";
import { propDefs } from "../../content/props/catalog";
import { landPotential } from "./land-potential";
import { treePlacementEnvelope } from "./placement";
export const DISTRICT_SIZE = 384;
/** Residents per settlement given a full daily routine. Past this the rest keep
 * the simpler needs-driven behaviour; routing every resident of a large town
 * costs more than a frame has. */
const ROUTINE_BUDGET = 48;
export type SettlementWorld = WorldModel & {
  planAt(x: number, y: number): SettlementPlan | undefined;
  entrances(): MapEntrance[];
  prepare(): PreparedSettlement;
};
export function createSettlementWorld(
  pack: Pack,
  seed: string,
  prepared?: PreparedSettlement,
): SettlementWorld {
  const regional = pack.setting?.geographyRevision && !pack.setting.situation
    ? createRegionalContext(pack.setting)
    : undefined;
  const relief = !!pack.setting?.terrainRevision;
  const environment =
    pack.setting?.terrainRevision === 2 ? pack.setting.environment : undefined;
  const rawLand = environment
      ? createEnvironment(pack.setting!, seed, regional)
      : relief
        ? createReliefLandscape(pack.setting!, seed)
        : createLandscape(pack.setting!, seed),
    sites = new Map<string, Site | null>(prepared?.sites),
    plans = new Map<string, SettlementPlan>(prepared?.plans),
    links = new Map<string, Road[]>(prepared?.links),
    active = new Set<string>(prepared?.active);
  const half = pack.setting?.playableMap
    ? pack.setting.playableMap.size / 2
    : undefined;
  const inside = (x: number, y: number) =>
    half === undefined || (x >= -half && x < half && y >= -half && y < half);
  const rawPlanner = regional
    ? regionalSettlements(
        regional,
        rawLand.sample,
        seed,
        prepared?.regionalSites,
      )
    : undefined;
  const regionalPlanner =
    rawPlanner && half !== undefined
      ? {
          ...rawPlanner,
          sitesIn: (cx: number, cy: number) => {
            if (pack.setting?.environment?.population === "none") return [];
            const x = cx * DISTRICT_SIZE - rawLand.origin.x,
              y = cy * DISTRICT_SIZE - rawLand.origin.y;
            if (
              x >= half ||
              x + DISTRICT_SIZE < -half ||
              y >= half ||
              y + DISTRICT_SIZE < -half
            )
              return [];
            return rawPlanner
              .sitesIn(cx, cy)
              .filter(
                (s) =>
                  Math.abs(s.center.x) + s.profile.radius < half - 4 &&
                  Math.abs(s.center.y) + s.profile.radius < half - 4,
              );
          },
        }
      : rawPlanner;
  const transport =
    regional && regionalPlanner
      ? regionalTransport(regional, regionalPlanner.sitesIn, rawLand.sample)
      : undefined;
  const home = {
    x: Math.floor(rawLand.origin.x / DISTRICT_SIZE),
    y: Math.floor(rawLand.origin.y / DISTRICT_SIZE),
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
            // The place the player asked for, before the nearest; and its
            // city proper before one of its outlying quarters.
            Number(b.namedId === pack.setting?.placeId) -
              Number(a.namedId === pack.setting?.placeId) ||
            b.profile.radius - a.profile.radius ||
            Math.hypot(a.center.x, a.center.y) -
              Math.hypot(b.center.x, b.center.y) ||
            a.id.localeCompare(b.id),
        )[0]
    : undefined;
  if (startingSite) regionalPlanner!.setHome(startingSite.id);
  // Towns stand on straightened ground. Site choice reads the raw land, or
  // terracing would recurse into it.
  const terraces = !!pack.setting?.terraceRevision && !!environment;
  const land = terraces ? { ...rawLand, sample: terracedSample } : rawLand;
  const TERRACE_BLOCK = 6;
  const terraceReach = (s: Site) => Math.max(14, s.profile.radius * 0.62);
  const townBuckets = new Map<string, Site[]>();
  /** The settlement whose built ground covers this cell, if any. */
  function townAt(x: number, y: number): Site | undefined {
    const bx = Math.floor(x / 32),
      by = Math.floor(y / 32),
      key = cellKey(bx, by);
    let near = townBuckets.get(key);
    if (!near) {
      const c = coord(bx * 32 + 16, by * 32 + 16);
      near = [];
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++)
          for (const s of sitesIn(c.x + dx, c.y + dy))
            if (
              Math.hypot(s.center.x - bx * 32 - 16, s.center.y - by * 32 - 16) <
              terraceReach(s) + 24
            )
              near.push(s);
      townBuckets.set(key, near);
    }
    let best: Site | undefined,
      distance = Infinity;
    for (const s of near) {
      const d = Math.hypot(x - s.center.x, y - s.center.y);
      if (d < terraceReach(s) && d < distance) {
        best = s;
        distance = d;
      }
    }
    return best;
  }
  const terraceCache = new Map<string, ReturnType<typeof rawLand.sample>>();
  /** Inside a town the contour follows a coarse grid anchored on the centre,
   * so steps run straight for whole blocks and turn only at right angles. */
  function terracedSample(x: number, y: number) {
    const f = rawLand.sample(x, y);
    if (f.water < 2) return f;
    const s = townAt(x, y);
    if (!s) return f;
    const key = cellKey(x, y),
      old = terraceCache.get(key);
    if (old) return old;
    const B = TERRACE_BLOCK;
    const g = rawLand.sample(
      s.center.x + Math.floor((x - s.center.x) / B) * B + B / 2,
      s.center.y + Math.floor((y - s.center.y) / B) * B + B / 2,
    );
    const result =
      g.water < 2 || g.elevation === f.elevation
        ? f
        : { ...f, elevation: g.elevation };
    trimCache(terraceCache, 131072);
    terraceCache.set(key, result);
    return result;
  }
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
    if (pack.setting?.situation && (cx !== home.x || cy !== home.y)) return;
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
    // A configured shore sits about 35 tiles out; the ring must reach past it.
    const locations = Array.from({ length: 45 }, (_, i) => {
      const angle = i * 2.4,
        radius = i ? 8 + Math.floor(i / 5) * 6 : 0;
      return {
        x: Math.round((center.x + Math.cos(angle) * radius) / 2) * 2,
        y: Math.round((center.y + Math.sin(angle) * radius) / 2) * 2,
      };
    });
    if (environment) {
      const suitability = (p: { x: number; y: number }) => {
        const f = rawLand.sample(p.x, p.y),
          near = [
            [-6, -6],
            [6, -6],
            [-6, 6],
            [6, 6],
          ].map(([dx, dy]) => rawLand.sample(p.x + dx, p.y + dy));
        return (
          near.reduce(
            (n, q) =>
              n +
              (q.water < 5 ? 1000 : 0) +
              Math.abs(q.elevation - f.elevation) * 4,
            0,
          ) +
          shorePreference(f.water) * 0.15 +
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
      ].map(([x, y]) => rawLand.sample(p.x + x, p.y + y));
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
    // Aim at the built edge. A route to the centre of a town becomes its widest
    // street, on whatever bearing the neighbouring district happened to sit.
    const from = siteGate(a, a.pack ?? pack, b.center)?.point ?? a.center,
      to = siteGate(b, b.pack ?? pack, a.center)?.point ?? b.center;
    const r = planRoad(
      `${id}-road`,
      from,
      to,
      land.sample,
      new Set(),
      allowed,
      new Set(),
      bounds,
      1,
      4,
    );
    const result = r ? [...(bridge ? [bridge] : []), r] : [];
    trimCache(links, 128);
    links.set(id, result);
    return result;
  }
  const routines = new Map<string, Itinerary | undefined>();
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
    const others = [-1, 0, 1]
      .flatMap((dy) => [-1, 0, 1].flatMap((dx) => sitesIn(cx + dx, cy + dy)))
      .filter((o) => o.id !== s.id && o.accepts);
    const plan = planSettlement(
      s,
      s.pack ?? pack,
      seed,
      land.sample,
      connections,
      (x, y) => others.some((o) => o.accepts!(x, y)),
    );
    plans.set(s.id, plan);
    // Cells near this plan were decorated while it was still being drawn.
    decorations.clear();
    neighborCache.clear();
    if (plans.size > 48)
      for (const id of plans.keys())
        if (!active.has(id) && id !== s.id) {
          plans.delete(id);
          // Routines belong to the plan they were searched against. Kept past
          // it they are an unbounded leak, one entry per resident of every
          // settlement ever walked through; rebuilt after it they come from the
          // same seeded plan and the same terrain, so they come back identical.
          for (const rid of routines.keys())
            if (rid.startsWith(`${id}-`)) routines.delete(rid);
          for (const rid of dormant)
            if (rid.startsWith(`${id}-`)) dormant.delete(rid);
          routineRank.delete(id);
          routineOffset.delete(id);
          break;
        }
    return plan;
  }
  const yardIndex = new WeakMap<SettlementPlan, Map<string, string>>();
  /** Household plot cells by owner, built once per plan: a route search asks
   * for thousands of cells and a city has hundreds of plots. */
  function yardOwners(p: SettlementPlan) {
    let index = yardIndex.get(p);
    if (!index) {
      index = new Map();
      for (const plot of p.plots) {
        if (plot.kind !== "household" || !plot.owner) continue;
        for (let y = plot.y; y < plot.y + plot.h; y++)
          for (let x = plot.x; x < plot.x + plot.w; x++)
            index.set(cellKey(x, y), plot.owner);
      }
      yardIndex.set(p, index);
    }
    return index;
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
          // A plan's ground reaches 40 cells past its claim (fields, lanes
          // to the gates); anything further is another town's business, and
          // building it here is what made a city open its whole hinterland.
          const reach =
            s.profile.radius +
            8 +
            (s.profile.fields !== "none"
              ? Math.max(64, territoryReach(s.profile.radius, s.pack ?? pack))
              : 64);
          if (
            Math.abs(s.center.x - (bx * 64 + 32)) > reach ||
            Math.abs(s.center.y - (by * 64 + 32)) > reach
          )
            continue;
          const p = getPlan(s.cx, s.cy, s.id);
          if (p) result.push(p);
        }
      }
    trimCache(neighborCache, 96);
    neighborCache.set(key, result);
    return result;
  }
  const roadCache = new Map<string, Map<string, Terrain>>(prepared?.roads);
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
      trimCache(roadCache, 32);
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
    trimCache(roadCache, 32);
    roadCache.set(key, tiles);
    return tiles;
  }
  const previewNeighbor = pack.setting
    ? adjacentTerrain(pack.setting)
    : undefined;
  const settingAt = (x: number, y: number) =>
    pack.setting?.geographyMode === "configured"
      ? pack.setting
      : (regional?.settingAt(x, y) ?? pack.setting!);
  const habitatCache = new Map<string, ReturnType<typeof habitatAt>>();
  /** A settlement stands in a clearing: without this a woodland village is
   * drawn on forest-floor litter and never shows its grass. Reads sites, not
   * plans, because planning itself samples habitat. */
  function clearing(x: number, y: number) {
    const c = coord(x, y);
    let best = 0;
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++)
        for (const s of sitesIn(c.x + dx, c.y + dy)) {
          const r = s.profile.radius,
            d = Math.hypot(x - s.center.x, y - s.center.y);
          best = Math.max(best, Math.min(1, (r + 14 - d) / 18));
        }
    return best;
  }
  /** `wild` is the ground as it was before anyone cleared it: standing trees
   * are chosen from that, so a village keeps some of the wood it was cut from. */
  function habitat(x: number, y: number, wild = false) {
    const key = wild ? `w${cellKey(x, y)}` : cellKey(x, y);
    let value = habitatCache.get(key);
    if (!value) {
      const setting = settingAt(x, y);
      value = habitatAt(
        setting.environment!.ecology,
        setting.season,
        seed,
        x + land.origin.x,
        y + land.origin.y,
        land.sample(x, y),
        setting.environment!.colorway,
        wild ? 0 : clearing(x, y),
      );
      if (pack.setting?.ecologyRevision === 1 && regional)
        value.blend = regional.ecologyAt(x, y).parts;
      const pattern = value.site
        ? undefined
        : vegetationPattern(setting, land.sample(x, y));
      if (pattern) value.vegetation = pattern;
      if (value.vegetation === "savanna" || value.vegetation === "steppe") {
        value.exposed *= 0.55;
        value.cover = Math.min(1, value.cover * 1.3 + 0.12);
      } else if (value.vegetation === "alpine") {
        value.exposed = Math.min(1, value.exposed + 0.2);
        value.cover *= 0.45;
      }
      trimCache(habitatCache, 65536);
      habitatCache.set(key, value);
    }
    return value;
  }
  function ground(x: number, y: number): Terrain {
    const f = land.sample(x, y);
    if (
      !f.ecologyParts &&
      regional &&
      f.water >= (f.shoreWidth ?? 3) &&
      (regional.landUse(x, y) === "rock" ||
        ((f.summit ? f.elevation / f.summit >= 0.6 : f.elevation >= 28) &&
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
    if (f.travelRoad) return "dirt";
    if (regional?.landUse(x, y) === "fields" && f.water >= 0) return "field";
    if (environment && f.ecologyParts) {
      if (f.water < 0) return "water";
      if (f.snow) return "snow";
      const id = habitat(x, y).site!.primary;
      return id === "rocky"
        ? "rock"
        : id === "barren" || id === "shore"
          ? "sand"
          : ["marsh", "swamp", "bog"].includes(id)
            ? "marsh"
            : id === "scrub"
              ? "dry"
              : "grass";
    }
    if (environment) {
      const profile =
        ecologyProfiles[
          localEcology(
            settingAt(x, y),
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
  /** The crop on a cell, with its stage for this world's season, or the
   * ditch beside a lane. */
  function fieldAt(
    x: number,
    y: number,
  ):
    | (FieldCell & {
        stage: import("../../content/agriculture/types").CropStage;
        ditch?: boolean;
      })
    | undefined {
    const k = cellKey(x, y);
    for (const p of nearby(x, y)) {
      const cell = p.fields?.get(k);
      if (cell)
        return {
          ...cell,
          stage: cropStage(
            cell.crop,
            (pack.setting?.season ??
              "summer") as import("../../content/agriculture/types").Season,
            pack.setting?.lat ?? 0,
          ),
        };
    }
  }
  /** A canal cell: which way the water runs, from its neighbours, and
   * whether the channel has any water in it this season. */
  function canalAt(
    x: number,
    y: number,
  ): { axis: "x" | "y"; dry: boolean } | undefined {
    for (const p of nearby(x, y)) {
      if (!p.canals?.has(cellKey(x, y))) continue;
      const along =
        p.canals.has(cellKey(x + 1, y)) || p.canals.has(cellKey(x - 1, y));
      return { axis: along ? "x" : "y", dry: !!p.canalsDry };
    }
  }
  function terrain(x: number, y: number, space = "outside"): Terrain {
    if (space !== "outside") return "floor";
    const k = cellKey(x, y);
    let selected: Terrain | undefined;
    for (const p of nearby(x, y)) {
      const t = p.surface.get(k);
      if (t === "bridge") return t;
      if (t) selected = t;
      // A composed town paints its own ground; the worn disc is for the
      // older lattice, whose blocks left nothing between the streets.
      else if (
        p.site.profile.paved &&
        (pack.setting?.urbanRevision ?? 0) < 2 &&
        Math.hypot(x - p.site.center.x, y - p.site.center.y) <
          p.site.profile.radius * 0.52 &&
        land.sample(x, y).water >= 4
      )
        selected = "dirt";
    }
    return selected ?? regionalRoads(x, y).get(k) ?? ground(x, y);
  }
  const treeCandidates = new Map<string, TreeCandidate | null>();
  function candidate(x: number, y: number): TreeCandidate | undefined {
    const key = cellKey(x, y);
    if (treeCandidates.has(key)) return treeCandidates.get(key) ?? undefined;
    const ax = x + land.origin.x,
      ay = y + land.origin.y;
    const bx = Math.floor(ax / 2),
      by = Math.floor(ay / 2);
    let value: TreeCandidate | undefined;
    if (
      ax === bx * 2 + Math.floor(random(seed, "tree-x", bx, by) * 2) &&
      ay === by * 2 + Math.floor(random(seed, "tree-y", bx, by) * 2)
    ) {
      const f = land.sample(x, y),
        felled = clearing(x, y) * 0.6,
        h = habitat(x, y, true);
      if (
        f.water > (f.shoreWidth ?? 3) &&
        random(seed, "tree-felled", ax, ay) >= felled &&
        habitatTree(
          h,
          seed,
          ax,
          ay,
          h.blend?.reduce(
            (sum, p) => sum + ecologyProfiles[p.ecology].trees * p.weight,
            0,
          ) ?? ecologyProfiles[h.ecology].trees,
          (pack.setting?.vegetationRevision ?? 0) >= 5,
        )
      ) {
        let sprite = vegetationTree(
          settingAt(x, y),
          h,
          f,
          random(seed, "vegetation-species", ax, ay),
        );
        if (sprite === "nature-tropical-broadleaf")
          sprite = broadleafAge(random(seed, "tree-age", ax, ay));
        if (sprite)
          value = {
            sprite,
            radius: crownRadius(sprite),
            priority:
              random(seed, "tree-priority", ax, ay) +
              (sprite.endsWith("giant") ? 0.3 : 0),
          };
      }
    }
    trimCache(treeCandidates, 65536);
    treeCandidates.set(key, value ?? null);
    return value;
  }
  const placeBuckets = new WeakMap<SettlementPlan, Map<string, Place[]>>();
  /** Places of a plan within a 32-cell bucket and its neighbours. */
  function placesNear(plan: SettlementPlan, x: number, y: number) {
    let buckets = placeBuckets.get(plan);
    if (!buckets) {
      buckets = new Map();
      for (const b of plan.places)
        for (
          let by = Math.floor(b.y / 32);
          by <= Math.floor((b.y + b.h) / 32);
          by++
        )
          for (
            let bx = Math.floor(b.x / 32);
            bx <= Math.floor((b.x + b.w) / 32);
            bx++
          ) {
            const key = cellKey(bx, by),
              list = buckets.get(key) ?? [];
            list.push(b);
            buckets.set(key, list);
          }
      placeBuckets.set(plan, buckets);
    }
    const bx = Math.floor(x / 32),
      by = Math.floor(y / 32),
      out: Place[] = [];
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const list = buckets.get(cellKey(bx + dx, by + dy));
        if (list) out.push(...list);
      }
    return out;
  }
  function settledTree(x: number, y: number, tree: TreeCandidate) {
    let near = false;
    for (const plan of nearby(x, y))
      for (const b of placesNear(plan, x, y)) {
        const distance = Math.hypot(
          Math.max(b.x - x, 0, x - (b.x + b.w)),
          Math.max(b.y - y, 0, y - (b.y + b.h)),
        );
        if (distance < tree.radius + 2) return false;
        if (distance < tree.radius + 12) near = true;
      }
    if ((pack.setting?.vegetationRevision ?? 0) >= 7) {
      const envelope = treePlacementEnvelope(tree.sprite, { x, y }),
        visible = [...envelope.occupied, ...envelope.clearance];
      for (const p of visible) {
        const k = cellKey(p.x, p.y);
        if (
          regionalRoads(p.x, p.y).has(k) ||
          nearby(p.x, p.y).some((plan) => {
            const claims = plan.placement;
            return (
              (claims?.occupied ?? plan.solid).has(k) ||
              (claims?.access ?? plan.traffic).has(k) ||
              claims?.clearance.has(k)
            );
          })
        )
          return false;
      }
      return (
        !near ||
        random(seed, "settlement-tree", x + land.origin.x, y + land.origin.y) <
          0.35
      );
    }
    // Trees must not lean across a road immediately beside their trunk.
    for (const [dx, dy] of [
      [-2, 0],
      [2, 0],
      [0, -2],
      [0, 2],
    ]) {
      if (
        regionalRoads(x + dx, y + dy).has(cellKey(x + dx, y + dy)) ||
        nearby(x, y).some((p) =>
          ["dirt", "paving", "bridge"].includes(
            p.surface.get(cellKey(x + dx, y + dy)) ?? "",
          ),
        )
      )
        return false;
    }
    return (
      !near ||
      random(seed, "settlement-tree", x + land.origin.x, y + land.origin.y) <
        0.35
    );
  }
  const decorations = new Map<string, ReturnType<typeof decorate> | null>();
  /** Per cell, once: the renderer, the collision test and every route search
   * ask the same cell many times, and the answer only depends on plans that
   * nearby() has already built. */
  let decorationEdit:
    | ((
        x: number,
        y: number,
        base: Decoration | undefined,
      ) => Decoration | undefined)
    | undefined;
  function decoration(x: number, y: number) {
    const grown = generated(x, y);
    return decorationEdit ? decorationEdit(x, y, grown) : grown;
  }
  function generated(x: number, y: number) {
    if (environment && land.sample(x, y).travelRoad) return undefined;
    const k = cellKey(x, y);
    const old = decorations.get(k);
    if (old !== undefined) return old ?? undefined;
    const value = decorate(x, y, k);
    trimCache(decorations, 131072);
    decorations.set(k, value ?? null);
    return value;
  }
  function decorate(x: number, y: number, k: string) {
    const situation = pack.setting?.situation;
    if (situation?.landform === "islet") {
      const palms = Math.min(situation.palms, Math.max(1, Math.floor(situation.width / 5)));
      for (let i = 0; i < palms; i++) {
        const px = Math.round((i - (palms - 1) / 2) * 4), py = -1;
        if (x === px && y === py && land.sample(x, y).water >= 0)
          return { id: `islet-palm-${i}`, x, y, sprite: "nature-feather-palm", solid: true };
      }
      return;
    }
    if (situation?.landform === "open-ocean") return;
    if (situation?.camp && situation.camp !== "none" && Math.hypot(x, y) < 25) return;
    const f = land.sample(x, y);
    const scape = f.landscape;
    if (scape && scape.kind === "arroyo" && scape.strength > 0.35) return;
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
    const h = environment ? habitat(x, y) : undefined;
    if (
      h &&
      saltPan(
        seed,
        x + land.origin.x,
        y + land.origin.y,
        h.colorway,
        f.elevation === 0,
        h.wet,
        f.water,
      ) > 0.3
    )
      return;
    const n = random(
        seed,
        "v3-decoration",
        x + land.origin.x,
        y + land.origin.y,
      ),
      cover = noise(seed, x + land.origin.x, y + land.origin.y, 45, "woods");
    const spaced =
      (pack.setting?.vegetationRevision ?? 0) >= 2 && !!environment;
    const proposed = spaced ? candidate(x, y) : undefined;
    const tree = spaced
      ? !!proposed &&
        ground(x, y) !== "rock" &&
        settledTree(x, y, proposed) &&
        retainsTree(
          x,
          y,
          proposed,
          candidate,
          (pack.setting?.vegetationRevision ?? 0) >= 3
            ? (pack.setting?.vegetationRevision ?? 0) >= 4
              ? 0.92
              : 0.54
            : 0.45,
        )
      : (!regional || ground(x, y) !== "rock") &&
        (environment
          ? f.water > (f.shoreWidth ?? 3) &&
            habitatTree(
              h!,
              seed,
              x + land.origin.x,
              y + land.origin.y,
              ecologyProfiles[h!.ecology].trees,
            )
          : x % 3 === 0 && y % 3 === 0 && n < f.moisture * cover * 0.38);
    const sprite =
      relief && f.water < 3 && n < 0.05
        ? "rock"
        : relief && f.water < 8 && f.moisture > 0.68 && n < 0.12
          ? "reeds"
          : tree && environment
            ? ecologyProfiles[
                localEcology(
                  settingAt(x, y),
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
                  (environment
                    ? // Rocks belong to rocky ground: a trace elsewhere,
                      // real scatter only where exposure is high.
                      (0.0007 +
                        Math.max(0, h!.exposed - 0.3) * 0.03 +
                        outcrop(
                          seed,
                          x + land.origin.x,
                          y + land.origin.y,
                          h!.exposed,
                          f.summit ? f.elevation / f.summit : 0,
                        ) *
                          0.12) *
                      // Scree: what falls off a bank collects at its foot.
                      ([1, 2].some(
                        (d) => land.sample(x, y - d).elevation > f.elevation,
                      )
                        ? 3
                        : 1)
                    : 0.006)
                ? "rock"
                : n <
                    (environment
                      ? (0.003 +
                          Math.max(0, h!.cover - 0.35) *
                            0.16 *
                            (h!.ecology === "desert" ? 0.2 : 1)) *
                        shrubColony(
                          seed,
                          x + land.origin.x,
                          y + land.origin.y,
                        ) *
                        (scape?.kind === "arroyo" ? 3 : 1)
                      : 0.015)
                  ? "bush"
                  : relief && n < 0.016 && f.moisture > 0.5 && f.moisture < 0.73
                    ? "flowers"
                    : undefined;
    let selected = sprite;
    if (pack.setting?.vegetationRevision && environment) {
      const local = settingAt(x, y);
      const roll = random(
        seed,
        "vegetation-species",
        x + land.origin.x,
        y + land.origin.y,
      );
      if (tree && sprite !== "rock" && sprite !== "reeds")
        selected = spaced
          ? proposed?.sprite
          : vegetationTree(local, h!, f, roll);
      else if (sprite === "bush" || sprite === "flowers")
        selected = vegetationUnderstory(local, h!, f, roll);
      else if (
        !sprite &&
        f.water > (f.shoreWidth ?? 3) &&
        ground(x, y) !== "rock"
      ) {
        // Connected low vegetation patches share habitat cover, but independent
        // sampling keeps them from replacing rocks or changing tree collisions.
        // Colonies: whole patches of scrub with little between them.
        const density =
          ((h!.ecology === "desert"
            ? 0.006
            : h!.ecology === "tundra"
              ? 0.012
              : 0.018) +
            h!.cover * 0.035) *
          shrubColony(seed, x + land.origin.x, y + land.origin.y) *
          (scape?.kind === "arroyo" ? 3 : scape?.kind === "trail" ? 0.2 : 1);
        if (
          random(
            seed,
            "understory-presence",
            x + land.origin.x,
            y + land.origin.y,
          ) < density
        )
          selected = vegetationUnderstory(local, h!, f, roll);
      }
    }
    if (
      spaced &&
      !tree &&
      selected &&
      selected !== "rock" &&
      h?.kind === "woodland" &&
      random(seed, "forest-understory", x + land.origin.x, y + land.origin.y) >
        0.3
    )
      selected = undefined;
    // Thin all low scenery, including open ground outside woodland patches.
    if (
      (pack.setting?.vegetationRevision ?? 0) >= 3 &&
      !tree &&
      selected &&
      selected !== "rock" &&
      random(
        seed,
        "low-vegetation-thinning",
        x + land.origin.x,
        y + land.origin.y,
      ) >
        (h?.site
          ? 0.65
          : selected.includes("heath") || selected === "flowers"
            ? 0.15
            : 0.225)
    )
      selected = undefined;
    if (
      (pack.setting?.vegetationRevision ?? 0) >= 3 &&
      tree &&
      selected &&
      selected !== "rock" &&
      selected !== "reeds" &&
      random(
        seed,
        "tree-density-thinning",
        x + land.origin.x,
        y + land.origin.y,
      ) >=
        (h?.site ? 1 : (pack.setting?.vegetationRevision ?? 0) >= 4 ? 0.48 : 0.8)
    )
      selected = undefined;
    if (
      (pack.setting?.vegetationRevision ?? 0) >= 3 &&
      selected &&
      !tree &&
      selected !== "rock"
    )
      selected = understorySize(
        selected,
        random(seed, "understory-size", x + land.origin.x, y + land.origin.y),
      );
    // Shared low-frequency gaps keep clear ground between vegetation groups.
    if (
      (pack.setting?.vegetationRevision ?? 0) >= 4 &&
      selected &&
      selected !== "rock"
    ) {
      const patch = h?.site
        ? 1
        : noise(
            seed,
            x + land.origin.x,
            y + land.origin.y,
            22,
            "vegetation-openings",
          );
      if (
        patch < 0.4 ||
        (!tree &&
          !h?.site &&
          random(
            seed,
            "quiet-understory",
            x + land.origin.x,
            y + land.origin.y,
          ) > 0.55)
      )
        selected = undefined;
    }
    // Woodland floor: a log or stump now and then under a closed canopy.
    if (!selected && environment && !tree) {
      if (
        h?.kind === "woodland" &&
        h.cover > 0.6 &&
        random(seed, "woodland-floor", x + land.origin.x, y + land.origin.y) <
          0.012 * shrubColony(seed, x + land.origin.x + 37, y + land.origin.y)
      )
        selected =
          random(
            seed,
            "woodland-floor-kind",
            x + land.origin.x,
            y + land.origin.y,
          ) < 0.5
            ? "log"
            : "nature-stump";
    }
    return selected
      ? {
          id: `decor-${x}-${y}`,
          x,
          y,
          sprite: selected,
          solid: tree || selected === "rock" || selected === "nature-stump",
        }
      : undefined;
  }
  const reliefCache = new Map<string, TopographyCell>(prepared?.relief);
  const pathArtCache = new WeakMap<
    SettlementPlan,
    ReturnType<typeof pathArt>
  >();
  const roadCenters = new WeakMap<SettlementPlan, Set<string>>();
  const bridgeDecks = new WeakMap<SettlementPlan, Map<string, HeightTier>>();
  /** A deck sits at its higher bank's tier, and the road runs level for a few
   * cells off each end, so the only step is one road ramp beyond the approach. */
  function deckLevels(p: SettlementPlan) {
    const levels = new Map<string, HeightTier>();
    bridgeDecks.set(p, levels);
    const tier = (q: { x: number; y: number }) =>
      Math.round(land.sample(q.x, q.y).elevation / 14);
    for (const road of p.roads) {
      if (road.kind !== "bridge" || road.points.length < 2) continue;
      const a = road.points[0],
        b = road.points.at(-1)!;
      const level = Math.max(tier(a), tier(b)) as HeightTier;
      const dx = Math.sign(b.x - a.x),
        dy = Math.sign(b.y - a.y);
      const approach = [];
      for (let d = 1; d <= 3; d++)
        approach.push(
          { x: a.x - dx * d, y: a.y - dy * d },
          { x: b.x + dx * d, y: b.y + dy * d },
        );
      roadCells({ ...road, points: [...road.points, ...approach] }, (x, y) => {
        const k = cellKey(x, y);
        if (!levels.has(k)) levels.set(k, level);
      });
    }
    return levels;
  }
  const streetLevelCache = new WeakMap<SettlementPlan, Map<string, number>>();
  /** A street is level across its width: every cell of a cross-section takes
   * the centreline's tier, so a step meets a street square-on at a kerb and
   * never runs down the middle of one. */
  function streetLevels(p: SettlementPlan) {
    let levels = streetLevelCache.get(p);
    if (levels) return levels;
    levels = new Map();
    streetLevelCache.set(p, levels);
    for (const road of p.roads) {
      if (road.kind !== "street" && road.kind !== "lane") continue;
      for (const pt of road.points) {
        const f = land.sample(pt.x, pt.y);
        if (f.water < 0 || townAt(pt.x, pt.y)?.id !== p.site.id) continue;
        const tier = Math.round(f.elevation / 14);
        roadCells({ ...road, points: [pt] }, (a, b) => {
          const key = cellKey(a, b);
          if (!levels!.has(key)) levels!.set(key, tier);
        });
      }
    }
    // Footways beside the carriageway take its level.
    for (let pass = 0; pass < 2; pass++) {
      const next: [string, number][] = [];
      for (const key of p.pavement?.keys() ?? []) {
        if (levels.has(key)) continue;
        const [a, b] = key.split(",").map(Number);
        for (const [dx, dy] of [
          [0, -1],
          [1, 0],
          [0, 1],
          [-1, 0],
        ]) {
          const near = levels.get(cellKey(a + dx, b + dy));
          if (near === undefined) continue;
          next.push([key, near]);
          break;
        }
      }
      for (const [key, tier] of next) levels.set(key, tier);
    }
    return levels;
  }
  function rawCell(x: number, y: number): TopographyCell {
    const f = land.sample(x, y);
    let t = terrain(x, y);
    // A deck's ends rest on the banks; only the span over water is timber.
    if (t === "bridge" && f.water >= 0) t = "dirt";
    let height = Math.round(f.elevation / 14) as HeightTier;
    if (terraces && f.water >= 0)
      for (const p of nearby(x, y)) {
        const level = streetLevels(p).get(cellKey(x, y));
        if (level === undefined) continue;
        height = level;
        break;
      }
    let decked = false;
    for (const p of nearby(x, y)) {
      let deck = bridgeDecks.get(p);
      if (!deck) deck = deckLevels(p);
      const level = deck.get(cellKey(x, y));
      if (level === undefined) continue;
      height = level;
      decked = true;
      break;
    }
    if (t === "bridge" && !decked) height = 1;
    const cell = reliefCell(height, f.water, f.moisture);
    if (environment) {
      cell.habitat = habitat(x, y);
      if ((pack.setting?.vegetationRevision ?? 0) >= 2)
        cell.habitat = { ...cell.habitat, layeredForest: true };
      {
        const h = cell.habitat;
        const ax = x + land.origin.x,
          ay = y + land.origin.y;
        let scape = f.landscape;
        if (!scape && f.water >= (f.shoreWidth ?? 3)) {
          const pan = saltPan(
            seed,
            ax,
            ay,
            h.colorway,
            f.elevation === 0,
            h.wet,
            f.water,
          );
          const rocky = outcrop(
            seed,
            ax,
            ay,
            h.exposed,
            f.summit ? f.elevation / f.summit : 0,
          );
          if (pan) scape = { kind: "pan", strength: pan };
          else if (rocky) scape = { kind: "outcrop", strength: rocky };
          else {
            // Trodden ground at the feet of buildings: distance to the nearest
            // built cell, roughened so the wear is a blotch rather than a frame.
            let near = 9;
            for (const p of nearby(x, y)) {
              const built = p.built ?? p.solid;
              if (!built.size) continue;
              for (let dy = -3; dy <= 3 && near > 1; dy++)
                for (let dx = -3; dx <= 3; dx++) {
                  if (Math.abs(dx) + Math.abs(dy) >= near) continue;
                  if (built.has(cellKey(x + dx, y + dy)))
                    near = Math.abs(dx) + Math.abs(dy);
                }
            }
            if (near < 4) {
              const trample =
                1 - near / 4 + (noise(seed, ax, ay, 4, "trample") - 0.5) * 0.7;
              if (trample > 0.25)
                scape = { kind: "trample", strength: Math.min(1, trample) };
            }
          }
        }
        if (scape) cell.landscape = scape;
      }
      cell.waterVisual = {
        distance: f.water,
        kind: f.kind,
        ecology: cell.habitat?.ecology ?? settingAt(x, y).environment!.ecology,
        shoreWidth: f.shoreWidth ?? 3,
        flow: f.waterFlow ?? [0, 1],
        frozenMargin: f.snow,
        ...(f.waterGradient ? { gradient: f.waterGradient } : {}),
      };
      cell.biome = cell.habitat.site
        ? cell.habitat.ecology
        : localEcology(
            settingAt(x, y),
            seed,
            x + (regional ? land.origin.x : 0),
            y + (regional ? land.origin.y : 0),
            f,
          );
      const eco = ecologyProfiles[cell.biome];
      if (f.water >= 0)
        cell.surface = f.snow
          ? "snow"
          : f.travelRoad
            ? "soil"
            : cell.habitat.site
              ? t === "rock"
                ? "gravel"
                : t === "marsh"
                  ? "damp"
                  : t === "sand"
                    ? "sand"
                    : t === "dry"
                      ? "dry"
                      : "grass"
              : eco.surface;
      // A creek's edge is painted per pixel by the ground raster (a dark wet
      // line and stones on turf); marking whole cells as gravel drew a
      // stepped grey band along it.
      if (
        f.water >= 0 &&
        f.water < (f.shoreWidth ?? 3) &&
        (f.shoreWidth ?? 3) >= 1.2
      ) {
        const shoreEcology = settingAt(x, y).environment!.ecology;
        const stonyShore =
          shoreEcology === "tundra" ||
          shoreEcology === "boreal-woodland" ||
          (f.kind === "sea" &&
            shoreEcology !== "desert" &&
            shoreEcology !== "tropical-woodland" &&
            (f.shoreWidth ?? 3) < 5);
        cell.surface =
          f.kind === "river" ||
          stonyShore ||
          gravelBar(seed, x + land.origin.x, y + land.origin.y)
            ? "gravel"
            : "sand";
        if (cell.surface === "gravel") cell.feature = "bank";
      }
    } else if (height === 0 && f.water >= 0) cell.surface = "gravel";
    if (t === "bridge") return { ...cell, surface: "soil", bridge: true };
    if (t === "field") {
      cell.surface = "soil";
      cell.feature = "field";
    }
    const farmed = fieldAt(x, y);
    if (farmed) cell.field = farmed;
    const canal = canalAt(x, y);
    if (canal && cell.waterVisual) {
      // A dry channel keeps walkable ground: only the bed's art changes.
      if (canal.dry) cell.dryChannel = true;
      else {
        cell.surface = "water";
        cell.waterDepth = "shallow";
      }
      cell.waterVisual = {
        ...cell.waterVisual,
        distance: canal.dry ? 1 : -1,
        kind: "canal",
        shoreWidth: 1,
        flow: canal.axis === "x" ? [1, 0] : [0, 1],
      };
    }
    if (t === "rock") cell.surface = "gravel";
    if (t === "paving") {
      cell.surface = environment ? "gravel" : "soil";
      if (environment) {
        cell.feature = "paving";
        cell.streetMaterial = streetMaterial(settingAt(x, y));
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
    if (pack.setting?.urbanRevision) {
      for (const p of nearby(x, y)) {
        const key = cellKey(x, y);
        const material = p.streetSurfaces?.get(key);
        if (material && cell.feature === "paving") {
          if (material === "earth") {
            cell.surface = "soil";
            delete cell.feature;
            delete cell.streetMaterial;
          } else cell.streetMaterial = material;
        }
        if (p.pavement?.has(key)) cell.pavement = p.pavement.get(key);
        // Authored block ground and courts are areas, not thin paths. Preserve
        // their extent instead of reinterpreting only road centers as worn soil.
        if (t === "dirt" && p.surface.get(key) === "dirt" && !!p.pavement?.size)
          cell.surface = "soil";
      }
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
          index = pathArt(
            p.site.profile.paved ? [] : p.roads,
            !!pack.setting?.roadRevision,
          );
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
    if (terraces && cell.surface !== "water") {
      const town = townAt(x, y);
      if (town) {
        const eco = cell.habitat?.ecology;
        cell.edge = edgeStyle(
          town.pack?.setting ?? settingAt(x, y),
          eco === "boreal-woodland" || eco === "tundra",
        );
      }
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
        // The whole street climbs, kerb to kerb, not a notch in its middle.
        if (terraces) {
          const levels = streetLevels(plan);
          for (const sign of [-1, 1])
            for (let k = 1; k <= 8; k++) {
              const qx = p.x + sign * k * Math.abs(dy),
                qy = p.y + sign * k * Math.abs(dx);
              if (
                !levels.has(cellKey(qx, qy)) ||
                rawCell(qx, qy).height !== c.height ||
                rawCell(qx + dx, qy + dy).height !== hi.height ||
                rawCell(qx - dx, qy - dy).height !== c.height
              )
                break;
              result.set(cellKey(qx, qy), dir);
            }
        }
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
        width: number;
      }
    >();
    // Select stable openings on actual contours, never at fixed grid lines.
    // One to three cells wide, so passes are not all the same notch.
    for (let py = by; py < by + 32; py++)
      for (let px = bx; px < bx + 32; px++) {
        const c = land.sample(px, py);
        if (c.water < 0) continue;
        const roll = random(seed, "pass-width", px, py);
        // Terraced worlds favour broad grass slopes over notches.
        const width = terraces
          ? roll < 0.3
            ? 2
            : roll < 0.6
              ? 3
              : roll < 0.85
                ? 4
                : 6
          : roll < 0.25
            ? 1
            : roll < 0.75
              ? 2
              : 3;
        for (const [dx, dy, dir] of [
          [0, -1, "n"],
          [1, 0, "e"],
          [0, 1, "s"],
          [-1, 0, "w"],
        ] as const) {
          const tx = Math.abs(dy),
            ty = Math.abs(dx);
          if (
            px + tx * (width - 1) >= bx + 32 ||
            py + ty * (width - 1) >= by + 32
          )
            continue;
          const hi = land.sample(px + dx, py + dy);
          if (hi.elevation !== c.elevation + 14 || hi.water < 0) continue;
          if (
            !Array.from({ length: width }, (_, k) => k).every((k) =>
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
            best.set(c.elevation, { x: px, y: py, dx, dy, dir, score, width });
        }
      }
    for (const p of best.values())
      for (let k = 0; k < p.width; k++)
        result.set(
          cellKey(p.x + k * Math.abs(p.dy), p.y + k * Math.abs(p.dx)),
          p.dir,
        );
    if (naturalSlopes.size >= 96)
      naturalSlopes.delete(naturalSlopes.keys().next().value!);
    naturalSlopes.set(key, result);
    return result;
  }
  /** The cliff and the country decide the ramp's form: a grassy slope in
   * open country, a cut earth ramp for roads, stone steps in a paved town,
   * timber revetment in cold settlements, a sand slump in the desert. */
  function rampStyleFor(
    c: TopographyCell,
    use: "natural" | "road" | "town" | "paved",
    x: number,
    y: number,
  ): NonNullable<TopographyCell["rampStyle"]> {
    const eco = c.habitat?.ecology;
    if (eco === "desert") return "sand";
    if (use === "natural") return "slope";
    if (terraces) {
      const style = crossingStyle(
        settingAt(x, y),
        use === "paved" || c.feature === "paving",
      );
      if (style !== "cut") return style;
      if (use === "paved") return "cut";
    }
    if (use === "paved") return "steps";
    if (use === "town" && (eco === "boreal-woodland" || eco === "tundra"))
      return "timber";
    return "cut";
  }
  function topography(x: number, y: number): TopographyCell {
    if (
      half !== undefined &&
      (Math.abs(x) > half + 32 || Math.abs(y) > half + 32)
    )
      return { height: 0, surface: "water" };
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
          const result = {
            ...c,
            ramp: dir,
            rampStyle: rampStyleFor(c, "road", x, y),
          };
          reliefCache.set(key, result);
          return result;
        }
      }
    }
    for (const plan of nearby(x, y)) {
      const slope = slopesFor(plan).get(key);
      if (slope) {
        const result = {
          ...c,
          ramp: slope,
          rampStyle: rampStyleFor(
            c,
            plan.site.profile.paved ? "paved" : "town",
            x,
            y,
          ),
        };
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
      if (slope) {
        c.ramp = slope;
        c.rampStyle = rampStyleFor(c, "natural", x, y);
      }
    }
    trimCache(reliefCache, 65536);
    reliefCache.set(key, c);
    return c;
  }
  const routineRank = new Map<string, string[]>();
  // Start of the active window over each settlement's ranked residents.
  const routineOffset = new Map<string, number>();
  const dormant = new Set<string>();
  /** Retires the oldest active resident once they are resting at home and
   * wakes the next dormant one, so the crowd turns over without anyone
   * vanishing mid-street. One swap per settlement per call. */
  function rotateRoutines(clock: number) {
    for (const [key, ranked] of routineRank) {
      const n = ranked.length;
      if (n <= ROUTINE_BUDGET) continue;
      const offset = routineOffset.get(key) ?? 0;
      const retiring = ranked[offset];
      const it = routines.get(retiring);
      if (it && itineraryAt(it, clock).activity !== "rest") continue;
      routineOffset.set(key, (offset + 1) % n);
      routines.set(retiring, undefined);
      dormant.add(retiring);
      const waking = ranked[(offset + ROUTINE_BUDGET) % n];
      routines.delete(waking);
      dormant.delete(waking);
    }
  }
  /** Legs are searched once per resident and then never again: a routine is
   * read back with a binary search, so the crowd costs nothing per tick.
   *
   * Building them is budgeted, because a large town holds more residents than
   * a frame can afford to route. The budget counts residents and picks them in
   * a fixed order rather than measuring the wall clock: the simulation asks for
   * a routine every tick and moves the resident differently when there is none,
   * so a clock-based budget decided how a world evolved by how busy the machine
   * was, and `offRoutine` then wrote that into the saved state. */
  function routineFor(id: string) {
    if (routines.has(id)) return routines.get(id);
    const plan =
      id === "player"
        ? getPlan(
            startingSite?.cx ?? home.x,
            startingSite?.cy ?? home.y,
            startingSite?.id,
          )
        : planForEntity(id);
    const stations = plan?.stations.get(id);
    const site = plan?.work.get(id);
    // Whether this resident is inside the settlement's budget, decided by a
    // fixed order over its own residents so the answer never depends on who
    // asked first or on how long the last search took.
    if (plan && id !== "player") {
      const key = plan.site.id;
      let ranked = routineRank.get(key);
      if (!ranked) {
        ranked = [...plan.stations.keys()].sort();
        routineRank.set(key, ranked);
      }
      const rank = ranked.indexOf(id);
      const offset = routineOffset.get(key) ?? 0;
      if (
        rank < 0 ||
        (rank - offset + ranked.length) % ranked.length >= ROUTINE_BUDGET
      ) {
        routines.set(id, undefined);
        if (rank >= 0) dormant.add(id);
        return undefined;
      }
    }
    let built: Itinerary | undefined;
    if (stations && site && stations.length > 1) {
      // Buildings and terrain are in world.blocked; the furniture the plan puts
      // in a yard is not, and a routine that walked through a loom would be
      // worse than one that goes round it.
      const furniture = new Set(
        plan!.objects
          .filter(
            (o) =>
              o.pos.space === "outside" &&
              ((o.prop && propDefs[o.prop]?.solid && !o.broken) ||
                o.kind === "well" ||
                o.kind === "fire"),
          )
          .map((o) => cellKey(o.pos.x, o.pos.y)),
      );
      const leg = (from: Point, to: Point) => {
        if (from.x === to.x && from.y === to.y) return [];
        const goal = cellKey(to.x, to.y);
        const result = route(
          from,
          to,
          (p) =>
            world.blocked(p.x, p.y, "outside") ||
            (furniture.has(cellKey(p.x, p.y)) && cellKey(p.x, p.y) !== goal)
              ? Infinity
              : (world.navigationCost?.(p.x, p.y, id) ?? 1),
          {
            // Work outside the settlement means legs of a hundred tiles or
            // more; a flat budget only ever found the ones close to home.
            maxNodes: Math.min(
              12000,
              1500 + (Math.abs(from.x - to.x) + Math.abs(from.y - to.y)) * 70,
            ),
            minCost: 1,
            bounds: {
              x: Math.min(from.x, to.x) - 40,
              y: Math.min(from.y, to.y) - 40,
              w: Math.abs(from.x - to.x) + 80,
              h: Math.abs(from.y - to.y) + 80,
            },
          },
        );
        return result.status === "found" ? result.path : undefined;
      };
      // A station the resident cannot actually walk to is dropped rather than
      // teleported through: the routine shortens, the route stays honest.
      const reachable: typeof stations = [];
      const legs: Point[][] = [];
      let at = stations[stations.length - 1].pos;
      for (const station of stations) {
        const path = leg(at, station.pos);
        if (!path) continue;
        reachable.push(station);
        legs.push(path);
        at = station.pos;
      }
      if (reachable.length > 1)
        built = buildItinerary(
          reachable,
          (1230 + site.offset) % DAY_MINUTES,
          (_from, to) => legs[reachable.findIndex((s) => s.pos === to)] ?? [],
          random(seed, "day-phase", id),
        );
    }
    if (!built && (globalThis as Record<string, unknown>).__routineDebug)
      console.log(
        "no routine",
        id,
        "plan",
        !!plan,
        "stations",
        plan?.stations.get(id)?.length,
        "work",
        !!plan?.work.get(id),
      );
    routines.set(id, built);
    return built;
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
  let entranceCache = prepared?.entrances;
  const entrances = () =>
    (entranceCache ??= pack.setting?.playableMap
      ? mapEntrances(
          world,
          pack.setting.playableMap.size,
          pack.setting.playableMap.exits,
        )
      : []);
  const keptFauna: FaunaGroup[] = [];
  const world: SettlementWorld = {
    entrances,
    prepare: () => ({
      entrances: entrances(),
      // The starting town's routines are searched here, off the main thread,
      // so arrival costs a lookup rather than seconds of path searches.
      routines: [...routines].filter(([id]) =>
        startPlan()?.actors.some((a) => a.id === id),
      ),
      dormant: [...dormant].filter((id) =>
        startPlan()?.actors.some((a) => a.id === id),
      ),
      sites: [...sites].map(([key, s]) => [key, s ? preparedSite(s) : null]),
      regionalSites: regionalPlanner?.prepare(),
      plans: [...plans].map(([key, p]) => [
        key,
        { ...p, site: preparedSite(p.site) },
      ]),
      links: [...links],
      roads: [...roadCache],
      relief: [...reliefCache],
      active: [...active],
      initial: {
        spawn: world.spawn,
        settlements: world.settlements,
        places: world.places,
        initialActors: world.initialActors,
        initialObjects: world.initialObjects,
        enclosures: world.enclosures,
        households: world.households,
      },
    }),
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
            landPotentialAt: (x: number, y: number) =>
              landPotential(land.sample(x, y), habitat(x, y)),
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
            return (
              inside(to.x, to.y) && terrainStep(topography, from, to).allowed
            );
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
      // The site whose claim holds the cell, before the nearest centre: a
      // city's quarter can be nearer than the city it belongs to.
      const nearest = [...sitesIn(c.x, c.y)].sort(
        (a, b) =>
          Number(b.accepts?.(x, y) ?? false) -
            Number(a.accepts?.(x, y) ?? false) ||
          Math.hypot(a.center.x - x, a.center.y - y) -
            Math.hypot(b.center.x - x, b.center.y - y),
      )[0];
      return nearest ? getPlan(c.x, c.y, nearest.id) : undefined;
    },
    terrain: (x, y, space = "outside") =>
      space !== "outside" || inside(x, y) ? terrain(x, y, space) : "water",
    decoration: (x, y) => (inside(x, y) ? decoration(x, y) : undefined),
    overrideDecoration: (fn) => {
      decorationEdit = fn;
    },
    habitatAt: (x, y) => {
      if (!inside(x, y) || !environment) return undefined;
      const site = habitat(x, y).site;
      if (!site) return undefined;
      const cell = world.topography!(x, y),
        t = terrain(x, y);
      return {
        ...site,
        landUse:
          cell.field || t === "field"
            ? "cultivated"
            : cell.solid || ["floor", "paving", "bridge", "dirt"].includes(t)
              ? "built"
              : "natural",
      };
    },
    mapTerrain: (x, y) => {
      const neighbor = previewNeighbor?.(x, y);
      if (neighbor) return neighbor;
      // Past the playable map with no neighbouring region sited here, there is
      // nothing to generate from: the caller paints coarse atlas ground rather
      // than pay a noise sample per pixel for terrain the region never covered.
      const half =
        pack.setting?.playableMap && pack.setting.playableMap.size / 2;
      if (half && (x < -half || x >= half || y < -half || y >= half))
        return undefined;
      return {
        terrain: ground(x, y),
        habitat: environment ? habitat(x, y) : undefined,
      };
    },
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
    regionExtent: half ?? 1600,
    elevation: (x, y) => land.sample(x, y).elevation,
    moisture: (x, y) => land.sample(x, y).moisture,
    riverX: () => Infinity,
    blocked: (x, y, space) =>
      space !== "outside"
        ? x < 1 || x > 11 || y < 1 || y > 9
        : !inside(x, y) ||
          Math.abs(x + land.origin.x) > 180 * 2048 ||
          Math.abs(y + land.origin.y) > 85 * 2048 ||
          (relief
            ? waterDepthAt(topography, x + 0.5, y + 0.5) > MAX_WADING_DEPTH
            : terrain(x, y) === "water") ||
          nearby(x, y).some((p) => p.solid.has(cellKey(x, y))) ||
          !!decoration(x, y)?.solid,
    chunk: (cx, cy) =>
      Array.from({ length: CHUNK_SIZE * CHUNK_SIZE }, (_, i) =>
        world.terrain(
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
    itinerary: (id) => routineFor(id),
    routinePending: (id) => !routines.has(id),
    dormant: (id) => dormant.has(id),
    rotateRoutines,
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
      const privateYard = nearby(x, y).some((p) => {
        const owner = yardOwners(p).get(cellKey(x, y));
        return owner !== undefined && owner !== actorId;
      });
      if (!privateYard && (t === "paving" || t === "dirt" || t === "bridge"))
        return 1;
      return (privateYard ? 2.8 : 1.8) + (t === "marsh" ? 2 : 0);
    },
    activate: (x, y) => {
      for (const p of nearby(x, y)) activate(p);
      if (environment && !pack.setting?.situation) {
        addWildResources(world, seed, x, y);
        addBoulders(world, seed, x, y);
      }
    },
    fauna: (x, y) => [
      ...keptFauna,
      ...(environment && !pack.setting?.situation ? attended(spawnFauna(world, seed, x, y)) : []),
    ],
    forgetFauna: (block) => forgetFaunaBlock(world, block),
    restoreDistricts: (ids) => {
      for (const id of ids) {
        const p = planForEntity(id);
        if (p) activate(p);
      }
    },
  };
  /** Stock at grass has someone with it. The people go on the world's list of
   * actors, which the engine reads again after it has asked for the animals. */
  function attended(groups: FaunaGroup[]) {
    const out = [...groups];
    for (const herd of groups) {
      const profile = faunaProfile(herd.speciesId);
      if (!profile?.keeping?.ranging || profile.density > 0) continue;
      const setting = (
        world.geography?.packAt(herd.pos.x, herd.pos.y) ?? world.pack
      ).setting;
      if (!setting) continue;
      const { actors, dog } = herdersFor(world, seed, herd, setting);
      world.initialActors.push(...actors);
      if (dog) out.push(dog);
    }
    return out;
  }
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
    keptFauna.push(...(p.fauna ?? []));
    if (environment) populateHouseholds(world, p, seed);
    world.enclosures.push(...p.enclosures);
  }
  /** The starting town's plan, once the world has one. */
  const startPlan = () =>
    startingSite ? plans.get(startingSite.id) : plans.get([...active][0] ?? "");
  /** Routines for the starting town are searched at creation, in both the
   * worker and the synchronous path, so the two agree on who has one from the
   * first tick and arrival costs a lookup rather than seconds of searches. */
  const warmRoutines = () => {
    for (const a of startPlan()?.actors ?? [])
      if (a.kind === "human") routineFor(a.id);
  };
  if (prepared) {
    Object.assign(world, prepared.initial);
    for (const [id, itinerary] of prepared.routines ?? [])
      routines.set(id, itinerary);
    for (const id of prepared.dormant ?? []) dormant.add(id);
    if (!prepared.routines) warmRoutines();
    return world;
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
    !pack.setting?.situation &&
    (environment.start !== "resident" ||
      !initial ||
      (regional && !initial.places.length))
  ) {
    let clear: { x: number; y: number } | undefined,
      anyDry: { x: number; y: number } | undefined;
    // A traveller arrives at the edge of the place they asked for, not at
    // whatever lies nearest the map origin. A world configured without people
    // has no such place: the nearest site is a neighbour outside the empty ring.
    const from =
      initial && pack.setting?.environment?.population !== "none"
        ? initial.site.center
        : { x: 0, y: 0 };
    for (let r = 0; r <= (regional ? 768 : 120) && !clear; r += 2) {
      // Probe count scales with circumference: at 0.8 rays per unit radius the
      // probes sit ~8 cells apart, which steps clean over a small island or a
      // spit between two bays. 3.2 keeps them ~2 cells apart.
      const steps = Math.max(24, Math.round(r * 3.2));
      for (let i = 0; i < steps; i++) {
        const a = (i * 2 * Math.PI) / steps,
          x = from.x + Math.round(Math.cos(a) * r),
          y = from.y + Math.round(Math.sin(a) * r);
        if (!inside(x, y) || land.sample(x, y).water <= 3) continue;
        if (world.blocked(x, y, "outside")) continue;
        // Outside the town, but not inside the neighbouring one.
        const claim = regional?.placeAt(x, y);
        if (claim && claim.id !== initial?.site.namedId) continue;
        if (
          !initial ||
          Math.hypot(x - initial.site.center.x, y - initial.site.center.y) >
            initial.site.profile.radius * 0.75
        ) {
          clear = { x, y };
          break;
        }
        // Islands and narrow coastal strips can have no dry ground outside the
        // settlement; standing in town beats refusing to start.
        if (!anyDry) anyDry = { x, y };
      }
    }
    // The rings still sample, not cover. On an island or a harbour shore the
    // dry ground can be a handful of cells that every ray misses, so fall back
    // to looking at each cell in turn near the target before giving up.
    if (!clear && !anyDry)
      for (let r = 1; r <= 96 && !anyDry; r++)
        for (let dx = -r; dx <= r && !anyDry; dx++)
          for (let dy = -r; dy <= r; dy++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
            const x = from.x + dx,
              y = from.y + dy;
            if (!inside(x, y) || land.sample(x, y).water <= 3) continue;
            if (world.blocked(x, y, "outside")) continue;
            anyDry = { x, y };
            break;
          }
    // Last resort: the settlement's own spawn is dry by construction.
    const spot = clear ?? anyDry ?? initial?.spawn;
    if (!spot)
      throw Error(
        "No dry starting location found; try another seed or water setting.",
      );
    world.spawn = { ...spot, space: "outside" };
  }
  if (pack.setting?.situation?.landform === "islet")
    world.spawn = { x: 0, y: 1, space: "outside" };
  if (pack.setting?.situation?.landform === "open-ocean")
    world.spawn = { x: 0, y: 0, space: "outside" };
  world.activate!(world.spawn.x, world.spawn.y);
  if (environment?.start === "shepherd") {
    // The player's own flock, as a fauna group rather than three actors: it is
    // the same animal the pens hold, drawn from the same art.
    const flockSpecies = (pack.setting ? faunaAt(pack.setting) : []).find(
      (k) => k.keeping?.place === "pen",
    );
    const members = [];
    for (let i = 0; i < 4; i++) {
      const p = { x: world.spawn.x + 2 + (i % 2), y: world.spawn.y + (i >> 1) };
      if (world.blocked(p.x, p.y, "outside")) continue;
      members.push({ ...p, direction: 1 as const });
    }
    if (flockSpecies && members.length)
      keptFauna.push({
        id: "travel-flock",
        speciesId: flockSpecies.id,
        members,
        pos: { ...members[0], space: "outside" },
        home: { ...world.spawn },
        homeRadius: 6,
        state: flockSpecies.art.graze ? "graze" : "forage",
        nextDecisionAt: 0,
        stride: 0,
        since: 0,
        owner: "player",
      });
  }
  // After the households are in, so the ranked list of residents is complete.
  warmRoutines();
  return world;
}
