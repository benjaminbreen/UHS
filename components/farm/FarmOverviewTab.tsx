/**
 * components/farm/FarmOverviewTab.tsx
 * Overview tab showing farm info, stats, and quick actions
 *
 * Phase 3 of Farm Panel refactoring - Extracted from FarmPanelImproved.tsx lines 1510-1885
 */

import React from 'react';
import { Season } from '../../types';
import { FarmState, FarmFamilyMember } from '../../services/farmService';
import { ProsperityInfo, CROP_EMOJIS } from './types';
import { CROP_DATA, formatPlantingSeason } from '../../constants/gameData/cropData';
import { Sprout, Droplets, Wheat, Sparkles } from 'lucide-react';

interface FarmOverviewTabProps {
  farmState: FarmState;
  dynamicFarmName: string;
  headFarmer: FarmFamilyMember | null;
  year: number;
  season: Season;
  primaryCrop: string;
  prosperityInfo: ProsperityInfo;
  expandedCard: string | null;
  setExpandedCard: (card: string | null) => void;
  plantAll: () => void;
  waterAll: () => void;
  harvestAll: () => void;
  isRefreshingFlavor: boolean;
  refreshFarmFlavor: () => void;
  useLlm: boolean;
}

export const FarmOverviewTab: React.FC<FarmOverviewTabProps> = ({
  farmState,
  dynamicFarmName,
  headFarmer,
  year,
  season,
  primaryCrop,
  prosperityInfo,
  expandedCard,
  setExpandedCard,
  plantAll,
  waterAll,
  harvestAll,
}) => {
  const toggleCard = (cardId: string) => {
    setExpandedCard(prev => prev === cardId ? null : cardId);
  };

  // Normalize crop key for lookup (case-insensitive)
  const getCropData = (cropKey: string) => {
    console.log('[FarmOverviewTab] Getting crop data for:', cropKey);

    if (!cropKey || cropKey === 'none') {
      console.log('[FarmOverviewTab] Crop key is none or empty');
      return null;
    }

    // Try exact match first
    if (CROP_DATA[cropKey]) {
      console.log('[FarmOverviewTab] Found exact match for:', cropKey);
      return CROP_DATA[cropKey];
    }

    // Try lowercase
    const lowerKey = cropKey.toLowerCase();
    if (CROP_DATA[lowerKey]) {
      console.log('[FarmOverviewTab] Found lowercase match for:', lowerKey);
      return CROP_DATA[lowerKey];
    }

    // Try removing spaces and lowercase
    const normalizedKey = cropKey.toLowerCase().replace(/\s+/g, '');
    const normalizedMatch = Object.entries(CROP_DATA).find(([key]) =>
      key.toLowerCase().replace(/\s+/g, '') === normalizedKey
    );

    if (normalizedMatch) {
      console.log('[FarmOverviewTab] Found normalized match:', normalizedMatch[0]);
      return normalizedMatch[1];
    }

    // Try matching against farmTypes (e.g., "Apple Orchard" -> find crop with farmTypes containing "Apple Orchard")
    console.log('[FarmOverviewTab] Trying farmTypes reverse lookup for:', cropKey);
    const farmTypeMatch = Object.entries(CROP_DATA).find(([_, cropInfo]) =>
      cropInfo.farmTypes?.some(farmType =>
        farmType.toLowerCase() === cropKey.toLowerCase() ||
        farmType.toLowerCase().replace(/\s+/g, '') === normalizedKey
      )
    );

    if (farmTypeMatch) {
      console.log('[FarmOverviewTab] Found via farmTypes match:', farmTypeMatch[0], 'for farmType:', cropKey);
      return farmTypeMatch[1];
    }

    console.log('[FarmOverviewTab] No match found for:', cropKey);
    return null;
  };

  const primaryCropData = getCropData(primaryCrop);
  console.log('[FarmOverviewTab] primaryCrop:', primaryCrop, 'primaryCropData:', primaryCropData);

  // Generate farm description
  const farmDescription = React.useMemo(() => {
    if (primaryCrop === 'none') return '';

    const prosperityAdj = prosperityInfo.label.toLowerCase();
    const cropName = primaryCropData?.name.toLowerCase() || primaryCrop.toLowerCase();
    const farmType = primaryCropData?.farmTypes?.[0] || `${cropName} farm`;
    const householdSize = farmState.family.members.length;

    // Get other planted crops
    const plantedCrops = farmState.fields
      .filter(f => f.cropType && f.cropType !== 'none' && f.cropType !== primaryCrop)
      .map(f => getCropData(f.cropType)?.name.toLowerCase() || f.cropType.toLowerCase());

    // Remove duplicates
    const uniqueCrops = Array.from(new Set(plantedCrops));

    if (uniqueCrops.length === 0) {
      // Single crop farm - include household size
      return `A ${prosperityAdj} ${farmType.toLowerCase()} tended by ${householdSize} ${householdSize === 1 ? 'person' : 'people'}.`;
    } else if (uniqueCrops.length === 1) {
      return `A ${prosperityAdj} ${farmType.toLowerCase()} with ${uniqueCrops[0]} fields.`;
    } else if (uniqueCrops.length === 2) {
      return `A ${prosperityAdj} ${farmType.toLowerCase()} with ${uniqueCrops[0]} and ${uniqueCrops[1]} fields.`;
    } else {
      return `A ${prosperityAdj} ${farmType.toLowerCase()} with ${uniqueCrops[0]}, ${uniqueCrops[1]}, and ${uniqueCrops.length - 2} other ${uniqueCrops.length - 2 === 1 ? 'crop' : 'crops'}.`;
    }
  }, [primaryCrop, primaryCropData, prosperityInfo, farmState.fields, farmState.family.members.length]);

  return (
    <div className="animate-fadeIn space-y-3 max-w-7xl mx-auto">
      {/* Farm Info Card - Static, Information-Rich */}
      <div className="w-full bg-slate-700/40 border border-slate-500/50 rounded-lg p-5">
        {/* Compact Single Row Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-baseline gap-4 flex-1">
            <h2 className="text-3xl font-bold text-slate-50 tracking-tight">{dynamicFarmName}</h2>
            <div className="flex items-center gap-2">
              <span className="text-xl font-semibold text-slate-300">{Math.abs(year)} {year < 0 ? 'BCE' : 'CE'}</span>
              <span className="text-slate-600">|</span>
              <span className="text-base font-medium text-blue-400 capitalize">{season}</span>
            </div>
            {/* Farm Description - Right of season */}
            {farmDescription && (
              <>
                <span className="text-slate-600">·</span>
                <p className="text-sm text-slate-400 italic">{farmDescription}</p>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-slate-500 uppercase tracking-wide">Head Farmer</div>
              <div className="text-base font-semibold text-amber-400">{headFarmer?.name || farmState.family.headOfHousehold}</div>
            </div>
            <div className={`px-3 py-2 rounded-md ${prosperityInfo.bg} border ${prosperityInfo.bg.replace('bg-', 'border-').replace('/20', '/40')}`}>
              <span className={`text-base font-semibold ${prosperityInfo.color}`}>{prosperityInfo.label}</span>
            </div>
          </div>
        </div>

        {/* Last Year Performance - Enhanced Typography */}
        {farmState.lastYearData && (
          <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-600/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-3xl">{farmState.lastYearData.profit >= 0 ? '📈' : '📉'}</span>
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Last Year's Profit</div>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl font-bold ${farmState.lastYearData.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {farmState.lastYearData.profit >= 0 ? '+' : ''}{farmState.lastYearData.profit}
                    </span>
                    <span className="text-base text-slate-400">coins</span>
                  </div>
                </div>
                <div className="ml-3 pl-3 border-l border-slate-600">
                  <div className="text-xs text-slate-500 mb-0.5">Primary Harvest</div>
                  <div className="text-sm">
                    <span className="text-slate-200 font-semibold">{farmState.lastYearData.totalHarvest}</span>
                    <span className="text-slate-400 ml-1">units</span>
                    <span className="text-slate-500 mx-1">·</span>
                    <span className="text-slate-300">{farmState.lastYearData.cropsMostGrown}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => toggleCard('last_year')}
                className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-slate-700/30 transition-colors"
              >
                {expandedCard === 'last_year' ? 'Hide Details' : 'Show Details'}
                <span className={`transform transition-transform ${expandedCard === 'last_year' ? 'rotate-180' : ''}`}>▼</span>
              </button>
            </div>

            {/* Expanded Details */}
            {expandedCard === 'last_year' && (
              <div className="mt-4 pt-4 border-t border-slate-600/30 grid grid-cols-3 gap-3">
                <div className="bg-slate-700/30 rounded-lg px-3 py-2.5">
                  <div className="text-xs text-slate-500 mb-1 uppercase tracking-wide">Revenue</div>
                  <div className="text-base text-emerald-400 font-bold">{farmState.lastYearData.revenue} <span className="text-xs text-emerald-400/60">coins</span></div>
                </div>
                <div className="bg-slate-700/30 rounded-lg px-3 py-2.5">
                  <div className="text-xs text-slate-500 mb-1 uppercase tracking-wide">Expenses</div>
                  <div className="text-base text-red-400 font-bold">{farmState.lastYearData.expenses} <span className="text-xs text-red-400/60">coins</span></div>
                </div>
                <div className="bg-slate-700/30 rounded-lg px-3 py-2.5">
                  <div className="text-xs text-slate-500 mb-1 uppercase tracking-wide">Profit Margin</div>
                  <div className="text-base text-slate-200 font-bold">
                    {Math.round((farmState.lastYearData.profit / farmState.lastYearData.revenue) * 100)}%
                  </div>
                </div>
                {(farmState.lastYearData.weatherEvents?.length > 0 || farmState.lastYearData.crisisEvents?.length > 0) && (
                  <div className="col-span-3 pt-2 border-t border-slate-600/20">
                    <div className="text-[9px] text-slate-500 mb-1">Events</div>
                    <div className="flex flex-wrap gap-1">
                      {farmState.lastYearData.weatherEvents?.map((evt, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 bg-blue-900/20 border border-blue-700/30 rounded text-blue-300 capitalize">{evt}</span>
                      ))}
                      {farmState.lastYearData.crisisEvents?.map((evt, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 bg-red-900/20 border border-red-700/30 rounded text-red-300 capitalize">{evt}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Compact Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Primary Crop Card - Compact */}
        <button
          onClick={() => toggleCard('crop')}
          className="bg-slate-700/40 hover:bg-slate-700/60 rounded-lg p-4 border border-slate-500/40 transition-all text-left"
        >
          {primaryCrop !== 'none' ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-3xl">{CROP_EMOJIS[primaryCrop] || CROP_EMOJIS[primaryCrop.toLowerCase()] || '🌱'}</span>
                  <div className="flex-1">
                    <div className="text-xs text-slate-500 uppercase tracking-wide">Primary Crop</div>
                    <div className="text-base font-bold text-emerald-400 capitalize">
                      {primaryCropData?.name || primaryCrop}
                    </div>
                  </div>
                </div>
                <div className={`transform transition-transform text-slate-500 ${expandedCard === 'crop' ? 'rotate-180' : ''}`}>
                  <span className="text-sm">▼</span>
                </div>
              </div>

              {!primaryCropData && !expandedCard && (
                <p className="text-xs text-slate-400 italic">Cultivation info not yet available</p>
              )}

              {primaryCropData && (
                <>
                  {/* Compact info row with larger, more readable text */}
                  <div className="flex items-center gap-4 text-sm mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Planting:</span>
                      <span className="text-slate-100 font-semibold">{formatPlantingSeason(primaryCropData.bestPlantingMonths)}</span>
                    </div>
                    <span className="text-slate-600">•</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Growth:</span>
                      <span className="text-slate-100 font-semibold">{primaryCropData.growthDays}d</span>
                    </div>
                    <span className="text-slate-600">•</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Price:</span>
                      <span className="text-emerald-400 font-bold">{primaryCropData.basePrice} coins/u</span>
                    </div>
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed">{primaryCropData.description}</p>

                  {expandedCard === 'crop' && primaryCropData.tip && (
                    <div className="mt-3 pt-3 border-t border-slate-700/30" onClick={(e) => e.stopPropagation()}>
                      <div className="bg-blue-900/10 border border-blue-700/20 rounded p-3">
                        <div className="text-[10px] text-blue-400 uppercase tracking-wide mb-1.5 font-semibold">💡 Cultivation Tip</div>
                        <p className="text-xs text-slate-300 leading-relaxed">{primaryCropData.tip}</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-3xl">🌱</span>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">Primary Crop</div>
                <div className="text-lg font-semibold text-slate-400">No crop planted</div>
              </div>
            </div>
          )}
        </button>

        {/* Livestock Card - Ultra Compact */}
        <button
          onClick={() => toggleCard('livestock')}
          className="bg-slate-700/40 hover:bg-slate-700/60 rounded-lg p-4 border border-slate-500/40 transition-all text-left"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-slate-500 uppercase tracking-wide">Livestock</div>
            <div className={`transform transition-transform text-slate-500 ${expandedCard === 'livestock' ? 'rotate-180' : ''}`}>
              <span className="text-sm">▼</span>
            </div>
          </div>

          <div className="flex items-center justify-around gap-2">
            {farmState.livestock.slice(0, 4).map((animal, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-3xl">
                  {animal.type === 'chickens' ? '🐔' :
                   animal.type === 'cattle' ? '🐄' :
                   animal.type === 'horses' ? '🐴' :
                   animal.type === 'pigs' ? '🐷' :
                   animal.type === 'sheep' ? '🐑' : '🐾'}
                </span>
                <div>
                  <div className="text-base font-bold text-slate-100">{animal.count}</div>
                  <div className="text-[10px] text-slate-400 capitalize leading-tight">{animal.type}</div>
                </div>
              </div>
            ))}
          </div>

          {expandedCard === 'livestock' && (
            <div className="mt-3 pt-3 border-t border-slate-600/30" onClick={(e) => e.stopPropagation()}>
              <div className="space-y-2">
                {farmState.livestock.map((animal, idx) => (
                  <div key={idx} className="bg-slate-800/40 rounded p-2 border border-slate-700/30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-200 capitalize">{animal.type}</span>
                      <span className="text-lg font-bold text-slate-100">{animal.count}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Health</span>
                        <span className={animal.health > 70 ? 'text-green-400' : animal.health > 40 ? 'text-yellow-400' : 'text-red-400'}>
                          {animal.health}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Productivity</span>
                        <span className="text-sky-400">{animal.productivity}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </button>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0 }
          to { opacity: 1 }
        }
        .animate-fadeIn { animation: fadeIn .25s ease-out }
      `}</style>
    </div>
  );
};

export default FarmOverviewTab;
