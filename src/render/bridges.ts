import { own, renderResources, type RenderResources } from "./resources";
import type { TerrainRegion } from "./terrain-region";
import type Phaser from "phaser";
import type { TopographySample } from "../core/topography";
import { TERRAIN_RISE } from "./terrain-projection";
export type BridgeSpan = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  elevation: number;
};
/** Discover whole spans across chunk boundaries so no artificial end posts appear. */
export function bridgeSpans(
  sample: TopographySample,
  width: number,
  height: number,
  unbounded = false,
): BridgeSpan[] {
  const spans: BridgeSpan[] = [];
  const visited = new Set<string>();
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const key = `${x},${y}`;
      if (visited.has(key) || !sample(x, y)?.bridge) continue;
      const cells: [number, number][] = [[x, y]];
      visited.add(key);
      for (let i = 0; i < cells.length; i++)
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const nx = cells[i][0] + dx,
            ny = cells[i][1] + dy,
            k = `${nx},${ny}`;
          if (
            (unbounded
              ? Math.abs(nx - x) > 128 || Math.abs(ny - y) > 128
              : nx < 0 || ny < 0 || nx >= width || ny >= height) ||
            visited.has(k) ||
            !sample(nx, ny)?.bridge
          )
            continue;
          visited.add(k);
          cells.push([nx, ny]);
        }
      const minX = Math.min(...cells.map((c) => c[0])),
        maxX = Math.max(...cells.map((c) => c[0])),
        minY = Math.min(...cells.map((c) => c[1])),
        maxY = Math.max(...cells.map((c) => c[1]));
      spans.push({ minX, maxX, minY, maxY, elevation: sample(x, y)!.height });
    }
  return spans;
}
/** A bridge is one timber span, not a repeating square ground tile. */
export function drawBridges(
  scene: Phaser.Scene,
  sample: TopographySample,
  width: number,
  height: number,
  region?: TerrainRegion,
  spans = bridgeSpans(sample, width, height, !!region),
  resources: RenderResources = renderResources(),
) {
  const footprints: { x: number; y: number; width: number; height: number }[] =
    [];
  for (const { minX, minY, maxX, maxY, elevation } of spans) {
    if (region && (minX < 0 || minY < 0 || minX >= width || minY >= height))
      continue;
    const horizontal = maxX - minX >= maxY - minY;
    const left = minX * 16 - 3,
      top = minY * 16 - elevation * TERRAIN_RISE,
      w = (maxX - minX + 1) * 16 + 6,
      h = (maxY - minY + 1) * 16;
    footprints.push({ x: left, y: top, width: w, height: h + 6 });
    const deck = scene.add.graphics();
    const rect = (
      x: number,
      y: number,
      w: number,
      h: number,
      color: number,
      alpha = 1,
    ) => {
      deck.fillStyle(color, alpha);
      deck.fillRect(x - left, y - top, w, h);
    };
    // Water remains visible below the suspended span and its front bearer.
    const shadow = own(resources, scene.add.graphics().setDepth(-2000));
    shadow.fillStyle(0x153d50, 0.55);
    shadow.fillRect(left + 3, top + h + 5, w - 2, 10);
    const track = sample(minX, minY)?.track;
    if (track && track.axis === "y") shadow.fillRect(left + w, top + 4, 5, h);
    if (track) railDeck(rect, left, top, w, h, track.axis === "x", track.at);
    else {
      rect(left, top, w, h + 5, 0x533b2c);
      rect(left + 1, top + 1, w - 2, h - 1, 0x8c653f);
      const length = horizontal ? w : h;
      for (let u = 2; u < length - 1; u += 6) {
        const shade = [0xb68b53, 0xa67b47, 0xc29a60, 0xad834d][
          Math.floor(u / 6) % 4
        ];
        if (horizontal) {
          rect(left + u, top + 2, 4, h - 4, shade);
          rect(left + u, top + 2, 1, h - 4, 0xd4ae70);
          rect(
            left + u + 3,
            top + 6 + (u % 11),
            1,
            Math.max(2, h - 18 - (u % 9)),
            0x956c42,
          );
          rect(left + u + 1, top + 5, 1, 1, 0x614b34);
          rect(left + u + 1, top + h - 6, 1, 1, 0x614b34);
        } else {
          rect(left + 2, top + u, w - 4, 4, shade);
          rect(left + 2, top + u, w - 4, 1, 0xd4ae70);
          rect(left + 6, top + u + 3, w - 14, 1, 0x956c42);
        }
      }
      rect(left, top, w, 2, 0xe0b97c);
      rect(left, top + h - 2, w, 3, 0x6b4a32);
      rect(left, top + h + 1, w, 2, 0x9b7145);
      rect(left, top + h + 4, w, 2, 0x44362c);
    }
    // Bake once, then split by logical row so banks cannot cut holes in
    // the deck and walkers retain the same depth order as raised ground.
    const texture = `${region?.prefix ?? "contour"}-bridge-${minX}-${minY}`;
    if (scene.textures.exists(texture)) scene.textures.remove(texture);
    deck.generateTexture(texture, w, h + 6);
    resources.textures.push(texture);
    deck.destroy();
    for (let offset = 0; offset < h; offset += 16)
      own(
        resources,
        scene.add
          .image(left, top, texture)
          .setOrigin(0)
          .setCrop(0, offset, w, offset + 16 >= h ? 22 : 16)
          .setDepth((minY + offset / 16) * 16 + 2),
      );
    // End posts have lit caps, shaded sides and feet below the deck.
    if (!track)
      for (const px of [left + 2, left + w - 7])
        for (const py of [top + 1, top + h - 1]) {
          const post = own(
            resources,
            scene.add.graphics().setDepth(py + elevation * TERRAIN_RISE + 3),
          );
          const box = (
            x: number,
            y: number,
            w: number,
            h: number,
            c: number,
          ) => {
            post.fillStyle(c);
            post.fillRect(x, y, w, h);
          };
          box(px - 1, py - 12, 7, 20, 0x4e392a);
          box(px, py - 11, 5, 18, 0x9a7148);
          box(px, py - 11, 2, 16, 0xbf945b);
          box(px + 4, py - 9, 1, 17, 0x715036);
          box(px - 1, py - 13, 7, 3, 0xdbc087);
          box(px, py - 12, 5, 2, 0xe7c88c);
        }
  }
  return footprints;
}

