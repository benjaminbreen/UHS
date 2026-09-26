import type { SkillId } from "../../core/skills";
import type { TechniqueId } from "../../core/techniques";
import type { EraId } from "../history/dates";
import type { CultureId } from "../history/types";
import { animals, farming, foraging, hunting } from "./land";
import { arms, marksmanship } from "./combat";
import { crafting, stonework, woodcraft } from "./craft";
import { speech, trade } from "./people";
import { wayfaring } from "./road";
import { SOURCES } from "./sources";
import type { SkillContext } from "./types";

export const SKILL_CONTEXT: Record<SkillId, SkillContext> = {
  hunting, foraging, farming, animals, marksmanship, arms, woodcraft, stonework, crafting, speech, trade, wayfaring,
};

/** The reading for a skill at one place and time: the most specific entries
 * that apply, and how specific they managed to be. */
export function skillContext(skill: SkillId, culture?: CultureId, era?: EraId) {
  const fits = SKILL_CONTEXT[skill].entries
    .filter((e) => (!e.cultures || (culture && e.cultures.includes(culture))) && (!e.eras || (era && e.eras.includes(era))))
    .map((e) => ({ e, score: (e.cultures ? 2 : 0) + (e.eras ? 1 : 0) }))
    .sort((a, b) => b.score - a.score);
  const [best, next] = fits;
  const ids = [...new Set([...(best?.e.sources ?? []), ...(next?.e.sources ?? [])])].slice(0, 4);
  return {
    wiki: best?.e.wiki ?? [],
    sources: ids.map((id) => SOURCES[id]),
    matched: { culture: !!best?.e.cultures, era: !!best?.e.eras },
  };
}

export const techniqueContext = (skill: SkillId, id: TechniqueId) => SKILL_CONTEXT[skill].techniques[id];
