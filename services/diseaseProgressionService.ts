/**
 * services/diseaseProgressionService.ts - Calculate gameplay restrictions from disease state
 */
import { CharacterHealth, ActiveDisease, Disease } from '../types/diseaseTypes';
import { PlayerCharacter } from '../types';
import { generateDiseaseProgressionEvent, DiseaseProgressionEvent } from './diseaseNotificationService';

// Store previous stages for change detection
const previousStages = new Map<string, string>();

export interface DiseaseGameplayRestrictions {
  movementPenaltyMultiplier: number; // 1.0 = normal, 2.0 = 2x slower, 240.0 = 240x slower
  voiceLossLevel: number; // 0 = normal speech, 1 = weak voice, 2 = whispers only, 3 = no speech
  socialAvoidanceLevel: number; // 0 = normal, 1 = mild concern, 2 = obvious illness, 3 = severe/contagious
  isTerminal: boolean; // true if disease progression will lead to death soon
  symptomDescription: string; // Current visible symptoms for narration
  progressionStage: 'early' | 'moderate' | 'severe' | 'critical' | 'terminal';
  stageJustChanged: boolean; // True when stage changed this update
  stageNotificationEvent?: {
    title: string;
    description: string;
    icon: string;
  };
}

/**
 * Calculate overall gameplay restrictions from all active diseases
 */
export function calculateDiseaseGameplayRestrictions(
  diseaseHealth: CharacterHealth | undefined
): DiseaseGameplayRestrictions {
  if (!diseaseHealth || diseaseHealth.currentDiseases.length === 0) {
    return {
      movementPenaltyMultiplier: 1.0,
      voiceLossLevel: 0,
      socialAvoidanceLevel: 0,
      isTerminal: false,
      symptomDescription: ''
    };
  }

  let maxMovementPenalty = 1.0;
  let maxVoiceLoss = 0;
  let maxSocialAvoidance = 0;
  let isAnyTerminal = false;
  const symptoms: string[] = [];

  for (const activeDisease of diseaseHealth.currentDiseases) {
    const restrictions = calculateSingleDiseaseRestrictions(activeDisease);

    // Take the worst penalty from any disease
    maxMovementPenalty = Math.max(maxMovementPenalty, restrictions.movementPenaltyMultiplier);
    maxVoiceLoss = Math.max(maxVoiceLoss, restrictions.voiceLossLevel);
    maxSocialAvoidance = Math.max(maxSocialAvoidance, restrictions.socialAvoidanceLevel);

    if (restrictions.isTerminal) {
      isAnyTerminal = true;
    }

    if (restrictions.symptomDescription) {
      symptoms.push(restrictions.symptomDescription);
    }
  }

  // Determine overall progression stage
  let overallStage: 'early' | 'moderate' | 'severe' | 'critical' | 'terminal' = 'early';
  if (maxSocialAvoidance >= 3 || maxVoiceLoss >= 3 || isAnyTerminal) {
    overallStage = 'terminal';
  } else if (maxSocialAvoidance >= 2 || maxVoiceLoss >= 2) {
    overallStage = 'critical';
  } else if (maxSocialAvoidance >= 1 || maxVoiceLoss >= 1) {
    overallStage = 'severe';
  } else if (maxMovementPenalty > 1.0) {
    overallStage = 'moderate';
  }

  return {
    movementPenaltyMultiplier: maxMovementPenalty,
    voiceLossLevel: maxVoiceLoss,
    socialAvoidanceLevel: maxSocialAvoidance,
    isTerminal: isAnyTerminal,
    symptomDescription: symptoms.join(', '),
    progressionStage: overallStage,
    stageJustChanged: false // This will be calculated separately
  };
}

/**
 * Calculate restrictions for a single disease based on progression
 */
function calculateSingleDiseaseRestrictions(activeDisease: ActiveDisease): DiseaseGameplayRestrictions {
  const disease = activeDisease.disease;
  const daysSick = activeDisease.daysSinceContraction;
  const currentSeverity = activeDisease.severity;

  // Calculate progression stage
  let progressionSeverity = currentSeverity;
  if (disease.progressionStages) {
    // Find current stage based on days since contraction
    const currentStage = disease.progressionStages
      .filter(stage => daysSick >= stage.day)
      .pop(); // Get the latest applicable stage

    if (currentStage) {
      progressionSeverity = currentStage.severity;
    }
  }

  // Base restrictions from disease severity (0.0 to 1.0)
  const restrictions = calculateSeverityRestrictions(progressionSeverity);

  // Disease-specific modifications
  const diseaseSpecificRestrictions = calculateDiseaseSpecificRestrictions(disease, activeDisease);

  return {
    movementPenaltyMultiplier: Math.max(restrictions.movementPenaltyMultiplier, diseaseSpecificRestrictions.movementPenaltyMultiplier),
    voiceLossLevel: Math.max(restrictions.voiceLossLevel, diseaseSpecificRestrictions.voiceLossLevel),
    socialAvoidanceLevel: Math.max(restrictions.socialAvoidanceLevel, diseaseSpecificRestrictions.socialAvoidanceLevel),
    isTerminal: restrictions.isTerminal || diseaseSpecificRestrictions.isTerminal,
    symptomDescription: diseaseSpecificRestrictions.symptomDescription || getGenericSymptomDescription(progressionSeverity),
    progressionStage: restrictions.progressionStage,
    stageJustChanged: false
  };
}

