import type { Sound } from "./sfx";
export function timeSound(backward: boolean): Sound {
  return [
    {
      kind: "noise",
      at: 0,
      dur: 6.8,
      gain: 0.028,
      freq: 380,
      to: 1100,
      q: 0.6,
      filter: "bandpass",
      attack: 2.5,
    },
    ...[110, 164.81, 233.08, 330.12].map((freq, i) => ({
      kind: "tone" as const,
      at: i * 0.18,
      dur: 6.2 - i * 0.5,
      gain: 0.07 / (1 + i),
      freq: backward ? freq * 1.015 : freq,
      to: backward ? freq : freq * 1.015,
      wave: "sine" as const,
      attack: 0.3 + i * 0.2,
    })),
    {
      kind: "tone",
      at: 4.8,
      dur: 3,
      gain: 0.035,
      freq: 220,
      to: 219.5,
      wave: "sine",
      attack: 0.08,
    },
  ];
}
