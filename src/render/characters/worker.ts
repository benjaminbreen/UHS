import type { RestingExpression } from "../../core/persona";
import type { CharacterAppearance } from "../../core/character";
import { drawCharacterG } from "./doll/draw";
import type { CharacterPose } from "./poses";
import type { CarriedArt } from "./props";
import { setSpriteLight, type SpriteLight } from "./v2/pixels";

export type CharacterFrameRequest = {
  signature: string;
  appearance: CharacterAppearance;
  direction: number;
  facing?: number;
  expression: RestingExpression;
  pose: CharacterPose;
  frame: number;
  turn?: number;
  condition?: number;
  light: SpriteLight;
  prop?: Omit<CarriedArt, "image"> & { pixels: Uint8ClampedArray };
};

export type CharacterFrameResponse = {
  signature: string;
  pixels?: Uint8ClampedArray;
  error?: string;
};

const canvas = new OffscreenCanvas(80, 80);
const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
const propCanvas = new OffscreenCanvas(1, 1);

self.onmessage = (event: MessageEvent<CharacterFrameRequest>) => {
  const request = event.data;
  try {
    let prop: CarriedArt | undefined;
    if (request.prop) {
      const { pixels, ...art } = request.prop;
      propCanvas.width = art.width;
      propCanvas.height = art.height;
      propCanvas.getContext("2d")!.putImageData(
        new ImageData(new Uint8ClampedArray(pixels), art.width, art.height), 0, 0,
      );
      prop = { ...art, image: propCanvas as unknown as HTMLCanvasElement };
    }
    setSpriteLight(request.light);
    const context = ctx as unknown as CanvasRenderingContext2D;
    drawCharacterG(
      context, request.appearance, request.direction, request.pose,
      request.frame, prop, request.facing, request.expression, request.turn, request.condition,
    );
    const pixels = ctx.getImageData(0, 0, 80, 80).data;
    self.postMessage({ signature: request.signature, pixels }, {
      transfer: [pixels.buffer],
    });
  } catch (error) {
    self.postMessage({ signature: request.signature, error: String(error) });
  } finally {
    setSpriteLight(undefined);
  }
};
