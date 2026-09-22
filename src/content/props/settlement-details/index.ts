import type { PropDef } from "../catalog";
import type { Pack } from "../../../core/types";
import { europeanDetails } from "./europe";
import { westAsianDetails } from "./west-asia";
import { asianDetails } from "./asia";
import { americanDetails } from "./americas";
export { graveAxis, muslimBurialStyle } from "./west-asia";
export type { StreetDetail } from "./types";

export const detailProps: Record<string, PropDef> = {
  saintNiche: { name: "Saint's shrine", family: "saint-niche", solid: true, visualClearance: [1, 1, 1, 0] },
  burialStone: { name: "Grave marker", family: "burial-stone", solid: true, variants: 6, visualClearance: [1, 1, 1, 0] },
  newsstand: { name: "Newspaper stand", family: "newsstand", solid: true, visualClearance: [1, 1, 1, 0] },
  streetFountain: { name: "Street fountain", family: "street-fountain", solid: true, drink: true, visualClearance: [1, 1, 1, 0] },
  streetNotice: { name: "Public notices", family: "street-notice", solid: true, visualClearance: [1, 1, 1, 0] },
  jizo: { name: "Roadside Jizō", family: "jizo", solid: true, visualClearance: [1, 1, 1, 0] },
  marketDisplay: { name: "Merchant's display", family: "market-display", solid: true, visualClearance: [1, 1, 0, 0] },
  waterStation: { name: "Drinking jars", family: "water-station", solid: true, drink: true, visualClearance: [1, 1, 1, 0] },
};

export function settlementDetails(pack: Pack) {
  const s = pack.setting;
  if (!s || s.settlement === "camp" || s.settlement === "farm") return [];
  return [...europeanDetails(s), ...westAsianDetails(s), ...asianDetails(s), ...americanDetails(s)];
}

/** A beam scale belongs to a few merchants, not every shop's yard. */
export function rareScale(name: string, roll: number) {
  return /\b(market|grocer|trader|merchant|apothecary|spicer)\b/i.test(name) && roll < 0.08;
}
