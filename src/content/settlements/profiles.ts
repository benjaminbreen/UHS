import type { WorldSetting } from "../geography/types";
export const patterns = [
  "farmstead",
  "clustered",
  "roadside",
  "dense",
  "planned",
  "waterfront",
] as const;
export type Pattern = (typeof patterns)[number];
export type SettlementProfile = {
  pattern: Pattern;
  buildings: number;
  radius: number;
  frontage: number;
  plaza: "court" | "common" | "market";
  fields: "household" | "grouped" | "strips" | "none";
  livestock: boolean;
  paved: boolean;
};
const profiles: Record<Pattern, SettlementProfile> = {
  farmstead: {
    pattern: "farmstead",
    buildings: 5,
    radius: 70,
    frontage: 15,
    plaza: "court",
    fields: "grouped",
    livestock: true,
    paved: false,
  },
  clustered: {
    pattern: "clustered",
    buildings: 14,
    radius: 92,
    frontage: 12,
    plaza: "common",
    fields: "household",
    livestock: true,
    paved: false,
  },
  roadside: {
    pattern: "roadside",
    buildings: 16,
    radius: 100,
    frontage: 13,
    plaza: "common",
    fields: "strips",
    livestock: true,
    paved: false,
  },
  dense: {
    pattern: "dense",
    buildings: 38,
    radius: 78,
    frontage: 8,
    plaza: "market",
    fields: "none",
    livestock: false,
    paved: true,
  },
  planned: {
    pattern: "planned",
    buildings: 36,
    radius: 90,
    frontage: 11,
    plaza: "market",
    fields: "none",
    livestock: false,
    paved: true,
  },
  waterfront: {
    pattern: "waterfront",
    buildings: 28,
    radius: 90,
    frontage: 11,
    plaza: "market",
    fields: "none",
    livestock: false,
    paved: true,
  },
};
export function settlementProfile(
  s: WorldSetting,
  home = true,
): SettlementProfile {
  const pattern: Pattern =
    s.settlementPattern ??
    (s.settlement === "farm"
      ? "farmstead"
      : s.settlement === "port"
        ? "waterfront"
        : s.settlement === "city"
          ? s.architecture === "classical" || s.architecture === "courtyard"
            ? "planned"
            : "dense"
          : s.placeId === "normandy"
            ? "roadside"
            : "clustered");
  const p = { ...profiles[pattern] };
  if (!home) {
    p.buildings = Math.min(p.buildings, 8);
    p.radius = 74;
    p.fields = s.year >= -9999 ? "grouped" : "none";
    p.livestock = s.year >= -9999;
  }
  if (s.settlement === "camp") {
    p.buildings = 4;
    p.radius = 54;
    p.plaza = "court";
    p.fields = "none";
    p.livestock = false;
    p.paved = false;
  }
  if (s.year < -9999) {
    p.fields = "none";
    p.livestock = false;
    p.paved = false;
  }
  return p;
}
