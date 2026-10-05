import Phaser from "phaser";

// Moonlight takes the green out of turf and leaves firelight alone: a multiply
// wash can darken a lawn but never turn it blue. Overcast greys the colour
// rather than tinting it, which on a warm palette only made mud.
const fragShader = `
precision mediump float;
uniform sampler2D uMainSampler;
uniform float uNight;
uniform float uDull;
varying vec2 outTexCoord;

void main() {
  vec4 c = texture2D(uMainSampler, outTexCoord);
  vec3 col = c.rgb;
  float luma = dot(col, vec3(0.299, 0.587, 0.114));
  float green = smoothstep(0.0, 0.08, col.g - max(col.r, col.b));
  float warm = smoothstep(0.02, 0.18, col.r - col.b);
  float k = uNight * (0.3 + 0.5 * green) * (1.0 - warm);
  col = mix(col, luma * vec3(0.72, 0.9, 1.35), k);
  col = mix(col, vec3(luma), uDull * 0.4 * (1.0 - warm * 0.5)) * (1.0 - 0.08 * uDull);
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), c.a);
}
`;

export class NightGradePipeline extends Phaser.Renderer.WebGL.Pipelines
  .PostFXPipeline {
  night = 0;
  dull = 0;

  constructor(game: Phaser.Game) {
    super({ game, name: "NightGrade", fragShader });
  }

  onPreRender() {
    this.set1f("uNight", this.night);
    this.set1f("uDull", this.dull);
  }
}
