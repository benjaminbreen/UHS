/**
 * RailroadStationModal.tsx - Railroad station interface with fast travel
 */
import React, { useState, useMemo } from 'react';
import { X, Train, MapPin, Clock, Coins, Users, Info } from 'lucide-react';

interface RailroadStation {
  name: string;
  x: number;
  y: number;
  distance: number; // Distance in tiles
  travelTime: number; // Time in hours
  fare: number; // Cost in coins
}

interface RailroadStationModalProps {
  isOpen: boolean;
  onClose: () => void;
  stationName: string;
  connectedStations: RailroadStation[];
  playerMoney: number;
  currentTime: number; // Hours since game start
  onFastTravel: (station: RailroadStation) => void;
}

const RailroadStationModal: React.FC<RailroadStationModalProps> = ({
  isOpen,
  onClose,
  stationName,
  connectedStations,
  playerMoney,
  currentTime,
  onFastTravel
}) => {
  const [selectedStation, setSelectedStation] = useState<RailroadStation | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isOpen) return null;

  const handleSelectStation = (station: RailroadStation) => {
    setSelectedStation(station);
    setShowConfirm(true);
  };

  const handleConfirmTravel = () => {
    if (selectedStation) {
      onFastTravel(selectedStation);
      onClose();
    }
  };

  const canAfford = (fare: number) => playerMoney >= fare;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-[90vw] max-w-3xl max-h-[85vh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700/50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50 bg-gradient-to-r from-blue-900/20 to-slate-800/50">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-600/20 rounded-xl border border-blue-500/30">
              <Train className="w-7 h-7 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{stationName}</h2>
              <p className="text-sm text-slate-400 mt-1">Railroad Station</p>
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
              {/* Station Info */}
              <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <div className="flex items-center space-x-2 mb-3">
                  <Info className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-semibold text-white">Available Destinations</h3>
                </div>
                <p className="text-sm text-slate-400">
                  Purchase a ticket to travel quickly between connected stations on the railroad network.
                </p>
              </div>

              {/* Destinations List */}
              <div className="space-y-3">
                {connectedStations.length === 0 ? (
                  <div className="text-center py-12">
                    <Train className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">No railroad connections available from this station.</p>
                  </div>
                ) : (
                  connectedStations.map((station, idx) => {
                    const affordable = canAfford(station.fare);
                    return (
                      <button
                        key={idx}
                        onClick={() => affordable && handleSelectStation(station)}
                        disabled={!affordable}
                        className={`w-full p-4 rounded-xl border transition-all ${
                          affordable
                            ? 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 hover:border-blue-500/50 cursor-pointer'
                            : 'bg-slate-900/50 border-slate-800/50 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="p-3 bg-blue-600/10 rounded-lg border border-blue-500/20">
                              <MapPin className="w-6 h-6 text-blue-400" />
                            </div>
                            <div className="text-left">
                              <h4 className="text-lg font-semibold text-white">{station.name}</h4>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-slate-400">
                                <span className="flex items-center space-x-1">
                                  <MapPin className="w-4 h-4" />
                                  <span>{station.distance} miles</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{station.travelTime}h journey</span>
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            <div className={`flex items-center space-x-1 text-lg font-bold ${affordable ? 'text-yellow-400' : 'text-red-400'}`}>
                              <Coins className="w-5 h-5" />
                              <span>{station.fare}</span>
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
                    <span>{playerMoney}</span>
                  </span>
                </div>
              </div>
            </>
          ) : (
            /* Confirmation Screen */
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="inline-flex p-4 bg-blue-600/20 rounded-full border border-blue-500/30 mb-4">
                  <Train className="w-12 h-12 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Confirm Travel</h3>
                <p className="text-slate-400">Review your journey details</p>
              </div>

              {selectedStation && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">From</p>
                        <p className="text-white font-semibold">{stationName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">To</p>
                        <p className="text-white font-semibold">{selectedStation.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Journey Time</p>
                        <p className="text-white font-semibold flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{selectedStation.travelTime} hours</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Distance</p>
                        <p className="text-white font-semibold flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{selectedStation.distance} miles</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-700/30">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Ticket Fare:</span>
                      <span className="text-2xl font-bold text-yellow-400 flex items-center space-x-1">
                        <Coins className="w-6 h-6" />
                        <span>{selectedStation.fare}</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-blue-700/30">
                      <span className="text-sm text-slate-400">Balance after purchase:</span>
                      <span className="text-yellow-400 font-semibold">
                        {playerMoney - selectedStation.fare}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-900/20 rounded-lg border border-amber-700/30">
                    <p className="text-xs text-amber-300 flex items-start space-x-2">
                      <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>Time will advance by {selectedStation.travelTime} hours during your journey.</span>
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
                  onClick={handleConfirmTravel}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-900/50"
                >
                  Board Train
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RailroadStationModal;
