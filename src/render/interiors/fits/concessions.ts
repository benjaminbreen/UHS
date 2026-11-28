import { cabinet, compose, cupboard, recolor } from "../sprites";
import type { Fit } from "./index";

/** A cinema concessions stand and lobby fit: popcorn warmer, glazed candy case,
 * soda fountain, backlit menu board, framed movie posters, velvet rope
 * stanchions and a retro arcade cabinet. */

const yellow = { "!": "%", "@": "^", $: "&" };
const teal = { "!": "(", "@": ")", $: "-" };
const blue = { "!": "[", "@": "]", $: "_" };

const tub = [
  "..&&^&&.",
  ".&^&&&^%",
  ".q@@@@@q",
  ".q@;@;@q",
  ".q@;@;@q",
  ".q@;@;@q",
  ".q!@!@!q",
  ".q!;!;!q",
  "..q!!!q.",
  "..qqqqq.",
];
const cup = [
  "...;..",
  "..;;..",
  ".::::.",
  ".q@@q.",
  ".q;;q.",
  ".q@@q.",
  ".q;;q.",
  ".q!!q.",
  "..qq..",
];
const candy = [
  ".$$$$$%",
  "@@@@@@%",
  "@;;;;@%",
  "@;,,;@%",
  "@;;;;@%",
  "@@@@@@%",
  "!!!!!!%",
  ".%%%%%.",
];
const syrup = [
  "..:..",
  "..@..",
  ".@@@.",
  "@;;;@",
  "@;,;@",
  "@;;;@",
  "@@@@@",
  "@!!!@",
  ".!!!.",
];

// Glass popcorn popper and warmer; the `-lamp` suffix gives it a warm counter glow.
const popcornLamp = [
  "..%^^^^^^^^^%.",
  ".%@@@@@@@@@@@%",
  ".%!&&&&&&&&&!%",
  ".uMMMMMMMMMMMu",
  ".YEE&^&&^&EEZY",
  ".YE,uMMMMu,EZY",
  ".YE,,uuuu,,EZY",
  ".YE..&^&..EEZY",
  ".YE.&&^&&..EZY",
  ".Y^&&^&&&^&EZY",
  ".Y&&^&&&^&&^ZY",
  ".Y^&&^&^&&^%ZY",
  ".uMMMMMMMMMMMu",
  ".q@@@@@@@@@@@q",
  ".q@;;;@;;;@@!q",
  ".q@@@@@@@@@!!q",
  ".q!!!!!!!!!!!q",
  ".qqqqqqqqqqqqq",
];

// Multi-tap fountain soda dispenser with flavour panels and drip grate.
const soda = [
  ".:::::::::::.",
  ":;;;;;;;;;;;:",
  ":;@@;^^;));;:",
  ":;!!;%%;((;;:",
  ":::::::::::::",
  ":;N;;N;;N;;::",
  ":;L;;L;;L;;::",
  ":::::::::::::",
  ":,,,,,,,,,:::",
  ":;;:;;:;;:::,",
  ":,,:,,:,,:::,",
  ":::::::::::::",
  ".;;;;;;;;;;;.",
  ".:::::::::::.",
];

const till = [
  "...uMMMMMMu...",
  "...m,&&,&&m...",
  "...m,&&,&&m...",
  "..uMMMMMMMMu..",
  ".uMMmMmMmMmmu.",
  "uMmmmmmmmmmmmu",
  "uMm;m;m;m;mmmu",
  "uMmmmmmmmmmmmu",
  "uMm;m;m;m;mmmu",
  "uMMmmmmmmmmmmu",
  "uuuuuuuuuuuuuu",
  "qyyyyyyyyyyyyq",
  "qtrrrrMMrrrreq",
  "qqqqqqqqqqqqqq",
];

const candyTray = [
  ".qqqqqqqqq.",
  "q@@^^))]]wq",
  "q!!%%(([[wq",
  "qtrrrrrrrwq",
  "qteeeeeeewq",
  "qqqqqqqqqqq",
];

