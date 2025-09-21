/**
 * services/injuryService.ts - Converts skill failures into traumatic injuries using the disease framework
 */

import { PlayerCharacter, ActiveDisease, Disease } from '../types';
import { DISEASES } from '../constants/gameData/diseases';
import { FeatType, FeatRisk, PhysicalFeatAttempt } from './physicalFeatService';

export type InjuryType = 'physical_feat' | 'skill_failure' | 'combat_accident';

export interface InjuryContext {
  type: InjuryType;
  skillType?: string; // 'CHOP', 'DIG', 'CLIMB', etc.
  featType?: FeatType; // 'ford', 'climb', 'jump', etc.
  risk?: FeatRisk;
  severity?: number; // 0-1, how badly the failure went
  bodyPart?: string; // Optional specific body part affected
}

/**
 * Maps skill/feat failures to appropriate traumatic injuries
 */
export function selectInjuryForFailure(context: InjuryContext): Disease | null {
  // Get all traumatic injuries from the disease database
  const traumaticInjuries = DISEASES.filter(disease => disease.type === 'traumatic');

  if (traumaticInjuries.length === 0) return null;

  const { type, skillType, featType, risk = 'medium', severity = 0.5 } = context;

  // Physical feat injuries
  if (type === 'physical_feat' && featType) {
    switch (featType) {
      case 'climb':
      case 'scale':
        // Climbing failures -> falls, scrapes, potential serious injuries
        if (risk === 'extreme' || severity > 0.8) {
          return getInjuryById('DISLOCATED_SHOULDER') || getInjuryById('BROKEN_FINGER');
        } else if (risk === 'high' || severity > 0.6) {
          return getInjuryById('BRUISED_RIBS') || getInjuryById('TORN_MUSCLE');
        } else {
          return getInjuryById('SCRAPED_KNEE') || getInjuryById('CUT_HAND');
        }

      case 'ford':
      case 'swim':
        // Water crossing failures -> slips, cuts, muscle strains
        if (risk === 'extreme' || severity > 0.8) {
          return getInjuryById('TORN_MUSCLE') || getInjuryById('BRUISED_RIBS');
        } else if (risk === 'high' || severity > 0.6) {
          return getInjuryById('SPRAINED_ANKLE') || getInjuryById('CUT_HAND');
        } else {
          return getInjuryById('SCRAPED_KNEE') || getInjuryById('HEAD_BUMP');
        }

      case 'jump':
      case 'squeeze':
        // Jumping failures -> landing injuries, ankle sprains
        if (risk === 'extreme' || severity > 0.8) {
          return getInjuryById('BROKEN_FINGER') || getInjuryById('DISLOCATED_SHOULDER');
        } else if (risk === 'high' || severity > 0.6) {
          return getInjuryById('SPRAINED_ANKLE') || getInjuryById('TORN_MUSCLE');
        } else {
          return getInjuryById('SCRAPED_KNEE') || getInjuryById('HEAD_BUMP');
        }

      default:
        return getRandomInjuryBySeverity(severity);
    }
  }

  // Skill-based injuries
  if (type === 'skill_failure' && skillType) {
    switch (skillType) {
      case 'CHOP':
        // Chopping failures -> hand/finger injuries, tool accidents
        if (severity > 0.7) {
          return getInjuryById('CUT_HAND') || getInjuryById('BROKEN_FINGER');
        } else {
          return getInjuryById('CUT_HAND') || getInjuryById('SCRAPED_KNEE');
        }

      case 'DIG':
        // Digging failures -> back strain, hand injuries
        if (severity > 0.7) {
          return getInjuryById('TORN_MUSCLE') || getInjuryById('CUT_HAND');
        } else {
          return getInjuryById('SPRAINED_ANKLE') || getInjuryById('SCRAPED_KNEE');
        }

      case 'FORAGE':
        // Foraging failures -> thorn cuts, insect stings, falls
        return getInjuryById('CUT_HAND') || getInjuryById('SCRAPED_KNEE');

      case 'BURN':
        // Fire starting failures -> burns (would need new burn injury type)
        return getInjuryById('CUT_HAND') || getInjuryById('HEAD_BUMP');

      default:
        return getRandomInjuryBySeverity(severity);
    }
  }

  // Combat accidents
  if (type === 'combat_accident') {
    if (severity > 0.8) {
      return getInjuryById('DISLOCATED_SHOULDER') || getInjuryById('TORN_MUSCLE');
    } else if (severity > 0.5) {
      return getInjuryById('BRUISED_RIBS') || getInjuryById('CUT_HAND');
    } else {
      return getInjuryById('SCRAPED_KNEE') || getInjuryById('HEAD_BUMP');
    }
  }

  // Fallback to random injury
  return getRandomInjuryBySeverity(severity);
}

