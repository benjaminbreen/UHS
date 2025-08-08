import React, { useState } from 'react';
import { useUI } from '../contexts/UIContext';
import { useMap } from '../contexts/MapContext';
import { useGame } from '../contexts/GameContext';
import { MapArchetype, ClimateType, AltitudeSetting, GameDate } from '../types';
import { MAP_ARCHETYPE_DESCRIPTIONS, CLIMATE_TYPE_DESCRIPTIONS, CULTURE_ZONES } from '../constants/index';
import { getSafariOptimizedClassName } from '../utils/safariUtils';

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
  } = useMap();
  const { gameDate, onMapConfigDateChange, currentZone, onLocationChange } = useGame();

  const [isGeneratorPanelOpen, setIsGeneratorPanelOpen] = useState(false);

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

  return (
    <nav className={getSafariOptimizedClassName("relative w-full py-2 px-6 shadow-lg flex justify-between items-center bg-slate-800/70 backdrop-blur-sm border-b border-slate-700 z-40")}>
      <div className="flex items-center space-x-4">
        <h1 className="font-press-start text-xl bg-clip-text text-transparent bg-gradient-to-br from-cyan-400 via-green-400 to-emerald-500 animate-logoGlow">MAP VOYAGER</h1>
      </div>
      
      <div className="flex items-center space-x-2">
         <button 
            onClick={toggleGeneratorPanel}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-md transition-colors flex items-center"
            title="Configure and Generate New Map"
            aria-expanded={isGeneratorPanelOpen}
            aria-controls="generator-panel-content"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 mr-1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4-2.245 4.5 4.5 0 0 0 8.44-2.472c0-.539-.061-1.07-.182-1.585m15.356 5.47c0 .539-.061 1.07-.182-1.585a4.5 4.5 0 0 1-8.44 2.472c0-.539.061-1.07.182-1.585m15.356-5.47a4.5 4.5 0 0 0-8.44-2.472c0 .539.061 1.07.182 1.585m0 0A12.063 12.063 0 0 1 23.25 12c0 .539-.061 1.07-.182 1.585m0 0a4.5 4.5 0 0 0 8.44 2.472c0 .539-.061 1.07-.182-1.585M12 12a3 3 0 0 1-5.78-1.128 2.25 2.25 0 0 0-2.4 2.245 4.5 4.5 0 0 1 8.44 2.472c0 .539-.061-1.07-.182-1.585" />
            </svg>
            Configure New Map
            <span className={`ml-1.5 transition-transform duration-300 ${isGeneratorPanelOpen ? 'rotate-180' : ''}`}>▾</span>
        </button>

        <button 
            onClick={() => setIsWorldMapModalOpen(true)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md transition-colors"
            title="Toggle World Map View"
            aria-label="Toggle World Map View"
        >
            <span className="text-sm mr-1">🌍</span> World Map
        </button>

        <button
            onClick={() => setIsAboutModalOpen(true)}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-md transition-colors"
            title="About the game"
            aria-label="About"
        >
            <span className="text-sm mr-1">ℹ️</span> About
        </button>

        <button
          onClick={() => setIsSettingsModalOpen(true)}
          className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md transition-colors"
          aria-label="Open Settings Panel"
          title="Advanced Settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
           <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.108 1.204.165.399.505.71.93.78l.893.15c.543.09.94.56.94 1.11v1.093c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.399.165-.71.505-.781.93l-.149.894c-.09.542-.56.94-1.11-.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-.002.269-1.45.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.738c.25-.35.273-.806.108-1.204-.165-.399-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.11v-1.094c0 .55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.399-.165.71-.505.78-.93l.15-.893Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
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
  );
};

export default TopNavBar;