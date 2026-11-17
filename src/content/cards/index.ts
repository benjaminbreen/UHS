import { BAKER_CARDS } from "./baker";
import { CRAFT_CARDS } from "./crafts";
import { FARM_CARDS } from "./farm";
import { GENERAL_CARDS } from "./general";
import { HEALER_CARDS } from "./healer";
import { RAIL_CARDS } from "./rail";
import { RICE_CARDS } from "./rice";
import { careCards } from "./care";
import { HAZARD_CARDS } from "./hazards";
import { FISHING_CARDS } from "./fishing";
import { HUNTING_CARDS } from "./hunting";
import { MINE_CARDS } from "./mine";
import { OUTLAW_CARDS } from "./outlaws";
import type { ChoiceCard } from "./types";

export const CARDS: readonly ChoiceCard[] = [...RAIL_CARDS, ...BAKER_CARDS, ...RICE_CARDS, ...HEALER_CARDS, ...FARM_CARDS, ...CRAFT_CARDS, ...FISHING_CARDS, ...HUNTING_CARDS, ...MINE_CARDS, ...HAZARD_CARDS, ...OUTLAW_CARDS, ...careCards, ...GENERAL_CARDS];
export { railBoss } from "./rail";
export type { ChoiceCard, CardChoice, CardEffect } from "./types";
