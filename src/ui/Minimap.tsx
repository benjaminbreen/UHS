import { habitatAppearance } from "../render/habitat-appearance";
import { defaultGrassArt } from "../content/graphics/grass-art";
import { soils } from "../render/habitat-raster";
import { paletteKey } from "../content/ecology/profiles";
import { natureTreeSprites } from "../content/ecology/vegetation";
import { useEffect, useRef, useState } from "react";
import { faunaProfile } from "../content/fauna";
import atlas from "../render/generated/atlas.json" with { type: "json" };
import { surfaceAt } from "../render/materials";
import { atlasSample, broadEnvironment, fromAtlas, toAtlas } from "../world/geography/atlas";
import type { Runtime } from "../runtime/session";
import type { WorldModel, Point } from "../core/types";
const PAD = 32;
let atlasImage: HTMLImageElement | undefined;
function sprites() {
  if (!atlasImage) {
    atlasImage = new Image();
    atlasImage.src = "/packs/atlas.png";
  }
  return atlasImage;
}
function hash(x: number, y: number) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
// Flat map colours in the world's own palette; edges are outlined separately.
const colors: Record<string, string> = {
  snow: "#dfe7e6",
  rock: "#8f8b80",
  marsh: "#4f7f62",
  grass: "#6ea447",
  dry: "#a7a862",
  dirt: "#b28a5c",
  sand: "#d1c288",
  water: "#2f7ea0",
  bridge: "#a88755",
  paving: "#c4bea6",
  field: "#9c874a",
  floor: "#b6a078",
};
const shade: Record<string, string> = {
  grass: "#5f9440",
  dry: "#98995a",
  dirt: "#a37e54",
  field: "#8c7840",
  sand: "#c4b47c",
};
const roofCache = new Map<string, { roof: string; wall: string }>();
/** Roof and wall tone read from the building's own sprite, so each region's houses keep their colours. */
function buildingTones(sprite: string, image: HTMLImageElement) {
  const cached = roofCache.get(sprite);
  if (cached) return cached;
  const f = (
    atlas.frames as Record<
      string,
      { frame: { x: number; y: number; w: number; h: number } }
    >
  )[sprite]?.frame;
  const fallback = { roof: "#4a5560", wall: "#d8cfb0" };
  if (!f || !image.complete || !image.naturalWidth) return fallback;
  const c = document.createElement("canvas");
  c.width = f.w;
  c.height = f.h;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(image, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h);
  const avg = (y0: number, y1: number) => {
    const d = ctx.getImageData(0, y0, f.w, Math.max(1, y1 - y0)).data;
    let r = 0,
      g = 0,
      b = 0,
      n = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 200) continue;
      r += d[i];
      g += d[i + 1];
      b += d[i + 2];
      n++;
    }
    if (!n) return undefined;
    return `rgb(${Math.round(r / n)},${Math.round(g / n)},${Math.round(b / n)})`;
  };
  const tones = {
    roof: avg(Math.round(f.h * 0.08), Math.round(f.h * 0.4)) ?? fallback.roof,
    wall: avg(Math.round(f.h * 0.55), Math.round(f.h * 0.85)) ?? fallback.wall,
  };
  roofCache.set(sprite, tones);
  return tones;
}
/** Ground far outside the region, read from the Earth atlas: one coastline
 *  lookup instead of generating terrain the region never sited. */
