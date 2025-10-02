/**
 * components/ModalHub.tsx - Centralized component for rendering all application modals.
 */
import React, { useEffect, useCallback, lazy, Suspense } from 'react';
import { useUI } from '../contexts/UIContext';
import { useMap } from '../contexts/MapContext';
import { usePlayer } from '../contexts/PlayerContext';
import { useGame } from '../contexts/GameContext';
import { weatherService } from '../services/weatherService';
import { getDayOfYear } from '../utils/dateUtils';
import DevTooltip from './DevTooltip';
import SettingsPanel from './SettingsPanel';

// Lazy load heavy components for better initial load performance
const WorldMapModal = lazy(() => import('./WorldMapModal'));
const CharacterProfileModal = lazy(() => import('./CharacterProfileModal'));
const SettlementInfoModal = lazy(() => import('./SettlementInfoModal'));
const CombatModal = lazy(() => import('./CombatModal'));
const SkillsModal = lazy(() => import('./SkillsModal'));
const VictoryModal = lazy(() => import('./VictoryModal'));
const MapDetailsModal = lazy(() => import('./MapDetailsModal'));

// Keep only the most frequently used modals eager loaded
import EncounterModalUpdated from './EncounterModalUpdated';
import NpcModal from './NpcModal';
import TileInfoModal from './TileInfoModal';
import { isNpc, isAnimal } from '../types';
import { NpcEntity } from '../types';

// Lazy load all other modals for better initial load performance
const AnimalInfoModal = lazy(() => import('./AnimalInfoModal'));
const MiningModal = lazy(() => import('./MiningModal'));
const PointOfInterestModal = lazy(() => import('./PointOfInterestModal'));
const InteractionModal = lazy(() => import('./interiorMap').then(module => ({ default: module.InteractionModal })));
const LootModal = lazy(() => import('./LootModal'));
const LevelUpModal = lazy(() => import('./LevelUpModal'));
const PortraitModal = lazy(() => import('./portraits/PortraitModal'));
const CraftingModal = lazy(() => import('./CraftingModal'));
const AboutModal = lazy(() => import('./AboutModal'));
const DevBuildingModeModal = lazy(() => import('./DevBuildingModeModal'));
const TerrainStructureModal = lazy(() => import('./TerrainStructureModal'));
const ContainerModal = lazy(() => import('./ContainerModal'));
const POIToastModal = lazy(() => import('./POIToastModal'));
import { formatDateWithSeason } from '../utils/dateUtils';
import { SavedGame } from '../services/saveGameService';
import { questService } from '../services/questService';
import { eventService } from '../services/eventService';
import { PrimarySourceMetadata } from '../services/primarySourceService';
import { poiServiceHandler } from '../services/poiServiceHandler';

// Lazy load heavy data modals
const PrimarySourceModal = lazy(() => import('./PrimarySourceModal').then(module => ({ default: module.PrimarySourceModal })));
const NpcConfrontationModal = lazy(() => import('./NpcConfrontationModal'));
const DiseaseContractedModal = lazy(() => import('./DiseaseContractedModal'));
const CityHistoricalModal = lazy(() => import('./CityHistoricalModal').then(module => ({ default: module.CityHistoricalModal })));
import { processNpcReactions, ItemCollectionEvent } from '../services/npcAwarenessService';
import { updateCachedContents } from '../services/containerCacheService';
import { useState } from 'react';
import { entityHealthService } from '../services/entityHealthService';


