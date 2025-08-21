/**
 * generation/common/npcUtils.ts - Enhanced NPC utility functions with portrait generation.
 */
import { NpcEntity, NpcStats, NpcPersonality, NpcSocialContext, HistoricalEra, CharacterStats, CharacterPersonality, CharacterSocialContext, WealthLevel, Gender, TerrainStructure, PlayerCharacter, Ideology, Appearance, ClothingPiece, ClothingPalette, MapAreaDefinition, FactionData, TerrainStructureType, PersonalGoal } from '../../types';
import { PROFESSIONS, CulturalZone, SocialClassMap, ProfessionDefinition, CHARACTER_NAMES, REGION_NAME_MAPPING, RELIGION_DATA, GEOGRAPHICAL_DATA, IDEOLOGIES, PERSONAL_BELIEFS, CLOTHING_DATA, ADJACENCIES, getClothingData, getRandomClothingPiece, FACTION_DATA } from '../../constants/index';
import { ValueNoise } from '../../utils/noise';
import { generatePersonalGoal } from '../../services/goalService';
import { getProfessionContext, getFallbackContext, ProfessionContext } from '../../services/professionContextService';

export function determineReligion(
    culturalZone: CulturalZone,
    region: string,
    era: HistoricalEra,
    noise: ValueNoise
): string {
    let eraData = RELIGION_DATA[culturalZone]?.[region]?.[era];

    if (!eraData || eraData.length === 0) {
        // Fallback to a broader era definition if specific one not found
        const fallbackEra = era.includes('s') ? HistoricalEra.MODERN_ERA : era > HistoricalEra.RENAISSANCE_EARLY_MODERN ? HistoricalEra.INDUSTRIAL_ERA : HistoricalEra.MEDIEVAL;
        eraData = RELIGION_DATA[culturalZone]?.[region]?.[fallbackEra];
    }
    
    if (!eraData || eraData.length === 0) {
        // Fallback to a major region within the cultural zone if specific one not found
        const fallbackRegionKey = Object.keys(GEOGRAPHICAL_DATA[culturalZone] || {})[0] || 'British Isles';
        eraData = RELIGION_DATA[culturalZone]?.[fallbackRegionKey]?.[era];
    }
    
    if (!eraData || eraData.length === 0) {
        return 'Local Beliefs';
    }
    
    const totalPrevalence = eraData.reduce((sum, religion) => sum + religion.weight, 0);
    if(totalPrevalence === 0) return 'Animist';

    let roll = noise.random() * totalPrevalence;

    for (const entry of eraData) {
        roll -= entry.weight;
        if (roll <= 0) {
            return entry.religion;
        }
    }

    return eraData[eraData.length - 1]?.religion || 'Local Beliefs'; // Final fallback
}


// Enhanced name generation with fallbacks and region/year specificity
export function generateNpcName(
    gender: Gender, 
    culturalZone: CulturalZone, 
    region: string | undefined,
    year: number,
    noise: ValueNoise,
    professionNameKey?: string
): string {
    try {
        let nameKeyToUse: string | undefined = professionNameKey;

        // 1. Check for a region/year specific override first
        if (!nameKeyToUse && region) {
            // For North American regions after colonization, check NORTH_AMERICAN_COLONIAL mappings
            if (culturalZone === 'NORTH_AMERICAN_PRE_COLUMBIAN' && year > 1600) {
                const colonialRules = REGION_NAME_MAPPING['NORTH_AMERICAN_COLONIAL']?.[region];
                if (colonialRules) {
                    for (const rule of colonialRules) {
                        const beforeMatch = rule.before ? year < rule.before : true;
                        const afterMatch = rule.after ? year >= rule.after : true;
                        if (beforeMatch && afterMatch) {
                            nameKeyToUse = rule.keys[Math.floor(noise.random() * rule.keys.length)];
                            break;
                        }
                    }
                }
            }
            
            // If not found in colonial mappings or not applicable, check the original cultural zone
            if (!nameKeyToUse && REGION_NAME_MAPPING[culturalZone as keyof typeof REGION_NAME_MAPPING]) {
                const regionRules = REGION_NAME_MAPPING[culturalZone as keyof typeof REGION_NAME_MAPPING][region];
                if (regionRules) {
                    for (const rule of regionRules) {
                        const beforeMatch = rule.before ? year < rule.before : true;
                        const afterMatch = rule.after ? year >= rule.after : true;
                        if (beforeMatch && afterMatch) {
                            nameKeyToUse = rule.keys[Math.floor(noise.random() * rule.keys.length)];
                            break;
                        }
                    }
                }
            }
        }
        
        // 2. Fallback - check for specific region matching before using broad cultural zone
        if (!nameKeyToUse) {
            // For East Asian, check specific regions
            if (culturalZone === 'EAST_ASIAN' && region) {
                // Map region to specific name set based on region name
                const regionLower = region.toLowerCase();
                if (regionLower.includes('south china') || regionLower.includes('guangxi') || regionLower.includes('guangdong') || regionLower.includes('guangzhou')) {
                    nameKeyToUse = 'CHINESE_CANTONESE';
                } else if (regionLower.includes('north china') || regionLower.includes('beijing') || regionLower.includes('hebei')) {
                    nameKeyToUse = 'CHINESE_MANDARIN';
                } else if (regionLower.includes('japan')) {
                    nameKeyToUse = 'JAPANESE';
                } else if (regionLower.includes('korea')) {
                    nameKeyToUse = 'KOREAN';
                } else if (regionLower.includes('vietnam')) {
                    nameKeyToUse = 'VIETNAMESE';
                } else if (regionLower.includes('thai')) {
                    nameKeyToUse = 'THAI';
                } else {
                    // Default to generic East Asian if no specific match
                    nameKeyToUse = culturalZone;
                }
            } else {
                nameKeyToUse = culturalZone;
            }
        }

        const normalizedGender = gender === 'Male' ? 'Male' : 'Female';
        
        // 3. Get the name list, with a final fallback to EUROPEAN
        const names = CHARACTER_NAMES[nameKeyToUse] || CHARACTER_NAMES.EUROPEAN;
        
        const maleNames = names.male || ['Thomas', 'John', 'William'];
        const femaleNames = names.female || ['Mary', 'Elizabeth', 'Margaret'];
        const surnames = names.surname || ['Smith', 'Johnson', 'Williams'];
        
        const firstNames = normalizedGender === 'Male' ? maleNames : femaleNames;

        // FIX: Added robust check to prevent crash on malformed name data.
        if (!firstNames || firstNames.length === 0) {
            console.error(`[NPC Utils] Name list for ${nameKeyToUse}/${normalizedGender} is empty or missing. Using fallback.`);
            const fallbackFirst = normalizedGender === 'Male' ? 'John' : 'Mary';
            const fallbackLast = (surnames && surnames.length > 0) ? surnames[Math.floor(noise.random() * surnames.length)] : 'Doe';
            return `${fallbackFirst} ${fallbackLast}`.trim();
        }

        const first = firstNames[Math.floor(noise.random() * firstNames.length)];
        let last = (surnames && surnames.length > 0) ? surnames[Math.floor(noise.random() * surnames.length)] : '';
        
        if(last === '(No Surname)') last = '';

        return `${first} ${last}`.trim();
        
    } catch (error) {
        console.warn('[NPC Utils] Name generation failed, using minimal fallback:', error);
        const fallbackFirst = gender === 'Male' ? 'John' : 'Mary';
        const fallbackLast = 'Smith';
        return `${fallbackFirst} ${fallbackLast}`;
    }
}

