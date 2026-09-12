import type { CharacterAppearance, CharacterFace } from "../../core/character";
import { mix } from "../characters/pixels";
import { portraitFace } from "./layered";
import { MAT, Raster, tones, type Pt, type Tones } from "./raster";

export const PORTRAIT_WIDTH = 64;
export const PORTRAIT_HEIGHT = 80;

const GOLD = "#d9a441";
const SHADOW_HUE = "#3a2040";
const LIGHT_HUE = "#fff1c8";

const shadow = (t: number) => (c: string) => mix(c, SHADOW_HUE, t);
const light = (t: number) => (c: string) => mix(c, LIGHT_HUE, t);

type Model = {
  a: CharacterAppearance;
  face: CharacterFace;
  age: number;
  skin: Tones;
  hair: Tones;
  cloth: Tones;
  trim: Tones;
  lower: Tones;
  cloak: Tones;
  gold: Tones;
  top: number;
  chin: number;
  nearX: number;
  farX: number;
  volume: number;
  eyeY: number;
  mouthY: number;
  noseTip: number;
  headPoints: Pt[];
  shoulder: number;
  hemY: number;
};

/** Slot B: three-quarter bust turned to the viewer's right, lit from upper left. */
export function drawThreeQuarterPortrait(
  ctx: CanvasRenderingContext2D,
  appearance: CharacterAppearance,
  age = 30,
) {
  ctx.clearRect(0, 0, PORTRAIT_WIDTH, PORTRAIT_HEIGHT);
  ctx.imageSmoothingEnabled = false;
  paintThreeQuarter(appearance, age).blit(ctx);
}

export function paintThreeQuarter(
  appearance: CharacterAppearance,
  age = 30,
): Raster {
  const r = new Raster(PORTRAIT_WIDTH, PORTRAIT_HEIGHT);
  const m = model(appearance, age);
  const hood = m.a.wearing.headwear === "hood";

  drawTorso(r, m);
  if (hood) drawHoodBack(r, m);
  else drawBackHair(r, m);
  drawNeck(r, m);
  drawHead(r, m);
  drawEar(r, m);
  drawBeard(r, m);
  if (!hood) drawFrontHair(r, m);
  drawHeadwear(r, m);
  drawJewellery(r, m);

  r.contour({
    [MAT.skin]: m.skin,
    [MAT.hair]: m.hair,
    [MAT.cloth]: m.cloth,
    [MAT.trim]: m.trim,
    [MAT.metal]: { edge: mix(GOLD, "#4a2a12", 0.6), deep: "#5a3a16" },
  });
  r.castShadows(0.28);

  drawFeatures(r, m);
  drawHairDetail(r, m);
  return r;
}

function model(a: CharacterAppearance, age: number): Model {
  const face = portraitFace(a, age);
  const child = age < 13,
    youth = age < 17;
  const head = a.head ?? "original";
  const top =
    (head === "long" ? 7 : head === "round" ? 9 : 8) + (child ? 1 : 0);
  const chin =
    45 +
    (face.chin === "long" ? 2 : face.chin === "short" ? -1 : 0) +
    (head === "long" ? 1 : head === "round" ? -1 : 0) -
    (child ? 3 : youth ? 1 : 0);
  const widen = head === "broad" ? 1.5 : head === "round" ? 1 : 0;
  const nearX = 20.5 - widen;
  const farX = 49.5 + widen;
  const volume =
    a.hair === "cropped" || a.hair === "bald"
      ? 1
      : a.hair === "curls"
        ? 5
        : a.hair === "braid" || a.hair === "topknot"
          ? 2
          : ["bob", "long"].includes(a.hair)
            ? 4
            : 3;
  const eyeY = 26 + (child ? 1 : 0) + (head === "long" ? 1 : 0);
  const noseTip =
    eyeY + (face.nose === "short" ? 6 : face.nose === "aquiline" ? 9 : 8);
  const mouthY = Math.min(chin - 5, noseTip + 5);
  const jaw = a.jaw ?? "original";
  const jawOut = jaw === "square" ? 1.5 : jaw === "soft" ? 0.5 : 0;
  const chinW = jaw === "pointed" || jaw === "small" ? -1.5 : 0;
  const headPoints: Pt[] = [
    [27, top],
    [36, top - 1],
    [43, top + 0.5],
    [47.5, top + 5],
    [farX, top + 12],
    [farX, 29],
    [farX - 1.5, 36],
    [farX - 5 + jawOut, chin - 4],
    [39.5 + chinW * 0.5, chin - 1],
    [35, chin + 0.5],
    [29.5 - chinW * 0.5, chin - 1],
    [24.5 - jawOut, chin - 5.5],
    [nearX + 1, chin - 12],
    [nearX, 25],
    [nearX + 0.5, 16],
    [23, top + 2.5],
  ];
  const shoulder = a.build < 0 ? 2 : a.build > 0 ? -2 : 0;
  const sleeves = a.wearing.sleeves ?? "long";
  const hemY =
    sleeves === "none"
      ? 57
      : sleeves === "short"
        ? 67
        : sleeves === "loose"
          ? 76
          : 81;
  return {
    a,
    face,
    age,
    skin: tones(a.skin, "skin"),
    hair: tones(a.hairColor, "hair"),
    cloth: tones(a.wearing.color, "cloth"),
    trim: tones(a.wearing.trim, "cloth"),
    lower: tones(a.wearing.lowerColor, "cloth"),
    cloak: tones(a.wearing.cloakColor, "cloth"),
    gold: {
      edge: "#5a3a16",
      deep: "#8c6420",
      shade: "#b8852c",
      base: GOLD,
      light: "#eec463",
      high: "#f9e3a0",
    },
    top,
    chin,
    nearX,
    farX,
    volume,
    eyeY,
    mouthY,
    noseTip,
    headPoints,
    shoulder,
    hemY,
  };
}

