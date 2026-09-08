import { chromium } from '@playwright/test';
import { mkdir,writeFile } from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1536,height:1024}});
await mkdir('artifacts/polish-review',{recursive:true});
const cards:string[]=[];
try{for(const [name,query] of [
 ['rural-paths','ecology=grassland&year=-6499&pattern=clustered&population=sparse'],
 ['rome-100','place=rome&ecology=dry-scrub&year=100&pattern=planned&population=settled'],
 ['desert','ecology=desert&year=-6499&pattern=clustered&population=sparse'],
 ['marsh','ecology=wetland&year=-6499&pattern=clustered&population=sparse'],
 ['northern-grassland','ecology=tundra&year=-18000&pattern=clustered&population=sparse'],
]){
 const url=`http://127.0.0.1:5173/terrain-lab?seed=street-review&${query}&water=river-ns&landform=plain&start=resident`;
 await page.goto(url);
 await page.waitForFunction(()=>document.querySelector('canvas')?.getAttribute('data-terrain-ready')==='true',{}, {timeout:90000});
 await page.getByRole('button',{name:'Pause water'}).click();
 await page.evaluate(()=>{const lab=(window as any).terrainLab;lab.scene.options.center={...lab.runtime.engine.world.spawn};lab.scene.draw();});
 await page.waitForFunction(()=>document.querySelector('canvas')?.getAttribute('data-terrain-pending')==='0',{}, {timeout:90000});
 await page.locator('canvas').screenshot({path:`artifacts/polish-review/${name}.png`});
 await page.evaluate(()=>{const lab=(window as any).terrainLab;lab.runtime.zoom=2;lab.scene.draw();});
 await page.waitForFunction(()=>document.querySelector('canvas')?.getAttribute('data-terrain-pending')==='0',{}, {timeout:90000});
 await page.locator('canvas').screenshot({path:`artifacts/polish-review/${name}-detail.png`});
 cards.push(`<article><h2>${name}</h2><a href="${name}.png"><img src="${name}.png"></a><p><a href="${name}-detail.png">2× detail</a> · <a href="${url}">Explore</a></p></article>`);
 console.log(name,await page.evaluate(()=>{const w=(window as any).terrainLab.runtime.engine.world;let paved=0;let example:any;const materials=new Set();for(let y=w.spawn.y-30;y<w.spawn.y+30;y++)for(let x=w.spawn.x-30;x<w.spawn.x+30;x++){const c=w.topography(x,y);if(c.feature==='paving'){paved++;example??=c;materials.add(c.streetMaterial);}}return {paved,example,materials:[...materials]};}));
}}finally{await browser.close();}
await writeFile('artifacts/polish-review/index.html',`<!doctype html><meta charset="utf-8"><title>Street review</title><style>body{background:#252e24;color:#eee9d2;font:16px system-ui;margin:36px}img{width:100%;image-rendering:pixelated}main{display:grid;grid-template-columns:1fr 1fr;gap:24px}a{color:#ced9a9}</style><h1>Final palette and pixel polish</h1><p><a href="before.png">Previous rural rendering at the same camera</a></p><main>${cards.join('')}</main>`);
