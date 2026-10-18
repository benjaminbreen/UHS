import { formatHistoricalYear } from "../../core/calendar";
import type { InteriorProfile, Look } from "./types";
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
    size: hospital ? [16,12] : [12,10], rooms: undefined,
    program: hospital ? "ward" : undefined,
    sleep: hospital ? mat ? "mat" : "bed" : "none",
    fire: "none", smokehole: false, pole: false, trades: ["household"],
    kits: {household:[]}, clutter: [], regulars: undefined,
    furnish: hospital ? ["shelf","jars","basin","chest","lamp"] :
      site.kind === "mill" ? ["quern","sacks","crate","basket","lamp"] : ["table","crate","lamp"],
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
  if (hospital && site.ward?.cells) {
    pr.program = undefined;
    pr.sleep = "none";
    pr.rooms = [
      {id:"treatment",label:"Treatment room",role:"entry",size:[8,7],sleep:"none",furnish:["table","jars","basin","lamp"]},
      ...Array.from({length:site.ward.cells},(_,i)=>({id:`patient-${i}`,label:"Patient's room",role:"sleep" as const,size:[6,6] as [number,number],sleep:site.ward!.bedding,furnish:["jars","lamp"] as InteriorProfile["furnish"]})),
    ];
  }
  made.set(key,pr);
  return pr;
}
