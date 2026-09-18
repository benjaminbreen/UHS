import lighting from "../content/graphics/lighting.json" with { type: "json" };

/** Which way the light falls across a sprite, as four corner colours.
 *
 * The cast shadows already swing with the sun and the world already takes an
 * overall tint, but the shading inside every sprite is baked at one fixed
 * angle, so at dusk a wall is still lit from the upper left. Phaser takes a
 * colour per corner, so the apparent direction can be moved at draw time for
 * nothing: no second atlas, no rebuild, and the phase table in content stays
 * the only place a time of day is described.
 *
 * It cannot move a baked highlight or re-shade a face that is geometrically in
 * shadow. What it does is warm the side the sun is on and cool the other,
 * which together with the rotating cast shadow is what reads as a time of day.
 */

export type LightPhase = {
  id: string;
  label: string;
  /** Where the cast shadow points. The sun is the other way. */
  cast: number[];
  tint: string;
  opacity: number;
};

export const lightPhases = lighting as LightPhase[];

/** Multipliers per channel for the lit and unlit sides. Deliberately small:
 *  this is a light moving, not a filter. */
const WARM = [1.07, 1.0, 0.9] as const;
const COOL = [0.9, 0.96, 1.1] as const;
/** The sky is brighter than the ground, at every hour. */
const SKY = 1.03;
const GROUND = 0.96;

const clamp = (v: number, lo = 0, hi = 255) => Math.max(lo, Math.min(hi, v));

function channels(colour: number) {
  return [(colour >> 16) & 255, (colour >> 8) & 255, colour & 255];
}

function pack([r, g, b]: number[]) {
  return (clamp(Math.round(r)) << 16) | (clamp(Math.round(g)) << 8) | clamp(Math.round(b));
}

export type Corners = {
  topLeft: number;
  topRight: number;
  bottomLeft: number;
  bottomRight: number;
};

/**
 * @param phase  a row from lighting.json
 * @param base   the flat tint already in use, so this composes with it
 * @param amount 0 keeps the flat tint, 1 is the full swing. Worth exposing:
 *               the right strength is a judgement made against the real art.
 */
export function cornerTint(
  phase: Pick<LightPhase, "cast" | "tint">,
  base = 0xffffff,
  amount = 1,
): Corners {
  const rgb = channels(base);
  // Shadows point away from the sun, so the lit side is the opposite sign.
  // The table runs to about 2.3 at the extremes of the day.
  const lean = Math.max(-1, Math.min(1, -phase.cast[0] / 2.3)) * amount;
  const side = (sign: number) => {
    const t = lean * sign;
    // t > 0 on the side the sun is on.
    const mix = t > 0 ? WARM : COOL;
    const strength = Math.abs(t);
    return rgb.map((c, i) => c * (1 + (mix[i] - 1) * strength));
  };
  const left = side(-1);
  const right = side(1);
  const lift = (c: number[], k: number) => pack(c.map((v) => v * k));
  return {
    topLeft: lift(left, SKY),
    topRight: lift(right, SKY),
    bottomLeft: lift(left, GROUND),
    bottomRight: lift(right, GROUND),
  };
}

/** The same four corners, applied to a canvas the way Phaser applies them to a
 *  quad: bilinear across the sprite. Used by the labs, which draw on a 2D
 *  context rather than through the renderer. */
export function paintCornerTint(
  image: ImageData,
  corners: Corners,
) {
  const { width, height, data } = image;
  const c = [
    channels(corners.topLeft),
    channels(corners.topRight),
    channels(corners.bottomLeft),
    channels(corners.bottomRight),
  ];
  for (let y = 0; y < height; y++) {
    const v = height > 1 ? y / (height - 1) : 0;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (!data[i + 3]) continue;
      const u = width > 1 ? x / (width - 1) : 0;
      for (let k = 0; k < 3; k++) {
        const top = c[0][k] * (1 - u) + c[1][k] * u;
        const bottom = c[2][k] * (1 - u) + c[3][k] * u;
        data[i + k] = clamp((data[i + k] * (top * (1 - v) + bottom * v)) / 255);
      }
    }
  }
  return image;
}
