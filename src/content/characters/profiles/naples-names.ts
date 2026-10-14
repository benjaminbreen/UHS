import type { NameKit } from "../context-types";
export const naplesNameKits: NameKit[] = [
  {
    id: "names-naples-duchy",
    label: "Naples · late antiquity and the duchy",
    scope: {
      years: [476, 1139],
      places: ["city-naples", "naples", "neapolis"],
      bounds: [14.1, 40.7, 14.5, 41.0],
    },
    masculine: ["Sergius", "Gregorius", "Stephanus", "Johannes", "Georgius", "Theodorus"],
    feminine: ["Maria", "Anna", "Anastasia", "Theodora"],
    sources: ["https://whc.unesco.org/en/list/726/", "https://dmnes.org/"],
    note: "An inferred local sample of Latin and Greek Christian name forms for Byzantine-connected Naples. Individual people and frequencies are fictional; the display forms do not reconstruct spoken Neapolitan. Keeps the broad Italian fallback's Norman-French forms out of this pre-Norman local setting.",
  },
];

export const richerNaplesNameKits: NameKit[] = naplesNameKits.map((kit) => ({
  ...kit,
  format: "personal-patronymic",
  masculine: ["Sergius", "Gregorius", "Stephanus", "Johannes", "Georgius", "Theodorus", "Petrus", "Paulus", "Laurentius", "Marinus", "Leo", "Leontius", "Mauricius", "Constantinus"],
  feminine: ["Maria", "Anna", "Anastasia", "Theodora", "Helena", "Euphemia", "Lucia", "Sophia", "Agatha", "Juliana", "Constantia", "Petronia"],
  patronymic: {
    parents: ["Sergii", "Gregorii", "Stephani", "Johannis", "Georgii", "Theodori", "Petri", "Pauli", "Laurentii", "Marini", "Leonis", "Leontii", "Mauricii", "Constantini"],
    male: " filius", female: " filia",
    forms: { Sergius: "Sergii", Gregorius: "Gregorii", Stephanus: "Stephani", Johannes: "Johannis", Georgius: "Georgii", Theodorus: "Theodori", Petrus: "Petri", Paulus: "Pauli", Laurentius: "Laurentii", Marinus: "Marini", Leo: "Leonis", Leontius: "Leontii", Mauricius: "Mauricii", Constantinus: "Constantini", Maria: "Mariae", Anna: "Annae", Anastasia: "Anastasiae", Theodora: "Theodorae", Helena: "Helenae", Euphemia: "Euphemiae", Lucia: "Luciae", Sophia: "Sophiae", Agatha: "Agathae", Juliana: "Julianae", Constantia: "Constantiae", Petronia: "Petroniae" },
  },
  note: "An inferred Latin documentary-style display of a Christian personal name and a parent's name, with filius or filia meaning son or daughter. This is a schematic reconstruction for Byzantine-connected Naples, not a recovered biography, hereditary surname, or reconstruction of spoken Neapolitan; combinations and frequencies are fictional.",
}));
