import type { CharacterAppearance, CharacterFace } from "../../core/character";
import type { Material } from "../../content/characters/wardrobe/cloth";
import { mix } from "../characters/pixels";
import { portraitFace } from "./layered";
import {
  MAT,
  Raster,
  shadeRamp,
  smooth,
  tones,
  type Pt,
  type Tones,
} from "./raster";

/** A blink is three frames: the lid on its way down, shut, and on its way up
 * again is the same middle frame played back. */
export type Blink = 0 | 1 | 2;

export const PORTRAIT_WIDTH = 64;
export const PORTRAIT_HEIGHT = 80;

/** Live-tunable construction defaults; every value is an offset from the baked geometry. */
export type ConstructedTuning = {
  turn: number;
  faceWidth: number;
  jawWidth: number;
  jawHeight: number;
  chinWidth: number;
  chinLength: number;
  eyeHeight: number;
  noseLength: number;
  mouthDrop: number;
  neckWidth: number;
  hairVolume: number;
  shoulders: number;
  shadow: number;
};

export const constructedDefaults: ConstructedTuning = {
  turn: -0.5,
  faceWidth: 0.5,
  jawWidth: 1,
  jawHeight: 2.5,
  chinWidth: 1.5,
  chinLength: 3,
  eyeHeight: 0,
  noseLength: 1,
  mouthDrop: 0,
  neckWidth: 1,
  hairVolume: 0,
  shoulders: 0,
  shadow: 1.6,
};

export const constructedRanges: Record<
  keyof ConstructedTuning,
  { label: string; min: number; max: number; step: number }
> = {
  turn: { label: "Turn (feature midline)", min: -4, max: 4, step: 0.5 },
  faceWidth: { label: "Face width", min: -3, max: 3, step: 0.5 },
  jawWidth: { label: "Jaw width", min: -3, max: 3, step: 0.5 },
  jawHeight: { label: "Jaw height", min: -3, max: 5, step: 0.5 },
  chinWidth: { label: "Chin width", min: -2, max: 3, step: 0.5 },
  chinLength: { label: "Chin length", min: -2, max: 6, step: 0.5 },
  eyeHeight: { label: "Eye height", min: -2, max: 2, step: 1 },
  noseLength: { label: "Nose length", min: -2, max: 2, step: 1 },
  mouthDrop: { label: "Mouth drop", min: -2, max: 2, step: 1 },
  neckWidth: { label: "Neck width", min: -2, max: 4, step: 0.5 },
  hairVolume: { label: "Hair volume", min: -2, max: 2, step: 0.5 },
  shoulders: { label: "Shoulder width", min: -3, max: 3, step: 1 },
  shadow: { label: "Shadow strength", min: 0.4, max: 2.4, step: 0.1 },
};

/** Headwear that hides the crown: no parting, crown highlight or texture. */
const COVERED = new Set([
  "hood",
  "wrap",
  "turban",
  "headscarf",
  "veil",
  "helmet",
  "visor",
  "wig",
]);

const SHADOW = "#3a2040";
const LIGHT = "#fff1c8";
const shadow = (t: number) => (c: string) => mix(c, SHADOW, t);
const lift = (t: number) => (c: string) => mix(c, LIGHT, t);

/**
 * Slot C. The head is a three-quarter construction turned toward the viewer's
 * right: the feature midline sits at about two thirds of the face width, the
 * far eye is foreshortened against the far edge, the nose is a profile that
 * overlaps the far cheek, the near jaw runs diagonally to an off-centre chin,
 * and only the near ear shows. Light comes from the upper left.
 */
export function drawConstructedPortrait(
  ctx: CanvasRenderingContext2D,
  appearance: CharacterAppearance,
  age = 30,
  options?: { tuning?: Partial<ConstructedTuning>; blink?: Blink },
) {
  ctx.clearRect(0, 0, PORTRAIT_WIDTH, PORTRAIT_HEIGHT);
  ctx.imageSmoothingEnabled = false;
  paintConstructed(appearance, age, options?.tuning, options?.blink).blit(ctx);
}

type Model = {
  a: CharacterAppearance;
  face: CharacterFace;
  age: number;
  child: boolean;
  skin: Tones;
  hair: Tones;
  cloth: Tones;
  trim: Tones;
  lower: Tones;
  cloak: Tones;
  gold: Tones;
  /** Skull top under the hair. */
  top: number;
  chin: number;
  /** Near (viewer's left) face edge at eye level, excluding the ear. */
  nearX: number;
  /** Far (viewer's right) face edge at cheekbone level. */
  farX: number;
  /** Feature midline at mouth level. */
  mid: number;
  eyeY: number;
  browY: number;
  noseBase: number;
  mouthY: number;
  hairline: number;
  volume: number;
  hemY: number;
  shoulder: number;
  shadowScale: number;
  neckWidth: number;
  /** Torso narrowing for children and youths; 1 is adult. */
  bodyScale: number;
  /** Hairline retreat at the temples for elders, in pixels. */
  recede: number;
  /** Stable per-face roll for the traits the record does not name: lash
   * length, lid crease, brow density, under-eye. */
  variant: number;
  /** 0 open, 1 half closed, 2 shut. The only thing that animates. */
  blink: Blink;
  head: Pt[];
};

export function paintConstructed(
  appearance: CharacterAppearance,
  age = 30,
  tuning?: Partial<ConstructedTuning>,
  blink: Blink = 0,
): Raster {
  const r = new Raster(PORTRAIT_WIDTH, PORTRAIT_HEIGHT);
  const m = model(appearance, age, { ...constructedDefaults, ...tuning }, blink);
  const hood = m.a.wearing.headwear === "hood";

  drawTorso(r, m);
  if (hood) drawHoodBack(r, m);
  else drawBackHair(r, m);
  drawNeck(r, m);
  if (!hood) drawCollar(r, m);
  drawClothEdge(r, m);
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
    [MAT.metal]: m.gold,
  });
  r.castShadows(0.26);
  drawFeatures(r, m);
  drawHairDetail(r, m);
  if (m.a.wearing.headwear === "helmet") drawNasal(r, m);
  return r;
}

function model(
  a: CharacterAppearance,
  age: number,
  t: ConstructedTuning,
  blink: Blink = 0,
): Model {
  const face = portraitFace(a, age);
  const child = age < 13;
  const youth = !child && age < 17;
  const head = a.head ?? "original";
  const jaw = child ? "soft" : (a.jaw ?? "original");
  const top =
    (head === "long" ? 6 : head === "round" ? 8 : 7) + (child ? 1 : 0);
  const chin =
    41 +
    (face.chin === "long" ? 2 : face.chin === "short" ? -1 : 0) +
    (head === "long" ? 1 : head === "round" ? -1 : 0) +
    (jaw === "small" ? -1 : 0) -
    (child ? 2 : youth ? 1 : 0) +
    t.chinLength;
  const widen =
    (head === "broad" ? 1.5 : head === "round" ? 1 : 0) + (child ? 1 : 0);
  const nearX = 21.5 - widen - t.faceWidth / 2;
  const farX = 47 + widen + t.faceWidth / 2;
  const mid = 38 + t.turn;
  const eyeY = 25 + (child ? 2 : 0) + (head === "long" ? 1 : 0) + t.eyeHeight;
  const browY = eyeY - 3;
  const noseBase =
    eyeY +
    (face.nose === "short" ? 6 : face.nose === "aquiline" ? 8 : 7) +
    t.noseLength -
    (child ? 1 : 0);
  const mouthY = Math.min(chin - 5, noseBase + 4 + t.mouthDrop);
  const recede = a.hair === "bald" ? 0 : age >= 65 ? 2 : age >= 55 ? 1 : 0;
  const hairline =
    (face.hairline === "high" ? 12 : face.hairline === "low" ? 16 : 14) +
    (top - 7) -
    recede;
  const volume = Math.max(
    1,
    (a.hair === "cropped" || a.hair === "bald"
      ? 1
      : a.hair === "curls"
        ? 5
        : a.hair === "braid" || a.hair === "topknot"
          ? 2
          : a.hair === "bob" || a.hair === "long"
            ? 4
            : 3) + (a.hair === "bald" ? 0 : t.hairVolume),
  );
  const sleeves = a.wearing.sleeves ?? "long";
  const hemY =
    sleeves === "none"
      ? 56
      : sleeves === "short"
        ? 67
        : sleeves === "loose"
          ? 76
          : 81;

  // Jaw variants move the two jaw corners and the chin tip.
  const nearBase: Pt =
    jaw === "square"
      ? [nearX + 3, chin - 5.5]
      : jaw === "soft"
        ? [nearX + 4.5, chin - 6.5]
        : [nearX + 4, chin - 7.5];
  const farBase: Pt =
    jaw === "square"
      ? [farX - 1.5, chin - 4.5]
      : jaw === "pointed"
        ? [farX - 3, chin - 7]
        : [farX - 2, chin - 6];
  const nearCorner: Pt = [nearBase[0] - t.jawWidth, nearBase[1] - t.jawHeight];
  const farCorner: Pt = [farBase[0] + t.jawWidth, farBase[1] - t.jawHeight];
  // Sex reads in two cues only: chin breadth here, brow weight in drawFeatures.
  const sex = a.physique?.sex ?? "unspecified";
  const chinW =
    (jaw === "pointed" || jaw === "small" ? 1.5 : 0) -
    t.chinWidth +
    (child ? 1 : 0) +
    (sex === "female" ? 0.5 : sex === "male" ? -0.5 : 0);
  const headPts: Pt[] = [
    [29, top + 0.5],
    [37, top - 0.5],
    [43, top + 1.5],
    [farX - 0.5, top + 6],
    [farX + 0.5, 22],
    [farX, 30],
    farCorner,
    [mid + 4.5 - chinW, chin - 2],
    [mid + 0.5, chin + 0.5],
    [mid - 4 + chinW, chin - 0.5],
    [28.5 + chinW * 0.5, chin - 3.5],
    nearCorner,
    [nearX + 1, 30],
    [nearX - 0.5, 23],
    [nearX - 1, 15],
    [23, top + 3],
  ];
  return {
    a,
    face,
    age,
    child,
    skin: tones(a.skin, "skin"),
    // Hair greys from the mid forties on, whatever colour it started.
    hair: tones(
      mix(
        a.hairColor,
        "#b8b2a6",
        age >= 45 ? Math.min(0.85, (age - 45) / 30) : 0,
      ),
      "hair",
    ),
    cloth: tones(a.wearing.color, "cloth"),
    trim: tones(a.wearing.trim, "cloth"),
    lower: tones(a.wearing.lowerColor, "cloth"),
    cloak: tones(a.wearing.cloakColor, "cloth"),
    gold: {
      edge: "#5a3a16",
      deep: "#8c6420",
      shade: "#b8852c",
      base: "#d9a441",
      light: "#eec463",
      high: "#f9e3a0",
    },
    top,
    chin,
    nearX,
    farX,
    mid,
    eyeY,
    browY,
    noseBase,
    mouthY,
    hairline,
    volume,
    hemY,
    shoulder:
      (a.build < 0 ? 2 : a.build > 0 ? -2 : 0) -
      t.shoulders +
      (child ? 6 : youth ? 3 : 0),
    shadowScale: t.shadow,
    neckWidth: t.neckWidth - (child ? 1.5 : youth ? 0.5 : 0),
    bodyScale: child ? 0.78 : youth ? 0.9 : 1,
    recede,
    blink,
    variant: [
      ...(a.skin + a.hairColor + a.hair + head + jaw + face.eyeShape),
    ].reduce((n, c) => (Math.imul(n, 31) + c.charCodeAt(0)) >>> 0, 11),
    head: smooth(headPts, 5),
  };
}

// ---------------------------------------------------------------- body

/**
 * What a garment does to the bust: where it stops at the neck, how the
 * shoulder sits, what binds the neckline, and how much skin is left showing.
 * Everything below the chest is out of frame, so this is the whole of a
 * garment's identity in a portrait.
 */
type Cut = {
  neck: "round" | "high" | "v" | "deep" | "scoop" | "square" | "slit" | "none";
  /** Squarer shoulders on tailored cloth; softer on a draped garment. */
  square: number;
  spread: number;
  collar: "none" | "band" | "stand" | "lapel" | "bertha";
  /** Skin left showing: a bare chest, bare shoulders, or one shoulder out. */
  bare: "none" | "all" | "shoulders" | "far";
  /** A contrasting layer under an open front. */
  inner: "none" | "shirt" | "panel";
};

const CUTS: Record<string, Cut> = {
  none: { neck: "none", square: 0, spread: 0, collar: "none", bare: "all", inner: "none" },
  loincloth: { neck: "none", square: 0, spread: 0, collar: "none", bare: "all", inner: "none" },
  tunic: { neck: "round", square: 0, spread: 0, collar: "band", bare: "none", inner: "none" },
  "long-tunic": { neck: "round", square: 0, spread: 0, collar: "band", bare: "none", inner: "none" },
  skirt: { neck: "round", square: 0, spread: -1, collar: "band", bare: "none", inner: "none" },
  robe: { neck: "high", square: 0, spread: 1, collar: "stand", bare: "none", inner: "none" },
  dress: { neck: "scoop", square: -1, spread: -1, collar: "band", bare: "none", inner: "none" },
  shirt: { neck: "v", square: 1, spread: 0, collar: "stand", bare: "none", inner: "none" },
  coat: { neck: "deep", square: 2, spread: 1, collar: "lapel", bare: "none", inner: "shirt" },
  suit: { neck: "deep", square: 2, spread: 1, collar: "lapel", bare: "none", inner: "shirt" },
  "open-robe": { neck: "deep", square: 0, spread: 2, collar: "lapel", bare: "none", inner: "panel" },
  wrap: { neck: "high", square: 0, spread: 1, collar: "none", bare: "far", inner: "none" },
  poncho: { neck: "slit", square: 3, spread: 3, collar: "none", bare: "none", inner: "none" },
  gown: { neck: "square", square: -1, spread: 0, collar: "bertha", bare: "shoulders", inner: "panel" },
};

function cutFor(m: Model): Cut {
  return CUTS[m.a.wearing.garment] ?? CUTS.tunic;
}

const NECKLINES: Record<Cut["neck"], Pt[]> = {
  high: [
    [25, 49],
    [36, 50.5],
    [46, 49],
  ],
  round: [
    [24, 48.5],
    [29, 51.5],
    [36, 53],
    [42, 51.5],
    [46.5, 48.5],
  ],
  scoop: [
    [22, 47.5],
    [28, 52.5],
    [36, 55],
    [44, 52.5],
    [50, 47.5],
  ],
  square: [
    [21, 47],
    [22, 53],
    [29, 55],
    [43, 55],
    [50, 53],
    [51, 47],
  ],
  v: [
    [25, 49],
    [30, 52.5],
    [36, 58],
    [42, 52.5],
    [46, 49],
  ],
  deep: [
    [25, 48.5],
    [29, 52],
    [36, 64],
    [43, 52],
    [47, 48.5],
  ],
  slit: [
    [23, 48],
    [31, 49.5],
    [36, 52],
    [41, 49.5],
    [49, 48],
  ],
  none: [
    [25, 49],
    [36, 50],
    [47, 49],
  ],
};

function necklineFor(m: Model): Pt[] {
  return NECKLINES[cutFor(m).neck].map(
    ([x, y]) => [36 + (x - 36) * m.bodyScale, y] as Pt,
  );
}

/** The bust silhouette. `cut.square` lifts and hardens the shoulder; a poncho
 * hangs off it straight, which is the whole shape. */
