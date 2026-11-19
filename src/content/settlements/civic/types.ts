import type { WorldSetting } from "../../geography/types";
import type { PrecinctSiting } from "../precincts";
import type { CircuitMaterial } from "../urban-form/types";

export type RoyalGround = {
  id: string; name: string; position: PrecinctSiting["position"];
  castle?: { hall: "hall-keep" | "great-hall" | "audience-hall"; material: CircuitMaterial; tower: "a" | "b" | "c";
    approach: "ditch" | "moat" | "forecourt"; paving: "cobble" | "slab"; service?: string };
};

export type CivicProfile = {
  forecourt?: true;
  interior?: "magistracy" | "bazaar" | "exchange";
  id: string;
  label: string;
  square: string;
  form: "colonnade" | "hall";
  /** What the building is, said plainly, for the focus card. */
  about: string;
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
