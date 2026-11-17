// How a palace room is built and coloured. A style is data; `render/fair/palace.ts` paints any of
// them, and `world/fair.ts` furnishes a room by its `room`. A palace sets one style and each room
// overrides what differs: the Blue Room is the house style with blue cloth and blue walls.

/** What fills a bay of the back wall, three cells wide, between two piers. */
export type PalaceBay = "mirror" | "hanging" | "panel" | "window" | "bookcase" | "hearth"
  // A timber hall's wall: bare, or hung with shields and spears, stretched hides, antlers, or a shelf of pots.
  | "bare" | "shields" | "hides" | "antlers" | "shelf";
/** What a room is for, which decides its furniture. */
export type PalaceRoom = "gallery" | "ballroom" | "drawing" | "dining" | "library" | "office" | "hall" | "store";

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
  /** How the room is built: piers and a cornice, or posts carrying a roof you can see the underside of. */
  order?: "classical" | "timber";
  /** A timber wall's filling between the posts. */
  walling?: "daub" | "plank";
  /** Before metal and before the table: no shields, trestles or carved high seat. */
  rude?: boolean;
  pier: "inset" | "fluted";
  floor: "versailles" | "herringbone" | "marble" | "carpet" | "earth";
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

export const DAUB = ["#eadcc0", "#d8c6a4", "#c2ae8a", "#a48e6c", "#7e6a50", "#564634"];
export const OAK_PLANK = ["#c8a47a", "#ae8a60", "#94724c", "#765838", "#584028", "#3c2a1a"];
export const ROUGH_TIMBER = ["#b89a74", "#9a7c58", "#7c6044", "#5e4632", "#422f22"];
export const DARK_OAK = ["#a07e58", "#806040", "#644830", "#4a3422", "#322216"];
export const FIELDSTONE = ["#d0cac0", "#b0aaa0", "#8e8880", "#6c6660", "#4c4844"];
export const MADDER = ["#e09078", "#c0624e", "#98443a", "#6e2e2a"];
export const WOAD = ["#9ab4cc", "#6a8cae", "#4a6a8c", "#324a66"];
export const UNDYED = ["#e8dcc4", "#cfc0a2", "#b0a082", "#8a7a62"];
export const WELD = ["#eed890", "#d4b85c", "#ae9240", "#806a2c"];

/** A big house of the Neolithic: wattle and daub between rough posts, beaten earth, hides and antlers, nothing of metal. */
export const neolithicHall: PalaceStyle = {
  order: "timber", walling: "daub", rude: true, wall: DAUB, trim: ROUGH_TIMBER, frame: ROUGH_TIMBER, stone: FIELDSTONE, cloth: UNDYED, pier: "inset", floor: "earth", wood: "#8c7254",
  bays: ["bare", "hides", "bare", "antlers", "shelf"], room: "hall", emblem: "wreath",
};

/** A lord's hall of the Iron Age and the early Middle Ages: plank walls, carved posts, woven hangings, shields on the wall. */
export const meadHall: PalaceStyle = {
  order: "timber", walling: "plank", wall: OAK_PLANK, trim: DARK_OAK, frame: DARK_OAK, stone: FIELDSTONE, cloth: MADDER, pier: "inset", floor: "earth", wood: "#86694a",
  bays: ["hanging", "shields", "bare", "hanging", "antlers"], room: "hall", emblem: "wreath",
};
