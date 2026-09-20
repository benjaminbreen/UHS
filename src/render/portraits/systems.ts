import type { CharacterAppearance } from "../../core/character";
import {
  drawLayeredPortrait,
  PORTRAIT_HEIGHT,
  PORTRAIT_WIDTH,
} from "./layered";
import { drawThreeQuarterPortrait } from "./three-quarter";
import {
  drawConstructedPortrait,
  type Blink,
  type ConstructedTuning,
  type Expression,
} from "./constructed";

export type PortraitRenderOptions = {
  tuning?: Partial<ConstructedTuning>;
  /** Slot C only; the earlier slots draw one resting face. */
  expression?: Expression;
  intensity?: number;
  blink?: Blink;
  speaking?: boolean;
};

export type PortraitRenderer = (
  context: CanvasRenderingContext2D,
  appearance: CharacterAppearance,
  age?: number,
  options?: PortraitRenderOptions,
) => void;

export type PortraitSystem = {
  id: string;
  label: string;
  description: string;
  render?: PortraitRenderer;
};

export const portraitSystems: readonly PortraitSystem[] = [
  {
    id: "layered-v1",
    label: "A · Layered portrait",
    description:
      "Authored silhouettes and feature geometry at a native 64 × 80 pixels.",
    render: drawLayeredPortrait,
  },
  {
    id: "three-quarter-v1",
    label: "B · Three-quarter bust",
    description:
      "Shaded raster with spline silhouettes; features offset toward the turn.",
    render: drawThreeQuarterPortrait,
  },
  {
    id: "constructed-v1",
    label: "C · Constructed three-quarter",
    description:
      "Head built from a three-quarter construction: profile nose, foreshortened far eye, off-centre chin.",
    render: drawConstructedPortrait,
  },
];

export { PORTRAIT_HEIGHT, PORTRAIT_WIDTH };
