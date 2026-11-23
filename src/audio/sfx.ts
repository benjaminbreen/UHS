import type { HitClass, ReactionKind, ToolClass } from "../core/reactions";

/** One synthesized layer: a filtered noise burst or a decaying tone. A sound is
 * a list of these, built fresh each time so no two plays are identical. */
export type Layer = {
  kind: "noise" | "tone";
  /** Seconds after the sound starts. */
  at: number;
  dur: number;
  gain: number;
  freq: number;
  /** Where the pitch or filter glides to over `dur`. */
  to?: number;
  q?: number;
  filter?: BiquadFilterType;
  wave?: OscillatorType;
  attack?: number;
};
export type Sound = Layer[];

const rand = (a: number, b: number) => a + Math.random() * (b - a);
/** A value wobbled by a few percent, so repeats do not sound stamped out. */
const vary = (x: number, spread = 0.07) => x * rand(1 - spread, 1 + spread);
export const noise = (
  at: number,
  dur: number,
  gain: number,
  freq: number,
  rest: Partial<Layer> = {},
): Layer => ({
  kind: "noise",
  at,
  dur,
  gain,
  freq: vary(freq),
  filter: "bandpass",
  q: 1,
  ...rest,
});
export const tone = (
  at: number,
  dur: number,
  gain: number,
  freq: number,
  rest: Partial<Layer> = {},
): Layer => ({ kind: "tone", at, dur, gain, freq, wave: "sine", ...rest });
const shift = (sound: Sound, by: number, gain = 1): Sound =>
  sound.map((l) => ({ ...l, at: l.at + by, gain: l.gain * gain }));

/** Struck-object partials: inharmonic, so it rings rather than sings. */
export function ring(at: number, base: number, dur: number, gain: number): Sound {
  const f = vary(base, 0.05);
  return [1, 2.76, 5.4, 8.93].map((ratio, i) =>
    tone(at, dur / (1 + i * 0.7), gain / (1 + i * 1.3), f * ratio),
  );
}
/** A run of short grains: grit under a dragged load, debris settling. */
function grains(
  at: number,
  span: number,
  count: number,
  make: (t: number, i: number) => Layer,
): Sound {
  return Array.from({ length: count }, (_, i) =>
    make(at + (span * (i + rand(0, 0.7))) / count, i),
  );
}
const bubble = (at: number, low: number, gain: number) =>
  tone(at, 0.06, gain, vary(low, 0.2), { to: low * 2.1, attack: 0.008 });

/** What a surface sounds like when something comes down on it. `weight` runs
 * from a fingertip (0.3) to a boulder (1.6). */
function body(hit: HitClass, weight: number): Sound {
  const g = Math.min(1.2, weight);
  const low = 1 / (0.75 + weight * 0.25);
  switch (hit) {
    case "rock":
    case "stone":
      return [
        noise(0, 0.035, 0.3 * g, 2600, { q: 2.5 }),
        tone(0, 0.07, 0.26 * g, vary(880) * low, { to: 640, wave: "triangle" }),
        tone(0, 0.09, 0.22 * g, 150 * low, { to: 95 }),
      ];
    case "metal":
      return [
        noise(0, 0.02, 0.22 * g, 4200, { q: 2 }),
        ...ring(0, 540 * low, 0.75, 0.2 * g),
      ];
    case "tree":
      return [
        ...body("trunk", weight),
        noise(0.07, 0.3, 0.08 * g, 5200, { filter: "highpass", attack: 0.05 }),
      ];
    case "trunk":
      return [
        tone(0, 0.13, 0.4 * g, vary(175) * low, { to: 105 }),
        noise(0, 0.04, 0.2 * g, 850, { q: 2 }),
      ];
    case "timber":
      return [
        tone(0, 0.09, 0.32 * g, vary(330) * low, { to: 270 }),
        tone(0, 0.045, 0.12 * g, vary(690) * low),
        noise(0, 0.025, 0.14 * g, 1800, { q: 1.5 }),
      ];
    case "brush":
      return [
        noise(0, 0.2, 0.2 * g, 2200, { to: 4600, q: 0.8, attack: 0.02 }),
        noise(0.05, 0.12, 0.1 * g, 3400, { q: 1.2, attack: 0.015 }),
      ];
    case "grass":
      return [
        noise(0, 0.17, 0.15 * g, 3600, { to: 6400, q: 0.7, attack: 0.025 }),
      ];
    case "crop":
      return [
        noise(0, 0.15, 0.17 * g, 3000, { to: 5200, q: 0.9, attack: 0.015 }),
        ...grains(0.02, 0.12, 3, (t) =>
          noise(t, 0.018, 0.1 * g, 4800, { q: 3 }),
        ),
      ];
    case "fiber":
      return [
        noise(0, 0.08, 0.26 * g, 850, { filter: "lowpass" }),
        noise(0.01, 0.12, 0.08 * g, 2800, { attack: 0.02 }),
      ];
    case "pottery":
      return [
        noise(0, 0.02, 0.2 * g, 3800, { q: 2 }),
        tone(0, 0.11, 0.2 * g, vary(1350), { wave: "triangle" }),
        tone(0, 0.08, 0.11 * g, vary(2250)),
        tone(0, 0.14, 0.12 * g, vary(410) * low),
      ];
    case "water":
      return [
        noise(0, 0.32, 0.3 * g, 1500, { to: 420, q: 0.8, attack: 0.006 }),
        noise(0.03, 0.2, 0.1 * g, 4200, { filter: "highpass", attack: 0.02 }),
        ...grains(0.06, 0.24, 3, (t) => bubble(t, rand(420, 760), 0.11 * g)),
      ];
    case "marsh":
      return [
        noise(0, 0.24, 0.32 * g, 620, { filter: "lowpass", attack: 0.012 }),
        bubble(0.07, 210, 0.2 * g),
        bubble(0.17, 300, 0.1 * g),
      ];
    case "sand":
      return [
        noise(0, 0.16, 0.2 * g, 3400, { q: 0.6, attack: 0.012 }),
        tone(0, 0.06, 0.12 * g, 110 * low, { to: 70 }),
      ];
    case "snow":
      return [
        ...grains(0, 0.07, 3, (t) =>
          noise(t, 0.045, 0.2 * g, 1900, { q: 1.6 }),
        ),
        noise(0, 0.12, 0.18 * g, 420, { filter: "lowpass", attack: 0.008 }),
      ];
    case "fire":
      return [
        noise(0, 0.22, 0.2 * g, 320, { filter: "lowpass", attack: 0.03 }),
        ...grains(0.02, 0.26, 5, (t) =>
          noise(t, 0.012, rand(0.08, 0.2) * g, 5200, { filter: "highpass" }),
        ),
      ];
    case "creature":
      return [
        tone(0, 0.1, 0.34 * g, vary(115) * low, { to: 68 }),
        noise(0, 0.05, 0.2 * g, 750, { filter: "lowpass" }),
      ];
    case "soil":
      return [
        noise(0, 0.09, 0.26 * g, 520, { filter: "lowpass" }),
        tone(0, 0.09, 0.26 * g, 92 * low, { to: 58 }),
      ];
    default:
      return [];
  }
}
/** The implement moving through the air, up to the moment it arrives. */
function air(tool: ToolClass, gain = 1): Sound {
  switch (tool) {
    case "blade":
      return [
        noise(0, 0.11, 0.13 * gain, 1900, { to: 5200, q: 4, attack: 0.03 }),
      ];
    case "blunt":
      return [
        noise(0, 0.15, 0.15 * gain, 480, { to: 1250, q: 1.6, attack: 0.05 }),
      ];
    case "haft":
      return [
        noise(0, 0.12, 0.12 * gain, 900, { to: 2300, q: 2.6, attack: 0.04 }),
      ];
    case "bare":
      return [
        noise(0, 0.08, 0.05 * gain, 650, { to: 1100, q: 1.5, attack: 0.03 }),
      ];
    default:
      return [];
  }
}
const HARD: HitClass[] = ["rock", "stone", "metal"];
const LEAFY: HitClass[] = ["brush", "grass", "crop", "fiber"];
const CONTACT = 0.035;

export function projectileRelease(kind: "arrow" | "spear" | "stone" | "crossbow" | "musket" | "rifle" | "blowgun"): Sound {
  // The trigger's clack, the heavy prod slamming forward.
  if (kind === "crossbow")
    return [
      noise(0, 0.025, 0.22, 2800, { q: 1 }),
      tone(0, 0.09, 0.2, vary(140), { to: 85, wave: "triangle" }),
      tone(0.005, 0.1, 0.12, vary(420), { to: 260, wave: "triangle" }),
    ];
  // Black powder: a deep boom with a rough crackle on its front.
  if (kind === "musket")
    return [
      noise(0, 0.06, 0.3, 3000, { q: 0.7 }),
      noise(0, 0.45, 0.5, 900, { to: 240, filter: "lowpass", attack: 0.003 }),
      tone(0, 0.3, 0.4, vary(70), { to: 38 }),
    ];
  // Smokeless powder: a sharp crack, less body.
  if (kind === "rifle")
    return [
      noise(0, 0.08, 0.45, 2400, { q: 0.7 }),
      noise(0, 0.22, 0.3, 700, { to: 260, filter: "lowpass", attack: 0.002 }),
      tone(0, 0.15, 0.25, vary(95), { to: 50 }),
    ];
  // Hardly a sound at all: a short puff of breath.
  if (kind === "blowgun")
    return [
      noise(0, 0.07, 0.12, 1100, { to: 500, filter: "lowpass", attack: 0.01 }),
      noise(0.01, 0.04, 0.04, 3600, { q: 1.2 }),
    ];
  // The cord snapping straight, then the stone's whine going away.
  if (kind === "stone")
    return [
      noise(0, 0.03, 0.2, 4200, { q: 1.4 }),
      tone(0.01, 0.16, 0.07, vary(1500), { to: 700, wave: "sine" }),
    ];
  return kind === "arrow"
    ? [
        noise(0, 0.018, 0.16, 2600, { q: 0.8 }),
        tone(0, 0.13, 0.28, vary(310), { to: 175, wave: "triangle" }),
        noise(0.012, 0.11, 0.12, 3500, { to: 1400, q: 2 }),
      ]
    : [
        noise(0, 0.16, 0.17, 850, { to: 2600, q: 2.2, attack: 0.035 }),
        tone(0.02, 0.1, 0.08, 130, { to: 75 }),
      ];
}

