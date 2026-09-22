import { propDefs } from "../../content/props/catalog";
import type { WorldObject } from "../types";

export function ageObject(object: WorldObject, yearsAbandoned: number): WorldObject | undefined {
  const next = structuredClone(object);
  if (yearsAbandoned <= 0) return next;
  if (object.kind === "fire" || object.kind === "door") return undefined;
  const material = propDefs[object.prop ?? ""]?.breakable;
  if (!material) return undefined;
  const survives = { clay: 500, glaze: 600, wood: 55, fiber: 15, metal: 240, plastic: 350, paper: 5 }[material];
  if (yearsAbandoned >= survives) return undefined;
  next.inventory = {};
  next.broken = true;
  next.damage = 1;
  next.description = "Fragments left behind when this site fell out of use.";
  return next;
}
