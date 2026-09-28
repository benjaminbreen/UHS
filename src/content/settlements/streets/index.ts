import type { WorldSetting } from "../../geography/types";
import { italyStreet } from "./italy";
import { europeStreets } from "./europe";
import { industrialStreets } from "./industrial";
export type StreetMaterial =
  | "asphalt"
  | "concrete"
  | "basalt"
  | "cobble"
  | "slab"
  | "brick"
  | "sett"
  | "plank"
  | "macadam";
/** Content resolves place/date into material; rendering never branches on culture. */
export function streetMaterial(s: WorldSetting): StreetMaterial {
  const industrial = industrialStreets(s)?.main[0];
  if (industrial && industrial !== "earth") return industrial;
  for (const p of [italyStreet, ...europeStreets]) {
    const [w, south, e, n] = p.bounds;
    if (p.material === "plank" && !s.streetRevision) continue;
    if (
      s.year >= p.from &&
      s.year < p.to &&
      s.lon >= w &&
      s.lon <= e &&
      s.lat >= south &&
      s.lat <= n
    )
      return p.material;
  }
  // No worldwide technology ladder: unprofiled paving keeps the neutral art fallback.
  return "slab";
}
