/**
 * services/characterGenerator.ts - Enhanced character service with portrait integration
 */
import { PlayerCharacter, HistoricalEra, Item, CharacterStats, CharacterPersonality, CharacterSocialContext, Appearance, ClothingPiece, ClothingPalette, MapAreaDefinition } from '../types';
import { PROFESSIONS, CHARACTER_NAMES, CulturalZone, STARTING_PACKAGES, ProfessionDefinition, PERSONAL_BELIEFS } from '../constants/index';
import { parseDateString } from '../utils/dateUtils';
import { createItemInstance, addItemToInventory, assembleStartingPackage } from '../utils/inventoryUtils';
import { ValueNoise } from '../utils/noise';
import { generateBaseProfile, determineSocialRole, generateNpcName, assignBeliefs, generateClothingPalette } from '../generation/common/npcUtils';
import { mapLocationToCulture } from '../utils/mapUtils';
import { hexToColorName } from '../utils/colorUtils';

let characterIdCounter = 0;

interface GenerationContext {
    date: string;
    location: string;
    region: string; // NEW
}

function cmToFeetAndInches(cm: number): string {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}' ${inches}"`;
}

// Enhanced backstory that incorporates personality and removes clothing descriptions
function _generateProceduralBackstory(character: Omit<PlayerCharacter, 'backstory' | 'id' | 'inventory' | 'party' | 'eventLog' | 'profileImage' | 'isLlmEnhanced'>): string {
    const sentences = [];
    const heightStr = cmToFeetAndInches(character.appearance.height);

    // Sentence 1: Origin and Profession
    sentences.push(`Hailing from ${character.birthplace}, you are ${character.name}, a ${character.age}-year-old ${character.gender.toLowerCase()} who has made a name for themselves as a ${character.profession}.`);

    // Sentence 2: Physical Description
    const eyeColorName = hexToColorName(character.appearance.eyeColor);
    const hairColorName = hexToColorName(character.appearance.hairColor);
    let physicalDesc = `You have a ${character.appearance.build} build, standing at ${heightStr}. Your eyes are a shade of ${eyeColorName} and your hair is a ${hairColorName} color, styled in a ${character.appearance.hairstyle.replace(/_/g, ' ')} fashion.`;
    if (character.appearance.facialHair && character.appearance.facialHairStyle) {
        physicalDesc += ` You wear a ${character.appearance.facialHairStyle.replace(/_/g, ' ')}.`;
    }
    sentences.push(physicalDesc);

    // Sentence 3: Personality/Demeanor
    let demeanorSentence = `You carry yourself with a ${character.appearance.affect} demeanor.`;
    if (character.personality.agreeableness < 0.3) {
        demeanorSentence += " Few would call you approachable, but many respect your directness.";
    } else if (character.personality.openness > 0.8) {
        demeanorSentence += " Your curiosity about the world and its mysteries is palpable.";
    } else if (character.personality.conscientiousness > 0.8) {
        demeanorSentence += " You are known for your meticulous and reliable nature.";
    } else {
        demeanorSentence += `carrying themselves with a quiet, unassuming presence.`;
    }
    sentences.push(demeanorSentence);

    // Sentence 4: Guiding Principle/Belief
    if (character.beliefs && character.beliefs.length > 0) {
        const coreBeliefEntry = [...character.beliefs].sort((a,b) => b.conviction - a.conviction)[0];
        const coreBelief = PERSONAL_BELIEFS.find(b => b.id === coreBeliefEntry.beliefId);
        if (coreBelief) {
             let beliefText = coreBelief.text.toLowerCase().replace('believes that', '').replace('believes in', '').trim();
             let consequence = '';
             switch(coreBelief.id) {
                case 'DIVINE_RIGHT_OF_KINGS':
                    consequence = "a conviction that has earned you both powerful friends and determined enemies.";
                    break;
                case 'MIGHT_IS_RIGHT': 
                    consequence = "a worldview that has served you well in averting conflict, though some find it callous."; 
                    break;
                case 'INDIVIDUAL_LIBERTY': 
                    consequence = "a philosophy that often puts you at odds with figures of authority."; 
                    break;
                case 'HONOR_IS_ALL': 
                    consequence = "a principle that has both opened and closed many doors for you."; 
                    break;
                case 'FATE_IS_INEXORABLE': 
                    consequence = "a belief that brings you peace in trying times, even if others call it passivity."; 
                    break;
                default:
                     consequence = "a guiding principle that shapes your interactions with the world.";
                     break;
             }
             sentences.push(`You are guided by the simple principle that ${beliefText}; ${consequence}`);
        }
    } else {
        if (character.socialContext.wanderlust > 0.8) {
            sentences.push(`A deep-seated wanderlust has always pulled you toward the horizon, making it difficult to ever truly settle down.`);
        } else if (character.socialContext.ambition > 0.8) {
            sentences.push(`A fierce ambition drives you to seek wealth and power, leaving little room for sentiment.`);
        } else {
             sentences.push(`You are guided by the simple principle that the old ways are the best ways.; a guiding principle that shapes your interactions with the world.`);
        }
    }

    return sentences.join(' ');
}


/**
 * Enhanced character generation with portrait clothing integration
 */
