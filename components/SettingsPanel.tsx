import React, { useState, useEffect } from 'react';
import PerformanceDiagnostics from './PerformanceDiagnostics';
import { eventService } from '../services/eventService';
import { themeService } from '../services/themeService';
import { Cpu, Download, Activity, X, FlaskConical, Heart, AlertTriangle, MapIcon, ScrollText, Users, Save, Palette, Database, Sun, Moon, ChevronDown, ChevronUp, Info, Settings as SettingsIcon, BookOpen, Gamepad2, Hexagon } from 'lucide-react';
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
import HexWorldGlobe3D from './HexWorldGlobe3D';

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
}

const SettingsToggle: React.FC<{
    id: string;
    label: string;
    description: string;
    isChecked: boolean;
    onToggle: () => void;
}> = ({ id, label, description, isChecked, onToggle }) => (
    <div className="p-3 bg-slate-700/50 rounded-md border border-slate-600/70">
        <div className="flex items-center justify-between">
            <label htmlFor={id} className="text-sm font-medium text-gray-200 cursor-pointer">
                {label}
            </label>
            <button
                id={id}
                onClick={onToggle}
                className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-slate-800 ${isChecked ? 'bg-blue-600' : 'bg-slate-600'}`}
                role="switch"
                aria-checked={isChecked}
            >
                <span className={`${isChecked ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out`} />
            </button>
        </div>
        <p className="mt-1.5 text-xs text-slate-400">{description}</p>
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
}) => {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(themeService.isDarkMode());

  // Developer mode state
  const [showDeveloperMode, setShowDeveloperMode] = useState(false);

  // User-facing modals
  const [showSavedGamesModal, setShowSavedGamesModal] = useState(false);
  const [showPrimarySourcesModal, setShowPrimarySourcesModal] = useState(false);
  const [showCityTimeline, setShowCityTimeline] = useState(false);
  const [showTradeNetworkGlobe, setShowTradeNetworkGlobe] = useState(false);
  const [showCityMap, setShowCityMap] = useState(false);
  const [showHexWorldMap, setShowHexWorldMap] = useState(false);
  const [showHexWorldGlobe3D, setShowHexWorldGlobe3D] = useState(false);

  // Developer testing panels
  const [showPerformanceDiagnostics, setShowPerformanceDiagnostics] = useState(false);
  const [showLLMTracker, setShowLLMTracker] = useState(false);
  const [showDiseaseTestPanel, setShowDiseaseTestPanel] = useState(false);
  const [showSpecialMapTest, setShowSpecialMapTest] = useState(false);
  const [showInteriorMapTest, setShowInteriorMapTest] = useState(false);
  const [showQuestTestPanel, setShowQuestTestPanel] = useState(false);
  const [showNpcTestPanel, setShowNpcTestPanel] = useState(false);
  const [showFishingTestPanel, setShowFishingTestPanel] = useState(false);
  const [showAlternativeFishing, setShowAlternativeFishing] = useState(false);
  const [showFishingSystemTest, setShowFishingSystemTest] = useState(false);
  const [showSimpleFishing, setShowSimpleFishing] = useState(false);
  const [showSoundTestPanel, setShowSoundTestPanel] = useState(false);
  const [showIconTestPanel, setShowIconTestPanel] = useState(false);
  const [showPrimarySourcesDevPanel, setShowPrimarySourcesDevPanel] = useState(false);
  const [showMiningTestPanel, setShowMiningTestPanel] = useState(false);
  const [showTestSuite, setShowTestSuite] = useState(false);
  const [showFactoryBannerTest, setShowFactoryBannerTest] = useState(false);
  const [testInventory, setTestInventory] = useState<any[]>([]);
  const [apiStats, setApiStats] = useState(eventService.getAPIUsageStats());
  const [llmHistory, setLLMHistory] = useState(eventService.getLLMHistory());

  // Dialect Continuum state
  const [dialectContinuumEnabled, setDialectContinuumEnabled] = useState(dialectContinuumService.isEnabled());

  const diseaseService = DiseaseService.getInstance();

  // Subscribe to theme changes
  useEffect(() => {
    const unsubscribe = themeService.subscribe((theme) => {
      setIsDarkMode(theme === 'dark');
    });
    return unsubscribe;
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
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-sidebar-gradient shadow-sidebar-right z-50 transform transition-transform duration-300 ease-in-out border-l border-slate-700/80 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-panel-title"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 id="settings-panel-title" className="text-lg font-semibold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="text-2xl text-slate-400 transition-colors hover:text-white"
            aria-label="Close settings panel"
          >&times;</button>
        </div>

        <div className="h-full p-4 overflow-y-auto pb-20 scrollbar-thin">
          {/* Game Description */}
          <section className="mb-6 p-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg border border-blue-700/50">
            <div className="flex items-center gap-3 mb-2">
              <Info className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Universal History Simulator</h3>
            </div>
            <p className="text-sm text-blue-100 leading-relaxed">
              An educational history simulation game developed at UC Santa Cruz in 2025.
              Explore different historical periods and cultures through immersive gameplay.
            </p>
          </section>

          {/* Theme Toggle */}
          <section className="mb-6">
            <h3 className="mb-3 text-sm font-semibold tracking-wider text-blue-300 uppercase flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Appearance
            </h3>
            <div className="p-3 bg-slate-700/50 rounded-md border border-slate-600/70">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isDarkMode ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-yellow-400" />}
                  <label className="text-sm font-medium text-gray-200">
                    {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                  </label>
                </div>
                <button
                  onClick={() => themeService.toggleTheme()}
                  className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-slate-800 ${isDarkMode ? 'bg-blue-600' : 'bg-slate-600'}`}
                  role="switch"
                  aria-checked={isDarkMode}
                >
                  <span className={`${isDarkMode ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out`} />
                </button>
              </div>
              <p className="mt-1.5 text-xs text-slate-400">Toggle between light and dark theme</p>
            </div>
          </section>

          {/* Save/Load Game */}
          <section className="mb-6">
            <h3 className="mb-3 text-sm font-semibold tracking-wider text-blue-300 uppercase flex items-center gap-2">
              <Save className="w-4 h-4" />
              Game Progress
            </h3>
            <div className="p-3 bg-slate-700/50 rounded-md border border-slate-600/70">
              <button
                onClick={() => setShowSavedGamesModal(true)}
                className="w-full px-4 py-3 text-sm font-semibold text-white transition-all duration-150 bg-gradient-to-r from-green-600 to-emerald-600 rounded-md hover:from-green-700 hover:to-emerald-700 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Manage Saved Games</span>
              </button>
              <p className="mt-2 text-xs text-slate-400">
                Save your current game or load a previously saved game. Up to 10 saves stored locally.
              </p>
            </div>
          </section>

          {/* Primary Sources Library */}
          <section className="mb-6">
            <h3 className="mb-3 text-sm font-semibold tracking-wider text-blue-300 uppercase flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Educational Resources
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-slate-700/50 rounded-md border border-slate-600/70">
                <button
                  onClick={() => setShowPrimarySourcesModal(true)}
                  className="w-full px-4 py-3 text-sm font-semibold text-white transition-all duration-150 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-md hover:from-purple-700 hover:to-indigo-700 flex items-center justify-center gap-2"
                >
                  <ScrollText className="w-4 h-4" />
                  <span>Primary Sources Library</span>
                </button>
              </div>

              <div className="p-3 bg-slate-700/50 rounded-md border border-slate-600/70">
                <button
                  onClick={() => setShowCityMap(true)}
                  className="w-full px-4 py-3 text-sm font-semibold text-white transition-all duration-150 bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-md hover:from-emerald-700 hover:to-cyan-700 flex items-center justify-center gap-2"
                >
                  <MapIcon className="w-4 h-4" />
                  <span>Interactive City Map</span>
                </button>
                <p className="mt-2 text-xs text-slate-400">
                  Not finished yet.
                </p>
              </div>

              <div className="p-3 bg-slate-700/50 rounded-md border border-slate-600/70">
                <button
                  onClick={() => setShowHexWorldMap(true)}
                  className="w-full px-4 py-3 text-sm font-semibold text-white transition-all duration-150 bg-gradient-to-r from-teal-600 to-green-600 rounded-md hover:from-teal-700 hover:to-green-700 flex items-center justify-center gap-2"
                >
                  <Hexagon className="w-4 h-4" />
                  <span>Hexagonal World Map (broken!)</span>
                </button>
                <p className="mt-2 text-xs text-slate-400">
                  Explore world geography with a hexagonal grid showing all game regions and territories.
                </p>
              </div>

              <div className="p-3 bg-slate-700/50 rounded-md border border-slate-600/70">
                <button
                  onClick={() => setShowHexWorldGlobe3D(true)}
                  className="w-full px-4 py-3 text-sm font-semibold text-white transition-all duration-150 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-md hover:from-indigo-700 hover:to-purple-700 flex items-center justify-center gap-2"
                >
                  <Activity className="w-4 h-4" />
                  <span>3D World Geography Globe</span>
                </button>
                <p className="mt-2 text-xs text-slate-400">
                  Interactive 3D globe with regions positioned by real-world coordinates. Drag to rotate, scroll to zoom.
                </p>
              </div>


              <div className="p-3 bg-slate-700/50 rounded-md border border-slate-600/70">
                <button
                  onClick={() => setShowTradeNetworkGlobe(true)}
                  className="w-full px-4 py-3 text-sm font-semibold text-white transition-all duration-150 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-md hover:from-cyan-700 hover:to-blue-700 flex items-center justify-center gap-2"
                >
                  <Activity className="w-4 h-4" />
                  <span>City Globe Attempt #1</span>
                </button>
                <p className="mt-2 text-xs text-slate-400">
                  3D globe visualization of trade networks and city connections throughout history.
                </p>
              </div>
            </div>
          </section>

          {/* AI Features */}
          <section className="mb-6">
            <h3 className="mb-3 text-sm font-semibold tracking-wider text-blue-300 uppercase flex items-center gap-2">
              <SettingsIcon className="w-4 h-4" />
              AI Features
            </h3>
            <div className="space-y-3">
              <SettingsToggle
                id="llmDescToggle"
                label="Enhanced Descriptions"
                description="Uses AI for richer, more immersive location descriptions and item details."
                isChecked={useLlmForDescriptions}
                onToggle={onToggleLlmForDescriptions}
              />
              <SettingsToggle
                id="llmCharToggle"
                label="Dynamic Characters"
                description="Uses AI to generate unique names, professions, and backstories for NPCs."
                isChecked={useLlmForCharacter}
                onToggle={onToggleLlmForCharacter}
              />
              <SettingsToggle
                id="dialectContinuumToggle"
                label="Dialect Continuum"
                description="Gradually introduces foreign languages as you travel. NPCs speak more foreign words the further you get from your starting location."
                isChecked={dialectContinuumEnabled}
                onToggle={() => {
                  const newState = !dialectContinuumEnabled;
                  setDialectContinuumEnabled(newState);
                  dialectContinuumService.setEnabled(newState);
                  if (newState && mapData?.localArea) {
                    // If enabling now and we have a current location, initialize
                    dialectContinuumService.initialize(mapData.localArea, { x: 0, y: 0 });
                  }
                  dialectContinuumService.saveState();
                }}
              />
            </div>
          </section>

          {/* World Settings */}
          <section className="mb-6">
            <h3 className="mb-3 text-sm font-semibold tracking-wider text-blue-300 uppercase flex items-center gap-2">
              <Gamepad2 className="w-4 h-4" />
              World Settings
            </h3>
            <div className="p-3 bg-slate-700/50 rounded-md border border-slate-600/70">
              <div className="flex items-center justify-between mb-3">
                <label htmlFor="seedInputPanelAdvanced" className="text-sm font-medium text-gray-200">World Seed:</label>
                <input
                  type="number"
                  id="seedInputPanelAdvanced"
                  value={currentSeed}
                  onChange={handleSeedInputChange}
                  className="w-36 px-3 py-1.5 bg-slate-800 border border-slate-500 rounded-md text-white text-center text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleNewRandomInitialSeed}
                className="w-full px-4 py-2 text-xs font-semibold text-white transition-colors duration-150 bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Generate New World
              </button>
              <p className="mt-2 text-xs text-slate-400">Creates a new world with different geography and cultures.</p>
            </div>
          </section>

          {/* Developer Mode */}
          <section className="mt-8">
            <button
              onClick={() => setShowDeveloperMode(!showDeveloperMode)}
              className="w-full p-3 bg-gradient-to-r from-red-900/20 to-orange-900/20 rounded-lg border border-red-700/30 hover:border-red-600/50 transition-all duration-200 flex items-center justify-between text-red-300 hover:text-red-200"
            >
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4" />
                <span className="text-sm font-semibold">Developer Mode</span>
              </div>
              {showDeveloperMode ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showDeveloperMode && (
              <div className="mt-4 space-y-4 p-4 bg-red-900/10 rounded-lg border border-red-800/30">
                {/* Display Options */}
                <div>
                  <h4 className="mb-3 text-xs font-semibold tracking-wider text-red-300 uppercase">Display & Debug</h4>
                  <div className="space-y-3">
                    <SettingsToggle
                      id="devTooltipToggle"
                      label="Dev Tooltip on Hover"
                      description="Show a small tooltip with tile information in the corner of the map."
                      isChecked={showDevTooltip}
                      onToggle={onToggleDevTooltip}
                    />
                    <SettingsToggle
                      id="testModeToggle"
                      label="Test Mode (Performance Debug)"
                      description="Enable performance monitoring overlay with feature toggles for debugging Safari rendering issues."
                      isChecked={isTestModeEnabled}
                      onToggle={onToggleTestMode}
                    />
                    <SettingsToggle
                      id="devBuildingModeToggle"
                      label="Dev Building Mode"
                      description="Display a comprehensive grid of all map symbols, biomes, and structures with their code names for reference."
                      isChecked={isDevBuildingModeOpen}
                      onToggle={onToggleDevBuildingMode}
                    />
                  </div>
                </div>

                {/* API Tracking */}
                <div>
                  <h4 className="mb-3 text-xs font-semibold tracking-wider text-red-300 uppercase">API Monitoring</h4>
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
                        <div className="bg-slate-800/50 rounded-lg p-2">
                          <div className="text-xs text-gray-400 mb-1">Session</div>
                          <div className="text-lg font-semibold text-white">{apiStats.sessionCalls}</div>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-2">
                          <div className="text-xs text-gray-400 mb-1">Total</div>
                          <div className="text-lg font-semibold text-white">{apiStats.totalCalls}</div>
                        </div>
                      </div>

                      {apiStats.costEstimate !== undefined && (
                        <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-2">
                          <div className="text-xs text-green-400 mb-1">Estimated Cost</div>
                          <div className="text-lg font-semibold text-green-300">
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
                          className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          Download
                        </button>
                        <button
                          onClick={() => {
                            eventService.resetSessionCalls();
                            setApiStats(eventService.getAPIUsageStats());
                          }}
                          className="flex-1 px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          Reset Session
                        </button>
                      </div>

                      {llmHistory.length > 0 && (
                        <div className="max-h-40 overflow-y-auto bg-slate-800/30 rounded p-2">
                          <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            Last {Math.min(llmHistory.length, 10)} API calls:
                          </div>
                          <div className="space-y-2">
                            {llmHistory.slice(-10).reverse().map((entry, index) => (
                              <div key={index} className="bg-slate-900/50 rounded p-2">
                                <div className="text-xs text-gray-500 mb-1">
                                  {new Date(entry.timestamp).toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-300 truncate">
                                  Input: {entry.input.substring(0, 50)}...
                                </div>
                                <div className="text-xs text-gray-300 truncate">
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
                  <h4 className="mb-3 text-xs font-semibold tracking-wider text-red-300 uppercase">Testing Panels</h4>
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
                      onClick={() => setShowFactoryBannerTest(true)}
                      className="px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
                    >
                      🏭 Factory Banners
                    </button>
                  </div>
                </div>

                {/* Performance Testing */}
                <div>
                  <h4 className="mb-3 text-xs font-semibold tracking-wider text-red-300 uppercase">Performance & Disease Testing</h4>
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
            <div className="bg-slate-900 rounded-lg border border-slate-700 w-full max-w-md max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b border-slate-700">
                <h3 className="text-lg font-semibold text-white">Disease Testing</h3>
                <button
                  onClick={() => setShowDiseaseTestPanel(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Current Disease Status */}
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    Current Health Status:
                  </div>
                  <div className="text-sm text-white">
                    {playerCharacter?.health?.overallHealthStatus || 'healthy'}
                  </div>
                  {playerCharacter?.health?.currentDiseases && playerCharacter.health.currentDiseases.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {playerCharacter.health.currentDiseases.map((activeDisease, index) => (
                        <div key={index} className="text-xs text-red-300 flex items-center gap-1">
                          {activeDisease.disease.badgeIcon}
                          {activeDisease.disease.name} ({activeDisease.stage})
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Available Diseases */}
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Available Diseases:
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {getAvailableDiseases().slice(0, 5).map((disease) => (
                      <div key={disease.id} className="flex items-center justify-between rounded p-2 bg-slate-900/50">
                        <div className="flex-1">
                          <div className="text-xs text-white flex items-center gap-1">
                            {disease.badgeIcon} {disease.name}
                          </div>
                          <div className="text-xs text-gray-400">
                            {disease.severity} • {disease.type}
                          </div>
                        </div>
                        <button
                          onClick={() => contractDisease(disease.id)}
                          className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
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
                    className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    Cure All
                  </button>
                  <button
                    onClick={clearAllImmunities}
                    className="flex-1 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    Clear Immunities
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
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
          <div className="bg-slate-900 rounded-lg border border-slate-700 w-full max-w-7xl h-[90vh] relative overflow-hidden">
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={() => setShowAlternativeFishing(false)}
                className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors"
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
          <div className="absolute top-4 right-4 z-70 bg-slate-800/90 border border-slate-600 rounded-lg p-3 max-w-xs">
            <h3 className="text-sm font-bold text-white mb-2">Test Inventory ({testInventory.length})</h3>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {testInventory.length === 0 ? (
                <p className="text-xs text-gray-400">No items collected yet</p>
              ) : (
                testInventory.map((item, index) => (
                  <div key={index} className="text-xs text-green-300 flex items-center gap-2">
                    <span className="text-yellow-400">⚡</span>
                    <span>{item.name} ({item.quantity || 1})</span>
                  </div>
                ))
              )}
            </div>
            {testInventory.length > 0 && (
              <button
                onClick={() => setTestInventory([])}
                className="mt-2 text-xs px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-white"
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
      {showHexWorldGlobe3D && (
        <HexWorldGlobe3D
          isOpen={showHexWorldGlobe3D}
          onClose={() => setShowHexWorldGlobe3D(false)}
        />
      )}
    </>
  );
};

export default SettingsPanel;