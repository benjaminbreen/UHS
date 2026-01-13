/**
 * services/structureNamingService.ts - Generates historically accurate,
 * era and culture-specific names for structures like waystations and wells.
 */

import { CulturalZone, HistoricalEra } from '../types';
import { ValueNoise } from '../utils/noise';

// ========================================
// WAYSTATION NAMING - Travel/Rest Structures
// ========================================

interface WaystationNameConfig {
    prefixes?: string[];
    suffixes?: string[];
    standalone: string[];
}

const WAYSTATION_NAMES: Record<string, Record<string, WaystationNameConfig>> = {
    EUROPEAN: {
        PREHISTORY: {
            prefixes: ['Travelers\'', 'Wanderers\'', 'Hunters\''],
            standalone: ['Seasonal Camp', 'Trail Shelter', 'Waystone Camp', 'Gathering Site', 'Trailhead Camp']
        },
        ANTIQUITY: {
            prefixes: ['Via', 'Ad', 'Post'],
            standalone: ['Mansio', 'Mutatio', 'Statio', 'Taberna', 'Hospitium', 'Caupona', 'Road Station', 'Milestone Inn']
        },
        MEDIEVAL: {
            prefixes: ['The', 'Saint', 'Old'],
            suffixes: ['Inn', 'Hostel', 'Rest', 'House', 'Lodge'],
            standalone: ['Pilgrim Hostel', 'Wayfarer\'s Rest', 'Roadside Inn', 'Traveler\'s Lodge', 'Coaching Inn', 'Hospice', 'Guesthouse']
        },
        RENAISSANCE_EARLY_MODERN: {
            prefixes: ['The', 'Royal', 'Old', 'Grand'],
            suffixes: ['Inn', 'Tavern', 'Arms', 'Head', 'House'],
            standalone: ['Coaching Inn', 'Post House', 'Posting Inn', 'Road House', 'Stage Stop', 'Hostelry']
        },
        INDUSTRIAL_ERA: {
            prefixes: ['The', 'Grand', 'Railway', 'Station'],
            suffixes: ['Hotel', 'Inn', 'House', 'Lodge'],
            standalone: ['Railway Hotel', 'Stage Station', 'Coaching House', 'Travelers\' Rest', 'Road House', 'Commercial Hotel']
        },
        MODERN_ERA: {
            standalone: ['Motel', 'Highway Inn', 'Travel Lodge', 'Rest Stop', 'Service Station', 'Motor Hotel', 'Roadside Inn']
        }
    },
    MENA: {
        PREHISTORY: {
            standalone: ['Oasis Camp', 'Desert Shelter', 'Water Camp', 'Waypoint', 'Seasonal Ground']
        },
        ANTIQUITY: {
            standalone: ['Road Station', 'Desert Post', 'Oasis Station', 'Trade Post', 'Wayside Shelter', 'Travelers\' Rest']
        },
        MEDIEVAL: {
            prefixes: ['Khan', 'Ribat'],
            standalone: ['Caravanserai', 'Khan', 'Ribat', 'Funduq', 'Wikala', 'Fondaco', 'Trade Rest', 'Pilgrim Lodge']
        },
        RENAISSANCE_EARLY_MODERN: {
            standalone: ['Caravanserai', 'Khan', 'Funduq', 'Wakala', 'Han', 'Kervansaray', 'Desert Lodge', 'Oasis Rest']
        },
        INDUSTRIAL_ERA: {
            standalone: ['Caravanserai', 'Desert Hotel', 'Oasis Lodge', 'Rest House', 'Trade Hotel']
        },
        MODERN_ERA: {
            standalone: ['Desert Hotel', 'Oasis Resort', 'Highway Rest', 'Travel Stop']
        }
    },
    EAST_ASIAN: {
        PREHISTORY: {
            standalone: ['Trail Camp', 'Traveler\'s Shelter', 'Path Rest', 'Waypoint']
        },
        ANTIQUITY: {
            standalone: ['Yizhan', 'Post Station', 'Road Lodge', 'Government Rest', 'Imperial Post', 'Courier Station']
        },
        MEDIEVAL: {
            standalone: ['Yizhan', 'Kezhan', 'Shukuba', 'Honjin', 'Post Town Inn', 'Tea House', 'Road Station', 'Jumak']
        },
        RENAISSANCE_EARLY_MODERN: {
            standalone: ['Kezhan', 'Luguan', 'Ryokan', 'Honjin', 'Tea House Inn', 'Post Station', 'Courier Lodge']
        },
        INDUSTRIAL_ERA: {
            standalone: ['Railway Inn', 'Station Hotel', 'Travelers\' House', 'Road Hotel', 'Commercial Inn']
        },
        MODERN_ERA: {
            standalone: ['Business Hotel', 'Ryokan', 'Highway Inn', 'Rest Area', 'Service Area']
        }
    },
    SOUTH_ASIAN: {
        PREHISTORY: {
            standalone: ['Traveler\'s Shelter', 'Way Camp', 'Path Rest', 'Trail Stop']
        },
        ANTIQUITY: {
            standalone: ['Dharamshala', 'Choultry', 'Sattra', 'Rest House', 'Traveler\'s Shelter', 'Way Station']
        },
        MEDIEVAL: {
            standalone: ['Dharamshala', 'Sarai', 'Choultry', 'Musafirkhana', 'Serai', 'Pilgrim Rest', 'Traveler\'s Lodge']
        },
        RENAISSANCE_EARLY_MODERN: {
            standalone: ['Sarai', 'Dharamshala', 'Musafirkhana', 'Choultry', 'Serai', 'Dak Bungalow', 'Rest House']
        },
        INDUSTRIAL_ERA: {
            standalone: ['Dak Bungalow', 'Rest House', 'Railway Hotel', 'Traveler\'s Bungalow', 'Circuit House']
        },
        MODERN_ERA: {
            standalone: ['Highway Hotel', 'Rest House', 'Tourist Lodge', 'Travel Inn', 'Guest House']
        }
    },
    SUB_SAHARAN_AFRICAN: {
        PREHISTORY: {
            standalone: ['Trail Camp', 'Water Rest', 'Traveler\'s Ground', 'Path Shelter']
        },
        ANTIQUITY: {
            standalone: ['Trade Camp', 'Caravan Ground', 'Water Station', 'Rest Point']
        },
        MEDIEVAL: {
            standalone: ['Trade Post', 'Caravan Rest', 'Market Camp', 'Traveler\'s Ground', 'Desert Station']
        },
        RENAISSANCE_EARLY_MODERN: {
            standalone: ['Trading Post', 'Factor\'s House', 'Caravan Rest', 'Way Station', 'Trade Lodge']
        },
        INDUSTRIAL_ERA: {
            standalone: ['Rest House', 'Trading Station', 'Government Rest', 'Travelers\' Lodge', 'Way Station']
        },
        MODERN_ERA: {
            standalone: ['Highway Lodge', 'Rest Stop', 'Travel Inn', 'Tourist Camp', 'Guest House']
        }
    },
    SOUTH_AMERICAN: {
        PREHISTORY: {
            standalone: ['Trail Shelter', 'Path Camp', 'Way Rest', 'Traveler\'s Ground']
        },
        ANTIQUITY: {
            standalone: ['Trail Rest', 'Way Station', 'Mountain Shelter', 'Valley Camp', 'Trade Post']
        },
        MEDIEVAL: {
            standalone: ['Tambo', 'Chaskiwasi', 'Inca Way Station', 'Royal Tambo', 'Trail House']
        },
        RENAISSANCE_EARLY_MODERN: {
            standalone: ['Posada', 'Tambo', 'Way Station', 'Trail Rest', 'Travelers\' House', 'Road House']
        },
        INDUSTRIAL_ERA: {
            standalone: ['Posada', 'Rest House', 'Road Hotel', 'Travelers\' Inn', 'Way Station']
        },
        MODERN_ERA: {
            standalone: ['Highway Hotel', 'Posada', 'Travel Lodge', 'Rest Stop', 'Tourist Inn']
        }
    },
    NORTH_AMERICAN_PRE_COLUMBIAN: {
        PREHISTORY: {
            standalone: ['Trail Camp', 'Way Rest', 'Traveler\'s Shelter', 'Path Ground']
        },
        ANTIQUITY: {
            standalone: ['Trail Camp', 'Trade Rest', 'Path Shelter', 'Way Station']
        },
        MEDIEVAL: {
            standalone: ['Trail House', 'Trade Camp', 'Way Rest', 'Travelers\' Ground', 'Path Shelter']
        },
        RENAISSANCE_EARLY_MODERN: {
            standalone: ['Trail Rest', 'Trade Post', 'Camp Ground', 'Way Station']
        }
    },
    NORTH_AMERICAN_COLONIAL: {
        RENAISSANCE_EARLY_MODERN: {
            prefixes: ['The', 'Old', 'Colonial'],
            suffixes: ['Inn', 'Tavern', 'House', 'Lodge'],
            standalone: ['Tavern', 'Ordinary', 'Public House', 'Stage Stop', 'Trading Post', 'Road House']
        },
        INDUSTRIAL_ERA: {
            prefixes: ['The', 'Grand', 'American'],
            suffixes: ['Hotel', 'House', 'Inn', 'Lodge'],
            standalone: ['Stagecoach Stop', 'Railway Hotel', 'Road House', 'Travelers\' Rest', 'Commercial Hotel']
        },
        MODERN_ERA: {
            standalone: ['Motel', 'Highway Inn', 'Motor Lodge', 'Rest Stop', 'Travel Center', 'Truck Stop']
        }
    },
    OCEANIA: {
        PREHISTORY: {
            standalone: ['Beach Camp', 'Shore Rest', 'Trail Shelter', 'Way Ground']
        },
        ANTIQUITY: {
            standalone: ['Landing Site', 'Shore Camp', 'Path Rest', 'Coastal Shelter']
        },
        MEDIEVAL: {
            standalone: ['Shore Rest', 'Path Shelter', 'Trail Camp', 'Coastal Ground']
        },
        RENAISSANCE_EARLY_MODERN: {
            standalone: ['Trading Post', 'Mission Rest', 'Travelers\' House', 'Colonial Lodge']
        },
        INDUSTRIAL_ERA: {
            standalone: ['Rest House', 'Travelers\' Inn', 'Station Hotel', 'Colonial Hotel', 'Road House']
        },
        MODERN_ERA: {
            standalone: ['Motor Inn', 'Highway Lodge', 'Travel Stop', 'Guest House', 'Motel']
        }
    }
};

