import { useEffect, useRef } from "react";
import nature from "../../public/nature/atlas.json" with { type: "json" };
import fauna from "../../public/fauna/atlas.json" with { type: "json" };
import faunaB from "../../public/fauna-b/atlas.json" with { type: "json" };
import faunaC from "../../public/fauna-c/atlas.json" with { type: "json" };
import ecology from "../../public/ecology/atlas.json" with { type: "json" };
import props from "../render/generated/props.json" with { type: "json" };
import atlas from "../render/generated/atlas.json" with { type: "json" };
import buildings from "../render/generated/buildings.json" with { type: "json" };
import civic from "../render/generated/civic.json" with { type: "json" };
import { parseCloth } from "../content/characters/wardrobe/cloth";
import {
  drawGarmentIcon,
  garmentIconFor,
  itemIconFor,
  GARMENT_ICON,
} from "../render/garment-icons";

export function Sprite({ name, scale = 2 }: { name: string; scale?: number }) {
  const source = name.startsWith("fauna-")
    ? fauna
    : name.startsWith("faunab-")
      ? faunaB
    : name.startsWith("faunac-")
      ? faunaC
    : name.startsWith("nature-")
      ? nature
    : name.startsWith("ecology-")
      ? ecology
      : name.startsWith("study-prop") || name.startsWith("prop-broken-")
        ? props
        : name in buildings.frames
          ? buildings
          : name in civic.frames
            ? civic
            : atlas;
  const f = (
    source.frames as Record<
      string,
      { frame: { x: number; y: number; w: number; h: number } }
    >
  )[name]?.frame;
  if (!f) return null;
  return (
    <span
      aria-hidden="true"
      className="pixel-sprite"
      style={{
        display: "inline-block",
        width: f.w * scale,
        height: f.h * scale,
        backgroundImage:
          source === fauna
            ? "url(/fauna/atlas.png)"
            : source === faunaB
              ? "url(/fauna-b/atlas.png)"
            : source === faunaC
              ? "url(/fauna-c/atlas.png)"
            : source === nature
            ? "url(/nature/atlas.png)"
            : source === ecology
              ? "url(/ecology/atlas.png)"
              : source === props
                ? "url(/props/atlas.png)"
                : source === buildings
                  ? "url(/packs/buildings.png)"
                  : source === civic
                    ? "url(/packs/civic.png)"
                    : "url(/packs/atlas.png)",
        backgroundPosition: `-${f.x * scale}px -${f.y * scale}px`,
        backgroundSize: `${source.meta.size.w * scale}px ${source.meta.size.h * scale}px`,
        imageRendering: "pixelated",
        flexShrink: 0,
      }}
    />
  );
}
/** A worn item's own art, coloured by the cloth in its id. Falls back to the
 * atlas sprite for anything without a drawing. */
export function ItemIcon({
  id,
  sprite,
  scale = 2,
}: {
  id: string;
  sprite?: string;
  scale?: number;
}) {
  const parsed = parseCloth(id);
  const base = parsed?.base ?? id;
  const icon = garmentIconFor(base) ?? itemIconFor(base);
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !icon) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, GARMENT_ICON, GARMENT_ICON);
    drawGarmentIcon(ctx, icon, 0, 0, parsed?.cloth);
  }, [icon, id]);
  if (!icon) return sprite ? <Sprite name={sprite} scale={scale} /> : null;
  return (
    <canvas
      ref={ref}
      width={GARMENT_ICON}
      height={GARMENT_ICON}
      aria-hidden="true"
      style={{
        width: GARMENT_ICON * scale,
        height: GARMENT_ICON * scale,
        // The art is wider than the sprites it replaces; a tight slot shrinks
        // it rather than cropping the hem off.
        maxWidth: "100%",
        maxHeight: "100%",
        imageRendering: "pixelated",
        flexShrink: 0,
      }}
    />
  );
}
export function timeLabel(seconds: number) {
  const hour = Math.floor(seconds / 3600) % 24,
    minute = Math.floor(seconds / 60) % 60;
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}
export { Minimap } from "./Minimap";
