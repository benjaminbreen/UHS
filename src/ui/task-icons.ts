import { Amphora, Anvil, Axe, Beer, BowArrow, BrickWall, CookingPot, Droplets, Feather, Fence, Fish, Gem, Hammer, HandHeart, Landmark, Pickaxe, Sailboat, Scale, Scissors, Spool, Sprout, Swords, Wheat, Wine, type LucideIcon } from "lucide-react";

// First match wins, so the narrower trades come before the broad farming one.
const TRADES: [RegExp, LucideIcon][] = [
  [/dye/i, Droplets],
  [/weav|spin|cloth|textile|tailor|seamstress|embroider|silk/i, Spool],
  [/smith|forge|metal|bronze|iron|copper|tin/i, Anvil],
  [/jewel|gold|lapidar/i, Gem],
  [/pott|ceram|kiln/i, Amphora],
  [/brew|chicha|beer|ale\b/i, Beer],
  [/wine|vint/i, Wine],
  [/cook|kitchen/i, CookingPot],
  [/fish/i, Fish],
  [/sail|boat|ferry|mariner|seaman|navig/i, Sailboat],
  [/mine|miner|quarr/i, Pickaxe],
  [/carpent|wood|cooper|wright|joiner/i, Axe],
  [/mason|build|brick|stone/i, BrickWall],
  [/scribe|clerk|copyist|poet|scholar|teach|notary/i, Feather],
  [/priest|monk|nun|cleric|shaman|temple|imam|rabbi|diviner/i, Landmark],
  [/merchant|trader|vendor|shop|peddler|money|broker/i, Scale],
  [/soldier|guard|warrior|knight|legion|archer/i, Swords],
  [/hunt|trapp/i, BowArrow],
  [/heal|midwife|physician|herbal|doctor|surgeon/i, HandHeart],
  [/tann|leather|cobbl|shoe|barber/i, Scissors],
  [/herd|shepherd|goat|cattle|swine|pastor|drover/i, Fence],
  [/wheat|barley|rye|millet|grain|bak|mill/i, Wheat],
  [/grow|farm|field|garden|maize|rice|quinoa|lentil|chickpea|potato|olive|peasant|plough|orchard/i, Sprout],
];

/** The icon for a job, read from its name, e.g. "Fine-cloth Weaver" or "Chickpea Grower". */
export const workIcon = (role = "") => TRADES.find(([trade]) => trade.test(role))?.[1] ?? Hammer;
