import { cabinet, compose, cupboard, recolor } from "../sprites";
import type { Fit } from "./index";

/** A grocer's of the 1920s to 50s: packets and tins by brand on open
 * shelves behind a long counter, the till and a fan scale on it, sweets in
 * glass jars, produce in crates by the door. */

const yellow = { "!": "%", "@": "^", $: "&" }, green = { "!": "(", "@": ")", $: "-" }, blue = { "!": "[", "@": "]", $: "_" };

const tin = [
  ".RRRRN.",
  "RRRRRNL",
  "$@@@@!!",
  "$@KK@!!",
  "$KKKK!!",
  "$@KK@!!",
  "$@@@@!!",
  "NRRRNLL",
  ".LLLLL.",
];
const box = [
  ".&&&&&&%",
  "^^^^^^^%",
  "^^^^^^^%",
  "^KKKKK^%",
  "^K@@@K^%",
  "^K@@@K^%",
  "^KKKKK^%",
  "^^^^^^^%",
  "^,,,,,^%",
  "^^^^^^^%",
  "^^^^^^^%",
  "%%%%%%%%",
];
const jar = [
  "..NRRN..",
  ".LNNNNL.",
  "..YEEY..",
  ".YE$$@Y.",
  "YE$@@@@Y",
  "YE@@$@!Y",
  "YE@@@@!Y",
  "YE@$@@!Y",
  "YZ@@@$!Y",
  "YZ@@@@!Y",
  ".Y!!!!Y.",
  "..YYYY..",
];
const bottle = [
  "..@..",
  "..(..",
  "..(..",
  ".()(.",
  "()-((",
  "(KKK(",
  "(K,K(",
  "(KKK(",
  "()-((",
  "())((",
  "())((",
  ".(((.",
];
const bag = [
  "..____..",
  ".]____[.",
  ".]]]]][.",
  "]_]]]][[",
  "]_KKK][[",
  "]_K,K][[",
  "]_KKK][[",
  "]_]]]][[",
  "]]]]]][[",
  ".[[[[[[.",
];
const jam = [
  ".KKK.",
  "KKKKp",
  ".YEY.",
  "Y$@!Y",
  "Y@@!Y",
  "Y@@!Y",
  ".YYY.",
];

const till = [
  "....uMMMMMMu....",
  "....m,KK,KKm....",
  "....m,KK,KKm....",
  "...uMMMMMMMMu...",
  "..uMMmMmMmMmmu..",
  ".uMmmmmmmmmmmmu.",
  ".uMm;m;m;m;mmu.N",
  ".uMmmmmmmmmmmuNN",
  ".uMm;m;m;m;mmuN.",
  ".uMmmmmmmmmmmmu.",
  "uMMmmmmmmmmmmmmu",
  "uuuuuuuuuuuuuuuu",
  "qyyyyyyyyyyyyyyq",
  "qtrrrrrMMrrrrreq",
  "qteeeeeeeeeeeewq",
  "qqqqqqqqqqqqqqqq",
];
const scale = [
  "..:;;;;;;;;;;:..",
  ".:;;,;;,;;,;;;:.",
  ":;;;;;;;@;;;;;;:",
  ":;;;;;;@;;;;;;;:",
  ".::;;;;@;;;;;::.",
  "...:::;@;:::....",
  "......!@$.......",
  "......!@$.......",
  "......!@$.......",
  ".uMMMMMMMMMMMMu.",
  "..uuuuuuuuuuuu..",
  "....!@@@@@@$....",
  "..!@@@@@@@@@@$..",
  ".!@@@@@@@@@@@@$.",
  ".!!!!!!!!!!!!!!.",
];
const cheese = [
  "...$$$$$$...",
  ".$$$$$&&&$$.",
  "$$$$$&&^^@@!",
  "@@@@@^^^%@!!",
  "@@@@@^^%%!!!",
  ".@@@@@!!!!!.",
  "yttttttttttr",
  ".eeeeeeeeee.",
];
const eggs = [
  "...SDDDS...",
  "..S.....S..",
  ".S.KK.KK.S.",
  ".DKKKKKKKD.",
  "GHKpKKpKKHF",
  "FGFGFGFGFDS",
  "DFGFGFGFGDS",
  ".DFDFDFDDS.",
  "..SSSSSSS..",
];

const lamp = [
  "..))))))..",
  ".))-))))(.",
  "))-))))))(",
  "((((((((((",
  "....mM....",
  "....mM....",
  "....mM....",
  "....mM....",
  "..uMMMMu..",
  ".uuuuuuuu.",
];
const rep = (l: string, mid: string, r: string, n: number) => l + mid.repeat(n) + r;
const drawer = ["ytttttttr", "trrrrrrre", "trkkkkkre", "trrMMMrre", "trruuurre", "treeeeeee", "wwwwwwwww"];
const shelves = cabinet(32, [14, 14], cupboard(32), "|");
const bins = cabinet(32, [14, 14], [...drawer, ...drawer].map((row) => "w" + row + row + row), "|");

