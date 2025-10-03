import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';

// CSS keyframes for progress bar animation
const progressBarStyles = `
  @keyframes progressFillIn {
    from { width: 0%; }
    to { width: var(--final-width); }
  }
  .progress-bar-animated {
    animation: progressFillIn 1s ease-out forwards;
  }
`;
import { useUI } from '../contexts/UIContext';
import { useMap } from '../contexts/MapContext';
import { useGame } from '../contexts/GameContext';
import { usePlayer } from '../contexts/PlayerContext';
import { getSafariOptimizedClassName, isSafari } from '../utils/safariUtils';
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
import SourceDiscussionHistoryPanel from './SourceDiscussionHistoryPanel';
import { loadDiscussionHistory } from '../services/sourceDiscussionPersistence';

const MIN_SIDEBAR_WIDTH = 320;
const MAX_SIDEBAR_WIDTH = 520;
const DEFAULT_SIDEBAR_WIDTH = 380;
const RHS_WIDTH_KEY = 'rhs.sidebarWidth';
const RHS_TAB_KEY = 'rhs.activeTab';
const ACTION_BUTTONS_KEY = 'rhs.actionButtons';

type RightSidebarTab = 'narrator' | 'inventory' | 'study' | 'sources';

// Study-specific action button definitions
const STUDY_ACTIONS = [
  { id: 'observe', icon: '🔍', name: 'Observe', description: 'Examine item in detail', minItems: 1, maxItems: 1 },
  { id: 'compare', icon: '⚖️', name: 'Compare', description: 'Compare multiple items', minItems: 2, maxItems: 4 },
  { id: 'muse', icon: '💭', name: 'Muse', description: 'Reflect on deeper meaning', minItems: 1, maxItems: 2 },
  { id: 'anatomize', icon: '🔬', name: 'Anatomize', description: 'Break down into components', minItems: 1, maxItems: 1 }
];

interface RightSidebarProps {
  isProcessingWorldWeaver?: boolean;
}

