import { accused } from "./accused";
import { complaint } from "./complaint";
import { debt } from "./debt";
import { feast } from "./feast";
import { gift } from "./gift";
import { ground } from "./ground";
import { levy } from "./levy";
import { marriage } from "./marriage";
import { rent } from "./rent";
import { rival } from "./rival";
import { robbery } from "./robbery";
import { sorcery } from "./sorcery";
import { stray } from "./stray";
import type { PlotRole, PlotTemplate } from "./types";

export const PLOTS: PlotTemplate[] = [debt, rent, levy, accused, rival, robbery, feast, gift, marriage, sorcery, ground, stray, complaint];

export const ROLE_NAMES: Record<PlotRole, string> = {
  creditor: "Creditor", landlord: "Landlord", official: "Official", accuser: "Accuser",
  witness: "Witness", rival: "Rival", suspect: "Suspect", host: "Host",
  giver: "Giver", inlaw: "In-law", claimant: "Claimant", elder: "Elder", customer: "Customer",
};
