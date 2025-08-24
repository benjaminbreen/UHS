/**
 * constants/gameData/diseases.ts - Comprehensive historically accurate disease database
 */

import { Disease, DiseasePrevalence, Medicine, ColumbianExchangeRestrictions } from '../../types/diseaseTypes';

// Columbian Exchange restrictions - critical for historical accuracy
export const COLUMBIAN_EXCHANGE_RESTRICTIONS: ColumbianExchangeRestrictions = {
  preContactNewWorld: [
    'SMALLPOX', 'MEASLES', 'TYPHUS', 'BUBONIC_PLAGUE', 'CHOLERA', 
    'MALARIA', 'YELLOW_FEVER', 'INFLUENZA', 'TUBERCULOSIS', 'LEPROSY',
    'SYPHILIS' // Note: There's debate, but evidence suggests syphilis existed in Americas pre-contact
  ],
  preContactOldWorld: [
    'CHAGAS_DISEASE' // Primary New World disease that didn't exist in Old World
  ],
  exchangeYear: 1492
};

// Core disease definitions with historical accuracy
export const DISEASES: Disease[] = [
  // RESPIRATORY DISEASES
  {
    id: 'COMMON_COLD',
    name: 'Common Cold',
    type: 'respiratory',
    severity: 'mild',
    availableEras: ['PREHISTORIC', 'ANCIENT', 'MEDIEVAL', 'EARLY_MODERN', 'INDUSTRIAL', 'MODERN'],
    availableRegions: ['EUROPEAN', 'EAST_ASIAN', 'MENA', 'NORTH_AMERICAN_PRE_COLUMBIAN', 'NORTH_AMERICAN_COLONIAL', 'OCEANIA', 'SOUTH_ASIAN', 'SOUTH_AMERICAN', 'SUB_SAHARAN_AFRICAN'],
    transmissionVector: 'airborne',
    baseTransmissionRate: 0.15,
    proximityMultiplier: 2.0,
    directContactMultiplier: 3.0,
    symptoms: [
      { id: 'SNEEZING', name: 'Sneezing', description: 'Frequent sneezing fits', severity: 0.2 },
      { id: 'RUNNY_NOSE', name: 'Runny Nose', description: 'Nasal congestion and discharge', severity: 0.1 },
      { id: 'MILD_FATIGUE', name: 'Mild Fatigue', description: 'Feeling slightly tired', severity: 0.3 }
    ],
    incubationDays: 2,
    durationDays: 7,
    mortalityRate: 0.0,
    statEffects: {
      health: -5,
      fatigue: 10,
      strength: -2,
      intelligence: -1,
      charisma: -3,
      speed: -1
    },
    recoveryChance: 0.8,
    grantsImmunity: false,
    immunityDuration: 0,
    narrativeHints: {
      npcSymptoms: ['is sniffling constantly', 'keeps wiping their nose', 'has watery eyes'],
      animalSymptoms: ['is breathing heavily through its nose', 'seems to have difficulty breathing'],
      playerSymptoms: ['Your nose feels stuffy', 'You feel the urge to sneeze', 'Your head feels slightly cloudy']
    },
    badgeIcon: '🤧',
    outlineColor: '#FFF8DC'
  },

  {
    id: 'INFLUENZA',
    name: 'Influenza',
    type: 'respiratory',
    severity: 'moderate',
    availableEras: ['ANCIENT', 'MEDIEVAL', 'EARLY_MODERN', 'INDUSTRIAL', 'MODERN'],
    availableRegions: ['EUROPEAN', 'EAST_ASIAN', 'MENA', 'NORTH_AMERICAN_PRE_COLUMBIAN', 'NORTH_AMERICAN_COLONIAL', 'OCEANIA', 'SOUTH_ASIAN', 'SOUTH_AMERICAN', 'SUB_SAHARAN_AFRICAN'],
    transmissionVector: 'airborne',
    baseTransmissionRate: 0.25,
    proximityMultiplier: 2.5,
    directContactMultiplier: 4.0,
    symptoms: [
      { id: 'HIGH_FEVER', name: 'High Fever', description: 'Body temperature significantly elevated', severity: 0.7 },
      { id: 'SEVERE_COUGH', name: 'Severe Cough', description: 'Persistent, painful coughing', severity: 0.6 },
      { id: 'BODY_ACHES', name: 'Body Aches', description: 'Widespread muscle and joint pain', severity: 0.5 },
      { id: 'WEAKNESS', name: 'Weakness', description: 'Severe fatigue and weakness', severity: 0.8 }
    ],
    incubationDays: 3,
    durationDays: 10,
    mortalityRate: 0.05,
    statEffects: {
      health: -15,
      fatigue: 25,
      strength: -8,
      intelligence: -5,
      charisma: -6,
      speed: -10
    },
    recoveryChance: 0.6,
    grantsImmunity: true,
    immunityDuration: 365,
    narrativeHints: {
      npcSymptoms: ['is coughing violently', 'looks feverish and pale', 'is shivering despite the weather', 'moves slowly and appears weak'],
      animalSymptoms: ['is breathing rapidly and shallowly', 'appears lethargic and unresponsive', 'has discharge from nose and eyes'],
      playerSymptoms: ['You feel burning hot, then suddenly cold', 'Your body aches terribly', 'Each breath feels labored', 'You feel utterly exhausted']
    },
    badgeIcon: '🤒',
    outlineColor: '#FFE4B5'
  },

  {
    id: 'SPANISH_FLU',
    name: 'Spanish Influenza',
    type: 'respiratory',
    severity: 'critical',
    availableEras: ['MODERN'],
    availableRegions: ['EUROPEAN', 'EAST_ASIAN', 'MENA', 'NORTH_AMERICAN_COLONIAL', 'OCEANIA', 'SOUTH_ASIAN', 'SOUTH_AMERICAN', 'SUB_SAHARAN_AFRICAN'],
    startYear: 1918,
    endYear: 1920,
    transmissionVector: 'airborne',
    baseTransmissionRate: 0.45,
    proximityMultiplier: 3.0,
    directContactMultiplier: 5.0,
    symptoms: [
      { id: 'EXTREME_FEVER', name: 'Extreme Fever', description: 'Dangerously high body temperature', severity: 0.9 },
      { id: 'HEMORRHAGIC_COUGH', name: 'Hemorrhagic Cough', description: 'Coughing up blood', severity: 0.8 },
      { id: 'CYANOSIS', name: 'Cyanosis', description: 'Blue discoloration of skin', severity: 0.9 }
    ],
    incubationDays: 2,
    durationDays: 14,
    mortalityRate: 0.25,
    statEffects: {
      health: -30,
      fatigue: 40,
      strength: -15,
      intelligence: -10,
      charisma: -15,
      speed: -20
    },
    recoveryChance: 0.3,
    grantsImmunity: true,
    immunityDuration: -1,
    narrativeHints: {
      npcSymptoms: ['is gasping for breath', 'has an alarming blue tinge to their skin', 'is coughing up blood', 'appears to be dying'],
      animalSymptoms: ['is struggling to breathe', 'has bloody discharge from mouth', 'appears to be in severe distress'],
      playerSymptoms: ['You can barely breathe', 'You taste blood in your mouth', 'Your skin feels cold and looks wrong', 'You fear you may be dying']
    },
    badgeIcon: '💀',
    outlineColor: '#8B0000'
  },

  {
    id: 'TUBERCULOSIS',
    name: 'Tuberculosis',
    type: 'respiratory',
    severity: 'severe',
    availableEras: ['ANCIENT', 'MEDIEVAL', 'EARLY_MODERN', 'INDUSTRIAL', 'MODERN'],
    availableRegions: ['EUROPEAN', 'EAST_ASIAN', 'MENA', 'NORTH_AMERICAN_COLONIAL', 'OCEANIA', 'SOUTH_ASIAN', 'SOUTH_AMERICAN', 'SUB_SAHARAN_AFRICAN'],
    transmissionVector: 'airborne',
    baseTransmissionRate: 0.12,
    proximityMultiplier: 4.0,
    directContactMultiplier: 6.0,
    symptoms: [
      { id: 'CHRONIC_COUGH', name: 'Chronic Cough', description: 'Persistent cough lasting weeks', severity: 0.6 },
      { id: 'NIGHT_SWEATS', name: 'Night Sweats', description: 'Profuse sweating during sleep', severity: 0.4 },
      { id: 'WEIGHT_LOSS', name: 'Weight Loss', description: 'Gradual wasting away', severity: 0.7 },
      { id: 'BLOODY_SPUTUM', name: 'Bloody Sputum', description: 'Coughing up blood', severity: 0.8 }
    ],
    incubationDays: 30,
    durationDays: 180,
    mortalityRate: 0.4,
    statEffects: {
      health: -20,
      fatigue: 30,
      strength: -12,
      intelligence: -3,
      charisma: -8,
      speed: -8
    },
    recoveryChance: 0.2,
    grantsImmunity: false,
    immunityDuration: 0,
    narrativeHints: {
      npcSymptoms: ['has a persistent, hacking cough', 'looks gaunt and wasted', 'occasionally coughs up blood', 'appears consumptive'],
      animalSymptoms: ['has been coughing for weeks', 'looks thin and weak', 'has difficulty breathing'],
      playerSymptoms: ['You have developed a persistent cough', 'You wake up drenched in sweat', 'You notice blood in your sputum', 'You feel yourself growing weaker']
    },
    badgeIcon: '🫁',
    outlineColor: '#CD853F'
  },

  // GASTROINTESTINAL DISEASES
  {
    id: 'DYSENTERY',
    name: 'Dysentery',
    type: 'gastrointestinal',
    severity: 'moderate',
    availableEras: ['PREHISTORIC', 'ANCIENT', 'MEDIEVAL', 'EARLY_MODERN', 'INDUSTRIAL', 'MODERN'],
    availableRegions: ['EUROPEAN', 'EAST_ASIAN', 'MENA', 'NORTH_AMERICAN_PRE_COLUMBIAN', 'NORTH_AMERICAN_COLONIAL', 'OCEANIA', 'SOUTH_ASIAN', 'SOUTH_AMERICAN', 'SUB_SAHARAN_AFRICAN'],
    transmissionVector: 'waterborne',
    baseTransmissionRate: 0.3,
    proximityMultiplier: 1.2,
    directContactMultiplier: 2.0,
    symptoms: [
      { id: 'BLOODY_DIARRHEA', name: 'Bloody Diarrhea', description: 'Frequent, bloody bowel movements', severity: 0.7 },
      { id: 'SEVERE_CRAMPING', name: 'Severe Cramping', description: 'Intense abdominal pain', severity: 0.6 },
      { id: 'DEHYDRATION', name: 'Dehydration', description: 'Dangerous loss of body fluids', severity: 0.8 }
    ],
    incubationDays: 3,
    durationDays: 14,
    mortalityRate: 0.15,
    statEffects: {
      health: -18,
      fatigue: 20,
      strength: -10,
      intelligence: -4,
      charisma: -12,
      speed: -15
    },
    recoveryChance: 0.5,
    grantsImmunity: false,
    immunityDuration: 0,
    narrativeHints: {
      npcSymptoms: ['looks pale and dehydrated', 'clutches their stomach in pain', 'appears weak and unsteady', 'has a sickly odor about them'],
      animalSymptoms: ['appears weak and dehydrated', 'has visible digestive distress', 'moves sluggishly'],
      playerSymptoms: ['Your stomach cramps violently', 'You feel dangerously dehydrated', 'You are in constant digestive distress', 'You feel weak from fluid loss']
    },
    badgeIcon: '🤢',
    outlineColor: '#98FB98'
  },

  {
    id: 'CHOLERA',
    name: 'Cholera',
    type: 'gastrointestinal',
    severity: 'critical',
    availableEras: ['MEDIEVAL', 'EARLY_MODERN', 'INDUSTRIAL', 'MODERN'],
    availableRegions: ['EUROPEAN', 'EAST_ASIAN', 'MENA', 'NORTH_AMERICAN_COLONIAL', 'OCEANIA', 'SOUTH_ASIAN', 'SOUTH_AMERICAN', 'SUB_SAHARAN_AFRICAN'],
    transmissionVector: 'waterborne',
    baseTransmissionRate: 0.4,
    proximityMultiplier: 1.5,
    directContactMultiplier: 3.0,
    symptoms: [
      { id: 'RICE_WATER_STOOL', name: 'Rice-Water Stool', description: 'Characteristic watery diarrhea', severity: 0.9 },
      { id: 'SEVERE_DEHYDRATION', name: 'Severe Dehydration', description: 'Life-threatening fluid loss', severity: 0.9 },
      { id: 'MUSCLE_CRAMPS', name: 'Muscle Cramps', description: 'Painful cramping from electrolyte loss', severity: 0.6 }
    ],
    incubationDays: 2,
    durationDays: 7,
    mortalityRate: 0.6,
    statEffects: {
      health: -25,
      fatigue: 35,
      strength: -15,
      intelligence: -8,
      charisma: -15,
      speed: -20
    },
    recoveryChance: 0.25,
    grantsImmunity: true,
    immunityDuration: 1825, // 5 years
    narrativeHints: {
      npcSymptoms: ['is severely dehydrated', 'has sunken eyes and cheeks', 'appears to be dying from fluid loss', 'has the characteristic cholera stool'],
      animalSymptoms: ['appears severely dehydrated', 'has sunken features', 'is in obvious distress'],
      playerSymptoms: ['You are losing massive amounts of fluid', 'Your skin feels loose and dry', 'You feel like you are dying of thirst', 'Your muscles cramp painfully']
    },
    badgeIcon: '💧',
    outlineColor: '#4169E1'
  },

  // VECTOR-BORNE DISEASES
  {
    id: 'MALARIA',
    name: 'Malaria',
    type: 'vector_borne',
    severity: 'severe',
    availableEras: ['PREHISTORIC', 'ANCIENT', 'MEDIEVAL', 'EARLY_MODERN', 'INDUSTRIAL', 'MODERN'],
    availableRegions: ['MENA', 'SOUTH_ASIAN', 'SOUTH_AMERICAN', 'SUB_SAHARAN_AFRICAN', 'OCEANIA'],
    transmissionVector: 'vector',
    baseTransmissionRate: 0.2,
    proximityMultiplier: 1.0,
    directContactMultiplier: 1.0,
    symptoms: [
      { id: 'PERIODIC_FEVER', name: 'Periodic Fever', description: 'Cyclical high fevers', severity: 0.7 },
      { id: 'CHILLS', name: 'Chills', description: 'Severe shivering and cold sensations', severity: 0.6 },
      { id: 'ANEMIA', name: 'Anemia', description: 'Weakness from blood cell destruction', severity: 0.5 }
    ],
    incubationDays: 14,
    durationDays: 60,
    mortalityRate: 0.2,
    statEffects: {
      health: -20,
      fatigue: 25,
      strength: -10,
      intelligence: -5,
      charisma: -5,
      speed: -8
    },
    recoveryChance: 0.4,
    grantsImmunity: false,
    immunityDuration: 0,
    narrativeHints: {
      npcSymptoms: ['alternates between burning fever and violent chills', 'looks pale and anemic', 'appears to have the ague'],
      animalSymptoms: ['appears feverish', 'shows signs of weakness', 'has periodic episodes of distress'],
      playerSymptoms: ['You burn with fever, then shiver uncontrollably', 'You feel your strength ebbing away', 'The fever comes in waves']
    },
    badgeIcon: '🦟',
    outlineColor: '#228B22'
  },

  {
    id: 'BUBONIC_PLAGUE',
    name: 'Bubonic Plague',
    type: 'vector_borne',
    severity: 'critical',
    availableEras: ['ANCIENT', 'MEDIEVAL', 'EARLY_MODERN', 'INDUSTRIAL', 'MODERN'],
    availableRegions: ['EUROPEAN', 'EAST_ASIAN', 'MENA', 'SOUTH_ASIAN', 'SUB_SAHARAN_AFRICAN'],
    transmissionVector: 'vector',
    baseTransmissionRate: 0.3,
    proximityMultiplier: 2.0,
    directContactMultiplier: 4.0,
    symptoms: [
      { id: 'BUBOES', name: 'Buboes', description: 'Swollen, painful lymph nodes', severity: 0.8 },
      { id: 'BLACK_DEATH_FEVER', name: 'High Fever', description: 'Extreme fever and delirium', severity: 0.9 },
      { id: 'GANGRENE', name: 'Gangrene', description: 'Blackening of extremities', severity: 0.9 }
    ],
    incubationDays: 5,
    durationDays: 10,
    mortalityRate: 0.7,
    statEffects: {
      health: -30,
      fatigue: 40,
      strength: -20,
      intelligence: -15,
      charisma: -20,
      speed: -25
    },
    recoveryChance: 0.15,
    grantsImmunity: true,
    immunityDuration: -1,
    narrativeHints: {
      npcSymptoms: ['has grotesque swellings in their neck and armpits', 'is delirious with fever', 'has blackened fingers', 'appears to be dying of the plague'],
      animalSymptoms: ['has visible swellings', 'appears extremely ill', 'shows signs of the plague'],
      playerSymptoms: ['Painful swellings have appeared in your groin and armpits', 'You burn with fever and barely know where you are', 'Your extremities are turning black', 'You feel death approaching']
    },
    badgeIcon: '☠️',
    outlineColor: '#000000'
  },

  // CONTACT DISEASES
  {
    id: 'SMALLPOX',
    name: 'Smallpox',
    type: 'contact',
    severity: 'critical',
    availableEras: ['ANCIENT', 'MEDIEVAL', 'EARLY_MODERN', 'INDUSTRIAL', 'MODERN'],
    availableRegions: ['EUROPEAN', 'EAST_ASIAN', 'MENA', 'SOUTH_ASIAN', 'SUB_SAHARAN_AFRICAN'],
    endYear: 1980, // Eradicated globally
    transmissionVector: 'contact',
    baseTransmissionRate: 0.35,
    proximityMultiplier: 3.0,
    directContactMultiplier: 5.0,
    symptoms: [
      { id: 'POX_RASH', name: 'Pox Rash', description: 'Characteristic pustular rash', severity: 0.8 },
      { id: 'SMALLPOX_FEVER', name: 'High Fever', description: 'Severe fever and malaise', severity: 0.7 },
      { id: 'SCARRING', name: 'Scarring', description: 'Permanent facial scarring', severity: 0.6 }
    ],
    incubationDays: 12,
    durationDays: 21,
    mortalityRate: 0.3,
    statEffects: {
      health: -25,
      fatigue: 30,
      strength: -12,
      intelligence: -8,
      charisma: -15,
      speed: -10
    },
    recoveryChance: 0.4,
    grantsImmunity: true,
    immunityDuration: -1,
    narrativeHints: {
      npcSymptoms: ['is covered in pustular sores', 'has characteristic smallpox lesions', 'bears the scars of surviving smallpox', 'looks severely ill with fever'],
      animalSymptoms: ['has visible skin lesions', 'appears to have contracted pox', 'shows signs of skin disease'],
      playerSymptoms: ['Painful sores are erupting all over your body', 'You burn with fever', 'Your face is becoming unrecognizable', 'You fear permanent disfigurement']
    },
    badgeIcon: '🔴',
    outlineColor: '#DC143C'
  },

  {
    id: 'SYPHILIS',
    name: 'Syphilis',
    type: 'contact',
    severity: 'severe',
    availableEras: ['EARLY_MODERN', 'INDUSTRIAL', 'MODERN'],
    availableRegions: ['EUROPEAN', 'EAST_ASIAN', 'MENA', 'NORTH_AMERICAN_COLONIAL', 'OCEANIA', 'SOUTH_ASIAN', 'SOUTH_AMERICAN', 'SUB_SAHARAN_AFRICAN'],
    startYear: 1493, // Post-Columbian Exchange
    transmissionVector: 'contact',
    baseTransmissionRate: 0.15,
    proximityMultiplier: 1.0,
    directContactMultiplier: 8.0,
    symptoms: [
      { id: 'CHANCRE', name: 'Chancre', description: 'Painless genital ulcer', severity: 0.4 },
      { id: 'SECONDARY_RASH', name: 'Secondary Rash', description: 'Widespread skin rash', severity: 0.5 },
      { id: 'NEUROLOGICAL_DAMAGE', name: 'Neurological Damage', description: 'Brain and nerve damage', severity: 0.9 }
    ],
    incubationDays: 21,
    durationDays: 1095, // 3 years progressive disease
    mortalityRate: 0.3,
    statEffects: {
      health: -15,
      fatigue: 15,
      strength: -5,
      intelligence: -10,
      charisma: -12,
      speed: -3
    },
    recoveryChance: 0.1,
    grantsImmunity: false,
    immunityDuration: 0,
    narrativeHints: {
      npcSymptoms: ['has suspicious sores', 'shows signs of the French disease', 'appears to be suffering from the great pox', 'has neurological symptoms'],
      animalSymptoms: ['shows signs of contact disease', 'has visible lesions'],
      playerSymptoms: ['You have developed concerning sores', 'You notice a spreading rash', 'Your mind feels clouded', 'You fear you have contracted a shameful disease']
    },
    badgeIcon: '🌹',
    outlineColor: '#FF69B4'
  },

  // PARASITIC INFECTIONS
  {
    id: 'INTESTINAL_WORMS',
    name: 'Intestinal Worms',
    type: 'parasitic',
    severity: 'mild',
    availableEras: ['PREHISTORIC', 'ANCIENT', 'MEDIEVAL', 'EARLY_MODERN', 'INDUSTRIAL', 'MODERN'],
    availableRegions: ['EUROPEAN', 'EAST_ASIAN', 'MENA', 'NORTH_AMERICAN_PRE_COLUMBIAN', 'NORTH_AMERICAN_COLONIAL', 'OCEANIA', 'SOUTH_ASIAN', 'SOUTH_AMERICAN', 'SUB_SAHARAN_AFRICAN'],
    transmissionVector: 'waterborne',
    baseTransmissionRate: 0.2,
    proximityMultiplier: 1.0,
    directContactMultiplier: 1.5,
    symptoms: [
      { id: 'DIGESTIVE_DISCOMFORT', name: 'Digestive Discomfort', description: 'Chronic stomach upset', severity: 0.3 },
      { id: 'MALNUTRITION', name: 'Malnutrition', description: 'Poor nutrient absorption', severity: 0.5 },
      { id: 'VISIBLE_WORMS', name: 'Visible Worms', description: 'Worms in stool', severity: 0.4 }
    ],
    incubationDays: 14,
    durationDays: 90,
    mortalityRate: 0.02,
    statEffects: {
      health: -8,
      fatigue: 12,
      strength: -6,
      intelligence: -2,
      charisma: -4,
      speed: -2
    },
    recoveryChance: 0.3,
    grantsImmunity: false,
    immunityDuration: 0,
    narrativeHints: {
      npcSymptoms: ['looks malnourished despite eating', 'has chronic digestive issues', 'appears to have worms'],
      animalSymptoms: ['appears malnourished', 'has visible signs of parasites', 'shows poor condition despite feeding'],
      playerSymptoms: ['Your stomach feels constantly unsettled', 'You feel hungry even after eating', 'You notice disturbing things in your waste', 'You feel generally unwell']
    },
    badgeIcon: '🪱',
    outlineColor: '#DEB887'
  },

  // ZOONOTIC DISEASES
  {
    id: 'RABIES',
    name: 'Rabies',
    type: 'zoonotic',
    severity: 'critical',
    availableEras: ['PREHISTORIC', 'ANCIENT', 'MEDIEVAL', 'EARLY_MODERN', 'INDUSTRIAL', 'MODERN'],
    availableRegions: ['EUROPEAN', 'EAST_ASIAN', 'MENA', 'NORTH_AMERICAN_PRE_COLUMBIAN', 'NORTH_AMERICAN_COLONIAL', 'OCEANIA', 'SOUTH_ASIAN', 'SOUTH_AMERICAN', 'SUB_SAHARAN_AFRICAN'],
    transmissionVector: 'zoonotic',
    baseTransmissionRate: 0.8, // Very high if bitten by rabid animal
    proximityMultiplier: 1.0,
    directContactMultiplier: 1.0,
    symptoms: [
      { id: 'HYDROPHOBIA', name: 'Hydrophobia', description: 'Fear of water', severity: 0.8 },
      { id: 'AGGRESSION', name: 'Aggression', description: 'Violent, erratic behavior', severity: 0.9 },
      { id: 'DELIRIUM', name: 'Delirium', description: 'Mental confusion and hallucinations', severity: 0.9 }
    ],
    incubationDays: 60,
    durationDays: 7,
    mortalityRate: 0.99,
    statEffects: {
      health: -40,
      fatigue: 20,
      strength: 5, // Rage strength
      intelligence: -20,
      charisma: -25,
      speed: -5
    },
    recoveryChance: 0.01,
    grantsImmunity: false,
    immunityDuration: 0,
    progressionStages: [
      {
        day: 1,
        symptoms: ['mild fever', 'tingling at bite site'],
        severity: 0.2,
        statModifiers: { health: -5, fatigue: 5 }
      },
      {
        day: 3,
        symptoms: ['anxiety', 'confusion', 'hallucinations'],
        severity: 0.5,
        statModifiers: { health: -15, intelligence: -10, charisma: -10 }
      },
      {
        day: 5,
        symptoms: ['hydrophobia', 'excessive salivation', 'violent spasms'],
        severity: 0.8,
        statModifiers: { health: -30, strength: 5, intelligence: -20 }
      },
      {
        day: 7,
        symptoms: ['paralysis', 'coma', 'respiratory failure'],
        severity: 1.0,
        statModifiers: { health: -50, fatigue: 40 }
      }
    ],
    narrativeHints: {
      npcSymptoms: ['foams at the mouth', 'shows extreme fear of water', 'displays violent, erratic behavior', 'appears to be in the final stages of rabies'],
      animalSymptoms: ['foams at the mouth', 'behaves aggressively and erratically', 'appears rabid', 'shows no fear of humans'],
      playerSymptoms: ['You feel an inexplicable terror of water', 'Rage fills your mind', 'You feel yourself losing control', 'You know you are dying']
    },
    badgeIcon: '🐺',
    outlineColor: '#800080'
  },

  // NUTRITIONAL DEFICIENCY DISEASES
  {
    id: 'SCURVY',
    name: 'Scurvy',
    type: 'nutritional',
    severity: 'moderate',
    availableEras: ['MEDIEVAL', 'EARLY_MODERN', 'INDUSTRIAL'],
    availableRegions: ['EUROPEAN', 'NORTH_AMERICAN_COLONIAL'],
    transmissionVector: 'nutritional',
    baseTransmissionRate: 0.0, // Not contagious
    proximityMultiplier: 1.0,
    directContactMultiplier: 1.0,
    symptoms: [
      { id: 'BLEEDING_GUMS', name: 'Bleeding Gums', description: 'Gums bleed easily and teeth loosen', severity: 0.5 },
      { id: 'JOINT_PAIN', name: 'Joint Pain', description: 'Severe pain in joints and muscles', severity: 0.6 },
      { id: 'SKIN_LESIONS', name: 'Skin Lesions', description: 'Purple spots and wounds that won\'t heal', severity: 0.7 }
    ],
    incubationDays: 60,
    durationDays: 90,
    mortalityRate: 0.3,
    statEffects: {
      health: -15,
      fatigue: 20,
      strength: -10,
      intelligence: -3,
      charisma: -8,
      speed: -5
    },
    recoveryChance: 0.9, // High recovery with proper diet
    grantsImmunity: false,
    immunityDuration: 0,
    progressionStages: [
      {
        day: 30,
        symptoms: ['fatigue', 'irritability'],
        severity: 0.2,
        statModifiers: { fatigue: 10, charisma: -3 }
      },
      {
        day: 60,
        symptoms: ['bleeding gums', 'joint pain'],
        severity: 0.5,
        statModifiers: { health: -10, strength: -5 }
      },
      {
        day: 80,
        symptoms: ['teeth falling out', 'old wounds reopening'],
        severity: 0.8,
        statModifiers: { health: -20, charisma: -10 }
      }
    ],
    narrativeHints: {
      npcSymptoms: ['has bleeding gums', 'winces with each step', 'has purple spots on their skin', 'looks malnourished'],
      animalSymptoms: ['moves stiffly', 'has patchy fur', 'appears weak'],
      playerSymptoms: ['Your gums bleed when you eat', 'Your joints ache terribly', 'Old scars begin to reopen']
    },
    badgeIcon: '🍊',
    outlineColor: '#FFA500'
  },

  {
    id: 'TYPHOID',
    name: 'Typhoid Fever',
    type: 'gastrointestinal',
    severity: 'severe',
    availableEras: ['ANCIENT', 'MEDIEVAL', 'EARLY_MODERN', 'INDUSTRIAL', 'MODERN'],
    availableRegions: ['EUROPEAN', 'EAST_ASIAN', 'MENA', 'NORTH_AMERICAN_COLONIAL', 'SOUTH_ASIAN', 'SOUTH_AMERICAN', 'SUB_SAHARAN_AFRICAN'],
    transmissionVector: 'waterborne',
    baseTransmissionRate: 0.25,
    proximityMultiplier: 1.5,
    directContactMultiplier: 3.0,
    symptoms: [
      { id: 'SUSTAINED_FEVER', name: 'Sustained Fever', description: 'Continuous high fever', severity: 0.7 },
      { id: 'ROSE_SPOTS', name: 'Rose Spots', description: 'Characteristic rash on trunk', severity: 0.4 },
      { id: 'DELIRIUM', name: 'Delirium', description: 'Mental confusion and hallucinations', severity: 0.8 }
    ],
    incubationDays: 14,
    durationDays: 28,
    mortalityRate: 0.25,
    statEffects: {
      health: -20,
      fatigue: 30,
      strength: -12,
      intelligence: -8,
      charisma: -6,
      speed: -10
    },
    recoveryChance: 0.5,
    grantsImmunity: true,
    immunityDuration: 1095, // 3 years
    progressionStages: [
      {
        day: 7,
        symptoms: ['headache', 'muscle aches', 'malaise'],
        severity: 0.3,
        statModifiers: { health: -5, fatigue: 10 }
      },
      {
        day: 14,
        symptoms: ['sustained fever', 'rose spots appear'],
        severity: 0.6,
        statModifiers: { health: -15, intelligence: -5 }
      },
      {
        day: 21,
        symptoms: ['delirium', 'intestinal perforation risk'],
        severity: 0.9,
        statModifiers: { health: -25, intelligence: -10 }
      }
    ],
    narrativeHints: {
      npcSymptoms: ['has a sustained fever', 'shows rose-colored spots on their chest', 'mutters deliriously', 'appears gravely ill'],
      animalSymptoms: ['appears feverish', 'has diarrhea', 'is lethargic'],
      playerSymptoms: ['You burn with unrelenting fever', 'Strange spots appear on your chest', 'Your mind wanders in delirium']
    },
    badgeIcon: '🌹',
    outlineColor: '#FF1493'
  },

  {
    id: 'SCARLET_FEVER',
    name: 'Scarlet Fever',
    type: 'respiratory',
    severity: 'moderate',
    availableEras: ['MEDIEVAL', 'EARLY_MODERN', 'INDUSTRIAL', 'MODERN'],
    availableRegions: ['EUROPEAN', 'NORTH_AMERICAN_COLONIAL'],
    transmissionVector: 'airborne',
    baseTransmissionRate: 0.3,
    proximityMultiplier: 2.5,
    directContactMultiplier: 4.0,
    symptoms: [
      { id: 'SCARLET_RASH', name: 'Scarlet Rash', description: 'Bright red sandpaper-like rash', severity: 0.5 },
      { id: 'STRAWBERRY_TONGUE', name: 'Strawberry Tongue', description: 'Red, bumpy tongue', severity: 0.3 },
      { id: 'HIGH_FEVER', name: 'High Fever', description: 'Sudden high fever', severity: 0.6 }
    ],
    incubationDays: 3,
    durationDays: 10,
    mortalityRate: 0.1,
    statEffects: {
      health: -12,
      fatigue: 20,
      strength: -6,
      intelligence: -3,
      charisma: -10,
      speed: -5
    },
    recoveryChance: 0.7,
    grantsImmunity: true,
    immunityDuration: -1,
    progressionStages: [
      {
        day: 2,
        symptoms: ['sore throat', 'fever begins'],
        severity: 0.3,
        statModifiers: { health: -5, fatigue: 10 }
      },
      {
        day: 4,
        symptoms: ['scarlet rash spreads', 'strawberry tongue'],
        severity: 0.6,
        statModifiers: { health: -10, charisma: -10 }
      },
      {
        day: 7,
        symptoms: ['skin peeling', 'recovery begins'],
        severity: 0.4,
        statModifiers: { health: -5, charisma: -5 }
      }
    ],
    narrativeHints: {
      npcSymptoms: ['has a bright red rash', 'has a swollen red tongue', 'is feverish', 'their skin is peeling'],
      animalSymptoms: ['has a fever', 'appears unwell'],
      playerSymptoms: ['Your skin feels like sandpaper', 'Your tongue is swollen and red', 'You burn with fever']
    },
    badgeIcon: '🍓',
    outlineColor: '#DC143C'
  },

  {
    id: 'ERGOTISM',
    name: 'Ergotism (St. Anthony\'s Fire)',
    type: 'toxic',
    severity: 'severe',
    availableEras: ['MEDIEVAL', 'EARLY_MODERN'],
    availableRegions: ['EUROPEAN', 'MENA'],
    transmissionVector: 'foodborne',
    baseTransmissionRate: 0.0, // Not contagious
    proximityMultiplier: 1.0,
    directContactMultiplier: 1.0,
    symptoms: [
      { id: 'BURNING_PAIN', name: 'Burning Pain', description: 'Intense burning in limbs', severity: 0.8 },
      { id: 'HALLUCINATIONS', name: 'Hallucinations', description: 'Vivid hallucinations', severity: 0.7 },
      { id: 'GANGRENE', name: 'Gangrene', description: 'Limbs turn black and die', severity: 0.9 }
    ],
    incubationDays: 2,
    durationDays: 21,
    mortalityRate: 0.4,
    statEffects: {
      health: -25,
      fatigue: 15,
      strength: -10,
      intelligence: -15,
      charisma: -12,
      speed: -15
    },
    recoveryChance: 0.4,
    grantsImmunity: false,
    immunityDuration: 0,
    progressionStages: [
      {
        day: 2,
        symptoms: ['tingling in fingers', 'mild nausea'],
        severity: 0.2,
        statModifiers: { health: -5, intelligence: -3 }
      },
      {
        day: 7,
        symptoms: ['burning pain', 'hallucinations begin'],
        severity: 0.6,
        statModifiers: { health: -15, intelligence: -10 }
      },
      {
        day: 14,
        symptoms: ['limbs turning black', 'severe psychosis'],
        severity: 0.9,
        statModifiers: { health: -30, intelligence: -20, speed: -20 }
      }
    ],
    narrativeHints: {
      npcSymptoms: ['screams about burning fire', 'has blackened fingers', 'speaks to invisible demons', 'writhes in agony'],
      animalSymptoms: ['appears to be in severe pain', 'has blackened extremities'],
      playerSymptoms: ['Your limbs burn like fire', 'You see demons everywhere', 'Your fingers are turning black']
    },
    badgeIcon: '🔥',
    outlineColor: '#B22222'
  },

  {
    id: 'SWEATING_SICKNESS',
    name: 'Sweating Sickness',
    type: 'respiratory',
    severity: 'critical',
    availableEras: ['EARLY_MODERN'],
    availableRegions: ['EUROPEAN'],
    startYear: 1485,
    endYear: 1551,
    transmissionVector: 'airborne',
    baseTransmissionRate: 0.4,
    proximityMultiplier: 3.0,
    directContactMultiplier: 5.0,
    symptoms: [
      { id: 'PROFUSE_SWEATING', name: 'Profuse Sweating', description: 'Extreme, drenching sweats', severity: 0.8 },
      { id: 'RAPID_ONSET', name: 'Rapid Onset', description: 'Sudden violent symptoms', severity: 0.9 },
      { id: 'CARDIAC_SYMPTOMS', name: 'Heart Palpitations', description: 'Irregular heartbeat', severity: 0.7 }
    ],
    incubationDays: 1,
    durationDays: 2,
    mortalityRate: 0.5,
    statEffects: {
      health: -35,
      fatigue: 40,
      strength: -20,
      intelligence: -10,
      charisma: -15,
      speed: -25
    },
    recoveryChance: 0.4,
    grantsImmunity: true,
    immunityDuration: -1,
    progressionStages: [
      {
        day: 0.25, // 6 hours
        symptoms: ['sudden chills', 'apprehension'],
        severity: 0.3,
        statModifiers: { health: -10, fatigue: 15 }
      },
      {
        day: 0.5, // 12 hours
        symptoms: ['violent sweating', 'delirium', 'rapid pulse'],
        severity: 0.8,
        statModifiers: { health: -25, fatigue: 30 }
      },
      {
        day: 1,
        symptoms: ['exhaustion', 'death or recovery'],
        severity: 1.0,
        statModifiers: { health: -40, fatigue: 40 }
      }
    ],
    narrativeHints: {
      npcSymptoms: ['is drenched in sweat', 'collapses suddenly', 'appears to be dying rapidly', 'sweats profusely'],
      animalSymptoms: ['is sweating unusually', 'appears distressed'],
      playerSymptoms: ['You are suddenly drenched in sweat', 'Your heart races wildly', 'You feel death approaching swiftly']
    },
    badgeIcon: '💦',
    outlineColor: '#4682B4'
  },

  {
    id: 'LEPROSY',
    name: 'Leprosy (Hansen\'s Disease)',
    type: 'contact',
    severity: 'severe',
    availableEras: ['ANCIENT', 'MEDIEVAL', 'EARLY_MODERN'],
    availableRegions: ['EUROPEAN', 'EAST_ASIAN', 'MENA', 'SOUTH_ASIAN', 'SUB_SAHARAN_AFRICAN'],
    transmissionVector: 'contact',
    baseTransmissionRate: 0.05, // Very low transmission
    proximityMultiplier: 1.5,
    directContactMultiplier: 2.0,
    symptoms: [
      { id: 'SKIN_LESIONS', name: 'Skin Lesions', description: 'Disfiguring skin patches', severity: 0.6 },
      { id: 'NERVE_DAMAGE', name: 'Nerve Damage', description: 'Loss of sensation', severity: 0.7 },
      { id: 'DEFORMITY', name: 'Deformity', description: 'Progressive disfigurement', severity: 0.8 }
    ],
    incubationDays: 1825, // 5 years
    durationDays: 3650, // 10 years chronic
    mortalityRate: 0.1,
    statEffects: {
      health: -10,
      fatigue: 10,
      strength: -5,
      intelligence: 0,
      charisma: -20,
      speed: -3
    },
    recoveryChance: 0.05,
    grantsImmunity: false,
    immunityDuration: 0,
    progressionStages: [
      {
        day: 365,
        symptoms: ['pale patches on skin', 'numbness'],
        severity: 0.2,
        statModifiers: { charisma: -5 }
      },
      {
        day: 1095,
        symptoms: ['visible lesions', 'social ostracism'],
        severity: 0.5,
        statModifiers: { health: -5, charisma: -15 }
      },
      {
        day: 2190,
        symptoms: ['severe disfigurement', 'loss of fingers/toes'],
        severity: 0.8,
        statModifiers: { health: -10, charisma: -25, strength: -8 }
      }
    ],
    narrativeHints: {
      npcSymptoms: ['has visible lesions', 'is missing fingers', 'is shunned as a leper', 'wears rags to hide disfigurement'],
      animalSymptoms: ['has skin lesions', 'appears diseased'],
      playerSymptoms: ['Pale patches appear on your skin', 'You lose feeling in your extremities', 'People recoil from your appearance']
    },
    badgeIcon: '🩹',
    outlineColor: '#8B7355'
  },

  {
    id: 'YELLOW_FEVER',
    name: 'Yellow Fever',
    type: 'vector_borne',
    severity: 'severe',
    availableEras: ['EARLY_MODERN', 'INDUSTRIAL', 'MODERN'],
    availableRegions: ['SOUTH_AMERICAN', 'SUB_SAHARAN_AFRICAN', 'NORTH_AMERICAN_COLONIAL'],
    transmissionVector: 'vector',
    baseTransmissionRate: 0.25,
    proximityMultiplier: 1.0,
    directContactMultiplier: 1.0,
    symptoms: [
      { id: 'JAUNDICE', name: 'Jaundice', description: 'Yellowing of skin and eyes', severity: 0.7 },
      { id: 'BLACK_VOMIT', name: 'Black Vomit', description: 'Vomiting blood', severity: 0.9 },
      { id: 'HEMORRHAGING', name: 'Hemorrhaging', description: 'Bleeding from multiple sites', severity: 0.8 }
    ],
    incubationDays: 5,
    durationDays: 14,
    mortalityRate: 0.5,
    statEffects: {
      health: -25,
      fatigue: 30,
      strength: -12,
      intelligence: -6,
      charisma: -10,
      speed: -10
    },
    recoveryChance: 0.4,
    grantsImmunity: true,
    immunityDuration: -1,
    progressionStages: [
      {
        day: 3,
        symptoms: ['fever', 'headache', 'muscle pain'],
        severity: 0.3,
        statModifiers: { health: -8, fatigue: 15 }
      },
      {
        day: 5,
        symptoms: ['brief remission', 'false recovery'],
        severity: 0.2,
        statModifiers: { health: -5, fatigue: 10 }
      },
      {
        day: 7,
        symptoms: ['jaundice appears', 'organ failure begins'],
        severity: 0.7,
        statModifiers: { health: -20, charisma: -10 }
      },
      {
        day: 10,
        symptoms: ['black vomit', 'hemorrhaging'],
        severity: 0.9,
        statModifiers: { health: -30, fatigue: 35 }
      }
    ],
    narrativeHints: {
      npcSymptoms: ['has yellowed skin and eyes', 'vomits black bile', 'bleeds from the nose and gums', 'appears to be dying'],
      animalSymptoms: ['appears jaundiced', 'is very ill'],
      playerSymptoms: ['Your skin turns yellow', 'You vomit black blood', 'You bleed from every orifice']
    },
    badgeIcon: '🟡',
    outlineColor: '#FFD700'
  },

  // NEW WORLD SPECIFIC DISEASES
  {
    id: 'CHAGAS_DISEASE',
    name: "Chagas' Disease",
    type: 'vector_borne',
    severity: 'moderate',
    availableEras: ['PREHISTORIC', 'ANCIENT', 'MEDIEVAL', 'EARLY_MODERN', 'INDUSTRIAL', 'MODERN'],
    availableRegions: ['NORTH_AMERICAN_PRE_COLUMBIAN', 'SOUTH_AMERICAN'],
    transmissionVector: 'vector',
    baseTransmissionRate: 0.15,
    proximityMultiplier: 1.5,
    directContactMultiplier: 2.0,
    symptoms: [
      { id: 'HEART_PROBLEMS', name: 'Heart Problems', description: 'Chronic heart enlargement', severity: 0.7 },
      { id: 'FATIGUE_CHRONIC', name: 'Chronic Fatigue', description: 'Long-term weakness', severity: 0.6 },
      { id: 'DIGESTIVE_ISSUES', name: 'Digestive Issues', description: 'Chronic digestive problems', severity: 0.4 }
    ],
    incubationDays: 30,
    durationDays: 3650, // Chronic condition - 10 years
    mortalityRate: 0.1,
    statEffects: {
      health: -12,
      fatigue: 20,
      strength: -8,
      intelligence: -2,
      charisma: -3,
      speed: -6
    },
    recoveryChance: 0.05,
    grantsImmunity: false,
    immunityDuration: 0,
    narrativeHints: {
      npcSymptoms: ['has chronic heart trouble', 'tires easily from simple tasks', 'has been unwell for months'],
      animalSymptoms: ['shows signs of chronic illness', 'appears weak and tired', 'has been declining slowly'],
      playerSymptoms: ['Your heart beats irregularly', 'You tire much more easily than before', 'You feel chronically unwell']
    },
    badgeIcon: '💔',
    outlineColor: '#8B4513'
  }
];

