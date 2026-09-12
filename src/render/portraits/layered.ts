import {
  generateFace,
  type CharacterAppearance,
  type CharacterFace,
} from "../../core/character";
import { mix, Pixels, ramp, type Point } from "../characters/pixels";

export const PORTRAIT_WIDTH = 64;
export const PORTRAIT_HEIGHT = 80;

export function portraitFace(
  appearance: CharacterAppearance,
  age = 30,
): CharacterFace {
  return (
    appearance.face ??
    generateFace(
      `legacy:${appearance.skin}:${appearance.hairColor}:${appearance.hair}:${appearance.head}:${appearance.jaw}`,
      0,
      age,
    )
  );
}

export function drawLayeredPortrait(
  ctx: CanvasRenderingContext2D,
  appearance: CharacterAppearance,
  age = 30,
) {
  ctx.clearRect(0, 0, PORTRAIT_WIDTH, PORTRAIT_HEIGHT);
  ctx.imageSmoothingEnabled = false;
  const p = new Pixels(ctx);
  const face = portraitFace(appearance, age);
  const skin = ramp(appearance.skin, "skin");
  const hair = ramp(appearance.hairColor, "hair");
  const cloth = ramp(appearance.wearing.color);
  const trim = ramp(appearance.wearing.trim);
  const head = appearance.head ?? "original";
  const jaw = appearance.jaw ?? "original";
  const build = appearance.build;
  const shoulder = build < 0 ? 2 : build > 0 ? -Math.min(2, build) : 0;

  if (["long", "bob", "braid"].includes(appearance.hair)) {
    const length = appearance.hair === "long" ? 59 : 49;
    p.shape(
      [
        [14, 18],
        [19, 9],
        [44, 9],
        [51, 18],
        [53, length - 4],
        [47, length],
        [16, length],
        [11, length - 5],
      ],
      hair,
    );
  }

  p.shape(
    [
      [26, 47],
      [38, 47],
      [39, 59],
      [25, 59],
    ],
    skin,
  );
  p.rect(27, 48, 10, 8, skin.shade);

  const left = 7 + shoulder;
  const right = 57 - shoulder;
  p.group(cloth, () => {
    p.shape(
      [
        [left, 80],
        [left + 1, 65],
        [18, 57],
        [26, 54],
        [32, 59],
        [38, 54],
        [46, 57],
        [right - 1, 65],
        [right, 80],
      ],
      cloth,
    );
  });
  p.line([left + 4, 68], [left + 3, 79], cloth.light);
  p.line([right - 5, 68], [right - 4, 79], cloth.shade);
  if (appearance.wearing.shoulderCloth)
    p.shape(
      [
        [15, 59],
        [26, 55],
        [42, 80],
        [30, 80],
      ],
      trim,
    );
  if (appearance.wearing.necklace) {
    p.line([23, 58], [28, 64], trim.base);
    p.line([28, 64], [36, 64], trim.light);
    p.line([36, 64], [41, 58], trim.base);
  } else {
    p.line([20, 59], [27, 65], trim.base);
    p.line([27, 65], [37, 65], trim.light);
    p.line([37, 65], [44, 59], trim.base);
  }

  const top = head === "long" ? 10 : head === "round" ? 12 : 11;
  const cheek = head === "broad" ? 2 : head === "round" ? 1 : 0;
  const chin = face.chin === "long" ? 53 : face.chin === "short" ? 49 : 51;
  const jawInset =
    jaw === "small" ? 5 : jaw === "pointed" ? 4 : jaw === "soft" ? 2 : 1;
  const headPoints: Point[] = [
    [22 - cheek, top],
    [42 + cheek, top],
    [48 + cheek, 18],
    [49 + cheek, 34],
    [45 + cheek, 44],
    [40 + jawInset, 49],
    [32, chin],
    [24 - jawInset, 49],
    [19 - cheek, 44],
    [15 - cheek, 34],
    [16 - cheek, 18],
  ];
  p.shape(headPoints, skin);
  p.rect(19 - cheek, 24, 3, 16, skin.light);
  p.rect(43 + cheek, 25, 3, 16, skin.shade);
  p.rect(23, 16, 16, 3, skin.light);
  p.rect(24, 45, 16, 3, skin.shade);
  p.shape(
    [
      [15 - cheek, 29],
      [12 - cheek, 28],
      [11 - cheek, 35],
      [15 - cheek, 39],
      [18 - cheek, 37],
    ],
    skin,
  );
  p.shape(
    [
      [49 + cheek, 29],
      [52 + cheek, 28],
      [53 + cheek, 35],
      [49 + cheek, 39],
      [46 + cheek, 37],
    ],
    skin,
  );

  const spacing =
    face.eyeSpacing === "wide" ? 1 : face.eyeSpacing === "close" ? -1 : 0;
  const eyeWidth =
    face.eyeSize === "large" ? 5 : face.eyeSize === "small" ? 3 : 4;
  const eyeHeight =
    face.eyeShape === "narrow" ? 1 : face.eyeSize === "large" ? 3 : 2;
  const leftEye = 24 - spacing - Math.floor(eyeWidth / 2);
  const rightEye = 40 + spacing - Math.ceil(eyeWidth / 2);
  const eyeY = face.eyeShape === "almond" ? 29 : 28;
  const eyeDark = mix(appearance.hairColor, "#171523", 0.65);
  const white = mix("#f5ead7", appearance.skin, 0.08);
  const drawEye = (x: number) => {
    p.rect(x, eyeY, eyeWidth, eyeHeight, white);
    const irisX = x + Math.floor(eyeWidth / 2);
    p.rect(irisX, eyeY, face.eyeSize === "large" ? 2 : 1, eyeHeight, eyeDark);
    if (face.eyeSize === "large") p.rect(irisX, eyeY, 1, 1, "#f7e9c7");
    if (face.eyeShape === "almond") {
      p.rect(x, eyeY, 1, 1, skin.shade);
      p.rect(x + eyeWidth - 1, eyeY + eyeHeight - 1, 1, 1, skin.shade);
    }
  };
  drawEye(leftEye);
  drawEye(rightEye);
  const browY = face.brows === "arched" ? 24 : 25;
  const browWidth = face.brows === "heavy" ? eyeWidth + 2 : eyeWidth + 1;
  p.line(
    [leftEye - 1, browY + (face.brows === "arched" ? 1 : 0)],
    [leftEye + browWidth - 1, browY],
    hair.shade,
  );
  p.line(
    [rightEye, browY],
    [rightEye + browWidth, browY + (face.brows === "arched" ? 1 : 0)],
    hair.shade,
  );
  if (face.brows === "heavy") {
    p.rect(leftEye, browY + 1, browWidth - 1, 1, hair.base);
    p.rect(rightEye + 1, browY + 1, browWidth - 1, 1, hair.base);
  }

  const noseBottom =
    face.nose === "short" ? 37 : face.nose === "aquiline" ? 41 : 39;
  const noseX = face.nose === "aquiline" ? 33 : 32;
  p.line([32, 31], [noseX, noseBottom - 1], skin.shade);
  p.rect(
    noseX - 1,
    noseBottom - 1,
    face.nose === "broad" ? 5 : 3,
    2,
    skin.shade,
  );
  p.rect(noseX, noseBottom - 1, 2, 1, skin.light);
  if (face.nose === "aquiline") p.rect(33, 35, 2, 2, skin.light);

  const mouthWidth =
    face.mouth === "wide" ? 10 : face.mouth === "narrow" ? 5 : 8;
  const mouthX = 32 - Math.floor(mouthWidth / 2);
  const lip = mix(skin.shade, "#8f3f4a", face.mouth === "full" ? 0.55 : 0.3);
  p.rect(mouthX, 43, mouthWidth, 1, lip);
  if (face.mouth === "full" || face.mouth === "soft")
    p.rect(mouthX + 1, 44, mouthWidth - 2, 1, skin.shade);
  p.rect(31, 48, 3, 1, skin.light);

  if (face.detail === "freckles")
    for (const [x, y] of [
      [21, 35],
      [24, 36],
      [41, 35],
      [44, 36],
    ] as Point[])
      p.rect(x, y, 1, 1, skin.shade);
  if (face.detail === "lines" || face.detail === "weathered") {
    p.line([18, 34], [21, 35], skin.shade);
    p.line([43, 35], [46, 34], skin.shade);
    p.rect(28, 46, 2, 1, skin.shade);
    if (face.detail === "weathered") {
      p.rect(21, 40, 2, 1, skin.shade);
      p.rect(41, 40, 2, 1, skin.shade);
    }
  }

  drawHair(p, appearance, face, hair, skin, top, cheek);
  drawBeard(p, appearance, hair, skin);
  if (appearance.wearing.earrings) {
    p.rect(13 - cheek, 38, 2, 5, trim.light);
    p.rect(50 + cheek, 38, 2, 5, trim.light);
  }
  if (appearance.wearing.headwear !== "none")
    drawHeadwear(p, appearance, cloth, trim, top);
}

