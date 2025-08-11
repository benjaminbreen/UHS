/**
 * hooks/useUIState.ts - Custom hook to manage all UI-related state and logic.
 */
import { useState, useCallback, useMemo, useEffect } from 'react';
import { usePlayer } from '../contexts/PlayerContext';
import { useMap } from '../contexts/MapContext';
import { useGame } from '../contexts/GameContext';
import {
    DevTooltipDisplayData, TileInfoModalProps, SkillResult, Item,
    EncounterableEntity, Tile, LensMode, TerrainStructure, isNpc, isAnimal, DialogueEntry,
    PlayerContext, ForageSkillResult, ChopSkillResult, SkillID, NarrationMessage, AmbianceContext, NpcEntity,
    LootModalData, PlayerCharacter, PortraitModalData, CraftingModalData, CraftingResult, DigSkillResult
} from '../types';
import { LogService } from '../services/logService';
import { createItemInstance, addItemToInventory } from '../utils/inventoryUtils';
import { executeSkill } from '../services/skillService';
import { generateDmResponse, summarizeConversation } from '../services/llmService';
import { executeCrafting } from '../services/craftingService';
import { parseDateString } from '../utils/dateUtils';
import { ANIMAL_DATA } from '../constants/index';
import { isSafari } from '../utils/safariUtils';

export interface VictoryDetails {
    xpGained: number;
    itemsGained: Item[];
    opponentName: string;
    opponentEmoji: string;
    opponent: EncounterableEntity;
}

