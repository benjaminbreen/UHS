import type { PlayerCharacter } from '../types';

type LegacyCurrencyShape = {
  currency?: number;
  money?: number;
  wealth?: number;
};

export const getPlayerCurrency = (player: LegacyCurrencyShape | null | undefined): number => {
  if (!player) return 0;

  const rawCurrency =
    typeof player.currency === 'number' ? player.currency :
    typeof player.money === 'number' ? player.money :
    typeof player.wealth === 'number' ? player.wealth :
    0;

  if (!Number.isFinite(rawCurrency)) return 0;
  return Math.max(0, rawCurrency);
};

export const normalizePlayerCurrency = <T extends PlayerCharacter | Record<string, any> | null | undefined>(
  player: T
): T => {
  if (!player || typeof player !== 'object') return player;

  const normalizedCurrency = getPlayerCurrency(player as LegacyCurrencyShape);

  if ((player as LegacyCurrencyShape).currency === normalizedCurrency) {
    return player;
  }

  return {
    ...player,
    currency: normalizedCurrency
  } as T;
};