function atlasGround(ax: number, ay: number) {
  const { coast } = atlasSample(ax, ay);
  if (coast < 0) return "water";
  const { lon, lat } = fromAtlas(ax, ay);
  const { relief, moisture, cold } = broadEnvironment(lon, lat);
  if (cold) return "snow";
  if (relief > 0.55) return "rock";
  if (coast < 6) return "sand";
  return moisture < 0.25 ? "sand" : moisture < 0.45 ? "dry" : "grass";
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
  /** Draw only the places from this index on, over an already painted map.
   * Activating a place used to resample the whole terrain for a few roofs. */
  placesFrom = 0,
) {
  const c = canvas.getContext("2d")!;
  // Desert colourways recolour the flat map's sand and bare ground too.
  const env = world.pack.setting?.environment;
  const soil = env?.colorway
    ? soils[paletteKey(env.ecology, env.colorway)]
    : undefined;
  const hex = (rgb: number[]) =>
    "#" + rgb.map((v) => v.toString(16).padStart(2, "0")).join("");
  const colorway: Record<string, string> =
    soil && env?.colorway !== "highland" && env?.ecology === "desert"
      ? { sand: hex(soil[3]), dry: hex(soil[2]), dirt: hex(soil[1]) }
      : {};
  c.save();
  c.translate(PAD, PAD);
  c.imageSmoothingEnabled = false;
  const px = 2;
  const cols = Math.ceil((size + PAD * 2) / px),
    rows = Math.ceil((height + PAD * 2) / px);
  const kind: string[] = new Array(cols * rows);
  const coarse = extent > (world.generatorVersion === 3 ? 320 : 3200);
  const at = (i: number, j: number) => {
    const x = i * px - PAD,
      y = j * px - PAD;
    const wx = Math.floor(origin.x + ((x - size / 2) * extent) / size),
      wy = Math.floor(origin.y + ((y - height / 2) * extent) / size);
    return { x, y, wx, wy };
  };
  const mapHalf = world.pack.setting?.playableMap?.size;
  const anchor = toAtlas(world.pack.anchor.lon, world.pack.anchor.lat);
  // Terrain pass.
  if (!placesFrom)
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const { x, y, wx, wy } = at(i, j);
      const inMap = mapHalf === undefined || (wx >= -mapHalf / 2 && wx < mapHalf / 2 && wy >= -mapHalf / 2 && wy < mapHalf / 2);
      // Once a pixel spans several cells, generated ground is sub-pixel detail:
      // in-map habitat tint and the neighbouring-region preview both cost a
      // full terrain sample for it, so the atlas carries the frame instead.
      const preview = coarse ? undefined : world.mapTerrain?.(wx, wy);
      let k: string =
        !inMap
          ? (preview?.terrain ?? atlasGround(anchor.x + wx, anchor.y + wy))
          : coarse && world.overview
            ? world.overview(wx, wy)
            : surfaceAt(world, wx, wy);
      let fill = colorway[k] ?? colors[k] ?? colors.grass;
      if (world.topography && extent <= 320 && inMap) {
        const cell = world.topography(wx, wy);
        if (cell.surface === "water") {
          k = "water";
          fill = cell.waterDepth === "shallow" ? "#3d93b0" : "#2a6f93";
        } else if (cell.height > world.topography(wx, wy + 1).height) {
          k = "cliff";
          fill = "#8d6640";
        }
      }
      const h = preview?.habitat;
      if (k === "water" && h?.colorway === "swamp") fill = "#536f59";
      if (h && ["grass", "dry", "sand", "marsh", "rock"].includes(k)) {
        const parts = h.blend ?? [{ ecology: h.ecology, colorway: h.colorway, weight: 1 }];
        const rgb = [0, 1, 2].map((channel) => Math.round(parts.reduce((sum, part) => {
          const key = paletteKey(part.ecology, part.colorway);
          const mineral = part.ecology === "desert" || k === "sand" || k === "rock";
          const ramp = mineral ? soils[key] : defaultGrassArt.palettes[key];
          const index = mineral ? 2 : h.wet > 0.6 ? 7 : h.cover > 0.55 ? 2 : 0;
          return sum + ramp[index][channel] * part.weight;
        }, 0)));
        fill = hex(h.site ? habitatAppearance(h).ground : rgb);
      }
      kind[j * cols + i] = k;
      // Sparse darker speckle gives grass and soil their pixel grain.
      if (!h && shade[k] && hash(wx, wy) < 0.16) fill = shade[k];
      c.fillStyle = fill;
      c.fillRect(x, y, px, px);
    }
  // Outline pass: a darker seam wherever the ground type changes, plus a pale
  // shoreline on the water side.
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const k = kind[j * cols + i];
      const right = i + 1 < cols ? kind[j * cols + i + 1] : k,
        down = j + 1 < rows ? kind[(j + 1) * cols + i] : k;
      if (k === right && k === down) continue;
      const { x, y } = at(i, j);
      const water = k === "water";
      const nearWater = right === "water" || down === "water";
      if (water && !(right === "water" && down === "water")) {
        c.fillStyle = "#8ed0dc";
        if (right !== "water") c.fillRect(x + px - 1, y, 1, px);
        if (down !== "water") c.fillRect(x, y + px - 1, px, 1);
        continue;
      }
      c.fillStyle = nearWater ? "#245d5a" : "#00000033";
      if (k !== right) c.fillRect(x + px - 1, y, 1, px);
      if (k !== down) c.fillRect(x, y + px - 1, px, 1);
    }
  const toPx = (wx: number, wy: number) => ({
    x: Math.round(((wx - origin.x) * size) / extent + size / 2),
    y: Math.round(((wy - origin.y) * size) / extent + height / 2),
  });
  const tree = (x: number, y: number) => {
    // 7px canopy: rim, body, highlight, trunk.
    c.fillStyle = "#2f5a28";
    c.fillRect(x - 3, y - 5, 7, 5);
    c.fillRect(x - 2, y - 6, 5, 1);
    c.fillRect(x - 2, y, 5, 1);
    c.fillStyle = "#4f9a3a";
    c.fillRect(x - 2, y - 5, 5, 5);
    c.fillRect(x - 1, y - 6, 3, 1);
    c.fillStyle = "#86c95c";
    c.fillRect(x - 2, y - 5, 2, 2);
    c.fillRect(x - 1, y - 6, 2, 1);
    c.fillStyle = "#5a3d24";
    c.fillRect(x, y + 1, 1, 2);
  };
  const stride = extent > 3200 ? extent : regional || large ? 4 : 1;
  const span = ((height + PAD * 2) * extent) / size / 2;
  if (!placesFrom)
  for (
    let wy = Math.floor((origin.y - span) / stride) * stride;
    wy < origin.y + span;
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
      ) {
        // Thin dense cover so canopies stay readable as separate icons.
        if (hash(wx + 7, wy + 3) < (regional || large ? 0.4 : 0.3)) continue;
        const { x, y } = toPx(wx, wy);
        tree(x, y);
      }
    }
  // Buildings: a roof block over a wall block, both in the sprite's own tones.
  const sorted = world.places
    .slice(placesFrom)
    .sort((a, b) => a.y + a.h - (b.y + b.h));
  for (const b of sorted) {
    const { x, y } = toPx(b.x + b.w / 2, b.y + b.h);
    const w = Math.max(6, Math.round((b.w * size) / extent) + 2);
    const h = Math.max(6, Math.round(w * 0.8));
    const { roof, wall } = buildingTones(b.sprite, sprites);
    const left = x - Math.floor(w / 2),
      top = y - h;
    const roofH = Math.max(3, Math.round(h * 0.45));
    c.fillStyle = "#1f2427";
    c.fillRect(left - 1, top - 1, w + 2, h + 2);
    c.fillStyle = wall;
    c.fillRect(left, top + roofH, w, h - roofH);
    c.fillStyle = roof;
    c.fillRect(left, top, w, roofH);
    c.fillStyle = "#ffffff55";
    c.fillRect(left, top, w, 1);
    c.fillStyle = "#3a2c20";
    c.fillRect(x - 1, y - 2, 2, 2);
    if (w >= 10) {
      c.fillStyle = "#4b5d6c";
      c.fillRect(left + 2, top + roofH + 1, 2, 2);
      c.fillRect(left + w - 4, top + roofH + 1, 2, 2);
    }
  }
  if ((large || regional) && !placesFrom) {
    c.font = `${large ? 13 : 10}px Georgia`;
    c.fillStyle = "#fff2d2";
    const settlements =
      world.geography?.placesIn({
        x: origin.x - extent / 2 - (PAD * extent) / size,
        y: origin.y - span,
        w: extent + (PAD * 2 * extent) / size,
        h: span * 2,
      }) ?? world.settlements;
    for (const s of settlements) {
      if ("parentId" in s && s.parentId) continue;
      const { x, y } = toPx(s.x, s.y);
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
  /** Animal groups on the map this draw, for the hover label. */
  const pins = useRef<{ x: number; y: number; text: string }[]>([]);
  const [pin, setPin] = useState<{ x: number; y: number; text: string }>();
  const world = runtime.engine.world;
  const revision = runtime.engine.state.revision;
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
      const moved =
        !map ||
        map.world !== world ||
        map.key !== key ||
        map.places > places ||
        (Math.abs(origin.x - map.origin.x) * size) / extent > PAD - 4 ||
        (Math.abs(origin.y - map.origin.y) * size) / extent > PAD - 4;
      // Places activate constantly while walking. Painting the new roofs over
      // the map we have costs a few rectangles; the full rebuild resamples the
      // world per pixel and was stalling a frame every few seconds.
      if (!moved && map && map.places < places) {
        paintBackground(
          map.canvas,
          world,
          image,
          map.origin,
          size,
          height,
          extent,
          large,
          regional,
          map.places,
        );
        map.places = places;
      }
      if (moved) {
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
      map = backing.current!;
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
      const mx = ((p.x - origin.x) * size) / extent + size / 2,
        my = ((p.y - origin.y) * size) / extent + height / 2;
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#1c2430aa";
      ctx.beginPath();
      ctx.arc(mx, my, large ? 7 : 5.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "#f7ebcb";
      ctx.beginPath();
      ctx.arc(mx, my, large ? 6 : 4.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#f7ebcb";
      ctx.beginPath();
      ctx.arc(mx, my, large ? 2.5 : 2, 0, Math.PI * 2);
      ctx.fill();
      // One dot per animal group: cream for kept animals, amber for wild.
      pins.current = [];
      for (const g of runtime.engine.state.fauna ?? []) {
        const x = ((g.pos.x - origin.x) * size) / extent + size / 2,
          y = ((g.pos.y - origin.y) * size) / extent + height / 2;
        if (x < 3 || y < 3 || x > size - 3 || y > height - 3) continue;
        const profile = faunaProfile(g.speciesId);
        ctx.fillStyle = "#1c2430aa";
        ctx.beginPath();
        ctx.arc(x, y, large ? 3.5 : 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = profile?.category === "wild" ? "#e6a53c" : "#f1e2b5";
        ctx.beginPath();
        ctx.arc(x, y, large ? 2.5 : 2, 0, Math.PI * 2);
        ctx.fill();
        pins.current.push({
          x,
          y,
          text: `${(profile?.label ?? g.speciesId).replace(" study", "")} · ${g.members.length}`,
        });
      }
    };
    const ready = () => {
      if (
        image.complete &&
        image.naturalWidth
      )
        draw();
    };
    ready();
    image.addEventListener("load", ready);
    return () => {
      image.removeEventListener("load", ready);
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
    revision,
  ]);
  return (
    <span className="minimap-frame">
      <canvas
        ref={ref}
        width={size}
        height={height}
        className={large ? "large-map" : "minimap"}
        aria-label="Map derived from the generated regional plan"
        onMouseMove={(event) => {
          const r = event.currentTarget.getBoundingClientRect();
          const sx = size / r.width,
            sy = height / r.height;
          const x = (event.clientX - r.left) * sx,
            y = (event.clientY - r.top) * sy;
          let best: (typeof pins.current)[number] | undefined,
            near = 9 * sx;
          for (const d of pins.current) {
            const dd = Math.hypot(d.x - x, d.y - y);
            if (dd < near) {
              near = dd;
              best = d;
            }
          }
          setPin(best ? { x: best.x / sx, y: best.y / sy, text: best.text } : undefined);
        }}
        onMouseLeave={() => setPin(undefined)}
      />
      {pin && (
        <span className="map-pin" style={{ left: pin.x, top: pin.y }}>
          {pin.text}
        </span>
      )}
    </span>
  );
}
