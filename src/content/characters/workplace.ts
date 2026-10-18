/** Where a livelihood's day actually happens. The ported livelihoods carry an
 * activity string but no place, so everyone ended up in the market square; this
 * reads the place back off the activity rather than duplicating the table. */
export const workplaces = [
  "wild",
  "water",
  "field",
  "pasture",
  "extraction",
  "market",
  "civic",
  "carrying",
  "workshop",
  "household",
] as const;
export type Workplace = (typeof workplaces)[number];
const byActivity: Record<string, Workplace> = {
  "Gathering plants": "wild",
  "Gathering supplies": "wild",
  "Looking for game": "wild",
  "Cutting timber": "wild",
  "Working timber": "wild",
  "Gathering fuel": "wild",
  "Burning charcoal": "wild",
  "Keeping the hives": "wild",
  "Working near water": "water",
  "Working the water": "water",
  "Working the wharf": "water",
  Washing: "water",
  "Carrying water": "water",
  "Tending cultivation": "field",
  "Watching the crop": "field",
  "Bringing in the crop": "field",
  "Working the smallholding": "field",
  "Working the grain": "workshop",
  "Tending animals": "pasture",
  "Working underground": "extraction",
  "Working stone": "extraction",
  "Working the salt": "extraction",
  "Burning lime": "extraction",
  "Making brick": "extraction",
  "Minding the stall": "market",
  "Exchanging supplies": "market",
  "Exchanging goods": "market",
  "Keeping the house": "market",
  "At the rite": "civic",
  "Playing and telling": "civic",
  "Keeping the record": "civic",
  "Standing watch": "civic",
  "Tending the sick": "civic",
  "On the line": "carrying",
  "Carrying a load": "carrying",
  Traveling: "carrying",
  "Running errands": "carrying",
  "Clearing waste": "carrying",
  "Household work": "household",
  "Household craft work": "household",
  "Looking after the household": "household",
  Cooking: "household",
  "Preparing food": "household",
  Cleaning: "household",
  "Keeping the fire": "household",
  "Attending on someone": "household",
};
/**
 * Anything not listed is bench work: a yard, a shed, a room off the street.
 * That is right for a smith or a potter and wrong for a forager, so the four
 * hand-written kits are listed above rather than left to the default.
 */
export function workplaceFor(activity: string): Workplace {
  return byActivity[activity] ?? "workshop";
}

export type Institution =
  | "fishery"
  | "boatyard"
  | "pottery" | "brickworks" | "limeworks" | "dyehouse" | "fullery" | "tannery"
  | "school"
  | "administration"
  | "bank"
  | "factory"
  | "railway"
  | "printing"
  | "mill"
  | "mine"
  | "hospital"
  | "worship"
  | "field"
  | "pasture"
  | "shore";

/** Domestic crafts and independent services need no separate employer. */
export function institutionFor(
  l: import("./context-types").Livelihood,
  processing = false,
): Institution | undefined {
  if (l.institution) return l.institution;
  if (processing && processingInstitution[l.id]) return processingInstitution[l.id];
  if (l.id === "schoolteacher") return "school";
  if (l.id === "bank-clerk") return "bank";
  if (l.id === "stationmaster") return "railway";
  if (l.id === "printer") return "printing";
  if (l.id === "miller") return "mill";
  if (l.id === "sexton") return "worship";
  if (l.activity === "Working underground") return "mine";
  if (l.requires?.includes("factories")) return "factory";
  if (l.id === "clerk" || l.id === "tax-collector") return "administration";
  if (l.id === "nurse") return "hospital";
  const place = l.workplace ?? workplaceFor(l.activity);
  if (place === "field") return "field";
  if (place === "pasture") return "pasture";
  if (
    ["Working near water", "Working the water", "Working the wharf"].includes(
      l.activity,
    )
  )
    return "shore";
  return undefined;
}

export const processingInstitution: Readonly<Record<string, Institution>> = {
  potter: "pottery", brickmaker: "brickworks", "lime-burner": "limeworks",
  dyer: "dyehouse", fuller: "fullery", tanner: "tannery",
  boatwright: "boatyard",
};
