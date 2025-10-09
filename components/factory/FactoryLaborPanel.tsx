/**
 * components/factory/FactoryLaborPanel.tsx
 * Main factory labor minigame panel - clean UI like FarmPanel
 * Features: Contract negotiation, task cards, timed events, wage tracking, tabbed navigation
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Clock, DollarSign, AlertTriangle } from 'lucide-react';
import { PlayerCharacter, MapData, NpcEntity } from '../../types';
import { FactoryType } from '../../constants/gameData/factoryTypes';
import FactoryInteriorBanner from './FactoryInteriorBanner';
import FactoryTaskCard from './FactoryTaskCard';
import FactoryEventModal from './FactoryEventModal';
import ContractNegotiationModal from './ContractNegotiationModal';
import FactoryOverviewTab from './FactoryOverviewTab';
import FactoryWorkTab from './FactoryWorkTab';
import FactoryWorkersTab from './FactoryWorkersTab';
import { useFactoryShift } from '../../hooks/useFactoryShift';
import { gameSounds } from '../../services/gameSoundsService';

type TabType = 'overview' | 'work' | 'workers';

interface FactoryLaborPanelProps {
  factoryType: FactoryType;
  factoryName: string;
  playerCharacter: PlayerCharacter;
  mapData: MapData;
  nearbyNpcs: NpcEntity[];
  onClose: () => void;
  onWagesEarned: (amount: number) => void;
  onPlayerStateChange?: (changes: Partial<PlayerCharacter>) => void;
  onTimeAdvance?: (hours: number) => void;
}

export interface FactoryContract {
  hourlyWage: number;
  shiftLength: number; // hours
  breakTime: number; // minutes
  quotaRequired: number;
  bonusRate: number; // multiplier for exceeding quota
  penaltyRate: number; // multiplier for missing quota
}

export const FactoryLaborPanel: React.FC<FactoryLaborPanelProps> = ({
  factoryType,
  factoryName,
  playerCharacter,
  mapData,
  nearbyNpcs,
  onClose,
  onWagesEarned,
  onPlayerStateChange,
  onTimeAdvance
}) => {
  const [showContractModal, setShowContractModal] = useState(true);
  const [contract, setContract] = useState<FactoryContract | null>(null);
  const [currentEvent, setCurrentEvent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const centerRef = useRef<HTMLDivElement>(null);
  const [centerWidth, setCenterWidth] = useState(1000);

  // Get or create overseer NPC for contract negotiation
  const overseerNpc = useMemo(() => {
    const existing = nearbyNpcs.find(npc => npc.occupation === 'overseer') || nearbyNpcs[0];
    if (existing) return existing;

    // Create default overseer if none exists
    return {
      id: 'default-overseer',
      name: 'Factory Overseer',
      occupation: 'overseer',
      gender: 'male' as const,
      age: 45,
      health: 100,
      position: { x: 0, y: 0 },
      socialClass: 'bourgeoisie' as const,
      mood: 'neutral' as const,
      isHostile: false
    } as NpcEntity;
  }, [nearbyNpcs]);

  // Get center panel width for banner
  useEffect(() => {
    if (centerRef.current) {
      setCenterWidth(centerRef.current.offsetWidth);
    }
  }, []);

  // Initialize factory shift hook
  const shift = useFactoryShift({
    factoryType,
    contract,
    playerCharacter,
    mapData,
    onPlayerStateChange,
    onTimeAdvance,
    onEventTriggered: setCurrentEvent
  });

  // Start factory music when shift begins
  useEffect(() => {
    if (contract && !showContractModal) {
      // Wait a moment for modal to close, then start music
      const timer = setTimeout(() => {
        gameSounds.playFactoryMusic();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [contract, showContractModal]);

  // Stop factory music when panel closes
  useEffect(() => {
    return () => {
      gameSounds.stopFactoryMusic();
    };
  }, []);

  // Handle contract acceptance
  const handleContractAccepted = (acceptedContract: FactoryContract) => {
    setContract(acceptedContract);
    setShowContractModal(false);
    shift.startShift();
  };

  // Handle shift completion
  useEffect(() => {
    if (shift.shiftComplete) {
      const totalWages = shift.calculateWages();
      onWagesEarned(totalWages);
      // Show completion modal or close automatically
      setTimeout(() => onClose(), 2000);
    }
  }, [shift.shiftComplete]);

  // Format time remaining
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-gradient-to-b from-slate-900 via-slate-950 to-black">
      {/* Contract Negotiation Modal (shown first) */}
      {showContractModal && (
        <ContractNegotiationModal
          factoryType={factoryType}
          factoryName={factoryName}
          playerCharacter={playerCharacter}
          overseerNpc={overseerNpc}
          onAccept={handleContractAccepted}
          onDecline={onClose}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex bg-gradient-to-b from-slate-900 via-slate-950 to-slate-800">
        {/* Center Panel */}
        <div ref={centerRef} className="flex-1 flex flex-col">
          {/* Factory Interior Banner */}
          <div className="h-58 relative overflow-hidden">
            <FactoryInteriorBanner
              factoryType={factoryType}
              era={mapData.era}
              culturalZone={mapData.culturalZone}
              factoryName={factoryName}
              width={centerWidth}
              height={230}
              timeOfDay={shift.currentTime}
              shiftActive={shift.isActive}
            />

            {/* Close button */}
            <div className="absolute top-3 right-3">
              <button
                onClick={onClose}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800/80 hover:bg-rose-600 text-white border border-slate-600 hover:border-rose-400 shadow"
              >
                <X className="w-4 h-4" />
                End Shift
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-slate-900/70 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60 border-b border-slate-800/60">
            <div className="flex items-center justify-between">
              {/* Location info on left */}
              <div className="px-4 py-1 min-w-[280px]">
                <div className="text-md font-bold text-amber-400">
                  {factoryName}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {factoryType.name} • {mapData.localArea || mapData.culturalZone}
                </div>
              </div>

              {/* Tab buttons */}
              <div className="flex items-center">
                {(['overview', 'work', 'workers'] as TabType[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 text-sm font-medium capitalize transition-colors ${
                      activeTab === tab
                        ? 'text-amber-400 border-b-2 border-amber-400'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Shift stats on right */}
              <div className="px-4 py-1 min-w-[280px] text-right">
                <div className="text-sm text-slate-300">
                  <span className="text-green-400 font-bold">${shift.wagesEarned.toFixed(2)}</span> earned
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {formatTime(shift.elapsedMinutes)} / {formatTime(contract?.shiftLength ? contract.shiftLength * 60 : 480)}
                </div>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'overview' && (
              <FactoryOverviewTab
                factoryType={factoryType}
                factoryName={factoryName}
                contract={contract}
                elapsedMinutes={shift.elapsedMinutes}
                wagesEarned={shift.wagesEarned}
                outputProgress={shift.outputProgress}
                eventLog={shift.eventLog}
                taskHistory={shift.taskHistory}
              />
            )}

            {activeTab === 'work' && (
              <FactoryWorkTab
                activeTask={shift.activeTask}
                availableTasks={shift.availableTasks}
                playerFatigue={shift.playerFatigue}
                factoryTypeId={factoryType.id}
                onStartTask={shift.startTask}
                onPerformTimedAction={shift.performTimedAction}
                era={mapData.era}
                culturalZone={mapData.culturalZone}
                playerDexterity={playerCharacter.stats.dexterity}
              />
            )}

            {activeTab === 'workers' && (
              <FactoryWorkersTab
                nearbyNpcs={nearbyNpcs}
                coworkerRelations={{}}
              />
            )}
          </div>
        </div>

        {/* Right Sidebar - Character Card */}
        <div className="w-80 bg-gradient-to-b from-slate-800/95 via-slate-850/95 to-slate-900/95 border-l border-slate-700/50 flex flex-col p-5 overflow-y-auto">
          {/* Character Profile Card */}
          <div className="bg-slate-800/70 rounded-xl p-5 border border-slate-700 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-2xl">
                👤
              </div>
              <div>
                <h3 className="font-bold text-white">{playerCharacter.name}</h3>
                <p className="text-xs text-slate-400">{playerCharacter.profession || 'Worker'}</p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Health */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400">❤️ Health</span>
                  <span className="text-sm font-bold text-white">{shift.playerHealth}/{playerCharacter.maxHealth}</span>
                </div>
                <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 to-red-400"
                    style={{ width: `${(shift.playerHealth / playerCharacter.maxHealth) * 100}%` }}
                  />
                </div>
              </div>

              {/* Fatigue */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400">😴 Fatigue</span>
                  <span className="text-sm font-bold text-white">{shift.playerFatigue}/{playerCharacter.maxFatigue}</span>
                </div>
                <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-purple-400"
                    style={{ width: `${(shift.playerFatigue / playerCharacter.maxFatigue) * 100}%` }}
                  />
                </div>
              </div>

              {/* Coins */}
              <div className="pt-2 border-t border-slate-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">💰 Coins</span>
                  <span className="text-amber-400 font-bold">
                    {playerCharacter.inventory?.find(item => item.id === 'coins')?.quantity || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Contract Info */}
          {contract && (
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <h3 className="text-sm font-bold text-blue-300 uppercase tracking-wider mb-3">Active Contract</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Hourly Rate:</span>
                  <span className="text-green-400 font-bold">${contract.hourlyWage.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Shift Length:</span>
                  <span className="text-white">{contract.shiftLength}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Quota:</span>
                  <span className="text-amber-400">{contract.quotaRequired} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Break Time:</span>
                  <span className="text-white">{contract.breakTime} min</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Event Modal (for timed/random events) */}
      {currentEvent && (
        <FactoryEventModal
          event={currentEvent}
          onChoiceMade={(choice) => {
            shift.handleEventChoice(choice);
            setCurrentEvent(null);
          }}
        />
      )}
    </div>
  );
};

export default FactoryLaborPanel;
