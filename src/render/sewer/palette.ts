import type { MineKind, SewerKind } from "../../content/sewers";

export type RGB = readonly [number, number, number];
const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const ramp = (...h: string[]) => h.map(hex);
export const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const shade = (c: RGB, v: number): RGB => [Math.max(0, Math.min(255, c[0] + v)), Math.max(0, Math.min(255, c[1] + v)), Math.max(0, Math.min(255, c[2] + v * 1.1))];

export type SewerPalette = {
  /** The back wall: mortar or joint, dark, mid, light units. */
  face: RGB[];
  /** How the back wall is built. */
  fabric: "brick" | "ashlar" | "cast" | "panel" | "rock" | "coal" | "salt";
  /** Walkway: joint, dark, mid, light. */
  ledge: RGB[];
  /** Room floor: joint, dark, mid, light. */
  floor: RGB[];
  /** The lip of the walkway over the water: lit top, face, shadow. */
  coping: RGB[];
  /** Deep, mid, surface, foam. */
  water: RGB[];
  /** The tide line and what grows in it. */
  slime: RGB;
  silt: RGB[];
  /** What runs along the wall: water mains, cables, lagged heating pipes. */
  pipes: "none" | "mains" | "heating" | "cable";
  pipe: RGB[];
  /** The dark earth behind everything, and its rim where it meets the open. */
  top: RGB;
  rim: RGB;
  /** In a mine: what is dug, dark to light, and the timber that holds the roof up. */
  ore?: RGB[];
  timber?: RGB[];
};

export const sewerPalettes: Record<SewerKind, SewerPalette> = {
  brick: {
    face: ramp("#3a2a26", "#6e3f30", "#8c5038", "#a8664a"),
    fabric: "brick",
    ledge: ramp("#3e3a3a", "#5e5754", "#706864", "#857c75"),
    floor: ramp("#3a3434", "#625650", "#74675e", "#8a7b70"),
    coping: ramp("#9a8f84", "#4e4844", "#262224"),
    water: ramp("#18221e", "#2a3c32", "#43604c", "#c4d8a8"),
    slime: hex("#4a5a32"),
    silt: ramp("#3e3426", "#57492f", "#6f5e3c"),
    pipes: "none",
    pipe: ramp("#2a2c30", "#45484e", "#6c7078"),
    top: hex("#0c0a0b"),
    rim: hex("#2e211e"),
  },
  gallery: {
    face: ramp("#5a5248", "#8d826e", "#a69a82", "#bdb197"),
    fabric: "ashlar",
    ledge: ramp("#4a4640", "#6c665c", "#7e776b", "#938b7d"),
    floor: ramp("#4a4640", "#6e6858", "#827a68", "#968d78"),
    coping: ramp("#b2a990", "#5c564c", "#2c2926"),
    water: ramp("#142220", "#24403c", "#3a6058", "#c0d8c8"),
    slime: hex("#56603e"),
    silt: ramp("#3c3628", "#564c36", "#6c6044"),
    pipes: "mains",
    pipe: ramp("#1e2a30", "#2f4552", "#4f6f80", "#86a4b2"),
    top: hex("#0d0c0b"),
    rim: hex("#36302a"),
  },
  concrete: {
    face: ramp("#4a4c4e", "#6c6e6e", "#80827f", "#959691"),
    fabric: "cast",
    ledge: ramp("#424444", "#606262", "#717371", "#868884"),
    floor: ramp("#424444", "#626462", "#767874", "#8a8c86"),
    coping: ramp("#a2a49e", "#505252", "#252627"),
    water: ramp("#141e24", "#22384a", "#36566a", "#bcd4dc"),
    slime: hex("#3e4a36"),
    silt: ramp("#3a3630", "#504a3e", "#686050"),
    pipes: "cable",
    pipe: ramp("#1c1c1e", "#303034", "#4a4a50"),
    top: hex("#0b0b0c"),
    rim: hex("#2a2b2c"),
  },
  tropical: {
    face: ramp("#55584c", "#7e8270", "#949a82", "#aab094"),
    fabric: "panel",
    ledge: ramp("#55584c", "#7a7e6c", "#8c917e", "#a2a890"),
    floor: ramp("#4c4e44", "#727462", "#878a74", "#9c9f88"),
    coping: ramp("#b4b89c", "#585c4c", "#2a2c24"),
    water: ramp("#1c2616", "#30482a", "#4a6a38", "#d0dca0"),
    slime: hex("#3f6a2c"),
    silt: ramp("#4a3e2a", "#64543a", "#7e6c4c"),
    pipes: "none",
    pipe: ramp("#2a2c30", "#45484e", "#6c7078"),
    top: hex("#0b0c09"),
    rim: hex("#2c3024"),
  },
  collector: {
    face: ramp("#46484a", "#666a6a", "#7a7e7c", "#8e928e"),
    fabric: "panel",
    ledge: ramp("#3e4040", "#5c5e5c", "#6e706c", "#82847e"),
    floor: ramp("#3e4040", "#5e605c", "#72746e", "#868880"),
    coping: ramp("#9a9c96", "#4a4c4a", "#232424"),
    water: ramp("#181e1c", "#2a3a34", "#40584e", "#c4d4c0"),
    slime: hex("#4a5034"),
    silt: ramp("#3a342c", "#524a3c", "#6a604e"),
    pipes: "heating",
    pipe: ramp("#4a4c50", "#7a7e84", "#a6aab0", "#d4d8dc"),
    top: hex("#0b0b0b"),
    rim: hex("#2a2a2a"),
  },
};