/** The small brass bells on a hawk's legs, which tell the falconer where it is. */
export function hawkBells(): Sound {
  return [...ring(0, 2600, 0.3, 0.05), ...ring(0.09, 2950, 0.25, 0.04), ...ring(0.2, 2600, 0.2, 0.03)];
}

export function projectileImpact(kind: "arrow" | "spear" | "ball", hit: HitClass): Sound {
  if (kind === "ball") return [noise(0, 0.03, 0.14, 1600, { q: 1.5 }), ...body(hit, 0.4)];
  const weight = kind === "spear" ? 0.9 : 0.5;
  return [
    ...body(hit, weight),
    noise(0, hit === "creature" ? 0.045 : 0.025, kind === "spear" ? 0.16 : 0.1,
      hit === "creature" ? 1200 : 2300, { to: 650, q: 2 }),
    ...(hit === "soil" || hit === "grass" || hit === "sand"
      ? [noise(0.025, 0.13, kind === "spear" ? 0.12 : 0.07, 700,
          { to: 330, filter: "lowpass" as const })]
      : []),
    // An arrow that sticks: a dull thunk, then the shaft shivering, two close
    // pitches beating at about the rate the drawn tail wags.
    ...(kind === "arrow" && hit !== "creature" && hit !== "water" && !HARD.includes(hit)
      ? [
          tone(0, 0.07, 0.2, vary(170), { to: 95, wave: "triangle" }),
          tone(0.03, 0.26, 0.035, 250, { wave: "triangle" }),
          tone(0.03, 0.26, 0.035, 262, { wave: "triangle" }),
        ]
      : []),
  ];
}

/** One turn of a sling overhead: a soft whoom that rises as it speeds up. */
export function slingWhirl(speed: number): Sound {
  return [noise(0, 0.11, 0.05 + speed * 0.05, 380 + speed * 420, { to: 900 + speed * 600, q: 1.8, attack: 0.05 })];
}

/** A swing or a thrown thing arriving: the air, then what the implement and
 * the surface make of each other. */
export function strike(
  tool: ToolClass,
  hit: HitClass,
  kind: ReactionKind,
  damaged = false,
): Sound {
  const sound = air(tool, hit === "air" ? 1.5 : 1);
  if (hit === "air") return sound;
  const at = tool === "thrown" ? 0 : CONTACT;
  const add = (layers: Sound, gain = 1) =>
    sound.push(...shift(layers, at, gain));
  if (tool === "bare") {
    // A hand parts leaves and pats anything harder; it never clacks.
    if (LEAFY.includes(hit)) add(body(hit, 0.5), 0.6);
    else if (hit === "water" || hit === "marsh") add(body(hit, 0.6), 0.7);
    else
      add([
        noise(0, 0.04, 0.2, 1300, { filter: "lowpass" }),
        tone(0, 0.05, 0.14, vary(HARD.includes(hit) ? 240 : 170), { to: 120 }),
      ]);
  } else {
    const weight =
      tool === "blunt"
        ? 1.3
        : tool === "thrown"
          ? 1.1
          : tool === "haft"
            ? 0.9
            : 1;
    add(body(hit, weight), damaged ? 1.15 : 1);
    if (tool === "blade" && HARD.includes(hit)) add(ring(0, 2300, 0.22, 0.09));
    else if (
      tool === "blade" &&
      (hit === "tree" || hit === "trunk" || hit === "timber")
    )
      add([noise(0, 0.03, 0.2, 2600, { q: 2 })]);
    else if (tool === "blade" && LEAFY.includes(hit))
      add([noise(0, 0.05, 0.12, 6200, { filter: "highpass" })]);
    else if (tool === "blunt") add([tone(0, 0.1, 0.14, 78, { to: 46 })]);
    else if (tool === "haft" && HARD.includes(hit))
      add([tone(0, 0.05, 0.14, vary(1150), { wave: "triangle" })]);
  }
  if (kind === "shatter" || kind === "crack")
    add(debris(hit, kind === "shatter"));
  if (kind === "topple")
    add([
      tone(0.16, 0.2, 0.34, 70, { to: 42 }),
      ...grains(0.18, 0.2, 3, (t) => noise(t, 0.04, 0.12, 900, { q: 2 })),
    ]);
  return sound;
}
/** Pieces coming away and settling. */
function debris(hit: HitClass, full: boolean): Sound {
  const count = full ? 6 : 2;
  if (hit === "pottery")
    return grains(0.03, full ? 0.4 : 0.1, count, (t, i) =>
      tone(t, 0.07, 0.13 / (1 + i * 0.25), rand(1500, 3600), {
        wave: "triangle",
      }),
    );
  if (hit === "timber" || hit === "tree" || hit === "trunk" || hit === "fiber")
    return [
      noise(0, 0.09, 0.22, 1400, { to: 600, q: 3 }),
      ...grains(0.05, full ? 0.3 : 0.08, count, (t, i) =>
        tone(t, 0.05, 0.12 / (1 + i * 0.3), rand(240, 520)),
      ),
    ];
  return [
    ...(full ? [tone(0, 0.22, 0.18, 84, { to: 44 })] : []),
    ...grains(0.04, full ? 0.42 : 0.1, count, (t, i) =>
      tone(t, 0.04, 0.15 / (1 + i * 0.3), rand(500, 1300), {
        wave: "triangle",
      }),
    ),
    noise(0.02, full ? 0.35 : 0.1, 0.1, 1800, { to: 700, attack: 0.02 }),
  ];
}

export type ToolWork =
  | "hit"
  | "fell"
  | "cut"
  | "buck"
  | "dig"
  | "reap"
  | "mine"
  | "shatter"
  | "douse"
  | "fill";
/** A tool doing its own job. */
export function work(kind: ToolWork): Sound {
  switch (kind) {
    case "fell":
      return [
        ...strike("blade", "trunk", "thud", true),
        // The hinge tearing, the crown coming down, the ground taking it.
        noise(0.08, 0.5, 0.2, 950, { to: 240, q: 7, attack: 0.04 }),
        noise(0.3, 0.4, 0.14, 4200, { filter: "highpass", attack: 0.15 }),
        tone(0.62, 0.3, 0.42, 74, { to: 40 }),
        noise(0.62, 0.22, 0.2, 2600, { to: 900, q: 0.7 }),
      ];
    case "dig":
      return [
        noise(0, 0.13, 0.22, 1700, { to: 650, q: 1.4, attack: 0.01 }),
        ...shift(body("soil", 1.1), 0.06),
        ...grains(0.16, 0.12, 3, (t) =>
          noise(t, 0.03, 0.07, 700, { filter: "lowpass" }),
        ),
      ];
    case "reap":
      return strike("blade", "crop", "swish");
    case "mine":
      return [
        ...strike("blunt", "rock", "thwock", true),
        ...shift(ring(0, 1900, 0.3, 0.1), CONTACT),
      ];
    case "shatter":
      return strike("blunt", "rock", "shatter", true);
    // A pailful thrown: the slap of water, then the fire hissing under it.
    case "douse":
      return [
        noise(0, 0.12, 0.12, 900, { to: 380, q: 1, attack: 0.015 }),
        noise(0.05, 0.4, 0.065, 3400, { to: 1800, q: 0.55, attack: 0.04 }),
      ];
    case "fill":
      return [
        noise(0, 0.28, 0.09, 900, { to: 450, filter: "lowpass", attack: 0.035 }),
        bubble(0.07, 270, 0.025),
      ];
    default:
      return strike(
        "blade",
        kind === "buck" ? "timber" : "trunk",
        "thud",
        true,
      );
  }
}

/** A load dragged one cell over the ground, or straining against it. */
export function scrape(
  ground: HitClass,
  refused?: "wheels" | "heavy" | "wall",
): Sound {
  if (refused === "wheels")
    return [
      tone(0, 0.09, 0.14, vary(410), { to: 360, wave: "triangle" }),
      tone(0.07, 0.08, 0.1, vary(300), { to: 330, wave: "triangle" }),
      noise(0, 0.05, 0.1, 1200, { q: 2 }),
    ];
  if (refused)
    return [
      tone(0, 0.12, 0.3, 96, { to: 62 }),
      ...shift(scrape(ground), 0, 0.35).filter((l) => l.at < 0.1),
    ];
  const span = 0.26;
  const grit = (freq: number, q: number, gain: number, count = 6) =>
    grains(0, span, count, (t) =>
      noise(t, 0.07, rand(gain * 0.6, gain), freq, { q, attack: 0.01 }),
    );
  switch (ground) {
    case "stone":
    case "rock":
      return [
        noise(0, span, 0.28, 520, { q: 1.4, attack: 0.03 }),
        ...grit(1500, 3, 0.16, 7),
      ];
    case "timber":
      return [
        noise(0, span, 0.36, 300, { filter: "lowpass", attack: 0.03 }),
        ...grains(0, span, 3, (t) => tone(t, 0.05, 0.1, rand(240, 320))),
      ];
    case "sand":
      return [
        noise(0, span + 0.06, 0.12, 3200, { to: 2400, q: 0.6, attack: 0.05 }),
      ];
    case "snow":
      return [
        noise(0, span, 0.16, 440, { filter: "lowpass", attack: 0.03 }),
        ...grit(1900, 1.8, 0.16, 5),
      ];
    case "water":
      return [
        noise(0, span + 0.1, 0.22, 900, { to: 500, q: 0.7, attack: 0.06 }),
        bubble(0.12, 480, 0.08),
        bubble(0.22, 620, 0.06),
      ];
    case "marsh":
      return [
        noise(0, span + 0.06, 0.26, 520, { filter: "lowpass", attack: 0.05 }),
        bubble(0.1, 190, 0.16),
        bubble(0.24, 260, 0.1),
      ];
    case "grass":
      return [
        noise(0, span, 0.17, 460, { filter: "lowpass", attack: 0.04 }),
        noise(0.02, span, 0.09, 3800, { q: 0.7, attack: 0.06 }),
      ];
    default:
      return [
        noise(0, span, 0.22, 480, { filter: "lowpass", attack: 0.04 }),
        ...grit(1100, 1.5, 0.08, 4),
      ];
  }
}

/** Hands and feet working up a trunk, a wall or a stack: a few scuffs and a
 * settle at the top. `down` is the same work in reverse, softer. */
