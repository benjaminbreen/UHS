/**
 * constants/gameData/liminalEncounters.ts
 * Random encounter definitions for liminal travel sequences
 * Events trigger during long-distance journeys based on terrain archetype
 */

import { MapArchetype } from '../../types';

export interface LiminalEncounter {
  id: string;
  archetype: MapArchetype;
  title: string;
  message: string;
  effects: {
    health?: number;
    fatigue?: number;
    gold?: number;
    timeDelay?: number; // hours added to game time
    progressBoost?: number; // skip ahead segments (can be negative to go back)
  };
  rarity: 'common' | 'uncommon' | 'rare';
}

/* ============================================================================
 * DESERT ENCOUNTERS
 * ============================================================================ */
export const DESERT_ENCOUNTERS: LiminalEncounter[] = [
  {
    id: 'desert_heat_wave',
    archetype: MapArchetype.DESERT,
    title: 'Scorching Heat',
    message: 'The midday sun beats down mercilessly. You suffer heat exhaustion.',
    effects: { health: -5, fatigue: 15 },
    rarity: 'common'
  },
  {
    id: 'desert_cold_night',
    archetype: MapArchetype.DESERT,
    title: 'Freezing Night',
    message: 'The desert temperature plummets after sunset. You shiver through the night.',
    effects: { health: -3, fatigue: 10 },
    rarity: 'common'
  },
  {
    id: 'desert_dehydration',
    archetype: MapArchetype.DESERT,
    title: 'Water Shortage',
    message: 'Your water supplies run dangerously low in the harsh sun.',
    effects: { health: -8, fatigue: 20 },
    rarity: 'common'
  },
  {
    id: 'desert_oasis_found',
    archetype: MapArchetype.DESERT,
    title: 'Desert Oasis',
    message: 'You discover a hidden oasis! Fresh water and shade restore your strength.',
    effects: { health: 10, fatigue: -20 },
    rarity: 'uncommon'
  },
  {
    id: 'desert_sandstorm',
    archetype: MapArchetype.DESERT,
    title: 'Sandstorm',
    message: 'A massive sandstorm forces you to make camp. You lose a day of travel.',
    effects: { timeDelay: 24, fatigue: 10 },
    rarity: 'uncommon'
  },
  {
    id: 'desert_ruins',
    archetype: MapArchetype.DESERT,
    title: 'Ancient Ruins',
    message: 'You stumble upon ancient ruins with a freshwater well and shelter.',
    effects: { health: 5, fatigue: -15, timeDelay: 6 },
    rarity: 'uncommon'
  },
  {
    id: 'desert_caravan',
    archetype: MapArchetype.DESERT,
    title: 'Friendly Caravan',
    message: 'A merchant caravan shares supplies and shows you a shortcut.',
    effects: { gold: 10, progressBoost: 1 },
    rarity: 'rare'
  },
  {
    id: 'desert_scorpion',
    archetype: MapArchetype.DESERT,
    title: 'Scorpion Sting',
    message: 'A venomous scorpion stings you during the night. You fall ill.',
    effects: { health: -12, fatigue: 15, timeDelay: 12 },
    rarity: 'rare'
  }
];

/* ============================================================================
 * OPEN OCEAN ENCOUNTERS
 * ============================================================================ */
