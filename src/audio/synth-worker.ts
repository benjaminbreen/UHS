import { synthesize } from "./synth";

self.onmessage = ({ data: { id, voice, midi, cents, bend, rate } }) => {
  const data = synthesize(voice, midi, cents, bend, rate);
  (self as unknown as Worker).postMessage({ id, data }, [data.buffer]);
};
