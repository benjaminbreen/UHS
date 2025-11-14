/**
 * components/FactionsModal.tsx
 * Modal for displaying faction information with icons and colors
 */
import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { FactionData } from '../constants/gameData/factionIcons';
import { LoadingSpinner } from './ui/LoadingSpinner';

// Lazy load faction icons to improve startup performance
let factionIconsModule: any = null;
let factionIconsPromise: Promise<any> | null = null;

const ensureFactionIcons = () => {
  if (!factionIconsPromise && !factionIconsModule) {
    factionIconsPromise = import('../constants/gameData/factionIcons').then(module => {
      factionIconsModule = module;
      return module;
    });
  }
};
import { generateHistoricalSummary } from '../services/llmService';
import { useGame } from '../contexts/GameContext';
import { getDisplayZone } from '../utils/zoneDisplayUtils';

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

  // Get faction data with smart fallback
  const getFactionData = (factionName: string | null): FactionData => {
    if (!factionName) {
      return {
        name: 'Unknown',
        color: '#808080',
        icon: FaTimes
      };
    }
    ensureFactionIcons();
    const icons = factionIconsModule?.FACTION_ICONS || {};

    // Try exact match first
    if (icons[factionName]) {
      return icons[factionName];
    }

    // Try word-based fallback (e.g., "British Indian Empire" → "British Empire")
    const firstWord = factionName.split(' ')[0];
    if (firstWord) {
      // Find any faction that starts with the same first word
      const fallbackMatch = Object.keys(icons).find(key =>
        key.startsWith(firstWord + ' ') || key === firstWord
      );

      if (fallbackMatch) {
        const fallbackData = icons[fallbackMatch];
        return {
          ...fallbackData,
          name: factionName // Keep original name but use fallback icon/color
        };
      }
    }

    // No match found, return default
    return {
      name: factionName,
      color: '#808080',
      icon: FaTimes
    };
  };

  const dominantFactionData = getFactionData(actualDominantPower);
  const DominantIcon = dominantFactionData.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto surface-card rounded-xl border border-[var(--border-normal)] shadow-2xl animate-popIn">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors z-10 p-1 rounded-lg hover:bg-[var(--surface-muted-bg)]"
          aria-label="Close"
        >
          <FaTimes size={24} />
        </button>

        {/* Header with gradient */}
        <div className="relative px-8 pt-8 pb-6 border-b border-[var(--border-normal)]">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)]/5 to-transparent pointer-events-none"></div>
          <h2 className="text-4xl font-bold font-cinzel text-center mb-2 text-[var(--text-primary)] relative">
            Regional Powers & Factions
          </h2>
          {currentZone && currentRegion && (
            <p className="text-center text-[var(--text-secondary)] text-lg relative">
              {currentRegion}, {getDisplayZone(currentZone, currentRegion)}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Dominant Power Section */}
          {actualDominantPower && (
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold text-[var(--text-primary)] font-cinzel">
                Dominant Power
              </h3>
              <div className="relative group flex items-center gap-6 p-6 bg-gradient-to-br from-[var(--surface-muted-bg)] to-[var(--surface-card-bg)] rounded-xl border-2 transition-all hover:shadow-lg cursor-pointer overflow-hidden"
                   style={{ borderColor: dominantFactionData.color }}
                   onClick={() => handleFactionClick(dominantFactionData.name)}
                   title="Click for historical context">
                {/* Glow effect on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none"
                     style={{ background: `radial-gradient(circle at 50% 50%, ${dominantFactionData.color}, transparent 70%)` }}></div>

                <div className="relative flex-shrink-0 p-5 rounded-2xl bg-[var(--surface-card-bg)] shadow-lg"
                     style={{ boxShadow: `0 4px 24px ${dominantFactionData.color}30, 0 0 0 1px ${dominantFactionData.color}20` }}>
                  <DominantIcon
                    size={56}
                    style={{ color: dominantFactionData.color }}
                  />
                </div>
                <div className="flex-grow relative">
                  <h4 className="text-3xl font-bold font-cinzel mb-2 tracking-tight"
                      style={{ color: dominantFactionData.color }}>
                    {dominantFactionData.name}
                  </h4>
                  <p className="text-[var(--text-secondary)] text-base leading-relaxed">
                    {dominantPowerDescription || 'The primary ruling authority in this region'}
                  </p>
                </div>
                <div className="text-right relative">
                  <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold block mb-1">Status</span>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-lg">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <p className="text-base font-bold text-green-400">Active</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Allegiance Groups Section */}
          {actualAllegianceGroups.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold text-[var(--text-primary)] font-cinzel">
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
                         className="relative group flex items-center gap-4 p-4 bg-gradient-to-br from-[var(--surface-muted-bg)] to-[var(--surface-card-bg)] rounded-lg border transition-all cursor-pointer hover:shadow-md overflow-hidden"
                         style={{ borderColor: `${factionData.color}60` }}
                         onClick={() => handleFactionClick(factionData.name)}
                         title="Click for historical context">
                      {/* Subtle glow on hover */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none"
                           style={{ background: `radial-gradient(circle at 50% 50%, ${factionData.color}, transparent 80%)` }}></div>

                      {/* Status dot in upper right */}
                      <div className="absolute top-3 right-3 z-10" title={typeConfig.label}>
                        <div className={`w-3 h-3 ${typeConfig.color} rounded-full shadow-lg`}></div>
                      </div>

                      <div className="relative flex-shrink-0 p-3 rounded-xl bg-[var(--surface-card-bg)] shadow-md"
                           style={{ boxShadow: `0 2px 12px ${factionData.color}20, 0 0 0 1px ${factionData.color}15` }}>
                        <FactionIcon
                          size={40}
                          style={{ color: factionData.color }}
                        />
                      </div>
                      <div className="flex-grow pr-6 relative">
                        <h5 className="text-xl font-bold font-cinzel mb-1 leading-tight"
                            style={{ color: factionData.color }}>
                          {factionData.name}
                        </h5>
                        <p className="text-sm text-[var(--text-secondary)] leading-snug">
                          {groupDescription}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Historical Context */}
          <div className="mt-6 p-5 bg-gradient-to-br from-[var(--surface-muted-bg)] to-[var(--surface-card-bg)] rounded-xl border border-[var(--border-normal)] relative shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <h4 className="text-lg font-bold text-[var(--text-primary)] uppercase tracking-wide flex items-center gap-2">
                <span>Historical Context</span>
                {contextSource === 'faction' && <span className="text-xs normal-case font-normal px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-md">Faction-specific</span>}
                {contextSource === 'general' && <span className="text-xs normal-case font-normal px-2 py-0.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-md">General overview</span>}
              </h4>
              <button
                onClick={handleGeneralContextClick}
                className="text-xs uppercase px-3 py-1.5 bg-[var(--surface-card-bg)] hover:bg-[var(--surface-elevated-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-normal)] rounded-lg transition-all font-semibold tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoadingContext}
              >
                Click for more
              </button>
            </div>
            {isLoadingContext ? (
              <LoadingSpinner text="Loading historical context..." center />
            ) : (
              <p className="text-[var(--text-primary)] text-base leading-relaxed">
                {historicalContext}
              </p>
            )}
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-5 mt-2 border-t border-[var(--border-normal)]">
            <div className="flex items-center gap-2.5 text-sm text-[var(--text-secondary)]">
              <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
              <span className="font-medium">Active Power</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-[var(--text-secondary)]">
              <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-sm"></div>
              <span className="font-medium">Rising Power</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-[var(--text-secondary)]">
              <div className="w-3 h-3 bg-orange-500 rounded-full shadow-sm"></div>
              <span className="font-medium">Contested</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-[var(--text-secondary)]">
              <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm"></div>
              <span className="font-medium">Declining</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-[var(--text-secondary)]">
              <div className="w-3 h-3 bg-red-600 rounded-full shadow-sm"></div>
              <span className="font-medium">Rebel Force</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-[var(--text-secondary)]">
              <div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm"></div>
              <span className="font-medium">Trade Company</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-[var(--text-secondary)]">
              <div className="w-3 h-3 bg-purple-500 rounded-full shadow-sm"></div>
              <span className="font-medium">Religious Order</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FactionsModal;