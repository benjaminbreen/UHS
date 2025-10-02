/**
 * components/farm/FarmTradeTab.tsx
 * Trade/marketplace tab
 */

import React, { useCallback } from 'react';
import { Item } from '../../types';
import { CROP_EMOJIS } from './types';
import { Sprout, Wheat, Store, HandCoins } from 'lucide-react';

interface FarmTradeTabProps {
  harvestLedger: Record<string, number>;
  setHarvestLedger: (ledger: Record<string, number>) => void;
  validCrops: string[];
  seedPriceMultiplier: number;
  onBuy: (itemBaseId: string, price: number) => void;
  onSell: (item: Item, price: number) => void;
}

export const FarmTradeTab: React.FC<FarmTradeTabProps> = ({
  harvestLedger,
  setHarvestLedger,
  validCrops,
  seedPriceMultiplier,
  onBuy,
  onSell,
}) => {
  const handleSellCrop = useCallback(
    (crop: string, qty: number, total: number) => {
      const item: Item = {
        id: `harvest-${crop}-${Date.now()}`,
        baseId: crop.toUpperCase().replace(/\s+/g, '_'),
        name: crop,
        description: `Freshly harvested ${crop}.`,
        emoji: CROP_EMOJIS[crop] || '🌾',
        rarity: 'Common',
        value: total,
        weight: qty * 0.2,
        attack: 0,
        wearable: false,
        stackable: true,
        quantity: qty,
        sustenance: 0,
        wieldable: false,
        throwable: false,
        craftingValue: 1,
        category: 'Food',
      };

      onSell(item, total);

      setHarvestLedger((prev) => {
        const next = { ...prev };
        delete next[crop];
        return next;
      });
    },
    [onSell, setHarvestLedger]
  );

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800/60">
        <h4 className="text-amber-400 font-bold flex items-center gap-2 mb-4">
          <Store className="w-4 h-4" />
          Market
        </h4>

        {/* Buy Seeds */}
        <div className="mb-6">
          <h5 className="text-slate-200 font-semibold text-sm mb-2 flex items-center gap-2">
            <HandCoins className="w-4 h-4" />
            Buy Seeds
          </h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {validCrops.slice(0, 8).map((crop) => {
              const price = Math.max(1, Math.floor(5 * seedPriceMultiplier));
              return (
                <button
                  key={`seed-${crop}`}
                  onClick={() => onBuy(`${crop}_seed`, price)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200"
                >
                  <span className="flex items-center gap-2">
                    <Sprout className="w-4 h-4 text-emerald-300" />
                    <span className="capitalize text-sm">{crop} seed</span>
                  </span>
                  <span className="text-xs text-amber-300">{price}¢</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sell Harvest */}
        <div>
          <h5 className="text-slate-200 font-semibold text-sm mb-2 flex items-center gap-2">
            <Wheat className="w-4 h-4" />
            Sell Harvest
          </h5>
          {Object.keys(harvestLedger).length === 0 ? (
            <div className="text-xs text-slate-400">
              No recorded harvest yet. Harvest mature fields to add produce here.
            </div>
          ) : (
            <div className="space-y-2">
              {Object.entries(harvestLedger).map(([crop, qty]) => {
                const pricePer = 3;
                const total = qty * pricePer;
                return (
                  <div
                    key={`sell-${crop}`}
                    className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-xl">{CROP_EMOJIS[crop] || '🌾'}</div>
                      <div className="text-sm text-slate-200 capitalize">{crop}</div>
                      <div className="text-xs text-slate-400">x{qty}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-amber-300">{total}¢</div>
                      <button
                        onClick={() => handleSellCrop(crop, qty, total)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-amber-700 hover:bg-amber-600 text-white text-xs"
                      >
                        Sell
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FarmTradeTab;
