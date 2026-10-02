import {
  handleTerrainRequest,
  useTerrainWorld,
  type TerrainRequest,
} from "../render/terrain-worker";
import { createWorld } from "./generate";
import { packs } from "../content/packs";
import type { Pack, WorldModel } from "../core/types";
import { createSettlementWorld, prepareSettlement } from "./v3/generate";
import { createAtlasWorld } from "./v2/generate";
import { packForSetting } from "../content/geography/pack";
import type { WorldSetting } from "../content/geography/types";
import { stateHash } from "../core/random";
import { loadPrepared, savePrepared } from "../runtime/prepared-store";
export type ChunkRequest = {
  setting?: WorldSetting;
  generator?: 1 | 2 | 3;
  id: string;
  packId: string;
  seed: string;
  cx: number;
  cy: number;
};
let world: WorldModel | undefined;
let key = "";
self.onmessage = (
  event: MessageEvent<
    | ChunkRequest
    | TerrainRequest
    | {
        prepare: { pack: Pack; seed: string; key?: string };
      }
  >,
) => {
  if ("prepare" in event.data) {
    void prepare(event.data.prepare);
    return;
  }
  if (
    "pack" in event.data ||
    "region" in event.data ||
    "style" in event.data ||
    "previews" in event.data
  ) {
    handleTerrainRequest(event.data);
    return;
  }
  const { id, packId, seed, cx, cy, setting, generator } = event.data;
  try {
    const next = `${generator}:${packId}:${seed}:${setting ? stateHash(setting) : "v1"}`;
    if (next !== key) {
      if (!setting && !packs[packId]) throw Error("Unknown pack.");
      world = setting
        ? generator === 3
          ? createSettlementWorld(packForSetting(setting), seed)
          : createAtlasWorld(packForSetting(setting), seed)
        : createWorld(packs[packId], seed);
      key = next;
    }
    self.postMessage({ id, tiles: world!.chunk(cx, cy) });
  } catch {
    self.postMessage({ id, error: "Could not prepare this chunk." });
  }
};

/** The cache is read and written here, not on the main thread: either way the
 * whole settlement is structured-cloned, and that took 800ms of the start. */
async function prepare({ pack, seed, key: cacheKey }: { pack: Pack; seed: string; key?: string }) {
  try {
    const cached = cacheKey ? await loadPrepared(cacheKey).catch(() => undefined) : undefined;
    const { world: settlement, prepared } = prepareSettlement(pack, seed, cached);
    useTerrainWorld(settlement);
    self.postMessage({ prepared });
    if (cacheKey && !cached) void savePrepared(cacheKey, prepared);
  } catch (error) {
    self.postMessage({ error: String(error) });
  }
}
