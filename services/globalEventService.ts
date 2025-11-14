/**
 * services/globalEventService.ts
 * Manages world-changing historical events that affect all NPCs and game state
 */

import { CulturalZone, Item } from '../types';
import { parseDateString } from '../utils/dateUtils';

export interface EventChoice {
  id: string;
  label: string; // Button text
  description: string; // Consequence preview
  icon?: string;

  effects: {
    reputationChange?: number;
    currencyChange?: number;
    itemsGained?: Item[];
    healthRisk?: number; // 0-1 chance of getting disease
    diseaseType?: string; // Type of disease if healthRisk fails
    skillGain?: { skill: string; amount: number };
    relationshipChanges?: Record<string, number>; // npcId -> change
  };
}

export interface GlobalEvent {
  id: string;
  name: string;
  historicalDate: number; // Year
  dateRange?: [number, number]; // Can trigger within this range
  regions: CulturalZone[];
  category: 'catastrophe' | 'economic' | 'technological' | 'political' | 'religious' | 'natural';

  // Modal content
  title: string;
  description: string; // Player-facing narrative
  historicalContext: string; // Educational explanation

  // Player choices
  choices: EventChoice[];

  // World effects (applied after choice)
  effects: {
    npcMortalityRate?: number; // 0-1 (e.g., 0.33 = 1/3 die)
    priceMultipliers?: Record<string, number>; // item -> multiplier
    wageMultiplier?: number;
    newItemsUnlocked?: string[];
    disruptedTradeRoutes?: boolean;
    populationMigration?: 'influx' | 'exodus';
  };

  // Duration
  durationDays: number; // How long effects last

  // Trigger probability (0-1, checked daily within date range)
  triggerChance?: number;
}

export interface ActiveGlobalEvent {
  event: GlobalEvent;
  playerChoice: string | null;
  startDate: string;
  endDate: string;
  effectsApplied: boolean;
}

const ACTIVE_EVENTS_KEY = 'globalEvents.active';
const TRIGGERED_EVENTS_KEY = 'globalEvents.triggered'; // Track which events already happened

/**
 * All global historical events
 */
