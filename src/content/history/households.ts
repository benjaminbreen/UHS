import type { WorldSetting } from "../geography/types";
import { capabilitiesFor } from "../characters/resolve";

/**
 * How households formed here, for the years: who stays home on marrying, who
 * keeps the house, the ages people married at, whether a rich man took more
 * wives, and whether the young left to work first. Coarse regional defaults
 * after Hajnal's European marriage pattern and Murdock's Ethnographic Atlas.
 */
type Box = readonly [number, number, number, number];
const inBox = (s: WorldSetting, ...boxes: Box[]) => boxes.some((b) => s.lon >= b[0] && s.lat >= b[1] && s.lon <= b[2] && s.lat <= b[3]);

// Haudenosaunee and their neighbours; the Pueblos and Navajo; Minangkabau; Khasi; Malabar's matrilineal houses (tharavad).
const MATRILOCAL: { box: Box; to: number }[] = [
  { box: [-82, 40, -72, 46], to: 1850 },
  { box: [-114, 32, -104, 38], to: 1950 },
  { box: [99, -2, 102.5, 1], to: 10000 },
  { box: [90.5, 25, 92.5, 26.3], to: 10000 },
  { box: [74.8, 8.2, 77.4, 12.8], to: 1930 },
];
// Hajnal's line runs roughly Trieste to St Petersburg; west of it people married late and the young went into service.
const HAJNAL: Box = [-11, 43, 25, 71];
const NUCLEAR: Box = [-11, 47, 8, 61];
const WEST: Box[] = [[-12, 35, 45, 72], [-130, 24, -52, 60], [110, -48, 180, -10]];
const MONGOLIA: Box = [87, 41, 122, 53];
const SUB_SAHARAN: Box = [-18, -35, 52, 17];
const EARLY: Box[] = [[60, 5, 98, 36], [98, 18, 125, 42], [-18, -35, 60, 37], [-10, 30, 45, 42]];

export type Ways = {
  /** Who brings a spouse home: sons, daughters, or nobody, every couple setting up its own house. */
  stays: "son" | "daughter" | "none";
  /** Which of those keeps the house. */
  heir: "eldest" | "youngest";
  marries: { female: readonly [number, number]; male: readonly [number, number] };
  wives: number;
  /** Why the unmarried young left home, if they did. */
  leaves?: (sex: "male" | "female" | undefined) => string;
  /** How the household lived, for the year's lines. */
  living: "market" | "farm" | "herd" | "forage";
};

export function householdWays(s: WorldSetting, role: string): Ways {
  const y = s.year;
  const west = inBox(s, ...WEST);
  const stays = MATRILOCAL.some((m) => y < m.to && inBox(s, m.box)) ? "daughter"
    : (y >= 1920 && west) || (y >= 1500 && inBox(s, NUCLEAR) && !/farm|peasant|plough|husband/i.test(role)) ? "none"
    : "son";
  const marries = y >= 1950 ? { female: [19, 30], male: [21, 33] } as const
    : y >= 1500 && inBox(s, HAJNAL) ? { female: [22, 32], male: [24, 35] } as const
    : inBox(s, ...EARLY) || (y < 500 && inBox(s, [-10, 30, 45, 46])) ? { female: [14, 22], male: [17, 30] } as const
    : { female: [16, 26], male: [19, 32] } as const;
  const leaves = y >= 1950 || (y >= 1850 && west) ? () => "to find work"
    : y >= 1500 && inBox(s, HAJNAL) ? (sex: "male" | "female" | undefined) => (sex === "female" ? "to go into service" : "to learn a trade")
    : (s.settlement === "city" || s.settlement === "port") && y >= 1700 ? () => "to find work"
    : undefined;
  const can = capabilitiesFor(s);
  const markets = can.has("market_exchange") || can.has("coinage") || can.has("urban_settlement");
  const living = /herd|shepherd|goat|cattle|camel|reindeer|yak|drover|nomad|pastoral/i.test(role) ? "herd"
    : /farm|peasant|cultiv|plough|rice|field|grower|gardener|crofter|cottar|tenant/i.test(role) ? "farm"
    : markets ? "market" : /forag|hunt|gather|fowler|fish|trapper|travel/i.test(role) || !can.has("settled_agriculture") ? "forage" : "farm";
  return {
    stays, marries, leaves, living,
    heir: inBox(s, MONGOLIA) ? "youngest" : "eldest",
    wives: y < 1960 && inBox(s, SUB_SAHARAN) ? 3 : 1,
  };
}
