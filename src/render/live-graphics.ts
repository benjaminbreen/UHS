export type TextureSampling = "nearest" | "linear";
export type CanvasSampling = "pixelated" | "auto";
export type ZoomEase = "Linear" | "Sine.easeOut" | "Cubic.easeOut";

export type LiveGraphicsSettings = {
  roundPixels: boolean;
  textureSampling: TextureSampling;
  canvasSampling: CanvasSampling;
  zoomDuration: number;
  zoomEase: ZoomEase;
  followLerp: number;
  showFps: boolean;
};

export const defaultLiveGraphicsSettings: LiveGraphicsSettings = {
  roundPixels: false,
  textureSampling: "nearest",
  canvasSampling: "pixelated",
  zoomDuration: 130,
  zoomEase: "Sine.easeOut",
  followLerp: 1,
  showFps: true,
};
