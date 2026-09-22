import type Phaser from "phaser";
import type { Place } from "../core/types";
import { wallSection } from "../core/time/structure";
import { random, stateHash } from "../core/random";

const ownedTextures = new WeakMap<Phaser.Scene, Set<string>>();
export function releaseRuins(scene: Phaser.Scene) {
  for (const key of ownedTextures.get(scene) ?? []) scene.textures.remove(key);
  ownedTextures.delete(scene);
}

export function paintRuin(ctx: CanvasRenderingContext2D, place: Place) {
  const s = place.structure!;
  const W = place.w * 16,
    H = place.h * 16;
  const pad = 32;
  const palette =
    s.fabric === "earth"
      ? ["#a98c63", "#766649", "#c5aa80"]
      : s.fabric === "timber"
        ? ["#796950", "#484b3e", "#a29672"]
        : ["#aba48c", "#646957", "#d0c6a6"];
  ctx.clearRect(0, 0, W + 64, H + 64);
  ctx.fillStyle = "#857c5e38";
  ctx.fillRect(pad + 3, pad + 3, W - 6, H - 6);
  for (let y = 0; y < H; y += 4)
    for (let x = 0; x < W; x += 4) {
      const n = random(place.id, "floor", x, y);
      if (n < 0.24 * (1 - s.burial)) {
        ctx.fillStyle = n < 0.09 ? "#99947b" : "#b2aa8c";
        ctx.fillRect(pad + x, pad + y, 3, 2);
      }
    }
  for (let y = 0; y < place.h; y++)
    for (let x = 0; x < place.w; x++) {
      const section = wallSection({ ...place, x: 0, y: 0 }, x, y);
      if (section === undefined) continue;
      const survival = s.walls[section] * (1 - s.burial);
      for (let j = 0; j < 4; j++) {
        const n = random(place.id, "masonry", x, y, j);
        const px = pad + x * 16 + j * 4,
          py = pad + y * 16 + 8;
        const high = Math.max(
          1,
          Math.round(survival * 28 + (n - 0.5) * 9 * survival),
        );
        ctx.fillStyle = "#333c323c";
        ctx.fillRect(px + 4, py, 5, Math.ceil(high * 0.35));
        ctx.fillStyle = palette[1];
        ctx.fillRect(px + 2, py - high, 4, high + 3);
        ctx.fillStyle = s.char > 0.3 ? "#4e4c41" : palette[0];
        ctx.fillRect(px, py - high, 4, high);
        ctx.fillStyle = palette[2];
        ctx.fillRect(px, py - high, 4, 2);
        if (s.fabric !== "timber")
          for (let row = 4; row < high; row += 5) {
            ctx.fillStyle = palette[1];
            ctx.fillRect(px, py - row, 4, 1);
          }
        if (n > survival) {
          const rx = px + Math.floor((n - 0.5) * 24),
            ry = py + 3 + Math.floor(n * 10);
          ctx.fillStyle = palette[1];
          ctx.fillRect(rx + 1, ry + 2, 6, 3);
          ctx.fillStyle = palette[0];
          ctx.fillRect(rx, ry, s.fabric === "timber" ? 10 : 5, 3);
          ctx.fillStyle = palette[2];
          ctx.fillRect(rx, ry, 4, 1);
        }
      }
    }
  for (let i = 0; i < place.w * place.h * 5; i++) {
    if (random(place.id, "growth", i) > s.vegetation) continue;
    const x = pad + Math.floor(random(place.id, "gx", i) * W),
      y = pad + Math.floor(random(place.id, "gy", i) * H);
    ctx.fillStyle = i % 3 ? "#68744b" : "#8a9060";
    ctx.fillRect(x, y, 2, 3);
    ctx.fillRect(x - 1, y + 1, 4, 1);
  }
}
export function ruinTexture(scene: Phaser.Scene, place: Place) {
  const key = `ruin:${place.id}:${stateHash(place.structure)}`;
  if (!scene.textures.exists(key)) {
    const texture = scene.textures.createCanvas(
      key,
      place.w * 16 + 64,
      place.h * 16 + 64,
    )!;
    paintRuin(texture.context, place);
    texture.refresh();
    texture.setFilter(0);
    let owned = ownedTextures.get(scene);
    if (!owned) ownedTextures.set(scene, owned = new Set());
    owned.add(key);
  }
  return key;
}
