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
  gamelog = []
}) => {
  const [campQuality, setCampQuality] = useState<CampQuality | null>(null);
  const [campEvents, setCampEvents] = useState<CampEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [isResting, setIsResting] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [showDream, setShowDream] = useState(false);

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

      // Start camping music (track 1)
      gameSoundsService.playCampingMusic1();

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

    return () => {
      // Stop music when modal closes
      gameSoundsService.stopAllMusic();
    };
  }, [isOpen, playerCharacter, currentBiome, mapData, timeOfDay]);

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

  const handleEventClick = (eventId: string) => {
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
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-80" onClick={onClose} />

      {/* Modal content */}
      <div
        className="relative w-full max-w-2xl mx-4 bg-gray-900 rounded-lg shadow-2xl overflow-hidden"
        style={{
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black bg-opacity-60" />

        {/* Content */}
        <div className="relative z-10 p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <Tent className="w-6 h-6 text-yellow-500" />
              <h2 className="text-2xl font-bold text-white">Make Camp</h2>
              <Moon className="w-5 h-5 text-blue-300" />
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Camp Introduction */}
          <div className="mb-4 text-gray-300 italic">
            {timeGreeting}. {campingService.getBiomeCampIntro(currentBiome)}
          </div>

          {/* Camp Quality */}
          <div className="bg-black bg-opacity-50 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white font-semibold">Camp Quality</span>
              {renderQualityStars()}
            </div>
            <p className="text-gray-300 text-sm mb-3">{campQuality.description}</p>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-green-400">❤️</span>
                <span className="text-gray-300">Health Recovery: {campQuality.healingPercent}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-400">💤</span>
                <span className="text-gray-300">Fatigue Recovery: {campQuality.fatiguePercent}%</span>
              </div>
            </div>
          </div>

          {/* Optional Camp Events */}
          {campEvents.length > 0 && !isResting && (
            <div className="bg-black bg-opacity-50 rounded-lg p-4 mb-4">
              <h3 className="text-white font-semibold mb-2">Camp Activities</h3>
              <div className="grid grid-cols-2 gap-2">
                {campEvents.map(event => (
                  <button
                    key={event.id}
                    onClick={() => handleEventClick(event.id)}
                    disabled={!event.available || selectedEvent === event.id}
                    className={`
                      p-2 rounded text-sm transition-all
                      ${selectedEvent === event.id
                        ? 'bg-green-800 text-white'
                        : event.available
                          ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                          : 'bg-gray-900 text-gray-600 cursor-not-allowed'
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
                flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-semibold
                transition-all transform hover:scale-105
                ${isResting
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500'
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
                className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg
                         bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white
                         transition-colors"
              >
                <TreePine className="w-4 h-4" />
                <span>Explore the Campground</span>
              </button>
            )}
          </div>

          {/* Flavor text */}
          {isResting && (
            <div className="mt-4 text-center text-yellow-400 animate-pulse">
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