// ========================================
// WELL NAMING - Water Source Structures
// ========================================

interface WellNameConfig {
    prefixes?: string[];
    suffixes?: string[];
    standalone: string[];
}

const WELL_NAMES: Record<string, Record<string, WellNameConfig>> = {
    EUROPEAN: {
        PREHISTORY: {
            prefixes: ['Sacred', 'Ancient', 'Hidden'],
            standalone: ['Sacred Spring', 'Water Hole', 'Hidden Spring', 'Forest Well', 'Spirit Pool', 'Healing Waters']
        },
        ANTIQUITY: {
            prefixes: ['Public', 'Temple', 'Forum'],
            standalone: ['Nymphaeum', 'Public Fountain', 'Temple Spring', 'Sacred Well', 'Town Fountain', 'Cistern', 'Aqueduct Fountain']
        },
        MEDIEVAL: {
            prefixes: ['Saint', 'Holy', 'Village', 'Town'],
            suffixes: ['Well', 'Spring', 'Fountain'],
            standalone: ['Holy Well', 'Village Well', 'Town Fountain', 'Abbey Well', 'Pilgrims\' Spring', 'Healing Well', 'Market Well']
        },
        RENAISSANCE_EARLY_MODERN: {
            prefixes: ['Town', 'Public', 'Market', 'Grand'],
            suffixes: ['Well', 'Fountain', 'Spring'],
            standalone: ['Public Well', 'Town Fountain', 'Market Well', 'Courtyard Fountain', 'Village Pump']
        },
        INDUSTRIAL_ERA: {
            prefixes: ['Public', 'Town', 'Village'],
            standalone: ['Village Pump', 'Public Well', 'Town Fountain', 'Water Pump', 'Communal Well', 'Water Point']
        },
        MODERN_ERA: {
            standalone: ['Water Well', 'Community Well', 'Artesian Well', 'Water Point', 'Spring', 'Public Water Source']
        }
    },
    MENA: {
        PREHISTORY: {
            standalone: ['Oasis Spring', 'Desert Well', 'Hidden Waters', 'Sacred Pool', 'Life Spring']
        },
        ANTIQUITY: {
            standalone: ['Bir', 'Cistern', 'Oasis Well', 'Temple Fountain', 'Sacred Spring', 'Town Well', 'Qanat']
        },
        MEDIEVAL: {
            prefixes: ['Sabil', 'Bir'],
            standalone: ['Sabil', 'Bir', 'Hammam Spring', 'Mosque Fountain', 'Ablution Pool', 'Desert Well', 'Oasis Spring', 'Qanat']
        },
        RENAISSANCE_EARLY_MODERN: {
            standalone: ['Sabil', 'Bir', 'Sebil', 'Ottoman Fountain', 'Mosque Well', 'Public Cistern', 'Caravan Well']
        },
        INDUSTRIAL_ERA: {
            standalone: ['Public Well', 'Town Fountain', 'Cistern', 'Water Station', 'Oasis Well']
        },
        MODERN_ERA: {
            standalone: ['Water Well', 'Artesian Well', 'Community Well', 'Water Point', 'Desert Well']
        }
    },
    EAST_ASIAN: {
        PREHISTORY: {
            standalone: ['Sacred Spring', 'Village Pool', 'Mountain Spring', 'Hidden Well', 'Spirit Waters']
        },
        ANTIQUITY: {
            standalone: ['Temple Well', 'Village Well', 'Sacred Spring', 'Dragon Well', 'Mountain Spring', 'Pavilion Well']
        },
        MEDIEVAL: {
            prefixes: ['Dragon', 'Temple', 'Village'],
            standalone: ['Dragon Well', 'Temple Spring', 'Village Well', 'Mountain Well', 'Sacred Spring', 'Shrine Well']
        },
        RENAISSANCE_EARLY_MODERN: {
            standalone: ['Dragon Well', 'Village Well', 'Temple Spring', 'Public Well', 'Mountain Spring', 'Tea Well']
        },
        INDUSTRIAL_ERA: {
            standalone: ['Public Well', 'Village Well', 'Community Well', 'Town Spring', 'Water Station']
        },
        MODERN_ERA: {
            standalone: ['Community Well', 'Artesian Well', 'Water Point', 'Public Well', 'Spring Source']
        }
    },
    SOUTH_ASIAN: {
        PREHISTORY: {
            standalone: ['Sacred Pool', 'Village Tank', 'Hidden Spring', 'Spirit Well', 'Jungle Pool']
        },
        ANTIQUITY: {
            standalone: ['Pushkarini', 'Stepwell', 'Temple Tank', 'Sacred Pool', 'Village Well', 'Kalyani']
        },
        MEDIEVAL: {
            prefixes: ['Raja\'s', 'Temple', 'Village'],
            standalone: ['Baoli', 'Vav', 'Stepwell', 'Temple Tank', 'Sacred Pool', 'Village Well', 'Pushkarini', 'Kalyani']
        },
        RENAISSANCE_EARLY_MODERN: {
            standalone: ['Baoli', 'Stepwell', 'Mughal Fountain', 'Temple Tank', 'Village Well', 'Sacred Pool', 'Hauz']
        },
        INDUSTRIAL_ERA: {
            standalone: ['Village Well', 'Public Well', 'Temple Tank', 'Colonial Well', 'Community Well', 'Water Tank']
        },
        MODERN_ERA: {
            standalone: ['Tube Well', 'Community Well', 'Public Well', 'Water Point', 'Artesian Well', 'Hand Pump']
        }
    },
    SUB_SAHARAN_AFRICAN: {
        PREHISTORY: {
            standalone: ['Water Hole', 'Sacred Spring', 'River Pool', 'Hidden Water', 'Spirit Well']
        },
        ANTIQUITY: {
            standalone: ['Village Well', 'Water Hole', 'Sacred Pool', 'Community Spring', 'Hidden Waters']
        },
        MEDIEVAL: {
            standalone: ['Village Well', 'Community Pool', 'Sacred Spring', 'Town Well', 'Trading Well']
        },
        RENAISSANCE_EARLY_MODERN: {
            standalone: ['Village Well', 'Trading Post Well', 'Community Water', 'Market Well', 'Caravan Well']
        },
        INDUSTRIAL_ERA: {
            standalone: ['Village Well', 'Mission Well', 'Colonial Well', 'Community Water', 'Town Well']
        },
        MODERN_ERA: {
            standalone: ['Borehole', 'Community Well', 'Hand Pump Well', 'Water Point', 'Village Well']
        }
    },
    SOUTH_AMERICAN: {
        PREHISTORY: {
            standalone: ['Sacred Spring', 'Mountain Pool', 'Hidden Water', 'Spirit Well', 'Jungle Spring']
        },
        ANTIQUITY: {
            standalone: ['Sacred Pool', 'Temple Spring', 'Mountain Well', 'Community Water', 'Ritual Bath']
        },
        MEDIEVAL: {
            standalone: ['Inca Fountain', 'Sacred Spring', 'Temple Well', 'Mountain Pool', 'Village Water', 'Ritual Pool']
        },
        RENAISSANCE_EARLY_MODERN: {
            standalone: ['Mission Well', 'Town Fountain', 'Colonial Well', 'Plaza Fountain', 'Village Well', 'Hacienda Well']
        },
        INDUSTRIAL_ERA: {
            standalone: ['Village Well', 'Town Fountain', 'Community Well', 'Public Well', 'Hacienda Well']
        },
        MODERN_ERA: {
            standalone: ['Community Well', 'Artesian Well', 'Water Point', 'Village Well', 'Public Fountain']
        }
    },
    NORTH_AMERICAN_PRE_COLUMBIAN: {
        PREHISTORY: {
            standalone: ['Sacred Spring', 'Hidden Pool', 'Spirit Water', 'Healing Waters', 'River Pool']
        },
        ANTIQUITY: {
            standalone: ['Sacred Spring', 'Village Water', 'Ritual Pool', 'Community Spring', 'Hidden Waters']
        },
        MEDIEVAL: {
            standalone: ['Sacred Spring', 'Village Well', 'Community Water', 'Ritual Pool', 'Clan Well']
        },
        RENAISSANCE_EARLY_MODERN: {
            standalone: ['Village Spring', 'Community Water', 'Sacred Pool', 'Tribal Well']
        }
    },
    NORTH_AMERICAN_COLONIAL: {
        RENAISSANCE_EARLY_MODERN: {
            prefixes: ['Town', 'Village', 'Common'],
            standalone: ['Town Well', 'Common Well', 'Village Pump', 'Mission Well', 'Colonial Well', 'Fort Well']
        },
        INDUSTRIAL_ERA: {
            standalone: ['Town Pump', 'Public Well', 'Village Well', 'Community Well', 'Water Tower']
        },
        MODERN_ERA: {
            standalone: ['Water Well', 'Artesian Well', 'Community Well', 'Public Water', 'Water Tower']
        }
    },
    OCEANIA: {
        PREHISTORY: {
            standalone: ['Sacred Pool', 'Fresh Spring', 'Island Well', 'Hidden Water', 'Spirit Pool']
        },
        ANTIQUITY: {
            standalone: ['Village Pool', 'Fresh Spring', 'Coastal Well', 'Sacred Water', 'Community Pool']
        },
        MEDIEVAL: {
            standalone: ['Village Well', 'Spring Pool', 'Sacred Water', 'Community Well', 'Island Spring']
        },
        RENAISSANCE_EARLY_MODERN: {
            standalone: ['Mission Well', 'Trading Post Well', 'Village Well', 'Colonial Well', 'Community Water']
        },
        INDUSTRIAL_ERA: {
            standalone: ['Village Well', 'Community Well', 'Station Well', 'Colonial Well', 'Water Tank']
        },
        MODERN_ERA: {
            standalone: ['Water Well', 'Artesian Well', 'Community Well', 'Rainwater Tank', 'Bore Well']
        }
    }
};

