/**
 * components/CityModal.tsx - Interactive modal for urban tile exploration
 * Allows entering workspaces (businesses), visiting NPCs, and urban activities
 */

import React, { useMemo, useEffect, useState, useRef, useCallback } from 'react';
import { Tile, PlayerCharacter, MapData, Season, TimeOfDay, HistoricalEra, CulturalZone, NpcEntity } from '../types';
import CityBanner, { Condition, CitySize } from './CityBanner';
import { parseDateString } from '../utils/dateUtils';
import { mapLocationToCulture } from '../utils/mapUtils';
import { urbanTileRegistry } from '../services/urbanTileRegistryService';
import { generateCityDescription } from '../services/cityModalService';
import { BiomeType } from '../types';
import TimeAwareBackground from './TimeAwareBackground';
import { weatherService } from '../services/weatherService';
import { cityDescriptionCacheService } from '../services/cityDescriptionCacheService';
import { gameSounds } from '../services/gameSoundsService';
import { isSafari } from '../utils/safariUtils';
import {
    FaTimes,
    FaDoorOpen,
    FaStore,
    FaUsers,
    FaHome,
    FaCity,
    FaMapMarkedAlt,
    FaClock,
    FaLeaf,
    FaBuilding,
} from 'react-icons/fa';
import {
    GiShop,
    GiVillage,
    GiModernCity,
} from 'react-icons/gi';

interface CityModalProps {
    tile: Tile;
    playerCharacter: PlayerCharacter;
    mapData: MapData;
    gameTimeHours: number;
    season: Season;
    onClose: () => void;
    onEnterSpecialMap?: (config: any) => void;
}

/**
 * Advanced workspace router that considers culture, era, population, and business type
 */
const determineWorkspaceArchetypeAdvanced = (
    businessType: string,
    culturalZone: CulturalZone,
    era: HistoricalEra,
    population: number,
    wealthLevel: 'poor' | 'modest' | 'comfortable' | 'wealthy' = 'modest'
): string => {
    const type = businessType.toLowerCase();

    // RESTAURANTS, INNS, TAVERNS
    if (type.includes('tavern') || type.includes('inn') || type.includes('restaurant')) {
        // Era-specific routing for dining establishments
        if (era === 'PREHISTORY' || culturalZone === 'NORTH_AMERICAN_PRE_COLUMBIAN') {
            return 'CAMPGROUND'; // Tribal gathering spaces
        }
        return 'RESTAURANT_INN';
    }

    // MARKETS, SHOPS, STORES
    if (type.includes('market') || type.includes('shop') || type.includes('store') || type.includes('merchant')) {
        // Population-based scaling for commercial establishments
        if (population < 200) {
            return 'WORKSHOP'; // Small village shops are basically workshops
        } else if (culturalZone === 'MENA' || culturalZone === 'SOUTH_ASIAN') {
            return 'MARKET_BAZAAR'; // Traditional bazaar cultures
        } else if (era === 'MODERN_ERA' || era === 'FUTURE_ERA') {
            return 'MARKET_BAZAAR'; // Modern department stores/malls
        } else if (population > 1000) {
            return 'MARKET_BAZAAR'; // Large urban markets
        }
        return 'WORKSHOP'; // Default small shops
    }

    // RELIGIOUS/SPIRITUAL
    if (type.includes('temple') || type.includes('church') || type.includes('shrine') ||
        type.includes('priest') || type.includes('monk') || type.includes('shaman')) {
        // Small sacred spaces vs large complexes
        if (population < 500 || culturalZone === 'NORTH_AMERICAN_PRE_COLUMBIAN') {
            return 'WORKSHOP'; // Small shrines/sacred huts
        }
        return 'SACRED_COMPLEX';
    }

    // SCHOLARLY/EDUCATIONAL
    if (type.includes('scholar') || type.includes('scribe') || type.includes('library') ||
        type.includes('teacher') || type.includes('academy')) {
        // Era and population considerations for education
        if (era === 'PREHISTORY' || population < 300) {
            return 'WORKSHOP'; // Simple teaching huts
        } else if (culturalZone === 'MENA' && era === 'MEDIEVAL') {
            return 'UNIVERSITY'; // House of Wisdom tradition
        } else if (era === 'RENAISSANCE_EARLY_MODERN' || era === 'MODERN_ERA') {
            return 'UNIVERSITY'; // Formal educational institutions
        }
        return 'WORKSHOP'; // Private tutoring/small schools
    }

    // CRAFTING PROFESSIONS - Most go to WORKSHOP but with cultural considerations
    if (type.includes('smith') || type.includes('forge')) {
        // Smithies across all cultures tend to be workshops
        return 'WORKSHOP';
    }

    if (type.includes('potter') || type.includes('ceramic')) {
        // Chinese/East Asian pottery can be larger operations
        if (culturalZone === 'EAST_ASIAN' && population > 800) {
            return 'MARKET_BAZAAR'; // Ceramic factories/large workshops
        }
        return 'WORKSHOP';
    }

    if (type.includes('weav') || type.includes('textile') || type.includes('cloth')) {
        // Industrial era textile production
        if (era === 'INDUSTRIAL_ERA' && population > 1000) {
            return 'MARKET_BAZAAR'; // Textile mills/factories
        } else if (culturalZone === 'SOUTH_ASIAN' && wealthLevel === 'wealthy') {
            return 'MARKET_BAZAAR'; // Large silk operations
        }
        return 'WORKSHOP';
    }

    if (type.includes('baker') || type.includes('mill')) {
        // Larger operations in populous areas
        if (population > 1500) {
            return 'MARKET_BAZAAR'; // Large bakeries/mills
        }
        return 'WORKSHOP';
    }

    if (type.includes('carpenter') || type.includes('wood')) {
        // Shipbuilding and large construction
        if (type.includes('ship') || population > 2000) {
            return 'MARKET_BAZAAR'; // Shipyards/large construction
        }
        return 'WORKSHOP';
    }

    // MEDICAL/HEALING
    if (type.includes('healer') || type.includes('physician') || type.includes('doctor') ||
        type.includes('medicine') || type.includes('herb')) {
        // Traditional vs modern medicine
        if (era === 'MODERN_ERA' || era === 'FUTURE_ERA') {
            return 'UNIVERSITY'; // Modern medical facilities
        } else if (culturalZone === 'SOUTH_ASIAN' || culturalZone === 'EAST_ASIAN') {
            return 'SACRED_COMPLEX'; // Traditional medicine often tied to temples
        }
        return 'WORKSHOP'; // Traditional healing huts
    }

    // LUXURY/ARTISAN GOODS
    if (type.includes('jewel') || type.includes('gold') || type.includes('silver') ||
        type.includes('luxury') || type.includes('art')) {
        // Wealthy areas have larger luxury operations
        if (wealthLevel === 'wealthy' && population > 800) {
            return 'MARKET_BAZAAR'; // Luxury markets
        }
        return 'WORKSHOP';
    }

    // ENTERTAINMENT
    if (type.includes('music') || type.includes('dance') || type.includes('perform') ||
        type.includes('actor') || type.includes('bard')) {
        // Performance venues scale with population
        if (population > 1000) {
            return 'THEATER'; // Formal theaters
        }
        return 'WORKSHOP'; // Small performance spaces
    }

    // DEFAULT: Generic workshop for unrecognized types
    return 'WORKSHOP';
};

