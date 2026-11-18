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
  occlusion: boolean;
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
  groundMottle: number;
  pathWidth: number;
  pathWobble: number;
  pathEdgeBreakup: number;
  pathFringe: number;
  treePalette: TreePalette;
  treeScale: number;
  litterPalette: LitterPalette;
  litterDensity: number;
  tiltShift: boolean;
  /** Follow the player's height on screen; off pins the band at tiltFocus. */
  tiltFollow: boolean;
  /** 0 is the top of the view, 1 the bottom. */
  tiltFocus: number;
  tiltBand: number;
  tiltFalloff: number;
  /** Canvas pixels at full blur. */
  tiltBlur: number;
  tiltTopBias: number;
  tiltSaturation: number;
  tiltContrast: number;
  tiltVignette: number;
};

export const defaultLiveGraphicsSettings: LiveGraphicsSettings = {
  frameCap: 60,
  roundPixels: true,
  occlusion: false,
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
  groundDetailDensity: 0.65,
  groundDetailSpacing: 1.2,
  groundDetailClustering: 1.45,
  groundMottle: 0.5,
  pathWidth: 1,
  pathWobble: 1,
  pathEdgeBreakup: 1,
  pathFringe: 1,
  treePalette: "native",
  treeScale: 0.72,
  litterPalette: "none",
  litterDensity: 1.5,
  tiltShift: true,
  tiltFollow: true,
  tiltFocus: 0.5,
  tiltBand: 0.60,
  tiltFalloff: 0.22,
  tiltBlur: 1.75,
  tiltTopBias: 0.65,
  tiltSaturation: 1,
  tiltContrast: 1,
  tiltVignette: 0.035,
};

export const DISPLAY_SETTINGS_KEY = "uhs-display-settings";

export function storedDisplaySettings() {
  const settings = {
    occlusion: defaultLiveGraphicsSettings.occlusion,
    tiltShift: defaultLiveGraphicsSettings.tiltShift,
    roundPixels: defaultLiveGraphicsSettings.roundPixels,
  };
  try {
    const stored = JSON.parse(localStorage.getItem(DISPLAY_SETTINGS_KEY) ?? "null");
    for (const key of ["occlusion", "tiltShift", "roundPixels"] as const)
      if (typeof stored?.[key] === "boolean") settings[key] = stored[key];
  } catch {}
  return settings;
}
