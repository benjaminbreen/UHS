/**
 * FishingGameCanvas.tsx - Beautiful fishing minigame with detailed pixel art
 * Matches the aesthetic of MarketplaceModal with rich, detailed visuals
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FishSpecies, FishingDataService } from '../services/fishingDataService';
import { CulturalZone } from '../types/characterData';
import { HistoricalEra } from '../types/ambiance';
import { ClimateType, Season } from '../types';
import { gameSounds } from '../services/gameSoundsService';
import { FishRenderer } from './FishRenderer';

interface FishingGameCanvasProps {
  availableFish: FishSpecies[];
  culturalZone: CulturalZone;
  historicalEra: HistoricalEra;
  climate: ClimateType;
  season: Season;
  timeOfDay: 'Dawn' | 'Morning' | 'Midday' | 'Afternoon' | 'Dusk' | 'Night';
  isFreshwater: boolean;
  onCatch: (fish: FishSpecies, weight: number, length: number) => void;
  onExit: () => void;
  fishingService: FishingDataService;
}

interface SwimmingFish {
  id: string;
  species: FishSpecies;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  direction: 'left' | 'right';
  pattern: number;
  catchable: boolean;
  opacity: number;
  wigglePhase: number;
  targetY?: number;
  interested: boolean;
  escaping: boolean;
}

interface FishingLine {
  cast: boolean;
  x: number;
  depth: number;
  targetDepth: number;
  hasBait: boolean;
  hookedFish: SwimmingFish | null;
}

interface FishingMinigame {
  active: boolean;
  fishPosition: number; // 0-1, fish position on the bar
  playerPosition: number; // 0-1, green zone position  
  fishDirection: number; // -1 or 1, which way fish is moving
  fishSpeed: number; // how fast fish moves
  progress: number; // 0-1, how close to catching (need to reach 1.0)
  greenZoneSize: number; // size of the catching zone
}

interface WaterParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  type: 'bubble' | 'sparkle' | 'debris' | 'plankton';
  color?: string;
}

interface PowerBar {
  active: boolean;
  power: number;
  perfect: boolean;
}

const FishingGameCanvas: React.FC<FishingGameCanvasProps> = ({
  availableFish,
  culturalZone,
  historicalEra,
  climate,
  season,
  timeOfDay,
  isFreshwater,
  onCatch,
  onExit,
  fishingService
}) => {
  const canvasRef = useRef<SVGSVGElement>(null);
  const animationFrameRef = useRef<number>();
  
  const [swimmingFish, setSwimmingFish] = useState<SwimmingFish[]>([]);
  const [hoveredFish, setHoveredFish] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [fishingLine, setFishingLine] = useState<FishingLine>({
    cast: false,
    x: 450,
    depth: 0,
    targetDepth: 0,
    hasBait: true,
    hookedFish: null
  });

  const [minigame, setMinigame] = useState<FishingMinigame>({
    active: false,
    fishPosition: 0.5,
    playerPosition: 0.5,
    fishDirection: 1,
    fishSpeed: 0.02,
    progress: 0,
    greenZoneSize: 0.2
  });
  
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [waterParticles, setWaterParticles] = useState<WaterParticle[]>([]);
  const [gameMessage, setGameMessage] = useState<string>('Cast your line into the water');
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; radius: number; opacity: number }>>([]);
  const [powerBar, setPowerBar] = useState<PowerBar>({ active: false, power: 0, perfect: false });
  const [castPower, setCastPower] = useState(0);
  const [isCharging, setIsCharging] = useState(false);
  const [lastNibbleTime, setLastNibbleTime] = useState(0);
  
  const GAME_WIDTH = 900;
  const GAME_HEIGHT = 600;
  const WATER_SURFACE_Y = 140;
  const MAX_VISIBLE_DEPTH = 460;
  const MIN_FISH_Y = WATER_SURFACE_Y + 60; // Fish start swimming 60px below surface
  const MAX_FISH_Y = GAME_HEIGHT - 40; // Fish don't go to absolute bottom

  // Initialize fish with better variety
  useEffect(() => {
    const spawnInitialFish = () => {
      const initialFish: SwimmingFish[] = [];
      
      availableFish.forEach((species) => {
        const spawnCount = species.rarity === 'common' ? 5 : 
                          species.rarity === 'uncommon' ? 3 : 
                          species.rarity === 'rare' ? 1 : 1;
        
        for (let i = 0; i < spawnCount; i++) {
          // Spawn fish in the lower 80% of water where bobber can reach
          const depthPercent = 0.2 + Math.random() * 0.8; // 20% to 100% depth
          const fishY = MIN_FISH_Y + (MAX_FISH_Y - MIN_FISH_Y) * depthPercent;
          
          initialFish.push({
            id: `${species.id}_${i}_${Date.now()}`,
            species,
            x: 100 + Math.random() * (GAME_WIDTH - 200),
            y: fishY,
            vx: (0.5 + Math.random() * species.speed) * (Math.random() > 0.5 ? 1 : -1),
            vy: 0,
            size: species.size.min + Math.random() * (species.size.max - species.size.min),
            direction: Math.random() > 0.5 ? 'left' : 'right',
            pattern: Math.random() * Math.PI * 2,
            catchable: true,
            opacity: 1,
            wigglePhase: Math.random() * Math.PI * 2,
            interested: false,
            escaping: false
          });
        }
      });
      
      setSwimmingFish(initialFish);
    };

    spawnInitialFish();

    // Initialize rich particle system
    const initialParticles: WaterParticle[] = [];
    for (let i = 0; i < 30; i++) {
      const type = Math.random() > 0.7 ? 'sparkle' : Math.random() > 0.5 ? 'bubble' : 'plankton';
      initialParticles.push({
        x: Math.random() * GAME_WIDTH,
        y: WATER_SURFACE_Y + Math.random() * MAX_VISIBLE_DEPTH,
        vx: (Math.random() - 0.5) * 0.3,
        vy: type === 'bubble' ? -0.5 - Math.random() * 0.5 : (Math.random() - 0.5) * 0.2,
        size: type === 'plankton' ? 1 : 2 + Math.random() * 3,
        opacity: 0.3 + Math.random() * 0.4,
        type,
        color: type === 'plankton' ? '#90EE90' : undefined
      });
    }
    setWaterParticles(initialParticles);
  }, [availableFish]);

  // Minigame animation loop
  useEffect(() => {
    if (!minigame.active) return;

    const interval = setInterval(() => {
      setMinigame(prev => {
        const newMinigame = { ...prev };
        
        // Move fish based on its direction and speed
        newMinigame.fishPosition += newMinigame.fishDirection * newMinigame.fishSpeed;
        
        // Bounce off edges
        if (newMinigame.fishPosition <= 0) {
          newMinigame.fishPosition = 0;
          newMinigame.fishDirection = 1;
        } else if (newMinigame.fishPosition >= 1) {
          newMinigame.fishPosition = 1;
          newMinigame.fishDirection = -1;
        }
        
        // Randomly change direction sometimes
        if (Math.random() < 0.1) {
          newMinigame.fishDirection *= -1;
        }
        
        // Apply gravity to player position - it falls down if not clicking
        newMinigame.playerPosition = Math.min(1, newMinigame.playerPosition + 0.02);
        
        // Check if player green zone overlaps with fish
        const greenZoneStart = newMinigame.playerPosition - newMinigame.greenZoneSize / 2;
        const greenZoneEnd = newMinigame.playerPosition + newMinigame.greenZoneSize / 2;
        
        if (newMinigame.fishPosition >= greenZoneStart && newMinigame.fishPosition <= greenZoneEnd) {
          // Fish is in green zone - add progress
          newMinigame.progress += 0.02;
        } else {
          // Fish is outside green zone - lose progress
          newMinigame.progress -= 0.01;
        }
        
        // Clamp progress
        newMinigame.progress = Math.max(0, Math.min(1, newMinigame.progress));
        
        // Check win condition
        if (newMinigame.progress >= 1.0) {
          // Success! Fish caught
          const hookedFish = fishingLine.hookedFish;
          if (hookedFish) {
            const catchData = fishingService.generateCatch(hookedFish.species);
            onCatch(hookedFish.species, catchData.weight, catchData.length);
            
            const points = catchData.value * (1 + combo * 0.1);
            setScore(prev => prev + Math.round(points));
            setCombo(prev => prev + 1);
            
            const culturalName = fishingService.getCulturalName(hookedFish.species, culturalZone);
            setGameMessage(`🎉 ${culturalName} caught! +${Math.round(points)} pts`);
            
            // Remove caught fish
            setSwimmingFish(prev => prev.filter(f => f.id !== hookedFish.id));
            
            gameSounds.playFishingSuccessSound();
          }
          
          // Reset state
          setFishingLine({
            cast: false,
            x: 450,
            depth: 0,
            targetDepth: 0,
            hasBait: true,
            hookedFish: null
          });
          
          return {
            active: false,
            fishPosition: 0.5,
            playerPosition: 0.5,
            fishDirection: Math.random() < 0.5 ? -1 : 1,
            fishSpeed: 0.02,
            progress: 0,
            greenZoneSize: 0.2
          };
        }
        
        // Check lose condition
        if (newMinigame.progress <= 0) {
          // Fish escaped
          setGameMessage('Fish escaped! Try again.');
          setCombo(0);
          gameSounds.playFishingMissSound();
          
          setFishingLine(prev => ({ ...prev, hookedFish: null }));
          
          return {
            active: false,
            fishPosition: 0.5,
            playerPosition: 0.5,
            fishDirection: Math.random() < 0.5 ? -1 : 1,
            fishSpeed: 0.02,
            progress: 0,
            greenZoneSize: 0.2
          };
        }
        
        return newMinigame;
      });
    }, 50); // 20 FPS
    
    return () => clearInterval(interval);
  }, [minigame.active, onCatch, fishingService, culturalZone, combo, fishingLine.hookedFish]);

  // Enhanced animation with fish AI
  useEffect(() => {
    const animate = () => {
      // Update fish with intelligent behavior
      setSwimmingFish(prevFish => prevFish.map(fish => {
        let newX = fish.x + fish.vx;
        let newVx = fish.vx;
        let newDirection = fish.direction;
        let interested = fish.interested;
        let escaping = fish.escaping;
        
        // Boundary behavior
        if (newX < 80 || newX > GAME_WIDTH - 80) {
          newX = Math.max(80, Math.min(GAME_WIDTH - 80, newX));
          newDirection = newDirection === 'left' ? 'right' : 'left';
          newVx = -newVx;
        }

        // Natural swimming with schooling tendency
        const wiggle = Math.sin(Date.now() / 600 + fish.wigglePhase) * 3;
        const depthDrift = Math.sin(Date.now() / 3000 + fish.pattern) * 8;
        let newY = fish.y + wiggle * 0.5 + depthDrift * 0.1;

        // Simple bait interaction - fish bites when close
        if (fishingLine.cast && fishingLine.hasBait && !fishingLine.hookedFish && !minigame.active) {
          const distToHook = Math.sqrt(
            Math.pow(fish.x - fishingLine.x, 2) + 
            Math.pow(fish.y - (WATER_SURFACE_Y + fishingLine.depth), 2)
          );
          
          if (distToHook < 40) {
            // Simple bite chance - no complex behavior
            const biteChance = fish.species.rarity === 'common' ? 0.02 : 
                              fish.species.rarity === 'uncommon' ? 0.015 : 0.01;
            
            if (Math.random() < biteChance) {
              // Start the minigame!
              setFishingLine(prev => ({ ...prev, hookedFish: fish }));
              setMinigame({
                active: true,
                fishPosition: 0.7, // Fish starts near bottom
                playerPosition: 0.5,
                fishDirection: Math.random() > 0.5 ? 1 : -1,
                fishSpeed: 0.02 + (fish.species.rarity === 'legendary' ? 0.02 : 
                                  fish.species.rarity === 'rare' ? 0.01 : 0),
                progress: 0,
                greenZoneSize: 0.15
              });
              setGameMessage('🎣 Fish hooked! Click to keep the green bar over the fish!');
              gameSounds.playFishingBiteSound();
              
              // Splash effect
              setRipples(prev => [...prev, {
                x: fishingLine.x,
                y: WATER_SURFACE_Y + fishingLine.depth,
                radius: 15,
                opacity: 1
              }]);
            }
          }
        }

        return {
          ...fish,
          x: newX,
          y: Math.max(MIN_FISH_Y, Math.min(MAX_FISH_Y, newY)),
          vx: newVx,
          direction: newDirection,
          interested,
          escaping
        };
      }));

      // Update fishing line physics
      setFishingLine(prev => {
        if (!prev.cast) return prev;
        
        let newDepth = prev.depth;
        const depthDiff = prev.targetDepth - prev.depth;
        
        if (Math.abs(depthDiff) > 2) {
          newDepth += depthDiff * 0.1;
        }

        // Dynamic tension based on fish size
        let newTension = prev.tension;
        if (prev.hookedFish) {
          // Fish fights back harder based on size and rarity
          const fightStrength = (prev.hookedFish.size / 30) * 
            (prev.hookedFish.species.rarity === 'legendary' ? 2 : 
             prev.hookedFish.species.rarity === 'rare' ? 1.5 : 1);
          
          // Tension decreases over time as fish fights
          newTension = Math.max(0, newTension - 0.003 * fightStrength);
          
          // Fish escapes if tension too low
          if (newTension <= 0) {
            setGameMessage('The fish broke free! Click faster next time!');
            setCombo(0);
            gameSounds.playFishingMissSound();
            return { ...prev, hookedFish: null, tension: 0.5, depth: prev.depth };
          }
          
          // Auto-reel based on reel speed
          if (prev.reelSpeed > 0) {
            newDepth = Math.max(0, newDepth - prev.reelSpeed * 0.8);
            // Reduce reel speed over time
            prev.reelSpeed = Math.max(0, prev.reelSpeed - 0.1);
          }
          
          // Fish pulls line deeper if tension is low
          if (newTension < 0.3) {
            newDepth = Math.min(400, newDepth + fightStrength * 2);
          }
        }

        return { ...prev, depth: newDepth, tension: newTension };
      });

      // Rich particle system
      setWaterParticles(prevParticles => prevParticles.map(particle => {
        let newY = particle.y + particle.vy;
        let newX = particle.x + particle.vx + Math.sin(Date.now() / 500 + particle.x) * 0.2;
        let newOpacity = particle.opacity;
        
        // Bubble behavior
        if (particle.type === 'bubble') {
          if (newY < WATER_SURFACE_Y) {
            // Create surface pop
            setRipples(prev => [...prev, {
              x: newX,
              y: WATER_SURFACE_Y,
              radius: 2,
              opacity: 0.5
            }]);
            
            return {
              ...particle,
              y: GAME_HEIGHT - 50,
              x: Math.random() * GAME_WIDTH,
              opacity: 0.3 + Math.random() * 0.4
            };
          }
        }
        
        // Plankton drift
        if (particle.type === 'plankton') {
          newY += Math.sin(Date.now() / 1000 + particle.x) * 0.1;
        }
        
        return { ...particle, y: newY, x: newX, opacity: newOpacity };
      }));

      // Update ripples with realistic spread
      setRipples(prevRipples => prevRipples
        .map(ripple => ({
          ...ripple,
          radius: ripple.radius + 1.5,
          opacity: Math.max(0, ripple.opacity - 0.015)
        }))
        .filter(ripple => ripple.opacity > 0)
      );

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [fishingLine.cast, fishingLine.hasBait, fishingLine.hookedFish, fishingLine.x]);

  // Handle mouse down for power charging
  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (minigame.active || fishingLine.hookedFish || fishingLine.cast) return;
    
    setIsCharging(true);
    setPowerBar({ active: true, power: 0, perfect: false });
  }, [fishingLine, minigame.active]);

  // Handle minigame clicks
  const handleMinigameClick = useCallback(() => {
    if (!minigame.active) return;
    
    setMinigame(prev => ({
      ...prev,
      playerPosition: Math.max(0, Math.min(1, prev.playerPosition - 0.15))
    }));
  }, [minigame.active]);

  // Handle mouse up for casting
  const handleMouseUp = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Handle minigame clicks first
    if (minigame.active) {
      handleMinigameClick();
      return;
    }

    // Old complex reeling logic removed - now handled by minigame
    
    if (!fishingLine.cast && isCharging) {
      // Cast with power
      const power = powerBar.power;
      const distance = 50 + power * 350;
      const targetDepth = Math.min(MAX_VISIBLE_DEPTH - 50, distance);
      
      setFishingLine({
        cast: true,
        x: x,
        depth: 0,
        targetDepth: targetDepth,
        hasBait: true,
        tension: 0.5,
        hookedFish: null,
        reelSpeed: 0
      });
      
      setGameMessage(powerBar.perfect ? 'Perfect cast!' : 'Line cast!');
      setPowerBar({ active: false, power: 0, perfect: false });
      setIsCharging(false);
      gameSounds.playFishingCastSound();
      
      // Casting splash
      setRipples(prev => [...prev, {
        x: x,
        y: WATER_SURFACE_Y,
        radius: 10 + power * 10,
        opacity: 1
      }]);
    } else if (fishingLine.cast && !fishingLine.hookedFish) {
      // Reel in empty line
      setFishingLine(prev => ({ ...prev, cast: false, depth: 0, targetDepth: 0 }));
      setGameMessage('Cast your line into the water');
    }
  }, [fishingLine, culturalZone, fishingService, onCatch, combo, powerBar, isCharging, minigame.active, handleMinigameClick]);

  // Update power bar while charging
  useEffect(() => {
    if (isCharging) {
      const interval = setInterval(() => {
        setPowerBar(prev => {
          const newPower = Math.min(1, prev.power + 0.02);
          const perfect = newPower > 0.7 && newPower < 0.9;
          return { ...prev, power: newPower, perfect };
        });
      }, 20);
      
      return () => clearInterval(interval);
    }
  }, [isCharging]);

  // Get rich water gradients with climate-specific colors
  const getWaterColors = () => {
    const baseColors = {
      tropical: ['#00F5FF', '#00CED1', '#20B2AA', '#008B8B', '#006666', '#004444'],
      semitropical: ['#00CED1', '#48D1CC', '#40E0D0', '#3CB5B5', '#318A8A', '#265F5F'],
      temperate: ['#4682B4', '#4169E1', '#3457D5', '#2E4BC7', '#1E3A8A', '#0F172A'],
      cold: ['#B0C4DE', '#778899', '#708090', '#5F6A7D', '#4C5669', '#3A4255'],
      mediterranean: ['#0077BE', '#006994', '#005A82', '#004C6D', '#003D5B', '#002F49'],
      arid: ['#8B7355', '#A0826D', '#B8956A', '#C4A57B', '#D2B48C', '#DEB887'],
      freshwater: ['#5F9EA0', '#4682B4', '#3B7393', '#2C5F7C', '#1E4258', '#0F2132'],
      night: ['#191970', '#16164F', '#0F0F3F', '#080829', '#040415', '#000008']
    };

    // Time of day overrides
    if (timeOfDay === 'Night') return baseColors.night;
    if (timeOfDay === 'Dusk') {
      // Blend day colors with night
      const dayColors = baseColors[climate.toLowerCase() as keyof typeof baseColors] || baseColors.temperate;
      return dayColors.map((color, i) => {
        // Simple color blending
        return color.replace('#', '#7') + '88';
      });
    }
    
    // Climate-specific water colors
    if (isFreshwater) return baseColors.freshwater;
    
    switch(climate) {
      case ClimateType.TROPICAL:
        return baseColors.tropical;
      case ClimateType.SEMITROPICAL:
        return baseColors.semitropical;
      case ClimateType.COLD:
        return baseColors.cold;
      case ClimateType.MEDITERRANEAN:
        return baseColors.mediterranean;
      case ClimateType.ARID:
        return isFreshwater ? baseColors.arid : baseColors.mediterranean;
      default:
        return baseColors.temperate;
    }
  };

  const waterColors = getWaterColors();

  // Use the new FishRenderer component for species-specific rendering
  const renderDetailedFish = (fish: SwimmingFish) => {
    // Calculate the direction angle from the fish's velocity
    const directionAngle = fish.direction === 'right' ? 0 : Math.PI;
    
    return (
      <g
        onMouseEnter={() => setHoveredFish(fish.id)}
        onMouseLeave={() => setHoveredFish(null)}
        style={{ cursor: 'pointer' }}
      >
        <FishRenderer
          species={fish.species}
          x={fish.x}
          y={fish.y + Math.sin(Date.now() / 200 + fish.wigglePhase) * 2}
          size={fish.size * 2}
          direction={directionAngle}
          isHooked={fishingLine.hookedFish?.id === fish.id}
          opacity={fish.opacity}
        />
      </g>
    );
  };

  // Helper function to adjust color brightness
  const adjustColor = (color: string, amount: number): string => {
    const usePound = color[0] === '#';
    const col = usePound ? color.slice(1) : color;
    const num = parseInt(col, 16);
    let r = (num >> 16) + amount;
    let g = ((num >> 8) & 0x00FF) + amount;
    let b = (num & 0x0000FF) + amount;
    r = r > 255 ? 255 : r < 0 ? 0 : r;
    g = g > 255 ? 255 : g < 0 ? 0 : g;
    b = b > 255 ? 255 : b < 0 ? 0 : b;
    return (usePound ? '#' : '') + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
  };

  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      height: '100%', 
      background: 'linear-gradient(to bottom, #87CEEB 0%, #98D8E8 50%, #87CEEB 100%)',
      overflow: 'hidden'
    }}>
      <svg
        ref={canvasRef}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        style={{ 
          width: '100%', 
          height: '100%', 
          cursor: fishingLine.hookedFish ? 'grab' : isCharging ? 'wait' : 'crosshair',
          imageRendering: 'crisp-edges'
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={(e) => {
          const rect = canvasRef.current?.getBoundingClientRect();
          if (rect) {
            setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
          }
        }}
      >
        <defs>
          {/* Rich water gradient */}
          <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            {waterColors.map((color, i) => (
              <stop key={i} offset={`${i * 20}%`} stopColor={color} stopOpacity={0.95 + i * 0.01} />
            ))}
          </linearGradient>

          {/* Sunlight rays */}
          <radialGradient id="sunlight" cx="30%" cy="0%">
            <stop offset="0%" stopColor="#FFFACD" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#FFE4B5" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#FFE4B5" stopOpacity="0" />
          </radialGradient>

          {/* Enhanced depth fog with climate-specific murkiness - MADE MORE DRAMATIC */}
          <linearGradient id="depthFog" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="20%" stopColor={isFreshwater ? '#4B5C4A' : '#002644'} stopOpacity="0.2" />
            <stop offset="40%" stopColor={isFreshwater ? '#3B4C3A' : '#001533'} stopOpacity="0.4" />
            <stop offset="65%" stopColor={isFreshwater ? '#2B3C2A' : '#000833'} stopOpacity="0.6" />
            <stop offset="85%" stopColor={isFreshwater ? '#1B2C1A' : '#000433'} stopOpacity="0.8" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.9" />
          </linearGradient>
          
          {/* Water murkiness filter */}
          <filter id="waterMurk" x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="3" seed="5" />
            <feColorMatrix values="0 0 0 0 0.1
                                  0 0 0 0 0.15
                                  0 0 0 0 0.2
                                  0 0 0 0.3 0" />
            <feGaussianBlur stdDeviation="1" />
            <feBlend mode="multiply" />
          </filter>
          
          {/* Depth distortion filter */}
          <filter id="depthDistortion">
            <feTurbulence type="turbulence" baseFrequency="0.008" numOctaves="2" result="turbulence" seed="2" />
            <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="8" xChannelSelector="R" yChannelSelector="G" />
          </filter>

          {/* Caustic light pattern for shallow water */}
          <filter id="caustics">
            <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="2" result="turbulence" />
            <feColorMatrix in="turbulence" type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="discrete" tableValues="0 .5 .5 .5 1 1 1 .5 .5 .5 .5" />
            </feComponentTransfer>
            <feGaussianBlur stdDeviation="0.5" />
            <feSpecularLighting result="specOut" specularExponent="20" lighting-color="white">
              <fePointLight x="-50" y="30" z="200" />
            </feSpecularLighting>
            <feComposite in="specOut" in2="SourceAlpha" operator="in" />
          </filter>
        </defs>

        {/* Sky background with gradient */}
        <rect x={0} y={0} width={GAME_WIDTH} height={WATER_SURFACE_Y} fill="url(#skyGradient)" />
        
        {/* Detailed clouds */}
        <g opacity={0.8}>
          {[
            { x: 120, y: 40, w: 80, h: 25 },
            { x: 350, y: 60, w: 100, h: 30 },
            { x: 600, y: 35, w: 90, h: 28 },
            { x: 750, y: 70, w: 70, h: 20 }
          ].map((cloud, i) => (
            <g key={i}>
              <ellipse cx={cloud.x} cy={cloud.y} rx={cloud.w/2} ry={cloud.h/2} fill="white" />
              <ellipse cx={cloud.x - cloud.w/3} cy={cloud.y + 5} rx={cloud.w/3} ry={cloud.h/2.5} fill="white" />
              <ellipse cx={cloud.x + cloud.w/3} cy={cloud.y + 3} rx={cloud.w/2.5} ry={cloud.h/2.2} fill="white" />
            </g>
          ))}
        </g>

        {/* Water surface with waves */}
        <path
          d={`M 0,${WATER_SURFACE_Y} ${Array.from({ length: 20 }, (_, i) => {
            const x = i * GAME_WIDTH / 19;
            const y = WATER_SURFACE_Y + Math.sin(Date.now() / 500 + i) * 3;
            return `L ${x},${y}`;
          }).join(' ')} L ${GAME_WIDTH},${WATER_SURFACE_Y} L ${GAME_WIDTH},${GAME_HEIGHT} L 0,${GAME_HEIGHT} Z`}
          fill="url(#waterGradient)"
        />

        {/* Sunlight rays (daytime only) */}
        {(timeOfDay === 'Morning' || timeOfDay === 'Midday' || timeOfDay === 'Afternoon') && (
          <ellipse 
            cx={GAME_WIDTH * 0.3} 
            cy={WATER_SURFACE_Y} 
            rx={300} 
            ry={400} 
            fill="url(#sunlight)"
            opacity={0.5}
          />
        )}

        {/* Climate-specific environmental elements */}
        {climate === ClimateType.TROPICAL && (
          // Coral reef
          <g opacity={0.8}>
            {[150, 350, 550, 750].map((x, i) => (
              <g key={i} transform={`translate(${x}, ${GAME_HEIGHT - 50})`}>
                {/* Brain coral */}
                <ellipse cx={0} cy={0} rx={40} ry={30} fill="#FF7F50" />
                <ellipse cx={0} cy={-5} rx={35} ry={25} fill="#FF6347" />
                {/* Coral patterns */}
                {[0, 60, 120, 180, 240, 300].map(angle => (
                  <path
                    key={angle}
                    d={`M 0,0 L ${Math.cos(angle * Math.PI / 180) * 20},${Math.sin(angle * Math.PI / 180) * 15}`}
                    stroke="#FF4500"
                    strokeWidth="2"
                    opacity="0.5"
                  />
                ))}
                {/* Sea anemone */}
                <g transform={`translate(${-30 + i * 10}, 10)`}>
                  {[0, 20, 40, 60, 80].map(a => (
                    <ellipse
                      key={a}
                      cx={Math.cos(a * Math.PI / 90) * 15}
                      cy={Math.sin(a * Math.PI / 90) * 10}
                      rx={3}
                      ry={15}
                      fill="#FF69B4"
                      opacity="0.7"
                      transform={`rotate(${a + Math.sin(Date.now() / 500) * 5} 0 0)`}
                    />
                  ))}
                </g>
              </g>
            ))}
          </g>
        )}
        
        {climate === ClimateType.COLD && (
          // Ice floes
          <g opacity={0.9}>
            {[200, 450, 700].map((x, i) => (
              <g key={i}>
                {/* Floating ice */}
                <rect
                  x={x + Math.sin(Date.now() / 2000 + i) * 10}
                  y={WATER_SURFACE_Y - 10}
                  width={80 + i * 20}
                  height={20}
                  fill="#E0FFFF"
                  rx={5}
                />
                <rect
                  x={x + Math.sin(Date.now() / 2000 + i) * 10 + 5}
                  y={WATER_SURFACE_Y - 15}
                  width={70 + i * 20}
                  height={10}
                  fill="#F0FFFF"
                  rx={3}
                />
                {/* Underwater ice */}
                <polygon
                  points={`${x + Math.sin(Date.now() / 2000 + i) * 10},${WATER_SURFACE_Y} ${x + 40 + Math.sin(Date.now() / 2000 + i) * 10},${WATER_SURFACE_Y} ${x + 35 + Math.sin(Date.now() / 2000 + i) * 10},${WATER_SURFACE_Y + 30} ${x + 5 + Math.sin(Date.now() / 2000 + i) * 10},${WATER_SURFACE_Y + 30}`}
                  fill="#B0E0E6"
                  opacity="0.5"
                />
              </g>
            ))}
          </g>
        )}
        
        {isFreshwater && climate === ClimateType.TEMPERATE && (
          // Lily pads for freshwater
          <g opacity={0.8}>
            {[180, 380, 580, 780].map((x, i) => (
              <g key={i} transform={`translate(${x + Math.sin(Date.now() / 3000 + i) * 5}, ${WATER_SURFACE_Y})`}>
                {/* Lily pad */}
                <ellipse cx={0} cy={0} rx={30} ry={25} fill="#228B22" />
                <ellipse cx={0} cy={0} rx={28} ry={23} fill="#32CD32" />
                {/* Notch */}
                <path d="M 0,0 L -25,-5 L -25,5 Z" fill="#1E4620" />
                {/* Flower (sometimes) */}
                {i % 2 === 0 && (
                  <g transform="translate(5, -3)">
                    {[0, 72, 144, 216, 288].map(angle => (
                      <ellipse
                        key={angle}
                        cx={Math.cos(angle * Math.PI / 180) * 8}
                        cy={Math.sin(angle * Math.PI / 180) * 8}
                        rx={6}
                        ry={10}
                        fill="#FFB6C1"
                        transform={`rotate(${angle} 0 0)`}
                      />
                    ))}
                    <circle cx={0} cy={0} r={5} fill="#FFD700" />
                  </g>
                )}
              </g>
            ))}
          </g>
        )}
        
        {(climate === ClimateType.TEMPERATE || climate === ClimateType.MEDITERRANEAN) && !isFreshwater && (
          // Kelp forest for temperate ocean
          <g opacity={0.7}>
            {[100, 250, 400, 550, 700, 850].map((x, i) => {
              const height = 120 + i * 20;
              const sway = Math.sin(Date.now() / 1000 + i) * 8;
              
              return (
                <g key={i} transform={`translate(${x + sway}, ${GAME_HEIGHT})`}>
                  {/* Main stalk */}
                  <path
                    d={`M 0,0 Q ${sway/2},-${height/2} ${sway},-${height}`}
                    stroke="#2E7D32"
                    strokeWidth={4}
                    fill="none"
                  />
                  {/* Leaves */}
                  {[0.3, 0.5, 0.7, 0.9].map(pos => (
                    <ellipse
                      key={pos}
                      cx={sway * pos}
                      cy={-height * pos}
                      rx={20}
                      ry={8}
                      fill="#388E3C"
                      transform={`rotate(${45 + sway * 2} ${sway * pos} ${-height * pos})`}
                    />
                  ))}
                </g>
              );
            })}
          </g>
        )}
        
        {climate === ClimateType.ARID && isFreshwater && (
          // Desert oasis plants
          <g opacity={0.7}>
            {[200, 500, 800].map((x, i) => (
              <g key={i} transform={`translate(${x}, ${GAME_HEIGHT - 40})`}>
                {/* Reeds */}
                {[-10, -5, 0, 5, 10].map(offset => (
                  <line
                    key={offset}
                    x1={offset}
                    y1={0}
                    x2={offset + Math.sin(Date.now() / 500 + offset) * 3}
                    y2={-60 - Math.random() * 20}
                    stroke="#8B7355"
                    strokeWidth="2"
                  />
                ))}
                {/* Cattails */}
                <ellipse cx={0} cy={-70} rx={4} ry={10} fill="#654321" />
              </g>
            ))}
          </g>
        )}

        {/* Depth indicators with style */}
        <g opacity={0.4}>
          {[100, 200, 300, 400].map(depth => (
            <g key={depth}>
              <line 
                x1={20} y1={WATER_SURFACE_Y + depth * 0.9}
                x2={50} y2={WATER_SURFACE_Y + depth * 0.9}
                stroke="white" 
                strokeWidth={1}
                strokeDasharray="3,3"
              />
              <text 
                x={55} y={WATER_SURFACE_Y + depth * 0.9 + 4}
                fill="white" 
                fontSize="11"
                fontFamily="monospace"
                style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
              >
                {depth}m
              </text>
            </g>
          ))}
        </g>

        {/* Water particles with variety */}
        {waterParticles.map((particle, i) => (
          <g key={i}>
            {particle.type === 'bubble' ? (
              <circle
                cx={particle.x}
                cy={particle.y}
                r={particle.size}
                fill="rgba(255,255,255,0.1)"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth={0.5}
                opacity={particle.opacity}
              />
            ) : particle.type === 'sparkle' ? (
              <g transform={`translate(${particle.x}, ${particle.y}) rotate(${Date.now() / 20})`}>
                <path
                  d={`M 0,-${particle.size} L ${particle.size/3},${particle.size/3} L -${particle.size/3},${particle.size/3} Z`}
                  fill="rgba(255,255,200,0.7)"
                  opacity={particle.opacity}
                />
              </g>
            ) : (
              <circle
                cx={particle.x}
                cy={particle.y}
                r={particle.size}
                fill={particle.color || 'rgba(144,238,144,0.4)'}
                opacity={particle.opacity}
              />
            )}
          </g>
        ))}

        {/* Beautiful detailed fish */}
        {swimmingFish.map(fish => renderDetailedFish(fish))}
        
        {/* Fish tooltip on hover */}
        {hoveredFish && (() => {
          const fish = swimmingFish.find(f => f.id === hoveredFish);
          if (!fish) return null;
          
          const culturalName = fishingService.getCulturalName(fish.species, culturalZone);
          const isNative = climate === ClimateType.TROPICAL && fish.species.waterType !== 'freshwater' ? 
            ['parrotfish', 'barracuda', 'yellowfin_tuna'].includes(fish.species.id) :
            climate === ClimateType.COLD ? 
            ['arctic_char', 'greenland_shark', 'atlantic_cod'].includes(fish.species.id) :
            true;
          
          return (
            <g transform={`translate(${Math.min(mousePos.x, GAME_WIDTH - 250)}, ${Math.max(mousePos.y - 100, 20)})`}>
              <rect x={0} y={0} width={240} height={85} fill="rgba(15, 23, 42, 0.95)" rx={8} stroke="#60A5FA" strokeWidth="1" />
              <text x={10} y={20} fill="#60A5FA" fontSize="14" fontWeight="bold">
                {culturalName || fish.species.name}
              </text>
              <text x={10} y={38} fill="#93C5FD" fontSize="11">
                {fish.species.name !== culturalName ? fish.species.name : ''}
              </text>
              <text x={10} y={54} fill="#E5E7EB" fontSize="10">
                {fish.species.description}
              </text>
              <text x={10} y={68} fill="#9CA3AF" fontSize="10">
                Size: {fish.size.toFixed(1)}kg • {fish.species.rarity} • {isNative ? 'Native' : 'Migratory'}
              </text>
              <text x={10} y={80} fill="#FCD34D" fontSize="10">
                Value: {fish.species.value} coins
              </text>
            </g>
          );
        })()}

        {/* Fishing line system */}
        {fishingLine.cast && (
          <g>
            {/* Fishing line with physics */}
            <path
              d={`M ${fishingLine.x},${WATER_SURFACE_Y - 10} 
                 Q ${fishingLine.x + Math.sin(Date.now() / 300) * 5},${WATER_SURFACE_Y + fishingLine.depth / 2} 
                 ${fishingLine.x + Math.sin(Date.now() / 200) * 2},${WATER_SURFACE_Y + fishingLine.depth}`}
              stroke="#4a4a4a"
              strokeWidth={1.5}
              fill="none"
              opacity={0.8}
            />
            
            {/* Detailed bobber */}
            <g transform={`translate(${fishingLine.x}, ${WATER_SURFACE_Y + Math.sin(Date.now() / 400) * 2})`}>
              <ellipse cx={0} cy={2} rx={10} ry={5} fill="#8B0000" />
              <ellipse cx={0} cy={0} rx={8} ry={4} fill="#DC143C" />
              <ellipse cx={0} cy={-2} rx={6} ry={3} fill="#FF6347" />
              <rect x={-1} y={-10} width={2} height={8} fill="#8B4513" />
              <circle cx={0} cy={-10} r={2} fill="#FFD700" />
            </g>
            
            {/* Hook and bait */}
            {fishingLine.hasBait && (
              <g transform={`translate(${fishingLine.x + Math.sin(Date.now() / 200) * 2}, ${WATER_SURFACE_Y + fishingLine.depth})`}>
                {/* Detailed hook */}
                <path
                  d="M 0,0 C 0,2 0,4 -1,5 C -2,6 -3,6 -4,5 C -4,4 -4,3 -3,2"
                  stroke="#696969"
                  strokeWidth={2}
                  fill="none"
                  strokeLinecap="round"
                />
                {/* Animated worm bait */}
                {!fishingLine.hookedFish && (
                  <g transform={`translate(-2, 3)`}>
                    <path
                      d={`M 0,0 Q ${Math.sin(Date.now() / 100) * 2},3 0,6`}
                      stroke="#8B4513"
                      strokeWidth={3}
                      fill="none"
                      strokeLinecap="round"
                    />
                  </g>
                )}
              </g>
            )}

            {/* Stardew-style fishing minigame */}
            {minigame.active && (
              <g transform={`translate(${GAME_WIDTH / 2 + 150}, ${WATER_SURFACE_Y + 50})`}>
                {/* Meter background */}
                <rect x={0} y={0} width={40} height={300} fill="rgba(0,0,0,0.8)" rx={20} stroke="white" strokeWidth={2} />
                <rect x={5} y={5} width={30} height={290} fill="rgba(30,30,30,0.9)" rx={15} />
                
                {/* Fish indicator (red bar) */}
                <rect 
                  x={8} 
                  y={10 + (1 - minigame.fishPosition) * 280} 
                  width={24} 
                  height={30} 
                  fill="#FF4444" 
                  rx={3}
                />
                
                {/* Player green zone */}
                <rect 
                  x={8} 
                  y={10 + (1 - minigame.playerPosition - minigame.greenZoneSize/2) * 280} 
                  width={24} 
                  height={minigame.greenZoneSize * 280} 
                  fill="rgba(68,255,68,0.7)" 
                  rx={3}
                />
                
                {/* Progress bar on the side */}
                <g transform="translate(-30, 0)">
                  <rect x={0} y={0} width={20} height={300} fill="rgba(0,0,0,0.8)" rx={10} />
                  <rect 
                    x={3} 
                    y={300 - (minigame.progress * 290)} 
                    width={14} 
                    height={minigame.progress * 290} 
                    fill="#4CAF50" 
                    rx={7}
                  />
                  <text x={-40} y={10} fill="white" fontSize="12" fontWeight="bold" transform="rotate(-90, -40, 10)">
                    PROGRESS
                  </text>
                </g>
                
                {/* Instructions */}
                <text x={20} y={-20} textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
                  CLICK TO LIFT!
                </text>
                <text x={20} y={-5} textAnchor="middle" fill="#FFD700" fontSize="11">
                  Keep green over red
                </text>
              </g>
            )}
          </g>
        )}

        {/* Power bar for casting */}
        {powerBar.active && (
          <g transform={`translate(${GAME_WIDTH / 2 - 100}, ${GAME_HEIGHT - 80})`}>
            <rect x={0} y={0} width={200} height={30} fill="rgba(0,0,0,0.8)" rx={15} />
            <rect x={5} y={5} width={190} height={20} fill="rgba(255,255,255,0.2)" rx={10} />
            
            {/* Perfect zone */}
            <rect x={140} y={5} width={35} height={20} fill="rgba(255,215,0,0.3)" rx={2} />
            
            {/* Power fill */}
            <rect 
              x={5} y={5} 
              width={190 * powerBar.power} 
              height={20} 
              fill={powerBar.perfect ? '#FFD700' : '#4CAF50'}
              rx={10}
            />
            
            <text x={100} y={-5} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
              CASTING POWER
            </text>
          </g>
        )}

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
          />
        ))}

        {/* Depth-based murkiness layers */}
        {/* Layer 1: Shallow water caustics (only in daylight) */}
        {(timeOfDay !== 'Night' && timeOfDay !== 'Dusk') && (
          <rect
            x={0}
            y={WATER_SURFACE_Y}
            width={GAME_WIDTH}
            height={100}
            fill="white"
            opacity="0.1"
            filter="url(#caustics)"
            pointerEvents="none"
          />
        )}
        
        {/* Layer 2: Mid-depth murkiness - MADE MORE VISIBLE */}
        <rect
          x={0}
          y={WATER_SURFACE_Y + 100}
          width={GAME_WIDTH}
          height={150}
          fill={isFreshwater ? '#4A5D4A' : '#2A3D5A'}
          opacity="0.4"
          filter="url(#waterMurk)"
          pointerEvents="none"
        />
        
        {/* Layer 3: Deep water distortion - MADE MORE VISIBLE */}
        <g filter="url(#depthDistortion)" opacity="1.0">
          <rect
            x={0}
            y={WATER_SURFACE_Y + 250}
            width={GAME_WIDTH}
            height={200}
            fill={isFreshwater ? '#3A4D3A' : '#1A2D4A'}
            opacity="0.5"
          />
        </g>
        
        {/* Layer 4: Floating particles at different depths - MADE MORE VISIBLE */}
        {Array.from({ length: 25 }, (_, i) => {
          const depth = WATER_SURFACE_Y + 80 + (i * 12); // More systematic depth distribution
          const size = 3 + Math.random() * 6;
          const drift = Math.sin(Date.now() / 3000 + i) * 30;
          const opacity = Math.min(0.6, 0.2 + (depth - WATER_SURFACE_Y) / 300); // Higher opacity
          
          return (
            <g key={`murk-${i}`} opacity={opacity}>
              <ellipse
                cx={80 + i * 35 + drift}
                cy={depth + Math.sin(Date.now() / 2000 + i * 0.5) * 15}
                rx={size}
                ry={size * 0.8}
                fill={isFreshwater ? '#5A6D5A' : '#4A5D7A'}
                filter="blur(2px)"
              />
            </g>
          );
        })}
        
        {/* Main depth fog overlay */}
        <rect 
          x={0} 
          y={WATER_SURFACE_Y} 
          width={GAME_WIDTH} 
          height={GAME_HEIGHT - WATER_SURFACE_Y}
          fill="url(#depthFog)"
          pointerEvents="none"
        />
        
        {/* Additional murk for very deep water */}
        <rect
          x={0}
          y={WATER_SURFACE_Y + 350}
          width={GAME_WIDTH}
          height={GAME_HEIGHT - WATER_SURFACE_Y - 350}
          fill="black"
          opacity="0.5"
          pointerEvents="none"
        />
        
        {/* DEBUG: Visual depth zone markers (can be removed later) */}
        <g opacity="0.3" pointerEvents="none">
          {/* Shallow zone marker */}
          <line x1="10" y1={WATER_SURFACE_Y + 100} x2="50" y2={WATER_SURFACE_Y + 100} stroke="yellow" strokeWidth="2" strokeDasharray="5,5" />
          <text x="55" y={WATER_SURFACE_Y + 105} fill="yellow" fontSize="10">Shallow (100ft)</text>
          
          {/* Mid zone marker */}
          <line x1="10" y1={WATER_SURFACE_Y + 250} x2="50" y2={WATER_SURFACE_Y + 250} stroke="orange" strokeWidth="2" strokeDasharray="5,5" />
          <text x="55" y={WATER_SURFACE_Y + 255} fill="orange" fontSize="10">Mid (250ft)</text>
          
          {/* Deep zone marker */}
          <line x1="10" y1={WATER_SURFACE_Y + 350} x2="50" y2={WATER_SURFACE_Y + 350} stroke="red" strokeWidth="2" strokeDasharray="5,5" />
          <text x="55" y={WATER_SURFACE_Y + 355} fill="red" fontSize="10">Deep (350ft)</text>
        </g>
      </svg>

      {/* Game UI matching MarketplaceModal style */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 0.98))',
        color: 'white',
        padding: '16px',
        borderRadius: '12px',
        fontSize: '14px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        minWidth: '200px'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          marginBottom: '12px',
          paddingBottom: '12px',
          borderBottom: '1px solid rgba(148, 163, 184, 0.2)'
        }}>
          <span style={{ fontSize: '24px' }}>🎣</span>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#60A5FA' }}>
              Score: {score.toLocaleString()}
            </div>
            {combo > 1 && (
              <div style={{ fontSize: '12px', color: '#FCD34D' }}>
                {combo}x Combo!
              </div>
            )}
          </div>
        </div>
        
        <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
          <div style={{ marginBottom: '4px', opacity: 0.9 }}>
            📏 Depth: {Math.round(fishingLine.depth / MAX_VISIBLE_DEPTH * 400)}m
          </div>
          <div style={{ marginBottom: '8px', opacity: 0.9 }}>
            🌊 {isFreshwater ? 'Freshwater' : 'Saltwater'} • {timeOfDay}
          </div>
        </div>
        
        <div style={{ 
          marginTop: '12px', 
          padding: '8px', 
          background: 'rgba(0,0,0,0.4)', 
          borderRadius: '8px',
          fontSize: '12px',
          textAlign: 'center',
          color: '#93C5FD'
        }}>
          {gameMessage}
        </div>
        
        {!fishingLine.cast && (
          <div style={{
            marginTop: '8px',
            fontSize: '11px',
            opacity: 0.7,
            textAlign: 'center'
          }}>
            Hold click to charge cast power
          </div>
        )}
      </div>

      {/* Exit button in MarketplaceModal style */}
      <button
        onClick={onExit}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'linear-gradient(135deg, #DC2626, #991B1B)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '10px',
          cursor: 'pointer',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontWeight: '600',
          fontSize: '14px',
          boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(220, 38, 38, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)';
        }}
      >
        Exit Fishing
      </button>
    </div>
  );
};

export default FishingGameCanvas;