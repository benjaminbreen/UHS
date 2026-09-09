import type { WorldSetting } from "../../geography/types";
import { networkOnset } from "../../geography/onsets";
import type { UrbanForm, UrbanFormRule } from "./types";
import { eastAsiaForms } from "./east-asia";
import { southAsiaForms } from "./south-asia";
import { westAsiaForms } from "./west-asia";
import { europeForms } from "./europe";
import { americasForms } from "./americas";
import { africaForms } from "./africa";
import { southeastAsiaForms } from "./southeast-asia";

/** Narrower date ranges win, so a specific period is not shadowed by a broad one. */
const rules: UrbanFormRule[] = [
  ...eastAsiaForms,
  ...southAsiaForms,
  ...westAsiaForms,
  ...europeForms,
  ...americasForms,
  ...africaForms,
  ...southeastAsiaForms,
].sort((a, b) => a.to - a.from - (b.to - b.from) || a.id.localeCompare(b.id));

/** An unprofiled place gets a plainly labelled generic town, never another
 * region's fabric. Culture families with no urban entry here are not being
 * described as lacking towns; their layouts have not been researched for this
 * engine. */
export const genericForm: UrbanForm = {
  id: "illustrative-town-fabric",
  storeys: 2,
  label: "Illustrative town fabric",
  plan: "organic",
  block: [22, 16],
  regularity: 0.35,
  courts: 0.45,
  deadEnds: 0.2,
  tiers: [2, 1, 0],
  gates: 4,
  wall: "none",
  plaza: "offset",
  plazaScale: 0.17,
  civic: "head",
  evidence: {
    status: "fictional",
    sources: [],
    note: "A generic arrangement of blocks, streets and a public space using this setting's own building materials. Street layout has not been researched for this location and date.",
  },
};

export function urbanForm(s: WorldSetting): UrbanForm {
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
  if (!rule) return genericForm;
  const { from, to, bounds, culture, ...form } = rule;
  return form;
}

/** Earliest date any researched fabric covers this culture at these
 * coordinates, or Infinity where none does. Regional, not per-settlement: it
 * says when towns of this kind existed in this region, not when this
 * particular place was founded. */
export function urbanOnset(
  s: Pick<WorldSetting, "culture" | "lon" | "lat">,
): number {
  let onset = Infinity;
  for (const p of rules) {
    const [w, south, e, n] = p.bounds;
    if (
      s.culture === p.culture &&
      s.lon >= w &&
      s.lon <= e &&
      s.lat >= south &&
      s.lat <= n
    )
      onset = Math.min(onset, p.from);
  }
  return onset;
}

/** Whether this place and date can hold a town at all. A culture family with no
 * urban entry is not being described as lacking towns; its layouts have not
 * been researched, so before the region's own settlement network formed there
 * is nothing to build a town from. */
export function urbanized(
  s: Pick<WorldSetting, "culture" | "lon" | "lat" | "year">,
): boolean {
  return s.year >= Math.min(urbanOnset(s), networkOnset(s));
}
