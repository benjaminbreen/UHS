/**
 * components/WeatherEffects.tsx - Dynamic weather particle effects
 * Performant CSS-based animations for rain, snow, and atmospheric effects
 */

import React, { useMemo, useEffect, useRef } from 'react';
import { WeatherState } from '../services/weatherService';

interface WeatherEffectsProps {
  weather: WeatherState;
  width?: number;
  height?: number;
}

// Particle pool to avoid garbage collection
class ParticlePool {
  private particles: HTMLDivElement[] = [];
  private activeCount = 0;
  
  constructor(private maxParticles: number, private className: string) {}
  
  init(container: HTMLElement) {
    // Create particle pool
    for (let i = 0; i < this.maxParticles; i++) {
      const particle = document.createElement('div');
      particle.className = this.className;
      particle.style.position = 'absolute';
      particle.style.pointerEvents = 'none';
      particle.style.display = 'none';
      container.appendChild(particle);
      this.particles.push(particle);
    }
  }
  
  activate(count: number, configureFn: (particle: HTMLDivElement, index: number) => void) {
    const toActivate = Math.min(count, this.maxParticles);
    
    // Activate particles
    for (let i = 0; i < toActivate; i++) {
      const particle = this.particles[i];
      configureFn(particle, i);
      particle.style.display = 'block';
    }
    
    // Deactivate unused particles
    for (let i = toActivate; i < this.activeCount; i++) {
      this.particles[i].style.display = 'none';
    }
    
    this.activeCount = toActivate;
  }
  
  cleanup() {
    this.particles.forEach(p => p.remove());
    this.particles = [];
    this.activeCount = 0;
  }
}

