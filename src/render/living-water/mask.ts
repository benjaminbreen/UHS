import type { TerrainReceivers } from "../terrain-contours";
import { waterContactDistance } from "../../core/water-field";
import { coastDistance, coastBeachWidth } from "./coast";
import type { ShorePolish } from "./polish";
import { waterHash } from "../water-style";
import type { WaterObject } from "./scenery";
import type { TopographySample } from "../../core/topography";
import type { TerrainRegion } from "../terrain-region";
import { shoreDistance } from "../material-edges";
import { ecologyOrder, livingBeachWidth, livingProfile } from "./profile";
import { TERRAIN_RISE } from "../terrain-projection";
export type LivingMask = {
  width: number;
  height: number;
  pixels: Uint8ClampedArray;
  count: number;
  items: WaterObject[];
  bends: Uint8ClampedArray;
};
export function rasterLivingWater(
  sample: TopographySample,
  width: number,
  height: number,
  region?: TerrainRegion,
  polish?: ShorePolish,
  existingRocks: readonly { x: number; y: number }[] = [],
  receivers?: TerrainReceivers,
): LivingMask {
  const refined = !!polish?.enabled;
  const W = width * 16,
    H = height * 16 + 96,
    shift = 96;
  const pixels = { data: new Uint8ClampedArray(W * H * 4) };
  let count = 0;
  for (let ty = 0; ty < height; ty++)
    for (let tx = 0; tx < width; tx++) {
      const cell = sample(tx, ty);
      if (
        !cell?.waterVisual ||
        cell.bridge ||
        cell.ramp ||
        cell.waterVisual.kind === "canal" ||
        cell.feature === "paving" ||
        cell.surface === "soil"
      )
        continue;
      const visual = cell.waterVisual,
        profile = livingProfile(cell),
        beach =
          livingBeachWidth(
            sample,
            tx,
            ty,
            region?.x ?? 0,
            region?.y ?? 0,
            polish,
          ) + (refined ? 0.5 * polish!.blend : 0);
      if (
        visual.distance >
          beach * 1.5 +
            1 +
            (visual.kind === "sea" ? (polish?.coastScallop ?? 1.4) : 0) ||
        (!receivers && cell.height > 0 && cell.surface !== "water")
      )
        continue;
      const row =
        ecologyOrder.indexOf(visual.ecology) +
        (profile.kind === "coast"
          ? 8
          : profile.kind === "lake"
            ? 16
            : profile.kind === "pond"
              ? 24
              : 0) +
        (visual.frozenMargin ? 32 : 0) +
        (cell.habitat?.colorway === "red-earth" ? 64 : 0);
      const angle =
        profile.kind === "coast"
          ? Math.atan2(
              (sample(tx, ty + 1)?.waterVisual?.distance ?? visual.distance) -
                (sample(tx, ty - 1)?.waterVisual?.distance ?? visual.distance),
              (sample(tx + 1, ty)?.waterVisual?.distance ?? visual.distance) -
                (sample(tx - 1, ty)?.waterVisual?.distance ?? visual.distance),
            )
          : (profile.direction * Math.PI) / 180;
      for (let py = 0; py < 16; py++)
        for (let px = 0; px < 16; px++) {
          const d = waterContactDistance(
            sample,
            tx + (px + 0.5) / 16,
            ty + (py + 0.5) / 16,
            region?.x ?? 0,
            region?.y ?? 0,
            polish,
          );
          const localBeach =
            visual.kind === "sea"
              ? coastBeachWidth(
                  beach,
                  (region?.x ?? 0) + tx + (px + 0.5) / 16,
                  (region?.y ?? 0) + ty + (py + 0.5) / 16,
                  polish,
                )
              : beach;
          const sx = tx * 16 + px, sy = ty * 16 + py;
          const receiver = receivers && receivers.tiers[
            (sy - receivers.y) * receivers.width + sx - receivers.x];
          const lowGround = receivers ? receiver === 0 ||
            (receiver === -1 && cell.surface === "water" && cell.height === 0) : cell.height === 0;
          if (d > localBeach || !lowGround) continue;
          const y = sy + shift;
          if (y < 0 || y >= H) continue;
          const i = (y * W + tx * 16 + px) * 4;
          const sea = visual.kind === "sea";
          const level = sea && -d > 4 ? 64 + (-d - 4) * 4 : -d * 16;
          pixels.data[i] =
            d < 0
              ? Math.min(
                  255,
                  128 + (sea ? Math.floor(level) : Math.round(level)),
                )
              : Math.max(
                  1,
                  127 - Math.round((d / Math.max(0.01, localBeach)) * 126),
                );
          pixels.data[i + 1] = row + 1;
          // Sea pixels ignore flow angle, so blue carries the depth fraction
          // below one byte step; without it wave crests snap between contours.
          pixels.data[i + 2] =
            sea && d < 0
              ? Math.floor((level - Math.floor(level)) * 255)
              : Math.round(((angle / (Math.PI * 2) + 1) % 1) * 255);
          pixels.data[i + 3] = 255;
          count++;
        }
    }
  const items: WaterObject[] = [];
  const ox = (region?.x ?? 0) * 16,
    oy = (region?.y ?? 0) * 16;
  const spacing = refined ? 24 : 64;
  for (
    let gy = Math.floor((oy - 48) / spacing);
    gy <= Math.floor((oy + height * 16 + 48) / spacing);
    gy++
  )
    for (
      let gx = Math.floor((ox - 48) / spacing);
      gx <= Math.floor((ox + W + 48) / spacing);
      gx++
    ) {
      const seed = Math.floor(waterHash(gx, gy, 351) * 100000);
      const x =
          gx * spacing +
          (refined ? 5 : 16) +
          waterHash(gx, gy, 352) * (refined ? spacing - 10 : 32) -
          ox,
        y =
          gy * spacing +
          (refined ? 5 : 16) +
          waterHash(gx, gy, 353) * (refined ? spacing - 10 : 32) -
          oy;
      const cell = sample(Math.floor(x / 16), Math.floor(y / 16));
      if (
        !cell?.waterVisual ||
        cell.bridge ||
        cell.ramp ||
        (!refined && cell.surface !== "water") ||
        (refined &&
          (cell.height > 0 ||
            cell.feature === "paving" ||
            cell.surface === "soil")) ||
        cell.waterVisual.kind === "canal"
      )
        continue;
      let depth = -shoreDistance(sample, x / 16, y / 16, ox / 16, oy / 16);
      if (cell.waterVisual.kind === "sea")
        depth = -coastDistance(-depth, (x + ox) / 16, (y + oy) / 16, polish);
      const beach = livingBeachWidth(
        sample,
        Math.floor(x / 16),
        Math.floor(y / 16),
        ox / 16,
        oy / 16,
        polish,
      );
      if (
        depth < (refined ? -beach * 0.94 : 0.65) ||
        depth > (refined ? 2.5 : 4.5)
      )
        continue;
      const profile = livingProfile(cell),
        rock = waterHash(gx, gy, 354) < (refined ? 0.35 * polish!.rocks : 0.35);
      if (
        refined &&
        !rock &&
        (profile.bankClimate === "tundra" ||
          waterHash(gx, gy, 357) >
            polish!.plants *
              (profile.bankClimate === "tropical-woodland" ? 1 : 0.65))
      )
        continue;
      if (
        !refined &&
        !rock &&
        (profile.plants === 0 || profile.bankClimate === "desert")
      )
        continue;
      if (refined && !rock && depth > 0.2 && waterHash(gx, gy, 359) > 0.22)
        continue;
      items.push({
        x: Math.round(x),
        y: Math.round(y - cell.height * TERRAIN_RISE + shift),
        size: rock
          ? (refined ? 6 : 4) + waterHash(gx, gy, 355) * (refined ? 4 : 3)
          : 4,
        seed,
        ecology: profile.bankClimate,
        season: cell.habitat?.season,
        kind: rock
          ? "rock"
          : refined && depth < 0.2
            ? "herb"
            : profile.kind === "coast"
              ? "seaweed"
              : waterHash(gx, gy, 356) < 0.5
                ? "reeds"
                : "lilies",
      });
      if (refined && depth < 0 && !rock) {
        const o = items.at(-1)!;
        items.push({ ...o, x: o.x + 5, y: o.y + 2, seed: seed + 11 });
      }
      if (refined && rock) {
        const o = items.at(-1)!;
        items.push({
          ...o,
          x: o.x + Math.round(o.size) + 3,
          y: o.y + 3,
          size: 2,
          seed: seed + 7,
        });
      }
    }
  if (refined)
    for (const rock of existingRocks) {
      const cell = sample(rock.x, rock.y);
      if (
        cell?.waterVisual &&
        cell.height === 0 &&
        cell.waterVisual.distance < 2
      )
        items.push({
          x: rock.x * 16 + 8,
          y: rock.y * 16 + 12 + shift,
          size: 9,
          seed: 0,
          kind: "rock",
          existing: true,
        });
    }
  const bd = { data: new Uint8ClampedArray(W * H * 4) };
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (!pixels.data[i + 1]) continue;
      const angle = (pixels.data[i + 2] / 255) * Math.PI * 2,
        dx = Math.cos(angle),
        dy = Math.sin(angle);
      let u = 0,
        v = 0,
        delay = 0,
        solid = 0;
      for (const o of items) {
        if (o.kind !== "rock") continue;
        const a = x - o.x,
          b = (y - o.y) * 1.3,
          r = o.size;
        if (Math.abs(a) > r * 5 || Math.abs(b) > r * 5) continue;
        const fall = Math.exp(-(a * a + b * b) / (r * r * 5)),
          side = -a * dy + b * dx < 0 ? -1 : 1;
        u += -dy * side * r * fall * 1.8;
        v += dx * side * r * fall * 1.8;
        delay += r * fall * 1.4;
        if ((a * a) / (r * r) + (b * b) / (r * r * 0.65) < 1) solid = 1;
      }
      bd.data[i] = Math.round(128 + u * 4);
      bd.data[i + 1] = Math.round(128 + v * 4);
      bd.data[i + 2] = Math.round(Math.min(127, delay * 8)) + solid * 128;
      bd.data[i + 3] = 255;
    }
  return {
    width: W,
    height: H,
    pixels: pixels.data,
    count,
    items,
    bends: bd.data,
  };
}
