// How a palace room is built and coloured. A style is data; `render/fair/palace.ts` paints any of
// them, and `world/fair.ts` furnishes a room by its `room`. A palace sets one style and each room
// overrides what differs: the Blue Room is the house style with blue cloth and blue walls.

/** What fills a bay of the back wall, three cells wide, between two piers. */
export type PalaceBay = "mirror" | "hanging" | "panel" | "window" | "bookcase" | "hearth"
  // A timber hall's wall: bare, or hung with shields and spears, stretched hides, antlers, or a shelf of pots.
  | "bare" | "shields" | "hides" | "antlers" | "shelf"
  // A Roman wall: a painted panel in the room's colour or its second colour, a garden painted as if seen through
  // the wall, the household shrine, or a cupboard of book rolls.
  | "fresco" | "fresco-alt" | "garden" | "niche" | "scrolls"
  // A pillared hall's wall: people walking in file, a lion or a griffin, or bands of pattern.
  | "relief" | "beast" | "bands"
  // A wall of screens between posts: a lattice window or paper screen, a painted screen, or a hanging scroll.
  | "lattice" | "screen" | "scroll"
  // A pointed window of coloured glass, and a blind arch filled with carved plaster.
  | "lancet" | "arch";
/** What a room is for, which decides its furniture. */
export type PalaceRoom = "gallery" | "ballroom" | "drawing" | "dining" | "library" | "office" | "hall" | "store"
  | "atrium" | "peristyle" | "triclinium" | "tablinum" | "cubiculum"
  // The rooms round the great ones, in any order of building: where the household sleeps, waits, stands guard, prays, cooks and washes.
  | "bedchamber" | "antechamber" | "guard" | "vestibule" | "chapel" | "kitchen" | "bath" | "closet";

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
  /** How the room is built: piers and a cornice, posts carrying a roof you can see the underside of, plastered walls painted in panels, a painted wall behind rows of free-standing columns, or a timber frame filled with screens. */
  order?: "classical" | "timber" | "roman" | "pillared" | "screened";
  /** A pillared hall's columns, and with them its cornice and the manner of its wall painting: bundled papyrus with an open
   * bell, a tall fluted shaft carrying two bulls, or a red shaft that narrows downward under a cushion. */
  columns?: "papyrus" | "persian" | "aegean"
    // A slender marble shaft under carved plaster, and a square pier of painted stucco.
    | "moorish" | "mexica"
    // In a screened hall: round posts lacquered red under painted brackets, or plain squared cypress.
    | "lacquer" | "cypress";
  /** A timber wall's filling between the posts. */
  walling?: "daub" | "plank"
    // Under an open timber roof: coursed stone, or great fitted blocks under thatch.
    | "stone" | "ashlar";
  /** Before metal and before the table: no shields, trestles or carved high seat. */
  rude?: boolean;
  pier: "inset" | "fluted";
  floor: "versailles" | "herringbone" | "marble" | "carpet" | "earth" | "mosaic" | "signinum" | "flags" | "plaster" | "tatami";
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

/** A palace's working rooms: limewash and plain paint, stone underfoot, nothing gilded. */
export const service: Partial<PalaceStyle> = { wall: CREAM, trim: WHITE_PAINT, frame: WALNUT, stone: CARRARA, field: CREAM, pier: "fluted", floor: "marble" };

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

/** A manor hall of the high Middle Ages: a timber frame filled with limewashed daub, an open roof, painted cloths on the walls. */
export const manorHall: PalaceStyle = { ...meadHall, walling: "daub", wall: DAUB, cloth: WOAD, bays: ["hanging", "bare", "shields", "hanging", "bare"] };

export const PLASTER = ["#fbf5e6", "#f0e7d2", "#dccfb4", "#b8a98c", "#8c7e66", "#5e5446"];
export const CINNABAR = ["#e07a5e", "#c2503e", "#9c3a30", "#722824"];
export const OCHRE = ["#f0d088", "#dcae54", "#b88838", "#8a6226"];
export const BLACK_GROUND = ["#5a545c", "#3e3a42", "#2c282e", "#1e1a20"];
export const EGYPTIAN_BLUE = ["#9cc4d8", "#6a9cbc", "#487a9c", "#325a78"];
export const RED_OCHRE = ["#c88468", "#a8604a", "#864636", "#643226", "#44221a"];
export const BRONZE_WOOD = ["#c49a64", "#a07846", "#7c5a32", "#5a3e22", "#3c2816"];