// Concessions counter: polished cream top over an angled glass candy showcase and ribbed crimson plinth.
const rep = (l: string, mid: string, r: string, n: number) => l + mid.repeat(n) + r;
const candyRow = (pat: string) => "qY" + pat.repeat(7) + "Zq";
const counter = [
  "q".repeat(32),
  ...Array<string>(4).fill(rep("q;", ";", ";q", 28)),
  rep("q;", ":", ":q", 28),
  rep("qu", "M", "uq", 28),
  rep("qY", "E", "Zq", 28),
  candyRow("@@^^"),
  candyRow("!!%%"),
  rep("qY", "Z", "Zq", 28),
  candyRow("))]]"),
  candyRow("(([["),
  rep("qY", "Y", "Yq", 28),
  rep("qu", "M", "uq", 28),
  ...Array<string>(6).fill("q" + "!@!@!@!@!@!@!@!@!@!@!@!@!@!@!@" + "q"),
  rep("qu", "m", "uq", 28),
  "q".repeat(32),
];

// Back wall: backlit marquee menu board over a stocked shelf and cupboard.
const baseCab = cabinet(32, [14, 14], cupboard(32), "|");
const menuBoard = [
  ".quMMMMMMMMMMMMMMMMMMMMMMMMMMuq.",
  ".qm%^^^^^^^^^^^^^^^^^^^^^^^^%mq.",
  ".qm^&&&&&&&&&&&&&&&&&&&&&&&&^mq.",
  ".qm^;;@@;@@;@@;@@;@@;@@;@@;;^mq.",
  ".qm^;;;;;;;;;;;;;;;;;;;;;;;;^mq.",
  ".qm^;;,,,,;,;;,,,;;;,;^&&^;;^mq.",
  ".qm^;;;;;;;;;;;;;;;;;;;;;;;;^mq.",
  ".qm^;;,,,;,,;;,,,;;;,;^&&^;;^mq.",
  ".qm^;;;;;;;;;;;;;;;;;;;;;;;;^mq.",
  ".qm^;;,,,,;;,,,;,,;;,;^&&^;;^mq.",
  ".qm^;;;;;;;;;;;;;;;;;;;;;;;;^mq.",
  ".qm^;;,,;,,,;;,,;,,;;;)--);;^mq.",
  ".qm%^^^^^^^^^^^^^^^^^^^^^^^^%mq.",
  ".quMMMMMMMMMMMMMMMMMMMMMMMMMMuq.",
];
const menuCabinet = [...baseCab.slice(0, 4), ...menuBoard, ...baseCab.slice(18)];

// Tall glass-front chilled drink cooler (1 tile wide).
const cooler = [
  "..::::::::::::..",
  ".:;;;;;;;;;;;;:.",
  ".:;@@;@@@@;@@;:.",
  ".:;;;;;;;;;;;;:.",
  ".:YEEEEEEEEEZY:.",
  ".:YE@;^;);];ZY:.",
  ".:YE!;%;(;[[ZY:.",
  ".:Y:::::::::ZY:.",
  ".:YE];);@;^;ZY:.",
  ".:YE[(;!;%%;ZY:.",
  ".:Y:::::::::ZY:.",
  ".:YE^;@;];);ZY:.",
  ".:YE%;!;[(;;ZY:.",
  ".:Y:::::::::ZY:.",
  ".:YE@;);^;];ZY:.",
  ".:YE!;(;%;[[ZY:.",
  ".:YZZZZZZZZZZY:.",
  ".::::::::::::::.",
  ".:;;;;;;;;;;;;:.",
  ".:;::::::::::;:.",
  ".:;,,,,,,,,,,;:.",
  ".:;::::::::::;:.",
  ".:;,,,,,,,,,,;:.",
  ".::::::::::::::.",
  "..:,........,:..",
  "..:,........,:..",
];

