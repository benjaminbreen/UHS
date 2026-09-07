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
) {
  const image = (x: number, y: number, frame: string, depth: number) =>
    scene.add.image(x, y, "topography", frame).setOrigin(0).setDepth(depth);
  const bounded = sample;
  sample = (x, y) => bounded(x, Math.max(0, Math.min(height - 1, y)));
  const priority: GroundSurface[] = [
    "water",
    "damp",
    "grass",
    "dry",
    "soil",
    "gravel",
  ];
  for (let y = -3; y < height + 4; y++)
    for (let x = 0; x < width; x++) {
      const c = sample(x, y)!;
      const phase = (x & 1) | ((y & 1) << 1);
      const top = y * 16 - c.height * TERRAIN_RISE,
        depth = -10000 + y * 16 + 1;
      const variant = Math.floor(random("terrain-study", "surface", x, y) * 4);
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
        `${material === "gravel" && !shoreline ? "grass" : material}-${variant}`,
        depth,
      ).setTint(
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
        random("flora", x, y) < 0.18
      )
        image(x * 16, top, "tuft", depth + 0.3);
      if (c.bridge) {
        scene.add
          .image(x * 16, top, "world-art", "bridge")
          .setOrigin(0)
          .setDepth(depth + 0.5);
        scene.add
          .rectangle(x * 16, top + 16, 16, 3, 0x765337)
          .setOrigin(0)
          .setDepth(depth + 0.6);
        continue;
      }
    }
  drawTerrainContours(scene, sample, width, height);
}