const panel = [
  "eeeeeeeeeeeeeeee",
  "rrrrrrrrrrrrrrrr",
  "rwwwwwwwwwwwwwwr",
  "rwttttttttttttwr",
  ...Array<string>(8).fill("rwtrrrrrrrrrrewr"),
  "rwteeeeeeeeeeewr",
  "rwwwwwwwwwwwwwwr",
  "rrrrrrrrrrrrrrrr",
  "eeeeeeeeeeeeeeee",
];
// A scrubbed white top on a front painted green, as shop fronts and fittings were between the wars.
const counter = [
  "q".repeat(32),
  ...Array<string>(5).fill(rep("q;", ";", ";q", 28)),
  rep("q;", ":", ":q", 28),
  rep("q;", ";", ";q", 28),
  rep("q:", ":", ":q", 28),
  ...recolor(panel.map((row) => "trrrrrre" + row + "errrrrrw"), { r: ")", w: "(", t: "-", e: "(" }).map((row) => "q" + row.slice(1, -1) + "q"),
  "q".repeat(32),
];

const sign = [
  ";;;;;;;;;;;;;;;;",
  ";]]]]]]]]]]]]]];",
  ";]];;;;;;;;;;]];",
  ";]];]];]];;];]];",
  ";]];;;;;;;;;;]];",
  ";]]]]]]]]]]]]]];",
  ";]]^^^^^^^^^^]];",
  ";]]]]]]]]]]]]]];",
  ";[[[[[[[[[[[[[[;",
  "::::::::::::::::",
];
const disc = [
  "...@@@@@...",
  ".@@$$$$@@!.",
  ".@$$$$$@@!.",
  "@$;;;;;;;@!",
  "@@;@;@;@;@!",
  "@@;;;;;;;@!",
  "@@@@@@@@@!!",
  ".@@@@@@@!!.",
  ".!@@@@@!!!.",
  "...!!!!!...",
];
const calendar = [
  "KKKKKKKKK",
  "K_____]]p",
  "K__&&_]]p",
  "K))))))(p",
  "KKKKKKKKp",
  "K@@@@@@@p",
  "KK,K,K,Kp",
  "KKKKKKKKp",
  "KK,K,K,Kp",
  "KKKKKKKKp",
  "KK,K,K,Kp",
  "pppppppp.",
];

// A refrigerator with its compressor on top, as sold from 1927.
const fridge = [
  "...:;;;;;;:.....",
  "..:;;;;;;;;:....",
  "..:,,,,,,,,:....",
  "..:;;;;;;;;:....",
  "..:,,,,,,,,:....",
  "..:;;;;;;;;:....",
  "...::::::::.....",
  ".;;;;;;;;;;;;:,.",
  ".;::::::::::;:,.",
  ...Array.from({ length: 18 }, (_, j) => (j === 2 || j === 15 ? ".;N;;;;;;;;:;:,." : j > 5 && j < 11 ? ".;:;;;;;;NL:;:,." : ".;:;;;;;;;;:;:,.")),
  ".;::::::::::;:,.",
  ".;;;;;;;;;;;;:,.",
  ".::::::::::::,,.",
  ...Array<string>(4).fill("..:,........:,.."),
];
const fruit = (rows: string[]) => ["qyyyyyyyyyyyyq", ...rows.map((row) => "q" + row + "q"), "qtttttttttttwq", "qtrrrrrrrrrrwq", "qteeeeeeeeeewq", "qwwwwwwwwwwwwq", "qqqqqqqqqqqqqq"];
const apples = fruit(["$@,$@,$@,$@,", "@!,@!,@!,@!,", ",$@,$@,$@,$@", ",@!,@!,@!,@!"]);
const cabbages = fruit([",-)),-)),-))", "-)))-)))-)))", ")))()))()))(", ",)((,)((,)(("]);
const legs = Array<string>(4).fill("we..........we");
const produce = compose(30, 22, [
  [cabbages, 1, 0], [recolor(apples, yellow), 15, 0],
  [apples, 0, 7], [recolor(apples, { "!": ">", "@": "<", $: "&" }), 16, 7],
  [legs, 0, 17], [legs, 16, 17],
]);
const barrel = [
  "...qqqqqqqq...",
  ".qqyyyyyyyyqq.",
  "qyytttttttttyq",
  "qtyyyyyyyyyytq",
  "qtrrtrrtrrterq",
  "qNNNNNNNNNNNLq",
  ...Array<string>(7).fill("qtrrtrrtrrtewq"),
  "qNNNNNNNNNNNLq",
  "qtrrtrrtrrtewq",
  "qtrrtrrtrrtewq",
  ".qrrerrerrewq.",
  "..qqqqqqqqqq..",
];
const sack = [
  "...DGHHGD....",
  "..D89+98GD...",
  ".DG9+898+GS..",
  ".GHGGGGGGFD..",
  "DGHGFFFFFFDS.",
  "DHGFFFFFFDDS.",
  "DHGFFFFFFDDS.",
  "DGGFFFFFFDDS.",
  "DGFFFFFFDDSS.",
  "DGFFFFFDDDSS.",
  ".DFFFDDDDSS..",
  "..SSSSSSSS...",
];
const crate = [
  "qyyyyyyyyyyyyyyq",
  "qtttttttttttttwq",
  "qtrrrrrrrrrrrrwq",
  "qteeeeeeeeeeeewq",
  "qwwwwwwwwwwwwwwq",
  "qtttttttttttttwq",
  "qtrr,,r,,,rrrrwq",
  "qteeeeeeeeeeeewq",
  "qwwwwwwwwwwwwwwq",
  "qtttttttttttttwq",
  "qqqqqqqqqqqqqqqq",
];
const pops = [
  "qyyyyyyyyyyyq",
  "q,@,,@,,@,,wq",
  "q,!,,!,,!,,wq",
  "q,@,,@,,@,,wq",
  "q,!,,!,,!,,wq",
  "qtttttttttttq",
  "qt@@@@@@@@@wq",
  "qt@;;@;;;@@wq",
  "qt@@@@@@@@@wq",
  "qteeeeeeeeewq",
  "qqqqqqqqqqqqq",
];
const pyramid = compose(23, 25, [
  [tin, 8, 0], [recolor(tin, yellow), 4, 7], [recolor(tin, blue), 12, 7],
  [recolor(tin, green), 0, 14], [tin, 8, 14], [recolor(tin, yellow), 16, 14],
  [["qyyyyyyyyyyyyyyyyyyyyyq", "qtrrrrrrrrrrrrrrrrrrrwq", "qqqqqqqqqqqqqqqqqqqqqqq"], 0, 22],
]);

