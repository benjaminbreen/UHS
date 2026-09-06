/** Astronomical internal numbering: year 0 is displayed as 1 BCE. */
export function formatHistoricalYear(year: number) {
  if (!Number.isInteger(year))
    throw Error("A historical year must be an integer.");
  return year > 0 ? `${year} CE` : `${1 - year} BCE`;
}
