import type { CharacterScope, SocietyCapability } from "../characters/context-types";
import type { Evidence } from "../history/types";
import type { SkillId } from "../../core/skills";
import type { Stats } from "../../core/types";

export type CardEffect =
  /** How the day's work is going, which sets the wage. */
  | { type: "day"; delta: number }
  /** Added to or taken off the wage when it is paid. */
  | { type: "pay"; delta: number }
  | { type: "minutes"; n: number }
  | { type: "sleep"; n: number }
  | { type: "fatigue"; n: number }
  | { type: "item"; item: string; n: number }
  | { type: "forfeit" }
  /** With the card's person. */
  | { type: "regard"; delta: number }
  | { type: "hurt"; n: number; cause: string; injury?: string }
  /** The card's sick person is cared for: one in `odds` who were dying mend. */
  | { type: "tend"; odds: number }
  | { type: "care"; treatment: import("../health/infections").Treatment }
  /** The chance, 0 to 1, of catching an illness from it. */
  | { type: "risk"; ailment: string; odds: number };

export type CardChoice = {
  label: string;
  /** What it costs, under the label. */
  note?: string;
  /** Odds before the stat and skill are counted. */
  check?: { stat: keyof Stats; skill?: SkillId; odds: number };
  then: CardEffect[];
  /** The sentence kept for the day's account. */
  line: string;
  otherwise?: CardEffect[];
  otherwiseLine?: string;
};

/** A moment in the day's work with a choice in it, said by or of a person
 * or, with no `who`, told. Text takes `{boss}`, `{Boss}` and `{name}`, the
 * person's first name. */
export type ChoiceCard = {
  id: string;
  /** The recipe step it belongs to. */
  slot: string;
  /** Who it is said by or of: the man over the work, a neighbour, the
   * household the day's work is for, an official, or the sick person. */
  who?: "boss" | "neighbour" | "client" | "official" | "patient";
  /** What they are to the player here, where their own trade would mislead. */
  as?: string;
  scope?: CharacterScope;
  /** Only for this work: the activities whose days it belongs to. */
  work?: readonly string[];
  /** What the society must have been able to do for this to happen at all. */
  needs?: readonly SocietyCapability[];
  /** Only for a fishing day, and how the household fishes: in its own boat,
   * owing a share of the catch, or selling it (false: sharing it among kin). */
  fishing?: { boat?: boolean; owed?: boolean; sold?: boolean };
  /** Only for a hunting day: where game is owed to a lord or chief, where
   * meat is sold (false: shared among kin), and whether a big kill is in hand. */
  hunting?: { owed?: boolean; sold?: boolean; kill?: boolean };
  /** Today's weather it needs: heat, rain or snow, or cold. */
  when?: "hot" | "wet" | "cold";
  text: string;
  choices: CardChoice[];
  evidence: Evidence["status"];
};
