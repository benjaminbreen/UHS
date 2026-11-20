import { BRITAIN, elderOf, notable, partnerWords, pronounWords, seasonOf, temper, within } from "./common";
import type { PlotContext, PlotTemplate } from "./types";

const NORTHEAST_1965 = { years: [1965, 1966], bounds: [-80, 39.5, -71, 46] } as const;
const NEW_YORK_1977 = { years: [1977, 1978], bounds: [-74.3, 40.45, -73.65, 40.95] } as const;
const NORTHEAST_2003 = { years: [2003, 2004], bounds: [-84.8, 39.5, -73, 47] } as const;
const THREE_DAY_WEEK = { years: [1974, 1975], bounds: BRITAIN } as const;
const NEPA = { years: [1972, 2100], bounds: [2.6, 4, 14.7, 13.9] } as const;
const NORTHERN_GRID = { years: [2012, 2013], bounds: [68, 20, 92, 37] } as const;
const EDESUR = { years: [1999, 2000], bounds: [-58.65, -34.8, -58.25, -34.5] } as const;
const LOAD_SHEDDING = [{ years: [2008, 2009], bounds: [16, -35, 33, -22] }, { years: [2014, 2024], bounds: [16, -35, 33, -22] }] as const;
const VENEZUELA_2019 = { years: [2019, 2020], bounds: [-73.5, 0.6, -59.7, 12.3] } as const;
const TEXAS_2021 = { years: [2021, 2022], bounds: [-106.7, 25.8, -93.5, 36.6] } as const;

/** Each outage in the season it came: a summer storm, a winter of short coal. */
const outage = (c: PlotContext) => {
  const season = seasonOf(c);
  const wired = c.setting?.settlement === "city" || c.setting?.settlement === "port";
  if (within(c, NEPA, ...LOAD_SHEDDING)) return wired ? 0.5 : 0;
  if (season === "summer" && within(c, NEW_YORK_1977, NORTHEAST_2003, NORTHERN_GRID, EDESUR)) return 0.9;
  if (season === "autumn" && within(c, NORTHEAST_1965)) return 0.9;
  if (season === "winter" && within(c, THREE_DAY_WEEK, TEXAS_2021)) return 0.9;
  if (season === "spring" && within(c, VENEZUELA_2019)) return 0.9;
  return 0;
};

const helpers = (c: PlotContext) => {
  const patron = notable(c);
  const elder = elderOf(c, patron);
  return patron && elder && (elder.age ?? 30) >= 60 ? { patron, elder } : undefined;
};

