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
  const mat = site.ward?.bedding === "mat";
  const pr: InteriorProfile = {
    ...home, id: key, label: store ? site.outbuilding.label : site.label,
    period: `${formatHistoricalYear(site.scope.years[0])} – ${formatHistoricalYear(site.scope.years[1]-1)}`,
    when: {start:{year:site.scope.years[0]},end:{year:site.scope.years[1]-1}},
    uses: [use], basis: site.basis, note: site.note, shapes: ["rect"],
    size: [12,10], rooms: undefined, program: undefined, sleep: "none",
    fire: "none", smokehole: false, pole: false, trades: ["household"],
    kits: {household:[]}, clutter: [], regulars: undefined,
    furnish: site.kind === "mill" ? ["quern","sacks","crate","basket","lamp"] : ["table","crate","lamp"],
    styles: hospital ? { bed: "linen", shelf: mat ? "tansu" : "open" } : {},
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
    ...(hospital && site.ward ? {wall:site.ward.wall,floor:site.ward.floor,windows:4,soot:0,wear:.25} : {})
  })) as InteriorProfile["looks"];
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
