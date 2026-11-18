/** Generic portrait sheet. npx tsx scripts/portrait-sheets.ts <which> */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import {
  generateAppearance,
  earOrnaments,
  noseOrnaments,
  faceMarks,
  noseShapes,
  type CharacterAppearance,
} from "../src/core/character";
import { expressions, type Expression } from "../src/render/portraits/constructed";
import { paintSculpted } from "../src/render/portraits/sculpted";

const which = process.argv[2] ?? "ears";
const bare = (seed: string, index: number, age: number): CharacterAppearance => {
  const a = generateAppearance(seed, index, age);
  return {
    ...a,
    hair: process.env.HAIR === "bald" ? "bald" : "cropped",
    beard: "none",
    wearing: { ...a.wearing, headwear: "none", earrings: false },
    adornment: { ears: "none", nose: "none", marks: "none", markStyle: "ink", metal: "gold" },
  };
};
type Cell = { a: CharacterAppearance; age: number; expression?: Expression; turn?: number };
let cells: Cell[] = [];
let cols = 6;
let out = "";
const person = bare("sheet-face:1", 3, 28);
if (which === "ears") {
  out = "artifacts/portrait-lab/ears.png";
  cells = earOrnaments.map((e) => ({ a: { ...person, adornment: { ...person.adornment, ears: e } }, age: 28 }));
} else if (which === "nose-ornament") {
  out = "artifacts/portrait-lab/nose-ornaments.png";
  cols = 4;
  cells = noseOrnaments.map((e) => ({ a: { ...person, adornment: { ...person.adornment, nose: e } }, age: 28 }));
} else if (which === "marks") {
  out = "artifacts/portrait-lab/marks.png";
  cols = 9;
  cells = ["ink", "scar", "paint"].flatMap((style) =>
    faceMarks.map((mk) => ({
      a: { ...person, adornment: { ...person.adornment, marks: mk, markStyle: style as "ink", markColor: style === "paint" ? "#b8792c" : "#2a2740" } },
      age: 28,
    })),
  );
} else if (which === "noses") {
  out = "artifacts/portrait-lab/noses.png";
  cols = 9;
  cells = noseShapes.map((n) => ({ a: { ...person, face: { ...person.face!, nose: n } }, age: 28 }));
} else if (which === "world" || which === "cast") {
  out = which === "cast" ? "artifacts/portrait-lab/cast.png" : "artifacts/portrait-lab/world-adornment.png";
  cols = 8;
  const { characterAppearance, generateCharacter } = await import("../src/content/characters/generate");
  const { integratedSetting } = await import("../src/content/geography/defaults");
  const { settingFor } = await import("../src/content/geography/resolve");
  const { places } = await import("../src/content/geography/places");
  const settings: [string, number?][] = which === "world" ? [["congo"], ["kyoto"], ["rome"]] : [
    ["city-seoul", 1953], ["timbuktu", 1450], ["rome", 100], ["city-manila", 1870],
    ["cusco", 1450], ["paris", 1760], ["delhi", 1600], ["city-samarkand", 1420],
    ["kyoto", 1850], ["city-mombasa", 1900], ["city-chicago", 1935], ["city-oaxaca", 1650],
  ];
  cells = settings.flatMap(([id, year], row) => {
    const setting = integratedSetting(settingFor(places.find((q) => q.id === id)!, year));
    return Array.from({ length: which === "cast" ? 2 : 8 }, (_, i) => {
      const age = which === "cast" ? [13, 37, 68, 29, 46, 21, 58, 9][(row * 2 + i) % 8] : 20 + ((i * 7) % 45);
      const seed = `sheet-${id}`, who = `npc-${i}`;
      if (which === "world") return { a: characterAppearance(setting, seed, who, age), age };
      const sex = (row + i) % 2 ? "male" : "female";
      return { a: generateCharacter(setting, seed, who, age, undefined, undefined, undefined, sex).appearance, age };
    });
  });
  if (which === "cast") cells = cells.flatMap(cell => [{ ...cell, turn: 1 }, { ...cell, turn: 0 }]);
} else if (which === "expressions") {
  out = "artifacts/portrait-lab/expressions.png";
  cols = 6;
  cells = [3, 11].flatMap((i) =>
    expressions.map((expression) => ({ a: bare("sheet-face:1", i, 28), age: 28, expression })),
  );
}
const scale = Number(process.env.S ?? (which === "cast" ? 2 : 8)), X = Number(process.env.X ?? 12), Y = Number(process.env.Y ?? 8), W = Number(process.env.W ?? 40), H = Number(process.env.H ?? 40), pad = 1;
const rows = Math.ceil(cells.length / cols);
const width = (cols * (W + pad) + pad) * scale;
const height = (rows * (H + pad) + pad) * scale;
const rgba = new Uint8Array(width * height * 4);
for (let i = 0; i < width * height; i++) { rgba[i*4]=0x1a; rgba[i*4+1]=0x1f; rgba[i*4+2]=0x36; rgba[i*4+3]=255; }
cells.forEach((cell, n) => {
  const r = paintSculpted(cell.a, cell.age, { expression: cell.expression, turn: cell.turn });
  const ox = (pad + (n % cols) * (W + pad)) * scale;
  const oy = (pad + Math.floor(n / cols) * (H + pad)) * scale;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = r.color[(y + Y) * 64 + x + X];
    if (!c) continue;
    const v = parseInt(c.slice(1), 16);
    for (let sy = 0; sy < scale; sy++) for (let sx = 0; sx < scale; sx++) {
      const i = ((oy + y*scale + sy) * width + ox + x*scale + sx) * 4;
      rgba[i]=(v>>16)&255; rgba[i+1]=(v>>8)&255; rgba[i+2]=v&255;
    }
  }
});
const crcTable = new Uint32Array(256).map((_, n) => { let c=n; for(let k=0;k<8;k++) c = c&1 ? 0xedb88320^(c>>>1) : c>>>1; return c>>>0; });
const crc = (b: Uint8Array) => { let c=0xffffffff; for (const x of b) c = crcTable[(c^x)&255]^(c>>>8); return (c^0xffffffff)>>>0; };
const chunk = (t: string, d: Uint8Array) => { const l=Buffer.alloc(4); l.writeUInt32BE(d.length); const b=Buffer.concat([Buffer.from(t,"ascii"),Buffer.from(d)]); const s=Buffer.alloc(4); s.writeUInt32BE(crc(b)); return Buffer.concat([l,b,s]); };
const raw = Buffer.alloc((width*4+1)*height);
for (let y=0;y<height;y++) raw.set(rgba.subarray(y*width*4,(y+1)*width*4), y*(width*4+1)+1);
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width,0); ihdr.writeUInt32BE(height,4); ihdr[8]=8; ihdr[9]=6;
mkdirSync(dirname(out),{recursive:true});
writeFileSync(out, Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk("IHDR",ihdr),chunk("IDAT",deflateSync(raw)),chunk("IEND",new Uint8Array(0))]));
console.log(out, cells.length);
