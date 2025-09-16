/**
 * poiProcessingService.ts - Handles POI processing recipes and operations
 * Manages milling, sawing, polishing, refining, and crafting operations
 */
import { ProcessingRecipe } from '../components/ProcessingInterface';

// Mill recipes - grain to flour/bread
const MILL_RECIPES: ProcessingRecipe[] = [
  {
    id: 'mill_wheat_flour',
    name: 'Mill Wheat to Flour',
    description: 'Grind wheat into fine flour',
    inputItems: [{ itemId: 'wheat', quantity: 3, displayName: 'Wheat' }],
    outputItems: [{ itemId: 'flour', quantity: 2, displayName: 'Flour' }],
    duration: 5,
    cost: 2
  },
  {
    id: 'mill_barley_flour',
    name: 'Mill Barley to Flour',
    description: 'Grind barley into coarse flour',
    inputItems: [{ itemId: 'barley', quantity: 3, displayName: 'Barley' }],
    outputItems: [{ itemId: 'flour', quantity: 2, displayName: 'Barley Flour' }],
    duration: 5,
    cost: 2
  },
  {
    id: 'mill_corn_meal',
    name: 'Mill Corn to Meal',
    description: 'Grind corn into cornmeal',
    inputItems: [{ itemId: 'corn', quantity: 2, displayName: 'Corn' }],
    outputItems: [{ itemId: 'cornmeal', quantity: 2, displayName: 'Cornmeal' }],
    duration: 4,
    cost: 1
  },
  {
    id: 'mill_rice_flour',
    name: 'Mill Rice to Flour',
    description: 'Grind rice into fine rice flour',
    inputItems: [{ itemId: 'rice', quantity: 2, displayName: 'Rice' }],
    outputItems: [{ itemId: 'rice_flour', quantity: 1, displayName: 'Rice Flour' }],
    duration: 6,
    cost: 3,
    culturalVariant: 'asian'
  },
  {
    id: 'mill_grain_feed',
    name: 'Mill Grain to Animal Feed',
    description: 'Create coarse animal feed from mixed grains',
    inputItems: [{ itemId: 'grain', quantity: 4, displayName: 'Grain' }],
    outputItems: [{ itemId: 'animal_feed', quantity: 3, displayName: 'Animal Feed' }],
    duration: 3,
    cost: 1
  }
];

// Sawmill recipes - wood to lumber/planks
const SAWMILL_RECIPES: ProcessingRecipe[] = [
  {
    id: 'saw_logs_lumber',
    name: 'Saw Logs to Lumber',
    description: 'Cut logs into usable lumber',
    inputItems: [{ itemId: 'log', quantity: 2, displayName: 'Log' }],
    outputItems: [{ itemId: 'lumber', quantity: 4, displayName: 'Lumber' }],
    duration: 8,
    cost: 3
  },
  {
    id: 'saw_wood_planks',
    name: 'Cut Wood to Planks',
    description: 'Cut wood into refined planks',
    inputItems: [{ itemId: 'wood', quantity: 3, displayName: 'Wood' }],
    outputItems: [{ itemId: 'plank', quantity: 2, displayName: 'Plank' }],
    duration: 6,
    cost: 2
  },
  {
    id: 'saw_lumber_beams',
    name: 'Cut Lumber to Beams',
    description: 'Create structural beams from lumber',
    inputItems: [{ itemId: 'lumber', quantity: 2, displayName: 'Lumber' }],
    outputItems: [{ itemId: 'beam', quantity: 1, displayName: 'Beam' }],
    duration: 10,
    cost: 4
  },
  {
    id: 'saw_wood_charcoal',
    name: 'Burn Wood to Charcoal',
    description: 'Convert wood to charcoal for fuel',
    inputItems: [{ itemId: 'wood', quantity: 5, displayName: 'Wood' }],
    outputItems: [{ itemId: 'charcoal', quantity: 3, displayName: 'Charcoal' }],
    duration: 15,
    cost: 2
  }
];

