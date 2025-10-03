/**
 * components/CampModal.tsx
 * Modal for camping/resting functionality
 */

import React, { useEffect, useState } from 'react';
import { X, Tent, Moon, Sunrise, TreePine, Flame } from 'lucide-react';
import { PlayerCharacter } from '../types/playerCharacter';
import { BiomeType } from '../types/biomes/base';
import { MapData } from '../types/index';
import { GameLogEntry } from '../types/journal';
import { campingService, CampQuality, CampEvent } from '../services/campingService';
import gameSoundsService from '../services/gameSoundsService';
import { getBackgroundPaths, loadBackgroundImage } from '../services/backgroundSelectionService';
import DreamModal from './DreamModal';

interface CampModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerCharacter: PlayerCharacter;
  currentBiome: BiomeType;
  mapData: MapData | null;
  onRest: (healingPercent: number, fatiguePercent: number) => void;
  onExploreCampground: () => void;
  timeOfDay: number;
  gamelog?: GameLogEntry[];
  onStudyStarsToggle?: (isActive: boolean) => void;
  isStudyingStarsFromParent?: boolean;
}

const CampModal: React.FC<CampModalProps> = ({
  isOpen,
  onClose,
  playerCharacter,
  currentBiome,
  mapData,
  onRest,
  onExploreCampground,
  timeOfDay,
  gamelog = [],
  onStudyStarsToggle,
  isStudyingStarsFromParent = false
}) => {
  const [campQuality, setCampQuality] = useState<CampQuality | null>(null);
  const [campEvents, setCampEvents] = useState<CampEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [isResting, setIsResting] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [showDream, setShowDream] = useState(false);
  const [isStudyingStars, setIsStudyingStars] = useState(false);

  // Sync with parent state
  useEffect(() => {
    setIsStudyingStars(isStudyingStarsFromParent);
  }, [isStudyingStarsFromParent]);

  // Reset studying stars state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsStudyingStars(false);
      if (onStudyStarsToggle) {
        onStudyStarsToggle(false);
      }
    }
  }, [isOpen, onStudyStarsToggle]);

  useEffect(() => {
    if (isOpen && playerCharacter) {
      // Calculate camp quality
      const quality = campingService.calculateCampQuality(playerCharacter.inventory);
      setCampQuality(quality);

      // Get camp events
      const hasWaterNearby = currentBiome === BiomeType.RIVER ||
                            currentBiome === BiomeType.BEACH ||
                            currentBiome === BiomeType.FRESHWATER_LAKE;
      const events = campingService.getCampEvents(currentBiome, playerCharacter.inventory, hasWaterNearby);
      setCampEvents(events);

      // Get background image for this biome
      const loadBackground = async () => {
        const backgroundPaths = getBackgroundPaths(
          currentBiome,
          undefined, // no weather for now
          { hours: timeOfDay, minutes: 0 },
          mapData?.culturalZone,
          mapData?.climate,
          mapData?.season
        );

        const backgroundUrl = await loadBackgroundImage(backgroundPaths);
        if (backgroundUrl) {
          setBackgroundImage(backgroundUrl);
        }
      };

      loadBackground();
    }
  }, [isOpen, playerCharacter, currentBiome, mapData, timeOfDay]);

  // Separate effect for music to prevent re-triggering
  useEffect(() => {
    if (isOpen) {
      // Start camping music only when modal opens
      gameSoundsService.stopAllMusic(); // Stop any existing music first
      gameSoundsService.playCampingMusic1();
    }

    return () => {
      // Stop music when modal closes
      if (!isOpen) {
        gameSoundsService.stopAllMusic();
      }
    };
  }, [isOpen]); // Only depend on isOpen to prevent re-triggering

  const handleRest = () => {
    if (!campQuality) return;

    setIsResting(true);

    // Transition from camping music to dream music
    gameSoundsService.stopAllMusic();
    setTimeout(() => {
      gameSoundsService.playCampingMusic3(); // Start dream music
      setShowDream(true);
    }, 1000);
  };

  const handleDreamComplete = () => {
    if (!campQuality) return;

    // Stop dream music and apply healing
    gameSoundsService.stopAllMusic();
    onRest(campQuality.healingPercent, campQuality.fatiguePercent);
    setShowDream(false);
    setIsResting(false);
    // Close the main modal after a brief delay to ensure smooth transition
    setTimeout(() => {
      onClose();
    }, 100);
  };

  const handleExploreCampground = () => {
    // Stop camping music
    gameSoundsService.stopAllMusic();
    onExploreCampground();
    onClose();
  };

  const handleStudyStarsToggle = () => {
    const newState = !isStudyingStars;
    setIsStudyingStars(newState);
    if (onStudyStarsToggle) {
      onStudyStarsToggle(newState);
    }
  };

  const handleEventClick = (eventId: string) => {
    // Special handler for study stars event
    if (eventId === 'study-stars') {
      handleStudyStarsToggle();
      return;
    }

    setSelectedEvent(eventId);
    const event = campEvents.find(e => e.id === eventId);
    if (event) {
      event.effect();
    }
  };

  if (!isOpen || !campQuality) return null;

  // Determine time-based greeting
  const timeGreeting = timeOfDay >= 18 || timeOfDay < 4 ? 'Night has fallen' : 'Evening approaches';

  // Quality stars display
  const renderQualityStars = () => {
    const maxStars = 5;
    const filledStars = Math.floor(campQuality.totalQuality / 2);
    return (
      <div className="flex gap-1">
        {Array.from({ length: maxStars }).map((_, i) => (
          <span key={i} className={i < filledStars ? 'text-yellow-400' : 'text-gray-600'}>
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Background overlay - hide when studying stars */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-500 ${isStudyingStars ? 'bg-opacity-0' : 'bg-opacity-75'}`}
        onClick={isStudyingStars ? undefined : onClose}
      />

      {/* Modal content */}
      <div
        className={`relative w-full max-w-2xl mx-4 rounded-xl shadow-2xl overflow-hidden border transition-all duration-500 ${
          isStudyingStars ? 'border-transparent bg-transparent' : 'border-gray-700'
        }`}
        style={{
          backgroundImage: isStudyingStars ? undefined : (backgroundImage ? `url(${backgroundImage})` : undefined),
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark overlay for text readability - hide when studying stars */}
        <div className={`absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70 transition-opacity duration-500 ${isStudyingStars ? 'opacity-0' : 'opacity-100'}`} />

        {/* Content */}
        <div className={`relative z-10 p-6 transition-opacity duration-500 ${isStudyingStars ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Tent className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  Make Camp
                  <Moon className="w-5 h-5 text-blue-300" />
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Camp Introduction */}
          <div className="mb-5 text-gray-200 text-base leading-relaxed">
            <span className="text-yellow-300 font-medium">{timeGreeting}.</span>{' '}
            {campingService.getBiomeCampIntro(currentBiome)}
          </div>

          {/* Camp Quality */}
          <div className="bg-black/40 backdrop-blur-sm rounded-xl p-5 mb-5 border border-white/10">
            <div className="flex justify-between items-center mb-3">
              <span className="text-white font-semibold text-lg">Camp Quality</span>
              {renderQualityStars()}
            </div>
            <p className="text-gray-200 text-sm mb-4 leading-relaxed">{campQuality.description}</p>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 bg-green-500/10 rounded-lg p-2.5 border border-green-500/20">
                <span className="text-green-400 text-lg">❤️</span>
                <span className="text-gray-200">Health Recovery: <span className="text-green-300 font-semibold">{campQuality.healingPercent}%</span></span>
              </div>
              <div className="flex items-center gap-2 bg-blue-500/10 rounded-lg p-2.5 border border-blue-500/20">
                <span className="text-blue-400 text-lg">💤</span>
                <span className="text-gray-200">Fatigue Recovery: <span className="text-blue-300 font-semibold">{campQuality.fatiguePercent}%</span></span>
              </div>
            </div>
          </div>

          {/* Optional Camp Events */}
          {campEvents.length > 0 && !isResting && (
            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 mb-5 border border-white/10">
              <h3 className="text-white font-semibold mb-3 text-lg">Camp Activities</h3>
              <div className="grid grid-cols-1 gap-2">
                {campEvents.map(event => (
                  <button
                    key={event.id}
                    onClick={() => handleEventClick(event.id)}
                    disabled={!event.available || selectedEvent === event.id}
                    className={`
                      p-3 rounded-lg text-sm transition-all border
                      ${selectedEvent === event.id
                        ? 'bg-green-500/20 text-green-200 border-green-500/40'
                        : event.available
                          ? 'bg-gray-800/50 text-gray-200 hover:bg-gray-700/60 hover:text-white border-gray-600/40'
                          : 'bg-gray-900/30 text-gray-500 cursor-not-allowed border-gray-700/30'
                      }
                    `}
                  >
                    {event.name}
                    {selectedEvent === event.id && ' ✓'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            {/* Primary Action - Rest */}
            <button
              onClick={handleRest}
              disabled={isResting}
              className={`
                flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-semibold text-base
                transition-all transform border-2
                ${isResting
                  ? 'bg-gray-700/50 text-gray-400 cursor-not-allowed border-gray-600'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 border-blue-400/30 hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-500/20'
                }
              `}
            >
              {isResting ? (
                <>
                  <span className="animate-pulse">Resting...</span>
                </>
              ) : (
                <>
                  <Sunrise className="w-5 h-5" />
                  <span>Bed Down for the Night</span>
                </>
              )}
            </button>

            {/* Secondary Action - Explore */}
            {!isResting && (
              <button
                onClick={handleExploreCampground}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl
                         bg-gray-800/60 text-gray-200 hover:bg-gray-700/70 hover:text-white
                         transition-all border border-gray-600/40 hover:border-gray-500/60"
              >
                <TreePine className="w-4 h-4" />
                <span>Explore the Campground</span>
              </button>
            )}
          </div>

          {/* Flavor text */}
          {isResting && (
            <div className="mt-5 text-center text-yellow-300 animate-pulse text-base">
              You drift off to sleep as the stars wheel overhead...
            </div>
          )}
        </div>
      </div>

      {/* Dream Modal */}
      <DreamModal
        isOpen={showDream}
        onClose={() => setShowDream(false)}
        onDreamComplete={handleDreamComplete}
        gamelog={gamelog}
      />
    </div>
  );
};

export default CampModal;