/**
 * constants/characterData/culturalMarkings.ts
 * Historically accurate cultural body markings, face paint, tattoos, and modifications
 * Based on anthropological and historical evidence
 */

import { CulturalZone } from './culturalZones';
import { HistoricalEra } from '../../types/ambiance';

export interface MarkingPattern {
  id: string;
  name: string;
  localName?: string; // Native term (e.g., "Ta Moko", "Tilaka")
  description: string;
  pattern: string; // Pattern type for renderer
  locations: ('forehead' | 'cheek' | 'chin' | 'nose' | 'neck' | 'arm' | 'chest' | 'face')[];
  colors: string[]; // Hex colors
  size: 'small' | 'medium' | 'large';
}

export interface CulturalMarking {
  baseId: string;
  type: 'tattoo' | 'paint' | 'scarification' | 'piercing' | 'brand' | 'henna' | 'ash';
  culturalZones: CulturalZone[];
  eras?: HistoricalEra[];
  patterns: MarkingPattern[];
  isPermanent: boolean;
  duration?: number; // Hours for temporary markings
  professions?: string[]; // Specific to certain professions
  gender?: 'male' | 'female' | 'any';
  ageGroups?: ('child' | 'young' | 'adult' | 'elder')[];
  socialClasses?: ('poor' | 'modest' | 'comfortable' | 'wealthy' | 'noble')[];
  occasions?: ('daily' | 'ceremony' | 'war' | 'mourning' | 'celebration' | 'religious')[];
  weight: number; // Selection probability (1-10)
  culturalSignificance: string;
}

