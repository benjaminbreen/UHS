import type { CaveKind } from "../../content/caves";

export type RGB = readonly [number, number, number];
const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const ramp = (...h: string[]) => h.map(hex);

export type CavePalette = {
  /** Dark to light. */
  floor: RGB[];
  /** Foot shadow, dark, mid, light, lip. */
  face: RGB[];
  top: RGB;
  rim: RGB;
  /** Deep, mid, shallow, shoreline. */
  water: RGB[];
  /** How the face is built: beds, jointed blocks, or draped ribs. */
  fabric: "beds" | "blocks" | "ribs";
  /** A second colour in the rock: iron stain, algae, dust. */
  stain: RGB;
  /** Share of the floor that is loose silt or sand rather than broken slabs. */
  silt: number;
};

export const cavePalettes: Record<CaveKind, CavePalette> = {
  karst: {
    floor: ramp("#5e4a3c", "#7d6650", "#8f775c", "#a68c6c"),
    face: ramp("#32241f", "#644c3c", "#957658", "#bf9e78", "#dcc49a"),
    top: hex("#221816"), rim: hex("#4e3a2e"),
    water: ramp("#123642", "#1b4f5e", "#2c6e7c", "#78b8bc"),
    fabric: "ribs", stain: hex("#b07850"), silt: 0.42,
  },
  sandstone: {
    floor: ramp("#74492f", "#93623f", "#a67148", "#bd8658"),
    face: ramp("#472616", "#8a4f2e", "#bb7646", "#d99a62", "#f0bd82"),
    top: hex("#3a2318"), rim: hex("#643c26"),
    water: ramp("#1c3f42", "#2a5c5c", "#44817a", "#a8d8c8"),
    fabric: "beds", stain: hex("#e8c890"), silt: 0.5,
  },
  lava: {
    floor: ramp("#242120", "#353130", "#403b39", "#4f4946"),
    face: ramp("#141211", "#2f2b29", "#4a4441", "#655e59", "#7d756e"),
    top: hex("#131110"), rim: hex("#2c2826"),
    water: ramp("#10242c", "#18343e", "#255060", "#6fb0b8"),
    fabric: "blocks", stain: hex("#7a3c26"), silt: 0.2,
  },
  fissure: {
    floor: ramp("#3f4348", "#52565c", "#5e6268", "#70747a"),
    face: ramp("#25282c", "#4d5157", "#74787f", "#969aa1", "#b6bac0"),
    top: hex("#1f2124"), rim: hex("#3c4045"),
    water: ramp("#12303f", "#1a4658", "#2c6a7c", "#88c8d4"),
    fabric: "blocks", stain: hex("#8a6a4a"), silt: 0.25,
  },
  sea: {
    floor: ramp("#5a5444", "#766e59", "#857c64", "#9a9076"),
    face: ramp("#1f231f", "#454a41", "#666c60", "#868c7c", "#a4a996"),
    top: hex("#1c1f1b"), rim: hex("#383d35"),
    water: ramp("#124650", "#1b6470", "#2f8a8e", "#b8ece0"),
    fabric: "beds", stain: hex("#4a7a4a"), silt: 0.6,
  },
  ice: {
    floor: ramp("#7c9db2", "#9fbdd0", "#b0cbdb", "#cde2ee"),
    face: ramp("#2d4a66", "#5a86a8", "#86b2cf", "#b7d8ea", "#e6f5fb"),
    top: hex("#22384c"), rim: hex("#46698a"),
    water: ramp("#27506e", "#3e7396", "#6aa2c2", "#d6f0fa"),
    fabric: "ribs", stain: hex("#f2fbff"), silt: 0.45,
  },
};

export const css = (c: RGB, a = 1) => (a >= 1 ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`);
export const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const rgb = hex;
