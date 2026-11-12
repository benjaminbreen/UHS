import type { CharacterAppearance } from "../../../core/character";
import type { RestingExpression } from "../../../core/persona";
import { frameCount, type CharacterPose } from "../poses";
import type { CarriedArt } from "../props";
import { flush, luma, mix, ramp, type Ramp } from "../v2/pixels";
import { drawHead, hairBehind, headSpans, type Head, type View } from "./head";
import { irisOf } from "../../portraits/sculpted";
import { clothColours } from "../cloth";
import { apron, bag, bangles, hoodDown, infant, neckwear, shawl, shoulderCloth, type Figure } from "./extras";
import type { Material } from "../../../content/characters/wardrobe/cloth";
import {
  ACCENT, APRON, BLUSH, DECO, MARK, ORN, PLUME, SMEAR, BOOT, CLOAK, CX, EYE, GLASS, H, HAIR, HAT, INNER, IRIS, KERCHIEF, LEATHER, LEG, LIP, LOWER, PATCH,
  ARMOUR, EMBLEM, FLAG, LIQUID, MATS, STRAW, WOOD, METAL, Mask, SHAWL, SHEATH, SHIELD, STEEL, SKIN, SOLE, STUBBLE, Sheet, TOP, TRIM, VEST, W, WHITE, flat, rnd,
} from "./paint";

// Renderer F, the paper doll. A figure is a few joints in body space, turned
// to one of eight facings and projected straight onto the native grid. Every
// shape is drawn at its final pixel size, so there is nothing to resample:
// a body part is a flat field with a shade band on the side away from the
// light and a dark line round it. Garments, hair and hats are rules over those
// joints, so every kit works in every facing and pose.

/** Feet stand on this row. */
const GY = 77;
/** Body-space row a swimmer's shoulders are sunk to; `SWIM_IMMERSION` is the matching waterline. */
const SWIM_SHOULDER = 13;
export const SWIM_IMMERSION = H - GY + SWIM_SHOULDER - 1;
/** A step forward drops the foot this far down the screen. */
const TILT = 0.25;

type J = [number, number, number];
type Limb = { root: J; mid: J; end: J };
type Rig = {
  legs: Limb[];
  arms: Limb[];
  /** Upper body raised (+) or sunk (-), pixels. */
  rise: number;
  /** Upper body carried forward, pixels at the shoulder. */
  lean: number;
  nod: number;
  seated: boolean;
  blink: boolean;
  /** Which way the stride is swinging, -1 to 1, and whether the body travels:
   * loose cloth and hair follow both a frame late. */
  sway: number;
  moving: boolean;
  /** A held expression that overrides the resting one. */
  face?: Face;
  /** Hair and loose cloth lifted (+) or trailing (-) by the motion. */
  lift: number;
  tilt: number;
  smear?: "hands" | "tool" | "feet";
  /** A held tool's direction from the working hand, in body space. */
  tool?: J;
  /** Which arm is the working one. */
  near: number;
  look: number;
};

export type Face = "o" | "squint" | "grit" | "talk";
/** Hand targets out from the shoulder, up from it, and forward; foot targets
 * out from the hip, up from the ground, and forward. One entry serves both sides. */
type Rel = readonly [number, number, number];
type Key = {
  rise?: number;
  lean?: number;
  nod?: number;
  knee?: number;
  hands?: readonly [Rel, Rel?];
  feet?: readonly [Rel, Rel?];
  face?: Face;
  lift?: number;
  /** The working hand alone, relative to its own shoulder; inward is negative. */
  one?: Rel;
  /** The other hand, the same way. */
  off?: Rel;
  /** Both hands pulled in to within this of the centre line: clasped. */
  mid?: number;
  /** Both hands on one haft: the working hand here, the other lower down it. */
  grip?: Rel;
  /** Where a held tool points from the hand: toward the working side, up, forward. */
  tool?: Rel;
  /** Weight shifted sideways: the shoulders this far over, in pixels. */
  tilt?: number;
  /** Shoulders raised, in pixels. */
  shoulders?: number;
  /** Motion lines behind what moved fastest into this frame. */
  smear?: "hands" | "tool" | "feet";
  /** The head turned a facing to the working side (+) or away (-). */
  look?: number;
};
/**
 * The scene carries a jump through its arc and squashes the sprite at either
 * end; these keys are only the body: anticipation, the stretch of the
 * launch, the tuck at the apex, the reach for the ground, and the weight
 * taken on landing. Four keys a pose, one a frame.
 */
// Tools, by how they are used. `grip` and `tool` are in the working hand's
// frame, so one table serves either hand and every facing. Frame 2 is the
// contact the gameplay waits for.
const chop: readonly Key[] = [
  { grip: [-1.5, 5, -2], tool: [0, 0.5, -1], lean: -0.6 },
  { grip: [-1.5, 6, 0.6], tool: [0, 1, 0.3], lean: 0.3 },
  { grip: [-1.8, -3, 3.6], tool: [0, -0.7, 1], lean: 1.8, rise: -1, knee: 2, smear: "tool" },
  { grip: [-1.5, -1, 2.6], tool: [0, 0.1, 1], lean: 0.6 },
];
const dig: readonly Key[] = [
  { grip: [-1.5, -1, 2], tool: [0, -1, 0.3] },
  { grip: [-1.5, -4, 2.4], tool: [0, -1, 0.15], rise: -1, feet: [[0, 0, 0], [0, 1.6, 1.2]], knee: 2, smear: "hands" },
  { grip: [-1.5, -2, 1], tool: [0, -0.7, 0.7], lean: -0.6 },
  { grip: [-1.5, 0, 2.6], tool: [0, -0.3, 1], lean: 0.3 },
];
const rake: readonly Key[] = [
  { grip: [-1.5, -3, 4.2], tool: [0, -0.5, 1], lean: 1.5, knee: 1.5 },
  { grip: [-1.5, -3, 2.4], tool: [0, -0.6, 1], lean: 0.7 },
  { grip: [-1.5, -3.5, 0.6], tool: [0, -0.7, 1], lean: -0.3, smear: "tool" },
  { grip: [-1.5, -3, 2.8], tool: [0, -0.5, 1], lean: 0.8 },
];
const sickle: readonly Key[] = [
  { one: [2.5, -4, 2], tool: [1, 0.2, 0.6], rise: -2, lean: 1.5, knee: 3 },
  { one: [0, -5, 3], tool: [0.3, 0, 1], rise: -2, lean: 1.6, knee: 3 },
  { one: [-2.6, -5, 2.6], tool: [-1, 0, 0.6], rise: -2, lean: 1.6, knee: 3, smear: "tool" },
  { one: [0, -4, 2], tool: [0.4, 0.2, 1], rise: -1, lean: 1, knee: 2 },
];
const scythe: readonly Key[] = [
  { grip: [2, -2, 0.6], tool: [1, -0.6, 0.4], lean: 0.4, knee: 1.5 },
  { grip: [1, -3, 2], tool: [0.4, -0.7, 1], lean: 0.8, knee: 1.5 },
  { grip: [-2, -3, 2], tool: [-1, -0.6, 0.5], lean: 0.9, knee: 2, smear: "tool" },
  { grip: [-1, -2, 1.2], tool: [-0.4, -0.5, 1], lean: 0.4 },
];
const thrust: readonly Key[] = [
  { grip: [-1.5, -1.5, -1], tool: [0, 0.1, 1], lean: -0.5 },
  { grip: [-1.5, -1, 1], tool: [0, 0.05, 1] },
  { grip: [-1.5, -1, 5.6], tool: [0, 0, 1], lean: 1.8, feet: [[0, 0, 2.6], [0, 0, -1.6]], smear: "hands" },
  { grip: [-1.5, -1.5, 2], tool: [0, 0.1, 1], lean: 0.5 },
];
const stick: readonly Key[] = [
  { one: [2, 0, -1.5], tool: [1, 0.2, -0.5], lean: -0.3 },
  { one: [1, 0, 1], tool: [0.6, 0, 1] },
  { one: [-2, -1, 3], tool: [-0.6, 0, 1], lean: 1.2, smear: "tool" },
  { one: [-1, -2, 2], tool: [-0.2, -0.3, 1], lean: 0.4 },
];

// Trades at their work. Each table is a loop: frame 2 is the stroke that
// lands, where the scene puts its sparks, chips and splashes.
const circle = (i: number, r: number) => [[r, 0], [0, r], [-r, 0], [0, -r]][i];
const trades: Partial<Record<CharacterPose, readonly Key[]>> = {
  // Both hands on a paddle round the pot.
  "work-stir": [0, 1, 2, 3].map((i): Key => {
    const [dx, dz] = circle(i, 1.4);
    return { one: [-4.2 + dx, -4.5, 3.6 + dz], off: [-5 - dx, -7, 3.4 + dz], lean: 0.9, nod: 1, tilt: dx * 0.25 };
  }),
  "work-knead": [
    { hands: [[-3.6, -5, 2.6]], lean: 0.6, nod: 1 },
    { hands: [[-3.6, -5.8, 4]], lean: 1.2, nod: 1 },
    { hands: [[-3.2, -6.8, 5]], lean: 1.9, rise: -1, nod: 1, shoulders: -1 },
    { hands: [[-3.6, -5.6, 3.4]], lean: 1, nod: 1 },
  ],
  // A pestle lifted high and driven down into the mortar.
  "work-pound": [
    { hands: [[-4.6, -3.5, 3.2]], lean: 0.3 },
    { hands: [[-4.6, -1, 3]], lean: -0.3, rise: 1, shoulders: 1 },
    { hands: [[-4.6, -7.5, 3.4]], lean: 1.1, rise: -1, knee: 1.6, nod: 1, smear: "hands" },
    { hands: [[-4.6, -6.5, 3.2]], lean: 0.7, nod: 1 },
  ],
  // The far hand holds the work on the anvil; the hammer comes over from behind the shoulder.
  "work-hammer": [
    { one: [0.5, 2.5, 0.5], off: [-3, -6.5, 4.2], lean: -0.1 },
    { one: [0.6, 7.2, -0.4], off: [-3, -6.5, 4.2], lean: -0.5, shoulders: 1 },
    { one: [-2.2, -6, 5], off: [-3, -6.8, 4.4], lean: 1.2, rise: -1, knee: 1.5, nod: 1, smear: "hands" },
    { one: [-1.6, -4, 4.2], off: [-3, -6.5, 4.2], lean: 0.6, nod: 1 },
  ],
  "work-saw": [0, 1, 2, 3].map((i): Key => {
    const z = [1, 3, 5.2, 3][i];
    return { one: [-1.8, -5 - z * 0.25, z], off: [-3.4, -7.2, 4.6], lean: 0.6 + z * 0.15, nod: 1, smear: i === 2 ? "hands" : undefined };
  }),
  // Low hand driving, high hand steering: the broom's foot sweeps twice as far.
  "work-sweep": [0, 1, 2, 3].map((i): Key => {
    const dx = [-2, -0.5, 2.4, 1][i];
    return { one: [-3 + dx, -6.5, 3], off: [-4.5 - dx, -3, 1.6], lean: 0.8, nod: 1, tilt: dx * 0.3 };
  }),
  "work-write": [0, 1, 2, 3].map((i): Key => ({
    one: [-4 + [0, 0.6, 1.2, 0.5][i], -4.2 + [0, 0.3, -0.2, 0.2][i], 3.8], off: [-4.4, -4.6, 3.4], lean: 0.4, nod: 2,
  })),
  "work-pour": [
    { one: [-2.4, -4.5, 3.4], off: [-4, -6, 4.2] },
    { one: [-2.6, -1, 4], off: [-4, -6, 4.2], nod: 1 },
    { one: [-2.8, -0.6, 4.4], off: [-4, -6, 4.4], nod: 1, lean: 0.4 },
    { one: [-2.6, -3.6, 3.8], off: [-4, -6, 4.2] },
  ],
  // Kneeling at the hand mill, turning the handle round; the other hand feeds the grain.
  "work-quern": [0, 1, 2, 3].map((i): Key => {
    const [dx, dz] = circle(i, 1.4);
    return { one: [-2.6 + dx, -6, 4.2 + dz], off: [-4, -6.5, 3], rise: -4, knee: 4, lean: 1.2, nod: 1, tilt: dx * 0.2 };
  }),
  // On the knees at the metate: the mano pushed out along the stone and drawn back.
  "work-grind": [0, 1, 2, 3].map((i): Key => {
    const z = [2.6, 4, 5.6, 4][i];
    return { hands: [[-3.8, -6.6 - (z - 2.6) * 0.2, z]], rise: -5, knee: 5, lean: 1.6 + z * 0.2, nod: 1, smear: i === 2 ? "hands" : undefined };
  }),
  "work-weave": [
    { one: [-3.4, -5, 4], off: [-3.4, -5, 4], nod: 1, lean: 0.5 },
    { one: [-0.4, -5, 4.2], off: [-3.4, -5, 4], nod: 1, lean: 0.5, tilt: 0.4 },
    // The weft beaten in.
    { one: [-3.6, -5.4, 2.8], off: [-3.6, -5.4, 2.8], nod: 1, lean: 0.2, shoulders: -1 },
    { one: [-3.4, -5, 4], off: [-0.6, -5, 4.2], nod: 1, lean: 0.5, tilt: -0.4 },
  ],
  "work-scrub": [0, 1, 2, 3].map((i): Key => {
    const z = [0, 1.5, 3, 1.5][i];
    return { one: [-3, -7, 2.4 + z], off: [-3.4, -7.2, 5.4 - z], rise: -3, knee: 3, lean: 1.7, nod: 1, tilt: (z - 1.5) * 0.2 };
  }),
  "work-rinse": [
    { hands: [[-3.4, -7, 3.6]], rise: -3, knee: 3, lean: 1.6, nod: 1 },
    { hands: [[-3.3, -9.2, 4.3]], rise: -3, knee: 3, lean: 2.2, nod: 2 },
    { hands: [[-3.6, -6, 3.4]], rise: -3, knee: 3, lean: 1.4, nod: 1, shoulders: 1 },
    { hands: [[-3.4, -7.4, 3.8]], rise: -3, knee: 3, lean: 1.7, nod: 1 },
  ],
  // Hauling a line hand over hand.
  "work-fish": [0, 1, 2, 3].map((i): Key => {
    const p = [0, 0.5, 1, 0.5][i];
    return { one: [-3.2, -3 - 3 * p, 4 - p], off: [-3.2, -6 + 3 * p, 3 + p], rise: -2, knee: 2.5, lean: 1 - p * 0.8, nod: 1 };
  }),
  "work-hang": [
    { hands: [[-2.6, -4, 3.2]] },
    { hands: [[-2.2, 2, 3.4]], lean: -0.3 },
    { hands: [[-1.8, 4.2, 3.6]], lean: -0.5, rise: 1, shoulders: 1, nod: -1 },
    { hands: [[-2.2, 1, 3.4]], lean: -0.2 },
  ],
  // Squatting along the row: reach, pick, lift it to the other hand.
  "work-tend": [
    { one: [-2.4, -7.6, 4], off: [-1.4, -6.4, 2], rise: -3, knee: 3, lean: 1.5, nod: 1 },
    { one: [-2.8, -9, 5.2], off: [-1.4, -6.4, 2], rise: -3, knee: 3, lean: 2, nod: 2 },
    { one: [-2.6, -9.4, 5], off: [-1.4, -6.4, 2], rise: -3, knee: 3, lean: 2.1, nod: 2, tilt: 0.4 },
    { one: [-1.6, -5.6, 2.6], off: [-1.4, -6.4, 2], rise: -2, knee: 2.5, lean: 1.2, nod: 1 },
  ],
  "work-sort": [
    { one: [-3.6, -5, 4], off: [-3, -5.6, 3.2], nod: 1, lean: 0.4 },
    { one: [-2.6, -4.6, 4.6], off: [-3, -5.6, 3.2], nod: 1, lean: 0.5 },
    { one: [-0.6, -5.2, 4.2], off: [-3, -5.6, 3.2], nod: 1, lean: 0.5, tilt: 0.5 },
    { one: [-2.2, -5, 3.6], off: [-3, -5.6, 3.2], nod: 1, lean: 0.4 },
  ],
  // Hands behind the back, bent to look the work over.
  "work-check": [
    { hands: [[-2.6, -6, -1.6]], lean: 0.5 },
    { hands: [[-2.6, -6, -1.6]], lean: 0.9, nod: 1 },
    { hands: [[-2.6, -6, -1.6]], lean: 1, nod: 2 },
    { hands: [[-2.6, -6, -1.6]], lean: 0.6, nod: 1, tilt: 0.4 },
  ],
  // The lute across the body: strumming hand at the bowl, the other up the neck.
  "play-strum": [0, 1, 2, 3].map((i): Key => ({
    one: [-2.4, -5.6 + [0, -1.2, 0.6, -0.6][i], 3.4], off: [-0.6, -1.6, 3.6 + [0, 0.3, 0, -0.3][i]],
    nod: i === 2 ? 1 : 0, tilt: [0, 0.4, 0.6, 0.2][i],
  })),
  "play-drum": [0, 1, 2, 3].map((i): Key => {
    const up = i % 2 === 0;
    return { one: [-3.4, up ? -3.6 : -5.8, 3.8], off: [-3.4, up ? -5.8 : -3.6, 3.8], nod: i === 2 ? 1 : 0, rise: i === 2 ? -1 : 0 };
  }),
  // Held out to the working side from the lips; the far hand crosses to the mouth.
  "play-flute": [0, 1, 2, 3].map((i): Key => ({
    one: [-2.4, 3.4 + [0, 0.3, 0, -0.3][i], 3], off: [-6.4, 3.6, 2.6], tilt: [0, 0.5, 0.8, 0.3][i], lean: -0.2,
  })),
  pray: [
    { hands: [[-4, -2, 2.6]], mid: 0.6 },
    { hands: [[-4, -1.6, 2.8]], mid: 0.6, nod: 1, lean: 0.8 },
    { hands: [[-4, -1.4, 3]], mid: 0.6, nod: 2, lean: 2.2 },
    { hands: [[-4, -1.8, 2.8]], mid: 0.6, nod: 1, lean: 0.9 },
  ],
  cense: [0, 1, 2, 3].map((i): Key => ({ one: [-1.4, -1.5 + [0, 0.6, 1.2, 0.6][i], 3 + [0, 1, 2, 1][i]], off: [-4.4, -3, 2.4], nod: 1 })),
  call: [
    { one: [-3.6, 2, 2.4], off: [-0.5, -6, 2], face: "talk" },
    { one: [-3.8, 3, 2.8], off: [-0.5, -6, 2], lean: -0.6, shoulders: 1, face: "o" },
    { one: [-3.8, 3.2, 2.8], off: [-0.5, -6, 2], lean: -0.9, shoulders: 1, nod: -1, face: "o" },
    { one: [-3.6, 2.2, 2.4], off: [-0.5, -6, 2], lean: -0.2, face: "talk" },
  ],
};

