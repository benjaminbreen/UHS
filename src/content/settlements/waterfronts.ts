import type { InteriorProfile, Look } from "../interiors/types";
import { bce } from "../history/dates";
import type { WorldSetting } from "../geography/types";
import { hullWeights, waterOf, type FishingMethod } from "../economy/fishing";
import { lifeway } from "./lifeways";
import { lifewayHouses } from "../graphics/regional-houses";

export type WaterfrontProfile = {
  id:string; years:readonly [number,number]; bounds:readonly [number,number,number,number];
  craft?:"clinker"|"wasen"|"papyrus"; method?:FishingMethod; home:string; gear:string; boat:string; nets:string; sorting:string;
  households:readonly [number,number]; waters?:readonly ("sea"|"river"|"lake")[]; revision?:number; cultures?:readonly WorldSetting["culture"][];
  gearInterior?:{wall:Look["wall"];floor:Look["floor"];door:InteriorProfile["door"];windows:InteriorProfile["windowStyle"]};
  practice?:{boat:string; boatDescription:string; homeDescription:string; gearDescription:string;
    nets:string; catch:string; prepare:string; receive:string; landingActivity:"work"|"haul"; sort:string; share:string};
  sources:readonly string[]; note:string;
};
export const waterfrontProfiles:readonly WaterfrontProfile[]=[{
  id:"north-sea-fishing",craft:"clinker",method:"net",years:[1400,1850],bounds:[-11,48,16,62],
  home:"worksite-fishing-cottage",gear:"worksite-fishing-gear",
  boat:"worksite-fishing-boat",nets:"worksite-net-frame",sorting:"worksite-fish-table",
  households:[2,3],sources:["https://www.rmg.co.uk/collections/objects/rmgc-object-66680",
    "https://www.museumnord.no/en/our-venues/"],
  note:"A reconstructed small northern European fishing waterfront: permanent shore households, gear stores, open clinker boats and shared landing access. This is not a surveyed fishing village or seasonal crew lodging. Preservation methods and offshore voyages are not inferred from these buildings.",
},{
  id:"edo-inshore-fishing",craft:"wasen",method:"net",revision:6,cultures:["east-asian"],years:[1750,1868],bounds:[129,30,142,41],
  home:"worksite-plank-fishing-house",gear:"worksite-plank-fishing-store",
  boat:"worksite-plank-skiff",nets:"worksite-net-rail",sorting:"worksite-fish-trays",
  households:[2,3],sources:["https://www.britishmuseum.org/collection/object/A_1910-0614-0-16-1-3",
    "https://traditionalwoodenboat.jpn.org/"],
  note:"Late Edo inshore and river fishing. Broad-planked open boats with a stern scull, timber shore houses and stores, net repair and fresh-catch handling. A reconstruction of ordinary working spaces, not a surveyed village; it does not generalise specialised whitebait lift nets or offshore fleets to every landing.",
  gearInterior:{wall:"timber",floor:"plank",door:"door",windows:"shutter"},
  practice:{boat:"Open plank-built fishing boat",boatDescription:"A broad-planked, shallow-bottomed wooden boat with a transom stern, removable boards and a long stern scull; lines and nets are stowed inside.",
    homeDescription:"A modest timber fishing household with a boarded lower front, sliding openings and a thatched roof.",
    gearDescription:"A dry timber store for nets, floats, lines and sculling gear.",
    nets:"Nets and float lines on a mending rail",catch:"Fish-sorting trays",
    prepare:"Checking float lines and mending nets",receive:"Landing the inshore catch",landingActivity:"work",
    sort:"Sorting fish into shallow trays",share:"Selling fresh fish to local buyers"},
},{
  id:"middle-kingdom-nile-fishing",craft:"papyrus",method:"seine",waters:["river","lake"],revision:6,cultures:["north-african-west-asian"],years:[bce(2100).year,bce(1650).year],bounds:[29,24,33,31.7],
  home:"worksite-earth-fishing-house",gear:"worksite-reed-gear-shelter",
  boat:"worksite-reed-skiff",nets:"worksite-seine-pegs",sorting:"worksite-fish-mat",
  households:[2,3],sources:["https://www.metmuseum.org/art/collection/search/545402",
    "https://www.metmuseum.org/art/collection/search/544126"],
  note:"Middle Kingdom Nile landing: seine work is documented in Theban reliefs, and light reed boats in funerary models. The modest mudbrick shore house, reed gear shelter and basket/mat handling area are reconstructions. Elite sporting scenes inform boat construction, not the social organisation of an ordinary fishing household. This is not a claim that all Nile fishing used reed craft.",
  gearInterior:{wall:"reed",floor:"earth",door:"opening",windows:"none"},
  practice:{boat:"Lashed reed fishing skiff",boatDescription:"A light skiff of tightly bound reed bundles with rising ends, a low working surface and a small reed mat, with wooden paddles stowed along the bundles.",
    homeDescription:"A modest mudbrick shore house, with an earthen roof over timber and reed matting, a timber door and high ventilation openings.",
    gearDescription:"A shaded reed-mat shelter for seine ropes, nets, paddles and baskets.",
    nets:"Seine net and hauling ropes on low pegs",catch:"Reed sorting mat",
    prepare:"Mending the seine and checking its hauling ropes",receive:"Hauling the seine catch onto the bank",landingActivity:"haul",
    sort:"Sorting the river catch on reed mats",share:"Distributing the day's fish"},
}];
export function waterfrontFor(s:WorldSetting) {
  return (s.worksiteRevision??1)>=4 && s.settlement!=="camp" ? waterfrontProfiles.find(p=>
    (s.worksiteRevision??1)>=(p.revision??4) && (!p.cultures || p.cultures.includes(s.culture)) && s.year>=p.years[0] && s.year<p.years[1] && s.lon>=p.bounds[0] && s.lat>=p.bounds[1] && s.lon<=p.bounds[2] && s.lat<=p.bounds[3]) : undefined;
}

