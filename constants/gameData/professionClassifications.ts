/**
 * Profession classification data for pet assignment and other systems
 * Replaces complex string matching and hardcoded profession lists
 */

/**
 * Profession categories for different game mechanics
 */
export enum ProfessionType {
  RURAL = 'rural',           // Rural/outdoor professions
  URBAN = 'urban',           // Urban crafters and workers
  MILITARY = 'military',     // Military and guard professions
  RELIGIOUS = 'religious',   // Religious professions
  NOBLE = 'noble',          // Noble and wealthy professions
  MERCHANT = 'merchant',    // Trade and commerce
  SCHOLAR = 'scholar',      // Academic and learned professions
  CRIMINAL = 'criminal',    // Criminal and outcast professions
  ECCENTRIC = 'eccentric'   // Unusual professions (alchemist, jester, etc.)
}

/**
 * Profession classifications for various game systems
 * Maps profession keywords to their types
 */
export const PROFESSION_CLASSIFICATIONS = new Map<string, ProfessionType>([
  // Rural/Outdoor professions
  ['shepherd', ProfessionType.RURAL],
  ['farmer', ProfessionType.RURAL],
  ['hunter', ProfessionType.RURAL],
  ['nomad', ProfessionType.RURAL],
  ['vaquero', ProfessionType.RURAL],
  ['cowboy', ProfessionType.RURAL],
  ['trapper', ProfessionType.RURAL],
  ['herder', ProfessionType.RURAL],
  ['rancher', ProfessionType.RURAL],
  ['woodsman', ProfessionType.RURAL],
  ['forester', ProfessionType.RURAL],
  ['fisherman', ProfessionType.RURAL],
  ['miner', ProfessionType.RURAL],

  // Urban crafters and workers
  ['weaver', ProfessionType.URBAN],
  ['baker', ProfessionType.URBAN],
  ['blacksmith', ProfessionType.URBAN],
  ['scribe', ProfessionType.URBAN],
  ['painter', ProfessionType.URBAN],
  ['potter', ProfessionType.URBAN],
  ['carpenter', ProfessionType.URBAN],
  ['tailor', ProfessionType.URBAN],
  ['cobbler', ProfessionType.URBAN],
  ['barber', ProfessionType.URBAN],
  ['cook', ProfessionType.URBAN],
  ['brewer', ProfessionType.URBAN],
  ['worker', ProfessionType.URBAN],
  ['artisan', ProfessionType.URBAN],
  ['craftsman', ProfessionType.URBAN],

  // Military professions
  ['soldier', ProfessionType.MILITARY],
  ['guard', ProfessionType.MILITARY],
  ['knight', ProfessionType.MILITARY],
  ['warrior', ProfessionType.MILITARY],
  ['archer', ProfessionType.MILITARY],
  ['officer', ProfessionType.MILITARY],
  ['captain', ProfessionType.MILITARY],
  ['sergeant', ProfessionType.MILITARY],
  ['mercenary', ProfessionType.MILITARY],
  ['legionary', ProfessionType.MILITARY],
  ['samurai', ProfessionType.MILITARY],

  // Religious professions
  ['priest', ProfessionType.RELIGIOUS],
  ['monk', ProfessionType.RELIGIOUS],
  ['nun', ProfessionType.RELIGIOUS],
  ['cleric', ProfessionType.RELIGIOUS],
  ['pilgrim', ProfessionType.RELIGIOUS],
  ['shaman', ProfessionType.RELIGIOUS],
  ['druid', ProfessionType.RELIGIOUS],
  ['bishop', ProfessionType.RELIGIOUS],
  ['abbot', ProfessionType.RELIGIOUS],

  // Noble professions
  ['noble', ProfessionType.NOBLE],
  ['lord', ProfessionType.NOBLE],
  ['lady', ProfessionType.NOBLE],
  ['baron', ProfessionType.NOBLE],
  ['duke', ProfessionType.NOBLE],
  ['earl', ProfessionType.NOBLE],
  ['count', ProfessionType.NOBLE],
  ['princess', ProfessionType.NOBLE],
  ['prince', ProfessionType.NOBLE],

  // Merchant professions
  ['merchant', ProfessionType.MERCHANT],
  ['trader', ProfessionType.MERCHANT],
  ['banker', ProfessionType.MERCHANT],
  ['shopkeeper', ProfessionType.MERCHANT],
  ['vendor', ProfessionType.MERCHANT],
  ['innkeeper', ProfessionType.MERCHANT],

  // Scholar professions
  ['scholar', ProfessionType.SCHOLAR],
  ['scribe', ProfessionType.SCHOLAR],
  ['teacher', ProfessionType.SCHOLAR],
  ['physician', ProfessionType.SCHOLAR],
  ['alchemist', ProfessionType.SCHOLAR],
  ['philosopher', ProfessionType.SCHOLAR],
  ['librarian', ProfessionType.SCHOLAR],
  ['student', ProfessionType.SCHOLAR],

  // Criminal professions
  ['thief', ProfessionType.CRIMINAL],
  ['bandit', ProfessionType.CRIMINAL],
  ['outlaw', ProfessionType.CRIMINAL],
  ['smuggler', ProfessionType.CRIMINAL],
  ['pirate', ProfessionType.CRIMINAL],
  ['assassin', ProfessionType.CRIMINAL],

  // Eccentric professions
  ['jester', ProfessionType.ECCENTRIC],
  ['alchemist', ProfessionType.ECCENTRIC],
  ['shaman', ProfessionType.ECCENTRIC],
  ['witch', ProfessionType.ECCENTRIC],
  ['hermit', ProfessionType.ECCENTRIC],
  ['soothsayer', ProfessionType.ECCENTRIC]
]);