function drawTorso(r: Raster, m: Model) {
  const { cloth, skin, a } = m;
  const s = m.shoulder;
  const nearArm = 4 + s,
    farArm = 60 - s;
  const garment = a.wearing.garment;
  const vNeck = garment === "shirt" || garment === "coat";
  const high = garment === "robe" || garment === "wrap";
  const neckline: Pt[] = high
    ? [
        [22, 51],
        [30, 52.5],
        [36, 53],
        [42, 52.5],
        [47, 51],
      ]
    : vNeck
      ? [
          [22, 51],
          [28, 55],
          [35, 60],
          [42, 55],
          [47, 51],
        ]
      : [
          [21, 51.5],
          [25, 55],
          [30, 57.5],
          [36, 58],
          [42, 57],
          [46, 54],
          [48, 51.5],
        ];
  const body: Pt[] = [
    ...neckline,
    [53, 53],
    [57.5 - s, 57],
    [farArm - 0.5, 63],
    [farArm, 80],
    [nearArm, 80],
    [nearArm + 0.5, 63],
    [7 + s, 57],
    [13, 53],
  ];
  r.poly(body, cloth.base, MAT.cloth);

  // Far side of the chest turns away from the light.
  r.paint(
    r.region([
      [49, 52],
      [61, 56],
      [61, 80],
      [46, 80],
      [44, 66],
    ]),
    shadow(0.22),
    { only: [MAT.cloth], soft: true },
  );
  r.paint(
    r.region([
      [8, 56],
      [22, 52],
      [24, 57],
      [16, 62],
      [8, 64],
    ]),
    light(0.16),
    { only: [MAT.cloth], soft: true },
  );
  // Folds fall from the neckline toward the belt.
  r.stroke(
    [
      [27, 61],
      [26, 70],
      [27, 79],
    ],
    cloth.shade,
    3,
  );
  r.stroke(
    [
      [43, 61],
      [45, 70],
      [46, 79],
    ],
    cloth.shade,
    3,
  );
  r.stroke(
    [
      [15, 60],
      [12, 72],
    ],
    cloth.light,
    2,
  );

  if (a.wearing.cloak) drawCloak(r, m, nearArm, farArm);

  // Bare arms below the sleeve hem; the arm is a cylinder lit from the left.
  if (m.hemY < 80) {
    const hem = m.hemY;
    const near = r.region([
      [nearArm + 0.5, hem],
      [13.5, hem],
      [14, 80],
      [nearArm, 80],
    ]);
    const far = r.region([
      [51, hem + 1],
      [farArm - 0.5, hem + 1],
      [farArm, 80],
      [50.5, 80],
    ]);
    r.fill(near, skin.base, MAT.skin);
    r.fill(far, skin.base, MAT.skin);
    r.paint(
      r.region([
        [10, hem],
        [14, hem],
        [14, 80],
        [11, 80],
      ]),
      shadow(0.3),
      { only: [MAT.skin], soft: true },
    );
    r.paint(
      r.region([
        [nearArm + 1, hem + 2],
        [nearArm + 3, hem + 2],
        [nearArm + 3, 80],
        [nearArm + 1, 80],
      ]),
      light(0.2),
      { only: [MAT.skin], dither: true },
    );
    r.paint(
      r.region([
        [56, hem],
        [farArm, hem],
        [farArm, 80],
        [56, 80],
      ]),
      shadow(0.35),
      { only: [MAT.skin], soft: true },
    );
    if (a.wearing.sleeves === "loose")
      for (const x of [nearArm + 2, 52]) r.rect(x, hem - 1, 9, 1, cloth.deep);
  }

  if (a.wearing.shoulderCloth) {
    r.poly(
      [
        [40, 51],
        [49, 52],
        [56, 57],
        [59, 64],
        [38, 80],
        [17, 80],
      ],
      m.trim.base,
      MAT.trim,
    );
    r.stroke(
      [
        [52, 58],
        [30, 79],
      ],
      m.trim.shade,
      2,
    );
    r.stroke(
      [
        [46, 54],
        [24, 75],
      ],
      m.trim.light,
      3,
    );
  }

  const belt = a.wearing.belt ?? "none";
  if (belt !== "none" && !high) {
    const y = belt === "cord" ? 76 : 74;
    const h = belt === "cord" ? 2 : belt === "wide" ? 5 : 4;
    const t =
      belt === "leather"
        ? tones(mix(a.wearing.lowerColor, "#4a2a18", 0.6), "cloth")
        : m.lower;
    r.poly(
      [
        [nearArm + 9, y],
        [52, y],
        [52, y + h],
        [nearArm + 9, y + h],
      ],
      t.base,
      MAT.trim,
    );
    r.rect(nearArm + 10, y + 1, 26, 1, t.light);
    if (belt === "sash") r.rect(30, y, 3, h, t.shade);
  }

  // Neckline binding; a necklace adds a beaded collar on top of it.
  const collar: Pt[] = neckline;
  for (let i = 0; i + 1 < collar.length; i++) {
    const a1 = collar[i],
      b1 = collar[i + 1];
    r.line([a1[0], a1[1]], [b1[0], b1[1]], m.trim.base, MAT.trim);
    r.line([a1[0], a1[1] + 1], [b1[0], b1[1] + 1], m.trim.shade, MAT.trim);
  }
}

