/**
 * services/marketVolatilityService.ts - Market volatility and trends system
 * Simulates realistic market fluctuations, price volatility, and long-term trends
 */

import { CulturalMarketGood } from './culturalMarketplaceService';
import { HistoricalEra, CulturalZone, BiomeType, ClimateType, MapData, NpcEntity } from '../types';

export interface MarketTrend {
  goodId: string;
  direction: 'bullish' | 'bearish' | 'stable';
  strength: number; // 0-1 (1 = strong trend)
  duration: number; // days remaining
  catalyst: string; // reason for trend
  volatility: number; // 0-1 (1 = highly volatile)
}

export interface VolatilityEvent {
  type: 'shortage' | 'surplus' | 'speculation' | 'panic' | 'boom' | 'crash';
  goodCategory: string;
  intensity: number; // 0-1
  description: string;
  duration: number; // hours
  priceMultiplier: number;
}

export interface MarketCycle {
  phase: 'expansion' | 'peak' | 'contraction' | 'trough';
  daysInPhase: number;
  phaseDuration: number; // typical duration for this phase
  economicHealth: number; // 0-1
  description: string;
}

export class MarketVolatilityService {
  private trends: Map<string, MarketTrend> = new Map();
  private volatilityEvents: VolatilityEvent[] = [];
  private marketCycle: MarketCycle;
  private priceHistory: Map<string, number[]> = new Map(); // last 30 days of prices
  private lastUpdateDay: number = 0;

  constructor() {
    // Initialize with expansion phase
    this.marketCycle = {
      phase: 'expansion',
      daysInPhase: 0,
      phaseDuration: 180 + Math.random() * 120, // 6-10 months
      economicHealth: 0.6 + Math.random() * 0.3,
      description: 'Markets are growing with increasing trade activity'
    };
  }

  /**
   * Update market volatility and trends
   */
  updateMarketVolatility(
    marketplace: CulturalMarketGood[],
    mapData: MapData,
    npcs: NpcEntity[],
    gameTimeHours: number,
    culturalZone: CulturalZone,
    era: HistoricalEra,
    climate: ClimateType
  ): {
    updatedMarketplace: CulturalMarketGood[];
    trends: MarketTrend[];
    volatilityEvents: VolatilityEvent[];
    marketCycle: MarketCycle;
  } {
    const currentDay = Math.floor(gameTimeHours / 24);
    
    // Only update once per day
    if (currentDay !== this.lastUpdateDay) {
      this.updateMarketCycle(currentDay);
      this.updateTrends(marketplace, mapData, npcs, culturalZone, era, climate);
      this.generateVolatilityEvents(marketplace, currentDay, culturalZone, era);
      this.lastUpdateDay = currentDay;
    }

    // Apply trends and volatility to prices
    const updatedMarketplace = this.applyVolatilityToMarketplace(marketplace, gameTimeHours);
    
    // Update price history
    this.updatePriceHistory(updatedMarketplace);

    return {
      updatedMarketplace,
      trends: Array.from(this.trends.values()),
      volatilityEvents: this.volatilityEvents.filter(e => e.duration > 0),
      marketCycle: this.marketCycle
    };
  }

  private updateMarketCycle(currentDay: number): void {
    this.marketCycle.daysInPhase++;

    // Check if we should transition to next phase
    if (this.marketCycle.daysInPhase >= this.marketCycle.phaseDuration) {
      this.transitionMarketCycle();
    }

    // Natural fluctuations in economic health
    const healthChange = (Math.random() - 0.5) * 0.05; // ±2.5% per day
    this.marketCycle.economicHealth = Math.max(0.1, Math.min(0.9, 
      this.marketCycle.economicHealth + healthChange
    ));
  }

  private transitionMarketCycle(): void {
    const transitions: Record<string, string> = {
      'expansion': 'peak',
      'peak': 'contraction', 
      'contraction': 'trough',
      'trough': 'expansion'
    };

    this.marketCycle.phase = transitions[this.marketCycle.phase] as any;
    this.marketCycle.daysInPhase = 0;
    
    // Set new phase duration based on historical patterns
    switch (this.marketCycle.phase) {
      case 'expansion':
        this.marketCycle.phaseDuration = 180 + Math.random() * 180; // 6-12 months
        this.marketCycle.description = 'Economic growth drives market expansion';
        break;
      case 'peak':
        this.marketCycle.phaseDuration = 30 + Math.random() * 60; // 1-3 months
        this.marketCycle.description = 'Markets reach peak values with high activity';
        break;
      case 'contraction':
        this.marketCycle.phaseDuration = 90 + Math.random() * 90; // 3-6 months
        this.marketCycle.description = 'Economic slowdown affects trade volumes';
        break;
      case 'trough':
        this.marketCycle.phaseDuration = 60 + Math.random() * 60; // 2-4 months
        this.marketCycle.description = 'Markets stabilize at lower levels';
        break;
    }
  }

