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

  return (
    <div className="animate-fadeIn space-y-3 max-w-7xl mx-auto">
      {/* Farm Info Card - Static, Information-Rich */}
      <div className="w-full bg-slate-700/40 border border-slate-500/50 rounded-lg p-5">
        {/* Compact Single Row Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-baseline gap-4">
            <h2 className="text-3xl font-bold text-slate-50 tracking-tight">{dynamicFarmName}</h2>
            <div className="flex items-center gap-2">
              <span className="text-xl font-semibold text-slate-300">{Math.abs(year)} {year < 0 ? 'BCE' : 'CE'}</span>
              <span className="text-slate-600">|</span>
              <span className="text-base font-medium text-blue-400 capitalize">{season}</span>
            </div>
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

        {/* Last Year Performance - Compressed with Expand */}
        {farmState.lastYearData && (
          <div className="bg-slate-800/30 rounded-lg p-2.5 border border-slate-600/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg">{farmState.lastYearData.profit >= 0 ? '📈' : '📉'}</span>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wide">Last Year</div>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-sm font-bold ${farmState.lastYearData.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {farmState.lastYearData.profit >= 0 ? '+' : ''}{farmState.lastYearData.profit}¢
                    </span>
                    <span className="text-xs text-slate-400">net</span>
                  </div>
                </div>
                <div className="text-xs text-slate-400">
                  <span className="text-slate-300">{farmState.lastYearData.totalHarvest}u</span> {farmState.lastYearData.cropsMostGrown}
                </div>
              </div>
              <button
                onClick={() => toggleCard('last_year')}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                {expandedCard === 'last_year' ? 'Less' : 'Details'}
                <span className={`transform transition-transform ${expandedCard === 'last_year' ? 'rotate-180' : ''}`}>▼</span>
              </button>
            </div>

            {/* Expanded Details */}
            {expandedCard === 'last_year' && (
              <div className="mt-3 pt-3 border-t border-slate-600/30 grid grid-cols-3 gap-2">
                <div className="bg-slate-700/30 rounded px-2 py-1.5">
                  <div className="text-[9px] text-slate-500 mb-0.5">Revenue</div>
                  <div className="text-xs text-emerald-400 font-semibold">{farmState.lastYearData.revenue}¢</div>
                </div>
                <div className="bg-slate-700/30 rounded px-2 py-1.5">
                  <div className="text-[9px] text-slate-500 mb-0.5">Expenses</div>
                  <div className="text-xs text-red-400/70 font-semibold">{farmState.lastYearData.expenses}¢</div>
                </div>
                <div className="bg-slate-700/30 rounded px-2 py-1.5">
                  <div className="text-[9px] text-slate-500 mb-0.5">Margin</div>
                  <div className="text-xs text-slate-300 font-semibold">
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

      {/* Expandable Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Primary Crop Card */}
        <button
          onClick={() => toggleCard('crop')}
          className="bg-slate-700/40 hover:bg-slate-700/60 rounded-lg p-5 border border-slate-500/40 transition-all text-left"
        >
          {primaryCrop !== 'none' ? (
            <>
              <div className="flex items-start justify-between mb-4">
                <div className="text-xs text-slate-500 uppercase tracking-wide">Primary Crop</div>
                <div className={`transform transition-transform text-slate-500 ${expandedCard === 'crop' ? 'rotate-180' : ''}`}>
                  <span className="text-sm">▼</span>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <span className="text-4xl">{CROP_EMOJIS[primaryCrop] || '🌱'}</span>
                <div className="flex-1">
                  <div className="text-lg font-bold text-emerald-400 capitalize mb-1">
                    {CROP_DATA[primaryCrop]?.name || primaryCrop}
                  </div>
                  {!CROP_DATA[primaryCrop] && (
                    <p className="text-sm text-slate-400">Cultivation info not yet available</p>
                  )}
                </div>
              </div>

              {CROP_DATA[primaryCrop] && (
                <>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">{CROP_DATA[primaryCrop].description}</p>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-slate-800/40 rounded px-2.5 py-2 border border-slate-700/30">
                      <div className="text-[10px] text-slate-500 mb-0.5">Best Planting</div>
                      <div className="text-xs text-slate-200 font-medium">{formatPlantingSeason(CROP_DATA[primaryCrop].bestPlantingMonths)}</div>
                    </div>
                    <div className="bg-slate-800/40 rounded px-2.5 py-2 border border-slate-700/30">
                      <div className="text-[10px] text-slate-500 mb-0.5">Growth Time</div>
                      <div className="text-xs text-slate-200 font-medium">{CROP_DATA[primaryCrop].growthDays} days</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-emerald-900/15 rounded px-3 py-2 border border-emerald-700/30">
                    <span className="text-xs text-slate-400">Base Market Price</span>
                    <span className="text-sm font-semibold text-emerald-400">{CROP_DATA[primaryCrop].basePrice}¢/unit</span>
                  </div>

                  {expandedCard === 'crop' && CROP_DATA[primaryCrop].tip && (
                    <div className="mt-3 pt-3 border-t border-slate-700/30" onClick={(e) => e.stopPropagation()}>
                      <div className="bg-blue-900/10 border border-blue-700/20 rounded p-3">
                        <div className="text-[10px] text-blue-400 uppercase tracking-wide mb-1.5 font-semibold">💡 Cultivation Tip</div>
                        <p className="text-xs text-slate-300 leading-relaxed">{CROP_DATA[primaryCrop].tip}</p>
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

        {/* Livestock Card */}
        <button
          onClick={() => toggleCard('livestock')}
          className="bg-slate-700/40 hover:bg-slate-700/60 rounded-lg p-5 border border-slate-500/40 transition-all text-left"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="text-xs text-slate-500 uppercase tracking-wide">Livestock</div>
            <div className={`transform transition-transform text-slate-500 ${expandedCard === 'livestock' ? 'rotate-180' : ''}`}>
              <span className="text-sm">▼</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {farmState.livestock.slice(0, 3).map((animal, idx) => (
              <div key={idx} className="text-center">
                <div className="text-2xl mb-1">
                  {animal.type === 'chickens' ? '🐔' :
                   animal.type === 'cattle' ? '🐄' :
                   animal.type === 'horses' ? '🐴' :
                   animal.type === 'pigs' ? '🐷' :
                   animal.type === 'sheep' ? '🐑' : '🐾'}
                </div>
                <div className="text-lg font-bold text-slate-200">{animal.count}</div>
                <div className="text-[10px] text-slate-400 capitalize">{animal.type}</div>
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

      {/* Quick Actions Panel */}
      <div className="bg-slate-700/30 border border-slate-600/40 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-slate-200 mb-3">Quick Actions</h3>
        <div className="flex gap-3">
          <button
            onClick={plantAll}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded-lg transition-all"
          >
            <Sprout className="w-4 h-4" />
            Plant All
          </button>
          <button
            onClick={waterAll}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-700/80 hover:bg-blue-600 text-white rounded-lg transition-all"
          >
            <Droplets className="w-4 h-4" />
            Water All
          </button>
          <button
            onClick={harvestAll}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-700/80 hover:bg-amber-600 text-white rounded-lg transition-all"
          >
            <Wheat className="w-4 h-4" />
            Harvest All
          </button>
        </div>
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