export const grocer: Fit = {
  ink: {
    "!": 0x7a1c18, "@": 0xc23a2c, $: 0xe8705a,
    "%": 0xb07a1c, "^": 0xe8b830, "&": 0xf8e080,
    "(": 0x2a5a30, ")": 0x4a9a48, "-": 0x8acc6a,
    "[": 0x1e3a6a, "]": 0x3a6ab0, _: 0x7aa8dc,
    ";": 0xf4f4ee, ":": 0xbcc4c8, ",": 0x2a2024,
    "<": 0xe88a2a, ">": 0xb85a18, "|": 0x33201a,
  },
  grids: {
    "grocer-tin": tin, "grocer-tin-y": recolor(tin, yellow), "grocer-tin-g": recolor(tin, green), "grocer-tin-b": recolor(tin, blue),
    "grocer-box": box, "grocer-box-r": recolor(box, { "%": "!", "^": "@", "&": "$", "@": "^" }), "grocer-box-b": recolor(box, { "%": "[", "^": "]", "&": "_" }),
    "grocer-jar": jar, "grocer-jar-y": recolor(jar, yellow), "grocer-jar-g": recolor(jar, green),
    "grocer-bottle": bottle, "grocer-milk": recolor(bottle, { "(": ":", ")": ";", "-": ";", "@": "]" }),
    "grocer-bag": bag, "grocer-jam": jam, "grocer-marmalade": recolor(jam, { "!": ">", "@": "<", $: "&" }),
    "grocer-till": till, "grocer-lamp": lamp, "grocer-scale": scale, "grocer-cheese": cheese, "grocer-eggs": eggs,
    "grocer-shelves": shelves, "grocer-bins": bins, "grocer-counter": counter,
    "grocer-sign": sign, "grocer-disc": disc, "grocer-calendar": calendar,
    "grocer-produce": produce, "grocer-fridge": fridge,
    "grocer-barrel": compose(30, 20, [[barrel, 0, 0], [sack, 16, 8]]),
    "grocer-crates": compose(30, 21, [[crate, 0, 10], [pops, 2, 0], [recolor(apples, yellow), 16, 9]]),
    "grocer-pyramid": pyramid,
  },
  wall: [
    { grid: "grocer-shelves", shelves: [[3, 28, 18], [3, 28, 34]], goods: ["grocer-tin", "grocer-box", "grocer-tin-y", "grocer-bag", "grocer-tin-g", "grocer-box-r", "grocer-tin-b", "grocer-box-b"] },
    { grid: "grocer-bins", shelves: [[3, 28, 18], [3, 28, 34]], goods: ["grocer-jar", "grocer-bottle", "grocer-jam", "grocer-jar-y", "grocer-milk", "grocer-marmalade", "grocer-jar-g"] },
  ],
  narrow: ["grocer-fridge"],
  counter: { grid: "grocer-counter", top: 7, goods: ["grocer-till", "grocer-lamp", "grocer-scale", "grocer-jar", "grocer-cheese", "grocer-jar-y", "grocer-eggs", "grocer-jar-g"] },
  floor: ["grocer-produce", "grocer-barrel", "grocer-crates", "grocer-pyramid"],
  hung: ["grocer-sign", "grocer-calendar", "grocer-disc"],
};
