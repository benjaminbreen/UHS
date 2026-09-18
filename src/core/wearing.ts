import {
  wearSlots,
  type CharacterAppearance,
  type WearSlot,
} from "./character";
import type { ItemDef, ItemId } from "./types";
import { clothId, type Cloth } from "../content/characters/wardrobe/cloth";

type Wearing = CharacterAppearance["wearing"];
export type Worn = Partial<Record<WearSlot, ItemId>>;

/** The look with nothing on but the base garment's colours. */
export function bareWearing(base: Wearing): Wearing {
  return {
    ...base,
    garment: "none",
    headwear: "none",
    necklace: false,
    earrings: false,
    cloak: false,
    mantle: false,
    belt: "none",
    shoulderCloth: false,
    leggings: "none",
    footwear: "none",
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
export function wornFromWearing(w: Wearing, cloth?: Cloth): Worn {
  // Cloth rides in the item id, so the inventory stays a plain count of ids
  // and nothing in the save format has to change to carry it.
  const of = (id: string) => (cloth ? clothId(id, cloth) : id);
  const worn: Worn = {};
  if (w.garment !== "none") worn.body = of(`garment-${w.garment}`);
  if (w.headwear !== "none") worn.head = of(`headwear-${w.headwear}`);
  if (w.cloak) worn.over = of("cloak");
  else if (w.shoulderCloth) worn.over = of("shoulder-cloth");
  if (w.belt && w.belt !== "none") worn.belt = of(`belt-${w.belt}`);
  if (w.necklace) worn.neck = "necklace";
  if (w.earrings) worn.ears = "earrings";
  if (w.leggings && w.leggings !== "none") worn.legs = of(`leggings-${w.leggings}`);
  if (w.footwear && w.footwear !== "none")
    worn.feet = of(`footwear-${w.footwear}`);
  return worn;
}