/**
 * Calculate base restrictions from severity level
 * Movement restrictions now only kick in at terminal stage
 */
function calculateSeverityRestrictions(severity: number): DiseaseGameplayRestrictions {
  if (severity <= 0.3) {
    // Early illness (0-30% severity) - minimal impact
    return {
      movementPenaltyMultiplier: 1.0, // Normal movement
      voiceLossLevel: 0,
      socialAvoidanceLevel: 0,
      isTerminal: false,
      symptomDescription: '',
      progressionStage: 'early',
      stageJustChanged: false
    };
  } else if (severity <= 0.5) {
    // Moderate illness (30-50% severity) - some symptoms visible
    return {
      movementPenaltyMultiplier: 1.0, // Normal movement
      voiceLossLevel: 0,
      socialAvoidanceLevel: 1, // Mild concern
      isTerminal: false,
      symptomDescription: '',
      progressionStage: 'moderate',
      stageJustChanged: false
    };
  } else if (severity <= 0.7) {
    // Severe illness (50-70% severity) - obvious symptoms
    return {
      movementPenaltyMultiplier: 1.0, // Normal movement
      voiceLossLevel: 1, // Weak voice
      socialAvoidanceLevel: 2, // Obvious illness
      isTerminal: false,
      symptomDescription: '',
      progressionStage: 'severe',
      stageJustChanged: false
    };
  } else if (severity <= 0.85) {
    // Critical illness (70-85% severity) - severe symptoms, but still mobile
    return {
      movementPenaltyMultiplier: 1.0, // Normal movement
      voiceLossLevel: 2, // Whispers only
      socialAvoidanceLevel: 3, // Severe/contagious
      isTerminal: false,
      symptomDescription: '',
      progressionStage: 'critical',
      stageJustChanged: false
    };
  } else {
    // Terminal illness (85%+ severity) - movement now severely restricted
    return {
      movementPenaltyMultiplier: 60.0, // 60x slower (15 seconds per move)
      voiceLossLevel: 3, // No speech
      socialAvoidanceLevel: 3, // Severe/contagious
      isTerminal: true,
      symptomDescription: '',
      progressionStage: 'terminal',
      stageJustChanged: false
    };
  }
}

/**
 * Calculate disease-specific restrictions and symptoms
 */
function calculateDiseaseSpecificRestrictions(disease: Disease, activeDisease: ActiveDisease): DiseaseGameplayRestrictions {
  const diseaseId = disease.id.toLowerCase();
  const daysSick = activeDisease.daysSinceContraction;

  // Disease-specific voice loss (respiratory diseases)
  let voiceLossLevel = 0;
  if (['tuberculosis', 'consumption', 'bubonic_plague', 'pneumonic_plague', 'influenza', 'spanish_flu'].includes(diseaseId)) {
    if (activeDisease.severity > 0.3) voiceLossLevel = 1; // Weak voice
    if (activeDisease.severity > 0.6) voiceLossLevel = 2; // Whispers only
    if (activeDisease.severity > 0.8) voiceLossLevel = 3; // No speech
  }

  // Disease-specific movement penalties
  let movementPenalty = 1.0;
  if (['rabies'].includes(diseaseId)) {
    // Rabies: rapid deterioration
    if (daysSick >= 5) movementPenalty = 10.0;
    if (daysSick >= 6) movementPenalty = 60.0;
    if (daysSick >= 7) movementPenalty = Number.POSITIVE_INFINITY; // Complete paralysis
  }

  // High social avoidance for visibly contagious diseases
  let socialAvoidance = 0;
  if (['smallpox', 'bubonic_plague', 'leprosy', 'typhus'].includes(diseaseId)) {
    if (activeDisease.severity > 0.2) socialAvoidance = 2; // Obvious illness
    if (activeDisease.severity > 0.5) socialAvoidance = 3; // Severe/contagious
  }

  // Terminal conditions
  let isTerminal = false;
  if (['rabies'].includes(diseaseId) && daysSick >= 6) {
    isTerminal = true;
  }
  if (['bubonic_plague', 'pneumonic_plague'].includes(diseaseId) && activeDisease.severity > 0.8) {
    isTerminal = true;
  }

  // Disease-specific symptom descriptions
  const symptomDescription = getDiseaseSpecificSymptoms(diseaseId, activeDisease.severity, daysSick);

  return {
    movementPenaltyMultiplier: movementPenalty,
    voiceLossLevel,
    socialAvoidanceLevel: socialAvoidance,
    isTerminal,
    symptomDescription,
    progressionStage: 'early', // Will be overridden by base restrictions
    stageJustChanged: false
  };
}

