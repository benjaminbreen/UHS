import React, { useState, useEffect } from 'react';
import './TopNavBarPolished.css'; // For custom animations
import {
  Globe, Info, Settings, Shuffle, ChevronDown, Menu, X, Sparkles,
  Cpu, ScrollText, MapPin, Compass, Activity,
  Zap, Download, History, AlertCircle, Sliders, Trophy, Target, Clock,
  Shield, Compass as CompassIcon, Coins, BookOpen, Crown, Home, Users, Scale,
  Sun, Moon, FileText, Pause, Play, Flag
} from 'lucide-react';
import { useUI } from '../contexts/UIContext';
import { useMap } from '../contexts/MapContext';
import { useGame } from '../contexts/GameContext';
import { MapArchetype, ClimateType, AltitudeSetting, GameDate } from '../types';
import { PrimarySourceSearch } from './PrimarySourceSearch';
import { MAP_ARCHETYPE_DESCRIPTIONS, CLIMATE_TYPE_DESCRIPTIONS, CULTURE_ZONES } from '../constants/index';
// Heavy data files - import directly to avoid loading on app startup
import { GEOGRAPHICAL_DATA } from '../constants/gameData/geography';
import { getSafariOptimizedClassName, getOptimizedButtonClassName } from '../utils/safariUtils';
import { worldWeaverService } from '../services/worldWeaverService';
import WorldWeaverModal from './WorldWeaverModal';
import { eventBus } from '../services/eventBus';
import { findZoneForMapArea } from '../utils/mapAreaLookup';
import { normalizeZoneName, normalizeRegionName } from '../utils/worldWeaverHelpers';
import type { CulturalZone } from '../types/characterData';
import { eventService } from '../services/eventService';
import { useEventSystem } from '../hooks/useEventSystem';
import { usePlayer } from '../contexts/PlayerContext';
import { questService } from '../services/questService';
import { themeService } from '../services/themeService';
import { journalService } from '../services/journalService';
import { learningObjectivesService } from '../services/learningObjectivesService';

// Theme Toggle Component
const ThemeToggle: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(themeService.isDarkMode());

  const handleToggle = () => {
    themeService.toggleTheme();
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleToggle}
        className="relative inline-flex items-center h-8 w-[68px] rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50 focus:ring-offset-2 focus:ring-offset-[var(--background-primary)] overflow-hidden group"
        style={{
          background: isDarkMode
            ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
            : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
          boxShadow: isDarkMode
            ? '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            : '0 2px 8px rgba(251, 191, 36, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
        }}
        role="switch"
        aria-checked={isDarkMode}
        aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
      >
        {/* Icons container */}
        <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
          <Moon
            className="w-4 h-4 transition-all duration-300"
            style={{
              color: isDarkMode ? '#fbbf24' : '#94a3b8',
              opacity: isDarkMode ? 1 : 0.4,
              transform: isDarkMode ? 'scale(1)' : 'scale(0.8)'
            }}
          />
          <Sun
            className="w-4 h-4 transition-all duration-300"
            style={{
              color: isDarkMode ? '#94a3b8' : '#ffffff',
              opacity: isDarkMode ? 0.4 : 1,
              transform: isDarkMode ? 'scale(0.8)' : 'scale(1)'
            }}
          />
        </div>

        {/* Sliding pill */}
        <span
          className="absolute top-1 w-6 h-6 rounded-full transition-all duration-300 ease-in-out shadow-lg"
          style={{
            left: isDarkMode ? '4px' : 'calc(100% - 28px)',
            background: isDarkMode
              ? 'linear-gradient(135deg, #334155 0%, #1e293b 100%)'
              : 'linear-gradient(135deg, #ffffff 0%, #fef3c7 100%)',
            boxShadow: isDarkMode
              ? '0 2px 8px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
              : '0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.5)'
          }}
        />
      </button>
    </div>
  );
};

// Button group configurations for better organization
const NAV_BUTTON_GROUPS = {
  game: [
    { id: 'quests', icon: ScrollText, label: 'Quests', color: 'slate' },
    { id: 'world-map', icon: Globe, label: 'World Map', color: 'slate' },
  ],
  info: [
    { id: 'end', icon: Flag, label: 'End', color: 'end' },
    { id: 'about', icon: Info, label: 'About', color: 'slate' },
    { id: 'settings', icon: Settings, label: 'Settings', color: 'slate' },
  ]
};

