/**
 * constants/gameData/skills.ts - Defines all available player skills.
 */
import { SkillDefinition, SkillID } from '../../types';

export const SKILL_DATA: Record<SkillID, SkillDefinition> = {
  OBSERVE: {
    id: 'OBSERVE',
    name: 'Observe',
    description: 'Focus your senses to gain a deeper understanding of your immediate surroundings.',
    type: 'llm',
    icon: '👁️'
  },
  FORAGE: {
    id: 'FORAGE',
    name: 'Forage',
    description: 'Search the area for useful items and resources. Success depends on the environment and your skill.',
    type: 'procedural',
    icon: '🌿'
  },
  DIG: {
    id: 'DIG',
    name: 'Dig',
    description: 'Dig in the earth. Can unearth common items, or extract ore from mineral deposits if a pickaxe is equipped.',
    type: 'procedural',
    icon: '⛏️'
  },
  CHOP: {
    id: 'CHOP',
    name: 'Chop',
    description: 'Use an axe to chop wood or other materials. In combat, delivers a powerful blow that may cause bleeding.',
    type: 'procedural',
    icon: '🪓',
    target: 'opponent'
  },
  BURN: {
    id: 'BURN',
    name: 'Burn',
    description: 'Use a torch or tinderbox to set something alight. In combat, scorches the opponent and may cause burning.',
    type: 'procedural',
    icon: '🔥',
    target: 'opponent'
  },
  SING: {
    id: 'SING',
    name: 'Sing',
    description: 'Sing a song to lift spirits or send a message.',
    type: 'llm',
    icon: '🎶'
  },
  POWER_STRIKE: {
    id: 'POWER_STRIKE',
    name: 'Power Strike',
    description: 'A powerful but less accurate attack.',
    type: 'procedural',
    icon: '💥',
    fatigueCost: 4,
    target: 'opponent'
  },
  FIRST_AID: {
    id: 'FIRST_AID',
    name: 'First Aid',
    description: 'Use basic medical knowledge to restore some health.',
    type: 'procedural',
    icon: '🩹',
    fatigueCost: 3,
    target: 'self'
  },
  INTIMIDATING_SHOUT: {
    id: 'INTIMIDATING_SHOUT',
    name: 'Intimidating Shout',
    description: 'Attempt to lower the opponent\'s defense.',
    type: 'procedural',
    icon: '🗣️',
    fatigueCost: 2,
    target: 'opponent'
  }
};

export const SKILL_BUTTON_ORDER: SkillID[] = ['FORAGE', 'OBSERVE', 'DIG', 'CHOP'];