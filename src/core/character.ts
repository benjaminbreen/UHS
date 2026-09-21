import type { Material } from "../content/characters/wardrobe/cloth";
import { random } from "./random";
export const hairStyles = [
  "original",
  "cropped",
  "curls",
  "bob",
  "long",
  "braid",
  "topknot",
  "bald",
] as const;
export type FacialHair = "sparse" | "average" | "full";

/**
 * How often each is actually worn. A flat list put a goatee, a handlebar and
 * a forked beard each on one man in twelve, which is why every other face in
 * the street had one. Rare styles have to be rare by weight, not by being one
 * entry among many.
 */
export const beardWeights = {
  none: 30,
  stubble: 20,
  short: 14,
  long: 6,
  moustache: 5,
  sideburns: 2,
  chinstrap: 1,
  goatee: 0.6,
  handlebar: 0.6,
  forked: 0.4,
} as const;

/** Populations differ in how much facial hair grows, so the kits carry it. */
const facialHairScale: Record<FacialHair, Record<string, number>> = {
  sparse: { none: 3.2, stubble: 1.4, moustache: 0.9, short: 0.35, long: 0.15, forked: 0.1, sideburns: 0.3, chinstrap: 0.3 },
  average: {},
  full: { none: 0.6, stubble: 0.9, short: 1.5, long: 1.8, forked: 1.4 },
};

export function pickBeard(r: number, density: FacialHair = "average") {
  const scale = facialHairScale[density];
  const entries = (
    Object.entries(beardWeights) as [keyof typeof beardWeights, number][]
  ).map(([k, w]) => [k, w * (scale[k] ?? 1)] as const);
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let x = r * total;
  for (const [style, w] of entries) {
    x -= w;
    if (x < 0) return style;
  }
  return "none" as const;
}

export const beardStyles = [
  "none",
  "stubble",
  "moustache",
  "handlebar",
  "goatee",
  "sideburns",
  "chinstrap",
  "short",
  "long",
  "forked",
] as const;
export const garments = [
  "tunic",
  "long-tunic",
  "skirt",
  "robe",
  "dress",
  "shirt",
  "coat",
  "wrap",
  /** Bare above the waist. Ordinary in hot climates and at hard labour for
   * most of human history; the slot is empty, not missing. */
  "none",
  /** An over-layer that hangs open on a contrasting inner one: kaftan, kimono,
   * boubou, sherwani, surcoat. The most widespread form the shipped set could
   * not draw. */
  "open-robe",
  /** A rectangle with a slit for the head: square shoulders, straight sides,
   * no sleeve. */
  "poncho",
  /** A panel hung front and back from a waist cord. */
  "loincloth",
  /** A wide skirted court dress over a stiffened underskirt. */
  "gown",
  /** A sealed one-piece: pressure suit, flight suit, coverall. */
  "suit",
] as const;
/** Appended, never reordered. */
/** Appended, never reordered — see the note on `garments`. */
export const headwear = [
  "none",
  "band",
  "cap",
  "hood",
  "wrap",
  /** A stiff crown with a brim: the nineteenth-century townsman's hat. */
  "bowler",
  /** Soft crown pulled forward over a short peak; the newsboy cap. */
  "flat-cap",
  /** Tall crown, long curved peak. */
  "ball-cap",
  /** Wide brim against sun or rain, straw or felt. */
  "brimmed",
  /** A cone of straw or reed, from a single woven piece. */
  "conical",
  /** Cloth wound in bulk around the head. */
  "turban",
  /** Cloth over the hair, falling to the shoulders. */
  "headscarf",
  /** A short brimless cylinder. */
  "fez",
  /** Cloth over the head and past the shoulder, sometimes across the face. */
  "veil",
  /** A ring sitting proud of the brow: circlet, diadem, head-ring. */
  "fillet",
  /** Feathers or fibre standing above the crown. */
  "plume",
  /** A powdered court wig, rolled at the sides. */
  "wig",
  /** A hard military helmet. */
  "helmet",
  /** A sealed bubble helmet with a visor across it. */
  "visor",
] as const;
/** How the garment is patterned. `auto` keeps the hashed default. */
export const motifs = [
  "auto",
  "plain",
  "placket",
  "band",
  "yoke",
  "stitch",
  /** Horizontal bands the width of the body: the Andean and Mesoamerican
   * signature, and the one pattern that reads at this size. */
  "stripes",
  /** Two-way check: flannel, madras, tartan. */
  "plaid",
  /** Contrast shoulders and a chest number: the sports jersey. */
  "jersey",
] as const;
/** What covers the leg between hem and ankle. */
export const leggings = [
  "none",
  "hose",
  "trousers",
  "wrapped",
  /** A sheet wound round the lower body: sarong, lungi, dhoti, kanga, izaar. */
  "sarong",
  /** Cut wide and falling straight to the ankle: hakama, salwar, sarouel. */
  "wide",
] as const;
export const footwear = [
  "none",
  "sandals",
  "shoes",
  "boots",
  /** Rubber-soled canvas or leather trainers; white sole. */
  "sneakers",
] as const;
export const eyewear = ["none", "glasses", "sunglasses"] as const;
export const neckStyles = ["beads", "chain"] as const;
export const beltStyles = ["none", "cord", "sash", "leather", "wide"] as const;
export const headShapes = [
  "original",
  "round",
  "long",
  "broad",
  "oval",
] as const;
export const jawShapes = [
  "original",
  "square",
  "soft",
  "pointed",
  "small",
] as const;
export const eyeSizes = ["small", "medium", "large"] as const;
export const eyeShapes = ["round", "almond", "narrow"] as const;
/**
 * The upper lid. A crease folds well above the lash line; a low crease sits
 * close to it and is partly hidden by it; a monolid has none. All three occur
 * everywhere, in proportions that differ by population — which is why the
 * regional kits carry the proportions rather than the drawing carrying one.
 */
