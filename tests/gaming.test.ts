import { describe, expect, it } from "vitest";
import { augustus, throwBones, throwKind, winners } from "../src/core/games/knucklebones";
import { HOME, urApply, urMoves, urPick, urStart, type UrState } from "../src/core/games/ur";
import { random } from "../src/core/random";
import { openGameFor, tableGameFor } from "../src/content/games";
import { createSettingSession } from "../src/runtime/session";
import { venuesFor } from "../src/content/venues";
import { panelSetting } from "../scripts/review/panel";

describe("knucklebones", () => {
  it("names the throws and lets Aphrodite beat a higher sum", () => {
    expect(throwKind([1, 3, 4, 6])).toBe("best");
    expect(throwKind([1, 1, 1, 1])).toBe("dog");
    expect(winners([[6, 6, 4, 6], [6, 1, 3, 4]])).toEqual([1]);
    expect(winners([[3, 3, 4, 4], [4, 4, 3, 3]])).toEqual([]);
  });
  it("pays a coin per one or six into the pool and Venus takes it", () => {
    expect(augustus([[1, 6, 3, 3], [6, 4, 1, 3], [4, 4, 3, 3]], 5)).toEqual({ pay: [2, 2, 0], take: [0, 9, 0], pot: 0 });
  });
  it("loaded bones throw more sixes", () => {
    let n = 0;
    const rand = () => random("bones", n++);
    const sixes = (loaded: number) => Array.from({ length: 2000 }, () => throwBones(rand, loaded)).flat().filter((s) => s === 6).length;
    expect(sixes(2)).toBeGreaterThan(sixes(0) * 1.8);
  });
});

describe("ur", () => {
  const at = (a: number[], b: number[], turn: 0 | 1 = 0): UrState => ({ pieces: [[...a, ...Array(7 - a.length).fill(0)], [...b, ...Array(7 - b.length).fill(0)]], turn });
  it("takes in the shared row but not on the middle rosette", () => {
    expect(urMoves(at([6], [9]), 3).find((m) => m.from === 6)?.capture).toBe(true);
    expect(urMoves(at([6], [8]), 2).some((m) => m.from === 6)).toBe(false);
    expect(urMoves(at([2], [2]), 1).find((m) => m.from === 2)?.capture).toBe(false);
  });
  it("needs the exact throw to bear off and gives another turn on a rosette", () => {
    expect(urMoves(at([13], []), 3).some((m) => m.from === 13)).toBe(false);
    const m = urMoves(at([13], []), 2).find((x) => x.from === 13)!;
    expect(m.to).toBe(HOME);
    expect(urApply(at([1], []), urMoves(at([1], []), 3).find((x) => x.from === 1)!).turn).toBe(0);
  });
  it("plays a whole game to a winner", () => {
    let s = urStart();
    let n = 0;
    for (let i = 0; i < 2000 && s.winner === undefined; i++) {
      const roll = [0, 1, 2, 3].filter(() => random("ur", n++) < 0.5).length;
      const moves = urMoves(s, roll);
      s = moves.length ? urApply(s, urPick(s, moves)) : { ...s, turn: (1 - s.turn) as 0 | 1 };
    }
    expect(s.winner).toBeDefined();
  });
});

describe("where the tables are", () => {
  const gaming = (place: string, year: number) => venuesFor(panelSetting(place, year), 200).find((v) => v.kind === "gaming-house" && !v.open)?.id;
  it("puts gaming houses where the record has them", () => {
    expect(gaming("alexandria", -332)).toBe("venue.kybeion");
    expect(gaming("rome", 100)).toBe("venue.roman-gaming");
    expect(gaming("kyoto", 1750)).toBe("venue.bakuchi");
    expect(gaming("london", 1700)).toBe("venue.gaming-house");
    expect(gaming("nile", 1500)).toBeUndefined();
  });
  it("picks the game of the place and age", () => {
    expect(tableGameFor(panelSetting("alexandria", -332), "gaming-house")?.id).toBe("knucklebones-greek");
    expect(tableGameFor(panelSetting("rome", 100), "gaming-house")?.id).toBe("knucklebones-roman");
    expect(tableGameFor(panelSetting("mesopotamia", -500), "tavern")?.id).toBe("ur");
    expect(tableGameFor(panelSetting("london", 1700), "gaming-house")).toBeUndefined();
  });
});

describe("street games", () => {
  it("sits idle people down to the local game in the street, and lets the player in", () => {
    expect(openGameFor(panelSetting("london", 1700))).toBeUndefined();
    const e = createSettingSession(panelSetting("alexandria", -244), "games");
    const noon = Math.floor(e.state.clock / 86400) * 86400 + 11 * 3600;
    e.advance(noon - e.state.clock);
    let circle;
    for (let i = 0; i < 12 && !(circle = e.gameCircles().find((c) => c.players.every((a) => a.pos.x === a.errand!.to.x && a.pos.y === a.errand!.to.y))); i++) e.advance(600);
    expect(circle?.game.id).toBe("knucklebones-greek");
    expect(circle!.players).toHaveLength(3);
    e.state.player.pos = { x: circle!.at.x, y: circle!.at.y + 2, space: "outside" };
    expect(e.gameCircleHere()).toBeDefined();
    expect(e.validate({ type: "gamble", game: "knucklebones-greek", net: 0, minutes: 10 })).toBeUndefined();
  });
});
