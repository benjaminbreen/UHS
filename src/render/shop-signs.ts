/** Shop signs drawn whole at runtime: board and lettering both.
 *
 * The art paints the wall bare and publishes where a sign may hang and what
 * kind suits the front (`shopSigns`). Here each spot gets its own trade, its
 * own paint and words in the street's script, or no sign at all, so one
 * sprite repeated down a street reads as different shops.
 */
import type Phaser from "phaser";
import { GLYPHS, signable } from "./sign-texture";
import { ARABIC_SIZES, CJK_SIZES, DEVA_SIZES, SCRIPT_BITMAPS } from "./sign-glyphs.generated";
import type { SignLanguage } from "../content/settlements/signs";

export type SignKind = "board" | "box" | "paint" | "neon" | "blade";
/** x, y, w, h on the sprite; the kind of sign; the trade, when the art knows it. */
export type SignSlot = [number, number, number, number, SignKind, string?];

type Bitmap = { w: number; h: number; bits: Uint8Array };

function bitmap(w: number, h: number): Bitmap {
  return { w, h, bits: new Uint8Array(w * h) };
}

function blit(to: Bitmap, from: Bitmap, x: number, y: number) {
  for (let yy = 0; yy < from.h; yy++)
    for (let xx = 0; xx < from.w; xx++)
      if (from.bits[yy * from.w + xx]) to.bits[(y + yy) * to.w + x + xx] = 1;
}

function decoded(key: string): Bitmap | undefined {
  const got = SCRIPT_BITMAPS[key];
  if (!got) return undefined;
  const [w, h, rows] = got;
  const out = bitmap(w, h);
  rows.forEach((row, y) => {
    const pad = row.length * 4 - w;
    for (let x = 0; x < w; x++) {
      const p = x + pad;
      if ((parseInt(row[p >> 2], 16) >> (3 - (p & 3))) & 1) out.bits[y * w + x] = 1;
    }
  });
  return out;
}

function stack(parts: Bitmap[], vertical: boolean): Bitmap {
  const gap = 1;
  const w = vertical ? Math.max(...parts.map((p) => p.w)) : parts.reduce((s, p) => s + p.w, 0) + gap * (parts.length - 1);
  const h = vertical ? parts.reduce((s, p) => s + p.h, 0) + gap * (parts.length - 1) : Math.max(...parts.map((p) => p.h));
  const out = bitmap(w, h);
  let at = 0;
  for (const p of parts) {
    if (vertical) blit(out, p, (w - p.w) >> 1, at);
    else blit(out, p, at, (h - p.h) >> 1);
    at += (vertical ? p.h : p.w) + gap;
  }
  return out;
}

function latinGlyph(char: string, scale: number): Bitmap {
  const rows = GLYPHS[char] ?? GLYPHS[" "];
  const out = bitmap(rows[0].length * scale, 5 * scale);
  rows.forEach((row, y) =>
    [...row].forEach((bit, x) => {
      if (bit !== "1") return;
      for (let dy = 0; dy < scale; dy++)
        for (let dx = 0; dx < scale; dx++) out.bits[(y * scale + dy) * out.w + x * scale + dx] = 1;
    }),
  );
  return out;
}

/** Every way this word can be set, largest first. */
function settings(word: string, language: SignLanguage, vertical: boolean): Bitmap[] {
  if (language === "ar" || language === "fa" || language === "hi") {
    if (vertical) return [];
    return [...(language === "hi" ? DEVA_SIZES : ARABIC_SIZES)].reverse().flatMap((size) => decoded(`${size}:${word}`) ?? []);
  }
  if (language === "zh" || language === "zhs" || language === "ja" || language === "ko") {
    return [...CJK_SIZES].reverse().flatMap((size) => {
      const chars = [...word].map((ch) => decoded(`${size}:${ch}`));
      return chars.every(Boolean) ? [stack(chars as Bitmap[], vertical)] : [];
    });
  }
  const text = signable(word);
  if (!text) return [];
  return [2, 1].map((scale) => {
    const chars = [...text].map((ch) => latinGlyph(ch, scale));
    return vertical ? stack(chars.filter((_, i) => text[i] !== " "), true) : stack(chars, false);
  });
}

const PAD: Record<SignKind, number> = { board: 2, box: 3, paint: 0, neon: 2, blade: 2 };

/** The largest setting of any word that fits, or none: a board too small for
 * the shortest word is better left blank than crowded. */
