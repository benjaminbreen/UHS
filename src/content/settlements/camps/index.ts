import type { WorldSetting } from "../../geography/types";

export function campKit(setting: WorldSetting) {
  switch (setting.situation?.camp) {
    case "military":
      return {
        style: setting.year < 500 ? "leather" : "canvas",
        label: "Soldiers' tent",
        role: setting.year < 500 ? "Legionary" : "Soldier",
        activity: "Camp duties",
        formation: "rows",
        supplies: "Camp stores",
        description:
          "A temporary military camp with ordered tent streets and a guarded perimeter. An illustrative layout, not a reconstruction of a particular unit.",
      } as const;
    case "expedition":
      return {
        style: setting.year < 1970 ? "canvas" : "dome",
        label: "Expedition tent",
        role: "Mountaineer",
        activity: "Preparing equipment",
        formation: "clusters",
        supplies: "Expedition supplies",
        description:
          "Portable shelters, shared supplies and a sheltered working area. The tent materials follow the chosen date.",
      } as const;
    case "pastoral":
      return {
        style: "felt",
        label: "Felt tent",
        role: "Shepherd",
        activity: "Tending animals",
        formation: "ring",
        supplies: "Household provisions",
        description:
          "A small mobile pastoral camp with felt shelters and a flock. This is an illustrative Eurasian pastoral interpretation.",
      } as const;
    default:
      return {
        style: "brush",
        label: "Temporary shelter",
        role: "Gatherer",
        activity: "Gathering by the fire",
        formation: "ring",
        supplies: "Shared provisions",
        description:
          "Branch and mat shelters around a shared hearth. An illustrative seasonal gathering, not an attribution to a named people.",
      } as const;
  }
}
