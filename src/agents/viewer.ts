import type { RunRecord } from "./record";

export function runViewer(record: RunRecord) {
  const data = JSON.stringify({ manifest: record.manifest, entries: record.entries, traces: record.traces }).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>UHS run review</title>
<style>
:root{color-scheme:light dark;font:15px system-ui}body{margin:24px;max-width:1500px}h1{font-size:22px}button,input,select{font:inherit;padding:6px}main{display:grid;grid-template-columns:minmax(240px,1fr) minmax(320px,3fr);gap:24px}nav{max-height:80vh;overflow:auto}nav button{display:block;width:100%;text-align:left;margin:4px 0;border:1px solid #8886;border-radius:4px;background:transparent}nav button[aria-current=true]{background:#6899b944}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:13px}canvas{width:100%;height:200px;border:1px solid #8886}summary{cursor:pointer;padding:8px 0}table{border-collapse:collapse;width:100%;table-layout:fixed}td{overflow-wrap:anywhere}article{min-width:0}body{overflow-wrap:anywhere}td,th{text-align:left;padding:5px;border-bottom:1px solid #8884}.charts{display:grid;grid-template-columns:1fr 1fr;gap:12px}.muted{opacity:.7} @media(max-width:700px){main,.charts{display:block}nav{max-height:220px}}
</style>
<h1 id="title"></h1><p id="about" class="muted"></p>
<div class="charts"><div>Path within the selected map and space<canvas id="path" aria-label="Recorded player path"></canvas></div><div>Health, hunger, fatigue and danger across tool calls<canvas id="needs" aria-label="Player needs over time"></canvas></div></div>
<p><input id="filter" placeholder="Filter calls or text" aria-label="Filter calls"> <select id="tools" aria-label="Tool"><option value="">All tools</option></select> <span id="count"></span></p>
<main><nav id="timeline" aria-label="Tool calls"></nav><article><h2 id="heading"></h2><p id="when"></p><pre id="rationale"></pre><pre id="reply"></pre><details open><summary>State before and after</summary><table><thead><tr><th>Field</th><th>Before</th><th>After</th></tr></thead><tbody id="state"></tbody></table></details><details><summary>Research health (hidden from player)</summary><pre id="health-research"></pre></details><details><summary>Tool input</summary><pre id="input"></pre></details><details><summary>Model requests, responses, errors and execution for this call</summary><pre id="traces"></pre></details></article></main>
<details><summary>Run manifest</summary><pre id="manifest"></pre></details>
<script type="application/json" id="data">${data}</script>
<script>
const data=JSON.parse(document.getElementById('data').textContent), entries=data.entries;
const el=id=>document.getElementById(id), show=(id,text)=>el(id).textContent=text, json=value=>JSON.stringify(value,null,2)??'—';
show('title',data.manifest.setting?[data.manifest.setting.role,data.manifest.setting.place,data.manifest.setting.year].join(' · '):data.manifest.id);
show('about',data.manifest.id+' · '+entries.length+' calls · '+data.traces.length+' records');show('manifest',json(data.manifest));
for(const tool of new Set(entries.map(e=>e.tool))){const o=document.createElement('option');o.value=o.textContent=tool;el('tools').append(o)}
let selected=entries.length?0:-1;
function chart(id,series,colors){const canvas=el(id),ctx=canvas.getContext('2d');canvas.width=900;canvas.height=220;ctx.clearRect(0,0,900,220);series.forEach((points,i)=>{ctx.strokeStyle=colors[i];ctx.fillStyle=colors[i];ctx.lineWidth=2;ctx.beginPath();points.forEach((p,j)=>{const x=20+p[0]*860,y=200-p[1]*170;if(j)ctx.lineTo(x,y);else ctx.moveTo(x,y)});ctx.stroke()})}
function draw(){
 const e=entries[selected], same=entries.filter(x=>x.state&&x.place===e?.place&&x.year===e?.year&&x.state.pos.space===e.state?.pos.space), points=same.map(x=>x.state.pos);
 if(points.length){const xs=points.map(p=>p.x),ys=points.map(p=>p.y),minX=Math.min(...xs)-1,minY=Math.min(...ys)-1,dx=Math.max(...xs)-minX+1,dy=Math.max(...ys)-minY+1;
 chart('path',[points.map(p=>[(p.x-minX)/dx,1-(p.y-minY)/dy])],['#438cbb']);const c=el('path').getContext('2d');if(e.state){c.fillStyle='#e6953a';c.beginPath();c.arc(20+(e.state.pos.x-minX)/dx*860,200-(1-(e.state.pos.y-minY)/dy)*170,5,0,7);c.fill()}}
 chart('needs',['health','hunger','fatigue','danger'].map(k=>entries.flatMap((x,i)=>typeof (k==='danger'?x.state?.danger?.score:x.state?.[k])==='number'?[[i/Math.max(1,entries.length-1),k==='danger'?x.state.danger.score/3:x.state[k]/100]]:[])),['#438cbb','#dc9344','#b266b5','#d14d4d']);
 const ctx=el('needs').getContext('2d');ctx.font='16px system-ui';['health','hunger','fatigue','danger'].forEach((k,i)=>{ctx.fillStyle=['#438cbb','#dc9344','#b266b5','#d14d4d'][i];ctx.fillText(k,20+i*150,215)})
}
function pick(i){selected=i;const e=entries[i];if(!e)return;show('heading',(i+1)+'. '+e.tool+' · '+e.status);show('when','Game seconds '+e.clock+' → '+e.after+' · '+e.place+' · '+e.at);show('rationale',e.rationale?json(e.rationale):'');show('reply',e.text);show('input',json(e.input));show('health-research',json(e.state?.researchHealth));show('traces',json(data.traces.filter(t=>t.turn===e.i)));el('state').replaceChildren();for(const key of new Set([...Object.keys(e.beforeState??{}),...Object.keys(e.state??{})])){if(key==='researchHealth')continue;const row=document.createElement('tr');for(const text of [key,json(e.beforeState?.[key]),json(e.state?.[key])]){const cell=document.createElement('td');cell.textContent=text;row.append(cell)}el('state').append(row)}for(const b of el('timeline').children)b.setAttribute('aria-current',String(Number(b.dataset.index)===i));draw()}
function list(){el('timeline').replaceChildren();const query=el('filter').value.toLowerCase(),tool=el('tools').value;let count=0;entries.forEach((e,i)=>{if(tool&&e.tool!==tool||query&&!JSON.stringify(e).toLowerCase().includes(query))return;count++;const b=document.createElement('button');b.dataset.index=i;b.textContent=(i+1)+'. '+e.tool+' · '+e.status+' · '+(e.rationale?.intent??e.text.split('\\n')[0]).slice(0,85);b.onclick=()=>pick(i);el('timeline').append(b)});show('count',count+' calls');pick(selected)}
el('filter').oninput=list;el('tools').onchange=list;list();
</script></html>`;
}
