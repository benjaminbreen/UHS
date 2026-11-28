import { cabinet, compose, cupboard } from "../sprites";
import type { Fit } from "./index";

const rep = (l: string, mid: string, r: string, n: number) => l + mid.repeat(n) + r;

// Brass reception desk bell, rotary telephone, open guest register, green banker's lamp.
const brassBell = [
  "...^^...",
  "..%&&%..",
  ".%^^^^%.",
  "uMMMMMMu",
  "uuuuuuuu",
];
const rotaryPhone = [
  "..,,,,,,..",
  ".,::::::,.",
  ",,.q,,q.,,",
  "..,,;;,,..",
  ".q,;,,;,q.",
  ".q,,,,,,q.",
  "qqqqqqqqqq",
];
const register = [
  ".qyyyyyyyyyyq.",
  "q;;;;;;;;;;;;q",
  "q;,;;;,;;,;,;q",
  "q;;;;;;;;;;;;q",
  "q;,,;;,;;;,;;q",
  "q::::::::::::q",
  ".qqqqqqqqqqqq.",
];
const bankerLamp = [
  "..((((((..",
  ".(())))((.",
  "(()))))(((",
  "((((((((((",
  "....mM....",
  "....mM....",
  "....mM....",
  "..uMMMMu..",
  ".uuuuuuuu.",
];
const keyFob = [
  "..uMMu..",
  ".q@@@@q.",
  "q@@&&@@q",
  "q@@@@@@q",
  ".q!!!!q.",
  "..qqqq..",
];

const deskPanel = "qtrrrrrrwwrrrrrrwwrrrrrrwwrrrrrq";
const lobbyCounter = [
  "q".repeat(32),
  ...Array<string>(4).fill(rep("qy", "t", "rq", 28)),
  rep("qt", "r", "eq", 28),
  rep("qu", "M", "uq", 28),
  rep("qt", "e", "wq", 28),
  ...Array<string>(3).fill(deskPanel),
  "qtwwwwwuMMuwwwwwwuMMuwwwwwuMMuwq",
  ...Array<string>(4).fill(deskPanel),
  rep("qw", "e", "wq", 28),
  rep("qu", "m", "uq", 28),
  "q".repeat(32),
];

// Wall unit: wooden room-key pigeonhole rack behind the reception desk (slot 237 highlighted in gold).
const baseCab = cabinet(32, [14, 14], cupboard(32), "|");
const keyBoard = [
  ".quMMMMMMMMMMMMMMMMMMMMMMMMMMuq.",
  ".qmttttttttttttttttttttttttttmq.",
  ".qmt|,|&|,|&|,|&|,|&|,|&|,|&|mq.",
  ".qmt|_|_|_|_|_|_|_|_|_|_|_|_|mq.",
  ".qmt|,|&|,|&|,|@|,|&|,|&|,|&|mq.",
  ".qmt|_|_|_|_|_|!|_|_|_|_|_|_|mq.",
  ".qmt|,|&|,|&|,|&|,|&|,|&|,|&|mq.",
  ".qmt|_|_|_|_|_|_|_|_|_|_|_|_|mq.",
  ".qmt|,|&|,|&|,|&|,|&|,|&|,|&|mq.",
  ".qmt|_|_|_|_|_|_|_|_|_|_|_|_|mq.",
  ".qmt|,,|&|,,|&|,,|&|,,|&|,,||mq.",
  ".qmttttttttttttttttttttttttttmq.",
  ".quMMMMMMMMMMMMMMMMMMMMMMMMMMuq.",
  ".qeeeeeeeeeeeeeeeeeeeeeeeeeeeeq.",
];
const keyCabinet = [...baseCab.slice(0, 4), ...keyBoard, ...baseCab.slice(18)];

