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
  trains: "/props/trains",
  "horse-voxel": "/fauna-v/horse",
  conveyances: "/fauna-v/vehicles",
  "vehicle-shadows": "/props/vehicle-shadows",
  atlas: "/packs/atlas",
  buildings: "/packs/buildings",
  "regional-buildings": "/packs/regional-buildings",
  "camp-buildings": "/packs/camp-buildings",
  "modern-buildings": "/packs/modern-buildings",
  "street-buildings": "/packs/street-buildings",
  "street-weather": "/packs/street-weather",
  civic: "/packs/civic",
  "sacred-buildings": "/packs/sacred-buildings",
  precincts: "/packs/precincts",
  "lighting-shadows": "/packs/lighting-shadows",
  "street-shadows": "/packs/street-shadows",
  "civic-shadows": "/packs/civic-shadows",
  topography: "/topography/atlas",
} as const;
/** Building sheets, in lookup order. Each decodes to up to 64 MB and most
 * worlds use one, so the scene loads their frame lists and fetches a sheet
 * only once something in the world is drawn from it. */
export const lazySheets = [
  "buildings",
  "regional-buildings",
  "camp-buildings",
  "modern-buildings",
  "street-buildings",
  // Snow and rain on the voxel street: only in that weather.
  "street-weather",
  "civic",
  "sacred-buildings",
  "precincts",
  // The casts of temples and mosques: only in the towns that have one.
  "civic-shadows",
  // Parked cars: nowhere before the motor age.
  "vehicles",
  // Rolling stock: only where a railway runs.
  "trains",
  // The voxel horse: the developer's ride, for now.
  "horse-voxel",
  // Carts, wagons and chariots: where the period and place drove them.
  "conveyances",
  // The megafauna: most worlds are too late or too far south for them.
  "faunam",
  "faunar",
  "faunaf",
  "faunag",
  "faunau",
] as const;

/** Building sheets the game reads as 1024px pages (scripts/art/page_sheets.py),
 * so a town decodes the few pages its houses sit on, not whole 4096px sheets. */
export const pagedSheets = [
  "buildings",
  "regional-buildings",
  "camp-buildings",
  "modern-buildings",
  "street-buildings",
  "street-weather",
  "civic",
  "sacred-buildings",
  "precincts",
] as const;
const paged = (key: string) => (pagedSheets as readonly string[]).includes(key);
export const pageImage = (key: string, page: number) =>
  `/packs/pages/${key}-${page}.png?v=${artStamp}`;

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
        data: paged(key)
          ? `/packs/pages/${key}.json?v=${artStamp}`
          : `${path}.json?v=${artStamp}`,
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
    ...atlases.flatMap((a) => (lazySheets as readonly string[]).includes(a.key)
      ? [a.data] : [a.data, a.image]),
    ...images.map((i) => i.url),
    ...sheets.map((s) => s.url),
  ];
  for (const url of urls)
    void fetch(url, { priority: "low" } as RequestInit).catch(() => {});
}
