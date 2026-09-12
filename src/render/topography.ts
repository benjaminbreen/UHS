import type { LivingMask } from "./living-water/mask";
import { usesLivingWater, addLivingWater } from "./living-water/game";
import { own, renderResources } from "./resources";
import { paintedGround } from "./material-edges";
import { rasterHabitatTile, type GroundTileData } from "./habitat-raster";
import { isCanal, rasterWaterTile, type WaterTileData } from "./water-raster";
import {
  addWaterEffects,
  waterCanvas,
  shoreTile,
  type WaterEffect,
} from "./water";
import type { TerrainRegion } from "./terrain-region";
import { drawBridges, type BridgeSpan } from "./bridges";
import { addFlowers, flowersAt, type FlowerSpot } from "./flowers";
import { addCrops, cropsAt, type CropSpot } from "./crops";
import type Phaser from "phaser";
import { drawTerrainContours, wallOwnsCell } from "./terrain-contours";
import { groundStyle } from "./ground-style";
import {
  contourMask,
  type GroundSurface,
  type TopographySample,
} from "../core/topography";
import { random } from "../core/random";
import { TERRAIN_RISE } from "./terrain-projection";
/** Painter order is logical map Y. Tops are lifted; front walls bridge the
 * actual height difference. Low-side actors can pass behind raised terrain. */
