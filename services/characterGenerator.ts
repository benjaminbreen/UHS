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
import { CharacterSpecification } from './worldWeaverService';
import DiseaseService from './diseaseService';

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
/**
 * Generate a character with custom specifications from World Weaver
 */
export function generateCharacterWithSpec(context: GenerationContext, spec?: CharacterSpecification | null): PlayerCharacter {
    console.log('[Character Generator] Generating character with spec:', spec);
    
    // If no spec provided, use the standard generator
    if (!spec) {
        return generateCharacter(context);
    }
    
    const noise = new ValueNoise(Date.now() + Math.random() * 10000);
    const dateInfo = parseDateString(context.date);
    const culturalZone = mapLocationToCulture(context.location, dateInfo.year);
    const generationContext = { 
        era: dateInfo.era as HistoricalEra, 
        culturalZone,
        region: context.region,
    };
    
    // Generate base profile but allow overrides from spec
    let baseProfile = generateBaseProfile(noise, generationContext);
    
    // Apply custom specifications
    if (spec.gender) {
        baseProfile.gender = spec.gender === 'male' ? 'Male' : 'Female';
    }
    
    if (spec.age !== undefined && spec.age !== null) {
        baseProfile.age = spec.age;
    }
    
    // Use custom name if provided
    if (spec.name) {
        baseProfile.name = spec.name;
    }
    
    // Handle health specification
    if (spec.health) {
        switch (spec.health) {
            case 'sickly':
                baseProfile.stats.constitution = 6 + Math.floor(noise.random() * 3); // 6-8
                baseProfile.stats.strength = 6 + Math.floor(noise.random() * 3); // 6-8
                break;
            case 'unhealthy':
                baseProfile.stats.constitution = 8 + Math.floor(noise.random() * 3); // 8-10
                baseProfile.stats.strength = 8 + Math.floor(noise.random() * 3); // 8-10
                break;
            case 'healthy':
                baseProfile.stats.constitution = 12 + Math.floor(noise.random() * 4); // 12-15
                baseProfile.stats.strength = 12 + Math.floor(noise.random() * 4); // 12-15
                break;
            case 'average':
            default:
                // Keep randomly generated stats
                break;
        }
    }
    
    // Handle social class
    let socialClass = baseProfile.socialContext.socialClass;
    let role = determineSocialRole(
        baseProfile, 
        {
            era: generationContext.era,
            culturalZone: generationContext.culturalZone,
            region: context.region
        }
    ).role;
    
    if (spec.socialClass) {
        switch (spec.socialClass) {
            case 'peasant':
                socialClass = 'Peasant';
                baseProfile.wealthLevel = 0.1 + noise.random() * 0.2; // 0.1-0.3
                break;
            case 'commoner':
                socialClass = 'Commoner';
                baseProfile.wealthLevel = 0.3 + noise.random() * 0.3; // 0.3-0.6
                break;
            case 'merchant':
                socialClass = 'Merchant';
                baseProfile.wealthLevel = 0.6 + noise.random() * 0.2; // 0.6-0.8
                break;
            case 'noble':
                socialClass = 'Noble';
                baseProfile.wealthLevel = 0.8 + noise.random() * 0.2; // 0.8-1.0
                break;
        }
        baseProfile.socialContext.socialClass = socialClass;
    }
    
    // Handle profession specification
    if (spec.profession && typeof spec.profession === 'string') {
        // Just use the custom profession as-is, capitalizing first letter
        // The assembleStartingPackage function will handle unknown professions with fallback
        role = spec.profession.charAt(0).toUpperCase() + spec.profession.slice(1);
    }
    
    // Generate name - use custom if provided, otherwise generate
    const name = spec.name || generateNpcName(baseProfile.gender, culturalZone, context.region, dateInfo.year, noise, undefined);
    
    // Create a minimal character first for companion generation
    const tempCharacter: Partial<PlayerCharacter> = {
        name,
        profession: role,
        year: dateInfo.year,
    };
    
    // Get starting package and inventory
    const { inventory, equippedItems } = assembleStartingPackage(role, tempCharacter as PlayerCharacter);
    
    // Generate appearance with palette
    const palette = generateClothingPalette(baseProfile.wealthLevel, generationContext.era, culturalZone, baseProfile.gender, noise);
    
    // Helper function to get color name from hex
    const getColorName = (colorHex: string | undefined): string => {
        if (!colorHex) return '';
        
        const hexToColor: Record<string, string> = {
            '#000080': 'Navy', '#001f3f': 'Navy', '#0000ff': 'Blue', '#4169e1': 'Royal',
            '#ff0000': 'Red', '#dc143c': 'Crimson', '#00ff00': 'Green', '#228b22': 'Forest',
            '#ffff00': 'Yellow', '#ffd700': 'Gold', '#800080': 'Purple', '#4b0082': 'Indigo',
            '#ffa500': 'Orange', '#ff8c00': 'Orange', '#964b00': 'Brown', '#8b4513': 'Brown',
            '#000000': 'Black', '#ffffff': 'White', '#c0c0c0': 'Silver', '#808080': 'Gray',
            '#008080': 'Teal', '#40e0d0': 'Turquoise', '#ff7f50': 'Coral', '#deb887': 'Tan',
            '#d2b48c': 'Tan', '#f5deb3': 'Wheat', '#faebd7': 'Ivory',
            // Add fallback brown colors
            '#654321': 'Dark_Brown', '#d2691e': 'Chocolate', '#a52a2a': 'Brown',
            '#704214': 'Dark_Brown', '#8b7355': 'Tan'
        };
        
        const colorHexLower = colorHex.toLowerCase();
        
        // First try exact match
        if (hexToColor[colorHexLower]) {
            return hexToColor[colorHexLower];
        }
        
        // If no exact match, find closest color by comparing RGB values
        const hexToRgb = (hex: string) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        };
        
        const targetRgb = hexToRgb(colorHex);
        if (targetRgb) {
            let minDistance = Infinity;
            let closestColor = 'Gray';
            
            for (const [hex, name] of Object.entries(hexToColor)) {
                const rgb = hexToRgb(hex);
                if (rgb) {
                    const distance = Math.sqrt(
                        Math.pow(targetRgb.r - rgb.r, 2) +
                        Math.pow(targetRgb.g - rgb.g, 2) +
                        Math.pow(targetRgb.b - rgb.b, 2)
                    );
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestColor = name;
                    }
                }
            }
            return closestColor;
        }
        
        return 'Gray'; // Final fallback
    };
    
    // Helper function to check if material is its own color
    const isMaterialColor = (material: string | undefined): boolean => {
        if (!material) return false;
        const materialColors = ['leather', 'hide', 'fur', 'straw', 'iron', 'steel', 'bronze', 
                               'copper', 'brass', 'gold', 'silver', 'wood', 'oak', 'pine', 'bamboo'];
        return materialColors.some(mat => material.toLowerCase().includes(mat));
    };
    
    // Apply colors to equipped items based on palette
    const applyColorToItem = (item: Item, colorHex: string | undefined): Item => {
        if (!colorHex) return item;
        
        // Convert hex to color name
        const hexToColor: Record<string, string> = {
            '#000080': 'Navy',
            '#001f3f': 'Navy',
            '#0000ff': 'Blue',
            '#4169e1': 'Royal Blue',
            '#ff0000': 'Red',
            '#dc143c': 'Crimson',
            '#00ff00': 'Green',
            '#228b22': 'Forest Green',
            '#ffff00': 'Yellow',
            '#ffd700': 'Gold',
            '#800080': 'Purple',
            '#4b0082': 'Indigo',
            '#ffa500': 'Orange',
            '#ff8c00': 'Dark Orange',
            '#964b00': 'Brown',
            '#8b4513': 'Saddle Brown',
            '#000000': 'Black',
            '#ffffff': 'White',
            '#c0c0c0': 'Silver',
            '#808080': 'Gray',
            '#008080': 'Teal',
            '#40e0d0': 'Turquoise',
            '#ff7f50': 'Coral',
            '#deb887': 'Burlywood',
            '#d2b48c': 'Tan',
            '#f5deb3': 'Wheat',
            '#faebd7': 'Antique White',
            '#8b7355': 'Burlywood'
        };
        
        // Find the closest matching color
        let colorName = '';
        const colorHexLower = colorHex.toLowerCase();
        
        // First try exact match
        if (hexToColor[colorHexLower]) {
            colorName = hexToColor[colorHexLower];
        } else {
            // Find closest color by comparing RGB values
            const hexToRgb = (hex: string) => {
                const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                return result ? {
                    r: parseInt(result[1], 16),
                    g: parseInt(result[2], 16),
                    b: parseInt(result[3], 16)
                } : null;
            };
            
            const targetRgb = hexToRgb(colorHex);
            if (targetRgb) {
                let minDistance = Infinity;
                let closestColor = 'Gray';
                
                for (const [hex, name] of Object.entries(hexToColor)) {
                    const rgb = hexToRgb(hex);
                    if (rgb) {
                        const distance = Math.sqrt(
                            Math.pow(targetRgb.r - rgb.r, 2) +
                            Math.pow(targetRgb.g - rgb.g, 2) +
                            Math.pow(targetRgb.b - rgb.b, 2)
                        );
                        if (distance < minDistance) {
                            minDistance = distance;
                            closestColor = name;
                        }
                    }
                }
                colorName = closestColor;
            }
        }
        
        // Check if color is already in the name
        const colorWords = ['navy', 'red', 'blue', 'green', 'yellow', 'purple', 'black', 'white', 'gold', 'silver', 
                           'crimson', 'emerald', 'amber', 'bronze', 'copper', 'ivory', 'ebony', 'maroon', 
                           'olive', 'teal', 'turquoise', 'coral', 'brown', 'gray', 'grey'];
        
        for (const color of colorWords) {
            if (item.name.toLowerCase().includes(color)) {
                // Color already in name, but still store it in the color field
                return {
                    ...item,
                    color: item.name.split(' ')[0] // Extract the color from the name
                };
            }
        }
        
        // Add color to item name and store in color field if we found one
        if (colorName) {
            return {
                ...item,
                name: `${colorName} ${item.name}`,
                color: colorName // Store the color for display in UI
            };
        }
        
        return item;
    };
    
    // For professions without starting packages, generate appropriate headgear
    let professionHeadgear = baseProfile.appearance.headgear;
    
    // Create actual items from appearance data if not provided by starting package
    // This ensures "what you see is what you get" for all equipment
    if (!equippedItems.head && baseProfile.appearance.headgear && 
        baseProfile.appearance.headgear.name !== 'None' && 
        baseProfile.appearance.headgear.name !== 'none') {
        // Create an item from the appearance headgear with color
        let headgearBaseId = baseProfile.appearance.headgear.name.toUpperCase().replace(/ /g, '_');
        
        // Add color prefix if we have a palette color for headgear
        const headColor = getColorName(palette?.secondary);
        if (headColor && !isMaterialColor(baseProfile.appearance.headgear.material)) {
            headgearBaseId = `${headColor.toUpperCase()}_${headgearBaseId}`;
        }
        
        const headItem = createItemInstance(headgearBaseId);
        if (headItem) {
            equippedItems.head = headItem;
            console.log('[CharGen] Created head item from appearance:', headgearBaseId, '→', headItem.name);
        }
    }
    
    if (!equippedItems.torso && !equippedItems.legs && baseProfile.appearance.garment && 
        baseProfile.appearance.garment.name !== 'None' && 
        baseProfile.appearance.garment.name !== 'none') {
        let garmentBaseId = baseProfile.appearance.garment.name.toUpperCase().replace(/ /g, '_');
        
        // Add color prefix if we have a palette color for garments
        const garmentColor = getColorName(palette?.primary);
        if (garmentColor && !isMaterialColor(baseProfile.appearance.garment.material)) {
            garmentBaseId = `${garmentColor.toUpperCase()}_${garmentBaseId}`;
        }
        
        const garmentItem = createItemInstance(garmentBaseId);
        if (garmentItem) {
            // Check if this is a leg item (pants, trousers, etc.) or torso item
            if (garmentItem.equipmentSlot === 'legs') {
                equippedItems.legs = garmentItem;
                console.log('[CharGen] Created legs item from appearance:', garmentBaseId, '→', garmentItem.name);
            } else {
                equippedItems.torso = garmentItem;
                console.log('[CharGen] Created torso item from appearance:', garmentBaseId, '→', garmentItem.name);
            }
        }
    }
    
    if (!equippedItems.feet && baseProfile.appearance.footwear && 
        baseProfile.appearance.footwear.name !== 'None' && 
        baseProfile.appearance.footwear.name !== 'none' &&
        baseProfile.appearance.footwear.name !== 'bare_feet' &&
        baseProfile.appearance.footwear.name !== 'barefoot') {
        let footwearBaseId = baseProfile.appearance.footwear.name.toUpperCase().replace(/ /g, '_');
        
        // Add color prefix if we have a palette color for footwear
        const footColor = getColorName(palette?.secondary);
        if (footColor && !isMaterialColor(baseProfile.appearance.footwear.material)) {
            footwearBaseId = `${footColor.toUpperCase()}_${footwearBaseId}`;
        }
        
        const feetItem = createItemInstance(footwearBaseId);
        if (feetItem) {
            equippedItems.feet = feetItem;
            console.log('[CharGen] Created feet item from appearance:', footwearBaseId, '→', feetItem.name);
        }
    }
    
    // Colors are now applied via baseId when creating items, no need for post-processing
    if (!equippedItems.head && role) {
        // Generate profession-appropriate headgear
        const roleLower = role.toLowerCase();
        if (roleLower.includes('laborer') || roleLower.includes('sweep') || roleLower.includes('miner') || roleLower.includes('smith')) {
            professionHeadgear = { name: 'Leather Cap', material: 'Leather' };
        } else if (roleLower.includes('merchant') || roleLower.includes('trader')) {
            professionHeadgear = { name: 'Felt Hat', material: 'Felt' };
        } else if (roleLower.includes('farmer') || roleLower.includes('peasant')) {
            professionHeadgear = { name: 'Straw Hat', material: 'Straw' };
        } else if (roleLower.includes('scholar') || roleLower.includes('scribe')) {
            professionHeadgear = { name: 'Scholar Cap', material: 'Velvet' };
        } else if (roleLower.includes('soldier') || roleLower.includes('guard')) {
            professionHeadgear = { name: 'Leather Helmet', material: 'Leather' };
        } else if (roleLower.includes('noble') || roleLower.includes('lord')) {
            professionHeadgear = { name: 'Velvet Cap', material: 'Velvet' };
        } else {
            // For other common professions, prefer no headgear or simple headgear
            // Filter out inappropriate items like jeweled tiaras
            const headgearName = professionHeadgear?.name?.toLowerCase() || '';
            if (headgearName.includes('jewel') || headgearName.includes('diamond') || 
                headgearName.includes('tiara') || headgearName.includes('crown') || 
                headgearName.includes('diadem') || headgearName.includes('gold')) {
                // These are inappropriate for common workers
                professionHeadgear = { name: 'None', material: 'None' };
            }
        }
    }
    
    const finalAppearance: Appearance = {
        ...baseProfile.appearance,
        palette: palette,
        garment: equippedItems.torso 
            ? { name: equippedItems.torso.name, material: equippedItems.torso.material || 'cloth' } 
            : baseProfile.appearance.garment,
        headgear: equippedItems.head 
            ? { name: equippedItems.head.name, material: equippedItems.head.material || 'cloth' } 
            : professionHeadgear,
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
    
    // Calculate health based on potentially modified stats
    const maxHealth = 80 + baseProfile.stats.constitution * 2 + baseProfile.stats.strength;
    const startingHealth = spec.health === 'sickly' ? 
        Math.floor(maxHealth * (0.5 + Math.random() * 0.2)) : // 50-70% for sickly
        spec.health === 'unhealthy' ?
        Math.floor(maxHealth * (0.6 + Math.random() * 0.2)) : // 60-80% for unhealthy
        Math.floor(maxHealth * (0.8 + Math.random() * 0.2)); // 80-100% for average/healthy
    
    const timeOfDay = 12; // Default to noon
    let baseFatigue = 30 + Math.random() * 40; // 30-70% tired during day
    const constitutionBonus = baseProfile.stats.constitution - 10;
    const startingFatigue = Math.max(10, Math.min(100, baseFatigue - constitutionBonus * 3));
    
    const staticPortraitSeed = Math.floor(Math.random() * 1000000);
    
    const partialCharacter: Omit<PlayerCharacter, 'backstory' | 'id' | 'inventory' | 'party' | 'eventLog' | 'profileImage' | 'isLlmEnhanced'> = {
        ...baseProfile,
        name,
        class: socialClass,
        profession: role,
        level: Math.floor(1 + Math.random() * 5), // Random level 1-5
        experience: 0,
        maxExperience: 100,
        health: startingHealth,
        maxHealth: maxHealth,
        fatigue: Math.floor(startingFatigue),
        maxFatigue: 100,
        currency: socialClass === 'Noble' ? 50 + Math.floor(noise.random() * 50) :
                  socialClass === 'Merchant' ? 20 + Math.floor(noise.random() * 30) :
                  10 + Math.floor(noise.random() * 10),
        era: generationContext.era,
        historicalEra: generationContext.era,
        culturalZone: generationContext.culturalZone,
        portraitSeed: staticPortraitSeed,
        family: [],
        lifeEvents: [],
        mapReputation: Math.floor(20 + Math.random() * 60 + (socialClass === 'Noble' ? 20 : socialClass === 'Merchant' ? 10 : 0)), // 20-80 base, with bonus for nobles/merchants
        appearance: finalAppearance,
        equippedItems,
    };
    
    // Use custom backstory if provided, otherwise generate procedural one
    const backstory = spec.customBackstory || _generateProceduralBackstory(partialCharacter as PlayerCharacter);
    
    // Add custom items to inventory if provided
    if (spec.customItems && spec.customItems.length > 0) {
        console.log(`[Character Generator] Adding ${spec.customItems.length} custom items from WorldWeaver`);
        for (const customItem of spec.customItems) {
            const item: Item = {
                id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                baseId: customItem.name.toUpperCase().replace(/\s+/g, '_'),
                name: customItem.name,
                description: customItem.description,
                value: customItem.value,
                weight: customItem.weight,
                category: customItem.category as any,
                stackable: customItem.stackable || false,
                wearable: customItem.wearable || false,
                quantity: 1,
                emoji: '📦', // Default emoji for custom items
                rarity: 'Special',
                attack: 0,
                sustenance: 0,
                wieldable: false,
                throwable: false,
                craftingValue: 1
            };
            inventory.push(item);
        }
    }
    
    // Add life events
    const currentYear = dateInfo.year;
    const birthYear = currentYear - partialCharacter.age;
    (partialCharacter as any).birthYear = birthYear.toString();
    partialCharacter.lifeEvents.push({ year: birthYear, event: `Born in the region of ${context.region}.`});
    if (partialCharacter.age > 16) {
        partialCharacter.lifeEvents.push({ year: birthYear + 16, event: `Came of age and began training as a ${role}.`});
    }
    if (partialCharacter.age > 25 && noise.random() > 0.5) {
        partialCharacter.lifeEvents.push({ year: birthYear + 22, event: `Left home to seek fortune.`});
    }
    
    // Add family
    const fatherName = generateNpcName('Male', culturalZone, context.region, currentYear - partialCharacter.age - 25, noise);
    partialCharacter.family.push({ name: fatherName, relation: 'father', profession: 'Farmer' });
    const motherName = generateNpcName('Female', culturalZone, context.region, currentYear - partialCharacter.age - 25, noise);
    partialCharacter.family.push({ name: motherName, relation: 'mother', profession: 'Homemaker' });
    
    // Initialize disease health with potential disease based on stats and setting
    const diseaseService = DiseaseService.getInstance();
    
    let diseaseHealth = undefined;
    
    // Check if a specific disease was requested via WorldWeaver
    if (spec.disease) {
        console.log(`[Character Generator] Specific disease requested: ${spec.disease}`);
        diseaseHealth = diseaseService.assignSpecificDisease(
            { health: undefined } as any,
            spec.disease,
            generationContext.era,
            culturalZone,
            dateInfo.year
        );
        
        if (diseaseHealth && diseaseHealth.currentDiseases.length > 0) {
            console.log(`[Character Generator] Custom character given requested disease: ${diseaseHealth.currentDiseases[0].disease.name}`);
        } else {
            console.log(`[Character Generator] Could not assign requested disease ${spec.disease}, falling back to random`);
            // Fall back to random disease selection
        }
    }
    
    // If no specific disease requested or assignment failed, use random chance
    if (!diseaseHealth) {
        // SIMPLIFIED: Base 33% chance (1 in 3) like NPCs
        let diseaseChance = 0.33;
        
        // Health specification affects disease chance
        if (spec.health === 'sickly') {
            diseaseChance = 0.6; // 60% chance for sickly characters
        } else if (spec.health === 'unhealthy') {
            diseaseChance = 0.45; // 45% chance for unhealthy characters
        } else if (spec.health === 'healthy') {
            diseaseChance = 0.2; // 20% chance for healthy characters
        }
        
        const shouldHaveDisease = Math.random() < diseaseChance;
        
        if (shouldHaveDisease) {
            // Directly create disease health for player character
            const availableDiseases = diseaseService.getAvailableDiseasesForContext(
                generationContext.era,
                culturalZone,
                dateInfo.year
            );
            
            if (availableDiseases.length > 0) {
                // Check for epidemic diseases first (like plague in 1348)
                let selectedDisease = availableDiseases[Math.floor(Math.random() * availableDiseases.length)];
                
                // During epidemics, increase chance of epidemic disease
                const epidemicDisease = diseaseService.getEpidemicDisease(
                    availableDiseases, 
                    generationContext.era, 
                    culturalZone, 
                    dateInfo.year
                );
                
                if (epidemicDisease && Math.random() < 0.8) {
                    selectedDisease = epidemicDisease;
                    console.log(`[Character Generator] Custom character spawning during ${epidemicDisease.name} epidemic in ${dateInfo.year}`);
                }
                
                diseaseHealth = {
                    currentDiseases: [{
                        disease: selectedDisease,
                        contractedDate: Date.now(),
                        stage: 'symptomatic' as const,
                        daysRemaining: selectedDisease.durationDays,
                        severity: 0.5
                    }],
                    immunities: [],
                    exposureHistory: [],
                    overallHealthStatus: 'sick' as const,
                    lastHealthUpdate: { year: dateInfo.year, month: 1, day: 1 }
                };
                
                console.log(`[Character Generator] Custom character starts with disease: ${selectedDisease.name} (chance was ${(diseaseChance * 100).toFixed(1)}%)`);
            } else {
                console.log(`[Character Generator] No diseases available for custom character in era ${generationContext.era}`);
            }
        } else {
            console.log(`[Character Generator] Custom character spawned healthy (disease chance was ${(diseaseChance * 100).toFixed(1)}%)`);
        }
    }
    
    const character: PlayerCharacter = {
        ...(partialCharacter as any),
        id: `pc-${characterIdCounter++}`,
        backstory,
        inventory,
        party: [],
        eventLog: [],
        profileImage: 'placeholder.png',
        isLlmEnhanced: false,
        diseaseHealth, // Add disease health with potential disease
    };
    
    console.log(`[Character Generator] Generated custom character ${name}, a ${role} with specifications`);
    
    return character;
}

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
    
    // Create a minimal character first for companion generation
    const tempCharacter: Partial<PlayerCharacter> = {
        name,
        profession: role,
        year: dateInfo.year,
    };
    
    // Get starting package and inventory first
    const { inventory, equippedItems } = assembleStartingPackage(role, tempCharacter as PlayerCharacter);

    // Generate a color palette based on context
    const palette = generateClothingPalette(baseProfile.wealthLevel, generationContext.era, culturalZone, baseProfile.gender, noise);
    
    // For professions without starting packages, generate appropriate headgear
    let professionHeadgear = baseProfile.appearance.headgear;
    if (!equippedItems.head && role) {
        // Generate profession-appropriate headgear
        const roleLower = role.toLowerCase();
        if (roleLower.includes('laborer') || roleLower.includes('sweep') || roleLower.includes('miner') || roleLower.includes('smith')) {
            professionHeadgear = { name: 'Leather Cap', material: 'Leather' };
        } else if (roleLower.includes('merchant') || roleLower.includes('trader')) {
            professionHeadgear = { name: 'Felt Hat', material: 'Felt' };
        } else if (roleLower.includes('farmer') || roleLower.includes('peasant')) {
            professionHeadgear = { name: 'Straw Hat', material: 'Straw' };
        } else if (roleLower.includes('scholar') || roleLower.includes('scribe')) {
            professionHeadgear = { name: 'Scholar Cap', material: 'Velvet' };
        } else if (roleLower.includes('soldier') || roleLower.includes('guard')) {
            professionHeadgear = { name: 'Leather Helmet', material: 'Leather' };
        } else if (roleLower.includes('noble') || roleLower.includes('lord')) {
            professionHeadgear = { name: 'Velvet Cap', material: 'Velvet' };
        } else {
            // For other common professions, prefer no headgear or simple headgear
            // Filter out inappropriate items like jeweled tiaras
            const headgearName = professionHeadgear?.name?.toLowerCase() || '';
            if (headgearName.includes('jewel') || headgearName.includes('diamond') || 
                headgearName.includes('tiara') || headgearName.includes('crown') || 
                headgearName.includes('diadem') || headgearName.includes('gold')) {
                // These are inappropriate for common workers
                professionHeadgear = { name: 'None', material: 'None' };
            }
        }
    }
    
    // Build the final appearance object, prioritizing equipped items for the description
    const finalAppearance: Appearance = {
        ...baseProfile.appearance,
        palette: palette,
        garment: equippedItems.torso 
            ? { name: equippedItems.torso.name, material: equippedItems.torso.material || 'cloth' } 
            : baseProfile.appearance.garment,
        headgear: equippedItems.head 
            ? { name: equippedItems.head.name, material: equippedItems.head.material || 'cloth' } 
            : professionHeadgear,
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
        level: Math.floor(1 + Math.random() * 5), // Random level 1-5
        experience: 0,
        maxExperience: 100,
        health: startingHealth,
        maxHealth: maxHealth,
        fatigue: Math.floor(startingFatigue),
        maxFatigue: 100,
        currency: 10 + Math.floor(noise.random() * 20),
        era: generationContext.era,
        historicalEra: generationContext.era,
        culturalZone: generationContext.culturalZone,
        portraitSeed: staticPortraitSeed,
        family: [], // Initialize empty
        lifeEvents: [], // Initialize empty
        mapReputation: Math.floor(20 + Math.random() * 60 + (socialClass === 'Noble' ? 20 : socialClass === 'Merchant' ? 10 : 0)), // Random 20-80, with bonus for nobles/merchants
        appearance: finalAppearance, // Use the synced appearance object
        equippedItems,
    };
    
    // The backstory is generated from the final, consistent character data
    // Beliefs are already part of baseProfile, so this will work correctly.
    const backstory = _generateProceduralBackstory(partialCharacter as PlayerCharacter);
    
    const currentYear = dateInfo.year;
    const birthYear = currentYear - partialCharacter.age;
    (partialCharacter as any).birthYear = birthYear.toString();
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


    // Initialize disease health with potential disease based on stats and setting
    const diseaseService = DiseaseService.getInstance();
    
    // SIMPLIFIED: Base 33% chance (1 in 3) to match NPCs
    const diseaseChance = 0.33;
    const shouldHaveDisease = Math.random() < diseaseChance;
    
    let diseaseHealth = undefined;
    if (shouldHaveDisease) {
        // Directly create disease health for player character
        const availableDiseases = diseaseService.getAvailableDiseasesForContext(
            generationContext.era,
            culturalZone,
            dateInfo.year
        );
        
        if (availableDiseases.length > 0) {
            // Check for epidemic diseases first (like plague in 1348)
            let selectedDisease = availableDiseases[Math.floor(Math.random() * availableDiseases.length)];
            
            // During epidemics, increase chance of epidemic disease
            const epidemicDisease = diseaseService.getEpidemicDisease(
                availableDiseases, 
                generationContext.era, 
                culturalZone, 
                dateInfo.year
            );
            
            if (epidemicDisease && Math.random() < 0.8) {
                selectedDisease = epidemicDisease;
                console.log(`[Character Generator] Player spawning during ${epidemicDisease.name} epidemic in ${dateInfo.year}`);
            }
            
            diseaseHealth = {
                currentDiseases: [{
                    disease: selectedDisease,
                    contractedDate: Date.now(),
                    stage: 'symptomatic' as const,
                    daysRemaining: selectedDisease.durationDays,
                    severity: 0.5
                }],
                immunities: [],
                exposureHistory: [],
                overallHealthStatus: 'sick' as const,
                lastHealthUpdate: { year: dateInfo.year, month: 1, day: 1 }
            };
            
            console.log(`[Character Generator] Character starts with disease: ${selectedDisease.name} (chance was ${(diseaseChance * 100).toFixed(1)}%)`);
        } else {
            console.log(`[Character Generator] No diseases available for era ${generationContext.era} in ${culturalZone}`);
        }
    } else {
        console.log(`[Character Generator] Character spawned healthy (disease chance was ${(diseaseChance * 100).toFixed(1)}%)`);
    }

    const character: PlayerCharacter = {
        ...(partialCharacter as any), // Cast to get around Omit typing temporarily
        id: `pc-${characterIdCounter++}`,
        backstory,
        inventory,
        party: [],
        eventLog: [],
        profileImage: 'placeholder.png', // This will be replaced by the procedural portrait component
        isLlmEnhanced: false,
        diseaseHealth, // Add disease health with potential disease
    };
    
    console.log(`[Character Generator] Generated character ${name}, a ${role} with static portrait seed ${staticPortraitSeed}`);
    
    return character;
}