// Greetings and the give and take between two people. One-handed gestures
// use the far hand, so a held spear or ledger stays where it is.
const social: Partial<Record<CharacterPose, readonly Key[]>> = {
  bow: [{ nod: 1, lean: 0.6 }, { nod: 2, lean: 2.2 }, { nod: 2, lean: 3.2, rise: -1 }, { nod: 1, lean: 1 }],
  "fist-salute": [
    { hands: [[-3, -4, 2.6]], mid: 1 },
    { hands: [[-4, -1, 3.6]], mid: 0.8, nod: 1, lean: 0.6 },
    { hands: [[-4, -0.6, 3.9]], mid: 0.8, nod: 2, lean: 1.6 },
    { hands: [[-4, -1, 3.4]], mid: 0.8, nod: 1, lean: 0.5 },
  ],
  palms: [
    { hands: [[-3, -3, 2]], mid: 1 },
    { hands: [[-4, 0.5, 2.4]], mid: 0.5, nod: 1 },
    { hands: [[-4, 1, 2.4]], mid: 0.5, nod: 2, lean: 1.3 },
    { hands: [[-4, 0.5, 2.2]], mid: 0.5, nod: 1, lean: 0.4 },
  ],
  salaam: [
    { one: [-2, -5, 1.5] },
    { one: [-4.2, -1.4, 2.4], nod: 1 },
    { one: [-4.2, -1.2, 2.4], nod: 2, lean: 1.3 },
    { one: [-4.2, -1.4, 2.4], nod: 1, lean: 0.4 },
  ],
  doff: [
    { one: [-1, 1, 2] },
    { one: [-0.8, 7, 1.8], nod: 1 },
    { one: [0.6, 6, 3.4], nod: 1, lean: 0.9 },
    { one: [-0.5, 6.6, 1.8], lean: 0.3 },
  ],
  // The skirt held out at either side, a knee bent behind the other.
  curtsy: [
    { hands: [[0.6, -7.5, 1.2]] },
    { hands: [[1, -7, 1.6]], rise: -1, knee: 2, nod: 1, feet: [[0, 0, 0], [0, 0.4, -1.2]] },
    { hands: [[1.2, -7, 1.8]], rise: -2, knee: 3, nod: 2, lean: 0.4, feet: [[0, 0, 0.4], [0, 0.6, -1.8]] },
    { hands: [[0.8, -7.2, 1.4]], rise: -1, knee: 1, nod: 1 },
  ],
  clap: [
    { hands: [[-1, -2.5, 3.4]] },
    { hands: [[-4, -2.5, 3.4]], mid: 0.4, nod: 1 },
    { hands: [[-1, -2.5, 3.4]], nod: 1, lean: 0.5 },
    { hands: [[-4, -2.5, 3.4]], mid: 0.4, nod: 1, lean: 0.7 },
  ],
  "raise-hand": [{ one: [0, 0, 1.5] }, { one: [0.6, 5, 1.6] }, { one: [0.6, 5.4, 1.8], nod: 1 }, { one: [0.6, 5, 1.6] }],
  "halt-hand": [
    { one: [-1, -1, 3] },
    { one: [-1.2, 3.4, 5], lean: -0.3 },
    { one: [-1.2, 3.8, 5.2], lean: -0.4, nod: -1 },
    { one: [-1.2, 3.4, 5], lean: -0.3 },
  ],
  listen: [
    { hands: [[-4, -6, 2]], mid: 0.6 },
    { hands: [[-4, -6, 2]], mid: 0.6, nod: 1, lean: 0.6 },
    { hands: [[-4, -6, 2]], mid: 0.6 },
    { hands: [[-4, -6, 2]], mid: 0.6, tilt: 0.6, feet: [[0, 0, 0], [0, 0.6, 0.6]], knee: 1 },
  ],
  "fold-arms": [
    { hands: [[-5.6, -4, 2.4]] },
    { hands: [[-5.6, -4, 2.4]], tilt: 0.6, feet: [[0, 0, 0], [0, 0.6, 0.6]], knee: 1 },
    { hands: [[-5.6, -4, 2.4]], tilt: 0.6, nod: -1, feet: [[0, 0, 0], [0, 0.6, 0.6]], knee: 1 },
    { hands: [[-5.6, -4, 2.4]] },
  ],
  gesture: [
    { hands: [[0.6, -5, 3.6]] },
    { one: [0, -3, 4.2], off: [0.6, -5, 3.4], face: "talk" },
    { hands: [[1.2, -4, 3.6]], nod: 1, shoulders: 1 },
    { one: [0.4, -4.6, 3.8], off: [0, -3.4, 4], face: "talk" },
  ],
  "shake-head": [-1, 1, -1, 0].map((look): Key => ({ look, off: [0.8, -4, 3.6] })),
  receive: [
    { hands: [[-2.5, -4, 4.6]], mid: 1.2 },
    { hands: [[-2.5, -3.6, 5.8]], mid: 1, lean: 0.8 },
    { hands: [[-2.8, -4.4, 3.4]], mid: 0.8, nod: 1 },
    { one: [-1.5, -5, 2.4], off: [-2.8, -5, 2] },
  ],
  pay: [0, 1, 2, 3].map((i): Key => ({
    one: i & 1 ? [-2, -3.4, 5.6] : [-3.4, -3.6, 3.2], off: [-3, -4, 3], lean: i & 1 ? 0.6 : 0.2, nod: 1,
  })),
};
/** Poses whose tool the painter draws itself, so a held icon is put away. */
const tooled = new Set<CharacterPose>(["work-stir", "work-pound", "work-hammer", "work-saw", "work-sweep", "work-write", "work-pour", "play-strum", "play-drum", "play-flute", "pray", "cense"]);

const actions: Partial<Record<CharacterPose, readonly Key[]>> = {
  ...trades,
  ...social,
  ...Object.fromEntries((["chop", "axe-chop", "pick-strike", "swing", "carve"] as const).map((p) => [p, chop])),
  ...Object.fromEntries((["dig", "shovel-dig", "till"] as const).map((p) => [p, dig])),
  ...Object.fromEntries((["sickle-cut", "reap", "slash"] as const).map((p) => [p, sickle])),
  ...Object.fromEntries((["thrust", "spear-thrust", "pitchfork-jab", "knife-thrust"] as const).map((p) => [p, thrust])),
  "rake-pull": rake,
  "scythe-sweep": scythe,
  "stick-swing": stick,
  "spear-throw": [
    { one: [0.5, 3, -2.6], tool: [0, 0.3, 1], lean: -0.8 },
    { one: [0, 4, -1], tool: [0, 0.4, 1], lean: -0.3 },
    { one: [0, 1, 4.2], lean: 1.8, feet: [[0, 0, 2.4], [0, 0, -1.4]], smear: "hands" },
    { one: [-1, -3, 3], lean: 0.8 },
  ],
  // Bow in the far hand, string hand to the cheek, then the snap back past the ear.
  draw: [
    { off: [-2.2, -2, 4], one: [-3, -2.5, 3.4], feet: [[0, 0, 1.4], [0, 0, -1.4]] },
    { off: [-2.4, 0, 5.6], one: [-3.2, 0.6, 2.4], lean: -0.2, feet: [[0, 0, 1.6], [0, 0, -1.6]] },
    { off: [-2.4, 0.6, 6.2], one: [-3.6, 2.4, 0.2], lean: -0.5, face: "squint", feet: [[0, 0, 1.6], [0, 0, -1.6]] },
    { off: [-2.4, 1.4, 5.8], one: [-2.2, 3.2, -2.6], lean: -1, smear: "hands", feet: [[0, 0, 1.6], [0, 0, -1.6]] },
  ],
  cast: [
    { grip: [-1.5, 4, -1.6], tool: [0, 0.8, -0.6], lean: -0.5 },
    { grip: [-1.5, 5, 0.4], tool: [0, 1, 0.2] },
    { grip: [-1.5, 0, 3], tool: [0, 0.3, 1], lean: 1, smear: "tool" },
    { grip: [-1.5, -1, 2.6], tool: [0, 0.2, 1], lean: 0.4 },
  ],
  // The pauses between other things: weight shifted, clothes tugged straight,
  // a hat set right, a hand to the chin, a look at what is held.
  sway: [{}, { tilt: 1, feet: [[0, 0, 0], [0, 0.6, 0.6]], knee: 1 }, { tilt: 1.2, feet: [[0, 0, 0], [0, 0.6, 0.6]], knee: 1 }, { tilt: 0.4 }],
  straighten: [
    { hands: [[-2, -6, 1.5]] },
    { hands: [[-2.4, -7, 1.8]], shoulders: 1 },
    { hands: [[-2.4, -6.5, 1.6]], nod: 1 },
    {},
  ],
  "adjust-hat": [
    { one: [0, 3, 1.5] },
    { one: [-0.5, 7, 1.6], nod: 1 },
    { one: [-0.5, 7, 2], nod: 1 },
    { one: [0.3, 2, 1] },
  ],
  "touch-face": [
    { one: [-1, 0, 2] },
    { one: [-2.6, 3, 2.6], nod: 1 },
    { one: [-2.6, 3.4, 2.6], nod: 1, tilt: 0.5 },
    { one: [-1, -2, 1.5] },
  ],
  "inspect-held": [
    { one: [-1.5, -2, 3] },
    { one: [-2, -1, 3.6], nod: 2 },
    { one: [-2, -0.5, 3.6], nod: 2 },
    { one: [-1, -3, 2.6], nod: 1 },
  ],
  shrug: [{}, { hands: [[1.6, -2, 1.8]], shoulders: 1, nod: -1 }, { hands: [[2, -1.5, 2]], shoulders: 1, nod: -1 }, { shoulders: 0 }],
  nod: [{}, { nod: 1 }, { nod: 2 }, { nod: 1 }],
  breathe: [{}, { shoulders: 1 }, { shoulders: 1 }, {}],
  jump: [
    { rise: -5, lean: 2.2, knee: 5, hands: [[0.3, -5, -3.2]], lift: 0 },
    { rise: 1, lean: 0.6, feet: [[0, 1.5, -1.2]], hands: [[3, 2.5, -1.2]], lift: -1, smear: "feet" },
    { rise: 1, knee: 4, feet: [[0.4, 4.5, 1]], hands: [[2.6, 1.5, 0.5]], lift: 2 },
    { feet: [[0.3, 1, 0.6]], knee: 1, hands: [[1.6, 2, 1]], lift: 1 },
  ],
  land: [
    { rise: -6, lean: 2.6, knee: 6, hands: [[1.8, -5.5, 3]], lift: -2 },
    { rise: -4, lean: 1.6, knee: 4, hands: [[1.2, -6, 2.4]], lift: -1 },
    { rise: -1, lean: 0.4, knee: 1 },
    { rise: 0 },
  ],
  stumble: [
    { rise: -1, lean: 3, feet: [[0, 0, 3.8], [0, 1.5, -2.6]], knee: 2, hands: [[2.4, 1, 2.6], [2.8, -1, -1.8]], face: "o" },
    { rise: -2, lean: 3.6, feet: [[0, 0, 1.4], [0, 2.5, 2.6]], knee: 3, hands: [[2.8, 2, 1.8], [2.4, 0, 2.6]], face: "o" },
    { rise: -1, lean: 1.2, feet: [[0, 0, 0.6], [0, 0, -0.6]], hands: [[1.2, -4, 1.6]] },
    { lean: 0.3 },
  ],
  startle: [
    { lean: -0.5, hands: [[0.8, -3, 1.5]], face: "o" },
    { rise: 2, lean: -2.2, feet: [[0.3, 1, -0.8]], hands: [[1.4, 3.5, 0.8]], face: "o", lift: 2 },
    { lean: -1, hands: [[1.1, -1, 1.5]], face: "o" },
    { lean: -0.3, hands: [[0.6, -4.5, 0.8]] },
  ],
  hurt: [
    { lean: -1.5, nod: -1, hands: [[0.4, -3, 1.6]], face: "squint" },
    { rise: -1, lean: -2.6, knee: 1.5, nod: -1, hands: [[0.2, -3.5, 2.2]], face: "grit" },
    { lean: -1, hands: [[0.5, -4.5, 1.2]], face: "squint" },
    { lean: -0.3 },
  ],
  skid: [
    { rise: -1, lean: -1.6, knee: 2, feet: [[0, 0, 3], [0, 0, -1.2]], hands: [[1.6, -2, -2.2]] },
    { rise: -2, lean: -2.4, knee: 2.5, feet: [[0, 0, 3.6], [0, 0, -1]], hands: [[2, -1, -2.6]] },
    { rise: -1, lean: -1.2, knee: 2, feet: [[0, 0, 2.6], [0, 0, -0.8]], hands: [[1.4, -2.5, -1.6]] },
    { lean: -0.4, feet: [[0, 0, 1], [0, 0, -0.4]] },
  ],
  climb: [
    { lean: 0.6, hands: [[0.2, 7, 1.4], [0.8, 3, 1.4]], feet: [[0, 4, 1], [0, 0, 0]], knee: 3 },
    { rise: 1, lean: 0.6, hands: [[0.4, 5, 1.4], [0.6, 5, 1.4]], feet: [[0, 2.5, 0.8], [0, 1, 0.4]], knee: 2 },
    { lean: 0.6, hands: [[0.8, 3, 1.4], [0.2, 7, 1.4]], feet: [[0, 0, 0], [0, 4, 1]], knee: 3 },
    { rise: 1, lean: 0.6, hands: [[0.6, 5, 1.4], [0.4, 5, 1.4]], feet: [[0, 1, 0.4], [0, 2.5, 0.8]], knee: 2 },
  ],
  hang: [
    { hands: [[0.2, 7.5, 1.2]], feet: [[0.2, 1, 0.4]], lift: -1 },
    { hands: [[0.2, 7.5, 1.2]], feet: [[0.2, 1, 1.4]], knee: 1.5 },
    { rise: 2, hands: [[0.8, 4.5, 1.6]], feet: [[0, 4, 1.2]], knee: 3 },
    { rise: 3, lean: 2, hands: [[1, 2, 2.5]], feet: [[0, 6, 2], [0, 2, 0]], knee: 3 },
  ],
  kick: [
    { lean: 1.5, feet: [[0, 1.5, 2], [0, 0, -1.5]], hands: [[1, -3, -1.5], [1, -3, 1.5]] },
    { rise: 1, lean: -0.5, feet: [[0, 6, 3], [0, 0, -0.5]], knee: 3, hands: [[1.4, -2, -2]] },
    { rise: 2, lean: -1, feet: [[0, 3, -2], [0, 2, -1]], hands: [[1.6, 5, 0.5]], lift: 1 },
    { rise: 0, feet: [[0, 1, 0.5]], hands: [[1, 4, 2]] },
  ],
  roll: [
    { rise: -4, lean: 2.2, knee: 4, nod: 2, hands: [[0.4, -5, 2.6]] },
    { rise: -5, lean: 2.6, knee: 5, nod: 2, hands: [[0.2, -5.5, 2.8]] },
    { rise: -5, lean: 2.6, knee: 5, nod: 2, hands: [[0.2, -5.5, 2.8]] },
    { rise: -2, lean: 1, knee: 2, hands: [[1, -5, 2]] },
  ],
};

type Dims = {
  child: boolean;
  female: boolean;
  leg: number;
  /** The leg garments are cut to: G's extra length shows below the hem. */
  cut: number;
  torso: number;
  hip: number;
  shoulder: number;
  shoulderW: number;
  waistW: number;
  hipW: number;
  chestD: number;
  bellyD: number;
  upper: number;
  fore: number;
};

/** Renderer G, F's A/B candidate: legs that show below the hem, a waist, arms
 * that reach the hip and a fuller stride. Set only while `drawCharacterG` runs. */
let g = false;

function dims(a: CharacterAppearance): Dims {
  const child = a.height === -2;
  const female = a.physique?.sex === "female" && !child;
  // Short, medium, tall and tallest; children share one size.
  const step = Math.max(0, a.height + 1);
  const leg = (child ? 5 : (female ? [6, 7, 8, 9] : [7, 8, 9, 9])[step]) + (g ? (child ? 1 : 3) : 0);
  const torso = child ? 7 : (female ? [9, 9, 10, 10] : [9, 10, 10, 11])[step];
  const build = child ? 0 : [0, 0.5, 1, 1.5][a.build + 1];
  const shape = a.bodyShape ?? "straight";
  const shoulderW = (child ? 4.5 : female ? 5 : 6) + build + (shape === "tapered" ? 0.5 : 0);
  const hip = 2 + leg;
  return {
    child,
    female,
    leg,
    cut: leg - (g ? (child ? 1 : 3) : 0),
    torso,
    hip,
    shoulder: hip + torso,
    shoulderW,
    waistW: (child ? 4 : female ? 4.5 : 5.5) + build + (shape === "rounded" ? 1 : shape === "tapered" ? -0.5 : 0) - (g && !child ? 0.75 : 0),
    hipW: (child ? 4 : female ? 5.5 : 5) + build,
    chestD: 3.5 + build / 2,
    bellyD: 3 + build / 2 + (shape === "rounded" ? 1 : 0),
    upper: child ? 2.6 : g ? 4 : 3.4,
    fore: child ? 2.6 : g ? 4 : 3.4,
  };
}

// ------------------------------------------------------------------ the pose

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const sub = (a: J, b: J): J => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const len = (a: J) => Math.hypot(a[0], a[1], a[2]);

/** Two bones from root toward a target, the middle joint bent toward `pole`. */
function ik(root: J, target: J, l1: number, l2: number, pole: J): Limb {
  let d = sub(target, root);
  let dist = len(d);
  if (dist > l1 + l2 - 0.01) {
    const k = (l1 + l2 - 0.01) / dist;
    d = [d[0] * k, d[1] * k, d[2] * k];
    dist = l1 + l2 - 0.01;
  }
  const end: J = [root[0] + d[0], root[1] + d[1], root[2] + d[2]];
  const u: J = [d[0] / (dist || 1), d[1] / (dist || 1), d[2] / (dist || 1)];
  const a = (l1 * l1 - l2 * l2 + dist * dist) / (2 * (dist || 1));
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const pd = pole[0] * u[0] + pole[1] * u[1] + pole[2] * u[2];
  let b: J = [pole[0] - u[0] * pd, pole[1] - u[1] * pd, pole[2] - u[2] * pd];
  const bl = len(b) || 1;
  b = [b[0] / bl, b[1] / bl, b[2] / bl];
  return { root, end, mid: [root[0] + u[0] * a + b[0] * h, root[1] + u[1] * a + b[1] * h, root[2] + u[2] * a + b[2] * h] };
}

