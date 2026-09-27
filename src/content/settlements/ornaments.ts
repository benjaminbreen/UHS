import marketKits from "../graphics/market-kits.json" with { type: "json" };
import type { Pack, WorldObject } from "../../core/types";

/** What a public square held. Content names these per fabric; the planner only
 * places them, and the renderer only knows their sprites. A `monument` carries
 * no interaction: it is there to be looked at and to make the square read as a
 * particular place rather than an empty paved rectangle. */
export type Ornament = {
  id: string;
  label: string;
  sprite: string;
  kind: WorldObject["kind"];
  /** Cells the piece occupies, so a large one is not put in a doorway. */
  size: number;
  /** Larger sprite for the same thing when it is the square's centrepiece. */
  focusSprite?: string;
  /** The piece is its own platform or ground, so no dais is built under it. */
  grounded?: boolean;
};

/** What a street was lit by, where and when. Broad defaults, not a history of
 * public lighting: oil and then gas in western cities from about 1700, wired
 * lamps from the 1890s, sodium and its successors from about 1960. Before any
 * of that a city lit a square, not a street, and lit it with fire. */
export function lampFor(pack: Pack): { sprite: string; label: string } {
  const year = pack.year;
  const culture = pack.setting?.culture;
  const western =
    culture === "european" || culture === "north-african-west-asian";
  const eastern = culture === "east-asian" || culture === "southeast-asian";
  const variant = western ? 0 : eastern ? 1 : 2;
  const lamp = (id: string, label: string) => ({
    sprite: `study-propb-${id}-${variant}`,
    label,
  });
  if (year >= 2005) return { sprite: "study-propb-city-lamp-2", label: "Street lamp" };
  if (year >= 1960) return lamp("sodium-lamp", "Street lamp");
  if (year >= 1890) return lamp("electric-lamp", "Street lamp");
  if (year >= 1840 && culture === "european")
    return { sprite: "study-propb-city-lamp-0", label: "Gas lamp" };
  if (year >= 1700 && western) return lamp("gas-lamp", "Gas lamp");
  if (year >= 1000 && eastern) return lamp("lantern-post", "Lantern post");
  // A square's fire, not a lit street: the column is a classical and west
  // Asian habit, the plain post is everyone else's.
  if (year >= -499 && (western || culture === "south-asian"))
    return lamp("brazier-post", "Brazier column");
  return lamp("torch-post", "Torch post");
}

/** A municipal street's furniture, from the mid-nineteenth-century city on.
 * Undefined before that, which keeps each fabric's own pieces. The concrete
 * trestle bench and urn are the Soviet bloc's, placed by a rough map box. */
export function streetFurnitureFor(pack: Pack):
  | { bench: string; bin: string; planter: string; bollard: string; kiosk?: string; column?: string }
  | undefined {
  const year = pack.year;
  if (year < 1850) return undefined;
  const culture = pack.setting?.culture;
  const { lon, lat } = pack.anchor;
  const soviet =
    year >= 1930 && year < 1992 &&
    (culture === "inner-eurasian" || (culture === "european" && lon >= 23 && lat >= 44));
  const paris = culture === "european" && year < 1960;
  const at = (id: string, v: number) => `study-propb-${id}-${v}`;
  return {
    bench: at("street-bench", soviet ? 2 : year >= 1960 ? 3 : paris ? 1 : 0),
    bin: at("street-bin", soviet ? 1 : year >= 1960 ? 2 : 0),
    planter: at("street-planter", soviet || year >= 1950 ? 2 : paris ? 0 : 1),
    bollard: at("street-bollard", year >= 1950 ? 1 : 0),
    kiosk: paris && year >= 1857 ? at("news-kiosk", 0) : undefined,
    column: paris && year >= 1855 ? at("morris-column", 0) : undefined,
  };
}

type MarketKit = keyof typeof marketKits.kits;

/** Which culture's pitches a market is built from, before the modern barrow.
 * Undefined falls back to the five generic builds below. */
function marketKit(pack: Pack): MarketKit | undefined {
  const s = pack.setting;
  const year = pack.year;
  if (!s || year >= 1900) return undefined;
  switch (s.culture) {
    case "mesoamerican":
      return year < 1540 ? "tianguis" : undefined;
    case "european":
      return year < 500 ? "roman" : year < 1800 ? "medieval" : undefined;
    case "north-african-west-asian":
      return year < 640 && s.architecture === "classical" ? "roman" : "souk";
    case "east-asian":
    case "southeast-asian":
      return year >= 500 ? "eastasia" : undefined;
    case "west-central-african":
    case "east-southern-african":
      return "westafrica";
    default:
      return undefined;
  }
}

