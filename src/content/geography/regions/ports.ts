import type { RegionalProfile } from "./types";
import type { AtlasPlace } from "../types";

type Berth = {
  city: string; siteId: string; name: string; lon: number; lat: number;
  from: number; until?: number; automated?: boolean; steel?: boolean; source: string;
};

const districts: readonly Berth[] = [
  {city:"rotterdam",siteId:"rotterdam-terminal",name:"Eemhaven",lon:4.423,lat:51.886,from:1967,until:2015,source:"https://www.ect.nl/en/about-us/60-years-milestones"},
  {city:"rotterdam",siteId:"rotterdam-terminal",name:"Maasvlakte II",lon:4.011,lat:51.970,from:2015,automated:true,source:"https://www.apmterminals.com/en/maasvlakte/about/our-terminal"},
  {city:"ensenada",siteId:"ensenada-terminal",name:"Ensenada cargo terminal",lon:-116.626,lat:31.849,from:1997,source:"https://hutchisonportseit.com/en/about"},
  {city:"city-detroit",siteId:"detroit-terminal",name:"Detroit River freight wharf",lon:-83.104,lat:42.295,from:1959,steel:true,source:"https://portdetroit.com/about-the-port/"},
  {city:"city-new-york",siteId:"elizabeth-terminal",name:"Elizabeth marine terminal",lon:-74.146,lat:40.668,from:1962,source:"https://www.panynj.gov/port/en/our-port/history.html"},
  {city:"city-mumbai",siteId:"nhava-sheva-terminal",name:"Nhava Sheva",lon:72.944,lat:18.949,from:1989,source:"https://www.jnport.gov.in/page/history/dGxXZFVwR3U5ZGRqQWVHazVPajZ6QT09"},
  {city:"city-singapore",siteId:"singapore-terminal",name:"Tanjong Pagar",lon:103.850,lat:1.263,from:1972,until:2000,source:"https://www.globalpsa.com/heritage-tab/"},
  {city:"city-singapore",siteId:"singapore-terminal",name:"Pasir Panjang",lon:103.772,lat:1.286,from:2000,source:"https://www.globalpsa.com/heritage-tab/"},
  {city:"city-durban",siteId:"durban-terminal",name:"Durban container terminal",lon:31.011,lat:-29.883,from:1977,source:"https://www.transnetportterminals.net/ports/pages/durban_container.aspx"},
  {city:"city-mombasa",siteId:"mombasa-terminal",name:"Kipevu container berth",lon:39.626,lat:-4.037,from:1983,source:"https://www.iaphworldports.org/n-iaph/wp-content/uploads/ph/1983-5.pdf"},
  {city:"city-hamburg",siteId:"hamburg-terminal",name:"Burchardkai",lon:9.930,lat:53.526,from:1968,source:"https://hhla.de/en/company/subsidiaries/container-terminal-burchardkai-ctb"},
  {city:"city-busan",siteId:"busan-terminal",name:"Jaseongdae container berth",lon:129.052,lat:35.125,from:1978,until:2024,source:"https://www.busanpa.com/eng/index.bpa?menuCd=DOM_000000202002002000"},
  {city:"city-busan",siteId:"busan-terminal",name:"Gamman container berth",lon:129.077,lat:35.111,from:2024,source:"https://www.busanpa.com/board/view.bpa?boardId=BBS_0000031&dataSid=30867&menuCd=DOM_000000105002001000"},
  {city:"city-santos",siteId:"santos-terminal",name:"Conceiçãozinha container berth",lon:-46.290,lat:-23.991,from:1981,source:"https://www.portodesantos.com.br/en/"},
];

// Keep the whole basin on its district map when the real quay straddles a tile edge.
function fitBerth(value:number) {
  const width=384/2048, center=(Math.floor(value/width)+.5)*width;
  return center+Math.max(-.054,Math.min(.054,value-center));
}
export const freightBerths=districts.map(b=>({...b,lon:fitBerth(b.lon),lat:fitBerth(b.lat)}));

