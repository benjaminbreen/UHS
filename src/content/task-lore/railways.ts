import type { TaskLore } from "./types";

const RAIL = [{ trade: /railway|platelayer|on the line/i }];

export const railwayLore: TaskLore[] = [
  {
    id: "lore.rail.platelayers-britain",
    scope: { years: [1830, 1970], bounds: [-8, 49.5, 2, 59] },
    topics: RAIL,
    evidence: "documented",
    title: "Platelayers and the ganger",
    text: "British railways kept their track with gangs of platelayers, five or six men under a ganger, each gang answerable for a length of a few miles. They walked it every day, knocking home the wooden keys that held the rails in their chairs, packing ballast under sleepers that had sunk, renewing worn rails and clearing the drains. It was among the worst-paid work on the railway, around a pound a week in 1900, and among the most dangerous: men working on lines still in use were struck by trains year after year, and a lookout with a horn or flag became the rule. Many gangs lived in company cottages beside their length.",
    wiki: ["Platelayer", "Permanent way (history)"],
  },
  {
    id: "lore.rail.indies",
    scope: { years: [1864, 10001], bounds: [95, -11, 141, 7] },
    topics: RAIL,
    evidence: "documented",
    title: "Rail gangs in Java and beyond",
    text: "The first railway in the Netherlands Indies, inland from Semarang, was begun in 1864 by a private company, the NIS; the state railway, the Staatsspoorwegen, followed from 1875, and lines spread across Java and into Sumatra. Track was laid and kept by gangs of labourers, many hired by the day, under a mandor, a foreman who recruited the men, set the pace and often kept a share of their pay. After independence the lines passed to the national railway, today Kereta Api Indonesia, whose track gangs still walk the line checking sleepers, fastenings and ballast.",
    wiki: ["Rail transport in Indonesia", "Nederlandsch-Indische Spoorweg Maatschappij", "Staatsspoorwegen"],
  },
  {
    id: "lore.rail.section-gangs",
    scope: { years: [1830, 1980], bounds: [-170, 15, -50, 72] },
    topics: RAIL,
    evidence: "documented",
    title: "Section gangs",
    text: "North American railroads were kept by section gangs: a handful of section hands under a section boss, each gang with its own stretch of line, often six to ten miles, and a handcar to reach it. They lifted and lined the rails with bars, tamped ballast under the ties and replaced rotten ties by hand; the work songs that kept their bars in time gave them the nickname gandy dancers. The gangs were the railroad's cheapest labour and changed with immigration: Irish, then Chinese on the Central Pacific, and across the Southwest Mexican traqueros, who lived with their families in section houses and boxcars beside the track.",
    wiki: ["Gandy dancer", "Traquero"],
  },
  {
    id: "lore.rail.track",
    scope: { years: [1825, 10001] },
    topics: RAIL,
    evidence: "documented",
    title: "Keeping the track",
    text: "Wherever railways ran, the track needed constant hands. Passing trains loosened fastenings and pressed sleepers down into the ballast, rain washed it out, and heat and frost moved the rails. Gangs of labourers walked a stretch of line each day, packing crushed stone back under the sleepers, renewing sleepers and fastenings and keeping the drains clear, until machines took over most of the heavy tamping after the middle of the twentieth century. The work was hard, badly paid and dangerous: everywhere railways ran, men working on lines still in use were struck by trains.",
    wiki: ["Track ballast", "Railroad tie"],
  },
];