  private updateTrends(
    marketplace: CulturalMarketGood[],
    mapData: MapData,
    npcs: NpcEntity[],
    culturalZone: CulturalZone,
    era: HistoricalEra,
    climate: ClimateType
  ): void {
    // Age existing trends
    for (const [goodId, trend] of this.trends.entries()) {
      trend.duration--;
      if (trend.duration <= 0) {
        this.trends.delete(goodId);
      } else {
        // Trends weaken over time
        trend.strength *= 0.98;
      }
    }

    // Generate new trends
    marketplace.forEach(good => {
      if (!this.trends.has(good.id) && Math.random() < 0.05) { // 5% chance per day
        this.generateTrend(good, mapData, npcs, culturalZone, era, climate);
      }
    });
  }

  private generateTrend(
    good: CulturalMarketGood,
    mapData: MapData,
    npcs: NpcEntity[],
    culturalZone: CulturalZone,
    era: HistoricalEra,
    climate: ClimateType
  ): void {
    const catalysts: Array<{condition: () => boolean, trend: Partial<MarketTrend>}> = [
      {
        condition: () => good.category === 'food' && ['FARMLAND'].some(b => mapData.biomeStats?.[b as BiomeType] > 0.3),
        trend: {
          direction: 'bearish',
          catalyst: 'Abundant local harvests flood the market',
          strength: 0.6 + Math.random() * 0.3,
          duration: 30 + Math.random() * 60
        }
      },
      {
        condition: () => good.category === 'medicine' && npcs.filter(n => n.health < 50).length > npcs.length * 0.2,
        trend: {
          direction: 'bullish',
          catalyst: 'Disease outbreak increases demand for medicines',
          strength: 0.7 + Math.random() * 0.3,
          duration: 20 + Math.random() * 40
        }
      },
      {
        condition: () => good.category === 'metal' && era >= HistoricalEra.INDUSTRIAL_ERA,
        trend: {
          direction: 'bullish',
          catalyst: 'Industrial development drives metal demand',
          strength: 0.5 + Math.random() * 0.4,
          duration: 90 + Math.random() * 180
        }
      },
      {
        condition: () => good.category === 'luxury' && this.marketCycle.phase === 'expansion',
        trend: {
          direction: 'bullish',
          catalyst: 'Economic prosperity increases luxury spending',
          strength: 0.4 + Math.random() * 0.4,
          duration: 60 + Math.random() * 120
        }
      },
      {
        condition: () => good.category === 'textile' && culturalZone === 'EAST_ASIAN',
        trend: {
          direction: 'bullish',
          catalyst: 'Silk road trade routes boost textile prices',
          strength: 0.6 + Math.random() * 0.3,
          duration: 45 + Math.random() * 90
        }
      },
      {
        condition: () => good.category === 'spice' && culturalZone === 'MENA',
        trend: {
          direction: 'bullish',
          catalyst: 'Strategic location on spice routes drives demand',
          strength: 0.7 + Math.random() * 0.3,
          duration: 60 + Math.random() * 120
        }
      }
    ];

    // Find applicable catalyst or create random trend
    const applicableCatalyst = catalysts.find(c => c.condition());
    const trendData = applicableCatalyst?.trend || {
      direction: Math.random() < 0.5 ? 'bullish' : 'bearish',
      catalyst: 'Market sentiment shifts due to trader speculation',
      strength: 0.3 + Math.random() * 0.4,
      duration: 15 + Math.random() * 45
    };

    const trend: MarketTrend = {
      goodId: good.id,
      direction: trendData.direction as any,
      strength: trendData.strength!,
      duration: trendData.duration!,
      catalyst: trendData.catalyst!,
      volatility: 0.1 + Math.random() * 0.3
    };

    this.trends.set(good.id, trend);
  }

  private generateVolatilityEvents(
    marketplace: CulturalMarketGood[],
    currentDay: number,
    culturalZone: CulturalZone,
    era: HistoricalEra
  ): void {
    // Remove expired events
    this.volatilityEvents = this.volatilityEvents.filter(e => {
      e.duration -= 24; // 24 hours per day
      return e.duration > 0;
    });

    // Generate new volatility events (rare)
    if (Math.random() < 0.02) { // 2% chance per day
      const eventTypes = [
        {
          type: 'shortage' as const,
          category: 'food',
          description: 'Poor harvest creates food shortages',
          multiplier: 1.5 + Math.random() * 0.8,
          duration: 48 + Math.random() * 96
        },
        {
          type: 'surplus' as const,
          category: 'textile',
          description: 'Merchant caravan brings surplus goods',
          multiplier: 0.6 + Math.random() * 0.3,
          duration: 24 + Math.random() * 48
        },
        {
          type: 'speculation' as const,
          category: 'luxury',
          description: 'Rumors of nobility visits spark speculation',
          multiplier: 1.3 + Math.random() * 0.5,
          duration: 12 + Math.random() * 36
        },
        {
          type: 'panic' as const,
          category: 'medicine',
          description: 'Disease fears cause panic buying',
          multiplier: 2.0 + Math.random() * 1.0,
          duration: 6 + Math.random() * 18
        }
      ];

      // Add era-specific events
      if (era >= HistoricalEra.RENAISSANCE_EARLY_MODERN) {
        eventTypes.push({
          type: 'boom' as const,
          category: 'metal',
          description: 'New World silver influx affects metal markets',
          multiplier: 0.7 + Math.random() * 0.2,
          duration: 168 + Math.random() * 336 // 1-2 weeks
        });
      }

      if (era >= HistoricalEra.INDUSTRIAL_ERA) {
        eventTypes.push({
          type: 'crash' as const,
          category: 'textile',
          description: 'Factory overproduction crashes textile prices',
          multiplier: 0.3 + Math.random() * 0.3,
          duration: 72 + Math.random() * 168
        });
      }

      const selectedEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
      const volatilityEvent: VolatilityEvent = {
        type: selectedEvent.type,
        goodCategory: selectedEvent.category,
        intensity: 0.5 + Math.random() * 0.5,
        description: selectedEvent.description,
        duration: selectedEvent.duration,
        priceMultiplier: selectedEvent.multiplier
      };

      this.volatilityEvents.push(volatilityEvent);
    }
  }

