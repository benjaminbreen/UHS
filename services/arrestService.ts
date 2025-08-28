/**
 * services/arrestService.ts
 * Standalone arrest and justice system for handling law enforcement scenarios
 */

import { PlayerCharacter, MapData, Event } from '../types';

export interface ArrestScenario {
  reason: string; // Why player is being arrested
  location: string; // Where arrest happens
  authority: string; // Who is arresting (guards, militia, etc.)
  severity: 'minor' | 'major' | 'capital'; // Crime severity
}

export interface JailStructure {
  id: string;
  type: 'city' | 'palace' | 'fortress' | 'garrison';
  name: string;
  x: number;
  y: number;
  distance?: number;
}

/**
 * Trigger an arrest scenario based on context
 */
export function triggerArrest(
  scenario: ArrestScenario,
  playerCharacter: PlayerCharacter | null,
  mapData: MapData | null,
  worldData?: { structures?: any[] },
  onEventTrigger?: (event: Event) => void
): void {
  if (!playerCharacter || !mapData) {
    console.warn('[ARREST] Cannot trigger arrest without player and map data');
    return;
  }

  // Find suitable jail structures
  const jailableStructures = findJailStructures(worldData, playerCharacter);
  
  // Get cultural context
  const culturalZone = mapData.culturalZone || 'EUROPEAN';
  const era = mapData.era || 'MEDIEVAL';
  const year = parseInt(mapData.timeSlice || '1650');

  // Generate culturally appropriate arrest event
  const arrestEvent = createArrestEvent(
    scenario,
    jailableStructures[0], // Nearest jail
    culturalZone,
    era,
    year
  );

  // Teleport player to jail if structure found
  if (jailableStructures.length > 0 && playerCharacter.x !== undefined) {
    const nearestJail = jailableStructures[0];
    playerCharacter.x = nearestJail.x;
    playerCharacter.y = nearestJail.y;
    
    showToast(`You have been arrested and taken to the ${nearestJail.name}!`);
  } else {
    showToast(`You have been arrested by local ${scenario.authority}!`);
  }

  // Trigger the event modal
  if (onEventTrigger) {
    onEventTrigger(arrestEvent);
  }
}

/**
 * Find suitable structures for imprisonment
 */
function findJailStructures(
  worldData?: { structures?: any[] },
  playerCharacter?: PlayerCharacter | null
): JailStructure[] {
  if (!worldData?.structures) return [];

  const jailableStructures: JailStructure[] = [];
  
  for (const structure of worldData.structures) {
    if (structure.type === 'city' || 
        structure.type === 'palace' ||
        structure.type === 'fortress' ||
        structure.type === 'urban') {
      
      const jail: JailStructure = {
        id: structure.id || `jail-${structure.x}-${structure.y}`,
        type: structure.type === 'urban' ? 'city' : structure.type,
        name: structure.name || structure.type,
        x: structure.x || 0,
        y: structure.y || 0,
      };

      // Calculate distance if player position known
      if (playerCharacter?.x !== undefined && playerCharacter?.y !== undefined) {
        jail.distance = Math.sqrt(
          Math.pow(structure.x - playerCharacter.x, 2) + 
          Math.pow(structure.y - playerCharacter.y, 2)
        );
      }

      jailableStructures.push(jail);
    }
  }

  // Sort by distance
  return jailableStructures.sort((a, b) => (a.distance || 0) - (b.distance || 0));
}

/**
 * Create an arrest event with culturally appropriate details
 */
