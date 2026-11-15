import props from "../graphics/props.json" with { type: "json" };
import type { Pack } from "../../core/types";
import { modernity } from "./modernity";

/** Which figures a place and date put up in public, and what it called them.
 * The art is `scripts/art/props_b/statuary*.py`: one figure per kind, in the
 * materials that kind was made in, at three sizes. A variant is named
 * `kind/material/size`. Inferred from each tradition's surviving public
 * sculpture; not a survey of any one city. */
type Row = readonly [from: number, to: number, kind: string, label: string, minRank?: number];

const NOW = 9999;
const variants = props.families.find((f) => f.id === "statuary")?.variants ?? [];

const classical: Row[] = [
  [-400, 500, "draped", "Statue of a magistrate"],
  [-400, 500, "goddess", "Statue of the city's goddess"],
  [-500, 500, "athlete", "Statue of a hero"],
  [-30, 500, "cuirass", "Statue of the emperor", 1],
  [-200, 500, "rider", "Equestrian statue", 2],
  [-300, 500, "bust", "Portrait bust"],
];
const republic: Row[] = [
  [1800, NOW, "worthy", "Statue of a statesman"],
  [1800, NOW, "orator", "Statue of an orator"],
  [1800, NOW, "rider", "Equestrian statue", 1],
  [1800, 1950, "goddess", "Allegory of the nation", 1],
  [1800, NOW, "bust", "Bust of a benefactor"],
  [1915, 1960, "soldier", "War memorial"],
];

const TABLE: Record<string, Row[]> = {
  europe: [
    ...classical,
    [500, 1550, "saint", "Statue of the town's saint"],
    [1100, 1600, "knight", "Statue of the town's champion", 1],
    [1500, 1800, "king", "Statue of the king", 1],
    [1500, 1800, "rider", "Equestrian statue of the king", 2],
    [1500, 1800, "saint", "Statue of a saint"],
    [1500, 1800, "goddess", "Allegorical figure", 1],
    ...republic,
  ],
  soviet: [
    [1920, 1992, "worker", "Heroic worker"],
    [1920, 1992, "orator", "Statue of the leader"],
    [1945, 1992, "soldier", "War memorial"],
    [1920, 1992, "bust", "Bust of a hero of labour"],
  ],
  america: [
    [1500, 1810, "saint", "Statue of a saint"],
    [1500, 1810, "king", "Statue of the king", 2],
    ...republic,
    [1790, NOW, "eagle", "Eagle column", 1],
  ],
  egypt: [
    [-3000, -30, "pharaoh", "Seated colossus", 1],
    [-3000, -30, "striding", "Statue of an official"],
    [-2600, -30, "sphinx", "Sphinx"],
  ],
  "near-east": [
    [-2500, -330, "lamassu", "Winged bull", 1],
    [-3000, -330, "striding", "Statue of a ruler"],
    [-3000, -330, "lion", "Guardian lion"],
  ],
  // Public figures came with the republics and kingdoms of the 1900s.
  "islamic-world": [
    [1920, NOW, "worthy", "Statue of the founder"],
    [1920, NOW, "rider", "Equestrian statue", 1],
    [1920, NOW, "bust", "Bust of a poet"],
  ],
  "south-asia": [
    [-300, 1200, "buddha-standing", "Standing Buddha"],
    [-300, 1200, "seated", "Seated Buddha"],
    [-300, 1850, "lion", "Lion on its pillar"],
    [300, 1850, "vishnu", "Image of Vishnu", 1],
    [300, 1850, "nandi", "Nandi"],
    [200, 1850, "tirthankara", "Standing tirthankara"],
    [300, 1850, "elephant", "Stone elephant", 1],
    [900, 1850, "nataraja", "Dancing Shiva", 1],
    [1850, 1947, "king", "Statue of the sovereign", 1],
    [1850, NOW, "worthy", "Statue of a statesman"],
    [1947, NOW, "orator", "Statue of a leader"],
    [1947, NOW, "bust", "Bust of a poet"],
  ],
  // Buddhas stood in temples, not at a crossing: a Chinese street's own
  // figures are its guardian lions and the stone officials of a spirit way.
  china: [
    [-200, 1912, "foo-lion", "Guardian lion"],
    [-200, 1912, "official", "Stone official"],
    [1912, NOW, "worthy", "Statue of a statesman"],
    [1949, 1990, "worker", "Heroic worker"],
    [1949, NOW, "orator", "Statue of the chairman", 1],
  ],
  japan: [
    [600, NOW, "jizo", "Jizo"],
    [700, 1870, "guardian", "Temple guardian", 1],
    [600, NOW, "haechi", "Guardian lion-dog"],
    [1870, NOW, "worthy", "Statue of a statesman"],
    [1890, 1945, "rider", "Equestrian statue", 2],
  ],
  korea: [
    [600, NOW, "haechi", "Haechi"],
    [600, 1910, "official", "Stone official"],
    [1950, NOW, "worthy", "Statue of a statesman"],
    [1950, NOW, "rider", "Equestrian statue", 2],
  ],
  "southeast-asia": [
    [600, NOW, "naga-buddha", "Buddha under the naga"],
    [300, NOW, "seated", "Seated Buddha"],
    [300, NOW, "buddha-standing", "Standing Buddha"],
    [700, 1900, "guardian", "Gate guardian", 1],
    [300, 1900, "elephant", "Stone elephant", 1],
    [1900, NOW, "worthy", "Statue of a statesman"],
  ],
  mesoamerica: [
    [-1500, -400, "olmec-head", "Colossal head"],
    [900, 1540, "atlantean", "Warrior column", 1],
    [900, 1540, "chacmool", "Chacmool"],
    [-300, 1540, "serpent-head", "Feathered serpent"],
  ],
  andes: [[-1000, 1540, "monolith", "Standing monolith"]],
  "west-africa": [
    [-500, 1900, "terracotta-seated", "Seated figure"],
    [800, 1900, "ancestor", "Ancestor figure"],
    [1300, 1900, "benin-head", "Royal head", 1],
    [1957, NOW, "worthy", "Statue of the founder"],
    [1957, NOW, "orator", "Independence monument", 1],
  ],
  "east-africa": [
    [800, 1900, "ancestor", "Ancestor figure"],
    [1100, 1700, "zimbabwe-bird", "Stone bird"],
    [1960, NOW, "worthy", "Statue of the founder"],
    [1960, NOW, "orator", "Independence monument", 1],
  ],
  steppe: [
    [-800, 1900, "balbal", "Stone figure"],
    [1920, 1992, "worker", "Heroic worker"],
    [1920, NOW, "rider", "Equestrian statue", 1],
  ],
  pacific: [
    [1000, 1870, "moai", "Moai", 1],
    [800, 1900, "tiki", "Tiki"],
    [1850, NOW, "worthy", "Statue of a founder"],
    [1915, NOW, "soldier", "War memorial"],
  ],
  "northwest-coast": [[1000, NOW, "totem", "Crest pole"]],
};

