import { compose, outlined, recolor, SPRITES } from "../sprites";
import type { Fit } from "./index";

/** A Roman bar of the first century, as at Pompeii and Herculaneum: a
 * masonry counter faced with offcuts of coloured marble, storage jars
 * (dolia) sunk in its top, stepped marble shelves for the cups, wine in
 * amphorae racked along the wall and the household gods painted above. */

const bronze = { "+": "M", 9: "M", 8: "m", 7: "u", 6: "u" };

const amphora = outlined([
  "...+98...",
  "..+9987..",
  "...987...",
  ".9.987.7.",
  ".9.987.7.",
  ".9+99877.",
  ".+999876.",
  ".+999876.",
  ".+998876.",
  ".9998876.",
  ".9988766.",
  "..98876..",
  "..98876..",
  "..98766..",
  "...876...",
  "...876...",
  "....76...",
  "....6....",
], "/");
const cup = outlined([
  "+9987",
  "+9987",
  ".987.",
  "..8..",
  ".877.",
], "/");
const jug = recolor(SPRITES.jug, { q: "/" });
const bowls = outlined([
  "$@@@@@@@!",
  ".$@@@@@!.",
  "$@@@@@@@!",
  ".$@@@@@!.",
  "..$@@@!..",
  "...!!!...",
], "/");
const flask = [
  ".<_>.",
  "..<..",
  "..<..",
  ".<_>.",
  "<___>",
  "<__>>",
  "<__>>",
  ".>>>.",
];
const bread = recolor(SPRITES.loaf, { q: "/" });
const olives = outlined([
  ".()|()(.",
  "+9999887",
  ".999887.",
  "..9887..",
  "..7777..",
], "/");
const cauldron = [
  "...uMMMMu...",
  "..uMmmmmmu..",
  ".uMmmmmmmmu.",
  ".uMmmmmmmuu.",
  "..ummmmmuu..",
  "...uuuuuu...",
  "..N.@^^@.N..",
  "..N.!@@!.N..",
  ".N........N.",
  ".N........N.",
];

const lamp = [
  "uMMMMm.",
  ".uMMmuu",
  "...m...",
  "...m...",
  "...m...",
  "..mMm..",
  ".MMmuu.",
];
const rep = (l: string, mid: string, r: string, n: number) => l + mid.repeat(n) + r;
// Three steps seen from the front, each narrower than the one below: a pale tread, the cups of the step below standing against its riser.
const step = (w: number, seed: number) => [
  ";".repeat(w), ":".repeat(w), "." + ",".repeat(w - 2) + ".",
  ...Array.from({ length: 9 }, (_, j) => "." + Array.from({ length: w - 2 }, (_, i) => ((i * 3 + j * 5 + seed) % 19 === 0 ? ";" : (i + j * 3 + seed) % 29 === 0 ? "," : ":")).join("") + "."),
].map((row) => row.padStart(16 + w / 2, ".").padEnd(32, "."));
const plinth = [
  rep("0", "0", "0", 30),
  rep("0!", "!", "!0", 28),
  rep("0@", "^", "!0", 28),
  ...Array<string>(8).fill(rep("0@^", "@", "%!0", 26)),
  rep("0@", "%", "!0", 28),
  rep("0", "0", "0", 30),
];
const steps = [...Array<string>(11).fill(".".repeat(32)), ...step(24, 3), ...step(28, 11), ";".repeat(32), ":".repeat(32), ...plinth];

const plank = [rep("q", "y", "q", 30), rep("q", "e", "q", 30), "..qw" + ".".repeat(24) + "wq..", "..q." + ".".repeat(24) + ".q..", ".".repeat(32)];
const rail = [rep("q", "t", "q", 30), rep("q", "e", "q", 30)];
const posts = Array<string>(24).fill("qr" + ".".repeat(28) + "eq");
const rack = compose(32, 50, [
  [plank, 0, 12],
  [posts, 0, 26],
  [rail, 0, 34],
  [amphora, 2, 27], [amphora, 11, 27], [amphora, 20, 27],
  [rail, 0, 41],
  [[rep("q", "q", "q", 30)], 0, 49],
]);

const facing = (slab: string, lite: string, dark: string, gem: string) => [
  "::::::::::::::::",
  ";;;;;;;;;;;;;;;:",
  ";^^^^^^^^^^^^^%:",
  ";^SSSSSSSSSSSD%:",
  ";^SSSSLLSSSSSD%:",
  ";^SSSL;;LSSSSD%:",
  ";^SSL;;;;LSSSD%:",
  ";^SL;;GG;;LSSD%:",
  ";^SL;;GG;;DSSD%:",
  ";^SSD;;;;DSSSD%:",
  ";^SSSD;;DSSSSD%:",
  ";^SSSSDDSSSSSD%:",
  ";^DDDDDDDDDDDD%:",
  ";%%%%%%%%%%%%%%:",
  "::::::::::::::::",
  "0000000000000000",
].map((row) => row.replace(/[SLDG]/g, (c) => ({ S: slab, L: lite, D: dark, G: gem })[c]!));
const mouth = [
  "0000000000000000",
  ";;;;:;;;;;;;;:;;",
  ";;;/++999998/;;;",
  ";;/+9||||||87/;;",
  ";;/9|&&&&&&|7/;;",
  ";;/98&&&&&&87/;;",
  ";;;/87777776/;;;",
  ";;;;;//////;;:;;",
  "::::::::::::::::",
];
const slab = [...mouth, ...facing("@", "$", "!", ")")].map((a, j) => a + [...mouth, ...facing(")", "-", "(", "@")][j]);
const end = (rows: string[], l: boolean) => rows.map((_, j) => (j === 0 ? "00000000" : j < 8 ? (l ? "0;;;;;;;" : ";;;;;;:0") : j === 8 ? (l ? "0:::::::" : ":::::::0") : j === 24 ? "00000000" : l ? "0$@@@@@@" : "@@@@@@!0"));
const counter = [...slab.map((row, j) => end(slab, true)[j] + row + end(slab, false)[j]), "0".repeat(48)];

