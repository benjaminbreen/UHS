export type Ramp = {
  edge: string;
  shadowEdge?: string;
  shade: string;
  base: string;
  light: string;
};
export function mix(a: string, b: string, t: number) {
  const x = parseInt(a.slice(1), 16),
    y = parseInt(b.slice(1), 16);
  return `#${[16, 8, 0]
    .map((s) =>
      Math.round(((x >> s) & 255) * (1 - t) + ((y >> s) & 255) * t)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}
/** Material-specific, hue-shifted shadows. No universal black contour. */
export function ramp(
  base: string,
  material: "cloth" | "skin" | "hair" = "cloth",
): Ramp {
  const scale = (factor: number) => {
    const value = parseInt(base.slice(1), 16);
    return `#${[16, 8, 0]
      .map((shift) =>
        Math.round(((value >> shift) & 255) * factor)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")}`;
  };
  return {
    base,
    shadowEdge: mix(
      scale(material === "skin" ? 0.34 : 0.32),
      "#402039",
      material === "skin" ? 0.38 : 0.24,
    ),
    // Warm skin lights against deep brown/plum contours; cooler shadow hues
    // give separation without turning every material into the same black.
    edge:
      material === "skin"
        ? mix(scale(0.39), "#482235", 0.28)
        : mix(
            scale(material === "hair" ? 0.38 : 0.37),
            "#291d39",
            material === "hair" ? 0.22 : 0.16,
          ),
    shade:
      material === "skin"
        ? mix(scale(0.77), "#8b4945", 0.12)
        : mix(scale(0.69), "#43364f", 0.1),
    light: mix(
      base,
      material === "skin" ? "#ffe0ae" : "#f5d99c",
      material === "hair" ? 0.32 : 0.22,
    ),
  };
}
