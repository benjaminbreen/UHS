/**
 * components/CampModal.tsx
 * Modal for camping/resting functionality
 * Redesigned with theme-aware styling for light/dark mode
 */

import React, { useEffect, useState } from 'react';
import { X, Tent, Moon, Sunrise, TreePine, Star } from 'lucide-react';
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
  const isNightTime = timeOfDay >= 18 || timeOfDay < 6;

  // Quality stars display
  const renderQualityStars = () => {
    const maxStars = 5;
    const filledStars = Math.floor(campQuality.totalQuality / 2);
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: maxStars }).map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < filledStars ? 'text-amber-400 fill-amber-400' : 'text-[var(--text-muted)]'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background overlay - hide when studying stars */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${isStudyingStars ? 'opacity-0' : 'opacity-100'}`}
        style={{ backgroundColor: 'var(--surface-modal-overlay-bg)' }}
        onClick={isStudyingStars ? undefined : onClose}
      />

      {/* Modal content */}
      <div
        className={`
          relative w-full max-w-lg rounded-2xl overflow-hidden
          transition-all duration-500 animate-in fade-in zoom-in-95
          ${isStudyingStars ? 'opacity-0 pointer-events-none' : 'opacity-100'}
        `}
        style={{
          backgroundColor: 'var(--surface-modal-panel-bg)',
          borderColor: 'var(--border-normal)',
          borderWidth: '1px',
          boxShadow: 'var(--surface-modal-panel-shadow)',
        }}
      >
        {/* Background image header */}
        <div
          className="relative h-32 overflow-hidden"
          style={{
            backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center 30%',
          }}
        >
          {/* Gradient overlay for readability */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%)',
            }}
          />

          {/* Header content */}
          <div className="absolute inset-0 flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div
                className="p-2.5 rounded-xl backdrop-blur-sm"
                style={{ backgroundColor: 'rgba(251, 191, 36, 0.2)' }}
              >
                <Tent className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2 drop-shadow-md">
                  Make Camp
                  {isNightTime ? (
                    <Moon className="w-4 h-4 text-blue-200" />
                  ) : (
                    <Sunrise className="w-4 h-4 text-orange-300" />
                  )}
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/10 backdrop-blur-sm"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="p-5">
          {/* Camp Introduction */}
          <p
            className="text-sm leading-relaxed mb-4"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span className="font-medium" style={{ color: 'var(--accent-secondary)' }}>
              {timeGreeting}.
            </span>{' '}
            {campingService.getBiomeCampIntro(currentBiome)}
          </p>

          {/* Camp Quality Card */}
          <div
            className="rounded-xl p-4 mb-4"
            style={{
              backgroundColor: 'var(--surface-muted-bg)',
              borderColor: 'var(--border-subtle)',
              borderWidth: '1px',
            }}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                Camp Quality
              </span>
              {renderQualityStars()}
            </div>
            <p
              className="text-sm mb-4 leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              {campQuality.description}
            </p>

            {/* Recovery stats */}
            <div className="grid grid-cols-2 gap-3">
              <div
                className="flex items-center gap-2 rounded-lg p-3"
                style={{
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  borderColor: 'rgba(34, 197, 94, 0.2)',
                  borderWidth: '1px',
                }}
              >
                <span className="text-base">❤️</span>
                <div className="text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>Health</span>
                  <span className="ml-1 font-semibold text-green-500 dark:text-green-400">
                    +{campQuality.healingPercent}%
                  </span>
                </div>
              </div>
              <div
                className="flex items-center gap-2 rounded-lg p-3"
                style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  borderColor: 'rgba(59, 130, 246, 0.2)',
                  borderWidth: '1px',
                }}
              >
                <span className="text-base">💤</span>
                <div className="text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>Fatigue</span>
                  <span className="ml-1 font-semibold text-blue-500 dark:text-blue-400">
                    +{campQuality.fatiguePercent}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Optional Camp Events */}
          {campEvents.length > 0 && !isResting && (
            <div
              className="rounded-xl p-4 mb-4"
              style={{
                backgroundColor: 'var(--surface-muted-bg)',
                borderColor: 'var(--border-subtle)',
                borderWidth: '1px',
              }}
            >
              <h3
                className="font-semibold mb-3 text-sm"
                style={{ color: 'var(--text-primary)' }}
              >
                Camp Activities
              </h3>
              <div className="flex flex-wrap gap-2">
                {campEvents.map(event => (
                  <button
                    key={event.id}
                    onClick={() => handleEventClick(event.id)}
                    disabled={!event.available || selectedEvent === event.id}
                    className={`
                      px-3 py-2 rounded-lg text-sm transition-all
                      ${selectedEvent === event.id
                        ? 'ring-2 ring-green-500/50'
                        : ''
                      }
                      ${!event.available
                        ? 'opacity-40 cursor-not-allowed'
                        : 'hover:scale-[1.02] active:scale-[0.98]'
                      }
                    `}
                    style={{
                      backgroundColor: selectedEvent === event.id
                        ? 'rgba(34, 197, 94, 0.15)'
                        : 'var(--surface-card-bg)',
                      color: selectedEvent === event.id
                        ? 'var(--color-success)'
                        : 'var(--text-primary)',
                      borderColor: 'var(--border-subtle)',
                      borderWidth: '1px',
                    }}
                  >
                    {event.name}
                    {selectedEvent === event.id && ' ✓'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5">
            {/* Primary Action - Rest */}
            <button
              onClick={handleRest}
              disabled={isResting}
              className={`
                flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl font-medium text-sm
                transition-all duration-200
                ${isResting
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:scale-[1.01] active:scale-[0.99] hover:shadow-lg'
                }
              `}
              style={{
                background: isResting
                  ? 'var(--surface-muted-bg)'
                  : 'var(--button-primary-bg)',
                color: isResting
                  ? 'var(--text-muted)'
                  : 'var(--button-primary-text)',
              }}
            >
              {isResting ? (
                <span className="animate-pulse">Resting...</span>
              ) : (
                <>
                  <Sunrise className="w-4 h-4" />
                  <span>Bed Down for the Night</span>
                </>
              )}
            </button>

            {/* Secondary Action - Explore */}
            {!isResting && (
              <button
                onClick={handleExploreCampground}
                className="
                  flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm
                  transition-all duration-200
                  hover:scale-[1.01] active:scale-[0.99]
                "
                style={{
                  backgroundColor: 'var(--surface-muted-bg)',
                  color: 'var(--text-secondary)',
                  borderColor: 'var(--border-normal)',
                  borderWidth: '1px',
                }}
              >
                <TreePine className="w-4 h-4" />
                <span>Explore the Campground</span>
              </button>
            )}
          </div>

          {/* Flavor text */}
          {isResting && (
            <p
              className="mt-4 text-center text-sm animate-pulse"
              style={{ color: 'var(--accent-secondary)' }}
            >
              You drift off to sleep as the stars wheel overhead...
            </p>
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
