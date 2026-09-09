import type { CharacterAppearance } from "../../../core/character";
import type { AppearanceKit, CommunityProfile } from "../context-types";

/**
 * Reusable visual palettes. These are art direction for a bounded scenario,
 * never estimates of population frequencies and never cues for personality or
 * occupation. Community profiles below choose the palette explicitly.
 */
const paletteEvidence = (claim: string) => ({
  status: "fictional" as const,
  claim,
  sources: [],
  limitation:
    "This is a fictional schematic art range for legibility and variety, not a measured historical skin or hair distribution. It does not encode ancestry, identity, health, status, or personality.",
});

const darkHair: readonly CharacterAppearance["hair"][] = [
  "cropped",
  "curls",
  "long",
  "braid",
  "bald",
];
const variedHair: readonly CharacterAppearance["hair"][] = [
  "cropped",
  "curls",
  "bob",
  "long",
  "braid",
  "topknot",
  "bald",
];

export const appearanceKits: AppearanceKit[] = [
  {
    id: "appearance.europe-broad",
    label: "Broad European visual palette",
    evidence: paletteEvidence(
      "Use a varied light-to-medium complexion and hair palette for broadly scoped European scenes.",
    ),
    skin: ["#f0ceb0", "#e4b994", "#d3a16a", "#b78464", "#a97143"],
    hairColors: ["#1f1712", "#3b281c", "#6b472d", "#9a6a3f", "#c2a078"],
    hairStyles: variedHair,
    garments: [
      "tunic",
      "long-tunic",
      "robe",
      "skirt",
      "shirt",
      "coat",
      "dress",
    ],
  },
  {
    id: "appearance.english-colonial-light",
    label: "English-colonial Virginia light-complexion palette",
    evidence: paletteEvidence(
      "Use a light-complexion range with natural hair-color variation for the English-colonial Virginia scenario.",
    ),
    skin: ["#f0ceb0", "#edc5a3", "#e4b994", "#dcb086"],
    hairColors: [
      "#171312",
      "#3b281c",
      "#6b472d",
      "#9a6a3f",
      "#c2a078",
      "#d2b98f",
    ],
    hairStyles: variedHair,
    garments: ["tunic", "long-tunic", "robe", "skirt", "wrap"],
  },
  {
    id: "appearance.africa-broad",
    label: "Broad African visual palette",
    evidence: paletteEvidence(
      "Use a varied medium-brown-to-deep-brown complexion palette and predominantly dark hair for broadly scoped African scenes.",
    ),
    skin: ["#70472f", "#5a3828", "#8c5d40", "#3f2922", "#a97143"],
    hairColors: ["#171312", "#241814", "#302019", "#3b281c"],
    hairStyles: darkHair,
    garments: ["wrap", "skirt", "tunic", "long-tunic", "robe"],
  },
  {
    id: "appearance.asia-broad",
    label: "Broad Asian visual palette",
    evidence: paletteEvidence(
      "Use a varied light-to-deep-ochre complexion range and predominantly dark hair for broadly scoped Asian scenes.",
    ),
    skin: ["#e4b994", "#d3a16a", "#b78464", "#a97143", "#8c5d40"],
    hairColors: ["#171312", "#241814", "#3b281c", "#4a3020"],
    hairStyles: ["cropped", "bob", "long", "braid", "topknot", "bald"],
    garments: ["tunic", "long-tunic", "robe", "skirt", "wrap"],
  },
  {
    id: "appearance.americas-broad",
    label: "Broad American visual palette",
    evidence: paletteEvidence(
      "Use a varied medium-to-deep-brown complexion palette and dark hair for broadly scoped American scenes.",
    ),
    skin: ["#a97143", "#8c5d40", "#70472f", "#b78464", "#5a3828"],
    hairColors: ["#171312", "#241814", "#302019", "#3b281c"],
    hairStyles: ["cropped", "curls", "long", "braid", "topknot", "bald"],
    garments: ["wrap", "skirt", "tunic", "long-tunic", "robe"],
  },
  {
    id: "appearance.oceania-broad",
    label: "Broad Oceania visual palette",
    evidence: paletteEvidence(
      "Use a varied medium-brown-to-deep-brown complexion palette and dark hair for broadly scoped Oceania scenes.",
    ),
    skin: ["#8c5d40", "#70472f", "#5a3828", "#a97143", "#b78464"],
    hairColors: ["#171312", "#241814", "#302019", "#3b281c"],
    hairStyles: darkHair,
    garments: ["wrap", "skirt", "tunic", "long-tunic"],
  },
  {
    id: "appearance.congo-basin-1000-1800",
    label: "Congo Basin, 1000–1800 visual palette",
    evidence: paletteEvidence(
      "For Congo Basin communities between 1000 and 1800 CE, use deep-brown complexions and dark hair with modest art variation.",
    ),
    skin: ["#3f2922", "#4d3025", "#5a3828", "#70472f", "#8c5d40"],
    hairColors: ["#12100f", "#171312", "#241814", "#302019"],
    hairStyles: darkHair,
    garments: ["wrap", "skirt", "tunic", "long-tunic"],
  },
];

