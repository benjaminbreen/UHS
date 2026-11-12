import type { Stats } from "../../core/types";

/** How someone puts a demand. A wording may give `<line>.<stance>` beside any spoken line. */
export type Stance = "reluctant" | "bully" | "gossip" | "stickler" | "unsure" | "talker";

// The same cut-offs as dispositionOf, so the word on the card and the voice agree.
const HIGH = 62, LOW = 38;

/** Most people have none and say the plain line. `trust` is theirs in the player. */
export function stanceOf(stats: Stats, trust: number): Stance | undefined {
  if (stats.agreeableness <= LOW && trust < 3) return "bully";
  if (stats.agreeableness >= HIGH || trust >= 3) return "reluctant";
  if (stats.conscientiousness >= HIGH) return "stickler";
  if (stats.extraversion >= HIGH) return stats.conscientiousness <= LOW ? "talker" : "gossip";
  if (stats.neuroticism >= HIGH) return "unsure";
}

/** For the model that speaks for them after the scripted line. */
export const STANCE_VOICE: Record<Stance, string> = {
  reluctant: "You dislike having to ask. You are sorry about it, you offer an easy way to settle, and you do not threaten unless they refuse outright.",
  bully: "You are blunt and you push. Short sentences, no apology, and you say exactly what you will do to them if they do not pay.",
  gossip: "You talk about what other people are saying and who has heard. What you hold over them is talk, and you offer to stop it.",
  stickler: "You state what is owed, the amount and the day, as a matter of what is fair. You are not angry and you do not bend.",
  unsure: "You are not certain you are in the right and you say so. You ask more than you demand, and you want a straight answer.",
  talker: "You say more than you need to, and say what you have been doing and feeling about this, but you do get to what you want.",
};
