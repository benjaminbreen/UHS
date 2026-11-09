import { terrainProvinceAt, highlandAltitude, type TerrainProvince } from "../../content/geography/landforms";
import type { WorldSetting } from "../../content/geography/types";
import { noise } from "../geography/noise";
import { random } from "../../core/random";

/** Relief a place has of its own, laid over the landform field before it is
 * cut into tiers: dune ridges, karst towers, cinder cones, gullied loess.
 * All in world coordinates, so neighbouring maps agree. */
export type TerrainForm = TerrainProvince | "ice";

const clamp = (n: number) => Math.max(0, Math.min(1, n));
const frac = (n: number) => n - Math.floor(n);

export function terrainFormOf(s: WorldSetting): TerrainForm | undefined {
  const colorway = s.environment?.colorway;
  if (colorway === "ice") return "ice";
  if (colorway === "loess") return "loess";
  const province = terrainProvinceAt(s.lon, s.lat);
  if (province === "erg" || colorway === "sahara") return s.environment?.ecology === "desert" ? "erg" : undefined;
  return province;
}

/** Fewest tiers the form needs to read: a tower is no tower at two steps. */
export const formCeiling: Record<TerrainForm, number> = {
  erg: 4,
  karst: 8,
  cenote: 2,
  doline: 3,
  pavement: 2,
  volcanic: 6,
  loess: 6,
  badland: 5,
  ice: 2,
};

type Feature = { x: number; y: number; r: number; caldera: boolean };
const features = new Map<string, Feature | null>();
/** One feature per lattice cell at most: its centre and size, or undefined. */
function cellFeature(seed: string, kind: string, cx: number, cy: number, size: number, chance: number) {
  const key = `${seed}|${kind}|${cx}|${cy}`;
  let f = features.get(key);
  if (f === undefined) {
    f = placeFeature(seed, kind, cx, cy, size, chance) ?? null;
    if (features.size > 4096) features.clear();
    features.set(key, f);
  }
  return f ?? undefined;
}
function placeFeature(seed: string, kind: string, cx: number, cy: number, size: number, chance: number): Feature | undefined {
  if (random(seed, `${kind}-on`, cx, cy) > chance) return undefined;
  return {
    x: (cx + 0.2 + random(seed, `${kind}-x`, cx, cy) * 0.6) * size,
    y: (cy + 0.2 + random(seed, `${kind}-y`, cx, cy) * 0.6) * size,
    r: random(seed, `${kind}-r`, cx, cy),
    caldera: random(seed, `${kind}-caldera`, cx, cy) < 0.2,
  };
}
function nearestFeatures(seed: string, kind: string, x: number, y: number, size: number, chance: number) {
  const out: Feature[] = [];
  const bx = Math.floor(x / size),
    by = Math.floor(y / size);
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const f = cellFeature(seed, kind, bx + dx, by + dy, size, chance);
      if (f) out.push(f);
    }
  return out;
}

const TOWER = 36,
  CONE = 52,
  SINK = 34,
  DOLINE = 26;
const ridged = (n: number) => 1 - Math.abs(n * 2 - 1);

