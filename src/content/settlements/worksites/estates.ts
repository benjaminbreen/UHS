import type { WorksiteProfile } from "./types";

const common = { revision: 2, basis: "reconstructed" } as const;
const fodder = [{prop:"grainSacks",label:"Fodder and grain"},{prop:"crate",label:"Travellers' baggage"}];

const caravanserais: WorksiteProfile[] = [
  {...common,id:"persian-caravanserai",kind:"caravanserai",roles:["caravaneer","innkeeper"],siting:"fringe",capacity:4,
    label:"Caravanserai",scope:{years:[1000,1900],bounds:[44,25,63,40]},frame:"worksite-caravanserai-persian",
    outbuilding:{frame:"worksite-masonry-store",label:"Stable and fodder store"},supplies:fodder,
    sources:["https://whc.unesco.org/en/list/1668/"],
    note:"Rooms in vaulted bays round a court with a well, entered through one tall portal that could be shut at night. Shah Abbas I built them a day's march apart; this one is not a surveyed building."},
  {...common,id:"ottoman-han",kind:"caravanserai",roles:["caravaneer","innkeeper"],siting:"fringe",capacity:4,
    label:"Han (caravanserai)",scope:{years:[1200,1900],bounds:[24,29,44,42]},frame:"worksite-caravanserai-ottoman",
    outbuilding:{frame:"worksite-masonry-store",label:"Stable and fodder store"},supplies:fodder,
    sources:["https://en.wikipedia.org/wiki/Caravanserai"],
    note:"A stone han on the road, rooms round a court, stabling and stores. Seljuk and Ottoman sultans and pious foundations endowed them so that lodging was often free for three days."},
  {...common,id:"mughal-sarai",kind:"caravanserai",roles:["caravaneer","innkeeper"],siting:"fringe",capacity:4,
    label:"Sarai",scope:{years:[1530,1860],bounds:[68,20,90,34]},frame:"worksite-caravanserai-mughal",
    outbuilding:{frame:"worksite-store-india",label:"Stable and fodder store"},supplies:fodder,
    sources:["https://en.wikipedia.org/wiki/Grand_Trunk_Road"],
    note:"A walled sarai of red sandstone with a gateway and a court, of the kind Sher Shah Suri and the Mughals built along the Grand Trunk Road."},
];

const plantations: WorksiteProfile[] = [
  {...common,id:"bengal-indigo-works",kind:"plantation",roles:["indigo-worker"],siting:"fringe",capacity:6,
    label:"Indigo works",scope:{years:[1777,1900],bounds:[84,21,92,27]},frame:"worksite-indigo-india",
    outbuilding:{frame:"worksite-brick-store",label:"Indigo drying house"},supplies:[{prop:"crate",label:"Indigo cakes"},{prop:"woodpile",label:"Cut indigo plant"}],
    sources:["https://en.wikipedia.org/wiki/Indigo_revolt"],
    note:"Steeping and beating vats stepped down a slope, run by European planters who forced peasants to grow indigo under advance contracts. The Bengal cultivators' revolt of 1859 to 1860 broke the system there."},
  {...common,id:"carolina-indigo-works",kind:"plantation",roles:["indigo-worker"],siting:"fringe",capacity:6,
    label:"Indigo vats",scope:{years:[1744,1800],bounds:[-82,31.5,-78.5,34.5]},frame:"worksite-indigo-colonial",
    outbuilding:{frame:"worksite-timber-store",label:"Indigo drying shed"},supplies:[{prop:"crate",label:"Indigo cakes"},{prop:"woodpile",label:"Cut indigo plant"}],
    sources:["https://en.wikipedia.org/wiki/Eliza_Lucas"],
    note:"Steeper, beater and settling vats on a South Carolina plantation, where indigo became an export crop in the 1740s on the knowledge and labour of enslaved Africans."},
  {...common,id:"chesapeake-tobacco-barn",kind:"plantation",roles:["tobacco-worker"],siting:"fringe",capacity:6,
    label:"Tobacco barn",scope:{years:[1620,1865],bounds:[-80,35,-74,40.5]},frame:"worksite-tobacco-barn",
    outbuilding:{frame:"worksite-timber-store",label:"Prizing and packing shed"},supplies:[{prop:"crate",label:"Hogshead staves"},{prop:"bench",label:"Stripping bench"}],
    sources:["https://en.wikipedia.org/wiki/Tobacco_in_the_American_colonies"],
    note:"A tall timber barn where leaf hangs on sticks to cure before it is packed into hogsheads. Chesapeake tobacco was grown by indentured servants and then, overwhelmingly, by enslaved people."},
];

export const estateProfiles: readonly WorksiteProfile[] = [...caravanserais, ...plantations];
