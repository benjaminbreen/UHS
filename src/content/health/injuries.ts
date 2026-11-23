import type { HurtLook } from "../../core/character";

/** Injuries to the player's body: what each one is, where, how bad and how
 * long it takes to mend. What an injury stops the player doing follows from
 * the part and the grade (`injuryLimits`), so a new one needs only a line. */
/** How long the world stops for a bad injury before its card comes up. */
export const INJURY_SCENE_MS = 2800;

export type InjuryPart = "leg" | "arm" | "hand" | "ribs" | "head" | "face" | "skin";

export type InjuryDef = {
  id: string;
  name: string;
  part: InjuryPart;
  /** 1 sore, 2 laid low for a week or two, 3 a broken bone or worse. */
  grade: 1 | 2 | 3;
  days: readonly [number, number];
  /** Open to the air, so it can go bad (`wound` in infections). */
  open?: boolean;
  /** A broken bone: setting it shortens the mend, and one left unset may knit crooked. */
  bone?: boolean;
  /** The moment, in the second person. */
  felt: string;
};

export const INJURIES = [
  { id: "bruises", name: "bruises", part: "skin", grade: 1, days: [2, 4], felt: "You will be black and blue tomorrow." },
  { id: "graze", name: "a bad graze", part: "skin", grade: 1, days: [3, 5], open: true, felt: "The skin is scraped raw and full of grit." },
  { id: "cut", name: "a cut", part: "skin", grade: 1, days: [3, 6], open: true, felt: "It bleeds freely, then slows." },
  { id: "black-eye", name: "a black eye", part: "face", grade: 1, days: [4, 7], felt: "The eye swells half shut." },
  { id: "split-lip", name: "a split lip", part: "face", grade: 1, days: [3, 5], open: true, felt: "You taste blood." },
  { id: "welts", name: "welts from a beating", part: "skin", grade: 1, days: [4, 7], felt: "Every stripe of it burns." },
  { id: "cut-palm", name: "a cut palm", part: "hand", grade: 1, days: [4, 7], open: true, felt: "The blade opened your palm." },
  { id: "bruised-knee", name: "a bruised knee", part: "leg", grade: 1, days: [3, 5], felt: "The knee stiffens as you stand." },
  { id: "broken-nose", name: "a broken nose", part: "face", grade: 1, days: [12, 20], bone: true, felt: "Something crunches, and your eyes stream." },
  { id: "burn", name: "burned skin", part: "skin", grade: 2, days: [7, 14], open: true, felt: "The skin blisters and weeps." },
  { id: "burned-hand", name: "a burned hand", part: "hand", grade: 2, days: [7, 14], open: true, felt: "You cannot close the hand for the blisters." },
  { id: "gash", name: "a deep gash", part: "skin", grade: 2, days: [8, 14], open: true, felt: "It is deep, and it will not stop bleeding." },
  { id: "bite", name: "a bad bite", part: "arm", grade: 2, days: [7, 12], open: true, felt: "The teeth went in deep." },
  { id: "rabid-bite", name: "a rabid dog's bite", part: "arm", grade: 2, days: [25, 35], open: true, felt: "The dog was foaming. You try not to think about it." },
  { id: "sprained-ankle", name: "a sprained ankle", part: "leg", grade: 2, days: [5, 10], felt: "The ankle turns under you and swells fat within the hour." },
  { id: "wrenched-knee", name: "a wrenched knee", part: "leg", grade: 2, days: [8, 14], felt: "The knee gives with a wet pop." },
  { id: "dislocated-shoulder", name: "a dislocated shoulder", part: "arm", grade: 2, days: [10, 20], felt: "The arm hangs wrong from the shoulder." },
  { id: "cracked-ribs", name: "cracked ribs", part: "ribs", grade: 2, days: [18, 30], bone: true, felt: "Every breath catches." },
  { id: "concussion", name: "a concussion", part: "head", grade: 2, days: [4, 10], felt: "The world swims, and you are sick in the dirt." },
  { id: "broken-nose-bad", name: "a smashed face", part: "face", grade: 2, days: [14, 24], bone: true, open: true, felt: "Your face is a mess of blood." },
  { id: "broken-wrist", name: "a broken wrist", part: "hand", grade: 3, days: [30, 45], bone: true, felt: "You put a hand out to break the fall, and it broke instead." },
  { id: "crushed-hand", name: "a crushed hand", part: "hand", grade: 3, days: [30, 50], bone: true, felt: "The fingers will not answer." },
  { id: "broken-arm", name: "a broken arm", part: "arm", grade: 3, days: [30, 45], bone: true, felt: "The arm bends where there is no joint." },
  { id: "broken-collarbone", name: "a broken collarbone", part: "arm", grade: 3, days: [28, 42], bone: true, felt: "A snap at the shoulder, and the arm will not lift." },
  { id: "broken-ankle", name: "a broken ankle", part: "leg", grade: 3, days: [35, 50], bone: true, felt: "The foot points the wrong way." },
  { id: "broken-leg", name: "a broken leg", part: "leg", grade: 3, days: [42, 63], bone: true, felt: "You hear it go before you feel it." },
  { id: "gored-thigh", name: "a gored thigh", part: "leg", grade: 3, days: [21, 35], open: true, felt: "The horn went into the thigh and out again." },
  { id: "mauling", name: "a mauling", part: "skin", grade: 3, days: [21, 35], open: true, felt: "Claws and teeth. You are torn in a dozen places." },
] as const satisfies readonly InjuryDef[];

