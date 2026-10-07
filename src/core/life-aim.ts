import { LIFE_AIM_TEMPLATES, type LifeAimContext } from "../content/goals/life-aims";
import { LOCAL_LIFE_AIMS } from "../content/goals/life-aim-practices";
import { absentChildOf } from "../content/bonds";
import { beliefOf, beliefsFor } from "../content/beliefs";
import { livelihoodById } from "../content/characters/livelihoods";
import { workplaceFor } from "../content/characters/workplace";
import { statsOf } from "./stats";
import { standingOf } from "./standing";
import { severity } from "./health";
import { capabilitiesFor, matchesCharacterScope } from "../content/characters/resolve";
import { outlookOf } from "./outlook";
import { random } from "./random";
import { marriagePracticeFor } from "../content/households/practices";
import type { Actor, Household, Snapshot } from "./types";
import type { WorldSetting } from "../content/geography/types";
import type { PersonalAim } from "../content/goals/types";

export function lifeAimOptions(
  seed: string,
  setting: WorldSetting | undefined,
  player: Actor,
  actors: Actor[],
  households: Household[] | undefined,
  snapshot?: Pick<Snapshot, "clock" | "ailments" | "bonds" | "economy">,
) {
  const household = households?.find((h) => h.members.includes(player.id));
  const people = actors.filter((a) => a.kind === "human" && !a.dead);
  const byId = new Map(people.map((a) => [a.id, a]));
  const kin = (player.relations ?? []).flatMap((r) => {
    const actor = byId.get(r.other);
    return actor && actor.kind === "human" ? [{ actor, kind: r.kind }] : [];
  });
  const children = kin
    .filter((r) => r.kind === "child" && household?.members.includes(r.actor.id))
    .sort((a, b) => (b.actor.age ?? 0) - (a.actor.age ?? 0))
    .map((r) => r.actor);
  const adultChild = children.find((a) => (a.age ?? 0) >= 16);
  const marriageChild = player.origin?.standing !== "unfree" && marriagePracticeFor(setting) ? household?.familyPlans
    ?.filter((plan) => plan.kind === "seek-match")
    .map((plan) => children.find((child) => child.id === plan.subject))
    .find((child) => child && (child.age ?? 0) >= 17 &&
      !child.relations?.some((relation) => relation.kind === "partner")) : undefined;
  const youngChild = [...children].reverse().find((a) => (a.age ?? 100) < 16);
  const elderlyParent = kin.find(
    (r) => r.kind === "parent" && (r.actor.age ?? 0) >= 60,
  )?.actor;
  const partner = kin.find((r) => r.kind === "partner")?.actor;
  const history = (household?.history ?? []).filter((e) => !setting || e.year <= setting.year).sort((a, b) => a.year - b.year);
  const latestHardship = [...history].reverse().find((e) =>
    ["bad-year", "fire", "robbed"].includes(e.kind));
  const lostPartner = [...history].reverse().find((e) =>
    e.kind === "died" && ["wife", "husband", "partner"].includes(e.as ?? ""));
  const rememberedKin = [...history].reverse().find((e) =>
    e.kind === "died" && ["wife", "husband", "partner", "son", "daughter", "mother", "father"].includes(e.as ?? ""));
  const outlook = setting ? outlookOf(seed, player, setting) : undefined;
  const kit = player.origin && livelihoodById(player.origin.specialty ?? player.origin.livelihood);
  const work = `${player.origin?.roleLabel ?? player.role} ${kit?.activity ?? player.activity}`;
  const trade = (player.origin?.roleLabel ?? player.role).replace(/^Apprentice /i, "").toLowerCase();
  const relation = (kind: string) => kin.find((r) => r.kind === kind)?.actor;
  const creditorHouse = households?.find((h) => h.id === household?.owes);
  const creditor = people.find((a) => a.id !== player.id && creditorHouse?.members.includes(a.id));
  const bonds = (snapshot?.bonds ?? []).flatMap((bond) => {
    const actor = byId.get(bond.with);
    return actor && actor.id !== player.id ? [{ actor, bond }] : [];
  });
  const sickKin = (snapshot?.ailments ?? [])
    .filter((a) => severity(a, snapshot?.clock ?? 0) >= 0.35 && household?.members.includes(a.who) && kin.some((k) => k.actor.id === a.who))
    .sort((a, b) => severity(b, snapshot?.clock ?? 0) - severity(a, snapshot?.clock ?? 0))
    .map((a) => byId.get(a.who))[0];
  const context: LifeAimContext = {
    setting,
    player,
    household,
    people,
    master: relation("master"),
    apprentice: relation("apprentice"),
    friend: relation("friend"),
    creditor,
    sickKin,
    beloved: bonds.find((b) => b.bond.kind === "beloved"),
    rival: bonds.find((b) => b.bond.kind === "rival")?.actor,
    estranged: bonds.find((b) => b.bond.kind === "estranged")?.actor,
    away: absentChildOf(seed, history, setting),
    stats: statsOf(seed, player),
    standing: standingOf(seed, player),
    outlook,
    belief: setting ? beliefOf(seed, player, beliefsFor(setting, player.origin?.community)) : undefined,
    capabilities: setting ? capabilitiesFor(setting) : new Set(),
    work,
    trade,
    workplace: kit?.workplace ?? workplaceFor(kit?.activity ?? player.activity),
    shortGoods: household ? snapshot?.economy?.short[household.id] ?? [] : [],
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
      !!outlook?.stances.some((s) => s.id === "general.dead-remain" || /ancestor|dead|afterlife/.test(s.id) && !s.tags.includes("sceptical")),
    hardTimes: (household?.fortune ?? 1) < 0.4 &&
      history.some((e) => ["bad-year", "fire", "robbed"].includes(e.kind)),
    hardship: latestHardship?.kind === "bad-year" || latestHardship?.kind === "fire" || latestHardship?.kind === "robbed"
      ? latestHardship.kind : undefined,
    lostPartner: lostPartner?.as === "wife" || lostPartner?.as === "husband" || lostPartner?.as === "partner"
      ? lostPartner.as : undefined,
    rememberedKin: rememberedKin?.as,
  };
  const community = player.origin?.community ?? "*";
  return [...LIFE_AIM_TEMPLATES, ...LOCAL_LIFE_AIMS].flatMap((template) => {
    if (template.scope && (!setting || !matchesCharacterScope(template.scope, setting, community))) return [];
    if (!template.eligible(context)) return [];
    const family = template.family ?? template.id;
    const shortage = context.shortGoods.some((g) => ["bread", "grain", "fish", "meat"].includes(g));
    const weight = template.weight * (template.fit?.(context) ?? 1) *
      (shortage && ["food-security", "restore-household"].includes(family) ? 1.5 : 1);
    if (weight <= 0) return [];
    const bound = template.bind(context);
    if (bound.subjects.some((id) => !byId.has(id))) return [];
    return [{ ...bound, id: template.id, family, weight, local: !!template.scope }];
  });
}

