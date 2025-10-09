/**
 * Factory Task Definitions
 * Historically accurate tasks for each factory type
 */

import { FactoryTask } from '../../components/factory/FactoryTaskCard';

// ============================================================================
// PLANTATIONS (Early Modern Era)
// ============================================================================

export const SUGAR_PLANTATION_TASKS: FactoryTask[] = [
  {
    id: 'cut_cane',
    name: 'Cut Cane',
    description: 'Harvest sugar cane stalks',
    icon: '🌾',
    duration: 10,
    outputValue: 15,
    fatigueIncrease: 22,
    injuryRisk: 0.25,
    requiresTimedAction: true
  },
  {
    id: 'load_cart',
    name: 'Load Cart',
    description: 'Stack cut cane into carts',
    icon: '🛒',
    duration: 6,
    outputValue: 10,
    fatigueIncrease: 16,
    injuryRisk: 0.08
  },
  {
    id: 'operate_press',
    name: 'Operate Press',
    description: 'Crush cane to extract juice',
    icon: '⚙️',
    duration: 8,
    outputValue: 12,
    fatigueIncrease: 14,
    injuryRisk: 0.18
  },
  {
    id: 'boil_juice',
    name: 'Boil Juice',
    description: 'Tend the boiling house',
    icon: '🔥',
    duration: 12,
    outputValue: 16,
    fatigueIncrease: 18,
    injuryRisk: 0.28
  },
  {
    id: 'fetch_water',
    name: 'Fetch Water',
    description: 'Carry water to the boiling house',
    icon: '💧',
    duration: 5,
    outputValue: 3,
    fatigueIncrease: 12,
    injuryRisk: 0.02
  },
  {
    id: 'clear_field',
    name: 'Clear Field',
    description: 'Remove debris and weeds',
    icon: '🪓',
    duration: 8,
    outputValue: 6,
    fatigueIncrease: 20,
    injuryRisk: 0.12
  }
];

export const COTTON_PLANTATION_TASKS: FactoryTask[] = [
  {
    id: 'pick_cotton',
    name: 'Pick Cotton',
    description: 'Harvest cotton bolls by hand',
    icon: '☁️',
    duration: 10,
    outputValue: 15,
    fatigueIncrease: 20,
    injuryRisk: 0.08,
    requiresTimedAction: true
  },
  {
    id: 'operate_gin',
    name: 'Operate Cotton Gin',
    description: 'Separate seeds from fiber',
    icon: '⚙️',
    duration: 8,
    outputValue: 20,
    fatigueIncrease: 12,
    injuryRisk: 0.15
  },
  {
    id: 'pack_bales',
    name: 'Pack Bales',
    description: 'Compress cotton into bales',
    icon: '📦',
    duration: 7,
    outputValue: 12,
    fatigueIncrease: 16,
    injuryRisk: 0.10
  },
  {
    id: 'move_bales',
    name: 'Move Bales',
    description: 'Transport heavy cotton bales',
    icon: '🏋️',
    duration: 5,
    outputValue: 8,
    fatigueIncrease: 18,
    injuryRisk: 0.12
  },
  {
    id: 'water_plants',
    name: 'Water Plants',
    description: 'Irrigate cotton fields',
    icon: '💧',
    duration: 6,
    outputValue: 5,
    fatigueIncrease: 14,
    injuryRisk: 0.05
  },
  {
    id: 'weed_rows',
    name: 'Weed Rows',
    description: 'Remove weeds from cotton rows',
    icon: '🌱',
    duration: 8,
    outputValue: 6,
    fatigueIncrease: 16,
    injuryRisk: 0.08
  }
];

// ============================================================================
// INDUSTRIAL ERA FACTORIES
// ============================================================================

