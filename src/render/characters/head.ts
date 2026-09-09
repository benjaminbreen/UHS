import type { CharacterAppearance } from "../../core/character";
import type { CharacterPose } from "./poses";
import { mix, Pixels, ramp, type Point } from "./pixels";
export function drawHead(
  p: Pixels,
  a: CharacterAppearance,
  side: boolean,
  back: boolean,
  pose: CharacterPose,
  f: number,
) {
  const skin = ramp(a.skin, "skin"),
    hair = ramp(a.hairColor, "hair"),
    cloth = ramp(a.wearing.color),
    cloak = ramp(a.wearing.cloakColor);
  const eye = mix(a.hairColor, "#342b36", 0.6),
    blink = pose === "idle" && f === 3;
  const shape = a.head ?? "original",
    jaw = a.jaw ?? "original";
  const cheek =
    shape === "broad" || shape === "round" ? 1 : shape === "oval" ? -1 : 0;
  const chinY = shape === "long" ? 16 : 15;
  if (side) {
    // Actual east profile: occiput → forehead → nose → lips → chin → neck.
    p.shape(
      [
        [shape === "broad" ? 3 : 5, 4],
        [10, shape === "long" ? 1 : 2],
        [shape === "oval" ? 14 : 15, 3],
        [17, 5],
        [17, 8],
        [19, 9],
        [19, 10],
        [17, 11],
        ...((jaw === "square"
          ? [
              [18, 13],
              [17, 16],
              [12, 16],
              [10, 13],
            ]
          : jaw === "small"
            ? [
                [16, 12],
                [14, 14],
                [11, 13],
                [10, 12],
              ]
            : jaw === "pointed"
              ? [
                  [17, 13],
                  [15, 17],
                  [12, 14],
                  [10, 12],
                ]
              : jaw === "soft"
                ? [
                    [17, 12],
                    [16, 14],
                    [14, 16],
                    [11, 14],
                    [10, 12],
                  ]
                : [
                    [17, 13],
                    [14, chinY],
                    [10, chinY - 1],
                    [10, 12],
                  ]) as Point[]),
        [6, 12],
        [4, 9],
      ],
      skin,
    );
    p.rect(12, 6, 4, 5, skin.base);
    p.rect(16, 9, 2, 1, skin.light);
    p.rect(14, 7, 1, blink ? 1 : 2, blink ? skin.shade : eye);
    p.rect(15, 7, 1, 1, skin.light);
    p.rect(15, 11, 2, 1, skin.shade);
    p.rect(13, 13, 2, 1, skin.shade);
  } else {
    p.shape(
      [
        [shape === "broad" ? 5 : shape === "round" ? 7 : 6, 3],
        [shape === "broad" ? 15 : shape === "round" ? 13 : 14, 3],
        [17 + cheek, 6],
        [16 + cheek, 11],
        ...((jaw === "square"
          ? [
              [16, 14],
              [14, 16],
              [7, 16],
              [4 - cheek, 13],
            ]
          : jaw === "small"
            ? [
                [14, 12],
                [12, 14],
                [9, 14],
                [6, 12],
                [4 - cheek, 11],
              ]
            : jaw === "pointed"
              ? [
                  [14, 14],
                  [11, 17],
                  [9, 15],
                  [6, 13],
                  [4 - cheek, 12],
                ]
              : jaw === "soft"
                ? [
                    [15, 13],
                    [12, 16],
                    [8, 15],
                    [5, 13],
                    [4 - cheek, 12],
                  ]
                : [
                    [14, chinY],
                    [7, chinY],
                    [4 - cheek, 12],
                  ]) as Point[]),
        [4 - cheek, 6],
      ],
      skin,
    );
    p.rect(6, 6, 9, 5, skin.base);
    p.rect(7, 6, 6, 1, skin.light);
    if (!back) {
      p.rect(7, 8, 2, blink ? 1 : 2, blink ? skin.shade : eye);
      p.rect(12, 8, 2, blink ? 1 : 2, blink ? skin.shade : eye);
      p.rect(10, 10, 2, 1, skin.light);
      p.rect(9, 12, 3, 1, skin.shade);
      if (pose === "talk" && f % 2) p.rect(10, 12, 2, 2, skin.edge);
      if (pose === "startle") p.rect(10, 12, 2, 2, skin.edge);
      if (pose === "hurt") {
        p.rect(7, 7, 2, 1, skin.shade);
        p.rect(12, 7, 2, 1, skin.shade);
      }
    }
  }
  if (!back && shape !== "original") {
    p.rect(side ? 13 : 6, 10, side ? 2 : 2, 1, skin.light);
    if (!side) p.rect(14, 10, 1, 2, skin.shade);
    if (shape === "oval") p.rect(side ? 12 : 5, 11, 1, 1, skin.shade);
  }
  if (a.hair !== "bald") {
    const crown: Point[] = side
      ? [
          [4, 5],
          [6, 2],
          [10, 1],
          [15, 2],
          [17, 4],
          [17, 6],
          [14, 6],
          [13, 5],
          [11, 7],
          [9, 8],
          [9, 11],
          [6, 12],
          [4, 10],
        ]
      : [
          [4, 10],
          [3, 6],
          [5, 2],
          [10, 1],
          [15, 3],
          [17, 6],
          [15, 8],
          [13, 5],
          [11, 6],
          [9, 5],
          [6, 8],
          [6, 11],
        ];
    p.shape(crown, hair);
    p.rect(6, 3, 3, 1, hair.light);
    p.rect(6, 4, 2, 1, hair.light);
    p.rect(9, 3, 2, 1, hair.light);
    p.rect(11, 4, 3, 1, hair.shade);
    if (a.hair === "cropped") {
      p.shape(
        side
          ? [
              [5, 4],
              [7, 2],
              [14, 2],
              [16, 4],
              [16, 5],
              [9, 5],
              [8, 8],
              [5, 8],
            ]
          : [
              [4, 6],
              [5, 3],
              [8, 2],
              [14, 3],
              [16, 5],
              [15, 6],
              [6, 6],
            ],
        hair,
      );
      // Expose the forehead by replacing the long fringe with skin.
      p.rect(side ? 11 : 7, 6, side ? 3 : 7, 1, skin.base);
    }
    if (a.hair === "curls") {
      for (const [x, y] of [
        [4, 4],
        [6, 1],
        [10, 0],
        [14, 2],
        [3, 7],
      ] as Point[]) {
        p.shape(
          [
            [x, y + 1],
            [x + 1, y],
            [x + 3, y],
            [x + 4, y + 2],
            [x + 3, y + 4],
            [x, y + 3],
          ],
          hair,
        );
        p.rect(x + 1, y + 1, 1, 1, hair.light);
      }
    }
    if (a.hair === "bob" || a.hair === "long") {
      const bottom = a.hair === "long" ? 19 : 14;
      p.shape(
        [
          [4, 5],
          [8, 6],
          [8, bottom - 1],
          [6, bottom],
          [3, bottom - 1],
          [3, 8],
        ],
        hair,
      );
      p.line([4, 7], [4, bottom - 2], hair.shade);
      if (!side) {
        p.shape(
          [
            [14, 6],
            [17, 5],
            [18, 9],
            [17, bottom],
            [14, bottom - 1],
          ],
          hair,
        );
        p.line([16, 8], [16, bottom - 3], hair.light);
      }
    }
    if (a.hair === "topknot") {
      p.shape(
        [
          [8, 2],
          [7, -1],
          [9, -3],
          [13, -2],
          [14, 1],
          [12, 3],
        ],
        hair,
      );
      p.rect(9, 1, 4, 1, a.wearing.trim);
    }
    if (back) {
      p.shape(
        [
          [5, 5],
          [15, 5],
          [17, 8],
          [15, 13],
          [11, 14],
          [6, 12],
          [4, 9],
        ],
        hair,
      );
      p.line([7, 6], [7, 10], hair.light);
      p.line([13, 7], [14, 11], hair.shade);
    }
    if (a.hair === "braid" && (back || side)) {
      const x = side ? 5 : 10;
      for (let y = 11; y < 23; y += 2) {
        p.rect(x + (y % 4 ? 0 : 1), y, 3, 2, hair.edge);
        p.rect(x + 1, y, 1, 1, hair.light);
      }
      p.rect(x, 22, 3, 1, a.wearing.trim);
    }
  }
  if (side) {
    // Ear sits between hair mass and cheek, not at the back outline.
    p.rect(9, 9, 2, 3, skin.shade);
    p.rect(10, 9, 1, 2, skin.light);
  }
  if (!back && a.beard !== "none") {
    const b = a.beard;
    // Every jaw shape is at least six pixels wide at y13, so chin-hugging
    // styles anchor there rather than to a per-jaw contour.
    const moustache = () => {
      if (side) {
        p.rect(15, 11, 3, 1, hair.shade);
        p.rect(17, 12, 1, 1, hair.edge);
      } else {
        p.rect(8, 11, 6, 1, hair.shade);
        p.rect(8, 12, 1, 1, hair.edge);
        p.rect(13, 12, 1, 1, hair.edge);
      }
    };
    if (b === "stubble")
      p.rect(
        side ? 14 : 8,
        13,
        side ? 2 : 5,
        1,
        mix(skin.base, hair.base, 0.45),
      );
    else if (b === "moustache") moustache();
    else if (b === "handlebar") {
      if (side) {
        p.rect(14, 11, 4, 1, hair.shade);
        p.rect(18, 10, 1, 1, hair.base);
      } else {
        p.rect(7, 11, 7, 1, hair.shade);
        p.rect(6, 10, 1, 1, hair.base);
        p.rect(14, 10, 1, 1, hair.base);
      }
    } else if (b === "goatee") {
      moustache();
      p.shape(
        side
          ? [
              [13, 13],
              [16, 13],
              [15, 17],
              [13, 16],
            ]
          : [
              [9, 13],
              [13, 13],
              [12, 17],
              [10, 17],
            ],
        hair,
      );
    } else if (b === "sideburns") {
      if (side) {
        p.rect(11, 7, 2, 4, hair.base);
        p.rect(11, 7, 1, 3, hair.shade);
      } else {
        p.rect(5, 8, 1, 4, hair.base);
        p.rect(15, 8, 1, 4, hair.base);
        p.rect(5, 11, 2, 1, hair.shade);
        p.rect(14, 11, 2, 1, hair.shade);
      }
    } else if (b === "chinstrap") {
      // Jawline only, no moustache, so the mouth stays legible.
      if (side) {
        p.line([10, 10], [12, 13], hair.base);
        p.rect(12, 13, 5, 1, hair.base);
        p.rect(14, 14, 2, 1, hair.shade);
      } else {
        p.line([5, 10], [8, 13], hair.base);
        p.line([15, 10], [12, 13], hair.base);
        p.rect(8, 13, 5, 1, hair.base);
        p.rect(9, 14, 3, 1, hair.shade);
      }
    } else {
      const bottom = b === "short" ? 16 : 19;
      const fork = b === "forked";
      p.shape(
        side
          ? ([
              [12, 12],
              [14, 13],
              [17, 12],
              [16, bottom - 1],
              ...(fork
                ? [
                    [15, bottom],
                    [14, bottom - 3],
                    [13, bottom],
                  ]
                : [[13, bottom]]),
              [11, 14],
            ] as Point[])
          : ([
              [6, 11],
              [8, 13],
              [13, 13],
              [15, 11],
              [15, 15],
              ...(fork
                ? [
                    [13, bottom],
                    [11, bottom - 3],
                    [9, bottom],
                  ]
                : [
                    [12, bottom],
                    [9, bottom],
                  ]),
              [6, 15],
            ] as Point[]),
        hair,
      );
      p.rect(side ? 14 : 9, 13, side ? 2 : 3, 1, skin.shade);
      p.rect(side ? 13 : 8, 14, 1, 2, hair.light);
    }
  }
  if (a.wearing.headwear === "band") {
    p.rect(4, 5, side ? 12 : 13, 1, a.wearing.trim);
    p.rect(4, 6, side ? 7 : 13, 1, mix(a.wearing.trim, "#614b43", 0.35));
  }
  if (a.wearing.headwear === "cap") {
    p.shape(
      [
        [4, 5],
        [5, 2],
        [9, 0],
        [14, 2],
        [16, 5],
        [18, 6],
        [4, 6],
      ],
      cloth,
    );
    p.line([6, 3], [12, 2], cloth.light);
  }
  if (a.wearing.headwear === "hood") {
    p.shape(
      [
        [3, 7],
        [4, 3],
        [8, 0],
        [14, 1],
        [17, 4],
        [side ? 16 : 18, 6],
        [14, 4],
        [8, 3],
        [6, 7],
        [6, 14],
        [3, 15],
      ],
      cloak,
    );
    if (!side)
      p.shape(
        [
          [15, 5],
          [18, 5],
          [18, 15],
          [15, 14],
        ],
        cloak,
      );
  }
  if (a.wearing.headwear === "wrap") {
    p.shape(
      [
        [4, 6],
        [4, 3],
        [7, 0],
        [13, 1],
        [17, 4],
        [16, 6],
      ],
      cloth,
    );
    p.line([5, 4], [14, 2], cloth.light);
    p.line([6, 5], [15, 3], a.wearing.trim);
    if (!side) p.rect(4, 6, 2, 8, cloth.shade);
  }
  if (a.wearing.earrings && !back) {
    p.rect(side ? 10 : 4, 12, 1, 2, "#dfbb70");
    if (!side) p.rect(16, 12, 1, 2, "#dfbb70");
  }
}
