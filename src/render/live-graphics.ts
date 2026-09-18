export type TextureSampling = "nearest" | "linear";
export type CanvasSampling = "pixelated" | "auto";
export type ZoomEase = "Linear" | "Sine.easeOut" | "Cubic.easeOut";
export type TreePalette =
  | "native"
  | "oak"
  | "birch"
  | "cedar"
  | "fir"
  | "hazel"
  | "maple"
  | "willow"
  | "apple"
  | "cherry"
  | "sheet-pine"
  | "sheet-broadleaf";
export type LitterPalette = "none" | "woodland" | "grassland" | "mixed";

export type FrameCap = 30 | 60;

export type LiveGraphicsSettings = {
  frameCap: FrameCap;
  roundPixels: boolean;
  textureSampling: TextureSampling;
  canvasSampling: CanvasSampling;
  zoomDuration: number;
  zoomEase: ZoomEase;
  followLerp: number;
  showFps: boolean;
  previewRockDistribution: boolean;
  rockDensity: number;
  rockAltitudeBias: number;
  rockDrynessBias: number;
  rockClustering: number;
  rockClusterScale: number;
  groundDetailDensity: number;
  groundDetailSpacing: number;
  groundDetailClustering: number;
  pathWidth: number;
  pathWobble: number;
  pathEdgeBreakup: number;
  pathFringe: number;
  treePalette: TreePalette;
  treeScale: number;
  litterPalette: LitterPalette;
  litterDensity: number;
};

export const defaultLiveGraphicsSettings: LiveGraphicsSettings = {
  frameCap: 60,
  roundPixels: false,
  textureSampling: "nearest",
  canvasSampling: "pixelated",
  zoomDuration: 130,
  zoomEase: "Sine.easeOut",
  followLerp: 1,
  showFps: true,
  previewRockDistribution: false,
  rockDensity: 2.2,
  rockAltitudeBias: 1.2,
  rockDrynessBias: 1.1,
  rockClustering: 0.65,
  rockClusterScale: 7,
  groundDetailDensity: 1,
  groundDetailSpacing: 1,
  groundDetailClustering: 1,
  pathWidth: 1,
  pathWobble: 1,
  pathEdgeBreakup: 1,
  pathFringe: 1,
  treePalette: "native",
  treeScale: 0.72,
  litterPalette: "none",
  litterDensity: 1.5,
};