function createArrestEvent(
  scenario: ArrestScenario,
  jail: JailStructure | undefined,
  culturalZone: string,
  era: string,
  year: number
): Event {
  // Get location-specific details
  const locationName = jail ? 
    (jail.type === 'city' ? 'city jail' :
     jail.type === 'palace' ? 'palace dungeon' :
     jail.type === 'fortress' ? 'fortress prison' :
     'local garrison') : 'makeshift prison';

  // Get culturally appropriate punishments
  const punishments = getPunishmentsForCulture(culturalZone, era, year, scenario.severity);

  const arrestEvent: Event = {
    id: `arrest_${scenario.severity}_${Date.now()}`,
    title: getArrestTitle(scenario.severity, culturalZone),
    description: generateArrestDescription(scenario, locationName, culturalZone, era),
    context: {
      era,
      culturalZone,
      severity: scenario.severity,
    },
    choices: [
      {
        text: punishments.comply.text,
        requirements: [],
        consequences: {
          reputation: punishments.comply.reputationChange,
          health: punishments.comply.healthChange,
          items: punishments.comply.itemLoss,
        },
        historicalNote: punishments.comply.historicalNote,
      },
      {
        text: punishments.bribe.text,
        requirements: [{ type: 'hasGold', value: punishments.bribe.goldRequired }],
        consequences: {
          gold: -punishments.bribe.goldRequired,
          reputation: punishments.bribe.reputationChange,
        },
        historicalNote: punishments.bribe.historicalNote,
      },
      {
        text: punishments.resist.text,
        requirements: [],
        consequences: {
          initiatesCombat: true,
          reputation: punishments.resist.reputationChange,
        },
        historicalNote: punishments.resist.historicalNote,
      },
    ],
  };

  // Add culture-specific options
  if (culturalZone === 'EUROPEAN' && era === 'MEDIEVAL' && scenario.severity === 'major') {
    arrestEvent.choices.push({
      text: 'Demand trial by combat',
      requirements: [{ type: 'hasWeapon' }],
      consequences: {
        initiatesCombat: true,
        reputation: 10,
      },
      historicalNote: 'Trial by combat was a legitimate legal option in medieval Europe.',
    });
  }

  if (culturalZone === 'MENA' && scenario.severity === 'minor') {
    arrestEvent.choices.push({
      text: 'Appeal to Islamic law and mercy',
      requirements: [],
      consequences: {
        reputation: 5,
        randomOutcome: {
          success: { text: 'The qadi shows mercy', reputation: 10 },
          failure: { text: 'Your appeal is rejected', health: -10 },
        },
      },
      historicalNote: 'Islamic law emphasized mercy and could provide alternatives to punishment.',
    });
  }

  return arrestEvent;
}

/**
 * Get culturally appropriate arrest title
 */
function getArrestTitle(severity: string, culturalZone: string): string {
  const titles: Record<string, Record<string, string>> = {
    minor: {
      EUROPEAN: 'Detained by the Watch!',
      MENA: 'Seized by the Shurta!',
      EAST_ASIAN: 'Apprehended by Magistrate Guards!',
      SOUTH_ASIAN: 'Caught by the Kotwal!',
      SUB_SAHARAN_AFRICAN: 'Detained by Warriors!',
      NORTH_AMERICAN_PRE_COLUMBIAN: 'Captured by Tribal Warriors!',
      NORTH_AMERICAN_COLONIAL: 'Arrested by Colonial Militia!',
      SOUTH_AMERICAN: 'Seized by Conquistadors!',
      MESOAMERICAN: 'Captured by Jaguar Warriors!',
      OCEANIAN: 'Detained by Island Warriors!',
      DEFAULT: 'Arrested!',
    },
    major: {
      EUROPEAN: 'Arrested for Serious Crimes!',
      MENA: 'Brought Before the Qadi!',
      EAST_ASIAN: 'Summoned to the Magistrate!',
      SOUTH_ASIAN: 'Dragged Before the Raja!',
      SUB_SAHARAN_AFRICAN: 'Brought to the Chief!',
      NORTH_AMERICAN_PRE_COLUMBIAN: 'Facing Tribal Justice!',
      NORTH_AMERICAN_COLONIAL: 'Court Martial!',
      SOUTH_AMERICAN: 'Inquisition!',
      MESOAMERICAN: 'Sacrifice Threatened!',
      OCEANIAN: 'Taboo Violation!',
      DEFAULT: 'Serious Charges!',
    },
    capital: {
      EUROPEAN: 'Condemned to Death!',
      MENA: 'Facing Execution!',
      EAST_ASIAN: 'Death Sentence!',
      SOUTH_ASIAN: 'Royal Execution Order!',
      SUB_SAHARAN_AFRICAN: 'Ritual Execution!',
      NORTH_AMERICAN_PRE_COLUMBIAN: 'Marked for Death!',
      NORTH_AMERICAN_COLONIAL: 'Hanging Imminent!',
      SOUTH_AMERICAN: 'Auto-da-fé!',
      MESOAMERICAN: 'Heart Sacrifice!',
      OCEANIAN: 'Cast Out to Die!',
      DEFAULT: 'Death Sentence!',
    },
  };

  return titles[severity]?.[culturalZone] || titles[severity]?.DEFAULT || 'Arrested!';
}

/**
 * Generate culturally appropriate arrest description
 */
