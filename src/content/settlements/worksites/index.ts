import { millProfiles } from "./mills";
import { mineProfiles } from "./mines";
import { hospitalProfiles } from "./hospitals";
import { processingProfiles } from "./processing";
import { boatyardProfiles } from "./boatyards";
import { worksiteFits } from "./types";
import type { WorldSetting } from "../../geography/types";
export const worksiteProfiles = [...millProfiles, ...mineProfiles, ...hospitalProfiles, ...processingProfiles, ...boatyardProfiles];
export const worksitesFor = (s: WorldSetting) => s.settlement === "camp" ? [] :
  worksiteProfiles.filter(p => worksiteFits(p, s));
export type { WorksiteProfile } from "./types";
