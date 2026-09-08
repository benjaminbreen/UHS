import type { WorldSetting } from "../../geography/types";
import type { CivicProfile } from "./types";
import { italyCivic } from "./italy";
import { europeCivic } from "./europe";
/** Dated regional content names institutions; the planner only sees shared forms.
 * An unresearched setting gets an explicitly illustrative meeting hall, never
 * a Roman institution or a purportedly documented civic building by default. */
export function civicProfile(s: WorldSetting): CivicProfile {
  for (const p of [...italyCivic, ...europeCivic]) {
    const [w, south, e, n] = p.bounds;
    if (
      s.culture === p.culture &&
      s.year >= p.from &&
      s.year < p.to &&
      s.lon >= w &&
      s.lon <= e &&
      s.lat >= south &&
      s.lat <= n
    )
      return p;
  }
  return {
    id: "illustrative-public-hall",
    label: "Public meeting hall",
    square: "Gathering square",
    form: "hall",
    evidence: {
      status: "fictional",
      sources: [],
      note: "An illustrative shared hall using this setting's architectural materials. Institutional identity and exact form have not been researched for this location and date.",
    },
  };
}
