export const ATLAS_SCALE = 2048; // game tiles per geographic degree; a deliberately compressed Earth
export const toAtlas = (lon: number, lat: number) => ({
  x: Math.round(lon * ATLAS_SCALE),
  y: Math.round(-lat * ATLAS_SCALE),
});
export const fromAtlas = (x: number, y: number) => ({
  lon: x / ATLAS_SCALE,
  lat: -y / ATLAS_SCALE,
});
