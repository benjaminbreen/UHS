import {
  wearSlots,
  type CharacterAppearance,
  type WearSlot,
} from "./character";
import type { ItemDef, ItemId } from "./types";
import {
  clothId,
  dyeAt,
  parseCloth,
  type Cloth,
} from "../content/characters/wardrobe/cloth";

type Wearing = CharacterAppearance["wearing"];
export type Worn = Partial<Record<WearSlot, ItemId>>;

/** The look with nothing on but the base garment's colours. */
export function bareWearing(base: Wearing): Wearing {
  return {
    ...base,
    garment: "none",
    headwear: "none",
    necklace: false,
    neckStyle: undefined,
    eyewear: "none",
    earrings: false,
    cloak: false,
    mantle: false,
    belt: "none",
    shoulderCloth: false,
    leggings: "none",
    footwear: "none",
    material: undefined,
    quality: undefined,
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
  // The body garment's cloth, carried out of the item id so the drawing and
  // the item's name describe the same thing.
  const body = worn.body ? parseCloth(worn.body) : undefined;
  return body
    ? { ...out, material: body.cloth.material, quality: body.cloth.quality }
    : out;
}

/** Worn slots equivalent to an authored `wearing` record: saves made before
 * items were wearable, fresh characters, and the customizer. */
export function wornFromWearing(w: Wearing, cloth?: Cloth): Worn {
  // Cloth rides in the item id, so the inventory stays a plain count of ids
  // and nothing in the save format has to change to carry it.
  //
  // A person's clothes are not all cut from one bolt, and the drawn figure
  // already says so: the garment, the lower half and the trim each have their
  // own colour. Each worn item takes the dye of the part it covers, so the
  // item list and the figure agree.
  const of = (id: string, hex?: string) => {
    if (!cloth) return id;
    const dye = dyeAt(hex);
    return clothId(id, dye ? { ...cloth, dye } : cloth);
  };
  const worn: Worn = {};
  if (w.garment !== "none") worn.body = of(`garment-${w.garment}`, w.color);
  if (w.headwear !== "none") worn.head = of(`headwear-${w.headwear}`, w.lowerColor);
  if (w.cloak) worn.over = of("cloak", w.cloakColor);
  else if (w.shoulderCloth) worn.over = of("shoulder-cloth", w.cloakColor);
  if (w.belt && w.belt !== "none") worn.belt = of(`belt-${w.belt}`, w.trim);
  if (w.necklace) worn.neck = w.neckStyle === "chain" ? "chain" : "necklace";
  if (w.eyewear && w.eyewear !== "none") worn.eyes = w.eyewear;
  if (w.earrings) worn.ears = "earrings";
  if (w.leggings && w.leggings !== "none") worn.legs = of(`leggings-${w.leggings}`, w.lowerColor);
  if (w.footwear && w.footwear !== "none")
    worn.feet = of(`footwear-${w.footwear}`, w.lowerColor);
  return worn;
}