export function generateCharacter(context: GenerationContext): PlayerCharacter {
    console.log('[Character Generator] Starting enhanced character generation');
    
    const noise = new ValueNoise(Date.now() + Math.random() * 10000);
    const dateInfo = parseDateString(context.date);
    const culturalZone = mapLocationToCulture(context.location, dateInfo.year);
    const generationContext = { 
        era: dateInfo.era as HistoricalEra, 
        culturalZone,
        region: context.region,
    };
    
    const baseProfile = generateBaseProfile(noise, generationContext);
    const { socialClass, role, nameKey } = determineSocialRole(baseProfile, generationContext);
    const name = generateNpcName(baseProfile.gender, culturalZone, context.region, dateInfo.year, noise, nameKey);
    
    // Get starting package and inventory first
    const { inventory, equippedItems } = assembleStartingPackage(role);

    // Generate a color palette based on context
    const palette = generateClothingPalette(baseProfile.wealthLevel, generationContext.era, culturalZone, baseProfile.gender, noise);
    
    // Build the final appearance object, prioritizing equipped items for the description
    const finalAppearance: Appearance = {
        ...baseProfile.appearance,
        palette: palette,
        garment: equippedItems.torso 
            ? { name: equippedItems.torso.name, material: equippedItems.torso.material || 'cloth' } 
            : baseProfile.appearance.garment,
        headgear: equippedItems.head 
            ? { name: equippedItems.head.name, material: equippedItems.head.material || 'cloth' } 
            : baseProfile.appearance.headgear,
        footwear: equippedItems.feet 
            ? { name: equippedItems.feet.name, material: equippedItems.feet.material || 'leather' } 
            : baseProfile.appearance.footwear,
        belt: equippedItems.belt 
            ? { name: equippedItems.belt.name, material: equippedItems.belt.material || 'leather' } 
            : baseProfile.appearance.belt,
        accessory: equippedItems.amulet 
            ? { name: equippedItems.amulet.name, material: equippedItems.amulet.material || 'metal' } 
            : baseProfile.appearance.accessory,
    };
    
    const maxHealth = 80 + baseProfile.stats.constitution * 2 + baseProfile.stats.strength;
    const startingHealth = Math.floor(maxHealth * (0.8 + Math.random() * 0.2)); // 80-100% of max health
    
    // Randomize fatigue based on time of day and character stats
    const timeOfDay = generationContext.date ? new Date(generationContext.date).getHours() : 12;
    let baseFatigue: number;
    
    // More tired at night, less tired during day
    if (timeOfDay >= 22 || timeOfDay <= 5) {
        baseFatigue = 70 + Math.random() * 30; // 70-100% tired at night
    } else if (timeOfDay >= 6 && timeOfDay <= 9) {
        baseFatigue = 20 + Math.random() * 30; // 20-50% tired in morning
    } else {
        baseFatigue = 30 + Math.random() * 40; // 30-70% tired during day
    }
    
    // Constitution affects fatigue resistance 
    const constitutionBonus = baseProfile.stats.constitution - 10;
    const startingFatigue = Math.max(10, Math.min(100, baseFatigue - constitutionBonus * 3));
    
    const staticPortraitSeed = Math.floor(Math.random() * 1000000);
    
    const partialCharacter: Omit<PlayerCharacter, 'backstory' | 'id' | 'inventory' | 'party' | 'eventLog' | 'profileImage' | 'isLlmEnhanced'> = {
        ...baseProfile,
        name,
        class: socialClass,
        profession: role,
        level: 1,
        experience: 0,
        maxExperience: 100,
        health: startingHealth,
        maxHealth: maxHealth,
        fatigue: Math.floor(startingFatigue),
        maxFatigue: 100,
        currency: 10 + Math.floor(noise.random() * 20),
        era: generationContext.era,
        culturalZone: generationContext.culturalZone,
        portraitSeed: staticPortraitSeed,
        family: [], // Initialize empty
        lifeEvents: [], // Initialize empty
        mapReputation: 50, // Initialize reputation
        appearance: finalAppearance, // Use the synced appearance object
        equippedItems,
    };
    
    // The backstory is generated from the final, consistent character data
    // Beliefs are already part of baseProfile, so this will work correctly.
    const backstory = _generateProceduralBackstory(partialCharacter as PlayerCharacter);
    
    const currentYear = dateInfo.year;
    const birthYear = currentYear - partialCharacter.age;
    partialCharacter.lifeEvents.push({ year: birthYear, event: `Born in the region of ${context.region}.`});
    if (partialCharacter.age > 16) {
        partialCharacter.lifeEvents.push({ year: birthYear + 16, event: `Came of age and began training as a ${role}.`});
    }
     if (partialCharacter.age > 25 && noise.random() > 0.5) {
        partialCharacter.lifeEvents.push({ year: birthYear + 22, event: `Left home to seek fortune.`});
    }


    const fatherName = generateNpcName('Male', culturalZone, context.region, currentYear - partialCharacter.age - 25, noise);
    partialCharacter.family.push({ name: fatherName, relation: 'father', profession: 'Farmer' });
    const motherName = generateNpcName('Female', culturalZone, context.region, currentYear - partialCharacter.age - 25, noise);
    partialCharacter.family.push({ name: motherName, relation: 'mother', profession: 'Homemaker' });


    const character: PlayerCharacter = {
        ...(partialCharacter as any), // Cast to get around Omit typing temporarily
        id: `pc-${characterIdCounter++}`,
        backstory,
        inventory,
        party: [],
        eventLog: [],
        profileImage: 'placeholder.png', // This will be replaced by the procedural portrait component
        isLlmEnhanced: false,
    };
    
    console.log(`[Character Generator] Generated character ${name}, a ${role} with static portrait seed ${staticPortraitSeed}`);
    
    return character;
}