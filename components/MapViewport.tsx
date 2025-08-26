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
import { MapDisplayOptimized } from './MapDisplayOptimized';
import { InteriorMapDisplay } from './interiorMap';
import BeautifulInteriorMapDisplay from './interiorMap/BeautifulInteriorMapDisplay';
import AmbianceDisplay from './AmbianceDisplay';
import BottomPanel from './BottomPanel';
import NewItemModal from './NewItemModal';
import FarmPanel from './FarmPanel';
import MarketplaceModal from './MarketplaceModal';
import CityModal from './CityModal';
import RuinModal from './RuinModal';
import { DevTooltipDisplayData, Tile, PlayerCharacter, BiomeType, DeployedVessel, TimeOfDay } from '../types';
import TimeAwareBackground from './TimeAwareBackground';
import HorizonLayer from './HorizonLayer';
import CloudSystem from './CloudSystem';
import WeatherEffects from './WeatherEffects';
import CelestialBodies from './CelestialBodies';
import { weatherService } from '../services/weatherService';
import { MAP_WIDTH_TILES, MAP_HEIGHT_TILES } from '../constants';
import { useDeviceDetection } from '../utils/deviceUtils';
import { useWeatherEffects } from '../hooks/useWeatherEffects';

type ActivePanel = 'farm' | null;

const MapViewport: React.FC = () => {
    const {
        handleDevHover, setTileInfoModalProps, setStructureModalTarget, setActiveSettlementInfo,
        activeLens, infoModalTarget, panelNotificationItem, setPanelNotificationItem, toastMessage,
        activeMarketplaceModal, setActiveMarketplaceModal, activeCityModal, setActiveCityModal,
        activeRuinModal, setActiveRuinModal, useLlmForDescriptions, handleEncounter, setInfoModalTarget, 
        setActiveMiningModal, setActivePoi, debugSettings,
        handleCompanionClick, handlePlayerClick, handleNewAreaEntry
    } = useUI();
    
    const [isMapTransitioning, setIsMapTransitioning] = useState(false);
    const [mapFadeClass, setMapFadeClass] = useState('');
    
    const { 
        currentWorldCoords, mapData,
        visibleAnimals, visibleNpcs, deployedVessels, mapAnalysisData, 
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
        isLoading, isLoadingFromCache, setGameDate, gameDate
    } = useGame();
    
    const eventSystem = useEventSystem();
    
    const [activePanel, setActivePanel] = useState<ActivePanel>(null);
    const [showBottomPanel, setShowBottomPanel] = useState(true); // Show by default
    const [showAmbientText, setShowAmbientText] = useState(false); // Hidden by default
    const { isMobile } = useDeviceDetection();
    
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
    
    // Handle map transitions with fade effect
    useEffect(() => {
        if (isLoading && !isMapTransitioning) {
            // Starting to load - immediately fade out the map display
            setMapFadeClass('opacity-0 transition-opacity duration-500');
            setIsMapTransitioning(true);
            
            // After fade out completes, show background for 2 seconds
            setTimeout(() => {
                // Map will be hidden while loading
            }, 500);
        } else if (!isLoading && isMapTransitioning) {
            // Finished loading - wait a moment then fade in
            setTimeout(() => {
                setMapFadeClass('opacity-0');
                // Force reflow
                setTimeout(() => {
                    setMapFadeClass('opacity-100 transition-opacity duration-1000');
                    setTimeout(() => {
                        setIsMapTransitioning(false);
                        setMapFadeClass('');
                    }, 1000);
                }, 50);
            }, 500); // Brief pause to appreciate the background
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

    const renderMapContent = () => {
        if (activeMarketplaceModal && playerCharacter && mapData && mapAnalysisData) {
            return <MarketplaceModal tile={activeMarketplaceModal.tile} onClose={() => setActiveMarketplaceModal(null)} playerCharacter={playerCharacter} onBuy={onBuyItem} onSell={onSellItem} mapData={mapData} npcs={visibleNpcs} mapAnalysisData={mapAnalysisData} gameTimeHours={gameTimeHours} season={season} />;
        }
        if (activeCityModal && playerCharacter && mapData) {
            return <CityModal tile={activeCityModal.tile} onClose={() => setActiveCityModal(null)} playerCharacter={playerCharacter} mapData={mapData} gameTimeHours={gameTimeHours} season={season} />;
        }
        if (activeRuinModal && playerCharacter && mapData) {
            return <RuinModal tile={activeRuinModal.tile} onClose={() => setActiveRuinModal(null)} playerCharacter={playerCharacter} mapData={mapData} />;
        }
        if (viewMode === 'standard') {
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
                    activeLens={activeLens} 
                    logicalControlledIconX={controlledIconX} 
                    logicalControlledIconY={controlledIconY} 
                    onIconAnimationComplete={onIconAnimationComplete}
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
                    onCompanionClick={handleCompanionClick}
                    onMapEdgeCrossing={handleNewAreaEntry}
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
            <TimeAwareBackground 
              gameTimeHours={gameTimeHours} 
              gameTimeMinutes={gameTimeMinutes} 
              viewMode={viewMode}
              season={season}
              climate={mapData?.climate}
              weather={currentWeather}
            />
            
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
             <div className={`w-full h-full flex flex-col ${mapFadeClass} relative`} style={{ zIndex: 10 }}>
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
                   {renderMapContent()}
                   
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
                
                {/* Horizon Layer - between map and bottom panel, bounded by sidebars */}
                <div className="relative w-full pointer-events-none" style={{ height: '80px', marginTop: '-20px', zIndex: 5 }}>
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