function bustShape(m: Model, cut: Cut, neckline: Pt[]): Pt[] {
  const s = m.shoulder - cut.spread;
  const bs = m.bodyScale;
  const q = cut.square;
  const nearArm = 4 + s,
    farArm = 60 - s;
  if (cut.neck === "slit")
    // Straight sides from a flat shoulder: no spline, or it reads as a tunic.
    return [
      ...neckline,
      [36 + 19 * bs, 49],
      [farArm - 1, 51],
      [farArm - 1, 84],
      [nearArm + 1, 84],
      [nearArm + 1, 51],
      [36 - 19 * bs, 49],
    ];
  return smooth(
    [
      ...neckline,
      [36 + 17 * bs, 50.5 - q * 0.5],
      [57.5 - s, 56 - q],
      [farArm - 0.5, 64 - q * 0.5],
      [farArm, 80],
      [farArm, 84],
      [nearArm, 84],
      [nearArm, 80],
      [nearArm + 0.5, 64 - q * 0.5],
      [7 + s, 56.5 - q],
      [36 - 24 * bs, 51 - q * 0.5],
      [36 - 17 * bs, 48.5 - q * 0.5],
    ],
    4,
  );
}

/** Torso the garment does not cover: both shoulders out of a gown, the far
 * shoulder out of a wrap. */
function bareArea(m: Model, cut: Cut): Pt[] | undefined {
  const bs = m.bodyScale;
  const bx = (x: number) => 36 + (x - 36) * bs;
  if (cut.bare === "shoulders")
    return [
      [0, 44],
      [64, 44],
      [64, 68],
      ...smooth(
        [
          [bx(56), 64],
          [bx(50), 60],
          [bx(45), 56],
          [bx(43), 54.5],
          [bx(29), 54.5],
          [bx(27), 56],
          [bx(22), 60],
          [bx(16), 64],
          [bx(16), 70],
          [bx(56), 70],
        ],
        4,
      ).filter(([, y]) => y < 68),
      [0, 68],
    ];
  if (cut.bare === "far")
    // A wrap passes under the far arm and over the near shoulder, so the
    // diagonal edge runs from the far shoulder down across the chest.
    return [
      [bx(40), 44],
      [64, 44],
      [64, 84],
      [bx(43), 84],
      [bx(46), 62],
    ];
  return undefined;
}

function drawTorso(r: Raster, m: Model) {
  const { cloth, skin, trim, a } = m;
  const cut = cutFor(m);
  const s = m.shoulder - cut.spread;
  const nearArm = 4 + s,
    farArm = 60 - s;
  const neckline = necklineFor(m);
  const bs = m.bodyScale;
  // Torso x positions shrink toward the centre for small bodies.
  const bx = (x: number) => 36 + (x - 36) * bs;
  const bust = r.region(bustShape(m, cut, neckline));

  // Skin first wherever the garment leaves the body showing; the cloth is
  // then laid over what it actually covers.
  const bare = bareArea(m, cut);
  const open = bare ? new Set(r.region(bare)) : undefined;
  const skinArea =
    cut.bare === "all" ? bust : open ? bust.filter((i) => open.has(i)) : [];
  const covered =
    cut.bare === "all" ? [] : open ? bust.filter((i) => !open.has(i)) : bust;
  if (skinArea.length) {
    const body = skinArea;
    r.fill(body, skin.base, MAT.skin);
    shadeRamp(r, body, [34, 60], [62, 66], 0.32, SHADOW, [MAT.skin]);
    shadeRamp(r, body, [22, 60], [6, 54], 0.16, LIGHT, [MAT.skin]);
    // Collarbones, which is the only anatomy a bare chest needs at this size.
    r.stroke(
      [
        [bx(24), 54],
        [bx(31), 56],
        [bx(35), 55.5],
      ],
      mix(skin.shade, SHADOW, 0.25),
      2,
      undefined,
      MAT.skin,
    );
    r.stroke(
      [
        [bx(37), 55.5],
        [bx(42), 56.5],
        [bx(48), 54.5],
      ],
      mix(skin.shade, SHADOW, 0.35),
      2,
      undefined,
      MAT.skin,
    );
  }
  if (covered.length) {
    r.fill(covered, cloth.base, MAT.cloth);
    shadeRamp(r, covered, [34, 60], [62, 66], 0.3, SHADOW, [MAT.cloth]);
    shadeRamp(r, covered, [22, 60], [6, 54], 0.16, LIGHT, [MAT.cloth]);
    // Folds fall from the neckline toward the belt.
    r.stroke(
      [
        [bx(29), 60],
        [bx(27), 70],
        [bx(28), 79],
      ],
      cloth.shade,
      3,
      undefined,
      MAT.cloth,
    );
    r.stroke(
      [
        [bx(44), 59],
        [bx(46), 69],
        [bx(47), 79],
      ],
      cloth.shade,
      3,
      undefined,
      MAT.cloth,
    );
    applyFinish(r, m, covered);
    drawMotif(r, m, cut, covered);
    drawFront(r, m, cut);
  }
  if (cut.bare === "far") drawWrapEdge(r, m);

  if (a.wearing.cloak) drawCloak(r, m, nearArm, farArm);
  else if (a.wearing.mantle) drawMantle(r, m, nearArm, farArm);

  if (m.hemY < 80 && cut.bare !== "all") {
    const hem = m.hemY;
    const nearIn = nearArm + 9 * bs,
      farIn = farArm - 9 * bs;
    const near = r.region([
      [nearArm + 0.5, hem - 0.5],
      [nearArm + 4, hem + 1.5],
      [nearIn - 1, hem + 1.5],
      [nearIn, hem - 0.5],
      [nearIn, 80],
      [nearArm, 80],
    ]);
    const far = r.region([
      [farIn, hem + 0.5],
      [farIn + 3, hem + 2],
      [farArm - 3, hem + 2],
      [farArm, hem + 0.5],
      [farArm, 80],
      [farIn - 0.5, 80],
    ]);
    r.fill(near, skin.base, MAT.skin);
    r.fill(far, skin.base, MAT.skin);
    shadeRamp(r, near, [nearArm + 3, 70], [nearIn, 70], 0.3, SHADOW, [
      MAT.skin,
    ]);
    shadeRamp(r, near, [nearArm + 4, 70], [nearArm, 70], 0.14, LIGHT, [
      MAT.skin,
    ]);
    shadeRamp(r, far, [farIn + 1, 70], [farArm, 70], 0.34, SHADOW, [MAT.skin]);
    // Sleeve hems curve over the arm.
    r.stroke(
      [
        [nearArm + 1, hem - 1],
        [nearArm + 4, hem + 0.5],
        [nearIn - 1, hem - 1],
      ],
      cloth.deep,
      0,
      MAT.cloth,
    );
    r.stroke(
      [
        [farIn, hem],
        [farIn + 4, hem + 1],
        [farArm - 1, hem],
      ],
      cloth.deep,
      0,
      MAT.cloth,
    );
  }

  if (a.wearing.shoulderCloth) {
    const drape = smooth(
      [
        [bx(41), 50.5],
        [bx(49), 52],
        [bx(56), 57],
        [bx(59), 64],
        [bx(52), 72],
        [bx(38), 80],
        [bx(38), 84],
        [bx(16), 84],
        [bx(16), 80],
        [bx(26), 68],
      ],
      3,
    );
    r.poly(drape, trim.base, MAT.trim);
    const region = r.region(drape);
    shadeRamp(r, region, [bx(40), 60], [bx(60), 66], 0.28, SHADOW, [MAT.trim]);
    r.stroke(
      [
        [bx(52), 58],
        [bx(30), 79],
      ],
      trim.shade,
      2,
    );
    r.stroke(
      [
        [bx(46), 54],
        [bx(24), 75],
      ],
      trim.light,
      3,
    );
  }

  const belt = a.wearing.belt ?? "none";
  if (belt !== "none" && cut.bare !== "all" && cut.neck !== "high") {
    const y = belt === "cord" ? 76 : 74;
    const h = belt === "cord" ? 2 : belt === "wide" ? 5 : 4;
    const t =
      belt === "leather"
        ? tones(mix(a.wearing.lowerColor, "#4a2a18", 0.6), "cloth")
        : m.lower;
    r.poly(
      [
        [bx(15), y],
        [bx(51), y - 0.5],
        [bx(51), y + h - 0.5],
        [bx(15), y + h],
      ],
      t.base,
      MAT.trim,
    );
    r.rect(bx(16), y + 1, Math.round(30 * bs), 1, t.light);
    shadeRamp(
      r,
      r.region([
        [34, y],
        [52, y],
        [52, y + h],
        [34, y + h],
      ]),
      [34, 76],
      [52, 76],
      0.3,
      SHADOW,
      [MAT.trim],
    );
    if (belt === "sash") r.rect(bx(31), y, 3, h, t.shade);
  }
}

/** The selvedge of a wrap, running over the near shoulder and down across the
 * chest. Without it the garment is a tunic with a bite out of it. */
function drawWrapEdge(r: Raster, m: Model) {
  const { cloth, trim } = m;
  const bs = m.bodyScale;
  const bx = (x: number) => 36 + (x - 36) * bs;
  const edge: Pt[] = [
    [bx(40), 47],
    [bx(43), 54],
    [bx(46), 62],
    [bx(44), 84],
  ];
  r.stroke(edge, trim.base, 0, MAT.trim);
  r.stroke(
    edge.map(([x, y]) => [x - 1.5, y] as Pt),
    trim.shade,
    0,
    MAT.trim,
  );
  r.stroke(
    edge.map(([x, y]) => [x - 3, y] as Pt),
    cloth.light,
    2,
    undefined,
    MAT.cloth,
  );
  // Gathers pull toward the near shoulder, where the cloth is carried.
  for (let k = 0; k < 3; k++)
    r.stroke(
      [
        [bx(38 - k * 2), 56 + k * 5],
        [bx(26 - k), 52 + k * 4],
      ],
      cloth.shade,
      3,
      undefined,
      MAT.cloth,
    );
}

/** What is under and over an open front: the shirt in a coat or suit, the
 * contrasting panel in an open robe or a gown's stomacher, and the lapels. */
function drawFront(r: Raster, m: Model, cut: Cut) {
  if (cut.inner === "none" && cut.collar !== "lapel") return;
  const { cloth, trim, lower, a } = m;
  const bs = m.bodyScale;
  const bx = (x: number) => 36 + (x - 36) * bs;
  if (cut.inner === "shirt") {
    // Linen: the lower colour lifted, never the garment's own cloth, or the
    // opening vanishes.
    const linen = tones(mix(a.wearing.lowerColor, "#efe4c8", 0.55), "cloth");
    const panel = r.region([
      [bx(32), 50],
      [bx(40), 50],
      [bx(39.5), 84],
      [bx(32.5), 84],
    ]);
    r.fill(panel, linen.base, MAT.cloth);
    shadeRamp(r, panel, [bx(34), 60], [bx(42), 60], 0.26, SHADOW, [MAT.cloth]);
    // The coat's own shadow falling on the shirt: without it a pale coat over
    // a pale shirt is one flat shape.
    r.stroke(
      [
        [bx(32), 51],
        [bx(32), 84],
      ],
      mix(linen.deep, SHADOW, 0.35),
      0,
      undefined,
      MAT.cloth,
    );
    r.stroke(
      [
        [bx(33), 52],
        [bx(33), 84],
      ],
      linen.shade,
      2,
      undefined,
      MAT.cloth,
    );
    r.stroke(
      [
        [bx(39), 51],
        [bx(39), 84],
      ],
      mix(linen.deep, SHADOW, 0.5),
      0,
      undefined,
      MAT.cloth,
    );
    r.stroke(
      [
        [bx(36), 56],
        [bx(36), 84],
      ],
      linen.shade,
      2,
      undefined,
      MAT.cloth,
    );
    if (a.wearing.garment === "suit") {
      // A knot at the throat and the blade hanging off it.
      const tie = r.region([
        [bx(34), 58],
        [bx(39), 58],
        [bx(40), 63],
        [bx(41), 84],
        [bx(33), 84],
        [bx(33), 63],
      ]);
      r.fill(tie, trim.base, MAT.trim);
      shadeRamp(r, tie, [bx(34), 62], [bx(41), 62], 0.3, SHADOW, [MAT.trim]);
      r.rect(bx(34), 58, Math.round(5 * bs), 3, trim.shade, MAT.trim);
      r.rect(bx(35), 58, Math.round(3 * bs), 1, trim.light);
    }
  } else if (cut.inner === "panel") {
    const panel = r.region([
      [bx(29), 52],
      [bx(43), 52],
      [bx(42), 84],
      [bx(30), 84],
    ]);
    r.fill(panel, lower.base, MAT.trim);
    shadeRamp(r, panel, [bx(32), 60], [bx(43), 60], 0.28, SHADOW, [MAT.trim]);
    r.stroke(
      [
        [bx(29), 53],
        [bx(30), 84],
      ],
      lower.light,
      0,
      undefined,
      MAT.trim,
    );
    r.stroke(
      [
        [bx(42), 53],
        [bx(41), 84],
      ],
      lower.deep,
      0,
      undefined,
      MAT.trim,
    );
    // A gown's stomacher is laced; an open robe's panel is plain cloth.
    if (a.wearing.garment === "gown")
      for (let y = 56; y < 82; y += 4)
        r.stroke(
          [
            [bx(31), y],
            [bx(41), y + 1.5],
          ],
          lower.light,
          0,
          undefined,
          MAT.trim,
        );
  }
  if (cut.collar !== "lapel") return;
  // Lapels: the cloth folded back, so they take the lit face of the ramp.
  const near = r.region([
    [bx(28), 49],
    [bx(24.5), 51],
    [bx(29), 70],
    [bx(33), 58],
  ]);
  const far = r.region([
    [bx(44), 49],
    [bx(47.5), 51],
    [bx(43), 71],
    [bx(39), 58],
  ]);
  r.fill(near, cloth.light, MAT.cloth);
  r.fill(far, cloth.shade, MAT.cloth);
  shadeRamp(r, near, [bx(24), 52], [bx(33), 64], 0.2, SHADOW, [MAT.cloth]);
  r.stroke(
    [
      [bx(29), 50],
      [bx(33), 58],
      [bx(29), 70],
    ],
    cloth.deep,
    0,
    undefined,
    MAT.cloth,
  );
  r.stroke(
    [
      [bx(44), 50],
      [bx(39), 58],
      [bx(43), 71],
    ],
    cloth.deep,
    0,
    undefined,
    MAT.cloth,
  );
  // The notch, which is the one detail that says tailoring.
  r.stroke(
    [
      [bx(25), 53],
      [bx(29), 54],
    ],
    cloth.deep,
    0,
    undefined,
    MAT.cloth,
  );
}

/**
 * One deterministic motif per outfit, hashed from the same fields the world
 * sprite uses, so a person's portrait and their figure wear the same cloth.
 */
function drawMotif(r: Raster, m: Model, cut: Cut, torso: number[]) {
  const { a, trim, lower } = m;
  const bs = m.bodyScale;
  const bx = (x: number) => 36 + (x - 36) * bs;
  const named = a.wearing.motif ?? "auto";
  // A wrap's own selvedge is its pattern; anything else on top reads as dirt.
  if (cut.bare === "far" || cut.inner !== "none") return;
  const outfit = [
    ...(a.wearing.color + a.wearing.trim + a.wearing.garment + a.wearing.belt),
  ].reduce((n, c) => (Math.imul(n, 31) + c.charCodeAt(0)) >>> 0, 7);
  const motif =
    named === "auto"
      ? outfit % 5
      : { plain: 0, placket: 1, band: 2, yoke: 3, stitch: 4, stripes: 5 }[named];
  const only = [MAT.cloth];
  // The neckline is where the chest starts, so a motif clears it whatever the
  // garment: a band across a deep V is a band across bare skin.
  const chest = Math.max(...necklineFor(m).map(([, y]) => y)) + 3;
  switch (motif) {
    case 1:
      r.stroke(
        [
          [bx(36), chest],
          [bx(35), 84],
        ],
        trim.shade,
        0,
        undefined,
        MAT.cloth,
      );
      r.stroke(
        [
          [bx(34), chest],
          [bx(33), 84],
        ],
        trim.base,
        3,
        undefined,
        MAT.cloth,
      );
      break;
    case 2:
      for (const y of [chest + 2, chest + 9])
        r.paint(
          torso.filter((i) => {
            const py = (i - (i % r.w)) / r.w;
            return py === Math.round(y) || py === Math.round(y) + 1;
          }),
          (_c, _x, py) => (py === Math.round(y) ? trim.base : trim.shade),
          { only },
        );
      break;
    case 3: {
      // A yoke: a band of the lower colour across both shoulders.
      const yoke = torso.filter((i) => {
        const py = (i - (i % r.w)) / r.w;
        return py >= chest - 1 && py <= chest + 3;
      });
      r.paint(
        yoke,
        (_c, _x, py) =>
          py > chest + 1 ? mix(lower.deep, trim.shade, 0.4) : lower.shade,
        { only },
      );
      break;
    }
    case 4:
      for (let y = chest + 1; y < 84; y += 3) {
        r.stroke(
          [
            [bx(26), y],
            [bx(26), y],
          ],
          trim.base,
          0,
          undefined,
          MAT.cloth,
        );
        r.stroke(
          [
            [bx(47), y + 1],
            [bx(47), y + 1],
          ],
          trim.shade,
          0,
          undefined,
          MAT.cloth,
        );
      }
      break;
    case 5:
      // Bands across the whole width: the one pattern that still reads small.
      r.paint(
        torso,
        (c, _x, y) => {
          if (y < chest - 4) return c;
          const i = Math.floor((y - chest + 4) / 4);
          if (i % 2) return c;
          const tone = Math.floor(i / 2) % 2 ? lower : trim;
          return (y - chest + 4) % 4 === 1 ? tone.base : tone.shade;
        },
        { only },
      );
      break;
  }
}