const ModalHub: React.FC = () => {
    // State for NPC confrontation
    const [confrontationData, setConfrontationData] = useState<{
        npc: NpcEntity;
        item: any;
        dialogue: string;
    } | null>(null);

    const {
        hoveredDevData, pinnedDevData, isTooltipPinnedOpen, handleCondenseTooltip,
        tileInfoModalProps, setTileInfoModalProps,
        infoModalTarget, setInfoModalTarget,
        structureModalTarget, setStructureModalTarget,
        activeSettlementInfo, setActiveSettlementInfo,
        isSettingsModalOpen, setIsSettingsModalOpen,
        isAboutModalOpen, setIsAboutModalOpen,
        useLlmForDescriptions, setUseLlmForDescriptions,
        useLlmForCharacter, setUseLlmForCharacter,
        showDevTooltip, setShowDevTooltip,
        isTestModeEnabled, setIsTestModeEnabled,
        isDevBuildingModeOpen, setIsDevBuildingModeOpen,
        isWorldMapModalOpen, setIsWorldMapModalOpen,
        interactionModalData, setInteractionModalData, handleTakeItem,
        isSkillsModalOpen, setIsSkillsModalOpen, isSkillLoading, skillResult,
        isMapDetailsModalOpen, setIsMapDetailsModalOpen,
        encounterTarget, handleCloseEncounter, handleInitiateCombat,
        combatant, setCombatant, handleCombatVictory,
        victoryDetails, setVictoryDetails,
        isCharacterProfileModalOpen, setIsCharacterProfileModalOpen,
        lootModalData, handleLooting, handleCloseLootModal, onTakeCoins,
        handleVictoryClose,
        isLevelUpModalOpen, levelUpCharacter, handleLevelUp,
        isPortraitModalOpen, portraitModalCharacter, setIsPortraitModalOpen, setPortraitModalCharacter,
        isCraftingModalOpen, craftingModalData, handleExecuteCrafting, closeAllModals,
        activeMiningModal, setActiveMiningModal,
        activePoi, setActivePoi,
        poiToastData, setPoiToastData,
        containerModalData, setContainerModalData, showToast,
        selectedPrimarySource, setSelectedPrimarySource,
        diseaseContractedModalData, setDiseaseContractedModalData,
        cityHistoricalModalData, setCityHistoricalModalData
    } = useUI();

    const {
        mapDataCache, currentWorldCoords, initialGameSeed, handleSeedChangeFromSettings, mapData, npcs, setNpcs,
        enterSpecialMap, exitSpecialMap, isSpecialMap
    } = useMap();

    const {
        playerCharacter, onCharacterUpdate, isEnhancing,
        handleCharacterGeneration, handleEquipItem, handleUnequipItem,
        handleDropItem, handleConsumeItem, onUseCombatItem
    } = usePlayer();

    
    const { gameDate, currentZone, currentRegion, gameTimeHours, gameTimeMinutes, season, currentEra, climate, currentTimeOfDay } = useGame();

    // Initialize entity health service when map changes
    useEffect(() => {
        if (initialGameSeed) {
            entityHealthService.setCurrentMap(initialGameSeed.toString());
            console.log(`[EntityHealth] Set current map: ${initialGameSeed}`);
        }
    }, [initialGameSeed]);

    // Clear health data when leaving special maps
    useEffect(() => {
        return () => {
            if (isSpecialMap) {
                // Don't clear when in special maps as they're temporary
                return;
            }
            // Will clear when component unmounts (changing maps)
        };
    }, [isSpecialMap]);

    // Function to update a single NPC in the npcs array
    const handleUpdateNpc = useCallback((updatedNpc: NpcEntity) => {
        setNpcs(prevNpcs => prevNpcs.map(npc => 
            npc.id === updatedNpc.id ? updatedNpc : npc
        ));
    }, [setNpcs]);
    
    // Create current game state for saving
    const currentGameState = React.useMemo(() => {
        if (!playerCharacter || !mapData) return undefined;
        
        return {
            playerCharacter,
            mapData,
            mapSeed: initialGameSeed.toString(),
            currentLocation: { 
                x: playerCharacter.x || 0, 
                y: playerCharacter.y || 0 
            },
            year: gameDate.year,
            month: gameDate.month,
            day: gameDate.day,
            timeOfDay: gameTimeHours,
            gameMode: eventService.getGameMode()?.id || 'survival',
            zone: currentZone || 'Unknown',
            region: currentRegion || 'Unknown',
            mapArea: mapData.mapArea || mapData.name || 'Unknown',
            npcs: npcs,
            activeQuests: questService.getActiveQuests(),
            completedQuests: questService.getCompletedQuests(),
            eventHistory: eventService.getEventHistory(),
            isInSpecialMap: isSpecialMap,
            specialMapData: isSpecialMap ? mapData : undefined,
            playTime: 0 // TODO: Track actual play time
        };
    }, [playerCharacter, mapData, initialGameSeed, gameDate, gameTimeHours, currentZone, currentRegion, npcs, isSpecialMap]);
    
    // Handle loading a saved game
    const handleLoadGame = useCallback((save: SavedGame) => {
        console.log('[ModalHub] Loading saved game:', save.name);
        
        // Store the save data in localStorage for App.tsx to pick up
        localStorage.setItem('pendingSaveLoad', JSON.stringify(save));
        
        // Trigger a full page reload to reinitialize the game
        window.location.reload();
    }, []);
    
    // Add global keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // Don't trigger if typing in an input field
            if (e.target && (e.target as HTMLElement).tagName === 'INPUT') return;
            if (e.target && (e.target as HTMLElement).tagName === 'TEXTAREA') return;
            
            // D key to toggle DevTooltip on/off
            if ((e.key === 'd' || e.key === 'D') && !e.metaKey && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                setShowDevTooltip(prev => !prev);
            }
            
            // F5 key for quick save
            if (e.key === 'F5') {
                e.preventDefault(); // Prevent browser refresh
                
                if (currentGameState) {
                    // Import saveGameService dynamically to avoid circular dependencies
                    import('../services/saveGameService').then(({ saveGameService }) => {
                        const result = saveGameService.saveGame(
                            `Quick Save - ${new Date().toLocaleTimeString()}`,
                            currentGameState
                        );
                        
                        if (result.success) {
                            console.log('[ModalHub] Quick save successful');
                            // TODO: Show a toast notification
                        } else {
                            console.error('[ModalHub] Quick save failed:', result.error);
                        }
                    });
                }
            }
        };
        
        document.addEventListener('keydown', handleKeyPress);
        return () => {
            document.removeEventListener('keydown', handleKeyPress);
        };
    }, [setShowDevTooltip, currentGameState]);

    return (
        <>
            {showDevTooltip && (hoveredDevData || (pinnedDevData && isTooltipPinnedOpen)) && ( <DevTooltip hoveredData={hoveredDevData} pinnedData={pinnedDevData} isPinnedOpen={isTooltipPinnedOpen} onCondense={handleCondenseTooltip} /> )}
            {tileInfoModalProps && ( <TileInfoModal modalProps={tileInfoModalProps} onClose={() => setTileInfoModalProps(null)} /> )}
            {infoModalTarget && isNpc(infoModalTarget) && <NpcModal npc={infoModalTarget} onClose={() => setInfoModalTarget(null)}/>}
            {infoModalTarget && isAnimal(infoModalTarget) && (
                <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
                    <AnimalInfoModal animal={infoModalTarget} onClose={() => setInfoModalTarget(null)}/>
                </Suspense>
            )}
            {isAboutModalOpen && (
                <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
                    <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />
                </Suspense>
            )}
            {isDevBuildingModeOpen && (
                <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
                    <DevBuildingModeModal isOpen={isDevBuildingModeOpen} onClose={() => setIsDevBuildingModeOpen(false)} />
                </Suspense>
            )}
            {isSettingsModalOpen && ( 
                <SettingsPanel 
                    isOpen={isSettingsModalOpen} 
                    onClose={() => setIsSettingsModalOpen(false)} 
                    currentSeed={initialGameSeed} 
                    onSeedChange={handleSeedChangeFromSettings} 
                    showDevTooltip={showDevTooltip} 
                    onToggleDevTooltip={() => setShowDevTooltip(p => !p)} 
                    useLlmForDescriptions={useLlmForDescriptions} 
                    onToggleLlmForDescriptions={() => setUseLlmForDescriptions(p => !p)} 
                    useLlmForCharacter={useLlmForCharacter} 
                    onToggleLlmForCharacter={() => setUseLlmForCharacter(p => !p)} 
                    isTestModeEnabled={isTestModeEnabled} 
                    onToggleTestMode={() => setIsTestModeEnabled(p => !p)} 
                    isDevBuildingModeOpen={isDevBuildingModeOpen} 
                    onToggleDevBuildingMode={() => setIsDevBuildingModeOpen(p => !p)} 
                    playerCharacter={playerCharacter} 
                    mapData={mapData} 
                    currentZone={currentZone} 
                    currentYear={gameDate.year}
                    onLoadGame={handleLoadGame}
                    currentGameState={currentGameState}
                /> 
            )}
            {isWorldMapModalOpen && (
                <Suspense fallback={
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-slate-800 p-6 rounded-lg shadow-xl border border-slate-600">
                            <div className="flex items-center gap-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                <span className="text-gray-200">Loading World Map...</span>
                            </div>
                        </div>
                    </div>
                }>
                    <WorldMapModal isOpen={isWorldMapModalOpen} onClose={() => setIsWorldMapModalOpen(false)} cachedMaps={mapDataCache} currentWorldCoords={currentWorldCoords} />
                </Suspense>
            )}
            {interactionModalData && (
                <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
                    <InteractionModal {...interactionModalData} onClose={() => setInteractionModalData(null)} onTakeItem={(item) => handleTakeItem(item, interactionModalData.entityId)} />
                </Suspense>
            )}
            <Suspense fallback={<div>Loading...</div>}>
                <SkillsModal isOpen={isSkillsModalOpen} isLoading={isSkillLoading} result={skillResult} onClose={() => setIsSkillsModalOpen(false)} />
            </Suspense>
            {isMapDetailsModalOpen && mapData && (
                <Suspense fallback={<div>Loading...</div>}>
                    <MapDetailsModal isOpen={isMapDetailsModalOpen} onClose={() => setIsMapDetailsModalOpen(false)} mapData={mapData} />
                </Suspense>
            )}
            {encounterTarget && playerCharacter && mapData && (
              <EncounterModalUpdated
                target={encounterTarget}
                playerCharacter={playerCharacter}
                allNpcs={npcs}
                mapData={(() => {
                    // Enhance mapData with real time and weather information
                    const enhancedMapData = { ...mapData };

                    // Add time properties
                    enhancedMapData.timeOfDay = currentTimeOfDay;
                    enhancedMapData.dayOfYear = getDayOfYear(gameDate);

                    // Calculate real weather based on current conditions
                    const mapCenterX = Math.floor(mapData.tiles[0].length / 2);
                    const mapCenterY = Math.floor(mapData.tiles.length / 2);
                    const centerTile = mapData.tiles[mapCenterY]?.[mapCenterX];

                    if (centerTile) {
                        const weather = weatherService.getWeather(
                            mapData.climate || climate,
                            centerTile.biome,
                            season,
                            currentTimeOfDay,
                            centerTile.altitude || 0.5,
                            getDayOfYear(gameDate),
                            { x: mapCenterX, y: mapCenterY }
                        );
                        enhancedMapData.currentWeather = weather;
                    }

                    return enhancedMapData;
                })()}
                onClose={handleCloseEncounter}
                onInitiateCombat={handleInitiateCombat}
                onOpenInfo={(target) => {
                  handleCloseEncounter([]);
                  setInfoModalTarget(target);
                }}
                onUpdateNpc={handleUpdateNpc}
              />
            )}
            {combatant && playerCharacter && mapData && (
                <Suspense fallback={<div>Loading...</div>}>
                    <CombatModal
                        combatant={combatant}
                        playerCharacter={playerCharacter}
                        onClose={() => setCombatant(null)}
                        onVictory={handleCombatVictory}
                        onUseCombatItem={onUseCombatItem}
                    inventory={playerCharacter.inventory}
                    onCharacterUpdate={onCharacterUpdate}
                    onNpcUpdate={(npcId, updates) => {
                        // Update the NPC in the main array
                        setNpcs(prev => prev.map(npc =>
                            npc.id === npcId
                                ? { ...npc, ...updates }
                                : npc
                        ));
                    }}
                    mapData={mapData}
                    gameTime={gameTimeHours !== undefined && gameTimeMinutes !== undefined ?
                        { hours: gameTimeHours, minutes: gameTimeMinutes } : undefined}
                    weather={mapData && climate && season && timeOfDay ?
                        weatherService.getWeather(
                            climate,
                            mapData.tiles?.[playerCharacter.y]?.[playerCharacter.x]?.biome || 'GRASSLAND',
                            season,
                            timeOfDay
                        ) : undefined}
                    culturalZone={mapData.culturalZone}
                />
                </Suspense>
            )}
            {victoryDetails && (
                <Suspense fallback={<div>Loading...</div>}>
                    <VictoryModal {...victoryDetails} onClose={handleVictoryClose} />
                </Suspense>
            )}
            {lootModalData && (
                <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
                    <LootModal opponent={lootModalData.opponent} onTakeItem={handleLooting} onClose={handleCloseLootModal} onTakeCoins={onTakeCoins} />
                </Suspense>
            )}
            {structureModalTarget && mapData && (
                <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
                    <TerrainStructureModal structure={structureModalTarget} mapData={mapData} npcs={npcs} onClose={() => setStructureModalTarget(null)} gameTimeHours={gameTimeHours} season={season} playerCharacter={playerCharacter} currentLocation={currentRegion} formattedDate={gameDate} onEnterSpecialMap={enterSpecialMap} onCharacterUpdate={onCharacterUpdate as any} />
                </Suspense>
            )}
            {activeSettlementInfo && mapData && (
                <Suspense fallback={
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-slate-800 p-6 rounded-lg shadow-xl border border-slate-600">
                            <div className="flex items-center gap-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                <span className="text-gray-200">Loading Settlement Info...</span>
                            </div>
                        </div>
                    </div>
                }>
                    <SettlementInfoModal tile={activeSettlementInfo.tile} mapData={mapData} npcs={npcs} onClose={() => setActiveSettlementInfo(null)} gameTimeHours={gameTimeHours} season={season} playerCharacter={playerCharacter} />
                </Suspense>
            )}
            {activeMiningModal && playerCharacter && (
                <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
                    <MiningModal structure={activeMiningModal} playerCharacter={playerCharacter} onClose={() => setActiveMiningModal(null)} onMine={() => {}} isMining={false} mineResult={null} />
                </Suspense>
            )}
            {activePoi && mapData && (
                <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
                    <PointOfInterestModal structure={activePoi} mapData={mapData} onClose={() => setActivePoi(null)} onEnterSpecialMap={enterSpecialMap} />
                </Suspense>
            )}
            {isCharacterProfileModalOpen && playerCharacter && (
                <Suspense fallback={
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-slate-800 p-6 rounded-lg shadow-xl border border-slate-600">
                            <div className="flex items-center gap-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                <span className="text-gray-200">Loading Character Profile...</span>
                            </div>
                        </div>
                    </div>
                }>
                    <CharacterProfileModal
                        isOpen={isCharacterProfileModalOpen}
                        onClose={() => setIsCharacterProfileModalOpen(false)}
                        character={playerCharacter}
                        onCharacterUpdate={onCharacterUpdate as any}
                        onRegenerate={() => handleCharacterGeneration(useLlmForCharacter)}
                        isEnhancing={isEnhancing}
                        onEquipItem={handleEquipItem}
                        onUnequipItem={handleUnequipItem}
                        onDropItem={handleDropItem}
                        onConsumeItem={handleConsumeItem}
                        date={String(gameDate.year)}
                        location={currentZone}
                    />
                </Suspense>
            )}
            {isLevelUpModalOpen && levelUpCharacter && (
                <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
                    <LevelUpModal character={levelUpCharacter} onLevelUp={handleLevelUp} />
                </Suspense>
            )}
            {isPortraitModalOpen && portraitModalCharacter && (
                <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
                    <PortraitModal
                        character={portraitModalCharacter}
                        onClose={() => { setIsPortraitModalOpen(false); setPortraitModalCharacter(null); }}
                    />
                </Suspense>
            )}
            {isCraftingModalOpen && craftingModalData && (
                <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
                    <CraftingModal
                        isOpen={isCraftingModalOpen}
                        onClose={() => closeAllModals()}
                        items={craftingModalData.items}
                        method={craftingModalData.method}
                        onExecuteCrafting={handleExecuteCrafting}
                    />
                </Suspense>
            )}
            {containerModalData && (
                <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
                    <ContainerModal
                    isOpen={!!containerModalData}
                    onClose={() => setContainerModalData(null)}
                    containerType={containerModalData.containerType}
                    contents={containerModalData.contents}
                    containerPosition={containerModalData.position}
                    isAnimating={containerModalData.isAnimating}
                    onTakeItem={(item) => {
                        // Handle taking individual items
                        if (playerCharacter && containerModalData) {
                            // Add item to inventory
                            onCharacterUpdate(prev => {
                                if (!prev) return prev;
                                const newInventory = [...(prev.inventory || []), item];
                                return { ...prev, inventory: newInventory };
                            });

                            // Determine if this is theft
                            const isTheft = containerModalData.contents.ownerNpc || containerModalData.contents.isValuable;
                            const action = isTheft ? 'stolen' : 'found';

                            // Check NPC awareness if in special map with NPCs
                            console.log('[Theft Detection] Checking conditions:', {
                                isSpecialMap,
                                npcCount: npcs?.length || 0,
                                isTheft,
                                isValuable: containerModalData.contents.isValuable,
                                ownerNpc: containerModalData.contents.ownerNpc,
                                playerPos: containerModalData.position,
                                tilesExist: !!mapData?.tiles
                            });

                            if (isSpecialMap && npcs && npcs.length > 0 && isTheft) {
                                // Debug NPC positions
                                npcs.forEach((npc, i) => {
                                    console.log(`[Theft Detection] NPC ${i}: ${npc.name} at (${npc.x}, ${npc.y}) role: ${npc.role}`);
                                });

                                const collectionEvent: ItemCollectionEvent = {
                                    playerPos: containerModalData.position || { x: 0, y: 0 },
                                    item,
                                    containerOwner: containerModalData.contents.ownerNpc,
                                    isTheft,
                                    action
                                };

                                console.log('[Theft Detection] Processing event:', collectionEvent);

                                // Process NPC reactions
                                const reactionResult = processNpcReactions(
                                    collectionEvent,
                                    npcs,
                                    mapData?.tiles || [],
                                    playerCharacter.reputation || 0
                                );

                                console.log('[Theft Detection] Reaction result:', reactionResult);

                                // Update reputation if needed
                                if (reactionResult.reputationChange !== 0) {
                                    onCharacterUpdate(prev => {
                                        if (!prev) return prev;
                                        return {
                                            ...prev,
                                            reputation: (prev.reputation || 0) + reactionResult.reputationChange
                                        };
                                    });
                                    showToast(`Reputation ${reactionResult.reputationChange > 0 ? '+' : ''}${reactionResult.reputationChange}`, 'warning');
                                }

                                // Show confrontation if caught
                                const confrontingNpc = reactionResult.reactions.find(r => r.reactionType === 'confronting');
                                if (confrontingNpc) {
                                    setConfrontationData({
                                        npc: confrontingNpc.npc,
                                        item,
                                        dialogue: confrontingNpc.dialogue || 'Stop! You can\'t take that!'
                                    });
                                }
                            }

                            // Show toast notification
                            showToast(`You ${action} ${item.name}`, isTheft ? 'warning' : 'success');

                            // Update container cache if mapId provided
                            if (containerModalData.mapId && containerModalData.position) {
                                const newItems = containerModalData.contents.items.filter(i => i.id !== item.id);
                                updateCachedContents(
                                    containerModalData.mapId,
                                    containerModalData.position.x,
                                    containerModalData.position.y,
                                    newItems
                                );
                            }

                            // Remove item from container (handled in the modal state)
                            setContainerModalData(prev => {
                                if (!prev) return prev;
                                const newItems = prev.contents.items.filter(i => i.id !== item.id);
                                if (newItems.length === 0) {
                                    // Close modal if no items left
                                    return null;
                                }
                                return {
                                    ...prev,
                                    contents: {
                                        ...prev.contents,
                                        items: newItems
                                    }
                                };
                            });
                        }
                    }}
                    onTakeAll={() => {
                        // Handle taking all items
                        if (playerCharacter && containerModalData) {
                            const itemCount = containerModalData.contents.items.length;
                            const allItems = [...containerModalData.contents.items];

                            // Add all items to inventory
                            allItems.forEach(item => {
                                onCharacterUpdate(prev => {
                                    if (!prev) return prev;
                                    const newInventory = [...(prev.inventory || []), item];
                                    return { ...prev, inventory: newInventory };
                                });
                            });

                            // Determine if this is theft
                            const isTheft = containerModalData.contents.ownerNpc || containerModalData.contents.isValuable;
                            const action = isTheft ? 'stole' : 'took';

                            // Check NPC awareness if in special map with NPCs and stealing valuable items
                            if (isSpecialMap && npcs && npcs.length > 0 && isTheft) {
                                // Find the most valuable item for the confrontation
                                const mostValuableItem = allItems.reduce((prev, curr) =>
                                    curr.value > prev.value ? curr : prev, allItems[0]
                                );

                                const collectionEvent: ItemCollectionEvent = {
                                    playerPos: containerModalData.position || { x: 0, y: 0 },
                                    item: mostValuableItem,
                                    containerOwner: containerModalData.contents.ownerNpc,
                                    isTheft,
                                    action: 'stolen'
                                };

                                // Process NPC reactions
                                const reactionResult = processNpcReactions(
                                    collectionEvent,
                                    npcs,
                                    mapData?.tiles || [],
                                    playerCharacter.reputation || 0
                                );

                                // Update reputation if needed
                                if (reactionResult.reputationChange !== 0) {
                                    onCharacterUpdate(prev => {
                                        if (!prev) return prev;
                                        return {
                                            ...prev,
                                            reputation: (prev.reputation || 0) + reactionResult.reputationChange
                                        };
                                    });
                                    showToast(`Reputation ${reactionResult.reputationChange > 0 ? '+' : ''}${reactionResult.reputationChange}`, 'warning');
                                }

                                // Show confrontation if caught
                                const confrontingNpc = reactionResult.reactions.find(r =>
                                    r.reactionType === 'confronting' || r.reactionType === 'saw_theft'
                                );
                                if (confrontingNpc) {
                                    setConfrontationData({
                                        npc: confrontingNpc.npc,
                                        item: mostValuableItem,
                                        dialogue: confrontingNpc.dialogue || 'Stop! You can\'t take those!'
                                    });
                                }
                            }

                            // Update container cache if mapId provided
                            if (containerModalData.mapId && containerModalData.position) {
                                updateCachedContents(
                                    containerModalData.mapId,
                                    containerModalData.position.x,
                                    containerModalData.position.y,
                                    [] // Container is now empty
                                );
                            }

                            // Show toast notification
                            showToast(`You ${action} ${itemCount} item${itemCount > 1 ? 's' : ''}`, isTheft ? 'warning' : 'success');

                            // Close modal
                            setContainerModalData(null);
                        }
                    }}
                    />
                </Suspense>
            )}
            {/* POI Toast Modal - Uses UI State */}
            <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
                <POIToastModal 
                onEnterSpecialMap={enterSpecialMap}
                mapData={mapData}
                currentEra={currentEra}
                currentCulturalZone={mapData?.culturalZone}
                />
            </Suspense>
            {selectedPrimarySource && (
                <Suspense fallback={
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-slate-800 p-6 rounded-lg shadow-xl border border-slate-600">
                            <div className="flex items-center gap-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                <span className="text-gray-200">Loading Primary Source...</span>
                            </div>
                        </div>
                    </div>
                }>
                    <PrimarySourceModal
                        source={selectedPrimarySource}
                        onClose={() => setSelectedPrimarySource(null)}
                        currentTile={(() => {
                            // Try different coordinate sources
                            let playerX = playerCharacter?.x;
                            let playerY = playerCharacter?.y;

                            // If player coordinates are undefined, try currentWorldCoords
                            if ((playerX === null || playerX === undefined) && currentWorldCoords) {
                                playerX = currentWorldCoords.x;
                                playerY = currentWorldCoords.y;
                            }

                            if (!mapData || playerX === null || playerY === null || playerX === undefined || playerY === undefined) {
                                return { biome: 'GRASSLAND', climate: mapData?.climate || climate, season: season };
                            }

                            const tile = mapData.tiles[playerY]?.[playerX];
                            const biome = tile?.biome || 'GRASSLAND';
                            return {
                                biome: biome,
                                climate: mapData?.climate || climate,
                                season: season
                            };
                        })()}
                        culturalZone={mapData?.culturalZone}
                        weather={(() => {
                            // Use the same approach as MapViewport - map center for consistent weather
                            if (!mapData || !climate || !season) return undefined;

                            const mapCenterX = Math.floor(mapData.tiles[0].length / 2);
                            const mapCenterY = Math.floor(mapData.tiles.length / 2);
                            const centerTile = mapData.tiles[mapCenterY][mapCenterX];

                            if (centerTile) {
                                const weather = weatherService.getWeather(
                                    mapData.climate || climate,
                                    centerTile.biome,
                                    season,
                                    currentTimeOfDay,
                                    centerTile.altitude || 0.5,
                                    getDayOfYear(gameDate),
                                    { x: mapCenterX, y: mapCenterY }
                                );
                                return weather;
                            }
                            return undefined;
                        })()}
                        gameTime={gameTimeHours !== undefined && gameTimeMinutes !== undefined ?
                            { hours: gameTimeHours, minutes: gameTimeMinutes } : undefined}
                        showToast={showToast}
                    />
                </Suspense>
            )}
            {confrontationData && (
                <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
                    <NpcConfrontationModal
                    npc={confrontationData.npc}
                    item={confrontationData.item}
                    dialogue={confrontationData.dialogue}
                    onClose={() => setConfrontationData(null)}
                    playerGold={playerCharacter?.inventory?.filter(i => i.id === 'COIN').reduce((sum, coin) => sum + (coin.quantity || 1), 0) || 0}
                    onPayFine={(amount) => {
                        // Deduct gold from player
                        if (playerCharacter) {
                            onCharacterUpdate(prev => {
                                if (!prev) return prev;
                                // Remove coins from inventory
                                const updatedInventory = prev.inventory || [];
                                let remainingToRemove = amount;
                                const newInventory = updatedInventory.filter(item => {
                                    if (item.id === 'COIN' && remainingToRemove > 0) {
                                        const quantity = item.quantity || 1;
                                        if (quantity <= remainingToRemove) {
                                            remainingToRemove -= quantity;
                                            return false; // Remove this coin stack
                                        } else {
                                            item.quantity = quantity - remainingToRemove;
                                            remainingToRemove = 0;
                                            return true; // Keep with reduced quantity
                                        }
                                    }
                                    return true;
                                });
                                return { ...prev, inventory: newInventory };
                            });
                            showToast(`Paid ${amount} gold in fines`, 'info');
                        }
                        setConfrontationData(null);
                    }}
                    onFight={() => {
                        // Initiate combat with the confronting NPC
                        if (confrontationData.npc) {
                            handleInitiateCombat(confrontationData.npc);
                        }
                        setConfrontationData(null);
                    }}
                    onSurrender={() => {
                        // Surrender - lose items and reputation
                        if (playerCharacter) {
                            onCharacterUpdate(prev => {
                                if (!prev) return prev;
                                return {
                                    ...prev,
                                    reputation: (prev.reputation || 0) - 20
                                };
                            });
                            showToast('You surrendered and were taken to jail', 'error');
                        }
                        setConfrontationData(null);
                    }}
                    onTryToEscape={() => {
                        // Try to escape - random chance based on agility
                        const escapeChance = Math.random();
                        const agilityBonus = (playerCharacter?.stats?.agility || 10) / 100;

                        if (escapeChance < 0.5 + agilityBonus) {
                            showToast('You escaped successfully!', 'success');
                        } else {
                            showToast('You failed to escape and were caught!', 'error');
                            // Initiate combat or apply penalty
                            if (confrontationData.npc) {
                                handleInitiateCombat(confrontationData.npc);
                            }
                        }
                        setConfrontationData(null);
                    }}
                    />
                </Suspense>
            )}
            {diseaseContractedModalData?.isOpen && playerCharacter && (
                <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
                    <DiseaseContractedModal
                    isOpen={diseaseContractedModalData.isOpen}
                    onClose={() => setDiseaseContractedModalData(null)}
                    disease={diseaseContractedModalData.disease}
                    playerCharacter={playerCharacter}
                    gameDate={gameDate}
                    />
                </Suspense>
            )}
            {cityHistoricalModalData && (
                <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
                    <CityHistoricalModal
                        isOpen={!!cityHistoricalModalData}
                        onClose={() => setCityHistoricalModalData(null)}
                        cityName={cityHistoricalModalData.cityName}
                        cityDescription={cityHistoricalModalData.cityDescription}
                        nearbyNpcs={npcs}
                    />
                </Suspense>
            )}
        </>
    );
}

export default ModalHub;