export const eyelidFolds = ["crease", "low-crease", "monolid"] as const;
export type EyelidFold = (typeof eyelidFolds)[number];
export const eyeSpacings = ["close", "average", "wide"] as const;
export const browShapes = ["straight", "arched", "heavy"] as const;
/**
 * Profile shapes. `short`, `straight`, `broad` and `aquiline` are the original
 * four; the rest were added because four nose types over a whole world meant
 * every fourth face shared a profile.
 */
export const noseShapes = [
  "short",
  "straight",
  "broad",
  "aquiline",
  /** A convex bridge that drops past the base: the tip points down. */
  "hooked",
  /** Short, concave, tip turned up. */
  "snub",
  /** Narrow bridge, wide fleshy tip. */
  "bulbous",
  /** Thin bridge and small wings all the way down. */
  "narrow",
  /** Low flat bridge with wide wings and little projection. */
  "flat",
] as const;
export type NoseShape = (typeof noseShapes)[number];
export const mouthShapes = ["narrow", "soft", "full", "wide"] as const;
export const chinShapes = ["short", "average", "long"] as const;
export const hairTextures = ["straight", "wavy", "curly", "coiled"] as const;
export type HairTexture = (typeof hairTextures)[number];
/** Height of the nasal bridge at the root, between the eyes. */
export const noseBridges = ["low", "average", "high"] as const;
export type NoseBridge = (typeof noseBridges)[number];
/**
 * Small worn ornament and body modification drawn on the head. Which of these
 * occur, and how often, is regional content carried by the appearance kit —
 * this file only names the shapes the painter knows how to draw.
 */
