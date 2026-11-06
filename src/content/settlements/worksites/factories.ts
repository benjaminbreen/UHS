import type { WorksiteProfile } from "./types";

const roles = ["factory-hand","power-loom-weaver","mill-worker"];
const common = { revision: 2, kind: "factory", roles, basis: "reconstructed", siting: "urban", urban: true, capacity: 12,
  outbuilding: { frame: "worksite-brick-store", label: "Boiler house and stores" } } as const;
const northLight = {...common, label: "Factory", frame: "worksite-sawtooth",
  sources: ["https://en.wikipedia.org/wiki/Sawtooth_roof"],
  note: "A one-storey factory lit through north-facing roof glazing, the standard shed of twentieth-century light industry from Mexico City to Shenzhen. Its product is not specified." } as const;

export const factoryProfiles: readonly WorksiteProfile[] = [
  {...common,id:"japanese-filature",label:"Silk-reeling mill",scope:{years:[1872,1940],bounds:[129,31,142,40]},frame:"worksite-filature",
    sources:["https://whc.unesco.org/en/list/1449/"],
    note:"A long brick reeling hall under a tiled roof with a tall chimney, after the government mill at Tomioka (1872). Its reelers were mostly young women on contract from farming families."},
  {...common,id:"chinese-filature",label:"Silk filature",scope:{years:[1878,1950],bounds:[112,22,123,33]},frame:"worksite-filature",
    sources:["https://en.wikipedia.org/wiki/Silk_industry_in_China"],
    note:"A steam silk-reeling mill of the kind that spread round Shanghai and the Canton delta from 1878, Chinese-owned as often as foreign. Long hours and child labour drew strikes in the 1920s."},
  {...northLight,id:"east-asian-factory",scope:{years:[1950,2027],bounds:[100,0,146,46]}},
  {...northLight,id:"south-asian-factory",scope:{years:[1950,2027],bounds:[60,5,98,36]}},
  {...northLight,id:"latin-american-factory",scope:{years:[1920,2027],bounds:[-118,-56,-34,33]}},
  {...northLight,id:"african-factory",scope:{years:[1950,2027],bounds:[-18,-35,52,30]}},
];