const lararium = [
  ".......^^.......",
  ".....^^^^^^.....",
  "...^^^^^^^^^^...",
  ".^^^^^^^^^^^^^^.",
  ".%;;;;;;;;;;;;%.",
  ".%;;@;;;;;;@;;%.",
  ".%;@@@;^^;@@@;%.",
  ".%;;@;;^^;;@;;%.",
  ".%;;@;;@@;;@;;%.",
  ".%;;;;;;;;;;;;%.",
  ".%;))));;))));%.",
  ".%;;;;))));;;;%.",
  ".%%%%%%%%%%%%%%.",
];
// The household gods painted over a ledge for their offerings.
const shrine = compose(32, 50, [[lararium, 8, 5], [[";".repeat(32), ":".repeat(32), ...plinth], 0, 35]]);
const still = [
  "^^^^^^^^^^^^^^^^",
  "^||||||||||||||%",
  "^||||@@||||||||%",
  "^|||@$@@|||))||%",
  "^|||@$@@||)-))|%",
  "^||||@@|||)))||%",
  "^||;;;;;;;;;;||%",
  "^||||||||||||||%",
  "%%%%%%%%%%%%%%%%",
];

const dolium = outlined([
  "....99999987....",
  "...+|||||||87...",
  "...+999998877...",
  "..+99999988776..",
  ".+9999999888776.",
  ".+9999999888776.",
  ".+9999999888776.",
  ".99999998887766.",
  ".99999988887766.",
  ".99999988887766.",
  "..999998887766..",
  "..999988877666..",
  "...9988877666...",
  "....88777666....",
  ".....777666.....",
], "/");
const basket = [
  ".GHHG.GHHG..",
  "GHDHFGHDHFD.",
  "GHGFGFGFGHFS",
  "FGFGFGFGFGDS",
  "DFGFGFGFGFDS",
  ".DFDFDFDFDS.",
  "..SSSSSSSS..",
];
const table = [
  "qyyyyyyyyyyyyyyq",
  "qttttttttttttttq",
  ".qeeeeeeeeeeeeq.",
  "..qr........eq..",
  "..qr........eq..",
  "..qr........eq..",
  "..qr........eq..",
  "..qq........qq..",
];
const stool = [
  "qyyyyyyq",
  "qttttttq",
  ".qr..eq.",
  ".qr..eq.",
  ".qq..qq.",
];

export const thermopolium: Fit = {
  ink: {
    ";": 0xf0ece0, ":": 0xc8c2b4, ",": 0x8a8880,
    "^": 0xe0b050, "%": 0xb07a2a,
    "!": 0x6e2018, "@": 0xa83a2a, $: 0xd06a50,
    "(": 0x2a5a3a, ")": 0x4a8a5a, "-": 0x8ac090,
    "|": 0x2a2024, "/": 0x4a2418, "&": 0x5a1830, "<": 0x8accd8, _: 0x5aa0b8, ">": 0x2a6a80,
  },
  grids: {
    "bar-amphora": amphora, "bar-cup": cup, "bar-jug": jug, "bar-ewer": recolor(jug, bronze), "bar-bowls": bowls,
    "bar-flask": flask, "bar-bread": bread, "bar-olives": olives, "bar-cauldron": cauldron, "bar-lamp": lamp,
    "bar-steps": steps, "bar-rack": rack, "bar-shrine": shrine, "bar-pair": compose(16, 22, [[amphora, 0, 2], [amphora, 5, 0]]), "bar-counter": counter,
    "bar-lararium": lararium, "bar-still": still,
    "bar-amphorae": compose(32, 23, [[amphora, 0, 0], [amphora, 8, 3], [amphora, 20, 1], [basket, 15, 16]]),
    "bar-dolium": compose(32, 19, [[dolium, 15, 0], [dolium, 0, 2]]),
    "bar-table": compose(30, 17, [[table, 0, 9], [jug, 2, 0], [cup, 10, 4], [stool, 20, 12]]),
  },
  wall: [
    { grid: "bar-steps", shelves: [[5, 26, 11], [3, 28, 23], [1, 30, 35]], goods: ["bar-cup", "bar-jug", "bar-bowls", "bar-cup", "bar-flask", "bar-ewer", "bar-olives"] },
    { grid: "bar-rack", shelves: [[2, 29, 12]], goods: ["bar-flask", "bar-jug", "bar-cup", "bar-bowls", "bar-ewer"] },
    { grid: "bar-shrine", shelves: [[6, 25, 35]], goods: ["bar-bread", "bar-flask", "bar-olives", "bar-cup"] },
    { grid: "bar-rack", shelves: [[2, 29, 12]], goods: ["bar-ewer", "bar-bowls", "bar-cup", "bar-flask", "bar-jug"] },
  ],
  narrow: ["bar-pair"],
  counter: { grid: "bar-counter", top: 8, goods: ["bar-cauldron", "bar-lamp", "bar-bread", "bar-jug", "bar-cup", "bar-olives"] },
  floor: ["bar-amphorae", "bar-dolium", "bar-table"],
  hung: ["bar-lararium", "bar-still"],
};
