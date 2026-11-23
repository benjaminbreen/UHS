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
  /** Hands `n` of the day's goods to the card person's household: off the
   * wage and into their store. */
  | { type: "give"; n: number }
  /** The card person's household owes yours `n` more. */
  | { type: "credit"; n: number }
  /** The card person's household pays what it owes yours. */
  | { type: "collect" }
  /** What the card person's household owes yours is let go. */
  | { type: "forgive" }
  /** `card` comes back with the same person in `days`. */
  | { type: "later"; card: string; days: number }
  | { type: "hurt"; n: number; cause: string; injury?: import("../health/injuries").InjuryId }
  /** The card's sick person is cared for: one in `odds` who were dying mend. */
  | { type: "tend"; odds: number }
  | { type: "care"; treatment: import("../health/infections").Treatment }
  /** Walks the player to someone, the card still waiting for an answer. */
  | { type: "go"; who: string }
  /** The chance, 0 to 1, of catching an illness from it. */
  | { type: "risk"; ailment: string; odds: number }
  /** Down a mine, something goes wrong there and then, to be run from. */
  | { type: "peril"; kind: import("../../core/mine-peril").PerilKind }
  /** The card's accosters set on the player: a real fight. */
  | { type: "fight" }
  /** Taken by a press gang and held for days. */
  | { type: "pressed" };

export type CardChoice = {
  label: string;
  /** What it costs, under the label. */
  note?: string;
  /** Odds before the stat and skill are counted; for a `debtor` check, before
   * how well off the card person's household is. */
  check?: { stat: keyof Stats; skill?: SkillId; odds: number } | { debtor: true; odds: number };
  then: CardEffect[];
  /** The sentence kept for the day's account. */
  line: string;
  /** What the card person and anyone watching tell others the player did,
   * before the person's name: "gave bread on credit to". Its tone is the
   * choice's regard. */
  word?: string;
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
  /** Only when a neighbouring household is poor or short of bread or grain;
   * the neighbour is one of them. */
  hungry?: true;
  /** Only while the card person's household owes the player's. */
  owes?: true;
  /** What is said and done if the card is never answered. */
  lapse?: { line: string; regard?: number };
  scope?: CharacterScope;
  /** Only for this work: the activities whose days it belongs to. */
  work?: readonly string[];
  hazards?: 2;
  /** What the society must have been able to do for this to happen at all. */
  needs?: readonly SocietyCapability[];
  /** Only for a fishing day, and how the household fishes: in its own boat,
   * owing a share of the catch, or selling it (false: sharing it among kin). */
  fishing?: { boat?: boolean; owed?: boolean; sold?: boolean };
  /** Only for a hunting day: where game is owed to a lord or chief, where
   * meat is sold (false: shared among kin), and whether a big kill is in hand. */
  hunting?: { owed?: boolean; sold?: boolean; kill?: boolean };
  /** Only down mines working these. */
  mine?: readonly ("coal" | "metal" | "salt")[];
  /** Today's weather it needs: heat, rain or snow, or cold. */
  when?: "hot" | "wet" | "cold";
  text: string;
  choices: CardChoice[];
  evidence: Evidence["status"];
};
