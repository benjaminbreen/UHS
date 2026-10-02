/** Why one of the player's own people walks over, and what they say. A need
 * names its words; the engine decides when it holds. Several lines each so a
 * long life does not hear the same sentence twice running. */
export type KinNeed = "hungry" | "missed" | "plot" | "store" | "late" | "visit";

export type KinWords = {
  /** What a child calls the player: "Mother", "Father". */
  parent: string;
  name: string;
};

export const KIN_LINES: Record<string, (w: KinWords) => string[]> = {
  "child:hungry:young": (w) => [
    `${w.parent}, I'm hungry. Is there nothing to eat?`,
    `My belly hurts, ${w.parent}. When do we eat?`,
    `There's no bread left. I looked.`,
  ],
  "child:hungry:old": () => [
    "There's nothing in the store. What are we to eat tonight?",
    "The little ones are asking for food and I've nothing to give them.",
  ],
  "child:missed:young": (w) => [
    `Where did you go, ${w.parent}? You were gone the whole day.`,
    `${w.parent}! I looked for you everywhere.`,
  ],
  "partner:store": () => [
    "The store's near empty. What will we eat tomorrow?",
    "I counted what's left. It won't last the week.",
  ],
  "partner:late": () => [
    "It's late. Where have you been all this time?",
    "I kept the fire in for you. You might have sent word.",
  ],
  "parent:visit": () => [
    "You've not sat with me all day. Am I so easy to forget?",
    "Come here and let me look at you. I see less of you every day.",
  ],
  "sibling:visit": () => [
    "You walk past me like a stranger. Have you a moment for your own blood?",
    "Still too busy for me? Our parents would have had something to say about that.",
  ],
};