export function scramble(ground: HitClass, down = false): Sound {
  const span = 0.4;
  const leafy = ground === "tree" || ground === "brush" || ground === "crop";
  const g = down ? 0.75 : 1;
  return [
    ...grains(0, span, 5, (t) =>
      noise(t, 0.1, rand(0.06, 0.12) * g, leafy ? 2400 : 1300, {
        q: leafy ? 1.1 : 2,
        attack: 0.015,
      }),
    ),
    ...(leafy
      ? [noise(0.05, 0.3, 0.07 * g, 4200, { q: 0.6, attack: 0.08 })]
      : []),
    ...shift(body(ground === "air" ? "soil" : ground, 0.45 * g), span * 0.8, 0.6),
  ];
}

/** Feet leaving the ground. */
export function takeoff(ground: HitClass): Sound {
  return [
    ...shift(body(ground === "air" ? "soil" : ground, 0.5), 0, 0.55),
    noise(0.01, 0.13, 0.06, 420, { to: 950, q: 1.5, attack: 0.04 }),
  ];
}
/** Feet coming back to it. `weight` 1 is a hop; a fall or a roll is 2. */
export function landing(ground: HitClass, weight = 1): Sound {
  const w = Math.min(2, weight);
  const soft = ground === "water" || ground === "marsh";
  return [
    ...shift(
      body(ground === "air" ? "soil" : ground, 0.7 + w * 0.3),
      0,
      0.75 + w * 0.2,
    ),
    ...(soft ? [] : [tone(0, 0.11, 0.12 * w, 84, { to: 50 })]),
    // A heavy landing scuffs on after the first contact.
    ...(w > 1.4 ? shift(scrape(ground), 0.09, 0.6) : []),
  ];
}
/** What a fungus does underfoot: a puffball breathes out, dry lichen
 * crackles, a fleshy cap squashes, a small one pops, a jelly one slurps. */
export type FungusStep = "puff" | "lichen" | "squish" | "pop" | "slime";
/** What dung does underfoot: a fresh pat splats, a crusted one cracks first,
 * a dry one crumbles, a horse pile squelches, pellets squeak. */
export type DungStep = "splat" | "crust" | "crumble" | "squelch" | "pellets";
type Through = HitClass | "bloom" | FungusStep | DungStep;
/** A run of bubbles, each rising: the pitch climbing is what makes it wet. */
const bubbles = (at: number, span: number, n: number, low: number, gain: number) =>
  grains(at, span, n, (t) => bubble(t, rand(low, low * 1.8), gain));
/** A cap or pat giving way: a soft thud under a narrow resonance sweeping
 * down. A broad noise burst here sounds like cardboard, not flesh. */
const squash = (at: number, g: number, low = 520) => [
  tone(at, 0.08, 0.16 * g, rand(110, 135), { to: 55, attack: 0.003 }),
  noise(at, 0.09, 0.08 * g, 650, { filter: "lowpass", attack: 0.004 }),
  noise(at + 0.005, 0.17, 0.3 * g, low * 1.7, { to: low * 0.5, q: 9, attack: 0.006 }),
  ...bubbles(at + 0.02, 0.09, 3, low * 0.6, 0.07 * g),
];
/** The foot pulling free: suction rising. */
const suck = (at: number, g: number) => [
  noise(at, 0.13, 0.22 * g, 300, { to: 1400, q: 8, attack: 0.03 }),
  tone(at + 0.02, 0.1, 0.07 * g, rand(140, 180), { to: rand(420, 520), wave: "triangle", attack: 0.02 }),
  ...bubbles(at + 0.08, 0.06, 2, 420, 0.05 * g),
];
/** Each squish is one of several, so a field of caps never repeats itself. */
const squishes: ((g: number) => Sound)[] = [
  (g) => squash(0, g),
  (g) => [
    ...squash(0, g, 620),
    tone(0.03, 0.08, 0.08 * g, rand(320, 420), { to: rand(900, 1150), attack: 0.01 }),
  ],
  (g) => [...squash(0, g, 480), ...squash(0.1, 0.65 * g, 380)],
  (g) => [...squash(0, g), ...suck(0.1, g)],
  (g) => [...squash(0, 1.1 * g, 420), ...bubbles(0.08, 0.22, 6, 260, 0.06 * g)],
];
/** Leaves and stalks parting round the legs, laid over the footfall. */
function brushing(through: Through, g: number): Sound {
  switch (through) {
    case "puff":
      return [
        noise(0, 0.35, 0.2 * g, 700, { to: 220, q: 0.5, attack: 0.01 }),
        noise(0.02, 0.25, 0.08 * g, 1800, { to: 800, q: 0.6, attack: 0.03 }),
      ];
    case "lichen":
      return grains(0, 0.14, 7, (t) => noise(t, 0.014, 0.12 * g, vary(4200, 0.3), { q: 3 }));
    case "squish":
      return squishes[Math.floor(Math.random() * squishes.length)](g);
    case "pop":
      return [
        noise(0, 0.012, 0.14 * g, 3200, { q: 4 }),
        tone(0.004, 0.035, 0.1 * g, rand(800, 1000), { to: rand(380, 450), attack: 0.002 }),
        bubble(0.03, rand(500, 650), 0.05 * g),
      ];
    case "slime":
      return [
        ...squash(0, 0.8 * g, 460),
        noise(0.02, 0.26, 0.24 * g, 380, { to: 1500, q: 9, attack: 0.06 }),
        tone(0.04, 0.22, 0.07 * g, rand(110, 140), { to: rand(360, 420), wave: "triangle", attack: 0.05 }),
        ...grains(0.12, 0.2, 3, (t) => bubble(t, rand(300, 560), 0.06 * g)),
      ];
    case "splat":
      return [
        ...squash(0, 1.4 * g, 380),
        noise(0.02, 0.22, 0.12 * g, 520, { filter: "lowpass", attack: 0.01 }),
        ...bubbles(0.06, 0.18, 5, 200, 0.08 * g),
        ...suck(0.2, 1.2 * g),
        // Now and then the pat lets out air on the way.
        ...(Math.random() < 0.25
          ? [tone(0.06, 0.16, 0.035 * g, rand(70, 90), { to: 55, wave: "sawtooth", attack: 0.02 })]
          : []),
      ];
    case "crust":
      return [
        ...grains(0, 0.04, 4, (t) => noise(t, 0.012, 0.12 * g, vary(3000, 0.3), { q: 3 })),
        ...shift(brushing("splat", 0.7 * g), 0.035),
      ];
    case "crumble":
      return [
        noise(0, 0.06, 0.08 * g, 380, { q: 0.9, attack: 0.004 }),
        ...grains(0.01, 0.12, 6, (t) => noise(t, 0.016, 0.07 * g, vary(1800, 0.4), { q: 2.5 })),
      ];
    case "squelch":
      return [
        tone(0, 0.1, 0.12 * g, rand(200, 240), { to: 90, wave: "triangle", attack: 0.004 }),
        ...squash(0, 1.2 * g, 460),
        ...squash(0.1, 0.7 * g, 340),
        bubble(0.08, rand(220, 280), 0.08 * g),
        bubble(0.17, rand(300, 380), 0.06 * g),
      ];
    case "pellets":
      return grains(0, 0.1, 4, (t) =>
        tone(t, 0.03, 0.05 * g, rand(700, 1100), { to: rand(1300, 1700), attack: 0.003 }),
      ).flatMap((l) => [noise(l.at, 0.01, 0.06 * g, 2400, { q: 3 }), l]);
    case "bloom":
      return [noise(0.02, 0.12, 0.03 * g, 5200, { to: 7200, q: 0.6, attack: 0.04 })];
    case "brush":
      return [
        noise(0, 0.2, 0.06 * g, 2400, { to: 4000, q: 0.7, attack: 0.05 }),
        ...grains(0.04, 0.14, 2, (t) => noise(t, 0.02, 0.035 * g, 3600, { q: 2.5 })),
      ];
    case "crop":
      return [
        noise(0.01, 0.18, 0.055 * g, 3300, { to: 5400, q: 0.8, attack: 0.04 }),
        ...grains(0.05, 0.12, 3, (t) => noise(t, 0.014, 0.03 * g, 5200, { q: 3 })),
      ];
    default:
      return [];
  }
}
/** A walking footfall, with whatever it pushes through. "paddy" is ankle-deep water over mud; "furrow" is tilled soil;
 * "sodden" is any other soft ground in heavy rain. */
