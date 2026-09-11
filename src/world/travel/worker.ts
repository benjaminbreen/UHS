import { auditNaming } from "./naming-audit";
import { planTravel } from "./routing";
import type { TravelQuery } from "./types";
self.onmessage = ({
  data,
}: MessageEvent<{ id: number; query: TravelQuery; kind?: string }>) => {
  try {
    if (data.kind === "naming-audit")
      self.postMessage({ kind: data.kind, result: auditNaming() });
    else self.postMessage({ id: data.id, result: planTravel(data.query) });
  } catch (error) {
    self.postMessage({
      kind: data.kind,
      id: data.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
