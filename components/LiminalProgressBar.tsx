/**
 * components/LiminalProgressBar.tsx
 * Progress indicator for liminal travel sequences (long-distance journeys)
 * Only displays when player is actively in a liminal sequence
 */

import React from 'react';
import { MapArchetype } from '../types';

interface LiminalTravelState {
  sequence: MapArchetype[];
  progress: number;
  destination: string;
  originArea: string;
  originDirection: string;
  key: string;
}

interface LiminalProgressBarProps {
  liminalTravelState: LiminalTravelState | null;
}

/**
 * Convert MapArchetype enum to readable terrain name
 */
function getArchetypeName(archetype: MapArchetype): string {
  switch (archetype) {
    case MapArchetype.DESERT: return "Desert Expanse";
    case MapArchetype.OPEN_OCEAN: return "Open Ocean";
    case MapArchetype.SHOALS: return "Shoals";
    case MapArchetype.ISLAND: return "Island";
    case MapArchetype.BAY: return "Bay";
    case MapArchetype.STRAITS: return "Straits";
    case MapArchetype.DELTA: return "River Delta";
    case MapArchetype.RIVER_PORT: return "River Valley";
    case MapArchetype.FRESHWATER_LAKE: return "Lake";
    case MapArchetype.PENINSULA: return "Peninsula";
    case MapArchetype.ALL_LAND: return "Mainland";
    case MapArchetype.ATOLL: return "Atoll";
    case MapArchetype.SWAMP: return "Wetlands";
    case MapArchetype.BARRIER_ISLAND: return "Barrier Island";
    default: return "Unknown Terrain";
  }
}

/**
 * Convert liminal key to readable journey name
 */
function getJourneyName(key: string): string {
  return key
    .replace('LIMINAL_', '')
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

const LiminalProgressBar: React.FC<LiminalProgressBarProps> = ({ liminalTravelState }) => {
  if (!liminalTravelState) return null;

  const { sequence, progress, destination, key } = liminalTravelState;
  const currentSegment = progress;
  const totalSegments = sequence.length;
  const progressPercentage = ((currentSegment + 1) / totalSegments) * 100;

  const currentArchetype = sequence[currentSegment];
  const nextArchetype = currentSegment < totalSegments - 1 ? sequence[currentSegment + 1] : null;

  const journeyName = getJourneyName(key);
  const currentTerrain = getArchetypeName(currentArchetype);
  const nextTerrain = nextArchetype ? getArchetypeName(nextArchetype) : destination;

  return (
    <div className="mb-3 p-3 bg-gradient-to-br from-amber-900/30 to-orange-900/30 border border-amber-700/40 rounded-lg">
      {/* Journey Title */}
      <div className="mb-2">
        <p className="text-[10px] text-amber-400/80 uppercase tracking-wider font-semibold mb-0.5">
          Liminal Journey
        </p>
        <p className="text-xs text-amber-200 font-bold leading-tight">
          {journeyName}
        </p>
      </div>

      {/* Segment Progress Dots */}
      <div className="flex items-center gap-1 mb-2">
        {sequence.map((_, index) => {
          const isCurrent = index === currentSegment;
          const isPast = index < currentSegment;
          const isFuture = index > currentSegment;

          return (
            <div
              key={index}
              className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                isPast ? 'bg-amber-500' :
                isCurrent ? 'bg-amber-400 shadow-lg shadow-amber-400/50' :
                'bg-slate-700/50'
              }`}
            />
          );
        })}
      </div>

      {/* Progress Percentage Bar */}
      <div className="relative h-2 bg-slate-800/60 rounded-full overflow-hidden mb-2">
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500 ease-out shadow-lg"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Day Counter */}
      <div className="flex justify-between items-center mb-2">
        <p className="text-[10px] text-slate-400 font-mono">
          Segment {currentSegment + 1} of {totalSegments}
        </p>
        <p className="text-[10px] text-amber-400 font-semibold">
          {Math.round(progressPercentage)}% Complete
        </p>
      </div>

      {/* Current/Next Terrain */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 uppercase tracking-wide w-14">Current</span>
          <span className="text-xs text-amber-200 font-medium">{currentTerrain}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 uppercase tracking-wide w-14">Next</span>
          <span className="text-xs text-slate-300 font-medium">{nextTerrain}</span>
        </div>
      </div>
    </div>
  );
};

export default LiminalProgressBar;
