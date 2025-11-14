/**
 * components/SkillsModal.tsx - A modal to display the results of a player skill.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { SkillResult, ObserveSkillResult, ForageSkillResult, DigSkillResult, ChopSkillResult, StudySkillResult, CulturalZone, ClimateType, Season, WeatherState } from '../types';
import { usePlayer } from '../contexts/PlayerContext';
import { useMap } from '../contexts/MapContext';
import { useGame } from '../contexts/GameContext';
import { useUI } from '../contexts/UIContext';
import { gameSounds } from '../services/gameSoundsService';
import { imageGenerationService } from '../services/imageGenerationService';
import {
  getBackgroundPaths,
  loadBackgroundImage,
  isNightTime,
  getNightFilter,
  getNightOverlayGradient,
  getNightOverlayIntensity
} from '../services/backgroundSelectionService';
import WeatherEffects from './WeatherEffects';
import { journalService } from '../services/journalService';
import type { JournalEntry } from './JournalViewport';
import { BookOpen } from 'lucide-react';

interface SkillsModalProps {
    isOpen: boolean;
    isLoading: boolean;
    result: SkillResult;
    onClose: () => void;
}

// Helper function to properly capitalize item names (converts ALL_CAPS to Title Case)
const formatItemName = (name: string): string => {
    // If the entire string is uppercase (like "PAPER BIRCH LOG"), convert to title case
    if (name === name.toUpperCase() && name.includes('_')) {
        return name
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }
    // If it's all caps but no underscores (like "WOOD")
    if (name === name.toUpperCase()) {
        return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    }
    // Otherwise return as-is (already properly formatted)
    return name;
};

// Helper function to generate contextual advice
const getContextualAdvice = (result: SkillResult): { calculation: string; advice: string } => {
    if (!result) return { calculation: '', advice: '' };

    const type = result.type;
    const success = (result as any).success;

    // Success calculations and advice
    if (success) {
        switch(type) {
            case 'forage':
                return {
                    calculation: 'Base Success: 60% • Biome Bonus: +20% • Tool Bonus: +10% • Final: 90%',
                    advice: 'Great work! Action buttons like Forage (F), Dig (D), and Chop (C) can be used to interact with the environment. Different biomes yield different items - try foraging in various locations for unique finds!'
                };
            case 'dig':
                return {
                    calculation: 'Base Success: 50% • Terrain Type: +30% • Equipped Tool: +15% • Final: 95%',
                    advice: 'Excellent digging! The Dig action works best with proper tools equipped. Shovels and pickaxes greatly increase success rates. Different terrains contain different minerals - beaches have shells, deserts have fossils!'
                };
            case 'chop':
                return {
                    calculation: 'Base Success: 40% • Tree Health: +20% • Axe Quality: +25% • Strength: +10% • Final: 95%',
                    advice: 'Nice chopping! Axes and hatchets make chopping much more effective. Different tree types yield different wood qualities. Some rare trees drop special materials!'
                };
            case 'observe':
                return {
                    calculation: 'Wisdom Check: 15 • Your Wisdom: 18 • Success!',
                    advice: 'Your keen observation reveals hidden details! The Observe action becomes more detailed with higher Wisdom. Use it to learn about your surroundings and discover hidden opportunities.'
                };
            case 'study':
                const studyResult = result as any;
                return {
                    calculation: `${studyResult.actionEmoji} ${studyResult.action} • Intelligence Check: Success!`,
                    advice: 'Your scholarly analysis reveals new insights! Study actions help you understand items and phenomena in historical context. Try different study approaches for unique perspectives.'
                };
            default:
                return {
                    calculation: 'Action succeeded based on your skills and equipment.',
                    advice: 'Well done! Keep exploring and trying different actions to discover more about the world.'
                };
        }
    }

    // Failure calculations and advice
    const message = (result as any).message || '';

    // Analyze failure reason from message
    if (message.toLowerCase().includes('tool')) {
        return {
            calculation: 'Base Success: 30% • No Tool Equipped: -40% • Final: Failed',
            advice: 'You need the right tool for this job! Equip a pickaxe for mining, an axe for chopping, or a shovel for digging. Tools can be crafted, purchased from marketplaces, or found while exploring.'
        };
    } else if (message.toLowerCase().includes('nothing') || message.toLowerCase().includes('empty')) {
        return {
            calculation: 'Resource Check: Roll 1-100 • Result: 87 • Threshold: 85 • No resources found',
            advice: 'This area has been depleted or has low resources. Try moving to a different location or biome. Dense forests and jungles have higher biodiversity for foraging!'
        };
    } else if (message.toLowerCase().includes('hard') || message.toLowerCase().includes('tough')) {
        return {
            calculation: 'Strength Check: 8 • Required: 12 • Failed',
            advice: 'You lack the strength for this task. Level up your character, equip better tools, or consume items that boost your strength temporarily.'
        };
    } else if (message.toLowerCase().includes('skill')) {
        return {
            calculation: 'Skill Level: 2 • Required: 5 • Failed',
            advice: 'Your skill level is too low. Practice this action on easier targets to gain experience. Each successful attempt grants XP to improve your abilities.'
        };
    } else {
        return {
            calculation: 'Random Roll: 23 • Success Threshold: 50 • Failed',
            advice: 'Bad luck this time! Try again - persistence often pays off. Consider moving to a different spot or waiting for better conditions.'
        };
    }
};

const MoreInfoSection: React.FC<{ result: SkillResult }> = ({ result }) => {
    const isSuccess = (result as any)?.success !== false;
    // Default to closed
    const [isExpanded, setIsExpanded] = useState(false);
    const { calculation, advice } = getContextualAdvice(result);

    return (
        <div className="mt-4 border-t border-slate-600/50 pt-3">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`w-full flex items-center justify-between text-sm transition-colors duration-200 ${isSuccess ? 'text-slate-400 hover:text-slate-300' : 'text-yellow-400 hover:text-yellow-300'}`}
            >
                <span className="font-medium flex items-center gap-1">
                    {isSuccess ? '💡 Tips & Information' : '💡 How to Improve'}
                </span>
                <div className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 10.5l-4-4h8l-4 4z"/>
                    </svg>
                </div>
            </button>

            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="mt-3 p-4 bg-slate-800/30 rounded-lg border border-slate-700/30 space-y-3">
                    {/* Calculation Section */}
                    <div>
                        <h4 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${isSuccess ? 'text-slate-400' : 'text-red-400'}`}>
                            {isSuccess ? 'Calculation' : 'Why It Failed'}
                        </h4>
                        <div className="text-xs text-slate-300 font-mono bg-slate-900/50 p-2 rounded">
                            {calculation}
                        </div>
                    </div>

                    {/* Advice Section */}
                    <div>
                        <h4 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${isSuccess ? 'text-slate-400' : 'text-yellow-400'}`}>
                            {isSuccess ? 'Tips' : 'What You Need'}
                        </h4>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            {advice}
                        </p>
                    </div>

                    {/* Additional Stats if available */}
                    {(result as any).xpGained && (
                        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-700/30">
                            <span>Experience Gained</span>
                            <span className="text-yellow-400 font-semibold">+{(result as any).xpGained} XP</span>
                        </div>
                    )}

                    {(result as any).reputationChange && (
                        <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>Reputation Change</span>
                            <span className={(result as any).reputationChange > 0 ? 'text-green-400' : 'text-red-400'}>
                                {(result as any).reputationChange > 0 ? '+' : ''}{(result as any).reputationChange}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Helper function to get weather suffix for background naming
const getWeatherSuffix = (weatherState?: WeatherState): string | null => {
  if (!weatherState) return null;
  if (weatherState.precipitation === 'rain') return 'rain';
  if (weatherState.precipitation === 'snow') return 'snow';
  if (weatherState.precipitation === 'drizzle') return 'rain'; // Use rain variant for drizzle
  if (weatherState.special === 'fog' || weatherState.special === 'mist') return 'fog';
  return null;
};

// Helper function to get time suffix for background naming
const getTimeSuffix = (gameTime?: { hours: number; minutes: number }): string | null => {
  if (!gameTime) return null;
  const currentTime = gameTime.hours + gameTime.minutes / 60;
  // Night: 10pm-4am
  if (currentTime >= 22 || currentTime < 4) {
    return 'night';
  }
  // Crepuscular: dawn (4-8am) & dusk (6-9pm)
  if ((currentTime >= 4 && currentTime < 8) || (currentTime >= 18 && currentTime < 21)) {
    return 'crepuscular';
  }
  return null; // Day time uses base backgrounds
};

// Helper function to get culture suffix for background naming
const getCultureSuffix = (culture?: CulturalZone): string | null => {
  if (!culture) return null;
  const cultureMapping: { [key: string]: string } = {
    'EUROPEAN': 'european',
    'EAST_ASIAN': 'east_asian',
    'MENA': 'mena',
    'NORTH_AMERICAN_PRE_COLUMBIAN': 'precolumbian',
    'NORTH_AMERICAN_COLONIAL': 'colonial',
    'OCEANIA': 'oceania',
    'SOUTH_ASIAN': 'south_asian',
    'SOUTH_AMERICAN': 'south_american',
    'SUB_SAHARAN_AFRICAN': 'african'
  };
  return cultureMapping[culture] || null;
};

// Get climate-specific suffix for background naming
const getClimateSuffix = (
  climate?: ClimateType,
  season?: Season
): string | null => {
  if (!climate) return null;

  switch(climate) {
    case ClimateType.COLD:
      return 'snow'; // Always snowy appearance in cold climates

    case ClimateType.ARID:
      return 'arid'; // Dry, dusty appearance

    case ClimateType.TROPICAL:
      return 'tropical'; // Lush, humid appearance

    case ClimateType.MEDITERRANEAN:
      // Only arid-looking in summer/fall (dry season)
      if (season === 'SUMMER' || season === 'FALL') {
        return 'arid';
      }
      return null; // Spring/winter use standard backgrounds

    case ClimateType.TEMPERATE:
      // Snowy appearance in winter for temperate climates
      if (season === 'WINTER') {
        return 'snow';
      }
      return null; // Spring/summer/fall use standard backgrounds

    default:
      return null; // Semitropical uses standard (could be made tropical too if desired)
  }
};

const ObserveResultWithBackground: React.FC<{ result: ObserveSkillResult; onClose: () => void }> = ({ result, onClose }) => {
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [backgroundLoading, setBackgroundLoading] = useState(false); // Track background loading state
  const [isUsingNightImage, setIsUsingNightImage] = useState(false);

  // Access context data for climate and season
  const { mapData } = useMap();
  const { season } = useGame();

  // Use context from the result which has the CORRECT position and biome
  const observeContext = result.context || {};

  // Use game time from context or calculate from time of day as fallback
  const gameTime = useMemo(() => {
    // Prefer the exact gameTime if available
    if (observeContext.gameTime) {
      return observeContext.gameTime;
    }

    // Fallback to timeOfDay conversion
    const timeOfDay = observeContext.timeOfDay;
    const hour = timeOfDay === 'DAWN' ? 6 :
                 timeOfDay === 'MORNING' ? 9 :
                 timeOfDay === 'NOON' ? 12 :
                 timeOfDay === 'AFTERNOON' ? 15 :
                 timeOfDay === 'EVENING' ? 18 :
                 timeOfDay === 'DUSK' ? 20 :
                 timeOfDay === 'NIGHT' ? 22 : 12;
    return { hours: hour, minutes: 0 };
  }, [observeContext.timeOfDay, observeContext.gameTime]);

  // Calculate night overlay intensity
  const nightIntensity = useMemo(() => {
    return getNightOverlayIntensity(gameTime);
  }, [gameTime]);

  // Only apply tinting if we're not using a custom night image
  const shouldApplyNightTint = useMemo(() => {
    return nightIntensity > 0 && !isUsingNightImage;
  }, [nightIntensity, isUsingNightImage]);

  // Use biome from context (this is the ACTUAL biome where the skill was executed)
  const currentBiome = observeContext.biome || 'GRASSLAND';
  const culturalZone = observeContext.culturalZone;
  const weather = observeContext.weather;

  console.log('[ObserveModal] Using context from result:', {
    biome: currentBiome,
    position: { x: observeContext.playerX, y: observeContext.playerY },
    culture: culturalZone,
    weather: weather,
    timeOfDay: observeContext.timeOfDay
  });

  // Load appropriate background
  // OPTIMISTIC UI: Delay background loading to show modal instantly
  useEffect(() => {
    // Small delay so modal appears instantly
    const timer = setTimeout(() => {
      setBackgroundLoading(true);

      const loadBackground = async () => {
        // Wait a tick to ensure weather is fully populated
        await new Promise(resolve => setTimeout(resolve, 0));

      console.log('[ObserveModal] loadBackground called with weather:', {
        weather,
        precipitation: weather?.precipitation,
        special: weather?.special,
        hasWeather: !!weather,
        weatherStringified: JSON.stringify(weather)
      });

      const paths = getBackgroundPaths(
        currentBiome,
        weather,
        gameTime,
        culturalZone,
        mapData?.climate,
        season
      );

      console.log('[ObserveModal] Climate-aware background selection:', {
        biome: currentBiome,
        culture: culturalZone,
        weather: weather,
        weatherPrecipitation: weather?.precipitation,
        weatherSpecial: weather?.special,
        weatherIntensity: weather?.intensity,
        weatherFullObject: JSON.stringify(weather),
        time: gameTime,
        climate: mapData?.climate,
        season: season,
        climateSuffix: getClimateSuffix(mapData?.climate, season),
        pathsToCheck: paths.slice(0, 10) // Show first 10 paths for debugging
      });

      // Use the same loadBackgroundImage function as POV viewport
      const backgroundUrl = await loadBackgroundImage(paths);

      // Check if we loaded a night-specific image
      const usingNightImage = backgroundUrl ? backgroundUrl.includes('_night') : false;
      setIsUsingNightImage(usingNightImage);

        console.log('[ObserveModal] Found background:', backgroundUrl);
        setBackgroundImage(backgroundUrl);
        setBackgroundLoading(false);
      };

      loadBackground();
    }, 100); // 100ms delay - modal renders first, then loads background

    return () => clearTimeout(timer);
  }, [currentBiome, culturalZone, weather, gameTime, mapData?.climate, season]);

  // Start environmental soundscape when modal opens
  useEffect(() => {
    console.log('[ObserveModal] Starting environmental soundscape for biome:', currentBiome);
    gameSounds.playEnvironmentalSoundscape(currentBiome, weather);

    // Cleanup: stop soundscape when modal closes
    return () => {
      console.log('[ObserveModal] Stopping environmental soundscape');
      gameSounds.stopEnvironmentalSoundscape();
    };
  }, [currentBiome, weather]);

  // If no background available, render standard modal
  if (!backgroundImage) {
    return (
      <>
        <h3 id="skill-modal-title" className="text-xl font-semibold text-blue-300 mb-4 capitalize">Observation</h3>
        <p className="text-gray-300 whitespace-pre-wrap">{result.description}</p>
        {result.xpGained && <p className="text-sm text-yellow-400 mt-4 font-semibold">+{result.xpGained} XP</p>}
      </>
    );
  }

  // Render full-screen observation with background
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose} style={{ margin: 0, padding: 0 }}>
      {/* Background layer */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: shouldApplyNightTint ? getNightFilter(nightIntensity) : 'none'
        }}
      />

      {/* Night overlay with blend mode - only if not using custom night image */}
      {shouldApplyNightTint && (
        <div
          className="absolute inset-0"
          style={{
            background: getNightOverlayGradient(nightIntensity),
            mixBlendMode: 'multiply' as any,
            transition: 'opacity 2s ease-in-out'
          }}
        />
      )}

      {/* Weather effects overlay */}
      {observeContext.weather && (
        <WeatherEffects
          weather={observeContext.weather}
        />
      )}

      {/* Gradient overlay for text visibility */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.8) 30%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 70%, transparent 100%)'
        }}
      />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 lg:p-16 max-w-5xl mx-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 drop-shadow-2xl">
          Environmental Observation
        </h2>
        <div className="prose prose-lg prose-invert max-w-none">
          <p className="text-gray-100 text-lg md:text-xl leading-relaxed whitespace-pre-wrap drop-shadow-lg">
            {result.description}
          </p>
        </div>
        {result.xpGained && (
          <p className="text-yellow-400 text-lg font-semibold mt-6 drop-shadow-lg">
            +{result.xpGained} Experience Gained
          </p>
        )}

        {/* Close button */}
        <button
          className="mt-8 px-8 py-3 bg-slate-800/80 hover:bg-slate-700/80 text-white font-semibold rounded-lg transition-all duration-200 backdrop-blur-sm border border-slate-600/50 shadow-xl"
          onClick={onClose}
        >
          Continue Exploring
        </button>
      </div>
    </div>
  );
};