// Tall brass luggage trolley loaded with vintage leather trunks.
const luggageTrolley = [
  "....uMMMMMMu....",
  "...uM&&&&&&Mu...",
  "..uM..mMMm..Mu..",
  "..Mm........mM..",
  "..Mm..qqqq..mM..",
  "..Mm.q@@@@q.mM..",
  "..Mm.q@&&@q.mM..",
  "..Mm.q!!!!q.mM..",
  "..MmqqqqqqqqmM..",
  "..MmqyttttyqmM..",
  "..MmqrIttIrqmM..",
  "..MmqrIeeIrqmM..",
  "..MmqwwwwwwqmM..",
  "..Mmq@@@@@@qmM..",
  ".uMMq@&&&&@qMMu.",
  ".M&&qqqqqqqq&&M.",
  ".uMMMMMMMMMMMMu.",
  "..qq........qq..",
  "..q,........,q..",
];

// Potted alpine lobby palm in a brass-banded planter.
const lobbyPalm = [
  ".....))).......)..",
  "...)))-)))...)))).",
  "..)))-))(-)))((-).",
  ".))((-..()((..((..",
  "..((..())-))).(...",
  ".....)))-))-(.....",
  "......((((((......",
  ".......((((.......",
  ".....uMMMMMMu.....",
  "....q@@@@@@@@q....",
  "....q@&&&&&&@q....",
  "....q@@@@@@@@q....",
  ".....q!!!!!!q.....",
  ".....quMMMMuq.....",
  "......qqqqqq......",
];

// Framed Overlook Hotel July 4th Ball 1921 black-and-white photograph (14x18).
const giltFrame = (art: string[]) => [
  "uMMMMMMMMMMMMu",
  "M&&&&&&&&&&&&M",
  ...art.map((row) => "M&" + row + "&M"),
  "M&&&&&&&&&&&&M",
  "uuuuuuuuuuuuuu",
];
const photo1921 = giltFrame([
  "::::::::::::",
  ":;;:;;;;:;;:",
  ":,:;:,:;:,::",
  ",,,,,,,,,:,:",
  ",:,;,:,;,:,:",
  ",,;;,,,,;;,,",
  ",:;,;;;;,;:,",
  ",:,;,,,,;,:,",
  ",,;;,;;,;;,,",
  ",;,,,;;,,,;,",
  ",;,,;;;;,,;,",
  ",,,,,,,,,,,:",
  ":;;;;;;;;;;:",
  ":;,,,;;,,,;:",
]);
const posterAlpine = giltFrame([
  "[[[[[[[[[[[[",
  "[[[[[;;[[[[[",
  "[[[[;;;;[[[[",
  "[[[;;::;;[[[",
  "[[;;::::;;[[",
  "[;;::((::;;[",
  "(((()((()(((",
  "((((((((((((",
  "((((@@@@((((",
  "(((@@&&@@(((",
  "(((@@@@@@(((",
  ";;;;;;;;;;;;",
  ";,,,;;;;,,,;",
  "::::::::::::",
]);
const mirrorWall = [
  "..uMMMMMMMMMMu..",
  ".uM&&&&&&&&&&Mu.",
  ".M&YEEEEEEEEY&M.",
  ".M&YEE;;;;EEY&M.",
  ".M&YE;;ZZ;;EY&M.",
  ".M&YE;ZZZZ;EY&M.",
  ".M&YZZZZZZZZY&M.",
  ".M&YZZZZZZZZY&M.",
  ".M&YZZ;;;;ZZY&M.",
  ".M&YZZZZZZZZY&M.",
  ".M&YYYYYYYYYY&M.",
  ".uM&&&&&&&&&&Mu.",
  "..uMMMMMMMMMMu..",
  "..qyyyyyyyyyyq..",
  "..qtrrMMMMrreq..",
  "..qteeeeeeeewq..",
  "..qqqqqqqqqqqq..",
];

