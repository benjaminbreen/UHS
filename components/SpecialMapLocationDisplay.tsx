import React from 'react';
import { RoomDefinition } from '../types/specialMapTypes';

interface SpecialMapLocationDisplayProps {
  mapDisplayName: string;
  currentRoom: RoomDefinition | null;
  playerX: number;
  playerY: number;
}

const SpecialMapLocationDisplay: React.FC<SpecialMapLocationDisplayProps> = ({
  mapDisplayName,
  currentRoom,
  playerX,
  playerY
}) => {
  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30">
      <div className="bg-slate-900/90 backdrop-blur-md rounded-xl px-6 py-3 border border-slate-700/50 shadow-2xl">
        <div className="flex items-center space-x-3">
          {/* Location Icon */}
          <div className="text-2xl">🏛️</div>
          
          {/* Location Text */}
          <div className="flex flex-col">
            {/* Main Location Name */}
            <div className="text-lg font-bold text-slate-100 tracking-wide">
              {mapDisplayName}
            </div>
            
            {/* Current Room/Area */}
            {currentRoom && (
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-slate-400">▸</span>
                <span className="text-cyan-300 font-medium">
                  {currentRoom.name}
                </span>
              </div>
            )}
            
            {/* Optional Room Description on Hover */}
            {currentRoom?.description && (
              <div className="hidden group-hover:block absolute top-full mt-2 left-0 right-0 bg-slate-800/95 rounded-lg p-2 text-xs text-slate-300 border border-slate-600/50">
                {currentRoom.description}
              </div>
            )}
          </div>
          
          {/* Coordinates (debug mode only - can be toggled) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="ml-4 text-xs text-slate-500 font-mono">
              [{playerX}, {playerY}]
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpecialMapLocationDisplay;