/**
 * components/VesselEmbarkationPanel.tsx - UI for selecting and boarding vessels
 */
import React, { useState } from 'react';
import { vesselService, VesselInfo } from '../services/vesselService';
import VesselSymbol from './symbols/VesselSymbol';

interface VesselEmbarkationPanelProps {
  onSelectVessel: (vessel: VesselInfo) => void;
  onClose: () => void;
  playerMode: 'ship' | 'onFoot';
}

const VesselEmbarkationPanel: React.FC<VesselEmbarkationPanelProps> = ({ 
  onSelectVessel, 
  onClose, 
  playerMode 
}) => {
  const [availableVessels] = useState<VesselInfo[]>(() => vesselService.getAvailableVessels());

  if (playerMode === 'ship') {
    return (
      <div className="absolute bottom-4 right-4 z-40 bg-slate-900/95 backdrop-blur-sm border border-blue-500/50 rounded-lg p-4 shadow-xl min-w-[280px]">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-blue-400">🚤</span>
          <h3 className="text-sm font-semibold text-white">Sea Travel</h3>
        </div>
        
        <div className="text-sm text-slate-300 mb-3">
          You are currently traveling by sea. Click on land to disembark.
        </div>
        
        <button 
          onClick={onClose}
          className="w-full bg-slate-600 hover:bg-slate-700 text-white py-2 px-3 rounded text-sm font-semibold transition-colors"
        >
          Close
        </button>
      </div>
    );
  }

  if (availableVessels.length === 0) {
    return (
      <div className="absolute bottom-4 right-4 z-40 bg-slate-900/95 backdrop-blur-sm border border-yellow-500/50 rounded-lg p-4 shadow-xl min-w-[280px]">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-yellow-400">⚠️</span>
          <h3 className="text-sm font-semibold text-white">No Vessels Available</h3>
        </div>
        
        <div className="text-sm text-slate-300 mb-3">
          You need to craft and deploy a vessel to travel by sea. Try combining wood, rope, and other materials to create a kayak, raft, or boat.
        </div>
        
        <button 
          onClick={onClose}
          className="w-full bg-slate-600 hover:bg-slate-700 text-white py-2 px-3 rounded text-sm font-semibold transition-colors"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="absolute bottom-4 right-4 z-40 bg-slate-900/95 backdrop-blur-sm border border-blue-500/50 rounded-lg p-4 shadow-xl min-w-[320px] max-w-[400px]">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-blue-400">⛵</span>
        <h3 className="text-sm font-semibold text-white">Select Vessel</h3>
      </div>
      
      <div className="text-sm text-slate-300 mb-4">
        Choose a vessel to embark on your sea journey:
      </div>
      
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {availableVessels.map(vesselInfo => (
          <div 
            key={vesselInfo.vessel.id}
            className="flex items-center gap-3 p-3 bg-slate-800/50 hover:bg-slate-700/70 rounded-lg cursor-pointer border border-slate-600/30 hover:border-blue-500/50 transition-all"
            onClick={() => onSelectVessel(vesselInfo)}
          >
            <div className="flex-shrink-0">
              <div className="w-12 h-8 flex items-center justify-center bg-slate-700 rounded-md">
                <VesselSymbol vessel={vesselInfo.vessel} x={0} y={0} size={6} />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-semibold text-white truncate">
                  {vesselInfo.vessel.name}
                </h4>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-600/80 text-blue-100">
                  {vesselInfo.vessel.emoji}
                </span>
              </div>
              
              <div className="text-xs text-slate-400 space-y-0.5">
                <div className="flex justify-between">
                  <span>Capacity:</span>
                  <span className="text-slate-300">{vesselInfo.capacity} people</span>
                </div>
                <div className="flex justify-between">
                  <span>Speed:</span>
                  <span className="text-slate-300">{(vesselInfo.speed * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Seaworthiness:</span>
                  <span className={`${
                    vesselInfo.seaworthiness >= 80 ? 'text-green-400' :
                    vesselInfo.seaworthiness >= 60 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {vesselInfo.seaworthiness}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-3 border-t border-slate-600/50">
        <button 
          onClick={onClose}
          className="w-full bg-slate-600 hover:bg-slate-700 text-white py-2 px-3 rounded text-sm font-semibold transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default VesselEmbarkationPanel;