function tableFor(pack: Pack): Row[] {
  const { lon, lat } = pack.anchor;
  const year = pack.year;
  const region = modernity(pack.anchor).id;
  switch (pack.setting?.culture) {
    case "european":
      if (region === "north-america" || region === "latin-america" || region === "australasia")
        return region === "australasia" ? TABLE.pacific : TABLE.america;
      return year >= 1920 && year < 1992 && lon >= 23 ? TABLE.soviet : TABLE.europe;
    case "north-african-west-asian":
      if (year < -30 && lon >= 25 && lon <= 35 && lat >= 22 && lat <= 32) return TABLE.egypt;
      if (year < -330) return TABLE["near-east"];
      return year < 650 ? classical : TABLE["islamic-world"];
    case "south-asian":
      return TABLE["south-asia"];
    case "east-asian":
      return lon >= 129 ? TABLE.japan : lon >= 124 && lat >= 33 && lat <= 43 ? TABLE.korea : TABLE.china;
    case "southeast-asian":
      return TABLE["southeast-asia"];
    case "mesoamerican":
      return year < 1540 ? TABLE.mesoamerica : TABLE.america;
    case "andean":
      return year < 1540 ? TABLE.andes : TABLE.america;
    case "west-central-african":
      return TABLE["west-africa"];
    case "east-southern-african":
      return TABLE["east-africa"];
    case "inner-eurasian":
      return TABLE.steppe;
    case "australian-pacific":
      return TABLE.pacific;
    case "other-indigenous-american":
      return lon < -120 && lat > 45 ? TABLE["northwest-coast"] : [];
    default:
      return [];
  }
}

/** A statue for this place and date. `rank` is the town's standing, 0
 * provincial to 2 a capital: it sets the size and keeps the grandest kinds
 * for the towns that could raise them. `pick` in [0, 1) varies it. Undefined
 * where the tradition put up no public figures. */
export function statueFor(pack: Pack, pick = 0, rank = 1): { sprite: string; label: string; w: number } | undefined {
  const year = pack.year;
  const rows = tableFor(pack).filter(([from, to, kind, , min = 0]) =>
    year >= from && year < to && rank >= min && variants.some((v) => v.startsWith(`${kind}/`)));
  if (!rows.length) return undefined;
  const [, , kind, label] = rows[Math.floor(pick * rows.length) % rows.length];
  const size = Math.max(0, Math.min(2, rank));
  const made = variants.filter((v) => v.startsWith(`${kind}/`) && v.endsWith(`/${size}`));
  if (!made.length) return undefined;
  const name = made[Math.floor(pick * 7919) % made.length];
  return { sprite: `study-propb-statuary-${variants.indexOf(name)}`, label, w: kind === "rider" || size === 2 ? 3 : 1 };
}