export const TEXTILE_MILL_TASKS: FactoryTask[] = [
  {
    id: 'operate_loom',
    name: 'Operate Loom',
    description: 'Run the power loom to weave cloth',
    icon: '🧵',
    duration: 8,
    outputValue: 12,
    fatigueIncrease: 10,
    injuryRisk: 0.08,
    requiresTimedAction: true
  },
  {
    id: 'thread_bobbin',
    name: 'Thread Bobbin',
    description: 'Wind thread onto bobbins',
    icon: '🪡',
    duration: 5,
    outputValue: 6,
    fatigueIncrease: 5,
    injuryRisk: 0.03,
    requiresTimedAction: true
  },
  {
    id: 'clean_machine',
    name: 'Clean Machine',
    description: 'Remove cotton lint from machinery',
    icon: '🧹',
    duration: 6,
    outputValue: 3,
    fatigueIncrease: 8,
    injuryRisk: 0.12
  },
  {
    id: 'package_cloth',
    name: 'Package Cloth',
    description: 'Bundle finished cloth for shipment',
    icon: '📦',
    duration: 4,
    outputValue: 8,
    fatigueIncrease: 6,
    injuryRisk: 0.01
  },
  {
    id: 'repair_thread',
    name: 'Repair Broken Thread',
    description: 'Tie broken threads quickly',
    icon: '🔗',
    duration: 3,
    outputValue: 4,
    fatigueIncrease: 4,
    injuryRisk: 0.05,
    requiresTimedAction: true
  },
  {
    id: 'fetch_materials',
    name: 'Fetch Materials',
    description: 'Bring raw cotton to looms',
    icon: '🏃',
    duration: 5,
    outputValue: 2,
    fatigueIncrease: 12,
    injuryRisk: 0.02
  }
];

export const STEEL_MILL_TASKS: FactoryTask[] = [
  {
    id: 'pour_ladle',
    name: 'Pour Ladle',
    description: 'Pour molten steel carefully',
    icon: '🥄',
    duration: 12,
    outputValue: 18,
    fatigueIncrease: 18,
    injuryRisk: 0.22,
    requiresTimedAction: true,
    skillCheck: { attribute: 'strength', difficulty: 14 }
  },
  {
    id: 'load_furnace',
    name: 'Load Furnace',
    description: 'Add coal and ore to furnace',
    icon: '🔥',
    duration: 10,
    outputValue: 14,
    fatigueIncrease: 16,
    injuryRisk: 0.15
  },
  {
    id: 'move_ingots',
    name: 'Move Ingots',
    description: 'Transport hot steel ingots',
    icon: '📦',
    duration: 8,
    outputValue: 10,
    fatigueIncrease: 14,
    injuryRisk: 0.12,
    requiresTimedAction: true
  },
  {
    id: 'clear_slag',
    name: 'Clear Slag',
    description: 'Remove slag from crucibles',
    icon: '⚒️',
    duration: 7,
    outputValue: 8,
    fatigueIncrease: 12,
    injuryRisk: 0.18
  },
  {
    id: 'check_temp',
    name: 'Check Temperature',
    description: 'Monitor furnace heat',
    icon: '🌡️',
    duration: 4,
    outputValue: 4,
    fatigueIncrease: 6,
    injuryRisk: 0.08
  },
  {
    id: 'shovel_coal',
    name: 'Shovel Coal',
    description: 'Feed coal into the furnace',
    icon: '⛏️',
    duration: 6,
    outputValue: 6,
    fatigueIncrease: 20,
    injuryRisk: 0.05
  }
];

