/** A blink is three frames: the lid on its way down, shut, and on its way up
 * again is the same middle frame played back. */
export type Blink = 0 | 1 | 2;

export const expressions = [
  "neutral",
  "smile",
  "happy",
  "laugh",
  "sad",
  "angry",
  "stern",
  "surprised",
  "worried",
  "thoughtful",
  "wry",
  "tired",
] as const;
export type Expression = (typeof expressions)[number];

/**
 * The mouth shapes speech is drawn with. Three is enough at this size: a
 * closed mouth, a narrow one for most consonants, and an open one for the
 * vowels. Two shapes alternating reads as chewing.
 */
export const visemes = ["closed", "narrow", "wide"] as const;
export type Viseme = (typeof visemes)[number];

/** Which shape a letter asks for. Silence and the lip-closers shut it. */
export function visemeFor(letter: string): Viseme {
  const c = letter.toLowerCase();
  if (!/\p{L}/u.test(c) || "mbp".includes(c)) return "closed";
  return /[aeiouyàáâäãåāèéêëēìíîïīòóôöõøōùúûüū]/.test(c) ? "wide" : "narrow";
}

export const PORTRAIT_WIDTH = 64;
export const PORTRAIT_HEIGHT = 80;
