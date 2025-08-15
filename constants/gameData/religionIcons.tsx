/**
 * constants/gameData/religionIcons.tsx
 * Maps religions to their icons, colors, and display names
 */

import React from 'react';
import { 
  FaCross, 
  FaChurch, 
  FaMosque, 
  FaSynagogue,
  FaOm,
  FaDharmachakra,
  FaYinYang,
  FaAnkh,
  FaFire,
  FaTree,
  FaMountain,
  FaSun,
  FaMoon,
  FaStar,
  FaFeatherAlt,
  FaSkull,
  FaEye,
  FaHands,
  FaPrayingHands
} from 'react-icons/fa';
import { 
  GiChurch,
  GiMosque,
  GiTotem,
  GiMayanPyramid,
  GiGreekTemple,
  GiRomanShield,
  GiVikingHelmet,
  GiFireBowl,
  GiStonePile,
  GiPineTree,
  GiMoonClaws,
  GiEagleHead,
  GiBuffaloHead,
  GiSnake,
  GiAfrica,
  GiIsland,
  GiMountaintop
} from 'react-icons/gi';
import { SiHinduism } from 'react-icons/si';

export interface ReligionDisplay {
  name: string;
  icon: React.ReactNode;
  color: string; // Primary color for the religion
  bgColor: string; // Background color for display
}

