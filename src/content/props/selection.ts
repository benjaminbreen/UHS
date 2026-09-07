import type { Pack } from "../../core/types";
import type { CultureId } from "../history/types";
import { eraAt } from "../history/dates";
import { historyRegistry, resolveHistory } from "../history";
export type PropContext = "household" | "yard" | "water" | "work";
export type PropKit = {
  era: string;
  culture: CultureId;
  contexts: Record<PropContext, string[]>;
  note: string;
};
/** Broad, explicitly provisional material-culture defaults, not universal dates
 * of invention. Local refinements override flat lists; behavior never uses era. */
export function propKit(pack: Pack): PropKit {
  const year = pack.year;
  const culture =
    pack.setting?.culture ??
    (pack.id === "roman" ? "european" : "north-african-west-asian");
  const contexts: PropKit["contexts"] = {
    household: ["basket", "liddedBasket"],
    yard: ["basket"],
    water: ["spring"],
    work: ["woodpile", "stick"],
  };
  const oldWorld = [
    "european",
    "north-african-west-asian",
    "inner-eurasian",
    "south-asian",
    "east-asian",
    "southeast-asian",
  ].includes(culture);
  // These conservative defaults are selection hypotheses; exact place rules below
  // are the extension point for early pottery and regional material exceptions.
  const pottery =
    (oldWorld && year >= -6999) ||
    (!oldWorld && year >= -1999) ||
    (culture === "east-asian" && year >= -15999);
  if (pottery) {
    contexts.household.push("pot", "jar");
    contexts.yard.push("jug", "pot");
    contexts.work.push("grinder");
    if (year >= -6999) contexts.water = ["well"];
  }
  if (year >= 500 && oldWorld) {
    contexts.household.push("chest", "sack");
    contexts.yard.push("bucket");
  }
  if (year >= 1500) {
    contexts.household.push("chest", "sack");
    contexts.yard.push("crate");
  }
  if (
    year >= -499 &&
    year < 600 &&
    ["european", "north-african-west-asian"].includes(culture)
  ) {
    contexts.household.push("chest");
    contexts.yard.push("amphora");
  }
  if (
    year >= 500 &&
    ["east-asian", "south-asian", "north-african-west-asian"].includes(culture)
  )
    contexts.household.push("glazed", "paintedChest");
  if (year >= 500 && culture === "european") {
    contexts.yard.push("barrel");
    contexts.water = ["well", "roofedWell"];
  }
  if (year >= 1850) {
    contexts.yard.push("tin");
    contexts.household.push("carton");
  }
  if (year >= 1950) {
    contexts.yard.push("plastic");
    contexts.household.push("plastic");
  }
  // Named local exceptions, intentionally not a culture × era master table.
  if (pack.setting?.placeId === "konya" || pack.id === "neolithic") {
    contexts.household = ["basket", "liddedBasket", "pot", "jar"];
    contexts.yard = ["jug", "pot"];
    contexts.water = ["well"];
  }
  if (pack.setting?.settlement === "camp") {
    contexts.water = ["spring"];
    contexts.yard = pottery ? ["pot", "basket"] : ["basket"];
  }
  if (year < -25999) {
    contexts.household = ["hideBag"];
    contexts.yard = ["hideBag"];
  }
  const placeId =
    pack.setting?.placeId ??
    (pack.id === "roman"
      ? "tiber"
      : pack.id === "neolithic"
        ? "konya"
        : undefined);
  const place = historyRegistry.places.find(
    (p) => p.id === placeId && p.culture === culture,
  )?.id;
  const contextNames = {
    household: "household",
    yard: "storehouse",
    water: "water",
    work: "workshop",
  };
  // Authored historical exclusions/context/capability rules outrank broad
  // prototype kits. Unresearched entries remain explicitly provisional.
  for (const context of Object.keys(contexts) as PropContext[]) {
    const resolved = resolveHistory(historyRegistry, {
      culture,
      place,
      date: { year },
      context: contextNames[context],
      hypotheses: true,
    });
    contexts[context] = [...new Set(contexts[context])].filter((key) => {
      const entry = resolved.entries.find((e) => e.id === `prop.${key}`);
      return !entry || entry.status === "included";
    });
  }
  return {
    era: eraAt({ year }).id,
    culture,
    contexts,
    note: "Provisional shared prop kit; local prevalence and date refinements remain incomplete.",
  };
}
