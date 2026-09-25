import atlas from "../../../public/props/atlas.json" with { type: "json" };
import { propDefs } from "../../content/props/catalog";
import propsB from "../generated/props-b.json" with { type: "json" };
import { artStamp } from "../scene-assets";
const redrawnFamilies = new Set<string>(propsB);
export type CarriedArt = {
  sprite: string;
  kind: "stick" | "tool" | "haft" | "bow" | "blade" | "brand" | "side" | "both" | "head" | "back";
  image: HTMLCanvasElement;
  width: number;
  height: number;
};
let pending: Promise<Map<string, CarriedArt>> | undefined;
/** Crop only transparent storage padding; occupied pixels retain native scale. */
export function loadCarriedArt() {
  return (pending ??= new Promise<Map<string, CarriedArt>>(
    (resolve, reject) => {
      const image = new Image();
      image.onerror = () => {
        pending = undefined;
        reject(Error("Unable to load prop artwork"));
      };
      image.onload = () => {
        const result = new Map<string, CarriedArt>();
        for (const [sprite, entry] of Object.entries(atlas.frames)) {
          const { x, y, w, h } = entry.frame;
          const c = document.createElement("canvas");
          c.width = w;
          c.height = h;
          const ctx = c.getContext("2d")!;
          ctx.drawImage(image, x, y, w, h, 0, 0, w, h);
          const pixels = ctx.getImageData(0, 0, w, h).data;
          let x0 = w,
            y0 = h,
            x1 = 0,
            y1 = 0;
          for (let j = 0; j < h; j++)
            for (let i = 0; i < w; i++)
              if (pixels[(j * w + i) * 4 + 3]) {
                x0 = Math.min(x0, i);
                y0 = Math.min(y0, j);
                x1 = Math.max(x1, i);
                y1 = Math.max(y1, j);
              }
          if (x0 === w) continue;
          const crop = document.createElement("canvas");
          crop.width = x1 - x0 + 1;
          crop.height = y1 - y0 + 1;
          crop
            .getContext("2d")!
            .drawImage(
              c,
              x0,
              y0,
              crop.width,
              crop.height,
              0,
              0,
              crop.width,
              crop.height,
            );
          const kind = sprite.includes("stick")
            ? "stick"
            : /-(pitchfork|rake|scythe|shovel|spear)-/.test(sprite)
              ? "haft"
              : /-(spade|hoe|sickle|pick)-/.test(sprite)
                ? "tool"
                : /sack|water-jug|metal-tin/.test(sprite)
                  ? "side"
                  : "both";
          result.set(sprite, {
            sprite,
            kind,
            image: crop,
            width: crop.width,
            height: crop.height,
          });
        }
        resolve(result);
      };
      // Same URL as the scene, so it is one download.
      image.src = `/props/atlas.png?v=${artStamp}`;
    },
  ));
}
/** A redrawn family has no A study left in the atlas, so the carried sprite
 *  takes the B one, the same way the world does in content/props/place.ts. */
export const portableProps = Object.entries(propDefs)
  .filter(([, d]) => d.portable)
  .map(([id, d]) => ({
    id,
    name: d.name,
    sprite: `study-prop${redrawnFamilies.has(d.family) ? "b" : ""}-${d.family}-0`,
  }));

/** An inventory item in the hand, drawn from the icon art rather than the
 * prop atlas: the things a person picks up have no prop sprite, and the icon
 * is the picture the panel already shows them. Cropped to its own pixels so
 * the hand holds the object, not a box of empty space. */
export function iconCarriedArt(
  id: string,
  draw: (ctx: CanvasRenderingContext2D) => void,
  size: number,
): CarriedArt | undefined {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  draw(ctx);
  const pixels = ctx.getImageData(0, 0, size, size).data;
  let x0 = size,
    y0 = size,
    x1 = 0,
    y1 = 0;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++)
      if (pixels[(y * size + x) * 4 + 3]) {
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x);
        y1 = Math.max(y1, y);
      }
  if (x0 === size) return undefined;
  // The icon is drawn for a panel; a person is twenty pixels tall. Halve it,
  // nearest-neighbour, so it sits in the hand rather than over the chest.
  const shrink = Math.max(x1 - x0 + 1, y1 - y0 + 1) > 13 ? 2 : 1;
  const crop = document.createElement("canvas");
  crop.width = Math.ceil((x1 - x0 + 1) / shrink);
  crop.height = Math.ceil((y1 - y0 + 1) / shrink);
  const out = crop.getContext("2d")!;
  out.imageSmoothingEnabled = false;
  out.drawImage(
    c,
    x0,
    y0,
    x1 - x0 + 1,
    y1 - y0 + 1,
    0,
    0,
    crop.width,
    crop.height,
  );
  return {
    sprite: id,
    kind: id === "icon:bow" ? "bow" : id === "icon:tool" ? "blade" : id === "icon:torch" ? "brand" : "both",
    image: crop,
    width: crop.width,
    height: crop.height,
  };
}