// Game mode configurations with icons and colors
const GAME_MODE_CONFIG = {
  survival: { 
    icon: Shield, 
    color: 'text-red-400', 
    bgColor: 'bg-red-900/20',
    borderColor: 'border-red-600/50',
    description: 'Face existential threats and survive against all odds'
  },
  exploration: { 
    icon: CompassIcon, 
    color: 'text-blue-400', 
    bgColor: 'bg-blue-900/20',
    borderColor: 'border-blue-600/50',
    description: 'Discover new lands and uncover hidden secrets'
  },
  commerce: { 
    icon: Coins, 
    color: 'text-yellow-400', 
    bgColor: 'bg-yellow-900/20',
    borderColor: 'border-yellow-600/50',
    description: 'Build wealth through trade and business ventures'
  },
  scholarship: { 
    icon: BookOpen, 
    color: 'text-purple-400', 
    bgColor: 'bg-purple-900/20',
    borderColor: 'border-purple-600/50',
    description: 'Pursue knowledge and intellectual achievement'
  },
  leadership: { 
    icon: Crown, 
    color: 'text-amber-400', 
    bgColor: 'bg-amber-900/20',
    borderColor: 'border-amber-600/50',
    description: 'Lead your people through challenges and crises'
  },
  livelihood: { 
    icon: Home, 
    color: 'text-green-400', 
    bgColor: 'bg-green-900/20',
    borderColor: 'border-green-600/50',
    description: 'Make an honest living and support your community'
  },
  diplomacy: { 
    icon: Users, 
    color: 'text-cyan-400', 
    bgColor: 'bg-cyan-900/20',
    borderColor: 'border-cyan-600/50',
    description: 'Navigate complex political relationships'
  },
  legal: { 
    icon: Scale, 
    color: 'text-indigo-400', 
    bgColor: 'bg-indigo-900/20',
    borderColor: 'border-indigo-600/50',
    description: 'Uphold justice and navigate legal complexities'
  }
};

interface TopNavBarPolishedProps {
  onWorldWeaverLoadingChange?: (isLoading: boolean) => void;
  onWorldWeaverDataReceived?: (data: {
    settingDescription?: string;
    characterDescription?: string;
    quest?: any;
  }) => void;
  onWorldWeaverModalDataChange?: (data: {
    isOpen: boolean;
    year: number;
    location: string;
    explanation: string;
    reasoning?: string;
    suggestion?: string;
    characterSpec?: any;
    gameMode?: any;
    specialNPCs?: any[];
    customEventsCount?: number;
    quest?: any;
    userPrompt?: string;
  }) => void;
}