// Quarry recipes - stone processing
const QUARRY_RECIPES: ProcessingRecipe[] = [
  {
    id: 'polish_stone_block',
    name: 'Polish Rough Stone',
    description: 'Polish rough stone into finished blocks',
    inputItems: [{ itemId: 'stone', quantity: 2, displayName: 'Rough Stone' }],
    outputItems: [{ itemId: 'stone_block', quantity: 1, displayName: 'Stone Block' }],
    duration: 10,
    cost: 5
  },
  {
    id: 'cut_marble_slab',
    name: 'Cut Marble Slab',
    description: 'Cut raw marble into polished slabs',
    inputItems: [{ itemId: 'marble', quantity: 1, displayName: 'Raw Marble' }],
    outputItems: [{ itemId: 'marble_slab', quantity: 1, displayName: 'Marble Slab' }],
    duration: 15,
    cost: 10
  },
  {
    id: 'polish_granite_block',
    name: 'Polish Granite',
    description: 'Polish granite into decorative blocks',
    inputItems: [{ itemId: 'granite', quantity: 2, displayName: 'Raw Granite' }],
    outputItems: [{ itemId: 'granite_block', quantity: 1, displayName: 'Granite Block' }],
    duration: 12,
    cost: 8
  },
  {
    id: 'cut_limestone_brick',
    name: 'Cut Limestone Bricks',
    description: 'Cut limestone into building bricks',
    inputItems: [{ itemId: 'limestone', quantity: 3, displayName: 'Limestone' }],
    outputItems: [{ itemId: 'brick', quantity: 4, displayName: 'Brick' }],
    duration: 8,
    cost: 4
  },
  {
    id: 'crush_stone_gravel',
    name: 'Crush Stone to Gravel',
    description: 'Crush stone into gravel for roads',
    inputItems: [{ itemId: 'stone', quantity: 4, displayName: 'Stone' }],
    outputItems: [{ itemId: 'gravel', quantity: 6, displayName: 'Gravel' }],
    duration: 5,
    cost: 2
  }
];

// Mine recipes - ore refining
const MINE_RECIPES: ProcessingRecipe[] = [
  {
    id: 'refine_iron_ore',
    name: 'Smelt Iron Ore',
    description: 'Smelt iron ore into iron ingots',
    inputItems: [
      { itemId: 'iron_ore', quantity: 3, displayName: 'Iron Ore' },
      { itemId: 'coal', quantity: 1, displayName: 'Coal' }
    ],
    outputItems: [{ itemId: 'iron_ingot', quantity: 2, displayName: 'Iron Ingot' }],
    duration: 20,
    cost: 10
  },
  {
    id: 'refine_copper_ore',
    name: 'Smelt Copper Ore',
    description: 'Smelt copper ore into copper ingots',
    inputItems: [
      { itemId: 'copper_ore', quantity: 2, displayName: 'Copper Ore' },
      { itemId: 'coal', quantity: 1, displayName: 'Coal' }
    ],
    outputItems: [{ itemId: 'copper_ingot', quantity: 1, displayName: 'Copper Ingot' }],
    duration: 15,
    cost: 8
  },
  {
    id: 'refine_silver_ore',
    name: 'Smelt Silver Ore',
    description: 'Smelt silver ore into silver ingots',
    inputItems: [
      { itemId: 'silver_ore', quantity: 2, displayName: 'Silver Ore' },
      { itemId: 'coal', quantity: 2, displayName: 'Coal' }
    ],
    outputItems: [{ itemId: 'silver_ingot', quantity: 1, displayName: 'Silver Ingot' }],
    duration: 25,
    cost: 20
  },
  {
    id: 'refine_gold_ore',
    name: 'Smelt Gold Ore',
    description: 'Smelt gold ore into gold ingots',
    inputItems: [
      { itemId: 'gold_ore', quantity: 1, displayName: 'Gold Ore' },
      { itemId: 'coal', quantity: 2, displayName: 'Coal' }
    ],
    outputItems: [{ itemId: 'gold_ingot', quantity: 1, displayName: 'Gold Ingot' }],
    duration: 30,
    cost: 50
  },
  {
    id: 'refine_tin_copper_bronze',
    name: 'Create Bronze Alloy',
    description: 'Combine tin and copper to make bronze',
    inputItems: [
      { itemId: 'tin_ore', quantity: 1, displayName: 'Tin Ore' },
      { itemId: 'copper_ore', quantity: 3, displayName: 'Copper Ore' }
    ],
    outputItems: [{ itemId: 'bronze_ingot', quantity: 2, displayName: 'Bronze Ingot' }],
    duration: 18,
    cost: 15
  }
];

