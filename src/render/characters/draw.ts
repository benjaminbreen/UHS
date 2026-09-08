import type { CharacterAppearance } from "../../core/character";
import type { CharacterPose } from "./poses";
import type { CarriedArt } from "./props";
import { drawHead } from "./head";
import { Pixels, ramp, type Point, type Ramp } from "./pixels";
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
) {
  ctx.clearRect(0, 0, 80, 80);
  ctx.imageSmoothingEnabled = false;
  const f = ((frame % 4) + 4) % 4,
    side = direction === 1 || direction === 3,
    back = direction === 0,
    moving = pose === "walk" || pose === "carry";
  const resting = pose === "idle" || pose === "breathe";
  const inhale = pose === "breathe" && (f === 1 || f === 2) ? 1 : 0;
  const stance = resting ? (a.posture ?? "upright") : "upright";
  const burden = !!prop && (prop.width > 24 || prop.height > 28);
  const lean =
    stance === "relaxed" ? 1 : stance === "stooped" ? 2 : burden ? -1 : 0;
  const stride = moving ? [0, 3, 0, -3][f] : 0,
    bob = moving && f % 2 ? 1 : 0;
  const bend =
    (stance === "stooped" ? 2 : burden ? 1 : 0) +
    (pose === "sit"
      ? 6
      : pose === "pickup" || pose === "drop"
        ? [0, 3, 6, 2][f]
        : pose === "work"
          ? [0, 0, 4, 2][f]
          : pose === "hurt"
            ? [0, 2, 3, 1][f]
            : 0);
  const tall = a.height * 3,
    torso = a.height * 2,
    wide = Math.max(0, a.build),
    narrow = a.build === -1 ? 1 : 0,
    feet = 30 + tall - bend - bob;
  const skin = ramp(a.skin, "skin"),
    cloth = ramp(a.wearing.color),
    lower = ramp(a.wearing.lowerColor),
    cloak = ramp(a.wearing.cloakColor),
    leather = ramp("#72503b"),
    wood = ramp("#ae7e49");
  ctx.save();
  ctx.translate(30, 49 - tall + bend + bob);
  if (direction === 3) {
    ctx.translate(20, 0);
    ctx.scale(-1, 1);
  }
  const p = new Pixels(ctx);
  const sleeves =
    a.wearing.sleeves ??
    (a.wearing.garment === "wrap"
      ? "none"
      : ["coat", "shirt", "robe"].includes(a.wearing.garment)
        ? "long"
        : "short");
  const armSwing = moving ? [0, 2, 0, -2][f] : 0;
  const shoulderNear: Point = side
      ? [10, 15 - inhale]
      : [16 + wide - narrow, 15 - inhale],
    shoulderFar: Point = side
      ? [13 - narrow, 15 - inhale]
      : [3 - wide, 15 - inhale];
  let near: Point = side
      ? [10 - armSwing, 22 + torso - (armSwing < 0 ? 1 : 0)]
      : [
          16 + wide - narrow - (stride < 0 ? 1 : 0),
          22 + torso + Math.round(stride / 2),
        ],
    far: Point = side
      ? [13 - narrow + armSwing, 22 + torso - (armSwing > 0 ? 1 : 0)]
      : [3 - wide + (stride > 0 ? 1 : 0), 22 + torso - Math.round(stride / 2)];
  if (!prop && resting) {
    if (stance === "hand-on-hip") near = [side ? 12 : 14 + wide, 20 + torso];
    if (stance === "hands-together") {
      near = [side ? 17 : 11, 21 + torso];
      far = [side ? 15 : 8, 21 + torso];
    }
    if (stance === "relaxed") {
      near[1] -= 1;
      far[0] -= 1;
    }
  }
  if (pose === "talk") near = [side ? 17 : 19 + wide, [20, 15, 13, 18][f]];
  if (pose === "point" || pose === "beckon")
    near = [pose === "beckon" ? [22, 25, 20, 17][f] : 25, 16];
  if (pose === "shrug" || pose === "startle") {
    near = [21 + wide, pose === "startle" ? 9 : 15];
    far = [side ? 4 : 0 - wide, pose === "startle" ? 9 : 15];
  }
  if (pose === "swing" || pose === "work")
    near = (
      [
        [17, 9],
        [12, 3],
        [25, 20],
        [18, 22],
      ] as Point[]
    )[f];
  if (pose === "thrust")
    near = (
      [
        [16, 18],
        [12, 18],
        [26, 18],
        [19, 18],
      ] as Point[]
    )[f];
  if (pose === "pickup" || pose === "drop") near = [19, [22, 24, 25, 22][f]];
  if (pose === "hurt") near = [12, 18];
  if (pose === "give") {
    near = [side ? 19 : 16 + wide, 21 + torso - [0, 2, 3, 0][f]];
    far = [side ? 16 : 4 - wide, near[1]];
  }
  if (prop?.kind === "stick" && !["swing", "work", "thrust"].includes(pose))
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
    if (prop.kind === "stick") {
      const v: Point =
        pose === "swing" || pose === "work"
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
    // A palm cluster and thumb, rather than a one-pixel stick at the end of a tube.
    p.rect(arm.hand[0] - 1, arm.hand[1], 3, 2, material.shade);
    p.rect(arm.hand[0] - 1, arm.hand[1], 2, 1, material.light);
    p.rect(arm.hand[0], arm.hand[1] + 1, 2, 1, material.edge);
    p.rect(arm.hand[0], arm.hand[1], 1, 1, material.base);
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
    const x = side ? (isFar ? 12 : 9) : isFar ? 6 - wide : 13 + wide - narrow,
      walk = side ? (isFar ? -stride : stride) : 0;
    const lift = moving
      ? (isFar && f === 3) || (!isFar && f === 1)
        ? 2
        : 0
      : 0;
    const ankle: Point = [x + walk, feet - 2 - lift],
      hip: Point = [x, 22 + torso];
    const knee: Point = [
      x + Math.round(walk * 0.5),
      Math.round((hip[1] + ankle[1]) / 2),
    ];
    const bare = a.wearing.garment === "tunic" || a.wearing.garment === "wrap",
      base = bare ? skin : lower,
      colors = isFar ? { ...base, base: base.shade } : base;
    p.limb([hip, knee, ankle], 4, colors);
    const footX = ankle[0] - 1;
    p.shape(
      [
        [footX, ankle[1]],
        [footX + 3, ankle[1]],
        [footX + 5, ankle[1] + 1],
        [footX + 5, ankle[1] + 3],
        [footX, ankle[1] + 3],
      ],
      leather,
    );
    p.rect(footX + 1, ankle[1] + 1, 2, 1, isFar ? leather.shade : leather.base);
  };
  leg(true);
  leg(false);
  ctx.translate(lean, 0);
  if (a.wearing.cloak) {
    const sway = moving ? Math.sign(stride) : 0;
    p.shape(
      [
        [side ? 5 : 4 - wide, 13],
        [side ? 10 : 16 + wide, 13],
        [side ? 9 : 18 + wide, 27 + torso],
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
  const left = side ? 6 - wide : 4 - wide,
    right = (side ? 15 + wide : 16 + wide) - narrow;
  const long = ["robe", "dress", "coat", "skirt", "long-tunic"].includes(
      a.wearing.garment,
    ),
    hem =
      a.wearing.garment === "long-tunic"
        ? 26 + torso
        : long
          ? 28 + torso
          : 24 + torso;
  const flare = ["dress", "skirt"].includes(a.wearing.garment)
    ? 2
    : long
      ? 1
      : 0;
  const waist = a.bodyShape === "tapered" ? 1 : 0;
  const belly = a.bodyShape === "rounded" ? 1 : 0;
  const hemLift =
    a.wearing.hem === "slanted" ? 2 : stance === "relaxed" ? 1 : 0;
  p.group(cloth, () => {
    p.shape(
      [
        [left + 2, 12],
        [right - 2, 12],
        [right, 15 - inhale],
        [right - waist + belly, 19 + torso],
        [right + flare, hem - 1 - hemLift],
        [right - 1, hem],
        [left - flare, hem],
        [left - 1, hem - 2],
        [left + waist - belly, 19 + torso],
        [left, 15 - inhale],
      ],
      cloth,
    );
    if (sleeves !== "none") {
      p.ribbon(nearArm.sleeve, sleeves === "loose" ? 5 : 4, cloth);
      p.ribbon(farArm.sleeve, sleeves === "loose" ? 5 : 4, cloth);
    }
  });
  // Shoulder light flows into the sleeve; only a short underarm fold separates surfaces.
  if (sleeves !== "none") {
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
  p.line([left + 1, 16], [left + 1, hem - 3], cloth.light);
  p.line([right - 2, 17], [right - 2, hem - 2], cloth.shade);
  if (long) {
    p.line([left + 3, 23 + torso], [left + 2, hem - 2], cloth.shade);
    p.line([left, hem - 2], [right - 1, hem - 2], a.wearing.trim);
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
        [right + flare, hem - 1],
        [left - flare, hem],
      ],
      lower,
    );
    p.line([left + 2, 24 + torso], [left + 1, hem - 2], lower.light);
    p.line([right - 3, 24 + torso], [right - 2, hem - 2], lower.shade);
  }
  if (a.wearing.hem === "split")
    p.rect(side ? right - 2 : 10, hem - 2, 1, 2, lower.shade);
  p.rect(left, 22 + torso, right - left, 1, leather.edge);
  p.rect(side ? right - 2 : 10, 22 + torso, 2, 1, a.wearing.trim);
  // Neck is a separate warm shadow between head and garment.
  p.rect(side ? 11 : 8, 12, side ? 3 : 5, 3, skin.shade);
  p.rect(side ? 12 : 9, 13, 2, 1, skin.base);
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
  ctx.save();
  if (stance === "stooped") ctx.translate(1, 1);
  drawHead(p, a, side, back, pose, f);
  ctx.restore();
  if (a.wearing.necklace && !back) {
    if (side) p.line([13, 15], [14, 17], a.wearing.trim);
    else {
      p.line([7, 15], [10, 17], a.wearing.trim);
      p.line([10, 17], [13, 15], a.wearing.trim);
    }
    p.rect(side ? 14 : 10, 18, 1, 1, "#ddbd70");
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