const TopNavBarPolished: React.FC<TopNavBarPolishedProps> = ({ onWorldWeaverLoadingChange, onWorldWeaverDataReceived, onWorldWeaverModalDataChange }) => {
  const { setIsSettingsModalOpen, setIsAboutModalOpen, setIsWorldMapModalOpen, isPauseModalOpen, setIsPauseModalOpen, isAnyModalOpen, activeFishingHutModal, showJournal, setShowJournal, showQuestsPanel, setShowQuestsPanel, showGameModePanel, setShowGameModePanel, triggerAssessmentReview, setShowSessionSummaryModal, showEndGameConfirm, setShowEndGameConfirm, centralMode, setCentralMode } = useUI();
  const { currentMode } = useEventSystem();
  const modeTheme = currentMode ? GAME_MODE_CONFIG[currentMode.id as keyof typeof GAME_MODE_CONFIG] : undefined;
  const { setControlledIconX, setControlledIconY } = usePlayer();
  const { 
    currentMapSeed,
    currentWorldCoords,
    userSelectedBaseArchetype,
    onBaseArchetypeChange,
    userSelectedBaseClimate,
    onBaseClimateChange,
    userSelectedBaseAltitude,
    onBaseAltitudeChange,
    forceVolcanicActivity,
    onForceVolcanicActivityToggle,
    generateHarbor,
    onGenerateHarborToggle,
    generateLargeCity,
    onGenerateLargeCityToggle,
    onRegenerateMapWithCurrentSettings,
    onStartNewWorldWithCurrentSettings,
    onStartNewWorldAtLocation,
    onStartNewWorldAtZoneRegion,
    pendingScenarioData,
    setPendingScenarioData,
  } = useMap();
  const { gameDate, onMapConfigDateChange, currentZone, onLocationChange, isLoading } = useGame();

  const handleHistoryLensToggle = () => {
    setCentralMode(prev => (prev === 'historylens' ? 'map' : 'historylens'));
  };

  // Map geographical zone to cultural zone
  const getCulturalZoneFromGeographical = (geoZone: string): CulturalZone | undefined => {
    const mapping: Record<string, CulturalZone> = {
      'Europe': 'EUROPEAN',
      'North America': 'NORTH_AMERICAN_COLONIAL', // Default to colonial for simplicity
      'South America': 'SOUTH_AMERICAN',
      'MENA': 'MENA',
      'Sub Saharan Africa': 'SUB_SAHARAN_AFRICAN',
      'South Asia': 'SOUTH_ASIAN',
      'East Asia': 'EAST_ASIAN',
      'Oceania': 'OCEANIA'
    };

    // Find which zone the current area belongs to
    if (currentZone) {
      const zoneInfo = findZoneForMapArea(currentZone);
      if (zoneInfo) {
        return mapping[zoneInfo.zone];
      }
    }

    return undefined;
  };

  const currentCulturalZone = getCulturalZoneFromGeographical(currentZone || '');

  const [isGeneratorPanelOpen, setIsGeneratorPanelOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [worldWeaverInput, setWorldWeaverInput] = useState('');
  const [worldWeaverFocused, setWorldWeaverFocused] = useState(false);
  const [isProcessingWorldWeaver, setIsProcessingWorldWeaver] = useState(false);
  const [showAPITracker, setShowAPITracker] = useState(false);
  const [apiStats, setApiStats] = useState(eventService.getAPIUsageStats());
  const [showLLMHistory, setShowLLMHistory] = useState(false);
  const [llmHistory, setLLMHistory] = useState(eventService.getLLMHistory());
  const [isRoguelikeActive, setIsRoguelikeActive] = useState(false);

  // Educational mode state
  const [isEducationalMode, setIsEducationalMode] = useState(
    learningObjectivesService.isEducationalMode()
  );

  // Performance: Throttle API stats updates to every 3 seconds when tracker is visible
  useEffect(() => {
    if (!showAPITracker) return;

    const updateInterval = setInterval(() => {
      setApiStats(eventService.getAPIUsageStats());
      setLlmHistory(eventService.getLLMHistory());
    }, 3000); // Update every 3 seconds instead of on every render

    return () => clearInterval(updateInterval);
  }, [showAPITracker]);
  const [showGameModeTooltip, setShowGameModeTooltip] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(themeService.isDarkMode());
  const [worldWeaverModalData, setWorldWeaverModalData] = useState<{
    isOpen: boolean;
    year: number;
    location: string;
    explanation: string;
    reasoning?: string;
    suggestion?: string;
    characterSpec?: any;
    gameMode?: any;
    specialNPCs?: any[];
    customEventsCount?: number;
    quest?: any; // Add quest data
  }>({
    isOpen: false,
    year: 1000,
    location: '',
    explanation: ''
  });
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Subscribe to theme changes - debounced to avoid blocking during theme switch
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const unsubscribe = themeService.subscribe((theme) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsDarkMode(theme === 'dark');
      }, 50);
    });
    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  // Subscribe to educational mode changes
  useEffect(() => {
    const checkEducationalMode = () => {
      const eduMode = learningObjectivesService.isEducationalMode();
      setIsEducationalMode(eduMode);
    };

    // Check every 2 seconds for educational mode state changes
    const interval = setInterval(checkEducationalMode, 2000);
    return () => clearInterval(interval);
  }, []);

  // Subscribe to journal auto-open events
  useEffect(() => {
    const unsubscribe = journalService.onJournalOpen(() => {
      console.log('[TopNavBarPolished] Auto-opening journal from study action');
      setShowJournal(true);
    });
    return unsubscribe;
  }, []);

  // Auto-slide journal when receiving a message from RightSidebar about study tab activation
  // Disabled: User prefers to open journal manually
  // useEffect(() => {
  //   const handleStudyTabActive = () => {
  //     console.log('[TopNavBarPolished] Study tab activated, auto-sliding journal');
  //     setShowJournal(true);
  //   };

  //   // Listen for custom event from RightSidebar
  //   window.addEventListener('studyTabActivated', handleStudyTabActive);
  //   return () => window.removeEventListener('studyTabActivated', handleStudyTabActive);
  // }, []);

  useEffect(() => {
    const handleRoguelikeToggle = (active?: boolean) => {
      setIsRoguelikeActive(!!active);
    };
    eventBus.on('ruins.roguelike.active', handleRoguelikeToggle);
    return () => eventBus.off('ruins.roguelike.active', handleRoguelikeToggle);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Command+J (Mac) or Ctrl+J (PC) to toggle Journal
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        setShowJournal(prev => !prev);
      }

      // Escape key to toggle pause (spacebar now used for weapon swing)
      // Don't toggle pause if other modals are open (ESC closes those instead)
      // But DO toggle pause if the pause modal itself is the only one open
      if (e.key === 'Escape' && !activeFishingHutModal && !isRoguelikeActive && (!isAnyModalOpen || isPauseModalOpen)) {
        e.preventDefault();
        setIsPauseModalOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsPauseModalOpen, activeFishingHutModal, isRoguelikeActive, isAnyModalOpen]);
  
  // Show modal when map finishes loading with pending scenario data
  useEffect(() => {
    console.log('[TopNavBar] Modal opening check:', {
      isLoading,
      hasPendingData: !!pendingScenarioData,
      modalOpen: worldWeaverModalData.isOpen,
      pendingDataPreview: pendingScenarioData ? {
        hasQuest: !!pendingScenarioData.quest,
        hasUserPrompt: !!pendingScenarioData.userPrompt,
        userPrompt: pendingScenarioData.userPrompt
      } : null
    });

    if (!isLoading && pendingScenarioData && !worldWeaverModalData.isOpen) {
      console.log('[TopNavBar] ✅ Opening WorldWeaver modal with data:', pendingScenarioData);
      const modalData = {
        isOpen: true,
        ...pendingScenarioData
      };
      setWorldWeaverModalData(modalData);
      onWorldWeaverModalDataChange?.(modalData); // Pass to App for rendering
      setPendingScenarioData(null);
    }
  }, [isLoading, pendingScenarioData, worldWeaverModalData.isOpen, setPendingScenarioData, onWorldWeaverModalDataChange]);

  const toggleGeneratorPanel = () => setIsGeneratorPanelOpen(prev => !prev);
  
  const formatEnumString = (enumString: string) => {
    if (!enumString) return "Unknown";
    return enumString.charAt(0).toUpperCase() + enumString.slice(1).toLowerCase().replace(/_/g, ' ');
  };

  const handleDatePartChange = (part: keyof GameDate, value: string) => {
    const numericValue = parseInt(value, 10);
    if (!isNaN(numericValue)) {
        onMapConfigDateChange({ [part]: numericValue });
    }
  };

  const handleWorldWeaverSubmit = async () => {
    if (!worldWeaverInput.trim() || isProcessingWorldWeaver) return;
    
    console.log('[WorldWeaver] Starting generation, setting loading state');
    setIsProcessingWorldWeaver(true);
    onWorldWeaverLoadingChange?.(true);
    
    // Force a small delay to ensure the loading state renders
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      const result = await worldWeaverService.generateScenario(worldWeaverInput);
      
      if (result.success && result.year && result.mapArea) {
        onMapConfigDateChange({ year: result.year });
        
        const locationInfo = findZoneForMapArea(result.mapArea);
        
        if (locationInfo) {
          onStartNewWorldAtLocation(locationInfo.zone, result.mapArea, result.characterSpec, result.year);
        } else if (result.zone && result.region) {
          const normalizedZone = normalizeZoneName(result.zone);
          if (!normalizedZone) {
            onStartNewWorldWithCurrentSettings(result.characterSpec);
            setWorldWeaverInput('');
            setIsProcessingWorldWeaver(false);
            onWorldWeaverLoadingChange?.(false);
            return;
          }
          
          const normalizedRegion = normalizeRegionName(normalizedZone, result.region);
          if (!normalizedRegion) {
            onStartNewWorldAtZoneRegion(normalizedZone, Object.keys(GEOGRAPHICAL_DATA[normalizedZone] || {})[0] || '', result.characterSpec);
          } else {
            onStartNewWorldAtZoneRegion(normalizedZone, normalizedRegion, result.characterSpec);
          }
        } else {
          onStartNewWorldWithCurrentSettings(result.characterSpec);
        }
        
        const scenarioData = {
          isWorldWeaver: true,
          year: result.year,
          location: result.mapArea,
          explanation: result.explanation || `Created a world in ${result.mapArea}, year ${result.year}`,
          reasoning: result.reasoning,
          suggestion: result.suggestion,
          characterSpec: result.characterSpec,
          gameMode: result.gameMode,
          specialNPCs: result.specialNPCs,
          customEventsCount: result.customEvents?.length || 0,
          quest: result.quest, // Will be undefined initially
          userPrompt: result.userPrompt || worldWeaverInput // Pass original prompt for deferred quest generation
        };

        // Pass WorldWeaver data to parent for InitialScenarioModal
        if (onWorldWeaverDataReceived) {
          onWorldWeaverDataReceived({
            settingDescription: result.quest?.historicalContext || result.explanation,
            characterDescription: result.characterSpec?.characterDescription,
            quest: result.quest
          });
        }

        // Only set pendingScenarioData, let the useEffect handle opening the modal
        setPendingScenarioData(scenarioData);
        
        setWorldWeaverInput('');
      } else {
        setWorldWeaverInput(result.errorMessage || 'Could not interpret prompt');
        setTimeout(() => setWorldWeaverInput(''), 3000);
      }
    } catch (error) {
      console.error('WorldWeaver error:', error);
      setWorldWeaverInput('Service temporarily unavailable');
      setTimeout(() => setWorldWeaverInput(''), 3000);
    } finally {
      setIsProcessingWorldWeaver(false);
      onWorldWeaverLoadingChange?.(false);
    }
  };

  const handleNavAction = (actionId: string) => {
    switch (actionId) {
      case 'quests':
        setShowQuestsPanel(prev => !prev);
        break;
      case 'world-map':
        setIsWorldMapModalOpen(true);
        break;
      case 'configure':
        toggleGeneratorPanel();
        break;
      case 'about':
        setIsAboutModalOpen(true);
        break;
      case 'settings':
        setIsSettingsModalOpen(true);
        break;
      case 'end': {
        setShowEndGameConfirm(true);
        break;
      }
      case 'api':
        setShowAPITracker(!showAPITracker);
        setApiStats(eventService.getAPIUsageStats());
        break;
      case 'theme':
        themeService.toggleTheme();
        break;
      case 'toggle-educational-mode': {
        const currentlyEnabled = learningObjectivesService.isEducationalMode();

        if (currentlyEnabled) {
          // Disable educational mode
          learningObjectivesService.clearSession();
          localStorage.removeItem('educationalMode');
          setIsEducationalMode(false);
          console.log('[TopNavBar] Educational mode disabled');
        } else {
          // Enable educational mode
          localStorage.setItem('educationalMode', 'true');
          learningObjectivesService.initializeSession({
            learningObjectives: ['historical-thinking', 'cultural-comparison', 'social-structures'],
            assessmentFrequency: 'occasional',
            difficulty: 'realistic',
            sessionLength: 'extended',
            trackingEnabled: true
          });
          setIsEducationalMode(true);
          console.log('[TopNavBar] Educational mode enabled');
        }
        break;
      }
    }
    if (isMobile) setIsMobileMenuOpen(false);
  };

  const getButtonColorClasses = (_color: string, isActive = false) => {
    return `relative nav-button nav-button--compact${isActive ? ' nav-button--active' : ''}`;
  };

  return (
      <>
        <nav
          data-surface="top-nav"
          className={getSafariOptimizedClassName("top-nav theme-surface relative w-full border-b z-50")}
        >
        <div className="px-2 sm:px-4 py-2">
          {/* Main Navigation Row */}
          <div className="flex items-center justify-between gap-2">
            {/* Logo and Title - aligned to left */}
            <div className="flex items-center gap-2 flex-shrink-0 pl-2 pr-4">
              <style jsx="true">{`
                @keyframes subtleGlow {
                  0%, 100% { opacity: 0.7; }
                  50% { opacity: 0.9; }
                }
                .subtle-glow {
                  animation: subtleGlow 5s ease-in-out infinite;
                }
              `}</style>
              
              <a
                href="/"
                className="brand-mark mr-4 text-xs sm:text-sm lg:text-base subtle-glow transition-all duration-300 cursor-pointer no-underline"
              >
                HISTORY SIMULATOR
              </a>
              
              {/* Journal Button */}
              <div className="relative ml-1">
                <button
                  onClick={() => setShowJournal(prev => !prev)}
                  className={getOptimizedButtonClassName(`nav-button nav-button--compact flex items-center gap-1.5 ${showJournal ? 'nav-button--active' : ''}`)}
                  data-active={showJournal}
                  title="Field Journal (⌘J)"
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden lg:inline">Journal</span>
                </button>

                {/* Helpful UI text when active */}
                {showJournal && (
                  <span className="absolute -right-2 top-full mt-1 text-[10px] text-[var(--text-muted)] whitespace-nowrap animate-pulse">
                    click to close
                  </span>
                )}
              </div>

            </div>

            {/* WorldWeaver Input - Desktop (Centered with flex-1) */}
            {!isMobile && (
              <div className="flex-1 max-w-lg mx-2 -ml-2">
                <div className="flex items-center gap-2">
                  <div className="relative worldweaver-container flex-1">
                  {/* Liquid-like loading animation overlay */}
                  {isProcessingWorldWeaver && (
                    <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none z-10">
                      <div
                        className="worldweaver-liquid-fill absolute inset-0"
                        style={{
                          background: 'linear-gradient(90deg, transparent 0%, rgba(52, 211, 153, 0.3) 50%, transparent 100%)',
                        }}
                      />
                      <div
                        className="worldweaver-liquid-rise absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-400/80 via-green-400/20 to-transparent"
                      />
                    </div>
                  )}

                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Sparkles className={`w-4 h-4 transition-colors ${
                      isProcessingWorldWeaver ? 'text-[var(--color-success)] animate-pulse' :
                      worldWeaverFocused ? 'text-[var(--color-success)]' : 'text-text-muted'
                    }`} />
                  </div>
                  <input
                    type="text"
                    value={worldWeaverInput}
                    onChange={(e) => setWorldWeaverInput(e.target.value)}
                    onFocus={() => setWorldWeaverFocused(true)}
                    onBlur={() => setTimeout(() => setWorldWeaverFocused(false), 200)}
                    onKeyPress={(e) => e.key === 'Enter' && handleWorldWeaverSubmit()}
                    placeholder={isProcessingWorldWeaver ? "Creating your world..." : "Create world from text..."}
                    disabled={isProcessingWorldWeaver}
                    aria-label="WorldWeaver: Create a custom world from text description"
                    role="searchbox"
                    className={`
                      worldweaver-input w-full pl-10 pr-4 py-2 text-sm
                      bg-[var(--surface-card-bg)] backdrop-blur-xs
                      border rounded-lg
                      text-text-primary placeholder-text-muted
                      transition-all duration-300
                      ${isProcessingWorldWeaver
                        ? 'border-[var(--color-success)]/50 shadow-lg animate-pulse'
                        : worldWeaverFocused
                        ? 'border-[var(--color-success)]/40 shadow-lg ring-1 ring-[var(--color-success)]/20 worldweaver-glow-active'
                        : 'border-[var(--border-normal)] hover:border-[var(--border-hover)] worldweaver-glow'
                      }
                      focus:outline-none
                    `}
                    style={isProcessingWorldWeaver ? { animation: 'pulseGlow 2s ease-in-out infinite' } : {}}
                  />
                  {worldWeaverInput && !isProcessingWorldWeaver && (
                    <button
                      onClick={handleWorldWeaverSubmit}
                      disabled={isProcessingWorldWeaver}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <div className="px-2 py-1 bg-[var(--color-success)]/60 hover:bg-[var(--color-success)]/80 rounded text-xs text-white font-medium transition-colors">
                        Create
                      </div>
                    </button>
                  )}
                  </div>
                  <button
                    onClick={handleHistoryLensToggle}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                      centralMode === 'historylens'
                        ? 'border-[var(--color-success)]/60 text-[var(--color-success)] bg-[var(--color-success)]/10'
                        : 'border-[var(--border-normal)] text-text-secondary hover:text-text-primary hover:border-[var(--border-hover)]'
                    }`}
                    aria-pressed={centralMode === 'historylens'}
                    aria-label="Toggle History Lens mode"
                    title={centralMode === 'historylens' ? 'Switch to Map View' : 'Switch to History Lens'}
                  >
                    History Lens
                  </button>
                </div>
              </div>
            )}

            {/* Desktop Navigation Buttons - aligned to right */}
            <div className="hidden md:flex items-center gap-3 pr-2">
              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Primary Source Search */}
              <PrimarySourceSearch />

              {/* Game Actions */}
              <div className="flex items-center gap-1.5 px-2 py-0 ">
                {NAV_BUTTON_GROUPS.game.map(button => {
                  const Icon = button.icon;
                  const displayLabel = button.id === 'world-map' ? 'Map' : button.label;
                  return (
                    <button
                      key={button.id}
                      onClick={() => handleNavAction(button.id)}
                      className={getOptimizedButtonClassName(getButtonColorClasses(button.color))}
                      title={button.label}
                      aria-label={button.label}
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                      <span className={`${button.id === 'quests' ? 'hidden md:inline' : 'hidden lg:inline'}`}>{displayLabel}</span>
                    </button>
                  );
                })}
              </div>

              {/* Info Actions */}
              <div className="flex items-center gap-1.5 px-2 py-1 surface-muted rounded-xl border border-surface-muted ">
                {NAV_BUTTON_GROUPS.info.map(button => {
                  const Icon = button.icon;
                  const isActive = button.id === 'api' && showAPITracker;
                  return (
                    <button
                      key={button.id}
                      onClick={() => handleNavAction(button.id)}
                      className={getOptimizedButtonClassName(getButtonColorClasses(button.color, isActive))}
                      data-active={isActive}
                      data-variant={button.id}
                      title={button.label}
                      aria-label={button.label}
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                      {button.id === 'api' && apiStats.sessionCalls > 0 && (
                        <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full" aria-label={`${apiStats.sessionCalls} API calls`}>
                          {apiStats.sessionCalls}
                        </span>
                      )}
                    </button>
                  );
                })}

              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden nav-button nav-button--compact"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Mobile WorldWeaver Input */}
          {isMobile && (
            <div className="mt-2">
              <div className="relative">
                {/* Liquid-like loading animation overlay */}
                {isProcessingWorldWeaver && (
                  <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none z-10">
                    <div 
                      className="worldweaver-liquid-fill absolute inset-0"
                      style={{
                        background: 'linear-gradient(90deg, transparent 0%, rgba(52, 211, 153, 0.3) 50%, transparent 100%)',
                      }}
                    />
                    <div 
                      className="worldweaver-liquid-rise absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-400/30 via-green-400/20 to-transparent"
                    />
                  </div>
                )}
                
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Sparkles className={`w-4 h-4 transition-colors ${
                    isProcessingWorldWeaver ? 'text-[var(--color-success)] animate-pulse' : 'text-text-muted'
                  }`} />
                </div>
                <input
                  type="text"
                  value={worldWeaverInput}
                  onChange={(e) => setWorldWeaverInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleWorldWeaverSubmit()}
                  placeholder={isProcessingWorldWeaver ? "Creating your world..." : "Create world..."}
                  disabled={isProcessingWorldWeaver}
                  className={`w-full pl-10 pr-4 py-2 text-sm bg-background-secondary border rounded-lg text-text-primary placeholder-text-muted focus:outline-none transition-all duration-300 ${
                    isProcessingWorldWeaver
                      ? 'border-[var(--color-success)]/50 shadow-lg'
                      : 'border-surface-muted focus:border-[var(--color-success)]/50'
                  }`}
                />
              </div>
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleHistoryLensToggle}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                    centralMode === 'historylens'
                      ? 'border-[var(--color-success)]/60 text-[var(--color-success)] bg-[var(--color-success)]/10'
                      : 'border-[var(--border-normal)] text-text-secondary hover:text-text-primary hover:border-[var(--border-hover)]'
                  }`}
                  aria-pressed={centralMode === 'historylens'}
                  aria-label="Toggle History Lens mode"
                  title={centralMode === 'historylens' ? 'Switch to Map View' : 'Switch to History Lens'}
                >
                  History Lens
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobile && (
          <div className={`
            absolute top-full left-0 right-0 mt-1 mx-2
            surface-card backdrop-blur-md
            border border-surface-muted rounded-lg shadow-xl
            transition-all duration-300 origin-top
            ${isMobileMenuOpen
              ? 'opacity-100 scale-y-100 pointer-events-auto'
              : 'opacity-0 scale-y-0 pointer-events-none'
            }
          `}>
            <div className="p-3 space-y-2">
              {/* Game Actions */}
              <div className="space-y-1">
                <div className="text-xs text-text-muted font-medium px-2 pb-1">Game</div>
                {NAV_BUTTON_GROUPS.game.map(button => {
                  const Icon = button.icon;
                  return (
                    <button
                      key={button.id}
                      onClick={() => handleNavAction(button.id)}
                      className={`
                        w-full px-3 py-2.5 text-sm font-medium text-text-primary rounded-lg
                        transition-all duration-200 flex items-center gap-2
                        ${getButtonColorClasses(button.color)}
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      {button.label}
                    </button>
                  );
                })}

              </div>

              {/* Theme Toggle for Mobile */}
              <div className="pt-2 border-t border-surface-muted">
                <div className="px-2 pb-2 flex items-center justify-between">
                  <div className="text-xs text-text-muted font-medium">Appearance</div>
                  <ThemeToggle />
                </div>
              </div>

              {/* Info Actions */}
              <div className="space-y-1 pt-2 border-t border-surface-muted">
                <div className="text-xs text-text-muted font-medium px-2 pb-1">Info</div>
                {NAV_BUTTON_GROUPS.info.map(button => {
                  const Icon = button.icon;
                  return (
                    <button
                      key={button.id}
                      onClick={() => handleNavAction(button.id)}
                      className={`
                        w-full px-3 py-2.5 text-sm font-medium text-text-primary rounded-lg
                        transition-all duration-200 flex items-center gap-2
                        ${getButtonColorClasses(button.color)}
                      `}
                      data-variant={button.id}
                    >
                      <Icon className="w-4 h-4" />
                      {button.label}
                      {button.id === 'api' && apiStats.sessionCalls > 0 && (
                        <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                          {apiStats.sessionCalls}
                        </span>
                      )}
                    </button>
                  );
                })}

              </div>
            </div>
          </div>
        )}

        {/* Generator Panel (Configure) */}
        <div className={`
          absolute top-full left-0 right-0 z-30
          bg-gradient-to-b from-white/95 to-slate-50/95 dark:from-slate-800/95 dark:to-slate-900/95 backdrop-blur-md
          shadow-2xl border-t border-slate-300/50 dark:border-slate-700/50
          transition-all duration-500 ease-in-out overflow-hidden
          ${isGeneratorPanelOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}
        `}>
          <div className="max-w-6xl mx-auto p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Contextual Settings */}
              <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-300/50 dark:border-slate-700/50 p-4">
                <h3 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Context & Time
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Cultural Zone</label>
                    <select 
                      value={currentZone} 
                      onChange={(e) => onLocationChange(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                    >
                      {CULTURE_ZONES.map(zone => (
                        <option key={zone} value={zone}>{zone}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Date</label>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        value={gameDate.day}
                        onChange={(e) => handleDatePartChange('day', e.target.value)}
                        min="1"
                        max="31"
                        placeholder="Day"
                        className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50"
                      />
                      <input
                        type="number"
                        value={gameDate.month}
                        onChange={(e) => handleDatePartChange('month', e.target.value)}
                        min="1"
                        max="12"
                        placeholder="Month"
                        className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50"
                      />
                      <input
                        type="number"
                        value={gameDate.year}
                        onChange={(e) => handleDatePartChange('year', e.target.value)}
                        placeholder="Year"
                        className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50"
                      />
                    </div>
                  </div>

                  <div className="pt-3 space-y-2">
                    <button
                      onClick={() => { 
                        onRegenerateMapWithCurrentSettings(); 
                        setIsGeneratorPanelOpen(false);
                      }}
                      className="w-full px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Shuffle className="w-4 h-4" />
                      Regenerate Current Map
                    </button>
                    <button
                      onClick={() => { 
                        onStartNewWorldWithCurrentSettings(); 
                        setIsGeneratorPanelOpen(false);
                      }}
                      className="w-full px-4 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Globe className="w-4 h-4" />
                      Start New World
                    </button>
                  </div>
                </div>
              </div>

              {/* Generation Parameters */}
              <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-300/50 dark:border-slate-700/50 p-4">
                <h3 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
                  <Sliders className="w-4 h-4" />
                  Map Generation
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Archetype</label>
                      <select
                        value={userSelectedBaseArchetype}
                        onChange={(e) => onBaseArchetypeChange(e.target.value as MapArchetype)}
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:border-green-500/50"
                      >
                        {Object.values(MapArchetype).map(arch => (
                          <option key={arch} value={arch}>{formatEnumString(arch)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Climate</label>
                      <select
                        value={userSelectedBaseClimate}
                        onChange={(e) => onBaseClimateChange(e.target.value as ClimateType)}
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:border-green-500/50"
                      >
                        {Object.values(ClimateType).map(clim => (
                          <option key={clim} value={clim}>{formatEnumString(clim)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Altitude</label>
                    <select
                      value={userSelectedBaseAltitude}
                      onChange={(e) => onBaseAltitudeChange(e.target.value as AltitudeSetting)}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:border-green-500/50"
                    >
                      <option value="standard">Standard</option>
                      <option value="high">High Altitude</option>
                      <option value="low">Low Altitude</option>
                    </select>
                  </div>

                  <div className="pt-3 space-y-2 border-t border-slate-700/50">
                    <label className="text-xs font-medium text-gray-400">Features</label>
                    <div className="space-y-2">
                      {[
                        { id: 'harbor', label: 'Generate Harbor', value: generateHarbor, onChange: onGenerateHarborToggle },
                        { id: 'city', label: 'Generate Large City', value: generateLargeCity, onChange: onGenerateLargeCityToggle },
                        { id: 'volcanic', label: 'Volcanic Activity', value: forceVolcanicActivity, onChange: onForceVolcanicActivityToggle },
                      ].map(toggle => (
                        <label key={toggle.id} className="flex items-center justify-between py-1 cursor-pointer group">
                          <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                            {toggle.label}
                          </span>
                          <input
                            type="checkbox"
                            checked={toggle.value}
                            onChange={(e) => toggle.onChange(e.target.checked)}
                            className="w-4 h-4 text-green-500 bg-slate-700 border-slate-600 rounded focus:ring-green-500 focus:ring-offset-0"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Current Location Info */}
            <div className="mt-4 px-4 py-3 bg-slate-800/30 rounded-lg border border-slate-700/30 flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Coordinates: ({currentWorldCoords.x}, {currentWorldCoords.y})
                </span>
                <span>Seed: {currentMapSeed}</span>
              </div>
              <button
                onClick={() => setIsGeneratorPanelOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* API Tracker Dropdown */}
        {showAPITracker && !isMobile && (
          <div className="absolute top-full right-4 mt-2 w-80 bg-slate-800/95 backdrop-blur-md border border-slate-600/50 rounded-xl shadow-2xl z-50">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  LLM API Usage
                </h3>
                <button
                  onClick={() => setShowAPITracker(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-700/30 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">Session</div>
                    <div className="text-lg font-semibold text-white">{apiStats.sessionCalls}</div>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">Total</div>
                    <div className="text-lg font-semibold text-white">{apiStats.totalCalls}</div>
                  </div>
                </div>
                
                {apiStats.costEstimate !== undefined && (
                  <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-3">
                    <div className="text-xs text-green-400 mb-1">Estimated Cost</div>
                    <div className="text-lg font-semibold text-green-300">
                      ${(apiStats.costEstimate / 100).toFixed(2)}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowLLMHistory(!showLLMHistory);
                      setLLMHistory(eventService.getLLMHistory());
                    }}
                    className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    {showLLMHistory ? 'Hide' : 'View'} History
                  </button>
                  <button
                    onClick={() => {
                      eventService.resetSessionCalls();
                      setApiStats(eventService.getAPIUsageStats());
                    }}
                    className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    Reset Session
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LLM History Panel */}
        {showLLMHistory && showAPITracker && !isMobile && (
          <div className="absolute top-full right-4 mt-[280px] w-[600px] max-h-[500px] bg-slate-900/95 backdrop-blur-md border border-slate-600/50 rounded-xl shadow-2xl z-50 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                LLM Call History
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const text = eventService.exportLLMHistoryAsText();
                    const blob = new Blob([text], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `llm-history-${Date.now()}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  Download
                </button>
                <button
                  onClick={() => setShowLLMHistory(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {llmHistory.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No LLM calls made yet</div>
              ) : (
                <div className="space-y-4">
                  {llmHistory.map((entry, index) => (
                    <div key={index} className="bg-slate-800/50 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-indigo-400 font-medium">Call #{llmHistory.length - index}</span>
                        <span className="text-gray-500">{new Date(entry.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Input:</div>
                          <div className="text-xs text-gray-300 bg-slate-900/50 p-2 rounded max-h-32 overflow-y-auto font-mono">
                            {entry.input.length > 500 ? entry.input.substring(0, 500) + '...' : entry.input}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Output:</div>
                          <div className="text-xs text-gray-300 bg-slate-900/50 p-2 rounded max-h-32 overflow-y-auto font-mono">
                            {entry.output.length > 500 ? entry.output.substring(0, 500) + '...' : entry.output}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

    </>
  );
};

export default TopNavBarPolished;