export function footstep(
  ground: HitClass | "paddy" | "furrow" | "sodden",
  running = false,
  through?: Through,
): Sound | undefined {
  const g = running ? 1.25 : 1;
  const step = footfall(ground, g);
  const leaves = through ? brushing(through, g) : [];
  return step || leaves.length ? [...(step ?? []), ...leaves] : undefined;
}
function footfall(ground: HitClass | "paddy" | "furrow" | "sodden", g: number): Sound | undefined {
  // The weight of the foot, under whatever the surface adds.
  const thump = (gain: number, hz: number) => tone(0, 0.06, gain * g, vary(hz, 0.1), { to: hz * 0.55, attack: 0.003 });
  const grit = (at: number, span: number, count: number, gain: number, hz: number, q = 3) =>
    grains(at, span, count, (t) => noise(t, rand(0.008, 0.02), gain * g * rand(0.5, 1), vary(hz, 0.35), { q }));
  switch (ground) {
    case "paddy":
      return [
        noise(0, 0.12, 0.12 * g, vary(900, 0.2), { to: 420, q: 0.9, attack: 0.01 }),
        noise(0.05, 0.14, 0.09 * g, 480, { filter: "lowpass", attack: 0.03 }),
        bubble(rand(0.08, 0.14), rand(240, 380), 0.07 * g),
      ];
    // Mud: the foot sinks with a squelch and sometimes has to be pulled out.
    case "sodden":
      return [
        noise(0, 0.1, 0.09 * g, 520, { filter: "lowpass", attack: 0.015 }),
        ...squash(0, 0.35 * g, 560),
        ...(Math.random() < 0.35 ? suck(0.11, 0.3 * g) : []),
      ];
    case "marsh":
      return [
        ...squash(0, 0.55 * g, 420),
        bubble(rand(0.04, 0.09), rand(180, 280), 0.1 * g),
        ...(Math.random() < 0.5 ? suck(0.12, 0.45 * g) : []),
      ];
    // Tilled soil: loose clods giving way.
    case "furrow":
      return [
        thump(0.05, 100),
        noise(0, 0.08, 0.09 * g, 600, { filter: "lowpass", attack: 0.01 }),
        ...grit(0.01, 0.09, 4, 0.035, 2200, 2),
      ];
    case "water":
      return [
        noise(0, 0.15, 0.16 * g, vary(1100, 0.2), {
          to: 480,
          q: 0.9,
          attack: 0.008,
        }),
        bubble(rand(0.03, 0.08), rand(480, 820), 0.08 * g),
      ];
    case "grass":
      return [
        thump(0.035, 95),
        noise(0, 0.07, 0.045 * g, 500, { filter: "lowpass", attack: 0.012 }),
        noise(0, 0.11, 0.05 * g, vary(3200, 0.2), { to: 5200, q: 0.6, attack: 0.03 }),
      ];
    case "soil":
      return [
        thump(0.06, 120),
        noise(0, 0.06, 0.08 * g, vary(650, 0.15), { filter: "lowpass", attack: 0.005 }),
        ...grit(0.012, 0.07, 3, 0.03, 2600, 2),
      ];
    // Paving and flagged floors: the heel's hard click, then the sole.
    case "stone":
      return [
        noise(0, 0.014, 0.14 * g, vary(3200, 0.15), { q: 2, attack: 0.001 }),
        tone(0, 0.035, 0.08 * g, vary(950, 0.1), { to: 700, wave: "triangle", attack: 0.001 }),
        thump(0.06, 150),
        noise(0.045, 0.025, 0.06 * g, vary(2400, 0.2), { q: 1.5 }),
      ];
    // Bare rock and scree: a duller knock, and grit rolling under the sole.
    case "rock":
      return [
        noise(0, 0.02, 0.12 * g, vary(2200, 0.2), { q: 1.8, attack: 0.001 }),
        tone(0.02, 0.03, 0.035 * g, vary(1500, 0.3), { wave: "triangle" }),
        thump(0.06, 130),
        ...grit(0.01, 0.13, 5, 0.08, 3400, 4),
      ];
    case "timber":
      return [
        tone(0, 0.09, 0.09 * g, vary(170, 0.1), { to: 125, attack: 0.002 }),
        tone(0, 0.04, 0.035 * g, vary(420, 0.1)),
        noise(0, 0.03, 0.07 * g, vary(900, 0.15), { q: 1.8, attack: 0.002 }),
        // Now and then a board complains.
        ...(Math.random() < 0.1
          ? [tone(0.05, 0.14, 0.012 * g, rand(520, 760), { to: rand(600, 900), wave: "sawtooth", attack: 0.04 })]
          : []),
      ];
    case "fiber":
      return [
        noise(0, 0.08, 0.09 * g, 420, { filter: "lowpass", attack: 0.01 }),
        noise(0.01, 0.06, 0.04 * g, vary(2000, 0.2), { q: 0.8, attack: 0.015 }),
      ];
    // Sand has no click in it: the foot slides in and the grains settle after.
    case "sand":
      return [
        thump(0.03, 80),
        noise(0, 0.16, 0.075 * g, vary(2200, 0.15), { to: 1100, q: 0.5, attack: 0.035 }),
        noise(0.02, 0.12, 0.03 * g, 5200, { to: 3000, q: 0.7, attack: 0.04 }),
        ...grit(0.09, 0.08, 2, 0.015, 4200, 2),
      ];
    case "snow":
      return [
        ...grains(0, 0.06, 3, (t) =>
          noise(t, 0.04, 0.12 * g, vary(1850, 0.15), { q: 1.7 }),
        ),
        noise(0, 0.1, 0.11 * g, 400, { filter: "lowpass", attack: 0.01 }),
      ];
    default:
      return undefined;
  }
}

// Every game-event sound is played on one soft plucked voice in D major
// pentatonic, so they read as a family rather than a collection.
const SCALE = [62, 64, 66, 69, 71];
const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
/** Degree 0 is D4; 5 is D5, and so on up. */
const degree = (n: number) => SCALE[((n % 5) + 5) % 5] + 12 * Math.floor(n / 5);
function pluck(at: number, n: number, gain: number, dur = 0.42): Sound {
  const f = hz(degree(n));
  return [
    tone(at, dur, gain, f, { attack: 0.004 }),
    tone(at, dur * 0.45, gain * 0.3, f * 2, { attack: 0.004 }),
    tone(at, dur * 0.2, gain * 0.1, f * 3.01),
    noise(at, 0.012, gain * 0.25, 3200, { q: 1 }),
  ];
}
const run = (notes: number[], gap: number, gain: number, dur?: number): Sound =>
  notes.flatMap((n, i) => pluck(i * gap, n, gain * (1 - i * 0.08), dur));

export function interfaceClick(kind: "open" | "close" | "tab"): Sound {
  const f = kind === "open" ? 760 : kind === "close" ? 520 : 650;
  return [
    tone(0, 0.045, 0.035, f, { to: f * 0.8, attack: 0.003 }),
    tone(0, 0.025, 0.009, f * 1.5, { attack: 0.002 }),
    noise(0, 0.018, 0.006, 1600, { filter: "lowpass", attack: 0.003 }),
  ];
}

export const events = {
  preyCaught: () => run([7, 9, 12], 0.065, 0.09, 0.28),
  /** Something taken up: a pop and a rising fifth. */
  pickup: () => [
    tone(0, 0.05, 0.16, 320, { to: 760, attack: 0.004 }),
    ...shift(run([8, 10], 0.07, 0.2), 0.03),
  ],
  drop: () => [
    ...run([7, 5], 0.07, 0.13, 0.25),
    ...shift(body("soil", 0.6), 0.08, 0.6),
  ],
  /** A find worth noticing: the full rising figure. */
  gather: () => run([7, 8, 10, 12], 0.075, 0.2, 0.55),
  harvest: () => [
    ...body("brush", 0.7),
    ...shift(run([7, 8, 10], 0.07, 0.17), 0.09),
  ],
  drink: () => [
    tone(0, 0.09, 0.2, 430, { to: 250, attack: 0.01 }),
    tone(0.17, 0.09, 0.18, 400, { to: 235, attack: 0.01 }),
    ...pluck(0.34, 11, 0.12, 0.3),
  ],
  trade: () => [
    ...ring(0, 2100, 0.3, 0.07),
    ...shift(ring(0, 2500, 0.35, 0.07), 0.09),
    ...shift(run([8, 10], 0.09, 0.15), 0.04),
  ],
  use: () => run([6, 8], 0.08, 0.17, 0.3),
  rest: () => run([10, 8, 7, 5], 0.2, 0.13, 0.9),
  talk: () => run([8, 7], 0.09, 0.12, 0.25),
  warm: () => run([7, 8, 10], 0.1, 0.17, 0.5),
  anger: () => [
    tone(0, 0.3, 0.12, hz(50), { wave: "triangle" }),
    tone(0, 0.3, 0.1, hz(53), { wave: "triangle" }),
    ...body("creature", 0.7),
  ],
  alarm: () => run([8, 12], 0.06, 0.18, 0.18),
  select: () => pluck(0, 8, 0.17, 0.22),
  /** Speech patter: low, brief, and never the same note twice running. */
  blip: () => [
    tone(0, 0.045, 0.06, hz(degree(Math.floor(rand(0, 4)))), {
      wave: "triangle",
      attack: 0.004,
    }),
  ],
  hurt: () => [
    ...body("creature", 1.4),
    tone(0, 0.25, 0.14, hz(57), { wave: "triangle" }),
    tone(0, 0.25, 0.12, hz(58), { wave: "triangle" }),
  ],
  hour: () => run([5, 8, 12], 0.24, 0.15, 1.2),
  /** The moment of death: a low knell under a slow fall down D minor. */
  death: () => [
    tone(0, 2.8, 0.14, hz(38), { wave: "triangle", attack: 0.01 }),
    ...ring(0, hz(62), 2.4, 0.05),
    ...[69, 65, 62, 57].map((m, i) => tone(0.4 + i * 0.45, 1.5, 0.1 - i * 0.015, hz(m), { wave: "triangle", attack: 0.02 })),
  ],
  /** A skill rising: a quick climb that opens out and rings. */
  levelUp: () => [
    ...run([5, 7, 9, 12], 0.07, 0.2, 0.5),
    ...pluck(0.3, 14, 0.16, 1.1),
    ...pluck(0.3, 9, 0.1, 1.1),
  ],
  /** A technique taken: two notes settling. */
  learn: () => [...run([9, 12], 0.09, 0.18, 0.7), ...pluck(0.2, 16, 0.08, 0.9)],
  door: () => [
    tone(0, 0.035, 0.055, 1050, { to: 700, wave: "triangle", attack: 0.004 }),
    noise(0.02, 0.12, 0.055, 590, { to: 360, q: 0.9, attack: 0.02 }),
  ],
  doorClose: () => [
    noise(0, 0.075, 0.065, 460, { q: 0.9, attack: 0.005 }),
    tone(0.05, 0.028, 0.045, 900, { to: 640, wave: "triangle" }),
  ],
  knock: () => [0, 0.14].flatMap((at) => [
    tone(at, 0.065, 0.065, vary(330), { to: 260, wave: "triangle" }),
    noise(at, 0.032, 0.04, 760, { q: 1.2 }),
  ]),
  boatLaunch: () => [
    noise(0, 0.16, 0.055, 570, { to: 320, q: 1, attack: 0.028 }),
    noise(0.09, 0.24, 0.095, 1000, { to: 520, filter: "lowpass", attack: 0.027 }),
  ],
  boatLand: () => [
    noise(0, 0.18, 0.08, 850, { to: 420, filter: "lowpass", attack: 0.02 }),
    noise(0.08, 0.13, 0.065, 560, { to: 290, q: 0.85, attack: 0.012 }),
  ],
} satisfies Record<string, () => Sound>;
export type EventId = keyof typeof events;

