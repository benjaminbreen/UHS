import type { WorldSetting } from "../../geography/types";

export type StreetDetail = {
  id: string;
  prop: string;
  variants: readonly number[];
  name: string;
  description: string;
  spacing: number;
  perBuildings: number;
  limit: number;
  trade?: RegExp;
  sources: readonly string[];
};
export type DetailSetting = Pick<WorldSetting, "year" | "culture" | "lon" | "lat" | "settlement">;
export function within(s: DetailSetting, w: number, south: number, e: number, n: number) {
  return s.lon >= w && s.lon <= e && s.lat >= south && s.lat <= n;
}
