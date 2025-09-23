/**
 * components/SkillsModal.tsx - A modal to display the results of a player skill.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { SkillResult, ObserveSkillResult, ForageSkillResult, DigSkillResult, ChopSkillResult, StudySkillResult, CulturalZone, ClimateType, Season, WeatherState } from '../types';
import { usePlayer } from '../contexts/PlayerContext';
import { useMap } from '../contexts/MapContext';
import { useGame } from '../contexts/GameContext';
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
    const [isExpanded, setIsExpanded] = useState(false);
    const { calculation, advice } = getContextualAdvice(result);

    return (
        <div className="mt-4 border-t border-slate-600/50 pt-3">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between text-sm text-slate-400 hover:text-slate-300 transition-colors duration-200"
            >
                <span className="font-medium">More Information</span>
                <div className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 10.5l-4-4h8l-4 4z"/>
                    </svg>
                </div>
            </button>

            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="mt-3 p-4 bg-slate-800/30 backdrop-blur-sm rounded-lg border border-slate-700/30 space-y-3">
                    {/* Calculation Section */}
                    <div>
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                            Calculation
                        </h4>
                        <div className="text-sm text-slate-300 font-mono bg-slate-900/50 p-2 rounded">
                            {calculation}
                        </div>
                    </div>

                    {/* Advice Section */}
                    <div>
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                            {(result as any).success ? 'Tips' : 'How to Improve'}
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