/**
 * Get map size based on archetype, era, and population
 */
const getWorkspaceMapSize = (
    archetype: string,
    era: HistoricalEra,
    population: number,
    culturalZone: CulturalZone
): 'xs' | 'small' | 'medium' | 'large' | 'xl' => {
    // Base size by era
    const eraBaseSizes = {
        'PREHISTORY': 'xs',
        'ANTIQUITY': 'small',
        'MEDIEVAL': 'small',
        'RENAISSANCE_EARLY_MODERN': 'medium',
        'INDUSTRIAL_ERA': 'medium',
        'MODERN_ERA': 'large',
        'FUTURE_ERA': 'large'
    } as const;

    let baseSize = eraBaseSizes[era] || 'small';

    // Archetype-specific scaling
    if (archetype === 'MARKET_BAZAAR') {
        // Markets scale significantly with population
        if (population > 2000) return 'large';
        if (population > 1000) return 'medium';
        return 'small';
    } else if (archetype === 'UNIVERSITY') {
        // Universities tend to be larger in later eras
        if (era === 'MODERN_ERA' || era === 'FUTURE_ERA') return 'large';
        if (era === 'RENAISSANCE_EARLY_MODERN') return 'medium';
        return 'small';
    } else if (archetype === 'SACRED_COMPLEX') {
        // Sacred complexes vary by culture and era
        if (culturalZone === 'SOUTH_ASIAN' || culturalZone === 'MENA') return 'medium';
        return 'small';
    } else if (archetype === 'THEATER') {
        // Theaters scale with population
        if (population > 1500) return 'medium';
        return 'small';
    } else if (archetype === 'CAMPGROUND') {
        // Campgrounds stay small
        return 'xs';
    }

    // WORKSHOP default scaling
    if (era === 'INDUSTRIAL_ERA' && population > 1000) {
        return 'medium'; // Industrial workshops can be larger
    }

    return baseSize as 'xs' | 'small' | 'medium' | 'large' | 'xl';
};

// Legacy function for backward compatibility
const determineWorkspaceArchetype = (businessType: string): string => {
    // Simple fallback - just use the basic workshop routing
    const type = businessType.toLowerCase();

    if (type.includes('tavern') || type.includes('inn') || type.includes('restaurant')) {
        return 'RESTAURANT_INN';
    } else if (type.includes('market') || type.includes('shop') || type.includes('store')) {
        return 'MARKET_BAZAAR';
    } else if (type.includes('temple') || type.includes('church') || type.includes('shrine')) {
        return 'SACRED_COMPLEX';
    } else if (type.includes('scholar') || type.includes('scribe') || type.includes('library')) {
        return 'UNIVERSITY';
    }

    return 'WORKSHOP';
};

