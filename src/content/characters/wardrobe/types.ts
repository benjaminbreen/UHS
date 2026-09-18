import type {
  beltStyles,
  motifs,
  footwear,
  garments,
  headwear,
  leggings,
  sleeveStyles,
} from "../../../core/character";
import type { CharacterScope } from "../context-types";
import type { DyeId, Material } from "./cloth";

export type Garment = (typeof garments)[number];
export type Headwear = (typeof headwear)[number];
export type Leggings = (typeof leggings)[number];
export type Footwear = (typeof footwear)[number];
export type Belt = (typeof beltStyles)[number];
export type Sleeves = (typeof sleeveStyles)[number];

export const ageBands = ["child", "youth", "adult", "elder"] as const;
export type AgeBand = (typeof ageBands)[number];
/** Not a researched class system: four rungs, enough to tell a bowler from a
 * flat cap. Societies without the distinction simply do not key on it.
 * `elite` is deliberately vanishingly rare — the emperor, not the merchant —
 * and anything offered to `wealthy` is also offered to them. */
export const means = ["poor", "common", "wealthy", "elite"] as const;
export type Means = (typeof means)[number];
export type Sex = "male" | "female" | "unspecified";

/** Who an option is for. An absent field means it applies to anyone, so the
 * common case stays one line. */
export type WearerScope = {
  sex?: readonly Sex[];
  ages?: readonly AgeBand[];
  means?: readonly Means[];
  standing?: readonly ("free" | "unfree")[];
  livelihoods?: readonly string[];
  /** Tags read off the person's stated role: soldier, sailor, astronaut,
   * aristocrat. How a world-weaver prompt reaches the wardrobe. */
  roles?: readonly string[];
};
/** One choice in a slot. `weight` defaults to 1. */
export type Option<T> = WearerScope & { value: T; weight?: number };

/** Everything a kit may say about how people here dress. Every slot is
 * optional: a kit that only knows about hats says only that, and the rest
 * falls through to whatever covers this place and date more broadly. */
export type GarmentKit = {
  id: string;
  label: string;
  scope: CharacterScope;
  /** Overlays that beat ordinary regional dress whatever their scope: a
   * uniform, a pressure suit, court dress. Default 0. */
  priority?: number;
  garment?: readonly Option<Garment>[];
  headwear?: readonly Option<Headwear>[];
  leggings?: readonly Option<Leggings>[];
  footwear?: readonly Option<Footwear>[];
  belt?: readonly Option<Belt>[];
  sleeves?: readonly Option<Sleeves>[];
  /** Worn over the garment. A mantle stops at the elbow; a cloak falls to
   * the hem. */
  over?: readonly Option<"none" | "cloak" | "mantle" | "shoulder-cloth">[];
  /** What cloth was available here, and what could be got onto it. Resolved
   * per slot like everything else, so a kit can change the dyes and inherit
   * the silhouettes. */
  material?: readonly Option<Material>[];
  dye?: readonly Option<DyeId>[];
  motif?: readonly Option<Motif>[];
};
export type Motif = (typeof motifs)[number];
export type WardrobeSlot = Exclude<
  keyof GarmentKit,
  "id" | "label" | "scope" | "priority"
>;
export const wardrobeSlots = [
  "garment",
  "sleeves",
  "headwear",
  "leggings",
  "footwear",
  "belt",
  "over",
  "material",
  "dye",
  "motif",
] as const;

/** The person a kit is dressing. Everything but `id` is optional: an actor
 * generated before origins existed still gets dressed. */
export type Wearer = {
  id: string;
  sex?: Sex;
  age?: number;
  standing?: "free" | "unfree";
  livelihood?: string;
  means?: Means;
  roles?: readonly string[];
};
export function ageBandOf(age: number | undefined): AgeBand {
  if (age === undefined) return "adult";
  return age < 13 ? "child" : age < 20 ? "youth" : age < 55 ? "adult" : "elder";
}
