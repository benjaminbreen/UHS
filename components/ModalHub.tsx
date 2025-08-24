/**
 * components/ModalHub.tsx - Centralized component for rendering all application modals.
 */
import React, { useEffect } from 'react';
import { useUI } from '../contexts/UIContext';
import { useMap } from '../contexts/MapContext';
import { usePlayer } from '../contexts/PlayerContext';
import { useGame } from '../contexts/GameContext';
import DevTooltip from './DevTooltip';
import SettingsPanel from './SettingsPanel';
import WorldMapModal from './WorldMapModal';
import EncounterModal from './EncounterModal';
import NpcModal from './NpcModal';
import TileInfoModal from './TileInfoModal';
import SkillsModal from './SkillsModal';
import MapDetailsModal from './MapDetailsModal';
import CombatModal from './CombatModal';
import VictoryModal from './VictoryModal';
import CharacterProfileModal from './CharacterProfileModal';
import AnimalInfoModal from './AnimalInfoModal';

import SettlementInfoModal from './SettlementInfoModal';
import MiningModal from './MiningModal';
import PointOfInterestModal from './PointOfInterestModal';
import { InteractionModal } from './interiorMap';
import { isNpc, isAnimal, NpcEntity } from '../types';
import LootModal from './LootModal';
import LevelUpModal from './LevelUpModal';
import PortraitModal from './portraits/PortraitModal';
import CraftingModal from './CraftingModal';
import AboutModal from './AboutModal';
import DevBuildingModeModal from './DevBuildingModeModal';
import TerrainStructureModal from './TerrainStructureModal';


