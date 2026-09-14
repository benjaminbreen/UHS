import type { Settings } from "./model";
export const bankClimates = {
  "temperate-woodland": "Temperate",
  "tropical-woodland": "Tropical",
  desert: "Desert · red earth",
  tundra: "Arctic · snow",
  "boreal-woodland": "Boreal",
  wetland: "Wetland",
  "dry-scrub": "Dry scrub",
  grassland: "Grassland",
  savanna: "Savanna",
} as const;
export type BankClimate = keyof typeof bankClimates;
export type BankMaterial =
  | "auto"
  | "sand"
  | "mud"
  | "clay"
  | "snow"
  | "pebbles";
export function blendBankColor(a: string, b: string, t: number) {
  return (
    "#" +
    [1, 3, 5]
      .map((i) =>
        Math.round(
          parseInt(a.slice(i, i + 2), 16) * (1 - t) +
            parseInt(b.slice(i, i + 2), 16) * t,
        )
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}
export function bankStyle(s: Settings) {
  const climate =
    s.bankClimate === "auto"
      ? s.palette === "polar"
        ? "tundra"
        : s.palette === "tropical"
          ? "tropical-woodland"
          : "temperate-woodland"
      : s.bankClimate;
  const material =
    s.bankMaterial === "auto"
      ? climate === "tundra"
        ? "snow"
        : s.kind === "coast"
          ? "sand"
          : climate === "desert"
            ? "clay"
            : "mud"
      : s.bankMaterial;
  const red = climate === "desert",
    tropical = climate === "tropical-woodland",
    snow = material === "snow";
  const dry =
    material === "sand"
      ? red
        ? "#dbb077"
        : "#d9cd9f"
      : snow
        ? "#e4ece6"
        : material === "clay"
          ? "#bd865a"
          : tropical
            ? "#91815b"
            : "#ae9e78";
  const base = {
    material,
    dry,
    wet: snow
      ? "#a6bcc1"
      : material === "sand"
        ? "#b3ad89"
        : material === "clay"
          ? "#98633e"
          : tropical
            ? "#665c44"
            : "#827756",
    contact: snow
      ? "#748f9d"
      : red || material === "clay"
        ? "#77503b"
        : "#5c6555",
    face: snow
      ? ["#d4e0df", "#a4b9bc", "#7a929d"]
      : red
        ? ["#c08957", "#a46440", "#804733"]
        : tropical
          ? ["#a08b59", "#7b6844", "#594c36"]
          : ["#b19868", "#8d7953", "#675941"],
    ground: snow ? "#dae4df" : red ? "#b18b54" : "#578452",
    grass: snow ? "#c3d5d0" : red ? "#bca264" : "#87a94a",
  };
  if (material === "pebbles") {
    base.dry = "#c0bbae";
    base.wet = "#95998e";
    base.contact = "#687a79";
    base.face = ["#b1aaa0", "#8e8981", "#666e6d"];
  }
  if (s.customBankColors) {
    base.dry = blendBankColor(base.dry, s.bankDryColor, s.bankTintOpacity);
    base.wet = s.bankWetColor;
    base.contact = s.bankContactColor;
  }
  return base;
}
