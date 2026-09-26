import type { ItemDef } from "../core/types";
import type { PropDef } from "../content/props/catalog";
import { events, type Layer, type Sound } from "./sfx";

/** Small confirmations: what a thing sounds like in the hand, in the mouth,
 * changing hands, or being written down. Quiet, and never twice the same. */

export type Material =
  | "stone"
  | "metal"
  | "wood"
  | "pottery"
  | "earth"
  | "shell"
  | "food"
  | "soft";
export type Bite = "crunch" | "chew" | "leafy";
export type Money = "metal" | "shell" | "paper";
export type Writing = "charcoal" | "clay" | "brush" | "pen" | "pencil" | "tap";

// sfx.ts keeps its layer builders private; these mirror them.
const rand = (a: number, b: number) => a + Math.random() * (b - a);
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
const later = (sound: Sound, by: number, gain = 1): Sound =>
  sound.map((l) => ({ ...l, at: l.at + by, gain: l.gain * gain }));

export function materialOf(id: string, def?: ItemDef): Material {
  if (def?.edible) return "food";
  if (/ore|stone|flint|obsidian|granite|limestone|pebble|rock/.test(id))
    return "stone";
  if (
    def?.hand?.edge ||
    /coin|chain|necklace|tool|iron|copper|bronze|tin|silver|gold/.test(id)
  )
    return "metal";
  if (/wood|stick|bark|pinecone|cane|torch|bow|arrow|resin/.test(id))
    return "wood";
  if (/clay|dirt|sand|mud|dung/.test(id)) return "earth";
  if (/shell|bone|antler|horn/.test(id)) return "shell";
  return "soft";
}

export function propMaterial(def?: PropDef): Material {
  return (
    (
      {
        clay: "pottery",
        glaze: "pottery",
        wood: "wood",
        metal: "metal",
        plastic: "shell",
      } as const
    )[def?.breakable as string] ?? "soft"
  );
}

export function biteOf(id: string): Bite {
  if (/bread|grain|acorn|seed|root|bulb|fruit|caper/.test(id)) return "crunch";
  if (/meat|fish|mushroom/.test(id)) return "chew";
  return "leafy";
}

/** Coins, cowries or notes, when an item is money at all. */
export function moneyOf(id: string): Money | undefined {
  if (/cowrie/.test(id)) return "shell";
  if (/banknote|paper-money/.test(id)) return "paper";
  if (/coin/.test(id)) return "metal";
}

/** The feel of a thing in the hand: a knock, a clink, a tock, a rustle. */
export function handle(material: Material): Sound {
  switch (material) {
    case "stone":
      return [
        noise(0, 0.02, 0.1, 2600, { q: 2.5 }),
        tone(0, 0.05, 0.1, vary(900), { to: 680, wave: "triangle" }),
        tone(0, 0.06, 0.07, vary(160), { to: 110 }),
      ];
    case "metal": {
      const f = vary(1500, 0.1);
      return [
        noise(0, 0.012, 0.06, 5000, { q: 3 }),
        ...[1, 2.76, 5.4].map((ratio, i) =>
          tone(0, 0.35 / (1 + i * 0.7), 0.05 / (1 + i * 1.3), f * ratio),
        ),
      ];
    }
    case "wood":
      return [
        tone(0, 0.06, 0.12, vary(420), { to: 340 }),
        noise(0, 0.02, 0.07, 1600, { q: 1.5 }),
      ];
    case "pottery":
      // Hollow: a knock and the jar's own ring an octave up.
      return [
        tone(0, 0.08, 0.12, vary(520), { to: 430, wave: "triangle" }),
        tone(0, 0.14, 0.05, vary(1040)),
        noise(0, 0.015, 0.06, 2200, { q: 2 }),
      ];
    case "earth":
      return [
        noise(0, 0.07, 0.08, 700, { filter: "lowpass", attack: 0.01 }),
        tone(0, 0.05, 0.05, vary(140), { to: 100 }),
      ];
    case "shell":
      return [
        noise(0, 0.012, 0.08, 5200, { q: 3 }),
        tone(0, 0.03, 0.06, vary(2200), { to: 1800, wave: "triangle" }),
      ];
    case "food":
      return [
        noise(0, 0.05, 0.06, 900, { filter: "lowpass", attack: 0.008 }),
        ...[0.03, 0.06, 0.09].map((t) =>
          noise(t + rand(0, 0.015), 0.012, 0.04, 4200, { q: 3 }),
        ),
      ];
    case "soft":
      return [noise(0, 0.09, 0.06, 4200, { to: 2600, q: 0.7, attack: 0.02 })];
  }
}

export const takeUp = (material: Material): Sound => [
  ...handle(material),
  ...later(events.pickup(), 0.03, 0.55),
];

