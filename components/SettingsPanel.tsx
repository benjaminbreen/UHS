import React, { useState, useEffect } from 'react';
import PerformanceDiagnostics from './PerformanceDiagnostics';
import { eventService } from '../services/eventService';
import { Cpu, Download, Activity, X, FlaskConical, Heart, AlertTriangle, MapIcon, ScrollText } from 'lucide-react';
import DiseaseService from '../services/diseaseService';
import { DISEASE_DATABASE, DISEASE_PREVALENCE } from '../constants/gameData/diseases';
import { HistoricalEra } from '../types/ambiance';
import { CulturalZone } from '../types/characterData';
import SpecialMapTestMenu from './SpecialMapTestMenu';
import QuestTestingPanel from './QuestTestingPanel';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentSeed: number;
  onSeedChange: (seed: number) => void;
  showDevTooltip: boolean;
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
}) => {
  const [showPerformanceDiagnostics, setShowPerformanceDiagnostics] = useState(false);
  const [showLLMTracker, setShowLLMTracker] = useState(false);
  const [showDiseaseTestPanel, setShowDiseaseTestPanel] = useState(false);
  const [showSpecialMapTest, setShowSpecialMapTest] = useState(false);
  const [showQuestTestPanel, setShowQuestTestPanel] = useState(false);
  const [apiStats, setApiStats] = useState(eventService.getAPIUsageStats());
  const [llmHistory, setLLMHistory] = useState(eventService.getLLMHistory());
  
  const diseaseService = DiseaseService.getInstance();

  // Update API stats when panel is opened
  useEffect(() => {
    if (isOpen) {
      setApiStats(eventService.getAPIUsageStats());
      setLLMHistory(eventService.getLLMHistory());
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
          <section className="mb-6">
            <h3 className="mb-2 text-sm font-semibold tracking-wider text-blue-300 uppercase">World Seed</h3>
            <div className="p-3 bg-slate-700/50 rounded-md border border-slate-600/70">
              <div className="flex items-center justify-between">
                <label htmlFor="seedInputPanelAdvanced" className="text-sm font-medium text-gray-200">Game Seed:</label>
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
                className="w-full px-4 py-2 mt-3 text-xs font-semibold text-white transition-colors duration-150 bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Set New Random Game Seed
              </button>
              <p className="mt-1.5 text-xs text-slate-500">Changing this will start a new world from (0,0).</p>
            </div>
          </section>
          
          <section className="mb-6">
            <h3 className="mb-2 text-sm font-semibold tracking-wider text-blue-300 uppercase">AI Features</h3>
            <div className="space-y-3">
              <SettingsToggle 
                id="llmDescToggle"
                label="LLM Location Descriptions"
                description="Uses Gemini for richer, poetic descriptions of locations and items."
                isChecked={useLlmForDescriptions}
                onToggle={onToggleLlmForDescriptions}
              />
              <SettingsToggle 
                id="llmCharToggle"
                label="LLM Character Generation"
                description="Uses Gemini to generate more unique names, professions, and backstories."
                isChecked={useLlmForCharacter}
                onToggle={onToggleLlmForCharacter}
              />
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold tracking-wider text-blue-300 uppercase">Display Options</h3>
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
          </section>

          <section className="mt-6">
            <h3 className="mb-2 text-sm font-semibold tracking-wider text-blue-300 uppercase">LLM API Tracker</h3>
            <div className="p-3 bg-slate-700/50 rounded-md border border-slate-600/70">
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
              
              <p className="mt-2 text-xs text-slate-400">
                Track LLM API usage, view call history, and download transcripts for analysis.
              </p>
            </div>
          </section>

          <section className="mt-6">
            <h3 className="mb-2 text-sm font-semibold tracking-wider text-blue-300 uppercase">Quest Testing</h3>
            <div className="p-3 bg-slate-700/50 rounded-md border border-slate-600/70">
              <button
                onClick={() => setShowQuestTestPanel(true)}
                className="w-full px-4 py-3 text-sm font-semibold text-white transition-all duration-150 bg-gradient-to-r from-amber-600 to-orange-600 rounded-md hover:from-amber-700 hover:to-orange-700 flex items-center justify-center gap-2"
              >
                <ScrollText className="w-4 h-4" />
                <span>Open Quest Testing Panel</span>
              </button>
              <p className="mt-2 text-xs text-slate-400">
                Test quest generation, manipulate quest states, teleport to objectives, and debug quest issues.
              </p>
            </div>
          </section>

          <section className="mt-6">
            <h3 className="mb-2 text-sm font-semibold tracking-wider text-blue-300 uppercase">Special Map Testing</h3>
            <div className="p-3 bg-slate-700/50 rounded-md border border-slate-600/70">
              <button
                onClick={() => setShowSpecialMapTest(true)}
                className="w-full px-4 py-3 text-sm font-semibold text-white transition-all duration-150 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-md hover:from-purple-700 hover:to-indigo-700 flex items-center justify-center gap-2"
              >
                <MapIcon className="w-4 h-4" />
                <span>Open Special Map Test Suite</span>
              </button>
              <p className="mt-2 text-xs text-slate-400">
                Test all special map archetypes and view all interior symbols used in local maps.
              </p>
            </div>
          </section>

          <section className="mt-6">
            <h3 className="mb-2 text-sm font-semibold tracking-wider text-blue-300 uppercase">Disease Testing</h3>
            <div className="p-3 bg-slate-700/50 rounded-md border border-slate-600/70">
              <button
                onClick={() => setShowDiseaseTestPanel(!showDiseaseTestPanel)}
                className="w-full px-4 py-3 text-sm font-semibold text-white transition-all duration-150 bg-gradient-to-r from-red-600 to-pink-600 rounded-md hover:from-red-700 hover:to-pink-700 flex items-center justify-center gap-2"
              >
                <FlaskConical className="w-4 h-4" />
                <span>Disease Test Panel</span>
              </button>
              
              {showDiseaseTestPanel && (
                <div className="mt-3 space-y-3">
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
                    {playerCharacter?.health?.immunities && playerCharacter.health.immunities.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-gray-400 mb-1">Immunities:</div>
                        <div className="space-y-1">
                          {playerCharacter.health.immunities.map((immunity, index) => (
                            <div key={index} className="text-xs text-green-300">
                              🛡️ {DISEASE_DATABASE.diseases.find(d => d.id === immunity.diseaseId)?.name || immunity.diseaseId}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Available Diseases */}
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Available Diseases for Current Era/Region:
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {getAvailableDiseases().map((disease) => {
                        const year = currentYear || parseInt(mapData.timeSlice || '1500');
                        const era = year < -3000 ? 'PREHISTORIC' :
                                    year < 500 ? 'ANCIENT' :
                                    year < 1400 ? 'MEDIEVAL' :
                                    year < 1800 ? 'EARLY_MODERN' :
                                    year < 1900 ? 'INDUSTRIAL' : 'MODERN' as any;
                        
                        const mapZoneToCulture = (zone: string): CulturalZone => {
                          const zoneMapping: Record<string, CulturalZone> = {
                            'Europe': 'EUROPEAN',
                            'North America': 'NORTH_AMERICAN_COLONIAL',
                            'East Asia': 'EAST_ASIAN',
                            'South Asia': 'SOUTH_ASIAN',
                            'MENA': 'MENA',
                            'Sub Saharan Africa': 'SUB_SAHARAN_AFRICAN',
                            'South America': 'SOUTH_AMERICAN',
                            'Oceania': 'OCEANIC'
                          };
                          if (zone === 'North America' && year < 1492) {
                            return 'NORTH_AMERICAN_PRE_COLUMBIAN';
                          }
                          return zoneMapping[zone] || 'EUROPEAN';
                        };
                        
                        const region = currentZone ? mapZoneToCulture(currentZone) : 'EUROPEAN' as CulturalZone;
                        
                        const isEpidemic = DISEASE_PREVALENCE.some(p => 
                          p.diseaseId === disease.id && 
                          p.era === era && 
                          p.region === region && 
                          p.epidemicYears?.includes(year)
                        );
                        
                        return (
                          <div key={disease.id} className={`flex items-center justify-between rounded p-2 ${
                            isEpidemic ? 'bg-red-900/50 border border-red-600/50' : 'bg-slate-900/50'
                          }`}>
                            <div className="flex-1">
                              <div className="text-xs text-white flex items-center gap-1">
                                {disease.badgeIcon} {disease.name}
                                {isEpidemic && <span className="text-red-400 font-bold">[EPIDEMIC]</span>}
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
                        );
                      })}
                    </div>
                  </div>

                  {/* Control Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={cureAllDiseases}
                      className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      Cure All Diseases
                    </button>
                    <button
                      onClick={clearAllImmunities}
                      className="flex-1 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      Clear Immunities
                    </button>
                  </div>
                </div>
              )}
              
              <p className="mt-2 text-xs text-slate-400">
                Test disease mechanics with historically accurate diseases for your current era and region.
              </p>
            </div>
          </section>

          <section className="mt-6">
            <h3 className="mb-2 text-sm font-semibold tracking-wider text-blue-300 uppercase">Performance Testing</h3>
            <div className="p-3 bg-slate-700/50 rounded-md border border-slate-600/70">
              <button
                onClick={() => setShowPerformanceDiagnostics(true)}
                className="w-full px-4 py-3 text-sm font-semibold text-white transition-all duration-150 bg-gradient-to-r from-purple-600 to-blue-600 rounded-md hover:from-purple-700 hover:to-blue-700 flex items-center justify-center gap-2"
              >
                <span>🔬</span>
                <span>Open Performance Diagnostics</span>
              </button>
              <p className="mt-2 text-xs text-slate-400">
                Analyze FPS, memory usage, DOM complexity, and identify performance bottlenecks. 
                Includes Safari-specific performance tests.
              </p>
            </div>
          </section>
        </div>
      </div>

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
      
      {/* Quest Testing Panel */}
      <QuestTestingPanel
        isOpen={showQuestTestPanel}
        onClose={() => setShowQuestTestPanel(false)}
      />
    </>
  );
};

export default SettingsPanel;