export type InjuryId = (typeof INJURIES)[number]["id"];

export const injuryDef = (id: string | undefined): InjuryDef | undefined => INJURIES.find((d) => d.id === id);

export type InjuryLimits = {
  /** Walking pace, 1 sound. */
  pace: number;
  run: boolean;
  climb: boolean;
  /** Riding a cycle or a horse. */
  ride: boolean;
  /** Taken off strength, agility and endurance. */
  physical: number;
  /** Shown on the gait: 1 a limp, 2 a heavy one. */
  lame: 0 | 1 | 2;
};

const SOUND: InjuryLimits = { pace: 1, run: true, climb: true, ride: true, physical: 0, lame: 0 };

/** What an injury stops, at `mended` (0 fresh, 1 healed). A leg's pace comes
 * back as it knits, and running only near the end. */
export function injuryLimits(def: InjuryDef | undefined, mended = 0): InjuryLimits {
  if (!def) return SOUND;
  const { part, grade } = def;
  const healing = Math.min(1, Math.max(0, mended)), worse = 1 - healing ** 1.5;
  const leg = part === "leg", arm = part === "arm" || part === "hand";
  const worst = leg ? (grade === 3 ? 0.4 : grade === 2 ? 0.65 : 0.9) : part === "ribs" || part === "head" ? 0.85 : grade === 3 ? 0.85 : 1;
  const pace = 1 - (1 - worst) * worse;
  return {
    pace,
    run: grade === 1 || healing >= 0.75 || !(leg || part === "ribs" || part === "head"),
    climb: grade === 1 || healing >= 0.6 || !(leg || arm || part === "ribs"),
    ride: grade < 3 || healing >= 0.6 || !(leg || arm),
    physical: [0, 0.05, 0.15, 0.35][grade] * worse,
    lame: !leg || pace > 0.9 ? 0 : pace < 0.6 ? 2 : 1,
  };
}

/** What the figure wears for it while it mends: a crutch gives way to a
 * splint as a leg knits, a sling comes off near the end. */
export function hurtLook(def: InjuryDef | undefined, mended = 0): HurtLook | undefined {
  if (!def || mended >= 0.9) return undefined;
  const { part, grade, id } = def;
  if (part === "leg") return grade === 3 ? (mended < 0.65 ? "crutch" : "splint") : grade === 2 && id !== "sprained-ankle" ? "splint" : undefined;
  if (part === "arm") return def.bone || id === "dislocated-shoulder" ? (mended < 0.8 ? "sling" : undefined) : "arm";
  if (part === "hand") return "hand";
  if (part === "ribs") return "ribs";
  if (part === "head") return "head";
  if (part === "face") return "face";
  return grade >= 2 ? "arm" : undefined;
}

/** The new reality, in short lines for the injury card. */
export function injuryLines(def: InjuryDef, days: number, year: number) {
  const l = injuryLimits(def, 0);
  const lines: string[] = [];
  if (l.pace <= 0.5) lines.push("You can barely walk. A stick or a crutch will be your third leg for weeks.");
  else if (l.pace < 0.9) lines.push(def.part === "leg" ? "You limp, and walk slowly." : "You move slowly and carefully.");
  if (!l.run) lines.push("No running until it mends.");
  if (!l.climb) lines.push("No climbing: not trees, not walls, not roofs.");
  if (!l.ride) lines.push("You can't ride: no horse, no cycle.");
  if (def.part === "hand" || def.part === "arm") lines.push(def.grade === 3 ? "That hand is useless for work for now." : "Work with that hand is slow and clumsy.");
  if (def.part === "head") lines.push("Light hurts, and thoughts come slowly.");
  if (l.physical >= 0.15) lines.push("Everything physical is harder.");
  if (def.open) lines.push("Keep it clean, or it may go bad.");
  if (def.bone) lines.push(`${year >= 1900 ? "A doctor can set it in plaster" : year >= 1850 ? "A surgeon can splint it" : "A bonesetter can set it"}: it mends sooner and straighter.`);
  lines.push(days >= 14 ? `About ${Math.round(days / 7)} weeks to mend.` : `About ${days} days to mend.`);
  return lines;
}