export function generateBodyMetrics(gender: Gender, stats: CharacterStats, noise: ValueNoise) {
    // Use average of two random numbers to create a distribution biased towards the center.
    const rand = () => (noise.random() + noise.random()) / 2;
    // More realistic pre-modern height range: 0.92 to 1.08 multiplier
    const heightMultiplier = 0.92 + rand() * 0.16; 
    // More realistic base heights
    const baseHeight = gender === 'Female' ? 158 : 170;
    const height = Math.round(baseHeight * heightMultiplier);

    let build: 'slight' | 'average' | 'athletic' | 'stocky' | 'imposing' | 'heavy' | 'tall' | 'short';
    let bmi: number;

    const str = stats.strength;
    const con = stats.constitution;

    if (height > 190) build = 'tall';
    else if (height < 160) build = 'short';
    else if (str < 4 && con < 4) {
        build = 'slight';
        bmi = 18 + rand() * 2;
    } else if (str > 7 && con > 7) {
        build = 'imposing';
        bmi = 27 + rand() * 3;
    } else if (str > 6 && con < 6) {
        build = 'athletic';
        bmi = 23 + rand() * 2;
    } else if (str < 6 && con > 7) {
        build = 'stocky';
        bmi = 25 + rand() * 3;
    } else if (con > 8) {
        build = 'heavy';
        bmi = 29 + rand() * 4;
    }
    else {
        build = 'average';
        bmi = 20 + rand() * 4;
    }
    
    if(!bmi) bmi = 22; // fallback

    const weight = Math.round(bmi * Math.pow(height / 100, 2));

    const facialHair = gender === 'Male' && noise.random() > 0.4;
    return { height, build, weight, facialHair };
}

