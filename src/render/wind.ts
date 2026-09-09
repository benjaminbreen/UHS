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

/** Pixel-safe sway: integer translation plus a very small canopy rotation. */
export function windSway(
  time: number,
  phase: number,
  profile: WindProfile,
) {
  const cycle = ((time / profile.period + phase) % 1 + 1) % 1;
  const wave =
    Math.sin(cycle * Math.PI * 2) +
    Math.sin(cycle * Math.PI * 4 + 0.8) * 0.12;
  return {
    x: Math.round(wave * profile.lateral),
    angle: wave * profile.angle,
  };
}
