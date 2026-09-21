import type { WorldSetting } from "../geography/types";

/** How a settlement holds up a step in its ground. Absent, the step is a
 * plain earth bank, as in open country. */
export type EdgeStyle =
  | "drystone"
  | "rubble"
  | "ashlar"
  | "brick"
  | "concrete"
  | "adobe"
  | "timber";

/** Content resolves place and date into a wall; rendering never branches on
 * culture. */
export function edgeStyle(
  s: WorldSetting,
  cold = false,
): EdgeStyle | undefined {
  if (s.settlement === "camp" || s.architecture === "shelter") return;
  const town = s.settlement === "city" || s.settlement === "port";
  if (cold && (s.architecture === "timber" || s.architecture === "board"))
    return "timber";
  if (s.architecture === "mudbrick")
    return s.year < -3000 ? undefined : "adobe";
  if (!town) return s.year < -2000 ? undefined : "drystone";
  if (s.year >= 1920) return "concrete";
  if (s.year >= 1750) return "brick";
  if (s.architecture === "classical" && s.year < 600) return "ashlar";
  return s.year < -1500 ? "drystone" : "rubble";
}

/** How a street climbs a step: graded carriageways once towns are engineered
 * for wheels, stone steps in the paved towns before that, a cut earth ramp
 * anywhere unpaved or earlier. */
export function crossingStyle(
  s: WorldSetting,
  paved: boolean,
): "graded" | "steps" | "cut" {
  if (!paved || s.year < -700) return "cut";
  return s.year >= 1800 ? "graded" : "steps";
}