export function generateFacialFeatures(noise: ValueNoise, gender: Gender, culturalZone: CulturalZone) {
    const rand = noise.random;

    const select = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
    
    // Some very basic cultural tendencies
    const faceShapes: ('oval' | 'round' | 'square' | 'long' | 'heart' | 'diamond')[] = culturalZone === 'EAST_ASIAN' ? ['round', 'oval', 'heart'] : ['oval', 'square', 'long', 'round', 'diamond'];
    const eyeShapes: ('almond' | 'round' | 'narrow' | 'wide' | 'hooded')[] = culturalZone === 'EAST_ASIAN' ? ['narrow', 'almond'] : ['almond', 'round', 'wide', 'hooded'];
    const noseShapes: ('straight' | 'aquiline' | 'broad' | 'button' | 'roman')[] = culturalZone === 'MENA' ? ['aquiline', 'roman', 'straight'] : ['straight', 'broad', 'button', 'roman'];
    const hairTextures: ('straight' | 'wavy' | 'curly' | 'coily' | 'kinky')[] = culturalZone === 'SUB_SAHARAN_AFRICAN' ? ['coily', 'kinky'] : ['straight', 'wavy', 'curly'];
    const facialHairStyles: Appearance['facialHairStyle'][] = ['full_beard', 'goatee', 'mustache', 'stubble', 'van_dyke', 'soul_patch', 'mutton_chops'];

    return {
        faceShape: select(faceShapes),
        eyeShape: select(eyeShapes),
        noseShape: select(noseShapes),
        cheekbones: select(['average', 'high', 'low'] as const),
        jawline: select(gender === 'Male' ? ['sharp', 'square', 'round'] as const : ['soft', 'round', 'oval'] as const),
        hairTexture: select(hairTextures),
        hairLength: select(['short', 'medium', 'long', 'very_long', 'bald', 'very_short'] as const),
        skinTone: select(['fair', 'light', 'medium', 'olive', 'tan', 'very_pale', 'pale', 'dark', 'very_dark'] as const),
        skinTexture: select(['smooth', 'freckled', 'weathered', 'rough', 'scarred'] as const),
        eyebrowShape: select(['straight', 'arched', 'rounded', 'angular'] as const),
        eyebrowThickness: select(['thin', 'medium', 'thick', 'bushy'] as const),
        eyelashes: select(['short', 'medium', 'long'] as const),
        lipShape: select(['thin', 'medium', 'full', 'bow', 'wide'] as const),
        facialHairStyle: select(facialHairStyles),
        facialHairThickness: select(['sparse', 'medium', 'thick'] as const),
    };
}


function getRandomFromList(list: any[] | undefined, noise: ValueNoise): any {
    if (!list || list.length === 0) return null;
    return list[Math.floor(noise.random() * list.length)];
}

export function generateClothingPalette(wealthLevel: WealthLevel, era: HistoricalEra, culturalZone: CulturalZone, gender: Gender, noise: ValueNoise): ClothingPalette {
    const mapWealthToClothingTier = (wealth: WealthLevel): 'poor' | 'common' | 'wealthy' => {
        switch (wealth) {
            case 'poor': case 'modest': return 'poor';
            case 'comfortable': return 'common';
            case 'wealthy': case 'noble': return 'wealthy';
            default: return 'common';
        }
    };
    const clothingTier = mapWealthToClothingTier(wealthLevel);
    const eraData = CLOTHING_DATA[culturalZone]?.[era];
    const specificClothingSet = eraData?.[clothingTier]?.[gender];
    const palette = specificClothingSet?.palette;
    
    if (!palette || !palette.primary || palette.primary.length === 0) {
        console.log(`[ClothingPalette] No palette found for ${culturalZone}/${era}/${clothingTier}/${gender}, using fallback`);
        return { primary: '#8B4513', secondary: '#654321', accent: '#D2691E' };
    }

    return {
        primary: getRandomFromList(palette.primary, noise) || '#8B4513',
        secondary: getRandomFromList(palette.secondary, noise) || '#654321',
        accent: getRandomFromList(palette.accent, noise) || '#D2691E'
    };
}


function getHairstyle(era: HistoricalEra, gender: Gender, noise: ValueNoise): string {
    const isFemale = gender === 'Female';
    const isYoung = noise.random() < 0.3;
    const isOld = noise.random() > 0.8;

    const maleStyles: Record<string, string[]> = {
      'PREHISTORY': isYoung ? ['medium_messy', 'tied_back'] : isOld ? ['balding', 'thin_long', 'elder_wild'] : ['long_wild', 'medium_messy', 'tied_back', 'warrior_knot', 'shaman_braids'],
      'ANTIQUITY': isYoung ? ['short_cropped', 'medium_curled', 'youth_locks'] : isOld ? ['balding', 'philosopher_beard', 'elder_crown'] : ['short_cropped', 'medium_curled', 'warrior_knot', 'philosopher_beard', 'senator_style'],
      'MEDIEVAL': isYoung ? ['bowl_cut', 'page_cut', 'squire_style'] : isOld ? ['monk_style', 'thin_long', 'elder_tonsure'] : ['bowl_cut', 'shoulder_length', 'monk_style', 'knight_cut', 'noble_waves'],
      'RENAISSANCE_EARLY_MODERN': ['shoulder_curled', 'short_styled', 'renaissance_bob', 'courtier_locks', 'artist_mane'],
      'INDUSTRIAL_ERA': isOld ? ['balding', 'thin_sides', 'gentleman_receding'] : ['side_part', 'slicked_back', 'gentleman_cut', 'victorian_waves', 'industrialist_style'],
      'MODERN_ERA': ['pompadour', 'side_part', 'short_modern', 'slick_back', 'professional_cut', 'contemporary_fade']
    };
    
    const femaleStyles: Record<string, string[]> = {
      'PREHISTORY': isYoung ? ['braided_long', 'tied_back', 'maiden_wild'] : ['long_wild', 'braided_long', 'tied_back', 'tribal_braids', 'elder_knots'],
      'ANTIQUITY': ['greek_bun', 'roman_waves', 'braided_crown', 'goddess_locks', 'priestess_style'],
      'MEDIEVAL': isYoung ? ['long_plaits', 'maiden_braids', 'novice_style'] : ['braided_buns', 'covered_hair', 'long_plaits', 'courtly_braids', 'noble_wimple'],
      'RENAISSANCE_EARLY_MODERN': ['elaborate_braids', 'side_curls', 'high_forehead', 'pearl_net', 'renaissance_rolls'],
      'INDUSTRIAL_ERA': isYoung ? ['gibson_girl', 'loose_curls', 'young_lady_style'] : ['victorian_updo', 'gibson_girl', 'elaborate_bun', 'chignon', 'matron_waves'],
      'MODERN_ERA': isYoung ? ['bob_cut', 'finger_waves', 'flapper_style'] : ['bob_cut', 'finger_waves', 'pin_curls', 'victory_rolls', 'marcel_waves', 'modern_sophisticated']
    };
    
    const styles = (isFemale ? femaleStyles[era] : maleStyles[era]) || maleStyles['MEDIEVAL'];
    return styles[Math.floor(noise.random() * styles.length)];
}

