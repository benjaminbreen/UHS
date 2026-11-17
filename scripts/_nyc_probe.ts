import { panelSetting } from "./review/panel";
import { createSettingSession } from "../src/runtime/session";
for (const year of [1946]) {
  const e: any = createSettingSession({ ...panelSetting("city-new-york", year), settlement: "city", season: "spring" } as any, "probe");
  const w = e.state?.world ?? e.world ?? e.getState?.().world;
  const bs = w.buildings ?? w.structures ?? [];
  const tally: Record<string, number> = {};
  for (const b of bs) { const f = b.frame ?? b.model ?? b.kind; tally[f] = (tally[f] ?? 0) + 1; }
  console.log(year, bs.length, Object.entries(tally).sort((a,b)=>b[1]-a[1]));
  if (!bs.length) console.log(Object.keys(w));
}
