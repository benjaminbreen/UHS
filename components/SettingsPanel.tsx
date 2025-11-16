import React, { useState, useEffect } from 'react';
import PerformanceDiagnostics from './PerformanceDiagnostics';
import { eventService } from '../services/eventService';
import { gameSounds } from '../services/gameSoundsService';
import { useModalKeyboard } from '../hooks/useModalKeyboard';
import { Cpu, Download, Activity, X, FlaskConical, Heart, AlertTriangle, MapIcon, ScrollText, Users, Save, Database, ChevronDown, ChevronUp, Info, Settings as SettingsIcon, BookOpen, Gamepad2, Hexagon, Volume2, VolumeX, Link, Copy, Check, Sparkles, Zap, Globe, Shuffle, Trophy, Shield, Compass, Coins, Crown, Home, Scale, Briefcase } from 'lucide-react';
import DiseaseService from '../services/diseaseService';
import { dialectContinuumService } from '../services/dialectContinuumService';
import { DISEASE_DATABASE, DISEASE_PREVALENCE } from '../constants/gameData/diseases';
import { HistoricalEra } from '../types/ambiance';
import { CulturalZone } from '../types/characterData';
import SpecialMapTestMenu from './SpecialMapTestMenu';
import InteriorMapTestMenu from './InteriorMapTestMenu';
import QuestTestingPanel from './QuestTestingPanel';
import NpcTestingPanel from './NpcTestingPanel';
import FishingTestPanel from './FishingTestPanel';
import FishingGameCanvas from './FishingGameCanvas';
import FishingSystemTest from './FishingSystemTest';
import FishingHutSimple from './FishingHutSimple';
import { FishingDataService, FishSpecies } from '../services/fishingDataService';
import { ClimateType } from '../types/biomes/climate';
import { SavedGamesModal } from './SavedGamesModal';
import { SavedGame } from '../services/saveGameService';
import { shareableStateService } from '../services/shareableStateService';
import { SeedManager } from '../services/seedService';
import { findZoneForMapArea } from '../services/zoneDetectionService';
import { learningObjectivesService } from '../services/learningObjectivesService';
import SoundTestPanel from './SoundTestPanel';
import IconTestPanel from './IconTestPanel';
import { PrimarySourcesDevPanel } from './PrimarySourcesDevPanel';
import PrimarySourcesModal from './PrimarySourcesModal';
import MiningRoguelikeDisplay from './MiningRoguelikeDisplay';
import TestSuitePanel from './TestSuitePanel';
import FactoryBannerTest from './FactoryBannerTest';
import CityTimeline from './CityTimeline';
import TradeNetworkGlobe from './TradeNetworkGlobe';
import CityMapGlobe from './CityMapGlobe';
import HexWorldMap from './HexWorldMap';
import HexWorldGlobe from './HexWorldGlobe';
import RailroadTestPanel from './RailroadTestPanel';
import WorkOfferTestPanel from './WorkOfferTestPanel';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentSeed: number;
  onSeedChange: (seed: number) => void;
  showDevTooltip: boolean;
  currentGameYear?: number;
  playerLocation?: string;
  onToggleDevTooltip: () => void;
  useLlmForDescriptions: boolean;
  onToggleLlmForDescriptions: () => void;
  useLlmForCharacter: boolean;
  onToggleLlmForCharacter: () => void;
  isTestModeEnabled: boolean;
  onToggleTestMode: () => void;
  isDevBuildingModeOpen: boolean;
  onToggleDevBuildingMode: () => void;
  playerCharacter?: any;
  mapData?: any;
  currentZone?: string;
  currentYear?: number;
  onLoadGame?: (save: SavedGame) => void;
  currentGameState?: any;
  contextualTooltipsEnabled: boolean;
  onToggleContextualTooltips: (enabled: boolean) => void;
  onResetTooltips: () => void;
}

