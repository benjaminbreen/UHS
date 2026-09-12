import type { CharacterAppearance, CharacterFace } from "../../core/character";
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
  options?: { tuning?: Partial<ConstructedTuning> },
) {
  ctx.clearRect(0, 0, PORTRAIT_WIDTH, PORTRAIT_HEIGHT);
  ctx.imageSmoothingEnabled = false;
  paintConstructed(appearance, age, options?.tuning).blit(ctx);
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
  head: Pt[];
};

export function paintConstructed(
  appearance: CharacterAppearance,
  age = 30,
  tuning?: Partial<ConstructedTuning>,
): Raster {
  const r = new Raster(PORTRAIT_WIDTH, PORTRAIT_HEIGHT);
  const m = model(appearance, age, { ...constructedDefaults, ...tuning });
  const hood = m.a.wearing.headwear === "hood";

  drawTorso(r, m);
  if (hood) drawHoodBack(r, m);
  else drawBackHair(r, m);
  drawNeck(r, m);
  if (!hood) drawCollar(r, m);
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
  return r;
}

function model(
  a: CharacterAppearance,
  age: number,
  t: ConstructedTuning,
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
    head: smooth(headPts, 5),
  };
}

// ---------------------------------------------------------------- body

function necklineFor(m: Model): Pt[] {
  const garment = m.a.wearing.garment;
  const vNeck = garment === "shirt" || garment === "coat";
  const high = garment === "robe" || garment === "wrap";
  const points: Pt[] = high
    ? [
        [25, 49],
        [36, 50.5],
        [46, 49],
      ]
    : vNeck
      ? [
          [25, 49],
          [30, 52.5],
          [36, 57],
          [42, 52.5],
          [46, 49],
        ]
      : [
          [24, 48.5],
          [29, 51.5],
          [36, 53],
          [42, 51.5],
          [46.5, 48.5],
        ];
  return points.map(([x, y]) => [36 + (x - 36) * m.bodyScale, y] as Pt);
}

