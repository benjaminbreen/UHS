import type { LightingId } from "../render/lighting";
import type { Weather } from "../core/weather";

const vert = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;

// Painted in linear light, tone-mapped with ACES at the end.
const frag = `
precision highp float;
uniform vec2 R;
uniform float T, H, COV, DEN, DARK, RAIN, SNOW, MIST;
uniform vec2 S, W;

float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}
const mat2 M=mat2(1.6,1.2,-1.2,1.6);
float fbm(vec2 p,int o){float s=0.,a=.5;for(int i=0;i<6;i++){if(i>=o)break;s+=a*noise(p);p=M*p;a*=.5;}return s;}

float A;
// Screen uv to a cloud deck seen in perspective: overhead at the top, horizon at the bottom.
vec2 deck(vec2 uv){float z=1./(uv.y+.28);return vec2((uv.x-.5)*A*z*.8,z)+W*T*.018+vec2(T*.004,0.);}
float cloud(vec2 uv,int o){
  vec2 q=deck(uv);
  vec2 w=vec2(fbm(q*.7+vec2(0.,T*.006),3),fbm(q*.7+vec2(5.2,1.3-T*.005),3));
  float n=fbm(q*1.1+w*.9,o);
  float t=mix(.72,.02,COV);
  float c=max(n-t,0.)/.28;
  return c*c/(1.+c)*DEN;
}

vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}

void main(){
  vec2 uv=gl_FragCoord.xy/R;
  A=R.x/R.y;
  vec2 p=vec2(uv.x*A,uv.y), sp=vec2(S.x*A,S.y);
  float d=length(p-sp);
  float day=smoothstep(-.18,.12,H);
  float low=exp(-abs(H-.02)*7.)*smoothstep(-.35,-.05,H);
  bool moon=H<-.12;

  vec3 zen=mix(vec3(.002,.004,.014),vec3(.022,.11,.42),day);
  zen=mix(zen,vec3(.05,.05,.16),low*.6);
  vec3 hor=mix(vec3(.006,.012,.04),vec3(.28,.48,.85),day);
  hor=mix(hor,vec3(1.,.36,.12),low*.9);
  float g=pow(1.-uv.y,2.4);
  vec3 sky=mix(zen,hor,g);
  sky+=vec3(.6,.25,.35)*low*.25*exp(-abs(uv.y-.35)*6.);

  vec3 sunCol=moon?vec3(.3,.36,.5)*.35:mix(vec3(1.,.42,.14),vec3(1.,.94,.84),smoothstep(0.,.5,H))*mix(.6,1.,day);
  sky=mix(sky,vec3(dot(sky,vec3(.3,.5,.2)))*vec3(.9,.95,1.05),DARK*.8);

  if(moon){
    float st=0.;
    vec2 c=floor(p*70.);vec2 f=fract(p*70.)-.5;float h=hash(c);
    if(h>.965){float tw=.6+.4*sin(T*(2.+h*5.)+h*60.);st=tw*smoothstep(.35,0.,length(f-(vec2(hash(c+3.),hash(c+7.))-.5)*.6))*(h-.965)*28.;}
    float band=fbm(vec2(p.x*2.+p.y*1.4,p.y*3.-p.x),5);
    sky+=vec3(.06,.06,.09)*smoothstep(.45,.75,band)*exp(-pow((p.y-.55+p.x*.3)*3.,2.));
    sky+=vec3(1.,.95,.85)*st*.9;
  }

  float sunOcc=1.-exp(-cloud(S,3)*2.4);
  vec3 glow;
  float disc;
  vec3 body;
  if(moon){
    float r=.05;disc=1.-smoothstep(r*.94,r,d);
    vec2 l=(p-sp)/r;vec3 n=vec3(l,sqrt(max(0.,1.-dot(l,l))));
    float lit=smoothstep(-.08,.12,dot(n,normalize(vec3(.75,.25,.45))));
    float mar=fbm(l*3.+7.,4);
    body=vec3(.95,.92,.84)*(.45+.6*smoothstep(.3,.7,mar))*lit*1.6+vec3(.015,.02,.03);
    glow=vec3(.25,.3,.45)*(exp(-d*14.)*.25+exp(-d*4.)*.05);
  } else {
    float r=.058;disc=1.-smoothstep(r*.93,r,d);
    float limb=sqrt(max(0.,1.-pow(d/r,2.)));
    body=sunCol*mix(.55,1.,pow(limb,.45))*mix(3.5,14.,smoothstep(.0,.4,H));
    glow=sunCol*(exp(-d*22.)*1.6+exp(-d*5.5)*.35+exp(-d*1.6)*.05)*day;
    glow*=1.+low*.8;
  }
  glow*=mix(1.,.3,sunOcc);
  vec3 col=sky+glow;

  float dens=cloud(uv,6);
  float alpha=1.-exp(-dens*2.6);
  vec2 dir=normalize(sp-p+1e-4)*vec2(1./A,1.);
  float ls=0.;
  for(int i=1;i<6;i++)ls+=cloud(uv+dir*.028*float(i),3);
  float trans=exp(-ls*.9);
  float powder=1.-exp(-dens*5.);
  float phase=.55+2.2*exp(-d*3.2);
  vec3 amb=mix(hor,zen,.45)*.9+vec3(.01);
  amb=mix(amb,vec3(.12,.13,.15)*mix(.4,1.,day),DARK*.5);
  vec3 cl=sunCol*trans*mix(1.,powder,.4)*phase*(moon?1.:1.5)+amb*(.5+.5*uv.y);
  cl*=mix(1.,.3,DARK*smoothstep(.2,1.6,dens))*(1.-DARK*.45);
  cl+=sunCol*alpha*(1.-alpha)*exp(-d*3.5)*3.*(1.-DARK);
  cl=mix(cl,vec3(dot(cl,vec3(.3,.5,.2))),DARK*.5);
  float fl=step(.94,hash(vec2(floor(T*1.7),3.)))*exp(-fract(T*1.7)*9.)*RAIN;
  cl+=vec3(.7,.75,1.)*fl*alpha*2.5*exp(-length(p-vec2(hash(vec2(floor(T*1.7),1.))*A,.7))*2.5);
  cl=mix(cl,hor*.9+amb*.2,smoothstep(.35,.0,uv.y)*.55);
  col=mix(col,cl,alpha)+body*disc*exp(-dens*5.)*(1.-DARK*.8);

  if(!moon){
    float rays=0.;
    for(int i=0;i<12;i++){
      vec2 s=mix(uv,S,float(i)/12.);
      rays+=exp(-cloud(s,2)*3.);
    }
    rays/=12.;
    col+=sunCol*rays*(1.-alpha*.7)*exp(-d*2.2)*.35*smoothstep(.15,.5,COV)*(1.-DARK)*mix(.5,1.4,low+.3);
  }

  vec3 veil=mix(vec3(.75,.78,.85),sunCol,.3)*mix(.08,.9,day);
  if(MIST>0.){
    float m=fbm(vec2(p.x*1.3+T*.02,uv.y*5.-T*.01),5);
    float ma=smoothstep(.75,.05,uv.y)*smoothstep(.38,.62,m)*MIST;
    col=mix(col,veil*1.1+sunCol*exp(-d*3.)*.3,ma*.85);
    col=mix(col,veil,MIST*.25);
  }

  if(RAIN>0.){
    float rn=0.;
    for(int i=0;i<3;i++){
      float fi=float(i),s=1.+fi*.8;
      float an=.18+W.x*.25;
      vec2 r=mat2(cos(an),sin(an),-sin(an),cos(an))*p;
      r*=vec2(55.*s,2.2*s);
      r.y+=T*(9.+fi*4.);
      float cx=floor(r.x);
      r.y+=hash(vec2(cx,fi))*20.;
      float fy=fract(r.y),fx=fract(r.x);
      float on=step(.55,hash(vec2(cx,floor(r.y))));
      rn+=on*(1.-smoothstep(0.,.14,abs(fx-.5)))*smoothstep(.0,.7,fy)*(1.-smoothstep(.7,.78,fy))/s;
    }
    col+=vec3(.55,.62,.75)*mix(.25,1.,day)*rn*.35*RAIN;
    col=mix(col,veil*.8,smoothstep(.6,0.,uv.y)*.35*RAIN);
  }
  if(SNOW>0.){
    float sn=0.;
    for(int i=0;i<4;i++){
      float fi=float(i),s=12.+fi*7.;
      vec2 q=p*s;
      q.y+=T*(1.1+fi*.35);
      q.x+=W.x*T*.8+sin(T*.7+q.y*.4+fi)*.4;
      vec2 c=floor(q),f=fract(q)-.5;
      vec2 o=vec2(hash(c+fi),hash(c+fi+9.))-.5;
      float rr=mix(.09,.04,fi/3.);
      sn+=step(.6,hash(c+17.))*(1.-smoothstep(rr*.4,rr,length(f-o*.6)))*mix(1.,.5,fi/3.);
    }
    col=mix(col,vec3(.9,.93,1.)*mix(.12,1.,day),clamp(sn,0.,1.)*.9*SNOW);
  }

  col=aces(col*.85);
  col=pow(col,vec3(1./2.2));
  col+=(hash(gl_FragCoord.xy+fract(T))-.5)/255.;
  gl_FragColor=vec4(col,1.);
}`;

