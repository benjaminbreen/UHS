import type { WorldSetting } from "../../geography/types";
import type { ReligiousProfile, ReligiousRule } from "./types";
import { europeReligious } from "./europe";
import { americasReligious } from "./americas";

/** Narrower date ranges win, so a specific period is not shadowed by a
 * broad one. No rule means no religious building: the setting's tradition
 * has not been researched for this engine, not that it had none. */
const rules: ReligiousRule[] = [...europeReligious, ...americasReligious].sort(
  (a, b) => a.to - a.from - (b.to - b.from) || a.id.localeCompare(b.id),
);

export function religiousProfile(
  s: WorldSetting,
): ReligiousProfile | undefined {
  const rule = rules.find((p) => {
    const [w, south, e, n] = p.bounds;
    return (
      s.culture === p.culture &&
      s.year >= p.from &&
      s.year < p.to &&
      s.lon >= w &&
      s.lon <= e &&
      s.lat >= south &&
      s.lat <= n
    );
  });
  if (!rule) return undefined;
  const { from, to, bounds, culture, ...profile } = rule;
  return profile;
}

export type ReligiousScale = "small" | "medium" | "large";
/** A town's religious building follows the town's extent. */
export function religiousScale(radius: number): ReligiousScale {
  return radius < 75 ? "small" : radius < 90 ? "medium" : "large";
}
export const religiousRules = rules;
