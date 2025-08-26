/**
 * components/CloudSystem.tsx - Dynamic cloud rendering system
 * Creates beautiful, performant clouds that respond to weather and time of day
 */

import React, { useMemo, useEffect, useRef } from 'react';
import { TimeOfDay } from '../types';
import { WeatherState } from '../services/weatherService';

interface CloudSystemProps {
  weather: WeatherState | null;
  timeOfDay: TimeOfDay;
  width?: number;
  height?: number;
  windSpeed?: number;
}

interface Cloud {
  id: number;
  x: number;
  y: number;
  scale: number;
  opacity: number;
  speed: number;
  type: 'cumulus' | 'stratus' | 'cirrus' | 'cumulonimbus';
}

const CloudSystem: React.FC<CloudSystemProps> = ({ 
  weather, 
  timeOfDay,
  width = window.innerWidth,
  height = window.innerHeight,
  windSpeed = 0
}) => {
  const cloudsRef = useRef<Cloud[]>([]);
  const animationFrameRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Cloud colors based on time of day
  const cloudColors = useMemo(() => {
    switch(timeOfDay) {
      case 'Dawn':
        return {
          base: 'rgba(255, 182, 193, 0.8)', // Light pink
          shadow: 'rgba(255, 140, 90, 0.3)', // Peach shadow
          highlight: 'rgba(255, 228, 181, 0.9)' // Pale gold highlight
        };
      case 'Dusk':
        return {
          base: 'rgba(255, 160, 122, 0.8)', // Light salmon
          shadow: 'rgba(255, 99, 71, 0.3)', // Tomato shadow
          highlight: 'rgba(255, 192, 147, 0.9)' // Peach highlight
        };
      case 'Night':
        return {
          base: 'rgba(58, 68, 102, 0.6)', // Dark blue-gray
          shadow: 'rgba(26, 32, 53, 0.4)', // Deep shadow
          highlight: 'rgba(88, 98, 132, 0.7)' // Moonlit highlight
        };
      case 'Midday':
        return {
          base: 'rgba(255, 255, 255, 0.95)', // Bright white
          shadow: 'rgba(200, 200, 200, 0.3)', // Light gray shadow
          highlight: 'rgba(255, 255, 255, 1)' // Pure white highlight
        };
      case 'Day':
      default:
        return {
          base: 'rgba(255, 255, 255, 0.9)', // White
          shadow: 'rgba(220, 220, 220, 0.3)', // Light gray shadow
          highlight: 'rgba(255, 255, 255, 0.95)' // Bright white highlight
        };
    }
  }, [timeOfDay]);

  // Generate clouds based on weather
  const generateClouds = useMemo(() => {
    const clouds: Cloud[] = [];
    
    if (!weather) return clouds;

    let cloudCount = 0;
    let cloudTypes: Cloud['type'][] = [];
    
    // Determine cloud count and types based on weather
    if (weather.precipitation === 'rain' || weather.precipitation === 'drizzle') {
      cloudCount = 8 + Math.floor(weather.intensity * 5);
      cloudTypes = ['stratus', 'cumulonimbus', 'cumulonimbus'];
    } else if (weather.precipitation === 'snow') {
      cloudCount = 10 + Math.floor(weather.intensity * 3);
      cloudTypes = ['stratus', 'stratus'];
    } else if (weather.special === 'fog' || weather.special === 'mist') {
      cloudCount = 12;
      cloudTypes = ['stratus'];
    } else {
      // Use cloudCover to determine cloud count
      if (weather.cloudCover < 0.15) {
        // Clear skies - just a few wispy clouds
        cloudCount = Math.floor(0 + Math.random() * 2);
        cloudTypes = ['cirrus'];
      } else if (weather.cloudCover < 0.4) {
        // Partly cloudy - some puffy clouds
        cloudCount = Math.floor(2 + weather.cloudCover * 8);
        cloudTypes = ['cumulus', 'cirrus'];
      } else if (weather.cloudCover < 0.7) {
        // Mostly cloudy - many clouds
        cloudCount = Math.floor(5 + weather.cloudCover * 10);
        cloudTypes = ['cumulus', 'stratus', 'cumulus'];
      } else {
        // Overcast - full cloud cover
        cloudCount = Math.floor(8 + weather.cloudCover * 8);
        cloudTypes = ['stratus', 'stratus', 'cumulonimbus'];
      }
    }

    // Generate individual clouds
    for (let i = 0; i < cloudCount; i++) {
      const type = cloudTypes[i % cloudTypes.length];
      const layer = i % 3; // 3 layers of clouds for depth
      
      clouds.push({
        id: i,
        x: Math.random() * (width + 400) - 200,
        y: 50 + layer * 150 + Math.random() * 100,
        scale: 0.5 + Math.random() * 1.5,
        opacity: type === 'stratus' ? 0.4 + Math.random() * 0.3 : 0.6 + Math.random() * 0.3,
        speed: (0.1 + Math.random() * 0.2) * (1 + windSpeed * 0.02) * (1 - layer * 0.2), // Slowed down 5x
        type
      });
    }
    
    return clouds;
  }, [weather?.precipitation, weather?.intensity, weather?.special, weather?.humidity, width, windSpeed]); // Only regenerate on major weather changes

  // Initialize clouds with smooth transition
  useEffect(() => {
    // Only update if clouds significantly changed
    if (cloudsRef.current.length === 0 || Math.abs(cloudsRef.current.length - generateClouds.length) > 3) {
      cloudsRef.current = generateClouds;
    }
  }, [generateClouds]);

  // Animation loop for cloud movement
  useEffect(() => {
    const animate = () => {
      if (!containerRef.current) return;
      
      cloudsRef.current = cloudsRef.current.map(cloud => {
        let newX = cloud.x + cloud.speed * 0.2; // Further slow down animation
        
        // Wrap around when cloud exits screen
        if (newX > width + 200) {
          newX = -400;
        }
        
        return { ...cloud, x: newX };
      });
      
      // Update DOM elements
      const cloudElements = containerRef.current.querySelectorAll('.cloud');
      cloudElements.forEach((element, index) => {
        const cloud = cloudsRef.current[index];
        if (cloud) {
          (element as HTMLElement).style.transform = `translate(${cloud.x}px, ${cloud.y}px) scale(${cloud.scale})`;
        }
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    // Start animation if there are clouds and wind
    if (generateClouds.length > 0 && (windSpeed > 0 || weather?.windSpeed)) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [generateClouds, width, windSpeed, weather?.windSpeed]);

  // Render cloud shapes
  const renderCloud = (cloud: Cloud) => {
    const { base, shadow, highlight } = cloudColors;
    
    switch(cloud.type) {
      case 'cumulus':
        // Fluffy fair-weather clouds
        return (
          <svg
            width="200"
            height="100"
            viewBox="0 0 200 100"
            style={{
              position: 'absolute',
              opacity: cloud.opacity,
              filter: 'blur(1px)'
            }}
          >
            <defs>
              <radialGradient id={`cumulus-gradient-${cloud.id}`}>
                <stop offset="0%" stopColor={highlight} />
                <stop offset="70%" stopColor={base} />
                <stop offset="100%" stopColor={shadow} />
              </radialGradient>
            </defs>
            <ellipse cx="50" cy="60" rx="35" ry="25" fill={`url(#cumulus-gradient-${cloud.id})`} />
            <ellipse cx="100" cy="50" rx="45" ry="35" fill={`url(#cumulus-gradient-${cloud.id})`} />
            <ellipse cx="150" cy="60" rx="35" ry="25" fill={`url(#cumulus-gradient-${cloud.id})`} />
            <ellipse cx="75" cy="70" rx="40" ry="20" fill={`url(#cumulus-gradient-${cloud.id})`} />
            <ellipse cx="125" cy="70" rx="40" ry="20" fill={`url(#cumulus-gradient-${cloud.id})`} />
          </svg>
        );
      
      case 'stratus':
        // Flat, overcast clouds
        return (
          <svg
            width="300"
            height="60"
            viewBox="0 0 300 60"
            style={{
              position: 'absolute',
              opacity: cloud.opacity,
              filter: 'blur(2px)'
            }}
          >
            <defs>
              <linearGradient id={`stratus-gradient-${cloud.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={base} stopOpacity="0.2" />
                <stop offset="50%" stopColor={base} stopOpacity="0.6" />
                <stop offset="100%" stopColor={shadow} stopOpacity="0.3" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="300" height="60" fill={`url(#stratus-gradient-${cloud.id})`} />
            <ellipse cx="150" cy="30" rx="150" ry="30" fill={`url(#stratus-gradient-${cloud.id})`} />
          </svg>
        );
      
      case 'cirrus':
        // Wispy high-altitude clouds
        return (
          <svg
            width="250"
            height="80"
            viewBox="0 0 250 80"
            style={{
              position: 'absolute',
              opacity: cloud.opacity * 0.6,
              filter: 'blur(3px)'
            }}
          >
            <defs>
              <linearGradient id={`cirrus-gradient-${cloud.id}`}>
                <stop offset="0%" stopColor={base} stopOpacity="0.1" />
                <stop offset="50%" stopColor={highlight} stopOpacity="0.3" />
                <stop offset="100%" stopColor={base} stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <path
              d="M 0 40 Q 50 20, 100 35 T 200 30 Q 225 35, 250 40"
              stroke={`url(#cirrus-gradient-${cloud.id})`}
              strokeWidth="15"
              fill="none"
            />
            <path
              d="M 0 50 Q 75 35, 150 45 T 250 50"
              stroke={`url(#cirrus-gradient-${cloud.id})`}
              strokeWidth="10"
              fill="none"
            />
          </svg>
        );
      
      case 'cumulonimbus':
        // Storm clouds
        return (
          <svg
            width="250"
            height="150"
            viewBox="0 0 250 150"
            style={{
              position: 'absolute',
              opacity: cloud.opacity,
              filter: 'blur(0.5px)'
            }}
          >
            <defs>
              <radialGradient id={`storm-gradient-${cloud.id}`}>
                <stop offset="0%" stopColor={shadow} stopOpacity="0.8" />
                <stop offset="50%" stopColor={base} stopOpacity="0.9" />
                <stop offset="100%" stopColor={shadow} stopOpacity="1" />
              </radialGradient>
            </defs>
            <ellipse cx="125" cy="50" rx="100" ry="40" fill={`url(#storm-gradient-${cloud.id})`} />
            <ellipse cx="75" cy="70" rx="60" ry="35" fill={`url(#storm-gradient-${cloud.id})`} />
            <ellipse cx="175" cy="70" rx="60" ry="35" fill={`url(#storm-gradient-${cloud.id})`} />
            <ellipse cx="125" cy="90" rx="80" ry="30" fill={`url(#storm-gradient-${cloud.id})`} />
            <rect x="75" y="90" width="100" height="40" fill={`url(#storm-gradient-${cloud.id})`} opacity="0.5" />
          </svg>
        );
    }
  };

  // Don't render if no weather data
  if (!weather || generateClouds.length === 0) return null;

  // Calculate opacity based on time of day
  const getTimeOpacity = () => {
    switch(timeOfDay) {
      case 'Night':
        return 0; // Invisible at night
      case 'Dawn':
      case 'Dusk':
        return 0.3; // Mostly transparent at dawn/dusk
      case 'Day':
      case 'Midday':
      default:
        return 1; // Full opacity during day
    }
  };

  const timeOpacity = getTimeOpacity();
  
  // Don't render at all if completely transparent
  if (timeOpacity === 0) return null;

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ 
        zIndex: 2,
        opacity: timeOpacity,
        transition: 'opacity 3s ease-in-out' // Smooth transition between times
      }}
    >
      {generateClouds.map(cloud => (
        <div
          key={cloud.id}
          className="cloud absolute"
          style={{
            transform: `translate(${cloud.x}px, ${cloud.y}px) scale(${cloud.scale})`,
            transition: windSpeed === 0 ? 'none' : undefined
          }}
        >
          {renderCloud(cloud)}
        </div>
      ))}
    </div>
  );
};

// Wrap the component with React.memo for performance
export default React.memo(CloudSystem, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.timeOfDay === nextProps.timeOfDay &&
    prevProps.weather?.precipitation === nextProps.weather?.precipitation &&
    prevProps.weather?.intensity === nextProps.weather?.intensity &&
    prevProps.weather?.special === nextProps.weather?.special &&
    prevProps.weather?.cloudCover === nextProps.weather?.cloudCover &&
    prevProps.windSpeed === nextProps.windSpeed
  );
});