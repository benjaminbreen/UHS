import ecology from "../../public/ecology/atlas.json" with { type: "json" };
import props from "../render/generated/props.json" with { type: "json" };
import atlas from "../render/generated/atlas.json" with { type: "json" };
export function Sprite({ name, scale = 2 }: { name: string; scale?: number }) {
  const source = name.startsWith("ecology-")
    ? ecology
    : name.startsWith("study-prop-") || name.startsWith("prop-broken-")
      ? props
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
          source === ecology
            ? "url(/ecology/atlas.png)"
            : source === props
              ? "url(/props/atlas.png)"
              : "url(/packs/atlas.png)",
        backgroundPosition: `-${f.x * scale}px -${f.y * scale}px`,
        backgroundSize: `${source.meta.size.w * scale}px ${source.meta.size.h * scale}px`,
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
