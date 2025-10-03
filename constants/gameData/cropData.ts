/**
 * constants/gameData/cropData.ts
 * Detailed information about crops including planting seasons, care requirements, and market data
 */

export interface CropInfo {
  name: string;
  emoji: string;
  description: string;
  bestPlantingMonths: number[]; // 1-12
  waterNeeds: 'low' | 'moderate' | 'high';
  fertilizerNeeds: 'low' | 'moderate' | 'high';
  growthDays: number;
  basePrice: number; // Base price per unit
  tip?: string; // Additional tip shown when expanded
  farmTypes?: string[]; // Special farm type names (e.g., "Winery" for grapes)

  // Phase 4.1: Nutrient depletion/restoration
  nitrogenEffect: number; // -20 = heavy depletion, 0 = neutral, +30 = restoration
  phosphorusEffect: number;
  potassiumEffect: number;
  cropCategory: 'grain' | 'legume' | 'root' | 'vegetable' | 'fruit'; // For rotation logic
}

export const CROP_DATA: Record<string, CropInfo> = {
  // Grains
  wheat: {
    name: 'Wheat',
    emoji: '🌾',
    description: 'A staple grain crop, resilient and versatile across climates.',
    bestPlantingMonths: [3, 4, 9, 10], // Spring or fall
    waterNeeds: 'moderate',
    fertilizerNeeds: 'moderate',
    growthDays: 90,
    basePrice: 12,
    tip: 'Plant in early spring for summer harvest, or fall for winter wheat. Rotate with legumes to maintain soil fertility.',
    nitrogenEffect: -15, // Grains deplete nitrogen
    phosphorusEffect: -8,
    potassiumEffect: -5,
    cropCategory: 'grain',
  },
  barley: {
    name: 'Barley',
    emoji: '🌾',
    description: 'Hardy grain used for brewing and animal feed.',
    bestPlantingMonths: [3, 4, 10],
    waterNeeds: 'low',
    fertilizerNeeds: 'low',
    growthDays: 70,
    basePrice: 10,
    tip: 'More drought-tolerant than wheat. Excellent for beer production and livestock feed.',
    nitrogenEffect: -12,
    phosphorusEffect: -6,
    potassiumEffect: -4,
    cropCategory: 'grain',
  },
  rice: {
    name: 'Rice',
    emoji: '🌾',
    description: 'Water-intensive grain requiring flooded paddies.',
    bestPlantingMonths: [4, 5, 6],
    waterNeeds: 'high',
    fertilizerNeeds: 'high',
    growthDays: 120,
    basePrice: 15,
    tip: 'Requires consistent flooding. Best in lowland areas with reliable water sources. Labor-intensive but highly productive.',
    nitrogenEffect: -18,
    phosphorusEffect: -10,
    potassiumEffect: -8,
    cropCategory: 'grain',
  },
  oats: {
    name: 'Oats',
    emoji: '🌾',
    description: 'Cool-season grain for porridge and animal fodder.',
    bestPlantingMonths: [3, 4, 9],
    waterNeeds: 'moderate',
    fertilizerNeeds: 'low',
    growthDays: 75,
    basePrice: 9,
    tip: 'Thrives in cooler, wetter climates. Good cover crop that improves soil structure.',
    nitrogenEffect: -10,
    phosphorusEffect: -5,
    potassiumEffect: -4,
    cropCategory: 'grain',
  },
  rye: {
    name: 'Rye',
    emoji: '🌾',
    description: 'Cold-hardy grain for bread and whiskey.',
    bestPlantingMonths: [9, 10],
    waterNeeds: 'low',
    fertilizerNeeds: 'low',
    growthDays: 150,
    basePrice: 11,
    tip: 'Most cold-tolerant grain. Plant in fall for spring harvest. Excellent for poor soils.',
    nitrogenEffect: -13,
    phosphorusEffect: -6,
    potassiumEffect: -5,
    cropCategory: 'grain',
  },

  // Vegetables
  corn: {
    name: 'Corn',
    emoji: '🌽',
    description: 'High-yield grain requiring warm weather and rich soil.',
    bestPlantingMonths: [4, 5, 6],
    waterNeeds: 'high',
    fertilizerNeeds: 'high',
    growthDays: 90,
    basePrice: 14,
    tip: 'Plant after last frost. Benefits greatly from crop rotation with beans and squash (Three Sisters method).',
    nitrogenEffect: -20,
    phosphorusEffect: -12,
    potassiumEffect: -10,
    cropCategory: 'grain',
  },
  potatoes: {
    name: 'Potatoes',
    emoji: '🥔',
    description: 'Versatile tuber crop with high caloric yield.',
    bestPlantingMonths: [3, 4, 7, 8],
    waterNeeds: 'moderate',
    fertilizerNeeds: 'moderate',
    growthDays: 80,
    basePrice: 8,
    tip: 'Plant seed potatoes 4 inches deep. Hill up soil as plants grow. Store in cool, dark places.',
    nitrogenEffect: -12,
    phosphorusEffect: -10,
    potassiumEffect: -15,
    cropCategory: 'root',
  },
  tomatoes: {
    name: 'Tomatoes',
    emoji: '🍅',
    description: 'Warm-season fruit crop requiring support and consistent care.',
    bestPlantingMonths: [4, 5, 6],
    waterNeeds: 'high',
    fertilizerNeeds: 'high',
    growthDays: 75,
    basePrice: 12,
    tip: 'Requires staking or caging. Water consistently to prevent blossom end rot. Prune suckers for larger fruit.',
    nitrogenEffect: -18,
    phosphorusEffect: -12,
    potassiumEffect: -15,
    cropCategory: 'vegetable',
  },
  beans: {
    name: 'Beans',
    emoji: '🫘',
    description: 'Nitrogen-fixing legume that enriches soil.',
    bestPlantingMonths: [4, 5, 6],
    waterNeeds: 'moderate',
    fertilizerNeeds: 'low',
    growthDays: 65,
    basePrice: 13,
    tip: 'Fixes nitrogen in soil - excellent for crop rotation. Plant after frost danger passes.',
    nitrogenEffect: 30,
    phosphorusEffect: -5,
    potassiumEffect: -5,
    cropCategory: 'legume',
  },
  peas: {
    name: 'Peas',
    emoji: '🫛',
    description: 'Cool-season legume rich in protein.',
    bestPlantingMonths: [3, 4, 8, 9],
    waterNeeds: 'moderate',
    fertilizerNeeds: 'low',
    growthDays: 60,
    basePrice: 11,
    tip: 'Plant early in spring or late summer. Provide trellis for climbing varieties.',
    nitrogenEffect: 28,
    phosphorusEffect: -4,
    potassiumEffect: -4,
    cropCategory: 'legume',
  },
  cabbage: {
    name: 'Cabbage',
    emoji: '🥬',
    description: 'Hardy brassica for fresh eating or preservation.',
    bestPlantingMonths: [3, 4, 7, 8],
    waterNeeds: 'moderate',
    fertilizerNeeds: 'moderate',
    growthDays: 70,
    basePrice: 10,
    tip: 'Tolerates light frost. Makes excellent sauerkraut for winter storage.',
    nitrogenEffect: -15,
    phosphorusEffect: -8,
    potassiumEffect: -12,
    cropCategory: 'vegetable',
  },
  turnips: {
    name: 'Turnips',
    emoji: '🫚',
    description: 'Fast-growing root vegetable for autumn harvest.',
    bestPlantingMonths: [3, 4, 8, 9],
    waterNeeds: 'moderate',
    fertilizerNeeds: 'low',
    growthDays: 55,
    basePrice: 7,
    tip: 'Quick-maturing crop. Both roots and greens are edible. Plant in succession for continuous harvest.',
    nitrogenEffect: -8,
    phosphorusEffect: -6,
    potassiumEffect: -10,
    cropCategory: 'root',
  },

  // Fruits & Specialty
  grapes: {
    name: 'Grapes',
    emoji: '🍇',
    description: 'Perennial vine fruit for wine and fresh consumption.',
    bestPlantingMonths: [3, 4],
    waterNeeds: 'moderate',
    fertilizerNeeds: 'moderate',
    growthDays: 365, // Perennial
    basePrice: 25,
    tip: 'Requires 2-3 years to establish. Proper pruning is essential. Excellent for wine production.',
    farmTypes: ['Vineyard', 'Winery'],
    nitrogenEffect: -12,
    phosphorusEffect: -8,
    potassiumEffect: -15,
    cropCategory: 'fruit',
  },
  olives: {
    name: 'Olives',
    emoji: '🫒',
    description: 'Ancient Mediterranean tree crop for oil and table use.',
    bestPlantingMonths: [3, 4, 10],
    waterNeeds: 'low',
    fertilizerNeeds: 'low',
    growthDays: 365, // Perennial
    basePrice: 30,
    tip: 'Drought-tolerant once established. Takes 5-8 years for first harvest. Press for oil or cure for eating.',
    farmTypes: ['Olive Grove', 'Olive Orchard'],
    nitrogenEffect: -8,
    phosphorusEffect: -6,
    potassiumEffect: -10,
    cropCategory: 'fruit',
  },
  cotton: {
    name: 'Cotton',
    emoji: '☁️',
    description: 'Fiber crop requiring warm climate and labor.',
    bestPlantingMonths: [4, 5],
    waterNeeds: 'moderate',
    fertilizerNeeds: 'high',
    growthDays: 150,
    basePrice: 22,
    tip: 'Highly profitable but labor-intensive. Depletes soil nutrients rapidly. Requires long, hot growing season.',
    farmTypes: ['Cotton Plantation', 'Cotton Farm'],
    nitrogenEffect: -25,
    phosphorusEffect: -15,
    potassiumEffect: -18,
    cropCategory: 'vegetable',
  },
  tobacco: {
    name: 'Tobacco',
    emoji: '🍂',
    description: 'Cash crop requiring careful curing and processing.',
    bestPlantingMonths: [4, 5],
    waterNeeds: 'moderate',
    fertilizerNeeds: 'high',
    growthDays: 120,
    basePrice: 28,
    tip: 'Valuable but demanding. Requires specific curing barns. Heavy feeder - rotate with cover crops.',
    farmTypes: ['Tobacco Plantation', 'Tobacco Farm'],
    nitrogenEffect: -22,
    phosphorusEffect: -14,
    potassiumEffect: -16,
    cropCategory: 'vegetable',
  },
  sugar: {
    name: 'Sugar Cane',
    emoji: '🎋',
    description: 'Tropical perennial for sugar and rum production.',
    bestPlantingMonths: [3, 4, 5],
    waterNeeds: 'high',
    fertilizerNeeds: 'high',
    growthDays: 365,
    basePrice: 35,
    tip: 'Requires tropical climate and abundant water. Very labor-intensive harvest. Ratoons regrow for multiple years.',
    farmTypes: ['Sugar Plantation', 'Sugar Estate'],
    nitrogenEffect: -20,
    phosphorusEffect: -12,
    potassiumEffect: -15,
    cropCategory: 'vegetable',
  },
  flax: {
    name: 'Flax',
    emoji: '🌾',
    description: 'Fiber crop for linen production and linseed oil.',
    bestPlantingMonths: [3, 4],
    waterNeeds: 'moderate',
    fertilizerNeeds: 'low',
    growthDays: 90,
    basePrice: 16,
    tip: 'Dual-purpose crop. Seeds yield linseed oil, stalks produce linen fiber. Requires retting process.',
    nitrogenEffect: -10,
    phosphorusEffect: -6,
    potassiumEffect: -8,
    cropCategory: 'vegetable',
  },
  millet: {
    name: 'Millet',
    emoji: '🌾',
    description: 'Drought-resistant grain for arid regions.',
    bestPlantingMonths: [5, 6],
    waterNeeds: 'low',
    fertilizerNeeds: 'low',
    growthDays: 75,
    basePrice: 9,
    tip: 'Excellent for marginal soils and dry climates. Fast-growing and highly nutritious.',
    nitrogenEffect: -8,
    phosphorusEffect: -5,
    potassiumEffect: -4,
    cropCategory: 'grain',
  },
  sorghum: {
    name: 'Sorghum',
    emoji: '🌾',
    description: 'Versatile grain tolerant of heat and drought.',
    bestPlantingMonths: [5, 6],
    waterNeeds: 'low',
    fertilizerNeeds: 'low',
    growthDays: 90,
    basePrice: 10,
    tip: 'Thrives in hot, dry conditions. Used for grain, syrup, and animal feed.',
    nitrogenEffect: -9,
    phosphorusEffect: -5,
    potassiumEffect: -5,
    cropCategory: 'grain',
  },
  lentils: {
    name: 'Lentils',
    emoji: '🫘',
    description: 'Protein-rich pulse crop for dry climates.',
    bestPlantingMonths: [3, 4, 9],
    waterNeeds: 'low',
    fertilizerNeeds: 'low',
    growthDays: 90,
    basePrice: 14,
    tip: 'Nitrogen-fixing legume. Good for crop rotation. Stores well when dried.',
    nitrogenEffect: 25, // Legumes fix nitrogen
    phosphorusEffect: -5,
    potassiumEffect: -3,
    cropCategory: 'legume',
  },
  apples: {
    name: 'Apples',
    emoji: '🍎',
    description: 'Perennial fruit tree requiring cold winters and careful pruning.',
    bestPlantingMonths: [3, 4, 10, 11],
    waterNeeds: 'moderate',
    fertilizerNeeds: 'moderate',
    growthDays: 365, // Perennial
    basePrice: 20,
    tip: 'Requires 3-5 years to bear fruit. Proper pruning and thinning essential for quality harvest. Many varieties for different climates.',
    farmTypes: ['Apple Orchard', 'Orchard'],
    nitrogenEffect: -10,
    phosphorusEffect: -8,
    potassiumEffect: -12,
    cropCategory: 'fruit',
  },
  pears: {
    name: 'Pears',
    emoji: '🍐',
    description: 'Hardy fruit tree tolerant of poor soils.',
    bestPlantingMonths: [3, 4, 11],
    waterNeeds: 'moderate',
    fertilizerNeeds: 'low',
    growthDays: 365, // Perennial
    basePrice: 18,
    tip: 'More fire blight resistant than apples. Pick before fully ripe and ripen indoors for best quality.',
    farmTypes: ['Pear Orchard', 'Orchard'],
    nitrogenEffect: -8,
    phosphorusEffect: -6,
    potassiumEffect: -10,
    cropCategory: 'fruit',
  },
  plums: {
    name: 'Plums',
    emoji: '🍑',
    description: 'Stone fruit with diverse varieties for fresh eating or preserving.',
    bestPlantingMonths: [3, 4],
    waterNeeds: 'moderate',
    fertilizerNeeds: 'moderate',
    growthDays: 365, // Perennial
    basePrice: 17,
    tip: 'Excellent for fresh eating, jams, and drying. Prune after harvest to maintain shape and productivity.',
    farmTypes: ['Plum Orchard', 'Orchard'],
    nitrogenEffect: -9,
    phosphorusEffect: -7,
    potassiumEffect: -11,
    cropCategory: 'fruit',
  },
  cherries: {
    name: 'Cherries',
    emoji: '🍒',
    description: 'Delicate stone fruit requiring careful handling and protection from birds.',
    bestPlantingMonths: [3, 4],
    waterNeeds: 'moderate',
    fertilizerNeeds: 'moderate',
    growthDays: 365, // Perennial
    basePrice: 28,
    tip: 'High value but labor-intensive. Netting essential to protect from birds. Sweet and sour varieties available.',
    farmTypes: ['Cherry Orchard', 'Orchard'],
    nitrogenEffect: -10,
    phosphorusEffect: -8,
    potassiumEffect: -12,
    cropCategory: 'fruit',
  },
  dates: {
    name: 'Dates',
    emoji: '🌴',
    description: 'Desert palm fruit requiring extreme heat and minimal water.',
    bestPlantingMonths: [3, 4],
    waterNeeds: 'low',
    fertilizerNeeds: 'low',
    growthDays: 365, // Perennial
    basePrice: 32,
    tip: 'Thrives in arid climates. Takes 4-8 years to bear fruit. Highly valuable in desert trade routes.',
    farmTypes: ['Date Palm Grove', 'Palm Grove'],
    nitrogenEffect: -5,
    phosphorusEffect: -4,
    potassiumEffect: -8,
    cropCategory: 'fruit',
  }
};

// Helper function to get month name
export function getMonthName(month: number): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[month - 1] || '';
}

// Helper to format planting season
export function formatPlantingSeason(months: number[]): string {
  if (months.length === 0) return 'Any time';
  if (months.length === 1) return getMonthName(months[0]);
  if (months.length === 2) return `${getMonthName(months[0])}-${getMonthName(months[1])}`;

  // Group consecutive months
  const ranges: string[] = [];
  let start = months[0];
  let prev = months[0];

  for (let i = 1; i <= months.length; i++) {
    const current = months[i];
    if (current !== prev + 1 || i === months.length) {
      if (start === prev) {
        ranges.push(getMonthName(start));
      } else {
        ranges.push(`${getMonthName(start)}-${getMonthName(prev)}`);
      }
      start = current;
    }
    prev = current;
  }

  return ranges.join(', ');
}
