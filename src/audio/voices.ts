import { faunaCombat, faunaProfile } from "../content/fauna";
import { sexFromName } from "../content/characters/name-sex";
import type { BeastVoice, VoiceKind } from "./sfx";

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
