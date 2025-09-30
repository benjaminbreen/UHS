/**
 * components/MapViewport.tsx - Encapsulates the main content area including map displays.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './TopNavBarPolished.css'; // Import for map fade animations
import { useUI } from '../contexts/UIContext';
import { useMap } from '../contexts/MapContext';
import { usePlayer } from '../contexts/PlayerContext';
import { useGame } from '../contexts/GameContext';
import { useEventSystem } from '../hooks/useEventSystem';
import { SpecialMapConfig, SpecialMapArchetype } from '../types/specialMapTypes';
import { MapDisplayOptimized } from './MapDisplayOptimized';
import { InteriorMapDisplay } from './interiorMap';
import BeautifulInteriorMapDisplay from './interiorMap/BeautifulInteriorMapDisplay';
import CampModal from './CampModal';
import PlayerTooltip from './PlayerTooltip';
import { HelperModeNotification } from './HelperModeNotification';
import { useHelperNpcMovement } from '../hooks/useHelperNpcMovement';
import gameSoundsService from '../services/gameSoundsService';
import AmbianceDisplay from './AmbianceDisplay';
import BottomPanel from './BottomPanel';
import NewItemModal from './NewItemModal';
import FarmPanel from './FarmPanel';
import MarketplaceModal from './MarketplaceModal';
import CityModal from './CityModal';
import RuinStructureModal from './RuinStructureModal';
import GovernmentDistrictModal from './GovernmentDistrictModal';
import FishingHutModal from './FishingHutModal';
import MiningRoguelikeDisplay from './MiningRoguelikeDisplay';
import { DevTooltipDisplayData, Tile, PlayerCharacter, BiomeType, DeployedVessel, TimeOfDay, HistoricalEra } from '../types';
import { getHistoricalPeriod } from '../constants/characterData/names';
import TimeAwareBackground from './TimeAwareBackground';
import HorizonLayer from './HorizonLayer';
import CloudSystem from './CloudSystem';
import WeatherEffects from './WeatherEffects';
import CelestialBodies from './CelestialBodies';
import SpecialMapBackground from './SpecialMapBackground';
import InteriorHorizon from './InteriorHorizon';
import SpecialMapLocationDisplay from './SpecialMapLocationDisplay';
import { useSpecialMapLocation } from '../hooks/useSpecialMapLocation';
import { useSpecialMapNpcBehavior } from '../hooks/useSpecialMapNpcBehavior';
import POVViewport from './POVViewport';
import { useSpecialMapItemCollection } from '../hooks/useSpecialMapItemCollection';
import { useInventoryToast } from '../hooks/useInventoryToast';
import InventoryToast from './ui/InventoryToast';
import { useReputationSystem } from '../hooks/useReputationSystem';
import ReputationNotification from './ui/ReputationNotification';
import NpcConfrontationModal from './NpcConfrontationModal';
import { processNpcReactions } from '../services/npcAwarenessService';
import { SpecialMapData } from '../types/specialMapTypes';
import GuardWarningBox from './GuardWarningBox';
import NpcAlertIndicator from './NpcAlertIndicator';
import { eventBus } from '../services/eventBus';
import { isGuardType } from '../services/specialMapNpcBehaviorService';
import { guardPermissionService } from '../services/guardPermissionService';
import { weatherService } from '../services/weatherService';
import { MAP_WIDTH_TILES, MAP_HEIGHT_TILES } from '../constants';
import { useDeviceDetection } from '../utils/deviceUtils';
import { useWeatherEffects } from '../hooks/useWeatherEffects';
import { poiDescriptionService } from '../services/poiDescriptionService';
import { poiDialogueService } from '../services/poiDialogueService';
import { getDayOfYear } from '../utils/dateUtils';

type ActivePanel = 'farm' | null;

interface MapViewportProps {
  mapVisible?: boolean;
  isProcessingWorldWeaver?: boolean;
  onPlayerDeath?: (deathInfo: any) => void;
  className?: string;
}

const MapViewport: React.FC<MapViewportProps> = ({ mapVisible = true, isProcessingWorldWeaver = false, onPlayerDeath, className }) => {
    const {
        handleDevHover, setTileInfoModalProps, setStructureModalTarget, setActiveSettlementInfo,
        activeLens, infoModalTarget, panelNotificationItem, setPanelNotificationItem, toastMessage, setToastMessage,
        activeMarketplaceModal, setActiveMarketplaceModal, activeCityModal, setActiveCityModal,
        activeRuinModal, setActiveRuinModal, activeGovernmentModal, setActiveGovernmentModal, activeFishingHutModal, setActiveFishingHutModal, inRuinRoguelike, setInRuinRoguelike, inMiningRoguelike, setInMiningRoguelike, miningRoguelikeData, setMiningRoguelikeData, useLlmForDescriptions, handleEncounter, setInfoModalTarget, showToast,
        setActiveMiningModal, setActivePoi, debugSettings,
        poiToastData, setPoiToastData,
        handleCompanionClick, handlePlayerClick, handleNewAreaEntry, setContainerModalData,
        onUseSkill
    } = useUI();
    
    const [isMapTransitioning, setIsMapTransitioning] = useState(false);

    const {
        currentWorldCoords, mapData, currentMapSeed,
        visibleAnimals, visibleNpcs, deployedVessels, mapAnalysisData,
        enterSpecialMap, exitSpecialMap, isSpecialMap,
        addPersistedMerchant, setNpcs,
    } = useMap();

    const {
        playerCharacter, controlledIconX, controlledIconY, onIconAnimationComplete,
        playerMode, setPlayerMode, shipDockX, shipDockY, iconRotation, velocity, currentVessel,
        interiorViewState, interiorMapPlayerPos, onPlayerMove,
        handleExitInteriorView, handleEntityInteraction,
        onEnterBuilding, onBuyItem, onSellItem, viewMode,
        addItemsToInventory, setPlayerCharacter
    } = usePlayer();

    const { 
        sunPosition, currentTimeOfDay, formattedDate, season, ambianceText,
        actionableTile, contextualMessage, gameTimeHours, gameTimeMinutes,
        isLoading, isLoadingFromCache, setGameDate, gameDate, currentRegion,
        currentZone, gameLog
    } = useGame();
    
    // Calculate current era from formatted date
    const currentEra = (() => {
        // Parse year from formatted date like "June 3, 238 BC" or "June 3, 1500 CE"
        const yearMatch = formattedDate.match(/(\d+)\s*(BC|BCE|AD|CE)?/);
        let year = yearMatch ? parseInt(yearMatch[1]) : 0;
        if (yearMatch && (yearMatch[2] === 'BC' || yearMatch[2] === 'BCE')) {
            year = -year;
        }
        if (year < 500) return HistoricalEra.ANTIQUITY;
        if (year < 1450) return HistoricalEra.MEDIEVAL; 
        if (year < 1800) return HistoricalEra.RENAISSANCE_EARLY_MODERN;
        if (year < 1900) return HistoricalEra.INDUSTRIAL_ERA;
        return HistoricalEra.MODERN_ERA;
    })();
    
    // Convert currentZone string to CulturalZone type
    const currentCulturalZone = (() => {
        // First check if currentZone is already a CulturalZone enum value
        const culturalZoneValues = [
            'EUROPEAN', 'EAST_ASIAN', 'MENA', 
            'NORTH_AMERICAN_PRE_COLUMBIAN', 'NORTH_AMERICAN_COLONIAL',
            'OCEANIA', 'SOUTH_ASIAN', 'SOUTH_AMERICAN', 'SUB_SAHARAN_AFRICAN'
        ];
        
        // If it's already a CulturalZone value, use it directly
        if (culturalZoneValues.includes(currentZone)) {
            return currentZone;
        }
        
        // Otherwise map geographic names to CulturalZone values
        const zoneMapping: Record<string, string> = {
            'Europe': 'EUROPEAN',
            'Asia': 'EAST_ASIAN',
            'East Asia': 'EAST_ASIAN',  // Add specific mapping
            'South Asia': 'SOUTH_ASIAN',  // Add specific mapping
            'Middle East': 'MENA',
            'North America': 'NORTH_AMERICAN_PRE_COLUMBIAN',
            'Oceania': 'OCEANIA',
            'South America': 'SOUTH_AMERICAN',
            'Africa': 'SUB_SAHARAN_AFRICAN'
        };
        
        // Fallback to EUROPEAN if no mapping found
        return zoneMapping[currentZone] || 'EUROPEAN';
    })();
    
    const eventSystem = useEventSystem();
    
    const [activePanel, setActivePanel] = useState<ActivePanel>(null);
    const [showBottomPanel, setShowBottomPanel] = useState(true); // Show by default
    const [showAmbientText, setShowAmbientText] = useState(false); // Hidden by default
    const [showPOVViewport, setShowPOVViewport] = useState(false); // POV viewport toggle state
    const [showCampModal, setShowCampModal] = useState(false);
    const [showPlayerTooltip, setShowPlayerTooltip] = useState(false);
    const [playerTooltipPos, setPlayerTooltipPos] = useState({ x: 0, y: 0 });
    const { isMobile } = useDeviceDetection();

    // Hook to handle NPC movement in helper mode
    useHelperNpcMovement({
        npcs: visibleNpcs || [],
        playerX: controlledIconX || 0,
        playerY: controlledIconY || 0,
        mapWidth: mapData?.width || 100,
        mapHeight: mapData?.height || 100,
        onNpcMove: (npcId, newX, newY) => {
            // Update the NPC position in the npcs array
            if (visibleNpcs) {
                const updatedNpcs = visibleNpcs.map(npc =>
                    npc.id === npcId ? { ...npc, x: newX, y: newY } : npc
                );
                setNpcs(updatedNpcs);
            }
        }
    });

    // Listen for POV viewport toggle requests from narration
    useEffect(() => {
        const handleShowPOV = () => {
            setShowPOVViewport(true);
        };

        eventBus.on('pov:show', handleShowPOV);
        return () => {
            eventBus.off('pov:show', handleShowPOV);
        };
    }, []);

    // Guard warning state - ALL hooks must come before early return
    const [guardWarning, setGuardWarning] = useState<{
        message: string;
        guardName?: string;
        severity: 'notice' | 'warning' | 'alert';
        turnsRemaining?: number;
    } | null>(null);
    const [guardAlerts, setGuardAlerts] = useState<Map<string, 'detecting' | 'warning' | 'pursuing'>>(new Map());
    const [guardsAlreadyWarned, setGuardsAlreadyWarned] = useState<Set<string>>(new Set());
    const [permissionStatus, setPermissionStatus] = useState<string | null>(null);

    // ALL REMAINING HOOKS must be called before early return
    // Track current room in special maps (safe to call with null values)
    const specialMapData = isSpecialMap && mapData ? mapData as SpecialMapData : null;
    const mapArchetype = (mapData as any)?.specialArchetype || specialMapData?.archetype;
    
    const currentRoom = useSpecialMapLocation(
        controlledIconX ?? 0,
        controlledIconY ?? 0,
        specialMapData?.rooms
    );
    
    // Enable special map NPC behavior (safe to call with fallback values)
    const playerWithPosition = {
        ...playerCharacter,
        x: controlledIconX ?? 0,
        y: controlledIconY ?? 0
    };
    useSpecialMapNpcBehavior(
        mapArchetype || null,
        visibleNpcs || [],
        playerWithPosition,
        mapData?.tiles || [],
        setNpcs
    );
    
    // Get current weather for horizon and particles - stable per map area, updates hourly
    const currentWeather = useMemo(() => {
        if (!mapData) return null;
        
        // Use map center for consistent weather across the map area
        const mapCenterX = Math.floor(mapData.tiles[0].length / 2);
        const mapCenterY = Math.floor(mapData.tiles.length / 2);
        const centerTile = mapData.tiles[mapCenterY][mapCenterX];
        
        // Weather updates every hour, not on movement
        const hourKey = Math.floor(gameTimeHours);
        
        return weatherService.getWeather(
            mapData.climate,
            centerTile.biome,
            season,
            currentTimeOfDay,
            centerTile.altitude || 0.5,
            gameDate ? getDayOfYear(gameDate) : 180,
            { x: mapCenterX, y: mapCenterY }
        );
    }, [mapData, season, sunPosition, gameDate, Math.floor(gameTimeHours)]); // Only update on hour change
    
    // Apply weather effects on player
    useWeatherEffects(currentWeather);
    
    // Inventory toast for item collection
    const { toasts, showToast: showInventoryToast, hideToast } = useInventoryToast();
    
    // Reputation system
    const { 
        reputation, 
        changeReputation, 
        getReputationModifiers 
    } = useReputationSystem(playerCharacter?.mapReputation || 0);
    
    // Reputation notification state
    const [reputationNotification, setReputationNotification] = useState<{
        change: number;
        reason: string;
        witnesses?: string[];
    } | null>(null);
    
    // NPC confrontation state
    const [confrontationModal, setConfrontationModal] = useState<{
        npc: any;
        item: any;
        dialogue: string;
    } | null>(null);
    
    // Listen for reputation change events from other sources
    useEffect(() => {
        const handleReputationChanged = (data: any) => {
            if (data.change && data.reason) {
                setReputationNotification({
                    change: data.change,
                    reason: data.reason,
                    witnesses: data.witnesses
                });
            }
        };
        
        eventBus.on('reputation:changed', handleReputationChanged);
        return () => {
            eventBus.off('reputation:changed', handleReputationChanged);
        };
    }, []);
    
    // Keyboard handler for container interaction
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // Check if E key is pressed and we're in a special map
            if (e.key === 'e' || e.key === 'E') {
                if (isSpecialMap && mapData?.tiles && controlledIconX !== null && controlledIconY !== null) {
                    const currentTile = mapData.tiles[controlledIconY]?.[controlledIconX];

                    // Check if current tile has a container
                    if (currentTile?.overlayObject) {
                        const containerTypes = [
                            'CHEST', 'BARREL', 'CRATE', 'CABINET', 'BOOKSHELF',
                            'WEAPON_RACK', 'ARMOR_STAND', 'TANSU', 'SPICE_CABINET'
                        ];

                        const overlayType = String(currentTile.overlayObject.type);
                        const isContainer = containerTypes.some(type => overlayType.includes(type));

                        if (isContainer) {
                            // Trigger the container click handler
                            const onContainerClick = (x: number, y: number, tile: any) => {
                                // Use the same logic as the click handler in MapViewport
                                Promise.all([
                                    import('../services/specialMapContainerService'),
                                    import('../services/containerCacheService'),
                                    import('../types/core/tile')
                                ]).then(([containerService, cacheService, tileTypes]) => {
                                    const { generateSpecialMapContainerContents } = containerService;
                                    const { getCachedContents, cacheContents } = cacheService;

                                    const mapId = 'special_map';
                                    let containerContents = getCachedContents(mapId, x, y);

                                    if (!containerContents) {
                                        containerContents = generateSpecialMapContainerContents(
                                            mapData?.specialMapArchetype || 'GOVERNMENT_FORUM',
                                            tile.overlayObject.type,
                                            mapData?.culturalZone || 'EUROPEAN',
                                            mapData?.era || 'MEDIEVAL',
                                            tile.roomType,
                                            tile.roomPrivacy || 'public'
                                        );
                                        cacheContents(mapId, x, y, containerContents);
                                    }

                                    setContainerModalData({
                                        containerType: tile.overlayObject.type,
                                        contents: containerContents,
                                        position: { x, y },
                                        isAnimating: true,
                                        mapId
                                    });
                                });
                            };

                            onContainerClick(controlledIconX, controlledIconY, currentTile);
                        }
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isSpecialMap, mapData, controlledIconX, controlledIconY, setContainerModalData]);

    // Item collection hook for special maps
    useSpecialMapItemCollection({
        tiles: isSpecialMap ? mapData?.tiles : undefined,
        playerX: controlledIconX ?? 0,
        playerY: controlledIconY ?? 0,
        playerCharacter,
        isSpecialMap,
        onInventoryUpdate: (newInventory) => {
            // Update player inventory through the player context
            console.log('[ItemCollection] Inventory updated:', newInventory);
            setPlayerCharacter(prev => {
                if (!prev) return null;
                return { ...prev, inventory: newInventory };
            });
        },
        onShowToast: showInventoryToast,
        onTheftDetected: (item) => {
            console.log('[ItemCollection] Theft detected for item:', item.name);
            
            // Process NPC reactions if we have NPCs and tiles
            if (isSpecialMap && visibleNpcs && mapData?.tiles) {
                const result = processNpcReactions(
                    {
                        playerPos: { x: controlledIconX ?? 0, y: controlledIconY ?? 0 },
                        item: item,
                        isTheft: true,
                        action: 'stolen'
                    },
                    visibleNpcs,
                    mapData.tiles,
                    reputation.current
                );
                
                // Handle reputation change
                if (result.reputationChange !== 0) {
                    const witnesses = result.reactions
                        .filter(r => r.reactionType === 'saw_theft' || r.reactionType === 'confronting')
                        .map(r => r.npc.name || 'Unknown');
                    
                    changeReputation(
                        result.reputationChange,
                        `Caught stealing ${item.name}`,
                        witnesses
                    );
                    
                    // Show reputation notification
                    setReputationNotification({
                        change: result.reputationChange,
                        reason: `Caught stealing ${item.name}`,
                        witnesses
                    });
                }
                
                // Handle confrontation
                const confrontingNpc = result.reactions.find(r => 
                    r.reactionType === 'confronting' && r.distance <= 2
                );
                
                if (confrontingNpc) {
                    setConfrontationModal({
                        npc: confrontingNpc.npc,
                        item: item,
                        dialogue: confrontingNpc.dialogue || 'Stop right there!'
                    });
                }
            }
            
            eventBus.emit('theft:detected', { 
                item, 
                playerX: controlledIconX, 
                playerY: controlledIconY 
            });
        }
    });
    
    // Function to progress time by months
    const handleProgressTime = useCallback((months: number) => {
        if (!gameDate) return;
        
        let newMonth = gameDate.month + months;
        let newYear = gameDate.year;
        
        while (newMonth > 12) {
            newMonth -= 12;
            newYear += 1;
        }
        
        setGameDate({ ...gameDate, month: newMonth, year: newYear });
    }, [gameDate, setGameDate]);
    
    // Function to show work event
    const handleShowWorkEvent = useCallback((event: any) => {
        // For now, we'll show a simple alert since event system doesn't expose triggerEvent
        // In a real implementation, this would integrate with the event modal system
        const message = `${event.description}\n\nYou earned ${event.outcomes[0].effects.find((e: any) => e.type === 'currency')?.value || 0} coins!`;
        alert(message);
    }, []);
    
    // Initialize bottom panel visibility based on device
    useEffect(() => {
        setShowBottomPanel(!isMobile);
    }, [isMobile]);

    // Listen for WorldWeaver notifications
    useEffect(() => {
        const handleWorldWeaverToast = (event: CustomEvent) => {
            const { message } = event.detail;
            // Use a simple toast message for WorldWeaver notifications
            setToastMessage(message);
            setTimeout(() => setToastMessage(null), 4000);
        };

        window.addEventListener('showGameToast', handleWorldWeaverToast as EventListener);
        return () => window.removeEventListener('showGameToast', handleWorldWeaverToast as EventListener);
    }, []);

    // Listen for guard events
    useEffect(() => {
        const handleGuardDetecting = (data: any) => {
            // Check if we've already warned about this guard
            if (guardsAlreadyWarned.has(data.npcId)) {
                return; // Don't show warning again
            }
            
            console.log('[MapViewport] Received guard:detecting event:', data);
            
            // Mark this guard as having shown a warning
            setGuardsAlreadyWarned(prev => new Set(prev).add(data.npcId));
            
            // Add alert indicator for detecting guard
            setGuardAlerts(prev => {
                const newAlerts = new Map(prev);
                newAlerts.set(data.npcId, 'detecting');
                console.log('[MapViewport] Updated guard alerts:', newAlerts);
                return newAlerts;
            });
            
            // Show initial detection message after 2 seconds
            setTimeout(() => {
                const guard = visibleNpcs?.find(n => n.id === data.npcId);
                if (guard && isGuardType(guard)) {
                    setGuardWarning({
                        message: "Who goes there?",
                        guardName: guard.name,
                        severity: 'notice'
                    });
                    
                    // Progress to warning after another 2 seconds
                    setTimeout(() => {
                        setGuardAlerts(prev => {
                            const newAlerts = new Map(prev);
                            newAlerts.set(data.npcId, 'warning');
                            return newAlerts;
                        });
                        setGuardWarning({
                            message: "You're under arrest!",
                            guardName: guard.name,
                            severity: 'warning',
                            turnsRemaining: 3
                        });
                        
                        // Auto-hide the warning after 5 seconds
                        setTimeout(() => {
                            setGuardWarning(null);
                        }, 5000);
                    }, 2000);
                }
            }, 2000);
        };
        
        const handleGuardReset = (data: any) => {
            // Remove this guard from the warned set so they can warn again if player approaches
            setGuardsAlreadyWarned(prev => {
                const newSet = new Set(prev);
                newSet.delete(data.npcId);
                return newSet;
            });
            
            // Remove alert indicator
            setGuardAlerts(prev => {
                const newAlerts = new Map(prev);
                newAlerts.delete(data.npcId);
                return newAlerts;
            });
        };
        
        const handleGuardResolved = (data: any) => {
            console.log('[MapViewport] Guard encounter resolved for NPC:', data.npcId);
            // Clear guard warning
            setGuardWarning(null);
            // Clear guard alert state
            setGuardAlerts(prev => {
                const newAlerts = new Map(prev);
                newAlerts.delete(data.npcId);
                return newAlerts;
            });
            // Clear from warned list so they can warn again if needed
            setGuardsAlreadyWarned(prev => {
                const newSet = new Set(prev);
                newSet.delete(data.npcId);
                return newSet;
            });
        };

        const handlePermissionGranted = (data: any) => {
            console.log('[MapViewport] Permission granted:', data);
            const message = guardPermissionService.getPermissionStatusMessage(data.mapId);
            setPermissionStatus(message);

            // Clear any existing guard warnings since player now has permission
            setGuardWarning(null);
            setGuardAlerts(new Map());

            // Show success message
            console.log(`[Permission] Access granted by ${data.npcName}: ${data.reason}`);
        };

        const handlePermissionRevoked = (data: any) => {
            console.log('[MapViewport] Permission revoked:', data);
            setPermissionStatus(null);
        };
        
        const handleGuardEncounter = (data: any) => {
            // Update to pursuing state
            setGuardAlerts(prev => {
                const newAlerts = new Map(prev);
                newAlerts.set(data.npcId, 'pursuing');
                return newAlerts;
            });
            
            // Show hostile warning
            const guard = data.guardNpc;
            setGuardWarning({
                message: "You're under arrest!",
                guardName: guard?.name,
                severity: 'alert'
            });
            
            // Trigger encounter modal after a brief delay
            setTimeout(() => {
                if (guard) {
                    handleEncounter(guard);
                }
            }, 1000);
        };
        
        // Subscribe to events
        eventBus.on('guard:detecting', handleGuardDetecting);
        eventBus.on('guard:encounter', handleGuardEncounter);
        eventBus.on('guard:reset', handleGuardReset);
        eventBus.on('guard:resolved', handleGuardResolved);
        eventBus.on('permission:granted', handlePermissionGranted);
        eventBus.on('permission:revoked', handlePermissionRevoked);

        return () => {
            eventBus.off('guard:detecting', handleGuardDetecting);
            eventBus.off('guard:encounter', handleGuardEncounter);
            eventBus.off('guard:reset', handleGuardReset);
            eventBus.off('guard:resolved', handleGuardResolved);
            eventBus.off('permission:granted', handlePermissionGranted);
            eventBus.off('permission:revoked', handlePermissionRevoked);
        };
    }, [visibleNpcs, handleEncounter, guardsAlreadyWarned]);

    // Check permission status when map changes
    useEffect(() => {
        if (isSpecialMap && mapData) {
            const mapId = `${mapData.area || 'unknown'}_${mapData.seed || 'default'}`;
            const message = guardPermissionService.getPermissionStatusMessage(mapId);
            setPermissionStatus(message);
        } else {
            setPermissionStatus(null);
        }
    }, [isSpecialMap, mapData?.area, mapData?.seed]);

    // Add ambient text to narration panel every 4 hours of game time (4 minutes real time)
    // Ambiance system deprecated - no longer emit ambient text to narration
    // useEffect(() => {
    //     if (!showPOVViewport && ambianceText) {
    //         // Show ambient text immediately when POV is hidden
    //         eventBus.emit('narration:ambient', { text: ambianceText });

    //         // Then add ambient text to narration panel every 4 minutes (4 game hours)
    //         const interval = setInterval(() => {
    //             console.log('[MapViewport] Adding periodic ambient text to narration:', ambianceText);
    //             eventBus.emit('narration:ambient', { text: ambianceText });
    //         }, 240000); // 240 seconds = 4 minutes real time = 4 hours game time

    //         return () => clearInterval(interval);
    //     }
    // }, [showPOVViewport, ambianceText]);

    // Handle map transitions with elegant fade effect
    useEffect(() => {
        if (isLoading && !isMapTransitioning) {
            // Starting to load - trigger fade transition
            setIsMapTransitioning(true);
        } else if (!isLoading && isMapTransitioning) {
            // Finished loading - wait a moment then fade in
            setTimeout(() => {
                setIsMapTransitioning(false);
            }, 800); // Wait for fade to complete
        }
    }, [isLoading, isMapTransitioning]);

    // POI Toast Auto-Detection System
    useEffect(() => {
        if (!mapData || !playerCharacter || controlledIconX === null || controlledIconY === null) {
            return;
        }

        // Get current tile
        const currentTile = mapData.tiles[controlledIconY]?.[controlledIconX];
        if (!currentTile) {
            // Clear toast if no tile
            if (poiToastData) {
                setPoiToastData(null);
            }
            return;
        }

        // Check for POI structures on current tile
        let poiStructure = null;
        
        // Check if tile has a structure (singular)
        if (currentTile.structure) {
            const structureType = currentTile.structure.structureType || currentTile.structure.type;
            console.log('[POI Detection] Found structure on tile:', structureType, currentTile.structure);
            if (['mine', 'quarry', 'mill', 'factory', 'fortress', 'woodcutter', 'lumber_camp'].includes(structureType || '')) {
                poiStructure = currentTile.structure;
                console.log('[POI Detection] Matched POI type:', structureType);
            }
        }
        
        // Also check terrainStructures array if it exists
        if (!poiStructure && mapData.terrainStructures) {
            // Check all structures silently
            
            // Find structures at current position
            poiStructure = mapData.terrainStructures.find(s => {
                const structureType = s.structureType || s.type;
                const isAtLocation = s.location && 
                    s.location[0] === controlledIconX && 
                    s.location[1] === controlledIconY;
                
                
                return isAtLocation && ['mine', 'mining_colony', 'quarry', 'mill', 'factory', 'fortress', 'woodcutter', 'lumber_camp'].includes(structureType || '');
            });
            
            if (poiStructure) {
                console.log('[POI Detection] Matched POI from terrainStructures:', poiStructure);
            }
        }

        if (poiStructure && !poiToastData) {
            // Generate procedural description and dialogue
            try {
                const structureType = poiStructure.structureType || poiStructure.type || 'quarry';
                console.log('[POI Services] Calling generateDescription with:', {
                    structureType,
                    currentZone,
                    currentCulturalZone,
                    currentEra,
                    biome: currentTile.biome
                });
                
                const description = poiDescriptionService.generateDescription(
                    structureType,
                    currentCulturalZone,
                    currentEra,
                    currentTile.biome,
                    poiStructure
                );
                
                console.log('[POI Services] Generated description:', description);
                
                const dialogue = poiDialogueService.generateDialogue(
                    structureType,
                    currentCulturalZone,
                    currentEra,
                    'stone' // Default material - could be enhanced later
                );

                // Only set POI toast if it's not already showing this structure AND it wasn't manually closed
                // This prevents reopening when the user closes the modal while still on the tile
                if ((window as any).poiToastManuallyClosedId !== poiStructure.id) {
                    setPoiToastData(prev => {
                        // Only set if not already showing this structure
                        if (!prev || prev.structure.id !== poiStructure.id) {
                            console.log('[MapViewport] Setting POI toast for structure:', poiStructure.id);
                            return {
                                structure: poiStructure,
                                description,
                                dialogue
                            };
                        }
                        return prev;
                    });
                }
            } catch (error) {
                console.error('[MapViewport] Error generating POI description/dialogue:', error);
                console.error('[MapViewport] Error stack:', error.stack);
                // Fallback to basic toast
                const fallbackType = poiStructure.structureType || poiStructure.type || 'work site';
                if ((window as any).poiToastManuallyClosedId !== poiStructure.id) {
                    setPoiToastData(prev => {
                        // Only set if not already showing this structure
                        if (!prev || prev.structure.id !== poiStructure.id) {
                            console.log('[MapViewport] Setting POI toast fallback for structure:', poiStructure.id);
                            return {
                                structure: poiStructure,
                                description: `A ${fallbackType} where local workers process materials according to traditional methods.`,
                                dialogue: {
                                    speaker: 'Local Worker',
                                    greeting: `Welcome to our ${fallbackType}. We can help you with various services.`,
                                    services: [
                                        {
                                            id: 'basic_service',
                                            name: 'Basic Services',
                                            description: 'Standard processing and trade',
                                            cost: '2-5 goods',
                                            available: true
                                        }
                                    ]
                                }
                            };
                        }
                        return prev;
                    });
                }
            }
        } else if (!poiStructure) {
            // Clear toast and reset closed flag when moving away from POI
            if (poiToastData) {
                setPoiToastData(null);
            }
            // Clear the manually closed flag when leaving POI tiles
            if ((window as any).poiToastManuallyClosedId) {
                delete (window as any).poiToastManuallyClosedId;
            }
        }
    }, [controlledIconX, controlledIconY, mapData, playerCharacter, poiToastData, setPoiToastData, currentZone, currentEra]);

    const handleDevCommandClick = useCallback((data: DevTooltipDisplayData) => {
        let parentTile: Tile | null = null;
        let mapContextForModal = data.mapContext;
        if (data.viewMode === 'interior') {
            parentTile = mapData?.tiles[0][0] || null;
            if (mapData && !mapContextForModal) {
                mapContextForModal = { climate: mapData.climate, archetype: mapData.archetype, tiles: mapData.tiles };
            }
        } else if (data.viewMode === 'standard') {
            parentTile = data.tile as Tile;
        }
        setTileInfoModalProps({ data: { ...data, mapContext: mapContextForModal }, parentTile });
    }, [mapData, setTileInfoModalProps]);

    const handleVesselClick = useCallback((vessel: DeployedVessel) => {
        // For now, just show info about the vessel
        // The actual embarkation will happen automatically when player walks onto it
        console.log('[MapViewport] Vessel clicked:', vessel.vesselItem.name);
        alert(`${vessel.vesselItem.name} - Walk onto this vessel to embark!`);
    }, []);

    const handlePlayerIconClick = useCallback((e?: React.MouseEvent) => {
        console.log('[MapViewport] Player icon clicked - opening camp modal');
        // Directly open the camp modal when player icon is clicked
        setShowCampModal(true);
    }, []);

    const handleShipClick = useCallback(() => {
        console.log('[MapViewport] Ship clicked - entering vessel special map');
        
        // Create vessel special map config
        const vesselConfig: SpecialMapConfig = {
            archetype: SpecialMapArchetype.VESSEL,
            culturalZone: mapData?.culturalStyle || 'EUROPEAN' as const,
            era: gameDate?.year < 1500 ? 'MEDIEVAL' as const : 
                 gameDate?.year < 1800 ? 'RENAISSANCE_EARLY_MODERN' as const : 
                 'INDUSTRIAL_MODERN' as const,
            specificYear: gameDate?.year || 1400,
            region: currentRegion || 'Northern Europe',
            mapSize: 'xs' as const,
            hasLandscape: true,
            landscapeClimate: 'ocean' as const,
            isPrivate: false,
            isRectangular: true,
            wallMaterial: gameDate?.year > 1800 ? 'steel' : 'wood',
            floorMaterial: 'wood'
        };
        
        enterSpecialMap(vesselConfig);
    }, [enterSpecialMap, mapData, gameDate, currentRegion]);

    const handleRest = useCallback((healingPercent: number, fatiguePercent: number) => {
        console.log('[MapViewport] Applying rest benefits - Healing:', healingPercent, '%, Fatigue:', fatiguePercent, '%');

        if (!playerCharacter || !gameDate) return;

        // Apply healing
        const healAmount = Math.floor(playerCharacter.maxHealth * (healingPercent / 100));
        const newHealth = Math.min(playerCharacter.health + healAmount, playerCharacter.maxHealth);

        // Apply fatigue restoration
        const restoreAmount = Math.floor(playerCharacter.maxFatigue * (fatiguePercent / 100));
        const newFatigue = Math.max(playerCharacter.fatigue - restoreAmount, 0);

        // Update player character
        setPlayerCharacter({
            ...playerCharacter,
            health: newHealth,
            fatigue: newFatigue
        });

        // Advance time to dawn (6 AM next day)
        const nextDay = new Date(gameDate.year, gameDate.month - 1, gameDate.day + 1);
        setGameDate({
            year: nextDay.getFullYear(),
            month: nextDay.getMonth() + 1,
            day: nextDay.getDate(),
            hour: 6,
            minute: 0
        });

        showToast('You wake feeling refreshed at dawn.');
    }, [playerCharacter, setPlayerCharacter, gameDate, setGameDate, showToast]);

    const handleExploreCampground = useCallback(() => {
        console.log('[MapViewport] Entering campground special map');

        // Create campground special map config
        const campConfig: SpecialMapConfig = {
            archetype: SpecialMapArchetype.CAMPGROUND,
            culturalZone: mapData?.culturalStyle || 'EUROPEAN' as const,
            era: gameDate?.year < 1500 ? 'MEDIEVAL' as const :
                 gameDate?.year < 1800 ? 'RENAISSANCE_EARLY_MODERN' as const :
                 'INDUSTRIAL_MODERN' as const,
            specificYear: gameDate?.year || 1400,
            region: currentRegion || 'Unknown',
            mapSize: 'small' as const,
            hasLandscape: true,
            landscapeClimate: mapData?.climate === 'ARID' ? 'arid' :
                            mapData?.climate === 'COLD' ? 'cold' :
                            mapData?.climate === 'TROPICAL' ? 'tropical' : 'temperate',
            isPrivate: false,
            structureName: 'Camp',
        };

        // Enter the special map
        enterSpecialMap(campConfig);

        // Start the second camping music track when entering campground
        gameSoundsService.stopAllMusic();
        gameSoundsService.playCampingMusic2();
    }, [enterSpecialMap, mapData, gameDate, currentRegion]);

    const renderMapContent = () => {
        if (activeMarketplaceModal && playerCharacter && mapData && mapAnalysisData) {
            return <MarketplaceModal
                tile={activeMarketplaceModal.tile}
                onClose={() => setActiveMarketplaceModal(null)}
                playerCharacter={playerCharacter}
                onBuy={onBuyItem}
                onSell={onSellItem}
                mapData={mapData}
                npcs={visibleNpcs}
                mapAnalysisData={mapAnalysisData}
                gameTimeHours={gameTimeHours}
                season={season}
                onAddPersistedNpc={addPersistedMerchant}
                currentMapSeed={currentMapSeed}
            />;
        }
        if (activeCityModal && playerCharacter && mapData) {
            return <CityModal
                tile={activeCityModal.tile}
                onClose={() => setActiveCityModal(null)}
                playerCharacter={playerCharacter}
                mapData={mapData}
                gameTimeHours={gameTimeHours}
                season={season}
                onEnterSpecialMap={(config) => {
                    console.log('[CityModal] Entering special map with config:', config);
                    enterSpecialMap(config);
                    setActiveCityModal(null);
                }}
            />;
        }
        // Show mining roguelike display if active - moved after other modals
        // so it doesn't early return and can stay in main viewport

        if (activeRuinModal && playerCharacter && mapData) {
            // Find the ruin structure at this location
            const ruinStructure = mapData.terrainStructures?.find(
                s => s.location[0] === activeRuinModal.tile.x && 
                     s.location[1] === activeRuinModal.tile.y &&
                     s.structureType === 'ruin'
            );
            
            if (ruinStructure) {
                return (
                    <RuinStructureModal
                        structure={ruinStructure}
                        mapData={mapData}
                        npcs={visibleNpcs}
                        onClose={() => setActiveRuinModal(null)}
                        gameTimeHours={gameTimeHours}
                        season={season}
                        playerCharacter={playerCharacter}
                        currentLocation={mapData.mapAreaName || mapData.continent}
                        formattedDate={`Year ${gameDate?.year || 1650}, Day ${gameDate?.day || 1}`}
                        onRoguelikeModeChange={setInRuinRoguelike}
                        onPlayerDeath={onPlayerDeath}
                    />
                );
            }
            // Fallback if no structure found (shouldn't happen)
            return null;
        }

        // Show mining roguelike display if active
        if (inMiningRoguelike && miningRoguelikeData && playerCharacter && mapData) {
            return (
                <div className="w-full h-full flex flex-col bg-gradient-to-b from-gray-900 via-stone-900 to-black">
                    <MiningRoguelikeDisplay
                        mineData={{
                            name: miningRoguelikeData.structure.name || 'Deep Mine Shaft',
                            description: miningRoguelikeData.structure.description || 'A deep mine rich with ore deposits',
                            oreType: miningRoguelikeData.structure.mineralDeposits ?
                                Object.keys(miningRoguelikeData.structure.mineralDeposits)[0] : 'Iron Ore',
                            depth: 30,
                            culturalZone: mapData.culturalZone || "EUROPEAN",
                            historicalEra: getHistoricalPeriod(mapData.timeSlice || '1650')
                        }}
                        playerCharacter={playerCharacter}
                        onExit={() => {
                            setInMiningRoguelike(false);
                            setMiningRoguelikeData(null);
                            showToast?.('You emerge from the mine shaft...');
                        }}
                        onHealthChange={(newHealth) => {
                            // Update player health
                            setPlayerCharacter(prev => prev ? { ...prev, health: newHealth } : prev);
                        }}
                        onInventoryAdd={(item) => {
                            // Add item to player inventory
                            addItemsToInventory([item]);
                            showToast?.(`Found ${item.name}!`);
                        }}
                        onFatigueChange={(newFatigue) => {
                            // Update player fatigue
                            setPlayerCharacter(prev => prev ? { ...prev, fatigue: newFatigue } : prev);
                        }}
                        onPlayerDeath={onPlayerDeath}
                    />
                </div>
            );
        }
        if (activeGovernmentModal && playerCharacter && mapData) {
            // GovernmentDistrictModal replaces the map display, similar to RuinStructureModal
            return (
                <GovernmentDistrictModal
                    structure={activeGovernmentModal.structure}
                    tile={activeGovernmentModal.tile}
                    playerCharacter={playerCharacter}
                    mapData={mapData}
                    currentLocation={currentRegion}
                    formattedDate={gameDate}
                    gameTimeHours={gameTimeHours}
                    season={season}
                    npcs={visibleNpcs}
                    onClose={() => setActiveGovernmentModal(null)}
                    onEnterSpecialMap={(config) => {
                        console.log('[GovernmentDistrictModal] Entering special map with config:', config);
                        enterSpecialMap(config);
                        setActiveGovernmentModal(null);
                    }}
                />
            );
        }
        if (activeFishingHutModal && playerCharacter && mapData) {
            // FishingHutModal replaces the map display, similar to GovernmentDistrictModal
            return (
                <FishingHutModal
                    isOpen={true}
                    onClose={() => setActiveFishingHutModal(null)}
                    structure={activeFishingHutModal.structure}
                    culturalZone={mapData?.culturalStyle || 'EUROPEAN' as any}
                    historicalEra={getHistoricalPeriod(gameDate.year)}
                    climate={mapData?.climate || 'TEMPERATE'}
                    biome={activeFishingHutModal.tile.biome}
                    season={season}
                    year={gameDate.year}
                    isCoastal={activeFishingHutModal.tile.biome === 'coastal'}
                    isFreshwater={activeFishingHutModal.tile.biome !== 'coastal' && activeFishingHutModal.tile.biome !== 'oceanic'}
                    timeOfDay={currentTimeOfDay}
                    playerCharacter={playerCharacter}
                    onCharacterUpdate={setPlayerCharacter}
                    onInventoryUpdate={(newItem) => {
                        console.log('🎣 MapViewport: onInventoryUpdate called with:', newItem);
                        // Add item to player inventory and update character
                        if (playerCharacter && setPlayerCharacter) {
                            const updatedInventory = [...(playerCharacter.inventory || []), newItem];
                            console.log('🎣 Current inventory length:', playerCharacter.inventory?.length || 0);
                            console.log('🎣 Updated inventory length:', updatedInventory.length);
                            const updatedCharacter = {
                                ...playerCharacter,
                                inventory: updatedInventory
                            };
                            setPlayerCharacter(updatedCharacter);
                            console.log('🎣 onCharacterUpdate called successfully');
                        }
                    }}
                    onBuy={onBuyItem}
                    onSell={onSellItem}
                    playerGold={playerCharacter.inventory?.find(item => item.id === 'COIN')?.quantity || 0}
                />
            );
        }
        if (viewMode === 'standard') {
            // Check if this is a special map (interior government building, etc.)
            if (isSpecialMap && mapData) {
                const specialData = mapData as any;
                // Special map render debug log removed to reduce console spam
                // For now, render special maps with the same display but it will show architectural biomes
                // In the future, we could create a dedicated SpecialMapDisplay component
            }
            
            return (
                <MapDisplayOptimized
                    mapData={mapData!}
                    currentMapSeed={currentMapSeed}
                    animals={visibleAnimals}
                    npcs={visibleNpcs}
                    deployedVessels={deployedVessels || []}
                    onDevHover={handleDevHover}
                    onDevCommandClick={handleDevCommandClick}
                    onStructureClick={setStructureModalTarget}
                    onPoiClick={setActivePoi}
                    onSettlementClick={(tile: Tile) => setActiveSettlementInfo({ tile })}
                    onVesselClick={handleVesselClick}
                    onPlayerMove={onPlayerMove}
                    activeLens={activeLens} 
                    logicalControlledIconX={controlledIconX} 
                    logicalControlledIconY={controlledIconY} 
                    onIconAnimationComplete={onIconAnimationComplete}
                    isSpecialMap={isSpecialMap}
                    currentVessel={currentVessel} 
                    playerMode={playerMode} 
                    shipDockX={shipDockX} 
                    shipDockY={shipDockY} 
                    onAnimalClick={setInfoModalTarget} 
                    onNpcClick={setInfoModalTarget} 
                    selectedAnimalId={infoModalTarget?.id} 
                    selectedNpcId={infoModalTarget?.id} 
                    sunPosition={sunPosition} 
                    formattedDate={formattedDate} 
                    season={season} 
                    currentLocation={mapData?.continent || ''} 
                    iconRotation={iconRotation} 
                    velocity={velocity} 
                    playerCharacter={playerCharacter} 
                    gameTimeHours={gameTimeHours} 
                    gameTimeMinutes={gameTimeMinutes} 
                    debugSettings={debugSettings}
                    devMode={false}
                    onPlayerIconClick={handlePlayerIconClick}
                    onShipClick={handleShipClick}
                    onCompanionClick={handleCompanionClick}
                    onMapEdgeCrossing={handleNewAreaEntry}
                    guardAlerts={guardAlerts} // Pass guard alert states for rendering indicators
                    onContainerClick={(x, y, tile) => {
                        // Import services needed for container interaction
                        Promise.all([
                            import('../services/specialMapContainerService'),
                            import('../services/containerCacheService'),
                            import('../types/core/tile')
                        ]).then(([containerService, cacheService, tileTypes]) => {
                            const { generateSpecialMapContainerContents } = containerService;
                            const { getCachedContents, cacheContents, isContainerEmpty } = cacheService;
                            const { OverlayObjectType } = tileTypes;

                            // Check if tile has a container overlay object
                            const hasContainer = tile.overlayObject && (
                                tile.overlayObject.type === OverlayObjectType.CHEST ||
                                tile.overlayObject.type === OverlayObjectType.BARREL ||
                                tile.overlayObject.type === OverlayObjectType.CRATE ||
                                tile.overlayObject.type === OverlayObjectType.CABINET ||
                                tile.overlayObject.type === OverlayObjectType.BOOKSHELF ||
                                tile.overlayObject.type === OverlayObjectType.WEAPON_RACK ||
                                tile.overlayObject.type === OverlayObjectType.ARMOR_STAND ||
                                tile.overlayObject.type === OverlayObjectType.TANSU ||
                                tile.overlayObject.type === OverlayObjectType.SPICE_CABINET
                            );

                            if (hasContainer) {
                                const mapId = isSpecialMap ? 'special_map' : 'main_map';

                                // Check cache first
                                let containerContents = getCachedContents(mapId, x, y);

                                // If not cached or this is first interaction, generate contents
                                if (!containerContents) {
                                    // Generate contents based on container type and context
                                    containerContents = generateSpecialMapContainerContents(
                                        mapData?.specialMapArchetype || 'GOVERNMENT_FORUM',
                                        tile.overlayObject.type,
                                        mapData?.culturalZone || 'EUROPEAN',
                                        mapData?.era || 'MEDIEVAL',
                                        tile.roomType,
                                        tile.roomPrivacy || 'public'
                                    );

                                    // Cache the contents
                                    cacheContents(mapId, x, y, containerContents);
                                }

                                // Open container modal
                                setContainerModalData({
                                    containerType: tile.overlayObject.type,
                                    contents: containerContents,
                                    position: { x, y },
                                    isAnimating: true,
                                    mapId // Pass mapId for cache updates
                                });
                            }
                            // Also handle tiles with collectible items (floor items)
                            else if (tile.collectibleItem && !tile.collectibleItem.collected) {
                                const containerContents = {
                                    items: [tile.collectibleItem.item],
                                    isCollectible: true,
                                    ownerNpc: tile.collectibleItem.ownerNpc,
                                    isValuable: tile.collectibleItem.isValuable || false
                                };

                                setContainerModalData({
                                    containerType: tile.overlayObject?.type,
                                    contents: containerContents,
                                    position: { x, y },
                                    isAnimating: true
                                });
                            }
                        });
                    }}
                />
            );
        }
        if (viewMode === 'interior' && interiorViewState && interiorMapPlayerPos) {
            const interiorData = interiorViewState.maps.get(interiorViewState.currentFloor)!;
            const buildingType = interiorData.buildingType;
            
            console.log('🖼️ [MapViewport] Interior mode detected:', {
                buildingType,
                buildingId: interiorViewState.buildingId,
                hasInteriorData: !!interiorData
            });
            
            // Use beautiful interior system for palaces, holy places, and fortresses
            if (buildingType === 'palace' || buildingType === 'holy_place' || buildingType === 'temple' || buildingType === 'fortress') {
                console.log('✨ [MapViewport] Using BEAUTIFUL interior system for:', buildingType);
                // Find the original tile that was entered to get context
                let contextTile = mapData?.tiles?.flat().find(tile => 
                    tile.structure?.id === interiorViewState.buildingId
                );
                
                // If no context tile found, create a minimal fallback tile
                if (!contextTile && mapData) {
                    console.log('⚠️ [MapViewport] No context tile found, creating fallback');
                    contextTile = {
                        x: Math.floor(MAP_WIDTH_TILES / 2),
                        y: Math.floor(MAP_HEIGHT_TILES / 2),
                        biome: BiomeType.HOLY_SITE,
                        isLand: true,
                        temperature: 20,
                        humidity: 50,
                        elevation: 0.5,
                        holyPlaceReligion: buildingType === 'holy_place' ? 'Christianity' : undefined,
                        structure: {
                            id: interiorViewState.buildingId,
                            type: buildingType as any,
                            subtype: buildingType === 'palace' ? 'castle' : 
                                     buildingType === 'holy_place' ? 'cathedral' : 
                                     buildingType === 'fortress' ? 'fortress' : 'temple'
                        }
                    } as any;
                }
                
                if (contextTile && mapData && playerCharacter) {
                    const config = {
                        buildingType,
                        contextTile,
                        standardMapContext: mapData,
                        date: formattedDate,
                        location: mapData.continent || 'Europe',
                        floor: interiorViewState.currentFloor,
                        totalFloors: 1,
                        buildingId: interiorViewState.buildingId
                    };
                    
                    return (
                        <BeautifulInteriorMapDisplay
                            config={config}
                            playerCharacter={playerCharacter}
                            playerReligion={playerCharacter.religion}
                            playerClass={playerCharacter.socialClass}
                            playerReputation={playerCharacter.socialContext?.reputation || 0}
                            mapData={mapData}
                            onExit={handleExitInteriorView}
                            onNpcInteraction={(npc, dialogue) => {
                                // For fortress commanders and other elite NPCs, trigger the encounter modal
                                if ((buildingType === 'fortress' && npc.role?.includes('Commander')) || 
                                    npc.id?.includes('elite')) {
                                    console.log('🏰 [MapViewport] Triggering elite NPC encounter with dialogue');
                                    // Add the pre-generated dialogue to the NPC
                                    const npcWithDialogue = {
                                        ...npc,
                                        initialDialogue: dialogue
                                    };
                                    handleEncounter(npcWithDialogue);
                                } else {
                                    // For other confrontation/warning dialogues, just log them
                                    console.log(`${npc.name}: ${dialogue.join(' ')}`);
                                }
                            }}
                            onNpcClick={(npc) => {
                                // Trigger proper encounter modal for clicked NPCs
                                handleEncounter(npc);
                            }}
                            onReputationChange={(change, reason) => {
                                // TODO: Apply reputation change to player
                                console.log(`Reputation ${change > 0 ? '+' : ''}${change}: ${reason}`);
                            }}
                        />
                    );
                } else {
                    console.log('❌ [MapViewport] Failed to create context for beautiful interior, fallback to legacy');
                }
            } else {
                console.log('🗂️ [MapViewport] Using LEGACY interior system for:', buildingType);
            }
            
            // Fallback to old system for other building types
            return <InteriorMapDisplay interiorMapData={interiorData} discoveredFloors={interiorViewState.discoveredFloors} onExit={handleExitInteriorView} playerPos={interiorMapPlayerPos} onPlayerMove={onPlayerMove} onEntityClick={handleEntityInteraction} onDevHover={handleDevHover} onDevCommandClick={handleDevCommandClick} />;
        }
        return null;
    };

    // Get current tile's biome for POV viewport
    const currentTileBiome = useMemo(() => {
        if (!mapData || controlledIconX === null || controlledIconY === null) return 'GRASSLAND';
        const tile = mapData.tiles[controlledIconY]?.[controlledIconX];
        return tile?.biome || 'GRASSLAND';
    }, [mapData, controlledIconX, controlledIconY]);

    return (
        <main className={`flex-1 flex flex-col bg-transparent relative overflow-hidden ${className || ''}`}>
          {/* Helper Mode Notification - shows above everything */}
          <HelperModeNotification />

          {/* Background layer with all atmospheric effects - behind everything */}
          <div className="absolute inset-0" style={{ zIndex: 0 }}>
            {isSpecialMap && specialMapData ? (
              <SpecialMapBackground 
                config={specialMapData.specialConfig}
                timeOfDay={currentTimeOfDay}
              />
            ) : (
              <TimeAwareBackground
                gameTimeHours={gameTimeHours}
                gameTimeMinutes={gameTimeMinutes}
                viewMode={viewMode}
                season={season}
                climate={mapData?.climate}
                weather={currentWeather}
              />
            )}
            
            {/* Cloud System - only render when there are clouds */}
            {currentWeather && currentWeather.cloudCover > 0 && (
              <CloudSystem 
                weather={currentWeather}
                timeOfDay={currentTimeOfDay}
                windSpeed={currentWeather?.windSpeed || 0}
              />
            )}
            
            {/* Celestial Bodies - behind map but above background */}
            <CelestialBodies
              timeOfDay={currentTimeOfDay}
              gameTimeHours={gameTimeHours}
              gameTimeMinutes={gameTimeMinutes}
              weather={currentWeather}
              gameDay={gameDate?.day || 1}
              gameMonth={gameDate?.month || 1}
              gameYear={gameDate?.year || 1500}
              climate={mapData?.climate}
            />
            
            {/* Weather Effects - behind map but above background */}
            <WeatherEffects
              weather={currentWeather || { 
                temperature: 20, feelsLike: 20, humidity: 0.5, 
                precipitation: 'none', intensity: 0, windSpeed: 0, 
                windDirection: 0, pressure: 1013, cloudCover: 0.3, 
                special: null 
              }}
            />
          </div>
          {isLoading ? (
            <div className="absolute inset-0 bg-gray-900/75 flex items-center justify-center z-50 rounded-2xl">
              <div className="text-center text-white">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  {/* Compass-style loading animation */}
                  <div className="absolute inset-0 border-4 border-slate-600/30 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-transparent border-t-blue-400 border-r-cyan-400 rounded-full animate-spin"></div>
                  <div className="absolute inset-2 border-2 border-transparent border-b-amber-400 border-l-orange-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg">🧭</span>
                  </div>
                </div>
                <p className="text-sm font-medium tracking-wide">{isLoadingFromCache ? `Loading map (${currentWorldCoords.x},${currentWorldCoords.y})...` : `Generating new world...`}</p>
              </div>
            </div>
          ) : mapData && (
             <div
               className={`w-full h-full flex flex-col relative transition-all`}
               style={{
                 zIndex: 10,
                 opacity: (mapVisible && !isMapTransitioning && !isProcessingWorldWeaver) ? 1 : 0,
                 transform: (mapVisible && !isMapTransitioning && !isProcessingWorldWeaver) ? 'scale(1)' : 'scale(0.95)',
                 transition: 'opacity 5s ease-out, transform 5s ease-out',
                 transitionDelay: (mapVisible && !isMapTransitioning && !isProcessingWorldWeaver) ? '0s' : '0s',
                 pointerEvents: (mapVisible && !isMapTransitioning && !isProcessingWorldWeaver) ? 'auto' : 'none'
               }}
             >
              {/* POV Viewport - shows above map when toggled (only for standard map, not interior/special maps) */}
              {showPOVViewport && !interiorViewState?.buildingId && !isSpecialMap && (
                <POVViewport
                  visible={showPOVViewport}
                  biome={currentTileBiome}
                  climate={mapData?.climate}
                  season={season}
                  culturalZone={currentCulturalZone}
                  weather={currentWeather || undefined}
                  gameTime={{ hours: gameTimeHours, minutes: gameTimeMinutes }}
                  onClose={() => setShowPOVViewport(false)}
                  onObserve={() => {
                    onUseSkill('OBSERVE');
                    setShowPOVViewport(false);
                  }}
                />
              )}
              {/* Map container - flex-1 adjusts size when POV is visible */}
              <div className={`flex-1 flex flex-col transition-all duration-500 ${showPOVViewport ? 'mt-2' : ''}`}>
                {/* Map with border */}
                <div className={`flex-1 ${isMobile ? 'p-2' : 'p-6'} min-h-0`}>
                 {/* Outer border with frosted glass effect */}
                 <div className="w-full h-full relative" style={{
                   padding: isMobile ? '3px' : '10px',
                   background: 'linear-gradient(135deg, rgba(40, 50, 70, 0.65), rgba(50, 40, 70, 0.35))',
                   borderRadius: isMobile ? '20px' : '28px',
                   boxShadow: `
                     0 12px 40px rgba(0, 0, 0, 0.5),
                     inset 0 2px 4px rgba(255, 255, 255, 0.2),
                     0 0 0 1px rgba(255, 255, 255, 0.08),
                     0 0 0 2px rgba(100, 120, 160, 0.15)
                   `,
                   backdropFilter: 'blur(8px)'
                 }}>
                  {/* Inner frame with elegant border */}
                  <div className={`w-full h-full relative overflow-hidden bg-slate-900`}
                       style={{
                         border: `${isMobile ? '2px' : '5px'} solid rgba(31, 41, 59, 0.7)`,
                         borderRadius: isMobile ? '16px' : '28px',
                         boxShadow: 'inset 0 4px 12px rgba(0, 0, 0, 0.9), 0 8px 32px rgba(31, 41, 59, 0.9)'
                       }}>
                   <div 
                     style={{ 
                       width: '100%', 
                       height: '100%'
                     }}
                   >
                       {renderMapContent()}
                   </div>
                   
                   {/* Special Map Location Display - shows name and current room */}
                   {isSpecialMap && specialMapData && (
                     <SpecialMapLocationDisplay
                       mapDisplayName={specialMapData.displayName || 'Special Location'}
                       currentRoom={currentRoom}
                       playerX={controlledIconX || 0}
                       playerY={controlledIconY || 0}
                     />
                   )}
                   
                   {/* Guard Warning Box - appears below location display */}
                   {guardWarning && (
                     <GuardWarningBox
                       message={guardWarning.message}
                       guardName={guardWarning.guardName}
                       severity={guardWarning.severity}
                       turnsRemaining={guardWarning.turnsRemaining}
                     />
                   )}

                   {/* Permission Status - shows when player has access */}
                   {permissionStatus && (
                     <div className="absolute top-28 left-1/2 transform -translate-x-1/2 z-30 animate-fadeIn">
                       <div className="bg-green-900/95 border-4 border-green-400 border-double rounded-lg px-6 py-3 shadow-2xl min-w-[300px] max-w-[500px]">
                         <div className="font-mono text-green-100 text-lg tracking-wide">
                           <div className="text-green-300 text-sm mb-1 flex items-center gap-2">
                             <span className="text-green-400">✓</span>
                             Access Granted
                           </div>
                           <div className="leading-relaxed text-sm">
                             {permissionStatus}
                           </div>
                         </div>
                       </div>
                     </div>
                   )}
                   
                   {/* Vignette effect overlay - atmospheric darkening at edges with time-aware colors */}
                   <div
                     className="absolute inset-0 pointer-events-none"
                     style={{
                       background: `
                         radial-gradient(ellipse at center,
                           transparent 0%,
                           transparent 40%,
                           ${
                             currentTimeOfDay === 'Dawn' ? 'rgba(255, 180, 120, 0.04)' :
                             currentTimeOfDay === 'Dusk' ? 'rgba(255, 140, 100, 0.05)' :
                             currentTimeOfDay === 'Night' ? 'rgba(20, 40, 80, 0.08)' :
                             'rgba(0, 0, 0, 0.05)'
                           } 60%,
                           ${
                             currentTimeOfDay === 'Dawn' ? 'rgba(200, 120, 80, 0.08)' :
                             currentTimeOfDay === 'Dusk' ? 'rgba(180, 80, 60, 0.10)' :
                             currentTimeOfDay === 'Night' ? 'rgba(10, 25, 60, 0.15)' :
                             'rgba(0, 0, 0, 0.10)'
                           } 78%,
                           ${
                             currentTimeOfDay === 'Dawn' ? 'rgba(150, 80, 60, 0.12)' :
                             currentTimeOfDay === 'Dusk' ? 'rgba(120, 50, 40, 0.15)' :
                             currentTimeOfDay === 'Night' ? 'rgba(5, 15, 40, 0.22)' :
                             'rgba(0, 0, 0, 0.15)'
                           } 90%,
                           ${
                             currentTimeOfDay === 'Dawn' ? 'rgba(100, 50, 40, 0.18)' :
                             currentTimeOfDay === 'Dusk' ? 'rgba(80, 30, 25, 0.22)' :
                             currentTimeOfDay === 'Night' ? 'rgba(0, 10, 30, 0.30)' :
                             'rgba(0, 0, 0, 0.22)'
                           } 100%)
                       `,
                       borderRadius: isMobile ? '14px' : '28px',
                       zIndex: 999
                     }}
                   />
                   
                   {/* Inner shadow for inset/recessed effect */}
                   <div 
                     className="absolute inset-0 pointer-events-none"
                     style={{
                       boxShadow: `
                         inset 0 0 ${isMobile ? '30px' : '60px'} ${isMobile ? '15px' : '30px'} rgba(0, 0, 0, 0.15),
                         inset 0 ${isMobile ? '2px' : '4px'} ${isMobile ? '8px' : '16px'} rgba(0, 0, 0, 0.3),
                         inset 0 -${isMobile ? '2px' : '4px'} ${isMobile ? '8px' : '16px'} rgba(0, 0, 0, 0.3),
                         inset ${isMobile ? '2px' : '4px'} 0 ${isMobile ? '8px' : '16px'} rgba(0, 0, 0, 0.25),
                         inset -${isMobile ? '2px' : '4px'} 0 ${isMobile ? '8px' : '16px'} rgba(0, 0, 0, 0.25)
                       `,
                       borderRadius: isMobile ? '14px' : '23px',
                       zIndex: 998
                     }}
                   />
                   
                   {/* Loading overlay effect during transitions */}
                   {isMapTransitioning && (
                     <div className="map-loading-overlay" style={{ zIndex: 1000 }} />
                   )}
                  </div>
                 </div>
                </div>
                
                {/* Horizon Layer or Interior Horizon - between map and bottom panel, bounded by sidebars */}
                <div className="relative w-full pointer-events-none" style={{ height: '80px', marginTop: '-20px', zIndex: 5 }}>
                  {isSpecialMap && specialMapData ? (
                    <InteriorHorizon 
                      config={specialMapData.specialConfig}
                      timeOfDay={currentTimeOfDay}
                    />
                  ) : (
                    <HorizonLayer 
                      climate={mapData.climate}
                      mapType={mapData.archetype}
                      timeOfDay={currentTimeOfDay}
                      weather={currentWeather || undefined}
                      width={typeof window !== 'undefined' ? window.innerWidth : 1920}
                      height={80}
                      hasWater={mapData.tiles.some(row => row.some(tile => 
                        tile.biome === BiomeType.OCEAN || 
                        tile.biome === BiomeType.RIVER ||
                      tile.biome === BiomeType.LAKE
                    ))}
                    hasCities={mapData.tiles.some(row => row.some(tile => 
                      tile.biome === BiomeType.URBAN || 
                      tile.biome === BiomeType.DENSE_CITY
                    ))}
                    hasVolcano={mapData.tiles.some(row => row.some(tile => 
                      tile.biome === BiomeType.VOLCANIC
                    ))}
                    biomes={Array.from(new Set(mapData.tiles.flat().map(tile => tile.biome)))}
                  />
                  )}
                </div>
              </div>
              
              {/* DEPRECATED: Ambiance text feature removed - was generating repetitive text that didn't match other game systems */}
              {/* {showAmbientText && <AmbianceDisplay ambianceText={ambianceText} />} */}
              {/* Toggle button for mobile - bigger and better positioned */}
              {isMobile && actionableTile && (
                <button
                  onClick={() => setShowBottomPanel(!showBottomPanel)}
                  className="fixed z-40 px-5 py-3 bg-blue-600 active:bg-blue-700 text-white rounded-full shadow-xl transition-all duration-200 flex items-center gap-2.5"
                  style={{
                    bottom: showBottomPanel ? 'calc(env(safe-area-inset-bottom) + 240px)' : 'calc(env(safe-area-inset-bottom) + 20px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    minWidth: '120px',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}
                >
                  <span className="text-xl">{showBottomPanel ? '✕' : '🧭'}</span>
                  <span>{showBottomPanel ? 'Hide' : 'Actions'}</span>
                </button>
              )}
              {(showBottomPanel || !isMobile) && (
               <div className={`relative shrink-0 ${isMobile ? 'fixed bottom-0 left-0 right-0 z-30 animate-slideUp' : 'h-24'}`}>
                    <BottomPanel 
                        actionableTile={actionableTile} 
                        contextualMessage={contextualMessage} 
                        playerCharacter={playerCharacter} 
                        mapData={mapData} 
                        playerX={controlledIconX} 
                        playerY={controlledIconY} 
                        onEnterCity={(tile: Tile) => setActiveCityModal({tile})} 
                        onEnterMarketplace={(tile: Tile) => setActiveMarketplaceModal({tile})}
                        onEnterRuin={(tile: Tile) => setActiveRuinModal({tile})}
                        onEnterBuilding={(tile) => onEnterBuilding(tile, mapData)} 
                        onEnterFarm={(tile) => setActivePanel('farm')}
                        onEnterFishingHut={(tile) => {
                            console.log('[MapViewport] onEnterFishingHut called with tile:', tile);
                            // Find the fishing hut structure
                            const fishingHutStructure = mapData?.terrainStructures?.find(s => 
                                s.location[0] === tile.x && s.location[1] === tile.y && s.structureType === 'fishing_hut'
                            );
                            console.log('[MapViewport] Found fishing hut structure:', fishingHutStructure);
                            if (fishingHutStructure) {
                                console.log('[MapViewport] Setting fishing hut modal active');
                                setActiveFishingHutModal({ structure: fishingHutStructure, tile });
                            } else {
                                console.log('[MapViewport] No fishing hut structure found at tile coordinates');
                            }
                        }}
                        onEnterMine={(structure) => setActiveMiningModal(structure)}
                        onEnterGovernmentDistrict={(tile) => {
                            const pseudoStructure = {
                                id: `gov_district_${tile.x}_${tile.y}`,
                                structureType: 'government_district',
                                location: [tile.x, tile.y] as [number, number],
                                materialType: 'stone',
                                isRuined: false,
                                biome: BiomeType.GOVERNMENT_DISTRICT,
                                name: 'Government District'
                            } as any;
                            setActiveGovernmentModal({ structure: pseudoStructure, tile });
                        }}
                        onEnterHolySite={(tile) => {
                            // For now, trigger building entry - holy site modal needs implementation
                            onEnterBuilding(tile, mapData);
                        }}
                        onEnterPalace={(tile) => {
                            // For now, trigger building entry - palace modal needs implementation
                            onEnterBuilding(tile, mapData);
                        }}
                        toastMessage={toastMessage}
                        season={season}
                        timeOfDay={currentTimeOfDay}
                        dayOfYear={gameDate ? getDayOfYear(gameDate) : 180}
                        onToggleAmbientText={() => {
                            // Toggle POV viewport instead of ambient text
                            setShowPOVViewport(!showPOVViewport);
                        }}
                        showAmbientText={showPOVViewport}
                        inRuinRoguelike={inRuinRoguelike}
                        isRuinModalOpen={!!activeRuinModal}
                        isSpecialMap={isSpecialMap}
                        onExitSpecialMap={exitSpecialMap}
                        currentBiome={currentTileBiome}
                        climate={mapData?.climate}
                        culturalZone={currentCulturalZone}
                        weather={currentWeather}
                        gameTime={{ hours: gameTimeHours, minutes: gameTimeMinutes }}
                        onExitRuin={() => {
                            setActiveRuinModal(null);
                            setInRuinRoguelike(false);
                        }}
                        inMiningRoguelike={inMiningRoguelike}
                        onExitMine={() => {
                            setInMiningRoguelike(false);
                            setMiningRoguelikeData(null);
                            showToast?.('You emerge from the mine shaft...');
                        }}
                        isMarketplaceModalOpen={!!activeMarketplaceModal}
                        onExitMarketplace={() => setActiveMarketplaceModal(null)}
                    />
                    {panelNotificationItem && <NewItemModal item={panelNotificationItem} onClose={() => setPanelNotificationItem(null)} />}
                </div>
              )}
            </div>
          )}
          {activePanel === 'farm' && actionableTile && playerCharacter && mapData && (
            <FarmPanel
              tile={actionableTile.tile}
              mapData={mapData}
              npcs={visibleNpcs}
              playerCharacter={playerCharacter}
              onClose={() => setActivePanel(null)}
              onBuy={onBuyItem}
              onSell={onSellItem}
              useLlm={useLlmForDescriptions}
              season={season}
              gameTimeHours={gameTimeHours}
              onProgressTime={handleProgressTime}
              onShowEvent={handleShowWorkEvent}
              onInitiateEncounter={handleEncounter}
            />
          )}
          
          {/* Inventory Toast Notifications */}
          {toasts.map(toast => (
            <InventoryToast
              key={toast.id}
              item={toast.item}
              action={toast.action}
              onClose={() => hideToast(toast.id)}
              duration={3000}
            />
          ))}
          
          {/* Reputation Notification */}
          {reputationNotification && (
            <ReputationNotification
              change={reputationNotification.change}
              reason={reputationNotification.reason}
              witnesses={reputationNotification.witnesses}
              onComplete={() => setReputationNotification(null)}
            />
          )}
          
          {/* NPC Confrontation Modal */}
          {confrontationModal && playerCharacter && (
            <NpcConfrontationModal
              npc={confrontationModal.npc}
              item={confrontationModal.item}
              dialogue={confrontationModal.dialogue}
              playerGold={playerCharacter.currency}
              onClose={() => setConfrontationModal(null)}
              onPayFine={(amount) => {
                // Handle paying fine
                if (playerCharacter.currency >= amount) {
                  // Deduct gold
                  console.log('[Confrontation] Player pays fine:', amount);
                  setPlayerCharacter(prev => {
                    if (!prev) return null;
                    return { ...prev, currency: Math.max(0, prev.currency - amount) };
                  });
                  changeReputation(5, 'Paid fine to avoid trouble');
                  setConfrontationModal(null);
                }
              }}
              onFight={() => {
                // Trigger combat with the NPC
                console.log('[Confrontation] Player chooses to fight');
                handleEncounter({ npc: confrontationModal.npc });
                setConfrontationModal(null);
              }}
              onSurrender={() => {
                // Handle surrender (go to jail, etc.)
                console.log('[Confrontation] Player surrenders');
                changeReputation(-20, 'Arrested for theft');
                setConfrontationModal(null);
              }}
              onTryToEscape={() => {
                // Handle escape attempt
                const escapeRoll = Math.random();
                if (escapeRoll > 0.5) {
                  console.log('[Confrontation] Player escapes!');
                  changeReputation(-5, 'Fled from authorities');
                } else {
                  console.log('[Confrontation] Escape failed!');
                  changeReputation(-15, 'Caught trying to escape');
                  handleEncounter({ npc: confrontationModal.npc });
                }
                setConfrontationModal(null);
              }}
            />
          )}

          {/* Player Tooltip */}
          {showPlayerTooltip && (
            <PlayerTooltip
              x={playerTooltipPos.x}
              y={playerTooltipPos.y}
              onRest={() => {
                setShowPlayerTooltip(false);
                setShowCampModal(true);
              }}
              onStatus={() => {
                setShowPlayerTooltip(false);
                // Just generate a narration for now
                handlePlayerClick();
              }}
              onClose={() => setShowPlayerTooltip(false)}
            />
          )}

          {/* Camp Modal */}
          {showCampModal && playerCharacter && mapData && (
            <CampModal
              isOpen={showCampModal}
              onClose={() => setShowCampModal(false)}
              playerCharacter={playerCharacter}
              currentBiome={mapData.tiles[controlledIconY]?.[controlledIconX]?.biome || BiomeType.GRASSLAND}
              mapData={mapData}
              onRest={handleRest}
              onExploreCampground={handleExploreCampground}
              timeOfDay={gameTimeHours}
              gamelog={gameLog}
            />
          )}
        </main>
    );
};

export default MapViewport;