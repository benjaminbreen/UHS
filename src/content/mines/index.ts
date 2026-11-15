import type { MineKind } from "../sewers/types";

export { mineFinds } from "./finds";
export { mineItems, oreItems } from "./items";
export { minePeople } from "./people";

/** Coal and salt are worked in their own ways; everything else is a vein. */
export const mineKindOf = (ore: string): MineKind => (ore === "coal" ? "coal" : ore === "salt" ? "salt" : "metal");
