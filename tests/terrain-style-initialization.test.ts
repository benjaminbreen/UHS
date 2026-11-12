import { expect, it, vi } from "vitest";
import type Phaser from "phaser";
import type { WorldModel } from "../src/core/types";
import type { PreparedSettlement } from "../src/world/v3/prepared";

vi.mock("../src/render/water-motifs", () => ({ ensureWaterAtlas: vi.fn() }));
vi.mock("../src/render/living-water/game", () => ({ usesLivingWater: () => false }));

it("gives a fresh terrain worker prepared geometry for an ordinary world", async () => {
  const { TerrainStream } = await import("../src/render/terrain-stream");
  const prepared = { sites: [], plans: [] } as unknown as PreparedSettlement;
  const prepare = vi.fn(() => prepared);
  const postMessage = vi.fn(), terminate = vi.fn();
  vi.stubGlobal("Worker", class {
    postMessage = postMessage;
    terminate = terminate;
  });
  try {
    const scene = { game: { canvas: { dataset: {} } }, options: {} } as unknown as Phaser.Scene;
    const world = { pack: { id: "atlas" }, prepare } as unknown as WorldModel;
    const stream = new TerrainStream(scene, world, "fresh-terrain");
    expect(prepare).toHaveBeenCalledTimes(1);
    expect(postMessage.mock.calls[0][0]).toMatchObject({ pack: world.pack, prepared, seed: "fresh-terrain" });
    stream.dispose();
    expect(terminate).toHaveBeenCalledTimes(1);
  } finally {
    vi.unstubAllGlobals();
  }
});

it("starts ground and worker banks at the same altitude scale", async () => {
  vi.resetModules();
  const { groundStyle, setGroundStyle } = await import(
    "../src/render/ground-style"
  );
  const projection = await import("../src/render/terrain-projection");
  const style = groundStyle()!;
  expect(projection.TERRAIN_RISE).toBe(style.bank.rise);
  const initial = projection.TERRAIN_RISE;
  setGroundStyle(style);
  expect(projection.TERRAIN_RISE).toBe(initial);
  setGroundStyle(undefined);
  expect(projection.TERRAIN_RISE).toBe(projection.DEFAULT_TERRAIN_RISE);
});

it("reuses the warmed landing raster and previews only under the same terrain style", async () => {
  const { handleTerrainRequest, useTerrainWorld } = await import("../src/render/terrain-worker");
  const topography = vi.fn(() => ({ height: 0, surface: "grass" as const }));
  const postMessage = vi.fn();
  vi.stubGlobal("self", { postMessage });
  try {
    useTerrainWorld({ topography } as unknown as WorldModel);
    const region = { x: 16, y: 32, prefix: "stream-1,2" };
    const style = { style: null, living: false, season: "summer", tide: 0 };
    handleTerrainRequest(style);
    handleTerrainRequest({ warm: region });
    expect(topography).toHaveBeenCalled();
    topography.mockClear();
    handleTerrainRequest({ ...style });
    handleTerrainRequest({ previews: [{ id: "preview", region }] });
    handleTerrainRequest({ id: "landing", region });
    expect(topography).not.toHaveBeenCalled();
    expect(postMessage.mock.calls.map(([data]) => data)).toMatchObject([
      { id: "preview", preview: expect.anything() },
      { previewsDone: true },
      { id: "landing", cells: expect.any(Array) },
    ]);

    handleTerrainRequest({ warm: region });
    topography.mockClear();
    handleTerrainRequest({ ...style, season: "winter" });
    handleTerrainRequest({ id: "winter-landing", region });
    expect(topography).toHaveBeenCalled();
  } finally {
    vi.unstubAllGlobals();
  }
});
