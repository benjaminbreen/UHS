import type { CultureId } from "../../../history/types";
import type { trimPatterns } from "../../../../core/character";
import type { GarmentKit, Option } from "../types";

/**
 * The patterns worked into a garment's edges. Each is drawn as a small
 * repeating tile, so these name families, not particular textiles: the
 * stepped fret stands for Andean tocapu and the Mesoamerican
 * xicalcoliuhqui alike. Ordinary people had the plainer edge more often
 * than not; the patterned one is weighted up for wealth.
 */
type Pattern = (typeof trimPatterns)[number];

const edge = (patterns: readonly [Pattern, number][], plain = 3): readonly Option<Pattern>[] => [
  ...patterns.map(([value, weight]) => ({ value, weight })),
  { value: "none", weight: plain, means: ["poor", "common"] },
  ...patterns.map(([value, weight]) => ({ value, weight: weight * 2, means: ["wealthy" as const] })),
  { value: "none", weight: 1, means: ["wealthy"] },
];

const kit = (id: string, label: string, cultures: CultureId[], years: [number, number], patterns: readonly [Pattern, number][], plain?: number): GarmentKit => ({
  id: `trim-${id}`,
  label,
  scope: { years, cultures },
  trimPattern: edge(patterns, plain),
});

export const embroidery: readonly GarmentKit[] = [
  // The running key on Greek and Roman borders.
  kit("classical", "Greek and Roman borders", ["european"], [-800, 500], [["meander", 3], ["dots", 1]]),
  // Counted cross-stitch on shirt fronts and hems, from Byzantine work to
  // the folk dress of the Balkans, the Baltic and Ukraine.
  kit("europe-folk", "European counted work", ["european"], [500, 1950], [["cross-stitch", 3], ["diamond", 1], ["chevron", 1]], 4),
  // Tatreez on Levantine dress; lozenges in Amazigh weaving; block-printed spots.
  kit("wana", "Levantine and Maghrebi needlework", ["north-african-west-asian"], [-1000, 3000], [["cross-stitch", 3], ["diamond", 2], ["dots", 1]]),
  // Block-printed butis and woven borders.
  kit("south-asia", "Indian prints and borders", ["south-asian"], [-1000, 3000], [["dots", 3], ["diamond", 1], ["chevron", 1]], 2),
  // The fret (huiwen) on borders, and the four-lobed cloud collar on the
  // shoulders of court and theatre dress.
  kit("east-asia", "Frets and cloud collars", ["east-asian"], [-1000, 3000], [["meander", 3], ["cloud", 1], ["dots", 1]]),
  kit("se-asia", "Ikat and songket borders", ["southeast-asian"], [-500, 3000], [["diamond", 3], ["step", 2], ["chevron", 1]], 2),
  // Ram's-horn and lozenge on felt and on the deel's edge.
  kit("steppe", "Steppe felt and appliqué", ["inner-eurasian"], [-1000, 3000], [["meander", 2], ["diamond", 2]]),
  // Narrow strip-woven cloth, sewn edge to edge: kente, aso oke, kente's cousins.
  kit("west-africa", "Strip-woven cloth", ["west-central-african"], [1000, 3000], [["strip", 4], ["diamond", 1]], 2),
  kit("east-africa", "Beadwork and woven borders", ["east-southern-african"], [-1000, 3000], [["chevron", 2], ["diamond", 2]]),
  kit("andes", "Tocapu and stepped frets", ["andean"], [-1000, 1900], [["step", 3], ["diamond", 2], ["chevron", 1]], 2),
  kit("mesoamerica", "Stepped frets and woven diamonds", ["mesoamerican"], [-1000, 1900], [["step", 3], ["diamond", 2]], 2),
  kit("americas", "Quillwork and beadwork", ["other-indigenous-american"], [-1000, 1950], [["chevron", 2], ["diamond", 2], ["step", 1]]),
  kit("pacific", "Painted and plaited borders", ["australian-pacific"], [-1000, 1950], [["chevron", 2], ["step", 2]]),
];
