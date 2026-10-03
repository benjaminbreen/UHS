import type { InteriorProfile } from "./types";
import { hash } from "../../render/interiors/room";

/**
 * The works of an industrial-age town: one floor of machines in rows, each
 * belted to the line shaft overhead (`program: "works"`, `styles.machine`).
 * What the works makes is read from its name where it says (a weaving
 * shed), else drawn from what was common at the date.
 */
type Works = { machine: string; label: string; from: number; weight: number; match?: RegExp; floor: "plank" | "flag"; note: string };
const WORKS: Works[] = [
  { machine: "loom", label: "Weaving shed", from: 1785, weight: 3, match: /weav|cotton|textile|mill/, floor: "plank",
    note: "A weaving shed of power looms in rows, after Cartwright's loom of 1785 and the sheds of Lancashire, Lowell and Bombay, each loom driven by a belt from the line shaft under the roof." },
  { machine: "frame", label: "Spinning room", from: 1770, weight: 2, match: /spin/, floor: "plank",
    note: "A spinning room of frames and mules after Arkwright and Crompton: long rows of bobbins turning, belted to the shafting overhead." },
  { machine: "lathe", label: "Machine shop", from: 1800, weight: 2, match: /engine|machine|tool/, floor: "plank",
    note: "An engineering shop of belt-driven lathes, after Maudslay's screw-cutting lathe, the bays lit by the high windows." },
  { machine: "moulds", label: "Foundry", from: 1750, weight: 1.5, match: /foundr|iron|steel/, floor: "flag",
    note: "A foundry floor: the cupola furnace tapped into ladles, the iron poured into sand moulds in their wooden flasks." },
  { machine: "press", label: "Printing works", from: 1800, weight: 1, match: /print|press/, floor: "plank",
    note: "A printing works of iron hand presses after the Stanhope and Columbian, inked and pulled by hand before steam cylinders took over." },
];

const made = new Map<string, InteriorProfile>();
export function factoryFor(name: string, year: number, seed: number): InteriorProfile {
  const fits = WORKS.filter((w) => year >= w.from);
  const named = fits.find((w) => w.match?.test(name.toLowerCase()));
  let roll = hash(seed, 3, 11) * fits.reduce((n, w) => n + w.weight, 0);
  const works = named ?? fits.find((w) => (roll -= w.weight) < 0) ?? WORKS[0];
  const known = made.get(works.machine);
  if (known) return known;
  const profile: InteriorProfile = {
    id: `works-${works.machine}`,
    uses: ["works"],
    program: "works",
    regulars: { hours: [7, 18], fill: 0.8 },
    styles: { machine: works.machine },
    label: works.label,
    region: "Industrial world",
    period: `${works.from} – 1960`,
    when: { start: { year: works.from }, end: { year: 1960 } },
    basis: "documented",
    note: works.note,
    shapes: ["rect"],
    size: [16, 12],
    door: "door",
    windowStyle: "shutter",
    fire: "none",
    smokehole: false,
    seating: "chair",
    sleep: "none",
    trades: ["household"],
    furnish: ["clock", "crate", "sacks"],
    looks: [
      { wall: "brick", floor: works.floor, wear: 0.6, soot: 0.6, windows: 4 },
      { wall: "brick", floor: works.floor, wear: 0.45, soot: 0.45, windows: 4 },
      { wall: "plaster", dado: "brick", floor: works.floor, wear: 0.3, soot: 0.3, windows: 5 },
    ],
    colorways: [
      { name: "Soot and brick", wall: "#8a4a36", trim: "#2a2420", floor: "#6a5a48", wood: "#5a4030", accent: "#3a4a5a" },
      { name: "Limewashed shed", wall: "#c8c0b0", trim: "#3a3630", floor: "#7a6a54", wood: "#5a4632", accent: "#5a2a2a" },
    ],
  };
  made.set(works.machine, profile);
  return profile;
}
