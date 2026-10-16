import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import type { Runtime } from "../runtime/session";
import type { Inventory, ItemId } from "../core/types";
import { ItemIcon } from "./components";
import { amountIn } from "../content/economy/money";

const rows = (inv: Inventory, skip?: (id: ItemId) => boolean) =>
  Object.entries(inv).filter(([id, n]) => (n ?? 0) > 0 && !skip?.(id)) as [ItemId, number][];

export function ShopModal({ runtime, actorId, onClose }: {
  runtime: Runtime;
  actorId: string;
  onClose: () => void;
}) {
  const engine = runtime.engine;
  const [tab, setTab] = useState<"buy" | "sell">("buy");
  const [picked, setPicked] = useState<ItemId>();
  const [count, setCount] = useState(1);
  const [offer, setOffer] = useState<{ give: Inventory; take: Inventory }>({ give: {}, take: {} });
  const [note, setNote] = useState<string>();
  // Once open it stays open: a shopkeeper stepping from the counter mid-sale still sells.
  const shop = engine.shopOf(actorId, true);
  if (!shop) return <p>They have nothing to trade.</p>;
  const mine = engine.state.player.inventory;
  const setting = engine.world.pack.setting;
  const money = (n: number) => (setting ? amountIn(setting, n, true) : `${n} coins`);
  const name = (id: ItemId) => runtime.item(id)?.name ?? id;
  const deal = (give: Inventory, take: Inventory) => {
    const result = runtime.command({ type: "deal", target: actorId, give, take });
    setNote(result?.status === "completed" ? undefined : (result?.reason ?? "They decline."));
    return result?.status === "completed";
  };
  const heading = (
    <header className="shop-head">
      <div className="eyebrow">{shop.actor.role}</div>
      <h2>{shop.actor.name.split(" ")[0]}’s goods</h2>
    </header>
  );

  if (!shop.coined) {
    const add = (side: "give" | "take", id: ItemId, d: number, max: number) =>
      setOffer((o) => ({ ...o, [side]: { ...o[side], [id]: Math.max(0, Math.min(max, (o[side][id] ?? 0) + d)) } }));
    const yours = engine.worth(offer.give, "sell"), theirs = engine.worth(offer.take, "buy");
    const empty = !yours && !theirs;
    const column = (side: "give" | "take", inv: Inventory, title: string) => (
      <div className="shop-column">
        <h3>{title}</h3>
        <ul className="shop-list">
          {rows(inv, (id) => id === "coin" || !(side === "give" ? engine.sellPrice(id) : engine.buyPrice(id))).map(([id, n]) => (
            <li key={id} data-on={(offer[side][id] ?? 0) > 0 || undefined}>
              <ItemIcon id={id} sprite={runtime.item(id)?.sprite} scale={2} />
              <span className="shop-name">{name(id)}<small> × {n}</small></span>
              <span className="shop-price">worth {side === "give" ? engine.sellPrice(id) : engine.buyPrice(id)}</span>
              <span className="shop-step">
                <button aria-label={`Less ${name(id)}`} onClick={() => add(side, id, -1, n)}><Minus size={12} /></button>
                <b>{offer[side][id] ?? 0}</b>
                <button aria-label={`More ${name(id)}`} onClick={() => add(side, id, 1, n)}><Plus size={12} /></button>
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
    return (
      <div className="shop" data-barter>
        {heading}
        <p className="shop-lede">Nobody here pays in coin. Put goods on both sides until yours are worth as much as theirs.</p>
        <div className="shop-columns">
          {column("take", shop.stock, "They have")}
          {column("give", mine, "You offer")}
        </div>
        <footer className="shop-foot">
          <span>Your side <b>{yours}</b> · Their side <b>{theirs}</b></span>
          {note && <span className="shop-note">{note}</span>}
          <button className="primary" disabled={empty || yours < theirs}
            onClick={() => deal(offer.give, offer.take) && setOffer({ give: {}, take: {} })}>Exchange</button>
          <button onClick={onClose}>Leave</button>
        </footer>
      </div>
    );
  }

  const list = tab === "buy" ? rows(shop.stock) : rows(mine, (id) => id === "coin" || !engine.sellPrice(id));
  const price = (id: ItemId) => (tab === "buy" ? engine.buyPrice(id) : engine.sellPrice(id));
  const have = (id: ItemId) => (tab === "buy" ? shop.stock[id] ?? 0 : mine[id] ?? 0);
  const max = picked ? Math.max(0, Math.min(have(picked),
    tab === "buy" ? Math.floor((mine.coin ?? 0) / price(picked)) : Math.floor(shop.purse / price(picked)))) : 0;
  const n = Math.min(count, max);
  const confirm = () => {
    if (!picked || n < 1) return;
    const cost = { coin: n * price(picked) }, goods = { [picked]: n };
    if (tab === "buy" ? deal(cost, goods) : deal(goods, cost)) setCount(1);
  };
  return (
    <div className="shop">
      {heading}
      <div className="shop-tabs" role="tablist">
        {(["buy", "sell"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => { setTab(t); setPicked(undefined); setCount(1); setNote(undefined); }}>
            {t === "buy" ? "Buy" : "Sell"}
          </button>
        ))}
      </div>
      <ul className="shop-list" role="listbox">
        {list.map(([id]) => (
          <li key={id} role="option" aria-selected={picked === id} data-on={picked === id || undefined}
            data-dear={tab === "buy" && price(id) > (mine.coin ?? 0) || undefined}
            onClick={() => { setPicked(id); setCount(1); setNote(undefined); }}>
            <ItemIcon id={id} sprite={runtime.item(id)?.sprite} scale={2} />
            <span className="shop-name">{name(id)}<small> × {have(id)}</small></span>
            <span className="shop-owned">{tab === "buy" ? `You have ${mine[id] ?? 0}` : ""}</span>
            <span className="shop-price">{price(id)}</span>
          </li>
        ))}
        {!list.length && <li className="shop-empty">{tab === "buy" ? "Nothing left for sale today." : "You have nothing they would buy."}</li>}
      </ul>
      <footer className="shop-foot">
        {picked ? (
          <>
            <span className="shop-step">
              <button aria-label="Fewer" onClick={() => setCount(Math.max(1, n - 1))}><Minus size={12} /></button>
              <b>{n}</b>
              <button aria-label="More" onClick={() => setCount(Math.min(max, n + 1))}><Plus size={12} /></button>
            </span>
            <span>{name(picked)} for {money(n * price(picked))}</span>
            <button className="primary" disabled={n < 1} onClick={confirm}>{tab === "buy" ? "Buy" : "Sell"}</button>
          </>
        ) : (
          <span>{tab === "buy" ? "Pick something to buy." : "Pick something to sell."}</span>
        )}
        {note && <span className="shop-note">{note}</span>}
      </footer>
      <p className="shop-purse">You carry {money(mine.coin ?? 0)} · {shop.actor.name.split(" ")[0]} has {money(shop.purse)}</p>
    </div>
  );
}
