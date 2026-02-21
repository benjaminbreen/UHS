/**
 * services/marketplaceNameGenerator.ts - Generates historically authentic, procedural names for marketplaces.
 * Uses culture-zone/era lookup tables (same pattern as structureNamingService.ts).
 */
import { MapData, BiomeType, MarketplaceInfo } from '../types';
import { parseDateString } from '../utils/dateUtils';

// ========================================
// MARKETPLACE NAMING - Culture/Era Tables
// ========================================

interface MarketplaceNameConfig {
    prefixes?: string[];
    standalone: string[];
    waterfront?: string[];  // Used when near rivers/coast
}

const MARKETPLACE_NAMES: Record<string, Record<string, MarketplaceNameConfig>> = {
    EUROPEAN: {
        PREHISTORY: {
            standalone: ['Gathering Ground', 'Barter Place', 'Trading Stones', 'Exchange Ground', 'Seasonal Market'],
            waterfront: ['River Trading Ground', 'Shore Market', 'Fishing Exchange']
        },
        ANTIQUITY: {
            prefixes: ['Upper', 'Lower', 'Old'],
            standalone: ['Agora', 'Forum', 'Emporium', 'Macellum', 'Nundinae', 'Public Market', 'Trade Forum', 'Grain Market'],
            waterfront: ['Harbor Market', 'Portside Emporium', 'Wharf Market', 'River Forum']
        },
        MEDIEVAL: {
            prefixes: ['Old', 'Great', 'Upper', 'Lower', 'East', 'West'],
            standalone: ['Market Square', 'Wool Market', 'Grain Market', 'Fish Market', 'Cloth Hall', 'Butter Market',
                'Corn Exchange', 'Market Cross', 'Shambles', 'Cattle Market', 'Salt Market', 'Cheese Market',
                'Hay Market', 'Horse Fair', 'Merchant Row'],
            waterfront: ['Watergate Market', 'Quayside Market', 'Fish Wharf', 'River Market', 'Bridge Market']
        },
        RENAISSANCE_EARLY_MODERN: {
            prefixes: ['Grand', 'Royal', 'Old', 'New', 'Great'],
            standalone: ['Bourse', 'Exchange', 'Market Hall', 'Cloth Market', 'Spice Market', 'Wine Market',
                'Mercato', 'Silk Exchange', 'Corn Market', 'Coal Market', 'Flower Market',
                'Merchant Exchange', 'Trade Hall', 'Produce Market'],
            waterfront: ['Harbor Exchange', 'Quayside Market', 'Dockside Market', 'Waterfront Bourse', 'Fish Market']
        },
        INDUSTRIAL_ERA: {
            prefixes: ['Central', 'Grand', 'Old', 'New', 'Municipal'],
            standalone: ['Market Hall', 'Covered Market', 'Corn Exchange', 'Produce Market', 'Coal Exchange',
                'Cattle Market', 'Borough Market', 'Iron Market', 'Cotton Exchange', 'Flower Market',
                'Smithfield Market', 'General Market', 'Public Market', 'Wholesale Market'],
            waterfront: ['Dockside Market', 'Wharf Market', 'Fish Market', 'Harbor Exchange', 'Riverside Market']
        },
        MODERN_ERA: {
            prefixes: ['Central', 'Municipal', 'Old', 'City'],
            standalone: ['Central Market', 'Covered Market', 'Public Market', 'Farmers Market', 'Flea Market',
                'Market Hall', 'Wholesale Market', 'Night Market'],
            waterfront: ['Waterfront Market', 'Harbor Market', 'Fish Market', 'Riverside Market']
        }
    },
    MENA: {
        PREHISTORY: {
            standalone: ['Oasis Trading Ground', 'Desert Exchange', 'Gathering Place', 'Barter Ground'],
            waterfront: ['Oasis Market', 'Watering Hole Exchange']
        },
        ANTIQUITY: {
            prefixes: ['Great', 'Old', 'Upper'],
            standalone: ['Suq', 'Market Square', 'Grain Market', 'Incense Market', 'Caravan Market',
                'Spice Market', 'Copper Market', 'Trade Square', 'Pottery Market'],
            waterfront: ['Harbor Market', 'Portside Suq', 'River Market']
        },
        MEDIEVAL: {
            prefixes: ['Grand', 'Old', 'Great'],
            standalone: ['Souq', 'Bazaar', 'Khan', 'Qaysariyya', 'Spice Bazaar', 'Cloth Souq',
                'Perfume Market', 'Gold Souq', 'Silk Bazaar', 'Carpet Market', 'Coppersmith Bazaar',
                'Leather Market', 'Date Market', 'Incense Souq', 'Slave Market'],
            waterfront: ['Waterfront Souq', 'Harbor Bazaar', 'Fish Souq', 'Port Market']
        },
        RENAISSANCE_EARLY_MODERN: {
            prefixes: ['Grand', 'Imperial', 'Old', 'Great'],
            standalone: ['Bazaar', 'Covered Bazaar', 'Grand Souq', 'Spice Market', 'Silk Bazaar',
                'Bedestan', 'Arasta', 'Carpet Market', 'Gold Bazaar', 'Perfumers\' Souq',
                'Cloth Market', 'Herbalists\' Bazaar'],
            waterfront: ['Harbor Bazaar', 'Waterfront Souq', 'Fish Market', 'Port Bazaar']
        },
        INDUSTRIAL_ERA: {
            prefixes: ['Central', 'Grand', 'Old', 'New'],
            standalone: ['Bazaar', 'Souq', 'Covered Market', 'Spice Market', 'Cloth Market',
                'Gold Souq', 'Produce Market', 'General Market', 'Merchant Quarter'],
            waterfront: ['Harbor Market', 'Fish Souq', 'Waterfront Market', 'Port Market']
        },
        MODERN_ERA: {
            standalone: ['Bazaar', 'Souq', 'Central Market', 'Covered Market', 'Spice Market',
                'Night Market', 'Open Market', 'Wholesale Market'],
            waterfront: ['Fish Market', 'Harbor Market', 'Waterfront Souq']
        }
    },
    EAST_ASIAN: {
        PREHISTORY: {
            standalone: ['Trading Ground', 'Barter Place', 'Gathering Market', 'Exchange Ground'],
            waterfront: ['River Trading Post', 'Shore Market']
        },
        ANTIQUITY: {
            prefixes: ['East', 'West', 'North', 'South'],
            standalone: ['Shi', 'Market Square', 'Grain Market', 'Silk Market', 'Jade Market',
                'Trade Square', 'Bronze Market', 'Salt Market'],
            waterfront: ['River Market', 'Watergate Market', 'Harbor Shi']
        },
        MEDIEVAL: {
            prefixes: ['East', 'West', 'Morning', 'Night', 'Great'],
            standalone: ['Shichang', 'Ichiba', 'Night Market', 'Silk Market', 'Tea Market',
                'Porcelain Market', 'Rice Market', 'Medicine Market', 'Fabric Market',
                'Flower Market', 'Antique Market', 'Jang', 'Sijang'],
            waterfront: ['Riverside Market', 'Waterfront Market', 'Fish Market', 'Harbor Market']
        },
        RENAISSANCE_EARLY_MODERN: {
            prefixes: ['Grand', 'East', 'West', 'Old', 'Morning'],
            standalone: ['Shichang', 'Ichiba', 'Night Market', 'Tea Market', 'Silk Exchange',
                'Porcelain Market', 'Lacquerware Market', 'Medicine Market', 'Rice Market',
                'Book Market', 'Fabric Market', 'Sijang'],
            waterfront: ['Waterfront Market', 'Fish Market', 'Harbor Market', 'Riverside Shichang']
        },
        INDUSTRIAL_ERA: {
            prefixes: ['Central', 'East', 'West', 'New', 'Old'],
            standalone: ['Public Market', 'General Market', 'Covered Market', 'Night Market',
                'Produce Market', 'Textile Market', 'Wholesale Market', 'Fish Market',
                'Rice Exchange', 'Tea Market', 'Morning Market'],
            waterfront: ['Harbor Market', 'Dockside Market', 'Fish Market', 'Riverside Market']
        },
        MODERN_ERA: {
            standalone: ['Central Market', 'Night Market', 'Morning Market', 'Wholesale Market',
                'Public Market', 'Covered Market', 'Street Market'],
            waterfront: ['Fish Market', 'Waterfront Market', 'Harbor Market']
        }
    },
    SOUTH_ASIAN: {
        PREHISTORY: {
            standalone: ['Trading Ground', 'Barter Place', 'Gathering Site', 'Exchange Ground'],
            waterfront: ['Riverside Exchange', 'Ghat Market']
        },
        ANTIQUITY: {
            prefixes: ['Great', 'Royal', 'Old'],
            standalone: ['Haat', 'Market Square', 'Grain Market', 'Spice Market', 'Cloth Market',
                'Bead Market', 'Salt Exchange', 'Pottery Market'],
            waterfront: ['Ghat Market', 'River Market', 'Harbor Exchange']
        },
        MEDIEVAL: {
            prefixes: ['Grand', 'Royal', 'Old', 'Great'],
            standalone: ['Bazaar', 'Haat', 'Chowk', 'Mandi', 'Spice Bazaar', 'Cloth Market',
                'Grain Mandi', 'Jewelers\' Bazaar', 'Perfume Market', 'Flower Market',
                'Ivory Market', 'Silk Bazaar', 'Copper Market'],
            waterfront: ['Ghat Market', 'Riverside Bazaar', 'Fish Market', 'Boat Market']
        },
        RENAISSANCE_EARLY_MODERN: {
            prefixes: ['Grand', 'Imperial', 'Old', 'Royal'],
            standalone: ['Bazaar', 'Chowk', 'Mandi', 'Sadar Bazaar', 'Spice Market',
                'Cloth Bazaar', 'Jewelers\' Market', 'Meena Bazaar', 'Flower Market',
                'Grain Mandi', 'Perfumers\' Lane'],
            waterfront: ['Ghat Bazaar', 'Riverside Market', 'Fish Market', 'Harbor Bazaar']
        },
        INDUSTRIAL_ERA: {
            prefixes: ['Central', 'Old', 'New', 'Municipal'],
            standalone: ['Bazaar', 'Mandi', 'Chowk', 'Public Market', 'Cloth Market',
                'Spice Market', 'Grain Market', 'Produce Mandi', 'General Bazaar',
                'Cotton Market', 'Wholesale Market'],
            waterfront: ['Ghat Market', 'Fish Market', 'Harbor Market', 'Riverside Bazaar']
        },
        MODERN_ERA: {
            standalone: ['Bazaar', 'Mandi', 'Central Market', 'Wholesale Market', 'Haat',
                'Public Market', 'Sabzi Mandi', 'Night Market'],
            waterfront: ['Fish Market', 'Harbor Market', 'Ghat Market']
        }
    },
    SUB_SAHARAN_AFRICAN: {
        PREHISTORY: {
            standalone: ['Trading Ground', 'Barter Place', 'Gathering Market', 'Exchange Ground'],
            waterfront: ['Riverside Exchange', 'Shore Market']
        },
        ANTIQUITY: {
            standalone: ['Trading Ground', 'Market Circle', 'Exchange Place', 'Grain Market',
                'Salt Exchange', 'Cattle Market', 'Bead Market'],
            waterfront: ['River Market', 'Shore Trading Ground']
        },
        MEDIEVAL: {
            prefixes: ['Great', 'Old', 'Royal'],
            standalone: ['Market Circle', 'Trading Ground', 'Salt Market', 'Gold Market',
                'Cloth Market', 'Cattle Market', 'Grain Market', 'Ivory Market',
                'Kola Market', 'Slave Market', 'Iron Market'],
            waterfront: ['River Market', 'Waterfront Market', 'Fish Market', 'Landing Market']
        },
        RENAISSANCE_EARLY_MODERN: {
            prefixes: ['Great', 'Old', 'Royal', 'Grand'],
            standalone: ['Market Square', 'Trading Ground', 'Cloth Market', 'Salt Market',
                'Gold Market', 'Cattle Market', 'Produce Market', 'Bead Market',
                'Iron Market', 'Grain Market'],
            waterfront: ['Waterfront Market', 'Fish Market', 'Landing Market', 'River Market']
        },
        INDUSTRIAL_ERA: {
            prefixes: ['Central', 'Old', 'New', 'Grand'],
            standalone: ['Market Square', 'Public Market', 'General Market', 'Produce Market',
                'Cattle Market', 'Grain Market', 'Cloth Market', 'Open Market',
                'Trading Post Market'],
            waterfront: ['Harbor Market', 'Fish Market', 'Waterfront Market', 'Dockside Market']
        },
        MODERN_ERA: {
            standalone: ['Central Market', 'Public Market', 'Open Market', 'Night Market',
                'Wholesale Market', 'General Market'],
            waterfront: ['Fish Market', 'Harbor Market', 'Waterfront Market']
        }
    },
    SOUTH_AMERICAN: {
        PREHISTORY: {
            standalone: ['Trading Ground', 'Barter Place', 'Gathering Market', 'Exchange Ground'],
            waterfront: ['River Exchange', 'Shore Market']
        },
        ANTIQUITY: {
            standalone: ['Tianguis', 'Market Square', 'Exchange Ground', 'Trading Place',
                'Barter Circle', 'Salt Market'],
            waterfront: ['Lake Market', 'Riverside Exchange', 'Shore Market']
        },
        MEDIEVAL: {
            prefixes: ['Great', 'Royal', 'Sacred'],
            standalone: ['Tianguis', 'Qhatu', 'Market Square', 'Llama Market', 'Textile Market',
                'Pottery Market', 'Gold Market', 'Feather Market', 'Cacao Market',
                'Obsidian Market', 'Maize Market'],
            waterfront: ['Lake Market', 'Riverside Tianguis', 'Canal Market', 'Fish Market']
        },
        RENAISSANCE_EARLY_MODERN: {
            prefixes: ['Grand', 'Old', 'Royal', 'Plaza'],
            standalone: ['Mercado', 'Plaza Market', 'Tianguis', 'Produce Market', 'Silver Market',
                'Cloth Market', 'Spice Market', 'Livestock Market', 'Mission Market',
                'Cacao Exchange'],
            waterfront: ['Waterfront Mercado', 'Fish Market', 'Port Market', 'River Market']
        },
        INDUSTRIAL_ERA: {
            prefixes: ['Central', 'Municipal', 'Old', 'Grand'],
            standalone: ['Mercado', 'Public Market', 'Produce Market', 'Covered Market',
                'General Market', 'Cattle Market', 'Wholesale Market', 'Plaza Market'],
            waterfront: ['Harbor Market', 'Fish Market', 'Waterfront Mercado', 'Port Market']
        },
        MODERN_ERA: {
            standalone: ['Mercado', 'Central Market', 'Public Market', 'Feria', 'Night Market',
                'Wholesale Market', 'Farmers Market'],
            waterfront: ['Fish Market', 'Harbor Market', 'Waterfront Market']
        }
    },
    NORTH_AMERICAN_PRE_COLUMBIAN: {
        PREHISTORY: {
            standalone: ['Trading Ground', 'Gathering Place', 'Barter Site', 'Exchange Circle'],
            waterfront: ['River Exchange', 'Shore Trading Ground']
        },
        ANTIQUITY: {
            standalone: ['Trading Ground', 'Exchange Circle', 'Market Mound', 'Barter Place',
                'Obsidian Market', 'Shell Exchange', 'Flint Market'],
            waterfront: ['River Market', 'Landing Exchange', 'Shore Market']
        },
        MEDIEVAL: {
            prefixes: ['Great', 'Sacred'],
            standalone: ['Trading Ground', 'Market Mound', 'Exchange Circle', 'Corn Market',
                'Flint Market', 'Shell Exchange', 'Pottery Market', 'Hide Market',
                'Copper Exchange'],
            waterfront: ['River Market', 'Canoe Landing Market', 'Fish Market', 'Shore Exchange']
        },
        RENAISSANCE_EARLY_MODERN: {
            standalone: ['Trading Ground', 'Market Circle', 'Exchange Place', 'Fur Market',
                'Corn Market', 'Hide Market', 'Trade Fair'],
            waterfront: ['River Market', 'Landing Exchange', 'Fish Market']
        }
    },
    NORTH_AMERICAN_COLONIAL: {
        RENAISSANCE_EARLY_MODERN: {
            prefixes: ['Old', 'Colonial', 'New'],
            standalone: ['Public Market', 'Market Square', 'Trading Post', 'General Store',
                'Tobacco Market', 'Fur Exchange', 'Provision Market', 'Town Market',
                'Merchant Row', 'Dry Goods Market'],
            waterfront: ['Wharf Market', 'Landing Market', 'Fish Market', 'Harbor Market', 'Dock Market']
        },
        INDUSTRIAL_ERA: {
            prefixes: ['Central', 'Old', 'New', 'Grand', 'Municipal'],
            standalone: ['Public Market', 'Produce Market', 'Covered Market', 'Meat Market',
                'Dry Goods Market', 'General Market', 'Farmers Market', 'Cotton Exchange',
                'Grain Exchange', 'Iron Market', 'Wholesale Market', 'Merchant Row',
                'Cattle Market', 'Coal Market', 'Lumber Market'],
            waterfront: ['Wharf Market', 'Fish Market', 'Dockside Market', 'Harbor Exchange',
                'Fulton Market', 'Waterfront Market']
        },
        MODERN_ERA: {
            prefixes: ['Central', 'Municipal', 'Old', 'City'],
            standalone: ['Central Market', 'Public Market', 'Farmers Market', 'Flea Market',
                'Wholesale Market', 'Covered Market', 'Night Market'],
            waterfront: ['Fish Market', 'Waterfront Market', 'Harbor Market', 'Pier Market']
        }
    },
    OCEANIA: {
        PREHISTORY: {
            standalone: ['Trading Beach', 'Exchange Ground', 'Gathering Place', 'Barter Site'],
            waterfront: ['Shore Exchange', 'Beach Market', 'Lagoon Trading Ground']
        },
        ANTIQUITY: {
            standalone: ['Trading Ground', 'Exchange Beach', 'Market Place', 'Barter Circle'],
            waterfront: ['Shore Market', 'Lagoon Exchange', 'Beach Trading Ground']
        },
        MEDIEVAL: {
            standalone: ['Trading Ground', 'Market Place', 'Exchange Beach', 'Gift Exchange',
                'Barter Ground', 'Shell Market'],
            waterfront: ['Shore Market', 'Lagoon Market', 'Beach Exchange', 'Canoe Market']
        },
        RENAISSANCE_EARLY_MODERN: {
            prefixes: ['Colonial', 'Old'],
            standalone: ['Trading Post', 'Market Place', 'Provision Market', 'General Market',
                'Mission Market', 'Barter Ground'],
            waterfront: ['Wharf Market', 'Beach Market', 'Landing Market', 'Harbor Market']
        },
        INDUSTRIAL_ERA: {
            prefixes: ['Central', 'Old', 'New'],
            standalone: ['Public Market', 'General Market', 'Produce Market', 'Covered Market',
                'Town Market', 'Trading Post Market'],
            waterfront: ['Wharf Market', 'Fish Market', 'Harbor Market', 'Dockside Market']
        },
        MODERN_ERA: {
            standalone: ['Central Market', 'Public Market', 'Farmers Market', 'Town Market',
                'Open Market'],
            waterfront: ['Fish Market', 'Harbor Market', 'Waterfront Market']
        }
    }
};

