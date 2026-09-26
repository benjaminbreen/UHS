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
  /** Names and sprites of buildings in the settlement, lowercased. */
  places: { name: string; sprite: string }[];
};

/** How a goal is judged done. Checked against player state. */
export type GoalCheck =
  /** Combined count of `items` rises by `n` over the dawn count. */
  | { type: "gain"; items: ItemId[]; n: number }
  | { type: "trade" }
  | { type: "work" }
  /** Player enters a building whose name or sprite matches. */
  | { type: "visit"; place: string }
  | { type: "talk" }
  /** Player comes within a few steps of this cell. */
  | { type: "reach"; x: number; y: number }
  | { type: "talk-to"; actor: string }
  | { type: "eat"; below: number }
  | { type: "rest"; below: number };

export type GoalTemplate = {
  id: string;
  /** Matched against activity/role; absent means anyone. */
  trades?: RegExp;
  workplaces?: Workplace[];
  seasons?: SeasonId[];
  /** Extra fit test; return 0 to exclude, higher to prefer. Default 1. */
  fit?: (c: GoalContext) => number;
  /** "work" goals come first, then "need", then "social". "own" is the
   * day's agenda, which is not drawn from templates. */
  slot: "work" | "need" | "social" | "own";
  /** Returns undefined when the context cannot bind the template. */
  bind: (c: GoalContext) => { text: string; check: GoalCheck } | undefined;
};

/** A picked goal as stored in engine state. */
export type DailyGoal = {
  id: string;
  slot?: GoalTemplate["slot"];
  text: string;
  check: GoalCheck;
  /** Count of the check items at dawn, for "gain". */
  base?: number;
  done?: boolean;
};

/** A durable concern drawn from a character's circumstances, not a daily task. */
export type PersonalAim = {
  id: string;
  text: string;
  subjects: string[];
  revision?: 1;
  step?:
    | { type: "talk"; actor: string; text: string; done?: boolean }
    | { type: "give"; actor: string; items: ItemId[]; text: string; done?: boolean }
    | { type: "work"; target: number; progress: number; text: string };
};
