import type { FieldConfig } from "./field";

export type Approach = "procedural" | "atlas";

export type Settings = {
  approach: Approach;
  palette: number;
  field: FieldConfig;
  rise: number;
  contourWobble: number;
  contourScale: number;
  contourSmoothing: number;
  zoom: number;
  showGrid: boolean;

  edgeScallop: number;
  edgeRim: number;
  edgeFringe: number;
  edgePebbles: number;

  bankLip: number;
  bankStrata: number;
  bankLobes: number;
  bankRoots: number;
  bankShadow: number;
  bankSides: number;
  bankOutline: boolean;

  turfSwatchVariant: number;
  turfSwatchOpacity: number;
  turfPerLevel: boolean;
  turfLevelSwatch: number[];
  turfBrightness: number;
  turfSaturation: number;
  turfContrast: number;
  turfScale: number;
  turfOctaves: number;
  turfVariation: number;
  bladeDensity: number;
  clumpiness: number;

  flowerDensity: number;
  tuftDensity: number;
  rockDensity: number;
  scatterClumping: number;

  atlasRecolour: boolean;
  atlasTurf: boolean;
  atlasTurfVariant: number;
};

export const defaults: Settings = {
  approach: "procedural",
  palette: 0,
  field: {
    seed: 7,
    width: 44,
    height: 30,
    levels: 3,
    reliefScale: 6,
    plateauBias: 0.72,
    dirtCoverage: 0.32,
    dirtScale: 7,
  },
  rise: 16,
  contourWobble: 0.35,
  contourScale: 5,
  contourSmoothing: 2,
  zoom: 2,
  showGrid: false,

  edgeScallop: 0.05,
  edgeRim: 1,
  edgeFringe: 0.55,
  edgePebbles: 0.04,

  bankLip: 3,
  bankStrata: 0.5,
  bankLobes: 0.8,
  bankRoots: 0.02,
  bankShadow: 4,
  bankSides: 2,
  bankOutline: true,

  turfSwatchVariant: -1,
  turfSwatchOpacity: 0.55,
  turfPerLevel: false,
  // One entry per altitude level; -1 leaves that level as flat tone alone.
  turfLevelSwatch: [-1, 0, 4, 8, 2],
  turfBrightness: 1,
  turfSaturation: 1,
  turfContrast: 1,
  turfScale: 3.2,
  turfOctaves: 3,
  turfVariation: 0.6,
  bladeDensity: 0.06,
  clumpiness: 0.35,

  flowerDensity: 0.02,
  tuftDensity: 0.04,
  rockDensity: 0.01,
  scatterClumping: 0.7,

  atlasRecolour: false,
  atlasTurf: true,
  atlasTurfVariant: 0,
};
