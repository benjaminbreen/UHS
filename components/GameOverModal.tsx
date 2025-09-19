import React, { useEffect } from 'react';
import { Skull, Heart, Calendar, MapPin, RotateCcw, Home, Star, Compass, Swords, Mountain } from 'lucide-react';
import { Disease } from '../types/diseaseTypes';
import gameSoundsService from '../services/gameSoundsService';

interface GameOverModalProps {
  isOpen: boolean;
  causeOfDeath: {
    type: 'disease' | 'starvation' | 'violence' | 'accident' | 'old_age' | 'combat' | 'terrain' | 'drowning' | 'exhaustion' | 'poison';
    disease?: Disease;
    description?: string;
    opponent?: string;
    terrain?: string;
  };
  playerStats: {
    name?: string;
    age?: number;
    daysAlive: number;
    location?: string;
    year?: number;
    profession?: string;
    culturalZone?: string;
    distanceTraveled?: number;
    itemsCollected?: number;
    questsCompleted?: number;
    npcsMetTotal?: number;
  };
  achievements?: string[];
  onRestart: () => void;
  onMainMenu: () => void;
  onRespawn?: (mode: 'descendant' | 'same-location' | 'random') => void;
}

const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  causeOfDeath,
  playerStats,
  achievements = [],
  onRestart,
  onMainMenu,
  onRespawn
}) => {
  // Play peaceful music when modal opens
  useEffect(() => {
    if (isOpen) {
      gameSoundsService.playFishingMusic();
    }
    return () => {
      gameSoundsService.stopFishingMusic();
    };
  }, [isOpen]);

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
      case 'combat':
        return causeOfDeath.opponent
          ? `Fell in battle against ${causeOfDeath.opponent}`
          : 'Died in combat';
      case 'terrain':
        return causeOfDeath.terrain
          ? `Perished in the harsh ${causeOfDeath.terrain}`
          : 'Succumbed to harsh terrain';
      case 'drowning':
        return 'Lost to the depths';
      case 'exhaustion':
        return 'Collapsed from exhaustion';
      case 'poison':
        return 'Succumbed to toxic substances';
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
      case 'combat':
        return 'They fought bravely to the end, their courage never wavering even as darkness closed in.';
      case 'terrain':
        return 'The unforgiving landscape claimed another soul, as it had countless others before.';
      case 'drowning':
        return 'The waters that give life also take it away, pulling them into eternal depths.';
      case 'exhaustion':
        return 'They pushed beyond mortal limits, their spirit willing but flesh unable to continue.';
      case 'poison':
        return 'Hidden dangers lurk everywhere; what seemed harmless proved fatal.';
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

  // Check if death.png exists, otherwise use a fallback gradient
  const deathBackgroundStyle = {
    backgroundImage: 'url(/combat-backgrounds/death.png), linear-gradient(to bottom, #1a0f1f, #2d1b3d, #1a0f1f)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundBlendMode: 'overlay' as const
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 death-modal-container" style={deathBackgroundStyle}>
      <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg shadow-2xl max-w-2xl w-full border border-gray-700 death-modal-content">
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

          {/* Legacy Section */}
          {(playerStats.distanceTraveled || playerStats.itemsCollected || playerStats.questsCompleted || playerStats.npcsMetTotal) && (
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400" />
                Legacy
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {playerStats.distanceTraveled && (
                  <div className="flex items-center gap-2">
                    <Compass className="w-3 h-3 text-blue-400" />
                    <span className="text-gray-400">Distance Traveled:</span>
                    <span className="text-gray-200">{playerStats.distanceTraveled} km</span>
                  </div>
                )}
                {playerStats.itemsCollected && (
                  <div className="flex items-center gap-2">
                    <Star className="w-3 h-3 text-yellow-400" />
                    <span className="text-gray-400">Items Collected:</span>
                    <span className="text-gray-200">{playerStats.itemsCollected}</span>
                  </div>
                )}
                {playerStats.questsCompleted !== undefined && (
                  <div className="flex items-center gap-2">
                    <Swords className="w-3 h-3 text-red-400" />
                    <span className="text-gray-400">Quests Completed:</span>
                    <span className="text-gray-200">{playerStats.questsCompleted}</span>
                  </div>
                )}
                {playerStats.npcsMetTotal && (
                  <div className="flex items-center gap-2">
                    <Heart className="w-3 h-3 text-pink-400" />
                    <span className="text-gray-400">People Met:</span>
                    <span className="text-gray-200">{playerStats.npcsMetTotal}</span>
                  </div>
                )}
              </div>
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