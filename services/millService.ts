/**
 * Mill Service - Handles mill economy, NPC workers, and grain processing
 */

import { TerrainStructure, NpcEntity, Item, HistoricalEra } from '../types';
import { ITEM_DEFINITIONS, getItemDefinition } from '../constants/gameData/itemDefinitions';

// Mill types based on historical era and region
export interface MillType {
  id: string;
  name: string;
  description: string;
  era: HistoricalEra[];
  inputs: string[]; // Item IDs that can be processed
  outputs: { [input: string]: { itemId: string; ratio: number } }; // What each input produces
  processingTime: number; // In game ticks
  processingCost: number; // Cost to process items
  workerProfessions: string[];
  capacity: number; // Max items that can be processed at once
}

export const MILL_TYPES: { [key: string]: MillType } = {
  'hand_quern': {
    id: 'hand_quern',
    name: 'Hand Quern',
    description: 'A simple stone mill operated by hand',
    era: [HistoricalEra.PREHISTORIC, HistoricalEra.ANCIENT],
    inputs: ['WHEAT', 'BARLEY', 'RYE', 'MILLET'],
    outputs: {
      'WHEAT': { itemId: 'FLOUR', ratio: 0.8 },
      'BARLEY': { itemId: 'BARLEY_FLOUR', ratio: 0.7 },
      'RYE': { itemId: 'RYE_FLOUR', ratio: 0.75 },
      'MILLET': { itemId: 'MILLET_FLOUR', ratio: 0.6 }
    },
    processingTime: 10,
    processingCost: 1,
    workerProfessions: ['Grinder', 'Mill Worker'],
    capacity: 5
  },
  
  'animal_mill': {
    id: 'animal_mill',
    name: 'Animal-Powered Mill',
    description: 'A mill powered by oxen or donkeys',
    era: [HistoricalEra.ANCIENT, HistoricalEra.MEDIEVAL],
    inputs: ['WHEAT', 'BARLEY', 'RYE', 'CORN', 'OLIVES'],
    outputs: {
      'WHEAT': { itemId: 'FLOUR', ratio: 0.85 },
      'BARLEY': { itemId: 'BARLEY_FLOUR', ratio: 0.8 },
      'RYE': { itemId: 'RYE_FLOUR', ratio: 0.8 },
      'CORN': { itemId: 'CORNMEAL', ratio: 0.75 },
      'OLIVES': { itemId: 'OLIVE_OIL', ratio: 0.4 }
    },
    processingTime: 8,
    processingCost: 2,
    workerProfessions: ['Miller', 'Mill Hand', 'Animal Handler'],
    capacity: 15
  },
  
  'water_mill': {
    id: 'water_mill',
    name: 'Water Mill',
    description: 'A mill powered by flowing water',
    era: [HistoricalEra.ANCIENT, HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN],
    inputs: ['WHEAT', 'BARLEY', 'RYE', 'CORN', 'RICE', 'OLIVES', 'SUGARCANE'],
    outputs: {
      'WHEAT': { itemId: 'FLOUR', ratio: 0.9 },
      'BARLEY': { itemId: 'BARLEY_FLOUR', ratio: 0.85 },
      'RYE': { itemId: 'RYE_FLOUR', ratio: 0.85 },
      'CORN': { itemId: 'CORNMEAL', ratio: 0.8 },
      'RICE': { itemId: 'RICE_FLOUR', ratio: 0.75 },
      'OLIVES': { itemId: 'OLIVE_OIL', ratio: 0.45 },
      'SUGARCANE': { itemId: 'RAW_SUGAR', ratio: 0.3 }
    },
    processingTime: 5,
    processingCost: 3,
    workerProfessions: ['Master Miller', 'Miller', 'Mill Worker', 'Apprentice'],
    capacity: 30
  },
  
  'windmill': {
    id: 'windmill',
    name: 'Windmill',
    description: 'A mill powered by wind',
    era: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN, HistoricalEra.INDUSTRIAL_ERA],
    inputs: ['WHEAT', 'BARLEY', 'RYE', 'CORN', 'RICE', 'COCOA', 'SPICES'],
    outputs: {
      'WHEAT': { itemId: 'FLOUR', ratio: 0.92 },
      'BARLEY': { itemId: 'BARLEY_FLOUR', ratio: 0.87 },
      'RYE': { itemId: 'RYE_FLOUR', ratio: 0.87 },
      'CORN': { itemId: 'CORNMEAL', ratio: 0.82 },
      'RICE': { itemId: 'RICE_FLOUR', ratio: 0.77 },
      'COCOA': { itemId: 'COCOA_POWDER', ratio: 0.7 },
      'SPICES': { itemId: 'GROUND_SPICES', ratio: 0.9 }
    },
    processingTime: 4,
    processingCost: 4,
    workerProfessions: ['Windmill Keeper', 'Master Miller', 'Miller', 'Mill Hand'],
    capacity: 40
  },
  
  'tidal_mill': {
    id: 'tidal_mill',
    name: 'Tidal Mill',
    description: 'A mill powered by tidal movements',
    era: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN],
    inputs: ['WHEAT', 'BARLEY', 'RYE', 'SALT_WATER'],
    outputs: {
      'WHEAT': { itemId: 'FLOUR', ratio: 0.88 },
      'BARLEY': { itemId: 'BARLEY_FLOUR', ratio: 0.83 },
      'RYE': { itemId: 'RYE_FLOUR', ratio: 0.83 },
      'SALT_WATER': { itemId: 'SEA_SALT', ratio: 0.2 }
    },
    processingTime: 6,
    processingCost: 3,
    workerProfessions: ['Tidal Miller', 'Mill Worker'],
    capacity: 25
  },
  
  'steam_mill': {
    id: 'steam_mill',
    name: 'Steam-Powered Mill',
    description: 'An industrial mill powered by steam engine',
    era: [HistoricalEra.INDUSTRIAL_ERA, HistoricalEra.WORLD_WARS, HistoricalEra.MODERN],
    inputs: ['WHEAT', 'BARLEY', 'RYE', 'CORN', 'RICE', 'SOYBEANS', 'COFFEE', 'COCOA'],
    outputs: {
      'WHEAT': { itemId: 'FLOUR', ratio: 0.95 },
      'BARLEY': { itemId: 'BARLEY_FLOUR', ratio: 0.9 },
      'RYE': { itemId: 'RYE_FLOUR', ratio: 0.9 },
      'CORN': { itemId: 'CORNMEAL', ratio: 0.87 },
      'RICE': { itemId: 'RICE_FLOUR', ratio: 0.82 },
      'SOYBEANS': { itemId: 'SOY_FLOUR', ratio: 0.8 },
      'COFFEE': { itemId: 'GROUND_COFFEE', ratio: 0.98 },
      'COCOA': { itemId: 'COCOA_POWDER', ratio: 0.75 }
    },
    processingTime: 2,
    processingCost: 5,
    workerProfessions: ['Mill Engineer', 'Mill Foreman', 'Machine Operator', 'Mill Worker'],
    capacity: 100
  },
  
  'electric_mill': {
    id: 'electric_mill',
    name: 'Electric Mill',
    description: 'A modern mill powered by electricity',
    era: [HistoricalEra.MODERN, HistoricalEra.CONTEMPORARY],
    inputs: ['WHEAT', 'BARLEY', 'RYE', 'CORN', 'RICE', 'SOYBEANS', 'QUINOA', 'COFFEE', 'COCOA', 'NUTS'],
    outputs: {
      'WHEAT': { itemId: 'FLOUR', ratio: 0.98 },
      'BARLEY': { itemId: 'BARLEY_FLOUR', ratio: 0.93 },
      'RYE': { itemId: 'RYE_FLOUR', ratio: 0.93 },
      'CORN': { itemId: 'CORNMEAL', ratio: 0.9 },
      'RICE': { itemId: 'RICE_FLOUR', ratio: 0.85 },
      'SOYBEANS': { itemId: 'SOY_FLOUR', ratio: 0.83 },
      'QUINOA': { itemId: 'QUINOA_FLOUR', ratio: 0.88 },
      'COFFEE': { itemId: 'GROUND_COFFEE', ratio: 0.99 },
      'COCOA': { itemId: 'COCOA_POWDER', ratio: 0.78 },
      'NUTS': { itemId: 'NUT_FLOUR', ratio: 0.7 }
    },
    processingTime: 1,
    processingCost: 6,
    workerProfessions: ['Mill Manager', 'Quality Controller', 'Machine Operator', 'Maintenance Tech'],
    capacity: 200
  },
  
  // Specialized mills
  'sugar_mill': {
    id: 'sugar_mill',
    name: 'Sugar Mill',
    description: 'A specialized mill for processing sugarcane',
    era: [HistoricalEra.RENAISSANCE_EARLY_MODERN, HistoricalEra.INDUSTRIAL_ERA],
    inputs: ['SUGARCANE', 'SUGAR_BEETS'],
    outputs: {
      'SUGARCANE': { itemId: 'RAW_SUGAR', ratio: 0.35 },
      'SUGAR_BEETS': { itemId: 'BEET_SUGAR', ratio: 0.25 }
    },
    processingTime: 8,
    processingCost: 5,
    workerProfessions: ['Sugar Master', 'Boiler', 'Mill Worker', 'Cane Cutter'],
    capacity: 50
  },
  
  'olive_press': {
    id: 'olive_press',
    name: 'Olive Press',
    description: 'A mill specifically for pressing olives',
    era: [HistoricalEra.ANCIENT, HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN],
    inputs: ['OLIVES'],
    outputs: {
      'OLIVES': { itemId: 'OLIVE_OIL', ratio: 0.5 }
    },
    processingTime: 6,
    processingCost: 2,
    workerProfessions: ['Oil Presser', 'Press Worker'],
    capacity: 20
  },
  
  'rice_huller': {
    id: 'rice_huller',
    name: 'Rice Huller',
    description: 'A mill for removing rice husks',
    era: [HistoricalEra.ANCIENT, HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN],
    inputs: ['RAW_RICE'],
    outputs: {
      'RAW_RICE': { itemId: 'POLISHED_RICE', ratio: 0.7 }
    },
    processingTime: 4,
    processingCost: 2,
    workerProfessions: ['Rice Miller', 'Huller Operator'],
    capacity: 35
  }
};

