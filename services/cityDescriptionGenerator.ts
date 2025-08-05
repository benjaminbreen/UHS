/**
 * services/cityDescriptionGenerator.ts - Enhanced procedural text for city centers.
 */
import { HistoricalEra, ClimateType, MapData, BiomeType, CulturalZone } from '../types';

export type Condition = 'humble' | 'prosperous';
export type CitySize = 'smaller_city' | 'big_city';

interface CityContext {
    era: HistoricalEra;
    culturalZone: CulturalZone;
    condition: Condition;
    climate: ClimateType;
    size: CitySize;
    mapData: MapData;
}

const fragments = {
    size: {
        smaller_city: [
            "This is the heart of a modest but proud city, where everyone knows their neighbors.",
            "The city center, though not vast, is clearly the focal point of regional life and commerce.",
            "All roads seem to lead to this central square, the hub of a growing settlement.",
            "The compact city center bustles with the energy of a close-knit community.",
            "Though small in scale, this urban center punches above its weight in importance.",
            "The city may be modest in size, but it serves as a vital crossroads for the region.",
            "This charming city center reflects the ambitions of a community on the rise."
        ],
        big_city: [
            "You stand in the sprawling center of a great metropolis, a testament to human ambition.",
            "The sheer scale of the city center is breathtaking, with grand avenues stretching to the horizon.",
            "This is a major hub of civilization, where people and goods from across the world converge.",
            "The massive urban center pulses with the energy of hundreds of thousands of inhabitants.",
            "Great boulevards and monumental architecture speak to the city's importance and power.",
            "The vastness of the metropolitan center reflects the accumulated wealth of generations.",
            "This colossal city center serves as the beating heart of a commercial and cultural empire."
        ]
    },
    
    condition: {
        humble: [
            "The buildings are functional rather than ornate, and the public spaces show signs of honest wear.",
            "Simple but sturdy architecture reflects the practical needs of working people.",
            "The city's modest wealth is evident in well-maintained but unpretentious structures.",
            "Clean streets and basic amenities speak to a community that takes care of its own.",
            "Though not wealthy, the city maintains a dignified appearance through collective effort."
        ],
        prosperous: [
            "Grand architecture, polished plazas, and the fine attire of citizens all speak to immense wealth.",
            "Elaborate decorations and premium materials are evident in every public building.",
            "The city's prosperity is displayed in magnificent fountains, statues, and manicured gardens.",
            "Wealth flows through every aspect of the urban landscape, from cobblestones to rooftops.",
            "The opulent city center showcases the accumulated riches of successful commerce and industry."
        ]
    },
    
    era: {
        [HistoricalEra.PREHISTORY]: [
            "Earthworks and wooden palisades mark the boundaries of this early settlement.",
            "Stone circles and burial mounds indicate the spiritual significance of this gathering place.",
            "Simple but effective fortifications protect the community's stored goods and ceremonies."
        ],
        [HistoricalEra.ANTIQUITY]: [
            "Columns, forums, and temples dominate the skyline, built in the classical architectural style.",
            "Marble statues of gods and heroes watch over the citizenry from their pedestals.",
            "The organized street grid and aqueducts demonstrate advanced urban planning.",
            "Amphitheaters and public baths serve as centers of social and cultural life."
        ],
        [HistoricalEra.MEDIEVAL]: [
            "A great cathedral or castle often looms over the square, symbolizing divine or feudal authority.",
            "Narrow, winding streets radiate from the central plaza like spokes of a wheel.",
            "Thick stone walls and defensive towers speak to an age of constant conflict.",
            "Guild halls and market crosses mark the importance of organized commerce and crafts."
        ],
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
            "The architecture is elegant, with ornate palaces and statues celebrating great artists and thinkers.",
            "Mathematical precision in building placement reflects the rediscovery of classical principles.",
            "Banking houses and merchant palaces display the growing power of commercial wealth.",
            "Universities and libraries indicate the flowering of learning and intellectual pursuits."
        ],
        [HistoricalEra.INDUSTRIAL_ERA]: [
            "A haze of coal smoke hangs in the air, and factory smokestacks pierce the skyline.",
            "Grand buildings of the industrial age stand beside older, soot-stained structures.",
            "Railway stations and telegraph lines connect this city to a rapidly shrinking world.",
            "The rhythmic clatter of machinery provides a constant industrial heartbeat."
        ],
        [HistoricalEra.MODERN_ERA]: [
            "The roar of traffic is a constant backdrop to towering steel and glass buildings.",
            "Electric lights blaze even in daylight, banishing the ancient rhythm of day and night.",
            "Skyscrapers reach toward the heavens, monuments to technological achievement.",
            "Telephone wires and early radio towers create a web of instant communication."
        ],
        [HistoricalEra.FUTURE_ERA]: [
            "Gleaming towers of unknown materials reflect the sky.",
            "Silent, automated vehicles glide along designated pathways.",
            "The air is clean and carries the faint hum of advanced technology.",
            "Holographic advertisements flicker in the public spaces."
        ]
    },
    
    culture: {
        EUROPEAN: ["The architecture blends Gothic spires, Romanesque arches, and stately Renaissance facades depending on the city's age."],
        EAST_ASIAN: ["Elegant pagodas and traditional curved rooflines dominate the urban silhouette."],
        MENA: ["Minarets pierce the sky, and geometric patterns adorn the facades of important buildings."],
        NORTH_AMERICAN_PRE_COLUMBIAN: ["Earthen mounds and ceremonial plazas reflect the spiritual significance of this gathering place."],
        OCEANIA: ["Traditional meeting houses with intricate carvings serve as the community's focal points."],
        SOUTH_ASIAN: ["Hindu temples with elaborate towers and Buddhist stupas create a diverse religious landscape."],
        SOUTH_AMERICAN: ["Stepped pyramids and stone platforms reflect advanced astronomical and architectural knowledge."],
        SUB_SAHARAN_AFRICAN: ["Traditional round houses with conical roofs cluster around central courtyards, reflecting a deep connection to community."]
    },
    
    location: {
        COASTAL: ["The scent of salt and the cry of gulls are ever-present, reminding all that the city's fortune is tied to the sea."],
        RIVER: ["A wide, busy river flows through the heart of the city, crossed by impressive bridges."],
        MOUNTAIN: ["The city is nestled in a valley or built upon a high plateau, with mountain peaks visible from every street."],
        PLAINS: ["Endless horizons and big skies create a sense of limitless possibility and expansion."],
        FOREST: ["Dense woodlands surround the city, providing both resources and natural protection."]
    },
    
    climate: {
        [ClimateType.ARID]: ["Dust kicks up from the dry ground, and merchants seek shade under canvas awnings."],
        [ClimateType.COLD]: ["Braziers burn at the corners of stalls, and shoppers are bundled in thick furs and wool."],
        [ClimateType.TEMPERATE]: ["The moderate climate supports year-round activity and steady economic growth."],
        [ClimateType.TROPICAL]: ["The humid air is thick with the sweet smell of ripe fruit and tropical flowers. Intermittent downpours do little to dampen the lively atmosphere."],
        [ClimateType.SEMITROPICAL]: ["Awnings provide welcome shade from the strong sun, and the air is alive with the buzz of insects."]
    }
};