export function fitWord(
  options: string[],
  language: SignLanguage,
  w: number,
  h: number,
  kind: SignKind,
  pick: number,
): { word: string; text: Bitmap } | undefined {
  const vertical = kind === "blade" || h > w * 1.6;
  const room = [w - 2 * PAD[kind], h - 2 * PAD[kind]];
  const fits = options.flatMap((word) => {
    const text = settings(word, language, vertical).find((b) => b.w <= room[0] && b.h <= room[1]);
    return text ? [{ word, text }] : [];
  });
  if (!fits.length) return undefined;
  // The biggest lettering that fits reads best; among equals, any word will do.
  const best = Math.max(...fits.map((f) => f.text.h));
  const top = fits.filter((f) => f.text.h === best);
  return top[Math.floor(pick * top.length) % top.length];
}

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function css([r, g, b]: number[]) {
  return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
}
/** Darker toward violet, lighter toward warm, as the art's ramps shift. */
function shade(hex: string, k: number) {
  const [r, g, b] = rgb(hex);
  return k < 0
    ? css([r * (1 + k), g * (1 + k * 1.05), b * (1 + k * 0.85)])
    : css([r + (255 - r) * k, g + (246 - g) * k, b + (226 - b) * k]);
}
function light(hex: string) {
  const [r, g, b] = rgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b > 140;
}

const TUBES = ["#ff5a50", "#ff6ac0", "#6ab8ff", "#5ef08e", "#ffb43c"];

/** Draw one sign; returns its texture and, for signs that light up, the lit
 * copy the night shows over it. */
export function drawShopSign(
  scene: Phaser.Scene,
  w: number,
  h: number,
  kind: SignKind,
  paint: string,
  language: SignLanguage,
  word: string,
  text: Bitmap,
  accent: number,
): { key: string; lit?: string } | undefined {
  const tube = TUBES[accent % TUBES.length];
  const key = `shopsign:${kind}:${w}x${h}:${paint}:${language}:${word}:${text.w}x${text.h}:${tube}`;
  const lights = kind === "box" || kind === "neon";
  const draw = (k: string, lit: boolean) => {
    if (scene.textures.exists(k)) return;
    const canvas = scene.textures.createCanvas(k, w, h);
    if (!canvas) return;
    const ctx = canvas.getContext();
    ctx.clearRect(0, 0, w, h);
    const fill = (x: number, y: number, ww: number, hh: number, c: string) => {
      ctx.fillStyle = c;
      ctx.fillRect(x, y, ww, hh);
    };
    let ink: string, shadow: string | undefined;
    if (kind === "board" || kind === "blade") {
      fill(0, 0, w, h, shade(paint, -0.5));
      fill(1, 1, w - 2, h - 2, paint);
      fill(1, 1, w - 2, 1, shade(paint, 0.22));
      fill(1, 1, 1, h - 2, shade(paint, 0.12));
      fill(1, h - 2, w - 2, 1, shade(paint, -0.2));
      ink = light(paint) ? shade(paint, -0.72) : accent % 3 === 0 ? "#f0c860" : "#f4ead0";
      shadow = shade(paint, -0.32);
    } else if (kind === "box") {
      const face = lit ? shade(paint, 0.25) : paint;
      fill(0, 0, w, h, "#5d606c");
      fill(1, 1, w - 2, h - 2, "#c9ccd2");
      fill(1, 1, w - 2, 1, "#eceef0");
      fill(2, 2, w - 4, h - 4, face);
      ink = light(paint) ? TUBES[accent % 3 === 0 ? 2 : 0] : "#fbf6e8";
      // The night's additive halo lifts everything; a light face needs deep ink to survive it.
      if (light(paint)) ink = shade(ink, lit ? -0.6 : -0.25);
    } else if (kind === "neon") {
      fill(0, 0, w, h, "#1e1a24");
      fill(1, 1, w - 2, h - 2, "#2c2633");
      fill(1, 1, w - 2, 1, "#3e3746");
      ink = lit ? shade(tube, 0.55) : shade(tube, 0.25);
      shadow = lit ? undefined : "#15121a";
    } else {
      // Lettered straight on a wall of unknown colour: a pale paint would vanish.
      ink = light(paint) ? shade(paint, -0.55) : paint;
      shadow = shade(ink, -0.6);
    }
    const tx = Math.floor((w - text.w) / 2), ty = Math.floor((h - text.h) / 2);
    for (let y = 0; y < text.h; y++)
      for (let x = 0; x < text.w; x++) {
        if (!text.bits[y * text.w + x]) continue;
        if (shadow && !text.bits[(y + 1) * text.w + x] && y + 1 < h) fill(tx + x, ty + y + 1, 1, 1, shadow);
      }
    for (let y = 0; y < text.h; y++)
      for (let x = 0; x < text.w; x++) if (text.bits[y * text.w + x]) fill(tx + x, ty + y, 1, 1, ink);
    canvas.refresh();
  };
  draw(key, false);
  if (!scene.textures.exists(key)) return undefined;
  if (!lights) return { key };
  draw(`${key}:lit`, true);
  return { key, lit: `${key}:lit` };
}
