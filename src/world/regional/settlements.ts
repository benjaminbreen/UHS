import { preparedSite, type PreparedSite } from "../v3/prepared";
import { random } from "../../core/random";
import { settlementProfile } from "../../content/settlements/profiles";
import type { Site } from "../v3/types";
import type { Sample } from "../v3/roads";
import { REGION_CELL, type RegionalContext } from "./context";

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
                radius: 27,
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
      const radius = Math.min(
        p.radius ?? 74,
        ...proposals
          .filter((q) => q !== p)
          .map((q) => Math.max(16, Math.hypot(q.x - p.x, q.y - p.y) / 2 - 8)),
      );
      const candidates = Array.from({ length: 49 }, (_, i) => {
        const r = i ? Math.min(radius * 0.35, 6 + Math.floor(i / 8) * 5) : 0;
        return {
          x: Math.round((p.x + Math.cos(i * 2.4) * r) / 2) * 2,
          y: Math.round((p.y + Math.sin(i * 2.4) * r) / 2) * 2,
        };
      });
      const usable = candidates
        .filter((q) => {
          if (!context.canSettle(q.x, q.y)) return false;
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
        })
        .sort((a, b) => {
          const score = (q: typeof a) =>
            Math.hypot(q.x - p.x, q.y - p.y) +
            Math.abs(sample(q.x, q.y).water - 25) * 0.12;
          return score(a) - score(b);
        });
      if (!usable.length) continue;
      const q = usable[0],
        pack = context.packAt(q.x, q.y);
      const profile = {
        ...settlementProfile(
          pack.setting!,
          !!p.namedId ||
            (!!pack.setting?.urbanRevision &&
              (pack.setting.settlement === "city" ||
                pack.setting.settlement === "port")),
        ),
        radius,
        ...(radius < 45
          ? {
              buildings: Math.max(
                2,
                Math.floor(
                  radius /
                    (pack.setting?.urbanRevision &&
                    (pack.setting.settlement === "city" ||
                      pack.setting.settlement === "port")
                      ? 2
                      : 6),
                ),
              ),
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
