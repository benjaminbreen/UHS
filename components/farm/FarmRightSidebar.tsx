/**
 * components/farm/FarmRightSidebar.tsx
 * Right sidebar with player card and time controls
 */

import React from 'react';
import { PlayerCharacter, Season } from '../../types';
import PlayerProfileCard from '../PlayerProfileCard';
import { Timer, CalendarClock } from 'lucide-react';

interface FarmRightSidebarProps {
  playerCharacter: PlayerCharacter;
  season: Season;
  year: number;
  onProgressTime?: (months: number) => void;
}

export const FarmRightSidebar: React.FC<FarmRightSidebarProps> = ({
  playerCharacter,
  season,
  year,
  onProgressTime,
}) => {
  const PANEL_RIGHT_W = 340;

  return (
    <div
      className="keep-dark bg-gradient-to-b from-slate-950 to-black border-l border-slate-800/60 flex flex-col flex-shrink-0"
      style={{ width: PANEL_RIGHT_W }}
    >
      <PlayerProfileCard playerCharacter={playerCharacter} showActions={false} />

      <div className="h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent mx-4" />

      <div className="flex-1 p-4 overflow-y-auto">
        <h3 className="text-base font-semibold text-amber-400 mb-3 flex items-center gap-2">
          <Timer className="w-4 h-4" />
          Time & Seasons
        </h3>

        <div className="bg-slate-900/60 rounded-lg p-3 mb-3 border border-slate-800/60 text-slate-200">
          <div className="flex items-center justify-between">
            <div className="text-sm capitalize">
              {season} {year}
            </div>
            <CalendarClock className="w-5 h-5 text-slate-400" />
          </div>
        </div>

        {onProgressTime && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-300 mb-2">Progress Time</h4>
            <button
              onClick={() => onProgressTime(1)}
              className="w-full px-4 py-2 bg-blue-700/80 hover:bg-blue-600 text-white rounded-lg transition-all text-sm"
            >
              <CalendarClock className="w-4 h-4 inline mr-2" />
              1 Month
            </button>
            <button
              onClick={() => onProgressTime(3)}
              className="w-full px-4 py-2 bg-blue-700/80 hover:bg-blue-600 text-white rounded-lg transition-all text-sm"
            >
              <CalendarClock className="w-4 h-4 inline mr-2" />
              3 Months (1 Season)
            </button>
            <button
              onClick={() => onProgressTime(6)}
              className="w-full px-4 py-2 bg-blue-700/80 hover:bg-blue-600 text-white rounded-lg transition-all text-sm"
            >
              <CalendarClock className="w-4 h-4 inline mr-2" />
              6 Months
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmRightSidebar;
