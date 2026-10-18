import { BAKER_CARDS } from "./baker";
import { CRAFT_CARDS } from "./crafts";
import { FARM_CARDS } from "./farm";
import { GENERAL_CARDS } from "./general";
import { HEALER_CARDS } from "./healer";
import { RAIL_CARDS } from "./rail";
import { RICE_CARDS } from "./rice";
import { careCards } from "./care";
import { HAZARD_CARDS, ROADSIDE_CARDS } from "./hazards";
import type { ChoiceCard } from "./types";

export const CARDS: readonly ChoiceCard[] = [...RAIL_CARDS, ...BAKER_CARDS, ...RICE_CARDS, ...HEALER_CARDS, ...FARM_CARDS, ...CRAFT_CARDS, ...HAZARD_CARDS, ...ROADSIDE_CARDS, ...careCards, ...GENERAL_CARDS];
export { railBoss } from "./rail";
export type { ChoiceCard, CardChoice, CardEffect } from "./types";
