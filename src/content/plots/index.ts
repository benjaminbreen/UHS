import { debt } from "./debt";
import type { PlotRole, PlotTemplate } from "./types";

export const PLOTS: PlotTemplate[] = [debt];

export const ROLE_NAMES: Record<PlotRole, string> = { creditor: "Creditor" };