/**
 * Helper to get a specific injury by ID
 */
function getInjuryById(injuryId: string): Disease | null {
  return DISEASES.find(disease => disease.id === injuryId) || null;
}

/**
 * Helper to get a random injury based on severity level
 */
function getRandomInjuryBySeverity(severity: number): Disease | null {
  const traumaticInjuries = DISEASES.filter(disease => disease.type === 'traumatic');

  if (traumaticInjuries.length === 0) return null;

  let filteredInjuries: Disease[];

  if (severity > 0.8) {
    // Severe injuries only
    filteredInjuries = traumaticInjuries.filter(injury => injury.severity === 'severe');
  } else if (severity > 0.5) {
    // Moderate injuries
    filteredInjuries = traumaticInjuries.filter(injury => injury.severity === 'moderate');
  } else {
    // Mild injuries
    filteredInjuries = traumaticInjuries.filter(injury => injury.severity === 'mild');
  }

  // If no injuries of that severity, fall back to all traumatic injuries
  if (filteredInjuries.length === 0) {
    filteredInjuries = traumaticInjuries;
  }

  // Return random injury from filtered list
  return filteredInjuries[Math.floor(Math.random() * filteredInjuries.length)];
}

/**
 * Creates an active disease instance from an injury
 */
export function createActiveInjury(
  injury: Disease,
  currentDate: { year: number; month: number; day: number }
): ActiveDisease {
  return {
    disease: injury,
    contractedDate: currentDate,
    stage: 'symptomatic', // Injuries are immediately symptomatic
    daysRemaining: injury.durationDays,
    daysSinceContraction: 0,
    severity: Math.random() * 0.3 + 0.4, // Random severity between 0.4-0.7 for realistic variation
    lastProgressionCheck: 0
  };
}

/**
 * Determines if a skill failure should result in an injury
 * Based on failure severity, player constitution, and randomness
 */
export function shouldCauseInjury(
  player: PlayerCharacter,
  context: InjuryContext
): boolean {
  const { severity = 0.5, risk = 'medium' } = context;

  // Base injury chance based on severity
  let baseChance = 0;

  if (severity > 0.9) {
    baseChance = 0.4; // 40% chance for critical failures
  } else if (severity > 0.7) {
    baseChance = 0.25; // 25% chance for severe failures
  } else if (severity > 0.5) {
    baseChance = 0.15; // 15% chance for moderate failures
  } else {
    baseChance = 0.05; // 5% chance for minor failures
  }

  // Risk level modifier
  const riskModifiers = {
    low: 0.5,
    medium: 1.0,
    high: 1.5,
    extreme: 2.0
  };

  baseChance *= riskModifiers[risk];

  // Constitution modifier (higher constitution = less likely to get injured)
  const constitution = player.stats.constitution || 10;
  const constitutionModifier = 1 - ((constitution - 10) * 0.02); // Each point above 10 reduces chance by 2%

  baseChance *= Math.max(0.1, constitutionModifier); // Never go below 10% of base chance

  // Fatigue modifier (more tired = more prone to injury)
  const fatiguePercent = player.fatigue / player.maxFatigue;
  const fatigueModifier = 1 + (fatiguePercent * 0.5); // Up to 50% increase when fully fatigued

  baseChance *= fatigueModifier;

  // Current health modifier (already injured = more prone to additional injuries)
  const healthPercent = player.health / player.maxHealth;
  const healthModifier = 1 + ((1 - healthPercent) * 0.3); // Up to 30% increase when at low health

  baseChance *= healthModifier;

  // Cap at 80% max chance
  const finalChance = Math.min(0.8, baseChance);

  return Math.random() < finalChance;
}