export const GLOBAL_EVENTS: GlobalEvent[] = [
  // === BLACK DEATH (1347-1353) ===
  {
    id: 'black_death_1348',
    name: 'The Great Pestilence',
    historicalDate: 1348,
    dateRange: [1347, 1353],
    regions: ['EUROPEAN', 'MENA', 'EAST_ASIAN'],
    category: 'catastrophe',

    title: '🦠 The Great Pestilence 🦠',
    description: `A terrible plague has reached your region. Merchants arriving from distant ports speak of entire cities emptied, the dead piled in streets. The sick develop black boils and die within days. Some flee to the countryside. Others pray for divine mercy. The air reeks of death and burning herbs.\n\nWhat will you do?`,

    historicalContext: `The Black Death (1347-1353) killed an estimated 30-60% of Europe's population, causing massive economic and social upheaval. Labor shortages led to wage increases and contributed to the weakening of serfdom. The plague reshaped medieval society forever.`,

    choices: [
      {
        id: 'flee',
        label: '🏃 Flee to Remote Farmland',
        description: 'Abandon the city for isolated countryside. Lower infection risk but lose urban opportunities and contacts.',
        icon: '🏃',
        effects: {
          healthRisk: 0.05, // Much lower infection risk
          reputationChange: -20,
          currencyChange: -50,
          diseaseType: 'bubonic_plague'
        }
      },
      {
        id: 'help',
        label: '⛪ Stay and Help the Sick',
        description: 'Aid plague victims despite the danger. High infection risk but earn immense respect and spiritual merit.',
        icon: '⛪',
        effects: {
          healthRisk: 0.40, // High risk
          reputationChange: +80,
          currencyChange: -20,
          diseaseType: 'bubonic_plague'
        }
      },
      {
        id: 'profit',
        label: '💰 Hoard and Sell Necessities',
        description: 'Buy up food and medicine, then sell at inflated prices. Profit from desperation at moral cost.',
        icon: '💰',
        effects: {
          currencyChange: +300,
          reputationChange: -50,
          healthRisk: 0.15
        }
      },
      {
        id: 'isolate',
        label: '🚪 Seal Yourself Inside',
        description: 'Lock doors, stockpile supplies, wait it out. Moderate risk, neutral reputation.',
        icon: '🚪',
        effects: {
          healthRisk: 0.10,
          currencyChange: -30,
          reputationChange: 0
        }
      }
    ],

    effects: {
      npcMortalityRate: 0.35,
      priceMultipliers: {
        'BREAD': 3.0,
        'GRAIN': 3.5,
        'HERBS': 5.0,
        'MEDICINE': 8.0,
        'CLOTH': 2.5
      },
      wageMultiplier: 2.5
    },

    durationDays: 180,
    triggerChance: 1.0 // Always triggers when in date range
  },

  // === MONGOL INVASION (1240s) ===
  {
    id: 'mongol_invasion_1241',
    name: 'The Mongol Horde Approaches',
    historicalDate: 1241,
    dateRange: [1240, 1242],
    regions: ['EUROPEAN'],
    category: 'political',

    title: '⚔️ Mongol Armies Approach ⚔️',
    description: `Refugees flood into your settlement with terrifying tales. Mongol horsemen have swept through the east like a scythe, burning cities and demanding submission. Their envoys arrive at the city gates:\n\n"Submit to the Great Khan and pay tribute, or be destroyed."\n\nThe local lord calls for warriors. Merchants panic about blocked trade routes. What will you do?`,

    historicalContext: `The Mongol invasions of Europe (1237-1242) devastated Eastern Europe and reached as far as Hungary and Poland before withdrawing. While destructive, Mongol rule later enabled the Pax Mongolica and revitalized Silk Road trade.`,

    choices: [
      {
        id: 'fight',
        label: '⚔️ Join Defense Force',
        description: 'Take up arms to defend your homeland. High risk of death or injury, but gain military glory.',
        icon: '⚔️',
        effects: {
          healthRisk: 0.60,
          reputationChange: +100,
          currencyChange: 0
        }
      },
      {
        id: 'submit',
        label: '🤝 Advocate Submission',
        description: 'Counsel peace and tribute. Preserve lives but lose autonomy and pay heavy taxes.',
        icon: '🤝',
        effects: {
          currencyChange: -200,
          reputationChange: -30
        }
      },
      {
        id: 'evacuate',
        label: '🏃 Evacuate Westward',
        description: 'Become a refugee, fleeing west with whatever you can carry.',
        icon: '🏃',
        effects: {
          currencyChange: -100,
          reputationChange: -10
        }
      }
    ],

    effects: {
      disruptedTradeRoutes: true,
      priceMultipliers: {
        'SILK': 4.0,
        'SPICES': 3.5,
        'WEAPONS': 2.0,
        'HORSES': 2.5
      }
    },

    durationDays: 90,
    triggerChance: 1.0
  },

  // === PRINTING PRESS (1450s) ===
  {
    id: 'printing_press_1455',
    name: 'The Printing Revolution',
    historicalDate: 1455,
    dateRange: [1450, 1460],
    regions: ['EUROPEAN'],
    category: 'technological',

    title: '📖 The Printing Revolution 📖',
    description: `A German craftsman named Gutenberg has created a machine that can print books faster than a monastery of scribes. A printer has arrived in your town with this miraculous device, offering demonstration copies of a newly printed Bible.\n\nMonastery scribes are furious—their ancient livelihood threatened. But books that once cost a year's wages might soon be affordable to common folk. What will you do?`,

    historicalContext: `Johannes Gutenberg's printing press (c.1440-1450) revolutionized European society. Book prices fell by 80%+, literacy rates soared, and ideas spread rapidly. The technology enabled the Reformation and the Scientific Revolution. Scribe guilds fought the technology but ultimately lost.`,

    choices: [
      {
        id: 'invest',
        label: '💰 Invest in Printing Workshop',
        description: 'Risk significant capital on this new technology. Could yield enormous returns.',
        icon: '💰',
        effects: {
          currencyChange: -500,
          reputationChange: +20
        }
      },
      {
        id: 'learn',
        label: '📚 Become Printer Apprentice',
        description: 'Learn this new trade. Abandon your old profession for a potentially lucrative future.',
        icon: '📚',
        effects: {
          currencyChange: -100,
          reputationChange: +10
        }
      },
      {
        id: 'resist',
        label: '✋ Side with the Scribes',
        description: 'Protect traditional craftsmanship. Oppose this machine that threatens livelihoods.',
        icon: '✋',
        effects: {
          reputationChange: +30,
          currencyChange: 0
        }
      },
      {
        id: 'ignore',
        label: '🤷 Do Nothing',
        description: 'This doesn\'t concern you. Let history unfold without your involvement.',
        icon: '🤷',
        effects: {
          reputationChange: 0,
          currencyChange: 0
        }
      }
    ],

    effects: {
      priceMultipliers: {
        'BOOK': 0.3,
        'PAPER': 1.5,
        'INK': 1.3
      }
    },

    durationDays: 365,
    triggerChance: 1.0
  },

  // === GREAT FAMINE (1315-1317) ===
  {
    id: 'great_famine_1315',
    name: 'The Great Famine',
    historicalDate: 1315,
    dateRange: [1315, 1317],
    regions: ['EUROPEAN'],
    category: 'natural',

    title: '🌧️ Years of Cold and Rain 🌧️',
    description: `The rains will not stop. For three years now, crops have rotted in flooded fields. Grain stores are exhausted. Bread prices have tripled. You see hollow-eyed families begging in the streets. The desperate speak of eating bark and worse.\n\nStarvation is here. How will you survive?`,

    historicalContext: `The Great Famine of 1315-1317 killed millions across Europe due to unusually cold, wet weather that destroyed harvests. It marked the end of the Medieval Warm Period and showed how vulnerable pre-modern societies were to climate change.`,

    choices: [
      {
        id: 'hoard',
        label: '🌾 Guard Your Food Stores',
        description: 'Protect what little you have. Let others fend for themselves.',
        icon: '🌾',
        effects: {
          reputationChange: -40,
          currencyChange: 0,
          healthRisk: 0.05
        }
      },
      {
        id: 'share',
        label: '🤝 Share with the Starving',
        description: 'Distribute your supplies to those in need. Noble but risky.',
        icon: '🤝',
        effects: {
          reputationChange: +60,
          currencyChange: -50,
          healthRisk: 0.25,
          diseaseType: 'malnutrition'
        }
      },
      {
        id: 'forage',
        label: '🍄 Forage Wilderness Foods',
        description: 'Search forests for mushrooms, roots, wild game. Dangerous but necessary.',
        icon: '🍄',
        effects: {
          reputationChange: 0,
          healthRisk: 0.15,
          currencyChange: -20
        }
      }
    ],

    effects: {
      priceMultipliers: {
        'BREAD': 5.0,
        'GRAIN': 6.0,
        'MEAT': 4.0,
        'VEGETABLES': 3.5
      }
    },

    durationDays: 365,
    triggerChance: 1.0
  },

  // === VIKING RAIDS (9th-11th centuries) ===
  {
    id: 'viking_raid_900',
    name: 'Northmen Raid',
    historicalDate: 900,
    dateRange: [800, 1050],
    regions: ['EUROPEAN'],
    category: 'political',

    title: '⚓ Longships on the Horizon ⚓',
    description: `Lookouts cry alarm: dragon-prowed ships approach the coast. Northmen! The raiders come seeking silver, slaves, and plunder. They strike fast and vanish before armies can respond.\n\nYour settlement has minutes to prepare. What will you do?`,

    historicalContext: `Viking raids terrorized European coasts from the 8th-11th centuries. While devastating, the Vikings also established trade networks and eventually integrated into European society as settlers (Normandy, England, Russia).`,

    choices: [
      {
        id: 'fight',
        label: '⚔️ Grab Weapons and Fight',
        description: 'Defend your home. Vikings respect courage and may withdraw if you fight fiercely.',
        icon: '⚔️',
        effects: {
          healthRisk: 0.50,
          reputationChange: +50,
          currencyChange: -50
        }
      },
      {
        id: 'hide',
        label: '🌲 Hide Valuables in Woods',
        description: 'Bury your silver and flee to the forest. Return when they leave.',
        icon: '🌲',
        effects: {
          healthRisk: 0.10,
          reputationChange: -10,
          currencyChange: -30
        }
      },
      {
        id: 'pay',
        label: '💰 Offer Danegeld',
        description: 'Pay tribute to avoid violence. Expensive but safer.',
        icon: '💰',
        effects: {
          healthRisk: 0.05,
          reputationChange: -20,
          currencyChange: -200
        }
      }
    ],

    effects: {
      priceMultipliers: {
        'SILVER': 1.5,
        'WEAPONS': 1.8
      }
    },

    durationDays: 7,
    triggerChance: 0.15 // Random raids
  }
];