/** The railway. `near` is 0 at the edge of hearing, 1 on the platform. */
export const railway = {
  /** A steam whistle: three pipes sounding a chord over the rush of steam,
   * swelling in as the valve opens. */
  whistle: (near: number, long = false): Sound => {
    const dur = long ? 1.6 : 0.9;
    const base = vary(470, 0.04);
    return [
      ...[1, 1.26, 1.5].map((r) => tone(0, dur, 0.05 * near, base * r, { wave: "triangle", attack: 0.12, to: base * r * 1.01 })),
      noise(0, dur, 0.05 * near, 2400, { q: 0.8, attack: 0.1 }),
    ];
  },
  /** A diesel's two-tone horn. */
  horn: (near: number): Sound => [
    tone(0, 0.55, 0.05 * near, 311, { wave: "sawtooth", attack: 0.04 }),
    tone(0, 0.55, 0.04 * near, 370, { wave: "sawtooth", attack: 0.04 }),
    tone(0.62, 0.8, 0.05 * near, 311, { wave: "sawtooth", attack: 0.04 }),
    tone(0.62, 0.8, 0.04 * near, 262, { wave: "sawtooth", attack: 0.04 }),
  ],
  /** The guard's whistle: a pea trilling high and short. */
  guard: (near: number): Sound =>
    Array.from({ length: 9 }, (_, i) => tone(i * 0.07, 0.07, 0.035 * near, vary(2900, 0.02) * (i % 2 ? 1.04 : 1), { attack: 0.005 })),
  /** One exhaust beat: a soft chuff of steam from the chimney. */
  chuff: (near: number, hard: number): Sound => [
    noise(0, 0.16 + 0.1 * (1 - hard), 0.09 * near * (0.4 + hard * 0.6), 700 + hard * 500, { q: 0.7, to: 300, attack: 0.008 }),
    noise(0, 0.06, 0.04 * near * hard, 2200, { q: 1.2 }),
  ],
};

/** Fire. `near` is 0 at the edge of hearing, 1 standing beside it. */
export const fire = {
  /** Sap and resin popping over a low roar; call it every fraction of a
   * second while something burns, and no two will match. */
  crackle: (near: number): Sound => [
    ...Array.from({ length: 1 + Math.floor(rand(0, 4)) }, () =>
      noise(rand(0, 0.22), rand(0.006, 0.02), rand(0.03, 0.09) * near, rand(2200, 6500), {
        filter: "highpass",
        attack: 0.001,
      }),
    ),
    noise(0, 0.4, 0.035 * near, 260, { filter: "lowpass", attack: 0.12 }),
  ],
  /** The draw of air as something catches. */
  catch: (): Sound => [
    noise(0, 0.55, 0.22, 380, { to: 2600, q: 0.8, attack: 0.18 }),
    noise(0.15, 0.45, 0.08, 3400, { filter: "highpass", attack: 0.1 }),
  ],
  /** A roof going in: timbers giving, then the weight landing. */
  collapse: (): Sound => [
    noise(0, 0.25, 0.18, 1600, { to: 500, q: 2 }),
    noise(0.18, 1.1, 0.4, 220, { to: 70, filter: "lowpass", attack: 0.03 }),
    tone(0.2, 0.8, 0.28, 58, { to: 34, wave: "triangle" }),
    ...grains(0.45, 0.8, 9, (t) => noise(t, 0.03, 0.08, 1300, { q: 1.5 })),
  ],
};

/** What the sound lab auditions. */
/** Who is speaking. Voices differ by register, not by words: the game has no
 * recorded speech, so pitch and bite carry sex and age. */
export type VoiceKind = "child" | "woman" | "man" | "neutral";
const voiceBase: Record<VoiceKind, number> = {
  child: 470,
  woman: 320,
  man: 190,
  neutral: 260,
};
/** One syllable of speech patter. Annoyed voices are lower, harder and fall. */
export function voice(kind: VoiceKind, annoyed = false): Sound {
  const base = voiceBase[kind] * (annoyed ? 0.86 : 1) * rand(0.94, 1.06);
  const dur = annoyed ? 0.07 : 0.05;
  return [
    tone(0, dur, annoyed ? 0.1 : 0.06, base, {
      to: annoyed ? base * 0.7 : base * rand(0.98, 1.12),
      wave: annoyed ? "sawtooth" : "triangle",
      attack: 0.004,
    }),
    ...(annoyed
      ? [noise(0, 0.03, 0.035, base * 5, { q: 0.8 })]
      : []),
  ];
}
/** Walking into a person: cloth, a knock, and a word they did not choose. */
export function bumpPerson(kind: VoiceKind, annoyed = false): Sound {
  const base = voiceBase[kind] * rand(0.95, 1.05);
  return [
    noise(0, 0.09, 0.09, 700, { q: 0.7, attack: 0.006 }),
    ...body("creature", 0.5),
    tone(0.02, 0.13, annoyed ? 0.11 : 0.07, base, {
      to: base * (annoyed ? 0.66 : 0.8),
      wave: annoyed ? "sawtooth" : "triangle",
      attack: 0.008,
    }),
  ];
}
/** A baby's voice: small, high and soft. The cry is kept round and quiet, as
 * it repeats every few seconds for as long as the player leaves it. */
export const baby = {
  coo: (): Sound => {
    const f = vary(560, 0.08);
    return [
      tone(0, 0.16, 0.035, f, { to: f * 1.18, attack: 0.03 }),
      tone(0.2, 0.22, 0.03, f * 1.12, { to: f * 0.95, attack: 0.04 }),
    ];
  },
  laugh: (): Sound =>
    Array.from({ length: 4 }, (_, i) => {
      const f = vary(640 + i * 45, 0.05);
      return tone(i * 0.11, 0.08, 0.04, f, { to: f * 1.2, wave: "triangle", attack: 0.008 });
    }),
  fuss: (): Sound =>
    Array.from({ length: Math.round(rand(2, 3)) }, (_, i) => {
      const f = vary(590, 0.06);
      return tone(i * 0.21, 0.15, 0.035, f, { to: f * 0.84, wave: "triangle", attack: 0.02 });
    }),
  cry: (): Sound => {
    const f = vary(520, 0.06);
    return [
      tone(0, 0.5, 0.045, f * 0.9, { to: f * 1.08, wave: "triangle", attack: 0.07 }),
      tone(0.05, 0.42, 0.012, f * 2, { to: f * 2.1, attack: 0.08 }),
      tone(0.5, 0.3, 0.035, f * 1.05, { to: f * 0.7, wave: "triangle", attack: 0.01 }),
      noise(0.86, 0.12, 0.012, 1800, { q: 0.7, attack: 0.04 }),
    ];
  },
  sigh: (): Sound => [tone(0, 0.4, 0.025, 500, { to: 380, attack: 0.08 })],
};
/** One hummed note of a lullaby, a fifth under it once the baby is nearly gone. */
export function hum(freq: number, deep = false): Sound {
  return [
    tone(0, 1.5, 0.07, freq, { wave: "triangle", attack: 0.12 }),
    tone(0, 1.2, 0.03, freq * 2, { attack: 0.15 }),
    ...(deep ? [tone(0, 1.9, 0.045, freq * (2 / 3), { attack: 0.25 })] : []),
  ];
}

/** Broad shapes of animal. Species matter less than size and whether it flies. */
/** A dog close by: two or three sharp barks. */
export function bark(): Sound {
  const n = Math.round(rand(2, 3));
  return Array.from({ length: n }, (_, i) => {
    const at = i * vary(0.3, 0.15), f = vary(480, 0.15);
    return [
      tone(at, 0.12, 0.08, f, { to: f * 0.62, wave: "sawtooth", attack: 0.01 }),
      noise(at, 0.08, 0.05, 900, { q: 1.2 }),
    ];
  }).flat();
}
export type BeastVoice = "bird" | "critter" | "herd" | "beast";
/** Walking into an animal: its own call, plus the scuff of it moving off. */
export function bumpAnimal(kind: BeastVoice): Sound {
  const scuff = noise(0, 0.08, 0.07, 900, { q: 0.8, attack: 0.005 });
  switch (kind) {
    case "bird": {
      // Alarm call over the clap of wings.
      const f = vary(2600, 0.15);
      return [
        ...grains(0, 0.22, 4, (t) =>
          noise(t, 0.05, 0.06, vary(320, 0.2), { q: 0.5, attack: 0.01 }),
        ),
        tone(0.01, 0.06, 0.07, f, { to: f * 1.5, wave: "triangle" }),
        tone(0.1, 0.05, 0.05, f * 1.1, { to: f * 0.8, wave: "triangle" }),
      ];
    }
    case "critter": {
      const f = vary(1500, 0.2);
      return [
        scuff,
        tone(0, 0.07, 0.06, f, { to: f * 1.6, wave: "triangle", attack: 0.004 }),
      ];
    }
    case "herd": {
      // A bleat: one note with a fast wobble written as three short steps.
      const f = vary(430, 0.1);
      return [
        scuff,
        tone(0, 0.09, 0.09, f, { to: f * 1.1, wave: "sawtooth", attack: 0.01 }),
        tone(0.09, 0.07, 0.07, f * 1.08, { to: f * 0.94, wave: "sawtooth" }),
        tone(0.16, 0.1, 0.05, f * 0.96, { to: f * 0.85, wave: "sawtooth" }),
      ];
    }
    default: {
      // Something heavy: a low grunt you feel more than hear.
      const f = vary(120, 0.12);
      return [
        ...body("creature", 1.1),
        tone(0, 0.26, 0.12, f, { to: f * 0.82, wave: "sawtooth", attack: 0.02 }),
        tone(0, 0.26, 0.05, f * 2.02, { wave: "triangle", attack: 0.03 }),
      ];
    }
  }
}
/** A rabbit's hind foot on the ground: the warning, felt as much as heard. */
export function thump(): Sound {
  return [
    noise(0, 0.05, 0.07, 150, { q: 0.7, attack: 0.003 }),
    tone(0, 0.07, 0.06, vary(95), { to: 60 }),
  ];
}
/** A cock crowing at first light: three rising notes, then the long one,
 * held and falling away. `near` runs from 0, across the village, to 1. */
export function cockCrow(near = 1): Sound {
  const f = vary(520, 0.12),
    g = 0.02 + 0.05 * near;
  return [
    tone(0, 0.11, g * 0.7, f, { to: f * 1.25, wave: "sawtooth", attack: 0.02 }),
    tone(0.15, 0.1, g * 0.8, f * 1.3, { to: f * 1.4, wave: "sawtooth" }),
    tone(0.29, 0.13, g, f * 1.5, { to: f * 1.62, wave: "sawtooth" }),
    tone(0.46, 0.6, g, f * 1.62, { to: f * 1.05, wave: "sawtooth", attack: 0.03 }),
    tone(0.46, 0.6, g * 0.35, f * 3.2, { to: f * 2.1, wave: "triangle", attack: 0.03 }),
  ];
}
/** Ice underfoot and giving way. `creak` is the falling "pew" a sheet makes
 * when it takes a load: a crack, then pitch sliding down as it runs away. */