/**
 * Generates a historically appropriate waystation name based on culture, era, and year.
 */
export function generateWaystationName(
    culturalZone: CulturalZone | string,
    era: HistoricalEra | string,
    year: number,
    noise: ValueNoise
): string {
    const zoneConfig = WAYSTATION_NAMES[culturalZone] || WAYSTATION_NAMES.EUROPEAN;
    const eraConfig = zoneConfig[era] || zoneConfig.MEDIEVAL || { standalone: ['Way Station', 'Rest Stop', 'Travelers\' Lodge'] };

    // 70% chance to use standalone name, 30% chance to construct with prefix/suffix
    if (noise.random() < 0.7 || !eraConfig.prefixes) {
        return eraConfig.standalone[Math.floor(noise.random() * eraConfig.standalone.length)];
    }

    const prefix = eraConfig.prefixes[Math.floor(noise.random() * eraConfig.prefixes.length)];

    if (eraConfig.suffixes && noise.random() < 0.5) {
        const suffix = eraConfig.suffixes[Math.floor(noise.random() * eraConfig.suffixes.length)];
        // Generate a random proper noun based on culture
        const properNouns = getProperNounsByEra(culturalZone, era, noise);
        return `${prefix} ${properNouns} ${suffix}`;
    }

    return eraConfig.standalone[Math.floor(noise.random() * eraConfig.standalone.length)];
}

