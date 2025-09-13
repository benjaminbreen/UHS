/**
 * Price History Service
 * Tracks historical market prices for analysis and comparison
 */

import { TradeGood } from './tradeService';

export interface PriceSnapshot {
  marketId: string;
  timestamp: number;
  date: { year: number; month: number; day: number };
  items: Map<string, ItemPriceData>;
  marketConditions?: {
    activeCrises: string[];
    volatilityLevel: number;
    marketCycle: string;
  };
}

export interface ItemPriceData {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  quality: string;
  origin: string;
  events: string[]; // Active events affecting this item
  priceChange?: number; // Percentage change from last snapshot
  volatility?: number; // Price volatility score
}

export interface PriceComparison {
  itemId: string;
  name: string;
  currentPrice: number;
  previousPrice?: number;
  priceChange?: number;
  percentChange?: number;
  trend: 'up' | 'down' | 'stable';
  lastVisitPrice?: number;
  sinceLastVisit?: number;
  historicalAverage?: number;
  deviationFromAverage?: number;
}

export interface MarketTrend {
  period: string; // '1d', '7d', '30d'
  overallTrend: 'bull' | 'bear' | 'stable';
  averagePriceChange: number;
  mostVolatile: string[]; // Item IDs
  mostStable: string[]; // Item IDs
  crisisImpact?: {
    crisis: string;
    priceImpact: number;
    affectedItems: string[];
  };
}

class PriceHistoryService {
  private priceHistory: Map<string, PriceSnapshot[]> = new Map();
  private lastVisitTimestamps: Map<string, number> = new Map();
  private readonly STORAGE_KEY = 'market_price_history';
  private readonly LAST_VISIT_KEY = 'market_last_visits';
  private readonly MAX_HISTORY_DAYS = 30;
  private readonly SNAPSHOT_INTERVAL = 86400000; // 24 hours in ms

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Record a price snapshot for a market
   */
  recordSnapshot(
    marketId: string,
    items: TradeGood[],
    gameDate: { year: number; month: number; day: number },
    marketConditions?: any
  ): void {
    const now = Date.now();
    
    // Check if enough time has passed since last snapshot
    const history = this.priceHistory.get(marketId) || [];
    if (history.length > 0) {
      const lastSnapshot = history[history.length - 1];
      if (now - lastSnapshot.timestamp < this.SNAPSHOT_INTERVAL) {
        return; // Too soon for another snapshot
      }
    }
    
    // Create new snapshot
    const itemsMap = new Map<string, ItemPriceData>();
    items.forEach(item => {
      const previousData = this.getPreviousItemData(marketId, item.itemId);
      const priceChange = previousData 
        ? ((item.currentPrice - previousData.price) / previousData.price) * 100
        : 0;
      
      itemsMap.set(item.itemId, {
        itemId: item.itemId,
        name: item.name,
        price: item.currentPrice,
        quantity: item.quantity,
        quality: item.quality || 'standard',
        origin: item.origin || 'local',
        events: (item as any).crisisAffected ? ['crisis'] : [],
        priceChange,
        volatility: this.calculateVolatility(marketId, item.itemId, item.currentPrice)
      });
    });
    
    const snapshot: PriceSnapshot = {
      marketId,
      timestamp: now,
      date: gameDate,
      items: itemsMap,
      marketConditions: marketConditions ? {
        activeCrises: marketConditions.activeCrises || [],
        volatilityLevel: marketConditions.volatilityLevel || 0,
        marketCycle: marketConditions.marketCycle || 'stable'
      } : undefined
    };
    
    // Add to history
    history.push(snapshot);
    
    // Trim old snapshots
    this.trimHistory(history);
    
    this.priceHistory.set(marketId, history);
    this.saveToStorage();
    
    console.log(`[PriceHistory] Recorded snapshot for ${marketId} with ${items.length} items`);
  }

  /**
   * Mark a market visit
   */
  markMarketVisit(marketId: string): void {
    this.lastVisitTimestamps.set(marketId, Date.now());
    this.saveToStorage();
  }

