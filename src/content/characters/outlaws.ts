import type { CharacterScope, Livelihood } from "./context-types";

// Robbery on the road and in the street was an ordinary hazard of travel for
// most of history. These are the people who did it, by what they were called
// here and then; `src/content/accosters.ts` says when and where they stop the player.

const ROMAN: CharacterScope["bounds"] = [-10, 24, 45, 56];
const BRITAIN: CharacterScope["bounds"] = [-11, 49, 2, 61];
const IRELAND: CharacterScope["bounds"] = [-11, 51, -5, 56];
const ITALY: CharacterScope["bounds"] = [6, 36, 19, 47.2];
const IBERIA: CharacterScope["bounds"] = [-10, 36, 4, 44];
const BALKANS: CharacterScope["bounds"] = [13, 34, 30, 48];
const GREECE: CharacterScope["bounds"] = [19, 34, 30, 42];
const GERMANY: CharacterScope["bounds"] = [5, 45, 20, 55];
const FRANCE: CharacterScope["bounds"] = [-5, 42, 8, 51];
const JAPAN: CharacterScope["bounds"] = [129, 30, 146, 46];
const CHINA: CharacterScope["bounds"] = [97, 18, 125, 45];
const INDIA: CharacterScope["bounds"] = [66, 6, 92, 36];
const ARABIA: CharacterScope["bounds"] = [-17, 12, 60, 35];
const MEXICO: CharacterScope["bounds"] = [-118, 14, -86, 33];
const SERTAO: CharacterScope["bounds"] = [-48, -17, -34, -2];
const AUSTRALIA: CharacterScope["bounds"] = [112, -44, 154, -10];
const US_WEST: CharacterScope["bounds"] = [-125, 28, -95, 49];
const PARIS: CharacterScope["bounds"] = [1.9, 48.6, 2.8, 49.1];

/** Who robbed for a living, by what they were called here and then. Weights
 * are a small share of the grown men of a place, rarer than any trade: art
 * direction, not crime statistics. */
export const outlawLivelihoods: readonly Livelihood[] = [
  {
    id: "bandit",
    label: "Bandit",
    activity: "Watching the road",
    workplace: "wild",
    tier: "village",
    ages: [16, 46],
    sex: "male",
    rank: "destitute",
    weight: 1.5,
    labels: [
      { scope: { years: [-500, 480], bounds: ROMAN }, label: "Latro" },
      { scope: { years: [280, 480], bounds: FRANCE }, label: "Bagauda" },
      { scope: { years: [1100, 1650], bounds: BRITAIN }, label: "Outlaw" },
      { scope: { years: [1650, 1800], bounds: IRELAND }, label: "Rapparee" },
      { scope: { years: [1500, 1880], bounds: ITALY }, label: "Brigand" },
      { scope: { years: [1700, 1900], bounds: IBERIA }, label: "Bandolero" },
      { scope: { years: [1450, 1880], bounds: BALKANS, except: [GREECE] }, label: "Haiduk" },
      { scope: { years: [1450, 1830], bounds: GREECE }, label: "Klepht" },
      { scope: { years: [700, 1870], bounds: JAPAN }, label: "Mountain Bandit" },
      { scope: { years: [1912, 1950], bounds: CHINA }, label: "Tufei" },
      { scope: { years: [1500, 1950], bounds: INDIA }, label: "Dacoit" },
      { scope: { years: [-1000, 1930], bounds: ARABIA, cultures: ["north-african-west-asian"] }, label: "Raider" },
      { scope: { years: [1810, 1920], bounds: MEXICO }, label: "Bandido" },
      { scope: { years: [1870, 1941], bounds: SERTAO }, label: "Cangaceiro" },
      { scope: { years: [1790, 1880], bounds: AUSTRALIA }, label: "Bushranger" },
      { scope: { years: [1860, 1910], bounds: US_WEST }, label: "Road Agent" },
    ],
    inventory: { water: 1, bread: 1, coin: 1 },
  },
  {
    id: "highwayman",
    label: "Highwayman",
    activity: "Watching the road",
    workplace: "wild",
    tier: "village",
    years: [1600, 1840],
    bounds: BRITAIN,
    ages: [18, 41],
    sex: "male",
    rank: "labouring",
    weight: 0.12,
    inventory: { water: 1, coin: 3, shot: 4 },
  },
  {
    id: "footpad",
    label: "Street Robber",
    activity: "Working the streets",
    workplace: "market",
    tier: "town",
    minPopulation: 2000,
    ages: [15, 41],
    sex: "male",
    rank: "destitute",
    weight: 0.3,
    labels: [
      { scope: { years: [-200, 480], bounds: ROMAN }, label: "Grassator" },
      { scope: { years: [1600, 1850], bounds: BRITAIN }, label: "Footpad" },
      { scope: { years: [1850, 1880], bounds: BRITAIN }, label: "Garrotter" },
      { scope: { years: [1890, 1920], bounds: PARIS }, label: "Apache" },
      { scope: { years: [1960, 10001] }, label: "Mugger" },
    ],
    inventory: { water: 1, coin: 1 },
  },
  {
    id: "cutpurse",
    label: "Pickpocket",
    activity: "Working the crowd",
    workplace: "market",
    tier: "town",
    minPopulation: 2000,
    capabilities: ["coinage"],
    ages: [10, 41],
    rank: "destitute",
    weight: 0.3,
    labels: [
      { scope: { years: [1200, 1700], cultures: ["european"] }, label: "Cutpurse" },
      { scope: { years: [1600, 1950], bounds: JAPAN }, label: "Suri" },
    ],
    inventory: { water: 1, coin: 2 },
  },
  {
    id: "car-thief",
    label: "Car Thief",
    activity: "Working the streets",
    workplace: "market",
    tier: "town",
    years: [1910, 10001],
    minPopulation: 2000,
    ages: [14, 41],
    sex: "male",
    rank: "destitute",
    weight: 0.1,
    inventory: { water: 1, coin: 1, tool: 1 },
  },
  {
    id: "bicycle-thief",
    label: "Bicycle Thief",
    activity: "Working the streets",
    workplace: "market",
    tier: "town",
    years: [1890, 10001],
    minPopulation: 2000,
    ages: [12, 36],
    rank: "destitute",
    weight: 0.1,
    inventory: { water: 1, coin: 1 },
  },
  {
    id: "press-gang",
    label: "Press Gang Man",
    activity: "Pressing men for the navy",
    workplace: "market",
    tier: "town",
    years: [1664, 1815],
    bounds: BRITAIN,
    minPopulation: 2000,
    needs: ["water"],
    ages: [18, 51],
    sex: "male",
    rank: "labouring",
    weight: 0.12,
    inventory: { water: 1, coin: 2 },
  },
  {
    id: "marauder",
    label: "Deserter",
    activity: "Foraging the country",
    workplace: "wild",
    tier: "village",
    years: [-1500, 10001],
    ages: [16, 46],
    sex: "male",
    rank: "destitute",
    weight: 0.3,
    labels: [
      { scope: { years: [1350, 1450], bounds: FRANCE }, label: "Routier" },
      { scope: { years: [1618, 1649], bounds: GERMANY }, label: "Marauder" },
      { scope: { years: [1600, 1868], bounds: JAPAN }, label: "Ronin" },
    ],
    inventory: { water: 1, bread: 1 },
  },
];
