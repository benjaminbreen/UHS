import { fairs } from "../fairs";
import type { PropDef } from "./catalog";

/** What a fair or a palace shows, as props: each find is a thing with an act of its own (look closely, listen,
 * buy a plate, sign the book), so the same thing can stand in any room or street. */
export const exhibitProps: Record<string, PropDef> = Object.fromEntries(fairs.flatMap((fair) => fair.finds).map((f) => [`exhibit-${f.id}`, {
  name: f.name,
  family: "exhibit",
  act: {
    verb: f.verb, text: f.text, minutes: Math.max(1, Math.round((f.time ?? 60) / 60)), price: f.price, heal: f.heal, once: !f.keeps && !f.price, told: f.tier === "common" ? "action" : "world",
    gives: f.loot && Object.fromEntries(Object.entries(f.loot).map(([k, n]) => [k, typeof n === "number" ? n : n[0]])),
  },
} satisfies PropDef]));
