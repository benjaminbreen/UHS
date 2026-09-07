/** World-anchored ownership for independently cached terrain chunks. */
export type TerrainRegion = { x: number; y: number; prefix: string };

export const TERRAIN_CHUNK_SIZE = 16;
export const TERRAIN_CHUNK_PAD = 8;