function drawCloak(r: Raster, m: Model, nearArm: number, farArm: number) {
  const c = m.cloak;
  r.poly(
    [
      [nearArm, 80],
      [nearArm, 62],
      [7, 56],
      [15, 52],
      [21, 52],
      [17, 60],
      [13, 80],
    ],
    c.base,
    MAT.cloth,
  );
  r.poly(
    [
      [47, 52],
      [53, 53],
      [58, 57],
      [farArm, 63],
      [farArm, 80],
      [50, 80],
      [46, 62],
    ],
    c.shade,
    MAT.cloth,
  );
  r.stroke(
    [
      [11, 58],
      [8, 79],
    ],
    c.light,
    3,
  );
}

function drawBackHair(r: Raster, m: Model) {
  const { a, hair, nearX, farX, top, volume: v } = m;
  const style = a.hair;
  if (style === "bald" || style === "cropped") return;
  const length =
    style === "long" ? 70 : style === "bob" ? 45 : style === "braid" ? 40 : 38;
  const bumpy =
    m.face.hairTexture === "curly" || m.face.hairTexture === "coiled";
  const region = r.region([
    [nearX - v - 1, length],
    [nearX - v - 1.5, 30],
    [nearX - v, 14],
    [26, top - v + 1],
    [36, top - v - 0.5],
    [45, top - v + 1],
    [farX + v, 14],
    [farX + v + 1, 30],
    [farX + v, length],
    [46, length + (style === "long" ? -2 : 0)],
    [41, length - 3],
    [29, length - 3],
    [24, length],
  ]);
  const parts = [region];
  if (bumpy) {
    const step = m.face.hairTexture === "coiled" ? 3 : 4;
    for (let y = 16; y < length; y += step) {
      parts.push(r.disc(nearX - v - 1, y + (y % 2 ? 0.5 : 0), 2));
      parts.push(r.disc(farX + v + 1, y + (y % 2 ? 0 : 0.5), 2));
    }
    for (let x = nearX - v; x < farX + v; x += step)
      parts.push(r.disc(x, length - 1, 2));
  }
  r.fill(Raster.union(...parts), hair.base, MAT.hair);
  if (style === "braid") {
    // Plait over the near shoulder.
    const path: Pt[] = [
      [nearX - 2, 34],
      [nearX - 4, 44],
      [nearX - 5, 56],
      [nearX - 4, 68],
      [nearX - 2, 79],
    ];
    let k = 0;
    for (let i = 0; i + 1 < path.length; i++) {
      const [ax, ay] = path[i],
        [bx, by] = path[i + 1];
      for (let t = 0; t < 1; t += 0.28, k++) {
        const x = ax + (bx - ax) * t,
          y = ay + (by - ay) * t;
        r.fill(r.disc(x + (k % 2 ? 1 : -1), y, 2.6), hair.base, MAT.hair);
        r.paint(r.disc(x + (k % 2 ? 0.5 : -1.5), y - 0.5, 1.1), hair.light, {
          only: [MAT.hair],
        });
      }
    }
  }
}

function drawNeck(r: Raster, m: Model) {
  const { skin, chin } = m;
  const w = m.a.build > 0 ? 1 : 0;
  r.poly(
    [
      [28 - w, chin - 8],
      [42 + w, chin - 8],
      [42.5 + w, 59],
      [27 - w, 59.5],
    ],
    skin.base,
    MAT.skin,
  );
  r.paint(
    r.region([
      [27, chin - 8],
      [43, chin - 8],
      [43, chin + 3],
      [27, chin + 3.5],
    ]),
    shadow(0.4),
    { only: [MAT.skin], soft: true },
  );
  r.paint(
    r.region([
      [38, chin - 8],
      [43, chin - 8],
      [43, 60],
      [39, 60],
    ]),
    shadow(0.28),
    { only: [MAT.skin], soft: true },
  );
  r.paint(
    r.region([
      [30, chin + 4],
      [32, chin + 4],
      [32, 59],
      [30, 59],
    ]),
    light(0.14),
    { only: [MAT.skin], dither: true },
  );
}

function drawHead(r: Raster, m: Model) {
  const { skin, farX, nearX, top, chin, eyeY } = m;
  r.poly(m.headPoints, skin.base, MAT.skin);
  // Far cheek and jaw turn into shadow.
  r.paint(
    r.region([
      [43, top + 4],
      [farX + 1, top + 4],
      [farX + 1, chin + 1],
      [40, chin + 1],
      [43, chin - 8],
      [41, eyeY + 6],
      [43, eyeY - 2],
    ]),
    shadow(0.3),
    { only: [MAT.skin], soft: true },
  );
  r.paint(
    r.region([
      [46, top + 8],
      [farX + 1, top + 8],
      [farX + 1, chin - 2],
      [45, chin - 4],
      [45, eyeY + 2],
    ]),
    shadow(0.2),
    { only: [MAT.skin], dither: true },
  );
  // Temple beside the near eye drops back too.
  r.paint(
    r.region([
      [nearX - 1, eyeY - 4],
      [nearX + 3, eyeY - 4],
      [nearX + 3.5, chin - 6],
      [nearX - 1, chin - 12],
    ]),
    shadow(0.2),
    { only: [MAT.skin], soft: true },
  );
  // Lit forehead and near cheek.
  r.paint(r.ellipse(30, top + 10, 6.5, 3.5), light(0.16), {
    only: [MAT.skin],
    soft: true,
  });
  r.paint(r.ellipse(27.5, eyeY + 7, 4, 3), light(0.14), {
    only: [MAT.skin],
    soft: true,
  });
  // Under-chin plane.
  r.paint(
    r.region([
      [29, chin - 2.5],
      [41, chin - 2.5],
      [39, chin + 1],
      [31, chin + 1],
    ]),
    shadow(0.22),
    { only: [MAT.skin], soft: true },
  );
}

