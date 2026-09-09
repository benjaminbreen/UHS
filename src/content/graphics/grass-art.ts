import type { Ecology } from "../ecology/profiles";

export const grassPaletteRoles = [
  "base",
  "light",
  "dark",
  "mineral",
  "litter",
  "bladeShadow",
  "bladeLight",
] as const;
export type GrassPaletteRole = (typeof grassPaletteRoles)[number];
export type GrassPaletteRecipe = Record<GrassPaletteRole, string>;
export type GrassArtRecipe = {
  version: 1;
  target: "grass";
  palettes: Record<Ecology, GrassPaletteRecipe>;
  motifs: {
    /** 0 transparent, 1 blade shadow, 2 blade body, 3 blade highlight. */
    turf: string[][];
    /** 0 transparent, 1 light supporting tick. */
    ticks: string[][];
  };
};
export type GrassArt = {
  palettes: Record<Ecology, number[][]>;
  motifs: GrassArtRecipe["motifs"];
};

const palette = (
  base: string,
  light: string,
  dark: string,
  mineral: string,
  litter: string,
  bladeShadow: string,
  bladeLight: string,
): GrassPaletteRecipe => ({
  base,
  light,
  dark,
  mineral,
  litter,
  bladeShadow,
  bladeLight,
});

/** Source recipe for the procedural sward. Keep this plain so exported edits
 * can be compared with it and copied back without decoding an atlas. */
export const defaultGrassArtRecipe: GrassArtRecipe = {
  version: 1,
  target: "grass",
  palettes: {
    grassland: palette(
      "#62a749",
      "#6cab44",
      "#52963f",
      "#b38a5b",
      "#a97c50",
      "#448f3d",
      "#8ec059",
    ),
    "temperate-woodland": palette(
      "#5c9f48",
      "#78b856",
      "#4a8d3d",
      "#a98159",
      "#9d7449",
      "#376f33",
      "#9cd166",
    ),
    "boreal-woodland": palette(
      "#699b52",
      "#83b060",
      "#568a48",
      "#9a7a55",
      "#8f7050",
      "#3d6b3c",
      "#a3c96e",
    ),
    "tropical-woodland": palette(
      "#4f9e42",
      "#6bb64f",
      "#3f8a38",
      "#9a6a45",
      "#8d6642",
      "#2f6c31",
      "#8ecd5e",
    ),
    wetland: palette(
      "#5e9d4a",
      "#7cb45b",
      "#4a8842",
      "#8f7a52",
      "#8a7450",
      "#356a37",
      "#9fcf6c",
    ),
    "dry-scrub": palette(
      "#8fad4f",
      "#aabf62",
      "#7a9c47",
      "#b48f5c",
      "#ad8a5a",
      "#557a36",
      "#cfdc78",
    ),
    desert: palette(
      "#d1b77a",
      "#e0c58e",
      "#b4ae77",
      "#b8a78b",
      "#b09b73",
      "#85834e",
      "#e1cfa1",
    ),
    tundra: palette(
      "#8fa45c",
      "#a9b26f",
      "#7d9552",
      "#a89a7a",
      "#8c8d64",
      "#587047",
      "#c9cc82",
    ),
  },
  motifs: {
    turf: [
      [
        "000020000",
        "000023000",
        "000023000",
        "200022003",
        "230122033",
        "113222331",
        "011222210",
        "001111100",
      ],
      [
        "000010000",
        "000010000",
        "300113003",
        "130123033",
        "120123033",
        "022223210",
        "002122100",
        "000221000",
      ],
    ],
    ticks: [
      [
        "00000000",
        "00100000",
        "01000000",
        "10000000",
        "00000010",
        "00000100",
        "00000000",
        "00000000",
      ],
      [
        "00000000",
        "00000000",
        "00001000",
        "00010000",
        "00100000",
        "00000000",
        "00000000",
        "00000000",
      ],
    ],
  },
};

const decode = (hex: string) => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

export function resolveGrassArt(recipe: GrassArtRecipe): GrassArt {
  return {
    palettes: Object.fromEntries(
      Object.entries(recipe.palettes).map(([ecology, colors]) => [
        ecology,
        grassPaletteRoles.map((role) => decode(colors[role])),
      ]),
    ) as Record<Ecology, number[][]>,
    motifs: recipe.motifs,
  };
}

export const defaultGrassArt = resolveGrassArt(defaultGrassArtRecipe);

export function cloneGrassArtRecipe(): GrassArtRecipe {
  return JSON.parse(JSON.stringify(defaultGrassArtRecipe)) as GrassArtRecipe;
}
