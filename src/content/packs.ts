import type { Pack } from "../core/types";
import { resolvePlayablePacks } from "./history/playable";
import { items as baseItems } from "./legacy-packs";
import { ecologicalItems } from "./ecology/resources";
export const items = { ...baseItems, ...ecologicalItems } as Record<import("../core/types").ItemId, import("../core/types").ItemDef>;
export const packs: Record<string, Pack> = resolvePlayablePacks();
export function resolvePrompt(
  input: string,
): { pack: Pack; seed: string } | { error: string } {
  const q = input.trim().toLowerCase();
  const date = /\b(\d+)\s*(bce|bc|ce|ad)\b/.exec(q);
  if (date) {
    const year = Number(date[1]),
      bce = date[2].startsWith("b");
    if (!((bce && year === 6500) || (!bce && year === 100)))
      return {
        error:
          "That date is outside this build’s supported periods: 100 CE and c. 6500 BCE. Your requested setting is preserved.",
      };
  }
  if (/roman|rome|tiber|ostia/.test(q) && /neolith|anatolia|konya|6500/.test(q))
    return {
      error:
        "This description combines the two supported settings. Choose Roman Italy or Neolithic Anatolia.",
    };
  const p = /neolith|anatolia|konya|6500|çatal|catal|early farmer/.test(q)
    ? packs.neolithic
    : /roman|rome|tiber|ostia|100\s*(ce|ad)|gaius/.test(q)
      ? packs.roman
      : undefined;
  return p
    ? { pack: p, seed: p.defaultSeed }
    : {
        error:
          "This build supports Roman Italy around 100 CE and Neolithic Anatolia around 6500 BCE. Your requested setting is preserved above; choose a supported world below.",
      };
}