export const ice = {
  step: (running = false): Sound => [
    noise(0, 0.035, running ? 0.09 : 0.06, 3400, { filter: "highpass", q: 0.7 }),
    tone(0, 0.05, 0.025, vary(1500, 0.15), { to: 900 }),
    tone(0.005, 0.07, running ? 0.07 : 0.045, 150, { to: 80 }),
  ],
  slide: (): Sound => [
    noise(0, 0.34, 0.07, 2900, { to: 1900, q: 4, attack: 0.02 }),
    noise(0, 0.3, 0.035, 5200, { to: 3600, q: 3, attack: 0.03 }),
  ],
  skate: (): Sound => [
    noise(0, 0.26, 0.03, 5600, { to: 3900, q: 2.5, attack: 0.06 }),
    noise(0.01, 0.2, 0.012, 2400, { to: 1700, q: 5, attack: 0.05 }),
  ],
  creak: (): Sound => [
    noise(0, 0.03, 0.16, 2600, { q: 0.8 }),
    tone(0.01, 0.42, 0.11, vary(1050, 0.12), { to: 170 }),
    tone(0.07, 0.5, 0.06, vary(1500, 0.12), { to: 240 }),
    noise(0.16, 0.02, 0.07, 3400, { q: 1 }),
    tone(0.02, 0.6, 0.07, 62, { to: 44 }),
  ],
  plunge: (): Sound => [
    noise(0, 0.04, 0.22, 2200, { q: 0.7 }),
    noise(0.05, 0.03, 0.15, 3100, { q: 0.9 }),
    ...ring(0.03, 2100, 0.25, 0.05),
    ...grains(0.06, 0.3, 7, (t) => noise(t, 0.02, 0.07, rand(2400, 5200), { q: 3 })),
    noise(0.1, 0.55, 0.2, 620, { to: 260, filter: "lowpass", attack: 0.03 }),
    tone(0.1, 0.3, 0.16, 120, { to: 48 }),
    ...grains(0.3, 0.5, 6, (t) => tone(t, 0.05, 0.03, rand(500, 1100), { to: rand(900, 1600) })),
  ],
};

export const catalog: { name: string; detail: string; make: () => Sound }[] = [
  ...(["step", "slide", "skate", "creak", "plunge"] as const).map((k) => ({ name: `Ice: ${k}`, detail: "Frozen water underfoot", make: () => ice[k]() })),
  ...(["coo", "laugh", "fuss", "cry", "sigh"] as const).map((k) => ({ name: `Baby: ${k}`, detail: "The carried baby", make: baby[k] })),
  ...(
    [
      ["bare", "grass"],
      ["bare", "rock"],
      ["bare", "water"],
      ["haft", "rock"],
      ["haft", "tree"],
      ["haft", "brush"],
      ["haft", "pottery"],
      ["blade", "stone"],
      ["blade", "timber"],
      ["blade", "crop"],
      ["blunt", "metal"],
      ["blunt", "soil"],
      ["haft", "snow"],
      ["haft", "fire"],
      ["haft", "air"],
    ] as [ToolClass, HitClass][]
  ).map(([tool, hit]) => ({
    name: `Swing · ${tool} on ${hit}`,
    detail: "Tool and surface together",
    make: () => strike(tool, hit, "thud"),
  })),
  {
    name: "Break · pot",
    detail: "Thrown and burst",
    make: () => strike("thrown", "pottery", "shatter", true),
  },
  ...(["fell", "dig", "reap", "mine", "shatter", "fill", "douse"] as ToolWork[]).map((kind) => ({
    name: `Work · ${kind}`,
    detail: "A tool at its own job",
    make: () => work(kind),
  })),
  ...(
    [
      "stone",
      "soil",
      "grass",
      "sand",
      "snow",
      "marsh",
      "water",
      "timber",
    ] as HitClass[]
  ).flatMap((ground) => [
    {
      name: `Push · ${ground}`,
      detail: "A load dragged a pace",
      make: () => scrape(ground),
    },
    {
      name: `Land · ${ground}`,
      detail: "Coming down from a jump",
      make: () => landing(ground, 1.2),
    },
  ]),
  ...(["tree", "stone", "timber"] as HitClass[]).flatMap((ground) => [
    {
      name: `Climb · ${ground}`,
      detail: "Going up it",
      make: () => scramble(ground),
    },
    {
      name: `Climb down · ${ground}`,
      detail: "Coming back down it",
      make: () => scramble(ground, true),
    },
  ]),
  ...(["grass", "soil", "sand", "stone", "rock", "timber", "fiber", "marsh", "sodden", "furrow", "paddy", "water", "snow"] as const).map((ground) => ({
    name: `Step · ${ground}`,
    detail: "A footfall",
    make: () => footstep(ground)!,
  })),
  ...(["squish", "pop", "slime", "puff", "splat", "crust", "crumble", "squelch", "pellets"] as const).map((through) => ({
    name: `Step · ${through}`,
    detail: "A foot on a fungus or dung",
    make: () => footstep("grass", false, through)!,
  })),
  ...(Object.keys(events) as EventId[]).map((id) => ({
    name: `Event · ${id}`,
    detail: "The shared plucked voice",
    make: events[id],
  })),
  ...(["child", "woman", "man"] as VoiceKind[]).flatMap((kind) => [
    { name: `Voice · ${kind}`, detail: "Speech patter", make: () => voice(kind) },
    {
      name: `Voice · ${kind}, annoyed`,
      detail: "Speech patter, put out",
      make: () => voice(kind, true),
    },
    {
      name: `Bump · ${kind}`,
      detail: "Walked into a person",
      make: () => bumpPerson(kind),
    },
  ]),
  ...(["bird", "critter", "herd", "beast"] as BeastVoice[]).map((kind) => ({
    name: `Bump · ${kind}`,
    detail: "Walked into an animal",
    make: () => bumpAnimal(kind),
  })),
];

const NOISE_MAKEUP = 3.2;
const buffers = new WeakMap<BaseAudioContext, AudioBuffer>();
function white(ctx: BaseAudioContext) {
  let buffer = buffers.get(ctx);
  if (!buffer) {
    buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    buffers.set(ctx, buffer);
  }
  return buffer;
}
export function playSound(
  ctx: BaseAudioContext,
  out: AudioNode,
  sound: Sound,
  start: number,
) {
  for (const layer of sound) {
    const at = start + layer.at,
      end = at + layer.dur;
    const envelope = ctx.createGain();
    const attack = Math.min(layer.attack ?? 0.002, layer.dur * 0.5);
    envelope.gain.setValueAtTime(0, at);
    // Filtering throws most of white noise away; bring it back up to the tones.
    const peak = layer.gain * (layer.kind === "noise" ? NOISE_MAKEUP : 1);
    envelope.gain.linearRampToValueAtTime(peak, at + attack);
    envelope.gain.exponentialRampToValueAtTime(0.0001, end);
    envelope.connect(out);
    let source: AudioScheduledSourceNode;
    const nodes: AudioNode[] = [envelope];
    if (layer.kind === "tone") {
      const osc = ctx.createOscillator();
      osc.type = layer.wave ?? "sine";
      osc.frequency.setValueAtTime(layer.freq, at);
      if (layer.to) osc.frequency.exponentialRampToValueAtTime(layer.to, end);
      osc.connect(envelope);
      source = osc;
    } else {
      const src = ctx.createBufferSource();
      src.buffer = white(ctx);
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = layer.filter ?? "bandpass";
      filter.Q.value = layer.q ?? 1;
      filter.frequency.setValueAtTime(layer.freq, at);
      if (layer.to)
        filter.frequency.exponentialRampToValueAtTime(layer.to, end);
      src.connect(filter).connect(envelope);
      nodes.push(filter);
      source = src;
      src.start(at, Math.random() * 0.9);
    }
    if (layer.kind === "tone") source.start(at);
    source.stop(end + 0.02);
    source.onended = () => {
      source.disconnect();
      nodes.forEach((n) => n.disconnect());
    };
  }
}

export type FishingCue =
  | "cast" | "plop" | "nibble" | "bite" | "strike" | "early" | "escape" | "snap" | "run" | "reel" | "net-throw"
  | "net-splash" | "haul" | "empty" | "spear" | "spear-miss" | "jump" | "gull" | "dive" | "perfect" | "tired" | "heron"
  | "land" | "best" | "set" | "haul-set" | "full" | "leap" | "snag" | "find" | "new" | "star" | "meow" | "purr" | "steal";