export const CULTURAL_MARKINGS: CulturalMarking[] = [
  // ========== OCEANIA ==========
  {
    baseId: 'TA_MOKO',
    type: 'tattoo',
    culturalZones: ['OCEANIA'],
    patterns: [
      {
        id: 'ta_moko_warrior',
        name: 'Warrior Ta Moko',
        localName: 'Ta Moko',
        description: 'Sacred Māori facial tattoos indicating genealogy and achievements',
        pattern: 'maori_spiral',
        locations: ['chin', 'cheek', 'forehead'],
        colors: ['#1a1a1a'],
        size: 'large'
      },
      {
        id: 'ta_moko_chief',
        name: 'Chief Ta Moko',
        localName: 'Ta Moko Rangatira',
        description: 'Full facial tattoos of high-ranking chiefs',
        pattern: 'maori_full',
        locations: ['face'],
        colors: ['#000000'],
        size: 'large'
      }
    ],
    isPermanent: true,
    professions: ['Warrior', 'Chief', 'Noble', 'Hunter'],
    gender: 'any',
    ageGroups: ['adult', 'elder'],
    socialClasses: ['comfortable', 'wealthy', 'noble'],
    occasions: ['daily'],
    weight: 8,
    culturalSignificance: 'Sacred genealogical record and status marker'
  },
  {
    baseId: 'POLYNESIAN_TATTOO',
    type: 'tattoo',
    culturalZones: ['OCEANIA'],
    patterns: [
      {
        id: 'pe_a',
        name: "Pe'a Body Tattoo",
        localName: "Pe'a",
        description: 'Traditional Samoan body tattoos from waist to knees',
        pattern: 'geometric_bands',
        locations: ['chest', 'arm'],
        colors: ['#0d0d0d'],
        size: 'large'
      }
    ],
    isPermanent: true,
    gender: 'male',
    ageGroups: ['young', 'adult'],
    socialClasses: ['modest', 'comfortable', 'wealthy'],
    occasions: ['daily'],
    weight: 6,
    culturalSignificance: 'Rite of passage into manhood'
  },

  // ========== NORTH AMERICAN PRE-COLUMBIAN ==========
  {
    baseId: 'WAR_PAINT',
    type: 'paint',
    culturalZones: ['NORTH_AMERICAN_PRE_COLUMBIAN'],
    patterns: [
      {
        id: 'plains_war',
        name: 'Plains War Paint',
        description: 'Red and black stripes for battle',
        pattern: 'horizontal_stripes',
        locations: ['forehead', 'cheek'],
        colors: ['#B22222', '#000000'],
        size: 'medium'
      },
      {
        id: 'lightning',
        name: 'Lightning Pattern',
        description: 'Zigzag patterns representing thunder power',
        pattern: 'zigzag',
        locations: ['cheek'],
        colors: ['#FFD700', '#B22222'],
        size: 'medium'
      },
      {
        id: 'hand_print',
        name: 'Hand Print',
        description: 'Hand prints indicating enemies defeated',
        pattern: 'handprint',
        locations: ['chest', 'cheek'],
        colors: ['#8B0000', '#FFFFFF'],
        size: 'small'
      }
    ],
    isPermanent: false,
    duration: 24,
    professions: ['Warrior', 'Hunter', 'Scout'],
    gender: 'any',
    ageGroups: ['young', 'adult'],
    occasions: ['war', 'ceremony'],
    weight: 7,
    culturalSignificance: 'Spiritual protection and enemy intimidation'
  },
  {
    baseId: 'VISION_PAINT',
    type: 'paint',
    culturalZones: ['NORTH_AMERICAN_PRE_COLUMBIAN'],
    patterns: [
      {
        id: 'spirit_dots',
        name: 'Spirit Dots',
        description: 'Dots representing spirit visions',
        pattern: 'dots',
        locations: ['forehead', 'chin'],
        colors: ['#FFFFFF', '#4169E1'],
        size: 'small'
      }
    ],
    isPermanent: false,
    duration: 48,
    professions: ['Shaman', 'Medicine Man', 'Mystic'],
    gender: 'any',
    ageGroups: ['adult', 'elder'],
    occasions: ['religious', 'ceremony'],
    weight: 5,
    culturalSignificance: 'Connection to spirit world'
  },
  {
    baseId: 'MOURNING_PAINT',
    type: 'paint',
    culturalZones: ['NORTH_AMERICAN_PRE_COLUMBIAN', 'NORTH_AMERICAN_COLONIAL'],
    patterns: [
      {
        id: 'mourning_black',
        name: 'Mourning Black',
        description: 'Black paint across eyes for grief',
        pattern: 'eye_band',
        locations: ['face'],
        colors: ['#000000'],
        size: 'medium'
      }
    ],
    isPermanent: false,
    duration: 168, // 1 week
    gender: 'any',
    ageGroups: ['adult', 'elder'],
    occasions: ['mourning'],
    weight: 3,
    culturalSignificance: 'Expression of grief and loss'
  },

  // ========== SUB-SAHARAN AFRICAN ==========
  {
    baseId: 'SCARIFICATION',
    type: 'scarification',
    culturalZones: ['SUB_SAHARAN_AFRICAN'],
    patterns: [
      {
        id: 'yoruba_marks',
        name: 'Yoruba Facial Marks',
        localName: 'Kolo',
        description: 'Vertical cheek scarifications',
        pattern: 'vertical_lines',
        locations: ['cheek'],
        colors: ['#8B7355'],
        size: 'medium'
      },
      {
        id: 'dinka_forehead',
        name: 'Dinka Forehead Marks',
        localName: 'Gar',
        description: 'Horizontal forehead scarifications indicating initiation',
        pattern: 'horizontal_lines',
        locations: ['forehead'],
        colors: ['#A0826D'],
        size: 'large'
      },
      {
        id: 'geometric_scars',
        name: 'Geometric Patterns',
        description: 'Diamond and dot patterns',
        pattern: 'geometric',
        locations: ['arm', 'chest'],
        colors: ['#8B7355'],
        size: 'medium'
      }
    ],
    isPermanent: true,
    gender: 'any',
    ageGroups: ['young', 'adult'],
    socialClasses: ['poor', 'modest', 'comfortable'],
    occasions: ['daily'],
    weight: 7,
    culturalSignificance: 'Tribal identity and coming of age'
  },
  {
    baseId: 'WHITE_CHALK',
    type: 'paint',
    culturalZones: ['SUB_SAHARAN_AFRICAN'],
    patterns: [
      {
        id: 'white_dots',
        name: 'White Chalk Dots',
        localName: 'Nzu',
        description: 'White dots for ceremonies',
        pattern: 'dots',
        locations: ['forehead', 'arm'],
        colors: ['#FFFFFF'],
        size: 'small'
      }
    ],
    isPermanent: false,
    duration: 12,
    gender: 'any',
    occasions: ['ceremony', 'celebration'],
    weight: 5,
    culturalSignificance: 'Purity and spiritual connection'
  },
  {
    baseId: 'OCHRE_PAINT',
    type: 'paint',
    culturalZones: ['SUB_SAHARAN_AFRICAN'],
    patterns: [
      {
        id: 'red_ochre',
        name: 'Red Ochre',
        description: 'Red earth pigment for protection',
        pattern: 'solid',
        locations: ['forehead', 'chest'],
        colors: ['#CD5C5C', '#8B4513'],
        size: 'large'
      }
    ],
    isPermanent: false,
    duration: 24,
    gender: 'any',
    occasions: ['daily', 'ceremony'],
    weight: 6,
    culturalSignificance: 'Protection from sun and insects'
  },

  // ========== SOUTH ASIAN ==========
  {
    baseId: 'BINDI_TILAKA',
    type: 'paint',
    culturalZones: ['SOUTH_ASIAN'],
    patterns: [
      {
        id: 'bindi_dot',
        name: 'Bindi',
        localName: 'Bindi',
        description: 'Red dot on forehead',
        pattern: 'dot',
        locations: ['forehead'],
        colors: ['#DC143C', '#FF1493'],
        size: 'small'
      },
      {
        id: 'tilaka_vertical',
        name: 'Vaishnava Tilaka',
        localName: 'Urdhva Pundra',
        description: 'Vertical marks of Vishnu devotees',
        pattern: 'vertical_v',
        locations: ['forehead'],
        colors: ['#FFFFFF', '#DC143C'],
        size: 'medium'
      },
      {
        id: 'tilaka_horizontal',
        name: 'Shaiva Tilaka',
        localName: 'Tripundra',
        description: 'Three horizontal lines of Shiva devotees',
        pattern: 'three_lines',
        locations: ['forehead'],
        colors: ['#FFFFFF', '#808080'],
        size: 'medium'
      }
    ],
    isPermanent: false,
    duration: 12,
    gender: 'any',
    ageGroups: ['child', 'young', 'adult', 'elder'],
    occasions: ['daily', 'religious', 'ceremony'],
    weight: 9,
    culturalSignificance: 'Religious devotion and marital status'
  },
  {
    baseId: 'HENNA_DESIGNS',
    type: 'henna',
    culturalZones: ['SOUTH_ASIAN', 'MENA'],
    patterns: [
      {
        id: 'mehndi_floral',
        name: 'Mehndi Floral',
        localName: 'Mehndi',
        description: 'Intricate floral patterns for celebrations',
        pattern: 'floral',
        locations: ['arm'],
        colors: ['#8B4513', '#A0522D'],
        size: 'large'
      },
      {
        id: 'simple_henna',
        name: 'Simple Henna',
        description: 'Basic geometric patterns',
        pattern: 'geometric',
        locations: ['arm'],
        colors: ['#8B4513'],
        size: 'medium'
      }
    ],
    isPermanent: false,
    duration: 336, // 2 weeks
    gender: 'female',
    occasions: ['celebration', 'ceremony'],
    weight: 6,
    culturalSignificance: 'Celebration and blessing'
  },
  {
    baseId: 'VIBHUTI',
    type: 'ash',
    culturalZones: ['SOUTH_ASIAN'],
    patterns: [
      {
        id: 'sacred_ash',
        name: 'Sacred Ash',
        localName: 'Vibhuti',
        description: 'Sacred ash marks',
        pattern: 'three_lines',
        locations: ['forehead', 'arm'],
        colors: ['#D3D3D3', '#FFFFFF'],
        size: 'medium'
      }
    ],
    isPermanent: false,
    duration: 8,
    professions: ['Priest', 'Monk', 'Ascetic', 'Mystic'],
    gender: 'any',
    occasions: ['religious', 'daily'],
    weight: 5,
    culturalSignificance: 'Spiritual purification and devotion'
  },

  // ========== MENA (Middle East & North Africa) ==========
  {
    baseId: 'BERBER_TATTOO',
    type: 'tattoo',
    culturalZones: ['MENA'],
    patterns: [
      {
        id: 'amazigh_chin',
        name: 'Amazigh Chin Tattoo',
        localName: 'Oucham',
        description: 'Geometric chin tattoos of Berber women',
        pattern: 'berber_geometric',
        locations: ['chin', 'forehead'],
        colors: ['#2F4F4F', '#000080'],
        size: 'small'
      }
    ],
    isPermanent: true,
    gender: 'female',
    ageGroups: ['young', 'adult'],
    socialClasses: ['poor', 'modest', 'comfortable'],
    occasions: ['daily'],
    weight: 5,
    culturalSignificance: 'Tribal identity and protection from evil'
  },
  {
    baseId: 'KOHL_EYES',
    type: 'paint',
    culturalZones: ['MENA', 'SOUTH_ASIAN', 'SUB_SAHARAN_AFRICAN', 'EUROPEAN'],
    patterns: [
      {
        id: 'kohl_liner',
        name: 'Kohl Eye Liner',
        localName: 'Kohl',
        description: 'Black eye liner for protection',
        pattern: 'eye_liner',
        locations: ['face'],
        colors: ['#000000'],
        size: 'small'
      }
    ],
    isPermanent: false,
    duration: 24,
    gender: 'any',
    ageGroups: ['child', 'young', 'adult', 'elder'],
    occasions: ['daily'],
    weight: 10, // Very common daily practice
    culturalSignificance: 'Protection from evil eye and sun glare'
  },
  {
    baseId: 'DAILY_OCHRE',
    type: 'paint',
    culturalZones: ['SUB_SAHARAN_AFRICAN', 'OCEANIA', 'SOUTH_AMERICAN'],
    patterns: [
      {
        id: 'daily_ochre',
        name: 'Daily Ochre Paint',
        description: 'Earth pigment for sun protection',
        pattern: 'solid',
        locations: ['forehead', 'cheek'],
        colors: ['#CD5C5C', '#D2691E', '#8B4513'],
        size: 'medium'
      }
    ],
    isPermanent: false,
    duration: 12,
    gender: 'any',
    occasions: ['daily'],
    weight: 9, // Extremely common
    culturalSignificance: 'Sun protection and insect repellent'
  },
  {
    baseId: 'DAILY_FACE_PAINT',
    type: 'paint',
    culturalZones: ['NORTH_AMERICAN_PRE_COLUMBIAN', 'SOUTH_AMERICAN', 'OCEANIA'],
    patterns: [
      {
        id: 'daily_stripes',
        name: 'Daily Face Stripes',
        description: 'Simple daily face paint',
        pattern: 'stripes',
        locations: ['face'],
        colors: ['#FFFFFF', '#FF0000', '#000000'],
        size: 'small'
      },
      {
        id: 'daily_dots',
        name: 'Daily Dot Pattern',
        description: 'Protective dots',
        pattern: 'dots',
        locations: ['forehead', 'cheek'],
        colors: ['#FFFFFF', '#FFD700'],
        size: 'small'
      }
    ],
    isPermanent: false,
    duration: 24,
    gender: 'any',
    occasions: ['daily'],
    weight: 8,
    culturalSignificance: 'Daily spiritual protection and social identity'
  },
  {
    baseId: 'CHARCOAL_EYES',
    type: 'paint',
    culturalZones: ['OCEANIA', 'SUB_SAHARAN_AFRICAN', 'NORTH_AMERICAN_PRE_COLUMBIAN'],
    patterns: [
      {
        id: 'charcoal_eyes',
        name: 'Charcoal Eye Paint',
        description: 'Charcoal around eyes for glare reduction',
        pattern: 'eye_band',
        locations: ['face'],
        colors: ['#2F2F2F'],
        size: 'small'
      }
    ],
    isPermanent: false,
    duration: 24,
    gender: 'any',
    professions: ['Hunter', 'Warrior', 'Fisher', 'Navigator'],
    occasions: ['daily'],
    weight: 9,
    culturalSignificance: 'Reduces glare during hunting and warfare'
  },
  {
    baseId: 'HENNA_HANDS',
    type: 'henna',
    culturalZones: ['MENA'],
    patterns: [
      {
        id: 'geometric_henna',
        name: 'Geometric Henna',
        description: 'Geometric patterns for celebrations',
        pattern: 'geometric',
        locations: ['arm'],
        colors: ['#8B4513'],
        size: 'medium'
      }
    ],
    isPermanent: false,
    duration: 240,
    gender: 'female',
    occasions: ['celebration', 'ceremony'],
    weight: 5,
    culturalSignificance: 'Blessing and celebration'
  },

  // ========== EAST ASIAN ==========
  {
    baseId: 'FOREHEAD_DOT',
    type: 'paint',
    culturalZones: ['EAST_ASIAN'],
    patterns: [
      {
        id: 'huadian',
        name: 'Flower Dot',
        localName: 'Huadian',
        description: 'Decorative forehead marking',
        pattern: 'flower',
        locations: ['forehead'],
        colors: ['#DC143C', '#FFD700'],
        size: 'small'
      }
    ],
    isPermanent: false,
    duration: 12,
    gender: 'female',
    eras: ['ANTIQUITY', 'MEDIEVAL'],
    socialClasses: ['comfortable', 'wealthy', 'noble'],
    occasions: ['ceremony', 'celebration'],
    weight: 4,
    culturalSignificance: 'Beauty and nobility'
  },
  {
    baseId: 'CINNABAR_MARK',
    type: 'paint',
    culturalZones: ['EAST_ASIAN'],
    patterns: [
      {
        id: 'daoist_mark',
        name: 'Daoist Mark',
        description: 'Cinnabar mark for protection',
        pattern: 'dot',
        locations: ['forehead'],
        colors: ['#E34234'],
        size: 'small'
      }
    ],
    isPermanent: false,
    duration: 24,
    professions: ['Monk', 'Priest', 'Mystic'],
    gender: 'any',
    occasions: ['religious'],
    weight: 3,
    culturalSignificance: 'Spiritual protection'
  },

  // ========== SOUTH AMERICAN ==========
  {
    baseId: 'JAGUAR_PAINT',
    type: 'paint',
    culturalZones: ['SOUTH_AMERICAN'],
    patterns: [
      {
        id: 'jaguar_spots',
        name: 'Jaguar Spots',
        description: 'Black spots mimicking jaguar',
        pattern: 'spots',
        locations: ['face', 'chest'],
        colors: ['#000000'],
        size: 'medium'
      }
    ],
    isPermanent: false,
    duration: 48,
    professions: ['Warrior', 'Hunter', 'Shaman'],
    gender: 'male',
    occasions: ['war', 'ceremony'],
    weight: 6,
    culturalSignificance: 'Jaguar spirit protection'
  },
  {
    baseId: 'URUCUM',
    type: 'paint',
    culturalZones: ['SOUTH_AMERICAN'],
    patterns: [
      {
        id: 'urucum_red',
        name: 'Urucum Red',
        localName: 'Urucum',
        description: 'Red body paint from annatto',
        pattern: 'solid',
        locations: ['face', 'chest', 'arm'],
        colors: ['#FF4500', '#FF6347'],
        size: 'large'
      }
    ],
    isPermanent: false,
    duration: 72,
    gender: 'any',
    occasions: ['daily', 'ceremony'],
    weight: 7,
    culturalSignificance: 'Protection from sun and insects'
  },
  {
    baseId: 'YANOMAMI_PAINT',
    type: 'paint',
    culturalZones: ['SOUTH_AMERICAN'],
    patterns: [
      {
        id: 'yanomami_pattern',
        name: 'Yanomami Pattern',
        description: 'Traditional geometric face paint',
        pattern: 'geometric',
        locations: ['face'],
        colors: ['#000000', '#FF0000'],
        size: 'medium'
      }
    ],
    isPermanent: false,
    duration: 24,
    gender: 'any',
    occasions: ['ceremony', 'celebration'],
    weight: 5,
    culturalSignificance: 'Ritual and celebration'
  },

  // ========== EUROPEAN ==========
  {
    baseId: 'WOAD_PAINT',
    type: 'paint',
    culturalZones: ['EUROPEAN'],
    eras: ['PREHISTORY', 'ANTIQUITY'],
    patterns: [
      {
        id: 'celtic_woad',
        name: 'Celtic Woad',
        localName: 'Woad',
        description: 'Blue war paint of Celtic warriors',
        pattern: 'swirls',
        locations: ['face', 'chest', 'arm'],
        colors: ['#4682B4', '#191970'],
        size: 'large'
      }
    ],
    isPermanent: false,
    duration: 24,
    professions: ['Warrior', 'Barbarian'],
    gender: 'any',
    occasions: ['war'],
    weight: 5,
    culturalSignificance: 'Intimidation and warrior spirit'
  },
  {
    baseId: 'DAILY_CLAY',
    type: 'paint',
    culturalZones: ['EUROPEAN'],
    eras: ['PREHISTORY', 'ANTIQUITY'],
    patterns: [
      {
        id: 'clay_dots',
        name: 'Clay Face Dots',
        description: 'White clay for daily protection',
        pattern: 'dots',
        locations: ['forehead', 'cheek'],
        colors: ['#F5F5DC', '#FFFAF0'],
        size: 'small'
      }
    ],
    isPermanent: false,
    duration: 12,
    gender: 'any',
    occasions: ['daily'],
    weight: 7,
    culturalSignificance: 'Sun protection and tribal identity'
  },
  {
    baseId: 'PILGRIM_ASH',
    type: 'ash',
    culturalZones: ['EUROPEAN'],
    eras: ['MEDIEVAL', 'RENAISSANCE_EARLY_MODERN'],
    patterns: [
      {
        id: 'ash_cross',
        name: 'Ash Wednesday Cross',
        description: 'Cross of ashes on forehead',
        pattern: 'cross',
        locations: ['forehead'],
        colors: ['#808080'],
        size: 'small'
      }
    ],
    isPermanent: false,
    duration: 24,
    professions: ['Priest', 'Monk', 'Pilgrim'],
    gender: 'any',
    occasions: ['religious'],
    weight: 3,
    culturalSignificance: 'Christian penance and mortality'
  },
  {
    baseId: 'PLAGUE_MARK',
    type: 'paint',
    culturalZones: ['EUROPEAN'],
    eras: ['MEDIEVAL'],
    patterns: [
      {
        id: 'plague_cross',
        name: 'Plague Cross',
        description: 'Red cross marking plague houses',
        pattern: 'cross',
        locations: ['forehead'],
        colors: ['#8B0000'],
        size: 'medium'
      }
    ],
    isPermanent: false,
    duration: 168,
    gender: 'any',
    occasions: ['mourning'],
    weight: 2,
    culturalSignificance: 'Warning of disease'
  },

  // ========== PIERCINGS (Cross-cultural) ==========
  {
    baseId: 'NOSE_PIERCING',
    type: 'piercing',
    culturalZones: ['SOUTH_ASIAN', 'MENA', 'SUB_SAHARAN_AFRICAN', 'OCEANIA', 'SOUTH_AMERICAN'],
    patterns: [
      {
        id: 'nostril_stud',
        name: 'Nostril Stud',
        description: 'Small stud in nostril',
        pattern: 'stud',
        locations: ['nose'],
        colors: ['#FFD700', '#C0C0C0'],
        size: 'small'
      }
    ],
    isPermanent: true,
    gender: 'female',
    weight: 9, // Very common in these cultures
    culturalSignificance: 'Beauty and marital status'
  },
  {
    baseId: 'MULTIPLE_EAR_PIERCINGS',
    type: 'piercing',
    culturalZones: ['OCEANIA', 'SUB_SAHARAN_AFRICAN', 'SOUTH_ASIAN', 'MENA', 'SOUTH_AMERICAN', 'NORTH_AMERICAN_PRE_COLUMBIAN'],
    patterns: [
      {
        id: 'multiple_ears',
        name: 'Multiple Ear Piercings',
        description: 'Several ear piercings with rings or studs',
        pattern: 'multiple',
        locations: ['ear'],
        colors: ['#FFD700', '#C0C0C0', '#CD7F32'],
        size: 'small'
      }
    ],
    isPermanent: true,
    gender: 'any',
    weight: 8, // Extremely common across cultures
    culturalSignificance: 'Social status and wealth display'
  },
  {
    baseId: 'SEPTUM_PIERCING',
    type: 'piercing',
    culturalZones: ['OCEANIA', 'SOUTH_AMERICAN', 'SUB_SAHARAN_AFRICAN', 'NORTH_AMERICAN_PRE_COLUMBIAN'],
    patterns: [
      {
        id: 'septum_ring',
        name: 'Septum Ring',
        description: 'Ring through nasal septum',
        pattern: 'ring',
        locations: ['nose'],
        colors: ['#8B7355', '#FFD700'],
        size: 'small'
      }
    ],
    isPermanent: true,
    professions: ['Warrior', 'Hunter', 'Chief'],
    gender: 'any',
    weight: 4,
    culturalSignificance: 'Warrior status and strength'
  },
  {
    baseId: 'EAR_STRETCHING',
    type: 'piercing',
    culturalZones: ['SUB_SAHARAN_AFRICAN', 'OCEANIA', 'SOUTH_AMERICAN'],
    patterns: [
      {
        id: 'ear_plugs',
        name: 'Stretched Ears',
        description: 'Large ear plugs',
        pattern: 'plug',
        locations: ['face'],
        colors: ['#8B4513', '#000000'],
        size: 'medium'
      }
    ],
    isPermanent: true,
    gender: 'any',
    socialClasses: ['comfortable', 'wealthy', 'noble'],
    weight: 3,
    culturalSignificance: 'Beauty and social status'
  },

  // ========== STRUCTURAL BODY MODIFICATIONS ==========
  // Anthropologically documented practices that modify body structure

  // Lip plates - Mursi, Suri (Ethiopia), Kayapó (Brazil), Sara-Kaba (Chad)
  {
    baseId: 'LIP_PLATE',
    type: 'piercing',
    culturalZones: ['SUB_SAHARAN_AFRICAN', 'SOUTH_AMERICAN'],
    patterns: [
      {
        id: 'lower_lip_plate',
        name: 'Lower Lip Plate',
        localName: 'Dhebi a Tugoin', // Mursi term
        description: 'Clay or wooden disc inserted in lower lip',
        pattern: 'plate',
        locations: ['chin'], // Lower lip area
        colors: ['#8B7355', '#D2691E'], // Clay/wood colors
        size: 'large'
      }
    ],
    isPermanent: true,
    gender: 'female', // Primarily female in most cultures
    ageGroups: ['adult', 'elder'],
    socialClasses: ['modest', 'comfortable', 'wealthy'],
    occasions: ['daily'],
    weight: 6, // Common in specific ethnic groups
    culturalSignificance: 'Marriageability, beauty, and cultural identity'
  },

  // Neck rings/coils - Kayan (Myanmar/Thailand), Ndebele (South Africa)
  {
    baseId: 'NECK_RINGS',
    type: 'piercing', // Using piercing type for structural mods
    culturalZones: ['SUB_SAHARAN_AFRICAN', 'EAST_ASIAN'],
    patterns: [
      {
        id: 'brass_neck_coils',
        name: 'Neck Rings',
        localName: 'Dzilla', // Ndebele term
        description: 'Brass or copper coils worn around neck',
        pattern: 'coils',
        locations: ['neck'],
        colors: ['#B8860B', '#CD7F32'], // Brass/copper
        size: 'large'
      }
    ],
    isPermanent: true,
    gender: 'female',
    ageGroups: ['young', 'adult', 'elder'],
    socialClasses: ['modest', 'comfortable', 'wealthy'],
    occasions: ['daily'],
    weight: 5,
    culturalSignificance: 'Beauty ideal, cultural identity, protection from tigers (Kayan belief)'
  },

  // Tooth blackening - Japan (Ohaguro), Vietnam, Philippines, Pacific Islands
  {
    baseId: 'TOOTH_BLACKENING',
    type: 'paint', // Technically a dye/stain
    culturalZones: ['EAST_ASIAN', 'OCEANIA'],
    eras: ['ANTIQUITY', 'MEDIEVAL', 'RENAISSANCE_EARLY_MODERN'],
    patterns: [
      {
        id: 'blackened_teeth',
        name: 'Blackened Teeth',
        localName: 'Ohaguro', // Japanese term
        description: 'Teeth dyed black with iron solution',
        pattern: 'teeth_black',
        locations: ['face'], // Mouth area
        colors: ['#1C1C1C'],
        size: 'small'
      }
    ],
    isPermanent: false,
    duration: 720, // Lasts about a month
    gender: 'any', // Both genders in different cultures
    ageGroups: ['adult', 'elder'],
    socialClasses: ['comfortable', 'wealthy', 'noble'],
    occasions: ['daily'],
    weight: 7, // Very common in certain periods
    culturalSignificance: 'Beauty, maturity, and marital status'
  },

  // Tooth filing/sharpening - Bali, Maya, various African cultures
  {
    baseId: 'TOOTH_FILING',
    type: 'scarification', // Permanent body modification
    culturalZones: ['OCEANIA', 'SUB_SAHARAN_AFRICAN', 'SOUTH_AMERICAN'],
    patterns: [
      {
        id: 'filed_teeth',
        name: 'Filed Teeth',
        localName: 'Metatah', // Balinese term
        description: 'Teeth filed to points or patterns',
        pattern: 'teeth_filed',
        locations: ['face'],
        colors: ['#F5F5DC'], // Ivory/tooth color
        size: 'small'
      }
    ],
    isPermanent: true,
    gender: 'any',
    ageGroups: ['young', 'adult'], // Coming of age ritual
    occasions: ['daily'],
    weight: 5,
    culturalSignificance: 'Coming of age, beauty, spiritual balance'
  },

  // Tooth inlays - Maya jade, Filipino gold
  {
    baseId: 'TOOTH_INLAY',
    type: 'piercing', // Permanent modification
    culturalZones: ['SOUTH_AMERICAN', 'OCEANIA'],
    eras: ['ANTIQUITY', 'MEDIEVAL'],
    patterns: [
      {
        id: 'jade_inlay',
        name: 'Jade Tooth Inlay',
        description: 'Jade or gold inlaid in teeth',
        pattern: 'teeth_inlay',
        locations: ['face'],
        colors: ['#00A86B', '#FFD700'], // Jade green or gold
        size: 'small'
      }
    ],
    isPermanent: true,
    gender: 'any',
    socialClasses: ['wealthy', 'noble'], // Expensive procedure
    occasions: ['daily'],
    weight: 3,
    culturalSignificance: 'Wealth, status, and divine connection'
  },

  // Cranial modification - Maya, Inca, Huns, some African groups
  {
    baseId: 'CRANIAL_SHAPING',
    type: 'scarification', // Permanent modification
    culturalZones: ['SOUTH_AMERICAN', 'NORTH_AMERICAN_PRE_COLUMBIAN'],
    eras: ['PREHISTORY', 'ANTIQUITY', 'MEDIEVAL'],
    patterns: [
      {
        id: 'elongated_skull',
        name: 'Cranial Elongation',
        description: 'Skull shaped through binding in infancy',
        pattern: 'cranial_elongation',
        locations: ['forehead'],
        colors: ['#000000'], // Not visible as marking
        size: 'large'
      }
    ],
    isPermanent: true,
    gender: 'any',
    ageGroups: ['young', 'adult', 'elder'], // Done in infancy, visible throughout life
    socialClasses: ['comfortable', 'wealthy', 'noble'],
    occasions: ['daily'],
    weight: 4,
    culturalSignificance: 'Elite status, beauty ideal, ethnic identity'
  },

  // Hair treatments as modification - Himba red ochre, Maasai red clay
  {
    baseId: 'HAIR_OCHRE',
    type: 'paint',
    culturalZones: ['SUB_SAHARAN_AFRICAN'],
    patterns: [
      {
        id: 'ochre_hair',
        name: 'Ochre Hair Treatment',
        localName: 'Otjize', // Himba term
        description: 'Hair coated with ochre and butterfat mixture',
        pattern: 'hair_ochre',
        locations: ['forehead'], // Hair/head area
        colors: ['#CC4125', '#8B4513'], // Red-brown ochre
        size: 'large'
      }
    ],
    isPermanent: false,
    duration: 168, // Reapplied weekly
    gender: 'any',
    ageGroups: ['young', 'adult', 'elder'],
    occasions: ['daily'],
    weight: 8, // Very common daily practice
    culturalSignificance: 'Sun protection, beauty, cultural identity'
  },

  // Cheek plugs/discs - Various Amazon tribes
  {
    baseId: 'CHEEK_PLUGS',
    type: 'piercing',
    culturalZones: ['SOUTH_AMERICAN'],
    patterns: [
      {
        id: 'cheek_disc',
        name: 'Cheek Plugs',
        description: 'Wooden discs through cheeks',
        pattern: 'cheek_plug',
        locations: ['cheek'],
        colors: ['#8B4513', '#654321'], // Wood colors
        size: 'medium'
      }
    ],
    isPermanent: true,
    gender: 'any',
    professions: ['Warrior', 'Hunter', 'Chief'],
    ageGroups: ['adult', 'elder'],
    occasions: ['daily'],
    weight: 3,
    culturalSignificance: 'Warrior status and fierceness'
  },

  // Finger amputation - Dani people (Papua)
  {
    baseId: 'RITUAL_AMPUTATION',
    type: 'scarification',
    culturalZones: ['OCEANIA'],
    patterns: [
      {
        id: 'finger_amputation',
        name: 'Mourning Amputation',
        localName: 'Ikipalin', // Dani term
        description: 'Finger joint removed in mourning',
        pattern: 'amputation',
        locations: ['arm'], // Hand/finger area
        colors: ['#8B7355'], // Scar color
        size: 'small'
      }
    ],
    isPermanent: true,
    gender: 'female', // Primarily female practice
    ageGroups: ['adult', 'elder'],
    occasions: ['mourning'],
    weight: 2, // Specific to mourning rituals
    culturalSignificance: 'Grief expression and spiritual connection to deceased'
  },

  // Subincision - Australian Aboriginal initiation
  {
    baseId: 'SUBINCISION',
    type: 'scarification',
    culturalZones: ['OCEANIA'],
    patterns: [
      {
        id: 'ritual_subincision',
        name: 'Initiation Mark',
        description: 'Ritual genital modification',
        pattern: 'ritual_scar',
        locations: ['chest'], // Symbolic location for portrait
        colors: ['#8B7355'],
        size: 'medium'
      }
    ],
    isPermanent: true,
    gender: 'male',
    ageGroups: ['young', 'adult'], // Initiation rite
    professions: ['Warrior', 'Hunter', 'Elder'],
    occasions: ['ceremony'],
    weight: 3,
    culturalSignificance: 'Male initiation and spiritual transformation'
  },

  // Foot binding - Chinese practice (Song to early 20th century)
  {
    baseId: 'FOOT_BINDING',
    type: 'scarification', // Permanent modification
    culturalZones: ['EAST_ASIAN'],
    eras: ['MEDIEVAL', 'RENAISSANCE_EARLY_MODERN', 'INDUSTRIAL_ERA'],
    patterns: [
      {
        id: 'bound_feet',
        name: 'Lotus Feet',
        localName: 'Chanzu', // Chinese term
        description: 'Feet bound to alter shape',
        pattern: 'foot_binding',
        locations: ['chest'], // Not visible in portrait
        colors: ['#000000'],
        size: 'small'
      }
    ],
    isPermanent: true,
    gender: 'female',
    ageGroups: ['young', 'adult', 'elder'], // Started in childhood
    socialClasses: ['comfortable', 'wealthy', 'noble'],
    occasions: ['daily'],
    weight: 5, // Common among upper classes
    culturalSignificance: 'Beauty ideal, status, marriageability'
  }
];

