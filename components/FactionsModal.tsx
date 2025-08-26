/**
 * components/FactionsModal.tsx
 * Modal for displaying faction information with icons and colors
 */
import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { FACTION_ICONS, FactionData } from '../constants/gameData/factionIcons';
import { generateHistoricalSummary } from '../services/llmService';
import { useGame } from '../contexts/GameContext';

interface FactionsModalProps {
  onClose: () => void;
  currentZone?: string;
  currentRegion?: string;
  dominantPower?: string;
  dominantPowerDescription?: string;
  allegianceGroups?: (string | { name: string; type: string; description: string })[];
  gameYear?: number;
}

// Type mapping for faction status
const FACTION_TYPE_CONFIG = {
  primary: { color: 'bg-green-500', label: 'Active Power' },
  secondary: { color: 'bg-orange-500', label: 'Contested' },
  rising: { color: 'bg-yellow-500', label: 'Rising Power' },
  declining: { color: 'bg-red-500', label: 'Declining' },
  rebel: { color: 'bg-red-600', label: 'Rebel Force' },
  trade_company: { color: 'bg-blue-500', label: 'Trade Company' },
  religious: { color: 'bg-purple-500', label: 'Religious Order' }
};

const FactionsModal: React.FC<FactionsModalProps> = ({ 
  onClose, 
  currentZone, 
  currentRegion,
  dominantPower,
  dominantPowerDescription,
  allegianceGroups = [],
  gameYear
}) => {
  const { gameDate } = useGame();
  const year = gameYear || gameDate?.year || 1500;
  
  const [historicalContext, setHistoricalContext] = useState<string>(
    'These factions represent the major political and military powers active in this region during the current historical period. Their influence shapes trade routes, military conflicts, and cultural development throughout the area.'
  );
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  const [contextSource, setContextSource] = useState<'default' | 'faction' | 'general'>('default');
  // Use provided data directly
  const actualDominantPower = dominantPower;
  const actualAllegianceGroups = allegianceGroups;
  
  // Handle faction click for historical context
  const handleFactionClick = async (factionName: string) => {
    setIsLoadingContext(true);
    setContextSource('faction');
    try {
      const summary = await generateHistoricalSummary(
        year,
        currentRegion || 'this region',
        `the ${factionName} (a historical grouping, though it may need to be better defined and elucidated, and if it is innaccurate, explain why and provide the real context) in ${currentZone || 'this area'}`
      );
      setHistoricalContext(summary);
    } catch (error) {
      console.error('Error generating faction context:', error);
      setHistoricalContext('Unable to generate historical context at this time.');
    } finally {
      setIsLoadingContext(false);
    }
  };
  
  // Handle general context click
  const handleGeneralContextClick = async () => {
    setIsLoadingContext(true);
    setContextSource('general');
    try {
      const summary = await generateHistoricalSummary(
        year,
        currentRegion || 'this region',
        currentZone || 'this area'
      );
      setHistoricalContext(summary);
    } catch (error) {
      console.error('Error generating general context:', error);
      setHistoricalContext('Unable to generate historical context at this time.');
    } finally {
      setIsLoadingContext(false);
    }
  };

  // Get faction data with fallback
  const getFactionData = (factionName: string | null): FactionData => {
    if (!factionName) {
      return {
        name: 'Unknown',
        color: '#808080',
        icon: FaTimes
      };
    }
    return FACTION_ICONS[factionName] || {
      name: factionName,
      color: '#808080',
      icon: FaTimes
    };
  };

  const dominantFactionData = getFactionData(actualDominantPower);
  const DominantIcon = dominantFactionData.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl max-h-[85vh] overflow-y-auto ff-panel animate-popIn">
        {/* Close button - fixed spacing */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors z-10"
          style={{ width: '24px', height: '24px', padding: '0' }}
          aria-label="Close"
        >
          <FaTimes size={20} />
        </button>

        {/* Header */}
        <div className="relative p-3 pb-0">
          <h2 className="text-3xl font-bold font-cinzel text-center mb-2 text-slate-200">
            Regional Powers & Factions
          </h2>
          {currentZone && currentRegion && (
            <p className="text-center text-slate-400 mb-2">
              {currentRegion}, {currentZone}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Dominant Power Section */}
          {actualDominantPower && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-slate-300 border-b border-slate-700 pb-2">
                Dominant Power
              </h3>
              <div className="flex items-center gap-6 p-6 bg-black/40 rounded-lg border-2 transition-all hover:bg-black/60 cursor-pointer"
                   style={{ borderColor: dominantFactionData.color }}
                   onClick={() => handleFactionClick(dominantFactionData.name)}
                   title="Click for historical context">
                <div className="flex-shrink-0 p-4 rounded-full bg-black/60"
                     style={{ boxShadow: `0 0 20px ${dominantFactionData.color}40` }}>
                  <DominantIcon 
                    size={48} 
                    style={{ color: dominantFactionData.color }}
                  />
                </div>
                <div className="flex-grow">
                  <h4 className="text-2xl font-bold font-cinzel mb-1"
                      style={{ color: dominantFactionData.color, textShadow: '2px 2px 4px #000' }}>
                    {dominantFactionData.name}
                  </h4>
                  <p className="text-slate-400">
                    {dominantPowerDescription || 'The primary ruling authority in this region'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 uppercase tracking-wider">Status</span>
                  <p className="text-lg font-bold text-green-400">Active</p>
                </div>
              </div>
            </div>
          )}

          {/* Allegiance Groups Section */}
          {actualAllegianceGroups.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-slate-300 border-b border-slate-700 pb-2">
                Local Powers & Allegiance Groups
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {actualAllegianceGroups.map((group, index) => {
                  // Handle both string and object formats
                  const groupName = typeof group === 'string' ? group : group.name;
                  const groupType = typeof group === 'string' ? 'primary' : (group.type || 'primary');
                  const groupDescription = typeof group === 'string' ? 'Regional influence' : (group.description || 'Regional influence');
                  const factionData = getFactionData(groupName);
                  const FactionIcon = factionData.icon;
                  const typeConfig = FACTION_TYPE_CONFIG[groupType as keyof typeof FACTION_TYPE_CONFIG] || FACTION_TYPE_CONFIG.primary;
                  
                  return (
                    <div key={`${groupName}-${index}`}
                         className="relative flex items-center gap-4 p-4 bg-black/30 rounded-lg border border-slate-700 hover:bg-black/50 transition-all cursor-pointer"
                         style={{ borderColor: `${factionData.color}40` }}
                         onClick={() => handleFactionClick(factionData.name)}
                         title="Click for historical context">
                      {/* Status dot in upper right */}
                      <div className="absolute top-2 right-2" title={typeConfig.label}>
                        <div className={`w-3 h-3 ${typeConfig.color} rounded-full shadow-sm`}></div>
                      </div>
                      <div className="flex-shrink-0 p-3 rounded-full bg-black/60">
                        <FactionIcon 
                          size={32} 
                          style={{ color: factionData.color }}
                        />
                      </div>
                      <div className="flex-grow pr-4">
                        <h5 className="text-lg font-bold font-cinzel"
                            style={{ color: factionData.color }}>
                          {factionData.name}
                        </h5>
                        <p className="text-xs text-slate-400">
                          {groupDescription}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Additional Information */}
          <div className="mt-6 p-4 bg-slate-800/30 rounded-lg border border-slate-700 relative">
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-md font-bold text-slate-400 uppercase tracking-wider">
                Historical Context
                {contextSource === 'faction' && <span className="ml-2 text-sm normal-case text-amber-400">(Faction-specific)</span>}
                {contextSource === 'general' && <span className="ml-2 text-sm normal-case text-cyan-400">(General overview)</span>}
              </h4>
              <button
                onClick={handleGeneralContextClick}
                className="text-xs uppercase text-slate-500 hover:text-slate-300 transition-colors"
                disabled={isLoadingContext}
              >
                Click for more
              </button>
            </div>
            {isLoadingContext ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-400"></div>
                <span className="ml-2 text-sm text-slate-400">Loading historical context...</span>
              </div>
            ) : (
              <p className="text-slate-300 text-md leading-relaxed">
                {historicalContext}
              </p>
            )}
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-4 border-t border-slate-700">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Active Power</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Rising Power</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span>Contested</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Declining</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="w-3 h-3 bg-red-600 rounded-full"></div>
              <span>Rebel Force</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Trade Company</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span>Religious Order</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FactionsModal;