/** The fishing game's sounds: line, water, fish and the birds over them. `big` is a heavy fish or a seine. */
export function fishingSound(cue: FishingCue, big = false): Sound {
  const splash = (at: number, size: number, gain: number): Sound => [
    noise(at, 0.05 + size * 0.12, gain, 1500 + size * 600, { to: 500, q: 0.8 }),
    noise(at + 0.01, 0.2 + size * 0.25, gain * 0.5, 3600, { to: 1800, q: 0.6, filter: "highpass" }),
    ...grains(at + 0.03, 0.15 + size * 0.2, 4 + Math.round(size * 8), (t) => bubble(t, rand(500, 1200) / (1 + size * 0.4), gain * 0.25)),
  ];
  switch (cue) {
    case "cast":
      return [noise(0, 0.32, 0.06, 900, { to: 3400, q: 1.6, attack: 0.08 }), tone(0.04, 0.28, 0.012, 1800, { to: 2600, wave: "triangle" })];
    case "net-throw":
      return [noise(0, 0.45, 0.08, 500, { to: 2200, q: 1.2, attack: 0.1 }), ...grains(0.1, 0.3, 6, (t) => noise(t, 0.03, 0.02, 3000, { q: 4 }))];
    case "plop":
      return [tone(0, 0.09, 0.07, vary(520), { to: 1150, attack: 0.003 }), ...splash(0.01, 0.2, 0.05)];
    case "nibble":
      return [tone(0, 0.05, 0.035, vary(1400, 0.15), { to: 2100, attack: 0.002 }), noise(0, 0.04, 0.02, 2600, { q: 3 })];
    case "bite":
      return [...splash(0, 0.6, 0.11), tone(0.02, 0.12, 0.06, big ? 300 : 460, { to: 160, wave: "triangle" })];
    case "strike":
      return [noise(0, 0.12, 0.09, 700, { to: 2800, q: 2, attack: 0.01 }), tone(0, 0.18, 0.05, 220, { to: 340, wave: "triangle" }), ...splash(0.05, big ? 0.9 : 0.5, 0.09)];
    case "early":
      return [tone(0, 0.16, 0.04, 420, { to: 300, wave: "triangle" }), ...splash(0, 0.2, 0.04)];
    case "escape":
      return [...splash(0, 0.5, 0.07), tone(0.05, 0.3, 0.03, 380, { to: 220, wave: "triangle" })];
    case "snap":
      // The twang of a parted line, and the reel of slack after it.
      return [tone(0, 0.45, 0.09, 1600, { to: 140, wave: "sawtooth" }), noise(0, 0.08, 0.1, 4200, { q: 2 }), ...grains(0.05, 0.4, 7, (t) => noise(t, 0.02, 0.02, 2400, { q: 5 }))];
    case "run":
      return [...splash(0, big ? 0.8 : 0.4, big ? 0.09 : 0.06), ...grains(0, 0.35, 9, (t, i) => tone(t, 0.03, 0.012, 900 + i * 60, { wave: "triangle" }))];
    case "reel":
      return grains(0, 0.4, 10, (t) => noise(t, 0.018, 0.03, 2200, { q: 6 }));
    case "net-splash":
      return [...splash(0, big ? 1.3 : 0.9, 0.12), ...grains(0.02, 0.25, 14, (t) => noise(t, 0.02, 0.025, rand(2500, 5000), { q: 3 }))];
    case "haul":
      return [noise(0, 0.9, 0.05, 600, { to: 1200, q: 1, attack: 0.2 }), ...grains(0, 0.9, 10, (t) => tone(t, 0.06, 0.015, rand(140, 220), { wave: "triangle" }))];
    case "empty":
      return [tone(0, 0.2, 0.04, 330, { to: 260, wave: "triangle" }), tone(0.18, 0.3, 0.035, 250, { to: 200, wave: "triangle" })];
    case "spear":
      return [noise(0, 0.12, 0.08, 1200, { to: 3800, q: 1.5, attack: 0.01 }), ...splash(0.09, 0.4, 0.09)];
    case "spear-miss":
      return [tone(0.1, 0.15, 0.03, 300, { to: 220, wave: "triangle" })];
    case "jump":
      return [...splash(0, 0.25, 0.04), ...splash(0.5, 0.3, 0.05)];
    case "dive":
      return splash(0, 0.35, 0.05);
    case "gull": {
      const f = vary(1250, 0.15);
      return [tone(0, 0.22, 0.025, f, { to: f * 1.4, wave: "triangle", attack: 0.03 }), tone(0.22, 0.3, 0.02, f * 1.3, { to: f * 0.9, wave: "triangle", attack: 0.02 }), tone(0.56, 0.2, 0.015, f * 1.2, { to: f, wave: "triangle" })];
    }
    case "heron":
      return [noise(0, 0.18, 0.03, 700, { q: 4 }), tone(0, 0.18, 0.02, 180, { to: 140, wave: "sawtooth" })];
    case "perfect":
      return [tone(0, 0.12, 0.035, 1568, { wave: "triangle" }), tone(0.07, 0.18, 0.03, 2093, { wave: "triangle" })];
    case "tired":
      return [tone(0, 0.2, 0.02, 523, { wave: "triangle" })];
    case "land": {
      // Out of the water, a flap or two on the boards, and a bright little chime.
      const flaps = grains(0.12, 0.45, big ? 6 : 3, (t) => noise(t, 0.035, 0.05, rand(900, 1600), { q: 1.5 }));
      const chime = [523, 659, 784].map((f, i) => tone(0.05 + i * 0.07, 0.35, 0.03, f * (big ? 0.75 : 1), { wave: "triangle" }));
      return [...splash(0, 0.3, 0.05), ...flaps, ...chime];
    }
    case "best":
      return [523, 659, 784, 1047].map((f, i) => tone(i * 0.09, 0.45, 0.032, f, { wave: "triangle" }));
    case "set":
      // Gear over the side: a rope paid out, a weighted splash, a float bobbing up.
      return [...grains(0, 0.3, 6, (t) => noise(t, 0.03, 0.02, 1800, { q: 4 })), ...splash(0.28, 0.5, 0.08), tone(0.55, 0.1, 0.03, 600, { to: 900, attack: 0.004 })];
    case "haul-set":
      return [...grains(0, 1, 8, (t) => tone(t, 0.08, 0.018, rand(150, 230), { wave: "triangle" })), noise(0.1, 0.9, 0.04, 700, { to: 1300, q: 1, attack: 0.2 }), ...grains(0.6, 0.5, 8, (t) => bubble(t, rand(700, 1400), 0.02))];
    case "full":
      return [tone(0, 0.06, 0.03, 880, { attack: 0.003 }), tone(0.09, 0.08, 0.025, 1175, { attack: 0.003 })];
    case "leap":
      return [...splash(0, 0.7, 0.09), noise(0.02, 0.25, 0.04, 2000, { to: 4000, q: 0.8, filter: "highpass" }), ...splash(0.55, 0.8, 0.1)];
    case "snag":
      return [tone(0, 0.2, 0.06, 140, { to: 90, wave: "triangle" }), noise(0, 0.1, 0.05, 500, { q: 2 })];
    case "find":
      return [988, 1319, 1568, 1976].map((f, i) => tone(i * 0.06, 0.5, 0.025, f, { wave: "sine" }));
    case "new":
      // A short fanfare for a kind never caught before.
      return [[523, 0], [659, 0.1], [784, 0.2], [1047, 0.32], [784, 0.46], [1047, 0.56]].map(([f, at]) => tone(at, 0.4, 0.035, f, { wave: "triangle" }));
    case "star":
      return [tone(0, 0.25, 0.025, 2093, { wave: "sine" }), tone(0.06, 0.3, 0.02, 2637, { wave: "sine" })];
    case "meow": {
      const f = vary(620, 0.12);
      return [tone(0, 0.32, 0.03, f * 0.8, { to: f * 1.25, wave: "triangle", attack: 0.04 }), tone(0.14, 0.24, 0.025, f * 1.25, { to: f * 0.7, wave: "triangle" })];
    }
    case "purr":
      return grains(0, 1.2, 26, (t) => noise(t, 0.04, 0.025, 120, { q: 1.2 }));
    case "steal":
      return [tone(0, 0.12, 0.03, 900, { to: 1300, wave: "triangle" }), ...grains(0.1, 0.4, 6, (t) => noise(t, 0.03, 0.03, rand(600, 1100), { q: 2 }))];
  }
}

/** One hoof strike on a surface; heavy beasts thud lower and deeper. */
export function hoofbeat(surface: HitClass, gait: number, heavy = false): Sound {
  const g = (gait >= 3 ? 0.18 : gait === 2 ? 0.13 : 0.09) * (heavy ? 1.35 : 1);
  const pitch = heavy ? 0.58 : 1;
  if (surface === "water" || surface === "marsh") {
    return [
      tone(0, 0.055, g * 0.7, vary(150) * pitch, { to: 80 * pitch }),
      noise(0, 0.09, g * 0.9, 1400, { to: 2600, q: 0.9 }),
      bubble(0.02, 520, g * 0.4),
    ];
  }
  if (surface === "snow") {
    return [
      noise(0, 0.06, g * 0.85, 1900, { to: 900, q: 1.4 }),
      tone(0, 0.045, g * 0.45, vary(115) * pitch, { to: 72 * pitch }),
    ];
  }
  if (surface === "stone" || surface === "rock") {
    // Crisp hollow clop on stone paving.
    return [
      tone(0, 0.032, g * 0.95, vary(540) * pitch, { to: 310 * pitch, wave: "triangle" }),
      tone(0.008, 0.024, g * 0.55, vary(980) * pitch, { to: 620 * pitch, wave: "triangle" }),
      noise(0, 0.018, g * 0.65, 2900, { q: 3.2 }),
    ];
  }
  if (surface === "timber") {
    return [
      tone(0, 0.055, g * 0.95, vary(280) * pitch, { to: 170 * pitch, wave: "triangle" }),
      noise(0, 0.022, g * 0.5, 1800, { q: 2 }),
    ];
  }
  // Dirt, grass, sand: soft resonant thud + grit.
  return [
    tone(0, 0.055, g * 0.9, vary(135) * pitch, { to: 68 * pitch }),
    noise(0, 0.032, g * 0.55, surface === "sand" ? 2100 : 1200, { q: 1.3 }),
  ];
}

