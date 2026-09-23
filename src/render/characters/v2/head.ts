import type { CharacterAppearance } from "../../../core/character";
import type { CharacterPose } from "../poses";
import { mix, Pixels, ramp, type Point } from "./pixels";
export function drawHead(
  p: Pixels,
  a: CharacterAppearance,
  side: boolean,
  back: boolean,
  pose: CharacterPose,
  f: number,
  /** Lateral lag of anything hanging off the head, in pixels. */
  sway = 0,
  /** A front or back head turned a little toward +x, for the diagonals. */
  turn = false,
) {
  const skin = ramp(a.skin, "skin"),
    hair = ramp(a.hairColor, "hair"),
    cloth = ramp(a.wearing.color),
    cloak = ramp(a.wearing.cloakColor);
  const eye = mix(a.hairColor, "#2a2230", 0.75),
    // Faint glint, kept close to the iris so eyes don't read as gray.
    glint = mix(eye, skin.light, 0.3),
    frame = a.wearing.eyewear === "sunglasses" ? "#1c1a1e" : "#3a3238",
    blink = pose === "idle" && f === 3;
  const shape = a.head ?? "original",
    jaw = a.jaw ?? "original";
  const cheek =
    shape === "broad" || shape === "round" ? 1 : shape === "oval" ? -1 : 0;
  const chinY = shape === "long" ? 16 : 15;
  // Hair hides the top of the skull; bare, the flat-topped block underneath
  // read as a box. A bald head gets a dome with the same brow and cheeks.
  const bald = a.hair === "bald" && a.wearing.headwear === "none";
  if (side) {
    // Actual east profile: occiput → forehead → nose → chin → neck.
    // Nose is a 1px bump. Only soft and small jaws recede well behind it; a
    // square chin comes to within a pixel, or every profile is the same weak one.
    p.shape(
      [
        ...((bald
          ? [
              [shape === "broad" ? 3 : 4, 6],
              [6, 3],
              [9, 2],
              [13, 2],
              [15, 3],
            ]
          : [
              [shape === "broad" ? 3 : 5, 4],
              [10, shape === "long" ? 1 : 2],
              [shape === "oval" ? 14 : 15, 3],
            ]) as Point[]),
        // The forehead slopes back from the brow; a vertical wall from crown
        // to nose read as a mask.
        [16, 4],
        [16, 6],
        [17, 7],
        [17, 8],
        [18, 9],
        [18, 10],
        [16, 11],
        ...((jaw === "square"
          ? [
              [17, 12],
              [17, 14],
              [16, 15],
              [11, 15],
              [10, 13],
            ]
          : jaw === "small"
            ? [
                [15, 12],
                [13, 14],
                [11, 13],
                [10, 12],
              ]
            : jaw === "pointed"
              ? [
                  [16, 13],
                  [16, 15],
                  [14, 16],
                  [12, 14],
                  [10, 12],
                ]
              : jaw === "soft"
                ? [
                    [15, 12],
                    [15, 14],
                    [13, 16],
                    [11, 14],
                    [10, 12],
                  ]
                : [
                    [16, 13],
                    [15, chinY],
                    [10, chinY - 1],
                    [10, 12],
                  ]) as Point[]),
        [6, 12],
        [4, 9],
      ],
      skin,
    );
    p.rect(12, 6, 4, 5, skin.base);
    p.rect(16, 9, 2, 1, skin.base);
    p.rect(14, 7, 1, blink ? 1 : 2, blink ? skin.shade : eye);
    if (!blink) p.rect(14, 7, 1, 1, glint);
    p.rect(15, 7, 1, 1, skin.light);
    if (a.wearing.eyewear === "sunglasses") {
      p.rect(13, 7, 3, 2, frame);
      p.rect(11, 7, 2, 1, frame);
    } else if (a.wearing.eyewear === "glasses") {
      p.rect(13, 6, 3, 1, frame);
      p.rect(11, 7, 2, 1, frame);
    }
    p.rect(15, 11, 2, 1, skin.shade);
    p.rect(13, 13, 2, 1, skin.shade);
  } else {
    p.shape(
      [
        ...((bald
          ? [
              [5 - cheek, 5],
              [7, 3],
              [14, 3],
              [16 + cheek, 5],
            ]
          : [
              [shape === "broad" ? 5 : shape === "round" ? 7 : 6, 3],
              [shape === "broad" ? 15 : shape === "round" ? 13 : 14, 3],
            ]) as Point[]),
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
      // Turned, the features move a pixel toward the facing, the far eye
      // narrows and the far cheek falls into shade.
      const t = turn ? 1 : 0;
      // One pixel each, with skin around it: a 2px eye ran into the brow and
      // the hair and left the face without an expression.
      p.rect(8 + t, 8, 1, blink ? 1 : 2, blink ? skin.shade : eye);
      p.rect(12 + t, 8, 1, blink ? 1 : 2, blink ? skin.shade : eye);
      if (a.wearing.eyewear === "sunglasses") {
        p.rect(6 + t, 8, 4, 2, frame);
        p.rect(11 + t, 8, 4 - t, 2, frame);
        p.rect(10 + t, 8, 1, 1, frame);
        p.rect(7 + t, 8, 1, 1, "#5a5660");
      } else if (a.wearing.eyewear === "glasses") {
        // Frames only: the eyes stay readable through them.
        p.rect(6 + t, 7, 4, 1, frame);
        p.rect(11 + t, 7, 4 - t, 1, frame);
        p.rect(10 + t, 8, 1, 1, frame);
      }
      p.rect(10 + t, 10, 2, 1, skin.light);
      if (turn) p.rect(13, 10, 1, 1, skin.shade);
      p.rect(9 + t, 12, 3, 1, skin.shade);
      if (pose === "talk" && f % 2) p.rect(10 + t, 12, 2, 2, skin.edge);
      if (pose === "startle") p.rect(10 + t, 12, 2, 2, skin.edge);
      if (pose === "hurt") {
        p.rect(7 + t, 7, 2, 1, skin.shade);
        p.rect(12 + t, 7, 2 - t, 1, skin.shade);
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
    // A tuft clearing the crown and an uneven fringe. Tracing the head outline
    // is what made every style read as the same hood.
    if (a.hair !== "cropped" && a.wearing.headwear === "none")
      p.shape(
        side
          ? [
              [8, 1],
              [12, -1],
              [14, 1],
              [12, 2],
            ]
          : [
              [6, 1],
              [9, -1],
              [12, 0],
              [11, 2],
            ],
        hair,
      );
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
          [8 + sway, bottom - 1],
          [6 + sway, bottom],
          [3 + sway, bottom - 1],
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
            [17 + sway, bottom],
            [14 + sway, bottom - 1],
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
      p.line([7, 6], [8, 10], hair.light);
      p.rect(9, 6, 3, 1, hair.light);
      p.line([13, 7], [14, 11], hair.shade);
      // Nape shadow, so the head sits in front of the shoulders.
      p.rect(7, 12, 7, 1, hair.shadowEdge ?? hair.edge);
    }
    if (a.hair === "braid" && (back || side)) {
      const x = side ? 5 : 10;
      // A braid swings further the further it hangs from the nape.
      for (let y = 11; y < 23; y += 2) {
        const lag = Math.round((sway * (y - 10)) / 6);
        p.rect(x + lag + (y % 4 ? 0 : 1), y, 3, 2, hair.edge);
        p.rect(x + lag + 1, y, 1, 1, hair.light);
      }
      p.rect(x + sway * 2, 22, 3, 1, a.wearing.trim);
    }
  }
  if (bald) {
    // Sheen on the lit crown; in profile, shade under the occiput.
    p.rect(7, side ? 3 : 4, side ? 4 : 3, 1, skin.light);
    p.rect(6, side ? 4 : 5, 1, 1, skin.light);
    if (side) p.rect(5, 7, 1, 2, skin.shade);
  }
  if (side) {
    // Ear sits between hair mass and cheek, not at the back outline.
    p.rect(9, 9, 2, 3, skin.shade);
    p.rect(10, 9, 1, 2, skin.light);
  } else if (turn && !back) {
    // The near ear comes into view as the head turns.
    p.rect(5, 9, 2, 3, skin.shade);
    p.rect(6, 9, 1, 2, skin.light);
  } else if (turn) {
    // From behind, the turn shows an ear and a sliver of cheek.
    p.rect(16, 8, 1, 4, skin.base);
    p.rect(15, 9, 1, 2, skin.shade);
  }
  if (!back && a.beard !== "none") {
    const b = a.beard;
    // Every jaw shape is at least six pixels wide at y13, so chin-hugging
    // styles anchor there rather than to a per-jaw contour.
    const moustache = () => {
      if (side) {
        p.rect(14, 11, 3, 1, hair.shade);
        p.rect(16, 12, 1, 1, hair.edge);
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
        p.rect(13, 11, 4, 1, hair.shade);
        p.rect(17, 10, 1, 1, hair.base);
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
              [12, 13],
              [15, 13],
              [14, 17],
              [12, 16],
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
        p.rect(12, 13, 4, 1, hair.base);
        p.rect(13, 14, 2, 1, hair.shade);
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
              [16, 12],
              [15, bottom - 1],
              ...(fork
                ? [
                    [14, bottom],
                    [13, bottom - 3],
                    [12, bottom],
                  ]
                : [[12, bottom]]),
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
  // A stiff crown and a narrow curled brim. The brim is the whole tell at this
  // size, so it runs a pixel proud of the skull on both sides.
  if (a.wearing.headwear === "bowler") {
    const felt = ramp(a.wearing.lowerColor);
    // Tall domed crown over a brim that clears the skull by a pixel each side
    // and curls back up at the ends. Any wider and it reads as a sun hat.
    p.shape(
      [
        [6, 4],
        [7, 0],
        [13, 0],
        [14, 4],
      ],
      felt,
    );
    p.rect(5, 4, side ? 10 : 11, 1, felt.base);
    p.rect(5, 5, side ? 10 : 11, 1, felt.shade);
    p.rect(4, 4, 1, 1, felt.light);
    if (!side) p.rect(16, 4, 1, 1, felt.light);
    p.line([8, 2], [12, 1], felt.light);
    p.rect(6, 3, side ? 8 : 9, 1, a.wearing.trim);
  }
  // Soft crown pulled forward over a short stiff peak: the newsboy cap.
  if (a.wearing.headwear === "flat-cap") {
    p.shape(
      [
        [4, 5],
        [5, 2],
        [10, 1],
        [15, 2],
        [16, 5],
      ],
      cloth,
    );
    // The peak is the tell: a dark lip across the brow, wider than the crown.
    if (side) {
      p.rect(15, 5, 4, 1, cloth.shade);
      p.rect(16, 6, 3, 1, cloth.edge);
    } else {
      p.rect(4, 5, 13, 1, cloth.shade);
      p.rect(5, 6, 11, 1, cloth.edge);
    }
    p.line([6, 3], [13, 2], cloth.light);
  }
  // Tall crown, long curved peak.
  if (a.wearing.headwear === "ball-cap") {
    // Taller crown than the flat cap, a seam up the middle, and a longer peak.
    p.shape(
      [
        [5, 5],
        [5, 1],
        [10, -1],
        [15, 1],
        [15, 5],
      ],
      cloth,
    );
    if (side) {
      p.rect(15, 5, 5, 1, cloth.shade);
      p.rect(16, 6, 4, 1, cloth.edge);
    } else {
      p.rect(3, 5, 15, 1, cloth.shade);
      p.rect(4, 6, 13, 1, cloth.edge);
    }
    p.line([7, 2], [13, 1], cloth.light);
    p.rect(10, 0, 1, 5, cloth.shade);
  }
  // A wide brim, straw or felt, against sun or rain.
  if (a.wearing.headwear === "brimmed") {
    const straw = ramp(a.wearing.lowerColor);
    p.shape(
      [
        [6, 5],
        [7, 2],
        [13, 2],
        [14, 5],
      ],
      straw,
    );
    p.rect(0, 5, side ? 18 : 21, 1, straw.base);
    p.rect(0, 6, side ? 18 : 21, 1, straw.shade);
    p.rect(2, 7, side ? 15 : 17, 1, straw.edge);
    p.rect(6, 4, side ? 8 : 9, 1, a.wearing.trim);
  }
  // One woven cone. The apex is a single pixel or it reads as a dunce cap.
  if (a.wearing.headwear === "conical") {
    const straw = ramp(a.wearing.lowerColor);
    p.shape(
      [
        [10, -3],
        [16, 5],
        [4, 5],
      ],
      straw,
    );
    p.rect(3, 5, side ? 15 : 16, 2, straw.base);
    p.rect(3, 6, side ? 15 : 16, 1, straw.shade);
    p.line([10, -2], [6, 4], straw.light);
  }
  // Cloth wound in bulk: three bands, each offset, so it reads as wrapped
  // rather than as one solid dome.
  if (a.wearing.headwear === "turban") {
    p.shape(
      [
        [3, 7],
        [4, 2],
        [9, -1],
        [15, 1],
        [17, 5],
        [17, 7],
      ],
      cloth,
    );
    p.line([4, 4], [16, 3], cloth.light);
    p.line([4, 6], [17, 5], cloth.shade);
    p.line([5, 2], [13, 0], cloth.light);
    if (!side) p.rect(15, 7, 2, 4, cloth.shade);
  }
  // Over the hair and down to the shoulders. Filled, not outlined: an open
  // ring here just reads as uncovered hair.
  if (a.wearing.headwear === "headscarf") {
    p.shape(
      [
        [4, 7],
        [4, 3],
        [9, 0],
        [15, 2],
        [17, 6],
        [17, 7],
      ],
      cloth,
    );
    if (!side) {
      p.rect(3, 6, 2, 9, cloth.shade);
      p.rect(16, 6, 2, 9, cloth.shade);
      p.rect(3, 6, 1, 8, cloth.edge);
    } else p.rect(3, 6, 3, 9, cloth.shade);
    p.line([5, 4], [14, 2], cloth.light);
    p.line([5, 6], [16, 5], cloth.base);
  }
  // A short brimless cylinder with a tassel down one side.
  if (a.wearing.headwear === "fez") {
    const felt = ramp(a.wearing.trim);
    p.shape(
      [
        [6, 6],
        [6, 1],
        [14, 1],
        [14, 6],
      ],
      felt,
    );
    p.rect(6, 1, 8, 1, felt.light);
    p.rect(6, 6, side ? 8 : 9, 1, felt.shade);
    if (!side) p.rect(14, 2, 1, 5, felt.edge);
  }
  // Past the shoulder, and across the lower face on the near side. Longer and
  // more enveloping than the headscarf, which stops at the collar.
  if (a.wearing.headwear === "veil") {
    p.shape(
      [
        [3, 8],
        [4, 3],
        [9, 0],
        [15, 2],
        [17, 6],
        [17, 8],
      ],
      cloth,
    );
    if (!side) {
      p.rect(2, 7, 3, 13, cloth.shade);
      p.rect(15, 7, 3, 13, cloth.shade);
      p.rect(2, 7, 1, 12, cloth.edge);
      // A fall across the mouth, left open at the eyes.
      p.rect(5, 12, 10, 4, cloth.base);
      p.rect(5, 12, 10, 1, cloth.light);
    } else {
      p.rect(3, 7, 4, 13, cloth.shade);
      p.rect(7, 12, 8, 4, cloth.base);
    }
    p.line([5, 4], [14, 2], cloth.light);
  }
  // A ring sitting proud of the brow rather than flat on it: circlet, diadem,
  // head-ring. The gap above the hair is what separates it from a headband.
  if (a.wearing.headwear === "fillet") {
    const metal = ramp(a.wearing.trim);
    p.rect(4, 4, side ? 12 : 13, 1, metal.base);
    p.rect(4, 5, side ? 12 : 13, 1, metal.shade);
    p.rect(6, 3, side ? 8 : 9, 1, metal.light);
    // A raised centre, which is where these carry their stone or boss.
    p.rect(side ? 13 : 10, 2, 1, 2, metal.light);
  }
  // Standing above the crown. Height is the whole signal, so the quills clear
  // the skull by a good margin and splay rather than rising parallel.
  if (a.wearing.headwear === "plume") {
    const quill = ramp(a.wearing.trim);
    p.rect(4, 4, side ? 12 : 13, 2, cloth.base);
    p.rect(4, 5, side ? 12 : 13, 1, cloth.shade);
    const roots = side ? [[12, 3]] : [[7, 3], [10, 3], [13, 3]];
    roots.forEach(([x], i) => {
      const lean = i - (roots.length - 1) / 2;
      p.line([x, 3], [x + Math.round(lean * 2), -4], quill.base);
      p.rect(x + Math.round(lean * 2), -5, 1, 2, quill.light);
      p.rect(x + Math.round(lean * 1.4), -1, 1, 1, quill.shade);
    });
  }
  // Powdered, rolled at the sides, gathered behind. Pale whatever the hair is,
  // because that is the point of it.
  if (a.wearing.headwear === "wig") {
    const powder = ramp("#e8e4d8", "hair");
    p.shape(
      [
        [3, 12],
        [4, 4],
        [9, 1],
        [15, 3],
        [17, 8],
        [17, 13],
        [15, 12],
        [15, 6],
        [9, 4],
        [5, 12],
      ],
      powder,
    );
    // The side rolls, which are the whole tell at this size.
    p.rect(3, 8, 3, 2, powder.light);
    if (!side) p.rect(15, 8, 3, 2, powder.base);
    p.rect(3, 11, 3, 2, powder.base);
    if (!side) p.rect(15, 11, 3, 2, powder.shade);
    p.line([6, 3], [13, 2], powder.light);
  }
  // A hard dome with a rim standing off the skull.
  if (a.wearing.headwear === "helmet") {
    const steel = ramp(a.wearing.lowerColor);
    p.shape(
      [
        [5, 6],
        [6, 1],
        [10, 0],
        [14, 1],
        [15, 6],
      ],
      steel,
    );
    p.rect(3, 6, side ? 14 : 15, 1, steel.base);
    p.rect(3, 7, side ? 14 : 15, 1, steel.shade);
    p.line([7, 3], [12, 2], steel.light);
    if (!side) p.rect(10, 1, 1, 5, steel.light);
  }
  // A sealed bubble. Drawn as a ring, not a disc: the face has to show
  // through the glass or there is nobody in the suit. The corners are cut
  // back on both axes, or it reads as a box rather than a sphere.
  if (a.wearing.headwear === "visor") {
    const shell = ramp(a.wearing.lowerColor);
    const glass = ramp(a.wearing.trim);
    const r = side ? 16 : 18;
    // Crown, shoulders of the sphere, then the sides.
    p.rect(5, 0, r - 8, 1, shell.base);
    p.rect(3, 1, r - 4, 1, shell.base);
    p.rect(2, 2, r - 2, 1, shell.base);
    p.rect(5, 0, 3, 1, shell.light);
    p.rect(3, 1, 3, 1, shell.light);
    p.rect(1, 3, 2, 8, shell.base);
    p.rect(1, 3, 1, 6, shell.light);
    if (!side) {
      p.rect(r - 1, 3, 2, 8, shell.base);
      p.rect(r, 4, 1, 6, shell.shade);
    }
    p.rect(2, 11, r - 2, 1, shell.shade);
    p.rect(3, 12, r - 4, 1, shell.shade);
    p.rect(5, 13, r - 8, 1, shell.edge);
    // A tint at the top and bottom of the glass, thin enough to read as glass.
    p.rect(3, 3, r - 4, 1, glass.base);
    p.rect(3, 10, r - 4, 1, glass.shade);
    p.rect(3, 4, 1, 3, glass.light);
  }
  if (a.wearing.earrings && !back) {
    p.rect(side ? 10 : 4, 12, 1, 2, "#dfbb70");
    if (!side) p.rect(16, 12, 1, 2, "#dfbb70");
  }
}