export function berthFor(city: string, year: number) {
  return freightBerths.find(b=>b.city===city && year>=b.from && year<(b.until ?? Infinity));
}
export function atBerth(p: AtlasPlace, b: Berth): AtlasPlace {
  return {...p,id:b.siteId,name:b.name,lon:b.lon,lat:b.lat,water:b.steel ? "river-ew" : "coast-n",settlement:"port"};
}
export const portRegions: RegionalProfile[] = freightBerths.map(b=>{
  const dates={start:{year:b.from},...(b.until && {end:{year:b.until}})};
  const evidence={status:"inferred" as const,note:"A reconstructed working berth and basin at game scale.",sources:[b.source]};
  return {id:b.siteId+"-"+b.from,dates,bounds:[b.lon-.05,b.lat-.04,b.lon+.05,b.lat+.04],priority:100,
    settlement:"anchored",defaults:{settlement:"port",relief:.06},evidence,
    places:[{id:b.siteId,name:b.name,at:[b.lon+.020,b.lat-.006],dates,radius:72,
      defaults:{settlement:"port",water:b.steel ? "river-ew" : "coast-n",settlementPattern:"waterfront"},evidence}]};
});

const sailDates={start:{year:1600},end:{year:1800}};
for(const [id,name,lon,lat,water] of [
  ["rotterdam","Rotterdam",4.468,51.908,"river-ew"],
  ["city-gdansk","Gdańsk",18.657,54.354,"river-ns"],
] as const){
  const evidence={status:"inferred" as const,sources:["https://mass.cultureelerfgoed.nl/routes/baltic-sea-timber-trade","https://nmm.pl/en/2025/03/24/gold-for-grain-maritime-power-of-gdansk/"],
    note:"A game-scale merchant waterfront on the Nieuwe Maas or the Motława."};
  portRegions.push({id:id+"-sailing-port",dates:sailDates,priority:95,settlement:"anchored",defaults:{settlement:"port",water,relief:.06},
    bounds:[lon-.06,lat-.05,lon+.06,lat+.05],evidence,
    places:[{id,name,dates:sailDates,at:[lon,lat],radius:100,defaults:{settlement:"port",water,settlementPattern:"waterfront"},evidence}],
    features:[...(id==="rotterdam" ? [{id:"rotterdam-north-bank",kind:"land" as const,dates:sailDates,evidence,
      geometry:[[lon-.06,lat-.011],[lon+.003,lat-.002],[lon+.03,lat+.003],[lon+.03,lat+.05],[lon-.06,lat+.05]] as const}] : []),
      {id:id+"-harbor-river",kind:"river",dates:sailDates,width:12,evidence,
      geometry:water==="river-ew" ? [[lon-.08,lat-.025],[lon-.025,lat-.008],[lon+.016,lat-.004],[lon+.08,lat-.02]] :
        [[lon+.004,lat-.06],[lon+.001,lat-.01],[lon+.006,lat+.008],[lon+.032,lat+.05]]}]});
}

const coveDates={start:{year:1600},end:{year:1850}};
const coveEvidence={status:"inferred" as const,sources:["https://www.rmg.co.uk/collections/objects/rmgc-object-547391"],
  note:"Muscat at the head of its cove, with the shore and anchorage generalized from the 1828 harbour survey."};
portRegions.push({id:"muscat-cove",dates:coveDates,bounds:[58.56,23.57,58.63,23.64],priority:95,settlement:"anchored",
  defaults:{settlement:"port",water:"coast-n",relief:.12},evidence:coveEvidence,
  places:[{id:"city-muscat",name:"Muscat",at:[58.586,23.598],radius:80,dates:coveDates,
    defaults:{settlement:"port",water:"coast-n",settlementPattern:"waterfront"},evidence:coveEvidence}],
  features:[{id:"muscat-anchorage",kind:"sea",dates:coveDates,evidence:coveEvidence,
    geometry:[[58.576,23.64],[58.581,23.613],[58.587,23.607],[58.599,23.609],[58.604,23.63],[58.614,23.64]]}]});
