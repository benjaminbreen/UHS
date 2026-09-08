import atlas from "../../../public/props/atlas.json";
import { propDefs } from "../../content/props/catalog";
export type CarriedArt = {
  sprite: string;
  kind: "stick" | "side" | "both";
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
      image.src = "/props/atlas.png";
    },
  ));
}
export const portableProps = Object.entries(propDefs)
  .filter(([, d]) => d.portable)
  .map(([id, d]) => ({ id, name: d.name, sprite: `study-prop-${d.family}-0` }));
