import type { Pack } from "../../core/types";
import type { WorldSetting } from "../../content/geography/types";
import type {
  RegionalPlace,
  RegionalFeature,
  RegionalProfile,
} from "../../content/geography/regions/types";
import { regionalProfiles } from "../../content/geography/regions";
import { places } from "../../content/geography/places";
import { containsDate } from "../../content/history/dates";
import { environmentFor } from "../../content/geography/defaults";
import { packForSetting } from "../../content/geography/pack";
import { broadEnvironment, toAtlas, fromAtlas } from "../v2/atlas";
import { inBounds, inPolygon, nearestSegment } from "./geometry";

export const REGION_CELL = 384;
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
        radius: p.settlement === "city" ? 110 : 60,
        dates: { start: { year: 1990 } },
        defaults: { settlement: p.settlement },
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
    named.set(start.placeId, {
      id: start.placeId,
      name: start.location,
      at: [start.lon, start.lat],
      radius: 80,
      dates: {},
      defaults: {
        culture: start.culture,
        architecture: start.architecture,
        settlement: start.settlement,
        settlementPattern: start.settlementPattern,
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
  const local = (p: RegionalPlace) => {
    const q = toAtlas(...p.at);
    return { x: q.x - origin.x, y: q.y - origin.y };
  };
  const profilesAt = (x: number, y: number) => {
    const p = fromAtlas(x + origin.x, y + origin.y);
    return profiles.filter((r) => inBounds(p.lon, p.lat, r.bounds));
  };
  const placesAt = (x: number, y: number) =>
    placeBuckets.get(key(x + origin.x, y + origin.y)) ?? [];
  const containsPlace = (p: RegionalPlace, x: number, y: number) => {
    const ll = fromAtlas(x + origin.x, y + origin.y),
      c = local(p);
    return p.footprint
      ? inPolygon(ll.lon, ll.lat, p.footprint)
      : Math.hypot(x - c.x, y - c.y) <= p.radius;
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
    if (featureCache.size >= 128) featureCache.clear();
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
      if (climateCache.size >= 512) climateCache.clear();
      climateCache.set(k, value);
    }
    return value;
  }
  const settingCache = new Map<string, WorldSetting>();
  function settingAt(x: number, y: number, includeStart = true): WorldSetting {
    const key = `${x},${y},${includeStart}`;
    const previous = settingCache.get(key);
    if (previous) return previous;
    const ll = fromAtlas(x + origin.x, y + origin.y),
      ambient = ambientAt(x, y);
    const localStart = includeStart && Math.hypot(x, y) < 192;
    const climate: WorldSetting["climate"] =
      Math.abs(ll.lat) > 68
        ? "tundra"
        : Math.abs(ll.lat) > 55
          ? "boreal"
          : ambient.moisture < 0.23
            ? "arid"
            : Math.abs(ll.lat) < 18
              ? "tropical"
              : ambient.moisture < 0.45
                ? "mediterranean"
                : "temperate";
    let s: WorldSetting = {
      ...start,
      ...ll,
      location: "Countryside",
      placeId: "unresearched",
      community: "",
      climate,
      relief: ambient.relief,
      water: "none",
      settlement: start.year < -9999 ? "camp" : "village",
      settlementPattern: undefined,
      environment: undefined,
    };
    for (const p of profilesAt(x, y)) s = { ...s, ...p.defaults };
    const namedPlace = placeAt(x, y);
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
      ...environmentFor(s),
      start: start.environment!.start,
      household: start.environment!.household,
    };
    if (start.geographyMode === "configured" && localStart)
      s.environment = { ...start.environment! };
    if (settingCache.size >= 16384) settingCache.clear();
    settingCache.set(key, s);
    return s;
  }
  function packAt(x: number, y: number) {
    const s = settingAt(x, y);
    const k = JSON.stringify([
      s.placeId,
      s.culture,
      s.community,
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
      if (packCache.size >= 128) packCache.clear();
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
    placesAt,
    placeAt,
    containsPlace,
    featureAt,
    landUse,
    canSettle,
    settingAt,
    packAt,
    profilesAt,
  };
}
export type RegionalContext = ReturnType<typeof createRegionalContext>;
