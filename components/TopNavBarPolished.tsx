import React, { useState, useEffect } from 'react';
import './TopNavBarPolished.css'; // For custom animations
import { 
  Globe, Info, Settings, Shuffle, ChevronDown, Menu, X, Sparkles, 
  Cpu, ScrollText, MapPin, Compass, Activity,
  Zap, Download, History, AlertCircle, Sliders, Trophy, Target, Clock,
  Shield, Compass as CompassIcon, Coins, BookOpen, Crown, Home, Users, Scale
} from 'lucide-react';
import { useUI } from '../contexts/UIContext';
import { useMap } from '../contexts/MapContext';
import { useGame } from '../contexts/GameContext';
import { MapArchetype, ClimateType, AltitudeSetting, GameDate } from '../types';
import { PrimarySourceSearch } from './PrimarySourceSearch';
import { MAP_ARCHETYPE_DESCRIPTIONS, CLIMATE_TYPE_DESCRIPTIONS, CULTURE_ZONES, GEOGRAPHICAL_DATA } from '../constants/index';
import { getSafariOptimizedClassName, getOptimizedButtonClassName } from '../utils/safariUtils';
import { worldWeaverService } from '../services/worldWeaverService';
import WorldWeaverModal from './WorldWeaverModal';
import QuestsPanel from './QuestsPanel';
import { findZoneForMapArea } from '../utils/mapAreaLookup';
import { normalizeZoneName, normalizeRegionName } from '../utils/worldWeaverHelpers';
import { eventService } from '../services/eventService';
import { useEventSystem } from '../hooks/useEventSystem';