/** What a market sold from. Five builds, chosen by date and region: trestles
 * before anything else, an awning where cloth was cheap, a roofed booth for a
 * permanent pitch, a cart for the street trader, a tubular barrow after that. */
export function stallFor(
  pack: Pack,
  index = 0,
  trade?: number,
): { sprite: string; label: string } {
  const year = pack.year;
  const culture = pack.setting?.culture;
  const kit = marketKit(pack);
  if (kit) {
    const { trades, label } = marketKits.kits[kit];
    // One trade to a row where the caller says which; the size varies along it.
    const t = (trade ?? index) % trades.length;
    const variant = t * marketKits.forms + (index % marketKits.forms);
    return { sprite: `study-propb-pitch-${kit}-${variant}`, label };
  }
  const eastern = culture === "east-asian" || culture === "southeast-asian";
  // Region before date for the booth: the roofed pitch was the east and
  // southeast Asian street into the twentieth century, and a Qing city was
  // getting European market barrows before this rule was the other way round.
  const build =
    year >= 1900
      ? "stall-modern"
      : eastern && year >= 500
        ? "stall-booth"
        : year >= 1650
          ? "stall-cart"
          : year >= -499
            ? "stall-awning"
            : "stall-trestle";
  const label =
    build === "stall-modern"
      ? "Market barrow"
      : build === "stall-cart"
        ? "Market cart"
        : build === "stall-booth"
          ? "Market booth"
          : build === "stall-awning"
            ? "Market stall"
            : "Trestle stall";
  // Neighbouring pitches are not the same pitch twice.
  return { sprite: `study-propb-${build}-${index % 3}`, label };
}

/** What a square is built round. Undefined leaves the fabric's own choice
 * alone, which is the right answer for a camp, a hamlet, and for places whose
 * assembly ground never had a monument in it. */
export function focusFor(
  pack: Pack,
  pick = 0,
): { sprite: string; label: string } | undefined {
  const year = pack.year;
  const culture = pack.setting?.culture;
  const urban =
    pack.setting?.settlement === "city" || pack.setting?.settlement === "port";
  const piece = (n: number, label: string) => ({
    sprite: `study-propb-square-focus-${n}`,
    label,
  });
  const { lon, lat } = pack.anchor;
  // Variants of study-propb-monument; `pick` in [0, 1) varies squares of one kind.
  const one = (...options: [number, string][]) => {
    const [n, label] = options[Math.floor(pick * options.length) % options.length];
    return { sprite: `study-propb-monument-${n}`, label };
  };
  if (culture === "european") {
    // Documented: Roman fora, market crosses, baroque fountains and obelisks,
    // the 19th-century bronze, interwar memorials, Soviet-bloc heroic figures.
    if (year >= -200 && year < 450)
      return one([13, "Honorific column"], [14, "Statue of a magistrate"], [15, "Gilt equestrian statue"]);
    if (year >= 450 && year < 1150) return undefined;
    if (year < 1550) return one([16, "Market cross"], [17, "Market cross"]);
    if (year < 1780)
      return one([7, "Public fountain"], [25, "Obelisk"], [4, "Marble statue"], [1, "Equestrian statue"]);
    if (year < 1914)
      return one([0, "Equestrian statue"], [2, "Bronze statue"], [3, "Bronze statue"],
        [5, "Statue fountain"], [6, "Statue fountain"], [7, "Public fountain"]);
    const eastern = lon >= 19 && lat >= 41;
    if (eastern && year >= 1925 && year < 1992)
      return one([8, "Heroic monument"], [26, "Heroic monument"], [9, "War memorial"]);
    if (year < 1960) return one([10, "War memorial"], [9, "War memorial"], [2, "Bronze statue"]);
    return one([11, "Sculpture"], [12, "Sculpture"], [10, "War memorial"], [5, "Statue fountain"]);
  }
  if (culture === "east-asian") {
    // Stone lanterns stand at shrines and temples, mostly in Japan; bixi steles
    // are Chinese from the Tang on and were copied in Korea and Vietnam.
    if (lon >= 129) return one([19, "Stone lantern"], [0, "Memorial arch"]);
    return year >= 600 ? one([0, "Memorial arch"], [20, "Stele on a tortoise"]) : piece(0, "Memorial arch");
  }
  if (culture === "southeast-asian") return piece(2, "Spirit house");
  if (culture === "south-asian") {
    if (year >= -270 && year < 600) return one([22, "Lion pillar"], [1, "Inscribed stele"]);
    // Chhatris are Rajput and Mughal, from about 1500.
    return year >= 1500 ? one([21, "Chhatri"], [1, "Inscribed stele"]) : piece(1, "Inscribed stele");
  }
  // The canopied fountain is the civic gift of an Islamic city; before that
  // the classical vocabulary the fabric already has is the better answer.
  if (culture === "north-african-west-asian") {
    const egypt = lon >= 25 && lon <= 35 && lat >= 22 && lat <= 32;
    if (egypt && year < -30) return one([24, "Obelisk"]);
    if (year >= -200 && year < 640) return one([13, "Honorific column"], [14, "Statue of a magistrate"]);
    // The şadırvan courtyard fountain is Ottoman and Mamluk; the sabil older.
    if (year >= 1350 && pick < 0.5) return one([18, "Ablution fountain"]);
    return year >= 699 ? piece(3, "Public fountain") : undefined;
  }
  if (
    culture === "west-central-african" ||
    culture === "east-southern-african"
  )
    return piece(4, "Assembly tree");
  // Carved stelae stood in Maya plazas through the Classic period.
  if (culture === "mesoamerican")
    return year >= -300 && year < 950 ? one([23, "Carved stela"]) : piece(5, "Stepped platform");
  if (culture === "andean") return piece(6, "Stone dais");
  if (culture === "inner-eurasian") return piece(7, "Cairn");
  if (culture === "australian-pacific") return piece(10, "Carved post");
  // Anywhere else, a nineteenth-century town square got a clock.
  return year >= 1900 && urban ? piece(9, "Clock tower") : undefined;
}