  private applyVolatilityToMarketplace(
    marketplace: CulturalMarketGood[],
    gameTimeHours: number
  ): CulturalMarketGood[] {
    return marketplace.map(good => {
      let volatilityMultiplier = 1.0;
      let trendMultiplier = 1.0;
      let cycleMultiplier = 1.0;

      // Apply market cycle effects
      switch (this.marketCycle.phase) {
        case 'expansion':
          cycleMultiplier = 0.95 + (this.marketCycle.economicHealth * 0.15); // 0.95-1.1
          break;
        case 'peak':
          cycleMultiplier = 1.05 + (this.marketCycle.economicHealth * 0.15); // 1.05-1.2
          break;
        case 'contraction':
          cycleMultiplier = 1.05 - (this.marketCycle.economicHealth * 0.15); // 0.9-1.05
          break;
        case 'trough':
          cycleMultiplier = 0.85 + (this.marketCycle.economicHealth * 0.1); // 0.85-0.95
          break;
      }

      // Apply trends
      const trend = this.trends.get(good.id);
      if (trend) {
        const trendEffect = trend.strength * (trend.direction === 'bullish' ? 1 : -1);
        trendMultiplier = 1 + (trendEffect * 0.3); // ±30% max from trends
        
        // Add volatility noise
        const noise = (Math.random() - 0.5) * trend.volatility * 0.1;
        trendMultiplier += noise;
      }

      // Apply volatility events
      for (const event of this.volatilityEvents) {
        if (good.category === event.goodCategory) {
          volatilityMultiplier *= event.priceMultiplier;
        }
      }

      // Random daily price fluctuations (small)
      const dailyNoise = 0.98 + (Math.random() * 0.04); // ±2%

      const finalMultiplier = volatilityMultiplier * trendMultiplier * cycleMultiplier * dailyNoise;
      
      return {
        ...good,
        basePrice: Math.max(1, Math.round(good.basePrice * finalMultiplier)),
        volatilityInfo: {
          trend: trend ? `${trend.direction} (${Math.round(trend.strength * 100)}%)` : 'stable',
          events: this.volatilityEvents
            .filter(e => e.goodCategory === good.category)
            .map(e => e.description),
          cyclePhase: this.marketCycle.phase,
          priceChange: Math.round((finalMultiplier - 1) * 100)
        }
      };
    });
  }

  private updatePriceHistory(marketplace: CulturalMarketGood[]): void {
    marketplace.forEach(good => {
      if (!this.priceHistory.has(good.id)) {
        this.priceHistory.set(good.id, []);
      }
      
      const history = this.priceHistory.get(good.id)!;
      history.push(good.basePrice);
      
      // Keep only last 30 days
      if (history.length > 30) {
        history.shift();
      }
    });
  }

  /**
   * Get price chart data for a specific good
   */
  getPriceHistory(goodId: string): number[] {
    return this.priceHistory.get(goodId) || [];
  }

  /**
   * Get market analysis for display
   */
  getMarketAnalysis(): {
    cycle: MarketCycle;
    activeEvents: VolatilityEvent[];
    trendingGoods: { bullish: MarketTrend[]; bearish: MarketTrend[] };
  } {
    const trends = Array.from(this.trends.values());
    
    return {
      cycle: this.marketCycle,
      activeEvents: this.volatilityEvents.filter(e => e.duration > 0),
      trendingGoods: {
        bullish: trends.filter(t => t.direction === 'bullish').sort((a, b) => b.strength - a.strength),
        bearish: trends.filter(t => t.direction === 'bearish').sort((a, b) => b.strength - a.strength)
      }
    };
  }

  /**
   * Force a volatility event for testing
   */
  triggerVolatilityEvent(event: Omit<VolatilityEvent, 'duration'>): void {
    this.volatilityEvents.push({
      ...event,
      duration: 24 // 24 hours default
    });
  }
}

export const marketVolatilityService = new MarketVolatilityService();