export const useUIState = () => {
    // Consume contexts for state and setters
    const { playerCharacter, setPlayerCharacter, controlledIconX, controlledIconY, viewMode, interiorViewState, interiorMapPlayerPos, onBuyItem, onSellItem, addItemsToInventory, onCharacterUpdate, removeItemsFromInventory } = usePlayer();
    const { localArea, mapData, currentMapArchetype, currentMapClimate, currentMapSeed, animals, npcs, terrainStructures, setNpcs, setAnimals, removeVegetation, updateMineralDeposit } = useMap();
    const { 
        gameDate, formattedTime, addGameLogEntry, gameTimeHours,
        narrationHistory, setNarrationHistory, playerInput, onPlayerInputChange: setPlayerInput,
        isNarratorLoading, setIsNarratorLoading, currentTimeOfDay,
        currentZone
    } = useGame();

    // UI State
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
    const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);
    const [isWorldMapModalOpen, setIsWorldMapModalOpen] = useState<boolean>(false);
    const [isCharacterProfileModalOpen, setIsCharacterProfileModalOpen] = useState<boolean>(false);
    const [isMapDetailsModalOpen, setIsMapDetailsModalOpen] = useState<boolean>(false);
    const [isLevelUpModalOpen, setIsLevelUpModalOpen] = useState<boolean>(false);
    const [levelUpCharacter, setLevelUpCharacter] = useState<PlayerCharacter | null>(null);
    const [isPortraitModalOpen, setIsPortraitModalOpen] = useState<boolean>(false);
    const [portraitModalCharacter, setPortraitModalCharacter] = useState<PlayerCharacter | NpcEntity | null>(null);
    const [isCraftingModalOpen, setIsCraftingModalOpen] = useState(false);
    const [craftingModalData, setCraftingModalData] = useState<CraftingModalData | null>(null);
    
    // Dev Tooltip
    const [hoveredDevData, setHoveredDevData] = useState<DevTooltipDisplayData | null>(null);
    const [pinnedDevData, setPinnedDevData] = useState<DevTooltipDisplayData | null>(null);
    const [isTooltipPinnedOpen, setIsTooltipPinnedOpen] = useState<boolean>(false);
    const [showDevTooltip, setShowDevTooltip] = useState<boolean>(false);
    const [useLlmForDescriptions, setUseLlmForDescriptions] = useState(false);
    const [useLlmForCharacter, setUseLlmForCharacter] = useState(false);
    const [isTestModeEnabled, setIsTestModeEnabled] = useState<boolean>(false);
    const [isDevBuildingModeOpen, setIsDevBuildingModeOpen] = useState<boolean>(false);
    const [debugSettings, setDebugSettings] = useState({
        showFPS: true, // Show FPS when debug mode is on
        showRenderCount: true,
        disableBlurEffects: false,
        disableAnimations: false,
        disableShadows: false,
        disableParticles: false,
        reduceSVGComplexity: false,
        disableCanvasSmoothing: false,
        throttleAnimationFPS: false,
        showMemoryUsage: true,
        logPerformanceMetrics: false
    });

    // Left Sidebar
    const [isLeftSidebarExpanded, setIsLeftSidebarExpanded] = useState<boolean>(true);
    const [activeMapSubTab, setActiveMapSubTab] = useState<'analysis' | 'overview' | 'npcs' | 'animals'>('overview');
    const [activeLens, setActiveLens] = useState<LensMode>('none');
    
    // Modal-specific data
    const [tileInfoModalProps, setTileInfoModalProps] = useState<TileInfoModalProps | null>(null);
    const [infoModalTarget, setInfoModalTarget] = useState<EncounterableEntity | null>(null);
    const [structureModalTarget, setStructureModalTarget] = useState<TerrainStructure | null>(null);
    const [activeSettlementInfo, setActiveSettlementInfo] = useState<{ tile: Tile } | null>(null);
    const [activeMarketplaceModal, _setActiveMarketplaceModal] = useState<{ tile: Tile } | null>(null);
    const [activeCityModal, _setActiveCityModal] = useState<{ tile: Tile } | null>(null);
    const [activeRuinModal, setActiveRuinModal] = useState<{ tile: Tile } | null>(null);
    const [activeMiningModal, setActiveMiningModal] = useState<TerrainStructure | null>(null);
    const [interactionModalData, setInteractionModalData] = useState<any>(null); // For container loot
    const [encounterTarget, setEncounterTarget] = useState<EncounterableEntity | null>(null);
    const [combatant, setCombatant] = useState<EncounterableEntity | null>(null);
    const [victoryDetails, setVictoryDetails] = useState<VictoryDetails | null>(null);
    const [lootModalData, setLootModalData] = useState<LootModalData | null>(null);
    const [activePoi, setActivePoi] = useState<TerrainStructure | null>(null);
    
    // Skills
    const [isSkillsModalOpen, setIsSkillsModalOpen] = useState<boolean>(false);
    const [isSkillLoading, setIsSkillLoading] = useState<boolean>(false);
    const [skillResult, setSkillResult] = useState<SkillResult | null>(null);
    
    // Notifications
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [panelNotificationItem, setPanelNotificationItem] = useState<Item | null>(null);

    const setActiveMarketplaceModal = useCallback((data: { tile: Tile } | null) => {
        _setActiveMarketplaceModal(data);
    }, []);

    const setActiveCityModal = useCallback((data: { tile: Tile } | null) => {
        _setActiveCityModal(data);
    }, []);

    // Auto-enable blur disabling for Safari users for better performance
    useEffect(() => {
        if (isSafari()) {
            setDebugSettings(prev => ({
                ...prev,
                disableBlurEffects: true
            }));
            // Apply the class immediately
            document.body.classList.add('disable-blur');
            console.log('[Performance] Safari detected - automatically disabling blur effects');
        }
    }, []);

    // Memoize if any modal is open
    const isAnyModalOpen = useMemo(() =>
        isSettingsModalOpen || isAboutModalOpen || isWorldMapModalOpen || isCharacterProfileModalOpen || isMapDetailsModalOpen ||
        !!tileInfoModalProps || !!infoModalTarget || !!structureModalTarget || !!activeSettlementInfo ||
        !!interactionModalData || isSkillsModalOpen || !!encounterTarget || !!combatant || !!victoryDetails || !!lootModalData || !!activeMarketplaceModal || !!activeCityModal || isLevelUpModalOpen || isPortraitModalOpen || isCraftingModalOpen || !!activeMiningModal || !!activePoi,
        [isSettingsModalOpen, isAboutModalOpen, isWorldMapModalOpen, isCharacterProfileModalOpen, isMapDetailsModalOpen,
         tileInfoModalProps, infoModalTarget, structureModalTarget, activeSettlementInfo,
         interactionModalData, isSkillsModalOpen, encounterTarget, combatant, victoryDetails, lootModalData, activeMarketplaceModal, activeCityModal, isLevelUpModalOpen, isPortraitModalOpen, isCraftingModalOpen, activeMiningModal, activePoi]
    );

    // Handlers
    const showToast = useCallback((message: string) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(null), 3000);
    }, []);

    const closeAllModals = useCallback(() => {
        setIsSettingsModalOpen(false);
        setIsWorldMapModalOpen(false);
        setIsCharacterProfileModalOpen(false);
        setIsMapDetailsModalOpen(false);
        setTileInfoModalProps(null);
        setInfoModalTarget(null);
        setStructureModalTarget(null);
        setActiveSettlementInfo(null);
        setInteractionModalData(null);
        setIsSkillsModalOpen(false);
        setEncounterTarget(null);
        setCombatant(null);
        setVictoryDetails(null);
        setLootModalData(null);
        setActiveMarketplaceModal(null);
        setActiveCityModal(null);
        setIsLevelUpModalOpen(false);
        setIsPortraitModalOpen(false);
        setPortraitModalCharacter(null);
        setIsCraftingModalOpen(false);
        setCraftingModalData(null);
        setActiveMiningModal(null);
        setActivePoi(null);
    }, []);
    
    useEffect(() => {
        if (playerCharacter && playerCharacter.experience >= playerCharacter.maxExperience && !isLevelUpModalOpen && !combatant) {
            setLevelUpCharacter(playerCharacter);
            setIsLevelUpModalOpen(true);
        }
    }, [playerCharacter, isLevelUpModalOpen, combatant]);

    const handleLevelUp = useCallback((statToUpgrade?: keyof PlayerCharacter['stats'], newProfession?: string) => {
        onCharacterUpdate(prev => {
            if (!prev || !statToUpgrade) return prev;
    
            const newStats = { ...prev.stats };
            newStats[statToUpgrade] = (newStats[statToUpgrade] || 0) + 1;
            newStats.attack = (newStats.attack || 0) + 1;
            newStats.defense = (newStats.defense || 0) + 1;
    
            const newMaxExperience = Math.floor(prev.maxExperience * 1.5);
            const newMaxHealth = prev.maxHealth + 10;
    
            return {
                ...prev,
                level: prev.level + 1,
                experience: 0,
                maxExperience: newMaxExperience,
                health: newMaxHealth, // Heal on level up
                maxHealth: newMaxHealth,
                stats: newStats,
                profession: newProfession || prev.profession
            };
        });
        setIsLevelUpModalOpen(false);
        setLevelUpCharacter(null);
        showToast(`Leveled up to ${playerCharacter!.level + 1}!`);
    }, [onCharacterUpdate, showToast, playerCharacter]);

    const handleDevHover = useCallback((data: DevTooltipDisplayData | null) => {
        if (!isTooltipPinnedOpen) {
            setHoveredDevData(data);
        }
    }, [isTooltipPinnedOpen]);

    const togglePinnedTooltip = useCallback(() => {
        setIsTooltipPinnedOpen(prev => {
            const newPinState = !prev;
            if (newPinState && hoveredDevData) {
                setPinnedDevData(hoveredDevData);
            } else {
                setPinnedDevData(null);
            }
            return newPinState;
        });
    }, [hoveredDevData]);

    const handleCondenseTooltip = useCallback(() => {
        setIsTooltipPinnedOpen(false);
        setPinnedDevData(null);
    }, []);
    
    const handleTakeItem = useCallback((item: Item, entityId: string) => {
        if (!playerCharacter) return;

        setPlayerCharacter(prev => {
            if (!prev) return null;
            return { ...prev, inventory: addItemToInventory(prev.inventory, item) };
        });

        setInteractionModalData((prev: any) => {
            if (!prev || prev.entityId !== entityId) return prev;
            return { ...prev, items: prev.items.filter((i: Item) => i.id !== item.id) };
        });
        
        addGameLogEntry(LogService.createItemAcquiredLog(item.name, item.quantity, `from a ${interactionModalData.title}`, gameDate, formattedTime));
        setPanelNotificationItem(item);
        setTimeout(() => setPanelNotificationItem(null), 2500);

    }, [playerCharacter, setPlayerCharacter, addGameLogEntry, gameDate, formattedTime, interactionModalData]);

    const onUseSkill = useCallback(async (skillId: SkillID) => {
        if (!playerCharacter || !mapData || controlledIconX === null || controlledIconY === null) return;
        
        setIsSkillsModalOpen(true);
        setIsSkillLoading(true);
        
        let contextTile: any;
        if(viewMode === 'interior' && interiorViewState) {
            const currentFloor = interiorViewState.maps.get(interiorViewState.currentFloor);
            if(currentFloor && interiorMapPlayerPos)
                contextTile = currentFloor.tiles[interiorMapPlayerPos.y][interiorMapPlayerPos.x];
        } else {
            contextTile = mapData.tiles[controlledIconY][controlledIconX];
        }

        const dateInfo = parseDateString(String(gameDate.year));
        
        const ambianceContext: AmbianceContext = {
            currentTile: contextTile,
            neighboringTiles: [],
            mapArchetype: currentMapArchetype,
            climate: currentMapClimate,
            timeOfDay: currentTimeOfDay,
            historicalEra: dateInfo.era,
            century: dateInfo.century,
            decade: dateInfo.decade,
            locationString: currentZone,
            mapSeed: currentMapSeed,
            gameHour: gameTimeHours,
            visibleLandDirection: null,
        };

        const playerContext: PlayerContext = {
            viewMode,
            currentTile: contextTile,
            ambianceContext,
            playerCharacter,
            animals,
            npcs,
            terrainStructures,
            playerX: controlledIconX,
            playerY: controlledIconY,
            mapData,
        };

        const result = await executeSkill(skillId, playerContext);
        
        if (result?.type === 'forage' && result.success && result.item) {
            // Use the item directly from the result (it's already created with custom names)
            addItemsToInventory([result.item]);
            setPanelNotificationItem(result.item);
            setTimeout(() => setPanelNotificationItem(null), 2500);
            
            // Remove vegetation if it was foraged from a bush
            if (result.entityToRemoveId) {
                removeVegetation(result.entityToRemoveId);
            }
        }
        
        if (result?.type === 'chop' && result.success && result.item) {
            addItemsToInventory([result.item]);
            setPanelNotificationItem(result.item);
            setTimeout(() => setPanelNotificationItem(null), 2500);
            if (result.entityToRemoveId) {
                removeVegetation(result.entityToRemoveId);
            }
        }

        if (result?.type === 'dig' && result.success) {
            if (result.item) {
                console.log("Dig result item:", result.item);
                addItemsToInventory([result.item]);
                setPanelNotificationItem(result.item);
                setTimeout(() => setPanelNotificationItem(null), 2500);
            } else {
                console.log("Dig succeeded but no item found:", result);
            }
            if (result.tileCoords && result.amountExtracted) {
                updateMineralDeposit(result.tileCoords.x, result.tileCoords.y, result.amountExtracted);
            }
        }

        if(result?.xpGained) {
            setPlayerCharacter(p => p ? { ...p, experience: p.experience + result.xpGained! } : p);
        }

        setSkillResult(result);
        setIsSkillLoading(false);
    }, [playerCharacter, mapData, controlledIconX, controlledIconY, viewMode, interiorViewState, interiorMapPlayerPos, gameDate, currentMapArchetype, currentMapClimate, currentTimeOfDay, currentZone, currentMapSeed, gameTimeHours, animals, npcs, terrainStructures, setPlayerCharacter, addItemsToInventory, removeVegetation, updateMineralDeposit]);

    const onSend = useCallback(async () => {
        if (!playerInput.trim() || !playerCharacter || !mapData || controlledIconX === null || controlledIconY === null) return;
        
        const userMessage: NarrationMessage = { sender: 'player', text: playerInput };
        setNarrationHistory(prev => [...prev, userMessage]);
        setPlayerInput('');
        setIsNarratorLoading(true);

        let contextTile: any;
        let interiorContext: any = undefined;
        
        if(viewMode === 'interior' && interiorViewState && interiorMapPlayerPos) {
             const currentFloor = interiorViewState.maps.get(interiorViewState.currentFloor);
             if (currentFloor) {
                 contextTile = currentFloor.tiles[interiorMapPlayerPos.y][interiorMapPlayerPos.x];
                 
                 // Create interior context information for the LLM
                 interiorContext = {
                     buildingType: currentFloor.buildingType || 'building',
                     buildingName: currentFloor.description || `${currentFloor.buildingType || 'Building'}`,
                     layoutName: currentFloor.npcs?.[0] ? 
                         (currentFloor.buildingType === 'palace' ? 'Royal Palace' :
                          currentFloor.buildingType === 'holy_place' ? 'Sacred Temple' : 
                          'Interior Space') : 'Simple Interior'
                 };
                 
                 // Try to find religion and cultural info from NPCs or building data
                 if (currentFloor.npcs && currentFloor.npcs.length > 0) {
                     const firstNpc = currentFloor.npcs[0];
                     if (firstNpc.religion) interiorContext.religion = firstNpc.religion;
                     if (firstNpc.culturalZone) interiorContext.culturalZone = firstNpc.culturalZone;
                 }
             }
        } else {
            contextTile = mapData.tiles[controlledIconY][controlledIconX];
        }

        const dateInfo = parseDateString(String(gameDate.year));
        const ambianceContext: AmbianceContext = { currentTile: contextTile, neighboringTiles: [], mapArchetype: currentMapArchetype, climate: currentMapClimate, timeOfDay: currentTimeOfDay, historicalEra: dateInfo.era, century: dateInfo.century, locationString: currentZone, mapSeed: currentMapSeed, gameHour: gameTimeHours, visibleLandDirection: null };

        const context: PlayerContext = {
            viewMode,
            currentTile: contextTile,
            ambianceContext,
            playerCharacter,
            animals,
            npcs,
            terrainStructures,
            playerX: controlledIconX,
            playerY: controlledIconY,
            mapData,
            interiorContext
        };
        
        try {
            const responseText = await generateDmResponse(playerInput, context);
            setNarrationHistory(prev => [...prev, { sender: 'narrator', text: responseText }]);
        } catch (error) {
            console.error("Error with DM response:", error);
            setNarrationHistory(prev => [...prev, { sender: 'narrator', text: "An unexpected silence fills the air..." }]);
        } finally {
            setIsNarratorLoading(false);
        }
    }, [playerInput, playerCharacter, mapData, controlledIconX, controlledIconY, viewMode, interiorViewState, interiorMapPlayerPos, gameDate, currentMapArchetype, currentMapClimate, currentTimeOfDay, currentZone, currentMapSeed, gameTimeHours, animals, npcs, terrainStructures, setNarrationHistory, setPlayerInput, setIsNarratorLoading]);

    const handleEncounter = useCallback((target: EncounterableEntity) => {
        setEncounterTarget(target);
    }, []);
    
    const handleCloseEncounter = useCallback((history: DialogueEntry[]) => {
        if (encounterTarget && isNpc(encounterTarget) && history.length > 1) {
            summarizeConversation(history).then(({ summary, sentiment }) => {
                setNpcs(prevNpcs => prevNpcs.map(npc => {
                    if (npc.id === encounterTarget.id) {
                        const newSummaries = [...npc.memory.conversationSummaries, summary].slice(-5); // Keep last 5
                        let newOpinion = npc.memory.opinionOfPlayer;
                        if (sentiment === 'positive') newOpinion = Math.min(100, newOpinion + 10);
                        if (sentiment === 'negative') newOpinion = Math.max(-100, newOpinion - 10);
                        return { ...npc, memory: { ...npc.memory, conversationSummaries: newSummaries, opinionOfPlayer: newOpinion } };
                    }
                    return npc;
                }));
            });
        }
        setEncounterTarget(null);
    }, [encounterTarget, setNpcs]);

    const handleInitiateCombat = useCallback((target: EncounterableEntity) => {
        setEncounterTarget(null);
        setCombatant(target);
    }, []);

    const handleCombatVictory = useCallback((opponent: EncounterableEntity) => {
        const xpGained = 10 * (opponent.stats.level || 1);
        let itemsGained: Item[] = [];
        
        if (isAnimal(opponent)) {
            const animalData = ANIMAL_DATA[opponent.baseId];
            if (animalData) {
                animalData.drops.forEach(drop => {
                    if (Math.random() < drop.chance) {
                        const newItem = createItemInstance(drop.name.toUpperCase().replace(/ /g, '_'));
                        if (newItem) itemsGained.push(newItem);
                    }
                });
            }
        }
        
        setVictoryDetails({ 
            xpGained, 
            itemsGained, 
            opponentName: isAnimal(opponent) ? opponent.speciesName : opponent.name,
            opponentEmoji: opponent.emoji,
            opponent: opponent
        });

        if (playerCharacter) {
            setPlayerCharacter(p => p ? {...p, experience: p.experience + xpGained} : p);
        }
        
        setCombatant(null);
    }, [playerCharacter, setPlayerCharacter]);

    const handleVictoryClose = useCallback(() => {
        if (!victoryDetails) return;
        const { opponent, itemsGained } = victoryDetails;
    
        if (isNpc(opponent)) {
            const equipped = Object.values(opponent.equippedItems || {}).filter(Boolean) as Item[];
            const inventory = opponent.inventory || [];
            const allLootableItems = [...equipped, ...inventory];
            setLootModalData({ opponent, items: allLootableItems });
        } else if (isAnimal(opponent)) {
            if (itemsGained.length > 0) {
                addItemsToInventory(itemsGained);
                showToast(`Acquired ${itemsGained.length} item(s)`);
                setPanelNotificationItem(itemsGained[0]);
                setTimeout(() => setPanelNotificationItem(null), 2500);
            }
            // FIX: Remove animal from map
            setAnimals(prev => prev.filter(a => a.id !== opponent.id));
        }
        setVictoryDetails(null);
    }, [victoryDetails, addItemsToInventory, showToast, setLootModalData, setVictoryDetails, setPanelNotificationItem, setAnimals]);
    
    const handleLooting = useCallback((item: Item, opponentId: string) => {
        if(!playerCharacter) return;
        setPlayerCharacter(prev => prev ? { ...prev, inventory: addItemToInventory(prev.inventory, item) } : null);
        setLootModalData((prev: LootModalData | null) => {
            if (!prev || prev.opponent.id !== opponentId) return prev;
            const newOpponentInventory = prev.opponent.inventory.filter(i => i.id !== item.id);
            const newEquipped = { ...prev.opponent.equippedItems };
            Object.entries(newEquipped).forEach(([slot, equippedItem]: [string, Item | undefined]) => {
                if(equippedItem && typeof equippedItem === 'object' && 'id' in equippedItem && equippedItem.id === item.id) {
                    delete newEquipped[slot as keyof typeof newEquipped];
                }
            });

            return { 
                ...prev, 
                opponent: { 
                    ...prev.opponent, 
                    inventory: newOpponentInventory,
                    equippedItems: newEquipped
                } 
            };
        });
    }, [playerCharacter, setPlayerCharacter]);

    const onTakeCoins = useCallback((amount: number, opponentId: string) => {
        if (!playerCharacter) return;
        setPlayerCharacter(p => p ? { ...p, currency: p.currency + amount } : p);
        setLootModalData((prev: LootModalData | null) => {
            if (!prev || prev.opponent.id !== opponentId) return prev;
            const newOpponent = {...prev.opponent, currency: 0};
            return {...prev, opponent: newOpponent};
        });
    }, [playerCharacter, setPlayerCharacter]);
    
    const handleCloseLootModal = useCallback((lootedItems: Item[]) => {
        if (lootedItems.length > 0) {
            showToast(`Looted ${lootedItems.length} item(s).`);
        }
        // FIX: Remove NPC from map after looting
        if (lootModalData) {
            setNpcs(prev => prev.filter(n => n.id !== lootModalData.opponent.id));
        }
        setLootModalData(null);
    }, [showToast, lootModalData, setNpcs]);

    const onCraft = useCallback((items: Item[], method: 'COMBINE' | 'DISAGGREGATE') => {
        setCraftingModalData({ items, method });
        setIsCraftingModalOpen(true);
    }, []);

    const handleExecuteCrafting = useCallback(async (intent: string): Promise<CraftingResult | null> => {
        if (!craftingModalData) return null;
        try {
            const result = await executeCrafting(craftingModalData.method, craftingModalData.items, intent);
            if (result.success && result.outcome.consumedItemIds.length > 0) {
                removeItemsFromInventory(result.outcome.consumedItemIds);
            }
            if (result.success && result.outcome.newItems) {
                const newItems = result.outcome.newItems.map(itemDef => createItemInstance(itemDef.baseId)).filter(Boolean) as Item[];
                addItemsToInventory(newItems);
                if (newItems.length > 0) {
                    setPanelNotificationItem(newItems[0]);
                    setTimeout(() => setPanelNotificationItem(null), 2500);
                }
            }
            showToast(result.outcome.message);
            return result;
        } catch (error) {
            console.error("Crafting execution failed:", error);
            showToast("A mysterious force prevented your crafting attempt.");
            return null;
        }
    }, [craftingModalData, removeItemsFromInventory, addItemsToInventory, showToast]);

    return {
        // State
        hoveredDevData, pinnedDevData, isTooltipPinnedOpen,
        tileInfoModalProps, infoModalTarget, structureModalTarget, activeSettlementInfo,
        isSettingsModalOpen, isAboutModalOpen, useLlmForDescriptions, useLlmForCharacter, showDevTooltip,
        isTestModeEnabled, debugSettings, isDevBuildingModeOpen,
        isWorldMapModalOpen, interactionModalData, isSkillsModalOpen, isSkillLoading, skillResult,
        isMapDetailsModalOpen, encounterTarget, combatant, victoryDetails, isCharacterProfileModalOpen,
        isAnyModalOpen, activeMarketplaceModal, activeCityModal, activeRuinModal, activeMiningModal,
        isLeftSidebarExpanded, activeMapSubTab, activeLens, toastMessage, panelNotificationItem,
        lootModalData, setLootModalData,
        isLevelUpModalOpen, levelUpCharacter,
        isPortraitModalOpen, portraitModalCharacter,
        isCraftingModalOpen, craftingModalData,
        activePoi,
        
        // Handlers
        handleDevHover, handleCondenseTooltip, togglePinnedTooltip,
        setTileInfoModalProps, setInfoModalTarget, setStructureModalTarget, setActiveSettlementInfo,
        setIsSettingsModalOpen, setIsAboutModalOpen, setUseLlmForDescriptions, setUseLlmForCharacter, setShowDevTooltip,
        setIsTestModeEnabled, setDebugSettings, setIsDevBuildingModeOpen,
        setIsWorldMapModalOpen, setInteractionModalData, handleTakeItem,
        setIsSkillsModalOpen, setIsMapDetailsModalOpen,
        handleEncounter, handleCloseEncounter, handleInitiateCombat,
        setCombatant, handleCombatVictory, setVictoryDetails, setIsCharacterProfileModalOpen,
        closeAllModals, setActiveMarketplaceModal, setActiveCityModal, setActiveRuinModal, setActiveMiningModal,
        setIsLeftSidebarExpanded, setActiveMapSubTab, setActiveLens, showToast, setPanelNotificationItem,
        handleLooting, handleCloseLootModal, onTakeCoins,
        handleVictoryClose,
        handleLevelUp,
        setIsPortraitModalOpen, setPortraitModalCharacter,
        onCraft, handleExecuteCrafting,
        setActivePoi,
        
        // Actions passed down from Player/Game contexts
        onUseSkill,
        onSend,
        onBuyItem,
        onSellItem
    };
};