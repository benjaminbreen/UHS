import type { CharacterScope } from "../characters/context-types";
import type { Workplace } from "../characters/workplace";
import type { Evidence } from "../history/types";

/** What a piece of lore is about. The task screen asks for all that apply to
 * a task and shows the most particular answer for the place and time. */
export type LoreTopic =
  /** An occasion or festival by id: "day.death-day", "fest.china.qingming". */
  | { occasion: string }
  /** A daily goal template by id: "harvest", "water", "worship". */
  | { goal: string }
  /** A life aim by id: "household-home", "marriage-hope". */
  | { aim: string }
  /** A trade, matched against the livelihood's name and activity. */
  | { trade: RegExp }
  | { workplace: Workplace }
  /** A task-screen scene: "water", "cook", "herd". */
  | { scene: string };

/**
 * What a task meant in one place and time: an account written for the game,
 * and the reading behind it. Scoped like everything else in content, so the
 * same "draw water" says one thing at a Mesopotamian canal and another at a
 * Yoruba compound well.
 */
export type TaskLore = {
  id: string;
  scope: CharacterScope;
  topics: readonly LoreTopic[];
  evidence: Evidence["status"];
  /** A heading for the card: "Canal irrigation in Ur III Sumer". */
  title: string;
  /** 60-150 words, plain prose, specific to the scope. */
  text: string;
  /** English Wikipedia titles, most particular first, each checked to exist. */
  wiki: readonly string[];
  /** Further https sources, where there is something better than Wikipedia. */
  sources?: readonly string[];
};