export const earOrnaments = [
  "none",
  /** A single point at the lobe. */
  "stud",
  /** A ring hanging clear of the lobe. */
  "hoop",
  /** A stud with something hanging from it. */
  "drop",
  /** A plug or flare filling a stretched lobe. */
  "spool",
  /** A band clipped to the upper helix. */
  "cuff",
] as const;
export type EarOrnament = (typeof earOrnaments)[number];
export const noseOrnaments = ["none", "stud", "ring", "septum"] as const;
export type NoseOrnament = (typeof noseOrnaments)[number];
/** Where a face mark sits. The pattern is schematic, never a specific design. */
export const faceMarks = [
  "none",
  "cheek-lines",
  "cheek-dots",
  "chin-lines",
  "temple-rays",
  "brow-band",
  "forehead-mark",
  "nose-bar",
  "cheek-block",
] as const;
export type FaceMark = (typeof faceMarks)[number];
/** Ink sits in the skin, a scar stands off it, paint covers it. */
export const markStyles = ["ink", "scar", "paint"] as const;
export type MarkStyle = (typeof markStyles)[number];
export const ornamentMetals = [
  "gold",
  "silver",
  "copper",
  "bone",
  "shell",
  "jet",
] as const;
export type OrnamentMetal = (typeof ornamentMetals)[number];
export type FaceAdornment = {
  ears?: EarOrnament;
  nose?: NoseOrnament;
  marks?: FaceMark;
  markStyle?: MarkStyle;
  /** Ink or paint colour. Scarification ignores it and uses the skin's tones. */
  markColor?: string;
  metal?: OrnamentMetal;
};
export const hairlines = ["low", "average", "high", "widows-peak"] as const;
export const faceDetails = ["clear", "freckles", "lines", "weathered"] as const;
export const bodyShapes = ["straight", "tapered", "rounded"] as const;
export const postures = [
  "upright",
  "relaxed",
  "hands-together",
  "hand-on-hip",
  "stooped",
  "attentive",
] as const;
export const sleeveStyles = ["short", "long", "loose", "none"] as const;
/** Where a wearable item sits. Composed in this order, later slots on top. */
export const wearSlots = [
  "body",
  "over",
  "belt",
  "head",
  "neck",
  "ears",
  "legs",
  "feet",
  "eyes",
] as const;
export type WearSlot = (typeof wearSlots)[number];
export const hemStyles = ["plain", "split", "slanted"] as const;
export type CharacterPhysique = {
  strength: number;
  sex: "unspecified" | "male" | "female";
};
export type CharacterFace = {
  revision: 1;
  eyeSize: (typeof eyeSizes)[number];
  eyeShape: (typeof eyeShapes)[number];
  eyeSpacing: (typeof eyeSpacings)[number];
  /** Optional: faces recorded before the lid was described read as "crease". */
  eyelid?: EyelidFold;
  /** A fold of the upper lid covering the inner corner of the eye. */
  epicanthus?: boolean;
  brows: (typeof browShapes)[number];
  nose: (typeof noseShapes)[number];
  mouth: (typeof mouthShapes)[number];
  chin: (typeof chinShapes)[number];
  hairTexture: (typeof hairTextures)[number];
  /** Optional: faces recorded before the bridge was described read as average. */
  noseBridge?: NoseBridge;
  hairline: (typeof hairlines)[number];
  detail: (typeof faceDetails)[number];
};
export function generateFace(seed: string, index = 0, age = 30): CharacterFace {
  const pick = <T>(key: string, values: readonly T[]) =>
    values[
      Math.floor(random(seed, "portrait-face-v1", index, key) * values.length)
    ];
  return {
    revision: 1,
    eyeSize: pick("eye-size", eyeSizes),
    eyeShape: pick("eye-shape", eyeShapes),
    // Weighted toward average. An even third each put wide-set eyes on a
    // third of everyone, which is not what a third of faces look like.
    eyeSpacing: pick("eye-spacing", [
      "average",
      "average",
      "average",
      "average",
      "close",
      "close",
      "wide",
    ] as const),
    // The unplaced default. A regional kit overrides both of these.
    eyelid: pick("eyelid", ["crease", "crease", "low-crease"] as const),
    epicanthus: random(seed, "portrait-face-v1", index, "epicanthus") < 0.12,
    brows: pick("brows", browShapes),
    // Weighted: the four common profiles stay common, so the five added
    // shapes read as variation rather than as a nose lottery.
    nose: pick("nose", [
      "straight",
      "straight",
      "short",
      "broad",
      "broad",
      "broad",
      "aquiline",
      "hooked",
      "snub",
      "bulbous",
      "narrow",
      "flat",
    ] as const),
    mouth: pick("mouth", mouthShapes),
    chin: pick("chin", chinShapes),
    hairTexture: pick("hair-texture", hairTextures),
    noseBridge: pick("nose-bridge", ["average", "average", "high", "low"] as const),
    hairline: pick("hairline", hairlines),
    detail:
      age >= 55
        ? pick("older-detail", ["lines", "weathered"] as const)
        : pick("detail", ["clear", "clear", "clear", "freckles"] as const),
  };
}
/**
 * Which ornaments and marks a population uses, and how often. Weighted by
 * repetition, the way the appearance kit's other pools are. Absent pools fall
 * back to a deliberately thin worldwide spread: mostly nothing, a few ears.
 */
