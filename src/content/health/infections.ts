// Mechanisms follow CDC respiratory guidance and WHO diarrhoea/wound guidance.
// Timings, hazards and treatment strengths below are inferred game calibrations.
export const infectionEvidence = [
  "https://www.cdc.gov/respiratory-viruses/about/index.html",
  "https://www.who.int/news-room/fact-sheets/detail/diarrhoeal-disease",
  "https://www.who.int/publications/i/item/prevention-and-management-of-wound-infection",
];

export const infections: Record<string, {
  route: "air" | "provisions" | "wound";
  incubation: readonly [number, number];
  before: number;
  immunity: number;
  symptoms: readonly string[];
}> = {
  cough: { route: "air", incubation: [24, 72], before: 12, immunity: 30, symptoms: ["cough", "feverishness", "tiredness"] },
  flux: { route: "provisions", incubation: [12, 48], before: 0, immunity: 14, symptoms: ["diarrhea", "stomach cramps", "weakness"] },
  wound: { route: "wound", incubation: [24, 72], before: 0, immunity: 0, symptoms: ["increasing wound pain", "redness and swelling", "feverishness"] },
};

export type Treatment = "rest" | "nurse" | "clean-wound" | "consult" | "medicine" | "rehydration" | "prepare-food";
export const treatments: readonly Treatment[] = ["rest", "nurse", "clean-wound", "consult", "medicine", "rehydration", "prepare-food"];