export function lifeAimOf(
  seed: string,
  setting: WorldSetting | undefined,
  player: Actor,
  actors: Actor[],
  households: Household[] | undefined,
  snapshot?: Pick<Snapshot, "clock" | "ailments" | "bonds" | "economy">,
): PersonalAim {
  const candidates = lifeAimOptions(seed, setting, player, actors, households, snapshot);
  const families = new Map<string, number>();
  for (const c of candidates) families.set(c.family, Math.max(families.get(c.family) ?? 0, c.weight));
  const pick = <T,>(xs: T[], weight: (x: T) => number, key: string) => {
    let draw = random(seed, "life-aim-v2", player.id, key) * xs.reduce((sum, x) => sum + weight(x), 0);
    return xs.find((x) => (draw -= weight(x)) < 0) ?? xs[xs.length - 1];
  };
  // A family with more authored variants must not gain a larger population share.
  const family = pick([...families.keys()].sort(), (id) => families.get(id)!, "family");
  const variants = candidates.filter((c) => c.family === family).sort((a, b) => a.id.localeCompare(b.id));
  const hasLocal = variants.some((c) => c.local);
  const chosen = pick(variants, (c) => c.weight * (hasLocal && !c.local ? 0.3 : 1), family);
  return { id: chosen.id, family: chosen.family, text: chosen.text, subjects: chosen.subjects,
    step: chosen.step, basis: chosen.basis, revision: 2 };
}

export function ensureLifeAim(snapshot: Snapshot, setting?: WorldSetting) {
  if (snapshot.lifeAim?.revision === 1 || snapshot.lifeAim?.revision === 2) return snapshot.lifeAim;
  snapshot.lifeAim = lifeAimOf(
    snapshot.manifest.seed,
    setting,
    snapshot.player,
    snapshot.actors,
    snapshot.households,
    snapshot,
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
