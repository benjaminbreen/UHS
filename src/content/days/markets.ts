import type { Occasion } from "./types";

/**
 * Weeks that were not seven days long, and the one day of the seven that was
 * not a rest day. A cycle counts game days, so the rhythm is right even where
 * the calendar is compressed.
 */
export const marketOccasions: Occasion[] = [
  {
    id: "day.aztec.tianguis",
    label: "Market day",
    scope: { years: [1200, 1600], bounds: [-106, 12, -84, 24], cultures: ["mesoamerican"] },
    evidence: "documented",
    when: [{ type: "cycle", every: 5, on: 2 }, { type: "adult" }],
    weight: 6,
    part: "midday",
    place: "market",
    activity: "visit",
    minutes: 50,
    carry: "basket",
    text: "Go to the tianquiztli: it is market day.",
    note: "Most towns held their market every fifth day of the twenty-day month.",
    sources: ["https://en.wikipedia.org/wiki/Tianguis"],
  },
  {
    id: "day.yoruba.market",
    label: "Market day",
    scope: { years: [1000, 1950], bounds: [2, 6, 6, 10], cultures: ["west-central-african"] },
    evidence: "documented",
    when: [{ type: "cycle", every: 4, on: 1 }, { type: "adult" }],
    weight: 6,
    part: "midday",
    place: "market",
    activity: "visit",
    minutes: 50,
    carry: "basket",
    text: "Go to market: it is the market day of the four-day week.",
    sources: ["https://en.wikipedia.org/wiki/Yoruba_calendar"],
  },
  {
    id: "day.java.pasaran",
    label: "Pasar day",
    scope: { years: [900, 1950], bounds: [105, -9, 115, -5], cultures: ["southeast-asian"] },
    evidence: "documented",
    when: [{ type: "cycle", every: 5, on: 3 }, { type: "adult" }],
    weight: 6,
    part: "midday",
    place: "market",
    activity: "visit",
    minutes: 45,
    carry: "basket",
    text: "Go to the pasar: its day has come round in the five-day week.",
    sources: ["https://en.wikipedia.org/wiki/Javanese_calendar"],
  },
  {
    id: "day.islam.jumuah",
    label: "Friday prayer",
    scope: { years: [650, 1950], bounds: [-18, 5, 95, 48], cultures: ["north-african-west-asian", "inner-eurasian", "south-asian"] },
    evidence: "documented",
    when: [{ type: "cycle", every: 7, on: 2 }, { type: "sex", is: "male" }, { type: "adult" }, { type: "observance", levels: ["devout", "regular", "occasional"] }],
    weight: 8,
    part: "midday",
    place: "sanctuary",
    activity: "visit",
    minutes: 45,
    text: "Go to the congregational prayer: it is Friday.",
    sources: ["https://en.wikipedia.org/wiki/Friday_prayer"],
  },
];
