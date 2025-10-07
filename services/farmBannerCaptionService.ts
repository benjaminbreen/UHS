/**
 * services/farmBannerCaptionService.ts
 * Generates contextual captions for farm banner describing visible activities
 */

import { Season, TimeOfDay } from '../types';

interface FarmHouseholdMember {
  id: string;
  name: string;
  age: number;
  role: 'Farmer' | 'Laborer' | 'Child' | 'Elder';
  gender: 'Male' | 'Female';
  currentTask?: string;
}

interface BehaviorData {
  behavior?: 'walking_rows' | 'tending_tree' | 'resting' | 'carrying' | 'inspecting';
}

interface FarmCharacter extends BehaviorData {
  id: string;
  role?: string;
}

interface CaptionParams {
  householdMembers?: FarmHouseholdMember[];
  visibleCharacters: FarmCharacter[];
  timeOfDay: TimeOfDay;
  season: Season;
  cropType: string;
  maxFieldWorkers: number;
  weather?: {
    isRaining?: boolean;
    isSnowing?: boolean;
    isDrought?: boolean;
  };
}

interface CaptionResult {
  text: string;
  characterNames: Array<{ name: string; id: string }>;
}

/**
 * Convert behavior type to human-readable activity description with seasonal/weather context
 */
function behaviorToActivity(
  behavior: string | undefined,
  cropType: string,
  season: Season,
  weather?: { isRaining?: boolean; isSnowing?: boolean; isDrought?: boolean }
): string {
  if (!behavior) return 'working the fields';

  const cropLower = cropType.toLowerCase();
  const isOrchard = ['apple', 'orange', 'olive', 'cherry', 'plum', 'peach', 'pear'].some(c => cropLower.includes(c));
  const isVineyard = cropLower.includes('grape') || cropLower.includes('vine');

  // Season-specific verbs
  const seasonalContext = {
    spring: { verb: 'planting', modifier: 'new' },
    summer: { verb: 'tending', modifier: 'growing' },
    fall: { verb: 'harvesting', modifier: 'ripe' },
    winter: { verb: 'maintaining', modifier: 'dormant' }
  }[season] || { verb: 'tending', modifier: '' };

  switch (behavior) {
    case 'walking_rows':
      if (season === 'spring') return `planting the ${cropLower}`;
      if (season === 'summer' && weather?.isDrought) return 'checking the dry fields';
      return 'walking the fields';

    case 'tending_tree':
      if (isOrchard) {
        const fruitMatch = cropType.match(/(apple|orange|olive|cherry|plum|peach|pear)/i);
        const fruitName = fruitMatch ? fruitMatch[1].toLowerCase() : 'fruit';
        if (season === 'spring') return `pruning the ${fruitName} trees`;
        if (season === 'fall') return `picking ${fruitName}s`;
        return `tending the ${fruitName} trees`;
      }
      return `${seasonalContext.verb} the crops`;

    case 'inspecting':
      if (isVineyard) {
        if (season === 'fall') return 'checking the grape harvest';
        return 'inspecting the vines';
      }
      return 'inspecting the crops';

    case 'carrying':
      if (season === 'fall') return 'carrying the harvest';
      if (season === 'spring') return 'carrying seed';
      return 'hauling supplies';

    case 'resting':
      if (weather?.isSnowing) return 'sheltering from the snow';
      if (weather?.isRaining) return 'waiting out the rain';
      if (season === 'summer') return 'resting in the shade';
      return 'taking a rest';

    default:
      return 'working the fields';
  }
}

/**
 * Format a list of names grammatically
 */
function formatNames(names: string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;

  // 3+ names: "A, B, and C" or "A, B, and 2 others"
  if (names.length === 3) {
    return `${names[0]}, ${names[1]}, and ${names[2]}`;
  } else {
    const othersCount = names.length - 2;
    return `${names[0]}, ${names[1]}, and ${othersCount} other${othersCount > 1 ? 's' : ''}`;
  }
}

/**
 * Group characters by their activity
 */
function groupByActivity(
  characters: FarmCharacter[],
  householdMembers: FarmHouseholdMember[],
  cropType: string,
  season: Season,
  weather?: { isRaining?: boolean; isSnowing?: boolean; isDrought?: boolean }
): Map<string, string[]> {
  const groups = new Map<string, string[]>();

  characters.forEach(char => {
    const member = householdMembers.find(m => m.id === char.id);
    if (!member) return;

    const activity = behaviorToActivity(char.behavior, cropType, season, weather);
    const existing = groups.get(activity) || [];
    existing.push(member.name);
    groups.set(activity, existing);
  });

  return groups;
}

/**
 * Generate a contextual caption for the farm banner
 * Returns both the caption text and character name/ID mappings for linking
 */
