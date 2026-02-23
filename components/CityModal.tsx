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
import { imageGenerationService } from '../services/imageGenerationService';
import { isSafari } from '../utils/safariUtils';
import { getRandomCityEvent, rollCityEventOutcome, CityEvent, CityEventOutcome } from '../services/cityEventService';
import {
    FaTimes,
    FaUsers,
    FaClock,
    FaLeaf,
    FaExclamationTriangle,
    FaChevronRight,
} from 'react-icons/fa';
import {
    GiShop,
} from 'react-icons/gi';

interface CityModalProps {
    tile: Tile;
    playerCharacter: PlayerCharacter;
    mapData: MapData;
    npcs?: NpcEntity[];
    gameTimeHours: number;
    season: Season;
    onClose: () => void;
    onEnterSpecialMap?: (config: any) => void;
    onApplyEventOutcome?: (outcome: CityEventOutcome) => void;
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


const CityModal: React.FC<CityModalProps> = ({
    tile, playerCharacter, mapData, npcs: npcsFromProps, gameTimeHours, season, onClose, onEnterSpecialMap, onApplyEventOutcome
}) => {
    const [tileData, setTileData] = useState<any>(null);
    const [cityDescription, setCityDescription] = useState<string>('');
    const [descriptionLoading, setDescriptionLoading] = useState(false); // Start false for instant modal
    const [cachedCityImage, setCachedCityImage] = useState<string | null>(null);

    // City Event state
    const [cityEvent, setCityEvent] = useState<CityEvent | null>(null);
    const [eventOutcome, setEventOutcome] = useState<CityEventOutcome | null>(null);
    const [showEventOutcome, setShowEventOutcome] = useState(false);

    // Use explicit npcs prop if provided, otherwise fall back to mapData.npcs
    const allNpcs = npcsFromProps && npcsFromProps.length > 0 ? npcsFromProps : (mapData.npcs || []);

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
        // Restore persisted registry data if needed (one-time, idempotent)
        urbanTileRegistry.load();
        urbanTileRegistry.fixBusinessNamesWithRealNpcs(allNpcs);
        const data = urbanTileRegistry.getTileData(tile.x, tile.y);
        setTileData(data);
    }, [tile.x, tile.y]);

    // Load cached city image
    useEffect(() => {
        const loadCachedImage = async () => {
            // Get city name from mapData
            const cityName = mapData.majorCity?.name || mapData.name;

            if (cityName && culturalZone) {
                const currentTimeOfDay = timeOfDay.toLowerCase();
                const cachedUrl = await imageGenerationService.getCachedCityImage(
                    cityName,
                    culturalZone,
                    mapData.year || 1500,
                    currentTimeOfDay
                );

                if (cachedUrl) {
                    console.log(`Using cached city image for ${cityName}`);
                    setCachedCityImage(cachedUrl);
                }
            }
        };

        loadCachedImage();
    }, [mapData, culturalZone, timeOfDay]);

    // Trigger city event on modal open (50% chance)
    useEffect(() => {
        const dateInfo = parseDateString(mapData.timeSlice || '1500');
        const year = dateInfo.year;

        const event = getRandomCityEvent(era, culturalZone, year);
        if (event) {
            setCityEvent(event);
        }
    }, []); // Only run once on mount

    // Handle city event choice
    const handleEventChoice = useCallback((choiceIndex: number) => {
        if (!cityEvent) return;

        const choice = cityEvent.choices[choiceIndex];
        const outcome = rollCityEventOutcome(choice.outcomes);

        setEventOutcome(outcome);
        setShowEventOutcome(true);

        // Apply outcome effects to player character
        if (onApplyEventOutcome) {
            onApplyEventOutcome(outcome);
        }

    }, [cityEvent, onApplyEventOutcome]);

    const dismissEvent = useCallback(() => {
        setCityEvent(null);
        setEventOutcome(null);
        setShowEventOutcome(false);
    }, []);

    // Get residents of this tile - cascading lookup with broad fallbacks
    const residents = useMemo(() => {
        const seen = new Set<string>();
        const dedup = (npcs: NpcEntity[]) => npcs.filter(n => { if (seen.has(n.id)) return false; seen.add(n.id); return true; });

        // 1. Registry ID match
        if (tileData?.residences && tileData.residences.length > 0) {
            const residentIds = new Set(tileData.residences.flatMap(r => r.occupants));
            const byId = allNpcs.filter(npc => residentIds.has(npc.id));
            if (byId.length > 0) return dedup(byId);
        }

        // 2. NPCs whose homeLocation or workplaceLocation matches this tile
        const homeOrWork = allNpcs.filter(npc => {
            const hasHome = npc.homeLocation && npc.homeLocation.x === tile.x && npc.homeLocation.y === tile.y;
            const hasWork = npc.workplaceLocation && npc.workplaceLocation.x === tile.x && npc.workplaceLocation.y === tile.y;
            return hasHome || hasWork;
        });
        if (homeOrWork.length > 0) return dedup(homeOrWork);

        // 3. NPCs within ±3 tiles
        const nearby = allNpcs.filter(npc => {
            const dx = Math.abs(Math.floor(npc.x) - tile.x);
            const dy = Math.abs(Math.floor(npc.y) - tile.y);
            return dx <= 3 && dy <= 3;
        });
        if (nearby.length > 0) return dedup(nearby);

        // 4. NPCs who own businesses at this tile
        if (tileData?.businesses && tileData.businesses.length > 0) {
            const ownerIds = new Set(tileData.businesses.map(b => b.ownerId).filter(Boolean));
            const owners = allNpcs.filter(npc => ownerIds.has(npc.id));
            if (owners.length > 0) return dedup(owners);
        }

        // 5. Any NPC with a home or workplace (urban-associated)
        const urbanNpcs = allNpcs.filter(npc =>
            npc.homeLocation != null || npc.workplaceName != null
        );
        if (urbanNpcs.length > 0) return dedup(urbanNpcs);

        return [];
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

    // Helper: build workspace config for entering a business
    const buildWorkspaceConfig = useCallback((business: any) => {
        const owner = allNpcs.find(n => n.id === business.ownerId);
        const ownerWealth = owner?.profession?.toLowerCase().includes('master') ? 'wealthy' :
                            owner?.profession?.toLowerCase().includes('guild') ? 'comfortable' : 'modest';
        const tilePopulation = tile.population || Math.max(residents.length * 10, 100);

        const selectedArchetype = determineWorkspaceArchetypeAdvanced(
            business.type, culturalZone, era, tilePopulation, ownerWealth
        );
        const selectedMapSize = getWorkspaceMapSize(
            selectedArchetype, era, tilePopulation, culturalZone
        );

        return {
            archetype: selectedArchetype,
            mapSize: selectedMapSize,
            culturalZone,
            era,
            structureName: business.name,
            structureId: business.id,
            businessType: business.type,
            owner,
            hasLandscape: true,
            landscapeClimate: 'temperate',
            population: tilePopulation,
            wealthLevel: ownerWealth,
            settlementType: tile.biome === BiomeType.HAMLET ? 'hamlet' :
                           tile.biome === BiomeType.LOW_DENSITY_CITY ? 'town' : 'city'
        };
    }, [allNpcs, tile, residents, culturalZone, era]);

    // Workspace icon lookup
    const getWorkspaceIcon = (type: string): string => {
        const t = type.toLowerCase();
        if (t.includes('tavern') || t.includes('inn') || t.includes('restaurant')) return '\u{1F37A}';
        if (t.includes('market') || t.includes('shop') || t.includes('store')) return '\u{1F6D2}';
        if (t.includes('temple') || t.includes('church') || t.includes('shrine')) return '\u{1F54C}';
        if (t.includes('smith') || t.includes('forge')) return '\u{2692}';
        if (t.includes('baker') || t.includes('mill')) return '\u{1F35E}';
        if (t.includes('weav') || t.includes('textile')) return '\u{1F9F5}';
        if (t.includes('scholar') || t.includes('library')) return '\u{1F4DA}';
        if (t.includes('healer') || t.includes('physician')) return '\u{2695}';
        return '\u{1F3EA}';
    };

    return (
        <div
            data-surface="modal-overlay"
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
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
                className="relative w-[95%] max-w-5xl max-h-[90vh] animate-popIn rounded-xl overflow-hidden flex flex-col shadow-2xl"
                style={{
                    borderWidth: '1px',
                    borderColor: 'var(--surface-card-border)',
                    backgroundColor: 'var(--bg-primary)',
                }}
            >
                {/* ── BANNER (unchanged) ── */}
                <header className="relative h-[180px] sm:h-[210px] md:h-[240px] flex-shrink-0">
                    <div className="absolute inset-0">
                        <TimeAwareBackground timeOfDay={timeOfDay} weather={weather} season={season} />
                    </div>
                    <div className="absolute inset-0">
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
                            aiGeneratedImageUrl={cachedCityImage}
                        />
                    </div>
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent" />
                    <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                            background: 'linear-gradient(to top, var(--bg-primary) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)'
                        }}
                    />
                </header>

                {/* ── INFO STRIP ── */}
                <div
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 shrink-0"
                    style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderBottomWidth: '1px',
                        borderColor: 'var(--surface-card-border)',
                    }}
                >
                    {/* Left: City name + meta */}
                    <div className="flex items-center gap-3 min-w-0">
                        <h2
                            className="text-xl sm:text-2xl font-bold truncate"
                            style={{ fontFamily: "'Lora', Georgia, serif", color: 'var(--text-primary)' }}
                        >
                            {getCityName()}
                        </h2>
                        <span
                            className="hidden sm:inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                            style={{
                                backgroundColor: 'var(--surface-chip-bg)',
                                border: '1px solid var(--surface-chip-border)',
                                color: 'var(--text-secondary)',
                            }}
                        >
                            Urban District
                        </span>
                        <span
                            className="hidden md:inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                            style={{
                                backgroundColor: 'var(--surface-chip-bg)',
                                border: '1px solid var(--surface-chip-border)',
                                color: 'var(--text-secondary)',
                            }}
                        >
                            {displayDate}
                        </span>
                        <span
                            className="hidden lg:inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full capitalize"
                            style={{
                                backgroundColor: 'var(--surface-chip-bg)',
                                border: '1px solid var(--surface-chip-border)',
                                color: 'var(--text-secondary)',
                            }}
                        >
                            {culturalZone.replace(/_/g, ' ').toLowerCase()}
                        </span>
                    </div>

                    {/* Right: time / season / pop / close */}
                    <div className="flex items-center gap-2">
                        <span
                            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                            style={{
                                backgroundColor: 'var(--surface-chip-bg)',
                                border: '1px solid var(--surface-chip-border)',
                                color: 'var(--text-secondary)',
                            }}
                        >
                            <FaClock size={10} /> {Math.floor(gameTimeHours)}:00
                        </span>
                        <span
                            className="hidden sm:inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                            style={{
                                backgroundColor: 'var(--surface-chip-bg)',
                                border: '1px solid var(--surface-chip-border)',
                                color: 'var(--text-secondary)',
                            }}
                        >
                            <FaLeaf size={10} /> {season}
                        </span>
                        <span
                            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                            style={{
                                backgroundColor: 'var(--surface-chip-bg)',
                                border: '1px solid var(--surface-chip-border)',
                                color: 'var(--text-secondary)',
                            }}
                        >
                            <FaUsers size={10} /> ~{population.toLocaleString()}
                        </span>
                        <button
                            ref={firstFocusRef}
                            onClick={onClose}
                            aria-label="Close"
                            className="inline-flex items-center justify-center rounded-md p-1.5 transition-all duration-200 hover:scale-110"
                            style={{
                                color: 'var(--text-secondary)',
                                backgroundColor: 'var(--surface-chip-bg)',
                                border: '1px solid var(--surface-chip-border)',
                            }}
                        >
                            <FaTimes size={14} />
                        </button>
                    </div>
                </div>

                {/* ── TWO-PANEL GRID ── */}
                <div
                    className="flex-grow min-h-0 grid grid-cols-1 md:grid-cols-2"
                    style={{ maxHeight: 520 }}
                >
                    {/* ─── LEFT PANEL: Narrative ─── */}
                    <div
                        className="overflow-y-auto custom-scrollbar p-4 sm:p-5"
                        style={{
                            backgroundColor: 'var(--bg-primary)',
                            borderRightWidth: '1px',
                            borderColor: 'var(--surface-card-border)',
                            maxHeight: 'inherit',
                        }}
                    >
                        {/* LLM Description */}
                        {descriptionLoading ? (
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'rgba(244,203,120,0.9)' }} />
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Observing the district...</span>
                            </div>
                        ) : cityDescription ? (
                            <div
                                className="mb-5 animate-in fade-in duration-500"
                                style={{
                                    borderLeft: '3px solid rgba(244,203,120,0.5)',
                                    paddingLeft: '1rem',
                                }}
                            >
                                <p
                                    className="leading-relaxed"
                                    style={{
                                        fontFamily: "'Lora', Georgia, serif",
                                        fontStyle: 'italic',
                                        fontSize: '1.05rem',
                                        color: 'var(--text-primary)',
                                        lineHeight: 1.8,
                                    }}
                                >
                                    <span
                                        style={{
                                            float: 'left',
                                            fontSize: '2.8rem',
                                            lineHeight: 1,
                                            fontWeight: 700,
                                            marginRight: '0.25rem',
                                            marginTop: '0.05rem',
                                            color: 'rgba(244,203,120,0.9)',
                                            fontStyle: 'normal',
                                        }}
                                    >
                                        {cityDescription.charAt(0)}
                                    </span>
                                    {cityDescription.slice(1)}
                                </p>
                            </div>
                        ) : null}

                        {/* Divider */}
                        <div className="flex items-center gap-3 my-4">
                            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--surface-card-border)' }} />
                            <span className="text-xs italic" style={{ color: 'var(--text-muted)', fontFamily: "'Lora', Georgia, serif" }}>
                                Something stirs
                            </span>
                            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--surface-card-border)' }} />
                        </div>

                        {/* City Event */}
                        {cityEvent && !showEventOutcome && (
                            <div className="animate-in fade-in duration-500">
                                <div
                                    className="rounded-lg p-4"
                                    style={{
                                        backgroundColor: 'var(--bg-card)',
                                        border: '1px solid rgba(251,191,36,0.25)',
                                    }}
                                >
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="relative flex-shrink-0 mt-0.5">
                                            <div
                                                className="w-2 h-2 rounded-full animate-pulse absolute -top-0.5 -right-0.5"
                                                style={{ backgroundColor: '#fbbf24' }}
                                            />
                                            <FaExclamationTriangle style={{ color: '#fbbf24' }} size={18} />
                                        </div>
                                        <div className="flex-1">
                                            <h3
                                                className="text-sm font-bold mb-1.5"
                                                style={{ color: 'rgba(244,203,120,0.9)', fontFamily: "'Lora', Georgia, serif" }}
                                            >
                                                Event in the City
                                            </h3>
                                            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                                                {cityEvent.prompt}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={() => handleEventChoice(0)}
                                            className="flex-1 px-3 py-2 rounded-md font-medium text-xs transition-all duration-200 hover:brightness-110 active:scale-95"
                                            style={{ backgroundColor: 'var(--accent-primary)', color: '#000' }}
                                        >
                                            {cityEvent.choices[0].text}
                                        </button>
                                        <button
                                            onClick={() => handleEventChoice(1)}
                                            className="flex-1 px-3 py-2 rounded-md font-medium text-xs transition-all duration-200 hover:brightness-110 active:scale-95"
                                            style={{ backgroundColor: '#475569', color: '#fff' }}
                                        >
                                            {cityEvent.choices[1].text}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Event Outcome */}
                        {showEventOutcome && eventOutcome && (
                            <div className="animate-in fade-in duration-500">
                                <div
                                    className="rounded-lg p-4"
                                    style={{
                                        backgroundColor: 'var(--bg-card)',
                                        border: `1px solid ${
                                            eventOutcome.result === 'death' ? '#dc2626' :
                                            eventOutcome.result === 'injury' ? '#ea580c' :
                                            eventOutcome.result === 'gold_gain' || eventOutcome.result === 'item' ? '#22c55e' :
                                            '#64748b'
                                        }`,
                                    }}
                                >
                                    <h3
                                        className="text-sm font-bold mb-1.5"
                                        style={{
                                            fontFamily: "'Lora', Georgia, serif",
                                            color: eventOutcome.result === 'death' ? '#fca5a5' :
                                                   eventOutcome.result === 'injury' ? '#fdba74' :
                                                   eventOutcome.result === 'gold_gain' || eventOutcome.result === 'item' ? '#86efac' :
                                                   '#cbd5e1'
                                        }}
                                    >
                                        {eventOutcome.result === 'death' ? 'Fatal Outcome' :
                                         eventOutcome.result === 'injury' ? 'Injury Sustained' :
                                         eventOutcome.result === 'gold_gain' ? 'Fortune Favors You' :
                                         eventOutcome.result === 'gold_loss' ? 'Unfortunate Loss' :
                                         eventOutcome.result === 'item' ? 'Item Acquired' :
                                         eventOutcome.result === 'knowledge' ? 'Knowledge Gained' :
                                         eventOutcome.result === 'reputation_gain' ? 'Reputation Enhanced' :
                                         eventOutcome.result === 'reputation_loss' ? 'Reputation Damaged' :
                                         'Event Concluded'}
                                    </h3>
                                    <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-primary)' }}>
                                        {eventOutcome.message}
                                    </p>
                                    <button
                                        onClick={dismissEvent}
                                        className="px-3 py-1.5 rounded-md font-medium text-xs transition-all duration-200 hover:brightness-110 active:scale-95"
                                        style={{ backgroundColor: '#475569', color: '#fff' }}
                                    >
                                        Continue
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Empty state if no event and no description */}
                        {!cityEvent && !showEventOutcome && !cityDescription && !descriptionLoading && (
                            <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>
                                The district is quiet for now.
                            </p>
                        )}
                    </div>

                    {/* ─── RIGHT PANEL: Interactive ─── */}
                    <div
                        className="overflow-y-auto custom-scrollbar p-4 sm:p-5"
                        style={{
                            backgroundColor: 'var(--bg-secondary)',
                            maxHeight: 'inherit',
                        }}
                    >
                        {/* Workspaces section */}
                        <div
                            className="flex items-center justify-between mb-3"
                            style={{
                                position: 'sticky',
                                top: 0,
                                zIndex: 2,
                                backgroundColor: 'var(--bg-secondary)',
                                paddingBottom: '0.25rem',
                            }}
                        >
                            <h3
                                className="text-sm font-bold flex items-center gap-2"
                                style={{ color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                            >
                                <GiShop size={16} style={{ color: 'var(--accent-primary)' }} />
                                Workspaces
                            </h3>
                            <span
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{
                                    backgroundColor: 'var(--surface-chip-bg)',
                                    border: '1px solid var(--surface-chip-border)',
                                    color: 'var(--accent-primary)',
                                }}
                            >
                                {openBusinesses.length} of {businesses.length} open
                            </span>
                        </div>

                        {businesses.length === 0 ? (
                            <p className="text-sm italic mb-4" style={{ color: 'var(--text-muted)' }}>
                                No established workspaces in this area
                            </p>
                        ) : (
                            <div className="space-y-1.5 mb-4">
                                {businesses.map(business => {
                                    const owner = allNpcs.find(n => n.id === business.ownerId);
                                    const isOpen = isBusinessOpen(business);

                                    return (
                                        <div
                                            key={business.id}
                                            className="rounded-lg px-3 py-2.5 transition-all duration-200 hover:brightness-110"
                                            style={{
                                                backgroundColor: 'var(--bg-card)',
                                                border: '1px solid var(--surface-card-border)',
                                                display: 'grid',
                                                gridTemplateColumns: '36px 1fr auto',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                cursor: isOpen && onEnterSpecialMap ? 'pointer' : 'default',
                                                opacity: isOpen ? 1 : 0.6,
                                            }}
                                            onClick={() => {
                                                if (!isOpen || !onEnterSpecialMap) return;
                                                onEnterSpecialMap(buildWorkspaceConfig(business));
                                                onClose();
                                            }}
                                        >
                                            {/* Icon */}
                                            <span className="text-xl text-center" role="img">
                                                {getWorkspaceIcon(business.type)}
                                            </span>

                                            {/* Name + detail */}
                                            <div className="min-w-0">
                                                <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                                    {business.name}
                                                </div>
                                                <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                                                    {business.displayType || business.type.replace(/_/g, ' ')}
                                                    {owner ? ` \u00B7 ${owner.name}` : ''}
                                                </div>
                                            </div>

                                            {/* Status + enter arrow */}
                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex items-center gap-1 text-xs font-medium">
                                                    <span
                                                        className={`inline-block w-1.5 h-1.5 rounded-full ${isOpen ? 'animate-pulse' : ''}`}
                                                        style={{ backgroundColor: isOpen ? 'var(--accent-primary)' : 'var(--text-muted)' }}
                                                    />
                                                    <span style={{ color: isOpen ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                                                        {isOpen ? 'Open' : 'Closed'}
                                                    </span>
                                                </span>
                                                {isOpen && onEnterSpecialMap && (
                                                    <FaChevronRight size={10} style={{ color: 'var(--accent-primary)' }} />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Divider */}
                        <div className="h-px my-3" style={{ backgroundColor: 'var(--surface-card-border)' }} />

                        {/* Residents section */}
                        <div
                            className="flex items-center justify-between mb-3"
                            style={{
                                position: 'sticky',
                                top: 0,
                                zIndex: 2,
                                backgroundColor: 'var(--bg-secondary)',
                                paddingBottom: '0.25rem',
                            }}
                        >
                            <h3
                                className="text-sm font-bold flex items-center gap-2"
                                style={{ color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                            >
                                <FaUsers size={14} style={{ color: 'var(--accent-primary)' }} />
                                Known Residents
                            </h3>
                            <span
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{
                                    backgroundColor: 'var(--surface-chip-bg)',
                                    border: '1px solid var(--surface-chip-border)',
                                    color: 'var(--text-secondary)',
                                }}
                            >
                                {residents.length}
                            </span>
                        </div>

                        {residents.length === 0 ? (
                            <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
                                No known residents. Explore to meet people.
                            </p>
                        ) : (
                            <div className="space-y-1">
                                {residents.map(npc => (
                                    <div
                                        key={npc.id}
                                        className="rounded-md px-3 py-2 transition-colors duration-150"
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: '28px 1fr auto',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            backgroundColor: 'transparent',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-card)')}
                                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                    >
                                        <span className="text-lg text-center">{npc.emoji}</span>
                                        <div className="min-w-0">
                                            <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                                                {npc.name}
                                            </div>
                                            <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                                                {npc.profession || npc.role}
                                                {npc.workplaceName ? ` \u00B7 ${npc.workplaceName}` : ''}
                                            </div>
                                        </div>
                                        <span className="text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                                            {getActivityStatus(npc)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── FOOTER ── */}
                <footer
                    className="flex justify-end items-center p-3 shrink-0"
                    style={{
                        borderTopWidth: '1px',
                        borderColor: 'var(--surface-card-border)',
                        backgroundColor: 'var(--bg-secondary)',
                    }}
                >
                    <button
                        onClick={onClose}
                        className="px-5 py-2 text-sm font-semibold rounded-md transition-all duration-200 hover:brightness-110 active:scale-95"
                        style={{
                            backgroundColor: 'var(--button-primary-bg)',
                            color: 'var(--button-primary-text)',
                            border: '1px solid var(--button-primary-border)',
                        }}
                    >
                        Leave District
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default CityModal;