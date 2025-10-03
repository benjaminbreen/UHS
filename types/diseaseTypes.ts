/**
 * types/diseaseTypes.ts - Type definitions for the historical disease system
 */

import { HistoricalEra } from './enums';
import { CulturalZone } from './characterData';
import { GameDate } from './index';

export type DiseaseType =
  | 'respiratory'     // Airborne, close proximity
  | 'gastrointestinal' // Contaminated food/water
  | 'vector_borne'     // Insect/animal bites
  | 'contact'          // Direct contact, bodily fluids
  | 'parasitic'        // Contaminated water, poor hygiene
  | 'zoonotic'         // Animal contact
  | 'traumatic';       // Physical injuries from accidents

export type TransmissionVector =
  | 'airborne'      // Respiratory droplets, shared air
  | 'waterborne'    // Contaminated water/food
  | 'vector'        // Insect/tick/flea bite
  | 'contact'       // Direct skin/fluid contact
  | 'zoonotic'      // Animal-to-human transmission
  | 'traumatic';    // Physical injury, no transmission

export type DiseaseSeverity = 'mild' | 'moderate' | 'severe' | 'critical';

export type DiseaseStage = 'incubating' | 'symptomatic' | 'recovering';

export type OverallHealthStatus = 'healthy' | 'mild' | 'sick' | 'critical';

export interface Symptom {
  id: string;
  name: string;
  description: string;
  severity: number; // 0-1, affects stat penalties
}

export interface DiseaseProgressionStage {
  day: number; // Day of disease when this stage occurs (can be fractional for hours)
  symptoms: string[]; // Descriptions of symptoms at this stage
  severity: number; // 0-1, severity at this stage
  statModifiers: {
    health?: number;
    fatigue?: number;
    strength?: number;
    intelligence?: number;
    charisma?: number;
    speed?: number;
  };
}

export interface Disease {
  id: string;
  name: string;
  type: DiseaseType | 'nutritional' | 'toxic'; // Added nutritional and toxic types
  severity: DiseaseSeverity;
  
  // Historical constraints
  availableEras: HistoricalEra[];
  availableRegions: CulturalZone[];
  startYear?: number;  // First historical appearance
  endYear?: number;    // Eradication/effective control
  
  // Transmission mechanics
  transmissionVector: TransmissionVector | 'nutritional' | 'foodborne';
  baseTransmissionRate: number; // 0-1, base chance per exposure
  proximityMultiplier: number;  // Multiplier for close contact
  directContactMultiplier: number; // Multiplier for direct interaction
  
  // Disease progression
  symptoms: Symptom[];
  incubationDays: number;
  durationDays: number;
  mortalityRate: number; // 0-1, modified by constitution
  
  // Character impact when infected
  statEffects: {
    health: number;
    fatigue: number;
    strength: number;
    intelligence: number;
    charisma: number;
    speed: number;
  };
  
  // Recovery mechanics
  recoveryChance: number; // Daily recovery check probability
  grantsImmunity: boolean;
  immunityDuration: number; // Days, -1 for permanent immunity
  
  // Progressive stages (optional) - defines how disease worsens/improves over time
  progressionStages?: DiseaseProgressionStage[];
  
  // Narrative and visual elements
  narrativeHints: {
    npcSymptoms: string[];    // "is coughing loudly", "looks feverish"
    animalSymptoms: string[]; // "appears lethargic", "is limping"
    playerSymptoms: string[]; // "You feel feverish", "Your throat is sore"
  };
  badgeIcon: string;        // Unicode emoji for UI
  outlineColor: string;     // Player circle color when infected
}

export interface ActiveDisease {
  disease: Disease;
  contractedDate: GameDate;
  stage: DiseaseStage;
  daysRemaining: number;
  daysSinceContraction: number; // Track days for progression stages
  severity: number; // 0-1, modified by constitution and treatment
  sourceEntityId?: string; // ID of NPC/animal that transmitted the disease
  lastProgressionCheck?: number; // Last time (in hours) progression was checked
}

export interface Immunity {
  diseaseId: string;
  acquiredDate: GameDate;
  expirationDate?: GameDate; // undefined for permanent immunity
}

export interface ExposureEvent {
  diseaseId: string;
  exposureDate: GameDate;
  transmissionVector: TransmissionVector;
  sourceEntityId?: string;
  exposureStrength: number; // 0-1, determines transmission probability
  proximityType: 'distant' | 'nearby' | 'close' | 'direct_contact';
}

export interface CharacterHealth {
  currentDiseases: ActiveDisease[];
  immunities: Immunity[];
  exposureHistory: ExposureEvent[];
  overallHealthStatus: OverallHealthStatus;
  lastHealthUpdate: GameDate;
  pastDiseases?: ActiveDisease[]; // History of past diseases
}

export interface DiseaseTransmissionContext {
  sourceEntity: {
    id: string;
    type: 'npc' | 'animal';
    name: string;
    diseases: ActiveDisease[];
  };
  targetEntity: {
    id: string;
    type: 'player' | 'npc' | 'animal';
    constitution: number;
    currentHealth: number;
    immunities: Immunity[];
  };
  exposureType: 'proximity' | 'direct_contact' | 'shared_resource';
  environmentalFactors: {
    crowded: boolean;
    poorSanitation: boolean;
    season: string;
    climate: string;
  };
}

export interface DiseaseSpreadParameters {
  eraModifier: number;        // Historical era affects disease prevalence
  regionModifier: number;     // Regional climate/culture affects spread
  populationDensity: number;  // Urban vs rural affects transmission
  sanitationLevel: number;    // Era-appropriate sanitation affects waterborne diseases
  medicalKnowledge: number;   // Era-appropriate medical understanding
}

// Disease prevalence by era and region
export interface DiseasePrevalence {
  diseaseId: string;
  era: HistoricalEra;
  region: CulturalZone;
  baseIncidence: number; // 0-1, base chance for NPCs to have this disease
  epidemicYears?: number[]; // Specific years when disease was epidemic
  endemicRegions?: CulturalZone[]; // Regions where disease is always present
}

export interface Medicine {
  id: string;
  name: string;
  availableEras: HistoricalEra[];
  availableRegions: CulturalZone[];
  effectiveness: Partial<Record<DiseaseType, number>>; // 0-1 effectiveness by disease type
  sideEffects?: {
    health?: number;
    fatigue?: number;
    strength?: number;
    intelligence?: number;
  };
  cost: number;
  description: string;
}

// Columbian Exchange tracking for disease spread restrictions
export interface ColumbianExchangeRestrictions {
  preContactNewWorld: string[]; // Disease IDs that didn't exist in Americas pre-1492
  preContactOldWorld: string[]; // Disease IDs that didn't exist in Europe/Asia/Africa pre-contact
  exchangeYear: number; // 1492 - when diseases could cross between worlds
}