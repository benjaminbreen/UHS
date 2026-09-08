import ecology from "../../public/ecology/atlas.json" with { type: "json" };
import { useEffect, useRef } from "react";
import props from "../render/generated/props.json" with { type: "json" };
import atlas from "../render/generated/atlas.json" with { type: "json" };
import { surfaceAt } from "../render/materials";
import type { Runtime } from "../runtime/session";
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
export function Minimap({
  runtime,
  large = false,
  regional = false,
  span,
}: {
  runtime: Runtime;
  large?: boolean;
  regional?: boolean;
  span?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const e = runtime.engine;
  const local = e.state.player.pos;
  const p =
    local.space === "outside"
      ? local
      : { ...e.world.place(local.space)!.entrance, space: "outside" };
  const size = large ? 520 : 256,
    height = large ? 350 : 148;
  const extent =
    span ?? (large || regional ? (e.world.regionExtent ?? 320) : 110);
  const origin =
    (large || regional) && !e.world.pack.setting ? { x: 20, y: 25 } : p;
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const c = canvas.getContext("2d")!;
    let cancelled = false;
    const sprites = new Image();
    const draw = () => {
      if (cancelled) return;
      c.imageSmoothingEnabled = false;
      const colors: Record<string, string> = {
        snow: "#d9e4e5",
        rock: "#8d887d",
        marsh: "#527e68",
        grass: "#738749",
        dry: "#9ba16a",
        dirt: "#b2a070",
        sand: "#c6b681",
        water: "#246679",
        bridge: "#a59166",
        paving: "#b5b09a",
        field: "#88784f",
        floor: "#b6a078",
      };
      for (let y = 0; y < height; y += 2)
        for (let x = 0; x < size; x += 2) {
          const wx = Math.floor(origin.x + ((x - size / 2) * extent) / size),
            wy = Math.floor(origin.y + ((y - height / 2) * extent) / size);
          c.fillStyle =
            colors[
              extent > (e.world.generatorVersion === 3 ? 320 : 3200) &&
              e.world.overview
                ? e.world.overview(wx, wy)
                : surfaceAt(e.world, wx, wy)
            ];
          if (e.world.topography && extent <= 320) {
            const cell = e.world.topography(wx, wy);
            if (cell.surface === "water")
              c.fillStyle =
                cell.waterDepth === "shallow" ? "#409baa" : "#146c8c";
            else if (cell.height > e.world.topography(wx, wy + 1).height)
              c.fillStyle = "#956c40";
          }
          c.fillRect(x, y, 2, 2);
        }
      const stamp = (name: string, x: number, y: number, width: number) => {
        const f = (
          atlas.frames as Record<
            string,
            { frame: { x: number; y: number; w: number; h: number } }
          >
        )[name]?.frame;
        if (!f) return;
        const h = Math.round((width * f.h) / f.w);
        c.drawImage(
          sprites,
          f.x,
          f.y,
          f.w,
          f.h,
          Math.round(x - width / 2),
          Math.round(y - h),
          width,
          h,
        );
      };
      // Draw actual cover and settlement footprints from the shared world plan.
      const stride = extent > 3200 ? extent : regional || large ? 9 : 3;
      for (
        let wy =
          Math.floor((origin.y - (height * extent) / size / 2) / stride) *
          stride;
        wy < origin.y + (height * extent) / size / 2;
        wy += stride
      )
        for (
          let wx = Math.floor((origin.x - extent / 2) / stride) * stride;
          wx < origin.x + extent / 2;
          wx += stride
        ) {
          const prop =
            e.world.geography && extent > 320
              ? undefined
              : e.world.decoration(wx, wy);
          if (prop && e.world.pack.trees.includes(prop.sprite))
            stamp(
              prop.sprite,
              ((wx - origin.x) * size) / extent + size / 2,
              ((wy - origin.y) * size) / extent + height / 2,
              regional ? 9 : 11,
            );
        }
      for (const b of e.world.places) {
        const x = ((b.x + b.w / 2 - origin.x) * size) / extent + size / 2,
          y = ((b.y + b.h - origin.y) * size) / extent + height / 2;
        stamp(b.sprite, x, y, Math.max(5, Math.round((b.w * size) / extent)));
      }
      const px = ((p.x - origin.x) * size) / extent + size / 2,
        py = ((p.y - origin.y) * size) / extent + height / 2;
      c.fillStyle = "#f7ebcb";
      c.strokeStyle = "#303a31";
      c.beginPath();
      c.arc(px, py, large ? 4 : 3, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      if (large || regional) {
        c.font = `${large ? 13 : 10}px Georgia`;
        c.fillStyle = "#fff2d2";
        const settlements =
          e.world.geography?.placesIn({
            x: origin.x - extent / 2,
            y: origin.y - (height * extent) / size / 2,
            w: extent,
            h: (height * extent) / size,
          }) ?? e.world.settlements;
        for (const s of settlements) {
          if ("parentId" in s && s.parentId) continue;
          const x = ((s.x - origin.x) * size) / extent + size / 2,
            y = ((s.y - origin.y) * size) / extent + height / 2;
          if (x < 3 || x > size - 3 || y < 10 || y > height - 3) continue;
          c.beginPath();
          c.arc(x, y, 2, 0, Math.PI * 2);
          c.fill();
          c.stroke();
          c.textAlign = x > size * 0.6 ? "right" : "left";
          c.strokeStyle = "#354534";
          c.lineWidth = 2;
          c.strokeText(s.name, x + (x > size * 0.6 ? -6 : 6), y - 6);
          c.fillText(s.name, x + (x > size * 0.6 ? -6 : 6), y - 6);
        }
        c.textAlign = "left";
      }
    };
    sprites.onload = draw;
    sprites.src = "/packs/atlas.png";
    return () => {
      cancelled = true;
    };
  }, [e, p.x, p.y, size, height, extent, origin.x, origin.y, regional, large]);
  return (
    <canvas
      ref={ref}
      width={size}
      height={height}
      className={large ? "large-map" : "minimap"}
      aria-label="Map derived from the generated regional plan"
    />
  );
}