export type AdornmentPools = {
  ears?: readonly EarOrnament[];
  nose?: readonly NoseOrnament[];
  /** Where a nose ornament is one sex's convention, not everyone's. */
  noseSex?: CharacterPhysique["sex"];
  marks?: readonly FaceMark[];
  /** Where marks are a coming-of-age thing rather than a childhood one. */
  marksFrom?: number;
  markStyle?: readonly MarkStyle[];
  markColors?: readonly string[];
  metals?: readonly OrnamentMetal[];
};
const worldwideEars: readonly EarOrnament[] = [
  "none",
  "none",
  "none",
  "none",
  "none",
  "none",
  "stud",
  "hoop",
  "hoop",
  "drop",
];
const worldwideMetals: readonly OrnamentMetal[] = [
  "gold",
  "silver",
  "copper",
  "copper",
  "bone",
  "shell",
];
/** Ink blues and blacks, ochre and lime paint, and one pale chalk. */
export const markColors = [
  "#2a2740",
  "#1d2a30",
  "#38212e",
  "#7a3320",
  "#b8792c",
  "#d9cdb4",
] as const;
/**
 * Roughly what an ornament in this material is worth. Not a price: enough of
 * an ordering that a person in worn cloth is not drawn in gold.
 */
const METAL_RANK: Record<OrnamentMetal, number> = {
  bone: 0,
  shell: 0,
  copper: 1,
  jet: 1,
  silver: 2,
  gold: 3,
};
/**
 * The metal a person's ornaments are actually made of. The kit still decides
 * which metals exist where; means only chooses within that, so an ornament
 * says something about the wearer rather than only about the region. Falls
 * back to the drawn metal where the kit's pool has nothing in range.
 */
