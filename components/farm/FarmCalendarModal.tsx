/**
 * components/farm/FarmCalendarModal.tsx
 * Beautiful farming calendar showing planting/harvesting schedules
 */

import React, { useState, useMemo } from 'react';
import { X, Calendar, ChevronLeft, ChevronRight, Maximize2, Minimize2, Sprout, Droplets, Sun, Cloud, AlertCircle } from 'lucide-react';
import { Season } from '../../types';
import { FarmState } from '../../services/farmService';
import { CROP_DATA } from '../../constants/gameData/cropData';
import { CROP_EMOJIS } from './types';

interface FarmCalendarModalProps {
  farmState: FarmState;
  season: Season;
  year: number;
  validCrops: string[];
  onClose: () => void;
}

type ViewMode = 'year' | 'month';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SEASON_COLORS: Record<Season, string> = {
  spring: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
  summer: 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30',
  fall: 'from-orange-500/20 to-red-500/20 border-orange-500/30',
  winter: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
};

// Determine if location is in southern hemisphere based on cultural zone
const isSouthernHemisphere = (culturalZone: string): boolean => {
  const southernZones = ['OCEANIA', 'SOUTH_AMERICAN', 'SUB_SAHARAN_AFRICAN'];
  return southernZones.includes(culturalZone);
};

const getSeasonFromMonth = (monthIndex: number, isSouthern: boolean = false): Season => {
  // Northern hemisphere (default)
  if (!isSouthern) {
    if (monthIndex >= 2 && monthIndex <= 4) return 'spring' as Season;
    if (monthIndex >= 5 && monthIndex <= 7) return 'summer' as Season;
    if (monthIndex >= 8 && monthIndex <= 10) return 'fall' as Season;
    return 'winter' as Season;
  }

  // Southern hemisphere (flipped by 6 months)
  if (monthIndex >= 8 && monthIndex <= 10) return 'spring' as Season;
  if (monthIndex >= 11 || monthIndex <= 1) return 'summer' as Season;
  if (monthIndex >= 2 && monthIndex <= 4) return 'fall' as Season;
  return 'winter' as Season;
};

// Historical farming wisdom by era
const getHistoricalContext = (era: string, culturalZone: string) => {
  const contexts: Record<string, Record<string, string>> = {
    ANTIQUITY: {
      default: "Ancient farmers tracked seasons by celestial movements and religious festivals, planning crops around the agricultural calendar.",
      EAST_ASIAN: "Rice cultivation followed the lunar calendar, with planting timed to monsoon patterns.",
      MENA: "Irrigation from the Nile's flood cycle determined the entire farming year.",
    },
    MEDIEVAL: {
      default: "Medieval three-field rotation kept land productive while following church feast days for planting.",
      EUROPEAN: "Saints' days marked key agricultural tasks - St. George for plowing, St. John for hay harvest.",
      EAST_ASIAN: "Terraced rice paddies required careful water management coordinated across villages.",
    },
    RENAISSANCE_EARLY_MODERN: {
      default: "New World crops revolutionized agriculture, but traditional almanacs still guided planting.",
      EUROPEAN: "Printed almanacs combined astronomy, weather lore, and agricultural advice.",
    },
  };
  return contexts[era]?.[culturalZone] || contexts[era]?.default || "Farmers observe seasonal patterns to time their crops.";
};

// Get weather icon and tooltip for month (hemisphere-aware)
const getMonthWeather = (monthIndex: number, isSouthern: boolean) => {
  const season = getSeasonFromMonth(monthIndex, isSouthern);

  switch (season) {
    case 'winter':
      return { icon: Cloud, tooltip: "Cold, risk of frost" };
    case 'spring':
      return { icon: Droplets, tooltip: "Spring rains, good for planting" };
    case 'summer':
      return { icon: Sun, tooltip: "Warm growing season" };
    case 'fall':
      return { icon: Cloud, tooltip: "Cooler, harvest time" };
  }
};

// Adjust planting months for southern hemisphere
const adjustPlantingMonths = (months: number[], isSouthern: boolean): number[] => {
  if (!isSouthern) return months;

  // Shift by 6 months for southern hemisphere
  return months.map(month => {
    const adjusted = month + 6;
    return adjusted > 12 ? adjusted - 12 : adjusted;
  });
};

