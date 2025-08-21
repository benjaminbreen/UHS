/**
 * components/MapViewport.tsx - Encapsulates the main content area including map displays.
 */
import React, { useState, useEffect, useCallback } from 'react';
import './TopNavBarPolished.css'; // Import for map fade animations
import { useUI } from '../contexts/UIContext';
import { useMap } from '../contexts/MapContext';
import { usePlayer } from '../contexts/PlayerContext';
import { useGame } from '../contexts/GameContext';
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
import { DevTooltipDisplayData, Tile, PlayerCharacter, BiomeType, DeployedVessel } from '../types';
import TimeAwareBackground from './TimeAwareBackground';
import { MAP_WIDTH_TILES, MAP_HEIGHT_TILES } from '../constants';
import { useDeviceDetection } from '../utils/deviceUtils';

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
        isLoading, isLoadingFromCache
    } = useGame();
    
    const [activePanel, setActivePanel] = useState<ActivePanel>(null);
    const [showBottomPanel, setShowBottomPanel] = useState(false);
    const { isMobile } = useDeviceDetection();
    
    // Initialize bottom panel visibility based on device
    useEffect(() => {
        setShowBottomPanel(!isMobile);
    }, [isMobile]);
    
    // Handle map transitions with fade effect
    useEffect(() => {
        console.log('[MapViewport] Loading state changed:', { isLoading, isMapTransitioning });
        if (isLoading && !isMapTransitioning) {
            // Starting to load - fade out
            console.log('[MapViewport] Starting map fade out');
            setMapFadeClass('map-fade-out');
            setIsMapTransitioning(true);
        } else if (!isLoading && isMapTransitioning) {
            // Finished loading - fade in
            console.log('[MapViewport] Starting map fade in');
            setMapFadeClass('map-fade-in');
            setTimeout(() => {
                setIsMapTransitioning(false);
                setMapFadeClass('');
                console.log('[MapViewport] Map fade complete');
            }, 2000); // Match the 2-second fade-in duration
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
        <main className="flex-1 flex flex-col bg-transparent relative">
          <TimeAwareBackground gameTimeHours={gameTimeHours} gameTimeMinutes={gameTimeMinutes} viewMode={viewMode} />
          {isLoading ? (
            <div className="absolute inset-0 bg-gray-900/75 flex items-center justify-center z-50 rounded-2xl">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                <p>{isLoadingFromCache ? `Loading map (${currentWorldCoords.x},${currentWorldCoords.y})...` : `Generating new world...`}</p>
              </div>
            </div>
          ) : mapData && (
             <div className={`w-full h-full flex flex-col ${mapFadeClass}`}>
              <div className={`flex-1 ${isMobile ? 'p-2' : 'p-6'} min-h-0`}>
               <div className={`w-full h-full relative shadow-map-frame ${isMobile ? 'border-4' : 'border-[10px]'} border-slate-800/[.8] ${isMobile ? 'rounded-xl' : 'rounded-3xl'} overflow-hidden bg-slate-900`}>
                {renderMapContent()}
                {/* Loading overlay effect during transitions */}
                {isMapTransitioning && (
                  <div className="map-loading-overlay" />
                )}
               </div>
              </div>
              <AmbianceDisplay ambianceText={ambianceText} />
              {/* Toggle button for mobile */}
              {isMobile && actionableTile && (
                <button
                  onClick={() => setShowBottomPanel(!showBottomPanel)}
                  className="fixed bottom-4 right-4 z-40 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all duration-200 flex items-center gap-2"
                >
                  <span className="text-lg">{showBottomPanel ? '✕' : '🧭'}</span>
                  <span className="text-sm font-medium">{showBottomPanel ? 'Hide' : 'Actions'}</span>
                </button>
              )}
              {showBottomPanel && (
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
                    />
                    {panelNotificationItem && <NewItemModal item={panelNotificationItem} onClose={() => setPanelNotificationItem(null)} />}
                </div>
              )}
            </div>
          )}
          {activePanel === 'farm' && actionableTile && playerCharacter && mapData && (
            <FarmPanel tile={actionableTile.tile} mapData={mapData} npcs={visibleNpcs} playerCharacter={playerCharacter} onClose={() => setActivePanel(null)} onBuy={onBuyItem} onSell={onSellItem} useLlm={useLlmForDescriptions} season={season} />
          )}
        </main>
    );
};

export default MapViewport;