function drawEar(r: Raster, m: Model) {
  const { skin, nearX, eyeY } = m;
  const x = nearX,
    y = eyeY - 1;
  r.poly(
    [
      [x - 3.5, y + 1],
      [x - 1.5, y - 0.5],
      [x + 1.5, y],
      [x + 1.5, y + 8.5],
      [x - 1, y + 8.5],
      [x - 3.5, y + 6],
    ],
    skin.base,
    MAT.skin,
  );
  r.put(x - 2, y + 2, skin.shade);
  r.put(x - 2, y + 3, skin.deep);
  r.put(x - 1, y + 4, skin.shade);
  r.put(x - 1, y + 5, skin.shade);
  r.put(x - 2, y + 6, skin.deep);
  r.put(x - 3, y + 2, skin.light);
}

function drawFrontHair(r: Raster, m: Model) {
  const { a, hair, face, nearX, farX, top, volume: v, eyeY } = m;
  const style = a.hair;
  if (style === "bald") {
    r.paint(r.ellipse(31, top + 4, 6, 2.5), light(0.22), {
      only: [MAT.skin],
      soft: true,
    });
    return;
  }
  const line =
    (face.hairline === "high" ? 13 : face.hairline === "low" ? 17 : 15) +
    (top - 8);
  const peak = face.hairline === "widows-peak" ? 2 : 0;
  const sideLen =
    style === "cropped" ? eyeY - 3 : style === "curls" ? eyeY + 12 : eyeY + 6;
  const farInset = ["bob", "long", "curls"].includes(style) ? 3.5 : 0.5;
  const bumpy = face.hairTexture === "curly" || face.hairTexture === "coiled";
  const cap: Pt[] = [
    [nearX - v, 30],
    [nearX - v - 0.5, 19],
    [nearX - v + 1, top + 2],
    [26, top - v + 0.5],
    [36, top - v - 0.5],
    [45, top - v + 0.5],
    [farX + v - 1, top + 3],
    [farX + v, 19],
    [farX + v - 0.5, sideLen + (["bob", "long"].includes(style) ? 12 : 0)],
    [farX - farInset, sideLen + (["bob", "long"].includes(style) ? 12 : 0)],
    [farX - farInset - 0.5, line + 7],
    [45.5, line + 2],
    [42, line],
    [38, line - 0.5],
    [35.5, line + peak],
    [32, line + 0.5 - peak * 0.3],
    [28, line + 1.5],
    [25, line + 3.5],
    [23.5, line + 7],
    [nearX + 2, eyeY - 2],
    [nearX + 1.5, style === "cropped" ? eyeY - 3 : eyeY + 4],
    [nearX - 1, style === "cropped" ? eyeY - 3 : eyeY + 5],
    [nearX - v + 0.5, eyeY + 2],
  ];
  const parts = [r.region(cap)];
  if (bumpy) {
    const step = face.hairTexture === "coiled" ? 3 : 4;
    const ring: Pt[] = [
      [nearX - v + 0.5, 28],
      [nearX - v, 20],
      [nearX - v + 1.5, top + 2],
      [26, top - v + 0.5],
      [36, top - v - 0.5],
      [45, top - v + 0.5],
      [farX + v - 1.5, top + 3],
      [farX + v, 20],
      [farX + v - 0.5, 28],
    ];
    let k = 0;
    for (let i = 0; i + 1 < ring.length; i++) {
      const [ax, ay] = ring[i],
        [bx, by] = ring[i + 1];
      const len = Math.hypot(bx - ax, by - ay);
      for (let t = 0; t < len; t += step, k++) {
        const x = ax + ((bx - ax) * t) / len,
          y = ay + ((by - ay) * t) / len;
        parts.push(r.disc(x, y, k % 2 ? 2 : 1.6));
      }
    }
  }
  if (style === "topknot") parts.push(r.ellipse(37, top - v - 3.5, 5, 3.5));
  r.fill(Raster.union(...parts), hair.base, MAT.hair);
  if (style === "cropped") {
    r.paint(r.region(cap), (c) => mix(c, m.skin.base, 0.18), {
      only: [MAT.hair],
      dither: true,
    });
  }
}

