/**
 * services/diseaseNotificationService.ts - Generates disease progression notifications
 */
import { ActiveDisease, Disease } from '../types/diseaseTypes';
import { DiseaseGameplayRestrictions } from './diseaseProgressionService';

export interface DiseaseProgressionEvent {
  type: 'disease_progression';
  stage: 'moderate' | 'severe' | 'critical' | 'terminal';
  title: string;
  description: string;
  icon: string;
  diseaseId: string;
  diseaseName: string;
}

/**
 * Generate disease progression notification events
 */
export function generateDiseaseProgressionEvent(
  disease: Disease,
  newStage: 'moderate' | 'severe' | 'critical' | 'terminal',
  daysSick: number
): DiseaseProgressionEvent {
  const diseaseId = disease.id.toLowerCase();

  // Get disease-specific progression events
  const event = getDiseaseSpecificEvent(diseaseId, disease.name, newStage, daysSick);
  if (event) {
    return event;
  }

  // Fallback to generic progression events
  return getGenericProgressionEvent(disease.name, newStage);
}

/**
 * Get disease-specific progression events with historically accurate descriptions
 */
function getDiseaseSpecificEvent(
  diseaseId: string,
  diseaseName: string,
  stage: 'moderate' | 'severe' | 'critical' | 'terminal',
  daysSick: number
): DiseaseProgressionEvent | null {

  switch (diseaseId) {
    case 'smallpox':
      switch (stage) {
        case 'moderate':
          return {
            type: 'disease_progression',
            stage,
            title: 'Smallpox Progressing',
            description: 'Red spots are appearing on your skin. The fever is worsening, and you feel increasingly weak. The characteristic rash of smallpox is beginning to manifest.',
            icon: '🔴',
            diseaseId,
            diseaseName
          };
        case 'severe':
          return {
            type: 'disease_progression',
            stage,
            title: 'Smallpox Rash Spreading',
            description: 'The red rash is spreading across your face and body, becoming raised and painful. Your voice is becoming weaker. People may start to avoid you due to your visible symptoms.',
            icon: '🤒',
            diseaseId,
            diseaseName
          };
        case 'critical':
          return {
            type: 'disease_progression',
            stage,
            title: 'Severe Smallpox Symptoms',
            description: 'The pustules are now covering much of your face and body. Speaking has become difficult - only whispers escape your throat. Your appearance is alarming to others.',
            icon: '🚨',
            diseaseId,
            diseaseName
          };
        case 'terminal':
          return {
            type: 'disease_progression',
            stage,
            title: 'Critical Condition',
            description: 'Your body is failing. The pockmarks are severe, and you can barely speak. Each movement requires tremendous effort. Death may be near.',
            icon: '💀',
            diseaseId,
            diseaseName
          };
      }
      break;

    case 'bubonic_plague':
    case 'black_death':
      switch (stage) {
        case 'moderate':
          return {
            type: 'disease_progression',
            stage,
            title: 'The Plague Worsens',
            description: 'Painful swelling has appeared in your lymph nodes - the dreaded buboes. Fever and chills wrack your body. The Black Death is taking hold.',
            icon: '⚫',
            diseaseId,
            diseaseName
          };
        case 'severe':
          return {
            type: 'disease_progression',
            stage,
            title: 'Bubonic Plague Advancing',
            description: 'The buboes are now grotesquely swollen and painful. Your voice is weakening, and dark patches are appearing on your skin. Others flee at the sight of you.',
            icon: '🖤',
            diseaseId,
            diseaseName
          };
        case 'critical':
          return {
            type: 'disease_progression',
            stage,
            title: 'Plague Ravaging Your Body',
            description: 'Your extremities are turning black with gangrene. Speech is reduced to desperate whispers. The plague is consuming you from within.',
            icon: '☠️',
            diseaseId,
            diseaseName
          };
        case 'terminal':
          return {
            type: 'disease_progression',
            stage,
            title: 'Death Approaches',
            description: 'Your body is shutting down. Movement is becoming nearly impossible. The plague has run its terrible course. Prepare for the end.',
            icon: '💀',
            diseaseId,
            diseaseName
          };
      }
      break;

    case 'tuberculosis':
    case 'consumption':
      switch (stage) {
        case 'moderate':
          return {
            type: 'disease_progression',
            stage,
            title: 'Consumption Deepens',
            description: 'Your cough has become persistent and harsh. You\'re losing weight, and people notice you don\'t look well. The consumption is advancing.',
            icon: '🫁',
            diseaseId,
            diseaseName
          };
        case 'severe':
          return {
            type: 'disease_progression',
            stage,
            title: 'Coughing Blood',
            description: 'You\'ve begun coughing up blood - a terrible sign. Your voice is weak and raspy. Others worry about catching your disease.',
            icon: '🩸',
            diseaseId,
            diseaseName
          };
        case 'critical':
          return {
            type: 'disease_progression',
            stage,
            title: 'Violent Coughing Fits',
            description: 'Violent coughing fits leave you gasping and whispering. Blood stains your handkerchief. People actively avoid you now.',
            icon: '🤧',
            diseaseId,
            diseaseName
          };
        case 'terminal':
          return {
            type: 'disease_progression',
            stage,
            title: 'Consumption\'s Final Stage',
            description: 'Your lungs are failing. Each breath is a struggle, and movement is becoming impossible. The consumption has reached its final stage.',
            icon: '💀',
            diseaseId,
            diseaseName
          };
      }
      break;

    case 'cholera':
      switch (stage) {
        case 'moderate':
          return {
            type: 'disease_progression',
            stage,
            title: 'Cholera Symptoms Worsening',
            description: 'Severe stomach cramps and diarrhea are weakening you. You\'re losing fluids rapidly and starting to look gaunt.',
            icon: '🤢',
            diseaseId,
            diseaseName
          };
        case 'severe':
          return {
            type: 'disease_progression',
            stage,
            title: 'Severe Dehydration',
            description: 'Constant vomiting and diarrhea have left you severely dehydrated. Your voice is weak, and your sunken appearance frightens others.',
            icon: '💧',
            diseaseId,
            diseaseName
          };
        case 'critical':
          return {
            type: 'disease_progression',
            stage,
            title: 'Critical Dehydration',
            description: 'Your body is severely dehydrated. You can barely whisper, and your sunken, grayish appearance is alarming to behold.',
            icon: '🥀',
            diseaseId,
            diseaseName
          };
        case 'terminal':
          return {
            type: 'disease_progression',
            stage,
            title: 'Cholera\'s Final Assault',
            description: 'Your body has lost too much fluid. Movement is nearly impossible as your organs begin to shut down. Death is imminent.',
            icon: '💀',
            diseaseId,
            diseaseName
          };
      }
      break;

    case 'rabies':
      switch (stage) {
        case 'moderate':
          return {
            type: 'disease_progression',
            stage,
            title: 'Rabies Symptoms Beginning',
            description: 'Anxiety and restlessness plague you. Something feels terribly wrong, though others may not notice yet.',
            icon: '😰',
            diseaseId,
            diseaseName
          };
        case 'severe':
          return {
            type: 'disease_progression',
            stage,
            title: 'Rabies Affecting Behavior',
            description: 'Confusion and aggression are setting in. Your voice changes, and people are starting to notice your erratic behavior.',
            icon: '😡',
            diseaseId,
            diseaseName
          };
        case 'critical':
          return {
            type: 'disease_progression',
            stage,
            title: 'Rabies Hydrophobia',
            description: 'Fear of water and violent spasms wrack your body. Speaking becomes nearly impossible. People flee from your terrifying condition.',
            icon: '🐺',
            diseaseId,
            diseaseName
          };
        case 'terminal':
          return {
            type: 'disease_progression',
            stage,
            title: 'Rabies Final Stage',
            description: 'Violent convulsions and frothing at the mouth. Your body is shutting down, and movement is becoming impossible. Death is hours away.',
            icon: '💀',
            diseaseId,
            diseaseName
          };
      }
      break;
  }

  return null;
}

