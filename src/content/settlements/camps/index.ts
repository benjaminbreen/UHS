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
      return { ...pastoralTent(setting), role: "Shepherd", activity: "Tending animals", formation: "ring", supplies: "Household provisions" } as const;
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

/** The herders' tent of the region: black goat or yak hair in the deserts and
 * on the Tibetan plateau, hide cones in the far north and on the Plains,
 * felt on the steppe. */
function pastoralTent({ lon, lat, culture }: WorldSetting) {
  const black =
    (lon >= -17 && lon <= 60 && lat >= 14 && lat < 38 && culture !== "european") ||
    (lon >= 78 && lon <= 103 && lat >= 28 && lat <= 38);
  if (black)
    return {
      style: "goat-hair",
      label: "Black tent",
      description:
        "A small herding camp of long tents woven from goat or yak hair, open to the front by day. An illustrative camp, not a particular lineage's.",
    } as const;
  if (lat >= 60 || (culture === "other-indigenous-american" && lon > -115 && lon < -94 && lat > 30 && lat < 54))
    return {
      style: "cone",
      label: "Hide tent",
      description:
        "A small camp of cone tents of poles and hides round their hearths. An illustrative camp, not a particular band's.",
    } as const;
  return {
    style: "felt",
    label: "Felt tent",
    description:
      "A small mobile pastoral camp with felt shelters and a flock. This is an illustrative Eurasian pastoral interpretation.",
  } as const;
}