/** A short cape to the elbow, over the garment: lliclla, paenula, tippet. */
function drawMantle(r: Raster, m: Model, nearArm: number, farArm: number) {
  const c = m.cloak;
  const cape = smooth(
    [
      [36, 48],
      [46, 50],
      [55, 55],
      [farArm, 63],
      [farArm - 1, 74],
      [50, 72],
      [36, 74],
      [22, 72],
      [nearArm + 1, 74],
      [nearArm, 63],
      [17, 55],
      [26, 50],
    ],
    3,
  );
  r.poly(cape, c.base, MAT.cloth);
  const region = r.region(cape);
  shadeRamp(r, region, [34, 58], [farArm, 66], 0.3, SHADOW, [MAT.cloth]);
  shadeRamp(r, region, [34, 50], [34, 74], 0.18, SHADOW, [MAT.cloth]);
  shadeRamp(r, region, [26, 58], [16, 56], 0.18, LIGHT, [MAT.cloth]);
  // Hem band, and the fold where the cape breaks over each shoulder.
  r.stroke(
    [
      [nearArm + 1, 72],
      [36, 72],
      [farArm - 1, 72],
    ],
    m.trim.base,
    0,
    MAT.trim,
  );
  for (const x of [27, 45])
    r.stroke(
      [
        [x, 52],
        [x + (x < 36 ? -4 : 4), 70],
      ],
      c.shade,
      3,
      undefined,
      MAT.cloth,
    );
}

function drawCollar(r: Raster, m: Model) {
  const { trim } = m;
  const cut = cutFor(m);
  if (cut.collar === "none" || cut.collar === "lapel") return;
  const neckline = necklineFor(m);
  const depth = cut.collar === "stand" ? 2 : cut.collar === "bertha" ? 4 : 3;
  const flat = cut.collar === "bertha";
  const band = smooth(
    flat
      ? [
          ...neckline.map(([x, y]) => [x, y - 1] as Pt),
          ...neckline
            .slice()
            .reverse()
            .map(([x, y]) => [x, y + depth] as Pt),
        ]
      : [
          ...neckline.map(([x, y]) => [x, y - 2.5] as Pt),
          [48, 45],
          ...neckline
            .slice()
            .reverse()
            .map(([x, y]) => [x, y + depth - 2] as Pt),
          [22, 45],
        ],
    3,
  );
  r.poly(band, trim.base, MAT.trim);
  const bandRegion = r.region(band);
  r.paint(bandRegion, (c, x, y) => ((x + y) % 4 === 1 ? trim.light : c), {
    only: [MAT.trim],
  });
  shadeRamp(r, bandRegion, [36, 52], [50, 52], 0.28, SHADOW, [MAT.trim]);
  if (cut.collar === "stand") {
    // A standing collar has a lit inner face where it turns away from the neck.
    r.stroke(
      neckline.map(([x, y]) => [x, y - 2.5] as Pt),
      trim.light,
      0,
      undefined,
      MAT.trim,
    );
    r.stroke(
      neckline.map(([x, y]) => [x, y + 1] as Pt),
      trim.deep,
      0,
      undefined,
      MAT.trim,
    );
  }
  if (cut.collar === "bertha")
    // A flat band lying on the chest, so it takes the body's own light.
    shadeRamp(r, bandRegion, [22, 52], [12, 50], 0.2, LIGHT, [MAT.trim]);
}

function drawCloak(r: Raster, m: Model, nearArm: number, farArm: number) {
  const c = m.cloak;
  r.poly(
    smooth(
      [
        [nearArm, 84],
        [nearArm, 62],
        [7, 56],
        [15, 52],
        [21, 51],
        [17, 60],
        [13, 84],
      ],
      3,
    ),
    c.base,
    MAT.cloth,
  );
  r.poly(
    smooth(
      [
        [47, 51],
        [53, 53],
        [58, 58],
        [farArm, 64],
        [farArm, 84],
        [50, 84],
        [46, 62],
      ],
      3,
    ),
    c.shade,
    MAT.cloth,
  );
  r.stroke(
    [
      [nearArm + 7, 58],
      [nearArm + 4, 79],
    ],
    c.light,
    3,
  );
}

function drawNeck(r: Raster, m: Model) {
  const { skin, chin } = m;
  const w = (m.a.build > 0 ? 1 : 0) + m.neckWidth;
  // The neck flares into the trapezius rather than ending in a straight cut,
  // and stops wherever cloth already lies: the garment goes over the body, so
  // its neckline is what shapes the skin, not a rectangle drawn on top.
  const column = r.region(
    smooth(
      [
        [30 - w, chin - 9],
        [42 + w, chin - 9],
        [43 + w, 51],
        [47 + w, 58],
        [47 + w, 62],
        [25 - w, 62],
        [25 - w, 58],
        [29 - w, 51],
      ],
      3,
    ),
  );
  const neck = column.filter(
    (i) => r.mat[i] !== MAT.cloth && r.mat[i] !== MAT.trim,
  );
  r.fill(neck, skin.base, MAT.skin);
  shadeRamp(r, neck, [32, 50], [43 + w, 50], 0.34 * m.shadowScale, SHADOW, [
    MAT.skin,
  ]);
  shadeRamp(r, neck, [30, chin + 5], [30, chin - 1], 0.42, SHADOW, [MAT.skin]);
  // Sternocleidomastoid from below the near ear toward the collar.
  r.stroke(
    [
      [31, chin + 1],
      [32, chin + 6],
      [34, 56],
    ],
    skin.light,
    3,
    undefined,
    MAT.skin,
  );
  // The pit of the throat, where the collarbones meet.
  r.stroke(
    [
      [34, 55],
      [38, 56],
    ],
    mix(skin.shade, SHADOW, 0.3),
    0,
    undefined,
    MAT.skin,
  );
}

// ------------------------------------------------------------------- face

/**
 * Skin tones. Shadows on skin are not the base colour darkened: they shift
 * cooler and more saturated as they deepen, and the light shifts warmer. A
 * single grey axis is what makes rendered skin look like plastic.
 */
type SkinRamp = {
  core: string;
  deep: string;
  shade: string;
  base: string;
  light: string;
  high: string;
  /** Light bouncing back onto the shadow side. Cool, and never bright. */
  bounce: string;
};

function skinRamp(base: string): SkinRamp {
  const scale = (f: number) => {
    const v = parseInt(base.slice(1), 16);
    return `#${[16, 8, 0]
      .map((s) =>
        Math.round(((v >> s) & 255) * f)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")}`;
  };
  return {
    core: mix(scale(0.47), "#3b2a4d", 0.32),
    deep: mix(scale(0.63), "#5e3550", 0.24),
    shade: mix(scale(0.83), "#8d4a54", 0.15),
    base,
    light: mix(base, "#ffd9a6", 0.19),
    high: mix(base, "#fff0cd", 0.34),
    bounce: mix(scale(0.72), "#7d86b4", 0.3),
  };
}

/**
 * The skull's landmarks, as the control points of the drawn shapes rather than
 * as scalar amounts of light. Varying where the shadow's edge runs changes a
 * face's structure; varying how dark it is only changes the contrast.
 */
type FaceForm = {
  /** Height of the cheekbone above the mouth, and how far forward it pushes
   * the edge of the shadow. */
  cheekRise: number;
  cheekOut: number;
  /** Hollow under the cheekbone: a separate mark, on gaunt and old faces. */
  hollow: boolean;
  /** Width of the jaw at its angle. */
  jaw: number;
  /** Depth of the socket under the brow. */
  brow: number;
  /** Temple falling in behind the brow ridge. */
  temple: boolean;
  cleft: boolean;
  /** Colour in the cheeks, not shape. */
  flush: number;
};

function faceForm(m: Model): FaceForm {
  const { a, age, variant: v } = m;
  const sex = a.physique?.sex ?? "unspecified";
  const male = sex === "male";
  const lean = a.build < 0;
  const heavy = a.build > 1;
  const strength = (a.physique?.strength ?? 50) / 100;
  // Each trait takes its own slice of the roll, so changing one does not walk
  // the others.
  const roll = (shift: number) => ((v >> shift) & 255) / 255 - 0.5;
  return {
    cheekRise: roll(2) * 2.2,
    cheekOut: 1.4 + (lean ? 0.7 : 0) + (heavy ? -0.5 : 0) + roll(6) * 0.9,
    hollow: (lean || age >= 55 || roll(10) > 0.28) && age >= 20,
    jaw: (male ? 1 : 0) + strength * 1.4 + (heavy ? 1 : 0) + roll(14) * 1.2,
    brow: 1 + (male ? 0.6 : 0) + roll(18) * 0.8,
    temple: lean || male || roll(22) > 0.2,
    cleft: ((v >> 26) & 7) === 0 && age >= 16,
    flush: Math.max(0, 0.16 + roll(9) * 0.3) * (age < 14 ? 1.4 : 1),
  };
}

/** Smooth 0..1 bump, 1 at the centre and 0 at the ellipse's edge. */
function bump(
  x: number,
  y: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
) {
  const dx = (x - cx) / rx,
    dy = (y - cy) / ry;
  const d = dx * dx + dy * dy;
  return d < 1 ? 1 - d : 0;
}

function drawHead(r: Raster, m: Model) {
  const { farX, nearX, top, chin, eyeY, browY, mid, noseBase } = m;
  const S = skinRamp(m.a.skin);
  const f = faceForm(m);
  const sc = m.shadowScale;
  r.poly(m.head, S.base, MAT.skin);
  const head = r.region(m.head);
  const inHead = new Set(head);
  // Everything below is clipped to the head, so the shapes can run wide.
  const onFace = (pts: Pt[]) =>
    r.region(pts).filter((i) => inHead.has(i) && r.mat[i] === MAT.skin);
  // A tone laid down as a shape keeps its interior flat; only the boundary is
  // broken up, and only where the form is soft. Hard planes keep hard edges.
  const lay = (pts: Pt[], colour: string, soft = false) => {
    const region = onFace(pts);
    if (soft) {
      const set = new Set(region);
      for (const i of region) {
        const x = i % r.w,
          y = (i - x) / r.w;
        const edge =
          !set.has(i - 1) || !set.has(i + 1) || !set.has(i - r.w) || !set.has(i + r.w);
        if (edge && (x + y) & 1) continue;
        r.color[i] = colour;
      }
    } else for (const i of region) r.color[i] = colour;
  };

  const ck = eyeY + 6 + f.cheekRise;
  // The shadow side. Its inner edge is the whole drawing: narrow at the
  // temple, bulging forward where the cheekbone catches the light, tucking
  // back as the cheek falls to the jaw. A vertical line here splits the face
  // in half; the terminator on a turned head is never vertical.
  const turn = smooth(
    [
      [mid + 5, top + 3],
      [mid + 4, browY - 1],
      [mid + 3.2, eyeY + 2],
      [mid + 2 + f.cheekOut, ck],
      [mid + 3.5, ck + 4.5],
      [mid + 4.5, chin - 7],
      [mid + 2, chin - 2.5],
      [farX + 3, chin - 2],
      [farX + 3, top],
    ],
    4,
  );
  lay(turn, S.shade, true);
  // A little deeper right at the edge of the turn, under the cheekbone only.
  lay(
    [
      [mid + 5, ck + 2],
      [farX + 3, ck + 1],
      [farX + 3, chin - 5],
      [mid + 4, chin - 4],
    ],
    S.deep,
    true,
  );

  // The socket under the brow ridge. Curved, and only as deep as the brow is
  // heavy: a straight bar across the forehead reads as a headband.
  lay(
    smooth([
      [nearX + 2, browY + 2.5],
      [nearX + 3, browY + 0.5],
      [31, browY - 0.5],
      [mid + 1, browY + 0.5],
      [mid + 1, browY + 2],
      [31, browY + 1.5],
    ]),
    f.brow > 1.3 ? S.deep : S.shade,
    true,
  );

  // Two places light actually sits: the forehead plane and the near
  // cheekbone. Both soft-edged, because both are curved surfaces.
  lay(
    smooth([
      [nearX + 4, top + 7],
      [30, top + 4.5],
      [mid - 2, top + 6],
      [mid - 2.5, browY - 3],
      [30, browY - 2],
      [nearX + 3.5, browY - 3.5],
    ]),
    S.light,
    true,
  );
  lay(
    smooth([
      [nearX + 3.5, ck - 1],
      [nearX + 7, ck - 2.5],
      [nearX + 10, ck - 1],
      [nearX + 9, ck + 1.5],
      [nearX + 5, ck + 2],
    ]),
    S.light,
    true,
  );
  if (f.hollow)
    lay(
      smooth([
        [nearX + 3, ck + 4],
        [nearX + 8, ck + 3],
        [nearX + 7.5, ck + 6.5],
        [nearX + 3.5, ck + 6.5],
      ]),
      S.shade,
      true,
    );
  // The jaw turns under along its whole length.
  lay(
    smooth([
      [nearX + 2, chin - 7 + f.jaw * 0.4],
      [29, chin - 2],
      [mid - 1, chin],
      [mid - 1, chin + 1],
      [28, chin + 0.5],
      [nearX + 1, chin - 4],
    ]),
    S.shade,
    true,
  );

  // Reflected light along the far contour. One pixel of cool bounce is what
  // lifts the head off the background.
  for (const i of head) {
    const x = i % r.w,
      y = (i - x) / r.w;
    if (y < browY || y > chin - 2) continue;
    if (inHead.has(i + 1)) continue;
    r.color[i] = mix(r.color[i], S.bounce, 0.75);
  }

  if (f.cleft) {
    r.stroke(
      [
        [mid - 2, chin - 6],
        [mid - 2, chin - 3.5],
      ],
      S.deep,
      0,
      undefined,
      MAT.skin,
    );
    r.put(mid - 3, chin - 5, S.light);
  }

  // Colour last: warmth over the cheek and the nose, never the whole face.
  if (f.flush > 0.02) {
    const warm = "#c4645c";
    for (const i of head) {
      const x = i % r.w,
        y = (i - x) / r.w;
      if ((x + y) & 1) continue;
      const t =
        bump(x, y, nearX + 6, ck + 2, 6, 3.5) +
        bump(x, y, mid + 1, noseBase - 2, 3, 2.5) * 0.6;
      if (t <= 0) continue;
      r.color[i] = mix(r.color[i], warm, Math.min(0.22, t * f.flush));
    }
  }
  void sc;
}

