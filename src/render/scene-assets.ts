import artVersion from "./generated/art-version.json" with { type: "json" };
import { smallMemoryDevice } from "../runtime/device";

/** Moves when the packed art moves, so a rebuild is not hidden by a cached
 *  texture. The atlases are served from public/ by plain path, which the
 *  browser is entitled to hold on to indefinitely without it. */
export const artStamp = artVersion.stamp;

const atlases = {
  nature: "/nature/atlas",
  faunab: "/fauna-b/atlas",
  faunac: "/fauna-c/atlas",
  faunam: "/fauna-m/atlas",
  faunar: "/fauna-r/atlas",
  faunaf: "/fauna-f/atlas",
  faunag: "/fauna-g/atlas",
  faunau: "/fauna-u/atlas",
  "nature-shadows": "/nature/shadows",
  ecology: "/ecology/atlas",
  props: "/props/atlas",
  "prop-shadows": "/props/shadows",
  vehicles: "/props/vehicles",
  "vehicle-shadows": "/props/vehicle-shadows",
  atlas: "/packs/atlas",
  buildings: "/packs/buildings",
  "regional-buildings": "/packs/regional-buildings",
  "camp-buildings": "/packs/camp-buildings",
  civic: "/packs/civic",
  precincts: "/packs/precincts",
  "lighting-shadows": "/packs/lighting-shadows",
  topography: "/topography/atlas",
} as const;
/** Building sheets, in lookup order. Each decodes to up to 64 MB and most
 * worlds use one, so the scene loads their frame lists and fetches a sheet
 * only once something in the world is drawn from it. */
export const lazySheets = [
  "buildings",
  "regional-buildings",
  "camp-buildings",
  "civic",
  "precincts",
  // Parked cars: nowhere before the motor age.
  "vehicles",
  // The megafauna: most worlds are too late or too far south for them.
  "faunam",
  "faunar",
  "faunaf",
  "faunag",
  "faunau",
] as const;

export const alternateTrees = {
  oak: ["Oak Tree.png", 7],
  birch: ["Birch Tree 1.png", 6],
  cedar: ["Cedar Tree.png", 6],
  fir: ["Fir Tree.png", 5],
  hazel: ["Hazel Tree.png", 5],
  maple: ["Maple Tree.png", 5],
  willow: ["Willow Tree.png", 5],
  apple: ["Apple Tree.png", 6],
  cherry: ["Cherry Blossom Tree.png", 6],
} as const;

/** Everything WorldScene.preload fetches, by loader kind. */
export function sceneAssets(shadows = true) {
  return {
    atlases: Object.entries(atlases)
      .filter(([key]) => shadows || !key.endsWith("shadows"))
      .map(([key, path]) => ({
        key,
        image: `${path}.png?v=${artStamp}`,
        data: `${path}.json?v=${artStamp}`,
      })),
    images: [
      { key: "terrain", url: `/packs/terrain.png?v=${artStamp}` },
      {
        key: "tree-study-source",
        url: new URL("../../trees.png", import.meta.url).href,
      },
    ],
    sheets: Object.entries(alternateTrees).map(([id, [file]]) => ({
      key: `study-tree-${id}`,
      url: new URL(`../../trees pngs/${file}`, import.meta.url).href,
    })),
  };
}

let warmed = false;
/** Pulls the scene's art into the HTTP cache while the world is still being
 * prepared in the worker, so Phaser's loader finds it there. The same URLs,
 * query string included, or the cache does not match. */
export function warmSceneAssets() {
  if (warmed || typeof fetch === "undefined" || smallMemoryDevice()) return;
  warmed = true;
  const { atlases, images, sheets } = sceneAssets();
  const urls = [
    ...atlases.flatMap((a) => [a.data, a.image]),
    ...images.map((i) => i.url),
    ...sheets.map((s) => s.url),
  ];
  for (const url of urls)
    void fetch(url, { priority: "low" } as RequestInit).catch(() => {});
}
