import { cabinet, compose, cupboard, recolor } from "../sprites";
import type { Fit } from "./index";

/** A historic playhouse and opera house box-office foyer fit: brass-grilled
 * mahogany counter, printed playbills, opera glasses, cordials, velvet rope
 * stanchions, framed theatrical posters and gilt portraits. */

const gold = { "!": "%", "@": "^", $: "&" };
const teal = { "!": "(", "@": ")", $: "-" };

const programme = [
  ".;;;;;;.",
  ";,,;;,,;",
  ";;;;;;;;",
  ";,;;,,;;",
  ";;;;;;;;",
  ";;;,,;;;",
  ".::::::.",
];
const bottle = [
  "..:..",
  "..(..",
  ".(((.",
  "(;;;(",
  "(;^;(",
  "(;;;(",
  "(((((",
  "((!((",
  ".(((.",
];
const glasses = [
  ".uMMu.uMMu.",
  "uM&&MuM&&Mu",
  "q]]]]q]]]]q",
  "q[[[[q[[[[q",
  ".qqqq.qqqq.",
];
const sweets = [
  "..uMMu..",
  ".YEEEEY.",
  "YE$@^^EY",
  "YE@$%%EY",
  "YZ$@^^ZY",
  ".YZZZZY.",
  "..YYYY..",
];

