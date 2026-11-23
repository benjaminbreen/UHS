import { markets } from "../content/economy/exchanges";
import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Clock3, Coins, Minus, Plus } from "lucide-react";
import { callSeconds, lenders, holdingAt, offeredLots, loanDue, marketCall, orderProblem, type MarketOrder } from "../core/exchange";
import type { Runtime } from "../runtime/session";
import { CharacterSprite } from "./CharacterSprite";
import { gameAudio } from "../audio/director";
import { pay } from "../audio/handling";
import "./exchange.css";

const signed=(n:number)=>(n>0?"+":"")+Number(n.toFixed(1));
export function ExchangeModal({runtime}:{runtime:Runtime}){
  const floor=runtime.engine.exchangeFloor();
  const market=markets[floor?.kind ?? "beurs"], listings=market.listings, beurs=floor?.kind==="beurs";
  const [nearest]=useState(()=>{
    const p=runtime.engine.state.player.pos;
    const desks=floor?.people.flatMap((a,i)=>a ? [{i,d:Math.hypot(a.pos.x-p.x,a.pos.y-p.y)}] : []);
    return desks?.filter(a=>a.d<=3).sort((a,b)=>a.d-b.d)[0]?.i ?? 0;
  });
  const [tab,setTab]=useState<"Market"|"Credit"|"Freight">(nearest>=listings.length ? "Credit" : "Market");
  const [desk,setDesk]=useState(nearest<listings.length ? nearest : 0), [side,setSide]=useState<"buy"|"sell"|"redeem"|"deliver">("buy");
  const [quantity,setQuantity]=useState(1), [message,setMessage]=useState("");
  if(!floor)return <p>Walk up to the market counter to trade.</p>;
  const {book,people,purse,clock}=floor, call=Math.floor(clock/callSeconds);
  const security=listings[desk], price=(i:number,t=call)=>marketCall(floor.seed,t,listings[i]);
  const q=price(desk), held=holdingAt(floor,security), cash=purse.coin??0;
  const currency=floor.currency?.many ?? "coins";
  const offered=offeredLots(floor,security);
  const command=(action:MarketOrder["action"],at:number,count=1):MarketOrder=>({type:"exchange",action,desk:at,quantity:count,call});
  const send=(c:MarketOrder)=>{
    const problem=orderProblem(floor,c);
    if(problem){setMessage(problem);void gameAudio()?.interfaceSound("deny");return;}
    const result=runtime.command(c);
    if(result?.status!=="completed") void gameAudio()?.interfaceSound("deny");
    else if(c.action==="buy"||c.action==="sell") void gameAudio()?.sound(pay("metal",c.quantity),"trade");
    setMessage(result?.status==="completed" ? (c.action==="call" ? result.events.at(-1) : result.events[0])?.text??"Order recorded." : result?.reason??"Order unavailable.");
  };
  const order=command(side,desk,quantity), problem=orderProblem(floor,order);
  const values=Array.from({length:12},(_,i)=>price(desk,call-11+i).mid);
  const lo=Math.min(...values)-1,hi=Math.max(...values)+1;
  const line=values.map((v,i)=>`${i*360/11},${62-(v-lo)*52/(hi-lo)}`).join(" ");
  const profit=listings.reduce((n,l,i)=>{const h=holdingAt(floor,l);return n+(h?h.quantity*price(i).bid-h.cost:0);},0);
  const action=(c:MarketOrder,label:string)=>{const why=orderProblem(floor,c);return <button disabled={!!why} title={why} onClick={()=>send(c)}>{label}</button>;};
  const person=(i:number)=>people[i]?.name??"Desk unattended";
  return <section className="exchange-desk">
    <header className="exchange-head"><div><h2>{floor.place.name}</h2><p>{market.setting} · {runtime.engine.world.pack.year}</p></div>
      <div className="exchange-purse"><Coins size={17}/><strong>{cash}</strong> {currency}</div></header>
    {beurs && <nav aria-label="Exchange business">{(["Market","Credit","Freight"] as const).map(t=><button key={t} aria-pressed={tab===t} onClick={()=>{setTab(t);setMessage("");}}>{t}</button>)}</nav>}
    {tab==="Market" && <div className="exchange-market"><div className="exchange-board"><h3>Price list</h3>
      {listings.map((l,i)=>{const change=price(i).mid-price(i,call-1).mid, lots=holdingAt(floor,l)?.quantity;return <button className="exchange-quote" key={l.id} aria-pressed={i===desk} onClick={()=>{setDesk(i);setQuantity(1);setSide("buy");setMessage("");}}>
        <span>{l.name}<small>{l.unit}{lots ? " · "+lots+" held" : ""}</small></span><strong>{price(i).mid}<small data-rise={change>=0}>{signed(change)}</small></strong></button>;})}
      <dl><dt>Open profit / loss</dt><dd>{signed(profit)}</dd><dt>Realized</dt><dd>{signed(book.realized)}</dd>{book.loan && <><dt>Bill outstanding</dt><dd>{loanDue(book.loan,clock)}</dd></>}</dl>
    </div><div className="exchange-ticket">
      <div className="exchange-byline">{people[desk] && <CharacterSprite appearance={runtime.appearanceFor(people[desk]!)}/>}<span>{person(desk)}<small>{security.desk}{beurs ? " · pillar "+(desk+1) : ""}</small></span></div>
      <h3>{security.name}</h3><div className="exchange-axis"><span>Last 12 calls</span><span>{Math.min(...values)}–{Math.max(...values)} {currency}</span></div><div className="exchange-chart"><svg viewBox="0 0 360 70" preserveAspectRatio="none" role="img" aria-label={`Last twelve mid-prices: ${values.join(", ")}`}>
        {[12,36,60].map(y=><line key={y} x1="0" y1={y} x2="360" y2={y} stroke="#c8b998" strokeDasharray="3 4"/>)}<polygon points={`0,69 ${line} 360,69`} fill="#91a38b" opacity=".35"/><polyline points={line} fill="none" stroke="#315f50" strokeWidth="2.5" vectorEffect="non-scaling-stroke"/></svg></div>
      <div className="exchange-news">{q.news}</div>
      <div className="exchange-sides">{(["buy","sell",...(security.id!=="voc" && !security.animal ? ["redeem",...(beurs ? [] : ["deliver"])] : [])] as ("buy"|"sell"|"redeem"|"deliver")[]).map(s=><button key={s} aria-pressed={s===side} onClick={()=>{setSide(s);setQuantity(1);setMessage("");}}>{s==="redeem"?"Collect goods":s==="deliver"?"Sell from pack":s==="buy"?`Buy · ${q.ask}`:`Sell · ${q.bid}`}</button>)}</div>
      <div className="exchange-order"><label>{security.animal ? "Head" : "Lots"} <span className="exchange-step"><button aria-label="One fewer lot" disabled={quantity<=1} onClick={()=>setQuantity(n=>n-1)}><Minus size={13}/></button><input type="number" min="1" max="99" aria-label="Order quantity" value={quantity} onChange={e=>setQuantity(Math.min(99,Math.max(1,Math.floor(+e.target.value)||1)))}/><button aria-label="One more lot" disabled={quantity>=99} onClick={()=>setQuantity(n=>n+1)}><Plus size={13}/></button></span></label><span>{side==="buy"?"To pay":side!=="redeem"?"Proceeds":"To collect"}<b>{quantity*(side==="buy"?q.ask:side!=="redeem"?q.bid:1)} {side==="redeem" ? quantity===1 ? "lot" : "lots" : currency}</b></span></div>
      <p className="exchange-detail">{offered} on offer · {held?.quantity??0} held{security.animal ? " · kept at the square" : side==="deliver" ? " · "+(purse[security.id]??0)+" in pack" : ""}{held?.quantity ? ` · average cost ${Number((held.cost/held.quantity).toFixed(1))}`:""}</p>
      <button className="exchange-submit" disabled={!!problem} onClick={()=>send(order)}>{side==="buy"?<ArrowDownLeft size={16}/>:<ArrowUpRight size={16}/>} {side==="buy"?"Buy":side==="sell"?"Sell":side==="deliver"?"Deliver":"Collect"} {quantity} {security.animal ? "head" : quantity===1?"lot":"lots"}</button>
      {!beurs && <div className="exchange-market-work">{action(command("tally",desk),(security.animal ? "Count the animals" : "Weigh the consignment")+" · earn 2 "+currency)}</div>}
      {problem && <small className="exchange-reason">{problem}{problem==="You need more coin." && beurs && !book.loan && <button onClick={()=>{setTab("Credit");setMessage("");}}>Visit the lenders</button>}</small>}
    </div></div>}
    {tab==="Credit" && <div className="exchange-services">{lenders.map((l,i)=>{const at=i+listings.length,loan=book.loan?.desk===at && book.loan;return <article key={l.desk}>
      <div className="exchange-byline">{people[at]&&<CharacterSprite appearance={runtime.appearanceFor(people[at]!)}/>}<span>{person(at)}<small>{l.desk} · pillar {at+1}</small></span></div>
      <h3>{l.principal} coins</h3><p>Receive {l.principal} now. Repay {l.principal+l.fee} today. Each new day adds {l.fee} coins to the bill.</p>
      {loan?action(command("repay",at),`Settle bill · ${loanDue(loan,clock)} coins`):action(command("borrow",at),`Borrow ${l.principal} coins`)}</article>;})}</div>}
    {tab==="Freight" && <div className="exchange-services"><article><h3>Carry Baltic grain</h3><p>Shoulder a sack at the lighter landing and take it to the hoist. The broker adds one coin to your usual wage.</p>
      {action(command("hire",0),book.porter?"Order taken · go to the landing":"Take carrying order")}</article>
      <article><h3>Book the next sack</h3><p>Reserve the next grain sack hoisted. Its warehouse receipt appears in your holdings on delivery. Carriage costs two coins.</p>
      {action(command("freight",0),book.freight?"Awaiting delivery":`Book freight · ${price(0).ask+2} coins`)}</article></div>}
    <footer><span role="status">{message || `Call at ${String(Math.floor(clock/3600)%24).padStart(2,"0")}:${String(Math.floor(call*5)%60).padStart(2,"0")}`}</span><button onClick={()=>send(command("call",desk))}><Clock3 size={15}/> Next call <small>+{Math.ceil((callSeconds-clock%callSeconds)/60)} min</small></button></footer>
  </section>;
}
