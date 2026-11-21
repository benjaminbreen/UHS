import { formatHistoricalYear } from "../../core/calendar";
import type { InteriorProfile, Look, RoomTemplate } from "./types";
import { worksiteProfiles } from "../settlements/worksites";

const made = new Map<string, InteriorProfile>();
export function worksiteInterior(use: string, home: InteriorProfile): InteriorProfile | undefined {
  const store = use.endsWith("-store"), id = use.slice(9).replace(/-store$/, "");
  const site = worksiteProfiles.find(p => p.id === id);
  if (!site) return;
  const key = `${use}-${home.id}`;
  if (made.has(key)) return made.get(key);
  const hospital = site.kind === "hospital" && !store;
  const inn = !!site.inn && !store;
  const mat = (hospital ? site.ward?.bedding : site.inn?.bedding) === "mat";
  const pr: InteriorProfile = {
    ...home, id: key, label: store ? site.outbuilding.label : site.label,
    period: `${formatHistoricalYear(site.scope.years[0])} – ${formatHistoricalYear(site.scope.years[1]-1)}`,
    when: {start:{year:site.scope.years[0]},end:{year:site.scope.years[1]-1}},
    uses: [use], basis: site.basis, note: site.note, shapes: ["rect"],
    size: [12,10], rooms: undefined, program: undefined, sleep: "none",
    fire: inn && site.inn ? site.inn.fire : "none", smokehole: false, pole: false,
    trades: inn ? ["host"] : ["household"],
    kits: {household:[]}, clutter: inn ? ["cup", "bowl", "book"] : [], regulars: undefined,
    furnish: site.kind === "mill" ? ["quern","sacks","crate","basket","lamp"] : ["table","crate","lamp"],
    styles: hospital ? { bed: "linen", shelf: mat ? "tansu" : "open" }
      : inn ? { shelf: mat ? "tansu" : "open", ...(mat ? { screen: "privacy" } : {}) }
      : {},
  };
  if (site.revision) {
    pr.furnish = store ? ["shelf","crate","basket","lamp"] :
      site.kind === "boatyard" ? ["table","shelf","crate","lamp"] :
      site.kind === "pottery" ? ["throw","shelf","jars","table","lamp"] :
      ["table","basin","jars","crate","lamp"];
    pr.styles = {shelf:"open"};
  }
  if (site.kind === "mine" && !store) {
    pr.looks = pr.looks.map((l): Look=>({...l,wall:"stone",floor:"earth",windows:0,wear:.7,soot:.1,furnish:[]})) as InteriorProfile["looks"];
    pr.windowStyle = "none";
  } else pr.looks = pr.looks.map((l): Look=>({...l,furnish:[],
    ...(hospital && site.ward ? {wall:site.ward.wall,floor:site.ward.floor,windows:4,soot:0,wear:.25} : {}),
    ...(inn && site.inn ? {wall:site.inn.wall,floor:site.inn.floor,windows:3,soot:.08,wear:.2} : {}),
  })) as InteriorProfile["looks"];
  if (inn && site.inn) {
    const { plan, rooms: count = 2, bedding, fire, seating, modern, endowment } = site.inn;
    pr.door = "door";
    pr.seating = seating;
    pr.regulars = { hours: [17, 23], fill: 0.3 };
    pr.windowStyle = site.inn.wall === "shoji" ? "shoji" : modern ? "glazed" : pr.windowStyle;
    pr.institutionPlan = plan === "court" ? "court" : plan === "corridor" ? "corridor" : "passage";
    if ((plan === "hall" || plan === "corridor") && !mat && !modern) {
      pr.colorways = [
        { name: "Hearth oak", wall: "#d7c3a1", trim: "#5e3d28", floor: "#8c5c38", wood: "#694025", accent: "#a33c32" },
        { name: "Lantern amber", wall: "#d8cbb0", trim: "#4f3a2c", floor: "#7e5534", wood: "#5c3b24", accent: "#396172" },
      ];
    } else if (modern) {
      pr.colorways = [
        { name: "Velvet lobby", wall: "#dfd6c4", trim: "#5b4234", floor: "#8a5a44", wood: "#5e3d2a", accent: "#8c3737" },
        { name: "Grand sage", wall: "#dcdcd0", trim: "#4e5c52", floor: "#7c654d", wood: "#5b4331", accent: "#3f6a5c" },
      ];
    }
    // Only European/Mediterranean/Colonial/East Asian drinking-hall inns have a taproom bar with casks.
    // Endowed caravanserais, dharamshalas, tambos & zongos have a hospitality gathering hall (no ale barrels);
    // modern hotels have a reception desk lobby.
    const taproom = !modern && endowment === "paid" && site.kind !== "caravanserai" && site.id !== "maghreb-funduq";
    const chamber = (i: number): RoomTemplate => ({
      id: `guest-${i}`,
      label: count > 1 ? `Guest chamber ${i + 1}` : "Guest chamber",
      role: "sleep",
      size: [9, 8],
      sleep: bedding,
      program: "inn",
      fire: "none",
      furnish: modern
        ? ["clock", "frame", "lamp", "plant"]
        : mat
          ? ["scrolls", "lantern", "chest", "basket"]
          : ["frame", "lamp", "chest", "shelf"],
      clutter: ["cup", "book"],
    });
    const common: RoomTemplate = {
      id: "common",
      label: modern ? "Hotel lobby" : taproom ? (mat ? "Front hall" : "Common room") : "Hospitality hall",
      role: "entry",
      size: plan === "court" ? [11, 8] : [14, 9],
      program: modern ? "shop" : taproom ? "serve" : "gather",
      fire,
      seating,
      ...(modern ? { styles: { shopcounter: "teller" } } : {}),
      furnish: modern
        ? ["clock", "frame", "armchair", "plant", "lamp", "lamp", "rug"]
        : taproom
          ? mat
            ? ["tally", "lantern", "lantern", "frame", "jars", "cat"]
            : ["tankards", "tally", "clock", "frame", "plates", "lamp", "rug", "cat"]
          : ["divan", "lantern", "lantern", "jars", "plates", "rug", "sacks"],
      clutter: ["cup", "cup", "bowl", "book"],
    };
    const court: RoomTemplate = {
      id: "court",
      label: "Inn courtyard",
      role: "entry",
      size: [11, 9],
      shapes: ["courtyard"],
      styles: { pole: "stone" },
      program: "passage",
      fire: fire === "firepit" ? "firepit" : "none",
      furnish: ["basin", "bench", "lantern", "lantern", "jars", "sacks"],
    };
    const privateRoom = (i: number): RoomTemplate => ({
      id: `room-${i + 1}`,
      label: `Room ${i + 1}`,
      role: "sleep",
      size: [6, 5],
      sleep: bedding,
      program: "inn",
      fire: "none",
      furnish: modern
        ? ["frame", "lamp"]
        : mat
          ? ["scrolls", "lantern"]
          : ["frame", "lamp"],
      clutter: ["cup", "book"],
    });
    const hallway: RoomTemplate = {
      id: "hallway",
      label: modern ? "Hotel corridor" : mat ? "Guest gallery" : "Inn hallway",
      role: "hall",
      size: [18, 4],
      sleep: "none",
      program: "corridor",
      fire: "none",
      windows: 0,
      furnish: modern
        ? ["frame", "plant", "bench", "lamp"]
        : mat
          ? ["scrolls", "lantern", "plant"]
          : ["frame", "clock", "bench", "lamp"],
    };
    const parlour: RoomTemplate = {
      id: "parlour",
      label: modern ? "Upper lounge" : mat ? "Tea landing" : "Guest parlour",
      role: "hall",
      size: [6, 5],
      sleep: "none",
      program: "passage",
      fire: "none",
      furnish: modern
        ? ["armchair", "plant", "frame", "lamp"]
        : mat
          ? ["lowtable", "cushions", "scrolls", "lantern"]
          : ["table", "stool", "frame", "lamp"],
    };
    const linen: RoomTemplate = {
      id: "linen",
      label: modern ? "Linen & baggage room" : "Linen store",
      role: "store",
      size: [6, 5],
      sleep: "none",
      program: "passage",
      fire: "none",
      furnish: ["shelf", "chest", "basket", "lamp"],
    };
    const chambers = Array.from({ length: plan === "court" ? Math.max(3, count) : count }, (_, i) =>
      plan === "corridor" ? privateRoom(i) : chamber(i),
    );
    pr.rooms = plan === "court"
      ? [court, chambers[0], common, chambers[1], chambers[2]]
      : plan === "corridor"
        ? [{ ...common, size: [10, 7] }, hallway, parlour, ...chambers, linen]
        : [common, ...chambers];
  }
  if (hospital && site.ward) {
    pr.institution = "hospital";
    const { plan, cells, bedding } = site.ward;
    const modern = site.id === "modern-ward";
    pr.regulars = {hours: [7,17], fill: 0};
    pr.door = "door";
    pr.windowStyle = mat ? "shoji" : modern ? "glazed" : pr.windowStyle;
    pr.institutionPlan = plan === "court" ? "court" : "passage";
    if (modern) {
      pr.styles = { bed: "clinical", shelf: "linen", clock: "wall", counter: "utility", screen: "privacy" };
      pr.colorways = [
        { name: "Sea green", wall: "#e3e5d8", trim: "#638581", floor: "#a6b9b4", wood: "#aaa18b", accent: "#488884" },
        { name: "Ward blue", wall: "#e3e5df", trim: "#678392", floor: "#b9c5c6", wood: "#a59682", accent: "#537f9c" },
      ];
    }
    const work: RoomTemplate = { id: "prep", label: modern ? "Clean utility room" : "Preparation room", role: "work", size: [8,7],
      program: "passage", furnish: modern ? ["basin","shelf","counter"] : ["basin","shelf","jars","basket"] };
    const ward = (i: number): RoomTemplate => ({
      id: `ward-${i}`, label: cells ? "Patient room " + (i+1) : plan === "hall" ? "Infirmary hall" : "Ward " + (i+1),
      role: "ward", size: cells ? [6,6] : [12,11], sleep: bedding, program: cells ? "passage" : "ward",
      furnish: modern ? ["clock","basin"] : ["basin","lamp"],
    });
    const entry: RoomTemplate = { id: "entrance", label: plan === "court" ? "Hospital courtyard" : "Ward corridor",
      role: "entry", ...(plan === "court" ? { styles: { pole: "stone" } } : {}), size: plan === "court" ? [12,11] : [14,5], shapes: [plan === "court" ? "courtyard" : "rect"],
      program: "passage", furnish: modern ? ["bench","clock"] : ["bench"] };
    const rooms = Array.from({length: cells ?? (plan === "hall" ? 1 : 2)}, (_, i) => ward(i));
    pr.rooms = plan === "hall" ? [rooms[0], work, {id:"store",label:"Linen store",role:"store",size:[7,6],program:"passage",furnish:["shelf","chest","basket"]}]
      : [entry, rooms[0], work, ...rooms.slice(1)];
  }
  made.set(key,pr);
  return pr;
}