export function metalForMeans(
  pool: readonly OrnamentMetal[] | undefined,
  chosen: OrnamentMetal,
  /** Cloth quality: -1 worn, 0 ordinary, 1..3 the fine tiers. */
  quality: number,
  seed: string,
  id: string,
): OrnamentMetal {
  const want = quality <= -1 ? 0 : quality === 0 ? 1 : quality === 1 ? 2 : 3;
  const options = (pool ?? [chosen]).filter(
    (metal) => Math.abs(METAL_RANK[metal] - want) <= 1,
  );
  if (!options.length) return chosen;
  return options[
    Math.floor(random(seed, "adornment-metal", 0, id) * options.length)
  ];
}
export function generateAdornment(
  seed: string,
  index: number,
  age: number,
  sex: CharacterPhysique["sex"],
  pools: AdornmentPools = {},
): FaceAdornment {
  const pick = <T>(key: string, values: readonly T[]) =>
    values[
      Math.floor(random(seed, "adornment-v1", index, key) * values.length)
    ];
  const ears = pick("ears", pools.ears ?? worldwideEars);
  // A stretched lobe or a heavy hoop is not a small child's.
  const child = age < 10;
  const nosePool = pools.nose ?? (["none"] as const);
  const wrongSex =
    pools.noseSex !== undefined &&
    pools.noseSex !== "unspecified" &&
    sex !== pools.noseSex;
  const marks: FaceMark =
    age < (pools.marksFrom ?? 12)
      ? "none"
      : pick("marks", pools.marks ?? (["none"] as const));
  return {
    ears: child && (ears === "spool" || ears === "hoop") ? "stud" : ears,
    nose: child || wrongSex ? "none" : pick("nose", nosePool),
    marks,
    markStyle: pick("mark-style", pools.markStyle ?? (["ink"] as const)),
    markColor: pick("mark-color", pools.markColors ?? markColors),
    metal: pick("metal", pools.metals ?? worldwideMetals),
  };
}
/** What a person is wearing on the face and what is worked into the skin. */
export type AdornmentNote = {
  kind: "ear" | "nose" | "neck" | "mark";
  label: string;
};
const METAL_WORD: Record<OrnamentMetal, string> = {
  gold: "gold",
  silver: "silver",
  copper: "copper",
  bone: "bone",
  shell: "shell",
  jet: "jet",
};
const EAR_WORD: Record<Exclude<EarOrnament, "none">, string> = {
  stud: "stud in the ear",
  hoop: "hoop through the lobe",
  drop: "drop earring",
  spool: "spool in a stretched lobe",
  cuff: "cuff on the ear",
};
const NOSE_WORD: Record<Exclude<NoseOrnament, "none">, string> = {
  stud: "stud in the nose",
  ring: "ring through the nostril",
  septum: "ring through the septum",
};
const MARK_WORD: Record<Exclude<FaceMark, "none">, string> = {
  "cheek-lines": "Lines across both cheeks",
  "cheek-dots": "Rows of dots on the cheeks",
  "chin-lines": "Lines down the chin",
  "temple-rays": "Rays at the temples",
  "brow-band": "A band across the forehead",
  "forehead-mark": "A mark on the forehead",
  "nose-bar": "A bar across the cheekbones",
  "cheek-block": "A block of colour on the cheek",
};
const MARK_STYLE_WORD: Record<MarkStyle, string> = {
  ink: "inked into the skin",
  scar: "cut into the skin",
  paint: "painted on",
};
/**
 * Says what the portrait is showing, in plain words. Description only: the
 * drawn patterns are schematic, so nothing here names a design, a people or
 * what a mark might mean to the person wearing it.
 */
