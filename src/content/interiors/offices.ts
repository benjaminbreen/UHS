import type { InteriorProfile, Look } from "./types";

/** The office blocks of a downtown: offices whose desks follow the date, a
 * bank's hall, a department store's floor of showcases. Read from the name
 * the town plan gives the building. */
const made = new Map<string, InteriorProfile>();
export function officeFor(name: string, year: number): InteriorProfile | undefined {
  const kind = /^Bank/.test(name) ? "bank" : /^Department store/.test(name) ? "store" : /^Offices/.test(name) ? (year < 1900 ? "counting" : year < 1980 ? "typing" : "open") : undefined;
  if (!kind) return;
  const known = made.get(kind);
  if (known) return known;
  const base = {
    shapes: ["rect"],
    door: "door",
    windowStyle: "shutter",
    fire: "none",
    smokehole: false,
    seating: "chair",
    sleep: "none",
    colorways: [
      { name: "Mahogany and cream", wall: "#e0d6c0", trim: "#3a2418", floor: "#7a5a40", wood: "#5a3020", accent: "#2a4a3a" },
      { name: "Oak and green", wall: "#c8ccb0", trim: "#3a3a2a", floor: "#8a6a48", wood: "#6a4a2a", accent: "#6a2a2a" },
    ],
  } satisfies Partial<InteriorProfile>;
  const desks = (machine: string, label: string, from: number, to: number, note: string, floor: Look["floor"], wall: Look["wall"]): InteriorProfile => ({
    ...base,
    id: `office-${machine}`,
    uses: ["office"],
    program: "works",
    regulars: { hours: [9, 17], fill: 0.8 },
    styles: { machine },
    label,
    region: "Industrial world",
    period: `${from} – ${to === 2100 ? "present" : to}`,
    when: { start: { year: from }, end: { year: to } },
    basis: "documented",
    note,
    size: [14, 11],
    trades: ["household"],
    furnish: ["clock", "frame", "shelf", "plant"],
    looks: [
      { wall, floor, wear: 0.4, soot: 0.3, windows: 4 },
      { wall, dado: "panel", floor, wear: 0.25, soot: 0.15, windows: 4 },
      { wall, dado: "panel", floor, wear: 0.1, soot: 0.05, windows: 5 },
    ],
  });
  const profile: InteriorProfile =
    kind === "counting"
      ? desks("desk-high", "Counting house", 1700, 1900, "A merchant's or a lawyer's office before the typewriter: clerks on tall stools at sloping desks along the windows, the ledgers and letter-books copied out by hand, as in Scrooge and Marley's and in the City's counting houses.", "plank", "plaster")
      : kind === "typing"
        ? desks("typewriter", "General office", 1900, 1980, "The office of the typewriter and the filing cabinet: rows of desks facing one way under the windows, a typist at each, the clock over them, after the Remington and the scientific management of the 1910s.", "linoleum", "plaster")
        : kind === "open"
          ? desks("terminal", "Open-plan office", 1980, 2100, "Desks in rows under strip lights, a terminal on each, after the open plan of the 1960s and the personal computer of the 1980s.", "broadloom", "plaster")
          : kind === "bank"
            ? {
                ...base,
                id: "banking-hall",
                uses: ["office"],
                program: "shop",
                regulars: { hours: [10, 15], fill: 0.5 },
                styles: { stock: "ledgers", shopcounter: "teller", altar: "vault" },
                label: "Banking hall",
                region: "Industrial world",
                period: "1800 – present",
                when: { start: { year: 1800 }, end: { year: 2100 } },
                basis: "documented",
                note: "The public hall of a joint-stock bank: the tellers behind a marble counter and a brass grille, the ledgers in glazed cases behind them, and the round steel door of the strongroom, after the time-locked vaults of Yale and the safe-makers of the 1870s.",
                size: [12, 10],
                trades: ["shopkeep"],
                furnish: ["clock", "frame", "plant"],
                looks: [
                  { wall: "plaster", dado: "panel", floor: "tile", wear: 0.3, soot: 0.2, windows: 3 },
                  { wall: "plaster", dado: "panel", floor: "terrazzo", wear: 0.15, soot: 0.1, windows: 3 },
                  { wall: "panel", dado: "panel", floor: "terrazzo", wear: 0.05, soot: 0.05, windows: 4 },
                ],
              }
            : {
                ...base,
                id: "department-store",
                uses: ["office"],
                program: "works",
                regulars: { hours: [10, 18], fill: 0.7 },
                styles: { machine: "showcase" },
                label: "Department store",
                region: "Industrial world",
                period: "1850 – present",
                when: { start: { year: 1850 }, end: { year: 2100 } },
                basis: "documented",
                note: "A floor of the department store after the Bon Marché of 1852, Marshall Field's and Selfridges: fixed prices, goods laid out in glass showcases in rows for anyone to look at, and gangways between for the crowd.",
                size: [16, 12],
                trades: ["household"],
                furnish: ["clock", "plant", "plant", "frame"],
                looks: [
                  { wall: "plaster", dado: "panel", floor: "parquet", wear: 0.3, soot: 0.15, windows: 4 },
                  { wall: "wallpaper", dado: "panel", floor: "parquet", wear: 0.15, soot: 0.1, windows: 5 },
                  { wall: "panel", dado: "panel", floor: "terrazzo", wear: 0.05, soot: 0.05, windows: 5 },
                ],
              };
  made.set(kind, profile);
  return profile;
}
