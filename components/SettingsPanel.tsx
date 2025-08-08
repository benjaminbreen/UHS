import React, { useState } from 'react';
import PerformanceDiagnostics from './PerformanceDiagnostics';

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
}) => {
  const [showPerformanceDiagnostics, setShowPerformanceDiagnostics] = useState(false);

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
    </>
  );
};

export default SettingsPanel;