const CityModal: React.FC<CityModalProps> = ({
    tile, playerCharacter, mapData, gameTimeHours, season, onClose, onEnterSpecialMap
}) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'workspaces' | 'residents'>('overview');
    const [tileData, setTileData] = useState<any>(null);
    const [selectedWorkspace, setSelectedWorkspace] = useState<any>(null);
    const [cityDescription, setCityDescription] = useState<string>('');
    const [descriptionLoading, setDescriptionLoading] = useState(false); // Start false for instant modal

    // Get all NPCs from mapData
    const allNpcs = mapData.npcs || [];
    // Total NPCs in mapData

    // Map gameTimeHours to TimeOfDay
    const timeOfDay: TimeOfDay = useMemo(() => {
        if (gameTimeHours >= 5 && gameTimeHours < 8) return 'Dawn';
        if (gameTimeHours >= 8 && gameTimeHours < 12) return 'Morning';
        if (gameTimeHours >= 12 && gameTimeHours < 16) return 'Midday';
        if (gameTimeHours >= 16 && gameTimeHours < 19) return 'Afternoon';
        if (gameTimeHours >= 19 && gameTimeHours < 21) return 'Dusk';
        return 'Night';
    }, [gameTimeHours]);

    const { era, culturalZone } = useMemo(() => {
        const dateInfo = parseDateString(mapData.timeSlice || '1650');
        const culture = mapLocationToCulture(mapData.continent || 'Europe', dateInfo.year);
        return { era: dateInfo.era as HistoricalEra, culturalZone: culture as CulturalZone };
    }, [mapData.timeSlice, mapData.continent]);

    useEffect(() => {
        // Fix any business names that might have "Unknown" in them
        urbanTileRegistry.fixBusinessNamesWithRealNpcs(allNpcs);

        // Get data from registry
        const data = urbanTileRegistry.getTileData(tile.x, tile.y);
        // Tile registry data loaded
        setTileData(data);
    }, [tile.x, tile.y, allNpcs]);


    // Get residents of this tile - REGISTRY FIRST approach
    const residents = useMemo(() => {
        // Primary method: Use urban tile registry as source of truth
        if (tileData?.residences && tileData.residences.length > 0) {
            const residentIds = tileData.residences.flatMap(r => r.occupants);

            // Try to find NPCs by ID first
            let registeredNpcs = allNpcs.filter(npc => residentIds.includes(npc.id));

            // If no matches by ID but registry has residents, NPCs might have different IDs
            // Try to match by location proximity
            if (registeredNpcs.length === 0 && residentIds.length > 0) {
                // No exact ID matches, trying proximity match

                // Find NPCs near this tile OR with home location here
                const potentialNpcs = allNpcs.filter(npc => {
                    const npcX = Math.floor(npc.x);
                    const npcY = Math.floor(npc.y);
                    const isNearby = Math.abs(npcX - tile.x) <= 1 && Math.abs(npcY - tile.y) <= 1;

                    const hasHomeHere = npc.homeLocation &&
                        npc.homeLocation.x === tile.x &&
                        npc.homeLocation.y === tile.y;

                    const hasWorkplaceHere = npc.workplaceLocation &&
                        npc.workplaceLocation.x === tile.x &&
                        npc.workplaceLocation.y === tile.y;

                    return isNearby || hasHomeHere || hasWorkplaceHere;
                });

                // Take up to the number registry says should be here
                registeredNpcs = potentialNpcs.slice(0, residentIds.length);
            }

            if (registeredNpcs.length > 0) {
                return registeredNpcs;
            }
        }

        // Fallback 1: NPCs with home location at this tile
        const npcsWithHomeHere = allNpcs.filter(npc =>
            npc.homeLocation &&
            npc.homeLocation.x === tile.x &&
            npc.homeLocation.y === tile.y
        );

        if (npcsWithHomeHere.length > 0) {
            return npcsWithHomeHere;
        }

        // Fallback 2: NPCs at or near this tile
        const nearbyNpcs = allNpcs.filter(npc => {
            const npcX = Math.floor(npc.x);
            const npcY = Math.floor(npc.y);
            return Math.abs(npcX - tile.x) <= 1 && Math.abs(npcY - tile.y) <= 1;
        });

        return nearbyNpcs;
    }, [allNpcs, tile, tileData]);

    // Get businesses in this tile - simple registry-based approach
    const businesses = useMemo(() => {
        // Primary source: Urban tile registry
        const registryBusinesses = tileData?.businesses || [];

        if (registryBusinesses.length > 0) {
            return registryBusinesses;
        }

        // Fallback: Check if any NPCs have workplaces here
        const businessMap = new Map();

        allNpcs.forEach(npc => {
            if (npc.workplaceName && npc.workplaceLocation &&
                npc.workplaceLocation.x === tile.x &&
                npc.workplaceLocation.y === tile.y) {

                const bizId = `biz_fallback_${npc.id}`;
                businessMap.set(bizId, {
                    id: bizId,
                    name: npc.workplaceName,
                    type: npc.profession?.toLowerCase().replace(/ /g, '_') || 'workshop',
                    ownerId: npc.id,
                    employees: [],
                    location: { x: tile.x, y: tile.y },
                    openHours: [6, 18]
                });
            }
        });

        return Array.from(businessMap.values());
    }, [tileData, allNpcs, tile]);

    // Generate LLM city description with caching - OPTIMISTIC UI
    useEffect(() => {
        // Show modal instantly, load description in background
        const generateDescription = async () => {
            // Check cache first
            const cached = cityDescriptionCacheService.getCachedDescription(tile.x, tile.y);
            if (cached) {
                setCityDescription(cached.description);
                return;
            }

            // Set loading state but modal is already visible
            setDescriptionLoading(true);

            // Small delay to let modal animation complete before heavy work
            await new Promise(resolve => setTimeout(resolve, 100));

            try {
                const result = await generateCityDescription({
                    tile,
                    mapData,
                    currentDate: {
                        year: parseInt(mapData.timeSlice || '1650'),
                        month: gameTimeHours > 12 ? 6 : 3, // Rough approximation
                        day: 15
                    },
                    currentTime: {
                        hours: gameTimeHours,
                        minutes: 0
                    },
                    residents,
                    businesses,
                    culturalZone: culturalZone.toString(),
                    era: era.toString()
                });

                // Cache the result
                cityDescriptionCacheService.setCachedDescription(
                    tile.x,
                    tile.y,
                    result.description,
                    result.atmosphere,
                    result.workspaces
                );

                setCityDescription(result.description);
            } catch (error) {
                console.error('Failed to generate city description:', error);
                const fallbackDescription = 'This urban district bustles with the daily activities of its residents and the commerce of local businesses.';
                setCityDescription(fallbackDescription);
                // Cache even the fallback to prevent repeated API failures
                cityDescriptionCacheService.setCachedDescription(
                    tile.x,
                    tile.y,
                    fallbackDescription,
                    'busy',
                    'Local businesses and workspaces'
                );
            } finally {
                setDescriptionLoading(false);
            }
        };

        // Generate after modal is visible (optimistic UI)
        generateDescription();
    }, [tile.x, tile.y]); // Only depend on tile coordinates to prevent re-renders

    // Get activity status for an NPC
    const getActivityStatus = (npc: NpcEntity): string => {
        const isNight = gameTimeHours < 6 || gameTimeHours >= 22;

        if (isNight) {
            if (npc.homeLocation &&
                Math.abs(npc.x - npc.homeLocation.x) <= 1 &&
                Math.abs(npc.y - npc.homeLocation.y) <= 1) {
                return '😴 Sleeping';
            }
            return '🌙 Out Late';
        }

        if (npc.activity === 'working') {
            return '⚒️ Working';
        } else if (npc.activity === 'commuting_to_work') {
            return '🚶 Commuting';
        } else if (npc.activity === 'commuting_home') {
            return '🏠 Heading Home';
        } else if (npc.activity === 'idle' && npc.homeLocation &&
            Math.abs(npc.x - npc.homeLocation.x) <= 1 &&
            Math.abs(npc.y - npc.homeLocation.y) <= 1) {
            return '🏠 At Home';
        }

        return '🚶 About Town';
    };

    // Check if a business is open
    const isBusinessOpen = (business: any): boolean => {
        if (!business.openHours) return false;
        return gameTimeHours >= business.openHours[0] &&
               gameTimeHours <= business.openHours[1];
    };

    // Get city name
    const getCityName = (): string => {
        if (tile.cityName) return tile.cityName;
        switch(tile.biome) {
            case BiomeType.HAMLET: return 'Hamlet';
            case BiomeType.LOW_DENSITY_CITY: return 'Town';
            case BiomeType.DENSE_CITY: return 'City District';
            case BiomeType.CITY_CENTER: return 'City Center';
            default: return 'Settlement';
        }
    };

    // Get population estimate
    const getPopulationEstimate = (): number => {
        if (tile.population) return tile.population;
        const baseCount = residents.length || 1;
        switch(tile.biome) {
            case BiomeType.HAMLET: return baseCount * 10;
            case BiomeType.LOW_DENSITY_CITY: return baseCount * 50;
            case BiomeType.DENSE_CITY: return baseCount * 200;
            case BiomeType.CITY_CENTER: return baseCount * 500;
            default: return baseCount * 20;
        }
    };

    const population = getPopulationEstimate();
    const condition: Condition = population > 500 ? 'prosperous' : 'humble';
    const citySize: CitySize = population > 1000 ? 'big_city' : 'smaller_city';

    // Get weather for background effects
    const weather = useMemo(() => {
        if (mapData.tiles && mapData.tiles.length > 0 && tile) {
            // weatherService.getWeather needs parameters
            const weatherState = weatherService.getWeather(
                mapData.climate || 'temperate',
                season,
                timeOfDay,
                tile.biome,
                tile.elevation || 0
            );
            // Convert to the format TimeAwareBackground expects
            return {
                type: weatherState.precipitation === 'none' ? 'clear' :
                      weatherState.precipitation === 'snow' ? 'snow' :
                      weatherState.precipitation === 'rain' ? 'rain' : 'clear',
                intensity: weatherState.intensity
            };
        }
        return { type: 'clear', intensity: 0 };
    }, [mapData.tiles, mapData.climate, season, timeOfDay, tile]);

    // Get display date for header
    const displayDate = useMemo(() => {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
        const date = parseDateString(mapData.date || '1000-1-1');
        return `${monthNames[date.month - 1]} ${date.year}`;
    }, [mapData.date]);

    // Get city type icon
    const getCityIcon = () => {
        switch(tile.biome) {
            case BiomeType.HAMLET: return <GiVillage className="text-amber-300" size={22} />;
            case BiomeType.LOW_DENSITY_CITY: return <FaBuilding className="text-amber-300" size={22} />;
            case BiomeType.DENSE_CITY: return <GiModernCity className="text-amber-300" size={22} />;
            case BiomeType.CITY_CENTER: return <FaCity className="text-amber-300" size={22} />;
            default: return <FaHome className="text-amber-300" size={22} />;
        }
    };

    // Open workspaces list for quick access
    const openBusinesses = useMemo(() => {
        return businesses.filter(b => isBusinessOpen(b));
    }, [businesses, gameTimeHours]);

    // Panel reference for focus management
    const panelRef = useRef<HTMLDivElement>(null);
    const firstFocusRef = useRef<HTMLButtonElement>(null);

    // Handle escape key
    useEffect(() => {
        const handleKeydown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeydown);
        return () => window.removeEventListener('keydown', handleKeydown);
    }, [onClose]);

    // Auto-focus on open
    useEffect(() => {
        firstFocusRef.current?.focus();
    }, []);

    // Play UI sound on open
    useEffect(() => {
        gameSounds.playUIClickSound();
    }, []);

    return (
        <div
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: isSafari() ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.6)',
                ...(isSafari() ? {} : {
                    backdropFilter: 'blur(4px)',
                    WebkitBackdropFilter: 'blur(4px)',
                }),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 5000
            }}
            role="dialog"
            aria-modal="true"
            aria-label={getCityName()}
        >
            <div
                ref={panelRef}
                className="relative w-full h-full max-h-[90vh] animate-popIn rounded-xl overflow-hidden flex flex-col border-2 border-blue-500/30"
            >
                {/* Close Button (top-right, accessible) */}
                <button
                    ref={firstFocusRef}
                    onClick={onClose}
                    aria-label="Close"
                    className="absolute top-2 right-2 sm:top-3 sm:right-3 z-30 inline-flex items-center justify-center rounded-md p-2 text-slate-200/80 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                    <FaTimes className="w-5 h-5" />
                </button>

                {/* Header with TimeAwareBackground + CityBanner */}
                <header className="relative h-[200px] sm:h-[240px] md:h-[280px] flex-shrink-0">
                    {/* Background: sky/time/weather */}
                    <div className="absolute inset-0">
                        <TimeAwareBackground timeOfDay={timeOfDay} weather={weather} season={season} />
                    </div>

                    {/* City banner overlay */}
                    <div className="absolute inset-0" style={{ mixBlendMode: 'multiply' }}>
                        <CityBanner
                            era={era}
                            culturalZone={culturalZone}
                            condition={condition}
                            climate={mapData.climate}
                            seed={mapData.seed}
                            size={citySize}
                            timeOfDay={timeOfDay}
                            season={season}
                            mapData={mapData}
                        />
                    </div>

                    {/* Gradient overlays for visibility */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent"></div>
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>

                    {/* Title/Header info at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 px-3 sm:px-5 md:px-6 pb-4 sm:pb-6 md:pb-7 text-white flex justify-between items-end">
                        <div className="flex items-start gap-3 sm:gap-4">
                            <div className={`flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-amber-600/40 to-amber-700/20 ${isSafari() ? '' : 'backdrop-blur-sm'} border-2 border-amber-500/40 shadow-lg`}>
                                {getCityIcon()}
                            </div>
                            <div>
                                <p
                                    className="text-xs sm:text-sm font-bold uppercase tracking-widest text-amber-300/90 mb-1"
                                    style={{ textShadow: '1px 1px 3px #000' }}
                                >
                                    Urban District • {displayDate}
                                </p>
                                <h2
                                    className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent"
                                    style={{ textShadow: '0 0 30px rgba(251,191,36,0.45)' }}
                                >
                                    {getCityName()}
                                </h2>
                                <p
                                    className="text-sm sm:text-base capitalize text-amber-100/90 mt-1 flex items-center gap-2"
                                    style={{ textShadow: '1px 1px 2px #000' }}
                                >
                                    <FaUsers className="text-amber-300" /> Population: ~{population.toLocaleString()} • {openBusinesses.length} workspaces open
                                </p>
                            </div>
                        </div>

                        {/* Tabs (right-aligned on large screens) */}
                        <div className={`hidden md:flex gap-2 bg-slate-900/60 ${isSafari() ? '' : 'backdrop-blur-sm'} rounded-lg p-1 px-3 border border-amber-700/30`}>
                            {(['overview', 'residents', 'workspaces'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-3 py-2 rounded-md font-semibold transition-all ${
                                        activeTab === tab
                                            ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg'
                                            : 'text-amber-300/80 hover:text-amber-200 hover:bg-slate-800/50'
                                    }`}
                                >
                                    {tab === 'overview' && <span className="inline-flex items-center gap-2"><FaCity /> Overview</span>}
                                    {tab === 'residents' && <span className="inline-flex items-center gap-2"><FaUsers /> Residents</span>}
                                    {tab === 'workspaces' && <span className="inline-flex items-center gap-2"><GiShop /> Workspaces</span>}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                {/* Mobile Tabs (below header) */}
                <div className="md:hidden flex border-b border-slate-700 bg-slate-800/50 overflow-x-auto">
                    {(['overview', 'residents', 'workspaces'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 font-semibold transition-colors whitespace-nowrap ${
                                activeTab === tab
                                    ? 'text-amber-300 border-b-2 border-amber-300'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            {tab === 'overview' && 'Overview'}
                            {tab === 'residents' && `Residents (${residents.length})`}
                            {tab === 'workspaces' && `Workspaces (${businesses.length})`}
                        </button>
                    ))}
                </div>


            {/* Tab Content with scrollable area */}
            <div className="flex-grow overflow-y-auto min-h-0 custom-scrollbar">
                {activeTab === 'overview' && (
                    <div className="p-4 sm:p-6">
                        {/* LLM District Description */}
                        <div className="mb-6">
                            {descriptionLoading ? (
                                <div className="flex items-center gap-3 p-4 bg-slate-800/30 rounded-lg border border-amber-700/20">
                                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                                    <span className="text-gray-300 text-sm">Observing the district...</span>
                                </div>
                            ) : (
                                <div className="animate-in fade-in duration-500 p-4 bg-slate-800/30 rounded-lg border border-amber-700/20">
                                    <p className="text-gray-200 text-sm leading-relaxed italic">
                                        {cityDescription}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Two column layout for better organization */}
                        <div className="grid gap-4 md:grid-cols-2 max-w-5xl mx-auto">
                            {/* Left Side - District Info */}
                            <div className="space-y-4">
                                {/* District Information Card */}
                                <section className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-lg p-4 border border-amber-700/20">
                                    <h3 className="text-base font-bold text-amber-300 mb-3 flex items-center gap-2">
                                        <FaMapMarkedAlt size={18} /> District Information
                                    </h3>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="text-gray-400">Type:</div>
                                        <div className="text-white capitalize">{tile.biome.replace(/_/g, ' ').toLowerCase()}</div>
                                        <div className="text-gray-400">Current Time:</div>
                                        <div className="text-white flex items-center gap-1">
                                            <FaClock size={12} className="text-amber-400" />
                                            {Math.floor(gameTimeHours)}:00 ({timeOfDay})
                                        </div>
                                        <div className="text-gray-400">Season:</div>
                                        <div className="text-white flex items-center gap-1">
                                            <FaLeaf size={12} className="text-green-400" />
                                            {season}
                                        </div>
                                        <div className="text-gray-400">Active Residents:</div>
                                        <div className="text-white">{residents.length} known</div>
                                    </div>
                                </section>

                                {/* Housing Information */}
                                {tileData?.residences && tileData.residences.length > 0 && (
                                    <section className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-lg p-4 border border-amber-700/20">
                                        <h3 className="text-base font-bold text-amber-300 mb-3 flex items-center gap-2">
                                            <FaHome size={18} /> Housing Districts
                                        </h3>
                                        <div className="space-y-2">
                                            {tileData.residences.slice(0, 4).map((residence, idx) => (
                                                <div key={idx} className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-300">
                                                        {residence.type.replace(/_/g, ' ')}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {residence.occupants.length} residents • {residence.wealthLevel}
                                                    </span>
                                                </div>
                                            ))}
                                            {tileData.residences.length > 4 && (
                                                <div className="text-xs text-gray-500 italic">
                                                    +{tileData.residences.length - 4} more residential areas
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                )}
                            </div>

                            {/* Right Side - Open Workspaces / Actions */}
                            <div className="space-y-4">
                                {/* Open Workspaces - Main CTA */}
                                <section className="bg-gradient-to-br from-amber-700/20 to-amber-800/20 rounded-lg p-6 border border-amber-600/30">
                                    <h3 className="text-base font-bold text-amber-300 mb-4 flex items-center gap-2">
                                        <FaDoorOpen size={18} /> Enter Open Workspaces
                                    </h3>

                                    {openBusinesses.length === 0 ? (
                                        <div className="text-center py-4">
                                            <p className="text-gray-400 mb-2">No workspaces are open at this hour</p>
                                            <p className="text-xs text-gray-500">
                                                Most businesses open between 8:00 and 20:00
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {openBusinesses.map(business => {
                                                const owner = allNpcs.find(n => n.id === business.ownerId);
                                                return (
                                                    <button
                                                        key={business.id}
                                                        className="w-full px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-lg transition-all shadow-lg hover:shadow-amber-500/25 font-bold text-sm flex items-center justify-between gap-2"
                                                        onClick={() => {
                                                            if (!onEnterSpecialMap) return;

                                                            // Generate special map config for this workspace
                                                            const ownerWealth = owner?.profession?.toLowerCase().includes('master') ? 'wealthy' :
                                                                              owner?.profession?.toLowerCase().includes('guild') ? 'comfortable' : 'modest';
                                                            const tilePopulation = tile.population || Math.max(residents.length * 10, 100);

                                                            const selectedArchetype = determineWorkspaceArchetypeAdvanced(
                                                                business.type,
                                                                culturalZone,
                                                                era,
                                                                tilePopulation,
                                                                ownerWealth
                                                            );

                                                            const selectedMapSize = getWorkspaceMapSize(
                                                                selectedArchetype,
                                                                era,
                                                                tilePopulation,
                                                                culturalZone
                                                            );

                                                            const workspaceConfig = {
                                                                archetype: selectedArchetype,
                                                                mapSize: selectedMapSize,
                                                                culturalZone: culturalZone,
                                                                era: era,
                                                                structureName: business.name,
                                                                structureId: business.id,
                                                                businessType: business.type,
                                                                owner: owner,
                                                                hasLandscape: true,
                                                                landscapeClimate: 'temperate',
                                                                population: tilePopulation,
                                                                wealthLevel: ownerWealth,
                                                                settlementType: tile.biome === BiomeType.HAMLET ? 'hamlet' :
                                                                               tile.biome === BiomeType.LOW_DENSITY_CITY ? 'town' : 'city'
                                                            };

                                                            // Entering business via Overview tab
                                                            onEnterSpecialMap(workspaceConfig);
                                                            onClose();
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <FaDoorOpen size={16} />
                                                            <span className="text-left">
                                                                {business.name}
                                                                <span className="block text-xs opacity-80">
                                                                    {business.displayType || business.type.replace(/_/g, ' ')}
                                                                </span>
                                                                {business.businessStatusDisplay && business.goodsQualityDisplay && (
                                                                    <span className="block text-xs opacity-70 mt-1">
                                                                        <span className={`inline-block mr-2 ${
                                                                            business.businessStatus === 'thriving' ? 'text-green-400' :
                                                                            business.businessStatus === 'doing_well' ? 'text-blue-400' :
                                                                            business.businessStatus === 'modest' ? 'text-yellow-400' :
                                                                            business.businessStatus === 'down_on_its_luck' ? 'text-orange-400' :
                                                                            'text-red-400'
                                                                        }`}>
                                                                            {business.businessStatusDisplay}
                                                                        </span>
                                                                        <span className={`inline-block ${
                                                                            ['excellent', 'superior', 'masterwork', 'legendary'].includes(business.goodsQuality || '') ? 'text-purple-400' :
                                                                            ['fine', 'good'].includes(business.goodsQuality || '') ? 'text-green-400' :
                                                                            ['decent', 'adequate'].includes(business.goodsQuality || '') ? 'text-blue-400' :
                                                                            'text-gray-400'
                                                                        }`}>
                                                                            {business.goodsQualityDisplay} Quality
                                                                        </span>
                                                                    </span>
                                                                )}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs">
                                                            {owner ? `${owner.emoji} ${owner.name}` : '→'}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {openBusinesses.length > 0 && (
                                        <p className="text-xs text-slate-400 text-center italic mt-3">
                                            {openBusinesses.length} of {businesses.length} workspaces currently open
                                        </p>
                                    )}
                                </section>

                                {/* Commerce Status */}
                                <section className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-lg p-4 border border-amber-700/20">
                                    <h3 className="text-base font-bold text-amber-300 mb-3 flex items-center gap-2">
                                        <GiShop size={18} /> Commerce Status
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Total Workspaces:</span>
                                            <span className="text-white font-medium">{businesses.length}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Currently Open:</span>
                                            <span className="text-green-400 font-medium">{openBusinesses.length}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Peak Hours:</span>
                                            <span className="text-white text-xs">8:00 - 20:00</span>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'residents' && (
                    <div className="p-4 sm:p-6 space-y-2 md:space-y-3">
                        {residents.length === 0 ? (
                            <div>
                                <p className="text-gray-400 italic">No known residents in this area</p>
                                <p className="text-xs text-gray-500 mt-2">Residents will appear as you explore and meet people</p>
                            </div>
                        ) : (
                            residents.map(npc => {
                                const isFriend = npc.playerRelationship?.attitude && npc.playerRelationship.attitude > 50;

                                return (
                                    <div key={npc.id} className="bg-slate-800/50 p-2 md:p-3 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl">{npc.emoji}</span>
                                                <span className="font-semibold text-white">{npc.name}</span>
                                                {isFriend && <span className="text-green-400 text-xs">👥 Friend</span>}
                                            </div>
                                            <span className="text-sm text-gray-400">{getActivityStatus(npc)}</span>
                                        </div>
                                        <div className="text-xs md:text-sm text-gray-300">
                                            {npc.profession || npc.role}
                                        </div>
                                        {npc.workplaceName && (
                                            <div className="text-[10px] md:text-xs text-gray-500 mt-1">
                                                Works at: {npc.workplaceName}
                                            </div>
                                        )}
                                        {isFriend && (
                                            <button
                                                onClick={() => {
                                                    // Visiting friend
                                                    alert(`Visiting ${npc.name}'s home...\n\n(Home visits coming soon!)`);
                                                }}
                                                className="mt-2 px-2 py-1 bg-green-700 hover:bg-green-600 text-white text-xs rounded transition-colors"
                                            >
                                                🏠 Visit Home
                                            </button>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {activeTab === 'workspaces' && (
                    <div className="p-4 sm:p-6 space-y-2 md:space-y-3">
                        {businesses.length === 0 ? (
                            <p className="text-gray-400 italic">No established workspaces in this area</p>
                        ) : (
                            businesses.map(business => {
                                const owner = allNpcs.find(n => n.id === business.ownerId);
                                const isOpen = isBusinessOpen(business);

                                return (
                                    <div key={business.id} className="bg-slate-800/50 p-2 md:p-3 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-semibold text-white">{business.name}</h4>
                                            <span className={`text-sm font-medium ${
                                                isOpen ? 'text-green-400' : 'text-red-400'
                                            }`}>
                                                {isOpen ? '✅ Open' : '❌ Closed'}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs md:text-sm mb-3">
                                            <div className="text-gray-400">Type:</div>
                                            <div className="text-gray-300">{business.type.replace(/_/g, ' ')}</div>
                                            <div className="text-gray-400">Owner:</div>
                                            <div className="text-gray-300">
                                                {owner ? `${owner.emoji} ${owner.name}` : 'Unknown'}
                                            </div>
                                            <div className="text-gray-400">Hours:</div>
                                            <div className="text-gray-300">
                                                {business.openHours ?
                                                    `${business.openHours[0]}:00 - ${business.openHours[1]}:00` :
                                                    'Unknown'}
                                            </div>
                                        </div>
                                        {isOpen && (
                                            <button
                                                onClick={() => {
                                                    // Entering workspace
                                                    setSelectedWorkspace(business);

                                                    // Generate special map config for this workspace using advanced router
                                                    if (onEnterSpecialMap) {
                                                        // Determine owner wealth level
                                                        const ownerWealth = owner?.profession?.toLowerCase().includes('master') ? 'wealthy' :
                                                                          owner?.profession?.toLowerCase().includes('guild') ? 'comfortable' : 'modest';

                                                        // Get population from tile or estimate
                                                        const tilePopulation = tile.population || Math.max(residents.length * 10, 100);

                                                        // Use advanced routing logic
                                                        const selectedArchetype = determineWorkspaceArchetypeAdvanced(
                                                            business.type,
                                                            culturalZone,
                                                            era,
                                                            tilePopulation,
                                                            ownerWealth
                                                        );

                                                        // Get appropriate map size
                                                        const selectedMapSize = getWorkspaceMapSize(
                                                            selectedArchetype,
                                                            era,
                                                            tilePopulation,
                                                            culturalZone
                                                        );

                                                        const workspaceConfig = {
                                                            archetype: selectedArchetype,
                                                            mapSize: selectedMapSize,
                                                            culturalZone: culturalZone,
                                                            era: era,
                                                            structureName: business.name,
                                                            structureId: business.id,
                                                            businessType: business.type,
                                                            owner: owner,
                                                            hasLandscape: true,
                                                            landscapeClimate: 'temperate',
                                                            // Additional context for generators
                                                            population: tilePopulation,
                                                            wealthLevel: ownerWealth,
                                                            settlementType: tile.biome === BiomeType.HAMLET ? 'hamlet' :
                                                                           tile.biome === BiomeType.LOW_DENSITY_CITY ? 'town' : 'city'
                                                        };

                                                        // Advanced routing determined
                                                        onEnterSpecialMap(workspaceConfig);
                                                    } else {
                                                        alert(`Entering ${business.name}...\n\n(Special map generation for workspaces coming soon!)`);
                                                    }
                                                }}
                                                className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-md transition-colors text-sm"
                                            >
                                                🚪 Enter Workspace
                                            </button>
                                        )}
                                        {!isOpen && (
                                            <div className="w-full px-3 py-2 bg-gray-700 text-gray-400 text-center rounded-md text-sm">
                                                Closed - Come back {business.openHours ? `at ${business.openHours[0]}:00` : 'later'}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {/* Footer with buttons */}
            <footer className="flex justify-between items-center p-3 md:p-4 border-t border-slate-700 bg-slate-800/50 shrink-0">
                {/* Debug button for testing - remove in production */}
                <button
                    onClick={() => {
                        // Clear tile data and force regeneration
                        const { urbanTileRegistry } = require('../services/urbanTileRegistryService');
                        urbanTileRegistry.clearTile(tile.x, tile.y);
                        console.log(`Cleared business data for tile (${tile.x}, ${tile.y}). Refreshing...`);

                        // Refresh the page to trigger regeneration
                        window.location.reload();
                    }}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded text-sm transition-colors"
                    title="Debug: Clear cached businesses and regenerate for this tile"
                >
                    🔄 Regenerate Businesses
                </button>

                <button
                    onClick={onClose}
                    className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-500 transition-colors"
                >
                    Leave District
                </button>
            </footer>
        </div>
        </div>
    );
};

export default CityModal;