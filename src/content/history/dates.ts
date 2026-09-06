import { formatHistoricalYear } from "../../core/calendar";

/** Proleptic Gregorian comparison; astronomical years (0 = 1 BCE).
 * Omitted month/day anchor at January 1 / first of month. Evidence precision is
 * recorded separately: a year-only query is a point, not the whole uncertain year. */
export type HistoricalDate = { year: number; month?: number; day?: number };
export type DateRange = { start?: HistoricalDate; end?: HistoricalDate };
export const bce = (year: number): HistoricalDate => {
  if (!Number.isSafeInteger(year) || year < 1) throw Error("Invalid BCE year");
  return { year: 1 - year };
};
export function dateKey(date: HistoricalDate): number {
  const { year, month = 1, day = 1 } = date;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (
    !Number.isSafeInteger(year) ||
    Math.abs(year) > 10_000_000 ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12 ||
    !Number.isInteger(day) ||
    day < 1 ||
    day > days[month - 1] ||
    (date.day !== undefined && date.month === undefined)
  )
    throw Error("Invalid historical date");
  // An ordering key, deliberately not elapsed days or a JavaScript Date.
  return year * 372 + (month - 1) * 31 + day - 1;
}
export function validateRange(range: DateRange) {
  const start = range.start ? dateKey(range.start) : -Infinity;
  const end = range.end ? dateKey(range.end) : Infinity;
  if (start >= end) throw Error("Historical range must have start < end");
}
export function containsDate(range: DateRange, date: HistoricalDate) {
  validateRange(range);
  const key = dateKey(date);
  return (
    (!range.start || key >= dateKey(range.start)) &&
    (!range.end || key < dateKey(range.end))
  );
}
export function formatDate(date: HistoricalDate) {
  dateKey(date);
  const detail =
    date.month === undefined
      ? ""
      : ` · ${date.month}${date.day === undefined ? "" : `/${date.day}`}`;
  return formatHistoricalYear(date.year) + detail;
}

/** Permanent chronological IDs; labels are not worldwide technology stages. */
export const eras = [
  {
    id: "deep-prehistory",
    label: "Deep prehistory",
    start: undefined,
    end: bce(10000),
    sample: bce(15000),
  },
  {
    id: "early-holocene",
    label: "Early Holocene",
    start: bce(10000),
    end: bce(3500),
    sample: bce(6500),
  },
  {
    id: "early-historical",
    label: "Later prehistory / early historical periods",
    start: bce(3500),
    end: bce(1000),
    sample: bce(2000),
  },
  {
    id: "antiquity",
    label: "Antiquity",
    start: bce(1000),
    end: { year: 500 },
    sample: { year: 100 },
  },
  {
    id: "early-middle",
    label: "Early middle periods",
    start: { year: 500 },
    end: { year: 1000 },
    sample: { year: 750 },
  },
  {
    id: "later-middle",
    label: "Later middle periods",
    start: { year: 1000 },
    end: { year: 1500 },
    sample: { year: 1250 },
  },
  {
    id: "early-modern",
    label: "Early modern",
    start: { year: 1500 },
    end: { year: 1750 },
    sample: { year: 1650 },
  },
  {
    id: "1750-1850",
    label: "1750–1850",
    start: { year: 1750 },
    end: { year: 1850 },
    sample: { year: 1800 },
  },
  {
    id: "1850-1914",
    label: "1850–1914",
    start: { year: 1850 },
    end: { year: 1914 },
    sample: { year: 1900 },
  },
  {
    id: "1914-1945",
    label: "1914–1945",
    start: { year: 1914 },
    end: { year: 1945 },
    sample: { year: 1920 },
  },
  {
    id: "1945-1990",
    label: "1945–1990",
    start: { year: 1945 },
    end: { year: 1990 },
    sample: { year: 1960 },
  },
  {
    id: "contemporary",
    label: "Contemporary",
    start: { year: 1990 },
    end: undefined,
    sample: { year: 2000 },
  },
] as const;
export type EraId = (typeof eras)[number]["id"];
export function eraAt(date: HistoricalDate) {
  dateKey(date);
  return eras.find((era) => containsDate(era, date))!;
}