// Disease prevalence by era and region
export const DISEASE_PREVALENCE: DiseasePrevalence[] = [
  // Bubonic Plague - Major pandemic years
  {
    diseaseId: 'BUBONIC_PLAGUE',
    era: 'MEDIEVAL',
    region: 'EUROPEAN',
    baseIncidence: 0.15,
    epidemicYears: [1347, 1348, 1349, 1350, 1351] // Black Death
  },
  {
    diseaseId: 'BUBONIC_PLAGUE',
    era: 'MEDIEVAL',
    region: 'MENA',
    baseIncidence: 0.12,
    epidemicYears: [1347, 1348, 1349]
  },

  // Smallpox - Devastating in the Americas post-contact
  {
    diseaseId: 'SMALLPOX',
    era: 'EARLY_MODERN',
    region: 'NORTH_AMERICAN_COLONIAL',
    baseIncidence: 0.3, // Extremely high among indigenous populations
    epidemicYears: [1520, 1633, 1755, 1775]
  },
  {
    diseaseId: 'SMALLPOX',
    era: 'EARLY_MODERN',
    region: 'SOUTH_AMERICAN',
    baseIncidence: 0.35,
    epidemicYears: [1518, 1558, 1589]
  },

  // Spanish Flu - Global pandemic
  {
    diseaseId: 'SPANISH_FLU',
    era: 'MODERN',
    region: 'EUROPEAN',
    baseIncidence: 0.25,
    epidemicYears: [1918, 1919, 1920]
  },
  {
    diseaseId: 'SPANISH_FLU',
    era: 'MODERN',
    region: 'NORTH_AMERICAN_COLONIAL',
    baseIncidence: 0.22,
    epidemicYears: [1918, 1919]
  },

  // Malaria - Endemic in tropical regions
  {
    diseaseId: 'MALARIA',
    era: 'ANCIENT',
    region: 'SUB_SAHARAN_AFRICAN',
    baseIncidence: 0.4,
    endemicRegions: ['SUB_SAHARAN_AFRICAN', 'SOUTH_ASIAN', 'SOUTH_AMERICAN', 'OCEANIA']
  },
  {
    diseaseId: 'MALARIA',
    era: 'MEDIEVAL',
    region: 'SUB_SAHARAN_AFRICAN',
    baseIncidence: 0.45
  },

  // Cholera - Pandemic waves in 19th century
  {
    diseaseId: 'CHOLERA',
    era: 'INDUSTRIAL',
    region: 'SOUTH_ASIAN',
    baseIncidence: 0.2,
    epidemicYears: [1817, 1829, 1852, 1863, 1881]
  },
  {
    diseaseId: 'CHOLERA',
    era: 'INDUSTRIAL',
    region: 'EUROPEAN',
    baseIncidence: 0.15,
    epidemicYears: [1831, 1848, 1854, 1866]
  }
];