// Backlit movie poster cases (14x18) hung in lobbies and multiplex concourses.
const posterFrame = (art: string[]) => [
  "uMMMMMMMMMMMMu",
  "M;;;;;;;;;;;;M",
  ...art.map((row) => "M;" + row + ";M"),
  "M;;;;;;;;;;;;M",
  "uuuuuuuuuuuuuu",
];
const posterScifi = posterFrame([
  "[[[[[[[[[[[[",
  "[[&[[[[[[&[[",
  "[[[[[&&^[[[[",
  "[[[&^%%^&[[[",
  "[[[&&^^&&[[[",
  "[[[[[__[[[[[",
  "[[[[]]]]][[[",
  "[[$@[[[[[[[[",
  "[[[[$@[[[[[[",
  "[[[[[[$@[[[[",
  "]]]]]]]]]]]]",
  "&&&&&&&&&&&&",
  "@@;;@@;;@@;;",
  "!!!!!!!!!!!!",
]);
const posterWestern = posterFrame([
  "&&&&&&&&&&&&",
  "^^^^^^^^^^^^",
  "<<<<<<<<<<<<",
  "<<<<<&&<<<<<",
  ">>>>>^^>>>>>",
  ">>>,,,>>>,,>",
  ">>,,,,>>,,,>",
  ",,,,,,>,,,,,",
  ",,,,,,,,,,,,",
  "!!!!!!!!!!!!",
  "@@@@@@@@@@@@",
  "@;;;@@;;;@@;",
  "@@@@@@@@@@@@",
  "!!!!!!!!!!!!",
]);
const posterNoir = posterFrame([
  "[[[[[[[[[[[[",
  "[[,,[[[[,,[[",
  "[[,[,[[[,[,[",
  "[,[[&[[[[[,[",
  "[,[&&&[[[[,[",
  "[,&&;&&[[[,[",
  "[,&;;;&[[[,[",
  "[,(((((,,[,[",
  "((((()))))))",
  "((((----((((",
  "[[[[[[[[[[[[",
  "^^^^^^^^^^^^",
  "^;;^;;^;;;^^",
  "%%%%%%%%%%%%",
]);
const posterAction = posterFrame([
  "!!!!!!!!!!!!",
  "!@@@@$$@@@@!",
  "!@@@$$$$@@@!",
  "!@@$$&&$$@@!",
  "!@@$&&&&$@@!",
  "!@@,,,,,$@@!",
  "!@,,--,,,@@!",
  "!@,,)))-,@@!",
  "!@@,,,,,$@@!",
  "!!!!!!!!!!!!",
  "^^^^^^^^^^^^",
  "&;;&&;;;&&;&",
  "^^^^^^^^^^^^",
  "%%%%%%%%%%%%",
]);

// Floor display: pair of brass-topped velvet rope stanchions + crimson lobby bin.
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
const bin = [
  ".uMMMMMMMMu.",
  "uM,,,,,,,,Mu",
  "q@@@@@@@@@@q",
  "q@$$$$$$$$@q",
  "q@!!!!!!!!@q",
  "q@@@@@@@@@@q",
  "q@!!!!!!!!@q",
  "q@@@@@@@@@@q",
  "q@!!!!!!!!@q",
  "q!!!!!!!!!!q",
  "uMMMMMMMMMMu",
];
const stanchion = compose(30, 18, [
  [post, 0, 4],
  [rope, 3, 7],
  [post, 14, 4],
  [bin, 18, 7],
]);

// Floor display: upright retro arcade cabinet with glowing marquee and screen.
const arcade = [
  "..qqqqqqqqqqqqqq..",
  ".q[[[[[[[[[[[[[[q.",
  ".q[@@@@@@@@@@@@[q.",
  ".q[@&&;@@;&&;@@[q.",
  ".q[@@@@@@@@@@@@[q.",
  ".q[[[[[[[[[[[[[[q.",
  ".q[,,,,,,,,,,,,[q.",
  ".q[,[[[[[[[[[[,[q.",
  ".q[,[[--[[--[[,[q.",
  ".q[,[[-[&&[-[[,[q.",
  ".q[,[[[[$$[[[[,[q.",
  ".q[,[[[----[[[,[q.",
  ".q[,[[[[[[[[[[,[q.",
  ".q[,,,,,,,,,,,,[q.",
  "qq[[[[[[[[[[[[[[qq",
  "q[[[@@[[))[[&&[[[q",
  "q[[[!![[(([[%%[[[q",
  "q[[[[[[[[[[[[[[[[q",
  ".q[[[[[[[[[[[[[[q.",
  ".q[[[[[::::[[[[[q.",
  ".q[[[[[:@@:[[[[[q.",
  ".q[[[[[:!!:[[[[[q.",
  ".q[[[[[::::[[[[[q.",
  ".q[[[[[[[[[[[[[[q.",
  ".q[[[[[[[[[[[[[[q.",
  ".qqqqqqqqqqqqqqqq.",
];