/** The power goes off across the city, and an old neighbour can't manage on their own. */
export const blackout: PlotTemplate = {
  id: "blackout",
  shape: "world",
  look: {
    emblem: "blackout",
    palette: { ink: "#0a0c12", fill: "#1a2030", edge: "#4a4a58", light: "#eae6da", accent: "#f0b84a" },
  },
  weight: (c) => (helpers(c) ? outage(c) * temper(c, "agreeableness") : 0),
  cast: (c) => helpers(c),
  begin: (c, cast) => {
    const patron = cast.patron!, elder = cast.elder!;
    const p = partnerWords(c);
    const midnight = Math.floor(c.clock / 86400) * 86400;
    return {
      deadline: midnight + 30 * 3600,
      words: { patron: patron.name, elder: elder.name, ...pronounWords(elder), ...p.words },
      refs: { patron: patron.id, elder: elder.id, ...p.refs },
    };
  },
  opening: [{
    type: "choose", line: "dark", focus: "elder", brought: true,
    choices: [{ id: "check" }, { id: "share", check: { stat: "extraversion", odds: 0.55 } }, { id: "home" }],
  }],
  developments: [
    {
      id: "upstairs",
      when: { type: "after", id: "check", hours: 1 },
      then: [{ type: "choose", line: "need", focus: "elder", choices: [{ id: "carry", check: { stat: "strength", odds: 0.6 } }, { id: "sit" }] }],
    },
    { id: "grateful", when: { type: "any", of: [{ type: "fired", id: "carry" }, { type: "fired", id: "carry:failed" }, { type: "fired", id: "sit" }] }, then: [{ type: "regard", role: "elder", delta: 2 }] },
    { id: "obliged", when: { type: "fired", id: "share" }, then: [{ type: "regard", role: "patron", delta: 1 }] },
  ],
  endings: [
    { id: "carried", when: { type: "after", id: "carry", hours: 1 } },
    { id: "struggled", when: { type: "after", id: "carry:failed", hours: 1 } },
    { id: "sat", when: { type: "after", id: "sit", hours: 1 } },
    { id: "refused", when: { type: "fired", id: "share:failed" } },
    { id: "shared", when: { type: "after", id: "share", hours: 2 } },
    { id: "stayed", when: { type: "after", id: "home", hours: 3 } },
    { id: "passed", when: { type: "due" } },
  ],
  wording: [
    {
      // 9 November 1965, 5:16 pm: a relay at a plant in Ontario tripped and thirty million people lost power for up to thirteen hours.
      scope: NORTHEAST_1965,
      title: "The Great Blackout",
      lines: {
        intro: "At quarter past five, in the evening rush, the lights went out from Ontario to New York. People are stuck in lifts and on subway trains, and nobody knows why.",
        threat: "The radio, on batteries, says it isn't the Russians. Nobody knows how long it will last.",
        dark: "It's getting cold, and the oil burner needs power for its pump. {elder} lives alone at the top of the house and hasn't come down. {patron} has a cupboard full of candles and a gas stove.",
        stayed: "You sit by the window with a candle. There's a full moon over the city, and strangers are directing traffic with flashlights.",
        passed: "The power comes back before morning. Nine months later, the papers will claim, there was a rush of births.",
      },
    },
    {
      // Lightning hit Con Edison lines on 13 July 1977; in the 25 hours without power, over 1,600 stores were looted and 3,700 people arrested.
      scope: NEW_YORK_1977,
      title: "The Blackout",
      lines: {
        intro: "At half past nine on a hot night the lights went out across the whole city. The radio says lightning hit the power lines up the Hudson, and Con Ed doesn't know when it will be back.",
        threat: "On the avenue people are pulling the shutters off the stores. There are fires in Bushwick and the Bronx, and the police can't be everywhere.",
        dark: "It's ninety degrees and the fans have stopped. {elder} lives alone on the top floor and hasn't come down. {patron} is sitting up in front of the store with a flashlight, and has ice in the back.",
        stayed: "You sit on the stoop in the dark. Down the avenue the sirens go all night, and in the morning some of the stores are stripped to the walls.",
        passed: "The power comes back the next night. Thousands were arrested, and some blocks will take years to come back.",
      },
    },
    {
      // In the coal shortage of 1974 Britain worked a three-day week, with rota power cuts and television closing at 10.30 pm.
      scope: THREE_DAY_WEEK,
      title: "The Power Cuts",
      lines: {
        intro: "The miners have banned overtime, the power stations are short of coal, and the country is on a three-day week. Tonight it's your area's turn to be cut off.",
        threat: "It's winter, the electric fire is useless, and the paper says the cuts will go on for weeks.",
        dark: "The street went dark on schedule. {elder} lives alone next door, with an electric fire and no other heat. {patron} has a paraffin heater and has been buying candles for weeks.",
        "share:label": "Ask {patron} to lend the paraffin heater",
        "share:then": "{patron} lends the paraffin heater for the evening, with a warning about the fumes.",
        "share:failed": "{patron} says the heater is the only warm thing in the house, and the candles have been counted.",
        shared: "With {patron}'s paraffin heater going, your front room is the warmest on the street for one evening. Half the neighbours drop in to sit by it.",
        refused: "No heater, so you all go to bed early in your coats. The lights come on again at the time the paper said.",
        stayed: "You sit by candlelight and play cards until the lights come back at the time the paper said.",
        passed: "The lights come back on schedule. Tomorrow it's another area's turn.",
      },
    },
    {
      // Lagos lives with daily cuts from NEPA, the national power authority; people shout "Up NEPA!" when the light comes back.
      scope: NEPA,
      title: "NEPA Has Taken the Light",
      lines: {
        intro: "The power has gone again, as it does most evenings. NEPA, the electricity authority, says nothing about when it will be back. People say the letters stand for Never Expect Power Always.",
        threat: "In this heat, the food in the fridge won't last the night.",
        dark: "{patron}'s generator has started up next door, loud as a lorry. {elder} lives alone across the yard, and keeps {his} medicine in the fridge.",
        need: "{elder} is sitting in the dark in the heat, and the medicine in {his} fridge is getting warm.",
        stayed: "You sit out in the yard where it's cooler, with a kerosene lamp. Near midnight the light comes back, and the whole street shouts \"Up NEPA!\"",
        passed: "The light comes back near midnight, and the whole street shouts \"Up NEPA!\" It will go again tomorrow.",
      },
    },
    {
      // On 31 July 2012 India's northern grid failed for the second day running, leaving over 600 million people without power.
      scope: NORTHERN_GRID,
      title: "The Grid Has Failed",
      lines: {
        intro: "Just after one in the afternoon the power went off across the whole north of India. The radio says the grid has collapsed for the second time in two days.",
        threat: "The trains have stopped where they stand, the traffic signals are dead, and it's well over thirty-five degrees.",
        dark: "{elder} lives alone on the fourth floor, and the lift has stopped. {patron} has an inverter and a diesel generator for the shop downstairs.",
        stayed: "You sit in the courtyard with half the building, fanning yourselves with newspapers. The power comes back in the evening.",
        passed: "The power comes back in the evening, district by district.",
      },
    },
    {
      // In February 1999 a fire at an Edesur substation left about 150,000 Buenos Aires households without power, some for eleven days.
      scope: EDESUR,
      title: "The Edesur Blackout",
      lines: {
        intro: "A fire at a substation has cut the power to whole neighbourhoods south of the centre. Edesur, the power company, said a few hours. That was two days ago.",
        threat: "It's the middle of summer. The water pumps for the tall buildings run on electricity, and the lifts are stuck.",
        dark: "There's no water above the second floor. {elder} lives alone on the eighth and can't manage the stairs. {patron} has bought a generator and runs it from the balcony.",
        stayed: "In the evening the neighbours bring folding chairs out onto the pavement, and a crowd goes to bang pots outside the Edesur office. The power comes back days later.",
        passed: "The power comes back after days, and nobody believes the company's apology.",
      },
    },
    {
      // Eskom, South Africa's power company, cuts supply area by area on a rota when it can't meet demand: load shedding.
      scope: LOAD_SHEDDING[0],
      title: "Load Shedding",
      lines: {
        intro: "Eskom has announced load shedding again: the power goes off in turns, area by area, two hours at a time, because there isn't enough to go round. Your area is next.",
        threat: "Nobody quite trusts the schedule. The traffic lights go, and so do the gate motors and the alarms.",
        dark: "The power went on time. {elder} lives alone two houses down and needs {his} electric oxygen machine. {patron} has a generator and a gas braai.",
        stayed: "You cook on the gas braai by torchlight and play cards until the power comes back.",
        passed: "The power comes back after two hours, until the next slot on the schedule.",
      },
    },
    {
      scope: LOAD_SHEDDING[1],
      title: "Load Shedding",
      lines: {
        intro: "Eskom has announced load shedding again: the power goes off in turns, area by area, two hours at a time, because there isn't enough to go round. The app on your phone says your area is next.",
        threat: "The traffic lights go, and so do the gate motors and the alarms, and the cell towers after a while.",
        dark: "The power went on time. {elder} lives alone two houses down and needs {his} electric oxygen machine. {patron} has a generator and a gas braai.",
        stayed: "You cook on the gas braai by torchlight and play cards until the power comes back.",
        passed: "The power comes back after two hours, until the next slot on the schedule.",
      },
    },
    {
      // On 7 March 2019 the Guri dam's lines failed and most of Venezuela was dark for days; in Caracas people took water from pipes in the Guaire river bed.
      scope: VENEZUELA_2019,
      title: "The Whole Country Is Dark",
      lines: {
        intro: "The power has been out across the whole country since yesterday afternoon. The government says it's sabotage. The phones are dead, and the shops won't take cards.",
        threat: "Without power the water pumps have stopped. People are filling buckets from broken pipes in the river bed.",
        dark: "{elder} lives alone upstairs and hasn't any water left. {patron} has a generator and a tank on the roof.",
        need: "{elder} is sitting in the dark with an empty bucket, and {his} medicine is in a fridge that isn't cold any more.",
        "share:label": "Ask {patron} for water from the tank",
        "share:then": "{patron} lets you fill two buckets from the tank on the roof.",
        "share:failed": "{patron} says the tank has to last {patron}'s family until the power comes back, and nobody knows when that is.",
        shared: "With {patron}'s water you can cook, and you take a bucket up to {elder} too. The power comes back days later.",
        refused: "You queue with everyone else at the broken pipe by the river. The power comes back days later.",
        stayed: "You stay in with the candles. At night the city is completely dark, and you can hear generators and people calling to each other from the balconies.",
        passed: "The power comes back after days, area by area, and goes again a few weeks later.",
      },
    },
    {
      // In February 2021 Winter Storm Uri knocked out power to 4.5 million Texas homes in the coldest weather for decades; over 200 people died.
      scope: TEXAS_2021,
      title: "The Freeze",
      lines: {
        intro: "The snowstorm has knocked out the power across Texas on the coldest night anyone can remember. The grid operator says the outages will go on.",
        threat: "Houses here aren't built for this. People are running their cars in closed garages to keep warm, and some have died of it.",
        dark: "{elder} lives alone across the street, with an electric heater that's no use now. {patron} has a gas fireplace and a generator.",
        need: "{elder} is in bed in every blanket in the house, and the pipes have frozen and burst.",
        "carry:label": "Get {elder} across the street to somewhere warm",
        carried: "You get {elder} across the icy street to {patron}'s, where half the block is sleeping round the gas fire. The power comes back days later.",
        struggled: "The ice is too bad to move {elder}, so you bring over every blanket you have and a pot of water heated on the gas grill outside.",
        stayed: "You put on all your clothes and sit in one room with the family, with the doors shut. The power comes back days later.",
        passed: "The power comes back after days. Then the burst pipes thaw.",
      },
    },
    {
      // 14 August 2003: a software fault at an Ohio utility let the grid cascade, and fifty million people lost power; Cleveland's water pumps failed.
      scope: NORTHEAST_2003,
      title: "The Blackout",
      lines: {
        intro: "At ten past four the power went off, and it hasn't come back. The battery radio says it's out across Ohio, Michigan, New York and Ontario: fifty million people.",
        threat: "The water pumps run on electricity too. In Cleveland the taps are already sputtering, and the city says to boil whatever water you can get.",
        dark: "It's hot, the fridge is warming up, and the traffic lights are out. {elder} lives alone upstairs and hasn't come down. {patron} has a generator going in the yard.",
        stayed: "You sit on the front step in the dark. With no lights anywhere, you can see the stars over the city. Somebody down the street is grilling everything that was in the freezer.",
        passed: "The power comes back the next night, street by street.",
      },
    },
    {
      title: "The Blackout",
      lines: {
        aim: "Get through the blackout, and see that {elder} does too.",
        intro: "The power has gone off across the city, and nobody knows when it will be back.",
        threat: "Without power, the fridges, fans and water pumps have all stopped.",
        partner: "Your {partnerKin} {partner} is filling every pot in the house with water while there's still some.",
        "kin-partner": "Go and check on {elder}. Nobody's seen {him} since the power went.",
        "cast-elder": "Lives alone, and can't manage the stairs or the heat on {his} own.",
        "cast-patron": "Has a generator, and the only light on the street.",
        dark: "{elder} lives alone and hasn't come out since the power went. {patron} has a generator going.",
        "check:label": "Go and check on {elder}",
        "check:then": "You go up the dark stairwell with a torch and knock.",
        "share:label": "Ask {patron} to share the generator",
        "share:then": "{patron} runs an extension cable over the fence so you can keep the fridge going.",
        "share:failed": "{patron} says the generator can barely run the freezer as it is.",
        "home:label": "Stay in and wait it out",
        need: "{elder} is sitting in the dark, with {his} medicine in a fridge that isn't cold any more, and the stairs are too much for {him}.",
        "carry:label": "Help {elder} down to somewhere better",
        "carry:failed": "You try, but you can't manage the stairs with {elder}.",
        "sit:label": "Sit with {elder} through the night",
        carried: "You get {elder} down the stairs a step at a time and over to {patron}'s, where the generator keeps a fan and a fridge going. The power comes back the next day.",
        struggled: "You can't manage the stairs with {elder}, so you carry up water and wet towels instead, and sit by the open window until it's cooler.",
        sat: "You sit with {elder} by the open window with a candle, and listen to the neighbours' radios. {elder} tells you about the last time the power went, years ago.",
        shared: "With {patron}'s cable over the fence, your fridge stays cold until the power comes back, and half the street brings round food to keep in it.",
        refused: "{patron} won't share the generator. By morning everything in your freezer has thawed, so you cook it all in the street with the neighbours.",
        stayed: "You sit in with candles until the power comes back.",
        passed: "The power comes back the next day, street by street.",
      },
    },
  ],
};
