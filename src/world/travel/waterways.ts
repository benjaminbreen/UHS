import { createRegionalContext } from "../regional/context";
import { createEnvironment } from "../v3/environment";
import type { WorldSetting } from "../../content/geography/types";
import { trimCache } from "../../core/cache";

export { edgePoint } from "./water-edges";
import {
  edgePoint,
  outward,
  type EdgeRange,
  type WaterCrossing,
} from "./water-edges";
const fields = new Map<string, ReturnType<typeof createEnvironment>>();
function native(setting: WorldSetting, id: string) {
  const key = JSON.stringify([
    id,
    setting.year,
    setting.environment,
    setting.water,
  ]);
  let land = fields.get(key);
  if (!land) {
    const s = {
      ...setting,
      ecologyRevision: 2 as const,
      hydrologyRevision: 3 as const,
      playableMap: undefined,
    };
    land = createEnvironment(
      s,
      `travel-review:${id}`,
      createRegionalContext(s),
    );
    trimCache(fields, 16);
    fields.set(key, land);
  }
  return land;
}
export function edgeCrossings(
  setting: WorldSetting,
  id: string,
  size: number,
  edge: EdgeRange,
): WaterCrossing[] {
  const land = native(setting, id),
    result: WaterCrossing[] = [];
  const length = (size - 1) * (edge.end - edge.start);
  const count = Math.max(2, Math.ceil(length));
  let start = -1,
    flow = 0;
  const normal = outward(edge.side);
  for (let i = 0; i <= count + 1; i++) {
    const f =
      i <= count ? land.sample(...edgePoint(size, edge, i / count)) : undefined;
    const wet = f && f.kind !== "sea" && f.water < 0;
    if (wet) {
      if (start < 0) {
        start = i;
        flow = 0;
      }
      flow +=
        (f.waterFlow?.[0] ?? 0) * normal[0] +
        (f.waterFlow?.[1] ?? 1) * normal[1];
    } else if (start >= 0) {
      result.push({
        at: (start + i - 1) / (2 * count),
        width: Math.max(1.25 / length, (i - start + 1) / (2 * count)),
        flow: Math.sign(flow) || 1,
      });
      start = -1;
    }
  }
  return result;
}
export function sharedCrossings(
  a: WaterCrossing[],
  b: WaterCrossing[],
): WaterCrossing[] {
  const result: WaterCrossing[] = [];
  for (const p of [...a, ...b.map((p) => ({ ...p, flow: -p.flow }))].sort(
    (a, b) => a.at - b.at,
  )) {
    const last = result.at(-1);
    if (
      last &&
      Math.abs(last.at - p.at) < Math.max(0.04, last.width + p.width)
    ) {
      const lo = Math.min(last.at - last.width, p.at - p.width);
      const hi = Math.max(last.at + last.width, p.at + p.width);
      if (p.width > last.width) last.flow = p.flow;
      last.at = (lo + hi) / 2;
      last.width = (hi - lo) / 2;
    } else result.push({ ...p });
  }
  return result;
}
