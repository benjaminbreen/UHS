/**
 * FishRenderer.tsx - Species-specific visual rendering for fish
 * Creates anatomically accurate fish shapes with colors and patterns
 */

import React, { useMemo } from 'react';
import { FishSpecies } from '../services/fishingDataService';

interface FishRendererProps {
  species: FishSpecies;
  x: number;
  y: number;
  size: number;
  direction: number; // angle in radians
  isHooked?: boolean;
  opacity?: number;
}

export const FishRenderer: React.FC<FishRendererProps> = ({
  species,
  x,
  y,
  size,
  direction,
  isHooked = false,
  opacity = 1
}) => {
  // Calculate rotation in degrees for transform
  const rotation = (direction * 180) / Math.PI;
  
  // Generate unique pattern ID for this fish instance
  const patternId = useMemo(() => `pattern-${species.id}-${Math.random().toString(36).substr(2, 9)}`, [species.id]);
  
  // Dynamic lighting based on position and time
  const lightAngle = Math.sin(Date.now() / 2000) * 10;
  const specularIntensity = 0.3 + Math.sin(Date.now() / 1500) * 0.1;
  
  // Animated fin movement
  const finAngle = Math.sin(Date.now() * 0.01 * (species.speed || 0.5)) * 15;
  const tailAngle = Math.sin(Date.now() * 0.008 * (species.speed || 0.5)) * 20;
  
  // Determine fish body shape based on species characteristics
  const getFishBodyPath = (): string => {
    const length = size;
    const height = size * 0.35; // Default height ratio
    
    // Different body shapes based on species
    if (species.id === 'eel' || species.id === 'moray_eel') {
      // Elongated snake-like body
      return `
        M 0,0
        Q ${length * 0.3},${-height * 0.3} ${length * 0.6},${-height * 0.2}
        Q ${length * 0.9},${-height * 0.1} ${length},0
        Q ${length * 0.9},${height * 0.1} ${length * 0.6},${height * 0.2}
        Q ${length * 0.3},${height * 0.3} 0,0
      `;
    } else if (species.id === 'pufferfish' || species.id === 'sunfish') {
      // Round, inflated body
      const roundHeight = size * 0.5;
      return `
        M 0,0
        Q ${length * 0.2},${-roundHeight} ${length * 0.5},${-roundHeight}
        Q ${length * 0.8},${-roundHeight} ${length},0
        Q ${length * 0.8},${roundHeight} ${length * 0.5},${roundHeight}
        Q ${length * 0.2},${roundHeight} 0,0
      `;
    } else if (species.id === 'halibut' || species.id === 'flounder') {
      // Flat, wide body
      const flatHeight = size * 0.6;
      return `
        M 0,0
        Q ${length * 0.4},${-flatHeight} ${length * 0.7},${-flatHeight * 0.8}
        L ${length},0
        L ${length * 0.7},${flatHeight * 0.8}
        Q ${length * 0.4},${flatHeight} 0,0
      `;
    } else if (species.id === 'barracuda' || species.id === 'pike') {
      // Streamlined predator body
      return `
        M 0,0
        Q ${length * 0.15},${-height * 0.5} ${length * 0.4},${-height * 0.6}
        Q ${length * 0.7},${-height * 0.5} ${length * 0.95},${-height * 0.2}
        L ${length},0
        L ${length * 0.95},${height * 0.2}
        Q ${length * 0.7},${height * 0.5} ${length * 0.4},${height * 0.6}
        Q ${length * 0.15},${height * 0.5} 0,0
      `;
    } else if (species.id === 'grouper' || species.name.includes('Bass')) {
      // Thick, robust body
      const robustHeight = size * 0.45;
      return `
        M 0,0
        Q ${length * 0.25},${-robustHeight} ${length * 0.5},${-robustHeight * 0.9}
        Q ${length * 0.75},${-robustHeight * 0.8} ${length},0
        Q ${length * 0.75},${robustHeight * 0.8} ${length * 0.5},${robustHeight * 0.9}
        Q ${length * 0.25},${robustHeight} 0,0
      `;
    } else {
      // Default fish shape
      return `
        M 0,0
        Q ${length * 0.25},${-height} ${length * 0.5},${-height * 0.9}
        Q ${length * 0.75},${-height * 0.7} ${length},0
        Q ${length * 0.75},${height * 0.7} ${length * 0.5},${height * 0.9}
        Q ${length * 0.25},${height} 0,0
      `;
    }
  };

  // Generate tail fin shape
  const getTailFinPath = (): string => {
    const length = size;
    const tailWidth = size * 0.3;
    const tailHeight = size * 0.4;
    
    if (species.id === 'tuna' || species.id === 'mackerel') {
      // Crescent moon tail (fast swimmers)
      return `
        M ${length},0
        Q ${length + tailWidth * 0.5},${-tailHeight} ${length + tailWidth},${-tailHeight * 0.8}
        L ${length + tailWidth * 0.7},${-tailHeight * 0.2}
        L ${length + tailWidth * 0.7},${tailHeight * 0.2}
        L ${length + tailWidth},${tailHeight * 0.8}
        Q ${length + tailWidth * 0.5},${tailHeight} ${length},0
      `;
    } else if (species.id === 'eel' || species.id === 'moray_eel') {
      // Continuous fin tail
      return `
        M ${length},0
        Q ${length + tailWidth * 0.3},${-tailHeight * 0.5} ${length + tailWidth * 0.6},${-tailHeight * 0.3}
        L ${length + tailWidth * 0.6},${tailHeight * 0.3}
        Q ${length + tailWidth * 0.3},${tailHeight * 0.5} ${length},0
      `;
    } else {
      // Standard forked tail
      return `
        M ${length},0
        L ${length + tailWidth},${-tailHeight}
        L ${length + tailWidth * 0.6},${-tailHeight * 0.3}
        L ${length + tailWidth * 0.6},${tailHeight * 0.3}
        L ${length + tailWidth},${tailHeight}
        Z
      `;
    }
  };

  // Generate dorsal fin
  const getDorsalFinPath = (): string => {
    const length = size;
    const finHeight = size * 0.25;
    
    if (species.id === 'sailfish' || species.id === 'marlin') {
      // Large sail-like dorsal
      return `
        M ${length * 0.2},0
        Q ${length * 0.3},${-finHeight * 1.5} ${length * 0.4},${-finHeight * 1.8}
        L ${length * 0.7},${-finHeight * 1.6}
        Q ${length * 0.8},${-finHeight * 1.2} ${length * 0.85},${-finHeight * 0.5}
        L ${length * 0.2},0
      `;
    } else if (species.id === 'shark') {
      // Triangular shark fin
      return `
        M ${length * 0.4},0
        L ${length * 0.45},${-finHeight * 1.2}
        L ${length * 0.55},${-finHeight * 0.3}
        Z
      `;
    } else {
      // Standard dorsal fin
      return `
        M ${length * 0.35},0
        Q ${length * 0.4},${-finHeight} ${length * 0.5},${-finHeight * 0.8}
        L ${length * 0.65},${-finHeight * 0.6}
        Q ${length * 0.7},${-finHeight * 0.3} ${length * 0.7},0
      `;
    }
  };

  // Generate pectoral fins
  const getPectoralFinPath = (): string => {
    const length = size;
    const finWidth = size * 0.15;
    const finLength = size * 0.2;
    
    return `
      M ${length * 0.25},${size * 0.1}
      Q ${length * 0.25 + finLength},${size * 0.1 + finWidth} ${length * 0.25 + finLength * 1.2},${size * 0.1 + finWidth * 0.5}
      L ${length * 0.25},${size * 0.1}
    `;
  };

  // Create pattern definitions
  const renderPattern = () => {
    if (!species.pattern || species.pattern === 'none') return null;
    
    const patternColor = species.patternColor || '#000000';
    
    switch (species.pattern) {
      case 'striped':
        return (
          <pattern id={patternId} patternUnits="userSpaceOnUse" width="8" height="8">
            <rect width="8" height="2" fill={patternColor} opacity="0.3" />
          </pattern>
        );
      case 'spotted':
        return (
          <pattern id={patternId} patternUnits="userSpaceOnUse" width="10" height="10">
            <circle cx="2" cy="2" r="1.5" fill={patternColor} opacity="0.4" />
            <circle cx="7" cy="7" r="1.5" fill={patternColor} opacity="0.4" />
          </pattern>
        );
      case 'mottled':
        return (
          <pattern id={patternId} patternUnits="userSpaceOnUse" width="15" height="15">
            <ellipse cx="5" cy="5" rx="3" ry="2" fill={patternColor} opacity="0.3" transform="rotate(45 5 5)" />
            <ellipse cx="12" cy="10" rx="2" ry="3" fill={patternColor} opacity="0.3" transform="rotate(-30 12 10)" />
          </pattern>
        );
      default:
        return null;
    }
  };

  const bodyPath = getFishBodyPath();
  const tailPath = getTailFinPath();
  const dorsalPath = getDorsalFinPath();
  const pectoralPath = getPectoralFinPath();

  return (
    <g
      transform={`translate(${x},${y}) rotate(${rotation})`}
      opacity={opacity}
      className={isHooked ? 'fish-hooked' : ''}
    >
      <defs>
        {renderPattern()}
        {/* Gradient for body shading */}
        <linearGradient id={`body-gradient-${species.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={species.secondaryColor || species.color} stopOpacity="1" />
          <stop offset="50%" stopColor={species.color} stopOpacity="1" />
          <stop offset="100%" stopColor={species.bellyColor || '#FFFFFF'} stopOpacity="1" />
        </linearGradient>
        
        {/* Specular highlight gradient */}
        <radialGradient id={`specular-${species.id}`} cx="30%" cy="30%">
          <stop offset="0%" stopColor="white" stopOpacity={specularIntensity} />
          <stop offset="50%" stopColor="white" stopOpacity={specularIntensity * 0.5} />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        
        {/* Scale shimmer effect */}
        <linearGradient id={`shimmer-${species.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset={`${45 + lightAngle}%`} stopColor="white" stopOpacity="0.4" />
          <stop offset={`${50 + lightAngle}%`} stopColor="white" stopOpacity="0.6" />
          <stop offset={`${55 + lightAngle}%`} stopColor="white" stopOpacity="0.4" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
      
      {/* Shadow */}
      <ellipse
        cx={size / 2}
        cy={size * 0.15}
        rx={size * 0.4}
        ry={size * 0.1}
        fill="black"
        opacity="0.2"
        filter="blur(2px)"
      />
      
      {/* Tail fin with animation */}
      <g transform={`rotate(${tailAngle} ${size} 0)`}>
        <path
          d={tailPath}
          fill={species.secondaryColor || species.color}
          opacity="0.8"
        />
      </g>
      
      {/* Pectoral fins with animation (both sides) */}
      <g transform={`rotate(${finAngle} ${size * 0.25} ${size * 0.1})`}>
        <path
          d={pectoralPath}
          fill={species.secondaryColor || species.color}
          opacity="0.7"
        />
      </g>
      <g transform={`rotate(${-finAngle} ${size * 0.25} ${-size * 0.1}) scale(1,-1)`}>
        <path
          d={pectoralPath}
          fill={species.secondaryColor || species.color}
          opacity="0.7"
        />
      </g>
      
      {/* Main body */}
      <path
        d={bodyPath}
        fill={`url(#body-gradient-${species.id})`}
        stroke={species.color}
        strokeWidth="0.5"
      />
      
      {/* Scale shimmer overlay */}
      <path
        d={bodyPath}
        fill={`url(#shimmer-${species.id})`}
        opacity="0.4"
      />
      
      {/* Specular highlight */}
      <ellipse
        cx={size * 0.35}
        cy={-size * 0.05}
        rx={size * 0.15}
        ry={size * 0.08}
        fill={`url(#specular-${species.id})`}
      />
      
      {/* Pattern overlay */}
      {species.pattern && species.pattern !== 'none' && (
        <path
          d={bodyPath}
          fill={`url(#${patternId})`}
        />
      )}
      
      {/* Dorsal fin with subtle movement */}
      <g transform={`rotate(${finAngle * 0.3} ${size * 0.5} ${-size * 0.1})`}>
        <path
          d={dorsalPath}
          fill={species.secondaryColor || species.color}
          opacity="0.8"
        />
      </g>
      
      {/* Eye */}
      <circle
        cx={size * 0.15}
        cy={-size * 0.05}
        r={size * 0.03}
        fill="black"
      />
      <circle
        cx={size * 0.15}
        cy={-size * 0.05}
        r={size * 0.015}
        fill="white"
      />
      
      {/* Mouth/Gills detail */}
      <path
        d={`M ${size * 0.05},0 Q ${size * 0.08},${size * 0.02} ${size * 0.1},0`}
        stroke="black"
        strokeWidth="0.5"
        fill="none"
        opacity="0.4"
      />
      
      {/* Gill slits */}
      <line
        x1={size * 0.22}
        y1={-size * 0.08}
        x2={size * 0.22}
        y2={size * 0.08}
        stroke="black"
        strokeWidth="0.3"
        opacity="0.3"
      />
      <line
        x1={size * 0.25}
        y1={-size * 0.08}
        x2={size * 0.25}
        y2={size * 0.08}
        stroke="black"
        strokeWidth="0.3"
        opacity="0.3"
      />
      
      {/* Hooked indicator */}
      {isHooked && (
        <>
          <circle
            cx={size * 0.08}
            cy={0}
            r={size * 0.05}
            fill="red"
            opacity="0.6"
            className="pulse"
          />
          <text
            x={size * 0.08}
            y={-size * 0.15}
            fontSize={size * 0.15}
            fill="red"
            textAnchor="middle"
            fontWeight="bold"
          >
            !
          </text>
        </>
      )}
    </g>
  );
};