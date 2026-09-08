import type { Ecology } from "../content/ecology/profiles";
import type { TopographySample } from "../core/topography";
import { rasterHabitatTile } from "../render/habitat-raster";
import { rasterWaterTile } from "../render/water-raster";
import { bankOffset } from "../world/v3/wet-features";
const container = document.querySelector("#studies")!;
const selector = document.querySelector<HTMLSelectElement>("#ecology")!;
function render() {
  container.replaceChildren();
  const ecology = selector.value as Ecology;
  for (const [name, title] of [
    ["habitat", "Habitat corners and clustered transitions"],
    ["path", "Footpath, wider road and junction"],
    ["marsh", "Damp meadow, shallow pools and sedges"],
    ["river", "Independent banks, bar and shallow coves"],
  ]) {
    const width = 26,
      height = 16;
    const sample: TopographySample = (x, y) => {
      const isMarsh = name === "marsh",
        isRiver = name === "river";
      const center = 12 + Math.sin(y / 8) * 2;
      const side = x < center ? -1 : 1;
      const dist = isRiver
        ? Math.abs(x - center) - 3 - bankOffset("tile-study", y * 2, side) * 0.7
        : isMarsh
          ? Math.min(
              (Math.hypot((x - 9) / 2, (y - 7) / 1.5) - 1) * 1.5,
              (Math.hypot((x - 17) / 2.4, (y - 10) / 1.4) - 1) * 1.4,
            )
          : 100;
      const soil =
        name === "path" &&
        (y === Math.floor(x * 0.45) + 2 ||
          (x >= 17 && x <= 19) ||
          (x >= 15 && x <= 19 && y >= 8 && y <= 10));
      const wet = isMarsh ? 0.85 : y > 8 && x > 5 ? 0.72 : 0.2;
      const exposed =
        name === "habitat" && x < 10 - Math.floor(y / 3) ? 0.52 : 0;
      return {
        height: 0,
        pathArt:
          name === "path"
            ? [
                { a: [-x, 2.5 - y], b: [26 - x, 14.2 - y], radius: 0.5 },
                { a: [18.5 - x, -y], b: [18.5 - x, 16 - y], radius: 1.5 },
              ]
            : undefined,
        surface: soil
          ? "soil"
          : dist < 0
            ? "water"
            : dist < 1
              ? "gravel"
              : "grass",
        feature: dist >= 0 && dist < 1 ? "bank" : undefined,
        habitat: {
          ecology,
          kind: isMarsh ? "hollow" : "open",
          wet,
          cover: 0.2,
          exposed,
          season: "summer",
        },
        waterVisual: {
          distance: dist,
          shoreWidth: isMarsh ? 0.45 : 1,
          kind: isMarsh ? "lake" : "river",
          ecology,
          flow: [0, 1],
          frozenMargin: false,
        },
      };
    };
    const article = document.createElement("article");
    article.innerHTML = `<h2>${title}</h2>`;
    const canvas = document.createElement("canvas");
    canvas.width = width * 16;
    canvas.height = height * 16;
    const ctx = canvas.getContext("2d")!;
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const c = sample(x, y)!;
        const tile =
          c.surface === "water"
            ? rasterWaterTile(sample, x, y, 0, 0)
            : rasterHabitatTile(sample, x, y, 0, 0);
        const image = ctx.createImageData(16, 16);
        image.data.set(tile.pixels);
        ctx.putImageData(image, x * 16, y * 16);
      }
    canvas.dataset.study = name;
    article.append(canvas);
    container.append(article);
  }
  document.body.dataset.ready = "true";
}
selector.addEventListener("change", render);
render();
