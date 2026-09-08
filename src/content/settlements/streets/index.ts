import type { WorldSetting } from "../../geography/types";
import { italyStreet } from "./italy";
import { europeStreets } from "./europe";
export type StreetMaterial = "basalt" | "cobble" | "slab" | "brick";
/** Content resolves place/date into material; rendering never branches on culture. */
export function streetMaterial(s: WorldSetting): StreetMaterial {
  for (const p of [italyStreet, ...europeStreets]) {
    const [w, south, e, n] = p.bounds;
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
  return s.culture === "east-asian" && s.year >= 600
    ? "slab"
    : s.year >= 1000
      ? "cobble"
      : "slab";
}