const getRandomFragment = (arr: string[] | undefined): string => {
    if (!arr || arr.length === 0) return '';
    return arr[Math.floor(Math.random() * arr.length)];
};

export function generateCityDescription(context: CityContext): string {
    const { era, culturalZone, condition, climate, size, mapData } = context;
    const sentences: string[] = [];

    // 1. Size & Condition
    sentences.push(getRandomFragment(fragments.size[size]));
    sentences.push(getRandomFragment(fragments.condition[condition]));

    // 2. Era
    const eraFragment = getRandomFragment(fragments.era[era] || fragments.era[HistoricalEra.MEDIEVAL]);
    if (eraFragment) sentences.push(eraFragment);

    // 3. Culture
    const cultureFragment = getRandomFragment(fragments.culture[culturalZone] || fragments.culture.EUROPEAN);
    if (cultureFragment) sentences.push(cultureFragment);
    
    // 4. Location/Geography (if applicable)
    const hasMajorRiver = mapData.tiles.flat().some(t => t.biome === BiomeType.MAJOR_RIVER);
    const isCoastal = mapData.tiles.flat().some(t => t.isCoast);
    const isMountainous = mapData.tiles.flat().some(t => t.biome === BiomeType.MOUNTAIN || t.biome === BiomeType.HIGH_PEAK);
    
    if (hasMajorRiver) {
        sentences.push(getRandomFragment(fragments.location.RIVER));
    } else if (isCoastal) {
        sentences.push(getRandomFragment(fragments.location.COASTAL));
    } else if (isMountainous) {
        sentences.push(getRandomFragment(fragments.location.MOUNTAIN));
    } else {
        sentences.push(getRandomFragment(fragments.location.PLAINS));
    }
    
    // 5. Climate (60% chance)
    if (Math.random() > 0.4) {
        const climateFragments = fragments.climate[climate];
        if (climateFragments) {
            sentences.push(getRandomFragment(climateFragments));
        }
    }

    // Remove duplicates and limit to 3-4 sentences for readability
    const uniqueSentences = [...new Set(sentences.filter(s => s.length > 0))];
    const finalDescription = uniqueSentences.slice(0, Math.min(4, uniqueSentences.length)).join(' ');

    return finalDescription;
}