import Phaser from "phaser";

// The scene grade: a split tone and S-curve by the hour, then moonlight, which takes the green out of turf and leaves firelight alone: a multiply
// wash can darken a lawn but never turn it blue. Overcast greys the colour
// rather than tinting it, which on a warm palette only made mud.
const fragShader = `
precision mediump float;
uniform sampler2D uMainSampler;
uniform float uNight;
uniform float uDull;
uniform vec3 uShadow;
uniform vec3 uLight;
uniform float uCurve;
varying vec2 outTexCoord;

void main() {
  vec4 c = texture2D(uMainSampler, outTexCoord);
  vec3 col = c.rgb;
  float luma = dot(col, vec3(0.299, 0.587, 0.114));
  // Split tone by brightness, then an S-curve: the darks deepen and cool, the
  // lights warm, and the picture gains depth without a blanket tint.
  col *= mix(vec3(1.0), uShadow, 1.0 - smoothstep(0.0, 0.5, luma));
  col *= mix(vec3(1.0), uLight, smoothstep(0.45, 1.0, luma));
  col = clamp(col, 0.0, 1.0);
  col = mix(col, col * col * (3.0 - 2.0 * col), uCurve);
  luma = dot(col, vec3(0.299, 0.587, 0.114));
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
  shadow = [1, 1, 1];
  light = [1, 1, 1];
  curve = 0;

  constructor(game: Phaser.Game) {
    super({ game, name: "NightGrade", fragShader });
  }

  onPreRender() {
    this.set1f("uNight", this.night);
    this.set1f("uDull", this.dull);
    this.set3f("uShadow", this.shadow[0], this.shadow[1], this.shadow[2]);
    this.set3f("uLight", this.light[0], this.light[1], this.light[2]);
    this.set1f("uCurve", this.curve);
  }
}
