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
import AmbianceDisplay from './AmbianceDisplay';
import BottomPanel from './BottomPanel';
import NewItemModal from './NewItemModal';
import FarmPanel from './FarmPanel';
import MarketplaceModal from './MarketplaceModal';
import CityModal from './CityModal';
import RuinStructureModal from './RuinStructureModal';
import GovernmentDistrictModal from './GovernmentDistrictModal';
import { DevTooltipDisplayData, Tile, PlayerCharacter, BiomeType, DeployedVessel, TimeOfDay } from '../types';
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
import { SpecialMapData } from '../types/specialMapTypes';
import GuardWarningBox from './GuardWarningBox';
import NpcAlertIndicator from './NpcAlertIndicator';
import { eventBus } from '../services/eventBus';
import { isGuardType } from '../services/specialMapNpcBehaviorService';
import { weatherService } from '../services/weatherService';
import { MAP_WIDTH_TILES, MAP_HEIGHT_TILES } from '../constants';
import { useDeviceDetection } from '../utils/deviceUtils';
import { useWeatherEffects } from '../hooks/useWeatherEffects';

type ActivePanel = 'farm' | null;

interface MapViewportProps {
  mapVisible?: boolean;
}

const MapViewport: React.FC<MapViewportProps> = ({ mapVisible = true }) => {
    const {
        handleDevHover, setTileInfoModalProps, setStructureModalTarget, setActiveSettlementInfo,
        activeLens, infoModalTarget, panelNotificationItem, setPanelNotificationItem, toastMessage,
        activeMarketplaceModal, setActiveMarketplaceModal, activeCityModal, setActiveCityModal,
        activeRuinModal, setActiveRuinModal, activeGovernmentModal, setActiveGovernmentModal, inRuinRoguelike, setInRuinRoguelike, useLlmForDescriptions, handleEncounter, setInfoModalTarget, 
        setActiveMiningModal, setActivePoi, debugSettings,
        handleCompanionClick, handlePlayerClick, handleNewAreaEntry
    } = useUI();
    
    const [isMapTransitioning, setIsMapTransitioning] = useState(false);
    
    const { 
        currentWorldCoords, mapData,
        visibleAnimals, visibleNpcs, deployedVessels, mapAnalysisData, 
        enterSpecialMap, exitSpecialMap, isSpecialMap,
        addPersistedMerchant,
    } = useMap();

    const {
        playerCharacter, controlledIconX, controlledIconY, onIconAnimationComplete,
        playerMode, setPlayerMode, shipDockX, shipDockY, iconRotation, velocity, currentVessel,
        interiorViewState, interiorMapPlayerPos, onPlayerMove,
        handleExitInteriorView, handleEntityInteraction,
        onEnterBuilding, onBuyItem, onSellItem, viewMode,
    } = usePlayer();
    
    const { 
        sunPosition, formattedDate, season, ambianceText, 
        actionableTile, contextualMessage, gameTimeHours, gameTimeMinutes,
        isLoading, isLoadingFromCache, setGameDate, gameDate, currentRegion
    } = useGame();
    
    const eventSystem = useEventSystem();
    
    const [activePanel, setActivePanel] = useState<ActivePanel>(null);
    const [showBottomPanel, setShowBottomPanel] = useState(true); // Show by default
    const [showAmbientText, setShowAmbientText] = useState(false); // Hidden by default
    const { isMobile } = useDeviceDetection();
    
    // Guard warning state
    const [guardWarning, setGuardWarning] = useState<{
        message: string;
        guardName?: string;
        severity: 'notice' | 'warning' | 'alert';
        turnsRemaining?: number;
    } | null>(null);
    const [guardAlerts, setGuardAlerts] = useState<Map<string, 'detecting' | 'warning' | 'pursuing'>>(new Map());
    const [guardsAlreadyWarned, setGuardsAlreadyWarned] = useState<Set<string>>(new Set());
    
    // Track current room in special maps
    const specialMapData = isSpecialMap && mapData ? mapData as SpecialMapData : null;
    // The archetype field is called 'specialArchetype' in the actual data
    const mapArchetype = (mapData as any)?.specialArchetype || specialMapData?.archetype;
    
    // Debug: Only log when in special map to reduce spam
    if (isSpecialMap && mapArchetype) {
        console.log('[MapViewport] Special map active:', {
            archetype: mapArchetype,
            npcCount: visibleNpcs?.length
        });
    }
    
    const currentRoom = useSpecialMapLocation(
        controlledIconX,
        controlledIconY,
        specialMapData?.rooms
    );
    
    // Enable special map NPC behavior (guard detection, etc.)
    // Create a player object with the actual position
    const playerWithPosition = {
        ...playerCharacter,
        x: controlledIconX ?? 0,
        y: controlledIconY ?? 0
    };
    useSpecialMapNpcBehavior(
        mapArchetype || null,
        visibleNpcs || [],
        playerWithPosition,
        mapData?.tiles || []
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
            sunPosition as TimeOfDay || 'Day',
            centerTile.altitude || 0.5,
            gameDate?.day || 180,
            { x: mapCenterX, y: mapCenterY }
        );
    }, [mapData, season, sunPosition, gameDate, Math.floor(gameTimeHours)]); // Only update on hour change
    
    // Apply weather effects on player
    useWeatherEffects(currentWeather);
    
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
        
        return () => {
            eventBus.off('guard:detecting', handleGuardDetecting);
            eventBus.off('guard:encounter', handleGuardEncounter);
            eventBus.off('guard:reset', handleGuardReset);
            eventBus.off('guard:resolved', handleGuardResolved);
        };
    }, [visibleNpcs, handleEncounter, guardsAlreadyWarned]);
    
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
            />;
        }
        if (activeCityModal && playerCharacter && mapData) {
            return <CityModal tile={activeCityModal.tile} onClose={() => setActiveCityModal(null)} playerCharacter={playerCharacter} mapData={mapData} gameTimeHours={gameTimeHours} season={season} />;
        }
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
                    />
                );
            }
            // Fallback if no structure found (shouldn't happen)
            return null;
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
        if (viewMode === 'standard') {
            // Check if this is a special map (interior government building, etc.)
            if (isSpecialMap && mapData) {
                const specialData = mapData as any;
                console.log('[MapViewport] Special map render - isSpecialMap:', isSpecialMap, 
                    'mapType:', specialData.mapType,
                    'specialArchetype:', specialData.specialArchetype,
                    'hasInteractionZones:', !!specialData.interactionZones,
                    'tilesSample:', specialData.tiles?.[0]?.[0]?.biome);
                // For now, render special maps with the same display but it will show architectural biomes
                // In the future, we could create a dedicated SpecialMapDisplay component
            }
            
            return (
                <MapDisplayOptimized 
                    mapData={mapData!} 
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
                    onPlayerIconClick={handlePlayerClick}
                    onShipClick={handleShipClick}
                    onCompanionClick={handleCompanionClick}
                    onMapEdgeCrossing={handleNewAreaEntry}
                    guardAlerts={guardAlerts} // Pass guard alert states for rendering indicators
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
            
            // Use beautiful interior system for palaces and holy places
            if (buildingType === 'palace' || buildingType === 'holy_place' || buildingType === 'temple') {
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
                            subtype: buildingType === 'palace' ? 'castle' : buildingType === 'holy_place' ? 'cathedral' : 'temple'
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
                            onExit={handleExitInteriorView}
                            onNpcInteraction={(npc, dialogue) => {
                                // For confrontation/warning dialogues, just log them
                                console.log(`${npc.name}: ${dialogue.join(' ')}`);
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

    return (
        <main className="flex-1 flex flex-col bg-transparent relative overflow-hidden">
          {/* Background layer with all atmospheric effects - behind everything */}
          <div className="absolute inset-0" style={{ zIndex: 0 }}>
            {isSpecialMap && specialMapData ? (
              <SpecialMapBackground 
                config={specialMapData.specialConfig}
                timeOfDay={sunPosition as TimeOfDay || 'Day'}
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
                timeOfDay={sunPosition as TimeOfDay || 'Day'}
                windSpeed={currentWeather?.windSpeed || 0}
              />
            )}
            
            {/* Celestial Bodies - behind map but above background */}
            <CelestialBodies
              timeOfDay={sunPosition as TimeOfDay || 'Day'}
              gameTimeHours={gameTimeHours}
              gameTimeMinutes={gameTimeMinutes}
              weather={currentWeather}
              gameDay={gameDate?.day || 1}
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
                 opacity: (mapVisible && !isMapTransitioning) ? 1 : 0,
                 transform: (mapVisible && !isMapTransitioning) ? 'scale(1)' : 'scale(0.95)',
                 transition: 'opacity 1.5s ease-out, transform 1.5s ease-out',
                 transitionDelay: (mapVisible && !isMapTransitioning) ? '0s' : '0.5s',
                 pointerEvents: (mapVisible && !isMapTransitioning) ? 'auto' : 'none'
               }}
             >
              {/* Map container */}
              <div className="flex-1 flex flex-col">
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
                   
                   {/* Vignette effect overlay - subtle darkening at edges */}
                   <div 
                     className="absolute inset-0 pointer-events-none"
                     style={{
                       background: `
                         radial-gradient(ellipse at center, 
                           transparent 0%, 
                           transparent 45%, 
                           rgba(0, 0, 0, 0.03) 65%, 
                           rgba(0, 0, 0, 0.06) 80%, 
                           rgba(0, 0, 0, 0.08) 92%,
                           rgba(0, 0, 0, 0.12) 100%)
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
                      timeOfDay={sunPosition as TimeOfDay || 'Day'}
                    />
                  ) : (
                    <HorizonLayer 
                      climate={mapData.climate}
                      mapType={mapData.archetype}
                      timeOfDay={sunPosition as TimeOfDay || 'Day'}
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
              
              {/* Only show ambient text when toggled on */}
              {showAmbientText && <AmbianceDisplay ambianceText={ambianceText} />}
              {/* Toggle button for mobile */}
              {isMobile && actionableTile && (
                <button
                  onClick={() => setShowBottomPanel(!showBottomPanel)}
                  className="fixed bottom-2 right-4 z-40 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all duration-200 flex items-center gap-2"
                >
                  <span className="text-lg">{showBottomPanel ? '✕' : '🧭'}</span>
                  <span className="text-sm font-medium">{showBottomPanel ? 'Hide' : 'Actions'}</span>
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
                        onEnterMine={(structure) => setActiveMiningModal(structure)}
                        toastMessage={toastMessage}
                        season={season}
                        timeOfDay={sunPosition as TimeOfDay || 'Day'}
                        dayOfYear={gameDate?.day || 180}
                        onToggleAmbientText={() => setShowAmbientText(!showAmbientText)}
                        showAmbientText={showAmbientText}
                        inRuinRoguelike={inRuinRoguelike}
                        isRuinModalOpen={!!activeRuinModal}
                        isSpecialMap={isSpecialMap}
                        onExitSpecialMap={exitSpecialMap}
                        onExitRuin={() => {
                            setActiveRuinModal(null);
                            setInRuinRoguelike(false);
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
            />
          )}
        </main>
    );
};

export default MapViewport;