// Historical medicines and treatments
export const MEDICINES: Medicine[] = [
  {
    id: 'HERBAL_REMEDY',
    name: 'Herbal Remedy',
    availableEras: ['PREHISTORIC', 'ANCIENT', 'MEDIEVAL', 'EARLY_MODERN', 'INDUSTRIAL', 'MODERN'],
    availableRegions: ['EUROPEAN', 'EAST_ASIAN', 'MENA', 'NORTH_AMERICAN_PRE_COLUMBIAN', 'NORTH_AMERICAN_COLONIAL', 'OCEANIA', 'SOUTH_ASIAN', 'SOUTH_AMERICAN', 'SUB_SAHARAN_AFRICAN'],
    effectiveness: {
      respiratory: 0.2,
      gastrointestinal: 0.3,
      parasitic: 0.25
    },
    cost: 2,
    description: 'Traditional plant-based remedies, moderately effective for minor ailments'
  },
  {
    id: 'BLOODLETTING',
    name: 'Bloodletting',
    availableEras: ['ANCIENT', 'MEDIEVAL', 'EARLY_MODERN'],
    availableRegions: ['EUROPEAN', 'MENA'],
    effectiveness: {
      respiratory: 0.05, // Actually harmful
      gastrointestinal: 0.02,
      vector_borne: 0.01
    },
    sideEffects: {
      health: -5,
      strength: -3
    },
    cost: 5,
    description: 'Medieval medical practice of drawing blood, often more harmful than helpful'
  },
  {
    id: 'OPIUM',
    name: 'Opium',
    availableEras: ['ANCIENT', 'MEDIEVAL', 'EARLY_MODERN', 'INDUSTRIAL'],
    availableRegions: ['MENA', 'EAST_ASIAN', 'EUROPEAN', 'SOUTH_ASIAN'],
    effectiveness: {
      respiratory: 0.3,
      gastrointestinal: 0.4
    },
    sideEffects: {
      intelligence: -2,
      fatigue: 5
    },
    cost: 15,
    description: 'Powerful pain reliever and cough suppressant, but with side effects'
  },
  {
    id: 'QUININE',
    name: 'Quinine',
    availableEras: ['EARLY_MODERN', 'INDUSTRIAL', 'MODERN'],
    availableRegions: ['EUROPEAN', 'NORTH_AMERICAN_COLONIAL', 'SOUTH_AMERICAN'],
    effectiveness: {
      vector_borne: 0.7 // Specifically effective against malaria
    },
    cost: 25,
    description: 'Bark extract from South America, highly effective against malaria'
  },
  {
    id: 'ANTIBIOTICS',
    name: 'Antibiotics',
    availableEras: ['MODERN'],
    availableRegions: ['EUROPEAN', 'EAST_ASIAN', 'NORTH_AMERICAN_COLONIAL', 'OCEANIA'],
    effectiveness: {
      respiratory: 0.8,
      gastrointestinal: 0.85,
      contact: 0.7,
      zoonotic: 0.6
    },
    cost: 50,
    description: 'Modern medicines that fight bacterial infections very effectively'
  },
  {
    id: 'VARIOLATION',
    name: 'Variolation',
    availableEras: ['EARLY_MODERN', 'INDUSTRIAL'],
    availableRegions: ['EUROPEAN', 'MENA', 'EAST_ASIAN'],
    effectiveness: {
      contact: 0.6 // Specifically for smallpox prevention
    },
    sideEffects: {
      health: -3 // Risk of the procedure itself
    },
    cost: 20,
    description: 'Early smallpox inoculation using live virus, risky but effective'
  }
];

// Export all disease-related data
export const DISEASE_DATABASE = {
  diseases: DISEASES,
  prevalence: DISEASE_PREVALENCE,
  medicines: MEDICINES,
  columbianExchange: COLUMBIAN_EXCHANGE_RESTRICTIONS
};