function getNeighboringMapAreas(currentRegion: string, currentZone: CulturalZone): MapAreaDefinition[] {
    const neighbors: MapAreaDefinition[] = [];
    const currentRegionDef = GEOGRAPHICAL_DATA[currentZone]?.[currentRegion];
    if (!currentRegionDef) return [];

    const currentAreaName = Object.keys(currentRegionDef)[0]; // Assuming one area per region for simplicity
    const adjacencies = ADJACENCIES[currentAreaName];
    if (!adjacencies) return [];

    for (const dir in adjacencies) {
        const neighborKey = adjacencies[dir as keyof typeof adjacencies];
        if (neighborKey) {
            for (const zone in GEOGRAPHICAL_DATA) {
                for (const region in GEOGRAPHICAL_DATA[zone as CulturalZone]) {
                     if (GEOGRAPHICAL_DATA[zone as CulturalZone]?.[region]?.[neighborKey]) {
                        neighbors.push(GEOGRAPHICAL_DATA[zone as CulturalZone][region][neighborKey]);
                    }
                }
            }
        }
    }
    return neighbors;
}

function generateBirthplace(noise: ValueNoise, context: { region: string, culturalZone: CulturalZone }): string {
    const roll = noise.random();

    // 20% chance to be from a neighboring region's city
    if (roll < 0.20) {
        const neighbors = getNeighboringMapAreas(context.region, context.culturalZone);
        if (neighbors.length > 0) {
            const neighbor = neighbors[Math.floor(noise.random() * neighbors.length)];
            return `the city of ${neighbor.name}`;
        }
    }
    
    // 30% chance to be from a neighboring region's village
    if (roll < 0.50) {
        const neighbors = getNeighboringMapAreas(context.region, context.culturalZone);
        if (neighbors.length > 0) {
            const neighbor = neighbors[Math.floor(noise.random() * neighbors.length)];
            return `a small village near ${neighbor.name}`;
        }
    }

    // 50% chance to be from the local region
    return `a small village in the region of ${context.region}`;
}

export function generateCompleteOutfit(
    culturalZone: CulturalZone,
    era: HistoricalEra,
    wealthLevel: WealthLevel,
    gender: Gender
): {
    garment: ClothingPiece;
    headgear: ClothingPiece;
    footwear: ClothingPiece;
    belt: ClothingPiece;
    accessory: ClothingPiece;
} {
    const clothingSet = getClothingData(culturalZone, era, wealthLevel, gender);
    
    return {
        garment: getRandomClothingPiece(clothingSet.garments),
        headgear: getRandomClothingPiece(clothingSet.headgear),
        footwear: getRandomClothingPiece(clothingSet.footwear),
        belt: getRandomClothingPiece(clothingSet.belts),
        accessory: getRandomClothingPiece(clothingSet.accessories),
    };
}


/**
 * Enhanced base profile generation with improved error handling and logging
 */