function drawHair(
  p: Pixels,
  a: CharacterAppearance,
  face: CharacterFace,
  hair: ReturnType<typeof ramp>,
  skin: ReturnType<typeof ramp>,
  top: number,
  cheek: number,
) {
  if (a.hair === "bald") {
    p.line([23, top + 1], [40, top + 1], skin.light);
    return;
  }
  const line =
    face.hairline === "high" ? 20 : face.hairline === "low" ? 17 : 19;
  p.shape(
    [
      [16 - cheek, 30],
      [14 - cheek, 18],
      [20, top - 4],
      [41, top - 4],
      [49 + cheek, 17],
      [49 + cheek, 28],
      [44, 24],
      [43, line],
      [36, line - 2],
      [32, face.hairline === "widows-peak" ? line + 3 : line],
      [27, line - 1],
      [21, line + 3],
      [20, 29],
    ],
    hair,
  );
  if (a.hair === "cropped") {
    p.rect(16 - cheek, 19, 4, 14, hair.base);
    p.rect(45 + cheek, 19, 4, 14, hair.shade);
  } else if (["long", "bob"].includes(a.hair)) {
    p.rect(13 - cheek, 24, 7, a.hair === "long" ? 31 : 23, hair.base);
    p.rect(44 + cheek, 24, 8, a.hair === "long" ? 31 : 23, hair.shade);
  } else if (a.hair === "topknot") {
    p.shape(
      [
        [25, top - 3],
        [26, top - 9],
        [31, top - 12],
        [38, top - 9],
        [39, top - 3],
      ],
      hair,
    );
  } else if (a.hair === "braid") {
    for (let y = 26; y < 62; y += 4) {
      const x = y % 8 ? 15 - cheek : 14 - cheek;
      p.rect(x, y, 5, 4, hair.base);
      p.rect(x + 1, y, 2, 1, hair.light);
    }
  }
  if (face.hairTexture === "straight") {
    p.line([22, top - 1], [38, top - 1], hair.light);
    p.line([18, 17], [17, 28], hair.shade);
  } else if (face.hairTexture === "wavy") {
    for (const [x, y] of [
      [20, 12],
      [27, 9],
      [35, 10],
      [42, 13],
    ] as Point[])
      p.line([x, y], [x + 3, y + 2], hair.light);
  } else {
    const step = face.hairTexture === "coiled" ? 4 : 5;
    for (let x = 18; x <= 44; x += step)
      for (let y = top - 2; y <= 20; y += step) {
        p.rect(x, y, 3, 2, hair.light);
        p.rect(x + 2, y + 1, 2, 2, hair.shade);
      }
  }
}