export function drawTopography(
  scene: Phaser.Scene,
  sample: TopographySample,
  width: number,
  height: number,
  region?: TerrainRegion,
  bridges?: BridgeSpan[],
  waterTiles?: WaterTileData[],
  groundTiles?: GroundTileData[],
  livingMask?: LivingMask,
) {
  const resources = renderResources();
  // Static ground is composed into small canvas pages, rather than keeping
  // tens of thousands of ground/blend GameObjects in every animation frame.
  const pageSize = region ? 256 : 512;
  const pages = new Map<string, Phaser.Textures.CanvasTexture>();
  const tinted = new Map<string, HTMLCanvasElement>();
  const shoreTiles = new Map<string, HTMLCanvasElement>();
  const effects: WaterEffect[] = [];
  const flowers: FlowerSpot[] = [];
  const standingCrops: CropSpot[] = [];
  let groundScratch: HTMLCanvasElement | undefined;
  const preparedGround = new Map(groundTiles?.map((t) => [`${t.x},${t.y}`, t]));
  let waterScratch: HTMLCanvasElement | undefined;
  const preparedWater = new Map(waterTiles?.map((t) => [`${t.x},${t.y}`, t]));
  const pageFor = (cx: number, cy: number) => {
    const key = `${region?.prefix ?? "contour"}-ground-${cx}-${cy}`;
    let page = pages.get(key);
    if (!page) {
      page = scene.textures.createCanvas(key, pageSize, pageSize)!;
      page.getContext().imageSmoothingEnabled = false;
      pages.set(key, page);
      resources.textures.push(key);
      own(
        resources,
        scene.add
          .image(cx * pageSize, cy * pageSize, key)
          .setOrigin(0)
          .setDepth(-10000),
      );
    }
    return page;
  };
  const fill = (x: number, y: number, w: number, h: number, css: string) => {
    for (
      let cy = Math.floor(y / pageSize);
      cy <= Math.floor((y + h - 1) / pageSize);
      cy++
    )
      for (
        let cx = Math.floor(x / pageSize);
        cx <= Math.floor((x + w - 1) / pageSize);
        cx++
      ) {
        const context = pageFor(cx, cy).getContext();
        context.fillStyle = css;
        context.fillRect(x - cx * pageSize, y - cy * pageSize, w, h);
      }
  };
  /** Average tone of a material tile, for the underlay beneath wall strips. */
  const tones = new Map<string, string>();
  const tone = (frame: string) => {
    let css = tones.get(frame);
    if (css) return css;
    const f = scene.textures.getFrame("topography", frame);
    const one = document.createElement("canvas");
    one.width = one.height = 1;
    const c = one.getContext("2d")!;
    c.imageSmoothingEnabled = true;
    c.drawImage(
      f.source.image as CanvasImageSource,
      f.cutX,
      f.cutY,
      f.cutWidth,
      f.cutHeight,
      0,
      0,
      1,
      1,
    );
    const [r, g, b] = c.getImageData(0, 0, 1, 1).data;
    css = `rgb(${r},${g},${b})`;
    tones.set(frame, css);
    return css;
  };
  const image = (
    x: number,
    y: number,
    frame: string,
    depth: number,
    tint = 0xffffff,
    painted?: HTMLCanvasElement,
  ) => {
    if (frame.startsWith("ramp-")) {
      own(
        resources,
        scene.add
          .image(x, y, "topography", frame)
          .setOrigin(0)
          .setDepth(depth)
          .setTint(tint),
      );
      return;
    }
    const f = scene.textures.getFrame("topography", frame);
    let source = (painted ?? f.source.image) as CanvasImageSource;
    let sx = painted ? 0 : f.cutX,
      sy = painted ? 0 : f.cutY;
    if (tint !== 0xffffff) {
      const key = `${frame}:${tint}`;
      let tile = tinted.get(key);
      if (!tile) {
        tile = document.createElement("canvas");
        tile.width = f.cutWidth;
        tile.height = f.cutHeight;
        const c = tile.getContext("2d")!;
        c.drawImage(
          source,
          sx,
          sy,
          f.cutWidth,
          f.cutHeight,
          0,
          0,
          f.cutWidth,
          f.cutHeight,
        );
        c.globalCompositeOperation = "multiply";
        c.fillStyle = `#${tint.toString(16).padStart(6, "0")}`;
        c.fillRect(0, 0, tile.width, tile.height);
        c.globalCompositeOperation = "destination-in";
        c.drawImage(
          source,
          sx,
          sy,
          f.cutWidth,
          f.cutHeight,
          0,
          0,
          f.cutWidth,
          f.cutHeight,
        );
        tinted.set(key, tile);
      }
      source = tile;
      sx = sy = 0;
    }
    for (
      let cy = Math.floor(y / pageSize);
      cy <= Math.floor((y + f.cutHeight - 1) / pageSize);
      cy++
    )
      for (
        let cx = Math.floor(x / pageSize);
        cx <= Math.floor((x + f.cutWidth - 1) / pageSize);
        cx++
      ) {
        pageFor(cx, cy)
          .getContext()
          .drawImage(
            source,
            sx,
            sy,
            f.cutWidth,
            f.cutHeight,
            x - cx * pageSize,
            y - cy * pageSize,
            f.cutWidth,
            f.cutHeight,
          );
      }
  };
  // One CPU pixel upload for the whole water page, rather than 256 temporary
  // canvases/drawImage calls on ocean chunks. Land is composed over this base.
  const bakedWater = new Set<string>();
  if (region && waterTiles?.length) {
    const key = `${region.prefix}-ground-0-0`;
    const page = scene.textures.createCanvas(key, pageSize, pageSize)!;
    const ctx = page.getContext();
    ctx.imageSmoothingEnabled = false;
    const pixels = ctx.createImageData(pageSize, pageSize);
    for (const tile of waterTiles) {
      if (tile.effect.y !== tile.y * 16) continue;
      for (let row = 0; row < 16; row++)
        pixels.data.set(
          tile.pixels.subarray(row * 64, row * 64 + 64),
          ((tile.y * 16 + row) * pageSize + tile.x * 16) * 4,
        );
      bakedWater.add(`${tile.x},${tile.y}`);
    }
    ctx.putImageData(pixels, 0, 0);
    pages.set(key, page);
    resources.textures.push(key);
    own(resources, scene.add.image(0, 0, key).setOrigin(0).setDepth(-10000));
  }
  const bounded = sample;
  if (!region)
    sample = (x, y) => bounded(x, Math.max(0, Math.min(height - 1, y)));
  const styled = !!groundStyle();
  const priority: GroundSurface[] = [
    "water",
    "damp",
    "grass",
    "dry",
    "soil",
    "gravel",
    "sand",
    "snow",
  ];
  for (let y = region ? 0 : -3; y < height + (region ? 0 : 4); y++)
    for (let x = 0; x < width; x++) {
      const c = sample(x, y)!;
      const worldX = x + (region?.x ?? 0),
        worldY = y + (region?.y ?? 0);
      const top = y * 16 - c.height * TERRAIN_RISE,
        depth = -10000 + y * 16 + 1;
      const variant = Math.floor(
        random("terrain-study", "surface", worldX, worldY) * 4,
      );
      const material =
        c.surface === "water" && c.waterDepth === "shallow"
          ? "shallow"
          : c.surface;
      const shoreline =
        c.surface === "gravel" &&
        (!!c.feature ||
          !!contourMask(sample, x, y, (n) => n.surface === "water"));
      if (c.ramp) {
        // The styled wall pass draws its own slope.
        if (!styled)
          image(x * 16, top - TERRAIN_RISE, `ramp-${c.ramp}`, y * 16 + 1.9);
        continue;
      }
      let painted: HTMLCanvasElement | undefined;
      if (c.surface === "water" || c.bridge) {
        const water =
          preparedWater.get(`${x},${y}`) ??
          rasterWaterTile(sample, x, y, region?.x ?? 0, region?.y ?? 0);
        if (!bakedWater.has(`${x},${y}`))
          painted = waterScratch = waterCanvas(water, waterScratch);
        // A canal is still water with no shore: no motifs or wash sprites.
        if (!isCanal(c)) effects.push(water.effect);
      } else if (
        c.waterVisual &&
        c.feature !== "paving" &&
        c.waterVisual.distance < c.waterVisual.shoreWidth + 1 &&
        ((c.surface === "gravel" && shoreline) || c.surface === "sand")
      ) {
        const key = `${material}-${variant}-${c.waterVisual.ecology}-${c.waterVisual.kind}`;
        painted = shoreTiles.get(key);
        if (!painted) {
          const f = scene.textures.getFrame(
            "topography",
            `${material}-${variant}`,
          );
          painted = shoreTile(
            f.source.image as CanvasImageSource,
            f.cutX,
            f.cutY,
            c,
          );
          shoreTiles.set(key, painted);
        }
      }
      if (paintedGround(c)) {
        const tile =
          preparedGround.get(`${x},${y}`) ??
          rasterHabitatTile(sample, x, y, region?.x ?? 0, region?.y ?? 0);
        groundScratch ??= document.createElement("canvas");
        groundScratch.width = groundScratch.height = 16;
        const ctx = groundScratch.getContext("2d")!;
        const data = ctx.createImageData(16, 16);
        data.data.set(tile.pixels);
        ctx.putImageData(data, 0, 0);
        painted = groundScratch;
        flowers.push(
          ...flowersAt(sample, x, y, region?.x ?? 0, region?.y ?? 0, top),
        );
        standingCrops.push(
          ...cropsAt(sample, x, y, region?.x ?? 0, region?.y ?? 0, top),
        );
        if (c.waterVisual && c.height === 0 && c.waterVisual.distance < 1)
          effects.push(
            rasterWaterTile(sample, x, y, region?.x ?? 0, region?.y ?? 0)
              .effect,
          );
      }
      // Cells beside a height change are drawn by the wall pass instead, at
      // each pixel's own lifted row; blitting the tile here as well would
      // leave the tile-aligned original showing through the new edge.
      const owned = styled && wallOwnsCell(sample, x, y);
      if (!bakedWater.has(`${x},${y}`) && !owned)
        image(
          x * 16,
          c.bridge ? y * 16 : top,
          `${c.bridge ? "water" : material === "gravel" && !shoreline ? "grass" : material}-${variant}`,
          depth,
          !painted && c.surface === "grass"
            ? c.height === 0
              ? 0xd2e2be
              : c.height === 2
                ? 0xe6e6c0
                : 0xffffff
            : 0xffffff,
          painted,
        );
      if (owned) {
        // The wall pass owns these cells, and its row strips are separate
        // images: a sub-pixel seam between two of them would otherwise show
        // the camera background. Flat tone, so no tile edge reads through.
        fill(
          x * 16,
          top,
          16,
          16,
          tone(
            `${material === "gravel" && !shoreline ? "grass" : material}-${variant}`,
          ),
        );
        continue;
      }
      if (c.surface === "gravel" && !shoreline && !paintedGround(c)) {
        const connections =
          contourMask(sample, x, y, (n) => n.surface === "gravel") & 15;
        image(x * 16, top, `channel-${connections}`, depth + 0.15);
      }
      if (c.surface !== "water" && !paintedGround(c)) {
        for (const surface of priority
          .slice(priority.indexOf(c.surface) + 1)
          .filter((s) => s !== "gravel")) {
          const mask = contourMask(
            sample,
            x,
            y,
            (n) =>
              n.surface === surface &&
              n.height === c.height &&
              !n.bridge &&
              !(paintedGround(c) && paintedGround(n)),
          );
          if (mask) image(x * 16, top, `blend-${surface}-${mask}`, depth + 0.1);
        }
      }
      if (
        !c.habitat &&
        (c.surface === "grass" || c.surface === "damp") &&
        variant === 3 &&
        random("flora", worldX, worldY) < 0.18
      )
        image(x * 16, top, "tuft", depth + 0.3);
    }
  for (const page of pages.values()) page.refresh();
  if (usesLivingWater(scene))
    addLivingWater(scene, sample, width, height, region, resources, livingMask);
  const water = usesLivingWater(scene)
    ? undefined
    : addWaterEffects(scene, effects);
  if (water) own(resources, water);
  const blooms = addFlowers(scene, flowers);
  if (blooms) own(resources, blooms);
  addCrops(scene, standingCrops, resources);
  const covers = drawBridges(
    scene,
    sample,
    width,
    height,
    region,
    bridges,
    resources,
  );
  if (!region)
    drawTerrainContours(
      scene,
      sample,
      width,
      height,
      covers,
      resources,
      groundTiles,
    );
  return resources;
}