export const FarmCalendarModal: React.FC<FarmCalendarModalProps> = ({
  farmState,
  season,
  year,
  validCrops,
  onClose,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('year');
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [previewCrop, setPreviewCrop] = useState<string | null>(null);
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);
  const [hoveredCrop, setHoveredCrop] = useState<string | null>(null);

  // Determine hemisphere
  const isSouthern = isSouthernHemisphere(farmState.historicalContext.culturalZone);

  // Inject CSS animations
  React.useEffect(() => {
    const styleId = 'farm-calendar-animations';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(251, 191, 36, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(251, 191, 36, 0.5);
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 3s ease-in-out infinite;
        }
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Get current season's month index (approximate, hemisphere-aware)
  const currentMonthIndex = MONTHS.findIndex(m =>
    getSeasonFromMonth(MONTHS.indexOf(m), isSouthern) === season
  );

  // Calculate crop schedules for planted crops (hemisphere-aware)
  const plantedCropSchedules = useMemo(() => {
    return farmState.fields
      .filter(f => f.crop && f.crop !== 'none')
      .map((field, idx) => {
        const cropData = CROP_DATA[field.crop!];
        if (!cropData) return null;

        // Adjust planting months for hemisphere
        const adjustedMonths = adjustPlantingMonths(cropData.bestPlantingMonths, isSouthern);
        const plantingMonth = adjustedMonths[0] - 1; // 0-indexed
        const harvestMonth = (plantingMonth + Math.ceil(cropData.growthDays / 30)) % 12;

        return {
          fieldId: idx,
          crop: field.crop!,
          emoji: CROP_EMOJIS[field.crop!] || '🌱',
          plantingMonth,
          harvestMonth,
          growthDays: cropData.growthDays,
          name: cropData.name,
        };
      })
      .filter(Boolean);
  }, [farmState.fields, isSouthern]);

  // Get preview crop schedule (hemisphere-aware)
  const previewCropSchedule = useMemo(() => {
    if (!previewCrop) return null;
    const cropData = CROP_DATA[previewCrop];
    if (!cropData) return null;

    // Adjust planting months for hemisphere
    const adjustedMonths = adjustPlantingMonths(cropData.bestPlantingMonths, isSouthern);
    const plantingMonth = adjustedMonths[0] - 1;
    const harvestMonth = (plantingMonth + Math.ceil(cropData.growthDays / 30)) % 12;

    return {
      crop: previewCrop,
      emoji: CROP_EMOJIS[previewCrop] || '🌱',
      plantingMonth,
      harvestMonth,
      growthDays: cropData.growthDays,
      name: cropData.name,
    };
  }, [previewCrop, isSouthern]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      {/* Backdrop with elegant blur */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-slate-900/85 to-black/80 backdrop-blur-md" />

      {/* Modal Container */}
      <div
        className="relative bg-gradient-to-br from-slate-800/95 via-slate-850/95 to-slate-900/95 rounded-3xl shadow-2xl border border-amber-500/20 w-full max-w-7xl max-h-[92vh] overflow-hidden flex flex-col animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Elegant glow effect */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-amber-500/5 via-transparent to-emerald-500/5 pointer-events-none" />

        {/* Header with refined gradient */}
        <div className="relative bg-gradient-to-r from-amber-900/40 via-amber-800/30 to-emerald-900/40 border-b border-amber-500/20 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-amber-500/30 to-amber-600/20 rounded-xl shadow-lg border border-amber-400/30 backdrop-blur-sm">
                <Calendar className="w-7 h-7 text-amber-300" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400">
                  Farming Calendar
                </h2>
                <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Year {Math.abs(year)} {year < 0 ? 'BCE' : 'CE'} • {season}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* View mode toggle with smooth animation */}
              <button
                onClick={() => setViewMode(viewMode === 'year' ? 'month' : 'year')}
                className="group relative p-3 bg-slate-700/40 hover:bg-slate-600/60 rounded-xl transition-all duration-300 border border-slate-600/40 hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/10"
                title={viewMode === 'year' ? 'Switch to Month View' : 'Switch to Year View'}
              >
                <div className="relative z-10">
                  {viewMode === 'year' ?
                    <Minimize2 className="w-5 h-5 text-slate-300 group-hover:text-amber-300 transition-colors" /> :
                    <Maximize2 className="w-5 h-5 text-slate-300 group-hover:text-amber-300 transition-colors" />
                  }
                </div>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-500/0 to-amber-500/0 group-hover:from-amber-500/10 group-hover:to-transparent transition-all duration-300" />
              </button>
              <button
                onClick={onClose}
                className="group relative p-3 bg-slate-700/40 hover:bg-red-600/60 rounded-xl transition-all duration-300 border border-slate-600/40 hover:border-red-500/40 hover:shadow-lg hover:shadow-red-500/10"
              >
                <div className="relative z-10">
                  <X className="w-5 h-5 text-slate-300 group-hover:text-red-200 transition-colors" />
                </div>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-red-500/0 to-red-500/0 group-hover:from-red-500/10 group-hover:to-transparent transition-all duration-300" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-3 gap-8 max-w-[1600px] mx-auto">
            {/* Left: Calendar View */}
            <div className="col-span-2">
              {/* Historical Context Banner */}
              <div className="mb-6 bg-gradient-to-r from-amber-900/20 via-amber-800/10 to-transparent rounded-xl p-4 border-l-4 border-amber-500/50">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-lg mt-0.5">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-xs text-amber-400 font-bold uppercase tracking-wide mb-1">Historical Context</div>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {getHistoricalContext(farmState.historicalContext.era, farmState.historicalContext.culturalZone)}
                    </p>
                  </div>
                </div>
              </div>

              {viewMode === 'year' ? (
                // Year Overview
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                      <Maximize2 className="w-5 h-5 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-emerald-400">
                      Year Overview
                    </h3>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    {MONTHS.map((month, idx) => {
                      const monthSeason = getSeasonFromMonth(idx, isSouthern);
                      const seasonColor = SEASON_COLORS[monthSeason];
                      const cropsThisMonth = plantedCropSchedules.filter(
                        s => s && (s.plantingMonth === idx || s.harvestMonth === idx)
                      );
                      const previewThisMonth = previewCropSchedule &&
                        (previewCropSchedule.plantingMonth === idx || previewCropSchedule.harvestMonth === idx);
                      const isCurrentMonth = idx === currentMonthIndex;
                      const weather = getMonthWeather(idx, isSouthern);
                      const WeatherIcon = weather.icon;

                      return (
                        <div key={month} className="relative group">
                          <button
                            onClick={() => {
                              setSelectedMonth(idx);
                              setViewMode('month');
                            }}
                            onMouseEnter={() => setHoveredMonth(idx)}
                            onMouseLeave={() => setHoveredMonth(null)}
                            className={`w-full relative bg-gradient-to-br ${seasonColor} rounded-xl p-5 border hover:scale-[1.08] active:scale-[1.02] transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl ${
                              isCurrentMonth ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900' : ''
                            }`}
                            style={{
                              animation: `fadeInUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${idx * 0.03}s both`
                            }}
                          >
                            {/* Hover glow effect */}
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/0 to-white/0 group-hover:from-white/10 group-hover:to-transparent transition-all duration-300" />

                            <div className="relative">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <div className="text-base font-bold text-slate-100">{month.slice(0, 3)}</div>
                                  <WeatherIcon className="w-3.5 h-3.5 text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                                </div>
                                {isCurrentMonth && (
                                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-lg shadow-amber-400/50" />
                                )}
                              </div>
                              <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                                {cropsThisMonth.map((s, i) => (
                                  <span
                                    key={i}
                                    className="text-2xl transition-transform group-hover:scale-110"
                                    title={s!.name}
                                  >
                                    {s!.emoji}
                                  </span>
                                ))}
                                {previewThisMonth && (
                                  <span className="text-2xl opacity-40 group-hover:opacity-60 transition-opacity" title={previewCropSchedule.name}>
                                    {previewCropSchedule.emoji}
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>

                          {/* Tooltip */}
                          {hoveredMonth === idx && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg shadow-xl z-50 whitespace-nowrap animate-fadeIn">
                              <div className="text-xs text-slate-300 mb-1 font-semibold capitalize">{month} - {monthSeason}</div>
                              <div className="text-[10px] text-slate-400">{weather.tooltip}</div>
                              {cropsThisMonth.length > 0 && (
                                <div className="text-[10px] text-emerald-400 mt-1">
                                  {cropsThisMonth.length} crop{cropsThisMonth.length > 1 ? 's' : ''} this month
                                </div>
                              )}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                                <div className="w-2 h-2 bg-slate-900 border-r border-b border-slate-600 rotate-45" />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                // Month Detail View
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setSelectedMonth((selectedMonth - 1 + 12) % 12)}
                      className="group p-3 bg-slate-700/40 hover:bg-slate-600/60 rounded-xl transition-all duration-300 border border-slate-600/40 hover:border-emerald-500/40 hover:shadow-lg"
                    >
                      <ChevronLeft className="w-5 h-5 text-slate-300 group-hover:text-emerald-300 transition-colors group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-emerald-400">
                        {MONTHS[selectedMonth]}
                      </h3>
                      <p className="text-sm text-slate-400 mt-1 capitalize">{getSeasonFromMonth(selectedMonth, isSouthern)}</p>
                    </div>
                    <button
                      onClick={() => setSelectedMonth((selectedMonth + 1) % 12)}
                      className="group p-3 bg-slate-700/40 hover:bg-slate-600/60 rounded-xl transition-all duration-300 border border-slate-600/40 hover:border-emerald-500/40 hover:shadow-lg"
                    >
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-300 transition-colors group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>

                  {/* Month activities */}
                  <div className="space-y-4">
                    {plantedCropSchedules
                      .filter(s => s && (s.plantingMonth === selectedMonth || s.harvestMonth === selectedMonth))
                      .map((schedule, i) => {
                        const cropData = CROP_DATA[schedule!.crop];
                        return (
                          <div
                            key={i}
                            className="group relative bg-gradient-to-r from-slate-700/40 to-slate-700/20 hover:from-slate-700/60 hover:to-slate-700/40 rounded-xl p-5 border border-slate-600/40 hover:border-emerald-500/40 transition-all duration-300 shadow-lg hover:shadow-xl overflow-hidden"
                            style={{
                              animation: `fadeInUp 0.3s ease-out ${i * 0.1}s both`
                            }}
                          >
                            {/* Animated shimmer on hover */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

                            <div className="relative flex items-center gap-4">
                              <div className="text-4xl transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                {schedule!.emoji}
                              </div>
                              <div className="flex-1">
                                <div className="text-base font-bold text-slate-100 mb-0.5">{schedule!.name}</div>
                                <div className="flex items-center gap-3 text-xs text-slate-400">
                                  <span>Field {schedule!.fieldId + 1}</span>
                                  <span className="text-slate-600">•</span>
                                  <span>{schedule!.growthDays} days growth</span>
                                  {cropData && (
                                    <>
                                      <span className="text-slate-600">•</span>
                                      <span className="flex items-center gap-1">
                                        {cropData.waterNeeds === 'high' ? (
                                          <><Droplets className="w-3 h-3 text-blue-400" /> High water</>
                                        ) : cropData.waterNeeds === 'low' ? (
                                          <><Droplets className="w-3 h-3 text-slate-500" /> Low water</>
                                        ) : (
                                          <><Droplets className="w-3 h-3 text-blue-300" /> Moderate</>
                                        )}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                              {schedule!.plantingMonth === selectedMonth && (
                                <div className="px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/40 rounded-lg text-xs text-green-300 font-semibold shadow-lg flex items-center gap-1.5 animate-pulse-subtle">
                                  <span className="text-sm">🌱</span>
                                  Plant
                                </div>
                              )}
                              {schedule!.harvestMonth === selectedMonth && (
                                <div className="px-4 py-2 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/40 rounded-lg text-xs text-amber-300 font-semibold shadow-lg flex items-center gap-1.5 animate-pulse-subtle">
                                  <span className="text-sm">🌾</span>
                                  Harvest
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                    {previewCropSchedule &&
                      (previewCropSchedule.plantingMonth === selectedMonth || previewCropSchedule.harvestMonth === selectedMonth) && (
                      <div className="relative bg-gradient-to-r from-blue-900/30 to-blue-800/20 rounded-xl p-5 border-2 border-dashed border-blue-400/50 animate-pulse-subtle">
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
                        <div className="relative flex items-center gap-4">
                          <div className="text-4xl opacity-70">{previewCropSchedule.emoji}</div>
                          <div className="flex-1">
                            <div className="text-base font-bold text-blue-200 mb-0.5">{previewCropSchedule.name}</div>
                            <div className="text-xs text-blue-400">Preview • {previewCropSchedule.growthDays} days</div>
                          </div>
                          {previewCropSchedule.plantingMonth === selectedMonth && (
                            <div className="px-4 py-2 bg-green-500/20 border border-green-400/40 rounded-lg text-xs text-green-300 font-semibold">
                              🌱 Plant
                            </div>
                          )}
                          {previewCropSchedule.harvestMonth === selectedMonth && (
                            <div className="px-4 py-2 bg-amber-500/20 border border-amber-400/40 rounded-lg text-xs text-amber-300 font-semibold">
                              🌾 Harvest
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Available Crops */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Sprout className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400">
                  Available Crops
                </h3>
              </div>
              <div className="space-y-3 max-h-[calc(92vh-300px)] overflow-y-auto pr-2 custom-scrollbar">
                {validCrops.slice(0, 15).map((crop, idx) => {
                  const cropData = CROP_DATA[crop];
                  const isSelected = previewCrop === crop;
                  const isHovered = hoveredCrop === crop;

                  return (
                    <div key={crop} className="relative">
                      <button
                        onClick={() => setPreviewCrop(isSelected ? null : crop)}
                        onMouseEnter={() => setHoveredCrop(crop)}
                        onMouseLeave={() => setHoveredCrop(null)}
                        className={`group w-full text-left p-4 rounded-xl border transition-all duration-300 shadow-lg ${
                          isSelected
                            ? 'bg-gradient-to-r from-blue-500/30 to-blue-600/20 border-blue-400/60 scale-[1.05] shadow-blue-500/20'
                            : 'bg-slate-700/30 border-slate-600/30 hover:bg-slate-700/50 hover:border-amber-500/40 hover:scale-[1.02]'
                        }`}
                        style={{
                          animation: `fadeInUp 0.3s ease-out ${idx * 0.05}s both`
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`text-3xl transition-transform duration-300 ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`}>
                            {CROP_EMOJIS[crop] || '🌱'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm font-bold truncate ${isSelected ? 'text-blue-200' : 'text-slate-200'}`}>
                              {cropData?.name || crop}
                            </div>
                            {cropData && (
                              <div className="flex items-center gap-2 mt-0.5">
                                <div className={`text-xs ${isSelected ? 'text-blue-400' : 'text-slate-400'}`}>
                                  {cropData.growthDays} days • {cropData.basePrice}¢
                                </div>
                                {cropData.waterNeeds === 'high' && (
                                  <Droplets className="w-3 h-3 text-blue-400" />
                                )}
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <div className="px-2 py-1 bg-blue-500/20 border border-blue-400/40 rounded text-[10px] text-blue-300 font-semibold">
                              Preview
                            </div>
                          )}
                        </div>
                      </button>

                      {/* Detailed Tooltip on Hover */}
                      {isHovered && cropData && (
                        <div className="absolute left-full ml-3 top-0 w-72 bg-slate-900 border border-slate-600 rounded-xl shadow-2xl z-50 p-4 animate-fadeIn">
                          <div className="flex items-start gap-3 mb-3">
                            <span className="text-4xl">{CROP_EMOJIS[crop] || '🌱'}</span>
                            <div className="flex-1">
                              <div className="text-base font-bold text-amber-300 mb-1">{cropData.name}</div>
                              <div className="text-[10px] text-slate-400 uppercase tracking-wide">
                                {cropData.cropCategory} • {cropData.growthDays} days
                              </div>
                            </div>
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed mb-3">
                            {cropData.description}
                          </p>

                          <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className="bg-slate-800/50 rounded px-2 py-1.5">
                              <div className="text-[9px] text-slate-500 uppercase">Water</div>
                              <div className="text-xs text-blue-400 font-semibold capitalize">{cropData.waterNeeds}</div>
                            </div>
                            <div className="bg-slate-800/50 rounded px-2 py-1.5">
                              <div className="text-[9px] text-slate-500 uppercase">Fertilizer</div>
                              <div className="text-xs text-emerald-400 font-semibold capitalize">{cropData.fertilizerNeeds}</div>
                            </div>
                          </div>

                          {cropData.tip && (
                            <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-2">
                              <div className="text-[9px] text-blue-400 uppercase tracking-wide mb-1 font-semibold">💡 Tip</div>
                              <p className="text-[10px] text-slate-300 leading-relaxed">{cropData.tip}</p>
                            </div>
                          )}

                          {/* Arrow pointing to button */}
                          <div className="absolute right-full top-6 mr-px">
                            <div className="w-2 h-2 bg-slate-900 border-l border-t border-slate-600 rotate-[-45deg]" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmCalendarModal;