/** What hangs at a door, where anything does. A lantern is an east and
 * southeast Asian habit; elsewhere the threshold object is a different shape,
 * and most places have none at all. */
export function doorwayFor(pack: Pack): number | undefined {
  const year = pack.year;
  switch (pack.setting?.culture) {
    case "east-asian":
      return 0;
    case "southeast-asian":
      return 2;
    case "south-asian":
      return 6;
    case "north-african-west-asian":
      return year >= 699 ? 3 : undefined;
    case "european":
      return year >= 1820 ? 4 : year >= 1099 ? 5 : undefined;
    default:
      return undefined;
  }
}

export const ornaments: Record<string, Ornament> = {
  well: {
    id: "well",
    label: "Public well",
    sprite: "well",
    kind: "well",
    size: 2,
    grounded: true,
  },
  fountain: {
    id: "fountain",
    label: "Public fountain",
    sprite: "fountain",
    focusSprite: "monument-fountain",
    kind: "well",
    size: 2,
  },
  brazier: {
    id: "brazier",
    label: "Public brazier",
    sprite: "fire",
    kind: "fire",
    size: 1,
  },
  statue: {
    id: "statue",
    label: "Statue on a plinth",
    sprite: "statue",
    focusSprite: "monument-statue",
    kind: "monument",
    size: 1,
  },
  stele: {
    id: "stele",
    label: "Inscribed stone",
    sprite: "stele",
    focusSprite: "monument-obelisk",
    kind: "monument",
    size: 1,
  },
  cross: {
    id: "cross",
    label: "Market cross",
    sprite: "market-cross",
    focusSprite: "monument-cross",
    kind: "monument",
    size: 1,
  },
  kiosk: {
    id: "kiosk",
    label: "Kiosk",
    sprite: "kiosk",
    kind: "monument",
    size: 2,
  },
  altar: {
    id: "altar",
    label: "Stepped platform",
    sprite: "altar-platform",
    kind: "monument",
    size: 2,
  },
  post: {
    id: "post",
    label: "Chain post",
    sprite: "post",
    kind: "monument",
    size: 1,
  },
  planter: {
    id: "planter",
    label: "Planter",
    sprite: "planter",
    kind: "monument",
    size: 1,
  },
  bench: {
    id: "bench",
    label: "Bench",
    sprite: "bench",
    kind: "monument",
    size: 1,
  },
  lamp: {
    id: "lamp",
    label: "Lamp post",
    sprite: "lamp-post",
    kind: "monument",
    size: 1,
  },
};
