import {
  handleTerrainRequest,
  useTerrainWorld,
  type TerrainRequest,
} from "../render/terrain-worker";
import { createWorld } from "./generate";
import { packs } from "../content/packs";
import type { WorldModel } from "../core/types";
import { createSettlementWorld, prepareSettlement } from "./v3/generate";
import { createAtlasWorld } from "./v2/generate";
import { packForSetting } from "../content/geography/pack";
import type { WorldSetting } from "../content/geography/types";
import { stateHash } from "../core/random";
import { loadPrepared, preparedKey, savePrepared } from "../runtime/prepared-store";
import { withTravelWaterways, type TravelWaterwayInputs } from "./travel/waterways";
import type { PreparedSettlement } from "./v3/prepared";
import { shrinkCaches } from "../core/cache";
export type WorldPreparationRequest = {
  prepare: { setting: WorldSetting; seed: string; cachePrepared: boolean; retire: boolean; waterways?: TravelWaterwayInputs };
};
export type WorldPreparationResult = { prepared: PreparedSettlement; playableMap?: WorldSetting["playableMap"] };
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
    | WorldPreparationRequest
    | { shrinkCaches: true }
  >,
) => {
  if ("shrinkCaches" in event.data) return shrinkCaches();
  if ("prepare" in event.data) {
    void prepare(event.data.prepare);
    return;
  }
  if (
    "pack" in event.data ||
    "region" in event.data ||
    "style" in event.data ||
    "previews" in event.data ||
    "warm" in event.data
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
async function prepare({ setting, seed, cachePrepared, retire, waterways }: WorldPreparationRequest["prepare"]) {
  try {
    const recipe = cachePrepared && waterways ? preparedKey(setting, seed, waterways) : undefined;
    const hit = recipe ? await loadPrepared(recipe, true).catch(() => undefined) : undefined;
    const playableMap = waterways
      ? hit?.playableMap ?? withTravelWaterways(setting.playableMap!, waterways)
      : undefined;
    if (playableMap) setting.playableMap = playableMap;
    const cacheKey = hit?.key ?? (cachePrepared ? preparedKey(setting, seed) : undefined);
    const cached = hit ?? (cacheKey ? await loadPrepared(cacheKey).catch(() => undefined) : undefined);
    const { world: settlement, prepared } = prepareSettlement(packForSetting(setting), seed, cached?.prepared);
    useTerrainWorld(settlement);
    const entry = cacheKey && (!cached || (recipe && cached.recipe !== recipe))
      ? { key: cacheKey, prepared, recipe, playableMap }
      : undefined;
    // A phone terminates this worker on receipt; finish its cache transaction first.
    if (retire && entry) await savePrepared(entry);
    self.postMessage({ prepared, playableMap } satisfies WorldPreparationResult);
    if (!retire && entry) void savePrepared(entry);
  } catch (error) {
    self.postMessage({ error: String(error) });
  }
}