function generateArrestDescription(
  scenario: ArrestScenario,
  locationName: string,
  culturalZone: string,
  era: string
): string {
  const authorityDescriptions: Record<string, string> = {
    EUROPEAN: `The ${scenario.authority} seize you roughly, binding your hands with iron shackles.`,
    MENA: `The ${scenario.authority} surround you, invoking the authority of the Sultan.`,
    EAST_ASIAN: `The ${scenario.authority} bow formally before binding you with silk cords.`,
    SOUTH_ASIAN: `The ${scenario.authority} announce your crimes to the gathering crowd.`,
    SUB_SAHARAN_AFRICAN: `The ${scenario.authority} form a circle, spears pointed inward.`,
    NORTH_AMERICAN_PRE_COLUMBIAN: `The ${scenario.authority} emerge from the shadows, weapons drawn.`,
    NORTH_AMERICAN_COLONIAL: `The ${scenario.authority} read formal charges in the King's name.`,
    SOUTH_AMERICAN: `The ${scenario.authority} invoke divine authority as they seize you.`,
    MESOAMERICAN: `The ${scenario.authority} paint your face with the mark of a criminal.`,
    OCEANIAN: `The ${scenario.authority} declare you have broken sacred law.`,
  };

  const authority = authorityDescriptions[culturalZone] || 
    `The ${scenario.authority} apprehend you for ${scenario.reason}.`;

  const transport = locationName === 'makeshift prison' ? 
    'You are bound and held where you stand.' :
    `You are dragged to the ${locationName} to face justice.`;

  return `${authority} ${transport} ${getEraFlavor(era)}`;
}

/**
 * Get era-specific flavor text
 */
function getEraFlavor(era: string): string {
  const eraFlavors: Record<string, string> = {
    PREHISTORY: 'The tribal elders will decide your fate.',
    ANTIQUITY: 'Ancient laws demand satisfaction.',
    MEDIEVAL: 'Medieval justice shows little mercy.',
    RENAISSANCE_EARLY_MODERN: 'The magistrate will hear your case.',
    INDUSTRIAL_ERA: 'Modern law enforcement has taken notice.',
    MODERN_ERA: 'The authorities process your arrest methodically.',
    FUTURE_ERA: 'AI-assisted justice algorithms evaluate your crimes.',
  };
  
  return eraFlavors[era] || 'Justice will be served.';
}

/**
 * Get culturally appropriate punishments
 */
function getPunishmentsForCulture(
  culturalZone: string,
  era: string,
  year: number,
  severity: string
): any {
  const basePunishments = {
    comply: {
      text: 'Submit to arrest',
      reputationChange: -10,
      healthChange: severity === 'capital' ? -50 : severity === 'major' ? -20 : -5,
      itemLoss: severity === 'capital' ? ['all'] : severity === 'major' ? ['weapons'] : [],
      historicalNote: 'Compliance often led to lighter sentences.',
    },
    bribe: {
      text: 'Attempt to bribe the guards',
      goldRequired: severity === 'capital' ? 100 : severity === 'major' ? 50 : 20,
      reputationChange: -5,
      historicalNote: 'Corruption was common in most historical justice systems.',
    },
    resist: {
      text: 'Fight your way out',
      reputationChange: -30,
      historicalNote: 'Resisting arrest was itself a serious crime.',
    },
  };

  // Cultural modifications
  if (culturalZone === 'MENA') {
    basePunishments.comply.text = 'Submit to Allah\'s will';
    basePunishments.bribe.text = 'Offer baksheesh to the guards';
  } else if (culturalZone === 'EAST_ASIAN') {
    basePunishments.comply.text = 'Bow and accept your fate';
    basePunishments.resist.text = 'Fight with honor';
  } else if (culturalZone === 'NORTH_AMERICAN_PRE_COLUMBIAN') {
    basePunishments.comply.text = 'Accept tribal judgment';
    basePunishments.bribe.text = 'Offer valuable trade goods';
  }

  return basePunishments;
}

/**
 * Calculate arrest probability based on reputation
 */
export function calculateArrestProbability(reputation: number): number {
  if (reputation > 50) return 0;
  if (reputation > 25) return 0.05;
  if (reputation > 10) return 0.1;
  if (reputation > 0) return 0.25;
  if (reputation > -25) return 0.5;
  if (reputation > -50) return 0.75;
  return 1.0; // Guaranteed arrest at -50 or below
}

/**
 * Determine crime severity from actions
 */
export function determineCrimeSeverity(action: string): 'minor' | 'major' | 'capital' {
  const capitalCrimes = ['murder', 'treason', 'regicide', 'heresy', 'witchcraft'];
  const majorCrimes = ['assault', 'theft', 'burglary', 'fraud', 'smuggling'];
  
  const actionLower = action.toLowerCase();
  
  if (capitalCrimes.some(crime => actionLower.includes(crime))) {
    return 'capital';
  }
  if (majorCrimes.some(crime => actionLower.includes(crime))) {
    return 'major';
  }
  
  return 'minor';
}