export const RAILWAY_WORKSHOP_TASKS: FactoryTask[] = [
  {
    id: 'assemble_boiler',
    name: 'Assemble Boiler',
    description: 'Construct locomotive boiler',
    icon: '⚙️',
    duration: 12,
    outputValue: 20,
    fatigueIncrease: 18,
    injuryRisk: 0.15,
    requiresTimedAction: true,
    skillCheck: { attribute: 'intelligence', difficulty: 14 }
  },
  {
    id: 'rivet_plates',
    name: 'Rivet Plates',
    description: 'Secure steel plates with rivets',
    icon: '🔨',
    duration: 8,
    outputValue: 12,
    fatigueIncrease: 14,
    injuryRisk: 0.12,
    requiresTimedAction: true
  },
  {
    id: 'fit_pistons',
    name: 'Fit Pistons',
    description: 'Install piston assemblies',
    icon: '🔧',
    duration: 10,
    outputValue: 15,
    fatigueIncrease: 12,
    injuryRisk: 0.08
  },
  {
    id: 'paint_finish',
    name: 'Paint Finish',
    description: 'Apply protective paint coating',
    icon: '🎨',
    duration: 6,
    outputValue: 8,
    fatigueIncrease: 6,
    injuryRisk: 0.05
  },
  {
    id: 'test_steam',
    name: 'Test Steam System',
    description: 'Check boiler pressure and valves',
    icon: '💨',
    duration: 8,
    outputValue: 10,
    fatigueIncrease: 10,
    injuryRisk: 0.18
  },
  {
    id: 'move_parts',
    name: 'Move Heavy Parts',
    description: 'Transport components to assembly',
    icon: '📦',
    duration: 5,
    outputValue: 5,
    fatigueIncrease: 16,
    injuryRisk: 0.10
  }
];

// ============================================================================
// MODERN ERA FACTORIES
// ============================================================================

export const AUTOMOBILE_FACTORY_TASKS: FactoryTask[] = [
  {
    id: 'install_engine',
    name: 'Install Engine',
    description: 'Mount engine to chassis',
    icon: '🔧',
    duration: 10,
    outputValue: 18,
    fatigueIncrease: 14,
    injuryRisk: 0.10,
    requiresTimedAction: true
  },
  {
    id: 'weld_frame',
    name: 'Weld Frame',
    description: 'Weld chassis components',
    icon: '🔥',
    duration: 8,
    outputValue: 12,
    fatigueIncrease: 12,
    injuryRisk: 0.15
  },
  {
    id: 'paint_body',
    name: 'Paint Body',
    description: 'Apply paint to car body',
    icon: '🎨',
    duration: 6,
    outputValue: 10,
    fatigueIncrease: 8,
    injuryRisk: 0.05
  },
  {
    id: 'inspect_quality',
    name: 'Quality Inspection',
    description: 'Check assembly quality',
    icon: '🔍',
    duration: 5,
    outputValue: 8,
    fatigueIncrease: 6,
    injuryRisk: 0.02
  },
  {
    id: 'install_seats',
    name: 'Install Seats',
    description: 'Fit interior seating',
    icon: '💺',
    duration: 7,
    outputValue: 10,
    fatigueIncrease: 10,
    injuryRisk: 0.08
  },
  {
    id: 'move_units',
    name: 'Move Completed Units',
    description: 'Drive cars to lot',
    icon: '🚗',
    duration: 4,
    outputValue: 6,
    fatigueIncrease: 8,
    injuryRisk: 0.05
  }
];

export const ELECTRONICS_FACTORY_TASKS: FactoryTask[] = [
  {
    id: 'solder_boards',
    name: 'Solder Circuit Boards',
    description: 'Solder components to PCBs',
    icon: '🔌',
    duration: 8,
    outputValue: 15,
    fatigueIncrease: 10,
    injuryRisk: 0.08,
    requiresTimedAction: true,
    skillCheck: { attribute: 'dexterity', difficulty: 16 }
  },
  {
    id: 'test_circuits',
    name: 'Test Circuits',
    description: 'Check circuit functionality',
    icon: '🔬',
    duration: 6,
    outputValue: 12,
    fatigueIncrease: 8,
    injuryRisk: 0.03
  },
  {
    id: 'assemble_casings',
    name: 'Assemble Casings',
    description: 'Put together device housing',
    icon: '📱',
    duration: 5,
    outputValue: 10,
    fatigueIncrease: 6,
    injuryRisk: 0.05
  },
  {
    id: 'program_firmware',
    name: 'Program Firmware',
    description: 'Flash software to devices',
    icon: '💾',
    duration: 7,
    outputValue: 14,
    fatigueIncrease: 8,
    injuryRisk: 0.02
  },
  {
    id: 'pack_units',
    name: 'Pack Units',
    description: 'Package finished products',
    icon: '📦',
    duration: 4,
    outputValue: 8,
    fatigueIncrease: 6,
    injuryRisk: 0.02
  },
  {
    id: 'sort_components',
    name: 'Sort Components',
    description: 'Organize electronic parts',
    icon: '🗂️',
    duration: 5,
    outputValue: 6,
    fatigueIncrease: 6,
    injuryRisk: 0.01
  }
];

