import {
  wearSlots,
  type CharacterAppearance,
  type WearSlot,
} from "./character";
import type { ItemDef, ItemId } from "./types";

type Wearing = CharacterAppearance["wearing"];
export type Worn = Partial<Record<WearSlot, ItemId>>;

/** The look with nothing on but the base garment's colours. */
export function bareWearing(base: Wearing): Wearing {
  return {
    ...base,
    headwear: "none",
    necklace: false,
    earrings: false,
    cloak: false,
    belt: "none",
    shoulderCloth: false,
  };
}

/** Base colours plus whatever the worn items add, slot by slot. */
export function composeWearing(
  base: Wearing,
  worn: Worn,
  item: (id: ItemId) => ItemDef | undefined,
): Wearing {
  let out = bareWearing(base);
  for (const slot of wearSlots) {
    const id = worn[slot];
    const def = id ? item(id) : undefined;
    if (def?.wear?.slot === slot) out = { ...out, ...def.wear.look };
  }
  return out;
}

/** Worn slots equivalent to an authored `wearing` record: saves made before
 * items were wearable, fresh characters, and the customizer. */
export function wornFromWearing(w: Wearing): Worn {
  const worn: Worn = { body: `garment-${w.garment}` };
  if (w.headwear !== "none") worn.head = `headwear-${w.headwear}`;
  if (w.cloak) worn.over = "cloak";
  else if (w.shoulderCloth) worn.over = "shoulder-cloth";
  if (w.belt && w.belt !== "none") worn.belt = `belt-${w.belt}`;
  if (w.necklace) worn.neck = "necklace";
  if (w.earrings) worn.ears = "earrings";
  return worn;
}
