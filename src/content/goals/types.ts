import type { SeasonId } from "../../core/season";
import type { Workplace } from "../characters/workplace";
import type { ItemId } from "../../core/types";

/** What the picker knows about the player's day. Built once at dawn. */
export type GoalContext = {
  /** Livelihood activity text, or the actor's role when no kit exists. */
  activity: string;
  role: string;
  workplace?: Workplace;
  season: SeasonId;
  year: number;
  /** Pack commodities, currency and the trade pair. */
  commodities: ItemId[];
  currency?: ItemId;
  inventory: Partial<Record<ItemId, number>>;
  hunger: number;
  fatigue: number;
  /** Nearby place names by kind, e.g. { market: "the forum" }. */
  places: Record<string, string>;
};

/** How a goal is judged done. Checked against player state after each tick. */
export type GoalCheck =
  /** Inventory of `item` rises by `n` over the dawn count. */
  | { type: "gain"; item: ItemId; n: number }
  /** Any trade completes. */
  | { type: "trade" }
  /** Player stands inside a place whose kind matches. */
  | { type: "visit"; placeKind: string }
  /** Player talks to any person. */
  | { type: "talk" }
  /** Hunger falls below this value. */
  | { type: "eat"; below: number }
  /** Player sleeps (fatigue falls below this value). */
  | { type: "rest"; below: number };

export type GoalTemplate = {
  id: string;
  /** Matched against activity/role; absent means anyone. */
  trades?: RegExp;
  workplaces?: Workplace[];
  seasons?: SeasonId[];
  /** Extra fit test; return 0 to exclude, higher to prefer. Default 1. */
  fit?: (c: GoalContext) => number;
  /** "work" goals come first, then "need", then "social". */
  slot: "work" | "need" | "social";
  /** Returns undefined when the context cannot bind the template. */
  bind: (c: GoalContext) => { text: string; check: GoalCheck } | undefined;
};

/** A picked goal as stored in engine state. */
export type DailyGoal = {
  id: string;
  text: string;
  check: GoalCheck;
  /** Inventory count of the check item at dawn, for "gain". */
  base?: number;
  done?: boolean;
};