/**
 * Generates a historically appropriate well name based on culture, era, and year.
 */
export function generateWellName(
    culturalZone: CulturalZone | string,
    era: HistoricalEra | string,
    year: number,
    noise: ValueNoise
): string {
    const zoneConfig = WELL_NAMES[culturalZone] || WELL_NAMES.EUROPEAN;
    const eraConfig = zoneConfig[era] || zoneConfig.MEDIEVAL || { standalone: ['Village Well', 'Water Source', 'Spring'] };

    // 70% chance to use standalone name, 30% chance to construct with prefix/suffix
    if (noise.random() < 0.7 || !eraConfig.prefixes) {
        return eraConfig.standalone[Math.floor(noise.random() * eraConfig.standalone.length)];
    }

    const prefix = eraConfig.prefixes[Math.floor(noise.random() * eraConfig.prefixes.length)];

    if (eraConfig.suffixes && noise.random() < 0.5) {
        const suffix = eraConfig.suffixes[Math.floor(noise.random() * eraConfig.suffixes.length)];
        return `${prefix} ${suffix}`;
    }

    // Just use a standalone name when no suffix pattern works
    return eraConfig.standalone[Math.floor(noise.random() * eraConfig.standalone.length)];
}

/**
 * Helper function to generate culturally appropriate proper nouns for naming
 */
