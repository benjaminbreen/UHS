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
import { Sprout, Droplets, Wheat, Sparkles, CloudRain, Sun, Cloud, Snowflake, AlertTriangle } from 'lucide-react';

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

  // Normalize crop key for lookup (case-insensitive) with generic fallback
  const getCropData = (cropKey: string) => {
    if (!cropKey || cropKey === 'none') return null;

    // Try exact match first
    if (CROP_DATA[cropKey]) return CROP_DATA[cropKey];

    // Try lowercase
    const lowerKey = cropKey.toLowerCase();
    if (CROP_DATA[lowerKey]) return CROP_DATA[lowerKey];

    // Try removing spaces and lowercase
    const normalizedKey = cropKey.toLowerCase().replace(/\s+/g, '');
    const normalizedMatch = Object.entries(CROP_DATA).find(([key]) =>
      key.toLowerCase().replace(/\s+/g, '') === normalizedKey
    );
    if (normalizedMatch) return normalizedMatch[1];

    // Try matching against farmTypes
    const farmTypeMatch = Object.entries(CROP_DATA).find(([_, cropInfo]) =>
      cropInfo.farmTypes?.some(farmType =>
        farmType.toLowerCase() === cropKey.toLowerCase() ||
        farmType.toLowerCase().replace(/\s+/g, '') === normalizedKey
      )
    );
    if (farmTypeMatch) return farmTypeMatch[1];

    // Try extracting first word (e.g., "Tea Plantation" -> "tea")
    const firstWord = cropKey.split(/[\s_-]/)[0].toLowerCase();
    if (CROP_DATA[firstWord]) return CROP_DATA[firstWord];

    // Try partial match on crop names
    const partialMatch = Object.entries(CROP_DATA).find(([key, data]) =>
      cropKey.toLowerCase().includes(key.toLowerCase()) ||
      key.toLowerCase().includes(cropKey.toLowerCase()) ||
      data.name.toLowerCase().includes(cropKey.toLowerCase())
    );
    if (partialMatch) return partialMatch[1];

    // Generic fallback for unknown crops
    return {
      name: cropKey.split(/[\s_-]/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '),
      emoji: '🌾',
      description: `A ${cropKey.toLowerCase()} crop grown in this region.`,
      bestPlantingMonths: [3, 4, 5],
      waterNeeds: 'moderate' as const,
      fertilizerNeeds: 'moderate' as const,
      growthDays: 90,
      basePrice: 10,
      tip: 'Consult local farmers for best cultivation practices.',
      nitrogenEffect: -10,
      phosphorusEffect: -5,
      potassiumEffect: -5,
      cropCategory: 'vegetable' as const,
    };
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

  // Weather icon helper
  const getWeatherIcon = (event: string) => {
    switch (event) {
      case 'drought': return <Sun className="w-5 h-5" />;
      case 'heavy_rain': return <CloudRain className="w-5 h-5" />;
      case 'early_frost': return <Snowflake className="w-5 h-5" />;
      case 'heatwave': return <Sun className="w-5 h-5" />;
      case 'hailstorm': return <Cloud className="w-5 h-5" />;
      default: return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const getWeatherColor = (event: string) => {
    switch (event) {
      case 'drought': return 'bg-orange-900/30 border-orange-600/60 text-orange-300';
      case 'heavy_rain': return 'bg-blue-900/30 border-blue-600/60 text-blue-300';
      case 'early_frost': return 'bg-cyan-900/30 border-cyan-600/60 text-cyan-300';
      case 'heatwave': return 'bg-red-900/30 border-red-600/60 text-red-300';
      case 'hailstorm': return 'bg-slate-900/30 border-slate-600/60 text-slate-300';
      default: return 'bg-yellow-900/30 border-yellow-600/60 text-yellow-300';
    }
  };

  return (
    <div className="animate-fadeIn space-y-3 max-w-7xl mx-auto">
      {/* Active Weather Warning Banner */}
      {farmState.activeWeather && (
        <div className={`w-full rounded-lg p-4 border-2 ${getWeatherColor(farmState.activeWeather.event)} animate-pulse`}>
          <div className="flex items-center gap-3">
            {getWeatherIcon(farmState.activeWeather.event)}
            <div className="flex-1">
              <div className="font-bold text-base capitalize">
                {farmState.activeWeather.event.replace(/_/g, ' ')} - {farmState.activeWeather.daysRemaining} days remaining
              </div>
              <div className="text-sm opacity-90 mt-1">
                {farmState.activeWeather.description}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs opacity-75">Severity</div>
              <div className="text-xl font-bold">{farmState.activeWeather.severity}%</div>
            </div>
          </div>
        </div>
      )}

      {/* Consolidated Economic Dashboard - Farm Info + Last Year + Current Season */}
      <div className="w-full bg-gradient-to-br from-slate-700/50 to-slate-800/40 border border-amber-500/20 rounded-xl p-4 px-6 shadow-xl">
        {/* Farm Header Row - Compressed vertical space */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-baseline gap-5 flex-1">
            <h2 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400">
              {dynamicFarmName}
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-xl font-semibold text-slate-200 tracking-tight">{Math.abs(year)} {year < 0 ? 'BCE' : 'CE'}</span>
              <span className="text-slate-400">·</span>
              <span className="text-xl font-medium text-blue-400 capitalize tracking-wide">{season}</span>
            </div>
            {farmDescription && (
              <>
                <span className="text-slate-400">·</span>
                <p className="text-md font-style: italic text-slate-400">{farmDescription}</p>
              </>
            )}
          </div>
          <div className="flex items-center gap-5">
            <div className="text-right">
              <div className="text-[12px] text-slate-500 uppercase tracking-[0.15em] font-medium mb-0.5">Head Farmer</div>
              <div className="text-md font-bold text-amber-400 tracking-tight">{headFarmer?.name || farmState.family.headOfHousehold}</div>
            </div>
            <div className={`px-3 py-1.5 rounded-lg ${prosperityInfo.bg} border ${prosperityInfo.bg.replace('bg-', 'border-').replace('/20', '/40')}`}>
              <span className={`text-md font-bold tracking-wide ${prosperityInfo.color}`}>{prosperityInfo.label}</span>
            </div>
          </div>
        </div>

        {/* Economic Overview - Profit and harvest on SAME LINE */}
        <div className="grid grid-cols-2 gap-4">
          {/* Last Year Summary */}
          {farmState.lastYearData && (
            <div className="bg-slate-800/50 rounded-xl px-5 py-3.5 border border-slate-600/40">
              <div className="flex items-start gap-3">
                <span className="text-xl">{farmState.lastYearData.profit >= 0 ? '📈' : '📉'}</span>
                <div className="flex-1">
                  <div className="text-[11px] text-slate-500 uppercase tracking-[0.15em] font-medium mb-1.5">
                    Last Year's Harvest ({year - 1})
                  </div>
                  <div className="flex items-baseline gap-4">
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-3xl font-bold tracking-tight ${farmState.lastYearData.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {farmState.lastYearData.profit >= 0 ? '+' : ''}{farmState.lastYearData.profit}
                      </span>
                      <span className="text-[12px] text-slate-500 uppercase tracking-wide">coins</span>
                    </div>
                    <div className="h-6 w-px bg-slate-600/50" />
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl text-emerald-400 font-semibold tracking-tight">{farmState.lastYearData.totalHarvest}</span>
                      <span className="text-[12px] text-emerald-400/70 uppercase tracking-[0.12em]">units of {farmState.lastYearData.cropsMostGrown || primaryCrop} harvested</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Current Season Summary */}
          {farmState.currentSeasonData && (
            <div className="bg-gradient-to-br from-amber-900/25 to-emerald-900/25 rounded-xl px-5 py-4 border border-amber-500/40">
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">💰</span>
                <div className="flex-1">
                  <div className="text-[9px] text-amber-400 uppercase tracking-[0.15em] font-medium mb-1.5">
                    Current Season
                  </div>
                  <div className="flex items-baseline gap-4">
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-3xl font-bold tracking-tight ${farmState.currentSeasonData.revenue - farmState.currentSeasonData.expenses >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {farmState.currentSeasonData.revenue - farmState.currentSeasonData.expenses >= 0 ? '+' : ''}
                        {farmState.currentSeasonData.revenue - farmState.currentSeasonData.expenses}
                      </span>
                      <span className="text-[12px] text-slate-500 uppercase tracking-wide">coins</span>
                    </div>
                    <div className="h-6 w-px bg-slate-600/50" />
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl text-emerald-400 font-semibold tracking-tight">{farmState.currentSeasonData.harvestCount}</span>
                      <span className="text-[12px] text-emerald-400/70 uppercase tracking-[0.12em]">units harvested</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Expandable Details Toggle - Only shows on hover */}
        <button
          onClick={() => toggleCard('economics')}
          className="group w-full mt-2 text-[9px] uppercase tracking-[0.15em] font-medium text-transparent hover:text-amber-400 flex items-center justify-center gap-2 py-1 rounded-lg hover:bg-slate-700/20 transition-all border border-transparent hover:border-slate-600/30"
        >
          <span className="group-hover:opacity-100 opacity-0 transition-opacity">
            {expandedCard === 'economics' ? 'Hide Details' : 'Show More Details'}
          </span>
          <span className={`transform transition-all text-[8px] group-hover:opacity-100 opacity-0 ${expandedCard === 'economics' ? 'rotate-180' : ''}`}>▼</span>
        </button>

        {/* Expanded Details - Reduced padding */}
        {expandedCard === 'economics' && (
          <div className="mt-2 pt-3 px-4 border-t border-slate-600/30 space-y-3">
            {/* Last Year Detailed Breakdown */}
            {farmState.lastYearData && (
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wide mb-2">Last Year Breakdown</div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-700/30 rounded px-3 py-2">
                    <div className="text-[9px] text-slate-500 uppercase">Revenue</div>
                    <div className="text-sm text-emerald-400 font-bold">{farmState.lastYearData.revenue}¢</div>
                  </div>
                  <div className="bg-slate-700/30 rounded px-3 py-2">
                    <div className="text-[9px] text-slate-500 uppercase">Expenses</div>
                    <div className="text-sm text-red-400 font-bold">{farmState.lastYearData.expenses}¢</div>
                  </div>
                  <div className="bg-slate-700/30 rounded px-3 py-2">
                    <div className="text-[9px] text-slate-500 uppercase">Margin</div>
                    <div className="text-sm text-slate-200 font-bold">
                      {Math.round((farmState.lastYearData.profit / farmState.lastYearData.revenue) * 100)}%
                    </div>
                  </div>
                </div>
                {(farmState.lastYearData.weatherEvents?.length > 0 || farmState.lastYearData.crisisEvents?.length > 0) && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {farmState.lastYearData.weatherEvents?.map((evt, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 bg-blue-900/20 border border-blue-700/30 rounded text-blue-300 capitalize">{evt}</span>
                    ))}
                    {farmState.lastYearData.crisisEvents?.map((evt, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 bg-red-900/20 border border-red-700/30 rounded text-red-300 capitalize">{evt}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Projected Harvest Value */}
            {farmState.currentSeasonData && (() => {
              const matureFields = farmState.fields.filter(f => f.crop && f.growthStage === 'mature');
              const growingFields = farmState.fields.filter(f => f.crop && (f.growthStage === 'growing' || f.growthStage === 'planted'));

              if (matureFields.length === 0 && growingFields.length === 0) return null;

              let readyValue = 0;
              matureFields.forEach(field => {
                const cropData = getCropData(field.crop || '');
                if (cropData) readyValue += cropData.basePrice * 12;
              });

              let futureValue = 0;
              growingFields.forEach(field => {
                const cropData = getCropData(field.crop || '');
                if (cropData) futureValue += cropData.basePrice * 12;
              });

              return (
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide mb-2">Projected Harvest Value</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-700/30 rounded px-3 py-2">
                      <div className="text-[9px] text-slate-500 uppercase">Ready ({matureFields.length} fields)</div>
                      <div className="text-base text-amber-400 font-bold">~{readyValue}¢</div>
                    </div>
                    <div className="bg-slate-700/30 rounded px-3 py-2">
                      <div className="text-[9px] text-slate-500 uppercase">Growing ({growingFields.length} fields)</div>
                      <div className="text-base text-emerald-400 font-bold">~{futureValue}¢</div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Current Season Details */}
            {farmState.currentSeasonData && (
              <div className="space-y-3">
                {Object.keys(farmState.currentSeasonData.cropsSold).length > 0 && (
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide mb-2">Crops Sold This Season</div>
                    <div className="grid grid-cols-4 gap-2">
                      {Object.entries(farmState.currentSeasonData.cropsSold).map(([crop, amount]) => (
                        <div key={crop} className="bg-slate-700/20 rounded px-2 py-1.5 flex items-center gap-1.5">
                          <span className="text-base">{CROP_EMOJIS[crop] || '🌾'}</span>
                          <div className="text-[10px] text-slate-300 font-semibold">{amount}u</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {farmState.currentSeasonData.expenseLog.length > 0 && (
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide mb-2">Recent Expenses</div>
                    <div className="space-y-1">
                      {farmState.currentSeasonData.expenseLog.slice(-3).map((expense, idx) => (
                        <div key={idx} className="bg-slate-700/20 rounded px-3 py-1.5 flex justify-between text-xs">
                          <span className="text-slate-300 capitalize">{expense.type}</span>
                          <span className="text-red-400 font-semibold">-{expense.amount}¢</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Keep separate current season panel for backward compatibility but hide it */}
      {false && farmState.currentSeasonData && (
        <div className="w-full bg-gradient-to-br from-amber-900/20 to-emerald-900/20 border border-amber-500/30 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">💰</span>
              <div>
                <h3 className="text-lg font-bold text-amber-300">Current Season Economics</h3>
                <p className="text-xs text-slate-400">Real-time tracking of income and expenses</p>
              </div>
            </div>
            <button
              onClick={() => toggleCard('economics')}
              className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-slate-700/30 transition-colors"
            >
              {expandedCard === 'economics' ? 'Hide Details' : 'Show Details'}
              <span className={`transform transition-transform ${expandedCard === 'economics' ? 'rotate-180' : ''}`}>▼</span>
            </button>
          </div>

          {/* Summary Row */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="bg-slate-800/40 rounded-lg px-4 py-3 border border-emerald-500/20">
              <div className="text-xs text-slate-500 mb-1 uppercase tracking-wide">Revenue</div>
              <div className="text-xl text-emerald-400 font-bold">
                {farmState.currentSeasonData.revenue}
                <span className="text-xs text-emerald-400/60 ml-1">coins</span>
              </div>
            </div>
            <div className="bg-slate-800/40 rounded-lg px-4 py-3 border border-red-500/20">
              <div className="text-xs text-slate-500 mb-1 uppercase tracking-wide">Expenses</div>
              <div className="text-xl text-red-400 font-bold">
                {farmState.currentSeasonData.expenses}
                <span className="text-xs text-red-400/60 ml-1">coins</span>
              </div>
            </div>
            <div className="bg-slate-800/40 rounded-lg px-4 py-3 border border-amber-500/20">
              <div className="text-xs text-slate-500 mb-1 uppercase tracking-wide">Current Profit</div>
              <div className={`text-xl font-bold ${farmState.currentSeasonData.revenue - farmState.currentSeasonData.expenses >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {farmState.currentSeasonData.revenue - farmState.currentSeasonData.expenses >= 0 ? '+' : ''}
                {farmState.currentSeasonData.revenue - farmState.currentSeasonData.expenses}
              </div>
            </div>
            <div className="bg-slate-800/40 rounded-lg px-4 py-3 border border-blue-500/20">
              <div className="text-xs text-slate-500 mb-1 uppercase tracking-wide">Harvests</div>
              <div className="text-xl text-blue-400 font-bold">{farmState.currentSeasonData.harvestCount}</div>
            </div>
          </div>

          {/* Projected Harvest Value */}
          {(() => {
            const matureFields = farmState.fields.filter(f => f.crop && f.growthStage === 'mature');
            const growingFields = farmState.fields.filter(f => f.crop && (f.growthStage === 'growing' || f.growthStage === 'planted'));

            if (matureFields.length === 0 && growingFields.length === 0) return null;

            // Calculate projected value
            let readyToHarvestValue = 0;
            matureFields.forEach(field => {
              const cropData = getCropData(field.crop || '');
              if (cropData) {
                const estimatedYield = 12; // Average yield per field
                readyToHarvestValue += cropData.basePrice * estimatedYield;
              }
            });

            let futureHarvestValue = 0;
            growingFields.forEach(field => {
              const cropData = getCropData(field.crop || '');
              if (cropData) {
                const estimatedYield = 12;
                futureHarvestValue += cropData.basePrice * estimatedYield;
              }
            });

            return (
              <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-600/30">
                <div className="text-xs text-slate-500 mb-2 uppercase tracking-wide">Projected Harvest Value</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Ready to Harvest ({matureFields.length} fields)</div>
                    <div className="text-lg text-amber-400 font-bold">
                      ~{readyToHarvestValue}
                      <span className="text-xs text-amber-400/60 ml-1">coins</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Growing ({growingFields.length} fields)</div>
                    <div className="text-lg text-emerald-400 font-bold">
                      ~{futureHarvestValue}
                      <span className="text-xs text-emerald-400/60 ml-1">coins</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Expanded Details */}
          {expandedCard === 'economics' && (
            <div className="mt-4 pt-4 border-t border-slate-600/30 space-y-3">
              {/* Sales Breakdown */}
              {Object.keys(farmState.currentSeasonData.cropsSold).length > 0 && (
                <div>
                  <div className="text-xs text-slate-500 mb-2 uppercase tracking-wide">Crops Sold This Season</div>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(farmState.currentSeasonData.cropsSold).map(([crop, amount]) => (
                      <div key={crop} className="bg-slate-700/30 rounded px-3 py-2 flex items-center gap-2">
                        <span className="text-lg">{CROP_EMOJIS[crop] || '🌾'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-slate-400 truncate capitalize">{crop}</div>
                          <div className="text-sm text-slate-200 font-semibold">{amount} units</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expense Log */}
              {farmState.currentSeasonData.expenseLog.length > 0 && (
                <div>
                  <div className="text-xs text-slate-500 mb-2 uppercase tracking-wide">Recent Expenses</div>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {farmState.currentSeasonData.expenseLog.slice(-5).map((expense, idx) => (
                      <div key={idx} className="bg-slate-700/30 rounded px-3 py-2 flex items-center justify-between text-sm">
                        <span className="text-slate-300 capitalize">{expense.type}</span>
                        <span className="text-red-400 font-semibold">-{expense.amount} coins</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Compact Info Cards Grid - Better horizontal space usage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Primary Crop Card - Larger text, horizontal layout */}
        <button
          onClick={() => toggleCard('crop')}
          className="bg-slate-700/40 hover:bg-slate-700/60 rounded-lg p-3 px-5 border border-slate-500/40 transition-all text-left"
        >
          {primaryCrop !== 'none' ? (
            <>
              <div className="flex items-start justify-between mb-1 px-2">
                <div className="flex items-start gap-4 flex-1">
                  <span className="text-5xl">{CROP_EMOJIS[primaryCrop] || CROP_EMOJIS[primaryCrop.toLowerCase()] || '🌱'}</span>
                  <div className="flex-1">
                    <div className="text-xs text-slate-500 uppercase tracking-widest font-medium mb-0.5">Primary Crop</div>
                    <div className="text-2xl font-bold text-emerald-400 capitalize tracking-tight mb-1">
                      {primaryCropData?.name || primaryCrop}
                    </div>
                    {primaryCropData && (
                      <div className="flex  gap-6 text-sm">
                        <div className="flex items-baseline gap-2">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wide">Planting season</span>
                          <span className="text-slate-200 font-semibold">{formatPlantingSeason(primaryCropData.bestPlantingMonths)}</span>
                        </div>
                        <span className="text-slate-600">·</span>
                        <div className="flex  gap-2">
                         <span className="text-[10px] text-slate-500 uppercase ">days of growth</span>
                          <span className="text-slate-200 font-bold text-2xl">{primaryCropData.growthDays}</span>
                         
                        </div>
                        <span className="text-slate-600">·</span>
                        <div className="flex  gap-2">
                        <span className="text-[10px] text-slate-500 uppercase">coins per unit</span>
                          <span className="text-emerald-400 font-bold text-2xl">{primaryCropData.basePrice}</span>
                          
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className={`transform transition-transform text-slate-500 ${expandedCard === 'crop' ? 'rotate-180' : ''}`}>
                  <span className="text-xs">▼</span>
                </div>
              </div>

              {primaryCropData && (
                <>
                  <p className="text-[15px] text-slate-400 leading-relaxed ml-[8px]">{primaryCropData.description}</p>

                  {expandedCard === 'crop' && primaryCropData.tip && (
                    <div className="mt-2 pt-2 border-t border-slate-700/30" onClick={(e) => e.stopPropagation()}>
                      <div className="bg-blue-900/10 border border-blue-700/20 rounded p-2.5">
                        <div className="text-[9px] text-blue-400 uppercase tracking-[0.15em] mb-1 font-semibold">💡 Cultivation Tip</div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">{primaryCropData.tip}</p>
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
                <div className="text-xs text-slate-500 uppercase tracking-widest">Primary Crop</div>
                <div className="text-lg font-semibold text-slate-400">No crop planted</div>
              </div>
            </div>
          )}
        </button>

        {/* Livestock Card - Matches primary crop card format */}
        <button
          onClick={() => toggleCard('livestock')}
          className="bg-slate-700/40 hover:bg-slate-700/60 rounded-lg p-4 px-5  border border-slate-500/40 transition-all text-left"
        >
          {farmState.livestock.length > 0 ? (
            <>
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-3 flex-1">
                  {/* Get primary livestock emoji */}
                  <span className="text-5xl">
                    {farmState.livestock[0].type === 'chickens' ? '🐔' :
                     farmState.livestock[0].type === 'cattle' ? '🐄' :
                     farmState.livestock[0].type === 'horses' ? '🐴' :
                     farmState.livestock[0].type === 'pigs' ? '🐷' :
                     farmState.livestock[0].type === 'sheep' ? '🐑' :
                     farmState.livestock[0].type === 'goats' ? '🐐' : '🐾'}
                  </span>
                  <div className="flex-1">
                    <div className="text-xs text-slate-500 uppercase tracking-widest font-medium mb-0.5">Livestock</div>
                    <div className="text-2xl font-bold text-sky-400 capitalize tracking-tight mb-1">
                      {farmState.livestock.length === 1
                        ? farmState.livestock[0].type
                        : farmState.livestock.length === 2
                        ? `${farmState.livestock[0].type} and ${farmState.livestock[1].type}`
                        : farmState.livestock.length === 3
                        ? `${farmState.livestock[0].type}, ${farmState.livestock[1].type}, and ${farmState.livestock[2].type}`
                        : `${farmState.livestock.length} Types`}
                    </div>
                    {/* Horizontal stats row - total animals, avg health, hungry count */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-baseline gap-2">
                        <span className="text-slate-200 font-bold text-2xl">
                          {farmState.livestock.reduce((sum, a) => sum + a.count, 0)}
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase">total animals</span>
                      </div>
                      <span className="text-slate-600">·</span>
                      <div className="flex items-baseline gap-2">
                        <span className={`font-bold text-2xl ${
                          Math.round(farmState.livestock.reduce((sum, a) => sum + a.health, 0) / farmState.livestock.length) > 70
                            ? 'text-green-400'
                            : 'text-yellow-400'
                        }`}>
                          {Math.round(farmState.livestock.reduce((sum, a) => sum + a.health, 0) / farmState.livestock.length)}%
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase">avg health</span>
                      </div>
                      {(() => {
                        const now = Date.now();
                        const oneDayMs = 24 * 60 * 60 * 1000;
                        const hungryCount = farmState.livestock.filter(a =>
                          (now - a.lastFed) / oneDayMs >= 2
                        ).length;

                        if (hungryCount > 0) {
                          return (
                            <>
                              <span className="text-slate-600">·</span>
                              <div className="flex items-baseline gap-2">
                                <span className="text-red-400 font-bold text-2xl animate-pulse">{hungryCount}</span>
                                <span className="text-[10px] text-red-400 uppercase">hungry</span>
                              </div>
                            </>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </div>
                <div className={`transform transition-transform text-slate-500 ${expandedCard === 'livestock' ? 'rotate-180' : ''}`}>
                  <span className="text-xs">▼</span>
                </div>
              </div>

              {/* Description paragraph matching crop card style */}
              <p className="text-[15px] text-slate-400 leading-relaxed ml-[8px]">
                {farmState.livestock.length === 1
                  ? (() => {
                      const type = farmState.livestock[0].type;
                      if (type === 'chickens') return 'Poultry raised for eggs and meat, requiring daily feeding and protection from predators.';
                      if (type === 'cattle') return 'Large livestock providing milk, meat, and labor. Requires substantial grazing land and regular care.';
                      if (type === 'horses') return 'Working animals used for transportation, plowing, and hauling. Require daily grooming and exercise.';
                      if (type === 'pigs') return 'Omnivorous livestock raised for meat. Efficient feed converters requiring secure pens.';
                      if (type === 'sheep') return 'Grazing animals providing wool, meat, and milk. Require seasonal shearing and herd management.';
                      if (type === 'goats') return 'Hardy livestock providing milk, meat, and fiber. Can graze on rough terrain and browse on shrubs.';
                      return 'Livestock animals requiring daily care, feeding, and attention to health and productivity.';
                    })()
                  : 'Mixed livestock operation providing diverse products including meat, dairy, eggs, and labor.'}
              </p>

              {/* Expanded details */}
              {expandedCard === 'livestock' && (
                <div className="mt-2 pt-2 border-t border-slate-700/30" onClick={(e) => e.stopPropagation()}>
                  <div className="space-y-1.5">
                    {farmState.livestock.map((animal, idx) => {
                      const now = Date.now();
                      const oneDayMs = 24 * 60 * 60 * 1000;
                      const daysSinceLastFed = (now - animal.lastFed) / oneDayMs;
                      const isHungry = daysSinceLastFed >= 2;

                      return (
                        <div key={idx} className={`bg-slate-800/40 rounded p-2 border ${isHungry ? 'border-red-700/50 bg-red-900/10' : 'border-slate-700/30'}`}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-2xl">
                              {animal.type === 'chickens' ? '🐔' :
                               animal.type === 'cattle' ? '🐄' :
                               animal.type === 'horses' ? '🐴' :
                               animal.type === 'pigs' ? '🐷' :
                               animal.type === 'sheep' ? '🐑' :
                               animal.type === 'goats' ? '🐐' : '🐾'}
                            </span>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-slate-200 capitalize">{animal.type}</span>
                                <span className="text-lg font-bold text-slate-100">{animal.count}</span>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-[11px]">
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
                            <div className="flex justify-between">
                              <span className="text-slate-500">Fed</span>
                              <span className={isHungry ? 'text-red-400 font-semibold' : 'text-green-400'}>
                                {isHungry ? `${Math.floor(daysSinceLastFed)}d ago` : 'Recently'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Livestock management tip */}
                  <div className="mt-2 bg-blue-900/10 border border-blue-700/20 rounded p-2.5">
                    <div className="text-[9px] text-blue-400 uppercase tracking-[0.15em] mb-1 font-semibold">💡 Livestock Care Tip</div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {farmState.livestock.some(a => {
                        const now = Date.now();
                        const oneDayMs = 24 * 60 * 60 * 1000;
                        return (now - a.lastFed) / oneDayMs >= 2;
                      })
                        ? 'Animals that go unfed for 2+ days will lose health and productivity. Feed them regularly in the Livestock tab.'
                        : 'Keep animals well-fed to maintain health and productivity. Check the Livestock tab daily for feeding opportunities.'}
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-5xl">🐾</span>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-widest font-medium mb-0.5">Livestock</div>
                <div className="text-2xl font-bold text-slate-400 tracking-tight">No livestock yet</div>
                <p className="text-[15px] text-slate-400 leading-relaxed mt-1">Purchase animals to diversify your farm income</p>
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
