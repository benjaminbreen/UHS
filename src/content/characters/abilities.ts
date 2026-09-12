import { random } from "../../core/random";
import { statsOf } from "../../core/stats";
import type { Actor, Stats } from "../../core/types";

export type Ability = {
  id: string;
  label: string;
  /** Lucide icon name; the panel owns the component lookup. */
  icon: string;
  /** Which stat a rank in this leans on, for checks and for wording. */
  stat: keyof Stats;
  /** Livelihood ids this is the practised trade of. */
  match: RegExp;
};

/** Broad practices, not job titles: 138 livelihoods share these. */
export const abilities: readonly Ability[] = [
  {
    id: "foraging",
    label: "Foraging",
    icon: "Leaf",
    stat: "wit",
    match:
      /forager|gatherer|root-digger|shellfish|herbalist|peat-cutter|wood-gatherer/,
  },
  {
    id: "hunting",
    label: "Hunting",
    icon: "Crosshair",
    stat: "agility",
    match: /hunter|trapper|fowler/,
  },
  {
    id: "fishing",
    label: "Fishing",
    icon: "Fish",
    stat: "agility",
    match: /fisher|fisherman|net-maker/,
  },
  {
    id: "seafaring",
    label: "Boat handling",
    icon: "Sailboat",
    stat: "endurance",
    match: /boatman|ferryman|sailor|dock/,
  },
  {
    id: "herding",
    label: "Herding",
    icon: "Rabbit",
    stat: "endurance",
    match: /herder|drover|ostler|muleteer|beekeeper/,
  },
  {
    id: "grain-work",
    label: "Grain work",
    icon: "Wheat",
    stat: "endurance",
    match: /farmer|miller|baker|brewer|alewife|oil-presser/,
  },
  {
    id: "water-keeping",
    label: "Water keeping",
    icon: "Waves",
    stat: "conscientiousness",
    match: /water-carrier|laundress|washerwoman|laundry-worker|fuller/,
  },
  {
    id: "wayfinding",
    label: "Wayfinding",
    icon: "Compass",
    stat: "wit",
    match:
      /traveler|carter|porter|pedlar|chapman|hawker|navvy|bus-driver|lorry-driver|cabman/,
  },
  {
    id: "woodcraft",
    label: "Woodcraft",
    icon: "TreePine",
    stat: "strength",
    match:
      /carpenter|woodcutter|sawyer|cooper|wheelwright|charcoal-burner|thatcher/,
  },
  {
    id: "stonework",
    label: "Stonework",
    icon: "Mountain",
    stat: "strength",
    match:
      /mason|quarryman|brickmaker|lime-burner|bricklayer|flintknapper|miner|coal-miner/,
  },
  {
    id: "metalwork",
    label: "Metalwork",
    icon: "Hammer",
    stat: "strength",
    match: /smith|ironworker|boilermaker|welder|glazier|toolmaker/,
  },
  {
    id: "pottery",
    label: "Pottery repair",
    icon: "Amphora",
    stat: "agility",
    match: /potter/,
  },
  {
    id: "weaving",
    label: "Weaving",
    icon: "Grid2x2",
    stat: "agility",
    match:
      /weaver|spinner|dyer|tailor|seamstress|wool-comb|basket|cordage|rope-maker|power-loom/,
  },
  {
    id: "leatherwork",
    label: "Leatherwork",
    icon: "Scissors",
    stat: "agility",
    match: /tanner|leatherworker|hide-worker|saddler|cobbler/,
  },
  {
    id: "cooking",
    label: "Cooking",
    icon: "Soup",
    stat: "conscientiousness",
    match: /cook|butcher|scullion|kitchen-porter|waiter|innkeeper|publican/,
  },
  {
    id: "healing",
    label: "Healing",
    icon: "Heart",
    stat: "wit",
    match: /healer|midwife|nurse|wet-nurse|care-worker|hospital-orderly|barber/,
  },
  {
    id: "letters",
    label: "Letters",
    icon: "ScrollText",
    stat: "wit",
    match: /scribe|shop-assistant/,
  },
  {
    id: "bargaining",
    label: "Bargaining",
    icon: "ShoppingBag",
    stat: "extraversion",
    match: /trader|market-seller|costermonger|street-vendor|street-hawker/,
  },
  {
    id: "haulage",
    label: "Hauling",
    icon: "Package",
    stat: "strength",
    match:
      /labourer|dock-labourer|refuse-collector|sweeper|night-soil|chimney-sweep|charwoman|cleaner/,
  },
  {
    id: "machine-work",
    label: "Machine work",
    icon: "Cog",
    stat: "conscientiousness",
    match:
      /factory-hand|mill-worker|machine-operator|motor-mechanic|plumber|electrician|match-worker/,
  },
  {
    id: "housekeeping",
    label: "Housekeeping",
    icon: "Home",
    stat: "conscientiousness",
    match:
      /servant|housemaid|domestic|child-minder|childminder|sexton|night-watchman|security-guard|painter-and-decorator|hairdresser|soap-boiler|candle-maker|firekeeper|craftsperson/,
  },
];
const byId = new Map(abilities.map((a) => [a.id, a]));
/** Drawn on when nothing else fits, and as the one ability outside the trade. */
const common = [
  "foraging",
  "wayfinding",
  "cooking",
  "water-keeping",
  "woodcraft",
  "weaving",
];

export type HeldAbility = { ability: Ability; rank: 1 | 2 | 3 };

/** Derived, never stored: a resident costs nothing to give a trade. */
export function abilitiesOf(
  seed: string,
  actor: Pick<Actor, "id" | "age" | "appearance" | "stats" | "origin">,
): HeldAbility[] {
  const livelihood = actor.origin?.livelihood ?? "",
    stats = statsOf(seed, actor),
    age = actor.age ?? 30;
  const trade = abilities.filter((a) => a.match.test(livelihood));
  const picked: string[] = trade.slice(0, 2).map((a) => a.id);
  // Everyone knows one or two things outside their trade; which ones is stable.
  for (let i = 0; picked.length < (trade.length ? 4 : 3) && i < 6; i++) {
    const pick =
      common[
        Math.floor(random(seed, "ability", actor.id, String(i)) * common.length)
      ];
    if (!picked.includes(pick)) picked.push(pick);
  }
  return picked.map((id, i) => {
    const ability = byId.get(id)!;
    const practised = i < trade.length;
    // Practice, then aptitude, then years: a child is never at the top rank.
    let score =
      (practised ? 2.2 : 0.9) +
      (stats[ability.stat] - 50) / 45 +
      (stats.conscientiousness - 50) / 90 +
      (i === 0 ? 0.4 : 0);
    if (age < 14) score = Math.min(score, 1.2);
    else if (age >= 40) score += 0.3;
    return {
      ability,
      rank: (score >= 2.5 ? 3 : score >= 1.5 ? 2 : 1) as 1 | 2 | 3,
    };
  });
}
