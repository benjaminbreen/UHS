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
import { getSafariOptimizedClassName, getOptimizedButtonClassName, isSafari } from '../utils/safariUtils';
import NarrationPanel from './NarrationPanel';
import InventoryPanelEnhanced from './InventoryPanelEnhanced';
import StudyPanel, { StudyData, StudiedItem } from './StudyPanel';
import { StudyAction } from '../types/studyTypes';
import { AnimatedPortrait } from './portraits';
import { SKILL_DATA, SKILL_BUTTON_ORDER } from '../constants/index';
import { SkillID, Item } from '../types';
import ActionConfigModal from './ActionConfigModal';
import { useStudyActions } from '../hooks/useStudyActions';
import { journalService } from '../services/journalService';
import { Settings } from 'lucide-react';
import { AttributeBadgeList } from './AttributeBadge';
import SourceDiscussionHistoryPanel from './SourceDiscussionHistoryPanel';
import { JournalQuotesPanel } from './JournalQuotesPanel';
import { loadDiscussionHistory } from '../services/sourceDiscussionPersistence';
import { FaBook, FaBoxOpen, FaMicroscope, FaScroll } from 'react-icons/fa';
import { removeItemFromInventory } from '../utils/inventoryUtils';

const MIN_SIDEBAR_WIDTH = 400;
const MAX_SIDEBAR_WIDTH = 700;
const DEFAULT_SIDEBAR_WIDTH = 520;
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
  const { setIsCharacterProfileModalOpen, onUseSkill, onSend, onCraft, onEat, combatant, inMiningRoguelike, onInventoryUpdate, setIsSkillsModalOpen, setSkillResult, setIsCampModalOpen, setPanelNotificationItem, setPanelNotificationMode } = useUI();
  const { narrationHistory, playerInput, onPlayerInputChange, isNarratorLoading, gameTimeHours, contextualMessage } = useGame();
  const { playerCharacter, controlledIconX, controlledIconY, setShipDockX, setShipDockY, setCurrentVessel, setPlayerCharacter } = usePlayer();
  const { deployVesselToMap, deployBridgeToMap, mapData, localArea, culturalZone, addDroppedItem } = useMap();

  // Detect dark mode for tab border colors
  const [isDarkMode, setIsDarkMode] = useState(false);
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const checkDarkMode = () => {
      // Debounce to avoid re-rendering during theme transition
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const isDark = document.documentElement.classList.contains('dark');
        setIsDarkMode(isDark);
      }, 50);
    };
    checkDarkMode();
    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, []);

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
        emoji: action.icon,
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
          actionEmoji: action.icon,
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

  // Handle dropping items on the map
  const handleDropItem = useCallback((item: Item) => {
    if (!playerCharacter || controlledIconX === null || controlledIconY === null || !addDroppedItem) {
      console.warn('[handleDropItem] Missing required data');
      return;
    }

    // Remove item from inventory (removeItemFromInventory returns { inventory, removedIds })
    const result = removeItemFromInventory(playerCharacter.inventory, item.name, 1);
    setPlayerCharacter({ ...playerCharacter, inventory: result.inventory });

    // Add item to map at player's current position
    addDroppedItem(controlledIconX, controlledIconY, item);

    // Show "ITEM DROPPED" notification
    setPanelNotificationMode('dropped');
    setPanelNotificationItem(item);
    setTimeout(() => setPanelNotificationItem(null), 2500);

    // Trigger inventory update
    if (onInventoryUpdate) {
      onInventoryUpdate();
    }
  }, [playerCharacter, controlledIconX, controlledIconY, addDroppedItem, setPlayerCharacter, onInventoryUpdate, setPanelNotificationItem, setPanelNotificationMode]);

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
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  const previousInventoryRef = useRef<string[]>([]);

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

  // Detect new items added to inventory
  useEffect(() => {
    if (!playerCharacter?.inventory) return;

    const currentInventoryIds = playerCharacter.inventory.map(item => item.id);
    const previousInventoryIds = previousInventoryRef.current;

    // Find newly added items
    const newItemIds = currentInventoryIds.filter(id => !previousInventoryIds.includes(id));

    if (newItemIds.length > 0) {
      // Automatically switch to inventory tab
      setActiveTab('inventory');

      // Highlight the first new item
      setHighlightedItemId(newItemIds[0]);

      // Clear highlight after 3 seconds
      setTimeout(() => {
        setHighlightedItemId(null);
      }, 3000);
    }

    // Update the ref to current inventory
    previousInventoryRef.current = currentInventoryIds;
  }, [playerCharacter?.inventory]);

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
        data-surface="sidebar-right"
        className={`right-sidebar ${getSafariOptimizedClassName(
          'theme-surface relative h-full flex flex-col flex-shrink-0 border-l'
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
        <div className="w-full h-full bg-transparent transition-colors duration-200 relative">
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-8 handle-pill transition-all duration-200 group-hover:h-12" />
        </div>
      </div>

      <div className="flex flex-col h-full overflow-y-auto scrollbar-thin">
        {/* Player Profile Card */}
        <div className="flex-shrink-0 p-2 px-3">
          {playerCharacter && playerCharacter.appearance && (
            <div
              className="surface-card rounded-xl p-3 px-4 mb-2 shadow-sm transition-all duration-300 ease-out cursor-pointer hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]"
              onClick={handleProfileClick}
            >
              <div className="flex items-start gap-4 mb-0">
                <div className="flex flex-col items-center">
                    <div className="relative">
                      <div className="portrait-container relative flex-shrink-0 w-24 h-24 overflow-hidden rounded-full border-2 shadow-xl"
                        style={{
                          background: 'var(--bg-elevated)',
                          borderColor: 'white',
                          boxShadow: '0 12px 28px rgba(63, 50, 33, 0.16)'
                        }}>
                      {/* Skeleton loader background */}
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 animate-pulse"></div>
                      <div className="absolute inset-0 z-10 pointer-events-none rounded-full bg-gradient-to-br from-transparent via-transparent to-black/50"></div>
                      <div className="absolute inset-0 z-10 pointer-events-none rounded-full bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                      <div className="flex items-center justify-center w-full h-full relative z-20">
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
                        background: `conic-gradient(var(--accent-primary) ${xpPercent * 3.6}deg, transparent 0deg)`
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
                    <div className="flex items-start justify-between mb-0.5 gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-bold leading-tight text-[var(--text-primary)] break-words tracking-tight">{playerCharacter.name}</h4>
                      <p className="text-md font-semibold text-[var(--accent-primary)] capitalize mt-0.5">{playerCharacter.profession}</p>
                      <p className="mt-0.5 font-semibold text-xs text-text-secondary leading-relaxed">
                        Age {playerCharacter.age} • {playerCharacter.gender || 'Unknown'}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right pl-3 min-w-0">
                      <p className="text-md font-bold text-[var(--accent-primary)] whitespace-nowrap tracking-tight mb-1">Level {playerCharacter.level}</p>
                      <div className="flex flex-col items-end gap-1.5 mt-1">
                        <p className="text-sm font-semibold text-[var(--color-warning)] flex items-center gap-1.5" title="Currency">
                          <span>💰</span>
                          <span>{playerCharacter.currency}</span>
                        </p>
                        <p className="text-sm font-semibold text-[var(--accent-primary)] flex items-center gap-1.5" title={`Reputation: ${repPercent}/100`}>
                          <span>🤝</span>
                          <span>{repPercent}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Disease status and badges */}
                  {playerCharacter.diseaseHealth?.currentDiseases?.length ? (
                    <div className="mb-1">
                      {/* Disease badges */}
                      <div className="flex flex-wrap gap-1 mb-0.5">
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
                        className={`text-xs flex-shrink-0 leading-relaxed ${
                          statusInfo.severity === 'critical' || statusInfo.severity === 'severe'
                            ? 'text-[var(--color-error)]'
                            : statusInfo.severity === 'moderate'
                            ? 'text-[var(--color-warning)]'
                            : 'text-[var(--color-warning)]'
                        }`}
                      >
                        {statusInfo.text}
                      </p>
                    </div>
                  ) : (
                    /* Status when no disease */
                    <p className="mb-1.5 text-xs italic text-[var(--accent-primary)] leading-relaxed">
                      {statusInfo.text}
                    </p>
                  )}
                </div>
              </div>

              {/* Compact Progress Bars */}
              <div className="space-y-1 mt-0">
                {/* Health Bar - Full Width */}
                <div>
                  <div className="flex items-center justify-between mb-1 text-[0.625rem] font-semibold tracking-[0.1em] text-slate-600 dark:text-slate-500">
                    <span>HEALTH</span>
                    <span className={`transition-colors duration-200 text-[0.6rem] ${
                      healthPercent < 10 ? 'text-[var(--color-error)] font-bold' :
                      healthPercent < 20 ? 'text-[var(--color-warning)] font-semibold' : 'text-text-secondary'
                    }`}>
                      {Math.ceil(playerCharacter.health)} / {Math.ceil(playerCharacter.maxHealth)}
                    </span>
                  </div>
                  <div className="relative w-full h-2 progress-track overflow-hidden shadow-inner rounded-full">
                    {/* Outer inset shadow */}
                    <div className="absolute inset-0 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),inset_0_-1px_1px_rgba(255,255,255,0.1)]" />
                    {/* Progress fill - Enhanced with gloss - REDUCED PADDING */}
                    <div className="absolute inset-0 rounded-full overflow-hidden">
                      <div
                        className="h-full progress-bar-animated rounded-full relative shadow-lg transition-all duration-500"
                        style={{
                          '--final-width': `${healthPercent}%`,
                          width: `${healthPercent}%`,
                          background: `linear-gradient(to right, #ef4444 10%, #fb923c 60%, #eab308 100%)`,
                          backgroundSize: `${healthPercent > 0 ? 100 / (healthPercent / 100) : 100}% 100%`,
                          backgroundPosition: '0 0'
                        }}
                      >
                        {/* Glass shine effect */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/30 via-transparent to-transparent" style={{ height: '40%' }} />
                        {/* Bottom glow */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/20 via-transparent to-transparent" style={{ height: '30%', bottom: 0 }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fatigue and Experience - Side by Side */}
                <div className="flex gap-2.5">
                  {/* Fatigue - Half Width */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1 text-[0.625rem] font-semibold tracking-[0.1em] text-slate-600 dark:text-slate-500">
                      <span>FATIGUE</span>
                      <span className={`transition-colors duration-200 text-[0.6rem] ${
                        fatiguePercent >= 90 ? 'text-[var(--color-error)] font-bold' :
                        fatiguePercent >= 80 ? 'text-[var(--color-warning)] font-semibold' : 'text-text-secondary'
                      }`}>
                        {Math.ceil(playerCharacter.fatigue)}
                      </span>
                    </div>
                    <div className="relative w-full h-2 progress-track overflow-hidden shadow-inner rounded-full">
                      {/* Outer inset shadow */}
                      <div className="absolute inset-0 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),inset_0_-1px_1px_rgba(255,255,255,0.1)]" />
                      {/* Progress fill - Enhanced with gloss - REDUCED PADDING */}
                      <div className="absolute inset-0 rounded-full overflow-hidden">
                        <div
                          className="h-full progress-bar-animated rounded-full relative shadow-lg transition-all duration-500"
                          style={{
                            '--final-width': `${fatiguePercent}%`,
                            width: `${fatiguePercent}%`,
                            animationDelay: '0.2s',
                            background: `linear-gradient(to right, #fbbf24 0%, #f59e0b 40%, #ea580c 100%)`,
                            backgroundSize: `${fatiguePercent > 0 ? 100 / (fatiguePercent / 100) : 100}% 100%`,
                            backgroundPosition: '0 0'
                          }}
                        >
                          {/* Glass shine effect */}
                          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/30 via-transparent to-transparent" style={{ height: '40%' }} />
                          {/* Bottom glow */}
                          <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/20 via-transparent to-transparent" style={{ height: '30%', bottom: 0 }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Experience - Half Width */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1 text-[0.625rem] font-semibold tracking-[0.1em] text-slate-600 dark:text-slate-500">
                      <span>XP</span>
                      <span className="text-accent text-[0.6rem]">
                        {Math.ceil(playerCharacter.experience)}
                      </span>
                    </div>
                    <div className="relative w-full h-2 progress-track overflow-hidden shadow-inner rounded-full">
                      {/* Outer inset shadow */}
                      <div className="absolute inset-0 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),inset_0_-1px_1px_rgba(255,255,255,0.1)]" />
                      {/* Progress fill - Enhanced with gloss - REDUCED PADDING */}
                      <div className="absolute inset-0 rounded-full overflow-hidden">
                        <div
                          className="h-full progress-bar-animated rounded-full relative shadow-lg transition-all duration-500"
                          style={{
                            '--final-width': `${xpPercent}%`,
                            width: `${xpPercent}%`,
                            animationDelay: '0.4s',
                            background: `linear-gradient(to right, #3b82f6 0%, #06b6d4 40%, #8b5cf6 80%, #a855f7 100%)`,
                            backgroundSize: `${xpPercent > 0 ? 100 / (xpPercent / 100) : 100}% 100%`,
                            backgroundPosition: '0 0'
                          }}
                        >
                          {/* Glass shine effect */}
                          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/30 via-transparent to-transparent" style={{ height: '40%' }} />
                          {/* Bottom glow */}
                          <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/20 via-transparent to-transparent" style={{ height: '30%', bottom: 0 }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Elevated State Indicator */}
                {playerCharacter.elevatedState && (
                  <div className="mt-3 px-3 py-2 bg-accent/10 border border-accent/30 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between text-[0.625rem] font-bold tracking-widest">
                      <span className="text-accent">🌲 ELEVATED</span>
                      <span className="text-text-primary capitalize">{playerCharacter.elevatedState.replace('_', ' ')}</span>
                    </div>
                    <div className="text-[0.575rem] text-text-secondary mt-1.5 leading-relaxed">
                      {playerCharacter.elevationDescription || 'In elevated position'}
                    </div>
                    <div className="text-[0.55rem] text-text-muted mt-1.5 leading-relaxed">
                      Use "climb down" to return to ground
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* Actions */}
          <div className="-mb-2 mt-1">
            <div className="flex items-center justify-between mb-1 px-1">
              <h4 className="text-[11px] tracking-[0.08em] text-slate-600 dark:text-slate-500 uppercase font-semibold">Actions</h4>
              <button
                onClick={handleConfigClick}
                className="p-0 px-1 text-text-muted surface-muted rounded transition-all hover:text-text-primary hover:shadow-sm"
                title="Configure action buttons"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {activeTab === 'study' ? (
                // Study-specific action buttons - enhanced
                STUDY_ACTIONS.map((action, index) => {
                  const isDisabled = selectedStudyItems.length < action.minItems || selectedStudyItems.length > action.maxItems;
                  return (
                    <div key={action.id} className="relative">
                      <div
                        onClick={() => !isDisabled && !isStudyProcessing && handleStudyActionClick(action.id)}
                        onMouseEnter={() => setHoveredButton(index)}
                        onMouseLeave={() => setHoveredButton(null)}
                        data-disabled={isDisabled || isStudyProcessing}
                        className="action-tile group relative w-full flex flex-col items-center justify-center px-2 py-2 text-md font-semibold cursor-pointer"
                        style={{ aspectRatio: '1 / 0.88' }}
                      >
                        {/* Hotkey indicator */}
                        <div className="absolute top-2 right-2 w-4 h-4 flex items-center justify-center rounded-full text-[10px] font-bold border border-[rgba(75,119,104,0.25)] bg-[rgba(75,119,104,0.12)] text-[var(--accent-primary)] shadow-sm backdrop-blur-sm">
                          {index + 1}
                        </div>
                        <div className="icon-wrapper mb-0.5">
                          <div className="text-2xl">
                            {action.icon}
                          </div>
                        </div>
                        <span className="text-xs font-semibold leading-tight text-center text-[var(--text-primary)] tracking-tight">{action.name}</span>
                      </div>

                      {/* Tooltip - smart positioning based on button position */}
                      {hoveredButton === index && (
                        <div className={`absolute z-50 bottom-full mb-2 w-40 p-2 tooltip-surface pointer-events-none animate-fadeIn ${
                          index >= 2 ? 'right-0' : 'left-0'
                        }`}>
                          <p className="text-xs font-semibold text-text-primary mb-1">{action.name}</p>
                          <p className="text-[10px] text-text-secondary mb-2">{action.description}</p>
                          {!isDisabled ? (
                            <div className="flex items-center gap-2 text-[10px] text-accent">
                              <kbd className="px-1 py-0.5 badge-pill" data-variant="accent">{index + 1}</kbd>
                              <span>Press to activate</span>
                            </div>
                          ) : (
                            <div className="mt-2 p-1.5 bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 rounded">
                              <p className="text-[10px] text-[var(--color-warning)] font-semibold">
                                ⚠️ Select {action.minItems === action.maxItems ? action.minItems : `${action.minItems}-${action.maxItems}`} item(s) to use
                              </p>
                            </div>
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
                      <div
                        onClick={() => handleSkillClick(skillId)}
                        onMouseEnter={() => setHoveredButton(index)}
                        onMouseLeave={() => setHoveredButton(null)}
                        className="action-tile group relative w-full flex flex-col items-center justify-center px-2 py-2 text-md font-semibold cursor-pointer"
                        style={{ aspectRatio: '1 / 0.88' }}
                      >
                        {/* Hotkey indicator */}
                        <div className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center rounded-full text-[10px] font-bold border border-[rgba(75,119,104,0.25)] bg-[rgba(75,119,104,0.12)] text-[var(--accent-primary)] shadow-sm backdrop-blur-sm">
                          {index + 1}
                        </div>
                        <div className="icon-wrapper mb-0.5">
                          <div className="text-2xl">
                            {skill.icon}
                          </div>
                        </div>
                        <span className="text-[10px] uppercase tracking-wider  leading-tight text-center text-[var(--text-primary)]">{skill.name}</span>
                      </div>

                      {/* Tooltip - smart positioning based on button position */}
                      {hoveredButton === index && (
                        <div className={`absolute z-50 bottom-full mb-2 w-48 p-2 tooltip-surface pointer-events-none animate-fadeIn ${
                          index >= 2 ? 'right-0' : 'left-0'
                        }`}>
                          <p className="text-xs font-semibold text-text-primary mb-1">{skill.name}</p>
                          <p className="text-[10px] text-text-secondary mb-2">{skill.description}</p>
                          <div className="flex items-center gap-2 text-[10px] text-accent">
                            <kbd className="px-1 py-0.5 badge-pill" data-variant="accent">{index + 1}</kbd>
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

        {/* Folder-style Tab Navigation - Centered and Responsive */}
        <div className="flex shrink-0 gap-1 px-2 mb-0 justify-center mt-2.5">
          <button
            onClick={() => handleTabClick('narrator')}
            className={`folder-tab relative flex items-center justify-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold flex-1 min-w-0 rounded-t-lg ${
              activeTab === 'narrator'
                ? 'text-text-primary z-10'
                : 'text-gray-500 dark:text-gray-400'
            }`}
            data-active={activeTab === 'narrator'}
          >
            <span className="truncate">Narrator</span>
          </button>
          <button
            onClick={() => handleTabClick('inventory')}
            className={`folder-tab relative flex items-center justify-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold flex-1 min-w-0 rounded-t-lg ${
              activeTab === 'inventory'
                ? 'text-text-primary z-10'
                : 'text-gray-500 dark:text-gray-400'
            }`}
            data-active={activeTab === 'inventory'}
          >
            <span className="truncate">Inventory</span>
          </button>
          <button
            onClick={() => handleTabClick('study')}
            className={`folder-tab relative flex items-center justify-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold flex-1 min-w-0 rounded-t-lg ${
              activeTab === 'study'
                ? 'text-text-primary z-10'
                : 'text-gray-500 dark:text-gray-400'
            }`}
            data-active={activeTab === 'study'}
          >
            <span className="truncate">Study</span>
          </button>
          <button
            onClick={() => handleTabClick('sources')}
            className={`folder-tab relative flex items-center justify-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold flex-1 min-w-0 rounded-t-lg ${
              activeTab === 'sources'
                ? 'text-text-primary z-10'
                : 'text-gray-500 dark:text-gray-400'
            }`}
            data-active={activeTab === 'sources'}
          >
            <span className="truncate">Sources</span>
          </button>
        </div>


        {/* Panels - Seamless connection with tabs */}
        <div className="flex-1 min-h-0 surface-card px-1 pb-0 pt-0 shadow-inner">
          {activeTab === 'narrator' && (
            <div className="h-full animate-fadeIn">
              <NarrationPanel
                  narrationHistory={narrationHistory}
                  playerInput={playerInput}
                  onPlayerInputChange={onPlayerInputChange}
                  onSend={onSend}
                  isLoading={isNarratorLoading}
                  onOpenCampModal={() => setIsCampModalOpen(true)}
                />
            </div>
          )}

          {activeTab === 'inventory' && playerCharacter && (
            <div className="h-full animate-fadeIn">
                <InventoryPanelEnhanced
                  playerCharacter={playerCharacter}
                  highlightedItemId={highlightedItemId}
                  onInventoryUpdate={() => {
                    // Dispatch inventory update event for quest/work offer progress tracking
                    window.dispatchEvent(new CustomEvent('inventoryUpdated'));
                    // Call the parent onInventoryUpdate if it exists
                    if (onInventoryUpdate) {
                      onInventoryUpdate();
                    }
                  }}
                  onCraft={onCraft}
                  onStudy={(items) => {
                    // Add items to study data
                    const studiedItems = items.map(item => ({
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
                  onEat={onEat}
                  onDrop={handleDropItem}
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
            </div>
          )}

          {activeTab === 'study' && (
            <div className="h-full animate-fadeIn">
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
            </div>
          )}

          {activeTab === 'sources' && (
            <div className="h-full overflow-y-auto animate-fadeIn">
              {/* Source Discussions - compact placeholder if empty */}
              {discussionHistory.discussions.length > 0 ? (
                <div className="mb-4">
                  <div className="p-3 border-b border-surface-muted sticky top-0 bg-[var(--surface-card)] z-10">
                    <h3 className="text-sm font-semibold text-[var(--color-warning)] flex items-center gap-2">
                      <span>📜</span>
                      Source Discussions
                    </h3>
                    <p className="text-xs text-text-muted mt-1">
                      {discussionHistory.discussions.length} discussion{discussionHistory.discussions.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="p-2 space-y-2">
                    {discussionHistory.discussions.map((discussion, index) => {
                      const source = discussionHistory.sources.find(s => s.id === discussion.sourceId);
                      if (!source) return null;

                      return (
                        <div
                          key={`${discussion.sourceId}-${index}`}
                          onClick={() => console.log('Selected discussion:', discussion)}
                          className="surface-muted rounded-lg p-3 hover:surface-card hover:border-[var(--color-warning)]/30 transition-all cursor-pointer group"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-text-primary group-hover:text-[var(--color-warning)] transition-colors line-clamp-1">
                                {source.title}
                              </h4>
                              <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                                <span>👤 {discussion.npcName}</span>
                                <span>📍 {discussion.location}</span>
                              </div>
                            </div>
                          </div>
                          <div className="bg-background-secondary rounded p-2 mb-2">
                            <p className="text-xs text-text-secondary italic line-clamp-2">
                              "{discussion.dialogue[0]}"
                            </p>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-text-muted">
                              {new Date(discussion.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-3 text-center text-text-muted border-b border-surface-muted">
                  <p className="text-xs opacity-75">No source discussions yet</p>
                </div>
              )}

              {/* Quotes Section */}
              <JournalQuotesPanel />
            </div>
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
