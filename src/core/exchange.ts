import { random } from "./random";
import type { Actor, Inventory, Position, WorldObject } from "./types";

import { markets, type Listing, type MarketKind } from "../content/economy/exchanges";
import type { FaunaGroup } from "./fauna";

export const lenders = [
  { desk: "Bill discounter", trade: "moneylender", principal: 20, fee: 2 },
  { desk: "Merchant lender", trade: "moneylender", principal: 40, fee: 6 },
] as const;
export const exchangeDesks = [...markets.beurs.listings, ...lenders];
export const callSeconds = 300;

type Holding = { quantity: number; cost: number };
export type ExchangeBook = {
  holdings: Partial<Record<string, Holding>>;
  lastTally?: number;
  nextLot?: number;
  shares: number;
  cash: number;
  realized: number;
  loan?: { desk: number; day: number };
  porter?: boolean;
  freight?: number;
  warehouse?: string;
};
export type MarketOrder = {
  type: "exchange";
  action: "buy" | "sell" | "redeem" | "borrow" | "repay" | "call" | "hire" | "freight" | "deliver" | "tally";
  desk: number;
  quantity: number;
  call: number;
};
type Floor = { currency?: {one:string;many:string}; kind: MarketKind; marketId: string; stand?: Position; animals: FaunaGroup[]; book: ExchangeBook; stock?: Inventory; seed: string; clock: number; purse: Inventory; carryRoom: number; desks: boolean[] };

