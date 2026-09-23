import type { WorldSetting } from "../../geography/types";

/** How far down a premodern town's streets the stone goes. `none` is earth
 * throughout; `square` paves only the square and civic forecourts; `main` adds
 * the main street; `streets` paves every street, leaving the back lanes. */
export type PavingReach = "none" | "square" | "main" | "streets";

type Scope = {
  bounds: readonly [number, number, number, number];
  from: number;
  to: number;
  reach: PavingReach;
};

/** Educated guesses from the paving record, first match wins. Most premodern
 * streets anywhere were beaten earth; stone followed empire, civic wealth and,
 * from the late middle ages, municipal paving ordinances. All inferred. */
const scopes: readonly Scope[] = [
  // Pompeii and Rome: lava-block paving on nearly every street.
  { bounds: [6, 36, 19, 47], from: -300, to: 450, reach: "streets" },
  // Roman provincial towns paved their decumanus and forum.
  { bounds: [-10, 30, 42, 56], from: -100, to: 450, reach: "main" },
  { bounds: [26, 39, 31, 42], from: 330, to: 1453, reach: "main" },
  // Low Countries brick streets.
  { bounds: [3, 50, 8, 54], from: 1550, to: 1900, reach: "streets" },
  // Timber towns of the Baltic and Rus' planked nearly every street.
  { bounds: [4, 54, 60, 66], from: 900, to: 1750, reach: "streets" },
  // Ottoman, Levantine, Mesopotamian and Iranian towns: earth lanes, stone at
  // the mosque court, bazaar or khan.
  { bounds: [26, 10, 75, 42], from: 450, to: 1860, reach: "square" },
  { bounds: [-18, 10, 26, 37], from: 450, to: 1860, reach: "square" },
  // Latin Europe: London's first paving grants 1300s, general paving acts 1700s.
  { bounds: [-12, 35, 45, 72], from: 450, to: 1250, reach: "none" },
  { bounds: [-12, 35, 45, 72], from: 1250, to: 1550, reach: "square" },
  { bounds: [-12, 35, 45, 72], from: 1550, to: 1750, reach: "main" },
  { bounds: [-12, 35, 45, 72], from: 1750, to: 1900, reach: "streets" },
  // Chang'an and Kaifeng were rammed earth; Ming and Qing towns laid slab.
  { bounds: [97, 18, 125, 45], from: -1000, to: 1368, reach: "square" },
  { bounds: [97, 18, 125, 45], from: 1368, to: 1900, reach: "main" },
  // Edo, Kyoto and Hanseong streets stayed earth until the Meiji era.
  { bounds: [124, 30, 146, 46], from: -1000, to: 1870, reach: "none" },
  { bounds: [60, 5, 97, 37], from: 1550, to: 1860, reach: "square" },
  // Plastered causeways and plazas of Tenochtitlan and the Maya sacbeob.
  { bounds: [-118, 8, -82, 25], from: -600, to: 1521, reach: "main" },
  // Inca Cusco's stone-paved streets with central channels.
  { bounds: [-82, -35, -60, 5], from: 1400, to: 1533, reach: "main" },
];

export function pavingReach(s: WorldSetting): PavingReach {
  for (const p of scopes) {
    const [w, south, e, n] = p.bounds;
    if (
      s.year >= p.from &&
      s.year < p.to &&
      s.lon >= w &&
      s.lon <= e &&
      s.lat >= south &&
      s.lat <= n
    )
      return p.reach;
  }
  return s.year >= 1860 ? "main" : "none";
}

/** Whether carts cut ruts here. The Americas had no draught animals before
 * 1500, and carts stayed rare south of the Sahel until the colonial era. */
export function wheeledTraffic(s: WorldSetting): boolean {
  if (s.year < -3000) return false;
  if (s.lon < -30) return s.year >= 1520;
  if (s.lat < 12 && s.lon > -20 && s.lon < 52) return s.year >= 1850;
  return true;
}
