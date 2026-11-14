import { eraAt, type EraId } from "../history/dates";
import type { Stats } from "../../core/types";

/** Two lines for each end of each trait; the person's most extreme trait speaks. */
const lines: Record<keyof Stats, [low: string[], high: string[]]> = {
  strength: [
    ["I do the work that needs a careful hand, not a strong back.", "I leave the lifting to others and do the rest."],
    ["Give me something heavy and I'll carry it.", "When {work} is hard, people send for me."],
  ],
  agility: [
    ["I go slowly, and I still get there.", "I break more than I'd like. I mend most of it."],
    ["I'm quick on my feet, and quicker when I have to be.", "I've never dropped anything I meant to catch."],
  ],
  endurance: [
    ["I tire early, so I start early.", "I do my share, then I need to sit down."],
    ["I can work from dawn to dark and do it again tomorrow.", "Others rest. I keep going."],
  ],
  wit: [
    ["I don't follow clever talk, but I know my work.", "I keep it simple. Simple works."],
    ["Ask me. I've usually thought about it already.", "Most problems have a trick to them."],
  ],
  openness: [
    ["We do it the way {elders} did, and it works.", "New ways come and go. The old ones stay."],
    ["I'd like to see what's past the next hill.", "Every stranger knows something I don't."],
  ],
  conscientiousness: [
    ["It'll get done. Maybe not today.", "Why save {store} for a tomorrow that may not come?"],
    ["If you do a job, do it properly.", "Put some {store} by. You'll need it."],
  ],
  extraversion: [
    ["I'd rather listen than talk.", "Give me my own work and leave me to it."],
    ["I've never met anyone I couldn't talk to.", "A quiet house is a sad house."],
  ],
  agreeableness: [
    ["Everyone looks out for themselves. I just admit it.", "I know who owes me {store}, and I don't forget."],
    ["Nobody gets through a bad year alone.", "If a neighbour asks, I help."],
  ],
  neuroticism: [
    ["What comes, comes. No use fretting.", "I've seen bad years. This isn't one."],
    ["Something always goes wrong. I like to be ready.", "I don't sleep well before anything important."],
  ],
};

const forager: EraId[] = ["deep-prehistory", "early-holocene"];
const waged: EraId[] = ["1750-1850", "1850-1914", "1914-1945", "1945-1990", "contemporary"];

/** A line in the person's own voice. `roll` in [0, 1) picks between the two. */
export function sayingFor(stats: Stats, year: number | undefined, roll: number): string {
  const key = (Object.keys(lines) as (keyof Stats)[]).reduce((a, b) =>
    Math.abs(stats[b] - 50) > Math.abs(stats[a] - 50) ? b : a,
  );
  const pool = lines[key][stats[key] >= 50 ? 1 : 0];
  const era = year === undefined ? undefined : eraAt({ year })?.id;
  const old = era && forager.includes(era), paid = era && waged.includes(era);
  return pool[Math.floor(roll * pool.length)]
    .replace("{work}", old ? "the hunt" : "the work")
    .replace("{store}", old ? "meat" : paid ? "money" : "grain")
    .replace("{elders}", old ? "the ancestors" : paid ? "our parents" : "our grandparents");
}