const swings = new Set<CharacterPose>([
  "swing", "chop", "dig", "reap", "till", "axe-chop", "pick-strike", "stick-swing", "shovel-dig", "rake-pull",
  "sickle-cut", "scythe-sweep", "slash", "carve", "cast", "whirl", "spin", "plunge",
]);
// A crossbow or a gun brought up level to the shoulder, then the kick.
const levelled: readonly Key[] = [
  { one: [-2.6, -2, 3], off: [-2.4, -1.5, 5], tool: [0, 0.6, 1], feet: [[0, 0, 1.2], [0, 0, -1.2]] },
  { one: [-3, 0.6, 2], off: [-2.4, 0.4, 5.2], tool: [0, 0.08, 1], feet: [[0, 0, 1.4], [0, 0, -1.4]] },
  { one: [-3, 0.6, 2], off: [-2.4, 0.4, 5.2], tool: [0, 0.08, 1], face: "squint", feet: [[0, 0, 1.4], [0, 0, -1.4]] },
  { one: [-3, 1.6, 0.8], off: [-2.4, 1.8, 4.4], tool: [0, 0.5, 1], lean: -1, face: "squint", feet: [[0, 0, 1.4], [0, 0, -1.4]] },
];
// A blowgun held at the lips in both hands, the far one out along the tube.
const blowing: readonly Key[] = [
  { one: [-3.4, 1, 2.4], off: [-3, 0.6, 4], tool: [0, 0.4, 1] },
  { one: [-3.6, 2.6, 1.6], off: [-3.2, 2.2, 4.4], tool: [0, 0.12, 1] },
  { one: [-3.6, 2.6, 1.6], off: [-3.2, 2.2, 4.4], tool: [0, 0.12, 1], face: "squint" },
  { one: [-3.6, 2.6, 1.6], off: [-3.2, 2.2, 4.4], tool: [0, 0.12, 1], face: "o", lean: 0.4 },
];
const thrusts = new Set<CharacterPose>(["thrust", "spear-thrust", "spear-throw", "knife-thrust", "pitchfork-jab"]);
const crouches = new Set<CharacterPose>(["pickup", "drop", "stoop", "kneel", "work-fish", "work-rinse", "work-tend"]);

function posed(d: Dims, a: CharacterAppearance, pose: CharacterPose, frame: number, sx: 1 | -1, prop?: CarriedArt, condition = 0): Rig {
  const hipX = d.child ? 2 : 2.5;
  const sh = d.shoulder - 1;
  const shX = d.shoulderW - 0.6;
  let rise = 0,
    lean = 0,
    nod = 0,
    seated = false,
    blink = false,
    sway = 0,
    moving = false,
    face: Face | undefined,
    lift = 0,
    tilt = 0,
    shoulders = 0,
    smear: Key["smear"],
    tool: J | undefined,
    look = 0;
  const feet: { at: J; knee?: number }[] = [
    { at: [hipX, 2, 0] },
    { at: [-hipX, 2, 0] },
  ];
  // Hands hang just clear of the hip.
  const hang = (side: number, fz = 0, dy = 0): J => [side * (d.shoulderW + 0.4), sh - d.upper - d.fore + 0.8 + dy, fz];
  const hands: J[] = [hang(1), hang(-1)];
  // The working hand is the one on the viewer's side when the figure turns.
  const near = sx > 0 ? 1 : 0,
    ns = near ? -1 : 1;
  const tired = condition >= 3;
  // G carries age in the body: lined and weathered faces are 55 and over.
  const elder = g && !d.child && (a.face?.detail === "lines" || a.face?.detail === "weathered");
  const load = Math.min(2, condition % 3);
  const posture = a.posture ?? "upright";
  const step = (stride: number, lift: number, swing: number, run: boolean) => {
    const p = (frame / 8) * Math.PI * 2;
    for (const [i, side] of [[0, 1], [1, -1]] as const) {
      const ph = side > 0 ? p : p + Math.PI;
      const fz = stride * Math.sin(ph);
      const up = Math.max(0, Math.cos(ph)) * lift;
      feet[i] = { at: [side * hipX * 0.9, 2 + up, fz], knee: 0.6 + up * 0.5 };
      const s = -swing * Math.sin(ph);
      hands[i] = run
        ? [side * (d.shoulderW + 0.3), sh - d.upper - 0.5 + Math.max(0, s) * 0.4, s]
        : hang(side, s, Math.abs(s) * (g ? 0.35 : 0.2));
      // G: the forward hand crosses the body and the back one swings wide, so the swing shows head-on.
      if (g && !run) hands[i][0] -= side * s * 0.35;
    }
    const contact = frame % 4 === 2;
    rise = run ? (frame % 4 === 0 ? 1 : contact ? -1 : 0) : contact ? -1 : 0;
    sway = Math.sin(p) * (run ? 1.4 : 1);
    // G: the shoulders rock over the leading foot.
    if (g) tilt = Math.sin(p) * 0.6;
    moving = true;
    // The run's passing frames leave the ground: both feet up.
    if (run && frame % 4 === 0) for (const f of feet) f.at[1] += 1;
  };

  const key = (pose === "draw" && prop && prop.kind !== "bow" ? (prop.sprite === "icon:blowgun" ? blowing : levelled) : actions[pose])?.[frame & 3];
  if (key) {
    // Two-sided targets: index 0 is the figure's left.
    const hand = (side: number, r: Rel): J => [side * (d.shoulderW + r[0]), sh + r[1], r[2]];
    const foot = (side: number, r: Rel): J => [side * (hipX + r[0]), 2 + r[1], r[2]];
    if (key.hands) [1, -1].forEach((side, i) => (hands[i] = hand(side, key.hands![i] ?? key.hands![0])));
    [1, -1].forEach((side, i) => {
      const r = key.feet?.[i] ?? key.feet?.[0];
      feet[i] = { at: r ? foot(side, r) : feet[i].at, knee: key.knee ?? 0.6 };
    });
    rise = key.rise ?? 0;
    lean = key.lean ?? 0;
    nod = key.nod ?? 0;
    face = key.face;
    lift = key.lift ?? 0;
    tilt = key.tilt ?? 0;
    shoulders = key.shoulders ?? 0;
    smear = key.smear;
    look = key.look ?? 0;
    if (key.one && prop && pose in social && !key.off) hands[1 - near] = hand(-ns, key.one);
    else if (key.one) hands[near] = hand(ns, key.one);
    if (key.off) hands[1 - near] = hand(-ns, key.off);
    if (key.mid !== undefined) for (const h of hands) h[0] = Math.sign(h[0]) * Math.min(Math.abs(h[0]), key.mid);
    if (key.tool) tool = [ns * key.tool[0], key.tool[1], key.tool[2]];
    if (key.grip) {
      hands[near] = hand(ns, key.grip);
      // The other hand lower on the haft, along the tool.
      const ax = tool ?? [0, -1, 0];
      const n = Math.hypot(ax[0], ax[1], ax[2]) || 1;
      hands[1 - near] = [hands[near][0] - (ax[0] / n) * 2, hands[near][1] - (ax[1] / n) * 2, hands[near][2] - (ax[2] / n) * 2];
    }
  } else if (pose === "walk" || pose === "setoff" || pose === "halt" || pose === "wade" || pose === "carry") {
    const f = pose === "walk" || pose === "carry" ? frame : pose === "setoff" ? [1, 2, 3, 3][frame & 3] : [2, 1, 0, 0][frame & 3];
    frame = f;
    const kind = prop?.sprite.slice(5);
    const yoked = shouldered(kind), armed = !!kind && /^(spear|halberd|glaive|musket|rifle|crossbow|macuahuitl)$/.test(kind);
    const devout = kind === "beads" || kind === "alms-bowl" || kind === "censer";
    const slow = (1 - load * 0.15 - (tired ? 0.15 : 0)) * (yoked ? 0.72 : devout ? 0.75 : 1);
    const old = elder ? 0.75 : 1;
    step((pose === "wade" ? 2 : g ? 5 : 4) * slow * old, (g ? 2.4 * old : 1.6) * (yoked ? 0.6 : 1), (g ? 4.4 : 3.2) * slow * old * old * (armed ? 1.25 : 1), false);
    if (tired || elder) nod = 1;
    if (elder) lean = 0.5;
    // A yoke rides on bent knees and drops hard on each footfall; the pole springs it back.
    if (yoked) {
      for (const f of feet) f.knee = (f.knee ?? 0.6) + 1.4;
      rise = frame % 4 === 2 ? -2 : frame % 4 === 3 ? -1 : 0;
      lean = Math.max(lean, 0.6);
    }
    // A march: the head held level and the free arm swung stiff.
    if (armed) {
      nod = 0;
      tilt = 0;
      lean = -0.2;
      rise = frame % 4 === 2 ? -1 : 0;
    }
    if (devout) nod = 1;
    // The cane goes down with the far foot, so it and the near foot alternate.
    if (kind === "walking-cane") hands[near] = [ns * (d.shoulderW + 0.6), hands[near][1], feet[1 - near].at[2] * 0.8 + 1.5];
    // Setting off leans into the push; halting braces back against it.
    if (pose === "setoff") lean = 0.9;
    if (pose === "halt") lean = -0.7;
  } else if (pose === "run") {
    step(g ? 6.2 : 5.4, g ? 4 : 3.4, g ? 4.6 : 3.4, true);
    lean = g ? 2.8 : 2;
    // G pumps bent arms higher and drives the head forward.
    if (g) {
      for (const h of hands) h[1] += 1.5;
      nod = 1;
    }
  } else if (pose === "swim" || pose === "tread") {
    // Sunk to one shoulder height for every body, so the scene's waterline is a constant.
    const beat = frame & 3, w = d.shoulderW;
    rise = SWIM_SHOULDER - sh + (pose === "swim" ? [0, 0, 1, 1] : [0, 1, 1, 0])[beat];
    const hip = d.hip + rise;
    if (pose === "swim") {
      // Breaststroke: glide, sweep out, pull to the chest, shoot forward. A frog kick behind.
      // Raised by TILT times the reach so the hands break the surface in front, where reach drops them down the screen.
      const reach: J[] = [[1, sh + 0.5 + 7 * TILT, 7], [w + 4, sh + 0.5 + 4 * TILT, 4], [w - 1, sh - 2.5, 1.5], [1.5, sh - 0.5, 4]];
      const kick: J[] = [[hipX * 0.6, hip, -9], [hipX, hip + 1, -8], [hipX + 2.5, hip, -5], [hipX + 4, hip, -8]];
      const [hx, hy, hz] = reach[beat], [fx, fy, fz] = kick[beat];
      hands[0] = [hx, hy, hz];
      hands[1] = [-hx, hy, hz];
      feet[0] = { at: [fx, fy, fz], knee: beat === 2 ? 3 : 0.6 };
      feet[1] = { at: [-fx, fy, fz], knee: beat === 2 ? 3 : 0.6 };
      lean = 1.2;
    } else {
      const out = [w + 2.5, w + 1, w + 2.5, w + 4][beat];
      hands[0] = [out, sh - 3.5, 2.5];
      hands[1] = [-out, sh - 3.5, 2.5];
      feet[0] = { at: [hipX + 1, hip - 6 + (beat & 1), 2 - (beat & 1) * 2], knee: 2 };
      feet[1] = { at: [-hipX - 1, hip - 6 + (~beat & 1), (beat & 1) * 2], knee: 2 };
    }
    blink = pose === "tread" && beat === 3;
    moving = pose === "swim";
  } else if (pose === "idle" || pose === "breathe" || pose === "straighten" || pose === "recover") {
    blink = frame === 3;
    if (pose === "breathe" && (frame === 1 || frame === 2)) rise = 1;
    // G's idle: a breath in, then weight settled on one leg (the scene holds each).
    if (g && pose === "idle" && frame === 1) rise = 1;
    if (elder) (lean = Math.max(lean, 0.5)), (nod = 1);
    // G: a sword at the hip gets a hand resting on its hilt.
    const blade = a.wearing.sidearm;
    if (g && !prop && posture === "upright" && (blade === "sword" || blade === "sabre" || blade === "katana")) hands[0] = [d.hipW + 1, d.hip + 3.2, 3];
    if (g && pose === "idle" && frame === 2) {
      tilt = 0.6;
      feet[1] = { at: [-hipX, 2.6, 0.8], knee: 1.6 };
    }
    if (posture === "hands-together") hands[0] = hands[1] = [0, sh - d.upper - 2, 1.8];
    if (posture === "hand-on-hip") hands[near] = [ns * (d.waistW + 1.2), d.hip + 1.5, 0];
    if (posture === "stooped") (lean = 1), (nod = 1);
  } else if (pose === "talk" || pose === "give" || pose === "point" || pose === "beckon" || pose === "inspect-held") {
    const up = frame === 1 || frame === 2;
    if (pose === "talk") hands[near] = up ? [ns * (1.5 + d.shoulderW * 0.5), sh - 3, 2.5] : hands[near];
    // G's talker moves the mouth on alternate frames and nods on the stress.
    if (g && pose === "talk") {
      if (frame & 1) face = "talk";
      if (frame === 2) nod = 1;
    }
    else if (pose === "point" || pose === "give") hands[near] = [ns * d.shoulderW * 0.6, sh - (up ? 1 : 2.5), up ? 6 : 4];
    else if (pose === "beckon") hands[near] = [ns * d.shoulderW * 0.7, sh - (frame & 1 ? 1 : 2.5), 4];
    else hands[near] = [ns * 1.5, sh - 3, 3];
  } else if (pose === "wave") {
    hands[near] = [ns * (d.shoulderW + (frame & 1 ? 2.2 : 0.8)), sh + 4.5, 0.5];
  } else if (pose === "nod") {
    nod = frame === 1 || frame === 2 ? 1 : 0;
  } else if (pose === "adjust-hat" || pose === "touch-face") {
    hands[near] = pose === "adjust-hat" ? [ns * d.shoulderW * 0.6, sh + 7, 1.5] : [ns * 2.5, sh + 2, 2.5];
  } else if (pose === "shrug") {
    const up = frame === 1 || frame === 2;
    hands[0] = [d.shoulderW + 2, sh - (up ? 2 : 4), 1.5];
    hands[1] = [-(d.shoulderW + 2), sh - (up ? 2 : 4), 1.5];
  } else if (pose === "sit" || pose === "sit-seat") {
    seated = true;
    const drop = pose === "sit" ? d.leg - 1 : Math.round(d.leg * 0.45);
    rise = -drop;
    feet[0] = { at: [hipX, 2, pose === "sit" ? d.leg * 0.9 : 3], knee: 3 };
    feet[1] = { at: [-hipX, 2, pose === "sit" ? d.leg * 0.9 : 3], knee: 3 };
    hands[0] = [d.shoulderW * 0.7, d.hip - drop + 1, 2.5];
    hands[1] = [-d.shoulderW * 0.7, d.hip - drop + 1, 2.5];
    blink = frame === 3;
  } else if (crouches.has(pose)) {
    const depth = [1, 3, 3, 2][frame & 3];
    rise = -depth;
    lean = depth * 0.6;
    feet[0] = { at: [hipX, 2, 0], knee: 1.5 + depth };
    feet[1] = { at: [-hipX, 2, 0], knee: 1.5 + depth };
    hands[0] = [d.shoulderW * 0.5, sh - d.upper - d.fore + 2 - depth, 2 + depth];
    hands[1] = [-d.shoulderW * 0.5, sh - d.upper - d.fore + 2 - depth, 2 + depth];
  } else if (swings.has(pose)) {
    // Wind up behind the head, over, strike low in front, recover.
    const keys: J[] = [[1.5, sh + 5, -1.5], [1, sh + 6, 2], [1, sh - 5, 5], [1.5, sh - 3, 3]];
    const k = keys[frame & 3];
    hands[0] = [k[0] + 0.5, k[1], k[2]];
    hands[1] = [-k[0] + 1.5, k[1] - 1, k[2] - 0.5];
    lean = frame & 3 ? (frame & 3) === 2 ? 1.5 : 0.5 : -0.5;
    feet[0] = { at: [hipX, 2, 1.5] };
    feet[1] = { at: [-hipX, 2, -1.5] };
  } else if (thrusts.has(pose)) {
    const out = [0, 1, 6, 2][frame & 3];
    hands[near] = [ns * d.shoulderW * 0.4, sh - 2, out - 1];
    hands[1 - near] = [ns * (d.shoulderW * 0.2 + 1), sh - 2.5, out - 2.5];
    lean = out > 4 ? 1.2 : 0;
    feet[0] = { at: [hipX, 2, 2] };
    feet[1] = { at: [-hipX, 2, -1.5] };
  } else if (pose.startsWith("work") || pose === "tug" || pose === "lift" || pose === "sway") {
    const beat = frame & 3;
    const dy = pose === "lift" ? [0, 3, 6, 3][beat] : [0, -1.5, 0, 1][beat];
    const fz = pose === "tug" ? [3, 1.5, 3, 4][beat] : 3;
    hands[0] = [d.shoulderW * 0.45, sh - 5 + dy + (beat === 1 ? -1 : 0), fz];
    hands[1] = [-d.shoulderW * 0.45, sh - 5 + dy + (beat === 3 ? -1 : 0), fz];
    lean = pose === "tug" ? -0.6 : 0.8;
    if (pose === "work-pound" || pose === "work-check") nod = 1;
  } else if (pose === "push") {
    const beat = frame & 3, fz = [5, 5.6, 5, 4.4][beat];
    hands[0] = [d.shoulderW * 0.5, sh - 6, fz];
    hands[1] = [-d.shoulderW * 0.5, sh - 6, fz];
    lean = 1 + (beat === 1 ? 0.3 : 0);
    feet[0] = { at: [hipX, 2, 1.5] };
    feet[1] = { at: [-hipX, 2, -1.5] };
  } else {
    blink = frame === 3;
  }
  const trade = pose in trades;
  // Walking or standing behind a pram: the hands stay on its bar.
  if (a.wearing.infant && a.wearing.infantCarry === "pram" && pose !== "push" && !swings.has(pose) && !thrusts.has(pose) && !key?.grip && !trade) {
    hands[0] = [d.shoulderW * 0.5, sh - 6, 5];
    hands[1] = [-d.shoulderW * 0.5, sh - 6, 5];
    lean += 0.5;
  }
  if (prop?.kind === "both" && !swings.has(pose) && !thrusts.has(pose) && !key?.grip && !tool && !trade) {
    hands[0] = [d.shoulderW - 1, sh - 4, 2.5];
    hands[1] = [-(d.shoulderW - 1), sh - 4, 2.5];
  }
  if (prop?.kind === "head") {
    hands[0] = [d.shoulderW + 0.5, sh + 8, 0];
    hands[1] = [-(d.shoulderW + 0.5), sh + 8, 0];
  }
  // A guard's pole stands upright in the hand, at rest and on the march alike.
  if (prop && shouldered(prop.sprite.slice(5)) && !swings.has(pose) && !thrusts.has(pose) && !key?.grip && !tool && !trade)
    hands[near] = [ns * (d.shoulderW - 0.5), sh - 1, 3];
  else if (prop && upright(prop) && !swings.has(pose) && !thrusts.has(pose) && !key?.grip && !tool && !trade)
    hands[near] = [ns * (d.shoulderW + 0.6), sh - (prop.sprite === "icon:musket" || prop.sprite === "icon:rifle" || prop.sprite === "icon:crossbow" ? 9 : prop.sprite === "icon:macuahuitl" ? 12 : 6), 1.5];
  const legs = feet.map(({ at, knee = 0.6 }, i) => {
    const side = i === 0 ? 1 : -1;
    const hip: J = [side * hipX, d.hip + Math.min(0, rise), 0];
    return ik(hip, at, (d.hip - 2) / 2 + 0.3, (d.hip - 2) / 2 + 0.3, [0, 0, 1 + knee]);
  });
  const arms = hands.map((hand, i) => {
    const side = i === 0 ? 1 : -1;
    const shoulder: J = [side * shX + tilt, sh + rise + shoulders, lean];
    const target: J = [hand[0], hand[1] + rise, hand[2] + lean * 0.6];
    return ik(shoulder, target, d.upper, d.fore, [side * 0.25, -0.2, -1]);
  });
  return { legs, arms, rise, lean, nod, seated, blink, sway, moving, face, lift, tilt, smear, tool, near, look };
}