const sunHeight: Record<LightingId, number> = {
  "early-morning": 0.04,
  morning: 0.32,
  midday: 0.85,
  afternoon: 0.42,
  dusk: -0.03,
  night: -0.5,
};

const looks = {
  clear: [0.12, 0.45, 0, 0, 0, 0],
  "light-clouds": [0.62, 1.0, 0, 0, 0, 0],
  overcast: [0.95, 1.6, 0.6, 0, 0, 0],
  rain: [1.0, 2.0, 0.9, 1, 0, 0],
  snow: [0.95, 1.3, 0.25, 0, 1, 0],
  mist: [0.28, 0.5, 0.1, 0, 0, 1],
} as const;

export type SkyParams = { weather: Weather; lighting: LightingId };

/** A live shader sky on the canvas, or null where WebGL is unavailable. */
export function mountSky(canvas: HTMLCanvasElement, initial: SkyParams) {
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
  if (!gl) return null;
  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
      throw new Error(gl.getShaderInfoLog(s) ?? "sky shader");
    return s;
  };
  const prog = gl.createProgram()!;
  try {
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, vert));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, frag));
  } catch (e) {
    console.warn(e);
    return null;
  }
  gl.linkProgram(prog);
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const u = (n: string) => gl.getUniformLocation(prog, n);

  let params = initial;
  const set = () => {
    const { weather, lighting } = params;
    const h = weather.night ? sunHeight.night : sunHeight[lighting];
    const [cov, den, dark, rain, snow, mist] = looks[weather.condition];
    const moon = h < -0.12;
    gl.uniform1f(u("H"), h);
    gl.uniform2f(u("S"), 0.5, moon ? 0.66 : 0.14 + 0.6 * Math.sqrt(Math.max(0, h)));
    gl.uniform1f(u("COV"), cov);
    gl.uniform1f(u("DEN"), den);
    gl.uniform1f(u("DARK"), dark);
    gl.uniform1f(u("RAIN"), rain);
    gl.uniform1f(u("SNOW"), snow);
    gl.uniform1f(u("MIST"), mist);
    const { angle, strength } = weather.wind;
    gl.uniform2f(u("W"), Math.cos(angle) * (0.3 + strength), Math.sin(angle) * strength * 0.3);
  };
  set();

  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const start = performance.now() - Math.random() * 60000;
  let visible = true;
  let raf = 0;
  let last = 0;
  const draw = (now: number) => {
    // Clouds are soft; half-resolution keeps the fill cost small.
    const scale = Math.min(devicePixelRatio, 2) * 0.55;
    const w = Math.max(1, Math.round(canvas.clientWidth * scale));
    const hgt = Math.max(1, Math.round(canvas.clientHeight * scale));
    if (canvas.width !== w || canvas.height !== hgt) {
      canvas.width = w;
      canvas.height = hgt;
      gl.viewport(0, 0, w, hgt);
    }
    gl.uniform2f(u("R"), w, hgt);
    gl.uniform1f(u("T"), (now - start) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const loop = (now: number) => {
    raf = requestAnimationFrame(loop);
    if (!visible || document.hidden || now - last < 33) return;
    last = now;
    draw(now);
  };
  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
  io.observe(canvas);
  requestAnimationFrame(draw);
  if (!still) raf = requestAnimationFrame(loop);

  return {
    update(next: SkyParams) {
      params = next;
      set();
      requestAnimationFrame(draw);
    },
    dispose() {
      cancelAnimationFrame(raf);
      io.disconnect();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