// ========================================
// Helper Functions
// ========================================

function isNearWater(tileX: number, tileY: number, mapData: MapData): boolean {
    for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
            const checkX = tileX + dx;
            const checkY = tileY + dy;
            if (checkX >= 0 && checkX < mapData.width && checkY >= 0 && checkY < mapData.height) {
                const biome = mapData.tiles[checkY][checkX].biome;
                if (biome === BiomeType.RIVER || biome === BiomeType.MAJOR_RIVER ||
                    biome === BiomeType.OCEAN || biome === BiomeType.COASTAL) {
                    return true;
                }
            }
        }
    }
    return false;
}

/**
 * Extract a short, usable place prefix from localArea.
 * e.g. "New York Harbor" -> "New York", "Rio de Janeiro Bay" -> "Rio de Janeiro"
 */
function getLocalPrefix(localArea: string | undefined): string | null {
    if (!localArea) return null;
    // Strip common geographic suffixes to get the settlement name
    const stripped = localArea
        .replace(/\s+(Harbor|Bay|Port|Coast|River|Delta|Island|Peninsula|Strait|Straits|Lake|Lagoon|Shoals|Swamp|Atoll|Valley|Mountains?)$/i, '')
        .trim();
    return stripped.length > 0 ? stripped : null;
}

// ========================================
// Main Generator
// ========================================

