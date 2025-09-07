// ============ PIXEL-PERFECT PORTRAIT RENDERING UTILITIES ============

import React from 'react';

// Bayer dithering matrix for ordered dithering
const BAYER_4 = [
  [ 0,  8,  2, 10],
  [12,  4, 14,  6],
  [ 3, 11,  1,  9],
  [15,  7, 13,  5],
]; // values 0..15

export function bayer4(x: number, y: number) {
  return BAYER_4[y & 3][x & 3] / 15; // 0..1
}

// Seeded random number generator for consistent randomization
export function seededRng(seed: number) {
  // xorshift32
  let s = (seed | 0) || 1;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return ((s >>> 0) / 0xFFFFFFFF);
  };
}

// Linear color mixing
export function mix(a: string, b: string, t: number) {
  // hex -> hex linear mix
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const r = Math.round(((pa >> 16) * (1 - t) + (pb >> 16) * t));
  const g = Math.round((((pa >> 8) & 255) * (1 - t) + ((pb >> 8) & 255) * t));
  const bch = Math.round(((pa & 255) * (1 - t) + (pb & 255) * t));
  return `#${(1 << 24 | (r << 16) | (g << 8) | bch).toString(16).slice(1)}`;
}

// Plot pixel helper for cleaner element creation
export function plotPixel(
  elements: JSX.Element[],
  x: number,
  y: number,
  fill: string,
  keyPrefix = 'px',
  opacity = 1
) {
  elements.push(
    <rect key={`${keyPrefix}-${x}-${y}`} className="pixel" x={x} y={y} width="1" height="1" fill={fill} opacity={opacity} />
  );
}

// ============ CONSISTENT COLOR RAMPS ============

// Skin color ramp for consistent shading
export function skinRamp(base: string) {
  return {
    light: mix('#ffffff', base, 0.7),
    mid: base,
    shadow: mix('#000000', base, 0.75),
    deep: mix('#000000', base, 0.55),
  };
}

// Hair color ramp
export function hairRamp(base: string) {
  return {
    shine: mix('#ffffff', base, 0.65),
    base,
    shadow: mix('#000000', base, 0.65),
  };
}

// Outline color selection
export function outlineColor(bgIsDark: boolean, skin: ReturnType<typeof skinRamp>) {
  return bgIsDark ? skin.shadow : skin.deep;
}

// ============ FACIAL MICRO-SHADING ============

export function renderFaceMicroShades(
  elements: JSX.Element[],
  headX: number, headY: number,
  headW: number, headH: number,
  skinTone: string
) {
  const skin = skinRamp(skinTone);
  const cx = headX + Math.round(headW / 2);

  // cheek highlight (near light side)
  const cheekY = headY + Math.round(headH * 0.55);
  const cheekX = cx - Math.round(headW * 0.18);
  plotPixel(elements, cheekX, cheekY, skin.light, 'cheek');
  plotPixel(elements, cheekX + 1, cheekY, skin.mid, 'cheek');

  // nose bridge highlight (a tiny 2px vertical)
  const noseX = cx;
  const noseY = headY + Math.round(headH * 0.45);
  plotPixel(elements, noseX, noseY, skin.light, 'nose');
  plotPixel(elements, noseX, noseY + 1, skin.mid, 'nose');

  // under-nose shadow (1px) for separation
  plotPixel(elements, noseX, noseY + 3, skin.shadow, 'subnose');

  // lower lip: 2px highlight + underside shadow
  const lipY = headY + Math.round(headH * 0.64);
  plotPixel(elements, cx - 1, lipY, skin.light, 'lipl');
  plotPixel(elements, cx, lipY, skin.light, 'lipc');
  plotPixel(elements, cx, lipY + 1, skin.shadow, 'lipshadow');
}

// ============ ENHANCED EYE RENDERING ============

export function renderEnhancedEyes(
  elements: JSX.Element[],
  headX: number, headY: number,
  headW: number, headH: number,
  eyeColor: string, skinTone: string
) {
  const skin = skinRamp(skinTone);
  const cx = headX + Math.round(headW / 2);
  const ey = headY + Math.round(headH * 0.50);
  const ex = Math.round(headW * 0.22);

  const leftX = cx - ex, rightX = cx + ex;

  // whites
  plotPixel(elements, leftX, ey, '#ffffff', 'eye');
  plotPixel(elements, rightX, ey, '#ffffff', 'eye');

  // irises (1px) + highlight offset to the light (top-left)
  plotPixel(elements, leftX, ey, eyeColor, 'iris');
  plotPixel(elements, rightX, ey, eyeColor, 'iris');
  plotPixel(elements, leftX - 1, ey - 1, '#ffffff', 'spark'); // tiny sparkle
  
  // upper "lash"/lid shadow
  plotPixel(elements, leftX, ey - 1, skin.shadow, 'lid');
  plotPixel(elements, rightX, ey - 1, skin.shadow, 'lid');
}

// ============ STUBBLE RENDERING ============

type StubbleOpts = {
  elements: JSX.Element[];
  headX: number; headY: number; headW: number; headH: number;
  centerX: number;
  skinTone: string;
  hairColor: string;
  density?: number;
  seed?: number;
};

