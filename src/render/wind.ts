import type { Wind } from "../core/weather";

export type WindProfile = Readonly<{
  period: number;
  lateral: number;
  angle: number;
}>;

const reeds: WindProfile = { period: 2400, lateral: 0.55, angle: 0.03 };
const willow: WindProfile = { period: 6000, lateral: 0.7, angle: 0.009 };
const palm: WindProfile = { period: 5200, lateral: 0.65, angle: 0.009 };
const tree: WindProfile = { period: 5600, lateral: 0.35, angle: 0.004 };

/** Returns the quietest useful profile for a rendered plant. */
export function windProfile(
  frame: string,
  isTree = false,
): WindProfile | undefined {
  if (frame === "reeds") return reeds;
  if (frame.includes("willow")) return willow;
  if (frame.includes("palm")) return palm;
  return isTree ? tree : undefined;
}

// One wind for the whole scene. Grass, canopies, blown debris and smoke all
// read it, so a gust crosses the view as a single event instead of each plant
// keeping its own weather.
let current: Wind = { angle: 0.3, strength: 0.35 };
export function setWind(wind: Wind) {
  current = wind;
}
export function wind() {
  return current;
}
/** Unit vector the wind blows toward. */
export function windVector() {
  return { x: Math.cos(current.angle), y: Math.sin(current.angle) };
}

/** A gust travelling downwind across the field, -1 to 1. Two waves of
 * different length so the pattern does not repeat on an obvious beat. */
export function gustAt(time: number, wx = 0, wy = 0, phase = 0) {
  const v = windVector();
  const along = wx * v.x + wy * v.y;
  const speed = 0.4 + current.strength;
  return (
    (Math.sin((time / 1600) * speed - along * 0.011 + phase) +
      Math.sin((time / 700) * speed - along * 0.031 + phase * 1.7) * 0.28) /
    1.28
  );
}

/** Pixel-safe sway: integer translation plus a very small canopy rotation.
 * Amplitude and direction both come from the scene's wind. */
export function windSway(
  time: number,
  phase: number,
  profile: WindProfile,
  wx = 0,
  wy = 0,
) {
  const gust = gustAt(time, wx, wy, phase);
  const lean = windVector().x;
  // A still day still stirs; a gale roughly doubles the throw. Rotation is
  // left alone — a pixel canopy shears badly past a degree or so.
  const force = Math.max(-2, Math.min(2, (0.55 + current.strength * 2) * lean));
  return {
    x: Math.round(gust * profile.lateral * force),
    angle: gust * profile.angle * Math.sign(lean || 1),
  };
}
