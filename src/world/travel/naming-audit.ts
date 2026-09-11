import { travelLocations } from "../../content/geography/travel";
import { cellAt, cellPoint, isWater } from "./geography";
import { resolveGeographicName } from "./naming";

export function auditNaming() {
  const ids = new Set(travelLocations.map(cellAt));
  for (let i = 0; i < 2048; i++)
    ids.add(
      cellAt({
        lon: ((i * 137.507764) % 360) - 180,
        lat: (Math.asin(1 - (2 * (i + 0.5)) / 2048) * 180) / Math.PI,
      }),
    );
  const samples = [...ids].sort().map((id) => {
    const point = cellPoint(id),
      water = isWater(point);
    return { id, ...point, water, ...resolveGeographicName(point, water) };
  });
  const counts = { specific: 0, broad: 0, missing: 0 };
  for (const s of samples) counts[s.coverage]++;
  return {
    samples,
    counts,
    method:
      "2,048 equal-area globe samples plus catalog anchors, snapped to distinct routing cells. Coverage measures labels, not historical accuracy.",
  };
}
export type NamingAudit = ReturnType<typeof auditNaming>;
