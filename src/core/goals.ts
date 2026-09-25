import { random } from "./random";
import type {
  DailyGoal,
  GoalContext,
  GoalTemplate,
} from "../content/goals/types";
import type { Actor } from "./types";

type Scored = { t: GoalTemplate; goal: DailyGoal; fit: number; score: number };

/** One to three goals for the day: a job of work, then an urgent need or a
 * social errand, sometimes both. Deterministic for a seed and day. */
export function pickGoals(
  seed: string,
  day: number,
  c: GoalContext,
  templates: GoalTemplate[],
): DailyGoal[] {
  const who = `${c.activity} ${c.role}`;
  const scored: Scored[] = [];
  for (const t of templates) {
    if (t.workplaces && (!c.workplace || !t.workplaces.includes(c.workplace)))
      continue;
    if (t.seasons && !t.seasons.includes(c.season)) continue;
    const trade = t.trades?.test(who);
    if (t.trades && !trade && !t.workplaces) continue;
    const fit = t.fit?.(c) ?? 1;
    if (!fit) continue;
    const bound = t.bind(c);
    if (!bound) continue;
    scored.push({
      t,
      fit,
      goal: { id: t.id, slot: t.slot, ...bound },
      score: fit * (trade ? 3 : 1) * (0.5 + random(seed, "goal", day, t.id)),
    });
  }
  const best = (slot: GoalTemplate["slot"], minFit = 0) =>
    scored
      .filter((s) => s.t.slot === slot && s.fit > minFit)
      .sort((a, b) => b.score - a.score)[0];
  const work = best("work");
  const need = best("need", 1);
  const social = best("social");
  const picks = [work, need ?? social];
  if (need && random(seed, "goal3", day) > 0.5) picks.push(social);
  return picks.filter((s): s is Scored => !!s).map((s) => s.goal);
}

export const heldCount = (a: Actor, items: string[]) =>
  items.reduce((n, id) => n + (a.inventory[id] ?? 0), 0);

export function goalDone(
  g: DailyGoal,
  player: Actor,
  flags: {
    traded: boolean;
    talked: boolean;
    visited: string[];
    worked?: boolean;
  },
): boolean {
  const c = g.check;
  switch (c.type) {
    case "gain":
      return heldCount(player, c.items) - (g.base ?? 0) >= c.n;
    case "trade":
      return flags.traded;
    case "work":
      return !!flags.worked;
    case "talk":
      return flags.talked;
    case "visit":
      return flags.visited.some((v) => v.includes(c.place.toLowerCase()));
    case "eat":
      return player.hunger < c.below;
    case "rest":
      return player.fatigue < c.below;
  }
}
