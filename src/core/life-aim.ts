import { LIFE_AIM_TEMPLATES, type LifeAimContext } from "../content/goals/life-aims";
import { matchesCharacterScope } from "../content/characters/resolve";
import { outlookOf } from "./outlook";
import { random } from "./random";
import { marriagePracticeFor } from "../content/households/practices";
import type { Actor, Household, Snapshot } from "./types";
import type { WorldSetting } from "../content/geography/types";
import type { PersonalAim } from "../content/goals/types";

/** Pick a lasting concern from recorded circumstances, rather than a daily task. */
export function lifeAimOf(
  seed: string,
  setting: WorldSetting | undefined,
  player: Actor,
  actors: Actor[],
  households: Household[] | undefined,
): PersonalAim {
  const household = households?.find((h) => h.members.includes(player.id));
  const byId = new Map(actors.map((a) => [a.id, a]));
  const kin = (player.relations ?? []).flatMap((r) => {
    const actor = byId.get(r.other);
    return actor && actor.kind === "human" ? [{ actor, kind: r.kind }] : [];
  });
  const children = kin
    .filter((r) => r.kind === "child" && r.actor.householdId === household?.id)
    .sort((a, b) => (b.actor.age ?? 0) - (a.actor.age ?? 0))
    .map((r) => r.actor);
  const adultChild = children.find((a) => (a.age ?? 0) >= 16);
  const marriageChild = marriagePracticeFor(setting) && household?.familyPlans
    ?.filter((plan) => plan.kind === "seek-match")
    .map((plan) => children.find((child) => child.id === plan.subject))
    .find((child) => child && (child.age ?? 0) >= 17 &&
      !child.relations?.some((relation) => relation.kind === "partner"));
  const youngChild = [...children].reverse().find((a) => (a.age ?? 100) < 16);
  const elderlyParent = kin.find(
    (r) => r.kind === "parent" && (r.actor.age ?? 0) >= 60,
  )?.actor;
  const partner = kin.find((r) => r.kind === "partner")?.actor;
  const history = household?.history ?? [];
  const latestHardship = [...history].reverse().find((e) =>
    ["bad-year", "fire", "robbed"].includes(e.kind));
  const lostPartner = [...history].reverse().find((e) =>
    e.kind === "died" && ["wife", "husband", "partner"].includes(e.as ?? ""));
  const rememberedKin = [...history].reverse().find((e) =>
    e.kind === "died" && ["wife", "husband", "partner", "son", "daughter", "mother", "father"].includes(e.as ?? ""));
  const outlook = setting ? outlookOf(seed, player, setting) : undefined;
  const context: LifeAimContext = {
    setting,
    player,
    household,
    adultChild,
    marriageChild,
    youngChild,
    elderlyParent,
    partner,
    recentlyMoved: !!setting && history.some(
      (e) => e.kind === "moved" && e.year >= setting.year - 5,
    ),
    establishedHome: history.some((e) => e.kind === "inherited")
      ? "inherited"
      : history.some((e) => e.kind === "built") ? "built" : undefined,
    widowed: !partner && history.some(
      (e) => e.kind === "died" && ["wife", "husband", "partner"].includes(e.as ?? ""),
    ),
    remembersDead: history.some((e) => e.kind === "died") &&
      !!outlook?.stances.some((s) => s.id === "general.dead-remain"),
    hardTimes: (household?.fortune ?? 1) < 0.4 &&
      history.some((e) => ["bad-year", "fire", "robbed"].includes(e.kind)),
    hardship: latestHardship?.kind === "bad-year" || latestHardship?.kind === "fire" || latestHardship?.kind === "robbed"
      ? latestHardship.kind : undefined,
    lostPartner: lostPartner?.as === "wife" || lostPartner?.as === "husband" || lostPartner?.as === "partner"
      ? lostPartner.as : undefined,
    rememberedKin: rememberedKin?.as,
  };
  const community = player.origin?.community ?? "*";
  const candidates = LIFE_AIM_TEMPLATES.flatMap((template) => {
    if (template.scope && (!setting || !matchesCharacterScope(template.scope, setting, community)))
      return [];
    if (!template.eligible(context)) return [];
    return [{ template, bound: template.bind(context) }];
  });
  if (!candidates.length) {
    const traveler = player.origin?.livelihood === "traveler";
    return {
      id: traveler ? "find-belonging" : "make-a-life",
      text: traveler
        ? "Find a place where you can stay and work without being a stranger."
        : "Make a life that reaches beyond the work of this day.",
      subjects: [],
      revision: 1,
    };
  }
  const chosen = candidates
    .map(({ template, bound }) => ({
      ...bound,
      id: template.id,
      score: template.weight * (0.5 + random(seed, "life-aim", template.id)),
    }))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))[0];
  return { id: chosen.id, text: chosen.text, subjects: chosen.subjects, step: chosen.step, revision: 1 };
}

export function ensureLifeAim(snapshot: Snapshot, setting?: WorldSetting) {
  if (snapshot.lifeAim?.revision === 1) return snapshot.lifeAim;
  snapshot.lifeAim = lifeAimOf(
    snapshot.manifest.seed,
    setting,
    snapshot.player,
    snapshot.actors,
    snapshot.households,
  );
  return snapshot.lifeAim;
}

export function advanceLifeAim(
  snapshot: Snapshot,
  action: { type: "talk"; actor: string } | { type: "give"; actor: string; item: string } | { type: "work" },
) {
  const step = snapshot.lifeAim?.step;
  if (!step) return false;
  if (step.type === "work" && action.type === "work" && step.progress < step.target) {
    step.progress++;
    return step.progress === step.target;
  }
  if (step.type === "talk" && action.type === "talk" && step.actor === action.actor && !step.done) {
    step.done = true;
    return true;
  }
  if (step.type === "give" && action.type === "give" && step.actor === action.actor &&
      step.items.includes(action.item) && !step.done) {
    step.done = true;
    return true;
  }
  return false;
}
