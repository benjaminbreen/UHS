/**
 * services/ruinsEnemyService.ts
 * Enemy definitions and generation for roguelike ruins with emoji sprites
 */

export interface RuinsEnemy {
  id: string;
  name: string;
  emoji: string;
  asciiBackup: string;
  level: number;
  hp: number;
  maxHp: number;
  damage: { min: number; max: number };
  speed: number;
  attackSpeed: number;
  defense: number;
  xpReward: number;
  description: string;
  abilities: string[];
  lootTable: { item: string; chance: number }[];
  behavior: 'aggressive' | 'defensive' | 'erratic' | 'ambush' | 'ranged';
  rangedAttack?: {
    range: number;
    projectileType: 'web' | 'poison' | 'rock' | 'spine';
    projectileSymbol: string;
    projectileColor: string;
  };
}

// Enemy definitions by dungeon depth/difficulty
export const RUINS_ENEMIES: Record<string, RuinsEnemy> = {
  // Depth 1-2: Common creatures
  rat: {
    id: 'rat',
    name: 'Giant Rat',
    emoji: '🐀',
    asciiBackup: 'r',
    level: 1,
    hp: 8,
    maxHp: 8,
    damage: { min: 1, max: 3 },
    speed: 1.2,
    attackSpeed: 1000,
    defense: 0,
    xpReward: 5,
    description: 'A diseased rat grown large from feeding on ruins refuse',
    abilities: ['disease_bite'],
    lootTable: [
      { item: 'rat_tail', chance: 0.3 },
      { item: 'cheese', chance: 0.1 }
    ],
    behavior: 'aggressive'
  },
  
  bat: {
    id: 'bat',
    name: 'Cave Bat',
    emoji: '🦇',
    asciiBackup: 'b',
    level: 1,
    hp: 6,
    maxHp: 6,
    damage: { min: 1, max: 2 },
    speed: 1.5,
    attackSpeed: 800,
    defense: 1,
    xpReward: 4,
    description: 'A swift bat that swoops from the shadows',
    abilities: ['sonic_screech'],
    lootTable: [
      { item: 'bat_wing', chance: 0.2 },
      { item: 'guano', chance: 0.15 }
    ],
    behavior: 'erratic'
  },
  
  spider: {
    id: 'spider',
    name: 'Tomb Spider',
    emoji: '🕷️',
    asciiBackup: 's',
    level: 2,
    hp: 10,
    maxHp: 10,
    damage: { min: 2, max: 4 },
    speed: 0.8,
    attackSpeed: 1200,
    defense: 1,
    xpReward: 8,
    description: 'A venomous spider that weaves traps in dark corners',
    abilities: ['web_shot', 'poison_bite'],
    lootTable: [
      { item: 'spider_silk', chance: 0.35 },
      { item: 'venom_sac', chance: 0.15 }
    ],
    behavior: 'ambush',
    rangedAttack: {
      range: 3,
      projectileType: 'web',
      projectileSymbol: '*',
      projectileColor: '#cccccc'
    }
  },
  
  // Depth 2-4: Dangerous creatures
  snake: {
    id: 'snake',
    name: 'Ruins Serpent',
    emoji: '🐍',
    asciiBackup: 'S',
    level: 3,
    hp: 15,
    maxHp: 15,
    damage: { min: 3, max: 6 },
    speed: 1.0,
    attackSpeed: 1100,
    defense: 2,
    xpReward: 12,
    description: 'A deadly serpent that strikes from concealment',
    abilities: ['venomous_strike', 'constrict'],
    lootTable: [
      { item: 'snake_fang', chance: 0.3 },
      { item: 'snake_skin', chance: 0.25 },
      { item: 'antivenom', chance: 0.1 }
    ],
    behavior: 'ambush'
  },
  
  scorpion: {
    id: 'scorpion',
    name: 'Ancient Scorpion',
    emoji: '🦂',
    asciiBackup: 'c',
    level: 3,
    hp: 18,
    maxHp: 18,
    damage: { min: 2, max: 5 },
    speed: 0.9,
    attackSpeed: 1300,
    defense: 3,
    xpReward: 14,
    description: 'An armored scorpion with a deadly stinger',
    abilities: ['tail_strike', 'armor_shell'],
    lootTable: [
      { item: 'scorpion_stinger', chance: 0.25 },
      { item: 'chitin', chance: 0.3 }
    ],
    behavior: 'defensive'
  },
  
  wolf: {
    id: 'wolf',
    name: 'Dire Wolf',
    emoji: '🐺',
    asciiBackup: 'w',
    level: 4,
    hp: 25,
    maxHp: 25,
    damage: { min: 4, max: 8 },
    speed: 1.3,
    attackSpeed: 900,
    defense: 2,
    xpReward: 20,
    description: 'A fierce wolf that hunts in the ruins depths',
    abilities: ['howl', 'pack_tactics', 'lunge'],
    lootTable: [
      { item: 'wolf_pelt', chance: 0.35 },
      { item: 'sharp_fang', chance: 0.2 },
      { item: 'raw_meat', chance: 0.4 }
    ],
    behavior: 'aggressive'
  },
  
  // Depth 4-6: Formidable foes
  bear: {
    id: 'bear',
    name: 'Cave Bear',
    emoji: '🐻',
    asciiBackup: 'B',
    level: 5,
    hp: 40,
    maxHp: 40,
    damage: { min: 5, max: 10 },
    speed: 0.8,
    attackSpeed: 1500,
    defense: 4,
    xpReward: 35,
    description: 'A massive bear that has made its lair in the ruins',
    abilities: ['maul', 'roar', 'thick_hide'],
    lootTable: [
      { item: 'bear_pelt', chance: 0.4 },
      { item: 'bear_claw', chance: 0.3 },
      { item: 'honeycomb', chance: 0.15 }
    ],
    behavior: 'defensive'
  },
  
  boar: {
    id: 'boar',
    name: 'Ruins Boar',
    emoji: '🐗',
    asciiBackup: 'P',
    level: 4,
    hp: 30,
    maxHp: 30,
    damage: { min: 4, max: 7 },
    speed: 1.1,
    attackSpeed: 1100,
    defense: 3,
    xpReward: 25,
    description: 'A tusked boar that charges with reckless fury',
    abilities: ['charge', 'gore'],
    lootTable: [
      { item: 'boar_tusk', chance: 0.3 },
      { item: 'thick_hide', chance: 0.25 },
      { item: 'raw_bacon', chance: 0.35 }
    ],
    behavior: 'aggressive'
  },
  
  crocodile: {
    id: 'crocodile',
    name: 'Ancient Crocodile',
    emoji: '🐊',
    asciiBackup: 'C',
    level: 5,
    hp: 35,
    maxHp: 35,
    damage: { min: 6, max: 12 },
    speed: 0.7,
    attackSpeed: 1800,
    defense: 5,
    xpReward: 40,
    description: 'A prehistoric beast lurking in flooded chambers',
    abilities: ['death_roll', 'armored_scales', 'ambush_strike'],
    lootTable: [
      { item: 'crocodile_scale', chance: 0.35 },
      { item: 'ancient_tooth', chance: 0.2 }
    ],
    behavior: 'ambush'
  },
  
  // Depth 6+: Large dangerous animals
  lizard: {
    id: 'lizard',
    name: 'Monitor Lizard',
    emoji: '🦎',
    asciiBackup: 'L',
    level: 6,
    hp: 35,
    maxHp: 35,
    damage: { min: 5, max: 8 },
    speed: 1.0,
    attackSpeed: 1200,
    defense: 3,
    xpReward: 45,
    description: 'A large monitor lizard that can grow up to 8 feet long',
    abilities: ['venomous_bite', 'tail_whip', 'climbing'],
    lootTable: [
      { item: 'lizard_hide', chance: 0.3 },
      { item: 'lizard_meat', chance: 0.4 }
    ],
    behavior: 'defensive'
  },
  
  vulture: {
    id: 'vulture',
    name: 'Giant Vulture',
    emoji: '🦅',
    asciiBackup: 'V',
    level: 7,
    hp: 40,
    maxHp: 40,
    damage: { min: 4, max: 7 },
    speed: 1.2,
    attackSpeed: 1100,
    defense: 2,
    xpReward: 50,
    description: 'A massive scavenging bird drawn to ancient ruins',
    abilities: ['dive_attack', 'keen_sight', 'disease_resistance'],
    lootTable: [
      { item: 'vulture_feather', chance: 0.4 },
      { item: 'bird_meat', chance: 0.3 },
      { item: 'sharp_talon', chance: 0.2 }
    ],
    behavior: 'ambush'
  },
  
  hyena: {
    id: 'hyena',
    name: 'Spotted Hyena',
    emoji: '🐺',
    asciiBackup: 'H',
    level: 8,
    hp: 50,
    maxHp: 50,
    damage: { min: 6, max: 10 },
    speed: 1.1,
    attackSpeed: 1000,
    defense: 3,
    xpReward: 65,
    description: 'A powerful scavenger with bone-crushing jaws',
    abilities: ['pack_tactics', 'bone_crush', 'intimidating_laugh'],
    lootTable: [
      { item: 'hyena_hide', chance: 0.35 },
      { item: 'sharp_tooth', chance: 0.25 },
      { item: 'raw_meat', chance: 0.4 }
    ],
    behavior: 'aggressive'
  },
  
  // Additional real animals for variety
  wildcat: {
    id: 'wildcat',
    name: 'Wildcat',
    emoji: '🐱',
    asciiBackup: 'C',
    level: 3,
    hp: 20,
    maxHp: 20,
    damage: { min: 3, max: 5 },
    speed: 1.4,
    attackSpeed: 900,
    defense: 1,
    xpReward: 15,
    description: 'A fierce feral cat that hunts in ruins',
    abilities: ['pounce', 'night_vision', 'stealth'],
    lootTable: [
      { item: 'cat_pelt', chance: 0.25 },
      { item: 'sharp_claw', chance: 0.2 }
    ],
    behavior: 'ambush'
  },
  
  owl: {
    id: 'owl',
    name: 'Great Owl',
    emoji: '🦉',
    asciiBackup: 'O',
    level: 2,
    hp: 12,
    maxHp: 12,
    damage: { min: 2, max: 4 },
    speed: 1.3,
    attackSpeed: 1000,
    defense: 1,
    xpReward: 10,
    description: 'A large owl that nests in dark ruins',
    abilities: ['silent_flight', 'keen_hearing', 'dive_attack'],
    lootTable: [
      { item: 'owl_feather', chance: 0.3 },
      { item: 'bird_meat', chance: 0.2 }
    ],
    behavior: 'defensive'
  }
};

