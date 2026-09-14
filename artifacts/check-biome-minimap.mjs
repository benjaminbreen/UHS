import { chromium } from '@playwright/test';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1100,height:440}}); const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:5173/@vite/client');
await page.evaluate(async()=>{
const React=(await import('/node_modules/.vite/deps/react.js')).default;
const client=await import('/node_modules/.vite/deps/react-dom_client.js');
const {Minimap}=await import('/src/ui/Minimap.tsx');
const {createRegionalContext}=await import('/src/world/regional/context.ts');
const {adjacentTerrain}=await import('/src/world/travel/terrain-preview.ts');
document.body.innerHTML='<div id="root"></div>';document.body.style='background:#141b30;color:white';
const views=['desert','temperate-woodland'].map((ecology,i)=>{
 const s={version:2,lon:32,lat:38,year:-1042,relief:.3,climate:'arid',settlement:'camp',water:'none',season:'summer',terrainRevision:2,geographyRevision:1,geographyMode:'configured',ecologyRevision:1,hydrologyRevision:1,environment:{ecology,landform:'rolling',population:'none',start:'wanderer',household:'mixed'}};
 s.playableMap={id:ecology,size:304,exits:[{id:'link',to:'next',bearing:i?'S':'N',mode:'land',neighbor:{lon:32,lat:38,ecology:i?'desert':'temperate-woodland',relief:.3,climate:'arid',water:'none',landform:'rolling',size:304,geographyMode:'configured'}}]};
 const r=createRegionalContext(s),preview=adjacentTerrain(s);
 const world={generatorVersion:3,pack:{setting:s,trees:[]},places:[],settlements:[],decoration:()=>undefined,terrain:()=> 'grass',overview:()=> 'grass',mapTerrain:(x,y)=>{const next=preview(x,y);if(next)return next;const e=r.ecologyAt(x,y);return {terrain:'grass',habitat:{...e.selected,blend:e.parts,wet:.2,cover:.3,exposed:0,kind:'open',season:'summer'}};}};
 return React.createElement('div',{style:{display:'inline-block',margin:8}},React.createElement('p',null,ecology+' connecting edge'),React.createElement(Minimap,{runtime:{engine:{world,state:{revision:0,player:{pos:{x:0,y:i?145:-145,space:'outside'}},fauna:[]}}},large:true,span:304}));
});
(client.createRoot??client.default.createRoot)(document.getElementById('root')).render(React.createElement('div',null,...views));
});
await page.waitForSelector('canvas[data-map-builds]');
await page.screenshot({path:'artifacts/biome-boundary-minimaps.png'});
console.log(JSON.stringify({errors,canvases:await page.locator('canvas[data-map-builds]').count()}));await browser.close();
