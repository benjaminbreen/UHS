import React from 'react';
import { SpecialMapArchetype, SpecialMapConfig } from '../types/specialMapTypes';
import { HistoricalEra } from '../types';

interface InteriorHorizonProps {
  config: SpecialMapConfig;
  timeOfDay?: 'Dawn' | 'Day' | 'Dusk' | 'Night';
}

// Add float animation styles
const floatAnimationStyle = `
  @keyframes float {
    0% {
      transform: translateY(0px) translateX(0px);
      opacity: 0.3;
    }
    25% {
      transform: translateY(-20px) translateX(10px);
      opacity: 0.5;
    }
    50% {
      transform: translateY(-10px) translateX(-5px);
      opacity: 0.3;
    }
    75% {
      transform: translateY(-30px) translateX(5px);
      opacity: 0.5;
    }
    100% {
      transform: translateY(0px) translateX(0px);
      opacity: 0.3;
    }
  }
`;

const InteriorHorizon: React.FC<InteriorHorizonProps> = ({
  config,
  timeOfDay = 'Day'
}) => {
  // Safety check for undefined config
  if (!config) {
    console.warn('[InteriorHorizon] Config is undefined, using defaults');
    return <div className="w-full h-full" />;
  }
  
  const { archetype, culturalZone, era } = config;
  
  // Get ceiling/upper architecture based on archetype and culture
  const getCeilingElements = () => {
    switch (archetype) {
      case SpecialMapArchetype.PALACE_COMPLEX:
        if (culturalZone === 'EAST_ASIAN') {
          return (
            <>
              {/* Ornate wooden beams */}
              <div className="absolute top-0 left-0 right-0 h-32 opacity-60">
                <svg className="w-full h-full" viewBox="0 0 1200 128">
                  {[...Array(12)].map((_, i) => (
                    <rect
                      key={i}
                      x={i * 100}
                      y="0"
                      width="90"
                      height="20"
                      fill="#8B4513"
                      opacity="0.8"
                    />
                  ))}
                  {/* Decorative patterns */}
                  {[...Array(24)].map((_, i) => (
                    <circle
                      key={i}
                      cx={i * 50 + 25}
                      cy="40"
                      r="8"
                      fill="#FFD700"
                      opacity="0.5"
                    />
                  ))}
                </svg>
              </div>
              {/* Paper lanterns */}
              <div className="absolute top-20 left-0 right-0 flex justify-around">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-12 h-16 bg-red-600/30 rounded-full shadow-lg animate-pulse" />
                ))}
              </div>
            </>
          );
        } else if (culturalZone === 'EUROPEAN' && era === HistoricalEra.MEDIEVAL) {
          return (
            <>
              {/* Stone arches */}
              <div className="absolute top-0 left-0 right-0 h-40 opacity-70">
                <svg className="w-full h-full" viewBox="0 0 1200 160">
                  {[...Array(6)].map((_, i) => (
                    <path
                      key={i}
                      d={`M ${i * 200} 160 Q ${i * 200 + 100} 0 ${i * 200 + 200} 160`}
                      fill="none"
                      stroke="#4A5568"
                      strokeWidth="8"
                      opacity="0.6"
                    />
                  ))}
                </svg>
              </div>
              {/* Banners */}
              <div className="absolute top-10 left-0 right-0 flex justify-around">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-16 h-24 bg-purple-800/40 shadow-lg" />
                ))}
              </div>
            </>
          );
        }
        break;
        
      case SpecialMapArchetype.MARKET_BAZAAR:
        if (culturalZone === 'MENA') {
          return (
            <>
              {/* Canvas awnings */}
              <div className="absolute top-0 left-0 right-0 h-32 opacity-50">
                <div className="w-full h-full bg-gradient-to-b from-yellow-600/40 via-orange-500/30 to-transparent" />
              </div>
              {/* Hanging fabrics */}
              <div className="absolute top-0 left-0 right-0 flex justify-around">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="w-8 h-20 bg-gradient-to-b from-red-600/40 to-transparent"
                    style={{ transform: `rotate(${Math.sin(i) * 5}deg)` }}
                  />
                ))}
              </div>
            </>
          );
        }
        break;
        
      case SpecialMapArchetype.SACRED_COMPLEX:
        if (culturalZone === 'EUROPEAN') {
          return (
            <>
              {/* Stained glass windows */}
              <div className="absolute top-0 left-0 right-0 h-48 opacity-60">
                <div className="w-full h-full flex justify-around">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="relative w-32 h-40">
                      <div className="absolute inset-0 bg-gradient-to-b from-blue-600/50 via-purple-600/40 to-red-600/30 rounded-t-full" />
                      <div className="absolute inset-2 bg-gradient-to-b from-yellow-400/30 via-green-400/20 to-blue-400/30 rounded-t-full" />
                    </div>
                  ))}
                </div>
              </div>
              {/* Vaulted ceiling */}
              <svg className="absolute top-0 left-0 right-0 h-32 opacity-40" viewBox="0 0 1200 128">
                <path
                  d="M 0 128 Q 300 0 600 0 Q 900 0 1200 128"
                  fill="none"
                  stroke="#6B7280"
                  strokeWidth="4"
                />
              </svg>
            </>
          );
        } else if (culturalZone === 'MENA') {
          return (
            <>
              {/* Geometric dome patterns */}
              <div className="absolute top-0 left-0 right-0 h-40 opacity-50">
                <svg className="w-full h-full" viewBox="0 0 1200 160">
                  <defs>
                    <pattern id="islamic-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                      <polygon points="30,0 60,30 30,60 0,30" fill="none" stroke="#06B6D4" strokeWidth="1" />
                      <circle cx="30" cy="30" r="10" fill="none" stroke="#FFD700" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="1200" height="160" fill="url(#islamic-pattern)" opacity="0.4" />
                </svg>
              </div>
            </>
          );
        }
        break;
        
      default:
        // Generic ceiling
        return (
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-slate-700/30 to-transparent" />
        );
    }
    
    // Default fallback
    return (
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-slate-800/40 to-transparent" />
    );
  };
  
  // Apply lighting effects based on time of day
  const getLightingEffects = () => {
    if (timeOfDay === 'Night') {
      return (
        <>
          {/* Torch/candle light spots */}
          <div className="absolute top-0 left-0 right-0 h-48">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-pulse"
                style={{
                  left: `${(i + 1) * 15}%`,
                  top: '60px',
                  width: '80px',
                  height: '80px',
                  background: 'radial-gradient(circle, rgba(255,200,100,0.3) 0%, transparent 70%)',
                  filter: 'blur(20px)'
                }}
              />
            ))}
          </div>
        </>
      );
    }
    return null;
  };
  
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: floatAnimationStyle }} />
      <div className="absolute top-0 left-0 right-0 h-48 z-5 pointer-events-none">
        {getCeilingElements()}
        {getLightingEffects()}
        
        {/* Atmospheric dust particles (subtle) */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${10 + Math.random() * 10}s ease-in-out ${Math.random() * 10}s infinite`
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default InteriorHorizon;