function drawEar(r: Raster, m: Model) {
  const { skin, nearX, eyeY } = m;
  const x = nearX,
    y = eyeY - 2;
  const ear = smooth(
    [
      [x - 4, y + 3],
      [x - 2.5, y + 0.5],
      [x + 0.5, y],
      [x + 2.5, y + 1.5],
      [x + 2.5, y + 9.5],
      [x - 0.5, y + 10.5],
      [x - 3, y + 8.5],
    ],
    3,
  );
  r.poly(ear, skin.base, MAT.skin);
  r.paint(r.region(ear), shadow(0.1), { only: [MAT.skin] });
  // Helix and concha.
  r.stroke(
    [
      [x - 2, y + 2],
      [x - 2.5, y + 5],
      [x - 1, y + 7],
    ],
    skin.deep,
  );
  r.put(x, y + 4, skin.shade);
  r.put(x, y + 5, skin.shade);
  r.put(x - 3, y + 3, skin.light);
  r.put(x - 2, y + 1, skin.light);
}

function drawFeatures(r: Raster, m: Model) {
  const {
    face,
    skin,
    hair,
    eyeY,
    browY,
    noseBase,
    mouthY,
    chin,
    mid,
    a,
    age,
    child,
  } = m;
  // A closed visor is the face; nothing behind it shows.
  if (a.wearing.headwear === "visor") return;
  const eyeDark = mix(a.hairColor, "#120e1c", 0.72);
  // A dark iris is still an iris: it keeps a warm lit rim, or the eye reads as
  // a hole. The pupil is the only near-black on the face.
  const irisBase = mix(mix(a.hairColor, "#3d2f2a", 0.4), "#2d2440", 0.16);
  const irisLit = mix(irisBase, "#d8c39f", 0.5);
  const irisDeep = mix(irisBase, eyeDark, 0.4);
  const white = mix("#efe4d2", a.skin, 0.24);
  const lid = mix(skin.deep, hair.edge, 0.55);
  const lash = mix(hair.deep, eyeDark, 0.28);

  // Sub-traits the record does not name, rolled once per face so they stay
  // put: long lashes, a visible lid crease, a heavy brow, an under-eye.
  const v = m.variant;
  const female = a.physique?.sex === "female";
  const lashes = female || (v & 1) === 1;
  // The upper lid. A monolid has no visible fold and the lid runs smooth from
  // brow to lash; a low crease sits close enough to the lash line to be half
  // hidden by it. The record carries which, because it is regional.
  const lid2 = face.eyelid ?? "crease";
  const mono = lid2 === "monolid";
  const lowLid = lid2 === "low-crease";
  const crease = !mono && !child;
  const fold = face.epicanthus ?? false;
  const bushy =
    face.brows === "heavy" ||
    (!female && (v >> 3) % 4 === 0 && age > 20 && age < 65);
  const hollow = age >= 45 || face.detail === "weathered" || (v >> 5) % 5 === 0;

  // Near eye: full almond. Far eye: foreshortened by a pixel, never by the
  // iris — two irises of different widths read as a squint, not a turn.
  const nw =
    (face.eyeSize === "large" ? 7 : face.eyeSize === "small" ? 5 : 6) +
    (child ? 1 : 0);
  const fw = nw - 1;
  // A monolid presents a shallower opening, and more lid between brow and
  // lash. Both read at this size; the fold alone does not.
  const h =
    mono && !child
      ? 2
      : face.eyeShape === "round" || face.eyeSize === "large" || child
        ? 3
        : 2;
  const browLift = mono ? 1.5 : lowLid ? 0.5 : 0;
  const spacing =
    face.eyeSpacing === "wide" ? 1 : face.eyeSpacing === "close" ? -1 : 0;
  const nx = 32 - nw - spacing;
  const fx = 40 + spacing;
  // One iris width for both eyes, and both look at the same point: the gaze
  // is what the viewer reads first, and a pixel out of line breaks it.
  const iw = face.eyeSize === "small" && !child ? 2 : 3;

  const eye = (x0: number, w: number, near: boolean) => {
    const narrow = face.eyeShape === "narrow";
    const top = eyeY + (narrow ? 0.5 : 0);
    const outerX = near ? x0 - 1 : x0 + w;
    if (m.blink === 2) {
      // Shut. The lid is a plane of skin catching the light from above, and
      // the lashes gather in a shallow curve that dips toward the outer
      // corner. No white, no iris: an eye drawn closed shows neither.
      r.rect(x0 - 1, eyeY - 1, w + 2, h + 1, skin.base);
      r.rect(x0 - 1, eyeY - 1, w + 2, 1, mix(skin.base, skin.light, 0.4));
      const ly = eyeY + h - 1;
      r.stroke(
        [
          [outerX, ly - 0.5],
          [x0 + w * 0.5, ly + 1],
          [near ? x0 + w : x0, ly],
        ],
        lash,
        0,
        undefined,
        MAT.skin,
      );
      if (lashes)
        r.put(
          outerX + (near ? -1 : 1),
          ly + 1,
          mix(lash, skin.base, 0.4),
        );
      // The crease deepens as the lid comes down.
      r.stroke(
        [
          [x0, eyeY - 1.5],
          [x0 + w * 0.5, eyeY - 2],
          [x0 + w, eyeY - 1],
        ],
        mix(skin.base, skin.deep, 0.4),
        0,
        undefined,
        MAT.skin,
      );
      r.rect(x0 + 1, eyeY + h, w - 2, 1, mix(skin.base, skin.light, 0.5));
      r.rect(
        x0 + 1,
        eyeY + h + 1,
        w - 2,
        1,
        mix(skin.base, skin.shade, hollow ? 0.55 : 0.3),
      );
      return;
    }
    r.rect(x0, eyeY, w, h, white);
    // The upper lid casts across the top of the white; the inner corner sits
    // deepest. Without this the eye is a sticker rather than a socket.
    r.rect(x0, eyeY, w, 1, mix(white, lid, 0.3));
    r.put(near ? x0 + w - 1 : x0, eyeY, mix(white, lid, 0.5));

    // Iris, pushed toward the viewer in both eyes: lit rim, pupil, shade rim.
    const ix = near ? x0 + (w >= 7 ? 2 : 2) : x0 + 1;
    r.rect(ix, eyeY, iw, h, irisBase);
    r.rect(ix, eyeY, 1, h, irisLit);
    r.rect(ix + iw - 1, eyeY, 1, h, irisDeep);
    r.rect(ix + (iw > 2 ? 1 : 0), eyeY, iw > 2 ? 1 : 1, h, eyeDark);
    // The lid covers the top of the iris, as it does on a real eye.
    r.paint(
      r.region([
        [ix, eyeY],
        [ix + iw, eyeY],
        [ix + iw, eyeY + 1],
        [ix, eyeY + 1],
      ]),
      (c) => mix(c, lid, 0.26),
      { only: [MAT.skin] },
    );
    // A single catchlight, on the iris and clear of the pupil's centre.
    r.put(ix, eyeY, mix(irisLit, "#fdf8ee", 0.75));
    if (h > 2) r.put(ix + iw - 1, eyeY + h - 1, mix(irisDeep, white, 0.35));

    // Lash line: over the lid, running a pixel past the outer corner.
    // Lash line: darkest over the iris, fading into skin at both corners, so
    // it reads as lashes rather than as drawn-on liner.
    const outer = near ? x0 - 1 : x0 + w;
    r.rect(x0, eyeY - 1, w, 1, lash);
    r.put(x0, eyeY - 1, mix(lash, skin.base, 0.5));
    r.put(x0 + w - 1, eyeY - 1, mix(lash, skin.base, 0.5));
    r.put(outer, eyeY - 1, mix(lash, skin.base, 0.65));
    if (lashes) {
      r.put(outer + (near ? -1 : 1), eyeY, mix(lash, skin.base, 0.45));
      r.rect(x0 + 2, eyeY - 2, w - 4, 1, mix(lash, skin.base, 0.72));
    }
    // Corners: the outer one drops, the inner one tucks toward the nose.
    if (face.eyeShape === "almond" || narrow) {
      r.put(outer, eyeY, mix(lid, skin.shade, 0.3));
      r.put(near ? x0 + w - 1 : x0, eyeY + h - 1, mix(white, skin.shade, 0.55));
    } else {
      r.put(x0, eyeY - 1, mix(lash, skin.base, 0.35));
      r.put(x0 + w - 1, eyeY - 1, mix(lash, skin.base, 0.35));
    }
    if (narrow) r.rect(x0 + 1, eyeY + h - 1, w - 2, 1, mix(white, lid, 0.5));

    // Lower lid: a lit ridge, then the shadow it casts. Bags are that shadow
    // made deeper, not a separate line.
    r.rect(x0 + 1, eyeY + h, w - 2, 1, mix(skin.base, skin.light, 0.55));
    r.rect(
      x0 + 1,
      eyeY + h + 1,
      w - 2,
      1,
      mix(skin.base, skin.shade, hollow ? 0.7 : 0.35),
    );
    if (hollow)
      r.rect(x0 + 2, eyeY + h + 2, w - 4, 1, mix(skin.base, skin.shade, 0.3));
    if (m.blink === 1) {
      // Mid-blink: the lash line is one row lower and the iris is cut off by
      // it, which is what the eye actually does on the way down.
      r.rect(x0, eyeY - 1, w, 1, mix(skin.base, skin.light, 0.3));
      r.rect(x0, eyeY, w, 1, lash);
      r.put(outerX, eyeY, mix(lash, skin.base, 0.5));
    }
    // Lid crease above the lash line. A low crease runs a pixel closer to it
    // and fades at the inner end, where the lid is fullest.
    if (crease)
      r.stroke(
        [
          [x0 + (near ? 0 : 1), eyeY - (lowLid ? 2 : 3)],
          [x0 + w / 2, eyeY - (lowLid ? 2.5 : 3.5)],
          [x0 + w - (near ? 1 : 0), eyeY - (lowLid ? 2 : 2.5)],
        ],
        mix(skin.base, skin.deep, lowLid ? 0.24 : 0.34),
        lowLid ? 2 : 0,
        undefined,
        MAT.skin,
      );
    if (mono) {
      // The lid is one smooth plane running to the brow, so it catches light
      // across its whole height rather than breaking at a fold.
      r.rect(x0 - 1, eyeY - 4, w + 2, 3, mix(skin.base, skin.light, 0.34));
      r.rect(x0, eyeY - 2, w, 1, mix(skin.base, skin.light, 0.5));
    }
    if (fold || mono) {
      // An epicanthic fold covers the inner corner: the lash line turns down
      // into it instead of ending in a point, and the caruncle is hidden.
      // The opening also slants, the outer corner sitting above the inner —
      // which is the part that actually reads at this size.
      const ix = near ? x0 + w - 1 : x0;
      const ox = near ? x0 - 1 : x0 + w;
      const slant = fold ? 1.5 : 0.8;
      r.stroke(
        [
          [ox, eyeY - 0.5 - slant],
          [x0 + w / 2, eyeY - 1.2],
          [ix, eyeY - 1 + slant * 0.5],
        ],
        lash,
        0,
        undefined,
        MAT.skin,
      );
      r.put(ox, eyeY - 1, mix(lash, skin.base, 0.4));
      if (fold) {
        // The fold itself: lid skin carried over the inner corner, hiding it.
        r.put(ix, eyeY, mix(lash, skin.base, 0.3));
        r.put(ix, eyeY + 1, mix(skin.base, skin.shade, 0.35));
        r.put(ix + (near ? 1 : -1), eyeY, mix(skin.base, skin.shade, 0.25));
        r.put(ix + (near ? 1 : -1), eyeY - 1, mix(skin.base, skin.light, 0.2));
      }
    }
    void top;
  };
  eye(nx, nw, true);
  eye(fx, fw, false);
  // Socket shadow either side of the bridge.
  // A monolid sits on a fuller, flatter orbit: the bridge shadow is shallow
  // and there is no hollow above the lash line.
  r.put(nx + nw, eyeY + 1, mix(skin.base, skin.shade, mono ? 0.4 : 0.7));
  r.put(fx - 1, eyeY + 1, mono ? mix(skin.base, skin.shade, 0.55) : skin.shade);
  if (!mono) r.put(fx - 1, eyeY, mix(skin.base, skin.deep, 0.5));

  // Brows. The near brow reads long and arched; the far one is short. Density
  // is a second row, not a darker colour: a black bar is not a brow.
  const browColor =
    age >= 55
      ? mix(hair.deep, skin.shade, 0.35)
      : female
        ? mix(hair.deep, skin.base, 0.18)
        : hair.deep;
  const arch = face.brows === "arched" ? 1 : 0;
  const nearBrow: Pt[] = [
    [nx - 1, browY + 1.5 - browLift],
    [nx + 2, browY - arch - browLift],
    [nx + nw - 1, browY - arch - browLift],
    [nx + nw + 1, browY + 0.5 - browLift],
  ];
  const farBrow: Pt[] = [
    [fx - 1, browY - browLift],
    [fx + 1, browY - arch - browLift],
    [fx + fw, browY + 0.5 - browLift],
    [fx + fw + 1, browY + 1.5 - browLift],
  ];
  const drawBrow = (pts: Pt[], head: boolean) => {
    r.stroke(pts, browColor, 0, undefined, MAT.skin);
    if (bushy) {
      r.stroke(
        pts.map(([x, y]) => [x, y + 1] as Pt),
        mix(browColor, hair.base, 0.45),
        0,
        undefined,
        MAT.skin,
      );
      // Hairs stray upward at the inner end, where a heavy brow is thickest.
      r.stroke(
        pts.slice(0, 3).map(([x, y]) => [x, y - 1] as Pt),
        mix(browColor, skin.base, 0.3),
        2,
        undefined,
        MAT.skin,
      );
    } else {
      // Thin brows taper: the tail is a broken line, not a full-value stroke.
      r.stroke(
        pts.slice(1).map(([x, y]) => [x, y + 1] as Pt),
        mix(browColor, skin.base, 0.72),
        2,
        undefined,
        MAT.skin,
      );
    }
    void head;
  };
  drawBrow(nearBrow, true);
  drawBrow(farBrow, false);

  // Nose in profile. The bridge starts between the eyes, the far edge runs
  // down and right to the tip, and the base turns back under it.
  const bump = face.nose === "aquiline" ? 1 : 0;
  const tipX = mid + 2 + (face.nose === "broad" ? 1 : 0);
  // Where the bridge starts. A low root leaves the space between the eyes
  // flat, so the profile line begins part way down the nose rather than up at
  // the brow — which is most of what separates one nose from another here.
  const bridge = face.noseBridge ?? "average";
  const root = bridge === "low" ? 3.5 : bridge === "high" ? -0.5 : 1.5;
  const profile: Pt[] = [
    [mid - 1, eyeY + root],
    [mid + bump, eyeY + 2 + root * 0.3],
    [mid + 1 + bump, eyeY + 4],
    [tipX, noseBase - 2],
    [tipX + 0.5, noseBase - 1],
  ];
  // Cast shadow on the far cheek before the line goes on.
  const cast = r.region([
    [mid + 1, eyeY + 1],
    [mid + 3 + bump, eyeY + 1],
    [tipX + 3, noseBase - 2],
    [tipX + 3, noseBase + 1],
    [tipX - 1, noseBase + 1],
    [mid, noseBase - 3],
  ]);
  r.paint(cast, shadow(0.24), { only: [MAT.skin], soft: true });
  r.stroke(profile, skin.deep);
  // Lit side of the bridge.
  r.stroke(
    [
      [mid - 2, eyeY + 1 + root],
      [mid - 1 + bump, eyeY + 3 + root * 0.3],
      [tipX - 2, noseBase - 3],
    ],
    bridge === "low" ? mix(skin.base, skin.light, 0.45) : skin.light,
    child || bridge === "low" ? 2 : 0,
  );
  // A high root catches light between the brows; a low one is shadowed there,
  // which is what makes the eyes read as set on a flatter plane.
  if (bridge === "high") r.put(mid - 1, eyeY - 1, skin.high);
  else if (bridge === "low")
    r.rect(mid - 2, eyeY - 1, 3, 2, mix(skin.base, skin.shade, 0.3));
  if (bump) r.put(mid + 1, eyeY + 2, skin.high);
  r.put(tipX - 1, noseBase - 2, skin.high);
  // Base and nostrils.
  const wing = face.nose === "broad" ? 3 : face.nose === "short" ? 1 : 2;
  r.rect(mid - wing, noseBase, wing + 3, 1, skin.shade);
  r.put(tipX, noseBase, skin.deep);
  r.put(mid - wing, noseBase - 1, skin.deep);
  r.put(mid - wing - 1, noseBase, mix(skin.base, skin.shade, 0.5));
  r.rect(
    mid - wing + 1,
    noseBase + 1,
    wing + 1,
    1,
    mix(skin.base, skin.shade, 0.45),
  );

  // Mouth wraps around the turn: the near half is longer.
  const mw = face.mouth === "wide" ? 9 : face.mouth === "narrow" ? 5 : 7;
  const mx = mid - Math.ceil(mw * 0.6);
  const lipLine = mix(skin.deep, "#7d3a45", 0.45);
  const lower = mix(skin.light, "#c2646a", face.mouth === "full" ? 0.5 : 0.3);
  r.rect(mx, mouthY, mw, 1, lipLine);
  r.put(mx, mouthY, skin.deep);
  r.put(mx + mw - 1, mouthY, skin.deep);
  r.put(mx + mw, mouthY - 1, mix(skin.base, skin.shade, 0.5));
  if (face.mouth === "full") {
    r.rect(mx + 1, mouthY + 1, mw - 2, 1, lower);
    r.rect(mx + 2, mouthY - 1, mw - 4, 1, mix(skin.base, lipLine, 0.45));
    r.rect(mx + 2, mouthY + 2, mw - 4, 1, skin.shade);
  } else if (face.mouth === "soft") {
    r.rect(mx + 1, mouthY + 1, mw - 3, 1, mix(lower, skin.base, 0.4));
    r.rect(mx + 2, mouthY + 2, mw - 4, 1, mix(skin.base, skin.shade, 0.6));
  } else {
    r.rect(mx + 1, mouthY + 1, mw - 3, 1, mix(skin.base, skin.shade, 0.55));
  }
  r.put(mid, mouthY - 1, mix(skin.base, skin.light, 0.5));
  r.rect(mid - 3, chin - 2, 4, 1, mix(skin.base, skin.light, 0.6));

  if (face.detail === "freckles")
    for (const [x, y] of [
      [26, eyeY + 6],
      [29, eyeY + 7],
      [28, eyeY + 5],
      [31, eyeY + 7],
      [43, eyeY + 6],
      [45, eyeY + 8],
      [44, eyeY + 4],
    ] as Pt[])
      if (r.matAt(x, y) === MAT.skin)
        r.put(x, y, mix(r.at(x, y), skin.deep, 0.5));
  if (face.detail === "lines" || face.detail === "weathered" || age >= 55) {
    const l = mix(skin.base, skin.deep, 0.55);
    r.stroke(
      [
        [mid - 3, noseBase],
        [mx - 1, mouthY + 1],
      ],
      l,
      2,
    );
    r.rect(nx + 1, eyeY + h + 1, nw - 3, 1, l);
    r.put(fx + 1, eyeY + h + 1, l);
    if (face.detail === "weathered" || age >= 65) {
      r.stroke(
        [
          [27, eyeY - 7],
          [42, eyeY - 7.5],
        ],
        l,
        3,
      );
      r.stroke(
        [
          [nx - 3, eyeY + 1],
          [nx - 2, eyeY + 3],
        ],
        l,
      );
      r.stroke(
        [
          [mid - 3, mouthY + 3],
          [mid - 4, chin - 1],
        ],
        l,
        2,
      );
    }
  }
}