export function generateBaseProfile(noise: ValueNoise, context: { era: HistoricalEra, culturalZone: CulturalZone, region: string }): Omit<NpcEntity, 'id' | 'name' | 'class' | 'role' | 'descriptions' | 'movement' | 'x' | 'y' | 'emoji' | 'activity' | 'workplaceId' | 'workplaceName'> {
    try {
        if (!noise || typeof noise.random !== 'function') {
            noise = { random: () => Math.random() } as ValueNoise;
        }
        
        const generateStat = (base: number = 5, variance: number = 5) => Math.max(1, Math.min(10, base + Math.floor((noise.random() - 0.5) * variance)));
        
        const stats: CharacterStats = {
            strength: generateStat(), dexterity: generateStat(), stamina: generateStat(), constitution: generateStat(),
            intelligence: generateStat(), wisdom: generateStat(), charisma: generateStat(), perception: generateStat(),
            craftiness: generateStat(), persuasion: generateStat(), luck: generateStat(),
            level: 1,  attack: 0, defense: 0, physicalResist: 0, dodgeBonus: 0,
        };
        
        stats.attack = Math.max(1, Math.floor(stats.strength / 2));
        stats.defense = Math.max(1, Math.floor((stats.constitution + stats.dexterity) / 3));
        stats.level = 1 + Math.floor(noise.random() * 5);

        const personality: CharacterPersonality = {
            openness: Math.max(0, Math.min(1, noise.random())),
            conscientiousness: Math.max(0, Math.min(1, noise.random())),
            extraversion: Math.max(0, Math.min(1, noise.random())),
            agreeableness: Math.max(0, Math.min(1, noise.random())),
            neuroticism: Math.max(0, Math.min(1, noise.random())),
        };
        
        const socialContext: CharacterSocialContext = {
            privilege: Math.max(0, Math.min(1, noise.random())),
            wanderlust: Math.max(0, Math.min(1, noise.random())),
            religiosity: Math.max(0, Math.min(1, noise.random())),
            ambition: Math.max(0, Math.min(1, noise.random())),
            entrepreneurial: Math.max(0, Math.min(1, noise.random())),
        };

        const gender: Gender = noise.random() > 0.5 ? 'Male' : 'Female';
        const age = Math.max(18, Math.min(80, 18 + Math.floor(noise.random() * 50)));

        const p = socialContext.privilege;
        const wealthLevel: WealthLevel = p > 0.95 ? 'noble' : p > 0.8 ? 'wealthy' : p > 0.5 ? 'comfortable' : p > 0.2 ? 'modest' : 'poor';
        
        const currency = 5 + Math.floor(noise.random() * (wealthLevel === 'poor' ? 10 : wealthLevel === 'modest' ? 30 : 100));

        const culturalAppearance = generateCulturalAppearance(context.culturalZone, noise);
        const facialFeatures = generateFacialFeatures(noise, gender, context.culturalZone);
        const bodyMetrics = generateBodyMetrics(gender, stats, noise);
        
        const clothingPalette = generateClothingPalette(wealthLevel, context.era, context.culturalZone, gender, noise);
        const clothingPieces = generateCompleteOutfit(context.culturalZone, context.era, wealthLevel, gender);

        
        const religion = determineReligion(context.culturalZone, context.region, context.era, noise);
        const birthplace = generateBirthplace(noise, context);
        const hairstyle = getHairstyle(context.era, gender, noise);

        let affect = 'neutral';
        if (personality.extraversion > 0.75) affect = 'friendly';
        if (personality.agreeableness < 0.25) affect = 'guarded';
        if (personality.neuroticism > 0.8) affect = 'anxious';
        if (stats.strength > 8 && personality.agreeableness < 0.4) affect = 'intimidating';

        const appearance: Appearance = {
            ...culturalAppearance,
            ...facialFeatures,
            ...bodyMetrics,
            ...clothingPieces,
            affect,
            hairstyle,
            palette: clothingPalette,
        };

        const maxHealth = 80 + stats.constitution * 2;
        
        const profileInProgress: any = {
            stats, personality, socialContext, age, gender, wealthLevel, religion,
            appearance,
            health: maxHealth, maxHealth,
            targetX: 0, targetY: 0, direction: 'down' as const,
            walkFrame: 0, onRoad: false, era: context.era, culturalZone: context.culturalZone,
            statusEffects: [],
            birthplace,
            backstory: '',
            family: [],
            lifeEvents: [],
            memory: { opinionOfPlayer: 0, knownFactsAboutPlayer: new Set<string>(), relationships: new Map(), conversationSummaries: [] },
            inventory: [],
            currency,
            aiState: 'wandering'
        };

        // Now, assign beliefs to this partial profile.
        const beliefData = assignBeliefs(profileInProgress as NpcEntity, noise);
        profileInProgress.ideology = beliefData.ideology;
        profileInProgress.beliefs = beliefData.beliefs;

        // With beliefs assigned, we can now safely generate the goal.
        profileInProgress.personalGoal = generatePersonalGoal(profileInProgress as NpcEntity, noise);
        
        return profileInProgress as Omit<NpcEntity, 'id' | 'name' | 'class' | 'role' | 'descriptions' | 'movement' | 'x' | 'y' | 'emoji' | 'activity' | 'workplaceId' | 'workplaceName'>;
        
    } catch (error) {
        console.error('[NPC Utils] Profile generation failed, using minimal fallback:', error);
        // This is an absolute fallback in case of a critical error.
        return {
            stats: { strength: 5, dexterity: 5, stamina: 5, constitution: 5, intelligence: 5, wisdom: 5, charisma: 5, perception: 5, craftiness: 5, persuasion: 5, luck: 5, level: 1, attack: 3, defense: 3, physicalResist: 0, dodgeBonus: 0 },
            personality: { openness: 0.5, conscientiousness: 0.5, extraversion: 0.5, agreeableness: 0.5, neuroticism: 0.5 },
            socialContext: { privilege: 0.3, wanderlust: 0.5, religiosity: 0.5, ambition: 0.5, entrepreneurial: 0.5 },
            age: 30, gender: 'Male', wealthLevel: 'modest', religion: 'Agnostic',
            appearance: {
                skinColor: '#f4d1ae', hairColor: '#8b4513', eyeColor: '#654321', hairstyle: 'short_cropped',
                height: 175, build: 'average', weight: 70, facialHair: false,
                affect: 'neutral',
                garment: { name: 'Tunic', material: 'Linen' },
                belt: { name: 'Leather Belt', material: 'Leather' },
                footwear: { name: 'Leather Shoes', material: 'Leather' },
                headgear: { name: 'None', material: 'None' },
                accessory: { name: 'None', material: 'None' },
                palette: { primary: '#8B4513', secondary: '#654321', accent: '#D2691E' }
            } as any,
            health: 90, maxHealth: 90,
            targetX: 0, targetY: 0, direction: 'down', walkFrame: 0, onRoad: false,
            era: context.era || HistoricalEra.MEDIEVAL, culturalZone: context.culturalZone || 'EUROPEAN',
            statusEffects: [],
            birthplace: 'an unknown village',
            backstory: 'An unknown person with a mysterious past.',
            family: [],
            lifeEvents: [],
            personalGoal: { archetype: 'PROTECT', targetType: 'CONCEPT', targetId: 'SELF', description: 'Survive.' },
            ideology: 'Pragmatism',
            beliefs: [{ beliefId: 'SURVIVAL_FIRST', conviction: 100 }],
            memory: { opinionOfPlayer: 0, knownFactsAboutPlayer: new Set(), relationships: new Map(), conversationSummaries: [] },
            inventory: [],
            currency: 10,
            aiState: 'wandering',
        };
    }
}

