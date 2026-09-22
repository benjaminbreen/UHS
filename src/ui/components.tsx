import { useEffect, useRef } from "react";
import { useSheets } from "./sprite-atlas";
import { parseCloth } from "../content/characters/wardrobe/cloth";
import {
  drawGarmentIcon,
  garmentIconFor,
  itemIconFor,
  GARMENT_ICON,
} from "../render/garment-icons";

export function Sprite({ name, scale = 2 }: { name: string; scale?: number }) {
  const sheets = useSheets();
  if (!sheets) return null;
  const source = name.startsWith("fauna-")
    ? sheets.fauna
    : name.startsWith("faunab-")
      ? sheets.faunaB
      : name.startsWith("faunac-")
        ? sheets.faunaC
        : name.startsWith("nature-")
          ? sheets.nature
          : name.startsWith("ecology-")
            ? sheets.ecology
            : name.startsWith("study-prop") || name.startsWith("prop-broken-")
              ? sheets.props
              : name in sheets.buildings.frames
                ? sheets.buildings
                : name in sheets.regionalBuildings.frames
                  ? sheets.regionalBuildings
                  : name in sheets.civic.frames
                    ? sheets.civic
                    : sheets.atlas;
  const f = source.frames[name]?.frame;
  if (!f) return null;
  // The sheet is shown at its own size and the element is scaled afterwards.
  // Scaling backgroundSize instead makes the browser rasterise the whole sheet
  // at the zoomed size — 4096x3279 at scale 2 is 215MB for one 32px icon, and
  // on iOS that alone ends the tab.
  const image = (
    <span
      aria-hidden="true"
      className="pixel-sprite"
      style={{
        display: "block",
        width: f.w,
        height: f.h,
        transform: scale === 1 ? undefined : `scale(${scale})`,
        transformOrigin: "top left",
        backgroundImage: `url(${source.image})`,
        backgroundPosition: `-${f.x}px -${f.y}px`,
        backgroundSize: `${source.meta.size.w}px ${source.meta.size.h}px`,
        imageRendering: "pixelated",
        flexShrink: 0,
      }}
    />
  );
  if (scale === 1) return image;
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        width: f.w * scale,
        height: f.h * scale,
        flexShrink: 0,
      }}
    >
      {image}
    </span>
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