function drawHairDetail(r: Raster, m: Model) {
  const { a, hair, face, nearX, farX, top, volume: v } = m;
  if (a.hair === "bald") return;
  if (a.wearing.headwear === "hood" || a.wearing.headwear === "wrap") return;
  const crownY = top - v;
  // Underside and far side fall into shadow.
  r.paint(
    r.region([
      [farX - 2, crownY + 4],
      [farX + v + 1, crownY + 6],
      [farX + v + 1, 80],
      [farX - 4, 80],
      [farX - 4, 20],
    ]),
    shadow(0.32),
    { only: [MAT.hair], soft: true },
  );
  r.paint(
    r.region([
      [nearX - v - 2, 30],
      [nearX + 2, 30],
      [nearX + 2, 80],
      [nearX - v - 2, 80],
    ]),
    shadow(0.2),
    { only: [MAT.hair], soft: true },
  );
  if (a.wearing.headwear === "cap") return;
  const texture = face.hairTexture;
  const strands: Pt[][] =
    texture === "straight"
      ? [
          [
            [30, crownY + 2],
            [24, crownY + 8],
            [22, crownY + 16],
          ],
          [
            [34, crownY + 1],
            [30, crownY + 6],
          ],
          [
            [39, crownY + 1],
            [43, crownY + 6],
            [46, crownY + 12],
          ],
          [
            [nearX - v + 1, 32],
            [nearX - v + 1, 42],
          ],
        ]
      : texture === "wavy"
        ? [
            [
              [29, crownY + 2],
              [25, crownY + 6],
              [26, crownY + 10],
              [23, crownY + 15],
            ],
            [
              [35, crownY + 1],
              [32, crownY + 4],
              [33, crownY + 7],
            ],
            [
              [41, crownY + 1.5],
              [44, crownY + 5],
              [43, crownY + 9],
              [46, crownY + 13],
            ],
            [
              [nearX - v + 1, 32],
              [nearX - v + 2, 37],
              [nearX - v + 1, 42],
            ],
          ]
        : [];
  for (const s of strands) r.stroke(s, hair.light, 3, undefined);
  if (texture === "curly" || texture === "coiled") {
    const step = texture === "coiled" ? 3 : 4;
    for (let y = crownY + 1; y < 60; y += step)
      for (let x = nearX - v; x < farX + v; x += step) {
        const j = ((x * 7 + y * 13) % 5) - 2;
        const px = x + (y % (2 * step) ? 1 : 0) + (j > 0 ? 1 : 0),
          py = y + (j < 0 ? 1 : 0);
        if (r.matAt(px, py) !== MAT.hair) continue;
        if (r.matAt(px + 1, py + 1) !== MAT.hair) continue;
        r.put(px, py, hair.light);
        if (texture === "coiled") r.put(px + 1, py + 1, hair.shade);
        else r.put(px + 1, py, hair.light);
      }
    // Keep the lower silhouette darker so the curls read as a mass.
    r.paint(
      r.region([
        [0, 36],
        [64, 36],
        [64, 80],
        [0, 80],
      ]),
      shadow(0.12),
      { only: [MAT.hair], dither: true },
    );
  } else {
    // Crown highlight arc.
    r.stroke(
      [
        [26, crownY + 4],
        [30, crownY + 2],
        [36, crownY + 1.5],
      ],
      hair.high,
      2,
    );
  }
  if (a.hair === "topknot")
    r.stroke(
      [
        [34, top - v - 5],
        [38, top - v - 5.5],
      ],
      hair.light,
      0,
    );
  if (a.hair === "long")
    for (const x of [nearX - v + 1, farX + v - 2])
      r.stroke(
        [
          [x, 50],
          [x + (x < 32 ? 1 : -1), 62],
        ],
        hair.shade,
        2,
      );
}

function drawBeard(r: Raster, m: Model) {
  const { a, hair, skin, chin, nearX, farX, mouthY } = m;
  const beard = a.beard;
  if (beard === "none" || m.age < 16) return;
  if (beard === "stubble") {
    r.paint(
      r.region([
        [nearX + 2, chin - 10],
        [27, chin - 6],
        [35, chin - 4],
        [43, chin - 8],
        [farX - 3, chin - 12],
        [farX - 4, chin - 3],
        [39, chin + 1],
        [31, chin + 1],
        [25, chin - 3],
      ]),
      (c) => mix(c, hair.shade, 0.35),
      { only: [MAT.skin], dither: true },
    );
    return;
  }
  if (beard === "moustache" || beard === "handlebar") {
    r.poly(
      [
        [29, mouthY - 2.5],
        [35, mouthY - 3.5],
        [41, mouthY - 2.5],
        [41.5, mouthY - 0.5],
        [35, mouthY - 1],
        [28.5, mouthY - 0.5],
      ],
      hair.base,
      MAT.hair,
    );
    if (beard === "handlebar") {
      r.line([27, mouthY - 1], [26, mouthY + 2], hair.base, MAT.hair);
      r.line([42, mouthY - 1], [43, mouthY + 2], hair.base, MAT.hair);
    }
    return;
  }
  const length = beard === "long" || beard === "forked" ? 12 : 4;
  const full: Pt[] =
    beard === "goatee"
      ? [
          [30, chin - 5],
          [40, chin - 5],
          [41, chin + 2],
          [36, chin + 5],
          [30, chin + 2],
        ]
      : beard === "chinstrap"
        ? [
            [nearX + 1, chin - 12],
            [24, chin - 6],
            [30, chin - 2],
            [36, chin - 1],
            [42, chin - 3],
            [farX - 5, chin - 8],
            [farX - 3, chin - 10],
            [farX - 3, chin - 6],
            [42, chin + 1],
            [36, chin + 2],
            [29, chin + 1],
            [23, chin - 4],
            [nearX + 1, chin - 9],
          ]
        : beard === "sideburns"
          ? [
              [nearX + 1, chin - 16],
              [nearX + 5, chin - 16],
              [nearX + 5, chin - 7],
              [nearX + 2, chin - 8],
            ]
          : [
              [nearX + 1.5, chin - 11],
              [26, chin - 5],
              [31, chin - 3],
              [36, chin - 2.5],
              [41, chin - 4],
              [45, chin - 7],
              [farX - 2.5, chin - 11],
              [farX - 2, chin - 4],
              [43, chin + length - 2],
              [37, chin + length + (beard === "forked" ? -3 : 1)],
              [30, chin + length - 1],
              [24, chin + length - 5],
              [nearX + 1, chin - 4],
            ];
  r.poly(full, hair.base, MAT.hair);
  if (beard === "forked") {
    r.poly(
      [
        [34, chin + 5],
        [36, chin + 5],
        [37, chin + length + 1],
        [33, chin + length + 1],
      ],
      skin.base,
      MAT.skin,
    );
  }
  if (!["goatee", "chinstrap", "sideburns"].includes(beard)) {
    // Moustache gap keeps the mouth readable.
    r.poly(
      [
        [30, mouthY - 0.5],
        [40, mouthY - 0.5],
        [40, mouthY + 2.5],
        [30, mouthY + 2.5],
      ],
      skin.base,
      MAT.skin,
    );
    r.poly(
      [
        [29, mouthY - 3],
        [35, mouthY - 3.5],
        [41, mouthY - 3],
        [41, mouthY - 0.5],
        [29, mouthY - 0.5],
      ],
      hair.base,
      MAT.hair,
    );
  }
  r.paint(
    r.region([
      [38, chin - 6],
      [farX, chin - 6],
      [farX, chin + 14],
      [38, chin + 14],
    ]),
    shadow(0.3),
    { only: [MAT.hair], soft: true },
  );
  for (const [x, y] of [
    [27, chin - 2],
    [31, chin + 1],
    [26, chin - 6],
  ] as Pt[])
    if (r.matAt(x, y) === MAT.hair) r.put(x, y, hair.light);
}