// ============================================================================
// TASK MAP - Maps factory type IDs to their tasks
// ============================================================================

export const FACTORY_TASK_MAP: Record<string, FactoryTask[]> = {
  // Plantations
  'sugar_plantation': SUGAR_PLANTATION_TASKS,
  'cotton_plantation': COTTON_PLANTATION_TASKS,
  'coffee_plantation': SUGAR_PLANTATION_TASKS, // Similar tasks, can customize later
  'tobacco_plantation': COTTON_PLANTATION_TASKS, // Similar tasks

  // Industrial Era
  'textile_mill': TEXTILE_MILL_TASKS,
  'steel_mill': STEEL_MILL_TASKS,
  'railway_workshop': RAILWAY_WORKSHOP_TASKS,

  // Modern Era
  'automobile_factory': AUTOMOBILE_FACTORY_TASKS,
  'electronics_factory': ELECTRONICS_FACTORY_TASKS
};

// Default fallback tasks
export const DEFAULT_FACTORY_TASKS: FactoryTask[] = [
  {
    id: 'generic_work',
    name: 'Factory Work',
    description: 'Perform assigned factory tasks',
    icon: '⚙️',
    duration: 8,
    outputValue: 10,
    fatigueIncrease: 12,
    injuryRisk: 0.10
  },
  {
    id: 'move_materials',
    name: 'Move Materials',
    description: 'Transport raw materials',
    icon: '📦',
    duration: 6,
    outputValue: 6,
    fatigueIncrease: 14,
    injuryRisk: 0.08
  },
  {
    id: 'clean_area',
    name: 'Clean Work Area',
    description: 'Maintain workplace cleanliness',
    icon: '🧹',
    duration: 5,
    outputValue: 3,
    fatigueIncrease: 8,
    injuryRisk: 0.03
  },
  {
    id: 'assist_others',
    name: 'Assist Coworkers',
    description: 'Help other workers with tasks',
    icon: '🤝',
    duration: 7,
    outputValue: 8,
    fatigueIncrease: 10,
    injuryRisk: 0.05
  },
  {
    id: 'quality_check',
    name: 'Quality Check',
    description: 'Inspect product quality',
    icon: '🔍',
    duration: 4,
    outputValue: 5,
    fatigueIncrease: 6,
    injuryRisk: 0.02
  },
  {
    id: 'fetch_supplies',
    name: 'Fetch Supplies',
    description: 'Retrieve needed materials',
    icon: '🏃',
    duration: 5,
    outputValue: 4,
    fatigueIncrease: 10,
    injuryRisk: 0.04
  }
];

/**
 * Get tasks for a specific factory type ID
 */
export function getTasksForFactoryType(factoryTypeId: string): FactoryTask[] {
  const tasks = FACTORY_TASK_MAP[factoryTypeId];

  if (!tasks) {
    console.warn(`[FactoryTasks] No tasks defined for factory type: ${factoryTypeId}, using default tasks`);
    return DEFAULT_FACTORY_TASKS;
  }

  console.log(`[FactoryTasks] ✅ Loaded ${tasks.length} tasks for: ${factoryTypeId}`);
  return tasks;
}
