/**
 * components/farm/FarmPanelContainer.tsx
 * Main orchestrator for farm panel - coordinates hooks and renders tab components
 *
 * Phase 3 of Farm Panel refactoring
 */

import React, { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { FarmPanelProps, TabType, PANEL_RIGHT_W } from './types';
import { useFarmState } from '../../hooks/useFarmState';
import { useFarmFields } from '../../hooks/useFarmFields';
import { useFarmLLM } from '../../hooks/useFarmLLM';
import { useFarmCombat } from '../../hooks/useFarmCombat';
import { gameSounds } from '../../services/gameSoundsService';
import { generateFarmName } from '../../constants/gameData/farmNaming';
import FarmBanner from '../FarmBanner';
import NPCToast from '../NPCToast';

// Tab components
import FarmOverviewTab from './FarmOverviewTab';
import FarmFieldsTab from './FarmFieldsTab';
import FarmWorkTab from './FarmWorkTab';
import FarmFamilyTab from './FarmFamilyTab';
import FarmTradeTab from './FarmTradeTab';
import FarmAdvisorTab from './FarmAdvisorTab';
import FarmRightSidebar from './FarmRightSidebar';

interface FarmPanelContainerProps extends FarmPanelProps {}

export const FarmPanelContainer: React.FC<FarmPanelContainerProps> = (props) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // Initialize custom hooks
  const farmStateHook = useFarmState({
    tile: props.tile,
    mapData: props.mapData,
    gameTimeHours: props.gameTimeHours,
    currentGameDay: props.currentGameDay,
  });

  const farmFieldsHook = useFarmFields({
    farmState: farmStateHook.farmState,
    setFarmState: farmStateHook.setFarmState,
    culturalZone: farmStateHook.culturalZone,
    era: farmStateHook.era,
    season: props.season,
  });

  const farmLLMHook = useFarmLLM({
    farmState: farmStateHook.farmState,
    setFarmState: farmStateHook.setFarmState,
    playerCharacter: props.playerCharacter,
    mapData: props.mapData,
    culturalZone: farmStateHook.culturalZone,
    era: farmStateHook.era,
    season: props.season,
    timeOfDay: farmStateHook.timeOfDay,
    validCrops: farmFieldsHook.validCrops,
    useLlm: props.useLlm || false,
    onPlayerStateChange: props.onPlayerStateChange,
  });

  const farmCombatHook = useFarmCombat({
    playerCharacter: props.playerCharacter,
    culturalZone: farmStateHook.culturalZone,
    onClose: props.onClose,
    onInitiateEncounter: props.onInitiateEncounter,
  });

  // Generate dynamic farm name
  const primaryCrop = props.tile.cropType || farmFieldsHook.validCrops[0] || 'wheat';
  const dynamicFarmName = React.useMemo(() => {
    if (!farmStateHook.farmState) return 'The Farm';
    const farmerName =
      farmStateHook.headFarmer?.name?.split(' ')[0] ||
      farmStateHook.farmState.family.headOfHousehold.split(' ')[0];
    return generateFarmName(
      farmerName,
      farmStateHook.culturalZone,
      farmStateHook.era,
      primaryCrop !== 'none' ? primaryCrop : undefined
    );
  }, [farmStateHook.farmState, farmStateHook.headFarmer, farmStateHook.culturalZone, farmStateHook.era, primaryCrop]);

  // Get prosperity display info
  const prosperityInfo = React.useMemo(() => {
    const status = farmStateHook.farmState?.economicStatus || 'humble';
    const config = {
      humble: { label: 'Modest', color: 'text-slate-400', bg: 'bg-slate-800/30', emoji: '🏚️' },
      prosperous: { label: 'Prosperous', color: 'text-emerald-400', bg: 'bg-emerald-900/20', emoji: '🏡' },
      wealthy: { label: 'Wealthy', color: 'text-amber-400', bg: 'bg-amber-900/20', emoji: '🏰' },
    };
    return config[status as keyof typeof config] || config.humble;
  }, [farmStateHook.farmState?.economicStatus]);

  // Audio on mount
  useEffect(() => {
    gameSounds.playFishingMusic();

    return () => {
      // Cleanup audio if needed
    };
  }, []);

  // Loading state
  if (farmStateHook.isLoading || !farmStateHook.farmState) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-950 to-black">
        <div className="text-slate-400 text-lg">Loading farm...</div>
      </div>
    );
  }

  // Error state
  if (farmStateHook.error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-950 to-black">
        <div className="text-center">
          <div className="text-red-400 text-lg mb-4">Failed to load farm</div>
          <button
            onClick={props.onClose}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex bg-gradient-to-b from-slate-900 via-slate-950 to-black">
      {/* Transition overlay */}
      {farmStateHook.isTransitioning && (
        <div
          className="fixed inset-0 z-50 bg-black transition-opacity duration-1000"
          style={{ opacity: farmStateHook.isTransitioning ? 1 : 0 }}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex bg-gradient-to-b from-slate-900 via-slate-950 to-black">
        {/* Center panel */}
        <div ref={farmStateHook.centerRef} className="flex-1 flex flex-col">
          {/* Banner */}
          <div className="h-48 relative overflow-hidden">
            <FarmBanner
              era={farmStateHook.era}
              culturalZone={farmStateHook.culturalZone}
              condition={farmStateHook.farmState.economicStatus === 'wealthy' ? 'prosperous' : 'humble'}
              cropType={primaryCrop}
              climate={props.mapData.climate}
              season={props.season}
              timeOfDay={farmStateHook.timeOfDay}
              farmName={dynamicFarmName}
              farmerName={farmStateHook.headFarmer?.name || farmStateHook.farmState.family.headOfHousehold}
              width={farmStateHook.centerWidth}
              height={192}
            />
            <div className="absolute top-3 right-3 flex items-center gap-2">
              {props.useLlm && (
                <button
                  onClick={farmLLMHook.refreshFarmFlavor}
                  disabled={farmLLMHook.isRefreshingFlavor}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700/80 hover:bg-emerald-600 text-white border border-emerald-400/30 shadow"
                >
                  <Sparkles className="w-4 h-4" />
                  {farmLLMHook.isRefreshingFlavor ? 'Refreshing…' : 'Refresh Farm Flavor'}
                </button>
              )}
              <button
                onClick={props.onClose}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800/80 hover:bg-rose-600 text-white border border-slate-600 hover:border-rose-400 shadow"
              >
                <X className="w-4 h-4" />
                Close
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-slate-900/70 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60 border-b border-slate-800/60">
            <div className="flex items-center justify-between">
              {/* Location and time on left */}
              <div className="px-4 py-3 min-w-[200px]">
                <div className="text-xs text-slate-400">{props.mapData.localArea || farmStateHook.culturalZone}</div>
              </div>

              {/* Tab buttons */}
              <div className="flex items-center">
                {(['overview', 'fields', 'work', 'family', 'trade', 'advisor'] as TabType[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 text-sm font-medium capitalize transition-colors ${
                      activeTab === tab
                        ? 'text-amber-400 border-b-2 border-amber-400'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab === 'work' ? 'Farm Work' : tab}
                  </button>
                ))}
              </div>

              {/* Empty space on right for symmetry */}
              <div className="px-4 py-3 min-w-[200px]" />
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'overview' && (
              <FarmOverviewTab
                farmState={farmStateHook.farmState}
                dynamicFarmName={dynamicFarmName}
                headFarmer={farmStateHook.headFarmer}
                year={farmStateHook.year}
                season={props.season}
                primaryCrop={primaryCrop}
                prosperityInfo={prosperityInfo}
                expandedCard={expandedCard}
                setExpandedCard={setExpandedCard}
                plantAll={farmFieldsHook.plantAll}
                waterAll={farmFieldsHook.waterAll}
                harvestAll={farmFieldsHook.harvestAll}
                isRefreshingFlavor={farmLLMHook.isRefreshingFlavor}
                refreshFarmFlavor={farmLLMHook.refreshFarmFlavor}
                useLlm={props.useLlm || false}
              />
            )}

            {activeTab === 'fields' && (
              <FarmFieldsTab
                farmState={farmStateHook.farmState}
                headFarmer={farmStateHook.headFarmer}
                fieldHooks={farmFieldsHook}
                llmHooks={farmLLMHook}
                season={props.season}
                useLlm={props.useLlm || false}
                onPlayerStateChange={props.onPlayerStateChange}
              />
            )}

            {activeTab === 'work' && (
              <FarmWorkTab
                farmState={farmStateHook.farmState}
                headFarmer={farmStateHook.headFarmer}
                llmHooks={farmLLMHook}
                fieldHooks={farmFieldsHook}
                season={props.season}
                useLlm={props.useLlm || false}
              />
            )}

            {activeTab === 'family' && (
              <FarmFamilyTab
                farmState={farmStateHook.farmState}
                llmHooks={farmLLMHook}
                combatHooks={farmCombatHook}
                useLlm={props.useLlm || false}
              />
            )}

            {activeTab === 'trade' && (
              <FarmTradeTab
                harvestLedger={farmFieldsHook.harvestLedger}
                setHarvestLedger={farmFieldsHook.setHarvestLedger}
                validCrops={farmFieldsHook.validCrops}
                seedPriceMultiplier={1.0}
                onBuy={props.onBuy}
                onSell={props.onSell}
              />
            )}

            {activeTab === 'advisor' && (
              <FarmAdvisorTab
                llmHooks={farmLLMHook}
                farmState={farmStateHook.farmState}
                mapData={props.mapData}
                season={props.season}
                year={farmStateHook.year}
                useLlm={props.useLlm || false}
              />
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <FarmRightSidebar
          playerCharacter={props.playerCharacter}
          season={props.season}
          year={farmStateHook.year}
          onProgressTime={props.onProgressTime}
        />
      </div>

      {/* NPCToast for head farmer */}
      {farmLLMHook.farmerToast && farmStateHook.headFarmer && activeTab === 'overview' && (
        <NPCToast
          npc={farmStateHook.headFarmer as any}
          message={farmLLMHook.farmerToast.message}
          type={farmLLMHook.farmerToast.type}
          onClose={() => farmLLMHook.setFarmerToast(null)}
          persistent={false}
          enableLLMChat={false}
        />
      )}
    </div>
  );
};

export default FarmPanelContainer;
