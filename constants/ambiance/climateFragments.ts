import { ClimateType } from '../../types';

export const AMBIANCE_CLIMATE_FRAGMENTS: Partial<Record<ClimateType, string[]>> = {
  [ClimateType.TEMPERATE]: [
    "The air is mild.",
    "A gentle breeze rustles the leaves.",
    "The weather feels balanced and pleasant.",
    "There's a hint of changing seasons in the air."
  ],
  [ClimateType.SEMITROPICAL]: [
    "A warm, humid air hangs heavily.",
    "The scent of lush vegetation is strong.",
    "Occasional warmth hints at tropical climes.",
    "The nights are often balmy."
  ],
  [ClimateType.TROPICAL]: [
    "The air is thick with tropical humidity.",
    "Exotic bird calls echo through the dense growth.",
    "The heat is constant and pervasive.",
    "Life teems in the warm, moist environment."
  ],
  [ClimateType.ARID]: [
    "The sun beats down relentlessly on the dry earth.",
    "A hot, dry wind carries dust.",
    "Water is a precious commodity here.",
    "The landscape shimmers in the heat haze."
  ],
  [ClimateType.COLD]: [
    "A biting wind chills to the bone.",
    "The air is crisp and frosty.",
    "The landscape seems locked in a perpetual chill.",
    "Warmth is a distant memory here."
  ],
};