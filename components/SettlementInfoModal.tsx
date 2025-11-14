/**
 * components/SettlementInfoModal.tsx - A detailed informational panel for settlements and farms.
 */
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { Tile, MapData, BiomeType, CulturalZone, HistoricalEra, Gender, TimeOfDay, NpcEntity, PlayerCharacter } from '../types';
import { generateNpcName, generateBaseProfile, determineSocialRole } from '../generation/common/npcUtils';
import { ValueNoise } from '../utils/noise';
import { mapLocationToCulture } from '../utils/mapUtils';
import { parseDateString } from '../utils/dateUtils';
import { getSettlementProfessions } from '../services/settlementService';
import { getFarmState } from '../services/farmService';
import { ProceduralPortrait } from './portraits';
import CityBanner, { CitySize } from './CityBanner';
import FarmBanner from './FarmBanner';
import MarketplaceBanner, { Condition } from './MarketplaceBanner';
import { Season, ClimateType } from '../types';
import { generateNpcGreeting, createDialogueContext } from '../services/npcDialogueService';
import { usePortraitExpression, mapRepDeltaToExpr } from '../hooks/usePortraitExpression';
import { urbanTileRegistry } from '../services/urbanTileRegistryService';
import { imageGenerationService } from '../services/imageGenerationService';
import {
    Store, Users, Home, Building2, Tent, Castle,
    Wheat, Package, Hammer, ShoppingBag, ArrowRight,
    Moon, Briefcase, MapPin, HomeIcon, Clock, User,
    CircleDot, Activity
} from 'lucide-react';

interface SettlementInfoModalProps {
  tile: Tile;
  mapData: MapData;
  onClose: () => void;
  gameTimeHours: number;
  season: Season;
  npcs?: NpcEntity[];
  playerCharacter?: PlayerCharacter;
}

const DetailRow: React.FC<{ label: string; value: string | number | React.ReactNode; icon?: string }> = ({ label, value, icon }) => (
    <div className="flex justify-between items-baseline py-1.5 border-b border-[var(--border-normal)]">
        <span className="text-[var(--text-muted)] flex items-center gap-2">
            {icon && <span className="text-base">{icon}</span>}
            {label}
        </span>
        <span className="text-[var(--text-primary)] font-semibold text-right">{value}</span>
    </div>
);