export const OCEAN_ENCOUNTERS: LiminalEncounter[] = [
  {
    id: 'ocean_rough_seas',
    archetype: MapArchetype.OPEN_OCEAN,
    title: 'Rough Seas',
    message: 'The ocean swells with choppy waves. You struggle with seasickness.',
    effects: { health: -4, fatigue: 12 },
    rarity: 'common'
  },
  {
    id: 'ocean_becalmed',
    archetype: MapArchetype.OPEN_OCEAN,
    title: 'Becalmed',
    message: 'The wind dies completely. Your vessel drifts aimlessly for hours.',
    effects: { timeDelay: 18, fatigue: 8 },
    rarity: 'common'
  },
  {
    id: 'ocean_storm',
    archetype: MapArchetype.OPEN_OCEAN,
    title: 'Storm at Sea',
    message: 'Violent waves crash over the deck. The crew struggles to maintain course.',
    effects: { health: -8, fatigue: 15, timeDelay: 12 },
    rarity: 'common'
  },
  {
    id: 'ocean_favorable_wind',
    archetype: MapArchetype.OPEN_OCEAN,
    title: 'Favorable Winds',
    message: 'Strong tailwinds fill the sails, speeding your journey considerably!',
    effects: { progressBoost: 1, fatigue: -5 },
    rarity: 'uncommon'
  },
  {
    id: 'ocean_dolphins',
    archetype: MapArchetype.OPEN_OCEAN,
    title: 'Dolphin Pod',
    message: 'A pod of dolphins swims alongside your vessel, lifting spirits.',
    effects: { fatigue: -10 },
    rarity: 'uncommon'
  },
  {
    id: 'ocean_whale',
    archetype: MapArchetype.OPEN_OCEAN,
    title: 'Whale Sighting',
    message: 'A massive whale breaches near your vessel—a sign of good fortune at sea.',
    effects: { health: 5, fatigue: -8 },
    rarity: 'uncommon'
  },
  {
    id: 'ocean_pirate_sighting',
    archetype: MapArchetype.OPEN_OCEAN,
    title: 'Pirates Spotted',
    message: 'You spot a pirate vessel on the horizon. You manage to evade, but it costs time and nerves.',
    effects: { timeDelay: 12, fatigue: 20 },
    rarity: 'rare'
  },
  {
    id: 'ocean_trade_ship',
    archetype: MapArchetype.OPEN_OCEAN,
    title: 'Trade Ship Encounter',
    message: 'A merchant ship offers trade and supplies in exchange for coin.',
    effects: { health: 8, gold: -15 },
    rarity: 'rare'
  }
];

/* ============================================================================
 * ALL_LAND ENCOUNTERS (mountains, forests, plains)
 * ============================================================================ */
export const ALL_LAND_ENCOUNTERS: LiminalEncounter[] = [
  {
    id: 'land_difficult_terrain',
    archetype: MapArchetype.ALL_LAND,
    title: 'Difficult Terrain',
    message: 'Rocky paths and dense vegetation slow your progress.',
    effects: { fatigue: 10, timeDelay: 6 },
    rarity: 'common'
  },
  {
    id: 'land_rain',
    archetype: MapArchetype.ALL_LAND,
    title: 'Heavy Rain',
    message: 'Cold rain soaks through your clothing. You make camp early.',
    effects: { health: -5, timeDelay: 8 },
    rarity: 'common'
  },
  {
    id: 'land_wild_animal',
    archetype: MapArchetype.ALL_LAND,
    title: 'Wild Animal',
    message: 'A wild animal charges from the brush. You narrowly escape injury.',
    effects: { health: -6, fatigue: 12 },
    rarity: 'common'
  },
  {
    id: 'land_clear_path',
    archetype: MapArchetype.ALL_LAND,
    title: 'Clear Path',
    message: 'You discover a well-maintained trail that speeds your journey.',
    effects: { progressBoost: 1, fatigue: -5 },
    rarity: 'uncommon'
  },
  {
    id: 'land_hunting_success',
    archetype: MapArchetype.ALL_LAND,
    title: 'Successful Hunt',
    message: 'You hunt game and prepare a hearty meal, restoring energy.',
    effects: { health: 10, fatigue: -15 },
    rarity: 'uncommon'
  },
  {
    id: 'land_hermit',
    archetype: MapArchetype.ALL_LAND,
    title: 'Helpful Hermit',
    message: 'A hermit offers shelter and shares knowledge of the terrain ahead.',
    effects: { health: 8, fatigue: -12, progressBoost: 1 },
    rarity: 'uncommon'
  },
  {
    id: 'land_avalanche',
    archetype: MapArchetype.ALL_LAND,
    title: 'Avalanche',
    message: 'A rockslide blocks the mountain pass. You must backtrack and find another route.',
    effects: { health: -10, progressBoost: -1, timeDelay: 24 },
    rarity: 'rare'
  },
  {
    id: 'land_bandits',
    archetype: MapArchetype.ALL_LAND,
    title: 'Bandit Ambush',
    message: 'Bandits demand payment for safe passage. You have no choice but to pay.',
    effects: { gold: -20, fatigue: 15 },
    rarity: 'rare'
  }
];

