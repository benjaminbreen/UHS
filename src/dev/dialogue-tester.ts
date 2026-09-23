import { randomStart } from "../content/geography/random-start";
import { readStartMode } from "../ui/start-mode";
import { eraAt } from "../content/history/dates";
import { Runtime } from "../runtime/session";
import { prepareSettingSession } from "../runtime/preparation";
import { dialogueTurn } from "../narrator/dialogue";
import { distance } from "../core/types";

export type DialogueSample = {
  name: string;
  role: string;
  place: string;
  year: number;
  era: string;
  reply: string;
  error?: string;
};

export type DialogueBatchProgress = {
  completed: number;
  target: number;
  status: string;
};

export async function runDialogueBatch(
  query: string,
  onProgress: (progress: DialogueBatchProgress) => void = () => {},
  signal?: AbortSignal,
) {
  const text = query.trim();
  if (!text) throw Error("Enter something for the NPCs to respond to.");
  const samples: DialogueSample[] = [];
  const places = new Set<string>();
  let attempts = 0;
  while (samples.length < 5 && attempts < 30) {
    signal?.throwIfAborted();
    attempts++;
    const { seed, setting } = randomStart(readStartMode());
    if (places.has(setting.placeId)) continue;
    places.add(setting.placeId);
    const date = { year: setting.year };
    onProgress({
      completed: samples.length,
      target: 5,
      status: `Preparing ${setting.location}, ${setting.year <= 0 ? `${1 - setting.year} BCE` : `${setting.year} CE`}…`,
    });
    let runtime: Runtime | undefined;
    try {
      const engine = await prepareSettingSession(setting, seed, signal, false);
      runtime = new Runtime(engine, { cacheTerrain: false });
      const actor = engine.state.actors
        .filter((candidate) => candidate.kind === "human")
        .sort(
          (a, b) =>
            distance(a.pos, engine.state.player.pos) -
            distance(b.pos, engine.state.player.pos),
        )[0];
      if (!actor) {
        onProgress({
          completed: samples.length,
          target: 5,
          status: `No generated NPC at ${setting.location}; drawing another start…`,
        });
        continue;
      }
      onProgress({
        completed: samples.length,
        target: 5,
        status: `${actor.name} · ${setting.location}`,
      });
      const turn = await dialogueTurn(runtime, actor.id, text, [], signal);
      samples.push({
        name: actor.name,
        role: actor.role,
        place: setting.location,
        year: setting.year,
        era: eraAt(date).label,
        reply: turn.text,
        error: turn.error,
      });
      onProgress({
        completed: samples.length,
        target: 5,
        status: `Got ${samples.length} of 5 replies.`,
      });
    } finally {
      runtime?.dispose();
    }
  }
  if (!samples.length)
    throw Error("Could not generate a start with an NPC. Try again.");
  return samples;
}

declare global {
  interface Window {
    uhsDialogueTester?: {
      run: typeof runDialogueBatch;
    };
  }
}
