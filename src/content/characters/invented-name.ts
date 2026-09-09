import { random } from "../../core/random";

/** Original fictional syllables, deliberately NOT attributed to any historical language.
 * This keeps unsupported starts playable without borrowing a different community's names.
 * Replace with a scoped naming kit as research becomes available. */
const syllables = [
  "na",
  "mi",
  "ra",
  "se",
  "lo",
  "ta",
  "ki",
  "ve",
  "sa",
  "nu",
  "ri",
  "ma",
  "le",
  "no",
  "ya",
  "va",
  "ti",
  "ne",
  "la",
  "so",
] as const;
export const inventedNameNote =
  "This personal name is invented from a shared fictional syllable set. It is not an attested local name, a translation, or a reconstruction of a historical language. Local naming research is not yet available.";
export function inventedName(seed: string, actorId: string) {
  const parts: string[] = [];
  for (let i = 0; i < 3; i++) {
    const choices = syllables.filter((s) => s !== parts.at(-1));
    parts.push(
      choices[
        Math.floor(
          random(seed, "invented-personal-name-v1", actorId, i) *
            choices.length,
        )
      ],
    );
  }
  const name = parts.join("");
  return name[0].toUpperCase() + name.slice(1);
}
