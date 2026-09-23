import artVersion from "./generated/art-version.json" with { type: "json" };

/** Moves when the packed art moves, so a rebuild is not hidden by a cached
 *  texture. The atlases are served from public/ by plain path, which the
 *  browser is entitled to hold on to indefinitely without it. */
export const artStamp = artVersion.stamp;

const atlases = {
  nature: "/nature/atlas",
  faunab: "/fauna-b/atlas",
  faunac: "/fauna-c/atlas",
  "nature-shadows": "/nature/shadows",
  ecology: "/ecology/atlas",
  props: "/props/atlas",
  "prop-shadows": "/props/shadows",
  atlas: "/packs/atlas",
  buildings: "/packs/buildings",
  "regional-buildings": "/packs/regional-buildings",
  civic: "/packs/civic",
  precincts: "/packs/precincts",
  "lighting-shadows": "/packs/lighting-shadows",
  topography: "/topography/atlas",
} as const;

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
export function sceneAssets() {
  return {
    atlases: Object.entries(atlases).map(([key, path]) => ({
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
  if (warmed || typeof fetch === "undefined") return;
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