const shelters:Record<WorldSetting["architecture"],[string,string]>={
  mudbrick:["worksite-earth-fishing-house","worksite-reed-gear-shelter"],courtyard:["worksite-earth-fishing-house","worksite-reed-gear-shelter"],
  timber:["worksite-fishing-cottage","worksite-fishing-gear"],classical:["worksite-fishing-cottage","worksite-fishing-gear"],
  board:["worksite-plank-fishing-house","worksite-plank-fishing-store"],shelter:["worksite-plank-fishing-house","worksite-reed-gear-shelter"],
};
/** The fishing landing for any place with water and boats to fish from: a
 * researched profile where one covers the place and date, else one built from
 * the general fishing rules, with stand-in buildings until it has its own. */
export function fishingWaterfront(s:WorldSetting):WaterfrontProfile|undefined {
  const authored=waterfrontFor(s);
  if(authored || (s.worksiteRevision??1)<7 || s.settlement==="camp" || s.settlement==="farm" || !waterOf(s) || !Object.keys(hullWeights(s)).length)return authored;
  // A people that builds its own village form keeps it: a ring or a row of
  // its own houses, not stand-in shore houses outside it.
  const way=lifeway(s);
  if(way && lifewayHouses(way,s).length)return;
  const [home,gear]=shelters[s.architecture];
  const dry=s.climate==="arid" || s.climate==="tropical" || s.climate==="monsoon";
  return {id:"fishing-landing",years:[s.year,s.year+1],bounds:[s.lon,s.lat,s.lon,s.lat],home,gear,
    boat:"worksite-plank-skiff",nets:"worksite-net-rail",sorting:dry ? "worksite-fish-mat" : "worksite-fish-trays",
    households:s.settlement==="village" ? [2,4] : [2,3],revision:7,sources:[],
    note:"Built from the general fishing rules: craft from the climate and tools of the place and date, method by household. Buildings are stand-ins."};
}