// Determine mill type based on era and location
export function getMillType(era: HistoricalEra, location: { isCoast: boolean; hasRiver: boolean; altitude: number }): MillType {
  const availableMills = Object.values(MILL_TYPES).filter(mill => 
    mill.era.includes(era)
  );
  
  if (availableMills.length === 0) {
    return MILL_TYPES.hand_quern; // Fallback
  }
  
  // Prioritize based on location
  if (location.hasRiver && availableMills.find(m => m.id === 'water_mill')) {
    return MILL_TYPES.water_mill;
  }
  if (location.isCoast && availableMills.find(m => m.id === 'tidal_mill')) {
    return MILL_TYPES.tidal_mill;
  }
  if (location.altitude > 50 && availableMills.find(m => m.id === 'windmill')) {
    return MILL_TYPES.windmill;
  }
  
  // Return most advanced available
  const priorityOrder = ['electric_mill', 'steam_mill', 'windmill', 'water_mill', 'animal_mill', 'hand_quern'];
  for (const millId of priorityOrder) {
    const mill = availableMills.find(m => m.id === millId);
    if (mill) return mill;
  }
  
  return availableMills[0];
}

// Generate mill workers
export function generateMillWorkers(millType: MillType, millLocation: [number, number]): NpcEntity[] {
  const workers: NpcEntity[] = [];
  const numWorkers = Math.min(3, millType.workerProfessions.length);
  
  for (let i = 0; i < numWorkers; i++) {
    const profession = millType.workerProfessions[i] || 'Mill Worker';
    workers.push({
      id: `mill-worker-${millLocation[0]}-${millLocation[1]}-${i}`,
      name: generateWorkerName(profession),
      profession,
      x: millLocation[0] + (Math.random() - 0.5) * 2,
      y: millLocation[1] + (Math.random() - 0.5) * 2,
      emoji: getWorkerEmoji(profession),
      health: 100,
      maxHealth: 100,
      inventory: generateWorkerInventory(profession, millType),
      currency: 10 + Math.floor(Math.random() * 20),
      isStationary: false,
      workplace: `mill-${millLocation[0]}-${millLocation[1]}`,
      dialogue: generateMillDialogue(profession, millType)
    } as NpcEntity);
  }
  
  return workers;
}