/**
 * Applies an injury to a player character
 */
export function applyInjuryToPlayer(
  player: PlayerCharacter,
  injury: ActiveDisease
): {
  applied: boolean;
  message: string;
  previousHealth?: number;
} {
  // Initialize disease health if not present
  if (!player.diseaseHealth) {
    player.diseaseHealth = {
      currentDiseases: [],
      immunities: [],
      exposureHistory: [],
      overallHealthStatus: 'healthy',
      lastHealthUpdate: { year: 0, month: 1, day: 1 }
    };
  }

  // Check if player already has this exact injury
  const existingInjury = player.diseaseHealth.currentDiseases.find(
    disease => disease.disease.id === injury.disease.id
  );

  if (existingInjury) {
    // Don't apply the same injury twice, but make existing one slightly worse
    existingInjury.severity = Math.min(1.0, existingInjury.severity + 0.1);
    existingInjury.daysRemaining = Math.max(existingInjury.daysRemaining, injury.daysRemaining);

    return {
      applied: true,
      message: `Your existing ${injury.disease.name.toLowerCase()} worsens from the additional trauma.`
    };
  }

  // Apply the injury
  const previousHealth = player.health;
  player.diseaseHealth.currentDiseases.push(injury);

  // Apply immediate stat effects
  if (injury.disease.statEffects) {
    player.health = Math.max(1, player.health + (injury.disease.statEffects.health || 0));
    player.fatigue = Math.min(player.maxFatigue, player.fatigue + (injury.disease.statEffects.fatigue || 0));

    // Apply stat penalties (would need to be managed by character state system)
    // For now, just apply immediate health/fatigue effects
  }

  // Update overall health status
  const totalSeverity = player.diseaseHealth.currentDiseases.reduce(
    (sum, disease) => sum + disease.severity, 0
  );

  if (totalSeverity > 2.0) {
    player.diseaseHealth.overallHealthStatus = 'critical';
  } else if (totalSeverity > 1.0) {
    player.diseaseHealth.overallHealthStatus = 'sick';
  } else if (totalSeverity > 0.3) {
    player.diseaseHealth.overallHealthStatus = 'mild';
  }

  // Get injury description from player symptoms
  const symptoms = injury.disease.narrativeHints.playerSymptoms || [];
  const symptom = symptoms[Math.floor(Math.random() * symptoms.length)] ||
                 `You have sustained a ${injury.disease.name.toLowerCase()}.`;

  return {
    applied: true,
    message: `💥 **Injury Sustained!** ${symptom}`,
    previousHealth
  };
}

/**
 * Main function to handle skill failure injuries
 * Call this whenever a skill fails with significant consequences
 */
export function handleSkillFailureInjury(
  player: PlayerCharacter,
  context: InjuryContext,
  currentDate: { year: number; month: number; day: number }
): {
  injured: boolean;
  injury?: ActiveDisease;
  message?: string;
  previousHealth?: number;
} {
  // Check if injury should occur
  if (!shouldCauseInjury(player, context)) {
    return { injured: false };
  }

  // Select appropriate injury
  const selectedInjury = selectInjuryForFailure(context);
  if (!selectedInjury) {
    return { injured: false };
  }

  // Create active injury
  const activeInjury = createActiveInjury(selectedInjury, currentDate);

  // Apply to player
  const result = applyInjuryToPlayer(player, activeInjury);

  return {
    injured: result.applied,
    injury: activeInjury,
    message: result.message,
    previousHealth: result.previousHealth
  };
}