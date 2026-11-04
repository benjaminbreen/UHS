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
uniform float uFloor;
uniform float uSnow;
uniform vec3 uWash;
varying vec2 outTexCoord;

void main() {
  vec4 c = texture2D(uMainSampler, outTexCoord);
  vec3 col = c.rgb;
  // Lying snow stays cool by day, as Haunted Chocolatier keeps it: divide
  // the hour's multiply wash back out, and where that leaves snow's own
  // blue-white, keep only a quarter of the wash and skip the warm lights.
  vec3 base = clamp(col / max(uWash, vec3(0.05)), 0.0, 1.0);
  float sat = max(base.r, max(base.g, base.b)) - min(base.r, min(base.g, base.b));
  float snow = uSnow * (1.0 - uNight)
    * smoothstep(0.66, 0.76, dot(base, vec3(0.299, 0.587, 0.114)))
    * (1.0 - smoothstep(0.1, 0.16, sat)) * step(base.r, base.b + 0.02);
  col = mix(col, base * mix(vec3(1.0), uWash, 0.25), snow);
  float luma = dot(col, vec3(0.299, 0.587, 0.114));
  // Split tone by brightness, then an S-curve: the darks deepen and cool, the
  // lights warm, and the picture gains depth without a blanket tint.
  col *= mix(vec3(1.0), uShadow, 1.0 - smoothstep(0.0, 0.5, luma));
  col *= mix(vec3(1.0), uLight, smoothstep(0.45, 1.0, luma) * (1.0 - snow));
  col = clamp(col, 0.0, 1.0);
  col = mix(col, col * col * (3.0 - 2.0 * col), uCurve);
  luma = dot(col, vec3(0.299, 0.587, 0.114));
  float green = smoothstep(0.0, 0.08, col.g - max(col.r, col.b));
  float warm = smoothstep(0.02, 0.18, col.r - col.b);
  float k = uNight * (0.3 + 0.5 * green) * (1.0 - warm);
  col = mix(col, luma * vec3(0.72, 0.9, 1.35), k);
  col = mix(col, vec3(luma), uDull * 0.4 * (1.0 - warm * 0.5)) * (1.0 - 0.08 * uDull);
  // Moonlight floor: the darks lift toward a dim blue-grey rather than black,
  // so ground and figures stay readable through the small hours.
  vec3 floorCol = vec3(0.07, 0.085, 0.13) * uNight * uFloor;
  col = floorCol + col * (1.0 - floorCol);
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
  floor = 1;
  snow = 0;
  wash = [1, 1, 1];

  constructor(game: Phaser.Game) {
    super({ game, name: "NightGrade", fragShader });
  }

  onPreRender() {
    this.set1f("uNight", this.night);
    this.set1f("uDull", this.dull);
    this.set3f("uShadow", this.shadow[0], this.shadow[1], this.shadow[2]);
    this.set3f("uLight", this.light[0], this.light[1], this.light[2]);
    this.set1f("uCurve", this.curve);
    this.set1f("uFloor", this.floor);
    this.set1f("uSnow", this.snow);
    this.set3f("uWash", this.wash[0], this.wash[1], this.wash[2]);
  }
}