const WeatherEffects: React.FC<WeatherEffectsProps> = ({ 
  weather, 
  width = window.innerWidth, 
  height = window.innerHeight 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rainPoolRef = useRef<ParticlePool | null>(null);
  const snowPoolRef = useRef<ParticlePool | null>(null);
  
  // Initialize particle pools
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Create pools
    rainPoolRef.current = new ParticlePool(150, 'rain-particle');
    snowPoolRef.current = new ParticlePool(100, 'snow-particle');
    
    // Initialize pools
    rainPoolRef.current.init(containerRef.current);
    snowPoolRef.current.init(containerRef.current);
    
    return () => {
      rainPoolRef.current?.cleanup();
      snowPoolRef.current?.cleanup();
    };
  }, []);
  
  // Update particles based on weather
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Rain particles
    if (weather.precipitation === 'rain' || weather.precipitation === 'drizzle') {
      const particleCount = Math.floor(
        weather.intensity * (weather.precipitation === 'rain' ? 150 : 50)
      );
      
      rainPoolRef.current?.activate(particleCount, (particle, i) => {
        const x = Math.random() * width;
        const delay = Math.random() * 5; // Increased from 2
        const duration = 2.5 + Math.random() * 1.5; // Much slower: 2.5-4s instead of 0.5-1s
        const windOffset = weather.windSpeed * 2;
        
        particle.style.left = `${x}px`;
        particle.style.top = '-20px';
        particle.style.width = weather.precipitation === 'rain' ? '2px' : '1px';
        particle.style.height = weather.precipitation === 'rain' ? '15px' : '8px';
        particle.style.background = 'linear-gradient(to bottom, transparent, rgba(150, 180, 220, 0.6))';
        particle.style.animation = `rain-fall ${duration}s linear ${delay}s infinite`;
        particle.style.transform = `rotate(${windOffset}deg)`;
      });
    } else {
      rainPoolRef.current?.activate(0, () => {});
    }
    
    // Snow particles
    if (weather.precipitation === 'snow') {
      const particleCount = Math.floor(weather.intensity * 100);
      
      snowPoolRef.current?.activate(particleCount, (particle, i) => {
        const x = Math.random() * width;
        const size = 2 + Math.random() * 4;
        const delay = Math.random() * 10; // Increased from 5
        const duration = 8 + Math.random() * 4; // Much slower: 8-12s instead of 3-5s
        const drift = -20 + Math.random() * 40 + weather.windSpeed;
        
        particle.style.left = `${x}px`;
        particle.style.top = '-20px';
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.borderRadius = '50%';
        particle.style.background = 'rgba(255, 255, 255, 0.8)';
        particle.style.boxShadow = '0 0 2px rgba(255, 255, 255, 0.5)';
        particle.style.animation = `snow-fall ${duration}s linear ${delay}s infinite`;
        particle.style.setProperty('--drift', `${drift}px`);
      });
    } else {
      snowPoolRef.current?.activate(0, () => {});
    }
  }, [weather, width, height]);
  
  // Fog effect
  const fogLayers = useMemo(() => {
    if (weather.special !== 'fog' && weather.special !== 'mist') return null;
    
    const opacity = weather.special === 'fog' ? 0.6 : 0.3;
    const layers = weather.special === 'fog' ? 3 : 2;
    
    return Array.from({ length: layers }, (_, i) => ({
      opacity: opacity * (1 - i * 0.2),
      animationDuration: `${20 + i * 10}s`,
      animationDelay: `${i * 2}s`
    }));
  }, [weather.special]);
  
  // Rainbow effect
  const showRainbow = weather.special === 'rainbow';
  
  return (
    <>
      {/* Weather particles container */}
      <div 
        ref={containerRef}
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: 3 }}
      />
      
      {/* Fog layers */}
      {fogLayers && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }}>
          {fogLayers.map((layer, i) => (
            <div
              key={`fog-${i}`}
              className="absolute inset-0"
              style={{
                background: `radial-gradient(ellipse at center, 
                  rgba(200, 200, 200, ${layer.opacity}) 0%, 
                  rgba(200, 200, 200, ${layer.opacity * 0.5}) 50%, 
                  transparent 100%)`,
                animation: `fog-drift ${layer.animationDuration} ease-in-out ${layer.animationDelay} infinite alternate`,
                transform: 'scale(1.2)'
              }}
            />
          ))}
        </div>
      )}
      
      {/* Rainbow */}
      {showRainbow && (
        <div 
          className="absolute pointer-events-none"
          style={{
            top: '20%',
            right: '10%',
            width: '400px',
            height: '200px',
            zIndex: 2
          }}
        >
          <svg width="100%" height="100%" viewBox="0 0 400 200">
            <defs>
              <linearGradient id="rainbow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255, 0, 0, 0.4)" />
                <stop offset="16.66%" stopColor="rgba(255, 127, 0, 0.4)" />
                <stop offset="33.33%" stopColor="rgba(255, 255, 0, 0.4)" />
                <stop offset="50%" stopColor="rgba(0, 255, 0, 0.4)" />
                <stop offset="66.66%" stopColor="rgba(0, 0, 255, 0.4)" />
                <stop offset="83.33%" stopColor="rgba(75, 0, 130, 0.4)" />
                <stop offset="100%" stopColor="rgba(148, 0, 211, 0.4)" />
              </linearGradient>
            </defs>
            <path
              d="M 50 200 A 150 150 0 0 1 350 200"
              stroke="url(#rainbow-gradient)"
              strokeWidth="20"
              fill="none"
              opacity="0.6"
            />
            <path
              d="M 70 200 A 130 130 0 0 1 330 200"
              stroke="url(#rainbow-gradient)"
              strokeWidth="15"
              fill="none"
              opacity="0.4"
            />
          </svg>
        </div>
      )}
      
      {/* CSS animations */}
      <style jsx="true">{`
        @keyframes rain-fall {
          to {
            transform: translateY(${height + 20}px) translateX(var(--wind-offset, 0));
          }
        }
        
        @keyframes snow-fall {
          to {
            transform: translateY(${height + 20}px) translateX(var(--drift, 0));
          }
        }
        
        @keyframes fog-drift {
          0% {
            transform: translateX(-10%) scale(1.2);
          }
          100% {
            transform: translateX(10%) scale(1.2);
          }
        }
      `}</style>
    </>
  );
};

export default WeatherEffects;