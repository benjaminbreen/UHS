import { ecoregionNear } from "../../content/geography/ecoregions";
import { noise } from "../geography/noise";
import {
  ecologyProfiles,
  type Ecology,
  type Colorway,
} from "../../content/ecology/profiles";
import { geographicClimate } from "../geography/climate";
import { resolveCharacterContext } from "../../content/characters/resolve";
import { trimCache } from "../../core/cache";
import type { Pack } from "../../core/types";
import type { WorldSetting } from "../../content/geography/types";
import type {
  Coordinate,
  RegionalPlace,
  RegionalFeature,
  RegionalProfile,
} from "../../content/geography/regions/types";
import { regionalProfiles } from "../../content/geography/regions";
import { places } from "../../content/geography/places";
import { cityPopulation } from "../../content/settlements/city-populations";
import { containsDate } from "../../content/history/dates";
import { environmentFor } from "../../content/geography/defaults";
import { packForSetting } from "../../content/geography/pack";
import { broadEnvironment, toAtlas, fromAtlas } from "../geography/atlas";
import { inBounds, inPolygon, nearestSegment } from "./geometry";

export const REGION_CELL = 384;
/** Cells the neighbour's ecology takes to fade out at a seam's two ends. */
export const SEAM_FADE = 56;
export function createRegionalContext(start: WorldSetting) {
  const origin = toAtlas(start.lon, start.lat),
    date = { year: start.year };
  const profiles = regionalProfiles
    .filter((p) => containsDate(p.dates, date))
    .sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id));
  const named = new Map<string, RegionalPlace>();
  // The imported gazetteer has modern coordinates, not founding dates. Never
  // silently project its towns into prehistory or other unresearched periods.
  if (start.year >= 1990)
    for (const p of places)
      named.set(p.id, {
        id: p.id,
        name: p.name,
        at: [p.lon, p.lat],
        radius: p.settlement === "village" ? 60 : 140,
        population: p.population,
        dates: { start: { year: 1990 } },
        defaults: { settlement: p.settlement, water: p.water },
        evidence: {
          status: "inferred",
          sources: ["https://www.naturalearthdata.com/"],
          note: "Modern gazetteer anchor; footprint and local buildings are procedural, not surveyed.",
        },
      });
  for (const region of profiles)
    for (const p of region.places ?? [])
      if (containsDate(p.dates, date)) named.set(p.id, p);
  if (
    start.geographyMode !== "configured" &&
    start.settlement !== "camp" &&
    !profiles.some(
      (p) =>
        p.settlement !== "procedural" &&
        inBounds(start.lon, start.lat, p.bounds),
    ) &&
    ![...named.values()].some(
      (p) => Math.hypot(p.at[0] - start.lon, p.at[1] - start.lat) < 0.025,
    )
  ) {
    const population = cityPopulation(start.placeId, start.year);
    named.set(start.placeId, {
      id: start.placeId,
      name: start.location,
      at: [start.lon, start.lat],
      radius: population ? 140 : 80,
      population,
      dates: {},
      defaults: {
        culture: start.culture,
        architecture: start.architecture,
        settlement: start.settlement,
        settlementPattern: start.settlementPattern,
        water: start.water,
      },
      evidence: {
        status: "fictional",
        sources: [],
        note: "Requested starting setting; local footprint is an inferred gameplay composition.",
      },
    });
  }
  const activePlaces = [...named.values()].sort((a, b) =>
    a.id.localeCompare(b.id),
  );
  const placeBuckets = new Map<string, RegionalPlace[]>();
  const key = (x: number, y: number) =>
    `${Math.floor(x / REGION_CELL)},${Math.floor(y / REGION_CELL)}`;
  for (const p of activePlaces) {
    const q = toAtlas(...p.at);
    const vertices = p.footprint?.map((c) => toAtlas(...c)) ?? [q];
    const minX = Math.min(...vertices.map((v) => v.x)) - p.radius;
    const maxX = Math.max(...vertices.map((v) => v.x)) + p.radius;
    const minY = Math.min(...vertices.map((v) => v.y)) - p.radius;
    const maxY = Math.max(...vertices.map((v) => v.y)) + p.radius;
    for (
      let cy = Math.floor(minY / REGION_CELL);
      cy <= Math.floor(maxY / REGION_CELL);
      cy++
    )
      for (
        let cx = Math.floor(minX / REGION_CELL);
        cx <= Math.floor(maxX / REGION_CELL);
        cx++
      ) {
        const k = `${cx},${cy}`,
          list = placeBuckets.get(k) ?? [];
        list.push(p);
        placeBuckets.set(k, list);
      }
  }
  const localPoint = (c: Coordinate) => {
    const q = toAtlas(...c);
    return { x: q.x - origin.x, y: q.y - origin.y };
  };
  const local = (p: RegionalPlace) => localPoint(p.at);
  const profilesAt = (x: number, y: number) => {
    const p = fromAtlas(x + origin.x, y + origin.y);
    return profiles.filter((r) => inBounds(p.lon, p.lat, r.bounds));
  };
  const placesAt = (x: number, y: number) =>
    placeBuckets.get(key(x + origin.x, y + origin.y)) ?? [];
  const containsPlace = (p: RegionalPlace, x: number, y: number) => {
    const ll = fromAtlas(x + origin.x, y + origin.y),
      c = local(p);
    // Square, like the site claim: a town is composed as a rectangle, and a
    // round claim refused every corner block of it.
    return p.footprint
      ? inPolygon(ll.lon, ll.lat, p.footprint)
      : Math.max(Math.abs(x - c.x), Math.abs(y - c.y)) <= p.radius;
  };
  const placeAt = (x: number, y: number) =>
    placesAt(x, y)
      .filter((p) => containsPlace(p, x, y))
      .sort((a, b) => a.radius - b.radius || a.id.localeCompare(b.id))[0];
  const projectedFeatures = new Map<
    RegionalFeature,
    ReturnType<typeof toAtlas>[]
  >();
  const projectFeature = (f: RegionalFeature) => {
    let points = projectedFeatures.get(f);
    if (!points) {
      points = f.geometry.map((c) => toAtlas(...c));
      projectedFeatures.set(f, points);
    }
    return points;
  };
  const featureCache = new Map<
    string,
    { feature: RegionalFeature; region: RegionalProfile }[]
  >();
  function featuresNear(x: number, y: number) {
    const k = key(x + origin.x, y + origin.y),
      old = featureCache.get(k);
    if (old) return old;
    const bx = Math.floor((x + origin.x) / REGION_CELL) * REGION_CELL;
    const by = Math.floor((y + origin.y) / REGION_CELL) * REGION_CELL;
    const result = profiles.flatMap((region) =>
      (region.features ?? [])
        .filter((f) => containsDate(f.dates, date))
        .filter((f) => {
          const points = projectFeature(f),
            margin = (f.width ?? 0) + 24;
          return (
            Math.min(...points.map((p) => p.x)) - margin <= bx + REGION_CELL &&
            Math.max(...points.map((p) => p.x)) + margin >= bx &&
            Math.min(...points.map((p) => p.y)) - margin <= by + REGION_CELL &&
            Math.max(...points.map((p) => p.y)) + margin >= by
          );
        })
        .map((feature) => ({ region, feature })),
    );
    trimCache(featureCache, 128);
    featureCache.set(k, result);
    return result;
  }
  function featureAt(
    x: number,
    y: number,
    kinds?: readonly RegionalFeature["kind"][],
  ) {
    const p = { x: x + origin.x, y: y + origin.y },
      ll = fromAtlas(p.x, p.y);
    let selected:
      | {
          feature: RegionalFeature;
          distance: number;
          flow: readonly [number, number];
        }
      | undefined;
    let coastDistance = Infinity;
    for (const { feature: f } of featuresNear(x, y)) {
      if (kinds && !kinds.includes(f.kind)) continue;
      const points = projectFeature(f);
      let distance = Infinity,
        flow: readonly [number, number] = [0, 0];
      for (let i = 1; i < points.length + (f.kind === "river" ? 0 : 1); i++) {
        const near = nearestSegment(
          p,
          points[i - 1],
          points[i % points.length],
        );
        if (near.distance < distance) {
          distance = near.distance;
          flow = near.flow;
        }
      }
      if (f.kind === "land") coastDistance = Math.min(coastDistance, distance);
      if (f.kind === "river") {
        distance -= f.width ?? 5;
        if (distance > 24) continue;
      } else {
        if (!inPolygon(ll.lon, ll.lat, f.geometry)) continue;
        distance = -distance;
      }
      selected = { feature: f, distance, flow };
    }
    if (selected?.feature.kind === "sea")
      selected.distance = -Math.min(Math.abs(selected.distance), coastDistance);
    return selected;
  }
  const packCache = new Map<string, Pack>();
  const climateCache = new Map<string, ReturnType<typeof broadEnvironment>>();
  function ambientAt(x: number, y: number) {
    const gx = Math.floor((x + origin.x) / 128),
      gy = Math.floor((y + origin.y) / 128);
    const k = `${gx},${gy}`;
    let value = climateCache.get(k);
    if (!value) {
      const ll = fromAtlas(gx * 128 + 64, gy * 128 + 64);
      value = broadEnvironment(ll.lon, ll.lat);
      trimCache(climateCache, 512);
      climateCache.set(k, value);
    }
    return value;
  }
  // Relief read between block centres, so tiers and landform blends follow a
  // curve across the countryside instead of stepping at every 128-cell box.
  const reliefBlocks = new Map<string, number>();
  const blockRelief = (bx: number, by: number) => {
    const k = `${bx},${by}`;
    let v = reliefBlocks.get(k);
    if (v === undefined) {
      const ll = fromAtlas(bx * 128 + 64, by * 128 + 64);
      v = broadEnvironment(ll.lon, ll.lat).relief;
      trimCache(reliefBlocks, 1024);
      reliefBlocks.set(k, v);
    }
    return v;
  };
  function reliefAt(x: number, y: number) {
    const ax = x + origin.x,
      ay = y + origin.y;
    const warp = (noise("ecotone", ax, ay, 96, "boundary") - 0.5) * 40;
    const fx = (ax + warp) / 128 - 0.5,
      fy = (ay - warp) / 128 - 0.5;
    const gx = Math.floor(fx),
      gy = Math.floor(fy);
    const smooth = (t: number) => t * t * (3 - 2 * t);
    const tx = smooth(fx - gx),
      ty = smooth(fy - gy);
    return (
      blockRelief(gx, gy) * (1 - tx) * (1 - ty) +
      blockRelief(gx + 1, gy) * tx * (1 - ty) +
      blockRelief(gx, gy + 1) * (1 - tx) * ty +
      blockRelief(gx + 1, gy + 1) * tx * ty
    );
  }
  // Keyed by column, then row, then whether the start is included. The chunk
  // loop asks for this once per cell, so building a `${x},${y},${flag}` string
  // for every lookup was itself among the largest costs in world generation.
  const settingCache = new Map<number, Map<number, WorldSetting>>();
  let settingCount = 0;
  // Everything but the coordinates is the same across an ambient block, a
  // profile set and a named place, so that part is built once and shared.
  const baseCache = new Map<string, WorldSetting>();
  function rawSettingAt(
    x: number,
    y: number,
    includeStart = true,
  ): WorldSetting {
    const row = includeStart ? y * 2 : y * 2 + 1;
    let column = settingCache.get(x);
    const previous = column?.get(row);
    if (previous) return previous;
    const ll = fromAtlas(x + origin.x, y + origin.y),
      ambient = ambientAt(x, y);
    const localStart = includeStart && Math.hypot(x, y) < 192;
    const climate = geographicClimate(ll.lat, ambient.moisture);
    const here = profilesAt(x, y),
      namedPlace = placeAt(x, y);
    let baseKey = `${ambient.relief}|${climate}|${localStart}|${namedPlace?.id}`;
    if (start.ecologyRevision === 2)
      baseKey += `|${ecoregionNear(ll.lon, ll.lat)?.id ?? 0}|${Math.floor(ll.lat / 5)}|${Math.floor(ll.lon / 5)}`;
    for (const p of here) baseKey += "|" + p.id;
    let base = baseCache.get(baseKey);
    if (!base) {
      let s: WorldSetting = {
        ...start,
        location: start.playableMap?.name ?? "Countryside",
        placeId: "unresearched",
        community: "",
        characterCommunity: undefined,
        climate,
        relief: ambient.relief,
        water: "none",
        settlement: start.year < -9999 ? "camp" : "village",
        settlementPattern: undefined,
        environment: undefined,
      };
      for (const p of here) s = { ...s, ...p.defaults };
      if (namedPlace)
        s = {
          ...s,
          ...namedPlace.defaults,
          placeId: namedPlace.id,
          location: namedPlace.name,
        };
      if (localStart && (!namedPlace || namedPlace.id === start.placeId))
        s = {
          ...s,
          culture: start.culture,
          community: start.community,
          characterCommunity: start.characterCommunity,
          architecture: start.architecture,
          settlement: start.settlement,
          settlementPattern: start.settlementPattern,
          climate: start.climate,
          relief: start.relief,
        };
      // Chronology is not a worldwide technology ladder. Only deep-prehistoric
      // fallback changes settlement mechanics; local dated defaults take precedence.
      if (start.year < -9999 && !namedPlace)
        s = { ...s, settlement: "camp", architecture: "shelter" };
      s.environment = {
        ...environmentFor(
          start.ecologyRevision === 2
            ? { ...s, ...ll, geographyMode: "earth" }
            : s,
          ambient.moisture,
        ),
        ...(start.ecologyRevision === 2
          ? (namedPlace?.defaults.ecology ??
            [...here].reverse().find((p) => p.defaults.ecology)?.defaults
              .ecology)
          : undefined),
        start: start.environment!.start,
        household: start.environment!.household,
      };
      // Only near the start. Without the bound a configured or desert world
      // was the starting ecology everywhere, so you could never walk out of
      // the Sahara into the Nile.
      if (
        localStart &&
        (start.geographyMode === "configured" ||
          (start.climate === "arid" && start.environment?.ecology === "desert"))
      )
        s.environment = { ...start.environment! };
      trimCache(baseCache, 512);
      baseCache.set(baseKey, (base = s));
    }
    const s: WorldSetting = { ...base, ...ll };
    if (settingCount >= 16384) {
      settingCache.clear();
      settingCount = 0;
      column = undefined;
    }
    if (!column) settingCache.set(x, (column = new Map()));
    column.set(row, s);
    settingCount++;
    return s;
  }
  const ecologyCache = new Map<number, ReturnType<typeof calculateEcology>>();
  function calculateEcology(x: number, y: number) {
    const ax = x + origin.x,
      ay = y + origin.y;
    // A 64-cell lattice: a scene mixes two or three neighbours rather than
    // sitting inside one carpet.
    const L = 64;
    const warp = (noise("ecotone", ax, ay, 96, "boundary") - 0.5) * 56;
    const gx = Math.floor((ax + warp) / L) * L;
    const gy = Math.floor((ay - warp) / L) * L;
    const smooth = (t: number) => t * t * (3 - 2 * t);
    const tx = smooth((ax + warp - gx) / L),
      ty = smooth((ay - warp - gy) / L);
    const distance = Math.hypot(x, y) + warp;
    const home =
      start.ecologyRevision === 2 &&
      start.geographyMode !== "configured" &&
      !(start.climate === "arid" && start.environment?.ecology === "desert")
        ? 0
        : 1 - smooth(Math.max(0, Math.min(1, (distance - 80) / 208)));
    const parts: {
      ecology: Ecology;
      colorway?: Colorway;
      weight: number;
    }[] = [];
    const add = (
      env: NonNullable<WorldSetting["environment"]>,
      weight: number,
    ) => {
      if (weight <= 0) return;
      const existing = parts.find(
        (p) => p.ecology === env.ecology && p.colorway === env.colorway,
      );
      if (existing) existing.weight += weight;
      else parts.push({ ecology: env.ecology, colorway: env.colorway, weight });
    };
    for (const [dx, dy, weight] of [
      [0, 0, (1 - tx) * (1 - ty)],
      [L, 0, tx * (1 - ty)],
      [0, L, (1 - tx) * ty],
      [L, L, tx * ty],
    ])
      add(
        rawSettingAt(gx + dx - origin.x, gy + dy - origin.y, false)
          .environment!,
        weight * (1 - home),
      );
    add(start.environment!, home);
    const map = start.playableMap;
    if (map?.exits.some((e) => e.neighbor)) {
      const hits = map.exits.flatMap((e) => {
        if (!e.neighbor || e.mode !== "land") return [];
        const side = e.seam?.side ?? e.bearing[0];
        const along = side === "N" || side === "S" ? x : y;
        const u = (along + map.size / 2) / (map.size - 1);
        const from = e.seam?.start ?? 0,
          to = e.seam?.end ?? 1;
        // Feathered along the seam as well as into it. The ends used to be an
        // in/out test, so the neighbour's ground stopped at full strength and
        // drew a straight line across the map.
        const fade = Math.min(SEAM_FADE / (map.size - 1), (to - from) / 2);
        const alongEdge = Math.min((u - from) / fade, (to - u) / fade, 1);
        if (alongEdge <= 0) return [];
        const depth =
          side === "N"
            ? y + map.size / 2
            : side === "S"
              ? map.size / 2 - 1 - y
              : side === "W"
                ? x + map.size / 2
                : map.size / 2 - 1 - x;
        const weight =
          0.5 *
          smooth(alongEdge) *
          (1 - smooth(Math.max(0, Math.min(1, depth / 112))));
        return weight > 0 ? [{ env: e.neighbor, weight }] : [];
      });
      if (hits.length) {
        const total = hits.reduce((sum, h) => sum + h.weight, 0);
        // Scale the lattice blend down rather than discarding it, so the mix
        // returns to the countryside continuously as the seam's share fades.
        const share = Math.min(0.5, total);
        for (const part of parts) part.weight *= 1 - share;
        for (const hit of hits)
          add(
            { ...start.environment!, ...hit.env },
            (hit.weight * share) / total,
          );
      }
    }
    if (start.playableMap?.exits.some((e) => e.neighbor)) {
      const desert = parts
        .filter((p) => p.ecology === "desert")
        .reduce((sum, p) => sum + p.weight, 0);
      const green = parts.some(
        (p) => p.ecology.includes("woodland") || p.ecology === "grassland",
      );
      if (desert > 0 && desert < 1 && green) {
        const transition = Math.min(desert, 1 - desert) * 1.2;
        for (const part of parts) part.weight *= 1 - transition;
        add(
          { ...start.environment!, ecology: "dry-scrub", colorway: undefined },
          transition * desert,
        );
        add(
          { ...start.environment!, ecology: "grassland", colorway: undefined },
          transition * (1 - desert),
        );
      }
    }
    let roll = noise("ecotone", ax, ay, 12, "plant-colonies");
    const selected =
      parts.find((p) => (roll -= p.weight) <= 0) ?? parts[parts.length - 1];
    return {
      parts,
      selected,
      moisture: parts.reduce(
        (sum, p) => sum + ecologyProfiles[p.ecology].moisture * p.weight,
        0,
      ),
    };
  }
  function ecologyAt(x: number, y: number) {
    // Packed, not a string: exact while |x| < 2^20 and |y| < 2^21.
    const key = x * 2097152 + y;
    let value = ecologyCache.get(key);
    if (!value) {
      value = calculateEcology(x, y);
      trimCache(ecologyCache, 16384);
      ecologyCache.set(key, value);
    }
    return value;
  }
  function settingAt(x: number, y: number, includeStart = true): WorldSetting {
    const s = rawSettingAt(x, y, includeStart);
    if (!start.ecologyRevision || !includeStart) return s;
    const { selected } = ecologyAt(x, y);
    return {
      ...s,
      environment: {
        ...s.environment!,
        ecology: selected.ecology,
        colorway: selected.colorway,
      },
    };
  }
  /** The ecology and colorway of settingAt, without building the setting: the
   * terrain sampler asks once per cell and reads nothing else. */
  function habitatAt(x: number, y: number): {
    ecology: Ecology;
    colorway?: Colorway;
  } {
    return start.ecologyRevision
      ? ecologyAt(x, y).selected
      : rawSettingAt(x, y).environment!;
  }
  function packAt(x: number, y: number) {
    const s = settingAt(x, y);
    const character = s.characterRevision
      ? resolveCharacterContext(s)
      : undefined;
    const k = JSON.stringify([
      character?.profile.id,
      character?.names?.id,
      character?.community,
      s.placeId,
      s.culture,
      s.community,
      s.characterCommunity,
      s.architecture,
      s.climate,
      s.relief,
      s.settlement,
      s.settlementPattern,
      s.environment,
    ]);
    let pack = packCache.get(k);
    if (!pack) {
      pack = packForSetting(s);
      const scope = placeAt(x, y);
      const evidence = scope?.evidence ?? profilesAt(x, y).at(-1)?.evidence;
      if (
        evidence &&
        (evidence.status === "documented" || evidence.status === "inferred") &&
        evidence.sources.length
      )
        pack.evidence.push({
          id: "regional-context",
          title: scope?.name ?? "Regional generation defaults",
          status: evidence.status === "documented" ? "documented" : "inferred",
          statement: evidence.note,
          limitation: `${evidence.status}: approximate generation coverage; not a complete historical reconstruction.`,
          url: evidence.sources[0] ?? "https://www.naturalearthdata.com/",
        });
      trimCache(packCache, 128);
      packCache.set(k, pack);
    }
    return pack;
  }
  const landUse = (x: number, y: number) =>
    featureAt(x, y, ["park", "wilderness", "fields", "rock"])?.feature.kind;
  const canSettle = (x: number, y: number) => {
    if (
      start.geographyMode === "configured" &&
      Math.hypot(x, y) < 192 &&
      start.environment!.population === "none"
    )
      return false;
    const use = landUse(x, y);
    if (
      use &&
      ["park", "wilderness", "fields", "river", "lake", "sea", "rock"].includes(
        use,
      )
    )
      return false;
    const policy = profilesAt(x, y).at(-1)?.settlement ?? "procedural";
    return policy !== "none" && (policy !== "anchored" || !!placeAt(x, y));
  };
  return {
    origin,
    profiles,
    activePlaces,
    local,
    localPoint,
    placesAt,
    placeAt,
    containsPlace,
    featureAt,
    landUse,
    canSettle,
    settingAt,
    habitatAt,
    ecologyAt,
    reliefAt,
    packAt,
    profilesAt,
  };
}
export type RegionalContext = ReturnType<typeof createRegionalContext>;
