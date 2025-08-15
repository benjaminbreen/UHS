import React, { useState, useEffect } from 'react';
import { Globe, Info, Settings, Shuffle, ChevronDown, Menu, X, Sparkles } from 'lucide-react';
import { useUI } from '../contexts/UIContext';
import { useMap } from '../contexts/MapContext';
import { useGame } from '../contexts/GameContext';
import { MapArchetype, ClimateType, AltitudeSetting, GameDate } from '../types';
import { PrimarySourceSearch } from './PrimarySourceSearch';
import { MAP_ARCHETYPE_DESCRIPTIONS, CLIMATE_TYPE_DESCRIPTIONS, CULTURE_ZONES, GEOGRAPHICAL_DATA } from '../constants/index';
import { getSafariOptimizedClassName } from '../utils/safariUtils';
import { worldWeaverService } from '../services/worldWeaverService';
import ExplanationModal from './ExplanationModal';
import { findZoneForMapArea } from '../utils/mapAreaLookup';
import { normalizeZoneName, normalizeRegionName } from '../utils/worldWeaverHelpers';

const TopNavBar: React.FC = () => {
  const { setIsSettingsModalOpen, setIsAboutModalOpen, setIsWorldMapModalOpen } = useUI();
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
  } = useMap();
  const { gameDate, onMapConfigDateChange, currentZone, onLocationChange } = useGame();

  const [isGeneratorPanelOpen, setIsGeneratorPanelOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [worldWeaverInput, setWorldWeaverInput] = useState('');
  const [worldWeaverFocused, setWorldWeaverFocused] = useState(false);
  const [isProcessingWorldWeaver, setIsProcessingWorldWeaver] = useState(false);
  const [explanationModalData, setExplanationModalData] = useState<{
    isOpen: boolean;
    explanation: string;
    reasoning?: string;
    suggestion?: string;
  }>({
    isOpen: false,
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
    
    console.log('[WorldWeaver] User input:', worldWeaverInput);
    setIsProcessingWorldWeaver(true);
    try {
      const result = await worldWeaverService.interpretPrompt(worldWeaverInput);
      console.log('[WorldWeaver] LLM result:', result);
      
      if (result.success && result.year && result.mapArea) {
        // Set the date first
        console.log('[WorldWeaver] Setting year to:', result.year);
        onMapConfigDateChange({ year: result.year });
        
        // Find the zone and region for this map area
        console.log('[WorldWeaver] Looking for zone containing map area:', result.mapArea);
        const locationInfo = findZoneForMapArea(result.mapArea);
        
        if (locationInfo) {
          console.log('[WorldWeaver] Found location:', locationInfo);
          // Generate a new world at the specific location
          console.log('[WorldWeaver] Calling onStartNewWorldAtLocation with:', locationInfo.zone, result.mapArea);
          onStartNewWorldAtLocation(locationInfo.zone, result.mapArea);
        } else if (result.zone && result.region) {
          // Fallback to zone/region if exact area not found
          console.warn(`[WorldWeaver] Map area "${result.mapArea}" not found, attempting zone/region fallback`);
          
          // Normalize zone and region names
          const normalizedZone = normalizeZoneName(result.zone);
          if (!normalizedZone) {
            console.error(`[WorldWeaver] Could not normalize zone name: ${result.zone}`);
            console.log('[WorldWeaver] Falling back to random generation');
            onStartNewWorldWithCurrentSettings();
            setWorldWeaverInput('');
            setIsProcessingWorldWeaver(false);
            return;
          }
          
          const normalizedRegion = normalizeRegionName(normalizedZone, result.region);
          if (!normalizedRegion) {
            console.warn(`[WorldWeaver] Could not normalize region name: ${result.region}, using zone-wide random`);
            // Just use the zone to pick any random area
            onStartNewWorldAtZoneRegion(normalizedZone, Object.keys(GEOGRAPHICAL_DATA[normalizedZone] || {})[0] || '');
          } else {
            console.log(`[WorldWeaver] Using normalized zone: ${normalizedZone}, region: ${normalizedRegion}`);
            onStartNewWorldAtZoneRegion(normalizedZone, normalizedRegion);
          }
        } else {
          // Final fallback to random if area not found and no zone/region provided
          console.error(`[WorldWeaver] Map area not found and no zone/region fallback: ${result.mapArea}`);
          console.log('[WorldWeaver] Falling back to random generation');
          onStartNewWorldWithCurrentSettings();
        }
        
        // Show explanation modal
        setExplanationModalData({
          isOpen: true,
          explanation: result.explanation || `Created a world in ${result.mapArea}, year ${result.year}`,
          reasoning: result.reasoning,
          suggestion: result.suggestion
        });
        
        // Clear input
        setWorldWeaverInput('');
      } else {
        // Show error message in input briefly
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

  return (
    <>
      <style jsx>{`
        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 0 3px rgba(74, 222, 128, 0.1), 0 0 6px rgba(74, 222, 128, 0.05);
          }
          50% {
            box-shadow: 0 0 8px rgba(74, 222, 128, 0.2), 0 0 12px rgba(74, 222, 128, 0.1);
          }
        }
      `}</style>
      <nav className={getSafariOptimizedClassName("relative w-full py-2 px-2 sm:px-6 shadow-lg flex justify-between items-center bg-slate-800/70 backdrop-blur-sm border-b border-slate-700 z-40")}>
        <div className="flex items-center space-x-2 sm:space-x-4 flex-1 mr-10">
        <h1 className="font-press-start text-sm sm:text-xl bg-clip-text text-transparent bg-gradient-to-br from-cyan-400 via-green-400 to-emerald-500 animate-logoGlow">HISTORY SIMULATOR</h1>
        
        {/* WorldWeaver Input - Hide on mobile */}
        {!isMobile && (
          <div className="flex items-center ml-20 flex-1 max-w-md">
            <div className="relative flex-1">
              <input
                type="text"
                value={worldWeaverInput}
                onChange={(e) => setWorldWeaverInput(e.target.value)}
                onFocus={() => setWorldWeaverFocused(true)}
                onBlur={() => setTimeout(() => setWorldWeaverFocused(false), 200)}
                onKeyPress={(e) => e.key === 'Enter' && handleWorldWeaverSubmit()}
                placeholder={worldWeaverFocused ? "Describe any historical scenario..." : "Create world from text..."}
                disabled={isProcessingWorldWeaver}
                className={`
                  w-full px-3 py-1.5 text-xs
                  bg-slate-900/50 border rounded-md
                  text-gray-200 placeholder-gray-500
                  transition-all duration-500
                  ${worldWeaverFocused 
                    ? 'border-green-400/50 shadow-lg shadow-green-400/10' 
                    : 'border-slate-600/50 shadow-sm shadow-green-400/05'
                  }
                  ${isProcessingWorldWeaver ? 'opacity-50' : ''}
                  focus:outline-none focus:ring-1 focus:ring-green-400/100
           
                `}
                style={{
        
                }}
              />
              {worldWeaverFocused && (
                <div className="absolute -bottom-6 left-0 text-xs text-green-400/70 whitespace-nowrap">
                  Enter any text to enter a setting inspired by it. 
                </div>
              )}
            </div>
            {worldWeaverFocused && (
              <button
                onClick={handleWorldWeaverSubmit}
                disabled={!worldWeaverInput.trim() || isProcessingWorldWeaver}
                className={`
                  ml-2 px-3 py-1.5 text-xs font-medium
                  bg-gradient-to-r from-green-600 to-emerald-600
                  hover:from-green-500 hover:to-emerald-500
                  disabled:from-gray-600 disabled:to-gray-600
                  disabled:opacity-50 disabled:cursor-not-allowed
                  text-white rounded-md
                  transition-all duration-200
                  flex items-center gap-1
                  shadow-md hover:shadow-lg hover:shadow-green-500/20
                `}
              >
                <Sparkles className="w-3 h-3" />
                Create
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Mobile Hamburger Menu */}
      {isMobile && (
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md transition-colors z-50"
          aria-label="Toggle Menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      )}
      
      {/* Desktop Menu / Mobile Dropdown */}
      <div className={`${
        isMobile 
          ? `absolute top-full right-0 mt-1 bg-slate-800/95 backdrop-blur-md border border-slate-600 rounded-lg shadow-xl p-2 space-y-1 transition-all duration-300 ${
              isMobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
            }`
          : 'flex items-center space-x-2'
      }`}>
         {/* Primary Source Search - hide on mobile */}
         {!isMobile && <PrimarySourceSearch />}
         
         <button 
            onClick={() => {
              toggleGeneratorPanel();
              if (isMobile) setIsMobileMenuOpen(false);
            }}
            className={`${
              isMobile ? 'w-full justify-start' : ''
            } px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-md transition-colors flex items-center`}
            title="Configure and Generate New Map"
            aria-expanded={isGeneratorPanelOpen}
            aria-controls="generator-panel-content"
        >
            <Shuffle className="w-4 h-4 mr-1.5" />
            {isMobile ? 'Map Config' : 'Configure New Map'}
            {!isMobile && <ChevronDown className={`w-4 h-4 ml-1.5 transition-transform duration-300 ${isGeneratorPanelOpen ? 'rotate-180' : ''}`} />}
        </button>

        <button 
            onClick={() => {
              setIsWorldMapModalOpen(true);
              if (isMobile) setIsMobileMenuOpen(false);
            }}
            className={`${
              isMobile ? 'w-full justify-start' : ''
            } px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md transition-colors flex items-center`}
            title="Toggle World Map View"
            aria-label="Toggle World Map View"
        >
            <Globe className="w-4 h-4 mr-1" /> World Map
        </button>

        <button
            onClick={() => {
              setIsAboutModalOpen(true);
              if (isMobile) setIsMobileMenuOpen(false);
            }}
            className={`${
              isMobile ? 'w-full justify-start' : ''
            } px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-md transition-colors flex items-center`}
            title="About the game"
            aria-label="About"
        >
            <Info className="w-4 h-4 mr-1" /> About
        </button>

        <button
          onClick={() => {
            setIsSettingsModalOpen(true);
            if (isMobile) setIsMobileMenuOpen(false);
          }}
          className={`${
            isMobile ? 'w-full justify-start px-3 py-1.5' : 'p-2'
          } bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md transition-colors flex items-center`}
          aria-label="Open Settings Panel"
          title="Advanced Settings"
        >
          <Settings className="w-5 h-5" />
          {isMobile && <span className="ml-2 text-xs">Settings</span>}
        </button>
      </div>

      <div id="generator-panel-content" className={getSafariOptimizedClassName(`absolute top-full left-0 right-0 z-30 bg-gray-800/95 backdrop-blur-sm shadow-lg border-t border-gray-700 transition-all duration-500 ease-in-out overflow-hidden ${isGeneratorPanelOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`)}>
        <div className="max-w-4xl mx-auto p-4 space-y-4 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <div className="space-y-3 p-3 bg-gray-700 bg-opacity-50 rounded-md border border-gray-600">
                <h3 className="text-md font-semibold text-blue-300 border-b border-gray-600 pb-1">Contextual Settings</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div>
                        <label htmlFor="panelLocationSelect" className="block text-xs font-medium text-gray-300 mb-0.5">Cultural Zone:</label>
                        <select id="panelLocationSelect" value={currentZone} onChange={(e) => onLocationChange(e.target.value)} className="w-full px-3 py-1.5 bg-gray-600 border border-gray-500 rounded-md text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs">
                            {CULTURE_ZONES.map(zone => <option key={zone} value={zone}>{zone}</option>)}
                        </select>
                    </div>
                     <div className="grid grid-cols-3 gap-2">
                        <div>
                            <label htmlFor="panelDayInput" className="block text-xs font-medium text-gray-300 mb-0.5">Day:</label>
                            <input type="number" id="panelDayInput" value={gameDate.day} onChange={(e) => handleDatePartChange('day', e.target.value)} min="1" max="31" className="w-full px-2 py-1.5 bg-gray-600 border border-gray-500 rounded-md text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs" />
                        </div>
                        <div>
                            <label htmlFor="panelMonthInput" className="block text-xs font-medium text-gray-300 mb-0.5">Month:</label>
                            <input type="number" id="panelMonthInput" value={gameDate.month} onChange={(e) => handleDatePartChange('month', e.target.value)} min="1" max="12" className="w-full px-2 py-1.5 bg-gray-600 border border-gray-500 rounded-md text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs" />
                        </div>
                        <div>
                            <label htmlFor="panelYearInput" className="block text-xs font-medium text-gray-300 mb-0.5">Year:</label>
                            <input type="number" id="panelYearInput" value={gameDate.year} onChange={(e) => handleDatePartChange('year', e.target.value)} className="w-full px-2 py-1.5 bg-gray-600 border border-gray-500 rounded-md text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs" />
                        </div>
                    </div>
                </div>
                 <div className="flex flex-col space-y-2 pt-2">
                    <button onClick={() => { onRegenerateMapWithCurrentSettings(); setIsGeneratorPanelOpen(false); }} className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md transition duration-150 flex items-center justify-center" title="Regenerate the map at the current world coordinates using the Base Archetype, Base Climate, and feature toggles selected below.">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 mr-1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                        Apply & Regenerate Current Map
                    </button>
                    <button onClick={() => { onStartNewWorldWithCurrentSettings(); setIsGeneratorPanelOpen(false); }} className="w-full px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-md transition duration-150 flex items-center justify-center" title="Start a brand new world (new seed, 0,0 coordinates) using the Base Archetype, Base Climate, and feature toggles selected below.">
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 mr-1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3H9m2.25-6.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                      Start New World With These Settings
                    </button>
                </div>
            </div>

            <div className="space-y-3 p-3 bg-gray-700 bg-opacity-50 rounded-md border border-gray-600">
              <h3 className="text-md font-semibold text-blue-300 border-b border-gray-600 pb-1">Base Generation Parameters</h3>
              <div>
                <label htmlFor="panelArchetypeSelect" className="block text-xs font-medium text-gray-300 mb-0.5">Base Archetype:</label>
                <select id="panelArchetypeSelect" value={userSelectedBaseArchetype} onChange={(e) => onBaseArchetypeChange(e.target.value as MapArchetype)} className="w-full px-3 py-1.5 bg-gray-600 border border-gray-500 rounded-md text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs">
                  {Object.values(MapArchetype).map(arch => (<option key={arch} value={arch} title={MAP_ARCHETYPE_DESCRIPTIONS[arch]}>{formatEnumString(arch)}</option>))}
                </select>
              </div>
              <div>
                <label htmlFor="panelClimateSelect" className="block text-xs font-medium text-gray-300 mb-0.5">Base Climate:</label>
                <select id="panelClimateSelect" value={userSelectedBaseClimate} onChange={(e) => onBaseClimateChange(e.target.value as ClimateType)} className="w-full px-3 py-1.5 bg-gray-600 border border-gray-500 rounded-md text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs">
                  {Object.values(ClimateType).map(clim => (<option key={clim} value={clim} title={CLIMATE_TYPE_DESCRIPTIONS[clim]}>{formatEnumString(clim)}</option>))}
                </select>
              </div>
               <div>
                <label htmlFor="panelAltitudeSelect" className="block text-xs font-medium text-gray-300 mb-0.5">Altitude:</label>
                <select id="panelAltitudeSelect" value={userSelectedBaseAltitude} onChange={(e) => onBaseAltitudeChange(e.target.value as AltitudeSetting)} className="w-full px-3 py-1.5 bg-gray-600 border border-gray-500 rounded-md text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs">
                  <option value="standard">Standard</option>
                  <option value="high">High Altitude</option>
                  <option value="low">Low Altitude</option>
                </select>
              </div>

              <div className="pt-1 space-y-1.5">
                <div className="flex items-center justify-between">
                    <label htmlFor="panelGenerateHarborToggle" className="text-xs font-medium text-gray-300">Generate Harbor</label>
                    <input type="checkbox" id="panelGenerateHarborToggle" checked={generateHarbor} onChange={(e) => onGenerateHarborToggle(e.target.checked)} className="h-4 w-4 text-blue-500 bg-gray-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-offset-gray-700" />
                </div>
                <div className="flex items-center justify-between">
                    <label htmlFor="panelGenerateLargeCityToggle" className="text-xs font-medium text-gray-300">Generate Large City</label>
                    <input type="checkbox" id="panelGenerateLargeCityToggle" checked={generateLargeCity} onChange={(e) => onGenerateLargeCityToggle(e.target.checked)} className="h-4 w-4 text-blue-500 bg-gray-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-offset-gray-700" />
                </div>
                <div className="flex items-center justify-between">
                    <label htmlFor="panelVolcanicActivityToggle" className="text-xs font-medium text-gray-300">Volcanic Activity</label>
                    <input type="checkbox" id="panelVolcanicActivityToggle" checked={forceVolcanicActivity} onChange={(e) => onForceVolcanicActivityToggle(e.target.checked)} className="h-4 w-4 text-blue-500 bg-gray-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-offset-gray-700" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
    
    {/* WorldWeaver Explanation Modal */}
    <ExplanationModal
      isOpen={explanationModalData.isOpen}
      onClose={() => setExplanationModalData(prev => ({ ...prev, isOpen: false }))}
      title="World Created"
      explanation={explanationModalData.explanation}
      subExplanation={explanationModalData.reasoning}
      suggestion={explanationModalData.suggestion}
    />
    </>
  );
};

export default TopNavBar;