// How a palace room is built and coloured. A style is data; `render/fair/palace.ts` paints any of
// them, and `world/fair.ts` furnishes a room by its `room`. A palace sets one style and each room
// overrides what differs: the Blue Room is the house style with blue cloth and blue walls.

/** What fills a bay of the back wall, three cells wide, between two piers. */
export type PalaceBay = "mirror" | "hanging" | "panel" | "window" | "bookcase" | "hearth";
/** What a room is for, which decides its furniture. */
export type PalaceRoom = "gallery" | "ballroom" | "drawing" | "dining" | "library" | "office";

export type PalaceStyle = {
  /** Panelling, light to dark: six tones. */
  wall: readonly string[];
  /** Mouldings, frames and capitals: gilt, white paint or wood. Five tones. */
  trim: readonly string[];
  /** Furniture frames and door leaves. Five tones. */
  frame: readonly string[];
  /** The stone let into the piers and the frieze. Five tones. */
  stone: readonly string[];
  /** Upholstery, hangings, curtains and carpet. Four tones. */
  cloth: readonly string[];
  /** The painted or papered wall inside a "panel" bay, when it is not the cloth. Four tones. */
  field?: readonly string[];
  pier: "inset" | "fluted";
  floor: "versailles" | "herringbone" | "marble" | "carpet";
  /** The floor's wood, as one colour the painter makes a close family from. */
  wood: string;
  /** The bays along the back wall, repeated from the left. */
  bays: readonly PalaceBay[];
  room: PalaceRoom;
  /** The device over a doorway. */
  emblem: "sun" | "wreath";
};

export const GILT = ["#fff6c0", "#f6d266", "#d9a23a", "#a87424", "#70481a"];
export const WHITE_PAINT = ["#ffffff", "#f3f1ea", "#dcd8cc", "#b9b3a4", "#8f897c"];
export const MAHOGANY = ["#c98a62", "#a8643f", "#864a2e", "#643422", "#442216"];
export const WALNUT = ["#b89468", "#96724a", "#765636", "#583e28", "#3c2a1c"];
export const CREAM = ["#fffaf0", "#f4ead8", "#e2d4ba", "#c2b092", "#94826a", "#665848"];
export const IVORY = ["#ffffff", "#f6f3ea", "#e4dfd0", "#c4bdaa", "#989080", "#6a6458"];
export const ROUGE = ["#e6c0b0", "#c98474", "#ad5e54", "#8c4440", "#683030"];
export const SIENA = ["#f6e2a8", "#e2bc6c", "#c89a4a", "#a47834", "#7a5624"];
export const CARRARA = ["#ffffff", "#eeeeea", "#d8dad8", "#b4b8ba", "#8c9296"];
export const VERDE = ["#bcd8c0", "#86b294", "#5e8e72", "#426e58", "#2c4e40"];
export const CRIMSON = ["#f29a90", "#d85a58", "#b23c44", "#8a2a36"];
export const ROYAL_BLUE = ["#a8c0ec", "#6a8cd0", "#4a68ac", "#34497e"];
export const SAGE = ["#b8d4a8", "#86ae7c", "#62895c", "#446642"];
export const OLD_GOLD = ["#f4dc98", "#dcb45c", "#b88e3e", "#8c6a2a"];
export const BLUSH = ["#fbe6de", "#f0cdc0", "#dcae9e", "#b88a7c"];

/** Versailles under Louis XIV: white and gold, red marble, mirrors and damask, parquet in panels. */
export const louisQuatorze: PalaceStyle = {
  wall: CREAM, trim: GILT, frame: GILT, stone: ROUGE, cloth: CRIMSON, pier: "inset", floor: "versailles", wood: "#c98c4e",
  bays: ["hanging", "mirror", "hanging"], room: "gallery", emblem: "sun",
};

/** Buckingham Palace under Victoria: Nash's white and gold with yellow scagliola, crimson silk, deep carpets, tall windows. */
export const victorianState: PalaceStyle = {
  wall: IVORY, trim: GILT, frame: GILT, stone: SIENA, cloth: CRIMSON, pier: "inset", floor: "carpet", wood: "#a8703c",
  bays: ["hanging", "window", "hanging", "mirror"], room: "drawing", emblem: "wreath",
};

/** The White House after 1817: white-painted woodwork, plain coloured walls, mahogany, carpets on boards. */
export const federal: PalaceStyle = {
  wall: IVORY, trim: WHITE_PAINT, frame: MAHOGANY, stone: CARRARA, cloth: CRIMSON, field: BLUSH, pier: "fluted", floor: "carpet", wood: "#b47c46",
  bays: ["panel", "window", "panel"], room: "drawing", emblem: "wreath",
};