export const overlookLobby: Fit = {
  ink: {
    "!": 0x6e1420, "@": 0xa82230, $: 0xd85862,
    "%": 0x9c6a18, "^": 0xd8a832, "&": 0xf4dc80,
    "(": 0x1e523c, ")": 0x36845c, "-": 0x6ec090,
    "[": 0x263e64, "]": 0x486e9e, _: 0x221610,
    ";": 0xf0eadc, ":": 0xa8a49c, ",": 0x241e1c,
    "|": 0x302016,
  },
  grids: {
    "overlook-bell": brassBell,
    "overlook-phone": rotaryPhone,
    "overlook-register": register,
    "overlook-desk-lamp": bankerLamp,
    "overlook-key-fob": keyFob,
    "overlook-counter": lobbyCounter,
    "overlook-keyrack": keyCabinet,
    "overlook-cabinet": baseCab,
    "overlook-mirror": mirrorWall,
    "overlook-trolley": luggageTrolley,
    "overlook-palm": lobbyPalm,
    "overlook-photo-1921": photo1921,
    "overlook-poster-alpine": posterAlpine,
  },
  wall: [
    { grid: "overlook-keyrack", shelves: [[3, 28, 34]], goods: ["overlook-register", "overlook-key-fob", "overlook-bell"] },
    { grid: "overlook-cabinet", shelves: [[3, 28, 18], [3, 28, 34]], goods: ["overlook-register", "overlook-key-fob", "overlook-bell", "overlook-phone"] },
  ],
  narrow: ["overlook-mirror"],
  counter: {
    grid: "overlook-counter",
    top: 7,
    goods: ["overlook-register", "overlook-desk-lamp", "overlook-bell", "overlook-phone", "overlook-key-fob"],
  },
  floor: ["overlook-trolley", "overlook-palm"],
  hung: ["overlook-photo-1921", "overlook-poster-alpine"],
};

// --- Overlook Kitchen & Cold Storeroom Fit ---
const calumetTin = [
  ".;;;;;;.",
  ";@@@@@@;",
  ";@&&&&@;",
  ";@&@@&@;",
  ";@@@@@@;",
  ";!!!!!!;",
  ".::::::.",
];
const peachCan = [
  ".;;;;;;.",
  ";^^^^^^;",
  ";^@@@@^;",
  ";^&@@&^;",
  ";^^^^^^;",
  ";%%%%%%;",
  ".::::::.",
];
const tomatoCan = [
  ".;;;;;;.",
  ";((((((;",
  ";(@@@@(;",
  ";($$$$(;",
  ";((((((;",
  ";)))))):",
  ".::::::.",
];
const stockpot = [
  "..uMMMMu..",
  ".uM&&&&Mu.",
  "u%^^^^^^%u",
  ".%^^^^^^%.",
  ".%^^&&^^%.",
  ".%^^^^^^%.",
  ".%%%%%%%%.",
  "..uuuuuu..",
];
const steelBowl = [
  ".;;;;;;;;.",
  ";::::;;;;;",
  ".::::::::.",
  "..,,,,,,..",
];
const knifeBlock = [
  "..;;..;;..",
  "..::..::..",
  ".qyyyyyyq.",
  ".qtrrrreq.",
  ".qteeeewq.",
  ".qqqqqqqq.",
];

// Stainless-steel prep counter (32px wide).
const steelCounter = [
  ",".repeat(32),
  ...Array<string>(4).fill(rep(",;", ";", ":,", 28)),
  rep(",:", ":", ":,", 28),
  ",".repeat(32),
  ...Array<string>(7).fill(",:;;;;;;::;;;;;;::;;;;;;::;;;;:,"),
  rep(",:", ":", ":,", 28),
  ",:::,,,,,,,,,,,,,,,,,,,,,,,,:::,",
  ",:::,,,,,,,,,,,,,,,,,,,,,,,,:::,",
];

// Tall steel kitchen pantry rack loaded with canned goods & Calumet tins.
const pantryRack = [
  "," + ":".repeat(30) + ",",
  ...Array<string>(36).fill(",:" + "|".repeat(28) + ":,"),
  "," + ":".repeat(30) + ",",
];
for (const sy of [9, 18, 27, 35]) {
  pantryRack[sy] = "," + ";".repeat(30) + ",";
  pantryRack[sy + 1] = "," + ":".repeat(30) + ",";
}

