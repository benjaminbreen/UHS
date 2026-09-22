import Phaser from "phaser";

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
  if (radius > 0.5) {
    vec3 sum = vec3(0.0);
    float total = 0.0;
    // Golden-angle spiral: an even disc, which reads as a lens, not a smear.
    for (int i = 0; i < 32; i++) {
      float f = float(i) + 0.5;
      float a = f * 2.39996;
      vec2 o = vec2(cos(a), sin(a)) * sqrt(f / 32.0) * radius / uResolution;
      vec3 c = texture2D(uMainSampler, uv + o).rgb;
      float w = 1.0 + 4.0 * pow(dot(c, vec3(0.299, 0.587, 0.114)), 4.0);
      sum += c * w;
      total += w;
    }
    col = sum / total;
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
    focus: 0.5,
    band: 0.39,
    falloff: 0.42,
    blur: 3,
    topBias: 0.5,
    saturation: 1.15,
    contrast: 1.05,
    vignette: 0.41,
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