/** A Roman house of the late Republic and the Empire: walls painted in panels of red, ochre and black over a dark dado, mosaic floors, marble and bronze. */
export const romanHouse: PalaceStyle = {
  order: "roman", wall: PLASTER, trim: RED_OCHRE, frame: BRONZE_WOOD, stone: CARRARA, cloth: CINNABAR, field: OCHRE, pier: "inset", floor: "mosaic", wood: "#b0624a",
  bays: ["fresco", "fresco-alt"], room: "atrium", emblem: "wreath",
};

export const SANDSTONE = ["#f8ecd2", "#ecdcb8", "#d8c49a", "#b8a27a", "#8c785a", "#5e5040"];
export const PAINTED_GOLD = ["#f8dc84", "#e4b84c", "#c08e30", "#906824", "#604418"];
export const LAPIS = ["#a8c4e8", "#5a86c8", "#3a62a4", "#28447a", "#1a2c54"];
export const MALACHITE = ["#a8d8a0", "#6cb078", "#488a5c", "#2e6444"];
export const GLAZED = ["#f4f0e4", "#e6e0d0", "#d0c8b4", "#aca48e", "#7e7868", "#545046"];
export const DARK_LIMESTONE = ["#b4b4b8", "#8e8e94", "#6a6a72", "#4a4a52", "#303036"];
export const TYRIAN = ["#c890cc", "#a060aa", "#784482", "#522e5a"];
export const EBONY = ["#8a6e5a", "#664e40", "#4a382e", "#34261f", "#221814"];

/** An Egyptian palace of the New Kingdom: mud brick plastered and painted, papyrus columns, a cavetto cornice in stripes, painted floors. */
export const egyptianPalace: PalaceStyle = {
  order: "pillared", columns: "papyrus", wall: SANDSTONE, trim: PAINTED_GOLD, frame: EBONY, stone: LAPIS, cloth: CINNABAR, field: MALACHITE, pier: "inset", floor: "plaster", wood: "#c8a878",
  bays: ["relief", "bands", "relief", "beast"], room: "hall", emblem: "sun",
};

/** A palace of the Persian kings: tall fluted columns under bulls, glazed brick lions on blue, grey stone carved with people bringing gifts. */
export const persianPalace: PalaceStyle = {
  order: "pillared", columns: "persian", wall: GLAZED, trim: PAINTED_GOLD, frame: BRONZE_WOOD, stone: DARK_LIMESTONE, cloth: TYRIAN, field: EGYPTIAN_BLUE, pier: "inset", floor: "flags", wood: "#a89878",
  bays: ["relief", "beast", "relief", "bands"], room: "hall", emblem: "sun",
};

/** A palace of Bronze Age Crete and Greece: red columns that narrow downward, walls painted with griffins and running waves, gypsum underfoot. */
export const aegeanPalace: PalaceStyle = {
  order: "pillared", columns: "aegean", wall: PLASTER, trim: RED_OCHRE, frame: BRONZE_WOOD, stone: CARRARA, cloth: CINNABAR, field: EGYPTIAN_BLUE, pier: "inset", floor: "flags", wood: "#b8a888",
  bays: ["beast", "bands", "relief", "bands"], room: "hall", emblem: "wreath",
};

export const VERMILION = ["#f08a6a", "#d4543c", "#b03a2c", "#822820", "#561a16"];
export const ROSEWOOD = ["#b0705a", "#8a4e3e", "#683628", "#4a241c", "#301612"];
export const GREY_BRICK = ["#d4d4d0", "#b8b8b4", "#989894", "#72726e", "#4c4c4a"];
export const IMPERIAL_YELLOW = ["#fbe48a", "#f0c64a", "#d0a030", "#a07820"];
export const BEAM_GREEN = ["#8ad0c0", "#3fa494", "#2a7c74", "#1c5658"];
export const HINOKI = ["#ecd4a6", "#d4b480", "#b4925e", "#886c44", "#5c482e"];
export const INDIGO = ["#8aa0c8", "#56709e", "#3a5078", "#263654"];
export const GOLD_LEAF = ["#fbe9a0", "#eccb5e", "#cba23a", "#987426"];

