import type { SkillId, Skills } from "./skills";
import { levelOf } from "./skills";

/** The levels at which a skill offers a choice of technique. */
export const TIERS = [2, 4, 6] as const;
export type Tier = (typeof TIERS)[number];

export type Technique = {
  skill: SkillId;
  tier: Tier;
  name: string;
  /** What it does in play, in one line. */
  does: string;
  /** Why a person might know it, in one line. */
  flavor: string;
  /** Names and lines for an industrial or later setting, where the old
   * ones would read wrong. */
  modern?: { name?: string; flavor?: string };
  /** False until the engine reads it. Unready techniques are listed but
   * never offered. */
  ready?: false;
};

export const TECHNIQUES = {
  stalker: { skill: "hunting", tier: 2, name: "Stalker", does: "Animals notice you much later", flavor: "Downwind, slow, and never on dry leaves." },
  butcher: { skill: "hunting", tier: 2, name: "Butcher", does: "One more of everything from a kill", flavor: "Nothing on the carcass is wasted." },
  "clean-kill": { skill: "hunting", tier: 4, name: "Clean Kill", does: "Telling blows come twice as often", flavor: "You know where the heart sits." },
  "quick-windup": { skill: "hunting", tier: 4, name: "Quick Wind-up", does: "Wide swings charge a quarter faster", flavor: "The swing starts before the thought." },
  "big-game": { skill: "hunting", tier: 6, name: "Big Game", does: "Heavy animals take a third more damage", flavor: "The larger the beast, the steadier the hand." },
  tracker: { skill: "hunting", tier: 6, name: "Tracker", does: "Fresh tracks show on the ground", flavor: "Bent grass, a scuff, a warm dropping.", ready: false },

  "gentle-hands": { skill: "foraging", tier: 2, name: "Gentle Hands", does: "One more item from every gather", flavor: "Pick so the plant gives again." },
  "quick-picker": { skill: "foraging", tier: 2, name: "Quick Picker", does: "Gathering takes half the time", flavor: "Both hands, and an eye on the next bush." },
  "second-helping": { skill: "foraging", tier: 4, name: "Second Helping", does: "Double the chance of a bonus find", flavor: "Where there is one, there are three." },
  "keen-eye": { skill: "foraging", tier: 4, name: "Keen Eye", does: "Wild food nearby glints", flavor: "Colour where others see only green.", ready: false },
  seasoned: { skill: "foraging", tier: 6, name: "Seasoned", does: "Find wild food out of season", flavor: "Some roots keep all year under the litter.", ready: false },
  "healers-lore": { skill: "foraging", tier: 6, name: "Healer's Lore", does: "Gathered herbs heal", flavor: "A leaf for a cut, a bark for a fever.", ready: false },

  "green-thumb": { skill: "farming", tier: 2, name: "Green Thumb", does: "Field work goes a third faster", flavor: "The hoe finds its own rhythm." },
  "good-seed": { skill: "farming", tier: 2, name: "Good Seed", does: "A quarter more chance of a bonus harvest", flavor: "Keep the best, sow the best." },
  "strong-back": { skill: "farming", tier: 4, name: "Strong Back", does: "Field work tires you less", flavor: "Bend at the knee, not the spine.", ready: false },
  "weather-eye": { skill: "farming", tier: 4, name: "Weather Eye", does: "Warning before frost and drought", flavor: "The ants know first.", ready: false },
  "seed-saver": { skill: "farming", tier: 6, name: "Seed Saver", does: "Harvests return seed", flavor: "Next year is in this year's ear.", ready: false },
  fallow: { skill: "farming", tier: 6, name: "Fallow Wisdom", does: "Worn soil recovers", flavor: "Rest the field and it repays you.", ready: false },

  "calm-hand": { skill: "animals", tier: 2, name: "Calm Hand", does: "Animals notice you later while you walk", flavor: "Low voice, open palm, no sudden moves." },
  "steady-nerve": { skill: "animals", tier: 2, name: "Steady Nerve", does: "Charging animals hurt a quarter less", flavor: "Stand your ground and they swerve." },
  drover: { skill: "animals", tier: 4, name: "Drover", does: "A herd follows you", flavor: "A whistle and they move as one.", ready: false },
  rider: { skill: "animals", tier: 4, name: "Rider", does: "Ride horses and camels", flavor: "Sit deep and let it carry you.", ready: false },
  tamer: { skill: "animals", tier: 6, name: "Tamer", does: "A wild animal becomes a companion", flavor: "Patience, and a little food.", ready: false },
  "beast-speaker": { skill: "animals", tier: 6, name: "Beast Speaker", does: "Read and calm any animal", flavor: "Ears back means go no closer.", ready: false },

  "long-arm": { skill: "marksmanship", tier: 2, name: "Long Arm", does: "+1 range for every shot and throw", flavor: "Put your whole body behind it." },
  hurler: { skill: "marksmanship", tier: 2, name: "Hurler", does: "Thrown things hit a third harder", flavor: "A stone is a weapon if you mean it." },
  "heavy-draw": { skill: "marksmanship", tier: 4, name: "Heavy Draw", does: "Arrows and sling stones hit harder", flavor: "A bow you can barely pull." },
  "pinning-shot": { skill: "marksmanship", tier: 4, name: "Pinning Shot", does: "Hits stun twice as long", flavor: "Aim for the leg." },
  deadeye: { skill: "marksmanship", tier: 6, name: "Deadeye", does: "Hold aim to tighten your shot", flavor: "Breathe out, then loose.", ready: false },
  volley: { skill: "marksmanship", tier: 6, name: "Volley", does: "A second quick shot", flavor: "The next one is nocked before the first lands.", ready: false },

  "heavy-swing": { skill: "arms", tier: 2, name: "Heavy Swing", does: "Blows knock targets further back", flavor: "Weight first, edge second." },
  "sure-grip": { skill: "arms", tier: 2, name: "Sure Grip", does: "Blows land a fifth harder", flavor: "The haft never turns in your hand." },
  "double-strike": { skill: "arms", tier: 4, name: "Double Strike", does: "A second quick blow", flavor: "The backswing is a blow too.", ready: false },
  lunge: { skill: "arms", tier: 4, name: "Lunge", does: "A thrust that closes the gap", flavor: "Step in as you strike.", ready: false },
  sweep: { skill: "arms", tier: 6, name: "Sweep", does: "A slash hits everything in the arc", flavor: "Room to swing is room to win.", ready: false },
  riposte: { skill: "arms", tier: 6, name: "Riposte", does: "Strike back after a dodge", flavor: "Their mistake is your opening.", ready: false },

  "clean-cut": { skill: "woodcraft", tier: 2, name: "Clean Cut", does: "Axe blows count double twice as often", flavor: "Every stroke into the same notch." },
  timber: { skill: "woodcraft", tier: 2, name: "Timber", does: "One more firewood from every trunk", flavor: "Cut to length where it falls." },
  deadfall: { skill: "woodcraft", tier: 4, name: "Deadfall", does: "Fallen wood nearby glints", flavor: "Dry wood lies where the wind left it.", ready: false },
  tireless: { skill: "woodcraft", tier: 4, name: "Tireless", does: "Chopping tires you less", flavor: "Let the axe fall on its own weight.", ready: false },
  forester: { skill: "woodcraft", tier: 6, name: "Forester", does: "Big trees fall in fewer blows", flavor: "Read the lean, cut the hinge.", ready: false },
  "charcoal-burner": { skill: "woodcraft", tier: 6, name: "Charcoal Burner", does: "Turn wood into charcoal", flavor: "Slow fire under turf.", ready: false },

  "heavy-hand": { skill: "stonework", tier: 2, name: "Heavy Hand", does: "Pick blows count double twice as often", flavor: "Strike where the rock is already tired." },
  "deep-seam": { skill: "stonework", tier: 2, name: "Deep Seam", does: "One more from every ore vein", flavor: "Follow the vein, not the face." },
  "stone-eye": { skill: "stonework", tier: 4, name: "Stone Eye", does: "Good stone nearby glints", flavor: "The grain shows in the light.", ready: false },
  knapper: { skill: "stonework", tier: 4, name: "Knapper", does: "Shape flint into tools", flavor: "Strike the platform, catch the flake.", modern: { name: "Driller", flavor: "Mark it, drill it, split it." }, ready: false },
  prospector: { skill: "stonework", tier: 6, name: "Prospector", does: "Ore nearby glints", flavor: "Rust stains on a hillside.", ready: false },
  mason: { skill: "stonework", tier: 6, name: "Mason", does: "Build in stone", flavor: "Two over one, one over two.", ready: false },

  smith: { skill: "crafting", tier: 2, name: "Smith", does: "Forge tools and weapons", flavor: "Heat, hammer, quench.", modern: { name: "Mechanic", flavor: "Every machine is a puzzle." }, ready: false },
  herbalist: { skill: "crafting", tier: 2, name: "Herbalist", does: "Brew remedies", flavor: "The garden is a pharmacy.", modern: { name: "Chemist" }, ready: false },
  cook: { skill: "crafting", tier: 2, name: "Cook", does: "Cook meals that do more", flavor: "Salt, fat, fire, time.", ready: false },
  carpenter: { skill: "crafting", tier: 2, name: "Carpenter", does: "Build furniture and shelter", flavor: "Measure twice.", ready: false },

  "warm-word": { skill: "speech", tier: 2, name: "Warm Word", does: "Twice the chance of winning extra trust", flavor: "Ask after their mother." },
  "first-impression": { skill: "speech", tier: 2, name: "First Impression", does: "Strangers trust you a little from the start", flavor: "Stand straight, smile first." },
  storyteller: { skill: "speech", tier: 4, name: "Storyteller", does: "Crowds gather to listen", flavor: "Begin with a death.", ready: false },
  "silver-tongue": { skill: "speech", tier: 4, name: "Silver Tongue", does: "Talk people round", flavor: "Say what they already think.", ready: false },
  "good-ear": { skill: "speech", tier: 6, name: "Good Ear", does: "Understand more of other tongues", flavor: "Words drift between neighbours.", ready: false },
  elder: { skill: "speech", tier: 6, name: "Elder's Respect", does: "Strangers start warmer", flavor: "They have heard of you.", ready: false },

  haggler: { skill: "trade", tier: 2, name: "Haggler", does: "Your goods count for 15% more", flavor: "Walk away, slowly." },
  "fair-dealer": { skill: "trade", tier: 2, name: "Fair Dealer", does: "Every trade wins twice the trust", flavor: "A good name is worth more than the margin." },
  packhorse: { skill: "trade", tier: 4, name: "Packhorse", does: "Carry more", flavor: "Pack it tight, balance the load.", ready: false },
  appraiser: { skill: "trade", tier: 4, name: "Appraiser", does: "See what things are worth", flavor: "Bite the coin.", ready: false },
  middleman: { skill: "trade", tier: 6, name: "Middleman", does: "See price gaps between towns", flavor: "Cheap here, dear there.", ready: false },
  "known-face": { skill: "trade", tier: 6, name: "Known Face", does: "Traders seek you out", flavor: "Your word is good in three markets.", ready: false },

  "long-stride": { skill: "wayfaring", tier: 2, name: "Long Stride", does: "You tire a fifth more slowly", flavor: "Find the pace you can keep all day." },
  swimmer: { skill: "wayfaring", tier: 2, name: "Swimmer", does: "Water slows you a third less", flavor: "The river is a road." },
  unseen: { skill: "wayfaring", tier: 4, name: "Unseen", does: "People notice you later", flavor: "Walk like you belong.", ready: false },
  pathfinder: { skill: "wayfaring", tier: 4, name: "Pathfinder", does: "Landmarks show further out", flavor: "Keep the peak on your left.", ready: false },
  "night-walker": { skill: "wayfaring", tier: 6, name: "Night Walker", does: "See further at night", flavor: "Let your eyes open.", ready: false },
  navigator: { skill: "wayfaring", tier: 6, name: "Navigator", does: "Safer passage by sea", flavor: "Stars, swells, and birds.", ready: false },
} satisfies Record<string, Technique>;

export type TechniqueId = keyof typeof TECHNIQUES;
export const techniqueIds = Object.keys(TECHNIQUES) as TechniqueId[];
export const technique = (id: TechniqueId): Technique => TECHNIQUES[id];

export const optionsAt = (skill: SkillId, tier: Tier) =>
  techniqueIds.filter(
    (id) => TECHNIQUES[id].skill === skill && TECHNIQUES[id].tier === tier,
  );

/** A tier is offered once the level is reached, while nothing at it is
 * chosen, and only when there is a real choice to make. */
export function pendingPicks(skills: Skills, known: readonly string[]) {
  const picks: { skill: SkillId; tier: Tier; options: TechniqueId[] }[] = [];
  for (const skill of Object.keys(skills) as SkillId[]) {
    const level = levelOf(skills[skill]);
    for (const tier of TIERS) {
      if (level < tier) break;
      const all = optionsAt(skill, tier);
      if (all.some((id) => known.includes(id))) continue;
      const options = all.filter((id) => technique(id).ready !== false);
      if (options.length >= 2) picks.push({ skill, tier, options });
    }
  }
  return picks;
}
