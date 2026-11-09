import { random } from "../../core/random";
import { claimFor } from "../economy/claims";
import { amountOf, BRITAIN, CHINA, collectorOf, dueOf, MESOPOTAMIA, partnerWords, pronounWords, working } from "./common";
import type { Effect, PlotContext, PlotTemplate } from "./types";

/** Grain the household still owes from the last collection. */
const arrearsOf = (c: PlotContext) => c.economy?.arrears?.[c.household?.id ?? ""] ?? 0;
/** Grain units, at a day's bread each, to one unit of payment. */
const GRAIN_PER_UNIT = 40;

const plea: Effect = {
  type: "choose", line: "plea", focus: "landlord",
  choices: [{ id: "pledge" }, { id: "labour" }, { id: "appeal", check: { stat: "wit", skill: "speech", odds: 0.35 } }],
};
const notSpurned = { type: "not", of: { type: "fired", id: "appeal:failed" } } as const;

/** What the land owes whoever holds it, due now, after a thin year. */
export const rent: PlotTemplate = {
  id: "rent",
  shape: "claim",
  look: {
    emblem: "rent",
    palette: { ink: "#141810", fill: "#232b1a", edge: "#5c4a2a", light: "#e8e4c8", accent: "#a8862e" },
  },
  payee: "landlord",
  // Only where whoever takes the year's share also holds the land; a tax unpaid is another story.
  weight: (c) => {
    const year = c.setting?.year ?? 0;
    if (!c.setting || !claimFor(c.setting)?.landlord || !working(c) || !collectorOf(c)) return 0;
    if (arrearsOf(c)) return 4;
    const poor = (c.household?.fortune ?? 0.5) < 0.55;
    const bad = c.household?.history?.some((e) => e.kind === "bad-year" && year - e.year <= 2);
    return poor ? (bad ? 2 : 1) : 0;
  },
  cast: (c) => {
    const landlord = collectorOf(c);
    return landlord && { landlord };
  },
  begin: (c, cast) => {
    const landlord = cast.landlord!;
    const arrears = arrearsOf(c);
    const owed = arrears
      ? Math.min(15, Math.max(3, Math.round(arrears / GRAIN_PER_UNIT)))
      : 5 + Math.floor(random(c.seed, "plot", "rent", "owed") * 6);
    const { deadline, due } = dueOf(c.clock);
    const p = partnerWords(c);
    return {
      deadline,
      owed,
      words: {
        landlord: landlord.name,
        amount: amountOf(c, owed),
        due,
        ...pronounWords(landlord),
        ...p.words,
      },
      refs: { landlord: landlord.id, ...p.refs },
    };
  },
  opening: [{ type: "approach", role: "landlord", line: "dun" }],
  developments: [
    {
      id: "plea",
      when: { type: "all", of: [{ type: "talked", role: "landlord" }, { type: "not", of: { type: "fired", id: "plea-late" } }, { type: "not", of: { type: "settled" } }] },
      then: [plea],
    },
    {
      id: "plea-late",
      when: { type: "all", of: [{ type: "since", hours: 1.5 }, { type: "not", of: { type: "fired", id: "plea" } }, { type: "not", of: { type: "settled" } }] },
      then: [plea],
    },
    { id: "terms", when: { type: "fired", id: "labour" }, then: [{ type: "extend", hours: 12 }] },
    {
      id: "spurned",
      when: { type: "fired", id: "appeal:failed" },
      then: [
        { type: "regard", role: "landlord", delta: -2 },
        { type: "walk-off", role: "landlord", to: "authority" },
        { type: "gather", at: "authority", when: "morning", label: "hearing", scene: "hearing", aim: "aim-hearing" },
      ],
    },
    {
      id: "remind",
      when: { type: "all", of: [{ type: "due", hours: -3 }, { type: "not", of: { type: "settled" } }, notSpurned] },
      then: [{ type: "approach", role: "landlord", line: "remind" }],
    },
    {
      id: "seize",
      when: { type: "all", of: [{ type: "due" }, { type: "not", of: { type: "settled" } }, notSpurned] },
      then: [
        { type: "seize", role: "landlord" },
        { type: "regard", role: "landlord", delta: -2 },
        { type: "approach", role: "landlord", line: "seize" },
        { type: "extend", hours: 6 },
      ],
    },
    {
      id: "final",
      when: { type: "all", of: [{ type: "fired", id: "seize" }, { type: "due" }, { type: "not", of: { type: "settled" } }, notSpurned] },
      then: [
        { type: "walk-off", role: "landlord", to: "authority" },
        { type: "card", line: "evicted", focus: "landlord" },
        { type: "gather", at: "authority", when: "morning", label: "hearing", scene: "hearing", aim: "aim-hearing" },
      ],
    },
    {
      id: "verdict",
      when: { type: "all", of: [{ type: "came" }, { type: "not", of: { type: "settled" } }] },
      then: [{ type: "seize", role: "landlord" }],
    },
    {
      id: "default",
      when: { type: "all", of: [{ type: "gathered" }, { type: "not", of: { type: "came" } }, { type: "not", of: { type: "settled" } }] },
      then: [{ type: "seize", role: "landlord" }, { type: "regard", role: "official", delta: -2 }],
    },
  ],
  endings: [
    { id: "fled", when: { type: "gone", role: "landlord" } },
    { id: "judged", when: { type: "fired", id: "verdict" } },
    { id: "absent", when: { type: "fired", id: "default" } },
    { id: "paid", when: { type: "all", of: [{ type: "settled" }, { type: "not", of: { type: "seized" } }] } },
    { id: "seized", when: { type: "settled" } },
    { id: "pledged", when: { type: "fired", id: "pledge" } },
    { id: "laboured", when: { type: "all", of: [{ type: "fired", id: "labour" }, { type: "brought", role: "landlord" }] } },
    { id: "remitted", when: { type: "all", of: [{ type: "fired", id: "appeal" }, notSpurned] } },
  ],
  wording: [
    {
      // Temple and palace estates let fields to tenants for a share of the barley, recorded on tablets.
      scope: { years: [-3000, -500], bounds: MESOPOTAMIA },
      title: "Rent to the Temple",
      lines: {
        aim: "Bring {landlord} the temple's share of the barley, {due}.",
        intro: "Your household works a field that belongs to the temple, and the temple's share is owed. {landlord} the temple steward keeps the tablets and {wants} it {due}.",
        threat: "A household that cannot give the share loses the field to one that can.",
        partner: "Your {partnerKin} {partner} has counted the jars twice and come up short both times.",
        "kin-partner": "Will there be enough for the temple's share? I counted the jars again.",
        "cast-landlord": "Keeps the temple's tablets, and the field you work is on them.",
        dun: "The temple's share is {amount}, and I want it {due}. It is written down.",
        remind: "It's getting late. The amount hasn't changed.",
        seize: "I have taken what was in your store for the temple. It isn't enough.",
        paid: "The temple's share is given and recorded. The field is yours to work another year.",
        seized: "{landlord} has taken the share from your store. The share is paid, but your household will go hungry.",
        evicted: "{landlord} has gone to have the field given to another household. Next year someone else will plough it.",
        fled: "You have left the field and the temple's share behind you.",
        remitted: "{landlord} has the field inspected, and the tablet is written again with a smaller share for the bad year, as the law allows when a crop fails.",
      },
    },
    {
      // Villeins owed the lord rent, heriot and boon-work; the reeve gathered it and the manor court enforced it.
      scope: { years: [1066, 1500], bounds: BRITAIN },
      title: "Rent to the Lord",
      lines: {
        aim: "Pay the reeve what you owe the lord, {due}.",
        intro: "Quarter day has come, and your rent to the lord is owing. {landlord} the reeve is gathering it {due}.",
        threat: "A tenant who does not pay is presented at the manor court, and can lose the holding.",
        partner: "Your {partnerKin} {partner} doesn't know how little you've saved.",
        "kin-partner": "The reeve was asking for you. Do we have enough for the rent?",
        "cast-landlord": "Gathers the lord's rents, and has your name in the roll.",
        dun: "Your rent is {amount}, and I need it {due}.",
        remind: "It's getting late. If I don't have it, your name goes to the manor court.",
        seize: "I've taken goods from your store toward the rent. The rest is still owed.",
        paid: "The rent is paid, and the reeve marks it in the roll. The holding is yours another quarter.",
        seized: "{landlord} has taken the rent in goods from your store. It's paid, but there's little left in the house.",
        evicted: "{landlord} has gone to present you at the manor court. You may lose the holding.",
        fled: "You have left the holding and the rent behind. If you're found, you can be brought back.",
        "labour:label": "Offer boon-work on the lord's land",
        laboured: "You give the day to the lord's own fields, and the reeve marks it against your rent. The rest can wait until Michaelmas.",
      },
    },
    {
      // Tenancy for half the crop was common from the Song on; landlords pressed rent through agents and courts.
      scope: { years: [960, 1950], bounds: CHINA },
      title: "Rent Day",
      lines: {
        aim: "Pay {landlord} the rent on your field, {due}.",
        intro: "You rent your field from {landlord}, for half of what it grows. The rent is due {due}, and this year's half is thin.",
        threat: "If you can't pay, {he} will let the field to another family, and you will have no land to work.",
        partner: "Your {partnerKin} {partner} has been to the store to measure what is left.",
        "kin-partner": "The landlord's man was here. Is there enough for the rent?",
        "cast-landlord": "Owns the field you work, and takes half of it.",
        dun: "The rent is {amount}. I want it {due}.",
        remind: "I said {due}. Other families would be glad to rent your field.",
        seize: "I have taken what I could from your store against the rent. The rest is still owed.",
        paid: "The rent is paid. The field is yours to work another year.",
        seized: "{landlord} has taken the rent from your store. It's paid, but it will be a hungry winter.",
        evicted: "{landlord} has gone to let your field to another family.",
        fled: "You have left the field and the rent behind, and now your household has no land to work.",
      },
    },
    {
      title: "Rent Day",
      lines: {
        aim: "Pay {landlord} what your household owes for the land, {due}.",
        intro: "Your household doesn't own the land it works, and the rent is due. {landlord}, who owns it, {wants} it {due}.",
        threat: "If you can't pay, {he} will give the land to someone who can.",
        partner: "Your {partnerKin} {partner} doesn't know how little you've saved.",
        "kin-partner": "{landlord} was here about the land. Do we have enough?",
        "cast-landlord": "Holds the land your household works.",
        dun: "What you owe for the land is {amount}. I want it {due}.",
        remind: "It's getting late. I haven't forgotten.",
        seize: "I have taken what I could from your store. The rest is still owed.",
        paid: "What is owed for the land is paid. It is yours to work another year.",
        seized: "{landlord} has taken what was owed from your store. The land is still yours, and the household will go short.",
        evicted: "{landlord} has gone to give your land to someone else.",
        fled: "You have left the land and what was owed for it behind.",
        hearing: "At the hearing before {authority}",
        "aim-hearing": "Answer {landlord} before {authority} {meet}, or pay what's still owed before then.",
        judged: "You answer for yourself, and the hearing lets your household keep the land. But what's still owed is to be taken from your store.",
        plea: "{landlord} wants {amount} {due}, and the store won't stretch to it. What do you offer?",
        "pledge:label": "Promise a bigger share next harvest",
        "labour:label": "Offer days of work on {his} land",
        "labour:then": "{landlord} will take a day's work on {his} own fields toward the rent. Do the work, then come and tell {him}.",
        "appeal:label": "Ask for the rent to be cut for the bad year",
        "appeal:failed": "{landlord} hears you out, then says a bad year is no excuse. {He} is taking it to {authority}.",
        pledged: "{landlord} agrees to wait, in return for a bigger share of next year's crop. If the next harvest is thin too, you'll be worse off than now.",
        laboured: "You spend the day on {landlord}'s own land, and {he} counts the work toward the rent. The rest can wait until harvest.",
        remitted: "{landlord} looks at the field and the store, and lets part of the rent go for the bad year. The land stays yours.",
        absent: "You didn't come to answer, so it was decided without you. What's still owed is to be taken from your store, and from next year the land goes to someone else.",
      },
    },
  ],
};
