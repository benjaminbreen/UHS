import {chromium} from '@playwright/test';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:940}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try {
for(const study of (process.argv.slice(2).length ? process.argv.slice(2) : ['monsoon','mediterranean'])) {
 await page.goto('http://127.0.0.1:5173/@vite/client');
 console.log(await page.evaluate(async(study)=>{
  const React=(await import('/node_modules/.vite/deps/react.js')).default;
  const client=await import('/node_modules/.vite/deps/react-dom_client.js');
  const {App}=await import('/src/ui/App.tsx');
  const {Runtime}=await import('/src/runtime/session.ts');
  const {prepareSettingSession}=await import('/src/runtime/preparation.ts');
  await import('/src/ui/style.css');
  const tropical=study==='monsoon';
  const s={version:2,placeId:"review",location:study,culture:tropical?"southeast-asian":"european",architecture:"timber",role:"traveler",characterName:"Traveler",community:"",lon:tropical?100:-9.14,lat:tropical?15:38.72,year:1300,relief:.2,climate:tropical?'tropical':'mediterranean',settlement:'camp',water:'river-ns',season:'summer',terrainRevision:2,geographyRevision:1,geographyMode:'configured',ecologyRevision:2,hydrologyRevision:3,environment:{ecology:tropical?'tropical-woodland':'dry-scrub',colorway:tropical?'monsoon':undefined,landform:'plain',population:'none',start:'wanderer',household:'mixed'},playableMap:{id:study,name:study,size:304,exits:[]}};
  const engine=await prepareSettingSession(s,'community-review');
  const runtime=new Runtime(engine,{cacheTerrain:false});runtime.zoom=.75;
  window.review={runtime};
  document.body.innerHTML='<div id="root"></div>';
  (client.createRoot??client.default.createRoot)(document.getElementById('root')).render(React.createElement(App,{runtime,writer:false}));
  const counts={}; for(let y=-80;y<=80;y+=4) for(let x=-80;x<=80;x+=4){const h=engine.world.habitatAt(x,y);counts[h.primary]=(counts[h.primary]??0)+1;}
  return {study,counts};
 },study));
 await page.waitForSelector('canvas[data-terrain-ready="true"]',{timeout:120000});
 await page.waitForFunction(()=>document.querySelector('canvas[data-terrain-ready]')?.getAttribute('data-terrain-pending')==='0',{}, {timeout:120000});
 await page.screenshot({path:`artifacts/habitat-community-review/${study}-app.png`});
 console.log('captured',study);
}
console.log({errors});
} finally {await browser.close();}