/** A Chinese palace hall of the Ming and Qing: red lacquered posts, brackets and beams painted blue and green, lattice windows, grey brick underfoot.
 * In a screened hall `trim` is the lacquer or bare wood of posts and frames, and `field` the painted beams or the gold leaf of a screen. */
export const chinesePalace: PalaceStyle = {
  order: "screened", columns: "lacquer", wall: PLASTER, trim: VERMILION, frame: ROSEWOOD, stone: GREY_BRICK, cloth: IMPERIAL_YELLOW, field: BEAM_GREEN, pier: "inset", floor: "flags", wood: "#8a6a4a",
  bays: ["lattice", "screen", "lattice", "scroll"], room: "hall", emblem: "sun",
};

/** A Japanese palace in the shoin manner, about 1600: squared cypress posts, sliding screens painted on gold leaf, paper screens, an alcove for a scroll, straw mats. */
export const shoinPalace: PalaceStyle = {
  order: "screened", columns: "cypress", wall: DAUB, trim: HINOKI, frame: WALNUT, stone: FIELDSTONE, cloth: INDIGO, field: GOLD_LEAF, pier: "inset", floor: "tatami", wood: "#b89868",
  bays: ["screen", "screen", "scroll", "lattice"], room: "hall", emblem: "wreath",
};

export const LIMESTONE = ["#f2ece0", "#e2dac8", "#cdc4ae", "#aaa08a", "#7c7462", "#524c40"];
export const ANDESITE = ["#dcd2c8", "#c6bab0", "#aa9e94", "#887c74", "#625852", "#403836"];
export const STUCCO = ["#fffaf0", "#f6eede", "#e6dcc6", "#c8bca2", "#9a8e76", "#6a6050"];
export const TILE_BLUE = ["#9ad0e0", "#3f8fb8", "#2a6a94", "#1c4a6c", "#12304a"];
export const TILE_GREEN = ["#9ad4a8", "#4a9e6e", "#2e7a52", "#1e563a"];
export const TURKEY_RED = ["#f08878", "#cc4a44", "#a2302e", "#741f22"];
export const QUETZAL = ["#8adcb0", "#3aa880", "#22805e", "#145a42"];
export const TEZONTLE = ["#e88a70", "#c85a44", "#a03c30", "#742820", "#4c1a16"];
export const CUMBI = ["#f6cc6a", "#e09a36", "#b86a26", "#82461c"];

/** A king's hall of the later Middle Ages: coursed stone under an open oak roof, tall windows of coloured glass, hangings, stone flags. */
export const gothicHall: PalaceStyle = { ...meadHall, walling: "stone", wall: LIMESTONE, cloth: CRIMSON, field: ROYAL_BLUE, floor: "flags", bays: ["lancet", "hanging", "lancet", "shields"] };

/** A hall of the Inca: fitted stone blocks with niches in them, under a steep thatch on poles; fine cloth for wealth, nothing of iron. */
export const incaHall: PalaceStyle = { ...neolithicHall, walling: "ashlar", wall: ANDESITE, cloth: CUMBI, bays: ["niche", "hanging", "niche", "bare"] };

/** A palace of the Islamic world: slender marble columns, walls of carved plaster over a dado of cut tile, a band of writing, carpets and cushions. */
export const islamicPalace: PalaceStyle = {
  order: "pillared", columns: "moorish", wall: STUCCO, trim: WHITE_PAINT, frame: WALNUT, stone: TILE_BLUE, cloth: TURKEY_RED, field: TILE_GREEN, pier: "inset", floor: "carpet", wood: "#b08a5a",
  bays: ["arch", "lattice", "arch", "bands"], room: "hall", emblem: "sun",
};

/** A palace of the Mexica: square piers and walls of white stucco painted in red bands, a frieze of discs and stepped frets, mats underfoot. */
export const mexicaPalace: PalaceStyle = {
  order: "pillared", columns: "mexica", wall: STUCCO, trim: TEZONTLE, frame: ROUGH_TIMBER, stone: CARRARA, cloth: TURKEY_RED, field: QUETZAL, pier: "inset", floor: "plaster", wood: "#b8a888",
  bays: ["relief", "bands", "beast", "bands"], room: "hall", emblem: "sun",
};
