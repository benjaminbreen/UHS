import type { FloatSprite } from "../flowing-water";

/** What rides a sewer's current. */
export const sewerFloats: Record<string, FloatSprite> = {
  bottle: {
    weight: 4,
    ink: { ".": "#1c3420", g: "#3f7a3a", G: "#8cd07a", c: "#c8b48a" },
    rows: ["   .......  ", " ..GGGGGg.cc", ".gggggggggcc", " ..gggggg.  ", "   .......  "],
  },
  poop: {
    weight: 4,
    ink: { ".": "#2a170c", b: "#6b4423", B: "#a06a3a" },
    rows: ["    ..    ", "   .Bb.   ", "  ..bbb.  ", " .BBbbbb. ", ".bBbbbbbb.", ".bbbbbbbb.", " ........ "],
  },
  paper: {
    weight: 4,
    ink: { ".": "#6a6a5e", w: "#cfcab8", W: "#f2eee0" },
    rows: ["  ....  ", " .WWww. ", ".WwWwww.", ".wwwWww.", " .wWww. ", "  ....  "],
  },
  can: {
    weight: 2,
    since: 1935,
    ink: { ".": "#2a2020", r: "#b83a2a", R: "#e8664c", m: "#b0b4b8" },
    rows: [" ....... ", ".mRRRRRm.", ".mrrrrrm.", " ....... "],
  },
  stick: {
    weight: 2,
    ink: { ".": "#2a1c10", k: "#6a4a2a", K: "#9a7048" },
    rows: ["..........  ", ".kkkKkkkkk..", " .......... "],
  },
  suds: {
    weight: 3,
    ink: { ".": "#8a8e78", f: "#c8ccb4", F: "#f0f2de" },
    rows: ["  ..  ..  ", " .FF..Ff. ", ".FffFFfff.", " .ff..ff. ", "  ..  ..  "],
  },
  duck: {
    weight: 0.3,
    since: 1950,
    ink: { ".": "#3a2a10", Y: "#f6d846", y: "#c89a20", k: "#1a1a1a", o: "#e8822a" },
    rows: ["  ...   ", " .YYY.  ", " .YkYoo.", "..YYY.. ", ".YyYYYY.", ".yyyyyy.", " ...... "],
  },
};

/** What rides a mine's drainage gutter. */
export const mineFloats: Record<string, FloatSprite> = {
  chip: {
    weight: 4,
    ink: { ".": "#2a1a0c", k: "#8a6034", K: "#c08a50" },
    rows: [" ..... ", ".KKkkk.", " ..... "],
  },
  coal: {
    weight: 2,
    ink: { ".": "#060608", c: "#1c1c22", C: "#5a6070" },
    rows: [" .. ", ".Cc.", ".cc.", " .. "],
  },
  froth: {
    weight: 3,
    ink: { ".": "#7a6a50", f: "#c8b890", F: "#ece0c0" },
    rows: [" .. . ", ".Ff.f.", " .ff. ", "  ..  "],
  },
  candle: {
    weight: 0.6,
    ink: { ".": "#5a4a30", w: "#e8dcb0", W: "#fff4d0" },
    rows: [".....", ".WWw.", "....."],
  },
};
