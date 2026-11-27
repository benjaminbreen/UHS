import type { Recipe } from "./recipes";

// The days of the street trades in characters/street-work.ts, and of the old
// street work that had none: the lamplighter, the watch, the water carrier,
// the sweep. Steps run in order but are not pinned to the clock, so a dawn
// round and a dusk round are first and last in a day that rises early.
export const streetRecipes: Recipe[] = [
  {
    ids: ["knife-grinder"],
    rises: 7, paid: "fee", skill: "crafting", wiki: ["Knife sharpening", "Grinding wheel"],
    day: [
      { title: "A round with the wheel", when: { bounds: [-170, 0, 60, 72] }, steps: [
        { name: "dress", task: "True the stone and oil the treadle", at: "home", scene: "craft", hours: 1 },
        { name: "cry", task: "Push the wheel through the streets calling for knives and scissors", at: "market", label: "the streets", scene: "walk", hours: 2 },
        { name: "grind", task: "Grind a household's knives and scissors at their door", at: "client", client: true, scene: "craft", card: "grinder-blade", hours: 4 },
      ] },
      { title: "Scissors and cleavers", when: { bounds: [95, 0, 150, 55] }, steps: [
        { name: "dress", task: "Wet the stones and check the bench", at: "home", scene: "craft", hours: 1 },
        { name: "cry", task: "Walk the lanes shaking your clappers and calling for scissors and cleavers", at: "market", label: "the lanes", scene: "walk", hours: 2 },
        { name: "grind", task: "Sit astride the bench and grind at a customer's gate", at: "client", client: true, scene: "craft", card: "grinder-blade", hours: 4 },
      ] },
    ],
  },
  {
    ids: ["town-crier"],
    rises: 7, paid: "wage", boss: "town clerk", skill: "speech", wiki: ["Town crier"],
    day: { title: "Crying the notices", steps: [
      { name: "notices", task: "Collect today's notices from the {boss}", at: "market", scene: "talk", hours: 1 },
      { name: "cry", task: "Ring your bell and read the notices at each corner and in the market", at: "market", label: "the street corners", scene: "talk", card: "crier-notice", hours: 4 },
      { name: "private", task: "Cry a lost purse or a sale for anyone who pays the fee", at: "client", client: true, scene: "talk", card: "crier-private", hours: 2 },
    ] },
  },
  {
    ids: ["organ-grinder"],
    rises: 9, paid: "takings", skill: "speech", wiki: ["Organ grinder", "Barrel organ"],
    day: { title: "Grinding out tunes", steps: [
      { name: "ready", task: "Feed the monkey and change the tune on the barrel", at: "home", scene: "craft", hours: 1 },
      { name: "play", task: "Play on the busy streets while the monkey takes the coins", at: "market", label: "the busy streets", scene: "market", card: "organ-play", hours: 5 },
      { name: "count", task: "Count the pennies and pay the hire on the organ", at: "home", scene: "market", hours: 1 },
    ] },
  },
  {
    ids: ["balloon-seller"],
    rises: 9, paid: "takings", skill: "trade", wiki: ["Toy balloon"],
    day: { title: "A day with the balloons", steps: [
      { name: "fill", task: "Fill the balloons and tie them to your sticks", at: "home", scene: "craft", hours: 1 },
      { name: "sell", task: "Sell balloons where the children are", at: "market", label: "the busy streets", scene: "market", card: "balloon-sell", hours: 5 },
      { name: "count", task: "Count what's left and what you made", at: "home", scene: "market", hours: 1 },
    ] },
  },
  {
    ids: ["goldfish-seller"],
    rises: 5, paid: "takings", skill: "trade", wiki: ["Goldfish", "Ranchu"],
    day: [
      { title: "Goldfish on the summer streets", when: { seasons: ["summer"] }, steps: [
        { name: "fetch", task: "Collect the day's fish from the breeder's ponds", at: "market", scene: "haul", hours: 1 },
        { name: "cry", task: "Carry the tubs through the back streets calling out for goldfish", at: "client", client: true, scene: "walk", card: "goldfish-round", hours: 5 },
        { name: "water", task: "Change the water and pick out the fish that won't last", at: "home", scene: "craft", hours: 1 },
      ] },
      // Out of summer the sellers went back to the ponds or to other work.
      { title: "At the breeder's ponds", when: { seasons: ["spring", "autumn", "winter"] }, steps: [
        { name: "feed", task: "Feed the fry and skim the ponds", at: "yard", scene: "tend", hours: 3 },
        { name: "sort", task: "Sort the young fish by colour and shape", at: "yard", scene: "craft", hours: 3 },
        { name: "sell", task: "Sell a few fish from the doorstep", at: "door", scene: "market", hours: 1 },
      ] },
    ],
  },
  {
    ids: ["juice-seller"],
    rises: 6, paid: "takings", skill: "trade", wiki: ["Liquorice", "Sharbat", "Tamarind"],
    day: { title: "Licorice, tamarind and carob", steps: [
      { name: "steep", task: "Strain the licorice that soaked overnight and fill the urn", at: "home", scene: "cook", hours: 2 },
      { name: "pour", task: "Walk the streets clacking your brass cups and pouring for buyers", at: "market", label: "the streets", scene: "market", card: "juice-pour", hours: 5 },
      { name: "scour", task: "Scour the urn and the cups", at: "home", scene: "craft", hours: 1 },
    ] },
  },
  {
    ids: ["rag-and-bone"],
    rises: 6, paid: "takings", skill: "trade", wiki: ["Rag-and-bone man"],
    day: { title: "Any old iron", steps: [
      { name: "harness", task: "Harness the pony to the cart", at: "yard", scene: "herd", hours: 1 },
      { name: "round", task: "Call \"Any old iron!\" down the streets and buy what people bring out", at: "client", client: true, scene: "haul", card: "rag-round", hours: 5 },
      { name: "sort", task: "Sort the rags, bones and metal and sell them to the merchant's yard", at: "market", label: "the merchant's yard", scene: "market", hours: 2 },
    ] },
  },
  {
    ids: ["lamplighter"],
    rises: 4, paid: "wage", boss: "lamp inspector", skill: "wayfaring", wiki: ["Lamplighter", "Gas lighting"],
    day: { title: "Dawn and dusk on the round", steps: [
      { name: "dawn", task: "Walk the round at first light putting out the lamps", at: "market", label: "the streets", scene: "walk", hours: 2 },
      { name: "clean", task: "Clean the glasses and see to the burners", at: "home", scene: "craft", hours: 3 },
      { name: "dusk", task: "Walk the round again at dusk and light every lamp", at: "market", label: "the streets", scene: "walk", card: "lamp-light", hours: 3 },
    ] },
  },
  {
    ids: ["night-watchman"],
    rises: 20, paid: "wage", boss: "constable", skill: "arms", wiki: ["Watchman (law enforcement)", "Night watchman"],
    day: { title: "The night watch", steps: [
      { name: "post", task: "Light your lantern and take up your post", at: "market", label: "your post", scene: "rest", hours: 1 },
      { name: "round", task: "Walk the streets calling the hour, and check the doors and the fires", at: "market", label: "the streets", scene: "walk", card: "night-round", hours: 6 },
      { name: "report", task: "Hand over the watch at first light", at: "market", label: "your post", scene: "talk", card: "watch-report", hours: 1 },
    ] },
  },
  {
    ids: ["water-carrier"],
    rises: 5, paid: "fee", skill: "wayfaring", wiki: ["Water carrier"],
    day: { title: "Carrying water", steps: [
      { name: "fill", task: "Fill up at the well before the queue grows", at: "well", scene: "water", hours: 1 },
      { name: "carry", task: "Carry water to the houses on your round", at: "client", client: true, scene: "haul", card: "water-round", hours: 5 },
      { name: "sell", task: "Sell water by the cup in the market", at: "market", scene: "market", hours: 2 },
    ] },
  },
  {
    ids: ["chimney-sweep"],
    rises: 5, paid: "fee", skill: "crafting", wiki: ["Chimney sweep"],
    day: { title: "Sweeping before the fires are lit", steps: [
      { name: "pack", task: "Pack your rods, brushes and sheets", at: "home", scene: "craft", hours: 1 },
      { name: "sweep", task: "Sheet the hearth and sweep the flue", at: "client", client: true, scene: "craft", card: "sweep-flue", hours: 4 },
      { name: "soot", task: "Sell the soot to a gardener for the beds", at: "market", scene: "market", hours: 1 },
    ] },
  },
];
