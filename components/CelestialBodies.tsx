/**
 * components/CelestialBodies.tsx - Dynamic sun, moon, and planets positioning
 * Renders celestial bodies with gothic arch path and realistic planets
 */

import React, { useMemo } from 'react';
import { TimeOfDay } from '../types';

interface CelestialBodiesProps {
  timeOfDay: TimeOfDay;
  gameTimeHours: number;
  gameTimeMinutes: number;
  width?: number;
  height?: number;
  weather?: {
    precipitation: 'none' | 'rain' | 'snow' | 'sleet' | 'hail';
    cloudCover: number;
    intensity: number;
  } | null;
  gameDay?: number;
  gameMonth?: number;
}

const CelestialBodies: React.FC<CelestialBodiesProps> = ({
  timeOfDay,
  gameTimeHours,
  gameTimeMinutes,
  width = window.innerWidth,
  height = window.innerHeight,
  weather = null,
  gameDay = 1,
  gameMonth = 1
}) => {
  // Calculate sun/moon position based on time with gothic arch path
  const celestialPosition = useMemo(() => {
    const totalMinutes = gameTimeHours * 60 + gameTimeMinutes;
    const dayProgress = totalMinutes / (24 * 60);
    
    // Sun rises at 6 AM, sets at 6 PM (simplified)
    // Moon rises at 6 PM, sets at 6 AM
    const sunriseTime = 6 * 60;  // 6 AM in minutes
    const sunsetTime = 18 * 60;  // 6 PM in minutes
    const dayDuration = sunsetTime - sunriseTime;
    
    let sunVisible = false;
    let moonVisible = false;
    let sunPosition = { x: 0, y: 0 };
    let moonPosition = { x: 0, y: 0 };
    let moonPhase = 0; // 0 = new, 0.5 = full, 1 = new again
    
    // Calculate realistic moon phase based on game day (29.5 day cycle)
    const lunarCycle = 29.5;
    const dayInCycle = (gameDay % lunarCycle) / lunarCycle;
    
    // Create realistic moon phases:
    // 0 = new moon, 0.25 = first quarter, 0.5 = full moon, 0.75 = last quarter
    if (dayInCycle < 0.5) {
      // Waxing: new moon to full moon
      moonPhase = dayInCycle * 2; // 0 to 1
    } else {
      // Waning: full moon to new moon  
      moonPhase = 2 - (dayInCycle * 2); // 1 to 0
    }
    
    if (totalMinutes >= sunriseTime && totalMinutes <= sunsetTime) {
      // Sun is visible during day
      sunVisible = true;
      const sunProgress = (totalMinutes - sunriseTime) / dayDuration;
      
      // Gothic arch path for sun
      // Starts at bottom RIGHT (east), rises to peak above map, sets at bottom LEFT (west)
      const angle = sunProgress * Math.PI;
      
      // X position: moves from RIGHT (east, 95%) to LEFT (west, 5%) of screen
      const xPos = width * (0.95 - sunProgress * 0.9);
      
      // Y position: gothic arch - high peak in middle
      let yPos;
      if (sunProgress < 0.5) {
        // Rising: bottom left to top center
        const riseProgress = sunProgress * 2;
        yPos = height * (0.85 - riseProgress * 0.65); // From 85% to 20% of height
      } else {
        // Setting: top center to bottom right
        const setProgress = (sunProgress - 0.5) * 2;
        yPos = height * (0.2 + setProgress * 0.65); // From 20% back to 85%
      }
      
      sunPosition = { x: xPos, y: yPos };
    }
    
    // Moon calculation with same gothic arch
    if (totalMinutes < sunriseTime || totalMinutes > sunsetTime) {
      moonVisible = true;
      let moonProgress;
      
      if (totalMinutes > sunsetTime) {
        // Evening/night
        moonProgress = (totalMinutes - sunsetTime) / (24 * 60 - sunsetTime + sunriseTime);
      } else {
        // Early morning
        moonProgress = (totalMinutes + (24 * 60 - sunsetTime)) / (24 * 60 - sunsetTime + sunriseTime);
      }
      
      // Gothic arch path for moon (also rises from east/right, sets in west/left)
      const xPos = width * (0.95 - moonProgress * 0.9);
      
      let yPos;
      if (moonProgress < 0.5) {
        const riseProgress = moonProgress * 2;
        yPos = height * (0.85 - riseProgress * 0.65);
      } else {
        const setProgress = (moonProgress - 0.5) * 2;
        yPos = height * (0.2 + setProgress * 0.65);
      }
      
      moonPosition = { x: xPos, y: yPos };
    }
    
    return { sunVisible, moonVisible, sunPosition, moonPosition, moonPhase };
  }, [gameTimeHours, gameTimeMinutes, width, height]);
  
  // Calculate planet positions based on month and time
  const planetPositions = useMemo(() => {
    if (timeOfDay !== 'Night' && timeOfDay !== 'Dusk') return [];
    
    const planets = [];
    const baseY = height * 0.15; // Upper portion of sky
    
    // Venus - visible in evening/morning, bright cream color
    const venusMonth = (gameMonth + 3) % 12;
    if (venusMonth < 6) {
      planets.push({
        name: 'Venus',
        x: width * (0.3 + (venusMonth / 12) * 0.4),
        y: baseY + Math.sin(venusMonth * Math.PI / 6) * 50,
        size: 4,
        color: '#FFFACD', // Light yellow cream
        glow: '#FFFACD'
      });
    }
    
    // Mars - reddish, smaller
    const marsMonth = (gameMonth + 7) % 12;
    if (marsMonth < 8) {
      planets.push({
        name: 'Mars',
        x: width * (0.5 + (marsMonth / 12) * 0.3),
        y: baseY + 30 + Math.sin(marsMonth * Math.PI / 4) * 40,
        size: 3,
        color: '#CD5C5C', // Indian red
        glow: '#FF6347'
      });
    }
    
    // Jupiter - small but bright, yellowish
    const jupiterMonth = gameMonth % 12;
    if (jupiterMonth > 2 && jupiterMonth < 10) {
      planets.push({
        name: 'Jupiter',
        x: width * (0.6 + (jupiterMonth / 12) * 0.2),
        y: baseY + 60 + Math.sin(jupiterMonth * Math.PI / 8) * 30,
        size: 2,
        color: '#FFD700', // Gold
        glow: '#FFFF99'
      });
    }
    
    // Saturn - pale yellow, very small
    const saturnMonth = (gameMonth + 5) % 12;
    if (saturnMonth > 4 && saturnMonth < 11) {
      planets.push({
        name: 'Saturn',
        x: width * (0.4 + (saturnMonth / 12) * 0.4),
        y: baseY + 80 + Math.sin(saturnMonth * Math.PI / 6) * 25,
        size: 1.5,
        color: '#F0E68C', // Khaki
        glow: '#FFFACD'
      });
    }
    
    return planets;
  }, [gameMonth, timeOfDay, width, height]);
  
  // Weather affects visibility
  const isRaining = weather?.precipitation === 'rain';
  const isSnowing = weather?.precipitation === 'snow' || weather?.precipitation === 'sleet';
  const cloudIntensity = weather?.cloudCover || 0;
  
  // Get dynamic sun colors based on exact time and weather
  const getSunColors = useMemo(() => {
    if (isRaining) return { core: '#e0e0e0', glow: '#d0d0d0' }; // Dim white during rain
    if (isSnowing) return { core: '#f0f0f0', glow: '#e0e0e0' }; // Hidden during snow
    
    const totalMinutes = gameTimeHours * 60 + gameTimeMinutes;
    
    // Sunrise: 6-8 AM (360-480 minutes)
    if (totalMinutes >= 360 && totalMinutes < 480) {
      const progress = (totalMinutes - 360) / 120;
      // Deep red → orange → gold
      if (progress < 0.5) {
        return { 
          core: '#ff4500', // Deep orange-red
          glow: '#ff6347'  // Tomato
        };
      } else {
        return { 
          core: '#ff8c00', // Dark orange
          glow: '#ffa500'  // Orange
        };
      }
    }
    
    // Morning: 8-10 AM
    if (totalMinutes >= 480 && totalMinutes < 600) {
      return { 
        core: '#ffb347', // Peach
        glow: '#ffd700'  // Gold
      };
    }
    
    // Midday: 10 AM - 3 PM
    if (totalMinutes >= 600 && totalMinutes < 900) {
      return { 
        core: '#ffd700', // Gold
        glow: '#ffeb3b'  // Bright yellow
      };
    }
    
    // Late afternoon: 3-5 PM (900-1020 minutes)
    if (totalMinutes >= 900 && totalMinutes < 1020) {
      return { 
        core: '#ffb347', // Peach
        glow: '#ffd700'  // Gold
      };
    }
    
    // Sunset: 5-6:30 PM (1020-1110 minutes) - Beautiful gradual transition
    if (totalMinutes >= 1020 && totalMinutes < 1110) {
      const progress = (totalMinutes - 1020) / 90;
      if (progress < 0.33) {
        return { 
          core: '#ff9966', // Light salmon
          glow: '#ffb347'  // Peach
        };
      } else if (progress < 0.66) {
        return { 
          core: '#ff6347', // Tomato
          glow: '#ff8c69'  // Salmon
        };
      } else {
        return { 
          core: '#ff4500', // Orange-red (final sunset)
          glow: '#ff6347'  // Tomato
        };
      }
    }
    
    // Default
    return { 
      core: '#ffd700', 
      glow: '#ffeb3b' 
    };
  }, [gameTimeHours, gameTimeMinutes, isRaining, isSnowing]);
  
  // Moon with beautiful white-yellow core and blue atmospheric glow
  const moonColor = '#fffacd'; // Light yellow-white
  const moonGlowColor = '#4169e1'; // Royal blue for atmospheric glow
  const starVisibility = timeOfDay === 'Night' ? 1 : 
                        timeOfDay === 'Dusk' ? 0.3 : 
                        timeOfDay === 'Dawn' ? 0.2 : 0;
  
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      {/* Sun - hidden during snow, dimmed during rain */}
      {celestialPosition.sunVisible && !isSnowing && (
        <div
          className="absolute transition-all duration-[3000ms] ease-in-out"
          style={{
            left: `${celestialPosition.sunPosition.x}px`,
            top: `${celestialPosition.sunPosition.y}px`,
            transform: 'translate(-50%, -50%)',
            opacity: isRaining ? 0.3 : 1 // Very dim during rain
          }}
        >
          {/* Sun glow */}
          <div
            className="absolute"
            style={{
              width: isRaining ? '80px' : '120px',
              height: isRaining ? '80px' : '120px',
              background: `radial-gradient(circle, ${getSunColors.glow}33 0%, transparent 70%)`,
              transform: 'translate(-50%, -50%)',
              left: '50%',
              top: '50%',
              filter: isRaining ? 'blur(30px)' : 'blur(20px)'
            }}
          />
          {/* Sun core */}
          <div
            style={{
              width: isRaining ? '30px' : '40px',
              height: isRaining ? '30px' : '40px',
              borderRadius: '50%',
              background: isRaining 
                ? `radial-gradient(circle, ${getSunColors.core} 0%, ${getSunColors.core}66 70%, transparent 100%)`
                : `radial-gradient(circle, ${getSunColors.core} 0%, ${getSunColors.core}dd 70%, ${getSunColors.glow}aa 100%)`,
              boxShadow: isRaining 
                ? `0 0 20px ${getSunColors.core}44`
                : `0 0 40px ${getSunColors.core}88, 0 0 80px ${getSunColors.glow}44`
            }}
          />
          {/* Sun rays - hidden during rain */}
          {!isRaining && (timeOfDay === 'Dawn' || timeOfDay === 'Dusk') ? (
            <svg
              width="200"
              height="200"
              viewBox="0 0 200 200"
              style={{
                position: 'absolute',
                left: '-80px',
                top: '-80px',
                opacity: 0.3
              }}
            >
              {[0, 30, 60, 90, 120, 150].map(angle => (
                <line
                  key={angle}
                  x1="100"
                  y1="100"
                  x2={100 + Math.cos(angle * Math.PI / 180) * 100}
                  y2={100 + Math.sin(angle * Math.PI / 180) * 100}
                  stroke={getSunColors.glow}
                  strokeWidth="2"
                  opacity="0.5"
                />
              ))}
            </svg>
          ) : null}
        </div>
      )}
      
      {/* Moon - Simple flat crescent/phase */}
      {celestialPosition.moonVisible && (
        <div
          className="absolute transition-all duration-[3000ms] ease-in-out"
          style={{
            left: `${celestialPosition.moonPosition.x}px`,
            top: `${celestialPosition.moonPosition.y}px`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          {/* Very subtle glow */}
          <div
            className="absolute"
            style={{
              width: '50px',
              height: '50px',
              background: `radial-gradient(circle, ${moonColor}10 0%, transparent 60%)`,
              transform: 'translate(-50%, -50%)',
              left: '50%',
              top: '50%',
              filter: 'blur(10px)'
            }}
          />
          {/* Moon using SVG for clean phase rendering */}
          <svg 
            width="30" 
            height="30" 
            viewBox="0 0 30 30"
            style={{
              position: 'relative'
            }}
          >
            <defs>
              <mask id="moon-phase-mask">
                <rect x="0" y="0" width="30" height="30" fill="black" />
                <circle cx="15" cy="15" r="14" fill="white" />
                {/* Create the phase shadow */}
                {celestialPosition.moonPhase < 0.5 ? (
                  // Waxing (new to full)
                  celestialPosition.moonPhase < 0.25 ? (
                    // Crescent (new to first quarter)
                    <ellipse 
                      cx={15 + 15 * (1 - celestialPosition.moonPhase * 4)} 
                      cy="15" 
                      rx={14 * (1 - celestialPosition.moonPhase * 4)}
                      ry="14" 
                      fill="black" 
                    />
                  ) : (
                    // Gibbous (first quarter to full)
                    <ellipse 
                      cx={15 - 15 * ((celestialPosition.moonPhase - 0.25) * 4)} 
                      cy="15" 
                      rx={14 * ((celestialPosition.moonPhase - 0.25) * 4)}
                      ry="14" 
                      fill="black" 
                    />
                  )
                ) : celestialPosition.moonPhase > 0.5 ? (
                  // Waning (full to new)
                  celestialPosition.moonPhase < 0.75 ? (
                    // Gibbous (full to last quarter)
                    <ellipse 
                      cx={15 + 15 * ((celestialPosition.moonPhase - 0.5) * 4)} 
                      cy="15" 
                      rx={14 * ((celestialPosition.moonPhase - 0.5) * 4)}
                      ry="14" 
                      fill="black" 
                    />
                  ) : (
                    // Crescent (last quarter to new)
                    <ellipse 
                      cx={15 - 15 * (1 - (celestialPosition.moonPhase - 0.75) * 4)} 
                      cy="15" 
                      rx={14 * (1 - (celestialPosition.moonPhase - 0.75) * 4)}
                      ry="14" 
                      fill="black" 
                    />
                  )
                ) : null}
              </mask>
            </defs>
            {/* Simple flat moon */}
            <circle 
              cx="15" 
              cy="15" 
              r="14" 
              fill={moonColor}
              mask="url(#moon-phase-mask)"
            />
            {/* Very subtle crater hints */}
            <circle 
              cx="11" 
              cy="12" 
              r="1.5" 
              fill="#e0e0e0"
              opacity="0.2"
              mask="url(#moon-phase-mask)"
            />
            <circle 
              cx="18" 
              cy="16" 
              r="1" 
              fill="#e0e0e0"
              opacity="0.15"
              mask="url(#moon-phase-mask)"
            />
            <circle 
              cx="14" 
              cy="19" 
              r="0.8" 
              fill="#e0e0e0"
              opacity="0.15"
              mask="url(#moon-phase-mask)"
            />
          </svg>
        </div>
      )}
      
      {/* Planets during night/dusk */}
      {planetPositions.map((planet, i) => (
        <div
          key={`planet-${planet.name}-${i}`}
          className="absolute"
          style={{
            left: `${planet.x}px`,
            top: `${planet.y}px`,
            transform: 'translate(-50%, -50%)'
          }}
          title={planet.name}
        >
          {/* Planet glow */}
          <div
            className="absolute"
            style={{
              width: `${planet.size * 4}px`,
              height: `${planet.size * 4}px`,
              background: `radial-gradient(circle, ${planet.glow}20 0%, transparent 70%)`,
              transform: 'translate(-50%, -50%)',
              left: '50%',
              top: '50%',
              filter: 'blur(2px)'
            }}
          />
          {/* Planet core */}
          <div
            style={{
              width: `${planet.size}px`,
              height: `${planet.size}px`,
              borderRadius: '50%',
              background: planet.color,
              boxShadow: `0 0 ${planet.size * 2}px ${planet.glow}40`
            }}
          />
        </div>
      ))}
      
      {/* Additional stars during night */}
      {starVisibility > 0 && (
        <div className="absolute inset-0 pointer-events-none" style={{ opacity: starVisibility, zIndex: 0 }}>
          {Array.from({ length: 40 }, (_, i) => {
            const x = (i * 37 + 100) % width;
            const y = (i * 53 + 50) % (height * 0.4); // Spread across more of the sky
            const size = 0.5 + (i % 3) * 0.5; // Smaller stars
            const twinkle = i % 4 === 0;
            
            return (
              <div
                key={`star-${i}`}
                className={twinkle ? 'animate-pulse' : ''}
                style={{
                  position: 'absolute',
                  left: `${x}px`,
                  top: `${y}px`,
                  width: `${size}px`,
                  height: `${size}px`,
                  borderRadius: '50%',
                  background: '#ffffff',
                  boxShadow: `0 0 ${size * 2}px rgba(255, 255, 255, 0.8)`
                }}
              />
            );
          })}
        </div>
      )}
      
      {/* Enhanced snowflakes - more abundant and smaller */}
      {isSnowing && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }}>
          {Array.from({ length: 150 }, (_, i) => {
            const x = Math.random() * width;
            const startY = -20;
            const size = 1 + Math.random() * 2; // Smaller: 1-3px instead of 2-6px
            const duration = 8 + Math.random() * 12; // 8-20s fall time
            const delay = Math.random() * duration;
            const drift = 20 + Math.random() * 40; // Horizontal drift
            
            return (
              <div
                key={`snow-${i}`}
                className="absolute animate-snow-fall"
                style={{
                  left: `${x}px`,
                  top: `${startY}px`,
                  width: `${size}px`,
                  height: `${size}px`,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.9)',
                  boxShadow: `0 0 ${size}px rgba(255, 255, 255, 0.5)`,
                  animation: `snowfall ${duration}s linear infinite`,
                  animationDelay: `${delay}s`,
                  '--drift': `${drift}px`
                } as React.CSSProperties}
              />
            );
          })}
          <style jsx="true">{`
            @keyframes snowfall {
              0% {
                transform: translateY(0) translateX(0);
                opacity: 0;
              }
              10% {
                opacity: 1;
              }
              90% {
                opacity: 1;
              }
              100% {
                transform: translateY(${height + 40}px) translateX(var(--drift));
                opacity: 0;
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default CelestialBodies;