/** Polearms and long guns a figure stands with: drawn by the painter, not from the icon. */
const upright = (prop: CarriedArt) => /^icon:(spear|halberd|glaive|musket|rifle|harpoon|paddle|macuahuitl|crossbow|lamp-pole|sweep-brush|water-pole|carrying-pole)$/.test(prop.sprite);
const shouldered = (kind?: string) => kind === "water-pole" || kind === "carrying-pole";
const EMBLEMS: Record<string, string> = { cowhide: "#ece4d4", lambda: "#8a2a22", cross: "#ece4d4", chevron: "#d8b04a", tiger: "#d8a03a", bands: "#ece4d4", rim: "#a4aab0" };

/** The pole from the ground (or the hip, for a gun) to above the head, with
 * its head on the side away from the body. */
function pole(sheet: Sheet, kind: string, hand: J, trail = 0, bob = 0) {
  // A pole pivots in the fist: the head trails the stride and lags the bob,
  // the foot swings the other way.
  const pivot = Math.round(hand[1]);
  const lean = (y: number) => (y < pivot ? Math.round((trail * (pivot - y)) / 30) : -Math.round((trail * (y - pivot)) / 60));
  const lift = (y: number) => (y < pivot - 8 ? Math.round(bob) : 0);
  const s = {
    put: (mask: Mask, mat: number, o: Parameters<Sheet["put"]>[2]) => {
      const out = new Mask();
      for (let i = 0; i < mask.bits.length; i++) if (mask.bits[i]) {
        const x = i % W, y = Math.floor(i / W);
        out.set(x + lean(y), y + lift(y));
      }
      sheet.put(out, mat, o);
    },
    px: (x: number, y: number, mat: number, tone?: number) => sheet.px(x + lean(y), y + lift(y), mat, tone),
  };
  const x = rnd(hand[0]),
    hy = Math.round(hand[1]),
    side = hand[0] >= CX ? 1 : -1;
  if (kind === "walking-cane") {
    s.put(new Mask().line(x, hy - 1, x, GY - 1, 1).set(x + side, hy - 2).set(x + side * 2, hy - 1), LEATHER, { ring: "ink", shade: 0, light: 0.3 });
    return;
  }
  if (kind === "musket") {
    const top = hy - 21,
      butt = hy + 5;
    s.put(new Mask().span(top, x, x).line(x, top, x, hy - 3, 1), STEEL, { ring: "ink", shade: 0, light: 0.3 });
    const stock = new Mask().line(x, hy - 3, x, butt - 2, 2).span(butt - 1, x - 1, x + 1).span(butt, x - 1, x + 1);
    s.put(stock, LEATHER, { ring: "ink", shade: 0.3, light: 0.3 });
    return;
  }
  if (kind === "rifle") {
    // At order arms, butt by the foot; the fixed bayonet is what clears the big head.
    const r = x + side,
      butt = Math.min(GY - 1, hy + 12),
      top = butt - 34;
    s.put(new Mask().set(r, top - 7).line(r, top - 6, r, top + 2, 1).set(r, top + 12).set(r, hy - 3).set(r, hy - 2), STEEL, { ring: "ink", shade: 0, light: 0.4 });
    const wood = new Mask().line(r, top + 3, r, top + 11, 1).line(r, top + 13, r, hy - 4, 1).line(r, hy - 1, r, butt - 2, 2).span(butt - 1, r - 1, r + 1).span(butt, r - 1, r + 1);
    s.put(wood, LEATHER, { ring: "ink", shade: 0.3, light: 0.3 });
    return;
  }
  if (kind === "paddle") {
    // Grip up, the leaf of the blade down by the feet.
    const top = hy - 20, foot = Math.min(GY - 1, hy + 15);
    s.put(new Mask().span(top, x - 1, x + 1).line(x, top + 1, x, foot - 9, 1), LEATHER, { ring: "ink", shade: 0, light: 0.3 });
    const blade = new Mask().span(foot - 9, x - 1, x + 1).span(foot - 1, x - 1, x + 1).set(x, foot);
    for (let y = foot - 8; y <= foot - 2; y++) blade.span(y, x - 2, x + 2);
    s.put(blade, LEATHER, { ring: "ink", shade: 0.35, light: 0.3, top: true, bottom: true });
    for (let y = foot - 8; y <= foot - 2; y += 2) s.px(x, y, LEATHER, 1);
    return;
  }
  if (kind === "harpoon") {
    // An iron foreshaft and a barbed head; the line coiled at the hand.
    const top = hy - 34, foot = Math.min(GY - 1, hy + 15);
    s.put(new Mask().line(x, top + 7, x, foot, 1), LEATHER, { ring: "ink", shade: 0, light: 0.3 });
    const head = new Mask().set(x, top - 1).span(top, x - 1, x + 1).line(x, top + 1, x, top + 6, 1).set(x - side, top + 2).set(x - side * 2, top + 3);
    s.put(head, STEEL, { ring: "ink", shade: 0.3, light: 0.4, top: true });
    for (const [dx, dy] of [[1, 8], [2, 9], [2, 10], [1, 11], [2, 12], [3, 13], [3, 14], [2, 15]]) s.px(x - side * dx, top + dy, WHITE, 2);
    return;
  }
  if (kind === "lamp-pole" || kind === "sweep-brush") {
    const top = hy - 30, foot = Math.min(GY - 1, hy + 15);
    s.put(new Mask().line(x, top + 2, x, foot, 1), LEATHER, { ring: "ink", shade: 0, light: 0.3 });
    if (kind === "lamp-pole") {
      s.put(new Mask().set(x, top + 1).set(x + side, top).set(x + side * 2, top + 1), STEEL, { ring: "ink", shade: 0, light: 0.3 });
      s.px(x, top, WHITE, 4);
    } else s.put(new Mask().span(top - 1, x - 1, x + 1).span(top, x - 2, x + 2).span(top + 1, x - 2, x + 2).span(top + 2, x - 1, x + 1), HAIR, { ring: "ink", shade: 0.4, light: 0.1 });
    return;
  }
  if (kind === "crossbow") {
    const top = hy - 16, butt = hy + 4;
    s.put(new Mask().line(x, top, x, butt, 2), LEATHER, { ring: "ink", shade: 0.3, light: 0.3 });
    s.put(new Mask().span(top + 1, x - 4, x + 4).set(x - 4, top + 2).set(x + 4, top + 2), STEEL, { ring: "ink", shade: 0.2, light: 0.3 });
    return;
  }
  if (kind === "macuahuitl") {
    // Carried blade up: a paddle of wood with obsidian set in both edges.
    const top = hy - 13;
    s.put(new Mask().line(x, top, x, hy + 2, 1).line(x, top, x, hy - 4, 2), LEATHER, { ring: "ink", shade: 0.3, light: 0.3, top: true });
    for (let y = top + 1; y < hy - 4; y += 2) [x - 2, x + 2].forEach((ex) => s.px(ex, y, STEEL, 1));
    return;
  }
  const top = hy - 34,
    foot = Math.min(GY - 1, hy + 15);
  const head = new Mask();
  if (kind === "spear") head.span(top, x, x).span(top + 1, x - 1, x + 1).span(top + 2, x - 1, x + 1).span(top + 3, x, x);
  else if (kind === "halberd") {
    head.line(x, top - 1, x, top + 7, 1);
    [[1, 2], [1, 4], [1, 4], [1, 4], [1, 3]].forEach(([a, b], i) => head.span(top + 3 + i, side > 0 ? x + a : x - b, side > 0 ? x + b : x - a));
    head.set(x - side, top + 5).set(x - side * 2, top + 4).set(x - side * 2, top + 3);
  } else head.line(x + side * 2, top - 1, x, top + 6, 2);
  s.put(new Mask().line(x, top + 3, x, foot, 1), LEATHER, { ring: "ink", shade: 0, light: 0.3 });
  s.put(head, STEEL, { ring: "ink", shade: 0.3, light: 0.4, top: true });
}

/** On the forearm that does not hold the weapon: a disc with a boss, or a tall
 * shield with the stick down its back showing as a ridge. */
function shield(s: Sheet, t: Turn, kind: "round" | "tall", elbow: J, hand: J, mark = "none") {
  const cx = (elbow[0] + hand[0] * 2) / 3,
    cy = (elbow[1] + hand[1] * 2) / 3 - (kind === "tall" ? 1 : 0);
  const [rx, ry] = kind === "round" ? [4.6, 4.6] : [3.6, 7.5];
  const wx = Math.max(1.2, rx * Math.abs(t.cos));
  const m = new Mask();
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    const f = 1 - ((y + 0.5 - cy) / ry) ** 2;
    if (f <= 0) continue;
    const w = kind === "round" ? wx * Math.sqrt(f) : wx * (0.75 + 0.25 * Math.sqrt(f));
    m.span(y, rnd(cx - w + 0.5), rnd(cx + w - 0.5));
  }
  const mid = rnd(cx);
  s.put(m, SHIELD, {
    ring: "ink",
    shade: 0.35,
    light: 0.25,
    top: true,
    bottom: true,
    tone: kind === "tall" && Math.abs(t.cos) > 0.5 ? (x, _y, tn) => (x === mid ? Math.max(2, tn - 1) : tn) : undefined,
  });
  if (Math.abs(t.cos) <= 0.5) return;
  const c = Math.round(cy), on = (x: number, y: number) => m.has(x, y);
  const paint = (pts: number[][], mat = EMBLEM, tone = 3) => pts.forEach(([dx, dy]) => on(mid + dx, c + dy) && s.px(mid + dx, c + dy, mat, tone));
  if (mark === "cowhide") paint([[-1, -5], [-2, -4], [1, -2], [2, -1], [-1, 1], [-2, 2], [1, 4], [2, 5], [-1, 5]]);
  else if (mark === "lambda") paint([[0, -2], [-1, -1], [1, -1], [-1, 0], [1, 0], [-2, 1], [2, 1], [-2, 2], [2, 2]]);
  else if (mark === "cross") paint([[0, -5], [0, -4], [0, -3], [0, -2], [0, -1], [0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [-2, -2], [-1, -2], [1, -2], [2, -2]]);
  else if (mark === "chevron") paint([[-2, -1], [-1, -2], [0, -3], [1, -2], [2, -1], [-2, 0], [-1, -1], [0, -2], [1, -1], [2, 0]]);
  else if (mark === "tiger") {
    paint([[-2, -1], [2, -1]]);
    paint([[-2, -2], [2, -2], [-1, 2], [0, 2], [1, 2]], WHITE, 3);
    paint([[0, 0], [-1, 1], [1, 1]], LEATHER, 1);
  } else if (mark === "bands") for (let y = -5; y <= 5; y += 3) for (let x = -4; x <= 4; x++) paint([[x, y]]);
  else if (mark === "rim") for (let y = Math.floor(cy - 5); y <= Math.ceil(cy + 5); y++) for (let x = mid - 5; x <= mid + 5; x++)
    if (on(x, y) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !on(x + dx, y + dy))) s.px(x, y, EMBLEM, 3);
  if (kind === "round" && mark !== "tiger" && mark !== "lambda") s.px(mid, c, STEEL, 4);
}

/** A pole over the shoulder with a pail or basket at each end. Side on, both
 * loads show; from the front or back only the near one, hanging before the chest. */
function shoulderPole(s: Sheet, t: Turn, kind: string, x: number, y: number, side: number, near: boolean, swing = 0, bounce = 0) {
  const pails = kind === "water-pole";
  // Loads hang on cords: they swing behind the stride and bounce against the step.
  const load = (hang: number, at: number) => {
    const cx = hang + Math.round(swing), top = at + Math.round(bounce);
    const m = new Mask();
    for (let r = 0; r < 5; r++) m.span(top + r, rnd(cx - 2.5 + (r === 4 ? 0.5 : 0)), rnd(cx + 2.5 - (r === 4 ? 0.5 : 0)));
    s.put(m, LEATHER, { ring: "ink", shade: 0.3, light: 0.3, top: true, bottom: true,
      tone: pails ? (_x, yy, tn) => (yy === top + 1 ? 4 : tn) : (xx, yy, tn) => ((xx + yy) % 2 === 0 ? Math.max(1, tn - 1) : tn) });
    if (pails) s.put(new Mask().span(top + 3, rnd(cx - 2.5), rnd(cx + 2.5)), STEEL, { ring: "none", shade: 0, light: 0 });
    s.put(new Mask().line(rnd(hang), y + 1, rnd(cx), top - 1, 1), LEATHER, { ring: "none", shade: 0, light: 0 });
  };
  if (t.view !== "front" && t.view !== "back") {
    // Foreshortened in three-quarter: the far end rides higher.
    const reach = 11 * Math.abs(t.sin), rise = Math.round(3 * Math.abs(t.cos));
    s.put(new Mask().line(rnd(x - reach), y + rise, rnd(x + reach), y - rise, 1), LEATHER, { ring: "ink", shade: 0, light: 0.3 });
    if (near) [[x - reach + 1, y + rise], [x + reach - 1, y - rise]].forEach(([cx, cy]) => load(cx, cy + 7));
    return;
  }
  if (!near) return;
  const cx = x + side * 3;
  s.put(new Mask().line(rnd(x + side), y - 1, rnd(cx), y + 3, 1), LEATHER, { ring: "ink", shade: 0, light: 0.3 });
  load(cx, y + 8);
}

/** What a trade works with, drawn from where the hands are. `body` is a
 * point fixed to the body at waist height, for what does not move with the hands. */