// ---------------------------------------------------------------- hair

/** Outer hair silhouette: the near side carries the back of the skull. */
function hairOuter(m: Model, length: number): Pt[] {
  const { nearX, farX, top, volume: v, chin } = m;
  const nearOut = nearX - v - 2,
    farOut = farX + v;
  const crown: Pt[] = [
    [farX - 1, top - v + 2],
    [43, top - v - 1],
    [35, top - v - 2],
    [26, top - v - 0.5],
    [nearOut + 2, top - v + 4],
  ];
  if (length > 50) {
    // Two masses falling over the shoulders, tapering toward the ends; the
    // middle hides behind the neck.
    const wave = m.face.hairTexture === "wavy" ? 1.5 : 0;
    return [
      [nearOut + 0.5, 18],
      [nearOut - 2, 30],
      [nearOut - 2.5 - wave, 42],
      [nearOut - 1.5 + wave, 52],
      [nearOut - 0.5 - wave, length - 8],
      [nearOut + 2.5, length - 1],
      [nearOut + 6, length + 1],
      [nearX + 3, length - 4],
      [nearX + 4.5, chin + 8],
      [nearX + 4, chin + 2],
      [farX - 4, chin + 2],
      [farX - 4.5, chin + 8],
      [farX - 2, length - 4],
      [farOut - 4, length + 1],
      [farOut - 1, length - 1],
      [farOut + 0.5 + wave, length - 8],
      [farOut + 1.5 - wave, 52],
      [farOut + 2.5 + wave, 42],
      [farOut + 1, 30],
      [farOut, 18],
      ...crown,
    ];
  }
  return [
    [nearOut + 0.5, 18],
    [nearOut, 30],
    [nearOut + 1, length - 5],
    [nearOut + 4, length],
    [nearX + 4, length + 0.5],
    [34, length - 1],
    [farX - 3, length + 0.5],
    [farOut - 3, length],
    [farOut, length - 5],
    [farOut + 1, 30],
    [farOut, 18],
    ...crown,
  ];
}

