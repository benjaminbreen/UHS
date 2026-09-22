import { temporalWorld } from "../core/time/world";
import { packForSetting } from "../content/geography/pack";
import { coastDistance, coastBeachWidth } from "./living-water/coast";
import type { ShorePolish } from "./living-water/polish";
import { livingBeachWidth } from "./living-water/profile";
import { rasterLivingWater, type LivingMask } from "./living-water/mask";
import { groundStyle, setGroundStyle, type GroundStyle } from "./ground-style";
import { batchGroundPage, type GroundPage } from "./ground-pages";
import { paintedGround } from "./material-edges";
import { rasterHabitatTile, type GroundTileData } from "./habitat-raster";
import { isCanal, rasterWaterTile, type WaterTileData } from "./water-raster";
import { waterDistance } from "./water-style";
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
import { previewChunk, type TerrainPreview } from "./terrain-preview";
export type TerrainRequest =
  | { pack: Pack; seed: string; prepared?: PreparedSettlement; temporal?: WorldModel["temporal"] }
  | { style: GroundStyle | null; living?: boolean; polish?: ShorePolish }
  | { id: string; region: TerrainRegion }
  | { previews: { id: string; region: TerrainRegion }[] };
/** Sent ahead of the full response for the same id. */
export type TerrainPreviewResponse = { id: string; preview: TerrainPreview };
export type TerrainResponse = {
  id: string;
  layers: ContourLayer[];
  cells: TopographyCell[];
  bridges: BridgeSpan[];
  waterTiles: WaterTileData[];
  groundTiles: GroundTileData[];
  groundPage?: GroundPage;
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
      world = createSettlementWorld(data.temporal ? packForSetting(data.temporal.origin) : data.pack, data.seed, data.prepared);
      if (data.temporal) world = temporalWorld(world, data.seed, data.temporal.origin, data.temporal.year).world;
      return;
    }
    if ("previews" in data) {
      // Colours only, so this samples the chunk itself and not its pad: a
      // sweep of the whole view costs less than rastering one chunk.
      for (const { id, region } of data.previews) {
        const preview = previewChunk((x, y) =>
          world.topography!(x + region.x, y + region.y),
        );
        self.postMessage(
          { id, preview } satisfies TerrainPreviewResponse,
          { transfer: [preview.pixels.buffer] },
        );
      }
      self.postMessage({ previewsDone: true });
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
      // A creek keeps its own narrow shore: the living beach width is for
      // rivers and coasts and would give it the river's sand ramp.
      if (c.waterVisual.shoreWidth < 1.2) return c;
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
            // Turf runs under the water layer's ragged outer beach, which
            // cuts away to show it.
            shoreWidth:
              (polish?.enabled ? 0.56 : 1) *
              (c.waterVisual.kind === "sea"
                ? coastBeachWidth(
                    livingBeachWidth(sample, x, y, region.x, region.y, polish),
                    x + region.x,
                    y + region.y,
                    polish,
                  )
                : livingBeachWidth(sample, x, y, region.x, region.y, polish)),
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
        if (cell.surface === "water" || cell.bridge || cell.dryChannel) {
          const tile = rasterWaterTile(cachedSample, x, y, region.x, region.y);
          // A creek's cell is mostly turf: the water tile keeps only its
          // water pixels and the rest is the ground raster, so the old
          // sand-and-gravel ramp never appears round a small stream. A canal
          // is dug, not found: its tile draws its own banks, and blending it
          // against the shore distance erased the channel altogether.
          if (
            !cell.bridge &&
            !isCanal(cell) &&
            cell.waterVisual &&
            cell.waterVisual.shoreWidth < 1.2 &&
            cell.habitat
          ) {
            const ground = rasterHabitatTile(
              paintSample,
              x,
              y,
              region.x,
              region.y,
              undefined,
              { ...cell, surface: "grass", waterVisual: undefined, waterDepth: undefined },
            );
            for (let py = 0; py < 16; py++)
              for (let px = 0; px < 16; px++) {
                const d = waterDistance(
                  cachedSample,
                  x + (px + 0.5) / 16,
                  y + (py + 0.5) / 16,
                );
                if (d >= 0)
                  tile.pixels.set(
                    ground.pixels.subarray((py * 16 + px) * 4, (py * 16 + px) * 4 + 4),
                    (py * 16 + px) * 4,
                  );
              }
          }
          waterTiles.push(tile);
        }
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
      waterTiles,
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
            // Clear the plateau's own painted water too, so terrace creeks
            // show the living water beneath rather than the flat tile.
            const tier = receivers.tiers[i];
            if (tier === -2 || receivers.rows[i] !== layer.row) continue;
            if (living.pixels[((sy + 96) * living.width + sx) * 4 + 3])
              layer.pixels[(y * layer.width + x) * 4 + 3] = 0;
          }
      }
    }
    const groundPage = batchGroundPage(
      cachedSample,
      SIZE,
      SIZE,
      groundTiles,
      !!groundStyle(),
    );
    const remainingGround = groundPage
      ? groundTiles.filter((tile) => !groundPage.tiles[tile.y * SIZE + tile.x])
      : groundTiles;
    self.postMessage(
      {
        id,
        layers,
        cells,
        bridges,
        waterTiles,
        groundTiles: remainingGround,
        groundPage,
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
          ...remainingGround.map((t) => t.pixels.buffer),
          ...(groundPage
            ? [groundPage.pixels.buffer, groundPage.tiles.buffer]
            : []),
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
