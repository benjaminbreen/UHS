import type { TerrainRegion } from "./terrain-region";
import { drawBridges, type BridgeSpan } from "./bridges";
import type Phaser from "phaser";
import { drawTerrainContours } from "./terrain-contours";
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
) {
  // Static ground is composed into small canvas pages, rather than keeping
  // tens of thousands of ground/blend GameObjects in every animation frame.
  const pageSize = region ? 256 : 512;
  const pages = new Map<string, Phaser.Textures.CanvasTexture>();
  const tinted = new Map<string, HTMLCanvasElement>();
  const image = (
    x: number,
    y: number,
    frame: string,
    depth: number,
    tint = 0xffffff,
  ) => {
    if (frame.startsWith("ramp-")) {
      scene.add
        .image(x, y, "topography", frame)
        .setOrigin(0)
        .setDepth(depth)
        .setTint(tint);
      return;
    }
    const f = scene.textures.getFrame("topography", frame);
    let source = f.source.image as CanvasImageSource;
    let sx = f.cutX,
      sy = f.cutY;
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
        const key = `${region?.prefix ?? "contour"}-ground-${cx}-${cy}`;
        let page = pages.get(key);
        if (!page) {
          page = scene.textures.createCanvas(key, pageSize, pageSize)!;
          page.getContext().imageSmoothingEnabled = false;
          pages.set(key, page);
          scene.add
            .image(cx * pageSize, cy * pageSize, key)
            .setOrigin(0)
            .setDepth(-10000);
        }
        page
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
  const bounded = sample;
  if (!region)
    sample = (x, y) => bounded(x, Math.max(0, Math.min(height - 1, y)));
  const priority: GroundSurface[] = [
    "water",
    "damp",
    "grass",
    "dry",
    "soil",
    "gravel",
  ];
  for (let y = region ? 0 : -3; y < height + (region ? 0 : 4); y++)
    for (let x = 0; x < width; x++) {
      const c = sample(x, y)!;
      const worldX = x + (region?.x ?? 0),
        worldY = y + (region?.y ?? 0);
      const phase = (worldX & 1) | ((worldY & 1) << 1);
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
        !!contourMask(sample, x, y, (n) => n.surface === "water");
      if (c.ramp) {
        image(x * 16, top - TERRAIN_RISE, `ramp-${c.ramp}`, y * 16 + 1.9);
        continue;
      }
      image(
        x * 16,
        c.bridge ? y * 16 : top,
        `${c.bridge ? "water" : material === "gravel" && !shoreline ? "grass" : material}-${variant}`,
        depth,
        c.surface === "grass"
          ? c.height === 0
            ? 0xd2e2be
            : c.height === 2
              ? 0xe6e6c0
              : 0xffffff
          : 0xffffff,
      );
      if (c.surface === "gravel" && !shoreline) {
        const connections =
          contourMask(sample, x, y, (n) => n.surface === "gravel") & 15;
        image(x * 16, top, `channel-${connections}`, depth + 0.15);
      }
      if (c.surface !== "water") {
        for (const surface of priority
          .slice(priority.indexOf(c.surface) + 1)
          .filter((s) => s !== "gravel")) {
          const mask = contourMask(
            sample,
            x,
            y,
            (n) => n.surface === surface && n.height === c.height && !n.bridge,
          );
          if (mask) image(x * 16, top, `blend-${surface}-${mask}`, depth + 0.1);
        }
      } else if (!c.bridge) {
        if (c.waterDepth !== "shallow") {
          const mask = contourMask(
            sample,
            x,
            y,
            (n) => n.surface === "water" && n.waterDepth === "shallow",
          );
          if (mask) image(x * 16, top, `blend-shallow-${mask}`, depth + 0.1);
        }
        const banks = contourMask(
          sample,
          x,
          y,
          (n) => n.surface !== "water" && !n.bridge,
        );
        if (banks) image(x * 16, top, `bank-${banks}-${phase}`, depth + 0.2);
      }
      if (
        (c.surface === "grass" || c.surface === "damp") &&
        variant === 3 &&
        random("flora", worldX, worldY) < 0.18
      )
        image(x * 16, top, "tuft", depth + 0.3);
    }
  for (const page of pages.values()) page.refresh();
  const covers = drawBridges(scene, sample, width, height, region, bridges);
  if (!region) drawTerrainContours(scene, sample, width, height, covers);
}
