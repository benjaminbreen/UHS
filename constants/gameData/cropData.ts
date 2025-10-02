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
    tip: 'Plant in early spring for summer harvest, or fall for winter wheat. Rotate with legumes to maintain soil fertility.'
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
    tip: 'More drought-tolerant than wheat. Excellent for beer production and livestock feed.'
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
    tip: 'Requires consistent flooding. Best in lowland areas with reliable water sources. Labor-intensive but highly productive.'
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
    tip: 'Thrives in cooler, wetter climates. Good cover crop that improves soil structure.'
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
    tip: 'Most cold-tolerant grain. Plant in fall for spring harvest. Excellent for poor soils.'
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
    tip: 'Plant after last frost. Benefits greatly from crop rotation with beans and squash (Three Sisters method).'
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
    tip: 'Plant seed potatoes 4 inches deep. Hill up soil as plants grow. Store in cool, dark places.'
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
    tip: 'Fixes nitrogen in soil - excellent for crop rotation. Plant after frost danger passes.'
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
    tip: 'Plant early in spring or late summer. Provide trellis for climbing varieties.'
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
    tip: 'Tolerates light frost. Makes excellent sauerkraut for winter storage.'
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
    tip: 'Quick-maturing crop. Both roots and greens are edible. Plant in succession for continuous harvest.'
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
    farmTypes: ['Vineyard', 'Winery']
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
    farmTypes: ['Olive Grove', 'Olive Orchard']
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
    farmTypes: ['Cotton Plantation', 'Cotton Farm']
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
    farmTypes: ['Tobacco Plantation', 'Tobacco Farm']
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
    farmTypes: ['Sugar Plantation', 'Sugar Estate']
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
    tip: 'Dual-purpose crop. Seeds yield linseed oil, stalks produce linen fiber. Requires retting process.'
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
    tip: 'Excellent for marginal soils and dry climates. Fast-growing and highly nutritious.'
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
    tip: 'Thrives in hot, dry conditions. Used for grain, syrup, and animal feed.'
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
    tip: 'Nitrogen-fixing legume. Good for crop rotation. Stores well when dried.'
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
