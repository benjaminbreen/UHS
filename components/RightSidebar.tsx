import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useUI } from '../contexts/UIContext';
import { useMap } from '../contexts/MapContext';
import { useGame } from '../contexts/GameContext';
import { usePlayer } from '../contexts/PlayerContext';
import { getSafariOptimizedClassName } from '../utils/safariUtils';
import NarrationPanel from './NarrationPanel';
import InventoryPanel from './InventoryPanel';
import StudyPanel, { StudyData, StudiedItem } from './StudyPanel';
import { StudyAction } from '../types/studyTypes';
import { AnimatedPortrait } from './portraits';
import { SKILL_DATA, SKILL_BUTTON_ORDER } from '../constants/index';
import { SkillID } from '../types';
import ActionConfigModal from './ActionConfigModal';
import { useStudyActions } from '../hooks/useStudyActions';
import { journalService } from '../services/journalService';
import { Settings } from 'lucide-react';
import { AttributeBadgeList } from './AttributeBadge';

const MIN_SIDEBAR_WIDTH = 320;
const MAX_SIDEBAR_WIDTH = 520;
const DEFAULT_SIDEBAR_WIDTH = 380;
const RHS_WIDTH_KEY = 'rhs.sidebarWidth';
const RHS_TAB_KEY = 'rhs.activeTab';
const ACTION_BUTTONS_KEY = 'rhs.actionButtons';

type RightSidebarTab = 'narrator' | 'inventory' | 'study';

// Study-specific action button definitions
const STUDY_ACTIONS = [
  { id: 'observe', icon: '🔍', name: 'Observe', description: 'Examine item in detail', minItems: 1, maxItems: 1 },
  { id: 'compare', icon: '⚖️', name: 'Compare', description: 'Compare multiple items', minItems: 2, maxItems: 4 },
  { id: 'muse', icon: '💭', name: 'Muse', description: 'Reflect on deeper meaning', minItems: 1, maxItems: 2 },
  { id: 'anatomize', icon: '🔬', name: 'Anatomize', description: 'Break down into components', minItems: 1, maxItems: 1 }
];