function drawHoodBack(r: Raster, m: Model) {
  const { cloth, nearX, farX, top } = m;
  r.poly(
    [
      [nearX - 6, 60],
      [nearX - 6.5, 24],
      [nearX - 4, 8],
      [26, top - 5],
      [36, top - 7],
      [46, top - 5],
      [farX + 4, 8],
      [farX + 6.5, 24],
      [farX + 6, 60],
    ],
    cloth.shade,
    MAT.cloth,
  );
}

function drawHeadwear(r: Raster, m: Model) {
  const { a, cloth, trim, nearX, farX, top, volume: v, chin } = m;
  const wear = a.wearing.headwear;
  if (wear === "none") return;
  if (wear === "band") {
    const y = top + 5;
    r.poly(
      [
        [nearX - v - 0.5, y + 2],
        [nearX - v + 1, y - 1],
        [30, y - 2.5],
        [40, y - 3],
        [farX + v - 1, y - 1],
        [farX + v + 0.5, y + 2],
        [farX + v, y + 4.5],
        [40, y],
        [30, y + 0.5],
        [nearX - v + 0.5, y + 4.5],
      ],
      trim.base,
      MAT.trim,
    );
    r.stroke(
      [
        [nearX - v + 3, y],
        [30, y - 1.5],
        [38, y - 2],
      ],
      trim.light,
      0,
    );
    r.paint(
      r.region([
        [44, y - 4],
        [farX + v + 1, y - 4],
        [farX + v + 1, y + 6],
        [44, y + 6],
      ]),
      shadow(0.3),
      { only: [MAT.trim] },
    );
    return;
  }
  if (wear === "cap") {
    const y = top + 6;
    r.poly(
      [
        [nearX - v - 1, y + 1],
        [nearX - v - 0.5, top - 1],
        [26, top - v - 3],
        [36, top - v - 4.5],
        [46, top - v - 3],
        [farX + v + 0.5, top - 1],
        [farX + v + 1, y + 1],
        [farX + v - 1, y + 2.5],
        [36, y + 1],
        [nearX - v + 1, y + 2.5],
      ],
      cloth.base,
      MAT.cloth,
    );
    r.paint(
      r.region([
        [42, top - v - 5],
        [farX + v + 2, top - v - 5],
        [farX + v + 2, y + 3],
        [42, y + 3],
      ]),
      shadow(0.3),
      { only: [MAT.cloth], soft: true },
    );
    r.stroke(
      [
        [26, top - v - 1],
        [31, top - v - 2.5],
        [37, top - v - 3],
      ],
      cloth.light,
      2,
    );
    r.rect(nearX - v, y + 1, farX - nearX + 2 * v + 1, 1, trim.base, MAT.trim);
    return;
  }
  if (wear === "wrap") {
    const c = top - v;
    r.poly(
      [
        [nearX - v - 1.5, 24],
        [nearX - v - 2, 13],
        [nearX - v + 1, c - 1],
        [27, c - 4],
        [37, c - 6],
        [46, c - 4],
        [farX + v - 1, c - 1],
        [farX + v + 2, 13],
        [farX + v + 1.5, 24],
        [farX - 2, 19],
        [45, 15.5],
        [36, 14],
        [27, 15],
        [23, 18],
        [nearX + 1, 24],
      ],
      cloth.base,
      MAT.cloth,
    );
    r.stroke(
      [
        [nearX - v, 22],
        [27, 12],
        [40, 8],
        [farX + v, 14],
      ],
      cloth.deep,
      0,
    );
    r.stroke(
      [
        [nearX - v + 2, 17],
        [30, 8],
        [43, 6],
      ],
      cloth.light,
      2,
    );
    r.paint(
      r.region([
        [44, 0],
        [64, 0],
        [64, 30],
        [44, 30],
      ]),
      shadow(0.3),
      { only: [MAT.cloth], soft: true },
    );
    r.stroke(
      [
        [nearX - v, 24],
        [30, 16],
        [45, 16],
        [farX + v, 22],
      ],
      trim.base,
      0,
      MAT.trim,
    );
    return;
  }
  if (wear === "hood") {
    const outer = r.region([
      [nearX - 6, 60],
      [nearX - 6.5, 24],
      [nearX - 4, 8],
      [26, top - 5],
      [36, top - 7],
      [46, top - 5],
      [farX + 4, 8],
      [farX + 6.5, 24],
      [farX + 6, 60],
    ]);
    const opening = r.region([
      [nearX - 2, 60],
      [nearX - 1.5, 26],
      [nearX + 1, 14],
      [27, top + 2],
      [36, top + 0.5],
      [44, top + 2],
      [farX - 1, 14],
      [farX + 1.5, 26],
      [farX + 2, 60],
    ]);
    r.fill(Raster.diff(outer, opening), cloth.base, MAT.cloth);
    r.paint(
      r.region([
        [42, 0],
        [64, 0],
        [64, 60],
        [42, 60],
      ]),
      shadow(0.3),
      { only: [MAT.cloth], soft: true },
    );
    // Hair fringe under the hood.
    if (a.hair !== "bald")
      r.poly(
        [
          [26, top + 1],
          [36, top],
          [44, top + 1],
          [45, top + 8],
          [36, top + 6],
          [27, top + 9],
        ],
        m.hair.base,
        MAT.hair,
      );
    r.paint(
      r.region([
        [nearX, chin - 2],
        [farX + 2, chin - 2],
        [farX + 2, 60],
        [nearX, 60],
      ]),
      shadow(0.35),
      { only: [MAT.cloth], soft: true },
    );
  }
}

