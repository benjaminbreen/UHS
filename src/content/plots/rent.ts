import { random } from "../../core/random";
import { amountOf, BRITAIN, CHINA, dueOf, MESOPOTAMIA, notable, partnerWords, pronounWords, working } from "./common";
import type { PlotTemplate } from "./types";

/** What the land owes whoever holds it, due now, after a thin year. */
export const rent: PlotTemplate = {
  id: "rent",
  look: {
    emblem: "rent",
    palette: { ink: "#141810", fill: "#232b1a", edge: "#5c4a2a", light: "#e8e4c8", accent: "#a8862e" },
  },
  payee: "landlord",
  weight: (c) => {
    const year = c.setting?.year ?? 0;
    const farming = working(c);
    const poor = (c.household?.fortune ?? 0.5) < 0.55;
    const bad = c.household?.history?.some((e) => e.kind === "bad-year" && year - e.year <= 2);
    return farming && year > -3000 && poor && notable(c) ? (bad ? 2 : 1) : 0;
  },
  cast: (c) => {
    const landlord = notable(c);
    return landlord && { landlord };
  },
  begin: (c, cast) => {
    const landlord = cast.landlord!;
    const owed = 5 + Math.floor(random(c.seed, "plot", "rent", "owed") * 6);
    const { deadline, due } = dueOf(c.clock);
    const p = partnerWords(c);
    return {
      deadline,
      owed,
      words: {
        landlord: landlord.name,
        landlordRole: landlord.role.toLowerCase(),
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
      id: "remind",
      when: { type: "all", of: [{ type: "due", hours: -3 }, { type: "not", of: { type: "settled" } }] },
      then: [{ type: "approach", role: "landlord", line: "remind" }],
    },
    {
      id: "seize",
      when: { type: "all", of: [{ type: "due" }, { type: "not", of: { type: "settled" } }] },
      then: [
        { type: "seize", role: "landlord" },
        { type: "regard", role: "landlord", delta: -2 },
        { type: "approach", role: "landlord", line: "seize" },
        { type: "extend", hours: 6 },
      ],
    },
    {
      id: "final",
      when: { type: "all", of: [{ type: "fired", id: "seize" }, { type: "due" }, { type: "not", of: { type: "settled" } }] },
      then: [{ type: "walk-off", role: "landlord", to: "authority" }],
    },
  ],
  endings: [
    { id: "fled", when: { type: "gone", role: "landlord" } },
    { id: "paid", when: { type: "all", of: [{ type: "settled" }, { type: "not", of: { type: "seized" } }] } },
    { id: "seized", when: { type: "settled" } },
    { id: "evicted", when: { type: "fired", id: "final" } },
  ],
  wording: [
    {
      // Temple and palace estates let fields to tenants for a share of the barley, recorded on tablets.
      scope: { years: [-3000, -500], bounds: MESOPOTAMIA },
      title: "Rent to the Temple",
      lines: {
        aim: "Bring {landlord} the temple's share of the barley, {due}.",
        intro: "Your household works a field that belongs to the temple, and the temple's share is owed. {landlord} the {landlordRole} keeps the tablets and {wants} it {due}.",
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
      },
    },
    {
      // Villeins owed the lord rent, heriot and boon-work; the reeve gathered it and the manor court enforced it.
      scope: { years: [1066, 1500], bounds: BRITAIN },
      title: "Rent to the Lord",
      lines: {
        aim: "Pay the reeve what you owe the lord, {due}.",
        intro: "Quarter day has come, and your rent to the lord is owing. {landlord} the {landlordRole} is gathering it {due}.",
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
      },
    },
    {
      // Tenancy for half the crop was common from the Song on; landlords pressed rent through agents and courts.
      scope: { years: [960, 1950], bounds: CHINA },
      title: "Rent Day",
      lines: {
        aim: "Pay {landlord} the rent on your field, {due}.",
        intro: "You rent your field from the {landlordRole} {landlord}, for half of what it grows. The rent is due {due}, and this year's half is thin.",
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
        fled: "You have left the field and the rent behind, and with them your only living.",
      },
    },
    {
      title: "Rent Day",
      lines: {
        aim: "Pay {landlord} what your household owes for the land, {due}.",
        intro: "Your household doesn't own the land it works, and the rent is due. {landlord} the {landlordRole} {wants} it {due}.",
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
      },
    },
  ],
};
