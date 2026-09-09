import { useMemo, useState } from "react";
import type { LightingId } from "../render/lighting";
import { toFahrenheit, type Weather } from "../core/weather";

const skies: Record<LightingId, [string, string, string]> = {
  "early-morning": ["#101a3a", "#4d5c8f", "#e0a27a"],
  morning: ["#0f2050", "#2e5f9f", "#9dc6e6"],
  midday: ["#1b4b8e", "#4a8bcb", "#b3d9f0"],
  afternoon: ["#173a6e", "#4f7fb4", "#ecc08a"],
  dusk: ["#0d1030", "#4a3a6a", "#d8735c"],
  night: ["#03061a", "#0c1636", "#1c2d55"],
};

function seeded(n: number) {
  let s = n * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/** Soft cloud: a row of blurred ellipses on a shared gradient. */
function Cloud({
  x,
  y,
  scale,
  dark,
  id,
}: {
  x: number;
  y: number;
  scale: number;
  dark: boolean;
  id: string;
}) {
  const fill = dark ? "url(#cloud-dark)" : "url(#cloud-light)";
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} filter="url(#soft)" id={id}>
      <ellipse cx="0" cy="0" rx="26" ry="11" fill={fill} />
      <ellipse cx="-14" cy="4" rx="16" ry="9" fill={fill} />
      <ellipse cx="12" cy="3" rx="18" ry="10" fill={fill} />
      <ellipse cx="2" cy="-7" rx="14" ry="10" fill={fill} />
      <ellipse cx="-4" cy="6" rx="24" ry="6" fill={dark ? "#5b6480" : "#c9d3e2"} opacity="0.55" />
    </g>
  );
}