function implement(s: Sheet, t: Turn, pose: CharacterPose, frame: number, [hn, hf]: J[], [en, ef]: J[], body: J, held?: string) {
  const wood = { ring: "ink", shade: 0.3, light: 0.35 } as const;
  const beyond = (a: J, b: J, k: number) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], n = Math.hypot(dx, dy) || 1;
    return [b[0] + (dx / n) * k, b[1] + (dy / n) * k] as const;
  };
  const dots = (pts: readonly (readonly [number, number])[], mat: number, tone: number) => pts.forEach(([x, y]) => s.px(rnd(x), Math.round(y), mat, tone));
  if (pose === "work-stir" || pose === "work-sweep") {
    const [hi, lo] = hn[1] < hf[1] ? [hn, hf] : [hf, hn];
    // Never level: a paddle or broom always points down to the work.
    const dx = lo[0] - hi[0], dy = Math.max(Math.abs(dx) * 0.8, lo[1] - hi[1], 1);
    const k = pose === "work-sweep" ? (GY - 1 - lo[1]) / dy : 6 / Math.hypot(dx, dy);
    const foot = [lo[0] + dx * k, lo[1] + dy * k] as const;
    s.put(new Mask().line(hi[0], hi[1] - 1, foot[0], foot[1], 1), WOOD, wood);
    if (pose === "work-sweep") {
      const x = rnd(foot[0]), y = Math.round(foot[1]);
      s.put(new Mask().span(y - 2, x - 1, x + 1).span(y - 1, x - 2, x + 2).span(y, x - 3, x + 3), STRAW, { ring: "ink", shade: 0.4, light: 0.2, top: true });
    }
  } else if (pose === "work-pound") {
    const x = (hn[0] + hf[0]) / 2;
    s.put(new Mask().line(x, Math.min(hn[1], hf[1]) - 3, x, Math.max(hn[1], hf[1]) + 6, 2), WOOD, wood);
  } else if (pose === "work-hammer") {
    const end = beyond(en, hn, 4.5), dx = end[0] - hn[0], dy = end[1] - hn[1], n = Math.hypot(dx, dy) || 1;
    s.put(new Mask().line(hn[0], hn[1], end[0], end[1], 1), WOOD, wood);
    s.put(new Mask().line(end[0] - (dy / n) * 2, end[1] + (dx / n) * 2, end[0] + (dy / n) * 2, end[1] - (dx / n) * 2, 2), STEEL, { ring: "ink", shade: 0.3, light: 0.4 });
    const tongs = beyond(ef, hf, 4);
    s.put(new Mask().line(hf[0], hf[1], tongs[0], tongs[1], 1), STEEL, { ring: "ink", shade: 0, light: 0.3 });
  } else if (pose === "work-saw") {
    const tip = beyond(en, hn, 8);
    s.put(new Mask().line(hn[0], hn[1], tip[0], tip[1], 2), STEEL, { ring: "ink", shade: 0.2, light: 0.4, bottom: true });
    s.put(new Mask().rect(rnd(hn[0]) - 1, Math.round(hn[1]) - 1, rnd(hn[0]), Math.round(hn[1])), WOOD, wood);
  } else if (pose === "work-write") {
    const x = rnd(hf[0]) - 3, y = Math.round(hf[1]) - 2;
    s.put(new Mask().rect(x, y, x + 5, y + 1), WHITE, { ring: "ink", shade: 0.5 });
    s.put(new Mask().span(y + 2, x, x + 5), LEATHER, { ring: "ink", shade: 0.3 });
    s.px(x + 3, y, WHITE, 2);
    const side = hn[0] >= hf[0] ? 1 : -1;
    dots([[hn[0] + side, hn[1] - 1], [hn[0] + side, hn[1] - 2], [hn[0] + side * 2, hn[1] - 3]], LEATHER, 1);
  } else if (pose === "work-pour") {
    const dir = hf[0] === hn[0] ? t.sx : Math.sign(hf[0] - hn[0]);
    const tipped = frame === 1 || frame === 2;
    const x0 = rnd(hn[0]) - 2, y0 = Math.round(hn[1]) - 1;
    s.put(new Mask().glyph(x0, y0, tipped ? ["...##", "..###", ".####", "####.", "###..", ".#..."] : ["..#.", ".###", "####", "####", "####", ".##."], dir < 0), WOOD, { ring: "ink", shade: 0.35, light: 0.3, top: true });
    const cx = rnd(hf[0]), cy = Math.round(hf[1]);
    s.put(new Mask().rect(cx - 1, cy - 1, cx + 1, cy), WOOD, wood);
    if (frame === 2) for (let y = y0 + 1; y < cy - 1; y++) s.px(dir > 0 ? x0 + 5 : x0 - 1, y, LIQUID, 3);
  } else if (pose === "play-strum") {
    // The strumming hand rests on the bowl's upper rim.
    const c = [hn[0] + Math.sign(hf[0] - hn[0]) * 0.5, hn[1] + 2.5] as const;
    const head = beyond(c as unknown as J, hf, 4);
    s.put(new Mask().line(c[0], c[1], head[0], head[1], 1), WOOD, { ring: "ink", shade: 0, light: 0.2 });
    s.px(rnd(head[0]), Math.round(head[1]), WOOD, 1);
    const rx = 2.4 + 1.6 * Math.abs(t.cos), bowl = new Mask();
    for (let y = -3; y <= 3; y++) bowl.span(Math.round(c[1]) + y, rnd(c[0] - rx * Math.sqrt(1 - (y / 4) ** 2)), rnd(c[0] + rx * Math.sqrt(1 - (y / 4) ** 2)));
    s.put(bowl, WOOD, { ring: "ink", shade: 0.35, light: 0.4, top: true, bottom: true });
    if (Math.abs(t.cos) > 0.4) s.px(rnd(c[0]), Math.round(c[1]) - 1, WOOD, 0);
  } else if (pose === "play-drum") {
    const x = rnd(body[0]), y = Math.round(body[1]);
    s.put(new Mask().rect(x - 3, y + 1, x + 3, y + 4), WOOD, { ring: "ink", shade: 0.35, light: 0.3, bottom: true, tone: (px, py, tn) => ((px + py) % 3 === 0 && tn > 1 ? 2 : tn) });
    s.put(new Mask().span(y, x - 3, x + 3).span(y + 1, x - 2, x + 2), WHITE, { ring: "ink", shade: 0.3 });
  } else if (pose === "play-flute") {
    const out = beyond(hf, hn, 5), lip = beyond(hn, hf, 1);
    s.put(new Mask().line(lip[0], lip[1], out[0], out[1], 1), WOOD, { ring: "ink", shade: 0, light: 0.3 });
  } else if (pose === "pray" && held === "beads") {
    const x = (hn[0] + hf[0]) / 2, y = Math.max(hn[1], hf[1]) + 1;
    dots([[x - 1, y], [x + 1, y], [x - 1, y + 1], [x + 1, y + 1], [x, y + 2]], WOOD, 2);
    s.px(rnd(x), Math.round(y) + 3, TRIM, 3);
  } else if (pose === "cense") {
    // The pot swings ahead of the hand on its chains, and smoke trails it.
    const swing = [-4, 0, 4, 0][frame & 3];
    const x = hn[0] + swing * (t.sx * t.sin + Math.abs(t.cos) * 0.7), y = hn[1] + 8 - Math.abs(swing) * 0.4;
    for (let i = 1; i < 7; i++) s.px(rnd(hn[0] + ((x - hn[0]) * i) / 7), Math.round(hn[1] + ((y - hn[1]) * i) / 7), METAL, 2);
    s.put(new Mask().glyph(rnd(x) - 1, Math.round(y) - 1, [".#.", "###", "###", ".#."]), METAL, { ring: "ink", shade: 0.35, light: 0.4, top: true });
    const back = -Math.sign(swing || 1);
    dots([[x + back, y - 2], [x + back * 2, y - 3 - (frame & 1)], [x + back * 2, y - 4 - (frame & 1)], [x + back * 3, y - 6]], WHITE, 3);
  }
}

/** A small flag on a pole from the back, above the head: the sashimono. */
function backFlag(s: Sheet, t: Turn, x: number, foot: number, head: number, flap = 0) {
  const back = rnd(x - t.sx * t.sin * 2.5), tip = back + Math.round(flap * 0.4);
  s.put(new Mask().line(tip, head, back, foot, 1), LEATHER, { ring: "ink", shade: 0, light: 0.2 });
  const flag = new Mask();
  const w = Math.max(1, Math.round(4 * Math.abs(t.cos))), dir = t.view === "side" ? -t.sx : 1;
  // The cloth streams out behind, most at the free bottom corner.
  for (let y = head + 1; y <= head + 7; y++) {
    const o = Math.round((flap * (y - head)) / 7);
    flag.span(y, (dir > 0 ? tip + 1 : tip - w) + o, (dir > 0 ? tip + w : tip - 1) + o);
  }
  s.put(flag, FLAG, { ring: "ink", shade: 0.2, light: 0.3, top: true });
}

// ------------------------------------------------------------- the facing

type Turn = { view: View; sx: 1 | -1; cos: number; sin: number };
const facings: [View, number, 1 | -1][] = [
  ["back", 180, 1], ["bq", 135, 1], ["side", 90, 1], ["q", 45, 1],
  ["front", 0, 1], ["q", 45, -1], ["side", 90, -1], ["bq", 135, -1],
];
function turnOf(face8: number): Turn {
  const [view, deg, sx] = facings[((face8 % 8) + 8) % 8];
  const r = (deg * Math.PI) / 180;
  return { view, sx, cos: Math.cos(r), sin: Math.sin(r) };
}
/** Halfway between a facing and the next, for the body mid-turn: the head has
 * already come round, the shoulders are on their way. */
function turnBetween(face8: number, sign: number): Turn {
  const signed = (f: number) => 180 - 45 * f;
  let deg = signed(face8 + sign * 0.5);
  deg = ((deg + 540) % 360) - 180;
  const sx: 1 | -1 = deg < 0 ? -1 : 1;
  const a = Math.abs(deg);
  const view: View = a < 22.5 ? "front" : a < 67.5 ? "q" : a < 112.5 ? "side" : a < 157.5 ? "bq" : "back";
  const r = (a * Math.PI) / 180;
  return { view, sx, cos: Math.cos(r), sin: Math.sin(r) };
}
/** Body space (figure's left, up, forward) to screen x, y and nearness. */
function project(t: Turn, p: J): J {
  const z = -p[0] * t.sx * t.sin + p[2] * t.cos;
  // The near side of a turned body sits a little lower on the screen: on a
  // diagonal or in profile the near foot stands a pixel below the far one.
  return [CX + p[0] * t.cos + p[2] * t.sx * t.sin, GY - p[1] + p[2] * t.cos * TILT + Math.max(0, -p[0] * t.sx * t.sin) * 0.3, z];
}

// ---------------------------------------------------------------- the kit

type Kit = {
  g: CharacterAppearance["wearing"]["garment"];
  sleeves: "short" | "long" | "loose" | "none";
  /** Body-space row the garment stops at; undefined for none below the waist. */
  hem?: number;
  flare: number;
  legs: number;
  feet: "none" | "sandals" | "shoes" | "boots" | "sneakers";
  belt: "none" | "cord" | "sash" | "leather" | "wide";
  motif: string;
  band: boolean;
  material?: Material;
  pattern?: CharacterAppearance["wearing"]["trimPattern"];
  /** -1 worn to 3 the finest; 0 ordinary. */
  quality: number;
  wideLegs: boolean;
  wrapped: boolean;
  sarong: boolean;
  /** What the sleeves are made of: the garment's cloth, or a cardigan's knit over it. */
  sleeve: number;
};

function kit(a: CharacterAppearance, d: Dims): Kit {
  const w = a.wearing;
  const g = w.garment;
  const bare = g === "none" || g === "loincloth";
  const leggings = w.leggings ?? "none";
  const sleeves = bare || g === "poncho" ? "none" : (w.sleeves ?? (g === "shirt" || g === "coat" || g === "robe" || g === "suit" ? "long" : "short"));
  const leg = d.cut;
  const knee = 2 + Math.round(leg * 0.45);
  const hems: Partial<Record<typeof g, [number, number]>> = {
    tunic: [2 + Math.round(leg * 0.55), 1],
    "long-tunic": [2 + Math.round(leg * 0.32), 1.5],
    skirt: [3, 2],
    robe: [3, 1],
    dress: [3, 2.5],
    coat: [knee, 1.5],
    wrap: [2 + Math.round(leg * 0.3), 1.5],
    "open-robe": [3, 1.5],
    gown: [0, 5],
  };
  let [hem, flare] = hems[g] ?? [undefined, 0];
  // Below the knee over stockings: the twentieth century's dress and skirt.
  const calf = w.hem === "calf" && (g === "dress" || g === "skirt");
  if (calf) [hem, flare] = [2 + Math.round(leg * 0.42), 1.5];
  if (leggings === "sarong" && hem === undefined) [hem, flare] = [2, 1];
  if (hem !== undefined) flare += w.cut === "full" ? 1 : w.cut === "fitted" ? -0.5 : 0;
  const outfit = [...(w.color + w.trim + g + w.belt)].reduce((n, c) => (Math.imul(n, 31) + c.charCodeAt(0)) >>> 0, 7);
  const named = w.motif ?? "auto";
  const cardigan = w.waistcoat === "cardigan" && !bare && g !== "poncho";
  return {
    g,
    sleeves: cardigan ? "long" : sleeves,
    hem,
    flare,
    legs: g === "suit" ? TOP : leggings === "none" ? SKIN : calf && leggings === "hose" ? LEG : LOWER,
    feet: w.footwear ?? "shoes",
    belt: bare || g === "gown" || g === "poncho" ? "none" : (w.belt ?? "leather"),
    motif: g === "wrap" || bare ? "plain" : named === "auto" ? ["plain", "placket", "band", "yoke", "stitch"][outfit % 5] : named,
    // Most hemmed garments carry a band at the hem, whatever their motif.
    band: (outfit >> 3) % 3 !== 0,
    material: w.material,
    pattern: w.trimPattern && w.trimPattern !== "none" ? w.trimPattern : undefined,
    quality: w.quality ?? 0,
    wideLegs: leggings === "wide",
    wrapped: leggings === "wrapped",
    sarong: leggings === "sarong",
    sleeve: cardigan ? VEST : TOP,
  };
}

/** How each fibre takes the light: silk and linen are crisp, wool and felt
 * drink it. How it takes dye is in `clothColours`. */
const fabricLight: Record<Material, number> = {
  hide: 0.06,
  fur: 0.1,
  barkcloth: 0.1,
  felt: 0.04,
  wool: 0.08,
  linen: 0.2,
  hemp: 0.1,
  jute: 0.08,
  cotton: 0.14,
  ramie: 0.2,
  silk: 0.28,
  synthetic: 0.24,
};

function palette(a: CharacterAppearance): Ramp[] {
  const w = a.wearing;
  const hat = w.headwear;
  const c = clothColours(w);
  const hatColor = c.hat;
  // Dyes a fifth richer than the record's swatch: at this size a muted cloth
  // reads as mud, and the ramp keeps the shadows honest.
  const vivid = (hex: string, k: number) => {
    const v = parseInt(hex.slice(1), 16),
      rgb = [v >> 16, (v >> 8) & 255, v & 255],
      l = 0.3 * rgb[0] + 0.59 * rgb[1] + 0.11 * rgb[2];
    return `#${rgb.map((c) => Math.round(Math.max(0, Math.min(255, l + (c - l) * k))).toString(16).padStart(2, "0")).join("")}`;
  };
  const dye = (hex: string, k = 1.22) => ramp(vivid(hex, k));
  const p: Ramp[] = new Array(MATS);
  p[SKIN] = ramp(a.skin, "skin");
  p[HAIR] = ramp(a.hairColor, "hair");
  p[TOP] = dye(c.top);
  p[LOWER] = dye(w.lowerColor);
  // Trim that sits too close to the cloth in value vanishes at this size:
  // push it lighter or darker until the band reads.
  const gap = luma(w.trim) - luma(w.color);
  p[TRIM] = dye(Math.abs(gap) >= 0.14 ? w.trim : mix(w.trim, gap >= 0 || luma(w.color) < 0.3 ? "#f4ecd8" : "#1e1a24", 0.45));
  p[INNER] = dye(c.inner);
  p[HAT] = dye(hatColor);
  p[CLOAK] = dye(w.cloakColor);
  p[LEATHER] = ramp("#5c3f2c");
  p[BOOT] = ramp("#3d2e27");
  p[METAL] = ramp(w.neckStyle === "chain" ? "#c8c4b8" : "#d8b35a");
  p[WHITE] = flat("#f6f1e4", "#cfc8b8");
  p[SOLE] = ramp("#e2ddd2");
  // Lips as the portrait paints them: coloured on women, a shade line on men.
  const light = [1, 3, 5].reduce((sum, i) => sum + parseInt(a.skin.slice(i, i + 2), 16), 0) / 3;
  const female = a.physique?.sex === "female";
  p[LIP] = ramp(mix(a.skin, light > 170 ? "#c4506a" : "#7a2e3c", female ? 0.6 : 0.32), "skin");
  p[IRIS] = flat(irisOf(a), mix(irisOf(a), "#231a2b", 0.4));
  p[BLUSH] = flat(mix(flush(a.skin), a.skin, 0.25));
  p[EYE] = flat("#231a2b");
  p[GLASS] = ramp(hat === "visor" ? "#b8d8e8" : "#2c3440");
  p[STUBBLE] = ramp(mix(a.skin, a.hairColor, 0.4), "skin");
  // Stockings under a calf-length hem: skin seen through tan silk or rayon.
  p[LEG] = w.hem === "calf" && w.leggings === "hose" ? ramp(mix(a.skin, "#b08a6a", 0.4), "skin") : p[SKIN];
  p[SMEAR] = flat("#fff4d8");
  // A patch is whatever came to hand: duller, browner.
  p[PATCH] = ramp(mix(w.color, "#7a6a52", 0.5));
  const n = [...(w.color + w.trim)].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 3);
  // Turkey red, indigo, ochre and green: the printed cottons of the trade.
  p[KERCHIEF] = dye(["#a8322e", "#2e4c8c", "#c08a2e", "#3a6a3a"][n % 4]);
  // Ornament in its own metal; marks in their ink or paint.
  const ad = a.adornment;
  p[ORN] = ramp({ gold: "#d9a441", silver: "#c8ccd4", copper: "#c07040", bone: "#e8dcc0", shell: "#f0e0d0", jet: "#34303c" }[ad?.metal ?? "gold"] ?? "#d9a441");
  p[MARK] = ramp(ad?.markColor ?? (ad?.markStyle === "paint" ? "#b8352c" : "#2a3550"));
  const pick = <T,>(list: readonly T[], salt: number) => list[(n + salt) % list.length];
  // What a hair ornament is made of: tortoiseshell or gold combs, gold pins,
  // flowers, a gold net, a dyed ribbon.
  const ornament = w.hairOrnament;
  p[DECO] = ramp(
    ornament === "flower" ? pick(["#e8455e", "#f4f1e6", "#f5c53d", "#e889b6"], 1)
      : ornament === "ribbon" ? pick(["#c23a3a", "#2f5fae", "#e0a93a", "#3a8a5a"], 2)
      : ornament === "comb" ? ((w.quality ?? 0) >= 2 ? "#d9a441" : "#7a4626")
      : "#d9a441",
  );
  // Plumes are white, black or dyed; a cockade is a pale rosette; a ribbon band is dark.
  p[PLUME] = ramp(c.plume);
  // Stitches that stand out from the band they are worked on; gold on fine cloth.
  p[ACCENT] = ramp((w.quality ?? 0) >= 2 ? "#e0bc5e" : luma(w.trim) > 0.45 ? "#2c2a44" : "#efe6d0");
  p[APRON] = w.apron === "leather" ? ramp("#7a5236") : ramp(c.apron);
  p[VEST] = dye(c.vest);
  p[SHAWL] = dye(c.shawl);
  // Black lacquer for a Japanese scabbard, pale wood for a kris, leather for the rest.
  p[SHEATH] = ramp(w.sidearm === "katana" ? "#2a2430" : w.sidearm === "kris" ? "#9a6a38" : "#4a3020");
  // Quilted armour is undyed cotton or linen; the rest is the metal or lacquer it was made of.
  p[ARMOUR] = ramp(w.armour === "quilted" ? "#d9cfb2" : w.armourColor ?? "#8e959c");
  p[SHIELD] = dye(w.shieldColor ?? "#8a6440", 1);
  p[STEEL] = ramp("#a4aab0");
  p[EMBLEM] = ramp(EMBLEMS[w.shieldMark ?? "none"] ?? "#e8dcc0");
  p[FLAG] = dye(w.backFlag ?? "#e8dcc0", 1);
  p[WOOD] = ramp("#9c6c3e");
  p[STRAW] = ramp("#d4b05c");
  p[LIQUID] = ramp("#9ccad6");
  return p;
}

// ------------------------------------------------------------------ drawing

