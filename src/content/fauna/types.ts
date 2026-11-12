import type { FaunaState } from "../../core/fauna";
import type { CharacterScope } from "../characters/context-types";
import studies from "../../render/generated/fauna-b-studies.json" with { type: "json" };
import studiesC from "../../render/generated/fauna-c-studies.json" with { type: "json" };
import studiesM from "../../render/generated/fauna-m-studies.json" with { type: "json" };
import studiesR from "../../render/generated/fauna-r-studies.json" with { type: "json" };
import studiesW from "../../render/generated/fauna-w-studies.json" with { type: "json" };
import studiesF from "../../render/generated/fauna-f-studies.json" with { type: "json" };
import studiesG from "../../render/generated/fauna-g-studies.json" with { type: "json" };
import studiesU from "../../render/generated/fauna-u-studies.json" with { type: "json" };
import studiesO from "../../render/generated/fauna-o-studies.json" with { type: "json" };
import studiesK from "../../render/generated/fauna-k-studies.json" with { type: "json" };
import studiesE from "../../render/generated/fauna-e-studies.json" with { type: "json" };
import studiesX from "../../render/generated/fauna-x-studies.json" with { type: "json" };
import studiesH from "../../render/generated/fauna-h-studies.json" with { type: "json" };

export const habitatTags = [
  "settlement",
  "field",
  "pasture",
  "open-grass",
  "scrub",
  "woodland",
  "forest-edge",
  "wetland",
  "shore",
  "rock",
  "water",
] as const;

export type HabitatTag = (typeof habitatTags)[number];

export type DietTag =
  | "seed"
  | "plant"
  | "grass"
  | "invertebrate"
  | "small-animal"
  | "rodent"
  | "ungulate";

export type FaunaProfile = {
  id: string;
  label: string;
  /** Binomial for the species, shown beside the common name. Domestic breeds
   * carry the domestic name where one is conventionally used. */
  latin?: string;
  category: "domestic" | "commensal" | "wild";
  locomotion: "ground" | "ground-and-flight";
  /** How it covers ground on screen. Absent means a steady walk. */
  gait?: "hop" | "scurry";
  social: "solitary" | "pair" | "flock" | "herd" | "pack";
  activity: "diurnal" | "nocturnal" | "crepuscular" | "flexible";
  groupSize: readonly [minimum: number, maximum: number];
  habitats: readonly { tag: HabitatTag; weight: number }[];
  /** Where and when the species occurs. No match means absent, never a
   * neighbour's animal standing in. */
  presence: readonly CharacterScope[];
  /** What a society must do before a kept species appears with it. */
  needs?: "herding" | "settled";
  /** Where a settlement that keeps this species puts it. A pen has a herder
   * and a gate it is let out of; a yard animal scratches about the houses; a
   * paddock is fenced and then left alone. `from` is the year the keeping
   * starts, for animals kept later than they were known. */
  keeping?: {
    /** A tether is one animal tied by its owner's door: the household donkey.
     * A run is a fenced strip of bank open to the water: the duck run. */
    place: "pen" | "yard" | "paddock" | "tether" | "run";
    from?: number;
    /** How much more often than its neighbours it is the animal kept. */
    share?: number;
    /** The share of households keeping it whose animals are out where you
     * would see them; the rest are indoors. */
    seen?: number;
    /** Herds at grass within a morning's walk of a settlement, per 64-cell
     * block of ideal grazing where herding is a living. Stock is not only
     * what is shut in the pen. */
    ranging?: number;
  };
  /** Expected groups per 64-cell block where every cell is ideal habitat. */
  density: number;
  /** Young of this species, spawned beside the adults rather than alone. */
  young?: { id: string; chance: number };
  /** Cells per six-second step at a walk; a person walks one. */
  pace: number;
  /** Keeps to the nearest grazing herd and feeds on what its feet put up. */
  followsHerds?: boolean;
  /** Terrace steps it goes up at a bound. Absent is one, the bank a person
   * scrambles; a deer clears two; an elephant, none, and needs a slope. */
  leaps?: number;
  /** Goes out on water too deep to wade, and climbs out on to the bank. */
  swims?: boolean;
  settlementTolerance: number;
  minimumSettlementDistance: number;
  alertRadius: number;
  cohesionRadius: number;
  separationRadius: number;
  calmDecisionSeconds: number;
  urgentDecisionSeconds: number;
  diet: readonly DietTag[];
  preyTags?: readonly DietTag[];
  /** What this animal counts as on another animal's list of prey. Absent
   * means nothing hunts it. */
  prey?: DietTag;
  palette: readonly string[];
  /** Frames for the default facing. A species without this is side-view only
   * and is mirrored for west; one with it has art authored per direction. */
  directions?: readonly FaunaFacing[];
  art: Partial<Record<FaunaState, readonly string[]>>;
  /** Bolts for its hole when frightened and stays down a while. */
  burrows?: boolean;
  /** Cells within which it goes for a person who has not touched it. */
  defends?: number;
  /** Lies up in mud or shallow water through the heat of the day. */
  wallows?: boolean;
  /** Comes in to remains after dark when nobody is by them. */
  scavenges?: boolean;
  /** Drawn at this size against the study it borrows. */
  scale?: number;
  /** Cells the drawn body reaches past its own: either side, and rows behind.
   * A buffalo is three cells long; two stood a cell apart are one blob. */
  body?: readonly [number, number];
};