// Helper function to get appropriate markings for a character
export function getMarkingsForCharacter(
  culturalZone: CulturalZone,
  era?: HistoricalEra,
  profession?: string,
  gender: 'male' | 'female' = 'male',
  socialClass: string = 'modest',
  age: number = 30,
  occasion: string = 'daily'
): CulturalMarking[] {
  
  // Determine age group
  const ageGroup = age < 16 ? 'child' : 
                   age < 25 ? 'young' :
                   age < 50 ? 'adult' : 'elder';
  
  return CULTURAL_MARKINGS.filter(marking => {
    // Check cultural zone
    if (!marking.culturalZones.includes(culturalZone)) return false;
    
    // Check era if specified
    if (marking.eras && era && !marking.eras.includes(era)) return false;
    
    // Check gender
    if (marking.gender && marking.gender !== 'any' && marking.gender !== gender) return false;
    
    // Check age group
    if (marking.ageGroups && !marking.ageGroups.includes(ageGroup as any)) return false;
    
    // Check social class
    if (marking.socialClasses && !marking.socialClasses.includes(socialClass as any)) return false;
    
    // Check profession
    if (marking.professions && profession) {
      const profLower = profession.toLowerCase();
      const hasMatch = marking.professions.some(p => 
        profLower.includes(p.toLowerCase()) || p.toLowerCase().includes(profLower)
      );
      if (!hasMatch) return false;
    }
    
    // Check occasion
    if (marking.occasions && !marking.occasions.includes(occasion as any)) return false;
    
    return true;
  });
}