export const RELIGION_DISPLAY: Record<string, ReligionDisplay> = {
  // Christianity
  'catholic': {
    name: 'Roman Catholicism',
    icon: <FaCross />,
    color: '#FFD700', // Gold
    bgColor: 'bg-yellow-900/20'
  },
  'orthodox': {
    name: 'Eastern Orthodoxy',
    icon: <FaCross />,
    color: '#9370DB', // Purple
    bgColor: 'bg-purple-900/20'
  },
  'protestant': {
    name: 'Protestantism',
    icon: <FaChurch />,
    color: '#4169E1', // Royal Blue
    bgColor: 'bg-blue-900/20'
  },
  'christian': {
    name: 'Christianity',
    icon: <FaCross />,
    color: '#87CEEB', // Sky Blue
    bgColor: 'bg-sky-900/20'
  },

  // Islam
  'sunni': {
    name: 'Sunni Islam',
    icon: <FaMosque />,
    color: '#228B22', // Forest Green
    bgColor: 'bg-green-900/20'
  },
  'shia': {
    name: 'Shia Islam',
    icon: <FaMosque />,
    color: '#006400', // Dark Green
    bgColor: 'bg-emerald-900/20'
  },
  'sufi': {
    name: 'Sufism',
    icon: <FaMosque />,
    color: '#20B2AA', // Light Sea Green
    bgColor: 'bg-teal-900/20'
  },
  'islam': {
    name: 'Islam',
    icon: <FaMosque />,
    color: '#2E8B57', // Sea Green
    bgColor: 'bg-green-900/20'
  },

  // Judaism
  'judaism': {
    name: 'Judaism',
    icon: <FaSynagogue />,
    color: '#0000CD', // Medium Blue
    bgColor: 'bg-indigo-900/20'
  },

  // Eastern Religions
  'buddhist': {
    name: 'Buddhism',
    icon: <FaDharmachakra />,
    color: '#FF8C00', // Dark Orange
    bgColor: 'bg-orange-900/20'
  },
  'theravada': {
    name: 'Theravada Buddhism',
    icon: <FaDharmachakra />,
    color: '#FFA500', // Orange
    bgColor: 'bg-amber-900/20'
  },
  'mahayana': {
    name: 'Mahayana Buddhism',
    icon: <FaDharmachakra />,
    color: '#FF6347', // Tomato
    bgColor: 'bg-red-900/20'
  },
  'zen': {
    name: 'Zen Buddhism',
    icon: <FaYinYang />,
    color: '#696969', // Dim Gray
    bgColor: 'bg-gray-900/20'
  },
  'hindu': {
    name: 'Hinduism',
    icon: <FaOm />,
    color: '#FF4500', // Orange Red
    bgColor: 'bg-orange-900/20'
  },
  'shinto': {
    name: 'Shinto',
    icon: <GiGreekTemple />,
    color: '#DC143C', // Crimson
    bgColor: 'bg-red-900/20'
  },
  'confucian': {
    name: 'Confucianism',
    icon: <FaYinYang />,
    color: '#8B4513', // Saddle Brown
    bgColor: 'bg-amber-900/20'
  },
  'taoist': {
    name: 'Taoism',
    icon: <FaYinYang />,
    color: '#2F4F4F', // Dark Slate Gray
    bgColor: 'bg-slate-900/20'
  },

  // Ancient Polytheism
  'greek_polytheism': {
    name: 'Greek Polytheism',
    icon: <GiGreekTemple />,
    color: '#4682B4', // Steel Blue
    bgColor: 'bg-blue-900/20'
  },
  'roman_polytheism': {
    name: 'Roman Polytheism',
    icon: <GiRomanShield />,
    color: '#8B0000', // Dark Red
    bgColor: 'bg-red-900/20'
  },
  'egyptian_polytheism': {
    name: 'Egyptian Polytheism',
    icon: <FaAnkh />,
    color: '#DAA520', // Goldenrod
    bgColor: 'bg-yellow-900/20'
  },
  'norse_paganism': {
    name: 'Norse Paganism',
    icon: <GiVikingHelmet />,
    color: '#708090', // Slate Gray
    bgColor: 'bg-gray-900/20'
  },
  'celtic': {
    name: 'Celtic Druidism',
    icon: <GiPineTree />,
    color: '#228B22', // Forest Green
    bgColor: 'bg-green-900/20'
  },

  // Indigenous American
  'aztec': {
    name: 'Aztec Religion',
    icon: <GiMayanPyramid />,
    color: '#B22222', // Fire Brick
    bgColor: 'bg-red-900/20'
  },
  'Aztec Religion': {
    name: 'Aztec Religion',
    icon: <GiMayanPyramid />,
    color: '#B22222', // Fire Brick
    bgColor: 'bg-red-900/20'
  },
  'maya': {
    name: 'Maya Religion',
    icon: <GiMayanPyramid />,
    color: '#006400', // Dark Green
    bgColor: 'bg-green-900/20'
  },
  'Maya Religion': {
    name: 'Maya Religion',
    icon: <GiMayanPyramid />,
    color: '#006400', // Dark Green
    bgColor: 'bg-green-900/20'
  },
  'inca': {
    name: 'Inca Religion',
    icon: <FaSun />,
    color: '#FFD700', // Gold
    bgColor: 'bg-yellow-900/20'
  },
  'Inca Religion': {
    name: 'Inca Religion',
    icon: <FaSun />,
    color: '#FFD700', // Gold
    bgColor: 'bg-yellow-900/20'
  },
  'native_american': {
    name: 'Native American Spirituality',
    icon: <GiEagleHead />,
    color: '#8B4513', // Saddle Brown
    bgColor: 'bg-amber-900/20'
  },
  'totem': {
    name: 'Totemism',
    icon: <GiTotem />,
    color: '#A0522D', // Sienna
    bgColor: 'bg-orange-900/20'
  },

  // African
  'yoruba': {
    name: 'Yoruba Religion',
    icon: <GiAfrica />,
    color: '#800080', // Purple
    bgColor: 'bg-purple-900/20'
  },
  'vodun': {
    name: 'Vodun',
    icon: <GiSnake />,
    color: '#4B0082', // Indigo
    bgColor: 'bg-indigo-900/20'
  },

  // Other
  'zoroastrian': {
    name: 'Zoroastrianism',
    icon: <GiFireBowl />,
    color: '#FF4500', // Orange Red
    bgColor: 'bg-orange-900/20'
  },
  'animist': {
    name: 'Animism',
    icon: <GiPineTree />,
    color: '#228B22', // Forest Green
    bgColor: 'bg-green-900/20'
  },
  'shamanic': {
    name: 'Shamanism',
    icon: <FaFeatherAlt />,
    color: '#8B4513', // Saddle Brown
    bgColor: 'bg-amber-900/20'
  },
  'pagan': {
    name: 'Paganism',
    icon: <FaMoon />,
    color: '#4B0082', // Indigo
    bgColor: 'bg-indigo-900/20'
  },

  // Default
  'default': {
    name: 'Local Faith',
    icon: <FaPrayingHands />,
    color: '#808080', // Gray
    bgColor: 'bg-gray-900/20'
  }
};

/**
 * Get display information for a religion
 */
