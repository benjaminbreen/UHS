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
import { TamedAnimal } from '../services/animalTamingService';
import { specialMapNpcBehaviorService, isGuardType } from '../services/specialMapNpcBehaviorService';
import { eventBus } from '../services/eventBus';
import { questService } from '../services/questService';
import { questTriggerService } from '../services/questTriggerService';
import { FloatingTextMessage } from '../components/ui/FloatingText';
import gameSoundsService from '../services/gameSoundsService';

export interface VictoryDetails {
    xpGained: number;
    itemsGained: Item[];
    opponentName: string;
    opponentEmoji: string;
    opponent: EncounterableEntity;
}

export const useUIState = () => {
    // Consume contexts for state and setters
    const { playerCharacter, setPlayerCharacter, controlledIconX, controlledIconY, setControlledIconX, setControlledIconY, viewMode, interiorViewState, interiorMapPlayerPos, onBuyItem, onSellItem, addItemsToInventory, onCharacterUpdate, removeItemsFromInventory } = usePlayer();
    const { localArea, mapData, currentMapArchetype, currentMapClimate, currentMapSeed, animals, npcs, terrainStructures, setNpcs, setAnimals, removeVegetation, updateMineralDeposit, addDugTile } = useMap();
    const {
        gameDate, formattedTime, addGameLogEntry, gameTimeHours, gameTimeMinutes,
        narrationHistory, setNarrationHistory, playerInput, onPlayerInputChange: setPlayerInput,
        isNarratorLoading, setIsNarratorLoading, currentTimeOfDay,
        currentZone, season
    } = useGame();

    // UI State
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
    const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);
    const [containerPrompt, setContainerPrompt] = useState<{ message: string; isVisible: boolean }>({
        message: '',
        isVisible: false
    });
    const [isWorldMapModalOpen, setIsWorldMapModalOpen] = useState<boolean>(false);
    const [isCharacterProfileModalOpen, setIsCharacterProfileModalOpen] = useState<boolean>(false);
    const [isMapDetailsModalOpen, setIsMapDetailsModalOpen] = useState<boolean>(false);
    
    // Context for narration
    const [recentNpc, setRecentNpc] = useState<NpcEntity | null>(null);
    const [recentConversationSummary, setRecentConversationSummary] = useState<string | null>(null);
    const [isLevelUpModalOpen, setIsLevelUpModalOpen] = useState<boolean>(false);
    const [levelUpCharacter, setLevelUpCharacter] = useState<PlayerCharacter | null>(null);
    const [isPortraitModalOpen, setIsPortraitModalOpen] = useState<boolean>(false);
    const [portraitModalCharacter, setPortraitModalCharacter] = useState<PlayerCharacter | NpcEntity | null>(null);
    const [isCraftingModalOpen, setIsCraftingModalOpen] = useState(false);
    const [craftingModalData, setCraftingModalData] = useState<CraftingModalData | null>(null);
    const [selectedPrimarySource, setSelectedPrimarySource] = useState<any>(null);
    
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
        disableBlurEffects: isSafari(), // Auto-disable blur on Safari
        disableAnimations: isSafari(), // Auto-disable animations on Safari
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
    const [inRuinRoguelike, setInRuinRoguelike] = useState(false);
    const [inMiningRoguelike, setInMiningRoguelike] = useState(false);
    const [miningRoguelikeData, setMiningRoguelikeData] = useState<{ structure: TerrainStructure } | null>(null);
    const [activeGovernmentModal, setActiveGovernmentModal] = useState<{ structure: TerrainStructure; tile: Tile } | null>(null);
    const [activeFishingHutModal, setActiveFishingHutModal] = useState<{ structure: TerrainStructure; tile: Tile } | null>(null);
    const [activeMiningModal, setActiveMiningModal] = useState<TerrainStructure | null>(null);
    const [interactionModalData, setInteractionModalData] = useState<any>(null); // For container loot
    const [encounterTarget, setEncounterTarget] = useState<EncounterableEntity | null>(null);
    const [combatant, setCombatant] = useState<EncounterableEntity | null>(null);
    const [victoryDetails, setVictoryDetails] = useState<VictoryDetails | null>(null);
    const [lootModalData, setLootModalData] = useState<LootModalData | null>(null);
    const [activePoi, setActivePoi] = useState<TerrainStructure | null>(null);
    const [poiToastData, setPoiToastData] = useState<{
        structure: TerrainStructure;
        description: string;
        dialogue: any;
    } | null>(null);
    const [containerModalData, setContainerModalData] = useState<{
        containerType: any;
        contents: any;
        position: { x: number; y: number };
        isAnimating: boolean;
    } | null>(null);
    
    // Skills
    const [isSkillsModalOpen, setIsSkillsModalOpen] = useState<boolean>(false);
    const [isSkillLoading, setIsSkillLoading] = useState<boolean>(false);
    const [skillResult, setSkillResult] = useState<SkillResult | null>(null);
    
    // Notifications
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [panelNotificationItem, setPanelNotificationItem] = useState<Item | null>(null);
    const [floatingTextMessages, setFloatingTextMessages] = useState<FloatingTextMessage[]>([]);

    const setActiveMarketplaceModal = useCallback((data: { tile: Tile } | null) => {
        _setActiveMarketplaceModal(data);
    }, []);

    const setActiveCityModal = useCallback((data: { tile: Tile } | null) => {
        _setActiveCityModal(data);
    }, []);

    // Auto-enable performance optimizations for Safari users
    useEffect(() => {
        if (isSafari()) {
            setDebugSettings(prev => ({
                ...prev,
                disableBlurEffects: true,
                disableAnimations: true  // Also disable animations for better Safari performance
            }));
            // Apply the class immediately
            document.body.classList.add('disable-blur');
            console.log('[Performance] Safari detected - automatically disabling blur effects and animations for better performance');
        }
    }, []);

    // Listen for ambient text events from MapViewport
    useEffect(() => {
        const handleAmbientText = (data: { text: string }) => {
            if (data.text) {
                // Add ambient text to narration history with special styling
                setNarrationHistory(prev => [...prev, {
                    sender: 'narrator-ambient',
                    text: `*${data.text}*` // Italicize ambient text
                }]);
            }
        };

        eventBus.on('narration:ambient', handleAmbientText);
        return () => {
            eventBus.off('narration:ambient', handleAmbientText);
        };
    }, [setNarrationHistory]);

    // Memoize if any modal is open
    const isAnyModalOpen = useMemo(() =>
        isSettingsModalOpen || isAboutModalOpen || isWorldMapModalOpen || isCharacterProfileModalOpen || isMapDetailsModalOpen ||
        !!tileInfoModalProps || !!infoModalTarget || !!structureModalTarget || !!activeSettlementInfo ||
        !!interactionModalData || isSkillsModalOpen || !!encounterTarget || !!combatant || !!victoryDetails || !!lootModalData || !!activeMarketplaceModal || !!activeCityModal || isLevelUpModalOpen || isPortraitModalOpen || isCraftingModalOpen || !!activeMiningModal || !!activePoi || !!activeRuinModal || !!activeGovernmentModal || !!activeFishingHutModal || !!containerModalData,
        [isSettingsModalOpen, isAboutModalOpen, isWorldMapModalOpen, isCharacterProfileModalOpen, isMapDetailsModalOpen,
         tileInfoModalProps, infoModalTarget, structureModalTarget, activeSettlementInfo,
         interactionModalData, isSkillsModalOpen, encounterTarget, combatant, victoryDetails, lootModalData, activeMarketplaceModal, activeCityModal, isLevelUpModalOpen, isPortraitModalOpen, isCraftingModalOpen, activeMiningModal, activePoi, activeRuinModal, activeGovernmentModal, activeFishingHutModal, containerModalData]
    );

    // Handlers
    const showContainerPrompt = useCallback((message: string) => {
        setContainerPrompt({ message, isVisible: true });
    }, []);

    const hideContainerPrompt = useCallback(() => {
        setContainerPrompt(prev => ({ ...prev, isVisible: false }));
    }, []);

    const showToast = useCallback((message: string, type: 'success' | 'warning' | 'error' | 'info' = 'info') => {
        // Check if this is a container prompt - if so, use container prompt instead
        if (message.toLowerCase().includes('press e') && message.toLowerCase().includes('container')) {
            showContainerPrompt(message);
            return;
        }
        
        // Play appropriate sound based on toast type
        import('../services/gameSoundsService').then(({ default: gameSounds }) => {
            // Analyze message content for specific sound effects
            const lowerMessage = message.toLowerCase();
            
            // Check for specific game events first
            if (lowerMessage.includes('embarked') || lowerMessage.includes('disembarked')) {
                gameSounds.playEmbarkSound();
            } else if (lowerMessage.includes('level up') || lowerMessage.includes('level!')) {
                gameSounds.playLevelUpSound();
            } else if (lowerMessage.includes('quest complete') || lowerMessage.includes('quest accepted')) {
                gameSounds.playQuestAcceptedSound();
            } else if (lowerMessage.includes('healed') || lowerMessage.includes('health restored')) {
                gameSounds.playHealingSound();
            } else if (lowerMessage.includes('item') || lowerMessage.includes('acquired') || lowerMessage.includes('picked up')) {
                // Determine item type from message
                if (lowerMessage.includes('gold') || lowerMessage.includes('coin')) {
                    gameSounds.playItemPickupSound('gold');
                } else if (lowerMessage.includes('weapon') || lowerMessage.includes('sword') || lowerMessage.includes('dagger')) {
                    gameSounds.playItemPickupSound('weapon');
                } else if (lowerMessage.includes('food') || lowerMessage.includes('bread') || lowerMessage.includes('meat')) {
                    gameSounds.playItemPickupSound('food');
                } else if (lowerMessage.includes('document') || lowerMessage.includes('scroll') || lowerMessage.includes('letter')) {
                    gameSounds.playItemPickupSound('document');
                } else {
                    gameSounds.playItemPickupSound('generic');
                }
            } else if (lowerMessage.includes('trade') || lowerMessage.includes('sold') || lowerMessage.includes('bought')) {
                gameSounds.playTradeSuccessSound();
            } else if (lowerMessage.includes('combat') || lowerMessage.includes('battle') || lowerMessage.includes('fight')) {
                gameSounds.playCombatStartSound();
            } else if (lowerMessage.includes('discovered') || lowerMessage.includes('found')) {
                gameSounds.playDiscoverySound();
            }
            // No default notification sound - only play sounds for specific events
        }).catch(err => {
            console.error('Failed to play sound:', err);
        });
        
        setToastMessage(message);
        setTimeout(() => setToastMessage(null), 3000);
    }, []);

    // Function to show floating text at specific screen coordinates
    const showFloatingText = useCallback((text: string, type: FloatingTextMessage['type'], x: number, y: number, duration?: number) => {
        const id = `floating-${Date.now()}-${Math.random()}`;
        const newMessage: FloatingTextMessage = {
            id,
            text,
            type,
            x,
            y,
            duration: duration || 2000
        };
        
        setFloatingTextMessages(prev => [...prev, newMessage]);
    }, []);

    const removeFloatingText = useCallback((id: string) => {
        setFloatingTextMessages(prev => prev.filter(msg => msg.id !== id));
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
        setActiveGovernmentModal(null);
        setActiveFishingHutModal(null);
        setIsLevelUpModalOpen(false);
        setIsPortraitModalOpen(false);
        setPortraitModalCharacter(null);
        setIsCraftingModalOpen(false);
        setCraftingModalData(null);
        setActiveMiningModal(null);
        setActivePoi(null);
        setContainerModalData(null);
    }, []);
    
    useEffect(() => {
        if (playerCharacter && playerCharacter.experience >= playerCharacter.maxExperience && !isLevelUpModalOpen && !combatant) {
            setLevelUpCharacter(playerCharacter);
            setIsLevelUpModalOpen(true);
        }
    }, [playerCharacter, isLevelUpModalOpen, combatant]);

    // Listen for quest reward level ups
    useEffect(() => {
        const handleQuestLevelUp = (e: CustomEvent) => {
            const { levels, source } = e.detail;
            console.log(`[LevelUp] Quest reward level up: ${levels} level(s) from ${source}`);
            
            // Open the level up modal
            if (playerCharacter && !isLevelUpModalOpen) {
                setLevelUpCharacter(playerCharacter);
                setIsLevelUpModalOpen(true);
                showToast(`🎉 ${source} granted you a level up!`);
            }
        };

        window.addEventListener('playerLevelUp', handleQuestLevelUp as EventListener);
        return () => {
            window.removeEventListener('playerLevelUp', handleQuestLevelUp as EventListener);
        };
    }, [playerCharacter, isLevelUpModalOpen]);

    const handleLevelUp = useCallback((statToUpgrade?: keyof PlayerCharacter['stats'], newProfession?: string) => {
        onCharacterUpdate(prev => {
            if (!prev || !statToUpgrade) return prev;
    
            const newStats = { ...prev.stats };
            newStats[statToUpgrade] = (newStats[statToUpgrade] || 0) + 1;
            newStats.attack = (newStats.attack || 0) + 1;
            newStats.defense = (newStats.defense || 0) + 1;
    
            const newMaxExperience = Math.floor(prev.maxExperience * 1.5);
            const newMaxHealth = prev.maxHealth + 10;
            
            // Check if the new profession grants healing abilities
            const healingProfessions = [
                'Healer', 'Physician', 'Doctor', 'Herbalist', 'Apothecary',
                'Medicine Woman', 'Medicine Man', 'Medicine Person', 'Shaman',
                'Sangoma', 'Curandero', 'Hakim', 'Barber Surgeon', 'Plague Doctor',
                'Nurse', 'Mission Nurse', 'Tohunga', 'Kahuna Lapaʻau', 'Pajé',
                'Kallawaya', 'Diviner Healer', 'Traditional Healer', 'Pueblo Healer'
            ];
            
            const isBecomingHealer = newProfession && healingProfessions.includes(newProfession);
            const wasHealer = prev.profession && healingProfessions.includes(prev.profession);
            
            // Initialize or update abilities
            let abilities = { ...prev.abilities };
            let medicalSkills = { ...prev.medicalSkills };
            
            if (isBecomingHealer && !wasHealer) {
                // Grant healing abilities when becoming a healer
                abilities.canHeal = true;
                
                // Initialize medical skills based on intelligence and wisdom
                const baseSkill = Math.min(50 + (prev.stats.intelligence * 3) + (prev.stats.wisdom || 5) * 2, 80);
                medicalSkills = {
                    diagnosisAccuracy: baseSkill,
                    treatmentEffectiveness: baseSkill - 10,
                    herbalistKnowledge: newProfession === 'Herbalist' ? baseSkill + 20 : baseSkill,
                    surgicalSkill: newProfession?.includes('Surgeon') ? baseSkill + 15 : baseSkill - 20,
                    patientTrust: Math.min(50 + (prev.stats.charisma * 2), 75)
                };
                
                showToast(`🌿 You have gained healing abilities as a ${newProfession}!`);
            } else if (wasHealer && !isBecomingHealer) {
                // Remove healing abilities when changing away from healer
                abilities.canHeal = false;
                showToast(`You have lost your healing abilities.`);
            } else if (isBecomingHealer && wasHealer) {
                // Improve medical skills when continuing as healer
                medicalSkills = {
                    diagnosisAccuracy: Math.min((medicalSkills.diagnosisAccuracy || 50) + 5, 100),
                    treatmentEffectiveness: Math.min((medicalSkills.treatmentEffectiveness || 40) + 5, 100),
                    herbalistKnowledge: Math.min((medicalSkills.herbalistKnowledge || 50) + 3, 100),
                    surgicalSkill: Math.min((medicalSkills.surgicalSkill || 30) + 3, 100),
                    patientTrust: Math.min((medicalSkills.patientTrust || 50) + 2, 100)
                };
                showToast(`🌿 Your medical skills have improved!`);
            }
    
            return {
                ...prev,
                level: prev.level + 1,
                experience: 0,
                maxExperience: newMaxExperience,
                health: newMaxHealth, // Heal on level up
                maxHealth: newMaxHealth,
                stats: newStats,
                profession: newProfession || prev.profession,
                abilities,
                medicalSkills: isBecomingHealer || wasHealer ? medicalSkills : prev.medicalSkills
            };
        });
        setIsLevelUpModalOpen(false);
        setLevelUpCharacter(null);
        showToast(`Leveled up to ${playerCharacter!.level + 1}!`);
        
        // Show floating text for level up
        const screenCenterX = window.innerWidth / 2;
        const screenCenterY = window.innerHeight / 2;
        showFloatingText(`Level Up! Lv.${playerCharacter!.level + 1}`, 'experience', screenCenterX, screenCenterY, 3000);
    }, [onCharacterUpdate, showToast, playerCharacter, showFloatingText]);

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
        setTimeout(() => setPanelNotificationItem(null), 5000);

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
            gameDate,
            gameTime: { hours: gameTimeHours || 12, minutes: gameTimeMinutes || 0 },
            season
        };

        const result = await executeSkill(skillId, playerContext);

        // Play skill sound effects immediately, regardless of success
        if (result?.type === 'forage') {
            gameSoundsService.playForageSound();
        } else if (result?.type === 'chop') {
            gameSoundsService.playChopSound();
        } else if (result?.type === 'dig') {
            gameSoundsService.playDigSound();
        } else if (skillId === 'BURN' && result?.type === 'combat') {
            gameSoundsService.playBurnSound();
        }

        if (result?.type === 'forage' && result.success && result.item) {

            // Play item pickup sound after a short delay
            setTimeout(() => {
                const isRare = result.item.rarity === 'Rare' || result.item.rarity === 'Ultra-rare' ||
                               result.item.rarity === 'Unique' || result.item.quality === 'excellent';
                gameSoundsService.playItemPickupSound(isRare ? 'gold' : 'generic');
            }, 300);

            // Use the item directly from the result (it's already created with custom names)
            addItemsToInventory([result.item]);
            setPanelNotificationItem(result.item);
            setTimeout(() => setPanelNotificationItem(null), 5000);
            
            // Show floating text for item found
            const screenX = window.innerWidth / 2 + (Math.random() - 0.5) * 200; // Add some randomness
            const screenY = window.innerHeight / 2 + 100;
            showFloatingText(`Found ${result.item.name}!`, 'success', screenX, screenY);
            
            // Remove vegetation if it was foraged from a bush
            if (result.entityToRemoveId) {
                removeVegetation(result.entityToRemoveId);
            }
        }
        
        if (result?.type === 'chop' && result.success && result.item) {
            // Play item pickup sound after a short delay
            setTimeout(() => {
                const isRare = result.item.rarity === 'Rare' || result.item.rarity === 'Ultra-rare' ||
                               result.item.rarity === 'Unique' || result.item.quality === 'excellent';
                gameSoundsService.playItemPickupSound(isRare ? 'gold' : 'generic');
            }, 300);

            addItemsToInventory([result.item]);
            setPanelNotificationItem(result.item);
            setTimeout(() => setPanelNotificationItem(null), 5000);
            if (result.entityToRemoveId) {
                removeVegetation(result.entityToRemoveId);
            }
        }

        if (result?.type === 'dig' && result.success) {
            // Mark the tile as dug for visual feedback
            if (controlledIconX !== null && controlledIconY !== null) {
                addDugTile(controlledIconX, controlledIconY);
            }

            if (result.item) {
                console.log("Dig result item:", result.item);

                // Play item pickup sound after a short delay
                setTimeout(() => {
                    const isRare = result.item.rarity === 'Rare' || result.item.rarity === 'Ultra-rare' ||
                                   result.item.rarity === 'Unique' || result.item.quality === 'excellent';
                    gameSoundsService.playItemPickupSound(isRare ? 'gold' : 'generic');
                }, 300);

                addItemsToInventory([result.item]);
                setPanelNotificationItem(result.item);
                setTimeout(() => setPanelNotificationItem(null), 5000);
            } else {
                console.log("Dig succeeded but no item found:", result);
            }
            if (result.tileCoords && result.amountExtracted) {
                updateMineralDeposit(result.tileCoords.x, result.tileCoords.y, result.amountExtracted);
            }
        }
        
        if (result?.type === 'sing' && result.success) {
            // Apply reputation change from singing performance
            if (result.reputationChange !== 0) {
                setPlayerCharacter(p => {
                    if (!p) return p;
                    const newRep = Math.max(0, Math.min(100, p.mapReputation + result.reputationChange));
                    return { ...p, mapReputation: newRep };
                });
            }
            
            // Add a small amount of fatigue for singing
            setPlayerCharacter(p => {
                if (!p) return p;
                return { ...p, fatigue: Math.min(p.maxFatigue, p.fatigue + 2) };
            });
        }
        
        if (result?.type === 'combat' && result.message?.includes('Reputation')) {
            // Handle reputation change from intimidating shout
            const repMatch = result.message.match(/Reputation ([+-]\d+)/);
            if (repMatch) {
                const repChange = parseInt(repMatch[1]);
                setPlayerCharacter(p => {
                    if (!p) return p;
                    const newRep = Math.max(0, Math.min(100, p.mapReputation + repChange));
                    return { ...p, mapReputation: newRep };
                });
            }
            
            // Add fatigue cost for intimidating shout
            if (skillId === 'INTIMIDATING_SHOUT') {
                setPlayerCharacter(p => {
                    if (!p) return p;
                    return { ...p, fatigue: Math.min(p.maxFatigue, p.fatigue + 2) };
                });
            }
        }

        if(result?.xpGained) {
            setPlayerCharacter(p => p ? { ...p, experience: p.experience + result.xpGained! } : p);
        }

        setSkillResult(result);
        setIsSkillLoading(false);
    }, [playerCharacter, mapData, controlledIconX, controlledIconY, viewMode, interiorViewState, interiorMapPlayerPos, gameDate, currentMapArchetype, currentMapClimate, currentTimeOfDay, currentZone, currentMapSeed, gameTimeHours, animals, npcs, terrainStructures, setPlayerCharacter, addItemsToInventory, removeVegetation, updateMineralDeposit, addDugTile, showFloatingText]);

    const onSend = useCallback(async () => {
        if (!playerInput.trim() || !playerCharacter || !mapData || controlledIconX === null || controlledIconY === null) return;
        
        const userMessage: NarrationMessage = { sender: 'player', text: playerInput };
        setNarrationHistory(prev => [...prev, userMessage]);
        setPlayerInput('');
        setIsNarratorLoading(true);

        // Check if this is a physical feat attempt
        const { detectPhysicalFeatIntent, evaluatePhysicalFeat, executePhysicalFeat } = await import('../services/physicalFeatService');
        const featAttempt = detectPhysicalFeatIntent(playerInput);
        
        if (featAttempt) {
            // Handle physical feat attempt
            const currentTile = mapData.tiles[controlledIconY][controlledIconX];
            
            // If direction is specified, get target tile
            if (featAttempt.direction) {
                let targetX = controlledIconX;
                let targetY = controlledIconY;
                
                switch (featAttempt.direction) {
                    case 'north': targetY--; break;
                    case 'south': targetY++; break;
                    case 'east': targetX++; break;
                    case 'west': targetX--; break;
                }
                
                if (targetX >= 0 && targetX < mapData.tiles[0].length && 
                    targetY >= 0 && targetY < mapData.tiles.length) {
                    featAttempt.targetTile = mapData.tiles[targetY][targetX];
                }
            }
            
            try {
                // Evaluate the feat
                const evaluation = await evaluatePhysicalFeat(featAttempt, playerCharacter, currentTile, mapData);
                
                // Add narrator's evaluation message
                setNarrationHistory(prev => [...prev, { 
                    sender: 'narrator', 
                    text: evaluation.reasoning 
                }]);
                
                if (evaluation.possible) {
                    // Execute the feat
                    const result = await executePhysicalFeat(featAttempt, evaluation, playerCharacter, mapData);
                    
                    // Apply effects
                    if (result.effects) {
                        const newCharacter = { ...playerCharacter };
                        
                        if (result.effects.fatigue) {
                            newCharacter.fatigue = Math.min(
                                newCharacter.maxFatigue, 
                                newCharacter.fatigue + result.effects.fatigue
                            );
                        }
                        
                        if (result.effects.damage) {
                            newCharacter.health = Math.max(
                                0, 
                                newCharacter.health - result.effects.damage
                            );
                        }
                        
                        if (result.effects.lostItems) {
                            newCharacter.inventory = newCharacter.inventory.filter(
                                item => !result.effects.lostItems?.some(lost => lost.id === item.id)
                            );
                        }
                        
                        if (result.effects.newPosition && result.success) {
                            // Move the player to the new position
                            setControlledIconX(result.effects.newPosition.x);
                            setControlledIconY(result.effects.newPosition.y);
                        }

                        if (result.success && result.effects.elevatedState !== undefined) {
                            // Set or clear elevated state (like being in a tree)
                            newCharacter.elevatedState = result.effects.elevatedState || undefined;
                            newCharacter.elevationDescription = result.effects.elevationDescription || undefined;
                        }
                        
                        setPlayerCharacter(newCharacter);
                    }
                    
                    // Add result message
                    setNarrationHistory(prev => [...prev, { 
                        sender: 'narrator', 
                        text: result.message 
                    }]);
                } else if (evaluation.consequences?.alternativeSuggestion) {
                    // Add alternative suggestion
                    setNarrationHistory(prev => [...prev, { 
                        sender: 'narrator', 
                        text: evaluation.consequences.alternativeSuggestion 
                    }]);
                }
            } catch (error) {
                console.error('[PhysicalFeat] Error processing feat:', error);
                setNarrationHistory(prev => [...prev, { 
                    sender: 'narrator', 
                    text: 'You consider the action but decide against it for now.' 
                }]);
            } finally {
                setIsNarratorLoading(false);
            }
            
            return; // Don't continue to normal narrator processing
        }

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
    }, [playerInput, playerCharacter, mapData, controlledIconX, controlledIconY, setControlledIconX, setControlledIconY, viewMode, interiorViewState, interiorMapPlayerPos, gameDate, currentMapArchetype, currentMapClimate, currentTimeOfDay, currentZone, currentMapSeed, gameTimeHours, animals, npcs, terrainStructures, setNarrationHistory, setPlayerInput, setIsNarratorLoading, setPlayerCharacter]);

    const handleEncounter = useCallback((target: EncounterableEntity) => {
        // If it's an NPC, ensure we get the latest version from the npcs array
        if (isNpc(target) && npcs) {
            const currentNpc = npcs.find(n => n.id === target.id);
            if (currentNpc) {
                console.log(`[ENCOUNTER] Using updated NPC ${currentNpc.name}, opinion: ${currentNpc.memory.opinionOfPlayer}`);
                setEncounterTarget(currentNpc);
            } else {
                console.log(`[ENCOUNTER] NPC ${target.name} not found in array, using original`);
                setEncounterTarget(target);
            }
        } else {
            setEncounterTarget(target);
        }
    }, [npcs]);
    
    const handleCloseEncounter = useCallback((history: DialogueEntry[]) => {
        if (encounterTarget && isNpc(encounterTarget) && history.length > 1) {
            // Store recent NPC and conversation for narration context
            setRecentNpc(encounterTarget);
            
            // Check quest progress for NPC interactions
            if (playerCharacter && playerCharacter.x !== undefined && playerCharacter.y !== undefined) {
                questService.checkQuestProgress(playerCharacter.x, playerCharacter.y, 'npc_interaction');
                
                // Trigger contextual quest generation based on NPC interaction
                if (mapData && mapData.tiles && controlledIconY !== null && controlledIconX !== null) {
                    const tile = mapData.tiles[controlledIconY]?.[controlledIconX];
                    if (tile) {
                        const context = {
                            player: playerCharacter,
                            tile: tile,
                            mapData: mapData,
                            culturalZone: currentZone as any,
                            era: parseDateString(String(gameDate.year)).era,
                            gameMode: undefined // Will be filled from event service if needed
                        };
                        
                        // Check for NPC interaction quest triggers
                        questTriggerService.onNPCInteraction(context, encounterTarget);
                    }
                }
            }
            
            // Check if this was a guard encounter and clear the alert state
            if (isGuardType(encounterTarget)) {
                // Emit reset event to clear guard warning and alert states
                eventBus.emit('guard:resolved', { npcId: encounterTarget.id });
            }
            
            summarizeConversation(history).then(({ summary, sentiment }) => {
                setRecentConversationSummary(summary);
                
                setNpcs(prevNpcs => prevNpcs.map(npc => {
                    if (npc.id === encounterTarget.id) {
                        // Ensure memory and conversationSummaries exist
                        const currentSummaries = npc.memory?.conversationSummaries || [];
                        const newSummaries = [...currentSummaries, summary].slice(-5); // Keep last 5
                        let newOpinion = npc.memory?.opinionOfPlayer || 0;
                        if (sentiment === 'positive') newOpinion = Math.min(100, newOpinion + 10);
                        if (sentiment === 'negative') newOpinion = Math.max(-100, newOpinion - 10);
                        return { 
                            ...npc, 
                            memory: { 
                                ...npc.memory, 
                                conversationSummaries: newSummaries, 
                                opinionOfPlayer: newOpinion 
                            } 
                        };
                    }
                    return npc;
                }));
            });
        }
        setEncounterTarget(null);
    }, [encounterTarget, setNpcs, playerCharacter]);

    const handleInitiateCombat = useCallback((target: EncounterableEntity) => {
        // If it's an NPC, ensure we have the latest version from the npcs array
        if (isNpc(target) && npcs) {
            const currentNpc = npcs.find(n => n.id === target.id);
            if (currentNpc) {
                // Use the current NPC from the array (which has updated memory)
                setCombatant(currentNpc);
                console.log(`[COMBAT] Starting combat with ${currentNpc.name}, opinion: ${currentNpc.memory.opinionOfPlayer}`);
            } else {
                setCombatant(target);
            }
        } else {
            setCombatant(target);
        }
        setEncounterTarget(null);
    }, [npcs]);

    // Contextual narration handlers
    const handleCompanionClick = useCallback(async (animal: TamedAnimal) => {
        console.log('[handleCompanionClick] Called with animal:', animal);
        if (!playerCharacter || controlledIconX === null || controlledIconY === null) {
            console.log('[handleCompanionClick] No player character or position, returning');
            return;
        }
        
        try {
            const { generateCompanionClickNarration } = await import('../services/llmService');
            
            // Get the current tile
            const currentTile = mapData?.tiles?.[controlledIconY]?.[controlledIconX] || null;
            
            // Create a simple context for the narration
            const context: PlayerContext = {
                playerCharacter,
                mapData: mapData || {} as MapData,
                npcs: [],
                animals: [],
                terrainStructures: [],
                playerX: controlledIconX,
                playerY: controlledIconY,
                viewMode: 'standard',
                interiorContext: null,
                currentTile,
                ambianceContext: {
                    timeOfDay: currentTimeOfDay || 'morning',
                    climate: mapData?.climate || 'TEMPERATE',
                    historicalEra: 'MEDIEVAL',
                    season: 'SPRING',
                    culturalZone: currentZone || 'EUROPEAN',
                    currentTile
                }
            };
            
            const narration = await generateCompanionClickNarration(
                animal.name,
                animal.type,
                animal.loyalty,
                context
            );
            
            console.log('[handleCompanionClick] Generated narration:', narration);
            
            setNarrationHistory(prev => [...prev, { 
                sender: 'narrator', 
                text: narration 
            }]);
        } catch (error) {
            console.error('[handleCompanionClick] Error:', error);
        }
    }, [playerCharacter, controlledIconX, controlledIconY, mapData, currentZone, currentTimeOfDay, setNarrationHistory]);
    
    const handlePlayerClick = useCallback(async () => {
        console.log('[handlePlayerClick] Called');
        if (!playerCharacter || controlledIconX === null || controlledIconY === null) {
            console.log('[handlePlayerClick] No player character or position, returning');
            return;
        }
        
        try {
            const { generatePlayerClickNarration } = await import('../services/llmService');
            
            // Get the current tile
            const currentTile = mapData?.tiles?.[controlledIconY]?.[controlledIconX] || null;
            
            // Create context for more varied narration
            const context: PlayerContext = {
                playerCharacter,
                mapData: mapData || {} as MapData,
                npcs: [],
                animals: [],
                terrainStructures: [],
                playerX: controlledIconX,
                playerY: controlledIconY,
                viewMode: 'standard',
                interiorContext: null,
                currentTile,
                ambianceContext: {
                    timeOfDay: currentTimeOfDay || 'morning',
                    climate: mapData?.climate || 'TEMPERATE',
                    historicalEra: 'MEDIEVAL',
                    season: 'SPRING',
                    culturalZone: currentZone || 'EUROPEAN',
                    currentTile
                }
            };
            
            const narration = await generatePlayerClickNarration(
                playerCharacter,
                recentNpc,
                context
            );
            
            console.log('[handlePlayerClick] Generated narration:', narration);
            
            setNarrationHistory(prev => [...prev, { 
                sender: 'narrator', 
                text: narration 
            }]);
        } catch (error) {
            console.error('[handlePlayerClick] Error:', error);
        }
    }, [playerCharacter, controlledIconX, controlledIconY, mapData, recentNpc, recentConversationSummary, currentZone, currentTimeOfDay, setNarrationHistory]);
    
    const handleNewAreaEntry = useCallback(async (fromDirection: 'north' | 'south' | 'east' | 'west') => {
        if (!playerCharacter) return;
        
        const { generateNewAreaNarration } = await import('../services/contextualNarrationService');
        
        const narration = await generateNewAreaNarration(fromDirection, {
            playerCharacter,
            mapData,
            currentZone,
            currentRegion: localArea,
            timeOfDay: currentTimeOfDay
        });
        
        setNarrationHistory(prev => [...prev, { 
            sender: 'narrator', 
            text: narration 
        }]);
    }, [playerCharacter, mapData, currentZone, localArea, currentTimeOfDay, setNarrationHistory]);

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
            
            // Show floating text for XP gain
            const screenCenterX = window.innerWidth / 2;
            const screenCenterY = window.innerHeight / 2 + 50; // Slightly below center
            showFloatingText(`+${xpGained} XP`, 'experience', screenCenterX, screenCenterY, 2500);
        }
        
        setCombatant(null);
    }, [playerCharacter, setPlayerCharacter, showFloatingText]);

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
                setTimeout(() => setPanelNotificationItem(null), 5000);
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
                    setTimeout(() => setPanelNotificationItem(null), 5000);
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
        isAnyModalOpen, activeMarketplaceModal, activeCityModal, activeRuinModal, activeGovernmentModal, activeFishingHutModal, activeMiningModal,
        isLeftSidebarExpanded, activeMapSubTab, activeLens, toastMessage, panelNotificationItem,
        floatingTextMessages, containerPrompt,
        lootModalData, setLootModalData,
        isLevelUpModalOpen, levelUpCharacter,
        isPortraitModalOpen, portraitModalCharacter,
        isCraftingModalOpen, craftingModalData,
        activePoi,
        poiToastData,
        inRuinRoguelike,
        inMiningRoguelike,
        miningRoguelikeData,
        containerModalData,
        
        // Handlers
        handleDevHover, handleCondenseTooltip, togglePinnedTooltip,
        setTileInfoModalProps, setInfoModalTarget, setStructureModalTarget, setActiveSettlementInfo,
        setIsSettingsModalOpen, setIsAboutModalOpen, setUseLlmForDescriptions, setUseLlmForCharacter, setShowDevTooltip,
        setIsTestModeEnabled, setDebugSettings, setIsDevBuildingModeOpen,
        setIsWorldMapModalOpen, setInteractionModalData, handleTakeItem,
        setIsSkillsModalOpen, setIsMapDetailsModalOpen,
        handleEncounter, handleCloseEncounter, handleInitiateCombat,
        setCombatant, handleCombatVictory, setVictoryDetails, setIsCharacterProfileModalOpen,
        closeAllModals, setActiveMarketplaceModal, setActiveCityModal, setActiveRuinModal, setActiveGovernmentModal, setActiveFishingHutModal, setActiveMiningModal, setInRuinRoguelike, setInMiningRoguelike, setMiningRoguelikeData,
        setIsLeftSidebarExpanded, setActiveMapSubTab, setActiveLens, showToast, setPanelNotificationItem,
        showFloatingText, removeFloatingText, showContainerPrompt, hideContainerPrompt,
        handleLooting, handleCloseLootModal, onTakeCoins,
        handleVictoryClose,
        handleLevelUp,
        setIsPortraitModalOpen, setPortraitModalCharacter,
        onCraft, handleExecuteCrafting,
        setActivePoi,
        setPoiToastData,
        setContainerModalData,
        selectedPrimarySource,
        setSelectedPrimarySource,
        
        // Actions passed down from Player/Game contexts
        onUseSkill,
        onSend,
        
        // Contextual narration handlers
        handleCompanionClick,
        handlePlayerClick,
        handleNewAreaEntry,
        onBuyItem,
        onSellItem
    };
};