export function generateMarketplaceNames(mapData: MapData): MarketplaceInfo[] {
    const marketplaces: MarketplaceInfo[] = [];
    const dateInfo = parseDateString(mapData.timeSlice || '1650');
    const culturalZone = (mapData.continent || 'EUROPEAN') as string;
    const era = dateInfo.era as string;

    // Look up the name config for this culture/era
    const zoneConfig = MARKETPLACE_NAMES[culturalZone] || MARKETPLACE_NAMES.EUROPEAN;
    const eraConfig = zoneConfig[era] || zoneConfig.MEDIEVAL || {
        standalone: ['Market Square', 'Public Market', 'General Market']
    };

    const localPrefix = getLocalPrefix(mapData.localArea);
    const usedNames = new Set<string>();
    let marketIndex = 0;

    mapData.tiles.flat().forEach(tile => {
        if (tile.biome === BiomeType.MARKETPLACE) {
            const nearWater = isNearWater(tile.x, tile.y, mapData);
            let name = pickMarketName(eraConfig, nearWater, localPrefix, marketIndex, usedNames);
            usedNames.add(name);
            marketIndex++;

            marketplaces.push({
                name,
                x: tile.x,
                y: tile.y,
            });
        }
    });

    return marketplaces;
}

/**
 * Pick a unique marketplace name, preferring waterfront names when near water,
 * and occasionally prefixing with the local area name for flavor.
 */
