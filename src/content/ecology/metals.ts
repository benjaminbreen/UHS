import type { ItemDef, ItemId } from "../../core/types";
import { random } from "../../core/random";

export type Metal = "copper" | "tin" | "iron" | "silver" | "gold";
export type OreGrade = "poor" | "fair" | "rich";

/** First year a metal was worked from ore (negative is BCE). Documented in
 * outline; the regional dates vary by millennia and are smoothed here.
 * Before them a vein is only coloured stone to whoever breaks it. */
const WORKED: Record<Metal, number> = {
  gold: -5000,
  copper: -5000,
  silver: -3500,
  tin: -3000,
  iron: -1200,
};
/** Share of ore rocks carrying each metal. Inferred from how common the
 * workable ores are, not from any one field. */
const SHARE: [Metal, number][] = [
  ["iron", 0.42],
  ["copper", 0.32],
  ["tin", 0.1],
  ["silver", 0.1],
  ["gold", 0.06],
];
const VALUE: Record<Metal, number> = { copper: 6, tin: 9, iron: 5, silver: 20, gold: 45 };
const GRADES: OreGrade[] = ["poor", "fair", "rich"];
const YIELD: Record<OreGrade, number> = { poor: 1, fair: 2, rich: 3 };

export const oreId = (metal: Metal, grade: OreGrade) =>
  grade === "fair" ? `${metal}-ore` : `${metal}-ore-${grade}`;

export const metalItems: Record<ItemId, ItemDef> = Object.fromEntries([
  ...SHARE.flatMap(([metal]) =>
    GRADES.map((grade): [string, ItemDef] => {
      const id = oreId(metal, grade);
      const name = `${grade === "fair" ? "" : `${grade[0].toUpperCase()}${grade.slice(1)} `}${metal} ore`;
      return [
        id,
        {
          id,
          name: name[0].toUpperCase() + name.slice(1),
          sprite: "rock-1",
          value: Math.round(VALUE[metal] * { poor: 0.5, fair: 1, rich: 2 }[grade]),
          description: `${grade === "rich" ? "Heavy with metal." : grade === "poor" ? "More rock than metal." : "Worth smelting."}`,
        },
      ];
    }),
  ),
  [
    "torch",
    {
      id: "torch",
      name: "Lit torch",
      sprite: "ecology-branches",
      value: 0,
      hand: { strike: true },
      description: "A stick lit at a fire. It burns down, and it sets alight what it touches.",
    },
  ],
]);

/** The metal in the boulder at a cell, if any and if anyone yet works it.
 * Fixed by the world seed, so the same rock is the same vein on every visit. */
export function oreAt(seed: string, x: number, y: number, year: number) {
  if (random(seed, "ore", x, y) > 0.14) return undefined;
  let roll = random(seed, "ore-metal", x, y);
  const metal = SHARE.find(([, share]) => (roll -= share) < 0)?.[0] ?? "iron";
  if (year < WORKED[metal]) return undefined;
  const g = random(seed, "ore-grade", x, y);
  const grade: OreGrade = g < 0.35 ? "poor" : g < 0.85 ? "fair" : "rich";
  return { metal, grade, item: oreId(metal, grade), yield: YIELD[grade] };
}

/** Game seconds a burning cell keeps burning, by what stands on it. */
export const BURN_SECONDS = { large: 900, medium: 600, small: 360, shrub: 180, grass: 90, none: 0 } as const;
/** Game seconds a building burns, by what its walls are made of. */
export const BUILDING_BURN = { timber: 2400, earth: 1200, masonry: 1200 } as const;
/** Game seconds a lit torch lasts. */
export const TORCH_SECONDS = 1800;
