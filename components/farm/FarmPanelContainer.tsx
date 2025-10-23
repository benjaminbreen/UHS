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
import { acceptWorkContract } from '../../services/farmService';
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
import FarmCalendarModal from './FarmCalendarModal';

interface FarmPanelContainerProps extends FarmPanelProps {}

// Helper: Get cultural zone color
const getCulturalZoneColor = (zone: string): string => {
  const colors: Record<string, string> = {
    'EUROPEAN': 'text-blue-400',
    'EAST_ASIAN': 'text-red-400',
    'MENA': 'text-amber-400',
    'NORTH_AMERICAN_PRE_COLUMBIAN': 'text-green-400',
    'NORTH_AMERICAN_COLONIAL': 'text-cyan-400',
    'OCEANIA': 'text-teal-400',
    'SOUTH_ASIAN': 'text-orange-400',
    'SOUTH_AMERICAN': 'text-lime-400',
    'SUB_SAHARAN_AFRICAN': 'text-yellow-400',
  };
  return colors[zone] || 'text-slate-300';
};

// Helper: Format game date and time
const formatGameDate = (gameDay: number, gameTimeHours: number): string => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = Math.floor((gameDay % 365) / 30);
  const day = (gameDay % 30) + 1;
  const hour = Math.floor(gameTimeHours % 24);
  const minute = Math.floor(((gameTimeHours % 24) - hour) * 60);
  return `${months[month]} ${day}, ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

export const FarmPanelContainer: React.FC<FarmPanelContainerProps> = (props) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [highlightedMemberId, setHighlightedMemberId] = useState<string | null>(null);
  const [pendingWorkInit, setPendingWorkInit] = useState<string | null>(null);
  const [toastDismissed, setToastDismissed] = useState(false);

  // Handle character click from FarmBanner
  const handleCharacterClick = (memberId: string) => {
    setActiveTab('household');
    setHighlightedMemberId(memberId);
    // Auto-clear highlight after 3 seconds
    setTimeout(() => setHighlightedMemberId(null), 3000);
  };

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
    currentGameDay: props.currentGameDay,
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
    gameTimeHours: props.gameTimeHours,
    year: farmStateHook.year,
    validCrops: farmFieldsHook.validCrops,
    useLlm: props.useLlm || false,
    onPlayerStateChange: props.onPlayerStateChange,
    onTimeAdvance: props.onTimeAdvance,
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

  // Handle work acceptance - switch to work tab and initialize session
  const handleAcceptWork = React.useCallback((tasks: string[], payment: { meals?: boolean; lodging?: boolean; coins?: number }) => {
    // Store the work contract (as per plan 1.2)
    const farmKey = farmStateHook.farmState?.tileKey;
    if (farmKey && farmStateHook.farmState) {
      // ✅ Use imported function instead of require()
      acceptWorkContract(farmKey, tasks, payment);

      // Update local farmState to reflect the new contract
      const updatedFarmState = {
        ...farmStateHook.farmState,
        residencyStatus: {
          ...(farmStateHook.farmState.residencyStatus || {
            playerStatus: 'visitor',
            daysWorked: 0,
            tasksCompleted: 0,
            trustLevel: 50
          }),
          playerStatus: 'worker' as const,
          currentContract: {
            type: 'daily' as const,
            daysRemaining: 1,
            payment,
            requiredTasks: tasks,
            tasksToday: tasks
          },
          negotiationRounds: 0
        }
      };
      farmStateHook.setFarmState(updatedFarmState);

      // Switch to work tab
      setActiveTab('work');

      // Store the first task to initialize work session after state update
      const firstTask = tasks[0] || 'Help around the farm';
      setPendingWorkInit(firstTask);
    }
  }, [farmStateHook, setActiveTab]);

  // Initialize work session when contract is set and we're on work tab
  useEffect(() => {
    if (pendingWorkInit && activeTab === 'work' && farmStateHook.farmState?.residencyStatus?.currentContract) {
      // Contract is now in place, safe to initialize
      farmLLMHook.initializeWorkSession(pendingWorkInit);
      setPendingWorkInit(null);
    }
  }, [pendingWorkInit, activeTab, farmStateHook.farmState?.residencyStatus?.currentContract, farmLLMHook]);

  // Loading state
  if (farmStateHook.isLoading || !farmStateHook.farmState) {
    return (
      <div className="fixed left-0 right-0 bottom-0 top-[72px] z-50 flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-950 to-black">
        <div className="text-slate-400 text-lg">Loading farm...</div>
      </div>
    );
  }

  // Error state
  if (farmStateHook.error) {
    return (
      <div className="fixed left-0 right-0 bottom-0 top-[72px] z-50 flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-950 to-black">
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
    <div className="fixed left-0 right-0 bottom-0 top-[72px] z-50 flex bg-gradient-to-b from-slate-900 via-slate-950 to-black">
      {/* Transition overlay */}
      {farmStateHook.isTransitioning && (
        <div
          className="fixed inset-0 z-50 bg-black transition-opacity duration-1000"
          style={{ opacity: farmStateHook.isTransitioning ? 1 : 0 }}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex bg-gradient-to-b from-slate-900 via-slate-950 to-slate-800">
        {/* Center panel */}
        <div ref={farmStateHook.centerRef} className="flex-1 flex flex-col">
          {/* Banner */}
          <div className="h-58 relative overflow-hidden">
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
              height={230}
              livestock={farmStateHook.farmState.livestock}
              householdMembers={farmStateHook.farmState.family.members.map(member => ({
                id: member.id,
                name: member.name,
                age: member.age,
                role: member.role,
                gender: member.gender,
                currentTask: member.currentTask
              }))}
              onCharacterClick={handleCharacterClick}
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
              <div className="px-4 py-1 min-w-[280px]">
                <div className={`text-md font-bold ${getCulturalZoneColor(farmStateHook.culturalZone)}`}>
                  {props.mapData.localArea || farmStateHook.culturalZone}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {formatGameDate(props.currentGameDay, props.gameTimeHours)}
                </div>
              </div>

              {/* Tab buttons */}
              <div className="flex items-center">
                {(['overview', 'fields', 'work', 'household', 'trade', 'advisor'] as TabType[]).map((tab) => (
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
              <div className="px-4 py-3 min-w-[280px]" />
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

            {activeTab === 'household' && (
              <FarmFamilyTab
                farmState={farmStateHook.farmState}
                llmHooks={farmLLMHook}
                combatHooks={farmCombatHook}
                useLlm={props.useLlm || false}
                highlightedMemberId={highlightedMemberId}
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
                validCrops={farmFieldsHook.validCrops}
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
          farmState={farmStateHook.farmState}
          plantAll={farmFieldsHook.plantAll}
          waterAll={farmFieldsHook.waterAll}
          harvestAll={farmFieldsHook.harvestAll}
          feedLivestock={farmFieldsHook.feedLivestock}
          progressFieldTime={farmFieldsHook.progressFieldTime}
          onOpenCalendar={() => setShowCalendar(true)}
          activeTab={activeTab}
          validCrops={farmFieldsHook.validCrops}
        />
      </div>

      {/* Farm Calendar Modal - Render at root level for full screen */}
      {showCalendar && farmStateHook.farmState && (
        <FarmCalendarModal
          farmState={farmStateHook.farmState}
          season={props.season}
          year={farmStateHook.year}
          validCrops={farmFieldsHook.validCrops}
          onClose={() => setShowCalendar(false)}
        />
      )}

      {/* NPCToast for head farmer - show on both overview and work tabs, but not if dismissed */}
      {!toastDismissed && farmLLMHook.farmerToast && farmStateHook.headFarmer && (activeTab === 'overview' || activeTab === 'work') && (
        <NPCToast
          character={{ ...farmStateHook.headFarmer, culturalZone: farmStateHook.culturalZone }}
          message={farmLLMHook.farmerToast.message}
          type={farmLLMHook.farmerToast.type}
          persistent={true}
          enableLLMChat={true}
          isFarmContext={true}
          gameTimeHours={props.gameTimeHours}
          farmProsperity={farmStateHook.farmState?.economicStatus || 'humble'}
          era={farmStateHook.era}
          playerCharacter={props.playerCharacter}
          mapData={props.mapData}
          npcs={props.npcs}
          farmState={farmStateHook.farmState}
          validCrops={farmFieldsHook.validCrops}
          onInitiateEncounter={farmCombatHook.handleInitiateEncounter}
          onRequestWork={() => {
            console.log('[FarmPanel] Work requested - switching to work tab');
          }}
          onRequestRest={(fee) => {
            console.log('[FarmPanel] Rest requested for fee:', fee);
          }}
          onAcceptWork={handleAcceptWork}
          onClose={() => {
            farmLLMHook.setFarmerToast(null);
            setToastDismissed(true);
          }}
          activeTab={activeTab}
        />
      )}
    </div>
  );
};

export default FarmPanelContainer;
