import {chromium} from '@playwright/test';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1500,height:1000}});
page.on('pageerror',e=>console.log('PAGEERROR',e.message));
await page.goto('http://127.0.0.1:5173/@vite/client');
try {
 console.log(await page.evaluate(async()=>{
  const {permanentMap,permanentExits,mapForCoordinate}=await import('/src/world/travel/network.ts');
  const id=mapForCoordinate({lon:110.3,lat:-1.8});
  const map=permanentMap(id,-1064), exits=permanentExits(id,-1064);
  const {travelSetting}=await import('/src/runtime/map-travel.ts');
  const s=travelSetting(map,exits,-1064);
  window.review={s,id,map,exits};
  return {name:map.name,environment:s.environment,exits:s.playableMap.exits.map(e=>({to:e.to,side:e.seam?.side,ports:e.waterways}))};
 }));
 console.log(await page.evaluate(async()=>{
  const React=(await import('/node_modules/.vite/deps/react.js')).default;
  const client=await import('/node_modules/.vite/deps/react-dom_client.js');
  const {App}=await import('/src/ui/App.tsx');
  const {Runtime}=await import('/src/runtime/session.ts');
  const {prepareSettingSession}=await import('/src/runtime/preparation.ts');
  await import('/src/ui/style.css');
  const {s,id}=window.review;
  const engine=await prepareSettingSession(s,'travel-review:'+id);
  const runtime=new Runtime(engine,{cacheTerrain:false});
  window.review.runtime=runtime;
  runtime.zoom=.75;
  document.body.innerHTML='<div id="root"></div>';
  (client.createRoot??client.default.createRoot)(document.getElementById('root')).render(React.createElement(App,{runtime,writer:false}));
  return 'mounted';
 }));
 await page.waitForSelector('canvas[data-terrain-ready="true"]',{timeout:120000});
 await page.waitForFunction(()=>document.querySelector('canvas[data-terrain-ready]')?.getAttribute('data-terrain-pending')==='0',{}, {timeout:120000});
 await page.screenshot({path:'artifacts/ecology-system-review/borneo.png'});
 console.log('captured');
} catch(e) { console.log(e.message); console.log(await page.evaluate(()=>({text:document.body.innerText.slice(0,800),canvases:[...document.querySelectorAll('canvas')].map(c=>({...c.dataset}))}))); await page.screenshot({path:'artifacts/ecology-system-review/browser-state.png'}); process.exitCode=1; } finally {await browser.close();}