// Select a random marking based on weights
export function selectRandomMarking(
  markings: CulturalMarking[],
  seed: number = Math.random()
): CulturalMarking | null {
  if (markings.length === 0) return null;
  
  const totalWeight = markings.reduce((sum, marking) => sum + marking.weight, 0);
  let random = seed * totalWeight;
  
  for (const marking of markings) {
    random -= marking.weight;
    if (random <= 0) {
      return marking;
    }
  }
  
  return markings[markings.length - 1];
}

// Get a random pattern from a marking
export function getRandomPattern(
  marking: CulturalMarking,
  seed: number = Math.random()
): MarkingPattern | null {
  if (marking.patterns.length === 0) return null;
  const index = Math.floor(seed * marking.patterns.length);
  return marking.patterns[index];
}

// Convert marking to appearance format for ProceduralPortrait
// Maps cultural marking patterns to renderer-compatible patterns
export function convertToAppearanceMarking(
  marking: CulturalMarking,
  pattern: MarkingPattern
): any {
  // Get the primary location
  const location = pattern.locations[0] || 'face';
  
  // Map cultural patterns to renderer-compatible patterns
  let rendererPattern = pattern.pattern;
  
  // Fix pattern mapping for specific cultural types
  if (marking.type === 'tattoo') {
    // Map tattoo patterns to renderer-expected names
    if (pattern.pattern === 'maori_spiral' || pattern.pattern === 'maori_full') {
      rendererPattern = pattern.pattern; // Keep as-is
    } else if (pattern.pattern === 'berber_geometric') {
      rendererPattern = 'berber';
    } else if (pattern.pattern === 'vertical_lines' || pattern.pattern === 'horizontal_lines' || pattern.pattern === 'geometric') {
      rendererPattern = 'scarification'; // Map African patterns to scarification
    } else if (pattern.pattern === 'swirls') {
      rendererPattern = 'celtic'; // Map Celtic patterns
    } else {
      rendererPattern = 'lines'; // Default fallback
    }
  } else if (marking.type === 'paint') {
    // Map paint patterns to renderer-expected names
    if (pattern.pattern === 'horizontal_stripes') {
      rendererPattern = 'stripes';
    } else if (pattern.pattern === 'geometric_bands') {
      rendererPattern = 'stripes';
    } else if (pattern.pattern === 'three_lines') {
      rendererPattern = location === 'forehead' ? 'three_lines' : 'stripes';
    } else if (pattern.pattern === 'eye_liner') {
      rendererPattern = 'eye_band';
    } else {
      rendererPattern = pattern.pattern; // Keep dot, flower, solid, zigzag, handprint, etc.
    }
  } else if (marking.type === 'scarification') {
    // Scarification should render as tattoo with scarification pattern
    return {
      type: 'tattoo', // Renderer processes scarification as tattoo
      location: location,
      color: pattern.colors[0] || '#8B7355', // Scarification color
      size: pattern.size,
      pattern: 'scarification', // Force scarification pattern
      name: pattern.localName || pattern.name,
      isPermanent: marking.isPermanent,
      duration: marking.duration,
      culturalSignificance: marking.culturalSignificance
    };
  } else if (marking.type === 'piercing') {
    // Map piercing types
    return {
      type: 'piercing', // Keep as piercing type
      location: location,
      color: pattern.colors[0] || '#FFD700',
      size: pattern.size,
      pattern: pattern.pattern === 'ring' ? 'ring' : 
               pattern.pattern === 'stud' ? 'stud' : 
               location === 'nose' ? 'septum' : 'stud',
      name: pattern.localName || pattern.name,
      isPermanent: marking.isPermanent,
      duration: marking.duration,
      culturalSignificance: marking.culturalSignificance
    };
  }
  
  return {
    type: marking.type,
    location: location,
    color: pattern.colors[0] || '#000000',
    size: pattern.size,
    pattern: rendererPattern,
    name: pattern.localName || pattern.name,
    isPermanent: marking.isPermanent,
    duration: marking.duration,
    culturalSignificance: marking.culturalSignificance
  };
}