const ModalHub: React.FC = () => {
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
        activePoi, setActivePoi
    } = useUI();

    const { 
        mapDataCache, currentWorldCoords, initialGameSeed, handleSeedChangeFromSettings, mapData, npcs
    } = useMap();
    
    const { 
        playerCharacter, onCharacterUpdate, isEnhancing,
        handleCharacterGeneration, handleEquipItem, handleUnequipItem, 
        handleDropItem, handleConsumeItem, onUseCombatItem
    } = usePlayer();
    
    const { gameDate, currentZone, currentRegion, gameTimeHours, season } = useGame();
    
    // Add global keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // D key to toggle DevTooltip on/off
            if ((e.key === 'd' || e.key === 'D') && !e.metaKey && !e.ctrlKey && !e.altKey) {
                // Don't trigger if typing in an input field
                if (e.target && (e.target as HTMLElement).tagName === 'INPUT') return;
                if (e.target && (e.target as HTMLElement).tagName === 'TEXTAREA') return;
                
                e.preventDefault();
                setShowDevTooltip(prev => !prev);
            }
        };
        
        document.addEventListener('keydown', handleKeyPress);
        return () => {
            document.removeEventListener('keydown', handleKeyPress);
        };
    }, [setShowDevTooltip]);

    return (
        <>
            {showDevTooltip && (hoveredDevData || (pinnedDevData && isTooltipPinnedOpen)) && ( <DevTooltip hoveredData={hoveredDevData} pinnedData={pinnedDevData} isPinnedOpen={isTooltipPinnedOpen} onCondense={handleCondenseTooltip} /> )}
            {tileInfoModalProps && ( <TileInfoModal modalProps={tileInfoModalProps} onClose={() => setTileInfoModalProps(null)} /> )}
            {infoModalTarget && isNpc(infoModalTarget) && <NpcModal npc={infoModalTarget} onClose={() => setInfoModalTarget(null)}/>}
            {infoModalTarget && isAnimal(infoModalTarget) && <AnimalInfoModal animal={infoModalTarget} onClose={() => setInfoModalTarget(null)}/>}
            {isAboutModalOpen && <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />}
            {isDevBuildingModeOpen && <DevBuildingModeModal isOpen={isDevBuildingModeOpen} onClose={() => setIsDevBuildingModeOpen(false)} />}
            {isSettingsModalOpen && ( <SettingsPanel isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} currentSeed={initialGameSeed} onSeedChange={handleSeedChangeFromSettings} showDevTooltip={showDevTooltip} onToggleDevTooltip={() => setShowDevTooltip(p => !p)} useLlmForDescriptions={useLlmForDescriptions} onToggleLlmForDescriptions={() => setUseLlmForDescriptions(p => !p)} useLlmForCharacter={useLlmForCharacter} onToggleLlmForCharacter={() => setUseLlmForCharacter(p => !p)} isTestModeEnabled={isTestModeEnabled} onToggleTestMode={() => setIsTestModeEnabled(p => !p)} isDevBuildingModeOpen={isDevBuildingModeOpen} onToggleDevBuildingMode={() => setIsDevBuildingModeOpen(p => !p)} playerCharacter={playerCharacter} mapData={mapData} currentZone={currentZone} currentYear={gameDate.year} /> )}
            {isWorldMapModalOpen && ( <WorldMapModal isOpen={isWorldMapModalOpen} onClose={() => setIsWorldMapModalOpen(false)} cachedMaps={mapDataCache} currentWorldCoords={currentWorldCoords} /> )}
            {interactionModalData && ( <InteractionModal {...interactionModalData} onClose={() => setInteractionModalData(null)} onTakeItem={(item) => handleTakeItem(item, interactionModalData.entityId)} /> )}
            <SkillsModal isOpen={isSkillsModalOpen} isLoading={isSkillLoading} result={skillResult} onClose={() => setIsSkillsModalOpen(false)} />
            {isMapDetailsModalOpen && mapData && ( <MapDetailsModal isOpen={isMapDetailsModalOpen} onClose={() => setIsMapDetailsModalOpen(false)} mapData={mapData} /> )}
            {encounterTarget && playerCharacter && mapData && (
              <EncounterModal 
                target={encounterTarget}
                playerCharacter={playerCharacter} 
                allNpcs={npcs}
                mapData={mapData}
                onClose={handleCloseEncounter}
                onInitiateCombat={handleInitiateCombat}
                onOpenInfo={(target) => {
                  handleCloseEncounter([]);
                  setInfoModalTarget(target);
                }}
              />
            )}
            {combatant && playerCharacter && mapData && (
                <CombatModal 
                    combatant={combatant} 
                    playerCharacter={playerCharacter} 
                    onClose={() => setCombatant(null)} 
                    onVictory={handleCombatVictory} 
                    onUseCombatItem={onUseCombatItem}
                    inventory={playerCharacter.inventory}
                    onCharacterUpdate={onCharacterUpdate}
                    mapData={mapData}
                />
            )}
            {victoryDetails && <VictoryModal {...victoryDetails} onClose={handleVictoryClose} />}
            {lootModalData && <LootModal opponent={lootModalData.opponent} onTakeItem={handleLooting} onClose={handleCloseLootModal} onTakeCoins={onTakeCoins} />}
             {structureModalTarget && mapData && <TerrainStructureModal structure={structureModalTarget} mapData={mapData} npcs={npcs} onClose={() => setStructureModalTarget(null)} gameTimeHours={gameTimeHours} season={season} playerCharacter={playerCharacter} currentLocation={currentRegion} formattedDate={gameDate} />}
            {activeSettlementInfo && mapData && <SettlementInfoModal tile={activeSettlementInfo.tile} mapData={mapData} npcs={npcs} onClose={() => setActiveSettlementInfo(null)} gameTimeHours={gameTimeHours} season={season} />}
            {activeMiningModal && playerCharacter && <MiningModal structure={activeMiningModal} playerCharacter={playerCharacter} onClose={() => setActiveMiningModal(null)} onMine={() => {}} isMining={false} mineResult={null} />}
            {activePoi && mapData && <PointOfInterestModal structure={activePoi} mapData={mapData} onClose={() => setActivePoi(null)} />}
            {isCharacterProfileModalOpen && playerCharacter && (
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
            )}
            {isLevelUpModalOpen && levelUpCharacter && (
                <LevelUpModal character={levelUpCharacter} onLevelUp={handleLevelUp} />
            )}
            {isPortraitModalOpen && portraitModalCharacter && (
                <PortraitModal 
                    character={portraitModalCharacter} 
                    onClose={() => { setIsPortraitModalOpen(false); setPortraitModalCharacter(null); }} 
                />
            )}
            {isCraftingModalOpen && craftingModalData && (
                <CraftingModal
                    isOpen={isCraftingModalOpen}
                    onClose={() => closeAllModals()}
                    items={craftingModalData.items}
                    method={craftingModalData.method}
                    onExecuteCrafting={handleExecuteCrafting}
                />
            )}
        </>
    );
}

export default ModalHub;