import type { CharacterAppearance } from "../../../core/character";
import type { CharacterPose } from "../poses";
import type { CarriedArt } from "../props";
import { drawHead } from "./head";
import { Pixels, ramp, type Point, type Ramp } from "./pixels";
import { facingView } from "../../../core/facing";
export const CHARACTER_SIZE = 80;
/** Same native scale as the original (29px standing body), with 3px height steps.
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
  const f = ((frame % 4) + 4) % 4,
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
  const stance = resting ? (a.posture ?? "upright") : "upright";
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
    stride = strides[f],
    // One frame behind the legs: cloth follows the body, it does not snap with it.
    trail = Math.sign(strides[(f + 3) % 4]),
    // How far it follows. A single pixel of hem was invisible at this size.
    drift = trail * (sprint ? 3 : 2),
    // A run drops harder on contact and tucks both legs through the flight frames.
    bob = moving && pose !== "wade" && f % 2 ? (sprint ? 2 : 1) : 0,
    flight = sprint && f % 2 === 0 ? 2 : 0,
    shift = pose === "sway" ? [-1, 0, 1, 0][f] : 0;
  // Crouch, stretch off the ground, hang at the apex, absorb the landing.
  const airborne = pose === "jump";
  const tuck = airborne ? [0, 2, 5, 1][f] : 0;
  // A run compresses into the contact frame and extends off it. `bend` drops
  // the head while the feet stay planted, so it is already the squash.
  const extend = sprint && f % 2 === 0 ? 1 : 0,
    squat = sprint && f % 2 === 1 ? 1 : 0;
  const bend =
    (stance === "stooped" ? 2 : burden ? 1 : 0) +
    (airborne
      ? [4, -1, 0, 3][f]
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
  const tall = a.height * 3,
    torso = a.height * 2,
    wide = Math.max(0, a.build) + squat,
    // The smallest body loses a pixel each side too, or it reads as a short adult.
    small = a.height <= -2 ? 1 : 0,
    narrow = (a.build === -1 ? 1 : 0) + small,
    feet = 33 + tall - bend - bob;
  const skin = ramp(a.skin, "skin"),
    cloth = ramp(a.wearing.color),
    lower = ramp(a.wearing.lowerColor),
    cloak = ramp(a.wearing.cloakColor),
    leather = ramp("#72503b"),
    iron = ramp("#8b929a"),
    wood = ramp("#ae7e49");
  ctx.save();
  ctx.translate(30 + shift, 46 - tall + bend + bob);
  if (direction === 3) {
    ctx.translate(20, 0);
    ctx.scale(-1, 1);
  }
  const p = new Pixels(ctx);
  // Mirroring the raster would mirror the sun with it, so walking west would
  // relight the whole figure. Shading is resolved in screen space instead.
  p.flip = direction === 3;
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
  const armSwing = moving ? (sprint ? [0, 4, 0, -4] : [0, 2, 0, -2])[f] : 0;
  const shoulderNear: Point = side
      ? [10, 15 - inhale]
      : [16 + wide - narrow, 15 - inhale],
    shoulderFar: Point = side
      ? [13 - narrow, 15 - inhale]
      : [4 - wide + small, 15 - inhale];
  // Two pixels below the belt: clear of the waist, where hands at 22 read as
  // arms folded on the stomach, but well short of the knee.
  const hang = (sprint ? 20 : 24) + torso;
  let near: Point = side
      ? [10 - armSwing, hang - (armSwing < 0 ? 1 : 0)]
      : [
          16 + wide - narrow - (stride < 0 ? 1 : 0),
          hang + Math.round(stride / 3),
        ],
    far: Point = side
      ? [13 - narrow + armSwing, hang - (armSwing > 0 ? 1 : 0)]
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
  if (airborne) {
    // Arms wind back, swing overhead through the launch, then reach out to land.
    near = (
      [
        [side ? 8 : 11 + wide, 24 + torso],
        [side ? 15 : 16 + wide, 11],
        [side ? 21 : 21 + wide, 13],
        [side ? 18 : 18 + wide, 19 + torso],
      ] as Point[]
    )[f];
    far = (
      [
        [side ? 6 : 6 - wide, 24 + torso],
        [side ? 11 : 2 - wide, 12],
        [side ? 8 : -1 - wide, 14],
        [side ? 13 : 4 - wide, 20 + torso],
      ] as Point[]
    )[f];
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
      const head = /pitchfork/.test(prop.sprite)
        ? "fork"
        : /rake/.test(prop.sprite)
          ? "rake"
          : /scythe/.test(prop.sprite)
            ? "blade"
            : "blade-square";
      if (head === "fork")
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
  const armGeometry = (shoulder: Point, hand: Point) => {
    const elbow: Point = [
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
  const nearArm = armGeometry(shoulderNear, near),
    farArm = armGeometry(shoulderFar, far);
  const forearm = (arm: ReturnType<typeof armGeometry>, isFar: boolean) => {
    const material: Ramp = isFar
      ? { ...skin, base: skin.shade, light: skin.base }
      : skin;
    const bare = sleeves === "none";
    p.ribbon(
      bare ? [arm.shoulder, arm.elbow, arm.hand] : [arm.cuff, arm.hand],
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
          : 9
        : isFar
          ? 6 - wide + small
          : 13 + wide - narrow,
      // Front and back used to hold both feet still and only lift one 2px.
      // A pixel of scissor either side is enough to read as a stride head-on.
      walk = side
        ? isFar
          ? -stride
          : stride
        : Math.sign(isFar ? -stride : stride);
    // Lifted on the passing frames, planted on the contact frames. It used to
    // be the other way round, which left both feet flat at mid-stride and made
    // the two passing frames identical drawings.
    const lift =
      (moving ? ((isFar && f === 2) || (!isFar && f === 0) ? 2 : 0) : 0) +
      flight +
      // Climbing alternates a foothold: one foot stays planted on the face
      // while the other reaches for the next hold.
      (climbing ? ((isFar ? f % 2 : (f + 1) % 2) ? 4 : 0) : 0);
    // The trailing leg tucks a pixel less, so the pair reads as a stride in air.
    const raise = tuck && isFar ? tuck - 1 : tuck;
    const ankle: Point = [x + walk, feet - 2 - lift - raise],
      hip: Point = [x, 22 + torso];
    const knee: Point = [
      x +
        Math.round(walk * 0.5) +
        (side && raise ? 2 : 0) +
        (side && moving && lift && !climbing ? 1 : 0) +
        // Knees out to the sides, so a climber straddles the face.
        (climbing ? (isFar ? -2 : 2) : 0),
      Math.round((hip[1] + ankle[1]) / 2),
    ];
    // Leggings win over the garment's own guess: a short tunic over hose is
    // covered, a long robe over nothing still hides the leg anyway.
    const legs = a.wearing.leggings ?? "none";
    const bareLeg =
        legs === "none" &&
        (a.wearing.garment === "tunic" ||
          a.wearing.garment === "wrap" ||
          a.wearing.garment === "none"),
      base = bareLeg ? skin : lower,
      colors = isFar ? { ...base, base: base.shade } : base;
    p.limb([hip, knee, ankle], 4, colors);
    // Wrappings are the same cloth crossed over itself: two bands up the shin.
    if (legs === "wrapped" && !isFar) {
      p.line([hip[0] - 2, knee[1] + 1], [hip[0] + 2, knee[1] + 2], lower.light);
      p.line([hip[0] - 2, knee[1] + 4], [hip[0] + 2, knee[1] + 5], lower.shade);
    }
    // Trousers reach the ankle; hose stop a pixel short and show the joint.
    if (legs === "trousers" && !isFar)
      p.rect(hip[0] - 2, ankle[1] - 2, 4, 2, lower.shade);
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
        p.rect(hip[0] - 2 - (away > 0 ? 0 : 2), ankle[1] - 1, 6, 1, lower.shade);
      }
      void out;
    }
    const shoe = a.wearing.footwear ?? "shoes";
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
      shoe === "sandals" ? { ...leather, base: leather.shade } : leather;
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
    const l = (side ? 7 : 5) - wide,
      r = (side ? 14 : 15) + wide;
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
        [side ? 5 : 4 - wide, 13],
        [side ? 10 : 16 + wide, 13],
        [(side ? 9 : 18 + wide) + sway, 27 + torso],
        [1 - wide + sway, 27 + torso],
        [side ? 3 : 2 - wide, 18],
      ],
      cloak,
    );
    p.line(
      [side ? 4 : 5 - wide, 17],
      [3 - wide + sway, 25 + torso],
      cloak.light,
    );
  }
  const left = (side ? 6 - wide : 4 - wide) + small,
    right = (side ? 15 + wide : 16 + wide) - narrow;
  // A loincloth is the bare-torso body with a panel hung off the cord, so it
  // shares every measurement with it.
  const naked =
    a.wearing.garment === "none" || a.wearing.garment === "loincloth";
  const poncho = a.wearing.garment === "poncho";
  const openRobe = a.wearing.garment === "open-robe";
  const long = [
    "robe",
    "dress",
    "coat",
    "skirt",
    "long-tunic",
    "open-robe",
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
  const flare = ["dress", "skirt"].includes(a.wearing.garment)
    ? 2
    : poncho
      ? 1
      : long
        ? 1
        : 0;
  const waist = a.bodyShape === "tapered" ? 1 : 0;
  const belly = a.bodyShape === "rounded" ? 1 : 0;
  // A long hem swings a frame behind the legs, like the cloak.
  const hemSway = long ? drift : trail;
  const hemLift =
    a.wearing.hem === "slanted" ? 2 : stance === "relaxed" ? 1 : 0;
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
        : [
            [left + 2, 12],
            [right - 2, 12],
            [right, 15 - inhale],
            [right - waist + belly, 19 + torso],
            [right + flare + hemSway, bodyHem - 1 - hemLift],
            [right - 1, bodyHem],
            [left - flare + hemSway, bodyHem],
            [left - 1, bodyHem - 2],
            [left + waist - belly, 19 + torso],
            [left, 15 - inhale],
          ],
      body,
    );
    if (!naked && !poncho && sleeves !== "none") {
      p.ribbon(nearArm.sleeve, sleeves === "loose" ? 5 : 4, cloth);
      p.ribbon(farArm.sleeve, sleeves === "loose" ? 5 : 4, cloth);
    }
  });
  if (naked) {
    p.rect(left, 19 + torso, right - left, 4, lower.base);
    p.rect(left, 19 + torso, right - left, 1, lower.light);
    p.rect(left, 22 + torso, right - left, 1, lower.shade);
    // A loincloth is the same cord with a panel hanging off the front of it.
    if (a.wearing.garment === "loincloth") {
      const mid = side ? right - 4 : Math.round((left + right) / 2) - 1;
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
    } else {
      p.line(
        [nearArm.shoulder[0] - 1, 16],
        [nearArm.elbow[0] - 1, nearArm.elbow[1]],
        cloth.shade,
      );
      p.rect(nearArm.shoulder[0], 15, 2, 2, cloth.base);
    }
  }
  if (!naked) {
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
  if (openRobe && !back) {
    const inner = ramp(a.wearing.lowerColor);
    const mid = side ? right - 3 : Math.round((left + right) / 2);
    p.rect(mid - 2, 15, 5, hem - 17, inner.base);
    p.rect(mid - 2, 15, 1, hem - 17, inner.shade);
    p.rect(mid + 1, 15, 1, hem - 17, inner.light);
    // The panel edges, lit on the left and shaded on the right.
    p.line([mid - 3, 14], [mid - 3, hem - 2], cloth.light);
    p.line([mid + 3, 14], [mid + 3, hem - 2], cloth.shade);
    // A collar band running down each edge, which is where these garments
    // carry their trim.
    p.line([mid - 4, 15], [mid - 4, hem - 3], a.wearing.trim);
    if (!side) p.line([mid + 4, 15], [mid + 4, hem - 3], a.wearing.trim);
  }
  if (a.wearing.garment === "wrap" && !back) {
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
    !back
  ) {
    const seam = side ? right - 2 : 10;
    p.line([seam, 15], [seam, hem - 2], cloth.shade);
    if (!side)
      for (let y = 16; y < hem - 2; y += 3)
        p.rect(seam + 1, y, 1, 1, a.wearing.trim);
  }
  // Small planes of cloth shading: chest, underarm and belt gathers, never box outlines.
  p.rect(left + 2, 15 - inhale, side ? 2 : 4, 2, cloth.light);
  p.line([right - 2, 18], [right - 2 - waist, 21 + torso], cloth.shade);
  p.line([left + 3, 21 + torso], [left + 5, 20 + torso], cloth.shade);
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
    p.rect(side ? right - 2 : 10, hem - 2, 1, 2, lower.shade);
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
    const mid = side ? right - 3 : Math.round((left + right) / 2);
    const chest = 18,
      lowChest = 21 + torso;
    if (!back) {
      // A neckline. The shipped garments end at a bare shoulder seam.
      if (side) p.rect(right - 4, 16, 3, 1, trim.shade);
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
        : { plain: 0, placket: 1, band: 2, yoke: 3, stitch: 4, stripes: 5 }[
            named
          ];
    if (!back && a.wearing.garment !== "wrap")
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
            p.rect(side ? right - 3 : left + 2, y, 1, 1, trim.base);
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
      }
    // Occlusion where the hem meets the leg. Without it the legs read as pasted
    // on beneath the garment rather than continuing under it.
    if (hem < feet - 4) {
      const bareLegs =
        (a.wearing.leggings ?? "none") === "none" &&
        (a.wearing.garment === "tunic" || a.wearing.garment === "wrap");
      const legTone = bareLegs ? skin : lower;
      for (const x of side ? [9, 12] : [6 - wide + small, 13 + wide - narrow])
        p.rect(x - 1, hem, 4, 1, legTone.shadowEdge ?? legTone.edge);
    }
  }
  const belt = a.wearing.belt ?? "leather",
    beltY = 22 + torso,
    buckleX = side ? right - 2 : 10;
  if (belt === "leather") {
    p.rect(left, beltY, right - left, 1, leather.edge);
    p.rect(buckleX, beltY, 2, 1, a.wearing.trim);
  } else if (belt === "wide") {
    p.rect(left, beltY - 1, right - left, 2, leather.edge);
    p.rect(left, beltY - 1, right - left, 1, leather.shade);
    p.rect(buckleX, beltY - 1, 2, 2, a.wearing.trim);
  } else if (belt === "cord") {
    const cord = ramp(a.wearing.trim);
    p.rect(left + 1, beltY, right - left - 2, 1, cord.shade);
    p.rect(buckleX, beltY, 1, 2, cord.base);
  } else if (belt === "sash") {
    const sash = ramp(a.wearing.lowerColor);
    p.rect(left, beltY - 1, right - left, 2, sash.base);
    p.rect(left, beltY, right - left, 1, sash.shade);
    p.rect(left, beltY - 1, 2, 3, sash.shade);
  }
  // A short cape over the shoulders, stopping at the elbow, and usually the
  // brightest thing on the figure: lliclla, feather cape, paenula. Drawn over
  // the garment, because that is what it is.
  if (a.wearing.mantle && !a.wearing.cloak) {
    const sway = trail;
    const ml = (side ? 4 : 1) - wide,
      mr = (side ? 13 : 19) + wide;
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
  const neckSide = side && !quarter;
  p.rect(neckSide ? 11 : 9, 12, neckSide ? 3 : 5, 3, skin.shade);
  p.rect(neckSide ? 12 : 10, 13, 2, 1, skin.base);
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
  forearm(nearArm, false);
  if (a.wearing.shoulderCloth) {
    const drape = ramp(a.wearing.cloakColor);
    p.shape(
      side
        ? [
            [7, 13],
            [11, 14],
            [9, 23 + torso],
            [6, 21 + torso],
          ]
        : [
            [5, 13],
            [9, 14],
            [8, 23 + torso],
            [4, 21 + torso],
          ],
      drape,
    );
    p.line([side ? 8 : 6, 15], [side ? 7 : 5, 20 + torso], drape.light);
    p.line([side ? 10 : 8, 14], [side ? 13 : 12, 15], drape.base);
  }
  // Collar shadow under the chin so the head sits on the body.
  if (!back) p.rect(left + 1, 16, right - left - 1, 1, cloth.shade);
  ctx.save();
  if (stance === "stooped") ctx.translate(1, 1);
  p.modeling = false;
  if (quarter) {
    // The front head is a pixel wider than the side body; nudge it towards
    // the way the figure is walking so the turn reads rather than the offset.
    ctx.save();
    ctx.translate(1, 0);
    drawHead(p, a, false, headAway, pose, f, trail);
    ctx.restore();
  } else drawHead(p, a, side, back, pose, f, trail);
  p.modeling = true;
  ctx.restore();
  if (a.wearing.necklace && !back) {
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
}