/** Species-specific voice for mounting, rearing, spurring, calming, or bucking. */
/** A cycle's own noises for the riding moods: the bell or horn, the chain, the engine, the spill. */
function cycleVoice(motor: boolean, mood: "mount" | "spur" | "calm" | "rear" | "buck" | "stubborn"): Sound {
  if (mood === "calm") {
    if (motor) {
      const f = vary(415, 0.03);
      return [0, 0.19].flatMap((t) => [
        tone(t, 0.13, 0.07, f, { wave: "square", attack: 0.01 }),
        tone(t, 0.13, 0.05, f * 1.26, { wave: "square", attack: 0.01 }),
      ]);
    }
    // Two strikes of a thumb bell: a bright partial over the note, the second ringing on.
    const f = vary(2140, 0.03);
    return [0, 0.15].flatMap((t, i) => [
      tone(t, i ? 0.6 : 0.2, 0.085, f, { wave: "sine" }),
      tone(t, i ? 0.4 : 0.14, 0.04, f * 2.76, { wave: "sine" }),
      noise(t, 0.012, 0.05, 5200, { q: 2 }),
    ]);
  }
  if (mood === "buck") {
    return [
      tone(0, 0.14, 0.16, 110, { to: 48 }),
      noise(0, 0.1, 0.12, 700, { to: 320, q: 1.1 }),
      ...grains(0.03, 0.42, 9, (t, i) => noise(t, 0.03, 0.09 - i * 0.007, rand(2600, 5200), { q: 5 })),
      ...grains(0.08, 0.5, 4, (t) => tone(t, 0.12, 0.035, rand(1500, 2600), { wave: "triangle" })),
    ];
  }
  if (motor) {
    if (mood === "mount")
      return [
        ...grains(0, 0.42, 7, (t, i) => tone(t, 0.07, 0.07 + i * 0.006, 62 + i * 6, { to: 44, wave: "sawtooth" })),
        tone(0.44, 0.5, 0.09, 78, { to: 150, wave: "sawtooth", attack: 0.03 }),
        noise(0.44, 0.45, 0.04, 420, { to: 900, q: 0.8 }),
      ];
    if (mood === "stubborn") return grains(0, 0.3, 4, (t) => tone(t, 0.05, 0.06, 70, { to: 40, wave: "sawtooth" }));
    return [
      tone(0, mood === "rear" ? 0.55 : 0.4, 0.1, 95, { to: mood === "rear" ? 260 : 210, wave: "sawtooth", attack: 0.02 }),
      noise(0, 0.36, 0.045, 520, { to: 1400, q: 0.8 }),
    ];
  }
  if (mood === "mount")
    return [
      noise(0, 0.03, 0.06, 3200, { q: 4 }),
      ...grains(0.05, 0.22, 5, (t) => noise(t, 0.014, 0.035, rand(3400, 4600), { q: 6 })),
      tone(0.02, 0.05, 0.03, 190, { to: 120, wave: "triangle" }),
    ];
  if (mood === "stubborn") return [noise(0, 0.28, 0.07, 520, { to: 300, q: 0.9, attack: 0.05 })];
  if (mood === "rear")
    return [noise(0, 0.12, 0.08, 1500, { to: 800, q: 2.5 }), tone(0, 0.09, 0.05, 160, { to: 260, wave: "triangle" })];
  // A push on the pedals: the chain takes up and the tyres hiss.
  return [
    ...grains(0, 0.12, 4, (t) => noise(t, 0.012, 0.04, rand(3600, 4800), { q: 6 })),
    noise(0.02, 0.2, 0.05, 900, { to: 2400, q: 1.2, attack: 0.03 }),
  ];
}

/** One click of a coasting freewheel. */
export function cycleTick(): Sound {
  return [tone(0, 0.009, 0.028, vary(3300, 0.04), { wave: "square" }), noise(0, 0.008, 0.02, 5200, { q: 3 })];
}

/** The chain and tyres under steady pedalling, quieter on soft ground. */
export function cycleRoll(surface: HitClass, speed: number): Sound {
  const g = 0.018 + speed * 0.02;
  const hard = surface === "stone" || surface === "rock" || surface === "timber";
  return [
    noise(0, 0.07, g, hard ? 2300 : 1100, { to: hard ? 1700 : 700, q: hard ? 1.6 : 0.9, attack: 0.015 }),
    ...(hard ? [] : [noise(0.01, 0.04, g * 0.9, rand(500, 900), { q: 1.2 })]),
  ];
}

/** One firing of an engine: `pitch` sets the machine (a moped high, a big twin low), `rev` 0 to 1 how hard it is running. */
export function motorPutt(pitch: number, rev: number): Sound {
  const f = (58 + rev * 105) * pitch;
  return [
    tone(0, 0.075 - rev * 0.03, 0.06 + rev * 0.025, vary(f, 0.03), { to: f * 0.62, wave: "sawtooth" }),
    noise(0, 0.03, 0.022 + rev * 0.02, 260 * pitch, { to: 520 * pitch, q: 0.8 }),
  ];
}

/** Locked wheels: a squeal on paving, a tearing scrape on dirt. */
export function cycleSkid(surface: HitClass): Sound {
  if (surface === "stone" || surface === "rock" || surface === "timber")
    return [
      noise(0, 0.3, 0.1, 1750, { to: 1250, q: 7, attack: 0.01 }),
      noise(0, 0.26, 0.05, 2900, { to: 2100, q: 5 }),
      tone(0, 0.1, 0.05, 130, { to: 70 }),
    ];
  return [
    noise(0, 0.26, 0.13, 1300, { to: 520, q: 1, attack: 0.01 }),
    ...grains(0.02, 0.22, 6, (t) => noise(t, 0.022, 0.06, rand(800, 1900), { q: 2 })),
  ];
}

/** A trick landed: a rising run, a step higher for each one chained. */
export function trickChime(chain: number): Sound {
  const scale = [523, 659, 784, 1047, 1319, 1568];
  const from = Math.min(3, Math.max(0, chain - 1));
  return [0, 1, 2].map((i) => tone(i * 0.06, 0.2, 0.06, scale[from + i], { wave: "triangle" }));
}

export function mountVoice(
  voice: "horse" | "donkey" | "camel" | "bovine" | "deer" | "llama" | "elephant" | "ostrich" | "bike" | "motor",
  mood: "mount" | "spur" | "calm" | "rear" | "buck" | "stubborn",
): Sound {
  if (voice === "bike" || voice === "motor") return cycleVoice(voice === "motor", mood);
  if (mood === "calm") {
    return [
      noise(0, 0.14, 0.07, 720, { to: 420, q: 1.4, attack: 0.02 }),
      tone(0.02, 0.14, 0.045, vary(180), { to: 135, wave: "triangle" }),
    ];
  }
  switch (voice) {
    case "horse": {
      if (mood === "mount" || mood === "spur") {
        // Quick eager snort.
        return [
          noise(0, 0.11, 0.11, 950, { to: 520, q: 1.8, attack: 0.01 }),
          tone(0.01, 0.08, 0.05, vary(210), { to: 150, wave: "sawtooth" }),
        ];
      }
      // Expressive whinny / neigh for rearing or bucking.
      const f = vary(680, 0.08);
      return [
        tone(0, 0.18, 0.09, f * 0.72, { to: f * 1.35, wave: "sawtooth", attack: 0.02 }),
        tone(0.14, 0.28, 0.08, f * 1.35, { to: f * 0.65, wave: "triangle" }),
        ...grains(0.06, 0.28, 7, (t, i) => tone(t, 0.045, 0.035, f * (1.28 - i * 0.09), { wave: "triangle" })),
        noise(0.02, 0.24, 0.05, 1600, { q: 2.5 }),
      ];
    }
    case "donkey": {
      // Unmistakable two-part hee-haw bray!
      const f = vary(480, 0.07);
      if (mood === "mount") {
        return [
          tone(0, 0.14, 0.07, f * 0.8, { to: f * 1.2, wave: "sawtooth", attack: 0.02 }),
          noise(0, 0.12, 0.06, 1200, { q: 2 }),
        ];
      }
      return [
        tone(0, 0.18, 0.09, f * 0.75, { to: f * 1.45, wave: "sawtooth", attack: 0.02 }),
        tone(0.2, 0.26, 0.1, f * 1.05, { to: f * 0.42, wave: "sawtooth", attack: 0.015 }),
        noise(0.18, 0.24, 0.07, 980, { to: 520, q: 2.2 }),
      ];
    }
    case "elephant": {
      // Brassy rising trumpet!
      const f = vary(340, 0.06);
      return [
        tone(0, 0.38, 0.13, f * 0.75, { to: f * 1.85, wave: "sawtooth", attack: 0.03 }),
        tone(0.04, 0.36, 0.08, f * 1.5, { to: f * 2.5, wave: "triangle", attack: 0.04 }),
        noise(0.02, 0.3, 0.06, 1500, { to: 2600, q: 2 }),
      ];
    }
    case "bovine":
    case "camel": {
      const f = vary(voice === "camel" ? 135 : 115, 0.08);
      return [
        tone(0, 0.34, 0.11, f, { to: f * (mood === "rear" ? 1.25 : 0.78), wave: "sawtooth", attack: 0.04 }),
        noise(0.02, 0.26, 0.06, 480, { to: 320, q: 1.8 }),
      ];
    }
    case "llama": {
      if (mood === "buck" || mood === "stubborn") {
        // Indignant spit!
        return [
          noise(0, 0.14, 0.14, 3400, { to: 1400, q: 1.4, attack: 0.005 }),
          tone(0, 0.09, 0.05, 420, { to: 220, wave: "sawtooth" }),
        ];
      }
      return [tone(0, 0.22, 0.06, vary(290), { to: 340, wave: "triangle", attack: 0.03 })];
    }
    case "ostrich": {
      return [
        tone(0, 0.12, 0.09, vary(180), { to: 95, wave: "triangle" }),
        tone(0.09, 0.16, 0.07, vary(540), { to: 320, wave: "sawtooth" }),
      ];
    }
    case "deer":
    default:
      return [
        noise(0, 0.12, 0.09, 1300, { to: 650, q: 2 }),
        tone(0.02, 0.14, 0.06, vary(260), { to: 190, wave: "triangle" }),
      ];
  }
}

/** Crisp spur snap + ascending harmonic chime when hitting the rhythm sweet-spot. */
export function spurSnap(perfect: boolean, combo: number): Sound {
  const base: Sound = [
    noise(0, 0.055, 0.11, 2400, { to: 900, q: 1.6 }),
    tone(0, 0.07, 0.07, vary(190), { to: 310, wave: "triangle" }),
  ];
  if (!perfect) return base;
  const scale = [523, 587, 659, 784, 880, 1047];
  const note = scale[Math.min(scale.length - 1, Math.max(0, combo - 1))];
  return [
    ...base,
    tone(0.02, 0.16, 0.055, note, { wave: "triangle" }),
    tone(0.07, 0.22, 0.045, note * 1.25, { wave: "sine" }),
  ];
}

export function mountSkid(): Sound {
  return [
    noise(0, 0.22, 0.14, 1500, { to: 620, q: 1.1, attack: 0.01 }),
    ...grains(0.02, 0.18, 5, (t) => noise(t, 0.025, 0.06, rand(900, 1900), { q: 2 })),
    tone(0, 0.12, 0.08, 120, { to: 65 }),
  ];
}

export function mountLeap(heavy = false): Sound {
  return [
    noise(0, 0.14, 0.09, 900, { to: 2200, q: 1.1, attack: 0.02 }),
    tone(0, 0.11, heavy ? 0.14 : 0.09, heavy ? 85 : 140, { to: heavy ? 130 : 240, wave: "triangle" }),
  ];
}

export function mountLand(heavy = false): Sound {
  return [
    tone(0, 0.12, heavy ? 0.19 : 0.12, heavy ? 78 : 125, { to: 42 }),
    noise(0, 0.09, heavy ? 0.14 : 0.09, 820, { to: 380, q: 1.2 }),
  ];
}