const RightSidebar: React.FC<RightSidebarProps> = ({ isProcessingWorldWeaver = false }) => {
  const { setIsCharacterProfileModalOpen, onUseSkill, onSend, onCraft, combatant, inMiningRoguelike, onInventoryUpdate, setIsSkillsModalOpen, setSkillResult, setIsCampModalOpen } = useUI();
  const { narrationHistory, playerInput, onPlayerInputChange, isNarratorLoading, gameTimeHours, contextualMessage } = useGame();
  const { playerCharacter, controlledIconX, controlledIconY, setShipDockX, setShipDockY, setCurrentVessel } = usePlayer();
  const { deployVesselToMap, deployBridgeToMap, mapData, localArea, culturalZone } = useMap();

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
  const [discussionHistory, setDiscussionHistory] = useState(() => {
    const history = loadDiscussionHistory();
    return history || { discussions: [], sources: [], lastUpdated: Date.now() };
  });

  // Enhanced Safari performance optimization
  useEffect(() => {
    if (isSafari()) {
      const style = document.createElement('style');
      style.id = 'safari-rightsidebar-optimization';
      style.textContent = `
        .right-sidebar button:not(.portrait-container button),
        .sidebar-content button:not(.portrait-container button) {
          filter: none !important;
          drop-shadow: none !important;
          text-shadow: none !important;
          -webkit-filter: none !important;
          transition: background-color 0.2s ease, transform 0.15s ease !important;
          will-change: auto !important;
        }
        .right-sidebar *:not(.portrait-container *):not(svg):not(svg *) {
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }
        /* Preserve SVG filters for portrait rendering */
        .right-sidebar svg filter,
        .right-sidebar svg *[filter],
        .portrait-container svg,
        .portrait-container svg * {
          filter: inherit !important;
          -webkit-filter: inherit !important;
        }
        /* Optimize animations for Safari */
        .animate-fadeIn, .animate-pulse {
          animation: none !important;
        }
        /* Reduce transform complexity */
        .right-sidebar .transform {
          -webkit-transform: translateZ(0) !important;
          transform: translateZ(0) !important;
        }
       
      `;
      document.head.appendChild(style);
      return () => {
        const existingStyle = document.getElementById('safari-rightsidebar-optimization');
        if (existingStyle) existingStyle.remove();
      };
    }
  }, []);

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

  // Debounced resize for better performance
  const debouncedSetWidth = useCallback((width: number) => {
    setSidebarWidth(width);
  }, []);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    const dx = resizeStartX.current - e.clientX; // dragging from left edge
    const newWidth = resizeStartWidth.current + dx;
    const clampedWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, newWidth));

    // Use requestAnimationFrame for smoother resizing
    requestAnimationFrame(() => {
      debouncedSetWidth(clampedWidth);
    });
  }, [isResizing, debouncedSetWidth]);

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

  // Memoize click handlers to avoid hook violations
  const handleStudyActionClick = useCallback((actionId: string) => {
    handleStudyAction(actionId);
  }, [handleStudyAction]);

  const handleSkillClick = useCallback((skillId: SkillID) => {
    onUseSkill(skillId);
  }, [onUseSkill]);

  const handleProfileClick = useCallback(() => {
    setIsCharacterProfileModalOpen(true);
  }, [setIsCharacterProfileModalOpen]);

  const handleConfigClick = useCallback(() => {
    setConfigModalOpen(true);
  }, []);

  const handleTabClick = useCallback((tab: RightSidebarTab) => {
    setActiveTab(tab);
    if (tab === 'study') {
      window.dispatchEvent(new CustomEvent('studyTabActivated'));
    }
  }, []);

  const handleAttributeClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCharacterProfileModalOpen(true);
  }, [setIsCharacterProfileModalOpen]);

  /* --------------------------------- profile -------------------------------- */
  // Memoize expensive calculations for better performance
  const { healthPercent, fatiguePercent, xpPercent, repPercent } = useMemo(() => {
    if (!playerCharacter) return { healthPercent: 100, fatiguePercent: 0, xpPercent: 0, repPercent: 50 };
    const health = (playerCharacter.health / playerCharacter.maxHealth) * 100;
    const fatigue = (playerCharacter.fatigue / playerCharacter.maxFatigue) * 100;
    const xp = (playerCharacter.experience / playerCharacter.maxExperience) * 100;

    return {
      healthPercent: health,
      fatiguePercent: fatigue,
      xpPercent: xp,
      repPercent: playerCharacter.mapReputation || 50
    };
  }, [playerCharacter?.health, playerCharacter?.maxHealth, playerCharacter?.fatigue, playerCharacter?.maxFatigue, playerCharacter?.experience, playerCharacter?.maxExperience, playerCharacter?.mapReputation]);

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
      return { text: `Suffering from ${worst.disease.severity} ${worst.disease.name.toLowerCase()}`, hasDisease: true, severity: worst.disease.severity };
    }

    if (fatiguePercent > 0.95) return { text: 'Feeling awful', hasDisease: false, severity: '' };
    if (fatiguePercent > 0.85) return { text: 'Exhausted', hasDisease: false, severity: '' };
    if (fatiguePercent > 0.75) return { text: 'Feeling run down', hasDisease: false, severity: '' };
        if (fatiguePercent > 0.65) return { text: 'A bit tired', hasDisease: false, severity: '' };
         if (fatiguePercent > 0.5) return { text: 'Feeling so-so', hasDisease: false, severity: '' };
    if (healthPercent < 0.3) return { text: 'Gravely injured', hasDisease: false, severity: '' };
        if (xpPercent >= 0.5) return { text: 'Learning new things', hasDisease: false, severity: '' };
    if (xpPercent >= 0.9) return { text: 'On the verge of a breakthrough!', hasDisease: false, severity: '' };
    return { text: 'Feeling fine', hasDisease: false, severity: '' };
  }, [playerCharacter]);

  return (
    <>
      <style>{progressBarStyles}</style>
      <div
        className={`right-sidebar ${getSafariOptimizedClassName(
          'relative h-full flex flex-col flex-shrink-0 bg-sidebar-gradient-light dark:bg-sidebar-gradient shadow-sidebar-right-light dark:shadow-sidebar-right border-l border-slate-300/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200'
        )}`}
        style={{
          width: `${sidebarWidth}px`,
          opacity: isProcessingWorldWeaver ? 0 : 1,
          transition: 'opacity 2s ease-out',
          transitionDelay: isProcessingWorldWeaver ? '3s' : '0.5s' // Fade in 0.5s after processing ends
        }}
      >
      {/* Enhanced Resize handle with better UX */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute top-0 left-0 h-full cursor-ew-resize z-10 group transition-all duration-200"
        style={{ width: '6px', marginLeft: '-3px' }}
        aria-label="Resize right sidebar"
      >
        <div className="w-full h-full bg-transparent group-hover:bg-blue-400/40 transition-colors duration-200 relative">
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-8 bg-slate-500/40 rounded-full group-hover:bg-blue-400/80 transition-all duration-200 group-hover:h-12" />
        </div>
      </div>

      <div className="flex flex-col h-full overflow-y-auto scrollbar-thin">
        {/* Player Profile Card */}
        <div className="flex-shrink-0 p-2.5">
          {playerCharacter && playerCharacter.appearance && (
            <div
              className="p-3 mb-2 transition-[transform,border-color] duration-200 border rounded-2xl cursor-pointer
                         bg-gradient-to-br from-slate-800/95 via-slate-850/90 to-slate-900/95
                         border-slate-600/60
                         hover:border-slate-500/80 hover:-translate-y-1
                         active:translate-y-0"
              onClick={handleProfileClick}
            >
              <div className="flex items-start gap-4 mb-3">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className="portrait-container relative flex-shrink-0 w-24 h-24 overflow-hidden bg-gray-100 dark:bg-gray-900 rounded-full border-2 border-slate-400/70 dark:border-slate-500/70 shadow-xl shadow-slate-400/50 dark:shadow-black/50">
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
                        onClick={handleAttributeClick}
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
                  <div className="flex items-start justify-between mb-3 gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-bold leading-tight text-slate-900 dark:text-white break-words">{playerCharacter.name}</h4>
                      <p className="text-sm font-semibold text-amber-600 dark:text-amber-300 capitalize">{playerCharacter.profession}</p>
                      <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                        Age {playerCharacter.age} • {playerCharacter.gender || 'Unknown'}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right pl-2 min-w-0">
                      <p className="text-sm font-bold text-blue-600 dark:text-blue-300 whitespace-nowrap">Level {playerCharacter.level}</p>
                      <div className="flex flex-col items-end gap-1 mt-1">
                        <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 flex items-center gap-1" title="Currency">
                          <span>💰</span>
                          <span>{playerCharacter.currency}</span>
                        </p>
                        <p className="text-sm font-semibold text-green-600 dark:text-green-400 flex items-center gap-1" title={`Reputation: ${repPercent}/100`}>
                          <span>🤝</span>
                          <span>{repPercent}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Disease status and badges */}
                  {playerCharacter.diseaseHealth?.currentDiseases?.length ? (
                    <div className="mb-2">
                      {/* Disease badges */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {playerCharacter.diseaseHealth.currentDiseases.map((d: any, index: number) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-pink-600/80 text-white text-xs font-bold rounded-full
                                       border border-pink-400 shadow-md"
                            title={`${d.disease.name} - ${d.disease.severity}`}
                          >
                            <span className="text-sm">{d.disease.badgeIcon}</span>
                            <span>{d.disease.name}</span>
                          </span>
                        ))}
                      </div>
                      {/* Status text below portrait area */}
                      <p
                        className={`text-xs flex-shrink-0 ${
                          statusInfo.severity === 'critical' || statusInfo.severity === 'severe'
                            ? 'text-red-500'
                            : statusInfo.severity === 'moderate'
                            ? 'text-orange-500'
                            : 'text-orange-400'
                        }`}
                      >
                        {statusInfo.text}
                      </p>
                    </div>
                  ) : (
                    /* Status when no disease */
                    <p className="mb-2 text-xs italic text-amber-200">
                      {statusInfo.text}
                    </p>
                  )}
                </div>
              </div>

              {/* Enhanced Progress Bars with Skeumorphic Effects */}
              <div className="space-y-3 mt-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5 text-[0.625rem] font-semibold tracking-widest text-gray-400">
                    <span>HEALTH</span>
                    <span className={`transition-colors duration-200 ${
                      healthPercent < 10 ? 'text-red-400 font-bold text-sm' :
                      healthPercent < 20 ? 'text-orange-400 font-semibold' : 'text-gray-400'
                    }`}>
                      {Math.ceil(playerCharacter.health)} / {Math.ceil(playerCharacter.maxHealth)}
                    </span>
                  </div>
                  <div className="relative w-full h-2.5 bg-slate-900/90 rounded-full overflow-hidden shadow-inner">
                    {/* Outer inset shadow */}
                    <div className="absolute inset-0 rounded-full shadow-[inset_0_2px_3px_rgba(0,0,0,0.7),inset_0_-1px_2px_rgba(255,255,255,0.15)]" />
                    {/* Inner track with padding for inset effect */}
                    <div className="absolute inset-0.5 bg-slate-800/80 rounded-full" />
                    {/* Progress fill - FIXED: simpler positioning */}
                    <div className="absolute inset-0.5 rounded-full overflow-hidden">
                      <div
                        className="h-full progress-bar-animated rounded-full relative shadow-lg transition-all duration-500"
                        style={{
                          '--final-width': `${healthPercent}%`,
                          width: `${healthPercent}%`,
                          background: `linear-gradient(to right, #ef4444 0%, #fb923c 50%, #eab308 100%)`,
                          backgroundSize: `${healthPercent > 0 ? 100 / (healthPercent / 100) : 100}% 100%`,
                          backgroundPosition: '0 0'
                        }}
                      >
                        {/* Inner highlight */}
                        
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5 text-[0.625rem] font-semibold tracking-widest text-gray-400">
                    <span>FATIGUE</span>
                    <span className={`transition-colors duration-200 ${
                      fatiguePercent >= 90 ? 'text-red-400 font-bold text-sm' :
                      fatiguePercent >= 80 ? 'text-orange-400 font-semibold' : 'text-gray-400'
                    }`}>
                      {Math.ceil(playerCharacter.fatigue)} / {Math.ceil(playerCharacter.maxFatigue)}
                    </span>
                  </div>
                  <div className="relative w-full h-2.5 bg-slate-900/90 rounded-full overflow-hidden shadow-inner">
                    {/* Outer inset shadow */}
                    <div className="absolute inset-0 rounded-full shadow-[inset_0_2px_3px_rgba(0,0,0,0.7),inset_0_-1px_2px_rgba(255,255,255,0.15)]" />
                    {/* Inner track with padding for inset effect */}
                    <div className="absolute inset-0.3 bg-slate-800/80 rounded-full" />
                    {/* Progress fill - FIXED: simpler positioning */}
                    <div className="absolute inset-0.5 rounded-full overflow-hidden">
                      <div
                        className="h-full progress-bar-animated rounded-full relative shadow-lg transition-all duration-500"
                        style={{
                          '--final-width': `${fatiguePercent}%`,
                          width: `${fatiguePercent}%`,
                          animationDelay: '0.2s',
                          background: `linear-gradient(to right, #fbbf24 0%, #d97706 50%, #ea580c 100%)`,
                          backgroundSize: `${fatiguePercent > 0 ? 100 / (fatiguePercent / 100) : 100}% 100%`,
                          backgroundPosition: '0 0'
                        }}
                      >
                        {/* Inner highlight */}
                        
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5 text-[0.625rem] font-semibold tracking-widest text-gray-400">
                    <span>EXPERIENCE</span>
                    <span className="text-blue-400">
                      {Math.ceil(playerCharacter.experience)} / {Math.ceil(playerCharacter.maxExperience)}
                    </span>
                  </div>
                  <div className="relative w-full h-2.5 bg-slate-900/90 rounded-full overflow-hidden shadow-inner">
                    {/* Outer inset shadow */}
                   <div className="absolute inset-0 rounded-full shadow-[inset_0_2px_3px_rgba(0,0,0,0.7),inset_0_-1px_2px_rgba(255,255,255,0.15)]" />
                    {/* Inner track with padding for inset effect */}
                    <div className="absolute inset-0.3 bg-slate-800/80 rounded-full" />
                    {/* Progress fill - FIXED: simpler positioning */}
                    <div className="absolute inset-0.5 rounded-full overflow-hidden">
                      <div
                        className="h-full progress-bar-animated rounded-full relative shadow-lg transition-all duration-500"
                        style={{
                          '--final-width': `${xpPercent}%`,
                          width: `${xpPercent}%`,
                          animationDelay: '0.4s',
                          background: `linear-gradient(to right, #3b82f6 0%, #06b6d4 50%, #a855f7 100%)`,
                          backgroundSize: `${xpPercent > 0 ? 100 / (xpPercent / 100) : 100}% 100%`,
                          backgroundPosition: '0 0'
                        }}
                      >
                        {/* Inner highlight */}
                       
                      </div>
                    </div>
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
                onClick={handleConfigClick}
                className="p-1 text-gray-400 hover:text-white hover:bg-slate-700/50 rounded transition-all"
                title="Configure action buttons"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {activeTab === 'study' ? (
                // Study-specific action buttons - enhanced
                STUDY_ACTIONS.map((action, index) => {
                  const isDisabled = selectedStudyItems.length < action.minItems || selectedStudyItems.length > action.maxItems;
                  return (
                    <div key={action.id} className="relative">
                      <button
                        onClick={() => handleStudyActionClick(action.id)}
                        onMouseEnter={() => setHoveredButton(index)}
                        onMouseLeave={() => setHoveredButton(null)}
                        disabled={isDisabled || isStudyProcessing}
                        className={`group relative w-full flex flex-col items-center justify-center px-2 py-2 text-md font-semibold transition-all duration-300 border rounded-xl overflow-hidden
                                   ${isDisabled || isStudyProcessing
                                     ? 'text-gray-500 bg-slate-800/40 border-gray-700/30 cursor-not-allowed'
                                     : 'text-gray-300 bg-gradient-to-br from-slate-700/80 to-slate-800/60 border-gray-600/50 hover:bg-gradient-to-br hover:from-purple-600/80 hover:to-purple-700/60 hover:border-purple-400/70 hover:text-white hover:shadow-lg hover:shadow-purple-600/30 hover:scale-105 active:scale-95'
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

                      {/* Tooltip - smart positioning based on button position */}
                      {hoveredButton === index && (
                        <div className={`absolute z-50 bottom-full mb-2 w-48 p-2 bg-slate-900/95 border border-slate-600/50 rounded-lg shadow-xl pointer-events-none animate-fadeIn ${
                          index >= 2 ? 'right-0' : 'left-0'
                        }`}>
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
                // Regular action buttons for other tabs - enhanced
                actionButtons.map((skillId, index) => {
                  const skill = SKILL_DATA[skillId];
                  if (!skill) return null;
                  return (
                    <div key={skillId} className="relative">
                      <button
                        onClick={() => handleSkillClick(skillId)}
                        onMouseEnter={() => setHoveredButton(index)}
                        onMouseLeave={() => setHoveredButton(null)}
                        className="group relative w-full flex flex-col items-center justify-center px-2 py-2 text-md font-semibold text-gray-300 transition-all duration-300 border rounded-xl overflow-hidden
                                   bg-gradient-to-br from-slate-700/80 to-slate-800/60 border-gray-600/50
                                   hover:bg-gradient-to-br hover:from-blue-600/80 hover:to-blue-700/60 hover:border-blue-400/70 hover:text-white hover:shadow-lg hover:shadow-blue-600/30 hover:scale-105 active:scale-95"
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

                      {/* Tooltip - smart positioning based on button position */}
                      {hoveredButton === index && (
                        <div className={`absolute z-50 bottom-full mb-2 w-48 p-2 bg-slate-900/95 border border-slate-600/50 rounded-lg shadow-xl pointer-events-none animate-fadeIn ${
                          index >= 2 ? 'right-0' : 'left-0'
                        }`}>
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

        {/* Enhanced Tab Navigation */}
        <div className="flex p-1 mx-2 mt-1 mb-2 bg-slate-800 border border-slate-600/60 rounded-xl shrink-0">
          <button
            onClick={() => handleTabClick('narrator')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-300 relative overflow-hidden ${
              activeTab === 'narrator'
                ? 'text-white bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg shadow-blue-600/30 transform scale-105'
                : 'text-slate-400 hover:bg-slate-700/40 hover:text-slate-200 active:scale-95'
            }`}
          >
            <span className="relative z-10">Narrator</span>
          </button>
          <button
            onClick={() => handleTabClick('inventory')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-300 relative overflow-hidden ${
              activeTab === 'inventory'
                ? 'text-white bg-gradient-to-r from-emerald-600 to-emerald-700 shadow-lg shadow-emerald-600/30 transform scale-105'
                : 'text-slate-400 hover:bg-slate-700/40 hover:text-slate-200 active:scale-95'
            }`}
          >
            <span className="relative z-10">Inventory</span>
          </button>
          <button
            onClick={() => handleTabClick('study')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-300 relative overflow-hidden ${
              activeTab === 'study'
                ? 'text-white bg-gradient-to-r from-purple-600 to-purple-700 shadow-lg shadow-purple-600/30 transform scale-105'
                : 'text-slate-400 hover:bg-slate-700/40 hover:text-slate-200 active:scale-95'
            }`}
          >
            <span className="relative z-10">Study</span>
          </button>
          <button
            onClick={() => handleTabClick('sources')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-300 relative overflow-hidden ${
              activeTab === 'sources'
                ? 'text-white bg-gradient-to-r from-amber-600 to-amber-700 shadow-lg shadow-amber-600/30 transform scale-105'
                : 'text-slate-400 hover:bg-slate-700/40 hover:text-slate-200 active:scale-95'
            }`}
          >
            <span className="relative z-10">Sources</span>
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
              onOpenCampModal={() => setIsCampModalOpen(true)}
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
              deployBridgeToMap={deployBridgeToMap}
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

          {activeTab === 'sources' && (
            <SourceDiscussionHistoryPanel
              discussions={discussionHistory.discussions}
              sources={discussionHistory.sources}
              onSelectDiscussion={(discussion) => {
                // Could open a modal showing full discussion details
                console.log('Selected discussion:', discussion);
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
    </>
  );
};

export default React.memo(RightSidebar);