function drawBackHair(r: Raster, m: Model) {
  const { a, hair, nearX, farX, volume: v } = m;
  const style = a.hair;
  if (style === "bald" || style === "cropped") return;
  const length =
    style === "long"
      ? 72
      : style === "bob"
        ? 45
        : style === "curls"
          ? 42
          : style === "braid" || style === "topknot"
            ? 32
            : 37;
  const parts = [r.region(smooth(hairOuter(m, length), 4))];
  if (m.face.hairTexture === "curly" || m.face.hairTexture === "coiled") {
    const step = m.face.hairTexture === "coiled" ? 3 : 4;
    for (let y = 14; y < length; y += step) {
      parts.push(r.disc(nearX - v - 2, y + (y % 2 ? 0.5 : 0), 2.2));
      parts.push(r.disc(farX + v + 1, y + (y % 2 ? 0 : 0.5), 2));
    }
    for (let x = nearX - v; x < farX + v; x += step)
      parts.push(r.disc(x, length - 1, 2));
  }
  r.fill(Raster.union(...parts), hair.base, MAT.hair);
  if (style === "braid") {
    const path: Pt[] = [
      [nearX - 3, 32],
      [nearX - 5, 44],
      [nearX - 6, 56],
      [nearX - 5, 68],
      [nearX - 3, 80],
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

function drawFrontHair(r: Raster, m: Model) {
  const { a, hair, face, nearX, farX, top, volume: v, eyeY, hairline } = m;
  const style = a.hair;
  if (style === "bald") {
    r.paint(r.ellipse(30, top + 4, 6, 2.5), lift(0.24), {
      only: [MAT.skin],
      soft: true,
    });
    return;
  }
  const peak = face.hairline === "widows-peak" ? 2 : 0;
  const sheet = style === "bob" || style === "long";
  const sheetEnd = sheet
    ? style === "bob"
      ? 44
      : 60
    : style === "curls"
      ? 38
      : style === "cropped"
        ? eyeY - 2
        : eyeY + 6;
  const farInset = sheet ? 1.5 : style === "curls" ? 1 : -1;
  const nearOut = nearX - v - 2,
    farOut = farX + v;
  const cap: Pt[] = [
    [nearOut + 2, top - v + 4],
    [26, top - v - 0.5],
    [35, top - v - 2],
    [43, top - v - 1],
    [farX - 1, top - v + 2],
    [farOut, 18],
    [farOut + 0.5, 30],
    [farOut - 1, sheetEnd - 3],
    [farOut - 3, sheetEnd],
    [farX - farInset, sheetEnd - 1],
    [farX - farInset - 0.5, 26],
    [farX - 1, hairline + 4],
    [44, hairline + 0.5],
    [39, hairline - 0.5 + peak * 0.3],
    [36, hairline + peak],
    [32, hairline - 0.3],
    [28, hairline + 1],
    [25 + m.recede, hairline + 3.5 - m.recede],
    [23.5 + m.recede, hairline + 7 - m.recede],
    // Lock in front of the temple, then behind the ear.
    [nearX + 2.5, eyeY - 1],
    [nearX + 1.5, style === "cropped" ? eyeY - 3 : eyeY + 3],
    [nearX - 1.5, style === "cropped" ? eyeY - 3.5 : eyeY + 3],
    [nearOut + 0.5, eyeY - 1],
    [nearOut + 0.5, 18],
  ];
  const parts = [r.region(smooth(cap, 4))];
  if (face.hairTexture === "curly" || face.hairTexture === "coiled") {
    const step = face.hairTexture === "coiled" ? 3 : 4;
    const ring: Pt[] = [
      [nearOut + 1, 28],
      [nearOut + 0.5, 18],
      [nearOut + 2, top - v + 4],
      [26, top - v - 0.5],
      [35, top - v - 2],
      [43, top - v - 1],
      [farX - 1, top - v + 2],
      [farOut, 18],
      [farOut + 0.5, 28],
    ];
    let k = 0;
    for (let i = 0; i + 1 < ring.length; i++) {
      const [ax, ay] = ring[i],
        [bx, by] = ring[i + 1];
      const len = Math.hypot(bx - ax, by - ay);
      for (let t = 0; t < len; t += step, k++) {
        const x = ax + ((bx - ax) * t) / len,
          y = ay + ((by - ay) * t) / len;
        parts.push(r.disc(x, y, k % 2 ? 2.2 : 1.7));
      }
    }
  }
  if (style === "topknot") parts.push(r.ellipse(35, top - v - 3.5, 5, 3.5));
  r.fill(Raster.union(...parts), hair.base, MAT.hair);
  if (style === "cropped")
    r.paint(r.region(smooth(cap, 4)), (c) => mix(c, m.skin.base, 0.2), {
      only: [MAT.hair],
      dither: true,
    });
}

/**
 * Hair tones. `tones()` drives its top step toward cream, which on dark hair
 * puts near-white dots on a black mass. A head of hair is a glossy solid: the
 * sheen stays in the hair's own hue, two steps above the body colour, and only
 * a single glint goes near the light's colour.
 */
type HairRamp = {
  core: string;
  deep: string;
  shade: string;
  base: string;
  light: string;
  sheen: string;
  glint: string;
};

function hairRamp(base: string): HairRamp {
  const t = tones(base, "hair");
  // Mixing toward the light by a share scaled up for dark hair was wrong: it
  // put a pale grey-olive blob on black hair, because black has no hue to
  // carry a wide lift. A fixed, modest share is correct at both ends — black
  // hair keeps a dark specular, grey hair does not blow out.
  return {
    core: mix(t.edge, "#241a2e", 0.35),
    deep: t.deep,
    shade: t.shade,
    base,
    light: mix(base, "#e8c88e", 0.15),
    sheen: mix(base, "#f2d9a4", 0.28),
    glint: mix(base, "#fdf1cf", 0.38),
  };
}

/** How a texture breaks the light across the mass: strand direction, how far
 * it swings the shading, and whether it holds a specular at all. */
function strandField(texture: string, x: number, y: number) {
  switch (texture) {
    case "wavy":
      return Math.sin(x * 1.05 + Math.sin(y * 0.34) * 2.4) * 0.55;
    case "curly":
      // Two interfering waves make blobby clumps: curls, not corrugation.
      return (
        Math.sin(x * 1.5 + y * 1.0) * Math.sin(y * 1.25 - x * 0.45) * 0.95
      );
    case "coiled":
      return (
        Math.sin(x * 2.3 + y * 1.8) * Math.sin(x * 1.6 - y * 2.1) * 0.8 +
        Math.sin(x * 3.1 + y * 2.7) * 0.25
      );
    default:
      // Straight hair falls in long threads: vary across the head, not down it.
      return (
        Math.sin(x * 1.45) * 0.42 + Math.sin(x * 0.63 + y * 0.09) * 0.5
      );
  }
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

function drawHairDetail(r: Raster, m: Model) {
  const { a, face, nearX, farX, top, volume: v } = m;
  if (a.hair === "bald") return;
  if (COVERED.has(a.wearing.headwear)) return;
  const H = hairRamp(
    mix(a.hairColor, "#b8b2a6", m.age >= 45 ? Math.min(0.85, (m.age - 45) / 30) : 0),
  );
  const texture = face.hairTexture;
  const crownY = top - v;
  const nearOut = nearX - v - 2;

  // Every hair pixel, less its silhouette: the contour is already drawn and
  // repainting it would eat the outline that separates hair from background.
  const mass: number[] = [];
  for (let i = 0; i < r.mat.length; i++) if (r.mat[i] === MAT.hair) mass.push(i);
  if (!mass.length) return;
  const inMass = new Set(mass);
  const body = mass.filter((i) => {
    const x = i % r.w;
    return (
      x > 0 &&
      x < r.w - 1 &&
      inMass.has(i - 1) &&
      inMass.has(i + 1) &&
      inMass.has(i - r.w) &&
      inMass.has(i + r.w)
    );
  });

  // Hair is a shell on a sphere, so it is shaded as one: the value at a pixel
  // is how much that part of the skull faces the light, not how far right it
  // sits. Two linear ramps cannot put a highlight on a crown.
  const cx = 34.5,
    cy = top + 13;
  const rx = (farX + v + 2 - nearOut) / 2,
    ry = 21;
  // Upper left, and well in front, so the band sits on the crown rather than
  // sliding off the near edge.
  const lx = -0.46,
    ly = -0.63,
    lz = 0.63;
  const amp =
    texture === "curly"
      ? 0.19
      : texture === "coiled"
        ? 0.15
        : texture === "wavy"
          ? 0.14
          : 0.09;
  // Coiled hair scatters: it never takes one broad specular, so its band is
  // capped and its glint suppressed.
  const specular = texture === "coiled" ? 0.97 : 0.91;
  const steps: [number, string][] = [
    [0.1, H.core],
    [0.3, H.deep],
    [0.52, H.shade],
    [0.73, H.base],
    [specular, H.light],
    [2, H.sheen],
  ];

  // A beard sits on the jaw, in front, lit by the same lamp as the face. Shade
  // it off the skull and it comes out a black block under the chin.
  const jaw = m.chin - 8;
  const beardAt = (x: number, y: number) =>
    y > jaw && x > nearX && x < farX;
  r.paint(
    body,
    (_c, x, y) => {
      let l: number;
      if (beardAt(x, y)) {
        l =
          0.74 -
          0.34 * ((x - nearX) / (farX - nearX)) -
          0.2 * Math.min(1, (y - jaw) / 16) +
          strandField(texture, x, y) * amp * 0.7;
        l = Math.max(0.16, Math.min(1, l));
      } else {
        const ux = (x + 0.5 - cx) / rx,
          uy = (y + 0.5 - cy) / ry;
        const d2 = ux * ux + uy * uy;
        const nz = Math.sqrt(Math.max(0, 1 - Math.min(1, d2)));
        // Below the skull the shell falls away from the light, which is what
        // makes long hair dark at the ends without a separate gradient.
        l = ux * lx + uy * ly + nz * lz;
        l = Math.max(0, Math.min(1, l * 0.82 + 0.16));
        l += strandField(texture, x, y) * amp;
      }
      // Ordered dither across the whole ramp: a checkerboard only blends one
      // boundary, and the steps here are close enough to band without it.
      l += (BAYER[(y & 3) * 4 + (x & 3)] / 16 - 0.47) * 0.085;
      for (const [cut, colour] of steps) if (l < cut) return colour;
      return H.sheen;
    },
    { only: [MAT.hair] },
  );
  // The glint: the handful of pixels facing the light most directly, inside
  // the sheen and never larger than it. Coiled hair scatters and holds none.
  if (texture !== "coiled")
    r.paint(
      body,
      (c, x, y) => {
        if (beardAt(x, y)) return c;
        const ux = (x + 0.5 - cx) / rx,
          uy = (y + 0.5 - cy) / ry;
        const nz = Math.sqrt(Math.max(0, 1 - Math.min(1, ux * ux + uy * uy)));
        return ux * lx + uy * ly + nz * lz > 0.979 ? H.glint : c;
      },
      { only: [MAT.hair] },
    );

  // Roots: hair is darkest where it meets the face and where it turns under.
  r.paint(
    body,
    (c, x, y) =>
      y > m.hairline - 3 && y < m.hairline + 3 && x > nearX && x < farX
        ? mix(c, H.core, 0.4)
        : c,
    { only: [MAT.hair] },
  );

  // A softened hairline: a hard row of hair against a hard row of skin is the
  // single most plastic-looking thing on the face.
  for (const i of mass) {
    const x = i % r.w,
      y = (i - x) / r.w;
    if (y < crownY + 2 || y > m.hairline + 6) continue;
    if (r.matAt(x, y + 1) !== MAT.skin) continue;
    if ((x + y) & 1) r.color[i] = mix(r.color[i], m.skin.base, 0.45);
    const wisp = (Math.imul(x * 2654435761, y + 7) >>> 20) & 5;
    if (wisp === 0) r.put(x, y + 1, mix(H.deep, m.skin.base, 0.3));
    if (wisp === 3) r.put(x, y + 2, mix(H.shade, m.skin.base, 0.5));
  }

  if (a.wearing.headwear === "cap") return;

  // Locks. One continuous line each, dark on the shadow side and light on the
  // lit side of the same parting, so they read as volume rather than scratches.
  const wave = texture === "wavy" ? 1.5 : 0;
  if (
    a.hair !== "cropped" &&
    a.hair !== "topknot" &&
    a.wearing.headwear === "none"
  ) {
    r.stroke(
      [
        [31, crownY + 1.5],
        [30.5, m.hairline - 1],
      ],
      H.core,
      0,
      undefined,
      MAT.hair,
    );
    r.stroke(
      [
        [32, crownY + 2],
        [31.5, m.hairline - 1],
      ],
      H.light,
      2,
      undefined,
      MAT.hair,
    );
  }
  // Locks only where the hair hangs: a drawn line across the crown is a
  // straight mark on a curved surface, and reads as a scar. The shading
  // already carries the strand direction up there.
  const locks: Pt[][] = [
    [
      [nearOut + 3, 26],
      [nearOut + 3 + wave, 34],
      [nearOut + 2, 42],
      [nearOut + 3 + wave, 50],
      [nearOut + 2, 58],
    ],
    [
      [nearOut + 7, 30],
      [nearOut + 6 - wave, 39],
      [nearOut + 7, 48],
    ],
    [
      [farX + v - 2, 26],
      [farX + v - 2 - wave, 34],
      [farX + v - 1, 42],
      [farX + v - 2, 50],
      [farX + v - 1, 58],
    ],
  ];
  // Curls and coils have no long locks to draw; their clumps already carry it.
  if (texture !== "curly" && texture !== "coiled")
    for (const lock of locks) {
      r.stroke(lock, H.shade, 2, undefined, MAT.hair);
      r.stroke(
        lock.map(([x, y]) => [x - 1, y] as Pt),
        H.light,
        4,
        undefined,
        MAT.hair,
      );
    }
  if (a.hair === "topknot")
    r.stroke(
      [
        [32, top - v - 5],
        [36, top - v - 5.5],
      ],
      H.sheen,
      0,
      undefined,
      MAT.hair,
    );
}

// ---------------------------------------------------------------- beard

/**
 * Fill a patch of facial hair. Hair does not end on a ruled line, so the
 * boundary is thinned on a hash rather than filled solid: the cheek line goes
 * thinnest, because that is where a beard actually fades into skin.
 */
function furFill(r: Raster, poly: Pt[], colour: string, cheekY: number) {
  const region = r.region(poly);
  const inside = new Set(region);
  const solid: number[] = [];
  const edge: number[] = [];
  for (const i of region) {
    const x = i % r.w;
    const open =
      x === 0 ||
      x === r.w - 1 ||
      !inside.has(i - 1) ||
      !inside.has(i + 1) ||
      !inside.has(i - r.w) ||
      !inside.has(i + r.w);
    (open ? edge : solid).push(i);
  }
  r.fill(solid, colour, MAT.hair);
  for (const i of edge) {
    const x = i % r.w,
      y = (i - x) / r.w;
    const keep = (Math.imul(x * 374761393, y * 668265263 + 11) >>> 25) & 7;
    if (keep >= (y < cheekY ? 5 : 7)) continue;
    r.put(x, y, colour, MAT.hair);
  }
}

function drawBeard(r: Raster, m: Model) {
  const { a, hair, skin, chin, nearX, farX, mouthY, mid } = m;
  const beard = a.beard;
  if (beard === "none" || m.age < 16) return;
  // Jaw path from under the near ear to the far cheek, matching the head.
  const jaw: Pt[] = [
    [nearX + 2, chin - 11],
    [nearX + 4, chin - 6],
    [29, chin - 2.5],
    [mid - 2, chin - 1],
    [mid + 4, chin - 2],
    [farX - 2.5, chin - 6],
    [farX - 1, chin - 10],
  ];
  if (beard === "stubble") {
    r.paint(
      r.region([
        ...jaw,
        [farX - 2, chin - 2],
        [mid + 4, chin + 1],
        [mid - 3, chin + 0.5],
        [27, chin - 2],
        [nearX + 3, chin - 8],
      ]),
      (c) => mix(c, hair.shade, 0.35),
      { only: [MAT.skin], dither: true },
    );
    return;
  }
  if (beard === "moustache" || beard === "handlebar") {
    drawMoustache(r, m, beard === "handlebar");
    return;
  }
  // Nothing grows on the lip. Every shape below starts under it.
  const lip = mouthY + 2;
  // Where a full beard stops on the cheek. The jaw path is the underside of
  // the face; a beard that follows only that is a chinstrap.
  const cheekLine: Pt[] = [
    [nearX + 2, chin - 13],
    [nearX + 4.5, chin - 9],
    [28, chin - 5],
    [mid - 3, lip + 1],
    [mid + 4, lip],
    [farX - 3, chin - 7],
    [farX - 1.5, chin - 12],
  ];
  const length = beard === "long" || beard === "forked" ? 12 : 4;
  let region: Pt[];
  let cheek = chin - 8;
  if (beard === "goatee") {
    // A chin tuft, on the chin rather than on the midline: the feature axis
    // runs right of the chin's mass in a three-quarter view. Narrow under the
    // lip, widest at the jaw, rounded off below it.
    const gx = mid - 1.5;
    region = smooth(
      [
        [gx - 2, lip - 1],
        [gx + 1.5, lip - 1],
        [gx + 3.5, lip + 2.5],
        [gx + 5, chin - 1],
        [gx + 3.5, chin + 4],
        [gx - 0.5, chin + 5],
        [gx - 3.5, chin + 3],
        [gx - 5, chin - 2],
        [gx - 3.5, lip + 2.5],
      ],
      4,
    );
    cheek = lip;
  } else if (beard === "sideburns") {
    region = smooth(
      [
        [nearX + 1, chin - 18],
        [nearX + 5, chin - 17.5],
        [nearX + 6, chin - 12],
        [nearX + 4.5, chin - 7],
        [nearX + 2.5, chin - 8],
        [nearX + 1.5, chin - 13],
      ],
      3,
    );
    cheek = chin - 16;
  } else if (beard === "chinstrap") {
    region = smooth(
      [
        ...jaw,
        [farX - 1.5, chin - 5],
        [mid + 4, chin + 1.5],
        [mid - 2, chin + 2.5],
        [28, chin + 0.5],
        [nearX + 2, chin - 6],
      ],
      3,
    );
  } else {
    cheek = chin - 10;
    region = smooth(
      [
        ...cheekLine,
        [farX - 1, chin - 3],
        [mid + 5, chin + length - 2],
        [mid + 1, chin + length + (beard === "forked" ? -3 : 1)],
        [mid - 5, chin + length - 1],
        [27, chin + length - 5],
        [nearX + 1.5, chin - 3],
      ],
      3,
    );
  }
  furFill(r, region, hair.base, cheek);
  if (beard === "forked") {
    // The fork is a gap in the hair, so it shows the throat behind it.
    const notch: Pt[] = [
      [mid - 1.5, chin + 5],
      [mid + 1, chin + 5],
      [mid + 1.5, chin + length + 1],
      [mid - 2, chin + length + 1],
    ];
    r.poly(notch, mix(skin.shade, SHADOW, 0.4), MAT.skin);
    r.stroke(
      [
        [mid - 1.5, chin + 5],
        [mid - 2, chin + length],
      ],
      mix(skin.deep, SHADOW, 0.3),
      0,
      undefined,
      MAT.skin,
    );
  }
  if (beard !== "sideburns") {
    // Clear the lip, whatever the shape: a beard drawn over the mouth is the
    // first thing that reads as wrong.
    r.poly(
      [
        [mid - 6, mouthY - 1.5],
        [mid + 5, mouthY - 1.5],
        [mid + 5, mouthY + 2.5],
        [mid - 6, mouthY + 2.5],
      ],
      skin.base,
      MAT.skin,
    );
    if (beard !== "goatee" && beard !== "chinstrap") drawMoustache(r, m, false);
  }
}

function drawMoustache(r: Raster, m: Model, handlebar: boolean) {
  const { hair, mouthY, mid, noseBase } = m;
  // It fills the upper lip, from under the nose down onto the lip line, with
  // a dip at the philtrum. Floating it above the lip was the whole problem.
  const top = Math.min(noseBase + 1, mouthY - 3);
  const bottom = mouthY - 0.5;
  r.poly(
    smooth(
      [
        [mid - 8, bottom + 1],
        [mid - 7.5, top + 1.5],
        [mid - 4, top],
        [mid - 1, top + 2],
        [mid + 1.5, top + 0.5],
        [mid + 4.5, top + 1],
        [mid + 6, bottom],
        [mid + 4, bottom + 1],
        [mid - 1, bottom + 0.5],
        [mid - 5, bottom + 1],
      ],
      3,
    ),
    hair.base,
    MAT.hair,
  );
  if (handlebar)
    // The tails curl up and away, which is the only thing that says handlebar.
    for (const [x0, dir] of [
      [mid - 8, -1],
      [mid + 6, 1],
    ] as const) {
      r.stroke(
        [
          [x0, bottom],
          [x0 + dir * 2, bottom - 0.5],
          [x0 + dir * 3, bottom - 3],
          [x0 + dir * 2, bottom - 4.5],
        ],
        hair.base,
        0,
        MAT.hair,
      );
      r.put(x0 + dir, bottom - 1, hair.base, MAT.hair);
    }
}

// ---------------------------------------------------------------- headwear

function hoodOuter(m: Model): Pt[] {
  const { nearX, farX, top } = m;
  return smooth(
    [
      [nearX - 12, 58],
      [nearX - 9, 40],
      [nearX - 8, 24],
      [nearX - 5, 10],
      [27, top - 6],
      [37, top - 8],
      [46, top - 6],
      [farX + 3, 10],
      [farX + 6, 24],
      [farX + 7, 40],
      [farX + 10, 58],
      [farX + 6, 61],
      [36, 62],
      [nearX - 8, 61],
    ],
    3,
  );
}

function drawHoodBack(r: Raster, m: Model) {
  r.poly(hoodOuter(m), m.cloth.shade, MAT.cloth);
}

function drawHeadwear(r: Raster, m: Model) {
  const { a, cloth, trim, nearX, farX, top, volume: v, chin, hairline } = m;
  const wear = a.wearing.headwear;
  if (wear === "none") return;
  const nearOut = nearX - v - 2,
    farOut = farX + v;
  if (wear === "band") {
    const y = hairline - 1;
    const band = smooth(
      [
        [nearOut - 0.5, y + 4],
        [nearOut + 0.5, y + 1],
        [28, y - 1.5],
        [38, y - 2.5],
        [farOut, y],
        [farOut + 1, y + 3],
        [farOut, y + 5.5],
        [38, y + 0.5],
        [28, y + 1.5],
        [nearOut + 0.5, y + 6],
      ],
      3,
    );
    r.poly(band, trim.base, MAT.trim);
    shadeRamp(r, r.region(band), [34, y], [farOut + 1, y], 0.32, SHADOW, [
      MAT.trim,
    ]);
    r.stroke(
      [
        [nearOut + 3, y + 2],
        [28, y - 0.5],
        [37, y - 1],
      ],
      trim.light,
    );
    return;
  }
  if (wear === "cap") {
    const brim = hairline + 1;
    const cv = Math.min(v, 2);
    const nearC = nearX - cv - 2,
      farC = farX + cv;
    const cap = smooth(
      [
        [nearC - 0.5, brim + 1],
        [nearC, top],
        [27, top - cv - 2.5],
        [36, top - cv - 4],
        [45, top - cv - 2.5],
        [farC + 0.5, top],
        [farC + 1, brim + 1],
        [farC - 1, brim + 2.5],
        [36, brim + 0.5],
        [nearC + 1, brim + 2.5],
      ],
      3,
    );
    r.poly(cap, cloth.base, MAT.cloth);
    const region = r.region(cap);
    shadeRamp(r, region, [34, 10], [farC + 2, 10], 0.32, SHADOW, [MAT.cloth]);
    shadeRamp(r, region, [30, brim - 4], [30, brim + 2], 0.18, SHADOW, [
      MAT.cloth,
    ]);
    r.stroke(
      [
        [26, top - cv - 0.5],
        [31, top - cv - 2],
        [37, top - cv - 2.5],
      ],
      cloth.light,
      2,
    );
    r.stroke(
      [
        [nearC, brim + 1],
        [36, brim - 0.5],
        [farC, brim + 1],
      ],
      trim.base,
      0,
      MAT.trim,
    );
    return;
  }
  if (wear === "wrap") {
    const c = top - v;
    const wrap = smooth(
      [
        [nearOut - 1.5, 24],
        [nearOut - 2, 13],
        [nearOut + 1, c - 1],
        [27, c - 4],
        [37, c - 6],
        [46, c - 4],
        [farOut - 1, c - 1],
        [farOut + 2, 13],
        [farOut + 1.5, 24],
        [farX - 2, hairline + 4],
        [36, hairline - 0.5],
        [27, hairline + 1],
        [nearX + 1.5, hairline + 8],
      ],
      3,
    );
    r.poly(wrap, cloth.base, MAT.cloth);
    shadeRamp(r, r.region(wrap), [34, 10], [farOut + 2, 10], 0.32, SHADOW, [
      MAT.cloth,
    ]);
    r.stroke(
      [
        [nearOut, 22],
        [27, 12],
        [40, 7],
        [farOut, 13],
      ],
      cloth.deep,
    );
    r.stroke(
      [
        [nearOut + 2, 17],
        [30, 8],
        [43, 5],
      ],
      cloth.light,
      2,
    );
    r.stroke(
      [
        [nearOut, 24],
        [30, hairline + 1],
        [45, hairline + 1],
        [farOut, 22],
      ],
      trim.base,
      0,
      MAT.trim,
    );
    return;
  }
  if (wear === "hood") {
    const outer = r.region(hoodOuter(m));
    const opening = r.region(
      smooth(
        [
          [nearX - 4, 62],
          [nearX - 3.5, 40],
          [nearX - 3, 26],
          [nearX - 1, 14],
          [27, top + 1.5],
          [36, top],
          [44, top + 1.5],
          [farX - 1, 14],
          [farX + 1.5, 26],
          [farX + 2, 40],
          [farX + 2.5, 62],
        ],
        3,
      ),
    );
    const rim = Raster.diff(outer, opening);
    r.fill(rim, cloth.base, MAT.cloth);
    shadeRamp(r, rim, [36, 20], [farX + 10, 20], 0.34, SHADOW, [MAT.cloth]);
    // Inner fold of the hood catches light along the near side.
    r.paint(Raster.diff(r.grow(opening, 2), opening), lift(0.16), {
      only: [MAT.cloth],
      dither: true,
    });
    r.stroke(
      [
        [nearX - 6, 58],
        [nearX - 4, 30],
        [24, top - 1],
      ],
      cloth.light,
      3,
    );
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
    shadeRamp(r, rim, [30, chin - 4], [30, chin + 8], 0.3, SHADOW, [MAT.cloth]);
    return;
  }
  drawHat(r, m, wear);
}

// ------------------------------------------------------------------ cloth

/**
 * How a material behaves under light. The ramp is how far the body turns from
 * lit to shadow, the sheen is a specular band across the chest, the grain is
 * the weave or the nap, and a fringe is the cut edge of a skin.
 *
 * Absent a recorded material nothing here runs: an authored look and an old
 * save draw exactly as before.
 */
type Finish = {
  ramp: number;
  sheen: number;
  grain: "none" | "slub" | "nap" | "pelt";
  /** Share of pixels the grain marks, 0..1. Coarse cloth marks more of them. */
  density: number;
  /** How far a marked pixel moves off the base tone, 0..1. */
  strength: number;
  /** Depth of the broken edge where the cloth is cut but not hemmed. */
  fringe: number;
};

const FINISH: Record<Material, Finish> = {
  // Skins: a hard ramp, hair lying in one direction, a cut edge.
  hide: { ramp: 0.32, sheen: 0.08, grain: "pelt", density: 0.14, strength: 0.55, fringe: 1 },
  fur: { ramp: 0.24, sheen: 0, grain: "pelt", density: 0.34, strength: 1, fringe: 2 },
  // Beaten and matted cloth: no weave to catch light, so the grain is the look.
  barkcloth: { ramp: 0.22, sheen: 0, grain: "slub", density: 0.18, strength: 1, fringe: 1 },
  felt: { ramp: 0.18, sheen: 0, grain: "nap", density: 0.1, strength: 0.3, fringe: 0 },
  wool: { ramp: 0.26, sheen: 0, grain: "nap", density: 0.2, strength: 0.6, fringe: 0 },
  // Bast fibres, coarsest first. The thread is what separates them.
  jute: { ramp: 0.24, sheen: 0, grain: "slub", density: 0.2, strength: 0.85, fringe: 0 },
  hemp: { ramp: 0.26, sheen: 0, grain: "slub", density: 0.11, strength: 0.7, fringe: 0 },
  linen: { ramp: 0.32, sheen: 0.1, grain: "slub", density: 0.05, strength: 0.5, fringe: 0 },
  ramie: { ramp: 0.32, sheen: 0.16, grain: "slub", density: 0.035, strength: 0.4, fringe: 0 },
  // Smooth cloth, told apart by how hard the highlight is.
  cotton: { ramp: 0.3, sheen: 0.05, grain: "none", density: 0, strength: 0, fringe: 0 },
  silk: { ramp: 0.4, sheen: 0.36, grain: "none", density: 0, strength: 0, fringe: 0 },
  synthetic: { ramp: 0.14, sheen: 0.22, grain: "none", density: 0, strength: 0, fringe: 0 },
};

/** Deterministic per-pixel noise: the same cloth always slubs in the same
 * places, so a portrait does not shimmer when it is redrawn. */
const grainAt = (x: number, y: number, k: number) =>
  (Math.imul(x * 73856093 ^ y * 19349663 ^ k * 83492791, 2654435761) >>> 16) &
  255;

/**
 * Weave, nap and wear laid over a garment already shaded for its form. Called
 * with the cloth region of the torso, so it never touches skin or trim.
 */
function applyFinish(r: Raster, m: Model, region: number[]) {
  const material = m.a.wearing.material;
  if (!material) return;
  const f = FINISH[material];
  const { cloth } = m;
  const only = [MAT.cloth];
  const quality = m.a.wearing.quality ?? 0;

  // Cheap cloth turns away from the light sooner than fine cloth; a hard
  // ramp on felt is what makes it read as felt and not as silk.
  shadeRamp(r, region, [30, 58], [62, 68], f.ramp, SHADOW, only);
  if (f.sheen)
    r.paint(
      region,
      (c, x, y) => {
        const d = Math.abs(x * 0.55 + y - 64);
        return d < 2
          ? mix(c, LIGHT, f.sheen)
          : d < 4.5
            ? mix(c, LIGHT, f.sheen * 0.4)
            : d < 8
              ? mix(c, SHADOW, f.sheen * 0.3)
              : c;
      },
      { only },
    );
  const hi = 255 - 128 * f.density,
    lo = 128 * f.density;
  if (f.grain === "slub")
    // Thick threads in the weave: single pixels, never a pattern.
    r.paint(
      region,
      (c, x, y) => {
        const g = grainAt(x, y, 1);
        return g > hi
          ? mix(c, cloth.light, f.strength)
          : g < lo
            ? mix(c, cloth.shade, f.strength)
            : c;
      },
      { only },
    );
  else if (f.grain === "nap")
    // A raised nap scatters light in short horizontal fibres, so the marks go
    // in pairs: single pixels at this size read as dirt.
    r.paint(
      region,
      (c, x, y) => {
        const g = Math.max(grainAt(x, y, 2), grainAt(x - 1, y, 2));
        return g > hi
          ? mix(c, cloth.light, f.strength)
          : grainAt(x, y, 7) < lo
            ? mix(c, cloth.shade, f.strength * 0.8)
            : c;
      },
      { only },
    );
  else if (f.grain === "pelt")
    // Hair lies in short strokes, all falling the same way.
    r.paint(
      region,
      (c, x, y) => {
        const g = grainAt(x, y - (y & 1), 3);
        return g > hi
          ? mix(c, cloth.light, f.strength)
          : g < lo
            ? mix(c, cloth.deep, f.strength)
            : c;
      },
      { only },
    );
  if (f.fringe) drawFringe(r, m, region, f.fringe);
  if (quality < 0) drawWear(r, m, region);
}

/** The cut edge of a skin or a bark: it is not hemmed, so it breaks. */
function drawFringe(r: Raster, m: Model, region: number[], depth: number) {
  const { cloth } = m;
  const top = new Map<number, number>();
  for (const i of region) {
    const x = i % r.w,
      y = (i - x) / r.w;
    const seen = top.get(x);
    if (seen === undefined || y < seen) top.set(x, y);
  }
  for (const [x, y] of top) {
    const g = grainAt(x, y, 4);
    if (g < (depth > 1 ? 70 : 160)) continue;
    r.put(x, y - 1, g > 200 ? cloth.light : cloth.shade, MAT.cloth);
    if (depth > 1 && g > 210) r.put(x, y - 2, cloth.shade, MAT.cloth);
  }
}

/** Worn cloth: thin where it is handled, and darkened where it is not. */
function drawWear(r: Raster, m: Model, region: number[]) {
  const { cloth, lower } = m;
  r.paint(
    region,
    (c, x, y) => {
      const g = grainAt(x >> 1, y >> 1, 5);
      if (g > 232) return mix(c, SHADOW, 0.22);
      if (g < 16) return mix(c, cloth.deep, 0.5);
      return c;
    },
    { only: [MAT.cloth] },
  );
  // A patch sewn over the shoulder, which is where cloth goes first.
  const patch = r.region([
    [14, 60],
    [23, 58],
    [25, 66],
    [16, 68],
  ]).filter((i) => r.mat[i] === MAT.cloth);
  r.paint(patch, mix(lower.shade, cloth.deep, 0.4), { only: [MAT.cloth] });
  r.stroke(
    [
      [14, 60],
      [23, 58],
      [25, 66],
      [16, 68],
      [14, 60],
    ],
    lower.deep,
    1,
    undefined,
    MAT.cloth,
  );
}

/**
 * What the cloth's condition does at the neckline, drawn after the collar,
 * which would otherwise cover it: a frayed edge on worn cloth, a worked
 * thread on fine cloth, in gold for the best of it.
 */
function drawClothEdge(r: Raster, m: Model) {
  const material = m.a.wearing.material;
  if (!material) return;
  const quality = m.a.wearing.quality ?? 0;
  if (!quality) return;
  const cut = cutFor(m);
  if (cut.bare === "all") return;
  const neckline = necklineFor(m);
  if (quality < 0) {
    // The binding has gone, so the edge breaks into threads.
    for (const [x, y] of neckline) {
      const g = grainAt(Math.round(x), Math.round(y), 6);
      if (g < 110) continue;
      r.put(x, y + 1.5, m.cloth.deep);
      if (g > 200) r.put(x + 1, y + 2.5, m.cloth.shade);
    }
    return;
  }
  const thread = quality >= 3 ? m.gold : m.trim;
  // Clear of the collar's own binding, or the thread reads as part of it.
  r.stroke(
    neckline.map(([x, y]) => [x, y + 5] as Pt),
    quality > 1 ? thread.base : thread.shade,
    quality > 1 ? 0 : 2,
    undefined,
    MAT.cloth,
  );
  if (quality >= 3)
    r.stroke(
      neckline.map(([x, y]) => [x, y + 7.5] as Pt),
      thread.light,
      2,
      undefined,
      MAT.cloth,
    );
}

// ------------------------------------------------------------------ hats

/**
 * Crown of a stiff hat: the shape the cap uses, lifted by `rise` and widened
 * by `spread` so one outline serves cap, bowler, brimmed hat and ball cap.
 */
function stiffCrown(
  m: Model,
  rise: number,
  spread: number,
  brim: number,
  dome = 0,
): Pt[] {
  const cv = Math.min(m.volume, 2);
  const n = m.nearX - cv - 2 - spread,
    f = m.farX + cv + spread;
  const t = m.top - rise;
  return smooth(
    [
      [n - 0.5, brim + 1],
      [n + dome, t + dome],
      [27, t - cv - 2.5 - dome * 0.5],
      [36, t - cv - 4 - dome],
      [45, t - cv - 2.5 - dome * 0.5],
      [f - dome, t + dome],
      [f + 1, brim + 1],
      [f - 1, brim + 2.5],
      [36, brim + 0.5],
      [n + 1, brim + 2.5],
    ],
    3,
  );
}

/** Brim under a stiff crown: an ellipse seen from a little above, so the far
 * half hides behind the crown drawn over it. */
function drawBrim(
  r: Raster,
  m: Model,
  y: number,
  out: number,
  depth: number,
  tone: Tones,
) {
  const cv = Math.min(m.volume, 2);
  const n = m.nearX - cv - 3 - out,
    f = m.farX + cv + 1 + out;
  const brim = smooth(
    [
      [n, y],
      [36, y - depth],
      [f, y - 0.5],
      [36, y + depth + 1.5],
    ],
    4,
  );
  r.poly(brim, tone.base, MAT.cloth);
  const region = r.region(brim);
  shadeRamp(r, region, [36, y - depth], [36, y + depth + 2], 0.4, SHADOW, [
    MAT.cloth,
  ]);
  shadeRamp(r, region, [34, y], [f, y], 0.22, SHADOW, [MAT.cloth]);
}

/** Face opening shared by hood, headscarf and veil. `out` pushes the edges
 * outward; `crown` is where the top of the opening sits. */
function faceOpening(m: Model, out: number, crown: number): Pt[] {
  const { nearX, farX } = m;
  return smooth(
    [
      [nearX - 4 - out, 62],
      [nearX - 3.5 - out, 40],
      [nearX - 3 - out, 26],
      [nearX - 1 - out, 14],
      [27, crown + 1.5],
      [36, crown],
      [44, crown + 1.5],
      [farX - 1 + out, 14],
      [farX + 1.5 + out, 26],
      [farX + 2 + out, 40],
      [farX + 2.5 + out, 62],
    ],
    3,
  );
}

/** Cloth wound over the head and falling past the jaw: scarf and veil. */
function scarfOuter(m: Model, rise: number, drop: number): Pt[] {
  const { nearX, farX, top, volume: v } = m;
  const cv = Math.min(v, 2);
  return smooth(
    [
      [nearX - cv - 6, drop],
      [nearX - cv - 7, 34],
      [nearX - cv - 6, 18],
      [28, top - cv - rise],
      [37, top - cv - rise - 1.5],
      [46, top - cv - rise + 0.5],
      [farX + cv + 5, 18],
      [farX + cv + 7, 34],
      [farX + cv + 6, drop],
      [36, drop + 2],
    ],
    3,
  );
}

/** The fourteen hats that are not band, cap, wrap or hood. */
function drawHat(r: Raster, m: Model, wear: string) {
  const { a, cloth, trim, gold, nearX, farX, top, volume: v, hairline } = m;
  const cv = Math.min(v, 2);
  const nearOut = nearX - v - 2,
    farOut = farX + v;

  // Fillet and plume are a metal circlet; the plume adds a feather behind it.
  if (wear === "fillet" || wear === "plume") {
    const y = hairline - 1;
    const band = smooth(
      [
        [nearOut - 0.5, y + 3],
        [nearOut, y + 0.5],
        [28, y - 1.5],
        [38, y - 2.5],
        [farOut, y],
        [farOut + 1, y + 2],
        [farOut, y + 4],
        [38, y + 0.5],
        [28, y + 1.5],
        [nearOut + 0.5, y + 4.5],
      ],
      3,
    );
    if (wear === "plume") {
      // A feather off the far side, curving back over the crown. A filled
      // blade: at this size a line of strokes reads as a twig.
      const vane = tones(mix(a.wearing.trim, "#f2e7cf", 0.5), "cloth");
      const tip: Pt = [28, Math.max(1, top - v - 14)];
      const root: Pt = [farOut - 1, y + 1];
      const blade = smooth(
        [
          root,
          [farOut + 4, y - 9],
          [farOut, top - v - 9],
          tip,
          [34, top - v - 8],
          [farOut - 4, y - 8],
        ],
        4,
      );
      r.poly(blade, vane.base, MAT.trim);
      const region = r.region(blade);
      shadeRamp(r, region, [34, y - 14], [farOut + 4, y - 4], 0.3, SHADOW, [
        MAT.trim,
      ]);
      // Rachis down the middle, with the barbs breaking the near edge.
      r.stroke([root, [farOut + 2, y - 8], [farOut - 2, top - v - 9], tip],
        vane.deep, 0, undefined, MAT.trim);
      r.stroke([[farOut - 2, y - 2], [farOut - 3, y - 9], [31, top - v - 11]],
        vane.light, 2, undefined, MAT.trim);
    }
    r.poly(band, gold.base, MAT.metal);
    const region = r.region(band);
    shadeRamp(r, region, [34, y], [farOut + 1, y], 0.34, SHADOW, [MAT.metal]);
    r.stroke(
      [
        [nearOut + 3, y + 1.5],
        [29, y - 0.5],
        [37, y - 1.5],
      ],
      gold.high,
    );
    return;
  }

  if (wear === "bowler" || wear === "brimmed" || wear === "ball-cap") {
    const wide = wear === "brimmed";
    const brimY = hairline + 2;
    drawBrim(
      r,
      m,
      brimY,
      wide ? 5 : wear === "bowler" ? 1 : 0.5,
      wide ? 2 : 1.5,
      cloth,
    );
    if (wear === "ball-cap") {
      // A ball cap has no brim behind: a peak out over the face instead.
      const peak = smooth(
        [
          [37, brimY - 0.5],
          [farX + 4, brimY - 1],
          [farOut + 8, brimY + 2],
          [farOut + 6, brimY + 4],
          [farX + 2, brimY + 3],
          [37, brimY + 2],
        ],
        4,
      );
      r.poly(peak, cloth.shade, MAT.cloth);
      shadeRamp(
        r,
        r.region(peak),
        [37, brimY],
        [farOut + 8, brimY + 3],
        0.3,
        SHADOW,
        [MAT.cloth],
      );
    }
    const crown = stiffCrown(
      m,
      wear === "brimmed" ? 4 : wear === "bowler" ? 2 : 0,
      wear === "bowler" ? -1.5 : 0,
      hairline + 1,
      wear === "bowler" ? 2 : 0,
    );
    r.poly(crown, cloth.base, MAT.cloth);
    const region = r.region(crown);
    shadeRamp(r, region, [34, 8], [farOut + 2, 8], 0.34, SHADOW, [MAT.cloth]);
    shadeRamp(r, region, [30, hairline - 5], [30, hairline + 2], 0.2, SHADOW, [
      MAT.cloth,
    ]);
    // Hatband where the crown meets the brim.
    if (wear !== "ball-cap")
      r.stroke(
        [
          [nearX - cv - 3, hairline],
          [36, hairline - 2],
          [farX + cv + 1, hairline],
        ],
        trim.base,
        0,
        MAT.trim,
      );
    r.stroke(
      [
        [26, top - cv - (wear === "brimmed" ? 6 : wear === "bowler" ? 4 : 0.5)],
        [32, top - cv - (wear === "brimmed" ? 8 : wear === "bowler" ? 6 : 2)],
        [38, top - cv - (wear === "brimmed" ? 8 : wear === "bowler" ? 6 : 2.5)],
      ],
      cloth.light,
      2,
      undefined,
      MAT.cloth,
    );
    return;
  }

  if (wear === "flat-cap") {
    // Soft crown dragged forward over a short peak: the mass sits ahead of
    // the skull, which is the whole silhouette.
    const brimY = hairline + 2;
    const body = smooth(
      [
        [nearOut - 1, brimY + 1],
        [nearOut - 1.5, hairline - 3],
        [28, top - cv - 3],
        [38, top - cv - 3.5],
        [farOut + 2, hairline - 3],
        [farOut + 6, brimY - 1],
        [farOut + 5, brimY + 2.5],
        [farX, brimY + 1.5],
        [36, brimY + 1],
      ],
      3,
    );
    r.poly(body, cloth.base, MAT.cloth);
    const region = r.region(body);
    shadeRamp(r, region, [34, 8], [farOut + 4, 8], 0.32, SHADOW, [MAT.cloth]);
    shadeRamp(r, region, [36, hairline - 4], [36, brimY + 2], 0.22, SHADOW, [
      MAT.cloth,
    ]);
    // Seam where the crown folds over the peak.
    r.stroke(
      [
        [farX - 2, brimY - 2],
        [farOut + 3, brimY - 1],
      ],
      cloth.deep,
      0,
      undefined,
      MAT.cloth,
    );
    r.stroke(
      [
        [26, top - cv - 0.5],
        [33, top - cv - 2],
        [39, top - cv - 2],
      ],
      cloth.light,
      2,
      undefined,
      MAT.cloth,
    );
    return;
  }

  if (wear === "conical") {
    // Straight sides, so no spline: a rounded cone is a bell.
    const base = hairline + 2;
    const n = nearOut - 4,
      f = farOut + 4;
    const apex = Math.max(1, top - v - 13);
    r.poly(
      [
        [n, base],
        [33, apex],
        [37, apex],
        [f, base - 1],
        [f - 2, base + 2.5],
        [36, base + 3.5],
        [n + 2, base + 2.5],
      ],
      cloth.base,
      MAT.cloth,
    );
    const region = r.region([
      [n, base + 4],
      [f, base + 4],
      [37, apex],
      [33, apex],
    ]);
    shadeRamp(r, region, [34, base], [f, base], 0.36, SHADOW, [MAT.cloth]);
    r.stroke(
      [
        [34, apex + 1],
        [n + 4, base - 1],
      ],
      cloth.light,
      2,
      undefined,
      MAT.cloth,
    );
    r.stroke(
      [
        [n + 1, base + 1],
        [36, base + 2],
        [f - 1, base],
      ],
      trim.base,
      0,
      MAT.trim,
    );
    return;
  }

  if (wear === "fez") {
    const base = hairline + 1;
    const crown = Math.max(1, top - cv - 7);
    const n = nearX - cv - 2,
      f = farX + cv;
    r.poly(
      [
        [n, base + 1],
        [n + 1, crown + 1],
        [34, crown - 1],
        [f - 1, crown + 1],
        [f, base],
        [f - 1.5, base + 2.5],
        [36, base + 3],
        [n + 1.5, base + 3],
      ],
      cloth.base,
      MAT.cloth,
    );
    const region = r.region([
      [n, base + 3],
      [f, base + 3],
      [f - 1, crown],
      [n + 1, crown],
    ]);
    shadeRamp(r, region, [34, base], [f, base], 0.34, SHADOW, [MAT.cloth]);
    // Flat top, then the tassel falling off the far edge.
    r.stroke(
      [
        [n + 2, crown + 1],
        [34, crown - 1],
        [f - 2, crown + 1],
      ],
      cloth.light,
      0,
      undefined,
      MAT.cloth,
    );
    r.stroke(
      [
        [f - 2, crown],
        [f + 2, crown + 3],
        [f + 3, crown + 9],
      ],
      trim.base,
      0,
      MAT.trim,
    );
    r.rect(Math.round(f + 2), crown + 9, 2, 3, trim.shade, MAT.trim);
    return;
  }

  if (wear === "turban") {
    const base = hairline + 2;
    const n = nearX - cv - 4,
      f = farX + cv + 4;
    const crown = Math.max(1, top - cv - 7);
    const mass = smooth(
      [
        [n - 1, base + 1],
        [n - 2.5, base - 5],
        [n - 1.5, crown + 4],
        [28, crown],
        [37, crown - 1],
        [45, crown + 1],
        [f + 1.5, crown + 5],
        [f + 2.5, base - 5],
        [f + 1, base + 1],
        [36, base + 2.5],
      ],
      3,
    );
    r.poly(mass, cloth.base, MAT.cloth);
    const region = r.region(mass);
    shadeRamp(r, region, [34, 8], [f + 2, 8], 0.34, SHADOW, [MAT.cloth]);
    shadeRamp(r, region, [30, crown], [30, base], 0.14, SHADOW, [MAT.cloth]);
    // Four winds climbing toward the far side: a spiral, not stacked rings.
    for (let k = 0; k < 4; k++) {
      const y = base - k * 3.5;
      r.stroke(
        [
          [n - 2, y],
          [33, y - 4 - k * 0.5],
          [f + 2, y - 1.5 - k],
        ],
        cloth.deep,
        0,
        undefined,
        MAT.cloth,
      );
      r.stroke(
        [
          [n - 1, y + 1],
          [33, y - 3 - k * 0.5],
          [f + 1, y - 0.5 - k],
        ],
        cloth.light,
        3,
        undefined,
        MAT.cloth,
      );
    }
    // Tail tucked in at the far side.
    r.stroke(
      [
        [f, crown + 4],
        [f + 2, crown + 9],
        [f - 1, base - 2],
      ],
      cloth.shade,
      0,
      undefined,
      MAT.cloth,
    );
    return;
  }

  if (wear === "headscarf" || wear === "veil") {
    const sheer = wear === "veil";
    const outer = r.region(scarfOuter(m, sheer ? 2 : 1, sheer ? 60 : 56));
    const opening = r.region(
      faceOpening(m, sheer ? 0 : -2, hairline + (sheer ? -2 : 1)),
    );
    const rim = Raster.diff(outer, opening);
    r.fill(rim, cloth.base, MAT.cloth);
    shadeRamp(r, rim, [36, 18], [farX + 8, 18], 0.34, SHADOW, [MAT.cloth]);
    shadeRamp(r, rim, [30, 34], [30, 58], 0.2, SHADOW, [MAT.cloth]);
    if (sheer) {
      // A veil is thin: the hair under it shows through on the dither.
      r.paint(rim, (c) => mix(c, m.hair.shade, 0.3), {
        only: [MAT.cloth],
        dither: true,
      });
      r.paint(Raster.diff(r.grow(opening, 2), opening), lift(0.2), {
        only: [MAT.cloth],
        dither: true,
      });
    }
    // Fold running from the crown down the lit side.
    r.stroke(
      [
        [28, top - cv],
        [nearX - 4, 28],
        [nearX - 4, 50],
      ],
      cloth.light,
      2,
      undefined,
      MAT.cloth,
    );
    r.stroke(
      [
        [42, top - cv + 1],
        [farX + 4, 30],
        [farX + 4, 52],
      ],
      cloth.deep,
      2,
      undefined,
      MAT.cloth,
    );
    return;
  }

  if (wear === "wig") {
    // Powdered, whatever colour the hair was: rolls over the ears under a
    // high crown, the face cut clear so the mass never creeps onto it.
    const wig = tones(mix(a.hairColor, "#efe9dc", 0.78), "hair");
    const crown = Math.max(1, top - v - 7);
    const mass = smooth(
      [
        [nearX - v - 7, 46],
        [nearX - v - 9, 30],
        [nearX - v - 6, crown + 6],
        [28, crown],
        [37, crown - 1],
        [46, crown + 2],
        [farX + v + 5, 30],
        [farX + v + 4, 46],
        [farX + v + 1, 50],
        [36, 52],
        [nearX - v - 3, 50],
      ],
      3,
    );
    const body = Raster.diff(
      r.region(mass),
      r.region(faceOpening(m, -3, hairline + 1)),
    );
    r.fill(body, wig.base, MAT.hair);
    shadeRamp(r, body, [36, 14], [farX + v + 5, 14], 0.3, SHADOW, [MAT.hair]);
    // Rolls over each ear: bands across the whole width of the mass, each cut
    // from the next by a shade line. Separate blobs read as steps.
    for (let k = 0; k < 3; k++) {
      const y = 25 + k * 6;
      const near = Raster.diff(
        r.ellipse(nearX - v - 2, y + 1, 7, 3),
        r.region(faceOpening(m, -3, hairline + 1)),
      );
      r.paint(near, k & 1 ? wig.light : wig.base, { only: [MAT.hair] });
      r.paint(r.ellipse(nearX - v - 4, y, 4.5, 1.2), wig.high, {
        only: [MAT.hair],
      });
      r.paint(r.ellipse(farX + v + 1, y + 3, 4, 2.5), wig.shade, {
        only: [MAT.hair],
      });
      r.stroke(
        [
          [nearX - v - 8, y + 4],
          [nearX - v - 1, y + 4.5],
        ],
        wig.deep,
        0,
        undefined,
        MAT.hair,
      );
      r.stroke(
        [
          [farX + v - 1, y + 6],
          [farX + v + 5, y + 5],
        ],
        wig.deep,
        0,
        undefined,
        MAT.hair,
      );
    }
    r.stroke(
      [
        [27, crown + 3],
        [34, crown + 0.5],
        [41, crown + 2],
      ],
      wig.high,
      2,
      undefined,
      MAT.hair,
    );
    return;
  }

  if (wear === "helmet" || wear === "visor") {
    // Bronze bowl to the nape. The helmet leaves the face clear behind a
    // nasal bar; the visor closes it with a plate.
    const bowl = smooth(
      [
        [nearX - cv - 3, 40],
        [nearX - cv - 5, 26],
        [nearX - cv - 3, 12],
        [28, top - cv - 3],
        [37, top - cv - 4],
        [46, top - cv - 2],
        [farX + cv + 3, 14],
        [farX + cv + 4, 28],
        [farX + cv + 2, 42],
        [36, 46],
      ],
      3,
    );
    const shell =
      wear === "visor"
        ? r.region(bowl)
        : Raster.diff(
            r.region(bowl),
            r.region(faceOpening(m, -4, hairline + 2)),
          );
    r.fill(shell, gold.base, MAT.metal);
    shadeRamp(r, shell, [34, 10], [farX + cv + 4, 10], 0.38, SHADOW, [
      MAT.metal,
    ]);
    shadeRamp(r, shell, [30, top], [30, 44], 0.18, SHADOW, [MAT.metal]);
    // Specular band across the bowl: the one thing that says metal this small.
    r.stroke(
      [
        [nearX - cv - 2, 22],
        [28, 13],
        [36, top - cv],
      ],
      gold.high,
      0,
      undefined,
      MAT.metal,
    );
    r.stroke(
      [
        [nearX - cv - 3, 26],
        [27, 17],
        [34, top - cv + 2],
      ],
      gold.light,
      2,
      undefined,
      MAT.metal,
    );
    // Rim over the brow.
    r.stroke(
      [
        [nearX - cv - 3, hairline + 3],
        [36, hairline + 1],
        [farX + cv + 2, hairline + 3],
      ],
      gold.deep,
      0,
      undefined,
      MAT.metal,
    );
    if (wear !== "helmet") {
      // Sight slit, then breath holes on the lit side of the chin.
      r.stroke(
        [
          [nearX + 1, m.eyeY + 1],
          [36, m.eyeY - 1],
          [farX - 2, m.eyeY + 1],
        ],
        gold.edge,
        0,
        undefined,
        MAT.metal,
      );
      r.stroke(
        [
          [nearX + 1, m.eyeY + 2],
          [36, m.eyeY],
          [farX - 2, m.eyeY + 2],
        ],
        gold.edge,
        0,
        undefined,
        MAT.metal,
      );
      r.stroke(
        [
          [nearX, m.eyeY - 1],
          [36, m.eyeY - 3],
          [farX - 1, m.eyeY - 1],
        ],
        gold.high,
        2,
        undefined,
        MAT.metal,
      );
      r.rect(Math.round(m.mid - 1), m.eyeY + 3, 2, 8, gold.shade, MAT.metal);
      for (let k = 0; k < 3; k++)
        r.put(30 + k * 3, m.chin - 11 + (k & 1), gold.edge);
    }
    return;
  }
}

/** The helmet's nasal bar. Drawn after the features, which it hangs over. */
function drawNasal(r: Raster, m: Model) {
  const { gold, hairline, mid } = m;
  const x = Math.round(mid) - 2;
  r.rect(x, hairline + 1, 3, 15, gold.shade, MAT.metal);
  r.line([x, hairline + 1], [x, hairline + 15], gold.light);
  r.line([x + 2, hairline + 2], [x + 2, hairline + 15], gold.edge);
  // Flared at the tip, where it widens over the nostrils.
  r.rect(x - 1, hairline + 13, 5, 3, gold.shade, MAT.metal);
  r.line([x - 1, hairline + 13], [x - 1, hairline + 15], gold.light);
  r.line([x + 3, hairline + 14], [x + 3, hairline + 15], gold.edge);
  r.line([x - 1, hairline + 16], [x + 3, hairline + 16], gold.edge);
}

// ---------------------------------------------------------------- jewellery

function drawJewellery(r: Raster, m: Model) {
  const { a, gold, nearX, eyeY } = m;
  if (a.wearing.earrings) {
    const x = nearX - 1.5,
      y = eyeY + 9;
    r.put(x, y, gold.deep, MAT.metal);
    r.put(x - 1, y + 1, gold.light, MAT.metal);
    r.put(x + 1, y + 1, gold.base, MAT.metal);
    r.put(x - 1, y + 2, gold.light, MAT.metal);
    r.put(x + 1, y + 2, gold.shade, MAT.metal);
    r.put(x, y + 3, gold.base, MAT.metal);
    r.put(x - 1, y + 1, gold.high);
  }
  if (a.wearing.necklace) {
    const bs = m.bodyScale;
    const beads: Pt[] = (
      [
        [24, 52],
        [27, 55],
        [31, 57.5],
        [36, 58.5],
        [41, 57.5],
        [45, 55],
        [47, 52],
      ] as Pt[]
    ).map(([x, y]) => [Math.round(36 + (x - 36) * bs), y]);
    for (let i = 0; i + 1 < beads.length; i++)
      r.line(beads[i], beads[i + 1], gold.shade, MAT.metal);
    for (const [x, y] of beads) {
      r.put(x, y, gold.light, MAT.metal);
      r.put(x, y + 1, gold.base, MAT.metal);
    }
    r.put(36, 59.5, gold.high, MAT.metal);
    if (m.hemY < 76) {
      const y = m.hemY + 3;
      r.rect(6 + m.shoulder, y, 8, 2, gold.base, MAT.metal);
      r.rect(7 + m.shoulder, y, 4, 1, gold.light);
      r.rect(11 + m.shoulder, y + 1, 3, 1, gold.shade);
    }
  }
}