export function drawCharacterF(
  ctx: CanvasRenderingContext2D,
  a: CharacterAppearance,
  direction: number,
  pose: CharacterPose,
  frame: number,
  prop?: CarriedArt,
  facing?: number,
  expression: RestingExpression = "neutral",
  turn = 0,
  condition = 0,
) {
  ctx.clearRect(0, 0, W, H);
  const face8 = facing ?? [0, 2, 4, 6][direction & 3];
  // A turn in three beats. The scene passes the old facing on the first beat
  // and the new one on the second and third: the head leads into the new
  // facing, the shoulders are still halfway back toward the old one, then
  // the cloth settles.
  const t = Math.abs(turn) === 2 ? turnBetween(face8, -Math.sign(turn)) : turnOf(face8);
  const d = dims(a);
  const k = kit(a, d);
  const r = posed(d, a, pose, frame, t.sx, prop, condition);
  // The frame before, for what trails the body: head, hair and hem.
  const n = frameCount(pose);
  const prev = posed(d, a, pose, (frame + n - 1) % n, t.sx, prop, condition);
  // G: loose sleeves belly out on a run.
  const flare = g && pose === "run" && k.sleeves === "loose" ? 1 : 0;
  const s = new Sheet();
  const P = (p: J) => project(t, p);
  const backView = t.view === "back" || t.view === "bq";

  // Upper-body rows are measured in body space and moved with the rig.
  const yOf = (y: number) => GY - y - r.rise;
  // Lean shears the torso from the hips; a pixel figure needs it overstated to read.
  const leanAt = (y: number) => (r.lean * 1.5 * (y - d.hip)) / Math.max(1, d.torso);
  // Lean carries the shoulders forward; tilt carries them over to one side.
  const centre = (y: number) => CX + leanAt(y) * t.sx * t.sin + ((r.tilt * (y - d.hip)) / Math.max(1, d.torso)) * t.cos;

  // ---- the head box, which other parts need for hair and hoods
  const headShift = t.view === "side" ? t.sx : t.view === "q" ? t.sx * 0.5 : 0;
  const hx = CX + headShift + r.lean * t.sx * t.sin * 1.9 + r.tilt * t.cos;
  // A turn leads with the head: it faces the new way a beat before the body.
  const ht = Math.abs(turn) === 3 ? turnOf(face8 + Math.sign(turn)) : turnOf(face8 + r.look * t.sx);
  const headArgs: Head = {
    s,
    a,
    view: ht.view,
    sx: ht.sx,
    x0: rnd(hx - 6.5),
    y0: 0,
    expression,
    blink: r.blink,
    shoulder: yOf(d.shoulder),
    child: d.child,
    shoulderW: d.shoulderW,
    bodyC: 6.5 - (t.view === "side" || t.view === "q" ? headShift : 0),
    lag: prev.rise - r.rise + r.lift,
    drift: 0,
    face: r.face,
    refined: g,
  };
  // The head sinks with the body and rises a frame late, so a step lands.
  const headRise = Math.min(r.rise, prev.rise);
  // Seen head-on, leaning toward or away from the viewer shows as the head
  // dropping or lifting against the shoulders.
  const foreshorten = Math.round(r.lean * 0.5 * Math.abs(t.cos));
  headArgs.y0 = GY - (d.shoulder + 1) - headRise - (headSpans(headArgs).length - 1) + r.nod + foreshorten;

  // ---- motion lines first, so the body covers all but the trail
  if (r.smear) smears(s, t, r, prev);

  // ---- cloak behind everything but the far side of the face
  // How far loose cloth's free end has swung: trailing as the body travels,
  // swinging with the last frame's stride.
  const settle = Math.abs(turn) === 1 ? Math.sign(turn) * t.cos : 0;
  const drift = (f: number) => f * ((r.moving ? -t.sx * t.sin * (pose === "run" ? 2 : 1.2) : 0) + prev.sway * t.cos - settle);
  // G: hair and a cloak swing wider than a sash end.
  const loose = g ? (f: number) => drift(f * 1.6) : drift;
  headArgs.drift = loose(1);
  const cloakMask = a.wearing.cloak ? cloak(t, d, yOf, centre, loose) : undefined;
  // Its inside, in the body's shadow: a step darker, or pale cloth reads as an outline.
  if (cloakMask && !backView) s.put(cloakMask, CLOAK, { shade: 0.4, bottom: true, dark: 1 });
  if (!backView) hairBehind(headArgs);

  // ---- limbs, far to near
  const legParts = r.legs.map((leg, i) => ({ leg, i, z: P(leg.end)[2] + P(leg.mid)[2] }));
  legParts.sort((p, q) => p.z - q.z);
  const armParts = r.arms.map((arm, i) => ({ arm, i, z: P(arm.end)[2] + P(arm.mid)[2] * 0.5, shoulder: P(arm.root)[2] }));
  const behind = (z: number) => z < -1.2;
  const deep = t.view === "side" || t.view === "q" || t.view === "bq";

  // Arms go by depth in every view: facing away, a hand held forward is
  // behind the body, and the far arm of a diagonal is half hidden by it.
  // G: a sidearm's scabbard behind the body, where it hangs on the far side or out behind.
  const arms = g ? sidearmAt(d, a.wearing.sidearm, r, prev, pose === "run") : [];
  arms.forEach((h, i) => drawSidearm(s, t, a.wearing.sidearm!, h, i > 0, "back"));
  for (const { arm, z } of armParts) if (behind(z)) drawArm(s, t, arm, k, deep ? 1 : 0, false, flare);
  // G: a guard's pole in the working hand, a shield on the other forearm.
  const carried = g && prop && upright(prop) && !r.tool && !tooled.has(pose) ? prop.sprite.slice(5) : undefined;
  const shoulderLoad = shouldered(carried) ? carried : undefined;
  const held = shoulderLoad ? undefined : carried ?? (g && prop?.sprite === "icon:walking-cane" && !r.tool && !tooled.has(pose) ? "walking-cane" : undefined);
  const poleHand = P(r.arms[r.near].end);
  if (held && behind(poleHand[2])) pole(s, held, poleHand, held === "walking-cane" ? 0 : drift(2.4), prev.rise - r.rise);
  const work = tooled.has(pose)
    ? [s, t, pose, frame & 3, [r.near, 1 - r.near].map((i) => P(r.arms[i].end)), [r.near, 1 - r.near].map((i) => P(r.arms[i].mid)),
      P([0, d.shoulder - 7.6 + r.rise, 3.8 + r.lean * 0.6]), prop?.sprite.slice(5)] as Parameters<typeof implement>
    : undefined;
  const workBehind = work && Math.max(work[4][0][2], work[4][1][2]) < -1.2;
  // What is held up in the hand goes over the arms and face; what the hands work on, under them.
  const workOver = work && !workBehind && /^(work-write|work-pour|work-hammer|work-saw|play-strum|play-flute|cense|pray)$/.test(pose);
  if (work && workBehind) implement(...work);
  const shieldKind = g && a.wearing.shield && a.wearing.shield !== "none" && !d.child ? a.wearing.shield : undefined;
  const offArm = r.arms[1 - r.near];
  const shieldAt = [P(offArm.mid), P(offArm.end)] as const;
  if (shieldKind && behind(shieldAt[1][2])) shield(s, t, shieldKind, shieldAt[0], shieldAt[1], a.wearing.shieldMark);
  const flagFrom = g && a.wearing.backFlag && !d.child ? [centre(d.shoulder), yOf(d.shoulder - 3), yOf(d.shoulder + 26)] as const : undefined;
  if (flagFrom && t.view !== "back" && t.view !== "bq") backFlag(s, t, ...flagFrom, drift(1.5));
  legParts.forEach(({ leg }, n) => drawLeg(s, t, leg, k, deep && n === 0 ? 1 : 0));

  // ---- the garment: torso and anything hanging below it, as one silhouette
  const body = new Mask();
  const top = d.shoulder,
    hip = d.hip;
  const width = (y: number) => {
    const f = y >= top - 1 ? d.shoulderW - (y >= top ? 1 : 0) : y >= hip + 2 ? lerp(d.waistW, d.shoulderW, (y - hip - 2) / Math.max(1, top - 1 - hip - 2)) : lerp(d.hipW, d.waistW, (y - hip) / 2);
    const dz = y >= top - 1 ? d.chestD - (y >= top ? 0.8 : 0) : y >= hip + 3 ? d.chestD : d.bellyD;
    return Math.hypot(f * t.cos, dz * t.sin);
  };
  for (let y = hip; y <= top; y++) {
    const c = centre(y),
      w = width(y);
    body.span(yOf(y), rnd(c - w + 0.5), rnd(c + w - 0.5));
  }
  const hem = r.seated && k.hem !== undefined ? Math.max(k.hem, hip - 3) : k.hem;
  if (hem !== undefined) {
    const legX = (y: number, rig: Rig) =>
      rig.legs.flatMap((leg) => {
        const pts = [leg.root, leg.mid, leg.end].map(P);
        for (let i = 0; i < 2; i++) {
          const [x0, y0] = pts[i],
            [x1, y1] = pts[i + 1];
          if ((y - y0) * (y - y1) <= 0 && y1 !== y0) return [x0 + ((x1 - x0) * (y - y0)) / (y1 - y0)];
        }
        return [];
      });
    for (let y = hip - 1; y >= hem; y--) {
      const f = (hip - y) / Math.max(1, hip - hem);
      const sy = yOf(y);
      const base = lerp(d.hipW, d.hipW + k.flare, f * f);
      const c = centre(hip);
      // G: a skirt seen head-on swings to the side a frame after the step.
      const swing = g ? prev.sway * t.cos * f : 0;
      let x0 = c + swing - Math.hypot(base * t.cos, (d.bellyD + k.flare * 0.6 * f) * t.sin),
        x1 = c + swing + Math.hypot(base * t.cos, (d.bellyD + k.flare * 0.6 * f) * t.sin);
      // The bottom of the hem follows where the legs were a frame ago.
      for (const x of legX(Math.min(sy, GY - 1), y <= hem + 1 ? prev : r)) {
        x0 = Math.min(x0, x - 1.2);
        x1 = Math.max(x1, x + 1.2);
      }
      body.span(Math.min(sy, GY - (k.g === "gown" ? 0 : 1)), rnd(x0 + 0.5), rnd(x1 - 0.5));
    }
  }
  // A shirt hangs one row past the hip.
  if (k.g === "shirt" || k.g === "suit") {
    const c = centre(hip),
      w = Math.hypot(d.hipW * t.cos, d.bellyD * t.sin);
    body.span(yOf(hip - 1), rnd(c - w + 0.5), rnd(c + w - 0.5));
  }
  const bare = k.g === "none" || k.g === "loincloth";
  if (hem !== undefined && !bare) {
    // Hide is cut into a fringe at the hem; worn cloth frays ragged.
    let last = -1;
    for (let y = 0; y < GY; y++) for (let x = 0; x < W; x++) if (body.has(x, y)) last = y;
    for (let x = 0; x < W; x++) {
      if (!body.has(x, last)) continue;
      if ((k.material === "hide" || k.material === "fur") && x % 2 === 0 && last + 1 < GY) body.set(x, last + 1);
      else if (k.quality < 0 && x % 3 === 0) body.clear(x, last);
    }
  }
  const fig: Figure = { s, cos: t.cos, sin: t.sin, sx: t.sx, yOf, centre, hip: d.hip, shoulder: d.shoulder, leg: d.cut,
    shoulderW: d.shoulderW, waistW: d.waistW, bellyD: d.bellyD, chestD: d.chestD, drift, refined: g };
  const carrying = g && a.wearing.infant;
  if (carrying && !backView) infant(fig, "behind", a.wearing.infantMood, a.wearing.infantCarry);
  if (carrying && backView) infant(fig, "under", a.wearing.infantMood, a.wearing.infantCarry);
  const { zone, tone } = garment(k, d, t, yOf, centre, hem, bare, s.key);
  s.put(body, TOP, { zone, tone, shade: 0.34, light: fabricLight[k.material ?? "cotton"], top: true, bottom: hem !== undefined });
  if (hem !== undefined) hemDetail(s, a, t, yOf(hem), centre(hip));
  const armour = g ? a.wearing.armour : undefined;
  if (armour && armour !== "none") {
    // Over the torso, and down over the hips for mail and lamellar.
    const low = yOf(hip - (armour === "mail" || armour === "lamellar" ? 3 : armour === "quilted" ? 2 : 0));
    const plate = new Mask();
    for (let y = yOf(top); y <= low; y++) for (let x = 0; x < W; x++) if (body.has(x, y)) plate.set(x, y);
    const ridge = rnd(centre(top - 2) + (t.view === "q" ? t.sx : 0));
    s.put(plate, ARMOUR, {
      ring: "ink",
      shade: 0.35,
      light: armour === "cuirass" ? 0.45 : 0.25,
      top: true,
      bottom: true,
      tone: (x, y, tn) =>
        tn < 3 ? tn
        : armour === "mail" ? ((x + y) % 2 === 0 ? 2 : tn)
        : armour === "lamellar" ? ((y - low) % 2 === 0 || x % 2 === 0 && (y - low) % 4 === 1 ? 2 : tn)
        : armour === "quilted" ? (x % 2 === 0 ? 2 : tn)
        : t.cos > 0.3 && x === ridge ? 4 : tn,
    });
  }
  belt(s, k, t, d, yOf, centre, width, drift);
  const vest = a.wearing.waistcoat;
  const vested = g && vest && vest !== "none" && !bare && !(k.g === "coat" && a.wearing.front === "closed") && k.g !== "poncho";
  if (vested) waistcoat(s, k, t, d, yOf, centre, width, vest);
  if (k.g === "loincloth" || (bare && k.legs === SKIN)) loincloth(s, k, t, d, yOf, centre);
  if (a.wearing.necklace) necklace(s, t, d, yOf, centre);
  const w = a.wearing;
  if (w.apron && w.apron !== "none" && !bare) apron(fig, w.apron);
  if (w.bag && w.bag !== "none") bag(fig, w.bag);
  // G: a watch chain looped from the middle button to the waistcoat pocket.
  if (g && (k.g === "suit" || vested) && t.cos > 0.3) {
    const y = yOf(hip + 3), c = centre(hip + 3), side = s.key;
    [[1, 0], [2, 1], [3, 1], [4, 0]].forEach(([dx, dy], i) => s.px(rnd(c + side * dx * t.cos), y + dy, METAL, i === 0 || i === 3 ? 3 : 4));
  }

  arms.forEach((h, i) => drawSidearm(s, t, a.wearing.sidearm!, h, i > 0, "front"));
  if (held && !behind(poleHand[2])) pole(s, held, poleHand, held === "walking-cane" ? 0 : drift(2.4), prev.rise - r.rise);
  if (work && !workBehind && !workOver) implement(...work);

  // ---- near arms, then what goes over them
  for (const { arm, z, shoulder } of armParts)
    if (!behind(z) && arm.end[1] <= d.shoulder + 1) drawArm(s, t, arm, k, 0, false, flare);
    // Hands held in front of a body seen from behind: the upper arm still shows.
    else if (behind(z) && !behind(shoulder)) drawArm(s, t, arm, k, 0, true);
  if (shieldKind && !behind(shieldAt[1][2])) shield(s, t, shieldKind, shieldAt[0], shieldAt[1], a.wearing.shieldMark);
  if (flagFrom && (t.view === "back" || t.view === "bq")) backFlag(s, t, ...flagFrom, drift(1.5));
  if (shoulderLoad) shoulderPole(s, t, shoulderLoad, centre(d.shoulder), yOf(d.shoulder) - 1, poleHand[0] >= CX ? 1 : -1, true, drift(1.4), prev.rise - r.rise);
  if (k.g === "poncho") poncho(s, t, d, yOf, centre, a);
  if (a.wearing.mantle) mantle(s, t, d, yOf, centre, drift);
  else if (k.pattern === "cloud") cloudCollar(s, t, d, yOf, centre);
  if (g && w.shawl && w.shawl !== "none") shawl(fig, w.shawl, ["step", "strip", "chevron"].includes(w.trimPattern ?? ""));
  else if (w.shoulderCloth && !a.wearing.cloak) shoulderCloth(fig);
  if (g && w.hood === "down" && w.headwear !== "hood") hoodDown(fig, k.g === "shirt");
  if (cloakMask && backView) {
    // Two folds hanging from the shoulder blades, or the back is one flat slab.
    const top = yOf(d.shoulder) + 3;
    s.put(cloakMask, CLOAK, {
      shade: 0.4,
      light: 0.2,
      bottom: true,
      tone: (x, y, tone) => {
        if (tone < 3 || y < top) return tone;
        let x0 = x, x1 = x;
        while (cloakMask.has(x0 - 1, y)) x0--;
        while (cloakMask.has(x1 + 1, y)) x1++;
        const w = x1 - x0;
        return w >= 6 && (x - x0 === Math.round(w * 0.3) || x - x0 === Math.round(w * 0.68)) ? 2 : tone;
      },
    });
  }
  if (carrying && backView) infant(fig, "behind", a.wearing.infantMood, a.wearing.infantCarry);
  if (carrying && !backView) infant(fig, "over", a.wearing.infantMood, a.wearing.infantCarry);

  // ---- the head, then anything raised above it
  drawHead(headArgs);
  if (carrying && backView) infant(fig, "over", a.wearing.infantMood, a.wearing.infantCarry);
  if (w.neckwear && w.neckwear !== "none" && !["hood", "headscarf", "veil"].includes(w.headwear)) neckwear(fig, w.neckwear);
  for (const { arm, z } of armParts) if (!behind(z) && arm.end[1] > d.shoulder + 1) drawArm(s, t, arm, k, 0, false, flare);
  if (w.wrist === "bangles") bangles(fig, r.arms.map((arm) => project(t, arm.end)).map(([x, y]) => [x, y] as const));
  if (workOver) implement(...work!);

  const image = ctx.getImageData(0, 0, W, H);
  s.resolve(palette(a), image.data);
  ctx.putImageData(image, 0, 0);
  // A thrown spear has left the hand.
  const levelled = pose === "draw" && r.tool && /^icon:(crossbow|musket|rifle|blowgun)$/.exec(prop?.sprite ?? "")?.[1];
  if (prop?.kind === "bow" && pose === "draw") drawBow(ctx, t, r, frame & 3);
  else if (levelled) drawLevelled(ctx, t, r, levelled);
  else if (prop && !held && !shoulderLoad && !work && !(pose === "spear-throw" && (frame & 3) >= 2)) drawProp(ctx, prop, t, r, d);
}

/** A gun, a crossbow or a blowgun along the line of aim, drawn as a few
 * strokes: the icons are drawn on the diagonal and do not turn cleanly. */
