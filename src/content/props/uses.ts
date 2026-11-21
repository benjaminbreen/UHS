import type { CharacterPose } from "../../render/characters/poses";
import { palaceProps } from "./palace";

const palace = (use: (d: (typeof palaceProps)[string]) => boolean) => Object.values(palaceProps).filter(use).map((d) => d.family);

/** Solid props you would really get up on. Everything else heavy is used, not climbed. */
export const climbable = new Set([
  "boulder", "crate", "crate-stack", "woodpile", "log-pile", "farm-cart", "hay-rick",
  "pallets", "mud-bricks", "grain-sacks", "coal-sacks", "oil-drum", "steel-drum",
  "granary-clay", "granary-mud", "granary-staddle", "granary-stilt", "dung-stack",
  "amphora-stack", "barrel", "threshing-floor", "midden", "shell-midden",
]);

export type Use = "attend" | "pound" | "grind" | "draw" | "stir" | "warm" | "sit" | "mat" | "relieve" | "pray" | "tend" | "weave" | "scrub" | "craft" | "collect" | "roost" | "milk" | "fodder";

const USE: Record<Exclude<Use, "attend">, { verb: string; pose: CharacterPose; minutes: number; families: string[] }> = {
  craft: { verb: "Work at", pose: "work-tend", minutes: 20, families: ["workbench"] },
  pound: { verb: "Pound", pose: "work-pound", minutes: 15, families: ["pounding-mortar", "anvil", "knapping-floor", "chopping-block", "trip-hammer", "grindstone"] },
  grind: { verb: "Grind at", pose: "work-grind", minutes: 20, families: ["quern", "metate", "grinder", "palace-quern"] },
  draw: { verb: "Draw water at", pose: "tug", minutes: 5, families: ["well", "framed-well", "town-well", "pump", "shaduf", "water-butt", "zir"] },
  stir: { verb: "Tend", pose: "work-stir", minutes: 15, families: ["cooking-pot", "oven", "tannur", "earth-oven", "stove", "dye-vats", "kiln", "bloomery"] },
  warm: { verb: "Warm yourself at", pose: "sit", minutes: 20, families: ["hearth", "camp-hearth", "communal-hearth", "three-stone-hearth", "council-fire", "long-fire", "brazier", "fire-basket"] },
  sit: { verb: "Sit on", pose: "sit-seat", minutes: 20, families: ["bench", "park-bench", "street-bench", "stool", "seat-log", "seat-stone", "charpoy", ...palace((d) => !!d.seat && d.family !== "palace-zabuton")] },
  mat: { verb: "Sit on", pose: "sit", minutes: 20, families: ["seat-mat", "palace-zabuton"] },
  relieve: { verb: "Use", pose: "sit-seat", minutes: 5, families: ["privy-shed", "privy-stone", "privy-outhouse", "privy-nightsoil", "privy-bench"] },
  pray: { verb: "Pray at", pose: "pray", minutes: 10, families: ["wayside-shrine", "standing-stone", "skull-post"] },
  tend: { verb: "Tend", pose: "work-tend", minutes: 15, families: ["trough", "stock-pen", "chicken-coop", "dovecote", "beehive", "log-hive", "pipe-hive"] },
  weave: { verb: "Work at", pose: "work-weave", minutes: 20, families: ["loom", "warp-loom", "backstrap-loom", "hide-frame", "lever-press", "palace-loom"] },
  collect: { verb: "Collect eggs from", pose: "work-tend", minutes: 5, families: ["nest-box"] },
  roost: { verb: "See to", pose: "work-tend", minutes: 2, families: ["hen-roost"] },
  milk: { verb: "Milk the cow at", pose: "work-tend", minutes: 15, families: ["byre-stall"] },
  fodder: { verb: "Fill", pose: "work-tend", minutes: 10, families: ["manger"] },
  scrub: { verb: "Wash at", pose: "work-scrub", minutes: 15, families: ["wash-tub", "tanning-pits"] },
};

const byFamily = new Map(
  Object.entries(USE).flatMap(([use, u]) => u.families.map((f) => [f, use as Exclude<Use, "attend">] as const)),
);

export function useOf(family: string | undefined) {
  const use = family ? byFamily.get(family) : undefined;
  return use && { use, ...USE[use] };
}
