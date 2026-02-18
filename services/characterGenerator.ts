/**
 * services/characterGenerator.ts - Enhanced character service with portrait integration
 */
import { PlayerCharacter, HistoricalEra, Item, CharacterStats, CharacterPersonality, CharacterSocialContext, Appearance, ClothingPiece, ClothingPalette, MapAreaDefinition } from '../types';
import { PROFESSIONS, CHARACTER_NAMES, CulturalZone, STARTING_PACKAGES, ProfessionDefinition, PERSONAL_BELIEFS } from '../constants/index';
import { CHARACTER_NAMES as NAME_LISTS } from '../constants/characterData/names';
import { parseDateString } from '../utils/dateUtils';
import { createItemInstance, addItemToInventory, assembleStartingPackage } from '../utils/inventoryUtils';
import { ValueNoise } from '../utils/noise';
import { generateBaseProfile, determineSocialRole, generateNpcName, assignBeliefs, generateClothingPalette, generateCulturalAppearance } from '../generation/common/npcUtils';
import { mapLocationToCulture } from '../utils/mapUtils';
import { hexToColorName } from '../utils/colorUtils';
import { CharacterSpecification } from './worldWeaverService';
import DiseaseService from './diseaseService';
import { AttributeBadgeService } from './attributeBadgeService';
import { getMarkingsForCharacter, selectRandomMarking, getRandomPattern, convertToAppearanceMarking, getMarkingProbability } from '../constants/characterData/culturalMarkings';

let characterIdCounter = 0;

const normalizeSocialClassInput = (value?: string): CharacterSpecification['socialClass'] | undefined => {
    if (!value) return undefined;
    const normalized = value.toLowerCase();
    if (normalized === 'peasant' || normalized === 'commoner' || normalized === 'merchant' || normalized === 'noble') {
        return normalized as CharacterSpecification['socialClass'];
    }
    if (normalized === 'poor') return 'peasant';
    if (normalized === 'modest') return 'commoner';
    if (normalized === 'comfortable' || normalized === 'wealthy') return 'merchant';
    if (normalized === 'aristocrat' || normalized === 'royal' || normalized === 'upper') return 'noble';
    return undefined;
};

/**
 * Detect likely ethnicity/cultural origin from a character's name
 * Uses the existing name lists from constants to determine cultural zone
 */
