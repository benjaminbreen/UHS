import { preparedSite, type PreparedSite } from "../v3/prepared";
import { random } from "../../core/random";
import { settlementProfile } from "../../content/settlements/profiles";
import type { Site } from "../v3/types";
import type { Sample } from "../v3/roads";
import type { LandSample } from "../geography/landscape";
import { REGION_CELL, type RegionalContext } from "./context";
import { urbanRadius, urbanTarget } from "../../content/settlements/scale";

/** How far from the water a waterside centre wants to stand. A town keeps
 * room for a quay and a waterfront street, 8-14 tiles; a city's centre sits
 * back about two fifths of its claim, so the built extent reaches the shore
 * on one side and spreads inland on the others instead of losing half its
 * ground to the sea. */
export const shorePreference = (
  water: number,
  radius = 0,
  /** Farthest from water any candidate stands: an island narrower than the
   * setback still wants its centre on its own middle, not its edge. */
  available = Infinity,
) => {
  const lo = Math.min(
      radius >= 60 ? Math.min(60, radius * 0.36) : 8,
      available * 0.8,
    ),
    hi = Math.max(
      lo,
      Math.min(radius >= 60 ? Math.min(70, radius * 0.46) : 14, available),
    );
  return water < lo ? (lo - water) * 2 : water > hi ? water - hi : 0;
};
/** Districts index plans; named places and their neighborhoods own their identity. */
export function regionalSettlements(
  context: RegionalContext,
  sample: Sample,
  seed: string,
  prepared?: [string, PreparedSite[]][],
) {
  const cache = new Map<string, Site[]>();
  // Square, not round. A circular claim forces every settlement to a disc, and
  // the layouts that follow it are rectangular. Neighbour spacing already keeps
  // sites apart; the named-place test below still bounds a claim to its own place.
  const accepts = (s: PreparedSite) => (x: number, y: number) =>
    context.canSettle(x, y) &&
    Math.max(Math.abs(x - s.center.x), Math.abs(y - s.center.y)) <
      s.profile.radius &&
    (s.namedId
      ? context.placeAt(x, y)?.id === s.namedId
      : !context.placeAt(x, y));
  for (const [key, sites] of prepared ?? [])
    cache.set(
      key,
      sites.map((s) => ({ ...s, accepts: accepts(s) })),
    );
  let homeId: string | undefined;
  function sitesIn(cx: number, cy: number): Site[] {
    const key = `${cx},${cy}`,
      old = cache.get(key);
    if (old) return old;
    const ox = cx * REGION_CELL - context.origin.x;
    const oy = cy * REGION_CELL - context.origin.y;
    const named = context.placesAt(ox + 192, oy + 192);
    const proposals: {
      id: string;
      x: number;
      y: number;
      name?: string;
      namedId?: string;
      radius?: number;
      population?: number;
      cores?: Site["cores"];
      aspect?: number;
    }[] = [];
    for (const p of named) {
      const center = context.local(p);
      if (
        center.x >= ox &&
        center.x < ox + REGION_CELL &&
        center.y >= oy &&
        center.y < oy + REGION_CELL
      )
        proposals.push({
          ...center,
          id: p.id,
          name: p.name,
          namedId: p.id,
          radius: p.radius,
          population: p.population,
          cores: p.cores?.map((core) => ({
            ...context.localPoint(core.at),
            radius: core.radius,
            weight: core.weight,
          })),
          aspect: p.aspect,
        });
      if (p.footprint) {
        // Large footprints become neighborhoods using the same planner as towns.
        for (let y = oy + 32; y < oy + REGION_CELL; y += 64)
          for (let x = ox + 32; x < ox + REGION_CELL; x += 64)
            if (
              context.containsPlace(p, x, y) &&
              Math.hypot(x - center.x, y - center.y) > p.radius + 24
            )
              proposals.push({
                x,
                y,
                id: `${p.id}@${x + context.origin.x}_${y + context.origin.y}`,
                name: p.name,
                namedId: p.id,
                // A quarter of a great city is a town in its own right.
                radius: p.radius >= 100 ? 45 : 27,
              });
      }
    }
    const home =
      ox <= 0 && oy <= 0 && ox + REGION_CELL > 0 && oy + REGION_CELL > 0;
    const center = {
      x: home ? 0 : ox + 80 + Math.floor(random(seed, key, "site-x") * 224),
      y: home ? 0 : oy + 80 + Math.floor(random(seed, key, "site-y") * 224),
    };
    const cfg = context.settingAt(center.x, center.y).environment!;
    if (
      !proposals.length &&
      cfg.population !== "none" &&
      (home ||
        random(seed, "settlement-sites", cx, cy) <
          (cfg.population === "sparse" ? 0.24 : 0.62)) &&
      !context.placeAt(center.x, center.y)
    )
      proposals.push({ ...center, id: "generated" });
    const result: Site[] = [];
    for (const p of proposals) {
      // A named place keeps the radius its entry gives it. Spacing only
      // guards generated sites; a neighbour's claim already bounds a named one.
      const radius = p.namedId
        ? (p.radius ?? 74)
        : Math.min(
            p.radius ?? 74,
            ...proposals
              .filter((q) => q !== p)
              .map((q) =>
                Math.max(16, Math.hypot(q.x - p.x, q.y - p.y) / 2 - 8),
              ),
          );
      // A waterside place searches its whole claim: the gazetteer point is
      // the modern centre, and the shore can be a hundred tiles off.
      const water = context.settingAt(p.x, p.y).water;
      const shore = water !== "none";
      const reach = shore ? radius : radius * 0.35;
      const step = shore ? 8 : 5;
      const candidates = [{ x: p.x, y: p.y }];
      for (let r = 6; r <= reach; r += step) {
        const n = shore ? Math.max(8, Math.round((Math.PI * r) / 4)) : 8;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 + r * 0.3;
          candidates.push({
            x: Math.round((p.x + Math.cos(a) * r) / 2) * 2,
            y: Math.round((p.y + Math.sin(a) * r) / 2) * 2,
          });
        }
      }
      const wanted: LandSample["kind"] = water.startsWith("coast")
        ? "sea"
        : water === "lake"
          ? "lake"
          : "river";
      const usable = candidates.filter((q) => {
        if (!context.canSettle(q.x, q.y)) return false;
        // A named place's centre stays inside its own claim; a search that
        // crosses a river lands the city in the next borough.
        const owner = context.placeAt(q.x, q.y)?.id;
        if (p.namedId ? owner !== p.namedId : owner !== undefined) return false;
        const f = sample(q.x, q.y);
        return (
          f.water >= 5 &&
          [
            [-4, -4],
            [4, -4],
            [-4, 4],
            [4, 4],
          ].every(([dx, dy]) => {
            const n = sample(q.x + dx, q.y + dy);
            return n.water >= 5 && n.elevation === f.elevation;
          })
        );
      });
      const available = Math.max(
        0,
        ...usable.map((q) => sample(q.x, q.y).water),
      );
      usable.sort((a, b) => {
        const score = (q: typeof a) => {
          const f = sample(q.x, q.y);
          return (
            Math.hypot(q.x - p.x, q.y - p.y) * 0.12 +
            (shore
              ? shorePreference(f.water, radius, available) +
                (f.kind === wanted ? 0 : 60)
              : Math.abs(f.water - 25) * 0.12)
          );
        };
        return score(a) - score(b);
      });
      if (!usable.length) continue;
      const q = usable[0],
        pack = context.packAt(q.x, q.y);
      const setting = pack.setting!;
      const town =
        !!setting.urbanRevision &&
        (setting.settlement === "city" || setting.settlement === "port");
      const base = settlementProfile(setting, !!p.namedId || town);
      // A town is built to the size its population implies, inside the claim
      // its entry gives it. Villages keep the flat profile sizes.
      const target = town ? urbanTarget(setting, p.population) : undefined;
      // Extent follows population on a log scale: a town of three thousand
      // is thirty cells across the half, a metropolis fills its claim.
      const built =
        target !== undefined
          ? Math.min(radius, urbanRadius(p.population, setting.year))
          : radius;
      const profile = {
        ...base,
        radius: built,
        ...(target !== undefined
          ? { buildings: target }
          : built < 45
            ? {
                buildings: Math.max(2, Math.floor(built / 6)),
                frontage: 7,
              }
            : {}),
      };
      const site: Site = {
        id: `s${cx}_${cy}~${encodeURIComponent(p.id)}`,
        cx,
        cy,
        center: q,
        home: `s${cx}_${cy}~${encodeURIComponent(p.id)}` === homeId,
        profile,
        name: p.name,
        namedId: p.namedId,
        pack,
        cores: p.cores,
        aspect: p.aspect,
      };
      site.accepts = accepts(site);
      result.push(site);
    }
    result.sort(
      (a, b) =>
        Math.hypot(a.center.x, a.center.y) -
          Math.hypot(b.center.x, b.center.y) || a.id.localeCompare(b.id),
    );
    if (cache.size >= 256) cache.delete(cache.keys().next().value!);
    cache.set(key, result);
    return result;
  }
  return {
    sitesIn,
    prepare: (): [string, PreparedSite[]][] =>
      [...cache].map(([key, sites]) => [key, sites.map(preparedSite)]),
    setHome: (id: string) => {
      homeId = id;
      for (const list of cache.values())
        for (const site of list) site.home = site.id === id;
    },
  };
}
