/**
 * Render the portrait lab's twelve deterministic studies through renderer B
 * or C to a PNG contact sheet, no browser needed.
 *
 *   npx tsx scripts/portrait-sheet.ts [out.png] [b|c] [seed] [scale] [age]
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { generateAppearance } from "../src/core/character";
import { paintThreeQuarter } from "../src/render/portraits/three-quarter";
import { paintConstructed } from "../src/render/portraits/constructed";

const [
  out = "artifacts/portrait-lab/constructed-sheet.png",
  system = "c",
  seed = "portrait-study-01",
  scaleArg = "5",
  ageArg = "30",
] = process.argv.slice(2);
const paint = system === "b" ? paintThreeQuarter : paintConstructed;
const scale = Number(scaleArg);
const age = Number(ageArg);
const cols = 6,
  rows = 2,
  pad = 4,
  pw = 64,
  ph = 80;
const width = (cols * (pw + pad) + pad) * scale;
const height = (rows * (ph + pad) + pad) * scale;
const rgba = new Uint8Array(width * height * 4);
const bg = [0x2c, 0x36, 0x66];
for (let i = 0; i < width * height; i++) {
  rgba[i * 4] = bg[0];
  rgba[i * 4 + 1] = bg[1];
  rgba[i * 4 + 2] = bg[2];
  rgba[i * 4 + 3] = 255;
}
for (let n = 0; n < cols * rows; n++) {
  const a = generateAppearance(`${seed}:0`, n, age);
  const r = paint(a, age);
  const ox = (pad + (n % cols) * (pw + pad)) * scale;
  const oy = (pad + Math.floor(n / cols) * (ph + pad)) * scale;
  for (let y = 0; y < ph; y++)
    for (let x = 0; x < pw; x++) {
      const c = r.color[y * pw + x];
      if (!c) continue;
      const v = parseInt(c.slice(1), 16);
      for (let sy = 0; sy < scale; sy++)
        for (let sx = 0; sx < scale; sx++) {
          const i = ((oy + y * scale + sy) * width + ox + x * scale + sx) * 4;
          rgba[i] = (v >> 16) & 255;
          rgba[i + 1] = (v >> 8) & 255;
          rgba[i + 2] = v & 255;
        }
    }
}

const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (buf: Uint8Array) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type: string, data: Uint8Array) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), Buffer.from(data)]);
  const sum = Buffer.alloc(4);
  sum.writeUInt32BE(crc(body));
  return Buffer.concat([len, body, sum]);
};
const raw = Buffer.alloc((width * 4 + 1) * height);
for (let y = 0; y < height; y++) {
  raw[y * (width * 4 + 1)] = 0;
  raw.set(
    rgba.subarray(y * width * 4, (y + 1) * width * 4),
    y * (width * 4 + 1) + 1,
  );
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(width, 0);
ihdr.writeUInt32BE(height, 4);
ihdr[8] = 8;
ihdr[9] = 6;
const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw)),
  chunk("IEND", new Uint8Array(0)),
]);
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, png);
console.log(`wrote ${out} (${width}×${height})`);