function generateCulturalAppearance(culturalZone: CulturalZone, noise: ValueNoise) {
    const appearances: Record<string, {skinTones: string[], hairColors: string[], eyeColors: string[]}> = {
        'EAST_ASIAN': { skinTones: ['#fdbcb4', '#f4d1ae', '#e8c5a0', '#deb887', '#f0dcc4'], hairColors: ['#000000', '#1a0a05', '#2c1810', '#0f0f0f'], eyeColors: ['#2c1810', '#000000', '#1a1a1a', '#342c24'] },
        'EUROPEAN': { skinTones: ['#fde2d1', '#f4d1ae', '#e8c5a0', '#deb887', '#d2b48c', '#f5e6d3'], hairColors: ['#8b4513', '#654321', '#d4af37', '#dc7633', '#000000', '#696969', '#2c1810', '#f4d03f', '#b22222', '#daa520'], eyeColors: ['#4169e1', '#006400', '#8b4513', '#2c1810', '#654321', '#708090', '#87ceeb', '#228b22'] },
        'SUB_SAHARAN_AFRICAN': { skinTones: ['#8d5524', '#654321', '#4a3018', '#3c241a', '#2d1b0f', '#a0835a'], hairColors: ['#000000', '#1a0a05', '#0a0a0a'], eyeColors: ['#2c1810', '#000000', '#1a1a1a'] },
        'MENA': { skinTones: ['#deb887', '#d2b48c', '#bc9a6a', '#a0835a', '#e6d2b0'], hairColors: ['#000000', '#2c1810', '#654321', '#1a1a1a'], eyeColors: ['#2c1810', '#654321', '#000000', '#8b4513', '#2f4f4f'] },
        'SOUTH_ASIAN': { skinTones: ['#bc9a6a', '#a0835a', '#8d5524', '#deb887', '#cd853f'], hairColors: ['#000000', '#2c1810', '#1a1a1a'], eyeColors: ['#2c1810', '#000000', '#654321', '#1a1a1a'] },
        'SOUTH_AMERICAN': { skinTones: ['#bc9a6a', '#a0835a', '#d2b48c', '#8d5524', '#deb887'], hairColors: ['#000000', '#2c1810', '#1a1a1a'], eyeColors: ['#2c1810', '#000000', '#654321', '#1a1a1a'] },
        'NORTH_AMERICAN_PRE_COLUMBIAN': { skinTones: ['#bc9a6a', '#a0835a', '#d2b48c', '#8d5524'], hairColors: ['#000000', '#2c1810', '#1a1a1a'], eyeColors: ['#2c1810', '#000000', '#654321'] },
        'OCEANIA': { skinTones: ['#8d5524', '#a0835a', '#bc9a6a', '#654321', '#4a3018'], hairColors: ['#000000', '#2c1810', '#654321', '#1a1a1a'], eyeColors: ['#2c1810', '#000000', '#654321'] }
    };
    const appearance = appearances[culturalZone] || appearances['EUROPEAN'];
    return {
        skinColor: appearance.skinTones[Math.floor(noise.random() * appearance.skinTones.length)],
        hairColor: appearance.hairColors[Math.floor(noise.random() * appearance.hairColors.length)],
        eyeColor: appearance.eyeColors[Math.floor(noise.random() * appearance.eyeColors.length)]
    };
}


function getFallbackRole(wealth: WealthLevel, gender: Gender): { socialClass: string, role: string, emoji: string, nameKey?: string } {
    const commonerRoles = [
        { role: 'Laborer', emoji: '🧑‍🔧', gender: 'any' },
        { role: 'Wanderer', emoji: '🚶', gender: 'any' },
        { role: 'Farmer', emoji: '🧑‍🌾', gender: 'any' },
        { role: 'Shepherd', emoji: '🐑', gender: 'any' },
        { role: 'Potter', emoji: '🏺', gender: 'Male' },
        { role: 'Weaver', emoji: '🧶', gender: 'Female' },
        { role: 'Caretaker', emoji: '🧑‍⚕️', gender: 'Female' },
        { role: 'Child Watcher', emoji: '👶', gender: 'Female' },
        { role: 'Mother', emoji: '🤱', gender: 'Female' },
    ];

    const suitableRoles = commonerRoles.filter(r => r.gender === 'any' || r.gender === gender);

    if (suitableRoles.length > 0) {
        const chosen = suitableRoles[Math.floor(Math.random() * suitableRoles.length)];
        return { socialClass: 'COMMONER', role: chosen.role, emoji: chosen.emoji };
    }
    
    // Ultimate fallback if no suitable role found (e.g. for Non-binary gender)
    if (wealth === 'poor' || wealth === 'modest') {
        return { socialClass: 'COMMONER', role: 'Laborer', emoji: '🧑‍🔧' };
    }
    return { socialClass: 'COMMONER', role: 'Wanderer', emoji: '🚶' };
}

