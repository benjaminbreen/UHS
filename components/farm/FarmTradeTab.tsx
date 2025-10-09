/**
 * components/farm/FarmTradeTab.tsx
 * Trade/marketplace tab - Buy seeds and sell harvested crops
 */

import React, { useCallback, useState } from 'react';
import { Item } from '../../types';
import { CROP_EMOJIS } from './types';
import { Sprout, Wheat, Store, HandCoins, ShoppingCart, TrendingUp, Package } from 'lucide-react';

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
  const [purchaseFeedback, setPurchaseFeedback] = useState<string | null>(null);
  const [saleFeedback, setSaleFeedback] = useState<string | null>(null);

  const handleBuySeed = useCallback((crop: string, price: number) => {
    onBuy(`${crop}_seed`, price);
    setPurchaseFeedback(`Purchased ${crop} seeds!`);
    setTimeout(() => setPurchaseFeedback(null), 2000);
  }, [onBuy]);

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

      setSaleFeedback(`Sold ${qty} ${crop} for ${total}¢!`);
      setTimeout(() => setSaleFeedback(null), 2000);
    },
    [onSell, setHarvestLedger]
  );

  const totalHarvestValue = Object.entries(harvestLedger).reduce((sum, [crop, qty]) => {
    return sum + (qty * 3); // 3¢ per unit
  }, 0);

  const totalHarvestUnits = Object.values(harvestLedger).reduce((sum, qty) => sum + qty, 0);

  return (
    <div className="animate-fadeIn flex gap-6 h-full">
      {/* Main Content - Two Column Layout */}
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2">
        {/* Header Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-950/40 rounded-xl p-5 border border-emerald-700/30">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-base font-semibold text-emerald-300">Market Open</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Purchase seeds for planting or sell your harvested crops for profit.
            </p>
          </div>

          <div className="bg-gradient-to-br from-amber-900/40 to-amber-950/40 rounded-xl p-5 border border-amber-700/30">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Package className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-base font-semibold text-amber-300">Your Inventory</h3>
            </div>
            <div className="flex items-baseline gap-3">
              <div className="text-2xl font-bold text-amber-200">{totalHarvestUnits}</div>
              <div className="text-sm text-slate-400">units worth {totalHarvestValue}¢</div>
            </div>
          </div>
        </div>

        {/* Feedback Messages */}
        {purchaseFeedback && (
          <div className="bg-emerald-900/50 border border-emerald-500/50 rounded-lg px-4 py-3 text-emerald-200 text-sm font-medium animate-fadeIn">
            ✓ {purchaseFeedback}
          </div>
        )}
        {saleFeedback && (
          <div className="bg-amber-900/50 border border-amber-500/50 rounded-lg px-4 py-3 text-amber-200 text-sm font-medium animate-fadeIn">
            ✓ {saleFeedback}
          </div>
        )}

        {/* Buy Seeds Section */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800/60 overflow-hidden">
          <div className="p-5 border-b border-slate-800/60 bg-slate-900/70">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Sprout className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-emerald-300">Buy Seeds</h4>
                <p className="text-xs text-slate-400 mt-0.5">Purchase seeds to plant in your fields</p>
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-2 gap-3">
              {validCrops.map((crop) => {
                const price = Math.max(1, Math.floor(5 * seedPriceMultiplier));
                const emoji = CROP_EMOJIS[crop] || '🌱';
                return (
                  <button
                    key={`seed-${crop}`}
                    onClick={() => handleBuySeed(crop, price)}
                    className="group relative overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-900/60 hover:from-emerald-900/30 hover:to-emerald-950/30 border border-slate-700/50 hover:border-emerald-600/50 rounded-xl p-4 transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/10"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-3xl">{emoji}</div>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-semibold text-slate-200 capitalize group-hover:text-emerald-200 transition-colors">
                          {crop} Seeds
                        </div>
                        <div className="text-xs text-slate-500 group-hover:text-slate-400">
                          Plant in fields
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 rounded-lg">
                        <HandCoins className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-sm font-bold text-emerald-300">{price}¢</span>
                      </div>
                      <div className="text-xs text-slate-500 group-hover:text-emerald-400 transition-colors">
                        Click to buy →
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sell Harvest Section */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800/60 overflow-hidden flex-1">
          <div className="p-5 border-b border-slate-800/60 bg-slate-900/70">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Wheat className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-amber-300">Sell Harvest</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Convert your crops to coins</p>
                </div>
              </div>
              {totalHarvestUnits > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-900/40 rounded-lg border border-amber-700/40">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-semibold text-amber-300">{totalHarvestValue}¢ total</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-5 overflow-y-auto max-h-96">
            {Object.keys(harvestLedger).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 bg-slate-800/50 rounded-full mb-4">
                  <Wheat className="w-8 h-8 text-slate-600" />
                </div>
                <div className="text-base font-medium text-slate-400 mb-2">No Harvest Yet</div>
                <div className="text-sm text-slate-500 max-w-sm">
                  Harvest mature fields to add produce here. Once you have crops, you can sell them for coins.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(harvestLedger).map(([crop, qty]) => {
                  const pricePer = 3;
                  const total = qty * pricePer;
                  const emoji = CROP_EMOJIS[crop] || '🌾';
                  return (
                    <div
                      key={`sell-${crop}`}
                      className="group bg-gradient-to-br from-slate-800/60 to-slate-900/60 hover:from-amber-900/20 hover:to-amber-950/20 border border-slate-700/50 hover:border-amber-600/50 rounded-xl p-4 transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/10"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-4xl">{emoji}</div>
                          <div>
                            <div className="text-base font-semibold text-slate-200 capitalize mb-1">
                              {crop}
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <span className="text-slate-400">Quantity:</span>
                              <span className="font-semibold text-amber-300">{qty} units</span>
                              <span className="text-slate-500">×</span>
                              <span className="text-slate-400">{pricePer}¢ each</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-xs text-slate-500 mb-1">Total Value</div>
                            <div className="text-2xl font-bold text-amber-300">{total}¢</div>
                          </div>
                          <button
                            onClick={() => handleSellCrop(crop, qty, total)}
                            className="px-5 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-lg font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                          >
                            Sell All
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Market Info */}
      <div className="w-80 flex-shrink-0 space-y-4">
        <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl p-5 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-4">
            <Store className="w-5 h-5 text-slate-400" />
            <h4 className="text-base font-semibold text-slate-200">Market Prices</h4>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
              <span className="text-sm text-slate-400">Seeds</span>
              <span className="text-sm font-semibold text-emerald-400">{Math.max(1, Math.floor(5 * seedPriceMultiplier))}¢</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
              <span className="text-sm text-slate-400">Crops (per unit)</span>
              <span className="text-sm font-semibold text-amber-400">3¢</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-400">Market Status</span>
              <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full font-semibold">Open</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-900/30 to-blue-950/30 rounded-xl p-5 border border-blue-700/30">
          <h4 className="text-sm font-semibold text-blue-300 mb-3">💡 Trading Tips</h4>
          <ul className="space-y-2 text-xs text-slate-400">
            <li className="flex gap-2">
              <span className="text-blue-400">•</span>
              <span>Plant seeds in Spring for best yields</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-400">•</span>
              <span>Harvest crops when they reach 100% health</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-400">•</span>
              <span>Sell harvest during peak seasons for profit</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-400">•</span>
              <span>Keep seeds in stock for next planting</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FarmTradeTab;
