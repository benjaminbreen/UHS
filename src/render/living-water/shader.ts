export const livingFragment = `
precision highp float;
uniform vec2 resolution;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform sampler2D iChannel2;
uniform sampler2D iChannel3;
uniform vec2 worldOrigin;
uniform float waterTime;
uniform vec3 sun;
uniform vec4 bankParams;
uniform vec4 polishParams;
uniform vec4 oceanParams;
uniform vec4 waveParams;
varying vec2 fragCoord;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
vec3 clearTone(float n,float row){return texture2D(iChannel1,vec2((clamp(n,0.,15.)+.5)/32.,(row+.5)/160.)).rgb;}
vec3 swampTone(float n,float row){return texture2D(iChannel1,vec2((clamp(n,0.,15.)+16.5)/32.,(row+.5)/160.)).rgb;}
float murkMix=0.;
vec3 tone(float n,float row){return mix(clearTone(n,row),swampTone(n,row),murkMix);}
void main(){
 vec2 local=floor(vec2(fragCoord.x,resolution.y-fragCoord.y));
 vec4 m=texture2D(iChannel0,(local+.5)/resolution);
 float row=floor(m.g*255.+.5)-1.;if(row<0.)discard;
 float raw=floor(m.r*255.+.5),kind=floor(mod(row,40.)/8.);
 vec2 p=worldOrigin+local;
 // Inland water packs six bits of flow angle and two of murk into blue;
 // the sea keeps the whole byte for its sub-step depth fraction.
 float blue=floor(m.b*255.+.5);
 bool inland=kind<.5||kind>1.5;
 murkMix=inland?mod(blue,4.)/3.:0.;
 if(raw<128.){
   float d=(128.-raw)/127.;
   float extent=kind<.5?1.5:kind<1.5?8.:kind>3.5?.45:1.;
   float steps=max(1.,bankParams.z-1.);
   float band=floor(clamp(d/(bankParams.x/extent),0.,1.)*steps)/steps;
   vec3 dry=tone(9.,row),wet=tone(10.,row),contact=tone(11.,row);
   vec3 bank=band<.35?mix(contact,wet,band/.35):mix(wet,dry,(band-.35)/.65);
   bank=mix(dry,bank,bankParams.y);
   if(d>.94)bank=mix(bank,tone(12.,row),bankParams.w);
   if(polishParams.z>.5){
     float clump=noise(floor(p/2.)/5.)*.24+noise(p/23.)*.15;
     float edge=clamp((d-(1.-polishParams.x*.6)+clump-.15)/max(.1,polishParams.x*.6),0.,1.);
     edge=floor(edge*5.)/5.;
     // Past the sand the ground raster's own turf shows, not a flat green:
     // a damp margin, a dark undercut, then nothing.
     if(edge>.7)discard;
     if(edge>.5)bank=tone(13.,row)*.5;
     else if(edge>.1)bank=mix(dry,wet,.55+edge*.5);
     if(noise(floor(p/2.)/2.)>.78&&d>.24&&d<.72)bank=mix(bank,wet,.18);
   }
   vec4 bankArt=texture2D(iChannel2,(local+.5)/resolution);
   bank=mix(bank,bankArt.rgb,bankArt.a);
   gl_FragColor=vec4(bank,1.);return;
 }
 float depth=(raw-128.)/16.;
 float angle=(inland?floor(blue/4.)/64.:m.b)*6.2831853;vec2 flow=vec2(cos(angle),sin(angle));
 bool ocean=kind>.5&&kind<1.5;
 if(ocean&&raw>192.)depth=4.+(raw-192.)/4.;
 if(ocean)depth+=m.b*(raw>192.?.25:.0625);
 float t=waterTime*.5;
 vec4 bends=texture2D(iChannel3,(local+.5)/resolution);
 float encoded=floor(bends.b*255.+.5),solid=step(128.,encoded),delay=mod(encoded,128.)/8.;
 vec2 displacement=(bends.rg*255.-128.)/4.;
 vec2 q=p+displacement-flow*t*(kind<.5||kind>3.5?13.:kind>2.5?1.5:kind>1.5?3.:8.);
 if(ocean)q=p+displacement+vec2(sin(t*.55+p.y/100.)*2.,cos(t*.43+p.x/110.)*2.);
 float warp=sin(q.y/19.+t*.35)*5.+sin(q.x/33.-q.y/27.)*5.;
 float a=sin((q.x+warp)/12.+sin(q.y/16.)*1.3);
 float b=sin(q.y/8.+sin(q.x/23.+t*.2)*1.7);
 float wave=sin((dot(p,flow)-delay)/17.-t*1.6+sin(p.x/32.)*.7);
 // Increasing time moves constant-phase crests toward smaller shore distances.
 if(ocean)wave=sin(depth*2.2+t*1.6-delay/17.+noise(p/64.)*.25);
 float cluster=noise((q+vec2(warp*.5,0.))/vec2(32.,16.))*.7+noise(q/vec2(8.,4.))*.3;
 float detail=noise((q+vec2(13.,57.))/vec2(16.,8.));
 float bed=noise(p/49.)*1.4+noise(p/19.)*.5;
 float depthTone=clamp(depth*(kind>.5&&kind<1.5?.58:.95)+bed-.8,0.,6.8);
 depthTone+=polishParams.z*.95;
 float z=depthTone*.82+(a+b)*(ocean?.08:.18)+wave*(ocean?.2:.35)+(detail-.5)*(ocean?.18:.4);
 float net=abs(sin((q.x+warp+(cluster-.5)*12.)/7.)+sin(q.y/7.+sin(q.x/16.)+(detail-.5)*2.));
 float causticRange=ocean?1.-smoothstep(8.,12.,depth):1.-step(6.,depth);
 float caustic=(net<.1?.5:net<.2?.2:0.)*waveParams.w*min(1.,depth*2.)*causticRange;
 float gradSteps=ocean?8.:2.;
 float k=clamp(floor(z+1.),0.,8.),f=floor(fract(max(0.,z+1.))*gradSteps)/gradSteps;
 vec3 color=mix(tone(k,row),tone(min(k+1.,8.),row),f);
 color=mix(color,tone(0.,row),caustic*mix(1.,.08,murkMix)*(1.+polishParams.z*.8));
 float fishGrid=polishParams.z>.5?40.:80.;
 vec2 fishCell=floor(p/fishGrid),fishLocal=mod(p,fishGrid);
 float fishSeed=hash(fishCell);
 vec2 fish=vec2(fishGrid*.5+sin(t*.23+fishSeed*40.)*fishGrid*.28,fishGrid*.5+cos(t*.17+fishSeed*50.)*fishGrid*.25);
 vec2 fp=floor(fishLocal-fish);
 if(mod(row,64.)<32.&&depth>.8&&depth<5.&&solid<.5&&fishSeed>.55){
   if((abs(fp.x)<3.&&abs(fp.y)<1.)||(fp.x<-2.&&fp.x>-5.&&abs(fp.y-sin(t*5.))<2.))
     color=mix(color,vec3(.1,.3,.35),.45*exp(-depth*.18));
 }
 if(ocean&&wave>1.-(.065+waveParams.y*.14)&&detail>waveParams.z*.4&&solid<.5&&depth>.3&&depth<13.){
   float crest=(.55+waveParams.x*.6)*(1.-smoothstep(7.,13.,depth));
   color=mix(color,mix(tone(0.,row),vec3(1.),.6),crest);
 }
 float wash=fract(t*(kind>2.5&&kind<3.5?.15:.35)+sin((p.x+p.y)/27.)*.12);
 float target=(1.-wash)*(kind>.5&&kind<1.5?.6:.28);
 if(solid<.5&&abs(depth-target)<.06&&noise(p/vec2(11.,9.))>.32)color=mix(color,vec3(.91,.98,.87),sin(wash*3.14159)*.4);
 if(polishParams.z>.5&&solid<.5){
   float lap=sin(t*1.7+noise(p/19.)*5.);
   float rim=.08+(lap+1.)*.065;
   float broken=noise((p+displacement)/7.);
   if(depth<rim+.07&&depth>rim-.06&&broken>.2)color=mix(color,vec3(.96,1.,.92),polishParams.y*(.75+.2*lap));
   if(depth>.15&&depth<.65&&abs(depth-rim-.23)<.045&&broken>.48)color=mix(color,vec3(.92,1.,.94),polishParams.y*.45);
   vec4 above=texture2D(iChannel2,(local+vec2(.5,-.5))/resolution);
   vec4 here=texture2D(iChannel2,(local+.5)/resolution);
   if(delay>.5&&above.a>.6&&here.a<.4&&sin(t*2.+p.x*.6)>.0)color=mix(color,vec3(.95,1.,.94),polishParams.y*.8);
 }
 // Sparse, world-anchored reflective facets follow the same daylight phase as shadows.
 vec2 glitterCell=floor(p/vec2(13.,9.));vec2 g=mod(p,vec2(13.,9.));
 float pulse=sin(t*2.3+hash(glitterCell)*45.);
 if(solid<.5&&hash(glitterCell)>.8&&g.y<1.&&g.x<3.&&pulse>.93) color=mix(color,sun,(pulse-.93)/.07*.8);
 if(ocean){
   float offshore=smoothstep(5.,13.,depth)*oceanParams.x;
   vec2 drift=vec2(sin(t*.21+p.y/160.)*12.,cos(t*.17+p.x/190.)*10.);
   float slow=noise((p+drift+vec2(t*3.,t*1.7))/90.)*.6+noise((p-drift+vec2(-t*2.,t*2.4))/43.)*.4;
   float deepMix=floor((.5+(slow-.5)*.2)*48.)/48.;
   vec3 deep=mix(tone(5.,row),tone(6.,row),deepMix);
   color=mix(color,deep,offshore);
 }
 vec4 art=texture2D(iChannel2,(local+.5)/resolution);
 color=mix(color,art.rgb,art.a);
 gl_FragColor=vec4(color,1.);
}`;