const profileEvidence = (
  claim: string,
  sources: string[],
  limitation: string,
) => ({ status: "inferred" as const, claim, sources, limitation });

const inferredPaletteLimit =
  "The appearance reference is an inferred schematic art palette, not an exact historical skin distribution or a claim that every resident looked alike. Community membership does not determine personality, ability, or occupation.";

const fallbackEvidence = (claim: string) => ({
  status: "fictional" as const,
  claim,
  sources: [],
  limitation:
    "Fictional low-priority art defaults used only where no more specific community research matches. They are schematic palette choices, not evidence of historical population appearance or a universal regional identity.",
});

export const communityProfiles: CommunityProfile[] = [
  {
    id: "community.haitian-rural",
    label: "Haitian rural scenario · nineteenth century",
    scope: { years: [1800, 1900], bounds: [-74.6, 18, -71.5, 20.1] },
    priority: 80,
    appearance: "appearance.africa-broad",
    livelihoods: [
      "farmer",
      "herder",
      "fisher",
      "gatherer",
      "craftsperson",
      "trader",
      "traveler",
    ],
    allowedItems: [
      "water",
      "fruit",
      "berries",
      "wood",
      "fish",
      "tool",
      "grain",
      "wool",
    ],
    evidence: fallbackEvidence(
      "A qualified rural Haitian starting scenario. Shared farming/herding mechanics and generic grain/wool are gameplay stand-ins awaiting local crop and livestock research.",
    ),
  },
  {
    id: "community.regional-europe",
    label: "Broad European regional art fallback",
    scope: {
      years: [-100000, 2027],
      cultures: ["european"],
      bounds: [-25, 34, 45, 72],
    },
    priority: 1,
    appearance: "appearance.europe-broad",
    livelihoods: [
      "gatherer",
      "hunter",
      "farmer",
      "craftsperson",
      "trader",
      "traveler",
    ],
    allowedItems: [
      "water",
      "fruit",
      "berries",
      "wood",
      "fish",
      "tool",
      "grain",
    ],
    evidence: fallbackEvidence(
      "Provide a broad European visual and livelihood fallback when no scoped community profile is available.",
    ),
  },
  {
    id: "community.regional-africa",
    label: "Broad African regional art fallback",
    scope: {
      years: [-100000, 2027],
      cultures: ["west-central-african", "east-southern-african"],
      bounds: [-18, -35, 52, 38],
    },
    priority: 1,
    appearance: "appearance.africa-broad",
    livelihoods: [
      "gatherer",
      "hunter",
      "farmer",
      "fisher",
      "craftsperson",
      "trader",
      "traveler",
    ],
    allowedItems: [
      "water",
      "fruit",
      "berries",
      "reeds",
      "wood",
      "fish",
      "tool",
      "grain",
    ],
    evidence: fallbackEvidence(
      "Provide a broad African visual and livelihood fallback when no scoped community profile is available.",
    ),
  },
  {
    id: "community.regional-asia",
    label: "Broad Asian regional art fallback",
    scope: {
      years: [-100000, 2027],
      cultures: [
        "north-african-west-asian",
        "inner-eurasian",
        "south-asian",
        "east-asian",
        "southeast-asian",
      ],
      bounds: [25, -10, 150, 78],
    },
    priority: 1,
    appearance: "appearance.asia-broad",
    livelihoods: [
      "gatherer",
      "hunter",
      "farmer",
      "fisher",
      "craftsperson",
      "trader",
      "traveler",
    ],
    allowedItems: [
      "water",
      "fruit",
      "berries",
      "reeds",
      "wood",
      "fish",
      "tool",
      "grain",
    ],
    evidence: fallbackEvidence(
      "Provide a broad Asian visual and livelihood fallback when no scoped community profile is available.",
    ),
  },
  {
    id: "community.regional-americas",
    label: "Broad American regional art fallback",
    scope: {
      years: [-100000, 2027],
      cultures: ["mesoamerican", "andean", "other-indigenous-american"],
      bounds: [-170, -56, -30, 72],
    },
    priority: 1,
    appearance: "appearance.americas-broad",
    livelihoods: [
      "gatherer",
      "hunter",
      "farmer",
      "fisher",
      "craftsperson",
      "trader",
      "traveler",
    ],
    allowedItems: [
      "water",
      "fruit",
      "berries",
      "reeds",
      "wood",
      "fish",
      "tool",
      "grain",
    ],
    evidence: fallbackEvidence(
      "Provide a broad American visual and livelihood fallback when no scoped community profile is available.",
    ),
  },
  {
    id: "community.regional-oceania",
    label: "Broad Oceania regional art fallback",
    scope: {
      years: [-100000, 2027],
      cultures: ["australian-pacific"],
      bounds: [110, -50, 180, 25],
    },
    priority: 1,
    appearance: "appearance.oceania-broad",
    livelihoods: [
      "gatherer",
      "hunter",
      "farmer",
      "fisher",
      "craftsperson",
      "trader",
      "traveler",
    ],
    allowedItems: [
      "water",
      "fruit",
      "berries",
      "reeds",
      "wood",
      "fish",
      "tool",
      "lizard",
    ],
    evidence: fallbackEvidence(
      "Provide a broad Oceania visual and livelihood fallback when no scoped community profile is available.",
    ),
  },
  {
    id: "community.congo-basin",
    label: "Congo Basin community, 1000–1800",
    scope: {
      years: [1000, 1800],
      bounds: [12, -14, 31, 6],
      communities: ["local", "indigenous-local"],
    },
    priority: 80,
    appearance: "appearance.congo-basin-1000-1800",
    livelihoods: [
      "gatherer",
      "farmer",
      "fisher",
      "hunter",
      "craftsperson",
      "trader",
      "traveler",
    ],
    allowedItems: [
      "water",
      "fruit",
      "berries",
      "reeds",
      "wood",
      "fish",
      "tool",
      "grain",
    ],
    evidence: profileEvidence(
      "Bounded Congo Basin visual and livelihood defaults for communities in the 1000–1800 CE window.",
      ["https://www.metmuseum.org/toah/ht/08/afc.html"],
      `${inferredPaletteLimit} The source discusses Central Africa in 1400–1600; extension across this larger region and date window is an inference. Livelihoods are broad gameplay categories, not a household census.`,
    ),
  },
  {
    id: "community.australian-interior-pre1788",
    label: "Australian interior community before 1788",
    scope: {
      years: [-100000, 1788],
      bounds: [122, -31, 138, -15],
      communities: ["local", "indigenous-local"],
    },
    priority: 90,
    appearance: "appearance.oceania-broad",
    livelihoods: ["gatherer", "hunter", "fisher", "traveler", "craftsperson"],
    allowedItems: [
      "water",
      "fruit",
      "berries",
      "reeds",
      "wood",
      "fish",
      "tool",
      "lizard",
    ],
    evidence: profileEvidence(
      "Use a dark-complexion, dark-hair visual default and mobile foraging, hunting, fishing, and craft roles for an Australian interior community before 1788.",
      [
        "https://australian.museum/about/history/exhibitions/indigenous-australians/",
      ],
      `${inferredPaletteLimit} This compact role list is a scenario extrapolation, not every Aboriginal nation or practice. Excluded grain/bread mean the existing wheat-based assets are unsuitable, not that seed processing or baking was absent. Very early dates remain speculative.`,
    ),
  },
  {
    id: "community.english-colonial",
    label: "English-colonial Virginia, 1607–1750",
    scope: {
      years: [1607, 1750],
      bounds: [-83.7, 36.5, -75.2, 39.5],
      communities: ["english-colonial"],
    },
    priority: 100,
    appearance: "appearance.english-colonial-light",
    livelihoods: [
      "farmer",
      "herder",
      "craftsperson",
      "trader",
      "traveler",
      "gatherer",
      "fisher",
    ],
    allowedItems: [
      "water",
      "fruit",
      "berries",
      "wood",
      "fish",
      "tool",
      "grain",
      "bread",
      "coin",
      "flax",
      "wool",
    ],
    evidence: profileEvidence(
      "Use a varied light-complexion visual default and English-colonial livelihood set for Virginia settlements from 1607 to 1750.",
      [
        "https://www.nps.gov/jame/learn/historyculture/the-virginia-company-of-london.htm",
      ],
      `${inferredPaletteLimit} This is one explicitly selected community in Virginia; it must not become a universal regional appearance rule.`,
    ),
  },
  {
    id: "community.indigenous-local-virginia",
    label: "Indigenous local community in Virginia, 1607–1750",
    scope: {
      years: [1000, 1750],
      bounds: [-83.7, 36.5, -75.2, 39.5],
      communities: ["indigenous-local"],
    },
    priority: 95,
    appearance: "appearance.americas-broad",
    livelihoods: [
      "farmer",
      "gatherer",
      "hunter",
      "fisher",
      "craftsperson",
      "trader",
      "traveler",
    ],
    allowedItems: [
      "water",
      "fruit",
      "berries",
      "reeds",
      "wood",
      "fish",
      "tool",
      "grain",
    ],
    evidence: profileEvidence(
      "Keep an Indigenous local Virginia community distinct from the English-colonial community when both are available in the same place and dates.",
      [
        "https://www.nps.gov/jame/learn/historyculture/chronology-of-powhatan-indian-activity.htm",
      ],
      `${inferredPaletteLimit} The profile is a regional art and gameplay abstraction and does not identify a single historical nation or imply uniform appearance.`,
    ),
  },
  {
    id: "community.african-diaspora-virginia",
    label: "African-diaspora community in Virginia, 1619–1750",
    scope: {
      years: [1619, 1750],
      bounds: [-83.7, 36.5, -75.2, 39.5],
      communities: ["african-diaspora"],
    },
    priority: 95,
    appearance: "appearance.africa-broad",
    livelihoods: [
      "farmer",
      "craftsperson",
      "trader",
      "fisher",
      "gatherer",
      "traveler",
    ],
    allowedItems: [
      "water",
      "fruit",
      "berries",
      "wood",
      "fish",
      "tool",
      "grain",
      "bread",
      "flax",
    ],
    evidence: profileEvidence(
      "Keep an African-diaspora Virginia community distinct from both English-colonial and Indigenous local communities in the 1619–1750 window.",
      ["https://encyclopediavirginia.org/entries/africans-virginias-first/"],
      `${inferredPaletteLimit} The profile marks a historically distinct community context; it does not collapse diverse African origins or later Virginia experiences into one appearance.`,
    ),
  },
];
