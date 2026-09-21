import type { WorldSetting } from "../../geography/types";

/** Cloth and cross colours for the banner over a church door. */
export type ChurchBanner = { field: number; cross: number; note: string };

type BannerRule = {
  /** West, south, east, north degrees. */
  bounds: readonly [number, number, number, number];
  from: number;
  to: number;
  banners: ChurchBanner[];
};

const WHITE = 0xf2efe4,
  RED = 0xb3261e,
  GOLD = 0xe0b53c,
  BLUE = 0x27408b,
  BLACK = 0x1c1c1c,
  GREEN = 0x2f6b3a;

// Inferred, not surveyed: each takes the colours of the realm's arms or its
// best-known saint's cross for the period. First match wins, so narrower
// regions come first.
const rules: BannerRule[] = [
  {
    bounds: [-8, 54.6, -0.5, 61],
    from: 1100,
    to: 1600,
    banners: [{ field: BLUE, cross: WHITE, note: "St Andrew, Scotland" }],
  },
  {
    bounds: [-11, 51, -5.3, 55.5],
    from: 900,
    to: 1600,
    banners: [{ field: GREEN, cross: GOLD, note: "Irish church" }],
  },
  {
    bounds: [-6, 49.8, 2, 55.8],
    from: 1190,
    to: 1600,
    banners: [
      { field: WHITE, cross: RED, note: "St George, England" },
      { field: RED, cross: GOLD, note: "Plantagenet arms" },
    ],
  },
  {
    bounds: [2.3, 50.6, 7.3, 53.7],
    from: 1100,
    to: 1600,
    banners: [
      { field: GOLD, cross: BLACK, note: "Flanders" },
      { field: GOLD, cross: RED, note: "Holland" },
    ],
  },
  {
    bounds: [4, 54, 31, 71],
    from: 1219,
    to: 1600,
    banners: [{ field: RED, cross: WHITE, note: "Dannebrog and its kin" }],
  },
  {
    bounds: [-9.6, 36, -6, 42.2],
    from: 1139,
    to: 1600,
    banners: [{ field: WHITE, cross: BLUE, note: "Portugal" }],
  },
  {
    bounds: [-9.6, 36, 3.4, 43.8],
    from: 1000,
    to: 1600,
    banners: [
      { field: RED, cross: GOLD, note: "Castile" },
      { field: GOLD, cross: RED, note: "Aragon" },
    ],
  },
  {
    bounds: [-5, 42.3, 6, 51.1],
    from: 1150,
    to: 1600,
    banners: [
      { field: BLUE, cross: GOLD, note: "France ancient" },
      { field: WHITE, cross: RED, note: "Crusader cross" },
    ],
  },
  {
    bounds: [6.6, 36.5, 18.6, 46.6],
    from: 1000,
    to: 1600,
    banners: [
      { field: WHITE, cross: RED, note: "Genoa, Milan and the communes" },
      { field: RED, cross: GOLD, note: "Papal colours" },
    ],
  },
  {
    bounds: [14, 49, 24.2, 54.9],
    from: 1000,
    to: 1600,
    banners: [{ field: RED, cross: WHITE, note: "Poland" }],
  },
  {
    bounds: [5.8, 45.8, 19, 55],
    from: 1000,
    to: 1600,
    banners: [
      { field: GOLD, cross: BLACK, note: "The Empire" },
      { field: WHITE, cross: BLACK, note: "Teutonic cross" },
    ],
  },
];

const fallback: ChurchBanner[] = [
  { field: RED, cross: GOLD, note: "Generic Latin church" },
  { field: BLUE, cross: WHITE, note: "Marian colours" },
];

/** `pick` is any number in [0, 1); the same town always gets the same banner. */
export function churchBanner(
  setting: WorldSetting,
  pick: number,
): ChurchBanner {
  const rule = rules.find(
    ({ bounds: [w, s, e, n], from, to }) =>
      setting.lon >= w &&
      setting.lon <= e &&
      setting.lat >= s &&
      setting.lat <= n &&
      setting.year >= from &&
      setting.year <= to,
  );
  const options = rule?.banners ?? fallback;
  return options[Math.floor(pick * options.length) % options.length];
}
