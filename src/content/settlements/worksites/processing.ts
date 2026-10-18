import type { WorksiteProfile } from "./types";

const pottery = "https://historicengland.org.uk/images-books/publications/iha-roman-medieval-pottery-tile-production/heag228-roman-medieval-pottery-tile-production/";
const brick = "https://research.colonialwilliamsburg.org/Foundation/Journal/Winter05-06/bricks.cfm";
const leather = "https://research.colonialwilliamsburg.org/DigitalLibrary/view/index.cfm?doc=ResearchReports%5CRR0107.xml&highlight=";
const fulling = "https://pompeiisites.org/wp-content/uploads/A-Guide-to-the-Pompeii-Excavations-2.pdf";
const common = { revision: 2, basis: "reconstructed", capacity: 3 } as const;
const pots = [{prop:"pot",label:"Pots awaiting firing"},{prop:"crate",label:"Pottery supplies"}];
const cloth = [{prop:"washTub",label:"Rinsing basin"},{prop:"bench",label:"Cloth-working bench"}];
export const processingProfiles: readonly WorksiteProfile[] = [
  {...common,id:"european-pottery",kind:"pottery",roles:["potter"],siting:"fringe",label:"Pottery and firing yard",
    scope:{years:[700,1900],bounds:[-11,36,30,61]},frame:"worksite-pottery-kiln",outbuilding:{frame:"worksite-timber-store",label:"Pottery drying shed"},
    supplies:pots,sources:[pottery],note:"A small updraught kiln and covered drying shed. The kiln form and local clay supply are inferred; this is not a surveyed pottery."},
  {...common,id:"japanese-pottery",kind:"pottery",roles:["potter"],siting:"fringe",label:"Pottery and firing yard",
    scope:{years:[1600,1900],bounds:[129,31,142,40]},frame:"worksite-japanese-pottery",outbuilding:{frame:"worksite-eastasian-store",label:"Pottery drying shed"},
    supplies:pots,sources:["https://www.britishmuseum.org/collection/object/A_1972-0126-25"],note:"A modest chamber kiln with a timber drying shed. This reconstructs small-scale ceramic production, not a great climbing kiln or a documented local workshop."},
  {...common,id:"colonial-pottery",kind:"pottery",roles:["potter"],siting:"fringe",label:"Pottery and firing yard",
    scope:{years:[1550,1900],bounds:[-108,14,-86,25]},frame:"worksite-colonial-pottery",outbuilding:{frame:"worksite-adobe-store",label:"Pottery drying shed"},
    supplies:pots,sources:["https://templomayor.inah.gob.mx/index.php/salas-del-museo/sala-8-arqueologia-historica"],note:"An inferred small colonial-period firing kiln with a covered drying and shaping space. Local clay extraction is not geologically modelled."},
  {...common,id:"european-brickyard",kind:"brickworks",roles:["brickmaker"],siting:"fringe",label:"Brickmaking yard",
    scope:{years:[1200,1900],bounds:[-11,36,30,61]},frame:"worksite-brick-clamp",outbuilding:{frame:"worksite-timber-store",label:"Brick moulding and drying shed"},
    supplies:[{prop:"crate",label:"Brick moulds"},{prop:"bench",label:"Moulding bench"}],sources:[brick],note:"A temporary brick clamp, moulding shed and drying ground. Clay and fuel are inferred local inputs; a clamp is not a permanent factory chimney."},
  {...common,id:"colonial-brickyard",kind:"brickworks",roles:["brickmaker"],siting:"fringe",label:"Brickmaking yard",
    scope:{years:[1650,1850],bounds:[-80,34,-72,41]},frame:"worksite-brick-clamp",outbuilding:{frame:"worksite-timber-store",label:"Brick moulding and drying shed"},
    supplies:[{prop:"crate",label:"Brick moulds"},{prop:"bench",label:"Moulding bench"}],sources:[brick],note:"A seasonal clamp and drying yard, after colonial Virginia brickmaking. Placement beyond Virginia is an inference, not a documented local brickyard."},
  {...common,id:"peak-limeworks",kind:"limeworks",roles:["lime-burner"],siting:"fringe",label:"Lime-burning yard",
    scope:{years:[1650,1900],bounds:[-2.1,53,-1.4,53.4]},frame:"worksite-lime-kiln",outbuilding:{frame:"worksite-masonry-store",label:"Fuel and lime store"},
    supplies:[{prop:"fieldStone",label:"Limestone awaiting burning"},{prop:"crate",label:"Lime-burning supplies"}],sources:["https://www.peakdistrict.gov.uk/looking-after/living-and-working/fipl/protecting-our-cultural-heritage-limekilns"],note:"A draw kiln in the limestone country of the Peak District. The district supplies the geological constraint; this particular kiln and its quarry are inferred."},
  {...common,id:"european-dyehouse",kind:"dyehouse",roles:["dyer"],waterSupply:true,siting:"waterside",label:"Dyehouse and rinsing yard",
    scope:{years:[1100,1900],bounds:[-11,36,30,61]},frame:"worksite-dyehouse",outbuilding:{frame:"worksite-timber-store",label:"Cloth drying and dye store"},
    supplies:cloth,sources:["https://www.nationaltrust.org.uk/visit/suffolk/lavenham-guildhall/history-of-lavenham-guildhall"],note:"A small heated dyehouse, rinsing vats and drying space close to fresh water. Plant and mineral dyes vary by region and period; these vats do not imply synthetic dyes."},
  {...common,id:"edo-dyehouse",kind:"dyehouse",roles:["dyer"],waterSupply:true,siting:"waterside",label:"Dyeing and rinsing yard",
    scope:{years:[1600,1900],bounds:[129,31,142,40]},frame:"worksite-japanese-dyehouse",outbuilding:{frame:"worksite-eastasian-store",label:"Cloth drying and dye store"},
    supplies:cloth,sources:["https://www.metmuseum.org/art/collection/search/45402"],note:"A reconstructed timber dyeing workshop with vats and covered drying space. Fresh-water access is required; no particular regional dye recipe or documented workshop is claimed."},
  {...common,id:"roman-fullery",kind:"fullery",roles:["fuller"],siting:"urban",urban:true,label:"Fullery and washing court",
    scope:{years:[-100,500],bounds:[-10,30,37,46]},frame:"worksite-roman-fullery",outbuilding:{frame:"worksite-roman-store",label:"Cloth drying and storage range"},
    supplies:cloth,sources:[fulling],note:"A washing and cloth-finishing court with treading basins, after Pompeian fulleries. Urban water provision is inferred; no mechanical fulling mill is implied."},
  {...common,id:"european-fullery",kind:"fullery",roles:["fuller"],waterSupply:true,siting:"waterside",label:"Fulling and washing yard",
    scope:{years:[1100,1800],bounds:[-11,36,30,61]},frame:"worksite-fullery",outbuilding:{frame:"worksite-timber-store",label:"Cloth drying shed"},
    supplies:cloth,sources:["https://www.english-heritage.org.uk/visit/inspire-me/ingenious/medieval-ingenuity/"],note:"A manual fulling and washing yard with treading vats and a drying shed, beside fresh water. This does not claim a water-powered fulling mill."},
  {...common,id:"european-tannery",kind:"tannery",roles:["tanner"],waterSupply:true,siting:"fringe",label:"Tannery and hide yard",
    scope:{years:[1100,1900],bounds:[-11,36,30,61]},frame:"worksite-tannery",outbuilding:{frame:"worksite-timber-store",label:"Bark and hide store"},
    supplies:[{prop:"bench",label:"Hide-working beam"},{prop:"crate",label:"Tanning bark store"}],sources:[leather],note:"A reconstructed tanning yard with soaking pits, hide-working space and a bark store. It needs fresh water; this is hide processing rather than a shoemaker's shop."},
];
