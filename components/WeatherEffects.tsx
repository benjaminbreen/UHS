/**
 * components/WeatherEffects.tsx - Dynamic weather particle & atmosphere effects
 * High-performance CSS animations integrated with WeatherService.fx and CloudSystem
 *
 * Features:
 *  - Rain/drizzle with droplet sizing (fx.dropletSize), lens-sheen, gust lines
 *  - Snow with flake sizing (fx.flakeSize), sway & spin, visibility-aware density
 *  - Seasonal petals (spring): cherry (temperate/cold/med) & jacaranda (semitropical) via fx.blossoms
 *  - Autumn leaves (fall): in temperate/med/cold only, via fx.leavesActivity (+ fx.leafPalette)
 *  - Airborne particles: dust/sand/pollen via fx.airborneParticles
 *  - Fog/mist/haze layering using fx.fogDensity / fx.hazeDensity + special
 *  - Frost sparkle field (special === 'frost')
 *  - Rainbow (special === 'rainbow' or fx.rainbowProbability)
 *  - Puddle ripples using fx.surfaceWetnessNow (snapshot)
 *  - Lightning flash frequency scaled by fx.lightningProbability
 *  - Fireflies (summer nights) via fx.fireflyProbability
 *  - Aurora (rare winter nights, cold climates) via fx.auroraProbability
 */

import React, { useMemo, useEffect, useRef } from 'react';
import { WeatherState } from '../services/weatherService';

interface WeatherEffectsProps {
  weather: WeatherState;
  width?: number;
  height?: number;
}

/** Keep this in sync with services/weatherService.ts */
const WINDY_KMH = 18;

// Particle pool to avoid garbage collection
class ParticlePool {
  private particles: HTMLDivElement[] = [];
  private activeCount = 0;

  constructor(private maxParticles: number, private className: string) {}

  init(container: HTMLElement) {
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
    for (let i = 0; i < toActivate; i++) {
      const p = this.particles[i];
      configureFn(p, i);
      p.style.display = 'block';
    }
    for (let i = toActivate; i < this.activeCount; i++) {
      this.particles[i].style.display = 'none';
    }
    this.activeCount = toActivate;
  }

  cleanup() {
    this.particles.forEach((p) => p.remove());
    this.particles = [];
    this.activeCount = 0;
  }
}

