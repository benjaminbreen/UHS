import type { WorldSetting } from "../../geography/types";
import { modernity } from "../modernity";

/** How a place's crossings were controlled at a date: which signal stands at
 * the busy ones and which sign at the quiet ones, as sprite variants of
 * `traffic-signal` (0 interwar post-top, 1 postwar yellow, 2 modern black)
 * and `traffic-sign` (0 stop octagon, 1 give-way triangle, 2 Japanese stop).
 * The first electric signals were American, from about 1920; Europe followed
 * in the thirties and most of the world after the war. */
export type TrafficControl = { signal?: 0 | 1 | 2; sign?: 0 | 1 | 2 };

type Stage = { from: number; signal: 0 | 1 | 2 }[];
const signals: Record<string, Stage> = {
  "north-america": [
    { from: 1920, signal: 0 },
    { from: 1950, signal: 1 },
    { from: 1995, signal: 2 },
  ],
  britain: [
    { from: 1930, signal: 0 },
    { from: 1960, signal: 2 },
  ],
  "western-europe": [
    { from: 1930, signal: 0 },
    { from: 1960, signal: 2 },
  ],
  "eastern-europe": [{ from: 1950, signal: 2 }],
  japan: [{ from: 1950, signal: 2 }],
  australasia: [
    { from: 1935, signal: 0 },
    { from: 1965, signal: 2 },
  ],
};

/** The poles that carry power and telephone along a country road: spun
 * concrete where that was the practice (1), creosoted timber elsewhere (0). */
export function poleStyle(s: WorldSetting): 0 | 1 {
  return ["japan", "latin-america", "eastern-europe", "east-asia", "south-asia", "southeast-asia"].includes(
    modernity(s).id,
  )
    ? 1
    : 0;
}

export function trafficControl(s: WorldSetting): TrafficControl {
  const id = modernity(s).id;
  const stage = (signals[id] ?? [{ from: 1965, signal: 2 }])
    .filter((st) => s.year >= st.from)
    .at(-1);
  const sign =
    id === "north-america" || id === "latin-america"
      ? s.year >= 1925 ? 0 : undefined
      : id === "japan"
        ? s.year >= 1960 ? 2 : undefined
        : id === "britain" || id === "western-europe" || id === "eastern-europe" || id === "australasia"
          ? s.year >= 1960 ? 1 : undefined
          : s.year >= 1970 ? 0 : undefined;
  return { signal: stage?.signal, sign };
}