/**
 * Get currently active global events
 */
export function getActiveGlobalEvents(): ActiveGlobalEvent[] {
  try {
    const stored = localStorage.getItem(ACTIVE_EVENTS_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading active global events:', error);
    return [];
  }
}

/**
 * Get events that have already been triggered (prevents duplicates)
 */
function getTriggeredEvents(): string[] {
  try {
    const stored = localStorage.getItem(TRIGGERED_EVENTS_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading triggered events:', error);
    return [];
  }
}

/**
 * Mark event as triggered
 */
function markEventTriggered(eventId: string): void {
  try {
    const triggered = getTriggeredEvents();
    if (!triggered.includes(eventId)) {
      triggered.push(eventId);
      localStorage.setItem(TRIGGERED_EVENTS_KEY, JSON.stringify(triggered));
    }
  } catch (error) {
    console.error('Error marking event as triggered:', error);
  }
}

/**
 * Check if a global event should trigger
 */
export function checkForEvent(params: {
  currentDate: string;
  culturalZone: CulturalZone;
  randomChance: number;
}): GlobalEvent | null {
  const { currentDate, culturalZone, randomChance } = params;

  // Parse current date
  const dateInfo = parseDateString(currentDate);
  const currentYear = dateInfo.year;

  // Get already triggered events
  const triggeredEvents = getTriggeredEvents();

  // Filter eligible events
  const eligibleEvents = GLOBAL_EVENTS.filter(event => {
    // Skip if already triggered
    if (triggeredEvents.includes(event.id)) return false;

    // Check region
    if (!event.regions.includes(culturalZone)) return false;

    // Check date range
    if (event.dateRange) {
      const [start, end] = event.dateRange;
      if (currentYear < start || currentYear > end) return false;
    } else {
      // Single date - must be exact year or within 2 years
      if (Math.abs(currentYear - event.historicalDate) > 2) return false;
    }

    // Check trigger chance
    const chance = event.triggerChance ?? 1.0;
    if (randomChance > chance) return false;

    return true;
  });

  if (eligibleEvents.length === 0) return null;

  // Return first eligible event (or could randomize)
  const event = eligibleEvents[0];

  // Mark as triggered
  markEventTriggered(event.id);

  return event;
}

/**
 * Activate a global event (player has seen it and made choice)
 */
export function activateGlobalEvent(
  event: GlobalEvent,
  playerChoice: string,
  currentDate?: string
): void {
  const active = getActiveGlobalEvents();

  // Calculate end date
  const startDateString = currentDate || new Date().toISOString().split('T')[0];
  const [yearStr, monthStr, dayStr] = startDateString.split('-');
  const endDate = new Date(parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr));
  endDate.setDate(endDate.getDate() + event.durationDays);
  const endDateString = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

  const activeEvent: ActiveGlobalEvent = {
    event,
    playerChoice,
    startDate: startDateString,
    endDate: endDateString,
    effectsApplied: false
  };

  active.push(activeEvent);

  try {
    localStorage.setItem(ACTIVE_EVENTS_KEY, JSON.stringify(active));
  } catch (error) {
    console.error('Error saving active global event:', error);
  }
}

/**
 * Get LLM context string for all active events
 */
export function getGlobalEventsLLMContext(): string {
  const active = getActiveGlobalEvents();

  if (active.length === 0) return '';

  return active.map(ae => {
    const choiceText = ae.playerChoice
      ? ae.event.choices.find(c => c.id === ae.playerChoice)?.label || ae.playerChoice
      : 'has not yet decided how to respond';

    return `**MAJOR HISTORICAL EVENT (ACTIVE)**: ${ae.event.name} - ${ae.event.description.split('\n')[0]} The player ${choiceText}.`;
  }).join('\n\n');
}

/**
 * Clean up expired events
 */
export function cleanupExpiredEvents(currentDate: string): void {
  const active = getActiveGlobalEvents();
  const [yearStr, monthStr, dayStr] = currentDate.split('-');
  const currentTimestamp = new Date(parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr)).getTime();

  const stillActive = active.filter(ae => {
    const [endYearStr, endMonthStr, endDayStr] = ae.endDate.split('-');
    const endTimestamp = new Date(parseInt(endYearStr), parseInt(endMonthStr) - 1, parseInt(endDayStr)).getTime();
    return currentTimestamp <= endTimestamp;
  });

  try {
    localStorage.setItem(ACTIVE_EVENTS_KEY, JSON.stringify(stillActive));
  } catch (error) {
    console.error('Error cleaning up expired events:', error);
  }
}