const RightSidebar: React.FC = () => {
  const { setIsCharacterProfileModalOpen, onUseSkill, onSend, onCraft, combatant, inMiningRoguelike, onInventoryUpdate, setIsSkillsModalOpen, setSkillResult } = useUI();
  const { narrationHistory, playerInput, onPlayerInputChange, isNarratorLoading, gameTimeHours, contextualMessage } = useGame();
  const { playerCharacter, controlledIconX, controlledIconY, setShipDockX, setShipDockY, setCurrentVessel } = usePlayer();
  const { deployVesselToMap, mapData, localArea, culturalZone } = useMap();

  // Study actions hook
  const { executeStudyAction, isProcessing: isStudyProcessing } = useStudyActions();

  // Handle study action execution - now uses SkillsModal
  const handleStudyAction = async (actionId: string) => {
    const selectedItems = studyData.specimens.filter(item => selectedStudyItems.includes(item.id));
    if (selectedItems.length === 0) return;

    const action = STUDY_ACTIONS.find(a => a.id === actionId);
    if (!action) return;

    // Check item count requirements
    if (selectedItems.length < action.minItems || selectedItems.length > action.maxItems) {
      alert(`${action.name} requires ${action.minItems === action.maxItems ? action.minItems : `${action.minItems}-${action.maxItems}`} item(s). You have ${selectedItems.length} selected.`);
      return;
    }

    try {
      // Create StudySkillResult and trigger SkillsModal
      const result = await executeStudyAction(selectedItems[0], {
        id: actionId,
        name: action.name,
        emoji: action.emoji,
        prompt: action.name === 'Observe'
          ? 'Describe this item focusing on vivid sensory details - its weight, texture, temperature, smell, surface patterns, how light plays on it, any wear marks or patina. Write as if the reader is holding it in their hands right now. Be specific and visceral, not abstract or historical.'
          : `Provide a scholarly analysis using the ${action.name.toLowerCase()} approach.`,
        category: 'analytical',
        minInputLength: 0
      }, ''); // No user input required for now

      if (result.success && result.entry) {
        // Create StudySkillResult for SkillsModal
        const studyResult = {
          type: 'study' as const,
          action: action.name,
          actionEmoji: action.emoji,
          description: result.entry.content,
          items: selectedItems.map(item => ({
            name: item.name,
            emoji: item.emoji
          })),
          xpGained: 5,
          context: {
            location: localArea || 'Study Collection',
            date: result.entry.date,
            culturalZone: culturalZone,
            biome: mapData?.currentTile?.biomeType
          }
        };

        // Use the SkillsModal directly
        setSkillResult(studyResult);
        setIsSkillsModalOpen(true);
        setSelectedStudyItems([]); // Clear selection after successful study
      } else {
        alert(`Study action failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Study action failed:', error);
      alert('Study action failed. Please try again.');
    }
  };


  /* ---------------------------- state & persistence --------------------------- */
  const [activeTab, setActiveTab] = useState<RightSidebarTab>('narrator');
  const [studyData, setStudyData] = useState<StudyData>({
    specimens: [],
    encounters: []
  });
  const [sidebarWidth, setSidebarWidth] = useState<number>(DEFAULT_SIDEBAR_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(DEFAULT_SIDEBAR_WIDTH);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [actionButtons, setActionButtons] = useState<SkillID[]>(SKILL_BUTTON_ORDER);
  const [hoveredButton, setHoveredButton] = useState<number | null>(null);
  const [selectedStudyItems, setSelectedStudyItems] = useState<string[]>([]);

  useEffect(() => {
    try {
      const savedW = Number(localStorage.getItem(RHS_WIDTH_KEY));
      if (savedW) setSidebarWidth(Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, savedW)));
      const savedTab = (localStorage.getItem(RHS_TAB_KEY) || '') as RightSidebarTab;
      if (savedTab) setActiveTab(savedTab);
      const savedButtons = localStorage.getItem(ACTION_BUTTONS_KEY);
      if (savedButtons) {
        try {
          const parsed = JSON.parse(savedButtons) as SkillID[];
          if (Array.isArray(parsed) && parsed.length <= 4) {
            setActionButtons(parsed);
          }
        } catch {}
      }
    } catch {}
  }, []);

  useEffect(() => { try { localStorage.setItem(RHS_TAB_KEY, activeTab); } catch {} }, [activeTab]);

  // Auto-switch to inventory tab when mining is active
  useEffect(() => {
    if (inMiningRoguelike) {
      setActiveTab('inventory');
    }
  }, [inMiningRoguelike]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = sidebarWidth;
  }, [sidebarWidth]);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    const dx = resizeStartX.current - e.clientX; // dragging from left edge
    const newWidth = resizeStartWidth.current + dx;
    setSidebarWidth(Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, newWidth)));
  }, [isResizing]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    try { localStorage.setItem(RHS_WIDTH_KEY, String(sidebarWidth)); } catch {}
  }, [sidebarWidth]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
    } else {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  // Hotkey handler
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Check if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      const key = e.key;
      if (key >= '1' && key <= '4') {
        const index = parseInt(key) - 1;
        if (actionButtons[index]) {
          onUseSkill(actionButtons[index]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [actionButtons, onUseSkill]);

  const handleSaveActionButtons = useCallback((buttons: SkillID[]) => {
    setActionButtons(buttons);
    try {
      localStorage.setItem(ACTION_BUTTONS_KEY, JSON.stringify(buttons));
    } catch {}
  }, []);

  /* --------------------------------- profile -------------------------------- */
  const healthPercent = playerCharacter ? (playerCharacter.health / playerCharacter.maxHealth) * 100 : 100;
  const fatiguePercent = playerCharacter ? (playerCharacter.fatigue / playerCharacter.maxFatigue) * 100 : 0;
  const xpPercent = playerCharacter ? (playerCharacter.experience / playerCharacter.maxExperience) * 100 : 0;
  const repPercent = playerCharacter ? playerCharacter.mapReputation : 50;

  const statusInfo = useMemo(() => {
    if (!playerCharacter) return { text: 'Feeling okay', hasDisease: false as boolean, severity: '' as string };
    const healthPercent = playerCharacter.health / playerCharacter.maxHealth;
    const fatiguePercent = playerCharacter.fatigue / playerCharacter.maxFatigue;
    const xpPercent = playerCharacter.experience / playerCharacter.maxExperience;

    // active disease (wins)
    const dis = playerCharacter.diseaseHealth?.currentDiseases || [];
    const symptomatic = dis.filter((d: any) => d.stage === 'symptomatic' || d.stage === 'active');
    if (symptomatic.length) {
      const worst = symptomatic.reduce((a: any, b: any) => (b.severity > a.severity ? b : a));
      return { text: `Currently sick with ${worst.disease.severity} ${worst.disease.name.toLowerCase()}`, hasDisease: true, severity: worst.disease.severity };
    }

    if (fatiguePercent > 0.95) return { text: 'Feeling awful', hasDisease: false, severity: '' };
    if (fatiguePercent > 0.85) return { text: 'Utterly exhausted', hasDisease: false, severity: '' };
    if (healthPercent < 0.3) return { text: 'Gravely injured', hasDisease: false, severity: '' };
    if (xpPercent >= 0.9) return { text: 'On the verge of a breakthrough!', hasDisease: false, severity: '' };
    return { text: 'Feeling fine', hasDisease: false, severity: '' };
  }, [playerCharacter]);

  return (
    <div
      className={getSafariOptimizedClassName(
        'relative h-full flex flex-col flex-shrink-0 bg-sidebar-gradient-light dark:bg-sidebar-gradient shadow-sidebar-right-light dark:shadow-sidebar-right backdrop-blur-xl border-l border-slate-300/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200'
      )}
      style={{ width: `${sidebarWidth}px` }}
    >
      {/* Resize handle (grab from the left edge of the sidebar) */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute top-0 left-0 w-1 h-full cursor-ew-resize hover:bg-blue-400/30 transition-colors z-10"
        style={{ width: '4px' }}
        aria-label="Resize right sidebar"
      />

      <div className="flex flex-col h-full overflow-y-auto scrollbar-thin">
        {/* Player Profile Card */}
        <div className="flex-shrink-0 p-3">
          {playerCharacter && playerCharacter.appearance && (
            <div
              className="p-3 mb-3 transition-all duration-200 border rounded-2xl cursor-pointer
                         bg-gradient-to-br from-slate-800/90 to-slate-900/95 border-slate-600/50
                         hover:border-slate-500/70 hover:shadow-xl hover:shadow-black/30 hover:-translate-y-0.5"
              onClick={() => setIsCharacterProfileModalOpen(true)}
            >
              <div className="flex items-start gap-4 mb-3">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className="relative flex-shrink-0 w-24 h-24 overflow-hidden bg-gray-100 dark:bg-gray-900 rounded-full border-2 border-slate-400/70 dark:border-slate-500/70 shadow-xl shadow-slate-400/50 dark:shadow-black/50">
                      <div className="absolute inset-0 z-10 pointer-events-none rounded-full bg-gradient-to-br from-transparent via-transparent to-black/50"></div>
                      <div className="absolute inset-0 z-10 pointer-events-none rounded-full bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                      <div className="flex items-center justify-center w-full h-full">
                        <AnimatedPortrait
                          character={playerCharacter}
                          size={96}
                          trackChanges={true}
                          currentTile={mapData && controlledIconX !== null && controlledIconY !== null
                            ? mapData[controlledIconY]?.[controlledIconX]
                            : undefined}
                          gameTimeHours={gameTimeHours}
                          isInCombat={!!combatant}
                          contextualMessage={contextualMessage}
                        />
                      </div>
                    </div>
                    {/* XP ring: subtle progress arc behind avatar */}
                    <div
                      className="absolute inset-0 -z-10 rounded-full"
                      style={{
                        background: `conic-gradient(#60a5fa ${xpPercent * 3.6}deg, transparent 0deg)`
                      }}
                    />
                    {/* Attribute badges overlay - positioned in lower right of portrait */}
                    {playerCharacter.attributes && playerCharacter.attributes.length > 0 && (
                      <div
                        className="absolute bottom-0 right-0 z-20"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsCharacterProfileModalOpen(true);
                        }}
                        title="Click to view all attributes"
                      >
                        <AttributeBadgeList
                          badges={playerCharacter.attributes}
                          maxDisplay={2}
                          size="small"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-xl font-bold leading-tight text-slate-900 dark:text-white">{playerCharacter.name}</h4>
                      <p className="text-sm font-semibold text-amber-600 dark:text-amber-300 capitalize">{playerCharacter.profession}</p>
                      <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                        Age {playerCharacter.age} • {playerCharacter.gender || 'Unknown'}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-300">Level {playerCharacter.level}</p>
                      <div className="flex items-center justify-end gap-4 mt-1">
                        <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 flex items-center gap-1" title="Currency">
                          <span>💰</span>
                          <span>{playerCharacter.currency}</span>
                        </p>
                        <p className="text-sm font-semibold text-green-600 dark:text-green-400 flex items-center gap-1" title={`Map Reputation: ${repPercent}/100`}>
                          <span>🤝</span>
                          <span>{repPercent}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Disease badges */}
                  {playerCharacter.diseaseHealth?.currentDiseases?.length ? (
                    <div className="mt-2">
                      {playerCharacter.diseaseHealth.currentDiseases.map((d: any, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-pink-600/80 text-white text-xs font-bold rounded-full 
                                     border border-pink-400 shadow-md mr-2 mb-1"
                          title={`${d.disease.name} - ${d.disease.severity}`}
                        >
                          <span className="text-sm">{d.disease.badgeIcon}</span>
                          <span>{d.disease.name}</span>
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {/* Status */}
                  <p
                    className={
                      statusInfo.hasDisease
                        ? `mt-2 text-xs font-bold ${
                            statusInfo.severity === 'critical' || statusInfo.severity === 'severe'
                              ? 'text-red-500'
                              : statusInfo.severity === 'moderate'
                              ? 'text-orange-500'
                              : 'text-orange-400'
                          }`
                        : 'mt-2 text-xs italic text-amber-200'
                    }
                  >
                    {statusInfo.text}
                  </p>
                </div>
              </div>

              {/* Bars */}
              <div className="space-y-2 mt-2">
                <div>
                  <div className="flex items-center justify-between mb-1 text-[0.625rem] font-semibold tracking-widest text-gray-600 dark:text-gray-400">
                    <span>HEALTH</span>
                    <span>
                      {Math.ceil(playerCharacter.health)} / {Math.ceil(playerCharacter.maxHealth)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 overflow-hidden bg-gray-300 dark:bg-gray-700 rounded-full shadow-inner">
                    <div
                      className="h-full transition-all duration-500 rounded-full bg-gradient-to-r from-red-500 via-orange-400 to-yellow-400 shadow-sm"
                      style={{ width: `${healthPercent}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1 text-[0.625rem] font-semibold tracking-widest text-gray-600 dark:text-gray-400">
                    <span>FATIGUE</span>
                    <span>
                      {Math.ceil(playerCharacter.fatigue)} / {Math.ceil(playerCharacter.maxFatigue)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 overflow-hidden bg-gray-300 dark:bg-gray-700 rounded-full shadow-inner">
                    <div
                      className="h-full transition-all duration-500 rounded-full bg-gradient-to-r from-amber-400 via-amber-600 to-orange-600 shadow-sm"
                      style={{ width: `${fatiguePercent}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1 text-[0.625rem] font-semibold tracking-widest text-gray-600 dark:text-gray-400">
                    <span>EXPERIENCE</span>
                    <span>
                      {Math.ceil(playerCharacter.experience)} / {Math.ceil(playerCharacter.maxExperience)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 overflow-hidden bg-gray-300 dark:bg-gray-700 rounded-full shadow-inner">
                    <div
                      className="h-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full shadow-sm"
                      style={{ width: `${xpPercent}%` }}
                    />
                  </div>
                </div>

                {/* Elevated State Indicator */}
                {playerCharacter.elevatedState && (
                  <div className="mt-3 px-2 py-1 bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-700/30 rounded-lg">
                    <div className="flex items-center justify-between text-[0.625rem] font-semibold tracking-widest">
                      <span className="text-purple-300">🌲 ELEVATED</span>
                      <span className="text-purple-200 capitalize">{playerCharacter.elevatedState.replace('_', ' ')}</span>
                    </div>
                    <div className="text-[0.575rem] text-purple-300/80 mt-1">
                      {playerCharacter.elevationDescription || 'In elevated position'}
                    </div>
                    <div className="text-[0.55rem] text-purple-400/60 mt-1">
                      Use "climb down" to return to ground
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mb-0">
            <div className="flex items-center justify-between mb-2 mt-1">
              <h4 className="text-xs tracking-wider text-gray-400 uppercase">Actions</h4>
              <button
                onClick={() => setConfigModalOpen(true)}
                className="p-1 text-gray-400 hover:text-white hover:bg-slate-700/50 rounded transition-all"
                title="Configure action buttons"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {activeTab === 'study' ? (
                // Study-specific action buttons
                STUDY_ACTIONS.map((action, index) => {
                  const isDisabled = selectedStudyItems.length < action.minItems || selectedStudyItems.length > action.maxItems;
                  return (
                    <div key={action.id} className="relative">
                      <button
                        onClick={() => handleStudyAction(action.id)}
                        onMouseEnter={() => setHoveredButton(index)}
                        onMouseLeave={() => setHoveredButton(null)}
                        disabled={isDisabled || isStudyProcessing}
                        className={`group relative w-full flex flex-col items-center justify-center px-2 py-1.5 text-md font-semibold transition-all duration-200 border rounded-lg
                                   ${isDisabled || isStudyProcessing
                                     ? 'text-gray-500 bg-slate-800/40 border-gray-700/30 cursor-not-allowed'
                                     : 'text-gray-300 bg-gradient-to-br from-slate-700/80 to-slate-800/60 border-gray-600/50 hover:bg-gradient-to-br hover:from-slate-600/90 hover:to-slate-700/70 hover:border-purple-400/50 hover:text-white hover:shadow-lg'
                                   }`}
                        style={{ aspectRatio: '1 / 0.7' }}
                      >
                        {/* Hotkey indicator */}
                        <div className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center bg-purple-600/30 text-purple-300 text-[10px] font-bold rounded border border-purple-500/30">
                          {index + 1}
                        </div>
                        <div
                          className="mb-0.5 text-base"
                          style={{
                            filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.3))',
                            textShadow: '0 0 8px rgba(255,255,255,0.4)'
                          }}
                        >
                          {action.icon}
                        </div>
                        <span className="text-[11px] leading-tight text-center">{action.name}</span>
                      </button>

                      {/* Tooltip */}
                      {hoveredButton === index && (
                        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900/95 border border-slate-600/50 rounded-lg shadow-xl pointer-events-none animate-fadeIn">
                          <p className="text-xs font-semibold text-white mb-1">{action.name}</p>
                          <p className="text-[10px] text-gray-300 mb-2">{action.description}</p>
                          <div className="flex items-center gap-2 text-[10px] text-purple-300">
                            <kbd className="px-1 py-0.5 bg-slate-800 border border-slate-600 rounded">{index + 1}</kbd>
                            <span>Press to activate</span>
                          </div>
                          {isDisabled && (
                            <p className="text-[10px] text-red-400 mt-2">
                              Select {action.minItems === action.maxItems ? action.minItems : `${action.minItems}-${action.maxItems}`} item(s)
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                // Regular action buttons for other tabs
                actionButtons.map((skillId, index) => {
                  const skill = SKILL_DATA[skillId];
                  if (!skill) return null;
                  return (
                    <div key={skillId} className="relative">
                      <button
                        onClick={() => onUseSkill(skillId)}
                        onMouseEnter={() => setHoveredButton(index)}
                        onMouseLeave={() => setHoveredButton(null)}
                        className="group relative w-full flex flex-col items-center justify-center px-2 py-1.5 text-md font-semibold text-gray-300 transition-all duration-200 border rounded-lg
                                   bg-gradient-to-br from-slate-700/80 to-slate-800/60 border-gray-600/50
                                   hover:bg-gradient-to-br hover:from-slate-600/90 hover:to-slate-700/70 hover:border-blue-400/50 hover:text-white hover:shadow-lg"
                        style={{ aspectRatio: '1 / 0.7' }}
                      >
                        {/* Hotkey indicator */}
                        <div className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center bg-blue-600/30 text-blue-300 text-[10px] font-bold rounded border border-blue-500/30">
                          {index + 1}
                        </div>
                        <div
                          className="mb-0.5 text-base"
                          style={{
                            filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.3))',
                            textShadow: '0 0 8px rgba(255,255,255,0.4)'
                          }}
                        >
                          {skill.icon}
                        </div>
                        <span className="text-[11px] leading-tight text-center">{skill.name}</span>
                      </button>

                      {/* Tooltip */}
                      {hoveredButton === index && (
                        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900/95 border border-slate-600/50 rounded-lg shadow-xl pointer-events-none animate-fadeIn">
                          <p className="text-xs font-semibold text-white mb-1">{skill.name}</p>
                          <p className="text-[10px] text-gray-300 mb-2">{skill.description}</p>
                          <div className="flex items-center gap-2 text-[10px] text-blue-300">
                            <kbd className="px-1 py-0.5 bg-slate-800 border border-slate-600 rounded">{index + 1}</kbd>
                            <span>Press to activate</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex p-1.5 mx-2 mt-2 mb-2 bg-slate-800/50 border border-slate-600/50 rounded-xl shrink-0">
          <button
            onClick={() => setActiveTab('narrator')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'narrator'
                ? 'text-white bg-blue-600 shadow-glow-primary'
                : 'text-slate-400 hover:bg-slate-700/30'
            }`}
          >
            Narrator
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'inventory'
                ? 'text-white bg-blue-600 shadow-glow-primary'
                : 'text-slate-400 hover:bg-slate-700/30'
            }`}
          >
            Inventory
          </button>
          <button
            onClick={() => {
              setActiveTab('study');
              // Dispatch event to auto-slide journal
              window.dispatchEvent(new CustomEvent('studyTabActivated'));
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'study'
                ? 'text-white bg-purple-600 shadow-glow-purple'
                : 'text-slate-400 hover:bg-slate-700/30'
            }`}
          >
            Study 🔬
          </button>
        </div>


        {/* Panels */}
        <div className="flex-1 min-h-0 px-3 pb-1">
          {activeTab === 'narrator' && (
            <NarrationPanel
              narrationHistory={narrationHistory}
              playerInput={playerInput}
              onPlayerInputChange={onPlayerInputChange}
              onSend={onSend}
              isLoading={isNarratorLoading}
            />
          )}

          {activeTab === 'inventory' && playerCharacter && (
            <InventoryPanel
              inventory={playerCharacter.inventory || []}
              playerCharacter={playerCharacter}
              onCraft={onCraft}
              onStudy={(items) => {
                // Add items to study data
                const studiedItems: StudiedItem[] = items.map(item => ({
                  ...item,
                  studyProgress: 0,
                  notes: [],
                  discoveredProperties: [],
                  dateStudied: Date.now()
                }));
                setStudyData(prev => ({
                  ...prev,
                  specimens: [...prev.specimens, ...studiedItems]
                }));
                // Switch to study tab
                setActiveTab('study');
              }}
              onInventoryUpdate={() => {}}
              deployVesselToMap={deployVesselToMap}
              playerX={controlledIconX}
              playerY={controlledIconY}
              setShipDockPosition={(x, y) => {
                setShipDockX(x);
                setShipDockY(y);
              }}
              setCurrentVessel={setCurrentVessel}
            />
          )}

          {activeTab === 'study' && (
            <StudyPanel
              studyData={studyData}
              selectedItems={selectedStudyItems}
              onSelectionChange={setSelectedStudyItems}
              onReturnToInventory={(item: StudiedItem) => {
                // Remove from study data and selection
                setStudyData(prev => ({
                  ...prev,
                  specimens: prev.specimens.filter(s => s.id !== item.id)
                }));
                setSelectedStudyItems(prev => prev.filter(id => id !== item.id));
                // Add back to inventory
                if (onInventoryUpdate) {
                  onInventoryUpdate();
                }
              }}
              onObserve={(entity) => {
                // Trigger observation action
                onUseSkill('Observe');
              }}
              onStudyAction={async (item: any, action: StudyAction, input: string) => {
                // This is now handled by the action buttons above
                console.log('[StudyAction] Legacy handler - this should not be called');
              }}
            />
          )}
        </div>
      </div>
      
      {/* Action Configuration Modal */}
      <ActionConfigModal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        currentActions={actionButtons}
        onSave={handleSaveActionButtons}
      />
    </div>
  );
};

export default React.memo(RightSidebar);
