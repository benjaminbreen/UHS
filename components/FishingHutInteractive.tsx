/**
 * FishingHutInteractive.tsx - Interactive fishing game layer over FishingHutBanner
 * Adds game mechanics while preserving the beautiful banner visuals
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import FishingHutBanner, { Fish, GROUND_Y_DEFAULT, WATER_OFFSET, OCEAN_COLORS } from './FishingHutBanner';
import { FishSpecies, FishingDataService } from '../services/fishingDataService';
import { fishingGameState, GameFish } from '../services/fishingGameStateService';
import { gameSounds } from '../services/gameSoundsService';
import { CulturalZone } from '../types/characterData';
import { HistoricalEra } from '../types/ambiance';
import { ClimateType, Season, TimeOfDay, BiomeType, PlayerCharacter } from '../types';
import type { TerrainStructure } from '../types/structures';
import type { WeatherState } from '../services/weatherService';

// Helper function to adjust color brightness for depth effects
function adjustColorBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent * 100);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

// Helper function to determine creature type and shape from species name
function getCreatureType(speciesName: string): string {
  const name = speciesName.toLowerCase();

  // Marine creatures
  if (name.includes('octopus')) return 'octopus';
  if (name.includes('squid')) return 'squid';
  if (name.includes('urchin')) return 'sea_urchin';
  if (name.includes('star')) return 'sea_star';
  if (name.includes('crab')) return 'crab';
  if (name.includes('lobster')) return 'lobster';
  if (name.includes('ray') || name.includes('skate')) return 'ray';
  if (name.includes('eel')) return 'eel';
  if (name.includes('shark')) return 'shark';

  // Fish shapes
  if (name.includes('tuna') || name.includes('marlin') || name.includes('swordfish')) return 'torpedo';
  if (name.includes('flounder') || name.includes('sole') || name.includes('halibut')) return 'flatfish';
  if (name.includes('angelfish') || name.includes('discus')) return 'round';
  if (name.includes('pike') || name.includes('barracuda') || name.includes('needlefish')) return 'elongated';
  if (name.includes('pufferfish') || name.includes('boxfish')) return 'round';
  if (name.includes('seahorse')) return 'seahorse';
  if (name.includes('bass') || name.includes('perch')) return 'deep_body';
  if (name.includes('trout') || name.includes('salmon')) return 'streamlined';
  if (name.includes('catfish')) return 'bottom_dweller';

  // Default fish shape
  return 'standard';
}

interface FishingHutInteractiveProps {
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

const FishingHutInteractive: React.FC<FishingHutInteractiveProps> = ({
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
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 }); // Default dimensions

  // Responsive dimensions that fill container
  const GAME_WIDTH = dimensions.width;
  const GAME_HEIGHT = dimensions.height;
  const GROUND_Y = Math.round(GAME_HEIGHT * 0.22); // Higher water level for more underwater space
  const WATER_Y = GROUND_Y + 5;
  const OCEAN_FLOOR_HEIGHT = 20; // Increased height of ocean floor layer for better visibility
  const MAX_DEPTH = GAME_HEIGHT - WATER_Y - OCEAN_FLOOR_HEIGHT - 5; // Stop 5px above ocean floor
  
  // Handle container resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    // Initial dimensions
    updateDimensions();

    // Update on resize
    const handleResize = () => updateDimensions();
    window.addEventListener('resize', handleResize);

    // Use ResizeObserver if available for more accurate container resizing
    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateDimensions);
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);
  
  // Game state
  const [lineState, setLineState] = useState(fishingGameState.getLineState());
  const [powerBar, setPowerBar] = useState(fishingGameState.getPowerBar());
  const [stats, setStats] = useState(fishingGameState.getStats());
  const [ripples, setRipples] = useState(fishingGameState.getRipples());
  const [bannerFish, setBannerFish] = useState<Fish[]>([]);
  const [hoveredFishId, setHoveredFishId] = useState<string | null>(null);
  const [isHoldingCast, setIsHoldingCast] = useState(false);
  const [isReeling, setIsReeling] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [gameEvent, setGameEvent] = useState<'cast' | 'catch' | 'escape' | null>(null);
  const [selectedBait, setSelectedBait] = useState<string>('worm');
  
  // Check player inventory for rods and bait
  const availableRods = useMemo(() => {
    if (!playerCharacter?.inventory) return [];
    const rods = [];
    
    // Check for different rod types in inventory
    const inventory = playerCharacter.inventory;
    if (inventory.some(item => 
      item.name?.toLowerCase().includes('master') && 
      item.name?.toLowerCase().includes('rod')
    )) {
      rods.push({ id: 'master', name: 'Master Rod', bonus: 1.4 });
    }
    if (inventory.some(item => 
      (item.name?.toLowerCase().includes('good') || item.name?.toLowerCase().includes('quality')) && 
      item.name?.toLowerCase().includes('rod')
    )) {
      rods.push({ id: 'good', name: 'Good Rod', bonus: 1.2 });
    }
    if (inventory.some(item => 
      item.name?.toLowerCase().includes('rod')
    )) {
      rods.push({ id: 'basic', name: 'Basic Rod', bonus: 1.0 });
    }
    
    return rods;
  }, [playerCharacter?.inventory]);
  
  // Get best available rod, or default to basic
  const selectedRod = useMemo(() => {
    if (availableRods.find(r => r.id === 'master')) return 'master';
    if (availableRods.find(r => r.id === 'good')) return 'good';
    return 'basic'; // Default rod if no rod in inventory
  }, [availableRods]);
  
  // Get available bait from inventory
  const availableBait = useMemo(() => {
    const baitItems = [{ id: 'worm', name: 'Worm (default)' }];
    
    if (playerCharacter?.inventory) {
      // Add any food items or potential bait from inventory
      playerCharacter.inventory.forEach(item => {
        if (item.name && (
          item.type === 'food' || 
          item.name.toLowerCase().includes('meat') ||
          item.name.toLowerCase().includes('bread') ||
          item.name.toLowerCase().includes('insect') ||
          item.name.toLowerCase().includes('berry') ||
          item.name.toLowerCase().includes('grain') ||
          item.name.toLowerCase().includes('corn') ||
          item.name.toLowerCase().includes('cheese')
        )) {
          baitItems.push({ id: item.id || item.name, name: item.name });
        }
      });
    }
    
    return baitItems;
  }, [playerCharacter?.inventory]);
  const [waterParticles, setWaterParticles] = useState<Array<{
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
    type: 'bubble' | 'splash' | 'ripple';
  }>>([]);
  const [floatingScores, setFloatingScores] = useState<Array<{
    id: string;
    x: number;
    y: number;
    value: number;
    combo: number;
    opacity?: number;
  }>>([]);
  const [frame, setFrame] = useState(0);
  const [reelPulses, setReelPulses] = useState<number[]>([]);
  const [catchAnimation, setCatchAnimation] = useState<{ x: number; y: number; fish: GameFish } | null>(null);
  const [bubbleStreams, setBubbleStreams] = useState<Array<{ x: number; startY: number; id: string }>>([]);
  
  // Simple reeling state
  const [reelState, setReelState] = useState<{
    active: boolean;
    progress: number; // 0-1, how close to catching fish
    isReeling: boolean; // whether player is currently holding reel button
    fishName: string;
    fishHooked: boolean; // clear visual feedback that fish is hooked
  }>({
    active: false,
    progress: 0,
    isReeling: false,
    fishName: '',
    fishHooked: false
  });

  // Simple casting state
  const [castState, setCastState] = useState<{
    isCharging: boolean; // holding down to determine depth
    depth: number; // how deep the line will go
    maxDepth: number;
  }>({
    isCharging: false,
    depth: 0,
    maxDepth: MAX_DEPTH
  });

  // Fish collection tracking
  const [fishCollection, setFishCollection] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('fishCollection');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [totalCatches, setTotalCatches] = useState(() => {
    return parseInt(localStorage.getItem('totalFishCaught') || '0');
  });

  // Simple catch notification
  const [catchNotification, setCatchNotification] = useState<{
    active: boolean;
    fishName: string;
    isNewSpecies: boolean;
    weight: number;
    length: number;
  } | null>(null);
  
  // Fish victory display state
  const [fishVictory, setFishVictory] = useState<{
    show: boolean;
    fish: GameFish | null;
    weight: number;
    length: number;
    isNewSpecies: boolean;
  } | null>(null);

  // Visual improvements
  const [bubbles, setBubbles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    opacity: number;
  }>>([]);

  // Simplified minigame state for spacebar reeling
  const [minigame, setMinigame] = useState<{
    active: boolean;
    fishPosition: number;
    playerPosition: number;
    fishDirection: number;
    fishSpeed: number;
    progress: number;
    greenZoneSize: number;
    fishRarity: 'common' | 'uncommon' | 'rare' | 'legendary';
    hookedFish?: GameFish | null; // Store reference to the hooked fish
    complete?: boolean; // Track if minigame is complete
    processing?: boolean; // Prevent multiple catch processing
  }>({
    active: false,
    fishPosition: 0.5,
    playerPosition: 0.5,
    fishDirection: 1,
    fishSpeed: 0.01,
    progress: 0,
    greenZoneSize: 0.3,
    fishRarity: 'common',
    hookedFish: null,
    complete: false,
    processing: false
  });

  // Generate random bubbles effect
  useEffect(() => {
    const interval = setInterval(() => {
      // Add new bubble randomly from fish positions
      if (Math.random() < 0.3 && fishingGameState.getFish().length > 0) {
        const fish = fishingGameState.getFish();
        const randomFish = fish[Math.floor(Math.random() * fish.length)];
        const newBubble = {
          id: Date.now() + Math.random(),
          x: randomFish.x + (Math.random() - 0.5) * 20,
          y: randomFish.y,
          size: 2 + Math.random() * 4,
          opacity: 0.3 + Math.random() * 0.3
        };
        setBubbles(prev => [...prev, newBubble].slice(-15)); // Keep max 15 bubbles
      }
      
      // Animate existing bubbles upward
      setBubbles(prev => prev.map(b => ({
        ...b,
        y: b.y - 1.5,
        x: b.x + Math.sin(b.y / 20) * 0.5,
        opacity: b.opacity * 0.98
      })).filter(b => b.y > WATER_Y && b.opacity > 0.1));
    }, 150);
    
    return () => clearInterval(interval);
  }, [WATER_Y]);
  
  // Animation frame counter
  useEffect(() => {
    let animationId: number;
    const animate = () => {
      setFrame(prev => prev + 1);
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Spacebar keyboard handling for simplified reeling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        if (minigame.active) {
          // Spacebar pressed - start reeling (fill progress bar)
          setReelState(prev => ({ ...prev, isReeling: true }));
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        if (minigame.active) {
          // Spacebar released - stop reeling
          setReelState(prev => ({ ...prev, isReeling: false }));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [minigame.active]);

  // Enhanced reeling system with fish resistance and escape mechanics
  useEffect(() => {
    if (!minigame.active) return;

    const interval = setInterval(() => {
      setMinigame(prev => {
        const newMinigame = { ...prev };
        const fish = prev.hookedFish;

        if (!fish) return prev;

        // Calculate fish resistance based on species rarity and stamina
        const rarityMultiplier = fish.species.rarity === 'legendary' ? 2.5 :
                                 fish.species.rarity === 'rare' ? 1.8 :
                                 fish.species.rarity === 'uncommon' ? 1.3 : 1.0;

        // Fish stamina decreases over time (fish gets tired)
        fish.stamina = Math.max(0, fish.stamina - 0.3);

        // Fish resistance is stronger when stamina is high
        const staminaFactor = (fish.stamina / 100);
        const baseResistance = 0.008 * rarityMultiplier * staminaFactor;

        // Fish occasionally fights back with bursts of resistance
        const fightingBack = Math.random() < (0.02 * rarityMultiplier);
        const burstResistance = fightingBack ? 0.03 : 0;

        // Calculate reel effectiveness based on timing
        let reelPower = 0;
        if (reelState.isReeling) {
          // Base reel power
          reelPower = 0.015;

          // Bonus for good timing (when fish isn't fighting)
          if (!fightingBack) {
            reelPower *= 1.3;
          } else {
            // Reduced effectiveness when fish is fighting
            reelPower *= 0.5;
          }

          // Smooth acceleration - reeling gets more effective the longer you hold
          const reelDuration = (prev.reelStartTime || Date.now());
          const timeHeld = Math.min((Date.now() - reelDuration) / 1000, 3); // Cap at 3 seconds
          reelPower *= (1 + timeHeld * 0.2); // Up to 60% bonus for sustained reeling
        } else {
          // Record when reeling stopped for acceleration calculation
          if (prev.reelStartTime) {
            newMinigame.reelStartTime = null;
          }
        }

        // Record when reeling started
        if (reelState.isReeling && !prev.reelStartTime) {
          newMinigame.reelStartTime = Date.now();
        }

        // Calculate net progress change
        const progressChange = reelPower - baseResistance - burstResistance;

        // Apply smooth progress with momentum
        const momentum = prev.progressMomentum || 0;
        const newMomentum = momentum * 0.9 + progressChange * 0.1; // Smooth momentum
        newMinigame.progressMomentum = newMomentum;
        newMinigame.progress += newMomentum;

        // Store if fish is fighting for visual feedback
        newMinigame.fishFighting = fightingBack;

        // Clamp progress between 0 and 1
        newMinigame.progress = Math.max(0, Math.min(1, newMinigame.progress));

        // Fish can escape if progress gets too low
        if (newMinigame.progress <= 0 && Math.random() < 0.1) {
          console.log('🐟 Fish escaped!');
          // Reset minigame
          fishingGameState.unhookFish();
          return {
            active: false,
            progress: 0,
            hookedFish: null,
            complete: false,
            processing: false,
            fishFighting: false,
            progressMomentum: 0,
            reelStartTime: null
          };
        }

        // Check win condition
        if (newMinigame.progress >= 1.0) {
          console.log('🎣 Minigame complete! Progress: 100%');

          return {
            ...newMinigame,
            progress: 1.0,
            complete: true,
            fishFighting: false
          };
        }

        return newMinigame;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [minigame.active, reelState.isReeling]);

  // Handle minigame completion with side effects
  useEffect(() => {
    if (minigame.complete && minigame.hookedFish && !minigame.processing) {
      const hookedFish = minigame.hookedFish;
      console.log('🎣 Processing catch for:', hookedFish.species.name);
      
      // Mark as processing to prevent multiple triggers
      setMinigame(prev => ({ ...prev, processing: true }));
      
      const weight = 2 + Math.random() * 8;
      const length = 20 + Math.random() * 80;
      
      // Track in collection
      const isNewSpecies = !fishCollection.has(hookedFish.species.name);
      if (isNewSpecies) {
        const newCollection = new Set(fishCollection);
        newCollection.add(hookedFish.species.name);
        setFishCollection(newCollection);
        localStorage.setItem('fishCollection', JSON.stringify(Array.from(newCollection)));
      }
      
      // Update total catches
      const newTotal = totalCatches + 1;
      setTotalCatches(newTotal);
      localStorage.setItem('totalFishCaught', newTotal.toString());
      
      // Show fish victory display
      setFishVictory({
        show: true,
        fish: hookedFish,
        weight,
        length,
        isNewSpecies
      });
      
      // Play success sound
      gameSounds.playTradeSuccessSound();
      
      // Call onCatch callback to add to inventory
      onCatch(hookedFish.species, weight, length);
      
      // Reset fishing state
      fishingGameState.reset();
      setLineState(fishingGameState.getLineState());
      setReelState(prev => ({ ...prev, active: false, progress: 0, isReeling: false, fishHooked: false }));
      
      // Reset minigame
      setMinigame({
        active: false,
        fishPosition: 0.5,
        playerPosition: 0.5,
        fishDirection: 1,
        fishSpeed: 0.01,
        progress: 0,
        greenZoneSize: 0.3,
        fishRarity: 'common',
        hookedFish: null,
        complete: false,
        processing: false
      });
    }
  }, [minigame.complete, minigame.hookedFish, minigame.processing, fishCollection, totalCatches, onCatch]);

  // Start simplified minigame when fish gets hooked
  useEffect(() => {
    if (lineState.hookedFish && !minigame.active) {
      console.log('🎣 Starting minigame for:', lineState.hookedFish.species.name);
      setMinigame({
        active: true,
        fishPosition: 0.5,
        playerPosition: 0.5,
        fishDirection: 1,
        fishSpeed: 0.01,
        progress: 0, // Start from 0 for clear progress indication
        greenZoneSize: 0.3,
        fishRarity: 'common',
        hookedFish: lineState.hookedFish, // Store the hooked fish reference
        complete: false
      });
      
      // Initialize reel state for spacebar controls
      setReelState(prev => ({ 
        ...prev, 
        active: true, 
        fishHooked: true, 
        fishName: lineState.hookedFish?.species.name || 'Fish',
        progress: 0,
        isReeling: false
      }));
    }
  }, [lineState.hookedFish, minigame.active]);
  
  // Update rod and bait in game state when selection changes
  useEffect(() => {
    fishingGameState.setRodType(selectedRod);
  }, [selectedRod]);
  
  useEffect(() => {
    fishingGameState.setBaitType(selectedBait);
  }, [selectedBait]);
  
  // Initialize behavior system
  useEffect(() => {
    fishingGameState.initializeBehaviorSystem({
      climate,
      season,
      timeOfDay: timeOfDay as any,
      weather: weather ? {
        precipitation: weather.precipitation || 0,
        windSpeed: weather.windSpeed || 0
      } : undefined,
      waterDepth: MAX_DEPTH,
      isFreshwater
    });
  }, [climate, season, timeOfDay, weather, isFreshwater, MAX_DEPTH]);
  
  // Subscribe to game state changes
  useEffect(() => {
    const unsubscribe = fishingGameState.subscribe(() => {
      setLineState(fishingGameState.getLineState());
      setPowerBar(fishingGameState.getPowerBar());
      setStats(fishingGameState.getStats());
      setRipples(fishingGameState.getRipples());
    });
    
    return () => {
      unsubscribe();
      fishingGameState.reset();
    };
  }, []);
  
  // Initialize fish immediately when component mounts
  useEffect(() => {
    // Initialize behavior system first
    fishingGameState.initializeBehaviorSystem({
      climate,
      season,
      timeOfDay: timeOfDay as any,
      weather: weather ? {
        precipitation: weather.precipitation || 0,
        windSpeed: weather.windSpeed || 0
      } : undefined,
      waterDepth: MAX_DEPTH,
      isFreshwater
    });
    
    // Create initial fish if none exist - FORCE SPAWN FOR DEBUGGING
    const currentFish = fishingGameState.getFish();
    // console.log('🐟 FISH SPAWN CHECK:', {
    //   currentFishCount: currentFish.length,
    //   availableFishCount: availableFish.length,
    //   availableFishNames: availableFish.map(f => f.name)
    // });
    
    if (currentFish.length < 8) { // Maintain minimum fish population
      // console.log('🚀 FORCE SPAWNING FISH - no current fish detected');
      
      // Use the actual available fish species - they should always be provided
      // console.log('🐠 Using fish variety:', availableFish.map(f => f.name));
      const fishSpecies = availableFish;
      
      // Spawn fish to reach target population
      const targetFishCount = 4;
      const fishCount = targetFishCount - currentFish.length;
      // console.log(`🐟 Spawning ${fishCount} fish using species:`, fishSpecies.map(f => f.name));
      
      // Add sea urchins and sea stars on the ocean floor
      if (!isFreshwater && Math.random() < 0.4) {
        // Sea urchins
        const urchinCount = 1 + Math.floor(Math.random() * 2);
        for (let u = 0; u < urchinCount; u++) {
          const seaUrchin: GameFish = {
            id: `sea_urchin_${u}_${Date.now()}`,
            species: { name: 'Purple Sea Urchin', rarity: 'common' as const, size: { min: 2, max: 4 }, value: 25 },
            x: 100 + Math.random() * (GAME_WIDTH - 200),
            y: GAME_HEIGHT - OCEAN_FLOOR_HEIGHT - 5 - Math.random() * 5, // On ocean floor
            vx: 0, // Sea urchins don't move
            vy: 0,
            size: 3 + Math.random() * 2,
            weight: 2 + Math.random() * 2,
            direction: 'right',
            interested: false,
            hooked: false,
            escaping: false,
            stamina: 100,
            distanceToHook: 1000
          };
          fishingGameState.registerFish(seaUrchin);
        }

        // Sea stars
        const starCount = 1 + Math.floor(Math.random() * 2);
        for (let s = 0; s < starCount; s++) {
          const seaStar: GameFish = {
            id: `sea_star_${s}_${Date.now()}`,
            species: { name: 'Orange Sea Star', rarity: 'uncommon' as const, size: { min: 3, max: 6 }, value: 35 },
            x: 150 + Math.random() * (GAME_WIDTH - 300),
            y: GAME_HEIGHT - OCEAN_FLOOR_HEIGHT - 3 - Math.random() * 5, // On ocean floor
            vx: 0, // Sea stars don't move
            vy: 0,
            size: 4 + Math.random() * 3,
            weight: 3 + Math.random() * 3,
            direction: 'right',
            interested: false,
            hooked: false,
            escaping: false,
            stamina: 100,
            distanceToHook: 1000
          };
          fishingGameState.registerFish(seaStar);
        }
      }

      for (let i = 0; i < fishCount; i++) {
        // Mix cycling through species with some randomization for more variety
        const speciesIndex = Math.random() < 0.7 ?
          i % fishSpecies.length : // Cycle through species 70% of the time
          Math.floor(Math.random() * fishSpecies.length); // Random species 30% of the time
        const species = fishSpecies[speciesIndex];
        const gameFish: GameFish = {
          id: `fish_${i}_${Date.now()}`,
          species,
          x: 100 + Math.random() * (GAME_WIDTH - 200), // Keep away from edges
          y: WATER_Y + 30 + Math.random() * (MAX_DEPTH - 60), // Safe depth range
          vx: (Math.random() - 0.5) * 0.8,
          vy: 0,
          size: 5 + Math.random() * 4,
          weight: species.size.min + Math.random() * (species.size.max - species.size.min),
          direction: Math.random() > 0.5 ? 'right' : 'left',
          interested: false,
          hooked: false,
          escaping: false,
          stamina: 100,
          distanceToHook: 1000
        };
        
        console.log(`🐟 Registering fish ${i}:`, {
          id: gameFish.id,
          species: gameFish.species.name,
          position: { x: gameFish.x.toFixed(1), y: gameFish.y.toFixed(1) }
        });
        
        fishingGameState.registerFish(gameFish);
      }
      
      const finalFishCount = fishingGameState.getFish().length;
      console.log(`✅ Fish spawning complete. Total fish now: ${finalFishCount}`);
    }
  }, [availableFish, climate, season, timeOfDay, weather, isFreshwater, MAX_DEPTH, GAME_WIDTH, WATER_Y]);
  
  // Simple fish animation system - move fish independently
  useEffect(() => {
    const animateFish = () => {
      const gameFish = fishingGameState.getFish();
      gameFish.forEach(fish => {
        // Initialize velocity if not set
        if (fish.vx === undefined) {
          const speed = 0.8 + Math.random() * 0.4;
          fish.vx = Math.random() > 0.5 ? speed : -speed;
        }
        
        // Update position
        fish.x += fish.vx;
        
        // Bounce off screen edges
        if (fish.x <= 50) {
          fish.x = 50;
          fish.vx = Math.abs(fish.vx);
          fish.direction = 'right';
        } else if (fish.x >= GAME_WIDTH - 50) {
          fish.x = GAME_WIDTH - 50;
          fish.vx = -Math.abs(fish.vx);
          fish.direction = 'left';
        }
        
        // Occasional direction changes for realistic swimming
        if (Math.random() < 0.005) {
          fish.vx *= -1;
          fish.direction = fish.vx > 0 ? 'right' : 'left';
        }
      });
    };

    const interval = setInterval(animateFish, 50);
    return () => clearInterval(interval);
  }, [GAME_WIDTH]);
  
  // Particle system functions (defined before use)
  const addSplashParticles = useCallback((x: number, y: number, intensity: number = 1) => {
    const newParticles = [];
    const particleCount = Math.floor(5 + intensity * 10);
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 2 + Math.random() * 3 * intensity;
      newParticles.push({
        id: `splash_${Date.now()}_${i}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2, // Upward bias
        size: 2 + Math.random() * 3,
        opacity: 0.8,
        type: 'splash' as const
      });
    }
    
    setWaterParticles(prev => [...prev, ...newParticles].slice(-50)); // Limit particles
  }, []);
  
  const addBubbles = useCallback((x: number, y: number, count: number = 3) => {
    const newBubbles = [];
    for (let i = 0; i < count; i++) {
      newBubbles.push({
        id: `bubble_${Date.now()}_${i}`,
        x: x + (Math.random() - 0.5) * 20,
        y: y + Math.random() * 10,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -1 - Math.random(), // Float up
        size: 2 + Math.random() * 4,
        opacity: 0.6,
        type: 'bubble' as const
      });
    }
    setWaterParticles(prev => [...prev, ...newBubbles].slice(-50));
  }, []);
  
  // Update particles and floating scores
  useEffect(() => {
    const interval = setInterval(() => {
      // Update water particles
      setWaterParticles(prev => prev
        .map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.type === 'splash' ? p.vy + 0.3 : p.vy, // Gravity for splash
          opacity: p.opacity - 0.02,
          size: p.type === 'bubble' ? p.size + 0.1 : p.size
        }))
        .filter(p => p.opacity > 0 && p.y < GAME_HEIGHT && p.y > WATER_Y - 50)
      );
      
      // Update floating scores (animate upward and fade)
      setFloatingScores(prev => prev
        .map(score => ({
          ...score,
          y: score.y - 2, // Float upward
          opacity: (score.opacity !== undefined ? score.opacity : 1) - 0.02 // Fade out
        }))
        .filter(score => (score.opacity !== undefined ? score.opacity : 1) > 0)
      );
    }, 50);
    return () => clearInterval(interval);
  }, [GAME_HEIGHT, WATER_Y]);
  
  // Game loop (now after particle functions are defined)
  useEffect(() => {
    let lastEscapeCheck = false;
    
    const gameLoop = (timestamp: number) => {
      const deltaTime = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 1000 : 0;
      lastTimeRef.current = timestamp;
      
      // Update game state
      if (isHoldingCast) {
        fishingGameState.updateCastPower(deltaTime);
      }
      
      // Handle reeling
      if (isReeling && lineState.hookedFish) {
        fishingGameState.reelIn(5);
      } else if (lineState.hookedFish) {
        // Not reeling, reset reel speed
        fishingGameState.reelIn(0);
      }
      
      if (lineState.cast) {
        fishingGameState.updateLineDepth(deltaTime);
        
        // Update fish behavior based on hook position
        const hookX = lineState.x;
        const hookY = WATER_Y + lineState.depth;
        fishingGameState.updateFishBehavior(hookX, hookY, deltaTime);
        
        // Check if fish escaped (detect transition)
        const currentlyHooked = fishingGameState.getLineState().hookedFish !== null;
        if (lastEscapeCheck && !currentlyHooked && lineState.hookedFish) {
          // Fish just escaped
          setGameEvent('escape');
          setTimeout(() => setGameEvent(null), 100);
          addSplashParticles(lineState.x, WATER_Y + lineState.depth, 1.5);
        }
        lastEscapeCheck = currentlyHooked;
      }
      
      // Update ripples
      fishingGameState.updateRipples(deltaTime);
      
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };
    
    animationFrameRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isHoldingCast, isReeling, lineState.cast, lineState.hookedFish, lineState.x, lineState.depth, WATER_Y, addSplashParticles]);
  
  // Power bar casting mechanic
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // console.log('🎣 Click event triggered');

    // Don't handle clicks when the victory modal is open
    if (fishVictory?.show) {
      return;
    }

    // Handle touch/click for mobile spacebar alternative
    if (minigame.active) {
      // Touch/click acts like spacebar press for mobile
      setReelState(prev => ({ ...prev, isReeling: true }));
      return;
    }

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) {
      console.log('❌ No container ref');
      return;
    }
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    console.log('🎯 Click coordinates:', { x, y, waterY: WATER_Y, groundY: GROUND_Y, gameHeight: GAME_HEIGHT });
    
    // If line is cast, clicking retracts it
    if (lineState.cast) {
      console.log('🪝 Retracting existing line');
      fishingGameState.retractLine();
      return;
    }
    
    // Click anywhere below the ground line to start power bar (more generous clickable area)
    if (y > GROUND_Y && y < GAME_HEIGHT) {
      console.log('✅ Valid cast area - starting power bar!');
      
      // Start the power bar casting
      setIsHoldingCast(true);
      fishingGameState.startCasting(x, WATER_Y);
      
      console.log('✅ Power bar started');
    } else {
      console.log('❌ Click outside cast area:', { clickY: y, minY: GROUND_Y, maxY: GAME_HEIGHT });
    }
  }, [lineState.cast, WATER_Y, GROUND_Y, GAME_HEIGHT, minigame.active, fishVictory]);
  
  const handleMouseUp = useCallback(() => {
    // Stop mobile reeling if minigame is active
    if (minigame.active) {
      setReelState(prev => ({ ...prev, isReeling: false }));
      return;
    }
    
    // Release the cast if holding
    if (isHoldingCast) {
      console.log('🎣 Releasing cast with power:', powerBar.power);
      
      fishingGameState.releaseCast(MAX_DEPTH);
      setIsHoldingCast(false);
      
      // Play cast sound with power-based intensity
      gameSounds.playFishingCastSound();
      
      // Add splash and bubbles at water surface
      const x = fishingGameState.getLineState().x;
      addSplashParticles(x, WATER_Y + 5, powerBar.perfect ? 2 : 1.5);
      setTimeout(() => {
        addBubbles(x, WATER_Y + 20, 6);
        // Play splash sound when line hits water
        gameSounds.playFishingBiteSound();
      }, 400);
      
      // Send cast event
      setGameEvent('cast');
      setTimeout(() => setGameEvent(null), 100);
    }
  }, [isHoldingCast, MAX_DEPTH, WATER_Y, addSplashParticles, addBubbles, powerBar.power, powerBar.perfect, minigame.active]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }, []);
  
  const handleReel = useCallback(() => {
    if (lineState.cast) {
      fishingGameState.reelIn(10);
      
      // Check if fish was caught
      const caughtFish = fishingGameState.catchFish();
      if (caughtFish) {
        const currentStats = fishingGameState.getStats();
        
        // Calculate size category and value
        const sizeCategory = fishingService.categorizeFishSize(caughtFish.species, caughtFish.weight);
        const sizeMultiplier = fishingService.getSizeMultiplier(sizeCategory);
        const baseValue = caughtFish.species.baseValue || 10;
        const finalValue = Math.round(baseValue * sizeMultiplier);
        
        const points = Math.round(finalValue * currentStats.combo);
        
        console.log(`🎣 Caught ${sizeCategory} ${caughtFish.species.name}! Value: ${finalValue} gold`);
        
        // Play triumphant catch sound!
        gameSounds.playTradeSuccessSound();
        
        onCatch(caughtFish.species, caughtFish.weight, 
                Math.round(caughtFish.weight * 10 + 20)); // Estimate length from weight
        
        // Send catch event
        setGameEvent('catch');
        setTimeout(() => setGameEvent(null), 100);
        
        // Big splash for catch with sound
        addSplashParticles(lineState.x, WATER_Y, 2.0);
        setTimeout(() => gameSounds.playFishingBiteSound(), 300);
        
        // Add floating score
        setFloatingScores(prev => [...prev, {
          id: `score_${Date.now()}`,
          x: lineState.x,
          y: WATER_Y,
          value: points,
          combo: currentStats.combo
        }]);
      }
    }
  }, [lineState.cast, lineState.x, WATER_Y, onCatch, addSplashParticles]);
  
  // Get ocean colors for current climate
  const oceanColors = OCEAN_COLORS?.[climate] || OCEAN_COLORS?.[ClimateType.TEMPERATE] || { shallow: '#4A90E2', deep: '#2E5A8E', foam: '#F0F8FF' };
  
  // Keyboard controls for reeling - TAP RAPIDLY!
  useEffect(() => {
    let spacePressed = false;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        
        // If fish is hooked, reel it in
        if (lineState.hookedFish && !spacePressed) {
          spacePressed = true;
          // Each tap reels in significantly
          fishingGameState.reelIn(15);
          
          // Play subtle reel sound
          gameSounds.playFishingCastSound();
          
          // Add visual pulse effect
          setReelPulses(prev => [...prev, Date.now()]);
          
          // Visual feedback
          setIsReeling(true);
          setTimeout(() => setIsReeling(false), 100);
          
          // Add particles for feedback
          addBubbles(lineState.x, WATER_Y + lineState.depth, 3);
        } 
        // If no fish hooked but line is cast, try to set the hook!
        // Don't try to hook fish if minigame is already active
        else if (lineState.cast && !lineState.hookedFish && !minigame.active) {
          // Play subtle feedback sound for space press
          gameSounds.playFishingCastSound();
          
          // console.log('🎣 Space pressed - Attempting to set hook!');
          const allFish = fishingGameState.getFish();
          const hookX = lineState.x;
          const hookY = WATER_Y + lineState.depth;
          
          console.log('📍 Hook position:', hookX, hookY);
          // console.log('🐟 Available fish:', allFish.length);
          
          // Find closest interested fish
          let closestFish = null;
          let closestDistance = Infinity;
          
          allFish.forEach((fish, i) => {
            const dx = hookX - fish.x;
            const dy = hookY - fish.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            console.log(`Fish ${i}: pos(${fish.x.toFixed(1)}, ${fish.y.toFixed(1)}), interested:${fish.interested}, hooked:${fish.hooked}, distance:${distance.toFixed(1)}`);
            
            if (fish.interested && !fish.hooked && distance < 80) { // Increased range
              if (distance < closestDistance) {
                closestDistance = distance;
                closestFish = fish;
              }
            }
          });
          
          if (closestFish) {
            console.log('🐟 FISH HOOKED!', closestFish.species.name, 'distance:', closestDistance.toFixed(1));
            fishingGameState.hookFish(closestFish);
            addSplashParticles(hookX, hookY, 3);
            // Play hook sound and splash
            gameSounds.playFishingBiteSound();
            setTimeout(() => gameSounds.playFishingBiteSound(), 150);
          } else {
            console.log('❌ No catchable fish found. Closest interested distance:', closestDistance === Infinity ? 'none' : closestDistance.toFixed(1));
          }
        }
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        spacePressed = false;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [lineState.hookedFish, lineState.x, lineState.depth, WATER_Y, addBubbles]);
  
  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full"
      style={{ 
        width: '100%', 
        height: '100%', 
        overflow: 'hidden',
        cursor: lineState.cast ? (lineState.hookedFish ? 'grab' : 'default') : 'crosshair',
        background: timeOfDay === 'Night' || timeOfDay === 'Dusk' 
          ? 'linear-gradient(to bottom, #1a237e 0%, #283593 30%, #1e3a5f 100%)'
          : timeOfDay === 'Dawn' 
          ? 'linear-gradient(to bottom, #ff9a9e 0%, #ffd1a9 30%, #5B92B3 100%)'
          : 'linear-gradient(to bottom, #87CEEB 0%, #98D8E8 30%, #5B92B3 100%)'
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseMove={handleMouseMove}
    >
      {/* Simple Bait Selector */}
      <div className="absolute top-16 left-4 z-20">
        <div className="bg-black/20 backdrop-blur-sm rounded-lg p-2 border border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-white/80 text-xs">🪱</span>
            <select
              value={selectedBait}
              onChange={(e) => setSelectedBait(e.target.value)}
              className="px-2 py-1 text-xs rounded bg-black/40 text-white/90 border border-white/20 hover:bg-black/60 cursor-pointer"
            >
              {availableBait.map(bait => (
                <option key={bait.id} value={bait.id}>{bait.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Base banner layer */}
      <FishingHutBanner
        structure={structure}
        era={era}
        culturalZone={String(culturalZone).toLowerCase()}
        climate={climate}
        season={season}
        timeOfDay={timeOfDay as TimeOfDay}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        weather={weather}
        adjacentBiomes={adjacentBiomes}
        onFishPositionUpdate={setBannerFish}
        gameMode={true}
        gameEvent={gameEvent}
      />
      
      {/* Interactive game overlay */}
      <svg
        className="absolute inset-0"
        style={{ zIndex: 10 }}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        viewBox={`0 0 ${GAME_WIDTH} ${GAME_HEIGHT}`}
      >
        {/* Rich water gradients and atmospheric effects */}
        <defs>
          <linearGradient id="oceanDepth" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.4" />
            <stop offset="10%" stopColor="#22d3ee" stopOpacity="0.5" />
            <stop offset="30%" stopColor="#3b82f6" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#6366f1" stopOpacity="0.7" />
            <stop offset="70%" stopColor="#4f46e5" stopOpacity="0.8" />
            <stop offset="90%" stopColor="#4338ca" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#312e81" stopOpacity="0.95" />
          </linearGradient>
          <radialGradient id="lightRays" cx="50%" cy="0%" r="150%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.08" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>

          {/* Enhanced depth fog with climate-specific murkiness */}
          <linearGradient id="depthFog" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="20%" stopColor={isFreshwater ? '#4B5C4A' : '#002644'} stopOpacity="0.2" />
            <stop offset="40%" stopColor={isFreshwater ? '#3B4C3A' : '#001533'} stopOpacity="0.4" />
            <stop offset="70%" stopColor={isFreshwater ? '#2B3C2A' : '#001122'} stopOpacity="0.6" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.8" />
          </linearGradient>
          
          {/* Simplified - removed animated filters that caused distracting streaks */}
          <filter id="fishGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <pattern id="caustics" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
            <circle cx="50" cy="50" r="20" fill="rgba(255,255,255,0.05)" />
            <circle cx="150" cy="100" r="15" fill="rgba(255,255,255,0.03)" />
            <circle cx="100" cy="150" r="25" fill="rgba(255,255,255,0.04)" />
          </pattern>
        </defs>
        
        {/* Climate-aware water with enhanced depth gradient */}
        <defs>
          {(() => {
            const oceanColors = OCEAN_COLORS?.[climate] || OCEAN_COLORS?.[ClimateType.TEMPERATE] || { shallow: '#4A90E2', deep: '#2E5A8E', foam: '#F0F8FF' };
            const deeperShallow = adjustColorBrightness(oceanColors.shallow, -0.1);
            const deeperMid = adjustColorBrightness(oceanColors.deep, -0.2);
            const abyssal = adjustColorBrightness(oceanColors.deep, -0.6);
            
            return (
              <linearGradient id="waterDepth" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={oceanColors.shallow} stopOpacity="0.85" />
                <stop offset="25%" stopColor={deeperShallow} stopOpacity="0.90" />
                <stop offset="60%" stopColor={oceanColors.deep} stopOpacity="0.95" />
                <stop offset="85%" stopColor={deeperMid} stopOpacity="0.98" />
                <stop offset="100%" stopColor={abyssal} stopOpacity="1" />
              </linearGradient>
            );
          })()}
          
          {/* Underwater particle/noise pattern for murky depths */}
          <pattern id="underwaterNoise" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="4" height="4" fill="rgba(0,0,0,0.05)" />
            <circle cx="1" cy="1" r="0.3" fill="rgba(255,255,255,0.03)" />
            <circle cx="3" cy="3" r="0.2" fill="rgba(255,255,255,0.02)" />
            <circle cx="2" cy="3" r="0.1" fill="rgba(255,255,255,0.01)" />
          </pattern>
        </defs>
        
        {/* Single smooth water - no bands */}
        <rect x={0} y={WATER_Y} width={GAME_WIDTH} height={GAME_HEIGHT - WATER_Y} fill="url(#oceanDepth)" />

        {/* Ocean floor - sandy bottom with texture */}
        <g>
          {/* Main ocean floor */}
          <rect
            x={0}
            y={GAME_HEIGHT - OCEAN_FLOOR_HEIGHT}
            width={GAME_WIDTH}
            height={OCEAN_FLOOR_HEIGHT}
            fill={isFreshwater ? "#4A3D2A" : "#3D342A"}
          />
          {/* Sandy texture overlay */}
          <rect
            x={0}
            y={GAME_HEIGHT - OCEAN_FLOOR_HEIGHT}
            width={GAME_WIDTH}
            height={OCEAN_FLOOR_HEIGHT}
            fill={isFreshwater ? "#5C4E3C" : "#4A3F33"}
            opacity={0.6}
          />
          {/* Some rocks and pebbles on the ocean floor */}
          {Array.from({ length: 8 }, (_, i) => (
            <ellipse
              key={`rock_${i}`}
              cx={100 + i * (GAME_WIDTH / 8) + Math.sin(i * 2) * 30}
              cy={GAME_HEIGHT - OCEAN_FLOOR_HEIGHT + 5 + Math.cos(i * 3) * 5}
              rx={15 + Math.sin(i * 4) * 8}
              ry={8 + Math.cos(i * 2) * 3}
              fill="#2C2520"
              opacity={0.7}
            />
          ))}
          {/* Small pebbles */}
          {Array.from({ length: 15 }, (_, i) => (
            <circle
              key={`pebble_${i}`}
              cx={50 + i * (GAME_WIDTH / 15) + Math.sin(i * 5) * 20}
              cy={GAME_HEIGHT - OCEAN_FLOOR_HEIGHT + 15 + Math.cos(i * 7) * 8}
              r={2 + Math.sin(i * 3) * 1.5}
              fill="#3A312A"
              opacity={0.5}
            />
          ))}
        </g>

        {/* Enhanced ripples when line is cast - more beautiful */}
        {lineState.cast && (
          <g>
            {/* Multiple ripple rings around the bobber */}
            {[1, 2, 3, 4].map(i => (
              <circle
                key={`ripple_${i}`}
                cx={lineState.x}
                cy={WATER_Y}
                r={12 + i * 6 + Math.sin(Date.now() / 300 + i) * 2}
                stroke={`rgba(255, 255, 255, ${0.4 - i * 0.08})`}
                strokeWidth={2 - i * 0.2}
                fill="none"
                opacity={Math.sin(Date.now() / 400 + i) * 0.3 + 0.5}
              />
            ))}
            
            {/* Gentle splash particles around the line */}
            {Array.from({ length: 6 }, (_, i) => {
              const angle = (i / 6) * Math.PI * 2;
              const distance = 25 + Math.sin(Date.now() / 200 + i) * 8;
              const x = lineState.x + Math.cos(angle) * distance;
              const y = WATER_Y + Math.sin(angle) * 3;
              return (
                <circle
                  key={`splash_${i}`}
                  cx={x}
                  cy={y}
                  r={1 + Math.sin(Date.now() / 150 + i) * 0.5}
                  fill="rgba(255, 255, 255, 0.8)"
                  opacity={Math.sin(Date.now() / 250 + i) * 0.4 + 0.4}
                />
              );
            })}
          </g>
        )}
        
        {/* Floating particles at different depths for atmosphere */}
        {Array.from({ length: 15 }, (_, i) => {
          const depth = WATER_Y + 80 + (i * 12);
          const size = 2 + Math.random() * 4;
          const drift = Math.sin(Date.now() / 3000 + i) * 20;
          const opacity = Math.min(0.4, 0.1 + (depth - WATER_Y) / 200);
          
          return (
            <g key={`depth-particle-${i}`} opacity={opacity}>
              <ellipse
                cx={60 + i * 25 + drift}
                cy={depth + Math.sin(Date.now() / 2000 + i * 0.5) * 10}
                rx={size}
                ry={size * 0.8}
                fill={isFreshwater ? '#5A6D5A' : '#4A5D7A'}
                    />
            </g>
          );
        })}
        
        {/* Clean ocean - no fog or noise overlays */}
        
        {/* Enhanced water surface effects */}
        <g opacity={0.7}>
          {/* Animated water surface ripples */}
          {Array.from({ length: 8 }, (_, i) => {
            const x = (i * GAME_WIDTH) / 7;
            const phase = Date.now() * 0.001 + i * 0.8;
            const waveHeight = Math.sin(phase) * 3;
            return (
              <path
                key={`wave_${i}`}
                d={`M ${x} ${WATER_Y + waveHeight} 
                    Q ${x + 50} ${WATER_Y + waveHeight - 2} ${x + 100} ${WATER_Y + waveHeight}
                    Q ${x + 150} ${WATER_Y + waveHeight + 2} ${x + 200} ${WATER_Y + waveHeight}`}
                stroke="rgba(255,255,255,0.4)"
                strokeWidth={1.5}
                fill="none"
                style={{ animation: `float ${2 + i * 0.3}s ease-in-out infinite` }}
              />
            );
          })}
          
          {/* Enhanced sunlight rays with scattering effect */}
          {Array.from({ length: 8 }, (_, i) => {
            const x = 40 + i * 80;
            const time = Date.now() * 0.0008;
            const angle = 12 + Math.sin(time + i * 0.7) * 8;
            const intensity = Math.sin(time * 0.5 + i) * 0.3 + 0.7;
            const rayLength = 200 + Math.sin(time + i) * 50;
            
            return (
              <g key={`ray_${i}`} opacity={0.12 * intensity}>
                {/* Main ray */}
                <line
                  x1={x}
                  y1={WATER_Y}
                  x2={x + Math.sin(angle * Math.PI / 180) * rayLength}
                  y2={WATER_Y + Math.cos(angle * Math.PI / 180) * rayLength}
                  stroke={(() => {
                    const oceanColors = OCEAN_COLORS?.[climate] || OCEAN_COLORS?.[ClimateType.TEMPERATE] || { shallow: '#4A90E2', deep: '#2E5A8E', foam: '#F0F8FF' };
                    return `rgba(255,255,255,0.8)`; // Always use white for sunlight
                  })()}
                  strokeWidth={3}
                  style={{ filter: 'blur(1.5px)' }}
                />
                {/* Scattered light particles along ray */}
                {Array.from({ length: 4 }, (_, j) => {
                  const progress = (j + 1) / 5;
                  const particleX = x + Math.sin(angle * Math.PI / 180) * rayLength * progress;
                  const particleY = WATER_Y + Math.cos(angle * Math.PI / 180) * rayLength * progress;
                  const particleSize = 1 + Math.sin(time * 2 + i + j) * 0.5;
                  
                  return (
                    <circle
                      key={`particle_${i}_${j}`}
                      cx={particleX}
                      cy={particleY}
                      r={particleSize}
                      fill="rgba(255,255,255,0.4)"
                      style={{ filter: 'blur(0.5px)' }}
                    />
                  );
                })}
              </g>
            );
          })}
          
          {/* Enhanced depth-aware organic particles */}
          {Array.from({ length: 20 }, (_, i) => {
            const baseX = (i * GAME_WIDTH) / 19;
            const depth = 0.2 + (i % 5) * 0.15; // Depth factor (0.2 to 0.8)
            const baseY = WATER_Y + (GAME_HEIGHT - WATER_Y) * depth;
            const time = Date.now() * 0.0004;
            const drift = Math.sin(time + i * 0.8) * (30 - depth * 20); // Less drift at depth
            const float = Math.sin(time * 1.1 + i * 1.4) * (20 - depth * 15); // Less vertical movement at depth
            
            // Depth affects visibility and size
            const depthOpacity = Math.max(0.1, 1 - depth * 0.7);
            const depthSize = 0.5 + Math.sin(time * 2 + i) * 0.3 + (1 - depth) * 0.5;
            
            // Different particle types based on depth
            const particleType = i % 4;
            const colors = ['rgba(255,255,255,', 'rgba(200,255,200,', 'rgba(255,230,180,', 'rgba(180,200,255,'];
            const color = colors[particleType] + (depthOpacity * 0.4) + ')';
            
            return (
              <g key={`particle_${i}`}>
                <circle
                  cx={baseX + drift}
                  cy={baseY + float}
                  r={depthSize}
                  fill={color}
                  style={{ filter: `blur(${depth * 0.8}px)` }}
                />
                {/* Occasional larger organic shapes */}
                {i % 7 === 0 && (
                  <ellipse
                    cx={baseX + drift + 5}
                    cy={baseY + float - 3}
                    rx={depthSize * 1.5}
                    ry={depthSize * 0.8}
                    fill={`rgba(120,200,150,${depthOpacity * 0.2})`}
                    style={{ filter: `blur(${depth * 1.2}px)` }}
                    transform={`rotate(${time * 20 + i * 45} ${baseX + drift + 5} ${baseY + float - 3})`}
                  />
                )}
              </g>
            );
          })}
        </g>
        
        {/* Clean water surface - no lily pads */}
        <g opacity={0.5}>
          
          {/* Seaweed swaying */}
          <path
            d={`M ${GAME_WIDTH * 0.08} ${GAME_HEIGHT}
                Q ${GAME_WIDTH * 0.08 + Math.sin(Date.now() / 1000) * 4} ${GAME_HEIGHT - 80}
                ${GAME_WIDTH * 0.08 + Math.sin(Date.now() / 800) * 6} ${WATER_Y + 120}`}
            stroke="#1a4d1a"
            strokeWidth={3}
            fill="none"
            opacity={0.4}
          />
          <path
            d={`M ${GAME_WIDTH * 0.88} ${GAME_HEIGHT}
                Q ${GAME_WIDTH * 0.88 + Math.sin(Date.now() / 1200) * 5} ${GAME_HEIGHT - 100}
                ${GAME_WIDTH * 0.88 + Math.sin(Date.now() / 900) * 5} ${WATER_Y + 100}`}
            stroke="#2d5e2d"
            strokeWidth={2.5}
            fill="none"
            opacity={0.4}
          />
          <path
            d={`M ${GAME_WIDTH * 0.25} ${GAME_HEIGHT}
                Q ${GAME_WIDTH * 0.25 + Math.sin(Date.now() / 1100) * 3} ${GAME_HEIGHT - 60}
                ${GAME_WIDTH * 0.25 + Math.sin(Date.now() / 1000) * 4} ${WATER_Y + 140}`}
            stroke="#225522"
            strokeWidth={2}
            fill="none"
            opacity={0.3}
          />
        </g>

        {/* Animated bubbles from fish */}
        {bubbles.map(bubble => (
          <circle
            key={bubble.id}
            cx={bubble.x}
            cy={bubble.y}
            r={bubble.size}
            fill="#ffffff"
            opacity={bubble.opacity}
            style={{ filter: 'blur(0.5px)' }}
          />
        ))}

        {/* Fishing line */}
        {lineState.cast && (
          <g>
            {/* Enhanced fishing line with physics */}
            <path
              d={`M ${lineState.x},${WATER_Y - 20} 
                 Q ${lineState.x + Math.sin(Date.now() / 300) * 5},${WATER_Y + lineState.depth / 2} 
                 ${lineState.x + Math.sin(Date.now() / 200) * 2},${WATER_Y + lineState.depth}`}
              stroke="#4a4a4a"
              strokeWidth={1.5}
              fill="none"
              opacity={0.8}
              strokeDasharray={lineState.hookedFish ? "5,5" : "none"}
            />
            
            {/* Bobber - bigger and more visible */}
            <ellipse
              cx={lineState.x}
              cy={WATER_Y + lineState.depth}
              rx={8}
              ry={10}
              fill="#FF4444"
              stroke="#FFFFFF"
              strokeWidth={2}
            />
            <ellipse
              cx={lineState.x}
              cy={WATER_Y + lineState.depth - 2}
              rx={4}
              ry={2}
              fill="#FFAAAA"
              opacity={0.8}
            />
            
            {/* Hook with animated wiggling worm bait */}
            {lineState.hasBait && !lineState.hookedFish && (
              <g>
                {/* Hook */}
                <path
                  d={`M ${lineState.x - 3} ${WATER_Y + lineState.depth + 8}
                      C ${lineState.x - 1} ${WATER_Y + lineState.depth + 10}
                      ${lineState.x + 1} ${WATER_Y + lineState.depth + 12}
                      ${lineState.x + 3} ${WATER_Y + lineState.depth + 10}
                      L ${lineState.x + 2} ${WATER_Y + lineState.depth + 6}`}
                  stroke="#696969"
                  strokeWidth={2}
                  fill="none"
                  strokeLinecap="round"
                />
                
                {/* Animated wiggling worm bait */}
                <g transform={`translate(${lineState.x - 2}, ${WATER_Y + lineState.depth + 10})`}>
                  <path
                    d={`M 0,0 Q ${Math.sin(Date.now() / 100) * 2},3 0,6`}
                    stroke="#8B4513"
                    strokeWidth={3}
                    fill="none"
                    strokeLinecap="round"
                    opacity={0.9}
                  />
                  <path
                    d={`M 0,0 Q ${Math.sin(Date.now() / 100 + 1) * 1.5},2 0,4`}
                    stroke="#CD853F"
                    strokeWidth={1.5}
                    fill="none"
                    strokeLinecap="round"
                    opacity={0.8}
                  />
                </g>
                
                {/* Subtle bait glow effect */}
                <circle
                  cx={lineState.x}
                  cy={WATER_Y + lineState.depth + 12}
                  r={8}
                  fill="#FFD700"
                  opacity={0.1 + Math.sin(Date.now() * 0.003) * 0.05}
                />
              </g>
            )}
            
            {/* Simplified - no overlapping tension game, just the Stardew minigame */}
          </g>
        )}
        
        {/* Power bar and cast arc preview */}
        {powerBar.active && (
          <>
            {/* Arc preview showing where cast will land */}
            <g opacity={0.4}>
              <path
                d={`M ${mousePosition.x} ${WATER_Y - 20} 
                    Q ${mousePosition.x} ${WATER_Y - 40 - powerBar.power * 30} 
                      ${mousePosition.x} ${WATER_Y + powerBar.power * MAX_DEPTH}`}
                stroke="white"
                strokeWidth={2}
                fill="none"
                strokeDasharray="5,5"
              />
              <circle
                cx={mousePosition.x}
                cy={WATER_Y + powerBar.power * MAX_DEPTH}
                r={15}
                fill="rgba(255,255,255,0.2)"
                stroke="white"
                strokeWidth={2}
              />
              <text
                x={mousePosition.x}
                y={WATER_Y + powerBar.power * MAX_DEPTH + 30}
                fill="white"
                fontSize="11"
                textAnchor="middle"
                opacity={0.9}
              >
                {Math.round(powerBar.power * 100)}m depth
              </text>
            </g>
            
            {/* Tasteful Power Bar */}
            <g transform={`translate(${mousePosition.x - 75}, ${mousePosition.y - 80})`}>
              {/* Subtle background */}
              <rect x={0} y={0} width={150} height={20} fill="rgba(0,0,0,0.5)" rx={10} stroke="rgba(255,255,255,0.2)" strokeWidth={0.5} />
              
              {/* Perfect zone - subtle golden area */}
              <rect x={94} y={2} width={35} height={16} fill="rgba(218,165,32,0.15)" rx={8} />
              
              {/* Power gradient - tasteful blues to gold */}
              <defs>
                <linearGradient id="castPowerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#4B9BFF" stopOpacity="0.7" />
                  <stop offset="60%" stopColor="#60C0FF" stopOpacity="0.8" />
                  <stop offset="85%" stopColor="#88D4FF" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#DAA520" stopOpacity="1" />
                </linearGradient>
              </defs>
              
              {/* Power fill bar */}
              <rect 
                x={3} 
                y={3} 
                width={Math.max(0, powerBar.power * 144)} 
                height={14} 
                fill="url(#castPowerGrad)" 
                rx={7}
              />
              
              {/* Animated glow for perfect zone */}
              {powerBar.perfect && (
                <rect 
                  x={3} y={3} 
                  width={144 * powerBar.power} 
                  height={24} 
                  fill="none"
                  stroke="#FFD700"
                  strokeWidth={2}
                  rx={12}
                  opacity={Math.sin(Date.now() * 0.01) * 0.5 + 0.5}
                />
              )}
              
              {/* Text labels */}
              <text x={75} y={-5} textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">
                CASTING POWER
              </text>
              <text x={75} y={19} textAnchor="middle" fill={powerBar.perfect ? '#FFD700' : 'white'} fontSize="14" fontWeight="bold">
                {powerBar.perfect ? '★ PERFECT! ★' : `${Math.round(powerBar.power * 100)}%`}
              </text>
              
              {/* Depth indicator */}
              <text x={75} y={42} textAnchor="middle" fill="#87CEEB" fontSize="10">
                Depth: {Math.round(powerBar.power * MAX_DEPTH / 10)}m
              </text>
            </g>
          </>
        )}
        
        {/* Water particles */}
        {waterParticles.map(particle => (
          <g key={particle.id} opacity={particle.opacity}>
            {particle.type === 'bubble' ? (
              <circle
                cx={particle.x}
                cy={particle.y}
                r={particle.size}
                fill="rgba(255,255,255,0.3)"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth={0.5}
              />
            ) : particle.type === 'splash' ? (
              <ellipse
                cx={particle.x}
                cy={particle.y}
                rx={particle.size}
                ry={particle.size * 0.7}
                fill="rgba(173,216,230,0.6)"
              />
            ) : null}
          </g>
        ))}
        
        {/* Check for feeding frenzy and render effects */}
        {(() => {
          const allFish = fishingGameState.getFish();
          const nearbyFish = allFish.filter(f => {
            if (!lineState.cast || f.hooked) return false;
            const dx = lineState.x - f.x;
            const dy = (WATER_Y + lineState.depth) - f.y;
            return Math.sqrt(dx * dx + dy * dy) < 120;
          });
          const isFrenzy = nearbyFish.length >= 3;
          
          return (
            <>
              {/* Frenzy indicator */}
              {isFrenzy && lineState.cast && (
                <g opacity={0.7}>
                  <circle
                    cx={lineState.x}
                    cy={WATER_Y + lineState.depth}
                    r={100}
                    fill="none"
                    stroke="#FFD700"
                    strokeWidth={3}
                    strokeDasharray="10,5"
                    opacity={0.5 + Math.sin(Date.now() * 0.005) * 0.2}
                  />
                  <text
                    x={lineState.x}
                    y={WATER_Y + lineState.depth - 110}
                    fill="#FFD700"
                    fontSize="16"
                    fontWeight="bold"
                    textAnchor="middle"
                    stroke="rgba(0,0,0,0.5)"
                    strokeWidth={1}
                  >
                    FEEDING FRENZY!
                  </text>
                </g>
              )}
              
              {/* Beautiful underwater plants with better animation */}
              {Array.from({ length: 8 }, (_, i) => {
                const kelpX = (i * 120) + 30;
                const kelpHeight = 50 + Math.sin(i * 1.3) * 20;
                const swayX = Math.sin(frame * 0.015 + i * 0.7) * 6;
                const baseY = GAME_HEIGHT - 20;
                
                return (
                  <g key={`kelp_${i}`} opacity={0.3}>
                    <path
                      d={`M ${kelpX + swayX} ${baseY} 
                          Q ${kelpX + swayX + 3} ${baseY - kelpHeight/2} 
                            ${kelpX + swayX + Math.sin(frame * 0.03 + i) * 6} ${baseY - kelpHeight}`}
                      stroke="#2d5016"
                      strokeWidth={4}
                      fill="none"
                    />
                    <ellipse
                      cx={kelpX + swayX + Math.sin(frame * 0.03 + i) * 6}
                      cy={baseY - kelpHeight}
                      rx={10}
                      ry={18}
                      fill="#3a6b1e"
                      opacity={0.5}
                    />
                  </g>
                );
              })}
              
              {/* Floating debris */}
              {Array.from({ length: 4 }, (_, i) => {
                const debrisX = ((frame * 0.3 + i * 200) % (GAME_WIDTH + 100)) - 50;
                const debrisY = WATER_Y + 10 + Math.sin(frame * 0.04 + i * 2) * 20;
                
                return (
                  <g key={`debris_${i}`} opacity={0.25}>
                    <rect
                      x={debrisX}
                      y={debrisY}
                      width={20 + i * 5}
                      height={3}
                      fill="#5c4033"
                      transform={`rotate(${Math.sin(frame * 0.02 + i) * 15} ${debrisX + 10} ${debrisY + 1.5})`}
                    />
                  </g>
                );
              })}
              
              {/* Render ALL fish - both banner and game fish */}
              {/* First render banner fish as visual background */}
              {bannerFish.map((fish, index) => {
                const isNearHook = lineState.cast ? 
                  Math.sqrt(Math.pow(fish.x - lineState.x, 2) + Math.pow(fish.y - (WATER_Y + lineState.depth), 2)) < 100 : false;
                
                const depth = (fish.y - WATER_Y) / (GAME_HEIGHT - WATER_Y);
                const sizeMultiplier = Math.max(0.8, 1 - (depth * 0.2)); // Larger minimum size
                const opacity = Math.max(0.7, 0.9 - (depth * 0.2)); // Higher minimum opacity
                
                return (
                  <g key={`fish_${index}`} opacity={opacity}>
                    {/* Fish glow when interested */}
                    {isNearHook && (
                      <ellipse
                        cx={fish.x}
                        cy={fish.y}
                        rx={fish.size * 5}
                        ry={fish.size * 3}
                        fill="yellow"
                        opacity={0.2}
                        filter="url(#glow)"
                      />
                    )}
                    
                    {/* Fish shadow with depth */}
                    <ellipse
                      cx={fish.x + 3}
                      cy={fish.y + 5}
                      rx={fish.size * 3.5 * sizeMultiplier}
                      ry={fish.size * 1.2 * sizeMultiplier}
                      fill="rgba(0,0,0,0.25)"
                      filter="url(#blur)"
                    />
                    
                    {/* Beautiful fish body with shimmer */}
                    <defs>
                      <linearGradient id={`fishGrad_${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={fish.color || '#6495ED'} stopOpacity="0.8" />
                        <stop offset="50%" stopColor={fish.color || '#6495ED'} stopOpacity="1" />
                        <stop offset="100%" stopColor={fish.color || '#4169E1'} stopOpacity="0.9" />
                      </linearGradient>
                    </defs>
                    <ellipse
                      cx={fish.x}
                      cy={fish.y}
                      rx={fish.size * 3.5 * sizeMultiplier}
                      ry={fish.size * 1.8 * sizeMultiplier}
                      fill={`url(#fishGrad_${index})`}
                      stroke="rgba(255,255,255,0.4)"
                      strokeWidth={0.8}
                    />
                    {/* Shimmer effect */}
                    <ellipse
                      cx={fish.x - fish.size * 0.8 * sizeMultiplier}
                      cy={fish.y - fish.size * 0.3 * sizeMultiplier}
                      rx={fish.size * 0.8 * sizeMultiplier}
                      ry={fish.size * 0.4 * sizeMultiplier}
                      fill="rgba(255,255,255,0.3)"
                      transform={`rotate(-30 ${fish.x} ${fish.y})`}
                    />
                    
                    {/* Elegant fish tail with movement */}
                    <g transform={`rotate(${Math.sin(Date.now() * 0.003 + index) * 5} ${fish.x} ${fish.y})`}>
                      <path
                        d={fish.dir === 1 ?
                          `M ${fish.x - fish.size * 2 * sizeMultiplier} ${fish.y}
                           Q ${fish.x - fish.size * 3 * sizeMultiplier} ${fish.y - fish.size * 0.5 * sizeMultiplier}
                             ${fish.x - fish.size * 4 * sizeMultiplier} ${fish.y - fish.size * 1.5 * sizeMultiplier}
                           L ${fish.x - fish.size * 4 * sizeMultiplier} ${fish.y + fish.size * 1.5 * sizeMultiplier}
                           Q ${fish.x - fish.size * 3 * sizeMultiplier} ${fish.y + fish.size * 0.5 * sizeMultiplier}
                             ${fish.x - fish.size * 2 * sizeMultiplier} ${fish.y}` :
                          `M ${fish.x + fish.size * 2 * sizeMultiplier} ${fish.y}
                           Q ${fish.x + fish.size * 3 * sizeMultiplier} ${fish.y - fish.size * 0.5 * sizeMultiplier}
                             ${fish.x + fish.size * 4 * sizeMultiplier} ${fish.y - fish.size * 1.5 * sizeMultiplier}
                           L ${fish.x + fish.size * 4 * sizeMultiplier} ${fish.y + fish.size * 1.5 * sizeMultiplier}
                           Q ${fish.x + fish.size * 3 * sizeMultiplier} ${fish.y + fish.size * 0.5 * sizeMultiplier}
                             ${fish.x + fish.size * 2 * sizeMultiplier} ${fish.y}`
                        }
                        fill={fish.color || '#6495ED'}
                        opacity={0.85}
                        stroke={fish.color || '#4169E1'}
                        strokeWidth={0.5}
                      />
                    </g>
                    
                    {/* Realistic fish eye with detail */}
                    <circle
                      cx={fish.dir === 1 ? fish.x + fish.size * 1.2 * sizeMultiplier : fish.x - fish.size * 1.2 * sizeMultiplier}
                      cy={fish.y - fish.size * 0.2 * sizeMultiplier}
                      r={1.5 * sizeMultiplier}
                      fill="#FFD700"
                      opacity={0.9}
                    />
                    <circle
                      cx={fish.dir === 1 ? fish.x + fish.size * 1.2 * sizeMultiplier : fish.x - fish.size * 1.2 * sizeMultiplier}
                      cy={fish.y - fish.size * 0.2 * sizeMultiplier}
                      r={1.2 * sizeMultiplier}
                      fill="black"
                    />
                    <circle
                      cx={fish.dir === 1 ? fish.x + fish.size * 1.3 * sizeMultiplier : fish.x - fish.size * 1.1 * sizeMultiplier}
                      cy={fish.y - fish.size * 0.3 * sizeMultiplier}
                      r={0.4 * sizeMultiplier}
                      fill="white"
                      opacity={0.8}
                    />
                    
                    {/* Dorsal fin */}
                    <path
                      d={`M ${fish.x - fish.size * 0.5 * sizeMultiplier} ${fish.y - fish.size * 1.2 * sizeMultiplier}
                          L ${fish.x} ${fish.y - fish.size * 2 * sizeMultiplier}
                          L ${fish.x + fish.size * 0.5 * sizeMultiplier} ${fish.y - fish.size * 1.2 * sizeMultiplier}`}
                      fill={fish.color || '#6495ED'}
                      opacity={0.7}
                      stroke={fish.color || '#4169E1'}
                      strokeWidth={0.3}
                    />
                  </g>
                );
              })}
              
              {/* Species-specific realistic fish rendering */}
              {allFish.length > 0 && allFish.map(fish => {
                const depthDiff = Math.abs(fish.y - (WATER_Y + lineState.depth));
                const nearHook = lineState.cast ? Math.max(0.6, 1 - depthDiff / 150) : 0.8;
                
                // Depth-based visibility and murkiness
                const depthPercent = (fish.y - WATER_Y) / (GAME_HEIGHT - WATER_Y);
                const murkiness = Math.max(0.3, 1 - depthPercent * 0.6);
                const shadowOpacity = 0.2 * (1 - depthPercent);
                const visibility = (fish.hooked ? 1 : nearHook) * murkiness;
                
                // Properly sized realistic fish - 40-50% smaller for realism
                const scaledSize = fish.size * 0.6;
                
                // More realistic animated fin movement
                const time = Date.now() * 0.002; // Slower, more natural
                const finPhase = time + fish.x * 0.008 + fish.id.charCodeAt(0);
                const swimSpeed = Math.sqrt(fish.vx * fish.vx + fish.vy * fish.vy);
                const finIntensity = Math.max(0.3, Math.min(1.5, swimSpeed * 0.8)); // Fins move based on swim speed
                
                const tailSwing = Math.sin(finPhase * 2.1) * (4 + finIntensity * 2);
                const pectoralFlap = Math.sin(finPhase * 1.8 + 0.5) * (3 + finIntensity * 1.5);
                const dorsalSway = Math.sin(finPhase * 0.9 + 1.2) * (2 + finIntensity);
                
                // Use actual species color data for variety
                const species = fish.species;
                const colors = {
                  body: species.color || '#4682B4',
                  bodyLight: species.secondaryColor || (species.color ? adjustColorBrightness(species.color, 20) : '#87CEEB'),
                  fin: species.patternColor || (species.color ? adjustColorBrightness(species.color, -20) : '#191970'),
                  accent: species.patternColor || '#000080',
                  belly: species.bellyColor || '#F0F8FF'
                };
                
                // Animate hooked fish rising up with minigame progress
                const hookedYOffset = fish.hooked && minigame.active && minigame.progress > 0 
                  ? -(minigame.progress * (fish.y - WATER_Y)) // Move up based on progress
                  : 0;
                
                return (
                  <g 
                    key={fish.id} 
                    opacity={visibility} 
                    filter={fish.hooked ? "url(#fishGlow)" : ""}
                    onMouseEnter={() => {
                      console.log('🐟 Hovering fish:', fish.species.name);
                      setHoveredFishId(fish.id);
                    }}
                    onMouseLeave={() => setHoveredFishId(null)}
                    style={{ cursor: 'pointer', pointerEvents: 'all' }}
                  >
                    {/* Fish shadow for depth effect */}
                    <ellipse
                      cx={fish.x}
                      cy={fish.y + hookedYOffset + scaledSize * 1.5}
                      rx={scaledSize * 1.2}
                      ry={scaledSize * 0.3}
                      fill="#000000"
                      opacity={shadowOpacity}
                      filter="blur(3px)"
                    />
                    {/* Species-specific creature rendering */}
                    {(() => {
                      const creatureType = getCreatureType(fish.species.name);
                      const renderCreature = () => {
                        switch (creatureType) {
                          case 'octopus':
                            return (
                              <g transform={`translate(${fish.x}, ${fish.y + hookedYOffset})`}>
                                {/* Octopus body */}
                                <ellipse cx={0} cy={0} rx={scaledSize * 2} ry={scaledSize * 1.5} fill={colors.body} stroke={colors.accent} strokeWidth={1} />
                                {/* Mantle pattern */}
                                <ellipse cx={0} cy={0} rx={scaledSize * 1.5} ry={scaledSize * 1} fill={colors.bodyLight} opacity={0.6} />
                                {/* Eyes */}
                                <circle cx={-scaledSize * 0.5} cy={-scaledSize * 0.3} r={scaledSize * 0.4} fill="#2a2a2a" />
                                <circle cx={scaledSize * 0.5} cy={-scaledSize * 0.3} r={scaledSize * 0.4} fill="#2a2a2a" />
                                <circle cx={-scaledSize * 0.5} cy={-scaledSize * 0.3} r={scaledSize * 0.15} fill="white" />
                                <circle cx={scaledSize * 0.5} cy={-scaledSize * 0.3} r={scaledSize * 0.15} fill="white" />
                                {/* 8 tentacles */}
                                {[0, 1, 2, 3, 4, 5, 6, 7].map(i => {
                                  const angle = (i * Math.PI * 2) / 8;
                                  const tentacleWave = Math.sin(time * 2 + i * 0.5) * scaledSize * 0.3;
                                  return (
                                    <path
                                      key={i}
                                      d={`M ${Math.cos(angle) * scaledSize * 0.8} ${Math.sin(angle) * scaledSize * 0.8 + scaledSize}
                                          Q ${Math.cos(angle) * scaledSize * 2 + tentacleWave} ${Math.sin(angle) * scaledSize * 2 + scaledSize * 2}
                                          ${Math.cos(angle) * scaledSize * 3 + tentacleWave * 1.5} ${Math.sin(angle) * scaledSize * 3 + scaledSize * 3}`}
                                      stroke={colors.body}
                                      strokeWidth={scaledSize * 0.3}
                                      fill="none"
                                      strokeLinecap="round"
                                    />
                                  );
                                })}
                              </g>
                            );

                          case 'squid':
                            return (
                              <g transform={`translate(${fish.x}, ${fish.y + hookedYOffset}) scale(${fish.direction === 'left' ? -1 : 1}, 1)`}>
                                {/* Squid mantle (elongated body) */}
                                <ellipse cx={0} cy={0} rx={scaledSize * 3} ry={scaledSize * 1} fill={colors.body} stroke={colors.accent} strokeWidth={1} />
                                {/* Fins on sides */}
                                <ellipse cx={0} cy={-scaledSize * 0.8} rx={scaledSize * 2.5} ry={scaledSize * 0.4} fill={colors.fin} opacity={0.7} />
                                <ellipse cx={0} cy={scaledSize * 0.8} rx={scaledSize * 2.5} ry={scaledSize * 0.4} fill={colors.fin} opacity={0.7} />
                                {/* Eyes */}
                                <circle cx={scaledSize * 2.5} cy={-scaledSize * 0.3} r={scaledSize * 0.4} fill="#1a1a1a" />
                                <circle cx={scaledSize * 2.5} cy={-scaledSize * 0.3} r={scaledSize * 0.15} fill="white" />
                                {/* 10 tentacles (2 long feeding tentacles + 8 arms) */}
                                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => {
                                  const isLong = i < 2;
                                  const angle = ((i - 1) * Math.PI * 2) / 8;
                                  const length = isLong ? scaledSize * 4 : scaledSize * 2.5;
                                  const tentacleWave = Math.sin(time * 1.5 + i * 0.3) * scaledSize * 0.2;
                                  return (
                                    <path
                                      key={i}
                                      d={`M ${scaledSize * 3} ${Math.sin(angle) * scaledSize * 0.5}
                                          Q ${scaledSize * 3.5 + tentacleWave} ${Math.sin(angle) * length * 0.5}
                                          ${scaledSize * 3 + length + tentacleWave} ${Math.sin(angle) * length}`}
                                      stroke={colors.body}
                                      strokeWidth={isLong ? scaledSize * 0.2 : scaledSize * 0.15}
                                      fill="none"
                                      strokeLinecap="round"
                                    />
                                  );
                                })}
                              </g>
                            );

                          case 'sea_urchin':
                            return (
                              <g transform={`translate(${fish.x}, ${fish.y + hookedYOffset})`}>
                                {/* Urchin body */}
                                <circle cx={0} cy={0} r={scaledSize * 1.2} fill={colors.body} stroke={colors.accent} strokeWidth={1} />
                                {/* Spines */}
                                {Array.from({ length: 20 }, (_, i) => {
                                  const angle = (i * Math.PI * 2) / 20;
                                  const spineLength = scaledSize * (1.5 + Math.sin(time + i) * 0.3);
                                  return (
                                    <line
                                      key={i}
                                      x1={Math.cos(angle) * scaledSize * 1.2}
                                      y1={Math.sin(angle) * scaledSize * 1.2}
                                      x2={Math.cos(angle) * spineLength}
                                      y2={Math.sin(angle) * spineLength}
                                      stroke={colors.accent}
                                      strokeWidth={2}
                                      strokeLinecap="round"
                                    />
                                  );
                                })}
                              </g>
                            );

                          case 'sea_star':
                            return (
                              <g transform={`translate(${fish.x}, ${fish.y + hookedYOffset})`}>
                                {/* Sea star with 5 arms */}
                                {Array.from({ length: 5 }, (_, i) => {
                                  const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
                                  const armLength = scaledSize * 1.8;
                                  const armWidth = scaledSize * 0.6;
                                  const wiggle = Math.sin(time * 0.5 + i) * 2;

                                  return (
                                    <g key={i} transform={`rotate(${(i * 72) + wiggle})`}>
                                      {/* Each arm */}
                                      <ellipse
                                        cx={0}
                                        cy={-armLength / 2}
                                        rx={armWidth}
                                        ry={armLength}
                                        fill="#FF6B35"
                                        stroke="#D65529"
                                        strokeWidth={1}
                                      />
                                      {/* Texture dots on arms */}
                                      <circle cx={0} cy={-armLength * 0.7} r={scaledSize * 0.1} fill="#D65529" opacity={0.6} />
                                      <circle cx={armWidth * 0.3} cy={-armLength * 0.5} r={scaledSize * 0.08} fill="#D65529" opacity={0.5} />
                                      <circle cx={-armWidth * 0.3} cy={-armLength * 0.5} r={scaledSize * 0.08} fill="#D65529" opacity={0.5} />
                                    </g>
                                  );
                                })}
                                {/* Central body */}
                                <circle cx={0} cy={0} r={scaledSize * 0.8} fill="#FF8C42" stroke="#D65529" strokeWidth={1} />
                                {/* Center detail */}
                                <circle cx={0} cy={0} r={scaledSize * 0.3} fill="#FFa65C" opacity={0.7} />
                              </g>
                            );

                          case 'ray':
                            return (
                              <g transform={`translate(${fish.x}, ${fish.y + hookedYOffset}) scale(${fish.direction === 'left' ? -1 : 1}, 1)`}>
                                {/* Ray body (flat and wide) */}
                                <ellipse cx={0} cy={0} rx={scaledSize * 4} ry={scaledSize * 2.5} fill={colors.body} stroke={colors.accent} strokeWidth={1} />
                                {/* Wing-like fins with wave motion */}
                                <path
                                  d={`M ${-scaledSize * 4} ${-scaledSize * 2.5}
                                      Q ${-scaledSize * 5 + Math.sin(time) * scaledSize * 0.5} ${Math.sin(time * 0.5) * scaledSize}
                                      ${-scaledSize * 4} ${scaledSize * 2.5}`}
                                  fill={colors.fin}
                                  opacity={0.8}
                                />
                                <path
                                  d={`M ${scaledSize * 4} ${-scaledSize * 2.5}
                                      Q ${scaledSize * 5 + Math.sin(time + Math.PI) * scaledSize * 0.5} ${Math.sin(time * 0.5 + Math.PI) * scaledSize}
                                      ${scaledSize * 4} ${scaledSize * 2.5}`}
                                  fill={colors.fin}
                                  opacity={0.8}
                                />
                                {/* Eyes on top */}
                                <circle cx={scaledSize * 1} cy={-scaledSize * 0.5} r={scaledSize * 0.3} fill="#1a1a1a" />
                                <circle cx={-scaledSize * 1} cy={-scaledSize * 0.5} r={scaledSize * 0.3} fill="#1a1a1a" />
                                {/* Tail */}
                                <line x1={0} y1={scaledSize * 2.5} x2={tailSwing * 0.1} y2={scaledSize * 5} stroke={colors.body} strokeWidth={scaledSize * 0.2} />
                              </g>
                            );

                          case 'eel':
                            return (
                              <g transform={`translate(${fish.x}, ${fish.y + hookedYOffset}) scale(${fish.direction === 'left' ? -1 : 1}, 1)`}>
                                {/* Eel body (long and snake-like) */}
                                <path
                                  d={`M ${-scaledSize * 2} 0
                                      Q ${scaledSize * 2} ${Math.sin(time + fish.x * 0.01) * scaledSize * 0.5}
                                      ${scaledSize * 6} ${Math.sin(time * 1.2 + fish.x * 0.01) * scaledSize * 0.8}
                                      Q ${scaledSize * 10} ${Math.sin(time * 1.5 + fish.x * 0.01) * scaledSize}
                                      ${scaledSize * 12} ${Math.sin(time * 1.8 + fish.x * 0.01) * scaledSize * 0.5}`}
                                  stroke={colors.body}
                                  strokeWidth={scaledSize * 1.5}
                                  fill="none"
                                  strokeLinecap="round"
                                />
                                {/* Head */}
                                <ellipse cx={scaledSize * 2} cy={0} rx={scaledSize * 1.5} ry={scaledSize * 0.8} fill={colors.body} />
                                {/* Eye */}
                                <circle cx={scaledSize * 2.8} cy={-scaledSize * 0.2} r={scaledSize * 0.3} fill="#1a1a1a" />
                                <circle cx={scaledSize * 2.8} cy={-scaledSize * 0.2} r={scaledSize * 0.1} fill="white" />
                              </g>
                            );

                          case 'shark':
                            return (
                              <g transform={`translate(${fish.x}, ${fish.y + hookedYOffset}) scale(${fish.direction === 'left' ? -1 : 1}, 1)`}>
                                {/* Shark body (torpedo shaped) */}
                                <path
                                  d={`M ${-scaledSize * 2} 0
                                      C ${-scaledSize} ${-scaledSize * 1.2} ${scaledSize * 2} ${-scaledSize * 1.3} ${scaledSize * 4.5} 0
                                      C ${scaledSize * 2} ${scaledSize * 1.3} ${-scaledSize} ${scaledSize * 1.2} ${-scaledSize * 2} 0 Z`}
                                  fill={colors.body}
                                  stroke={colors.accent}
                                  strokeWidth={1}
                                />
                                {/* Dorsal fin */}
                                <path
                                  d={`M ${scaledSize * 0.5} ${-scaledSize * 1.3}
                                      L ${scaledSize * 1.5} ${-scaledSize * 3}
                                      L ${scaledSize * 2.5} ${-scaledSize * 1.3} Z`}
                                  fill={colors.fin}
                                />
                                {/* Tail fin */}
                                <path
                                  d={`M ${-scaledSize * 2} 0
                                      L ${-scaledSize * 4} ${-scaledSize * 2}
                                      L ${-scaledSize * 3} 0
                                      L ${-scaledSize * 4} ${scaledSize * 1.2} Z`}
                                  fill={colors.fin}
                                  transform={`rotate(${tailSwing * 0.3} ${-scaledSize * 2} 0)`}
                                />
                                {/* Pectoral fins */}
                                <ellipse cx={scaledSize * 2} cy={scaledSize * 0.8} rx={scaledSize * 1.5} ry={scaledSize * 0.5} fill={colors.fin} opacity={0.8} />
                                {/* Eye */}
                                <circle cx={scaledSize * 3.5} cy={-scaledSize * 0.4} r={scaledSize * 0.4} fill="#1a1a1a" />
                                <circle cx={scaledSize * 3.5} cy={-scaledSize * 0.4} r={scaledSize * 0.15} fill="white" />
                                {/* Gills */}
                                {[0, 1, 2, 3, 4].map(i => (
                                  <line
                                    key={i}
                                    x1={scaledSize * (2.5 + i * 0.3)}
                                    y1={scaledSize * 0.5}
                                    x2={scaledSize * (2.5 + i * 0.3)}
                                    y2={scaledSize * 1}
                                    stroke={colors.accent}
                                    strokeWidth={1}
                                  />
                                ))}
                              </g>
                            );

                          case 'flatfish':
                            return (
                              <g transform={`translate(${fish.x}, ${fish.y + hookedYOffset}) scale(${fish.direction === 'left' ? -1 : 1}, 1)`}>
                                {/* Flatfish body (oval and flat) */}
                                <ellipse cx={0} cy={0} rx={scaledSize * 3.5} ry={scaledSize * 2} fill={colors.body} stroke={colors.accent} strokeWidth={1} />
                                {/* Continuous fin around edge */}
                                <path
                                  d={`M ${-scaledSize * 3.5} 0
                                      Q ${-scaledSize * 3} ${-scaledSize * 2.5} 0 ${-scaledSize * 2.2}
                                      Q ${scaledSize * 3} ${-scaledSize * 2.5} ${scaledSize * 3.5} 0
                                      Q ${scaledSize * 3} ${scaledSize * 2.5} 0 ${scaledSize * 2.2}
                                      Q ${-scaledSize * 3} ${scaledSize * 2.5} ${-scaledSize * 3.5} 0 Z`}
                                  fill={colors.fin}
                                  opacity={0.6}
                                />
                                {/* Both eyes on one side (flatfish characteristic) */}
                                <circle cx={scaledSize * 1} cy={-scaledSize * 0.5} r={scaledSize * 0.3} fill="#1a1a1a" />
                                <circle cx={scaledSize * 0.3} cy={-scaledSize * 0.8} r={scaledSize * 0.3} fill="#1a1a1a" />
                                <circle cx={scaledSize * 1} cy={-scaledSize * 0.5} r={scaledSize * 0.1} fill="white" />
                                <circle cx={scaledSize * 0.3} cy={-scaledSize * 0.8} r={scaledSize * 0.1} fill="white" />
                              </g>
                            );

                          case 'seahorse':
                            return (
                              <g transform={`translate(${fish.x}, ${fish.y + hookedYOffset}) scale(${fish.direction === 'left' ? -1 : 1}, 1)`}>
                                {/* Seahorse body (S-shaped) */}
                                <path
                                  d={`M 0 ${scaledSize * 3}
                                      Q ${scaledSize * 0.5} ${scaledSize * 2} ${scaledSize * 0.3} ${scaledSize}
                                      Q ${scaledSize * 0.1} 0 ${scaledSize * 0.8} ${-scaledSize}
                                      Q ${scaledSize * 1.5} ${-scaledSize * 1.5} ${scaledSize * 1.2} ${-scaledSize * 2.5}`}
                                  stroke={colors.body}
                                  strokeWidth={scaledSize * 0.8}
                                  fill="none"
                                  strokeLinecap="round"
                                />
                                {/* Head */}
                                <ellipse cx={scaledSize * 1.2} cy={-scaledSize * 2.5} rx={scaledSize * 0.6} ry={scaledSize * 0.8} fill={colors.body} />
                                {/* Snout */}
                                <ellipse cx={scaledSize * 1.8} cy={-scaledSize * 2.5} rx={scaledSize * 0.8} ry={scaledSize * 0.2} fill={colors.body} />
                                {/* Eye */}
                                <circle cx={scaledSize * 1.2} cy={-scaledSize * 2.8} r={scaledSize * 0.2} fill="#1a1a1a" />
                                {/* Dorsal fin */}
                                <path
                                  d={`M ${scaledSize * 0.5} ${-scaledSize * 0.5}
                                      Q ${scaledSize * 1.2} ${-scaledSize * 1.2} ${scaledSize * 1} ${-scaledSize * 2}`}
                                  stroke={colors.fin}
                                  strokeWidth={scaledSize * 0.3}
                                  fill="none"
                                />
                                {/* Tail curl */}
                                <circle cx={0} cy={scaledSize * 3} r={scaledSize * 0.5} fill="none" stroke={colors.body} strokeWidth={scaledSize * 0.3} />
                              </g>
                            );

                          default:
                            // Enhanced standard fish with more variety
                            const bodyShape = (() => {
                              if (creatureType === 'torpedo') {
                                return `M ${-scaledSize * 3.5} 0
                                        C ${-scaledSize * 3} ${-scaledSize * 0.8} ${scaledSize * 2} ${-scaledSize * 0.8} ${scaledSize * 4} 0
                                        C ${scaledSize * 2} ${scaledSize * 0.8} ${-scaledSize * 3} ${scaledSize * 0.8} ${-scaledSize * 3.5} 0 Z`;
                              } else if (creatureType === 'round') {
                                return `M ${-scaledSize * 2} 0
                                        C ${-scaledSize * 2} ${-scaledSize * 2} ${scaledSize * 2} ${-scaledSize * 2} ${scaledSize * 2} 0
                                        C ${scaledSize * 2} ${scaledSize * 2} ${-scaledSize * 2} ${scaledSize * 2} ${-scaledSize * 2} 0 Z`;
                              } else if (creatureType === 'elongated') {
                                return `M ${-scaledSize * 4} 0
                                        C ${-scaledSize * 3.5} ${-scaledSize * 0.6} ${scaledSize * 3} ${-scaledSize * 0.6} ${scaledSize * 5} 0
                                        C ${scaledSize * 3} ${scaledSize * 0.6} ${-scaledSize * 3.5} ${scaledSize * 0.6} ${-scaledSize * 4} 0 Z`;
                              } else if (creatureType === 'deep_body') {
                                return `M ${-scaledSize * 2.5} 0
                                        C ${-scaledSize * 2} ${-scaledSize * 1.8} ${scaledSize * 2} ${-scaledSize * 1.8} ${scaledSize * 3} 0
                                        C ${scaledSize * 2} ${scaledSize * 1.8} ${-scaledSize * 2} ${scaledSize * 1.8} ${-scaledSize * 2.5} 0 Z`;
                              } else {
                                return `M ${-scaledSize * 3.2} 0
                                        C ${-scaledSize * 2.8} ${-scaledSize * 1.4} ${scaledSize * 1.5} ${-scaledSize * 1.4} ${scaledSize * 3.5} 0
                                        C ${scaledSize * 1.5} ${scaledSize * 1.4} ${-scaledSize * 2.8} ${scaledSize * 1.4} ${-scaledSize * 3.2} 0 Z`;
                              }
                            })();

                            return (
                              <g transform={`translate(${fish.x}, ${fish.y + hookedYOffset}) scale(${fish.direction === 'left' ? -1 : 1}, 1)`}>
                                <defs>
                                  <radialGradient id={`bodyGrad_${fish.id}`} cx="30%" cy="30%">
                                    <stop offset="0%" stopColor={colors.bodyLight} />
                                    <stop offset="60%" stopColor={colors.body} />
                                    <stop offset="100%" stopColor={colors.accent} />
                                  </radialGradient>
                                </defs>

                                {/* Species-specific body shape */}
                                <path
                                  d={bodyShape}
                                  fill={`url(#bodyGrad_${fish.id})`}
                                  stroke={fish.hooked ? "#FFD700" : colors.accent}
                                  strokeWidth={fish.hooked ? 2 : 1}
                                  opacity={0.95}
                                />

                                {/* Tail */}
                                <g transform={`rotate(${tailSwing} ${-scaledSize * 3.5} 0)`}>
                                  <path
                                    d={`M ${-scaledSize * 3.5} 0
                                        L ${-scaledSize * 5} ${-scaledSize * 1.5}
                                        L ${-scaledSize * 4.5} 0
                                        L ${-scaledSize * 5} ${scaledSize * 1.5} Z`}
                                    fill={colors.fin}
                                    opacity={0.9}
                                  />
                                </g>

                                {/* Dorsal fin */}
                                <path
                                  d={`M ${-scaledSize} ${-scaledSize * 1.5}
                                      Q 0 ${-scaledSize * 2.5} ${scaledSize} ${-scaledSize * 1.5}`}
                                  stroke={colors.fin}
                                  strokeWidth={scaledSize * 0.3}
                                  fill="none"
                                />

                                {/* Eye */}
                                <circle cx={scaledSize * 2.5} cy={-scaledSize * 0.4} r={scaledSize * 0.4} fill="#F0F0F0" />
                                <circle cx={scaledSize * 2.5} cy={-scaledSize * 0.4} r={scaledSize * 0.3} fill="#1a1a1a" />
                                <circle cx={scaledSize * 2.6} cy={-scaledSize * 0.5} r={scaledSize * 0.1} fill="white" />
                              </g>
                            );
                        }
                      };

                      return (
                        <g opacity={visibility}>
                          {/* Shadow */}
                          <ellipse
                            cx={fish.x + 2}
                            cy={fish.y + hookedYOffset + scaledSize * 1.5}
                            rx={scaledSize * 2}
                            ry={scaledSize * 0.5}
                            fill="#000000"
                            opacity={shadowOpacity * 0.3}
                            filter="blur(2px)"
                          />

                          {/* Creature */}
                          {renderCreature()}

                          {/* Interest indicator */}
                          {fish.interested && !fish.hooked && (
                            <g>
                              <circle
                                cx={fish.x}
                                cy={fish.y + hookedYOffset - scaledSize * 3}
                                r={scaledSize * 0.8}
                                fill="none"
                                stroke="#FFD700"
                                strokeWidth={2}
                                opacity={0.8}
                              />
                              <text
                                x={fish.x}
                                y={fish.y + hookedYOffset - scaledSize * 2.5}
                                fill="#FFD700"
                                fontSize={scaledSize}
                                fontWeight="bold"
                                textAnchor="middle"
                              >!</text>
                            </g>
                          )}
                        </g>
                      );
                    })()}
                    
                    {/* Hook line when caught */}
                    {fish.hooked && (
                      <line
                        x1={fish.x}
                        y1={fish.y}
                        x2={lineState.x}
                        y2={WATER_Y + lineState.depth}
                        stroke="rgba(255,255,255,0.5)"
                        strokeWidth={2}
                        strokeDasharray="4,4"
                />
              )}
                  </g>
                );
              })}
            </>
          );
        })()}
        
        {/* Ripple effects */}
        {ripples.map((ripple, i) => (
          <ellipse
            key={i}
            cx={ripple.x}
            cy={ripple.y}
            rx={ripple.radius}
            ry={ripple.radius / 2}
            fill="none"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth={2}
            opacity={ripple.opacity}
            pointerEvents="none"
          />
        ))}
        
        {/* Floating score displays */}
        {floatingScores.map(score => (
          <g key={score.id} opacity={score.opacity || 1}>
            <text
              x={score.x}
              y={score.y}
              fill="#FFD700"
              fontSize={score.combo > 1 ? 20 + Math.min(score.combo * 2, 10) : 18}
              fontWeight="bold"
              textAnchor="middle"
              stroke="rgba(0,0,0,0.5)"
              strokeWidth={1}
            >
              +{score.value}
            </text>
            {score.combo > 1 && (
              <text
                x={score.x}
                y={score.y + 15}
                fill="#FF69B4"
                fontSize={14}
                fontWeight="bold"
                textAnchor="middle"
                stroke="rgba(0,0,0,0.5)"
                strokeWidth={0.5}
              >
                {score.combo}x COMBO!
              </text>
            )}
          </g>
        ))}
        
        {/* Enhanced cast preview when not casting */}
        {!lineState.cast && mousePosition.y > WATER_Y && (
          <g opacity={0.6}>
            <line
              x1={mousePosition.x}
              y1={WATER_Y - 20}
              x2={mousePosition.x}
              y2={mousePosition.y}
              stroke="rgba(135,206,235,0.8)"
              strokeWidth={3}
              strokeDasharray="8,4"
              style={{ filter: 'drop-shadow(0 0 3px rgba(135,206,235,0.5))' }}
            />
            <circle
              cx={mousePosition.x}
              cy={mousePosition.y}
              r={30}
              fill="rgba(135,206,235,0.1)"
              stroke="rgba(135,206,235,0.8)"
              strokeWidth={2.5}
              style={{ filter: 'drop-shadow(0 0 5px rgba(135,206,235,0.3))' }}
            />
            <text
              x={mousePosition.x}
              y={mousePosition.y - 40}
              fill="rgba(255,255,255,0.95)"
              fontSize="13"
              textAnchor="middle"
              fontWeight="bold"
              style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))' }}
            >
              Click to Cast
            </text>
          </g>
        )}
        
        {/* Dynamic catch indicator when fish are catchable */}
        {(() => {
          const allFish = fishingGameState.getFish();
          const catchableFish = allFish.filter(fish => 
            fish.interested && !fish.hooked && lineState.cast &&
            Math.sqrt(
              Math.pow(lineState.x - fish.x, 2) + 
              Math.pow((WATER_Y + lineState.depth) - fish.y, 2)
            ) < 80
          );
          
          if (catchableFish.length === 0) return null;
          
          const closestFish = catchableFish.reduce((closest, fish) => {
            const dist = Math.sqrt(
              Math.pow(lineState.x - fish.x, 2) + 
              Math.pow((WATER_Y + lineState.depth) - fish.y, 2)
            );
            const closestDist = Math.sqrt(
              Math.pow(lineState.x - closest.x, 2) + 
              Math.pow((WATER_Y + lineState.depth) - closest.y, 2)
            );
            return dist < closestDist ? fish : closest;
          });
          
          return (
            <g>
              {/* Pulsing indicator at bottom center */}
              <g transform={`translate(${GAME_WIDTH / 2}, ${GAME_HEIGHT - 60})`}>
                <rect
                  x={-80}
                  y={-25}
                  width={160}
                  height={50}
                  fill="rgba(34, 197, 94, 0.9)"
                  rx={25}
                  style={{ 
                    filter: 'drop-shadow(0 4px 12px rgba(34, 197, 94, 0.4))',
                    animation: 'pulse 1.5s ease-in-out infinite'
                  }}
                />
                <text
                  x={0}
                  y={-5}
                  fill="white"
                  fontSize="14"
                  fontWeight="bold"
                  textAnchor="middle"
                  style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}
                >
                  SPACE or CLICK
                </text>
                <text
                  x={0}
                  y={12}
                  fill="rgba(255,255,255,0.9)"
                  fontSize="11"
                  textAnchor="middle"
                  style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}
                >
                  {closestFish.species.name} nearby!
                </text>
              </g>
              
              {/* Subtle glow around catchable fish */}
              {catchableFish.map(fish => {
                const glowSize = fish.size * 1.2 * 2.5; // Same scaling as fish rendering
                return (
                  <circle
                    key={`glow_${fish.id}`}
                    cx={fish.x}
                    cy={fish.y}
                    r={glowSize}
                    fill="none"
                    stroke="rgba(34, 197, 94, 0.6)"
                    strokeWidth={3}
                    style={{ 
                      filter: 'blur(2px)',
                      animation: 'pulse 2s ease-in-out infinite'
                    }}
                  />
                );
              })}
            </g>
          );
        })()}
        
       
        
        {/* Enhanced Fish Information Tooltip - Rendered LAST to appear on top */}
        {hoveredFishId && (() => {
          const allFish = fishingGameState.getFish();
          const hoveredFish = allFish.find(f => f.id === hoveredFishId);
          if (!hoveredFish) return null;
          
          const sizeCategory = fishingService.categorizeFishSize(hoveredFish.species, hoveredFish.weight);
          const sizeMultiplier = fishingService.getSizeMultiplier(sizeCategory);
          const baseValue = hoveredFish.species.baseValue || 10;
          const value = Math.round(baseValue * sizeMultiplier);
          const culturalName = fishingService.getCulturalName(hoveredFish.species, culturalZone);
          const sizeDesc = sizeCategory.charAt(0).toUpperCase() + sizeCategory.slice(1);
          
          return (
            <g transform={`translate(${Math.min(hoveredFish.x + 20, GAME_WIDTH - 280)}, ${Math.max(hoveredFish.y - 120, 20)})`}>
              {/* Tooltip background */}
              <rect 
                x={0} y={0} 
                width={260} height={100} 
                fill="rgba(15, 23, 42, 0.95)" 
                rx={8} 
                stroke="#60A5FA" 
                strokeWidth={1} 
              />
              
              {/* Rarity indicator bar */}
              <rect x={0} y={0} width={260} height={3} fill={
                hoveredFish.species.rarity === 'legendary' ? '#FFD700' :
                hoveredFish.species.rarity === 'rare' ? '#DA70D6' :
                hoveredFish.species.rarity === 'uncommon' ? '#40E0D0' : '#87CEEB'
              } rx={2} />
              
              {/* Fish name */}
              <text x={10} y={20} fill="#60A5FA" fontSize="14" fontWeight="bold">
                {culturalName || hoveredFish.species.name}
              </text>
              
              {/* Size and weight */}
              <text x={10} y={38} fill="#FCD34D" fontSize="12">
                {sizeDesc} • {hoveredFish.weight.toFixed(1)}kg
              </text>
              
              {/* Description */}
              <text x={10} y={55} fill="#E5E7EB" fontSize="10">
                {hoveredFish.species.description?.substring(0, 40)}...
              </text>
              
              {/* Value and rarity */}
              <text x={10} y={72} fill="#9CA3AF" fontSize="10">
                Value: {value} gold • {hoveredFish.species.rarity}
              </text>
              
              {/* Bait effectiveness */}
              <text x={10} y={88} fill="#60A5FA" fontSize="10">
                Bait effectiveness: {Math.round(fishingGameState.getBaitEffectiveness(hoveredFish.species) * 100)}%
              </text>
            </g>
          );
        })()}
      </svg>

      {/* Celebration overlay */}

      {/* Fish Collection Stats - Simplified */}
      <div className="absolute top-4 right-4 bg-black/30 backdrop-blur-sm rounded-lg p-2 border border-white/10" style={{ zIndex: 25 }}>
        <div className="text-white/90 text-xs flex items-center gap-2">
          <span>🐟</span>
          <span>{fishCollection.size}/{availableFish.length}</span>
          {fishCollection.size > 0 && (
            <span className="text-yellow-400/80">
              ({Math.round((fishCollection.size / availableFish.length) * 100)}%)
            </span>
          )}
        </div>
      </div>
      
      {/* Enhanced inline styles for animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 5px rgba(252, 211, 77, 0.5); }
          50% { box-shadow: 0 0 20px rgba(252, 211, 77, 0.8); }
        }
        @keyframes ripple {
          0% { 
            opacity: 1; 
            transform: scale(0.3); 
            stroke-width: 4px; 
          }
          100% { 
            opacity: 0; 
            transform: scale(3); 
            stroke-width: 0.5px; 
          }
        }
        @keyframes shimmer {
          0% { opacity: 0; transform: translateX(-20px); }
          50% { opacity: 0.8; }
          100% { opacity: 0; transform: translateX(20px); }
        }
        @keyframes gentle-sway {
          0%, 100% { transform: translateX(0px) rotate(0deg); }
          25% { transform: translateX(2px) rotate(1deg); }
          75% { transform: translateX(-2px) rotate(-1deg); }
        }
        @keyframes bubble-rise {
          0% { 
            opacity: 0; 
            transform: translateY(20px) scale(0.8); 
          }
          10% { 
            opacity: 0.6; 
            transform: translateY(15px) scale(1); 
          }
          90% { 
            opacity: 0.3; 
            transform: translateY(-15px) scale(0.9); 
          }
          100% { 
            opacity: 0; 
            transform: translateY(-20px) scale(0.7); 
          }
        }
      `}</style>
      
      {/* Dynamic Hook Button - appears when fish is catchable */}
      {(() => {
        if (!lineState.cast || lineState.hookedFish) return null;
        
        const allFish = fishingGameState.getFish();
        const hookX = lineState.x;
        const hookY = WATER_Y + lineState.depth;
        
        // Check if any fish is interested and close
        const catchableFish = allFish.find(fish => {
          if (!fish.interested || fish.hooked) return false;
          const dx = hookX - fish.x;
          const dy = hookY - fish.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          return distance < 60;
        });
        
        if (catchableFish) {
          return (
            <div 
              className="absolute left-1/2 bottom-32 transform -translate-x-1/2"
              style={{ zIndex: 100 }}
            >
             
            </div>
          );
        }
        return null;
      })()}
      
      {/* Minimal catch counter */}
      {stats.totalCatches > 0 && (
        <div className="absolute top-4 left-4 pointer-events-none" style={{ zIndex: 20 }}>
          <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm rounded-full px-3 py-1 border border-white/10">
            <span className="text-lg">🐟</span>
            <span className="text-white/90 font-medium text-sm">{stats.totalCatches}</span>
          </div>
        </div>
      )}
      
      {/* Simple instructions */}
      {!lineState.cast && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 pointer-events-none" style={{ zIndex: 25 }}>
          <div className="bg-black/30 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
            <div className="text-white/80 text-sm font-medium text-center">
              🎣 Click in the water to cast
            </div>
          </div>
        </div>
      )}
      
      {/* Catchable fish indicator */}
      {(() => {
        if (!lineState.cast || lineState.hookedFish) return null;
        
        const allFish = fishingGameState.getFish();
        const hookX = lineState.x;
        const hookY = WATER_Y + lineState.depth;
        
        const catchableFish = allFish.find(fish => {
          if (!fish.interested || fish.hooked) return false;
          const dx = hookX - fish.x;
          const dy = hookY - fish.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          return distance < 80;
        });
        
        // Only show fish nearby notification when NOT reeling
        if (catchableFish && !minigame.active) {
          return (
            <div className="absolute bottom-22 left-4" style={{ zIndex: 25 }}>
              <div className="bg-green-600/60 backdrop-blur-sm rounded-lg px-4 py-2 border border-green-400/40">
                <div className="flex items-center gap-3">
                  <span className="text-white font-medium text-sm">
                    🎣 {catchableFish.species.name} nearby!
                  </span>
                  <div className="text-green-200 text-xs">
                    Press SPACE
                  </div>
                  <button
                    onClick={() => {
                      console.log('🎯 Click to catch pressed!');
                      fishingGameState.hookFish(catchableFish);
                      addSplashParticles(hookX, hookY, 3);
                      gameSounds.playFishingBiteSound();
                      setTimeout(() => gameSounds.playFishingBiteSound(), 150);
                    }}
                    className="bg-yellow-500/80 hover:bg-yellow-400/90 text-black font-medium px-3 py-1 rounded text-xs transition-all hover:scale-105"
                    style={{ pointerEvents: 'auto' }}
                  >
                    CATCH
                  </button>
                </div>
              </div>
            </div>
          );
        }
        
        return null; // Removed old "waiting for fish" message
      })()}
      
      {/* Vertical Progress Display - Left Side */}
      {minigame.active && (
        <div className="absolute left-6 top-24 flex flex-col items-start gap-2" style={{ zIndex: 25 }}>
          {/* Fish Status & Instructions */}
          <div className={`bg-black/40 backdrop-blur-sm rounded-lg px-3 py-2 border transition-all duration-200 ${
            minigame.fishFighting ? 'border-red-500/60' : 'border-white/20'
          }`}>
            <div className="text-white text-sm">
              {minigame.fishFighting ? (
                <span className="text-red-400 animate-pulse">⚠️ Fish fighting!</span>
              ) : reelState.isReeling ? (
                <span className="text-cyan-400">Reeling...</span>
              ) : (
                <span className="text-gray-300">Hold SPACE to reel</span>
              )}
            </div>
          </div>

          {/* Vertical Progress Bars */}
          <div className="bg-black/40 backdrop-blur-sm rounded-lg p-3 border border-white/20">
            <div className="flex items-end gap-3 h-32">
              {/* Main Progress Bar */}
              <div className="flex flex-col items-center gap-1">
                <div className="text-xs text-gray-400 mb-1">Progress</div>
                <div className="w-3 h-24 bg-gray-700/60 rounded-full overflow-hidden relative">
                  <div
                    className={`absolute bottom-0 w-full transition-all duration-200 rounded-full ${
                      minigame.fishFighting
                        ? 'bg-gradient-to-t from-red-500 to-orange-400'
                        : minigame.progress > 0.7
                          ? 'bg-gradient-to-t from-green-400 to-emerald-400'
                          : 'bg-gradient-to-t from-blue-500 to-cyan-400'
                    }`}
                    style={{
                      height: `${minigame.progress * 100}%`,
                      transition: 'height 0.1s ease-out'
                    }}
                  />
                  {/* Subtle glow at progress edge */}
                  {minigame.progress > 0 && (
                    <div
                      className="absolute w-full h-1 bg-white/30 rounded-full"
                      style={{
                        bottom: `${Math.max(0, minigame.progress * 96 - 2)}%`,
                        filter: 'blur(1px)'
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Fish Stamina Bar */}
              {minigame.hookedFish && (
                <div className="flex flex-col items-center gap-1">
                  <div className="text-xs text-gray-400 mb-1">Stamina</div>
                  <div className="w-2 h-24 bg-gray-700/60 rounded-full overflow-hidden relative">
                    <div
                      className="absolute bottom-0 w-full bg-gradient-to-t from-yellow-600 to-yellow-400 transition-all duration-300 rounded-full"
                      style={{ height: `${minigame.hookedFish.stamina}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Reel Button */}
            <button
              className={`sm:hidden mt-2 w-full px-3 py-2 rounded-lg font-bold active:scale-95 transition-all text-xs ${
                minigame.fishFighting
                  ? 'bg-red-600/80 hover:bg-red-500/90 text-white'
                  : reelState.isReeling
                    ? 'bg-cyan-600/80 hover:bg-cyan-500/90 text-white'
                    : 'bg-blue-600/80 hover:bg-blue-500/90 text-white'
              }`}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleKeyDown({ key: ' ' } as KeyboardEvent);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleKeyUp({ key: ' ' } as KeyboardEvent);
              }}
            >
              {minigame.fishFighting ? '⚠️ WAIT' : 'REEL'}
            </button>
          </div>
        </div>
      )}
      
      {/* Fish Victory Display */}
      {fishVictory?.show && fishVictory.fish && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 100 }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-gradient-to-br from-blue-900/95 via-blue-800/95 to-cyan-800/95 rounded-2xl p-8 max-w-md border-2 border-cyan-400/50 shadow-2xl">
            {/* Title */}
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-white mb-2">🎣 Fish Caught!</h2>
              {fishVictory.isNewSpecies && (
                <div className="text-yellow-400 font-semibold animate-pulse">⭐ New Species Discovered!</div>
              )}
            </div>
            
            {/* Fish Info */}
            <div className="bg-black/30 rounded-xl p-4 mb-6">
              <div className="text-center mb-3">
                <div className="text-4xl mb-2">🐟</div>
                <div className="text-xl font-bold text-cyan-300">{fishVictory.fish.species.name}</div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-white">
                <div className="bg-black/20 rounded p-2">
                  <div className="text-xs text-gray-400">Weight</div>
                  <div className="font-semibold">{fishVictory.weight.toFixed(1)} lbs</div>
                </div>
                <div className="bg-black/20 rounded p-2">
                  <div className="text-xs text-gray-400">Length</div>
                  <div className="font-semibold">{fishVictory.length.toFixed(0)} cm</div>
                </div>
              </div>
              <div className="mt-3 text-center text-sm text-cyan-200">
                Added to inventory!
              </div>
            </div>
            
            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setFishVictory(null);
                  onExit();
                }}
                className="flex-1 px-4 py-3 bg-red-600/80 hover:bg-red-500/90 text-white font-bold rounded-lg transition-all hover:scale-105"
              >
                Stop Fishing
              </button>
              <button
                onClick={() => setFishVictory(null)}
                className="flex-1 px-4 py-3 bg-green-600/80 hover:bg-green-500/90 text-white font-bold rounded-lg transition-all hover:scale-105"
              >
                Keep Going!
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Simple Exit Button */}
      <div className="absolute top-4 right-4" style={{ zIndex: 30 }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onExit();
          }}
          className="p-2 rounded-lg bg-black/50 hover:bg-black/70 text-white/90 hover:text-white border border-white/30 hover:border-white/50 transition-all"
          style={{ pointerEvents: 'auto' }}
          title="Exit fishing"
        >
          <span className="text-lg">✕</span>
        </button>
      </div>
    </div>
  );
};

export default FishingHutInteractive;