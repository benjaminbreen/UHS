import { createWorld } from "./generate";
import { packs } from "../content/packs";
import type { WorldModel } from "../core/types";
import { createSettlementWorld } from "./v3/generate";
import { createAtlasWorld } from "./v2/generate";
import { packForSetting } from "../content/geography/pack";
import type { WorldSetting } from "../content/geography/types";
import { stateHash } from "../core/random";
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
self.onmessage = (event: MessageEvent<ChunkRequest>) => {
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
