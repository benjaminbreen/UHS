import type { WorldSetting } from "../geography/types";
import { urbanForm } from "./urban-form";

/** Plots: each house in its own green plot, earth lanes off a cobbled street.
 * Rows: houses shoulder to shoulder on the street. The regional urban form
 * says whether its towns were built in plots; a dry climate packs them into
 * rows all the same, and a setting may say outright. A rule about places,
 * never about which sprites they are drawn with. */
export function settlementLayout(
  setting: WorldSetting | undefined,
): "plots" | "rows" {
  if (!setting) return "rows";
  if (setting.settlementLayout) return setting.settlementLayout;
  const dry = setting.climate === "mediterranean" || setting.climate === "arid";
  return urbanForm(setting).plots && !dry ? "plots" : "rows";
}
