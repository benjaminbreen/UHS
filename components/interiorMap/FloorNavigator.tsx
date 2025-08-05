/**
 * components/interiorMap/FloorNavigator.tsx - A UI component for navigating floors.
 */
import React from 'react';

interface FloorNavigatorProps {
  currentFloor: number;
  discoveredFloors: Set<number>;
  onFloorChange: (floor: number) => void;
}

const FloorNavigator: React.FC<FloorNavigatorProps> = ({ currentFloor, discoveredFloors, onFloorChange }) => {
  return (
    <div className="absolute top-4 left-4 z-10">
      <div className="bg-gray-900 bg-opacity-75 border border-gray-600 p-2 rounded-lg text-white text-xs space-y-1 shadow-lg">
        <h4 className="font-bold text-center border-b border-gray-700 pb-1 mb-1">Floors</h4>
        {Array.from(discoveredFloors).sort((a,b) => b-a).map(floorNum => (
          <button
            key={floorNum}
            onClick={() => {
              if (floorNum !== currentFloor && onFloorChange) {
                // Not calling onFloorChange as this feature is temporarily disabled.
              }
            }}
            disabled={floorNum === currentFloor}
            className={`block w-full text-center px-3 py-1.5 rounded-md text-sm transition-colors ${
              floorNum === currentFloor
                ? 'bg-blue-600 font-bold ring-2 ring-blue-400 cursor-default'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            aria-pressed={floorNum === currentFloor}
            title={`Go to Floor ${floorNum + 1}`}
          >
            {floorNum + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FloorNavigator;