function pickMarketName(
    config: MarketplaceNameConfig,
    nearWater: boolean,
    localPrefix: string | null,
    index: number,
    usedNames: Set<string>
): string {
    const random = Math.random;

    // 40% chance to use waterfront names when near water and they exist
    if (nearWater && config.waterfront && config.waterfront.length > 0 && random() < 0.4) {
        const name = pickUnused(config.waterfront, usedNames);
        if (name) return maybeAddLocalPrefix(name, localPrefix, 0.15);
    }

    // 25% chance to use prefix + standalone (if prefixes exist)
    if (config.prefixes && config.prefixes.length > 0 && random() < 0.25) {
        const prefix = config.prefixes[Math.floor(random() * config.prefixes.length)];
        const base = pickUnused(config.standalone, usedNames);
        if (base) {
            const prefixed = `${prefix} ${base}`;
            if (!usedNames.has(prefixed)) return prefixed;
        }
    }

    // 20% chance to prefix with localArea name (e.g. "New York Produce Market")
    if (localPrefix && random() < 0.2) {
        const base = pickUnused(config.standalone, usedNames);
        if (base) {
            const localName = `${localPrefix} ${base}`;
            if (!usedNames.has(localName)) return localName;
        }
    }

    // Default: pick a standalone name
    const name = pickUnused(config.standalone, usedNames);
    if (name) return name;

    // Fallback: if somehow all names are used, add index suffix
    return `${config.standalone[index % config.standalone.length]} #${index + 1}`;
}

/**
 * Optionally prepend the local area name with the given probability.
 */
function maybeAddLocalPrefix(name: string, localPrefix: string | null, probability: number): string {
    if (localPrefix && Math.random() < probability) {
        return `${localPrefix} ${name}`;
    }
    return name;
}

/**
 * Pick a random unused name from a list. Returns null if all are used.
 */
function pickUnused(names: string[], usedNames: Set<string>): string | null {
    // Try random picks first (fast path)
    for (let i = 0; i < 5; i++) {
        const name = names[Math.floor(Math.random() * names.length)];
        if (!usedNames.has(name)) return name;
    }
    // Fallback: linear scan for any unused name
    const shuffled = [...names].sort(() => Math.random() - 0.5);
    for (const name of shuffled) {
        if (!usedNames.has(name)) return name;
    }
    // All names used — return a random one (will be deduplicated by caller)
    return names[Math.floor(Math.random() * names.length)];
}
