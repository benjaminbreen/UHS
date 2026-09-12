import { useEffect, useRef } from "react";
import type { CharacterAppearance } from "../core/character";
import { drawCharacter } from "../render/characters/draw";

type PortraitSource = {
  source: HTMLCanvasElement;
  x0: number;
  y0: number;
  width: number;
  height: number;
};
const sources = new Map<string, PortraitSource>();
const SOURCE_LIMIT = 128;
function portraitSource(appearance: CharacterAppearance, key: string) {
  const cached = sources.get(key);
  if (cached) {
    sources.delete(key);
    sources.set(key, cached);
    return cached;
  }
  const source = document.createElement("canvas");
  source.width = source.height = 80;
  const ctx = source.getContext("2d", { willReadFrequently: true })!;
  drawCharacter(ctx, appearance, 2, "idle", 0);
  const pixels = ctx.getImageData(0, 0, 80, 80).data;
  let x0 = 80,
    y0 = 80,
    x1 = 0,
    y1 = 0;
  for (let y = 0; y < 80; y++)
    for (let x = 0; x < 80; x++)
      if (pixels[(y * 80 + x) * 4 + 3]) {
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x);
        y1 = Math.max(y1, y);
      }
  const width = x1 - x0 + 1,
    height = y1 - y0 + 1;
  const result = { source, x0, y0, width, height };
  sources.set(key, result);
  if (sources.size > SOURCE_LIMIT) sources.delete(sources.keys().next().value!);
  return result;
}

/** UI and world read the identical appearance recipe; no legacy portrait lookup. */
export function CharacterSprite({
  appearance,
  portrait = false,
  scale = 1,
}: {
  appearance: CharacterAppearance;
  portrait?: boolean;
  /** Multiplies the drawn size only; the raster stays at native pixels. */
  scale?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const rendered = useRef<{ key: string; portrait: boolean } | undefined>(
    undefined,
  );
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const key = JSON.stringify(appearance);
    if (rendered.current?.key === key && rendered.current.portrait === portrait)
      return;
    const { source, x0, y0, width, height } = portraitSource(appearance, key);
    const out = canvas.getContext("2d")!;
    out.clearRect(0, 0, canvas.width, canvas.height);
    out.imageSmoothingEnabled = false;
    if (portrait) {
      // Head and shoulders, enlarged by whole pixels so it stays a raster.
      const bust = Math.max(1, Math.round(height * 0.5));
      const zoom = Math.max(1, Math.floor(Math.min(32 / width, 32 / bust)));
      out.drawImage(
        source,
        x0,
        y0,
        width,
        bust,
        Math.floor((32 - width * zoom) / 2),
        Math.max(0, Math.floor((32 - bust * zoom) / 2)),
        width * zoom,
        bust * zoom,
      );
    } else
      out.drawImage(
        source,
        x0,
        y0,
        width,
        height,
        Math.floor((32 - width) / 2),
        40 - height,
        width,
        height,
      );
    rendered.current = { key, portrait };
  }, [appearance, portrait]);
  return (
    <canvas
      ref={ref}
      width={32}
      height={portrait ? 32 : 40}
      aria-label={portrait ? "Character appearance" : "Person appearance"}
      data-skin={appearance.skin}
      style={{
        width: portrait ? "100%" : 24 * scale,
        height: portrait ? "100%" : 30 * scale,
        imageRendering: "pixelated",
        objectFit: "contain",
        flexShrink: 0,
      }}
    />
  );
}