function generateWorkerName(profession: string): string {
  const firstNames = ['John', 'William', 'Thomas', 'Robert', 'James', 'Mary', 'Sarah', 'Elizabeth'];
  const lastNames = ['Miller', 'Stone', 'Grain', 'Wind', 'Waters', 'Wheel'];
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
}

function getWorkerEmoji(profession: string): string {
  const emojiMap: { [key: string]: string } = {
    'Master Miller': '👨‍🌾',
    'Miller': '👷',
    'Mill Worker': '👨‍🏭',
    'Mill Hand': '💪',
    'Windmill Keeper': '🌬️',
    'Mill Engineer': '👨‍🔧',
    'Sugar Master': '🍬',
    'Oil Presser': '🫒'
  };
  return emojiMap[profession] || '👷';
}

function generateWorkerInventory(profession: string, millType: MillType): Item[] {
  const inventory: Item[] = [];
  
  // Add some processed goods
  const outputs = Object.values(millType.outputs);
  if (outputs.length > 0) {
    const randomOutput = outputs[Math.floor(Math.random() * outputs.length)];
    const itemDef = getItemDefinition(randomOutput.itemId);
    if (itemDef) {
      inventory.push({
        ...itemDef,
        quantity: 1 + Math.floor(Math.random() * 3)
      });
    }
  }
  
  // Add profession-specific items
  if (profession.includes('Master') || profession.includes('Manager')) {
    inventory.push({
      ...ITEM_DEFINITIONS.LEDGER || ITEM_DEFINITIONS.PAPER,
      quantity: 1
    });
  }
  
  return inventory.filter(item => item);
}