export const blankBook = (): ExchangeBook => ({ holdings: {}, shares: 24, cash: 600, realized: 0 });
export function marketCall(seed: string, call: number, listing: Listing) {
  const roll = (t: number, key: string) => random(seed, "market", listing.id, t, key);
  const newsAt = (t: number) => listing.reports[Math.floor(roll(t, "news") * listing.reports.length)];
  const period = Math.floor(call / 4), phase = ((call % 4) + 4) % 4;
  const [news, change] = newsAt(period), previous = newsAt(period - 1)[1];
  const drift = (previous * (3 - phase) + change * (phase + 1)) / 4;
  const mid = Math.max(2, Math.round(listing.base + (listing.id === "voc" ? 1.7 : 1) * drift + roll(call, "bids") * 2 - 1));
  return { bid: mid - 1, ask: mid + 1, mid, news };
}
export function loanDue(loan: NonNullable<ExchangeBook["loan"]>, clock: number) {
  const lender = lenders[loan.desk - markets.beurs.listings.length];
  return lender.principal + lender.fee * (1 + Math.max(0, Math.floor(clock / 86400) - loan.day));
}
function heads(f: Floor, l: Listing, owner: string) {
  return f.animals.filter(g=>g.speciesId===l.id && g.owner===owner && !g.hitch && !g.draft && !g.train && g.pos.space==="outside")
    .flatMap(g=>g.members.filter(m=>f.stand && Math.hypot(m.x-f.stand.x,m.y-f.stand.y)<=10).map(m=>({g,m})));
}
export function holdingAt(f: Floor, l: Listing) {
  if(!l.animal)return f.book.holdings[l.id];
  const animals=heads(f,l,"player");
  return {quantity:animals.length,cost:animals.reduce((n,{m})=>n+(m.purchase ?? 0),0)};
}
export function offeredLots(f: Floor, l: Listing) {
  if (l.animal) return heads(f,l,f.marketId).length;
  return l.id === "voc" ? f.book.shares : f.stock?.[l.id] ?? 0;
}
export function orderProblem(f: Floor, c: MarketOrder): string | undefined {
  const { book, stock, clock } = f, cash = f.purse.coin ?? 0, n = c.quantity;
  const listings=markets[f.kind].listings, credit=f.kind==="beurs" ? lenders : [];
  if (!Number.isSafeInteger(n) || n < 1 || n > 99 || !Number.isInteger(c.desk) || (c.desk < 0 || c.desk >= listings.length + credit.length))
    return "Choose a desk and a whole quantity.";
  if (c.action !== "buy" && c.action !== "sell" && c.action !== "redeem" && c.action !== "deliver" && n !== 1) return "Choose one contract at a time.";
  if (c.call !== Math.floor(clock / callSeconds)) return "A new price was called. Review the quote and try again.";
  if (c.action === "call") return;
  if (!f.desks[c.desk]) return "This desk is unattended.";
  const security = listings[c.desk], lender = credit[c.desk - listings.length];
  if (c.action === "borrow") {
    if (!lender) return "Choose a lender.";
    if (book.loan) return "Settle the current bill first.";
    if (book.cash < lender.principal) return "The lender has too little cash.";
    return;
  }
  if (c.action === "repay") {
    if (book.loan?.desk !== c.desk) return "There is no bill with this lender.";
    if (cash < loanDue(book.loan, clock)) return "You need more coin to settle this bill.";
    return;
  }
  if (!security) return "Choose a broker.";
  const { ask, bid } = marketCall(f.seed, c.call, security);
  if (c.action === "tally") {
    if (book.lastTally === Math.floor(clock / 86400)) return "Today’s market tally is complete.";
    if (f.kind === "beurs" || !offeredLots(f,security)) return "There are no lots to tally.";
    if (book.cash < 2) return "The desk has too little cash.";
    return;
  }
  if (c.action === "deliver") {
    if (f.kind === "beurs" || security.animal || !stock) return "Bring produce to a goods desk.";
    if ((f.purse[security.id] ?? 0) < n) return "You need that many lots in your pack.";
    if (book.cash < n * bid) return "The desk has too little cash.";
    return;
  }
  if (c.action === "hire" || c.action === "freight") {
    if (f.kind !== "beurs" || security.id !== "grain" || !stock) return "Book quay work and freight at the grain desk.";
    if (c.action === "hire") return book.porter ? "Your carrying order is still open." : undefined;
    if (book.freight) return "You already have grain on order.";
    if (cash < ask + 2) return "You need the quoted price and two coins for carriage.";
    return;
  }
  if (c.action === "buy") {
    const offered = offeredLots(f,security);
    if (n > offered) return "There are too few lots on offer.";
    if (cash < n * ask) return "You need more coin.";
    return;
  }
  if (security.animal && c.action === "redeem") return "Live animals stay at the market.";
  if (security.animal && heads(f,security,"player").length < n) return "Bring your animal back to the market.";
  if (n > (holdingAt(f,security)?.quantity ?? 0)) return "You do not hold that many lots.";
  if (c.action === "sell") {
    if (n * bid > book.cash) return "The desk has too little cash.";
    if (!security.animal && security.id !== "voc" && !stock) return "The warehouse is unavailable.";
  } else {
    if (security.id === "voc") return "Only goods can be collected.";
    if (!stock) return "The warehouse is unavailable.";
    if (n > f.carryRoom) return "Make room in your pack to collect the goods.";
  }
}
export function fillOrder(f: Floor, c: MarketOrder) {
  const { book, purse, stock, clock } = f;
  const listings=markets[f.kind].listings, security=listings[c.desk];
  const money=(n:number)=>`${n} ${n===1 ? f.currency?.one ?? "coin" : f.currency?.many ?? "coins"}`;
  const pay = (coins: number) => { purse.coin = (purse.coin ?? 0) - coins; book.cash += coins; };
  if (c.action === "call") return "The brokers call fresh prices.";
  if (c.action === "borrow") {
    const { principal } = lenders[c.desk - listings.length];
    pay(-principal);
    book.loan = { desk: c.desk, day: Math.floor(clock / 86400) };
    return `You receive ${money(principal)} against your bill.`;
  }
  if (c.action === "repay") {
    const due = loanDue(book.loan!, clock);
    pay(due);
    delete book.loan;
    return `Bill settled for ${money(due)}.`;
  }
  if (c.action === "hire") {
    book.porter = true;
    return "Carrying order accepted. Collect a sack at the lighter landing for an extra coin on delivery.";
  }
  if (c.action === "tally") {
    book.lastTally = Math.floor(clock / 86400);
    pay(-2);
    return `You record the ${security.animal ? "animals" : "consignment"} and earn ${money(2)}.`;
  }
  const quote = marketCall(f.seed, c.call, security);
  if (c.action === "freight") {
    book.freight = quote.ask + 2;
    pay(book.freight);
    return "Freight booked. The next sack hoisted is yours.";
  }
  const n = c.quantity;
  if (c.action === "deliver") {
    purse[security.id]! -= n;
    stock![security.id] = (stock![security.id] ?? 0) + n;
    pay(-n * quote.bid);
    return `Delivered ${n} × ${security.goods ?? security.name} for ${money(n * quote.bid)}.`;
  }
  if (security.animal) {
    const bought=c.action==="buy", price=bought ? quote.ask : quote.bid;
    for(const {g,m} of heads(f,security,bought ? f.marketId : "player").slice(0,n)){
      const owner=bought ? "player" : f.marketId;
      if(bought)m.purchase=price;
      else if(m.purchase!==undefined){book.realized+=price-m.purchase;delete m.purchase;}
      const pos={x:m.x,y:m.y,space:"outside" as const};
      if(g.members.length===1){
        g.owner=owner;g.market=f.marketId;g.home=pos;g.homeRadius=1;
        delete g.gateId;delete g.pasture;delete g.target;
      }else{
        g.members.splice(g.members.indexOf(m),1);
        if(g.members[0])g.pos={...pos,x:g.members[0].x,y:g.members[0].y};
        book.nextLot=(book.nextLot??0)+1;
        f.animals.push({id:f.marketId+"-sale-"+book.nextLot,speciesId:g.speciesId,owner,market:f.marketId,
          members:[m],pos,home:pos,homeRadius:1,state:"idle",since:clock,stride:0,nextDecisionAt:clock});
      }
    }
    pay((bought ? 1 : -1)*n*price);
    return `${bought ? "Bought" : "Sold"} ${n} head for ${money(n*price)}.`;
  }
  const holding = book.holdings[security.id] ??= { quantity: 0, cost: 0 };
  if (c.action === "buy") {
    pay(n * quote.ask);
    holding.quantity += n;
    holding.cost += n * quote.ask;
  } else {
    const basis = holding.cost * n / holding.quantity;
    holding.quantity -= n;
    holding.cost = holding.quantity ? holding.cost - basis : 0;
    if (c.action === "redeem") {
      purse[security.id] = (purse[security.id] ?? 0) + n;
      return `Collected ${n} × ${security.goods ?? security.name}.`;
    }
    pay(-n * quote.bid);
    book.realized += n * quote.bid - basis;
  }
  const bought = c.action === "buy", flow = bought ? -n : n;
  if (security.id === "voc") book.shares += flow;
  else stock![security.id] = (stock![security.id] ?? 0) + flow;
  return `${bought ? "Bought" : "Sold"} ${n} × ${security.name} for ${money(n * (bought ? quote.ask : quote.bid))}.`;
}

export function landedOrder(player: Pick<Actor, "inventory" | "exchanges">, store: Pick<WorldObject, "id" | "inventory">, carried: boolean) {
  const book = Object.values(player.exchanges ?? {}).find(b => b.warehouse === store.id);
  if (!book) return;
  const bonus = carried && book.porter;
  if (bonus) {
    delete book.porter;
    player.inventory.coin = (player.inventory.coin ?? 0) + 1;
  }
  if (book.freight && (store.inventory.grain ?? 0) > 0) {
    store.inventory.grain!--;
    const holding = book.holdings.grain ??= { quantity: 0, cost: 0 };
    holding.quantity++;
    holding.cost += book.freight;
    delete book.freight;
    return (bonus ? "The broker pays your extra coin. " : "") + "Your booked grain has landed. One warehouse receipt is yours.";
  }
  if (bonus) return "The grain broker pays your extra coin for this delivery.";
}