/* ============================================================================
 * RIVER_PORT ENCOUNTERS
 * ============================================================================ */
export const RIVER_ENCOUNTERS: LiminalEncounter[] = [
  {
    id: 'river_current',
    archetype: MapArchetype.RIVER_PORT,
    title: 'Strong Current',
    message: 'The river current carries you swiftly downstream.',
    effects: { progressBoost: 1, fatigue: -5 },
    rarity: 'common'
  },
  {
    id: 'river_rapids',
    archetype: MapArchetype.RIVER_PORT,
    title: 'Dangerous Rapids',
    message: 'You navigate treacherous rapids. It takes all your strength.',
    effects: { health: -6, fatigue: 18 },
    rarity: 'common'
  },
  {
    id: 'river_flooding',
    archetype: MapArchetype.RIVER_PORT,
    title: 'River Flooding',
    message: 'Heavy rains upstream cause dangerous flooding. You wait for waters to recede.',
    effects: { timeDelay: 24, fatigue: 10 },
    rarity: 'common'
  },
  {
    id: 'river_fishing',
    archetype: MapArchetype.RIVER_PORT,
    title: 'Abundant Fish',
    message: 'You catch fresh fish from the river, improving your health.',
    effects: { health: 12, fatigue: -8 },
    rarity: 'uncommon'
  },
  {
    id: 'river_ferry',
    archetype: MapArchetype.RIVER_PORT,
    title: 'Ferry Service',
    message: 'A ferryman offers quick passage across the river for a fee.',
    effects: { gold: -10, progressBoost: 1 },
    rarity: 'uncommon'
  },
  {
    id: 'river_merchant',
    archetype: MapArchetype.RIVER_PORT,
    title: 'River Merchant',
    message: 'A merchant boat offers supplies at a fair price.',
    effects: { health: 8, gold: -8 },
    rarity: 'uncommon'
  },
  {
    id: 'river_waterfall',
    archetype: MapArchetype.RIVER_PORT,
    title: 'Unexpected Waterfall',
    message: 'You encounter an unmapped waterfall and must portage around it.',
    effects: { fatigue: 25, timeDelay: 18 },
    rarity: 'rare'
  }
];

/* ============================================================================
 * SWAMP ENCOUNTERS
 * ============================================================================ */
export const SWAMP_ENCOUNTERS: LiminalEncounter[] = [
  {
    id: 'swamp_mosquitoes',
    archetype: MapArchetype.SWAMP,
    title: 'Mosquito Swarms',
    message: 'Clouds of mosquitoes make travel miserable.',
    effects: { health: -4, fatigue: 12 },
    rarity: 'common'
  },
  {
    id: 'swamp_mud',
    archetype: MapArchetype.SWAMP,
    title: 'Deep Mud',
    message: 'Thick mud sucks at your feet, slowing progress to a crawl.',
    effects: { fatigue: 15, timeDelay: 12 },
    rarity: 'common'
  },
  {
    id: 'swamp_illness',
    archetype: MapArchetype.SWAMP,
    title: 'Swamp Fever',
    message: 'The fetid water carries disease. You fall ill.',
    effects: { health: -10, fatigue: 20 },
    rarity: 'common'
  },
  {
    id: 'swamp_dry_ground',
    archetype: MapArchetype.SWAMP,
    title: 'Dry Ground',
    message: 'You find a patch of solid ground to rest and recover.',
    effects: { health: 6, fatigue: -10 },
    rarity: 'uncommon'
  },
  {
    id: 'swamp_guide',
    archetype: MapArchetype.SWAMP,
    title: 'Local Guide',
    message: 'A local swamp dweller shows you safe paths through the wetlands.',
    effects: { progressBoost: 1, gold: -5 },
    rarity: 'uncommon'
  },
  {
    id: 'swamp_herbs',
    archetype: MapArchetype.SWAMP,
    title: 'Medicinal Herbs',
    message: 'You discover valuable medicinal plants growing in the swamp.',
    effects: { health: 15, gold: 10 },
    rarity: 'rare'
  }
];

