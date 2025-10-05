/**
 * components/farm/FarmRightSidebar.tsx
 * Right sidebar with player card and time controls
 */

import React from 'react';
import { PlayerCharacter, Season } from '../../types';
import { FarmState } from '../../services/farmService';
import PlayerProfileCard from '../PlayerProfileCard';
import { Timer, CalendarClock, Sprout, Droplets, Wheat, Apple } from 'lucide-react';

interface FarmRightSidebarProps {
  playerCharacter: PlayerCharacter;
  season: Season;
  year: number;
  onProgressTime?: (months: number) => void;
  farmState?: FarmState;
  plantAll?: () => void;
  waterAll?: () => void;
  harvestAll?: () => void;
  feedLivestock?: () => void;
  progressFieldTime?: (months: number) => void;
  onOpenCalendar?: () => void;
}

export const FarmRightSidebar: React.FC<FarmRightSidebarProps> = ({
  playerCharacter,
  season,
  year,
  onProgressTime,
  farmState,
  plantAll,
  waterAll,
  harvestAll,
  feedLivestock,
  progressFieldTime,
  onOpenCalendar,
}) => {
  const PANEL_RIGHT_W = 340;

  // Check if player is resident or head farmer
  const isResident = farmState?.residencyStatus?.playerStatus === 'resident' ||
                     farmState?.residencyStatus?.playerStatus === 'worker' ||
                     farmState?.family.headOfHousehold === playerCharacter.name;

  return (
    <div
      className="keep-dark bg-gradient-to-b from-slate-800/95 via-slate-850/95 to-slate-900/95 border-l border-slate-700/50 flex flex-col flex-shrink-0 backdrop-blur-sm"
      style={{ width: PANEL_RIGHT_W }}
    >
      <PlayerProfileCard playerCharacter={playerCharacter} showActions={false} />

      <div className="h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent mx-4" />

      <div className="flex-1 p-5 overflow-y-auto">
        {/* Time & Seasons Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-amber-500/10 rounded-lg">
              <Timer className="w-4 h-4 text-amber-400" />
            </div>
            <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider">Time & Seasons</h3>
          </div>

          <button
            onClick={onOpenCalendar}
            className="w-full group bg-gradient-to-br from-slate-700/40 to-slate-800/40 hover:from-slate-700/60 hover:to-slate-800/60 rounded-xl p-4 border border-slate-600/30 hover:border-amber-500/40 shadow-lg hover:shadow-xl transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs text-amber-400/70 group-hover:text-amber-400 uppercase tracking-wide font-semibold transition-colors">
                Current Date
              </div>
              <CalendarClock className="w-4 h-4 text-amber-400/50 group-hover:text-amber-400 group-hover:scale-110 transition-all" />
            </div>
            <div className="text-2xl font-bold text-amber-300 group-hover:text-amber-200 capitalize tracking-tight transition-colors">
              {season}
            </div>
            <div className="text-sm text-slate-300 group-hover:text-slate-200 font-medium mt-0.5 transition-colors">
              Year {Math.abs(year)} {year < 0 ? 'BCE' : 'CE'}
            </div>
            <div className="mt-2 text-xs text-amber-400/60 group-hover:text-amber-400/80 transition-colors">
              Click to view farming calendar →
            </div>
          </button>
        </div>

        {/* Time Progression Controls */}
        {onProgressTime && (
          <div className="mb-6">
            <div className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-3 px-1">
              Advance Time
            </div>
            <div className="space-y-2">
              <button
                onClick={() => {
                  onProgressTime?.(1);
                  progressFieldTime?.(1);
                }}
                className="w-full group relative overflow-hidden px-4 py-2.5 bg-gradient-to-r from-blue-600/90 to-blue-700/90 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg transition-all text-sm font-medium shadow-md hover:shadow-lg"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <div className="relative flex items-center justify-center gap-2">
                  <CalendarClock className="w-4 h-4" />
                  <span>1 Month</span>
                </div>
              </button>
              <button
                onClick={() => {
                  onProgressTime?.(3);
                  progressFieldTime?.(3);
                }}
                className="w-full group relative overflow-hidden px-4 py-2.5 bg-gradient-to-r from-indigo-600/90 to-indigo-700/90 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-lg transition-all text-sm font-medium shadow-md hover:shadow-lg"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <div className="relative flex items-center justify-center gap-2">
                  <CalendarClock className="w-4 h-4" />
                  <span>3 Months</span>
                  <span className="text-xs opacity-75">(1 Season)</span>
                </div>
              </button>
              <button
                onClick={() => {
                  onProgressTime?.(6);
                  progressFieldTime?.(6);
                }}
                className="w-full group relative overflow-hidden px-4 py-2.5 bg-gradient-to-r from-violet-600/90 to-violet-700/90 hover:from-violet-500 hover:to-violet-600 text-white rounded-lg transition-all text-sm font-medium shadow-md hover:shadow-lg"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <div className="relative flex items-center justify-center gap-2">
                  <CalendarClock className="w-4 h-4" />
                  <span>6 Months</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Quick Actions - Only show if player is resident/worker */}
        {isResident && plantAll && waterAll && harvestAll && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                <Sprout className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="text-sm font-bold text-emerald-300 uppercase tracking-wider">Farm Actions</h3>
            </div>

            <div className="space-y-2">
              {/* Field Work Section */}
              <div className="bg-gradient-to-br from-slate-700/30 to-slate-800/30 rounded-lg p-3 border border-slate-600/20">
                <div className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-2">Field Work</div>
                <div className="space-y-1.5">
                  <button
                    onClick={plantAll}
                    className="w-full group relative overflow-hidden inline-flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-600/80 to-emerald-700/80 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-lg transition-all text-sm font-medium shadow-sm"
                  >
                    <Sprout className="w-4 h-4" />
                    <span>Plant All Fields</span>
                  </button>
                  <button
                    onClick={waterAll}
                    className="w-full group relative overflow-hidden inline-flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600/80 to-blue-700/80 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg transition-all text-sm font-medium shadow-sm"
                  >
                    <Droplets className="w-4 h-4" />
                    <span>Water All Fields</span>
                  </button>
                  <button
                    onClick={harvestAll}
                    className="w-full group relative overflow-hidden inline-flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-600/80 to-amber-700/80 hover:from-amber-500 hover:to-amber-600 text-white rounded-lg transition-all text-sm font-medium shadow-sm"
                  >
                    <Wheat className="w-4 h-4" />
                    <span>Harvest All Fields</span>
                  </button>
                </div>
              </div>

              {/* Livestock Care Section */}
              {feedLivestock && farmState?.livestock && farmState.livestock.length > 0 && (
                <div className="bg-gradient-to-br from-slate-700/30 to-slate-800/30 rounded-lg p-3 border border-slate-600/20">
                  <div className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-2">Livestock Care</div>
                  <button
                    onClick={feedLivestock}
                    className="w-full group relative overflow-hidden inline-flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-orange-600/80 to-orange-700/80 hover:from-orange-500 hover:to-orange-600 text-white rounded-lg transition-all text-sm font-medium shadow-sm"
                  >
                    <Apple className="w-4 h-4" />
                    <span>Feed All Livestock</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmRightSidebar;