// Floor display: freestanding coming-soon poster standee on a brass easel.
const standee = compose(18, 25, [
  [posterScifi, 2, 0],
  [Array<string>(7).fill("..mM..........mM.."), 0, 18],
]);

export const concessions: Fit = {
  ink: {
    "!": 0x7a1622, "@": 0xc82838, $: 0xf2646c,
    "%": 0xb07818, "^": 0xebb830, "&": 0xfae688,
    "(": 0x1a5a5c, ")": 0x389c9a, "-": 0x7cd8d0,
    "[": 0x1c3064, "]": 0x3862b4, _: 0x7ea8f0,
    ";": 0xf6f2e6, ":": 0xb8bec8, ",": 0x261c24,
    "<": 0xeb8826, ">": 0xb85616, "|": 0x2e1a18,
  },
  grids: {
    "concessions-tub": tub,
    "concessions-cup": cup,
    "concessions-candy": candy,
    "concessions-candy-y": recolor(candy, yellow),
    "concessions-candy-g": recolor(candy, teal),
    "concessions-candy-b": recolor(candy, blue),
    "concessions-syrup": syrup,
    "concessions-syrup-a": recolor(syrup, yellow),
    "concessions-popcorn-lamp": popcornLamp,
    "concessions-soda": soda,
    "concessions-till": till,
    "concessions-tray": candyTray,
    "concessions-counter": counter,
    "concessions-menu": menuCabinet,
    "concessions-cabinet": baseCab,
    "concessions-cooler": cooler,
    "concessions-poster-1": posterScifi,
    "concessions-poster-2": posterWestern,
    "concessions-poster-3": posterNoir,
    "concessions-poster-4": posterAction,
    "concessions-stanchion": stanchion,
    "concessions-arcade": arcade,
    "concessions-standee": standee,
  },
  wall: [
    { grid: "concessions-menu", shelves: [[3, 28, 34]], goods: ["concessions-tub", "concessions-cup", "concessions-candy", "concessions-candy-y", "concessions-candy-g", "concessions-candy-b"] },
    { grid: "concessions-cabinet", shelves: [[3, 28, 18], [3, 28, 34]], goods: ["concessions-tub", "concessions-syrup", "concessions-cup", "concessions-candy-y", "concessions-syrup-a", "concessions-candy-g", "concessions-candy-b"] },
    { grid: "concessions-cabinet", shelves: [[3, 28, 18], [3, 28, 34]], goods: ["concessions-candy", "concessions-tub", "concessions-candy-b", "concessions-syrup", "concessions-candy-y", "concessions-cup"] },
  ],
  narrow: ["concessions-cooler"],
  counter: {
    grid: "concessions-counter",
    top: 7,
    goods: ["concessions-popcorn-lamp", "concessions-till", "concessions-soda", "concessions-tub", "concessions-tray", "concessions-cup"],
  },
  floor: ["concessions-stanchion", "concessions-arcade", "concessions-standee"],
  hung: ["concessions-poster-1", "concessions-poster-2", "concessions-poster-3", "concessions-poster-4"],
};

/** Pre-arcade concessions fit (1910–1965): velvet stanchions and coming-soon easels instead of video cabinets. */
export const concessionsClassic: Fit = {
  ...concessions,
  floor: ["concessions-stanchion", "concessions-standee"],
};
