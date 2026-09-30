import { australia } from "./australia";
import { eastAsia } from "./east-asia";
import { europe } from "./europe";
import { mediterranean } from "./mediterranean";
import { modern } from "./modern";
import { northAfrica } from "./north-africa";
import { prehistoric } from "./prehistoric";
import { southAsia } from "./south-asia";
import { tents } from "./tents";
import type { InteriorProfile } from "./types";

export const interiorGroups: { label: string; profiles: InteriorProfile[] }[] = [
  { label: "Neolithic and prehistoric", profiles: prehistoric },
  { label: "Mediterranean", profiles: mediterranean },
  { label: "North Africa", profiles: northAfrica },
  { label: "Europe", profiles: europe },
  { label: "South Asia", profiles: southAsia },
  { label: "East Asia", profiles: eastAsia },
  { label: "Australia", profiles: australia },
  { label: "Tents and portable dwellings", profiles: tents },
  { label: "Twentieth century", profiles: modern },
];
export const interiorProfiles = interiorGroups.flatMap((g) => g.profiles);
export const interiorProfile = (id: string) => interiorProfiles.find((p) => p.id === id);
export { resolveRoom, type RoomChoice } from "./resolve";
export type { InteriorProfile } from "./types";
