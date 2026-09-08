import type { WorldSetting } from "../../geography/types";
export type CivicProfile = {
  id: string;
  label: string;
  square: string;
  form: "colonnade" | "hall";
  evidence: {
    status: "inferred" | "fictional";
    sources: string[];
    note: string;
  };
};
export type CivicRule = CivicProfile & {
  from: number;
  to: number;
  bounds: readonly [number, number, number, number];
  culture: WorldSetting["culture"];
};