/**
 * Generate generic progression events for diseases without specific descriptions
 */
function getGenericProgressionEvent(
  diseaseName: string,
  stage: 'moderate' | 'severe' | 'critical' | 'terminal'
): DiseaseProgressionEvent {
  switch (stage) {
    case 'moderate':
      return {
        type: 'disease_progression',
        stage,
        title: `${diseaseName} Worsening`,
        description: `Your ${diseaseName.toLowerCase()} is getting worse. You don't feel well, and others may start to notice your condition.`,
        icon: '🤒',
        diseaseId: diseaseName.toLowerCase().replace(/\s+/g, '_'),
        diseaseName
      };
    case 'severe':
      return {
        type: 'disease_progression',
        stage,
        title: `${diseaseName} Progressing`,
        description: `The ${diseaseName.toLowerCase()} is clearly affecting you now. Your voice is weakening, and your symptoms are becoming obvious to others.`,
        icon: '😷',
        diseaseId: diseaseName.toLowerCase().replace(/\s+/g, '_'),
        diseaseName
      };
    case 'critical':
      return {
        type: 'disease_progression',
        stage,
        title: `Severe ${diseaseName}`,
        description: `The ${diseaseName.toLowerCase()} has progressed to a critical stage. You can barely speak above a whisper, and people actively avoid you.`,
        icon: '🚨',
        diseaseId: diseaseName.toLowerCase().replace(/\s+/g, '_'),
        diseaseName
      };
    case 'terminal':
      return {
        type: 'disease_progression',
        stage,
        title: `Critical Condition`,
        description: `Your body is failing from ${diseaseName.toLowerCase()}. Movement has become extremely difficult. Death may be approaching.`,
        icon: '💀',
        diseaseId: diseaseName.toLowerCase().replace(/\s+/g, '_'),
        diseaseName
      };
  }
}