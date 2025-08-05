/**
 * components/MapViewport.tsx - Encapsulates the main content area including map displays.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useUI } from '../contexts/UIContext';
import { useMap } from '../contexts/MapContext';
import { usePlayer } from '../contexts/PlayerContext';
import { useGame } from '../contexts/GameContext';
import { MapDisplay } from './MapDisplay';
import { InteriorMapDisplay } from './interiorMap';
import AmbianceDisplay from './AmbianceDisplay';
import BottomPanel from './BottomPanel';
import NewItemModal from './NewItemModal';
import FarmPanel from './FarmPanel';
import MarketplaceModal from './MarketplaceModal';
import CityModal from './CityModal';
import { DevTooltipDisplayData, Tile, PlayerCharacter } from '../types';
import TimeAwareBackground from './TimeAwareBackground';

type ActivePanel = 'farm' | null;

const MapViewport: React.FC = () => {
    const {
        handleDevHover, setTileInfoModalProps, setStructureModalTarget, setActiveSettlementInfo,
        activeLens, infoModalTarget, panelNotificationItem, setPanelNotificationItem, toastMessage,
        activeMarketplaceModal, setActiveMarketplaceModal, activeCityModal, setActiveCityModal,
        useLlmForDescriptions, handleEncounter, setInfoModalTarget, setActiveMiningModal,
        setActivePoi
    } = useUI();
    
    const { 
        currentWorldCoords, mapData,
        visibleAnimals, visibleNpcs, mapAnalysisData, 
    } = useMap();

    const {
        playerCharacter, controlledIconX, controlledIconY, onIconAnimationComplete,
        playerMode, shipDockX, shipDockY, iconRotation, velocity,
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

    const renderMapContent = () => {
        if (activeMarketplaceModal && playerCharacter && mapData && mapAnalysisData) {
            return <MarketplaceModal tile={activeMarketplaceModal.tile} onClose={() => setActiveMarketplaceModal(null)} playerCharacter={playerCharacter} onBuy={onBuyItem} onSell={onSellItem} mapData={mapData} npcs={visibleNpcs} mapAnalysisData={mapAnalysisData} gameTimeHours={gameTimeHours} season={season} />;
        }
        if (activeCityModal && playerCharacter && mapData) {
            return <CityModal tile={activeCityModal.tile} onClose={() => setActiveCityModal(null)} playerCharacter={playerCharacter} mapData={mapData} gameTimeHours={gameTimeHours} season={season} />;
        }
        if (viewMode === 'standard') {
            return <MapDisplay mapData={mapData!} animals={visibleAnimals} npcs={visibleNpcs} onDevHover={handleDevHover} onDevCommandClick={handleDevCommandClick} onStructureClick={setStructureModalTarget} onPoiClick={setActivePoi} onSettlementClick={(tile: Tile) => setActiveSettlementInfo({ tile })} activeLens={activeLens} logicalControlledIconX={controlledIconX} logicalControlledIconY={controlledIconY} onIconAnimationComplete={onIconAnimationComplete} playerMode={playerMode} shipDockX={shipDockX} shipDockY={shipDockY} onAnimalClick={setInfoModalTarget} onNpcClick={setInfoModalTarget} selectedAnimalId={infoModalTarget?.id} selectedNpcId={infoModalTarget?.id} sunPosition={sunPosition} formattedDate={formattedDate} season={season} currentLocation={mapData?.continent || ''} iconRotation={iconRotation} velocity={velocity} playerCharacter={playerCharacter} />;
        }
        if (viewMode === 'interior' && interiorViewState && interiorMapPlayerPos) {
            return <InteriorMapDisplay interiorMapData={interiorViewState.maps.get(interiorViewState.currentFloor)!} discoveredFloors={interiorViewState.discoveredFloors} onExit={handleExitInteriorView} playerPos={interiorMapPlayerPos} onPlayerMove={onPlayerMove} onEntityClick={handleEntityInteraction} onDevHover={handleDevHover} onDevCommandClick={handleDevCommandClick} />;
        }
        return null;
    };

    return (
        <main className="flex-1 flex flex-col bg-transparent relative">
          <TimeAwareBackground gameTimeHours={gameTimeHours} gameTimeMinutes={gameTimeMinutes} />
          {isLoading ? (
            <div className="absolute inset-0 bg-gray-900/75 flex items-center justify-center z-50 rounded-2xl">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                <p>{isLoadingFromCache ? `Loading map (${currentWorldCoords.x},${currentWorldCoords.y})...` : `Generating new world...`}</p>
              </div>
            </div>
          ) : mapData && (
             <div className="w-full h-full flex flex-col">
              <div className="flex-1 p-6 min-h-0">
               <div className="w-full h-full relative shadow-map-frame border-[10px] border-slate-800/[.8] rounded-3xl overflow-hidden bg-slate-900">
                {renderMapContent()}
               </div>
              </div>
              <AmbianceDisplay ambianceText={ambianceText} />
               <div className="relative shrink-0 h-24">
                    <BottomPanel 
                        actionableTile={actionableTile} 
                        contextualMessage={contextualMessage} 
                        playerCharacter={playerCharacter} 
                        mapData={mapData} 
                        playerX={controlledIconX} 
                        playerY={controlledIconY} 
                        onEnterCity={(tile: Tile) => setActiveCityModal({tile})} 
                        onEnterMarketplace={(tile: Tile) => setActiveMarketplaceModal({tile})} 
                        onEnterBuilding={(tile) => onEnterBuilding(tile, mapData)} 
                        onEnterFarm={(tile) => setActivePanel('farm')}
                        onEnterMine={(structure) => setActiveMiningModal(structure)}
                        toastMessage={toastMessage} 
                    />
                    {panelNotificationItem && <NewItemModal item={panelNotificationItem} onClose={() => setPanelNotificationItem(null)} />}
                </div>
            </div>
          )}
          {activePanel === 'farm' && actionableTile && playerCharacter && mapData && (
            <FarmPanel tile={actionableTile.tile} mapData={mapData} npcs={visibleNpcs} playerCharacter={playerCharacter} onClose={() => setActivePanel(null)} onBuy={onBuyItem} onSell={onSellItem} useLlm={useLlmForDescriptions} season={season} />
          )}
        </main>
    );
};

export default MapViewport;