export function determineSocialRole(
    profile: Omit<NpcEntity, 'id' | 'name' | 'class' | 'role' | 'descriptions' | 'movement' | 'x' | 'y' | 'emoji' | 'activity' | 'birthplace' | 'workplaceId' | 'workplaceName' | 'ideology' | 'beliefs'>,
    context: { era: HistoricalEra, culturalZone: CulturalZone, factionData?: FactionData, region?: string, citySize?: number },
    preferredRole?: string,
    structureType?: TerrainStructureType
): { socialClass: string, role: string, emoji: string, nameKey?: string } {
    try {
        // If a specific role is requested (e.g., from a court or anchor), use it directly.
        if (preferredRole && context.factionData?.courtRoles && structureType && context.factionData.courtRoles[structureType]) {
            const courtRoles = context.factionData.courtRoles[structureType]!;
            const role = courtRoles.includes(preferredRole) ? preferredRole : courtRoles[0];
            return { socialClass: 'NOBILITY', role: role, emoji: '👑', nameKey: undefined };
        }

        let eraForProfessions: HistoricalEra;

        if (context.era.endsWith('s')) { // This is a decade string like "1940s"
            const year = parseInt(context.era.slice(0, 4), 10);
            if (year >= 1900) {
                eraForProfessions = HistoricalEra.MODERN_ERA;
            } else {
                eraForProfessions = HistoricalEra.INDUSTRIAL_ERA; // fallback
            }
        } else {
            eraForProfessions = context.era as HistoricalEra;
        }

        const eraRoles: SocialClassMap | undefined = PROFESSIONS[context.culturalZone]?.[eraForProfessions];

        if (!eraRoles) return getFallbackRole(profile.wealthLevel, profile.gender);

        // Get the appropriate profession context based on location
        let professionContext: ProfessionContext | null = null;
        if (eraForProfessions === HistoricalEra.INDUSTRIAL_ERA) {
            professionContext = getProfessionContext(
                context.region,
                structureType,
                context.citySize,
                context.culturalZone,
                eraForProfessions
            );
        }

        if (preferredRole) {
            for (const socialClass in eraRoles) {
                // Skip social classes that don't match our context
                if (professionContext && socialClass !== professionContext) {
                    // Check if this socialClass matches our fallback context
                    const fallback = getFallbackContext(professionContext, eraForProfessions);
                    if (socialClass !== fallback && socialClass !== 'GENERAL') {
                        continue;
                    }
                }
                
                if (eraRoles[socialClass]?.[preferredRole]) {
                    const roleDef = eraRoles[socialClass][preferredRole];
                     if (roleDef.genderBias && profile.gender !== 'Non-binary' && roleDef.genderBias !== profile.gender) {
                        continue; 
                    }
                    return { socialClass, role: preferredRole, emoji: roleDef.emoji || '🧑', nameKey: roleDef.nameKey };
                }
            }
        }
        
        const possibleRoles: { socialClass: string, role: string, roleDef: ProfessionDefinition }[] = [];

        for (const socialClass in eraRoles) {
            // Apply context filtering for Industrial Era
            if (professionContext && socialClass !== professionContext) {
                // Allow fallback contexts
                const fallback = getFallbackContext(professionContext, eraForProfessions);
                if (socialClass !== fallback && socialClass !== 'GENERAL' && socialClass !== 'COMMONER') {
                    continue;
                }
            }
            const rolesInClass = eraRoles[socialClass];
            for (const roleName in rolesInClass) {
                const roleDef = rolesInClass[roleName];
                
                if (roleDef.genderBias && profile.gender !== 'Non-binary' && roleDef.genderBias !== profile.gender) {
                    continue;
                }

                let score = 100;
                
                const checkStat = (value: number, min?: number, max?: number): number => {
                    if (min !== undefined && value < min) return -1000;
                    if (max !== undefined && value > max) return -1000;
                    let closeness = 0;
                    if (min !== undefined) closeness += 10 - (value - min);
                    if (max !== undefined) closeness += 10 - (max - value);
                    return closeness;
                };

                for (const statKey in roleDef.statRequirements) {
                    const key = statKey as keyof typeof roleDef.statRequirements;
                    const req = roleDef.statRequirements[key];
                    let statName: keyof CharacterStats | null = null;
                    if (key.startsWith('min')) statName = key.replace('min', '').toLowerCase() as keyof CharacterStats;
                    if (key.startsWith('max')) statName = key.replace('max', '').toLowerCase() as keyof CharacterStats;
                    
                    if (statName) {
                        score += checkStat(profile.stats[statName], req, undefined);
                    }
                }

                if (score > 0 && roleDef.socialRequirements) {
                     for (const socialKey in roleDef.socialRequirements) {
                        const key = socialKey as keyof typeof roleDef.socialRequirements;
                        const req = roleDef.socialRequirements[key];
                        let statName: keyof CharacterSocialContext | null = null;
                         if (key.startsWith('min')) statName = key.replace('min', '').toLowerCase() as keyof CharacterSocialContext;
                        if (key.startsWith('max')) statName = key.replace('max', '').toLowerCase() as keyof CharacterSocialContext;

                        if (statName) {
                            score += checkStat(profile.socialContext[statName], req, undefined);
                        }
                     }
                }

                if (score > 0) {
                     possibleRoles.push({ socialClass, role: roleName, roleDef });
                }
            }
        }
        
        if (possibleRoles.length > 0) {
            const chosen = possibleRoles[Math.floor(Math.random() * possibleRoles.length)];
            return { socialClass: chosen.socialClass, role: chosen.role, emoji: chosen.roleDef.emoji || '🧑', nameKey: chosen.roleDef.nameKey };
        }

        return getFallbackRole(profile.wealthLevel, profile.gender);
    } catch (error) {
        console.error("Error determining social role:", error);
        return getFallbackRole(profile.wealthLevel, profile.gender);
    }
}

