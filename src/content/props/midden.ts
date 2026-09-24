import type { WorldSetting } from "../geography/types";
import { subsistenceFor } from "../characters/resolve";

/** What a midden is made of, as the index of its sprite variant. Chosen by how
 * the place lived and when, not by culture: bone and fire-cracked rock where
 * people hunted, shell on a coast, ash and sherds where they farmed, dung and
 * horn where they herded, tile and oyster in a town, and glass, cinder and
 * clay pipe once those were cheap enough to throw away. */
export function middenContents(s: WorldSetting, coast = false) {
  const town = s.settlement === "city" || s.settlement === "port";
  if (s.year >= 1650 && (town || s.year >= 1800)) return 5;
  if (town && s.year >= -3000) return 4;
  const shares = subsistenceFor(s)?.shares;
  const forage = (shares?.foraging ?? 0) + (shares?.fishing ?? 0);
  if (
    s.settlement === "camp" ||
    forage > (shares?.farming ?? 0) + (shares?.herding ?? 0)
  )
    return coast || (shares?.fishing ?? 0) > (shares?.foraging ?? 0) ? 1 : 0;
  return (shares?.herding ?? 0) > (shares?.farming ?? 0) ? 3 : 2;
}

/** Until a town carted its rubbish away, which in Europe and its colonies was
 * the later nineteenth century; elsewhere often later still. */
export const middenYears = (s: WorldSetting) => s.year < 1880;