const SettlementInfoModal: React.FC<SettlementInfoModalProps> = ({ tile, mapData, onClose, gameTimeHours, season, npcs, playerCharacter }) => {
    // Portrait expression management
    const { expr: portraitExpr, flash: flashPortrait, clear: clearPortrait } = usePortraitExpression();

    // Dialogue state
    const [selectedNpcId, setSelectedNpcId] = useState<string | null>(null);
    const [dialogueText, setDialogueText] = useState<string>('');
    const [dialogueVisible, setDialogueVisible] = useState(false);
    const [dialogueLoading, setDialogueLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'residents' | 'businesses'>('overview');
    const [tileData, setTileData] = useState<any>(null);
    const [cachedCityImage, setCachedCityImage] = useState<string | null>(null);

    // Get ALL NPCs from mapData for better detection
    const allMapNpcs = useMemo(() => {
        // Use passed npcs if available, otherwise get from mapData
        return npcs || mapData.npcs || [];
    }, [npcs, mapData]);

    // Load urban tile data on mount
    useEffect(() => {
        // Fix any business names that might have "Unknown" in them
        urbanTileRegistry.fixBusinessNamesWithRealNpcs(allMapNpcs);

        const data = urbanTileRegistry.getTileData(tile.x, tile.y);
        setTileData(data);
    }, [tile.x, tile.y, allMapNpcs]);

    // Try to load cached city image
    useEffect(() => {
        const loadCachedImage = async () => {
            // Only try for city biomes
            if (tile.biome === BiomeType.HAMLET ||
                tile.biome === BiomeType.LOW_DENSITY_CITY ||
                tile.biome === BiomeType.DENSE_CITY ||
                tile.biome === BiomeType.CITY_CENTER) {

                // Get city name from majorCity or tile name
                const cityName = mapData.majorCity?.name || tile.cityName || mapData.name;

                // Parse date and culture info
                const parsed = parseDateString(mapData.timeSlice || '1650');
                const culture = mapLocationToCulture(
                    mapData.localArea || mapData.continent || 'Europe',
                    parsed.year
                );

                // Map gameTimeHours to TimeOfDay
                let currentTimeOfDay = 'afternoon';
                if (gameTimeHours >= 5 && gameTimeHours < 8) currentTimeOfDay = 'dawn';
                else if (gameTimeHours >= 8 && gameTimeHours < 12) currentTimeOfDay = 'morning';
                else if (gameTimeHours >= 12 && gameTimeHours < 16) currentTimeOfDay = 'midday';
                else if (gameTimeHours >= 16 && gameTimeHours < 19) currentTimeOfDay = 'afternoon';
                else if (gameTimeHours >= 19 && gameTimeHours < 21) currentTimeOfDay = 'dusk';
                else currentTimeOfDay = 'night';

                if (cityName && culture) {
                    const cachedUrl = await imageGenerationService.getCachedCityImage(
                        cityName,
                        culture,
                        parsed.year || 1500,
                        currentTimeOfDay
                    );

                    if (cachedUrl) {
                        console.log(`Using cached city image for ${cityName}`);
                        setCachedCityImage(cachedUrl);
                    }
                }
            }
        };

        loadCachedImage();
    }, [tile.biome, tile.cityName, mapData, gameTimeHours]);

    // Get residents of this tile - REGISTRY FIRST approach
    const residents = useMemo(() => {
        // Primary method: Use urban tile registry as source of truth
        if (tileData?.residences && tileData.residences.length > 0) {
            const residentIds = tileData.residences.flatMap((r: any) => r.occupants);

            // Try to find NPCs by ID first
            let registeredNpcs = allMapNpcs.filter(npc => residentIds.includes(npc.id));

            // If no matches by ID but registry has residents, try proximity match
            if (registeredNpcs.length === 0 && residentIds.length > 0) {
                console.log('[SettlementInfo] Registry has', residentIds.length, 'residents but no ID matches. Trying proximity match.');

                // Find NPCs near this tile OR with home location here
                const potentialNpcs = allMapNpcs.filter(npc => {
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
        const npcsWithHomeHere = allMapNpcs.filter(npc =>
            npc.homeLocation &&
            npc.homeLocation.x === tile.x &&
            npc.homeLocation.y === tile.y
        );

        if (npcsWithHomeHere.length > 0) {
            return npcsWithHomeHere;
        }

        // Fallback 2: NPCs at or near this tile
        const nearbyNpcs = allMapNpcs.filter(npc => {
            const npcX = Math.floor(npc.x);
            const npcY = Math.floor(npc.y);
            return Math.abs(npcX - tile.x) <= 1 && Math.abs(npcY - tile.y) <= 1;
        });

        return nearbyNpcs;
    }, [allMapNpcs, tile, tileData]);

    // Get businesses in this tile - simple registry-based approach with fallback
    const businesses = useMemo(() => {
        // Primary source: Urban tile registry
        const registryBusinesses = tileData?.businesses || [];

        if (registryBusinesses.length > 0) {
            console.log('[SettlementInfo] Found', registryBusinesses.length, 'businesses in registry');
            return registryBusinesses;
        }

        // Fallback: Check if any NPCs have workplaces here
        const businessMap = new Map();

        allMapNpcs.forEach(npc => {
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

        const fallbackBusinesses = Array.from(businessMap.values());
        if (fallbackBusinesses.length > 0) {
            console.log('[SettlementInfo] Using', fallbackBusinesses.length, 'fallback businesses from NPC data');
        }

        return fallbackBusinesses;
    }, [tileData, allMapNpcs, tile]);

    // Get activity status for an NPC (same logic as CityModal)
    const getActivityStatus = (npc: NpcEntity): string => {
        const isNight = gameTimeHours < 6 || gameTimeHours >= 22;

        if (isNight) {
            if (npc.homeLocation &&
                Math.abs(npc.x - npc.homeLocation.x) <= 1 &&
                Math.abs(npc.y - npc.homeLocation.y) <= 1) {
                return 'Sleeping';
            }
            return 'Out Late';
        }

        if (npc.activity === 'working') {
            return 'Working';
        } else if (npc.activity === 'commuting_to_work') {
            return 'Commuting';
        } else if (npc.activity === 'commuting_home') {
            return 'Heading Home';
        } else if (npc.activity === 'idle' && npc.homeLocation &&
            Math.abs(npc.x - npc.homeLocation.x) <= 1 &&
            Math.abs(npc.y - npc.homeLocation.y) <= 1) {
            return 'At Home';
        }

        return 'About Town';
    };

    // Check if a business is open
    const isBusinessOpen = (business: any): boolean => {
        if (!business.openHours) return false;
        return gameTimeHours >= business.openHours[0] &&
               gameTimeHours <= business.openHours[1];
    };

    // Get supply chain for business types
    const getSupplyChain = (businessType: string): { steps: string[], icons: React.ReactNode[] } => {
        const chains: Record<string, { steps: string[], icons: React.ReactNode[] }> = {
            'bakery': {
                steps: ['Farm', 'Mill', 'Bakery'],
                icons: [<Wheat className="w-4 h-4" />, <Package className="w-4 h-4" />, <Store className="w-4 h-4" />]
            },
            'smithy': {
                steps: ['Mine', 'Forge', 'Smithy'],
                icons: [<Hammer className="w-4 h-4" />, <Activity className="w-4 h-4" />, <Hammer className="w-4 h-4" />]
            },
            'tailor_shop': {
                steps: ['Farm', 'Weaver', 'Tailor'],
                icons: [<Wheat className="w-4 h-4" />, <Package className="w-4 h-4" />, <ShoppingBag className="w-4 h-4" />]
            }
        };
        return chains[businessType] || { steps: [], icons: [] };
    };

    // Get work progress for an NPC
    const getWorkProgress = (npc: NpcEntity): number => {
        const workplace = businesses.find((b: any) =>
            b.ownerId === npc.id || b.employees?.includes(npc.id)
        );
        if (!workplace || !workplace.openHours) return 0;

        const [start, end] = workplace.openHours;
        if (gameTimeHours < start || gameTimeHours > end) return 0;

        return Math.min(100, ((gameTimeHours - start) / (end - start)) * 100);
    };

    // Get housing icon based on wealth
    const getHousingIcon = (wealthLevel: string): React.ReactNode => {
        switch(wealthLevel) {
            case 'poor': return <Tent className="w-4 h-4 text-[var(--text-muted)]" />;
            case 'modest': return <Home className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
            case 'comfortable': return <Building2 className="w-4 h-4 text-green-600 dark:text-green-400" />;
            case 'wealthy': return <Castle className="w-4 h-4 text-yellow-400" />;
            default: return <Home className="w-4 h-4 text-[var(--text-muted)]" />;
        }
    };

    // Get business capacity
    const getBusinessCapacity = (business: any): [number, number] => {
        const maxCapacities: Record<string, number> = {
            'smithy': 3,
            'bakery': 2,
            'mill': 2,
            'tavern': 4,
            'shop': 2,
            'workshop': 3
        };
        const currentWorkers = (business.employees?.length || 0) + (business.ownerId ? 1 : 0);
        const maxCapacity = maxCapacities[business.type] || 1;
        return [currentWorkers, maxCapacity];
    };

    // Get activity status dot
    const getActivityDot = (activity: string): React.ReactNode => {
        const configs: Record<string, { color: string, pulse?: boolean }> = {
            'working': { color: 'bg-green-500', pulse: true },
            'commuting_to_work': { color: 'bg-yellow-500' },
            'commuting_home': { color: 'bg-orange-500' },
            'idle': { color: 'bg-[var(--surface-muted)]' },
            'sleeping': { color: 'bg-purple-500' },
            'wandering': { color: 'bg-blue-500' },
            'traveling': { color: 'bg-cyan-500' }
        };
        const config = configs[activity] || { color: 'bg-[var(--surface-muted)]' };
        return (
            <span className={`inline-block w-2 h-2 rounded-full ${config.color} ${config.pulse ? 'animate-pulse' : ''}`} />
        );
    };
    const { era, culturalZone, year, timeOfDay } = useMemo(() => {
        const parsed = parseDateString(mapData.timeSlice || '1650');
        
        // Use localArea for more specific cultural zone detection
        const localArea = mapData.localArea || '';
        let culture: CulturalZone;
        
        // Check for specific regions first
        if (localArea.toLowerCase().includes('moscow') || localArea.toLowerCase().includes('novgorod') || 
            localArea.toLowerCase().includes('kiev') || localArea.toLowerCase().includes('dnieper') ||
            localArea.toLowerCase().includes('volga') || localArea.toLowerCase().includes('poland') ||
            localArea.toLowerCase().includes('bohemia') || localArea.toLowerCase().includes('carpathian') ||
            localArea.toLowerCase().includes('thracian') || localArea.toLowerCase().includes('brandenburg')) {
            culture = 'SLAVIC' as CulturalZone;
        } else if (localArea.toLowerCase().includes('thebes') || localArea.toLowerCase().includes('nile') ||
                   localArea.toLowerCase().includes('alexandria') || localArea.toLowerCase().includes('cairo')) {
            culture = 'MENA' as CulturalZone;
        } else if (localArea.toLowerCase().includes('beijing') || localArea.toLowerCase().includes('yangtze') ||
                   localArea.toLowerCase().includes('yellow river') || localArea.toLowerCase().includes('han river')) {
            culture = 'EAST_ASIAN' as CulturalZone;
        } else {
            // Fallback to continent-based detection
            culture = mapLocationToCulture(mapData.continent || 'Europe', parsed.year);
        }
        
        let tod: TimeOfDay = 'Midday';
        if (gameTimeHours >= 5 && gameTimeHours < 8) tod = 'Dawn';
        else if (gameTimeHours >= 8 && gameTimeHours < 12) tod = 'Morning';
        else if (gameTimeHours >= 12 && gameTimeHours < 16) tod = 'Midday';
        else if (gameTimeHours >= 16 && gameTimeHours < 19) tod = 'Afternoon';
        else if (gameTimeHours >= 19 && gameTimeHours < 21) tod = 'Dusk';
        else tod = 'Night';

        return { era: parsed.era as HistoricalEra, culturalZone: culture, year: parsed.year, timeOfDay: tod };
    }, [mapData.timeSlice, mapData.continent, mapData.localArea, gameTimeHours]);
    
    // Handle NPC click for dialogue
    const handleNpcClick = useCallback(async (npc: any) => {
        // Clear previous dialogue
        if (selectedNpcId === npc.name) {
            // Clicking same NPC again - clear dialogue
            setDialogueVisible(false);
            setSelectedNpcId(null);
            clearPortrait();
            return;
        }
        
        setSelectedNpcId(npc.name);
        setDialogueLoading(true);
        setDialogueVisible(false);
        
        // Flash a greeting expression
        flashPortrait('smile');
        
        try {
            // Convert our settlement inhabitant to NPC format for dialogue service
            const npcEntity: NpcEntity = {
                id: `settlement-${npc.name}`,
                name: npc.name,
                age: npc.age,
                role: npc.profession,
                gender: npc.gender,
                wealthLevel: npc.wealthLevel || 'modest',
                culturalZone: npc.culturalZone || culturalZone,
                personality: 'friendly, welcoming',
                religion: 'local traditions',
                family: [],
                personalGoal: { description: `Work as a ${npc.profession}`, completed: false },
                attributes: [],
                reputation: 50,
                appearance: npc.appearance || {},
                stats: npc.stats || { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
                currentLocation: { x: tile.x, y: tile.y }
            };
            
            if (playerCharacter) {
                const context = createDialogueContext(mapData, {
                    isMarketplace: tile.biome === BiomeType.MARKETPLACE,
                    timeOfDay: timeOfDay.toLowerCase(),
                    season: season.toLowerCase(),
                    npc: npcEntity,
                    terrainStructures: terrainStructures || []
                });
                
                const response = await generateNpcGreeting(npcEntity, context, playerCharacter);
                setDialogueText(response.text);
                setDialogueVisible(true);
                
                // Auto-hide after 10 seconds
                setTimeout(() => {
                    setDialogueVisible(false);
                    setSelectedNpcId(null);
                }, 10000);
            } else {
                // Fallback without player character
                setDialogueText(`"Greetings, traveler. I am ${npc.name}, a ${npc.profession} in this settlement."`);
                setDialogueVisible(true);
                setTimeout(() => {
                    setDialogueVisible(false);
                    setSelectedNpcId(null);
                }, 10000);
            }
        } catch (error) {
            console.error('Failed to generate NPC dialogue:', error);
            setDialogueText(`"Good day to you."`);
            setDialogueVisible(true);
            setTimeout(() => {
                setDialogueVisible(false);
                setSelectedNpcId(null);
            }, 10000);
        } finally {
            setDialogueLoading(false);
        }
    }, [selectedNpcId, flashPortrait, clearPortrait, culturalZone, tile, timeOfDay, season, mapData, playerCharacter]);

    const { name, description, economicProfile, population, families, allegianceString, settlementProfessions, representativeInhabitants } = useMemo(() => {
        const noise = new ValueNoise(tile.x * 17 + tile.y * 31 + mapData.seed);
        const { majorCity } = mapData;
        
        // Generate contextual description based on actual map data
        const getSettlementDescription = () => {
            const biomeType = tile.biome;
            const regionName = mapData.localArea || mapData.mapAreaName || 'this region';
            
            // First check if tile has city description stored directly
            if (tile.cityDescription) {
                return tile.cityDescription;
            }
            
            // Check if there's a major city nearby
            let nearbyCity = '';
            if (mapData.majorCity && mapData.majorCity.name && biomeType !== BiomeType.CITY_CENTER) {
                nearbyCity = ` near ${mapData.majorCity.name}`;
            } else if (tile.cityName && biomeType !== BiomeType.CITY_CENTER) {
                nearbyCity = ` near ${tile.cityName}`;
            }
            
            // Get local economic focus
            let economicPrefix = '';
            if (details.settlementProfessions && details.settlementProfessions.length > 0) {
                const primaryProfession = details.settlementProfessions[0].toLowerCase();
                if (primaryProfession.includes('farmer') || primaryProfession.includes('shepherd')) {
                    economicPrefix = "Farming ";
                } else if (primaryProfession.includes('miner')) {
                    economicPrefix = "Mining ";
                } else if (primaryProfession.includes('logger') || primaryProfession.includes('woodcutter')) {
                    economicPrefix = "Logging ";
                } else if (primaryProfession.includes('fisher')) {
                    economicPrefix = "Fishing ";
                } else if (primaryProfession.includes('merchant') || primaryProfession.includes('trader')) {
                    economicPrefix = "Trading ";
                } else if (primaryProfession.includes('smith') || primaryProfession.includes('craftsman')) {
                    economicPrefix = "Crafting ";
                }
            }
            
            if (biomeType === BiomeType.HAMLET) {
                if (nearbyCity) {
                    return `${economicPrefix}hamlet${nearbyCity}`;
                }
                return `${economicPrefix}hamlet in ${regionName}`;
            } else if (biomeType === BiomeType.FARMLAND) {
                const cropType = tile.cropType || 'grain';
                if (nearbyCity) {
                    return `${cropType} farm${nearbyCity}`;
                }
                return `${cropType} farm in ${regionName}`;
            } else if (biomeType === BiomeType.MARKETPLACE) {
                if (nearbyCity) {
                    return `Market square${nearbyCity}`;
                }
                return `Market square in ${regionName}`;
            } else if (biomeType === BiomeType.LOW_DENSITY_CITY) {
                if (mapData.majorCity && mapData.majorCity.name) {
                    return `Outer district of ${mapData.majorCity.name}`;
                }
                return `Low density urban area in ${regionName}`;
            } else if (biomeType === BiomeType.DENSE_CITY) {
                if (mapData.majorCity && mapData.majorCity.name) {
                    return `Dense urban core of ${mapData.majorCity.name}`;
                }
                return `Dense urban area in ${regionName}`;
            } else if (biomeType === BiomeType.CITY_CENTER && mapData.majorCity) {
                return mapData.majorCity.description || `The heart of ${regionName}`;
            }
            return `Settlement in ${regionName}`;
        };

        const getSettlementName = () => {
            const biomeType = tile.biome;
            
            // First check if tile has city name stored directly
            if (tile.cityName) {
                return tile.cityName;
            }
            
            // For city centers, use the actual city name from majorCity
            if (biomeType === BiomeType.CITY_CENTER && majorCity) {
                return majorCity.name;
            }
            
            // For other settlement types, use descriptive names
            if (biomeType === BiomeType.HAMLET) {
                return 'Hamlet';
            } else if (biomeType === BiomeType.FARMLAND) {
                return 'Farm';
            } else if (biomeType === BiomeType.MARKETPLACE) {
                return 'Marketplace';
            } else if (biomeType === BiomeType.LOW_DENSITY_CITY) {
                return 'Outer City';
            } else if (biomeType === BiomeType.DENSE_CITY) {
                return 'City Center';
            }
            
            // Fallback - capitalize and clean up biome name
            return biomeType.replace(/_/g, ' ').toLowerCase()
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        };

        let details = {
            name: '',
            description: '',
            population: tile.population || 0,
            economicProfile: ['Subsistence living'],
            families: [] as string[],
            allegianceString: 'Unaligned',
            settlementProfessions: [] as string[],
            representativeInhabitants: [] as any[]
        };
        
        // Economy - Get professions first so we can use them in the description
        details.settlementProfessions = getSettlementProfessions(tile, mapData, culturalZone, era);
        
        // Now set name and description after we have professions
        details.name = getSettlementName();
        details.description = getSettlementDescription();
        if (details.settlementProfessions.length > 0) {
            details.economicProfile = [`Primary professions: ${details.settlementProfessions.slice(0,3).join(', ')}.`];
        } else {
            details.economicProfile = ['Primarily subsistence agriculture.'];
        }

        // Families
        let singleFamilyName: string | null = null;
        if (tile.biome === BiomeType.FARMLAND) {
            // Use farmService for farms to ensure consistency
            const farmState = getFarmState(tile, mapData, npcs);
            singleFamilyName = farmState.family.familyName.replace(' Family', '');
        }

        if(details.population > 0 && !singleFamilyName){
            const familyCount = Math.max(1, Math.floor(details.population / (8 + noise.random() * 8)));
            for (let i = 0; i < familyCount; i++) {
                const familyName = generateNpcName('Male', culturalZone, undefined, year, noise).split(' ')[1];
                if (familyName) details.families.push(familyName);
            }
            details.families = [...new Set(details.families)].slice(0, 3);
        } else if (singleFamilyName) {
            details.families = [singleFamilyName];
        }
        
        // Allegiance
        const dominantFactionKey = mapData.majorCity?.allegiance || 'Local Authorities';
        const loyalty = tile.allegianceBreakdown?.[dominantFactionKey] ?? (Object.values(tile.allegianceBreakdown || {})[0] || 0);
        
        if (loyalty > 0.9) details.allegianceString = `Staunchly loyal to ${dominantFactionKey}`;
        else if (loyalty > 0.7) details.allegianceString = `Strongly aligned with ${dominantFactionKey}`;
        else if (loyalty > 0.5) details.allegianceString = `Generally loyal to ${dominantFactionKey}`;
        else if (loyalty > 0.3) details.allegianceString = `Questionable loyalty to ${dominantFactionKey}`;
        else details.allegianceString = `Has strong dissenting elements`;
        
        // Inhabitants - Always generate them for settlements with population
        if(details.population > 0 || tile.biome === BiomeType.FARMLAND) {
             // Special handling for farms - use farmService data
             if (tile.biome === BiomeType.FARMLAND) {
                 const farmState = getFarmState(tile, mapData, npcs);
                 
                 // Convert farm family members to representative inhabitants
                 farmState.family.members.slice(0, 4).forEach(member => {
                     // For stats, use member's skills if available or generate new ones
                     const baseProfile = generateBaseProfile(noise, { era, culturalZone, region: mapData.localArea || '' });
                     const { socialClass } = determineSocialRole(
                         baseProfile, 
                         { 
                             era, 
                             culturalZone,
                             region: mapData.localArea || '',
                             citySize: tile.citySize
                         }, 
                         member.role,
                         tile.structureType
                     );
                     
                     details.representativeInhabitants.push({ 
                         name: member.name, 
                         age: member.age, 
                         profession: member.role, 
                         gender: member.gender as Gender, 
                         wealthLevel: 'modest',
                         portraitSeed: noise.random() * 1000000,
                         appearance: member.appearance,
                         stats: baseProfile.stats,
                         era: baseProfile.era,
                         culturalZone: baseProfile.culturalZone,
                         class: socialClass,
                         diseaseStatus: null
                     });
                 });
                 
                 details.settlementProfessions = farmState.family.members.map(m => m.role);
             } else {
                 // Original code for non-farm settlements
                 const numInhabitants = 4;
                 // Use settlement professions if available, otherwise use generic ones
                 if (details.settlementProfessions.length === 0) {
                     // Fallback professions based on biome type and era
                     if (tile.biome === BiomeType.MARKETPLACE) {
                         details.settlementProfessions = ['Merchant', 'Trader', 'Craftsman', 'Guard'];
                     } else if (tile.biome === BiomeType.HAMLET) {
                         details.settlementProfessions = ['Farmer', 'Blacksmith', 'Carpenter', 'Laborer'];
                     } else {
                         details.settlementProfessions = ['Artisan', 'Merchant', 'Scholar', 'Guard'];
                     }
                 }
                 
                 for (let i = 0; i < numInhabitants; i++) {
                    const gender = noise.random() > 0.5 ? 'Male' as Gender : 'Female' as Gender;
                    let fullName: string;
                    
                    // Use family names from the families array if available
                    const familyName = details.families.length > 0 
                        ? details.families[i % details.families.length]
                        : singleFamilyName;
                        
                    if (familyName) {
                        const firstName = generateNpcName(gender, culturalZone, undefined, year, noise).split(' ')[0];
                        fullName = `${firstName} ${familyName}`;
                    } else {
                        fullName = generateNpcName(gender, culturalZone, undefined, year, noise);
                    }
                    
                    const age = 18 + Math.floor(noise.random() * 55);
                    const profession = details.settlementProfessions[i % details.settlementProfessions.length];
                    const wealth = i % 3 === 0 ? 'comfortable' : 'modest';

                    const baseProfile = generateBaseProfile(noise, { era, culturalZone, region: mapData.localArea || '' });
                    const { socialClass } = determineSocialRole(
                        baseProfile, 
                        { 
                            era, 
                            culturalZone,
                            region: mapData.localArea || '',
                            citySize: tile.citySize
                        }, 
                        profession,
                        tile.structureType
                    );
                    
                    // Add disease with 33% chance
                    let diseaseStatus = null;
                    if (Math.random() < 0.33) {
                        diseaseStatus = 'Common Cold'; // Simplified for representative inhabitants
                    }
                    
                    details.representativeInhabitants.push({ 
                        name: fullName, 
                        age, 
                        profession, 
                        gender, 
                        wealthLevel: wealth,
                        portraitSeed: noise.random() * 1000000,
                        appearance: baseProfile.appearance,
                        stats: baseProfile.stats,
                        era: baseProfile.era,
                        culturalZone: baseProfile.culturalZone,
                        class: socialClass,
                        diseaseStatus
                    });
                }
             }
        }
        
        return details;
    }, [tile, mapData, culturalZone, era, year]);
    
    const bannerProps = useMemo(() => {
        return {
            era, culturalZone,
            condition: (population > 100 ? 'prosperous' : 'humble') as Condition,
            climate: mapData.climate,
            season: season,
            seed: mapData.seed,
            timeOfDay,
            mapData
        };
    }, [era, culturalZone, population, mapData, season, timeOfDay]);

    const getBuildingTypeForLogging = () => {
        if (tile.biome === BiomeType.FARMLAND) return 'FarmBanner';
        if (tile.biome === BiomeType.MARKETPLACE) return 'MarketplaceBanner';
        if ([BiomeType.HAMLET, BiomeType.LOW_DENSITY_CITY, BiomeType.DENSE_CITY, BiomeType.CITY_CENTER].includes(tile.biome)) {
            // For urban areas, we need to approximate the building type based on cultural zone and era
            // This mirrors the logic in UrbanSymbol.tsx
            const { year, era: eraName } = useMemo(() => parseDateString(mapData.timeSlice || '1650'), [mapData.timeSlice]);
            const eraLevel = eraName === 'Prehistoric' ? 0 : eraName === 'Ancient' ? 1 : eraName === 'Classical' ? 2 : eraName === 'Medieval' ? 3 : eraName === 'Early Modern' ? 4 : eraName === 'Modern' ? 5 : 6;
            
            if (eraLevel === 0) return 'PrehistoricShelter3D';
            if (eraLevel >= 6) return 'ModernSkyscraper3D';
            if (eraLevel === 5) return 'ModernCivic3D';
            
            switch(culturalZone) {
                case 'SUB_SAHARAN_AFRICAN': return eraLevel >= 3 ? 'AfricanStoneBuilding3D' : 'AfricanRoundHut3D';
                case 'EAST_ASIAN': return 'EastAsianPagoda3D';
                case 'SOUTH_ASIAN': return 'SouthAsianTemple3D';
                case 'MENA': return 'OttomanTownhouse3D';
                case 'OCEANIA': return 'PolynesianHouse3D';
                case 'NORTH_AMERICAN_PRE_COLUMBIAN': return 'BarkLonghouse3D';
                case 'SOUTH_AMERICAN': return 'AztecDwelling3D';
                default: return eraLevel >= 3 ? 'GeorgianRowhouse3D' : 'MedievalBuilding3D';
            }
        }
        return 'GenericBuilding';
    };

    const renderBanner = () => {
        switch(tile.biome) {
            case BiomeType.FARMLAND:
                return <FarmBanner {...bannerProps} cropType={tile.cropType || 'Wheat'} height={240} />;
            case BiomeType.MARKETPLACE:
                return <MarketplaceBanner {...bannerProps} height={260} tile={tile} mapData={mapData} />;
            case BiomeType.HAMLET:
            case BiomeType.LOW_DENSITY_CITY:
            case BiomeType.DENSE_CITY:
            case BiomeType.CITY_CENTER:
                 return <CityBanner {...bannerProps} size={population > 500 ? 'big_city' : 'smaller_city'} height={240} aiGeneratedImageUrl={cachedCityImage} />;
            default:
                return <div className="w-full h-[150px] bg-[var(--surface-muted)]" />;
        }
    };
    

    return (
        <div
            data-surface="modal-overlay"
            className="modal-overlay theme-surface"
            onClick={onClose}
        >
            <div
                data-surface="modal-panel"
                className="theme-surface bg-modal-bg-gradient border border-[var(--border-normal)] rounded-2xl shadow-glow-primary-lg w-full max-w-4xl flex flex-col animate-popIn"
                style={{maxHeight: '90vh'}}
                onClick={e => e.stopPropagation()}
            >
                 <header className="relative w-full h-[260px] rounded-t-xl overflow-hidden shrink-0">
                    {renderBanner()}
                    <div className="absolute inset-0 bg-gradient-to-t to-transparent"
                        style={{ background: 'linear-gradient(to top, var(--bg-primary) 0%, transparent 100%)' }}></div>

                    {/* Overlaid information on banner - styled like MarketplaceModal */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="flex items-end justify-between">
                            <div className="flex-1">
                                <h2 className="text-3xl font-bold text-white mb-1" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                                    {name}
                                </h2>
                                <p className="text-sm text-[var(--text-secondary)] italic mb-2" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>
                                    {description}
                                </p>
                                {/* Key stats in banner */}
                                <div className="flex flex-wrap gap-4 text-sm">
                                    <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2 py-1 rounded">
                                        <Users className="w-4 h-4 text-amber-400" />
                                        <span className="text-white font-medium">{population} residents</span>
                                    </div>
                                    {businesses.length > 0 && (
                                        <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2 py-1 rounded">
                                            <Store className="w-4 h-4 text-green-600 dark:text-green-400" />
                                            <span className="text-white font-medium">
                                                {businesses.filter(b => isBusinessOpen(b)).length}/{businesses.length} shops open
                                            </span>
                                        </div>
                                    )}
                                    {allegianceString !== 'Unaligned' && (
                                        <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2 py-1 rounded">
                                            <Building2 className="w-4 h-4 text-purple-400" />
                                            <span className="text-white font-medium">{allegianceString}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-black/50 text-white rounded-full hover:bg-red-600/80 transition-colors backdrop-blur-sm"
                    >
                        ×
                    </button>
                </header>

                {/* Tabs */}
                <div className="flex border-b border-[var(--border-normal)] bg-[var(--surface-muted-bg)]">
                    <button
                        className={`px-4 py-2 font-semibold transition-colors ${
                            activeTab === 'overview'
                                ? 'text-amber-600 dark:text-amber-600 dark:text-amber-300 border-b-2 border-amber-600 dark:border-amber-300'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                        }`}
                        onClick={() => setActiveTab('overview')}
                    >
                        Overview
                    </button>
                    <button
                        className={`px-4 py-2 font-semibold transition-colors ${
                            activeTab === 'residents'
                                ? 'text-amber-600 dark:text-amber-600 dark:text-amber-300 border-b-2 border-amber-600 dark:border-amber-300'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                        }`}
                        onClick={() => setActiveTab('residents')}
                    >
                        Residents ({residents.length || representativeInhabitants.length})
                    </button>
                    <button
                        className={`px-4 py-2 font-semibold transition-colors ${
                            activeTab === 'businesses'
                                ? 'text-amber-600 dark:text-amber-600 dark:text-amber-300 border-b-2 border-amber-600 dark:border-amber-300'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                        }`}
                        onClick={() => setActiveTab('businesses')}
                    >
                        Businesses ({businesses.length})
                    </button>
                </div>

                {/* Tab Content */}
                <div className="p-5 flex-grow overflow-y-auto scrollbar-thin text-sm">
                    {activeTab === 'overview' && (
                        <div className="space-y-4">
                            {/* Responsive two-column layout for businesses and residents */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Active Businesses */}
                                <div className="p-4 bg-gradient-to-br from-green-900/30 to-emerald-900/20 border border-green-700/50 rounded-lg">
                                    <h4 className="font-semibold text-base text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
                                        <Store className="w-4 h-4" />
                                        Local Businesses
                                        {businesses.filter(b => isBusinessOpen(b)).length > 0 && (
                                            <span className="ml-auto text-xs font-normal text-green-600 dark:text-green-300 bg-green-900/50 px-2 py-0.5 rounded-full">
                                                {businesses.filter(b => isBusinessOpen(b)).length} open
                                            </span>
                                        )}
                                    </h4>
                                    {businesses.length === 0 ? (
                                        <div className="text-center py-4 text-[var(--text-muted)]">
                                            <Building2 className="w-8 h-8 mx-auto opacity-30 mb-2" />
                                            <p className="text-xs">No businesses in this area</p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-2">
                                            {businesses.slice(0, 3).map((business: any, idx: number) => {
                                                const isOpen = isBusinessOpen(business);
                                                const [current, max] = getBusinessCapacity(business);
                                                const supplyChain = getSupplyChain(business.type);
                                                return (
                                                    <div key={idx}>
                                                        <div
                                                            className={`group cursor-pointer transition-all hover:scale-[1.02] flex items-center justify-between p-2 rounded ${
                                                                isOpen
                                                                    ? 'bg-green-900/30 border border-green-700/30 hover:bg-green-900/40'
                                                                    : 'bg-[var(--surface-muted-bg)] border border-[var(--border-normal)]/30 hover:bg-[var(--surface-muted-bg)]'
                                                            }`}
                                                            onClick={() => setActiveTab('businesses')}
                                                        >
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <CircleDot className={`w-3 h-3 shrink-0 ${
                                                                    isOpen ? 'text-green-600 dark:text-green-400 animate-pulse' : 'text-[var(--text-muted)]'
                                                                }`} />
                                                                <div className="min-w-0">
                                                                    <p className="font-medium text-[var(--text-primary)] text-sm truncate">{business.name}</p>
                                                                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                                                                        <span className="truncate">
                                                                            {business.type.replace(/_/g, ' ').toLowerCase()}
                                                                        </span>
                                                                        <span className="text-[var(--text-muted)]">•</span>
                                                                        <span className="text-[var(--text-muted)]">
                                                                            {current}/{max} workers
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-xs text-[var(--text-muted)] shrink-0 ml-2">
                                                                {business.openHours ? `${business.openHours[0]}-${business.openHours[1]}h` : '—'}
                                                            </div>
                                                        </div>
                                                        {/* Supply Chain Visualization */}
                                                        {supplyChain.steps.length > 0 && (
                                                            <div className="ml-4 mt-1 flex items-center gap-1 text-xs text-[var(--text-muted)]">
                                                                {supplyChain.steps.map((step, i) => (
                                                                    <React.Fragment key={i}>
                                                                        <div className="flex items-center gap-1">
                                                                            <span className="text-[var(--text-muted)]">{supplyChain.icons[i]}</span>
                                                                            <span className="text-[10px]">{step}</span>
                                                                        </div>
                                                                        {i < supplyChain.steps.length - 1 && (
                                                                            <ArrowRight className="w-3 h-3 text-[var(--text-muted)]" />
                                                                        )}
                                                                    </React.Fragment>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            {businesses.length > 3 && (
                                                <button
                                                    onClick={() => setActiveTab('businesses')}
                                                    className="text-xs text-green-600 dark:text-green-400 hover:text-green-600 dark:text-green-300 italic text-center py-1 transition-colors"
                                                >
                                                    +{businesses.length - 3} more →
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Current Residents Summary */}
                                <div className="p-4 bg-gradient-to-br from-blue-900/30 to-indigo-900/20 border border-blue-700/50 rounded-lg">
                                    <h4 className="font-semibold text-base text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        Current Residents
                                        <span className="ml-auto text-xs font-normal text-blue-600 dark:text-blue-300 bg-blue-900/50 px-2 py-0.5 rounded-full">
                                            {residents.length || representativeInhabitants.length} here
                                        </span>
                                    </h4>
                                    {residents.length === 0 && representativeInhabitants.length === 0 ? (
                                        <div className="text-center py-4 text-[var(--text-muted)]">
                                            <User className="w-8 h-8 mx-auto opacity-30 mb-2" />
                                            <p className="text-xs">No residents visible</p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-2">
                                            {(residents.length > 0 ? residents : representativeInhabitants).slice(0, 3).map((person: any, idx: number) => {
                                                const npc = person as NpcEntity;
                                                const workProgress = npc.activity ? getWorkProgress(npc) : 0;
                                                const hasWork = workProgress > 0;
                                                const status = npc.activity ? getActivityStatus(npc) : 'Active';
                                                const statusText = status.replace(/[^\w\s]/g, '').trim();
                                                return (
                                                    <div key={idx}>
                                                        <div
                                                            className="group cursor-pointer transition-all hover:scale-[1.02] flex items-center justify-between p-2 bg-[var(--surface-muted-bg)] rounded border border-[var(--border-normal)]/30 hover:bg-[var(--surface-muted-bg)]"
                                                            onClick={() => setActiveTab('residents')}
                                                        >
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                {/* Activity status dot */}
                                                                {npc.activity && getActivityDot(npc.activity)}
                                                                <User className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="font-medium text-[var(--text-primary)] text-sm truncate">{person.name}</p>
                                                                    <p className="text-xs text-[var(--text-muted)] truncate">
                                                                        {person.profession || person.role}
                                                                    </p>
                                                                    {/* Work progress bar */}
                                                                    {hasWork && (
                                                                        <div className="mt-1 h-1 bg-[var(--surface-muted-bg)] rounded-full overflow-hidden">
                                                                            <div
                                                                                className="h-full bg-green-500/70 transition-all duration-300"
                                                                                style={{ width: `${workProgress}%` }}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="text-xs text-[var(--text-muted)] shrink-0 ml-2">
                                                                {statusText}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {(residents.length > 3 || representativeInhabitants.length > 3) && (
                                                <button
                                                    onClick={() => setActiveTab('residents')}
                                                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-600 dark:text-blue-300 italic text-center py-1 transition-colors"
                                                >
                                                    View all →
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Compact info blocks in a grid */}
                            <div className="grid grid-cols-2 gap-3">
                                {/* Religious makeup */}
                                {tile.dominantReligions && tile.dominantReligions.length > 0 && (
                                    <div className="p-3 bg-[var(--surface-muted-bg)] border border-[var(--border-normal)] rounded-lg">
                                        <h5 className="text-sm font-semibold text-amber-600 dark:text-amber-300 mb-2">Faith</h5>
                                        <div className="space-y-1">
                                            {tile.dominantReligions.slice(0, 2).map((r: any) => (
                                                <div key={r.name} className="text-xs">
                                                    <span className="text-[var(--text-muted)]">{r.name}:</span>
                                                    <span className="text-[var(--text-primary)] ml-1">{Math.round(r.percentage * 100)}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Prominent families */}
                                {families.length > 0 && (
                                    <div className="p-3 bg-[var(--surface-muted-bg)] border border-[var(--border-normal)] rounded-lg">
                                        <h5 className="text-sm font-semibold text-purple-600 dark:text-purple-300 mb-2">Families</h5>
                                        <p className="text-xs text-[var(--text-primary)]">{families.slice(0, 3).join(', ')}</p>
                                    </div>
                                )}

                                {/* Economic focus */}
                                <div className="p-3 bg-[var(--surface-muted-bg)] border border-[var(--border-normal)] rounded-lg">
                                    <h5 className="text-sm font-semibold text-green-600 dark:text-green-300 mb-2">Economy</h5>
                                    <p className="text-xs text-[var(--text-primary)]">
                                        {settlementProfessions.slice(0, 2).join(', ') || 'Subsistence'}
                                    </p>
                                </div>

                                {/* Housing summary */}
                                {tileData?.residences && tileData.residences.length > 0 && (
                                    <div className="p-3 bg-[var(--surface-muted-bg)] border border-[var(--border-normal)] rounded-lg">
                                        <h5 className="text-sm font-semibold text-cyan-300 mb-2 flex items-center gap-2">
                                            <HomeIcon className="w-4 h-4" />
                                            Housing
                                        </h5>
                                        <div className="space-y-1">
                                            {Object.entries(
                                                tileData.residences.reduce((acc: any, r: any) => {
                                                    acc[r.wealthLevel] = (acc[r.wealthLevel] || 0) + 1;
                                                    return acc;
                                                }, {})
                                            ).map(([wealth, count]: [string, any]) => (
                                                <div key={wealth} className="flex items-center gap-2 text-xs">
                                                    {getHousingIcon(wealth)}
                                                    <span className="text-[var(--text-muted)] capitalize">{wealth}:</span>
                                                    <span className="text-[var(--text-primary)]">{count}</span>
                                                </div>
                                            ))}
                                            <div className="text-xs text-[var(--text-muted)] mt-1">
                                                {tileData.residences.reduce((sum: number, r: any) => sum + r.occupants.length, 0)} total residents
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'residents' && (
                        <div className="space-y-3">
                            {residents.length > 0 ? (
                                // Show actual NPCs with activity status
                                residents.map(npc => (
                                    <div key={npc.id} className="bg-[var(--surface-muted-bg)] p-3 rounded-lg">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl">{npc.emoji}</span>
                                                <span className="font-semibold text-[var(--text-primary)]">{npc.name}</span>
                                            </div>
                                            <span className="text-sm text-[var(--text-muted)]">{getActivityStatus(npc)}</span>
                                        </div>
                                        <div className="text-sm text-[var(--text-secondary)]">
                                            {npc.profession || npc.role}
                                        </div>
                                        {npc.workplaceName && (
                                            <div className="text-xs text-[var(--text-muted)] mt-1">
                                                Works at: {npc.workplaceName}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : representativeInhabitants.length > 0 ? (
                                // Fallback to representative inhabitants if no actual NPCs
                                <div className="space-y-3">
                                    <p className="text-[var(--text-muted)] italic text-sm">Showing representative inhabitants (NPCs not currently loaded)</p>
                                    {representativeInhabitants.map((p, i) => {
                                        const isSelected = selectedNpcId === p.name;
                                        return (
                                            <div
                                                key={i}
                                                className={`bg-[var(--surface-muted-bg)] p-3 rounded-md flex items-center gap-4 border transition-all cursor-pointer hover:bg-[var(--surface-muted-bg)] hover:border-cyan-400/50 ${
                                                    isSelected
                                                        ? 'border-cyan-400 bg-[var(--surface-muted-bg)] shadow-cyan-400/25 shadow-md'
                                                        : 'border-[var(--border-normal)]'
                                                }`}
                                                onClick={() => handleNpcClick(p)}
                                                title="Click to speak with this person"
                                            >
                                                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[var(--border-normal)] shrink-0 bg-[var(--surface-muted)]">
                                                    <ProceduralPortrait
                                                        character={p as any}
                                                        size={64}
                                                        temporaryExpression={isSelected ? portraitExpr : null}
                                                        onExpressionComplete={clearPortrait}
                                                    />
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-bold text-sm text-[var(--text-primary)]">{p.name}</p>
                                                    <p className="text-xs text-[var(--text-muted)]">{p.age}, {p.profession}</p>
                                                    {p.diseaseStatus && (
                                                        <p className="text-xs text-orange-500 font-medium">
                                                            {typeof p.diseaseStatus === 'string'
                                                                ? p.diseaseStatus
                                                                : p.diseaseStatus.currentDiseases?.length > 0
                                                                    ? p.diseaseStatus.currentDiseases.join(', ')
                                                                    : null}
                                                        </p>
                                                    )}
                                                    {dialogueLoading && isSelected && (
                                                        <p className="text-xs text-cyan-400 animate-pulse">Speaking...</p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {/* Dialogue Display Area */}
                                    {dialogueVisible && dialogueText && (
                                        <div className={`mt-4 p-4 bg-gradient-to-r from-amber-900/30 to-orange-900/30 border border-amber-700/50 rounded-lg transition-all duration-500 ${
                                            dialogueVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-2'
                                        }`}>
                                            <div className="flex items-start gap-3">
                                                <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 animate-pulse"></div>
                                                <div className="text-[var(--text-primary)] text-sm leading-relaxed italic">
                                                    "{dialogueText}"
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-[var(--text-muted)] italic">No known residents in this area</p>
                            )}
                        </div>
                    )}

                    {activeTab === 'businesses' && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                                    <Store className="w-5 h-5 text-amber-400" />
                                    Local Businesses
                                </h3>
                                <span className="text-sm text-[var(--text-muted)] bg-black/40 px-2 py-1 rounded">
                                    {businesses.filter(b => isBusinessOpen(b)).length}/{businesses.length} open
                                </span>
                            </div>
                            {businesses.length === 0 ? (
                                <div className="text-center py-8 text-[var(--text-muted)]">
                                    <Store className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p className="italic">No businesses in this area</p>
                                </div>
                            ) : (
                                businesses.map((business: any, idx: number) => {
                                    const isOpen = isBusinessOpen(business);
                                    const [current, max] = getBusinessCapacity(business);
                                    const supplyChain = getSupplyChain(business.type);

                                    return (
                                        <div key={idx} className="bg-[var(--surface-muted-bg)] p-4 rounded-lg border border-[var(--border-normal)]/30">
                                            {/* Business Header */}
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Store className="w-5 h-5 text-amber-400" />
                                                    <span className="font-semibold text-[var(--text-primary)] text-lg">{business.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <CircleDot className={`w-4 h-4 ${
                                                        isOpen ? 'text-green-600 dark:text-green-400 animate-pulse' : 'text-red-400'
                                                    }`} />
                                                    <span className={`text-sm font-medium ${
                                                        isOpen ? 'text-green-600 dark:text-green-400' : 'text-red-400'
                                                    }`}>
                                                        {isOpen ? 'Open' : 'Closed'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Business Details */}
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-4 text-sm">
                                                    <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                                                        <Building2 className="w-3 h-3 text-[var(--text-muted)]" />
                                                        <span>Type:</span>
                                                        <span className="text-[var(--text-primary)]">{business.type.replace(/_/g, ' ').toLowerCase()}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                                                        <Users className="w-3 h-3 text-[var(--text-muted)]" />
                                                        <span>Workers:</span>
                                                        <span className={`text-[var(--text-primary)] ${
                                                            current >= max ? 'text-amber-600 dark:text-amber-400' : ''
                                                        }`}>{current}/{max}</span>
                                                    </div>
                                                </div>

                                                {business.owner && (
                                                    <div className="flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
                                                        <User className="w-3 h-3" />
                                                        <span>Owner: {business.owner}</span>
                                                    </div>
                                                )}

                                                {business.openHours && (
                                                    <div className="flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
                                                        <Clock className="w-3 h-3" />
                                                        <span>Hours: {business.openHours[0]}:00 - {business.openHours[1]}:00</span>
                                                    </div>
                                                )}

                                                {/* Supply Chain Visualization */}
                                                {supplyChain.steps.length > 0 && (
                                                    <div className="mt-3 p-2 bg-[var(--surface-muted-bg)] rounded">
                                                        <p className="text-xs text-[var(--text-muted)] mb-1.5">Supply Chain:</p>
                                                        <div className="flex items-center gap-2">
                                                            {supplyChain.steps.map((step, i) => (
                                                                <React.Fragment key={i}>
                                                                    <div className="flex items-center gap-1">
                                                                        <span className="text-[var(--text-muted)]">{supplyChain.icons[i]}</span>
                                                                        <span className="text-sm text-[var(--text-primary)]">{step}</span>
                                                                    </div>
                                                                    {i < supplyChain.steps.length - 1 && (
                                                                        <ArrowRight className="w-4 h-4 text-[var(--text-muted)]" />
                                                                    )}
                                                                </React.Fragment>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
                
                <footer className="mt-auto pt-4 border-t border-blue-500/30 flex justify-end p-4 rounded-b-xl"
                    style={{ backgroundColor: 'var(--surface-elevated)' }}>
                    <button onClick={onClose} className="ff-action-button">Close</button>
                </footer>
            </div>
        </div>
    );
};

export default SettlementInfoModal;