/**
 * Get disease-specific symptom descriptions
 */
function getDiseaseSpecificSymptoms(diseaseId: string, severity: number, daysSick: number): string {
  switch (diseaseId) {
    case 'smallpox':
      if (severity > 0.6) return 'severe facial rash and pockmarks';
      if (severity > 0.3) return 'visible red rash spreading across face';
      return 'early red spots appearing on skin';

    case 'bubonic_plague':
      if (severity > 0.6) return 'grotesque swollen lymph nodes and blackened extremities';
      if (severity > 0.3) return 'painful swollen buboes';
      return 'swollen glands and fever';

    case 'tuberculosis':
    case 'consumption':
      if (severity > 0.6) return 'violent coughing fits with blood';
      if (severity > 0.3) return 'persistent harsh cough';
      return 'occasional dry cough';

    case 'rabies':
      if (daysSick >= 6) return 'frothing at mouth, violent convulsions';
      if (daysSick >= 4) return 'confusion and aggression';
      if (daysSick >= 2) return 'restlessness and anxiety';
      return 'fatigue and headache';

    case 'leprosy':
      if (severity > 0.5) return 'visible lesions and deformities';
      if (severity > 0.2) return 'pale patches of skin';
      return 'numbness in extremities';

    case 'cholera':
      if (severity > 0.5) return 'severe dehydration and sunken features';
      if (severity > 0.3) return 'frequent vomiting and diarrhea';
      return 'stomach cramps and nausea';

    default:
      return '';
  }
}

/**
 * Get generic symptom description based on severity
 */
function getGenericSymptomDescription(severity: number): string {
  if (severity > 0.8) return 'extremely ill and weakened';
  if (severity > 0.6) return 'visibly sick and struggling';
  if (severity > 0.4) return 'noticeably unwell';
  if (severity > 0.2) return 'slightly under the weather';
  return '';
}

/**
 * Check if player should die from disease progression
 */
export function shouldPlayerDieFromDisease(diseaseHealth: CharacterHealth | undefined): { shouldDie: boolean; cause?: ActiveDisease } {
  if (!diseaseHealth || diseaseHealth.currentDiseases.length === 0) {
    return { shouldDie: false };
  }

  for (const activeDisease of diseaseHealth.currentDiseases) {
    const restrictions = calculateSingleDiseaseRestrictions(activeDisease);

    // Check for terminal conditions
    if (restrictions.isTerminal) {
      // Random death check for terminal diseases
      const deathChance = Math.min(activeDisease.severity * 0.1, 0.05); // Up to 5% chance per check
      if (Math.random() < deathChance) {
        return { shouldDie: true, cause: activeDisease };
      }
    }

    // Immediate death for complete paralysis (rabies day 7+)
    if (restrictions.movementPenaltyMultiplier === Number.POSITIVE_INFINITY) {
      return { shouldDie: true, cause: activeDisease };
    }
  }

  return { shouldDie: false };
}

/**
 * Check for disease stage changes and return notification events
 */
export function checkDiseaseStageChanges(
  playerCharacterId: string,
  diseaseHealth: CharacterHealth | undefined
): DiseaseProgressionEvent[] {
  if (!diseaseHealth || diseaseHealth.currentDiseases.length === 0) {
    return [];
  }

  const events: DiseaseProgressionEvent[] = [];

  for (const activeDisease of diseaseHealth.currentDiseases) {
    const stageKey = `${playerCharacterId}_${activeDisease.disease.id}`;
    const restrictions = calculateSingleDiseaseRestrictions(activeDisease);
    const currentStage = restrictions.progressionStage;
    const previousStage = previousStages.get(stageKey);

    // Check if stage has progressed to a notification-worthy level
    if (shouldNotifyStageChange(previousStage, currentStage)) {
      const event = generateDiseaseProgressionEvent(
        activeDisease.disease,
        currentStage as 'moderate' | 'severe' | 'critical' | 'terminal',
        activeDisease.daysSinceContraction
      );
      events.push(event);
    }

    // Update stored stage
    previousStages.set(stageKey, currentStage);
  }

  return events;
}

/**
 * Determine if a stage change should trigger a notification
 */
function shouldNotifyStageChange(
  previousStage: string | undefined,
  currentStage: string
): boolean {
  // Always notify on first progression beyond early stage
  if (!previousStage && currentStage !== 'early') {
    return true;
  }

  // Notify on any progression to a more severe stage
  const stageOrder = ['early', 'moderate', 'severe', 'critical', 'terminal'];
  const prevIndex = previousStage ? stageOrder.indexOf(previousStage) : 0;
  const currIndex = stageOrder.indexOf(currentStage);

  return currIndex > prevIndex && currIndex > 0; // Don't notify for early stage
}