/** The old level is older work whatever is above it: stone and old brick. */
export const oldPalette: SewerPalette = {
  ...sewerPalettes.brick,
  face: ramp("#3c3428", "#6a5a44", "#7e6c52", "#948062"),
  fabric: "ashlar",
  ledge: ramp("#3a342a", "#5a5040", "#6c604c", "#80725a"),
  floor: ramp("#38322a", "#5a5042", "#6a5e4c", "#7e705a"),
  coping: ramp("#9a8c70", "#4e4638", "#25211c"),
  water: ramp("#141a14", "#243226", "#38503a", "#b0c4a4"),
  pipes: "none",
  rim: hex("#2c261e"),
};

const TIMBER = ramp("#3a2414", "#6a4426", "#8e6034", "#b4844c");

/** Mines, by what they work. Their water is what the rock gives it: black
 * from coal, ochre from metal sulphides, pale brine from salt. */
export const minePalettes: Record<MineKind, SewerPalette> = {
  coal: {
    face: ramp("#141416", "#4a4a4e", "#5e5c5c", "#76726c"),
    fabric: "coal",
    ledge: ramp("#1a1a1c", "#2e2c2c", "#3a3836", "#4c4844"),
    floor: ramp("#1c1b1c", "#353230", "#423e3a", "#56504a"),
    coping: ramp("#5a5650", "#2a2828", "#121112"),
    water: ramp("#0c0e10", "#1a2026", "#2c3840", "#9aa8b0"),
    slime: hex("#6a6460"),
    silt: ramp("#2a2826", "#3e3a36", "#555048"),
    pipes: "none",
    pipe: ramp("#1e1e22", "#3a3c42", "#62666e"),
    top: hex("#070708"),
    rim: hex("#1e1d1e"),
    ore: ramp("#08080a", "#1c1c22", "#3a3c48", "#8a94b0"),
    timber: TIMBER,
  },
  metal: {
    face: ramp("#2e2622", "#5c4a3e", "#74604e", "#8e7a64"),
    fabric: "rock",
    ledge: ramp("#2a2420", "#463c34", "#56493e", "#6a5a4c"),
    floor: ramp("#2c2622", "#4a4038", "#5a4e44", "#6e6052"),
    coping: ramp("#8a7860", "#433a32", "#1e1a18"),
    water: ramp("#24140a", "#4e2c12", "#84501e", "#e8b86a"),
    slime: hex("#a8642a"),
    silt: ramp("#3a2e26", "#54443a", "#6c5a4c"),
    pipes: "none",
    pipe: ramp("#2a2c30", "#45484e", "#6c7078"),
    top: hex("#0a0807"),
    rim: hex("#2a221e"),
    ore: ramp("#2a3a34", "#3e6a58", "#5aa486", "#c8e8b8"),
    timber: TIMBER,
  },
  salt: {
    face: ramp("#5a5a52", "#8a8a7c", "#a4a294", "#c4c2b2"),
    fabric: "salt",
    ledge: ramp("#4e4c44", "#74705e", "#86826e", "#9c9882"),
    floor: ramp("#52504a", "#7a7666", "#8e8a78", "#a6a28e"),
    coping: ramp("#c8c4b0", "#6a675a", "#33322c"),
    water: ramp("#1a2826", "#365048", "#5a7a6e", "#e4f0e8"),
    slime: hex("#e8e6dc"),
    silt: ramp("#5a564a", "#767060", "#908a76"),
    pipes: "none",
    pipe: ramp("#2a2c30", "#45484e", "#6c7078"),
    top: hex("#0d0d0b"),
    rim: hex("#36352e"),
    ore: ramp("#6a6a62", "#a8a49a", "#d4d0c4", "#f4f2ea"),
    timber: TIMBER,
  },
};