function getProperNounsByEra(culturalZone: string, era: string, noise: ValueNoise): string {
    const europeanNouns = {
        PREHISTORY: ['Stone', 'Oak', 'River', 'Hill', 'Valley'],
        ANTIQUITY: ['Aquila', 'Leo', 'Augusta', 'Via', 'Forum'],
        MEDIEVAL: ['Dragon', 'Lion', 'Crown', 'Rose', 'Sword', 'Shield', 'Bear', 'Stag', 'Eagle'],
        RENAISSANCE_EARLY_MODERN: ['King\'s', 'Queen\'s', 'Royal', 'Golden', 'Silver', 'Cross'],
        INDUSTRIAL_ERA: ['Victoria', 'Grand', 'Commercial', 'Railway', 'Central'],
        MODERN_ERA: ['Highway', 'Interstate', 'Express', 'Travel']
    };

    const menaNouns = {
        ANTIQUITY: ['Oasis', 'Desert', 'Palm', 'Star', 'Moon'],
        MEDIEVAL: ['Sultan\'s', 'Crescent', 'Palm', 'Oasis', 'Desert', 'Caravan'],
        RENAISSANCE_EARLY_MODERN: ['Pasha\'s', 'Grand', 'Imperial', 'Desert', 'Oasis']
    };

    const eastAsianNouns = {
        ANTIQUITY: ['Dragon', 'Phoenix', 'Jade', 'Golden', 'Mountain'],
        MEDIEVAL: ['Pine', 'Crane', 'Bamboo', 'Cherry', 'Maple', 'Mountain'],
        RENAISSANCE_EARLY_MODERN: ['Plum', 'Willow', 'Moon', 'Cloud', 'Lotus']
    };

    let nouns: string[];
    switch (culturalZone) {
        case 'MENA':
            nouns = menaNouns[era as keyof typeof menaNouns] || ['Desert', 'Oasis', 'Star'];
            break;
        case 'EAST_ASIAN':
            nouns = eastAsianNouns[era as keyof typeof eastAsianNouns] || ['Dragon', 'Mountain', 'Pine'];
            break;
        default:
            nouns = europeanNouns[era as keyof typeof europeanNouns] || ['Travelers\'', 'Road', 'Way'];
    }

    return nouns[Math.floor(noise.random() * nouns.length)];
}
