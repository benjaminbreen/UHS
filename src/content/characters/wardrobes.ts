import type { CharacterAppearance } from "../../core/character";
import type { Pack } from "../../core/types";
import { random } from "../../core/random";
/** Generic silhouette kits. These are qualified visual defaults, not reconstructions
 * of specific garments or a researched global history of dress. Explicit wardrobes win. */
const draped = [
  "tunic",
  "tunic",
  "long-tunic",
  "long-tunic",
  "robe",
  "skirt",
  "wrap",
] as const;
const layered = [
  "shirt",
  "tunic",
  "long-tunic",
  "robe",
  "skirt",
  "coat",
] as const;
export function wardrobeFor(
  id: string,
  pack: Pick<Pack, "year" | "id">,
  base: CharacterAppearance["wearing"],
): CharacterAppearance["wearing"] {
  const n = (key: string, max: number) =>
    Math.floor(random(id, "wardrobe", pack.id, key) * max);
  const kit = pack.year <= 500 ? draped : layered;
  const garment = kit[n("garment", kit.length)];
  return {
    ...base,
    garment,
    sleeves:
      garment === "wrap"
        ? "none"
        : garment === "robe"
          ? "loose"
          : garment === "coat"
            ? "long"
            : n("sleeves", 3) === 0
              ? "long"
              : "short",
    hem: garment === "wrap" ? "slanted" : n("hem", 3) === 0 ? "split" : "plain",
    shoulderCloth: n("shoulder", 4) === 0,
    cloak: n("cloak", 7) === 0,
  };
}
