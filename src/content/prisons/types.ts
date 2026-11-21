import type { CultureId } from "../history/types";
import type { Inventory } from "../../core/types";

export type PrisonOrder = "stone-keep" | "brick-gaol" | "yamen-wood" | "iron-cellblock";

export type PrisonAreaId = "cell" | "corridor" | "yard" | "gatehouse";

export type PrisonPalette = {
  /** Sloped wall masonry ramp, highlight to deep shadow (5 stops). */
  wall: readonly [string, string, string, string, string];
  /** Mortar or timber joint line. */
  mortar: string;
  /** Inner plinth/baseboard ramp (3 stops, highlight to shadow). */
  plinth: readonly [string, string, string];
  /** Floor cobble/flagstone ramp (4 stops, highlight to mortar). */
  floor: readonly [string, string, string, string];
  /** Yard cobble/earth ramp (3 stops). */
  yard: readonly [string, string, string];
  /** Trim / wood / iron accent ramp (4 stops). */
  trim: readonly [string, string, string, string];
  /** Outer stippled stone void [base, dot]. */
  voidFill: readonly [string, string];
  /** Warm torch/lantern glow tint (hex). */
  glow: number;
  /** Ambient canvas void color outside the room. */
  void: number;
};

export type PrisonFind = {
  id: string;
  name: string;
  art: string;
  verb: string;
  look: string;
  text: string;
  wall?: boolean;
  solid?: boolean;
  keeps?: boolean;
  price?: number;
  heal?: number;
  loot?: Inventory;
  special?: "bed" | "pry" | "grate" | "keys" | "work" | "ledger" | "tallies";
  time?: number;
};

export type PrisonSentence = {
  kind: "fixed" | "debt" | "remand" | "life";
  daysLeft: number;
  debtOwed?: number;
  charge: string;
};

export type PrisonStyle = {
  id: string;
  name: string;
  label: string;
  order: PrisonOrder;
  years: readonly [number, number];
  cultures?: readonly CultureId[];
  where?: readonly [number, number, number, number];
  feePaying?: boolean;
  coin: readonly [string, string];
  warder: { label: string; dress: string };
  inmate: { label: string; dress: string };
  enter: string;
  prompt: RegExp;
  palette: PrisonPalette;
  finds: readonly PrisonFind[];
};
