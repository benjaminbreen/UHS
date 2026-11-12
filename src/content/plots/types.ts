import type { Actor, Economy, Household, Stats, WalkOff } from "../../core/types";
import type { SkillId } from "../../core/skills";
import type { WorldSetting } from "../geography/types";
import type { CharacterScope } from "../characters/context-types";
import type { Occasion } from "./scenes";

export const plotRoles = ["creditor", "landlord", "official", "accuser", "witness", "rival", "suspect", "host",
  "giver", "inlaw", "claimant", "elder", "customer", "patron", "kin", "friend", "neighbour", "stranger", "child",
  "helper", "buyer", "beloved"] as const;
export type PlotRole = typeof plotRoles[number];

export type PlotScene = "doorstep" | PlotRole;

/** What kind of day the plot makes. The draw balances shapes, so the many
 * plots where someone comes to demand something do not crowd out the rest. */
export type PlotShape = "claim" | "work" | "household" | "occasion" | "discovery" | "world" | "news"
  | "witness" | "desire" | "mystery" | "light";

export type PlotContext = {
  seed: string;
  setting?: WorldSetting;
  clock: number;
  player: Actor;
  actors: Actor[];
  households: Household[];
  household?: Household;
  economy?: Economy;
};

/** Plain data, so a scenario written from sources can produce the same thing. */
export type Condition =
  | { type: "since"; hours: number }
  /** The player has spoken with this member of the cast since the plot began. */
  | { type: "talked"; role: PlotRole }
  | { type: "speaking"; role: PlotRole }
  | { type: "at"; scene: PlotScene }
  /** The player has spoken with them after finishing a day's work since the plot began. */
  | { type: "brought"; role: PlotRole }
  /** The deadline has passed by `hours`, or is that close when negative. */
  | { type: "due"; hours?: number }
  | { type: "settled" }
  | { type: "seized" }
  | { type: "gone"; role: PlotRole }
  | { type: "fired"; id: string }
  /** The player turned up while a gathering was on. */
  | { type: "came" }
  /** A gathering has come and gone. */
  | { type: "gathered" }
  | { type: "not"; of: Condition }
  | { type: "all"; of: Condition[] }
  | { type: "any"; of: Condition[] }
  /** `hours` have passed since `id` fired. */
  | { type: "after"; id: string; hours: number };

/** One answer on a choice card. Its button reads line `<id>:label`; choosing
 * fires `id`, shows line `<id>:then` if there is one, and a failed check also
 * fires and shows `<id>:failed`. A check's stat may be a word, "{stat}". */
export type PlotChoice = { id: string; check?: { stat: keyof Stats | `{${string}}`; skill?: SkillId; odds: number } };

export type Effect =
  | { type: "approach"; role: PlotRole; line: string }
  /** The world stops for a decision; the banner shows the scene at `line`. `from` walks up and asks
   * it in person: only for a question they would put to you themselves. */
  | { type: "choose"; line: string; focus?: PlotRole; from?: PlotRole; at?: PlotScene; choices: PlotChoice[] }
  /** A turn: the world stops and the card shows this line, the camera on `focus`. */
  | { type: "card"; line: string; focus?: PlotRole; from?: PlotRole; at?: PlotScene }
  | { type: "note"; line: string }
  | { type: "regard"; role: PlotRole; delta: number }
  | { type: "seize"; role: PlotRole }
  | { type: "walk-off"; role: PlotRole; to: WalkOff }
  | { type: "extend"; hours: number }
  /** Loose the plot's predator, `words.species`: a man-eater on the district, or a raider on the household's pen. */
  | { type: "loose"; as: "maneater" | "raider" }
  /** What is owed, multiplied: 0.7 after a good haggle, 1.5 when they ask for more. */
  | { type: "owe"; times: number }
  /** People meet at a cast member's house, before the authority, on the common
   * ground by the temple or hall (`green`) or past the last houses (`edge`), at
   * the deadline, the next evening or morning, or so many hours from now;
   * that becomes the new deadline.
   * `label` is what those who come are doing; `aim` replaces the player's aim. */
  | { type: "gather"; at: PlotRole | "authority" | "green" | "edge"; when: "deadline" | "evening" | "morning" | number; label: string; aim?: string; scene: Occasion };

/** Lines are templates over the words fixed when the plot begins. */
export type PlotWording = {
  scope?: CharacterScope;
  title: string;
  lines: Record<string, string>;
};

/** How the plot's cards look: a drawn emblem and the five colours its frame,
 * text and emblem share. */
export type PlotLook = {
  /** A scene in src/ui/plot-emblems.ts, or a file of that name in src/ui/emblems/scenes. */
  emblem: string;
  palette: { ink: string; fill: string; edge: string; light: string; accent: string };
};

export type PlotTemplate = {
  id: string;
  shape: PlotShape;
  look: PlotLook;
  weight: (c: PlotContext) => number;
  cast: (c: PlotContext) => Partial<Record<PlotRole, Actor>> | undefined;
  /** The clock and the words, fixed once at the start. */
  begin: (c: PlotContext, cast: Partial<Record<PlotRole, Actor>>) => {
    deadline: number;
    owed?: number;
    words: Record<string, string>;
    /** The words that name someone, by word: `creditor` to the creditor's id. */
    refs?: Record<string, string>;
  };
  /** Who takes payment toward `owed`; the creditor when unset. */
  payee?: PlotRole;
  opening: Effect[];
  developments: { id: string; when: Condition; then: Effect[] }[];
  /** The first discovery opens the plot. Later notes reveal only the roles the player has learned about. */
  journal?: { opens: string; missed: string; notes: { after: string; line: string; label: string; roles?: PlotRole[] }[] };
  /** First match ends the plot; its line is the closing text. */
  endings: { id: string; when: Condition; quiet?: boolean }[];
  /** First scope match wins; the last entry has none. */
  wording: PlotWording[];
};
