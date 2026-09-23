import type { CharacterAppearance } from "../../../core/character";
import type { CharacterPose } from "../poses";
import type { CarriedArt } from "../props";
import { drawHead } from "./head";
import { Pixels, ramp, type Point, type Ramp } from "./pixels";
import { facingView } from "../../../core/facing";
export const CHARACTER_SIZE = 80;
/** Two pixels taller than the original (31px standing body), both in the leg,
 * with 3px height steps.
 * Four-view poses are rasterized once and shared by the lab and world cache. */
export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  a: CharacterAppearance,
  direction: number,
  pose: CharacterPose,
  frame: number,
  prop?: CarriedArt,
  facing?: number,
) {
  ctx.clearRect(0, 0, 80, 80);
  ctx.imageSmoothingEnabled = false;
  // A diagonal borrows the side build and turns the head off it. `direction`
  // still decides the body, so every pose works unchanged.
  const view = facing === undefined ? undefined : facingView(facing);
  if (view) direction = view.direction;
  const quarter = view?.quarter ?? false,
    headAway = quarter && view!.away;
  // The walk and run go on eight frames; everything keyed to four sees each
  // pair as one, so only the tables below that want the in-betweens read `w`.
  const walking = pose === "walk",
    eight = walking || pose === "run",
    w = ((frame % 8) + 8) % 8;
  const f = eight ? w >> 1 : ((frame % 4) + 4) % 4,
    side = direction === 1 || direction === 3,
    back = direction === 0,
    sprint = pose === "run",
    climbing = pose === "climb",
    moving = pose === "walk" || pose === "carry" || pose === "wade" || sprint;
  const resting = pose === "idle" || pose === "breathe";
  // A single beat per cycle on idle, against breathe's two, so a standing
  // crowd is alive without every NPC panting. Costs no extra cached frames.
  const inhale =
    pose === "breathe"
      ? f === 1 || f === 2
        ? 1
        : 0
      : pose === "idle" && f === 2
        ? 1
        : 0;
  // A stoop is a body, not a pose: it walks with them.
  const stance =
    resting || (a.posture === "stooped" && !sprint)
      ? (a.posture ?? "upright")
      : "upright";
  const burden = !!prop && (prop.width > 24 || prop.height > 28);
  const lean = sprint
    ? side
      ? 1
      : 0
    : stance === "relaxed"
      ? 1
      : stance === "stooped"
        ? 2
        : burden
          ? -1
          : 0;
  const strides = moving
      ? pose === "wade"
        ? [0, 2, 0, -2]
        : sprint
          ? [0, 5, 0, -5]
          : [0, 3, 0, -3]
      : [0, 0, 0, 0],
    // Pass, up, contact, down: the legs close again as the body passes over.
    stride = walking ? [0, 2, 3, 2, 0, -2, -3, -2][w] : strides[f],
    // One frame behind the legs: cloth follows the body, it does not snap with
    // it. A runner's cloth streams behind instead of swinging.
    trail = sprint && side ? -1 : Math.sign(strides[(f + 3) % 4]),
    // How far it follows. A single pixel of hem was invisible at this size.
    drift = sprint && side ? -2 - (f % 2) : trail * (sprint ? 3 : 2),
    // Highest just after passing, lowest just after contact.
    bob = walking
      ? [0, -1, 0, 1, 0, -1, 0, 1][w]
      : moving && pose !== "wade" && f % 2
        ? 1
        : 0,
    // Head-on, a run is a side-to-side roll over the planted foot.
    shift =
      pose === "sway"
        ? [-1, 0, 1, 0][f]
        : sprint && !side
          ? [1, 0, -1, 0][f]
          : // A heavy body rolls over each planted foot.
            moving && !side && a.build >= 1 && pose !== "wade"
            ? [1, 0, -1, 0][f]
            : 0;
  // Crouch, stretch off the ground, hang at the apex, reach for the ground.
  const airborne = pose === "jump",
    landing = pose === "land",
    kick = pose === "kick",
    hanging = pose === "hang",
    stumble = pose === "stumble",
    roll = pose === "roll",
    skid = pose === "skid";
  const tuck = airborne ? [0, 2, 5, 1][f] : 0;
  // Knees bent deep enough that they have to go somewhere.
  const crouched =
    (airborne && f === 0) ||
    (landing && f < 3) ||
    (stumble && f === 0) ||
    (hanging && f === 3) ||
    roll;
  // Cloth lifts at the top of a jump.
  const float = airborne ? [0, 0, 2, 1][f] : 0;
  // A run compresses into the contact frame and extends off it. `bend` drops
  // the head while the feet stay planted, so it is already the squash.
  const extend = sprint && (w % 4 === 0 || w % 4 === 3) ? 1 : 0,
    squat = sprint && w % 4 === 2 ? 1 : 0;
  const bend =
    (stance === "stooped" ? 2 : burden ? 1 : 0) +
    (airborne
      ? [4, -1, 0, 0][f]
      : landing
        ? [6, 5, 2, 0][f]
        : kick
          ? [-1, 3, -1, 2][f]
          : hanging
            ? [0, 0, 2, 5][f]
            : stumble
              ? [6, 4, 2, 1][f]
              : roll
                ? [8, 8, 8, 5][f]
                : skid
                  ? [1, 2, 2, 1][f]
                  : pose === "sit" || pose === "kneel"
                    ? 6
                    : pose === "stoop"
                      ? [2, 4, 6, 4][f]
                      : pose === "tug"
                        ? [0, 0, 2, 3][f]
                        : pose === "pickup" || pose === "drop"
                          ? [-1, 3, 6, 2][f]
                          : pose === "work"
                            ? [0, 0, 4, 2][f]
                            : pose === "chop"
                              ? [0, -1, 4, 2][f]
                              : pose === "dig"
                                ? [2, 1, 5, 4][f]
                                : pose === "reap"
                                  ? [2, 1, 3, 3][f]
                                  : pose === "hurt"
                                    ? [0, 2, 3, 1][f]
                                    : climbing
                                      ? [3, 4, 3, 4][f]
                                      : 0) -
    extend;
  // Two pixels of chest, above the belt rather than below it. `tall` lifts the
  // whole figure and `torso` pushes the waist back down by the same amount, so
  // the hips, legs and feet land exactly where they did and only the run from
  // shoulder to waist grows — room for a collar and a neckline, which the
  // wardrobe had nowhere to put.
  const CHEST = 2;
  const tall = a.height * 3 + CHEST,
    torso = a.height * 2 + CHEST,
    wide = Math.max(0, a.build) + squat,
    // The smallest body loses a pixel each side too, or it reads as a short adult.
    small = a.height <= -2 ? 1 : 0,
    narrow = (a.build === -1 ? 1 : 0) + small,
    feet = 35 + tall - bend - bob;
  // `flat` is a true profile. A diagonal is drawn with the front view's
  // detail, moved a pixel toward the way it faces, and none of it when the
  // figure is walking away.
  const flat = side && !quarter,
    rear = back || headAway;
  // A profile is two thirds of the front width: 8px against 12. Build goes on
  // the front first; only the heaviest adds a pixel behind. A diagonal sits
  // between the two at 10px.
  const left = quarter
      ? 7 - (wide > 1 ? 1 : 0) + small
      : side
        ? 8 - (wide > 1 ? 1 : 0) + small
        : 4 - wide + small,
    right = (quarter ? 17 : 16) + wide - narrow,
    centre = quarter ? Math.round((left + right) / 2) + 1 : 10;
  // Shoulders and head carried forward of the hips: a runner, a crouch, a landing.
  const pitch = side
    ? sprint
      ? 1
      : airborne
        ? [2, 0, 0, 0][f]
        : landing
          ? [2, 2, 1, 0][f]
          : kick
            ? [1, 0, -1, 0][f]
            : hanging
              ? [0, 0, 1, 2][f]
              : stumble
                ? [3, 3, 2, 1][f]
                : roll
                  ? 2
                  : skid
                    ? [-1, -2, -2, -1][f]
                    : 0
    : 0;
  const skin = ramp(a.skin, "skin"),
    cloth = ramp(a.wearing.color),
    lower = ramp(a.wearing.lowerColor),
    cloak = ramp(a.wearing.cloakColor),
    leather = ramp("#72503b"),
    sneaker = ramp("#d9d5cc"),
    trimTone = ramp(a.wearing.trim),
    iron = ramp("#8b929a"),
    wood = ramp("#ae7e49");
  ctx.save();
  ctx.translate(30 + shift, 44 - tall + bend + bob);
  if (direction === 3) {
    ctx.translate(20, 0);
    ctx.scale(-1, 1);
  }
  const p = new Pixels(ctx);
  // Mirroring the raster would mirror the sun with it, so walking west would
  // relight the whole figure. Shading is resolved in screen space instead.
  p.flip = direction === 3;
  // A roll is one tucked drawing turned a quarter at a time, which pixels
  // survive exactly. Lying on its side the ball is lower, so it is set down.
  if (roll && side && f < 3) {
    const cy = Math.round((feet + 2) / 2);
    ctx.translate(11, cy + (f === 1 ? 0 : Math.round((feet - 14) / 2)));
    ctx.rotate(((f + 1) * Math.PI) / 2);
    ctx.translate(-11, -cy);
  }
  // A bare chest has bare arms, whatever the record's sleeve field says.
  const sleeves =
    a.wearing.garment === "none" ||
    a.wearing.garment === "loincloth" ||
    a.wearing.garment === "poncho"
      ? ("none" as const)
      : (a.wearing.sleeves ??
        (a.wearing.garment === "wrap"
          ? "none"
          : ["coat", "shirt", "robe"].includes(a.wearing.garment)
            ? "long"
            : "short"));
  const armSwing = walking
    ? (quarter ? [0, 1, 2, 1, 0, -1, -2, -1] : [0, 2, 3, 2, 0, -2, -3, -2])[w]
    : moving
      ? (sprint ? [0, 4, 0, -4] : quarter ? [0, 2, 0, -2] : [0, 3, 0, -3])[f]
      : 0;
  // Shoulders counter the hips. Head-on the one over the swinging leg rises a
  // pixel; in profile each shoulder follows its arm forward or back.
  const tilt = walking
      ? [-1, -1, 0, 0, 1, 1, 0, 0][w]
      : sprint
        ? [0, 1, 1, 0, 0, -1, -1, 0][w]
        : 0,
    turn = eight && Math.abs(armSwing) > 1 ? Math.sign(armSwing) : 0;
  // The profile hangs its arms from the middle of a 7px torso.
  // On a diagonal the near arm hangs over the near edge of the chest and the
  // far shoulder shows past the other.
  const shoulderNear: Point = quarter
      ? [left + 2 + pitch - turn, 15 - inhale]
      : side
        ? [12 + pitch - turn, 15 - inhale]
        : [16 + wide - narrow, 15 - inhale + tilt],
    shoulderFar: Point = quarter
      ? [right - 1 + pitch + turn, 15 - inhale]
      : side
        ? [14 - narrow + pitch + turn, 15 - inhale]
        : [4 - wide + small, 15 - inhale - tilt];
  // Two pixels below the belt: clear of the waist, where hands at 22 read as
  // arms folded on the stomach, but well short of the knee.
  const hang = (sprint ? 20 : 24) + torso;
  let near: Point = side
      ? [
          shoulderNear[0] - pitch - armSwing,
          hang - (armSwing < 0 ? 2 : armSwing > 0 ? 1 : 0),
        ]
      : [
          16 + wide - narrow - (stride < 0 ? 1 : 0),
          hang + Math.round(stride / 3),
        ],
    far: Point = side
      ? [
          shoulderFar[0] - pitch + armSwing,
          hang - (armSwing > 0 ? 2 : armSwing < 0 ? 1 : 0),
        ]
      : [
          4 - wide + small + (stride > 0 ? 1 : 0),
          hang - Math.round(stride / 3),
        ];
  if (pose === "talk") near = [side ? 17 : 19 + wide, [20, 15, 13, 18][f]];
  if (pose === "point" || pose === "beckon")
    near = [pose === "beckon" ? [22, 25, 20, 17][f] : 25, 16];
  if (pose === "shrug" || pose === "startle") {
    near = [21 + wide, pose === "startle" ? 9 : 15];
    far = [side ? 4 : 0 - wide, pose === "startle" ? 9 : 15];
  }
  if (pose === "swing")
    near = (
      [
        [17, 9],
        [12, 3],
        [25, 20],
        [18, 22],
      ] as Point[]
    )[f];
  // Work stays below the shoulder and close to the body; swing is for axes.
  if (pose === "work")
    near = (
      [
        [15 + wide, 18],
        [16 + wide, 16],
        [17 + wide, 20],
        [16 + wide, 19],
      ] as Point[]
    )[f];
  // An axe is taken past the shoulder and brought down in front of the feet.
  if (pose === "chop")
    near = (
      [
        [16 + wide, 12],
        [12 + wide, 4],
        [22 + wide, 24],
        [19 + wide, 20],
      ] as Point[]
    )[f];
  // A spade is driven down close to the body, then levered back.
  if (pose === "dig") {
    near = (
      [
        [17 + wide, 16],
        [17 + wide, 12],
        [19 + wide, 24 + torso],
        [16 + wide, 20 + torso],
      ] as Point[]
    )[f];
    far = [side ? 12 : 5 - wide, near[1] - 3];
  }
  // A scythe sweeps across the body at shin height.
  if (pose === "reap") {
    near = (
      [
        [side ? 6 : 8 - wide, 18 + torso],
        [side ? 9 : 11 - wide, 20 + torso],
        [side ? 19 : 20 + wide, 21 + torso],
        [side ? 22 : 23 + wide, 19 + torso],
      ] as Point[]
    )[f];
    far = [side ? 12 : 6 - wide, 19 + torso];
  }
  if (pose === "stoop") {
    near = [side ? 15 : 13 + wide, 25 + torso - bend + [0, 1, 1, 0][f]];
    far = [side ? 13 : 8 - wide, near[1]];
  }
  if (pose === "kneel") {
    near = [side ? 17 : 15 + wide, 23 + torso - bend + [0, 1, 0, 1][f]];
    far = [side ? 13 : 6 - wide, 23 + torso - bend];
  }
  if (pose === "tug") {
    near = [side ? 16 : 11, 20 + torso - [-1, 0, 2, 3][f]];
    far = [side ? 14 : 9, near[1]];
  }
  if (pose === "lift")
    near = [side ? 16 : 15 + wide, 21 + torso - [0, 3, 5, 2][f]];
  if (pose === "thrust")
    near = (
      [
        [16, 18],
        [12, 18],
        [26, 18],
        [19, 18],
      ] as Point[]
    )[f];
  // The hand lifts before it goes down, the way a real reach starts.
  if (pose === "pickup" || pose === "drop") near = [19, [20, 24, 25, 22][f]];
  if (pose === "hurt") near = [12, 18];
  if (climbing) {
    // Hand over hand, reaching past the head. Anything at shoulder height
    // reads as standing with the arms out rather than as holding on.
    near = [side ? 17 : 17 + wide, [4, 8, 9, 5][f]];
    far = [side ? 13 : 2 - wide, [9, 5, 4, 8][f]];
  }
  // Explicit elbows, for arms that are bent on purpose. Without one the elbow
  // is the midpoint, which is a straight arm.
  let nearElbow: Point | undefined, farElbow: Point | undefined;
  const bent = (s: Point, elbow: Point, hand: Point): [Point, Point] => [
    [s[0] + elbow[0], s[1] + elbow[1]],
    [s[0] + hand[0], s[1] + hand[1]],
  ];
  if (sprint) {
    if (side) {
      // Elbows locked near a right angle and swung from the shoulder: hand to
      // the chest in front, elbow high behind. Opposite the legs.
      const pump = (s: Point, phase: number) =>
        bent(
          s,
          ...(
            [
              [
                [-3, 3],
                [-2, 7],
              ],
              [
                [-2, 4],
                [0, 7],
              ],
              [
                [-1, 4],
                [2, 5],
              ],
              [
                [1, 4],
                [4, 3],
              ],
              [
                [2, 4],
                [5, 1],
              ],
            ] as [Point, Point][]
          )[phase],
        );
      [nearElbow, near] = pump(shoulderNear, [0, 1, 2, 3, 4, 3, 2, 1][w]);
      [farElbow, far] = pump(shoulderFar, [4, 3, 2, 1, 0, 1, 2, 3][w]);
    } else {
      // Head-on the pump is a hand coming up to the chest and dropping to the hip.
      const pump = (s: Point, out: number, phase: number) =>
        phase === 0
          ? bent(s, [out * 2, 5], [-out * 2, 2])
          : phase === 2
            ? bent(s, [out, 4], [0, 8])
            : bent(s, [out, 4], [0, 6]);
      [nearElbow, near] = pump(shoulderNear, 1, [0, 1, 2, 1][f]);
      [farElbow, far] = pump(shoulderFar, -1, [2, 1, 0, 1][f]);
    }
  }
  if (walking && side && !prop) {
    // Swung forward, the forearm leads the upper arm and the hand comes up;
    // swung back, the arm hangs straight. Hanging, it is barely bent.
    const swing = (s: Point, hand: Point, ahead: number): [Point, Point] =>
      ahead > 0
        ? [
            [s[0] + (ahead > 1 ? 1 : 0), s[1] + 4],
            // Two pixels clear of the line, or the hand stays inside the chest.
            [hand[0] + (ahead > 1 ? 2 : 1), hand[1] - (ahead > 2 ? 2 : 1)],
          ]
        : ahead < 0
          ? [[Math.round((s[0] + hand[0]) / 2), s[1] + 4], hand]
          : [
              [s[0], s[1] + 4],
              [hand[0] + 1, hand[1]],
            ];
    [nearElbow, near] = swing(shoulderNear, near, -armSwing);
    [farElbow, far] = swing(shoulderFar, far, armSwing);
  }
  if (airborne) {
    if (side) {
      // Wound back, thrown up, level at the apex, out for balance. A raised
      // hand has to clear the face, or the head hides it.
      const arms: [Point, Point][] = [
        [
          [-3, 3],
          [-5, 6 + torso],
        ],
        [
          [4, -2],
          [7, -8],
        ],
        [
          [3, 2],
          [6, 0],
        ],
        [
          [4, 1],
          [7, -2],
        ],
      ];
      [nearElbow, near] = bent(shoulderNear, ...arms[f]);
      [farElbow, far] =
        f === 3
          ? bent(shoulderFar, [-5, 1], [-9, 2])
          : bent(shoulderFar, ...arms[f]);
    } else {
      near = (
        [
          [11 + wide, 24 + torso],
          [16 + wide, 11],
          [21 + wide, 13],
          [20 + wide, 12],
        ] as Point[]
      )[f];
      far = (
        [
          [6 - wide, 24 + torso],
          [2 - wide, 12],
          [-1 - wide, 14],
          [0 - wide, 12],
        ] as Point[]
      )[f];
    }
  }
  if (side && (kick || hanging || stumble || roll || skid)) {
    type Arm = [Point, Point];
    // [elbow, hand] from the shoulder, near then far.
    const arms: [Arm, Arm] | undefined = kick
      ? (
          [
            [
              [
                [-3, 3],
                [-2, 7],
              ],
              [
                [2, 4],
                [5, 1],
              ],
            ],
            [
              [
                [2, 4],
                [5, 2],
              ],
              [
                [2, 3],
                [5, 0],
              ],
            ],
            [
              [
                [-3, 1],
                [-6, -2],
              ],
              [
                [-3, 2],
                [-6, 0],
              ],
            ],
            [
              [
                [4, -1],
                [5, -6],
              ],
              [
                [4, -2],
                [5, -8],
              ],
            ],
          ] as [Arm, Arm][]
        )[f]
      : hanging
        ? (
            [
              [
                [
                  [4, -3],
                  [5, -9],
                ],
                [
                  [4, -3],
                  [5, -9],
                ],
              ],
              [
                [
                  [4, -3],
                  [5, -9],
                ],
                [
                  [4, -3],
                  [5, -9],
                ],
              ],
              [
                [
                  [4, 1],
                  [5, -4],
                ],
                [
                  [4, 1],
                  [5, -4],
                ],
              ],
              [
                [
                  [2, 4],
                  [5, 7],
                ],
                [
                  [2, 4],
                  [5, 7],
                ],
              ],
            ] as [Arm, Arm][]
          )[f]
        : stumble
          ? (
              [
                [
                  [
                    [3, 3],
                    [7, 6],
                  ],
                  [
                    [3, 3],
                    [7, 6],
                  ],
                ],
                [
                  [
                    [3, 2],
                    [6, 1],
                  ],
                  [
                    [-3, 1],
                    [-6, -1],
                  ],
                ],
                [
                  [
                    [-3, 2],
                    [-5, 1],
                  ],
                  [
                    [3, 3],
                    [6, 3],
                  ],
                ],
                undefined,
              ] as ([Arm, Arm] | undefined)[]
            )[f]
          : roll
            ? [
                [
                  [3, 4],
                  [4, 8],
                ],
                [
                  [3, 4],
                  [4, 8],
                ],
              ]
            : [
                [
                  [2, 4],
                  [5, 3],
                ],
                [
                  [-3, 3],
                  [-6, 2],
                ],
              ];
    if (arms) {
      [nearElbow, near] = bent(shoulderNear, ...arms[0]);
      [farElbow, far] = bent(shoulderFar, ...arms[1]);
    }
  } else if (kick || hanging) {
    // Head-on, both hands are up on the face of it.
    const up = hanging ? [4, 4, 8, 20 + torso][f] : [14, 6, 12, 5][f];
    near = [17 + wide, up];
    far = [2 - wide, up];
  } else if (stumble || skid) {
    const out = stumble ? [4, 4, 2, 0][f] : 3;
    near = [16 + wide + out, 20 + torso];
    far = [4 - wide - out, 20 + torso];
  }
  if (landing && f < 3) {
    if (side) {
      // Hands thrown forward and down to catch the weight.
      const reach: [Point, Point] = [
        [2, 4],
        [
          [5, 7],
          [5, 8],
          [3, 8],
        ][f] as Point,
      ];
      [nearElbow, near] = bent(shoulderNear, ...reach);
      [farElbow, far] = bent(shoulderFar, ...reach);
    } else {
      const out = [3, 3, 1][f];
      near = [16 + wide + out, 21 + torso];
      far = [4 - wide - out, 21 + torso];
    }
  }
  if (pose === "give") {
    near = [side ? 19 : 16 + wide, 21 + torso - [-1, 2, 3, 0][f]];
    far = [side ? 16 : 4 - wide, near[1]];
  }
  // A pitchfork, rake, scythe or navvy's shovel is carried across the body in
  // two hands, the head out in front and low, not stood on end like a staff.
  // The art for these is a whole tool standing in a yard, twice the height of
  // the person holding it, so the carried version is drawn here at body scale.
  const haftVector: Point | undefined =
    prop?.kind === "haft"
      ? ((
          {
            till: [
              [13, -3],
              [11, -8],
              [18, 10],
              [16, 6],
            ],
            dig: [
              [9, -7],
              [7, -11],
              [11, 12],
              [11, 8],
            ],
            reap: [
              [-11, 7],
              [-5, 11],
              [9, 12],
              [15, 7],
            ],
            chop: [
              [6, -14],
              [2, -17],
              [15, 8],
              [14, 3],
            ],
            swing: [
              [6, -14],
              [2, -17],
              [15, 8],
              [14, 3],
            ],
          } as Record<string, Point[]>
        )[pose]?.[f] ?? [15, 5 + (moving && f % 2 ? -1 : 0)])
      : undefined;
  if (haftVector) {
    // Both hands on the shaft: the forward one where the work is, the other a
    // little behind it and higher, as anyone holding a long handle does.
    near = [
      15 + wide + Math.round(haftVector[0] / 6),
      20 + torso + Math.round(haftVector[1] / 4),
    ];
    far = [
      near[0] - Math.round(haftVector[0] * 0.42) - 2,
      near[1] - Math.round(haftVector[1] * 0.42),
    ];
  }
  if (
    prop?.kind === "tool" &&
    !["chop", "dig", "reap", "swing", "thrust"].includes(pose)
  )
    near = [17 + wide, 20 + torso + (moving && f % 2 ? -1 : 0)];
  if (prop?.kind === "stick" && !["swing", "thrust"].includes(pose))
    near = [18 + wide, 21 + torso + (moving && f % 2 ? -1 : 0)];
  if (prop?.kind === "side")
    near = [
      side ? 15 : 17 + wide,
      21 + torso + (moving ? Math.round(stride / 3) : 0),
    ];
  if (prop?.kind === "side")
    near[1] = Math.min(near[1], feet - prop.height + 2);
  // A hand that is holding something goes where the thing is.
  if (prop) nearElbow = undefined;
  if (prop?.kind === "both" || haftVector) farElbow = undefined;
  let propX = 0,
    propY = 0;
  if (prop?.kind === "both") {
    propX = Math.round((side ? 19 : back ? 13 : 10) - prop.width / 2);
    propY = 23 + torso - prop.height - (pose === "give" ? [0, 2, 3, 0][f] : 0);
    far = [propX, propY + prop.height - 2];
    near = [propX + prop.width - 2, propY + prop.height - 2];
  }
  const drawProp = () => {
    if (!prop) return;
    if (prop.kind === "haft" && haftVector) {
      const v = haftVector;
      const length = Math.hypot(v[0], v[1]) || 1;
      // Along the shaft, and across it.
      const ux = v[0] / length,
        uy = v[1] / length,
        nx = -uy,
        ny = ux;
      const at = (d: number, across: number): Point => [
        near[0] + v[0] + ux * d + nx * across,
        near[1] + v[1] + uy * d + ny * across,
      ];
      const butt: Point = [
        near[0] - Math.round(v[0] * 0.75),
        near[1] - Math.round(v[1] * 0.75),
      ];
      p.limb([butt, at(0, 0)], 2, wood);
      const head = /spear/.test(prop.sprite)
        ? "point"
        : /pitchfork/.test(prop.sprite)
          ? "fork"
          : /rake/.test(prop.sprite)
            ? "rake"
            : /scythe/.test(prop.sprite)
              ? "blade"
              : "blade-square";
      if (head === "point") {
        // A leaf blade, in line with the shaft.
        p.limb([at(0, 0), at(5, 0)], 2, iron);
        p.rect(at(6, 0)[0], at(6, 0)[1], 1, 1, iron.light);
      } else if (head === "fork")
        for (const k of [-1, 0, 1]) {
          p.line(at(0, k * 2), at(5, k * 3), iron.base);
          p.rect(at(5, k * 3)[0], at(5, k * 3)[1], 1, 1, iron.light);
        }
      else if (head === "rake") {
        p.limb([at(0, -4), at(0, 4)], 2, wood);
        for (const k of [-3, -1, 1, 3]) p.line(at(0, k), at(3, k), iron.base);
      } else if (head === "blade")
        // A scythe blade: off the heel of the shaft, curving away from it.
        p.limb([at(0, 0), at(4, -5), at(2, -10)], 1, iron);
      else {
        // A shovel blade: a flat pan on the end of the handle.
        p.limb([at(1, -2), at(1, 2)], 2, iron);
        p.limb([at(4, -2), at(4, 2)], 2, iron);
        p.rect(at(3, 0)[0], at(3, 0)[1], 1, 1, iron.light);
      }
      return;
    }
    if (prop.kind === "stick") {
      const v: Point =
        pose === "swing"
          ? (
              [
                [3, -18],
                [-8, -17],
                [18, 4],
                [9, -11],
              ] as Point[]
            )[f]
          : pose === "thrust"
            ? [19, 0]
            : [7, -18];
      const bottom: Point = [
          near[0] - Math.round(v[0] / 5),
          near[1] - Math.round(v[1] / 5),
        ],
        tip: Point = [near[0] + v[0], near[1] + v[1]];
      p.limb([bottom, tip], 2, wood);
      p.line([bottom[0] + 1, bottom[1]], [tip[0] + 1, tip[1]], wood.base);
      const branch: Point = [
        near[0] + Math.round(v[0] * 0.55),
        near[1] + Math.round(v[1] * 0.55),
      ];
      p.line(branch, [branch[0] + 3, branch[1] - 1], wood.shade);
      p.rect(tip[0], tip[1], 1, 1, wood.light);
    } else if (prop.kind === "tool") {
      // A spade hangs blade-down from a grip at the top of its art; an axe or
      // sickle is held at the butt of a haft that runs up to the right.
      const hangs = prop.sprite.includes("-spade-");
      const angle =
        (
          (hangs
            ? {
                dig: [-30, -50, 25, 5],
                swing: [-30, -50, 25, 5],
                thrust: [15, 15, 15, 15],
              }
            : {
                chop: [-35, -75, 55, 15],
                dig: [-15, -30, 60, 35],
                reap: [45, 10, -35, -10],
                swing: [-35, -75, 55, 15],
                thrust: [20, 20, 20, 20],
              }) as Record<string, number[]>
        )[pose]?.[f] ?? 0;
      ctx.save();
      ctx.translate(near[0], near[1] + 1);
      ctx.rotate((angle * Math.PI) / 180);
      if (hangs) ctx.drawImage(prop.image, -Math.round(prop.width / 2), -2);
      else ctx.drawImage(prop.image, -2, -prop.height + 2);
      ctx.restore();
    } else
      ctx.drawImage(
        prop.image,
        prop.kind === "both" ? propX : near[0] - 2,
        prop.kind === "both" ? propY : near[1] - 2,
      );
  };
  const armGeometry = (shoulder: Point, hand: Point, given?: Point) => {
    const elbow: Point = given ?? [
      Math.round((shoulder[0] + hand[0]) / 2) +
        (hand[1] < 17 ? (side ? -1 : 1) : 0),
      hand[1] < 17
        ? 18
        : Math.round((shoulder[1] + hand[1]) / 2) +
          (hand[0] > shoulder[0] + 2 ? 1 : 0),
    ];
    const long = sleeves === "long" || sleeves === "loose";
    const cuff: Point = long
      ? [
          Math.round((elbow[0] + hand[0]) / 2),
          Math.round((elbow[1] + hand[1]) / 2),
        ]
      : [
          Math.round((shoulder[0] * 2 + elbow[0]) / 3),
          Math.round((shoulder[1] * 2 + elbow[1]) / 3),
        ];
    return {
      shoulder,
      elbow,
      cuff,
      hand,
      sleeve: long ? [shoulder, elbow, cuff] : [shoulder, cuff],
    };
  };
  const nearArm = armGeometry(shoulderNear, near, nearElbow),
    farArm = armGeometry(shoulderFar, far, farElbow);
  const forearm = (arm: ReturnType<typeof armGeometry>, isFar: boolean) => {
    const material: Ramp = isFar
      ? { ...skin, base: skin.shade, light: skin.base }
      : skin;
    const bare = sleeves === "none";
    p.ribbon(
      bare
        ? [arm.shoulder, arm.elbow, arm.hand]
        : sleeves === "short"
          ? [arm.cuff, arm.elbow, arm.hand]
          : [arm.cuff, arm.hand],
      3,
      material,
    );
    // Narrower than the forearm so a hanging arm tapers into a hand instead of
    // ending in a mitten. Two values only; the ribbon already carries the form.
    p.rect(arm.hand[0] - 1, arm.hand[1], 2, 2, material.base);
    p.rect(arm.hand[0] - 1, arm.hand[1], 1, 1, material.light);
    p.rect(arm.hand[0], arm.hand[1] + 1, 1, 1, material.shade);
  };
  if (back) drawProp();
  // Far arm and far leg precede the torso, as in a hand-drawn side-view sheet.
  if (side) {
    ctx.save();
    ctx.translate(lean, 0);
    forearm(farArm, true);
    ctx.restore();
  }
  const leg = (isFar: boolean) => {
    const x = side
        ? isFar
          ? 12
          : quarter
            ? 10
            : 11
        : isFar
          ? 6 - wide + small
          : 13 + wide - narrow,
      // Front and back used to hold both feet still and only lift one 2px.
      // A pixel of scissor either side is enough to read as a stride head-on.
      // The hips sit a pixel apart, so the leg that has to cross the other
      // reaches a pixel further, or one contact frame is narrower than the other.
      // A diagonal stride is foreshortened to two thirds.
      walk = quarter
        ? (isFar ? -1 : 1) * (stride > 0 ? 3 : stride < 0 ? -1 : 0)
        : side
          ? isFar
            ? -stride - (stride > 0 ? 1 : 0)
            : stride + (stride > 0 ? 1 : 0)
          : Math.sign(isFar ? -stride : stride);
    // Lifted on the passing frames, planted on the contact frames. It used to
    // be the other way round, which left both feet flat at mid-stride and made
    // the two passing frames identical drawings.
    const lift =
      (sprint
        ? // Head-on, a knee driven up is a leg drawn short.
          [5, 2, 1, 0][(f + (isFar ? 2 : 0)) % 4]
        : walking
          ? (isFar ? w === 4 || w === 5 : w === 0 || w === 1)
            ? w % 2
              ? 1
              : side
                ? 3
                : 2
            : side && walk < 0
              ? 1
              : 0
          : moving
            ? (isFar && f === 2) || (!isFar && f === 0)
              ? side
                ? 3
                : 2
              : // The trailing foot of a contact frame is up on its toe.
                side && walk < 0
                ? 1
                : 0
            : 0) +
      // The far foot of a diagonal stands further up the screen, and so does
      // whichever foot is stepping away from the viewer.
      (quarter ? (isFar ? 1 : 0) + (headAway && walk > 0 ? 1 : 0) : 0) +
      // Climbing alternates a foothold: one foot stays planted on the face
      // while the other reaches for the next hold.
      (climbing ? ((isFar ? f % 2 : (f + 1) % 2) ? 4 : 0) : 0);
    // The trailing leg tucks a pixel less, so the pair reads as a stride in air.
    const raise = tuck && isFar ? tuck - 1 : tuck;
    let ankle: Point = [x + walk, feet - 2 - lift - raise];
    const hip: Point = [x, 22 + torso];
    let knee: Point = [
      x +
        Math.round(walk * 0.5) +
        (side && raise ? 2 : 0) +
        (side && moving && lift && !climbing ? 1 : 0) +
        // Knees out to the sides: a climber straddling the face, or a crouch
        // seen head-on.
        (climbing || (crouched && !side) ? (isFar ? -2 : 2) : 0),
      Math.round((hip[1] + ankle[1]) / 2),
    ];
    // In profile a run, a jump and a landing are posed joint by joint, as
    // offsets from the hip. `ground` is how far below it the ankle stands.
    let toeDown = false;
    if (
      side &&
      (sprint || airborne || crouched || kick || hanging || stumble || skid)
    ) {
      const ground = feet - 2 - hip[1];
      const scale = (v: number) => Math.round((v * (11 + a.height)) / 11);
      let k: Point = [knee[0] - hip[0], knee[1] - hip[1]],
        n: Point = [ankle[0] - hip[0], ankle[1] - hip[1]];
      if (sprint) {
        // Reach, contact, settle, push, toe-off, heel kick, knee drive, knee
        // high. The feet are half a cycle apart, so frames 0 and 4 are flight.
        const phase = (w + (isFar ? 4 : 0)) % 8;
        [k, n] = (
          [
            [
              [4, scale(4)],
              [6, ground - 3],
            ],
            [
              [3, scale(5)],
              [3, ground],
            ],
            [
              [1, scale(5)],
              [-1, ground],
            ],
            [
              [-1, scale(5)],
              [-4, ground - 1],
            ],
            [
              [-2, scale(5)],
              [-6, ground - 4],
            ],
            [
              [-1, scale(5)],
              [-5, scale(6)],
            ],
            [
              [3, scale(4)],
              [-1, ground - 5],
            ],
            [
              [5, scale(3)],
              [2, ground - 4],
            ],
          ] as [Point, Point][]
        )[phase];
        toeDown = phase > 2;
      } else if (crouched) {
        k = [ground < 8 ? 3 : 2, Math.round(ground * 0.45)];
        n = [isFar ? 0 : -1, ground];
      } else if (kick) {
        // One foot goes up onto the wall, plants, and drives off it.
        [k, n] = (
          isFar
            ? [
                [
                  [-1, 5],
                  [-3, ground - 2],
                ],
                [
                  [3, 3],
                  [4, 7],
                ],
                [
                  [1, 5],
                  [0, ground - 2],
                ],
                [
                  [1, 5],
                  [1, ground - 1],
                ],
              ]
            : [
                [
                  [4, 3],
                  [6, 5],
                ],
                [
                  [4, 1],
                  [6, 3],
                ],
                [
                  [3, 4],
                  [6, 8],
                ],
                [
                  [1, 5],
                  [2, ground - 1],
                ],
              ]
        )[f] as [Point, Point];
        toeDown = isFar ? f !== 1 : f === 3;
      } else if (hanging) {
        // Dead weight, then a knee over the edge.
        [k, n] =
          f === 2 && !isFar
            ? [
                [4, 2],
                [5, 6],
              ]
            : [
                [f === 1 ? -1 : 0, 5],
                [f === 1 ? -2 : 0, ground - 2],
              ];
        toeDown = true;
      } else if (stumble || skid) {
        // One leg thrown out ahead to catch the weight, the other behind it.
        const lead = skid ? !isFar : (f === 1) === !isFar;
        // The last stumble frame is back on its own legs.
        if (skid || f < 3) {
          [k, n] = lead
            ? [
                [skid ? 3 : 4, skid ? 5 : 3],
                [skid ? 6 : 5, ground],
              ]
            : skid
              ? [
                  [1, 4],
                  [-1, ground],
                ]
              : [
                  [-1, 4],
                  [-4, ground - 1],
                ];
          toeDown = !lead && !skid;
        }
      } else if (f === 1) {
        // Off the toes.
        k = [0, scale(6)];
        n = [-1, ground - 2];
        toeDown = true;
      } else if (f === 2) {
        k = isFar ? [3, scale(4)] : [4, scale(3)];
        n = isFar ? [0, scale(8)] : [2, scale(7)];
        toeDown = isFar;
      } else {
        // Legs coming back down, feet ahead of the hips.
        k = [2, scale(5)];
        n = [isFar ? 1 : 3, ground - 1];
      }
      knee = [hip[0] + k[0], hip[1] + k[1]];
      ankle = [hip[0] + n[0], hip[1] + n[1] - (quarter && isFar ? 1 : 0)];
    }
    // Leggings win over the garment's own guess: a short tunic over hose is
    // covered, a long robe over nothing still hides the leg anyway.
    const legs =
      a.wearing.garment === "suit"
        ? "trousers"
        : (a.wearing.leggings ?? "none");
    const bareLeg =
        legs === "none" &&
        (a.wearing.garment === "tunic" ||
          a.wearing.garment === "wrap" ||
          a.wearing.garment === "none"),
      base = bareLeg ? skin : a.wearing.garment === "suit" ? cloth : lower,
      colors = isFar ? { ...base, base: base.shade } : base;
    p.limb([hip, knee, ankle], 4, colors);
    // Wrappings are the same cloth crossed over itself: two bands up the shin.
    if (legs === "wrapped" && !isFar) {
      p.line([hip[0] - 2, knee[1] + 1], [hip[0] + 2, knee[1] + 2], lower.light);
      p.line([hip[0] - 2, knee[1] + 4], [hip[0] + 2, knee[1] + 5], lower.shade);
    }
    // Trousers reach the ankle; hose stop a pixel short and show the joint.
    if (legs === "trousers" && !isFar)
      p.rect(ankle[0] - 2, ankle[1] - 2, 4, 2, lower.shade);
    // Cut wide: the cloth falls straight and flares away from the body. The
    // flare has to be outward only, or the two legs meet in the middle.
    if (legs === "wide") {
      const out = isFar === side ? -1 : 1;
      const away = side ? 1 : hip[0] > 10 ? 1 : -1;
      p.shape(
        [
          [hip[0] - 2, knee[1] - 3],
          [hip[0] + 2, knee[1] - 3],
          [hip[0] + 2 + (away > 0 ? 2 : 0), ankle[1]],
          [hip[0] - 2 - (away > 0 ? 0 : 2), ankle[1]],
        ],
        isFar ? { ...lower, base: lower.shade } : lower,
      );
      if (!isFar) {
        p.rect(hip[0] - 2, knee[1] - 3, 4, 1, lower.light);
        p.rect(
          hip[0] - 2 - (away > 0 ? 0 : 2),
          ankle[1] - 1,
          6,
          1,
          lower.shade,
        );
      }
      void out;
    }
    const shoe = a.wearing.footwear ?? "shoes";
    if (toeDown) {
      // A foot off the ground hangs from the ankle, toe down.
      const hide = shoe === "none" ? skin : leather;
      p.shape(
        [
          [ankle[0] - 1, ankle[1]],
          [ankle[0] + 2, ankle[1]],
          [ankle[0] + 2, ankle[1] + 2],
          [ankle[0] + 1, ankle[1] + 5],
          [ankle[0] - 1, ankle[1] + 4],
        ],
        isFar ? { ...hide, base: hide.shade } : hide,
      );
      return;
    }
    if (shoe === "none") {
      // Bare foot: the same silhouette in skin, with a toe rather than a welt.
      p.shape(
        [
          [ankle[0] - 1, ankle[1] + 1],
          [ankle[0] + 3, ankle[1] + 1],
          [ankle[0] + 4, ankle[1] + 3],
          [ankle[0] - 1, ankle[1] + 3],
        ],
        isFar ? { ...skin, base: skin.shade } : skin,
      );
      return;
    }
    const footX = ankle[0] - 1;
    const hide =
      shoe === "sandals"
        ? { ...leather, base: leather.shade }
        : shoe === "sneakers"
          ? sneaker
          : leather;
    p.shape(
      [
        [footX, ankle[1]],
        [footX + 3, ankle[1]],
        [footX + 5, ankle[1] + 1],
        [footX + 5, ankle[1] + 3],
        [footX, ankle[1] + 3],
      ],
      hide,
    );
    p.rect(footX + 1, ankle[1] + 1, 2, 1, isFar ? hide.shade : hide.base);
    // Sandals are straps over skin: cut the upper back to the foot beneath.
    if (shoe === "sandals") {
      p.rect(footX + 1, ankle[1], 3, 1, isFar ? skin.shade : skin.base);
      p.rect(footX + 2, ankle[1] + 1, 1, 1, leather.light);
    }
    // A white rubber sole and one stripe of colour: what reads as a trainer.
    if (shoe === "sneakers") {
      p.rect(footX, ankle[1] + 2, 5, 1, "#f1eee6");
      p.rect(footX + 2, ankle[1] + 1, 2, 1, trimTone.base);
    }
    // Boots carry the shaft up the shin.
    if (shoe === "boots")
      p.rect(
        ankle[0] - 2,
        ankle[1] - 4,
        4,
        4,
        isFar ? leather.shade : leather.base,
      );
  };
  leg(true);
  leg(false);
  // A wound sheet hangs as one piece over both legs, so it is drawn after
  // them rather than on each: sarong, lungi, dhoti, kanga, izaar.
  if ((a.wearing.leggings ?? "none") === "sarong") {
    const sheet = ramp(a.wearing.lowerColor);
    const l = side ? left : 5 - wide,
      r = side ? right - 1 : 15 + wide;
    const top = 21 + torso,
      fall = feet - 3;
    p.shape(
      [
        [l, top],
        [r, top],
        [r + 1 + trail, fall],
        [l - 1 + trail, fall],
      ],
      sheet,
    );
    p.rect(l, top, r - l, 1, sheet.light);
    p.rect(l, fall - 1, r - l, 1, sheet.shade);
    // Where the cloth crosses itself, which is what says wound and not sewn.
    const seam = side ? r - 3 : l + 4;
    p.line([seam, top + 1], [seam - 1, fall - 2], sheet.shade);
    p.rect(seam, top, 2, 2, sheet.light);
  }
  ctx.translate(lean, 0);
  if (a.wearing.cloak) {
    const sway = drift;
    p.shape(
      [
        [side ? 8 : 4 - wide, 13],
        [side ? 12 : 16 + wide, 13],
        [(side ? 11 : 18 + wide) + sway, 27 + torso - float],
        [(side ? 4 : 1 - wide) + sway - float, 27 + torso - float],
        [side ? 6 : 2 - wide, 18],
      ],
      cloak,
    );
    p.line(
      [side ? 7 : 5 - wide, 17],
      [(side ? 6 : 3 - wide) + sway, 25 + torso],
      cloak.light,
    );
  }
  // A loincloth is the bare-torso body with a panel hung off the cord, so it
  // shares every measurement with it.
  const naked =
    a.wearing.garment === "none" || a.wearing.garment === "loincloth";
  const poncho = a.wearing.garment === "poncho";
  const openRobe = a.wearing.garment === "open-robe";
  const gown = a.wearing.garment === "gown";
  const suit = a.wearing.garment === "suit";
  const long = [
      "robe",
      "dress",
      "coat",
      "skirt",
      "long-tunic",
      "open-robe",
      "gown",
      "suit",
    ].includes(a.wearing.garment),
    hem =
      a.wearing.garment === "long-tunic"
        ? 27 + torso
        : long
          ? 30 + torso
          : poncho
            ? 26 + torso
            : 23 + torso;
  // A poncho hangs off the shoulders and does not follow the body: straight
  // sides are the whole silhouette.
  // A court gown is the width: panniers and a stiffened underskirt carry it
  // well past the body, which is the whole silhouette. A sealed suit is the
  // opposite — it follows the body exactly.
  const flare = gown
    ? 5
    : ["dress", "skirt"].includes(a.wearing.garment)
      ? 2
      : suit
        ? 0
        : poncho
          ? 1
          : a.wearing.garment === "robe"
            ? 2
            : long
              ? 1
              : 0;
  // A belt pulls the cloth in at the waist and the skirt of it stands off
  // below; without it every garment was the same box.
  const belly = a.bodyShape === "rounded" ? 1 : 0;
  const cinch =
    !naked &&
    !poncho &&
    !belly &&
    a.build < 1 &&
    (a.wearing.belt ?? "leather") !== "none" &&
    !["coat", "robe", "open-robe", "gown", "suit"].includes(a.wearing.garment)
      ? 1
      : 0;
  const waist = (a.bodyShape === "tapered" ? 1 : 0) + cinch,
    waistY = cinch ? 22 + torso : 19 + torso;
  // A coat is cut square across the shoulder.
  const shoulder = a.wearing.garment === "coat" ? 1 : 2;
  // A long hem swings a frame behind the legs, like the cloak.
  const hemSway = long ? drift : trail;
  const hemLift =
    (a.wearing.hem === "slanted" ? 2 : stance === "relaxed" ? 1 : 0) +
    (float ? 1 : 0);
  // Bare above the waist: the torso is skin down to a short waistcloth, so
  // the silhouette is the same body without a garment on it.
  const body = naked ? skin : cloth;
  const bodyHem = naked ? 22 + torso : hem;
  p.group(body, () => {
    p.shape(
      poncho
        ? // Square at the shoulder, straight down, flat across the hem.
          [
            [left - 1, 12],
            [right + 1, 12],
            [right + 1 + hemSway, bodyHem],
            [left - 1 + hemSway, bodyHem],
          ]
        : flat
          ? // Profile: chest forward under the chin, the back two pixels behind
            // the neck, a hollow at the lumbar and a seat below it. The front
            // view's hem drape pushed the back out and tucked the belly in.
            [
              [left + 2 + pitch, 12],
              [right - 3 + pitch, 12],
              [right - 1 + pitch, 14],
              [right + 1 + pitch, 16 - inhale],
              [right + 1 + pitch, 18 - inhale],
              [right + belly, 20 + torso],
              [right + belly + flare + hemSway, bodyHem - 1 - hemLift],
              [right - 1 + flare + hemSway, bodyHem],
              [left - flare + hemSway, bodyHem],
              ...((bodyHem > 24 + torso
                ? [[left, 23 + torso]]
                : []) as Point[]),
              [left + 1, 20 + torso],
              [left + pitch, 16],
              [left + pitch, 14],
            ]
          : [
              [left + shoulder, 12 - tilt],
              [right - shoulder, 12 + tilt],
              [right, 15 - inhale + tilt],
              [right - waist + belly, waistY],
              [right + flare + hemSway, bodyHem - 1 - hemLift],
              [right - 1, bodyHem],
              [left - flare + hemSway, bodyHem],
              [left - 1, bodyHem - 2],
              [left + waist - belly, waistY],
              [left, 15 - inhale - tilt],
            ],
      body,
    );
    if (!naked && !poncho && sleeves !== "none") {
      // In profile the near sleeve is drawn later with its own contour, or the
      // arm vanishes into a torso of the same cloth.
      if (!side) p.ribbon(nearArm.sleeve, sleeves === "loose" ? 5 : 4, cloth);
      p.ribbon(farArm.sleeve, sleeves === "loose" ? 5 : 4, cloth);
    }
  });
  if (naked) {
    p.rect(left, 19 + torso, right - left, 4, lower.base);
    p.rect(left, 19 + torso, right - left, 1, lower.light);
    p.rect(left, 22 + torso, right - left, 1, lower.shade);
    // A loincloth is the same cord with a panel hanging off the front of it.
    if (a.wearing.garment === "loincloth") {
      const mid = flat ? right - 4 : Math.round((left + right) / 2) - 1;
      p.rect(mid, 22 + torso, 3, 6, lower.base);
      p.rect(mid, 22 + torso, 1, 6, lower.light);
      p.rect(mid + 2, 22 + torso, 1, 6, lower.shade);
      p.rect(mid, 27 + torso, 3, 1, lower.edge);
    }
    // A shallow sternum line, so a bare chest is not one flat field of skin.
    if (!side && !back) p.line([11, 16], [11, 19 + torso], skin.shade);
  }
  // Shoulder light flows into the sleeve; only a short underarm fold separates surfaces.
  if (!naked && sleeves !== "none") {
    if (!side) {
      p.line([left, 14], [left + 2, 13], cloth.light);
      p.line([right - 3, 13], [right, 14], cloth.base);
    }
  }
  // The profile torso is 8px with an arm across it: the contour and the arm
  // carry the form, and hand-placed planes only add noise.
  if (!naked && !side) {
    p.line([left + 1, 16], [left + 1, hem - 3], cloth.light);
    p.line([right - 2, 17], [right - 2, hem - 2], cloth.shade);
  }
  if (long) {
    p.line([left + 3, 23 + torso], [left + 2, hem - 2], cloth.shade);
    p.line([left, hem - 2], [right - 1, hem - 2], a.wearing.trim);
  }
  // Open at the front over a contrasting inner layer. The inner is drawn
  // first, then the outer panels cut back to leave a gap down the middle:
  // that gap is the whole silhouette, and without it this is just a coat.
  if (openRobe && !rear) {
    const inner = ramp(a.wearing.lowerColor);
    const mid = Math.round((left + right) / 2) + (quarter ? 1 : 0);
    if (flat) {
      // In profile the opening is a strip down the front edge.
      p.rect(right - 3, 15, 2, hem - 17, inner.base);
      p.line([right - 4, 15], [right - 4, hem - 3], a.wearing.trim);
    } else {
      p.rect(mid - 2, 15, 5, hem - 17, inner.base);
      p.rect(mid - 2, 15, 1, hem - 17, inner.shade);
      p.rect(mid + 1, 15, 1, hem - 17, inner.light);
      // The panel edges, lit on the left and shaded on the right.
      p.line([mid - 3, 14], [mid - 3, hem - 2], cloth.light);
      p.line([mid + 3, 14], [mid + 3, hem - 2], cloth.shade);
      // A collar band running down each edge, which is where these garments
      // carry their trim.
      p.line([mid - 4, 15], [mid - 4, hem - 3], a.wearing.trim);
      p.line([mid + 4, 15], [mid + 4, hem - 3], a.wearing.trim);
    }
  }
  // A gown: a stomacher panel down the bodice and a band where the skirt is
  // gathered onto it.
  if (gown) {
    // Panniers: the skirt goes out sideways at the waist and stays out, which
    // is the whole silhouette and is lost if it only flares at the hem.
    p.shape(
      [
        [left - 1, 21 + torso],
        [right + 1, 21 + torso],
        [right + 5 + hemSway, hem - 1],
        [left - 5 + hemSway, hem],
      ],
      cloth,
    );
    p.line(
      [left - 4 + hemSway, hem - 2],
      [right + 4 + hemSway, hem - 2],
      cloth.shade,
    );
    p.line([left - 1, 23 + torso], [left - 4 + hemSway, hem - 3], cloth.light);
  }
  if (gown && !rear) {
    const inner = ramp(a.wearing.lowerColor);
    const mid = flat ? right - 3 : Math.round((left + right) / 2);
    p.shape(
      [
        [mid - 2, 15],
        [mid + 2, 15],
        [mid + 1, 21 + torso],
        [mid - 1, 21 + torso],
      ],
      inner,
    );
    p.rect(left, 21 + torso, right - left, 1, a.wearing.trim);
    p.line([left - 2, hem - 3], [right + 1, hem - 3], inner.light);
  }
  // A sealed suit: a chest seal, a collar ring, and a seam down each side.
  if (suit) {
    const gear = ramp(a.wearing.trim);
    p.rect(left + 1, 14, right - left - 2, 1, gear.base);
    if (!rear) {
      p.rect(flat ? right - 5 : centre - 1, 17, 4, 3, gear.shade);
      p.rect(flat ? right - 5 : centre - 1, 17, 4, 1, gear.light);
    }
    p.line([left + 1, 16], [left + 1, hem - 2], gear.shade);
    p.line([right - 2, 16], [right - 2, hem - 2], gear.shade);
  }
  if (a.wearing.garment === "wrap" && !rear) {
    p.shape(
      [
        [left + 2, 13],
        [left + 5, 13],
        [left + 2, 19],
        [left + 1, 18],
      ],
      skin,
    );
    p.line([left + 6, 14], [right - 2, 22 + torso], a.wearing.trim);
  }
  if (
    (a.wearing.garment === "shirt" || a.wearing.garment === "coat") &&
    !rear
  ) {
    const seam = flat ? right - 2 : centre;
    p.line([seam, 15], [seam, hem - 2], cloth.shade);
    if (!flat)
      for (let y = 16; y < hem - 2; y += 3)
        p.rect(seam + 1, y, 1, 1, a.wearing.trim);
  }
  // Small planes of cloth shading: chest, underarm and belt gathers, never box outlines.
  if (!side) {
    p.rect(left + 2, 15 - inhale, 4, 2, cloth.light);
    p.line([right - 2, 18], [right - 2 - waist, 21 + torso], cloth.shade);
    p.line([left + 3, 21 + torso], [left + 5, 20 + torso], cloth.shade);
  }
  if (a.wearing.garment === "skirt") {
    p.shape(
      [
        [left, 22 + torso],
        [right, 22 + torso],
        [right + flare + hemSway, hem - 1],
        [left - flare + hemSway, hem],
      ],
      lower,
    );
    p.line([left + 2, 24 + torso], [left + 1, hem - 2], lower.light);
    p.line([right - 3, 24 + torso], [right - 2, hem - 2], lower.shade);
  }
  if (a.wearing.hem === "split")
    p.rect(flat ? right - 2 : centre, hem - 2, 1, 2, lower.shade);
  // --- cloth detail ------------------------------------------------------
  // One deterministic motif per outfit, from fields the appearance already
  // carries, so a village reads as a wardrobe rather than as one smock in
  // twelve colours. Everything here is drawn in the garment's own trim.
  const trim = ramp(a.wearing.trim);
  // Trim, necklines, cuffs and motifs all decorate cloth. A bare chest takes
  // none of them; the belt and the neck below still apply.
  if (!naked) {
    const outfit = [
      ...(a.wearing.color +
        a.wearing.trim +
        a.wearing.garment +
        a.wearing.belt),
    ].reduce((n, c) => (Math.imul(n, 31) + c.charCodeAt(0)) >>> 0, 7);
    const mid = flat
      ? right - 3
      : Math.round((left + right) / 2) + (quarter ? 1 : 0);
    const chest = 18,
      lowChest = 21 + torso;
    if (!rear) {
      // A neckline. The shipped garments end at a bare shoulder seam.
      if (flat) p.rect(right - 4, 16, 3, 1, trim.shade);
      else if (["shirt", "coat", "robe"].includes(a.wearing.garment)) {
        p.line([mid - 3, 16], [mid, 19], trim.base);
        p.line([mid + 3, 16], [mid, 19], trim.base);
      } else p.rect(left + 2, 16, right - left - 3, 1, trim.base);
    }
    // Cuffs, which is where a sleeve wants a value change anyway.
    if (sleeves === "long" || sleeves === "loose")
      for (const arm of [nearArm, farArm])
        p.rect(arm.cuff[0] - 1, arm.cuff[1], 3, 1, trim.shade);
    // Hem border. Long garments already had one; short ones ended on bare cloth.
    if (!long && hem - 2 > lowChest)
      p.line([left + 1, hem - 2], [right - 2, hem - 2], trim.shade);
    // A wrap already carries its own diagonal trim; a motif on top reads as dirt.
    const named = a.wearing.motif ?? "auto";
    const motif =
      named === "auto"
        ? outfit % 5
        : {
            plain: 0,
            placket: 1,
            band: 2,
            yoke: 3,
            stitch: 4,
            stripes: 5,
            plaid: 6,
            jersey: 7,
          }[named];
    if (!rear && a.wearing.garment !== "wrap")
      switch (motif) {
        case 1: // centre placket
          p.line([mid, chest], [mid, hem - 3], trim.shade);
          break;
        case 2: // banded chest
          p.rect(left + 2, chest, right - left - 3, 1, trim.shade);
          p.rect(left + 2, lowChest, right - left - 3, 1, trim.shade);
          break;
        case 3: {
          // A yoke, not a diagonal sash: a 1px diagonal is smudge at this size.
          const yoke = ramp(a.wearing.lowerColor);
          p.rect(left + 2, chest - 1, right - left - 3, 2, yoke.base);
          p.rect(left + 2, chest, right - left - 3, 1, yoke.shade);
          break;
        }
        case 4: // stitched seam
          for (let y = chest; y < hem - 3; y += 3)
            p.rect(flat ? right - 3 : left + 2, y, 1, 1, trim.base);
          break;
        case 5: {
          // Bands across the whole width, alternating the trim and the lower
          // colour. The one pattern that still reads at twenty pixels.
          const second = ramp(a.wearing.lowerColor);
          // From the shoulder, not the chest: starting lower left only two
          // bands showing under a mantle and a belt.
          for (let i = 0, y = 14; y < hem - 2; y += 3, i++) {
            const tone = i % 2 ? second : trim;
            p.rect(left + 1, y, right - left - 2, 2, tone.base);
            p.rect(left + 1, y + 1, right - left - 2, 1, tone.shade);
          }
          break;
        }
        case 6: {
          // A check: shaded cross-bands every third pixel, crossing at a
          // darker square. Reads as flannel at sprite size.
          for (let y = 15; y < hem - 1; y += 3)
            p.rect(left + 1, y, right - left - 2, 1, trim.shade);
          for (let x = left + 2; x < right - 1; x += 3)
            for (let y = 14; y < hem - 1; y++)
              p.rect(x, y, 1, 1, (y - 15) % 3 === 0 ? trim.edge : trim.base);
          break;
        }
        case 7: {
          // Contrast shoulders and a block number on the chest.
          const second = ramp(a.wearing.lowerColor);
          p.rect(left + 1, 14, right - left - 2, 2, second.base);
          if (!flat) {
            p.rect(mid - 1, chest + 1, 1, 4, second.light);
            p.rect(mid + 1, chest + 1, 1, 4, second.light);
          }
          break;
        }
      }
    // Occlusion where the hem meets the leg. Without it the legs read as pasted
    // on beneath the garment rather than continuing under it.
    if (hem < feet - 4) {
      const bareLegs =
        (a.wearing.leggings ?? "none") === "none" &&
        (a.wearing.garment === "tunic" || a.wearing.garment === "wrap");
      const legTone = bareLegs ? skin : lower;
      for (const x of quarter
        ? [10, 12]
        : side
          ? [11, 12]
          : [6 - wide + small, 13 + wide - narrow])
        p.rect(x - 1, hem, 4, 1, legTone.shadowEdge ?? legTone.edge);
    }
  }
  const belt = a.wearing.belt ?? "leather",
    beltY = 22 + torso,
    buckleX = flat ? right - 2 : centre,
    // In step with the cinched waist, or the belt overhangs it.
    bl = left + (flat ? 0 : cinch),
    br = right - (flat ? 0 : cinch);
  if (belt === "leather") {
    p.rect(bl, beltY, br - bl, 1, leather.edge);
    p.rect(buckleX, beltY, 2, 1, a.wearing.trim);
  } else if (belt === "wide") {
    p.rect(bl, beltY - 1, br - bl, 2, leather.edge);
    p.rect(bl, beltY - 1, br - bl, 1, leather.shade);
    p.rect(buckleX, beltY - 1, 2, 2, a.wearing.trim);
  } else if (belt === "cord") {
    const cord = ramp(a.wearing.trim);
    p.rect(bl + 1, beltY, br - bl - 2, 1, cord.shade);
    p.rect(buckleX, beltY, 1, 2, cord.base);
  } else if (belt === "sash") {
    const sash = ramp(a.wearing.lowerColor);
    p.rect(bl, beltY - 1, br - bl, 2, sash.base);
    p.rect(bl, beltY, br - bl, 1, sash.shade);
    p.rect(bl, beltY - 1, 2, 3, sash.shade);
  }
  if (side && !naked && !poncho && sleeves !== "none") {
    p.overlay = true;
    p.ribbon(nearArm.sleeve, sleeves === "loose" ? 5 : 4, cloth);
    p.overlay = false;
    if (sleeves !== "short")
      p.rect(nearArm.cuff[0] - 1, nearArm.cuff[1], 3, 1, trim.shade);
  }
  // A short cape over the shoulders, stopping at the elbow, and usually the
  // brightest thing on the figure: lliclla, feather cape, paenula. Drawn over
  // the garment, because that is what it is.
  if (a.wearing.mantle && !a.wearing.cloak) {
    const sway = trail;
    const ml = side ? left - 1 : 1 - wide,
      mr = side ? right + 1 : 19 + wide;
    p.shape(
      [
        [ml + 2, 12],
        [mr - 2, 12],
        [mr, 15],
        [mr - 1 + sway, 22 + torso],
        [ml + 1 + sway, 22 + torso],
        [ml, 15],
      ],
      cloak,
    );
    p.rect(ml + 1 + sway, 21 + torso, mr - ml - 2, 1, a.wearing.trim);
    p.line([ml + 2, 14], [ml + 2 + sway, 20 + torso], cloak.light);
    p.line([mr - 2, 14], [mr - 2 + sway, 20 + torso], cloak.shade);
    p.rect(ml + 3, 12, mr - ml - 6, 1, cloak.light);
  }
  // Neck is a separate warm shadow between head and garment.
  const neckSide = flat,
    neckX = (neckSide ? 11 : quarter ? 10 : 9) + pitch;
  p.rect(neckX, 12, neckSide ? 3 : 5, 3, skin.shade);
  p.rect(neckX + 1, 13, 2, 1, skin.base);
  if (side) {
    // The far hand is occluded by the body, but remains visible beyond its silhouette.
    ctx.save();
    ctx.beginPath();
    ctx.rect(right, 0, 80 - right, 80);
    ctx.rect(-30, 0, left + 30, 80);
    ctx.clip();
    forearm(farArm, true);
    ctx.restore();
  } else forearm(farArm, back);
  p.overlay = side;
  forearm(nearArm, false);
  p.overlay = false;
  if (a.wearing.shoulderCloth) {
    const drape = ramp(a.wearing.cloakColor);
    p.shape(
      side
        ? [
            [9, 13],
            [13, 14],
            [11, 23 + torso],
            [8, 21 + torso],
          ]
        : [
            [5, 13],
            [9, 14],
            [8, 23 + torso],
            [4, 21 + torso],
          ],
      drape,
    );
    p.line([side ? 10 : 6, 15], [side ? 9 : 5, 20 + torso], drape.light);
    p.line([side ? 12 : 8, 14], [side ? 15 : 12, 15], drape.base);
  }
  // Collar shadow under the chin so the head sits on the body.
  if (!rear) p.rect(left + 1 + pitch, 16, right - left - 1, 1, cloth.shade);
  ctx.save();
  if (stance === "stooped") ctx.translate(1, 1);
  ctx.translate(pitch, 0);
  p.modeling = false;
  // Cuts run through the crown and the jaw, never the eye, nose or mouth rows.
  // A smaller head also rides a pixel higher, so a neck shows under the chin.
  const headSize = a.headSize ?? "medium";
  if (headSize !== "large") {
    const small = headSize === "small";
    p.squeeze = {
      rows: small ? [5, 14] : [5],
      cols: flat ? [6] : small ? [5, 15] : [5],
    };
    ctx.translate(0, -1);
  }
  if (quarter) {
    // The profile body sits forward of the front head's centre; move the
    // head over it.
    ctx.save();
    ctx.translate(1, 0);
    drawHead(p, a, false, headAway, pose, f, trail, true);
    ctx.restore();
  } else drawHead(p, a, side, back, pose, f, trail);
  p.squeeze = undefined;
  p.modeling = true;
  ctx.restore();
  if (a.wearing.necklace && !rear && a.wearing.neckStyle === "chain") {
    // A chain hangs close and catches the light along its length.
    if (neckSide) p.line([13, 15], [14, 17], "#d8b35a");
    else {
      p.line([8, 15], [10, 17], "#d8b35a");
      p.line([10, 17], [12, 15], "#d8b35a");
      p.rect(10, 17, 1, 1, "#f3dc92");
    }
  } else if (a.wearing.necklace && !rear) {
    if (neckSide) p.line([13, 15], [14, 17], a.wearing.trim);
    else {
      p.line([7, 15], [10, 17], a.wearing.trim);
      p.line([10, 17], [13, 15], a.wearing.trim);
    }
    p.rect(neckSide ? 14 : 10, 18, 1, 1, "#ddbd70");
  }
  if (!back) drawProp();
  if (prop && !back) {
    if (prop.kind === "both") {
      p.rect(far[0], far[1], 2, 2, skin.shade);
      p.rect(far[0], far[1], 1, 1, skin.light);
    }
    p.rect(near[0], near[1], 2, 2, skin.base);
    p.rect(near[0], near[1], 1, 1, skin.light);
  }
  ctx.restore();
  p.contact();
}