function Scene({ weather, lighting }: { weather: Weather; lighting: LightingId }) {
  const { condition, night } = weather;
  const stars = useMemo(() => {
    const r = seeded(7);
    return Array.from({ length: 26 }, (_, i) => ({
      x: r() * 160,
      y: r() * 90,
      r: 0.4 + r() * 0.9,
      d: 2 + r() * 4,
      i,
    }));
  }, []);
  const rain = useMemo(() => {
    const r = seeded(3);
    return Array.from({ length: 22 }, (_, i) => ({ x: r() * 170, d: r() * 1.2, i }));
  }, []);
  const dim = night || lighting === "dusk";
  const cloudy = condition !== "clear" && condition !== "mist";
  const heavy = condition === "overcast" || condition === "rain";
  return (
    <svg className="sky-scene" viewBox="0 0 160 140" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <filter id="soft" x="-30%" y="-40%" width="160%" height="180%">
          <feGaussianBlur stdDeviation="1.4" />
        </filter>
        <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="haze" x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <radialGradient id="sun-core">
          <stop offset="0" stopColor="#fff7d6" />
          <stop offset="0.6" stopColor="#ffd975" />
          <stop offset="1" stopColor="#f6b23f" />
        </radialGradient>
        <radialGradient id="sun-halo">
          <stop offset="0" stopColor="#ffe9a8" stopOpacity="0.9" />
          <stop offset="0.5" stopColor="#ffcf6a" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ffb347" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="moon-core" cx="0.4" cy="0.4">
          <stop offset="0" stopColor="#fffaf0" />
          <stop offset="0.7" stopColor="#e9e2d0" />
          <stop offset="1" stopColor="#b9b4a8" />
        </radialGradient>
        <radialGradient id="moon-halo">
          <stop offset="0" stopColor="#dfe6ff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#dfe6ff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="cloud-light" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#d5deea" />
        </linearGradient>
        <linearGradient id="cloud-dark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8f9ab3" />
          <stop offset="1" stopColor="#525c78" />
        </linearGradient>
        <linearGradient id="ray" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffe6a3" stopOpacity="0.5" />
          <stop offset="1" stopColor="#ffe6a3" stopOpacity="0" />
        </linearGradient>
      </defs>
      {dim && (
        <g className="sky-stars">
          {stars.map((s) => (
            <circle
              key={s.i}
              cx={s.x}
              cy={s.y}
              r={s.r}
              fill="#fff6e0"
              style={{ animationDuration: `${s.d}s`, animationDelay: `${-s.i * 0.37}s` }}
            />
          ))}
        </g>
      )}
      {!heavy && (
        <g className="sky-body" transform="translate(112 58)">
          {night ? (
            <>
              <circle r="30" fill="url(#moon-halo)" />
              <circle r="11" fill="url(#moon-core)" />
              <circle cx="-3" cy="-3" r="2.2" fill="#cfc9bb" opacity="0.5" />
              <circle cx="4" cy="3" r="1.5" fill="#cfc9bb" opacity="0.45" />
              <circle cx="2" cy="-5" r="1" fill="#cfc9bb" opacity="0.4" />
            </>
          ) : (
            <>
              <circle r="34" fill="url(#sun-halo)" filter="url(#glow)" className="sky-halo" />
              <g className="sky-rays">
                {Array.from({ length: 8 }, (_, i) => (
                  <rect key={i} x="12" y="-2" width="26" height="4" rx="2" fill="url(#ray)" transform={`rotate(${i * 45})`} />
                ))}
              </g>
              <circle r="12" fill="url(#sun-core)" />
            </>
          )}
        </g>
      )}
      {condition === "mist" && (
        <g className="sky-mist" filter="url(#haze)">
          <rect x="-40" y="70" width="240" height="10" rx="5" fill="#dfe6f0" opacity="0.5" />
          <rect x="-60" y="92" width="240" height="12" rx="6" fill="#c9d3e0" opacity="0.5" />
          <rect x="-20" y="114" width="240" height="14" rx="7" fill="#dfe6f0" opacity="0.45" />
        </g>
      )}
      {cloudy && (
        <>
          <g className="sky-drift slow">
            <Cloud id="c1" x={40} y={96} scale={0.9} dark={heavy || dim} />
            <Cloud id="c2" x={210} y={70} scale={0.7} dark={heavy || dim} />
          </g>
          <g className="sky-drift fast">
            <Cloud id="c3" x={120} y={84} scale={1.15} dark={heavy || dim} />
            <Cloud id="c4" x={-40} y={60} scale={0.6} dark={heavy || dim} />
          </g>
          {heavy && (
            <g className="sky-drift slow">
              <Cloud id="c5" x={20} y={50} scale={1.3} dark />
              <Cloud id="c6" x={180} y={110} scale={1.1} dark />
            </g>
          )}
        </>
      )}
      {condition === "rain" && (
        <g className="sky-rain">
          {rain.map((d) => (
            <line
              key={d.i}
              x1={d.x}
              y1="-20"
              x2={d.x - 3}
              y2="-8"
              stroke="#c7dcf3"
              strokeWidth="0.8"
              strokeLinecap="round"
              opacity="0.7"
              style={{ animationDelay: `${-d.d}s` }}
            />
          ))}
        </g>
      )}
    </svg>
  );
}

export function WeatherPanel({
  weather,
  lighting,
  period,
}: {
  weather: Weather;
  lighting: LightingId;
  period: string;
}) {
  const [unit, setUnit] = useState<"C" | "F">(() => {
    try {
      return localStorage.getItem("uhs-temp-unit") === "F" ? "F" : "C";
    } catch {
      return "C";
    }
  });
  const toggle = () => {
    const next = unit === "C" ? "F" : "C";
    setUnit(next);
    try {
      localStorage.setItem("uhs-temp-unit", next);
    } catch {
      /* private mode */
    }
  };
  const temp =
    unit === "C" ? `${weather.tempC}°C` : `${toFahrenheit(weather.tempC)}°F`;
  const [a, b, c] = skies[lighting];
  return (
    <div
      className="sky"
      data-lighting={lighting}
      style={{ background: `linear-gradient(165deg, ${a} 0%, ${b} 55%, ${c} 115%)` }}
    >
      <Scene weather={weather} lighting={lighting} />
      <span className="sky-period">{period}</span>
      <span className="sky-condition">{weather.label}</span>
      <button
        className="sky-temp"
        onClick={toggle}
        title={`Show in °${unit === "C" ? "F" : "C"}`}
        aria-label={`Temperature ${temp}. Click to switch units.`}
      >
        {temp}
      </button>
    </div>
  );
}