/**
 * Pet assignment multipliers by profession type
 */
export const PET_CHANCE_MULTIPLIERS = new Map<ProfessionType, number>([
  [ProfessionType.RURAL, 2.0],      // Rural professions love animals
  [ProfessionType.NOBLE, 1.5],      // Nobles have luxury pets
  [ProfessionType.MERCHANT, 1.2],   // Merchants can afford pets
  [ProfessionType.RELIGIOUS, 1.0],  // Neutral
  [ProfessionType.SCHOLAR, 1.0],    // Neutral
  [ProfessionType.MILITARY, 0.8],   // Less likely (mobile lifestyle)
  [ProfessionType.URBAN, 0.3],      // Urban crafters rarely have pets
  [ProfessionType.CRIMINAL, 0.2],   // Criminals avoid attachments
  [ProfessionType.ECCENTRIC, 3.0]   // Eccentric professions love unusual pets
]);

/**
 * Eccentric pet options for unusual professions
 */
export const ECCENTRIC_PETS = ['SQUIRREL', 'CHICKEN', 'RAVEN', 'SNAKE', 'OWL', 'FERRET'];

/**
 * Get profession type from profession string
 */
export function getProfessionType(profession: string): ProfessionType | null {
  const professionLower = profession.toLowerCase();

  // Check each classification to see if profession matches
  for (const [keyword, type] of PROFESSION_CLASSIFICATIONS) {
    if (professionLower.includes(keyword)) {
      return type;
    }
  }

  return null; // Unknown profession type
}

/**
 * Get pet chance multiplier for a profession
 */
export function getPetChanceMultiplier(profession: string): number {
  const professionType = getProfessionType(profession);
  if (!professionType) return 1.0; // Default multiplier

  return PET_CHANCE_MULTIPLIERS.get(professionType) ?? 1.0;
}

/**
 * Check if profession should get eccentric pets
 */
export function canHaveEccentricPets(profession: string): boolean {
  const professionType = getProfessionType(profession);
  return professionType === ProfessionType.ECCENTRIC;
}

/**
 * Era-based cat chance (cats became more common in later eras)
 */
export function getBaseCatChance(year: number): number {
  if (year >= 1800) return 0.08;  // Industrial era onwards
  if (year >= 1400) return 0.05;  // Renaissance era
  if (year >= 800) return 0.03;   // Medieval era
  return 0.01; // Ancient/prehistoric eras
}