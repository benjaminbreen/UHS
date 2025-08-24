import React from 'react';
import { Skull, Heart, Calendar, MapPin, RotateCcw, Home } from 'lucide-react';
import { Disease } from '../types/diseaseTypes';

interface GameOverModalProps {
  isOpen: boolean;
  causeOfDeath: {
    type: 'disease' | 'starvation' | 'violence' | 'accident' | 'old_age';
    disease?: Disease;
    description?: string;
  };
  playerStats: {
    name?: string;
    age?: number;
    daysAlive: number;
    location?: string;
    year?: number;
  };
  achievements?: string[];
  onRestart: () => void;
  onMainMenu: () => void;
}

const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  causeOfDeath,
  playerStats,
  achievements = [],
  onRestart,
  onMainMenu
}) => {
  if (!isOpen) return null;

  const getCauseOfDeathText = () => {
    switch (causeOfDeath.type) {
      case 'disease':
        return causeOfDeath.disease 
          ? `Succumbed to ${causeOfDeath.disease.name}`
          : 'Died from illness';
      case 'starvation':
        return 'Died from starvation';
      case 'violence':
        return causeOfDeath.description || 'Killed in combat';
      case 'accident':
        return causeOfDeath.description || 'Died in an accident';
      case 'old_age':
        return 'Died peacefully of old age';
      default:
        return 'Met an untimely end';
    }
  };

  const getEpitaph = () => {
    if (causeOfDeath.type === 'disease' && causeOfDeath.disease) {
      const disease = causeOfDeath.disease;
      if (disease.severity === 'critical') {
        return `Another victim of the terrible ${disease.name}, which claimed so many in those dark times.`;
      } else if (disease.severity === 'severe') {
        return `After a valiant struggle against ${disease.name}, they finally found peace.`;
      } else {
        return `Though the illness seemed mild at first, ${disease.name} proved fatal in the end.`;
      }
    }
    
    switch (causeOfDeath.type) {
      case 'starvation':
        return 'In those harsh times, even the strongest could fall to hunger.';
      case 'violence':
        return 'They lived by the sword and died by it, as was common in those turbulent days.';
      case 'old_age':
        return 'A rare blessing to die peacefully in bed, having seen many seasons pass.';
      default:
        return 'Their story ends here, but their memory lives on.';
    }
  };

  const getHistoricalContext = () => {
    if (!playerStats.year) return null;
    
    if (causeOfDeath.type === 'disease' && causeOfDeath.disease) {
      const disease = causeOfDeath.disease;
      
      // Special historical contexts for specific diseases
      if (disease.id === 'BUBONIC_PLAGUE' && playerStats.year >= 1347 && playerStats.year <= 1351) {
        return 'You were one of the estimated 75-200 million who perished in the Black Death, the most devastating pandemic in recorded history.';
      } else if (disease.id === 'SPANISH_FLU' && playerStats.year >= 1918 && playerStats.year <= 1920) {
        return 'You joined the 50-100 million victims of the Spanish Flu, which killed more people than World War I.';
      } else if (disease.id === 'SMALLPOX' && playerStats.location?.includes('America')) {
        return 'Smallpox devastated indigenous populations after European contact, killing an estimated 90% in some areas.';
      } else if (disease.id === 'SWEATING_SICKNESS') {
        return 'The mysterious English Sweating Sickness could kill within hours. Its cause remains unknown to this day.';
      }
    }
    
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg shadow-2xl max-w-2xl w-full border border-gray-700">
        {/* Header with skull icon */}
        <div className="bg-gradient-to-r from-red-900/50 to-gray-900 p-6 rounded-t-lg border-b border-gray-700">
          <div className="flex items-center justify-center gap-4">
            <Skull className="w-12 h-12 text-red-400" />
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white">Death</h1>
              <p className="text-gray-300 mt-1">{getCauseOfDeathText()}</p>
            </div>
            <Skull className="w-12 h-12 text-red-400" />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Epitaph */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className="text-gray-300 italic text-center leading-relaxed">
              "{getEpitaph()}"
            </p>
          </div>

          {/* Historical Context */}
          {getHistoricalContext() && (
            <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-700/50">
              <p className="text-blue-300 text-sm text-center">
                {getHistoricalContext()}
              </p>
            </div>
          )}

          {/* Player Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-4 h-4 text-red-400" />
                <h3 className="text-sm font-semibold text-gray-300">Life Summary</h3>
              </div>
              <div className="space-y-1 text-sm">
                {playerStats.name && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Name:</span>
                    <span className="text-gray-200">{playerStats.name}</span>
                  </div>
                )}
                {playerStats.age && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Age:</span>
                    <span className="text-gray-200">{playerStats.age} years</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Days Survived:</span>
                  <span className="text-gray-200">{playerStats.daysAlive}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-green-400" />
                <h3 className="text-sm font-semibold text-gray-300">Final Details</h3>
              </div>
              <div className="space-y-1 text-sm">
                {playerStats.location && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Location:</span>
                    <span className="text-gray-200">{playerStats.location}</span>
                  </div>
                )}
                {playerStats.year && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Year:</span>
                    <span className="text-gray-200">{playerStats.year}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Disease Details */}
          {causeOfDeath.type === 'disease' && causeOfDeath.disease && (
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Disease Information</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between bg-gray-900 rounded px-2 py-1">
                  <span className="text-gray-400">Type:</span>
                  <span className="text-gray-200 capitalize">{causeOfDeath.disease.type}</span>
                </div>
                <div className="flex justify-between bg-gray-900 rounded px-2 py-1">
                  <span className="text-gray-400">Severity:</span>
                  <span className="text-gray-200 capitalize">{causeOfDeath.disease.severity}</span>
                </div>
                <div className="flex justify-between bg-gray-900 rounded px-2 py-1">
                  <span className="text-gray-400">Transmission:</span>
                  <span className="text-gray-200 capitalize">{causeOfDeath.disease.transmissionVector}</span>
                </div>
                <div className="flex justify-between bg-gray-900 rounded px-2 py-1">
                  <span className="text-gray-400">Mortality Rate:</span>
                  <span className="text-red-400">{(causeOfDeath.disease.mortalityRate * 100).toFixed(0)}%</span>
                </div>
              </div>
              {causeOfDeath.disease.symptoms && causeOfDeath.disease.symptoms.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-400 mb-1">Final Symptoms:</p>
                  <p className="text-xs text-gray-300">
                    {causeOfDeath.disease.symptoms.map(s => s.name).join(', ')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Achievements */}
          {achievements.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Achievements</h3>
              <div className="flex flex-wrap gap-2">
                {achievements.map((achievement, index) => (
                  <span key={index} className="bg-gray-700 text-xs text-gray-300 px-2 py-1 rounded">
                    {achievement}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={onRestart}
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Try Again
            </button>
            <button
              onClick={onMainMenu}
              className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Main Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameOverModal;