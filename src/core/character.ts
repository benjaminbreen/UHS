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
export const footwear = ["none", "sandals", "shoes", "boots"] as const;
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
export const eyeSpacings = ["close", "average", "wide"] as const;
export const browShapes = ["straight", "arched", "heavy"] as const;
export const noseShapes = ["short", "straight", "broad", "aquiline"] as const;
export const mouthShapes = ["narrow", "soft", "full", "wide"] as const;
export const chinShapes = ["short", "average", "long"] as const;
export const hairTextures = ["straight", "wavy", "curly", "coiled"] as const;
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
  "arms",
  "legs",
  "feet",
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
  brows: (typeof browShapes)[number];
  nose: (typeof noseShapes)[number];
  mouth: (typeof mouthShapes)[number];
  chin: (typeof chinShapes)[number];
  hairTexture: (typeof hairTextures)[number];
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
    eyeSpacing: pick("eye-spacing", eyeSpacings),
    brows: pick("brows", browShapes),
    nose: pick("nose", noseShapes),
    mouth: pick("mouth", mouthShapes),
    chin: pick("chin", chinShapes),
    hairTexture: pick("hair-texture", hairTextures),
    hairline: pick("hairline", hairlines),
    detail:
      age >= 55
        ? pick("older-detail", ["lines", "weathered"] as const)
        : pick("detail", ["clear", "clear", "clear", "freckles"] as const),
  };
}
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
    earrings: boolean;
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
        : (
            [
              "none",
              "none",
              "stubble",
              "moustache",
              "handlebar",
              "goatee",
              "sideburns",
              "chinstrap",
              "short",
              "short",
              "long",
              "forked",
            ] as const
          )[n("beard", 12)],
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
      hair: from(palette.hairStyles, "hair"),
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
