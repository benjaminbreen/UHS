import { millProfiles } from "./mills";
import { anyMine, mineProfiles } from "./mines";
import { hospitalProfiles } from "./hospitals";
import { processingProfiles } from "./processing";
import { boatyardProfiles } from "./boatyards";
import { craftProfiles } from "./crafts";
import { estateProfiles } from "./estates";
import { factoryProfiles } from "./factories";
import { innProfiles } from "./inns";
import { worksiteFits } from "./types";
import type { WorldSetting } from "../../geography/types";
export const worksiteProfiles = [...millProfiles, ...mineProfiles, ...hospitalProfiles, ...innProfiles, ...processingProfiles, ...boatyardProfiles,
  ...craftProfiles, ...estateProfiles, ...factoryProfiles];
export function worksitesFor(s: WorldSetting) {
  if (s.settlement === "camp") return [];
  const fit = worksiteProfiles.filter(p => worksiteFits(p, s));
  // A start down a mine needs a mine, famous or not.
  if (s.below !== "mine" || fit.some(p => p.kind === "mine")) return fit;
  return [...fit, anyMine(s.year, s.brief?.work === "coal-miner" || /coal|collier|pit/i.test(s.role ?? ""))];
}
export type { WorksiteProfile } from "./types";
