import type { ItemDef } from "../../core/types";
import { crypt, cryptItems } from "./crypt";
import { theban, tombItems } from "./theban";
import type { TombStyle } from "./types";

export type { TombArt, TombFind, TombRole, TombStyle } from "./types";
export { TOMB_ART } from "./types";

export const tombStyles: readonly TombStyle[] = [theban, crypt];
export const tombStyle = (id: string) => tombStyles.find((s) => s.id === id);
export const tombFind = (style: TombStyle, id: string) => style.finds.find((f) => f.id === id);

/** The kind of tomb found at this place and year, if any. */
export function tombAt(lon: number, lat: number, year: number) {
  return tombStyles.find((s) => year >= s.years[0] && year <= s.years[1] && lon >= s.where[0] && lat >= s.where[1] && lon <= s.where[2] && lat <= s.where[3]);
}

export const tombItemDefs: Record<string, ItemDef> = Object.fromEntries(Object.entries({ ...tombItems, ...cryptItems }).map(([id, [name, sprite, value, description]]) => [id, { id, name, sprite, value, description }]));
