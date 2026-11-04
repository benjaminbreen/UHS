/** The one cast-shadow colour: scripts/art/shadows.py SHADE, which the baked
 * tree, prop and building shadows use, so runtime casts match them. */
export const SHADOW = [32, 34, 84] as const;
/** Casts on lying snow, as a fill tint: at the baked casts' ~0.35 alpha it
 * puts Haunted Chocolatier's saturated blue (about 150, 180, 245) on white snow. */
export const SNOW_SHADOW = 0x0046ea;