export function eat(bite: Bite, spoiled: boolean): Sound {
  const mouth =
    bite === "crunch"
      ? [0, 0.22].flatMap((at) => [
          noise(at, 0.05, 0.05, 500, { filter: "lowpass" }),
          ...Array.from({ length: 5 }, (_, i) =>
            noise(
              at + i * 0.013 + rand(0, 0.01),
              0.014,
              0.06,
              rand(2400, 4200),
              { q: 1.2 },
            ),
          ),
        ])
      : bite === "chew"
        ? [0, 0.18, 0.36].map((at) =>
            noise(at, 0.09, 0.07, rand(450, 700), {
              filter: "lowpass",
              attack: 0.02,
            }),
          )
        : [0, 0.16, 0.3].map((at) =>
            noise(at, 0.04, 0.04, rand(3000, 5000), { q: 1.5 }),
          );
  // Something off: a small sour droop instead of the contented two notes.
  const after = spoiled
    ? [
        tone(0.5, 0.3, 0.05, 300, { wave: "triangle", to: 285 }),
        tone(0.5, 0.3, 0.04, 283, { wave: "triangle", to: 270 }),
      ]
    : later(events.use(), 0.5, 0.5);
  return [...mouth, ...after];
}

export function drink(): Sound {
  const gulps = 2 + Math.floor(rand(0, 2));
  return [
    noise(0, 0.12, 0.04, 900, { filter: "lowpass", attack: 0.02 }),
    ...Array.from({ length: gulps }, (_, i) =>
      tone(0.12 + i * 0.18, 0.09, 0.16, vary(420), { to: 240, attack: 0.01 }),
    ),
    ...later(events.select(), 0.14 + gulps * 0.18, 0.6),
  ];
}

/** Counting out a price, one coin or shell at a time, each a shade higher. */
export function pay(money: Money, count: number): Sound {
  const n = Math.max(1, Math.min(6, Math.round(count)));
  const coins = Array.from({ length: n }, (_, i): Sound => {
    const at = i * vary(0.075, 0.15),
      up = 1 + i * 0.03;
    if (money === "shell")
      return [
        noise(at, 0.012, 0.07, 5200 * up, { q: 3 }),
        tone(at, 0.03, 0.05, vary(1900) * up, { to: 1600, wave: "triangle" }),
      ];
    if (money === "paper")
      return [
        noise(at, 0.06, 0.04, 3200 * up, { to: 5200, q: 0.8, attack: 0.01 }),
      ];
    return [
      noise(at, 0.01, 0.05, 6000, { q: 3 }),
      tone(at, 0.22, 0.045, vary(2300) * up),
      tone(at, 0.11, 0.022, vary(2300) * up * 2.76),
    ];
  }).flat();
  const end = Math.max(...coins.map((l) => l.at));
  return [...coins, ...later(events.select(), end + 0.12, 0.5)];
}

/** Barter: what you hand over, then what you take. */
export const barter = (give: Material, take: Material): Sound => [
  ...handle(give),
  ...later(handle(take), 0.2),
  ...later(events.select(), 0.36, 0.5),
];

export function writing(tool: Writing): Sound {
  const strokes = 3 + Math.floor(rand(0, 3));
  return Array.from({ length: strokes }, (_, i): Sound => {
    const at = i * rand(0.11, 0.17);
    switch (tool) {
      case "clay":
        return [
          tone(at, 0.035, 0.06, vary(300), { to: 220 }),
          noise(at, 0.02, 0.04, 800, { filter: "lowpass" }),
        ];
      case "brush":
        return [
          noise(at, rand(0.12, 0.2), 0.035, 1800, {
            to: 900,
            q: 0.6,
            attack: 0.05,
          }),
        ];
      case "charcoal":
        return [noise(at, rand(0.08, 0.14), 0.04, 1500, { attack: 0.02 })];
      case "pencil":
        return [
          noise(at, rand(0.06, 0.12), 0.03, 3800, {
            to: 3200,
            q: 1.2,
            attack: 0.015,
          }),
          noise(at + 0.03, 0.01, 0.02, 5200, { q: 3 }),
        ];
      case "tap":
        return [
          tone(at * 0.7, 0.02, 0.035, vary(1800), { wave: "triangle" }),
          noise(at * 0.7, 0.008, 0.03, 4000, { q: 2 }),
        ];
      case "pen":
        return [
          noise(at, rand(0.07, 0.13), 0.03, 5200, {
            to: 3800,
            q: 1.5,
            attack: 0.02,
          }),
        ];
    }
  }).flat();
}

/** What the player writes with: charcoal before writing, a stylus on clay in
 * the early Near East, a brush in East Asia, then pen, pencil and phone. */
export function writingTool(year?: number, culture?: string): Writing {
  if (year === undefined) return "pen";
  if (year < -3200) return "charcoal";
  if (culture === "north-african-west-asian" && year < 0) return "clay";
  if (culture === "east-asian" && year < 1900) return "brush";
  return year < 1870 ? "pen" : year < 1990 ? "pencil" : "tap";
}

export const pageTurn = (): Sound => [
  noise(0, 0.16, 0.045, 2400, { to: 5200, q: 0.8, attack: 0.04 }),
  noise(0.12, 0.07, 0.03, 1200, { filter: "lowpass" }),
];
