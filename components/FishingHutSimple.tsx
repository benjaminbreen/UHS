/**
 * FishingHutSimple.tsx - Simplified fishing system
 * Click to cast, hold to reel with simple progress bar
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import FishingHutBanner, { Fish, GROUND_Y_DEFAULT, WATER_OFFSET, OCEAN_COLORS } from './FishingHutBanner';
import { FishSpecies, FishingDataService } from '../services/fishingDataService';
import { fishingGameState, GameFish } from '../services/fishingGameStateService';
import { gameSounds } from '../services/gameSoundsService';
import { CulturalZone } from '../types/characterData';
import { HistoricalEra } from '../types';
import { ClimateType, Season, TimeOfDay, BiomeType, PlayerCharacter } from '../types';
import type { TerrainStructure } from '../types/structures';
import type { WeatherState } from '../services/weatherService';

interface FishingHutSimpleProps {
  // Banner props
  structure?: TerrainStructure;
  era?: string;
  culturalZone: CulturalZone;
  climate: ClimateType;
  season: Season;
  timeOfDay: TimeOfDay;
  weather?: WeatherState | null;
  adjacentBiomes?: BiomeType[];
  
  // Game props
  availableFish: FishSpecies[];
  historicalEra: HistoricalEra;
  isFreshwater: boolean;
  playerCharacter?: PlayerCharacter;
  onCatch: (fish: FishSpecies, weight: number, length: number) => void;
  onExit: () => void;
  fishingService: FishingDataService;
}

const FishingHutSimple: React.FC<FishingHutSimpleProps> = ({
  structure,
  era = '1500',
  culturalZone,
  climate,
  season,
  timeOfDay,
  weather,
  adjacentBiomes = [],
  availableFish,
  historicalEra,
  isFreshwater,
  playerCharacter,
  onCatch,
  onExit,
  fishingService
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  
  // Responsive dimensions
  const GAME_WIDTH = dimensions.width;
  const GAME_HEIGHT = dimensions.height;
  const WATER_Y = Math.round(GAME_HEIGHT * 0.20);
  const MAX_DEPTH = GAME_HEIGHT - WATER_Y - 10;
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Simple game states
  const [gamePhase, setGamePhase] = useState<'waiting' | 'casting' | 'fishing' | 'hooked' | 'reeling' | 'caught'>('waiting');
  const [castDepth, setCastDepth] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [reelProgress, setReelProgress] = useState(0);
  const [hookedFish, setHookedFish] = useState<FishSpecies | null>(null);
  const [fishCollection, setFishCollection] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('fishCollection');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [totalCatches, setTotalCatches] = useState(() => {
    return parseInt(localStorage.getItem('totalFishCaught') || '0');
  });
  
  // Catch notification
  const [catchNotification, setCatchNotification] = useState<{
    active: boolean;
    fishName: string;
    isNewSpecies: boolean;
    weight: number;
    length: number;
  } | null>(null);

  // Get fish around cast location
  const getNearbyFish = useCallback(() => {
    const allFish = fishingGameState.getFish();
    return allFish.filter(fish => {
      const distance = Math.sqrt(
        Math.pow(fishingGameState.getLineState().x - fish.x, 2) + 
        Math.pow((WATER_Y + castDepth) - fish.y, 2)
      );
      return distance < 100; // Fish within 100px of hook
    });
  }, [castDepth, WATER_Y]);

  // Simple casting mechanic - click and hold to set depth
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (gamePhase === 'waiting') {
      setGamePhase('casting');
      setIsHolding(true);
      setCastDepth(0);
      
      // Play cast sound
      gameSounds.playFishingCastSound();
    } else if (gamePhase === 'hooked') {
      setIsHolding(true);
    }
  }, [gamePhase]);

  const handleMouseUp = useCallback(() => {
    if (gamePhase === 'casting') {
      // Cast the line at current depth
      fishingGameState.castLine(GAME_WIDTH / 2, castDepth);
      setGamePhase('fishing');
      setIsHolding(false);
      
      // Check for nearby fish
      setTimeout(() => {
        const nearbyFish = getNearbyFish();
        if (nearbyFish.length > 0) {
          // Random chance to hook a fish
          if (Math.random() < 0.8) { // 80% chance for easy testing
            const randomFish = nearbyFish[Math.floor(Math.random() * nearbyFish.length)];
            setHookedFish(randomFish.species);
            setGamePhase('hooked');
            gameSounds.playFishingHookSound();
          }
        }
      }, 1000); // Wait 1 second after casting
    } else if (gamePhase === 'reeling') {
      setIsHolding(false);
    }
    
    setIsHolding(false);
  }, [gamePhase, getNearbyFish, GAME_WIDTH]);

  // Touch event handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (gamePhase === 'waiting') {
      setGamePhase('casting');
      setIsHolding(true);
      setCastDepth(0);
      gameSounds.playFishingCastSound();
    } else if (gamePhase === 'hooked') {
      setIsHolding(true);
    }
  }, [gamePhase]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    handleMouseUp();
  }, [handleMouseUp]);

  // Depth charging while holding
  useEffect(() => {
    if (gamePhase === 'casting' && isHolding) {
      const interval = setInterval(() => {
        setCastDepth(prev => Math.min(MAX_DEPTH, prev + 5));
      }, 50);
      return () => clearInterval(interval);
    }
  }, [gamePhase, isHolding, MAX_DEPTH]);

  // Fish detection when hooked
  useEffect(() => {
    if (gamePhase === 'hooked' && hookedFish) {
      setGamePhase('reeling');
      setReelProgress(0);
    }
  }, [gamePhase, hookedFish]);

  // Reeling progress
  useEffect(() => {
    if (gamePhase === 'reeling' && isHolding) {
      const interval = setInterval(() => {
        setReelProgress(prev => {
          const newProgress = Math.min(1, prev + 0.03); // Fast progress for easy testing
          
          if (newProgress >= 1 && hookedFish) {
            // Fish caught!
            const weight = 2 + Math.random() * 8;
            const length = 20 + Math.random() * 80;
            
            // Track in collection
            const isNewSpecies = !fishCollection.has(hookedFish.name);
            if (isNewSpecies) {
              const newCollection = new Set(fishCollection);
              newCollection.add(hookedFish.name);
              setFishCollection(newCollection);
              localStorage.setItem('fishCollection', JSON.stringify(Array.from(newCollection)));
            }
            
            // Update total catches
            const newTotal = totalCatches + 1;
            setTotalCatches(newTotal);
            localStorage.setItem('totalFishCaught', newTotal.toString());
            
            // Show notification
            setCatchNotification({
              active: true,
              fishName: hookedFish.name,
              isNewSpecies,
              weight,
              length
            });
            setTimeout(() => setCatchNotification(null), 4000);
            
            onCatch(hookedFish, weight, length);
            gameSounds.playFishingSuccessSound();
            
            // Reset
            setGamePhase('caught');
            setTimeout(() => {
              setGamePhase('waiting');
              setHookedFish(null);
              setReelProgress(0);
              setCastDepth(0);
              fishingGameState.reset();
            }, 2000);
          }
          
          return newProgress;
        });
      }, 100);
      
      return () => clearInterval(interval);
    }
  }, [gamePhase, isHolding, hookedFish, fishCollection, totalCatches, onCatch]);

  // Generate some fish for testing
  useEffect(() => {
    // Use available fish or create test fish
    const testFish = availableFish.length > 0 ? availableFish : [
      { id: 'test_bass', name: 'Test Bass', description: 'A test bass', rarity: 'common' as const, size: { min: 3, max: 8 }, speed: 0.6, minDepth: 0, maxDepth: 40, baseValue: 15, color: '#4A5D23' },
      { id: 'test_trout', name: 'Test Trout', description: 'A test trout', rarity: 'common' as const, size: { min: 2, max: 6 }, speed: 0.8, minDepth: 20, maxDepth: 60, baseValue: 12, color: '#8B4513' },
      { id: 'test_salmon', name: 'Test Salmon', description: 'A test salmon', rarity: 'uncommon' as const, size: { min: 5, max: 12 }, speed: 0.4, minDepth: 30, maxDepth: 80, baseValue: 25, color: '#FA8072' }
    ];
    
    // Register a few fish at different depths
    for (let i = 0; i < 3; i++) {
      const species = testFish[i % testFish.length];
      const gameFish: GameFish = {
        id: `fish_${i}`,
        species,
        x: (GAME_WIDTH / 4) + (i * GAME_WIDTH / 4),
        y: WATER_Y + 50 + (i * 100),
        vx: 0.2,
        vy: 0,
        size: 5,
        weight: 3,
        direction: 'right',
        interested: true,
        hooked: false,
        escaping: false,
        stamina: 100,
        distanceToHook: 100
      };
      fishingGameState.registerFish(gameFish);
    }
  }, [availableFish, GAME_WIDTH, WATER_Y]);

  // Get instruction text based on game phase
  const getInstructionText = () => {
    switch (gamePhase) {
      case 'waiting':
        return '🎣 Hold SPACEBAR or click and hold to cast line (hold longer = deeper)';
      case 'casting':
        return `📏 Casting depth: ${Math.round(castDepth)}px - Release to cast!`;
      case 'fishing':
        return '⏳ Waiting for fish to bite...';
      case 'hooked':
        return '🎯 FISH HOOKED! Hold SPACEBAR to reel in!';
      case 'reeling':
        return isHolding ? '🎣 Reeling in fish...' : '⚠️ Hold SPACEBAR to keep reeling!';
      case 'caught':
        return '🎉 Fish caught! Adding to inventory...';
      default:
        return '';
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-hidden cursor-crosshair select-none"
      style={{ background: 'linear-gradient(to bottom, #87CEEB 0%, #4682B4 100%)' }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Exit button */}
      <button
        onClick={onExit}
        className="absolute top-4 right-4 z-30 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Exit Fishing
      </button>

      {/* Instructions */}
      <div className="absolute top-4 left-4 z-30 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-white">
        <div className="font-bold text-lg">Simple Fishing</div>
        <div className="text-sm mt-1">{getInstructionText()}</div>
        <div className="text-xs text-gray-300 mt-1">Phase: {gamePhase}</div>
      </div>

      {/* Base banner */}
      <FishingHutBanner
        structure={structure}
        era={era}
        culturalZone={String(culturalZone).toLowerCase()}
        climate={climate}
        season={season}
        timeOfDay={timeOfDay}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        weather={weather}
        adjacentBiomes={adjacentBiomes}
        gameMode={true}
      />

      {/* Game overlay */}
      <svg
        className="absolute inset-0"
        style={{ zIndex: 10 }}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        viewBox={`0 0 ${GAME_WIDTH} ${GAME_HEIGHT}`}
      >
        {/* Fishing line when cast */}
        {(gamePhase === 'fishing' || gamePhase === 'hooked' || gamePhase === 'reeling') && (
          <line
            x1={GAME_WIDTH / 2}
            y1={WATER_Y - 20}
            x2={GAME_WIDTH / 2}
            y2={WATER_Y + castDepth}
            stroke="#444"
            strokeWidth={2}
            opacity={0.8}
          />
        )}

        {/* Hook */}
        {(gamePhase === 'fishing' || gamePhase === 'hooked' || gamePhase === 'reeling') && (
          <circle
            cx={GAME_WIDTH / 2}
            cy={WATER_Y + castDepth}
            r={4}
            fill={gamePhase === 'hooked' ? '#FFD700' : '#666'}
            stroke={gamePhase === 'hooked' ? '#FFA500' : '#333'}
            strokeWidth={2}
          />
        )}

        {/* Depth indicator while casting */}
        {gamePhase === 'casting' && (
          <rect
            x={GAME_WIDTH / 2 - 2}
            y={WATER_Y}
            width={4}
            height={castDepth}
            fill="rgba(255, 215, 0, 0.5)"
          />
        )}
      </svg>

      {/* Reeling progress bar */}
      {gamePhase === 'reeling' && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-30">
          <div className="bg-black/80 backdrop-blur-sm rounded-lg p-4">
            <div className="text-white text-center mb-2">
              Reeling in {hookedFish?.name}
            </div>
            <div className="w-64 h-6 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-100 ${
                  reelProgress > 0.8 ? 'bg-yellow-400' : 
                  reelProgress > 0.5 ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${reelProgress * 100}%` }}
              />
            </div>
            <div className="text-white text-sm text-center mt-2">
              {Math.round(reelProgress * 100)}% Complete
            </div>
          </div>
        </div>
      )}

      {/* Fish hooked indicator */}
      {gamePhase === 'hooked' && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
          <div className="bg-yellow-500 text-black px-6 py-3 rounded-lg font-bold text-xl animate-pulse">
            🎣 FISH HOOKED! 🎣
          </div>
        </div>
      )}

      {/* Catch notification */}
      {catchNotification && (
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <div className="bg-green-600 text-white rounded-xl p-6 text-center animate-bounce">
            <div className="text-3xl mb-2">🎉 FISH CAUGHT! 🎉</div>
            <div className="text-xl font-bold">{catchNotification.fishName}</div>
            <div className="text-sm mt-2">
              Weight: {catchNotification.weight.toFixed(1)} lbs | 
              Length: {catchNotification.length.toFixed(1)} cm
            </div>
            {catchNotification.isNewSpecies && (
              <div className="text-yellow-300 text-lg mt-2">
                ⭐ NEW SPECIES DISCOVERED! ⭐
              </div>
            )}
            <div className="text-xs mt-3 text-green-200">
              Added to inventory and collection
            </div>
          </div>
        </div>
      )}

      {/* Collection stats */}
      <div className="absolute bottom-4 left-4 bg-black/75 backdrop-blur-sm rounded-xl p-3 border border-cyan-500/30 z-25">
        <div className="text-white text-sm font-bold mb-1 flex items-center gap-1">
          🐟 Collection
        </div>
        <div className="text-cyan-300 text-xs">
          {fishCollection.size} unique species
        </div>
        <div className="text-gray-400 text-xs">
          {totalCatches} total catches
        </div>
      </div>
    </div>
  );
};

export default FishingHutSimple;