export function getReligionDisplay(religion: string): ReligionDisplay {
  // First check exact match (case sensitive)
  if (RELIGION_DISPLAY[religion]) {
    return RELIGION_DISPLAY[religion];
  }
  
  // Map common religion names from religions.ts to our display keys
  const religionMappings: Record<string, string> = {
    'Roman Catholicism': 'catholic',
    'Eastern Orthodoxy': 'orthodox',
    'Byzantine Christianity': 'orthodox',
    'Protestantism': 'protestant',
    'Sunni Islam': 'sunni',
    'Shia Islam': 'shia',
    'Celtic Druidism': 'celtic',
    'Roman Polytheism': 'roman_polytheism',
    'Greek Polytheism': 'greek_polytheism',
    'Germanic Paganism': 'germanic',
    'Norse Paganism': 'norse_paganism',
    'Slavic Paganism': 'slavic',
    'Egyptian Polytheism': 'egyptian',
    'Hinduism': 'hindu',
    'Buddhism': 'buddhist',
    'Judaism': 'judaism',
    'Early Christianity': 'christian',
    'Christianity': 'christian',
    'Islam': 'islam',
    'Animism': 'animist',
    'Shamanism': 'shamanic',
    'Zoroastrianism': 'zoroastrian',
    'Aztec Religion': 'aztec',
    'Maya Religion': 'maya',
    'Inca Religion': 'inca'
  };
  
  if (religionMappings[religion]) {
    const mapped = RELIGION_DISPLAY[religionMappings[religion]];
    if (mapped) return mapped;
  }
  
  const religionLower = religion.toLowerCase();
  
  // Direct match (lowercase)
  if (RELIGION_DISPLAY[religionLower]) {
    return RELIGION_DISPLAY[religionLower];
  }
  
  // Partial matches
  for (const [key, display] of Object.entries(RELIGION_DISPLAY)) {
    if (religionLower.includes(key) || key.includes(religionLower)) {
      return display;
    }
  }
  
  // Category matches
  if (religionLower.includes('church') || religionLower.includes('cathedral') || 
      religionLower.includes('abbey') || religionLower.includes('chapel')) {
    return RELIGION_DISPLAY['christian'];
  }
  if (religionLower.includes('mosque')) {
    return RELIGION_DISPLAY['islam'];
  }
  if (religionLower.includes('synagogue')) {
    return RELIGION_DISPLAY['judaism'];
  }
  if (religionLower.includes('temple')) {
    if (religionLower.includes('hindu')) return RELIGION_DISPLAY['hindu'];
    if (religionLower.includes('buddhist')) return RELIGION_DISPLAY['buddhist'];
    if (religionLower.includes('greek')) return RELIGION_DISPLAY['greek_polytheism'];
    if (religionLower.includes('roman')) return RELIGION_DISPLAY['roman_polytheism'];
  }
  if (religionLower.includes('shrine')) {
    if (religionLower.includes('shinto')) return RELIGION_DISPLAY['shinto'];
    return RELIGION_DISPLAY['animist'];
  }
  if (religionLower.includes('stupa') || religionLower.includes('pagoda')) {
    return RELIGION_DISPLAY['buddhist'];
  }
  if (religionLower.includes('pyramid')) {
    if (religionLower.includes('egypt')) return RELIGION_DISPLAY['egyptian_polytheism'];
    return RELIGION_DISPLAY['maya'];
  }
  
  return RELIGION_DISPLAY['default'];
}

/**
 * Detect religion from structure name and location
 */
export function detectReligion(structureName: string, culturalZone: string, era: string): string {
  const nameLower = structureName.toLowerCase();
  
  // Check for specific religious building types
  if (nameLower.includes('cathedral') || nameLower.includes('church') || 
      nameLower.includes('chapel') || nameLower.includes('abbey')) {
    if (culturalZone === 'EUROPEAN' || culturalZone === 'NORTH_AMERICAN_COLONIAL') {
      return 'catholic';
    }
    return 'christian';
  }
  
  if (nameLower.includes('mosque')) {
    return 'islam';
  }
  
  if (nameLower.includes('synagogue')) {
    return 'judaism';
  }
  
  if (nameLower.includes('temple')) {
    if (culturalZone === 'SOUTH_ASIAN') {
      if (nameLower.includes('buddhist')) return 'buddhist';
      return 'hindu';
    }
    if (culturalZone === 'EAST_ASIAN') {
      if (nameLower.includes('confuc')) return 'confucian';
      if (nameLower.includes('taoist')) return 'taoist';
      return 'buddhist';
    }
  }
  
  if (nameLower.includes('stupa') || nameLower.includes('pagoda')) {
    return 'buddhist';
  }
  
  if (nameLower.includes('shrine')) {
    if (culturalZone === 'EAST_ASIAN') return 'shinto';
    if (culturalZone === 'SOUTH_AMERICAN') return 'inca';
    return 'animist';
  }
  
  // Default by cultural zone
  const zoneDefaults: Record<string, string> = {
    'EUROPEAN': 'christian',
    'MENA': 'islam',
    'SOUTH_ASIAN': 'hindu',
    'EAST_ASIAN': 'buddhist',
    'SUB_SAHARAN_AFRICAN': 'animist',
    'NORTH_AMERICAN_PRE_COLUMBIAN': 'native_american',
    'NORTH_AMERICAN_COLONIAL': 'christian',
    'SOUTH_AMERICAN': 'catholic',
    'OCEANIA': 'animist'
  };
  
  return zoneDefaults[culturalZone] || 'default';
}