/** Precincts: ground set apart in a town and the buildings that stand round
 * it. A court, an arena or a market is walkable ground first; its pieces are
 * ordinary buildings placed on its edges, facing in. Footprints live in
 * `graphics/precincts.json`, which the painter reads too. */
import data from "../graphics/precincts.json" with { type: "json" };
import type { Terrain } from "../../core/types";
import type { WorldSetting } from "../geography/types";
import type { Venue } from "../venues/types";
import { mesoamericanHouseProfile } from "../graphics/regional-houses";

export type PrecinctScale = "small" | "medium" | "large";
type Kind = keyof typeof data;

export type PrecinctPiece = {
  frame: string;
  name: string;
  at: readonly [number, number];
  footprint: readonly [number, number];
  /** The venue's own building. */
  main?: boolean;
};

export type PrecinctPlan = {
  kind: Kind;
  label: string;
  venue: Venue;
  surface: Terrain;
  /** Largest first; the layout takes the first that fits. */
  options: {
    scale: PrecinctScale;
    size: readonly [number, number];
    pieces: PrecinctPiece[];
    /** Market pitches and court markers, in cells from the corner. */
    /** With the row, which is the trade: one to a row, as markets were. */
    stalls: [number, number, number][];
    markers: [number, number][];
  }[];
};

/** The painted colours of an amphitheatre's awnings and pennants, by where it
 * stands: Italy, the Greek east, or the western provinces. Inferred. */
export function amphitheatreLook(s: WorldSetting): number {
  if (s.lon > 19 || s.lat < 33) return 1;
  if (s.lon >= 6 && s.lat >= 36 && s.lat <= 47) return 0;
  return 2;
}

const SCALES: PrecinctScale[] = ["large", "medium", "small"];

/** Which scales a town of this extent may build, largest first. */
function ladder(radius: number): PrecinctScale[] {
  return radius >= 70 ? SCALES : radius >= 45 ? SCALES.slice(1) : ["small"];
}

function kindFor(venue: Venue): Kind | undefined {
  return (Object.keys(data) as Kind[]).find((k) => data[k].venue === venue.id);
}

function frameFor(kind: Kind, key: string, scale: string, s: WorldSetting) {
  if (kind === "ballcourt") {
    const profile = mesoamericanHouseProfile(s);
    return key === "shrine"
      ? `religious-meso-temple-${profile}-small-0`
      : `precinct-ballcourt-${profile}-${scale}-${key}`;
  }
  return `precinct-amphitheatre-${amphitheatreLook(s)}-${scale}-${key}`;
}

const NAMES: Record<string, string> = {
  north: "Court range",
  south: "Court range",
  shrine: "Court shrine",
  nw: "Court wall",
  ne: "Court wall",
  sw: "Court wall",
  se: "Court wall",
  "south-l": "Arcade",
  "south-r": "Arcade",
  west: "Stands",
  east: "Stands",
  judges: "Judges' house",
};

/** Rows of pitches with aisles between, clear of whatever stands at the head. */
function pitches(w: number, h: number, top: number): [number, number, number][] {
  const out: [number, number, number][] = [];
  for (let y = top + 2, row = 0; y < h - 2; y += 4, row++)
    for (let x = 2; x < w - 3; x += 4) out.push([x, y, row]);
  return out;
}

/** One plan per precinct this town wants. A big city holds more than one
 * market; the first is its largest. */
export function precinctPlans(
  s: WorldSetting,
  venues: Venue[],
  radius: number,
): PrecinctPlan[] {
  const allowed = ladder(radius);
  const plans: PrecinctPlan[] = [];
  for (const venue of venues) {
    const kind = kindFor(venue);
    if (!kind) continue;
    if (kind === "market" && s.settlement !== "city" && s.settlement !== "port")
      continue;
    const spec = data[kind];
    const copies =
      kind === "market" ? (radius >= 70 ? 3 : radius >= 45 ? 2 : 1) : 1;
    for (let n = 0; n < copies; n++) {
      // Later markets are a step smaller than the first.
      const scales = allowed.slice(Math.min(n, allowed.length - 1));
      plans.push({
        kind,
        label: spec.label,
        venue,
        surface: spec.surface as Terrain,
        options: scales.map((scale) => {
          const shape = spec.scales[scale];
          const [w, h] = shape.size as [number, number];
          const pieces: PrecinctPiece[] = shape.pieces.map((p) => ({
            frame: frameFor(kind, p.key, scale, s),
            name: NAMES[p.key] ?? NAMES[p.key.split("-")[0]] ?? spec.label,
            at: p.at as [number, number],
            footprint: p.footprint as [number, number],
            main: "main" in p && p.main,
          }));
          // Tlatelolco's market had its judges; the house stands at the head.
          const judges =
            kind === "market" && s.culture === "mesoamerican" && s.year < 1540;
          if (judges)
            pieces.push({
              frame: "meso-telpochcalli-small-0",
              name: NAMES.judges,
              at: [Math.floor((w - 6) / 2), 0],
              footprint: [6, 3],
              main: true,
            });
          const mid = Math.floor(
            (shape.pieces.find((p) => p.key === "north")?.footprint[1] ?? 0) +
              (h -
                (shape.pieces.find((p) => p.key === "north")?.footprint[1] ?? 0) -
                (shape.pieces.find((p) => p.key === "south")?.footprint[1] ??
                  0)) /
                2,
          );
          return {
            scale,
            size: [w, h] as const,
            pieces,
            stalls: kind === "market" ? pitches(w, h, judges ? 3 : 0) : [],
            markers:
              kind === "ballcourt"
                ? [0.32, 0.5, 0.68].map(
                    (f) => [Math.round(w * f), mid] as [number, number],
                  )
                : [],
          };
        }),
      });
    }
  }
  return plans;
}
