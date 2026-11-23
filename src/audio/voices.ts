import { faunaCombat, faunaProfile } from "../content/fauna";
import { sexFromName } from "../content/characters/name-sex";
import type { BeastVoice, VoiceKind } from "./sfx";
import type { Voice } from "./wildlife";

type Speaker = {
  name: string;
  age?: number;
  origin?: { sex?: string };
  appearance?: { physique?: { sex?: string } };
};
/** A person's voice: register by sex, raised for a child. */
export function voiceOf(actor: Speaker): VoiceKind {
  if ((actor.age ?? 30) < 14) return "child";
  const sex =
    actor.origin?.sex ??
    actor.appearance?.physique?.sex ??
    sexFromName(actor.name);
  return sex === "female" ? "woman" : sex === "male" ? "man" : "neutral";
}
/** An animal's voice: what it sounds like matters less than how big it is
 * and whether it can fly off. */
export function beastVoiceOf(speciesId: string): BeastVoice {
  const profile = faunaProfile(speciesId);
  if (!profile) return "critter";
  if (profile.locomotion === "ground-and-flight") return "bird";
  const mass = faunaCombat(profile).mass;
  if (mass >= 3) return "beast";
  if (profile.social === "herd" || profile.social === "flock") return "herd";
  return mass >= 2 ? "herd" : "critter";
}
/** What a wild animal says when the player puts it up, if it has a call. */
export function callOf(speciesId: string): Voice | undefined {
  if (/crow|rook|raven|jackdaw/.test(speciesId)) return "crow";
  if (/gull/.test(speciesId)) return "gull";
  if (/sparrow|finch/.test(speciesId)) return "sparrow";
  if (/chicken|fowl|turkey/.test(speciesId)) return "hen";
  if (/goose/.test(speciesId)) return "goose";
  if (/duck/.test(speciesId)) return "duck";
  if (/sheep/.test(speciesId)) return "sheep";
  if (/goat/.test(speciesId)) return "goat";
  if (/cattle|buffalo|yak|aurochs/.test(speciesId)) return "cow";
  if (/pig|boar/.test(speciesId)) return "pig";
  if (/donkey|mule/.test(speciesId)) return "donkey";
  if (/horse/.test(speciesId)) return "horse";
  if (/^cat$|wildcat/.test(speciesId)) return "cat";
  if (/dog|wolf/.test(speciesId)) return "growl";
}
