import { useEffect, useRef } from "react";
import type { CharacterAppearance } from "../core/character";
import { drawCharacter } from "../render/characters/draw";

/** UI and world read the identical appearance recipe; no legacy portrait lookup. */
export function CharacterSprite({
  appearance,
  portrait = false,
}: {
  appearance: CharacterAppearance;
  portrait?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const source = document.createElement("canvas");
    source.width = source.height = 80;
    const ctx = source.getContext("2d")!;
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
    const out = canvas.getContext("2d")!;
    out.clearRect(0, 0, canvas.width, canvas.height);
    out.imageSmoothingEnabled = false;
    if (portrait) {
      // Native-pixel bust crop; detailed portrait illustration is a later art task.
      out.drawImage(
        source,
        x0,
        y0,
        width,
        Math.min(height, 24),
        Math.floor((32 - width) / 2),
        3,
        width,
        Math.min(height, 24),
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
  }, [appearance, portrait]);
  return (
    <canvas
      ref={ref}
      width={32}
      height={portrait ? 32 : 40}
      aria-label={portrait ? "Character appearance" : "Person appearance"}
      data-skin={appearance.skin}
      style={{
        width: portrait ? "100%" : 24,
        height: portrait ? "100%" : 30,
        imageRendering: "pixelated",
        objectFit: "contain",
        flexShrink: 0,
      }}
    />
  );
}
