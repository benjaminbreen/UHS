import { random } from "./random";
import type {
  DailyGoal,
  GoalContext,
  GoalTemplate,
} from "../content/goals/types";
import type { Actor } from "./types";

export function pickGoals(
  seed: string,
  day: number,
  c: GoalContext,
  templates: GoalTemplate[],
): DailyGoal[] {
  const scored = templates
    .map((t) => {
      // Skip if trades regex fails
      if (t.trades && !t.trades.test(c.activity + " " + c.role)) {
        return undefined;
      }

      // Skip if workplace/season mismatch
      if (t.workplaces && !t.workplaces.some((wp) => wp === c.workplace)) {
        return undefined;
      }
      if (t.seasons && !t.seasons.includes(c.season)) {
        return undefined;
      }

      // Get fit score (default 1)
      const fit = t.fit?.(c) ?? 1;

      // Skip if fit is 0
      if (fit === 0) {
        return undefined;
      }

      // Skip if bind returns undefined
      const bound = t.bind(c);
      if (!bound) {
        return undefined;
      }

      // Calculate score
      const tradesMatch = t.trades ? t.trades.test(c.activity + " " + c.role) : false;
      const score =
        fit *
        (tradesMatch ? 3 : 1) *
        (0.5 + random(seed, "goal", day, t.id));

      return { template: t, bound, score, fit };
    })
    .filter((x): x is Exclude<typeof x, undefined> => x !== undefined);

  // Sort by slot priority (work > need > social) and then by score
  const workGoals = scored.filter((s) => s.template.slot === "work").sort((a, b) => b.score - a.score);
  const needGoals = scored.filter((s) => s.template.slot === "need").sort((a, b) => b.score - a.score);
  const socialGoals = scored.filter((s) => s.template.slot === "social").sort((a, b) => b.score - a.score);

  const result: DailyGoal[] = [];

  // Pick best work goal
  if (workGoals.length > 0) {
    const best = workGoals[0];
    result.push({
      id: best.template.id,
      text: best.bound.text,
      check: best.bound.check,
    });
  }

  // Pick best need goal only if fit > 1 (urgent), else best social
  if (needGoals.length > 0 && needGoals[0].fit > 1) {
    result.push({
      id: needGoals[0].template.id,
      text: needGoals[0].bound.text,
      check: needGoals[0].bound.check,
    });
  } else if (socialGoals.length > 0) {
    result.push({
      id: socialGoals[0].template.id,
      text: socialGoals[0].bound.text,
      check: socialGoals[0].bound.check,
    });
  }

  // Maybe add a third goal (social or need) if random > 0.5
  if (result.length < 3 && random(seed, "goal3", day) > 0.5) {
    const remaining = result.length === 2 && result[1].id === socialGoals[0]?.template.id
      ? needGoals.filter((ng) => ng.template.id !== result[0].id)
      : socialGoals.filter((sg) => sg.template.id !== (result[result.length - 1]?.id ?? ""));
    if (remaining.length > 0) {
      result.push({
        id: remaining[0].template.id,
        text: remaining[0].bound.text,
        check: remaining[0].bound.check,
      });
    }
  }

  return result.slice(0, 3);
}

export function goalDone(
  g: DailyGoal,
  player: Actor,
  flags: { traded: boolean; talked: boolean; placeKind?: string },
): boolean {
  const check = g.check;

  switch (check.type) {
    case "gain":
      return (player.inventory[check.item] ?? 0) - (g.base ?? 0) >= check.n;

    case "trade":
      return flags.traded;

    case "visit":
      return flags.placeKind === check.placeKind;

    case "talk":
      return flags.talked;

    case "eat":
      return player.hunger < check.below;

    case "rest":
      return player.fatigue < check.below;

    default:
      const _exhaustive: never = check;
      return _exhaustive;
  }
}