// Generate enemy based on dungeon depth
export function generateRuinsEnemy(depth: number, x: number, y: number): RuinsEnemy & { x: number; y: number } {
  const enemyPool: string[] = [];
  
  // Determine which enemies can spawn at this depth
  if (depth <= 2) {
    enemyPool.push('rat', 'rat', 'bat', 'bat', 'spider', 'owl', 'wildcat');
  } else if (depth <= 4) {
    enemyPool.push('spider', 'snake', 'scorpion', 'rat', 'bat', 'wolf', 'wildcat');
  } else if (depth <= 6) {
    enemyPool.push('snake', 'scorpion', 'wolf', 'bear', 'boar', 'crocodile');
  } else if (depth <= 8) {
    enemyPool.push('bear', 'boar', 'crocodile', 'lizard', 'wolf');
  } else {
    enemyPool.push('lizard', 'vulture', 'hyena', 'crocodile', 'bear');
  }
  
  // Select random enemy from pool
  const enemyKey = enemyPool[Math.floor(Math.random() * enemyPool.length)];
  const enemy = { ...RUINS_ENEMIES[enemyKey] };
  
  // Scale enemy stats based on depth
  const depthScaling = 1 + (depth - enemy.level) * 0.1;
  enemy.hp = Math.floor(enemy.maxHp * depthScaling);
  enemy.maxHp = Math.floor(enemy.maxHp * depthScaling);
  enemy.damage.min = Math.floor(enemy.damage.min * depthScaling);
  enemy.damage.max = Math.floor(enemy.damage.max * depthScaling);
  enemy.xpReward = Math.floor(enemy.xpReward * depthScaling);
  
  return {
    ...enemy,
    x,
    y
  };
}

// Get enemy display symbol (emoji with fallback)
export function getEnemySymbol(enemy: RuinsEnemy, useEmoji: boolean = true): string {
  if (useEmoji && enemy.emoji) {
    return enemy.emoji;
  }
  return enemy.asciiBackup;
}

// Get enemy color based on type and health
export function getEnemyColor(enemy: RuinsEnemy): string {
  const healthPercent = enemy.hp / enemy.maxHp;
  
  // Health-based color modification
  if (healthPercent < 0.3) {
    return '#ff6666'; // Red when low health
  } else if (healthPercent < 0.6) {
    return '#ffaa66'; // Orange when medium health
  }
  
  // Type-based colors at full health
  switch (enemy.behavior) {
    case 'aggressive':
      return '#ff4444';
    case 'defensive':
      return '#4444ff';
    case 'erratic':
      return '#ff44ff';
    case 'ambush':
      return '#44ff44';
    case 'ranged':
      return '#ffff44';
    default:
      return '#ffffff';
  }
}

// Export singleton service
export const ruinsEnemyService = {
  generateEnemy: generateRuinsEnemy,
  getSymbol: getEnemySymbol,
  getColor: getEnemyColor,
  enemies: RUINS_ENEMIES
};