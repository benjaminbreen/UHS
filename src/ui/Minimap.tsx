import nature from "../../public/nature/atlas.json" with { type: "json" };
import { natureTreeSprites } from "../content/ecology/vegetation";
import { useEffect, useRef } from "react";
import atlas from "../render/generated/atlas.json" with { type: "json" };
import { surfaceAt } from "../render/materials";
import type { Runtime } from "../runtime/session";
import type { WorldModel, Point } from "../core/types";
const PAD = 32;
let natureImage: HTMLImageElement | undefined;
let atlasImage: HTMLImageElement | undefined;
function sprites() {
  if (!atlasImage) {
    atlasImage = new Image();
    atlasImage.src = "/packs/atlas.png";
  }
  if (!natureImage) {
    natureImage = new Image();
    natureImage.src = "/nature/atlas.png";
  }
  return atlasImage;
}
function paintBackground(
  canvas: HTMLCanvasElement,
  world: WorldModel,
  sprites: HTMLImageElement,
  origin: Point,
  size: number,
  height: number,
  extent: number,
  large: boolean,
  regional: boolean,
) {
  const c = canvas.getContext("2d")!;
  c.save();
  c.translate(PAD, PAD);
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
  for (let y = -PAD; y < height + PAD; y += 2)
    for (let x = -PAD; x < size + PAD; x += 2) {
      const wx = Math.floor(origin.x + ((x - size / 2) * extent) / size),
        wy = Math.floor(origin.y + ((y - height / 2) * extent) / size);
      c.fillStyle =
        colors[
          extent > (world.generatorVersion === 3 ? 320 : 3200) && world.overview
            ? world.overview(wx, wy)
            : surfaceAt(world, wx, wy)
        ];
      if (world.topography && extent <= 320) {
        const cell = world.topography(wx, wy);
        if (cell.surface === "water")
          c.fillStyle = cell.waterDepth === "shallow" ? "#409baa" : "#146c8c";
        else if (cell.height > world.topography(wx, wy + 1).height)
          c.fillStyle = "#956c40";
      }
      c.fillRect(x, y, 2, 2);
    }
  const stamp = (name: string, x: number, y: number, width: number) => {
    const f = (
      (name.startsWith("nature-") ? nature.frames : atlas.frames) as Record<
        string,
        { frame: { x: number; y: number; w: number; h: number } }
      >
    )[name]?.frame;
    if (!f) return;
    const h = Math.round((width * f.h) / f.w);
    c.drawImage(
      name.startsWith("nature-") ? natureImage! : sprites,
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
      Math.floor(
        (origin.y - ((height + PAD * 2) * extent) / size / 2) / stride,
      ) * stride;
    wy < origin.y + ((height + PAD * 2) * extent) / size / 2;
    wy += stride
  )
    for (
      let wx =
        Math.floor((origin.x - extent / 2 - (PAD * extent) / size) / stride) *
        stride;
      wx < origin.x + extent / 2 + (PAD * extent) / size;
      wx += stride
    ) {
      const prop =
        world.geography && extent > 320 ? undefined : world.decoration(wx, wy);
      if (
        prop &&
        (world.pack.trees.includes(prop.sprite) ||
          natureTreeSprites.includes(prop.sprite))
      )
        stamp(
          prop.sprite,
          ((wx - origin.x) * size) / extent + size / 2,
          ((wy - origin.y) * size) / extent + height / 2,
          regional ? 9 : 11,
        );
    }
  for (const b of world.places) {
    const x = ((b.x + b.w / 2 - origin.x) * size) / extent + size / 2,
      y = ((b.y + b.h - origin.y) * size) / extent + height / 2;
    stamp(b.sprite, x, y, Math.max(5, Math.round((b.w * size) / extent)));
  }
  if (large || regional) {
    c.font = `${large ? 13 : 10}px Georgia`;
    c.fillStyle = "#fff2d2";
    const settlements =
      world.geography?.placesIn({
        x: origin.x - extent / 2 - (PAD * extent) / size,
        y: origin.y - ((height + PAD * 2) * extent) / size / 2,
        w: extent + (PAD * 2 * extent) / size,
        h: ((height + PAD * 2) * extent) / size,
      }) ?? world.settlements;
    for (const s of settlements) {
      if ("parentId" in s && s.parentId) continue;
      const x = ((s.x - origin.x) * size) / extent + size / 2,
        y = ((s.y - origin.y) * size) / extent + height / 2;
      if (
        x < 3 - PAD ||
        x > size + PAD - 3 ||
        y < 10 - PAD ||
        y > height + PAD - 3
      )
        continue;
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

  c.restore();
}
type Backing = {
  world: WorldModel;
  origin: Point;
  key: string;
  canvas: HTMLCanvasElement;
  places: number;
};
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
  const backing = useRef<Backing | undefined>(undefined);
  const world = runtime.engine.world;
  const local = runtime.engine.state.player.pos;
  const p =
    local.space === "outside" ? local : world.place(local.space)!.entrance;
  const size = large ? 520 : 256,
    height = large ? 350 : 148;
  const extent =
    span ?? (large || regional ? (world.regionExtent ?? 320) : 110);
  const origin =
    (large || regional) && !world.pack.setting ? { x: 20, y: 25 } : p;
  const places = world.places.length;
  useEffect(() => {
    const canvas = ref.current!;
    const image = sprites();
    const draw = () => {
      const key = `${size}:${height}:${extent}:${large}:${regional}`;
      let map = backing.current;
      if (
        !map ||
        map.world !== world ||
        map.key !== key ||
        map.places !== places ||
        (Math.abs(origin.x - map.origin.x) * size) / extent > PAD - 4 ||
        (Math.abs(origin.y - map.origin.y) * size) / extent > PAD - 4
      ) {
        const background = document.createElement("canvas");
        background.width = size + PAD * 2;
        background.height = height + PAD * 2;
        paintBackground(
          background,
          world,
          image,
          origin,
          size,
          height,
          extent,
          large,
          regional,
        );
        map = backing.current = {
          world,
          origin: { ...origin },
          key,
          canvas: background,
          places,
        };
        canvas.dataset.mapBuilds = String(
          Number(canvas.dataset.mapBuilds ?? 0) + 1,
        );
      }
      const ctx = canvas.getContext("2d")!;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, size, height);
      ctx.drawImage(
        map.canvas,
        PAD + ((origin.x - map.origin.x) * size) / extent,
        PAD + ((origin.y - map.origin.y) * size) / extent,
        size,
        height,
        0,
        0,
        size,
        height,
      );
      ctx.fillStyle = "#f7ebcb";
      ctx.strokeStyle = "#303a31";
      ctx.beginPath();
      ctx.arc(
        ((p.x - origin.x) * size) / extent + size / 2,
        ((p.y - origin.y) * size) / extent + height / 2,
        large ? 4 : 3,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.stroke();
    };
    const ready = () => {
      if (
        image.complete &&
        image.naturalWidth &&
        natureImage?.complete &&
        natureImage.naturalWidth
      )
        draw();
    };
    ready();
    image.addEventListener("load", ready);
    natureImage!.addEventListener("load", ready);
    return () => {
      image.removeEventListener("load", ready);
      natureImage!.removeEventListener("load", ready);
    };
  }, [
    world,
    p.x,
    p.y,
    origin.x,
    origin.y,
    size,
    height,
    extent,
    large,
    regional,
    places,
  ]);
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