/** Old World stock in the Americas: landed with Columbus in the Caribbean,
 * on the mainland with each conquest, and in the north with the colonies. */
export const columbianExchange = [
  { years: [1493, 10000], bounds: [-86, 10, -59, 24] },
  { years: [1521, 10000], bounds: [-118, 7, -77, 33] },
  { years: [1532, 10000], bounds: [-82, -56, -30, 10] },
  { years: [1600, 10000], bounds: [-170, 24, -52, 70] },
] as const;

export const faunaFacings = ["south", "east", "north", "west"] as const;
/** Clockwise from east, screen y down: the order `eightWay` indexes. */
export const eightFacings = ["east", "southeast", "south", "southwest", "west", "northwest", "north", "northeast"] as const;
export type FaunaFacing = (typeof eightFacings)[number];

/** The facing nearest a screen direction. Off a diagonal by up to `hold`
 * radians, `current` stays, so a sprite does not flick between two. */
export function eightWay(dx: number, dy: number, current?: FaunaFacing, hold = 0.55) {
  const angle = Math.atan2(dy, dx);
  const at = current ? eightFacings.indexOf(current) : -1;
  if (at >= 0) {
    const off = Math.abs(((angle - (at * Math.PI) / 4 + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);
    if (off < hold) return current!;
  }
  return eightFacings[(Math.round(angle / (Math.PI / 4)) + 8) % 8];
}

export function study(
  species: keyof typeof studies,
): Pick<FaunaProfile, "art" | "palette"> {
  return {
    palette: studies[species].palette,
    art: Object.fromEntries(
      Object.entries(studies[species].states).map(([state, count]) => [
        state,
        Array.from(
          { length: count },
          (_, frame) => `fauna-${species}-${state}-${frame}`,
        ),
      ]),
    ),
  };
}

/** Side-view species. Set B is the world's art, so it defines which states a
 * species has; the ids stay unprefixed and the renderer and the lab add the
 * prefix of the set they are drawing. */
/** Four-direction species. `art` carries the south frames; the other facings
 * differ only in the direction segment of the id. */
export function directionalStudy(
  species:
    | keyof typeof studiesC
    | keyof typeof studiesM
    | keyof typeof studiesR
    | keyof typeof studiesW
    | keyof typeof studiesF
    | keyof typeof studiesG
    | keyof typeof studiesU
    | keyof typeof studiesO
    | keyof typeof studiesK
    | keyof typeof studiesE
    | keyof typeof studiesX
    | keyof typeof studiesH,
): Pick<FaunaProfile, "art" | "palette" | "directions" | "body"> {
  const [set, studies] = (
    [
      ["faunam", studiesM],
      ["faunar", studiesR],
      ["faunaw", studiesW],
      ["faunaf", studiesF],
      ["faunag", studiesG],
      ["faunau", studiesU],
      ["faunao", studiesO],
      ["faunak", studiesK],
      ["faunae", studiesE],
      ["faunax", studiesX],
      ["faunah", studiesH],
      ["faunac", studiesC],
    ] as const
  ).find(([, s]) => species in s)!;
  const study = (
    studies as Record<
      string,
      {
        palette: string[];
        states: Record<string, number>;
        directions: string[];
        size: number[];
        standing?: number[];
      }
    >
  )[species];
  const [w, h] = [study.size[0], (study.standing ?? study.size)[1]];
  return {
    palette: study.palette,
    // Pixels at 16 a cell, less a margin: animals in a herd may touch.
    body: [Math.floor((w - 8) / 32), Math.floor((h - 8) / 24)],
    directions: study.directions as readonly FaunaFacing[],
    art: Object.fromEntries(
      Object.entries(study.states).map(([state, count]) => [
        state,
        Array.from(
          { length: count },
          (_, frame) => `${set}-${species}-${state}-south-${frame}`,
        ),
      ]),
    ),
  };
}

/** The frames to play for one facing. Side-view species ignore it; the caller
 * mirrors east art for west instead. */
export function faunaFrames(
  profile: FaunaProfile,
  state: FaunaState,
  facing: FaunaFacing,
): readonly string[] {
  const frames = profile.art[state] ?? [];
  if (!profile.directions) return frames;
  return frames.map((id) => id.replace("-south-", `-${facing}-`));
}