function generateMillDialogue(profession: string, millType: MillType): string[] {
  const baseDialogue = [
    `Welcome to the ${millType.name}.`,
    `We process ${millType.inputs.join(', ')} here.`,
    `The grinding stones never stop turning.`,
    `Bring your grain and we'll grind it for ${millType.processingCost} coins.`
  ];
  
  const professionDialogue: { [key: string]: string[] } = {
    'Master Miller': [
      'I\'ve been running this mill for twenty years.',
      'The secret is keeping the stones at just the right distance.',
      'We produce the finest flour in the region.'
    ],
    'Mill Worker': [
      'It\'s hard work, but honest.',
      'The dust gets everywhere.',
      'We work from dawn to dusk.'
    ],
    'Windmill Keeper': [
      'The wind has been good this season.',
      'I can tell the weather by how the mill sounds.',
      'Each sail needs constant maintenance.'
    ],
    'Sugar Master': [
      'The cane must be crushed quickly after cutting.',
      'We boil the juice down to crystallize the sugar.',
      'It\'s dangerous work around the boiling vats.'
    ]
  };
  
  return [...baseDialogue, ...(professionDialogue[profession] || [])];
}

// Process items at a mill
export interface ProcessingRequest {
  millId: string;
  millType: MillType;
  inputItems: { itemId: string; quantity: number }[];
  playerId: string;
}

export interface ProcessingResult {
  success: boolean;
  outputItems?: { itemId: string; quantity: number }[];
  cost?: number;
  message: string;
}

export function processItemsAtMill(request: ProcessingRequest, playerCurrency: number): ProcessingResult {
  const { millType, inputItems } = request;
  
  // Check if player has enough currency
  const totalCost = inputItems.reduce((sum, item) => sum + item.quantity, 0) * millType.processingCost;
  if (playerCurrency < totalCost) {
    return {
      success: false,
      message: `You need ${totalCost} coins to process these items. You only have ${playerCurrency}.`
    };
  }
  
  // Check capacity
  const totalQuantity = inputItems.reduce((sum, item) => sum + item.quantity, 0);
  if (totalQuantity > millType.capacity) {
    return {
      success: false,
      message: `This mill can only process ${millType.capacity} items at once. You're trying to process ${totalQuantity}.`
    };
  }
  
  // Process each input
  const outputItems: { itemId: string; quantity: number }[] = [];
  
  for (const input of inputItems) {
    // Check if this mill can process this input
    if (!millType.inputs.includes(input.itemId)) {
      return {
        success: false,
        message: `This mill cannot process ${input.itemId}.`
      };
    }
    
    const output = millType.outputs[input.itemId];
    if (output) {
      const outputQuantity = Math.floor(input.quantity * output.ratio);
      const existing = outputItems.find(o => o.itemId === output.itemId);
      if (existing) {
        existing.quantity += outputQuantity;
      } else {
        outputItems.push({
          itemId: output.itemId,
          quantity: outputQuantity
        });
      }
    }
  }
  
  return {
    success: true,
    outputItems,
    cost: totalCost,
    message: `Successfully processed ${totalQuantity} items for ${totalCost} coins.`
  };
}

// Get mill description for UI
export function getMillDescription(millType: MillType): string {
  const inputs = millType.inputs.map(id => 
    getItemDefinition(id)?.name || id
  ).join(', ');
  
  const outputs = Object.entries(millType.outputs).map(([inputId, output]) => 
    `${getItemDefinition(inputId)?.name || inputId} → ${getItemDefinition(output.itemId)?.name || output.itemId} (${Math.round(output.ratio * 100)}% yield)`
  ).join('\n');
  
  return `${millType.description}\n\nProcesses: ${inputs}\n\nProduces:\n${outputs}\n\nCost: ${millType.processingCost} coins per item\nCapacity: ${millType.capacity} items`;
}