// Brass banker's / box-office lamp; `-lamp` suffix gives it a warm counter light.
const boxLamp = [
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

// Brass box-office ticket grille & ledger sitting on the mahogany counter.
const grille = [
  "uMMMMMMMMMMMMu",
  "M&m&m&m&m&m&mM",
  "Mm.m.m.m.m.m.M",
  "Mm.m.m.m.m.m.M",
  "Mm.m.m.m.m.m.M",
  "Mm.m.m.m.m.m.M",
  "Mm.m.m.m.m.m.M",
  "Mm.m.m.m.m.m.M",
  "Mm..;;;;;;..mM",
  "Mm..;,,,,;..mM",
  "uuuuuuuuuuuuuu",
];

const ledger = [
  ".qyyyyyyyyyyq.",
  "q;;;;;;;;;;;;q",
  "q;,;;,;;;,;,;q",
  "q;;;;;;;;;;;;q",
  "q;,,;;,;,;;,;q",
  "q::::::::::::q",
  ".qqqqqqqqqqqq.",
];

const rep = (l: string, mid: string, r: string, n: number) => l + mid.repeat(n) + r;
const panelRow = "qtrrrrrrwwrrrrrrwwrrrrrrwwrrrrreq";
const counter = [
  "q".repeat(32),
  ...Array<string>(4).fill(rep("qy", "t", "rq", 28)),
  rep("qt", "r", "eq", 28),
  rep("qu", "M", "uq", 28),
  rep("qt", "e", "wq", 28),
  ...Array<string>(3).fill(panelRow.slice(0, 32)),
  "qtwwwwwuMMuwwwwwwuMMuwwwwwuMMuwq",
  ...Array<string>(4).fill(panelRow.slice(0, 32)),
  rep("qw", "e", "wq", 28),
  rep("qu", "m", "uq", 28),
  "q".repeat(32),
];

// Back wall: gilded playbill & seating-chart board over a mahogany cabinet.
const baseCab = cabinet(32, [14, 14], cupboard(32), "|");
const playbillBoard = [
  ".quMMMMMMMMMMMMMMMMMMMMMMMMMMuq.",
  ".qm@@@@@@@@@@@@@@@@@@@@@@@@@@mq.",
  ".qm@;;^;;;;;;;;;;;;;;;;;;^;;@mq.",
  ".qm@;;;;;;;;;;;;;;;;;;;;;;;;@mq.",
  ".qm@;;,,,,;;,,,;;,,,,;;,,,;;@mq.",
  ".qm@;;;;;;;;;;;;;;;;;;;;;;;;@mq.",
  ".qm@;;,,,;;@@;;,,,,;;@@;;,;;@mq.",
  ".qm@;;;;;;;;;;;;;;;;;;;;;;;;@mq.",
  ".qm@;;,,,,;;,,,;;,,,,;;,,,;;@mq.",
  ".qm@;;;;;;;;;;;;;;;;;;;;;;;;@mq.",
  ".qm@;;;;;;^&&&&&&^;;;;;;;;;;@mq.",
  ".qm@;;;;;;;;;;;;;;;;;;;;;;;;@mq.",
  ".qm@@@@@@@@@@@@@@@@@@@@@@@@@@mq.",
  ".quMMMMMMMMMMMMMMMMMMMMMMMMMMuq.",
];
const billCabinet = [...baseCab.slice(0, 4), ...playbillBoard, ...baseCab.slice(18)];

// Tall narrow gilt mirror / bill pillar (1 tile wide).
const mirror = [
  "..uMMMMMMMMMMu..",
  ".uM&&&&&&&&&&Mu.",
  ".M&YEEEEEEEEY&M.",
  ".M&YEE;;;;EEY&M.",
  ".M&YE;;ZZ;;EY&M.",
  ".M&YE;ZZZZ;EY&M.",
  ".M&YEZZZZZZEY&M.",
  ".M&YZZZZZZZZY&M.",
  ".M&YZZ;;;;ZZY&M.",
  ".M&YZZZZZZZZY&M.",
  ".M&YZZZZZZZZY&M.",
  ".M&YZZZZZZZZY&M.",
  ".M&YYYYYYYYYY&M.",
  ".uM&&&&&&&&&&Mu.",
  "..uMMMMMMMMMMu..",
  "..qyyyyyyyyyyq..",
  "..qtrrrrrrrreq..",
  "..qtrrMMMMrreq..",
  "..qteeeeeeeewq..",
  "..qqqqqqqqqqqq..",
  "..qtq......qeq..",
  "..qqq......qqq..",
];

// Framed playbills and theatrical portraits (14x18) hung in foyers and crush galleries.
const giltFrame = (art: string[]) => [
  "uMMMMMMMMMMMMu",
  "M&&&&&&&&&&&&M",
  ...art.map((row) => "M&" + row + "&M"),
  "M&&&&&&&&&&&&M",
  "uuuuuuuuuuuuuu",
];
const playbillTragedy = giltFrame([
  ";;;;;;;;;;;;",
  ";@@;@@@@;@@;",
  ";;;;;;;;;;;;",
  ";;;@@@@@@;;;",
  ";;@;;;;;;@;;",
  ";;@;,;;,;@;;",
  ";;@;;;;;;@;;",
  ";;@;;,,;;@;;",
  ";;;@@@@@@;;;",
  ";;;;;;;;;;;;",
  ";,,;;,,,;,,;",
  ";;;;;;;;;;;;",
  ";;;;;,,;;;;;",
  "::::::::::::",
]);
const playbillOpera = giltFrame([
  "[[[[[[[[[[[[",
  "[[&&&&&&&&[[",
  "[[&@@@@@@&[[",
  "[[&@$$$$@&[[",
  "[[&@;;;;@&[[",
  "[[&@;^^;@&[[",
  "[[&@;;;;@&[[",
  "[[&@@@@@@&[[",
  "[[&&&&&&&&[[",
  "[[[[[[[[[[[[",
  "^^^^^^^^^^^^",
  "^;;^;;^;;^;;",
  "^^^^^^^^^^^^",
  "%%%%%%%%%%%%",
]);
const playbillBallet = giltFrame([
  "[[[[[[[[[[[[",
  "[[[[[&&[[[[[",
  "[[[[&;;&[[[[",
  "[[[[[;;[[[[[",
  "[[[;;;;;;[[[",
  "[[;;;;;;;;[[",
  "[[[;;::;;[[[",
  "[[[[;::;[[[[",
  "[[[[;[[;[[[[",
  "[[[[[[[[[[[[",
  "@@@@@@@@@@@@",
  "@;;;@@;;;@@;",
  "@@@@@@@@@@@@",
  "!!!!!!!!!!!!",
]);

const post = [
  ".uMMu.",
  ".M&&M.",
  ".uMMu.",
  "..mM..",
  "..mM..",
  "..mM..",
  "..mM..",
  "..mM..",
  "..mM..",
  "..mM..",
  "..mM..",
  "..mM..",
  ".uMMu.",
  "uMMMMu",
];
const rope = [
  "$............$",
  "@$..........$@",
  "!@$........$@!",
  ".!@$......$@!.",
  "..!@@$$$$@@!..",
  "...!@@@@@@!...",
  "....!!!!!!....",
];
const stanchion = compose(22, 18, [
  [post, 0, 4],
  [rope, 3, 7],
  [post, 14, 4],
]);
const easel = compose(18, 25, [
  [playbillOpera, 2, 0],
  [Array<string>(7).fill("..qt..........eq.."), 0, 18],
]);

export const boxoffice: Fit = {
  ink: {
    "!": 0x6e1420, "@": 0xa82230, $: 0xd85862,
    "%": 0x9c6a18, "^": 0xd8a832, "&": 0xf4dc80,
    "(": 0x1c4a3a, ")": 0x327a5e, "-": 0x6ab494,
    "[": 0x1c2850, "]": 0x364e88, _: 0x7490c4,
    ";": 0xf2ead8, ":": 0xb8b0a0, ",": 0x261c1a,
    "|": 0x281814,
  },
  grids: {
    "boxoffice-programme": programme,
    "boxoffice-bottle": bottle,
    "boxoffice-bottle-g": recolor(bottle, gold),
    "boxoffice-glasses": glasses,
    "boxoffice-sweets": sweets,
    "boxoffice-sweets-g": recolor(sweets, teal),
    "boxoffice-lamp": boxLamp,
    "boxoffice-grille": grille,
    "boxoffice-ledger": ledger,
    "boxoffice-counter": counter,
    "boxoffice-board": billCabinet,
    "boxoffice-cabinet": baseCab,
    "boxoffice-mirror": mirror,
    "boxoffice-poster-1": playbillOpera,
    "boxoffice-poster-2": playbillTragedy,
    "boxoffice-poster-3": playbillBallet,
    "boxoffice-stanchion": stanchion,
    "boxoffice-easel": easel,
  },
  wall: [
    { grid: "boxoffice-board", shelves: [[3, 28, 34]], goods: ["boxoffice-programme", "boxoffice-glasses", "boxoffice-sweets", "boxoffice-bottle"] },
    { grid: "boxoffice-cabinet", shelves: [[3, 28, 18], [3, 28, 34]], goods: ["boxoffice-bottle", "boxoffice-bottle-g", "boxoffice-sweets", "boxoffice-sweets-g", "boxoffice-glasses", "boxoffice-programme"] },
  ],
  narrow: ["boxoffice-mirror"],
  counter: {
    grid: "boxoffice-counter",
    top: 7,
    goods: ["boxoffice-grille", "boxoffice-lamp", "boxoffice-ledger", "boxoffice-programme", "boxoffice-glasses", "boxoffice-sweets"],
  },
  floor: ["boxoffice-stanchion", "boxoffice-easel"],
  hung: ["boxoffice-poster-1", "boxoffice-poster-2", "boxoffice-poster-3"],
};