  /**
   * Get price comparison for current market
   */
  getPriceComparisons(
    marketId: string,
    currentItems: TradeGood[]
  ): PriceComparison[] {
    const history = this.priceHistory.get(marketId) || [];
    const lastVisit = this.lastVisitTimestamps.get(marketId);
    const comparisons: PriceComparison[] = [];
    
    currentItems.forEach(item => {
      const comparison: PriceComparison = {
        itemId: item.itemId,
        name: item.name,
        currentPrice: item.currentPrice,
        trend: 'stable'
      };
      
      // Get previous price
      if (history.length > 0) {
        const lastSnapshot = history[history.length - 1];
        const previousData = lastSnapshot.items.get(item.itemId);
        if (previousData) {
          comparison.previousPrice = previousData.price;
          comparison.priceChange = item.currentPrice - previousData.price;
          comparison.percentChange = (comparison.priceChange / previousData.price) * 100;
          comparison.trend = comparison.priceChange > 0 ? 'up' : 
                            comparison.priceChange < 0 ? 'down' : 'stable';
        }
      }
      
      // Get price at last visit
      if (lastVisit) {
        const visitSnapshot = this.getSnapshotNearTimestamp(marketId, lastVisit);
        if (visitSnapshot) {
          const visitData = visitSnapshot.items.get(item.itemId);
          if (visitData) {
            comparison.lastVisitPrice = visitData.price;
            comparison.sinceLastVisit = item.currentPrice - visitData.price;
          }
        }
      }
      
      // Calculate historical average
      if (history.length >= 3) {
        const prices = history
          .map(s => s.items.get(item.itemId)?.price)
          .filter(p => p !== undefined) as number[];
        
        if (prices.length > 0) {
          comparison.historicalAverage = prices.reduce((a, b) => a + b, 0) / prices.length;
          comparison.deviationFromAverage = 
            ((item.currentPrice - comparison.historicalAverage) / comparison.historicalAverage) * 100;
        }
      }
      
      comparisons.push(comparison);
    });
    
    return comparisons;
  }

  /**
   * Get market trends analysis
   */
  getMarketTrends(marketId: string, period: '1d' | '7d' | '30d' = '7d'): MarketTrend {
    const history = this.priceHistory.get(marketId) || [];
    const now = Date.now();
    const periodMs = period === '1d' ? 86400000 : 
                    period === '7d' ? 604800000 : 
                    2592000000;
    
    const relevantSnapshots = history.filter(s => now - s.timestamp <= periodMs);
    
    if (relevantSnapshots.length < 2) {
      return {
        period,
        overallTrend: 'stable',
        averagePriceChange: 0,
        mostVolatile: [],
        mostStable: []
      };
    }
    
    // Calculate price changes for all items
    const itemChanges = new Map<string, number[]>();
    const itemVolatility = new Map<string, number>();
    
    for (let i = 1; i < relevantSnapshots.length; i++) {
      const prev = relevantSnapshots[i - 1];
      const curr = relevantSnapshots[i];
      
      curr.items.forEach((itemData, itemId) => {
        const prevData = prev.items.get(itemId);
        if (prevData) {
          const change = ((itemData.price - prevData.price) / prevData.price) * 100;
          const changes = itemChanges.get(itemId) || [];
          changes.push(change);
          itemChanges.set(itemId, changes);
        }
      });
    }
    
    // Calculate volatility and average changes
    let totalChange = 0;
    let itemCount = 0;
    
    itemChanges.forEach((changes, itemId) => {
      const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
      totalChange += avgChange;
      itemCount++;
      
      // Calculate standard deviation as volatility measure
      const variance = changes.reduce((sum, change) => 
        sum + Math.pow(change - avgChange, 2), 0) / changes.length;
      const volatility = Math.sqrt(variance);
      itemVolatility.set(itemId, volatility);
    });
    
    const averagePriceChange = itemCount > 0 ? totalChange / itemCount : 0;
    
    // Sort items by volatility
    const volatilityArray = Array.from(itemVolatility.entries())
      .sort((a, b) => b[1] - a[1]);
    
    const mostVolatile = volatilityArray.slice(0, 3).map(([id]) => id);
    const mostStable = volatilityArray.slice(-3).map(([id]) => id);
    
    // Determine overall trend
    const overallTrend = averagePriceChange > 5 ? 'bull' :
                        averagePriceChange < -5 ? 'bear' : 'stable';
    
    // Check for crisis impact
    let crisisImpact = undefined;
    const lastSnapshot = relevantSnapshots[relevantSnapshots.length - 1];
    if (lastSnapshot.marketConditions?.activeCrises.length > 0) {
      const crisis = lastSnapshot.marketConditions.activeCrises[0];
      const affectedItems: string[] = [];
      
      lastSnapshot.items.forEach((item, id) => {
        if (item.events.includes('crisis')) {
          affectedItems.push(id);
        }
      });
      
      crisisImpact = {
        crisis,
        priceImpact: averagePriceChange * 1.5, // Rough estimate
        affectedItems
      };
    }
    
    return {
      period,
      overallTrend,
      averagePriceChange,
      mostVolatile,
      mostStable,
      crisisImpact
    };
  }