export function renderStubble(opts: StubbleOpts) {
  const {
    elements, headX, headY, headW, headH, centerX,
    skinTone, hairColor, density = 0.6, seed = 1234,
  } = opts;

  const rng = seededRng(seed);
  const skin = skinRamp(skinTone);

  // choose a stubble color: darker than skin, slightly toward hair
  const baseDark = skin.shadow;
  const stubbleColor = mix(baseDark, hairColor, 0.35);

  // define a LOWER-FACE mask (jaw + chin band) and a moustache band
  const cx = centerX;
  const cy = headY + Math.round(headH * 0.59); // mouth area center
  const chinY = headY + Math.round(headH * 0.86);

  const jawRx = headW * 0.44;
  const jawRy = headH * 0.52;
  const moustacheY = headY + Math.round(headH * 0.57);
  const moustacheHalfW = Math.round(headW * 0.22);

  // falloff helpers
  const jawFalloff = (x: number, y: number) => {
    const nx = (x - cx) / jawRx;
    const ny = (y - (headY + headH * 0.58)) / jawRy;
    const d = Math.sqrt(nx * nx + ny * ny);
    const nearEdge = Math.max(0, Math.min(1, (d - 0.82) * 6));
    const chinBoost = Math.max(0, 1 - Math.abs(y - chinY) / 5);
    return Math.max(nearEdge, 0.35 * chinBoost);
  };

  const moustacheMask = (x: number, y: number) =>
    y >= moustacheY && y <= moustacheY + 2 && Math.abs(x - cx) <= moustacheHalfW;

  // iterate only a tight bbox
  const minX = Math.round(headX + headW * 0.08);
  const maxX = Math.round(headX + headW * 0.92);
  const minY = Math.round(headY + headH * 0.52);
  const maxY = Math.round(headY + headH * 0.88);

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      // inside face ellipse?
      const ex = (x - cx) / (headW * 0.46);
      const ey = (y - (headY + headH * 0.50)) / (headH * 0.58);
      if (ex * ex + ey * ey > 1) continue;

      const inLowerFace = y >= cy && y <= chinY;
      const inMoustache = moustacheMask(x, y);

      if (!(inLowerFace || inMoustache)) continue;

      // density field
      const field =
        density * (inLowerFace ? jawFalloff(x, y) : 0) +
        (inMoustache ? Math.max(0.35, density * 0.75) : 0);

      // ordered dither + tiny random wobble
      const threshold = bayer4(x, y) * 0.9 + rng() * 0.1;

      if (field > threshold) {
        const jitter = (x + y) % 7 === 0 ? 1 : 0;
        plotPixel(elements, x + jitter, y, stubbleColor, 'stubble');
      }
    }
  }
}

// ============ HAIR HIGHLIGHT AND FUZZ ============

export function renderHairHighlightAndFuzz(
  elements: JSX.Element[],
  hairSilhouette: Array<[number, number]>, // perimeter pixels
  hairColor: string,
  seed: number
) {
  const rng = seededRng(seed);
  const hair = hairRamp(hairColor);

  // Highlight: add shine pixels on the light side
  hairSilhouette.forEach(([x, y]) => {
    if ((x & 3) === 0 && (y % 5) === 0 && rng() < 0.6) {
      plotPixel(elements, x + 1, y + 1, hair.shine, 'hairshine');
    }
  });

  // Fuzz: sprinkle a few pixels just outside the hair
  hairSilhouette.forEach(([x, y]) => {
    if (rng() < 0.09) {
      const ox = x - 1, oy = y - 1;
      plotPixel(elements, ox, oy, hair.base, 'hairfuzz', 0.9);
    }
  });
}

// ============ ANTI-ALIASING FOR CONCAVE CORNERS ============

export function aaConcaveCorners(
  elements: JSX.Element[],
  border: Set<string>,     // keys like "x,y"
  skinTone: string
) {
  const skin = skinRamp(skinTone);
  const mid = skin.mid;

  const neigh = (x: number, y: number) => (dx: number, dy: number) => border.has(`${x+dx},${y+dy}`);
  border.forEach(k => {
    const [xs, ys] = k.split(','); 
    const x = +xs, y = +ys;
    const n = neigh(x, y);
    
    // concave pattern: two neighbors forming a corner
    if (n(1, 0) && n(0, -1) && !n(1, -1)) plotPixel(elements, x + 1, y - 1, mid, 'aa');
    if (n(-1, 0) && n(0, -1) && !n(-1, -1)) plotPixel(elements, x - 1, y - 1, mid, 'aa');
    if (n(1, 0) && n(0, 1) && !n(1, 1)) plotPixel(elements, x + 1, y + 1, mid, 'aa');
    if (n(-1, 0) && n(0, 1) && !n(-1, 1)) plotPixel(elements, x - 1, y + 1, mid, 'aa');
  });
}

// ============ GLASSES AND ACCESSORIES ============

export function renderGlassesShine(elements: JSX.Element[], lx: number, ly: number, rx: number, ry: number) {
  // add a single diagonal highlight in each lens (top-left)
  plotPixel(elements, lx - 1, ly - 1, '#ffffff', 'gshine');
  plotPixel(elements, rx - 1, ry - 1, '#ffffff', 'gshine');
}

export function renderEarring(elements: JSX.Element[], ex: number, ey: number, metalBase = '#d2c8a7') {
  plotPixel(elements, ex, ey, mix('#ffffff', metalBase, 0.5), 'ear');
  plotPixel(elements, ex, ey + 1, mix('#000000', metalBase, 0.6), 'ear'); // tiny shadow
}