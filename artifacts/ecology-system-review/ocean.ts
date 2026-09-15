import {mapForCoordinate,permanentMap,permanentExits} from '../../src/world/travel/network';
import {travelSetting} from '../../src/runtime/map-travel';
import {createEnvironment} from '../../src/world/v3/environment';
import {createRegionalContext} from '../../src/world/regional/context';
const id=mapForCoordinate({lon:114.63,lat:20.9}),year=-996;
const s=travelSetting(permanentMap(id,year),permanentExits(id,year),year);
const r=createRegionalContext(s),land=createEnvironment(s,'portrait:'+id,r);
console.log(s.water,s.geographyMode,s.playableMap?.size,s.playableMap?.exits.map(e=>e.waterways));
for(let x=-152;x<152;x+=8){const f=land.sample(x,-151);if(f.water>=0)console.log(x,f.water,land.mainWater(x,-151),r.featureAt(x,-151,['land','sea','river','lake']));}
