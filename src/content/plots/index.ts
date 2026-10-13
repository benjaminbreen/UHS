import { accused } from "./accused";
import { debt } from "./debt";
import { feast } from "./feast";
import { levy } from "./levy";
import { rent } from "./rent";
import { rival } from "./rival";
import { robbery } from "./robbery";
import type { PlotRole, PlotTemplate } from "./types";

export const PLOTS: PlotTemplate[] = [debt, rent, levy, accused, rival, robbery, feast];

export const ROLE_NAMES: Record<PlotRole, string> = {
  creditor: "Creditor", landlord: "Landlord", official: "Official", accuser: "Accuser",
  witness: "Witness", rival: "Rival", suspect: "Suspect", host: "Host",
};