function drawTorso(r: Raster, m: Model) {
  const { cloth, skin, trim, a } = m;
  const s = m.shoulder;
  const nearArm = 4 + s,
    farArm = 60 - s;
  const high = ["robe", "wrap"].includes(a.wearing.garment);
  const neckline = necklineFor(m);
  const bs = m.bodyScale;
  // Torso x positions shrink toward the centre for small bodies.
  const bx = (x: number) => 36 + (x - 36) * bs;
  const body = smooth(
    [
      ...neckline,
      [36 + 17 * bs, 50.5],
      [57.5 - s, 56],
      [farArm - 0.5, 64],
      [farArm, 80],
      [farArm, 84],
      [nearArm, 84],
      [nearArm, 80],
      [nearArm + 0.5, 64],
      [7 + s, 56.5],
      [36 - 24 * bs, 51],
      [36 - 17 * bs, 48.5],
    ],
    4,
  );
  r.poly(body, cloth.base, MAT.cloth);
  const torso = r.region(body);
  shadeRamp(r, torso, [34, 60], [62, 66], 0.3, SHADOW, [MAT.cloth]);
  shadeRamp(r, torso, [22, 60], [6, 54], 0.16, LIGHT, [MAT.cloth]);
  // Folds fall from the neckline toward the belt.
  r.stroke(
    [
      [bx(29), 60],
      [bx(27), 70],
      [bx(28), 79],
    ],
    cloth.shade,
    3,
  );
  r.stroke(
    [
      [bx(44), 59],
      [bx(46), 69],
      [bx(47), 79],
    ],
    cloth.shade,
    3,
  );

  if (a.wearing.cloak) drawCloak(r, m, nearArm, farArm);

  if (m.hemY < 80) {
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
  if (belt !== "none" && !high) {
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

function drawCollar(r: Raster, m: Model) {
  const { trim, a } = m;
  const high = ["robe", "wrap"].includes(a.wearing.garment);
  const neckline = necklineFor(m);
  // Neckline binding three pixels deep; a necklace sits on top of it.
  const depth = high ? 2 : 3;
  const band = smooth(
    [
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
  const neck = r.region([
    [29 - w, chin - 8],
    [43 + w, chin - 8],
    [43.5 + w, 56],
    [28 - w, 56],
  ]);
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
  );
}

// ---------------------------------------------------------------- head

function drawHead(r: Raster, m: Model) {
  const { skin, farX, nearX, top, chin, eyeY, mid } = m;
  r.poly(m.head, skin.base, MAT.skin);
  const head = r.region(m.head);
  // The front plane turns away from the light: everything right of the
  // nose line darkens toward the far edge.
  shadeRamp(
    r,
    head,
    [mid + 1, 30],
    [farX + 2, 30],
    0.3 * m.shadowScale,
    SHADOW,
    [MAT.skin],
  );
  // Lower face and the underside of the chin.
  shadeRamp(r, head, [30, chin - 5], [30, chin + 1], 0.24, SHADOW, [MAT.skin]);
  // The side plane of the skull behind the temple falls off a little.
  shadeRamp(r, head, [nearX + 6, 28], [nearX - 1, 28], 0.16, SHADOW, [
    MAT.skin,
  ]);
  // Forehead and near cheek catch the light.
  r.paint(r.ellipse(31, top + 10, 5.5, 3), lift(0.16), {
    only: [MAT.skin],
    soft: true,
  });
  r.paint(r.ellipse(27.5, eyeY + 6.5, 4, 2.5), lift(0.16), {
    only: [MAT.skin],
    soft: true,
  });
  if (m.age >= 60) {
    // Cheeks hollow below the cheekbone on both sides.
    r.paint(r.ellipse(27, eyeY + 10.5, 3, 2), shadow(0.16), {
      only: [MAT.skin],
      soft: true,
    });
    r.paint(r.ellipse(mid + 5, eyeY + 10, 2.5, 2), shadow(0.14), {
      only: [MAT.skin],
      soft: true,
    });
  }
  // Brow ridge shadow over both sockets.
  r.paint(
    r.region([
      [24, eyeY - 2],
      [34, eyeY - 2],
      [34, eyeY],
      [24, eyeY],
    ]),
    shadow(0.14),
    { only: [MAT.skin], dither: true },
  );
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
  const eyeDark = mix(a.hairColor, "#1b1626", 0.65);
  const iris = mix(a.hairColor, "#2d2440", 0.3);
  const white = mix("#efe4d2", a.skin, 0.28);
  const lid = mix(skin.deep, hair.edge, 0.55);

  // Near eye: full almond. Far eye: foreshortened, tucked against the far edge.
  const nw =
    (face.eyeSize === "large" ? 7 : face.eyeSize === "small" ? 5 : 6) +
    (child ? 1 : 0);
  const fw = Math.max(3, nw - 2 - (face.eyeSize === "large" ? 0 : 0));
  const h =
    face.eyeShape === "round" || face.eyeSize === "large" || child ? 3 : 2;
  const spacing =
    face.eyeSpacing === "wide" ? 1 : face.eyeSpacing === "close" ? -1 : 0;
  const nx = 32 - nw - spacing;
  const fx = 40 + spacing;

  const eye = (x0: number, w: number, near: boolean) => {
    r.rect(x0, eyeY, w, h, white);
    r.rect(x0, eyeY - 1, w, 1, lid);
    if (face.eyeShape === "almond" || face.eyeShape === "narrow") {
      // Pointed corners: outer corner lower for the near eye.
      r.put(near ? x0 - 1 : x0 + w, eyeY, lid);
      r.put(near ? x0 : x0 + w - 1, eyeY + h - 1, skin.shade);
      r.put(near ? x0 + w - 1 : x0, eyeY + h - 1, mix(white, skin.shade, 0.5));
    } else {
      r.put(x0, eyeY - 1, skin.base);
      r.put(x0 + w - 1, eyeY - 1, skin.base);
      r.put(x0, eyeY, lid);
      r.put(x0 + w - 1, eyeY, lid);
    }
    if (face.eyeShape === "narrow")
      r.rect(x0, eyeY - 1, w, 1, mix(lid, eyeDark, 0.5));
    // Iris looks at the viewer, so it sits toward the viewer's side of each eye.
    const iw = Math.min(w - 2, face.eyeSize === "large" || child ? 3 : 2);
    const ix = near ? x0 + Math.floor((w - iw) / 2) : x0 + 1;
    r.rect(ix, eyeY, iw, h, iris);
    r.rect(ix + (iw > 2 ? 1 : 0), eyeY, 1, h, eyeDark);
    if (h > 2) r.rect(ix, eyeY + h - 1, iw, 1, mix(iris, white, 0.3));
    r.put(ix, eyeY, "#f9f2e2");
    r.rect(x0 + 1, eyeY + h, w - 2, 1, skin.shade);
  };
  eye(nx, nw, true);
  eye(fx, fw, false);
  // Eye socket shadow at the bridge side of each eye.
  r.put(nx + nw, eyeY + 1, mix(skin.base, skin.shade, 0.7));
  r.put(fx - 1, eyeY + 1, skin.shade);

  // Brows. The near brow reads long and arched; the far one is short.
  const female = a.physique?.sex === "female";
  const browColor =
    age >= 55
      ? mix(hair.deep, skin.shade, 0.35)
      : female
        ? mix(hair.deep, skin.base, 0.2)
        : hair.deep;
  const arch = face.brows === "arched" ? 1 : 0;
  const nearBrow: Pt[] = [
    [nx - 1, browY + 1.5],
    [nx + 2, browY - arch],
    [nx + nw - 1, browY - arch],
    [nx + nw + 1, browY + 0.5],
  ];
  const farBrow: Pt[] = [
    [fx - 1, browY],
    [fx + 1, browY - arch],
    [fx + fw, browY + 0.5],
    [fx + fw + 1, browY + 1.5],
  ];
  r.stroke(nearBrow, browColor);
  r.stroke(farBrow, browColor);
  if (face.brows === "heavy" && age < 60 && !female) {
    r.stroke(
      nearBrow.map(([x, y]) => [x, y + 1] as Pt),
      hair.base,
    );
    r.stroke(
      farBrow.map(([x, y]) => [x, y + 1] as Pt),
      hair.base,
    );
  }

  // Nose in profile. The bridge starts between the eyes, the far edge runs
  // down and right to the tip, and the base turns back under it.
  const bump = face.nose === "aquiline" ? 1 : 0;
  const tipX = mid + 2 + (face.nose === "broad" ? 1 : 0);
  const profile: Pt[] = [
    [mid - 1, eyeY],
    [mid + bump, eyeY + 2],
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
      [mid - 2, eyeY + 1],
      [mid - 1 + bump, eyeY + 3],
      [tipX - 2, noseBase - 3],
    ],
    skin.light,
    child ? 2 : 0,
  );
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

function drawHairDetail(r: Raster, m: Model) {
  const { a, hair, face, nearX, farX, top, volume: v } = m;
  if (a.hair === "bald") return;
  if (a.wearing.headwear === "hood" || a.wearing.headwear === "wrap") return;
  const crownY = top - v;
  const all = r.region([
    [0, 0],
    [64, 0],
    [64, 80],
    [0, 80],
  ]);
  // Far side and underside darken; the near back mass turns away slightly.
  shadeRamp(r, all, [36, 20], [farX + v + 2, 20], 0.36, SHADOW, [MAT.hair]);
  shadeRamp(r, all, [30, 26], [30, 46], 0.22, SHADOW, [MAT.hair]);
  shadeRamp(r, all, [nearX - 1, 20], [nearX - v - 3, 20], 0.14, SHADOW, [
    MAT.hair,
  ]);
  if (a.wearing.headwear === "cap") return;
  const texture = face.hairTexture;
  const nearOut = nearX - v - 2;
  if (texture === "curly" || texture === "coiled") {
    const step = texture === "coiled" ? 3 : 4;
    for (let y = crownY + 1; y < 60; y += step)
      for (let x = nearOut; x < farX + v + 2; x += step) {
        const j = ((x * 7 + y * 13) % 5) - 2;
        const px = x + (y % (2 * step) ? 1 : 0) + (j > 0 ? 1 : 0),
          py = y + (j < 0 ? 1 : 0);
        if (
          r.matAt(px, py) !== MAT.hair ||
          r.matAt(px + 1, py + 1) !== MAT.hair
        )
          continue;
        if (px > 40 && (px + py) % 3) continue;
        r.put(px, py, hair.light);
        if (texture === "coiled") r.put(px + 1, py + 1, hair.shade);
        else r.put(px + 1, py, hair.light);
      }
    return;
  }
  // Crown highlight on the lit side.
  r.stroke(
    [
      [nearOut + 4, crownY + 5],
      [27, crownY + 2],
      [34, crownY + 0.5],
    ],
    hair.high,
    2,
    undefined,
    MAT.hair,
  );
  r.stroke(
    [
      [nearOut + 5, crownY + 7],
      [28, crownY + 4],
      [33, crownY + 2.5],
    ],
    hair.light,
    3,
    undefined,
    MAT.hair,
  );
  const wave = texture === "wavy" ? 1.5 : 0;
  // Parting a little left of the midline; strands fall away from it.
  if (
    a.hair !== "cropped" &&
    a.hair !== "topknot" &&
    a.wearing.headwear === "none"
  )
    r.stroke(
      [
        [31, crownY + 2],
        [30, m.hairline - 1],
      ],
      hair.deep,
      2,
      undefined,
      MAT.hair,
    );
  // Strands follow the flow from the parting down both sides.
  const strands: Pt[][] = [
    [
      [31, crownY + 3],
      [26 - wave, crownY + 8],
      [24 + wave, crownY + 14],
      [22, crownY + 20],
    ],
    [
      [38, crownY + 2],
      [43 + wave, crownY + 6],
      [46, crownY + 12],
    ],
    [
      [nearOut + 3, 26],
      [nearOut + 3 + wave, 33],
      [nearOut + 2, 40],
      [nearOut + 3 + wave, 47],
      [nearOut + 2, 56],
    ],
    [
      [nearOut + 6, 30],
      [nearOut + 6 - wave, 38],
      [nearOut + 7, 46],
    ],
    [
      [farX + v - 2, 26],
      [farX + v - 2 - wave, 33],
      [farX + v - 1, 40],
      [farX + v - 2, 48],
      [farX + v - 1, 56],
    ],
  ];
  for (const s of strands)
    r.stroke(s, hair.high, texture === "wavy" ? 3 : 4, undefined, MAT.hair);
  for (const s of strands.slice(0, 2))
    r.stroke(
      s.map(([x, y]) => [x + 1, y + 1] as Pt),
      hair.shade,
      3,
      undefined,
      MAT.hair,
    );
  if (a.hair === "topknot")
    r.stroke(
      [
        [32, top - v - 5],
        [36, top - v - 5.5],
      ],
      hair.light,
      0,
      undefined,
      MAT.hair,
    );
}

// ---------------------------------------------------------------- beard

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
  const length = beard === "long" || beard === "forked" ? 12 : 4;
  let region: Pt[];
  if (beard === "goatee")
    region = [
      [mid - 5, chin - 5],
      [mid + 4, chin - 5],
      [mid + 4.5, chin + 2],
      [mid, chin + 5],
      [mid - 5, chin + 2],
    ];
  else if (beard === "sideburns")
    region = [
      [nearX + 1, chin - 17],
      [nearX + 5, chin - 17],
      [nearX + 6, chin - 8],
      [nearX + 2.5, chin - 8],
    ];
  else if (beard === "chinstrap")
    region = [
      ...jaw,
      [farX - 1.5, chin - 6],
      [mid + 4, chin + 1],
      [mid - 2, chin + 2],
      [28, chin],
      [nearX + 2, chin - 6],
    ];
  else
    region = smooth(
      [
        ...jaw,
        [farX - 1, chin - 3],
        [mid + 5, chin + length - 2],
        [mid + 1, chin + length + (beard === "forked" ? -3 : 1)],
        [mid - 5, chin + length - 1],
        [27, chin + length - 5],
        [nearX + 1.5, chin - 3],
      ],
      3,
    );
  r.poly(region, hair.base, MAT.hair);
  if (beard === "forked")
    r.poly(
      [
        [mid - 2, chin + 5],
        [mid + 1, chin + 5],
        [mid + 2, chin + length + 1],
        [mid - 3, chin + length + 1],
      ],
      skin.base,
      MAT.skin,
    );
  if (!["goatee", "chinstrap", "sideburns"].includes(beard)) {
    // Keep the mouth clear, then add the moustache over it.
    r.poly(
      [
        [mid - 6, mouthY - 0.5],
        [mid + 4, mouthY - 0.5],
        [mid + 4, mouthY + 2.5],
        [mid - 6, mouthY + 2.5],
      ],
      skin.base,
      MAT.skin,
    );
    drawMoustache(r, m, false);
  }
  shadeRamp(
    r,
    r.region([
      [mid, chin - 12],
      [farX + 1, chin - 12],
      [farX + 1, chin + 14],
      [mid, chin + 14],
    ]),
    [mid, 40],
    [farX, 40],
    0.32,
    SHADOW,
    [MAT.hair],
  );
  for (const [x, y] of [
    [27, chin - 1],
    [31, chin + 2],
    [26, chin - 5],
  ] as Pt[])
    if (r.matAt(x, y) === MAT.hair) r.put(x, y, hair.light);
}

function drawMoustache(r: Raster, m: Model, handlebar: boolean) {
  const { hair, mouthY, mid } = m;
  r.poly(
    [
      [mid - 7, mouthY - 2],
      [mid - 1, mouthY - 3.5],
      [mid + 4.5, mouthY - 2.5],
      [mid + 5, mouthY - 0.5],
      [mid, mouthY - 1],
      [mid - 7.5, mouthY - 0.5],
    ],
    hair.base,
    MAT.hair,
  );
  if (handlebar) {
    r.line([mid - 8, mouthY - 1], [mid - 9, mouthY + 2], hair.base, MAT.hair);
    r.line([mid + 5, mouthY - 1], [mid + 6, mouthY + 2], hair.base, MAT.hair);
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
  }
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
