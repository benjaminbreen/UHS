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
  meat: {
    id: "meat",
    name: "Raw meat",
    sprite: "meat",
    value: 4,
    edible: 14,
    health: -6,
  },
  "cooked-meat": {
    id: "cooked-meat",
    name: "Cooked meat",
    sprite: "cooked-meat",
    value: 6,
    edible: 40,
    health: 12,
  },
  hide: { id: "hide", name: "Raw hide", sprite: "hide", value: 6 },
  feathers: { id: "feathers", name: "Feathers", sprite: "feathers", value: 1 },
  fodder: { id: "fodder", name: "Forage", sprite: "ecology-grazing", value: 1 },
};
