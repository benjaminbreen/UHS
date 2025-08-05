import { HistoricalEra, Season, GameDate } from '../types';

export interface ParsedDateInfo {
  year: number;
  era: HistoricalEra;
  century: number;
  decade?: number;
  isBC: boolean;
}

export function parseDateString(dateStr: string): ParsedDateInfo {
  dateStr = dateStr.trim().toLowerCase();
  let year = parseInt(dateStr, 10);

  // If direct parsing fails, it's likely a formatted string like "Month Day, Year (Season)" or contains "bc".
  if (isNaN(year)) {
    const numbers = dateStr.match(/-?\d+/g);
    if (numbers && numbers.length > 0) {
      // The year is usually the last number in the string.
      year = parseInt(numbers[numbers.length - 1], 10);
    }
  }
  
  // Handle "bc" explicitly if it was part of the original string (e.g., "200 bc")
  if (dateStr.includes('bc') && year > 0) {
      year = -year;
  }
  
  if (isNaN(year)) { // Fallback if year could not be determined
    year = 1900;
  }

  const isBC = year < 0;

  let era: HistoricalEra;
  if (year >= 2020) {
    era = HistoricalEra.FUTURE_ERA;
  } else if (year >= 1900) {
    era = HistoricalEra.MODERN_ERA;
  } else if (year >= 1700) {
    era = HistoricalEra.INDUSTRIAL_ERA;
  } else if (year >= 1400) {
    era = HistoricalEra.RENAISSANCE_EARLY_MODERN;
  } else if (year >= 500) {
    era = HistoricalEra.MEDIEVAL;
  } else if (year >= -3000) {
    era = HistoricalEra.ANTIQUITY;
  } else {
    era = HistoricalEra.PREHISTORY;
  }

  const century = Math.ceil(Math.abs(year) / 100) * (isBC ? -1 : 1);
  let decade: number | undefined = undefined;
  if (year >= 1880 && !isBC) {
    decade = Math.floor(year / 10) * 10;
  }

  return {
    year,
    era,
    century,
    decade,
    isBC,
  };
}

export const isLeapYear = (year: number): boolean => {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
};

export const getDaysInMonth = (year: number, month: number): number => {
    const days = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return days[month - 1];
};

export const formatDateWithSeason = (date: GameDate, season: Season): string => {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    if (date.month < 1 || date.month > 12) {
        return "Invalid Date";
    }
    const capitalizedSeason = season.charAt(0).toUpperCase() + season.slice(1);

    if (date.year < 0) {
        return `${monthNames[date.month - 1]} ${date.day}, ${Math.abs(date.year)} BC (${capitalizedSeason})`;
    }

    return `${monthNames[date.month - 1]} ${date.day}, ${date.year} (${capitalizedSeason})`;
};