function drawJewellery(r: Raster, m: Model) {
  const { a, gold, nearX, eyeY } = m;
  if (a.wearing.earrings) {
    const x = nearX - 1.5,
      y = eyeY + 8;
    r.put(x, y, gold.deep, MAT.metal);
    r.put(x - 1, y + 1, gold.light, MAT.metal);
    r.put(x + 1, y + 1, gold.base, MAT.metal);
    r.put(x - 1, y + 2, gold.light, MAT.metal);
    r.put(x + 1, y + 2, gold.shade, MAT.metal);
    r.put(x, y + 3, gold.base, MAT.metal);
    r.put(x - 1, y + 1, gold.high);
  }
  if (a.wearing.necklace) {
    const beads: Pt[] = [
      [23, 55],
      [26, 58],
      [30, 60.5],
      [35, 61.5],
      [40, 60.5],
      [44, 58],
      [46.5, 55],
    ];
    for (let i = 0; i + 1 < beads.length; i++)
      r.line(beads[i], beads[i + 1], gold.shade, MAT.metal);
    for (const [x, y] of beads) {
      r.put(x, y, gold.light, MAT.metal);
      r.put(x, y + 1, gold.base, MAT.metal);
    }
    r.put(35, 62, gold.high, MAT.metal);
    // Matching armband on the near arm.
    if (m.hemY < 76) {
      const y = m.hemY + 3;
      r.rect(6 + m.shoulder, y, 8, 2, gold.base, MAT.metal);
      r.rect(7 + m.shoulder, y, 4, 1, gold.light);
      r.rect(11 + m.shoulder, y + 1, 3, 1, gold.shade);
    }
  }
}

