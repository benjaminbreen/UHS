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
const noise = (
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
const tone = (
  at: number,
  dur: number,
  gain: number,
  freq: number,
  rest: Partial<Layer> = {},
): Layer => ({ kind: "tone", at, dur, gain, freq, wave: "sine", ...rest });
const shift = (sound: Sound, by: number, gain = 1): Sound =>
  sound.map((l) => ({ ...l, at: l.at + by, gain: l.gain * gain }));

/** Struck-object partials: inharmonic, so it rings rather than sings. */
function ring(at: number, base: number, dur: number, gain: number): Sound {
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

export function projectileRelease(kind: "arrow" | "spear"): Sound {
  return kind === "arrow"
    ? [
        tone(0, 0.13, 0.28, vary(310), { to: 175, wave: "triangle" }),
        noise(0.012, 0.11, 0.12, 3500, { to: 1400, q: 2 }),
      ]
    : [
        noise(0, 0.16, 0.17, 850, { to: 2600, q: 2.2, attack: 0.035 }),
        tone(0.02, 0.1, 0.08, 130, { to: 75 }),
      ];
}

export function projectileImpact(kind: "arrow" | "spear", hit: HitClass): Sound {
  const weight = kind === "spear" ? 0.9 : 0.5;
  return [
    ...body(hit, weight),
    noise(0, hit === "creature" ? 0.045 : 0.025, kind === "spear" ? 0.16 : 0.1,
      hit === "creature" ? 1200 : 2300, { to: 650, q: 2 }),
    ...(hit === "soil" || hit === "grass" || hit === "sand"
      ? [noise(0.025, 0.13, kind === "spear" ? 0.12 : 0.07, 700,
          { to: 330, filter: "lowpass" as const })]
      : []),
  ];
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
        noise(0, 0.12, 0.4, 900, { to: 300, q: 1.2, attack: 0.01 }),
        noise(0.08, 0.9, 0.18, 5200, { filter: "highpass", attack: 0.05 }),
      ];
    case "fill":
      return [noise(0, 0.5, 0.16, 700, { to: 1100, filter: "lowpass", attack: 0.08 })];
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
 * crackles, a fleshy cap snaps and squashes. */
export type FungusStep = "puff" | "lichen" | "squish";
type Through = HitClass | "bloom" | FungusStep;
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
      return [
        noise(0, 0.035, 0.16 * g, 1400, { q: 2, attack: 0.003 }),
        noise(0.015, 0.14, 0.14 * g, 520, { to: 280, q: 1.4, attack: 0.008 }),
        bubble(rand(0.03, 0.06), rand(260, 380), 0.08 * g),
      ];
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
/** A walking footfall, with whatever it pushes through. Firm, bare ground is
 * silent. "paddy" is ankle-deep water over mud; "furrow" is tilled soil;
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
  switch (ground) {
    case "paddy":
      return [
        noise(0, 0.12, 0.09 * g, vary(900, 0.2), { to: 420, q: 0.9, attack: 0.01 }),
        noise(0.05, 0.14, 0.07 * g, 480, { filter: "lowpass", attack: 0.03 }),
        bubble(rand(0.08, 0.14), rand(240, 380), 0.05 * g),
      ];
    case "sodden":
      return [
        noise(0, 0.1, 0.045 * g, 520, { filter: "lowpass", attack: 0.015 }),
        noise(0.04, 0.06, 0.02 * g, 1400, { q: 1.2, attack: 0.02 }),
      ];
    case "furrow":
      return [
        noise(0, 0.07, 0.05 * g, 700, { filter: "lowpass", attack: 0.01 }),
        ...grains(0.01, 0.06, 2, (t) => noise(t, 0.015, 0.025 * g, 2600, { q: 2 })),
      ];
    case "water":
      return [
        noise(0, 0.15, 0.13 * g, vary(1100, 0.2), {
          to: 480,
          q: 0.9,
          attack: 0.008,
        }),
        bubble(rand(0.03, 0.08), rand(480, 820), 0.06 * g),
      ];
    case "marsh":
      return [
        noise(0, 0.13, 0.15 * g, 560, { filter: "lowpass", attack: 0.012 }),
        bubble(rand(0.04, 0.09), rand(180, 280), 0.1 * g),
      ];
    case "sand":
      return [
        noise(0, 0.09, 0.035 * g, vary(2600, 0.15), { q: 0.6, attack: 0.02 }),
      ];
    case "snow":
      return [
        ...grains(0, 0.06, 3, (t) =>
          noise(t, 0.04, 0.095 * g, vary(1850, 0.15), { q: 1.7 }),
        ),
        noise(0, 0.1, 0.09 * g, 400, { filter: "lowpass", attack: 0.01 }),
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

export const events = {
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
  door: () => [
    ...body("timber", 1.3),
    tone(0.13, 0.03, 0.12, 1900, { wave: "triangle" }),
    noise(0.13, 0.02, 0.1, 3000, { q: 2 }),
  ],
} satisfies Record<string, () => Sound>;
export type EventId = keyof typeof events;

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
/** Broad shapes of animal. Species matter less than size and whether it flies. */
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
export const catalog: { name: string; detail: string; make: () => Sound }[] = [
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
  ...(["fell", "dig", "reap", "mine", "shatter"] as ToolWork[]).map((kind) => ({
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
  ...(["water", "marsh", "sand", "snow"] as HitClass[]).map((ground) => ({
    name: `Step · ${ground}`,
    detail: "A footfall",
    make: () => footstep(ground)!,
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
