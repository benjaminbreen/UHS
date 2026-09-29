import type { Pack } from "../core/types";
import { resolvePlayablePacks } from "./history/playable";
import { items as baseItems } from "./legacy-packs";
import { ecologicalItems } from "./ecology/resources";
import { forageItems } from "./ecology/forage";
import { metalItems } from "./ecology/metals";
import { floraItems } from "./ecology/flora";
import { wearableItems } from "./characters/wearables";
import { dungItems } from "./fauna/dung";
import { vegetableItems } from "./agriculture/gardens";
// legacy-packs is frozen, so its items get their descriptions here.
const baseAbout: Record<string, string> = {
  bread:
    "Flour, water and salt baked on a hot stone or in an oven: the day's plain meal.",
  grain:
    "Threshed seed from the harvest, stored against the lean months and ground into flour.",
  water:
    "Drawn from a well or river and carried home in a clay jar; drunk, cooked with, and never quite enough.",
  coin:
    "Struck bronze small change, worn smooth in purses and market stalls.",
  obsidian:
    "Volcanic glass knapped into flakes sharper than any metal; traded far from where it was found.",
  wool:
    "A sheep's fleece, greasy and matted, waiting to be washed, combed and spun.",
  wood:
    "Split logs and branches for the hearth, gathered daily and never plentiful near town.",
  fish:
    "Split, salted and dried in the sun; it keeps for months and softens in a stew.",
  tool:
    "A short blade for cutting cord, food and everything else a day brings.",
  flax:
    "Stalks pulled, retted and beaten for their fibre, which is spun into linen thread.",
  lizard:
    "A small lizard caught by hand, wriggling; a snack, a curiosity or a child's prize.",
};
export const items: Record<
  import("../core/types").ItemId,
  import("../core/types").ItemDef
> = {
  ...Object.fromEntries(
    Object.entries(baseItems).map(([id, d]) => [
      id,
      { description: baseAbout[id], ...d },
    ]),
  ),
  ...ecologicalItems,
  ...forageItems,
  ...metalItems,
  ...floraItems,
  ...wearableItems,
  ...dungItems,
  ...vegetableItems,
  "walking-cane": { id: "walking-cane", name: "Walking cane", description: "A stout stick with a curved or knobbed head, for steadying a walk or for show.", sprite: "walking-cane", value: 4, hand: {} },
  fan: { id: "fan", name: "Folding fan", description: "Pleated paper or silk on slender ribs, snapped open to stir the air or hide a smile.", sprite: "fan", value: 3, hand: {} },
  bow: { id: "bow", name: "Bow", description: "A stave of wood, horn or both, strung taut to send an arrow farther than any throw.", sprite: "bow", value: 8, hand: {} },
  arrow: { id: "arrow", name: "Arrow", description: "A straight shaft fletched with feathers and tipped with stone, bone or metal.", sprite: "arrow", value: 1 },
  sling: { id: "sling", name: "Sling", description: "Two cords and a pouch; whirled overhead, it hurls a stone hard enough to kill.", sprite: "sling", value: 3, hand: {} },
};
export const packs: Record<string, Pack> = resolvePlayablePacks();
export function resolvePrompt(
  input: string,
): { pack: Pack; seed: string } | { error: string } {
  const q = input.trim().toLowerCase();
  const date = /\b(\d+)\s*(bce|bc|ce|ad)\b/.exec(q);
  if (date) {
    const year = Number(date[1]),
      bce = date[2].startsWith("b");
    if (!((bce && year === 6500) || (!bce && year === 100)))
      return {
        error:
          "That date is outside this build’s supported periods: 100 CE and c. 6500 BCE. Your requested setting is preserved.",
      };
  }
  if (/roman|rome|tiber|ostia/.test(q) && /neolith|anatolia|konya|6500/.test(q))
    return {
      error:
        "This description combines the two supported settings. Choose Roman Italy or Neolithic Anatolia.",
    };
  const p = /neolith|anatolia|konya|6500|çatal|catal|early farmer/.test(q)
    ? packs.neolithic
    : /roman|rome|tiber|ostia|100\s*(ce|ad)|gaius/.test(q)
      ? packs.roman
      : undefined;
  return p
    ? { pack: p, seed: p.defaultSeed }
    : {
        error:
          "This build supports Roman Italy around 100 CE and Neolithic Anatolia around 6500 BCE. Your requested setting is preserved above; choose a supported world below.",
      };
}