// Heavy brushed-steel walk-in dry-goods storeroom door (32px wide).
const storeroomDoor = [
  ",".repeat(32),
  ",::::::::::::::::::::::::::::::,",
  ",:;;;;;;;;;;;;;;;;;;;;;;;;;;;;:,",
  ",:;::::::::::::::::::::::::::;:,",
  ",:;:;;;;;;;;;;;;;;;;;;;;;;;;;:;,",
  ",:;:;::::::::::::::::::::::;:;:,",
  ",:;:;:;;;;;;;;;;;;;;;;;;;;;:;:;,",
  ",:;:;:;:::::;;;;;;;;::::::;:;:;,",
  ",:;:;:;::::;,,,,,,,,;:::::;:;:;,",
  ",:;:;:;::::;,,,,,,,,;:::::;:;:;,",
  ",:;:;:;::::;;;;;;;;;;:::::;:;:;,",
  ",:;:;:;;;;;;;;;;;;;;;;;;;;;:;:;,",
  ...Array<string>(5).fill(",:;:;:;::::::::::::::::::::;:;:,"),
  ",:;:;:;:::::::::::::::::uMMu:;:,",
  ",:;:;:;:::::::::::::::uMMMMu:;:,",
  ",:;:;:;:::::::::::::::::uMMu:;:,",
  ...Array<string>(15).fill(",:;:;:;::::::::::::::::::::;:;:,"),
  ",:;:;;;;;;;;;;;;;;;;;;;;;;;;;:;,",
  ",::::::::::::::::::::::::::::::,",
  ",".repeat(32),
];

const canCrate = compose(22, 18, [
  [calumetTin, 1, 2],
  [peachCan, 8, 2],
  [tomatoCan, 14, 2],
  [
    [
      "q".repeat(22),
      "q" + "y".repeat(20) + "q",
      "q" + "t".repeat(20) + "q",
      "q" + "r".repeat(20) + "q",
      "q" + "e".repeat(20) + "q",
      "q" + "w".repeat(20) + "q",
      "q" + "t".repeat(20) + "q",
      "q" + "e".repeat(20) + "q",
      "q".repeat(22),
    ],
    0,
    9,
  ],
]);

const hangingPans = [
  ".,,,,,,,,,,,,.",
  ".:::::;;:::::.",
  "..%...%%...%..",
  ".%^^.%^^%.%^^.",
  ".%^&.%^^&.%^&.",
  ".%^^.%^^%.%^^.",
  "..%%..%%...%%.",
  "..............",
];
const menuSlate = [
  "qyyyyyyyyyyyyq",
  "q,,,,,,,,,,,,q",
  "q,;;,,;;;,,;,q",
  "q,,,,,,,,,,,,q",
  "q,;;;;,,;;;,,q",
  "q,,,,,,,,,,,,q",
  "q,;;,,,;;;;,,q",
  "q,,,,,,,,,,,,q",
  "q,;;;,,;;,,;,q",
  "q,,,,,,,,,,,,q",
  "qeeeeeeeeeeeeq",
  "qqqqqqqqqqqqqq",
];

export const overlookKitchen: Fit = {
  ink: {
    "!": 0x7c141c, "@": 0xc82428, $: 0xe85c58,
    "%": 0x9c5a18, "^": 0xdc9830, "&": 0xf8de78,
    "(": 0x266c44, ")": 0x1c4e32,
    ";": 0xe4eaec, ":": 0x9ca6ac, ",": 0x3c464e,
    "|": 0x2a3438,
  },
  grids: {
    "ok-calumet": calumetTin,
    "ok-peach": peachCan,
    "ok-tomato": tomatoCan,
    "ok-pot": stockpot,
    "ok-bowl": steelBowl,
    "ok-knives": knifeBlock,
    "ok-counter": steelCounter,
    "ok-pantry": pantryRack,
    "ok-storeroom": storeroomDoor,
    "ok-can-crate": canCrate,
    "ok-pans": hangingPans,
    "ok-slate": menuSlate,
  },
  wall: [
    { grid: "ok-pantry", shelves: [[2, 29, 9], [2, 29, 18], [2, 29, 27], [2, 29, 35]], goods: ["ok-calumet", "ok-peach", "ok-tomato"] },
    { grid: "ok-storeroom" },
  ],
  counter: {
    grid: "ok-counter",
    top: 6,
    goods: ["ok-pot", "ok-calumet", "ok-bowl", "ok-knives", "ok-peach"],
  },
  floor: ["ok-can-crate"],
  hung: ["ok-pans", "ok-slate"],
};
