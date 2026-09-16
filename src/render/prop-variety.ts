import { random } from "../core/random";

// Mirrored art only helps where the sprite is not lit from one side. Nature
// art is drawn lit from directly above, so a mirrored rock or bush still
// agrees with the sun; built props carry handles, doors and openings that
// would read backwards, so they are left alone.
function mirrorable(sprite: string) {
  return (
    sprite === "rock" ||
    sprite.startsWith("rock-") ||
    (sprite.startsWith("nature-") && !sprite.includes("understory-ladder"))
  );
}

export type PropVariety = {
  flip: boolean;
  /** Multiply tint, at or below white: a tint can darken but never brighten. */
  tint: number;
};

/** Two free axes of variety for art that is placed hundreds of times: which
 * way it faces, and how deep its tone is. A field of two dozen boulders comes
 * from three frames, so without this it reads as three stamps repeated. */
export function propVariety(
  seed: string,
  sprite: string,
  x: number,
  y: number,
): PropVariety {
  if (!mirrorable(sprite)) return { flip: false, tint: 0xffffff };
  const roll = random(seed, "prop-variety", x, y);
  // A sixth of the range spent on tone, the rest on facing, so neighbours
  // rarely share both.
  const shade = random(seed, "prop-shade", x, y);
  const level = Math.round(255 * (0.88 + Math.floor(shade * 4) * 0.04));
  // Sand and stone warm slightly as they darken, rather than going grey.
  const warm = Math.min(255, Math.round(level * 1.03));
  return {
    flip: roll < 0.5,
    tint: (warm << 16) | (level << 8) | Math.round(level * 0.98),
  };
}