export function describeAdornment(a: CharacterAppearance): AdornmentNote[] {
  const notes: AdornmentNote[] = [];
  const metal = METAL_WORD[a.adornment?.metal ?? "gold"];
  const worn = a.adornment?.ears;
  // A worn pair of earrings with no style recorded draws as a drop.
  const ears: EarOrnament =
    worn && worn !== "none" ? worn : a.wearing.earrings ? "drop" : "none";
  if (ears !== "none")
    notes.push({ kind: "ear", label: capital(`${metal} ${EAR_WORD[ears]}`) });
  const nose = a.adornment?.nose ?? "none";
  if (nose !== "none")
    notes.push({ kind: "nose", label: capital(`${metal} ${NOSE_WORD[nose]}`) });
  if (a.wearing.necklace)
    notes.push({
      kind: "neck",
      label: capital(
        a.wearing.neckStyle === "chain"
          ? `${metal} chain`
          : `${metal} bead necklace`,
      ),
    });
  const marks = a.adornment?.marks ?? "none";
  if (marks !== "none")
    notes.push({
      kind: "mark",
      label: `${MARK_WORD[marks]}, ${MARK_STYLE_WORD[a.adornment?.markStyle ?? "ink"]}`,
    });
  return notes;
}
const capital = (text: string) => text[0].toUpperCase() + text.slice(1);
/** Weighted art direction, not a biological rule or an inference of personality. */
export function faceFromTraits(
  seed: string,
  index: number,
  age: number,
  physique: CharacterPhysique,
) {
  const r = random(seed, "face-defaults", index),
    h = random(seed, "head-defaults", index);
  const head: (typeof headShapes)[number] =
    age < 13 && h < 0.6
      ? "round"
      : h < 0.35
        ? "original"
        : h < 0.55
          ? "oval"
          : h < 0.72
            ? "long"
            : h < 0.88
              ? "broad"
              : "round";
  const jaw: (typeof jawShapes)[number] =
    age < 13
      ? r < 0.7
        ? "soft"
        : "small"
      : physique.strength > 70 &&
          age >= 25 &&
          age <= 60 &&
          r < (physique.sex === "male" ? 0.7 : 0.5)
        ? "square"
        : age >= 65 && physique.sex === "female" && r < 0.65
          ? "small"
          : r < 0.4
            ? "original"
            : r < 0.58
              ? "soft"
              : r < 0.75
                ? "square"
                : r < 0.9
                  ? "pointed"
                  : "small";
  return { head, jaw };
}
export type CharacterAppearance = {
  physique?: CharacterPhysique;
  face?: CharacterFace;
  /** Absent on saves written before ornaments and marks existed. */
  adornment?: FaceAdornment;
  head?: (typeof headShapes)[number];
  jaw?: (typeof jawShapes)[number];
  bodyShape?: (typeof bodyShapes)[number];
  posture?: (typeof postures)[number];
  height: -2 | -1 | 0 | 1 | 2;
  build: -1 | 0 | 1 | 2;
  skin: string;
  hairColor: string;
  hair: (typeof hairStyles)[number];
  beard: (typeof beardStyles)[number];
  wearing: {
    sleeves?: (typeof sleeveStyles)[number];
    hem?: (typeof hemStyles)[number];
    shoulderCloth?: boolean;
    garment: (typeof garments)[number];
    belt?: (typeof beltStyles)[number];
    color: string;
    lowerColor: string;
    trim: string;
    cloak: boolean;
    cloakColor: string;
    headwear: (typeof headwear)[number];
    /** A short cape over the shoulders, stopping at the elbow. Distinct from
     * `cloak`, which falls to the hem. */
    mantle?: boolean;
    motif?: (typeof motifs)[number];
    /** Optional, like sleeves and hem: saves written before legs and feet had
     * slots read as bare. */
    leggings?: (typeof leggings)[number];
    footwear?: (typeof footwear)[number];
    necklace: boolean;
    /** Absent reads as beads, the older default. */
    neckStyle?: (typeof neckStyles)[number];
    eyewear?: (typeof eyewear)[number];
    earrings: boolean;
    /** What the body garment is made of and how well, carried through from the
     * worn item's id so the drawn cloth and the item's name agree. Absent on
     * saves written before cloth had a material, and on authored looks. */
    material?: Material;
    /** -1 worn, 0 ordinary, 1..3 the fine tiers. */
    quality?: number;
  };
};
export const skinColors = [
  "#c18a54",
  "#a97143",
  "#d3a16a",
  "#70472f",
  "#8c5d40",
  "#b78464",
  "#e4b994",
  "#f0ceb0",
];
export const clothColors = [
  "#e4d6af",
  "#ab5a36",
  "#38798b",
  "#738245",
  "#b89343",
  "#75628b",
  "#743f45",
  "#424f62",
  "#59483d",
  "#b4b6a4",
  "#2f625b",
  "#d59a76",
];
export const heightLabels: Record<CharacterAppearance["height"], string> = {
  [-2]: "Child · −6 pixels",
  [-1]: "Youth / short adult · −3 pixels",
  0: "Original · average adult",
  1: "Tall · +3 pixels",
  2: "Tallest · +6 pixels",
};
export function allowedHeights(age = 30): CharacterAppearance["height"][] {
  return age < 13 ? [-2, -1] : age < 16 ? [-1, 0] : [-1, 0, 1, 2];
}
/** Art distribution, not a claim about historical population measurements. */
export function heightForAge(
  seed: string,
  index = 0,
  age = 30,
): CharacterAppearance["height"] {
  if (age < 13) return -2;
  const roll = random(seed, "character-art", index, "height");
  if (age < 16) return roll < 0.7 ? -1 : 0;
  // Adults: 10% short, 80% original, 9% tall, 1% tallest.
  return roll < 0.1 ? -1 : roll < 0.9 ? 0 : roll < 0.99 ? 1 : 2;
}
export function appearanceForAge(
  appearance: CharacterAppearance,
  age = 30,
): CharacterAppearance {
  if (allowedHeights(age).includes(appearance.height)) return appearance;
  return { ...appearance, height: age < 13 ? -2 : age < 16 ? -1 : 0 };
}
export function generateAppearance(
  seed: string,
  index = 0,
  age = 30,
  traits?: Partial<CharacterPhysique>,
): CharacterAppearance {
  const n = (key: string, max: number) =>
    Math.floor(random(seed, "character-art", index, key) * max);
  // Every drawn body has a sex; "unspecified" from a caller means "draw one".
  const sex =
    traits?.sex && traits.sex !== "unspecified"
      ? traits.sex
      : n("sex", 2)
        ? "female"
        : "male";
  const physique: CharacterPhysique = {
    strength:
      age < 13
        ? 15 + n("strength", 20)
        : age >= 65
          ? 25 + n("strength", 40)
          : 30 + n("strength", 65),
    ...traits,
    sex,
  };
  return {
    physique,
    face: generateFace(seed, index, age),
    adornment: generateAdornment(seed, index, age, sex),
    ...faceFromTraits(seed, index, age, physique),
    bodyShape:
      physique.strength > 70
        ? "tapered"
        : bodyShapes[n("body-shape", bodyShapes.length)],
    posture:
      age >= 65 && n("elder-posture", 3) === 0
        ? "stooped"
        : (
            [
              "upright",
              "upright",
              "relaxed",
              "hands-together",
              "hand-on-hip",
              "attentive",
            ] as const
          )[n("posture", 6)],
    height: heightForAge(seed, index, age),
    build:
      age < 16
        ? -1
        : n("build", 100) < 75
          ? -1
          : n("build", 100) < 93
            ? 0
            : n("build", 100) < 99
              ? 1
              : 2,
    skin: skinColors[n("skin", skinColors.length)],
    hairColor: [
      "#292823",
      "#493627",
      "#795039",
      "#a88850",
      "#aaa699",
      "#a35432",
    ][n("hair-color", 6)],
    hair: hairStyles[n("hair", hairStyles.length)],
    beard:
      age < 16 || sex !== "male"
        ? "none"
        : pickBeard(random(seed, "character-art", index, "beard")),
    wearing: {
      sleeves: sleeveStyles[n("sleeves", sleeveStyles.length)],
      hem: hemStyles[n("hem", hemStyles.length)],
      shoulderCloth: n("shoulder-cloth", 4) === 0,
      // The base roll stays on the eight shipped garments and the five
      // shipped hats. Era-specific dress is the wardrobe's job, not a random
      // draw: a bowler has no business in the Neolithic.
      garment: garments[n("garment", 8)],
      belt: (
        ["leather", "leather", "none", "none", "cord", "sash", "wide"] as const
      )[n("belt", 7)],
      color: clothColors[n("cloth", clothColors.length)],
      lowerColor: clothColors[n("lower", clothColors.length)],
      trim: clothColors[n("trim", clothColors.length)],
      cloak: n("cloak", 4) === 0,
      cloakColor: clothColors[n("cloak-color", clothColors.length)],
      headwear: headwear[n("headwear", 5)],
      leggings: (["none", "none", "hose", "trousers"] as const)[n("legs", 4)],
      footwear: (["none", "shoes", "shoes", "sandals"] as const)[n("feet", 4)],
      necklace: n("necklace", 3) === 0,
      earrings: n("earrings", 4) === 0,
    },
  };
}
/** Legacy sprite is the wardrobe source until explicit appearance data exists.
 * No historical garment is guessed from a person's complexion or name. */