const WeatherEffects: React.FC<WeatherEffectsProps> = ({
  weather,
  width = typeof window !== 'undefined' ? window.innerWidth : 1920,
  height = typeof window !== 'undefined' ? window.innerHeight : 1080
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Pools
  const rainPoolRef = useRef<ParticlePool | null>(null);
  const snowPoolRef = useRef<ParticlePool | null>(null);
  const leafPoolRef = useRef<ParticlePool | null>(null);
  const blossomPoolRef = useRef<ParticlePool | null>(null);
  const airPoolRef = useRef<ParticlePool | null>(null);
  const fireflyPoolRef = useRef<ParticlePool | null>(null);

  // Throttle particle updates (performance optimization)
  const lastUpdateRef = useRef<number>(0);
  const THROTTLE_MS = 250; // Update particles max every 250ms

  // Shorthands / safe fallbacks
  const fx = weather.fx;
  const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));

  // Initialize pools once (reduced rain particles for performance)
  useEffect(() => {
    if (!containerRef.current) return;
    rainPoolRef.current = new ParticlePool(80, 'rain-particle'); // Further reduced for performance
    snowPoolRef.current = new ParticlePool(180, 'snow-particle');
    leafPoolRef.current = new ParticlePool(140, 'leaf-particle');
    blossomPoolRef.current = new ParticlePool(160, 'petal-particle');
    airPoolRef.current = new ParticlePool(160, 'air-particle');
    fireflyPoolRef.current = new ParticlePool(120, 'firefly-particle');

    rainPoolRef.current.init(containerRef.current);
    snowPoolRef.current.init(containerRef.current);
    leafPoolRef.current.init(containerRef.current);
    blossomPoolRef.current.init(containerRef.current);
    airPoolRef.current.init(containerRef.current);
    fireflyPoolRef.current.init(containerRef.current);

    return () => {
      rainPoolRef.current?.cleanup();
      snowPoolRef.current?.cleanup();
      leafPoolRef.current?.cleanup();
      blossomPoolRef.current?.cleanup();
      airPoolRef.current?.cleanup();
      fireflyPoolRef.current?.cleanup();
    };
  }, []);

  // Update particles whenever weather/size changes (with throttling)
  useEffect(() => {
    if (!containerRef.current) return;

    // Throttle updates for performance during heavy rain
    const now = Date.now();
    if (now - lastUpdateRef.current < THROTTLE_MS) {
      return;
    }
    lastUpdateRef.current = now;

    const wind = weather.windSpeed ?? 0;
    const windDir = weather.windDirection ?? 0;
    const windX = Math.cos((windDir * Math.PI) / 180) * wind;
    const windShear = Math.min(160, Math.max(-160, windX * 6));
    const intensity = clamp(weather.intensity ?? 0);
    const visible = (weather.visibility ?? 1);

    /* --------------------------- RAIN / DRIZZLE --------------------------- */
    if (weather.precipitation === 'rain' || weather.precipitation === 'drizzle') {
      const sizeFactor = fx?.dropletSize ?? (weather.precipitation === 'drizzle' ? 0.25 : 0.7);
      // Reduced base counts for better performance
      const base = weather.precipitation === 'rain' ? 70 : 50;
      const count = Math.floor(intensity * base);

      rainPoolRef.current?.activate(count, (particle) => {
        const x = Math.random() * width;
        const startY = -20 - Math.random() * 80;
        const dropW = clamp(0.8 + sizeFactor * 2, 0.8, 3);
        const dropH = clamp(8 + sizeFactor * 16, 8, 24);
        const duration = 1.2 + Math.random() * 1.4;
        const delay = Math.random() * 3.0;

        particle.style.setProperty('--fall-y', `${height + 50}px`);
        particle.style.setProperty('--wind-offset', `${windShear.toFixed(1)}px`);
        particle.style.left = `${x}px`;
        particle.style.top = `${startY}px`;
        particle.style.width = `${dropW}px`;
        particle.style.height = `${dropH}px`;
        particle.style.borderRadius = '2px';
        particle.style.background =
          'linear-gradient(to bottom, rgba(185,205,240,0.08), rgba(155,185,230,0.8))';
        particle.style.opacity = String(0.6 + Math.random() * 0.4);
        // Removed expensive rain-tilt animation for performance
        particle.style.animation = `rain-fall ${duration}s linear ${delay}s infinite`;
        const visualTilt = Math.max(-16, Math.min(16, windX * 0.6));
        particle.style.transform = `rotate(${visualTilt}deg) translateZ(0)`;
        // Removed box shadow for better performance
      });
    } else {
      rainPoolRef.current?.activate(0, () => {});
    }

    /* -------------------------------- SNOW ------------------------------- */
    if (weather.precipitation === 'snow') {
      const flakeK = fx?.flakeSize ?? (0.3 + intensity * 0.7);
      const count = Math.floor(intensity * 150 * clamp(visible)); // fewer when visibility is low

      snowPoolRef.current?.activate(count, (particle) => {
        const x = Math.random() * width;
        const startY = -20 - Math.random() * 60;
        const size = clamp(1 + flakeK * 3, 1, 4.5);
        const duration = 9 + Math.random() * 6;
        const delay = Math.random() * 9;
        const sway = Math.min(28, 10 + Math.abs(windX) * 1.2);
        const spin = Math.random() < 0.5;

        particle.style.setProperty('--fall-y', `${height + 40}px`);
        particle.style.setProperty('--drift', `${(windX * 2.8).toFixed(1)}px`);
        particle.style.setProperty('--sway', `${sway.toFixed(1)}px`);
        particle.style.setProperty('--spinDir', spin ? '1' : '-1');
        particle.style.left = `${x}px`;
        particle.style.top = `${startY}px`;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.borderRadius = '50%';
        particle.style.background = 'rgba(255,255,255,0.95)';
        particle.style.boxShadow = '0 0 2px rgba(255,255,255,0.55)';
        particle.style.animation = `snow-fall ${duration}s linear ${delay}s infinite, snow-sway ${
          5 + Math.random() * 3
        }s ease-in-out ${Math.random().toFixed(2)}s infinite alternate, snow-spin ${
          14 + Math.random() * 10
        }s linear ${Math.random() * 6}s infinite`;
      });
    } else {
      snowPoolRef.current?.activate(0, () => {});
    }

    /* --------------------------- BLOSSOMS (SPRING) ------------------------ */
    const blossoms = fx?.blossoms; // defined by WeatherService only when appropriate
    const showBlossoms =
      !!blossoms &&
      (weather.precipitation === 'none') &&
      visible > 0.5 &&
      (weather.windSpeed ?? 0) >= WINDY_KMH &&
      (blossoms.activity ?? 0) > 0.05;

    if (showBlossoms && blossoms) {
      const { activity, palette, sizeRange } = blossoms;
      const count = Math.min(160, Math.floor(activity * 160));

      blossomPoolRef.current?.activate(count, (particle) => {
        const x = Math.random() * width;
        const startY = Math.random() * (height * 0.28) - 60;
        const size = (sizeRange ? (sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0])) : (3 + Math.random() * 4));
        const w = size + (Math.random() * 2);
        const h = size * (0.6 + Math.random() * 0.5);
        const dx = windX * (16 + Math.random() * 18) + (Math.random() * 200 - 100);
        const dy = height + 80 + Math.random() * 160;
        const dur = 7 + Math.random() * 4;
        const delay = Math.random() * 2.5;

        particle.style.setProperty('--petal-dx', `${dx}px`);
        particle.style.setProperty('--petal-dy', `${dy}px`);
        particle.style.setProperty('--petal-dx-half', `${dx * 0.55}px`);
        particle.style.setProperty('--petal-dy-half', `${dy * 0.55}px`);
        particle.style.setProperty('--petal-rotMid', `${(Math.random() * 220 - 110).toFixed(1)}deg`);
        particle.style.setProperty('--petal-rotEnd', `${(Math.random() * 480 - 240).toFixed(1)}deg`);
        particle.style.left = `${x}px`;
        particle.style.top = `${startY}px`;
        particle.style.width = `${w}px`;
        particle.style.height = `${h}px`;
        particle.style.borderRadius = '45% 55% 50% 50% / 55% 45% 55% 45%';

        const col = palette[(Math.random() * palette.length) | 0];
        particle.style.background = `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.6), ${col})`;
        particle.style.boxShadow = '0 0 1px rgba(0,0,0,0.12)';
        particle.style.opacity = String(0.8 + Math.random() * 0.2);
        particle.style.animation = `petal-move ${dur}s ease-in ${delay}s infinite`;
      });
    } else {
      blossomPoolRef.current?.activate(0, () => {});
    }

    /* ----------------------- LEAVES (AUTUMN ONLY) ------------------------- */
    const leavesActivity = fx?.leavesActivity ?? 0;
    const showLeaves =
      (weather.windSpeed ?? 0) >= WINDY_KMH &&
      leavesActivity > 0.05 &&
      weather.precipitation === 'none' &&
      visible > 0.5;

    if (showLeaves) {
      const count = Math.min(140, Math.floor(leavesActivity * 140));
      const leafPalette = fx?.leafPalette ?? ['#C43E2F', '#E07A2E', '#E3A018', '#9E6A3A', '#7A4F2C', '#B26E5D'];

      leafPoolRef.current?.activate(count, (particle) => {
        const x = Math.random() * width;
        const startY = Math.random() * (height * 0.25) - 60;
        const w = 6 + Math.random() * 8;
        const h = 3 + Math.random() * 5;
        const dx = windX * (14 + Math.random() * 18) + (Math.random() * 180 - 90);
        const dy = height + 60 + Math.random() * 140;
        const dur = 6.5 + Math.random() * 4.5;
        const delay = Math.random() * 3;

        particle.style.setProperty('--leaf-dx', `${dx}px`);
        particle.style.setProperty('--leaf-dy', `${dy}px`);
        particle.style.setProperty('--leaf-dx-half', `${dx * 0.55}px`);
        particle.style.setProperty('--leaf-dy-half', `${dy * 0.55}px`);
        particle.style.setProperty('--leaf-rotMid', `${(Math.random() * 260 - 130).toFixed(1)}deg`);
        particle.style.setProperty('--leaf-rotEnd', `${(Math.random() * 540 - 270).toFixed(1)}deg`);

        particle.style.left = `${x}px`;
        particle.style.top = `${startY}px`;
        particle.style.width = `${w}px`;
        particle.style.height = `${h}px`;
        particle.style.borderRadius = '40% 60% 50% 50% / 50% 40% 60% 50%';
        const col = leafPalette[(Math.random() * leafPalette.length) | 0];
        particle.style.background = `linear-gradient(135deg, ${col}, rgba(0,0,0,0.25))`;
        particle.style.boxShadow = '0 0 1px rgba(0,0,0,0.25)';
        particle.style.opacity = String(0.75 + Math.random() * 0.25);
        particle.style.animation = `leaf-move ${dur}s ease-in ${delay}s infinite`;
      });
    } else {
      leafPoolRef.current?.activate(0, () => {});
    }

    /* ------------------- AIRBORNE PARTICLES (dust/pollen) ----------------- */
    const ap = fx?.airborneParticles;
    const showDust = ap && (ap.type === 'dust' || ap.type === 'sand');
    const showPollen = ap && ap.type === 'pollen';
    if ((showDust || showPollen) && weather.precipitation === 'none') {
      const count = Math.floor((ap!.density ?? 0.4) * 120);
      airPoolRef.current?.activate(count, (particle) => {
        const x = Math.random() * width;
        const baseY = height * (showDust ? (0.08 + Math.random() * 0.5) : (0.15 + Math.random() * 0.5));
        const dx = showDust ? windX * (8 + Math.random() * 18) : (Math.random() * 40 - 20);
        const dy = showDust ? (10 + Math.random() * 40) : -(30 + Math.random() * 60);
        const size = showDust ? 0.8 + Math.random() * 1.6 : 1 + Math.random() * 2;
        const dur = showDust ? 7 + Math.random() * 5 : 9 + Math.random() * 6;
        const delay = Math.random() * 3.5;

        particle.style.setProperty('--air-dx', `${dx.toFixed(1)}px`);
        particle.style.setProperty('--air-dy', `${dy.toFixed(1)}px`);
        particle.style.left = `${x}px`;
        particle.style.top = `${baseY}px`;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.borderRadius = '50%';
        particle.style.background = showDust ? 'rgba(194, 164, 120, 0.75)' : 'rgba(230, 240, 150, 0.9)';
        particle.style.boxShadow = showDust
          ? '0 0 1px rgba(194,164,120,0.6)'
          : '0 0 2px rgba(230,240,150,0.6)';
        particle.style.opacity = String(showDust ? (0.35 + Math.random() * 0.3) : (0.55 + Math.random() * 0.35));
        particle.style.animation = `air-drift ${dur}s ease-in-out ${delay}s infinite`;
      });
    } else {
      airPoolRef.current?.activate(0, () => {});
    }

    /* ------------------------ FIREFLIES (summer nights) ------------------- */
    const fireflyProb = fx?.fireflyProbability ?? 0;
    const showFireflies = fireflyProb > 0 && (weather.precipitation === 'none');
    if (showFireflies) {
      const count = Math.floor(clamp(fireflyProb, 0.05, 1) * 120);
      fireflyPoolRef.current?.activate(count, (particle, i) => {
        const x = (i * 97) % width;
        const y = height * (0.6 + Math.random() * 0.35);
        const size = 1 + (i % 3);
        const dur = 6 + Math.random() * 6;
        const delay = Math.random() * 4;

        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.borderRadius = '50%';
        particle.style.background = 'rgba(255, 255, 170, 0.9)';
        particle.style.boxShadow = '0 0 6px rgba(255,255,170,0.9), 0 0 10px rgba(255,255,170,0.6)';
        particle.style.opacity = '0';
        particle.style.animation = `firefly-float ${dur}s ease-in-out ${delay}s infinite, firefly-twinkle ${
          2 + Math.random() * 2
        }s ease-in-out ${Math.random() * 2}s infinite`;
      });
    } else {
      fireflyPoolRef.current?.activate(0, () => {});
    }
  }, [weather, width, height]);

  /* ---------------- Fog / Mist / Haze layering (derived) ----------------- */
  const fogLayers = useMemo(() => {
    const fogDensity = weather.fx?.fogDensity ?? 0;
    const hazeDensity = weather.fx?.hazeDensity ?? 0;
    const isFog = weather.special === 'fog' || fogDensity > 0.05;
    const isMist = weather.special === 'mist' || (hazeDensity > 0.1 && !isFog);

    const layers =
      isFog ? (fogDensity > 0.5 ? 3 : 2) :
      isMist ? 1 : 0;

    if (layers === 0) return null;

    return Array.from({ length: layers }, (_, i) => ({
      opacity: isFog
        ? fogDensity * (1 - i * 0.22)
        : hazeDensity * (0.22 + (i === 0 ? 0.15 : 0.08)),
      duration: 24 + i * 10,
      delay: i * 1.4,
      scale: 1.15 + i * 0.05
    }));
  }, [weather.special, weather.fx?.fogDensity, weather.fx?.hazeDensity]);

  /* ----------------------------- Overlays -------------------------------- */
  const showHeat = weather.special === 'heatwave' || (weather.fx?.heatShimmer ?? 0) > 0.15;
  const showRainbow = weather.special === 'rainbow' || (weather.fx?.rainbowProbability ?? 0) > 0.55;
  const showFrost = weather.special === 'frost';
  const lightningProb = weather.fx?.lightningProbability ?? 0;
  const showLightning = (weather.precipitation === 'rain' || weather.precipitation === 'drizzle') && lightningProb > 0.2;
  const showGusts = (weather.windSpeed ?? 0) >= WINDY_KMH && (weather.precipitation === 'rain' || weather.precipitation === 'drizzle');

  const wetness = Math.max(0, Math.min(1, weather.fx?.surfaceWetnessNow ?? 0));
  const showPuddles = wetness > 0.35;

  const auroraProb = weather.fx?.auroraProbability ?? 0;
  const showAurora = auroraProb > 0 && (weather.precipitation === 'none') && (weather.cloudCover ?? 1) < 0.35;

  return (
    <>
      {/* Particle container */}
      <div
        ref={containerRef}
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: 3 }}
      />

      {/* Lens sheen for heavier rain - simplified for performance */}
      {(weather.precipitation === 'rain' || weather.precipitation === 'drizzle') && (weather.intensity ?? 0) > 0.7 && (
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 3,
            opacity: Math.min(0.25, (weather.intensity ?? 0) * 0.35),
            background:
              'repeating-linear-gradient( -14deg, rgba(220,230,255,0.04), rgba(220,230,255,0.04) 2px, rgba(220,230,255,0.0) 4px )'
          }}
        />
      )}

      {/* Wind gust lines behind rain */}
      {showGusts && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 3 }}>
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={`gust-${i}`}
              className="absolute"
              style={{
                left: `${(i * 137) % width}px`,
                top: `${((i * 97) % (height * 0.6)) + height * 0.1}px`,
                width: '28vw',
                maxWidth: '420px',
                height: '2px',
                background:
                  'linear-gradient(90deg, rgba(200,220,255,0), rgba(200,220,255,0.25), rgba(200,220,255,0))',
                transform: `rotate(${(Math.atan2(weather.windSpeed ?? 0, 100) * 180) / Math.PI - 10}deg)`,
                opacity: 0.35,
                animation: `wind-gust ${3 + Math.random() * 2}s ease-in-out ${Math.random() * 2}s infinite`
              }}
            />
          ))}
        </div>
      )}

      {/* Fog / mist / haze layering */}
      {fogLayers && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }}>
          {fogLayers.map((layer, i) => (
            <div
              key={`fog-${i}`}
              className="absolute inset-0"
              style={{
                background: `
                  radial-gradient(ellipse at 50% ${80 + i * 6}%, rgba(200,200,200,${layer.opacity}) 0%, rgba(200,200,200,${
                  layer.opacity * 0.6
                }) 35%, rgba(200,200,200,${layer.opacity * 0.24}) 58%, transparent 75%),
                  linear-gradient(to top, rgba(210,210,210,${layer.opacity * 0.25}) 0%, rgba(210,210,210,0) 45%)
                `,
                mixBlendMode: 'soft-light',
                transform: `scale(${layer.scale}) translateX(${i % 2 ? '-6%' : '6%'})`,
                animation: `fog-drift ${layer.duration}s ease-in-out ${layer.delay}s infinite alternate`
              }}
            />
          ))}
        </div>
      )}

      {/* Heatwave shimmer and mirage (lower band) */}
      {showHeat && (
        <>
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              zIndex: 2,
              opacity: Math.min(1, (weather.fx?.heatShimmer ?? 0.4) * 0.6 + 0.2),
              background:
                'repeating-linear-gradient(0deg, rgba(255,255,255,0), rgba(255,255,255,0) 8px, rgba(255,230,180,0.06) 12px, rgba(255,255,255,0) 16px)',
              animation: 'heat-shimmer 6s ease-in-out infinite',
              filter: 'blur(0.6px)'
            }}
          />
          <div
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              left: 0,
              right: 0,
              bottom: '6%',
              height: '16%',
              zIndex: 2,
              background:
                'radial-gradient(ellipse at 50% 0%, rgba(255,225,170,0.10), rgba(255,225,170,0.05) 45%, transparent 70%)',
              filter: 'blur(2px)',
              animation: 'mirage 5.5s ease-in-out infinite'
            }}
          />
        </>
      )}

      {/* Frost sparkles near ground */}
      {showFrost && (
        <div className="absolute inset-x-0 bottom-0 pointer-events-none" style={{ height: '40%', zIndex: 2, opacity: 0.9 }}>
          {Array.from({ length: 90 }, (_, i) => {
            const x = (i * 73) % width;
            const y = height * 0.65 + ((i * 97) % Math.floor(height * 0.12));
            const d = 1 + (i % 3);
            return (
              <div
                key={`frost-${i}`}
                className="absolute"
                style={{
                  left: `${x}px`,
                  top: `${y}px`,
                  width: `${d}px`,
                  height: `${d}px`,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.95)',
                  boxShadow: '0 0 3px rgba(180,220,255,0.8)',
                  animation: `sparkle ${2 + (i % 5) * 0.4}s ease-in-out ${((i * 0.13) % 2).toFixed(2)}s infinite`
                }}
              />
            );
          })}
        </div>
      )}

      {/* Rainbow (double arc) */}
      {showRainbow && (
        <div
          className="absolute pointer-events-none"
          style={{
            top: '18%',
            right: '8%',
            width: Math.min(480, Math.max(320, width * 0.35)),
            height: Math.min(260, Math.max(180, height * 0.22)),
            zIndex: 2,
            filter: 'blur(0.2px)'
          }}
        >
          <svg width="100%" height="100%" viewBox="0 0 400 240">
            <defs>
              <linearGradient id="rainbow-grad-1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255, 0, 0, 0.55)" />
                <stop offset="16.66%" stopColor="rgba(255, 127, 0, 0.55)" />
                <stop offset="33.33%" stopColor="rgba(255, 255, 0, 0.55)" />
                <stop offset="50%" stopColor="rgba(0, 255, 0, 0.55)" />
                <stop offset="66.66%" stopColor="rgba(0, 0, 255, 0.55)" />
                <stop offset="83.33%" stopColor="rgba(75, 0, 130, 0.55)" />
                <stop offset="100%" stopColor="rgba(148, 0, 211, 0.55)" />
              </linearGradient>
              <linearGradient id="rainbow-grad-2" x1="100%" y1="0%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="rgba(255, 0, 0, 0.25)" />
                <stop offset="16.66%" stopColor="rgba(255, 127, 0, 0.25)" />
                <stop offset="33.33%" stopColor="rgba(255, 255, 0, 0.25)" />
                <stop offset="50%" stopColor="rgba(0, 255, 0, 0.25)" />
                <stop offset="66.66%" stopColor="rgba(0, 0, 255, 0.25)" />
                <stop offset="83.33%" stopColor="rgba(75, 0, 130, 0.25)" />
                <stop offset="100%" stopColor="rgba(148, 0, 211, 0.25)" />
              </linearGradient>
              <filter id="rainbow-bloom" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" />
              </filter>
            </defs>
            <path d="M 40 230 A 170 170 0 0 1 360 230" stroke="url(#rainbow-grad-1)" strokeWidth="18" fill="none" opacity="0.75" filter="url(#rainbow-bloom)" />
            <path d="M 60 230 A 150 150 0 0 1 340 230" stroke="url(#rainbow-grad-2)" strokeWidth="14" fill="none" opacity="0.45" filter="url(#rainbow-bloom)" />
          </svg>
        </div>
      )}

      {/* Puddle ripples (subtle, near bottom) */}
      {showPuddles && (
        <div className="absolute inset-x-0 bottom-0 pointer-events-none" style={{ height: '18%', zIndex: 2, opacity: Math.min(0.7, 0.25 + wetness * 0.45) }}>
          {Array.from({ length: 8 }, (_, i) => {
            const w = 80 + (i % 4) * 30;
            const l = (i * 11.3) % width;
            const d = 3 + (i % 3);
            return (
              <div
                key={`puddle-${i}`}
                className="absolute"
                style={{
                  left: `${l}px`,
                  bottom: `${(i % 3) * 6}px`,
                  width: `${w}px`,
                  height: `${w / 4}px`,
                  borderRadius: '50%',
                  background: 'radial-gradient(ellipse at center, rgba(200,220,255,0.15) 0%, rgba(200,220,255,0.05) 50%, rgba(200,220,255,0) 70%)',
                  filter: 'blur(1px)',
                  animation: `ripple ${4 + d}s ease-out ${(i % 5) * 0.7}s infinite`
                }}
              />
            );
          })}
        </div>
      )}

      {/* Aurora (soft moving curtains, top band) */}
      {showAurora && (
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 pointer-events-none"
          style={{
            zIndex: 2,
            height: '36%',
            opacity: Math.min(0.85, 0.3 + auroraProb * 0.8),
            mixBlendMode: 'screen',
            background:
              'radial-gradient(120% 100% at 50% 0%, rgba(60,255,180,0.18), rgba(120,180,255,0.12) 40%, rgba(0,0,0,0) 70%)'
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, rgba(90,255,160,0.28), rgba(120,180,255,0.22), rgba(160,120,255,0.18))',
              filter: 'blur(8px)',
              animation: 'aurora-shift 16s ease-in-out infinite alternate'
            }}
          />
        </div>
      )}

      {/* Lightning flash */}
      {showLightning && (
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 4,
            animation: `lightning-flash ${3 + (1 - Math.max(0, Math.min(1, lightningProb))) * 3}s ease-in-out ${Math.random() * 2}s infinite`,
            background: 'radial-gradient(circle at 60% 20%, rgba(255,255,255,0.6), rgba(255,255,255,0) 40%)',
            mixBlendMode: 'screen',
            opacity: 0
          }}
        />
      )}

      {/* CSS animations */}
      <style jsx="true">{`
        /* RAIN (rain-tilt animation removed for performance) */
        @keyframes rain-fall {
          0%   { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(var(--wind-offset, 0), var(--fall-y, ${height + 50}px), 0); }
        }

        /* SNOW */
        @keyframes snow-fall {
          0%   { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(var(--drift, 0), var(--fall-y, ${height + 40}px), 0); }
        }
        @keyframes snow-sway {
          0%   { margin-left: calc(var(--sway, 16px) * -1); }
          100% { margin-left: calc(var(--sway, 16px)); }
        }
        @keyframes snow-spin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(calc(360deg * var(--spinDir, 1))); }
        }

        /* PETALS (spring) */
        @keyframes petal-move {
          0%   { transform: translate3d(0, 0, 0) rotate(0deg); opacity: 0; }
          10%  { opacity: 0.95; }
          50%  { transform: translate3d(var(--petal-dx-half, 100px), var(--petal-dy-half, 200px), 0) rotate(var(--petal-rotMid, 120deg)); }
          100% { transform: translate3d(var(--petal-dx, 200px), var(--petal-dy, 400px), 0) rotate(var(--petal-rotEnd, 300deg)); opacity: 0; }
        }

        /* LEAVES (autumn) */
        @keyframes leaf-move {
          0%   { transform: translate3d(0, 0, 0) rotate(0deg); opacity: 0; }
          10%  { opacity: 0.9; }
          50%  { transform: translate3d(var(--leaf-dx-half, 100px), var(--leaf-dy-half, 200px), 0) rotate(var(--leaf-rotMid, 120deg)); }
          100% { transform: translate3d(var(--leaf-dx, 200px), var(--leaf-dy, 400px), 0) rotate(var(--leaf-rotEnd, 300deg)); opacity: 0; }
        }

        /* AIR (dust/sand/pollen) */
        @keyframes air-drift {
          0%   { transform: translate3d(0, 0, 0); opacity: 0; }
          10%  { opacity: 0.7; }
          90%  { opacity: 0.7; }
          100% { transform: translate3d(var(--air-dx, 40px), var(--air-dy, -50px), 0); opacity: 0; }
        }

        /* FOG / HAZE */
        @keyframes fog-drift {
          0%   { transform: translateX(-6%) scale(1.2); }
          100% { transform: translateX(6%)  scale(1.2); }
        }

        /* GUSTS */
        @keyframes wind-gust {
          0%   { opacity: 0; transform: translateX(-10%) scaleX(0.9); }
          20%  { opacity: 0.45; }
          50%  { opacity: 0.35; transform: translateX(10%)  scaleX(1.0); }
          80%  { opacity: 0.15; }
          100% { opacity: 0; transform: translateX(24%)  scaleX(1.05); }
        }

        /* HEATWAVE */
        @keyframes heat-shimmer {
          0%   { background-position: 0 0; }
          50%  { background-position: 0 8px; }
          100% { background-position: 0 0; }
        }
        @keyframes mirage {
          0%   { transform: scaleY(1.0); opacity: 0.55; }
          50%  { transform: scaleY(1.06); opacity: 0.75; }
          100% { transform: scaleY(1.0); opacity: 0.55; }
        }

        /* FROST */
        @keyframes sparkle {
          0%, 100% { opacity: 0.1; }
          50%      { opacity: 1; }
        }

        /* PUDDLES */
        @keyframes ripple {
          0%   { transform: scale(0.95); opacity: 0.4; }
          60%  { opacity: 0.2; }
          100% { transform: scale(1.05); opacity: 0.0; }
        }

        /* LIGHTNING */
        @keyframes lightning-flash {
          0%, 96%, 100% { opacity: 0; }
          97% { opacity: 0.9; }
          98% { opacity: 0.1; }
          99% { opacity: 0.6; }
        }

        /* FIREFLIES */
        @keyframes firefly-float {
          0%   { transform: translate3d(-4px, 0, 0); }
          50%  { transform: translate3d(6px, -10px, 0); }
          100% { transform: translate3d(-4px, 0, 0); }
        }
        @keyframes firefly-twinkle {
          0%, 100% { opacity: 0.1; box-shadow: 0 0 3px rgba(255,255,170,0.6); }
          50%      { opacity: 1;   box-shadow: 0 0 8px rgba(255,255,170,1), 0 0 14px rgba(255,255,170,0.8); }
        }

        /* AURORA */
        @keyframes aurora-shift {
          0%   { transform: translateX(-6%) skewX(-2deg); }
          100% { transform: translateX(6%)  skewX(2deg); }
        }
      `}</style>
    </>
  );
};

export default WeatherEffects;
