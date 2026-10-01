import type { Actor, Household, WalkOff } from "../../core/types";
import type { WorldSetting } from "../geography/types";
import type { CharacterScope } from "../characters/context-types";

export type PlotRole = "creditor";

export type PlotContext = {
  seed: string;
  setting?: WorldSetting;
  clock: number;
  player: Actor;
  actors: Actor[];
  households: Household[];
  household?: Household;
};

/** Plain data, so a scenario written from sources can produce the same thing. */
export type Condition =
  | { type: "since"; hours: number }
  /** The deadline has passed by `hours`, or is that close when negative. */
  | { type: "due"; hours?: number }
  | { type: "settled" }
  | { type: "seized" }
  | { type: "gone"; role: PlotRole }
  | { type: "fired"; id: string }
  | { type: "not"; of: Condition }
  | { type: "all"; of: Condition[] };

export type Effect =
  | { type: "approach"; role: PlotRole; line: string }
  /** The plot's title card, once, at the start. */
  | { type: "title"; line: string }
  /** A turn: the world stops and the card shows this line, the camera on `focus`. */
  | { type: "card"; line: string; focus?: PlotRole }
  | { type: "regard"; role: PlotRole; delta: number }
  | { type: "seize"; role: PlotRole }
  | { type: "walk-off"; role: PlotRole; to: WalkOff }
  | { type: "extend"; hours: number };

/** Lines are templates over the words fixed when the plot begins. */
export type PlotWording = {
  scope?: CharacterScope;
  title: string;
  lines: Record<string, string>;
};

/** How the plot's cards look: a drawn emblem and the five colours its frame,
 * text and emblem share. */
export type PlotLook = {
  emblem: "slate";
  palette: { ink: string; fill: string; edge: string; light: string; accent: string };
};

export type PlotTemplate = {
  id: string;
  look: PlotLook;
  weight: (c: PlotContext) => number;
  cast: (c: PlotContext) => Partial<Record<PlotRole, Actor>> | undefined;
  /** The clock and the words, fixed once at the start. */
  begin: (c: PlotContext, cast: Partial<Record<PlotRole, Actor>>) => {
    deadline: number;
    owed?: number;
    words: Record<string, string>;
  };
  opening: Effect[];
  developments: { id: string; when: Condition; then: Effect[] }[];
  /** First match ends the plot; its line is the closing text. */
  endings: { id: string; when: Condition }[];
  /** First scope match wins; the last entry has none. */
  wording: PlotWording[];
};