/**
 * The complexion and hair range a scene draws from. Supplied by the caller,
 * because the art palette is researched content and this module is not allowed
 * to know about it. Without one, an actor who never went through
 * `generateCharacter` fell back to the unrestricted lab palette, which is how a
 * Song-dynasty street ended up with blond and auburn hair in it.
 */
export type AppearancePalette = {
  skin: readonly string[];
  hairColors: readonly string[];
  hairStyles: readonly CharacterAppearance["hair"][];
};
export function actorAppearance(
  actor: {
    id: string;
    sprite: string;
    appearance?: CharacterAppearance;
    age?: number;
  },
  palette?: AppearancePalette,
): CharacterAppearance {
  const age = actor.age ?? 30;
  if (actor.appearance) return appearanceForAge(actor.appearance, age);
  const [, skin = "0", cloth = "0"] = actor.sprite.split("-");
  const seed = `${actor.id}:${actor.sprite}`;
  const a = generateAppearance(seed, 0, age);
  const from = <T>(list: readonly T[], key: string) =>
    list[Math.floor(random(seed, "character-palette", key) * list.length)];
  return {
    ...a,
    height: actor.id === "player" && age >= 16 ? 0 : a.height,
    skin: palette
      ? from(palette.skin, "skin")
      : (skinColors[Number(skin) % 3] ?? skinColors[0]),
    ...(palette && {
      hairColor:
        age >= 60 && random(seed, "character-palette", "grey") < 0.5
          ? "#aaa699"
          : from(palette.hairColors, "hair-color"),
      hair: pickHair(
        random(seed, "character-palette", "hair"),
        random(seed, "character-palette", "balding"),
        a.physique?.sex ?? "unspecified",
        age,
        palette.hairStyles,
      ),
    }),
    wearing: {
      ...a.wearing,
      garment: "tunic",
      color: clothColors[Number(cloth) % 6] ?? clothColors[0],
      lowerColor: "#c3b28a",
      cloak: false,
      headwear: "none",
      necklace: false,
      earrings: false,
    },
  };
}
export const originalAppearance: CharacterAppearance = {
  height: 0,
  build: -1,
  skin: skinColors[0],
  hairColor: "#292823",
  hair: "original",
  beard: "none",
  wearing: {
    sleeves: "short",
    hem: "plain",
    shoulderCloth: false,
    garment: "tunic",
    color: clothColors[4],
    lowerColor: "#a5784a",
    trim: "#c3a366",
    cloak: false,
    cloakColor: "#59483d",
    headwear: "none",
    necklace: false,
    earrings: false,
  },
};