// Generate priority-ordered background paths
const getBackgroundPaths = (
  biome: string,
  weatherState?: WeatherState,
  gameTime?: { hours: number; minutes: number },
  culture?: CulturalZone,
  climate?: ClimateType,
  season?: Season
): string[] => {
  // Convert biome enum to lowercase with underscores
  // RIVERBANK -> riverbank, DENSE_FOREST -> dense_forest
  let biomeName = biome.toLowerCase();

  // Map common biome names to their file equivalents
  // Only map biomes that genuinely don't have their own backgrounds
  const biomeMapping: { [key: string]: string } = {
    'scrub': 'grassland',
    'steppe': 'grassland',
    'tundra': 'grassland_snow',
    'high_peak': 'mountain',
    'cliff': 'hills',
    'salt_flats': 'desert',
    'government_district': 'dense_city',
    'palace': 'dense_city',
    'holy_site': 'dense_city',
    'road': 'grassland',
    'industrial_district': 'dense_city'
  };

  // Apply mapping if exists
  if (biomeMapping[biomeName]) {
    biomeName = biomeMapping[biomeName];
  }

  const paths: string[] = [];
  const weatherSuffix = getWeatherSuffix(weatherState);
  const timeSuffix = getTimeSuffix(gameTime);
  const cultureSuffix = getCultureSuffix(culture);
  const climateSuffix = getClimateSuffix(climate, season);

  // Helper function to add paths for a specific culture
  const addCulturalPaths = (cultureName: string) => {
    // Climate variants with culture (HIGHEST PRIORITY)
    if (climateSuffix) {
      if (weatherSuffix && timeSuffix) {
        paths.push(`${biomeName}_${climateSuffix}_${weatherSuffix}_${timeSuffix}_${cultureName}.png`);
      }
      if (weatherSuffix) {
        paths.push(`${biomeName}_${climateSuffix}_${weatherSuffix}_${cultureName}.png`);
      }
      if (timeSuffix) {
        paths.push(`${biomeName}_${climateSuffix}_${timeSuffix}_${cultureName}.png`);
      }
      paths.push(`${biomeName}_${climateSuffix}_${cultureName}.png`);
    }

    // Standard variants without climate
    if (weatherSuffix && timeSuffix) {
      paths.push(`${biomeName}_${weatherSuffix}_${timeSuffix}_${cultureName}.png`);
    }
    if (weatherSuffix) {
      paths.push(`${biomeName}_${weatherSuffix}_${cultureName}.png`);
    }
    if (timeSuffix) {
      paths.push(`${biomeName}_${timeSuffix}_${cultureName}.png`);
    }
    paths.push(`${biomeName}_${cultureName}.png`);
  };

  // PRIORITY 1: Check for the SPECIFIC culture variants first
  if (cultureSuffix) {
    addCulturalPaths(cultureSuffix);
  }

  // PRIORITY 2: Check for non-cultural climate variants
  if (climateSuffix) {
    if (weatherSuffix && timeSuffix) {
      paths.push(`${biomeName}_${climateSuffix}_${weatherSuffix}_${timeSuffix}.png`);
    }
    if (weatherSuffix) {
      paths.push(`${biomeName}_${climateSuffix}_${weatherSuffix}.png`);
    }
    if (timeSuffix) {
      paths.push(`${biomeName}_${climateSuffix}_${timeSuffix}.png`);
    }
    paths.push(`${biomeName}_${climateSuffix}.png`);
  }

  // PRIORITY 3: Check for non-cultural weather/time variants (no climate)
  if (weatherSuffix && timeSuffix) {
    paths.push(`${biomeName}_${weatherSuffix}_${timeSuffix}.png`);
  }
  if (weatherSuffix) {
    paths.push(`${biomeName}_${weatherSuffix}.png`);
  }
  if (timeSuffix) {
    paths.push(`${biomeName}_${timeSuffix}.png`);
  }

  // PRIORITY 4: Check for the SPECIFIC biome base file
  paths.push(`${biomeName}.png`);

  // Add biome-specific direct fallbacks (without checking includes)
  // This ensures we always try the exact biome file first
  const directFallbacks: { [key: string]: string[] } = {
    'deep_ocean': ['deep_ocean.png', 'shallow_ocean.png', 'beach.png'],
    'shallow_ocean': ['shallow_ocean.png', 'deep_ocean.png', 'beach.png'],
    'river': ['river.png', 'riverbank.png', 'wetlands.png'],
    'major_river': ['major_river.png', 'river.png', 'riverbank.png'],
    'riverbank': ['riverbank.png', 'river.png', 'wetlands.png'],
    'estuary': ['estuary.png', 'riverbank.png', 'wetlands.png', 'beach.png'],
    'freshwater_lake': ['freshwater_lake.png', 'riverbank.png', 'wetlands.png'],
    'reef': ['reef.png', 'shallow_ocean.png', 'beach.png'],
    'shoals_tile': ['shoals_tile.png', 'shallow_ocean.png', 'beach.png'],
    'beach': ['beach.png', 'riverbank.png'],
    'city_center': ['city_center.png', 'dense_city.png', 'low_density_city.png'],
    'dense_city': ['dense_city.png', 'city_center.png', 'low_density_city.png'],
    'low_density_city': ['low_density_city.png', 'dense_city.png'],
    'hamlet': ['hamlet.png', 'low_density_city.png'],
    'marketplace': ['marketplace.png', 'plaza.png', 'low_density_city.png'],
    'plaza': ['plaza.png', 'marketplace.png'],
    'dense_forest': ['dense_forest.png', 'forest.png', 'jungle.png'],
    'forest': ['forest.png', 'dense_forest.png'],
    'jungle': ['jungle.png', 'dense_forest.png', 'forest.png'],
    'mountain': ['mountain.png', 'hills.png'],
    'hills': ['hills.png', 'mountain.png'],
    'farmland': ['farmland.png', 'grassland.png'],
    'wetlands': ['wetlands.png', 'riverbank.png', 'mangrove.png'],
    'mangrove': ['mangrove.png', 'wetlands.png'],
    'hot_springs': ['hot_springs.png', 'wetlands.png'],
    'volcanic_soil': ['volcanic_soil.png', 'mountain.png'],
    'park': ['park.png', 'grassland.png'],
    'oasis': ['oasis.png', 'desert.png'],
    'desert': ['desert.png', 'hills_arid.png'],
    'harbor_district': ['harbor_district.png', 'riverbank.png', 'beach.png'],
    'ruins': ['ruins.png', 'hills.png', 'grassland.png']
  };

  // Add direct fallbacks for this specific biome
  if (directFallbacks[biomeName]) {
    paths.push(...directFallbacks[biomeName]);
  }

  // Universal fallbacks - most common backgrounds
  paths.push('grassland.png', 'hills.png', 'forest.png', 'desert.png', 'dense_city.png', 'beach.png');

  return paths;
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

const renderForageResult = (result: ForageSkillResult) => {
    const rarityColor = {
        'Common': 'text-gray-300',
        'Uncommon': 'text-blue-400',
        'Rare': 'text-purple-400',
        'Ultra-rare': 'text-yellow-400',
        'Unique': 'text-amber-400 font-bold'
    };

    return (
        <>
            <h3 id="skill-modal-title" className="text-xl font-semibold text-blue-300 mb-4 capitalize">Foraging</h3>
            <p className="text-gray-400 mb-4">{result.message}</p>
            {result.item && (
                <div className="bg-gray-700/50 p-3 rounded-md border border-gray-600/50">
                    <p className="font-bold text-lg text-white">You found: {result.item.name}</p>
                    <p className={`font-semibold ${rarityColor[result.item.rarity as keyof typeof rarityColor]}`}>Rarity: {result.item.rarity}</p>
                    {result.item.description && <p className="text-sm italic text-gray-400 mt-2">"{result.item.description}"</p>}
                </div>
            )}
            {result.xpGained && <p className="text-sm text-yellow-400 mt-4 font-semibold">+{result.xpGained} XP</p>}
        </>
    );
};

const renderDigResult = (result: DigSkillResult) => {
    const rarityColor = {
        'Common': 'text-gray-300',
        'Uncommon': 'text-blue-400',
        'Rare': 'text-purple-400',
        'Ultra-rare': 'text-yellow-400',
        'Unique': 'text-amber-400 font-bold'
    };

    return (
        <>
            <h3 id="skill-modal-title" className="text-xl font-semibold text-blue-300 mb-4 capitalize">Digging</h3>
            <p className="text-gray-400 mb-4">{result.message}</p>
            {result.success && result.item && (
                <div className="bg-gray-700/50 p-3 rounded-md border border-gray-600/50">
                    <p className="font-bold text-lg text-white">You unearthed: {result.item.name}</p>
                    {result.item.quantity && result.item.quantity > 1 && (
                        <p className="text-sm text-gray-300">Quantity: {result.item.quantity}</p>
                    )}
                    <p className={`font-semibold ${rarityColor[result.item.rarity as keyof typeof rarityColor] || 'text-gray-300'}`}>
                        Rarity: {result.item.rarity || 'Common'}
                    </p>
                    {result.item.description && <p className="text-sm italic text-gray-400 mt-2">"{result.item.description}"</p>}
                </div>
            )}
            {result.xpGained && <p className="text-sm text-yellow-400 mt-4 font-semibold">+{result.xpGained} XP</p>}
        </>
    );
};

const renderChopResult = (result: ChopSkillResult) => {
    const rarityColor = {
        'Common': 'text-gray-300',
        'Uncommon': 'text-blue-400',
        'Rare': 'text-purple-400',
        'Ultra-rare': 'text-yellow-400',
        'Unique': 'text-amber-400 font-bold'
    };

    return (
        <>
            <h3 id="skill-modal-title" className="text-xl font-semibold text-blue-300 mb-4 capitalize">Chopping</h3>
            <p className="text-gray-400 mb-4">{result.message}</p>
            {result.success && result.item && (
                <div className="bg-gray-700/50 p-3 rounded-md border border-gray-600/50">
                    <p className="font-bold text-lg text-white">You obtained: {result.item.name}</p>
                    {result.item.quantity && result.item.quantity > 1 && (
                        <p className="text-sm text-gray-300">Quantity: {result.item.quantity}</p>
                    )}
                    <p className={`font-semibold ${rarityColor[result.item.rarity as keyof typeof rarityColor] || 'text-gray-300'}`}>
                        Rarity: {result.item.rarity || 'Common'}
                    </p>
                    {result.item.description && <p className="text-sm italic text-gray-400 mt-2">"{result.item.description}"</p>}
                </div>
            )}
            {result.xpGained && <p className="text-sm text-yellow-400 mt-4 font-semibold">+{result.xpGained} XP</p>}
        </>
    );
};

const renderStudyResult = (result: StudySkillResult) => {
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
  if (!isOpen) return null;

  // Special full-screen rendering for observe skill
  if (result?.type === 'observe' && !isLoading) {
    return renderObserveResult(result as ObserveSkillResult, onClose);
  }

  return (
    <div
        className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="skill-modal-title"
    >
      <div
        className="bg-modal-bg-gradient border border-slate-600 rounded-2xl shadow-glow-blue text-slate-200 w-full max-w-lg p-6 flex flex-col animate-popIn pointer-events-auto"
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
                    {result.type === 'forage' && renderForageResult(result as ForageSkillResult)}
                    {result.type === 'dig' && renderDigResult(result as DigSkillResult)}
                    {result.type === 'chop' && renderChopResult(result as ChopSkillResult)}
                    {result.type === 'study' && renderStudyResult(result as StudySkillResult)}
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
        <div className="mt-6 flex justify-end">
             <button
                className="px-6 py-2 bg-slate-600 hover:bg-slate-500 text-white text-sm font-semibold rounded-md transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={onClose}
                disabled={isLoading}
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default SkillsModal;