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
] as const;
export const headwear = ["none", "band", "cap", "hood", "wrap"] as const;
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
export const hemStyles = ["plain", "split", "slanted"] as const;
export type CharacterPhysique = {
  strength: number;
  sex: "unspecified" | "male" | "female";
};
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
  const physique: CharacterPhysique = {
    strength:
      age < 13
        ? 15 + n("strength", 20)
        : age >= 65
          ? 25 + n("strength", 40)
          : 30 + n("strength", 65),
    sex: "unspecified",
    ...traits,
  };
  return {
    physique,
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
      age < 16
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
      garment: garments[n("garment", garments.length)],
      belt: (
        ["leather", "leather", "none", "none", "cord", "sash", "wide"] as const
      )[n("belt", 7)],
      color: clothColors[n("cloth", clothColors.length)],
      lowerColor: clothColors[n("lower", clothColors.length)],
      trim: clothColors[n("trim", clothColors.length)],
      cloak: n("cloak", 4) === 0,
      cloakColor: clothColors[n("cloak-color", clothColors.length)],
      headwear: headwear[n("headwear", headwear.length)],
      necklace: n("necklace", 3) === 0,
      earrings: n("earrings", 4) === 0,
    },
  };
}
/** Legacy sprite is the wardrobe source until explicit appearance data exists.
 * No historical garment is guessed from a person's complexion or name. */
export function actorAppearance(actor: {
  id: string;
  sprite: string;
  appearance?: CharacterAppearance;
  age?: number;
}): CharacterAppearance {
  const age = actor.age ?? 30;
  if (actor.appearance) return appearanceForAge(actor.appearance, age);
  const [, skin = "0", cloth = "0"] = actor.sprite.split("-");
  const a = generateAppearance(`${actor.id}:${actor.sprite}`, 0, age);
  return {
    ...a,
    height: actor.id === "player" && age >= 16 ? 0 : a.height,
    skin: skinColors[Number(skin) % 3] ?? skinColors[0],
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
