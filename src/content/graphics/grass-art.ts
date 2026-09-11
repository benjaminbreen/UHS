import type { PaletteKey } from "../ecology/profiles";

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
  palettes: Record<PaletteKey, GrassPaletteRecipe>;
  motifs: {
    /** 0 transparent, 1 blade shadow, 2 blade body, 3 blade highlight. */
    turf: string[][];
    /** 0 transparent, 1 light supporting tick. */
    ticks: string[][];
  };
};
export type GrassArt = {
  palettes: Record<PaletteKey, number[][]>;
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
      "#85aa48",
      "#bbbf65",
      "#628b40",
      "#b99460",
      "#a58149",
      "#597839",
      "#d4d782",
    ),
    "temperate-woodland": palette(
      "#568c49",
      "#83ac5c",
      "#3d7042",
      "#9a784f",
      "#766043",
      "#315c39",
      "#abc67a",
    ),
    "boreal-woodland": palette(
      "#71894b",
      "#9aa761",
      "#536e40",
      "#97845f",
      "#786345",
      "#405b35",
      "#bac180",
    ),
    "tropical-woodland": palette(
      "#37834e",
      "#64a44e",
      "#245e42",
      "#ad633e",
      "#66513a",
      "#214d38",
      "#9bc866",
    ),
    wetland: palette(
      "#648b70",
      "#94aa76",
      "#3f7069",
      "#857957",
      "#656b51",
      "#365c50",
      "#b7c58a",
    ),
    "dry-scrub": palette(
      "#b6a45c",
      "#d6be77",
      "#898a51",
      "#cb9a61",
      "#9c794a",
      "#687247",
      "#e6d497",
    ),
    desert: palette(
      "#d5bf93",
      "#ebd6aa",
      "#b6a17c",
      "#bba78b",
      "#aa9068",
      "#8b7956",
      "#f0dfbd",
    ),
    "desert:sahara": palette(
      "#e6b85d",
      "#f6d382",
      "#c98e3f",
      "#d5a05b",
      "#b7833c",
      "#a17136",
      "#ffe3a0",
    ),
    "desert:red-earth": palette(
      "#cc663d",
      "#eb9255",
      "#a44730",
      "#b85338",
      "#8e3f2e",
      "#793d2a",
      "#f7b47a",
    ),
    tundra: palette(
      "#999676",
      "#b9af8b",
      "#727f72",
      "#aca095",
      "#857268",
      "#606858",
      "#d4c7a0",
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
    ) as Record<PaletteKey, number[][]>,
    motifs: recipe.motifs,
  };
}

export const defaultGrassArt = resolveGrassArt(defaultGrassArtRecipe);

export function cloneGrassArtRecipe(): GrassArtRecipe {
  return JSON.parse(JSON.stringify(defaultGrassArtRecipe)) as GrassArtRecipe;
}
