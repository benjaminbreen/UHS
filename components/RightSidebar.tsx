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
import GamelogPanel from './GamelogPanel';
import { AnimatedPortrait } from './portraits';
import { SKILL_DATA, SKILL_BUTTON_ORDER } from '../constants/index';
import { SkillID, Item } from '../types';
import ActionConfigModal from './ActionConfigModal';
import { Settings } from 'lucide-react';
import { AttributeBadgeList } from './AttributeBadge';
import { removeItemFromInventory } from '../utils/inventoryUtils';
import { calculateDiseaseGameplayRestrictions } from '../services/diseaseProgressionService';
import { MapDisplayOptimized } from './MapDisplayOptimized';
import { eventBus } from '../services/eventBus';

const MIN_SIDEBAR_WIDTH = 280;
const MAX_SIDEBAR_WIDTH = 580;
const DEFAULT_SIDEBAR_WIDTH = 400;
const RHS_WIDTH_KEY = 'rhs.sidebarWidth';
const ACTION_BUTTONS_KEY = 'rhs.actionButtons';

type RightSidebarTab = 'narrator' | 'inventory' | 'map' | 'journal';

const noop = () => {};

interface RightSidebarProps {
  isProcessingWorldWeaver?: boolean;
}

const RightSidebar: React.FC<RightSidebarProps> = ({ isProcessingWorldWeaver = false }) => {
  const { setIsCharacterProfileModalOpen, onUseSkill, onSend, onCraft, onEat, combatant, inMiningRoguelike, onInventoryUpdate, setIsSkillsModalOpen, setSkillResult, setIsCampModalOpen, setPanelNotificationItem, setPanelNotificationMode, centralMode } = useUI();
  const { narrationHistory, playerInput, onPlayerInputChange, isNarratorLoading, gameTimeHours, contextualMessage, formattedDate, season, gameTimeMinutes, currentZone, gameLog } = useGame();
  const { playerCharacter, controlledIconX, controlledIconY, setShipDockX, setShipDockY, setCurrentVessel, setPlayerCharacter, onIconAnimationComplete, playerMode, shipDockX, shipDockY, iconRotation, velocity, currentVessel } = usePlayer();
  const { deployVesselToMap, deployBridgeToMap, mapData, localArea, culturalZone, addDroppedItem, visibleAnimals, visibleNpcs, deployedVessels, deployedStructures, currentMapSeed, isSpecialMap } = useMap();

  const portraitGradient = useMemo(() => {
    const tile = controlledIconX !== null && controlledIconY !== null
      ? mapData?.tiles?.[controlledIconY]?.[controlledIconX]
      : undefined;
    const biome = tile?.biome || 'GRASSLAND';
    const palette: Record<string, string> = {
      GRASSLAND: 'linear-gradient(135deg, rgba(34,139,34,0.35), rgba(16,185,129,0.15))',
      COAST: 'linear-gradient(135deg, rgba(14,165,233,0.35), rgba(59,130,246,0.15))',
      WATER: 'linear-gradient(135deg, rgba(14,165,233,0.55), rgba(6,78,59,0.25))',
      WETLANDS: 'linear-gradient(135deg, rgba(15,118,110,0.35), rgba(5,150,105,0.2))',
      HILLS: 'linear-gradient(135deg, rgba(239,68,68,0.25), rgba(245,158,11,0.2))',
      MOUNTAIN: 'linear-gradient(135deg, rgba(15,23,42,0.5), rgba(82,82,91,0.25))',
      DESERT: 'linear-gradient(135deg, rgba(249,115,22,0.4), rgba(252,211,77,0.25))',
      TROPICAL: 'linear-gradient(135deg, rgba(34,197,94,0.35), rgba(16,185,129,0.2))',
      DEFAULT: 'linear-gradient(135deg, rgba(30,58,138,0.4), rgba(14,165,233,0.2))'
    };
    return palette[biome] || palette.DEFAULT;
  }, [mapData, controlledIconX, controlledIconY]);

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
  // Default to 'map' since we start in HistoryLens mode
  const [activeTab, setActiveTab] = useState<RightSidebarTab>('map');
  const [sidebarWidth, setSidebarWidth] = useState<number>(DEFAULT_SIDEBAR_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(DEFAULT_SIDEBAR_WIDTH);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [actionButtons, setActionButtons] = useState<SkillID[]>(SKILL_BUTTON_ORDER);
  const [hoveredButton, setHoveredButton] = useState<number | null>(null);
  const [hoveredTab, setHoveredTab] = useState<RightSidebarTab | null>(null);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  const previousInventoryRef = useRef<string[]>([]);
  const inventoryInitializedRef = useRef(false);
  const previousTabRef = useRef<RightSidebarTab | null>(null);
  const isHistoryLensActive = centralMode === 'historylens';

  // Initialize previousInventoryRef with current inventory on mount
  // This prevents initial items from triggering "new item" detection
  useEffect(() => {
    if (!inventoryInitializedRef.current && playerCharacter?.inventory) {
      previousInventoryRef.current = playerCharacter.inventory.map(item => item.id);
      inventoryInitializedRef.current = true;
    }
  }, [playerCharacter?.inventory]);

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
      // Tab always defaults to 'map' - no localStorage persistence
      const savedButtons = localStorage.getItem(ACTION_BUTTONS_KEY);
      if (savedButtons) {
        try {
          const parsed = JSON.parse(savedButtons) as SkillID[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            const unique = Array.from(new Set(parsed));
            const merged = [...unique];
            SKILL_BUTTON_ORDER.forEach(id => {
              if (!merged.includes(id)) merged.push(id);
            });
            setActionButtons(merged.slice(0, SKILL_BUTTON_ORDER.length));
          }
        } catch {}
      }
    } catch {}
  }, []);

  // Auto-switch to inventory tab when mining is active
  useEffect(() => {
    if (inMiningRoguelike) {
      setActiveTab('inventory');
    }
  }, [inMiningRoguelike]);

  // When entering HistoryLens mode, default to map tab (but allow switching to other tabs)
  // When leaving HistoryLens mode, restore previous tab if we're still on map
  const wasHistoryLensActive = useRef(false);
  useEffect(() => {
    if (isHistoryLensActive && !wasHistoryLensActive.current) {
      // Just entered HistoryLens mode - save current tab and switch to map
      previousTabRef.current = activeTab;
      setActiveTab('map');
    } else if (!isHistoryLensActive && wasHistoryLensActive.current) {
      // Just left HistoryLens mode - restore previous tab if still on map
      if (activeTab === 'map') {
        setActiveTab(previousTabRef.current || 'narrator');
      }
      previousTabRef.current = null;
    }
    wasHistoryLensActive.current = isHistoryLensActive;
  }, [isHistoryLensActive]);

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
      const maxHotkey = Math.min(9, actionButtons.length);
      if (/^[1-9]$/.test(key) && parseInt(key, 10) <= maxHotkey) {
        const index = parseInt(key, 10) - 1;
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
  }, []);

  // Detect new items added to inventory (only after initial inventory is set)
  useEffect(() => {
    if (!playerCharacter?.inventory) return;
    // Skip if inventory hasn't been initialized yet (prevents initial items triggering switch)
    if (!inventoryInitializedRef.current) return;

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

  // Get disease restrictions and symptom info
  const diseaseRestrictions = useMemo(() => {
    return calculateDiseaseGameplayRestrictions(playerCharacter?.diseaseHealth);
  }, [playerCharacter?.diseaseHealth]);

  const statusInfo = useMemo(() => {
    if (!playerCharacter) return { text: 'Feeling okay', hasDisease: false as boolean, severity: '' as string, symptoms: '', stage: '' };
    const healthPercent = playerCharacter.health / playerCharacter.maxHealth;
    const fatiguePercent = playerCharacter.fatigue / playerCharacter.maxFatigue;
    const xpPercent = playerCharacter.experience / playerCharacter.maxExperience;

    // active disease - use the disease restrictions for better symptom display
    const dis = playerCharacter.diseaseHealth?.currentDiseases || [];
    const symptomatic = dis.filter((d: any) => d.stage === 'symptomatic' || d.stage === 'active');
    if (symptomatic.length) {
      const worst = symptomatic.reduce((a: any, b: any) => (b.severity > a.severity ? b : a));
      // Build descriptive symptom text based on progression stage
      let symptomText = diseaseRestrictions.symptomDescription || '';
      const stageLabel = diseaseRestrictions.progressionStage;
      let stageIcon = '';
      switch (stageLabel) {
        case 'early': stageIcon = '🟢'; break;
        case 'moderate': stageIcon = '🟡'; break;
        case 'severe': stageIcon = '🟠'; break;
        case 'critical': stageIcon = '🔴'; break;
        case 'terminal': stageIcon = '💀'; break;
      }
      return {
        text: `${stageIcon} ${worst.disease.name}`,
        hasDisease: true,
        severity: worst.disease.severity,
        symptoms: symptomText,
        stage: stageLabel
      };
    }

    if (fatiguePercent > 0.95) return { text: 'Feeling awful', hasDisease: false, severity: '', symptoms: '', stage: '' };
    if (fatiguePercent > 0.85) return { text: 'Exhausted', hasDisease: false, severity: '', symptoms: '', stage: '' };
    if (fatiguePercent > 0.75) return { text: 'Feeling run down', hasDisease: false, severity: '', symptoms: '', stage: '' };
    if (fatiguePercent > 0.65) return { text: 'A bit tired', hasDisease: false, severity: '', symptoms: '', stage: '' };
    if (fatiguePercent > 0.5) return { text: 'Feeling so-so', hasDisease: false, severity: '', symptoms: '', stage: '' };
    if (healthPercent < 0.3) return { text: 'Gravely injured', hasDisease: false, severity: '', symptoms: '', stage: '' };
    if (xpPercent >= 0.5) return { text: 'Learning new things', hasDisease: false, severity: '', symptoms: '', stage: '' };
    if (xpPercent >= 0.9) return { text: 'On the verge of a breakthrough!', hasDisease: false, severity: '', symptoms: '', stage: '' };
    return { text: 'Feeling fine', hasDisease: false, severity: '', symptoms: '', stage: '' };
  }, [playerCharacter, diseaseRestrictions]);

  return (
    <>
      <style>{progressBarStyles}</style>
      <div
        data-surface="sidebar-right"
        className={`right-sidebar panel-frame ${getSafariOptimizedClassName(
          'theme-surface relative h-full lg:h-[calc(100%-20px)] flex flex-col flex-shrink-0'
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
        {/* Player Profile Card - REFINED VERSION v2 (uses CSS variables for theme) */}
        <div className="flex-shrink-0 p-2 mt-1 px-3">
          {playerCharacter && playerCharacter.appearance && (
            <div
              className="surface-card rounded-2xl p-4 mb-2 cursor-pointer transition-all duration-300 ease-out hover:shadow-lg active:scale-[0.995]"
              style={{ fontFamily: "'Avenir Next', 'Avenir', 'Trebuchet MS', sans-serif" }}
              onClick={handleProfileClick}
            >
              <div className="flex items-center gap-4">
                {/* Portrait - clean circular, no border */}
                <div className="relative flex-shrink-0 group">
                  <div
                    className="portrait-container w-[100px] h-[100px] overflow-hidden rounded-full shadow-md transition-transform duration-300 group-hover:scale-105"
                    style={{ background: portraitGradient }}
                  >
                    <div className="absolute inset-0 animate-pulse" style={{  }} />
                    <div className="flex items-center justify-center w-full h-full relative z-10">
                      <AnimatedPortrait
                        character={playerCharacter}
                        size={100}
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
                 
                  
                </div>

                {/* Info Section */}
                <div className="flex-1 min-w-0 ">
                  <h4 className="text-lg font-bold leading-tight tracking-tight truncate" style={{ color: 'var(--text-primary)' }}>
                    {playerCharacter.name}
                  </h4>
                  <p className="text-md font-semibold text-emerald-600 capitalize">
                    {playerCharacter.profession}
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {playerCharacter.age} years old • {playerCharacter.gender || 'Unknown'}
                  </p>

                  {/* Stats row */}
                  <div className="flex items-center gap-2 mt-2.5">
                    <div className="surface-muted px-2 py-0.5 rounded-md transition-colors">
                      <span className="text-[10px] uppercase mr-1" style={{ color: 'var(--text-secondary)' }}>Level</span>
                      <span className="text-sm font-bold text-emerald-600">{playerCharacter.level}</span>
                    </div>
                    <div className="surface-muted px-2 py-0.5 rounded-md transition-colors">
                      <span className="text-[9px] uppercase mr-1" style={{ color: 'var(--text-secondary)' }}>Wealth</span>
                      <span className="text-sm font-bold text-amber-600">{playerCharacter.currency}</span>
                    </div>
                    <div className="surface-muted px-2 py-0.5 rounded-md transition-colors">
                      <span className="text-[9px] uppercase mr-1" style={{ color: 'var(--text-secondary)' }}>Rep</span>
                      <span className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>{repPercent}</span>
                    </div>
                  </div>
                </div>
              </div>

              

              {/* Progress Bars */}
              <div className="space-y-3 mt-4 pt-3.5" style={{ borderTop: '1px solid var(--surface-muted-border)' }}>
                {/* Health */}
                <div className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Health</span>
                    <span className={`text-xs font-semibold tabular-nums ${healthPercent < 20 ? 'text-red-500' : ''}`} style={healthPercent >= 20 ? { color: 'var(--text-secondary)' } : {}}>
                      {Math.ceil(playerCharacter.health)}/{Math.ceil(playerCharacter.maxHealth)}
                    </span>
                  </div>
                  <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-track-bg)' }}>
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${healthPercent}%`,
                        background: healthPercent < 30
                          ? 'linear-gradient(90deg, #ef4444, #f87171)'
                          : 'linear-gradient(90deg, #10b981, #34d399)'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent
                                    translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  </div>
                </div>

                {/* Fatigue & XP side by side */}
                <div className="flex gap-4">
                  <div className="flex-1 group">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Fatigue</span>
                      <span className={`text-xs font-semibold tabular-nums ${fatiguePercent >= 80 ? 'text-amber-500' : ''}`} style={fatiguePercent < 80 ? { color: 'var(--text-secondary)' } : {}}>
                        {Math.ceil(playerCharacter.fatigue)}%
                      </span>
                    </div>
                    <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-track-bg)' }}>
                      <div
                        className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${fatiguePercent}%`,
                          background: fatiguePercent >= 80
                            ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                            : 'linear-gradient(90deg, #94a3b8, #cbd5e1)'
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent
                                      translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    </div>
                  </div>

                  <div className="flex-1 group">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Experience</span>
                      <span className="text-xs font-semibold tabular-nums text-emerald-600">
                        {Math.ceil(playerCharacter.experience)}
                      </span>
                    </div>
                    <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-track-bg)' }}>
                      <div
                        className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${xpPercent}%`,
                          background: 'linear-gradient(90deg, #10b981, #06b6d4)'
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent
                                      translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    </div>
                  </div>
                </div>

                {/* Elevated State */}
                {playerCharacter.elevatedState && (
                  <div className="mt-1 px-3 py-2 surface-muted rounded-xl" style={{ borderColor: 'var(--accent-primary)', borderWidth: '2px' }}>
                    <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide">
                      <span className="text-emerald-600">Elevated</span>
                      <span style={{ color: 'var(--text-primary)' }} className="capitalize">{playerCharacter.elevatedState.replace('_', ' ')}</span>
                    </div>
                    <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                      {playerCharacter.elevationDescription || 'Use "climb down" to descend'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between mb-2 mt-1  px-1">
              <h4 className="text-[11px] tracking-[0.08em] uppercase font-semibold" style={{ color: 'var(--text-secondary)' }}>Actions</h4>
              <button
                onClick={handleConfigClick}
                className="p-0 px-1 surface-muted rounded transition-all hover:shadow-sm"
                style={{ color: 'var(--text-muted)' }}
                title="Configure action buttons"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex gap-2 justify-between px-1">
              {actionButtons.map((skillId, index) => {
                const skill = SKILL_DATA[skillId];
                if (!skill) return null;
                const isSing = skillId === 'SING';
                return (
                  <div key={skillId} className="relative">
                    <button
                      type="button"
                      onClick={() => isSing ? eventBus.emit('historylens:sing') : handleSkillClick(skillId)}
                      onMouseEnter={() => setHoveredButton(index)}
                      onMouseLeave={() => setHoveredButton(null)}
                      className="action-square surface-muted group relative flex flex-col items-center justify-center rounded-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-lg active:translate-y-0"
                      style={{ width: '64px', height: '60px' }}
                    >
                      <div
                        className="absolute -top-1.5 right-0 flex items-center justify-center w-[18px] h-[18px] rounded-full text-[9px] font-semibold"
                        style={{
                          background: 'var(--surface-muted-bg)',
                          border: '1px solid var(--surface-muted-border)',
                          color: 'var(--accent-primary)'
                        }}
                      >
                        {index + 1}
                      </div>
                      <div className="text-[20px] drop-shadow-sm">{skill.icon}</div>
                      <span className="text-[9px] uppercase tracking-[0.1em] mt-1 leading-tight opacity-80" style={{ color: 'var(--text-primary)' }}>{skill.name}</span>
                    </button>

                    {hoveredButton === index && (
                      <div className="absolute z-50 bottom-full mb-2 w-48 p-2 surface-elevated rounded-lg shadow-lg pointer-events-none animate-fadeIn" style={{ border: '2px solid var(--surface-muted-border)' }}>
                        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{skill.name}</p>
                        <p className="text-[10px] mb-2" style={{ color: 'var(--text-secondary)' }}>{skill.description}</p>
                        <div className="flex items-center gap-2 text-[10px]" style={{ color: 'var(--accent-primary)' }}>
                          <kbd className="px-1 py-0.5 rounded" style={{ background: 'var(--surface-muted-bg)', border: '1px solid var(--surface-muted-border)' }}>{index + 1}</kbd>
                          <span>Press to activate</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

          <div className="flex gap-1 px-2 pt-2">
          {!isHistoryLensActive && (
            <button
              onClick={() => handleTabClick('narrator')}
              onMouseEnter={() => setHoveredTab('narrator')}
              onMouseLeave={() => setHoveredTab(null)}
              className="flex-1 flex items-center justify-center px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-all"
              style={{
                borderRadius: '10px 10px 0 0',
                background: activeTab === 'narrator'
                  ? 'linear-gradient(180deg, rgba(45, 55, 75, 0.98) 0%, rgba(30, 41, 59, 0.95) 100%)'
                  : hoveredTab === 'narrator'
                    ? 'rgba(55, 65, 85, 0.8)'
                    : 'rgba(35, 45, 60, 0.6)',
                borderTop: `1px solid ${activeTab === 'narrator' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)'}`,
                borderLeft: `1px solid ${activeTab === 'narrator' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)'}`,
                borderRight: `1px solid ${activeTab === 'narrator' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)'}`,
                borderBottom: 'none',
                color: activeTab === 'narrator' ? 'var(--text-primary)' : hoveredTab === 'narrator' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.65)',
                marginBottom: '-1px',
                zIndex: activeTab === 'narrator' ? 3 : 1,
                position: 'relative',
                boxShadow: activeTab === 'narrator' ? '0 -2px 8px rgba(0, 0, 0, 0.15)' : 'none',
              }}
            >
              Narrator
            </button>
          )}
          {isHistoryLensActive && (
            <button
              onClick={() => handleTabClick('map')}
              onMouseEnter={() => setHoveredTab('map')}
              onMouseLeave={() => setHoveredTab(null)}
              className="flex-1 flex items-center justify-center px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-all"
              style={{
                borderRadius: '10px 10px 0 0',
                background: activeTab === 'map'
                  ? 'linear-gradient(180deg, rgba(45, 55, 75, 0.98) 0%, rgba(30, 41, 59, 0.95) 100%)'
                  : hoveredTab === 'map'
                    ? 'rgba(55, 65, 85, 0.8)'
                    : 'rgba(35, 45, 60, 0.6)',
                borderTop: `2px solid ${activeTab === 'map' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)'}`,
                borderLeft: `1px solid ${activeTab === 'map' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)'}`,
                borderRight: `1px solid ${activeTab === 'map' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)'}`,
                borderBottom: 'none',
                color: activeTab === 'map' ? 'var(--text-primary)' : hoveredTab === 'map' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.65)',
                marginBottom: '-1px',
                zIndex: activeTab === 'map' ? 3 : 1,
                position: 'relative',
                boxShadow: activeTab === 'map' ? '0 -2px 8px rgba(0, 0, 0, 0.15)' : 'none',
              }}
            >
              Map
            </button>
          )}
          <button
            onClick={() => handleTabClick('inventory')}
            onMouseEnter={() => setHoveredTab('inventory')}
            onMouseLeave={() => setHoveredTab(null)}
            className="flex-1 flex items-center justify-center px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-all"
            style={{
              borderRadius: '10px 10px 0 0',
              background: activeTab === 'inventory'
                ? 'linear-gradient(180deg, rgba(45, 55, 75, 0.98) 0%, rgba(30, 41, 59, 0.95) 100%)'
                : hoveredTab === 'inventory'
                  ? 'rgba(55, 65, 85, 0.8)'
                  : 'rgba(35, 45, 60, 0.6)',
              borderTop: `2px solid ${activeTab === 'inventory' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)'}`,
              borderLeft: `1px solid ${activeTab === 'inventory' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)'}`,
              borderRight: `1px solid ${activeTab === 'inventory' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)'}`,
              borderBottom: 'none',
              color: activeTab === 'inventory' ? 'var(--text-primary)' : hoveredTab === 'inventory' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.65)',
              marginBottom: '-1px',
              zIndex: activeTab === 'inventory' ? 3 : 1,
              position: 'relative',
              boxShadow: activeTab === 'inventory' ? '0 -2px 8px rgba(0, 0, 0, 0.15)' : 'none',
            }}
          >
            Inventory
          </button>
          <button
            onClick={() => handleTabClick('journal')}
            onMouseEnter={() => setHoveredTab('journal')}
            onMouseLeave={() => setHoveredTab(null)}
            className="flex-1 flex items-center justify-center px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-all"
            style={{
              borderRadius: '10px 10px 0 0',
              background: activeTab === 'journal'
                ? 'linear-gradient(180deg, rgba(45, 55, 75, 0.98) 0%, rgba(30, 41, 59, 0.95) 100%)'
                : hoveredTab === 'journal'
                  ? 'rgba(55, 65, 85, 0.8)'
                  : 'rgba(35, 45, 60, 0.6)',
              borderTop: `2px solid ${activeTab === 'journal' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)'}`,
              borderLeft: `1px solid ${activeTab === 'journal' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)'}`,
              borderRight: `1px solid ${activeTab === 'journal' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)'}`,
              borderBottom: 'none',
              color: activeTab === 'journal' ? 'var(--text-primary)' : hoveredTab === 'journal' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.65)',
              marginBottom: '-1px',
              zIndex: activeTab === 'journal' ? 3 : 1,
              position: 'relative',
              boxShadow: activeTab === 'journal' ? '0 -2px 8px rgba(0, 0, 0, 0.15)' : 'none',
            }}
          >
            Journal
          </button>
        </div>

        {/* Panels - Seamless connection with tabs */}
        <div
          className="flex-1 min-h-0 px-2 pb-2 pt-0"
          style={{
            background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.95) 0%, rgba(25, 35, 50, 0.98) 100%)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.15)',
            borderRight: '1px solid rgba(255, 255, 255, 0.15)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
            borderTop: 'none',
            borderRadius: '0 0 12px 12px',
            marginLeft: '8px',
            marginRight: '8px',
            marginBottom: '6px',
          }}
        >
          {!isHistoryLensActive && activeTab === 'narrator' && (
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
              <div className="inventory-slot-grid h-full rounded-2xl p-2 bg-slate-900/20 border border-white/5">
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
            </div>
          )}
          {isHistoryLensActive && activeTab === 'map' && (
            <div className="h-full animate-fadeIn">
              {!mapData ? (
                <div className="p-6 text-sm text-text-muted">Map data unavailable.</div>
              ) : (
                <div className="h-full w-full p-2">
                  <div className="h-full w-full rounded-xl overflow-hidden bg-slate-900/30">
                    <MapDisplayOptimized
                      mapData={mapData}
                      currentMapSeed={currentMapSeed}
                      animals={visibleAnimals}
                      npcs={visibleNpcs}
                      deployedVessels={deployedVessels || []}
                      deployedStructures={deployedStructures || []}
                      onDevHover={noop}
                      onDevCommandClick={noop}
                      onStructureClick={noop}
                      onPoiClick={noop}
                      onSettlementClick={noop}
                      onVesselClick={noop}
                      onPlayerMove={noop}
                      activeLens="none"
                      logicalControlledIconX={controlledIconX}
                      logicalControlledIconY={controlledIconY}
                      onIconAnimationComplete={onIconAnimationComplete}
                      isSpecialMap={isSpecialMap}
                      currentVessel={currentVessel}
                      playerMode={playerMode}
                      shipDockX={shipDockX}
                      shipDockY={shipDockY}
                      onAnimalClick={noop}
                      onNpcClick={noop}
                      selectedAnimalId={null}
                      selectedNpcId={null}
                      formattedDate={formattedDate}
                      season={season}
                      weather={mapData.currentWeather || null}
                      currentLocation={mapData.continent || currentZone || ''}
                      iconRotation={iconRotation}
                      velocity={velocity}
                      playerCharacter={playerCharacter}
                      gameTimeHours={gameTimeHours}
                      gameTimeMinutes={gameTimeMinutes}
                      hideMinimap={true}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'journal' && (
            <div className="h-full animate-fadeIn">
              <GamelogPanel entries={gameLog} />
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
