/**
 * components/CloudSystem.tsx - Dynamic cloud rendering system
 * Creates beautiful, performant clouds that respond to weather and time of day
 *
 * FIXES:
 * - Split transform responsibilities:
 *   Outer <div.cloud> is translated by JS (rAF).
 *   Inner <div.cloud-sprite> handles billow/scale via CSS animation.
 *   => CSS no longer overwrites the JS transform.
 * - rAF loop always runs (gentle drift even at 0 wind).
 * - Tailwind-friendly: inline transforms + will-change.
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
  width = typeof window !== 'undefined' ? window.innerWidth : 1920,
  height = typeof window !== 'undefined' ? window.innerHeight : 1080,
  windSpeed = 0
}) => {
  const cloudsRef = useRef<Cloud[]>([]);
  const animationFrameRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Safari detection for performance optimizations
  const isSafari = useMemo(() => {
    return typeof navigator !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  }, []);

  // Safe access to fx; component remains compatible if fx is undefined
  const fx = weather?.fx;
  const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));

  // Color / softness palette
  const cloudColors = useMemo(() => {
    const palettes = {
      Dawn:   { base: [255,196,176,0.86], shadow: [210,120,95,0.38],  hi: [255,235,200,1.0] },
      Day:    { base: [255,255,255,0.92], shadow: [210,215,225,0.34], hi: [255,255,255,1.0] },
      Midday: { base: [255,255,255,0.96], shadow: [200,205,215,0.32], hi: [255,255,255,1.0] },
      Dusk:   { base: [255,176,146,0.86], shadow: [185,100,85,0.38],  hi: [255,215,180,0.98] },
      Night:  { base: [85,95,125,0.65],   shadow: [25,30,50,0.45],    hi: [120,130,160,0.72] }
    } as const;

    const p = palettes[timeOfDay] ?? palettes.Day;
    const haze = clamp(fx?.hazeDensity ?? 0);
    const insolation = clamp(fx?.insolation ?? (timeOfDay === 'Night' ? 0 : timeOfDay === 'Midday' ? 0.9 : 0.6));
    const dim = 1 - haze * 0.35;
    const hiBoost = 1 + insolation * (timeOfDay === 'Midday' ? 0.12 : 0.07);

    const rgba = (arr: number[], mult = 1) =>
      `rgba(${arr[0]}, ${arr[1]}, ${arr[2]}, ${clamp(arr[3] * mult)})`;

    return {
      base: rgba(p.base, dim),
      shadow: rgba(p.shadow, dim),
      highlight: rgba(p.hi, dim * hiBoost),
      blurBoost: 1 + haze * 1.3
    };
  }, [timeOfDay, fx?.hazeDensity, fx?.insolation]);

  // Create cloud field
  const generateClouds = useMemo(() => {
    const clouds: Cloud[] = [];
    if (!weather) return clouds;

    const cover = clamp(weather.cloudCover ?? 0);
    const precip = weather.precipitation;
    const intensity = clamp(weather.intensity ?? 0);
    const windy = (weather.windSpeed ?? windSpeed ?? 0);
    const maybeStorm = (fx?.lightningProbability ?? 0) > 0.35 || (precip === 'rain' && intensity > 0.55);

    let cloudCount = 0;
    let mix: Cloud['type'][] = [];

    // Safari: Reduce cloud count by 50% for performance
    const cloudReduction = isSafari ? 0.5 : 1.0;

    if (precip === 'rain' || precip === 'drizzle') {
      cloudCount = Math.floor((8 + Math.floor(intensity * 6) + (maybeStorm ? 3 : 0)) * cloudReduction);
      mix = maybeStorm ? ['stratus', 'cumulonimbus', 'cumulonimbus'] : ['stratus', 'cumulus', 'stratus'];
    } else if (precip === 'snow') {
      cloudCount = Math.floor((10 + Math.floor(intensity * 4)) * cloudReduction);
      mix = ['stratus', 'stratus', 'cumulus'];
    } else if (weather.special === 'fog' || weather.special === 'mist') {
      cloudCount = Math.floor(10 * cloudReduction);
      mix = ['stratus'];
    } else {
      if (cover < 0.15) {
        cloudCount = Math.floor(Math.floor(Math.random() * 2) * cloudReduction);
        mix = ['cirrus'];
      } else if (cover < 0.4) {
        cloudCount = Math.floor((2 + cover * 9) * cloudReduction);
        mix = ['cumulus', 'cirrus', 'cumulus'];
      } else if (cover < 0.7) {
        cloudCount = Math.floor((6 + cover * 12) * cloudReduction);
        mix = ['cumulus', 'stratus', 'cumulus'];
      } else {
        cloudCount = Math.floor((10 + cover * 10 + (maybeStorm ? 2 : 0)) * cloudReduction);
        mix = maybeStorm ? ['stratus', 'cumulonimbus', 'stratus'] : ['stratus', 'stratus', 'cumulus'];
      }
    }

    const cfg: Record<Cloud['type'], { yBase: number; yRange: number; speedMul: number; opacity: [number, number]; scaleMul: number }> = {
      cirrus:       { yBase: height * 0.10, yRange: height * 0.12, speedMul: 1.12, opacity: [0.45, 0.75], scaleMul: 0.95 },
      cumulus:      { yBase: height * 0.20, yRange: height * 0.18, speedMul: 1.00, opacity: [0.60, 0.90], scaleMul: 1.00 },
      stratus:      { yBase: height * 0.28, yRange: height * 0.20, speedMul: 0.70, opacity: [0.45, 0.75], scaleMul: 1.00 },
      cumulonimbus: { yBase: height * 0.18, yRange: height * 0.22, speedMul: 0.85, opacity: [0.75, 0.95], scaleMul: 1.25 }
    };

    for (let i = 0; i < cloudCount; i++) {
      const type = mix[i % mix.length];
      const c = cfg[type];
      const layer = i % 3; // extra mild parallax
      const x = Math.random() * (width + 420) - 210;
      const y = c.yBase + Math.random() * c.yRange + layer * 8;
      const scale = (0.55 + Math.random() * 1.45) * c.scaleMul;
      const opacity = c.opacity[0] + Math.random() * (c.opacity[1] - c.opacity[0]);
      const speed = (0.12 + Math.random() * 0.20) * (1 + windy * 0.02) * c.speedMul * (1 - layer * 0.18);

      clouds.push({ id: i, x, y, scale, opacity, speed, type });
    }
    return clouds;
  }, [
    weather?.precipitation,
    weather?.intensity,
    weather?.special,
    weather?.cloudCover,
    weather?.windSpeed,
    windSpeed,
    width,
    height,
    fx?.lightningProbability,
    isSafari
  ]);

  // Seed or swap field only when it really changes
  useEffect(() => {
    if (cloudsRef.current.length === 0 || Math.abs(cloudsRef.current.length - generateClouds.length) > 2) {
      cloudsRef.current = generateClouds;
    }
  }, [generateClouds]);

  // Animation loop: DISABLE on Safari for performance
  useEffect(() => {
    // Skip animation entirely on Safari
    if (isSafari) {
      // Just position clouds once without animation
      if (containerRef.current) {
        const nodes = containerRef.current.querySelectorAll<HTMLDivElement>('[data-cloud-index]');
        nodes.forEach((el) => {
          const idx = Number(el.dataset.cloudIndex);
          const c = cloudsRef.current[idx];
          if (!c) return;
          el.style.transform = `translate3d(${c.x}px, ${c.y}px, 0)`;
        });
      }
      return;
    }

    // Regular animation for non-Safari browsers
    const animate = () => {
      if (!containerRef.current) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      cloudsRef.current = cloudsRef.current.map((cloud) => {
        let x = cloud.x + cloud.speed * 0.22;
        if (x > width + 240) x = -480;
        return { ...cloud, x };
      });

      const nodes = containerRef.current.querySelectorAll<HTMLDivElement>('[data-cloud-index]');
      nodes.forEach((el) => {
        const idx = Number(el.dataset.cloudIndex);
        const c = cloudsRef.current[idx];
        if (!c) return;
        el.style.transform = `translate3d(${c.x}px, ${c.y}px, 0)`;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => animationFrameRef.current && cancelAnimationFrame(animationFrameRef.current);
  }, [width, height, isSafari]);

  // Drawing helpers
  const renderCloudSVG = (cloud: Cloud) => {
    const { base, shadow, highlight, blurBoost } = cloudColors;

    // Safari: No blur filters for performance
    const filterStyle = isSafari
      ? 'none'
      : (() => {
          const blur =
            cloud.type === 'cirrus' ? 3.2 * blurBoost :
            cloud.type === 'stratus' ? 2.2 * blurBoost :
            cloud.type === 'cumulonimbus' ? 0.9 * blurBoost :
            1.2 * blurBoost;
          return `blur(${blur}px) drop-shadow(0 2px 2px rgba(0,0,0,0.05))`;
        })();

    const thunder = (fx?.lightningProbability ?? 0) > 0.35 && cloud.type === 'cumulonimbus';
    const showVirga =
      cloud.type === 'cumulonimbus' &&
      (weather?.precipitation === 'rain' || weather?.precipitation === 'drizzle') &&
      (weather?.humidity ?? 100) < 45;

    switch (cloud.type) {
      case 'cumulus':
        return (
          <svg width="210" height="120" viewBox="0 0 210 120" style={{ position: 'absolute', opacity: cloud.opacity, filter: filterStyle }}>
            <defs>
              <radialGradient id={`cum-${cloud.id}`} cx="50%" cy="42%">
                <stop offset="0%" stopColor={highlight} />
                <stop offset="72%" stopColor={base} />
                <stop offset="100%" stopColor={shadow} />
              </radialGradient>
            </defs>
            <ellipse cx="64"  cy="74" rx="36" ry="26" fill={`url(#cum-${cloud.id})`} />
            <ellipse cx="110" cy="62" rx="55" ry="38" fill={`url(#cum-${cloud.id})`} />
            <ellipse cx="158" cy="76" rx="38" ry="26" fill={`url(#cum-${cloud.id})`} />
            <ellipse cx="88"  cy="90" rx="48" ry="22" fill={`url(#cum-${cloud.id})`} />
            <ellipse cx="132" cy="90" rx="48" ry="22" fill={`url(#cum-${cloud.id})`} />
          </svg>
        );

      case 'stratus':
        return (
          <svg width="360" height="92" viewBox="0 0 360 92" style={{ position: 'absolute', opacity: cloud.opacity, filter: filterStyle }}>
            <defs>
              <linearGradient id={`str-${cloud.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%"   stopColor={base}   stopOpacity="0.18" />
                <stop offset="55%"  stopColor={base}   stopOpacity="0.55" />
                <stop offset="100%" stopColor={shadow} stopOpacity="0.34" />
              </linearGradient>
            </defs>
            <rect x="0" y="12" width="360" height="62" rx="18" fill={`url(#str-${cloud.id})`} />
            <ellipse cx="180" cy="60" rx="180" ry="28" fill={`url(#str-${cloud.id})`} />
          </svg>
        );

      case 'cirrus':
        return (
          <svg width="280" height="90" viewBox="0 0 280 90" style={{ position: 'absolute', opacity: cloud.opacity * 0.75, filter: filterStyle }}>
            <defs>
              <linearGradient id={`cir-${cloud.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor={base}      stopOpacity="0.06" />
                <stop offset="50%"  stopColor={highlight} stopOpacity="0.25" />
                <stop offset="100%" stopColor={base}      stopOpacity="0.06" />
              </linearGradient>
            </defs>
            <path d="M0 45 Q70 20, 140 38 T 280 42" stroke={`url(#cir-${cloud.id})`} strokeWidth="14" fill="none" />
            <path d="M0 58 Q90 40, 180 55 T 280 60" stroke={`url(#cir-${cloud.id})`} strokeWidth="10" fill="none" />
          </svg>
        );

      case 'cumulonimbus':
        return (
          <svg width="300" height="190" viewBox="0 0 300 190" style={{ position: 'absolute', opacity: cloud.opacity, filter: filterStyle }}>
            <defs>
              <radialGradient id={`stm-${cloud.id}`} cx="50%" cy="45%">
                <stop offset="0%"   stopColor={shadow} stopOpacity="0.85" />
                <stop offset="55%"  stopColor={base}   stopOpacity="0.95" />
                <stop offset="100%" stopColor={shadow} stopOpacity="0.95" />
              </radialGradient>
              <linearGradient id={`stb-${cloud.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%"   stopColor={shadow} stopOpacity="0.85" />
                <stop offset="100%" stopColor={shadow} stopOpacity="0.65" />
              </linearGradient>
              <linearGradient id={`vir-${cloud.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%"   stopColor={shadow} stopOpacity="0.25" />
                <stop offset="100%" stopColor={shadow} stopOpacity="0" />
              </linearGradient>
            </defs>

            <ellipse cx="150" cy="72" rx="120" ry="46" fill={`url(#stm-${cloud.id})`} />
            <ellipse cx="98"  cy="96" rx="78"  ry="40" fill={`url(#stm-${cloud.id})`} />
            <ellipse cx="202" cy="96" rx="78"  ry="40" fill={`url(#stm-${cloud.id})`} />
            <ellipse cx="150" cy="50" rx="135" ry="26" fill={`url(#stm-${cloud.id})`} />
            <rect   x="80"  y="112" width="140" height="36" rx="12" fill={`url(#stb-${cloud.id})`} />

            {(weather?.humidity ?? 100) < 45 && (weather?.precipitation === 'rain' || weather?.precipitation === 'drizzle') && (
              <g opacity="0.4">
                {[...Array(6)].map((_, j) => {
                  const x = 90 + j * 28 + (j % 2 ? 8 : -6);
                  const len = 26 + (j % 3) * 14;
                  return <rect key={j} x={x} y={148} width="2" height={len} fill={`url(#vir-${cloud.id})`} />;
                })}
              </g>
            )}

            {(fx?.lightningProbability ?? 0) > 0.35 && (
              <ellipse cx="150" cy="160" rx="105" ry="22" fill="rgba(255,255,255,0.08)" style={{ mixBlendMode: 'screen' }} />
            )}
          </svg>
        );
    }
  };

  // Time-of-day opacity (kept to your original spec)
  const timeOpacity =
    timeOfDay === 'Night' ? 0 :
    timeOfDay === 'Dawn' || timeOfDay === 'Dusk' ? 0.3 :
    1;

  if (!weather || generateClouds.length === 0 || timeOpacity === 0) return null;

  // Optional god rays
  const showGodRays =
    (timeOfDay === 'Dawn' || timeOfDay === 'Dusk') &&
    (weather.cloudCover ?? 0) > 0.15 &&
    (weather.cloudCover ?? 0) < 0.65 &&
    (fx?.insolation ?? 0.5) > 0.4;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 2, opacity: timeOpacity, transition: 'opacity 3s ease-in-out' }}
    >
      {showGodRays && (
        <div
          className="absolute inset-0"
          style={{
            background: 'repeating-linear-gradient(17deg, rgba(255,235,200,0.05), rgba(255,235,200,0.05) 20px, rgba(255,235,200,0) 60px)',
            animation: 'rays-move 12s linear infinite',
            filter: 'blur(1.2px)',
            opacity: 0.5
          }}
        />
      )}

      {generateClouds.map((cloud, i) => (
        <div
          key={cloud.id}
          data-cloud-index={i}
          className="cloud absolute will-change-transform"
          style={{
            transform: `translate3d(${cloud.x}px, ${cloud.y}px, 0)`,
            // keep transition off; movement is driven by rAF
          }}
        >
          <div
            className="cloud-sprite"
            style={{
              transform: `scale(${cloud.scale})`,
              animation: `cloud-billow ${12 + (i % 5) * 2}s ease-in-out ${(i % 7) * 0.35}s infinite`
            }}
          >
            {renderCloudSVG(cloud)}
          </div>
        </div>
      ))}

      <style jsx="true">{`
        @keyframes cloud-billow {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
        @keyframes rays-move {
          0%   { background-position: 0 0; }
          100% { background-position: 240px 0; }
        }
      `}</style>
    </div>
  );
};

// Memo to avoid excess renders; includes fx keys that influence visuals
export default React.memo(CloudSystem, (prev, next) => {
  return (
    prev.timeOfDay === next.timeOfDay &&
    prev.windSpeed === next.windSpeed &&
    prev.weather?.precipitation === next.weather?.precipitation &&
    prev.weather?.intensity === next.weather?.intensity &&
    prev.weather?.special === next.weather?.special &&
    prev.weather?.cloudCover === next.weather?.cloudCover &&
    prev.weather?.windSpeed === next.weather?.windSpeed &&
    prev.weather?.fx?.hazeDensity === next.weather?.fx?.hazeDensity &&
    prev.weather?.fx?.lightningProbability === next.weather?.fx?.lightningProbability &&
    prev.weather?.fx?.insolation === next.weather?.fx?.insolation
  );
});
