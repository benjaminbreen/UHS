import { sailingPort } from "../settlements/waterfronts";
import type { WorldSetting } from "../geography/types";

export const marketKinds = ["beurs", "corn", "dojima", "cloth"] as const;
export type MarketKind = typeof marketKinds[number];
export type Listing = {
  id: string; name: string; unit: string; base: number; desk: string; trade: string;
  animal?: boolean; goods?: string; reports: readonly (readonly [string, number])[];
};
const grainReports = [["A miller is buying for the week", 2], ["Rain holds up the grain carts", 3], ["Fresh sacks arrive from the farms", -3], ["Several growers offer the same grade", -2]] as const;
const animalReports = [["Drovers bring in another herd", -3], ["Butchers bid for stock", 3], ["Few animals have come to market", 2], ["Buyers are slow to bid", -2]] as const;
const grain: Listing = {id:"grain",name:"Wheat",unit:"sack of grain",base:5,desk:"Grain factor",trade:"grain-factor",reports:grainReports};
const pepper: Listing = {id:"pepper",name:"Black pepper",unit:"pepper measure",base:10,desk:"Spice broker",trade:"merchant",
  reports:[["A pepper auction opens",-2],["Buyers bid for a small spice cargo",3],["More pepper is offered at the quay",-3],["A convoy is late",3]]};
export const markets: Record<MarketKind,{name:string; setting:string; listings:Listing[]}> = {
  beurs:{name:"Amsterdam Beurs",setting:"Merchants’ exchange",listings:[
    {...grain,name:"Baltic grain",unit:"warehouse sack",desk:"Grain broker",trade:"merchant",
      reports:[["Clear passage through the Sound",-2],["Headwinds delay the grain fleet",3],["Bakers seek grain for the week",2],["Grain ships reach the roadstead",-3]]},pepper,
    {id:"voc",name:"Dutch East India Company",unit:"VOC share portion",base:19,desk:"Share broker",trade:"broker",
      reports:[["A returning fleet is sighted",4],["A company dividend is rumoured",3],["The fleet’s dispatches are overdue",-4],["Merchants dispute the dividend",-3]]}]},
  corn:{name:"Grain and livestock market",setting:"Town market square",listings:[grain,
    {id:"sheep",name:"Sheep",unit:"one live sheep",base:9,desk:"Sheep dealer",trade:"livestock-dealer",animal:true,reports:animalReports},
    {id:"cattle",name:"Cattle",unit:"one live animal",base:23,desk:"Cattle dealer",trade:"livestock-dealer",animal:true,reports:animalReports}]},
  dojima:{name:"Dōjima Rice Exchange",setting:"Osaka · street market",listings:[
    {...grain,name:"Rice bill",goods:"rice bale",unit:"claim on one bale of rice",base:8,desk:"Rice broker",
      reports:[["A domain puts tax rice up for auction",-3],["Rain delays the warehouse boats",3],["Bales arrive at the riverside warehouses",-2],["Rice dealers bid up the morning bills",2]]}]},
  cloth:{name:"Cloth and spice market",setting:"Port merchants’ market",listings:[
    {id:"cloth-bolt",name:"Woven cotton",unit:"bolt of cloth",base:7,desk:"Cloth broker",trade:"broker",
      reports:[["A lighter brings cloth to the landing",-3],["Retailers want more cotton",2],["Merchants open fresh bales",-2],["Headwinds delay the cloth boats",3]]},pepper]},
};

export function squareMarket(s: WorldSetting, place: string | undefined): Exclude<MarketKind,"beurs"> | undefined {
  if (s.settlement === "farm" || s.settlement === "camp") return;
  if (place === "city-osaka" && s.year >= 1730 && s.year < 1869) return "dojima";
  if (sailingPort(place,s.year)?.hull === "dhow") return "cloth";
  if (place === "city-amsterdam" && s.year >= 1600 && s.year < 1800) return;
  if (s.culture === "european" && s.lon >= -11 && s.lon <= 32 && s.lat >= 37 && s.lat <= 61 &&
      s.year >= 1650 && s.year < 1914 && (s.settlement !== "village" || (s.population ?? 0) >= 1500)) return "corn";
}
