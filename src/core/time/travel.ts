import { Engine } from "../engine";
import type { Snapshot } from "../types";
import {
  createLineage,
  personAt,
  relationship,
  type Relative,
} from "./lineage";
import { settingAt, timeBounds, timeContext } from "./setting";
import { temporalWorld } from "./world";
import { isRuin } from "./structure";
export type Arrival = {
  year: number;
  fromYear: number;
  person: Relative;
  previous: Relative;
  relationship: string;
  text: string;
  ruins: number;
  rebuilt: number;
  sources: { title: string; url: string }[];
};
export class TimeTravel {
  readonly lineage;
  readonly checkpoints = new Map<
    number,
    { engine: Engine; snapshot: Snapshot }
  >();
  currentYear: number;
  arrival?: Arrival;
  constructor(public origin: Engine) {
    const setting = this.origin.world.pack.setting;
    if (!setting) throw Error("Time travel requires a geographic world.");
    this.currentYear = setting.year;
    this.lineage = createLineage(
      this.origin.state.manifest.seed,
      setting,
      this.origin.state.player,
    );
  }
  rebase(engine: Engine) {
    this.origin = engine;
    this.currentYear = engine.world.pack.setting!.year;
    this.checkpoints.clear();
    this.arrival = undefined;
  }
  /** Builds the world at `year` from `source`, the engine the player is in now. */
  prepare(year: number, source: Engine) {
    const { min, max } = timeBounds(this.currentYear);
    if (
      !Number.isInteger(year) ||
      year < min ||
      year > max ||
      year === this.currentYear
    )
      throw Error("Choose a different year within the timeline.");
    this.checkpoints.set(this.currentYear, {
      engine: source,
      snapshot: source.snapshot(),
    });
    const person = personAt(this.lineage, year),
      previous = personAt(this.lineage, this.currentYear);
    const existing = this.checkpoints.get(year);
    let engine: Engine;
    const setting = settingAt(this.origin.world.pack.setting!, year);
    let ruins = 0,
      rebuilt = 0;
    if (existing)
      engine = new Engine(
        existing.engine.world,
        existing.engine.items,
        existing.snapshot,
      );
    else {
      const result = temporalWorld(
        this.origin.world,
        this.lineage.seed,
        this.origin.world.pack.setting!,
        year,
      );
      ruins = result.phases.filter((p) => isRuin(p.place)).length;
      rebuilt = result.phases.filter((p) => p.incarnation !== 0).length;
      engine = new Engine(result.world, this.origin.items);
      engine.initialize(this.lineage.seed);
      engine.state.manifest.content = 2;
      engine.state.player = {
        ...engine.state.player,
        ...structuredClone(person.character),
        age: year - person.born,
        pos: { ...source.state.player.pos, space: "outside" },
        memories: [],
      };
      if (
        engine.blocked(
          engine.state.player.pos.x,
          engine.state.player.pos.y,
          "outside",
        )
      ) {
        const from = engine.state.player.pos;
        let found = false;
        for (let radius = 1; radius <= 64 && !found; radius++)
          for (let dx = -radius; dx <= radius && !found; dx++)
            for (const dy of [-radius, radius]) {
              if (!engine.blocked(from.x + dx, from.y + dy, "outside")) {
                engine.state.player.pos = {
                  x: from.x + dx,
                  y: from.y + dy,
                  space: "outside",
                };
                found = true;
                break;
              }
            }
        if (!found) engine.state.player.pos = { ...result.world.spawn };
      }
      engine.state.player.home = { ...engine.state.player.pos };
      engine.state.player.work = { ...engine.state.player.pos };
    }
    ruins = engine.world.places.filter(isRuin).length;
    const context = timeContext(setting);
    const arrival: Arrival = {
      year,
      fromYear: this.currentYear,
      person,
      previous,
      relationship: relationship(previous, person),
      ruins,
      rebuilt,
      text: `${context.text} ${ruins ? `${ruins} building sites now hold exposed remains; others are still inhabited or have been rebuilt.` : "The settlement's building sites carry successive generations of occupation."}`,
      sources: context.sources,
    };
    return { engine, arrival, source };
  }
  commit(prepared: ReturnType<TimeTravel["prepare"]>) {
    this.currentYear = prepared.arrival.year;
    this.arrival = prepared.arrival;
  }
}