function drawBeard(
  p: Pixels,
  a: CharacterAppearance,
  hair: ReturnType<typeof ramp>,
  skin: ReturnType<typeof ramp>,
) {
  if (a.beard === "none") return;
  if (["moustache", "handlebar"].includes(a.beard)) {
    p.rect(27, 40, 10, 2, hair.shade);
    if (a.beard === "handlebar") {
      p.rect(25, 41, 3, 2, hair.base);
      p.rect(36, 41, 3, 2, hair.base);
    }
    return;
  }
  if (a.beard === "stubble") {
    p.rect(22, 44, 2, 1, skin.edge);
    p.rect(27, 48, 2, 1, skin.edge);
    p.rect(39, 45, 2, 1, skin.edge);
    return;
  }
  const bottom = a.beard === "long" || a.beard === "forked" ? 62 : 55;
  p.shape(
    [
      [20, 39],
      [25, 45],
      [32, 48],
      [39, 45],
      [44, 39],
      [42, 51],
      [37, bottom],
      [32, a.beard === "forked" ? bottom - 4 : bottom],
      [27, bottom],
      [22, 51],
    ],
    hair,
  );
  p.rect(27, 41, 10, 3, skin.base);
  p.rect(29, 43, 6, 1, skin.shade);
}

function drawHeadwear(
  p: Pixels,
  a: CharacterAppearance,
  cloth: ReturnType<typeof ramp>,
  trim: ReturnType<typeof ramp>,
  top: number,
) {
  if (a.wearing.headwear === "band") {
    p.rect(16, top - 1, 33, 4, trim.base);
    p.rect(19, top - 1, 17, 1, trim.light);
  } else if (a.wearing.headwear === "cap") {
    p.shape(
      [
        [16, top + 2],
        [19, top - 7],
        [42, top - 7],
        [49, top + 2],
      ],
      cloth,
    );
  } else if (a.wearing.headwear === "hood") {
    p.shape(
      [
        [12, 31],
        [14, 10],
        [23, 3],
        [42, 5],
        [51, 17],
        [52, 36],
        [47, 28],
        [44, 13],
        [20, 13],
        [17, 31],
      ],
      cloth,
    );
  } else if (a.wearing.headwear === "wrap") {
    p.shape(
      [
        [15, top + 3],
        [18, top - 5],
        [25, top - 10],
        [43, top - 6],
        [49, top + 3],
      ],
      cloth,
    );
    p.line([19, top - 3], [44, top], trim.light);
  }
}