function drawFeatures(r: Raster, m: Model) {
  const { face, skin, hair, eyeY, noseTip, mouthY, chin, a, age } = m;
  const child = age < 13;
  const eyeDark = mix(a.hairColor, "#1b1626", 0.6);
  const iris = mix(a.hairColor, "#2d2440", 0.35);
  const white = mix("#f4ebdc", a.skin, 0.1);
  const lid = mix(skin.deep, hair.edge, 0.5);

  const w =
    (face.eyeSize === "large" ? 7 : face.eyeSize === "small" ? 5 : 6) +
    (child ? 1 : 0);
  const h = face.eyeShape === "narrow" ? 2 : 3;
  const spacing =
    face.eyeSpacing === "wide" ? 1 : face.eyeSpacing === "close" ? -1 : 0;
  const nearX0 = 24 - spacing - (w - 6);
  const farX0 = 37 + spacing;
  const farW = Math.max(3, w - 2);

  const eye = (x0: number, width: number, near: boolean) => {
    r.rect(x0, eyeY, width, h, white);
    // Lash line and corners.
    r.rect(x0, eyeY - 1, width, 1, lid);
    if (face.eyeShape === "almond") {
      const outer = near ? x0 - 1 : x0 + width;
      r.put(outer, eyeY, lid);
      r.put(near ? x0 : x0 + width - 1, eyeY + h - 1, skin.shade);
    } else if (face.eyeShape === "round") {
      r.put(x0, eyeY - 1, skin.base);
      r.put(x0 + width - 1, eyeY - 1, skin.base);
      r.put(x0, eyeY, lid);
      r.put(x0 + width - 1, eyeY, lid);
      r.rect(x0 + 1, eyeY - 1, width - 2, 1, lid);
    }
    if (face.eyeShape === "narrow") r.rect(x0, eyeY - 1, width, 1, lid);
    // Iris looks slightly toward the viewer's right.
    const iw = face.eyeSize === "large" || child ? 3 : 2;
    const ix = near ? x0 + Math.floor((width - iw) / 2) + 1 : x0 + 1;
    r.rect(ix, eyeY, iw, h, iris);
    r.rect(ix + (iw > 2 ? 1 : 0), eyeY, 1, h, eyeDark);
    r.put(ix, eyeY, "#f9f2e2");
    if (h > 2) r.rect(ix, eyeY + h - 1, iw, 1, mix(iris, white, 0.25));
    // Lower lid.
    r.rect(x0 + 1, eyeY + h, width - 2, 1, skin.shade);
    // Eye socket shadow at the inner corner.
    r.put(
      near ? x0 + width : x0 - 1,
      eyeY + 1,
      mix(skin.base, skin.shade, 0.6),
    );
  };
  eye(nearX0, w, true);
  eye(farX0, farW, false);

  // Brows: the near brow is longer; the far one foreshortens.
  const browY = eyeY - 3 - (face.brows === "arched" ? 1 : 0);
  const browColor = age >= 55 ? mix(hair.deep, skin.shade, 0.3) : hair.deep;
  const thick = face.brows === "heavy";
  const nearBrow: Pt[] =
    face.brows === "arched"
      ? [
          [nearX0 - 1, browY + 2],
          [nearX0 + 1, browY],
          [nearX0 + w - 1, browY],
          [nearX0 + w + 1, browY + 1.5],
        ]
      : [
          [nearX0 - 1, browY + 1],
          [nearX0 + 2, browY],
          [nearX0 + w + 1, browY + 0.5],
        ];
  const farBrow: Pt[] =
    face.brows === "arched"
      ? [
          [farX0 - 1, browY + 1],
          [farX0 + 1, browY],
          [farX0 + farW, browY + 0.5],
          [farX0 + farW + 1, browY + 2],
        ]
      : [
          [farX0 - 1, browY + 0.5],
          [farX0 + farW - 1, browY],
          [farX0 + farW + 1, browY + 1],
        ];
  r.stroke(nearBrow, browColor);
  r.stroke(farBrow, browColor);
  if (thick) {
    r.stroke(
      nearBrow.map(([x, y]) => [x, y + 1] as Pt),
      hair.base,
    );
    r.stroke(
      farBrow.map(([x, y]) => [x, y + 1] as Pt),
      hair.base,
    );
  }

  // Nose: lit bridge on the left, shaded plane on the right, tip toward the far cheek.
  const bridgeX = 33;
  const tipX = face.nose === "broad" ? 36 : 36;
  const bump = face.nose === "aquiline" ? 1 : 0;
  const shadeSide: Pt[] = [
    [bridgeX + 1, eyeY + 1],
    [bridgeX + 2 + bump, eyeY + 3],
    [tipX + 1, noseTip - 2],
    [tipX + 1, noseTip - 1],
  ];
  r.stroke(shadeSide, skin.shade);
  r.stroke(
    [
      [bridgeX, eyeY + 2],
      [bridgeX + bump, eyeY + 4],
      [tipX - 1, noseTip - 3],
    ],
    skin.light,
    child ? 2 : 0,
  );
  if (face.nose === "aquiline") {
    r.put(bridgeX + 2, eyeY + 4, skin.high);
    r.put(bridgeX + 3, eyeY + 5, skin.deep);
  }
  r.put(tipX, noseTip - 2, skin.high);
  const nostrilW = face.nose === "broad" ? 4 : face.nose === "short" ? 2 : 3;
  r.rect(tipX - nostrilW + 1, noseTip, nostrilW, 1, skin.shade);
  r.put(tipX - nostrilW + 1, noseTip - 1, skin.deep);
  r.put(tipX + 1, noseTip, skin.deep);
  if (face.nose === "broad") r.put(tipX - 3, noseTip - 1, skin.shade);
  r.rect(
    tipX - nostrilW + 2,
    noseTip + 1,
    nostrilW - 1,
    1,
    mix(skin.base, skin.shade, 0.5),
  );

  // Mouth: the near half is longer.
  const mw = face.mouth === "wide" ? 9 : face.mouth === "narrow" ? 5 : 7;
  const mx = 35 - Math.ceil(mw * 0.55);
  const lipLine = mix(skin.deep, "#7d3a45", 0.45);
  const lower = mix(skin.light, "#c2646a", face.mouth === "full" ? 0.5 : 0.3);
  r.rect(mx, mouthY, mw, 1, lipLine);
  r.put(mx, mouthY, skin.deep);
  r.put(mx + mw - 1, mouthY, skin.deep);
  if (face.mouth === "full") {
    r.rect(mx + 1, mouthY + 1, mw - 2, 1, lower);
    r.rect(mx + 2, mouthY + 2, mw - 4, 1, skin.shade);
    r.rect(mx + 2, mouthY - 1, mw - 3, 1, mix(skin.base, lipLine, 0.5));
  } else if (face.mouth === "soft") {
    r.rect(mx + 1, mouthY + 1, mw - 2, 1, mix(lower, skin.base, 0.4));
    r.rect(mx + 2, mouthY + 2, mw - 4, 1, mix(skin.base, skin.shade, 0.6));
  } else {
    r.rect(mx + 1, mouthY + 1, mw - 2, 1, mix(skin.base, skin.shade, 0.55));
  }
  // Philtrum highlight and chin light.
  r.put(35, mouthY - 1, mix(skin.base, skin.light, 0.5));
  r.rect(32, chin - 2, 4, 1, mix(skin.base, skin.light, 0.6));

  if (face.detail === "freckles")
    for (const [x, y] of [
      [25, eyeY + 6],
      [28, eyeY + 7],
      [27, eyeY + 5],
      [31, eyeY + 6],
      [40, eyeY + 6],
      [43, eyeY + 5],
      [41, eyeY + 8],
    ] as Pt[])
      if (r.matAt(x, y) === MAT.skin)
        r.put(x, y, mix(r.at(x, y), skin.deep, 0.55));
  if (face.detail === "lines" || face.detail === "weathered" || age >= 55) {
    const l = mix(skin.base, skin.deep, 0.55);
    r.stroke(
      [
        [tipX - 3, noseTip],
        [mx - 1, mouthY + 1],
      ],
      l,
      2,
    );
    r.stroke(
      [
        [tipX + 2, noseTip + 1],
        [mx + mw, mouthY + 1],
      ],
      l,
      2,
    );
    r.rect(nearX0 + 1, eyeY + h + 1, w - 3, 1, l);
    if (face.detail === "weathered" || age >= 65) {
      r.stroke(
        [
          [27, eyeY - 7],
          [40, eyeY - 7.5],
        ],
        l,
        3,
      );
      r.stroke(
        [
          [nearX0 - 3, eyeY + 1],
          [nearX0 - 2, eyeY + 3],
        ],
        l,
      );
      r.rect(farX0 + 1, eyeY + h + 1, farW - 2, 1, l);
    }
  }
}