type HairStyle = CharacterAppearance["hair"];
export type HairWeights = Partial<Record<HairStyle, number>>;

/**
 * How often each style is worn, by sex. A flat pick from a kit's list gave
 * five men in seven hair to the shoulders, since only "cropped" is short.
 * The kit still decides which styles occur; these decide how often.
 */
export const hairWeights: Record<"male" | "female", HairWeights> = {
  male: { cropped: 50, curls: 20, long: 8, topknot: 5, braid: 3, bob: 2 },
  female: { long: 30, braid: 25, bob: 15, topknot: 15, curls: 10, cropped: 3 },
};

/** Manual work favours hair cut short or tied out of the way. */
const labourScale: Record<"male" | "female", HairWeights> = {
  male: { cropped: 1.5, long: 0.5, bob: 0.5 },
  female: { braid: 1.4, topknot: 1.4, long: 0.6, bob: 0.8 },
};

/**
 * Baldness is gated separately: it is overwhelmingly male and late-onset, so
 * "bald" in a kit's list means only that shaving or balding occurs there.
 */
export function pickHair(
  roll: number,
  baldRoll: number,
  sex: CharacterPhysique["sex"],
  age: number,
  pool: readonly HairStyle[],
  options: {
    scale?: Partial<Record<"male" | "female", HairWeights>>;
    labouring?: boolean;
  } = {},
): HairStyle {
  const baldChance =
    sex !== "male"
      ? 0.01
      : age < 30
        ? 0.02
        : age < 45
          ? 0.2
          : age < 60
            ? 0.4
            : 0.55;
  if (pool.includes("bald") && baldRoll < baldChance) return "bald";
  const sexes: ("male" | "female")[] =
    sex === "unspecified" ? ["male", "female"] : [sex];
  const weight = (h: HairStyle) =>
    sexes.reduce(
      (sum, x) =>
        sum +
        (hairWeights[x][h] ?? 0) *
          (options.scale?.[x]?.[h] ?? 1) *
          (options.labouring ? (labourScale[x][h] ?? 1) : 1),
      0,
    );
  const entries = pool
    .filter((h) => h !== "bald" && h !== "original")
    .map((h) => [h, weight(h)] as const);
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  if (!total) return "cropped";
  let x = roll * total;
  for (const [h, w] of entries) {
    x -= w;
    if (x < 0) return h;
  }
  return entries[entries.length - 1]![0];
}