function drawLevelled(ctx: CanvasRenderingContext2D, t: Turn, r: Rig, kind: string) {
  const hand = r.arms[r.near].end, n = len(r.tool!) || 1;
  const dir: J = [r.tool![0] / n, r.tool![1] / n, r.tool![2] / n];
  const at = (k: number): J => [hand[0] + dir[0] * k, hand[1] + dir[1] * k, hand[2] + dir[2] * k];
  const line = (a: J, b: J, color: string, dy = 0) => {
    const [x0, y0] = project(t, a), [x1, y1] = project(t, b);
    const steps = Math.max(1, Math.round(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
    ctx.fillStyle = color;
    for (let i = 0; i <= steps; i++) ctx.fillRect(Math.round(x0 + ((x1 - x0) * i) / steps), Math.round(y0 + ((y1 - y0) * i) / steps) + dy, 1, 1);
  };
  ctx.save();
  if (t.cos < -0.3) ctx.globalCompositeOperation = "destination-over";
  if (kind === "blowgun") {
    line(at(-1), at(15), "#2a1c14", 1);
    line(at(-1), at(15), "#a8955a");
    for (const k of [4, 9, 14]) line(at(k), at(k), "#d8c890");
  } else {
    const reach = kind === "crossbow" ? 10 : kind === "rifle" ? 12 : 13;
    line(at(-3), at(reach), "#2a1c14", 1);
    line(at(-3), at(kind === "crossbow" ? reach : 3), "#7a5232");
    if (kind !== "crossbow") line(at(3), at(reach), "#5e6268");
    else {
      // The prod across the front, and its string drawn back to the nut.
      const prod = (side: number): J => [at(reach)[0] + side * 3.5, at(reach)[1], at(reach)[2] - 1.2];
      line(prod(-1), prod(1), "#2a1c14", 1);
      line(prod(-1), at(reach), "#a8733a");
      line(at(reach), prod(1), "#a8733a");
      line(prod(-1), at(reach - 3), "#d6ccb2");
      line(at(reach - 3), prod(1), "#d6ccb2");
    }
  }
  ctx.restore();
}

/** The bow at full stretch is drawn, not pasted: the stave bends with the
 * pull and the string runs to the hand. */
function drawBow(ctx: CanvasRenderingContext2D, t: Turn, r: Rig, frame: number) {
  const grip = r.arms[1 - r.near].end,
    pull = r.arms[r.near].end;
  const bend = [1.4, 2.2, 3, 1.2][frame];
  const at = (u: number): J => [grip[0], grip[1] + u * 8, grip[2] + 2.5 - u * u * bend];
  const line = (a: J, b: J, color: string, dx = 0) => {
    const [x0, y0] = project(t, a), [x1, y1] = project(t, b);
    const n = Math.max(1, Math.round(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
    ctx.fillStyle = color;
    for (let i = 0; i <= n; i++) ctx.fillRect(Math.round(x0 + ((x1 - x0) * i) / n) + dx, Math.round(y0 + ((y1 - y0) * i) / n), 1, 1);
  };
  ctx.save();
  // Held out in front, so only a figure turned away hides it.
  if (t.cos < -0.3) ctx.globalCompositeOperation = "destination-over";
  const top = at(-1), bottom = at(1);
  if (frame === 1 || frame === 2) {
    line(top, pull, "#d6ccb2");
    line(pull, bottom, "#d6ccb2");
    line(pull, [grip[0], grip[1] + 0.5, grip[2] + 4], "#b9955c");
    line([grip[0], grip[1] + 0.5, grip[2] + 4], [grip[0], grip[1] + 0.5, grip[2] + 5], "#ded9bd");
    line(pull, [pull[0], pull[1], pull[2] + 1], "#b9a4a0");
  } else line(top, bottom, "#d6ccb2");
  const out = project(t, at(0))[0] >= project(t, pull)[0] ? 1 : -1;
  for (let i = 0; i < 6; i++) line(at(-1 + i / 3), at(-1 + (i + 1) / 3), "#2a1c14", out);
  for (let i = 0; i < 6; i++) line(at(-1 + i / 3), at(-1 + (i + 1) / 3), i === 2 || i === 3 ? "#3a2618" : "#a8733a");
  ctx.restore();
}

export function drawCharacterG(...args: Parameters<typeof drawCharacterF>) {
  g = true;
  try {
    drawCharacterF(...args);
  } finally {
    g = false;
  }
}

type Sidearm = NonNullable<CharacterAppearance["wearing"]["sidearm"]>;
/** A scabbard in body space: its mouth at the belt, the hilt standing out of
 * it, the tip, and how far its middle sags (−) or arches (+). */
type Hang = { mouth: J; hilt: J; tip: J; bend: number };

/** Where a sidearm hangs. The scabbard swings a beat behind the stride and
 * kicks as a step lands; at a run it streams out level behind. */
function sidearmAt(d: Dims, kind: CharacterAppearance["wearing"]["sidearm"], r: Rig, prev: Rig, run: boolean): Hang[] {
  if (!kind || kind === "none") return [];
  const swing = -prev.sway * 1.4,
    bounce = prev.rise - r.rise;
  const lx = d.hipW + 0.9;
  // `drop` is the scabbard's angle below level, back from the mouth; `out`
  // how far the tip stands off the leg, so it reads beside the body head-on.
  const hang = (mouth: J, grip: J, length: number, drop: number, bend: number, out: number): Hang => {
    const a = run ? drop * 0.45 : drop;
    return {
      mouth,
      hilt: [mouth[0] + grip[0], mouth[1] + grip[1], mouth[2] + grip[2]],
      tip: [mouth[0] + out, mouth[1] - length * Math.sin(a) + bounce, mouth[2] - length * Math.cos(a) + swing],
      bend,
    };
  };
  switch (kind) {
    case "sword":
      return [hang([lx, d.hip + 1, 1.5], [0, 2, 2], 13, 0.85, 0, 2)];
    case "sabre":
      return [hang([lx, d.hip + 1, 1.5], [0, 2, 2], 12, 0.8, -1.3, 2)];
    // Thrust through the sash edge up, nearly level: the long sword and the short.
    case "katana":
      return [hang([lx - 0.4, d.hip + 2, 1.2], [0, 1.4, 3.2], 12, 0.55, 0.9, 3), hang([lx - 0.9, d.hip + 1.4, 0.8], [0, 1, 2.4], 8, 0.65, 0.6, 2)];
    case "dagger":
      return [hang([-(d.hipW + 0.6), d.hip + 1, 1.2], [0, 2.2, 0.6], 4.5, 1.25, 0, -0.6)];
    case "kris": {
      // In the back of the sash, slanting down to the left, hilt to the right.
      const mouth: J = [-1, d.hip + 2, -(d.bellyD + 0.6)];
      return [{ mouth, hilt: [mouth[0] - 1.5, mouth[1] + 1.8, mouth[2]], tip: [mouth[0] + 3.5 + swing * 0.3, mouth[1] - 6 + bounce, mouth[2]], bend: 0 }];
    }
  }
}

/** One layer of a sidearm: the parts behind the body, or those in front of it. */
function drawSidearm(s: Sheet, t: Turn, kind: Sidearm, h: Hang, short: boolean, layer: "back" | "front") {
  const P = (p: J) => project(t, p);
  const mid: J = [(h.mouth[0] + h.tip[0]) / 2, (h.mouth[1] + h.tip[1]) / 2 + h.bend, (h.mouth[2] + h.tip[2]) / 2];
  const back = (p: J) => P(p)[2] < -1.2;
  const [mx, my] = P(h.mouth),
    [cx, cy] = P(mid),
    [tx, ty] = P(h.tip),
    [hx, hy] = P(h.hilt);
  // The scabbard hangs outside the clothes: it goes behind only on the body's far side.
  if (back(h.mouth) === (layer === "back")) {
    const w = short || kind === "dagger" || kind === "kris" ? 1 : 2;
    const sheath = new Mask().line(mx, my, cx, cy, w).line(cx, cy, tx, ty, w);
    // Lacquer takes a hard glint down its length; leather stays soft.
    s.put(sheath, SHEATH, { shade: 0.45, light: kind === "katana" ? 0.45 : 0.3, top: true });
    if (kind !== "kris") s.px(rnd(tx), Math.round(ty), METAL, 3);
    if (kind === "kris") {
      // The wrangka: the boat-shaped head of the sheath, wider than the blade.
      const [ax, ay] = P([h.mouth[0] - 1.5, h.mouth[1] - 0.5, h.mouth[2]]),
        [bx, by] = P([h.mouth[0] + 2.5, h.mouth[1] + 0.6, h.mouth[2]]);
      s.put(new Mask().line(ax, ay, bx, by, 2), SHEATH, { shade: 0.3, light: 0.5, top: true });
    }
  }
  if (back(h.hilt) !== (layer === "back")) return;
  const gx = hx - mx,
    gy = hy - my,
    gl = Math.hypot(gx, gy) || 1;
  const nx = -gy / gl,
    ny = gx / gl;
  const grip = new Mask().line(mx, my, hx, hy, kind === "katana" && !short ? 2 : 1);
  // A katana's grip is dark silk crossed over white ray-skin; a sword's is wire-bound.
  s.put(grip, kind === "katana" ? SHEATH : LEATHER, {
    shade: 0.3,
    zone: (x, y) => (kind === "katana" && (x + y) % 2 === 0 ? WHITE : kind === "katana" ? SHEATH : LEATHER),
    tone: (x, y, tn) => (kind !== "katana" && (x + y) % 2 === 0 ? Math.min(4, tn + 1) : tn),
  });
  const guard = new Mask();
  if (kind === "sword") guard.line(mx - nx * 1.6, my - ny * 1.6, mx + nx * 1.6, my + ny * 1.6, 1);
  if (kind === "dagger") guard.line(mx - nx, my - ny, mx + nx, my + ny, 1);
  // A sabre's knuckle-bow sweeps from the guard round the hand to the pommel.
  if (kind === "sabre") guard.line(mx - nx, my - ny, mx + nx * 1.4, my + ny * 1.4, 1).line(mx + nx * 1.4, my + ny * 1.4, hx + nx * 1.1, hy + ny * 1.1, 1);
  if (kind === "katana") guard.rect(rnd(mx - 0.5), Math.round(my - 0.5), rnd(mx - 0.5) + 1, Math.round(my - 0.5) + 1);
  if (!guard.empty()) s.put(guard, METAL, { ring: "line", shade: 0.3, light: 0.4, tone: (_x, _y, tn) => (kind === "katana" ? Math.min(tn, 2) : tn) });
  // The pommel, or the kris's carved hilt bent over like a bird's head.
  if (kind === "kris") s.px(rnd(hx - 1), Math.round(hy), LEATHER, 2);
  else s.px(rnd(hx), Math.round(hy), METAL, kind === "katana" ? 2 : 4);
}

/** A waistcoat over the shirt: two fronts open in a V at the neck, buttoned
 * below it, with welted pockets and two points at the waist. The back is the
 * cheaper lining, drawn in with a buckled strap. Under an open coat only the
 * opening shows it. */
function waistcoat(s: Sheet, k: Kit, t: Turn, d: Dims, yOf: (y: number) => number, centre: (y: number) => number, width: (y: number) => number, kind: "plain" | "figured" | "cardigan") {
  const m = new Mask();
  const front = t.cos > 0.2,
    back = t.cos < -0.2,
    coat = k.g === "coat";
  const knit = kind === "cardigan";
  const fc = (y: number) => centre(y) + d.chestD * 0.9 * t.sx * t.sin;
  const vee = d.shoulder - 4;
  // A cardigan hangs past the waist and stays open a finger's width below its V.
  for (let y = d.hip - (knit ? 2 : 1); y <= d.shoulder - (knit ? 0 : 1); y++) {
    const c = centre(y),
      w = width(y) + (knit ? 0.3 : 0);
    for (let x = rnd(c - w + 0.5); x <= rnd(c + w - 0.5); x++) {
      const off = Math.abs(x + 0.5 - fc(y) - 0.5);
      if (front && y > vee && off < (y - vee) * 0.75) continue;
      if (front && knit && off < 0.9) continue;
      if (coat && front && off > 1.5 * t.cos + 0.8) continue;
      m.set(x, yOf(y));
    }
  }
  if (front && !coat && !knit) for (const side of [-1, 1]) m.set(rnd(fc(d.hip) + side * 1.4 * t.cos), yOf(d.hip - 2));
  s.put(m, VEST, {
    shade: 0.38,
    light: kind === "figured" ? 0.3 : knit ? 0.12 : 0.2,
    top: true,
    bottom: true,
    zone: (x, y) => (back && !knit ? INNER : kind === "figured" && y % 2 === 0 && (x + 2 * y) % 4 === 0 ? ACCENT : VEST),
    // Knit ribbing at the hem.
    tone: knit ? (x, y, tn) => (y === yOf(d.hip - 2) && x % 2 === 0 ? Math.min(tn, 2) : tn) : undefined,
  });
  if (front && knit) {
    for (let y = d.hip; y <= vee; y += 2) s.px(rnd(fc(y) - 1.2 * t.cos), yOf(y), METAL, 3);
  } else if (front) {
    for (let y = d.hip; y <= vee; y += 2) s.px(rnd(fc(y)), yOf(y), METAL, 4);
    if (!coat) for (const side of [-1, 1]) for (const dx of [2, 3]) s.px(rnd(fc(d.hip + 1) + side * dx * t.cos), yOf(d.hip + 1), VEST, 1);
  } else if (back) {
    const c = centre(d.hip + 1);
    for (const dx of [-2, -1, 1, 2]) s.px(rnd(c + dx), yOf(d.hip + 1), INNER, 1);
    s.px(rnd(c), yOf(d.hip + 1), METAL, 4);
  }
}

function drawLeg(s: Sheet, t: Turn, leg: Limb, k: Kit, dark: number) {
  const [hx, hy] = project(t, [leg.root[0], leg.root[1], leg.root[2]]);
  const [kx, ky] = project(t, leg.mid);
  const [ax, ay] = project(t, leg.end);
  const m = new Mask();
  const w = (k.wideLegs ? 1 : 0) + (Math.abs(t.sin) > 0.9 ? 2 : 3);
  m.line(hx, hy, kx, ky, w).line(kx, ky, ax, ay, w);
  const foot = new Mask();
  // The ankle is two rows up; the shoe fills the two below it.
  const fy = Math.round(ay) + 2;
  const along = t.sx * t.sin;
  // The shoe: three wide head-on, reaching forward as the body turns.
  const fx0 = rnd(ax - 1 + Math.min(0, along * 1.5)),
    fx1 = rnd(ax + 1 + Math.max(0, along * 1.5));
  foot.span(fy - 1, fx0, fx1).span(fy, fx0, fx1);
  if (Math.abs(along) > 0.5) foot.clear(along > 0 ? fx0 : fx1, fy - 1);
  m.minus(foot);
  const boots = k.feet === "boots";
  const shin = (y: number) => y >= Math.round(ay) - 2;
  const wrapped = k.wrapped;
  s.put(m, k.legs, {
    shade: 0.45,
    // Bare legs stay unlit, as G's bare arms do.
    light: k.legs === SKIN ? 0 : 0.3,
    dark,
    zone: (_x, y) => (boots && shin(y) ? BOOT : k.legs),
    tone: (_x, y, tone) =>
      wrapped && y < ay - 1 && y > ky - 2 && y % 2 === 0 ? Math.min(tone, 2)
      // A boot's top turns down in a lighter cuff.
      : boots && y === Math.round(ay) - 2 && tone >= 2 ? 4
      : tone,
  });
  const shoe = k.feet === "none" || k.feet === "sandals" ? SKIN : k.feet === "boots" ? BOOT : k.feet === "sneakers" ? TOP : LEATHER;
  const toe = along > 0.3 ? fx1 : along < -0.3 ? fx0 : rnd(ax + 0.5 * s.key);
  s.put(foot, shoe, {
    shade: 0.4,
    dark,
    // A glint on the toe of anything but bare feet.
    tone: (x, y, tn) => (shoe !== SKIN && x === toe && y === fy - 1 && tn >= 3 ? 4 : tn),
    bottom: k.feet === "none",
    // Sneakers on a white sole; sandals a leather sole and a strap over the foot.
    zone: (x, y) =>
      k.feet === "sneakers" && y === fy ? SOLE
      : k.feet === "sandals" && (y === fy || (y === fy - 1 && x === rnd(ax))) ? LEATHER
      : shoe,
  });
}

function drawArm(s: Sheet, t: Turn, arm: Limb, k: Kit, dark: number, upperOnly = false, flare = 0) {
  const [sx, sy] = project(t, arm.root);
  const [ex, ey] = project(t, arm.mid);
  const [hx, hy] = project(t, arm.end);
  const upper = new Mask().line(sx, sy, ex, ey, 2);
  const fore = new Mask().line(ex, ey, hx, hy, (k.sleeves === "loose" ? 3 : 2) + flare);
  const hand = new Mask().line(hx, hy, hx, hy + 0.6, 2);
  const all = upperOnly ? upper : new Mask().add(upper).add(fore).add(hand);
  // Sleeves end in a cuff, or a band at the elbow when short.
  const cuffed = k.sleeves === "loose" || (k.sleeves === "long" && k.g !== "shirt" && k.g !== "suit");
  s.put(all, SKIN, {
    shade: 0.5,
    // G's bare arms take no highlight: pale skin lit went nearly white.
    light: g ? 0 : 0.4,
    dark,
    cast: !dark,
    zone: (x, y) => {
      if (hand.has(x, y) && !(fore.has(x, y) && y < hy - 0.5)) return SKIN;
      if (fore.has(x, y) && !upper.has(x, y)) {
        if (k.sleeves === "long" || k.sleeves === "loose") return cuffed && y >= Math.round(hy) - 1 && k.sleeve === TOP ? TRIM : k.sleeve;
        return SKIN;
      }
      if (k.sleeves === "short" && y >= Math.round(ey) && !upper.has(x, y + 1)) return TRIM;
      return k.sleeves === "none" ? SKIN : k.sleeve;
    },
  });
}

/** Pattern tiles, three rows deep, repeating along a band. */
const tiles: Record<string, readonly string[]> = {
  "cross-stitch": ["x.x..", ".x...", "x.x.."],
  meander: ["xxx.", "x.x.", "x.xx"],
  chevron: ["x...", ".x.x", "..x."],
  diamond: [".x..", "x.x.", ".x.."],
  step: ["xx..", ".xx.", "..xx"],
  dots: ["....", ".x..", "...."],
  strip: ["xx..", "xx..", "xx.."],
};

/** Which material each pixel of the garment silhouette is, and the extra
 * tones that make it read as made: collars, plackets, lapels, pockets,
 * lacing, hem bands, folds that open with the stride, light on the shoulders. */
function garment(
  k: Kit,
  d: Dims,
  t: Turn,
  yOf: (y: number) => number,
  centre: (y: number) => number,
  hem: number | undefined,
  bare: boolean,
  key: number,
) {
  const top = yOf(d.shoulder),
    waist = yOf(d.hip + 1),
    hipRow = yOf(d.hip),
    hemRow = yOf(hem ?? d.hip - 1);
  const facing = t.cos > 0.1;
  const off = t.sx * t.sin * (d.shoulderW - 1.5);
  const g = k.g;
  const open = g === "coat" || g === "open-robe";
  const long = hem !== undefined && hem <= 3;
  const flared = hem !== undefined && ["dress", "gown", "robe", "skirt", "long-tunic", "open-robe", "tunic", "wrap"].includes(g);
  const buttoned = g === "shirt" || g === "suit" || (g === "coat" && !open) || k.motif === "placket" || k.motif === "collar";
  const laced = (g === "dress" || g === "gown") && k.motif !== "collar";
  const banded = k.motif === "band" || (hem !== undefined && (k.band || !!k.pattern));
  const tile = k.pattern && k.pattern !== "cloud" ? tiles[k.pattern] : undefined;
  // A patterned band is three rows deep, a plain one two.
  const bandRows = tile ? 2 : 1;
  // Only the tile's middle row, between plain rows: all three at one pixel a stitch read as dither.
  const stitch = (x: number, y: number, y0: number) => {
    if ((((y - y0) % 3) + 3) % 3 !== 1) return false;
    const row = tile![1];
    return row[(((x - Math.round(centreAt())) % row.length) + row.length) % row.length] === "x";
  };
  const panel = !!tile && ["tunic", "long-tunic", "robe", "dress", "gown", "skirt", "wrap", "poncho"].includes(g);
  const centreAt = () => centre(d.hip) + (facing ? off * 0.8 : 0);
  const seed = [...(k.g + k.motif + k.material)].reduce((h, ch) => (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0, 5);
  const patchX = (seed % 3) - 1.5,
    patchY = hem !== undefined && hem < d.hip - 2 ? yOf(d.hip - 2 - (seed % 2)) : yOf(d.hip + 2);
  const zone = (x: number, y: number) => {
    const c = centreAt();
    const dx = x - c,
      ax = Math.abs(dx);
    if (bare && y <= hipRow) return SKIN;
    if (bare) return k.legs === SKIN ? LOWER : k.legs;
    // Worn cloth is patched where it gave out first: the front of the skirt or the belly.
    if (k.quality < 0 && facing && Math.abs(dx - patchX) < 1 && (y === patchY || y === patchY + 1)) return PATCH;
    // Fine work is embroidered in gold at the neck and along the hem band.
    if (k.quality >= 2 && facing && y === top && ax < 2.6 && x % 2 === 0) return METAL;
    if (k.quality >= 2 && banded && y === hemRow - 1 && y > hipRow && x % 2 === 0) return METAL;
    if (k.quality >= 3 && facing && y === top + 2 && ax < 3 && x % 2 === 1) return METAL;
    if (k.sarong && y > hipRow && !["robe", "dress", "gown", "open-robe", "long-tunic"].includes(g)) return LOWER;
    if (g === "skirt" && y > waist) return LOWER;
    if (g === "shirt" && y > waist + 1 && k.legs !== SKIN) return LOWER;
    if (banded && y >= hemRow - bandRows && y > hipRow) return tile && stitch(x, y, hemRow - 2) ? ACCENT : TRIM;
    if (facing && panel && y > top && y <= top + 3 && ax < 2.6) return stitch(x, y, top + 1) ? ACCENT : TRIM;
    // A white turned-down collar, its points either side of the neck.
    if (k.motif === "collar" && facing && !open && ((y === top && ax < 2.6) || (y === top + 1 && ax > 0.6 && ax < 2.1))) return WHITE;
    if (facing) {
      // Open fronts: the inner layer, edged its whole length.
      if (open && ax < 1.1 && y > top) return INNER;
      if (open && ax < 2.1 && y > top && (g === "open-robe" || y < top + 4)) return TRIM;
      // Necklines: a V on shirts and robes, a square on dresses, a band otherwise.
      if (y === top && ax < 1.6) return g === "shirt" || g === "robe" || laced ? SKIN : TRIM;
      if (y === top + 1 && ax < 0.6 && (g === "robe" || g === "shirt")) return g === "shirt" ? SKIN : TRIM;
      if (g === "robe" && y > top && y <= top + 3 && Math.abs(ax - (y - top) * 0.5 - 0.3) < 0.5) return TRIM;
      if ((g === "shirt" || g === "suit") && y === top && ax < 2.6) return TRIM;
      if (buttoned && ax < 0.6 && y > top + 1 && y < waist && (y - top) % 2 === 0) return g === "shirt" ? TRIM : METAL;
      if (laced && ax < 0.6 && y > top && y < waist && (y - top) % 2 === 1) return TRIM;
      if (g === "wrap") {
        // A band from the left shoulder across to the right hip.
        const u = (y - top) * 0.9 - (dx + d.shoulderW * 0.6) * t.cos;
        if (Math.abs(u) < 1.1 && y < hipRow + 1) return TRIM;
      }
      if (g === "suit" && ax < 0.6 && y < waist) return TRIM;
    }
    if ((g === "gown" || (laced && k.belt === "none")) && y === waist) return TRIM;
    const m = k.motif;
    if (m === "stitch" && y === hemRow - 2 && x % 2 === 0) return TRIM;
    if (m === "yoke" && y <= top + 1) return TRIM;
    if (m === "stripes" && (y - top) % 3 === 2) return TRIM;
    if (m === "plaid" && ((y - top) % 3 === 2 || (x - Math.round(c)) % 3 === 0)) return TRIM;
    if (m === "jersey" && (y <= top + 1 || (facing && y >= top + 3 && y <= top + 4 && ax < 1.5))) return TRIM;
    return TOP;
  };
  const tone = (x: number, y: number, tn: number) => {
    const c = centreAt();
    const dx = x - c;
    // Light lies along the shoulders on the side it comes from.
    if (tn === 3 && y <= top + 1 && dx * key > 1) return 4;
    // Fur's pale tips at the collar and the hem.
    if (k.material === "fur" && tn >= 2 && (y === top || y >= hemRow)) return 4;
    if (tn !== 3) return tn;
    // Silk throws a sheen down the side toward the light.
    if (k.material === "silk" && Math.round(dx) === Math.round(key * 2)) return 4;
    // Barkcloth is painted: bands of dark pigment, ticked between.
    if (k.material === "barkcloth" && ((y - top) % 4 === 3 || ((y - top) % 8 < 3 && (x - Math.round(c)) % 4 === 0))) return 1;
    // The cloth blouses over a belt.
    if (k.belt !== "none" && !bare && y === yOf(d.hip + 2)) return 2;
    // Pockets on a coat, either side below the belt.
    if (g === "coat" && facing && y === waist + 2 && Math.abs(Math.abs(dx) - (d.waistW - 2)) < 1) return 1;
    // Folds below the waist, opening out toward the hem and on the shade side deeper.
    if (flared && y > hipRow + 1 && y < hemRow - (banded ? 1 : 0)) {
      const spread = 1.5 + (y - hipRow) * (long ? 0.28 : 0.4);
      if (Math.abs(Math.abs(dx) - spread) < 0.5) return 2;
    }
    // From behind: a fold between the shoulder blades, the spine on a bare back, a tailored coat's seam to its vent.
    if (t.cos < -0.1 && Math.abs(dx + off * 0.8) < 0.6 && y >= top + 2 &&
      y < (bare ? hipRow : g === "coat" || g === "suit" ? hemRow : top + 5)) return 2;
    return tn;
  };
  return { zone, tone };
}

function hemDetail(s: Sheet, a: CharacterAppearance, t: Turn, row: number, c: number) {
  if (a.wearing.hem === "split" && t.cos > 0.5) {
    const x = rnd(c);
    s.retone(x, row, 1);
    s.retone(x, row - 1, 1);
  }
}

function belt(s: Sheet, k: Kit, t: Turn, d: Dims, yOf: (y: number) => number, centre: (y: number) => number, width: (y: number) => number, drift: (f: number) => number) {
  if (k.belt === "none" || k.g === "dress" || k.g === "robe" && k.belt === "leather") return;
  const m = new Mask();
  const rows = k.belt === "wide" || k.belt === "sash" ? [d.hip + 1, d.hip + 2] : [d.hip + 1];
  for (const y of rows) {
    const c = centre(y),
      w = width(y);
    m.span(yOf(y), rnd(c - w + 0.5), rnd(c + w - 0.5));
  }
  const mat = k.belt === "cord" || k.belt === "sash" ? TRIM : LEATHER;
  s.put(m, mat, { ring: "none", shade: 0.4, light: 0.2 });
  if (t.cos > 0.1 && (k.belt === "leather" || k.belt === "wide")) {
    const bx = rnd(centre(d.hip + 1) + t.sx * t.sin * (d.waistW - 1.5));
    s.px(bx, yOf(d.hip + 1), METAL, 4);
  }
  if (k.belt === "sash" && t.cos > -0.5) {
    const side = rnd(centre(d.hip) + (t.sin > 0.5 ? -t.sx : 1) * (d.waistW - 1));
    const tail = new Mask().line(side, yOf(d.hip), side + drift(1), yOf(d.hip - 3), 1);
    s.put(tail, TRIM, { ring: "line", shade: 0.5 });
  }
}

function loincloth(s: Sheet, k: Kit, t: Turn, d: Dims, yOf: (y: number) => number, centre: (y: number) => number) {
  const m = new Mask();
  const c = centre(d.hip);
  const w = Math.max(1, 1.5 * Math.abs(t.cos) + 1.2 * t.sin);
  for (let y = d.hip; y >= d.hip - Math.round(d.leg * 0.5); y--) m.span(yOf(y), rnd(c - w + 0.5), rnd(c + w - 0.5));
  const band = new Mask();
  const hw = Math.hypot(d.hipW * t.cos, d.bellyD * t.sin);
  band.span(yOf(d.hip), rnd(c - hw + 0.5), rnd(c + hw - 0.5)).span(yOf(d.hip - 1), rnd(c - hw + 0.5), rnd(c + hw - 0.5));
  s.put(band, k.g === "loincloth" ? TOP : LOWER, { shade: 0.4 });
  if (k.g === "loincloth") s.put(m, TOP, { shade: 0.4, ring: "line" });
}

function necklace(s: Sheet, t: Turn, d: Dims, yOf: (y: number) => number, centre: (y: number) => number) {
  if (t.cos < 0.1) return;
  const c = centre(d.shoulder) + t.sx * t.sin * 2;
  const y = yOf(d.shoulder - 1);
  [[-2, 0], [-1, 1], [0, 1], [1, 0]].forEach(([dx, dy], i) => s.px(rnd(c + dx), y + dy, i % 2 ? TRIM : METAL, 4));
}

function poncho(s: Sheet, t: Turn, d: Dims, yOf: (y: number) => number, centre: (y: number) => number, a: CharacterAppearance) {
  const m = new Mask();
  for (let y = d.shoulder; y >= d.hip - 1; y--) {
    const w = Math.hypot((d.shoulderW + 1.5 - (y === d.shoulder ? 1.5 : 0)) * t.cos, (d.chestD + 1) * t.sin);
    m.span(yOf(y), rnd(centre(y) - w + 0.5), rnd(centre(y) + w - 0.5));
  }
  const motif = a.wearing.motif ?? "auto";
  const pattern = a.wearing.trimPattern;
  const tile = pattern && pattern !== "none" && pattern !== "cloud" ? tiles[pattern] : undefined;
  // A fringe of loose warp along the hem.
  const last = yOf(d.hip - 1);
  for (let x = 0; x < W; x += 2) if (m.has(x, last)) m.set(x, last + 1);
  const top = yOf(d.shoulder);
  const front = t.cos > 0.2 || t.cos < -0.2;
  s.put(m, TOP, {
    shade: 0.36,
    light: 0.2,
    top: true,
    bottom: true,
    // Matched to the portrait: a trim collar round the head-hole, then by
    // motif a yoke, one band, or two-row stripes alternating trim and inner
    // with the poncho's own colour between.
    zone: (x, y) => {
      const r = y - top;
      if (r === 0 && front && Math.abs(x + 0.5 - centre(d.shoulder)) < 2.5) return TRIM;
      if (motif === "plain" || r < 2) return TOP;
      if (motif === "yoke") return r < 4 ? TRIM : TOP;
      if (motif === "band") return r === 5 || r === 6 ? TRIM : TOP;
      const band = (r - 2) % 4;
      if (band < 2) return TOP;
      if (Math.floor((r - 2) / 4) % 2) return INNER;
      if (tile) return tile[band - 2][(((x - Math.round(centre(d.hip))) % tile[0].length) + tile[0].length) % tile[0].length] === "x" ? ACCENT : TRIM;
      return TRIM;
    },
  });
}

function mantle(s: Sheet, t: Turn, d: Dims, yOf: (y: number) => number, centre: (y: number) => number, drift: (f: number) => number) {
  const m = new Mask();
  for (let y = d.shoulder; y >= d.shoulder - 4; y--) {
    const w = Math.hypot((d.shoulderW + 1.5 - (y === d.shoulder ? 1.5 : 0)) * t.cos, (d.chestD + 1) * t.sin);
    // The hem lifts and trails; the yoke stays on the shoulders.
    const o = Math.round(drift((d.shoulder - y) / 4));
    m.span(yOf(y), rnd(centre(y) - w + 0.5) + Math.min(0, o), rnd(centre(y) + w - 0.5) + Math.max(0, o));
  }
  s.put(m, CLOAK, { shade: 0.36, light: 0.2, top: true, bottom: true });
}

/** The cloud collar: four lobes lying over the shoulders, front and back. */
function cloudCollar(s: Sheet, t: Turn, d: Dims, yOf: (y: number) => number, centre: (y: number) => number) {
  const m = new Mask();
  const c = centre(d.shoulder);
  for (let i = 0; i < 4; i++) {
    const y = d.shoulder - i;
    const w = Math.hypot((d.shoulderW + 1 - (i === 0 ? 1 : 0)) * t.cos, (d.chestD + 1) * t.sin);
    for (let x = rnd(c - w + 0.5); x <= rnd(c + w - 0.5); x++) {
      // Notches between the lobes in the lower two rows.
      const u = (((x - c) / Math.max(1, w)) * 2 + 2) % 1;
      if (i >= 2 && (u < 0.18 || u > 0.82) && i === 3) continue;
      if (i === 3 && Math.abs(x - c) < 1 && t.cos > 0.3) continue;
      m.set(x, yOf(y));
    }
  }
  s.put(m, TRIM, { shade: 0.36, light: 0.2, top: true, tone: (x, y, tn) => (y === yOf(d.shoulder - 3) || y === yOf(d.shoulder - 2) && tn === 3 && (x + y) % 3 === 0 ? 2 : tn), zone: (_x, y) => (y === yOf(d.shoulder - 3) ? ACCENT : TRIM) });
}

function cloak(t: Turn, d: Dims, yOf: (y: number) => number, centre: (y: number) => number, drift: (f: number) => number) {
  const m = new Mask();
  const end = 2 + Math.round(d.leg * 0.2);
  for (let y = d.shoulder; y >= end; y--) {
    const f = (d.shoulder - y) / (d.shoulder - end);
    const w = Math.hypot((d.shoulderW + 0.5 + f * 2) * t.cos, (d.chestD + 0.5 + f) * t.sin);
    // Hung from the shoulders, it trails behind the body as it turns.
    const c = centre(Math.max(y, d.hip)) - t.sx * t.sin * 1.5 + drift(Math.max(0, (d.hip - y) / Math.max(1, d.hip - end)));
    m.span(Math.min(GY - 1, yOf(y)), rnd(c - w + 0.5), rnd(c + w - 0.5));
  }
  return m;
}

/** Where a tool's head is, a haft's length out from the working hand. */
function toolTip(t: Turn, r: Rig, length = 9): J | undefined {
  if (!r.tool) return undefined;
  const hand = r.arms[r.near].end,
    n = len(r.tool) || 1;
  return project(t, [hand[0] + (r.tool[0] / n) * length, hand[1] + (r.tool[1] / n) * length, hand[2] + (r.tool[2] / n) * length]);
}

/** The path the fastest thing took into this frame, as a pale trail. */
function smears(s: Sheet, t: Turn, r: Rig, prev: Rig) {
  const m = new Mask();
  if (r.smear === "feet")
    for (const leg of r.legs) {
      const [x, y] = project(t, leg.end);
      m.line(x, y + 3, x, y + 6, 1);
    }
  else {
    const now = project(t, r.arms[r.near].end),
      was = project(t, prev.arms[r.near].end);
    m.line(was[0], was[1], now[0], now[1], 3);
    const tip = toolTip(t, r),
      before = toolTip(t, prev) ?? was;
    if (r.smear === "tool" && tip) {
      m.line(before[0], before[1], tip[0], tip[1], 2);
      m.line((before[0] + was[0]) / 2, (before[1] + was[1]) / 2, (tip[0] + now[0]) / 2, (tip[1] + now[1]) / 2, 2);
    }
  }
  s.put(m, SMEAR, { ring: "none", shade: 0 });
}

function drawProp(ctx: CanvasRenderingContext2D, prop: CarriedArt, t: Turn, r: Rig, d: Dims) {
  const arms = r.arms.map((arm) => project(t, arm.end));
  if (r.tool) {
    // Turned along the tool: every screen pixel near the haft looks back into
    // the art, so a rotated tool has no holes.
    const hand = arms[r.near],
      tip = toolTip(t, r)!;
    let vx = tip[0] - hand[0],
      vy = tip[1] - hand[1];
    const n = Math.hypot(vx, vy) || 1;
    vx /= n;
    vy /= n;
    // Digging tools are drawn head-down in the atlas, cutting ones head-up.
    const down = /shovel|rake|scythe|spade|hoe|pitchfork/.test(prop.sprite);
    const k = Math.min(1, 27 / prop.height),
      px = (prop.width - 1) / 2,
      py = prop.height * (down ? 0.28 : 0.72);
    const src = prop.image.getContext("2d")!.getImageData(0, 0, prop.width, prop.height).data;
    const reach = Math.hypot(prop.width, prop.height) * k;
    ctx.save();
    if (hand[2] < -1.2) ctx.globalCompositeOperation = "destination-over";
    for (let y = Math.floor(hand[1] - reach); y <= hand[1] + reach; y++)
      for (let x = Math.floor(hand[0] - reach); x <= hand[0] + reach; x++) {
        const rx = x + 0.5 - hand[0],
          ry = y + 0.5 - hand[1];
        const along = (rx * vx + ry * vy) / k;
        const sx = Math.round(px + (rx * -vy + ry * vx) / k),
          sy = Math.round(down ? py + along : py - along);
        if (sx < 0 || sy < 0 || sx >= prop.width || sy >= prop.height) continue;
        const i = (sy * prop.width + sx) * 4;
        if (src[i + 3] < 128) continue;
        ctx.fillStyle = `rgb(${src[i]},${src[i + 1]},${src[i + 2]})`;
        ctx.fillRect(x, y, 1, 1);
      }
    ctx.restore();
    return;
  }
  const near = arms[1][2] >= arms[0][2] ? arms[1] : arms[0];
  const hand = prop.kind === "both" ? [(arms[0][0] + arms[1][0]) / 2, (arms[0][1] + arms[1][1]) / 2, 1] : near;
  let x = Math.round(hand[0] - prop.width / 2),
    y = Math.round(hand[1] - prop.height * 0.7);
  if (prop.kind === "both") y = Math.round(hand[1] - prop.height * 0.6);
  if (prop.kind === "side") y = Math.round(hand[1] - 2);
  if (prop.kind === "head") y = Math.round(GY - d.shoulder - 14 - r.rise - prop.height + 3);
  if (prop.kind === "back") {
    x = Math.round(CX - prop.width / 2);
    y = Math.round(GY - d.shoulder - r.rise - 1);
  }
  const under = prop.kind === "back" ? t.view !== "back" && t.view !== "bq" : hand[2] < -1.2;
  ctx.save();
  if (under) ctx.globalCompositeOperation = "destination-over";
  ctx.drawImage(prop.image, x, y);
  ctx.restore();
}
