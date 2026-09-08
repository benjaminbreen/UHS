import { paintedGround } from "./material-edges";
import { rasterHabitatTile, type GroundTileData } from "./habitat-raster";
import { rasterWaterTile, type WaterTileData } from "./water-raster";
import type { Pack, WorldModel } from "../core/types";
import { createSettlementWorld } from "../world/v3/generate";
import { rasterTerrainContours, type ContourLayer } from "./terrain-contours";
import { bridgeSpans, type BridgeSpan } from "./bridges";
import { TERRAIN_RISE } from "./terrain-projection";
import {
  TERRAIN_CHUNK_SIZE as SIZE,
  TERRAIN_CHUNK_PAD as PAD,
  type TerrainRegion,
} from "./terrain-region";
import type { TopographyCell } from "../core/topography";
export type TerrainRequest =
  | { pack: Pack; seed: string }
  | { id: string; region: TerrainRegion };
export type TerrainResponse = {
  id: string;
  layers: ContourLayer[];
  cells: TopographyCell[];
  bridges: BridgeSpan[];
  waterTiles: WaterTileData[];
  groundTiles: GroundTileData[];
};
let world: WorldModel;
export function useTerrainWorld(prepared: WorldModel) {
  world = prepared;
}
export function handleTerrainRequest(data: TerrainRequest) {
  try {
    if ("pack" in data) {
      world = createSettlementWorld(data.pack, data.seed);
      return;
    }
    const { id, region } = data;
    const sample = (x: number, y: number) =>
      world.topography!(x + region.x, y + region.y);
    const cells: TopographyCell[] = [];
    for (let y = -PAD; y < SIZE + PAD; y++)
      for (let x = -PAD; x < SIZE + PAD; x++) cells.push(sample(x, y));
    const bridges = bridgeSpans(sample, SIZE, SIZE, true);
    const covers = bridges.map((b) => ({
      x: b.minX * 16 - 3,
      y: b.minY * 16 - b.elevation * TERRAIN_RISE,
      width: (b.maxX - b.minX + 1) * 16 + 6,
      height: (b.maxY - b.minY + 1) * 16 + 6,
    }));
    // Include bridges just outside the chunk whose deck overhang covers its bank.
    for (let y = -1; y <= SIZE; y++)
      for (let x = -1; x <= SIZE; x++) {
        const c = sample(x, y);
        if (c.bridge)
          covers.push({
            x: x * 16 - 3,
            y: y * 16 - c.height * TERRAIN_RISE,
            width: 22,
            height: 22,
          });
      }
    const layers = rasterTerrainContours(sample, SIZE, SIZE, covers, region);
    const waterTiles: WaterTileData[] = [];
    const groundTiles: GroundTileData[] = [];
    const cachedSample = (x: number, y: number) =>
      cells[(y + PAD) * (SIZE + PAD * 2) + x + PAD];
    for (let y = 0; y < SIZE; y++)
      for (let x = 0; x < SIZE; x++) {
        const cell = cachedSample(x, y);
        if (paintedGround(cell))
          groundTiles.push(
            rasterHabitatTile(cachedSample, x, y, region.x, region.y),
          );
        if (cell.surface === "water" || cell.bridge)
          waterTiles.push(
            rasterWaterTile(cachedSample, x, y, region.x, region.y),
          );
      }
    self.postMessage(
      {
        id,
        layers,
        cells,
        bridges,
        waterTiles,
        groundTiles,
      } satisfies TerrainResponse,
      {
        transfer: [
          ...layers.map((l) => l.pixels.buffer),
          ...groundTiles.map((t) => t.pixels.buffer),
          ...waterTiles.map((t) => t.pixels.buffer),
        ],
      },
    );
  } catch (error) {
    self.postMessage({
      id: "id" in data ? data.id : "init",
      error: String(error),
    });
  }
}
