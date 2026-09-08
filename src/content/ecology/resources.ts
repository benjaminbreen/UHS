import type { ItemDef } from "../../core/types";
export const ecologicalItems: Record<string, ItemDef> = {
  fruit: {
    id: "fruit",
    name: "Wild fruit",
    sprite: "ecology-fruit-item",
    value: 1,
    edible: 18,
  },
  berries: {
    id: "berries",
    name: "Berries",
    sprite: "ecology-berries-item",
    value: 1,
    edible: 12,
  },
  reeds: { id: "reeds", name: "Reeds", sprite: "reeds", value: 1 },
  fodder: { id: "fodder", name: "Forage", sprite: "ecology-grazing", value: 1 },
};
