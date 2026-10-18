import type { WorksiteProfile } from "./types";

export const boatyardProfiles: readonly WorksiteProfile[] = [{
  id:"north-sea-boatyard",kind:"boatyard",revision:3,roles:["boatwright"],
  label:"Boatbuilding and repair yard",siting:"shoreline",
  scope:{years:[1400,1850],bounds:[-11,48,16,62]},
  frame:"worksite-clinker-boatyard",outbuilding:{frame:"worksite-timber-store",label:"Boat timber and tool store"},
  launch:{frame:"worksite-clinker-hull",wayFrame:"worksite-timber-way",width:5,dryLength:14,reach:36,waterLength:8},
  capacity:3,supplies:[{prop:"woodpile",label:"Seasoning boat timber"},{prop:"bench",label:"Boatwright's bench"}],
  basis:"reconstructed",
  sources:["https://archaeologydataservice.ac.uk/catalogue/adsdata/arch-281-1/dissemination/pdf/cba_rr_074.pdf",
    "https://www.rmg.co.uk/collections/objects/rmgc-object-66680"],
  note:"An inferred small northern European yard building and repairing overlapping-plank wooden boats. A workshop, timber store and boat on stocks stand beside a clear launching approach. This is a local working boatyard, not a naval dockyard or a surveyed historic site.",
}];