  /**
   * Get price history for specific item
   */
  getItemPriceHistory(
    marketId: string,
    itemId: string,
    limit: number = 10
  ): Array<{ timestamp: number; price: number; quantity: number }> {
    const history = this.priceHistory.get(marketId) || [];
    const itemHistory: Array<{ timestamp: number; price: number; quantity: number }> = [];
    
    const relevantSnapshots = history.slice(-limit);
    relevantSnapshots.forEach(snapshot => {
      const itemData = snapshot.items.get(itemId);
      if (itemData) {
        itemHistory.push({
          timestamp: snapshot.timestamp,
          price: itemData.price,
          quantity: itemData.quantity
        });
      }
    });
    
    return itemHistory;
  }

  /**
   * Get sparkline data for visualization
   */
  getSparklineData(
    marketId: string,
    itemId: string,
    points: number = 7
  ): number[] {
    const history = this.getItemPriceHistory(marketId, itemId, points);
    return history.map(h => h.price);
  }

  /**
   * Calculate price volatility
   */
  private calculateVolatility(
    marketId: string,
    itemId: string,
    currentPrice: number
  ): number {
    const history = this.getItemPriceHistory(marketId, itemId, 5);
    if (history.length < 2) return 0;
    
    const prices = [...history.map(h => h.price), currentPrice];
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.reduce((sum, price) => 
      sum + Math.pow(price - mean, 2), 0) / prices.length;
    
    return Math.sqrt(variance) / mean; // Coefficient of variation
  }

  /**
   * Get previous item data
   */
  private getPreviousItemData(
    marketId: string,
    itemId: string
  ): ItemPriceData | null {
    const history = this.priceHistory.get(marketId) || [];
    if (history.length === 0) return null;
    
    const lastSnapshot = history[history.length - 1];
    return lastSnapshot.items.get(itemId) || null;
  }

  /**
   * Get snapshot near a timestamp
   */
  private getSnapshotNearTimestamp(
    marketId: string,
    timestamp: number
  ): PriceSnapshot | null {
    const history = this.priceHistory.get(marketId) || [];
    let closest: PriceSnapshot | null = null;
    let minDiff = Infinity;
    
    history.forEach(snapshot => {
      const diff = Math.abs(snapshot.timestamp - timestamp);
      if (diff < minDiff) {
        minDiff = diff;
        closest = snapshot;
      }
    });
    
    return closest;
  }

  /**
   * Trim old history
   */
  private trimHistory(history: PriceSnapshot[]): void {
    const cutoff = Date.now() - (this.MAX_HISTORY_DAYS * 86400000);
    while (history.length > 0 && history[0].timestamp < cutoff) {
      history.shift();
    }
  }

  /**
   * Save to localStorage
   */
  private saveToStorage(): void {
    try {
      // Convert Maps to arrays for serialization
      const historyData = Array.from(this.priceHistory.entries()).map(([key, snapshots]) => ({
        marketId: key,
        snapshots: snapshots.map(s => ({
          ...s,
          items: Array.from(s.items.entries())
        }))
      }));
      
      const visitData = Array.from(this.lastVisitTimestamps.entries());
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(historyData));
      localStorage.setItem(this.LAST_VISIT_KEY, JSON.stringify(visitData));
    } catch (error) {
      console.error('[PriceHistory] Failed to save to storage:', error);
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    try {
      const historyData = localStorage.getItem(this.STORAGE_KEY);
      if (historyData) {
        const parsed = JSON.parse(historyData);
        this.priceHistory = new Map(
          parsed.map((data: any) => [
            data.marketId,
            data.snapshots.map((s: any) => ({
              ...s,
              items: new Map(s.items)
            }))
          ])
        );
      }
      
      const visitData = localStorage.getItem(this.LAST_VISIT_KEY);
      if (visitData) {
        this.lastVisitTimestamps = new Map(JSON.parse(visitData));
      }
    } catch (error) {
      console.error('[PriceHistory] Failed to load from storage:', error);
      this.priceHistory = new Map();
      this.lastVisitTimestamps = new Map();
    }
  }

  /**
   * Clear all history (for testing/reset)
   */
  clearAllHistory(): void {
    this.priceHistory.clear();
    this.lastVisitTimestamps.clear();
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.LAST_VISIT_KEY);
    console.log('[PriceHistory] All history cleared');
  }
}

// Export singleton instance
export const priceHistoryService = new PriceHistoryService();