/** The landform height at a world point, reshaped by the form. */
export function reshape(form: TerrainForm, seed: string, h: number, x: number, y: number, fromTown = Infinity): number {
  switch (form) {
    case "erg": {
      // Long transverse ridges across a north-east trade wind: a slow
      // windward back and a short slip face, broken along the crest into
      // linked crescents. One tier for most, two where draa stack up.
      const along = x * 0.8 + y * 0.6 + (noise(seed, x, y, 70, "erg-bend") - 0.5) * 40;
      const p = frac(along / 22);
      const profile = p < 0.78 ? p / 0.78 : (1 - p) / 0.22;
      const crest = clamp((noise(seed, x * 0.6 - y * 0.8, along * 0.3, 34, "erg-crest") - 0.25) / 0.25);
      const draa = noise(seed, x, y, 120, "erg-draa");
      return 0.3 + (h - 0.5) * 0.1 + profile * crest * (0.11 + draa * 0.09);
    }
    case "karst": {
      // Flat paddy plain with steep-sided limestone towers standing out of it.
      // A few broad towers round the edge of the scene; the town keeps the plain.
      let tower = 0;
      for (const f of nearestFeatures(seed, "karst", x, y, TOWER, 0.55)) {
        const r = 6 + f.r * 6;
        const warp = (noise(seed, x, y, 5, "karst-wall") - 0.5) * 1.6;
        const d = Math.hypot(x - f.x, y - f.y) + warp;
        tower = Math.max(tower, clamp((r - d) / 1.4) * (0.32 + f.r * 0.3));
      }
      return 0.26 + (h - 0.5) * 0.08 + tower * clamp((fromTown - 30) / 14);
    }
    case "cenote":
      // A level limestone shelf, one step above the water in its sinks.
      return 0.6 + (h - 0.5) * 0.12;
    case "doline": {
      let bowl = 0;
      for (const f of nearestFeatures(seed, "doline", x, y, DOLINE, 0.55)) {
        const d = Math.hypot(x - f.x, y - f.y);
        bowl = Math.max(bowl, clamp((4 + f.r * 4 - d) / 2));
      }
      return h - bowl * 0.2;
    }
    case "volcanic": {
      // Cinder cones with a crater in the top; one in five is a broad caldera rim.
      let cone = 0;
      for (const f of nearestFeatures(seed, "cone", x, y, CONE, 0.5)) {
        const d = Math.hypot(x - f.x, y - f.y);
        if (f.caldera) {
          const R = 15 + f.r * 6;
          cone = Math.max(cone, clamp(1 - Math.abs(d - R) / 4) * 0.34 + (d < R ? 0.04 : 0));
        } else {
          const R = 7 + f.r * 5;
          const crater = clamp((R * 0.32 - d) / (R * 0.32));
          cone = Math.max(cone, Math.pow(clamp(1 - d / R), 0.75) * (0.3 + f.r * 0.15) - crater * 0.18);
        }
      }
      return 0.38 + (h - 0.5) * 0.4 + cone * clamp((fromTown - 30) / 14);
    }
    case "loess":
    case "badland": {
      // A high tableland cut by branching gullies that terrace down in steps.
      const fine = form === "badland" ? 0.6 : 1;
      const main = ridged(noise(seed, x, y, 46 * fine, "gully-main"));
      const side = ridged(noise(seed, x + 31, y - 17, 17 * fine, "gully-side"));
      const cut = clamp((main - 0.7) / 0.25) * 0.38 + clamp((side - 0.8) / 0.18) * 0.16 * clamp((main - 0.3) / 0.4);
      return 0.68 + (h - 0.5) * 0.3 - cut;
    }
    case "ice":
      return 0.45 + (h - 0.5) * 0.3;
    default:
      return h;
  }
}

/** Signed distance to the nearest cenote pool's rim, negative inside. */
export function cenoteDistance(seed: string, x: number, y: number) {
  let best = Infinity;
  for (const f of nearestFeatures(seed, "cenote", x, y, SINK, 0.45)) {
    const r = 2.2 + f.r * 2.4 + (noise(seed, x, y, 4, "cenote-rim") - 0.5) * 0.8;
    best = Math.min(best, Math.hypot(x - f.x, y - f.y) - r);
  }
  return best;
}

/** Ground the form lays over the habitat: lava, cinders, limestone pavement. */
export function formSurface(
  form: TerrainForm | undefined,
  seed: string,
  x: number,
  y: number,
  exposed: number,
): { kind: "lava" | "cinder" | "pavement"; strength: number } | undefined {
  if (form === "volcanic") {
    for (const f of nearestFeatures(seed, "cone", x, y, CONE, 0.5)) {
      const d = Math.hypot(x - f.x, y - f.y);
      const R = f.caldera ? 21 : 7 + f.r * 5;
      if (d < R * 1.35) return { kind: "cinder", strength: clamp((R * 1.35 - d) / (R * 0.5)) };
    }
    const flow = noise(seed, x, y, 60, "lava-flow") * 0.75 + noise(seed, x, y, 13, "lava-lobe") * 0.25;
    if (flow > 0.6) return { kind: "lava", strength: clamp((flow - 0.6) / 0.08) };
  }
  if (form === "pavement" && exposed > 0.35)
    return { kind: "pavement", strength: clamp((exposed - 0.35) / 0.25) };
  return undefined;
}

/** Where on the year's snowline a height stands. Metres, from the place's
 * plateau altitude plus its local steps; the line itself climbs to about
 * 5,200 m in the dry subtropics and falls toward the poles and in winter. */
export function snowlineAt(lat: number, season: string) {
  const a = Math.abs(lat);
  const line = a <= 30 ? 5200 : Math.max(150, 5200 - (a - 30) * 124);
  const reach = Math.min(1400, Math.max(0, (a - 15) * 50));
  return line - (season === "winter" ? reach : season === "spring" || season === "autumn" ? reach * 0.4 : 0);
}
export function placeAltitude(s: Pick<WorldSetting, "lon" | "lat">) {
  return highlandAltitude(s.lon, s.lat);
}
/** Metres a tier stands for: steps in a mountain range are higher than a floodplain's. */
// The second factor keeps most of a range's height now that it climbs in fewer, taller steps.
export const metresPerTier = (relief: number) => ((40 + relief * 160) * (1 + relief * 7)) / (1 + relief * 3.5);
