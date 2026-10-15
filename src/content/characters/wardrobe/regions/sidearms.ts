import type { GarmentKit, Option } from "../types";

/**
 * What people carried at the hip or in the sash. Every kit spreads in the
 * soldier's options, or a regional kit would disarm its own soldiers.
 */

type Arm = Option<"none" | "dagger" | "sword" | "sabre" | "katana" | "kris">;
const fighters = ["soldier", "warrior", "retainer", "night-watchman"];
const armed = (main: Arm["value"], second: Arm["value"] = "dagger"): Arm[] => [
  { value: main, livelihoods: fighters, ages: ["youth", "adult", "elder"], weight: 4 },
  { value: second, livelihoods: fighters, ages: ["youth", "adult", "elder"], weight: 1 },
  { value: main, roles: ["soldier"], ages: ["youth", "adult", "elder"], weight: 4 },
  { value: second, roles: ["soldier"], ages: ["youth", "adult", "elder"], weight: 1 },
];
const men = { sex: ["male"], ages: ["adult", "elder"] } as const;

export const sidearms: readonly GarmentKit[] = [
  {
    id: "arms-ancient",
    label: "Swords and daggers",
    // Bronze swords from the second millennium BCE; a soldier's sidearm until
    // the bayonet replaced it in the nineteenth century.
    scope: { years: [-1700, 1870] },
    sidearm: [...armed("sword"), { value: "sword", roles: ["aristocrat"], ...men, weight: 2 }, { value: "none", roles: ["aristocrat"], ...men, weight: 2 }],
  },
  {
    id: "europe-dagger",
    label: "Europe · the everyday dagger",
    // Ballock and rondel daggers hung at the belts of townsmen as well as
    // soldiers, until the rapier and the law took them off the street.
    scope: { years: [1300, 1550], cultures: ["european"] },
    sidearm: [...armed("sword"), { value: "dagger", ...men, means: ["common", "wealthy"], weight: 1 }, { value: "none", ...men, means: ["common", "wealthy"], weight: 3 }],
  },
  {
    id: "europe-smallsword",
    label: "Europe · the gentleman's sword",
    // Rapier, then smallsword: part of a gentleman's dress from the 1550s
    // until the French Revolution made it look like the old regime.
    scope: { years: [1550, 1790], cultures: ["european"] },
    sidearm: [
      ...armed("sword", "sabre"),
      { value: "sword", ...men, means: ["wealthy", "elite"], weight: 3 },
      { value: "none", ...men, means: ["wealthy", "elite"], weight: 2 },
      { value: "sword", roles: ["gentleman"], weight: 3 },
      { value: "none", roles: ["gentleman"], weight: 1 },
    ],
  },
  {
    id: "europe-sabre",
    label: "Europe · the cavalry sabre",
    // Light-cavalry sabres on the Hungarian model, carried by officers into
    // the First World War.
    scope: { years: [1790, 1915], cultures: ["european"] },
    sidearm: armed("sabre", "sword"),
  },
  {
    id: "west-asia-sabre",
    label: "West Asia · the kilij, the shamshir and the khanjar",
    // Curved sabres from the thirteenth century; a curved dagger in the sash
    // was everyday dress for men from Arabia to Persia.
    scope: { years: [1250, 1920], cultures: ["north-african-west-asian"] },
    sidearm: [...armed("sabre"), { value: "dagger", ...men, means: ["common", "wealthy"], weight: 2 }, { value: "none", ...men, means: ["common", "wealthy"], weight: 3 }],
  },
  {
    id: "south-asia-talwar",
    label: "South Asia · the talwar and the katar",
    scope: { years: [1300, 1860], cultures: ["south-asian"] },
    sidearm: [...armed("sabre"), { value: "sabre", roles: ["aristocrat"], weight: 3 }, { value: "dagger", ...men, means: ["wealthy", "elite"], weight: 1 }, { value: "none", ...men, means: ["wealthy", "elite"], weight: 3 }],
  },
  {
    id: "steppe-sabre",
    label: "Steppe · sabre and knife",
    // The curved sabre is a steppe invention of about the eighth century;
    // every herder carried a knife at the belt.
    scope: { years: [700, 1900], cultures: ["inner-eurasian"] },
    sidearm: [...armed("sabre"), { value: "dagger", ...men, weight: 1 }, { value: "none", ...men, weight: 2 }],
  },
  {
    id: "china-dao",
    label: "China · the dao and the jian",
    scope: { years: [1000, 1912], cultures: ["east-asian"] },
    sidearm: armed("sabre", "sword"),
  },
  {
    id: "japan-katana",
    label: "Japan · the swords of the samurai",
    // The pair of long and short sword marked a samurai from the late
    // sixteenth century until the 1876 ban on wearing them.
    scope: { years: [1200, 1876], cultures: ["east-asian"], bounds: [128, 30, 146, 46] },
    sidearm: [...armed("katana", "katana"), { value: "katana", roles: ["aristocrat"], weight: 4 }],
  },
  {
    id: "island-kris",
    label: "Java and the Malay world · the kris",
    // A man's kris was worn at the back of the sash on any formal occasion,
    // and carried a family's standing with it.
    scope: { years: [1300, 1950], cultures: ["southeast-asian"] },
    sidearm: [...armed("kris", "sword"), { value: "kris", ...men, means: ["common", "wealthy", "elite"], weight: 2 }, { value: "none", ...men, means: ["common", "wealthy", "elite"], weight: 3 }],
  },
];
