import type { Box } from "../caves/types";

export type ShipKind = "square-rigger" | "junk" | "dhow" | "steamer";
/** Below the weather deck: berths and guns, a cargo hold, or the stokehold. */
export type BelowDeck = "gundeck" | "steerage" | "hold" | "compartments" | "stokehold";

export type Hull = {
  id: string;
  kind: ShipKind;
  label: string;
  years: readonly [number, number];
  where: readonly Box[];
  /** Deck length and beam, in cells. */
  length: number;
  beam: number;
  /** Masts, as a share of the length from the stern. */
  masts: readonly number[];
  below: readonly BelowDeck[];
  /** The raised after deck and forecastle, as shares of the length. */
  poop: number;
  forecastle: number;
  /** Pixels of hull side from the rail to the waterline amidships. */
  freeboard: number;
  /** A painted band of gunports, real or false. */
  ports?: "guns" | "painted" | "portholes";
  funnels?: number;
  /** How the paint goes. */
  look: "tarred" | "navy" | "black" | "varnish" | "oiled" | "liner";
  /** A carved figure at the bow. */
  head?: "lion" | "woman" | "scroll";
  /** Who sails in her, besides the player. */
  people: readonly string[];
  weight: number;
  note: string;
};
