import type { CharacterPose } from "../../render/characters/poses";

/** Solid props you would really get up on. Everything else heavy is used, not climbed. */
export const climbable = new Set([
  "boulder", "crate", "crate-stack", "woodpile", "log-pile", "farm-cart", "hay-rick",
  "pallets", "mud-bricks", "grain-sacks", "coal-sacks", "oil-drum", "steel-drum",
  "granary-clay", "granary-mud", "granary-staddle", "granary-stilt", "dung-stack",
  "amphora-stack", "barrel", "threshing-floor", "midden", "shell-midden",
]);

export type Use = "pound" | "grind" | "draw" | "stir" | "warm" | "sit" | "pray" | "tend" | "weave" | "scrub";

const USE: Record<Use, { verb: string; pose: CharacterPose; minutes: number; families: string[] }> = {
  pound: { verb: "Pound", pose: "work-pound", minutes: 15, families: ["pounding-mortar", "anvil", "knapping-floor", "chopping-block", "trip-hammer", "grindstone"] },
  grind: { verb: "Grind at", pose: "work-grind", minutes: 20, families: ["quern", "metate", "grinder"] },
  draw: { verb: "Draw water at", pose: "tug", minutes: 5, families: ["well", "framed-well", "town-well", "pump", "shaduf", "water-butt", "zir"] },
  stir: { verb: "Tend", pose: "work-stir", minutes: 15, families: ["cooking-pot", "oven", "tannur", "earth-oven", "stove", "dye-vats", "kiln", "bloomery"] },
  warm: { verb: "Warm yourself at", pose: "sit", minutes: 20, families: ["hearth", "camp-hearth", "communal-hearth", "three-stone-hearth", "council-fire", "long-fire", "brazier", "fire-basket"] },
  sit: { verb: "Sit on", pose: "sit", minutes: 20, families: ["bench", "stool", "seat-log", "seat-mat", "seat-stone", "charpoy", "privy-bench"] },
  pray: { verb: "Pray at", pose: "talk", minutes: 10, families: ["wayside-shrine", "standing-stone", "skull-post"] },
  tend: { verb: "Tend", pose: "work-tend", minutes: 15, families: ["trough", "stock-pen", "chicken-coop", "dovecote", "beehive", "log-hive", "pipe-hive"] },
  weave: { verb: "Work at", pose: "work-weave", minutes: 20, families: ["loom", "warp-loom", "backstrap-loom", "hide-frame", "lever-press"] },
  scrub: { verb: "Wash at", pose: "work-scrub", minutes: 15, families: ["wash-tub", "tanning-pits"] },
};

const byFamily = new Map(
  Object.entries(USE).flatMap(([use, u]) => u.families.map((f) => [f, use as Use] as const)),
);

export function useOf(family: string | undefined) {
  const use = family ? byFamily.get(family) : undefined;
  return use && { use, ...USE[use] };
}
