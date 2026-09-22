import Phaser from "phaser";

const cache = new Map<string, number[] | null>();
let canvas: HTMLCanvasElement | undefined;

/**
 * The few colours a sprite frame reads as, for debris that matches what was
 * struck. Pixels are binned coarsely and scored by count and saturation, so
 * red petals on a green plant win over the larger mass of leaf, and dark
 * outline pixels never win. Cached per frame.
 */
export function spritePalette(
  scene: Phaser.Scene,
  texture: string,
  frame: string | number,
): number[] | undefined {
  const key = `${texture}|${frame}`;
  const known = cache.get(key);
  if (known !== undefined) return known ?? undefined;
  let result: number[] | null = null;
  try {
    const f = scene.textures.getFrame(texture, frame);
    const source = f?.source.image as CanvasImageSource | undefined;
    if (f && source && f.cutWidth && f.cutHeight) {
      canvas ??= document.createElement("canvas");
      canvas.width = f.cutWidth;
      canvas.height = f.cutHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      ctx.clearRect(0, 0, f.cutWidth, f.cutHeight);
      ctx.drawImage(
        source,
        f.cutX,
        f.cutY,
        f.cutWidth,
        f.cutHeight,
        0,
        0,
        f.cutWidth,
        f.cutHeight,
      );
      result = rank(ctx.getImageData(0, 0, f.cutWidth, f.cutHeight).data);
    }
  } catch {
    // A tainted or missing source: fall back to the class palette.
  }
  cache.set(key, result);
  return result ?? undefined;
}

function rank(data: Uint8ClampedArray): number[] | null {
  const bins = new Map<
    number,
    { n: number; r: number; g: number; b: number }
  >();
  let total = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 200) continue;
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    const max = Math.max(r, g, b);
    // Outlines and baked shadow.
    if (max < 45) continue;
    const bin = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5);
    const e = bins.get(bin) ?? { n: 0, r: 0, g: 0, b: 0 };
    e.n++;
    e.r += r;
    e.g += g;
    e.b += b;
    bins.set(bin, e);
    total++;
  }
  if (total < 4) return null;
  const scored = [...bins.values()]
    // A stray pixel or two is not what the thing is made of.
    .filter((e) => e.n >= Math.max(2, total * 0.02))
    .map((e) => {
      const r = e.r / e.n,
        g = e.g / e.n,
        b = e.b / e.n;
      const max = Math.max(r, g, b),
        min = Math.min(r, g, b);
      const sat = max ? (max - min) / max : 0;
      return {
        color: (r << 16) | (g << 8) | b,
        score: e.n * (0.35 + sat * 1.6),
      };
    })
    .sort((a, b) => b.score - a.score);
  if (!scored.length) return null;
  return scored.slice(0, 4).map((s) => s.color);
}
