/**
 * FishingHutModal.tsx - Main modal for fishing hut interaction
 * Matches the pattern of GovernmentDistrictModal and MarketplaceModal
 * Provides marketplace for fish and entry to fishing minigame
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TerrainStructure } from '../types/structures';
import { CulturalZone } from '../types/characterData';
import { HistoricalEra } from '../types';
import { ClimateType, BiomeType, Season, Item, PlayerCharacter, TimeOfDay } from '../types';
import FishingHutInteractive from './FishingHutInteractive';
import FishingHutBanner from './FishingHutBanner';
import { FishingDataService, FishSpecies } from '../services/fishingDataService';
import { FaFish, FaStore, FaTimes, FaCoins, FaShoppingCart } from 'react-icons/fa';
import { GiFishingHook, GiBoatFishing } from 'react-icons/gi';
import { weatherService } from '../services/weatherService';
import gameSoundsService from '../services/gameSoundsService';

interface FishingHutModalProps {
  isOpen: boolean;
  onClose: () => void;
  structure: TerrainStructure;
  culturalZone: CulturalZone;
  historicalEra: HistoricalEra;
  climate: ClimateType;
  biome: BiomeType;
  season: Season;
  year: number;
  isCoastal: boolean;
  isFreshwater: boolean;
  timeOfDay: TimeOfDay;
  playerCharacter: PlayerCharacter;
  onInventoryUpdate?: (newItem: Item) => void;
  onBuy?: (itemId: string, price: number) => void;
  onSell?: (item: Item, price: number) => void;
  onCharacterUpdate?: (updatedCharacter: PlayerCharacter) => void;
  playerGold?: number;
}

interface CatchRecord {
  species: FishSpecies;
  weight: number;
  length: number;
  timestamp: Date;
}

const FishingHutModal: React.FC<FishingHutModalProps> = ({
  isOpen,
  onClose,
  structure,
  culturalZone,
  historicalEra,
  climate,
  biome,
  season,
  year,
  isCoastal,
  isFreshwater,
  timeOfDay,
  playerCharacter,
  onInventoryUpdate,
  onBuy,
  onSell,
  onCharacterUpdate,
  playerGold = 0
}) => {
  const [isGameActive, setIsGameActive] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'buy' | 'sell'>('info');
  const [catchHistory, setCatchHistory] = useState<CatchRecord[]>([]);
  const [uniqueSpeciesCaught, setUniqueSpeciesCaught] = useState<Set<string>>(new Set());
  const [totalWeight, setTotalWeight] = useState(0);
  const [bestCatch, setBestCatch] = useState<CatchRecord | null>(null);
  const [gameMessage, setGameMessage] = useState<string>('');
  const [fadeIn, setFadeIn] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Weather data
  const weather = useMemo(() => {
    return weatherService.getWeather(
      climate,
      biome,
      season,
      timeOfDay,
      0.5, // altitude
      180, // dayOfYear
      structure.location ? { x: structure.location[0], y: structure.location[1] } : undefined
    );
  }, [climate, biome, season, timeOfDay, structure.location]);
  
  // Fade in effect
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setFadeIn(true), 10);
    } else {
      setFadeIn(false);
    }
  }, [isOpen]);
  
  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Fishing music management
  useEffect(() => {
    if (isGameActive) {
      // Start peaceful fishing music when the fishing game becomes active
      gameSoundsService.playFishingMusic();
    } else {
      // Stop fishing music when exiting the game
      gameSoundsService.stopFishingMusic();
    }
    
    // Cleanup on component unmount
    return () => {
      gameSoundsService.stopFishingMusic();
    };
  }, [isGameActive]);

  // Initialize fishing data service with structure location as seed
  const fishingService = useMemo(() => {
    const seed = structure.location ? structure.location[0] * 1000 + structure.location[1] : 12345;
    return new FishingDataService(seed);
  }, [structure.location]);

  // Get available fish for this location
  const availableFish = useMemo(() => {
    return fishingService.getAvailableFish({
      culturalZone,
      historicalEra,
      climate,
      biome,
      depth: 50,
      season: season.toLowerCase(),
      isCoastal,
      isFreshwater
    });
  }, [culturalZone, historicalEra, climate, biome, season, isCoastal, isFreshwater, fishingService]);

  // Handle successful catch
  const handleCatch = (fish: FishSpecies, weight: number, length: number) => {
    console.log('🎣 handleCatch called with:', { fish: fish.name, weight, length });
    console.log('🎣 onInventoryUpdate exists:', !!onInventoryUpdate);

    const catchRecord: CatchRecord = {
      species: fish,
      weight,
      length,
      timestamp: new Date()
    };

    // Update statistics
    setCatchHistory(prev => [...prev, catchRecord]);
    setUniqueSpeciesCaught(prev => new Set([...prev, fish.id]));
    setTotalWeight(prev => prev + weight);

    if (!bestCatch || weight > bestCatch.weight) {
      setBestCatch(catchRecord);
    }

    // Add 5 XP to player character
    if (onCharacterUpdate) {
      const updatedCharacter: PlayerCharacter = {
        ...playerCharacter,
        experience: Math.min(playerCharacter.experience + 5, playerCharacter.maxExperience)
      };
      onCharacterUpdate(updatedCharacter);
    }

    // Add to inventory if callback provided
    const culturalName = fishingService.getCulturalName(fish, culturalZone);

    if (onInventoryUpdate) {
      console.log('🎣 Creating fish item for inventory');
      const fishItem: Item = {
        id: `FISH_${fish.id.toUpperCase()}_${Date.now()}`,
        name: culturalName,
        type: 'consumable',
        category: 'food',
        value: Math.round(fish.value * (weight / fish.size.min)),
        weight,
        description: fish.description,
        effects: {
          health: Math.round(5 + weight * 2),
          hunger: Math.round(10 + weight * 3)
        },
        stackable: true,
        quantity: 1
      };

      console.log('🎣 Calling onInventoryUpdate with:', fishItem);
      onInventoryUpdate(fishItem);
      console.log('🎣 onInventoryUpdate called successfully');
    }

    setGameMessage(`Caught a ${culturalName}! (${weight}kg)`);
  };

  // Get water body name based on location
  const getWaterBodyName = () => {
    if (isFreshwater) {
      return biome === BiomeType.WETLANDS ? 'Marshland Waters' : 
             biome === BiomeType.RAINFOREST ? 'River' : 'Lake';
    }
    return isCoastal ? 'Coastal Waters' : 'Open Sea';
  };

  // Get era-specific fishing method
  const getFishingMethod = () => {
    if (historicalEra === HistoricalEra.PREHISTORY) return 'Bone Hook & Sinew Line';
    if (historicalEra === HistoricalEra.ANTIQUITY) return 'Bronze Hook & Hemp Line';
    if (historicalEra === HistoricalEra.MEDIEVAL) return 'Iron Hook & Silk Line';
    if (historicalEra === HistoricalEra.RENAISSANCE_EARLY_MODERN) return 'Steel Hook & Cotton Line';
    if (historicalEra === HistoricalEra.INDUSTRIAL_ERA) return 'Manufactured Rod & Reel';
    if (historicalEra === HistoricalEra.MODERN_ERA) return 'Carbon Fiber Rod & Synthetic Line';
    return 'Traditional Fishing Gear';
  };

  // Helper function to determine size category from min/max weight
  const getSizeCategory = (sizeRange: { min: number; max: number }): string => {
    const avgWeight = (sizeRange.min + sizeRange.max) / 2;
    if (avgWeight >= 50) return 'huge';
    if (avgWeight >= 10) return 'large';
    if (avgWeight >= 2) return 'medium';
    if (avgWeight >= 0.5) return 'small';
    return 'tiny';
  };

  if (!isOpen) return null;

  // When fishing game is active, show it fullscreen in viewport
  if (isGameActive) {
    return (
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
          opacity: fadeIn ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out'
        }}
      >
        <FishingHutInteractive
          structure={structure}
          era={year.toString()}
          culturalZone={culturalZone}
          climate={climate}
          season={season}
          timeOfDay={timeOfDay}
          weather={weather}
          adjacentBiomes={[biome]}
          availableFish={availableFish}
          historicalEra={historicalEra}
          playerCharacter={playerCharacter}
          isFreshwater={isFreshwater}
          onCatch={handleCatch}
          onExit={() => {
            setFadeIn(false);
            setTimeout(() => {
              setIsGameActive(false);
              setTimeout(() => setFadeIn(true), 10);
            }, 300);
          }}
          fishingService={fishingService}
        />
      </div>
    );
  }

  // Main modal interface (matches GovernmentDistrictModal pattern)
  return (
    <div
      ref={modalRef}
      className="relative w-full h-full flex flex-col bg-slate-900"
      style={{
        opacity: fadeIn ? 1 : 0,
        transform: fadeIn ? 'translateY(0)' : 'translateY(10px)',
        transition: 'all 0.3s ease-out'
      }}
    >
      {/* Banner header with fishing hut scene */}
      <div className="relative h-48 md:h-56 overflow-hidden flex-shrink-0">
        <div style={{ transform: 'translateX(-25%)', width: '150%' }}>
          <FishingHutBanner
            structure={structure}
            era={year.toString()}
            culturalZone={culturalZone.toLowerCase() as any}
            climate={climate}
            season={season}
            timeOfDay={timeOfDay}
            width={typeof window !== 'undefined' ? Math.max(800, window.innerWidth * 0.75) : 800}
            height={224}
            weather={weather}
            adjacentBiomes={[biome]}
            gameMode={false}
          />
        </div>

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900/90 pointer-events-none" />
        
        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
            Fishing Hut - {getWaterBodyName()}
          </h2>
          <p className="text-sm text-slate-300">
            {getFishingMethod()} • {availableFish.length} species available • {timeOfDay || 'Day'}
          </p>
        </div>
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
        >
          <FaTimes size={16} />
        </button>
      </div>

      {/* Tab navigation */}
      <div className="flex border-b border-slate-700 px-2 md:px-4 bg-slate-800/50 overflow-x-auto">
        <button
          onClick={() => setActiveTab('info')}
          className={`flex items-center px-3 md:px-4 py-3 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'info' 
              ? 'text-blue-400 border-b-2 border-blue-400' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <GiFishingHook className="mr-1 md:mr-2 text-sm md:text-base" />
          <span className="text-sm md:text-base">Info</span>
        </button>
        <button
          onClick={() => setActiveTab('buy')}
          className={`flex items-center px-3 md:px-4 py-3 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'buy' 
              ? 'text-blue-400 border-b-2 border-blue-400' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FaStore className="mr-1 md:mr-2 text-sm md:text-base" />
          <span className="text-sm md:text-base">Buy</span>
        </button>
        <button
          onClick={() => setActiveTab('sell')}
          className={`flex items-center px-3 md:px-4 py-3 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'sell' 
              ? 'text-blue-400 border-b-2 border-blue-400' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FaCoins className="mr-1 md:mr-2 text-sm md:text-base" />
          <span className="text-sm md:text-base">Sell</span>
        </button>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'info' && (
          <div className="space-y-6">
            {/* Statistics */}
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/60 border border-slate-700/50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-blue-300 mb-4 flex items-center">
                <FaFish className="mr-2 text-blue-400" />
                Fishing Statistics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/30">
                  <p className="text-xs text-slate-400 mb-1">Species Found</p>
                  <div className="flex items-center gap-2">
                    <p className={`text-xl font-bold ${
                      uniqueSpeciesCaught.size === availableFish.length 
                        ? 'text-green-400' 
                        : uniqueSpeciesCaught.size > availableFish.length * 0.7 
                        ? 'text-blue-400'
                        : uniqueSpeciesCaught.size > availableFish.length * 0.4
                        ? 'text-yellow-400'
                        : 'text-slate-300'
                    }`}>
                      {uniqueSpeciesCaught.size}/{availableFish.length}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      uniqueSpeciesCaught.size === availableFish.length 
                        ? 'bg-green-900/40 text-green-300' 
                        : uniqueSpeciesCaught.size > availableFish.length * 0.7 
                        ? 'bg-blue-900/40 text-blue-300'
                        : uniqueSpeciesCaught.size > availableFish.length * 0.4
                        ? 'bg-yellow-900/40 text-yellow-300'
                        : 'bg-slate-700/40 text-slate-400'
                    }`}>
                      {Math.round((uniqueSpeciesCaught.size / availableFish.length) * 100)}%
                    </span>
                  </div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/30">
                  <p className="text-xs text-slate-400 mb-1">Total Caught</p>
                  <div className="flex items-center gap-2">
                    <p className={`text-xl font-bold ${
                      catchHistory.length > 50 ? 'text-green-400' :
                      catchHistory.length > 20 ? 'text-blue-400' :
                      catchHistory.length > 5 ? 'text-yellow-400' :
                      'text-slate-300'
                    }`}>
                      {catchHistory.length}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      catchHistory.length > 50 ? 'bg-green-900/40 text-green-300' :
                      catchHistory.length > 20 ? 'bg-blue-900/40 text-blue-300' :
                      catchHistory.length > 5 ? 'bg-yellow-900/40 text-yellow-300' :
                      'bg-slate-700/40 text-slate-400'
                    }`}>
                      {catchHistory.length > 50 ? 'Expert' :
                       catchHistory.length > 20 ? 'Skilled' :
                       catchHistory.length > 5 ? 'Novice' : 'Beginner'}
                    </span>
                  </div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/30">
                  <p className="text-xs text-slate-400 mb-1">Total Weight</p>
                  <div className="flex items-center gap-2">
                    <p className={`text-xl font-bold ${
                      totalWeight > 100 ? 'text-green-400' :
                      totalWeight > 50 ? 'text-blue-400' :
                      totalWeight > 10 ? 'text-yellow-400' :
                      'text-slate-300'
                    }`}>
                      {totalWeight.toFixed(1)} kg
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      totalWeight > 100 ? 'bg-green-900/40 text-green-300' :
                      totalWeight > 50 ? 'bg-blue-900/40 text-blue-300' :
                      totalWeight > 10 ? 'bg-yellow-900/40 text-yellow-300' :
                      'bg-slate-700/40 text-slate-400'
                    }`}>
                      {totalWeight > 100 ? 'Bounty' :
                       totalWeight > 50 ? 'Good' :
                       totalWeight > 10 ? 'Fair' : 'Meager'}
                    </span>
                  </div>
                </div>
                {bestCatch && (
                  <div className="bg-gradient-to-br from-yellow-900/20 to-amber-900/20 border border-yellow-700/30 rounded-lg p-3">
                    <p className="text-xs text-amber-200/70 mb-1">Best Catch</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xl font-bold text-yellow-400">{bestCatch.weight.toFixed(1)} kg</p>
                      <span className="text-xs bg-yellow-900/50 text-yellow-300 px-2 py-0.5 rounded-full border border-yellow-600/30">
                        🏆 Record
                      </span>
                    </div>
                    <p className="text-xs text-amber-300/60 mt-1 truncate">
                      {fishingService.getCulturalName(bestCatch.species, culturalZone)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Species list */}
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/60 border border-slate-700/50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-blue-300 mb-4 flex items-center">
                <span className="text-blue-400 mr-2">🐟</span>
                Available Species
                <span className="ml-auto text-sm text-slate-400">
                  ({uniqueSpeciesCaught.size}/{availableFish.length} discovered)
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableFish.map(species => {
                  const isCaught = uniqueSpeciesCaught.has(species.id);
                  const culturalName = fishingService.getCulturalName(species, culturalZone);
                  const caughtCount = catchHistory.filter(c => c.species.id === species.id).length;
                  
                  return (
                    <div 
                      key={species.id}
                      className={`group bg-gradient-to-br border rounded-lg p-3 transition-all duration-200 ${
                        isCaught 
                          ? 'from-slate-700/60 to-slate-800/40 border-slate-600/50 hover:border-slate-500/70' 
                          : 'from-slate-800/40 to-slate-900/60 border-slate-700/30'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className={`font-medium ${isCaught ? 'text-white' : 'text-slate-500'}`}>
                          {isCaught ? culturalName : '???'}
                        </span>
                        {isCaught && (
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              species.rarity === 'legendary' ? 'bg-purple-900/40 text-purple-300 border border-purple-700/30' :
                              species.rarity === 'rare' ? 'bg-blue-900/40 text-blue-300 border border-blue-700/30' :
                              species.rarity === 'uncommon' ? 'bg-green-900/40 text-green-300 border border-green-700/30' :
                              'bg-slate-700/50 text-slate-300 border border-slate-600/30'
                            }`}>
                              {species.rarity}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {isCaught && (
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">
                            Caught: <span className={`font-medium ${
                              caughtCount > 10 ? 'text-green-400' :
                              caughtCount > 5 ? 'text-blue-400' :
                              caughtCount > 1 ? 'text-yellow-400' :
                              'text-slate-300'
                            }`}>
                              {caughtCount}x
                            </span>
                          </span>
                          {species.size && (
                            <span className={`px-2 py-0.5 rounded ${
                              getSizeCategory(species.size) === 'large' || getSizeCategory(species.size) === 'huge' ? 'bg-red-900/30 text-red-300' :
                              getSizeCategory(species.size) === 'medium' ? 'bg-yellow-900/30 text-yellow-300' :
                              'bg-green-900/30 text-green-300'
                            }`}>
                              {getSizeCategory(species.size)}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {!isCaught && (
                        <div className="text-xs text-slate-500 italic">
                          Species not yet discovered
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Game message */}
            {gameMessage && (
              <div className="bg-green-900/50 border border-green-500 rounded-lg p-3 text-green-300">
                {gameMessage}
              </div>
            )}
          </div>
        )}

        {activeTab === 'buy' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/60 border border-slate-700/50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-blue-300 mb-4 flex items-center">
                <FaShoppingCart className="mr-2 text-blue-400" />
                Fishing Supplies
                <span className="ml-auto text-sm text-slate-400">Local Market</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'Basic Fishing Hook', price: 5, description: 'Simple iron hook for catching small fish', icon: '🪝', quality: 'common', availability: 'abundant' },
                  { name: 'Quality Bait', price: 3, description: 'Fresh worms and insects to attract fish', icon: '🪱', quality: 'common', availability: 'abundant' },
                  { name: 'Fishing Net', price: 25, description: 'Small net for catching multiple fish', icon: '🕸️', quality: 'uncommon', availability: 'limited' },
                  { name: 'Tackle Box', price: 15, description: 'Organize your fishing equipment', icon: '📦', quality: 'common', availability: 'good' },
                  { name: 'Fishing Line', price: 8, description: 'Strong line that won\'t break easily', icon: '🧵', quality: 'common', availability: 'good' },
                  { name: 'Fishing Rod', price: 40, description: 'Well-crafted rod for serious anglers', icon: '🎣', quality: 'rare', availability: 'scarce' }
                ].map((item, index) => (
                  <div key={index} className="group bg-gradient-to-br from-slate-700/60 to-slate-800/40 border border-slate-600/50 rounded-lg p-4 hover:border-slate-500/70 transition-all duration-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center flex-1">
                        <span className="text-2xl mr-3">{item.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-white">{item.name}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              item.quality === 'rare' ? 'bg-purple-900/40 text-purple-300 border border-purple-700/30' :
                              item.quality === 'uncommon' ? 'bg-blue-900/40 text-blue-300 border border-blue-700/30' :
                              'bg-slate-700/50 text-slate-300 border border-slate-600/30'
                            }`}>
                              {item.quality}
                            </span>
                          </div>
                          <p className="text-sm text-slate-400 mb-2">{item.description}</p>
                          <div className="flex items-center gap-3">
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              item.availability === 'abundant' ? 'bg-green-900/30 text-green-300' :
                              item.availability === 'good' ? 'bg-blue-900/30 text-blue-300' :
                              item.availability === 'limited' ? 'bg-yellow-900/30 text-yellow-300' :
                              item.availability === 'scarce' ? 'bg-orange-900/30 text-orange-300' :
                              'bg-red-900/30 text-red-300'
                            }`}>
                              {item.availability}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-400 font-bold text-lg">{item.price}</span>
                        <span className="text-xs text-slate-400">coins</span>
                      </div>
                      <button
                        onClick={() => onBuy && onBuy(item.name.toLowerCase().replace(/\s+/g, '_'), item.price)}
                        className={`px-4 py-2 font-medium text-sm rounded-lg transition-all duration-200 transform hover:scale-105 ${
                          item.availability === 'scarce'
                            ? 'bg-gradient-to-r from-orange-600/80 to-red-600/80 hover:from-orange-500/90 hover:to-red-500/90 text-white'
                            : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-900/30'
                        }`}
                      >
                        Buy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sell' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/60 border border-slate-700/50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-green-300 mb-4 flex items-center">
                <FaCoins className="mr-2 text-yellow-400" />
                Sell Your Catch
                <span className="ml-auto text-sm text-slate-400">Trading Post</span>
              </h3>
              {playerCharacter.inventory?.filter(item => 
                item.category === 'food' && (item.name.toLowerCase().includes('fish') || item.description?.toLowerCase().includes('fish'))
              ).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {playerCharacter.inventory
                    ?.filter(item => item.category === 'food' && (item.name.toLowerCase().includes('fish') || item.description?.toLowerCase().includes('fish')))
                    .map((item, index) => {
                      const fishValue = item.value || Math.round((item.weight || 1) * 2);
                      const condition = (item.weight || 1) > 5 ? 'excellent' : (item.weight || 1) > 2 ? 'good' : 'fair';
                      const freshness = Math.random() > 0.3 ? 'fresh' : 'aging';
                      
                      return (
                        <div key={index} className="group bg-gradient-to-br from-slate-700/60 to-slate-800/40 border border-slate-600/50 rounded-lg p-4 hover:border-slate-500/70 transition-all duration-200">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center flex-1">
                              <span className="text-2xl mr-3">🐟</span>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-white">{item.name}</h4>
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                    condition === 'excellent' ? 'bg-green-900/40 text-green-300 border border-green-700/30' :
                                    condition === 'good' ? 'bg-blue-900/40 text-blue-300 border border-blue-700/30' :
                                    'bg-yellow-900/40 text-yellow-300 border border-yellow-700/30'
                                  }`}>
                                    {condition}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-400 mb-2">{item.description}</p>
                                <div className="flex items-center gap-3 text-xs">
                                  <span className="text-slate-400">
                                    Weight: <span className="text-white font-medium">{item.weight}kg</span>
                                  </span>
                                  <span className="text-slate-400">•</span>
                                  <span className="text-slate-400">
                                    Qty: <span className="text-white font-medium">{item.quantity || 1}</span>
                                  </span>
                                  <span className="text-slate-400">•</span>
                                  <span className={`px-2 py-0.5 rounded ${
                                    freshness === 'fresh' ? 'bg-green-900/30 text-green-300' : 'bg-orange-900/30 text-orange-300'
                                  }`}>
                                    {freshness}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-yellow-400 font-bold text-lg">{fishValue}</span>
                              <span className="text-xs text-slate-400">coins</span>
                              {fishValue > 10 && (
                                <span className="text-xs bg-green-900/40 text-green-300 px-2 py-0.5 rounded-full border border-green-700/30">
                                  Good Price
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => onSell && onSell(item, fishValue)}
                              className="px-4 py-2 font-medium text-sm rounded-lg transition-all duration-200 transform hover:scale-105 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-900/30"
                            >
                              Sell
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4 opacity-50">🎣</div>
                  <p className="text-slate-400 text-lg mb-2">No fish in your inventory to sell.</p>
                  <p className="text-sm text-slate-500">Go fishing first to catch some fish!</p>
                  <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg inline-block">
                    <p className="text-xs text-blue-300">💡 Tip: Larger fish fetch better prices!</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action button */}
      <div className="p-4 border-t border-slate-700 bg-slate-800/50">
        <button
          onClick={() => {
            setFadeIn(false);
            setTimeout(() => {
              setIsGameActive(true);
              setTimeout(() => setFadeIn(true), 10);
            }, 300);
          }}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <GiBoatFishing size={24} />
          Go Fishing
        </button>
      </div>
    </div>
  );
};

export default FishingHutModal;