// Button group configurations for better organization
const NAV_BUTTON_GROUPS = {
  game: [
    { id: 'world-map', icon: Globe, label: 'World Map', color: 'slate' },
    { id: 'quests', icon: ScrollText, label: 'Quests', color: 'slate' },
  ],
  info: [
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

const TopNavBarPolished: React.FC = () => {
  const { setIsSettingsModalOpen, setIsAboutModalOpen, setIsWorldMapModalOpen } = useUI();
  const { currentMode } = useEventSystem();
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
  const [showQuestsPanel, setShowQuestsPanel] = useState(false);
  const [showGameModeTooltip, setShowGameModeTooltip] = useState(false);
  const [showGameModePanel, setShowGameModePanel] = useState(false);
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
  
  // Show modal when map finishes loading with pending scenario data
  useEffect(() => {
    if (!isLoading && pendingScenarioData && !worldWeaverModalData.isOpen) {
      setWorldWeaverModalData({
        isOpen: true,
        ...pendingScenarioData
      });
      setPendingScenarioData(null);
    }
  }, [isLoading, pendingScenarioData, worldWeaverModalData.isOpen, setPendingScenarioData]);

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
          customEventsCount: result.customEvents?.length || 0
        };
        
        setPendingScenarioData(scenarioData);
        setWorldWeaverModalData({
          isOpen: true,
          ...scenarioData
        });
        
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
    }
  };

  const handleNavAction = (actionId: string) => {
    switch (actionId) {
      case 'quests':
        setShowQuestsPanel(true);
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
      case 'api':
        setShowAPITracker(!showAPITracker);
        setApiStats(eventService.getAPIUsageStats());
        break;
    }
    if (isMobile) setIsMobileMenuOpen(false);
  };

  const getButtonColorClasses = (color: string, isActive = false) => {
    const colors: Record<string, string> = {
      slate: isActive ? 'bg-slate-600 hover:bg-slate-700 border border-slate-500' : 'bg-slate-700/90 hover:bg-slate-600 border border-slate-600/50',
      blue: isActive ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600/90 hover:bg-blue-700',
      green: isActive ? 'bg-green-600 hover:bg-green-700' : 'bg-green-600/90 hover:bg-green-700',
      purple: isActive ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-600/90 hover:bg-purple-700',
      gray: isActive ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-700/90 hover:bg-gray-600',
      indigo: isActive ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-600/90 hover:bg-indigo-700',
    };
    return colors[color] || colors.slate;
  };

  return (
    <>
      <nav className={getSafariOptimizedClassName("relative w-full shadow-xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 z-40")}>
        <div className="px-2 sm:px-4 py-2">
          {/* Main Navigation Row */}
          <div className="flex items-center justify-between gap-2">
            {/* Logo and Title - aligned to left */}
            <div className="flex items-center gap-2 flex-shrink-0 pl-2 pr-4">
              <style jsx="true">{`
                @keyframes subtleGlow {
                  0%, 100% { opacity: 0.7; }
                  50% { opacity: 1; }
                }
                .subtle-glow {
                  animation: subtleGlow 4s ease-in-out infinite;
                  filter: drop-shadow(0 0 3px rgba(74, 222, 128, 0.3));
                }
              `}</style>
              
              <h1 className="font-press-start mr-8 text-lg sm:text-lg lg:text-lg bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-green-400 to-emerald-400 subtle-glow">
                HISTORY SIMULATOR
              </h1>
              
              {/* Divider */}
              <div className="hidden sm:block h-6 w-px bg-slate-600/40" />
              
              {/* Game Mode Display */}
              <div className="relative">
                <button
                  className={`px-3 ml-4 py-1.5 text-xs font-medium 
                    ${currentMode && GAME_MODE_CONFIG[currentMode.id as keyof typeof GAME_MODE_CONFIG] ? 
                      `${GAME_MODE_CONFIG[currentMode.id as keyof typeof GAME_MODE_CONFIG].bgColor} ${GAME_MODE_CONFIG[currentMode.id as keyof typeof GAME_MODE_CONFIG].borderColor} border` :
                      'bg-gradient-to-r from-slate-700/60 to-slate-600/60 border border-slate-500/40'
                    }
                    hover:from-slate-600/70 hover:to-slate-500/70 
                    rounded-lg transition-all duration-200
                    ${currentMode && GAME_MODE_CONFIG[currentMode.id as keyof typeof GAME_MODE_CONFIG] ? 
                      GAME_MODE_CONFIG[currentMode.id as keyof typeof GAME_MODE_CONFIG].color : 
                      'text-slate-200'
                    } hover:text-white flex items-center gap-1.5`}
                  onMouseEnter={() => setShowGameModeTooltip(true)}
                  onMouseLeave={() => setShowGameModeTooltip(false)}
                  onClick={() => setShowGameModePanel(!showGameModePanel)}
                >
                  {currentMode && GAME_MODE_CONFIG[currentMode.id as keyof typeof GAME_MODE_CONFIG] ? 
                    React.createElement(GAME_MODE_CONFIG[currentMode.id as keyof typeof GAME_MODE_CONFIG].icon, { className: "w-3.5 h-3.5" }) :
                    <Trophy className="w-3.5 h-3.5" />
                  }
                  <span>{currentMode ? currentMode.name : 'Select Mode'}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showGameModePanel ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Tooltip */}
                  {showGameModeTooltip && !showGameModePanel && currentMode && (
                    <div className="absolute top-full left-0 mt-2 p-2 bg-slate-800 border border-slate-600 
                      rounded-lg shadow-xl z-50 w-64 pointer-events-none animate-in fade-in slide-in-from-top-1 duration-200">
                      <p className="text-xs text-slate-300">{currentMode.description}</p>
                      <p className="text-[10px] text-slate-500 mt-1">Click for more details</p>
                    </div>
                  )}
                  
                  {/* Dropdown Panel */}
                  {showGameModePanel && (
                    <div className="absolute top-full left-0 mt-2 p-4 bg-gradient-to-br from-slate-800 to-slate-900 
                      border border-slate-600 rounded-lg shadow-2xl z-50 w-80 animate-in slide-in-from-top-2 duration-200">
                      {currentMode ? (
                        <>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className={`text-sm font-semibold flex items-center gap-1.5 
                                ${GAME_MODE_CONFIG[currentMode.id as keyof typeof GAME_MODE_CONFIG]?.color || 'text-amber-400'}`}>
                                {GAME_MODE_CONFIG[currentMode.id as keyof typeof GAME_MODE_CONFIG] ? 
                                  React.createElement(GAME_MODE_CONFIG[currentMode.id as keyof typeof GAME_MODE_CONFIG].icon, { className: "w-4 h-4" }) :
                                  <Trophy className="w-4 h-4" />
                                }
                                {currentMode.name}
                              </h3>
                              <p className="text-xs text-slate-400 mt-1">
                                {GAME_MODE_CONFIG[currentMode.id as keyof typeof GAME_MODE_CONFIG]?.description || currentMode.description}
                              </p>
                        </div>
                        <button
                          onClick={() => setShowGameModePanel(false)}
                          className="text-slate-500 hover:text-white transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <h4 className="text-xs font-medium text-slate-300 mb-1">Victory Conditions:</h4>
                          <ul className="space-y-1">
                            {currentMode.victoryConditions.map((condition, idx) => (
                              <li key={idx} className="text-xs text-slate-400 flex items-start gap-1">
                                <Target className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                                <span>{condition.description}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                        </>
                      ) : (
                        <div className="text-center">
                          <p className="text-sm text-slate-400">No game mode selected</p>
                          <p className="text-xs text-slate-500 mt-2">Start a new game to select a mode</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
            </div>

            {/* WorldWeaver Input - Desktop */}
            {!isMobile && (
              <div className="flex-1 max-w-lg mx-4">
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
                      isProcessingWorldWeaver ? 'text-green-300 animate-pulse' :
                      worldWeaverFocused ? 'text-green-400' : 'text-gray-500'
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
                    className={`
                      w-full pl-10 pr-4 py-2 text-sm
                      bg-slate-800/50 backdrop-blur-sm
                      border rounded-lg
                      text-gray-200 placeholder-gray-500
                      transition-colors duration-150
                      ${isProcessingWorldWeaver 
                        ? 'border-green-400/50 shadow-lg shadow-green-400/20 animate-pulse' 
                        : worldWeaverFocused 
                        ? 'border-green-500/50 shadow-lg shadow-green-500/10 ring-1 ring-green-500/20' 
                        : 'border-slate-600/50 hover:border-slate-500/50'
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
                      <div className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs text-white font-medium transition-colors">
                        Create
                      </div>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Desktop Navigation Buttons - aligned to right */}
            <div className="hidden md:flex items-center gap-2 pr-2">
              {/* Primary Source Search */}
              <PrimarySourceSearch />
              
              {/* Game Actions */}
              <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-800/30 rounded-lg">
                {NAV_BUTTON_GROUPS.game.map(button => {
                  const Icon = button.icon;
                  return (
                    <button
                      key={button.id}
                      onClick={() => handleNavAction(button.id)}
                      className={getOptimizedButtonClassName(`
                        px-3 py-1.5 text-xs font-medium text-white rounded-md
                        transition-all duration-200 flex items-center gap-1.5
                        ${getButtonColorClasses(button.color)}
                        shadow-sm hover:shadow-md hover:scale-105
                      `)}
                      title={button.label}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden lg:inline">{button.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Info Actions */}
              <div className="flex items-center gap-1.5">
                {NAV_BUTTON_GROUPS.info.map(button => {
                  const Icon = button.icon;
                  const isActive = button.id === 'api' && showAPITracker;
                  return (
                    <button
                      key={button.id}
                      onClick={() => handleNavAction(button.id)}
                      className={getOptimizedButtonClassName(`
                        relative px-3 py-1.5 text-xs font-medium text-white rounded-md
                        transition-all duration-200 flex items-center gap-1.5
                        ${getButtonColorClasses(button.color, isActive)}
                        shadow-sm hover:shadow-md hover:scale-105
                      `)}
                      title={button.label}
                    >
                      <Icon className="w-4 h-4" />
                      {button.id === 'api' && apiStats.sessionCalls > 0 && (
                        <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
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
              className="md:hidden p-2 bg-slate-800/50 hover:bg-slate-700/50 text-gray-300 rounded-lg transition-all duration-200 border border-slate-600/50"
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
                    isProcessingWorldWeaver ? 'text-green-300 animate-pulse' : 'text-gray-500'
                  }`} />
                </div>
                <input
                  type="text"
                  value={worldWeaverInput}
                  onChange={(e) => setWorldWeaverInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleWorldWeaverSubmit()}
                  placeholder={isProcessingWorldWeaver ? "Creating your world..." : "Create world..."}
                  disabled={isProcessingWorldWeaver}
                  className={`w-full pl-10 pr-4 py-2 text-sm bg-slate-800/50 border rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none transition-all duration-300 ${
                    isProcessingWorldWeaver 
                      ? 'border-green-400/50 shadow-lg shadow-green-400/20' 
                      : 'border-slate-600/50 focus:border-green-500/50'
                  }`}
                />
              </div>
            </div>
          )}
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobile && (
          <div className={`
            absolute top-full left-0 right-0 mt-1 mx-2
            bg-slate-800/95 backdrop-blur-md
            border border-slate-600/50 rounded-lg shadow-xl
            transition-all duration-300 origin-top
            ${isMobileMenuOpen 
              ? 'opacity-100 scale-y-100 pointer-events-auto' 
              : 'opacity-0 scale-y-0 pointer-events-none'
            }
          `}>
            <div className="p-3 space-y-2">
              {/* Game Actions */}
              <div className="space-y-1">
                <div className="text-xs text-gray-400 font-medium px-2 pb-1">Game</div>
                {NAV_BUTTON_GROUPS.game.map(button => {
                  const Icon = button.icon;
                  return (
                    <button
                      key={button.id}
                      onClick={() => handleNavAction(button.id)}
                      className={`
                        w-full px-3 py-2.5 text-sm font-medium text-white rounded-lg
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

              {/* Info Actions */}
              <div className="space-y-1 pt-2 border-t border-slate-700/50">
                <div className="text-xs text-gray-400 font-medium px-2 pb-1">Info</div>
                {NAV_BUTTON_GROUPS.info.map(button => {
                  const Icon = button.icon;
                  return (
                    <button
                      key={button.id}
                      onClick={() => handleNavAction(button.id)}
                      className={`
                        w-full px-3 py-2.5 text-sm font-medium text-white rounded-lg
                        transition-all duration-200 flex items-center gap-2
                        ${getButtonColorClasses(button.color)}
                      `}
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
          bg-gradient-to-b from-slate-800/95 to-slate-900/95 backdrop-blur-md
          shadow-2xl border-t border-slate-700/50
          transition-all duration-500 ease-in-out overflow-hidden
          ${isGeneratorPanelOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}
        `}>
          <div className="max-w-6xl mx-auto p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Contextual Settings */}
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
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
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
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
      
      {/* Modals */}
      <WorldWeaverModal
        isOpen={worldWeaverModalData.isOpen}
        onClose={() => setWorldWeaverModalData(prev => ({ ...prev, isOpen: false }))}
        year={worldWeaverModalData.year}
        location={worldWeaverModalData.location}
        explanation={worldWeaverModalData.explanation}
        reasoning={worldWeaverModalData.reasoning}
        suggestion={worldWeaverModalData.suggestion}
        characterSpec={worldWeaverModalData.characterSpec}
        gameMode={worldWeaverModalData.gameMode}
        specialNPCs={worldWeaverModalData.specialNPCs}
        customEventsCount={worldWeaverModalData.customEventsCount}
      />
      
      <QuestsPanel
        isOpen={showQuestsPanel}
        onClose={() => setShowQuestsPanel(false)}
        onNavigateToQuest={(x, y) => {
          console.log('Navigate to quest at:', x, y);
          setShowQuestsPanel(false);
        }}
      />
    </>
  );
};

export default TopNavBarPolished;