export function detectEthnicityFromName(name: string): CulturalZone | null {
    // Split name into parts
    const nameParts = name.split(/\s+/);
    const firstName = nameParts[0]?.toLowerCase() || '';
    const lastName = nameParts[nameParts.length - 1]?.toLowerCase() || '';

    // Check each name list for matches
    for (const [listKey, nameList] of Object.entries(NAME_LISTS)) {
        // Check if first name exists in male or female lists
        const firstNameMatch = nameList.male.some(n =>
            n.toLowerCase() === firstName ||
            n.toLowerCase().replace(/[áéíóúàèìòùäëïöüâêîôûñç]/g, '') === firstName
        ) || nameList.female.some(n =>
            n.toLowerCase() === firstName ||
            n.toLowerCase().replace(/[áéíóúàèìòùäëïöüâêîôûñç]/g, '') === firstName
        );

        // Check if surname matches
        const surnameMatch = nameList.surname.some(s => {
            const cleanSurname = s.toLowerCase()
                .replace(/^(o'|mc|mac|de |von |van |le |la |del |della |di |da |al-|ibn |bin )/i, '');
            return cleanSurname === lastName || s.toLowerCase() === lastName;
        });

        if (firstNameMatch || surnameMatch) {
            // Map name list keys to cultural zones
            if (listKey.includes('CELTIC_IRISH') || listKey.includes('SCOTTISH') || listKey.includes('WELSH')) {
                return 'EUROPEAN'; // Celtic peoples
            }
            if (listKey.includes('ENGLISH') || listKey.includes('FRENCH') || listKey.includes('GERMAN') ||
                listKey.includes('ITALIAN') || listKey.includes('SPANISH') || listKey.includes('PORTUGUESE') ||
                listKey.includes('DUTCH') || listKey.includes('SCANDINAVIAN') || listKey.includes('RUSSIAN') ||
                listKey.includes('POLISH') || listKey.includes('GREEK') || listKey.includes('FRANKISH') ||
                listKey.includes('NORMAN') || listKey.includes('BYZANTINE') || listKey.includes('SLAVIC') ||
                listKey.includes('HUNGARIAN') || listKey.includes('CZECH') || listKey.includes('ROMANIAN')) {
                return 'EUROPEAN';
            }
            if (listKey.includes('CHINESE') || listKey.includes('JAPANESE') || listKey.includes('KOREAN') ||
                listKey.includes('VIETNAMESE') || listKey.includes('MONGOLIAN') || listKey.includes('THAI') ||
                listKey.includes('KHMER') || listKey.includes('BURMESE')) {
                return 'EAST_ASIAN';
            }
            if (listKey.includes('ARABIC') || listKey.includes('PERSIAN') || listKey.includes('TURKISH') ||
                listKey.includes('HEBREW') || listKey.includes('BERBER') || listKey.includes('COPTIC') ||
                listKey.includes('NUBIAN')) {
                return 'MENA';
            }
            if (listKey.includes('INDIAN') || listKey.includes('BENGALI') || listKey.includes('PUNJABI') ||
                listKey.includes('TAMIL') || listKey.includes('GUJARATI') || listKey.includes('MARATHI') ||
                listKey.includes('TELUGU') || listKey.includes('KANNADA') || listKey.includes('MALAYALAM') ||
                listKey.includes('NEPALI') || listKey.includes('SINHALA')) {
                return 'SOUTH_ASIAN';
            }
            if (listKey.includes('AFRICAN') || listKey.includes('SWAHILI') || listKey.includes('YORUBA') ||
                listKey.includes('HAUSA') || listKey.includes('ZULU') || listKey.includes('ETHIOPIAN') ||
                listKey.includes('SOMALI') || listKey.includes('MAASAI') || listKey.includes('BANTU')) {
                return 'SUB_SAHARAN_AFRICAN';
            }
            if (listKey.includes('POLYNESIAN') || listKey.includes('MELANESIAN') || listKey.includes('MALAY') ||
                listKey.includes('INDONESIAN') || listKey.includes('ABORIGINAL') || listKey.includes('MAORI') ||
                listKey.includes('HAWAIIAN') || listKey.includes('SAMOAN') || listKey.includes('TAHITIAN')) {
                return 'OCEANIA';
            }
            if (listKey.includes('INCA') || listKey.includes('MAYA') || listKey.includes('AZTEC') ||
                listKey.includes('GUARANI') || listKey.includes('QUECHUA') || listKey.includes('TUPI') ||
                listKey.includes('MAPUCHE') || listKey.includes('AYMARA')) {
                return 'SOUTH_AMERICAN';
            }
            if (listKey.includes('IROQUOIS') || listKey.includes('ALGONQUIAN') || listKey.includes('SIOUX') ||
                listKey.includes('APACHE') || listKey.includes('NAVAJO') || listKey.includes('CHEROKEE') ||
                listKey.includes('PUEBLO') || listKey.includes('INUIT') || listKey.includes('CREEK') ||
                listKey.includes('CHOCTAW') || listKey.includes('PLAINS_NATIVE')) {
                return 'NORTH_AMERICAN_PRE_COLUMBIAN';
            }
            if (listKey.includes('NORTH_AMERICAN_COLONIAL') || listKey.includes('AMERICAN')) {
                return 'NORTH_AMERICAN_COLONIAL';
            }
        }
    }

    return null;
}

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

// Religion descriptions for procedural backstory generation
const RELIGION_DESCRIPTIONS: Record<string, string> = {
    // Traditional European
    'Roman Catholicism': 'finding solace in ancient rituals and the guidance of Church tradition',
    'Protestantism': 'emphasizing personal faith and the authority of scripture',
    'Eastern Orthodoxy': 'honoring mystical traditions and the veneration of holy icons',
    'Celtic Christianity': 'blending ancient Celtic wisdom with Christian teachings',
    'Celtic Druidism': 'following the old ways of sacred groves and seasonal cycles',
    'Norse Paganism': 'honoring the gods of Asgard and the warrior\'s path to Valhalla',
    'Greek Polytheism': 'making offerings to the Olympian gods for their favor',
    'Roman Polytheism': 'observing the rites that maintain the pax deorum',
    'Germanic Paganism': 'venerating the forest gods and ancestral spirits',
    'Slavic Paganism': 'honoring the spirits of household, field, and forest',

    // Abrahamic
    'Judaism': 'maintaining the ancient covenant through study and observance',
    'Islam': 'submitting to divine will through daily prayer and devotion',
    'Sunni Islam': 'following the example of the Prophet and his companions',
    'Shia Islam': 'revering the family of the Prophet as rightful guides',
    'Sufi Islam': 'seeking divine union through mystical practice and dhikr',
    'Early Christianity': 'following the new covenant in small, devoted communities',

    // Asian Traditions
    'Buddhism': 'seeking liberation from suffering through the Noble Eightfold Path',
    'Hinduism': 'honoring the eternal dharma and countless manifestations of the divine',
    'Confucianism': 'cultivating virtue through ritual propriety and filial devotion',
    'Taoism': 'following the natural way and seeking harmony with the Dao',
    'Shinto': 'maintaining purity and honoring the kami of land and ancestors',
    'Zen Buddhism': 'pursuing enlightenment through meditation and direct insight',

    // Indigenous & Shamanic
    'Shamanism': 'walking between worlds to commune with spirits and ancestors',
    'Animism': 'recognizing the living spirit within all things',
    'Totemism': 'drawing strength from your clan\'s sacred animal guardian',
    'Ancestor Worship': 'maintaining the vital connection with those who came before',

    // Regional/Cultural Specific
    'Vodou': 'serving the lwa and honoring both African and Catholic traditions',
    'Santería': 'working with the orishas through ritual and sacrifice',
    'Tengrism': 'revering the Eternal Blue Sky and the spirits of the steppe',
    'Zoroastrianism': 'supporting the cosmic battle of light against darkness',

    // Modern/Secular
    'Atheism': 'trusting in reason and human capability rather than divine intervention',
    'Agnosticism': 'acknowledging the limits of knowledge about divine matters',
    'Deism': 'believing in a creator who set the universe in motion',
    'Secularism': 'focusing on worldly concerns rather than spiritual matters',

    // Native American (respectful generalizations)
    'Great Spirit Worship': 'honoring the Great Spirit that flows through all creation',
    'Sun Dance Religion': 'participating in sacred ceremonies of renewal and sacrifice',
    'Pueblo Religion': 'maintaining the sacred balance through kiva ceremonies',
    'Iroquois Longhouse Religion': 'following the ways taught by the Peacemaker',

    // Default fallback
    'Unknown': 'following your own spiritual path'
};

// Map of attribute IDs to short descriptive phrases
const ATTRIBUTE_DESCRIPTIONS: Record<string, string> = {
    // Physical
    'strong': 'exceptionally strong',
    'frail': 'physically frail',
    'blind': 'completely blind',
    'deaf': 'deaf',
    'nearsighted': 'nearsighted',
    'athletic': 'naturally athletic',
    'limping': 'walking with a limp',
    'scarred': 'covered in scars',
    'giant': 'unusually tall',
    'tiny': 'remarkably small',

    // Mental
    'genius': 'brilliant',
    'simple': 'simple-minded',
    'scholar': 'well-educated',
    'illiterate': 'unable to read',
    'polyglot': 'speak many languages',
    'forgetful': 'terribly forgetful',
    'sharp_eyed': 'have keen eyesight',
    'dreamer': 'prone to daydreaming',

    // Personality
    'charming': 'naturally charming',
    'shy': 'painfully shy',
    'lucky': 'remarkably lucky',
    'unlucky': 'plagued by bad luck',
    'honest': 'compulsively honest',
    'liar': 'a habitual liar',
    'generous': 'exceptionally generous',
    'greedy': 'consumed by greed',
    'brave': 'fearless',
    'coward': 'cowardly',

    // Spiritual
    'spiritual': 'deeply spiritual',
    'prophet': 'gifted with divine visions',
    'blessed': 'blessed by fortune',
    'cursed': 'believed to be cursed',
    'mystic': 'blessed with mystical insights',
    'skeptic': 'doubtful of all religions',

    // Skills/Background
    'survivor': 'a hardened survivor',
    'hunter': 'an experienced hunter',
    'healer': 'a skilled healer',
    'merchant': 'good with money',
    'sailor': 'experienced at sea',
    'farmer': 'an experienced farmer',
    'knight_errant': 'a former soldier',

    // Conditions
    'alcoholic': 'dependent on drink',
    'hard_of_hearing': 'hard of hearing',
    'quarrelsome': 'quick to anger',
    'paranoid': 'deeply paranoid',
    'devout': 'devoutly religious',
    'gambler': 'addicted to gambling',
    'melancholic': 'chronically sad',
    'glutton': 'constantly eating',
    'ascetic': 'disaindful of worldly pleasures',
    'curious': 'insatiably curious',
    'cautious': 'extremely cautious',
    'reckless': 'dangerously reckless',
    'patient': 'endlessly patient',
    'impatient': 'terribly impatient',
    'stubborn': 'incredibly stubborn',
    'adaptable': 'highly adaptable',

    // Social
    'animal_lover': 'an animal lover',
    'loner': 'one who prefers solitude',
    'leader': 'a natural leader',
    'follower': 'prefer to follow',
    'romantic': 'hopelessly romantic',
    'orphan': 'an orphan',
    'twin': 'a twin',
    'noble_blood': 'of ancient but fallen family',
    'nightowl': 'most active at night',
    'weather_sense': 'able to predict weather',

    // Cultural/Professional
    'calligrapher': 'a skilled calligrapher',
    'artist': 'an artist',
    'poet': 'a poet',
    'musician': 'a musician',
    'craftsman': 'a craftsman',

    // New universal ones
    'veteran': 'a veteran of war',
    'street_smart': 'street smart',
    'pessimist': 'deeply pessimistic',
    'optimist': 'eternally optimistic',
    'insomniac': 'an insomniac',
    'foreigner': 'a foreigner here',
    'local': 'a local',
    'wanderer': 'a wanderer'
};

// Generate attribute sentence for a character
// Helper to format hairstyle descriptions properly
function formatHairstyle(hairstyle: string): string {
    const styleMap: Record<string, string> = {
        'high_forehead': 'with a high forehead',
        'receding_hairline': 'with a receding hairline',
        'widow_peak': 'with a widow\'s peak',
        'straight_bangs': 'with straight bangs',
        'side_part': 'parted to the side',
        'center_part': 'parted in the center',
        'swept_back': 'swept back',
        'shaved_sides': 'with shaved sides',
        'long_flowing': 'long and flowing',
        'tight_curls': 'in tight curls',
        'loose_curls': 'in loose curls',
        'braided': 'in braids',
        'top_knot': 'in a top knot',
        'man_bun': 'in a bun',
        'bun': 'in a bun',
        'ponytail': 'in a ponytail',
        'shaved_head': 'shaved',
        'close_cropped': 'close-cropped',
        'shoulder_length': 'shoulder-length',
        'waist_length': 'waist-length',
        'afro': 'in an afro',
        'cornrows': 'in cornrows',
        'dreadlocks': 'in dreadlocks',
        'mohawk': 'in a mohawk',
        'pigtails': 'in pigtails',
        'twin_buns': 'in twin buns',
        'elaborate_updo': 'in an elaborate updo',
        'messy': 'worn messy',
        'tousled': 'tousled',
        'slicked_back': 'slicked back',
    };

    return styleMap[hairstyle] || hairstyle.replace(/_/g, ' ');
}

export function generateAttributeSentence(character: { attributes?: Array<{ id: string; name: string }> }): string | null {
    if (!character.attributes || character.attributes.length === 0) {
        return null;
    }

    const attributePhrases = character.attributes
        .slice(0, 3) // Limit to 3 attributes max
        .map(attr => ATTRIBUTE_DESCRIPTIONS[attr.id] || `a ${attr.name.toLowerCase()}`)
        .filter(phrase => phrase); // Remove any undefined

    if (attributePhrases.length === 0) {
        return null;
    }

    if (attributePhrases.length === 1) {
        return `You are ${attributePhrases[0]}.`;
    } else if (attributePhrases.length === 2) {
        return `You are ${attributePhrases[0]} and ${attributePhrases[1]}.`;
    } else {
        const lastPhrase = attributePhrases.pop();
        return `You are ${attributePhrases.join(', ')}, and ${lastPhrase}.`;
    }
}

// Enhanced backstory that incorporates personality and removes clothing descriptions
function _generateProceduralBackstory(character: Omit<PlayerCharacter, 'backstory' | 'id' | 'inventory' | 'party' | 'eventLog' | 'profileImage' | 'isLlmEnhanced'>): string {
    const sentences = [];
    const heightStr = cmToFeetAndInches(character.appearance.height);

    // Sentence 1: Origin and basic identity (fixed grammar)
    sentences.push(`Hailing from ${character.birthplace}, you are ${character.name}, a ${character.age}-year-old ${character.gender.toLowerCase()}.`);

    // Sentence 2: Profession with calculated years
    const professionYears = Math.max(1, Math.min(
        character.age - 14, // Can't work before age 14
        Math.floor((character.age - 14) * 0.7) // Not their entire adult life
    ));
    sentences.push(`You have been a ${character.profession.toLowerCase()} for ${professionYears} year${professionYears === 1 ? '' : 's'}.`);

    // Sentence 3: Physical Description
    const eyeColorName = hexToColorName(character.appearance.eyeColor);
    const hairColorName = hexToColorName(character.appearance.hairColor);
    const hairstyleDesc = formatHairstyle(character.appearance.hairstyle);
    let physicalDesc = `You have a ${character.appearance.build} build, standing at ${heightStr}. Your eyes are a shade of ${eyeColorName} and your hair is ${hairColorName}, worn ${hairstyleDesc}.`;
    if (character.appearance.facialHair && character.appearance.facialHairStyle) {
        physicalDesc += ` You wear a ${character.appearance.facialHairStyle.replace(/_/g, ' ')}.`;
    }
    sentences.push(physicalDesc);

    // Sentence 4: Attributes (if any)
    const attributeSentence = generateAttributeSentence(character);
    if (attributeSentence) {
        sentences.push(attributeSentence);
    }

    // Sentence 5: Religion description
    if (character.religion) {
        const religionDesc = RELIGION_DESCRIPTIONS[character.religion] || RELIGION_DESCRIPTIONS['Unknown'];
        sentences.push(`You follow ${character.religion}, ${religionDesc}.`);
    }

    // Sentence 5: Personality/Demeanor
    let demeanorSentence = `You carry yourself with a ${character.appearance.affect} demeanor.`;
    if (character.personality.agreeableness < 0.3) {
        demeanorSentence = `You carry yourself with a ${character.appearance.affect} demeanor. Few would call you approachable, but many respect your directness.`;
    } else if (character.personality.openness > 0.8) {
        demeanorSentence = `You carry yourself with a ${character.appearance.affect} demeanor. Your curiosity about the world and its mysteries is palpable.`;
    } else if (character.personality.conscientiousness > 0.8) {
        demeanorSentence = `You are known for your meticulous and reliable nature. You carry yourself with a ${character.appearance.affect} demeanor.`;
    }
    sentences.push(demeanorSentence);

    // Sentence 7: Guiding Principle/Belief (simplified without filler)
    if (character.beliefs && character.beliefs.length > 0) {
        const coreBeliefEntry = [...character.beliefs].sort((a,b) => b.conviction - a.conviction)[0];
        const coreBelief = PERSONAL_BELIEFS.find(b => b.id === coreBeliefEntry.beliefId);
        if (coreBelief) {
             let beliefText = coreBelief.text.toLowerCase().replace('believes that', '').replace('believes in', '').replace('believes', '').trim();
             let consequence = '';
             switch(coreBelief.id) {
                case 'DIVINE_RIGHT_OF_KINGS':
                    consequence = "a conviction that has earned you both powerful friends and determined enemies";
                    break;
                case 'MIGHT_IS_RIGHT':
                    consequence = "a worldview that has served you well in avoiding conflict, though some find it callous";
                    break;
                case 'INDIVIDUAL_LIBERTY':
                case 'INDIVIDUAL_FREEDOM':
                    consequence = "a philosophy that often puts you at odds with figures of authority";
                    break;
                case 'HONOR_IS_ALL':
                case 'HONOR_CULTURE':
                    consequence = "a principle that has both opened and closed many doors for you";
                    break;
                case 'FATE_IS_INEXORABLE':
                    consequence = "a belief that brings you peace in trying times, even if others call it passivity";
                    break;
                case 'EMPIRICAL_KNOWLEDGE':
                    consequence = "an approach that has made you skeptical of untested claims";
                    break;
                case 'REVEALED_TRUTH':
                    consequence = "a faith that provides certainty in an uncertain world";
                    break;
                case 'ANCESTOR_WORSHIP':
                    consequence = "a practice that keeps you connected to your lineage";
                    break;
                case 'COMMERCIAL_ACUMEN':
                    consequence = "a mindset that helps you see opportunity where others see only difficulty";
                    break;
                case 'TRIBAL_LOYALTY':
                    consequence = "bonds that define both your greatest strengths and your limits";
                    break;
                default:
                     consequence = "a guiding principle that shapes your interactions with the world";
                     break;
             }
             // Remove the verbose consequence part - just state the belief simply
             sentences.push(`You believe that ${beliefText}.`);
        }
    } else {
        if (character.socialContext && character.socialContext.wanderlust > 0.8) {
            sentences.push(`A deep-seated wanderlust has always pulled you toward the horizon, making it difficult to ever truly settle down.`);
        } else if (character.socialContext && character.socialContext.ambition > 0.8) {
            sentences.push(`A fierce ambition drives you to seek wealth and power, leaving little room for sentiment.`);
        } else {
            sentences.push(`You are guided by the simple principle that the old ways are the best ways, a philosophy that shapes your interactions with the world.`);
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
    // Use ethnicity from spec if provided, otherwise geographic cultural zone
    const culturalZone = (spec as any).ethnicity || mapLocationToCulture(context.location, dateInfo.year);
    const generationContext = {
        era: dateInfo.era as HistoricalEra,
        culturalZone,
        region: context.region,
    };

    // Log ethnicity usage for debugging
    if ((spec as any).ethnicity) {
        console.log(`[Character Generator] Using ethnicity '${(spec as any).ethnicity}' for character generation (geographic zone would be: ${mapLocationToCulture(context.location, dateInfo.year)})`);
    }
    
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

    if (spec.birthplace) {
        baseProfile.birthplace = spec.birthplace;
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
    
    const normalizedSocialClass = normalizeSocialClassInput(spec.socialClass);
    if (normalizedSocialClass) {
        switch (normalizedSocialClass) {
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
    
    // Get starting package and inventory with color support
    const privilege = baseProfile.wealthLevel === 'wealthy' ? 0.8 : 
                     baseProfile.wealthLevel === 'comfortable' ? 0.6 : 
                     baseProfile.wealthLevel === 'modest' ? 0.4 : 0.2;
                     
    const { inventory, equippedItems } = assembleStartingPackage(role, tempCharacter as PlayerCharacter, {
        culture: culturalZone,
        era: generationContext.era,
        privilege
    });
    
    // Generate appearance with palette
    let palette = generateClothingPalette(baseProfile.wealthLevel, generationContext.era, culturalZone, baseProfile.gender, noise);
    
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

    const normalizeClothingPiece = (piece: any, fallbackMaterial: string): ClothingPiece | undefined => {
        if (!piece) return undefined;
        if (typeof piece === 'string') {
            return { name: piece, material: fallbackMaterial };
        }
        if (!piece.name) return undefined;
        return {
            name: String(piece.name),
            material: piece.material ? String(piece.material) : fallbackMaterial,
            adjectives: Array.isArray(piece.adjectives) ? piece.adjectives.map(String) : undefined
        };
    };

    if (spec.clothing) {
        const garmentOverride = normalizeClothingPiece(spec.clothing.garment, 'cloth');
        const headgearOverride = normalizeClothingPiece(spec.clothing.headgear, 'cloth');
        const footwearOverride = normalizeClothingPiece(spec.clothing.footwear, 'leather');
        const beltOverride = normalizeClothingPiece(spec.clothing.belt, 'leather');
        const accessoryOverride = normalizeClothingPiece(spec.clothing.accessory, 'metal');

        if (garmentOverride) {
            baseProfile.appearance.garment = { ...baseProfile.appearance.garment, ...garmentOverride };
        }
        if (headgearOverride) {
            baseProfile.appearance.headgear = { ...baseProfile.appearance.headgear, ...headgearOverride };
        }
        if (footwearOverride) {
            baseProfile.appearance.footwear = { ...baseProfile.appearance.footwear, ...footwearOverride };
        }
        if (beltOverride) {
            baseProfile.appearance.belt = { ...baseProfile.appearance.belt, ...beltOverride };
        }
        if (accessoryOverride) {
            baseProfile.appearance.accessory = { ...baseProfile.appearance.accessory, ...accessoryOverride };
        }
        if (spec.clothing.palette) {
            palette = { ...palette, ...spec.clothing.palette };
        }
    }
    
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
    
    // Generate cultural markings based on culture, profession, and context
    const markingProbability = getMarkingProbability(culturalZone, generationContext.era, spec?.profession || role);
    const markings: any[] = [];
    
    // console.log(`[CharGen Spec] Marking probability for ${culturalZone}/${generationContext.era}/${spec?.profession || role}: ${markingProbability}`);
    
    // Determine how many markings to add based on culture - MORE historically accurate
    let numMarkings = 0;
    if (noise.random() < markingProbability) {
        // Higher probability cultures often have multiple markings
        if (culturalZone === 'OCEANIA' || culturalZone === 'NORTH_AMERICAN_PRE_COLUMBIAN' || 
            culturalZone === 'SUB_SAHARAN_AFRICAN' || culturalZone === 'SOUTH_AMERICAN') {
            // These cultures almost always had multiple types of body modifications
            const roll = noise.random();
            if (roll < 0.4) numMarkings = 3;       // 40% chance for 3 markings
            else if (roll < 0.8) numMarkings = 2;  // 40% chance for 2 markings
            else numMarkings = 1;                  // 20% chance for 1 marking
            
            // Minimum 2 for adults in these cultures
            if (baseProfile.age > 18) numMarkings = Math.max(2, numMarkings);
        } else if (culturalZone === 'SOUTH_ASIAN' || culturalZone === 'MENA') {
            // Often have both daily (bindi/kohl) and special (henna) markings
            numMarkings = noise.random() < 0.7 ? 2 : 1; // 70% chance for 2
            // Women often have more markings
            if (baseProfile.gender?.toLowerCase() === 'female') {
                numMarkings = Math.max(2, numMarkings);
            }
        } else {
            // Even European/East Asian cultures often had some daily markings
            numMarkings = noise.random() < 0.3 ? 2 : 1; // 30% chance for 2
        }
    }
    
    const usedTypes = new Set<string>();
    for (let i = 0; i < numMarkings; i++) {
        const availableMarkings = getMarkingsForCharacter(
            culturalZone,
            generationContext.era,
            spec?.profession || role,
            spec?.gender?.toLowerCase() as 'male' | 'female' || 'male',
            baseProfile.wealthLevel,
            spec?.age || baseProfile.age,
            i === 0 ? 'daily' : (noise.random() < 0.5 ? 'ceremony' : 'daily')
        ).filter(m => !usedTypes.has(m.type)); // Don't repeat marking types
        
        // console.log(`[CharGen Spec] Found ${availableMarkings.length} available markings for slot ${i+1}`);
        
        const selectedMarking = selectRandomMarking(availableMarkings, noise.random());
        if (selectedMarking) {
            usedTypes.add(selectedMarking.type);
            const pattern = getRandomPattern(selectedMarking, noise.random());
            if (pattern) {
                const appearanceMarking = convertToAppearanceMarking(selectedMarking, pattern);
                markings.push(appearanceMarking);
                // console.log(`[CharGen Spec] Added cultural marking: ${pattern.localName || pattern.name} (${selectedMarking.type}`);
            }
        }
    }

    let finalAppearance: Appearance = {
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
        accessory: equippedItems.accessory 
            ? { name: equippedItems.accessory.name, material: equippedItems.accessory.material || 'metal' } 
            : baseProfile.appearance.accessory,
        markings: markings.length > 0 ? markings : undefined
    };

    if (spec.clothing) {
        const garmentOverride = normalizeClothingPiece(spec.clothing.garment, 'cloth');
        const headgearOverride = normalizeClothingPiece(spec.clothing.headgear, 'cloth');
        const footwearOverride = normalizeClothingPiece(spec.clothing.footwear, 'leather');
        const beltOverride = normalizeClothingPiece(spec.clothing.belt, 'leather');
        const accessoryOverride = normalizeClothingPiece(spec.clothing.accessory, 'metal');

        finalAppearance = {
            ...finalAppearance,
            garment: garmentOverride || finalAppearance.garment,
            headgear: headgearOverride || finalAppearance.headgear,
            footwear: footwearOverride || finalAppearance.footwear,
            belt: beltOverride || finalAppearance.belt,
            accessory: accessoryOverride || finalAppearance.accessory
        };
    }
    
    // Calculate health based on potentially modified stats
    const maxHealth = 80 + baseProfile.stats.constitution * 2 + baseProfile.stats.strength;
    const startingHealth = spec.health === 'sickly' ? 
        Math.floor(maxHealth * (0.5 + Math.random() * 0.2)) : // 50-70% for sickly
        spec.health === 'unhealthy' ?
        Math.floor(maxHealth * (0.6 + Math.random() * 0.2)) : // 60-80% for unhealthy
        Math.floor(maxHealth * (0.8 + Math.random() * 0.2)); // 80-100% for average/healthy
    
    // Characters always start relatively well-rested (max 20% fatigue)
    const baseFatigue = Math.random() * 20; // 0-20% fatigue
    const constitutionBonus = baseProfile.stats.constitution - 10;
    // Constitution can further reduce fatigue, but never below 0
    const startingFatigue = Math.max(0, Math.min(20, baseFatigue - constitutionBonus));
    
    const staticPortraitSeed = Math.floor(Math.random() * 1000000);
    
    const classLabel = spec.classLabel || socialClass;

    const partialCharacter: Omit<PlayerCharacter, 'backstory' | 'id' | 'inventory' | 'party' | 'eventLog' | 'profileImage' | 'isLlmEnhanced'> = {
        ...baseProfile,
        name,
        class: classLabel,
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
        family: Array.isArray(spec.family) ? [...spec.family] : [],
        lifeEvents: [],
        mapReputation: Math.floor(20 + Math.random() * 60 + (socialClass === 'Noble' ? 20 : socialClass === 'Merchant' ? 10 : 0)), // 20-80 base, with bonus for nobles/merchants
        appearance: finalAppearance,
        equippedItems,
    };
    
    // Generate attribute badges for custom character BEFORE backstory
    const attributes = AttributeBadgeService.generateAttributes(
        partialCharacter as PlayerCharacter,
        dateInfo.year,
        context.location
    );

    // Add attributes to character before generating backstory
    const characterWithAttributes = { ...partialCharacter, attributes };

    // Use custom backstory if provided, otherwise generate procedural one with attributes
    const backstory = spec.customBackstory || spec.characterDescription || _generateProceduralBackstory(characterWithAttributes as PlayerCharacter);

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
    
    // Add life events (skip for curated identities)
    const currentYear = dateInfo.year;
    const birthYear = currentYear - partialCharacter.age;
    (partialCharacter as any).birthYear = birthYear.toString();
    if (spec.identitySource !== 'curated') {
        const birthplaceLabel = spec.birthplace || context.region;
        partialCharacter.lifeEvents.push({ year: birthYear, event: `Born in the region of ${birthplaceLabel}.`});
        if (partialCharacter.age > 16) {
            partialCharacter.lifeEvents.push({ year: birthYear + 16, event: `Came of age and began training as a ${role}.`});
        }
        if (partialCharacter.age > 25 && noise.random() > 0.5) {
            partialCharacter.lifeEvents.push({ year: birthYear + 22, event: `Left home to seek fortune.`});
        }
    }
    
    // Add family if not provided by spec
    if (!Array.isArray(spec.family)) {
        const fatherName = generateNpcName('Male', culturalZone, context.region, currentYear - partialCharacter.age - 25, noise);
        partialCharacter.family.push({ name: fatherName, relation: 'father', profession: 'Farmer' });
        const motherName = generateNpcName('Female', culturalZone, context.region, currentYear - partialCharacter.age - 25, noise);
        partialCharacter.family.push({ name: motherName, relation: 'mother', profession: 'Homemaker' });
    }
    
    // Initialize disease health with potential disease based on stats and setting
    const diseaseService = DiseaseService.getInstance();
    
    let diseaseHealth = undefined;
    
    // Check if a specific disease was requested via WorldWeaver
    if (spec.disease) {
        console.log(`[Character Generator] Specific disease requested: ${spec.disease}`);

        // Try exact match first
        diseaseHealth = diseaseService.assignSpecificDisease(
            { health: undefined } as any,
            spec.disease,
            generationContext.era,
            culturalZone,
            dateInfo.year
        );

        // If exact match failed, try fuzzy matching
        if (!diseaseHealth || diseaseHealth.currentDiseases.length === 0) {
            console.log(`[Character Generator] Exact match failed for '${spec.disease}', trying fuzzy match...`);

            // Normalize: uppercase, replace spaces with underscores, remove punctuation
            const normalizedId = spec.disease
                .toUpperCase()
                .replace(/\s+/g, '_')
                .replace(/[^A-Z0-9_]/g, '');

            console.log(`[Character Generator] Normalized disease ID: ${normalizedId}`);

            diseaseHealth = diseaseService.assignSpecificDisease(
                { health: undefined } as any,
                normalizedId,
                generationContext.era,
                culturalZone,
                dateInfo.year
            );
        }

        // Check if we successfully assigned the disease
        if (diseaseHealth && diseaseHealth.currentDiseases.length > 0) {
            console.log(`[Character Generator] ✓ Custom character given requested disease: ${diseaseHealth.currentDiseases[0].disease.name}`);
        } else {
            // Disease not available for this era/region - force a contextually appropriate disease
            console.warn(`[Character Generator] ⚠ Disease '${spec.disease}' not available for ${generationContext.era}/${culturalZone}/${dateInfo.year}`);
            console.log(`[Character Generator] Forcing contextually appropriate disease instead...`);

            // Override health spec to force disease selection below
            if (!spec.health || spec.health === 'average' || spec.health === 'healthy') {
                spec.health = 'sick'; // Force 100% disease chance
            }
        }
    }
    
    // If no specific disease requested or assignment failed, use random chance
    if (!diseaseHealth) {
        // SIMPLIFIED: Base 33% chance (1 in 3) like NPCs
        // Health specification affects disease chance
        let diseaseChance = 0.33;

        if (spec.health === 'sick') {
            diseaseChance = 1.0; // 100% chance for sick characters
            console.log(`[Character Generator] Health spec is 'sick', guaranteeing disease`);
        } else if (spec.health === 'sickly') {
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
            // console.log(`[Character Generator] Custom character spawned healthy (disease chance was ${(diseaseChance * 100).toFixed(1)}%`);
        }
    }
    
    // Attributes already generated above before backstory
    
    if (attributes.length > 0) {
        console.log(`[Character Generator] Generated ${attributes.length} attribute badge(s) for custom character:`, 
            attributes.map(a => `${a.name} (${a.rarity})`).join(', '));
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
        attributes, // Add generated attribute badges
    };

    // Add ethnicCulturalZone if ethnicity is different from geographic zone
    const specEthnicity = (spec as any).ethnicity;
    const geographicZone = mapLocationToCulture(context.location, dateInfo.year);
    if (specEthnicity && specEthnicity !== geographicZone) {
        (character as any).ethnicCulturalZone = specEthnicity;
        console.log(`[Character Generator] Set ethnicCulturalZone '${specEthnicity}' for ${name} (geographic zone: ${geographicZone})`);
    }

    console.log(`[Character Generator] Generated custom character ${name}, a ${role} with specifications`);

    return character;
}

export function generateCharacter(context: GenerationContext): PlayerCharacter {
    console.log('[Character Generator] Starting enhanced character generation');
    
    // Check for URL generation context to override the passed context
    const urlGenerationContext = localStorage.getItem('urlGenerationContext');
    let finalContext = context;
    
    if (urlGenerationContext) {
        try {
            const urlCtx = JSON.parse(urlGenerationContext);
            console.log('[URL_RESTORE] Using URL generation context:', urlCtx);
            
            // Override context with URL values
            finalContext = {
                date: urlCtx.date || context.date,
                location: urlCtx.location || context.location,
                region: urlCtx.region || context.region
            };
            
            // Clear after use to prevent reuse
            localStorage.removeItem('urlGenerationContext');
        } catch (error) {
            console.error('[Character Generator] Failed to parse URL generation context:', error);
        }
    }
    
    // Check for character data from URL
    const urlCharacterData = localStorage.getItem('urlCharacterData');
    if (urlCharacterData) {
        try {
            const charData = JSON.parse(urlCharacterData);
            
            // Check if this data has already been used
            if (!charData._used) {
                console.log('[URL_RESTORE] Step 5: Using URL character data:', charData);
                
                // Mark as used but don't remove yet - in case of re-renders
                charData._used = true;
                localStorage.setItem('urlCharacterData', JSON.stringify(charData));
                
                // Schedule removal after a delay to handle React re-renders
                setTimeout(() => {
                    console.log('[URL_RESTORE] Clearing used character data from localStorage');
                    localStorage.removeItem('urlCharacterData');
                    localStorage.removeItem('urlGenerationContext');
                }, 5000);
                
                // Generate character with the specified data using the correct context
                const spec: CharacterSpecification = {
                    name: charData.name,
                    age: charData.age,
                    gender: charData.gender,
                    profession: charData.profession,
                    socialClass: normalizeSocialClassInput(charData.socialClass),
                    classLabel: charData.classLabel,
                    health: charData.health as any,
                    birthplace: charData.birthplace,
                    family: Array.isArray(charData.family) ? charData.family : undefined,
                    clothing: charData.clothing,
                    characterDescription: charData.characterDescription,
                    ethnicity: charData.ethnicity,
                    identitySource: charData.identitySource,
                    customItems: Array.isArray(charData.customItems) ? charData.customItems : undefined
                };
                
                return generateCharacterWithSpec(finalContext, spec);
            } else {
                console.log('[URL_RESTORE] Character data already used, generating new character');
                // Data was already used, remove it and generate normally
                localStorage.removeItem('urlCharacterData');
                localStorage.removeItem('urlGenerationContext');
            }
        } catch (error) {
            console.error('[Character Generator] Failed to parse URL character data:', error);
            localStorage.removeItem('urlCharacterData');
            localStorage.removeItem('urlGenerationContext');
        }
    }
    
    const noise = new ValueNoise(Date.now() + Math.random() * 10000);
    const dateInfo = parseDateString(finalContext.date);
    const culturalZone = mapLocationToCulture(finalContext.location, dateInfo.year);
    const generationContext = { 
        era: dateInfo.era as HistoricalEra, 
        culturalZone,
        region: finalContext.region,
    };
    
    const baseProfile = generateBaseProfile(noise, generationContext);
    const { socialClass, role, nameKey } = determineSocialRole(baseProfile, generationContext);
    const name = generateNpcName(baseProfile.gender, culturalZone, context.region, dateInfo.year, noise, nameKey);

    // Detect ethnicity from name for historically accurate appearance
    const detectedEthnicity = detectEthnicityFromName(name);
    const appearanceEthnicity = detectedEthnicity || culturalZone; // Fallback to geographic zone

    // Regenerate appearance with correct ethnicity if ethnicity differs from geographic zone
    if (detectedEthnicity && detectedEthnicity !== culturalZone) {
        const ethnicAppearance = generateCulturalAppearance(appearanceEthnicity, noise);
        baseProfile.appearance = { ...baseProfile.appearance, ...ethnicAppearance };
    }
    
    // Create a minimal character first for companion generation
    const tempCharacter: Partial<PlayerCharacter> = {
        name,
        profession: role,
        year: dateInfo.year,
    };
    
    // Get starting package and inventory first with color support
    const privilege = baseProfile.wealthLevel === 'wealthy' ? 0.8 : 
                     baseProfile.wealthLevel === 'comfortable' ? 0.6 : 
                     baseProfile.wealthLevel === 'modest' ? 0.4 : 0.2;
                     
    const { inventory, equippedItems } = assembleStartingPackage(role, tempCharacter as PlayerCharacter, {
        culture: culturalZone,
        era: generationContext.era,
        privilege
    });

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
    
    // Generate cultural markings based on culture, profession, and context
    const markingProbability = getMarkingProbability(culturalZone, generationContext.era, role);
    const markings: any[] = [];
    
    // console.log(`[CharGen] Marking probability for ${culturalZone}/${generationContext.era}/${role}: ${markingProbability}`);
    
    // Determine how many markings to add based on culture - MORE historically accurate
    let numMarkings = 0;
    if (noise.random() < markingProbability) {
        // Higher probability cultures often have multiple markings
        if (culturalZone === 'OCEANIA' || culturalZone === 'NORTH_AMERICAN_PRE_COLUMBIAN' || 
            culturalZone === 'SUB_SAHARAN_AFRICAN' || culturalZone === 'SOUTH_AMERICAN') {
            // These cultures almost always had multiple types of body modifications
            const roll = noise.random();
            if (roll < 0.4) numMarkings = 3;       // 40% chance for 3 markings
            else if (roll < 0.8) numMarkings = 2;  // 40% chance for 2 markings
            else numMarkings = 1;                  // 20% chance for 1 marking
            
            // Minimum 2 for adults in these cultures
            if (baseProfile.age > 18) numMarkings = Math.max(2, numMarkings);
        } else if (culturalZone === 'SOUTH_ASIAN' || culturalZone === 'MENA') {
            // Often have both daily (bindi/kohl) and special (henna) markings
            numMarkings = noise.random() < 0.7 ? 2 : 1; // 70% chance for 2
            // Women often have more markings
            if (baseProfile.gender?.toLowerCase() === 'female') {
                numMarkings = Math.max(2, numMarkings);
            }
        } else {
            // Even European/East Asian cultures often had some daily markings
            numMarkings = noise.random() < 0.3 ? 2 : 1; // 30% chance for 2
        }
    }
    
    const usedTypes = new Set<string>();
    for (let i = 0; i < numMarkings; i++) {
        const availableMarkings = getMarkingsForCharacter(
            culturalZone,
            generationContext.era,
            role,
            baseProfile.gender?.toLowerCase() as 'male' | 'female' || 'male',
            baseProfile.wealthLevel || 'modest',
            baseProfile.age,
            i === 0 ? 'daily' : (noise.random() < 0.5 ? 'ceremony' : 'daily')
        ).filter(m => !usedTypes.has(m.type)); // Don't repeat marking types
        
        // console.log(`[CharGen] Found ${availableMarkings.length} available markings for slot ${i+1}`);
        
        const selectedMarking = selectRandomMarking(availableMarkings, noise.random());
        if (selectedMarking) {
            usedTypes.add(selectedMarking.type);
            const pattern = getRandomPattern(selectedMarking, noise.random());
            if (pattern) {
                const appearanceMarking = convertToAppearanceMarking(selectedMarking, pattern);
                markings.push(appearanceMarking);
                // console.log(`[CharGen] Added cultural marking: ${pattern.localName || pattern.name} (${selectedMarking.type}`);
            }
        }
    }

    // Generate glasses based on era, profession, age, and cultural zone (historically accurate)
    let glassesBaseProbability = 0;

    // Cultural zones with historical access to glasses
    const hasGlassesAccess =
        culturalZone === 'EUROPEAN' ||
        culturalZone === 'MENA' || // Islamic world had early eyeglass development
        (culturalZone === 'EAST_ASIAN' && dateInfo.era !== 'RENAISSANCE_EARLY_MODERN') || // China had glasses later
        (culturalZone === 'NORTH_AMERICAN_COLONIAL' && dateInfo.era !== 'RENAISSANCE_EARLY_MODERN'); // Colonial imports

    if (hasGlassesAccess) {
        if (dateInfo.era === 'RENAISSANCE_EARLY_MODERN') {
            glassesBaseProbability = culturalZone === 'EUROPEAN' ? 0.05 :
                                   culturalZone === 'MENA' ? 0.02 : 0; // Europe first, MENA second
        } else if (dateInfo.era === 'INDUSTRIAL_ERA') {
            glassesBaseProbability = culturalZone === 'EUROPEAN' ? 0.15 :
                                   culturalZone === 'NORTH_AMERICAN_COLONIAL' ? 0.20 :
                                   culturalZone === 'EAST_ASIAN' ? 0.10 :
                                   culturalZone === 'MENA' ? 0.2 : 0;
        } else if (dateInfo.era === 'MODERN_ERA') {
            glassesBaseProbability = 0.25; // Widely available by modern era
        }
    }

    const shouldHaveGlasses = glassesBaseProbability > 0 && (
        noise.random() < glassesBaseProbability || // Base cultural probability
        (role.toLowerCase().includes('scholar') && noise.random() < 0.6) || // 60% for scholars
        (role.toLowerCase().includes('scribe') && noise.random() < 0.5) || // 50% for scribes
        (role.toLowerCase().includes('merchant') && culturalZone === 'EUROPEAN' && noise.random() < 0.25) || // 25% for European merchants
        (baseProfile.age > 50 && noise.random() < 0.3) // 30% for older people
    );

    const glassesStyles = ['round', 'square', 'oval', 'half_rim'] as const;
    const selectedGlassesStyle = shouldHaveGlasses ?
        glassesStyles[Math.floor(noise.random() * glassesStyles.length)] : undefined;

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
        accessory: equippedItems.accessory
            ? { name: equippedItems.accessory.name, material: equippedItems.accessory.material || 'metal' }
            : baseProfile.appearance.accessory,
        markings: markings.length > 0 ? markings : undefined,
        hasGlasses: shouldHaveGlasses,
        glassesStyle: selectedGlassesStyle
    };
    
    const maxHealth = 80 + baseProfile.stats.constitution * 2 + baseProfile.stats.strength;
    const startingHealth = Math.floor(maxHealth * (0.8 + Math.random() * 0.2)); // 80-100% of max health
    
    // Characters always start relatively well-rested (max 20% fatigue)
    // Regardless of time of day, newly spawned characters are fresh
    const baseFatigue = Math.random() * 20; // 0-20% fatigue

    // Constitution affects fatigue resistance
    const constitutionBonus = baseProfile.stats.constitution - 10;
    // Constitution can further reduce fatigue, but never below 0 or above 20
    const startingFatigue = Math.max(0, Math.min(20, baseFatigue - constitutionBonus));
    
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
    
    // Generate attribute badges BEFORE backstory so they can be included in the text
    const attributes = AttributeBadgeService.generateAttributes(
        partialCharacter as PlayerCharacter,
        dateInfo.year,
        context.location
    );

    // Add attributes to character before generating backstory
    // Ethnicity already detected and applied above
    if (detectedEthnicity) {
        console.log(`[Character Generator] Detected ethnicity '${detectedEthnicity}' from name '${name}' (geographic zone: ${culturalZone})`);
        // Store as ethnicCulturalZone to distinguish from geographic culturalZone
        (partialCharacter as any).ethnicCulturalZone = detectedEthnicity;
    }

    const characterWithAttributes = { ...partialCharacter, attributes };

    // The backstory is generated from the final, consistent character data including attributes
    const backstory = _generateProceduralBackstory(characterWithAttributes as PlayerCharacter);
    
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
        // console.log(`[Character Generator] Character spawned healthy (disease chance was ${(diseaseChance * 100).toFixed(1)}%`);
    }

    // Attributes already generated above before backstory
    
    if (attributes.length > 0) {
        console.log(`[Character Generator] Generated ${attributes.length} attribute badge(s):`, 
            attributes.map(a => `${a.name} (${a.rarity})`).join(', '));
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
        attributes, // Add generated attribute badges
    };
    
    console.log(`[Character Generator] Generated character ${name}, a ${role} with static portrait seed ${staticPortraitSeed}`);
    
    return character;
}
