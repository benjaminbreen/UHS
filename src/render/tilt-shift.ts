import Phaser from "phaser";
import { defaultLiveGraphicsSettings as defaults } from "./live-graphics";

const fragShader = `
precision mediump float;
uniform sampler2D uMainSampler;
uniform vec2 uResolution;
uniform float uFocus;
uniform float uBand;
uniform float uFalloff;
uniform float uBlur;
uniform float uTopBias;
uniform float uSaturation;
uniform float uContrast;
uniform float uVignette;
varying vec2 outTexCoord;

void main() {
  vec2 uv = outTexCoord;
  // The framebuffer is bottom-up; focus is measured from the top.
  float d = (1.0 - uv.y) - uFocus;
  float t = smoothstep(0.0, max(uFalloff, 0.001), abs(d) - uBand * 0.5);
  float radius = uBlur * t * (d < 0.0 ? 1.0 + uTopBias : 1.0);
  vec3 col = texture2D(uMainSampler, uv).rgb;
  if (radius > 0.0) {
    vec2 offset = vec2(radius) / uResolution;
    vec3 sum = col * 4.0;
    sum += 2.0 * (texture2D(uMainSampler, uv + vec2(offset.x, 0.0)).rgb
                + texture2D(uMainSampler, uv - vec2(offset.x, 0.0)).rgb
                + texture2D(uMainSampler, uv + vec2(0.0, offset.y)).rgb
                + texture2D(uMainSampler, uv - vec2(0.0, offset.y)).rgb);
    sum += texture2D(uMainSampler, uv + offset).rgb + texture2D(uMainSampler, uv - offset).rgb
         + texture2D(uMainSampler, uv + vec2(offset.x, -offset.y)).rgb
         + texture2D(uMainSampler, uv - vec2(offset.x, -offset.y)).rgb;
    col = sum / 16.0;
  }
  float luma = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(luma), col, uSaturation);
  col = (col - 0.5) * uContrast + 0.5;
  vec2 v = uv - 0.5;
  col *= 1.0 - uVignette * dot(v, v) * 2.0;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

export type TiltShiftUniforms = {
  focus: number;
  band: number;
  falloff: number;
  blur: number;
  topBias: number;
  saturation: number;
  contrast: number;
  vignette: number;
};

export class TiltShiftPipeline extends Phaser.Renderer.WebGL.Pipelines
  .PostFXPipeline {
  uniforms: TiltShiftUniforms = {
    focus: defaults.tiltFocus,
    band: defaults.tiltBand,
    falloff: defaults.tiltFalloff,
    blur: defaults.tiltBlur,
    topBias: defaults.tiltTopBias,
    saturation: defaults.tiltSaturation,
    contrast: defaults.tiltContrast,
    vignette: defaults.tiltVignette,
  };

  constructor(game: Phaser.Game) {
    super({ game, name: "TiltShift", fragShader });
  }

  onPreRender() {
    const u = this.uniforms;
    this.set2f("uResolution", this.renderer.width, this.renderer.height);
    this.set1f("uFocus", u.focus);
    this.set1f("uBand", u.band);
    this.set1f("uFalloff", u.falloff);
    this.set1f("uBlur", u.blur);
    this.set1f("uTopBias", u.topBias);
    this.set1f("uSaturation", u.saturation);
    this.set1f("uContrast", u.contrast);
    this.set1f("uVignette", u.vignette);
  }
}