/* ============================================================================
 * SHOALS & COASTAL ENCOUNTERS
 * ============================================================================ */
export const SHOALS_ENCOUNTERS: LiminalEncounter[] = [
  {
    id: 'shoals_shallow_water',
    archetype: MapArchetype.SHOALS,
    title: 'Shallow Waters',
    message: 'Treacherous shoals force you to navigate carefully.',
    effects: { fatigue: 10, timeDelay: 8 },
    rarity: 'common'
  },
  {
    id: 'shoals_grounding',
    archetype: MapArchetype.SHOALS,
    title: 'Vessel Grounding',
    message: 'Your vessel runs aground on hidden sandbars. Repairs are needed.',
    effects: { health: -8, timeDelay: 18 },
    rarity: 'common'
  },
  {
    id: 'shoals_fishing',
    archetype: MapArchetype.SHOALS,
    title: 'Rich Fishing',
    message: 'The shallow waters teem with fish. You feast well.',
    effects: { health: 10, fatigue: -12 },
    rarity: 'uncommon'
  },
  {
    id: 'shoals_pearl',
    archetype: MapArchetype.SHOALS,
    title: 'Pearl Discovery',
    message: 'You discover valuable pearls in the shallow waters!',
    effects: { gold: 25 },
    rarity: 'rare'
  }
];

/* ============================================================================
 * STRAITS ENCOUNTERS
 * ============================================================================ */
export const STRAITS_ENCOUNTERS: LiminalEncounter[] = [
  {
    id: 'straits_strong_current',
    archetype: MapArchetype.STRAITS,
    title: 'Powerful Currents',
    message: 'Strong tidal currents make navigation treacherous.',
    effects: { fatigue: 15, timeDelay: 8 },
    rarity: 'common'
  },
  {
    id: 'straits_smooth_passage',
    archetype: MapArchetype.STRAITS,
    title: 'Smooth Passage',
    message: 'Favorable tides carry you swiftly through the straits.',
    effects: { progressBoost: 1, fatigue: -8 },
    rarity: 'uncommon'
  },
  {
    id: 'straits_customs',
    archetype: MapArchetype.STRAITS,
    title: 'Customs Checkpoint',
    message: 'Officials demand payment for passage through the straits.',
    effects: { gold: -15, timeDelay: 6 },
    rarity: 'uncommon'
  }
];

/* ============================================================================
 * ISLAND ENCOUNTERS
 * ============================================================================ */
export const ISLAND_ENCOUNTERS: LiminalEncounter[] = [
  {
    id: 'island_landing',
    archetype: MapArchetype.ISLAND,
    title: 'Island Rest',
    message: 'You land on a small island to rest and gather supplies.',
    effects: { health: 8, fatigue: -15 },
    rarity: 'common'
  },
  {
    id: 'island_hostile',
    archetype: MapArchetype.ISLAND,
    title: 'Hostile Islanders',
    message: 'The island inhabitants are unwelcoming. You depart quickly.',
    effects: { timeDelay: 6, fatigue: 10 },
    rarity: 'uncommon'
  },
  {
    id: 'island_treasure',
    archetype: MapArchetype.ISLAND,
    title: 'Hidden Cache',
    message: 'You discover a hidden cache of supplies left by previous travelers!',
    effects: { health: 12, gold: 20 },
    rarity: 'rare'
  }
];