const renderObserveResult = (result: ObserveSkillResult, onClose: () => void) => (
  <ObserveResultWithBackground result={result} onClose={onClose} />
);

const renderForageResult = (result: ForageSkillResult, isToolRelatedFailure: (msg: string) => boolean, handleOpenEquipment: () => void) => {
    const rarityColor = {
        'Common': 'text-gray-300',
        'Uncommon': 'text-blue-400',
        'Rare': 'text-purple-400',
        'Ultra-rare': 'text-yellow-400',
        'Unique': 'text-amber-400 font-bold'
    };

    const isSuccess = result.success && result.item;

    return (
        <>
            {/* Header with Icon */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 ${isSuccess ? 'bg-green-500/20' : 'bg-red-500/20'} rounded-full flex items-center justify-center ${isSuccess ? 'animate-[checkmark_0.5s_ease-out]' : 'animate-[shake_0.5s_ease-out]'}`}>
                        {isSuccess ? (
                            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                            </svg>
                        ) : (
                            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        )}
                    </div>
                    <div>
                        <h3 id="skill-modal-title" className={`text-xl font-semibold ${isSuccess ? 'text-green-300' : 'text-red-300'}`}>
                            {isSuccess ? 'Foraging Success!' : 'Foraging Failed'}
                        </h3>
                        <p className="text-xs text-slate-400">{result.context?.biome || 'Unknown'} Biome</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className={`text-2xl font-bold ${result.xpGained ? 'text-yellow-400' : 'text-slate-500'}`}>
                        {result.xpGained ? `+${result.xpGained}` : '+0'} XP
                    </div>
                </div>
            </div>

            {/* Quick Stats Summary */}
            {isSuccess && result.item && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-slate-700/50 p-2 rounded-lg text-center border border-slate-600/50">
                        <div className="text-xs text-slate-400">Rarity</div>
                        <div className={`text-sm font-bold ${rarityColor[result.item.rarity as keyof typeof rarityColor]}`}>
                            {result.item.rarity}
                        </div>
                    </div>
                    <div className="bg-slate-700/50 p-2 rounded-lg text-center border border-slate-600/50">
                        <div className="text-xs text-slate-400">XP Gained</div>
                        <div className="text-sm text-yellow-400 font-bold">+{result.xpGained || 0}</div>
                    </div>
                    <div className="bg-slate-700/50 p-2 rounded-lg text-center border border-slate-600/50">
                        <div className="text-xs text-slate-400">Value</div>
                        <div className="text-sm text-green-400 font-bold">{result.item.value || 0}💰</div>
                    </div>
                </div>
            )}

            {/* Item Found or Failure Message */}
            {isSuccess && result.item ? (
                <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 p-4 rounded-lg border-2 border-purple-500/40 mb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-purple-500/20 rounded-lg flex items-center justify-center text-4xl">
                            {result.item.emoji || '🌿'}
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-xl text-white">You found: {formatItemName(result.item.name)}</p>
                            <p className={`font-semibold text-sm ${rarityColor[result.item.rarity as keyof typeof rarityColor]}`}>
                                Rarity: {result.item.rarity}
                            </p>
                            {result.item.quantity && result.item.quantity > 1 && (
                                <p className="text-xs text-slate-300 mt-1">Quantity: {result.item.quantity}</p>
                            )}
                        </div>
                    </div>
                    {result.item.description && (
                        <p className="text-sm italic text-slate-300 mt-3 border-t border-purple-500/20 pt-3">
                            "{result.item.description}"
                        </p>
                    )}
                </div>
            ) : (
                <div className="bg-red-900/20 p-4 rounded-lg border-2 border-red-500/30 mb-4">
                    <div className="flex items-start gap-3">
                        <div className="text-3xl">🔍</div>
                        <div className="flex-1">
                            <p className="font-bold text-lg text-red-300 mb-2">Nothing Found</p>
                            <p className="text-sm text-slate-300 mb-3">{result.message}</p>
                            {isToolRelatedFailure(result.message) && (
                                <button
                                    onClick={handleOpenEquipment}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition duration-150 flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                    </svg>
                                    Open Equipment Panel
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

const renderDigResult = (result: DigSkillResult, isToolRelatedFailure: (msg: string) => boolean, handleOpenEquipment: () => void) => {
    const rarityColor = {
        'Common': 'text-gray-300',
        'Uncommon': 'text-blue-400',
        'Rare': 'text-purple-400',
        'Ultra-rare': 'text-yellow-400',
        'Unique': 'text-amber-400 font-bold'
    };

    const isSuccess = result.success && result.item;

    return (
        <>
            {/* Header with Icon */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 ${isSuccess ? 'bg-green-500/20' : 'bg-red-500/20'} rounded-full flex items-center justify-center ${isSuccess ? 'animate-[checkmark_0.5s_ease-out]' : 'animate-[shake_0.5s_ease-out]'}`}>
                        {isSuccess ? (
                            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                            </svg>
                        ) : (
                            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        )}
                    </div>
                    <div>
                        <h3 id="skill-modal-title" className={`text-xl font-semibold ${isSuccess ? 'text-green-300' : 'text-red-300'}`}>
                            {isSuccess ? 'Digging Success!' : 'Digging Failed'}
                        </h3>
                        <p className="text-xs text-slate-400">{result.context?.biome || 'Unknown'} Biome</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className={`text-2xl font-bold ${result.xpGained ? 'text-yellow-400' : 'text-slate-500'}`}>
                        {result.xpGained ? `+${result.xpGained}` : '+0'} XP
                    </div>
                </div>
            </div>

            {/* Quick Stats Summary */}
            {isSuccess && result.item && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-slate-700/50 p-2 rounded-lg text-center border border-slate-600/50">
                        <div className="text-xs text-slate-400">Rarity</div>
                        <div className={`text-sm font-bold ${rarityColor[result.item.rarity as keyof typeof rarityColor] || 'text-gray-300'}`}>
                            {result.item.rarity || 'Common'}
                        </div>
                    </div>
                    <div className="bg-slate-700/50 p-2 rounded-lg text-center border border-slate-600/50">
                        <div className="text-xs text-slate-400">XP Gained</div>
                        <div className="text-sm text-yellow-400 font-bold">+{result.xpGained || 0}</div>
                    </div>
                    <div className="bg-slate-700/50 p-2 rounded-lg text-center border border-slate-600/50">
                        <div className="text-xs text-slate-400">Quantity</div>
                        <div className="text-sm text-green-400 font-bold">{result.item.quantity || 1}</div>
                    </div>
                </div>
            )}

            {/* Item Found or Failure Message */}
            {isSuccess && result.item ? (
                <div className="bg-gradient-to-br from-amber-900/30 to-amber-800/20 p-4 rounded-lg border-2 border-amber-500/40 mb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-amber-500/20 rounded-lg flex items-center justify-center text-4xl">
                            {result.item.emoji || '⛏️'}
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-xl text-white">You unearthed: {formatItemName(result.item.name)}</p>
                            <p className={`font-semibold text-sm ${rarityColor[result.item.rarity as keyof typeof rarityColor] || 'text-gray-300'}`}>
                                Rarity: {result.item.rarity || 'Common'}
                            </p>
                            {result.item.quantity && result.item.quantity > 1 && (
                                <p className="text-xs text-slate-300 mt-1">Quantity: {result.item.quantity}</p>
                            )}
                        </div>
                    </div>
                    {result.item.description && (
                        <p className="text-sm italic text-slate-300 mt-3 border-t border-amber-500/20 pt-3">
                            "{result.item.description}"
                        </p>
                    )}
                </div>
            ) : (
                <div className="bg-red-900/20 p-4 rounded-lg border-2 border-red-500/30 mb-4">
                    <div className="flex items-start gap-3">
                        <div className="text-3xl">⛏️</div>
                        <div className="flex-1">
                            <p className="font-bold text-lg text-red-300 mb-2">Nothing Found</p>
                            <p className="text-sm text-slate-300 mb-3">{result.message}</p>
                            {isToolRelatedFailure(result.message) && (
                                <button
                                    onClick={handleOpenEquipment}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition duration-150 flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                    </svg>
                                    Open Equipment Panel
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

const renderChopResult = (result: ChopSkillResult, isToolRelatedFailure: (msg: string) => boolean, handleOpenEquipment: () => void) => {
    const rarityColor = {
        'Common': 'text-gray-300',
        'Uncommon': 'text-blue-400',
        'Rare': 'text-purple-400',
        'Ultra-rare': 'text-yellow-400',
        'Unique': 'text-amber-400 font-bold'
    };

    const isSuccess = result.success && result.item;

    return (
        <>
            {/* Header with Icon */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 ${isSuccess ? 'bg-green-500/20' : 'bg-red-500/20'} rounded-full flex items-center justify-center ${isSuccess ? 'animate-[checkmark_0.5s_ease-out]' : 'animate-[shake_0.5s_ease-out]'}`}>
                        {isSuccess ? (
                            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                            </svg>
                        ) : (
                            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        )}
                    </div>
                    <div>
                        <h3 id="skill-modal-title" className={`text-xl font-semibold ${isSuccess ? 'text-green-300' : 'text-red-300'}`}>
                            {isSuccess ? 'Chopping Success!' : 'Chopping Failed'}
                        </h3>
                        <p className="text-xs text-slate-400">{result.context?.biome || 'Unknown'} Biome</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className={`text-2xl font-bold ${result.xpGained ? 'text-yellow-400' : 'text-slate-500'}`}>
                        {result.xpGained ? `+${result.xpGained}` : '+0'} XP
                    </div>
                </div>
            </div>

            {/* Quick Stats Summary */}
            {isSuccess && result.item && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-slate-700/50 p-2 rounded-lg text-center border border-slate-600/50">
                        <div className="text-xs text-slate-400">Rarity</div>
                        <div className={`text-sm font-bold ${rarityColor[result.item.rarity as keyof typeof rarityColor] || 'text-gray-300'}`}>
                            {result.item.rarity || 'Common'}
                        </div>
                    </div>
                    <div className="bg-slate-700/50 p-2 rounded-lg text-center border border-slate-600/50">
                        <div className="text-xs text-slate-400">XP Gained</div>
                        <div className="text-sm text-yellow-400 font-bold">+{result.xpGained || 0}</div>
                    </div>
                    <div className="bg-slate-700/50 p-2 rounded-lg text-center border border-slate-600/50">
                        <div className="text-xs text-slate-400">Quantity</div>
                        <div className="text-sm text-green-400 font-bold">{result.item.quantity || 1}</div>
                    </div>
                </div>
            )}

            {/* Item Found or Failure Message */}
            {isSuccess && result.item ? (
                <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 p-4 rounded-lg border-2 border-green-500/40 mb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-green-500/20 rounded-lg flex items-center justify-center text-4xl">
                            {result.item.emoji || '🪵'}
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-xl text-white">You obtained: {formatItemName(result.item.name)}</p>
                            <p className={`font-semibold text-sm ${rarityColor[result.item.rarity as keyof typeof rarityColor] || 'text-gray-300'}`}>
                                Rarity: {result.item.rarity || 'Common'}
                            </p>
                            {result.item.quantity && result.item.quantity > 1 && (
                                <p className="text-xs text-slate-300 mt-1">Quantity: {result.item.quantity}</p>
                            )}
                        </div>
                    </div>
                    {result.item.description && (
                        <p className="text-sm italic text-slate-300 mt-3 border-t border-green-500/20 pt-3">
                            "{result.item.description}"
                        </p>
                    )}
                </div>
            ) : (
                <div className="bg-red-900/20 p-4 rounded-lg border-2 border-red-500/30 mb-4">
                    <div className="flex items-start gap-3">
                        <div className="text-3xl">🪓</div>
                        <div className="flex-1">
                            <p className="font-bold text-lg text-red-300 mb-2">Nothing to Chop</p>
                            <p className="text-sm text-slate-300 mb-3">{result.message}</p>
                            {isToolRelatedFailure(result.message) && (
                                <button
                                    onClick={handleOpenEquipment}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition duration-150 flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                    </svg>
                                    Open Equipment Panel
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

const StudyResultDisplay: React.FC<{ result: StudySkillResult }> = ({ result }) => {
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
    const [imageError, setImageError] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [timeUntilNext, setTimeUntilNext] = useState(0);
    const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const { playerCharacter } = usePlayer();
    const { gameDate } = useGame();
    const { culturalZone, mapData } = useMap();

    // Update countdown timer
    useEffect(() => {
        const interval = setInterval(() => {
            const seconds = imageGenerationService.getTimeUntilNextGeneration();
            setTimeUntilNext(seconds);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleGenerateImage = async () => {
        if (!result.items || result.items.length === 0) return;

        setIsGenerating(true);
        setImageError(null);

        try {
            // Create a simplified item object from the study result
            const item = {
                id: `study-${Date.now()}`,
                baseId: result.items[0].name.toUpperCase().replace(/ /g, '_'),
                name: result.items[0].name,
                type: 'StudyItem' as any,
                value: 0,
                weight: 0
            };

            const imageResult = await imageGenerationService.generateItemImage({
                item,
                culturalZone: culturalZone as CulturalZone || undefined,
                year: gameDate?.year,
                playerProfession: playerCharacter?.profession
            });

            if (imageResult.imageUrl) {
                setGeneratedImageUrl(imageResult.imageUrl);
                setGeneratedPrompt(imageResult.prompt || null);
            } else {
                setImageError('Failed to generate image');
            }
        } catch (error: any) {
            setImageError(error.message || 'Failed to generate image');
        } finally {
            setIsGenerating(false);
        }
    };

    const isObserveAction = result.action?.toLowerCase() === 'observe';
    const canGenerateImage = imageGenerationService.isAvailable() && isObserveAction && result.items.length > 0;

    return (
        <>
            <h3 id="skill-modal-title" className="text-xl font-semibold text-purple-300 mb-4 flex items-center gap-2">
                <span>{result.actionEmoji}</span>
                <span className="capitalize">{result.action}</span>
            </h3>
            <div className="mb-4">
                <p className="text-gray-300 mb-3">{result.description}</p>

                {/* Items Studied with Add to Journal button */}
                <div className="bg-purple-900/20 p-3 rounded-md border border-purple-600/30">
                    <div className="flex items-start justify-between mb-2">
                        <p className="font-semibold text-purple-200">Items Studied:</p>
                        <button
                            onClick={(event) => {
                                const studiedItemNames = result.items.map(item => item.name).join(', ');
                                const currentDate = gameDate ? `${gameDate.month}/${gameDate.day}/${gameDate.year}` : 'Unknown Date';
                                const location = mapData?.name || result.context?.location || 'Unknown Location';

                                // Create journal entry content
                                const entryContent = `Study Observation\n\n${result.description}\n\n${result.items.length > 1 ? 'Items' : 'Item'} studied: ${studiedItemNames}`;

                                const journalEntry: JournalEntry = {
                                    id: `study-${Date.now()}`,
                                    title: `Study: ${result.items[0].name}`,
                                    content: entryContent,
                                    location: location,
                                    date: currentDate,
                                    timestamp: Date.now(),
                                    imageUrl: generatedImageUrl || undefined,
                                    imageCaption: generatedImageUrl ? `Historical representation of ${result.items[0].name}` : undefined,
                                    isStudyObservation: true,
                                    studiedItem: result.items[0].name,
                                    culturalZone: culturalZone as CulturalZone || undefined
                                };

                                // Add to journal and show notification
                                journalService.addEntry(journalEntry);
                                journalService.openJournal();

                                // Optional: Show a toast or visual feedback
                                const button = event.currentTarget as HTMLButtonElement;
                                button.textContent = '✓ Added';
                                button.disabled = true;
                                setTimeout(() => {
                                    button.textContent = 'Add to Journal';
                                    button.disabled = false;
                                }, 2000);
                            }}
                            className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-purple-700/30 hover:bg-purple-600/40 text-purple-200 hover:text-purple-100 border border-purple-600/40 rounded-md transition-all duration-200 group"
                            title="Add this observation to your journal"
                        >
                            <BookOpen size={14} className="group-hover:scale-110 transition-transform" />
                            <span className="font-medium">Add to Journal</span>
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {result.items.map((item, index) => (
                            <span key={index} className="bg-purple-800/30 px-2 py-1 rounded text-sm text-purple-100 flex items-center gap-1">
                                {item.emoji && <span>{item.emoji}</span>}
                                <span>{item.name}</span>
                            </span>
                        ))}
                    </div>
                </div>

                {/* AI Image Generation for Observe actions */}
                {canGenerateImage && (
                    <div className="mt-4 bg-indigo-900/20 p-3 rounded-md border border-indigo-600/30">
                        <p className="font-semibold text-indigo-200 mb-2">Visual Reference:</p>

                        {generatedImageUrl ? (
                            <div className="flex flex-col items-center gap-2">
                                <img
                                    src={generatedImageUrl}
                                    alt={result.items[0].name}
                                    className="max-w-full h-auto rounded-md border border-indigo-500/30"
                                    style={{ maxHeight: '256px' }}
                                />
                                <div className="flex items-center gap-2">
                                    <p className="text-xs text-gray-400">AI-generated historical representation</p>
                                    {generatedPrompt && (
                                        <button
                                            onClick={() => setShowPrompt(!showPrompt)}
                                            className="text-xs text-indigo-400 hover:text-indigo-300 underline"
                                            title="Show/hide the prompt used for generation"
                                        >
                                            {showPrompt ? 'Hide' : 'Show'} Prompt
                                        </button>
                                    )}
                                </div>
                                {showPrompt && generatedPrompt && (
                                    <div className="w-full mt-2 p-2 bg-gray-800/50 rounded text-xs text-gray-300 max-h-32 overflow-y-auto">
                                        <p className="font-semibold text-indigo-300 mb-1">Prompt sent to Runware:</p>
                                        <p className="break-words">{generatedPrompt}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                {!isGenerating && !imageError && (
                                    <>
                                        <button
                                            onClick={handleGenerateImage}
                                            disabled={timeUntilNext > 0}
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-md transition duration-150"
                                        >
                                            {timeUntilNext > 0 ? `Wait ${timeUntilNext}s` : 'Generate Visual Reference'}
                                        </button>
                                        <p className="text-xs text-gray-400">Create an AI image of this item (costs $0.0006)</p>
                                    </>
                                )}

                                {isGenerating && (
                                    <div className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-400"></div>
                                        <p className="text-sm text-indigo-300">Generating image...</p>
                                    </div>
                                )}

                                {imageError && (
                                    <p className="text-sm text-red-400">{imageError}</p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {result.xpGained && <p className="text-sm text-yellow-400 mt-4 font-semibold">+{result.xpGained} XP</p>}
        </>
    );
};

const SkillsModal: React.FC<SkillsModalProps> = ({ isOpen, isLoading, result, onClose }) => {
  const { setIsCharacterProfileModalOpen } = useUI();

  // Keyboard shortcuts (ESC, Enter to close)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, onClose]);

  // Helper to detect tool-related failures
  const isToolRelatedFailure = (message: string) => {
    const keywords = ['tool', 'axe', 'pickaxe', 'shovel', 'equipped', 'holding'];
    return keywords.some(keyword => message.toLowerCase().includes(keyword));
  };

  // Handler to open equipment panel
  const handleOpenEquipment = () => {
    onClose(); // Close skills modal
    setIsCharacterProfileModalOpen(true); // Open character modal
    // Note: We'd need to add defaultTab support to fully implement this
  };

  if (!isOpen) return null;

  // Special full-screen rendering for observe skill
  if (result?.type === 'observe' && !isLoading) {
    return renderObserveResult(result as ObserveSkillResult, onClose);
  }

  // Determine success state
  const isSuccess = (result as any)?.success !== false;
  const borderColor = isSuccess ? 'border-green-500/30' : 'border-red-500/30';
  const glowClass = isSuccess ? 'shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'shadow-[0_0_20px_rgba(239,68,68,0.3)]';
  const animateClass = isSuccess ? 'animate-popIn' : 'animate-[shake_0.5s_ease-out]';

  return (
    <div
        className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="skill-modal-title"
    >
      <div
        className={`bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 border ${borderColor} rounded-2xl ${glowClass} text-slate-200 w-full max-w-lg p-6 flex flex-col ${animateClass} pointer-events-auto`}
        onClick={(e) => e.stopPropagation()}
        style={{ minHeight: '250px' }}
      >
        <div className="flex-grow">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-400 mb-4"></div>
                    <p className="text-gray-300">Thinking...</p>
                </div>
            ) : result ? (
                <>
                    {result.type === 'forage' && renderForageResult(result as ForageSkillResult, isToolRelatedFailure, handleOpenEquipment)}
                    {result.type === 'dig' && renderDigResult(result as DigSkillResult, isToolRelatedFailure, handleOpenEquipment)}
                    {result.type === 'chop' && renderChopResult(result as ChopSkillResult, isToolRelatedFailure, handleOpenEquipment)}
                    {result.type === 'study' && <StudyResultDisplay result={result as StudySkillResult} />}
                    {/* Add other result types here */}
                    {result.type !== 'observe' && result.type !== 'forage' && result.type !== 'dig' && result.type !== 'chop' && result.type !== 'study' && (
                        <>
                         <h3 id="skill-modal-title" className="text-xl font-semibold text-blue-300 mb-4 capitalize">{result.type}</h3>
                         <p className="text-gray-300">{(result as any).message}</p>
                         {(result as any).xpGained && <p className="text-sm text-yellow-400 mt-4 font-semibold">+{(result as any).xpGained} XP</p>}
                        </>
                    )}

                    {/* Add the expandable More Information section */}
                    <MoreInfoSection result={result} />
                </>
            ) : (
                 <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400">An error occurred.</p>
                 </div>
            )}
        </div>
        <div className="mt-6 flex gap-2">
             {!isSuccess && (
               <button
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition duration-150"
                  onClick={onClose}
               >
                  Try Again
               </button>
             )}
             <button
                className={`px-6 py-2 ${isSuccess ? 'bg-green-600 hover:bg-green-500' : 'bg-slate-600 hover:bg-slate-500'} text-white font-semibold rounded-lg transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed`}
                onClick={onClose}
                disabled={isLoading}
            >
                {isSuccess ? 'Continue' : 'Close'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default SkillsModal;