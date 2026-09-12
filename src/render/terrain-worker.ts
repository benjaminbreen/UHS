import { coastDistance, coastBeachWidth } from "./living-water/coast";
import type { ShorePolish } from "./living-water/polish";
import { livingBeachWidth } from "./living-water/profile";
import { rasterLivingWater, type LivingMask } from "./living-water/mask";
import { setGroundStyle, type GroundStyle } from "./ground-style";
import { paintedGround } from "./material-edges";
import { rasterHabitatTile, type GroundTileData } from "./habitat-raster";
import { rasterWaterTile, type WaterTileData } from "./water-raster";
import type { Pack, WorldModel } from "../core/types";
import { createSettlementWorld } from "../world/v3/generate";
import type { PreparedSettlement } from "../world/v3/prepared";
import {
  rasterTerrainContours,
  type ContourLayer,
  type TerrainReceivers,
} from "./terrain-contours";
import { bridgeSpans, type BridgeSpan } from "./bridges";
import { TERRAIN_RISE } from "./terrain-projection";
import {
  TERRAIN_CHUNK_SIZE as SIZE,
  TERRAIN_CHUNK_PAD as PAD,
  type TerrainRegion,
} from "./terrain-region";
import type { TopographyCell } from "../core/topography";
export type TerrainRequest =
  | { pack: Pack; seed: string; prepared?: PreparedSettlement }
  | { style: GroundStyle | null; living?: boolean; polish?: ShorePolish }
  | { id: string; region: TerrainRegion };
export type TerrainResponse = {
  id: string;
  layers: ContourLayer[];
  cells: TopographyCell[];
  bridges: BridgeSpan[];
  waterTiles: WaterTileData[];
  groundTiles: GroundTileData[];
  /** Flat [x, y, drop, lowerTier, side] per rim pixel, chunk screen space. */
  rims: Int16Array;
  receivers?: TerrainReceivers;
  living?: LivingMask;
};
let world: WorldModel;
let livingEnabled = false;
let polish: ShorePolish | undefined;
export function useTerrainWorld(prepared: WorldModel) {
  world = prepared;
}
export function handleTerrainRequest(data: TerrainRequest) {
  try {
    if ("style" in data) {
      setGroundStyle(data.style ?? undefined);
      if ("polish" in data) polish = data.polish;
      if (data.living !== undefined) livingEnabled = data.living;
      return;
    }
    if ("pack" in data) {
      // Prepared geometry turns a four-second build into a one-millisecond
      // one, which is what makes a second rasterising worker affordable.
      world = createSettlementWorld(data.pack, data.seed, data.prepared);
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
    const waterTiles: WaterTileData[] = [];
    const groundTiles: GroundTileData[] = [];
    const cachedSample = (x: number, y: number) =>
      cells[(y + PAD) * (SIZE + PAD * 2) + x + PAD];
    const paintCells = new Map<string, TopographyCell>();
    const paintSample = (x: number, y: number) => {
      const c = sample(x, y);
      if (!livingEnabled || !c.waterVisual) return c;
      const key = `${x},${y}`;
      let painted = paintCells.get(key);
      if (!painted) {
        painted = {
          ...c,
          waterVisual: {
            ...c.waterVisual,
            distance:
              c.waterVisual.kind === "sea"
                ? coastDistance(
                    c.waterVisual.distance,
                    x + region.x,
                    y + region.y,
                    polish,
                  )
                : c.waterVisual.distance,
            shoreWidth:
              c.waterVisual.kind === "sea"
                ? coastBeachWidth(
                    livingBeachWidth(sample, x, y, region.x, region.y, polish),
                    x + region.x,
                    y + region.y,
                    polish,
                  )
                : livingBeachWidth(sample, x, y, region.x, region.y, polish),
          },
        };
        paintCells.set(key, painted);
      }
      return painted;
    };
    for (let y = 0; y < SIZE; y++)
      for (let x = 0; x < SIZE; x++) {
        const cell = cachedSample(x, y);
        if (paintedGround(cell))
          groundTiles.push(
            rasterHabitatTile(paintSample, x, y, region.x, region.y),
          );
        if (cell.surface === "water" || cell.bridge)
          waterTiles.push(
            rasterWaterTile(cachedSample, x, y, region.x, region.y),
          );
      }
    const rimList: number[] = [];
    const receiverData: Partial<TerrainReceivers> = {};
    const layers = rasterTerrainContours(
      paintSample,
      SIZE,
      SIZE,
      covers,
      region,
      groundTiles,
      rimList,
      receiverData,
    );
    const rims = Int16Array.from(rimList);
    const receivers = receiverData.tiers
      ? (receiverData as TerrainReceivers)
      : undefined;
    const rockPositions: { x: number; y: number }[] = [];
    if (polish?.enabled)
      for (let y = -3; y < SIZE + 3; y++)
        for (let x = -3; x < SIZE + 3; x++) {
          const c = cachedSample(x, y);
          if (
            c?.waterVisual &&
            c.waterVisual.distance < 2 &&
            world.decoration(x + region.x, y + region.y)?.sprite === "rock"
          )
            rockPositions.push({ x, y });
        }
    const living = livingEnabled
      ? rasterLivingWater(
          cachedSample,
          SIZE,
          SIZE,
          region,
          polish,
          rockPositions,
          receivers,
        )
      : undefined;
    if (living && receivers) {
      for (const layer of layers) {
        if (!layer.flat) continue;
        for (let y = 0; y < layer.height; y++)
          for (let x = 0; x < layer.width; x++) {
            const sx = layer.x + x,
              sy = layer.y + y;
            if (
              sx < 0 ||
              sx >= living.width ||
              sy + 96 < 0 ||
              sy + 96 >= living.height
            )
              continue;
            const i = (sy - receivers.y) * receivers.width + sx - receivers.x;
            if (receivers.tiers[i] !== 0 || receivers.rows[i] !== layer.row)
              continue;
            if (living.pixels[((sy + 96) * living.width + sx) * 4 + 3])
              layer.pixels[(y * layer.width + x) * 4 + 3] = 0;
          }
      }
    }
    self.postMessage(
      {
        id,
        layers,
        cells,
        bridges,
        waterTiles,
        groundTiles,
        rims,
        receivers,
        living,
      } satisfies TerrainResponse,
      {
        transfer: [
          rims.buffer,
          ...(receivers ? [receivers.tiers.buffer, receivers.rows.buffer] : []),
          ...(living ? [living.pixels.buffer, living.bends.buffer] : []),
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