/** A plate-girder rail deck: sleepers on steel over the water, two tracks at
 * the plain line's offsets, and lattice girders along both sides. */
function railDeck(
  rect: (x: number, y: number, w: number, h: number, c: number) => void,
  left: number,
  top: number,
  w: number,
  h: number,
  alongX: boolean,
  at: number,
) {
  const STEEL = 0x4f5b56,
    LIT = 0x8e9a90,
    DARK = 0x222827,
    TIE = 0x5a4332,
    TIE_LIT = 0x7d6147,
    TIE_DARK = 0x3a2b21,
    RAIL = 0xd4d1c2;
  const length = alongX ? w : h,
    across = alongX ? h : w;
  const put = (u: number, v: number, du: number, dv: number, c: number) =>
    alongX
      ? rect(left + u, top + v, du, dv, c)
      : rect(left + v, top + u, dv, du, c);
  // Tracks sit where the plain line puts them, measured from its first cell.
  const band = -at * 16 + (alongX ? 0 : 3);
  // An open deck: the river shows between the sleepers, over cross girders.
  for (let u = 6; u < length; u += 24) put(u, 4, 3, across - 8, STEEL);
  for (const tc of [18, 46]) {
    const c = band + tc;
    if (c < 4 || c > across - 4) continue;
    put(0, c - 8, length, 2, STEEL);
    put(0, c + 7, length, 2, STEEL);
    for (let u = 1; u < length - 1; u += 5) {
      put(u, c - 10, 3, 21, TIE);
      put(u, c - 10, 1, 21, TIE_LIT);
      put(u + 2, c - 10, 1, 21, TIE_DARK);
    }
    for (const r of [c - 6, c + 6]) {
      put(0, r, length, 1, RAIL);
      put(0, r + 1, length, 1, DARK);
    }
  }
  // Side girders, riveted along the top flange.
  for (const v of [0, across - 4]) {
    put(0, v, length, 4, STEEL);
    put(0, v, length, 1, LIT);
    put(0, v + 3, length, 1, DARK);
    for (let u = 2; u < length; u += 4) put(u, v + 2, 1, 1, LIT);
  }
  if (!alongX) return;
  // The south girder's latticed web shows below the deck.
  rect(left, top + h, w, 6, STEEL);
  rect(left, top + h, w, 1, LIT);
  rect(left, top + h + 5, w, 1, DARK);
  for (let u = 0; u < w; u++) {
    const d = u % 8;
    if (d === 0) rect(left + u, top + h + 1, 1, 4, DARK);
    else {
      rect(left + u, top + h + 1 + (d >> 1), 1, 1, DARK);
      rect(left + u, top + h + 4 - (d >> 1), 1, 1, DARK);
    }
  }
}