// Modern Settings Toggle Component
const SettingsToggle: React.FC<{
    id: string;
    label: string;
    description: string;
    isChecked: boolean;
    onToggle: () => void;
    icon?: React.ElementType;
}> = ({ id, label, description, isChecked, onToggle, icon: Icon }) => (
    <div className="group relative flex items-center justify-between p-4 rounded-xl bg-[var(--surface-muted-bg)] border border-[var(--border-normal)] hover:border-[var(--accent-primary)]/30 transition-all duration-200 cursor-pointer"
         onClick={onToggle}>
        <div className="flex items-start gap-3 flex-1 pr-4">
            {Icon && (
                <div className={`mt-0.5 transition-colors duration-200 ${isChecked ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'}`}>
                    <Icon className="w-5 h-5" />
                </div>
            )}
            <div className="flex-1 min-w-0">
                <label htmlFor={id} className="block text-sm font-semibold text-[var(--text-primary)] cursor-pointer mb-0.5">
                    {label}
                </label>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{description}</p>
            </div>
        </div>
        <button
            id={id}
            onClick={(e) => {
                e.stopPropagation();
                onToggle();
            }}
            className={`relative inline-flex items-center h-7 w-12 rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50 focus:ring-offset-2 focus:ring-offset-[var(--background-primary)] flex-shrink-0 ${
                isChecked
                    ? 'bg-[var(--accent-primary)] shadow-lg shadow-[var(--accent-primary)]/25'
                    : 'bg-[var(--surface-track-bg)] border border-[var(--border-normal)]'
            }`}
            role="switch"
            aria-checked={isChecked}
        >
            <span
                className={`inline-block w-5 h-5 transform bg-white rounded-full transition-all duration-300 ease-in-out shadow-md ${
                    isChecked ? 'translate-x-6' : 'translate-x-1'
                }`}
            />
        </button>
    </div>
);

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  currentSeed,
  onSeedChange,
  showDevTooltip,
  onToggleDevTooltip,
  useLlmForDescriptions,
  onToggleLlmForDescriptions,
  useLlmForCharacter,
  onToggleLlmForCharacter,
  isTestModeEnabled,
  onToggleTestMode,
  isDevBuildingModeOpen,
  onToggleDevBuildingMode,
  playerCharacter,
  mapData,
  currentZone,
  currentYear,
  onLoadGame,
  currentGameState,
  playerLocation,
  contextualTooltipsEnabled,
  onToggleContextualTooltips,
  onResetTooltips,
}) => {
  // Audio settings state
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('gameMuted');
    return saved === 'true' || gameSounds.getIsMuted();
  });
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('gameVolume');
    return saved ? parseFloat(saved) : 0.5;
  });

  // Developer mode state
  const [showDeveloperMode, setShowDeveloperMode] = useState(false);

  // Educational mode state
  const [isEducationalMode, setIsEducationalMode] = useState(() =>
    learningObjectivesService.isEducationalMode()
  );

  // Game mode state
  const [currentGameMode, setCurrentGameMode] = useState(() =>
    localStorage.getItem('currentGameMode') || 'survival'
  );

  // Game mode configurations
  const GAME_MODE_CONFIG = {
    survival: { icon: Shield, color: '#ef4444', label: 'Survival', description: 'Face existential threats and survive against all odds' },
    exploration: { icon: Compass, color: '#3b82f6', label: 'Exploration', description: 'Discover new lands and uncover hidden secrets' },
    commerce: { icon: Coins, color: '#eab308', label: 'Commerce', description: 'Build wealth through trade and business ventures' },
    scholarship: { icon: BookOpen, color: '#a855f7', label: 'Scholarship', description: 'Pursue knowledge and intellectual achievement' },
    leadership: { icon: Crown, color: '#f59e0b', label: 'Leadership', description: 'Lead your people through challenges and crises' },
    livelihood: { icon: Home, color: '#22c55e', label: 'Livelihood', description: 'Make an honest living and support your community' },
    diplomacy: { icon: Users, color: '#06b6d4', label: 'Diplomacy', description: 'Navigate complex political relationships' },
    legal: { icon: Scale, color: '#6366f1', label: 'Legal', description: 'Uphold justice and navigate legal systems' },
  } as const;

  // User-facing modals
  const [showSavedGamesModal, setShowSavedGamesModal] = useState(false);
  const [showPrimarySourcesModal, setShowPrimarySourcesModal] = useState(false);
  const [showCityTimeline, setShowCityTimeline] = useState(false);
  const [showTradeNetworkGlobe, setShowTradeNetworkGlobe] = useState(false);
  const [showCityMap, setShowCityMap] = useState(false);
  const [showHexWorldMap, setShowHexWorldMap] = useState(false);
  const [showHexWorldGlobe, setShowHexWorldGlobe] = useState(false);

  // Share URL state
  const [shareableURL, setShareableURL] = useState('');
  const [copiedShareURL, setCopiedShareURL] = useState(false);

  // Developer testing panels
  const [showPerformanceDiagnostics, setShowPerformanceDiagnostics] = useState(false);
  const [showLLMTracker, setShowLLMTracker] = useState(false);
  const [showDiseaseTestPanel, setShowDiseaseTestPanel] = useState(false);
  const [showSpecialMapTest, setShowSpecialMapTest] = useState(false);
  const [showInteriorMapTest, setShowInteriorMapTest] = useState(false);
  const [showQuestTestPanel, setShowQuestTestPanel] = useState(false);
  const [showNpcTestPanel, setShowNpcTestPanel] = useState(false);
  const [showWorkOfferTestPanel, setShowWorkOfferTestPanel] = useState(false);
  const [showFishingTestPanel, setShowFishingTestPanel] = useState(false);
  const [showAlternativeFishing, setShowAlternativeFishing] = useState(false);
  const [showFishingSystemTest, setShowFishingSystemTest] = useState(false);
  const [showSimpleFishing, setShowSimpleFishing] = useState(false);
  const [showSoundTestPanel, setShowSoundTestPanel] = useState(false);
  const [showIconTestPanel, setShowIconTestPanel] = useState(false);
  const [showPrimarySourcesDevPanel, setShowPrimarySourcesDevPanel] = useState(false);
  const [showMiningTestPanel, setShowMiningTestPanel] = useState(false);
  const [showRailroadTestPanel, setShowRailroadTestPanel] = useState(false);
  const [showTestSuite, setShowTestSuite] = useState(false);
  const [showFactoryBannerTest, setShowFactoryBannerTest] = useState(false);
  const [testInventory, setTestInventory] = useState<any[]>([]);
  const [apiStats, setApiStats] = useState(eventService.getAPIUsageStats());
  const [llmHistory, setLLMHistory] = useState(eventService.getLLMHistory());

  // Dialect Continuum state
  const [dialectContinuumEnabled, setDialectContinuumEnabled] = useState(dialectContinuumService.isEnabled());

  const diseaseService = DiseaseService.getInstance();

  // Keyboard navigation: Escape to close
  useModalKeyboard({
    onClose,
    disabled: !isOpen
  });

  // Theme state is managed locally - no subscription needed
  // The visual theme change happens instantly via CSS variables

  // Initialize audio settings from localStorage
  useEffect(() => {
    const savedMuted = localStorage.getItem('gameMuted');
    const savedVolume = localStorage.getItem('gameVolume');

    if (savedMuted !== null) {
      const mutedValue = savedMuted === 'true';
      setIsMuted(mutedValue);
      gameSounds.setMuted(mutedValue);
    }

    if (savedVolume !== null) {
      const volumeValue = parseFloat(savedVolume);
      setVolume(volumeValue);
      gameSounds.setMasterVolume(volumeValue);
    }
  }, []);

  // Update API stats when panel is opened
  useEffect(() => {
    if (isOpen) {
      setApiStats(eventService.getAPIUsageStats());
      setLLMHistory(eventService.getLLMHistory());
      // Load dialect continuum state
      dialectContinuumService.loadState();
      setDialectContinuumEnabled(dialectContinuumService.isEnabled());
    }
  }, [isOpen]);

  const handleSeedInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSeedValue = parseInt(event.target.value, 10);
    if (!isNaN(newSeedValue) && newSeedValue >=0) {
      onSeedChange(newSeedValue);
    } else if (event.target.value === "") {
      onSeedChange(0);
    }
  };

  const handleNewRandomInitialSeed = () => {
    onSeedChange(Math.floor(Math.random() * 1000000));
  };

  const handleGameModeChange = (mode: string) => {
    setCurrentGameMode(mode);
    localStorage.setItem('currentGameMode', mode);
    // Show notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-[var(--surface-card-bg)] border border-[var(--accent-primary)] rounded-lg p-4 shadow-2xl animate-fade-in';
    notification.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="text-2xl">${GAME_MODE_CONFIG[mode as keyof typeof GAME_MODE_CONFIG]?.icon ? '🎮' : '✓'}</span>
        <div>
          <h3 class="text-sm font-bold text-[var(--text-primary)]">Game Mode Changed</h3>
          <p class="text-xs text-[var(--text-secondary)]">Now playing: ${GAME_MODE_CONFIG[mode as keyof typeof GAME_MODE_CONFIG]?.label}</p>
        </div>
      </div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  };

  const handleEducationalModeToggle = () => {
    const newState = !isEducationalMode;
    setIsEducationalMode(newState);

    if (newState) {
      learningObjectivesService.initializeSession();
      localStorage.setItem('educationalMode', 'true');
    } else {
      learningObjectivesService.clearSession();
      localStorage.removeItem('educationalMode');
    }
  };

  const handleMuteToggle = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    gameSounds.setMuted(newMutedState);
    localStorage.setItem('gameMuted', String(newMutedState));
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    gameSounds.setMasterVolume(newVolume);
    localStorage.setItem('gameVolume', String(newVolume));
  };

  // Disease testing functions
  const getAvailableDiseases = () => {
    if (!mapData) return [];
    
    // Use currentYear prop if available, otherwise try to parse from timeSlice
    const year = currentYear || parseInt(mapData.timeSlice || '1500');
    
    // Map to disease era format (different from HistoricalEra enum)
    const era = year < -3000 ? 'PREHISTORIC' :
                year < 500 ? 'ANCIENT' :
                year < 1400 ? 'MEDIEVAL' :
                year < 1800 ? 'EARLY_MODERN' :
                year < 1900 ? 'INDUSTRIAL' : 'MODERN' as any;
    
    // Map geographic zone to cultural zone
    const mapZoneToCulture = (zone: string): CulturalZone => {
      const zoneMapping: Record<string, CulturalZone> = {
        'Europe': 'EUROPEAN',
        'North America': 'NORTH_AMERICAN_COLONIAL', // Default to colonial for now
        'East Asia': 'EAST_ASIAN',
        'South Asia': 'SOUTH_ASIAN',
        'MENA': 'MENA',
        'Sub Saharan Africa': 'SUB_SAHARAN_AFRICAN', // Note: no hyphen in source
        'South America': 'SOUTH_AMERICAN',
        'Oceania': 'OCEANIC'
      };
      // Handle North America special case based on year
      if (zone === 'North America' && year < 1492) {
        return 'NORTH_AMERICAN_PRE_COLUMBIAN';
      }
      return zoneMapping[zone] || 'EUROPEAN';
    };
    
    const region = currentZone ? mapZoneToCulture(currentZone) : 'EUROPEAN' as CulturalZone;
    
    const availableDiseases = DISEASE_DATABASE.diseases.filter(disease => {
      // Check era availability
      if (!disease.availableEras.includes(era)) return false;
      // Check region availability  
      if (!disease.availableRegions.includes(region)) return false;
      // Check year constraints
      if (disease.startYear && year < disease.startYear) return false;
      if (disease.endYear && year > disease.endYear) return false;
      return true;
    });
    
    // Sort to show epidemic diseases first during epidemic years
    const sortedDiseases = [...availableDiseases].sort((a, b) => {
      // Check if disease A is epidemic in this year
      const aEpidemic = DISEASE_PREVALENCE.some(p => 
        p.diseaseId === a.id && 
        p.era === era && 
        p.region === region && 
        p.epidemicYears?.includes(year)
      );
      
      // Check if disease B is epidemic in this year
      const bEpidemic = DISEASE_PREVALENCE.some(p => 
        p.diseaseId === b.id && 
        p.era === era && 
        p.region === region && 
        p.epidemicYears?.includes(year)
      );
      
      // Epidemic diseases come first
      if (aEpidemic && !bEpidemic) return -1;
      if (!aEpidemic && bEpidemic) return 1;
      
      // Then sort by severity (critical > severe > moderate > mild)
      const severityOrder = { critical: 0, severe: 1, moderate: 2, mild: 3 };
      return (severityOrder[a.severity] || 4) - (severityOrder[b.severity] || 4);
    });
    
    return sortedDiseases;
  };

  const contractDisease = (diseaseId: string) => {
    if (!playerCharacter || !mapData) return;
    
    const disease = DISEASE_DATABASE.diseases.find(d => d.id === diseaseId);
    if (!disease) return;
    
    const currentYear = parseInt(mapData.timeSlice || '1500');
    
    // Initialize diseaseHealth if it doesn't exist
    if (!playerCharacter.diseaseHealth) {
      playerCharacter.diseaseHealth = {
        currentDiseases: [],
        immunities: [],
        exposureHistory: [],
        overallHealthStatus: 'healthy',
        lastHealthUpdate: { year: currentYear, month: 1, day: 1 }
      };
    }
    
    // Check if already has this disease
    const hasDisease = playerCharacter.diseaseHealth.currentDiseases.some(d => d.disease.id === diseaseId);
    if (hasDisease) return;
    
    // Add disease
    const activeDisease = {
      disease,
      contractedDate: Date.now(),
      stage: 'symptomatic' as const,
      daysRemaining: disease.durationDays,
      severity: 0.5
    };
    
    playerCharacter.diseaseHealth.currentDiseases.push(activeDisease);
    playerCharacter.diseaseHealth.overallHealthStatus = 'sick';
    
    // Force re-render
    setPlayerCharacter({ ...playerCharacter });
    
    // Show disease modal notification
    // Create a temporary notification element
    const notification = document.createElement('div');
    notification.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-red-900/95 border-2 border-red-500 rounded-lg p-4 shadow-2xl animate-pulse';
    notification.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="text-2xl">⚠️</span>
        <div>
          <h3 class="text-lg font-bold text-red-200">Disease Contracted!</h3>
          <p class="text-sm text-red-100">You have contracted ${disease.name}</p>
          <p class="text-xs text-red-300 mt-1">${disease.description || 'Seek treatment immediately!'}</p>
        </div>
      </div>
    `;
    document.body.appendChild(notification);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
      notification.remove();
    }, 5000);
    
    console.log(`Contracted ${disease.name}`);
  };

  const cureAllDiseases = () => {
    if (!playerCharacter?.diseaseHealth) return;
    
    playerCharacter.diseaseHealth.currentDiseases = [];
    playerCharacter.diseaseHealth.overallHealthStatus = 'healthy';
    
    // Force re-render
    setPlayerCharacter({ ...playerCharacter });
    
    console.log('All diseases cured');
  };

  const clearAllImmunities = () => {
    if (!playerCharacter?.health) return;
    
    playerCharacter.health.immunities = [];
    console.log('All immunities cleared');
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      ></div>
      <div
        data-surface="settings-panel"
        className={`surface-drawer fixed top-0 right-0 h-full w-full max-w-sm z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-panel-title"
        style={{ borderLeftWidth: '1px' }}
      >
        {/* Modern Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border-normal)]">
          <div>
            <h2 id="settings-panel-title" className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Settings</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">Configure your experience</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-muted-bg)] rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50"
            aria-label="Close settings panel"
            title="Close settings (Esc)"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="h-full px-6 py-5 overflow-y-auto pb-24 scrollbar-thin space-y-6">
          {/* Audio Controls */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Volume2 className="w-5 h-5 text-[var(--accent-primary)]" />
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Audio</h3>
            </div>

            {/* Mute Toggle */}
            <div className="group relative flex items-center justify-between p-4 rounded-xl bg-[var(--surface-muted-bg)] border border-[var(--border-normal)] hover:border-[var(--accent-primary)]/30 transition-all duration-200 cursor-pointer"
                 onClick={handleMuteToggle}>
              <div className="flex items-start gap-3 flex-1 pr-4">
                <div className={`mt-0.5 transition-colors duration-200 ${!isMuted ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}>
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-sm font-semibold text-[var(--text-primary)] cursor-pointer mb-0.5">
                    {isMuted ? 'Sound Muted' : 'Sound Enabled'}
                  </label>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">Control all game audio</p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMuteToggle();
                }}
                className={`relative inline-flex items-center h-7 w-12 rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50 focus:ring-offset-2 focus:ring-offset-[var(--background-primary)] flex-shrink-0 ${
                  !isMuted
                    ? 'bg-[var(--color-success)] shadow-lg shadow-[var(--color-success)]/25'
                    : 'bg-[var(--surface-track-bg)] border border-[var(--border-normal)]'
                }`}
                role="switch"
                aria-checked={!isMuted}
              >
                <span className={`inline-block w-5 h-5 transform bg-white rounded-full transition-all duration-300 ease-in-out shadow-md ${!isMuted ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Volume Slider */}
            <div className="p-5 rounded-xl bg-[var(--surface-muted-bg)] border border-[var(--border-normal)]">
              <div className="flex items-center justify-between mb-3">
                <label htmlFor="volumeSlider" className="text-sm font-semibold text-[var(--text-primary)]">
                  Master Volume
                </label>
                <span className="text-sm font-bold text-[var(--accent-primary)] tabular-nums">
                  {Math.round(volume * 100)}%
                </span>
              </div>
              <input
                id="volumeSlider"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                disabled={isMuted}
                className={`w-full h-2.5 rounded-full appearance-none cursor-pointer slider-thumb ${isMuted ? 'opacity-40 cursor-not-allowed' : ''}`}
                style={{
                  background: isMuted
                    ? 'var(--surface-track-bg)'
                    : `linear-gradient(to right, var(--accent-primary) 0%, var(--accent-primary) ${volume * 100}%, var(--surface-track-bg) ${volume * 100}%, var(--surface-track-bg) 100%)`
                }}
              />
            </div>
          </section>
          {/* Educational Mode */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-5 h-5 text-[var(--accent-primary)]" />
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Educational Mode</h3>
            </div>

            <SettingsToggle
              id="educationalModeToggle"
              label="Educational Mode"
              description="Enhanced historical analysis, learning objectives, and educational features for students and educators."
              isChecked={isEducationalMode}
              onToggle={handleEducationalModeToggle}
              icon={BookOpen}
            />
          </section>

          {/* Save/Load Game */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Save className="w-5 h-5 text-[var(--accent-primary)]" />
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Game Progress</h3>
            </div>
            <button
              onClick={() => setShowSavedGamesModal(true)}
              className="w-full px-5 py-3.5 text-sm font-bold text-white transition-all duration-200 bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl hover:from-emerald-700 hover:to-green-700 hover:shadow-lg hover:shadow-emerald-500/25 flex items-center justify-center gap-2.5 active:scale-[0.98]"
            >
              <Save className="w-5 h-5" />
              <span>Manage Saved Games</span>
            </button>

            {/* Share URL Section */}
            <div className="p-4 rounded-xl bg-[var(--surface-muted-bg)] border border-[var(--border-normal)]">
              <button
                onClick={() => {
                  if (!shareableURL && playerCharacter && currentYear && currentZone) {
                    // Generate shareable URL
                    const gameSeed = SeedManager.getInstance().getSeed();
                    const gameMode = localStorage.getItem('currentGameMode') || 'survival';

                    let finalZone = currentZone;
                    let finalRegion = '';

                    if (playerLocation) {
                      const detected = findZoneForMapArea(playerLocation);
                      if (detected) {
                        finalZone = detected.zone;
                        finalRegion = detected.region;
                      }
                    }

                    const shareableState = {
                      year: currentYear,
                      month: 1,
                      day: 1,
                      mapArea: playerLocation || 'Unknown',
                      zone: finalZone,
                      region: finalRegion,
                      gameMode: gameMode,
                      character: {
                        name: playerCharacter.name,
                        profession: playerCharacter.occupation || playerCharacter.profession || 'traveler',
                        gender: (playerCharacter.gender?.toLowerCase() as 'male' | 'female') || 'male',
                        age: playerCharacter.age || 25,
                        socialClass: playerCharacter.class || 'commoner',
                        health: playerCharacter.diseaseHealth?.overallHealthStatus || 'healthy'
                      },
                      mapSeed: gameSeed,
                      scenarioType: 'procedural' as const,
                      version: '2.0'
                    };

                    const url = shareableStateService.generateShareableURL(shareableState);
                    setShareableURL(url);
                  } else {
                    setShareableURL('');
                  }
                }}
                className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-card-bg)] hover:bg-[var(--surface-elevated-bg)] border border-[var(--border-normal)] text-[var(--text-primary)] font-medium text-sm transition-all flex items-center justify-center gap-2"
              >
                <Link className="w-4 h-4" />
                <span>{shareableURL ? 'Hide Share Link' : 'Get Shareable Link'}</span>
              </button>

              {shareableURL && (
                <div className="mt-4 space-y-3 animate-fade-in">
                  <label className="text-xs font-semibold text-[var(--text-primary)] block">
                    Share this URL:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={shareableURL}
                      readOnly
                      className="flex-1 px-3 py-2.5 bg-[var(--background-secondary)] text-[var(--text-primary)] text-xs rounded-lg border border-[var(--border-normal)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50"
                      onClick={(e) => e.currentTarget.select()}
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(shareableURL);
                        setCopiedShareURL(true);
                        setTimeout(() => setCopiedShareURL(false), 2000);
                      }}
                      className={`px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 text-xs font-bold whitespace-nowrap ${
                        copiedShareURL
                          ? 'bg-[var(--color-success)] text-white shadow-lg'
                          : 'bg-[var(--surface-card-bg)] hover:bg-[var(--surface-elevated-bg)] border border-[var(--border-normal)] text-[var(--text-primary)]'
                      }`}
                    >
                      {copiedShareURL ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    Preserves character, location, date, game mode, and map seed.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Primary Sources Library */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-5 h-5 text-[var(--accent-primary)]" />
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Educational Resources</h3>
            </div>

            <button
              onClick={() => setShowPrimarySourcesModal(true)}
              className="w-full px-5 py-3.5 text-sm font-bold text-white transition-all duration-200 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl hover:from-purple-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-purple-500/25 flex items-center justify-center gap-2.5 active:scale-[0.98]"
            >
              <ScrollText className="w-5 h-5" />
              <span>Primary Sources Library</span>
            </button>

            {/* Secondary Resources - Grid */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowHexWorldGlobe(true)}
                className="px-4 py-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all hover:shadow-md flex flex-col items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Activity className="w-5 h-5" />
                <span className="text-center leading-tight">3D Globe</span>
              </button>

              <button
                onClick={() => setShowCityMap(true)}
                className="px-4 py-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all hover:shadow-md flex flex-col items-center justify-center gap-2 active:scale-[0.98]"
              >
                <MapIcon className="w-5 h-5" />
                <span className="text-center leading-tight">City Map</span>
              </button>

              <button
                onClick={() => setShowHexWorldMap(true)}
                className="px-4 py-3 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-all hover:shadow-md flex flex-col items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Hexagon className="w-5 h-5" />
                <span className="text-center leading-tight">Hex Map</span>
              </button>

              <button
                onClick={() => setShowTradeNetworkGlobe(true)}
                className="px-4 py-3 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl transition-all hover:shadow-md flex flex-col items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Activity className="w-5 h-5" />
                <span className="text-center leading-tight">City Globe</span>
              </button>
            </div>
          </section>

          {/* Features */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-5 h-5 text-[var(--accent-primary)]" />
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Features</h3>
            </div>
            <div className="space-y-3">
              <SettingsToggle
                id="llmDescToggle"
                label="Enhanced Descriptions"
                description="AI-powered location descriptions and item details."
                isChecked={useLlmForDescriptions}
                onToggle={onToggleLlmForDescriptions}
                icon={Sparkles}
              />
              <SettingsToggle
                id="llmCharToggle"
                label="Dynamic Characters"
                description="AI-generated NPC names, professions, and backstories."
                isChecked={useLlmForCharacter}
                onToggle={onToggleLlmForCharacter}
                icon={Users}
              />
              <SettingsToggle
                id="dialectContinuumToggle"
                label="Dialect Continuum"
                description="NPCs use more foreign language as you travel further from home."
                isChecked={dialectContinuumEnabled}
                onToggle={() => {
                  const newState = !dialectContinuumEnabled;
                  setDialectContinuumEnabled(newState);
                  dialectContinuumService.setEnabled(newState);
                  if (newState && mapData?.localArea) {
                    dialectContinuumService.initialize(mapData.localArea, { x: 0, y: 0 });
                  }
                  dialectContinuumService.saveState();
                }}
                icon={Globe}
              />
              <SettingsToggle
                id="contextualTooltipsToggle"
                label="Contextual Tooltips"
                description="Show helpful tooltips when you first encounter UI elements."
                isChecked={contextualTooltipsEnabled}
                onToggle={() => onToggleContextualTooltips(!contextualTooltipsEnabled)}
                icon={Info}
              />
              {contextualTooltipsEnabled && (
                <div className="ml-12">
                  <button
                    onClick={onResetTooltips}
                    className="text-xs font-medium text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 underline transition-colors"
                  >
                    Reset all tooltips
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* World Settings */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="w-5 h-5 text-[var(--accent-primary)]" />
              <h3 className="text-lg font-bold text-[var(--text-primary)]">World Settings</h3>
            </div>

            <div className="p-5 rounded-xl bg-[var(--surface-muted-bg)] border border-[var(--border-normal)] space-y-4">
              <div>
                <label htmlFor="seedInputPanelAdvanced" className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                  World Seed
                </label>
                <input
                  type="number"
                  id="seedInputPanelAdvanced"
                  value={currentSeed}
                  onChange={handleSeedInputChange}
                  className="w-full px-4 py-2.5 bg-[var(--background-secondary)] border border-[var(--border-normal)] rounded-lg text-[var(--text-primary)] text-center font-mono focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:outline-none transition-all"
                />
                <p className="text-xs text-[var(--text-secondary)] mt-2">Unique identifier for this world's geography.</p>
              </div>

              <button
                onClick={handleNewRandomInitialSeed}
                className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-card-bg)] hover:bg-[var(--surface-elevated-bg)] border border-[var(--border-normal)] text-[var(--text-primary)] font-semibold text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Shuffle className="w-4 h-4" />
                Generate New World
              </button>
            </div>
          </section>

          {/* Developer Mode */}
          <section className="space-y-4">
            <button
              onClick={() => setShowDeveloperMode(!showDeveloperMode)}
              className="w-full p-4 bg-gradient-to-br from-[var(--color-error)]/10 to-[var(--color-error)]/5 rounded-xl border-2 border-[var(--color-error)]/30 hover:border-[var(--color-error)]/50 transition-all duration-200 flex items-center justify-between group active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--color-error)]/10 text-[var(--color-error)] group-hover:bg-[var(--color-error)]/20 transition-colors">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <span className="text-base font-bold text-[var(--color-error)]">Developer Mode</span>
              </div>
              <div className="text-[var(--color-error)]">
                {showDeveloperMode ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </button>

            {showDeveloperMode && (
              <div className="mt-4 space-y-4 p-4 bg-[var(--color-error)]/5 rounded-lg border border-[var(--color-error)]/20">
                {/* Display Options */}
                <div>
                  <h4 className="mb-3 text-xs font-semibold tracking-wider text-[var(--color-error)] uppercase">Display & Debug</h4>
                  <div className="space-y-3">
                    <SettingsToggle
                      id="devTooltipToggle"
                      label="Dev Tooltip on Hover"
                      description="Show tile information in map corner."
                      isChecked={showDevTooltip}
                      onToggle={onToggleDevTooltip}
                    />
                    <SettingsToggle
                      id="testModeToggle"
                      label="Test Mode (Performance Debug)"
                      description="Performance monitoring overlay for debugging."
                      isChecked={isTestModeEnabled}
                      onToggle={onToggleTestMode}
                    />
                    <SettingsToggle
                      id="devBuildingModeToggle"
                      label="Dev Building Mode"
                      description="Grid view of all map symbols and biomes."
                      isChecked={isDevBuildingModeOpen}
                      onToggle={onToggleDevBuildingMode}
                    />
                  </div>
                </div>

                {/* API Tracking */}
                <div>
                  <h4 className="mb-3 text-xs font-semibold tracking-wider text-[var(--color-error)] uppercase">API Monitoring</h4>
                  <button
                    onClick={() => {
                      setShowLLMTracker(!showLLMTracker);
                      setApiStats(eventService.getAPIUsageStats());
                      setLLMHistory(eventService.getLLMHistory());
                    }}
                    className="w-full px-4 py-3 text-sm font-semibold text-white transition-all duration-150 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-md hover:from-indigo-700 hover:to-purple-700 flex items-center justify-center gap-2"
                  >
                    <Cpu className="w-4 h-4" />
                    <span>LLM API Usage ({apiStats.sessionCalls} calls)</span>
                  </button>

                  {showLLMTracker && (
                    <div className="mt-3 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="surface-muted rounded-lg p-2">
                          <div className="text-xs text-text-muted mb-1">Session</div>
                          <div className="text-lg font-semibold text-text-primary">{apiStats.sessionCalls}</div>
                        </div>
                        <div className="surface-muted rounded-lg p-2">
                          <div className="text-xs text-text-muted mb-1">Total</div>
                          <div className="text-lg font-semibold text-text-primary">{apiStats.totalCalls}</div>
                        </div>
                      </div>

                      {apiStats.costEstimate !== undefined && (
                        <div className="bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 rounded-lg p-2">
                          <div className="text-xs text-[var(--color-success)] mb-1">Estimated Cost</div>
                          <div className="text-lg font-semibold text-[var(--color-success)]">
                            ${(apiStats.costEstimate / 100).toFixed(2)}
                          </div>
                        </div>
                      )}

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
                          className="flex-1 px-3 py-2 bg-[var(--color-success)] hover:bg-[var(--color-success)]/80 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          Download
                        </button>
                        <button
                          onClick={() => {
                            eventService.resetSessionCalls();
                            setApiStats(eventService.getAPIUsageStats());
                          }}
                          className="flex-1 px-3 py-2 surface-muted hover:bg-surface-track text-text-primary text-xs font-medium rounded-lg transition-colors"
                        >
                          Reset Session
                        </button>
                      </div>

                      {llmHistory.length > 0 && (
                        <div className="max-h-40 overflow-y-auto surface-muted rounded p-2">
                          <div className="text-xs text-text-muted mb-2 flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            Last {Math.min(llmHistory.length, 10)} API calls:
                          </div>
                          <div className="space-y-2">
                            {llmHistory.slice(-10).reverse().map((entry, index) => (
                              <div key={index} className="bg-background-secondary rounded p-2">
                                <div className="text-xs text-text-muted mb-1">
                                  {new Date(entry.timestamp).toLocaleString()}
                                </div>
                                <div className="text-xs text-text-secondary truncate">
                                  Input: {entry.input.substring(0, 50)}...
                                </div>
                                <div className="text-xs text-text-secondary truncate">
                                  Output: {entry.output.substring(0, 50)}...
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Testing Panels */}
                <div>
                  <h4 className="mb-3 text-xs font-semibold tracking-wider text-[var(--color-error)] uppercase">Testing Panels</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setShowNpcTestPanel(true)}
                      className="px-3 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors flex items-center justify-center gap-1"
                    >
                      <Users className="w-3 h-3" />
                      NPCs
                    </button>
                    <button
                      onClick={() => setShowQuestTestPanel(true)}
                      className="px-3 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-md transition-colors flex items-center justify-center gap-1"
                    >
                      <ScrollText className="w-3 h-3" />
                      Quests
                    </button>
                    <button
                      onClick={() => setShowWorkOfferTestPanel(true)}
                      className="px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center justify-center gap-1"
                    >
                      <Briefcase className="w-3 h-3" />
                      Work Offers
                    </button>
                    <button
                      onClick={() => setShowSpecialMapTest(true)}
                      className="px-3 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-700 rounded-md transition-colors flex items-center justify-center gap-1"
                    >
                      <MapIcon className="w-3 h-3" />
                      Maps
                    </button>
                    <button
                      onClick={() => setShowFishingTestPanel(true)}
                      className="px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                    >
                      🎣 Fishing
                    </button>
                    <button
                      onClick={() => setShowSoundTestPanel(true)}
                      className="px-3 py-2 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors flex items-center justify-center gap-1"
                    >
                      <FlaskConical className="w-3 h-3" />
                      Sound
                    </button>
                    <button
                      onClick={() => setShowPrimarySourcesDevPanel(true)}
                      className="px-3 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-md transition-colors flex items-center justify-center gap-1"
                    >
                      <Database className="w-3 h-3" />
                      Sources
                    </button>
                    <button
                      onClick={() => setShowMiningTestPanel(true)}
                      className="px-3 py-2 text-xs font-semibold text-white bg-yellow-600 hover:bg-yellow-700 rounded-md transition-colors"
                    >
                      ⛏️ Mining
                    </button>
                    <button
                      onClick={() => setShowRailroadTestPanel(true)}
                      className="px-3 py-2 text-xs font-semibold text-white bg-gray-600 hover:bg-gray-700 rounded-md transition-colors flex items-center space-x-1"
                    >
                      <span>🚂</span>
                      <span>Railroads</span>
                    </button>
                    <button
                      onClick={() => setShowFactoryBannerTest(true)}
                      className="px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
                    >
                      🏭 Factory Banners
                    </button>
                  </div>
                </div>

                {/* Performance Testing */}
                <div>
                  <h4 className="mb-3 text-xs font-semibold tracking-wider text-[var(--color-error)] uppercase">Performance & Disease Testing</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => setShowTestSuite(true)}
                      className="px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-md transition-colors flex items-center justify-center gap-1"
                    >
                      <Activity className="w-3 h-3" />
                      Production Test Suite
                    </button>
                    <button
                      onClick={() => setShowPerformanceDiagnostics(true)}
                      className="px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-md transition-colors"
                    >
                      🔬 Performance Diagnostics
                    </button>
                    <button
                      onClick={() => setShowDiseaseTestPanel(!showDiseaseTestPanel)}
                      className="px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 rounded-md transition-colors flex items-center justify-center gap-1"
                    >
                      <FlaskConical className="w-3 h-3" />
                      Disease Testing
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Disease Test Panel (only show if developer mode is open and disease panel is toggled) */}
        {showDeveloperMode && showDiseaseTestPanel && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-60 flex items-center justify-center p-4">
            <div className="bg-background-card rounded-lg border border-surface-card w-full max-w-md max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b border-surface-muted">
                <h3 className="text-lg font-semibold text-text-primary">Disease Testing</h3>
                <button
                  onClick={() => setShowDiseaseTestPanel(false)}
                  className="text-text-muted hover:text-text-primary transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Current Disease Status */}
                <div className="surface-muted rounded-lg p-3">
                  <div className="text-xs text-text-muted mb-2 flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    Current Health Status:
                  </div>
                  <div className="text-sm text-text-primary">
                    {playerCharacter?.health?.overallHealthStatus || 'healthy'}
                  </div>
                  {playerCharacter?.health?.currentDiseases && playerCharacter.health.currentDiseases.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {playerCharacter.health.currentDiseases.map((activeDisease, index) => (
                        <div key={index} className="text-xs text-[var(--color-error)] flex items-center gap-1">
                          {activeDisease.disease.badgeIcon}
                          {activeDisease.disease.name} ({activeDisease.stage})
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Available Diseases */}
                <div className="surface-muted rounded-lg p-3">
                  <div className="text-xs text-text-muted mb-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Available Diseases:
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {getAvailableDiseases().slice(0, 5).map((disease) => (
                      <div key={disease.id} className="flex items-center justify-between rounded p-2 bg-background-secondary">
                        <div className="flex-1">
                          <div className="text-xs text-text-primary flex items-center gap-1">
                            {disease.badgeIcon} {disease.name}
                          </div>
                          <div className="text-xs text-text-muted">
                            {disease.severity} • {disease.type}
                          </div>
                        </div>
                        <button
                          onClick={() => contractDisease(disease.id)}
                          className="px-2 py-1 bg-[var(--color-error)] hover:bg-[var(--color-error)]/80 text-white text-xs rounded transition-colors"
                          disabled={playerCharacter?.diseaseHealth?.currentDiseases?.some(d => d.disease.id === disease.id)}
                        >
                          {playerCharacter?.diseaseHealth?.currentDiseases?.some(d => d.disease.id === disease.id) ? 'Active' : 'Contract'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Control Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={cureAllDiseases}
                    className="flex-1 px-3 py-2 bg-[var(--color-success)] hover:bg-[var(--color-success)]/80 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    Cure All
                  </button>
                  <button
                    onClick={clearAllImmunities}
                    className="flex-1 px-3 py-2 bg-[var(--color-warning)] hover:bg-[var(--color-warning)]/80 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    Clear Immunities
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

          {/* Game Mode */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-5 h-5 text-[var(--accent-primary)]" />
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Game Mode</h3>
            </div>

            <div className="p-4 rounded-xl bg-[var(--surface-muted-bg)] border border-[var(--border-normal)]">
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">
                Select Your Play Style
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(GAME_MODE_CONFIG).map(([key, config]) => {
                  const Icon = config.icon;
                  const isSelected = currentGameMode === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handleGameModeChange(key)}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                        isSelected
                          ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 shadow-lg'
                          : 'border-[var(--border-normal)] hover:border-[var(--accent-primary)]/50 hover:bg-[var(--surface-elevated-bg)]'
                      }`}
                      style={isSelected ? { boxShadow: `0 4px 12px ${config.color}25` } : {}}
                    >
                      <Icon
                        className="w-6 h-6"
                        style={{ color: isSelected ? config.color : 'var(--text-muted)' }}
                      />
                      <span className={`text-xs font-bold ${isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                        {config.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-3 leading-relaxed">
                {GAME_MODE_CONFIG[currentGameMode as keyof typeof GAME_MODE_CONFIG]?.description}
              </p>
            </div>
          </section>
      </div>

      {/* Modals */}
      {/* Performance Diagnostics Modal */}
      <PerformanceDiagnostics
        isOpen={showPerformanceDiagnostics}
        onClose={() => setShowPerformanceDiagnostics(false)}
      />

      {/* Special Map Test Menu */}
      <SpecialMapTestMenu
        isOpen={showSpecialMapTest}
        onClose={() => setShowSpecialMapTest(false)}
      />

      {/* Interior Map Test Menu */}
      <InteriorMapTestMenu
        isOpen={showInteriorMapTest}
        onClose={() => setShowInteriorMapTest(false)}
      />

      {/* NPC Testing Panel */}
      <NpcTestingPanel
        isOpen={showNpcTestPanel}
        onClose={() => setShowNpcTestPanel(false)}
      />

      {/* Quest Testing Panel */}
      <QuestTestingPanel
        isOpen={showQuestTestPanel}
        onClose={() => setShowQuestTestPanel(false)}
      />

      {/* Work Offer Test Panel */}
      <WorkOfferTestPanel
        isOpen={showWorkOfferTestPanel}
        onClose={() => setShowWorkOfferTestPanel(false)}
        playerCharacter={playerCharacter}
        mapData={mapData}
      />

      {/* Primary Sources Dev Panel */}
      <PrimarySourcesDevPanel
        isOpen={showPrimarySourcesDevPanel}
        onClose={() => setShowPrimarySourcesDevPanel(false)}
      />

      {/* Primary Sources Modal */}
      <PrimarySourcesModal
        isOpen={showPrimarySourcesModal}
        onClose={() => setShowPrimarySourcesModal(false)}
      />

      {/* Fishing Test Panel */}
      <FishingTestPanel
        isOpen={showFishingTestPanel}
        onClose={() => setShowFishingTestPanel(false)}
      />

      {/* Fishing System Test Modal */}
      {showFishingSystemTest && (
        <FishingSystemTest onClose={() => setShowFishingSystemTest(false)} />
      )}

      {/* Simple Fishing Modal */}
      {showSimpleFishing && (
        <div className="fixed inset-0 z-50 bg-black">
          <FishingHutSimple
            culturalZone={'western_europe' as any}
            climate={ClimateType.TEMPERATE}
            season={'spring' as any}
            timeOfDay={'day' as any}
            availableFish={[]}
            historicalEra={HistoricalEra.MEDIEVAL}
            isFreshwater={false}
            onCatch={(fish, weight, length) => {
              console.log('Caught:', fish.name, weight, length);
            }}
            onExit={() => setShowSimpleFishing(false)}
            fishingService={new FishingDataService()}
          />
        </div>
      )}

      {/* Sound Test Panel */}
      <SoundTestPanel
        isOpen={showSoundTestPanel}
        onClose={() => setShowSoundTestPanel(false)}
      />

      {/* Icon Test Panel */}
      <IconTestPanel
        isOpen={showIconTestPanel}
        onClose={() => setShowIconTestPanel(false)}
      />

      {/* Alternative Fishing Modal */}
      {showAlternativeFishing && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background-card rounded-lg border border-surface-card w-full max-w-7xl h-[90vh] relative overflow-hidden">
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={() => setShowAlternativeFishing(false)}
                className="w-8 h-8 rounded-full bg-[var(--color-error)] hover:bg-[var(--color-error)]/80 text-white flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="w-full h-full">
              <FishingGameCanvas
                availableFish={[
                  { id: 'bass', name: 'Bass', description: 'Common freshwater fish', color: '#4A5D23', size: { min: 1, max: 5 }, value: 10, rarity: 'common', speed: 0.5, waterType: 'freshwater' } as FishSpecies,
                  { id: 'trout', name: 'Trout', description: 'Mountain stream fish', color: '#8B7355', size: { min: 0.5, max: 3 }, value: 8, rarity: 'common', speed: 0.8, waterType: 'freshwater' } as FishSpecies,
                  { id: 'salmon', name: 'Salmon', description: 'Migratory fish', color: '#FA8072', size: { min: 2, max: 15 }, value: 25, rarity: 'uncommon', speed: 1.2, waterType: 'freshwater' } as FishSpecies,
                  { id: 'pike', name: 'Pike', description: 'Aggressive predator', color: '#556B2F', size: { min: 3, max: 20 }, value: 40, rarity: 'rare', speed: 1.5, waterType: 'freshwater' } as FishSpecies
                ]}
                culturalZone={'European' as CulturalZone}
                historicalEra={HistoricalEra.MEDIEVAL}
                climate={ClimateType.TEMPERATE}
                season={'spring' as any}
                timeOfDay="Morning"
                isFreshwater={true}
                onCatch={(fish, weight, length) => {
                  console.log(`Caught ${fish.name}: ${weight}kg, ${length}cm`);
                }}
                onExit={() => setShowAlternativeFishing(false)}
                fishingService={new FishingDataService()}
              />
            </div>
          </div>
        </div>
      )}

      {/* Saved Games Modal */}
      {showSavedGamesModal && onLoadGame && (
        <SavedGamesModal
          isOpen={showSavedGamesModal}
          onClose={() => setShowSavedGamesModal(false)}
          onLoadGame={onLoadGame}
          currentGameState={currentGameState}
        />
      )}

      {/* Test Suite Panel */}
      <TestSuitePanel
        isOpen={showTestSuite}
        onClose={() => setShowTestSuite(false)}
        playerCharacter={playerCharacter}
        mapData={mapData}
        currentZone={currentZone}
        currentYear={currentYear}
      />

      {/* Factory Banner Test Panel */}
      <FactoryBannerTest
        isOpen={showFactoryBannerTest}
        onClose={() => setShowFactoryBannerTest(false)}
      />

      {/* Mining Roguelike Test Panel */}
      {showMiningTestPanel && (
        <div className="fixed inset-0 z-[60] bg-black">
          {/* Test Inventory Display */}
          <div className="absolute top-4 right-4 z-70 surface-muted rounded-lg p-3 max-w-xs">
            <h3 className="text-sm font-bold text-text-primary mb-2">Test Inventory ({testInventory.length})</h3>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {testInventory.length === 0 ? (
                <p className="text-xs text-text-muted">No items collected yet</p>
              ) : (
                testInventory.map((item, index) => (
                  <div key={index} className="text-xs text-[var(--color-success)] flex items-center gap-2">
                    <span className="text-[var(--color-warning)]">⚡</span>
                    <span>{item.name} ({item.quantity || 1})</span>
                  </div>
                ))
              )}
            </div>
            {testInventory.length > 0 && (
              <button
                onClick={() => setTestInventory([])}
                className="mt-2 text-xs px-2 py-1 bg-[var(--color-error)] hover:bg-[var(--color-error)]/80 rounded text-white"
              >
                Clear Inventory
              </button>
            )}
          </div>
          <MiningRoguelikeDisplay
            mineData={{
              name: "Test Mine",
              description: "A deep test mine for development",
              oreType: "Iron Ore",
              depth: 30,
              culturalZone: currentZone || "EUROPEAN",
              historicalEra: currentYear ? (
                currentYear < 500 ? "ANTIQUITY" :
                currentYear < 1500 ? "MEDIEVAL" :
                currentYear < 1800 ? "RENAISSANCE_EARLY_MODERN" :
                currentYear < 1950 ? "INDUSTRIAL_ERA" :
                currentYear < 2000 ? "MODERN_ERA" : "FUTURE_ERA"
              ) : "MEDIEVAL"
            }}
            playerCharacter={playerCharacter || {
              id: "test-player",
              name: "Test Miner",
              health: 100,
              maxHealth: 100,
              fatigue: 100,
              maxFatigue: 100,
              inventory: [],
              position: { x: 40, y: 0 },
              dexterity: 10,
              strength: 10
            }}
            onExit={() => setShowMiningTestPanel(false)}
            onHealthChange={(health) => console.log("Health changed to:", health)}
            onInventoryAdd={(item) => {
              console.log("Item added to inventory:", item);
              setTestInventory(prev => [...prev, item]);
            }}
            onFatigueChange={(fatigue) => console.log("Fatigue changed to:", fatigue)}
          />
        </div>
      )}

      {/* Railroad Test Panel */}
      <RailroadTestPanel
        isOpen={showRailroadTestPanel}
        onClose={() => setShowRailroadTestPanel(false)}
      />

      {/* City Timeline Visualization Modal */}
      {showCityTimeline && (
        <CityTimeline
          isOpen={showCityTimeline}
          onClose={() => setShowCityTimeline(false)}
          initialYear={currentYear}
        />
      )}

      {/* Trade Network Globe Visualization Modal */}
      {showTradeNetworkGlobe && (
        <TradeNetworkGlobe
          isOpen={showTradeNetworkGlobe}
          onClose={() => setShowTradeNetworkGlobe(false)}
          initialYear={currentYear}
        />
      )}

      {/* City Map Visualization Modal */}
      {showCityMap && (
        <CityMapGlobe
          isOpen={showCityMap}
          onClose={() => setShowCityMap(false)}
          currentGameYear={currentYear}
          playerLocation={playerLocation}
        />
      )}

      {/* Hex World Map Modal */}
      {showHexWorldMap && (
        <HexWorldMap
          isOpen={showHexWorldMap}
          onClose={() => setShowHexWorldMap(false)}
        />
      )}

      {/* Hex World Globe 3D Modal */}
      {showHexWorldGlobe && (
        <HexWorldGlobe
          isOpen={showHexWorldGlobe}
          onClose={() => setShowHexWorldGlobe(false)}
        />
      )}
    </>
  );
};

export default SettingsPanel;
