/**
 * HarborStationModal.tsx - Harbor/port interface with ocean voyage fast travel
 */
import React, { useState } from 'react';
import { X, Ship, MapPin, Clock, Coins, AlertTriangle, Info, Anchor } from 'lucide-react';

interface HarborDestination {
  name: string;
  x: number;
  y: number;
  distance: number; // Distance in miles
  travelTime: number; // Average time in hours
  travelTimeMin?: number; // Minimum time (good weather)
  travelTimeMax?: number; // Maximum time (bad weather)
  fare: number; // Cost in coins
  shipTypeRequired?: 'coastal' | 'ocean-going' | 'steam-powered';
  dangerLevel?: 'low' | 'moderate' | 'high' | 'extreme';
  routeDescription?: string;
}

interface HarborStationModalProps {
  isOpen: boolean;
  onClose: () => void;
  harborName: string;
  availableDestinations: HarborDestination[];
  playerCurrency: number;
  currentTime: number; // Hours since game start
  onBookPassage: (destination: HarborDestination) => void;
}

const HarborStationModal: React.FC<HarborStationModalProps> = ({
  isOpen,
  onClose,
  harborName,
  availableDestinations,
  playerCurrency,
  currentTime,
  onBookPassage
}) => {
  const [selectedDestination, setSelectedDestination] = useState<HarborDestination | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isOpen) return null;

  const handleSelectDestination = (destination: HarborDestination) => {
    setSelectedDestination(destination);
    setShowConfirm(true);
  };

  const handleConfirmVoyage = () => {
    if (selectedDestination) {
      onBookPassage(selectedDestination);
      onClose();
    }
  };

  const canAfford = (fare: number) => playerCurrency >= fare;

  const getDangerColor = (level?: string) => {
    switch (level) {
      case 'low': return 'text-green-400';
      case 'moderate': return 'text-yellow-400';
      case 'high': return 'text-orange-400';
      case 'extreme': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const getShipIcon = (shipType?: string) => {
    switch (shipType) {
      case 'steam-powered': return '⚓';
      case 'ocean-going': return '⛵';
      case 'coastal': return '🛶';
      default: return '🚢';
    }
  };

  const getShipLabel = (shipType?: string) => {
    switch (shipType) {
      case 'steam-powered': return 'Steam Ship';
      case 'ocean-going': return 'Ocean Vessel';
      case 'coastal': return 'Coastal Ship';
      default: return 'Ship';
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-[90vw] max-w-3xl max-h-[85vh] bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900 rounded-2xl shadow-2xl border border-slate-700/50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50 bg-gradient-to-r from-blue-900/30 to-slate-800/50">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-600/20 rounded-xl border border-blue-500/30">
              <Anchor className="w-7 h-7 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{harborName}</h2>
              <p className="text-sm text-slate-400 mt-1">Port & Harbor</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors group"
          >
            <X className="w-6 h-6 text-slate-400 group-hover:text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!showConfirm ? (
            <>
              {/* Harbor Info */}
              <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <div className="flex items-center space-x-2 mb-3">
                  <Info className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-semibold text-white">Available Voyages</h3>
                </div>
                <p className="text-sm text-slate-400">
                  Book passage on ocean-going vessels to distant ports. Journey times vary based on weather conditions and ship technology.
                </p>
              </div>

              {/* Destinations List */}
              <div className="space-y-3">
                {availableDestinations.length === 0 ? (
                  <div className="text-center py-12">
                    <Ship className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">No voyages available from this port.</p>
                    <p className="text-xs text-slate-500 mt-2">Ships may require better technology for longer voyages.</p>
                  </div>
                ) : (
                  availableDestinations.map((dest, idx) => {
                    const affordable = canAfford(dest.fare);
                    return (
                      <button
                        key={idx}
                        onClick={() => affordable && handleSelectDestination(dest)}
                        disabled={!affordable}
                        className={`w-full p-4 rounded-xl border transition-all ${
                          affordable
                            ? 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 hover:border-blue-500/50 cursor-pointer'
                            : 'bg-slate-900/50 border-slate-800/50 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4 flex-1">
                            <div className="p-3 bg-blue-600/10 rounded-lg border border-blue-500/20">
                              <Ship className="w-6 h-6 text-blue-400" />
                            </div>
                            <div className="text-left flex-1">
                              <h4 className="text-lg font-semibold text-white">{dest.name}</h4>
                              {dest.routeDescription && (
                                <p className="text-xs text-slate-500 mt-1">{dest.routeDescription}</p>
                              )}

                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-sm">
                                <span className="flex items-center space-x-1 text-slate-400">
                                  <MapPin className="w-4 h-4" />
                                  <span>{dest.distance} miles</span>
                                </span>
                                <span className="flex items-center space-x-1 text-slate-400">
                                  <Clock className="w-4 h-4" />
                                  <span>{Math.floor(dest.travelTime / 24)}d {dest.travelTime % 24}h</span>
                                </span>

                                {dest.shipTypeRequired && (
                                  <span className="flex items-center space-x-1 text-slate-400">
                                    <span>{getShipIcon(dest.shipTypeRequired)}</span>
                                    <span className="text-xs">{getShipLabel(dest.shipTypeRequired)}</span>
                                  </span>
                                )}

                                {dest.dangerLevel && (
                                  <span className="flex items-center space-x-1">
                                    <AlertTriangle className={`w-4 h-4 ${getDangerColor(dest.dangerLevel)}`} />
                                    <span className={`text-xs capitalize ${getDangerColor(dest.dangerLevel)}`}>
                                      {dest.dangerLevel} Risk
                                    </span>
                                  </span>
                                )}
                              </div>

                              {dest.travelTimeMin && dest.travelTimeMax && (
                                <p className="text-xs text-slate-500 mt-2">
                                  Voyage: {Math.floor(dest.travelTimeMin / 24)}d - {Math.floor(dest.travelTimeMax / 24)}d depending on weather
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end space-y-1 ml-4">
                            <div className={`flex items-center space-x-1 text-lg font-bold ${affordable ? 'text-yellow-400' : 'text-red-400'}`}>
                              <Coins className="w-5 h-5" />
                              <span>{dest.fare}</span>
                            </div>
                            {!affordable && (
                              <span className="text-xs text-red-400">Insufficient funds</span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Player Info */}
              <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Your Balance:</span>
                  <span className="flex items-center space-x-1 text-yellow-400 font-semibold">
                    <Coins className="w-4 h-4" />
                    <span>{playerCurrency}</span>
                  </span>
                </div>
              </div>
            </>
          ) : (
            /* Confirmation Screen */
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="inline-flex p-4 bg-blue-600/20 rounded-full border border-blue-500/30 mb-4">
                  <Ship className="w-12 h-12 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Confirm Ocean Voyage</h3>
                <p className="text-slate-400">Review your journey details before booking passage</p>
              </div>

              {selectedDestination && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Departing From</p>
                        <p className="text-white font-semibold">{harborName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Destination</p>
                        <p className="text-white font-semibold">{selectedDestination.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Vessel Type</p>
                        <p className="text-white font-semibold flex items-center space-x-1">
                          <span>{getShipIcon(selectedDestination.shipTypeRequired)}</span>
                          <span>{getShipLabel(selectedDestination.shipTypeRequired)}</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Distance</p>
                        <p className="text-white font-semibold flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{selectedDestination.distance} miles</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Voyage Duration</p>
                        <p className="text-white font-semibold flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{Math.floor(selectedDestination.travelTime / 24)}d {selectedDestination.travelTime % 24}h</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Risk Level</p>
                        <p className={`font-semibold flex items-center space-x-1 capitalize ${getDangerColor(selectedDestination.dangerLevel)}`}>
                          <AlertTriangle className="w-4 h-4" />
                          <span>{selectedDestination.dangerLevel || 'Unknown'}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-700/30">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Passage Fare:</span>
                      <span className="text-2xl font-bold text-yellow-400 flex items-center space-x-1">
                        <Coins className="w-6 h-6" />
                        <span>{selectedDestination.fare}</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-blue-700/30">
                      <span className="text-sm text-slate-400">Balance after payment:</span>
                      <span className="text-yellow-400 font-semibold">
                        {playerCurrency - selectedDestination.fare}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-900/20 rounded-lg border border-amber-700/30">
                    <p className="text-xs text-amber-300 flex items-start space-x-2">
                      <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>
                        Time will advance by {Math.floor(selectedDestination.travelTime / 24)} days and {selectedDestination.travelTime % 24} hours during your voyage.
                        {selectedDestination.travelTimeMin && selectedDestination.travelTimeMax && (
                          <span className="block mt-1">
                            Journey may take {Math.floor(selectedDestination.travelTimeMin / 24)}-{Math.floor(selectedDestination.travelTimeMax / 24)} days depending on weather conditions.
                          </span>
                        )}
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmVoyage}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-900/50"
                >
                  Board Vessel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HarborStationModal;
