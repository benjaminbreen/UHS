/** Ramps are ordered dark to light so both renderers can index them the same
 * way and a single palette swap restyles the atlas and the procedural pass. */
export type Palette = {
  name: string;
  grass: string[];
  dirt: string[];
  outline: string;
  lip: string;
};

export const palettes: Palette[] = [
  {
    name: "Meadow (mockup)",
    grass: ["#2f5f28", "#3c7a30", "#4f9e3a", "#63b944", "#8fd45c"],
    dirt: ["#4e3020", "#6d4527", "#8b5a32", "#a9743f", "#c08f55"],
    outline: "#24401f",
    lip: "#9ade63",
  },
  {
    name: "Engine olive",
    grass: ["#365b40", "#47724b", "#5b8046", "#718b40", "#a4ae59"],
    dirt: ["#624735", "#90633f", "#b38b53", "#d0ab6b", "#e6c384"],
    outline: "#2b4535",
    lip: "#bdc575",
  },
  {
    name: "Grass & Dirt pack",
    grass: ["#34492f", "#4d6338", "#728f47", "#8fae5b", "#9cb851"],
    dirt: ["#66412c", "#875a38", "#a06a42", "#b07a4c", "#c2925f"],
    outline: "#2b3a26",
    lip: "#9cb851",
  },
  {
    name: "Mystic bright",
    grass: ["#26301f", "#3d7a37", "#4fa845", "#63c74d", "#8ee06a"],
    dirt: ["#3b2a20", "#5f4231", "#7d5a41", "#9a7050", "#b78a63"],
    outline: "#26301f",
    lip: "#8ee06a",
  },
];

export const rgb = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

export function mix(a: string, b: string, t: number) {
  const [r1, g1, b1] = rgb(a),
    [r2, g2, b2] = rgb(b);
  const h = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  return `#${h(r1 + (r2 - r1) * t)}${h(g1 + (g2 - g1) * t)}${h(b1 + (b2 - b1) * t)}`;
}

/** Nearest-luma remap of arbitrary source art onto a palette ramp. Lets the
 * borrowed cliff and blob sheets sit next to procedurally drawn ground. */
export function recolour(
  source: ImageData,
  palette: Palette,
  greenish = true,
): ImageData {
  const out = new ImageData(source.width, source.height);
  const grass = palette.grass.map(rgb),
    dirt = palette.dirt.map(rgb);
  for (let i = 0; i < source.data.length; i += 4) {
    const r = source.data[i],
      g = source.data[i + 1],
      b = source.data[i + 2],
      a = source.data[i + 3];
    out.data[i + 3] = a;
    if (!a) continue;
    const luma = (r * 0.3 + g * 0.59 + b * 0.11) / 255;
    // Green channel dominance separates turf from earth in every source sheet
    // here, which is cheaper and steadier than a hue conversion.
    const ramp = greenish && g > r * 1.05 ? grass : dirt;
    const [nr, ng, nb] =
      ramp[
        Math.max(
          0,
          Math.min(ramp.length - 1, Math.round(luma * (ramp.length - 1))),
        )
      ];
    out.data[i] = nr;
    out.data[i + 1] = ng;
    out.data[i + 2] = nb;
  }
  return out;
}