// Get marking probability based on culture and context
// Based on anthropological and historical evidence
export function getMarkingProbability(
  culturalZone: CulturalZone,
  era?: HistoricalEra,
  profession?: string
): number {
  // Base probabilities by culture - historically accurate
  // These reflect actual anthropological data on body modification prevalence
  const baseProbabilities: Record<CulturalZone, number> = {
    // Oceania: Ta moko, pe'a, and other tattoos were near-universal markers of adulthood
    OCEANIA: 0.95,
    
    // Pre-Columbian Americas: Face/body paint was daily wear, tattoos/piercings very common
    NORTH_AMERICAN_PRE_COLUMBIAN: 0.90,
    SOUTH_AMERICAN: 0.85,
    
    // Sub-Saharan Africa: Scarification, body paint, and piercings were standard
    SUB_SAHARAN_AFRICAN: 0.85,
    
    // South Asia: Bindi/tilaka daily for most, henna for celebrations, nose rings common
    SOUTH_ASIAN: 0.75,
    
    // MENA: Kohl was universal (sun protection), henna common, tattoos for Berbers
    MENA: 0.70,
    
    // East Asia: Varies by era - high in ancient times, lower in Confucian periods
    EAST_ASIAN: 0.35,
    
    // Europe: Celtic/Germanic tribes had high rates, declined with Christianity
    EUROPEAN: 0.25,
    
    // Colonial America: Mostly limited to sailors, criminals, and Native peoples
    NORTH_AMERICAN_COLONIAL: 0.15
  };
  
  let probability = baseProbabilities[culturalZone] || 0.2;
  
  // Era adjustments - more accurate to historical periods
  if (era === 'PREHISTORY') {
    // Almost universal body modification in prehistoric times
    probability = Math.min(probability * 1.3, 0.95);
  } else if (era === 'ANTIQUITY') {
    // High rates in ancient civilizations
    probability = Math.min(probability * 1.2, 0.90);
  } else if (era === 'MEDIEVAL') {
    // Varies by region - high in non-Christian areas
    if (culturalZone === 'EUROPEAN') {
      probability *= 0.5; // Christianity discouraged it
    }
  } else if (era === 'INDUSTRIAL_ERA' || era === 'MODERN_ERA') {
    // Declined with colonialism and modernization
    probability *= 0.4;
  }
  
  // Profession adjustments - certain roles had mandatory markings
  if (profession) {
    const profLower = profession.toLowerCase();
    
    // These professions almost always had markings
    if (profLower.includes('warrior') || profLower.includes('shaman') || 
        profLower.includes('priest') || profLower.includes('monk') ||
        profLower.includes('chief') || profLower.includes('mystic') ||
        profLower.includes('medicine')) {
      probability = Math.min(probability * 1.4, 0.95);
    } 
    // Sailors commonly had tattoos across many cultures
    else if (profLower.includes('sailor') || profLower.includes('pirate')) {
      probability = Math.min(probability * 1.3, 0.85);
    }
    // Lower for merchants and scholars in some cultures
    else if (profLower.includes('merchant') || profLower.includes('scholar')) {
      probability *= 0.9; // Still common, just slightly less
    }
  }
  
  return Math.min(probability, 0.98); // Cap at 98% to allow some variety
}