export function generateFarmBannerCaption(params: CaptionParams): CaptionResult {
  const {
    householdMembers,
    visibleCharacters,
    timeOfDay,
    season,
    cropType,
    maxFieldWorkers,
    weather,
  } = params;

  // Weather/seasonal modifiers for atmosphere
  const weatherPhrase = weather?.isRaining ? 'through the rain' :
                        weather?.isSnowing ? 'despite the snow' :
                        weather?.isDrought ? 'under the hot sun' : '';

  // Track mentioned characters for linking
  const mentionedCharacters: Array<{ name: string; id: string }> = [];

  // No household data - generic message
  if (!householdMembers || householdMembers.length === 0) {
    if (timeOfDay === 'Night') return { text: 'The farm rests under the night sky.', characterNames: [] };
    if (season === 'winter') return { text: 'The farm lies dormant during winter.', characterNames: [] };
    return { text: 'A quiet farm in the countryside.', characterNames: [] };
  }

  // Night time - everyone asleep
  if (timeOfDay === 'Night') {
    if (weather?.isSnowing) return { text: 'The household sleeps as snow falls outside.', characterNames: [] };
    if (season === 'summer') return { text: 'Everyone rests as crickets chirp in the warm night.', characterNames: [] };
    return { text: 'Everyone is asleep for the night.', characterNames: [] };
  }

  // Dawn - just waking up
  if (timeOfDay === 'Dawn') {
    const headOfHouse = householdMembers.find(m => m.role === 'Farmer') || householdMembers[0];
    mentionedCharacters.push({ name: headOfHouse.name, id: headOfHouse.id });

    if (season === 'spring') return { text: `${headOfHouse.name} rises early to greet the spring morning.`, characterNames: mentionedCharacters };
    if (weather?.isRaining) return { text: `${headOfHouse.name} and the household wake to the sound of rain.`, characterNames: mentionedCharacters };
    return { text: `${headOfHouse.name} and the household stir at dawn.`, characterNames: mentionedCharacters };
  }

  // No visible workers - everyone inside
  if (visibleCharacters.length === 0 || maxFieldWorkers === 0) {
    if (weather?.isSnowing) return { text: 'The family huddles inside during the snowfall.', characterNames: [] };
    if (weather?.isRaining) return { text: 'Everyone waits indoors for the rain to pass.', characterNames: [] };
    if (season === 'winter') return { text: 'The family stays warm inside during the cold winter.', characterNames: [] };
    if (timeOfDay === 'Dusk') return { text: 'The family gathers inside as evening falls.', characterNames: [] };
    return { text: 'The family is resting inside the house.', characterNames: [] };
  }

  // Workers visible - describe their activities
  const activityGroups = groupByActivity(visibleCharacters, householdMembers, cropType, season, weather);

  // Collect character IDs from visible characters
  visibleCharacters.forEach(char => {
    const member = householdMembers.find(m => m.id === char.id);
    if (member) {
      mentionedCharacters.push({ name: member.name, id: member.id });
    }
  });

  // Single activity - all doing the same thing
  if (activityGroups.size === 1) {
    const [activity, names] = Array.from(activityGroups.entries())[0];
    const nameList = formatNames(names);
    const verb = names.length === 1 ? 'is' : 'are';

    let text: string;

    // Add weather context if present
    if (weatherPhrase && (weather?.isRaining || weather?.isDrought)) {
      text = `${nameList} ${verb} ${activity} ${weatherPhrase}.`;
    }
    // Add seasonal context for certain activities
    else if (season === 'summer' && timeOfDay === 'Midday') {
      text = `${nameList} ${verb} ${activity} under the hot sun.`;
    }
    else if (season === 'fall' && activity.includes('harvest')) {
      text = `${nameList} ${verb} ${activity} before winter comes.`;
    }
    else {
      text = `${nameList} ${verb} ${activity}.`;
    }

    return { text, characterNames: mentionedCharacters };
  }

  // Multiple activities - describe up to 2 groups
  const entries = Array.from(activityGroups.entries());

  if (entries.length === 2) {
    const [activity1, names1] = entries[0];
    const [activity2, names2] = entries[1];

    // Format: "A is doing X while B is doing Y"
    const name1 = formatNames(names1.slice(0, 2)); // Max 2 names per group
    const name2 = formatNames(names2.slice(0, 2));
    const verb1 = names1.length === 1 ? 'is' : 'are';
    const verb2 = names2.length === 1 ? 'is' : 'are';

    let caption = `${name1} ${verb1} ${activity1} while ${name2} ${verb2} ${activity2}`;

    // Add weather/seasonal context
    if (weatherPhrase) {
      caption += `, ${weatherPhrase}`;
    } else if (season === 'spring' && timeOfDay === 'Day') {
      caption += ', welcoming the new season';
    }

    caption += '.';

    return { text: caption, characterNames: mentionedCharacters };
  }

  // 3+ activities - just list people generically
  const allNames = visibleCharacters
    .map(c => householdMembers.find(m => m.id === c.id)?.name)
    .filter(Boolean) as string[];
  const nameList = formatNames(allNames.slice(0, 3));
  const verb = allNames.length === 1 ? 'is' : 'are';

  let text: string;
  if (weatherPhrase) {
    text = `${nameList} ${verb} working the farm ${weatherPhrase}.`;
  } else {
    text = `${nameList} ${verb} working the farm.`;
  }

  return { text, characterNames: mentionedCharacters };
}
