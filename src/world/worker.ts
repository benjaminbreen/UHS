import { createWorld } from "./generate";
import { packs } from "../content/packs";
import type { WorldModel } from "../core/types";
export type ChunkRequest = {
  id: string;
  packId: string;
  seed: string;
  cx: number;
  cy: number;
};
let world: WorldModel | undefined;
let key = "";
self.onmessage = (event: MessageEvent<ChunkRequest>) => {
  const { id, packId, seed, cx, cy } = event.data;
  try {
    const next = `${packId}:${seed}`;
    if (next !== key) {
      if (!packs[packId]) throw Error("Unknown pack.");
      world = createWorld(packs[packId], seed);
      key = next;
    }
    self.postMessage({ id, tiles: world!.chunk(cx, cy) });
  } catch {
    self.postMessage({ id, error: "Could not prepare this chunk." });
  }
};