// Factory recipes - crafting items
const FACTORY_RECIPES: ProcessingRecipe[] = [
  {
    id: 'craft_iron_tool',
    name: 'Craft Iron Tools',
    description: 'Forge iron ingots into tools',
    inputItems: [
      { itemId: 'iron_ingot', quantity: 2, displayName: 'Iron Ingot' },
      { itemId: 'lumber', quantity: 1, displayName: 'Lumber' }
    ],
    outputItems: [{ itemId: 'iron_tool', quantity: 1, displayName: 'Iron Tool' }],
    duration: 15,
    cost: 10
  },
  {
    id: 'craft_leather_armor',
    name: 'Craft Leather Armor',
    description: 'Create protective leather armor',
    inputItems: [
      { itemId: 'leather', quantity: 4, displayName: 'Leather' },
      { itemId: 'thread', quantity: 2, displayName: 'Thread' }
    ],
    outputItems: [{ itemId: 'leather_armor', quantity: 1, displayName: 'Leather Armor' }],
    duration: 20,
    cost: 15
  },
  {
    id: 'craft_cloth_garment',
    name: 'Craft Cloth Garment',
    description: 'Weave cloth into clothing',
    inputItems: [
      { itemId: 'cloth', quantity: 3, displayName: 'Cloth' },
      { itemId: 'thread', quantity: 1, displayName: 'Thread' }
    ],
    outputItems: [{ itemId: 'garment', quantity: 1, displayName: 'Garment' }],
    duration: 10,
    cost: 5
  },
  {
    id: 'craft_pottery',
    name: 'Create Pottery',
    description: 'Shape and fire clay pottery',
    inputItems: [
      { itemId: 'clay', quantity: 2, displayName: 'Clay' },
      { itemId: 'coal', quantity: 1, displayName: 'Coal' }
    ],
    outputItems: [{ itemId: 'pottery', quantity: 2, displayName: 'Pottery' }],
    duration: 12,
    cost: 4
  }
];

/**
 * Get recipes for a specific POI type, optionally filtered by cultural zone and era
 */
export function getProcessingRecipes(
  poiType: 'mill' | 'sawmill' | 'quarry' | 'mine' | 'factory',
  culturalZone?: string,
  era?: string
): ProcessingRecipe[] {
  let recipes: ProcessingRecipe[] = [];

  switch (poiType) {
    case 'mill':
      recipes = [...MILL_RECIPES];
      // Add rice flour for Asian cultures
      if (culturalZone?.toLowerCase().includes('asia')) {
        // Rice flour already included with culturalVariant
      }
      // Add corn meal for American cultures
      if (culturalZone?.toLowerCase().includes('american')) {
        // Corn meal already included
      }
      break;
    case 'sawmill':
      recipes = [...SAWMILL_RECIPES];
      break;
    case 'quarry':
      recipes = [...QUARRY_RECIPES];
      break;
    case 'mine':
      recipes = [...MINE_RECIPES];
      // Filter out advanced alloys for ancient eras
      if (era && parseInt(era) < 500) {
        recipes = recipes.filter(r => !r.id.includes('steel') && !r.id.includes('alloy'));
      }
      break;
    case 'factory':
      recipes = [...FACTORY_RECIPES];
      // Add modern recipes for industrial era
      if (era && parseInt(era) >= 1800) {
        // Could add steam engines, machinery, etc.
      }
      break;
  }

  // Filter by cultural variant if specified
  if (culturalZone) {
    const baseRecipes = recipes.filter(r => !r.culturalVariant);
    const culturalRecipes = recipes.filter(r =>
      r.culturalVariant && culturalZone.toLowerCase().includes(r.culturalVariant)
    );
    recipes = [...baseRecipes, ...culturalRecipes];
  }

  return recipes;
}

/**
 * Calculate processing time based on era and technology level
 */
export function getProcessingDuration(baseTime: number, era?: string): number {
  if (!era) return baseTime;

  const year = parseInt(era);

  // Modern technology speeds up processing
  if (year >= 1900) return Math.max(1, baseTime * 0.5);
  if (year >= 1800) return Math.max(1, baseTime * 0.75);

  // Ancient processing is slower
  if (year < 500) return baseTime * 1.5;

  return baseTime;
}

/**
 * Get cultural-specific recipe names
 */
export function getLocalizedRecipeName(recipe: ProcessingRecipe, culturalZone?: string): string {
  // Add cultural flavor to recipe names
  const localizations: Record<string, Record<string, string>> = {
    mill_wheat_flour: {
      mena: 'Mill Wheat for Flatbread',
      asian: 'Mill Wheat for Noodles',
      european: 'Mill Wheat for Bread'
    },
    mill_rice_flour: {
      asian: 'Mill Rice for Rice Paper',
      south_asian: 'Mill Rice for Dosa Batter'
    }
  };

  if (culturalZone && localizations[recipe.id]?.[culturalZone.toLowerCase()]) {
    return localizations[recipe.id][culturalZone.toLowerCase()];
  }

  return recipe.name;
}