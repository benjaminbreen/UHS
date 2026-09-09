import type { WorldSetting } from "../geography/types";
import { urbanized, urbanForm } from "./urban-form";
import { farms } from "../geography/onsets";
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
  // A pinned or player-chosen pattern still cannot make a town where no urban
  // fabric is attested at this place and date.
  const town = urbanized(s);
  const farming = farms(s) || town;
  const requested: Pattern =
    s.settlementPattern ??
    (s.settlement === "farm"
      ? "farmstead"
      : s.settlement === "port"
        ? "waterfront"
        : s.settlement === "city"
          ? !s.urbanRevision &&
            (s.architecture === "classical" || s.architecture === "courtyard")
            ? "planned"
            : "dense"
          : s.placeId === "normandy"
            ? "roadside"
            : "clustered");
  const pattern: Pattern =
    town || !["dense", "planned", "waterfront"].includes(requested)
      ? requested
      : "clustered";
  const p = { ...profiles[pattern] };
  if (!home) {
    p.buildings = Math.min(p.buildings, 8);
    p.radius = 74;
    p.fields = farming ? "grouped" : "none";
    p.livestock = farming;
  }
  // Paving follows the attested fabric, not the rank. An earth-streeted fabric
  // stays dirt, and so does an unresearched town before the industrial era.
  if (town && (s.settlement === "city" || s.settlement === "port")) {
    const form = urbanForm(s);
    p.paved =
      form.surface !== "earth" &&
      (form.evidence.status !== "fictional" || s.year >= 1800);
  }
  if (!town) p.paved = false;
  if (s.settlement === "camp") {
    p.buildings = 4;
    p.radius = 54;
    p.plaza = "court";
    p.fields = "none";
    p.livestock = false;
    p.paved = false;
  }
  if (!farming) {
    p.fields = "none";
    p.livestock = false;
    p.paved = false;
  }
  return p;
}