export function generateNpcPortraitData(npc: NpcEntity) {
    const seed = parseInt(npc.id.replace(/\D/g, '').slice(-9)) || (npc.id.charCodeAt(0) + npc.x * 13 + npc.y * 31 + npc.age);

    return {
        era: npc.era,
        culturalZone: npc.culturalZone,
        gender: npc.gender,
        wealth: npc.wealthLevel,
        socialClass: npc.class,
        profession: npc.role,
        seed: seed,
        appearance: npc.appearance
    };
}


export function assignBeliefs(
    character: NpcEntity | PlayerCharacter,
    noise: ValueNoise
): { ideology: string, beliefs: { beliefId: string; conviction: number }[] } {
    const { culturalZone, era, religion, personality, socialContext } = character;

    // 1. Find suitable ideologies by sanitizing IDEOLOGIES array first
    const suitableIdeologies = IDEOLOGIES.filter(Boolean).filter(ideo => 
        ideo.culturalZones.includes(culturalZone) &&
        ideo.eras.includes(era) &&
        ideo.religions.includes(religion)
    );

    let chosenIdeology: Ideology | undefined = suitableIdeologies[Math.floor(noise.random() * suitableIdeologies.length)];

    // 2. Graceful Fallback System
    if (!chosenIdeology) {
        let fallbackId = 'FOLK_BELIEFS_GENERIC';
        if (era === HistoricalEra.PREHISTORY) {
            fallbackId = 'PREHISTORIC_ANIMISM';
        } else if (era === HistoricalEra.MODERN_ERA || era === HistoricalEra.FUTURE_ERA) {
            fallbackId = 'MODERN_SECULARISM';
        }
        chosenIdeology = IDEOLOGIES.filter(Boolean).find(ideo => ideo.id === fallbackId);
    }
    
    // 3. Absolute Fallback to prevent crashes
    if (!chosenIdeology) {
        console.warn(`[NPC Utils] Beliefs Fallback Failed: Could not find any suitable ideology for era '${era}'. Returning default empty belief set.`);
        return { ideology: 'Pragmatism', beliefs: [{ beliefId: 'SURVIVAL_FIRST', conviction: 100 }] };
    }

    // 4. Assign personal beliefs
    const personalBeliefs: { beliefId: string; conviction: number }[] = [];
    const beliefIds = Object.keys(chosenIdeology.associatedBeliefs);

    let attempts = 0;
    const numBeliefsToAssign = 3 + Math.floor(noise.random() * 3); // 3-5 beliefs

    while (personalBeliefs.length < numBeliefsToAssign && attempts < 50) {
        attempts++;
        const randomBeliefId = beliefIds[Math.floor(noise.random() * beliefIds.length)];
        
        if (!randomBeliefId || personalBeliefs.some(b => b.beliefId === randomBeliefId)) {
            continue; // Skip if already assigned or invalid
        }
        
        const baseChance = chosenIdeology.associatedBeliefs[randomBeliefId];
        let modifier = 0;

        // Modify chance based on personality
        const beliefDef = PERSONAL_BELIEFS.find(b => b.id === randomBeliefId);
        if (beliefDef && personality && socialContext) {
            if (beliefDef.tags.includes('religious')) modifier += (socialContext.religiosity - 0.5) * 0.3;
            if (beliefDef.tags.includes('progressive')) modifier += (personality.openness - 0.5) * 0.3;
            if (beliefDef.tags.includes('traditional')) modifier -= (personality.openness - 0.5) * 0.3;
            if (beliefDef.tags.includes('ethical') && beliefDef.tags.includes('community')) modifier += (personality.agreeableness - 0.5) * 0.2;
        }

        if (noise.random() < baseChance + modifier) {
            const conviction = 50 + Math.floor(noise.random() * 51); // 50-100 conviction
            personalBeliefs.push({ beliefId: randomBeliefId, conviction });
        }
    }
    
    return {
        ideology: chosenIdeology.id,
        beliefs: personalBeliefs,
    };
}